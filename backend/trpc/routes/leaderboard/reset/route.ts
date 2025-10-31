import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export const resetLeaderboardProcedure = publicProcedure
  .input(
    z.object({
      period: z.enum(["daily", "weekly", "monthly"]),
    })
  )
  .mutation(async ({ input }) => {
    const { period } = input;
    
    console.log(`Resetting ${period} leaderboard...`);
    
    const leaderboardRef = collection(db, "leaderboard");
    const leaderboardQuery = query(
      leaderboardRef,
      where("period", "==", period)
    );
    
    const snapshot = await getDocs(leaderboardQuery);
    
    if (snapshot.empty) {
      console.log(`No ${period} leaderboard entries found to reset`);
      return {
        success: true,
        deletedCount: 0,
        message: `No ${period} leaderboard entries found`,
      };
    }

    const batch = writeBatch(db);
    let count = 0;
    
    snapshot.docs.forEach((docSnapshot) => {
      batch.delete(docSnapshot.ref);
      count++;
    });
    
    await batch.commit();
    
    console.log(`Reset ${count} ${period} leaderboard entries`);
    
    return {
      success: true,
      deletedCount: count,
      message: `Successfully reset ${count} ${period} leaderboard entries`,
    };
  });

export default resetLeaderboardProcedure;
