import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types/product';
import { trackSearch } from '@/lib/tiktokEvents';

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
}

const SearchBar: React.FC<SearchBarProps> = ({ isOpen, onClose, products }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { value: 'W30011', label: "Shop All Women's" },
    { value: 'SA2001', label: 'Shop All' },
    { value: 'LUX2001', label: 'Luxury Fragrances' },
    { value: 'W30004', label: "Women's Luxury Perfumes" }
  ];

  const generateSuggestions = (term: string) => {
    if (term.length < 2) return [];
    
    const commonPerfumes = [
      'chanel coco mademoiselle',
      'chanel chance',
      'chanel bleu',
      'chanel n°5',
      'dior sauvage',
      'ysl black opium',
      'paco rabanne 1 million'
    ];

    return commonPerfumes
      .filter(name => name.toLowerCase().includes(term.toLowerCase()))
      .slice(0, 4);
  };

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      // Prevent body scroll when search is open
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll when search is closed
      document.body.style.overflow = 'unset';
    }

    // Cleanup function to restore scroll on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (searchTerm.length === 0) {
      // Show top brands and some products
      const featuredProducts = products.slice(0, 10);
      setFilteredProducts(featuredProducts);
      setSuggestions([]);
    } else {
      const results = products.filter(product => {
        const searchLower = searchTerm.toLowerCase();
        const terms = searchLower.split(' ').filter(term => term.length > 0);
        
        return terms.every(term => (
          product.title.toLowerCase().includes(term) ||
          product.description.toLowerCase().includes(term) ||
          product.brands?.some(brand => brand.toLowerCase().includes(term)) ||
          product.primary_brand?.toLowerCase().includes(term) ||
          product.tags?.some(tag => tag.toLowerCase().includes(term))
        ));
      });
      setFilteredProducts(results);
      setSuggestions(generateSuggestions(searchTerm));
    }
  }, [searchTerm, products]);

  // Track search with debounce
  useEffect(() => {
    if (searchTerm.length > 2) {
      const timer = setTimeout(() => {
        trackSearch(searchTerm);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [searchTerm]);

  // Extract unique brands
  const allBrands = Array.from(new Set(
    products.flatMap(p => p.brands || [p.primary_brand]).filter(Boolean)
  )).sort();

  if (!isOpen) {
    return null;
  }

  const renderEmptyState = () => {
    if (searchTerm.length > 0) return null;

    return (
      <div className="space-y-8 py-4">
        {/* Brands Section */}
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 px-1">Shop by Brand</h3>
          <div className="flex flex-wrap gap-2">
            {allBrands.slice(0, 15).map(brand => (
              <button
                key={brand}
                onClick={() => setSearchTerm(brand)}
                className="px-4 py-2 border border-gray-100 rounded-full text-sm font-medium hover:border-black hover:bg-black hover:text-white transition-all"
              >
                {brand}
              </button>
            ))}
          </div>
        </section>

        {/* Featured Products Section */}
        <section>
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4 px-1">Popular Fragrances</h3>
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map(product => (
              <Link 
                key={product.id} 
                href={`/products/${product.handle}`}
                className="group flex flex-col"
                onClick={onClose}
                suppressHydrationWarning
              >
                <div className="relative aspect-square mb-2 bg-gray-50 rounded-lg overflow-hidden group-hover:opacity-90 transition-opacity">
                  <Image
                    src={Array.isArray(product.images) ? product.images[0] : product.images.main[0]}
                    alt={product.title}
                    fill
                    className="object-contain p-2"
                  />
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter truncate">
                  {product.primary_brand || 'Premium'}
                </p>
                <p className="text-xs text-gray-700 font-medium truncate mb-1">
                  {product.title}
                </p>
                <p className="text-sm font-bold text-black font-sans">
                   ${typeof product.price.regular === 'string' ? parseFloat(product.price.regular).toFixed(2) : product.price.regular.toFixed(2)}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    );
  };

  const renderResults = () => {
    if (searchTerm.length === 0) return null;

    return (
      <div className="py-4">
        {filteredProducts.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-lg font-bold">Results for "{searchTerm}"</h3>
               <span className="text-xs text-gray-500">{filteredProducts.length} items</span>
            </div>
            <div className="grid grid-cols-2 gap-6 md:gap-8">
              {filteredProducts.map(product => (
                <Link 
                  key={product.id} 
                  href={`/products/${product.handle}`}
                  className="group flex flex-col"
                  onClick={onClose}
                  suppressHydrationWarning
                >
                  <div className="relative aspect-square mb-4 bg-gray-50 rounded-lg overflow-hidden group-hover:scale-[1.02] transition-transform duration-300">
                    <Image
                      src={Array.isArray(product.images) ? product.images[0] : product.images.main[0]}
                      alt={product.title}
                      fill
                      className="object-contain p-4"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {product.primary_brand || 'Premium Brand'}
                    </p>
                    <h4 className="text-sm text-gray-900 font-medium line-clamp-2 leading-relaxed">
                      {product.title}
                    </h4>
                    <div className="flex items-center gap-2 pt-1 font-sans">
                      <p className="text-base font-bold text-black">
                        ${typeof product.price.regular === 'string' ? parseFloat(product.price.regular).toFixed(2) : product.price.regular.toFixed(2)}
                      </p>
                      <span className="text-xs text-gray-400 line-through">$169.99</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-2xl">
            <Search className="h-12 w-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-900 font-medium">
              We couldn't find any results for "{searchTerm}"
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Try searching for a brand like "Dior" or "Sauvage"
            </p>
            <button 
              onClick={() => setSearchTerm('')}
              className="mt-6 text-sm font-bold uppercase tracking-widest text-[#e7071d] hover:underline"
            >
              Clear Search
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`fixed inset-0 z-[100] bg-white flex flex-col transform transition-transform duration-300 ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}>
      <div className="border-b border-gray-100 flex-shrink-0 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center h-20">
            <div className="flex-1 flex items-center bg-gray-100 rounded-full px-5 py-3">
              <Search className="h-5 w-5 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search brands or fragrances..."
                className="flex-1 ml-3 text-base bg-transparent outline-none placeholder-gray-400 font-medium"
              />
              {searchTerm.length > 0 && (
                <button onClick={() => setSearchTerm('')} className="p-1">
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
            <button onClick={onClose} className="ml-4 p-2 text-sm font-bold uppercase tracking-widest text-black">
              Cancel
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="container mx-auto px-4 pb-12 pt-4">
          {renderEmptyState()}
          {renderResults()}
        </div>
      </div>
    </div>
  );
};

export default SearchBar;