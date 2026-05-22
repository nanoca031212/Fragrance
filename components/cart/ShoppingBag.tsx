import Image from 'next/image'
import { X, Minus, Plus, Trash2 } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useRouter } from 'next/router'
import { validateAndFixCartItem } from '@/lib/cacheCleanup'
import { trackInitiateCheckout } from '@/lib/tiktokEvents'

interface ShoppingBagProps {
  isOpen: boolean
  onClose: () => void
}

export default function ShoppingBag({ isOpen, onClose }: ShoppingBagProps) {
  const { items, removeItem, updateQuantity, total, totalOriginal } = useCart()
  const router = useRouter()

  const panelClasses = `fixed bottom-0 left-0 right-0 h-[85vh] bg-white shadow-xl rounded-t-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-y-0' : 'translate-y-full'}`

  const overlayClasses = `fixed inset-0 bg-black transition-opacity duration-300 ${isOpen ? 'bg-opacity-50' : 'bg-opacity-0 pointer-events-none'
    }`

  const handleCheckout = () => {
    try {
      if (items.length === 0) {
        console.warn('Carrinho vazio');
        return;
      }

      console.log('🛒 Iniciando checkout...');

      // Validar e corrigir IDs obsoletos antes do checkout
      const validatedItems = items
        .map(item => validateAndFixCartItem(item))
        .filter(item => item !== null); // Remover itens inválidos

      if (validatedItems.length === 0) {
        console.error('❌ Todos os itens do carrinho têm IDs obsoletos');
        alert('Erro: Itens do carrinho estão desatualizados. Por favor, adicione os produtos novamente.');
        return;
      }

      // Redirecionar para a página de checkout (Embedded Checkout)
      trackInitiateCheckout({
        items: items.map(item => ({
          id: item.id,
          name: item.title,
          price: item.price,
          quantity: item.quantity
        })),
        total: total
      });

      onClose(); // Fechar o carrinho
      router.push(`/checkout${window.location.search}`);

    } catch (error) {
      console.error('❌ Erro no checkout:', error);
      alert('Erro ao processar checkout. Tente novamente.');
    }
  }

  return (
    <div className={`fixed inset-0 z-[100] overflow-hidden ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      {/* Overlay */}
      <div
        className={overlayClasses}
        onClick={onClose}
      />

      {/* Cart Panel */}
      <div className={panelClasses}>
        {/* Handle for dragging */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-2" />

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2">
          <h2 className="text-xl font-bold">SHOPPING BAG</h2>
          <button onClick={onClose} className="p-2">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Cart Items - scrollable */}
        <div className="flex-1 overflow-y-auto px-4 min-h-0">
          {items.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Your shopping bag is empty</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex gap-4 py-4 border-b">
                {/* Product Image */}
                <div className="relative w-20 h-20 flex-shrink-0">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-contain"
                  />
                </div>

                {/* Product Info */}
                <div className="flex-grow min-w-0">
                  <h3 className="text-sm font-medium truncate">{item.title}</h3>
                  <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm font-bold text-black">${(item.price * item.quantity).toFixed(2)}</p>
                    <span className="text-xs line-through text-gray-400">${((item.originalPrice || 169.99) * item.quantity).toFixed(2)}</span>
                  </div>

                  {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className={`p-1.5 rounded border transition-colors ${item.quantity === 1 ? 'text-red-500 border-red-100 hover:bg-red-50' : 'hover:bg-gray-100'}`}
                      >
                        {item.quantity === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                      </button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="p-1 hover:bg-gray-100 rounded border"
                      disabled={item.quantity >= 10}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-xs font-bold uppercase tracking-tighter text-red-500 hover:text-red-700 self-start mt-1 px-1 py-0.5"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer - always visible */}
        <div className="border-t px-4 pb-6 pt-3 bg-white flex-shrink-0">
          <div className="mt-4 space-y-1.5">
            <div className="flex justify-between items-center text-xs text-gray-500">
              <span>Total</span>
              <span className="line-through">${totalOriginal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-black font-medium font-sans">
              <span>Bundle savings</span>
              <span>-${(totalOriginal - total).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-100">
              <span className="text-sm font-bold uppercase tracking-tight">Final Price</span>
              <span className="text-xl font-bold text-gray-900">${total.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleCheckout}
            className={`w-full bg-black text-white py-3 rounded-full font-bold text-center mt-6 transition-all active:scale-95
              ${items.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-900 shadow-lg shadow-gray-200'}`}
            disabled={items.length === 0}
          >
            CHECKOUT • ${total.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  )
}