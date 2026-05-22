import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";
import { useCart } from "@/contexts/CartContext";
import { useUTM } from "@/hooks/useUTM";
import { usePixel } from "@/hooks/usePixel";
import Head from "next/head";
import { useRouter } from "next/router";
import HeaderTPS from "@/components/layout/HeaderTPS";
import FooterTPS from "@/components/layout/FooterTPS";

import { Timer, Info, ShoppingBag } from "lucide-react";

// Make sure to call loadStripe outside of a component’s render to avoid
// recreating the Stripe object on every render.
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string,
);

import { getPromoTarget, calculateTimeLeft } from "@/lib/timer";

export default function CheckoutPage() {
  const { items, total, totalOriginal } = useCart();
  const { utmParams, isLoaded: utmLoaded } = useUTM();
  const pixel = usePixel();
  const [clientSecret, setClientSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"contact" | "payment">("contact");
  const [contactForm, setContactForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
  });
  const router = useRouter();
  const [showPromoInfo, setShowPromoInfo] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Synchronized Countdown timer logic
  useEffect(() => {
    const target = getPromoTarget();

    // Initial calculation
    setTimeLeft(calculateTimeLeft(target));

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft(target);
      setTimeLeft(remaining);

      if (
        remaining.days === 0 &&
        remaining.hours === 0 &&
        remaining.minutes === 0 &&
        remaining.seconds === 0
      ) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Create a Checkout Session only when step is payment AND UTMs are loaded
    if (
      items.length > 0 &&
      !clientSecret &&
      !loading &&
      step === "payment" &&
      utmLoaded
    ) {
      setLoading(true);
      fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: items.map((item) => ({
            id: item.id?.toString(),
            stripeId: item.stripeId,
            quantity: item.quantity,
            title: item.title,
            image: item.image,
            price: item.price,
            handle: item.handle,
          })),
          utmParams: utmParams, // Send all UTMs
          customerEmail: contactForm.email || undefined,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.clientSecret) {
            setClientSecret(data.clientSecret);
          } else if (data.error) {
            setError(data.error);
            console.error("Error creating checkout session:", data);
          }
        })
        .catch((err) => {
          setError("Failed to initialize checkout");
          console.error(err);
        })
        .finally(() => setLoading(false));
    }
  }, [items, utmParams, step, utmLoaded]);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Atualizar dados do usuário no Pixel (Advanced Matching)
    pixel.setUserData({
      em: contactForm.email,
      fn: contactForm.firstName,
      ln: contactForm.lastName,
      ph: contactForm.phone,
    });

    // Rastrear InitiateCheckout com dados enriquecidos
    pixel.initiateCheckout({
      value: total,
      currency: "USD",
      content_ids: items.map((item) => item.id.toString()),
      num_items: items.length,
      content_type: "product",
      // Dados do usuário para UTMify e outros pixels que suportam enrichment no evento
      email: contactForm.email,
      phone: contactForm.phone,
      first_name: contactForm.firstName,
      last_name: contactForm.lastName,
    });

    setStep("payment");
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Head>
          <title>Empty Basket | Perfumes UK</title>
        </Head>
        <HeaderTPS sticky={true} />
        <div className="flex-grow flex items-center justify-center py-40">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Your basket is empty
            </h1>
            <p className="text-gray-600 mb-8 px-2">
              Add some products to your basket to continue with checkout.
            </p>
            <a
              href="/"
              className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition-colors"
            >
              Back to shop
            </a>
          </div>
        </div>
        <FooterTPS />
      </div>
    );
  }

  return (
    <div id="checkout" className="min-h-screen bg-gray-50">
      <Head>
        <title>Checkout | Perfumes UK</title>
      </Head>

      <HeaderTPS />

      <div className="max-w-4xl mx-auto">
        {/* Order Summary */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Order Summary</h2>
          </div>
          <div className="space-y-2">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center space-x-4 space-y-2 last:border-0 last:pb-0"
              >
                <div className="relative w-20 h-20 bg-gray-100  flex-shrink-0 rounded-md border border-[#f1f1f1] shadow-sm">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full rounded-md object-contain"
                  />
                  <div className="absolute -top-2 -right-2">
                    <p className="text-[12px] text-white bg-black rounded-full w-fit px-2">
                      {item.quantity}
                    </p>
                  </div>
                </div>
                <div className="flex-1 font-semibold">
                  <h3 className="font-medium text-gray-900 text-sm">
                    {item.title}
                  </h3>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-bold text-gray-900">
                      ${item.price.toFixed(2)}
                    </span>
                    <span className="text-xs line-through text-gray-400">
                      Was ${(item.originalPrice || 169.99).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col-2 justify-between pt-4">
            <div className="flex items-center gap-1 text-[#ff0000] px-3 py-1 rounded-full text-xs font-bold">
              <Timer className="w-3.5 h-3.5" />
              <span>LIMITED OFFER ENDS IN</span>
            </div>
            <div className="flex gap-1 text-[10px] p-1 font-mono text-gray-500">
              <span className="bg-gray-100 px-1">
                {timeLeft.hours.toString().padStart(2, "0")}h
              </span>
              <span className="bg-gray-100 px-1">
                {timeLeft.minutes.toString().padStart(2, "0")}m
              </span>
              <span className="bg-red-600 text-white px-1 rounded animate-pulse">
                {timeLeft.seconds.toString().padStart(2, "0")}s
              </span>
            </div>
          </div>
          <div className="mt-4 pt-4 space-y-2">
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>Subtotal (List Price)</span>
              <span className="line-through">${totalOriginal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-green-600 font-bold relative">
              <div className="flex items-center gap-1">
                <span>Exclusive Bundle Savings</span>
                <button
                  onMouseEnter={() => setShowPromoInfo(true)}
                  onMouseLeave={() => setShowPromoInfo(false)}
                  onClick={() => setShowPromoInfo(!showPromoInfo)}
                  className="text-gray-400 hover:text-black transition-colors"
                >
                  <Info className="w-4 h-4" />
                </button>
                {showPromoInfo && (
                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-gray-200 p-3 rounded-lg shadow-xl z-50 animate-in fade-in slide-in-from-bottom-2">
                    <h4 className="font-bold text-gray-900 text-xs mb-1">
                      3-for-1 EXCLUSIVE OFFER
                    </h4>
                    <p className="text-[11px] leading-relaxed text-gray-600 font-normal">
                      Get 3 luxury 100ml fragrances for the price of one. This
                      exclusive bundle deal applies automatically at checkout,
                      saving you over $120 compared to individual retail prices.
                    </p>
                    <div className="absolute left-4 -bottom-1 w-2 h-2 bg-white border-r border-b border-gray-200 rotate-45"></div>
                  </div>
                )}
              </div>
              <span>-${(totalOriginal - total).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
              <span className="font-bold text-lg text-gray-900">
                Total to pay
              </span>
              <span className="font-bold text-2xl text-black">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>Error: {error}</p>
            <button onClick={() => router.push("/")} className="underline mt-2">
              Return to Home
            </button>
          </div>
        )}

        {step === "contact" ? (
          <div className="bg-gray-50 p-6 rounded-lg shadow-sm pb-20">
            <h2 className="text-xl font-bold mb-6">Contact Information</h2>
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    required
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-3 border"
                    placeholder="John"
                    value={contactForm.firstName}
                    onChange={(e) =>
                      setContactForm({
                        ...contactForm,
                        firstName: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    required
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-3 border"
                    placeholder="Doe"
                    value={contactForm.lastName}
                    onChange={(e) =>
                      setContactForm({
                        ...contactForm,
                        lastName: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-3 border"
                  placeholder="john.doe@example.com"
                  value={contactForm.email}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, email: e.target.value })
                  }
                />
                <p className="mt-1 text-xs text-gray-500">
                  We'll use this to send your order confirmation.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-black focus:ring-black sm:text-sm p-3 border"
                  placeholder="+44 7123 456789"
                  value={contactForm.phone}
                  onChange={(e) =>
                    setContactForm({ ...contactForm, phone: e.target.value })
                  }
                />
              </div>

              <button
                type="submit"
                className="w-full bg-black text-white py-4 px-4 rounded-2xl hover:bg-gray-800 transition-colors font-bold text-lg mt-6 flex justify-center items-center gap-2"
              >
                <ShoppingBag className="w-6 h-6" />
                View Order
              </button>
            </form>
          </div>
        ) : (
          <>
            {clientSecret ? (
              <EmbeddedCheckoutProvider
                stripe={stripePromise}
                options={{ clientSecret }}
              >
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            ) : (
              <div className="flex flex-col justify-center items-center h-64 bg-white rounded-lg shadow-sm">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
                <p className="text-gray-500 font-medium">
                  Preparing secure checkout...
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
