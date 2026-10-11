/** El contrato exige E.164; nunca aceptar protocolos ni números incompletos. */
export function enlaceWhatsapp(numero: string, nombre: string): string | null {
  if (!/^\+[1-9][0-9]{7,14}$/.test(numero)) return null
  return `https://wa.me/${numero.slice(1)}?text=${encodeURIComponent(`Hola, me interesa el producto ${nombre}.`)}`
}
