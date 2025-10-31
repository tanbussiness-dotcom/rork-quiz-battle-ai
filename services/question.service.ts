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
import { db } from "@/lib/firebase";
import { generateQuestions as generateWithAI } from "@/lib/gemini";
import type { Question, QuestionHistory, GenerateQuestionParams } from "@/models";

const QUESTIONS_COLLECTION = "questions";
const QUESTION_HISTORY_COLLECTION = "question_history";

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
    ...q,
    timeLimit: 30,
    createdAt: Date.now(),
    language: params.language,
  }));

  const savedQuestions: Question[] = [];

  for (const question of questions) {
    const docRef = await addDoc(collection(db, QUESTIONS_COLLECTION), question);
    savedQuestions.push({ ...question, id: docRef.id });
  }

  console.log(`Saved ${savedQuestions.length} questions to Firestore`);
  return savedQuestions;
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
