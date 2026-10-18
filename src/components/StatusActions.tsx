import { useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import type { Order, OrderStatus } from '../types/order';
import { actionLabel, nextActions, STATUS_LABEL } from '../utils/status';
import { canUpdateOrderStatus } from '../auth/authAdapter';
import { Spinner } from './Loading';

interface Props {
  order: Order;
  busy: boolean;
  onUpdate: (status: OrderStatus) => void;
  compact?: boolean;
}

/** Botões de transição. Pedem confirmação e só enviam o PATCH; o status só muda após o backend confirmar. */
export function StatusActions({ order, busy, onUpdate, compact }: Props) {
  const [pending, setPending] = useState<OrderStatus | null>(null);
  const actions = nextActions(order.status);

  if (!canUpdateOrderStatus() || actions.length === 0) return null;
  const [primary, ...others] = actions;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary" disabled={busy} onClick={() => setPending(primary)}>
          {busy ? <Spinner className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" aria-hidden />}
          {compact ? 'Atualizar status' : actionLabel(primary)}
        </button>
        {!compact &&
          others.map((s: OrderStatus) => (
            <button key={s} type="button" className="btn-secondary" disabled={busy} onClick={() => setPending(s)}>
              {actionLabel(s)}
            </button>
          ))}
      </div>

      {pending && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/50 p-4" role="presentation" onClick={() => !busy && setPending(null)}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" className="card w-full max-w-md p-6 shadow-lift" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <h2 id="confirm-title" className="text-lg font-bold">
                {pending === 'CANCELADO' ? 'Cancelar pedido?' : 'Atualizar status?'}
              </h2>
              <button className="rounded p-1 text-ink-500 hover:bg-paper-200" aria-label="Fechar" onClick={() => setPending(null)} disabled={busy}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-ink-700">
              O pedido <strong>#{order.id}</strong> irá de <strong>{STATUS_LABEL[order.status]}</strong> para <strong>{STATUS_LABEL[pending]}</strong>.
              {pending === 'CANCELADO' && ' Essa ação pode não ser reversível.'}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setPending(null)} disabled={busy}>Voltar</button>
              <button
                className="btn-primary"
                disabled={busy}
                onClick={() => {
                  const target = pending;
                  setPending(null);
                  onUpdate(target);
                }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
