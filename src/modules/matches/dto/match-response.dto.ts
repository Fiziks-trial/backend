/** Subject info in match context */
export class MatchSubject {
  id: string;
  name: string;
  icon: string | null;
}

/** Player details in a match */
export class MatchPlayer {
  id: string;
  username: string;
  score: number;
  ratingBefore: number;
  ratingAfter: number;
  ratingChange: number;
}

/** Full match details */
export class MatchResponse {
  id: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  subject: MatchSubject;
  player1: MatchPlayer;
  player2: MatchPlayer;
  winnerId: string | null;
  createdAt: Date;
  startedAt: Date;
  endedAt: Date | null;
}

/** Player stats in match history */
export class HistoryPlayer {
  score: number;
  ratingBefore: number;
  ratingAfter: number;
  ratingChange: number;
}

/** Opponent info in match history */
export class HistoryOpponent {
  id: string;
  username: string;
  score: number;
}

/** Single match in history */
export class MatchHistoryItem {
  id: string;
  subject: MatchSubject;
  player: HistoryPlayer;
  opponent: HistoryOpponent;
  result: 'win' | 'loss' | 'draw';
  createdAt: Date;
  endedAt: Date | null;
}

/** Match history response */
export class MatchHistoryResponse {
  matches: MatchHistoryItem[];
}
