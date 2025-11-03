import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { APP_CONFIG } from "@/lib/config";
import { generateSingleQuestion } from "@/lib/gemini";

const inputSchema = z.object({
  topic: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard", "challenge"]).default("medium"),
  language: z.string().default("en"),
});

function toTitleCaseDifficulty(d: string): "Easy" | "Medium" | "Hard" | "Challenge" {
  switch (d.toLowerCase()) {
    case "easy":
      return "Easy";
    case "hard":
      return "Hard";
    case "challenge":
      return "Challenge";
    default:
      return "Medium";
  }
}

function mapType(t: string): "multiple_choice" | "true_false" | "fill_blank" | "image_based" | "riddle" {
  switch (t) {
    case "multipleChoice":
      return "multiple_choice";
    case "trueFalse":
      return "true_false";
    case "fillBlank":
      return "fill_blank";
    case "mediaBased":
      return "image_based";
    case "riddle":
      return "riddle";
    default:
      return "multiple_choice";
  }
}

const COLLECTION = "questions";

const generateQuestionProcedure = publicProcedure
  .input(inputSchema)
  .mutation(async ({ input }) => {
    console.log("🔍 [Generate Question] Starting generation...");
    console.log("🔍 [Generate Question] GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);
    console.log("🔍 [Generate Question] Key length:", process.env.GEMINI_API_KEY?.length || 0);
    
    if (!process.env.GEMINI_API_KEY) {
      console.error("❌ [Generate Question] Missing GEMINI_API_KEY");
      throw new Error("Gemini API key not configured on server. Please contact support.");
    }
    
    const { topic, difficulty, language } = input;
    
    let ai;
    try {
      ai = await generateSingleQuestion({ topic, difficulty, language });
    } catch (aiError: any) {
      console.error("❌ [Generate Question] AI generation failed:", aiError);
      throw new Error(`Failed to generate question: ${aiError.message}`);
    }
    
    const saved = {
      type: mapType(ai.type),
      content: ai.content,
      options: ai.options ?? null,
      correctAnswer: ai.correctAnswer,
      explanation: ai.explanation,
      difficulty: toTitleCaseDifficulty(difficulty),
      topic,
      mediaUrl: null,
      source: "ai" as const,
      createdByAI: true,
      timeLimit: APP_CONFIG.questionTimeLimit,
      createdAt: Date.now(),
      language,
    };

    const docRef = await addDoc(collection(db, COLLECTION), saved as any);

    return {
      id: docRef.id,
      ...saved,
      // Also return user-requested shape for convenience
      userShape: {
        type: ai.type,
        content: ai.content,
        options: ai.options ?? undefined,
        correctAnswer: ai.correctAnswer,
        explanation: ai.explanation,
        difficulty,
      },
    };
  });

export default generateQuestionProcedure;
