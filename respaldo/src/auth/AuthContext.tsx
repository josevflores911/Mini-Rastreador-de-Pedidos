import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { clearSession, getSession, saveSession, subscribe } from './authAdapter';
import type { AuthSession } from './authAdapter';
import { authService } from '../services/authService';
import type { LoginCredentials, RegisterInput } from '../services/authService';

interface AuthContextValue {
  session: AuthSession | null;
  /** true quando a sessão terminou por expiração/401 (usado para avisar na tela de login). */
  sessionExpired: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Maior atraso suportado por setTimeout (~24,8 dias). */
const MAX_TIMEOUT = 2_147_000_000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(getSession);
  const [sessionExpired, setSessionExpired] = useState(false);

  const sessionRef = useRef(session);
  sessionRef.current = session;

  // Reage a login/logout/401, inclusive em outras abas.
  // O aviso "sessão expirada" só aparece se havia uma sessão ativa (não após um logout voluntário).
  useEffect(
    () =>
      subscribe((reason) => {
        const hadSession = sessionRef.current !== null;
        const next = getSession();
        setSession(next);
        if (reason === 'expired' && hadSession && !next) setSessionExpired(true);
      }),
    [],
  );

  // Encerra a sessão automaticamente no instante em que o JWT expira.
  useEffect(() => {
    if (!session?.expiresAt) return;
    const delay = Math.min(Math.max(session.expiresAt - Date.now(), 0), MAX_TIMEOUT);
    const timer = window.setTimeout(() => {
      const current = getSession();
      if (current) setSession(current);
      else clearSession('expired');
    }, delay);
    return () => window.clearTimeout(timer);
  }, [session]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const result = await authService.login(credentials);
    setSessionExpired(false);
    saveSession(result);
  }, []);

  const register = useCallback((input: RegisterInput) => authService.register(input), []);
  const logout = useCallback(() => clearSession('logout'), []);

  const value = useMemo(
    () => ({ session, sessionExpired, login, register, logout }),
    [session, sessionExpired, login, register, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
