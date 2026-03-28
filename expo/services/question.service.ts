import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "@/lib/firebase";

import { trpcClient } from "@/lib/trpc";
import { APP_CONFIG } from "@/lib/config";
import type { Question, QuestionHistory, GenerateQuestionParams } from "@/models";
import { getMockQuestions } from "@/lib/gemini";

const QUESTIONS_COLLECTION = "questions";
const QUESTION_HISTORY_COLLECTION = "question_history";
const LOCAL_QUESTIONS_KEY = "/local/questions";
const LEGACY_OFFLINE_KEY = "offline_questions_v1";

export async function generateAndStoreQuestions(
  params: GenerateQuestionParams
): Promise<Question[]> {
  console.log("🔍 [Question Service] Generating questions with params:", params);

  const { topic, difficulty, count, language } = params;

  const results: Question[] = [];
  let failures = 0;
  const maxFailures = Math.min(3, count);

  for (let i = 0; i < count; i++) {
    try {
      console.log(`🔍 [Question Service] Generating question ${i + 1}/${count}...`);
      const q = await generateQuestionWithBackend(
        topic,
        (difficulty as "easy" | "medium" | "hard" | "challenge") ?? "medium",
        language ?? "en"
      );
      results.push(q);
      console.log(`✅ [Question Service] Successfully generated question ${i + 1}/${count}`);
    } catch (e: any) {
      failures++;
      console.error(`❌ [Question Service] Failed to generate question ${i + 1}/${count}:`, e?.message || e);
      
      if (failures >= maxFailures) {
        console.error(`❌ [Question Service] Too many failures (${failures}/${maxFailures}). Stopping generation.`);
        if (results.length === 0) {
          console.warn("⚠️ [Question Service] Falling back to mock questions due to repeated backend failures");
          const mocks = getMockQuestions(topic, count).map((m, idx): Question => ({
            id: `${m.id}_${Date.now()}_${idx}`,
            type: m.type as Question["type"],
            content: m.question,
            options: m.options,
            correctAnswer: m.correctAnswer,
            explanation: m.explanation,
            difficulty: m.difficulty,
            topic: m.topic,
            mediaUrl: undefined,
            source: "ai",
            createdByAI: true,
            timeLimit: APP_CONFIG.questionTimeLimit,
            createdAt: Date.now(),
            language: language ?? "en",
          }));
          return mocks;
        }
        break;
      }
    }
  }

  console.log(`✅ [Question Service] Generated ${results.length} questions (${failures} failures)`);
  
  if (results.length === 0) {
    console.warn("⚠️ [Question Service] Backend generation completely failed, returning mock questions");
    const mocks = getMockQuestions(topic, count).map((m, idx): Question => ({
      id: `${m.id}_${Date.now()}_${idx}`,
      type: m.type as Question["type"],
      content: m.question,
      options: m.options,
      correctAnswer: m.correctAnswer,
      explanation: m.explanation,
      difficulty: m.difficulty,
      topic: m.topic,
      mediaUrl: undefined,
      source: "ai",
      createdByAI: true,
      timeLimit: APP_CONFIG.questionTimeLimit,
      createdAt: Date.now(),
      language: language ?? "en",
    }));
    return mocks;
  }
  
  return results;
}

export async function generateQuestionWithBackend(
  topic: string,
  difficulty: "easy" | "medium" | "hard" | "challenge",
  language: string
): Promise<Question> {
  console.log("🔍 [Question Service] Requesting backend to generate single question", { topic, difficulty, language });
  console.log("🔗 [Question Service] Using tRPC client (check tRPC logs for actual URL)");
  let res: any;
  try {
    res = await trpcClient.questions.generate.mutate({ topic, difficulty, language });
    console.log("✅ [Question Service] Backend successfully generated question");
  } catch (err: any) {
    console.error("❌ [Question Service] tRPC fetch failed:", err?.message || err);
    console.error("💡 [Question Service] Troubleshooting tips:");
    console.error("  1. Check that /api/health returns 200 OK");
    console.error("  2. Verify GEMINI_API_KEY is set in your .env file");
    console.error("  3. Check console logs for [tRPC Client] or [tRPC Catch-All] messages");
    throw err;
  }
  const q: Question = {
    id: res.id as string,
    type: res.type,
    content: res.content,
    options: Array.isArray(res.options) ? (res.options as string[]) : undefined,
    correctAnswer: res.correctAnswer as string,
    explanation: res.explanation as string,
    difficulty: res.difficulty as Question["difficulty"],
    topic: res.topic as string,
    mediaUrl: res.mediaUrl ?? undefined,
    source: "ai",
    createdByAI: true,
    timeLimit: res.timeLimit as number,
    createdAt: res.createdAt as number,
    language: res.language as string,
  };
  await cacheOfflineQuestion(q);
  return q;
}

export async function getQuestion(id: string): Promise<Question | null> {
  const docRef = doc(db, QUESTIONS_COLLECTION, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    return null;
  }

  return { id: docSnap.id, ...docSnap.data() } as Question;
}

export async function getQuestionsByTopic(
  topic: string,
  difficulty: string,
  maxCount: number = 10
): Promise<Question[]> {
  const q = query(
    collection(db, QUESTIONS_COLLECTION),
    where("topic", "==", topic),
    where("difficulty", "==", difficulty),
    orderBy("createdAt", "desc"),
    limit(maxCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map(
    (doc) => ({ id: doc.id, ...doc.data() } as Question)
  );
}

export async function saveQuestionHistory(
  userId: string,
  questionId: string,
  correct: boolean,
  timeTaken: number,
  userAnswer: string | string[]
): Promise<void> {
  const history: QuestionHistory = {
    userId,
    questionId,
    correct,
    answeredAt: Date.now(),
    timeTaken,
    userAnswer,
  };

  await addDoc(collection(db, QUESTION_HISTORY_COLLECTION), history);
  console.log("Question history saved:", history);
}

export async function getUserQuestionHistory(
  userId: string,
  maxCount: number = 50
): Promise<QuestionHistory[]> {
  const q = query(
    collection(db, QUESTION_HISTORY_COLLECTION),
    where("userId", "==", userId),
    orderBy("answeredAt", "desc"),
    limit(maxCount)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data() as QuestionHistory);
}

export async function getCompletedQuestionIds(userId: string): Promise<string[]> {
  const history = await getUserQuestionHistory(userId, 1000);
  return history.map((h) => h.questionId);
}

export async function cacheOfflineQuestion(q: Question): Promise<void> {
  try {
    let raw = (await AsyncStorage.getItem(LOCAL_QUESTIONS_KEY)) ?? null;
    if (raw === null) {
      const legacyRaw = await AsyncStorage.getItem(LEGACY_OFFLINE_KEY);
      if (legacyRaw) {
        await AsyncStorage.setItem(LOCAL_QUESTIONS_KEY, legacyRaw);
        await AsyncStorage.removeItem(LEGACY_OFFLINE_KEY);
        raw = legacyRaw;
      } else {
        raw = "[]";
      }
    }
    const list = JSON.parse(raw) as Question[];
    const existing = list.filter((it) => it.id !== q.id);
    const next = [q, ...existing].slice(0, APP_CONFIG.offlineQuestionsLimit);
    await AsyncStorage.setItem(LOCAL_QUESTIONS_KEY, JSON.stringify(next));
  } catch (e) {
    console.log("cacheOfflineQuestion error", e);
  }
}

export async function getOfflineQuestions(): Promise<Question[]> {
  try {
    let raw = (await AsyncStorage.getItem(LOCAL_QUESTIONS_KEY)) ?? null;
    if (raw === null) {
      const legacyRaw = await AsyncStorage.getItem(LEGACY_OFFLINE_KEY);
      if (legacyRaw) {
        await AsyncStorage.setItem(LOCAL_QUESTIONS_KEY, legacyRaw);
        await AsyncStorage.removeItem(LEGACY_OFFLINE_KEY);
        raw = legacyRaw;
      }
    }
    const json = raw ?? "[]";
    const list = JSON.parse(json) as Question[];
    return list.slice(0, APP_CONFIG.offlineQuestionsLimit);
  } catch (e) {
    console.log("getOfflineQuestions error", e);
    return [] as Question[];
  }
}

export async function saveMinimalQuestion(payload: {
  content: string;
  correctAnswer: string;
  language: string;
}): Promise<string> {
  const docRef = await addDoc(collection(db, QUESTIONS_COLLECTION), {
    content: payload.content,
    correctAnswer: payload.correctAnswer,
    language: payload.language,
    createdAt: Date.now(),
    source: "ai",
    createdByAI: true,
  });
  return docRef.id;
}

export async function explainAnswerViaBackend(params: {
  questionId: string;
  playerAnswer: string;
  language?: string;
}): Promise<string> {
  const res = await trpcClient.questions.explain.mutate(params);
  return (res as any).explanation as string;
}
