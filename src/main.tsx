import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App'
import { ApiKeyProvider } from './context/ApiKeyContext'
import AuthGate from './components/AuthGate'

// Auth is opt-in by env: when VITE_CLERK_PUBLISHABLE_KEY is set, we mount Clerk + a login wall and the
// backend enforces auth. When it's unset (local dev before wiring Clerk), we render the app directly
// and the server treats every request as the single dev user — so localhost works out of the box.
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined

const app = (
  <ApiKeyProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ApiKeyProvider>
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {PUBLISHABLE_KEY ? (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
        <AuthGate>{app}</AuthGate>
      </ClerkProvider>
    ) : (
      app
    )}
  </StrictMode>,
)
