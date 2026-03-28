import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { ref, get } from "firebase/database";
import { realtimeDb } from "@/lib/firebase";
import { BATTLE_CONFIG, RANK_POINT_THRESHOLDS, REALTIME_DB_PATHS } from "@/models/schema";
import type { RankTier, User } from "@/models";
import { getUserProfile, updateRank } from "@/services/user.service";
import { setMatchResult } from "@/services/match.service";
import { updatePlayerProgress } from "@/services/user.service";

function computeRankTier(points: number): RankTier {
  const entries = Object.entries(RANK_POINT_THRESHOLDS) as [RankTier, number][];
  let current: RankTier = "Bronze";
  for (const [tier, threshold] of entries) {
    if (points >= threshold) current = tier;
  }
  return current;
}

export const evaluateBattleResultsProcedure = publicProcedure
  .input(z.object({ roomId: z.string().min(1), topic: z.string().optional() }))
  .mutation(async ({ input }) => {
    const { roomId, topic } = input;

    const nodeRef = ref(realtimeDb, `${REALTIME_DB_PATHS.MATCHES}/${roomId}`);
    const snap = await get(nodeRef);
    if (!snap.exists()) {
      throw new Error("Match node not found");
    }

    const node = snap.val() as {
      participants: string[];
      scores: Record<string, number>;
      playerAnswers?: Record<string, { isCorrect: boolean }[]>;
      difficulty?: string;
      topic?: string;
    };

    const participants = node.participants ?? [];
    if (participants.length < 1) throw new Error("No participants");

    const scores = node.scores ?? {};
    const sorted = [...participants].sort((a, b) => (scores[b] ?? 0) - (scores[a] ?? 0));
    const top = sorted[0];
    const second = sorted[1] ?? null;

    let winnerId: string | null = null;
    if (second === null) {
      winnerId = top ?? null;
    } else {
      if ((scores[top] ?? 0) > (scores[second] ?? 0)) winnerId = top; else winnerId = null; // draw if tie
    }

    const changes: Record<string, number> = {};

    for (const uid of participants) {
      const win = winnerId !== null && uid === winnerId;
      const delta = win ? BATTLE_CONFIG.RANK_POINTS_WIN : (winnerId === null ? 0 : -BATTLE_CONFIG.RANK_POINTS_LOSS);
      changes[uid] = delta;
    }

    const results: { uid: string; before: number; after: number; newTier: RankTier }[] = [];

    for (const uid of participants) {
      const profile = await getUserProfile(uid);
      if (!profile) continue;
      const before = profile.challengePoints;
      const delta = changes[uid] ?? 0;
      const after = Math.max(0, before + delta);
      const newTier = computeRankTier(after);
      await updateRank(uid, newTier, delta);
      results.push({ uid, before, after, newTier });

      const answers = node.playerAnswers?.[uid] ?? [];
      const correct = answers.filter((a) => a?.isCorrect === true).length;
      const total = answers.length;
      // use final score as computed
      await updatePlayerProgress(uid, scores[uid] ?? 0, correct, total, "battle", topic ?? node.topic ?? undefined);
    }

    await setMatchResult(roomId, { winnerId, scores });

    return {
      roomId,
      winnerId,
      scores,
      rankChanges: changes,
      updated: results,
    };
  });

export default evaluateBattleResultsProcedure;
