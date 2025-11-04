import AsyncStorage from "@react-native-async-storage/async-storage";

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

export function safeParseQuestions(text: string): any[] | null {
  try {
    const obj = JSON.parse(text);
    if (Array.isArray(obj)) return obj;
    if (Array.isArray((obj as any).questions)) return (obj as any).questions as any[];
  } catch {}
  const match = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  if (match) {
    try {
      const obj2 = JSON.parse(match[0]);
      if (Array.isArray(obj2)) return obj2 as any[];
      if (Array.isArray((obj2 as any).questions)) return (obj2 as any).questions as any[];
    } catch {}
  }
  return null;
}

export async function callGemini(prompt: string, timeoutMs: number = 15000): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? "";
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY — set GEMINI_API_KEY in your .env");
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
          temperature: 0.6,
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

  const prompt = `You are an expert quiz generator. Create ${count} questions about "${topic}" with difficulty "${difficulty}" in ${language}.
Return ONLY a valid JSON object with this exact structure:
{
  "questions": [
    {
      "type": "multiple_choice" | "true_false",
      "question": string,
      "options": string[],
      "correctAnswer": string,
      "explanation": string,
      "difficulty": "Easy" | "Medium" | "Hard" | "Challenge",
      "topic": "${topic}"
    }
  ]
}
Do NOT include markdown, backticks, or any commentary. Output JSON only.`;

  let attempt = 0;
  while (attempt <= retries) {
    try {
      console.log(`[AI] attempt ${attempt + 1}/${retries + 1} generating ${count} for ${topic}`);
      const text = await withTimeout(callGemini(prompt, timeoutMs), timeoutMs);
      const arr = safeParseQuestions(text);
      if (!arr) throw new Error("Invalid AI JSON format");
      const normalized: QuizQuestion[] = arr.map((q: any, i: number) => ({
        id: `${Date.now()}_${i}`,
        type: (q?.type as QuizQuestion["type"]) ?? "multiple_choice",
        question: String(q?.question ?? ""),
        options: Array.isArray(q?.options) ? q.options.map((o: any) => String(o)) : ["True", "False"],
        correctAnswer: Array.isArray(q?.correctAnswer)
          ? String((q.correctAnswer as any[])[0])
          : String(q?.correctAnswer ?? (q?.answer ?? "True")),
        explanation: String(q?.explanation ?? ""),
        difficulty: (q?.difficulty as QuizQuestion["difficulty"]) ?? (difficulty as any),
        topic: String(q?.topic ?? topic),
      }));

      await AsyncStorage.setItem(cacheKey, JSON.stringify(normalized));
      return normalized;
    } catch (err) {
      console.error("[AI] generation failed", err);
      attempt += 1;
      if (attempt > retries) break;
      const backoff = 2000 * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }

  const cached = await AsyncStorage.getItem(cacheKey);
  if (cached) {
    console.warn("Gemini failed, loading cached questions");
    try {
      return JSON.parse(cached) as QuizQuestion[];
    } catch (e) {
      console.error("[AI] cached parse error", e);
    }
  }

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
  const prompt = `You are an expert quiz generator. Generate exactly 1 quiz question about "${topic}" with difficulty "${difficulty}" in ${language}.
Return ONLY a valid JSON object with this exact structure:
{
  "questions": [
    {
      "type": "multipleChoice" | "trueFalse" | "fillBlank" | "mediaBased" | "riddle",
      "content": string,
      "options": string[],
      "correctAnswer": string,
      "explanation": string
    }
  ]
}
Do NOT include markdown or explanations. Output JSON only.`;

  const text = await withTimeout(callGemini(prompt, 15000), 15000);
  const arr = safeParseQuestions(text);
  if (!arr || arr.length === 0) {
    console.error("[AI] single question parse failed");
    throw new Error("AI failed to generate a question");
  }
  const q = arr[0] as any;
  const out: SingleAIQuestion = {
    type: (q?.type as SingleAIQuestion["type"]) ?? "multipleChoice",
    content: String(q?.content ?? q?.question ?? ""),
    options: Array.isArray(q?.options) ? (q.options as string[]) : ["True", "False"],
    correctAnswer: String(q?.correctAnswer ?? (Array.isArray(q?.correctAnswer) ? String(q.correctAnswer[0]) : "True")),
    explanation: String(q?.explanation ?? ""),
  };
  return out;
}

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
