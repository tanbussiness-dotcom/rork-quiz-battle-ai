export type LeaderboardType = "solo" | "battle";
export type LeaderboardPeriod = "daily" | "weekly" | "monthly" | "all_time";

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  photoURL?: string;
  rank: number;
  score: number;
  points: number;
  gamesPlayed: number;
  winRate?: number;
  period: LeaderboardPeriod;
  type: LeaderboardType;
  updatedAt: number;
}

export interface LeaderboardQuery {
  type: LeaderboardType;
  period: LeaderboardPeriod;
  limit?: number;
}
