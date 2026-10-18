import { Link } from 'react-router-dom';
import { Calendar, ChevronRight, MapPin, ShoppingBag } from 'lucide-react';
import type { Order } from '../types/order';
import { formatCurrency, formatDateTime, summarizeItems } from '../utils/format';
import { OrderStatusBadge } from './OrderStatusBadge';

interface Props {
  order: Order;
}

export function OrderCard({ order }: Props) {
  return (
    <article className="card flex flex-col gap-4 p-5 transition-shadow hover:shadow-lift" aria-labelledby={`order-${order.id}`}>
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id={`order-${order.id}`} className="text-base font-bold">Pedido #{order.id}</h3>
          <p className="truncate text-sm text-ink-700">{order.client || 'Cliente'}{order.restaurantName ? ` · ${order.restaurantName}` : ''}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </header>

      <dl className="space-y-2 text-sm text-ink-700">
        <div className="flex gap-2">
          <dt className="sr-only">Itens</dt>
          <ShoppingBag className="mt-0.5 h-4 w-4 shrink-0 text-ink-500" aria-hidden />
          <dd className="line-clamp-2">{summarizeItems(order.items)}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="sr-only">Endereço de entrega</dt>
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-ink-500" aria-hidden />
          <dd className="line-clamp-1">{order.deliveryAddress || 'Endereço não informado'}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="sr-only">Criado em</dt>
          <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-ink-500" aria-hidden />
          <dd>{formatDateTime(order.createdAt)}</dd>
        </div>
      </dl>

      <footer className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-paper-200 pt-4">
        <span className="font-display text-lg font-bold">{order.total !== undefined ? formatCurrency(order.total) : ''}</span>
        <Link to={`/pedidos/${encodeURIComponent(order.id)}`} className="btn-secondary inline-flex items-center gap-1.5 text-xs font-bold">
          Acompanhar entrega <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </footer>
    </article>
  );
}
