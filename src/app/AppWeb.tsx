import { useEffect, useState } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { PantallaIngresoWeb } from '../acceso/PantallaIngresoWeb'
import { asegurarPerfilComprador } from '../acceso/perfil'
import { RegistroArtesano } from '../acceso/RegistroArtesano'
import { cerrarSesion, useSesion } from '../acceso/sesion'
import { usePerfil } from '../acceso/usePerfil'
import { PanelAcreditacion } from '../admin/PanelAcreditacion'

function Inicio() {
  return (
    <main className="pagina">
      <h1>CosteARTE</h1>
      <p>Artesanía de las playas del norte de Piura y Talara.</p>
      <p>
        <Link to="/ingresar">Ingresar</Link> · <Link to="/artesano/registro">Soy artesano</Link>
      </p>
    </main>
  )
}

function ProductoPendiente() {
  return (
    <main className="pagina">
      <p>Producto no disponible.</p>
    </main>
  )
}

/** Ingreso del comprador: al volver de Google crea su perfil si no existe. */
function Ingresar() {
  const sesion = useSesion()
  const [listo, setListo] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!sesion) return
    const nombre = (sesion.user.user_metadata?.full_name as string | undefined) ?? ''
    asegurarPerfilComprador(sesion.user.id, nombre)
      .then(() => setListo(true))
      .catch(() => setError(true))
  }, [sesion])

  if (sesion === undefined) return <p className="pagina">Cargando…</p>
  if (!sesion)
    return (
      <main className="pagina">
        <PantallaIngresoWeb rutaRetorno="/ingresar" />
      </main>
    )
  if (error)
    return <p className="pagina error">No pudimos preparar tu cuenta. Recarga la página.</p>
  return listo ? <Navigate to="/" replace /> : <p className="pagina">Preparando tu cuenta…</p>
}

function Admin() {
  const sesion = useSesion()
  const { perfil, cargando } = usePerfil(sesion?.user.id)

  if (sesion === undefined || cargando) return <p className="pagina">Cargando…</p>
  if (!sesion)
    return (
      <main className="pagina">
        <PantallaIngresoWeb rutaRetorno="/admin" />
      </main>
    )
  if (perfil?.rol !== 'admin')
    return (
      <main className="pagina">
        <p>Esta sección es solo para administradores.</p>
        <button onClick={cerrarSesion}>Cerrar sesión</button>
      </main>
    )
  return (
    <main className="pagina">
      <h1>Administración</h1>
      <h2>Solicitudes de acreditación</h2>
      <PanelAcreditacion />
    </main>
  )
}

/** Web del comprador y del administrador (Vercel). */
export function AppWeb() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/ingresar" element={<Ingresar />} />
        <Route path="/artesano/registro" element={<RegistroArtesano />} />
        <Route path="/producto/:id" element={<ProductoPendiente />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Inicio />} />
      </Routes>
    </BrowserRouter>
  )
}
