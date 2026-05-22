"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Trophy, DollarSign, Badge } from "lucide-react";
import Image from "next/image";
import PriceAnchoring from "@/components/price-anchoring";
import styles from "@/styles/animations.module.css";
import { trackQuizStep } from "@/lib/utils";
import { useRouter } from "next/router";
import { useCart } from "@/contexts/CartContext";
import Link from "next/link";
import { Check } from "lucide-react";
import { appendUTMsToUrl } from "@/utils/utm-helper";

// Add animated border keyframes for progress
const progressBarStyles = `
  @keyframes progress {
    from { width: 100%; }
    to { width: 0%; }
  }
  
  @keyframes progressReverse {
    from { width: 0%; }
    to { width: 100%; }
  }

  @keyframes borderGlow {
    0% {
      border-color: #ff0000;
      box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
    }
    25% {
      border-color: #ff6600;
      box-shadow: 0 0 20px rgba(255, 102, 0, 0.5);
    }
    50% {
      border-color: #ffff00;
      box-shadow: 0 0 20px rgba(255, 255, 0, 0.5);
    }
    75% {
      border-color: #ff6600;
      box-shadow: 0 0 20px rgba(255, 102, 0, 0.5);
    }
    100% {
      border-color: #ff0000;
      box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
    }
  }

  @keyframes discountShine {
    0% {
      background-position: -100% 0;
    }
    100% {
      background-position: 100% 0;
    }
  }

  .discount-progress-bar {
    background: linear-gradient(90deg, #1eff00, #49d610);
    background-size: 200% 100%;
    animation: discountShine 2s ease-in-out infinite right;
    position: relative;
    overflow: hidden;
  }

  .discount-progress-bar::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    animation: discountShine 2s ease-in-out infinite;
  }

  .animated-border {
    position: relative;
    overflow: hidden;
  }

  .animated-border::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(45deg, #ff0000, #ff6600, #ffff00, #ff6600, #ff0000);
    background-size: 300% 300%;
    border-radius: 14px;
    z-index: -1;
    animation: borderAnimation 3s ease-in-out infinite;
  }

  @keyframes borderAnimation {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }

  .progress-container {
    width: 100%;
    height: 8px;
    background-color: #e5e7eb;
    border-radius: 9999px;
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    background: linear-gradient(to right, #ca2020, #ff0000);
    border-radius: 9999px;
    transition: width 0.1s linear;
  }

  @keyframes glitch {
    0% {
      text-shadow: 0.05em 0 0 rgba(255, 0, 80, 0.75),
        -0.05em -0.025em 0 rgba(0, 255, 255, 0.75),
        -0.025em 0.05em 0 rgba(255, 255, 0, 0.75);
    }
    14% {
      text-shadow: 0.05em 0 0 rgba(255, 0, 80, 0.75),
        -0.05em -0.025em 0 rgba(0, 255, 255, 0.75),
        -0.025em 0.05em 0 rgba(255, 255, 0, 0.75);
    }
    15% {
      text-shadow: -0.05em -0.025em 0 rgba(255, 0, 80, 0.75),
        0.025em 0.025em 0 rgba(0, 255, 255, 0.75),
        -0.05em -0.05em 0 rgba(255, 255, 0, 0.75);
    }
    49% {
      text-shadow: -0.05em -0.025em 0 rgba(255, 0, 80, 0.75),
        0.025em 0.025em 0 rgba(0, 255, 255, 0.75),
        -0.05em -0.05em 0 rgba(255, 255, 0, 0.75);
    }
    50% {
      text-shadow: 0.025em 0.05em 0 rgba(255, 0, 80, 0.75),
        0.05em 0 0 rgba(0, 255, 255, 0.75), 0 -0.05em 0 rgba(255, 255, 0, 0.75);
    }
    99% {
      text-shadow: 0.025em 0.05em 0 rgba(255, 0, 80, 0.75),
        0.05em 0 0 rgba(0, 255, 255, 0.75), 0 -0.05em 0 rgba(255, 255, 0, 0.75);
    }
    100% {
      text-shadow: -0.025em 0 0 rgba(255, 0, 80, 0.75),
        -0.025em -0.025em 0 rgba(0, 255, 255, 0.75),
        -0.025em -0.05em 0 rgba(255, 255, 0, 0.75);
    }
  }

  .glitch-text {
    animation: glitch 500ms infinite;
  }

  @keyframes pulse-glow {
    0% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
    70% { box-shadow: 0 0 0 15px rgba(255, 255, 255, 0); }
    100% { box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
  }

  .pulse-glow {
    animation: pulse-glow 2s infinite;
  }
`;

// Declare tipos globais para os pixels
declare global {
  interface Window {
    TiktokAnalyticsObject?: string;
    pixelId?: string;
  }
}

interface Question {
  id: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

const questions: Question[] = [
  {
    id: 2,
    question: "Where did you find us?",
    options: [
      "TikTok ",
      "Facebook ",
      "Instagram ",
 
    ],
    correct: 0,
    explanation: "We're glad you're here!",
  },
  {
    id: 3,
    question: "Have you seen us before?",
    options: [
      "Yes",
      "No",
    ],
    correct: 0,
    explanation:
      "We love to see familiar faces around here!",
  },
  {
    id: 4,
    question: "When did you last buy a fragrance?",
    options: [
      "Recently",
      "A while ago",
      "Not sure",
     
    ],
    correct: 0,
    explanation:
      "Taking time to choose the perfect perfume makes each purchase special!",
  },
  {
    id: 5,
    question:
      "What do you usually go for?",
    options: [
      "Something simple",
      "Something strong",
      "Something popular",
   
    ],
    correct: 0,
    explanation:
      "Personal recommendations from trusted people are invaluable when choosing fragrances!",
  },
  {
    id: 6,
    question: "How do you usually choose?",
    options: [
      "Quick decision",
      "Compare a bit",
      "Just go with it",
    ],
    correct: 0,
    explanation:
      "Direct discounts provide immediate value on your favorite fragrances!",
  },

];

// Enhanced notification component with better animations
const SuccessNotification = ({
  show,
  onClose,
}: {
  show: boolean;
  onClose: () => void;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);

      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => {
            onClose();
            setIsExiting(false);
          }, 400);
        }, 200);
      }, 2500); // Reduced display time to 2.5 seconds

      return () => {
        clearTimeout(timer);
      };
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-700 transform ${
        isVisible && !isExiting
          ? "translate-x-0 opacity-100 scale-100"
          : "translate-x-full opacity-0 scale-95"
      }`}
    >
      <div className="bg-gradient-to-r from-black to-[#303030] text-white px-6 py-4 rounded-xl shadow-2xl flex items-center space-x-3 border border-gray-500 backdrop-blur-sm">
        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
          <DollarSign className="h-8 w-8 text-green-500 animate-bounce" />
        </div>
        <div>
          <p className="font-bold text-lg">Congratulations! 🎉</p>
          <p className="text-sm opacity-90">You've earned a $20 discount!</p>
        </div>
        <button
          onClick={onClose}
          className="ml-2 text-white hover:text-gray-200 transition-colors duration-200"
          aria-label="Close notification"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

// Falling hearts component
const FallingHeart = ({ delay }: { delay: number }) => (
  <div
    className={`absolute text-red-500 text-2xl pointer-events-none ${styles.fall}`}
    style={{
      left: `${Math.random() * 100}%`,
      top: "-50px",
      animationDelay: `${delay}ms`,
    }}
  >
    ❤️
  </div>
);

// Chelsea lion icon component
const ChelseaLionIcon = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </svg>
);

// Loading component for better UX
const LoadingSpinner = ({ size = "md" }: { size?: "sm" | "md" | "lg" }) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div
      className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-[#f00] border-t-white`}
    ></div>
  );
};

const ImageCarousel = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = [
    "/per1.png",
    "/per2.png",
    "/per3.png",
    "/per4.png",
    "/per5.png",
    "/per6.png",
    "/per7.png",
    "/per8.png",
    "/per9.png",
    "/per10.png",
    "/per11.png",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full" style={{ paddingBottom: "75%" }}>
      <div className="absolute inset-0 rounded-xl overflow-hidden">
        {images.map((image, index) => (
          <Image
            key={index}
            src={image}
            alt={`Fragrance Collection Image ${index + 1}`}
            fill
            className={`object-cover transition-opacity duration-1000 ${
              index === currentImageIndex ? "opacity-100" : "opacity-0"
            }`}
            style={{ borderRadius: "25px" }}
          />
        ))}
      </div>

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentImageIndex(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentImageIndex
                ? "bg-white shadow-lg"
                : "bg-white/50 hover:bg-white/75"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// Componente de vídeo simplificado
const VideoPlayer = React.memo(({ isReady }: { isReady: boolean }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [showMuteButton, setShowMuteButton] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const forcePlay = () => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          video.muted = true;
          setIsMuted(true);
          video.play().catch(() => {
            console.log("Unable to start video automatically");
          });
        });
      }
    };

    forcePlay();
    video.addEventListener("canplay", forcePlay);
    video.addEventListener("loadeddata", forcePlay);
    setTimeout(forcePlay, 1000);

    return () => {
      video.removeEventListener("canplay", forcePlay);
      video.removeEventListener("loadeddata", forcePlay);
    };
  }, []);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
      if (!videoRef.current.muted) {
        // If unmuted, hide button after small delay
        setTimeout(() => {
          setShowMuteButton(false);
        }, 500);
      }
    }
  };

  return (
    <div
      style={{ position: "relative", width: "100%", paddingBottom: "56.25%" }}
    >
      <video
        ref={videoRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: "25px",
        }}
        autoPlay
        playsInline
        controls={false}
        preload="auto"
        src="videos/vsl.mp4"
      />
      {showMuteButton && (
        <button
          onClick={toggleMute}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 10,
            background: "rgba(0, 0, 0, 0.6)",
            border: "none",
            borderRadius: "50%",
            width: "80px",
            height: "80px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "white",
            transition: "opacity 0.3s ease",
          }}
        >
          {isMuted ? (
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
});

VideoPlayer.displayName = "VideoPlayer";

// Componente de Layout para os scripts simplificado - removido pois já está no layout global
// const PixelScripts = () => (
//   <>
//   </>
// );

// Hook para controlar o carregamento dos pixels - simplificado
const usePixelLoader = () => {
  const [isPixelsReady, setPixelsReady] = useState(false);
  const pixelsInitialized = useRef(false);

  useEffect(() => {
    if (pixelsInitialized.current) {
      setPixelsReady(true);
      return;
    }

    // Verifica se os pixels estão carregados (Facebook no layout global)
    const checkPixels = () => {
      return (
        typeof window.fbq === "function" &&
        typeof window.ttq !== "undefined" &&
        window.ttq
      );
    };

    // Função que verifica os pixels
    const checkAll = () => {
      if (checkPixels()) {
        setPixelsReady(true);
        pixelsInitialized.current = true;
        clearInterval(checkInterval);
      }
    };

    // Inicia verificação periódica
    const checkInterval = setInterval(checkAll, 500);

    // Timeout de segurança após 5 segundos
    const timeoutId = setTimeout(() => {
      setPixelsReady(true);
      pixelsInitialized.current = true;
      clearInterval(checkInterval);
    }, 5000);

    return () => {
      clearInterval(checkInterval);
      clearTimeout(timeoutId);
    };
  }, []);

  return isPixelsReady;
};

// Rastrear visualização da VSL apenas uma vez globalmente
const useTrackVSLView = () => {
  useEffect(() => {
    setTimeout(() => {
      trackQuizStep("vsl_view"); // Rastrear visualização do vídeo
    }, 1000);
  }, []);
};

// Hook personalizado para gerenciar elementos escondidos (não é mais necessário)
function useDelayedElements() {
  // O delay agora é controlado pelo VTurb
  return null;
}

const useAudioSystem = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeAudio = () => {
      try {
        if (!audioRef.current) {
          const audio = new Audio(
            "https://cdn.shopify.com/s/files/1/0946/2290/8699/files/notifica_o-venda.mp3?v=1749150271",
          );
          audio.preload = "auto";
          audio.volume = 0.2; // Mais silencioso
          audioRef.current = audio;

          // Inicializa o contexto de áudio para dispositivos móveis
          const AudioContext =
            (window as any).AudioContext || (window as any).webkitAudioContext;
          if (AudioContext) {
            const audioContext = new AudioContext();
            if (audioContext.state === "suspended") {
              audioContext.resume();
            }
          }
          setIsInitialized(true);
        }
      } catch (error) {
        console.error("Error initializing audio:", error);
      }
    };

    // Inicializa na primeira interação
    const handleFirstInteraction = () => {
      initializeAudio();
      document.removeEventListener("touchstart", handleFirstInteraction);
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("keydown", handleFirstInteraction);
    };

    document.addEventListener("touchstart", handleFirstInteraction, {
      passive: true,
    });
    document.addEventListener("click", handleFirstInteraction);
    document.addEventListener("keydown", handleFirstInteraction);

    return () => {
      document.removeEventListener("touchstart", handleFirstInteraction);
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("keydown", handleFirstInteraction);
    };
  }, []);

  const playSound = useCallback(() => {
    try {
      if (audioRef.current && isInitialized) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((error) => {
          console.error("Error playing sound:", error);
        });
      }
    } catch (error) {
      console.error("Error playing sound:", error);
    }
  }, [isInitialized]);

  return { playSound, isInitialized };
};

// Componente do painel USP - versão minimalista Adidas
const USPPanel = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black bg-opacity-20 flex items-start justify-center">
      <div className="bg-white w-full max-w-4xl mt-12 mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-4">
          <div className="text-xs font-medium uppercase tracking-[0.25em] text-black">
            Heritage Fragrances
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-50 transition-colors duration-150"
            aria-label="Close"
          >
            <svg
              className="w-4 h-4 text-black"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="grid md:grid-cols-3 gap-px bg-gray-100">
          {/* History */}
          <div className="p-12 text-center bg-white">
            <div className="text-xs text-gray-400 uppercase tracking-[0.2em] mb-6">
              Since 1968
            </div>
            <div className="text-sm text-gray-900 mb-2 leading-relaxed">
              Fine Fragrance
            </div>
            <div className="text-xs text-gray-500">Artisans</div>
          </div>

          {/* Achievements */}
          <div className="p-12 text-center bg-white">
            <div className="text-xs text-gray-400 uppercase tracking-[0.2em] mb-6">
              Selection
            </div>
            <div className="text-sm text-gray-900 mb-2 leading-relaxed">
              Expertly
            </div>
            <div className="text-xs text-gray-500">Curated</div>
          </div>

          {/* Legacy */}
          <div className="p-12 text-center bg-white">
            <div className="text-xs text-gray-400 uppercase tracking-[0.2em] mb-6">
              Collection
            </div>
            <div className="text-sm text-gray-900 mb-2 leading-relaxed">
              Luxury
            </div>
            <div className="text-xs text-gray-500">Heritage</div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 text-center">
          <div className="text-xs text-gray-400 uppercase tracking-[0.2em]">
            The Ultimate Fragrance Experience
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente do ícone de coração moderno
const HeartIcon = ({
  isLiked,
  onClick,
}: {
  isLiked: boolean;
  onClick: () => void;
}) => {
  const [showBurst, setShowBurst] = useState(false);

  const handleClick = () => {
    onClick();
    if (!isLiked) {
      setShowBurst(true);
      setTimeout(() => setShowBurst(false), 700);
    }
  };

  return (
    <div className="relative">
      {showBurst && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`absolute w-full h-full ${styles.heartBurst}`}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-red-500 rounded-full"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: `rotate(${i * 60}deg) translateY(-10px)`,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Componente do ícone do Trustpilot
const TrustpilotStars = () => (
  <div className="flex items-center space-x-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <svg
        key={star}
        className="w-4 h-4 text-[#00b67a]"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
      </svg>
    ))}
  </div>
);

// Modificar o CompleteHeader para incluir o carrossel na posição correta
const CompleteHeader = ({ onUSPClick }: { onUSPClick: () => void }) => {
  const [isLiked, setIsLiked] = useState(false);

  return (
    <header
      data-auto-id="header"
      className="bg-white font-size-12 border-b border-gray-200 sticky top-0 z-50 shadow-sm"
    >
      {/* Logo Section - Nova seção no topo */}

      {/* USP Bar */}
  
    </header>
  );
};

// Remover o MinimalHeader e USPHeader antigos e usar apenas o CompleteHeader
export default function PerfumeQuiz() {
  const router = useRouter();
  const { addItem, setIsOpen } = useCart();
  const [gameStarted, setGameStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUSPPanel, setShowUSPPanel] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  // Add styles to document head
  useEffect(() => {
    const styleElement = document.createElement("style");
    styleElement.innerHTML = progressBarStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  const isPixelsReady = usePixelLoader();
  const { playSound, isInitialized: audioInitialized } = useAudioSystem();

  // Rastrear visualização da pergunta quando gameStarted está true
  useEffect(() => {
    if (gameStarted && !quizCompleted) {
      trackQuizStep("question_viewed", currentQuestion + 1);
    }
  }, [currentQuestion, gameStarted, quizCompleted]);

  // Avanço automático após selecionar uma resposta
  useEffect(() => {
    if (selectedAnswer !== "" && !isSubmitting && !quizCompleted) {
      const timer = setTimeout(() => {
        handleAnswer();
      }, 300); // Reduced delay to 300ms
      return () => clearTimeout(timer);
    }
  }, [selectedAnswer, isSubmitting, quizCompleted]);

  // Timer countdown logic
  useEffect(() => {
    if (!gameStarted) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameStarted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Debug para verificar o estado
  useEffect(() => {
    console.log("showUSPPanel state changed:", showUSPPanel);
  }, [showUSPPanel]);

  // Redirect effect when quiz is completed
  useEffect(() => {
    if (quizCompleted) {
      const timer = setTimeout(() => {
        handleBuyNowClick("standard");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [quizCompleted]);

  // Usar o hook de delay
  const delayedElements = useDelayedElements();

  // Função para abrir o painel USP
  const handleUSPClick = () => {
    console.log("handleUSPClick called");
    setShowUSPPanel(true);
  };

  // Função para fechar o painel USP
  const handleUSPClose = () => {
    console.log("handleUSPClose called");
    setShowUSPPanel(false);
  };

  // Modificar a função de início do quiz com loading e scroll automático
  const handleStartQuiz = () => {
    setIsLoading(true);
    trackQuizStep("quiz_start"); // Rastrear início do quiz

    // Simular um pequeno delay para melhor UX
    setTimeout(() => {
      setGameStarted(true);
      setIsLoading(false);
      // Scroll automático para o topo ao iniciar quiz
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 800);
  };

  // Função para lidar com o clique no botão de compra
  const handleBuyNowClick = (selectedKit: string) => {
    trackQuizStep("go_to_store"); // Evento final - ir para a loja

    // Redirecionar para a loja, mas apenas se não estivermos nela
    if (router.asPath !== "/") {
      router.push(appendUTMsToUrl("/"));
    } else {
      // Se já estiver na home, apenas rolar para o topo
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Modificar a função de resposta com loading e scroll automático
  const handleAnswer = () => {
    if (isSubmitting) return;

    // Verificar se temos uma pergunta válida
    if (currentQuestion < 0 || currentQuestion >= questions.length) {
      console.error(
        "Current question index out of bounds:",
        currentQuestion,
        "Total questions:",
        questions.length,
      );
      return;
    }

    const currentQuestionData = questions[currentQuestion];
    if (!currentQuestionData) {
      console.error("Pergunta atual não encontrada");
      return;
    }

    // Verificar se uma resposta foi selecionada
    if (selectedAnswer === "" || selectedAnswer === null) {
      console.warn("No answer selected, skipping...");
      return;
    }

    setIsSubmitting(true);
    const isCorrect =
      Number.parseInt(selectedAnswer) === currentQuestionData.correct;
    const questionNumber = currentQuestion + 1;

    // Tracking de eventos - rastrear cada pergunta
    trackQuizStep("question_answered", questionNumber, isCorrect);

    // Only track progress, remove discount logic and notification
    setCorrectAnswers((prev) => (prev < questions.length ? prev + 1 : prev));

    // Re-enable sound effect at lower volume for all questions
    playSound();

    // Avançar diretamente para a próxima pergunta ou finalizar o quiz
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion((prev) => prev + 1);
        setSelectedAnswer("");
        // Scroll automático para o topo ao avançar pergunta
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setQuizCompleted(true);
        setSelectedAnswer(""); // Clear selection even when finishing
        trackQuizStep("quiz_completed"); // Rastrear conclusão do quiz
        // Scroll automático para o topo ao completar quiz
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      setIsSubmitting(false);
    }, 400); // Reduced switch delay to 400ms
  };

  const handleRestart = () => {
    trackQuizStep("quiz_restart"); // Rastrear reinício do quiz
    setGameStarted(false);
    setCurrentQuestion(0);
    setSelectedAnswer("");
    setCorrectAnswers(0);
    setQuizCompleted(false);
    setShowNotification(false);
    // Scroll automático para o topo ao reiniciar quiz
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const discount = correctAnswers === 6 ? 120.0 : correctAnswers * 20;
  const originalPrice = 169.99;
  const finalPrice = Math.max(originalPrice - discount, 69);

  useTrackVSLView(); // Comentado junto com o VSL

  // Rastrear visualização da página final
  useEffect(() => {
    if (quizCompleted) {
      trackQuizStep("final_page_viewed");
    }
  }, [quizCompleted]);

  // Initial screen with the TikTok design
  if (!gameStarted) {
    return (
      <>
        <div className="min-h-screen bg-white text-black flex flex-col font-sans overflow-hidden">
          {/* TikTok Badge at Top */}

          <div className="flex-grow flex flex-col items-center justify-center px-6 text-center space-y-8">
            <div className="space-y-4 animate-fadeIn">
              <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-none">
                Confirmed   User
               
              </h1>
              <p className="text-black/60 text-lg max-w-xs mx-auto leading-tight">
                Participate in the survey or go directly to the offer.
              </p>
            </div>

            <div className="w-full max-w-xs space-y-3 animate-slideIn">
              {[
                "Confirmed eligibility",
                "Payment security",
                "Identified user",
              
              ].map((item, i) => (
                <div key={i} className="flex items-center space-x-3 text-left">
                  <div className="bg-green-700 rounded-full p-1">
                    <Check className="h-4 w-4 text-white stroke-[3]" />
                  </div>
                  <span className="font-medium text-[15px]">{item}</span>
                </div>
              ))}
            </div>

            <div className="w-full max-w-xs pt-4 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <Link href="/">
                  <button className="w-full bg-black text-white text-lg font-bold py-5 gap-2 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center space-x-2">
                    <span>GO TO STORE</span>
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
                      <line x1="3" y1="6" x2="21" y2="6"></line>
                      <path d="M16 10a4 4 0 0 1-8 0"></path>
                    </svg>{" "}
                  </button>
                </Link>

      
              </div>

              <div className="text-xs text-black/40 font-mono">
                Reservation expires in{" "}
                <span className="text-black">{formatTime(timeLeft)}</span>
              </div>
                        <button
                  onClick={handleStartQuiz}
                  disabled={isLoading}
                  className="w-full bg-transparent border-2 border-white text-black text-sm font-bold rounded-full transition-all duration-300 hover:bg-white/10 hover:scale-105 active:scale-95 flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <LoadingSpinner size="md" />
                  ) : (
                    <>
                      <span className="uppercase   text-white font-medium">Take part in the survey</span>
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </>
                  )}
                </button>
            </div>
          </div>

          {/* Footer Subtle Text */}
        </div>
      </>
    );
  }

  if (quizCompleted) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center font-sans p-6">
        <div className="text-center space-y-6 animate-fadeIn">
          <div className="flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
            You are being redirected to the purchase page...
          </h2>
          <p className="text-gray-500">
            Please wait a moment while we prepare your discount.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-white flex flex-col font-sans">
        <CompleteHeader onUSPClick={handleUSPClick} />
        <USPPanel isOpen={showUSPPanel} onClose={handleUSPClose} />
        <div className="flex-grow flex items-center justify-center container mx-auto px-4">
          <div className="w-full max-w-2xl space-y-12 py-8">
            <div className="space-y-8">
              {questions[currentQuestion] && (
                <div className="bg-white shadow-sm transition-all duration-300 mb-4">
                  <h3 className="text-3xl font-semibold mb-4 text-black border-b border-[#f00] pb-2">
                    {questions[currentQuestion].question}
                  </h3>

                  <RadioGroup
                    value={selectedAnswer}
                    onValueChange={setSelectedAnswer}
                    className="space-y-4"
                  >
                    {questions[currentQuestion].options.map(
                      (option: string, index: number) => (
                        <div
                          key={index}
                          className={`flex items-center space-x-3 p-4 transition-all duration-200 cursor-pointer border-2 ${
                            selectedAnswer === index.toString()
                              ? "bg-[#e90a0a] border-[#e90a0a] shadow-sm"
                              : "bg-gray-50 border-gray-200 hover:border-gray-400 "
                          }`}
                        >
                          <RadioGroupItem
                            value={index.toString()}
                            id={`option-${index}`}
                          />
                          <Label
                            htmlFor={`option-${index}`}
                            className={`flex-1 cursor-pointer font-medium text-lg ${selectedAnswer === index.toString() ? "text-black" : "text-gray-900"}`}
                          >
                            {option}
                          </Label>
                        </div>
                      ),
                    )}
                  </RadioGroup>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Discount progress bar component
const DiscountProgressBar = ({
  correctAnswers,
}: {
  correctAnswers: number;
}) => {
  const discount = correctAnswers === 6 ? 120.0 : correctAnswers * 20;
  const maxDiscount = 120.0;
  const progressPercentage = (discount / maxDiscount) * 100;

  return (
    <div>
      <div className="p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Discount progress:</span>
          <div>
            <span className="font-semibold text-black">${discount} /</span>
            <span className="font-semibold text-red-600">
              ${maxDiscount.toFixed(2)}
            </span>
          </div>
        </div>
        <div
          aria-valuemax={100}
          aria-valuemin={0}
          aria-valuenow={progressPercentage}
          role="progressbar"
          className="relative h-4 w-full overflow-hidden rounded-full bg-gray-200 mt-2"
        >
          <div
            className="discount-progress-bar h-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};
