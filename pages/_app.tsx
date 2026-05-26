import "@/styles/globals.css";
import "@/styles/stripe-checkout.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { CartProvider } from "@/contexts/CartContext";
import AppLayout from "@/components/layout/AppLayout";
import { usePixel } from "@/hooks/usePixel";
import { useUTM } from "@/hooks/useUTM";
import { useRouter } from "next/router";
import TikTokPixel from "@/components/TikTokPixel";
import { appendUTMsToUrl } from "@/utils/utm-helper";
import { useEffect } from "react";

export default function App({ Component, pageProps }: AppProps) {
  // Inicializa o rastreamento de página
  usePixel(true);

  // Inicializa o rastreamento de UTMs em todas as páginas
  useUTM();

  const router = useRouter();

  // Efeito para garantir que UTMs persistam na URL em todas as navegações
  useEffect(() => {
    if (typeof window !== "undefined") {
      const currentUrl = router.asPath;
      const urlWithUtms = appendUTMsToUrl(currentUrl);

      // Se a URL mudou (porque UTMs foram adicionados), atualiza sem adicionar ao histórico
      if (urlWithUtms !== currentUrl) {
        router.replace(urlWithUtms, undefined, { shallow: true });
      }
    }
  }, [router.asPath]);

  const isQuizPage = router.pathname === "/quiz";
  const isCheckoutPage = router.pathname.startsWith("/checkout");

  return (
    <CartProvider>
      <TikTokPixel />
      <Head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, viewport-fit=cover"
        />
        <meta name="theme-color" content="#ee7d1b" />
        <link rel="icon" href="/images/logo.webp" />
      </Head>
      <AppLayout hideBottomNavigation={isQuizPage || isCheckoutPage}>
        <Component {...pageProps} />
      </AppLayout>
    </CartProvider>
  );
}
