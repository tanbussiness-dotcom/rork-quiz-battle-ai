import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect, useCallback, useMemo } from "react";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthContext";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { enqueueProgressUpdate, flushProgressQueue } from "@/services/offline.service";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  level: number;
  rank: string;
  rankPoints: number;
  totalScore: number;
  totalQuestions: number;
  correctAnswers: number;
  soloGamesPlayed: number;
  battleGamesPlayed: number;
  battleGamesWon: number;
  currentStreak: number;
  longestStreak: number;
  badges: string[];
  createdAt: Date;
  lastPlayedAt: Date;
}

interface UserProfileContextType {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  incrementScore: (points: number) => Promise<void>;
  incrementStreak: () => Promise<void>;
  resetStreak: () => Promise<void>;
  addBadge: (badge: string) => Promise<void>;
}

const RANK_TIERS = [
  { name: "Bronze", minPoints: 0 },
  { name: "Silver", minPoints: 100 },
  { name: "Gold", minPoints: 300 },
  { name: "Platinum", minPoints: 600 },
  { name: "Diamond", minPoints: 1000 },
  { name: "Master", minPoints: 1500 },
  { name: "Challenger", minPoints: 2500 },
];

function calculateRank(points: number): string {
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (points >= RANK_TIERS[i].minPoints) {
      return RANK_TIERS[i].name;
    }
  }
  return "Bronze";
}

export const [UserProfileProvider, useUserProfile] = createContextHook<UserProfileContextType>(() => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const online = useOnlineStatus();

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data() as Record<string, unknown>;

          const toDateSafe = (val: unknown): Date => {
            try {
              if (val == null) return new Date();
              if (val instanceof Date) return val;
              if (typeof val === 'number') return new Date(val);
              if (typeof val === 'string') {
                const d = new Date(val);
                return isNaN(d.getTime()) ? new Date() : d;
              }
              if (typeof val === 'object') {
                const anyVal = val as { toDate?: () => Date };
                if (typeof anyVal.toDate === 'function') {
                  const d = anyVal.toDate();
                  return d instanceof Date ? d : new Date();
                }
              }
            } catch (e) {
              console.log('toDateSafe error', e);
            }
            return new Date();
          };

          setProfile({
            ...(data as object),
            createdAt: toDateSafe((data as any).createdAt),
            lastPlayedAt: toDateSafe((data as any).lastPlayedAt),
          } as UserProfile);
        } else {
          const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email || "",
            displayName: user.displayName || user.email?.split("@")[0] || "Player",
            level: 1,
            rank: "Bronze",
            rankPoints: 0,
            totalScore: 0,
            totalQuestions: 0,
            correctAnswers: 0,
            soloGamesPlayed: 0,
            battleGamesPlayed: 0,
            battleGamesWon: 0,
            currentStreak: 0,
            longestStreak: 0,
            badges: [],
            createdAt: new Date(),
            lastPlayedAt: new Date(),
          };

          await setDoc(docRef, {
            ...newProfile,
            createdAt: serverTimestamp(),
            lastPlayedAt: serverTimestamp(),
          });

          setProfile(newProfile);
        }
      } catch (err: any) {
        console.error("Error loading profile:", err);
        setError(err.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  useEffect(() => {
    if (online) {
      void flushProgressQueue().then((r) => {
        console.log("Flushed progress queue", r);
      });
    }
  }, [online]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user || !profile) return;

    try {
      const docRef = doc(db, "users", user.uid);
      await updateDoc(docRef, {
        ...updates,
        lastPlayedAt: serverTimestamp(),
      });

      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(err.message || "Failed to update profile");
      if (user) {
        await enqueueProgressUpdate({ type: "updateProfile", uid: user.uid, updates });
        setProfile((prev) => (prev ? { ...prev, ...updates } : null));
        return;
      }
      throw err;
    }
  }, [user, profile]);

  const incrementScore = useCallback(async (points: number) => {
    if (!profile) return;

    const newTotalScore = profile.totalScore + points;
    const newRankPoints = profile.rankPoints + points;
    const newRank = calculateRank(newRankPoints);

    await updateProfile({
      totalScore: newTotalScore,
      rankPoints: newRankPoints,
      rank: newRank,
    });
  }, [profile, updateProfile]);

  const incrementStreak = useCallback(async () => {
    if (!profile) return;

    const newStreak = profile.currentStreak + 1;
    const newLongest = Math.max(newStreak, profile.longestStreak);

    await updateProfile({
      currentStreak: newStreak,
      longestStreak: newLongest,
    });
  }, [profile, updateProfile]);

  const resetStreak = useCallback(async () => {
    if (!profile) return;

    await updateProfile({
      currentStreak: 0,
    });
  }, [profile, updateProfile]);

  const addBadge = useCallback(async (badge: string) => {
    if (!profile || profile.badges.includes(badge)) return;

    const newBadges = [...profile.badges, badge];

    await updateProfile({
      badges: newBadges,
    });
  }, [profile, updateProfile]);

  return useMemo(
    () => ({
      profile,
      loading,
      error,
      updateProfile,
      incrementScore,
      incrementStreak,
      resetStreak,
      addBadge,
    }),
    [profile, loading, error, updateProfile, incrementScore, incrementStreak, resetStreak, addBadge]
  );
});
