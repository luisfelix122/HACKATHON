import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import { Aviso, Logotipo } from '../compartido/ui/componentes'

// Web del comprador y del administrador. Las pantallas reales llegan con los
// PRP 001 (admin) y 004 (vitrina); cada módulo declara sus rutas en su carpeta.

function Barra() {
  return (
    <header className="barra">
      <div className="barra-contenido">
        <Link to="/" aria-label="Ayllu, inicio">
          <Logotipo />
        </Link>
      </div>
    </header>
  )
}

function Portada() {
  return (
    <main className="pagina">
      <section className="portada">
        <h1>Ayllu</h1>
        <p className="portada-bajada">
          Piezas hechas a mano en las caletas del norte de Piura, con el nombre de quien las hizo.
        </p>
      </section>
      <Aviso>Las piezas aparecen aquí cuando los artesanos las publican.</Aviso>
    </main>
  )
}

function Producto() {
  return (
    <main className="pagina">
      <h1>Producto</h1>
      <Aviso>La ficha de cada pieza se muestra aquí.</Aviso>
    </main>
  )
}

function Administracion() {
  return (
    <main className="pagina">
      <h1>Administración</h1>
      <Aviso>Aquí revisarás el RNA de los artesanos que piden acreditación.</Aviso>
    </main>
  )
}

function NoEncontrada() {
  return (
    <main className="pagina">
      <h1>Página no encontrada</h1>
      <p className="texto-secundario">Esta dirección no existe o cambió.</p>
      <p>
        <Link className="boton boton-secundario" to="/">
          Volver al inicio
        </Link>
      </p>
    </main>
  )
}

export function AppWeb() {
  return (
    <BrowserRouter>
      <Barra />
      <Routes>
        <Route path="/" element={<Portada />} />
        <Route path="/producto/:id" element={<Producto />} />
        <Route path="/admin" element={<Administracion />} />
        <Route path="*" element={<NoEncontrada />} />
      </Routes>
    </BrowserRouter>
  )
}
