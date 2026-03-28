import { ref, set, get, update, onValue, off, push, serverTimestamp } from "firebase/database";
import { realtimeDb } from "@/lib/firebase";
import type { BattleAnswer } from "@/models";
import { REALTIME_DB_PATHS, BATTLE_CONFIG } from "@/models/schema";

export type MatchNode = {
  roomId: string;
  topic: string;
  difficulty: string;
  participants: string[];
  currentQuestionIndex: number;
  playerAnswers: Record<string, BattleAnswer[]>;
  scores: Record<string, number>;
  countdown: {
    durationMs: number;
    endsAt: number; // client compares Date.now() to compute remaining
    running: boolean;
    serverNow?: number; // optional reference time for clients
  };
  result?: {
    winnerId: string | null; // null => draw
    scores: Record<string, number>;
    finishedAt: number;
  };
  createdAt: number;
  updatedAt: number;
};

const MATCHES_PATH = REALTIME_DB_PATHS.MATCHES;

export async function initMatchNode(params: {
  roomId: string;
  players: string[];
  topic: string;
  difficulty: string;
}): Promise<void> {
  const { roomId, players, topic, difficulty } = params;
  const matchRef = ref(realtimeDb, `${MATCHES_PATH}/${roomId}`);

  const initial: MatchNode = {
    roomId,
    topic,
    difficulty,
    participants: players,
    currentQuestionIndex: 0,
    playerAnswers: players.reduce((acc, uid) => {
      acc[uid] = [];
      return acc;
    }, {} as Record<string, BattleAnswer[]>),
    scores: players.reduce((acc, uid) => {
      acc[uid] = 0;
      return acc;
    }, {} as Record<string, number>),
    countdown: {
      durationMs: BATTLE_CONFIG.TIME_LIMIT_SECONDS * 1000,
      endsAt: Date.now() + BATTLE_CONFIG.TIME_LIMIT_SECONDS * 1000,
      running: true,
      serverNow: Date.now(),
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await set(matchRef, initial);
  console.log("initMatchNode created:", roomId);
}

export async function setCurrentQuestionIndex(roomId: string, index: number): Promise<void> {
  const matchRef = ref(realtimeDb, `${MATCHES_PATH}/${roomId}`);
  await update(matchRef, {
    currentQuestionIndex: index,
    updatedAt: Date.now(),
  });
}

export async function startCountdown(roomId: string, seconds: number = BATTLE_CONFIG.TIME_LIMIT_SECONDS): Promise<void> {
  const matchRef = ref(realtimeDb, `${MATCHES_PATH}/${roomId}/countdown`);
  const durationMs = seconds * 1000;
  await update(matchRef, {
    durationMs,
    endsAt: Date.now() + durationMs,
    running: true,
    serverNow: Date.now(),
  });
}

export async function stopCountdown(roomId: string): Promise<void> {
  const matchRef = ref(realtimeDb, `${MATCHES_PATH}/${roomId}/countdown`);
  await update(matchRef, {
    running: false,
    serverNow: Date.now(),
  });
}

export async function submitPlayerAnswer(roomId: string, uid: string, answer: BattleAnswer): Promise<void> {
  const matchRef = ref(realtimeDb, `${MATCHES_PATH}/${roomId}`);
  const snap = await get(matchRef);
  if (!snap.exists()) throw new Error("Match not found");

  const match = snap.val() as MatchNode;
  const answersForUser = match.playerAnswers?.[uid] ?? [];

  const updatedAnswers = { ...match.playerAnswers, [uid]: [...answersForUser, answer] };
  const delta = answer.isCorrect ? BATTLE_CONFIG.POINTS_PER_CORRECT : -BATTLE_CONFIG.POINTS_LOST_INCORRECT;
  const newScore = Math.max(0, (match.scores?.[uid] ?? 0) + delta);
  const updatedScores = { ...match.scores, [uid]: newScore };

  await update(matchRef, {
    playerAnswers: updatedAnswers,
    scores: updatedScores,
    updatedAt: Date.now(),
  });

  console.log("submitPlayerAnswer", { roomId, uid, isCorrect: answer.isCorrect, newScore });
}

export function subscribeToMatch(
  roomId: string,
  callback: (node: MatchNode | null) => void
): () => void {
  const matchRef = ref(realtimeDb, `${MATCHES_PATH}/${roomId}`);
  const unsub = onValue(matchRef, (s) => {
    if (!s.exists()) return callback(null);
    callback(s.val() as MatchNode);
  });
  return () => off(matchRef, "value", unsub);
}

export async function setMatchResult(roomId: string, result: { winnerId: string | null; scores: Record<string, number> }): Promise<void> {
  const matchRef = ref(realtimeDb, `${MATCHES_PATH}/${roomId}`);
  await update(matchRef, {
    result: { ...result, finishedAt: Date.now() },
    updatedAt: Date.now(),
  });
}
