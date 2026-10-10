import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppArtesano } from './AppArtesano'
import { AppWeb } from './AppWeb'

describe('salidas de la app', () => {
  it('la web muestra la vitrina en la ruta raíz', () => {
    render(<AppWeb />)
    expect(screen.getByRole('heading', { name: 'CosteARTE' })).toBeInTheDocument()
  })

  it('la APK del artesano abre en «Mis productos»', () => {
    render(<AppArtesano />)
    expect(screen.getByRole('heading', { name: 'Mis productos' })).toBeInTheDocument()
  })
})
