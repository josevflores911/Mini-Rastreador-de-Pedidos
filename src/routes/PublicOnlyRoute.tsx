import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { HOME_PATH } from '../auth/authAdapter';

/** Login e cadastro: quem já está autenticado vai direto para a página inicial. */
export function PublicOnlyRoute() {
  const { session } = useAuth();
  return session ? <Navigate to={HOME_PATH} replace /> : <Outlet />;
}
