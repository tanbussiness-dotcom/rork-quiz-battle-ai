import { APP_CONFIG } from "./config";

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

async function callOpenAI(messages: { role: "system" | "user" | "assistant"; content: string }[]) {
  const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OpenAI API key. Set EXPO_PUBLIC_OPENAI_API_KEY");
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 1200,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.log("OpenAI error", res.status, text);
    throw new Error("OpenAI request failed");
  }

  const json = (await res.json()) as any;
  const content: string = json?.choices?.[0]?.message?.content ?? "";
  return content;
}

export async function generateQuestions(
  params: GenerateQuestionsParams
): Promise<QuizQuestion[]> {
  const { topic, difficulty, count, language = "English" } = params;

  const userPrompt = `Generate ${count} quiz questions about "${topic}" with "${difficulty}" difficulty in ${language}.
Return ONLY a valid JSON array with NO markdown formatting or extra text. Each item must match:
{
  "type": "multiple_choice" | "true_false",
  "question": "...",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": "A",
  "explanation": "...",
  "difficulty": "${difficulty}",
  "topic": "${topic}"
}
Rules:
- Mix types: multiple_choice (60%), true_false (40%).
- For true_false use options ["True", "False"].
- correctAnswer must exactly match one of options.
- Return ONLY the JSON array.`;

  try {
    let text = await callOpenAI([
      { role: "system", content: "You generate JSON-only quiz data. Never include markdown fences." },
      { role: "user", content: userPrompt },
    ]);

    text = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const questions = JSON.parse(text);

    return (questions as any[]).map((q: any, index: number) => ({
      ...q,
      id: `${Date.now()}_${index}`,
      type: (q?.type as QuizQuestion["type"]) ?? "multiple_choice",
      difficulty: difficulty as QuizQuestion["difficulty"],
      topic,
    }));
  } catch (error) {
    console.error("Error generating questions:", error);
    throw new Error("Failed to generate questions. Please try again.");
  }
}

export interface GenerateSingleQuestionParams {
  topic: string;
  difficulty: string; // expected: easy|medium|hard|challenge
  language?: string; // ISO language name or code
}

export type UserRequestedQuestion = {
  type: "multipleChoice" | "trueFalse" | "fillBlank" | "mediaBased" | "riddle";
  content: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: "easy" | "medium" | "hard" | "challenge";
};

export async function generateSingleQuestion(
  params: GenerateSingleQuestionParams
): Promise<UserRequestedQuestion> {
  const { topic, difficulty, language = "English" } = params;

  const userPrompt = `Generate exactly one quiz question on the topic "${topic}" with difficulty "${difficulty}" in ${language}.
Return ONLY a JSON object with this exact shape (no markdown, no commentary):
{
  "type": "multipleChoice | trueFalse | fillBlank | mediaBased | riddle",
  "content": "...",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": "B",
  "explanation": "Short reason",
  "difficulty": "${difficulty}"
}
Rules:
- If type is trueFalse, options must be ["True", "False"].
- If type is fillBlank or riddle, omit options.
- Prefer multipleChoice unless the topic fits another type.
- content max 200 chars. Ensure valid JSON.`;

  try {
    let text = await callOpenAI([
      { role: "system", content: "You return only strict JSON with double quotes." },
      { role: "user", content: userPrompt },
    ]);
    text = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(text) as UserRequestedQuestion;
    return parsed;
  } catch (error) {
    console.error("Error generating single question:", error);
    throw new Error("Failed to generate question");
  }
}

export async function getAIExplanation(
  question: string,
  userAnswer: string,
  correctAnswer: string,
  language: string = "English"
): Promise<string> {
  const userPrompt = `As an AI mentor, explain in ${language} why the answer to this question is "${correctAnswer}" and not "${userAnswer}". Be concise (2-3 sentences), encouraging, and specific.\n\nQuestion: ${question}`;

  try {
    const text = await callOpenAI([
      { role: "system", content: "You are a helpful, concise tutor." },
      { role: "user", content: userPrompt },
    ]);
    return text.trim();
  } catch (error) {
    console.error("Error getting AI explanation:", error);
    return "The correct answer differs from your selection. Keep practicing!";
  }
}
