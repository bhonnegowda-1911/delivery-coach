import { clerkMiddleware, getAuth } from '@clerk/express'
import type { Request, Response, NextFunction } from 'express'

// Auth layer. Identity comes from Clerk: the frontend sends the session JWT as a Bearer token,
// clerkMiddleware verifies it, and getAuth(req).userId is the stable per-user id we scope all data
// by. BYOK is unaffected — provider keys still live in the browser; auth only scopes DATA.
//
// Local dev without Clerk configured: when CLERK_SECRET_KEY is unset, the whole app runs as a single
// fixed user (DEV_USER_ID, default 'local-dev'), so localhost works before you wire up Clerk keys.

const CLERK_SECRET = (process.env.CLERK_SECRET_KEY || '').trim()
const DEV_USER_ID = (process.env.DEV_USER_ID || 'local-dev').trim()

/** True when Clerk keys are present — real auth is enforced. False = single-user dev mode. */
export const authEnabled = Boolean(CLERK_SECRET)

/** Clerk's verifier; only mounted when auth is enabled. */
export const clerk = clerkMiddleware()

// Let route handlers read req.userId (set by requireUser).
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}

/** The authenticated user id for this request, or null if not signed in. */
export function userIdFor(req: Request): string | null {
  if (!authEnabled) return DEV_USER_ID // single-user dev mode
  const { userId } = getAuth(req)
  return userId ?? null
}

/** Gate a router: 401 unless signed in, otherwise stamp req.userId for handlers to scope by. */
export function requireUser(req: Request, res: Response, next: NextFunction): void {
  const uid = userIdFor(req)
  if (!uid) {
    res.status(401).json({ error: 'Sign in required.' })
    return
  }
  req.userId = uid
  next()
}
