import { useEffect, useState, type ReactNode } from 'react'
import { Aviso, Boton, Campo } from '../compartido/ui/componentes'
import { Icono } from '../compartido/ui/Icono'
import {
  NOMBRE_TIPO,
  TIPOS_METODO_PAGO,
  borrarMetodoPago,
  guardarMetodoPago,
  listarMetodosPago,
  urlQr,
  validarMetodoPago,
  type BorradorMetodoPago,
  type MetodoPago,
} from './metodosPago'

const VACIO: BorradorMetodoPago = { tipo: 'yape', titular: '', numero: '', banco: '', cci: '' }

/** Lee los métodos de un artesano; `null` mientras carga. */
function useMetodosPago(artesanoId: string | null | undefined) {
  const [estado, setEstado] = useState<{
    clave: string
    metodos: MetodoPago[] | null
    error: string | null
  } | null>(null)
  const [intento, setIntento] = useState(0)
  const clave = `${artesanoId}:${intento}`
  useEffect(() => {
    if (!artesanoId) return
    let vigente = true
    listarMetodosPago(artesanoId).then(
      (metodos) => vigente && setEstado({ clave, metodos, error: null }),
      (causa: unknown) =>
        vigente &&
        setEstado({
          clave,
          metodos: null,
          error: causa instanceof Error ? causa.message : 'No pudimos leer los métodos de pago.',
        }),
    )
    return () => {
      vigente = false
    }
  }, [artesanoId, clave])
  const actual = estado?.clave === clave ? estado : null
  return {
    metodos: actual?.metodos ?? null,
    error: actual?.error ?? null,
    recargar: () => setIntento((valor) => valor + 1),
  }
}

function DatoCopiable({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  const [copiado, setCopiado] = useState(false)
  return (
    <div className="pago-dato">
      <dt>{etiqueta}</dt>
      <dd>
        <span className="cifra">{valor}</span>
        <button
          type="button"
          className="pago-copiar"
          aria-label={`Copiar ${etiqueta.toLowerCase()}`}
          onClick={() => {
            void navigator.clipboard?.writeText(valor).then(() => setCopiado(true))
          }}
        >
          {copiado ? 'Copiado' : 'Copiar'}
        </button>
      </dd>
    </div>
  )
}

function TarjetaMetodo({ metodo, children }: { metodo: MetodoPago; children?: ReactNode }) {
  const esCuenta = metodo.tipo === 'cuenta_bancaria'
  return (
    <li className="pago-metodo" data-tipo={metodo.tipo}>
      <h3>{esCuenta ? metodo.banco : NOMBRE_TIPO[metodo.tipo]}</h3>
      {metodo.qr_ruta && (
        <img
          className="pago-qr"
          src={urlQr(metodo.qr_ruta)}
          alt={`QR de ${NOMBRE_TIPO[metodo.tipo]} de ${metodo.titular}`}
          loading="lazy"
        />
      )}
      <dl>
        <DatoCopiable etiqueta={esCuenta ? 'Número de cuenta' : 'Celular'} valor={metodo.numero} />
        {metodo.cci && <DatoCopiable etiqueta="CCI" valor={metodo.cci} />}
        <div className="pago-dato">
          <dt>Titular</dt>
          <dd>{metodo.titular}</dd>
        </div>
      </dl>
      {children}
    </li>
  )
}

/** Lo que ve el comprador mientras la orden espera su pago. */
export function ComoPagar({
  artesanoId,
  enlace,
  total,
}: {
  artesanoId: string | null | undefined
  enlace: string | null
  total: number | null
}) {
  const { metodos, error, recargar } = useMetodosPago(artesanoId)
  return (
    <div className="pago-como">
      <h3>Cómo pagar{total !== null && ` S/ ${total.toFixed(2)}`}</h3>
      {error && (
        <Aviso tono="error">
          {error}
          <Boton onClick={recargar}>Reintentar</Boton>
        </Aviso>
      )}
      {metodos && metodos.length > 0 && (
        <ul className="pago-metodos">
          {metodos.map((metodo) => (
            <TarjetaMetodo key={metodo.id} metodo={metodo} />
          ))}
        </ul>
      )}
      {enlace && (
        <a href={enlace} target="_blank" rel="noopener noreferrer" className="boton">
          <Icono nombre="pago" />
          Pagar con enlace
        </a>
      )}
      {metodos && metodos.length === 0 && !enlace && (
        <Aviso tono="alerta">El artesano aún no dejó cómo pagarle. Escríbele en el chat.</Aviso>
      )}
      <p>
        El pago se realiza fuera de Ayllu. Cuando pagues, avisa en el chat; el artesano verificará
        el abono.
      </p>
    </div>
  )
}

/** El artesano revisa, agrega o quita sus métodos de cobro. */
export function GestorMetodosPago({
  artesanoId,
  alCargar,
}: {
  artesanoId: string | null | undefined
  alCargar: (cantidad: number) => void
}) {
  const { metodos, error, recargar } = useMetodosPago(artesanoId)
  const [agregando, setAgregando] = useState(false)
  const [borrador, setBorrador] = useState<BorradorMetodoPago>(VACIO)
  const [qr, setQr] = useState<File | null>(null)
  const [enviado, setEnviado] = useState(false)
  const [ocupado, setOcupado] = useState(false)
  const [fallo, setFallo] = useState<string | null>(null)
  const { datos, errores } = validarMetodoPago(borrador)
  const mostrar = (campo: keyof BorradorMetodoPago) => (enviado ? errores[campo] : undefined)
  const esCuenta = borrador.tipo === 'cuenta_bancaria'
  const cambiar = (campo: keyof BorradorMetodoPago, valor: string) =>
    setBorrador((actual) => ({ ...actual, [campo]: valor }))

  useEffect(() => {
    if (metodos) alCargar(metodos.length)
  }, [metodos, alCargar])

  async function ejecutar(tarea: () => Promise<unknown>) {
    setOcupado(true)
    setFallo(null)
    try {
      await tarea()
      recargar()
      return true
    } catch (causa) {
      setFallo(causa instanceof Error ? causa.message : 'No pudimos guardar el cambio.')
      return false
    } finally {
      setOcupado(false)
    }
  }

  if (!artesanoId) return null
  return (
    <section className="pago-gestor" aria-label="Tus métodos de cobro">
      <h3>Tus métodos de cobro</h3>
      {error && <Aviso tono="error">{error}</Aviso>}
      {fallo && <Aviso tono="error">{fallo}</Aviso>}
      {metodos === null && !error && <p>Cargando…</p>}
      {metodos?.length === 0 && (
        <p className="texto-secundario">
          Agrega tu Yape, Plin o cuenta bancaria. Se guardan para tus próximos pedidos.
        </p>
      )}
      {metodos && metodos.length > 0 && (
        <ul className="pago-metodos">
          {metodos.map((metodo) => (
            <TarjetaMetodo key={metodo.id} metodo={metodo}>
              <Boton
                variante="secundario"
                icono="borrar"
                disabled={ocupado}
                onClick={() => void ejecutar(() => borrarMetodoPago(metodo))}
              >
                Quitar
              </Boton>
            </TarjetaMetodo>
          ))}
        </ul>
      )}
      {!agregando ? (
        <Boton variante="secundario" icono="nuevo" onClick={() => setAgregando(true)}>
          Agregar método de cobro
        </Boton>
      ) : (
        <form
          className="pedido-modal-formulario"
          onSubmit={(evento) => {
            evento.preventDefault()
            setEnviado(true)
            if (!datos) return
            void ejecutar(() => guardarMetodoPago(artesanoId, datos, esCuenta ? null : qr)).then(
              (ok) => {
                if (!ok) return
                setBorrador(VACIO)
                setQr(null)
                setEnviado(false)
                setAgregando(false)
              },
            )
          }}
        >
          <fieldset disabled={ocupado}>
            <legend className="solo-lectores">Nuevo método de cobro</legend>
            <Campo etiqueta="Tipo">
              {(atributos) => (
                <select
                  {...atributos}
                  value={borrador.tipo}
                  onChange={(e) => cambiar('tipo', e.target.value)}
                >
                  {TIPOS_METODO_PAGO.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {NOMBRE_TIPO[tipo]}
                    </option>
                  ))}
                </select>
              )}
            </Campo>
            {esCuenta && (
              <Campo etiqueta="Banco" error={mostrar('banco')}>
                {(atributos) => (
                  <input
                    {...atributos}
                    maxLength={60}
                    value={borrador.banco}
                    onChange={(e) => cambiar('banco', e.target.value)}
                  />
                )}
              </Campo>
            )}
            <Campo etiqueta="Titular" error={mostrar('titular')}>
              {(atributos) => (
                <input
                  {...atributos}
                  maxLength={80}
                  autoComplete="name"
                  value={borrador.titular}
                  onChange={(e) => cambiar('titular', e.target.value)}
                />
              )}
            </Campo>
            <Campo etiqueta={esCuenta ? 'Número de cuenta' : 'Celular'} error={mostrar('numero')}>
              {(atributos) => (
                <input
                  {...atributos}
                  inputMode={esCuenta ? 'text' : 'tel'}
                  maxLength={30}
                  value={borrador.numero}
                  onChange={(e) => cambiar('numero', e.target.value)}
                />
              )}
            </Campo>
            {esCuenta ? (
              <Campo etiqueta="CCI (opcional)" ayuda="20 dígitos." error={mostrar('cci')}>
                {(atributos) => (
                  <input
                    {...atributos}
                    inputMode="numeric"
                    maxLength={26}
                    value={borrador.cci}
                    onChange={(e) => cambiar('cci', e.target.value)}
                  />
                )}
              </Campo>
            ) : (
              <Campo
                etiqueta="Imagen de tu QR (opcional)"
                ayuda={`Captura del QR de tu app ${NOMBRE_TIPO[borrador.tipo]}. PNG, JPG o WebP, hasta 1 MB.`}
              >
                {(atributos) => (
                  <input
                    {...atributos}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => setQr(e.target.files?.[0] ?? null)}
                  />
                )}
              </Campo>
            )}
          </fieldset>
          <div className="modal-acciones pedido-modal-acciones">
            <Boton variante="secundario" disabled={ocupado} onClick={() => setAgregando(false)}>
              Volver
            </Boton>
            <Boton type="submit" icono="exito" cargando={ocupado}>
              Guardar método
            </Boton>
          </div>
        </form>
      )}
    </section>
  )
}
