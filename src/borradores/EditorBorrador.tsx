import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import type { Costeo, Disponibilidad } from '../compartido/dominio/producto'
import { Aviso, Boton, Campo } from '../compartido/ui/componentes'
import { useSesion } from '../compartido/sesion'
import {
  hayConexion,
  iniciarDictado,
  iniciarGrabacion,
  type GrabacionControl,
  escucharRed,
} from './audio'
import { Calculadora } from './Calculadora'
import { comprimirFoto } from './comprimirFoto'
import { validarDisponibilidad, validarPrecioFinal, MENSAJES_COSTEO } from './costeo'
import { guardarBorrador, obtenerBorrador, type BorradorLocal } from './db'
import { sincronizarBorrador } from './sincronizar'
import './borradores.css'

const PASOS = ['Nombre', 'Foto', 'Descripción', 'Precio', 'Disponibilidad', 'Guardar'] as const

export function EditorBorrador() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const sesion = useSesion()

  const [pasoActual, setPasoActual] = useState<number>(0)
  const [conectado, setConectado] = useState<boolean>(true)
  const [cargandoBorrador, setCargandoBorrador] = useState<boolean>(!!id)

  // Datos del borrador
  const [borradorId] = useState<string>(() => id || crypto.randomUUID())
  const [fotoId, setFotoId] = useState<string>(() => crypto.randomUUID())
  const [audioRuta, setAudioRuta] = useState<string | null>(null)
  const [creadoEn, setCreadoEn] = useState<string | null>(null)
  const [nombre, setNombre] = useState<string>('')
  const [fotoBlob, setFotoBlob] = useState<Blob | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [descripcionTexto, setDescripcionTexto] = useState<string>('')
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioMime, setAudioMime] = useState<string | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)

  const [costeo, setCosteo] = useState<Partial<Costeo>>({
    materiales: 0,
    horas: 0,
    pago_hora: 0,
    gastos: 0,
    ganancia: 0,
  })
  const [precioFinal, setPrecioFinal] = useState<number | ''>('')
  const [disponibilidad, setDisponibilidad] = useState<Disponibilidad>('en_stock')
  const [plazoDias, setPlazoDias] = useState<number | ''>('')

  // Estados de voz y audio
  const [grabando, setGrabando] = useState<boolean>(false)
  const [controlGrabacion, setControlGrabacion] = useState<GrabacionControl | null>(null)
  const [dictando, setDictando] = useState<boolean>(false)
  const [detenerDictadoFn, setDetenerDictadoFn] = useState<(() => Promise<void>) | null>(null)

  // Errores y guardado
  const [errorPaso, setErrorPaso] = useState<string | null>(null)
  const [guardando, setGuardando] = useState<boolean>(false)

  // Detección de conectividad
  useEffect(() => {
    hayConexion().then(setConectado)
    const desuscribir = escucharRed(setConectado)
    return () => desuscribir()
  }, [])

  // Carga de borrador existente si se pasa ID por parámetro
  useEffect(() => {
    if (!id) return
    obtenerBorrador(id).then((b) => {
      if (b) {
        setFotoId(b.foto_id)
        setAudioRuta(b.audio_ruta)
        setCreadoEn(b.creado_en)
        setNombre(b.nombre)
        setDescripcionTexto(b.descripcion_texto || '')
        if (b.foto_blob) {
          setFotoBlob(b.foto_blob)
          setFotoPreview(URL.createObjectURL(b.foto_blob))
        }
        if (b.audio_blob) {
          setAudioBlob(b.audio_blob)
          setAudioMime(b.audio_mime)
          setAudioUrl(URL.createObjectURL(b.audio_blob))
        }
        if (b.costeo) {
          setCosteo(b.costeo)
        }
        setPrecioFinal(b.precio_final)
        setDisponibilidad(b.disponibilidad)
        setPlazoDias(b.plazo_dias ?? '')
      }
      setCargandoBorrador(false)
    })
  }, [id])

  // Limpieza de URLs blob al desmontar
  useEffect(() => {
    return () => {
      if (fotoPreview) URL.revokeObjectURL(fotoPreview)
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
  }, [fotoPreview, audioUrl])

  // Selección de foto
  const tomarOSeleccionarFoto = async () => {
    setErrorPaso(null)
    try {
      const imagen = await Camera.getPhoto({
        quality: 90,
        resultType: CameraResultType.Uri,
        source: CameraSource.Prompt,
        promptLabelHeader: 'Foto de tu pieza',
        promptLabelPhoto: 'Elegir de galería',
        promptLabelPicture: 'Tomar foto con la cámara',
      })

      if (imagen.webPath) {
        const respuesta = await fetch(imagen.webPath)
        const blobOriginal = await respuesta.blob()
        const blobComprimido = await comprimirFoto(blobOriginal)
        setFotoBlob(blobComprimido)
        if (fotoPreview) URL.revokeObjectURL(fotoPreview)
        setFotoPreview(URL.createObjectURL(blobComprimido))
      }
    } catch {
      // Si el plugin falla o se cancela, ofrecemos input de archivo tradicional
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.onchange = async (e) => {
        const archivo = (e.target as HTMLInputElement).files?.[0]
        if (archivo) {
          try {
            const blobComprimido = await comprimirFoto(archivo)
            setFotoBlob(blobComprimido)
            if (fotoPreview) URL.revokeObjectURL(fotoPreview)
            setFotoPreview(URL.createObjectURL(blobComprimido))
          } catch {
            setErrorPaso('No se pudo procesar la foto seleccionada')
          }
        }
      }
      input.click()
    }
  }

  // Grabación de voz (offline u online)
  const alternarGrabacionAudio = async () => {
    setErrorPaso(null)
    if (grabando && controlGrabacion) {
      try {
        const { blob, mimeType } = await controlGrabacion.detener()
        setGrabando(false)
        setControlGrabacion(null)
        setAudioBlob(blob)
        setAudioMime(mimeType)
        if (audioUrl) URL.revokeObjectURL(audioUrl)
        setAudioUrl(URL.createObjectURL(blob))
      } catch {
        setGrabando(false)
        setControlGrabacion(null)
        setErrorPaso('Error al guardar la grabación de audio')
      }
    } else {
      try {
        const control = await iniciarGrabacion()
        setControlGrabacion(control)
        setGrabando(true)
      } catch (err) {
        setErrorPaso(err instanceof Error ? err.message : 'No se pudo acceder al micrófono')
      }
    }
  }

  // Dictado por voz (transcripción en vivo con conexión)
  const alternarDictado = async () => {
    setErrorPaso(null)
    if (dictando && detenerDictadoFn) {
      await detenerDictadoFn()
      setDictando(false)
      setDetenerDictadoFn(null)
    } else {
      try {
        const textoInicial = descripcionTexto.trim()
        const detener = await iniciarDictado((textoParcial) => {
          const nuevo = textoInicial ? `${textoInicial} ${textoParcial}` : textoParcial
          setDescripcionTexto(nuevo.slice(0, 2000))
        })
        setDetenerDictadoFn(() => detener)
        setDictando(true)
      } catch (err) {
        setErrorPaso(err instanceof Error ? err.message : 'No se pudo iniciar el dictado por voz')
      }
    }
  }

  // Validaciones por paso antes de avanzar
  const validarPasoActual = (): boolean => {
    setErrorPaso(null)

    if (pasoActual === 0) {
      if (!nombre.trim()) {
        setErrorPaso('Escribe un nombre para la pieza')
        return false
      }
    }

    if (pasoActual === 1) {
      if (!fotoBlob) {
        setErrorPaso('Toma o selecciona al menos una foto de la pieza')
        return false
      }
    }

    if (pasoActual === 2) {
      if (descripcionTexto.length > 2000) {
        setErrorPaso(MENSAJES_COSTEO.descripcionExcedida)
        return false
      }
    }

    if (pasoActual === 3) {
      const numPrecio = typeof precioFinal === 'number' ? precioFinal : 0
      const valPrecio = validarPrecioFinal(numPrecio)
      if (!valPrecio.valido) {
        setErrorPaso(valPrecio.error || 'Ingresa un precio final mayor a cero')
        return false
      }
    }

    if (pasoActual === 4) {
      const numPlazo = typeof plazoDias === 'number' ? plazoDias : null
      const valDisp = validarDisponibilidad(disponibilidad, numPlazo)
      if (!valDisp.valido) {
        setErrorPaso(valDisp.error || 'El plazo en días debe ser mayor a 0')
        return false
      }
    }

    return true
  }

  const avanzarPaso = () => {
    if (validarPasoActual()) {
      setPasoActual((p) => Math.min(PASOS.length - 1, p + 1))
    }
  }

  const retrocederPaso = () => {
    setErrorPaso(null)
    setPasoActual((p) => Math.max(0, p - 1))
  }

  // Guardado final en el celular (y sincronización si hay red)
  const guardarEnCelular = async () => {
    setErrorPaso(null)
    if (!validarPasoActual()) return

    setGuardando(true)
    try {
      const artesanoId = sesion?.user?.id || 'artesano-local'
      const numPrecioFinal = typeof precioFinal === 'number' ? precioFinal : 0
      const numPlazo =
        disponibilidad === 'a_pedido' && typeof plazoDias === 'number' ? plazoDias : null

      const nuevoBorrador: BorradorLocal = {
        id: borradorId,
        artesano_id: artesanoId,
        nombre: nombre.trim(),
        descripcion_texto: descripcionTexto.trim() || null,
        audio_blob: audioBlob,
        audio_mime: audioMime,
        audio_ruta: audioBlob ? null : audioRuta,
        foto_blob: fotoBlob!,
        foto_id: fotoId,
        costeo: {
          materiales: costeo.materiales || 0,
          horas: costeo.horas || 0,
          pago_hora: costeo.pago_hora || 0,
          gastos: costeo.gastos || 0,
          ganancia: costeo.ganancia || 0,
        },
        precio_final: numPrecioFinal,
        disponibilidad,
        plazo_dias: numPlazo,
        estado_sincronizacion: 'pendiente',
        error_sincronizacion: null,
        creado_en: creadoEn || new Date().toISOString(),
        actualizado_en: new Date().toISOString(),
      }

      await guardarBorrador(nuevoBorrador)

      // Si hay red y artesano autenticado, intentar sincronización automática en segundo plano
      if (conectado && sesion?.user?.id) {
        sincronizarBorrador(nuevoBorrador).catch(() => {
          // El fallo mantendrá el estado 'error' o 'pendiente' en Dexie
        })
      }

      navigate('/')
    } catch (err) {
      setErrorPaso(
        err instanceof Error ? err.message : 'Error al guardar el borrador en el celular',
      )
    } finally {
      setGuardando(false)
    }
  }

  if (cargandoBorrador) {
    return (
      <main className="pagina">
        <p className="vacio">Cargando borrador…</p>
      </main>
    )
  }

  return (
    <main className="pagina editor-borrador">
      <div className="barra-pasos">
        <span className="indicador-paso">
          Paso {pasoActual + 1} de {PASOS.length}: <strong>{PASOS[pasoActual]}</strong>
        </span>
      </div>

      {!conectado && (
        <Aviso tono="sin-senal">Sin señal: lo que registres se guarda en tu celular.</Aviso>
      )}

      {errorPaso && <Aviso tono="alerta">{errorPaso}</Aviso>}

      {/* Paso 0: Nombre */}
      {pasoActual === 0 && (
        <div className="paso-contenido">
          <Campo
            etiqueta="¿Cómo se llama tu pieza?*"
            ayuda="Escribe el nombre con el que la conocen tus clientes"
          >
            {(attrs) => (
              <input
                {...attrs}
                type="text"
                className="control control-grande"
                placeholder="Ej: Poncho de lana de ovino"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                autoFocus
              />
            )}
          </Campo>
        </div>
      )}

      {/* Paso 1: Foto */}
      {pasoActual === 1 && (
        <div className="paso-contenido">
          <h2>Foto de la pieza</h2>
          <p className="texto-ayuda">
            Toma una foto clara con buena iluminación donde se aprecie el trabajo hecho a mano.
          </p>

          {fotoPreview ? (
            <div className="foto-previa-contenedor">
              <img src={fotoPreview} alt="Vista previa de la pieza" className="foto-previa" />
              <div className="foto-acciones">
                <Boton variante="secundario" onClick={tomarOSeleccionarFoto}>
                  Cambiar foto
                </Boton>
              </div>
            </div>
          ) : (
            <div className="foto-vacia">
              <Boton variante="destacado" onClick={tomarOSeleccionarFoto}>
                Tomar foto o elegir de galería
              </Boton>
            </div>
          )}
        </div>
      )}

      {/* Paso 2: Descripción y audio */}
      {pasoActual === 2 && (
        <div className="paso-contenido">
          <h2>Descripción y voz</h2>
          <p className="texto-ayuda">
            Cuéntanos de qué está hecha y cómo la elaboraste. Puedes escribir o grabar tu voz.
          </p>

          <div className="audio-acciones">
            {conectado ? (
              <Boton variante="secundario" onClick={alternarDictado}>
                {dictando ? 'Detener dictado' : 'Dictar por voz'}
              </Boton>
            ) : (
              <Boton variante="destacado" onClick={alternarGrabacionAudio}>
                {grabando ? 'Detener grabación' : 'Grabar audio sin señal'}
              </Boton>
            )}

            {conectado && (
              <Boton variante="secundario" onClick={alternarGrabacionAudio}>
                {grabando ? 'Detener grabación de audio' : 'Grabar audio'}
              </Boton>
            )}
          </div>

          {audioUrl && (
            <div className="audio-reproductor panel">
              <p>
                <strong>Audio grabado:</strong>
              </p>
              <audio src={audioUrl} controls className="control-audio" />
            </div>
          )}

          <Campo
            etiqueta="Descripción escrita"
            ayuda={`Máximo 2000 caracteres (${descripcionTexto.length}/2000)`}
          >
            {(attrs) => (
              <textarea
                {...attrs}
                rows={5}
                maxLength={2000}
                className="control control-textarea"
                placeholder="Describe los materiales, tradición o historia de tu pieza..."
                value={descripcionTexto}
                onChange={(e) => setDescripcionTexto(e.target.value)}
              />
            )}
          </Campo>
        </div>
      )}

      {/* Paso 3: Calculadora y precio */}
      {pasoActual === 3 && (
        <div className="paso-contenido">
          <Calculadora
            costeo={costeo}
            precioFinal={precioFinal}
            alCambiarCosteo={setCosteo}
            alCambiarPrecioFinal={setPrecioFinal}
          />
        </div>
      )}

      {/* Paso 4: Disponibilidad */}
      {pasoActual === 4 && (
        <div className="paso-contenido">
          <h2>Disponibilidad de la pieza</h2>
          <p className="texto-ayuda">
            ¿La pieza ya está lista para entrega o la elaborarás a pedido?
          </p>

          <div className="opciones-disponibilidad">
            <button
              type="button"
              className={`opcion-tarjeta ${disponibilidad === 'en_stock' ? 'seleccionada' : ''}`}
              onClick={() => setDisponibilidad('en_stock')}
            >
              <h3>Pieza lista (en stock)</h3>
              <p>Lista para entregar de inmediato al comprador.</p>
            </button>

            <button
              type="button"
              className={`opcion-tarjeta ${disponibilidad === 'a_pedido' ? 'seleccionada' : ''}`}
              onClick={() => setDisponibilidad('a_pedido')}
            >
              <h3>A pedido</h3>
              <p>Elaboras la pieza una vez confirmada la orden.</p>
            </button>
          </div>

          {disponibilidad === 'a_pedido' && (
            <div className="plazo-bloque">
              <Campo
                etiqueta="Plazo de elaboración (días)*"
                ayuda="¿Cuántos días te toma elaborar la pieza desde que recibes el pedido?"
              >
                {(attrs) => (
                  <input
                    {...attrs}
                    type="number"
                    min="1"
                    step="1"
                    className="control control-grande"
                    placeholder="Ej: 7"
                    value={plazoDias}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10)
                      setPlazoDias(Number.isNaN(v) ? '' : v)
                    }}
                  />
                )}
              </Campo>
            </div>
          )}
        </div>
      )}

      {/* Paso 5: Resumen y guardar */}
      {pasoActual === 5 && (
        <div className="paso-contenido resumen-guardar">
          <h2>Resumen del borrador</h2>
          <div className="resumen-tarjeta panel">
            <p>
              <strong>Nombre:</strong> {nombre}
            </p>
            <p>
              <strong>Precio final:</strong> S/ {Number(precioFinal || 0).toFixed(2)}
            </p>
            <p>
              <strong>Disponibilidad:</strong>{' '}
              {disponibilidad === 'en_stock'
                ? 'Pieza lista (en stock)'
                : `A pedido (${plazoDias} días)`}
            </p>
            <p>
              <strong>Foto adjunta:</strong> {fotoBlob ? 'Sí (comprimida)' : 'No'}
            </p>
            <p>
              <strong>Audio grabado:</strong> {audioBlob ? 'Sí' : 'No'}
            </p>
            {descripcionTexto && (
              <p>
                <strong>Descripción:</strong> {descripcionTexto}
              </p>
            )}
          </div>

          <div className="acciones-finales">
            <Boton variante="destacado" ancho cargando={guardando} onClick={guardarEnCelular}>
              Guardar en tu celular
            </Boton>
          </div>
        </div>
      )}

      {/* Botones de navegación inferior */}
      <footer className="navegacion-pasos">
        {pasoActual > 0 && (
          <Boton variante="secundario" onClick={retrocederPaso}>
            Atrás
          </Boton>
        )}

        {pasoActual < PASOS.length - 1 && (
          <Boton variante="destacado" onClick={avanzarPaso}>
            Siguiente
          </Boton>
        )}
      </footer>
    </main>
  )
}
