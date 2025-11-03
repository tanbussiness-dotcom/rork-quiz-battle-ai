import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  increment,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { LeaderboardEntry, LeaderboardQuery } from "@/models";

const LEADERBOARD_COLLECTION = "leaderboard";

export async function getLeaderboard(
  params: LeaderboardQuery
): Promise<LeaderboardEntry[]> {
  const { type, period, limit: maxResults = 100 } = params;

  const q = query(
    collection(db, LEADERBOARD_COLLECTION),
    where("mode", "==", type),
    where("period", "==", period),
    orderBy("points", "desc"),
    limit(maxResults)
  );

  const snapshot = await getDocs(q);
  const entries = snapshot.docs.map((doc) => ({
    ...doc.data(),
  })) as LeaderboardEntry[];

  return entries.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}

export async function updateLeaderboardEntry(
  entry: { 
    userId: string;
    displayName?: string;
    photoURL?: string;
    score: number;
    level?: number;
    rank?: string;
    type: LeaderboardQuery["type"];
    period: LeaderboardQuery["period"];
    updatedAt: number;
    won?: boolean;
  }
): Promise<void> {
  const docId = `${entry.userId}_${entry.type}_${entry.period}`;
  const docRef = doc(db, LEADERBOARD_COLLECTION, docId);

  try {
    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(docRef);
      
      if (!docSnap.exists()) {
        transaction.set(docRef, {
          id: docId,
          userId: entry.userId,
          username: entry.displayName || '',
          avatar: entry.photoURL,
          rank: 0,
          points: entry.score,
          mode: entry.type,
          period: entry.period,
          gamesPlayed: 1,
          updatedAt: entry.updatedAt,
        });
      } else {
        const data = docSnap.data();
        transaction.update(docRef, {
          username: entry.displayName || data.username,
          avatar: entry.photoURL || data.avatar,
          points: increment(entry.score),
          gamesPlayed: increment(1),
          updatedAt: entry.updatedAt,
        });
      }
    });

    console.log("✅ Leaderboard entry updated:", docId);
  } catch (error) {
    console.error("❌ Error updating leaderboard entry:", error);
    throw error;
  }
}

export async function getUserRank(
  userId: string,
  type: LeaderboardQuery["type"],
  period: LeaderboardQuery["period"]
): Promise<number | null> {
  const leaderboard = await getLeaderboard({ type, period, limit: 1000 });
  const userEntry = leaderboard.find((entry) => entry.userId === userId);
  return userEntry?.rank || null;
}

export async function getUserLeaderboardEntry(
  userId: string,
  type: LeaderboardQuery["type"],
  period: LeaderboardQuery["period"]
): Promise<LeaderboardEntry | null> {
  const docId = `${userId}_${type}_${period}`;
  const docRef = doc(db, LEADERBOARD_COLLECTION, docId);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  return docSnap.data() as LeaderboardEntry;
}
