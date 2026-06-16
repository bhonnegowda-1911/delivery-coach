// Grading criteria are DATA, not code. Swapping STAR for PREP/SBI later is a new
// object here — no analyzer changes. `schema` is a JSON Schema passed to the LLM via
// output_config.format so the response is constrained to this shape.

const SCORE_ENUM = [1, 2, 3, 4, 5]

function beatSchema(description) {
  return {
    type: 'object',
    description,
    properties: {
      present: { type: 'boolean', description: 'Was this beat clearly present?' },
      score: { type: 'integer', enum: SCORE_ENUM, description: '1 (absent/weak) to 5 (strong)' },
      note: { type: 'string', description: 'One specific, actionable observation.' },
    },
    required: ['present', 'score', 'note'],
    additionalProperties: false,
  }
}

export const STAR_CRITERIA = {
  id: 'star',
  label: 'STAR method',
  model: 'claude-haiku-4-5',
  systemPrompt: `You are an expert interview-delivery coach. You grade how well a spoken
answer follows the STAR method (Situation, Task, Action, Result) and how clear and
impactful the delivery is.

You will receive:
- The interview question being answered.
- A transcript of the candidate's spoken answer.
- A locally computed filler-word summary (total and per-minute rate).

Grade strictly and consistently against the STAR rubric. For each beat, decide whether it
was present and score it 1-5. Provide concrete, specific coaching notes tied to what the
candidate actually said — quote or paraphrase their words. You may reference the filler
data in your coaching, but do not recompute it. Be honest and specific rather than
encouraging for its own sake.`,
  schema: {
    type: 'object',
    properties: {
      conforms: {
        type: 'boolean',
        description: 'Does the answer broadly follow the STAR structure?',
      },
      perBeat: {
        type: 'object',
        properties: {
          situation: beatSchema('Sets the context/background.'),
          task: beatSchema('States the goal or responsibility.'),
          action: beatSchema('Describes specific steps the candidate took.'),
          result: beatSchema('States the outcome, ideally quantified.'),
        },
        required: ['situation', 'task', 'action', 'result'],
        additionalProperties: false,
      },
      scores: {
        type: 'object',
        properties: {
          clarity: { type: 'integer', enum: SCORE_ENUM, description: 'How clear and easy to follow.' },
          structure: { type: 'integer', enum: SCORE_ENUM, description: 'How well-organized as STAR.' },
          impact: { type: 'integer', enum: SCORE_ENUM, description: 'How compelling/convincing.' },
        },
        required: ['clarity', 'structure', 'impact'],
        additionalProperties: false,
      },
      summary: {
        type: 'string',
        description: 'Two or three sentences summarizing the delivery overall.',
      },
      coachingNotes: {
        type: 'array',
        description: 'Ranked, specific improvements. Most important first.',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'Short label for the issue.' },
            detail: { type: 'string', description: 'Specific, actionable guidance.' },
            severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          },
          required: ['title', 'detail', 'severity'],
          additionalProperties: false,
        },
      },
    },
    required: ['conforms', 'perBeat', 'scores', 'summary', 'coachingNotes'],
    additionalProperties: false,
  },
}

export const DEFAULT_CRITERIA = STAR_CRITERIA
