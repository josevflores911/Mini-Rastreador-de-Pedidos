import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { AlertTriangle, ArrowLeft, Clock, History, Mail, MapPin, RefreshCw, Store, User, X, XCircle } from 'lucide-react';
import { orderService } from '../services/orderService';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils/errors';
import { formatCurrency, formatDateTime } from '../utils/format';
import { STATUS_LABEL, STATUS_STYLE } from '../utils/status';
import type { Order } from '../types/order';
import { OrderStatusBadge } from '../components/OrderStatusBadge';
import { OrderProgress } from '../components/OrderProgress';
import { GoogleMap } from '../components/GoogleMap';
import type { LatLng } from '../components/GoogleMap';
import { EmptyState } from '../components/EmptyState';
import { PageLoading, Spinner } from '../components/Loading';
import { useGoogleMaps } from '../hooks/useGoogleMaps';

export default function OrderDetailsPage() {
  const { id = '' } = useParams();
  const toast = useToast();
  const mapsStatus = useGoogleMaps();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [geocoded, setGeocoded] = useState<LatLng | null>(null);
  const [version, setVersion] = useState(0);

  // Estados para cancelamento com confirmação e motivo opcional
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Busca inicial e atualização
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    orderService
      .getById(id, controller.signal)
      .then(setOrder)
      .catch((e) => {
        if (!axios.isCancel(e)) setError(getErrorMessage(e));
      })
      .finally(() => !controller.signal.aborted && setLoading(false));
    return () => controller.abort();
  }, [id, version]);

  // Consulta periódica (polling a cada 5 segundos para refletir mudanças do restaurante/entregador)
  useEffect(() => {
    if (!order || order.status === 'ENTREGUE' || order.status === 'CANCELADO') return;
    const interval = setInterval(() => {
      orderService.getById(id).then((fresh) => {
        if (fresh && fresh.status !== order.status) {
          setOrder(fresh);
        }
      }).catch(() => {
        // silencioso no polling
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [id, order?.status]);

  // Geocodificação de fallback caso não haja latitude/longitude gravada
  const hasCoords = order?.latitude !== undefined && order?.longitude !== undefined;
  useEffect(() => {
    setGeocoded(null);
    if (!order || hasCoords || mapsStatus !== 'ready' || !order.deliveryAddress) return;
    let active = true;
    (async () => {
      try {
        const { Geocoder } = (await google.maps.importLibrary('geocoding')) as google.maps.GeocodingLibrary;
        const { results } = await new Geocoder().geocode({ address: order.deliveryAddress, region: 'br' });
        const loc = results[0]?.geometry.location;
        if (active && loc) setGeocoded({ lat: loc.lat(), lng: loc.lng() });
      } catch {
        /* endereço textual continua visível */
      }
    })();
    return () => {
      active = false;
    };
  }, [order?.id, order?.deliveryAddress, hasCoords, mapsStatus]);

  if (loading) return <PageLoading label="Acompanhando pedido…" />;
  if (error || !order) {
    return (
      <EmptyState
        tone="error"
        icon={AlertTriangle}
        title="Não foi possível abrir o pedido"
        description={error ?? 'Pedido não encontrado.'}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <button className="btn-primary" onClick={() => setVersion((v) => v + 1)}>
              <RefreshCw className="h-4 w-4" aria-hidden /> Tentar novamente
            </button>
            <Link to="/pedidos" className="btn-secondary">Voltar para pedidos</Link>
          </div>
        }
      />
    );
  }

  const canCancel = Boolean(order && order.status !== 'CANCELADO' && order.status !== 'ENTREGUE');

  async function handleCancelConfirm() {
    if (!order || cancelling) return;
    setCancelling(true);
    try {
      const updated = await orderService.cancel(order.id, cancelReason.trim() || undefined);
      setOrder(updated);
      setCancelModalOpen(false);
      setCancelReason('');
      toast.success('Pedido cancelado com sucesso.');
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setCancelling(false);
    }
  }

  const position: LatLng | null = hasCoords
    ? { lat: order.latitude as number, lng: order.longitude as number }
    : geocoded;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/pedidos" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink-900">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar para meus pedidos
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-extrabold">Pedido #{order.id}</h1>
            <OrderStatusBadge status={order.status} />
            {canCancel && (
              <button
                type="button"
                onClick={() => setCancelModalOpen(true)}
                disabled={cancelling}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50/70 px-3 py-1.5 text-xs font-bold text-red-700 shadow-sm transition-all hover:border-red-400 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500/20 active:scale-95 disabled:opacity-50"
                aria-label="Cancelar pedido"
              >
                <XCircle className="h-4 w-4 text-red-600" aria-hidden />
                Cancelar pedido
              </button>
            )}
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500">
            <Clock className="h-3.5 w-3.5" aria-hidden /> Atualização em tempo real ativa
          </span>
        </div>
        <p className="mt-1 text-sm text-ink-500">
          {order.restaurantName && (
            <span className="font-semibold text-ink-700 inline-flex items-center gap-1 mr-2">
              <Store className="h-3.5 w-3.5 text-brand-600" aria-hidden /> {order.restaurantName} ·
            </span>
          )}
          Realizado em {formatDateTime(order.createdAt)}
        </p>
      </div>

      <section className="card p-5 md:p-6" aria-labelledby="sec-progresso">
        <h2 id="sec-progresso" className="mb-5 text-lg font-bold">Acompanhamento da entrega</h2>
        <OrderProgress status={order.status} />
      </section>

      {/* Linha do tempo com histórico de status e eventos */}
      {order.statusHistory && order.statusHistory.length > 0 && (
        <section className="card p-5 md:p-6 space-y-4" aria-labelledby="sec-historico">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-brand-600" aria-hidden />
            <h2 id="sec-historico" className="text-lg font-bold">Histórico de eventos</h2>
          </div>
          <ol className="relative border-l border-paper-300 ml-3 space-y-4">
            {order.statusHistory.map((h, idx) => (
              <li key={idx} className="ml-5">
                <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border-2 border-white bg-brand-600" />
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-bold ${STATUS_STYLE[h.status] || ''}`}>
                    {STATUS_LABEL[h.status] || h.status}
                  </span>
                  <time className="text-xs text-ink-500">{formatDateTime(h.timestamp)}</time>
                </div>
                {h.description && (
                  <p className="mt-1 text-sm text-ink-700">{h.description}</p>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
        <div className="space-y-6">
          <section className="card space-y-3 p-5 md:p-6" aria-labelledby="sec-cliente">
            <h2 id="sec-cliente" className="text-lg font-bold">Cliente</h2>
            <p className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-ink-500" aria-hidden /> {order.client || 'Não informado'}
            </p>
            {order.clientEmail && (
              <p className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-ink-500" aria-hidden /> {order.clientEmail}
              </p>
            )}
          </section>

          <section className="card p-5 md:p-6" aria-labelledby="sec-itens">
            <h2 id="sec-itens" className="mb-3 text-lg font-bold">Itens do pedido</h2>
            <ul className="divide-y divide-paper-200 text-sm">
              {order.items.map((it, i) => (
                <li key={i} className="flex items-baseline justify-between gap-3 py-2.5">
                  <div>
                    <span className="font-bold">{it.quantity}×</span>{' '}
                    <span>{it.productName || it.name}</span>
                    {it.unitPrice !== undefined && (
                      <span className="block text-xs text-ink-400">
                        Preço unit.: {formatCurrency(it.unitPrice)}
                      </span>
                    )}
                  </div>
                  <span className="text-ink-700 font-semibold">
                    {formatCurrency((it.subtotal !== undefined ? it.subtotal : (it.unitPrice ?? 0) * it.quantity))}
                  </span>
                </li>
              ))}
            </ul>
            {order.total !== undefined && (
              <div className="mt-4 space-y-1.5 border-t border-paper-200 pt-3 text-sm">
                <div className="flex justify-between text-ink-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal ?? order.total)}</span>
                </div>
                <div className="flex justify-between text-ink-600">
                  <span>Taxa de entrega</span>
                  <span className="text-emerald-700 font-medium">Grátis</span>
                </div>
                <div className="flex justify-between border-t border-paper-200 pt-2 font-display text-lg font-bold text-ink-900">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
              </div>
            )}
          </section>
        </div>

        <section className="card space-y-4 p-5 md:p-6" aria-labelledby="sec-entrega">
          <h2 id="sec-entrega" className="text-lg font-bold">Endereço de entrega</h2>
          <p className="flex gap-2 text-sm">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-600" aria-hidden />
            {order.deliveryAddress || 'Endereço não informado'}
          </p>
          <GoogleMap
            position={position}
            className="h-80 lg:h-96"
            label={`Mapa do local de entrega do pedido ${order.id}`}
          />
          <p className="text-xs text-ink-500">
            O mapa indica o ponto de entrega confirmado. O status do pedido é atualizado automaticamente conforme as etapas do restaurante e entregador parceiro.
          </p>
        </section>
      </div>

      {/* Modal de Confirmação de Cancelamento */}
      {cancelModalOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink-900/60 p-4 backdrop-blur-sm"
          role="presentation"
          onClick={() => !cancelling && setCancelModalOpen(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="cancel-dialog-title"
            aria-describedby="cancel-dialog-desc"
            className="card w-full max-w-md p-6 shadow-lift"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2.5 text-red-600">
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-600" aria-hidden />
                <h2 id="cancel-dialog-title" className="text-lg font-bold text-ink-900">
                  Cancelar pedido #{order.id}?
                </h2>
              </div>
              <button
                type="button"
                className="rounded p-1 text-ink-400 hover:bg-paper-200 hover:text-ink-700"
                aria-label="Fechar"
                onClick={() => setCancelModalOpen(false)}
                disabled={cancelling}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p id="cancel-dialog-desc" className="mt-3 text-sm text-ink-600">
              Esta ação cancelará imediatamente o seu pedido com o restaurante. Esta ação <strong>não pode ser revertida</strong>.
            </p>

            <div className="mt-4">
              <label htmlFor="cancel-reason" className="block text-xs font-semibold text-ink-700">
                Motivo do cancelamento (opcional)
              </label>
              <textarea
                id="cancel-reason"
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ex.: Desistência, alteração de pedido, tempo de espera..."
                disabled={cancelling}
                className="input mt-1.5 w-full text-sm resize-none"
              />
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setCancelModalOpen(false)}
                disabled={cancelling}
              >
                Manter pedido
              </button>
              <button
                type="button"
                className="btn-primary bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
                disabled={cancelling}
                onClick={handleCancelConfirm}
              >
                {cancelling ? <Spinner className="h-4 w-4" /> : <XCircle className="h-4 w-4" aria-hidden />}
                {cancelling ? 'Cancelando…' : 'Sim, cancelar pedido'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
