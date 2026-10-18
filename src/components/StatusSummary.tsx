import { CheckCircle2, ChefHat, ClipboardList, Truck } from 'lucide-react';
import type { Order } from '../types/order';

export function StatusSummary({ orders }: { orders: Order[] }) {
  const count = (s: Order['status']) => orders.filter((o) => o.status === s).length;
  const items = [
    { label: 'Recebidos', value: count('RECEBIDO'), icon: ClipboardList, tone: 'bg-sky-50 text-sky-700' },
    { label: 'Em preparo', value: count('EM_PREPARO'), icon: ChefHat, tone: 'bg-amber-50 text-amber-700' },
    { label: 'A caminho', value: count('SAIU_PARA_ENTREGA'), icon: Truck, tone: 'bg-violet-50 text-violet-700' },
    { label: 'Entregues', value: count('ENTREGUE'), icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-700' },
  ];
  return (
    <section aria-label="Resumo dos pedidos" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map(({ label, value, icon: Icon, tone }) => (
        <div key={label} className="card flex items-center gap-3 p-4">
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tone}`}>
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <p className="font-display text-2xl font-bold leading-none">{value}</p>
            <p className="mt-1 text-xs text-ink-500">{label}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
