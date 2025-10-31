export type LeaderboardType = "solo" | "battle";
export type LeaderboardPeriod = "daily" | "weekly" | "monthly" | "all_time";

export interface LeaderboardEntry {
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  rank: number;
  points: number;
  mode: LeaderboardType;
  period: LeaderboardPeriod;
  gamesPlayed: number;
  winRate?: number;
  accuracy?: number;
  updatedAt: number;
}

export interface LeaderboardQuery {
  type: LeaderboardType;
  period: LeaderboardPeriod;
  limit?: number;
}
