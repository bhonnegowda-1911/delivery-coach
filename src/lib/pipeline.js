import { fillerAnalyzer } from './analyzers/fillerAnalyzer.js'
import { makeLlmAnalyzer } from './analyzers/llmAnalyzer.js'
import { DEFAULT_CRITERIA } from '../data/criteria.js'

// Orchestrates the two analyzers. Filler analysis runs first (local, instant, free) and
// its result is injected into the LLM context so the coaching can reference it — one LLM
// call total. `onProgress` lets the UI show legible progress.

/**
 * @param {object} input
 * @param {string} input.question
 * @param {{ text: string, durationSec: number|null }} input.transcript
 * @param {string} input.anthropicKey
 * @param {object} [input.criteria]
 * @param {string[]} [input.fillers]
 * @param {AbortSignal} [input.signal]
 * @param {(stage: string) => void} [input.onProgress]
 * @returns {Promise<{ filler: object, llm: object }>}
 */
export async function runPipeline({
  question,
  transcript,
  anthropicKey,
  criteria = DEFAULT_CRITERIA,
  fillers,
  signal,
  onProgress = () => {},
}) {
  const baseCtx = {
    question,
    transcript,
    durationSec: transcript?.durationSec ?? null,
    anthropicKey,
    fillers,
    signal,
  }

  onProgress('fillers')
  const fillerResult = await fillerAnalyzer.run(baseCtx)

  onProgress('analyzing')
  const llmAnalyzer = makeLlmAnalyzer(criteria)
  const llmResult = await llmAnalyzer.run({ ...baseCtx, filler: fillerResult.raw })

  return { filler: fillerResult, llm: llmResult }
}
