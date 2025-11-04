import { readFileSync } from "fs";
import { resolve } from "path";
import { generateSingleQuestion, generateQuestions, getMockQuestions } from "../lib/gemini";

// Load environment variables from 'env' file if GEMINI_API_KEY not already set
if (!process.env.GEMINI_API_KEY) {
  try {
    const envPath = resolve(process.cwd(), "env");
    const envContent = readFileSync(envPath, "utf-8");
    const lines = envContent.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        if (key && valueParts.length > 0) {
          const value = valueParts.join("=").trim();
          process.env[key.trim()] = value;
        }
      }
    }
    console.log("✅ Loaded environment variables from 'env' file");
    console.log("🔑 GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? `Found (${process.env.GEMINI_API_KEY.substring(0, 10)}...)` : "Not found");
  } catch (e) {
    console.error("⚠️  Could not load env file:", e);
  }
}

function timestamp(): string {
  return new Date().toLocaleString();
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function isValidQuestion(q: any): boolean {
  return (
    !!q &&
    (typeof q.question === "string" || typeof q.content === "string") &&
    Array.isArray(q.options) &&
    typeof q.correctAnswer !== "undefined"
  );
}

async function runSingleTest(topic: string, difficulty: string, language = "en"): Promise<boolean> {
  const label = `[Test: ${topic}/${difficulty}]`;
  try {
    const q = await generateSingleQuestion({ topic, difficulty, language });
    const normalized = {
      question: (q as any).question ?? (q as any).content,
      options: (q as any).options,
      correctAnswer: (q as any).correctAnswer,
    };
    if (isValidQuestion(normalized)) {
      console.log(`${label} ✅ SUCCESS (1 question valid)`);
      return true;
    } else {
      console.error(`${label} ❌ FAILED — invalid question structure`);
      return false;
    }
  } catch (err: any) {
    console.error(`${label} ❌ FAILED — ${err?.message ?? String(err)}`);
    return false;
  }
}

async function runBatchTest(topic: string, difficulty: string, language = "en"): Promise<boolean> {
  const label = `[Batch: ${topic}/${difficulty}]`;
  try {
    const arr = await generateQuestions(topic, 3, { difficulty, language: language === "vi" ? "Vietnamese" : "English", timeoutMs: 15000, retries: 1 });
    const valid = arr.filter((q: any) => isValidQuestion(q));
    if (valid.length === arr.length && arr.length > 0) {
      console.log(`${label} ✅ SUCCESS (${arr.length} questions valid)`);
      return true;
    }
    console.error(`${label} ❌ FAILED — some questions invalid (${valid.length}/${arr.length})`);
    return false;
  } catch (err: any) {
    console.error(`${label} ❌ FAILED — ${err?.message ?? String(err)}`);
    return false;
  }
}

async function testMissingKey(): Promise<boolean> {
  const label = `[Env: Missing GEMINI_API_KEY]`;
  const prevKey = process.env.GEMINI_API_KEY;
  const prevPub = (process.env as any).EXPO_PUBLIC_GEMINI_API_KEY;
  try {
    delete process.env.GEMINI_API_KEY;
    delete (process.env as any).EXPO_PUBLIC_GEMINI_API_KEY;
    let failedAsExpected = false;
    try {
      await generateSingleQuestion({ topic: "math", difficulty: "easy" });
    } catch (e: any) {
      failedAsExpected = /Missing GEMINI_API_KEY/i.test(e?.message ?? "");
    }
    if (failedAsExpected) {
      console.log(`${label} ✅ SUCCESS — clear error on missing key`);
      return true;
    } else {
      console.error(`${label} ❌ FAILED — did not error as expected`);
      return false;
    }
  } finally {
    if (prevKey) process.env.GEMINI_API_KEY = prevKey; else delete process.env.GEMINI_API_KEY;
    if (prevPub) (process.env as any).EXPO_PUBLIC_GEMINI_API_KEY = prevPub; else delete (process.env as any).EXPO_PUBLIC_GEMINI_API_KEY;
  }
}

async function testFallbackSimulation(): Promise<boolean> {
  const label = `[Fallback]`;
  try {
    const mocks = getMockQuestions("science", 3);
    const allValid = mocks.every((q) => isValidQuestion(q));
    if (allValid) {
      console.log(`${label} ✅ SUCCESS — mock fallback produces valid questions (${mocks.length})`);
      return true;
    } else {
      console.error(`${label} ❌ FAILED — mock fallback invalid structure`);
      return false;
    }
  } catch (e: any) {
    console.error(`${label} ❌ FAILED — ${e?.message ?? String(e)}`);
    return false;
  }
}

async function main() {
  console.log(`[Gemini Test] Starting tests at ${timestamp()}`);
  const hasKey = !!(process.env.GEMINI_API_KEY || (process.env as any).EXPO_PUBLIC_GEMINI_API_KEY);
  console.log(`[Env] GEMINI_API_KEY loaded: ${hasKey ? "yes" : "no"}`);

  const tests: Array<() => Promise<boolean>> = [];

  if (hasKey) {
    tests.push(() => runSingleTest("math", "easy"));
    tests.push(() => sleep(2000).then(() => runSingleTest("history", "medium")));
    tests.push(() => sleep(2000).then(() => runSingleTest("science", "hard")));
    tests.push(() => sleep(2000).then(() => runBatchTest("geography", "medium")));
  } else {
    console.log(`[Info] Skipping live Gemini calls because GEMINI_API_KEY is missing.`);
  }

  tests.push(() => sleep(500).then(() => testMissingKey()));
  tests.push(() => sleep(500).then(() => testFallbackSimulation()));

  let passed = 0;
  for (const t of tests) {
    const ok = await t();
    if (ok) passed++;
  }
  console.log(`Summary: ${passed}/${tests.length} tests passed`);
}

main().catch((e) => {
  console.error(`[Gemini Test] Uncaught error:`, e);
  process.exit(1);
});
