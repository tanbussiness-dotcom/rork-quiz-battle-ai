export type BattleStatus = "waiting" | "in_progress" | "completed" | "cancelled";

export interface BattleRoom {
  id: string;
  hostId: string;
  hostName: string;
  name: string;
  password?: string;
  isPublic: boolean;
  topic: string;
  difficulty: string;
  maxPlayers: number;
  currentPlayers: number;
  players: BattlePlayer[];
  status: BattleStatus;
  currentQuestionIndex: number;
  questions: string[];
  createdAt: number;
  startedAt?: number;
  endedAt?: number;
}

export interface BattlePlayer {
  uid: string;
  displayName: string;
  photoURL?: string;
  score: number;
  answers: BattleAnswer[];
  isReady: boolean;
  joinedAt: number;
}

export interface BattleAnswer {
  questionId: string;
  answer: string | string[];
  isCorrect: boolean;
  timeTaken: number;
  answeredAt: number;
}

export interface BattleResult {
  battleId: string;
  winnerId: string;
  players: BattlePlayerResult[];
  topic: string;
  difficulty: string;
  createdAt: number;
}

export interface BattlePlayerResult {
  uid: string;
  displayName: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  accuracy: number;
  rankChange: number;
}
