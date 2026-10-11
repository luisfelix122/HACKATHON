import { describe, it, expect } from 'vitest'
import { validarPublicacion, type DatosValidacionPublicacion } from './publicar'
import type { Ficha, FotoProducto } from '../compartido/dominio/producto'

describe('publicar.ts - validación previa a la publicación', () => {
  const fichaValida: Ficha = {
    titulo: 'Poncho artesanal',
    descripcion: 'Poncho tejido a mano con lana de ovino natural.',
    materiales: ['lana'],
    tecnica: 'telar de cintura',
    tipo_producto: 'textil',
    etiquetas: ['poncho', 'artesanal'],
  }

  const fotoPublicada: FotoProducto = {
    id: 'f-1',
    producto_id: 'p-1',
    origen: 'original',
    variante: null,
    ruta: 'u/p/original.jpg',
    publicada: true,
    posicion: 0,
  }

  const datosValidos: DatosValidacionPublicacion = {
    ficha: fichaValida,
    precioFinal: 85,
    disponibilidad: 'en_stock',
    plazoDias: null,
    revisionIa: 'aprobada',
    acreditacion: 'aprobada',
    fotos: [fotoPublicada],
  }

  it('valida exitosamente cuando todos los requisitos se cumplen', () => {
    const res = validarPublicacion(datosValidos)
    expect(res.valido).toBe(true)
    expect(res.errores).toHaveLength(0)
  })

  it('falla si el precio es nulo, cero o negativo', () => {
    const sinPrecio = validarPublicacion({ ...datosValidos, precioFinal: null })
    expect(sinPrecio.valido).toBe(false)
    expect(sinPrecio.errores.some((e) => e.includes('precio'))).toBe(true)

    const precioCero = validarPublicacion({ ...datosValidos, precioFinal: 0 })
    expect(precioCero.valido).toBe(false)

    const precioNegativo = validarPublicacion({ ...datosValidos, precioFinal: -10 })
    expect(precioNegativo.valido).toBe(false)
  })

  it('falla si la disponibilidad no está definida o a_pedido no tiene plazo_dias > 0', () => {
    const sinDisponibilidad = validarPublicacion({
      ...datosValidos,
      disponibilidad: null,
    })
    expect(sinDisponibilidad.valido).toBe(false)

    const aPedidoSinPlazo = validarPublicacion({
      ...datosValidos,
      disponibilidad: 'a_pedido',
      plazoDias: null,
    })
    expect(aPedidoSinPlazo.valido).toBe(false)
    expect(aPedidoSinPlazo.errores.some((e) => e.includes('plazo'))).toBe(true)

    const aPedidoPlazoCero = validarPublicacion({
      ...datosValidos,
      disponibilidad: 'a_pedido',
      plazoDias: 0,
    })
    expect(aPedidoPlazoCero.valido).toBe(false)

    const aPedidoValido = validarPublicacion({
      ...datosValidos,
      disponibilidad: 'a_pedido',
      plazoDias: 5,
    })
    expect(aPedidoValido.valido).toBe(true)
  })

  it('falla si no hay ninguna foto marcada como publicada', () => {
    const sinFotoPublicada = validarPublicacion({
      ...datosValidos,
      fotos: [{ ...fotoPublicada, publicada: false }],
    })
    expect(sinFotoPublicada.valido).toBe(false)
    expect(sinFotoPublicada.errores.some((e) => e.includes('foto'))).toBe(true)
  })

  it('falla si revision_ia es rechazada', () => {
    const rechazada = validarPublicacion({
      ...datosValidos,
      revisionIa: 'rechazada',
    })
    expect(rechazada.valido).toBe(false)
    expect(rechazada.errores.some((e) => e.includes('rechazado por la IA'))).toBe(true)
  })

  it('falla si la acreditación no está aprobada (pendiente o rechazada)', () => {
    const pendiente = validarPublicacion({
      ...datosValidos,
      acreditacion: 'pendiente',
    })
    expect(pendiente.valido).toBe(false)
    expect(pendiente.errores.some((e) => e.includes('acreditación'))).toBe(true)

    const rechazada = validarPublicacion({
      ...datosValidos,
      acreditacion: 'rechazada',
    })
    expect(rechazada.valido).toBe(false)
  })

  it('falla si la ficha está incompleta', () => {
    const sinTitulo = validarPublicacion({
      ...datosValidos,
      ficha: { ...fichaValida, titulo: '' },
    })
    expect(sinTitulo.valido).toBe(false)

    const sinMateriales = validarPublicacion({
      ...datosValidos,
      ficha: { ...fichaValida, materiales: [] },
    })
    expect(sinMateriales.valido).toBe(false)

    const sinFicha = validarPublicacion({
      ...datosValidos,
      ficha: null,
    })
    expect(sinFicha.valido).toBe(false)
  })
})
