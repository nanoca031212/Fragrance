import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Search,
  User,
  ShoppingBag,
  Heart,
  Menu,
  X,
  MapPin,
  Gift,
} from "lucide-react";
import SearchBar from "@/components/search/SearchBar";
import { useCart } from "@/contexts/CartContext";
import { getAllProducts } from "@/lib/products";
import { Product } from "@/types/product";

interface HeaderTPSProps {
  className?: string;
  hidePromoBanner?: boolean;
  hideMagentaBanner?: boolean;
  sticky?: boolean;
}

export default function HeaderTPS({
  className = "",
  hidePromoBanner = false,
  hideMagentaBanner = false,
  sticky = false,
}: HeaderTPSProps) {
  const router = useRouter();
  const { items, setIsOpen } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const isProductPage = router.pathname.startsWith("/products");
  const isCheckoutPage = router.pathname.startsWith("/checkout");
  const shouldHideSearchBar = isProductPage || isCheckoutPage;
  const cartQuantity = items.reduce((total, item) => total + item.quantity, 0);
  const shouldShowMixBanner = !isProductPage && cartQuantity === 1;

  useEffect(() => {
    setProducts(getAllProducts());
  }, []);

  // Navegação principal (tabs rosa)
  const mainNavItems = [
    { name: "TRENDING", href: "/trending" },
    { name: "BRANDS", href: "/brands" },
    { name: "DISCOVERY", href: "/discovery" },
    { name: "BOUTIQUE", href: "/boutique" },
  ];

  return (
    <header
      className={`${sticky ? "sticky top-0 z-50" : "relative"} ${className}`}
    >
      {/* Promotional Banner */}
      {!hidePromoBanner && !isCheckoutPage && (
        <div className="bg-black  text-white text-center px-2 py-2 text-[13px] font-bold">
          Summer deal buy 2 fragrances for $99.99 & get the 3rd FREE
        </div>
      )}

      {/* Top Bar - Preta */}
      <div className="bg-white py-1 flex items-center justify-between px-2 text-white">
        <div className="container">
          <div
            className={`flex items-center h-16 ${isCheckoutPage ? "justify-center" : "justify-between pl-2"}`}
          >
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center"
              suppressHydrationWarning
            >
              <img
                src="/images/logo.webp"
                alt="Logo"
                width={260}
                height={260}
              />
            </Link>

            {/* Icons direita */}
            {!isCheckoutPage && (
              <div className="flex items-center space-x-3">
                {/* Currency Icon - sempre visível */}
                <button
                  type="button"
                  onClick={() => setIsOpen(true)}
                  className="flex items-center"
                  aria-label="Abrir carrinho"
                >
                  <img
                    src="/images/IconLibra.svg"
                    alt="USD"
                    width={30}
                    height={30}
                  />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Bar - Esticada horizontalmente */}
      {!shouldHideSearchBar && (
        <div className="bg-white pb-3">
          <div className="w-full p-1">
            <div className="flex  text-center justify-center border border-[#532450]  rounded-r-md w-full max-w-none">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="w-full pl-6 pr-16 py-2 text-base  rounded-lg
                       bg-gray-50 text-left text-gray-500"
              >
                Looking for something specific?
              </button>
              <div
                className=" right-2 top-2 bottom-2 h-13 w-12 bg-[#532450] text-white
                         rounded-r-md flex items-center justify-center"
              >
                <Search className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Modal */}
      <SearchBar
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        products={products}
      />

      {/* Navigation Tabs - Rosa/Magenta */}
      {!hideMagentaBanner && !isCheckoutPage && (
        <div className="bg-[#532450]">
          <div className="container mx-auto">
            <nav className="flex overflow-x-auto scrollbar-none">
              {/* Men's Collection */}
              <Link
                href="/collections/mens"
                className="flex-shrink-0 px-6 py-4 text-white text-sm font-medium uppercase tracking-wider
                       hover:bg-white hover:bg-opacity-10 transition-colors whitespace-nowrap"
                suppressHydrationWarning
              >
                MEN'S
              </Link>

              {/* Women's Collection */}
              <Link
                href="/collections/womens"
                className="flex-shrink-0 px-6 py-4 text-white text-sm font-medium uppercase tracking-wider
                       hover:bg-white hover:bg-opacity-10 transition-colors whitespace-nowrap"
                suppressHydrationWarning
              >
                WOMEN'S
              </Link>

              {/* Gift Sets */}
              <Link
                href="/collections/gift-sets"
                className="flex-shrink-0 px-6 py-4 text-white text-sm font-medium uppercase tracking-wider
                       hover:bg-white hover:bg-opacity-10 transition-colors whitespace-nowrap"
                suppressHydrationWarning
              >
                GIFT SETS
              </Link>

              {/* Special Offers */}
              <Link
                href="/"
                className="flex-shrink-0 px-6 py-4 text-white text-sm font-medium uppercase tracking-wider
                       hover:bg-white hover:bg-opacity-10 transition-colors whitespace-nowrap"
                suppressHydrationWarning
              >
                SPECIAL OFFERS
              </Link>
            </nav>
          </div>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-[120px] bg-white z-50 overflow-y-auto">
          <nav className="container mx-auto px-4 py-6">
            {/* Main Navigation */}
            <div className="space-y-1 mb-8">
              {mainNavItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block px-4 py-4 text-lg font-semibold text-gray-900 
                           hover:bg-gray-50 rounded-lg border-b border-gray-100"
                  onClick={() => setIsMobileMenuOpen(false)}
                  suppressHydrationWarning
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Secondary Links */}
            <div className="space-y-1 mb-8 pt-6 border-t border-gray-200">
              <Link
                href="/stores"
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                onClick={() => setIsMobileMenuOpen(false)}
                suppressHydrationWarning
              >
                <MapPin className="mr-3 h-5 w-5" />
                Stores
              </Link>
              <Link
                href="/account"
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                onClick={() => setIsMobileMenuOpen(false)}
                suppressHydrationWarning
              >
                <User className="mr-3 h-5 w-5" />
                My Account
              </Link>
              <Link
                href="/wishlist"
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg"
                onClick={() => setIsMobileMenuOpen(false)}
                suppressHydrationWarning
              >
                <Heart className="mr-3 h-5 w-5" />
                Wishlist
              </Link>
            </div>

            {/* Contact Info */}
            <div className="pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Need help?</p>
              <p className="text-sm font-medium text-gray-900">0800 123 4567</p>
            </div>
          </nav>
        </div>
      )}
      {shouldShowMixBanner && (
        <div
          className={`bg-white border border-black text-center font-bold text-md py-1 px-2 mx-1 ${isCheckoutPage ? "my-2" : "mt-2"}`}
        >
          Mix & match any 3 fragrances $99.99 for all three
        </div>
      )}
    </header>
  );
}
