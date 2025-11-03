
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

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent";

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

async function callGemini(prompt: string, timeoutMs: number): Promise<string> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), timeoutMs + 2000);

  const url = `${GEMINI_API_URL}?key=${process.env.GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
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
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    }),
    signal: controller.signal,
  });
  clearTimeout(to);

  if (!res.ok) {
    const errText = await res.text();
    console.error("[Gemini] Error", res.status, errText);
    throw new Error(`Gemini ${res.status}`);
  }

  const data: any = await res.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return text.replace(/```json|```/g, "").trim();
}

export async function generateQuestionsWithChatGPT(
  topic: string,
  count: number = 10,
  opts?: { difficulty?: string; language?: string; timeoutMs?: number; retries?: number }
): Promise<QuizQuestion[]> {
  const difficulty = opts?.difficulty ?? "Medium";
  const language = opts?.language ?? "English";
  const timeoutMs = opts?.timeoutMs ?? 10000;
  const retries = opts?.retries ?? 2;

  const cacheKey = `cached_questions_${topic}_${difficulty}_${language}`;

  const prompt = `You are an expert quiz generator. Generate ${count} multiple-choice and true/false quiz questions about ${topic}.
Return ONLY a JSON array of objects with these exact keys:
- type: either "multiple_choice" or "true_false"
- question: the question text (string)
- options: array of strings (for multiple_choice use 4 options, for true_false use ["True","False"])
- correctAnswer: single string with the correct answer
- explanation: brief explanation (string)
- difficulty: one of "Easy", "Medium", "Hard", or "Challenge"
- topic: "${topic}"

Return only valid JSON, no markdown formatting.`;

  let attempt = 0;
  while (attempt <= retries) {
    try {
      console.log(`[AI] attempt ${attempt + 1}/${retries + 1} generating ${count} for ${topic}`);
      const text = await withTimeout(callGemini(prompt, timeoutMs), timeoutMs);
      const parsed = JSON.parse(text) as any[];
      const normalized: QuizQuestion[] = parsed.map((q: any, i: number) => ({
        id: `${Date.now()}_${i}`,
        type: (q?.type as QuizQuestion["type"]) ?? "multiple_choice",
        question: String(q?.question ?? ""),
        options: Array.isArray(q?.options) ? q.options.map((o: any) => String(o)) : ["True","False"],
        correctAnswer: Array.isArray(q?.correctAnswer)
          ? String(q.correctAnswer[0])
          : String(q?.correctAnswer ?? (q?.answer ?? "True")),
        explanation: String(q?.explanation ?? ""),
        difficulty: (q?.difficulty as QuizQuestion["difficulty"]) ?? (difficulty as any),
        topic: String(q?.topic ?? topic),
      }));

      await AsyncStorage.setItem(cacheKey, JSON.stringify(normalized));
      return normalized;
    } catch (err) {
      console.log("[AI] generation failed", err);
      attempt += 1;
      if (attempt > retries) break;
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }

  const cached = await AsyncStorage.getItem(cacheKey);
  if (cached) {
    console.warn("⚠️ Gemini failed, loading cached questions");
    return JSON.parse(cached) as QuizQuestion[];
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
Return ONLY a valid JSON object with these exact keys:
- type: one of "multipleChoice", "trueFalse", "fillBlank", "mediaBased", or "riddle"
- content: the question text (string)
- options: array of strings (for multipleChoice use 4 options, for trueFalse use ["True","False"])
- correctAnswer: single string with the correct answer
- explanation: brief explanation (string)

Return only valid JSON, no markdown formatting.`;
  
  const text = await withTimeout(callGemini(prompt, 8000), 8000);
  const obj = JSON.parse(text);
  return obj as SingleAIQuestion;
}

export async function getAIExplanation(
  question: string,
  userAnswer: string,
  correctAnswer: string,
  language: string = "English"
): Promise<string> {
  const prompt = `Explain in ${language} why the correct answer to the following question is "${correctAnswer}" and not "${userAnswer}". Be concise (2-3 sentences). Question: ${question}`;
  const text = await withTimeout(callGemini(prompt, 8000), 8000);
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
