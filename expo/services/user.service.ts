import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  arrayUnion,
  FieldValue,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { User, UserPreferences, UserStats, RankTier } from "@/models";

const USERS_COLLECTION = "users";

export async function createUserProfile(
  uid: string,
  data: { email: string; displayName: string; photoURL?: string }
): Promise<User> {
  const user: User = {
    uid,
    email: data.email,
    displayName: data.displayName,
    level: 1,
    xp: 0,
    totalPoints: 0,
    challengePoints: 0,
    rank: "Bronze",
    badges: [],
    completedQuestions: [],
    preferences: {
      language: "en",
      notificationsEnabled: true,
      soundEnabled: true,
      hapticsEnabled: true,
      favoriteTopics: [],
    },
    stats: {
      totalGamesPlayed: 0,
      totalCorrectAnswers: 0,
      totalWrongAnswers: 0,
      winRate: 0,
      currentStreak: 0,
      longestStreak: 0,
      battlesWon: 0,
      battlesLost: 0,
      topicStats: {},
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    onboardingComplete: false,
  };

  if (typeof data.photoURL === 'string') {
    user.photoURL = data.photoURL;
  }

  await setDoc(doc(db, USERS_COLLECTION, uid), user as Record<string, any>);
  return user;
}

export async function getUserProfile(uid: string): Promise<User | null> {
  const docRef = doc(db, USERS_COLLECTION, uid);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return docSnap.data() as User;
}

export async function updateUserProfile(
  uid: string,
  data: Partial<User>
): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Date.now(),
  });
}

export async function updateUserPreferences(
  uid: string,
  preferences: Partial<UserPreferences>
): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, uid);
  const updates: Record<string, any> = { updatedAt: Date.now() };
  Object.entries(preferences).forEach(([key, value]) => {
    updates[`preferences.${key}`] = value;
  });
  await updateDoc(docRef, updates);
}

export async function addXP(uid: string, amount: number): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(docRef, {
    xp: increment(amount),
    updatedAt: Date.now(),
  });
}

export async function addPoints(uid: string, amount: number): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(docRef, {
    totalPoints: increment(amount),
    updatedAt: Date.now(),
  });
}

export async function updateLevel(uid: string, newLevel: number): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(docRef, {
    level: newLevel,
    updatedAt: Date.now(),
  });
}

export async function updateRank(uid: string, newRank: RankTier, pointsChange: number): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(docRef, {
    rank: newRank,
    challengePoints: increment(pointsChange),
    updatedAt: Date.now(),
  });
}

export async function addBadge(uid: string, badgeId: string): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(docRef, {
    badges: arrayUnion(badgeId),
    updatedAt: Date.now(),
  });
}

export async function markQuestionCompleted(
  uid: string,
  questionId: string
): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(docRef, {
    completedQuestions: arrayUnion(questionId),
    updatedAt: Date.now(),
  });
}

export async function updateUserStats(
  uid: string,
  stats: Partial<UserStats>
): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, uid);
  const updates: Record<string, any> = { updatedAt: Date.now() };

  Object.entries(stats).forEach(([key, value]) => {
    updates[`stats.${key}`] = value;
  });

  await updateDoc(docRef, updates);
}

export async function incrementStat(
  uid: string,
  statKey: keyof UserStats,
  amount: number = 1
): Promise<void> {
  const docRef = doc(db, USERS_COLLECTION, uid);
  await updateDoc(docRef, {
    [`stats.${statKey}`]: increment(amount),
    updatedAt: Date.now(),
  });
}

export async function updatePlayerProgress(
  uid: string,
  score: number,
  correctAnswers: number,
  totalQuestions: number,
  mode: 'solo' | 'battle',
  topic?: string
): Promise<void> {
  try {
    const user = await getUserProfile(uid);
    if (!user) throw new Error('User not found');

    const xpGain = correctAnswers * 10;
    const pointsGain = score;
    const newXP = user.xp + xpGain;
    const newTotalPoints = user.totalPoints + pointsGain;

    const xpPerLevel = 100;
    const newLevel = Math.floor(newXP / xpPerLevel) + 1;
    
    const updates: Partial<User> = {
      xp: newXP,
      totalPoints: newTotalPoints,
      level: newLevel,
      updatedAt: Date.now(),
    };

    const docRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(docRef, updates);

    const statsUpdates: Record<string, FieldValue | number> = {
      totalGamesPlayed: increment(1),
      totalCorrectAnswers: increment(correctAnswers),
      totalWrongAnswers: increment(totalQuestions - correctAnswers),
    };

    if (mode === 'battle') {
      const won = score > 0;
      if (won) {
        statsUpdates['battlesWon'] = increment(1);
        statsUpdates['currentStreak'] = increment(1);
        
        if (user.stats.currentStreak + 1 > user.stats.longestStreak) {
          statsUpdates['longestStreak'] = user.stats.currentStreak + 1;
        }
      } else {
        statsUpdates['battlesLost'] = increment(1);
        statsUpdates['currentStreak'] = 0;
      }

      const totalBattles = user.stats.battlesWon + user.stats.battlesLost + (won ? 1 : 0);
      const totalWins = user.stats.battlesWon + (won ? 1 : 0);
      statsUpdates['winRate'] = totalBattles > 0 ? (totalWins / totalBattles) * 100 : 0;
    }

    if (topic) {
      const topicKey = `topicStats.${topic}`;
      const currentTopicStat = user.stats.topicStats[topic] || {
        topic,
        questionsAnswered: 0,
        correctAnswers: 0,
        accuracy: 0,
      };

      const newQuestionsAnswered = currentTopicStat.questionsAnswered + totalQuestions;
      const newCorrectAnswers = currentTopicStat.correctAnswers + correctAnswers;
      const newAccuracy = (newCorrectAnswers / newQuestionsAnswered) * 100;

      statsUpdates[`${topicKey}.questionsAnswered`] = newQuestionsAnswered;
      statsUpdates[`${topicKey}.correctAnswers`] = newCorrectAnswers;
      statsUpdates[`${topicKey}.accuracy`] = newAccuracy;
    }

    await updateDoc(docRef, {
      ...statsUpdates,
      updatedAt: Date.now(),
    });

    try {
      const newBadges = await checkAndUnlockBadges(uid, {
        totalPoints: newTotalPoints,
        correctAnswers: user.stats.totalCorrectAnswers + correctAnswers,
        battlesWon: mode === 'battle' && score > 0 ? user.stats.battlesWon + 1 : user.stats.battlesWon,
        currentStreak: mode === 'battle' && score > 0 ? user.stats.currentStreak + 1 : user.stats.currentStreak,
        rank: user.rank,
        topic,
        topicStats: user.stats.topicStats,
      });

      if (newBadges.length > 0) {
        console.log('🎖️ New badges unlocked:', newBadges);
        for (const badge of newBadges) {
          await addBadge(uid, badge);
        }
      }
    } catch (badgeError) {
      console.error('❌ Error checking badges:', badgeError);
    }

    const { updateLeaderboardEntry } = await import('./leaderboard.service');
    const periods: ('daily' | 'weekly' | 'monthly' | 'all_time')[] = ['daily', 'weekly', 'monthly', 'all_time'];
    
    const scoreForLeaderboard = mode === 'solo' ? pointsGain : (score > 0 ? pointsGain : 0);
    
    for (const period of periods) {
      try {
        await updateLeaderboardEntry({
          userId: uid,
          displayName: user.displayName,
          photoURL: user.photoURL,
          score: scoreForLeaderboard,
          level: newLevel,
          rank: user.rank,
          type: mode,
          period,
          updatedAt: Date.now(),
          won: mode === 'battle' ? score > 0 : undefined,
        });
      } catch (leaderboardError) {
        console.error('❌ Error updating leaderboard for period:', period, leaderboardError);
      }
    }

    try {
      const { updateMissionProgressAfterGame } = await import('./mission.service');
      await updateMissionProgressAfterGame(uid, {
        mode,
        correctAnswers,
        topic,
        won: mode === 'battle' ? score > 0 : undefined,
      });
    } catch (missionError) {
      console.error('❌ Error updating missions:', missionError);
    }

    console.log('✅ Player progress updated:', {
      uid,
      xpGain,
      pointsGain,
      newLevel,
      mode,
      topic,
    });
  } catch (error) {
    console.error('Error updating player progress:', error);
    throw error;
  }
}

async function checkAndUnlockBadges(
  uid: string,
  data: {
    totalPoints: number;
    correctAnswers: number;
    battlesWon: number;
    currentStreak: number;
    rank: RankTier;
    topic?: string;
    topicStats: Record<string, any>;
  }
): Promise<string[]> {
  const user = await getUserProfile(uid);
  if (!user) return [];

  const newBadges: string[] = [];

  const badgeConditions: { id: string; condition: boolean }[] = [
    {
      id: 'wise_scholar',
      condition: data.totalPoints >= 1000 && !user.badges.includes('wise_scholar'),
    },
    {
      id: 'history_warrior',
      condition:
        data.topic === 'history' &&
        data.battlesWon >= 10 &&
        !user.badges.includes('history_warrior'),
    },
    {
      id: 'battle_god',
      condition: data.rank === 'Diamond' && !user.badges.includes('battle_god'),
    },
    {
      id: 'knowledge_king',
      condition: false,
    },
    {
      id: 'hard_worker',
      condition: data.currentStreak >= 7 && !user.badges.includes('hard_worker'),
    },
    {
      id: 'math_genius',
      condition:
        (data.topicStats['mathematics']?.correctAnswers || 0) >= 50 &&
        !user.badges.includes('math_genius'),
    },
    {
      id: 'logic_master',
      condition:
        (data.topicStats['logic']?.questionsAnswered || 0) >= 30 &&
        !user.badges.includes('logic_master'),
    },
  ];

  for (const badge of badgeConditions) {
    if (badge.condition) {
      newBadges.push(badge.id);
    }
  }

  return newBadges;
}
