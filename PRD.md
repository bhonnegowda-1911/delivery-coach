# Interview Coach — PRD (lean working doc)

**Type:** Living working doc — guides what to build/cut next. Not a portfolio piece.
**User:** One person (me). Single-user, private practice.
**North star:** *I get measurably better at interviews over repeated reps.*
**Last updated:** 2026-06-21

> This doc owns **why** and **what**. The **how** (stack, routes, models) lives in
> the README and the code — don't duplicate it here.

---

## 1. Problem  *(DRAFT — needs your real evidence; see questions below)*

Practicing senior+ interviews solo fails three ways:
1. **No honest signal** — I can't grade my own answer, and friends won't tell me
   I sound like a mid-level engineer.
2. **Delivery is invisible to me** — I don't hear my own filler, I ramble past
   the point, I bury the outcome.
3. **Each round needs a different muscle** — STAR storytelling, structured
   tradeoff reasoning, and prioritization-under-a-clock don't improve together.

**Evidence (fill in):** which of these have actually bitten me, in which real
interviews, and which hurt most? This section is worthless until it's grounded in
something that actually happened.

---

## 2. North star & success metrics

**North star:** measurable personal improvement over reps.

A rep "counts" only if it produces a comparable score, so trends are visible:

| Metric | Target direction | How measured |
|--------|------------------|--------------|
| Filler words / min | ↓ over sessions | local analyzer |
| STAR clarity / structure / impact | ↑ over sessions | LLM grading |
| Level signal (per mode) | trends toward target level | LLM grading |
| Rep cadence | sustained (e.g. N/week) | session history |
| Completion rate | started → graded stays high | session history |

**Implication:** the highest-value missing feature is **trend tracking over
time** — without it, "am I improving?" is unanswerable, which is the whole point.

---

## 3. Non-goals (what I will NOT build)

- Not a job tracker, resume builder, or scheduler.
- Not multiplayer / peer-mock — single-user only.
- Build mode does **not** run or grade my code — it coaches the *plan*.
- No public launch / multi-user auth until the personal loop is proven valuable.
- No generic "improve" features that don't move a metric in §2.

---

## 4. Users & top use cases

One user (me). Top jobs, in priority order:
1. Do a timed behavioral rep and see if my delivery is improving. **(P0)**
2. Do a staged system-design interview and get a level signal + what's missing. **(P0)**
3. Pressure-test my plan for a timed build challenge before doing it for real. **(P1)**
4. Look back across sessions and see the trend. **(P0 — currently weakest)**

---

## 5. Requirements (outcome-focused, prioritized)

### Behavioral — P0
- Record/upload an answer; transcribe it.
- Grade STAR (per-beat), clarity/structure/impact, filler rate, delivery habits.
- Return a **level signal** + concrete "to reach the next level" guidance.
- Generate realistic follow-ups.

### System Design — P0
- Staged interview (functional → NFR → entities → API → data flow → high-level →
  deep dives) with a live interviewer and per-stage time budgets.
- Attach diagrams/whiteboard media to a stage.
- Final **leveling report** graded against each stage's rubric.

### Build — P1
- Staged *planning* conversation (scope → running core → risks/approach) that
  pressure-tests prioritization, with curveballs.
- Final report scored on prioritization rubric dimensions.

### Progress / History — P0 (under-built)
- Durable, replayable session history across modes.
- **MISSING:** trend visualization over time (the north-star feature).
- **MISSING (Phase 2):** focus targets auto-derived from my own history.

---

## 6. Key decisions & tradeoffs  *(DRAFT — confirm/correct the reasoning)*

The high-signal section. What was chosen, and what we gave up:

| Decision | Why | What we traded away |
|----------|-----|---------------------|
| Build mode coaches the *plan*, doesn't run code | Keeps a rep to ~15 min of prioritization practice, not a build harness | Doesn't verify the code actually works |
| Rubrics as data, not prose in prompts | Swap frameworks/levels in one place; same rubric drives interviewer + grading | Someone must author & maintain rubric quality |
| Browser-direct keys (POC) → server proxy (Phase 2) | Ship the loop fast first | Keys in localStorage until the backend lands |
| Sonnet for turns, Opus for the final report | Pay for top judgment only where it matters most | Higher cost/latency on the report |
| localStorage fallback when backend offline | Reps never blocked by infra | Two sources of truth to reconcile |

*If any of these "why"s are wrong or post-hoc, fix them — a tradeoff I can't
defend is one I should revisit.*

---

## 7. What's next (driven by §2, not by what's fun to build)

1. **Trend tracking** — make improvement visible. Highest leverage; unlocks the
   north star. **(P0)**
2. Auto-derived focus targets from history. **(P1)**
3. Backend key proxy fully default. **(P1)**

---

## 8. Open questions

- Is "level" one ladder across all three modes, or per-mode?
- What's a *credible* level signal — how do I trust the LLM's grade enough to act
  on the trend? (calibration / consistency)
- Retention: how long do I keep recordings & transcripts?
- Should follow-ups become multi-turn rather than one generated round?
