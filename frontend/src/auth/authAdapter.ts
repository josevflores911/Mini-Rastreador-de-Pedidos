/**
 * Ponto ÚNICO de gestão da sessão JWT no frontend.
 *
 * - Guarda o token no storage configurado (VITE_AUTH_TOKEN_STORAGE) e o lê para o Axios.
 * - Considera a sessão válida enquanto o token for um JWT legível e não expirado (`exp`).
 * - Avisa os interessados (AuthContext) quando a sessão muda ou termina.
 *
 * Login/cadastro (chamadas HTTP) ficam em src/services/authService.ts.
 * Nenhuma senha é armazenada aqui.
 */
import { decodeJwt, getExpiryMs } from './jwt';
import type { JwtClaims } from './jwt';

const TOKEN_KEY: string = import.meta.env.VITE_AUTH_TOKEN_STORAGE_KEY ?? 'token';
const USER_KEY = `${TOKEN_KEY}:user`;

export const LOGIN_PATH: string = import.meta.env.VITE_LOGIN_PATH ?? '/login';
export const REGISTER_PATH = '/cadastro';
export const HOME_PATH = '/pedidos';

export interface AuthSession {
  token: string;
  username: string;
  role: string;
  /** Expiração em ms (epoch) ou null quando o token não informa `exp`. */
  expiresAt: number | null;
}

export type SessionEndReason = 'expired' | 'logout';
type Listener = (reason?: SessionEndReason) => void;

const storage = (): Storage =>
  import.meta.env.VITE_AUTH_TOKEN_STORAGE === 'session' ? sessionStorage : localStorage;

const listeners = new Set<Listener>();
const notify = (reason?: SessionEndReason) => listeners.forEach((l) => l(reason));

function safeGet(key: string): string | null {
  try {
    return storage().getItem(key);
  } catch {
    return null;
  }
}

function safeRemove() {
  try {
    storage().removeItem(TOKEN_KEY);
    storage().removeItem(USER_KEY);
  } catch {
    /* storage indisponível: nada a limpar */
  }
}

function readStoredUser(): { username?: string; role?: string } {
  try {
    const raw = safeGet(USER_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === 'object') {
      const { username, role } = parsed as Record<string, unknown>;
      return {
        username: typeof username === 'string' ? username : undefined,
        role: typeof role === 'string' ? role : undefined,
      };
    }
  } catch {
    /* JSON inválido: ignora */
  }
  return {};
}

function claimString(claims: JwtClaims, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = claims[k];
    if (typeof v === 'string' && v) return v;
  }
  return undefined;
}

/** Sessão atual, ou null se não houver token válido (token inválido/expirado é descartado). */
export function getSession(): AuthSession | null {
  const token = safeGet(TOKEN_KEY);
  if (!token) return null;
  const claims = decodeJwt(token);
  const expiresAt = claims ? getExpiryMs(claims) : null;
  if (!claims || (expiresAt !== null && expiresAt <= Date.now())) {
    safeRemove();
    return null;
  }
  const stored = readStoredUser();
  return {
    token,
    username: stored.username ?? claimString(claims, 'sub', 'username', 'email') ?? '',
    role: stored.role ?? claimString(claims, 'role') ?? '',
    expiresAt,
  };
}

export const getToken = (): string | null => getSession()?.token ?? null;
export const isAuthenticated = (): boolean => getSession() !== null;

export function saveSession(data: { token: string; username: string; role: string }): void {
  storage().setItem(TOKEN_KEY, data.token);
  storage().setItem(USER_KEY, JSON.stringify({ username: data.username, role: data.role }));
  notify();
}

export function clearSession(reason: SessionEndReason = 'logout'): void {
  safeRemove();
  notify(reason);
}

/** Chamado pelo interceptor do Axios em respostas 401: encerra a sessão local. */
export function onSessionExpired(): void {
  clearSession('expired');
}

/** Observa mudanças de sessão (inclusive login/logout em outras abas). */
export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === TOKEN_KEY) listener(getSession() ? undefined : 'logout');
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

function readRoles(): string[] {
  const session = getSession();
  if (!session) return [];
  const claims = decodeJwt(session.token) ?? {};
  const raw = claims.roles ?? claims.authorities ?? claims.role ?? [];
  const fromClaims = (Array.isArray(raw) ? raw : [raw]).map((r) => String(r));
  return [...fromClaims, session.role]
    .map((r) => r.replace(/^ROLE_/i, '').trim().toUpperCase())
    .filter(Boolean);
}

/**
 * Define se mostramos os botões de atualizar status.
 * Sem VITE_STATUS_UPDATE_ROLES, todos veem o botão e o backend responde 403 se não puder.
 */
export function canUpdateOrderStatus(): boolean {
  const allowed = (import.meta.env.VITE_STATUS_UPDATE_ROLES ?? '')
    .split(',')
    .map((r: string) => r.trim().replace(/^ROLE_/i, '').toUpperCase())
    .filter(Boolean);
  if (allowed.length === 0) return true;
  return readRoles().some((r) => allowed.includes(r));
}
