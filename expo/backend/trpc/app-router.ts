import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import evaluateBadgesProcedure from "./routes/badges/evaluate/route";
import generateQuestionProcedure from "./routes/questions/generate/route";
import explainAnswerProcedure from "./routes/questions/explain/route";
import evaluateBattleResultsProcedure from "./routes/matches/evaluate-results/route";
import updateLeaderboardProcedure from "./routes/leaderboard/update/route";
import resetLeaderboardProcedure from "./routes/leaderboard/reset/route";
import scheduledLeaderboardResetProcedure from "./routes/leaderboard/scheduled-reset/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  badges: createTRPCRouter({
    evaluate: evaluateBadgesProcedure,
  }),
  questions: createTRPCRouter({
    generate: generateQuestionProcedure,
    explain: explainAnswerProcedure,
  }),
  matches: createTRPCRouter({
    evaluateResults: evaluateBattleResultsProcedure,
  }),
  leaderboard: createTRPCRouter({
    update: updateLeaderboardProcedure,
    reset: resetLeaderboardProcedure,
    scheduledReset: scheduledLeaderboardResetProcedure,
  }),
});

export type AppRouter = typeof appRouter;
