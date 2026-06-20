import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

// API keys live only on-device (localStorage), never in session data.
const STORAGE_KEY = 'deliveryCoach.apiKeys'

interface ApiKeys {
  openaiKey: string
  anthropicKey: string
}

interface ApiKeyContextValue extends ApiKeys {
  saveKeys: (next: Partial<ApiKeys>) => void
  hasOpenai: boolean
  hasAnthropic: boolean
  hasAllKeys: boolean
}

const ApiKeyContext = createContext<ApiKeyContextValue | null>(null)

function loadKeys(): ApiKeys {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { openaiKey: '', anthropicKey: '' }
    const parsed = JSON.parse(raw)
    return {
      openaiKey: parsed.openaiKey || '',
      anthropicKey: parsed.anthropicKey || '',
    }
  } catch {
    return { openaiKey: '', anthropicKey: '' }
  }
}

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [keys, setKeys] = useState<ApiKeys>(loadKeys)

  const saveKeys = useCallback((next: Partial<ApiKeys>) => {
    setKeys((prev) => {
      const merged = { ...prev, ...next }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
      } catch {
        // localStorage may be unavailable (private mode) — keys still live in memory.
      }
      return merged
    })
  }, [])

  const value: ApiKeyContextValue = {
    openaiKey: keys.openaiKey,
    anthropicKey: keys.anthropicKey,
    saveKeys,
    hasOpenai: Boolean(keys.openaiKey),
    hasAnthropic: Boolean(keys.anthropicKey),
    hasAllKeys: Boolean(keys.openaiKey && keys.anthropicKey),
  }

  return <ApiKeyContext.Provider value={value}>{children}</ApiKeyContext.Provider>
}

export function useApiKeys(): ApiKeyContextValue {
  const ctx = useContext(ApiKeyContext)
  if (!ctx) throw new Error('useApiKeys must be used within an ApiKeyProvider')
  return ctx
}
