/**
 * Utility helper for managing, resolving, and providing high-quality
 * product photography for Qatar Supermarket & POS ordering catalog.
 */

export const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';

export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  Beverages: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80',
  Food: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
  Chocolate: 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&w=600&q=80',
  Snacks: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=600&q=80',
  Coffee: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=600&q=80',
  Bakery: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80',
  Desserts: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=600&q=80',
  Juices: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80',
  Dairy: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
};

export const PRODUCT_ID_IMAGES: Record<string, string> = {
  p_karak: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80',
  p_burger: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80',
  p_1: 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?auto=format&fit=crop&w=600&q=80',
  p_2: 'https://images.unsplash.com/photo-1581798459219-318e76aecc7b?auto=format&fit=crop&w=600&q=80',
  p_3: 'https://images.unsplash.com/photo-1575224300306-1b8da36134ec?auto=format&fit=crop&w=600&q=80',
  p_4: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?auto=format&fit=crop&w=600&q=80',
  p_5: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80',
  p_6: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=600&q=80',
  p_7: 'https://images.unsplash.com/photo-1514517220017-8ce97a34a7b6?auto=format&fit=crop&w=600&q=80',
};

/**
 * Resolves the best available product photograph for customers during ordering.
 */
export function getProductImage(product?: { id?: string; name?: string; category?: string; image?: string } | null): string {
  if (!product) return DEFAULT_FALLBACK_IMAGE;

  // 1. Direct explicit image if provided
  if (product.image && typeof product.image === 'string' && product.image.trim().length > 5) {
    return product.image.trim();
  }

  // 2. Specific product ID matching
  if (product.id && PRODUCT_ID_IMAGES[product.id]) {
    return PRODUCT_ID_IMAGES[product.id];
  }

  // 3. Category matching
  if (product.category && CATEGORY_FALLBACK_IMAGES[product.category]) {
    return CATEGORY_FALLBACK_IMAGES[product.category];
  }

  // 4. Keyword heuristics from product name
  const n = (product.name || '').toLowerCase();
  if (n.includes('karak') || n.includes('tea') || n.includes('chai')) {
    return CATEGORY_FALLBACK_IMAGES.Beverages;
  }
  if (n.includes('burger') || n.includes('sandwich') || n.includes('shawarma') || n.includes('meal')) {
    return CATEGORY_FALLBACK_IMAGES.Food;
  }
  if (n.includes('popcorn') || n.includes('chips') || n.includes('snack') || n.includes('nuts')) {
    return CATEGORY_FALLBACK_IMAGES.Snacks;
  }
  if (n.includes('chocolate') || n.includes('candy') || n.includes('sweet') || n.includes('mamba') || n.includes('knoppers')) {
    return CATEGORY_FALLBACK_IMAGES.Chocolate;
  }
  if (n.includes('coffee') || n.includes('latte') || n.includes('espresso') || n.includes('cappuccino')) {
    return CATEGORY_FALLBACK_IMAGES.Coffee;
  }
  if (n.includes('juice') || n.includes('mojito') || n.includes('smoothie')) {
    return CATEGORY_FALLBACK_IMAGES.Juices;
  }

  return DEFAULT_FALLBACK_IMAGE;
}

/**
 * Helper to handle image loading errors gracefully on <img> elements
 */
export function handleImageError(e: React.SyntheticEvent<HTMLImageElement, Event>, fallback = DEFAULT_FALLBACK_IMAGE) {
  const target = e.currentTarget;
  if (target.src !== fallback) {
    target.src = fallback;
  }
}
