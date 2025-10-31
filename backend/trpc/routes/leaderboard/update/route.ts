import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { 
  doc, 
  getDoc, 
  setDoc, 
  increment
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getUserProfile } from "@/services/user.service";
import type { LeaderboardPeriod } from "@/models";

export const updateLeaderboardProcedure = publicProcedure
  .input(
    z.object({
      uid: z.string(),
      mode: z.enum(["solo", "battle"]),
      points: z.number(),
      won: z.boolean().optional(),
      accuracy: z.number().optional(),
    })
  )
  .mutation(async ({ input }) => {
    const { uid, mode, points, won, accuracy } = input;
    
    const user = await getUserProfile(uid);
    if (!user) {
      throw new Error("User not found");
    }

    const periods: LeaderboardPeriod[] = ["daily", "weekly", "monthly", "all_time"];
    const results: Record<string, any> = {};

    for (const period of periods) {
      const docId = `${uid}_${mode}_${period}`;
      const docRef = doc(db, "leaderboard", docId);
      
      const existingDoc = await getDoc(docRef);
      const now = Date.now();
      
      if (existingDoc.exists()) {
        const data = existingDoc.data();
        
        const newGamesPlayed = (data.gamesPlayed || 0) + 1;
        const newWins = won ? (data.wins || 0) + 1 : (data.wins || 0);
        const newWinRate = newWins / newGamesPlayed;
        
        const oldTotalAccuracy = (data.accuracy || 0) * (data.gamesPlayed || 0);
        const newTotalAccuracy = oldTotalAccuracy + (accuracy || 0);
        const newAccuracy = newTotalAccuracy / newGamesPlayed;

        await setDoc(docRef, {
          points: increment(points),
          gamesPlayed: newGamesPlayed,
          wins: newWins,
          winRate: newWinRate,
          accuracy: newAccuracy,
          updatedAt: now,
        }, { merge: true });

        console.log(`Leaderboard updated: ${docId} +${points} points`);
        
        results[period] = {
          points: (data.points || 0) + points,
          gamesPlayed: newGamesPlayed,
          winRate: newWinRate,
          accuracy: newAccuracy,
        };
      } else {
        const winRate = won ? 1 : 0;
        
        await setDoc(docRef, {
          id: docId,
          userId: uid,
          username: user.displayName,
          avatar: user.photoURL,
          rank: 0,
          points: points,
          mode: mode,
          period: period,
          gamesPlayed: 1,
          wins: won ? 1 : 0,
          winRate: winRate,
          accuracy: accuracy || 0,
          updatedAt: now,
          createdAt: now,
        });

        console.log(`New leaderboard entry created: ${docId}`);
        
        results[period] = {
          points: points,
          gamesPlayed: 1,
          winRate: winRate,
          accuracy: accuracy || 0,
        };
      }
    }

    return {
      success: true,
      results,
      message: `Leaderboard updated for user ${uid} in ${mode} mode`,
    };
  });

export default updateLeaderboardProcedure;
