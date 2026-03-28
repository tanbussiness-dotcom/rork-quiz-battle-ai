Backend API fixes summary

- Added JSON-first Hono routes in backend/hono.ts:
  - POST /quizzes: Validates with Zod, prevents duplicate titles, bounds questions (1–20), writes to Firestore, returns { status: "success", data }
  - GET /quizzes: Lists quizzes with timestamps normalized, JSON response
  - GET /quizzes/:id: Fetches quiz by id, JSON response
  - POST /battle: create|join with Zod validation; integrates existing battle.service to create/join rooms; JSON response
- Global error handling: normalized onError to return JSON { error, message, path } and structured logs
- All endpoints now use c.json / Response.json. Updated app/api/test+api.ts to Response.json
- Created lib/errorHandler.ts for structured logging helpers
- Added services/quiz.service.ts with typed fetch wrappers compatible with Expo Web and native
- Ensured tRPC client validates JSON content-type already; left intact

Local test commands

- bun run start-web
- curl -s -X POST http://localhost:3000/quizzes \
  -H 'Content-Type: application/json' \
  -d '{"title":"AI Test","questions":[{"question":"Q?","answer":"A","options":["A","B"]}]}' | jq
- curl -s http://localhost:3000/quizzes | jq
- curl -s http://localhost:3000/quizzes/ID | jq
- curl -s -X POST http://localhost:3000/battle \
  -H 'Content-Type: application/json' \
  -d '{"action":"create","hostId":"u1","hostName":"Alice","topic":"science","difficulty":"medium"}' | jq

Notes

- Firestore composite indexes are not required for the equality duplicate-check query (title ==).
- Responses always include application/json content-type to satisfy TestSprite JSONDecodeError cases.
