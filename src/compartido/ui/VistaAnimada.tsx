import { Outlet, useLocation } from 'react-router-dom'

/** El hash y los filtros no desmontan la vista ni borran formularios abiertos. */
export function VistaAnimada() {
  const { pathname } = useLocation()
  return (
    <div key={pathname} className="vista-animada">
      <Outlet />
    </div>
  )
}
