import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  setDoc,
  doc,
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
    where("type", "==", type),
    where("period", "==", period),
    orderBy("score", "desc"),
    limit(maxResults)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc, index) => ({
    ...doc.data(),
    rank: index + 1,
  })) as LeaderboardEntry[];
}

export async function updateLeaderboardEntry(
  entry: Omit<LeaderboardEntry, "rank">
): Promise<void> {
  const docId = `${entry.userId}_${entry.type}_${entry.period}`;
  const docRef = doc(db, LEADERBOARD_COLLECTION, docId);

  await setDoc(
    docRef,
    {
      ...entry,
      updatedAt: Date.now(),
    },
    { merge: true }
  );

  console.log("Leaderboard entry updated:", docId);
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
