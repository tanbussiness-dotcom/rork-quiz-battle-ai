export const FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDyNbcAc2J8OdLdqmK0O7Mx5Z68C0CpU4w",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "quiz-battle-ai.firebaseapp.com",
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || "https://quiz-battle-ai-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "quiz-battle-ai",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "quiz-battle-ai.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "244936603537",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:244936603537:web:011dfd33acf3db03f20c30",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-LF386PZ9BJ",
};

export const GEMINI_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || "AIzaSyA3wlaGOPczH0FROCH_wcsiXr5R8gmHPTg",
};

export const APP_CONFIG = {
  defaultLanguage: "en" as const,
  questionTimeLimit: 30,
  questionsPerBattle: 10,
  pointsPerCorrectAnswer: 10,
  pointsPerWrongAnswer: -5,
  rankPointsWin: 10,
  rankPointsLose: -5,
  offlineQuestionsLimit: 50,
};

export const RANK_THRESHOLDS = {
  Bronze: 0,
  Silver: 100,
  Gold: 300,
  Platinum: 600,
  Diamond: 1000,
  Master: 1500,
  Challenger: 2500,
} as const;
