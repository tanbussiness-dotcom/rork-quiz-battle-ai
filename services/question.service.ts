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
import { generateQuestions as generateWithAI } from "@/lib/gemini";
import { trpcClient } from "@/lib/trpc";
import { APP_CONFIG } from "@/lib/config";
import type { Question, QuestionHistory, GenerateQuestionParams } from "@/models";

const QUESTIONS_COLLECTION = "questions";
const QUESTION_HISTORY_COLLECTION = "question_history";
const OFFLINE_KEY = "offline_questions_v1";

export async function generateAndStoreQuestions(
  params: GenerateQuestionParams
): Promise<Question[]> {
  console.log("Generating questions with params:", params);

  const aiQuestions = await generateWithAI({
    topic: params.topic,
    difficulty: params.difficulty,
    count: params.count,
    language: params.language,
  });

  const questions: Question[] = aiQuestions.map((q) => ({
    id: q.id,
    type: q.type,
    content: q.question,
    options: q.options,
    correctAnswer: Array.isArray(q.correctAnswer) ? (q.correctAnswer as string[])[0] : (q.correctAnswer as string),
    explanation: q.explanation,
    difficulty: q.difficulty,
    topic: params.topic,
    mediaUrl: undefined,
    source: "ai",
    createdByAI: true,
    timeLimit: 30,
    createdAt: Date.now(),
    language: params.language,
  }));

  const savedQuestions: Question[] = [];

  for (const question of questions) {
    const docRef = await addDoc(collection(db, QUESTIONS_COLLECTION), question);
    const saved = { ...question, id: docRef.id } as Question;
    savedQuestions.push(saved);
    await cacheOfflineQuestion(saved);
  }

  console.log(`Saved ${savedQuestions.length} questions to Firestore`);
  return savedQuestions;
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
    const raw = (await AsyncStorage.getItem(OFFLINE_KEY)) ?? "[]";
    const list = JSON.parse(raw) as Question[];
    const existing = list.filter((it) => it.id !== q.id);
    const next = [q, ...existing].slice(0, APP_CONFIG.offlineQuestionsLimit);
    await AsyncStorage.setItem(OFFLINE_KEY, JSON.stringify(next));
  } catch (e) {
    console.log("cacheOfflineQuestion error", e);
  }
}

export async function getOfflineQuestions(): Promise<Question[]> {
  try {
    const raw = (await AsyncStorage.getItem(OFFLINE_KEY)) ?? "[]";
    const list = JSON.parse(raw) as Question[];
    return list.slice(0, APP_CONFIG.offlineQuestionsLimit);
  } catch (e) {
    console.log("getOfflineQuestions error", e);
    return [] as Question[];
  }
}
