# Delivery Coach

A personal, single-screen web app to practice interview answers. Record (or upload) a
spoken answer, and get LLM-graded feedback on **delivery** — STAR structure, clarity, and
filler-word usage — shown next to your recording and your active focus targets.

This is the **Phase 1 POC**: it proves the core loop (capture → transcribe → analyze →
human-readable feedback). History, trend charts, and the auto-deriving focus-target engine
are Phase 2.

## How it works

```
Recorder ─▶ blob (audio|video)
   ─▶ Whisper transcription ─▶ transcript
        ├─ fillerAnalyzer (local heuristic)  ─▶ counts + per-minute rate
        └─ llmAnalyzer (Claude, STAR rubric) ─▶ structured feedback
   ─▶ merged Feedback ─▶ feedback + replay + focus targets
```

- **Transcription:** OpenAI Whisper (`whisper-1`), called directly from the browser.
- **Grading:** Claude Haiku 4.5 with a fixed STAR rubric via structured outputs, behind a
  provider-agnostic `llmClient` (an OpenAI adapter slot is stubbed for later).
- **No backend.** API calls go browser-direct with your own keys; keys live only in
  `localStorage`. This is an accepted POC tradeoff — a key-protecting proxy is Phase 2.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests for the pure logic
npm run typecheck  # tsc -b, no emit
npm run build      # type-checks, then bundles
```

> **Note:** if your system Node is broken (Homebrew `icu4c` mismatch), a self-contained
> Node is bundled in `.toolchain/` (gitignored). Use the `./dev.sh` wrapper, which puts it
> first on PATH and forwards to npm: `./dev.sh`, `./dev.sh build`, `./dev.sh test`.

### Running with the backend (durable sessions + media)

Sessions and media (voice recordings, system-design images/video) persist to a backend:
**Postgres** for structured data + jsonb session payloads, **MinIO** (S3-compatible) for
binaries, and a small **Node/Express** service that also proxies all LLM calls — so your
**OpenAI/Anthropic keys now live only on the server**, not in the browser.

```bash
docker compose up -d                 # Postgres + MinIO (+ Adminer on :8081, MinIO console :9001)

cp server/.env.example server/.env   # then add your ANTHROPIC_API_KEY / OPENAI_API_KEY
./dev.sh server:install              # install backend deps (one time)
./dev.sh server                      # API on http://localhost:8787

./dev.sh                             # Vite on http://localhost:5173 (proxies /api → :8787)
```

The app falls back to its in-browser localStorage cache if the backend is unreachable, but
durable history and media require the services above.

## Tech

Vite + React + **TypeScript** (strict), Tailwind CSS, Vitest. Shared domain types live in
`src/types.ts`; system-design types sit next to their modules in `src/{data,lib}/sysdesign`.
Analyzers conform to one interface and the grading criteria are data (`src/data/criteria.ts`),
so swapping STAR for another framework — or the LLM provider — needs no UI changes.
