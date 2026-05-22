import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en-GB">
      <Head>
        <meta charSet="utf-8" />
        <meta name="robots" content="index,follow" />
        
        {/* Preconnect to optimize loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        
        {/* Fonts - UK friendly */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
        
        {/* PWA Meta Tags */}
        <meta name="application-name" content="Perfumes UK" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Perfumes UK" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/icons/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#ec7c0a" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* Icons */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Schema.org for Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Store",
              "name": "TPS UK",
              "description": "Premium fragrances and perfumes for the UK market",
              "url": process.env.NEXT_PUBLIC_SITE_URL,
              "currenciesAccepted": "USD",
              "paymentAccepted": ["Credit Card", "Debit Card", "PayPal"],
              "priceRange": "$10-$200",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "GB"
              }
            })
          }}
        />

        {/* Meta Pixel Code */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID_1 || '1201843863809192'}');
              fbq('track', 'PageView');
            `
          }}
        />
        <noscript>
          <img 
            height="1" 
            width="1" 
            style={{ display: 'none' }}
            src={`https://www.facebook.com/tr?id=${process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID_1 || '1201843863809192'}&ev=PageView&noscript=1`}
          />
        </noscript>

        {/* TikTok Pixel Code */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function (w, d, t) {
                try {
                  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
                  var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
                  ;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t,n.onerror=function(){console.warn('TikTok Pixel failed to load')};e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
                  
                  var pid1='${process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID_1 || ''}'; if(pid1) ttq.load(pid1);
                  var pid2='${process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID_2 || ''}'; if(pid2) ttq.load(pid2);
                  ttq.page();
                } catch (error) {
                  console.warn('TikTok Pixel initialization failed:', error);
                }
              }(window, document, 'ttq');
            `
          }}
        />

        {/* UTMify Pixel Script 1 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.pixelId = "${process.env.NEXT_PUBLIC_UTMIFY_PIXEL_ID || '68acccb997c810406d624392'}";
              var a = document.createElement("script");
              a.setAttribute("async", "");
              a.setAttribute("defer", "");
              a.setAttribute("src", "https://cdn.utmify.com.br/scripts/pixel/pixel.js");
              document.head.appendChild(a);
            `
          }}
        />

        {/* UTMify Pixel Script 2 (TikTok) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.tikTokPixelId = "${process.env.NEXT_PUBLIC_UTMIFY_TIKTOK_PIXEL_ID || '69ec0ebe445f98a508d463f9'}";
              var b = document.createElement("script");
              b.setAttribute("async", "");
              b.setAttribute("defer", "");
              b.setAttribute("src", "https://cdn.utmify.com.br/scripts/pixel/pixel-tiktok.js");
              document.head.appendChild(b);
            `
          }}
        />

        {/* UTMify Pixel Script 3 (Facebook) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.facebookPixelId = "${process.env.NEXT_PUBLIC_UTMIFY_FACEBOOK_PIXEL_ID || ''}";
              if (window.facebookPixelId) {
                var c = document.createElement("script");
                c.setAttribute("async", "");
                c.setAttribute("defer", "");
                c.setAttribute("src", "https://cdn.utmify.com.br/scripts/pixel/pixel-facebook.js");
                document.head.appendChild(c);
              }
            `
          }}
        />

        {/* UTMify UTM Script */}
        <script
          src="https://cdn.utmify.com.br/scripts/utms/latest.js"
          data-utmify-prevent-xcod-sck=""
          data-utmify-prevent-subids=""
          async
          defer
        />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}