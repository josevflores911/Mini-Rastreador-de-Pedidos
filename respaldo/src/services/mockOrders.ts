/**
 * DADOS FICTÍCIOS — somente com `npm run dev` e VITE_USE_MOCKS=true.
 * Para desativar: VITE_USE_MOCKS=false (padrão). Nunca são usados no build de produção.
 */
import type { CreateOrderInput, Order, OrderStatus } from '../types/order';

let seq = 1004;
const wait = (ms = 450) => new Promise((r) => setTimeout(r, ms));
const ago = (min: number) => new Date(Date.now() - min * 60000).toISOString();

const db: Order[] = [
  { id: '1001', client: 'João Silva', clientEmail: 'joao@example.com', items: [{ name: 'Hambúrguer', quantity: 2, unitPrice: 28.9 }, { name: 'Refrigerante', quantity: 1, unitPrice: 7 }], deliveryAddress: 'Av. Paulista, 1578 - Bela Vista, São Paulo - SP', latitude: -23.5613, longitude: -46.6559, status: 'EM_PREPARO', total: 64.8, createdAt: ago(18) },
  { id: '1002', client: 'Maria Souza', items: [{ name: 'Pizza Margherita', quantity: 1, unitPrice: 54 }], deliveryAddress: 'Rua Augusta, 900 - Consolação, São Paulo - SP', latitude: -23.5535, longitude: -46.6516, status: 'SAIU_PARA_ENTREGA', total: 54, createdAt: ago(52) },
  { id: '1003', client: 'Carlos Lima', items: [{ name: 'Sushi combo', quantity: 1 }, { name: 'Temaki', quantity: 2 }, { name: 'Missô', quantity: 1 }], deliveryAddress: 'Rua Oscar Freire, 300 - Jardins, São Paulo - SP', status: 'ENTREGUE', createdAt: ago(300) },
];

export const mock = {
  async list(): Promise<Order[]> {
    await wait();
    return [...db].reverse();
  },
  async get(id: string): Promise<Order> {
    await wait(250);
    const o = db.find((x) => x.id === id);
    if (!o) throw new Error('Pedido não encontrado.');
    return { ...o };
  },
  async create(input: CreateOrderInput): Promise<Order> {
    await wait();
    const mappedItems = input.items.map((i) => ({
      productId: i.productId,
      name: `Produto ${i.productId}`,
      quantity: i.quantity,
      unitPrice: 25.0,
      subtotal: 25.0 * i.quantity,
    }));
    const total = mappedItems.reduce((s, i) => s + i.subtotal, 0);
    const o: Order = {
      id: String(seq++),
      client: input.client || 'Cliente',
      clientEmail: input.clientEmail,
      items: mappedItems,
      deliveryAddress: input.deliveryAddress,
      latitude: input.latitude,
      longitude: input.longitude,
      restaurantId: input.restaurantId || 'burger-brasa',
      restaurantName: input.restaurantName || 'Burger Brasa',
      status: 'RECEBIDO',
      subtotal: total,
      total,
      createdAt: new Date().toISOString(),
    };
    db.push(o);
    return o;
  },
  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    await wait();
    const o = db.find((x) => x.id === id);
    if (!o) throw new Error('Pedido não encontrado.');
    o.status = status;
    return { ...o };
  },
};
