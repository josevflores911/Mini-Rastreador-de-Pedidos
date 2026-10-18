import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { LOGIN_PATH } from '../auth/authAdapter';

/** Só renderiza as rotas filhas com sessão JWT válida; caso contrário, vai para o login. */
export function ProtectedRoute() {
  const { session, sessionExpired } = useAuth();
  const location = useLocation();
  if (!session) {
    return <Navigate to={LOGIN_PATH} replace state={{ from: location, expired: sessionExpired }} />;
  }
  return <Outlet />;
}
