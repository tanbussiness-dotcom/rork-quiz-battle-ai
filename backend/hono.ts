import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import { z } from "zod";
import { db, realtimeDb } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { createBattleRoom, joinBattleRoom } from "@/services/battle.service";

const app = new Hono();

console.log("🚀 [Backend] Starting Quiz Battle AI backend...");
console.log("🔍 [Backend] GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);
if (process.env.GEMINI_API_KEY) {
  console.log("✅ [Backend] Gemini API setup verified. Ready to generate quiz questions.");
  console.log("✅ [Backend] API Key length:", process.env.GEMINI_API_KEY.length);
} else {
  console.error("❌ [Backend] WARNING: GEMINI_API_KEY not found! Question generation will fail.");
}

app.use("*", cors());

app.use("*", async (c, next) => {
  console.log("🔍 [Backend] Incoming request:", c.req.method, c.req.url);
  console.log("🔍 [Backend] Path:", c.req.path);
  await next();
  console.log("✅ [Backend] Response sent with status:", c.res.status);
});

app.onError((err, c) => {
  console.error("❌ [Backend] Unhandled error:", {
    message: err.message,
    stack: err.stack,
    path: c.req.url,
  });
  return c.json(
    {
      error: "Internal server error",
      message: err.message,
      path: c.req.url,
    },
    500
  );
});

app.use(
  "/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
  })
);

app.get("/", (c) => {
  return c.json({
    status: "ok",
    message: "Quiz Battle AI Backend",
    note: "This backend is mounted at /api/* by Expo Router",
    endpoints: {
      health: "/ (accessed as /api/)",
      testGemini: "/test-gemini (accessed as /api/test-gemini)",
      trpc: "/trpc (accessed as /api/trpc)",
      quizzes: {
        create: "/quizzes",
        list: "/quizzes",
        get: "/quizzes/:id",
      },
      battle: "/battle",
    },
    geminiConfigured: !!process.env.GEMINI_API_KEY,
  });
});

app.get("/test-gemini", async (c) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return c.json(
        {
          ok: false,
          error: "GEMINI_API_KEY not found in environment",
          hasKey: false,
          keyLength: 0,
        },
        500
      );
    }

    console.log("🔍 [Test Gemini] Testing key with length:", apiKey.length);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: "Say 'Hello from Gemini API test!'",
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ [Test Gemini] API error:", response.status, errorText);
      return c.json(
        {
          ok: false,
          error: `Gemini API error: ${response.status}`,
          details: errorText,
          hasKey: true,
          keyLength: apiKey.length,
        },
        500
      );
    }

    const data = await response.json();
    const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

    console.log("✅ [Test Gemini] Successfully connected. Response:", responseText);

    return c.json({
      ok: true,
      response: responseText,
      hasKey: true,
      keyLength: apiKey.length,
      message: "Gemini connection successful",
    });
  } catch (error: any) {
    console.error("❌ [Test Gemini] Exception:", error);
    return c.json(
      {
        ok: false,
        error: error.message,
        hasKey: !!process.env.GEMINI_API_KEY,
        keyLength: process.env.GEMINI_API_KEY?.length || 0,
      },
      500
    );
  }
});

const quizQuestionSchema = z.object({
  question: z.string().min(5),
  answer: z.string().min(1),
  options: z.array(z.string()).min(2).max(6).optional(),
  type: z.enum(["multiple_choice", "true_false"]).optional().default("multiple_choice"),
});

const quizSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  questions: z.array(quizQuestionSchema).min(1).max(20),
});

app.post("/quizzes", async (c) => {
  try {
    const contentType = c.req.header("content-type") || "";
    if (!contentType.includes("application/json")) {
      return c.json({ error: "Missing or invalid request body" }, 400);
    }
    const body = await c.req.json().catch(() => undefined);
    if (!body) {
      return c.json({ error: "Missing or invalid request body" }, 400);
    }

    const parsed = quizSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.flatten() }, 400);
    }

    const quizzesCol = collection(db, "quizzes");
    const dupSnapshot = await getDocs(query(quizzesCol, where("title", "==", parsed.data.title)));
    if (!dupSnapshot.empty) {
      return c.json({ error: "A quiz with this title already exists" }, 409);
    }

    const docRef = await addDoc(quizzesCol, {
      ...parsed.data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const created = {
      id: docRef.id,
      ...parsed.data,
    };

    return c.json({ status: "success", data: created }, 201);
  } catch (err: any) {
    console.error("❌ [/quizzes POST] Error:", { message: err.message, stack: err.stack });
    return c.json({ error: err.message || "Failed to create quiz" }, 500);
  }
});

app.get("/quizzes", async (c) => {
  try {
    const quizzesCol = collection(db, "quizzes");
    const snap = await getDocs(quizzesCol);
    const data = snap.docs.map((d) => {
      const v: any = d.data();
      return {
        id: d.id,
        title: v.title,
        description: v.description ?? null,
        questions: Array.isArray(v.questions) ? v.questions : [],
        createdAt: v.createdAt instanceof Timestamp ? v.createdAt.toMillis() : v.createdAt ?? null,
        updatedAt: v.updatedAt instanceof Timestamp ? v.updatedAt.toMillis() : v.updatedAt ?? null,
      };
    });
    return c.json({ status: "success", data }, 200);
  } catch (err: any) {
    console.error("❌ [/quizzes GET] Error:", { message: err.message, stack: err.stack });
    return c.json({ error: err.message || "Failed to fetch quizzes" }, 500);
  }
});

app.get("/quizzes/:id", async (c) => {
  try {
    const id = c.req.param("id");
    if (!id) return c.json({ error: "Missing id" }, 400);
    const dref = doc(db, "quizzes", id);
    const snap = await getDoc(dref);
    if (!snap.exists()) return c.json({ error: "Quiz not found" }, 404);
    const v: any = snap.data();
    const data = {
      id: snap.id,
      title: v.title,
      description: v.description ?? null,
      questions: Array.isArray(v.questions) ? v.questions : [],
      createdAt: v.createdAt instanceof Timestamp ? v.createdAt.toMillis() : v.createdAt ?? null,
      updatedAt: v.updatedAt instanceof Timestamp ? v.updatedAt.toMillis() : v.updatedAt ?? null,
    };
    return c.json({ status: "success", data }, 200);
  } catch (err: any) {
    console.error("❌ [/quizzes/:id GET] Error:", { message: err.message, stack: err.stack });
    return c.json({ error: err.message || "Failed to fetch quiz" }, 500);
  }
});

const battleCreateSchema = z.object({
  action: z.literal("create"),
  hostId: z.string().min(1),
  hostName: z.string().min(1),
  topic: z.string().min(1),
  difficulty: z.string().min(1),
  password: z.string().max(40).optional(),
  maxPlayers: z.number().int().min(2).max(4).optional(),
});

const battleJoinSchema = z.object({
  action: z.literal("join"),
  roomId: z.string().min(1),
  uid: z.string().min(1),
  name: z.string().min(1),
  password: z.string().max(40).optional(),
});

type BattlePayload = z.infer<typeof battleCreateSchema> | z.infer<typeof battleJoinSchema>;

app.post("/battle", async (c) => {
  try {
    const contentType = c.req.header("content-type") || "";
    if (!contentType.includes("application/json")) {
      return c.json({ error: "Missing or invalid request body" }, 400);
    }
    const body = (await c.req.json().catch(() => undefined)) as BattlePayload | undefined;
    if (!body) return c.json({ error: "Missing or invalid request body" }, 400);

    const createParsed = battleCreateSchema.safeParse(body);
    if (createParsed.success) {
      const roomId = await createBattleRoom(createParsed.data.hostId, createParsed.data.hostName, {
        name: `${createParsed.data.topic} • ${createParsed.data.difficulty}`,
        password: createParsed.data.password,
        topic: createParsed.data.topic,
        difficulty: createParsed.data.difficulty,
        maxPlayers: createParsed.data.maxPlayers ?? 2,
      });
      return c.json({ status: "success", data: { roomId, joined: false } }, 201);
    }

    const joinParsed = battleJoinSchema.safeParse(body);
    if (joinParsed.success) {
      await joinBattleRoom(
        joinParsed.data.roomId,
        joinParsed.data.uid,
        joinParsed.data.name,
        joinParsed.data.password
      );
      return c.json({ status: "success", data: { roomId: joinParsed.data.roomId, joined: true } }, 200);
    }

    return c.json({ error: "Missing or invalid request body" }, 400);
  } catch (err: any) {
    console.error("❌ [/battle POST] Error:", { message: err.message, stack: err.stack });
    return c.json({ error: err.message || "Failed to process battle request" }, 500);
  }
});

export default app;
