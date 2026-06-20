import { chatStructured } from '../llmClient'
import { DEFAULT_CRITERIA, type Criteria } from '../../data/criteria'
import type { AnalyzerContext, FillerResult, LlmAnalyzerResult, StarGrading, Transcript } from '../../types'

// Criteria-driven analyzer. The criteria object supplies the system prompt and the
// response schema; this analyzer just assembles the user message (question + transcript +
// injected filler summary) and calls the provider-agnostic client. One LLM call total.

function buildUserMessage({
  question,
  transcript,
  durationSec,
  filler,
}: {
  question: string
  transcript: Transcript
  durationSec: number | null
  filler?: FillerResult
}): string {
  const lines: string[] = []
  lines.push(`INTERVIEW QUESTION:\n${question || '(none provided)'}`)
  lines.push('')
  if (durationSec) lines.push(`SPOKEN ANSWER (${Math.round(durationSec)}s):`)
  else lines.push('SPOKEN ANSWER:')
  lines.push(transcript?.text || '(empty transcript)')
  lines.push('')
  if (filler) {
    const rate = filler.perMinute != null ? `${filler.perMinute.toFixed(1)} per minute` : 'rate unknown'
    lines.push(`FILLER-WORD SUMMARY (computed locally, do not recompute):`)
    lines.push(`- Total: ${filler.total} (${rate})`)
    const top = Object.entries(filler.byWord || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([w, c]) => `${w} ×${c}`)
    if (top.length) lines.push(`- Most frequent: ${top.join(', ')}`)
  }
  return lines.join('\n')
}

export function makeLlmAnalyzer(criteria: Criteria = DEFAULT_CRITERIA) {
  return {
    id: criteria.id,
    label: criteria.label,
    async run(ctx: AnalyzerContext): Promise<LlmAnalyzerResult> {
      const user = buildUserMessage({
        question: ctx.question,
        transcript: ctx.transcript,
        durationSec: ctx.durationSec,
        filler: ctx.filler,
      })

      const { parsed, raw } = await chatStructured<StarGrading>({
        provider: 'anthropic',
        model: criteria.model,
        apiKey: ctx.anthropicKey,
        system: criteria.systemPrompt,
        user,
        schema: criteria.schema,
        signal: ctx.signal,
      })

      return {
        id: criteria.id,
        label: criteria.label,
        status: 'ok',
        scores: parsed.scores || {},
        findings: parsed.coachingNotes || [],
        summary: parsed.summary || '',
        raw: parsed,
        rawResponse: raw,
      }
    },
  }
}
