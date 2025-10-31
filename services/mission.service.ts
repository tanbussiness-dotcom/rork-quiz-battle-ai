import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Mission, UserMission, Badge } from "@/models";

const MISSIONS_COLLECTION = "missions";
const USER_MISSIONS_COLLECTION = "user_missions";
const BADGES_COLLECTION = "badges";

export async function getActiveMissions(type: "daily" | "weekly"): Promise<Mission[]> {
  const now = Date.now();
  const q = query(
    collection(db, MISSIONS_COLLECTION),
    where("type", "==", type),
    where("expiresAt", ">", now),
    orderBy("expiresAt", "asc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Mission));
}

export async function getUserMissions(userId: string): Promise<UserMission[]> {
  const q = query(
    collection(db, USER_MISSIONS_COLLECTION),
    where("userId", "==", userId),
    orderBy("startedAt", "desc")
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as UserMission);
}

export async function startUserMission(
  userId: string,
  missionId: string
): Promise<void> {
  const docId = `${userId}_${missionId}`;
  const docRef = doc(db, USER_MISSIONS_COLLECTION, docId);

  const userMission: UserMission = {
    userId,
    missionId,
    progress: 0,
    completed: false,
    startedAt: Date.now(),
  };

  await setDoc(docRef, userMission);
  console.log("User mission started:", docId);
}

export async function updateMissionProgress(
  userId: string,
  missionId: string,
  progress: number
): Promise<void> {
  const docId = `${userId}_${missionId}`;
  const docRef = doc(db, USER_MISSIONS_COLLECTION, docId);

  await updateDoc(docRef, { progress });
  console.log(`Mission progress updated: ${docId} -> ${progress}`);
}

export async function completeMission(
  userId: string,
  missionId: string
): Promise<void> {
  const docId = `${userId}_${missionId}`;
  const docRef = doc(db, USER_MISSIONS_COLLECTION, docId);

  await updateDoc(docRef, {
    completed: true,
    claimedAt: Date.now(),
  });

  console.log("Mission completed:", docId);
}

export async function getBadge(badgeId: string): Promise<Badge | null> {
  const docRef = doc(db, BADGES_COLLECTION, badgeId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return { id: docSnap.id, ...docSnap.data() } as Badge;
}

export async function getAllBadges(): Promise<Badge[]> {
  const snapshot = await getDocs(collection(db, BADGES_COLLECTION));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Badge));
}

export async function createBadge(badge: Omit<Badge, "id">): Promise<string> {
  const docRef = doc(collection(db, BADGES_COLLECTION));
  await setDoc(docRef, badge);
  console.log("Badge created:", docRef.id);
  return docRef.id;
}
