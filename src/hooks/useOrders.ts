import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { orderService } from '../services/orderService';
import { getErrorMessage } from '../utils/errors';
import type { Order } from '../types/order';

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    orderService
      .list(controller.signal)
      .then((data) => setOrders(data))
      .catch((e) => {
        if (axios.isCancel(e)) return;
        setError(getErrorMessage(e));
      })
      .finally(() => !controller.signal.aborted && setLoading(false));
    return () => controller.abort();
  }, [version]);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);
  const replaceOrder = useCallback(
    (o: Order) => setOrders((list) => list.map((x) => (x.id === o.id ? o : x))),
    [],
  );

  return { orders, loading, error, refetch, replaceOrder };
}
