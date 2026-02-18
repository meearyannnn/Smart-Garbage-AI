import { motion } from "framer-motion";
import { ScanSearch, Recycle, MapPin, Zap } from "lucide-react";

const stats = [
  { 
    label: "Artifacts Revealed", 
    value: "12,847", 
    icon: ScanSearch,
    rune: "ᛞ",
    emoji: "⚗️",
    color: "#d4af37"
  },
  { 
    label: "Classification Rate", 
    value: "98.2%", 
    icon: Recycle,
    rune: "ᛈ",
    emoji: "🜁",
    color: "#8b7355"
  },
  { 
    label: "Hexes Mapped", 
    value: "342", 
    icon: MapPin,
    rune: "ᚺ",
    emoji: "🔮",
    color: "#722f37"
  },
  { 
    label: "Incantations Active", 
    value: "3", 
    icon: Zap,
    rune: "ᛟ",
    emoji: "✦",
    color: "#2a623d"
  },
];

export default function StatsBar() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap');
        
        @keyframes runeGlow {
          0%, 100% { opacity: 0.08; }
          50% { opacity: 0.15; }
        }
        
        @keyframes cornerShimmer {
          0% { opacity: 0.3; }
          50% { opacity: 0.6; }
          100% { opacity: 0.3; }
        }
      `}</style>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
        padding: "20px",
      }}>
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1, duration: 0.6 }}
              whileHover={{ scale: 1.03, y: -4 }}
              style={{
                position: "relative",
                background: "linear-gradient(135deg, rgba(10,8,28,0.95) 0%, rgba(15,12,35,0.9) 100%)",
                borderRadius: "14px",
                border: "1px solid rgba(155,125,42,0.3)",
                padding: "24px 20px",
                overflow: "hidden",
                boxShadow: "0 4px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(201,168,76,0.08)",
                cursor: "default",
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${stat.color}80`;
                e.currentTarget.style.boxShadow = `0 6px 35px ${stat.color}25, inset 0 1px 0 rgba(201,168,76,0.12)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(155,125,42,0.3)";
                e.currentTarget.style.boxShadow = "0 4px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(201,168,76,0.08)";
              }}
            >
              {/* Rune watermark */}
              <div 
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "12px",
                  fontFamily: "'Cinzel', serif",
                  fontSize: "2.2rem",
                  color: "rgba(155,125,42,0.08)",
                  fontWeight: 700,
                  animation: "runeGlow 3s ease-in-out infinite",
                }}
              >
                {stat.rune}
              </div>

              {/* Corner glow effect */}
              <div 
                style={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  width: "70px",
                  height: "70px",
                  borderRadius: "50%",
                  background: `radial-gradient(circle, ${stat.color}15, transparent)`,
                  filter: "blur(12px)",
                  pointerEvents: "none",
                }}
              />

              {/* Top corner ornaments */}
              <div 
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "24px",
                  height: "24px",
                  borderTop: "2px solid rgba(155,125,42,0.3)",
                  borderLeft: "2px solid rgba(155,125,42,0.3)",
                  animation: "cornerShimmer 2s ease-in-out infinite",
                }}
              />
              <div 
                style={{
                  position: "absolute",
                  top: 0,
                  right: 0,
                  width: "24px",
                  height: "24px",
                  borderTop: "2px solid rgba(155,125,42,0.3)",
                  borderRight: "2px solid rgba(155,125,42,0.3)",
                  animation: "cornerShimmer 2s ease-in-out infinite",
                  animationDelay: "0.3s",
                }}
              />

              {/* Icon with magical aura */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "16px",
                position: "relative",
                zIndex: 1,
              }}>
                {/* Emoji icon */}
                <div style={{
                  fontSize: "1.6rem",
                  filter: `drop-shadow(0 0 8px ${stat.color}50)`,
                }}>
                  {stat.emoji}
                </div>

                {/* Lucide icon with colored aura */}
                <div 
                  style={{
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <div 
                    style={{
                      position: "absolute",
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: `${stat.color}30`,
                      filter: "blur(6px)",
                    }}
                  />
                  <Icon 
                    style={{ 
                      width: "20px", 
                      height: "20px", 
                      color: stat.color,
                      position: "relative",
                      zIndex: 1,
                      filter: `drop-shadow(0 0 4px ${stat.color}80)`,
                    }} 
                  />
                </div>
              </div>

              {/* Label */}
              <div style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "0.6rem",
                letterSpacing: "0.2em",
                color: "rgba(155,125,42,0.55)",
                marginBottom: "8px",
                textTransform: "uppercase",
              }}>
                {stat.label}
              </div>

              {/* Value with gradient text */}
              <div style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "1.75rem",
                fontWeight: 700,
                background: "linear-gradient(135deg, #FFE57A 0%, #C9A84C 50%, #D4A830 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                lineHeight: 1.2,
                textShadow: "0 2px 4px rgba(0,0,0,0.3)",
              }}>
                {stat.value}
              </div>

              {/* Bottom accent line */}
              <div 
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "1px",
                  background: `linear-gradient(90deg, transparent, ${stat.color}60, transparent)`,
                }}
              />
            </motion.div>
          );
        })}
      </div>
    </>
  );
}