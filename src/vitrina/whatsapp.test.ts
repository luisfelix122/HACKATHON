import { describe, expect, it } from 'vitest'
import { enlaceWhatsapp } from './whatsapp'

describe('contacto por WhatsApp', () => {
  it('usa el número internacional sin + y codifica espacios y tildes', () => {
    const url = new URL(enlaceWhatsapp('+51999999999', 'Árbol de mar')!)
    expect(url.origin + url.pathname).toBe('https://wa.me/51999999999')
    expect(url.searchParams.get('text')).toBe('Hola, me interesa el producto Árbol de mar.')
    expect(url.search).toContain('%C3%81rbol%20de%20mar')
  })
  it('no crea enlaces para números inválidos', () => {
    for (const numero of [
      '',
      'javascript:alert(1)',
      '+012345678',
      '+51 999999999',
      '51999999999',
    ]) {
      expect(enlaceWhatsapp(numero, 'Pieza')).toBeNull()
    }
  })
})
