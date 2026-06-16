// Fixed prompts so sessions are comparable over time.
// Phase 2 can rotate/select; Phase 1 shows the first.
export const PROMPTS = [
  {
    id: 'star-conflict',
    label: 'Behavioral — Conflict',
    text: 'Tell me about a time you disagreed with a teammate. What was the situation, what did you do, and how did it turn out?',
  },
  {
    id: 'star-failure',
    label: 'Behavioral — Failure',
    text: 'Describe a time a project of yours failed or missed its goal. What happened and what did you learn?',
  },
  {
    id: 'star-leadership',
    label: 'Behavioral — Leadership',
    text: 'Give an example of a time you took the lead on something. What did you do and what was the result?',
  },
]

export const DEFAULT_PROMPT = PROMPTS[0]
