import { chatStructured } from './llmClient'
import {
  INTERVIEW_REVIEW_MODEL,
  INTERVIEW_REVIEW_SCHEMA,
  INTERVIEW_REVIEW_SYSTEM,
} from '../data/interviewReviewCriteria'
import type { DiarizedUtterance, InterviewReview, Transcript } from '../types'

// Grades a recorded interview from its transcript in one LLM call: the model classifies the round
// type and scores it against that bar (see interviewReviewCriteria). A long interview is a large
// prompt, so we give the model room (high effort + a generous max_tokens for the per-question
// breakdown) and run it on the REPORT tier (Opus). When diarized utterances are available, we feed a
// timestamped, speaker-labeled transcript so the grade can carry per-question seek times +
// candidateSpeaker for the interactive transcript.

export interface ReviewInterviewInput {
  transcript: Transcript
  /** Optional user-entered context (e.g. "Stripe — backend screen") to steer classification. */
  label?: string | null
  /** Diarized turns with timestamps, when available — enables click-to-seek + speaker labels. */
  utterances?: DiarizedUtterance[]
  signal?: AbortSignal
}

function buildUserMessage({
  transcript,
  label,
  utterances,
}: {
  transcript: Transcript
  label?: string | null
  utterances?: DiarizedUtterance[]
}): string {
  const lines: string[] = []
  if (label && label.trim()) {
    lines.push(`CANDIDATE'S NOTE ON THIS RECORDING (context only — verify against the transcript): ${label.trim()}`)
    lines.push('')
  }
  if (utterances && utterances.length) {
    // Tag each turn with its start time in whole seconds ([Ns]) so the grader can fill per-exchange
    // atSec + candidateSpeaker for the interactive transcript.
    lines.push('INTERVIEW TRANSCRIPT (diarized; each line tagged [Ns] = whole seconds into the recording):')
    for (const u of utterances) lines.push(`[${Math.round(u.start)}s] Speaker ${u.speaker}: ${u.text}`)
  } else {
    const dur = transcript.durationSec
    lines.push(dur ? `INTERVIEW TRANSCRIPT (~${Math.round(dur / 60)} min, ASR, no speaker labels):` : 'INTERVIEW TRANSCRIPT (ASR, no speaker labels):')
    lines.push(transcript.text?.trim() || '(empty transcript)')
  }
  return lines.join('\n')
}

export async function reviewInterview({ transcript, label, utterances, signal }: ReviewInterviewInput): Promise<InterviewReview> {
  const { parsed } = await chatStructured<InterviewReview>({
    provider: 'anthropic',
    model: INTERVIEW_REVIEW_MODEL,
    system: INTERVIEW_REVIEW_SYSTEM,
    user: buildUserMessage({ transcript, label, utterances }),
    schema: INTERVIEW_REVIEW_SCHEMA,
    maxTokens: 6000,
    thinking: 'adaptive',
    effort: 'high',
    signal,
  })
  return parsed
}
