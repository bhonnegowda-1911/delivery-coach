import { createContext, useContext, useState, useCallback } from 'react'

// API keys live only on-device (localStorage), never in session data.
const STORAGE_KEY = 'deliveryCoach.apiKeys'

const ApiKeyContext = createContext(null)

function loadKeys() {
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

export function ApiKeyProvider({ children }) {
  const [keys, setKeys] = useState(loadKeys)

  const saveKeys = useCallback((next) => {
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

  const value = {
    openaiKey: keys.openaiKey,
    anthropicKey: keys.anthropicKey,
    saveKeys,
    hasOpenai: Boolean(keys.openaiKey),
    hasAnthropic: Boolean(keys.anthropicKey),
    hasAllKeys: Boolean(keys.openaiKey && keys.anthropicKey),
  }

  return <ApiKeyContext.Provider value={value}>{children}</ApiKeyContext.Provider>
}

export function useApiKeys() {
  const ctx = useContext(ApiKeyContext)
  if (!ctx) throw new Error('useApiKeys must be used within an ApiKeyProvider')
  return ctx
}
