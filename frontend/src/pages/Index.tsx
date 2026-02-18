import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ScanSearch, Layers, Sparkles, TrendingUp, MapPin, Award } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Link } from "react-router-dom";

// ── Types ────────────────────────────────────────────────────────
type Detection = {
  id: number;
  wasteType: string;
  count: number;
  confidence: number;
  mode: string;
  lat: number;
  lng: number;
  timestamp: string;
};

type StatsData = {
  totalDetections: number;
  avgConfidence: number;
  uniqueLocations: number;
  mostCommonType: string;
};

// ── Floating rune particles ─────────────
const floatingRunes = ["ᚠ", "ᚢ", "ᚦ", "ᚱ", "ᚲ", "ᚷ", "ᚹ", "ᛟ", "ᛞ", "ᛈ", "ᚺ", "ᛊ"];

const Index = () => {
  const [stats, setStats] = useState<StatsData>({
    totalDetections: 0,
    avgConfidence: 0,
    uniqueLocations: 0,
    mostCommonType: "N/A",
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/detections");
        const detections: Detection[] = await res.json();

        const total = detections.length;
        const avgConf = total > 0
          ? detections.reduce((sum, d) => sum + d.confidence, 0) / total
          : 0;
        const uniqueLocs = new Set(
          detections.map((d) => `${d.lat.toFixed(2)},${d.lng.toFixed(2)}`)
        ).size;
        const typeCounts = detections.reduce<Record<string, number>>((acc, d) => {
          acc[d.wasteType] = (acc[d.wasteType] || 0) + 1;
          return acc;
        }, {});
        const mostCommon =
          Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

        setStats({
          totalDetections: total,
          avgConfidence: avgConf,
          uniqueLocations: uniqueLocs,
          mostCommonType: mostCommon,
        });
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(160deg, #04030A 0%, #07071A 45%, #050A0F 75%, #04030A 100%)",
        fontFamily: "'EB Garamond', Georgia, serif",
        color: "#C9B97A",
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {/* ── Google Fonts + global styles ─────────────────────────── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cinzel+Decorative:wght@400;700;900&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: rgba(10,8,20,0.5); }
        ::-webkit-scrollbar-thumb { background: rgba(155,125,42,0.4); border-radius: 2px; }

        @keyframes drift {
          0%   { transform: translateY(0px) rotate(0deg);   opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 0.6; }
          100% { transform: translateY(-120vh) rotate(360deg); opacity: 0; }
        }
        @keyframes shimmerSlide {
          from { transform: translateX(-100%); }
          to   { transform: translateX(300%); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 8px rgba(74, 222, 128, 0.4); }
          50% { box-shadow: 0 0 16px rgba(74, 222, 128, 0.8); }
        }
        @keyframes ornamentGlow {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .stat-card {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .stat-card:hover {
          transform: translateY(-4px) scale(1.02);
          box-shadow: 0 12px 40px rgba(155,125,42,0.2), inset 0 1px 0 rgba(201,168,76,0.15);
        }
      `}</style>

      {/* ── Ambient floating runes ──────────────────── */}
      {floatingRunes.map((r, i) => (
        <div
          key={i}
          style={{
            position: "fixed",
            left: `${5 + (i * 8.3) % 92}%`,
            bottom: "-40px",
            fontFamily: "'Cinzel', serif",
            fontSize: `${0.7 + (i % 4) * 0.2}rem`,
            color: "rgba(155,125,42,0.12)",
            pointerEvents: "none",
            animation: `drift ${18 + (i * 3.7) % 22}s linear ${
              (i * 2.1) % 15
            }s infinite`,
            zIndex: 0,
          }}
        >
          {r}
        </div>
      ))}

      {/* ── Runic grid background ─────────────────────────────────── */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          backgroundImage: `linear-gradient(rgba(155,125,42,0.025) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(155,125,42,0.025) 1px, transparent 1px)`,
          backgroundSize: "52px 52px",
        }}
      />

      {/* ── Top radial glow ───────────────────────────────────────── */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "1000px",
          height: "500px",
          pointerEvents: "none",
          zIndex: 0,
          background:
            "radial-gradient(ellipse at top, rgba(130,85,15,0.14) 0%, transparent 65%)",
        }}
      />

      <Navbar />

      {/* ═══════════════════════════════════════════════════════════
          HERO SECTION
      ═══════════════════════════════════════════════════════════ */}
      <section style={{ position: "relative", paddingTop: "64px", overflow: "hidden" }}>
        {/* Decorative horizontal golden line */}
        <div
          style={{
            position: "absolute",
            top: "64px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "600px",
            maxWidth: "90vw",
            height: "1px",
            zIndex: 3,
            background:
              "linear-gradient(90deg, transparent, rgba(155,125,42,0.4), transparent)",
          }}
        />

        <div
          style={{
            position: "relative",
            zIndex: 4,
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "80px 24px 60px",
          }}
        >
          {/* ── Badge ──────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{ maxWidth: "760px", margin: "0 auto", textAlign: "center" }}
          >
            <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", marginBottom: "28px" }}>
              <div
                style={{
                  position: "relative",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "8px 22px",
                  borderRadius: "9999px",
                  background: "rgba(155,125,42,0.1)",
                  border: "1px solid rgba(201,168,76,0.3)",
                  boxShadow: "0 0 20px rgba(155,125,42,0.1)",
                }}
              >
                <span
                  style={{
                    position: "relative",
                    width: "7px",
                    height: "7px",
                    borderRadius: "9999px",
                    background: "#4ade80",
                    display: "inline-block",
                    flexShrink: 0,
                    animation: "glow-pulse 2s ease-in-out infinite",
                  }}
                />
                <Sparkles
                  style={{
                    width: "14px",
                    height: "14px",
                    color: "#FFD700",
                    animation: "sparkle 2s ease-in-out infinite",
                  }}
                />
                <span
                  style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: "0.65rem",
                    letterSpacing: "0.18em",
                    color: "rgba(201,168,76,0.8)",
                  }}
                >
                  ENCHANTED DETECTION · REAL-TIME MAGIC
                </span>
              </div>
            </div>

            {/* ── Headline ────────── */}
            <h1
              style={{
                fontFamily: "'Cinzel Decorative', 'Cinzel', serif",
                fontSize: "clamp(2rem, 6vw, 4.2rem)",
                fontWeight: 900,
                lineHeight: 1.15,
                letterSpacing: "0.04em",
                marginBottom: "22px",
              }}
            >
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #FFF0A0 0%, #E8C84A 22%, #C9A84C 50%, #9B7D2A 75%, #C9A84C 100%)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  display: "block",
                  animation: "shimmer 6s linear infinite",
                }}
              >
                Magical Waste
              </span>
              <span
                style={{
                  background:
                    "linear-gradient(135deg, #C9A84C 0%, #FFE57A 50%, #C9A84C 100%)",
                  backgroundSize: "200% auto",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  display: "block",
                  fontSize: "clamp(1.6rem, 5vw, 3.5rem)",
                  animation: "shimmer 6s linear infinite 0.5s",
                }}
              >
                Divination System
              </span>
            </h1>

            {/* ── Subheading ────────────────────────────────────────── */}
            <p
              style={{
                fontSize: "1.1rem",
                color: "rgba(155,125,42,0.7)",
                fontStyle: "italic",
                maxWidth: "580px",
                margin: "0 auto 44px",
                lineHeight: 1.8,
                letterSpacing: "0.02em",
                fontFamily: "'Cormorant Garamond', 'EB Garamond', serif",
              }}
            >
              Summon the power of ancient runes and modern alchemy. Classify waste with
              the precision of Hermione's spellwork—choose your enchantment wisely.
            </p>

            {/* ── Runic divider ─────────────────────────────────────── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                marginBottom: "44px",
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: "1px",
                  background: "linear-gradient(90deg, transparent, rgba(155,125,42,0.4))",
                }}
              />
              <span
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: "0.9rem",
                  color: "rgba(201,168,76,0.45)",
                  letterSpacing: "0.4em",
                }}
              >
                ✦ ᚱ ᚢ ᚾ ✦
              </span>
              <div
                style={{
                  flex: 1,
                  height: "1px",
                  background:
                    "linear-gradient(90deg, rgba(155,125,42,0.4), transparent)",
                }}
              />
            </div>
          </motion.div>

          {/* ── Mode Cards ───── */}
          <div
            style={{
              maxWidth: "900px",
              margin: "0 auto 72px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "32px",
            }}
          >
            {[
              {
                title: "Single Object Divination",
                description:
                  "Cast Revelio on a solitary artifact. Our enchanted scrying glass reveals its true nature with the clarity of a Pensieve memory.",
                icon: ScanSearch,
                models: "Point Me · Revelio",
                to: "/detect?mode=single",
                delay: 0.2,
                rune: "ᛁ",
                spell: "Revelio Unum",
                gradient: "linear-gradient(135deg, rgba(70,130,180,0.15), rgba(50,90,140,0.1))",
                borderGlow: "rgba(70,130,180,0.4)",
              },
              {
                title: "Garbage Pile Scrying",
                description:
                  "Unleash Hominum Revelio upon the chaos. Count every fragment, classify every shard—even Moody's eye would be impressed.",
                icon: Layers,
                models: "Geminio · Accio Multum",
                to: "/detect?mode=pile",
                delay: 0.35,
                rune: "ᚷ",
                spell: "Revelio Multum",
                gradient: "linear-gradient(135deg, rgba(180,60,30,0.15), rgba(140,40,20,0.1))",
                borderGlow: "rgba(180,60,30,0.4)",
              },
            ].map((card, i) => {
              const Icon = card.icon;
              return (
                <Link to={card.to} key={i} style={{ textDecoration: "none" }}>
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: card.delay, duration: 0.6 }}
                    whileHover={{ y: -6, scale: 1.01 }}
                    style={{
                      position: "relative",
                      borderRadius: "12px",
                      border: "1px solid rgba(155,125,42,0.25)",
                      background: `linear-gradient(155deg, rgba(15,12,30,0.85) 0%, rgba(8,7,20,0.95) 100%), ${card.gradient}`,
                      backdropFilter: "blur(8px)",
                      padding: "36px 28px",
                      overflow: "hidden",
                      cursor: "pointer",
                      transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                    onHoverStart={(e) => {
                      const el = e.target as HTMLElement;
                      el.style.borderColor = card.borderGlow;
                      el.style.boxShadow = `0 8px 40px ${card.borderGlow}40, inset 0 1px 0 rgba(201,168,76,0.1)`;
                    }}
                    onHoverEnd={(e) => {
                      const el = e.target as HTMLElement;
                      el.style.borderColor = "rgba(155,125,42,0.25)";
                      el.style.boxShadow = "none";
                    }}
                  >
                    {/* Corner ornaments */}
                    <div
                      style={{
                        position: "absolute",
                        top: "0",
                        left: "0",
                        width: "40px",
                        height: "40px",
                        borderTop: "2px solid rgba(155,125,42,0.3)",
                        borderLeft: "2px solid rgba(155,125,42,0.3)",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: "0",
                        right: "0",
                        width: "40px",
                        height: "40px",
                        borderTop: "2px solid rgba(155,125,42,0.3)",
                        borderRight: "2px solid rgba(155,125,42,0.3)",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        bottom: "0",
                        left: "0",
                        width: "40px",
                        height: "40px",
                        borderBottom: "2px solid rgba(155,125,42,0.3)",
                        borderLeft: "2px solid rgba(155,125,42,0.3)",
                      }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        bottom: "0",
                        right: "0",
                        width: "40px",
                        height: "40px",
                        borderBottom: "2px solid rgba(155,125,42,0.3)",
                        borderRight: "2px solid rgba(155,125,42,0.3)",
                      }}
                    />

                    {/* Shimmer on hover */}
                    <motion.div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: "1px",
                        background:
                          "linear-gradient(90deg, transparent, rgba(201,168,76,0.5), transparent)",
                        animation: `shimmerSlide ${3 + i}s linear infinite`,
                      }}
                    />

                    {/* Rune watermark */}
                    <div
                      style={{
                        position: "absolute",
                        top: "24px",
                        right: "24px",
                        fontFamily: "'Cinzel', serif",
                        fontSize: "3rem",
                        color: "rgba(155,125,42,0.08)",
                        fontWeight: 700,
                        pointerEvents: "none",
                        animation: "ornamentGlow 3s ease-in-out infinite",
                      }}
                    >
                      {card.rune}
                    </div>

                    {/* Spell name */}
                    <div
                      style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: "0.6rem",
                        letterSpacing: "0.3em",
                        color: "rgba(155,125,42,0.5)",
                        marginBottom: "20px",
                        textTransform: "uppercase",
                      }}
                    >
                      {card.spell}
                    </div>

                    {/* Icon */}
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "64px",
                        height: "64px",
                        borderRadius: "12px",
                        background: "rgba(155,125,42,0.1)",
                        border: "1px solid rgba(155,125,42,0.25)",
                        marginBottom: "24px",
                      }}
                    >
                      <Icon style={{ width: "32px", height: "32px", color: "#D4A830" }} />
                    </div>

                    {/* Title */}
                    <h3
                      style={{
                        fontFamily: "'Cinzel', serif",
                        fontSize: "1.35rem",
                        fontWeight: 700,
                        color: "#E8D49A",
                        marginBottom: "12px",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {card.title}
                    </h3>

                    {/* Description */}
                    <p
                      style={{
                        fontFamily: "'Cormorant Garamond', 'EB Garamond', serif",
                        fontSize: "0.98rem",
                        lineHeight: 1.8,
                        color: "rgba(155,125,42,0.65)",
                        marginBottom: "20px",
                        fontStyle: "italic",
                      }}
                    >
                      {card.description}
                    </p>

                    {/* Models badge */}
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        padding: "6px 16px",
                        borderRadius: "6px",
                        background: "rgba(155,125,42,0.08)",
                        border: "1px solid rgba(155,125,42,0.2)",
                        fontFamily: "'Cinzel', serif",
                        fontSize: "0.7rem",
                        letterSpacing: "0.1em",
                        color: "rgba(201,168,76,0.7)",
                      }}
                    >
                      {card.models}
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>

          {/* ── Live Stats Section ──────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            style={{ maxWidth: "1100px", margin: "0 auto 60px" }}
          >
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <div
                style={{
                  fontFamily: "'Cinzel', serif",
                  fontSize: "0.6rem",
                  letterSpacing: "0.28em",
                  color: "rgba(155,125,42,0.5)",
                  marginBottom: "10px",
                }}
              >
                ✦ CHAMBER OF RECORDS
              </div>
              <h2
                style={{
                  fontFamily: "'Cinzel Decorative', 'Cinzel', serif",
                  fontSize: "1.8rem",
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #FFE57A, #C9A84C)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  letterSpacing: "0.04em",
                  marginBottom: "8px",
                }}
              >
                The Book of Detections
              </h2>
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontStyle: "italic",
                  fontSize: "1rem",
                  color: "rgba(155,125,42,0.6)",
                }}
              >
                Live chronicles from the Ministry's enchanted archives
              </p>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "24px",
              }}
            >
              {[
                {
                  label: "Total Detections",
                  value: isLoading ? "—" : stats.totalDetections.toString(),
                  icon: Award,
                  rune: "ᛞ",
                  color: "#C9A84C",
                  description: "Artifacts Revealed",
                },
                {
                  label: "Most Common Arcana",
                  value: isLoading ? "—" : stats.mostCommonType,
                  icon: TrendingUp,
                  rune: "ᛈ",
                  color: "#50C878",
                  description: "Dominant Essence",
                },
                {
                  label: "Scrying Locations",
                  value: isLoading ? "—" : stats.uniqueLocations.toString(),
                  icon: MapPin,
                  rune: "ᚺ",
                  color: "#4A90E2",
                  description: "Hexes Surveyed",
                },
                {
                  label: "Confidence",
                  value: isLoading
                    ? "—"
                    : `${(stats.avgConfidence * 100).toFixed(1)}%`,
                  icon: Sparkles,
                  rune: "ᛟ",
                  color: "#E8C84A",
                  description: "Certainty Level",
                },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    className="stat-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                    style={{
                      position: "relative",
                      borderRadius: "14px",
                      border: "1px solid rgba(155,125,42,0.25)",
                      background:
                        "linear-gradient(135deg, rgba(10,8,28,0.92), rgba(15,12,35,0.88))",
                      padding: "28px 24px",
                      overflow: "hidden",
                      boxShadow:
                        "0 4px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(201,168,76,0.06)",
                    }}
                  >
                    {/* Ambient glow */}
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        width: "120px",
                        height: "120px",
                        background: `radial-gradient(circle, ${stat.color}15, transparent)`,
                        filter: "blur(30px)",
                        pointerEvents: "none",
                      }}
                    />

                    {/* Rune watermark */}
                    <div
                      style={{
                        position: "absolute",
                        top: "16px",
                        right: "20px",
                        fontFamily: "'Cinzel', serif",
                        fontSize: "2.5rem",
                        color: "rgba(155,125,42,0.06)",
                        fontWeight: 700,
                        pointerEvents: "none",
                      }}
                    >
                      {stat.rune}
                    </div>

                    <div style={{ position: "relative", zIndex: 1 }}>
                      {/* Icon */}
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: "48px",
                          height: "48px",
                          borderRadius: "10px",
                          background: `${stat.color}20`,
                          border: `1px solid ${stat.color}40`,
                          marginBottom: "16px",
                        }}
                      >
                        <Icon style={{ width: "24px", height: "24px", color: stat.color }} />
                      </div>

                      {/* Label */}
                      <div
                        style={{
                          fontFamily: "'Cinzel', serif",
                          fontSize: "0.6rem",
                          letterSpacing: "0.2em",
                          color: "rgba(155,125,42,0.55)",
                          marginBottom: "8px",
                          textTransform: "uppercase",
                        }}
                      >
                        {stat.label}
                      </div>

                      {/* Value */}
                      <div
                        style={{
                          fontFamily: "'Cinzel Decorative', 'Cinzel', serif",
                          fontSize: "1.9rem",
                          fontWeight: 700,
                          color: stat.color,
                          marginBottom: "6px",
                          lineHeight: 1,
                        }}
                      >
                        {stat.value}
                      </div>

                      {/* Description */}
                      <div
                        style={{
                          fontFamily: "'Cormorant Garamond', serif",
                          fontStyle: "italic",
                          fontSize: "0.85rem",
                          color: "rgba(155,125,42,0.45)",
                        }}
                      >
                        {stat.description}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Bottom fade */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "120px",
            zIndex: 4,
            background: "linear-gradient(to bottom, transparent, rgba(4,3,10,0.9))",
            pointerEvents: "none",
          }}
        />
      </section>

      {/* ═══════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════ */}
      <footer
        style={{
          position: "relative",
          zIndex: 5,
          borderTop: "1px solid rgba(155,125,42,0.18)",
          background: "rgba(4,3,10,0.95)",
          backdropFilter: "blur(12px)",
          padding: "32px 24px",
          textAlign: "center",
        }}
      >
        {/* Runic separator */}
        <div
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "0.72rem",
            letterSpacing: "0.55em",
            color: "rgba(155,125,42,0.13)",
            marginBottom: "20px",
          }}
        >
          ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ ᚷ ᚹ ᚺ ᚾ ᛁ ᛃ ᛇ ᛈ ᛉ ᛊ ᛏ ᛒ ᛖ ᛗ ᛚ ᛜ ᛞ ᛟ
        </div>

        {/* Main footer content */}
        <div
          style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "0.62rem",
            letterSpacing: "0.2em",
            color: "rgba(155,125,42,0.45)",
            marginBottom: "12px",
          }}
        >
          MINISTRY OF MAGICAL WASTE MANAGEMENT
        </div>

        <div
          style={{
            fontFamily: "'Cormorant Garamond', 'EB Garamond', serif",
            fontStyle: "italic",
            fontSize: "0.85rem",
            color: "rgba(155,125,42,0.35)",
            marginBottom: "16px",
            lineHeight: 1.6,
          }}
        >
          Powered by the Unbreakable Vow between YOLO Detection Charms &<br />
          Convolutional Neural Networks · Est. 2025
        </div>

        {/* Live stats summary */}
        {!isLoading && stats.totalDetections > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 20px",
              borderRadius: "8px",
              background: "rgba(155,125,42,0.06)",
              border: "1px solid rgba(155,125,42,0.15)",
              marginBottom: "16px",
            }}
          >
            <Sparkles
              style={{
                width: "14px",
                height: "14px",
                color: "#FFD700",
                animation: "sparkle 2s ease-in-out infinite",
              }}
            />
            <span
              style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "0.7rem",
                letterSpacing: "0.12em",
                color: "rgba(201,168,76,0.6)",
              }}
            >
              <strong style={{ color: "#C9A84C" }}>{stats.totalDetections}</strong> Detections Catalogued
              {" · "}
              <strong style={{ color: "#C9A84C" }}>{stats.uniqueLocations}</strong> Locations Mapped
              {" · "}
              <strong style={{ color: "#C9A84C" }}>
                {(stats.avgConfidence * 100).toFixed(0)}%
              </strong>{" "}
              Certainty
            </span>
          </motion.div>
        )}

        {/* Quote */}
        <div
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic",
            fontSize: "0.8rem",
            color: "rgba(155,125,42,0.28)",
            letterSpacing: "0.02em",
          }}
        >
          "It is our choices, Harry, that show what we truly are,
          <br />
          far more than our abilities — even in waste segregation."
        </div>

        <div
          style={{
            marginTop: "16px",
            paddingTop: "16px",
            borderTop: "1px solid rgba(155,125,42,0.1)",
            fontFamily: "'Cinzel', serif",
            fontSize: "0.58rem",
            letterSpacing: "0.15em",
            color: "rgba(155,125,42,0.25)",
          }}
        >
          ⚡ ALWAYS · MARAUDERS' TECH LAB · MISCHIEF MANAGED
        </div>
      </footer>
    </div>
  );
};

export default Index;