"use client"

import { memo } from "react"
import type { ArloAnimation } from "./arlo-types"

interface ArloCharacterProps {
  animation: ArloAnimation
  size?: number
  onClick?: () => void
  className?: string
}

/**
 * Arlo — an animated dog character rendered as SVG.
 *
 * He's a small, cute corgi-style pup with expressive animations.
 * Each animation state changes his pose via CSS keyframes.
 */
export const ArloCharacter = memo(function ArloCharacter({
  animation,
  size = 64,
  onClick,
  className = "",
}: ArloCharacterProps) {
  return (
    <div
      className={`arlo-character arlo-${animation} ${className}`}
      style={{ width: size, height: size, cursor: onClick ? "pointer" : "default" }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      aria-label="Arlo - your document buddy"
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        className="arlo-svg"
      >
        {/* Tail */}
        <path
          className="arlo-tail"
          d="M25 52 Q15 40, 18 30"
          fill="none"
          stroke="#D4922A"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* Body */}
        <ellipse
          className="arlo-body"
          cx="50"
          cy="58"
          rx="22"
          ry="16"
          fill="#F5B642"
        />

        {/* Belly patch */}
        <ellipse
          cx="50"
          cy="62"
          rx="14"
          ry="10"
          fill="#FCEABB"
        />

        {/* Back legs */}
        <g className="arlo-legs-back">
          <rect x="32" y="68" width="7" height="14" rx="3.5" fill="#D4922A" />
          <rect x="60" y="68" width="7" height="14" rx="3.5" fill="#D4922A" />
        </g>

        {/* Front legs */}
        <g className="arlo-legs-front">
          <rect x="38" y="68" width="7" height="16" rx="3.5" fill="#F5B642" />
          <rect x="54" y="68" width="7" height="16" rx="3.5" fill="#F5B642" />
        </g>

        {/* Paws */}
        <g className="arlo-paws">
          <ellipse cx="41.5" cy="84" rx="5" ry="3" fill="#FCEABB" />
          <ellipse cx="57.5" cy="84" rx="5" ry="3" fill="#FCEABB" />
          <ellipse cx="35.5" cy="82" rx="5" ry="3" fill="#E8C170" />
          <ellipse cx="63.5" cy="82" rx="5" ry="3" fill="#E8C170" />
        </g>

        {/* Head */}
        <circle
          className="arlo-head"
          cx="50"
          cy="35"
          r="18"
          fill="#F5B642"
        />

        {/* Face patch */}
        <ellipse
          cx="50"
          cy="40"
          rx="12"
          ry="10"
          fill="#FCEABB"
        />

        {/* Left ear */}
        <ellipse
          className="arlo-ear-left"
          cx="34"
          cy="20"
          rx="8"
          ry="12"
          fill="#D4922A"
          transform="rotate(-15 34 20)"
        />
        <ellipse
          cx="34"
          cy="21"
          rx="5"
          ry="8"
          fill="#F0A0A0"
          transform="rotate(-15 34 21)"
        />

        {/* Right ear */}
        <ellipse
          className="arlo-ear-right"
          cx="66"
          cy="20"
          rx="8"
          ry="12"
          fill="#D4922A"
          transform="rotate(15 66 20)"
        />
        <ellipse
          cx="66"
          cy="21"
          rx="5"
          ry="8"
          fill="#F0A0A0"
          transform="rotate(15 66 21)"
        />

        {/* Eyes */}
        <g className="arlo-eyes">
          <circle cx="43" cy="33" r="4" fill="#2D1B00" />
          <circle cx="57" cy="33" r="4" fill="#2D1B00" />
          {/* Eye shine */}
          <circle cx="44.5" cy="31.5" r="1.5" fill="white" />
          <circle cx="58.5" cy="31.5" r="1.5" fill="white" />
        </g>

        {/* Closed eyes (for sleeping) */}
        <g className="arlo-eyes-closed" style={{ display: "none" }}>
          <path d="M39 33 Q43 36, 47 33" stroke="#2D1B00" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M53 33 Q57 36, 61 33" stroke="#2D1B00" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>

        {/* Nose */}
        <ellipse cx="50" cy="40" rx="3.5" ry="2.5" fill="#2D1B00" />

        {/* Mouth - happy */}
        <path
          className="arlo-mouth"
          d="M45 44 Q50 49, 55 44"
          fill="none"
          stroke="#2D1B00"
          strokeWidth="1.5"
          strokeLinecap="round"
        />

        {/* Tongue (visible in some states) */}
        <ellipse
          className="arlo-tongue"
          cx="50"
          cy="48"
          rx="3"
          ry="4"
          fill="#FF8A8A"
          style={{ display: "none" }}
        />

        {/* Document in mouth (for carrying state) */}
        <g className="arlo-document" style={{ display: "none" }}>
          <rect x="42" y="44" width="16" height="12" rx="1" fill="white" stroke="#CBD5E1" strokeWidth="0.8" />
          <line x1="45" y1="48" x2="55" y2="48" stroke="#CBD5E1" strokeWidth="0.8" />
          <line x1="45" y1="51" x2="53" y2="51" stroke="#CBD5E1" strokeWidth="0.8" />
        </g>

        {/* Sleep Zzz (for sleeping state) */}
        <g className="arlo-zzz" style={{ display: "none" }}>
          <text x="62" y="20" fontSize="10" fontWeight="bold" fill="#94A3B8">z</text>
          <text x="68" y="14" fontSize="8" fontWeight="bold" fill="#94A3B8">z</text>
          <text x="73" y="10" fontSize="6" fontWeight="bold" fill="#94A3B8">z</text>
        </g>

        {/* Thinking dots */}
        <g className="arlo-thinking-dots" style={{ display: "none" }}>
          <circle cx="70" cy="25" r="2.5" fill="#94A3B8" />
          <circle cx="77" cy="20" r="2" fill="#94A3B8" />
          <circle cx="83" cy="16" r="1.5" fill="#94A3B8" />
        </g>

        {/* Sparkles (for celebrating) */}
        <g className="arlo-sparkles" style={{ display: "none" }}>
          <text x="15" y="20" fontSize="10">&#10022;</text>
          <text x="75" y="15" fontSize="8">&#10022;</text>
          <text x="80" y="45" fontSize="10">&#10022;</text>
          <text x="10" y="50" fontSize="7">&#10022;</text>
        </g>

        {/* Waving paw (overlay for waving state) */}
        <g className="arlo-wave-paw" style={{ display: "none" }}>
          <ellipse cx="68" cy="55" rx="6" ry="5" fill="#F5B642" />
          <ellipse cx="68" cy="52" rx="4" ry="3" fill="#FCEABB" />
        </g>
      </svg>

      <style>{`
        .arlo-character {
          position: relative;
          user-select: none;
          -webkit-user-select: none;
          -webkit-tap-highlight-color: transparent;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.15));
          transition: transform 0.2s ease;
          /* Ensure minimum 44px touch target even at small sizes */
          min-width: 44px;
          min-height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .arlo-character:hover {
          transform: scale(1.05);
        }
        .arlo-character:active {
          transform: scale(0.95);
        }
        @media (hover: none) and (pointer: coarse) {
          .arlo-character:hover {
            transform: none;
          }
          .arlo-character:active {
            transform: scale(0.9);
          }
        }

        /* === IDLE === */
        .arlo-idle .arlo-body {
          animation: arlo-breathe 3s ease-in-out infinite;
        }
        .arlo-idle .arlo-tail {
          animation: arlo-wag 1.5s ease-in-out infinite;
          transform-origin: 25px 52px;
        }
        .arlo-idle .arlo-tongue {
          display: block !important;
          animation: arlo-pant 2s ease-in-out infinite;
        }

        /* === WALKING === */
        .arlo-walking .arlo-body {
          animation: arlo-bounce 0.4s ease-in-out infinite;
        }
        .arlo-walking .arlo-legs-front {
          animation: arlo-step-front 0.4s ease-in-out infinite;
        }
        .arlo-walking .arlo-legs-back {
          animation: arlo-step-back 0.4s ease-in-out infinite alternate;
        }
        .arlo-walking .arlo-tail {
          animation: arlo-wag-fast 0.3s ease-in-out infinite;
          transform-origin: 25px 52px;
        }
        .arlo-walking .arlo-ear-left,
        .arlo-walking .arlo-ear-right {
          animation: arlo-ear-flop 0.4s ease-in-out infinite;
        }

        /* === THINKING === */
        .arlo-thinking .arlo-head {
          animation: arlo-tilt 2s ease-in-out infinite;
          transform-origin: 50px 35px;
        }
        .arlo-thinking .arlo-thinking-dots {
          display: block !important;
          animation: arlo-dots-float 1.5s ease-in-out infinite;
        }
        .arlo-thinking .arlo-ear-left {
          animation: arlo-ear-perk 1s ease-in-out infinite;
          transform-origin: 34px 20px;
        }

        /* === TYPING === */
        .arlo-typing .arlo-legs-front {
          animation: arlo-type-paws 0.3s ease-in-out infinite alternate;
        }
        .arlo-typing .arlo-body {
          animation: arlo-breathe 2s ease-in-out infinite;
        }
        .arlo-typing .arlo-tongue {
          display: block !important;
        }

        /* === CLICKING === */
        .arlo-clicking .arlo-legs-front {
          animation: arlo-click-paw 0.5s ease-in-out;
        }

        /* === CARRYING === */
        .arlo-carrying .arlo-document {
          display: block !important;
        }
        .arlo-carrying .arlo-mouth {
          display: none;
        }
        .arlo-carrying .arlo-tongue {
          display: none !important;
        }
        .arlo-carrying .arlo-body {
          animation: arlo-bounce 0.4s ease-in-out infinite;
        }
        .arlo-carrying .arlo-tail {
          animation: arlo-wag-fast 0.3s ease-in-out infinite;
          transform-origin: 25px 52px;
        }

        /* === CELEBRATING === */
        .arlo-celebrating .arlo-svg {
          animation: arlo-jump 0.5s ease-in-out infinite;
        }
        .arlo-celebrating .arlo-sparkles {
          display: block !important;
          animation: arlo-sparkle 0.8s ease-in-out infinite;
        }
        .arlo-celebrating .arlo-tail {
          animation: arlo-wag-fast 0.2s ease-in-out infinite;
          transform-origin: 25px 52px;
        }
        .arlo-celebrating .arlo-tongue {
          display: block !important;
        }

        /* === SLEEPING === */
        .arlo-sleeping .arlo-eyes {
          display: none;
        }
        .arlo-sleeping .arlo-eyes-closed {
          display: block !important;
        }
        .arlo-sleeping .arlo-zzz {
          display: block !important;
          animation: arlo-zzz-float 2s ease-in-out infinite;
        }
        .arlo-sleeping .arlo-body {
          animation: arlo-breathe 4s ease-in-out infinite;
        }
        .arlo-sleeping .arlo-mouth {
          d: path("M46 43 Q50 45, 54 43");
        }

        /* === WAVING === */
        .arlo-waving .arlo-wave-paw {
          display: block !important;
          animation: arlo-wave 0.6s ease-in-out infinite;
          transform-origin: 68px 60px;
        }
        .arlo-waving .arlo-tail {
          animation: arlo-wag-fast 0.3s ease-in-out infinite;
          transform-origin: 25px 52px;
        }
        .arlo-waving .arlo-tongue {
          display: block !important;
        }

        /* === KEYFRAMES === */

        @keyframes arlo-breathe {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.03); }
        }

        @keyframes arlo-wag {
          0%, 100% { transform: rotate(-10deg); }
          50% { transform: rotate(15deg); }
        }

        @keyframes arlo-wag-fast {
          0%, 100% { transform: rotate(-15deg); }
          50% { transform: rotate(20deg); }
        }

        @keyframes arlo-pant {
          0%, 100% { ry: 4; }
          50% { ry: 5; }
        }

        @keyframes arlo-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }

        @keyframes arlo-step-front {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }

        @keyframes arlo-step-back {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }

        @keyframes arlo-ear-flop {
          0%, 100% { transform: rotate(0); }
          50% { transform: rotate(-5deg); }
        }

        @keyframes arlo-tilt {
          0%, 100% { transform: rotate(0); }
          25% { transform: rotate(8deg); }
          75% { transform: rotate(-5deg); }
        }

        @keyframes arlo-dots-float {
          0%, 100% { opacity: 0.4; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-3px); }
        }

        @keyframes arlo-ear-perk {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.15); }
        }

        @keyframes arlo-type-paws {
          0% { transform: translateY(0); }
          100% { transform: translateY(-3px); }
        }

        @keyframes arlo-click-paw {
          0%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
          60% { transform: translateY(2px); }
        }

        @keyframes arlo-jump {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-8px) scale(1.05); }
        }

        @keyframes arlo-sparkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        @keyframes arlo-zzz-float {
          0% { opacity: 0.3; transform: translateY(0) translateX(0); }
          50% { opacity: 1; transform: translateY(-5px) translateX(3px); }
          100% { opacity: 0.3; transform: translateY(0) translateX(0); }
        }

        @keyframes arlo-wave {
          0%, 100% { transform: rotate(-10deg); }
          50% { transform: rotate(15deg); }
        }
      `}</style>
    </div>
  )
})
