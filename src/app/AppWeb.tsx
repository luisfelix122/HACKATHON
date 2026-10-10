import { BrowserRouter, Route, Routes } from 'react-router-dom'

function Inicio() {
  return (
    <main className="pagina">
      <h1>CosteARTE</h1>
      <p>Artesanía de las playas del norte de Piura y Talara.</p>
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

function AdminPendiente() {
  return (
    <main className="pagina">
      <h1>Administración</h1>
    </main>
  )
}

/** Web del comprador y del administrador (Vercel). */
export function AppWeb() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/producto/:id" element={<ProductoPendiente />} />
        <Route path="/admin" element={<AdminPendiente />} />
        <Route path="*" element={<Inicio />} />
      </Routes>
    </BrowserRouter>
  )
}
