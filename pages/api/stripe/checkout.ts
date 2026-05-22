import { NextApiRequest, NextApiResponse } from 'next';
import { stripe } from '../../../lib/stripe';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { 
      items, 
      success_url, 
      cancel_url, 
      shipping_options, 
      metadata,
      customAppearance,
      shipping,
      customerEmail,
      promocode,
      utmParams
    } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'Pelo menos um item é necessário' });
    }

    // Extrair dados do cliente para rastreamento (Facebook CAPI)
    const fbp = req.cookies._fbp || '';
    const fbc = req.cookies._fbc || '';
    const userAgent = req.headers['user-agent'] || '';
    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress || '';

    // Importa os mapeamentos de IDs
    const stripeVariantMapping = require('../../../data/stripe_variant_mapping.json');
    const stripeProductMapping = require('../../../data/stripe_product_mapping.json');
    
    // Formata os itens para o formato esperado pelo Stripe
    const line_items = items.map((item: any) => {
      // Tenta obter o ID de preço do Stripe de várias maneiras
      let priceId = item.stripeId || item.price_id;
      
      // Se o ID não for um ID de preço do Stripe válido, tenta encontrar no mapeamento
      if (priceId && !priceId.startsWith('price_')) {
        // Tenta encontrar no mapeamento de variantes
        const variantPriceId = stripeVariantMapping[priceId];
        if (variantPriceId) {
          priceId = variantPriceId;
        } 
        // Tenta encontrar no mapeamento de produtos
        else if (priceId in stripeProductMapping) {
          priceId = stripeProductMapping[priceId].price_id;
        }
        // Se ainda não encontrou, tenta usar o ID como chave direta
        else if (item.id) {
          const idStr = item.id.toString();
          if (stripeVariantMapping[idStr]) {
            priceId = stripeVariantMapping[idStr];
          } else if (idStr in stripeProductMapping) {
            priceId = stripeProductMapping[idStr].price_id;
          }
        }
      }
      
      if (!priceId || !priceId.startsWith('price_')) {
        throw new Error(`ID de preço do Stripe inválido ou ausente: ${item.id || priceId || 'não fornecido'}`);
      }
      
      return {
        price: priceId,
        quantity: item.quantity,
      };
    });

    // Configurações para a sessão de checkout
    const sessionConfig: any = {
      payment_method_types: [
        'card',           // Cartões de crédito/débito
        'bacs_debit',     // Débito direto BACS (popular no Reino Unido)
        'bancontact',     // Bancontact (aceito no Reino Unido)
        'giropay',        // Giropay
        'ideal',          // iDEAL
        'sofort',         // Sofort
        'p24',            // Przelewy24
        'eps',            // EPS
        'fpx',            // FPX
        'grabpay',        // GrabPay
        'afterpay_clearpay' // Afterpay/Clearpay (muito popular no Reino Unido)
      ],
      line_items,
      mode: 'payment',
      success_url: success_url || `${req.headers.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${req.headers.origin}/checkout/cancel`,
      shipping_address_collection: {
        allowed_countries: ['US'], // Países permitidos para entrega
      },
      shipping_options: shipping_options || [],
      metadata: {
        ...metadata,
        // Adicionar parâmetros UTM aos metadados para rastreamento
        ...(utmParams && {
          utm_source: utmParams.utm_source,
          utm_medium: utmParams.utm_medium,
          utm_campaign: utmParams.utm_campaign,
          utm_term: utmParams.utm_term,
          utm_content: utmParams.utm_content,
        }),
        fbp,
        fbc,
        user_agent: userAgent.substring(0, 500), // Stripe tem limite de 500 chars
        client_ip: clientIp,
      },
      // Configuração para checkout com redirecionamento
      ui_mode: 'hosted',
      client_reference_id: metadata?.orderId || undefined,
      custom_text: customAppearance?.customText || undefined
    };

    // Adicionar configurações personalizadas se fornecidas
    if (customerEmail) {
      sessionConfig.customer_email = customerEmail;
    }

    if (promocode) {
      sessionConfig.allow_promotion_codes = true;
    }

    // Configurações de aparência personalizada
    if (customAppearance) {
      sessionConfig.custom_appearance = {
        theme: customAppearance.theme || 'stripe',
        variables: {
          colorPrimary: customAppearance.primaryColor || '#6772e5',
          colorBackground: '#ffffff',
          colorText: '#1A1A1A',
          colorDanger: '#df1b41',
          fontFamily: 'Ideal Sans, system-ui, sans-serif',
          spacingUnit: '4px',
          borderRadius: '4px',
        },
        buttons: {
          color: customAppearance.buttonColor || 'black',
          style: 'filled',
        },
      };
    }

    // Cria a sessão de checkout
    const session = await stripe.checkout.sessions.create(sessionConfig);

    // Retornar o client_secret para checkout incorporado
    return res.status(200).json({ 
      sessionId: session.id,
      client_secret: session.client_secret,
      url: session.url 
    });
  } catch (error: any) {
    console.error('Erro ao criar sessão de checkout:', error);
    return res.status(500).json({ error: error.message });
  }
}