import { fillerAnalyzer } from './analyzers/fillerAnalyzer'
import { makeLlmAnalyzer } from './analyzers/llmAnalyzer'
import { DEFAULT_CRITERIA, type Criteria } from '../data/criteria'
import type { AnalyzerContext, FillerAnalyzerResult, LlmAnalyzerResult, Transcript } from '../types'

// Orchestrates the two analyzers. Filler analysis runs first (local, instant, free) and
// its result is injected into the LLM context so the coaching can reference it — one LLM
// call total. `onProgress` lets the UI show legible progress.

export type PipelineStage = 'fillers' | 'analyzing'

export interface PipelineInput {
  question: string
  transcript: Transcript
  anthropicKey: string
  criteria?: Criteria
  fillers?: string[]
  signal?: AbortSignal
  onProgress?: (stage: PipelineStage) => void
}

export async function runPipeline({
  question,
  transcript,
  anthropicKey,
  criteria = DEFAULT_CRITERIA,
  fillers,
  signal,
  onProgress = () => {},
}: PipelineInput): Promise<{ filler: FillerAnalyzerResult; llm: LlmAnalyzerResult }> {
  const baseCtx: AnalyzerContext = {
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
