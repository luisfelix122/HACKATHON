import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Aviso, Boton, Campo, SelloRna } from './componentes'

describe('componentes del sistema visual', () => {
  it('Campo asocia la etiqueta al control y anuncia el error', () => {
    render(
      <Campo etiqueta="Tu WhatsApp" error="Falta el +51.">
        {(a) => <input {...a} />}
      </Campo>,
    )
    const control = screen.getByLabelText('Tu WhatsApp')
    expect(control).toHaveAttribute('aria-invalid', 'true')
    expect(control).toHaveAccessibleDescription('Falta el +51.')
  })

  it('Boton cargando queda deshabilitado y ocupado', () => {
    render(<Boton cargando>Guardar</Boton>)
    const boton = screen.getByRole('button', { name: 'Guardar' })
    expect(boton).toBeDisabled()
    expect(boton).toHaveAttribute('aria-busy', 'true')
  })

  it('Aviso de error usa rol alert; los demás, status', () => {
    const { rerender } = render(<Aviso tono="error">No se pudo guardar.</Aviso>)
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo guardar.')
    rerender(<Aviso tono="exito">Guardado.</Aviso>)
    expect(screen.getByRole('status')).toHaveTextContent('Guardado.')
  })

  it('SelloRna distingue verificado de en revisión', () => {
    const { rerender } = render(<SelloRna estado="aprobada" />)
    expect(screen.getByRole('img', { name: 'RNA verificado' })).toBeInTheDocument()
    rerender(<SelloRna estado="pendiente" />)
    expect(screen.getByRole('img', { name: 'RNA en revisión' })).toBeInTheDocument()
  })
})
