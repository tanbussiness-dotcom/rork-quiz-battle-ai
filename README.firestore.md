# Firestore Schema Documentation

## Collections Overview

### 1. Users Collection (`users`)
Stores user profile and game progress data.

**Document ID:** User's Firebase Auth UID

**Schema:**
```typescript
{
  uid: string;              // Firebase Auth UID
  username: string;         // Display username
  email: string;           // User email
  avatar?: string;         // Profile picture URL
  level: number;           // Overall level
  xp: number;              // Experience points
  totalPoints: number;     // Accumulated points
  rankPoints: number;      // Ranking points for battles
  rank: RankTier;          // Current rank tier
  badges: string[];        // Array of badge IDs
  completedQuestions: string[]; // Question IDs answered
  progress: {
    soloLevel: number;
    soloXP: number;
    battleLevel: number;
    battleXP: number;
    lastPlayedAt: number;
  };
  language: "en" | "vi" | "zh" | "ja";
  preferences: {
    notificationsEnabled: boolean;
    soundEnabled: boolean;
    hapticsEnabled: boolean;
  };
  stats: {
    totalGamesPlayed: number;
    totalCorrectAnswers: number;
    totalWrongAnswers: number;
    winRate: number;
    currentStreak: number;
    longestStreak: number;
    battlesWon: number;
    battlesLost: number;
    topicStats: Record<string, TopicStat>;
  };
  createdAt: number;
  updatedAt: number;
}
```

### 2. Questions Collection (`questions`)
Stores AI-generated and manual questions.

**Document ID:** Auto-generated

**Schema:**
```typescript
{
  id: string;
  type: QuestionType;      // multiple_choice, true_false, etc.
  content: string;         // Question text
  options?: string[];      // Answer options
  correctAnswer: string | string[];
  explanation: string;     // Answer explanation
  difficulty: DifficultyLevel;
  topic: string;
  mediaUrl?: string;       // Image/video URL
  source: "ai" | "manual";
  createdByAI: boolean;
  timeLimit: number;       // Seconds
  createdAt: number;
  language: string;
}
```

### 3. Matches Collection (`matches`)
Stores completed battle results.

**Document ID:** Auto-generated

**Schema:**
```typescript
{
  id: string;
  roomId: string;          // Reference to realtime DB room
  hostId: string;          // User ID
  opponentId?: string;     // User ID (if exists)
  questions: string[];     // Question IDs used
  scores: Record<string, number>; // userId -> score
  result: {
    winnerId: string;
    winnerScore: number;
    loserScore: number;
    rankChanges: Record<string, number>;
  };
  topic: string;
  difficulty: string;
  status: BattleStatus;
  createdAt: number;
  completedAt?: number;
}
```

### 4. Leaderboards Collection (`leaderboards`)
Stores ranking entries for different periods and modes.

**Document ID:** `{userId}_{mode}_{period}`

**Schema:**
```typescript
{
  id: string;
  userId: string;
  username: string;
  avatar?: string;
  rank: number;            // Position in leaderboard
  points: number;          // Total points
  mode: "solo" | "battle";
  period: "daily" | "weekly" | "monthly" | "all_time";
  gamesPlayed: number;
  winRate?: number;
  accuracy?: number;
  updatedAt: number;
}
```

### 5. Missions Collection (`missions`)
Stores available missions (daily/weekly).

**Document ID:** Auto-generated

**Schema:**
```typescript
{
  missionId: string;
  mode: "solo" | "battle" | "general";
  type: "daily" | "weekly";
  title: Record<string, string>;  // Localized titles
  description: Record<string, string>; // Localized descriptions
  requirement: number;     // Target value
  reward: {
    coins: number;
    xp: number;
    badges?: string[];
  };
  expiresAt: number;
  createdAt: number;
  isActive: boolean;
}
```

### 6. User Missions Collection (`userMissions`)
Tracks user progress on missions.

**Document ID:** `{userId}_{missionId}`

**Schema:**
```typescript
{
  id: string;
  userId: string;
  missionId: string;
  progress: number;        // Current progress
  completed: boolean;
  claimed: boolean;
  claimedAt?: number;
  startedAt: number;
  updatedAt: number;
}
```

### 7. Badges Collection (`badges`)
Stores available badges and achievements.

**Document ID:** Badge ID

**Schema:**
```typescript
{
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  requirement: string;
  category: string;
}
```

## Security Rules

The Firestore security rules are defined in `firestore.rules`:

- **Users**: Read (authenticated), Write (owner only)
- **Questions**: Read (authenticated), Write (server only)
- **Matches**: Read/Write (participants only)
- **Leaderboards**: Read (authenticated), Write (server only)
- **Missions**: Read (authenticated), Write (server only)
- **User Missions**: Read/Write (owner only)
- **Badges**: Read (authenticated), Write (server only)

## Indexes

Required composite indexes are defined in `firestore.indexes.json`:

1. Leaderboards by mode, period, and points
2. Questions by topic, difficulty, and language
3. Matches by hostId/opponentId and createdAt
4. User missions by userId, completed status, and updatedAt
5. Missions by active status, type, and expiration

## Deployment

To deploy security rules and indexes:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firestore
firebase init firestore

# Deploy rules and indexes
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

## Query Examples

### Get top 10 solo players this week
```typescript
const leaderboardRef = collection(db, 'leaderboards');
const q = query(
  leaderboardRef,
  where('mode', '==', 'solo'),
  where('period', '==', 'weekly'),
  orderBy('points', 'desc'),
  limit(10)
);
```

### Get questions by topic and difficulty
```typescript
const questionsRef = collection(db, 'questions');
const q = query(
  questionsRef,
  where('topic', '==', 'History'),
  where('difficulty', '==', 'Medium'),
  where('language', '==', 'en'),
  limit(10)
);
```

### Get user's active missions
```typescript
const userMissionsRef = collection(db, 'userMissions');
const q = query(
  userMissionsRef,
  where('userId', '==', userId),
  where('completed', '==', false),
  orderBy('updatedAt', 'desc')
);
```
