import type { ReactNode } from 'react'
import { SignedIn, SignedOut, SignIn } from '@clerk/clerk-react'
import Logo from './Logo'

// Login wall, mounted only when Clerk is configured (see main.tsx). Signed-in users get the app;
// everyone else gets a centered sign-in card (Clerk's <SignIn> also links to sign-up). In dev without
// Clerk keys, main.tsx skips this entirely and renders the app directly as the single dev user.
export default function AuthGate({ children }: { children: ReactNode }) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-[#f9f5ee] to-[#f1e8da] px-4 py-10">
          <div className="flex items-center gap-2.5">
            <Logo size={40} className="shrink-0" />
            <div>
              <h1 className="font-serif text-2xl font-semibold tracking-tight text-stone-900">Lull</h1>
              <p className="text-sm text-stone-500">Quiet the noise before the interview.</p>
            </div>
          </div>
          <SignIn routing="hash" />
        </div>
      </SignedOut>
    </>
  )
}
