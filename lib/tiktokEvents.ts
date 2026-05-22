// 1. ViewContent — disparar na página de produto
export function trackViewContent(product: {
  id: string | number;
  name: string;
  price: number;
}) {
  if (typeof window === 'undefined' || !window.ttq) return;
  window.ttq.track('ViewContent', {
    contents: [{ content_id: product.id, content_name: product.name, content_type: 'product', price: product.price }],
    value: product.price,
    currency: 'USD',
  });
}

// 2. AddToCart — disparar ao clicar em "SELECT"
export function trackAddToCart(product: {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
}) {
  if (typeof window === 'undefined' || !window.ttq) return;
  window.ttq.track('AddToCart', {
    contents: [{ content_id: product.id, content_name: product.name, content_type: 'product', quantity: product.quantity, price: product.price }],
    value: product.price * product.quantity,
    currency: 'USD',
  });
}

// 3. InitiateCheckout — disparar ao clicar em "CHECKOUT"
export function trackInitiateCheckout(cart: {
  items: Array<{ id: string | number; name: string; price: number; quantity: number }>;
  total: number;
}) {
  if (typeof window === 'undefined' || !window.ttq) return;
  window.ttq.track('InitiateCheckout', {
    contents: cart.items.map(i => ({ content_id: i.id, content_name: i.name, content_type: 'product', quantity: i.quantity, price: i.price })),
    value: cart.total,
    currency: 'USD',
  });
}

// 4. CompletePayment — disparar na página de confirmação de pedido
// Deve usar o mesmo nome que o CAPI (CompletePayment) para deduplicação funcionar.
export function trackCompletePayment(order: {
  items: Array<{ id: string | number; name: string; price: number; quantity: number }>;
  total: number;
  orderId?: string;
}) {
  if (typeof window === 'undefined' || !window.ttq) return;
  window.ttq.track('CompletePayment', {
    contents: order.items.map(i => ({ content_id: i.id, content_name: i.name, content_type: 'product', quantity: i.quantity, price: i.price })),
    value: order.total,
    currency: 'USD',
  }, {
    event_id: order.orderId,
  });
}

// 5. Search — disparar quando o usuário fizer uma busca
export function trackSearch(query: string) {
  if (typeof window === 'undefined' || !window.ttq) return;
  window.ttq.track('Search', { query });
}
