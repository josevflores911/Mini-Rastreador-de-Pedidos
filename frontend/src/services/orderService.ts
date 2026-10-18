import { api } from './api';
import { toCreatePayload, toOrder, toOrderList } from './orderMapper';
import type { CreateOrderInput, Order, OrderStatus } from '../types/order';

const useMocks = import.meta.env.DEV && import.meta.env.VITE_USE_MOCKS === 'true';
const loadMock = () => import('./mockOrders').then((m) => m.mock);

export const orderService = {
  /** GET /orders */
  async list(signal?: AbortSignal): Promise<Order[]> {
    if (useMocks) return (await loadMock()).list();
    const { data } = await api.get('/orders', { signal });
    return toOrderList(data);
  },

  /** POST /orders */
  async create(input: CreateOrderInput): Promise<Order> {
    if (useMocks) return (await loadMock()).create(input);
    const { data } = await api.post('/orders', toCreatePayload(input));
    return toOrder(data);
  },

  /** GET /orders/{id} */
  async getById(id: string, signal?: AbortSignal): Promise<Order> {
    if (useMocks) return (await loadMock()).get(id);
    const { data } = await api.get(`/orders/${encodeURIComponent(id)}`, { signal });
    return toOrder(data);
  },

  /**
   * PATCH /orders/{id}/status
   * Se o backend responder sem corpo, buscamos o pedido novamente:
   * o status exibido é sempre o confirmado pelo servidor.
   */
  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    if (useMocks) return (await loadMock()).updateStatus(id, status);
    const { data } = await api.patch(`/orders/${encodeURIComponent(id)}/status`, { status });
    if (data && typeof data === 'object' && 'status' in data) return toOrder(data);
    return orderService.getById(id);
  },

  /**
   * POST /orders/{id}/cancel
   * Cancela o pedido com validação de status e confirmação do backend.
   */
  async cancel(id: string, reason?: string): Promise<Order> {
    if (useMocks) return (await loadMock()).updateStatus(id, 'CANCELADO');
    const { data } = await api.post(`/orders/${encodeURIComponent(id)}/cancel`, { reason });
    return toOrder(data);
  },
};
