import { z } from "zod";
import { publicProcedure } from "../../../create-context";
import { getUserProfile, addBadge } from "@/services/user.service";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

const BADGE_DEFINITIONS = {
  wise_scholar: {
    id: "wise_scholar",
    name: "Wise Scholar",
    description: "Reach Level 10",
    requirement: "level",
    threshold: 10,
    category: "progression",
  },
  history_warrior: {
    id: "history_warrior",
    name: "History Warrior",
    description: "50 correct history answers",
    requirement: "topic_correct_answers",
    topic: "history",
    threshold: 50,
    category: "topic",
  },
  battle_master: {
    id: "battle_master",
    name: "Battle Master",
    description: "10 ranked wins",
    requirement: "ranked_wins",
    threshold: 10,
    category: "battle",
  },
  curious_mind: {
    id: "curious_mind",
    name: "Curious Mind",
    description: "Play 7 days in a row",
    requirement: "daily_streak",
    threshold: 7,
    category: "engagement",
  },
} as const;

async function checkDailyStreak(uid: string): Promise<number> {
  const matchesRef = collection(db, "matches");
  const userMatchesQuery = query(
    matchesRef,
    where("participants", "array-contains", uid)
  );
  
  const matchesSnapshot = await getDocs(userMatchesQuery);
  
  if (matchesSnapshot.empty) return 0;
  
  const playDates: number[] = matchesSnapshot.docs
    .map(doc => doc.data().createdAt)
    .sort((a, b) => b - a);
  
  if (playDates.length === 0) return 0;
  
  let currentStreak = 1;
  const oneDayMs = 24 * 60 * 60 * 1000;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();
  
  const mostRecentDate = new Date(playDates[0]);
  mostRecentDate.setHours(0, 0, 0, 0);
  const mostRecentMs = mostRecentDate.getTime();
  
  if (todayMs - mostRecentMs > oneDayMs) {
    return 0;
  }
  
  for (let i = 1; i < playDates.length; i++) {
    const currentDate = new Date(playDates[i - 1]);
    currentDate.setHours(0, 0, 0, 0);
    
    const prevDate = new Date(playDates[i]);
    prevDate.setHours(0, 0, 0, 0);
    
    const daysDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / oneDayMs);
    
    if (daysDiff === 1) {
      currentStreak++;
    } else if (daysDiff > 1) {
      break;
    }
  }
  
  return currentStreak;
}

export const evaluateBadgesProcedure = publicProcedure
  .input(
    z.object({
      uid: z.string(),
    })
  )
  .mutation(async ({ input }) => {
    const { uid } = input;
    
    const user = await getUserProfile(uid);
    if (!user) {
      throw new Error("User not found");
    }

    const newlyAwardedBadges: string[] = [];
    const alreadyEarnedBadges = new Set(user.badges);

    if (!alreadyEarnedBadges.has("wise_scholar") && user.level >= 10) {
      await addBadge(uid, "wise_scholar");
      newlyAwardedBadges.push("wise_scholar");
      console.log(`Badge awarded: Wise Scholar to user ${uid}`);
    }

    const historyCorrectAnswers = user.stats.topicStats["history"]?.correctAnswers || 0;
    if (!alreadyEarnedBadges.has("history_warrior") && historyCorrectAnswers >= 50) {
      await addBadge(uid, "history_warrior");
      newlyAwardedBadges.push("history_warrior");
      console.log(`Badge awarded: History Warrior to user ${uid}`);
    }

    if (!alreadyEarnedBadges.has("battle_master") && user.stats.battlesWon >= 10) {
      await addBadge(uid, "battle_master");
      newlyAwardedBadges.push("battle_master");
      console.log(`Badge awarded: Battle Master to user ${uid}`);
    }

    const currentStreak = await checkDailyStreak(uid);
    if (!alreadyEarnedBadges.has("curious_mind") && currentStreak >= 7) {
      await addBadge(uid, "curious_mind");
      newlyAwardedBadges.push("curious_mind");
      console.log(`Badge awarded: Curious Mind to user ${uid}`);
    }

    return {
      success: true,
      newlyAwardedBadges,
      totalBadges: user.badges.length + newlyAwardedBadges.length,
      badgeDetails: newlyAwardedBadges.map(badgeId => {
        const badgeDef = BADGE_DEFINITIONS[badgeId as keyof typeof BADGE_DEFINITIONS];
        return {
          id: badgeId,
          name: badgeDef.name,
          description: badgeDef.description,
          requirement: badgeDef.requirement,
          category: badgeDef.category,
        };
      }),
    };
  });

export default evaluateBadgesProcedure;
