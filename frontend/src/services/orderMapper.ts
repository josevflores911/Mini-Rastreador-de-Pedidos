/**
 * Camada de adaptação ao contrato do backend.
 * Normaliza os dados da API para os tipos de domínio do frontend.
 */
import { ORDER_STATUSES } from '../types/order';
import type { CreateOrderInput, Order, OrderItem, OrderStatus, OrderStatusHistory } from '../types/order';
import { computeTotal } from '../utils/format';

type Raw = Record<string, any>;

const num = (v: unknown): number | undefined => {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number);
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
};

function toStatus(v: unknown): OrderStatus {
  const s = String(v ?? '').toUpperCase();
  return (ORDER_STATUSES as readonly string[]).includes(s) ? (s as OrderStatus) : 'RECEBIDO';
}

function toHistory(r: Raw): OrderStatusHistory {
  return {
    status: toStatus(r.status),
    timestamp: String(r.timestamp || r.createdAt || new Date().toISOString()),
    description: r.description ? String(r.description) : undefined,
  };
}

function toItem(r: Raw): OrderItem {
  const quantity = num(r.quantity ?? r.quantidade) ?? 1;
  const unitPrice = num(r.unitPrice ?? r.price ?? r.preco ?? r.precoUnitario);
  const subtotal = num(r.subtotal) ?? (unitPrice !== undefined ? unitPrice * quantity : undefined);
  return {
    productId: r.productId ? String(r.productId) : undefined,
    productName: r.productName ? String(r.productName) : undefined,
    name: String(r.name ?? r.productName ?? r.nome ?? r.description ?? ''),
    quantity,
    unitPrice,
    subtotal,
  };
}

export function toOrder(r: Raw): Order {
  const items: OrderItem[] = Array.isArray(r.items) ? r.items.map(toItem) : [];
  const address = r.deliveryAddress ?? r.endereco ?? r.address;
  const history: OrderStatusHistory[] = Array.isArray(r.statusHistory)
    ? r.statusHistory.map(toHistory)
    : [];

  const subtotal = num(r.subtotal) ?? computeTotal(items);
  const total = num(r.total ?? r.totalAmount ?? r.valorTotal) ?? subtotal;

  return {
    id: String(r.id),
    client: String(r.client ?? r.customerName ?? r.cliente ?? ''),
    clientEmail: r.clientEmail ?? r.customerEmail ?? r.email ?? undefined,
    items,
    deliveryAddress: typeof address === 'string' ? address : (address?.formattedAddress ?? ''),
    latitude: num(r.latitude ?? r.lat ?? address?.latitude),
    longitude: num(r.longitude ?? r.lng ?? r.lon ?? address?.longitude),
    status: toStatus(r.status),
    subtotal,
    total,
    createdAt: r.createdAt ?? r.created_at ?? r.dataCriacao ?? undefined,
    updatedAt: r.updatedAt ?? r.updated_at ?? undefined,
    restaurantId: r.restaurantId ?? r.restaurant?.id ?? undefined,
    restaurantName: r.restaurantName ?? r.restaurant?.name ?? r.restaurante ?? undefined,
    statusHistory: history,
  };
}

/** Aceita lista simples ou paginação do Spring (`{ content: [...] }`). */
export function toOrderList(data: unknown): Order[] {
  const list = Array.isArray(data) ? data : ((data as Raw)?.content ?? []);
  return (list as Raw[]).map(toOrder);
}

/**
 * Monta o payload de envio.
 * O cliente NÃO envia preços ou totais como fonte confiável.
 * O backend calcula com base no cadastro do produto.
 */
export function toCreatePayload(input: CreateOrderInput): Raw {
  const sendCoords = import.meta.env.VITE_SEND_COORDINATES !== 'false';
  return {
    client: input.client,
    ...(input.clientEmail ? { clientEmail: input.clientEmail } : {}),
    items: input.items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
    })),
    deliveryAddress: input.deliveryAddress,
    ...(input.restaurantId ? { restaurantId: input.restaurantId } : {}),
    ...(input.restaurantName ? { restaurantName: input.restaurantName } : {}),
    ...(sendCoords && input.latitude !== undefined && input.longitude !== undefined
      ? { latitude: input.latitude, longitude: input.longitude }
      : {}),
  };
}
