import { PROBLEMS } from '../../data/sysdesign/problems'

// Landing view for the system-design mode: choose a problem to start an interview.

const DIFFICULTY_STYLE: Record<string, string> = {
  'Warm-up': 'bg-green-100 text-green-700',
  Core: 'bg-amber-100 text-amber-700',
  Hard: 'bg-red-100 text-red-700',
}

export default function ProblemPicker({ onStart }: { onStart: (id: string) => void }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900">Pick a problem</h2>
      <p className="mt-0.5 text-sm text-slate-500">
        You’ll work through the interview stage by stage. The interviewer probes with
        follow-ups; at the end you get a leveling read (mid / senior / staff).
      </p>
      <ul className="mt-4 space-y-2">
        {PROBLEMS.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onStart(p.id)}
              className="group flex w-full items-start justify-between gap-3 rounded-lg border border-slate-200 p-4 text-left hover:border-indigo-300 hover:bg-indigo-50/40"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800">{p.title}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      DIFFICULTY_STYLE[p.difficulty] || 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {p.difficulty}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">{p.statement}</p>
              </div>
              <span className="mt-1 shrink-0 text-indigo-500 group-hover:translate-x-0.5">→</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
