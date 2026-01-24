# Matchmaking Module - Implementation Guide

## Prerequisites

Before starting, ensure you have:
- NestJS backend running
- `UsersModule` with `getUserSubjectStats()` method
- `SubjectsModule` with `findById()` method
- JWT authentication working

---

## Step 1: Install Dependencies

```bash
pnpm add @nestjs/websockets @nestjs/platform-socket.io socket.io
```

| Package | Purpose |
|---------|---------|
| `@nestjs/websockets` | NestJS WebSocket decorators and utilities |
| `@nestjs/platform-socket.io` | Socket.IO adapter for NestJS |
| `socket.io` | WebSocket library |

---

## Step 2: Create Folder Structure

```bash
mkdir -p src/modules/matchmaking/{types,dto,filters}
```

```
src/modules/matchmaking/
├── types/
│   ├── queue.types.ts    # Type definitions
│   └── index.ts          # Barrel export
├── dto/
│   ├── join-queue.dto.ts # Input validation
│   └── index.ts          # Barrel export
├── filters/
│   └── ws-exception.filter.ts  # Error handling
├── matchmaking.service.ts      # Queue logic
├── matchmaking.gateway.ts      # WebSocket handler
├── matchmaking.module.ts       # Module definition
└── index.ts                    # Barrel export
```

---

## Step 3: Create Types

**File: `types/queue.types.ts`**

```typescript
// Player waiting in queue
export interface QueuedPlayer {
  userId: string;
  socketId: string;
  subjectId: string;
  elo: number;
  joinedAt: number;
  username: string;
}

// Sent when match is found
export interface MatchFoundPayload {
  matchId: string;
  opponent: {
    id: string;
    username: string;
    elo: number;
  };
  subject: {
    id: string;
    name: string;
  };
}

// Queue status response
export interface QueueStatus {
  inQueue: boolean;
  subjectId: string | null;
  waitTime: number;
  playersInQueue: number;
  eloRange: {
    min: number;
    max: number;
  };
}

// WebSocket event names
export const QUEUE_EVENTS = {
  // Client → Server
  JOIN: 'queue:join',
  LEAVE: 'queue:leave',
  STATUS: 'queue:status',

  // Server → Client
  JOINED: 'queue:joined',
  LEFT: 'queue:left',
  MATCH_FOUND: 'queue:match_found',
  ERROR: 'queue:error',
  STATUS_UPDATE: 'queue:status_update',
} as const;

// Error codes
export enum QueueErrorCode {
  ALREADY_IN_QUEUE = 'ALREADY_IN_QUEUE',
  NOT_IN_QUEUE = 'NOT_IN_QUEUE',
  INVALID_SUBJECT = 'INVALID_SUBJECT',
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

// Configuration
export interface MatchmakingConfig {
  initialEloRange: number;
  eloRangeExpansion: number;
  expansionIntervalMs: number;
  maxEloRange: number;
  queueTimeoutMs: number;
}

export const DEFAULT_MATCHMAKING_CONFIG: MatchmakingConfig = {
  initialEloRange: 100,
  eloRangeExpansion: 50,
  expansionIntervalMs: 10000,
  maxEloRange: 400,
  queueTimeoutMs: 120000,
};
```

**File: `types/index.ts`**
```typescript
export * from './queue.types';
```

---

## Step 4: Create DTO

**File: `dto/join-queue.dto.ts`**

```typescript
import { IsNotEmpty, IsUUID } from 'class-validator';

export class JoinQueueDto {
  @IsUUID('4', { message: 'subjectId must be a valid UUID' })
  @IsNotEmpty({ message: 'subjectId is required' })
  subjectId: string;
}
```

**File: `dto/index.ts`**
```typescript
export * from './join-queue.dto';
```

---

## Step 5: Create Exception Filter

**File: `filters/ws-exception.filter.ts`**

```typescript
import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { QUEUE_EVENTS, QueueErrorCode } from '../types';

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();

    const error =
      exception instanceof WsException
        ? exception.getError()
        : { code: QueueErrorCode.INTERNAL_ERROR, message: 'Internal server error' };

    client.emit(QUEUE_EVENTS.ERROR, error);
  }
}
```

---

## Step 6: Create Service

**File: `matchmaking.service.ts`**

The service manages the queue using 3 Maps:

| Map | Purpose |
|-----|---------|
| `queue` | Main storage: userId → QueuedPlayer |
| `subjectIndex` | Fast lookup: subjectId → Set of userIds |
| `socketIndex` | Disconnect handling: socketId → userId |

```typescript
import { Injectable, Logger } from '@nestjs/common';
import {
  QueuedPlayer,
  QueueStatus,
  MatchmakingConfig,
  DEFAULT_MATCHMAKING_CONFIG,
} from './types';

@Injectable()
export class MatchmakingService {
  private readonly logger = new Logger(MatchmakingService.name);
  private readonly config: MatchmakingConfig = DEFAULT_MATCHMAKING_CONFIG;

  private readonly queue = new Map<string, QueuedPlayer>();
  private readonly subjectIndex = new Map<string, Set<string>>();
  private readonly socketIndex = new Map<string, string>();

  joinQueue(player: QueuedPlayer): { success: boolean; error?: string } {
    if (this.queue.has(player.userId)) {
      return { success: false, error: 'ALREADY_IN_QUEUE' };
    }

    this.queue.set(player.userId, player);

    if (!this.subjectIndex.has(player.subjectId)) {
      this.subjectIndex.set(player.subjectId, new Set());
    }
    this.subjectIndex.get(player.subjectId)!.add(player.userId);

    this.socketIndex.set(player.socketId, player.userId);

    this.logger.log(
      `Player ${player.username} joined queue for subject ${player.subjectId}`,
    );

    return { success: true };
  }

  leaveQueue(userId: string): { success: boolean; error?: string } {
    const player = this.queue.get(userId);
    if (!player) {
      return { success: false, error: 'NOT_IN_QUEUE' };
    }

    this.removePlayer(userId);
    return { success: true };
  }

  leaveQueueBySocketId(socketId: string): QueuedPlayer | null {
    const userId = this.socketIndex.get(socketId);
    if (!userId) return null;

    const player = this.queue.get(userId);
    if (player) {
      this.removePlayer(userId);
    }

    return player || null;
  }

  findMatch(userId: string): QueuedPlayer | null {
    const player = this.queue.get(userId);
    if (!player) return null;

    const waitTimeMs = Date.now() - player.joinedAt;
    const eloRange = this.calculateEloRange(waitTimeMs);

    const playersInSubject = this.subjectIndex.get(player.subjectId);
    if (!playersInSubject || playersInSubject.size < 2) return null;

    let bestMatch: QueuedPlayer | null = null;
    let smallestEloDiff = Infinity;

    for (const candidateId of playersInSubject) {
      if (candidateId === userId) continue;

      const candidate = this.queue.get(candidateId);
      if (!candidate) continue;

      const eloDiff = Math.abs(player.elo - candidate.elo);

      if (eloDiff <= eloRange && eloDiff < smallestEloDiff) {
        smallestEloDiff = eloDiff;
        bestMatch = candidate;
      }
    }

    return bestMatch;
  }

  removeBothPlayers(userId1: string, userId2: string): void {
    this.removePlayer(userId1);
    this.removePlayer(userId2);
  }

  getQueueStatus(userId: string): QueueStatus {
    const player = this.queue.get(userId);

    if (!player) {
      return {
        inQueue: false,
        subjectId: null,
        waitTime: 0,
        playersInQueue: 0,
        eloRange: { min: 0, max: 0 },
      };
    }

    const waitTime = Date.now() - player.joinedAt;
    const range = this.calculateEloRange(waitTime);
    const playersInSubject = this.subjectIndex.get(player.subjectId)?.size || 0;

    return {
      inQueue: true,
      subjectId: player.subjectId,
      waitTime,
      playersInQueue: playersInSubject,
      eloRange: {
        min: player.elo - range,
        max: player.elo + range,
      },
    };
  }

  private removePlayer(userId: string): void {
    const player = this.queue.get(userId);
    if (!player) return;

    const subjectPlayers = this.subjectIndex.get(player.subjectId);
    if (subjectPlayers) {
      subjectPlayers.delete(userId);
      if (subjectPlayers.size === 0) {
        this.subjectIndex.delete(player.subjectId);
      }
    }

    this.socketIndex.delete(player.socketId);
    this.queue.delete(userId);
  }

  private calculateEloRange(waitTimeMs: number): number {
    const expansions = Math.floor(waitTimeMs / this.config.expansionIntervalMs);
    const expandedRange =
      this.config.initialEloRange + expansions * this.config.eloRangeExpansion;

    return Math.min(expandedRange, this.config.maxEloRange);
  }
}
```

---

## Step 7: Create Gateway

**File: `matchmaking.gateway.ts`**

```typescript
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
        this.emitError(client, QueueErrorCode.AUTHENTICATION_REQUIRED, 'No token');
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      client.data.userId = payload.sub;
      client.data.email = payload.email;

      this.logger.log(`Client connected: ${client.id}`);
    } catch {
      this.emitError(client, QueueErrorCode.AUTHENTICATION_REQUIRED, 'Invalid token');
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.matchmakingService.leaveQueueBySocketId(client.id);
  }

  @SubscribeMessage(QUEUE_EVENTS.JOIN)
  async handleJoinQueue(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: JoinQueueDto,
  ) {
    const userId = client.data.userId;

    let subject: { id: string; name: string };
    try {
      subject = await this.subjectsService.findById(data.subjectId);
    } catch {
      return this.emitError(client, QueueErrorCode.INVALID_SUBJECT, 'Subject not found');
    }

    const userStats = await this.usersService.getUserSubjectStats(userId);
    const subjectStats = userStats.find((s) => s.subjectId === data.subjectId);
    const elo = subjectStats?.elo ?? 1200;

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
      return this.emitError(client, QueueErrorCode.ALREADY_IN_QUEUE, 'Already in queue');
    }

    client.emit(QUEUE_EVENTS.JOINED, this.matchmakingService.getQueueStatus(userId));

    await this.tryMatch(player, subject);
  }

  @SubscribeMessage(QUEUE_EVENTS.LEAVE)
  handleLeaveQueue(@ConnectedSocket() client: AuthenticatedSocket) {
    const result = this.matchmakingService.leaveQueue(client.data.userId);

    if (!result.success) {
      return this.emitError(client, QueueErrorCode.NOT_IN_QUEUE, 'Not in queue');
    }

    client.emit(QUEUE_EVENTS.LEFT);
  }

  @SubscribeMessage(QUEUE_EVENTS.STATUS)
  handleStatus(@ConnectedSocket() client: AuthenticatedSocket) {
    const status = this.matchmakingService.getQueueStatus(client.data.userId);
    client.emit(QUEUE_EVENTS.STATUS_UPDATE, status);
  }

  private async tryMatch(player: QueuedPlayer, subject: { id: string; name: string }) {
    const opponent = this.matchmakingService.findMatch(player.userId);
    if (!opponent) return;

    this.matchmakingService.removeBothPlayers(player.userId, opponent.userId);

    // TODO: Create match in database
    const matchId = crypto.randomUUID();

    const player1Payload: MatchFoundPayload = {
      matchId,
      opponent: { id: opponent.userId, username: opponent.username, elo: opponent.elo },
      subject: { id: subject.id, name: subject.name },
    };

    const player2Payload: MatchFoundPayload = {
      matchId,
      opponent: { id: player.userId, username: player.username, elo: player.elo },
      subject: { id: subject.id, name: subject.name },
    };

    this.server.to(player.socketId).emit(QUEUE_EVENTS.MATCH_FOUND, player1Payload);
    this.server.to(opponent.socketId).emit(QUEUE_EVENTS.MATCH_FOUND, player2Payload);

    this.logger.log(`Match: ${player.username} vs ${opponent.username}`);
  }

  private emitError(client: Socket, code: QueueErrorCode, message: string) {
    client.emit(QUEUE_EVENTS.ERROR, { code, message });
  }
}
```

---

## Step 8: Create Module

**File: `matchmaking.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MatchmakingGateway } from './matchmaking.gateway';
import { MatchmakingService } from './matchmaking.service';
import { UsersModule } from '../users/users.module';
import { SubjectsModule } from '../subjects/subjects.module';

@Module({
  imports: [
    UsersModule,
    SubjectsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MatchmakingGateway, MatchmakingService],
  exports: [MatchmakingService],
})
export class MatchmakingModule {}
```

**File: `index.ts`**
```typescript
export * from './matchmaking.module';
export * from './matchmaking.service';
export * from './matchmaking.gateway';
export * from './types';
export * from './dto';
```

---

## Step 9: Register Module

**File: `app.module.ts`**

```typescript
import { MatchmakingModule } from './modules/matchmaking/matchmaking.module';

@Module({
  imports: [
    // ... other modules
    MatchmakingModule,
  ],
})
export class AppModule {}
```

---

## Step 10: Frontend Integration

```typescript
import { io, Socket } from 'socket.io-client';

class MatchmakingClient {
  private socket: Socket;

  connect(token: string) {
    this.socket = io('http://localhost:8080/matchmaking', {
      auth: { token },
    });

    this.socket.on('connect', () => {
      console.log('Connected to matchmaking');
    });

    this.socket.on('queue:joined', (status) => {
      console.log('Joined queue', status);
    });

    this.socket.on('queue:match_found', (data) => {
      console.log('Match found!', data);
      // Navigate to match page
      window.location.href = `/match/${data.matchId}`;
    });

    this.socket.on('queue:error', (error) => {
      console.error('Queue error:', error);
    });
  }

  joinQueue(subjectId: string) {
    this.socket.emit('queue:join', { subjectId });
  }

  leaveQueue() {
    this.socket.emit('queue:leave');
  }

  getStatus() {
    this.socket.emit('queue:status');
  }

  disconnect() {
    this.socket.disconnect();
  }
}
```

---

## Testing

### Manual Testing with wscat

```bash
# Install wscat
npm install -g wscat

# Connect (won't work without auth, but useful for debugging)
wscat -c ws://localhost:8080/matchmaking
```

### Unit Tests

```typescript
// matchmaking.service.spec.ts
describe('MatchmakingService', () => {
  let service: MatchmakingService;

  beforeEach(() => {
    service = new MatchmakingService();
  });

  it('should add player to queue', () => {
    const player = {
      userId: '1',
      socketId: 'socket1',
      subjectId: 'physics',
      elo: 1200,
      joinedAt: Date.now(),
      username: 'test',
    };

    const result = service.joinQueue(player);
    expect(result.success).toBe(true);
  });

  it('should prevent duplicate queue join', () => {
    const player = { /* ... */ };
    service.joinQueue(player);
    const result = service.joinQueue(player);
    expect(result.success).toBe(false);
  });

  it('should find match within ELO range', () => {
    const player1 = { userId: '1', elo: 1200, /* ... */ };
    const player2 = { userId: '2', elo: 1180, /* ... */ };

    service.joinQueue(player1);
    service.joinQueue(player2);

    const match = service.findMatch('1');
    expect(match?.userId).toBe('2');
  });
});
```

---

## Next Steps

1. **Create match in database** - Replace `crypto.randomUUID()` with actual DB insert
2. **ELO calculation** - Update ratings after match ends
3. **Queue timeout** - Auto-remove players after 2 minutes
4. **Periodic status updates** - Send status every 5 seconds while in queue
5. **Leaderboard** - Show top players by ELO