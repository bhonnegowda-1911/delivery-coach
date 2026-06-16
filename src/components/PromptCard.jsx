export default function PromptCard({ prompt }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
        {prompt.label}
      </div>
      <p className="mt-2 text-lg leading-relaxed text-slate-800">{prompt.text}</p>
    </div>
  )
}
