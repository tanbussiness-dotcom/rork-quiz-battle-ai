
console.log("🔍 [Quiz Battle AI] Checking OpenAI key...");
const hasKey = !!process.env.OPENAI_API_KEY;
console.log("🔍 [Quiz Battle AI] OPENAI_API_KEY exists:", hasKey);
console.log("🔍 [Quiz Battle AI] Key length:", process.env.OPENAI_API_KEY?.length || 0);

if (!hasKey) {
  console.error("❌ Missing OPENAI_API_KEY. Please set it in Rork AI environment.");
}

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

async function callOpenAI(prompt: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OpenAI API key. Please set OPENAI_API_KEY in environment.");
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are an expert quiz generator and explainer. Return only requested format." },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("❌ [OpenAI Error]", res.status, err);
    throw new Error(`OpenAI API error: ${res.status}`);
  }

  const data: any = await res.json();
  const text: string = data.choices?.[0]?.message?.content?.trim?.() ?? "";
  return text.replace(/```json|```/g, "").trim();
}

export async function generateQuestions(params: GenerateQuestionsParams): Promise<QuizQuestion[]> {
  const { topic, difficulty, count, language = "English" } = params;

  const prompt = `
Generate ${count} quiz questions about "${topic}" with difficulty "${difficulty}" in ${language}.
Return ONLY a valid JSON array (no markdown, no explanation text). Example structure:
[
  {
    "type": "multiple_choice" | "true_false",
    "question": "...",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "A",
    "explanation": "...",
    "difficulty": "${difficulty}",
    "topic": "${topic}"
  }
]
Rules:
- Mix types: multiple_choice (60%), true_false (40%)
- For true_false, options must be ["True","False"]
- Keep JSON valid
`;

  const text = await callOpenAI(prompt);
  const data = JSON.parse(text);
  return (data as any[]).map((q: any, i: number) => ({
    id: `${Date.now()}_${i}`,
    ...q,
  }));
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
  const prompt = `Generate exactly 1 quiz question about "${topic}" with difficulty "${difficulty}" in ${language}. Return ONLY valid JSON object with keys: type (one of multipleChoice,trueFalse,fillBlank,mediaBased,riddle), content, options (array for multipleChoice or [\"True\",\"False\"] for trueFalse), correctAnswer (string), explanation (string).`;
  const text = await callOpenAI(prompt);
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
  const text = await callOpenAI(prompt);
  return text;
}
