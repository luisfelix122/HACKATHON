import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { Modal } from './Modal'

// jsdom no implementa showModal/close: se simulan con el atributo `open`.
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open')
  }
})

function Ejemplo({ alCerrar = () => {} }: { alCerrar?: () => void }) {
  const [abierto, setAbierto] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setAbierto(true)}>
        Rechazar
      </button>
      <Modal
        abierto={abierto}
        titulo="Rechazar la solicitud"
        alCerrar={() => {
          alCerrar()
          setAbierto(false)
        }}
      >
        <label htmlFor="motivo">Motivo</label>
        {/* No controlado: solo conserva lo escrito si el modal no desmonta su contenido. */}
        <textarea id="motivo" />
      </Modal>
    </>
  )
}

describe('Modal', () => {
  it('cerrado no se muestra; al abrir es un diálogo con su título', () => {
    render(<Ejemplo />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }))
    expect(screen.getByRole('dialog', { name: 'Rechazar la solicitud' })).toBeInTheDocument()
  })

  it('al abrir, el foco entra al primer campo', () => {
    render(<Ejemplo />)
    fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }))
    expect(screen.getByLabelText('Motivo')).toHaveFocus()
  })

  it('Esc (evento cancel) y el botón «Cerrar» lo cierran', () => {
    const alCerrar = vi.fn()
    render(<Ejemplo alCerrar={alCerrar} />)
    fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }))
    fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))
    expect(alCerrar).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(alCerrar).toHaveBeenCalledTimes(2)
  })

  it('al cerrar, el foco vuelve al botón que lo abrió', () => {
    render(<Ejemplo />)
    const disparador = screen.getByRole('button', { name: 'Rechazar' })
    disparador.focus()
    fireEvent.click(disparador)
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(disparador).toHaveFocus()
  })

  it('conserva lo escrito si se cierra sin enviar y se vuelve a abrir', () => {
    render(<Ejemplo />)
    fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }))
    fireEvent.change(screen.getByLabelText('Motivo'), { target: { value: 'RNA ilegible' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }))
    expect(screen.getByLabelText('Motivo')).toHaveValue('RNA ilegible')
  })

  it('si la pantalla lo desmonta abierto, el foco vuelve a quien lo abrió', () => {
    function Pantalla({ visible }: { visible: boolean }) {
      return (
        <>
          <button type="button">Abrir</button>
          {visible && (
            <Modal abierto titulo="Prueba" alCerrar={() => {}}>
              <input aria-label="Dato" />
            </Modal>
          )}
        </>
      )
    }
    const { rerender } = render(<Pantalla visible={false} />)
    screen.getByRole('button', { name: 'Abrir' }).focus()
    rerender(<Pantalla visible />)
    expect(screen.getByLabelText('Dato')).toHaveFocus()
    rerender(<Pantalla visible={false} />)
    expect(screen.getByRole('button', { name: 'Abrir' })).toHaveFocus()
  })
})
