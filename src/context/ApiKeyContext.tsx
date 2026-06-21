import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react'

// LLM provider keys now live on the server (the backend gateway holds them). The frontend no
// longer stores or sends keys — it just asks the server which providers are configured, so the
// UI can gate features and show a helpful message when the backend isn't set up. The context
// name is kept (`useApiKeys`) so call sites don't churn.

const BASE = import.meta.env.VITE_API_BASE ?? ''

interface ApiKeyContextValue {
  /** True while the initial config fetch is in flight. */
  loading: boolean
  /** True if the backend responded (server reachable). */
  online: boolean
  hasOpenai: boolean
  hasAnthropic: boolean
  hasAllKeys: boolean
  refresh: () => void
}

const ApiKeyContext = createContext<ApiKeyContextValue | null>(null)

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [online, setOnline] = useState(false)
  const [providers, setProviders] = useState({ openai: false, anthropic: false })

  const refresh = useCallback(() => {
    setLoading(true)
    fetch(`${BASE}/api/config`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('config unavailable'))))
      .then((data: { providers?: { openai?: boolean; anthropic?: boolean } }) => {
        setProviders({
          openai: Boolean(data.providers?.openai),
          anthropic: Boolean(data.providers?.anthropic),
        })
        setOnline(true)
      })
      .catch(() => {
        setProviders({ openai: false, anthropic: false })
        setOnline(false)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(refresh, [refresh])

  const value: ApiKeyContextValue = {
    loading,
    online,
    hasOpenai: providers.openai,
    hasAnthropic: providers.anthropic,
    hasAllKeys: providers.openai && providers.anthropic,
    refresh,
  }

  return <ApiKeyContext.Provider value={value}>{children}</ApiKeyContext.Provider>
}

export function useApiKeys(): ApiKeyContextValue {
  const ctx = useContext(ApiKeyContext)
  if (!ctx) throw new Error('useApiKeys must be used within an ApiKeyProvider')
  return ctx
}
