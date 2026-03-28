import { Platform } from "react-native";

export type QuizQuestionInput = {
  question: string;
  answer: string;
  options?: string[];
  type?: "multiple_choice" | "true_false";
};

export type QuizInput = {
  title: string;
  description?: string;
  questions: QuizQuestionInput[];
};

export type QuizRecord = QuizInput & { id: string; createdAt?: number | null; updatedAt?: number | null };

function baseUrl() {
  const env = process.env.EXPO_PUBLIC_RORK_API_BASE_URL ?? "";
  if (env) return env.replace(/\/$/, "") + "/api";
  return Platform.OS === "web" ? "/api" : "http://localhost:3000/api";
}

async function handleJson<T>(res: Response): Promise<T> {
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const text = await res.text();
    throw new Error(`Expected JSON, got ${ct || "unknown"}. Body: ${text.slice(0, 200)}`);
  }
  const data = (await res.json()) as any;
  if (!res.ok) {
    throw new Error(data?.error || `HTTP ${res.status}`);
  }
  return data as T;
}

export async function createQuiz(input: QuizInput) {
  const res = await fetch(`${baseUrl()}/quizzes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleJson<{ status: "success"; data: QuizRecord }>(res);
}

export async function listQuizzes() {
  const res = await fetch(`${baseUrl()}/quizzes`, { method: "GET" });
  return handleJson<{ status: "success"; data: QuizRecord[] }>(res);
}

export async function getQuizById(id: string) {
  const res = await fetch(`${baseUrl()}/quizzes/${id}`, { method: "GET" });
  return handleJson<{ status: "success"; data: QuizRecord }>(res);
}
