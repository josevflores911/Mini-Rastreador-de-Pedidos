import { NavLink, Outlet } from 'react-router-dom';
import { ClipboardList, LogOut } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { useToast } from '../context/ToastContext';
import { Brand } from './Brand';

const ROLE_LABEL: Record<string, string> = { ADMIN: 'Administrador', READER: 'Leitor' };

function UserInfo() {
  const { session } = useAuth();
  if (!session) return null;
  const initials = (session.username || '?').slice(0, 2).toUpperCase();
  const role = ROLE_LABEL[session.role] ?? session.role;
  return (
    <div className="flex items-center gap-3 px-2">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-bold text-brand-700" aria-hidden>
        {initials}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold" title={session.username}>{session.username}</p>
        {role && <p className="text-xs text-ink-500">{role}</p>}
      </div>
    </div>
  );
}

export function Layout() {
  const { logout } = useAuth();
  const toast = useToast();
  const handleLogout = () => {
    logout();
    toast.success('Você saiu da sua conta.');
  };

  return (
    <div className="min-h-screen md:flex">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[70] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">
        Ir para o conteúdo
      </a>

      {/* Navegação lateral (desktop/tablet) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-paper-300/70 bg-white px-4 py-6 md:flex">
        <div className="px-2"><Brand /></div>
        <nav aria-label="Principal" className="mt-8 flex flex-col gap-1">
          <NavLink
            to="/pedidos"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-paper-200'}`
            }
          >
            <ClipboardList className="h-5 w-5" aria-hidden />
            Início
          </NavLink>
        </nav>
        <div className="mt-auto space-y-3 border-t border-paper-200 pt-4">
          <UserInfo />
          <button type="button" className="btn-ghost w-full justify-start" onClick={handleLogout}>
            <LogOut className="h-5 w-5" aria-hidden /> Sair
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Cabeçalho (móvel): a navegação entre Pedidos e Restaurantes fica nas abas da página inicial */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-paper-300/70 bg-white/90 px-4 py-3 backdrop-blur md:hidden">
          <Brand />
          <button type="button" className="btn-ghost p-2.5" onClick={handleLogout} aria-label="Sair da conta">
            <LogOut className="h-5 w-5" aria-hidden />
          </button>
        </header>
        <main id="conteudo" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-12 pt-6 md:px-8 md:pt-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
