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

Add your OpenAI and Anthropic API keys in **Settings** after the app loads.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests for the pure logic
npm run build
```

> **Note:** if your system Node is broken (Homebrew `icu4c` mismatch), a self-contained
> Node is bundled in `.toolchain/` (gitignored). Use the `./dev.sh` wrapper, which puts it
> first on PATH and forwards to npm: `./dev.sh`, `./dev.sh build`, `./dev.sh test`.

## Tech

Vite + React, Tailwind CSS, Vitest. Analyzers conform to one interface and the grading
criteria are data (`src/data/criteria.js`), so swapping STAR for another framework — or the
LLM provider — needs no UI changes.
