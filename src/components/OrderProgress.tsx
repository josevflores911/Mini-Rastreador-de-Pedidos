import { Ban, Check } from 'lucide-react';
import type { OrderStatus } from '../types/order';
import { PROGRESS_STEPS, STATUS_LABEL } from '../utils/status';

export function OrderProgress({ status }: { status: OrderStatus }) {
  if (status === 'CANCELADO') {
    return (
      <div role="status" className="flex items-center gap-3 rounded-xl bg-stone-100 px-4 py-3 text-stone-700">
        <Ban className="h-5 w-5 shrink-0" aria-hidden />
        <div>
          <p className="text-sm font-bold">Pedido cancelado</p>
          <p className="text-xs text-stone-500">Este pedido não seguirá para as próximas etapas.</p>
        </div>
      </div>
    );
  }

  const current = PROGRESS_STEPS.indexOf(status);

  return (
    <ol className="flex flex-col md:flex-row" aria-label="Progresso do pedido">
      {PROGRESS_STEPS.map((step, i) => {
        const done = i < current || status === 'ENTREGUE';
        const active = i === current && status !== 'ENTREGUE';
        const last = i === PROGRESS_STEPS.length - 1;
        return (
          <li key={step} className="relative flex flex-1 gap-3 md:flex-col md:gap-2" aria-current={active ? 'step' : undefined}>
            {!last && (
              <span
                aria-hidden
                className={`absolute left-[15px] top-8 h-[calc(100%-1rem)] w-0.5 md:left-8 md:top-[15px] md:h-0.5 md:w-[calc(100%-2rem)] ${i < current ? 'bg-brand-600' : 'bg-paper-300'}`}
              />
            )}
            <span
              className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ${
                done
                  ? 'bg-brand-600 text-white'
                  : active
                    ? 'bg-white text-brand-600 ring-2 ring-brand-600 ring-offset-2'
                    : 'bg-paper-200 text-ink-300'
              }`}
            >
              {done ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
            </span>
            <span className="pb-6 md:pb-0">
              <span className={`block text-sm ${active ? 'font-bold text-ink-900' : done ? 'font-semibold text-ink-700' : 'text-ink-500'}`}>
                {STATUS_LABEL[step]}
              </span>
              <span className="sr-only">{done ? 'Concluída' : active ? 'Etapa atual' : 'Pendente'}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
