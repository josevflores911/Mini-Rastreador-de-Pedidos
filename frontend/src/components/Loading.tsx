import { Loader2 } from 'lucide-react';

export function Spinner({ className = 'h-5 w-5' }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} aria-hidden />;
}

export function PageLoading({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-24 text-ink-500">
      <Spinner className="h-8 w-8 text-brand-600" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export function OrderCardSkeleton() {
  return (
    <div className="card animate-pulse space-y-3 p-5" aria-hidden>
      <div className="flex justify-between">
        <div className="h-5 w-32 rounded bg-paper-200" />
        <div className="h-6 w-24 rounded-full bg-paper-200" />
      </div>
      <div className="h-4 w-3/4 rounded bg-paper-200" />
      <div className="h-4 w-1/2 rounded bg-paper-200" />
    </div>
  );
}

export function RestaurantCardSkeleton() {
  return (
    <div className="card flex animate-pulse items-center gap-4 p-4" aria-hidden>
      <div className="h-16 w-16 shrink-0 rounded-2xl bg-paper-200" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-5 w-3/4 rounded bg-paper-200" />
        <div className="h-4 w-1/2 rounded bg-paper-200" />
        <div className="h-3 w-1/4 rounded bg-paper-200" />
      </div>
    </div>
  );
}

