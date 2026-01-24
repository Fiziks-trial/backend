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

  // Main queue: Map<odis>userId, QueuedPlayer>
  private readonly queue = new Map<string, QueuedPlayer>();

  // Index for quick lookup by subject: Map<odis>subjectId, Set<odis>userId>>
  private readonly subjectIndex = new Map<string, Set<string>>();

  // Index for quick lookup by socket: Map<odis>socketId, userId>
  private readonly socketIndex = new Map<string, string>();

  joinQueue(player: QueuedPlayer): { success: boolean; error?: string } {
    if (this.queue.has(player.userId)) {
      return { success: false, error: 'ALREADY_IN_QUEUE' };
    }

    // Add to main queue
    this.queue.set(player.userId, player);

    // Add to subject index
    if (!this.subjectIndex.has(player.subjectId)) {
      this.subjectIndex.set(player.subjectId, new Set());
    }
    this.subjectIndex.get(player.subjectId)!.add(player.userId);

    // Add to socket index
    this.socketIndex.set(player.socketId, player.userId);

    this.logger.log(
      `Player ${player.username} joined queue for subject ${player.subjectId} (ELO: ${player.elo})`,
    );

    return { success: true };
  }

  leaveQueue(userId: string): { success: boolean; error?: string } {
    const player = this.queue.get(userId);
    if (!player) {
      return { success: false, error: 'NOT_IN_QUEUE' };
    }

    this.removePlayer(userId);
    this.logger.log(`Player ${player.username} left queue`);

    return { success: true };
  }

  leaveQueueBySocketId(socketId: string): QueuedPlayer | null {
    const userId = this.socketIndex.get(socketId);
    if (!userId) return null;

    const player = this.queue.get(userId);
    if (player) {
      this.removePlayer(userId);
      this.logger.log(
        `Player ${player.username} disconnected, removed from queue`,
      );
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

  isInQueue(userId: string): boolean {
    return this.queue.has(userId);
  }

  getPlayer(userId: string): QueuedPlayer | undefined {
    return this.queue.get(userId);
  }

  getQueueSize(subjectId?: string): number {
    if (subjectId) {
      return this.subjectIndex.get(subjectId)?.size || 0;
    }
    return this.queue.size;
  }

  private removePlayer(userId: string): void {
    const player = this.queue.get(userId);
    if (!player) return;

    // Remove from subject index
    const subjectPlayers = this.subjectIndex.get(player.subjectId);
    if (subjectPlayers) {
      subjectPlayers.delete(userId);
      if (subjectPlayers.size === 0) {
        this.subjectIndex.delete(player.subjectId);
      }
    }

    // Remove from socket index
    this.socketIndex.delete(player.socketId);

    // Remove from main queue
    this.queue.delete(userId);
  }

  private calculateEloRange(waitTimeMs: number): number {
    const expansions = Math.floor(waitTimeMs / this.config.expansionIntervalMs);
    const expandedRange =
      this.config.initialEloRange + expansions * this.config.eloRangeExpansion;

    return Math.min(expandedRange, this.config.maxEloRange);
  }
}
