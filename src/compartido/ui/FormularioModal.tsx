import { useState, type ReactNode } from 'react'
import { Boton } from './componentes'
import { Modal } from './Modal'

/** Mantiene los campos montados para conservar lo escrito al cerrar y reabrir. */
export function FormularioModal({
  titulo,
  accion,
  children,
  ocupado = false,
  abiertoInicial = false,
}: {
  titulo: string
  accion: string
  children: ReactNode
  ocupado?: boolean
  abiertoInicial?: boolean
}) {
  const [abierto, setAbierto] = useState(abiertoInicial)
  return (
    <>
      <Boton variante="destacado" autoFocus={abiertoInicial} onClick={() => setAbierto(true)}>
        {accion}
      </Boton>
      <Modal abierto={abierto} titulo={titulo} alCerrar={() => setAbierto(false)} ocupado={ocupado}>
        {children}
      </Modal>
    </>
  )
}
