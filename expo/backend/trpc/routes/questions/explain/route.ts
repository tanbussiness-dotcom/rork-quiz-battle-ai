import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAIExplanation } from "@/lib/gemini";

const inputSchema = z.object({
  questionId: z.string().min(1),
  playerAnswer: z.string().min(1),
  language: z.string().optional(),
});

const COLLECTION = "questions";

const explainAnswerProcedure = publicProcedure
  .input(inputSchema)
  .mutation(async ({ input }) => {
    const { questionId, playerAnswer, language } = input;

    const ref = doc(db, COLLECTION, questionId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      throw new Error("Question not found");
    }

    const data = snap.data() as {
      content?: string;
      question?: string;
      correctAnswer?: string;
      language?: string;
    };

    const questionText = (data?.content ?? data?.question ?? "").toString();
    const correctAnswer = (data?.correctAnswer ?? "").toString();
    const lang = language ?? (data?.language ?? "English");

    if (!questionText || !correctAnswer) {
      throw new Error("Question is missing required fields");
    }

    const explanation = await getAIExplanation(
      questionText,
      playerAnswer,
      correctAnswer,
      lang
    );

    return { explanation };
  });

export default explainAnswerProcedure;