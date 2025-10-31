export interface User {
  uid: string;
  username: string;
  email: string;
  avatar?: string;
  level: number;
  xp: number;
  totalPoints: number;
  rankPoints: number;
  rank: RankTier;
  badges: string[];
  completedQuestions: string[];
  progress: UserProgress;
  language: "en" | "vi" | "zh" | "ja";
  preferences: UserPreferences;
  stats: UserStats;
  createdAt: number;
  updatedAt: number;
}

export type RankTier = 
  | "Bronze"
  | "Silver" 
  | "Gold"
  | "Platinum"
  | "Diamond"
  | "Master"
  | "Challenger";

export interface UserPreferences {
  language: "en" | "vi" | "zh" | "ja";
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}

export interface UserProgress {
  soloLevel: number;
  soloXP: number;
  battleLevel: number;
  battleXP: number;
  lastPlayedAt: number;
}

export interface UserStats {
  totalGamesPlayed: number;
  totalCorrectAnswers: number;
  totalWrongAnswers: number;
  winRate: number;
  currentStreak: number;
  longestStreak: number;
  battlesWon: number;
  battlesLost: number;
  topicStats: Record<string, TopicStat>;
}

export interface TopicStat {
  topic: string;
  questionsAnswered: number;
  correctAnswers: number;
  accuracy: number;
}
