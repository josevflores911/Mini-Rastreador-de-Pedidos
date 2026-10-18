import { passwordStrength, STRENGTH_LABELS } from '../../utils/password';

const COLORS = ['bg-red-400', 'bg-amber-400', 'bg-emerald-400', 'bg-emerald-300'];
const TEXT = ['text-red-300', 'text-amber-300', 'text-emerald-300', 'text-emerald-200'];

/** Medidor de força da senha (4 níveis), como no cadastro do projeto de referência. */
export function PasswordStrength({ password }: { password: string }) {
  const score = passwordStrength(password);
  return (
    <div className="mt-2">
      <div className="flex gap-1" aria-hidden>
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={`h-[3px] flex-1 rounded-full transition-colors ${i <= score ? COLORS[score - 1] : 'bg-white/15'}`} />
        ))}
      </div>
      <p className={`mt-1 h-4 text-xs ${score > 0 ? TEXT[score - 1] : ''}`} aria-live="polite">
        {score > 0 ? `Força da senha: ${STRENGTH_LABELS[score - 1]}` : ''}
      </p>
    </div>
  );
}
