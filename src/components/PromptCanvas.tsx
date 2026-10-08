import React from "react";
import { VisualElement } from "../types";

interface PromptCanvasProps {
  elements: VisualElement[];
  theme: string;
  score: number;
  isLoading: boolean;
  error?: string | null;
}

export default function PromptCanvas({ elements, theme, score, isLoading, error }: PromptCanvasProps) {
  // Helper to find a specific element
  const getEl = (type: string) => elements.find((e) => e.type === type);

  // Render a lovely, techy blueprint placeholder if no evaluations have occurred yet
  const noElements = elements.length === 0;

  return (
    <div className="relative w-full aspect-square bg-[#0c0d12] rounded-xl border border-gray-800 overflow-hidden flex flex-col items-center justify-center shadow-2xl group transition-all duration-300 hover:border-cyan-500/50">
      {/* Decorative grid pattern background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

      {/* State indicators */}
      {isLoading ? (
        <div className="absolute inset-0 bg-[#0c0d12]/90 flex flex-col items-center justify-center z-25 backdrop-blur-xs">
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
            <div className="absolute w-12 h-12 border-4 border-dashed border-purple-500/30 border-t-purple-400 rounded-full animate-spin animate-reverse" />
            <span className="text-xs font-mono text-cyan-400 font-bold animate-pulse">GEN</span>
          </div>
          <p className="mt-4 text-xs font-mono text-gray-400 tracking-wide text-center uppercase">
            Synthesizing prompt tokens...
          </p>
          <div className="w-1/3 h-1 bg-gray-900 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-linear-to-r from-cyan-400 to-purple-500 animate-[pulse_1.5s_infinite]" style={{ width: '100%' }} />
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="absolute inset-0 bg-[#0c0d12]/95 flex flex-col items-center justify-center p-6 z-25 text-center space-y-4 border border-rose-500/30">
          <div className="w-12 h-12 rounded-full bg-rose-950/45 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-inner">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <div>
            <h4 className="font-mono text-xs font-bold text-rose-400 uppercase tracking-wider">Evaluation Error</h4>
            <p className="text-xs text-gray-400 max-w-xs mt-1.5 leading-relaxed font-sans font-medium">
              We encountered an issue matching your prompt with the server.
            </p>
            <p className="text-[10px] font-mono text-rose-400/90 bg-rose-955/15 border border-rose-900/30 px-3 py-1.5 rounded-md mt-2 max-w-xs break-words">
              {error}
            </p>
          </div>
          <p className="text-[9px] font-mono text-gray-600">
            Please check your syntax or try resubmitting.
          </p>
        </div>
      ) : null}

      {noElements ? (
        <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center text-cyan-500 shadow-inner group-hover:scale-110 transition-transform duration-300">
            <code className="text-lg font-mono font-bold">&lt;/&gt;</code>
          </div>
          <div>
            <h4 className="font-mono text-sm font-semibold text-gray-300">Awaiting Generation</h4>
            <p className="text-xs text-gray-500 max-w-xs mt-1 leading-relaxed">
              Your prompt compilation instructions are empty. Type and submit to materialise the vector world.
            </p>
          </div>
          <div className="px-3 py-1 bg-[#151821] border border-gray-800 rounded-md">
            <span className="text-[10px] font-mono text-gray-500">CANVAS_STATUS: IDLE // PORT 3000</span>
          </div>
        </div>
      ) : (
        <div className="w-full h-full relative">
          {/* Main SVG Frame */}
          <svg
            viewBox="0 0 400 400"
            className="w-full h-full object-contain transition-all duration-500"
            style={{ filter: "drop-shadow(0 10px 15px rgba(0,0,0,0.4))" }}
          >
            {/* GRADIENTS DEF */}
            <defs>
              {/* Woody table gradient */}
              <linearGradient id="woodGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#412918" />
                <stop offset="50%" stopColor="#2c1a0e" />
                <stop offset="100%" stopColor="#1c0f07" />
              </linearGradient>
              <linearGradient id="deadWoodGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#2b2d30" />
                <stop offset="100%" stopColor="#151618" />
              </linearGradient>

              {/* Apple Gradient */}
              <radialGradient id="appleGrad" cx="35%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#ff4d4d" />
                <stop offset="70%" stopColor="#b30000" />
                <stop offset="100%" stopColor="#660000" />
              </radialGradient>
              <radialGradient id="grayAppleGrad" cx="35%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#dedede" />
                <stop offset="70%" stopColor="#7a7a7a" />
                <stop offset="100%" stopColor="#3d3d3d" />
              </radialGradient>

              {/* Space gradients */}
              <radialGradient id="spaceBg" cx="50%" cy="50%" r="75%">
                <stop offset="0%" stopColor="#0f1123" />
                <stop offset="50%" stopColor="#080914" />
                <stop offset="100%" stopColor="#020309" />
              </radialGradient>
              <radialGradient id="nebulaGrad" cx="30%" cy="40%" r="60%">
                <stop offset="0%" stopColor="#5b21b6" stopOpacity="0.45" />
                <stop offset="55%" stopColor="#4338ca" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0" />
              </radialGradient>

              {/* Balloon glowing */}
              <radialGradient id="yellowBalloonGrad" cx="35%" cy="30%" r="65%">
                <stop offset="0%" stopColor="#ffe494" />
                <stop offset="60%" stopColor="#ffbe0b" />
                <stop offset="100%" stopColor="#cc9600" />
              </radialGradient>
              <radialGradient id="deadBalloonGrad" cx="35%" cy="30%" r="65%">
                <stop offset="0%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#334155" />
              </radialGradient>

              {/* Neon Glow Filters */}
              <filter id="glowPurple" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="glowGold" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="10" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* THEME 1: Autumn Fruit */}
            {theme === "autumn_fruit" && (
              <>
                {/* 1. Wood Table Bottom Half */}
                <rect
                  x="0"
                  y="0"
                  width="400"
                  height="400"
                  fill={getEl("table")?.visible ? "url(#woodGrad)" : "#13141f"}
                  className="transition-all duration-700"
                />

                {/* Sub-detail Table Grain */}
                {getEl("table")?.visible && getEl("table")?.intensity! > 0.5 && (
                  <g stroke="#ffffff" strokeOpacity="0.04" strokeWidth="2">
                    <line x1="0" y1="120" x2="400" y2="120" />
                    <line x1="0" y1="200" x2="400" y2="200" />
                    <line x1="0" y1="280" x2="400" y2="280" />
                    <line x1="0" y1="340" x2="400" y2="340" />
                    <path d="M 50 150 Q 150 160 250 150 T 400 160" fill="none" />
                    <path d="M 0 250 Q 180 240 300 260 T 400 245" fill="none" />
                  </g>
                )}

                {/* Ambient Table Shadow */}
                {getEl("shadow")?.visible && (
                  <ellipse
                    cx="200"
                    cy="270"
                    rx="110"
                    ry="25"
                    fill="black"
                    opacity={getEl("shadow")?.intensity || 0.6}
                    className="transition-all duration-700"
                  />
                )}

                {/* The Apple itself */}
                {getEl("apple")?.visible && (
                  <g className="transition-all duration-700">
                    {/* Stem curved */}
                    <path
                      d="M 200 160 Q 215 125 235 120"
                      fill="none"
                      stroke="#854d0e"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />

                    {/* Left Leaf */}
                    {getEl("leaf")?.visible && (
                      <path
                        d="M 215 138 Q 235 130 245 142 T 215 138"
                        fill={getEl("leaf")?.color || "#10b981"}
                        className="animate-pulse origin-center"
                        style={{ animationDuration: "3s" }}
                      />
                    )}

                    {/* Apple main globe with grad */}
                    <circle
                      cx="200"
                      cy="210"
                      r="65"
                      fill={
                        getEl("apple")?.color === "#d62828"
                          ? "url(#appleGrad)"
                          : "url(#grayAppleGrad)"
                      }
                    />

                    {/* Stylised indentation curves top */}
                    <path d="M 180 155 Q 200 167 220 155" fill="none" stroke="#2c1a0e" strokeWidth="2" opacity="0.3" />

                    {/* Glossy highlight 3D bulb arc */}
                    <path
                      d="M 160 185 A 45 45 0 0 1 200 160"
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth="5"
                      strokeLinecap="round"
                      opacity="0.35"
                    />
                  </g>
                )}
              </>
            )}

            {/* THEME 2: Cyberpunk Alley */}
            {theme === "cyberpunk_alley" && (
              <>
                {/* 1. Sidewalk Floor surface */}
                <rect
                  x="0"
                  y="0"
                  width="400"
                  height="400"
                  fill={getEl("ground")?.visible ? "#111219" : "#020205"}
                />

                {/* Wet Puddle overlay with reflections */}
                {getEl("ground")?.visible && getEl("ground")?.intensity! > 0.5 && (
                  <g opacity="0.45">
                    {/* Cyan reflective pool */}
                    <ellipse cx="200" cy="330" rx="140" ry="25" fill="#06b6d4" opacity="0.2" filter="blur(4px)" />
                    {/* Purple reflective pool */}
                    <ellipse cx="140" cy="350" rx="90" ry="15" fill="#a855f7" opacity="0.25" filter="blur(3px)" />
                    {/* Puddle ripple rings */}
                    <ellipse cx="200" cy="330" rx="110" ry="14" fill="none" stroke="#06b6d4" strokeWidth="1" opacity="0.3" />
                  </g>
                )}

                {/* Perspective Walls of narrow alley */}
                {getEl("walls")?.visible && (
                  <g className="transition-all duration-700">
                    {/* Left wall block in perspective */}
                    <polygon points="0,0 120,150 120,280 0,400" fill="#1b1c26" />
                    {/* Right wall block in perspective */}
                    <polygon points="400,0 280,150 280,280 400,400" fill="#1b1c26" />
                    {/* Perspective lines */}
                    <line x1="0" y1="0" x2="120" y2="150" stroke="#334155" strokeWidth="1.5" />
                    <line x1="0" y1="400" x2="120" y2="280" stroke="#334155" strokeWidth="1.5" />
                    <line x1="400" y1="0" x2="280" y2="150" stroke="#334155" strokeWidth="1.5" />
                    <line x1="400" y1="400" x2="280" y2="280" stroke="#334155" strokeWidth="1.5" />
                    {/* Far background horizon alley end */}
                    <rect x="120" y="150" width="160" height="130" fill="#090a0f" />
                  </g>
                )}

                {/* Neon Purple Sign left wall */}
                {getEl("neon_purple")?.visible && (
                  <g filter="url(#glowPurple)">
                    {/* The sign body */}
                    <rect x="25" y="60" width="60" height="150" fill="none" stroke="#c77dff" strokeWidth="3" rx="4" />
                    {/* Stylized signs interior */}
                    <text x="55" y="100" fill="#c77dff" fontSize="16" fontFamily="monospace" textAnchor="middle" fontWeight="bold">BAR</text>
                    <text x="55" y="140" fill="#c77dff" fontSize="20" fontFamily="monospace" textAnchor="middle" fontWeight="bold">ネ</text>
                    <text x="55" y="180" fill="#c77dff" fontSize="20" fontFamily="monospace" textAnchor="middle" fontWeight="bold">オ</text>
                  </g>
                )}

                {/* Neon Cyan Sign right wall */}
                {getEl("neon_cyan")?.visible && (
                  <g filter="url(#glowCyan)">
                    {/* Projected cyan neon pillar */}
                    <rect x="315" y="50" width="55" height="170" fill="none" stroke="#4cc9f0" strokeWidth="3" rx="4" />
                    <line x1="342" y1="60" x2="342" y2="210" stroke="#4cc9f0" strokeWidth="1.5" strokeDasharray="5,5" />
                    <text x="342" y="115" fill="#4cc9f0" fontSize="11" fontFamily="monospace" textAnchor="middle" transform="rotate(90 342 115)">OPEN</text>
                    <text x="342" y="165" fill="#4cc9f0" fontSize="12" fontFamily="monospace" textAnchor="middle" transform="rotate(90 342 165)">24H</text>
                  </g>
                )}

                {/* Rain particles screen overlaid */}
                {getEl("rain")?.visible && (
                  <g stroke="#94a3b8" strokeWidth="1" strokeLinecap="round" opacity="0.5" className="animate-[pulse_1s_infinite]">
                    <line x1="50" y1="20" x2="40" y2="60" />
                    <line x1="150" y1="10" x2="140" y2="50" />
                    <line x1="250" y1="30" x2="240" y2="70" />
                    <line x1="350" y1="15" x2="340" y2="55" />
                    
                    <line x1="90" y1="120" x2="80" y2="160" />
                    <line x1="190" y1="110" x2="180" y2="150" />
                    <line x1="290" y1="130" x2="280" y2="170" />
                    
                    <line x1="30" y1="240" x2="20" y2="280" />
                    <line x1="130" y1="220" x2="120" y2="260" />
                    <line x1="230" y1="250" x2="220" y2="290" />
                    <line x1="330" y1="230" x2="320" y2="270" />
                  </g>
                )}
              </>
            )}

            {/* THEME 3: Lost Astronaut */}
            {theme === "lost_astronaut" && (
              <>
                {/* 1. Deep space background */}
                <rect
                  x="0"
                  y="0"
                  width="400"
                  height="400"
                  fill="url(#spaceBg)"
                />

                {/* Stars layers */}
                {getEl("background")?.visible && (
                  <g fill="#ffffff" opacity={getEl("background")?.intensity || 1}>
                    {/* Tiny twinkling stars */}
                    <circle cx="45" cy="55" r="1.5" className="animate-pulse" style={{ animationDuration: "1s" }} />
                    <circle cx="120" cy="30" r="1" />
                    <circle cx="85" cy="180" r="1.2" className="animate-pulse" style={{ animationDuration: "1.5s" }} />
                    <circle cx="150" cy="230" r="1.5" />
                    <circle cx="320" cy="75" r="1.8" className="animate-pulse" style={{ animationDuration: "2s" }} />
                    <circle cx="280" cy="140" r="1" />
                    <circle cx="360" cy="220" r="1.3" />
                    <circle cx="250" cy="50" r="2.2" className="animate-pulse" />
                    <circle cx="95" cy="320" r="1.5" />
                    <circle cx="310" cy="340" r="1" />
                    <circle cx="180" cy="90" r="1.6" />
                  </g>
                )}

                {/* Gas Nebula */}
                {getEl("nebula")?.visible && (
                  <rect
                    x="0"
                    y="0"
                    width="400"
                    height="400"
                    fill="url(#nebulaGrad)"
                    className="transition-all duration-700"
                  />
                )}

                {/* Floating astronaut */}
                {getEl("astronaut")?.visible && (
                  <g
                    className="transition-all duration-700 animate-bounce"
                    style={{ animationDuration: "4s" }}
                    transform="translate(15, 15)"
                  >
                    {/* Suit shadow tether lines */}
                    <line x1="165" y1="210" x2="225" y2="120" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.4" />

                    {/* Backpack */}
                    <rect x="145" y="175" width="22" height="42" fill="#94a3b8" rx="3" />

                    {/* Body suit */}
                    <rect x="155" y="170" width="35" height="45" fill="#f1f5f9" rx="8" />
                    {/* Arms and shoulder */}
                    <rect x="144" y="180" width="12" height="24" fill="#cbd5e1" rx="4" />
                    <rect x="187" y="180" width="12" height="24" fill="#cbd5e1" rx="4" />

                    {/* Boots */}
                    <rect x="158" y="215" width="13" height="10" fill="#64748b" rx="2" />
                    <rect x="174" y="215" width="13" height="10" fill="#64748b" rx="2" />

                    {/* Helmet dome */}
                    <circle cx="1725" cy="1550" r="22" fill="#f8fafc" transform="scale(0.1)" />
                    
                    {/* Glass Visor dome */}
                    <ellipse cx="173" cy="152" rx="16" ry="12" fill="#1e293b" />
                    <path d="M 162 148 Q 173 142 181 148" fill="none" stroke="#38bdf8" strokeWidth="2.5" opacity="0.75" />
                  </g>
                )}

                {/* Balloon linked by string tohand */}
                {getEl("balloon")?.visible && (
                  <g className="transition-all duration-700">
                    {/* Curved string leading to right boot area */}
                    <path
                      d="M 240 100 Q 215 150 210 195"
                      fill="none"
                      stroke="#d1d5db"
                      strokeWidth="1"
                    />

                    {/* Yellow glowing sphere */}
                    <circle
                      cx="240"
                      cy="90"
                      r="25"
                      fill={
                        getEl("balloon")?.color === "#ffd166"
                          ? "url(#yellowBalloonGrad)"
                          : "url(#deadBalloonGrad)"
                      }
                      filter={getEl("balloon")?.color === "#ffd166" ? "url(#glowGold)" : undefined}
                    />

                    {/* Little knot bottom of balloon */}
                    <polygon points="240,115 236,122 244,122" fill="#ffbe0b" />
                  </g>
                )}
              </>
            )}

            {/* THEME 4: Forest Sanctuary */}
            {theme === "forest_sanctuary" && (
              <>
                {/* 1. Canopy backdrop deep emerald */}
                <rect
                  x="0"
                  y="0"
                  width="400"
                  height="400"
                  fill={getEl("background")?.visible ? "#03140c" : "#0d110f"}
                />

                {/* Layered Silhouetted Trees background */}
                {getEl("background")?.visible && (
                  <g className="transition-all duration-700">
                    {/* Far distant light green forest canopies */}
                    <path d="M -50 400 L 20 280 L 90 400 Z" fill="#042a17" opacity="0.4" />
                    <path d="M 50 400 L 140 230 L 230 400 Z" fill="#042a17" opacity="0.4" />
                    <path d="M 190 400 L 270 260 L 350 400 Z" fill="#042a17" opacity="0.4" />
                    <path d="M 300 400 L 360 290 L 410 400 Z" fill="#042a17" opacity="0.4" />

                    {/* Mid-ground closer darker trees */}
                    <path d="M -20 400 L 60 270 L 140 400 Z" fill="#021c10" opacity="0.75" />
                    <path d="M 110 400 L 180 250 L 250 400 Z" fill="#021c10" opacity="0.75" />
                    <path d="M 230 400 L 320 230 L 410 400 Z" fill="#021c10" opacity="0.75" />
                  </g>
                )}

                {/* Minimalist Golden Pagoda Shrine */}
                {getEl("temple")?.visible && (
                  <g
                    className="transition-all duration-700 origin-bottom"
                    filter={getEl("temple")?.color === "#ffbe0b" ? "url(#glowGold)" : undefined}
                  >
                    {/* Stone Platform foundation */}
                    <rect x="140" y="325" width="120" height="15" fill="#4b5563" rx="1.5" />
                    <rect x="150" y="315" width="100" height="10" fill="#374151" rx="1" />

                    {/* Levels of Temple roofs */}
                    {/* Floor 1 Room body */}
                    <rect x="165" y="275" width="70" height="40" fill="#1e293b" stroke="#e2e8f0" strokeWidth="1" />
                    <rect x="190" y="285" width="20" height="30" fill="#ffbe0b" opacity="0.8" /> {/* Red glowing inner sanctuary door */}

                    {/* Roof Tier 1 with curved edges */}
                    <path d="M 140 275 Q 200 255 260 275 L 250 265 L 150 265 Z" fill="#b45309" stroke="#ffbe0b" strokeWidth="1.5" />

                    {/* Floor 2 Room mini body */}
                    <rect x="175" y="235" width="50" height="30" fill="#1e293b" stroke="#e2e8f0" strokeWidth="0.8" />
                    
                    {/* Roof Tier 2 curved */}
                    <path d="M 155 235 Q 200 215 245 235 L 235 225 L 165 225 Z" fill="#b45309" stroke="#ffbe0b" strokeWidth="1.5" />

                    {/* Top Spire spike rod */}
                    <line x1="200" y1="225" x2="200" y2="185" stroke="#ffbe0b" strokeWidth="3" strokeLinecap="round" />
                    <circle cx="200" cy="180" r="4.5" fill="#ffbe0b" />
                  </g>
                )}

                {/* Floating white fog overlays */}
                {getEl("mist")?.visible && (
                  <g fill="#f1f5f9" opacity="0.3" className="animate-[pulse_4s_infinite]">
                    {/* Mist clouds drifting */}
                    <path d="M 0 100 Q 120 70 240 100 T 400 90 L 400 130 Q 280 150 120 120 T 0 130 Z" filter="blur(6px)" />
                    <path d="M 0 280 Q 150 260 280 290 T 400 270 L 400 310 Q 280 330 150 300 T 0 310 Z" filter="blur(8px)" opacity="0.4" />
                  </g>
                )}
              </>
            )}

            {/* THEME 5: Desert Oasis */}
            {theme === "desert_oasis" && (
              <>
                {/* 1. Sky / Dunes backdrop */}
                <rect
                  x="0"
                  y="0"
                  width="400"
                  height="400"
                  fill="#f4a261"
                />

                {/* Sun */}
                {getEl("sun")?.visible && (
                  <circle
                    cx="200"
                    cy="140"
                    r="55"
                    fill={getEl("sun")?.color === "#e76f51" ? "#e76f51" : "#ffd166"}
                    className="animate-pulse"
                    opacity="0.9"
                    filter="url(#glowGold)"
                  />
                )}

                {/* Overlapping Dunes */}
                {getEl("dunes")?.visible && (
                  <g className="transition-all duration-700">
                    {/* Background dune */}
                    <path
                      d="M -50 400 Q 120 220 280 320 T 450 300 L 450 400 Z"
                      fill="#e9c46a"
                      opacity="0.85"
                    />
                    {/* Foreground dune */}
                    <path
                      d="M -220 400 Q 90 280 300 350 T 480 310 L 480 400 Z"
                      fill="#dfb350"
                    />
                  </g>
                )}

                {/* Oasis Pool */}
                {getEl("pool")?.visible && (
                  <g className="transition-all duration-700">
                    <ellipse
                      cx="200"
                      cy="360"
                      rx="120"
                      ry="35"
                      fill="#2a9d8f"
                      stroke="#48cae4"
                      strokeWidth="2.5"
                    />
                    <ellipse
                      cx="205"
                      cy="362"
                      rx="100"
                      ry="28"
                      fill="#0077b6"
                      opacity="0.45"
                    />
                  </g>
                )}

                {/* Palm Trees */}
                {getEl("palm")?.visible && (
                  <g className="transition-all duration-700">
                    {/* Tree Left */}
                    <g transform="translate(110, 240)">
                      {/* Trunk */}
                      <path
                        d="M 12 120 Q -5 60 10 0"
                        fill="none"
                        stroke="#5c4033"
                        strokeWidth="7"
                        strokeLinecap="round"
                      />
                      {/* Leaves */}
                      <path d="M 10 0 Q -30 -10 -50 15" fill="none" stroke="#264653" strokeWidth="4" strokeLinecap="round" />
                      <path d="M 10 0 Q -20 -30 -15 -55" fill="none" stroke="#2a9d8f" strokeWidth="4.5" strokeLinecap="round" />
                      <path d="M 10 0 Q 30 -30 55 -25" fill="none" stroke="#264653" strokeWidth="4" strokeLinecap="round" />
                      <path d="M 10 0 Q 40 10 50 35" fill="none" stroke="#2a9d8f" strokeWidth="4.5" strokeLinecap="round" />
                      <path d="M 10 0 Q 5 -35 15 -60" fill="none" stroke="#2a9d8f" strokeWidth="4" strokeLinecap="round" />
                    </g>

                    {/* Tree Right */}
                    <g transform="translate(290, 230) scale(-1, 1)">
                      {/* Trunk */}
                      <path
                        d="M 12 120 Q -10 50 10 0"
                        fill="none"
                        stroke="#5c4033"
                        strokeWidth="8"
                        strokeLinecap="round"
                      />
                      {/* Leaves */}
                      <path d="M 10 0 Q -30 -10 -45 20" fill="none" stroke="#264653" strokeWidth="4" strokeLinecap="round" />
                      <path d="M 10 0 Q -15 -35 -10 -60" fill="none" stroke="#2a9d8f" strokeWidth="4" strokeLinecap="round" />
                      <path d="M 10 0 Q 35 -25 50 -15" fill="none" stroke="#264653" strokeWidth="4.5" strokeLinecap="round" />
                      <path d="M 10 0 Q 5 -40 15 -65" fill="none" stroke="#2a9d8f" strokeWidth="4" strokeLinecap="round" />
                    </g>
                  </g>
                )}
              </>
            )}

            {/* THEME 6: Volcano Caldera */}
            {theme === "volcano_caldera" && (
              <>
                {/* 1. Hot sky */}
                <rect
                  x="0"
                  y="0"
                  width="400"
                  height="400"
                  fill="#151111"
                />

                {/* Back volcanic glow */}
                {getEl("glow")?.visible && (
                  <circle
                    cx="200"
                    cy="250"
                    r="140"
                    fill="#f95738"
                    opacity="0.3"
                    filter="blur(16px)"
                  />
                )}

                {/* Smoke Plumes */}
                {getEl("smoke")?.visible && (
                  <g className="transition-all duration-700 opacity-60">
                    <circle cx="200" cy="120" r="50" fill="#4a4e69" filter="blur(12px)" />
                    <circle cx="160" cy="90" r="45" fill="#3d3a4f" filter="blur(10px)" />
                    <circle cx="240" cy="80" r="55" fill="#4a4e69" filter="blur(14px)" />
                  </g>
                )}

                {/* Crater Walls */}
                {getEl("crater")?.visible && (
                  <g className="transition-all duration-700">
                    {/* Left rock wall */}
                    <path
                      d="M -10 400 L 120 200 L 160 210 L 110 400 Z"
                      fill="#252427"
                    />
                    <path
                      d="M -10 400 L 90 240 L 120 400 Z"
                      fill="#1e1e20"
                    />
                    {/* Right rock wall */}
                    <path
                      d="M 410 400 L 280 200 L 240 215 L 290 400 Z"
                      fill="#252427"
                    />
                    <path
                      d="M 410 400 L 310 230 L 280 400 Z"
                      fill="#1e1e20"
                    />
                  </g>
                )}

                {/* Lava Flow */}
                {getEl("lava")?.visible && (
                  <g className="transition-all duration-700">
                    {/* Solid volcanic base pit */}
                    <path
                      d="M 110 400 L 160 210 Q 200 240 240 215 L 290 400 Z"
                      fill="#f95738"
                      stroke="#ff9f1c"
                      strokeWidth="3"
                    />
                    <ellipse
                      cx="200"
                      cy="260"
                      rx="55"
                      ry="28"
                      fill="#ffe494"
                      filter="url(#glowGold)"
                      className="animate-pulse"
                    />
                    {/* Spitting lava drops */}
                    <circle cx="170" cy="190" r="3.5" fill="#ff9f1c" opacity="0.8" />
                    <circle cx="230" cy="180" r="4" fill="#f95738" opacity="0.9" />
                    <circle cx="205" cy="165" r="2.5" fill="#ffe494" opacity="0.9" />
                  </g>
                )}
              </>
            )}

            {/* THEME 7: Subsea Coral Reef */}
            {theme === "subsea_coral" && (
              <>
                {/* Undersea blue background */}
                <rect
                  x="0"
                  y="0"
                  width="400"
                  height="400"
                  fill="#005f73"
                />

                {/* Aquatic lights background */}
                {getEl("water")?.visible && (
                  <linearGradient id="oceanRays" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#94d2bd" stopOpacity="0.4" />
                    <stop offset="50%" stopColor="#0a9396" stopOpacity="0" />
                  </linearGradient>
                )}
                {getEl("water")?.visible && (
                  <rect x="0" y="0" width="400" height="400" fill="url(#oceanRays)" />
                )}

                {/* Bubbles */}
                {getEl("bubbles")?.visible && (
                  <g className="transition-all duration-700 stroke-cyan-200 fill-none" opacity="0.6">
                    <circle cx="90" cy="280" r="6" strokeWidth="1.5" />
                    <circle cx="95" cy="210" r="10" strokeWidth="2" />
                    <circle cx="270" cy="300" r="4" strokeWidth="1" />
                    <circle cx="290" cy="220" r="9" strokeWidth="1.8" />
                    <circle cx="310" cy="150" r="5" strokeWidth="1.2" />
                  </g>
                )}

                {/* Corals */}
                {getEl("coral")?.visible && (
                  <g className="transition-all duration-700">
                    {/* Right Branching Corals */}
                    <path
                      d="M 320 400 C 310 330 250 350 240 310"
                      fill="none"
                      stroke="#ae2012"
                      strokeWidth="11"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 300 370 C 290 310 330 300 340 270"
                      fill="none"
                      stroke="#ca6702"
                      strokeWidth="8"
                      strokeLinecap="round"
                    />
                    {/* Left Brain Corals */}
                    <path
                      d="M 70 400 C 60 350 110 330 140 340 M 100 360 C 130 350 110 320 90 290"
                      fill="none"
                      stroke="#e9d8a6"
                      strokeWidth="9"
                      strokeLinecap="round"
                    />
                  </g>
                )}

                {/* Yellow Fish */}
                {getEl("fish")?.visible && (
                  <g className="transition-all duration-700">
                    {/* Big fish */}
                    <g transform="translate(180, 180)">
                      <path
                        d="M -20 0 C -40 -12 -5 30 25 0 C 15 -18 -10 -15 -20 0 Z"
                        fill="#f9c74f"
                      />
                      {/* Tail */}
                      <path
                        d="M -20 0 L -35 -15 L -30 0 L -35 15 Z"
                        fill="#f3722c"
                      />
                      {/* Eye */}
                      <circle cx="15" cy="-3" r="2.5" fill="#000" />
                    </g>

                    {/* Small fish list */}
                    <g transform="translate(260, 120) scale(0.6)">
                      <path d="M -20 0 C -40 -12 -5 30 25 0 C 15 -18 -10 -15 -20 0 Z" fill="#ff9f1c" />
                      <path d="M -20 0 L -32 -10 L -28 0 L -32 10 Z" fill="#f3722c" />
                      <circle cx="15" cy="-2" r="2" fill="#000" />
                    </g>
                  </g>
                )}
              </>
            )}

            {/* THEME 8: Steampunk Workshop */}
            {theme === "steampunk_workshop" && (
              <>
                {/* 1. Backdrop */}
                <rect
                  x="0"
                  y="0"
                  width="400"
                  height="400"
                  fill="#1b120c"
                />

                {/* Pipes */}
                {getEl("pipes")?.visible && (
                  <g className="transition-all duration-700 stroke-[#8b5a2b] fill-none" strokeLinecap="square">
                    {/* Copper Tubes crossing */}
                    <path d="M 0 60 L 400 60" strokeWidth="12" />
                    <path d="M 0 65 L 400 65" stroke="#a0522d" strokeWidth="3" />

                    <path d="M 80 60 L 80 400" strokeWidth="15" />
                    <path d="M 85 60 L 85 400" stroke="#a0522d" strokeWidth="4" />

                    {/* Pressure meters / Valve */}
                    <circle cx="85" cy="140" r="22" fill="#d4af37" stroke="#1b120c" strokeWidth="3.5" />
                    <circle cx="85" cy="140" r="16" fill="#f5ebe0" />
                    {/* Gauge meter needle */}
                    <line x1="85" y1="140" x2="95" y2="130" stroke="#ae2012" strokeWidth="2.5" />
                  </g>
                )}

                {/* Rotating Brass Gears */}
                {getEl("gears")?.visible && (
                  <g className="transition-all duration-700" fill="#d4af37" stroke="#5c4033" strokeWidth="1.5">
                    {/* Center Gear 1 */}
                    <g transform="translate(240, 240)" className="animate-[spin_20s_linear_infinite]">
                      <circle cx="0" cy="0" r="60" />
                      <circle cx="0" cy="0" r="45" fill="#1b120c" />
                      {/* Notch Teeth */}
                      {Array.from({ length: 8 }).map((_, i) => (
                        <rect
                          key={i}
                          x="-10"
                          y="-70"
                          width="20"
                          height="20"
                          transform={`rotate(${i * 45})`}
                        />
                      ))}
                      <circle cx="0" cy="0" r="15" fill="#d4af37" />
                    </g>

                    {/* Interlocking Gear 2 */}
                    <g transform="translate(130, 310)" className="animate-[spin_12s_linear_infinite] origin-center scale-75" style={{ animationDirection: "reverse" }}>
                      <circle cx="0" cy="0" r="60" />
                      <circle cx="0" cy="0" r="42" fill="#1b120c" />
                      {Array.from({ length: 8 }).map((_, i) => (
                        <rect
                          key={i}
                          x="-10"
                          y="-70"
                          width="20"
                          height="20"
                          transform={`rotate(${i * 45 + 22.5})`}
                        />
                      ))}
                      <circle cx="0" cy="0" r="15" fill="#d4af37" />
                    </g>
                  </g>
                )}

                {/* Glowing Lantern */}
                {getEl("lantern")?.visible && (
                  <g className="transition-all duration-700" filter="url(#glowGold)">
                    {/* Hanging Chain */}
                    <line x1="280" y1="60" x2="280" y2="110" stroke="#a0522d" strokeWidth="4" />
                    
                    {/* Lantern Body */}
                    <path
                      d="M 255 110 L 305 110 L 295 130 L 265 130 Z"
                      fill="#5c4033"
                    />
                    {/* Glass Chamber */}
                    <path
                      d="M 262 130 L 298 130 L 290 175 L 270 175 Z"
                      fill="#ffe494"
                      opacity="0.85"
                    />
                    <circle cx="280" cy="150" r="15" fill="#ffbe0b" />

                    {/* Antique Guard Caps */}
                    <path
                      d="M 265 175 L 295 175 L 280 195 Z"
                      fill="#5c4033"
                    />
                  </g>
                )}
              </>
            )}

            {/* THEME 9: Retro Arcade */}
            {theme === "retro_arcade" && (
              <>
                {/* Dark arcade hall room */}
                <rect
                  x="0"
                  y="0"
                  width="400"
                  height="400"
                  fill="#06060c"
                />

                {/* Room Neon background glow */}
                <circle
                  cx="200"
                  cy="200"
                  r="250"
                  fill="#7209b7"
                  opacity="0.1"
                  filter="blur(25px)"
                />

                {/* Cabinet box skeleton */}
                {getEl("cabinet")?.visible && (
                  <g className="transition-all duration-700">
                    {/* Main cabinet shadow backing */}
                    <path
                      d="M 120 400 L 130 110 L 270 110 L 280 400 Z"
                      fill="#12121e"
                      stroke="#f72585"
                      strokeWidth="2.5"
                    />
                    {/* Control Panel board */}
                    <path
                      d="M 100 290 L 120 260 L 280 260 L 300 290 Z"
                      fill="#240046"
                      stroke="#7209b7"
                      strokeWidth="2"
                    />
                  </g>
                )}

                {/* Active CRT Arcade Screen */}
                {getEl("screen")?.visible && (
                  <g className="transition-all duration-700">
                    <rect
                      x="142"
                      y="130"
                      width="116"
                      height="90"
                      rx="12"
                      fill="#03071e"
                      stroke="#3a0ca3"
                      strokeWidth="3.5"
                    />
                    {/* Screen Phosphor Glow */}
                    <rect
                      x="147"
                      y="135"
                      width="106"
                      height="80"
                      rx="8"
                      fill="#4cc9f0"
                      opacity="0.25"
                      filter="url(#glowCyan)"
                    />
                    
                    {/* Pixel Pixelated invader artwork in center of CRT */}
                    <g fill="#4cc9f0" transform="translate(182, 160)">
                      <rect x="0" y="0" width="8" height="8" />
                      <rect x="24" y="0" width="8" height="8" />
                      <rect x="8" y="8" width="16" height="8" />
                      <rect x="0" y="16" width="32" height="8" />
                      <rect x="4" y="24" width="24" height="6" />
                    </g>
                  </g>
                )}

                {/* Physical Joystick */}
                {getEl("joystick")?.visible && (
                  <g className="transition-all duration-700">
                    {/* Lever */}
                    <line
                      x1="165"
                      y1="285"
                      x2="160"
                      y2="255"
                      stroke="#e5e5e5"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                    {/* Ball top red */}
                    <circle
                      cx="159"
                      cy="251"
                      r="12"
                      fill="#f72585"
                      filter="url(#glowPurple)"
                    />

                    {/* Action buttons on physical console */}
                    <circle cx="215" cy="275" r="7" fill="#4cc9f0" />
                    <circle cx="235" cy="272" r="7" fill="#f72585" />
                  </g>
                )}
              </>
            )}

            {/* THEME 10: Snowy Cozy Cabin */}
            {theme === "snowy_cabin" && (
              <>
                {/* Cold Twilight Sky */}
                <rect
                  x="0"
                  y="0"
                  width="400"
                  height="400"
                  fill="#0d1b2a"
                />

                {/* Micro stars */}
                <circle cx="40" cy="50" r="1" fill="#fff" />
                <circle cx="120" cy="80" r="1.5" fill="#fff" opacity="0.6" />
                <circle cx="230" cy="40" r="1" fill="#fff" />
                <circle cx="340" cy="90" r="1.5" fill="#fff" opacity="0.8" />

                {/* Snowy mountain range / background pines */}
                {getEl("pines")?.visible && (
                  <g className="transition-all duration-700">
                    {/* Pine silhouettes loaded with snow */}
                    <path d="M 40 400 L 90 220 L 140 400 Z" fill="#1b2e2d" />
                    <path d="M 60 400 L 100 240 L 140 400 Z" fill="#2d4a47" />
                    <path d="M 65 300 L 90 220 L 115 300 Z" fill="#ffffff" opacity="0.6" />

                    <path d="M 260 400 L 310 200 L 360 400 Z" fill="#1b2e2d" />
                    <path d="M 285 300 L 310 200 L 335 300 Z" fill="#ffffff" opacity="0.6" />
                  </g>
                )}

                {/* Cozy Timber Lodge Cabin */}
                {getEl("cabin")?.visible && (
                  <g className="transition-all duration-700">
                    {/* Cabin building base */}
                    <rect x="120" y="270" width="160" height="110" fill="#4a2c11" rx="2" />
                    {/* Wooden horizontal log slats lines */}
                    <line x1="120" y1="290" x2="280" y2="290" stroke="#2c1a0e" strokeWidth="2" />
                    <line x1="120" y1="310" x2="280" y2="310" stroke="#2c1a0e" strokeWidth="2" />
                    <line x1="120" y1="330" x2="280" y2="330" stroke="#2c1a0e" strokeWidth="2" />
                    <line x1="120" y1="350" x2="280" y2="350" stroke="#2c1a0e" strokeWidth="2" />

                    {/* Chimney brick panel */}
                    <rect x="240" y="200" width="22" height="55" fill="#5c1d1a" />
                    <rect x="237" y="195" width="28" height="6" fill="#3d1513" />

                    {/* Roof pitched with snowy blanket */}
                    <polygon points="105,270 200,180 295,270" fill="#3d2314" />
                    {/* Thicker Snow on top cover */}
                    <polygon points="105,270 200,180 295,270 285,260 200,192 115,260" fill="#f8fafc" />

                    {/* Cozy Yellow Windows emitting interior home light */}
                    <rect x="150" y="300" width="30" height="30" rx="3" fill="#ffe494" filter="url(#glowGold)" />
                    <line x1="165" y1="300" x2="165" y2="330" stroke="#4a2c11" strokeWidth="1.5" />
                    <line x1="150" y1="315" x2="180" y2="315" stroke="#4a2c11" strokeWidth="1.5" />

                    {/* Entrance Door */}
                    <rect x="205" y="300" width="30" height="80" fill="#2c1a0e" />
                    <circle cx="211" cy="340" r="2" fill="#ffd166" />
                  </g>
                )}

                {/* Active chiming billowing smoke */}
                {getEl("smoke")?.visible && (
                  <g className="transition-all duration-700 opacity-55">
                    <circle cx="251" cy="175" r="10" fill="#e2e8f0" filter="blur(4px)" />
                    <circle cx="258" cy="150" r="15" fill="#d1d5db" filter="blur(6px)" />
                    <circle cx="265" cy="120" r="22" fill="#e5e7eb" filter="blur(8px)" />
                  </g>
                )}
              </>
            )}

            {/* THEME 11: Celestial Portal */}
            {theme === "celestial_portal" && (
              <>
                {/* 1. Starry galaxy space background */}
                <rect
                  x="0"
                  y="0"
                  width="400"
                  height="400"
                  fill="#03001e"
                />

                {/* Stars/Nebula */}
                {getEl("stars")?.visible && (
                  <g className="transition-all duration-700">
                    <circle cx="100" cy="120" r="70" fill="#7303c0" opacity="0.18" filter="blur(30px)" />
                    <circle cx="300" cy="240" r="90" fill="#ec38bc" opacity="0.12" filter="blur(35px)" />
                    <circle cx="150" cy="280" r="60" fill="#03001e" />
                  </g>
                )}

                {/* Stone flanking Obelisks */}
                {getEl("obelisks")?.visible && (
                  <g className="transition-all duration-700">
                    {/* Left Obelisk pillar */}
                    <path
                      d="M 50 400 L 65 150 L 78 150 L 95 400 Z"
                      fill="#1f2937"
                      stroke="#805ad5"
                      strokeWidth="1"
                    />
                    {/* Right Obelisk pillar */}
                    <path
                      d="M 350 400 L 335 150 L 322 150 L 305 400 Z"
                      fill="#1f2937"
                      stroke="#805ad5"
                      strokeWidth="1"
                    />
                  </g>
                )}

                {/* Giant Blue Plasma Portal Loop */}
                {getEl("portal")?.visible && (
                  <g className="transition-all duration-700">
                    <circle
                      cx="200"
                      cy="250"
                      r="85"
                      fill="none"
                      stroke="#3182ce"
                      strokeWidth="15"
                      filter="url(#glowCyan)"
                      className="animate-pulse"
                    />
                    <circle
                      cx="200"
                      cy="250"
                      r="80"
                      fill="#03001e"
                    />
                    {/* Energy plasma loops */}
                    <ellipse
                      cx="200"
                      cy="250"
                      rx="72"
                      ry="45"
                      fill="none"
                      stroke="#90e0ef"
                      strokeWidth="2.5"
                      transform="rotate(30, 200, 250)"
                      opacity="0.75"
                    />
                    <ellipse
                      cx="200"
                      cy="250"
                      rx="72"
                      ry="45"
                      fill="none"
                      stroke="#ec38bc"
                      strokeWidth="2.5"
                      transform="rotate(-55, 200, 250)"
                      opacity="0.65"
                    />
                  </g>
                )}

                {/* Floating Amethyst Crystals */}
                {getEl("crystals")?.visible && (
                  <g className="transition-all duration-700">
                    {/* Top center hovering crystal */}
                    <polygon
                      points="200,75 212,95 200,115 188,95"
                      fill="#805ad5"
                      filter="url(#glowPurple)"
                    />
                    <polygon
                      points="200,75 200,115 188,95"
                      fill="#9f7aea"
                    />

                    {/* Left hovering small crystals */}
                    <polygon
                      points="110,210 118,225 110,240 102,225"
                      fill="#805ad5"
                      opacity="0.9"
                    />
                    
                    {/* Right floating crystal */}
                    <polygon
                      points="290,190 298,205 290,220 282,205"
                      fill="#b794f4"
                      opacity="0.85"
                    />
                  </g>
                )}
              </>
            )}
          </svg>

          {/* Aesthetic UI Overlay Indicators layered in corner */}
          <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-md border border-gray-800 text-[10px] font-mono text-gray-400 space-y-0.5">
            <p className="font-bold flex items-center text-cyan-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-1 animate-ping" />
              GRAPHIC_RENDER_OK
            </p>
            <p>THEME: {theme.toUpperCase()}</p>
            <p>FIDELITY: {score}%</p>
          </div>
        </div>
      )}
    </div>
  );
}
