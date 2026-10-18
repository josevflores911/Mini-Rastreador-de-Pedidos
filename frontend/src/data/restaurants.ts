import { restaurantService } from '../services/restaurantService';
import type { Restaurant } from '../types/restaurant';

/**
 * Mocks de restaurantes removidos da aplicação React.
 * O catálogo foi migrado para o JSON Server na porta 8080 (GET /restaurants e GET /restaurants/:id).
 * Para novas consultas, utilize diretamente `restaurantService` ou o hook `useRestaurants`.
 */
export const getRestaurant = async (id: string | undefined): Promise<Restaurant | undefined> => {
  if (!id) return undefined;
  try {
    return await restaurantService.getById(id);
  } catch {
    return undefined;
  }
};
