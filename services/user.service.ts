import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  arrayUnion,
  serverTimestamp,
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
    photoURL: data.photoURL,
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
  };

  await setDoc(doc(db, USERS_COLLECTION, uid), user);
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
  await updateDoc(docRef, {
    preferences,
    updatedAt: Date.now(),
  });
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
