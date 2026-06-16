const SEVERITY_STYLE = {
  high: 'border-red-200 bg-red-50',
  medium: 'border-amber-200 bg-amber-50',
  low: 'border-slate-200 bg-slate-50',
}

const SEVERITY_DOT = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-slate-400',
}

function ScoreBadge({ label, value }) {
  if (value == null) return null
  const color =
    value >= 4 ? 'text-green-700 bg-green-100' : value >= 3 ? 'text-amber-700 bg-amber-100' : 'text-red-700 bg-red-100'
  return (
    <div className="flex flex-col items-center">
      <span className={`rounded-full px-3 py-1 text-sm font-semibold ${color}`}>{value}/5</span>
      <span className="mt-1 text-xs capitalize text-slate-500">{label}</span>
    </div>
  )
}

function BeatRow({ beat }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span
        className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
          beat.present ? 'bg-green-500' : 'bg-slate-300'
        }`}
        title={beat.present ? 'Present' : 'Missing'}
      >
        {beat.label?.[0]}
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-800">{beat.label}</span>
          {beat.score != null && <span className="text-xs text-slate-400">{beat.score}/5</span>}
        </div>
        {beat.note && <p className="text-sm text-slate-600">{beat.note}</p>}
      </div>
    </div>
  )
}

export default function FeedbackPanel({ feedback }) {
  if (!feedback) return null
  const { conforms, summary, scores, beats, filler, notes } = feedback

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">STAR analysis</h3>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              conforms ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}
          >
            {conforms ? 'Follows STAR' : 'Loosely structured'}
          </span>
        </div>
        {summary && <p className="mt-3 text-sm leading-relaxed text-slate-700">{summary}</p>}

        {(scores.clarity != null || scores.structure != null || scores.impact != null) && (
          <div className="mt-4 flex justify-around border-t border-slate-100 pt-4">
            <ScoreBadge label="clarity" value={scores.clarity} />
            <ScoreBadge label="structure" value={scores.structure} />
            <ScoreBadge label="impact" value={scores.impact} />
          </div>
        )}

        {beats.length > 0 && (
          <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100 pt-2">
            {beats.map((b) => (
              <BeatRow key={b.key} beat={b} />
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-baseline justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Filler words</h3>
          <span className="text-sm text-slate-500">
            {filler.total} total
            {filler.perMinute != null && ` · ${filler.perMinute.toFixed(1)}/min`}
          </span>
        </div>
        {Object.keys(filler.byWord).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {Object.entries(filler.byWord)
              .sort((a, b) => b[1] - a[1])
              .map(([word, count]) => (
                <span
                  key={word}
                  className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600"
                >
                  {word} ×{count}
                </span>
              ))}
          </div>
        )}
      </div>

      {notes.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700">Coaching notes</h3>
          <ul className="mt-3 space-y-2">
            {notes.map((n, i) => (
              <li key={i} className={`rounded-lg border p-3 ${SEVERITY_STYLE[n.severity] || SEVERITY_STYLE.low}`}>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${SEVERITY_DOT[n.severity] || SEVERITY_DOT.low}`} />
                  <span className="text-sm font-medium text-slate-800">{n.title}</span>
                  <span className="text-xs uppercase tracking-wide text-slate-400">{n.severity}</span>
                </div>
                <p className="mt-1 text-sm text-slate-600">{n.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
