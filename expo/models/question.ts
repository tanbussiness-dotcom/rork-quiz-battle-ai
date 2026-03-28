export type QuestionType = 
  | "multiple_choice"
  | "multiple_select"
  | "fill_blank"
  | "true_false"
  | "matching"
  | "ordering"
  | "image_based"
  | "riddle";

export type DifficultyLevel = "Easy" | "Medium" | "Hard" | "Challenge";

export interface Question {
  id: string;
  type: QuestionType;
  content: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  difficulty: DifficultyLevel;
  topic: string;
  mediaUrl?: string;
  source: "ai" | "manual";
  createdByAI: boolean;
  timeLimit: number;
  createdAt: number;
  language: string;
}

export interface QuestionHistory {
  userId: string;
  questionId: string;
  correct: boolean;
  answeredAt: number;
  timeTaken: number;
  userAnswer: string | string[];
}

export interface GenerateQuestionParams {
  topic: string;
  difficulty: DifficultyLevel;
  count: number;
  language: string;
  excludeIds?: string[];
}
