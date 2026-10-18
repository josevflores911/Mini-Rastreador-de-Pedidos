import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: 'neutral' | 'error';
}

export function EmptyState({ icon: Icon, title, description, action, tone = 'neutral' }: Props) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center" role={tone === 'error' ? 'alert' : undefined}>
      <div className={`mb-4 grid h-14 w-14 place-items-center rounded-2xl ${tone === 'error' ? 'bg-brand-50 text-brand-600' : 'bg-paper-200 text-ink-500'}`}>
        <Icon className="h-7 w-7" aria-hidden />
      </div>
      <h2 className="text-lg font-bold">{title}</h2>
      {description && <p className="mt-1 max-w-md text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
