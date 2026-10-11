import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { listarUbicaciones } from '../ubicaciones'
import { SelectorUbicacion } from './SelectorUbicacion'
vi.mock('../ubicaciones', () => ({ listarUbicaciones: vi.fn() }))
const listar = vi.mocked(listarUbicaciones)
function Formulario() {
  const [valor, setValor] = useState({ departamento: '', provincia: '', distrito: '' })
  return <SelectorUbicacion valor={valor} alCambiar={setValor} />
}
beforeEach(() => {
  listar.mockReset()
  listar.mockImplementation(async (nivel, padre) => {
    if (nivel === 'departamento')
      return [
        { id: '20', nombre: 'Piura' },
        { id: '15', nombre: 'Lima' },
      ]
    if (nivel === 'provincia')
      return padre === '20' ? [{ id: '2007', nombre: 'Talara' }] : [{ id: '1501', nombre: 'Lima' }]
    return padre === '2007'
      ? [{ id: '200704', nombre: 'Lobitos' }]
      : [{ id: '150122', nombre: 'Miraflores' }]
  })
})
describe('ubicaciones dependientes', () => {
  it('solo habilita hijos después del padre y limpia el destino al cambiar departamento', async () => {
    render(<Formulario />)
    expect(screen.getByLabelText('Provincia')).toBeDisabled()
    expect(screen.getByLabelText('Distrito')).toBeDisabled()
    await screen.findByRole('option', { name: 'Piura' })
    fireEvent.change(screen.getByLabelText('Departamento'), { target: { value: 'Piura' } })
    await screen.findByRole('option', { name: 'Talara' })
    fireEvent.change(screen.getByLabelText('Provincia'), { target: { value: 'Talara' } })
    await screen.findByRole('option', { name: 'Lobitos' })
    fireEvent.change(screen.getByLabelText('Distrito'), { target: { value: 'Lobitos' } })
    expect(screen.getByLabelText('Distrito')).toHaveValue('Lobitos')
    fireEvent.change(screen.getByLabelText('Departamento'), { target: { value: 'Lima' } })
    expect(screen.getByLabelText('Provincia')).toHaveValue('')
    expect(screen.getByLabelText('Distrito')).toHaveValue('')
    expect(screen.getByLabelText('Distrito')).toBeDisabled()
    await waitFor(() =>
      expect(listar).toHaveBeenCalledWith('provincia', '15', expect.any(AbortSignal)),
    )
  })
  it('permite reintentar un catálogo que falla', async () => {
    listar.mockRejectedValueOnce(
      new Error('No pudimos cargar las ubicaciones. Revisa tu conexión y reintenta.'),
    )
    render(<Formulario />)
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos cargar las ubicaciones')
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar departamento' }))
    await screen.findByRole('option', { name: 'Piura' })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
  it('ignora una respuesta antigua después de cambiar departamento', async () => {
    let completar: (datos: { id: string; nombre: string }[]) => void = () => {}
    listar.mockImplementation(async (nivel, padre) => {
      if (nivel === 'departamento')
        return [
          { id: '20', nombre: 'Piura' },
          { id: '15', nombre: 'Lima' },
        ]
      if (padre === '20')
        return new Promise((resolve) => {
          completar = resolve
        })
      return [{ id: '1501', nombre: 'Lima' }]
    })
    render(<Formulario />)
    await screen.findByRole('option', { name: 'Piura' })
    fireEvent.change(screen.getByLabelText('Departamento'), { target: { value: 'Piura' } })
    fireEvent.change(screen.getByLabelText('Departamento'), { target: { value: 'Lima' } })
    await waitFor(() => expect(screen.getByLabelText('Provincia')).toBeEnabled())
    await act(async () => completar([{ id: '2007', nombre: 'Talara' }]))
    expect(screen.queryByRole('option', { name: 'Talara' })).not.toBeInTheDocument()
  })
})
