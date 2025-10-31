import {
  ref,
  set,
  get,
  update,
  remove,
  onValue,
  off,
  push,
} from "firebase/database";
import { realtimeDb } from "@/lib/firebase";
import type { BattleRoom, BattlePlayer, BattleAnswer, BattleResult } from "@/models";
import { getUserProfile } from "@/services/user.service";

const ROOMS_PATH = "battle_rooms";
const RESULTS_PATH = "battle_results";

export async function createBattleRoom(
  hostId: string,
  hostName: string,
  roomData: {
    name: string;
    password?: string;
    topic: string;
    difficulty: string;
    maxPlayers?: number;
  }
): Promise<string> {
  const roomRef = push(ref(realtimeDb, ROOMS_PATH));
  const roomId = roomRef.key!;

  const room: BattleRoom = {
    id: roomId,
    hostId,
    hostName,
    name: roomData.name,
    password: roomData.password,
    isPublic: !roomData.password,
    topic: roomData.topic,
    difficulty: roomData.difficulty,
    maxPlayers: roomData.maxPlayers || 2,
    currentPlayers: 1,
    players: [
      {
        uid: hostId,
        displayName: hostName,
        score: 0,
        answers: [],
        isReady: false,
        joinedAt: Date.now(),
      },
    ],
    status: "waiting",
    currentQuestionIndex: 0,
    questions: [],
    createdAt: Date.now(),
  };

  await set(roomRef, room);
  console.log("Battle room created:", roomId);
  return roomId;
}

export async function joinBattleRoom(
  roomId: string,
  userId: string,
  displayName: string,
  password?: string
): Promise<void> {
  const roomRef = ref(realtimeDb, `${ROOMS_PATH}/${roomId}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) {
    throw new Error("Room not found");
  }

  const room = snapshot.val() as BattleRoom;

  if (room.password && room.password !== password) {
    throw new Error("Invalid password");
  }

  if (room.currentPlayers >= room.maxPlayers) {
    throw new Error("Room is full");
  }

  if (room.status !== "waiting") {
    throw new Error("Game already started");
  }

  const newPlayer: BattlePlayer = {
    uid: userId,
    displayName,
    score: 0,
    answers: [],
    isReady: false,
    joinedAt: Date.now(),
  };

  await update(roomRef, {
    players: [...room.players, newPlayer],
    currentPlayers: room.currentPlayers + 1,
  });

  console.log(`Player ${userId} joined room ${roomId}`);
}

export async function leaveBattleRoom(
  roomId: string,
  userId: string
): Promise<void> {
  const roomRef = ref(realtimeDb, `${ROOMS_PATH}/${roomId}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) {
    return;
  }

  const room = snapshot.val() as BattleRoom;
  const updatedPlayers = room.players.filter((p) => p.uid !== userId);

  if (updatedPlayers.length === 0 || room.hostId === userId) {
    await remove(roomRef);
    console.log(`Room ${roomId} deleted`);
  } else {
    await update(roomRef, {
      players: updatedPlayers,
      currentPlayers: updatedPlayers.length,
    });
    console.log(`Player ${userId} left room ${roomId}`);
  }
}

export async function setPlayerReady(
  roomId: string,
  userId: string,
  ready: boolean
): Promise<void> {
  const roomRef = ref(realtimeDb, `${ROOMS_PATH}/${roomId}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) {
    throw new Error("Room not found");
  }

  const room = snapshot.val() as BattleRoom;
  const updatedPlayers = room.players.map((p) =>
    p.uid === userId ? { ...p, isReady: ready } : p
  );

  await update(roomRef, { players: updatedPlayers });
  console.log(`Player ${userId} ready status: ${ready}`);
}

export async function startBattle(
  roomId: string,
  questionIds: string[]
): Promise<void> {
  const roomRef = ref(realtimeDb, `${ROOMS_PATH}/${roomId}`);

  await update(roomRef, {
    status: "in_progress",
    questions: questionIds,
    startedAt: Date.now(),
  });

  console.log(`Battle ${roomId} started with ${questionIds.length} questions`);
}

export async function submitBattleAnswer(
  roomId: string,
  userId: string,
  answer: BattleAnswer
): Promise<void> {
  const roomRef = ref(realtimeDb, `${ROOMS_PATH}/${roomId}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) {
    throw new Error("Room not found");
  }

  const room = snapshot.val() as BattleRoom;
  const updatedPlayers = room.players.map((p) => {
    if (p.uid === userId) {
      const newAnswers = [...p.answers, answer];
      const newScore = answer.isCorrect ? p.score + 10 : p.score - 5;
      return { ...p, answers: newAnswers, score: Math.max(0, newScore) };
    }
    return p;
  });

  await update(roomRef, { players: updatedPlayers });
  console.log(`Answer submitted for player ${userId} in room ${roomId}`);
}

export async function completeBattle(roomId: string): Promise<void> {
  const roomRef = ref(realtimeDb, `${ROOMS_PATH}/${roomId}`);
  await update(roomRef, {
    status: "completed",
    endedAt: Date.now(),
  });

  console.log(`Battle ${roomId} completed`);
}

export async function saveBattleResult(result: BattleResult): Promise<void> {
  const resultRef = push(ref(realtimeDb, RESULTS_PATH));
  await set(resultRef, result);
  console.log("Battle result saved:", result.battleId);
}

export async function getBattleRoom(roomId: string): Promise<BattleRoom | null> {
  const roomRef = ref(realtimeDb, `${ROOMS_PATH}/${roomId}`);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.val() as BattleRoom;
}

export async function getPublicRooms(): Promise<BattleRoom[]> {
  const roomsRef = ref(realtimeDb, ROOMS_PATH);
  const snapshot = await get(roomsRef);

  if (!snapshot.exists()) {
    return [];
  }

  const rooms = snapshot.val() as Record<string, BattleRoom>;
  return Object.values(rooms).filter(
    (room) => room.isPublic && room.status === "waiting"
  );
}

export async function createRoom(
  hostId: string,
  topic: string,
  difficulty: string,
  password?: string
): Promise<{ roomId: string; joined: boolean }> {
  try {
    console.log("createRoom called", { hostId, topic, difficulty, hasPassword: !!password });

    const user = await getUserProfile(hostId);
    const hostName = user?.displayName ?? `Player-${hostId.slice(0, 6)}`;

    if (!password) {
      const roomsRef = ref(realtimeDb, ROOMS_PATH);
      const snapshot = await get(roomsRef);

      if (snapshot.exists()) {
        const rooms = snapshot.val() as Record<string, BattleRoom>;
        const candidates = Object.values(rooms).filter((r) =>
          r.status === "waiting" && r.isPublic && r.currentPlayers < r.maxPlayers && r.hostId !== hostId && r.topic === topic && r.difficulty === difficulty
        );

        const target = candidates.sort((a, b) => a.createdAt - b.createdAt)[0];

        if (target) {
          await joinBattleRoom(target.id, hostId, hostName);
          console.log("Matched into existing room", target.id);
          return { roomId: target.id, joined: true };
        }
      }
    }

    const roomId = await createBattleRoom(hostId, hostName, {
      name: `${topic} • ${difficulty}`,
      password,
      topic,
      difficulty,
      maxPlayers: 2,
    });

    console.log("Created new room and waiting", roomId);
    return { roomId, joined: false };
  } catch (error) {
    console.error("Error in createRoom:", error);
    throw error;
  }
}

export function subscribeToBattleRoom(
  roomId: string,
  callback: (room: BattleRoom | null) => void
): () => void {
  const roomRef = ref(realtimeDb, `${ROOMS_PATH}/${roomId}`);

  const unsubscribe = onValue(roomRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val() as BattleRoom);
    } else {
      callback(null);
    }
  });

  return () => off(roomRef, "value", unsubscribe);
}
