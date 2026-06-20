import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // The Plugin type can differ between the project's `vite` and the copy bundled with
  // `vitest`; the runtime is identical, so cast to keep the config type-checking.
  plugins: [react(), tailwindcss()] as never,
  test: {
    environment: 'node',
    include: ['src/test/**/*.test.{ts,tsx}'],
  },
})
