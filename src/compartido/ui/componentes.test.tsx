import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import tokensCss from './tokens.css?raw'
import { Aviso, Boton, Campo, Casilla, Etiqueta, SelloRna } from './componentes'

describe('Boton', () => {
  it('es primario por defecto y no envía formularios sin pedirlo', () => {
    render(<Boton>Guardar</Boton>)
    const boton = screen.getByRole('button', { name: 'Guardar' })
    expect(boton).toHaveAttribute('type', 'button')
    expect(boton).toHaveClass('boton')
    expect(boton).not.toHaveClass('boton-destacado')
  })

  it('aplica la variante destacada', () => {
    render(<Boton variante="destacado">Publicar</Boton>)
    expect(screen.getByRole('button', { name: 'Publicar' })).toHaveClass('boton-destacado')
  })

  it('cargando: queda deshabilitado y anuncia que está ocupado', () => {
    render(<Boton cargando>Guardar</Boton>)
    const boton = screen.getByRole('button', { name: 'Guardar' })
    expect(boton).toBeDisabled()
    expect(boton).toHaveAttribute('aria-busy', 'true')
  })

  it('deshabilitado: no anuncia carga', () => {
    render(<Boton disabled>Guardar</Boton>)
    const boton = screen.getByRole('button', { name: 'Guardar' })
    expect(boton).toBeDisabled()
    expect(boton).not.toHaveAttribute('aria-busy')
  })
})

describe('Campo', () => {
  it('asocia la etiqueta al control y la ayuda con aria-describedby', () => {
    render(
      <Campo etiqueta="Nombre" ayuda="Como te conocen los compradores">
        {(a) => <input {...a} />}
      </Campo>,
    )
    const control = screen.getByLabelText('Nombre')
    expect(control).toHaveAccessibleDescription('Como te conocen los compradores')
    expect(control).not.toHaveAttribute('aria-invalid')
  })

  it('con error: marca aria-invalid y describe el error en lugar de la ayuda', () => {
    render(
      <Campo etiqueta="WhatsApp" ayuda="Con código de país" error="Escribe un número válido">
        {(a) => <input {...a} />}
      </Campo>,
    )
    const control = screen.getByLabelText('WhatsApp')
    expect(control).toHaveAttribute('aria-invalid', 'true')
    expect(control).toHaveAccessibleDescription('Escribe un número válido')
    expect(screen.queryByText('Con código de país')).not.toBeInTheDocument()
  })

  it('sin ayuda ni error no agrega descripción', () => {
    render(<Campo etiqueta="Asociación">{(a) => <input {...a} />}</Campo>)
    expect(screen.getByLabelText('Asociación')).not.toHaveAttribute('aria-describedby')
  })
})

describe('Aviso', () => {
  it('es un estado (role="status") por defecto', () => {
    render(<Aviso>Guardado en tu celular</Aviso>)
    expect(screen.getByRole('status')).toHaveTextContent('Guardado en tu celular')
  })

  it('sin señal también es un estado', () => {
    render(<Aviso tono="sin-senal">Sin señal: lo guardamos en tu celular</Aviso>)
    expect(screen.getByRole('status')).toHaveClass('aviso-sin-senal')
  })

  it('un error se anuncia de inmediato (role="alert")', () => {
    render(<Aviso tono="error">No pudimos guardar</Aviso>)
    expect(screen.getByRole('alert')).toHaveTextContent('No pudimos guardar')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})

describe('SelloRna', () => {
  it('aprobada se lee como «RNA verificado»', () => {
    render(<SelloRna estado="aprobada" />)
    expect(screen.getByRole('img', { name: 'RNA verificado' })).not.toHaveClass('sello-pendiente')
  })

  it('pendiente se lee como «RNA en revisión» y se dibuja sin tinta', () => {
    render(<SelloRna estado="pendiente" />)
    expect(screen.getByRole('img', { name: 'RNA en revisión' })).toHaveClass('sello-pendiente')
  })
})

describe('Etiqueta', () => {
  it('muestra lugar, título y quién la hizo; el precio es opcional', () => {
    const { rerender } = render(<Etiqueta titulo="Pieza" lugar="Lugar" artesano="Persona" />)
    expect(screen.getByRole('heading', { name: 'Pieza' })).toBeInTheDocument()
    expect(screen.getByText('Lugar')).toBeInTheDocument()
    expect(screen.getByText('Hecho por Persona')).toBeInTheDocument()
    expect(screen.queryByText('S/ 10.00')).not.toBeInTheDocument()
    rerender(<Etiqueta titulo="Pieza" lugar="Lugar" artesano="Persona" precio="S/ 10.00" />)
    expect(screen.getByText('S/ 10.00')).toBeInTheDocument()
  })
})

describe('Casilla', () => {
  it('agrupa un paso con su número, que no se lee como texto suelto', () => {
    render(
      <Casilla numero={2} titulo="Tu precio">
        <p>Contenido del paso</p>
      </Casilla>,
    )
    const grupo = screen.getByRole('group', { name: 'Paso 2: Tu precio' })
    expect(grupo).toHaveTextContent('Contenido del paso')
    expect(screen.getByText('2')).toHaveAttribute('aria-hidden', 'true')
  })
})

// Contraste WCAG 2.x con los valores reales de tokens.css (decisión 0004).
function token(nombre: string): string {
  const coincidencia = new RegExp(`--${nombre}:\\s*(#[0-9a-fA-F]{6})`).exec(tokensCss)
  if (!coincidencia?.[1]) throw new Error(`Falta el token --${nombre}`)
  return coincidencia[1]
}

function luminancia(hex: string): number {
  const canales = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  const [r = 0, g = 0, b = 0] = canales
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contraste(a: string, b: string): number {
  const [claro, oscuro] = [luminancia(token(a)), luminancia(token(b))].sort((x, y) => y - x)
  return (claro! + 0.05) / (oscuro! + 0.05)
}

describe('tokens: contraste AA del texto', () => {
  const parejas: [texto: string, fondo: string][] = [
    ['noche', 'espuma'],
    ['noche', 'blanco'],
    ['noche-suave', 'espuma'],
    ['noche-suave', 'blanco'],
    ['pacifico', 'espuma'],
    ['blanco', 'pacifico'],
    ['blanco', 'pacifico-hondo'],
    ['noche', 'arena'],
    ['noche', 'arena-clara'],
    ['noche', 'sol'],
    ['noche', 'sol-claro'],
    ['noche', 'ola-clara'],
    ['error', 'blanco'],
    ['error', 'error-claro'],
    ['espuma', 'noche'],
    ['error', 'espuma'],
    ['pacifico', 'blanco'],
    ['pacifico', 'ola-clara'],
    ['pacifico', 'arena'],
    ['noche-suave', 'arena'],
    ['sol', 'pacifico'],
  ]

  it.each(parejas)('%s sobre %s llega a 4,5:1', (texto, fondo) => {
    expect(contraste(texto, fondo)).toBeGreaterThanOrEqual(4.5)
  })

  it.each([
    ['arena', 'blanco'],
    ['sol', 'blanco'],
  ])('%s no sirve como texto sobre %s (solo como fondo)', (texto, fondo) => {
    expect(contraste(texto, fondo)).toBeLessThan(4.5)
  })
})
