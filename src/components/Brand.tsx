/** Marca Chegô (logo + nome). `invert` para fundos escuros. */
export function Brand({ invert = false, className = '' }: { invert?: boolean; className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600">
        <svg viewBox="0 0 32 32" className="h-5 w-5" aria-hidden>
          <path d="M9 17.5 14 22l9-11" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className={`font-display text-xl font-extrabold tracking-tight ${invert ? 'text-paper-100' : ''}`}>Chegô</span>
    </div>
  );
}
