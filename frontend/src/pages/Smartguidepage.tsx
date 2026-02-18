import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Search, Recycle, AlertTriangle, Sparkles, CheckCircle, BookOpen, Feather } from "lucide-react";
import Navbar from "@/components/Navbar";

// ── Types ─────────────────────────────────────────────────────────────────────
interface SmartGuide {
  bin: string;
  color: string;
  rune: string;
  title: string;
  subtitle: string;
  steps: string[];
  tip: string;
  impact: string;
  prohibition: string;
}

// ── Floating Particle ─────────────────────────────────────────────────────────
function FloatingParticle({ delay, x, size, glyph }: { delay: number; x: number; size: number; glyph: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: "100vh", x: `${x}vw` }}
      animate={{
        opacity: [0, 0.35, 0.2, 0],
        y: [0, -200, -500, -900],
        x: [`${x}vw`, `${x + 3}vw`, `${x - 2}vw`, `${x + 1}vw`],
        rotate: [0, 30, -20, 45],
      }}
      transition={{
        duration: 18 + delay * 3,
        delay,
        repeat: Infinity,
        ease: "linear",
      }}
      style={{
        position: "fixed",
        bottom: 0,
        fontSize: `${size}rem`,
        color: "#C9A84C",
        fontFamily: "'Cinzel', serif",
        pointerEvents: "none",
        zIndex: 0,
        filter: "blur(0.5px)",
        userSelect: "none",
      }}
    >
      {glyph}
    </motion.div>
  );
}

// ── Magical Orb ───────────────────────────────────────────────────────────────
function MagicalOrb({ x, y, size, color, delay }: { x: string; y: string; size: number; color: string; delay: number }) {
  return (
    <motion.div
      animate={{
        scale: [1, 1.15, 0.95, 1],
        opacity: [0.04, 0.1, 0.06, 0.04],
      }}
      transition={{ duration: 8 + delay, repeat: Infinity, delay, ease: "easeInOut" }}
      style={{
        position: "fixed",
        left: x,
        top: y,
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color}, transparent 70%)`,
        filter: "blur(40px)",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}

// ── Wax Seal ─────────────────────────────────────────────────────────────────
function WaxSeal({ color, rune }: { color: string; rune: string }) {
  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="30" fill={`${color}22`} stroke={`${color}60`} strokeWidth="1.5" />
        <circle cx="32" cy="32" r="24" fill={`${color}15`} stroke={`${color}40`} strokeWidth="1" />
        {/* Decorative petals */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
          <ellipse
            key={angle}
            cx={32 + 20 * Math.cos((angle * Math.PI) / 180)}
            cy={32 + 20 * Math.sin((angle * Math.PI) / 180)}
            rx="4" ry="2"
            fill={`${color}30`}
            transform={`rotate(${angle}, ${32 + 20 * Math.cos((angle * Math.PI) / 180)}, ${32 + 20 * Math.sin((angle * Math.PI) / 180)})`}
          />
        ))}
        <circle cx="32" cy="32" r="16" fill={`${color}18`} />
      </svg>
      <span style={{
        position: "absolute",
        fontFamily: "'Cinzel', serif",
        fontSize: "1.3rem",
        color,
        textShadow: `0 0 12px ${color}60`,
      }}>{rune}</span>
    </div>
  );
}

// ── Animated Quill Divider ────────────────────────────────────────────────────
function QuillDivider({ label }: { label?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scaleX: 0.6 }}
      animate={{ opacity: 1, scaleX: 1 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="flex items-center gap-4 my-8"
    >
      <div style={{
        flex: 1,
        height: "1px",
        background: "linear-gradient(90deg, transparent, rgba(155,125,42,0.15), rgba(201,168,76,0.5), rgba(155,125,42,0.2))",
        position: "relative",
      }}>
        <div style={{
          position: "absolute",
          top: "-1px",
          right: "0",
          width: "40%",
          height: "3px",
          background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.3))",
          borderRadius: "2px",
        }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
        <span style={{
          fontFamily: "'Cinzel', serif",
          fontSize: "0.75rem",
          letterSpacing: "0.5em",
          color: "rgba(201,168,76,0.5)",
        }}>✦</span>
        {label ? (
          <span style={{
            fontFamily: "'EB Garamond', serif",
            fontSize: "0.75rem",
            letterSpacing: "0.35em",
            color: "rgba(201,168,76,0.55)",
            fontStyle: "italic",
            whiteSpace: "nowrap",
          }}>{label}</span>
        ) : (
          <span style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "1rem",
            color: "rgba(201,168,76,0.45)",
            letterSpacing: "0.4em",
          }}>ᚱ ᚢ ᚾ</span>
        )}
        <span style={{
          fontFamily: "'Cinzel', serif",
          fontSize: "0.75rem",
          letterSpacing: "0.5em",
          color: "rgba(201,168,76,0.5)",
        }}>✦</span>
      </div>
      <div style={{
        flex: 1,
        height: "1px",
        background: "linear-gradient(270deg, transparent, rgba(155,125,42,0.15), rgba(201,168,76,0.5), rgba(155,125,42,0.2))",
      }} />
    </motion.div>
  );
}

// ── Waste Categories ──────────────────────────────────────────────────────────
const wasteCategories = [
  {
    name: "Plastic", emoji: "💧", description: "Bottles, containers, packaging",
    houseColor: "#4A90E2", houseRune: "ᚢ",
    icon: (
      <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
        <path d="M24 4L20 12H28L24 4Z" fill="url(#blue-g)" opacity="0.9"/>
        <rect x="18" y="12" width="12" height="28" rx="2" fill="url(#blue-g)" opacity="0.65"/>
        <circle cx="24" cy="26" r="3" fill="#4A90E2" opacity="0.35"/>
        <path d="M20 40C20 42 22 44 24 44C26 44 28 42 28 40" stroke="#6BB6FF" strokeWidth="2" opacity="0.8"/>
        <defs>
          <linearGradient id="blue-g" x1="24" y1="4" x2="24" y2="44">
            <stop offset="0%" stopColor="#93C5FD"/>
            <stop offset="100%" stopColor="#4A90E2"/>
          </linearGradient>
        </defs>
      </svg>
    )
  },
  {
    name: "Organic", emoji: "🌿", description: "Food scraps, plant matter",
    houseColor: "#50C878", houseRune: "ᛁ",
    icon: (
      <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
        <path d="M24 8C18 8 14 12 14 18C14 24 18 28 24 34C30 28 34 24 34 18C34 12 30 8 24 8Z" fill="url(#green-g)" opacity="0.85"/>
        <path d="M24 8V34" stroke="#90EE90" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="20" cy="20" r="2" fill="#B8F5B8" opacity="0.7"/>
        <circle cx="28" cy="20" r="2" fill="#B8F5B8" opacity="0.7"/>
        <defs>
          <linearGradient id="green-g" x1="24" y1="8" x2="24" y2="34">
            <stop offset="0%" stopColor="#A7F3C0"/>
            <stop offset="100%" stopColor="#50C878"/>
          </linearGradient>
        </defs>
      </svg>
    )
  },
  {
    name: "E-Waste", emoji: "⚡", description: "Electronics, batteries, devices",
    houseColor: "#E74C3C", houseRune: "ᚱ",
    icon: (
      <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
        <rect x="12" y="12" width="24" height="20" rx="2" fill="url(#red-g)" opacity="0.85"/>
        <circle cx="24" cy="22" r="4" fill="#FF8A8A" opacity="0.6"/>
        <path d="M18 32H30" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round"/>
        <path d="M24 16L22 22H26L24 28" stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <defs>
          <linearGradient id="red-g" x1="24" y1="12" x2="24" y2="32">
            <stop offset="0%" stopColor="#FCA5A5"/>
            <stop offset="100%" stopColor="#E74C3C"/>
          </linearGradient>
        </defs>
      </svg>
    )
  },
  {
    name: "Glass", emoji: "💎", description: "Bottles, jars, containers",
    houseColor: "#87CEEB", houseRune: "ᛇ",
    icon: (
      <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
        <path d="M20 10L16 30C16 35 19 40 24 40C29 40 32 35 32 30L28 10H20Z" fill="url(#glass-g)" opacity="0.7"/>
        <ellipse cx="24" cy="10" rx="4" ry="2" fill="#B0E0E6" opacity="0.9"/>
        <path d="M20 24C20 24 22 26 24 26C26 26 28 24 28 24" stroke="#E0F7FF" strokeWidth="1.5" opacity="0.7"/>
        <circle cx="22" cy="17" r="1.5" fill="white" opacity="0.9"/>
        <circle cx="27" cy="22" r="1" fill="white" opacity="0.6"/>
        <defs>
          <linearGradient id="glass-g" x1="24" y1="10" x2="24" y2="40">
            <stop offset="0%" stopColor="#E0F7FF"/>
            <stop offset="50%" stopColor="#87CEEB"/>
            <stop offset="100%" stopColor="#4A90E2"/>
          </linearGradient>
        </defs>
      </svg>
    )
  },
  {
    name: "Metal", emoji: "⚙️", description: "Cans, foil, metal items",
    houseColor: "#C0C0C0", houseRune: "ᛏ",
    icon: (
      <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
        <circle cx="24" cy="24" r="14" fill="url(#metal-g)" opacity="0.85"/>
        <circle cx="24" cy="24" r="10" fill="none" stroke="#E8E8E8" strokeWidth="1.5"/>
        <circle cx="24" cy="24" r="5" fill="#D0D0D0" opacity="0.7"/>
        <path d="M24 13L24 35M13 24L35 24" stroke="#F5F5F5" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="24" cy="15" r="2" fill="white" opacity="0.8"/>
        <defs>
          <linearGradient id="metal-g" x1="24" y1="10" x2="24" y2="38">
            <stop offset="0%" stopColor="#F0F0F0"/>
            <stop offset="50%" stopColor="#C0C0C0"/>
            <stop offset="100%" stopColor="#909090"/>
          </linearGradient>
        </defs>
      </svg>
    )
  },
  {
    name: "Paper", emoji: "📄", description: "Documents, newspapers, cardboard",
    houseColor: "#D4AF37", houseRune: "ᛒ",
    icon: (
      <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
        <path d="M14 8C14 6 15 4 17 4H27L34 11V40C34 42 32 44 30 44H17C15 44 14 42 14 40V8Z" fill="url(#paper-g)" opacity="0.95"/>
        <path d="M27 4V11H34" stroke="#C9A84C" strokeWidth="1.5" opacity="0.7"/>
        <line x1="18" y1="18" x2="30" y2="18" stroke="#C9A84C" strokeWidth="1.5" opacity="0.4"/>
        <line x1="18" y1="24" x2="30" y2="24" stroke="#C9A84C" strokeWidth="1.5" opacity="0.4"/>
        <line x1="18" y1="30" x2="26" y2="30" stroke="#C9A84C" strokeWidth="1.5" opacity="0.4"/>
        <defs>
          <linearGradient id="paper-g" x1="24" y1="4" x2="24" y2="44">
            <stop offset="0%" stopColor="#FEF9E7"/>
            <stop offset="100%" stopColor="#F5E6C8"/>
          </linearGradient>
        </defs>
      </svg>
    )
  },
  {
    name: "Cardboard", emoji: "📦", description: "Boxes, packaging materials",
    houseColor: "#C19A6B", houseRune: "ᛖ",
    icon: (
      <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
        <path d="M24 8L8 16V32L24 40L40 32V16L24 8Z" fill="url(#cardboard-g)" opacity="0.85"/>
        <path d="M24 8V40" stroke="#D2B48C" strokeWidth="1.5" opacity="0.6"/>
        <path d="M8 16L24 24L40 16" stroke="#DEB887" strokeWidth="1.5" opacity="0.7"/>
        <defs>
          <linearGradient id="cardboard-g" x1="24" y1="8" x2="24" y2="40">
            <stop offset="0%" stopColor="#E8C99A"/>
            <stop offset="100%" stopColor="#C19A6B"/>
          </linearGradient>
        </defs>
      </svg>
    )
  },
  {
    name: "Hazardous", emoji: "☢️", description: "Chemicals, paints, cleaners",
    houseColor: "#FF6B00", houseRune: "ᚦ",
    icon: (
      <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
        <path d="M24 6L30 18H18L24 6Z" fill="url(#hazard-g)" opacity="0.85"/>
        <path d="M18 18L12 30H36L30 18H18Z" fill="url(#hazard-g)" opacity="0.7"/>
        <circle cx="24" cy="27" r="4" fill="#FF8C00" opacity="0.6"/>
        <path d="M24 19L22 23L26 23L24 19Z" fill="#FFD700" opacity="0.9"/>
        <defs>
          <linearGradient id="hazard-g" x1="24" y1="6" x2="24" y2="30">
            <stop offset="0%" stopColor="#FDBA74"/>
            <stop offset="100%" stopColor="#FF6B00"/>
          </linearGradient>
        </defs>
      </svg>
    )
  },
  {
    name: "Textile", emoji: "👕", description: "Clothes, fabrics, linens",
    houseColor: "#B19CD9", houseRune: "ᛜ",
    icon: (
      <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
        <path d="M16 12L20 8H28L32 12L30 16H18L16 12Z" fill="url(#textile-g)" opacity="0.85"/>
        <rect x="18" y="16" width="12" height="24" rx="2" fill="url(#textile-g)" opacity="0.7"/>
        <path d="M20 20L24 24L28 20" stroke="#C9B8E8" strokeWidth="1.5" opacity="0.7"/>
        <circle cx="24" cy="28" r="2" fill="#DDA0DD" opacity="0.5"/>
        <defs>
          <linearGradient id="textile-g" x1="24" y1="8" x2="24" y2="40">
            <stop offset="0%" stopColor="#E9D5FF"/>
            <stop offset="100%" stopColor="#B19CD9"/>
          </linearGradient>
        </defs>
      </svg>
    )
  },
  {
    name: "Battery", emoji: "🔋", description: "All types of batteries",
    houseColor: "#34D399", houseRune: "ᛝ",
    icon: (
      <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
        <rect x="14" y="16" width="20" height="24" rx="2" fill="url(#battery-g)" opacity="0.85"/>
        <rect x="20" y="12" width="8" height="4" rx="1" fill="#A7F3D0"/>
        <rect x="16" y="20" width="16" height="7" fill="#34D399" opacity="0.55"/>
        <path d="M19 30H29" stroke="#6EE7B7" strokeWidth="2" strokeLinecap="round"/>
        <path d="M24 27V33" stroke="#6EE7B7" strokeWidth="2" strokeLinecap="round"/>
        <defs>
          <linearGradient id="battery-g" x1="24" y1="16" x2="24" y2="40">
            <stop offset="0%" stopColor="#A7F3D0"/>
            <stop offset="100%" stopColor="#34D399"/>
          </linearGradient>
        </defs>
      </svg>
    )
  },
];

// ── Smart Guide Display ───────────────────────────────────────────────────────
function SmartGuideDisplay({ guide, wasteType }: { guide: SmartGuide; wasteType: string }) {
  const colorMap: Record<string, string> = {
    "Blue": "#4A90E2", "Green": "#50C878", "Red": "#E74C3C",
    "Yellow": "#F1C40F", "Black": "#8899AA",
  };
  const binColor = colorMap[guide.bin] || "#9B7D2A";

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      style={{ position: "relative" }}
    >
      {/* Grimoire page container */}
      <div style={{
        background: "linear-gradient(160deg, rgba(6,4,18,0.99) 0%, rgba(9,7,24,0.97) 50%, rgba(5,7,16,0.98) 100%)",
        borderRadius: "20px",
        border: `1px solid ${binColor}35`,
        boxShadow: `0 20px 80px rgba(0,0,0,0.7), 0 0 60px ${binColor}10, inset 0 1px 0 rgba(255,220,100,0.06)`,
        overflow: "hidden",
        position: "relative",
      }}>
        {/* Top decorative bar */}
        <div style={{
          height: "3px",
          background: `linear-gradient(90deg, transparent, ${binColor}50, ${binColor}80, ${binColor}50, transparent)`,
        }} />

        {/* Ambient corner glows */}
        <div style={{
          position: "absolute", top: 0, right: 0,
          width: "350px", height: "350px",
          background: `radial-gradient(circle at top right, ${binColor}12, transparent 60%)`,
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: 0, left: 0,
          width: "250px", height: "250px",
          background: "radial-gradient(circle at bottom left, rgba(155,125,42,0.08), transparent 60%)",
          pointerEvents: "none",
        }} />

        {/* Rune watermark — massive */}
        <div style={{
          position: "absolute", top: "20px", right: "28px",
          fontFamily: "'Cinzel', serif",
          fontSize: "9rem",
          color: `${binColor}06`,
          fontWeight: 900,
          pointerEvents: "none",
          lineHeight: 1,
          letterSpacing: "-0.05em",
        }}>{guide.rune}</div>

        <div style={{ padding: "40px 44px 44px" }}>
          {/* Header section */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: "24px", marginBottom: "32px", position: "relative", zIndex: 1 }}>
            <WaxSeal color={binColor} rune={guide.rune} />
            <div style={{ flex: 1 }}>
              {/* Breadcrumb label */}
              <div style={{
                fontFamily: "'Cormorant Garamond', 'EB Garamond', serif",
                fontSize: "0.65rem",
                letterSpacing: "0.45em",
                color: "rgba(201,168,76,0.45)",
                marginBottom: "10px",
                textTransform: "uppercase",
              }}>✦ Arcane Disposal Grimoire · Volume III ✦</div>

              {/* Main title */}
              <h2 style={{
                fontFamily: "'Cinzel Decorative', 'Cinzel', serif",
                fontSize: "clamp(1.6rem, 3vw, 2.4rem)",
                fontWeight: 900,
                color: binColor,
                letterSpacing: "0.04em",
                margin: "0 0 8px",
                lineHeight: 1.15,
                textShadow: `0 0 40px ${binColor}45, 0 0 80px ${binColor}15`,
              }}>
                {guide.bin} Vessel
              </h2>

              {/* Subtitle — italic Garamond */}
              <p style={{
                fontFamily: "'EB Garamond', 'Cormorant Garamond', Georgia, serif",
                fontSize: "1.25rem",
                fontStyle: "italic",
                color: "rgba(212,175,55,0.8)",
                margin: "0 0 6px",
                letterSpacing: "0.015em",
                lineHeight: 1.5,
              }}>{guide.subtitle}</p>

              {/* Chapter line */}
              <div style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "0.72rem",
                color: "rgba(155,125,42,0.55)",
                letterSpacing: "0.12em",
              }}>{guide.title}</div>
            </div>
          </div>

          <QuillDivider label="Sacred Disposal Ritual" />

          {/* Steps */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginBottom: "36px", position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
              <Recycle size={16} style={{ color: binColor, opacity: 0.8 }} />
              <span style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "0.62rem",
                letterSpacing: "0.22em",
                color: "rgba(155,125,42,0.55)",
              }}>THE PRESCRIBED INCANTATIONS</span>
            </div>

            {guide.steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.09, ease: "easeOut" }}
                style={{
                  display: "flex",
                  gap: "18px",
                  padding: "16px 20px",
                  borderRadius: "14px",
                  background: `linear-gradient(135deg, ${binColor}08, ${binColor}04)`,
                  border: `1px solid ${binColor}18`,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Step number — calligraphic */}
                <div style={{
                  flexShrink: 0,
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${binColor}30, ${binColor}15)`,
                  border: `1px solid ${binColor}45`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: "'Cinzel', serif",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  color: binColor,
                  boxShadow: `0 0 12px ${binColor}20`,
                }}>{i + 1}</div>

                <p style={{
                  fontFamily: "'EB Garamond', Georgia, serif",
                  fontSize: "1.08rem",
                  color: "#D4C078",
                  lineHeight: "1.7",
                  margin: 0,
                  paddingTop: "4px",
                  letterSpacing: "0.01em",
                }}>{step}</p>

                {/* Subtle left glow stripe */}
                <div style={{
                  position: "absolute", left: 0, top: 0, bottom: 0,
                  width: "3px",
                  background: `linear-gradient(180deg, ${binColor}40, ${binColor}10)`,
                  borderRadius: "4px 0 0 4px",
                }} />
              </motion.div>
            ))}
          </div>

          <QuillDivider />

          {/* Three info cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px", position: "relative", zIndex: 1 }}>
            {/* Impact */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              style={{
                padding: "22px 24px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, rgba(80,200,120,0.09), rgba(50,180,100,0.04))",
                border: "1px solid rgba(80,200,120,0.22)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{
                position: "absolute", top: 0, right: 0,
                width: "120px", height: "120px",
                background: "radial-gradient(circle, rgba(80,200,120,0.08), transparent)",
                pointerEvents: "none",
              }} />
              <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                <Sparkles size={18} style={{ color: "#50C878", flexShrink: 0, marginTop: "3px" }} />
                <div>
                  <div style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: "0.6rem",
                    letterSpacing: "0.28em",
                    color: "rgba(80,200,120,0.8)",
                    marginBottom: "10px",
                  }}>✦ IMPACT OF THY WISDOM</div>
                  <p style={{
                    fontFamily: "'EB Garamond', serif",
                    fontSize: "1.08rem",
                    color: "#C4D8A0",
                    lineHeight: "1.72",
                    margin: 0,
                    fontStyle: "italic",
                    letterSpacing: "0.01em",
                  }}>{guide.impact}</p>
                </div>
              </div>
            </motion.div>

            {/* Prohibition */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.62 }}
              style={{
                padding: "22px 24px",
                borderRadius: "16px",
                background: "linear-gradient(135deg, rgba(220,60,40,0.09), rgba(180,40,20,0.04))",
                border: "1px solid rgba(220,60,40,0.25)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                <AlertTriangle size={18} style={{ color: "#E74C3C", flexShrink: 0, marginTop: "3px" }} />
                <div>
                  <div style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: "0.6rem",
                    letterSpacing: "0.28em",
                    color: "rgba(220,60,40,0.85)",
                    marginBottom: "10px",
                  }}>⚠ FORBIDDEN PRACTICE</div>
                  <p style={{
                    fontFamily: "'EB Garamond', serif",
                    fontSize: "1.08rem",
                    color: "#E8C0B0",
                    lineHeight: "1.72",
                    margin: 0,
                    letterSpacing: "0.01em",
                  }}>{guide.prohibition}</p>
                </div>
              </div>
            </motion.div>

            {/* Tip */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.74 }}
              style={{
                padding: "22px 24px",
                borderRadius: "16px",
                background: `linear-gradient(135deg, ${binColor}12, ${binColor}05)`,
                border: `1px solid ${binColor}30`,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{
                position: "absolute", bottom: "-20px", right: "-10px",
                fontFamily: "'Cinzel', serif",
                fontSize: "4rem",
                color: `${binColor}06`,
                fontWeight: 900,
                pointerEvents: "none",
              }}>🌱</div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                <CheckCircle size={18} style={{ color: binColor, flexShrink: 0, marginTop: "3px" }} />
                <div>
                  <div style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: "0.6rem",
                    letterSpacing: "0.28em",
                    color: `${binColor}cc`,
                    marginBottom: "10px",
                  }}>✦ WISDOM OF THE ANCIENTS</div>
                  <p style={{
                    fontFamily: "'EB Garamond', serif",
                    fontSize: "1.08rem",
                    color: "#D4C078",
                    lineHeight: "1.75",
                    margin: 0,
                    fontStyle: "italic",
                    letterSpacing: "0.01em",
                  }}>{guide.tip}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bottom sigil row */}
          <div style={{ marginTop: "36px", textAlign: "center" }}>
            <div style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "0.7rem",
              letterSpacing: "0.55em",
              color: `${binColor}25`,
            }}>ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ ᚷ ᚹ ᚺ ᚾ ᛁ ᛃ ᛇ ᛈ ᛉ ᛊ ᛏ ᛒ ᛖ ᛗ ᛚ ᛜ ᛞ ᛟ</div>
          </div>
        </div>

        {/* Bottom decorative bar */}
        <div style={{
          height: "2px",
          background: `linear-gradient(90deg, transparent, ${binColor}35, transparent)`,
        }} />
      </div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SmartGuidePage() {
  const [searchParams] = useSearchParams();
  const [selectedWaste, setSelectedWaste] = useState<string | null>(null);
  const [guideData, setGuideData] = useState<SmartGuide | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const particles = [
    { delay: 0,  x: 8,  size: 0.85, glyph: "ᚠ" },
    { delay: 3,  x: 18, size: 0.7,  glyph: "ᚱ" },
    { delay: 6,  x: 35, size: 1.0,  glyph: "✦" },
    { delay: 1,  x: 55, size: 0.75, glyph: "ᛟ" },
    { delay: 8,  x: 72, size: 0.65, glyph: "ᛞ" },
    { delay: 4,  x: 85, size: 0.9,  glyph: "ᚢ" },
    { delay: 11, x: 92, size: 0.7,  glyph: "⚗" },
    { delay: 2,  x: 44, size: 0.8,  glyph: "ᚦ" },
  ];

  useEffect(() => {
    const wasteType = searchParams.get("type");
    if (wasteType) {
      const formattedType = wasteType.charAt(0).toUpperCase() + wasteType.slice(1);
      fetchGuide(formattedType);
      setTimeout(() => window.scrollTo({ top: 600, behavior: "smooth" }), 500);
    }
  }, [searchParams]);

  const fetchGuide = async (wasteType: string) => {
    setLoading(true);
    setSelectedWaste(wasteType);
    try {
      const response = await fetch(`http://127.0.0.1:8000/disposal-guide/${wasteType}`);
      const data = await response.json();
      setGuideData(data.guide);
    } catch (error) {
      console.error("Failed to fetch guide:", error);
      alert("Failed to load disposal guide. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = wasteCategories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(170deg, #030209 0%, #06040F 25%, #070818 55%, #040610 80%, #030209 100%)",
      fontFamily: "'EB Garamond', Georgia, serif",
      color: "#C9B97A",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* ── Font imports ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cinzel+Decorative:wght@400;700;900&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400;1,500&display=swap');

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: rgba(6,4,15,0.5); }
        ::-webkit-scrollbar-thumb { background: rgba(155,125,42,0.35); border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(201,168,76,0.5); }

        .cat-card {
          transition: transform 0.3s cubic-bezier(0.22,1,0.36,1),
                      box-shadow 0.3s ease,
                      border-color 0.3s ease,
                      background 0.3s ease !important;
        }
        .cat-card:hover {
          transform: translateY(-5px) !important;
        }

        .search-input::placeholder { color: rgba(155,125,42,0.35); font-style: italic; }
        .search-input:focus { outline: none; }

        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.15; }
          50% { opacity: 0.35; }
        }
      `}</style>

      {/* ── Background particles ── */}
      {particles.map((p, i) => (
        <FloatingParticle key={i} {...p} />
      ))}

      {/* ── Magical orbs ── */}
      <MagicalOrb x="10%" y="20%"  size={500} color="#9B7D2A" delay={0} />
      <MagicalOrb x="70%" y="5%"   size={400} color="#4A2080" delay={3} />
      <MagicalOrb x="85%" y="60%"  size={350} color="#1A3060" delay={6} />
      <MagicalOrb x="5%"  y="70%"  size={300} color="#9B7D2A" delay={9} />

      {/* ── Runic grid overlay ── */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `linear-gradient(rgba(155,125,42,0.025) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(155,125,42,0.025) 1px, transparent 1px)`,
        backgroundSize: "56px 56px",
      }} />

      {/* ── Top radiance ── */}
      <div style={{
        position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
        width: "1000px", height: "500px", pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(ellipse at top, rgba(120,85,15,0.14) 0%, rgba(60,40,100,0.06) 40%, transparent 70%)",
      }} />

      <Navbar />

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "112px 36px 100px", position: "relative", zIndex: 1 }}>

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: "16px", textAlign: "center" }}
        >
          {/* Ministry badge */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              padding: "6px 20px",
              borderRadius: "30px",
              background: "rgba(155,125,42,0.08)",
              border: "1px solid rgba(201,168,76,0.2)",
              marginBottom: "24px",
            }}
          >
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.75rem", color: "rgba(201,168,76,0.4)" }}>ᚠ</span>
            <span style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "0.58rem",
              letterSpacing: "0.38em",
              color: "rgba(201,168,76,0.55)",
            }}>ARCANE DISPOSAL GRIMOIRE · KNOWLEDGE VAULT</span>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.75rem", color: "rgba(201,168,76,0.4)" }}>ᚠ</span>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
            style={{
              fontFamily: "'Cinzel Decorative', 'Cinzel', serif",
              fontSize: "clamp(2rem, 5vw, 3.8rem)",
              fontWeight: 900,
              letterSpacing: "0.04em",
              lineHeight: 1.15,
              background: "linear-gradient(135deg, #FFF0A0 0%, #E8C84A 25%, #C9A84C 50%, #9B7D2A 75%, #C9A84C 100%)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "shimmer 6s linear infinite",
              marginBottom: "18px",
            }}
          >
            Smart Disposal Guide
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              fontFamily: "'Cormorant Garamond', 'EB Garamond', serif",
              fontSize: "clamp(1rem, 2vw, 1.3rem)",
              fontStyle: "italic",
              color: "rgba(212,192,120,0.6)",
              letterSpacing: "0.035em",
              maxWidth: "680px",
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            Consult the ancient tomes of waste wisdom — discover the sacred rituals
            of proper disposal for every material known to the realm.
          </motion.p>
        </motion.div>

        <QuillDivider />

        {/* ── Search bar ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ marginBottom: "40px" }}
        >
          <div style={{ position: "relative", maxWidth: "560px", margin: "0 auto" }}>
            {/* Glow behind search */}
            <div style={{
              position: "absolute",
              inset: "-2px",
              borderRadius: "16px",
              background: searchFocused
                ? "linear-gradient(135deg, rgba(201,168,76,0.18), rgba(155,125,42,0.1))"
                : "transparent",
              filter: "blur(8px)",
              transition: "background 0.4s",
              pointerEvents: "none",
            }} />

            <Search
              size={17}
              style={{
                position: "absolute",
                left: "18px",
                top: "50%",
                transform: "translateY(-50%)",
                color: searchFocused ? "#C9A84C" : "#7A6020",
                transition: "color 0.3s",
                pointerEvents: "none",
                zIndex: 1,
              }}
            />

            <Feather
              size={14}
              style={{
                position: "absolute",
                right: "18px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "rgba(155,125,42,0.3)",
                pointerEvents: "none",
                zIndex: 1,
              }}
            />

            <input
              className="search-input"
              type="text"
              placeholder="Seek within the ancient catalogue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              style={{
                width: "100%",
                padding: "16px 48px",
                borderRadius: "14px",
                background: "rgba(5,4,14,0.92)",
                border: searchFocused
                  ? "1px solid rgba(201,168,76,0.45)"
                  : "1px solid rgba(155,125,42,0.22)",
                color: "#D4C078",
                fontFamily: "'EB Garamond', serif",
                fontSize: "1.05rem",
                transition: "border 0.3s, box-shadow 0.3s",
                boxShadow: searchFocused
                  ? "0 0 30px rgba(155,125,42,0.12), inset 0 1px 0 rgba(201,168,76,0.05)"
                  : "0 4px 20px rgba(0,0,0,0.4)",
                position: "relative",
              }}
            />
          </div>
        </motion.div>

        {/* ── Category grid ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "14px",
            marginBottom: "56px",
          }}
        >
          {filteredCategories.map((cat, i) => {
            const isSelected = selectedWaste === cat.name;
            return (
              <motion.button
                key={cat.name}
                className="cat-card"
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55 + i * 0.045 }}
                onClick={() => fetchGuide(cat.name)}
                style={{
                  padding: "24px 20px",
                  borderRadius: "16px",
                  background: isSelected
                    ? `linear-gradient(135deg, rgba(155,125,42,0.22), rgba(100,75,20,0.16))`
                    : "linear-gradient(155deg, rgba(7,5,20,0.96), rgba(10,8,28,0.92))",
                  border: isSelected
                    ? "1px solid rgba(212,175,55,0.52)"
                    : "1px solid rgba(155,125,42,0.18)",
                  cursor: "pointer",
                  textAlign: "left",
                  boxShadow: isSelected
                    ? `0 8px 50px rgba(155,125,42,0.22), 0 0 40px rgba(201,168,76,0.12), inset 0 1px 0 rgba(255,220,80,0.08)`
                    : "0 4px 24px rgba(0,0,0,0.45)",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Selected shimmer streak */}
                {isSelected && (
                  <motion.div
                    style={{
                      position: "absolute", inset: 0, pointerEvents: "none",
                      background: "linear-gradient(105deg, transparent 30%, rgba(255,220,80,0.06) 50%, transparent 70%)",
                    }}
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                )}

                {/* Top corner rune */}
                <div style={{
                  position: "absolute",
                  top: "10px",
                  right: "14px",
                  fontFamily: "'Cinzel', serif",
                  fontSize: "0.9rem",
                  color: isSelected ? `${cat.houseColor}60` : "rgba(155,125,42,0.15)",
                  transition: "color 0.3s",
                }}>{cat.houseRune}</div>

                {/* Icon */}
                <div style={{
                  marginBottom: "14px",
                  opacity: isSelected ? 1 : 0.75,
                  transform: isSelected ? "scale(1.08)" : "scale(1)",
                  transition: "all 0.35s cubic-bezier(0.22,1,0.36,1)",
                  filter: isSelected ? `drop-shadow(0 0 8px ${cat.houseColor}40)` : "none",
                }}>
                  {cat.icon}
                </div>

                {/* Name */}
                <div style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: "0.92rem",
                  fontWeight: 700,
                  color: isSelected ? "#FFE88A" : "#C9A84C",
                  letterSpacing: "0.06em",
                  marginBottom: "7px",
                  transition: "color 0.3s",
                }}>{cat.name}</div>

                {/* Description */}
                <div style={{
                  fontFamily: "'EB Garamond', serif",
                  fontSize: "0.88rem",
                  color: "rgba(155,125,42,0.55)",
                  fontStyle: "italic",
                  lineHeight: "1.45",
                }}>{cat.description}</div>

                {/* Selected dot */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{
                      position: "absolute",
                      bottom: "12px",
                      right: "12px",
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      background: "#FFD700",
                      boxShadow: "0 0 10px #FFD700, 0 0 20px rgba(255,215,0,0.4)",
                    }}
                  />
                )}

                {/* Bottom shimmer line on hover (via border-bottom) */}
                <div style={{
                  position: "absolute",
                  bottom: 0, left: "10%", right: "10%",
                  height: "1px",
                  background: isSelected
                    ? `linear-gradient(90deg, transparent, ${cat.houseColor}50, transparent)`
                    : "transparent",
                  transition: "background 0.3s",
                }} />
              </motion.button>
            );
          })}
        </motion.div>

        {/* ── Loading ── */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ textAlign: "center", padding: "70px 20px" }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                style={{ display: "inline-block", marginBottom: "20px" }}
              >
                <BookOpen size={52} style={{ color: "#C9A84C", opacity: 0.85 }} />
              </motion.div>
              <div style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "0.78rem",
                letterSpacing: "0.28em",
                color: "rgba(155,125,42,0.55)",
                marginBottom: "8px",
              }}>CONSULTING THE ANCIENT TOMES…</div>
              <div style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic",
                fontSize: "1rem",
                color: "rgba(155,125,42,0.35)",
              }}>The grimoire pages turn of their own accord</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Guide display ── */}
        <AnimatePresence mode="wait">
          {!loading && guideData && selectedWaste && (
            <SmartGuideDisplay guide={guideData} wasteType={selectedWaste} />
          )}
        </AnimatePresence>

        {/* ── Empty state ── */}
        {!loading && !guideData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            style={{
              textAlign: "center",
              padding: "90px 20px",
              borderRadius: "18px",
              background: "linear-gradient(135deg, rgba(5,4,14,0.9), rgba(8,6,22,0.85))",
              border: "1px solid rgba(155,125,42,0.14)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Decorative rune circle */}
            <div style={{
              position: "absolute",
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: "300px", height: "300px",
              borderRadius: "50%",
              border: "1px solid rgba(155,125,42,0.07)",
              pointerEvents: "none",
            }} />
            <div style={{
              position: "absolute",
              top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              width: "200px", height: "200px",
              borderRadius: "50%",
              border: "1px solid rgba(155,125,42,0.05)",
              pointerEvents: "none",
            }} />

            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              style={{ fontSize: "4rem", marginBottom: "20px", display: "block" }}
            >📚</motion.div>

            <div style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "0.9rem",
              letterSpacing: "0.22em",
              color: "rgba(155,125,42,0.5)",
              marginBottom: "14px",
            }}>SELECT A WASTE CATEGORY</div>

            <p style={{
              fontFamily: "'Cormorant Garamond', 'EB Garamond', serif",
              fontSize: "1.1rem",
              color: "rgba(155,125,42,0.35)",
              fontStyle: "italic",
              maxWidth: "380px",
              margin: "0 auto",
              lineHeight: 1.7,
            }}>
              Choose from the categories above to reveal the sacred disposal rituals inscribed within
            </p>
          </motion.div>
        )}

        {/* ── Footer ── */}
        <div style={{ marginTop: "90px", textAlign: "center" }}>
          <QuillDivider />
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "0.78rem",
            letterSpacing: "0.65em",
            color: "rgba(155,125,42,0.15)",
            marginBottom: "10px",
          }}>ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ ᚷ ᚹ ᚺ ᚾ ᛁ ᛃ ᛇ ᛈ ᛉ ᛊ ᛏ ᛒ ᛖ ᛗ ᛚ ᛜ ᛞ ᛟ</div>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontSize: "0.72rem",
            letterSpacing: "0.22em",
            color: "rgba(155,125,42,0.13)",
          }}>
            Ministry of Arcane Sanitation · Knowledge Division · Est. Anno Domini MMXXIV
          </div>
        </div>
      </div>
    </div>
  );
}