import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import evaluateBadgesProcedure from "./routes/badges/evaluate/route";
import generateQuestionProcedure from "./routes/questions/generate/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  badges: createTRPCRouter({
    evaluate: evaluateBadgesProcedure,
  }),
  questions: createTRPCRouter({
    generate: generateQuestionProcedure,
  }),
});

export type AppRouter = typeof appRouter;
