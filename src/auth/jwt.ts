export type JwtClaims = Record<string, unknown>;

/**
 * Decodifica o payload de um JWT (sem validar a assinatura: isso é papel do backend).
 * Serve apenas para ler `exp`, perfil e nome exibidos na interface.
 * Retorna null se o token não tiver o formato `header.payload.signature`.
 */
export function decodeJwt(token: string): JwtClaims | null {
  const parts = token.split('.');
  if (parts.length !== 3 || parts.some((p) => p.length === 0)) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as JwtClaims) : null;
  } catch {
    return null;
  }
}

/** Instante de expiração em milissegundos, ou null se o token não tiver `exp`. */
export function getExpiryMs(claims: JwtClaims): number | null {
  return typeof claims.exp === 'number' && Number.isFinite(claims.exp) ? claims.exp * 1000 : null;
}
