import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { restaurantService } from '../services/restaurantService';
import { getErrorMessage } from '../utils/errors';
import type { Restaurant } from '../types/restaurant';

export function useRestaurants() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    restaurantService
      .list(controller.signal)
      .then((data) => setRestaurants(data))
      .catch((e) => {
        if (axios.isCancel(e)) return;
        setError(getErrorMessage(e));
      })
      .finally(() => !controller.signal.aborted && setLoading(false));
    return () => controller.abort();
  }, [version]);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  return { restaurants, loading, error, refetch };
}
