/** Full user profile (private - for authenticated user) */
export class UserProfile {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  avatar: string | null;
  xp: number;
  totalMatches: number;
  wins: number;
  losses: number;
  draws: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Public user profile */
export class PublicProfile {
  id: string;
  username: string | null;
  avatar: string | null;
  createdAt: Date;
}

/** User search result item */
export class SearchUserItem {
  id: string;
  username: string;
  avatar: string | null;
}

/** Search users response */
export class SearchUsersResponse {
  users: SearchUserItem[];
  count: number;
}

/** Subject info for stats */
export class SubjectInfo {
  name: string;
  slug: string;
  icon: string | null;
}

/** User stats for a specific subject */
export class SubjectStatsResponse {
  id: string;
  subjectId: string;
  /** ELO rating for this subject */
  elo: number;
  /** Total matches played */
  matches: number;
  wins: number;
  losses: number;
  draws: number;
  currentStreak: number;
  maxStreak: number;
  lastPlayedAt: Date | null;
  subject: SubjectInfo;
}
