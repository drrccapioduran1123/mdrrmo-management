# Copilot / AI agent instructions for mdrrmo-management

Short, actionable notes to help an AI contributor be productive immediately.

Architecture (big picture)
- Monorepo-like single app with two clear layers: `server/` (Node + Express, TypeScript) and `client/` (React + Vite).
- Shared types and validation live in `shared/schema.ts` (Zod + Drizzle types). Server routes validate requests with those schemas.
- The server is the single network boundary: it exposes REST endpoints under `/api/*` and proxies/coordinates with Google Drive/Sheets code (`server/google-drive.ts`, `server/google-sheets.ts`) and map data (`server/maps-data.ts`).

Key files to inspect
- Server entry: `server/index.ts` — sets up Express, request logging, error handler and starts the HTTP server (uses `PORT`, default 5000).
- Routes: `server/routes.ts` — all API endpoints; each handler calls into modular helpers (google-drive/google-sheets/maps-data).
- Dev Vite glue: `server/vite.ts` — dev-only integration; production static serving done in `server/static.ts`.
- Client entry: `client/src/main.tsx` and `client/src/App.tsx`.
- Shared types/validation: `shared/schema.ts` (zod schemas + types used in routes).
- Build helper: `script/build.ts` and root `package.json` scripts.

Developer workflows (how to run & build)
- Development (single command runs server + dev Vite): `npm run dev` — this launches `tsx server/index.ts` which sets up Vite in dev when NODE_ENV != production.
- Typecheck: `npm run check` (runs `tsc`). `./.vscode/tasks.json` contains a task that runs this.
- Build: `npm run build` (runs `tsx script/build.ts`). Production artifact expected at `dist/`; run via `npm start` (node dist/index.cjs).
- Database/ORM: Drizzle is present — use `npm run db:push` to push schema migrations (`drizzle-kit`).

Project-specific patterns & conventions
- Single port: the server serves both the API and the built client. Always use `PORT` (defaults to 5000) — other ports may be firewalled.
- Validation-first routes: each `POST`/`PUT` route in `server/routes.ts` uses Zod schemas from `shared/schema.ts` and returns `400` on parse failure.
- File uploads use `multer.memoryStorage()` with a 50MB per-file limit (see `server/routes.ts` upload middleware). Uploaded buffers are handed to `server/google-drive.ts` helpers.
- Logging: `server/index.ts` replaces `res.json` to capture JSON responses for `/api` routes and logs duration + response body.
- Separation of concerns: route handlers are thin; data access and external integrations live in `server/google-drive.ts`, `server/google-sheets.ts`, and `server/maps-data.ts` — prefer editing those modules when changing storage/integration behavior.

Integration points & external deps
- Google APIs: server integrates with Google Drive and Google Sheets — see `server/google-drive.ts` and `server/google-sheets.ts` for token flow and required env vars/credentials.
- Postgres + Drizzle: `shared/schema.ts` defines tables/types. `drizzle-kit` is used for migrations.
- Sessions & auth: dependencies include `express-session`, `passport`, `passport-local` — look for usage in `server/*` to modify auth flows.

How to extend or change an API endpoint (quick recipe)
1. Add/modify Zod schema in `shared/schema.ts` and export types.
2. Update the thin handler in `server/routes.ts` to call into the appropriate helper, validating with `safeParse` and returning `400` on failure.
3. Implement data/storage changes in `server/google-drive.ts` or `server/google-sheets.ts` (or add a new helper module). Keep handlers small.
4. Run `npm run dev` and exercise via the client or curl against `http://localhost:5000/api/...`.

Notes for AI edits
- Prefer minimal, focused changes: update helper modules instead of rewriting `server/routes.ts` unless the route surface must change.
- Keep the Zod schemas in `shared/schema.ts` authoritative for shape and validation; update routes to match.
- Use existing endpoints as examples — see `GET /api/inventory`, `POST /api/gallery/upload`, and `POST /api/documents/upload` for common patterns (file upload, validation, delegation to helper).

If something is missing
- Ask for runtime environment values (Google credentials, `PORT`) and whether production build artifacts are present.
- If a change touches external integrations (Google, Postgres), request test credentials or a mocked contract to run locally.

Questions for you
- Are there preferred environment variable names or local secrets you want the agent to assume (Google credentials, DB URL)?
- Do you want the agent to add tests or test scaffolding when modifying functionality?

---
Update request: If you want more detail (examples of request/response shapes, env var names, or a walkthrough of `script/build.ts`), tell me which area to expand.
