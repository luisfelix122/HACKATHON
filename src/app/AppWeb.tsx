import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'

// Web del comprador y del administrador. Las pantallas reales llegan con los
// PRP 001 (admin) y 004 (vitrina); cada módulo declara sus rutas en su carpeta.

function Portada() {
  return (
    <main className="pagina">
      <h1>Ayllu</h1>
      <p>Vitrina de artesanías de las playas del norte de Piura y Talara.</p>
    </main>
  )
}

function Producto() {
  return (
    <main className="pagina">
      <h1>Producto</h1>
    </main>
  )
}

function Administracion() {
  return (
    <main className="pagina">
      <h1>Administración</h1>
    </main>
  )
}

function NoEncontrada() {
  return (
    <main className="pagina">
      <h1>Página no encontrada</h1>
      <Link to="/">Volver al inicio</Link>
    </main>
  )
}

export function AppWeb() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Portada />} />
        <Route path="/producto/:id" element={<Producto />} />
        <Route path="/admin" element={<Administracion />} />
        <Route path="*" element={<NoEncontrada />} />
      </Routes>
    </BrowserRouter>
  )
}
