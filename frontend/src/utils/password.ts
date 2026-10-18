export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 8;

export const STRENGTH_LABELS = ['Muito fraca', 'Fraca', 'Boa', 'Forte'] as const;

/** Pontuação de 0 a 4: tamanho ≥ 8, maiúscula, número e caractere especial. */
export function passwordStrength(password: string): number {
  let score = 0;
  if (password.length >= MIN_PASSWORD_LENGTH) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}
