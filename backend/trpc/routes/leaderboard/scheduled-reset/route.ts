import { publicProcedure } from "../../../create-context";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  writeBatch
} from "firebase/firestore";
import { db } from "@/lib/firebase";

function shouldResetDaily(): boolean {
  const now = new Date();
  return now.getHours() === 0 && now.getMinutes() < 5;
}

function shouldResetWeekly(): boolean {
  const now = new Date();
  return now.getDay() === 1 && now.getHours() === 0 && now.getMinutes() < 5;
}

function shouldResetMonthly(): boolean {
  const now = new Date();
  return now.getDate() === 1 && now.getHours() === 0 && now.getMinutes() < 5;
}

async function resetLeaderboardByPeriod(period: "daily" | "weekly" | "monthly"): Promise<number> {
  const leaderboardRef = collection(db, "leaderboard");
  const leaderboardQuery = query(
    leaderboardRef,
    where("period", "==", period)
  );
  
  const snapshot = await getDocs(leaderboardQuery);
  
  if (snapshot.empty) {
    return 0;
  }

  const batch = writeBatch(db);
  let count = 0;
  
  snapshot.docs.forEach((docSnapshot) => {
    batch.delete(docSnapshot.ref);
    count++;
  });
  
  await batch.commit();
  
  console.log(`[Scheduled] Reset ${count} ${period} leaderboard entries`);
  
  return count;
}

export const scheduledLeaderboardResetProcedure = publicProcedure
  .mutation(async () => {
    const results: {
      daily?: number;
      weekly?: number;
      monthly?: number;
    } = {};
    
    if (shouldResetDaily()) {
      console.log("Running daily leaderboard reset...");
      results.daily = await resetLeaderboardByPeriod("daily");
    }
    
    if (shouldResetWeekly()) {
      console.log("Running weekly leaderboard reset...");
      results.weekly = await resetLeaderboardByPeriod("weekly");
    }
    
    if (shouldResetMonthly()) {
      console.log("Running monthly leaderboard reset...");
      results.monthly = await resetLeaderboardByPeriod("monthly");
    }
    
    return {
      success: true,
      results,
      message: "Leaderboard reset check completed",
      timestamp: Date.now(),
    };
  });

export default scheduledLeaderboardResetProcedure;
