export function Esqueleto({
  etiqueta = 'Cargando…',
  variante = 'detalle',
  cantidad = 3,
}: {
  etiqueta?: string
  variante?: 'detalle' | 'lista' | 'formulario' | 'control'
  cantidad?: number
}) {
  return (
    <div className={`esqueletos esqueletos-${variante}`} aria-busy="true">
      <span className="solo-lectores" role="status">
        {etiqueta}
      </span>
      {Array.from({ length: variante === 'lista' ? cantidad : 1 }, (_, indice) => (
        <div className="esqueleto-panel" key={indice} aria-hidden="true">
          {(variante === 'detalle' || variante === 'lista') && (
            <div className="esqueleto esqueleto-media" />
          )}
          {variante !== 'control' && <div className="esqueleto esqueleto-titulo" />}
          {variante !== 'control' && <div className="esqueleto esqueleto-linea" />}
          {variante !== 'control' && <div className="esqueleto esqueleto-linea esqueleto-corta" />}
          {variante === 'control' && <div className="esqueleto esqueleto-control" />}
          {variante === 'formulario' && (
            <>
              <div className="esqueleto esqueleto-control" />
              <div className="esqueleto esqueleto-control" />
            </>
          )}
        </div>
      ))}
    </div>
  )
}
