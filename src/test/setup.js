import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => {
  cleanup()
  sessionStorage.clear()
  vi.clearAllMocks()
})

Object.defineProperty(window, 'scrollTo', { value: vi.fn(), writable: true })

