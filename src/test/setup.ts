import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Sin `globals` en Vitest, Testing Library no limpia el DOM entre pruebas.
afterEach(() => cleanup())
