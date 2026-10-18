const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const formatCurrency = (value: number) => currency.format(value);

export function formatDateTime(iso?: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(d);
}

export function summarizeItems(items: { name: string; quantity: number }[], max = 2): string {
  if (items.length === 0) return 'Sem itens';
  const shown = items.slice(0, max).map((i) => `${i.quantity}× ${i.name}`);
  const rest = items.length - max;
  return rest > 0 ? `${shown.join(', ')} +${rest}` : shown.join(', ');
}

export function computeTotal(items: { quantity: number; unitPrice?: number }[]): number | undefined {
  const priced = items.filter((i) => typeof i.unitPrice === 'number');
  if (priced.length === 0) return undefined;
  return priced.reduce((sum, i) => sum + i.quantity * (i.unitPrice as number), 0);
}
