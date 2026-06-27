import React from "react";
import { ChibiCustomization } from "../types";

interface ChibiAvatarProps {
  customization?: ChibiCustomization;
  state?: "idle" | "typing" | "concerned" | "happy";
  size?: "sm" | "md" | "lg" | "xl";
  showBackground?: boolean;
  backgroundType?: "bedroom" | "chat" | "none";
}

export default function ChibiAvatar({
  customization,
  state = "idle",
  size = "md",
  showBackground = true,
  backgroundType = "bedroom"
}: ChibiAvatarProps) {
  
  // Default customization parameters if not provided
  const config: ChibiCustomization = customization || {
    gender: "neutral",
    hat: "none",
    top: "tshirt",
    pants: "jeans",
    shoes: "sneakers"
  };

  // Dimensional scale classes
  const sizeClasses = {
    sm: "w-24 h-24",
    md: "w-40 h-40",
    lg: "w-56 h-56",
    xl: "w-72 h-72"
  };

  // Determine colors based on customization choice
  const hairColor = "#5C4033"; // Warm brown
  const skinColor = "#FFD1A9"; // Soft peach skin
  
  const hatColors = {
    none: "transparent",
    beanie: "#FF6B6B", // Coral pink beanie
    cap: "#4D96FF",    // Sky blue cap
    headphones: "#6C5CE7" // Purple headphones
  };

  const topColors = {
    hoodie: "#20B2AA",  // Light sea green
    tshirt: "#FFA07A",  // Light salmon
    sweater: "#D8BFD8" // Thistle purple
  };

  const pantsColors = {
    jeans: "#4A6FA5",      // Denim blue
    shorts: "#8FBC8F",     // Sage green
    sweatpants: "#7F8C8D"  // Heather grey
  };

  const shoesColors = {
    sneakers: "#E74C3C",  // Red
    boots: "#D35400",     // Leather brown
    slippers: "#F1C40F"   // Sunny yellow
  };

  return (
    <div 
      className={`relative rounded-2xl overflow-hidden shadow-md flex items-center justify-center transition-all duration-500 border border-slate-200 dark:border-slate-800 ${sizeClasses[size]}`}
      id="chibi-avatar-container"
    >
      {/* Background Layer */}
      {showBackground && (
        <div className="absolute inset-0 z-0 transition-all duration-700">
          {backgroundType === "bedroom" ? (
            /* Cozy Bedroom background (soft warm gradient, starry night window / bedroom vibe) */
            <div className="w-full h-full bg-gradient-to-tr from-amber-50 to-indigo-100 dark:from-slate-900 dark:to-indigo-950 flex items-center justify-center overflow-hidden">
              <div className="absolute top-2 left-3 w-16 h-10 bg-white/40 dark:bg-slate-800/40 rounded-lg blur-xs border border-white/20"></div> {/* window */}
              <div className="absolute bottom-0 w-full h-1/4 bg-amber-100/50 dark:bg-amber-950/20 blur-sm"></div> {/* desk line */}
              <div className="absolute right-4 bottom-4 w-6 h-10 bg-emerald-300/40 rounded-full blur-xs"></div> {/* cozy plant */}
            </div>
          ) : (
            /* Vibrant attractive chat page background */
            <div className="w-full h-full bg-gradient-to-tr from-purple-500 via-indigo-500 to-pink-500 dark:from-indigo-950 dark:via-purple-950 dark:to-slate-900">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] bg-[size:16px_16px]"></div>
              <div className="absolute top-4 right-4 w-20 h-20 bg-pink-300/30 rounded-full blur-xl animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-purple-300/30 rounded-full blur-xl"></div>
            </div>
          )}
        </div>
      )}

      {/* Chibi Character SVG Render */}
      <svg
        viewBox="0 0 200 200"
        className={`w-full h-full z-10 select-none drop-shadow-lg transition-transform duration-300`}
        style={{
          animation: 
            state === "typing" 
              ? "chibi-bobbing 0.5s infinite ease-in-out" 
              : "chibi-breathing 4s infinite ease-in-out"
        }}
      >
        <defs>
          {/* Breathing Animation keyframes */}
          <style>{`
            @keyframes chibi-breathing {
              0%, 100% { transform: scaleY(1); transform-origin: bottom; }
              50% { transform: scaleY(1.025) scaleX(0.995); transform-origin: bottom; }
            }
            @keyframes chibi-bobbing {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-4px); }
            }
            @keyframes sweat-drop {
              0% { transform: translate(0, 0) scale(0); opacity: 0; }
              20% { transform: translate(-2px, 3px) scale(1); opacity: 1; }
              80% { transform: translate(-4px, 12px) scale(0.9); opacity: 0.8; }
              100% { transform: translate(-5px, 18px) scale(0); opacity: 0; }
            }
          `}</style>
        </defs>

        {/* --- SHADOWS --- */}
        <ellipse cx="100" cy="188" rx="35" ry="6" fill="rgba(0,0,0,0.15)" />

        {/* --- SHOES / FEET --- */}
        <g id="shoes">
          {/* Left Shoe */}
          <ellipse 
            cx="85" 
            cy="183" 
            rx="12" 
            ry="6" 
            fill={shoesColors[config.shoes]} 
            stroke="#2C3E50" 
            strokeWidth="2" 
          />
          <ellipse cx="85" cy="180" rx="8" ry="2" fill="white" opacity="0.4" />
          
          {/* Right Shoe */}
          <ellipse 
            cx="115" 
            cy="183" 
            rx="12" 
            ry="6" 
            fill={shoesColors[config.shoes]} 
            stroke="#2C3E50" 
            strokeWidth="2" 
          />
          <ellipse cx="115" cy="180" rx="8" ry="2" fill="white" opacity="0.4" />
        </g>

        {/* --- LEGS / PANTS --- */}
        <g id="pants">
          {/* Left Leg */}
          <rect 
            x="76" 
            y="145" 
            width="16" 
            height="34" 
            rx="4" 
            fill={pantsColors[config.pants]} 
            stroke="#2C3E50" 
            strokeWidth="2" 
          />
          {/* Right Leg */}
          <rect 
            x="108" 
            y="145" 
            width="16" 
            height="34" 
            rx="4" 
            fill={pantsColors[config.pants]} 
            stroke="#2C3E50" 
            strokeWidth="2" 
          />
          {/* Cuffs */}
          <rect x="75" y="174" width="18" height="5" rx="1.5" fill="#BDC3C7" opacity="0.5" />
          <rect x="107" y="174" width="18" height="5" rx="1.5" fill="#BDC3C7" opacity="0.5" />
        </g>

        {/* --- BODY / SHIRT / ARMS --- */}
        <g id="arms-body">
          {/* Left Arm */}
          <path
            d="M 64 110 C 50 120 48 135 55 140 C 62 145 66 135 70 120 Z"
            fill={topColors[config.top]}
            stroke="#2C3E50"
            strokeWidth="2"
          />
          {/* Hand Left */}
          <circle cx="53" cy="138" r="6" fill={skinColor} stroke="#2C3E50" strokeWidth="2" />

          {/* Right Arm */}
          <path
            d="M 136 110 C 150 120 152 135 145 140 C 138 145 134 135 130 120 Z"
            fill={topColors[config.top]}
            stroke="#2C3E50"
            strokeWidth="2"
          />
          {/* Hand Right */}
          <circle cx="147" cy="138" r="6" fill={skinColor} stroke="#2C3E50" strokeWidth="2" />

          {/* Torso/Shirt */}
          <path
            d="M 68 108 L 132 108 L 126 150 L 74 150 Z"
            fill={topColors[config.top]}
            stroke="#2C3E50"
            strokeWidth="2"
          />
          {/* Collar detail */}
          {config.top === "hoodie" && (
            <g>
              <path d="M 90 108 L 100 120 L 110 108" fill="none" stroke="#2C3E50" strokeWidth="2" />
              <line x1="97" y1="118" x2="95" y2="132" stroke="white" strokeWidth="1.5" />
              <line x1="103" y1="118" x2="105" y2="132" stroke="white" strokeWidth="1.5" />
            </g>
          )}
        </g>

        {/* --- NECK --- */}
        <rect x="92" y="94" width="16" height="15" fill={skinColor} stroke="#2C3E50" strokeWidth="2" />

        {/* --- HEAD --- */}
        <g id="head">
          {/* Ears */}
          <circle cx="58" cy="68" r="8" fill={skinColor} stroke="#2C3E50" strokeWidth="2" />
          <circle cx="142" cy="68" r="8" fill={skinColor} stroke="#2C3E50" strokeWidth="2" />

          {/* Face Base */}
          <rect 
            x="60" 
            y="35" 
            width="80" 
            height="65" 
            rx="24" 
            fill={skinColor} 
            stroke="#2C3E50" 
            strokeWidth="2" 
          />

          {/* Blush */}
          <ellipse cx="73" cy="74" rx="8" ry="4" fill="#FF8E8E" opacity="0.6" />
          <ellipse cx="127" cy="74" rx="8" ry="4" fill="#FF8E8E" opacity="0.6" />

          {/* --- EYES & EXPRESSION --- */}
          <g id="expression">
            {state === "concerned" ? (
              /* Concerned eyebrows + curved worried eyes */
              <g>
                {/* Worried Eyebrows */}
                <path d="M 70 51 L 82 56" stroke="#2C3E50" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 130 51 L 118 56" stroke="#2C3E50" strokeWidth="2.5" strokeLinecap="round" />
                
                {/* Eyes - Frowning arcs */}
                <path d="M 72 65 C 76 60, 84 60, 88 65" fill="none" stroke="#2C3E50" strokeWidth="3" strokeLinecap="round" />
                <path d="M 112 65 C 116 60, 124 60, 128 65" fill="none" stroke="#2C3E50" strokeWidth="3" strokeLinecap="round" />
                
                {/* Frowning Mouth */}
                <path d="M 94 82 Q 100 78, 106 82" fill="none" stroke="#2C3E50" strokeWidth="2.5" strokeLinecap="round" />
              </g>
            ) : state === "happy" ? (
              /* Joyful face, cute anime happy eyes and open smile */
              <g>
                {/* Upward Eyebrows */}
                <path d="M 72 51 Q 80 48, 88 52" fill="none" stroke="#2C3E50" strokeWidth="2" strokeLinecap="round" />
                <path d="M 128 51 Q 120 48, 112 52" fill="none" stroke="#2C3E50" strokeWidth="2" strokeLinecap="round" />

                {/* Happy Crescent Eyes */}
                <path d="M 72 64 Q 80 56, 88 64" fill="none" stroke="#2C3E50" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M 112 64 Q 120 56, 128 64" fill="none" stroke="#2C3E50" strokeWidth="3.5" strokeLinecap="round" />

                {/* Big happy open mouth */}
                <path d="M 93 78 Q 100 90, 107 78 Z" fill="#E74C3C" stroke="#2C3E50" strokeWidth="2" />
              </g>
            ) : (
              /* Neutral/Idle soft smiling state */
              <g>
                {/* Eyebrows */}
                <line x1="72" y1="52" x2="86" y2="52" stroke="#2C3E50" strokeWidth="2" strokeLinecap="round" />
                <line x1="114" y1="52" x2="128" y2="52" stroke="#2C3E50" strokeWidth="2" strokeLinecap="round" />

                {/* Standard Eyes (Large cute pupils with highlight shine) */}
                <circle cx="79" cy="65" r="7" fill="#2C3E50" />
                <circle cx="77" cy="62" r="2.5" fill="white" />
                <circle cx="81" cy="67" r="1" fill="white" />

                <circle cx="121" cy="65" r="7" fill="#2C3E50" />
                <circle cx="119" cy="62" r="2.5" fill="white" />
                <circle cx="123" cy="67" r="1" fill="white" />

                {/* Sweet gentle mouth smile */}
                <path d="M 95 78 Q 100 83, 105 78" fill="none" stroke="#2C3E50" strokeWidth="2.5" strokeLinecap="round" />
              </g>
            )}
          </g>

          {/* --- HAIR STYLES --- */}
          <g id="hair" fill={hairColor}>
            {/* Back Hair Layer */}
            {config.gender === "girl" && (
              <g>
                {/* Twin puffy buns or long pigtails */}
                <circle cx="50" cy="40" r="16" stroke="#2C3E50" strokeWidth="2" />
                <circle cx="150" cy="40" r="16" stroke="#2C3E50" strokeWidth="2" />
                <circle cx="48" cy="38" r="10" fill="#70483C" />
                <circle cx="152" cy="38" r="10" fill="#70483C" />
              </g>
            )}

            {/* Front Bangs (overlays forehead nicely) */}
            {config.gender === "boy" ? (
              /* Cool spiked hair */
              <path
                d="M 58 45 Q 100 15, 142 45 Q 130 35, 120 38 Q 100 25, 80 38 Q 70 35, 58 45 Z"
                stroke="#2C3E50"
                strokeWidth="2"
              />
            ) : config.gender === "girl" ? (
              /* Flowy cute bangs */
              <path
                d="M 58 45 C 70 35, 90 35, 100 48 C 110 35, 130 35, 142 45 L 142 35 C 142 15, 58 15, 58 35 Z"
                stroke="#2C3E50"
                strokeWidth="2"
              />
            ) : (
              /* Wavy medium bangs */
              <path
                d="M 58 45 Q 100 22, 142 45 Q 120 30, 100 36 Q 80 30, 58 45 Z"
                stroke="#2C3E50"
                strokeWidth="2"
              />
            )}
          </g>
        </g>

        {/* --- ACCESSORIES: HATS --- */}
        {config.hat !== "none" && (
          <g id="hat-accessory">
            {config.hat === "beanie" && (
              /* Cute snug beanie over head */
              <g>
                <path
                  d="M 56 36 C 56 12, 144 12, 144 36 Z"
                  fill={hatColors.beanie}
                  stroke="#2C3E50"
                  strokeWidth="2"
                />
                {/* Brim */}
                <path
                  d="M 52 36 Q 100 32, 148 36 L 148 42 Q 100 38, 52 42 Z"
                  fill="#FF4B4B"
                  stroke="#2C3E50"
                  strokeWidth="2"
                />
                {/* Puffy pompom */}
                <circle cx="100" cy="11" r="9" fill="white" stroke="#2C3E50" strokeWidth="2" />
              </g>
            )}

            {config.hat === "cap" && (
              /* Sporty snapback baseball cap */
              <g>
                {/* Dome */}
                <path
                  d="M 58 36 C 58 16, 142 16, 142 36 Z"
                  fill={hatColors.cap}
                  stroke="#2C3E50"
                  strokeWidth="2"
                />
                {/* Visor/Brim */}
                <path
                  d="M 130 36 C 150 36, 175 42, 175 48 C 175 48, 145 48, 130 40 Z"
                  fill="#1B60C4"
                  stroke="#2C3E50"
                  strokeWidth="2"
                />
                {/* Emblem */}
                <circle cx="100" cy="26" r="5" fill="white" />
                <path d="M 98 26 L 102 26" stroke="#1B60C4" strokeWidth="1.5" />
                <path d="M 100 24 L 100 28" stroke="#1B60C4" strokeWidth="1.5" />
              </g>
            )}

            {config.hat === "headphones" && (
              /* Sleek modern over-ear gaming/music headphones */
              <g>
                {/* Band */}
                <path
                  d="M 56 68 C 56 22, 144 22, 144 68"
                  fill="none"
                  stroke={hatColors.headphones}
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                {/* Left Ear Cup */}
                <rect 
                  x="50" 
                  y="52" 
                  width="10" 
                  height="26" 
                  rx="4" 
                  fill={hatColors.headphones} 
                  stroke="#2C3E50" 
                  strokeWidth="2" 
                />
                {/* Right Ear Cup */}
                <rect 
                  x="140" 
                  y="52" 
                  width="10" 
                  height="26" 
                  rx="4" 
                  fill={hatColors.headphones} 
                  stroke="#2C3E50" 
                  strokeWidth="2" 
                />
                {/* Details */}
                <line x1="56" y1="58" x2="56" y2="72" stroke="white" strokeWidth="2" opacity="0.6" />
                <line x1="144" y1="58" x2="144" y2="72" stroke="white" strokeWidth="2" opacity="0.6" />
              </g>
            )}
          </g>
        )}

        {/* --- DYNAMIC EFFECT ELEMENTS --- */}
        {state === "concerned" && (
          /* Anxiety blue sweat-drop animating on their forehead */
          <g transform="translate(138, 54)">
            <path
              d="M 0,0 C -3,3 -5,7 -5,10 C -5,13 -2,15 1,15 C 4,15 7,13 7,10 C 7,7 4,3 1,0 Z"
              fill="#2980B9"
              style={{
                transformOrigin: "center",
                animation: "sweat-drop 2.2s infinite ease-in"
              }}
            />
          </g>
        )}
      </svg>
    </div>
  );
}
