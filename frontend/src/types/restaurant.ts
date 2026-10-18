export interface Restaurant {
  id: string;
  name: string;
  description?: string;
  cuisine: string;
  /** Estimativa de entrega, ex.: "30–45 min". */
  eta: string;
  /** Classes Tailwind do bloco de cor da card. */
  tone: string;
  isOpen?: boolean;
  imageUrl?: string;
  productsCount?: number;
  categories?: string[];
}

export interface Product {
  id: string;
  restaurantId: string;
  name: string;
  description: string;
  unitPrice: number;
  category: string;
  available: boolean;
  imageUrl?: string;
}

export interface MenuCategory {
  category: string;
  items: Product[];
}

export interface RestaurantMenu {
  restaurant: Restaurant;
  categories: string[];
  menuByCategory: MenuCategory[];
  products: Product[];
}
