import { DEFAULT_FILLER_WORDS } from '../../data/fillerWords.js'

// Local, instant, free heuristic. Counts filler words/phrases from a configurable list,
// reports total + per-minute rate, and records where each occurrence falls (char offset).
// Conforms to the Analyzer interface: { id, label, run }.

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Build one case-insensitive, word-bounded regex that matches any filler. Longer phrases
// are listed first so "you know" wins over "you" when both could match.
function buildRegex(fillers) {
  const sorted = [...fillers].sort((a, b) => b.length - a.length)
  const alts = sorted.map((f) => escapeRegExp(f.trim())).filter(Boolean)
  // \b on the outside; allow internal whitespace runs in multi-word phrases.
  const pattern = alts.map((a) => a.replace(/\s+/g, '\\s+')).join('|')
  return new RegExp(`\\b(?:${pattern})\\b`, 'gi')
}

/**
 * @param {string} text
 * @param {number|null} durationSec
 * @param {string[]} fillers
 * @returns {{ total: number, perMinute: number|null, byWord: Record<string, number>, spans: Array<{ text: string, index: number }> }}
 */
export function analyzeFillers(text = '', durationSec = null, fillers = DEFAULT_FILLER_WORDS) {
  const spans = []
  const byWord = {}
  if (text) {
    const re = buildRegex(fillers)
    let m
    while ((m = re.exec(text)) !== null) {
      const matched = m[0]
      const key = matched.toLowerCase().replace(/\s+/g, ' ')
      byWord[key] = (byWord[key] || 0) + 1
      spans.push({ text: matched, index: m.index })
      if (m.index === re.lastIndex) re.lastIndex++ // guard against zero-width loops
    }
  }
  const total = spans.length
  const perMinute =
    durationSec && durationSec > 0 ? (total / durationSec) * 60 : null

  return { total, perMinute, byWord, spans }
}

export const fillerAnalyzer = {
  id: 'fillers',
  label: 'Filler words',
  async run(ctx) {
    const result = analyzeFillers(
      ctx.transcript?.text,
      ctx.durationSec,
      ctx.fillers,
    )
    return {
      id: 'fillers',
      label: 'Filler words',
      status: 'ok',
      scores: { perMinute: result.perMinute },
      findings: result.spans,
      summary:
        result.perMinute != null
          ? `${result.total} fillers (${result.perMinute.toFixed(1)}/min)`
          : `${result.total} fillers`,
      raw: result,
    }
  },
}
