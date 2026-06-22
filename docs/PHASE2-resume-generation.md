# Phase 2 — JD-targeted resume generation (TODO)

**Status:** planned, not started.
**Depends on:** Phase 1 (shipped) — JD parse + storage (`job_descriptions`, `jobs` module),
resume↔JD fit (`RESUME_FIT_CRITERIA`, `lib/resume/fit.ts`, the **Match** tab).
**Last updated:** 2026-06-21.

## Goal

Generate a **JD-targeted** resume, grounded strictly in the candidate's own ground truth
(projects + story bank), then feed it back through the existing fit score so generation and
analysis form one loop:

```
projects/stories ─▶ [generate, JD-targeted] ─▶ resume draft
       ▲                                            │
       │                                            ▼
  "strengthen these" ◀── [analyze vs JD] ── fit score + gaps   (Phase 1, reused)
```

The generator's objective function *is* the Phase-1 fit score. A generated draft should score
higher against the JD than the stored resume — that's the success check.

## Design (mirrors what Phase 1 established)

- **Grounding rule (the whole ballgame):** every experience bullet must trace to a project facet
  or a story's STAR/impact. No invented metrics, titles, or companies. Each bullet carries
  provenance (`sourceStoryId` / `sourceProjectId`), the same spirit as `storyFidelity`.
- **Structured output, not freeform prose** — reviewable, re-orderable, ATS-friendly, and
  consistent with the data-driven ethos.
- **Tailored is the default**; a generic resume (no JD) is the fallback.

### New type (`src/types.ts`)

```ts
export interface ResumeBullet {
  text: string
  sourceStoryId: string | null
  sourceProjectId: string | null
  metric?: string            // only if present in the source
}
export interface ResumeExperience {
  company: string
  role: string
  dates: string
  bullets: ResumeBullet[]
}
export interface GeneratedResume {
  header: { headline: string; targetRole: string }
  summary: string
  skills: { category: string; items: string[] }[]
  experience: ResumeExperience[]
}
```

### New criteria-as-data (`src/data/resumeCriteria.ts`)

`RESUME_GEN_CRITERIA` — a third `Criteria` next to `JD_PARSE_CRITERIA` / `RESUME_FIT_CRITERIA`.
Model: Sonnet 4.6 (Opus 4.8 for max quality, but it rejects `temperature`). System prompt
enforces the grounding rule and forbids any metric absent from the source.

### New logic (`src/lib/resume/generate.ts`)

`generateResume({ profile, stories, projects, job? }) → GeneratedResume`. Serializes the story
STARs + project facet `text` as source material, plus the parsed JD when tailoring, and calls
`chatStructured`. One LLM call.

### Persistence

Generated resumes are append-only reps → store as `sessions` rows (`kind='resume_gen'`, draft in
`payload`) via `sessionStore`, so versions can be compared. No new table.

### UI (`src/features/prep/MatchTab.tsx`)

Enable the existing **"Generate tailored resume"** placeholder button:
1. Generate from the selected JD → render the structured resume with provenance chips per bullet
   (which story/project each came from).
2. **"Score this draft"** re-runs `analyzeResumeFit` on the generated `text` and shows the **fit
   delta** vs the stored resume — closing the loop visibly.
3. Copy/export the draft (plain text / markdown).

## TODO checklist

- [ ] Add `GeneratedResume` / `ResumeBullet` / `ResumeExperience` types to `src/types.ts`.
- [ ] Add `RESUME_GEN_CRITERIA` (schema + grounding system prompt) to `src/data/resumeCriteria.ts`.
- [ ] Implement `src/lib/resume/generate.ts` (`generateResume`), serializing stories + project facets as source.
- [ ] Persist drafts via `sessionStore` (`kind='resume_gen'`); add a small list/compare view.
- [ ] Wire the **MatchTab** button: generate → render with provenance → **Score this draft** (fit delta).
- [ ] Add plain-text / markdown export of a generated resume.
- [ ] Unit test the (pure) source-serialization + provenance mapping.
- [ ] Verify end-to-end: a tailored draft scores higher against the JD than the stored resume.

## Out of scope for Phase 2

- PDF/multi-template layout rendering (structured output only).
- Cross-device generated-resume sync beyond what `sessionStore` already provides.
- Auto-applying gap fixes back into projects/stories (manual for now).
