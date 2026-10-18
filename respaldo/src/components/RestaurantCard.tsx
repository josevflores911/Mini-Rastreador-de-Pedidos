import { Link } from 'react-router-dom';
import { ChevronRight, Clock } from 'lucide-react';
import type { Restaurant } from '../types/restaurant';

export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  return (
    <Link
      to={`/restaurantes/${restaurant.id}/novo-pedido`}
      className="card group flex items-start gap-4 p-4 transition-all hover:-translate-y-0.5 hover:shadow-lift"
      aria-label={`Ver cardápio e pedir em ${restaurant.name}`}
    >
      <span
        className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl font-display text-2xl font-extrabold ${restaurant.tone}`}
        aria-hidden
      >
        {restaurant.name.charAt(0)}
      </span>
      <span className="min-w-0 flex-1 space-y-1">
        <span className="block truncate font-display text-base font-bold text-ink-900 group-hover:text-brand-700">
          {restaurant.name}
        </span>
        <span className="block text-xs font-semibold text-ink-500 uppercase tracking-wide">
          {restaurant.cuisine}
        </span>
        {restaurant.description && (
          <span className="block text-xs text-ink-600 line-clamp-2">
            {restaurant.description}
          </span>
        )}
        <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-ink-700">
          <Clock className="h-3.5 w-3.5 text-brand-600" aria-hidden /> {restaurant.eta}
        </span>
      </span>
      <ChevronRight
        className="mt-2 h-5 w-5 shrink-0 text-ink-300 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600"
        aria-hidden
      />
    </Link>
  );
}
