import { useState } from 'react';
import type { ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface Props {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password';
  placeholder?: string;
  autoComplete?: string;
  error?: string;
  /** Mostra o botão de exibir/ocultar (para campos de senha). */
  revealable?: boolean;
  /** Conteúdo extra abaixo do campo (ex.: medidor de força da senha). */
  children?: ReactNode;
}

export function AuthField({ id, label, value, onChange, type = 'text', placeholder, autoComplete, error, revealable, children }: Props) {
  const [visible, setVisible] = useState(false);
  const inputType = revealable && visible ? 'text' : type;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold text-ink-300">{label}</label>
      <div className="relative">
        <input
          id={id}
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`auth-input ${revealable ? 'pr-11' : ''} ${error ? 'auth-input-error' : ''}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {revealable && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar senha' : 'Exibir senha'}
            aria-pressed={visible}
            className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-ink-300 hover:text-paper-100"
          >
            {visible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
          </button>
        )}
      </div>
      {error && <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs font-medium text-brand-200">{error}</p>}
      {children}
    </div>
  );
}
