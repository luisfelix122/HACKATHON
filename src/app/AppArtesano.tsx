import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Logotipo } from '../compartido/ui/componentes'

// APK del artesano. Solo monta sus rutas: no incluye la vitrina ni el panel del
// administrador. Las pantallas reales llegan con los PRP 001–003.

function MisProductos() {
  return (
    <main className="pagina pagina-artesano">
      <h1>Mis productos</h1>
      <p className="texto-secundario">Aún no tienes productos. Toca Nuevo.</p>
    </main>
  )
}

export function AppArtesano() {
  return (
    <BrowserRouter>
      <header className="barra">
        <div className="barra-contenido">
          <Logotipo />
        </div>
      </header>
      <Routes>
        <Route path="/" element={<MisProductos />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
