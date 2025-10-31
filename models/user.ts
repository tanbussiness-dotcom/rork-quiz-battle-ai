export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  level: number;
  xp: number;
  totalPoints: number;
  challengePoints: number;
  rank: RankTier;
  badges: string[];
  completedQuestions: string[];
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
