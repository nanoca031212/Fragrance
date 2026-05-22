"use client"

import { useState, useEffect } from "react"
import { CheckCircle } from "lucide-react"
import Image from "next/image"

interface Kit {
  id: string
  name: string
  wrestler: string
  price: number
  originalPrice: number
  savings: number
  description: string
  items: string[]
  images: string[]
}

const kits: Kit[] = [
  {
    id: "luxury-perfumes",
    name: "3 Luxury Perfumes – Exclusive Online Kit",
    wrestler: "Premium",
    price: 69.99,
    originalPrice: 169.99,
    savings: 100.99,
    description: "3 Premium Fragrance Collection",
    items: [
      "Elegant Rose & Bergamot (100ml)",
      "Mysterious Oud & Vanilla (100ml)",
      "Fresh Citrus & Cedar (100ml)",
      "Premium Gift Box",
      "Exclusive Online Access",
      "Limited Time Offer"
    ],
    images: [
      "/perfume-kit.jpg",
      "/perfume-close-up.jpg",
      "/perfume-unboxing.jpg",
      "/perfume-lifestyle.jpg"
    ]
  }
]

interface PriceAnchoringProps {
  correctAnswers: number
  onBuyClick?: (selectedKit: string) => void
}

export default function PriceAnchoring({ correctAnswers, onBuyClick }: PriceAnchoringProps) {
  const [selectedKit, setSelectedKit] = useState<string>("luxury-perfumes")
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [carouselOffset, setCarouselOffset] = useState(0)

  const selectedKitData = kits.find(kit => kit.id === selectedKit) || kits[0]
  const discount = correctAnswers * 20
  const finalPrice = selectedKitData.price // Use the kit's specific price

  // Auto-rotate images
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) =>
        (prev + 1) % selectedKitData.images.length
      )
    }, 3000)

    return () => clearInterval(interval)
  }, [selectedKitData.images.length])

  // Reset image index when kit changes
  useEffect(() => {
    setCurrentImageIndex(0)
  }, [selectedKit])

  // Auto-scroll carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCarouselOffset(prev => {
        // Each item is 232px (200px + 32px margin)
        const itemWidth = 232
        // Move by 1px for smooth animation
        const newOffset = prev - 1
        // Reset when we've moved one full cycle
        const totalWidth = itemWidth * 11 // 11 unique images (per1 to per11)
        if (Math.abs(newOffset) >= totalWidth) {
          return 0
        }
        return newOffset
      })
    }, 20) // Update every 20ms for smooth animation

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-white pt-4">
      <h1 className="text-center text-[#2c2c2c] text-3xl mt-5 font-bold font-sans mb-4">Congratulations! Your Exclusive Deal is Unlocked</h1>
      <div className="flex justify-center mb-6"><span className="text-sm text-wrap text-center text-gray-500 px-4">You've successfully completed our quiz and secured a ${discount} discount on this exclusive online bundle.</span></div>


      {/* New Temu-style Layout */}
      {/* Premium Price Anchoring Card */}
      <div className="relative overflow-hidden rounded-2xl border mx-7 px-4 border-gray-200/50 bg-gradient-to-br from-gray-50/80 to-gray-50/50 py-4 shadow-2xl backdrop-blur-sm mb-8 animate-fadeIn group">
        {/* Shimmer effect */}
        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12" />

        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          <div className="w-full overflow-hidden bg-white">
            <div className="relative">
              <div
                className="flex transition-none"
                style={{
                  transform: `translateX(${carouselOffset}px)`,
                  width: '7656px' // Adjusted for 11 images: 11 * 232px * 3 cycles = 7656px
                }}
              >
                {/* Create infinite loop by repeating the pattern multiple times */}
                {Array.from({ length: 3 }, (_, cycleIndex) =>
                  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((item, index) => (
                    <div key={`${cycleIndex}-${index}`} className="flex-shrink-0 mr-8">
                      <div className="w-[200px] h-[200px] md:w-[200px] md:h-[200px] sm:w-[150px] sm:h-[150px]">
                        <Image
                          src={`/per${item}.png`}
                          alt={`Perfume ${item}`}
                          width={200}
                          height={200}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    </div>
                  ))
                ).flat()}
              </div>
            </div>
          </div>

          {/* Pricing Info */}
          <div className="flex-grow text-center md:text-left space-y-2">
            <h2 className="text-gray-500 text-xs font-bold uppercase tracking-widest">Your Quiz Reward</h2>
            <div className="items-baseline flex-col col-1 justify-center md:justify-start gap-3">
              <span className="text-4xl font-extrabold text-black tracking-tight border-b-2 border-red-500">${finalPrice.toFixed(2)}</span>
              <span className="text-x text-gray-400 line-through font-medium pl-2 border-b-2 border-black pb-1">/${selectedKitData.originalPrice.toFixed(2)}</span>
              <div className="flex flex-col mt-4">
                <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full inline-block">SAVE ${selectedKitData.savings.toFixed(2)}</span>
              </div>
            </div>
            <p className="text-gray-600 text-sm font-medium">3 Luxury Perfumes – Exclusive Online Kit's</p>
          </div>

          {/* Trust Badge */}
          <div className="flex flex-col items-center md:items-end gap-1 bg-gray-200 px-2 rounded-lg">
            <div className="flex text-yellow-500">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg key={s} className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              ))}
            </div>
          </div>
        </div>
      </div>



      {/* Price Breakdown */}
      <div className="space-y-4 mb-8">

        {/* Buy Now Button */}
        {onBuyClick && (
          <div className="mt-6">
            <button
              onClick={() => onBuyClick(selectedKit)}
              className="w-full bg-black hover:bg-gray-500 shadow-xl shadow-gray-500/35 hover:shadow-green-200 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg> Go to store
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
