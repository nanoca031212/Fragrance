import { Product, ProductsData, SearchFilters } from '@/types/product';
import unifiedData from '@/data/unified_products_en_gbp.json';

// Cache dos produtos
let cachedProducts: Product[] | null = null;

/**
 * Obter todos os produtos
 */
export function getAllProducts(): Product[] {
  if (cachedProducts) {
    return cachedProducts;
  }

  const data = unifiedData as any;
  cachedProducts = data.products.map((product: any) => ({
    ...product,
    slug: product.handle.replace(/-/g, '-').toLowerCase(),
    // Garantir que brands existe como array
    brands: Array.isArray(product.brands) ? product.brands : [product.brand || 'Unknown'],
    // Garantir que categories existe como array
    categories: Array.isArray(product.categories) ? product.categories : [product.category || 'Uncategorized'],
    // Normalizar imagens para o formato esperado
    images: Array.isArray(product.images) ? product.images : product.images?.main || [],
    // Garantir que tags existe como array
    tags: Array.isArray(product.tags) ? product.tags.map((tag: string) => tag) : []
  }));

  return cachedProducts || [];
}

/**
 * Obter produto por ID
 */
export function getProductById(id: number): Product | null {
  const products = getAllProducts();
  return products.find(product => product.id === id) || null;
}

/**
 * Obter produto por handle/slug
 */
export function getProductByHandle(handle: string): Product | null {
  const products = getAllProducts();
  return products.find(product => product.handle === handle || product.slug === handle) || null;
}

/**
 * Obter produtos por categoria
 */
export function getProductsByCategory(category: string): Product[] {
  const products = getAllProducts();
  const categoryLower = category.toLowerCase();
  return products.filter(product => 
    product.categories.some(cat => cat.toLowerCase() === categoryLower) ||
    product.category.toLowerCase() === categoryLower
  );
}

/**
 * Obter produtos por marca
 */
export function getProductsByBrand(brand: string): Product[] {
  const products = getAllProducts();
  const brandLower = brand.toLowerCase();
  return products.filter(product => 
    product.brands.some(b => b.toLowerCase() === brandLower) ||
    product.brand.toLowerCase() === brandLower
  );
}

/**
 * Buscar produtos
 */
export function searchProducts(query: string): Product[] {
  const products = getAllProducts();
  const queryLower = query.toLowerCase();
  
  return products.filter(product =>
    product.title.toLowerCase().includes(queryLower) ||
    product.description.toLowerCase().includes(queryLower) ||
    product.brands.some(brand => brand.toLowerCase().includes(queryLower)) ||
    product.categories.some(cat => cat.toLowerCase().includes(queryLower)) ||
    product.tags.some(tag => tag.toLowerCase().includes(queryLower))
  );
}

/**
 * Filtrar produtos
 */
export function filterProducts(filters: SearchFilters): Product[] {
  let products = getAllProducts();

  if (filters.category) {
    const categoryLower = filters.category.toLowerCase();
    products = products.filter(p => 
      p.categories.some(cat => cat.toLowerCase() === categoryLower) ||
      p.category.toLowerCase() === categoryLower
    );
  }

  if (filters.brand) {
    const brandLower = filters.brand.toLowerCase();
    products = products.filter(p => 
      p.brands.some(brand => brand.toLowerCase() === brandLower) ||
      p.brand.toLowerCase() === brandLower
    );
  }

  if (filters.gender) {
    const genderLower = filters.gender.toLowerCase();
    products = products.filter(p => 
      p.tags.some(tag => tag.toLowerCase() === genderLower)
    );
  }

  if (filters.priceMin !== undefined) {
    products = products.filter(p => Number(p.price.regular) >= filters.priceMin!);
  }

  if (filters.priceMax !== undefined) {
    products = products.filter(p => Number(p.price.regular) <= filters.priceMax!);
  }

  if (filters.tags && filters.tags.length > 0) {
    products = products.filter(p => 
      filters.tags!.some(tag => p.tags.includes(tag))
    );
  }

  if (filters.featured) {
    products = products.filter(p => p.featured);
  }

  if (filters.onSale) {
    products = products.filter(p => p.onSale || p.price.on_sale);
  }

  return products;
}

/**
 * Obter produtos em destaque
 */
export function getFeaturedProducts(limit: number = 8): Product[] {
  const products = getAllProducts();
  return products
    .filter(product => product.featured)
    .slice(0, limit);
}

/**
 * Obter produtos em promoção
 */
export function getSaleProducts(limit: number = 12): Product[] {
  const products = getAllProducts();
  return products
    .filter(product => product.onSale || product.price.on_sale)
    .slice(0, limit);
}

/**
 * Obter novos produtos
 */
export function getNewProducts(limit: number = 8): Product[] {
  const products = getAllProducts();
  return products
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

/**
 * Obter todas as categorias
 */
export function getCategories() {
  const products = getAllProducts();
  const categoryMap = new Map();

  products.forEach(product => {
    const categories = product.categories;
    categories.forEach(category => {
      if (category) {
        if (categoryMap.has(category)) {
          categoryMap.set(category, categoryMap.get(category) + 1);
        } else {
          categoryMap.set(category, 1);
        }
      }
    });
  });

  return Array.from(categoryMap.entries()).map(([name, count]) => ({
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    count,
    slug: name.toLowerCase().replace(/\s+/g, '-')
  }));
}

/**
 * Obter todas as marcas
 */
export function getBrands() {
  const products = getAllProducts();
  const brandMap = new Map();

  products.forEach(product => {
    const brands = product.brands;
    brands.forEach(brand => {
      if (brand) {
        if (brandMap.has(brand)) {
          brandMap.set(brand, brandMap.get(brand) + 1);
        } else {
          brandMap.set(brand, 1);
        }
      }
    });
  });

  return Array.from(brandMap.entries()).map(([name, count]) => ({
    name,
    count,
    slug: name.toLowerCase().replace(/\s+/g, '-')
  }));
}

/**
 * Obter estatísticas dos produtos
 */
export function getProductStats() {
  const products = getAllProducts();
  
  const total = products.length;
  const featured = products.filter(p => p.featured).length;
  const onSale = products.filter(p => p.onSale || p.price.on_sale).length;
  const avgPrice = products.reduce((sum, p) => sum + Number(p.price.regular), 0) / total;

  return {
    total,
    featured,
    onSale,
    avgPrice: Math.round(avgPrice * 100) / 100,
    categories: getCategories().length,
    brands: getBrands().length
  };
}

/**
 * Formatar preço em libras
 */
export function formatPrice(price: string | number): string {
  const numPrice = typeof price === 'string' ? parseFloat(price.replace('$', '').replace(',', '') || '0') : price;
  return `$${numPrice.toFixed(2)}`;
}

/**
 * Invalidar cache (para updates)
 */
export function invalidateProductsCache(): void {
  cachedProducts = null;
}