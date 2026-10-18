import type { OrderStatus } from '../types/order';

export const STATUS_LABEL: Record<OrderStatus, string> = {
  RECEBIDO: 'Recebido',
  CONFIRMADO: 'Confirmado',
  EM_PREPARO: 'Em preparo',
  PRONTO_PARA_RETIRADA: 'Pronto p/ entrega',
  SAIU_PARA_ENTREGA: 'A caminho',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

export const STATUS_STYLE: Record<OrderStatus, string> = {
  RECEBIDO: 'bg-sky-50 text-sky-800 ring-sky-200',
  CONFIRMADO: 'bg-indigo-50 text-indigo-800 ring-indigo-200',
  EM_PREPARO: 'bg-amber-50 text-amber-800 ring-amber-200',
  PRONTO_PARA_RETIRADA: 'bg-teal-50 text-teal-800 ring-teal-200',
  SAIU_PARA_ENTREGA: 'bg-violet-50 text-violet-800 ring-violet-200',
  ENTREGUE: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  CANCELADO: 'bg-stone-100 text-stone-600 ring-stone-300',
};

export const STATUS_DOT: Record<OrderStatus, string> = {
  RECEBIDO: 'bg-sky-500',
  CONFIRMADO: 'bg-indigo-500',
  EM_PREPARO: 'bg-amber-500',
  PRONTO_PARA_RETIRADA: 'bg-teal-500',
  SAIU_PARA_ENTREGA: 'bg-violet-500',
  ENTREGUE: 'bg-emerald-500',
  CANCELADO: 'bg-stone-400',
};

/** Etapas sequenciais da esteira de entrega do consumidor (iFood-like). */
export const PROGRESS_STEPS: OrderStatus[] = [
  'RECEBIDO',
  'CONFIRMADO',
  'EM_PREPARO',
  'PRONTO_PARA_RETIRADA',
  'SAIU_PARA_ENTREGA',
  'ENTREGUE',
];

/** Operações de transição de status autorizadas (restritas a perfis internos). */
export function nextActions(status: OrderStatus): OrderStatus[] {
  switch (status) {
    case 'RECEBIDO':
      return ['CONFIRMADO', 'CANCELADO'];
    case 'CONFIRMADO':
      return ['EM_PREPARO', 'CANCELADO'];
    case 'EM_PREPARO':
      return ['PRONTO_PARA_RETIRADA', 'SAIU_PARA_ENTREGA', 'CANCELADO'];
    case 'PRONTO_PARA_RETIRADA':
      return ['SAIU_PARA_ENTREGA', 'CANCELADO'];
    case 'SAIU_PARA_ENTREGA':
      return ['ENTREGUE', 'CANCELADO'];
    default:
      return [];
  }
}

export function actionLabel(target: OrderStatus): string {
  switch (target) {
    case 'CONFIRMADO':
      return 'Confirmar pedido';
    case 'EM_PREPARO':
      return 'Iniciar preparo';
    case 'PRONTO_PARA_RETIRADA':
      return 'Pronto para entrega';
    case 'SAIU_PARA_ENTREGA':
      return 'Saiu para entrega';
    case 'ENTREGUE':
      return 'Marcar como entregue';
    case 'CANCELADO':
      return 'Cancelar pedido';
    default:
      return STATUS_LABEL[target] || target;
  }
}
