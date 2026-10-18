import { useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, PackageSearch, RefreshCw, Search, Store, Truck } from 'lucide-react';
import { useOrders } from '../hooks/useOrders';
import { ORDER_STATUSES } from '../types/order';
import type { OrderStatus } from '../types/order';
import { STATUS_LABEL } from '../utils/status';
import { useRestaurants } from '../hooks/useRestaurants';
import { OrderCard } from '../components/OrderCard';
import { RestaurantCard } from '../components/RestaurantCard';
import { StatusSummary } from '../components/StatusSummary';
import { EmptyState } from '../components/EmptyState';
import { OrderCardSkeleton, RestaurantCardSkeleton } from '../components/Loading';

type Tab = 'pedidos' | 'restaurantes';
const TABS: { id: Tab; label: string; icon: typeof Truck }[] = [
  { id: 'pedidos', label: 'Meus pedidos', icon: Truck },
  { id: 'restaurantes', label: 'Restaurantes', icon: Store },
];

export default function OrdersPage() {
  const [params, setParams] = useSearchParams();
  const tab: Tab = params.get('aba') === 'restaurantes' ? 'restaurantes' : 'pedidos';
  const selectTab = (t: Tab) => setParams(t === 'pedidos' ? {} : { aba: t }, { replace: true });

  const { orders, loading, error, refetch } = useOrders();
  const {
    restaurants,
    loading: loadingRestaurants,
    error: errorRestaurants,
    refetch: refetchRestaurants,
  } = useRestaurants();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<OrderStatus | 'TODOS'>('TODOS');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter(
      (o) =>
        (filter === 'TODOS' || o.status === filter) &&
        (!q || o.id.toLowerCase().includes(q) || o.client.toLowerCase().includes(q)),
    );
  }, [orders, query, filter]);

  function onTabKey(e: KeyboardEvent) {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const next = tab === 'pedidos' ? 'restaurantes' : 'pedidos';
    selectTab(next);
    document.getElementById(`tab-${next}`)?.focus();
  }

  const filters: { value: OrderStatus | 'TODOS'; label: string }[] = [
    { value: 'TODOS', label: 'Todos' },
    ...ORDER_STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] })),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold">{tab === 'pedidos' ? 'Meus pedidos' : 'Escolha um restaurante'}</h1>
        <p className="mt-1 text-sm text-ink-500">
          {tab === 'pedidos'
            ? 'Acompanhe o status das suas entregas.'
            : 'Toque em um restaurante para montar seu pedido.'}
        </p>
      </div>

      <div role="tablist" aria-label="Seções" onKeyDown={onTabKey} className="sticky top-[61px] z-20 -mx-4 flex gap-1 border-b border-paper-300/70 bg-paper-100/95 px-4 backdrop-blur md:top-0 md:mx-0 md:px-0">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            id={`tab-${id}`}
            role="tab"
            type="button"
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            tabIndex={tab === id ? 0 : -1}
            onClick={() => selectTab(id)}
            className={`-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition-colors ${
              tab === id ? 'border-brand-600 text-brand-700' : 'border-transparent text-ink-500 hover:text-ink-900'
            }`}
          >
            <Icon className="h-4 w-4" aria-hidden /> {label}
          </button>
        ))}
      </div>

      {tab === 'restaurantes' ? (
        <section id="panel-restaurantes" role="tabpanel" aria-labelledby="tab-restaurantes">
          {loadingRestaurants ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Carregando restaurantes">
              {[0, 1, 2, 3, 4, 5].map((i) => <RestaurantCardSkeleton key={i} />)}
            </div>
          ) : errorRestaurants ? (
            <EmptyState
              tone="error"
              icon={AlertTriangle}
              title="Não foi possível carregar os restaurantes"
              description={errorRestaurants}
              action={<button className="btn-primary" onClick={refetchRestaurants}><RefreshCw className="h-4 w-4" aria-hidden /> Tentar novamente</button>}
            />
          ) : restaurants.length === 0 ? (
            <EmptyState
              icon={Store}
              title="Nenhum restaurante disponível"
              description="Nenhum restaurante foi encontrado no momento."
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {restaurants.map((r) => <RestaurantCard key={r.id} restaurant={r} />)}
            </div>
          )}
        </section>
      ) : (
        <section id="panel-pedidos" role="tabpanel" aria-labelledby="tab-pedidos" className="space-y-6">
          {!loading && !error && orders.length > 0 && <StatusSummary orders={orders} />}

          {orders.length > 0 && (
            <div className="space-y-3">
              <div className="relative">
                <label htmlFor="busca" className="sr-only">Buscar por ID ou nome do cliente</label>
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" aria-hidden />
                <input id="busca" type="search" className="input pl-10" placeholder="Buscar por ID ou nome do cliente" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0" role="group" aria-label="Filtrar por status">
                {filters.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setFilter(f.value)}
                    aria-pressed={filter === f.value}
                    className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                      filter === f.value ? 'bg-ink-900 text-white' : 'bg-white text-ink-700 ring-1 ring-inset ring-paper-300 hover:bg-paper-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Carregando pedidos">
              {[0, 1, 2].map((i) => <OrderCardSkeleton key={i} />)}
            </div>
          ) : error ? (
            <EmptyState
              tone="error"
              icon={AlertTriangle}
              title="Não foi possível carregar os pedidos"
              description={error}
              action={<button className="btn-primary" onClick={refetch}><RefreshCw className="h-4 w-4" aria-hidden /> Tentar novamente</button>}
            />
          ) : orders.length === 0 ? (
            <EmptyState
              icon={PackageSearch}
              title="Você ainda não tem pedidos"
              description="Escolha um restaurante para fazer o primeiro pedido. Ele aparecerá aqui com o status da entrega."
              action={<button className="btn-primary" onClick={() => selectTab('restaurantes')}><Store className="h-4 w-4" aria-hidden /> Ver restaurantes</button>}
            />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Nenhum pedido encontrado"
              description="Ajuste a busca ou o filtro de status."
              action={<button className="btn-secondary" onClick={() => { setQuery(''); setFilter('TODOS'); }}>Limpar filtros</button>}
            />
          ) : (
            <>
              <p className="text-sm text-ink-500" aria-live="polite">{filtered.length} {filtered.length === 1 ? 'pedido' : 'pedidos'}</p>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filtered.map((o) => (
                  <OrderCard key={o.id} order={o} />
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
