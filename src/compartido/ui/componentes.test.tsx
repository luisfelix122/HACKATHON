import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import tokensCss from './tokens.css?raw'
import { Aviso, Boton, Campo, Casilla, Matricula, SelloRna, Tablon } from './componentes'
import { Icono } from './Icono'

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

describe('Icono', () => {
  it('sin etiqueta es decorativo y queda oculto para lectores', () => {
    const { container } = render(<Icono nombre="pedidos" />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('con etiqueta se anuncia como imagen con ese nombre', () => {
    render(<Icono nombre="cerrar" etiqueta="Cerrar" />)
    expect(screen.getByRole('img', { name: 'Cerrar' })).toBeInTheDocument()
  })
})

describe('Matricula', () => {
  it('muestra la caleta como placa', () => {
    render(<Matricula>Cabo Blanco</Matricula>)
    expect(screen.getByText('Cabo Blanco')).toHaveClass('matricula')
  })
})

describe('Tablon', () => {
  it('muestra caleta, título, quién la hizo y el precio opcional', () => {
    const { rerender } = render(
      <Tablon titulo="Pieza" lugar="Lugar" artesano="Persona" tipo="textil" />,
    )
    expect(screen.getByRole('heading', { name: 'Pieza' })).toBeInTheDocument()
    expect(screen.getByText('Lugar')).toBeInTheDocument()
    expect(screen.getByText('Persona')).toBeInTheDocument()
    expect(screen.queryByText('S/ 10.00')).not.toBeInTheDocument()
    rerender(
      <Tablon titulo="Pieza" lugar="Lugar" artesano="Persona" tipo="textil" precio="S/ 10.00" />,
    )
    expect(screen.getByText('S/ 10.00')).toBeInTheDocument()
  })

  it('sin foto no inventa una imagen: dice que la foto aún no está', () => {
    render(<Tablon titulo="Pieza" lugar="Lugar" artesano="Persona" tipo="tallado" />)
    expect(screen.queryByRole('img', { name: /Pieza/ })).not.toBeInTheDocument()
    expect(screen.getByText('Sin foto todavía')).toBeInTheDocument()
  })

  it('con foto la muestra con un texto alternativo', () => {
    render(
      <Tablon
        titulo="Pieza"
        lugar="Lugar"
        artesano="Persona"
        tipo="textil"
        foto="https://x.test/a.jpg"
      />,
    )
    expect(screen.getByRole('img', { name: 'Foto de Pieza' })).toHaveAttribute(
      'src',
      'https://x.test/a.jpg',
    )
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

// Contraste WCAG 2.x con los valores reales de tokens.css (decisión 0006).
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

describe('tokens «Casco pintado»: contraste AA del texto', () => {
  const parejas: [texto: string, fondo: string][] = [
    ['brea', 'cal'],
    ['brea', 'blanco'],
    ['brea-suave', 'cal'],
    ['brea-suave', 'blanco'],
    ['brea-suave', 'mar'],
    ['brea-suave', 'sol-claro'],
    ['brea', 'sol'],
    ['brea', 'sol-claro'],
    ['brea', 'mar'],
    ['brea', 'casco-claro'],
    ['brea', 'borda-clara'],
    ['brea', 'alga-clara'],
    ['casco', 'cal'],
    ['casco', 'blanco'],
    ['casco', 'mar'],
    ['casco', 'casco-claro'],
    ['blanco', 'casco'],
    ['blanco', 'casco-hondo'],
    ['cal', 'casco'],
    ['sol', 'casco'],
    ['sol', 'casco-hondo'],
    ['blanco', 'borda'],
    ['blanco', 'borda-honda'],
    ['borda-honda', 'cal'],
    ['borda-honda', 'blanco'],
    ['borda-honda', 'borda-clara'],
    ['blanco', 'alga'],
    ['alga', 'cal'],
    ['cal', 'brea'],
  ]

  it.each(parejas)('%s sobre %s llega a 4,5:1', (texto, fondo) => {
    expect(contraste(texto, fondo)).toBeGreaterThanOrEqual(4.5)
  })

  it.each([
    ['sol', 'cal'],
    ['sol', 'blanco'],
    ['alga', 'alga-clara'],
  ])('%s no sirve como texto sobre %s (solo como color de campo o de ícono)', (texto, fondo) => {
    expect(contraste(texto, fondo)).toBeLessThan(4.5)
  })
})
