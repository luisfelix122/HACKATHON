import { HashRouter, Route, Routes } from 'react-router-dom'

function MisProductos() {
  return (
    <main className="pagina">
      <h1>Mis productos</h1>
      <p>Aún no tienes productos.</p>
    </main>
  )
}

/**
 * APK del artesano (Capacitor). HashRouter porque la app se sirve desde
 * archivos locales dentro de la APK y no hay servidor que resuelva rutas.
 */
export function AppArtesano() {
  return (
    <HashRouter>
      <Routes>
        <Route path="*" element={<MisProductos />} />
      </Routes>
    </HashRouter>
  )
}
