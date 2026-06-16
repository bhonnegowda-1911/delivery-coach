import { ACTIVE_FOCUS_TARGETS } from '../data/focusTargets.js'

const STATUS_STYLE = {
  pass: { dot: 'bg-green-500', label: 'text-green-700', text: 'Pass' },
  fail: { dot: 'bg-red-500', label: 'text-red-700', text: 'Miss' },
  unknown: { dot: 'bg-slate-300', label: 'text-slate-400', text: '—' },
}

export default function FocusTargets({ session }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-700">Active focus targets</h3>
      <p className="mt-1 text-xs text-slate-400">
        Goals you're training. Phase 2 will derive and retire these from your history.
      </p>
      <ul className="mt-3 space-y-2">
        {ACTIVE_FOCUS_TARGETS.map((target) => {
          const result = session ? target.check(session) : { status: 'unknown', detail: '' }
          const style = STATUS_STYLE[result.status] || STATUS_STYLE.unknown
          return (
            <li key={target.id} className="flex items-center gap-3">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${style.dot}`} />
              <div className="min-w-0 flex-1">
                <div className="text-sm text-slate-700">{target.label}</div>
                {result.detail && <div className="text-xs text-slate-400">{result.detail}</div>}
              </div>
              <span className={`text-xs font-semibold ${style.label}`}>{style.text}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
