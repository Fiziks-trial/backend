export interface QueuedPlayer {
  userId: string;
  socketId: string;
  subjectId: string;
  elo: number;
  joinedAt: number;
  username: string;
}

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

export enum QueueErrorCode {
  ALREADY_IN_QUEUE = 'ALREADY_IN_QUEUE',
  NOT_IN_QUEUE = 'NOT_IN_QUEUE',
  INVALID_SUBJECT = 'INVALID_SUBJECT',
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export interface QueueError {
  code: QueueErrorCode;
  message: string;
}

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
