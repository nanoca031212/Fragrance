'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { usePixel } from '@/hooks/usePixel'
import { useUTM } from '@/hooks/useUTM'
import { validateAndFixCartItem, initializeAutoCleanup } from '@/lib/cacheCleanup'
import stripeVariantMapping from '../data/stripe_variant_mapping.json'
import stripeProductMapping from '../data/stripe_product_mapping.json'

interface CartItem {
  id: number
  handle: string
  stripeId?: string // ID do preço no Stripe
  title: string
  subtitle: string
  price: number
  image: string
  quantity: number
  originalPrice?: number
  regularPrice?: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  removeItem: (id: number) => void
  updateQuantity: (id: number, quantity: number) => void
  clearCart: () => void
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  total: number
  totalOriginal: number
  initiateCheckout: () => void
  utm_campaign: string | null
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const pixel = usePixel()
  const { utmParams } = useUTM()

  const removeFromBundleState = (id: number) => {
    try {
      const storedBundleState = localStorage.getItem('bundleState')
      if (!storedBundleState) return

      const bundleState = JSON.parse(storedBundleState)
      if (!bundleState || !Array.isArray(bundleState.selections)) return

      const nextSelections = bundleState.selections.map((selection: CartItem | null) =>
        selection?.id === id ? null : selection
      )

      const hasChanged = nextSelections.some(
        (selection: CartItem | null, index: number) =>
          selection !== bundleState.selections[index]
      )

      if (!hasChanged) return

      localStorage.setItem(
        'bundleState',
        JSON.stringify({ ...bundleState, selections: nextSelections })
      )
      window.dispatchEvent(new Event('bundleStateUpdated'))
    } catch (error) {
      console.error('Erro ao sincronizar remoção do bundle:', error)
    }
  }

  // Inicializar limpeza automática de cache quando o componente monta
  useEffect(() => {
    initializeAutoCleanup()
  }, [])

  const addItem = (newItem: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    // Validar e corrigir IDs obsoletos antes de adicionar
    const validatedItem = validateAndFixCartItem(newItem)
    if (!validatedItem) {
      console.error('Item com ID obsoleto rejeitado:', newItem)
      return
    }

    // Se o item já tem stripeId, usar ele diretamente
    let stripeId = validatedItem.stripeId || ''

    // Se não tem stripeId, tentar obter do mapeamento
    if (!stripeId) {
      const handle = validatedItem.handle || ''

      // Verificar primeiro no mapeamento de variantes (que é um objeto simples)
      stripeId = stripeVariantMapping[handle as keyof typeof stripeVariantMapping] || ''

      // Se não encontrar, verificar no mapeamento de produtos (que tem estrutura diferente)
      if (!stripeId && handle in stripeProductMapping) {
        const productMapping = stripeProductMapping[handle as keyof typeof stripeProductMapping]
        if (typeof productMapping === 'object' && productMapping !== null && 'price_id' in productMapping) {
          stripeId = productMapping.price_id
        }
      }
    }

    // Item com ID do Stripe
    const itemWithStripeId = {
      ...validatedItem,
      stripeId
    }

    // Rastrear evento AddToCart ANTES da função de setState
    pixel.addToCart({
      value: itemWithStripeId.price * quantity,
      currency: 'USD',
      content_name: itemWithStripeId.title,
      content_ids: [itemWithStripeId.id.toString()]
    })

    setItems(prevItems => {
      const existingItem = prevItems.find(item => item.id === itemWithStripeId.id)
      let updatedItems;

      if (existingItem) {
        updatedItems = prevItems.map(item =>
          item.id === itemWithStripeId.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        updatedItems = [...prevItems, { ...itemWithStripeId, quantity }];
      }

      return recalculateBundlePrices(updatedItems);
    })
  }

  const recalculateBundlePrices = (items: CartItem[]): CartItem[] => {
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const promo3Price = 69.99 / 3;   // $23.33 each — 3-unit bundle
    const promo6Price = 119.99 / 6;  // ~$20 each — 6-unit bundle

    if (totalQuantity <= 2) {
      return items.map(item => ({ ...item, price: item.regularPrice || item.price }));
    }

    if (totalQuantity === 3) {
      return items.map(item => ({ ...item, price: promo3Price }));
    }

    if (totalQuantity === 4 || totalQuantity === 5) {
      // Units 1-3 at promo3Price; units 4 and 5 at full (regular) price.
      let remainingPromo = 3;
      return items.map(item => {
        const regularPrice = item.regularPrice || item.price;
        if (remainingPromo >= item.quantity) {
          remainingPromo -= item.quantity;
          return { ...item, price: promo3Price };
        } else if (remainingPromo > 0) {
          const unitsAtPromo = remainingPromo;
          const unitsAtFull = item.quantity - unitsAtPromo;
          remainingPromo = 0;
          const blendedPrice = (unitsAtPromo * promo3Price + unitsAtFull * regularPrice) / item.quantity;
          return { ...item, price: blendedPrice };
        } else {
          return { ...item, price: regularPrice };
        }
      });
    }

    if (totalQuantity >= 6) {
      // First 6 units at promo6Price; units 7+ at full price.
      let remainingPromo = 6;
      return items.map(item => {
        const regularPrice = item.regularPrice || item.price;
        if (remainingPromo >= item.quantity) {
          remainingPromo -= item.quantity;
          return { ...item, price: promo6Price };
        } else if (remainingPromo > 0) {
          const unitsAtPromo = remainingPromo;
          const unitsAtFull = item.quantity - unitsAtPromo;
          remainingPromo = 0;
          const blendedPrice = (unitsAtPromo * promo6Price + unitsAtFull * regularPrice) / item.quantity;
          return { ...item, price: blendedPrice };
        } else {
          return { ...item, price: regularPrice };
        }
      });
    }

    return items;
  };

  const removeItem = (id: number) => {
    removeFromBundleState(id)
    setItems(prevItems => {
      const filtered = prevItems.filter(item => item.id !== id);
      return recalculateBundlePrices(filtered);
    });
  }

  const updateQuantity = (id: number, delta: number) => {
    setItems(prevItems => {
      const itemToUpdate = prevItems.find(item => item.id === id);
      if (!itemToUpdate) return prevItems;

      const newQuantity = Math.max(0, Math.min(10, itemToUpdate.quantity + delta));
      if (newQuantity <= 0) {
        removeFromBundleState(id)
        const filtered = prevItems.filter(item => item.id !== id);
        return recalculateBundlePrices(filtered);
      }

      const updatedItems = prevItems.map(item => {
        if (item.id === id) {
          return { ...item, quantity: newQuantity };
        }
        return item;
      });

      return recalculateBundlePrices(updatedItems);
    });
  }

  const clearCart = () => {
    setItems([])
  }

  const initiateCheckout = async () => {
    // Redirecionar para a página interna de checkout mantendo as UTMs na URL
    window.location.href = `/checkout${window.location.search}`
  }

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isOpen,
        setIsOpen,
        total,
        totalOriginal: items.reduce((sum, item) => sum + ((item.originalPrice || 169.99) * item.quantity), 0),
        initiateCheckout,
        utm_campaign: utmParams.utm_campaign || null
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
