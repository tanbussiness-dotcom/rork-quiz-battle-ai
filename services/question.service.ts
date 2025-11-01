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

const QUESTIONS_COLLECTION = "questions";
const QUESTION_HISTORY_COLLECTION = "question_history";
const LOCAL_QUESTIONS_KEY = "/local/questions";
const LEGACY_OFFLINE_KEY = "offline_questions_v1";

export async function generateAndStoreQuestions(
  params: GenerateQuestionParams
): Promise<Question[]> {
  console.log("Generating questions with params:", params);

  const { topic, difficulty, count, language } = params;

  const results: Question[] = [];

  for (let i = 0; i < count; i++) {
    try {
      const q = await generateQuestionWithBackend(
        topic,
        (difficulty as "easy" | "medium" | "hard" | "challenge") ?? "medium",
        language ?? "en"
      );
      results.push(q);
    } catch (e) {
      console.log("generateAndStoreQuestions: backend generation failed", e);
      // No fallback: enforce real OpenAI via backend; surface error
      throw e as Error;
    }
  }

  console.log(`Generated ${results.length} questions`);
  return results;
}

export async function generateQuestionWithBackend(
  topic: string,
  difficulty: "easy" | "medium" | "hard" | "challenge",
  language: string
): Promise<Question> {
  console.log("Requesting backend to generate single question", { topic, difficulty, language });
  const res = await trpcClient.questions.generate.mutate({ topic, difficulty, language });
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
