import AsyncStorage from "@react-native-async-storage/async-storage";
import { getGeminiApiKey } from "@/lib/env";

export interface QuizQuestion {
  id: string;
  type: "multiple_choice" | "true_false" | "multiple_select" | "fill_blank";
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Challenge";
  topic: string;
}

export interface GenerateQuestionsParams {
  topic: string;
  difficulty: string;
  count: number;
  language?: string;
}

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent";

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms);
    promise
      .then((v) => {
        clearTimeout(timer);
        resolve(v);
      })
      .catch((e) => {
        clearTimeout(timer);
        reject(e);
      });
  });
}

function stripFences(raw: string): string {
  let text = raw.trim();
  text = text.replace(/^```json\s*([\s\S]*?)\s*```$/i, "$1");
  text = text.replace(/^```\s*([\s\S]*?)\s*```$/i, "$1");
  return text.trim();
}

export function safeParseQuestions(text: string): any[] | null {
  const cleaned = stripFences(text);
  try {
    const obj = JSON.parse(cleaned);
    if (Array.isArray(obj)) return obj;
    if (obj && typeof obj === "object" && Array.isArray((obj as any).questions)) return (obj as any).questions as any[];
  } catch {}
  const matches = cleaned.match(/(\{[\s\S]*?\}|\[[\s\S]*?\])/g);
  if (matches && matches.length) {
    const sorted = matches.sort((a, b) => b.length - a.length);
    for (const m of sorted) {
      try {
        const obj2 = JSON.parse(m);
        if (Array.isArray(obj2)) return obj2 as any[];
        if (obj2 && typeof obj2 === "object" && Array.isArray((obj2 as any).questions)) return (obj2 as any).questions as any[];
      } catch {}
    }
  }
  return null;
}

export async function callGemini(prompt: string, timeoutMs: number = 15000): Promise<string> {
  const apiKey = getGeminiApiKey() || process.env.GEMINI_API_KEY || "";
  
  if (!apiKey) {
    const isClient = typeof window !== 'undefined';
    console.error("❌ Missing GEMINI_API_KEY — please add it to your .env file.");
    console.error("Context:", isClient ? "Client (browser/app)" : "Server (backend)");
    
    if (isClient) {
      throw new Error("Gemini API calls must be made from the backend. Use tRPC procedures instead of calling this directly.");
    } else {
      console.error("Available env keys with GEMINI:", Object.keys(process.env).filter(k => k.includes('GEMINI')));
      throw new Error("Missing GEMINI_API_KEY — set GEMINI_API_KEY in your .env file");
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), Math.min(timeoutMs, 15000));
  const url = `${GEMINI_API_URL}?key=${apiKey}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 2048,
        },
      }),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    console.error("[Gemini Fetch Error]", err);
    throw new Error(`[Gemini Fetch Error] ${String(err)}`);
  }
  clearTimeout(timer);

  const raw = await res.text();
  if (!res.ok) {
    console.error("[Gemini] non-200:", res.status, raw.slice(0, 500));
    throw new Error(`Gemini ${res.status}: ${raw.slice(0, 100)}`);
  }

  try {
    const data: any = JSON.parse(raw);
    const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return String(text);
  } catch (e) {
    console.error("[Gemini Parse Response Error]", String(e), raw.slice(0, 300));
    throw new Error("Failed to parse Gemini response JSON");
  }
}

function validateQuestionStructure(q: any): { valid: boolean; reason?: string } {
  if (!q || typeof q !== "object") return { valid: false, reason: "not an object" };
  const question = typeof q.question === "string" ? q.question : typeof q.content === "string" ? q.content : null;
  if (!question) return { valid: false, reason: "missing question/content" };
  const options = Array.isArray(q.options) ? q.options.map((o: any) => String(o)) : undefined;
  if (options && options.length === 0) return { valid: false, reason: "empty options" };
  const correct = q.correctAnswer;
  if (typeof correct === "undefined" || correct === null) return { valid: false, reason: "missing correctAnswer" };
  return { valid: true };
}

export async function generateQuestionsWithChatGPT(
  topic: string,
  count: number = 10,
  opts?: { difficulty?: string; language?: string; timeoutMs?: number; retries?: number }
): Promise<QuizQuestion[]> {
  const difficulty = opts?.difficulty ?? "Medium";
  const language = opts?.language ?? "English";
  const timeoutMs = opts?.timeoutMs ?? 15000;
  const retries = Math.max(0, opts?.retries ?? 2);

  const cacheKey = `cached_questions_${topic}_${difficulty}_${language}`;

  const prompt = `You are an AI quiz generator. Create ${count} questions about "${topic}" with difficulty "${difficulty}" in ${language}.
Return ONLY JSON in the format below:
{
  "questions": [
    {
      "type": "multiple_choice",
      "question": "string",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "string",
      "difficulty": "Easy" | "Medium" | "Hard" | "Challenge",
      "topic": "${topic}"
    }
  ]
}
Do not include explanations about your answer, markdown, or commentary.
Return ONLY valid JSON.`;

  let attempt = 0;
  while (attempt <= retries) {
    try {
      console.log(`[Gemini] topic=${topic} difficulty=${difficulty} | attempt ${attempt + 1}/${retries + 1}`);
      const text = await withTimeout(callGemini(prompt, timeoutMs), timeoutMs);
      const responseLen = text.length;
      const arr = safeParseQuestions(text);
      if (!arr) throw new Error("invalid JSON response");
      const normalized: QuizQuestion[] = arr.map((q: any, i: number) => {
        const { valid, reason } = validateQuestionStructure(q);
        if (!valid) {
          console.error("[Gemini] invalid question structure", { reason, q });
        }
        const options = Array.isArray(q?.options) ? q.options.map((o: any) => String(o)) : ["True", "False"];
        const correct = Array.isArray(q?.correctAnswer)
          ? String((q.correctAnswer as any[])[0])
          : String(q?.correctAnswer ?? (q?.answer ?? options[0]));
        return {
          id: `${Date.now()}_${i}`,
          type: (q?.type as QuizQuestion["type"]) ?? "multiple_choice",
          question: String(q?.question ?? q?.content ?? ""),
          options,
          correctAnswer: correct,
          explanation: String(q?.explanation ?? ""),
          difficulty: (q?.difficulty as QuizQuestion["difficulty"]) ?? (difficulty as any),
          topic: String(q?.topic ?? topic),
        };
      });
      const validCount = normalized.filter((q) => typeof q.question === "string" && q.question.length > 0 && typeof q.correctAnswer !== "undefined").length;
      console.log(`[Gemini] topic=${topic} difficulty=${difficulty} | ${responseLen} chars | ✅ parsed ${validCount} questions`);

      await AsyncStorage.setItem(cacheKey, JSON.stringify(normalized));
      return normalized;
    } catch (err: any) {
      console.error("[Gemini] generation failed", err?.message ?? String(err));
      attempt += 1;
      if (attempt > retries) break;
      const backoff = 2000 * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }

  const cached = await AsyncStorage.getItem(cacheKey);
  if (cached) {
    try {
      const parsed = JSON.parse(cached) as QuizQuestion[];
      console.warn("[Gemini Fallback] Using cached questions after failures");
      return parsed;
    } catch (e) {
      console.error("[Gemini] cached parse error", e);
    }
  }

  console.warn("[Gemini Fallback] Using mock questions because of: generation failures");
  return getMockQuestions(topic, count);
}

export type SingleAIQuestion = {
  type: "multipleChoice" | "trueFalse" | "fillBlank" | "mediaBased" | "riddle";
  content: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
};

export async function generateSingleQuestion(params: { topic: string; difficulty: string; language?: string; }): Promise<SingleAIQuestion> {
  const { topic, difficulty, language = "English" } = params;
  const prompt = `You are an AI quiz generator. Generate exactly 1 question about "${topic}" with difficulty "${difficulty}" in ${language}.
Return ONLY JSON in the format below:
{
  "questions": [
    {
      "type": "multipleChoice",
      "content": "string",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "string"
    }
  ]
}
Do not include explanations about your answer, markdown, or commentary.
Return ONLY valid JSON.`;

  let attempt = 0;
  const retries = 2;
  while (attempt <= retries) {
    try {
      const text = await withTimeout(callGemini(prompt, 15000), 15000);
      const arr = safeParseQuestions(text);
      if (!arr || arr.length === 0) throw new Error("invalid JSON response");
      const q = arr[0] as any;
      const { valid, reason } = validateQuestionStructure(q);
      if (!valid) {
        console.error("[Gemini] invalid single-question structure", { reason, q });
        throw new Error("invalid question structure");
      }
      const options = Array.isArray(q?.options) ? (q.options as string[]) : ["True", "False"];
      const out: SingleAIQuestion = {
        type: (q?.type as SingleAIQuestion["type"]) ?? "multipleChoice",
        content: String(q?.content ?? q?.question ?? ""),
        options,
        correctAnswer: String(q?.correctAnswer ?? options[0]),
        explanation: String(q?.explanation ?? ""),
      };
      console.log(`[Gemini] topic=${topic} difficulty=${difficulty} | single | ✅ parsed`);
      return out;
    } catch (err: any) {
      attempt += 1;
      console.error("[Gemini] single generation failed", err?.message ?? String(err));
      if (attempt <= retries) await new Promise((r) => setTimeout(r, 2000 * Math.pow(2, attempt - 1)));
    }
  }
  console.warn("[Gemini Fallback] Using mock single question due to failures");
  const mock = getMockQuestions(topic, 1)[0];
  return {
    type: "multipleChoice",
    content: mock.question,
    options: mock.options,
    correctAnswer: Array.isArray(mock.correctAnswer) ? String(mock.correctAnswer[0]) : String(mock.correctAnswer),
    explanation: mock.explanation,
  };
}

export const generateQuestions = generateQuestionsWithChatGPT;

export async function getAIExplanation(
  question: string,
  userAnswer: string,
  correctAnswer: string,
  language: string = "English"
): Promise<string> {
  const prompt = `Explain in ${language} why the correct answer to the following question is "${correctAnswer}" and not "${userAnswer}". Be concise (2-3 sentences). Question: ${question}`;
  const text = await withTimeout(callGemini(prompt, 15000), 15000);
  return text;
}

export function getMockQuestions(topic: string, count: number = 10): QuizQuestion[] {
  const base: QuizQuestion[] = [
    {
      id: "m1",
      type: "multiple_choice",
      question: `Which statement about ${topic} is correct?`,
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctAnswer: "Option A",
      explanation: "A concise explanation for the correct answer.",
      difficulty: "Medium",
      topic,
    },
    {
      id: "m2",
      type: "true_false",
      question: `${topic} can be studied using experiments. True or False?`,
      options: ["True", "False"],
      correctAnswer: "True",
      explanation: "Typically, aspects of the topic involve empirical methods.",
      difficulty: "Easy",
      topic,
    },
  ];
  const out: QuizQuestion[] = [];
  for (let i = 0; i < count; i++) {
    const t = base[i % base.length];
    out.push({ ...t, id: `${t.id}_${i}` });
  }
  return out;
}
