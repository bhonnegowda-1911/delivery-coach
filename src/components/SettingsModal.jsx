import { useState } from 'react'
import { useApiKeys } from '../context/ApiKeyContext.jsx'

const ANTHROPIC_VALIDATE_MODEL = 'claude-haiku-4-5'

async function validateOpenai(key) {
  const res = await fetch('https://api.openai.com/v1/models', {
    headers: { Authorization: `Bearer ${key}` },
  })
  if (res.ok) return { ok: true }
  if (res.status === 401) return { ok: false, message: 'Invalid OpenAI key.' }
  return { ok: false, message: `OpenAI error (${res.status}).` }
}

async function validateAnthropic(key) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: ANTHROPIC_VALIDATE_MODEL,
      max_tokens: 1,
      messages: [{ role: 'user', content: 'hi' }],
    }),
  })
  if (res.ok) return { ok: true }
  if (res.status === 401) return { ok: false, message: 'Invalid Anthropic key.' }
  return { ok: false, message: `Anthropic error (${res.status}).` }
}

function KeyField({ label, hint, value, onChange, onValidate, status }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="flex gap-2">
        <input
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={hint}
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm font-mono focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          onClick={onValidate}
          disabled={!value || status === 'checking'}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {status === 'checking' ? 'Checking…' : 'Validate'}
        </button>
      </div>
      {status === 'valid' && <p className="text-sm text-green-600">✓ Key looks valid.</p>}
      {status && status !== 'checking' && status !== 'valid' && (
        <p className="text-sm text-red-600">{status}</p>
      )}
    </div>
  )
}

export default function SettingsModal({ open, onClose }) {
  const { openaiKey, anthropicKey, saveKeys } = useApiKeys()
  const [openaiDraft, setOpenaiDraft] = useState(openaiKey)
  const [anthropicDraft, setAnthropicDraft] = useState(anthropicKey)
  const [openaiStatus, setOpenaiStatus] = useState(null)
  const [anthropicStatus, setAnthropicStatus] = useState(null)

  if (!open) return null

  async function runValidate(which) {
    if (which === 'openai') {
      setOpenaiStatus('checking')
      try {
        const r = await validateOpenai(openaiDraft)
        setOpenaiStatus(r.ok ? 'valid' : r.message)
      } catch {
        setOpenaiStatus('Network error reaching OpenAI.')
      }
    } else {
      setAnthropicStatus('checking')
      try {
        const r = await validateAnthropic(anthropicDraft)
        setAnthropicStatus(r.ok ? 'valid' : r.message)
      } catch {
        setAnthropicStatus('Network error reaching Anthropic.')
      }
    }
  }

  function handleSave() {
    saveKeys({ openaiKey: openaiDraft.trim(), anthropicKey: anthropicDraft.trim() })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-900">API keys</h2>
        <p className="mt-1 text-sm text-slate-500">
          Keys are stored only on this device (local storage). Your audio and transcript are
          sent to OpenAI (transcription) and Anthropic (analysis) when you run a session.
        </p>

        <div className="mt-5 space-y-5">
          <KeyField
            label="OpenAI API key (Whisper transcription)"
            hint="sk-…"
            value={openaiDraft}
            onChange={(v) => {
              setOpenaiDraft(v)
              setOpenaiStatus(null)
            }}
            onValidate={() => runValidate('openai')}
            status={openaiStatus}
          />
          <KeyField
            label="Anthropic API key (Claude analysis)"
            hint="sk-ant-…"
            value={anthropicDraft}
            onChange={(v) => {
              setAnthropicDraft(v)
              setAnthropicStatus(null)
            }}
            onValidate={() => runValidate('anthropic')}
            status={anthropicStatus}
          />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
