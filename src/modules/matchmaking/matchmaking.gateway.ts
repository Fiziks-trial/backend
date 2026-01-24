import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MatchmakingService } from './matchmaking.service';
import { UsersService } from '../users/users.service';
import { SubjectsService } from '../subjects/subjects.service';
import { JoinQueueDto } from './dto';
import {
  QUEUE_EVENTS,
  QueuedPlayer,
  QueueErrorCode,
  MatchFoundPayload,
} from './types';
import { WsExceptionFilter } from './filters/ws-exception.filter';

interface AuthenticatedSocket extends Socket {
  data: {
    userId: string;
    email: string;
  };
}

@WebSocketGateway({
  namespace: '/matchmaking',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
@UseFilters(new WsExceptionFilter())
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class MatchmakingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MatchmakingGateway.name);

  constructor(
    private readonly matchmakingService: MatchmakingService,
    private readonly usersService: UsersService,
    private readonly subjectsService: SubjectsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        this.emitError(
          client,
          QueueErrorCode.AUTHENTICATION_REQUIRED,
          'No token provided',
        );
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      client.data.userId = payload.sub;
      client.data.email = payload.email;

      this.logger.log(`Client connected: ${client.id} (user: ${payload.sub})`);
    } catch {
      this.emitError(
        client,
        QueueErrorCode.AUTHENTICATION_REQUIRED,
        'Invalid token',
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const player = this.matchmakingService.leaveQueueBySocketId(client.id);
    if (player) {
      this.logger.log(
        `Client disconnected and removed from queue: ${client.id}`,
      );
    }
  }

  @SubscribeMessage(QUEUE_EVENTS.JOIN)
  async handleJoinQueue(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: JoinQueueDto,
  ) {
    const userId = client.data.userId;

    // Validate subject exists
    let subject: { id: string; name: string };
    try {
      subject = await this.subjectsService.findById(data.subjectId);
    } catch {
      return this.emitError(
        client,
        QueueErrorCode.INVALID_SUBJECT,
        'Subject not found',
      );
    }

    // Get user's ELO for this subject
    const userStats = await this.usersService.getUserSubjectStats(userId);
    const subjectStats = userStats.find((s) => s.subjectId === data.subjectId);
    const elo = subjectStats?.elo ?? 1200;

    // Get username
    const user = await this.usersService.findUserById(userId);

    const player: QueuedPlayer = {
      userId,
      socketId: client.id,
      subjectId: data.subjectId,
      elo,
      joinedAt: Date.now(),
      username: user.username || 'Anonymous',
    };

    const result = this.matchmakingService.joinQueue(player);

    if (!result.success) {
      return this.emitError(
        client,
        QueueErrorCode.ALREADY_IN_QUEUE,
        'You are already in queue',
      );
    }

    // Send confirmation
    client.emit(
      QUEUE_EVENTS.JOINED,
      this.matchmakingService.getQueueStatus(userId),
    );

    // Try to find a match immediately
    await this.tryMatch(player, subject);
  }

  @SubscribeMessage(QUEUE_EVENTS.LEAVE)
  handleLeaveQueue(@ConnectedSocket() client: AuthenticatedSocket) {
    const userId = client.data.userId;
    const result = this.matchmakingService.leaveQueue(userId);

    if (!result.success) {
      return this.emitError(
        client,
        QueueErrorCode.NOT_IN_QUEUE,
        'You are not in queue',
      );
    }

    client.emit(QUEUE_EVENTS.LEFT);
  }

  @SubscribeMessage(QUEUE_EVENTS.STATUS)
  handleStatus(@ConnectedSocket() client: AuthenticatedSocket) {
    const userId = client.data.userId;
    const status = this.matchmakingService.getQueueStatus(userId);
    client.emit(QUEUE_EVENTS.STATUS_UPDATE, status);
  }

  private async tryMatch(
    player: QueuedPlayer,
    subject: { id: string; name: string },
  ) {
    const opponent = this.matchmakingService.findMatch(player.userId);

    if (!opponent) return;

    // Remove both from queue
    this.matchmakingService.removeBothPlayers(player.userId, opponent.userId);

    // TODO: Create match in database via MatchesService
    const matchId = crypto.randomUUID();

    // Notify both players
    const player1Payload: MatchFoundPayload = {
      matchId,
      opponent: {
        id: opponent.userId,
        username: opponent.username,
        elo: opponent.elo,
      },
      subject: { id: subject.id, name: subject.name },
    };

    const player2Payload: MatchFoundPayload = {
      matchId,
      opponent: {
        id: player.userId,
        username: player.username,
        elo: player.elo,
      },
      subject: { id: subject.id, name: subject.name },
    };

    this.server
      .to(player.socketId)
      .emit(QUEUE_EVENTS.MATCH_FOUND, player1Payload);
    this.server
      .to(opponent.socketId)
      .emit(QUEUE_EVENTS.MATCH_FOUND, player2Payload);

    this.logger.log(
      `Match found: ${player.username} (${player.elo}) vs ${opponent.username} (${opponent.elo})`,
    );
  }

  private emitError(client: Socket, code: QueueErrorCode, message: string) {
    client.emit(QUEUE_EVENTS.ERROR, { code, message });
  }
}
