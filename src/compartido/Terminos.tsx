import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useSesion } from './sesion'
import { Aviso, Boton } from './ui/componentes'
import { aceptarTerminos, consultarAceptacion, VERSION_TERMINOS } from './aceptacionTerminos'
import './terminos.css'

export function Terminos() {
  const { sesion } = useSesion()
  const cuenta = sesion?.user.id
  const [confirmacion, setConfirmacion] = useState<{ cuenta: string; marcada: boolean } | null>(
    null,
  )
  const [resultado, setResultado] = useState<{ cuenta: string; error: string | null } | null>(null)
  const marcado = confirmacion !== null && confirmacion.cuenta === cuenta && confirmacion.marcada
  const aceptado = cuenta ? consultarAceptacion(cuenta) : null
  function aceptar() {
    if (!cuenta || !marcado) return
    try {
      aceptarTerminos(cuenta)
      setResultado({ cuenta, error: null })
    } catch {
      setResultado({
        cuenta,
        error:
          'No pudimos guardar la aceptación en este dispositivo. Revisa el almacenamiento y reintenta.',
      })
    }
  }
  return (
    <main className="pagina terminos">
      <Link to="/">Volver al inicio</Link>
      <h1>Términos y condiciones</h1>
      <Aviso tono="alerta">
        Borrador para la demostración. Pendiente de aprobación legal humana. Versión{' '}
        {VERSION_TERMINOS}.
      </Aviso>
      <section>
        <h2>Qué es Ayllu</h2>
        <p>
          Ayllu permite mostrar piezas artesanales y coordinar pedidos entre artesanos y
          compradores. La persona artesana es responsable de la información, el precio, la
          disponibilidad y los acuerdos de su pieza.
        </p>
      </section>
      <section>
        <h2>Acreditación e información</h2>
        <p>
          La acreditación RNA declarada se revisa manualmente. Solo una cuenta aprobada puede
          publicar. No compartas credenciales ni información de terceros sin su permiso. Los datos
          de demostración son ficticios.
        </p>
      </section>
      <section>
        <h2>Pedidos, pagos y entrega</h2>
        <p>
          El comprador y el artesano acuerdan precio, plazo y modalidad de entrega en el pedido. El
          artesano proporciona un enlace de pago y verifica el pago manualmente. Ayllu no procesa
          pagos ni integra agencias de encomiendas. Antes de pagar, confirma el destinatario y las
          condiciones con el artesano.
        </p>
        <p>
          Los cambios, devoluciones o incidencias deben coordinarse con el artesano. Este borrador
          no limita los derechos que correspondan al comprador.
        </p>
      </section>
      <section>
        <h2>Fotos, audio e inteligencia artificial</h2>
        <p>
          Las fotos y audios que envías pueden procesarse para preparar una ficha o traducir
          mensajes. Revisa el resultado antes de publicar: la inteligencia artificial puede
          equivocarse. La foto original se conserva y la IA no publica por sí sola.
        </p>
      </section>
      <section>
        <h2>Conexión y almacenamiento</h2>
        <p>
          Los borradores pueden guardarse en este dispositivo sin señal. No desinstales la app ni
          borres sus datos antes de sincronizarlos. Las funciones remotas necesitan conexión.
        </p>
      </section>
      <section>
        <h2>Aceptación en este dispositivo</h2>
        <p>
          La aceptación se registra solo en el almacenamiento local, separada por cuenta y versión.
          No es un registro de consentimiento en el servidor y no se comparte entre dispositivos.
          Puedes leer estos términos sin iniciar sesión.
        </p>
        {cuenta ? (
          <>
            {aceptado ? (
              <Aviso tono="exito">Aceptaste esta versión en este dispositivo.</Aviso>
            ) : (
              <>
                <label className="terminos-confirmacion">
                  <input
                    type="checkbox"
                    checked={Boolean(marcado)}
                    onChange={(e) => setConfirmacion({ cuenta, marcada: e.target.checked })}
                  />
                  He leído este borrador y acepto sus condiciones para esta demostración.
                </label>
                <Boton disabled={!marcado} onClick={aceptar}>
                  Registrar aceptación local
                </Boton>
              </>
            )}
            {resultado?.cuenta === cuenta && resultado.error && (
              <Aviso tono="error">{resultado.error}</Aviso>
            )}
          </>
        ) : (
          <Aviso>Ingresa con tu cuenta para registrar la aceptación en este dispositivo.</Aviso>
        )}
      </section>
    </main>
  )
}
