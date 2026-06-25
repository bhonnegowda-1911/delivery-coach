// Single source of truth for the backend origin + the authed fetch wrapper. In dev, Vite proxies
// `/api` → the API server, so the base is empty and requests are same-origin; set `VITE_API_BASE` to
// point at a remote API. Every store/client calls `apiFetch` so the auth token + base live in one place.

export const API_BASE = import.meta.env.VITE_API_BASE ?? ''

type ClerkGlobal = { session?: { getToken: () => Promise<string | null> } | null } | undefined

/** The current user's Clerk session JWT, or null when not signed in / Clerk isn't loaded (dev). */
async function clerkToken(): Promise<string | null> {
  const clerk = (globalThis as unknown as { Clerk?: ClerkGlobal }).Clerk
  if (!clerk?.session) return null
  try {
    return await clerk.session.getToken()
  } catch {
    return null
  }
}

/**
 * `fetch` for our backend: prepends `API_BASE` and attaches the Clerk session token as a Bearer
 * header so the server scopes the request to the signed-in user. Use this for every `/api` call.
 * Media elements (audio/img `src`) can't set headers — they authenticate via Clerk's same-origin
 * session cookie instead. In dev without Clerk configured, no token is attached and the server falls
 * back to the single dev user.
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers)
  const token = await clerkToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return fetch(`${API_BASE}${path}`, { ...init, headers })
}
