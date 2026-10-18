export const ORDER_STATUSES = [
  'RECEBIDO',
  'CONFIRMADO',
  'EM_PREPARO',
  'PRONTO_PARA_RETIRADA',
  'SAIU_PARA_ENTREGA',
  'ENTREGUE',
  'CANCELADO',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface OrderItem {
  productId?: string;
  productName?: string;
  name: string;
  quantity: number;
  unitPrice?: number;
  subtotal?: number;
}

export interface OrderStatusHistory {
  status: OrderStatus;
  timestamp: string;
  description?: string;
}

export interface Order {
  id: string;
  client: string;
  clientEmail?: string;
  items: OrderItem[];
  deliveryAddress: string;
  latitude?: number;
  longitude?: number;
  status: OrderStatus;
  subtotal?: number;
  total?: number;
  createdAt?: string;
  updatedAt?: string;
  restaurantId?: string;
  restaurantName?: string;
  statusHistory?: OrderStatusHistory[];
}

export interface CreateOrderItemInput {
  productId: string;
  quantity: number;
}

/** Dados enviados pelo consumidor ao criar um pedido (POST /orders). */
export interface CreateOrderInput {
  items: CreateOrderItemInput[];
  deliveryAddress: string;
  latitude?: number;
  longitude?: number;
  client?: string;
  clientEmail?: string;
  // Opcionais para compatibilidade legada
  restaurantId?: string;
  restaurantName?: string;
}
