import axios from 'axios';
import { decodeJwt, getExpiryMs } from '../auth/jwt';

/**
 * Cliente HTTP da API de autenticação (JWT).
 * Usa uma instância própria de Axios, SEM o interceptor de 401 de api.ts:
 * credenciais erradas no login devolvem 401 e não podem derrubar a sessão nem redirecionar.
 */
const authApi = axios.create({
  baseURL: import.meta.env.VITE_AUTH_API_URL ?? 'http://localhost:8080/auth',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

export type AuthErrorKind = 'invalid-credentials' | 'connection' | 'invalid-response' | 'rejected';

export class AuthError extends Error {
  kind: AuthErrorKind;
  constructor(kind: AuthErrorKind, message: string) {
    super(message);
    this.name = 'AuthError';
    this.kind = kind;
  }
}

// Mensagem genérica: não revela se o e-mail existe nem qual campo falhou (CWE-204).
const MSG_INVALID = 'Dados inválidos. Por favor, verifique suas credenciais e tente novamente.';
const MSG_CONNECTION = 'Não foi possível conectar ao servidor. Tente novamente mais tarde.';
const MSG_REJECTED = 'Não foi possível concluir o cadastro. Verifique os dados informados e tente novamente.';
const MSG_BAD_RESPONSE = 'Resposta de autenticação inválida. Entre em contato com o suporte.';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
}

export interface LoginResult {
  token: string;
  username: string;
  role: string;
}

function toAuthError(error: unknown, fallback: { kind: AuthErrorKind; message: string }): AuthError {
  if (error instanceof AuthError) return error;
  if (axios.isAxiosError(error) && (!error.response || error.response.status >= 500)) {
    return new AuthError('connection', MSG_CONNECTION);
  }
  return new AuthError(fallback.kind, fallback.message);
}

const asRecord = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

const pickString = (o: Record<string, unknown>, ...keys: string[]): string | undefined => {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === 'string' && v) return v;
  }
  return undefined;
};

/** Perfis numéricos do backend de referência (1 = admin, 2 = leitor) viram nomes legíveis. */
function normalizeRole(role: string | undefined): string {
  if (!role) return '';
  if (role === '1') return 'ADMIN';
  if (role === '2') return 'READER';
  return role.replace(/^ROLE_/i, '').toUpperCase();
}

function parseLogin(data: unknown, fallbackUsername: string): LoginResult {
  const body = asRecord(data);
  const token = body ? pickString(body, 'token', 'accessToken', 'access_token', 'jwt') : undefined;
  const claims = token ? decodeJwt(token) : null;
  if (!body || !token || !claims) throw new AuthError('invalid-response', MSG_BAD_RESPONSE);
  const expiry = getExpiryMs(claims);
  if (expiry !== null && expiry <= Date.now()) throw new AuthError('invalid-response', MSG_BAD_RESPONSE);
  const claimRole = typeof claims.role === 'string' ? claims.role : undefined;
  const claimName = typeof claims.sub === 'string' ? claims.sub : undefined;
  return {
    token,
    username: pickString(body, 'username', 'email') ?? claimName ?? fallbackUsername,
    role: normalizeRole(pickString(body, 'role') ?? claimRole),
  };
}

export const authService = {
  /** POST {VITE_AUTH_API_URL}/login → { token, username?, role? } */
  async login(credentials: LoginCredentials): Promise<LoginResult> {
    try {
      const { data } = await authApi.post<unknown>('/login', credentials);
      return parseLogin(data, credentials.username);
    } catch (e) {
      throw toAuthError(e, { kind: 'invalid-credentials', message: MSG_INVALID });
    }
  },

  /** POST {VITE_AUTH_API_URL}/register → 2xx. Não inicia sessão: o usuário entra em seguida. */
  async register(input: RegisterInput): Promise<void> {
    try {
      await authApi.post('/register', { username: input.email, email: input.email, password: input.password });
    } catch (e) {
      throw toAuthError(e, { kind: 'rejected', message: MSG_REJECTED });
    }
  },
};
