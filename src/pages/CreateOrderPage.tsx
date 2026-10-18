import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  AlertTriangle,
  ArrowLeft,
  Info,
  Minus,
  Plus,
  RefreshCw,
  ShoppingBag,
  Store,
  Trash2,
} from 'lucide-react';
import { orderService } from '../services/orderService';
import { restaurantService } from '../services/restaurantService';
import type { Product, RestaurantMenu } from '../types/restaurant';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils/errors';
import { formatCurrency } from '../utils/format';
import { AddressAutocomplete } from '../components/AddressAutocomplete';
import type { SelectedAddress } from '../components/AddressAutocomplete';
import { GoogleMap } from '../components/GoogleMap';
import type { LatLng } from '../components/GoogleMap';
import { MAPS_CONFIGURED } from '../hooks/useGoogleMaps';
import { PageLoading, Spinner } from '../components/Loading';
import { EmptyState } from '../components/EmptyState';

interface CartItem {
  product: Product;
  quantity: number;
}

type Errors = Record<string, string>;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} className="mt-1.5 text-xs font-medium text-brand-700" role="alert">
      {message}
    </p>
  ) : null;
}

export default function CreateOrderPage() {
  const { restaurantId = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const submitting = useRef(false);
  const [busy, setBusy] = useState(false);

  const [menuData, setMenuData] = useState<RestaurantMenu | null>(null);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [menuError, setMenuError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  // Carrinho de compras (produtos reais do restaurante)
  const [cart, setCart] = useState<Record<string, number>>({});

  // Dados do consumidor e entrega
  const [client, setClient] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<LatLng | null>(null);
  const [errors, setErrors] = useState<Errors>({});

  // Carrega cardápio oficial do backend
  useEffect(() => {
    if (!restaurantId) {
      setLoadingMenu(false);
      setMenuError('Restaurante não informado.');
      return;
    }
    const controller = new AbortController();
    setLoadingMenu(true);
    setMenuError(null);
    restaurantService
      .getMenu(restaurantId, controller.signal)
      .then((data) => {
        if (!data || !data.restaurant) {
          setMenuError('Restaurante não encontrado.');
        } else {
          setMenuData(data);
        }
      })
      .catch((e) => {
        if (!axios.isCancel(e)) {
          setMenuError(getErrorMessage(e));
        }
      })
      .finally(() => !controller.signal.aborted && setLoadingMenu(false));
    return () => controller.abort();
  }, [restaurantId, version]);

  if (loadingMenu) return <PageLoading label="Carregando cardápio do restaurante…" />;

  if (menuError || !menuData) {
    return (
      <EmptyState
        tone="error"
        icon={AlertTriangle}
        title="Não foi possível abrir o restaurante"
        description={menuError ?? 'Restaurante não encontrado.'}
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <button className="btn-primary" onClick={() => setVersion((v) => v + 1)}>
              <RefreshCw className="h-4 w-4" aria-hidden /> Tentar novamente
            </button>
            <Link to="/pedidos?aba=restaurantes" className="btn-secondary">
              Voltar para restaurantes
            </Link>
          </div>
        }
      />
    );
  }

  const { restaurant, menuByCategory, products } = menuData;

  // Itens atualmente no carrinho
  const cartItems: CartItem[] = Object.entries(cart)
    .filter(([, qty]) => qty > 0)
    .map(([productId, qty]) => {
      const product = products.find((p) => p.id === productId);
      return product ? { product, quantity: qty } : null;
    })
    .filter((item): item is CartItem => item !== null);

  // Subtotal calculado com base no catálogo oficial do backend
  const cartSubtotal = cartItems.reduce(
    (sum, item) => sum + item.product.unitPrice * item.quantity,
    0,
  );
  const totalItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  function handleQuantityChange(productId: string, delta: number) {
    setCart((prev) => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      const updated = { ...prev };
      if (next === 0) {
        delete updated[productId];
      } else {
        updated[productId] = next;
      }
      return updated;
    });
    setErrors((e) => ({ ...e, cart: '' }));
  }

  function handleAddressText(text: string) {
    setAddress(text);
    setCoords(null);
  }

  function handleSelected(a: SelectedAddress) {
    setAddress(a.address);
    setCoords({ lat: a.lat, lng: a.lng });
    setErrors((e) => ({ ...e, address: '' }));
  }

  async function handleMarker(pos: LatLng) {
    setCoords(pos);
    try {
      const { Geocoder } = (await google.maps.importLibrary('geocoding')) as google.maps.GeocodingLibrary;
      const { results } = await new Geocoder().geocode({ location: pos, language: 'pt-BR' });
      if (results[0]) {
        setAddress(results[0].formatted_address);
        setErrors((e) => ({ ...e, address: '' }));
      }
    } catch {
      toast.error('Não foi possível obter o endereço desse ponto. Ajuste o texto manualmente.');
    }
  }

  function validate(): Errors {
    const e: Errors = {};
    if (cartItems.length === 0) {
      e.cart = 'Adicione ao menos um item do cardápio à sua sacola para continuar.';
    }
    if (!client.trim()) {
      e.client = 'Informe seu nome.';
    }
    if (email.trim() && !EMAIL_RE.test(email.trim())) {
      e.email = 'Informe um e-mail válido.';
    }
    if (!address.trim()) {
      e.address = 'Informe o endereço de entrega.';
    }
    return e;
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (submitting.current) return;
    const v = validate();
    setErrors(v);
    if (Object.keys(v).length > 0) {
      toast.error('Corrija os campos destacados para continuar.');
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      return;
    }

    submitting.current = true;
    setBusy(true);

    try {
      // O cliente envia somente os IDs e quantidades dos produtos.
      // O backend valida os preços e a disponibilidade de forma segura.
      const created = await orderService.create({
        items: cartItems.map((ci) => ({
          productId: ci.product.id,
          quantity: ci.quantity,
        })),
        deliveryAddress: address.trim(),
        latitude: coords?.lat,
        longitude: coords?.lng,
        client: client.trim(),
        clientEmail: email.trim() || undefined,
      });

      toast.success(`Pedido #${created.id} confirmado com sucesso!`);
      // Navega direto para a tela de acompanhamento em tempo real
      navigate(`/pedidos/${encodeURIComponent(created.id)}`);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  const invalid = (k: string) => (errors[k] ? 'input-error' : '');

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-12">
      {/* Botão Voltar & Cabeçalho do Restaurante */}
      <div>
        <Link
          to="/pedidos?aba=restaurantes"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar para restaurantes
        </Link>

        {/* Card do Restaurante estilo iFood */}
        <div className="mt-4 overflow-hidden rounded-2xl border border-paper-300 bg-white shadow-sm">
          {restaurant.imageUrl && (
            <div className="h-40 w-full overflow-hidden bg-paper-200 md:h-52">
              <img
                src={restaurant.imageUrl}
                alt={restaurant.name}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <span
                  className={`grid h-14 w-14 place-items-center rounded-2xl font-display text-2xl font-black ${restaurant.tone}`}
                  aria-hidden
                >
                  {restaurant.name.charAt(0)}
                </span>
                <div>
                  <h1 className="text-2xl font-extrabold md:text-3xl">{restaurant.name}</h1>
                  <p className="text-sm text-ink-500 font-medium">
                    {restaurant.cuisine} · Entrega em {restaurant.eta}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 ring-1 ring-inset ring-emerald-200">
                <Store className="h-3.5 w-3.5" aria-hidden /> Aberto para pedidos
              </span>
            </div>
            {restaurant.description && (
              <p className="mt-3 max-w-3xl text-sm text-ink-600">{restaurant.description}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        {/* Coluna Principal: Cardápio do Restaurante */}
        <div className="space-y-8">
          {errors.cart && (
            <div className="rounded-xl bg-brand-50 p-4 text-sm font-semibold text-brand-800 ring-1 ring-brand-300" role="alert">
              {errors.cart}
            </div>
          )}

          {menuByCategory.map(({ category, items }) => (
            <section key={category} className="space-y-4" aria-labelledby={`cat-${category}`}>
              <h2 id={`cat-${category}`} className="text-xl font-bold text-ink-900 border-b border-paper-200 pb-2">
                {category}
              </h2>
              <div className="grid gap-4">
                {items.map((prod) => {
                  const qty = cart[prod.id] || 0;
                  return (
                    <article
                      key={prod.id}
                      className="card flex flex-col justify-between gap-4 p-4 transition-shadow hover:shadow-lift sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <h3 className="font-bold text-ink-900">{prod.name}</h3>
                        <p className="text-xs text-ink-500 line-clamp-2">{prod.description}</p>
                        <p className="pt-1 font-display font-bold text-brand-700">
                          {formatCurrency(prod.unitPrice)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {prod.imageUrl && (
                          <img
                            src={prod.imageUrl}
                            alt={prod.name}
                            className="h-20 w-20 rounded-xl object-cover"
                          />
                        )}
                        <div>
                          {qty === 0 ? (
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(prod.id, 1)}
                              disabled={!prod.available}
                              className="btn-secondary px-3 py-1.5 text-xs font-bold"
                            >
                              <Plus className="h-3.5 w-3.5" aria-hidden /> Adicionar
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 p-1">
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(prod.id, -1)}
                                className="grid h-7 w-7 place-items-center rounded-lg bg-white text-ink-700 shadow-sm hover:bg-paper-100"
                                aria-label={`Diminuir quantidade de ${prod.name}`}
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-6 text-center text-sm font-bold text-brand-900">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(prod.id, 1)}
                                className="grid h-7 w-7 place-items-center rounded-lg bg-brand-600 text-white shadow-sm hover:bg-brand-700"
                                aria-label={`Aumentar quantidade de ${prod.name}`}
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* Coluna Lateral: Sacola / Carrinho + Dados de Entrega e Finalização */}
        <aside className="sticky top-6 space-y-6">
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            {/* Sacola de compras */}
            <section className="card p-5 space-y-4 shadow-sm" aria-labelledby="sec-sacola">
              <div className="flex items-center justify-between border-b border-paper-200 pb-3">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-5 w-5 text-brand-600" aria-hidden />
                  <h2 id="sec-sacola" className="text-lg font-bold">Sua sacola</h2>
                </div>
                <span className="text-xs font-semibold text-ink-500">
                  {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'itens'}
                </span>
              </div>

              {cartItems.length === 0 ? (
                <div className="py-6 text-center text-ink-400 text-sm">
                  Sua sacola está vazia. Escolha os itens do cardápio ao lado para começar.
                </div>
              ) : (
                <ul className="divide-y divide-paper-200 text-sm max-h-64 overflow-y-auto pr-1">
                  {cartItems.map(({ product, quantity }) => (
                    <li key={product.id} className="py-3 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink-900 truncate">{product.name}</p>
                        <p className="text-xs text-ink-500">
                          {quantity} × {formatCurrency(product.unitPrice)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-display font-bold text-ink-900">
                          {formatCurrency(product.unitPrice * quantity)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(product.id, -quantity)}
                          className="text-ink-400 hover:text-brand-600 p-1"
                          aria-label={`Remover ${product.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {cartItems.length > 0 && (
                <div className="space-y-2 border-t border-paper-200 pt-3 text-sm">
                  <div className="flex justify-between text-ink-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(cartSubtotal)}</span>
                  </div>
                  <div className="flex justify-between text-ink-600">
                    <span>Taxa de entrega</span>
                    <span className="text-emerald-700 font-medium">Grátis</span>
                  </div>
                  <div className="flex justify-between border-t border-paper-200 pt-2 font-display text-lg font-bold text-ink-900">
                    <span>Total</span>
                    <span>{formatCurrency(cartSubtotal)}</span>
                  </div>
                </div>
              )}
            </section>

            {/* Identificação do Cliente */}
            <section className="card p-5 space-y-4 shadow-sm" aria-labelledby="sec-cliente">
              <h2 id="sec-cliente" className="text-base font-bold">Seus dados</h2>
              <div className="space-y-3">
                <div>
                  <label className="label text-xs" htmlFor="client">Nome completo *</label>
                  <input
                    id="client"
                    className={`input text-sm ${invalid('client')}`}
                    value={client}
                    onChange={(e) => setClient(e.target.value)}
                    placeholder="Ex.: Maria Oliveira"
                    autoComplete="name"
                    aria-invalid={Boolean(errors.client)}
                    aria-describedby={errors.client ? 'client-error' : undefined}
                  />
                  <FieldError id="client-error" message={errors.client} />
                </div>
                <div>
                  <label className="label text-xs" htmlFor="email">E-mail para confirmação</label>
                  <input
                    id="email"
                    type="email"
                    className={`input text-sm ${invalid('email')}`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Opcional"
                    autoComplete="email"
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={errors.email ? 'email-error' : undefined}
                  />
                  <FieldError id="email-error" message={errors.email} />
                </div>
              </div>
            </section>

            {/* Endereço de Entrega */}
            <section className="card p-5 space-y-4 shadow-sm" aria-labelledby="sec-endereco">
              <h2 id="sec-endereco" className="text-base font-bold">Endereço de entrega</h2>
              {!MAPS_CONFIGURED && (
                <div className="flex gap-2 rounded-xl bg-amber-50 p-2.5 text-xs text-amber-900" role="note">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                  <p>Digite o endereço completo manualmente.</p>
                </div>
              )}
              <div>
                <label className="label text-xs" htmlFor="address">Rua, número e bairro *</label>
                <AddressAutocomplete
                  inputId="address"
                  value={address}
                  onChange={handleAddressText}
                  onSelect={handleSelected}
                  error={errors.address}
                />
                <FieldError id="address-error" message={errors.address} />
              </div>
              <GoogleMap
                position={coords}
                draggable
                onPositionChange={handleMarker}
                className="h-48 md:h-56"
                label="Ponto de entrega no mapa"
              />
            </section>

            {/* Botão de Finalização */}
            <button
              type="submit"
              className="btn-primary w-full justify-center py-3.5 text-base font-bold shadow-lift"
              disabled={busy || cartItems.length === 0}
            >
              {busy ? <Spinner className="h-5 w-5" /> : null}
              {busy
                ? 'Confirmando pedido…'
                : `Confirmar pedido · ${formatCurrency(cartSubtotal)}`}
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
