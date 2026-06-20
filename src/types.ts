// Shared domain types for the behavioral ("Delivery Coach") flow and the primitives reused
// across analyzers. System-design types live next to their modules in src/{data,lib}/sysdesign.

export type Score = 1 | 2 | 3 | 4 | 5

// ---- Transcription -------------------------------------------------------

export interface TranscriptWord {
  word: string
  start: number
  end: number
}

export interface Transcript {
  text: string
  words?: TranscriptWord[]
  durationSec: number | null
}

// ---- Filler analysis -----------------------------------------------------

export interface FillerSpan {
  text: string
  index: number
}

export interface FillerResult {
  total: number
  perMinute: number | null
  byWord: Record<string, number>
  spans: FillerSpan[]
}

// ---- Behavioral (STAR) grading, parsed from the LLM ----------------------

export type BehavioralLevel = 'junior' | 'mid' | 'senior' | 'staff' | 'principal'
export type Severity = 'high' | 'medium' | 'low'
export type DetailTendency = 'too_much' | 'balanced' | 'too_little'

export interface StarBeat {
  present: boolean
  score: Score
  note: string
}

export interface StarScores {
  clarity: Score
  structure: Score
  impact: Score
}

export interface DeliveryHabits {
  leadsWithOutcome: { present: boolean; score: Score; note: string }
  detailAltitude: { tendency: DetailTendency; score: Score; note: string }
}

export interface LevelGuidance {
  level: string
  guidance: string[]
}

export interface LevelSignal {
  level: BehavioralLevel
  rationale: string
  signals: string[]
  toReachHigher: LevelGuidance[]
}

export interface CoachingNote {
  title: string
  detail: string
  severity: Severity
}

export interface StarGrading {
  conforms: boolean
  perBeat: { situation: StarBeat; task: StarBeat; action: StarBeat; result: StarBeat }
  scores: StarScores
  summary: string
  deliveryHabits: DeliveryHabits
  levelSignal: LevelSignal
  coachingNotes: CoachingNote[]
}

// ---- Analyzer results & merged feedback ----------------------------------

export interface LlmAnalyzerResult {
  id: string
  label: string
  status: 'ok'
  scores: Partial<StarScores>
  findings: CoachingNote[]
  summary: string
  raw: StarGrading
  rawResponse: unknown
}

export interface FillerAnalyzerResult {
  id: string
  label: string
  status: 'ok'
  scores: { perMinute: number | null }
  findings: FillerSpan[]
  summary: string
  raw: FillerResult
}

export type FeedbackBeat = StarBeat & { key: string; label: string }
export type FeedbackNote = CoachingNote & { source: 'star' | 'filler' }

export interface Feedback {
  conforms: boolean
  summary: string
  scores: Partial<StarScores>
  level: LevelSignal | null
  habits: DeliveryHabits | null
  beats: FeedbackBeat[]
  filler: { total: number; perMinute: number | null; byWord: Record<string, number> }
  notes: FeedbackNote[]
}

/** Context passed to each analyzer's `run`. */
export interface AnalyzerContext {
  question: string
  transcript: Transcript
  durationSec: number | null
  anthropicKey: string
  fillers?: string[]
  filler?: FillerResult
  signal?: AbortSignal
}

export interface Session {
  id: string
  createdAt: number
  promptId: string
  transcript: Transcript
  filler: FillerResult
  llm: LlmAnalyzerResult
  feedback: Feedback
  isVideo: boolean
}
