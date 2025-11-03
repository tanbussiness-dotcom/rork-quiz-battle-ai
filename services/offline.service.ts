import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, runTransaction, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { UserProfile } from "@/contexts/UserProfileContext";
import type { Question } from "@/models/question";
import { getOfflineQuestions } from "@/services/question.service";

const PROGRESS_QUEUE_KEY = "/local/progressQueue";

export type QueuedOperation = {
  id: string;
  type: "updateProfile";
  uid: string;
  updates: Partial<UserProfile>;
  createdAt: number;
};

async function readQueue(): Promise<QueuedOperation[]> {
  try {
    const raw = (await AsyncStorage.getItem(PROGRESS_QUEUE_KEY)) ?? "[]";
    return JSON.parse(raw) as QueuedOperation[];
  } catch (e) {
    console.log("readQueue error", e);
    return [] as QueuedOperation[];
  }
}

async function writeQueue(items: QueuedOperation[]): Promise<void> {
  try {
    await AsyncStorage.setItem(PROGRESS_QUEUE_KEY, JSON.stringify(items));
  } catch (e) {
    console.log("writeQueue error", e);
  }
}

export async function enqueueProgressUpdate(op: Omit<QueuedOperation, "id" | "createdAt"> & { createdAt?: number }): Promise<void> {
  const item: QueuedOperation = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2)}`,
    createdAt: op.createdAt ?? Date.now(),
    type: op.type,
    uid: op.uid,
    updates: op.updates,
  };
  const queue = await readQueue();
  const next = [...queue, item].slice(-200);
  await writeQueue(next);
}

export async function flushProgressQueue(): Promise<{ success: number; failed: number }> {
  const queue = await readQueue();
  if (queue.length === 0) return { success: 0, failed: 0 };

  const remaining: QueuedOperation[] = [];
  let success = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      if (item.type === "updateProfile") {
        const ref = doc(db, "users", item.uid);
        await runTransaction(db, async (tx) => {
          const snap = await tx.get(ref);
          const existing = snap.exists() ? (snap.data() as UserProfile & { updatedAt?: number }) : undefined;
          const existingUpdatedAt = existing?.updatedAt ?? 0;
          const localOpTs = item.createdAt;
          if (localOpTs >= existingUpdatedAt) {
            tx.update(ref, { ...item.updates, updatedAt: Date.now() });
          } else {
            // Skip outdated local update to protect against overwriting newer server data
          }
        });
      }
      success += 1;
    } catch (e) {
      console.log("flush item error", item.id, e);
      remaining.push(item);
      failed += 1;
    }
  }

  await writeQueue(remaining);
  return { success, failed };
}

export async function syncCachedQuestions(): Promise<{ created: number; skipped: number }> {
  try {
    const cached = await getOfflineQuestions();
    let created = 0;
    let skipped = 0;

    for (const q of cached as Question[]) {
      const ref = doc(db, "questions", q.id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        skipped += 1;
        continue;
      }
      const payload: Record<string, any> = { ...q };
      await setDoc(ref, payload);
      created += 1;
    }

    return { created, skipped };
  } catch (e) {
    console.log("syncCachedQuestions error", e);
    return { created: 0, skipped: 0 };
  }
}
