import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import evaluateBadgesProcedure from "./routes/badges/evaluate/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  badges: createTRPCRouter({
    evaluate: evaluateBadgesProcedure,
  }),
});

export type AppRouter = typeof appRouter;
