import { api } from './api';
import type { Product, Restaurant, RestaurantMenu } from '../types/restaurant';

export const restaurantService = {
  /** GET /restaurants */
  async list(signal?: AbortSignal): Promise<Restaurant[]> {
    const { data } = await api.get('/restaurants', { signal });
    return Array.isArray(data) ? data : [];
  },

  /** GET /restaurants/{id} */
  async getById(id: string, signal?: AbortSignal): Promise<Restaurant> {
    const { data } = await api.get(`/restaurants/${encodeURIComponent(id)}`, { signal });
    return data;
  },

  /** GET /restaurants/{id}/menu */
  async getMenu(id: string, signal?: AbortSignal): Promise<RestaurantMenu> {
    const { data } = await api.get(`/restaurants/${encodeURIComponent(id)}/menu`, { signal });
    return data;
  },

  /** GET /restaurants/{id}/products/{productId} */
  async getProduct(restaurantId: string, productId: string, signal?: AbortSignal): Promise<Product> {
    const { data } = await api.get(
      `/restaurants/${encodeURIComponent(restaurantId)}/products/${encodeURIComponent(productId)}`,
      { signal },
    );
    return data;
  },
};
