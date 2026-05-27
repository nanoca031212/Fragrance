import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { Star } from "lucide-react";
import { Product } from "@/types/product";
import { usePixel } from "@/hooks/usePixel";
import { useCart } from "@/contexts/CartContext";

interface ProductCardTPSProps {
  product: Product;
  className?: string;
  priority?: boolean;
}

export default function ProductCardTPS({
  product,
  className = "",
  priority = false,
}: ProductCardTPSProps) {
  const [imageError, setImageError] = useState(false);
  const [selectionIndices, setSelectionIndices] = useState<string>("");
  const pixel = usePixel();
  const [isBundleEmpty, setIsBundleEmpty] = useState(true);
  const { addItem, clearCart, setIsOpen } = useCart();

  const calculateSelectionCount = () => {
    try {
      const stored = localStorage.getItem("bundleState");
      if (stored) {
        const state = JSON.parse(stored);
        if (state && Array.isArray(state.selections)) {
          // Get only non-null selections to determine continuous order
          const nonNullSelections = state.selections.filter((p: any) => p);

          setIsBundleEmpty(nonNullSelections.length === 0);

          const indices = nonNullSelections
            .map((p: any, idx: number) =>
              p.id === product.id ? idx + 1 : null,
            )
            .filter((idx: number | null) => idx !== null) as number[];

          setSelectionIndices(indices.join(", "));
        } else {
          setIsBundleEmpty(true);
          setSelectionIndices("");
        }
      } else {
        setIsBundleEmpty(true);
        setSelectionIndices("");
      }
    } catch (e) {
      setIsBundleEmpty(true);
      setSelectionIndices("");
    }
  };

  useEffect(() => {
    calculateSelectionCount();
    const handleBundleChange = () => calculateSelectionCount();
    window.addEventListener("bundleStateUpdated", handleBundleChange);
    return () =>
      window.removeEventListener("bundleStateUpdated", handleBundleChange);
  }, [product.id]);

  // Extrair URL da imagem principal
  const getMainImageUrl = () => {
    if (Array.isArray(product.images)) {
      return product.images[0] || "/images/placeholder-product.jpg";
    } else if (
      product.images &&
      typeof product.images === "object" &&
      "main" in product.images
    ) {
      return product.images.main[0] || "/images/placeholder-product.jpg";
    }
    return "/images/placeholder-product.jpg";
  };

  const imageUrl = getMainImageUrl();
  const brands = product.brands || [product.brand] || ["Unknown"];
  const primaryBrand = brands[0];

  // Preços
  const formatPrice = (price: string | number) => {
    if (typeof price === "string") {
      return parseFloat(price).toFixed(2);
    }
    return price.toFixed(2);
  };

  const hasDiscount = product.price.discount_percent > 0;

  const getStableValue = (seed: string, min: number, max: number, step = 1) => {
    const hash = seed.split("").reduce((acc, char, index) => {
      return acc + char.charCodeAt(0) * (index + 1);
    }, 0);
    const steps = Math.floor((max - min) / step);
    return min + (hash % (steps + 1)) * step;
  };

  // Valores estaveis por produto para evitar variacao a cada render.
  const stableSeed = `${product.id}-${product.handle}-${product.title}`;
  const rating = getStableValue(`${stableSeed}-rating`, 4, 5, 0.1);
  const purchases = getStableValue(`${stableSeed}-purchases`, 500, 1000);
  const renderStars = () => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${i < Math.round(rating) ? "fill-[#d89c10] text-[#d89c10]" : "text-[#d89c10]"}`}
      />
    ));
  };

  const router = useRouter();
  const { bundleSlot, returnTo } = router.query;
  const isSelectionMode =
    typeof bundleSlot === "string" && typeof returnTo === "string";

  // Função para rastrear visualização do produto
  const handleViewContent = () => {
    pixel.viewContent({
      content_type: "product",
      content_ids: [product.id.toString()],
      content_name: product.title,
      content_category: product.tags.join(","),
      value: parseFloat(product.price.regular.toString()),
      currency: "USD",
    });
  };

  const handleCardClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    handleViewContent();

    try {
      const stored = localStorage.getItem("bundleState");
      let state = stored
        ? JSON.parse(stored)
        : { packType: "trio", selections: [null, null, null] };
      if (!state.selections) state.selections = [null, null, null];

      if (state.packType === "single") {
        state.packType = "trio";
        while (state.selections.length < 3) state.selections.push(null);
      }

      if (isSelectionMode && bundleSlot !== undefined) {
        const slotIndex = parseInt(bundleSlot as string);
        state.selections[slotIndex] = product;
      } else {
        let pCount =
          state.packType === "trio" ? 3 : state.packType === "hexa" ? 6 : 3;

        let filledCount = state.selections.filter(
          (p: any) => p !== null,
        ).length;
        if (filledCount >= 3 && state.packType === "trio") {
          state.packType = "hexa";
          while (state.selections.length < 6) state.selections.push(null);
          pCount = 6;
        }

        let nextEmptySlot = -1;
        for (let i = 0; i < pCount; i++) {
          if (!state.selections[i]) {
            nextEmptySlot = i;
            break;
          }
        }

        if (nextEmptySlot !== -1) {
          state.selections[nextEmptySlot] = product;
        } else if (pCount === 6) {
          // Reset bundle if they add a 7th item (lose the discount)
          state.packType = "trio";
          state.selections = [product, null, null];
        }
      }

      localStorage.setItem("bundleState", JSON.stringify(state));
      window.dispatchEvent(new Event("bundleStateUpdated"));

      // Always update cart silently when selecting on the homepage
      const finalSelections: any[] = state.selections || [];
      const finalCount = finalSelections.filter((p: any) => p !== null).length;
      if (!isSelectionMode) {
        await addBundleToCart(finalSelections, state.packType);

        if (finalCount === 3 && state.packType === "trio") {
          const firstProduct = finalSelections[0];
          if (firstProduct) {
            router.push(`/products/${firstProduct.handle}?scroll=bundle`);
            return;
          }
        }

        if (finalCount === 6) {
          setIsOpen(true);
        }
      }

      if (isSelectionMode && returnTo) {
        let nextEmptySlotAfter = -1;
        const pCount =
          state.packType === "trio" ? 3 : state.packType === "hexa" ? 6 : 3;
        for (let i = 0; i < pCount; i++) {
          if (!state.selections[i]) {
            nextEmptySlotAfter = i;
            break;
          }
        }

        let updatedReturnTo = returnTo as string;
        if (bundleSlot === "0") {
          updatedReturnTo = `/products/${product.handle}`;
        }

        if (nextEmptySlotAfter !== -1) {
          router.push(
            `/?bundleSlot=${nextEmptySlotAfter}&returnTo=${encodeURIComponent(updatedReturnTo)}`,
            undefined,
            { shallow: true, scroll: false },
          );
        } else {
          const separator = updatedReturnTo.includes("?") ? "&" : "?";
          router.push(`${updatedReturnTo}${separator}scroll=bundle`);
        }
      }
    } catch (err) {}
  };

  const handleRemoveClick = async (e: React.MouseEvent) => {
    e.preventDefault();

    try {
      const stored = localStorage.getItem("bundleState");
      if (stored) {
        const state = JSON.parse(stored);
        if (state && Array.isArray(state.selections)) {
          let removed = false;
          // Remove highest index instance of this product
          for (let i = state.selections.length - 1; i >= 0; i--) {
            if (state.selections[i] && state.selections[i].id === product.id) {
              state.selections[i] = null;
              removed = true;
              break;
            }
          }

          if (removed) {
            localStorage.setItem("bundleState", JSON.stringify(state));
            window.dispatchEvent(new Event("bundleStateUpdated"));

            // Sync cart: rebuild with remaining selections and correct prices
            if (!isSelectionMode) {
              await addBundleToCart(state.selections, state.packType);
            }

            if (isSelectionMode && returnTo) {
              let nextEmptySlot = -1;
              const pCount =
                state.packType === "trio"
                  ? 3
                  : state.packType === "hexa"
                    ? 6
                    : 1;
              for (let i = 0; i < pCount; i++) {
                if (!state.selections[i]) {
                  nextEmptySlot = i;
                  break;
                }
              }

              if (nextEmptySlot !== -1) {
                router.push(
                  `/?bundleSlot=${nextEmptySlot}&returnTo=${encodeURIComponent(returnTo as string)}`,
                  undefined,
                  { shallow: true, scroll: false },
                );
              }
            }
          }
        }
      }
    } catch (err) {}
  };

  const addBundleToCart = async (selections: any[], packType: string) => {
    try {
      const nonNullSelections = selections.filter((p: any) => p !== null);
      if (nonNullSelections.length === 0) return;

      clearCart();

      const stripeProductMapping =
        await import("@/data/stripe_product_mapping.json");
      const productMapping = stripeProductMapping.default as Record<
        string,
        { price_id: string }
      >;

      const count = nonNullSelections.length;

      for (let i = 0; i < count; i++) {
        const frag = nonNullSelections[i];
        if (!frag) continue;

        const stripeId = productMapping[frag.handle]?.price_id || "";
        const regularPrice = Number(frag.price?.regular) || 26.0;
        const originalPrice =
          Number(frag.price?.original_price) || regularPrice * 2;

        let itemPrice: number;
        let itemOriginalPrice: number;

        if (count <= 2) {
          // 1-2 perfumes: preço cheio
          itemPrice = regularPrice;
          itemOriginalPrice = originalPrice;
        } else if (count === 3) {
          itemPrice = 99.99 / 3;
          itemOriginalPrice = regularPrice;
        } else if (count >= 4 && count < 6) {
          if (i < 3) {
            itemPrice = 99.99 / 3;
            itemOriginalPrice = regularPrice;
          } else {
            itemPrice = regularPrice;
            itemOriginalPrice = originalPrice;
          }
        } else if (count === 6) {
          itemPrice = 179.99 / 6;
          itemOriginalPrice = regularPrice;
        } else {
          // 7+ units: first 6 at bundle price, rest at full price
          itemPrice = i < 6 ? 179.99 / 6 : regularPrice;
          itemOriginalPrice = i < 6 ? regularPrice : originalPrice;
        }

        const cartItem = {
          id: frag.id,
          handle: frag.handle,
          stripeId,
          title: frag.title,
          subtitle: "Eau de Parfum Spray - 100ML",
          price: itemPrice,
          originalPrice: itemOriginalPrice,
          regularPrice,
          image: Array.isArray(frag.images)
            ? frag.images[0]
            : (frag.images as any)?.main?.[0] ||
              "/images/placeholder-product.jpg",
        };
        addItem(cartItem, 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFinalizarPedido = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const stored = localStorage.getItem("bundleState");
      if (!stored) {
        router.push("/checkout");
        return;
      }
      const state = JSON.parse(stored);
      await addBundleToCart(state.selections || [], state.packType);
      setIsOpen(true);
    } catch (err) {
      console.error(err);
      router.push("/checkout");
    }
  };

  const CardWrapper = isSelectionMode ? "button" : Link;
  const cardProps = isSelectionMode
    ? {
        onClick: handleCardClick,
        className: "flex flex-col flex-grow text-left",
      }
    : {
        href:
          router.pathname === "/"
            ? `/products/${product.handle}?reset=true`
            : `/products/${product.handle}`,
        onClick: handleViewContent,
        className: "flex flex-col flex-grow",
        suppressHydrationWarning: true,
      };

  return (
    <div className={`bg-white flex flex-col h-full ${className}`}>
      {/* Product Link - flex container para espaçamento uniforme */}
      <CardWrapper {...(cardProps as any)}>
        {/* Image Container */}
        <div className="relative bg-white mb-3">
          {selectionIndices && isSelectionMode && (
            <div className="absolute -top-2 -right-2 bg-black text-white w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shadow-md z-20 border-2 border-white">
              {selectionIndices}
            </div>
          )}
          {/* Viewers Counter */}
          {product.popularity > 0 && (
            <div className="absolute top-2 left-2 bg-white/80 backdrop-blur-sm text-xs py-1 px-2 rounded-full z-10">
              {product.popularity} others viewed
              <br />
              in last 8 hrs
            </div>
          )}

          {/* Product Image */}
          {!imageError ? (
            <div className="aspect-square relative">
              <Image
                src={imageUrl}
                alt={product.title}
                fill
                className="object-contain"
                style={
                  product.image_scale
                    ? {
                        transform: `scale(${product.image_scale})`,
                        transition: "transform 0.2s",
                      }
                    : undefined
                }
                priority={priority}
                onError={() => setImageError(true)}
                sizes="(max-width: 640px) 50vw, 33vw"
              />
            </div>
          ) : (
            <div className="aspect-square flex items-center justify-center bg-gray-50">
              <span className="text-4xl text-gray-300">?</span>
            </div>
          )}

          {/* Promotional Banner */}

          {/* Badge - Canto superior direito */}

          {/* New/Tester Badge */}
          {product.new_arrival && !hasDiscount && (
            <div className="absolute top-2 right-2 bg-white border border-black rounded-full w-12 h-12 flex items-center justify-center">
              <span className="text-xs font-bold">NEW</span>
            </div>
          )}

          {/* Free Tester Badge */}
          {product.tags?.includes("tester") && (
            <div className="absolute top-2 right-2 bg-white border border-black rounded-full w-16 h-16 flex items-center justify-center">
              <div className="text-center">
                <div className="text-xs font-bold">FREE</div>
                <div className="text-xs font-bold">TESTER</div>
              </div>
            </div>
          )}
        </div>

        {/* Linha decorativa */}

        {/* Product Info - flex grow para empurrar botão para baixo */}
        <div className="text-center  flex flex-col  flex-grow">
          {/* Product Name - full title from folder name */}
          <h3 className="text-sm font-bold text-black leading-tight text-center px-1 truncate sm:whitespace-normal sm:overflow-visible w-full block">
            {product.title}
          </h3>

          {/* Product Type */}
          <div className="text-xs mt-1 font-thin text-black">
            {product.is_combo ? "Eau de Parfum Spray" : "Eau de Parfum Spray"} -
            100ML
          </div>

          {/* Spacer para empurrar conteúdo para baixo */}
          <div className="flex-grow"></div>

          {/* Pricing */}
          <div className="space-y-1 mx-auto">
            {/* Price Range */}
            <div className="flex flex-col">
              <div className="flex  flex-col-2 items-center justify-center gap-2 text-sm">
                <div>
                  <span className="text-black uppercase text-2xl mt-1 font-semibold">
                    ${formatPrice(product.price.regular)}
                  </span>
                </div>
                <span className="text-gray-700 line-through text-xs">
                  ${formatPrice(product.price.original_price || 169.99)}
                </span>
              </div>
            </div>

            {/* Sponsored Tag if applicable */}
            {product.featured && (
              <div className="text-xs text-gray-500">Sponsored</div>
            )}
          </div>
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-[#6b7280]">
            <div className="flex items-center gap-0.5">{renderStars()}</div>
            <span>({rating.toFixed(1)})</span>
          </div>
        </div>
      </CardWrapper>

      {/* CTA Button - sempre na parte inferior */}
      <div className="mt-4 flex flex-col gap-2">
        <div className="flex gap-2">
          <button
            onClick={handleCardClick}
            className="flex-1 bg-black border border-solid border-black rounded-[4px] text-white py-3 px-2 text-sm font-bold uppercase tracking-wide hover:bg-gray-900 transition-colors duration-200 text-center"
          >
            SELECT
          </button>
          {selectionIndices !== "" && (
            <button
              onClick={handleRemoveClick}
              className="flex-1 bg-[#d4d4d4] rounded-[4px] text-black py-3 px-2 text-sm font-bold uppercase tracking-wide hover:bg-gray-300 transition-colors duration-200 text-center"
            >
              REMOVE
            </button>
          )}
        </div>
        {!isSelectionMode &&
          (isBundleEmpty ? (
            <Link
              href={
                router.pathname === "/"
                  ? `/products/${product.handle}?reset=true`
                  : `/products/${product.handle}`
              }
              className="block w-full bg-white !border !border-solid !border-black rounded-[4px] text-black font-medium py-3 text-x1 uppercase tracking-wide
                       hover:bg-gray-900 hover:text-white  transition-colors duration-300 text-center"
              onClick={handleViewContent}
              suppressHydrationWarning
            >
              VIEW Promotion
            </Link>
          ) : (
            <button
              onClick={handleFinalizarPedido}
              className="block w-full bg-white !border !border-solid !border-black rounded-[4px] text-black font-medium py-3 text-x1 uppercase tracking-wide
                       hover:bg-gray-900 hover:text-white  transition-colors duration-300 text-center"
            >
              finish order
            </button>
          ))}
      </div>
    </div>
  );
}
