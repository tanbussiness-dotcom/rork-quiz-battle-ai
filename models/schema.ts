import { User } from './user';
import { Question } from './question';
import { Match } from './battle';
import { LeaderboardEntry } from './leaderboard';
import { Mission, UserMission, Badge } from './mission';

export interface FirestoreSchema {
  users: User;
  questions: Question;
  matches: Match;
  leaderboards: LeaderboardEntry;
  missions: Mission;
  userMissions: UserMission;
  badges: Badge;
}

export const COLLECTION_NAMES = {
  USERS: 'users',
  QUESTIONS: 'questions',
  MATCHES: 'matches',
  LEADERBOARDS: 'leaderboards',
  MISSIONS: 'missions',
  USER_MISSIONS: 'userMissions',
  BADGES: 'badges',
  QUESTION_HISTORY: 'questionHistory',
} as const;

export const REALTIME_DB_PATHS = {
  BATTLE_ROOMS: 'battleRooms',
  ACTIVE_PLAYERS: 'activePlayers',
  MATCHMAKING_QUEUE: 'matchmakingQueue',
  MATCHES: 'matches',
} as const;

export const DEFAULT_USER_PROGRESS = {
  soloLevel: 1,
  soloXP: 0,
  battleLevel: 1,
  battleXP: 0,
  lastPlayedAt: Date.now(),
};

export const DEFAULT_USER_STATS = {
  totalGamesPlayed: 0,
  totalCorrectAnswers: 0,
  totalWrongAnswers: 0,
  winRate: 0,
  currentStreak: 0,
  longestStreak: 0,
  battlesWon: 0,
  battlesLost: 0,
  topicStats: {},
};

export const DEFAULT_USER_PREFERENCES = {
  language: 'en' as const,
  notificationsEnabled: true,
  soundEnabled: true,
  hapticsEnabled: true,
};

export const RANK_POINT_THRESHOLDS = {
  Bronze: 0,
  Silver: 100,
  Gold: 300,
  Platinum: 600,
  Diamond: 1000,
  Master: 1500,
  Challenger: 2500,
} as const;

export const BATTLE_CONFIG = {
  QUESTIONS_PER_BATTLE: 10,
  POINTS_PER_CORRECT: 10,
  POINTS_LOST_INCORRECT: 5,
  RANK_POINTS_WIN: 10,
  RANK_POINTS_LOSS: 5,
  TIME_LIMIT_SECONDS: 30,
} as const;

export const LEVEL_UP_THRESHOLD = 0.8;

export const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard', 'Challenge'] as const;
