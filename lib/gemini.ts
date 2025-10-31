import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_CONFIG } from "./config";

const genAI = new GoogleGenerativeAI(GEMINI_CONFIG.apiKey);

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

export async function generateQuestions(
  params: GenerateQuestionsParams
): Promise<QuizQuestion[]> {
  const { topic, difficulty, count, language = "English" } = params;

  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `Generate ${count} quiz questions about "${topic}" with "${difficulty}" difficulty in ${language}.

Return ONLY a valid JSON array with NO markdown formatting, explanations, or additional text. Each question must follow this exact structure:

[
  {
    "type": "multiple_choice",
    "question": "question text here",
    "options": ["option1", "option2", "option3", "option4"],
    "correctAnswer": "option1",
    "explanation": "detailed explanation here",
    "difficulty": "${difficulty}",
    "topic": "${topic}"
  }
]

Requirements:
1. Mix question types: multiple_choice (60%), true_false (40%)
2. For true_false, use options ["True", "False"]
3. correctAnswer must exactly match one of the options
4. Make questions engaging and educational
5. Ensure proper ${language} grammar
6. Return ONLY the JSON array, no other text`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    text = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    
    const questions = JSON.parse(text);
    
    return questions.map((q: any, index: number) => ({
      ...q,
      id: `${Date.now()}_${index}`,
      type: q.type || "multiple_choice",
      difficulty: difficulty as QuizQuestion["difficulty"],
      topic,
    }));
  } catch (error) {
    console.error("Error generating questions:", error);
    throw new Error("Failed to generate questions. Please try again.");
  }
}

export async function getAIExplanation(
  question: string,
  userAnswer: string,
  correctAnswer: string,
  language: string = "English"
): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `As an AI mentor, explain in ${language} why the answer to this question is "${correctAnswer}" and not "${userAnswer}".

Question: ${question}
User's answer: ${userAnswer}
Correct answer: ${correctAnswer}

Provide a brief, encouraging explanation (2-3 sentences).`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error getting AI explanation:", error);
    return "The correct answer is different from your selection. Keep practicing!";
  }
}
