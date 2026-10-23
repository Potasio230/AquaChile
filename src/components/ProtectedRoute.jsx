import { Navigate, Outlet, useLocation } from 'react-router-dom'

function ProtectedRoute() {
  const location = useLocation()
  const authenticated = Boolean(sessionStorage.getItem('aquachile-token'))

  return authenticated
    ? <Outlet />
    : <Navigate to="/acceso-interno" replace state={{ from: location.pathname }} />
}

export default ProtectedRoute

