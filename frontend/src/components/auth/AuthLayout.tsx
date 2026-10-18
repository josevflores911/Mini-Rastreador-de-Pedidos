import type { ReactNode } from 'react';
import { Brand } from '../Brand';

interface Props {
  title: string;
  subtitle: string;
  footer: ReactNode;
  children: ReactNode;
}

/** Estrutura comum de login e cadastro: cartão centralizado sobre fundo escuro. */
export function AuthLayout({ title, subtitle, footer, children }: Props) {
  return (
    <div className="auth-scope grid min-h-screen place-items-center bg-night-900 bg-[radial-gradient(60%_45%_at_50%_0%,rgba(212,31,43,0.20),transparent)] px-4 py-10">
      <main className="w-full max-w-[400px] rounded-2xl border border-white/10 bg-night-700 p-7 shadow-lift sm:p-9">
        <Brand invert className="mb-8" />
        <h1 className="font-display text-2xl font-bold text-paper-100">{title}</h1>
        <p className="mb-7 mt-1 text-sm text-ink-300">{subtitle}</p>
        {children}
        <p className="mt-6 text-center text-sm text-ink-300">{footer}</p>
      </main>
    </div>
  );
}
