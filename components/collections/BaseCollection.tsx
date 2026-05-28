import Head from "next/head";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { Info } from "lucide-react";
import { Product } from "@/types/product";
import Layout from "@/components/layout/Layout";
import ProductCardTPS from "@/components/products/ProductCardTPS";
import ListControls from "@/components/filters/ListControls";
import { useSessionFilters } from "@/hooks/useSessionFilters";
import { useCart } from "@/contexts/CartContext";

interface BaseCollectionProps {
  products: Product[];
  title: string;
  description: string;
  filterFunction?: (product: Product) => boolean;
}

export default function BaseCollection({
  products: initialProducts,
  title,
  description,
  filterFunction,
}: BaseCollectionProps) {
  // Se houver uma função de filtro, aplica ela nos produtos iniciais
  const baseProducts = filterFunction
    ? initialProducts.filter(filterFunction)
    : initialProducts;
  const [products, setProducts] = useState(baseProducts);

  const router = useRouter();
  const { bundleSlot, returnTo } = router.query;
  const isSelectionMode =
    typeof bundleSlot === "string" && typeof returnTo === "string";
  const { isOpen: isBagOpen, setIsOpen: setBagOpen, clearCart } = useCart();

  const [remaining, setRemaining] = useState(0);
  const [packName, setPackName] = useState("");
  const [showAlert, setShowAlert] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [baseProductId, setBaseProductId] = useState<number | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedCount, setSelectedCount] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fadeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const lastScrollY = useRef(0);
  const collapseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const didResetRef = useRef(false);

  // Reset bundle and cart every time the page mounts fresh (outside selection mode)
  useEffect(() => {
    if (!router.isReady || didResetRef.current || isSelectionMode) return;

    didResetRef.current = true;

    try {
      localStorage.removeItem("bundleState");
      window.dispatchEvent(new Event("bundleStateUpdated"));
    } catch (e) {}
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, isSelectionMode]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      // Qualquer direção de rolagem significativa fará a pilha recolher
      if (Math.abs(currentScrollY - lastScrollY.current) > 10) {
        setIsCollapsed(true);
      }
      lastScrollY.current = currentScrollY <= 0 ? 0 : currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const calculateRemaining = () => {
    try {
      const stored = localStorage.getItem("bundleState");
      if (stored) {
        const state = JSON.parse(stored);
        if (state && Array.isArray(state.selections)) {
          if (state.selections[0]) setBaseProductId(state.selections[0].id);
          const pCount =
            state.packType === "trio" ? 3 : state.packType === "hexa" ? 6 : 1;
          let filled = 0;
          for (let i = 0; i < pCount; i++) {
            if (state.selections[i]) filled++;
          }
          setRemaining(pCount - filled);
          setPackName(
            state.packType === "trio"
              ? "3 Perfumes"
              : state.packType === "hexa"
                ? "6 Perfumes"
                : "1 Perfume",
          );
          setSelectedCount(filled);

          // Encontrar todas as imagens dos produtos selecionados
          const nonNullSelections = state.selections.filter((p: any) => p);
          const extractedImages = nonNullSelections.map((selection: any) => {
            return Array.isArray(selection.images)
              ? selection.images[0]
              : selection.images?.main?.[0] || selection.image || "";
          });
          setSelectedImages(extractedImages);

          // Trigger toast with smooth transitions
          setShowAlert(true);
          setTimeout(() => setToastVisible(true), 10);

          if (timeoutRef.current) clearTimeout(timeoutRef.current);
          if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);

          timeoutRef.current = setTimeout(() => {
            setToastVisible(false);
            fadeTimeoutRef.current = setTimeout(() => setShowAlert(false), 500);
          }, 3000);

          // Mostrar os cards expandidos e ativar temporizador para colapsar após 3s
          setIsCollapsed(false);
          if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
          collapseTimerRef.current = setTimeout(() => {
            setIsCollapsed(true);
          }, 3000);
        }
      } else {
        // Reset state if localStorage is empty
        setRemaining(0);
        setSelectedCount(0);
        setSelectedImages([]);
        setShowAlert(false);
      }
    } catch (e) {}
  };

  useEffect(() => {
    calculateRemaining();
    window.addEventListener("bundleStateUpdated", calculateRemaining);
    return () => {
      window.removeEventListener("bundleStateUpdated", calculateRemaining);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    };
  }, []);

  // Usar filtros baseados em sessão UTM
  const { sessionFilters, isLoaded } = useSessionFilters();
  const sortBy = sessionFilters.sort;

  // Aplicar filtros da sessão quando carregados
  useEffect(() => {
    if (!isLoaded) return;

    let filteredProducts = baseProducts;

    // Aplicar filtros primeiro
    if (sessionFilters.activeFilters.length > 0) {
      filteredProducts = baseProducts.filter((product) => {
        return sessionFilters.activeFilters.some((filter) => {
          // Filtro de marca
          if (
            filter.includes("-") &&
            !["new-in", "gift-set"].includes(filter)
          ) {
            const brandRegex = new RegExp(filter.replace(/-/g, "\\s+"), "i");
            if (product.brands?.some((brand) => brandRegex.test(brand)))
              return true;
            if (product.primary_brand && brandRegex.test(product.primary_brand))
              return true;
          }

          // Filtros de preço
          if (filter === "under-50") {
            const price =
              typeof product.price.regular === "string"
                ? parseFloat(product.price.regular)
                : product.price.regular;
            return price < 50;
          }
          if (filter === "50-100") {
            const price =
              typeof product.price.regular === "string"
                ? parseFloat(product.price.regular)
                : product.price.regular;
            return price >= 50 && price <= 100;
          }
          if (filter === "over-100") {
            const price =
              typeof product.price.regular === "string"
                ? parseFloat(product.price.regular)
                : product.price.regular;
            return price > 100;
          }

          // Filtros de gênero
          if (filter === "men" || filter === "women") {
            return product.tags?.includes(filter);
          }

          // Filtros de coleção
          if (["new-in", "bestseller", "gift-set", "luxury"].includes(filter)) {
            return product.tags?.includes(filter);
          }

          return false;
        });
      });
    }

    // Aplicar ordenação
    if (sessionFilters.sort !== "featured") {
      switch (sessionFilters.sort) {
        case "price-low":
          filteredProducts.sort((a, b) => {
            const priceA =
              typeof a.price.regular === "string"
                ? parseFloat(a.price.regular)
                : a.price.regular;
            const priceB =
              typeof b.price.regular === "string"
                ? parseFloat(b.price.regular)
                : b.price.regular;
            return priceA - priceB;
          });
          break;
        case "price-high":
          filteredProducts.sort((a, b) => {
            const priceA =
              typeof a.price.regular === "string"
                ? parseFloat(a.price.regular)
                : a.price.regular;
            const priceB =
              typeof b.price.regular === "string"
                ? parseFloat(b.price.regular)
                : b.price.regular;
            return priceB - priceA;
          });
          break;
        case "name-az":
          filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case "name-za":
          filteredProducts.sort((a, b) => b.title.localeCompare(a.title));
          break;
        case "newest":
          filteredProducts.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          );
          break;
        case "popular":
          filteredProducts.sort(
            (a, b) => (b.popularity || 0) - (a.popularity || 0),
          );
          break;
      }
    }

    setProducts(filteredProducts);
  }, [
    isLoaded,
    sessionFilters.activeFilters,
    sessionFilters.sort,
    baseProducts,
  ]);

  const handleSort = (sort: string) => {
    let sortedProducts = [...products];

    switch (sort) {
      case "price-low":
        sortedProducts.sort((a, b) => {
          const priceA =
            typeof a.price.regular === "string"
              ? parseFloat(a.price.regular)
              : a.price.regular;
          const priceB =
            typeof b.price.regular === "string"
              ? parseFloat(b.price.regular)
              : b.price.regular;
          return priceA - priceB;
        });
        break;
      case "price-high":
        sortedProducts.sort((a, b) => {
          const priceA =
            typeof a.price.regular === "string"
              ? parseFloat(a.price.regular)
              : a.price.regular;
          const priceB =
            typeof b.price.regular === "string"
              ? parseFloat(b.price.regular)
              : b.price.regular;
          return priceB - priceA;
        });
        break;
      case "name-az":
        sortedProducts.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "name-za":
        sortedProducts.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "newest":
        sortedProducts.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        break;
      case "popular":
        sortedProducts.sort(
          (a, b) => (b.popularity || 0) - (a.popularity || 0),
        );
        break;
      default:
        sortedProducts = [...baseProducts]; // Featured é a ordem original
    }

    setProducts(sortedProducts);
  };

  const handleFilter = (filters: string[]) => {
    if (filters.length === 0) {
      setProducts(baseProducts);
      return;
    }

    const filtered = baseProducts.filter((product) => {
      return filters.some((filter) => {
        // Filtro de marca
        if (filter.includes("-") && !["new-in", "gift-set"].includes(filter)) {
          const brandRegex = new RegExp(filter.replace(/-/g, "\\s+"), "i");
          if (product.brands?.some((brand) => brandRegex.test(brand)))
            return true;
          if (product.primary_brand && brandRegex.test(product.primary_brand))
            return true;
          if (product.title && brandRegex.test(product.title)) return true;
        }

        // Filtro de preço
        if (filter === "under-50") {
          return parseFloat(product.price.regular.toString()) < 50;
        }
        if (filter === "50-100") {
          const price = parseFloat(product.price.regular.toString());
          return price >= 50 && price <= 100;
        }
        if (filter === "over-100") {
          return parseFloat(product.price.regular.toString()) > 100;
        }

        // Filtros de gênero
        if (["men", "women"].includes(filter)) {
          return product.tags.includes(filter);
        }

        // Filtros de coleção
        if (
          ["new-in", "bestseller", "gift-set", "premium", "offers"].includes(
            filter,
          )
        ) {
          return product.tags.includes(filter);
        }

        return false;
      });
    });

    setProducts(filtered);
  };

  return (
    <Layout>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      {/* Toast Alert */}
      {showAlert && (
        <div
          className={`fixed top-14 left-1/2 -translate-x-1/2 z-[150] w-full max-w-[400px] px-4 transition-all duration-500 ease-in-out ${toastVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}
        >
          <div
            role="alert"
            className="relative w-full rounded-xl border border-gray-200 bg-white p-4 shadow-[0_10px_40px_rgba(0,0,0,0.1)] text-gray-900
                                       [&>svg~*]:pl-8 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-gray-900"
          >
            <Info className="h-5 w-5" />
            <h5 className="mb-1 font-semibold leading-none tracking-tight text-sm">
              {selectedCount === 6
                ? "🎉 Maximum Discount Achieved!"
                : selectedCount >= 4
                  ? "Continue adicionando!"
                  : selectedCount === 3
                    ? "🎉 Discount Unlocked!"
                    : "Mix & match — 3 perfumes por £99.99"}
            </h5>
            <div className="text-sm text-gray-500 mt-1">
              {selectedCount < 3
                ? `Buy any ${3 - selectedCount} fragrances for just $99.99 and get the 3rd FREE`
                : selectedCount === 3
                  ? `Congratulations, you've unlocked the discount 3 perfumes for £179.99. Select more 3 perfumes to unlock the maximum discount.`
                  : selectedCount < 6
                    ? `${6 - selectedCount} more perfume(s) to unlock the maximum discount.`
                    : `Congratulations, you've unlocked the maximum discount!`}
            </div>
          </div>
        </div>
      )}

      {/* Mini Bundle Cards - hidden when bag is open */}
      {selectedImages.length > 0 && !isBagOpen && (
        <div className="fixed bottom-28 right-6 z-[110] flex flex-col-reverse gap-4">
          {selectedImages.map((img, index) => {
            const isExpanded = !isCollapsed;
            // A distância aproximada entre os cards é de ~74px (56px altura + 16px gap + 2px borda)
            const collapseTranslate = isExpanded ? 0 : index * 74;
            const opacity = isExpanded ? 1 : index === 0 ? 1 : 0;
            const pointerEvents = opacity === 0 ? "none" : "auto";

            // No modo colapsado, o card base (index 0) exibe a última imagem e a contagem total
            const displayImg =
              index === 0 && !isExpanded
                ? selectedImages[selectedImages.length - 1]
                : img;
            const displayBadge =
              index === 0 && !isExpanded ? selectedCount : index + 1;

            return (
              <div
                key={index}
                onClick={() => setBagOpen(true)}
                className="bg-white border border-gray-300 rounded-xl p-1 shadow-[0_10px_40px_rgba(0,0,0,0.1)] relative animate-in fade-in slide-in-from-bottom-12 duration-500 ease-out transition-all cursor-pointer hover:scale-105"
                style={{
                  zIndex: 100 - index,
                  transform: `translateY(${collapseTranslate}px)`,
                  opacity: opacity,
                  pointerEvents: pointerEvents,
                }}
              >
                <div className="h-12 w-12 relative">
                  {displayImg ? (
                    <img
                      src={displayImg}
                      alt={`Selected ${index + 1}`}
                      className="w-full h-full object-contain relative z-10"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-400 relative z-10">
                      ?
                    </div>
                  )}
                  {/* Quantity Badge - Top Left Absolute */}
                  <div className="absolute -top-3 -left-3 bg-black text-white text-[12px] w-6 h-6 rounded-full flex items-center justify-center font-black border-2 border-white shadow-md z-20">
                    {displayBadge}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List Controls */}
      <ListControls
        resultsCount={products.length}
        onSortChange={handleSort}
        onFilterToggle={handleFilter}
        products={initialProducts}
      />

      {/* Products Grid */}
      <section className="pb-8">
        <div className="container mx-auto">
          {/* Grid de produtos - 2 colunas mobile com altura uniforme */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6 auto-rows-fr">
            {(() => {
              const displayProducts = [...products];
              if (isSelectionMode && baseProductId) {
                const baseIdx = displayProducts.findIndex(
                  (p) => p.id === baseProductId,
                );
                if (baseIdx > 0) {
                  const [baseProduct] = displayProducts.splice(baseIdx, 1);
                  displayProducts.unshift(baseProduct);
                }
              }
              return displayProducts.map((product, index) => (
                <ProductCardTPS
                  key={product.id}
                  product={product}
                  priority={index < 4} // Priorizar primeiras 4 imagens
                />
              ));
            })()}
          </div>
        </div>
      </section>
    </Layout>
  );
}
