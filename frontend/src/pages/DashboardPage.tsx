import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Navbar from "@/components/Navbar";

// ── Types ─────────────────────────────────────────────────────────────────────
type Detection = {
  id: number; wasteType: string; count: number;
  confidence: number; mode: string;
  lat: number; lng: number; timestamp: string;
};

// ── Golden Map Marker ─────────────────────────────────────────────────────────
const goldenIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="position:relative;width:32px;height:32px;filter:drop-shadow(0 0 8px rgba(255,215,0,0.8)) drop-shadow(0 0 12px rgba(255,215,0,0.5));">
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L12 22M12 2C12 2 8 6 8 10C8 13 9.79 14 12 14C14.21 14 16 13 16 10C16 6 12 2 12 2Z" stroke="url(#gg)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="url(#gf)"/>
      <circle cx="12" cy="10" r="3" fill="url(#gb)"/>
      <defs>
        <linearGradient id="gg" x1="12" y1="2" x2="12" y2="22"><stop offset="0%" stop-color="#FFD700"/><stop offset="100%" stop-color="#DAA520"/></linearGradient>
        <radialGradient id="gf"><stop offset="0%" stop-color="#FFE57A" stop-opacity="0.9"/><stop offset="100%" stop-color="#C9A84C" stop-opacity="0.7"/></radialGradient>
        <radialGradient id="gb"><stop offset="0%" stop-color="#FFF"/><stop offset="100%" stop-color="#FFD700"/></radialGradient>
      </defs>
    </svg>
  </div>`,
  iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32],
});

// ── Spell Particles ───────────────────────────────────────────────────────────
function SpellParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    let raf: number;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize(); window.addEventListener("resize", resize);
    const stars = Array.from({ length: 80 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.2, alpha: Math.random(),
      da: (Math.random() - 0.5) * 0.012,
      vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach(s => {
        s.alpha = Math.max(0.05, Math.min(1, s.alpha + s.da));
        if (s.alpha <= 0.05 || s.alpha >= 1) s.da *= -1;
        s.x = (s.x + s.vx + canvas.width) % canvas.width;
        s.y = (s.y + s.vy + canvas.height) % canvas.height;
        const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 3);
        g.addColorStop(0, `rgba(212,175,55,${s.alpha})`); g.addColorStop(1, "transparent");
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 3, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

// ── Quill Divider ─────────────────────────────────────────────────────────────
function QuillDivider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-4 my-6">
      <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.5))" }} />
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.7rem", color: "rgba(201,168,76,0.4)" }}>✦</span>
        {label
          ? <span style={{ fontFamily: "'Cormorant Garamond','EB Garamond',serif", fontSize: "0.72rem", letterSpacing: "0.32em", color: "rgba(201,168,76,0.5)", fontStyle: "italic", whiteSpace: "nowrap" as const }}>{label}</span>
          : <span style={{ fontFamily: "'Cinzel', serif", fontSize: "1rem", color: "rgba(201,168,76,0.38)", letterSpacing: "0.4em" }}>ᚱ ᚢ ᚾ</span>
        }
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.7rem", color: "rgba(201,168,76,0.4)" }}>✦</span>
      </div>
      <div className="flex-1 h-px" style={{ background: "linear-gradient(270deg, transparent, rgba(201,168,76,0.5))" }} />
    </div>
  );
}

// ── Spell Select ──────────────────────────────────────────────────────────────
function SpellSelect({ value, onChange, options, icon }: { value: string; onChange: (v: string) => void; options: string[]; icon: string }) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)} style={{ appearance: "none", background: "rgba(10,8,20,0.85)", border: "1px solid rgba(155,125,42,0.4)", borderRadius: "8px", padding: "8px 36px 8px 14px", fontFamily: "'Cinzel', serif", fontSize: "0.72rem", color: "#C9A84C", letterSpacing: "0.05em", cursor: "pointer", boxShadow: "0 0 12px rgba(155,125,42,0.08)", outline: "none" }}>
        {options.map(o => <option key={o} value={o} style={{ background: "#0A0814" }}>{o}</option>)}
      </select>
      <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#9B7D2A", fontSize: "0.75rem" }}>{icon}</span>
    </div>
  );
}

// ── Mode Badge ────────────────────────────────────────────────────────────────
function ModeBadge({ mode }: { mode: string }) {
  const isPile = mode === "Pile" || mode === "pile" || mode === "Garbage Pile";
  return (
    <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.62rem", letterSpacing: "0.08em", padding: "2px 10px", borderRadius: "9999px", background: isPile ? "rgba(180,60,30,0.15)" : "rgba(80,120,220,0.15)", border: `1px solid ${isPile ? "rgba(180,60,30,0.4)" : "rgba(80,120,220,0.4)"}`, color: isPile ? "#E06040" : "#7090E0" }}>
      {isPile ? "⚡ Pile" : "✦ Single"}
    </span>
  );
}

// ── Waste Pie Chart ───────────────────────────────────────────────────────────
const PIE_COLORS = ["#C9A84C", "#50C878", "#4A90E2", "#E74C3C", "#B19CD9", "#F1C40F", "#34D399", "#FF6B00", "#87CEEB", "#C19A6B"];

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(8,6,22,0.98), rgba(12,10,30,0.96))",
      border: "1px solid rgba(201,168,76,0.35)", borderRadius: "12px",
      padding: "12px 18px", boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
    }}>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.7rem", letterSpacing: "0.1em", color: "#FFE57A", marginBottom: "4px" }}>{payload[0].name}</div>
      <div style={{ fontFamily: "'Cormorant Garamond','EB Garamond',serif", fontStyle: "italic", fontSize: "0.9rem", color: "rgba(201,168,76,0.7)" }}>
        {payload[0].value} detection{payload[0].value !== 1 ? "s" : ""}
      </div>
    </div>
  );
};

const CustomLegend = ({ payload }: { payload?: Array<{ value: string; color: string }> }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", justifyContent: "center", marginTop: "12px" }}>
    {payload?.map((entry, i: number) => (
      <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: entry.color, boxShadow: `0 0 6px ${entry.color}60` }} />
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.08em", color: "rgba(201,168,76,0.6)" }}>{entry.value}</span>
      </div>
    ))}
  </div>
);

function WasteAnalyticsChart({ detections }: { detections: Detection[] }) {
  const wasteData = Object.entries(
    detections.reduce<Record<string, number>>((acc, curr) => {
      acc[curr.wasteType] = (acc[curr.wasteType] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  if (wasteData.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, duration: 0.7 }}
      style={{
        background: "linear-gradient(135deg, rgba(8,6,22,0.97), rgba(12,10,30,0.94))",
        borderRadius: "18px", border: "1px solid rgba(155,125,42,0.28)",
        padding: "28px 32px",
        boxShadow: "0 8px 50px rgba(0,0,0,0.6), inset 0 1px 0 rgba(201,168,76,0.06)",
        position: "relative", overflow: "hidden",
        marginBottom: "32px",
      }}
    >
      {/* Ambient glow */}
      <div style={{ position: "absolute", top: 0, right: 0, width: "280px", height: "280px", background: "radial-gradient(circle, rgba(201,168,76,0.06), transparent)", filter: "blur(60px)", pointerEvents: "none" }} />
      {/* Top bar */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent)", pointerEvents: "none" }} />
      {/* Rune watermark */}
      <div style={{ position: "absolute", top: "16px", right: "24px", fontFamily: "'Cinzel', serif", fontSize: "6rem", color: "rgba(155,125,42,0.04)", fontWeight: 900, pointerEvents: "none", lineHeight: 1 }}>ᛈ</div>

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ marginBottom: "8px" }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.55rem", letterSpacing: "0.32em", color: "rgba(155,125,42,0.45)", marginBottom: "8px" }}>✦ WASTE INTELLIGENCE ANALYTICS</div>
          <h2 style={{
            fontFamily: "'Cinzel Decorative', 'Cinzel', serif", fontSize: "1.2rem", fontWeight: 700,
            background: "linear-gradient(135deg, #FFE57A, #C9A84C)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text", letterSpacing: "0.04em", margin: "0 0 6px",
          }}>Arcana Distribution</h2>
          <p style={{ fontFamily: "'Cormorant Garamond','EB Garamond',serif", fontStyle: "italic", fontSize: "0.95rem", color: "rgba(155,125,42,0.5)", margin: 0 }}>
            A cartomantic view of the taint across all detected relics
          </p>
        </div>

        <QuillDivider label="The Scrying Orb" />

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", alignItems: "center" }}>
          {/* Pie */}
          <div style={{ height: "280px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={wasteData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={100} innerRadius={50}
                  paddingAngle={3}
                  animationBegin={200} animationDuration={900}
                >
                  {wasteData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PIE_COLORS[index % PIE_COLORS.length]}
                      stroke="rgba(0,0,0,0.4)"
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend content={<CustomLegend />} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Ranked list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.58rem", letterSpacing: "0.2em", color: "rgba(155,125,42,0.45)", marginBottom: "4px" }}>TOP ARCANA BY FREQUENCY</div>
            {wasteData.slice(0, 6).map((item, i) => {
              const total = wasteData.reduce((s, d) => s + d.value, 0);
              const pct = Math.round((item.value / total) * 100);
              const color = PIE_COLORS[i % PIE_COLORS.length];
              return (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.07 }}
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", color: "rgba(155,125,42,0.3)", width: "18px", textAlign: "right" }}>#{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.68rem", color: "#C9A84C", letterSpacing: "0.05em" }}>{item.name}</span>
                      <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.65rem", color: color, fontWeight: 700 }}>{pct}%</span>
                    </div>
                    <div style={{ height: "3px", borderRadius: "2px", background: "rgba(155,125,42,0.1)", overflow: "hidden" }}>
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.9, ease: "easeOut", delay: 0.7 + i * 0.07 }}
                        style={{ height: "100%", borderRadius: "2px", background: `linear-gradient(90deg, ${color}80, ${color})`, boxShadow: `0 0 6px ${color}50` }}
                      />
                    </div>
                  </div>
                  <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "0.8rem", color: "rgba(155,125,42,0.5)", minWidth: "24px", textAlign: "right" }}>{item.value}</div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
const wasteTypes = ["All Arcana", "Plastic", "Organic", "Glass", "Metal", "Paper", "E-Waste"];
const modes = ["All Realms", "Single Object", "Garbage Pile"];

export default function DashboardPage() {
  const [wasteFilter, setWasteFilter] = useState("All Arcana");
  const [modeFilter, setModeFilter] = useState("All Realms");
  const [hoveredRow, setHoveredRow] = useState<number | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/detections")
      .then(res => res.json()).then(data => setDetections(data))
      .catch(err => console.error("Failed to fetch:", err));
  }, []);

  const clearDetections = async () => {
    setIsClearing(true);
    try {
      await fetch("http://127.0.0.1:8000/clear-detections", { method: "DELETE" });
      const res = await fetch("http://127.0.0.1:8000/detections");
      setDetections(await res.json());
    } catch { alert("Failed to clear detections. Please try again."); }
    finally { setIsClearing(false); }
  };

  const filteredDetections = detections.filter(d => {
    const wasteMatch = wasteFilter === "All Arcana" || d.wasteType === wasteFilter;
    const modeMatch = modeFilter === "All Realms" ||
      (modeFilter === "Single Object" && (d.mode === "Single" || d.mode === "single")) ||
      (modeFilter === "Garbage Pile" && (d.mode === "Pile" || d.mode === "pile" || d.mode === "Garbage Pile"));
    return wasteMatch && modeMatch;
  });

  const total = filteredDetections.length;
  const mostCommon = filteredDetections.reduce<Record<string, number>>((acc, curr) => { acc[curr.wasteType] = (acc[curr.wasteType] || 0) + 1; return acc; }, {});
  const mostCommonType = Object.entries(mostCommon).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";
  const avgConfidence = filteredDetections.length > 0 ? (filteredDetections.reduce((s, d) => s + d.confidence, 0) / filteredDetections.length * 100).toFixed(1) : "0.0";
  const uniqueLocations = new Set(filteredDetections.map(d => `${d.lat.toFixed(2)},${d.lng.toFixed(2)}`)).size;
  const mapCenter: [number, number] = filteredDetections.length > 0
    ? [filteredDetections.reduce((s, d) => s + d.lat, 0) / filteredDetections.length, filteredDetections.reduce((s, d) => s + d.lng, 0) / filteredDetections.length]
    : [20.5937, 78.9629];
  const calculateZoom = () => {
    if (filteredDetections.length === 0) return 5;
    if (filteredDetections.length === 1) return 13;
    const lats = filteredDetections.map(d => d.lat), lngs = filteredDetections.map(d => d.lng);
    const maxSpread = Math.max(Math.max(...lats) - Math.min(...lats), Math.max(...lngs) - Math.min(...lngs));
    if (maxSpread < 0.01) return 13; if (maxSpread < 0.05) return 12; if (maxSpread < 0.1) return 11;
    if (maxSpread < 0.5) return 10; if (maxSpread < 1) return 9; if (maxSpread < 2) return 8; return 7;
  };

  const summaryData = [
    { label: "Total Detections", value: total.toString(), icon: "⚗️", rune: "ᛞ" },
    { label: "Most Common",      value: mostCommonType,   icon: "🜁", rune: "ᛈ" },
    { label: "Hotspot Hexes",    value: uniqueLocations.toString(), icon: "🔮", rune: "ᚺ" },
    { label: "Avg Confidence",   value: `${avgConfidence}%`, icon: "✦", rune: "ᛟ" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #04030A 0%, #080818 40%, #05080F 70%, #04030A 100%)", fontFamily: "'EB Garamond', Georgia, serif", color: "#C9B97A", position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cinzel+Decorative:wght@400;700;900&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: rgba(10,8,20,0.5); }
        ::-webkit-scrollbar-thumb { background: rgba(155,125,42,0.4); border-radius: 2px; }
        .spell-btn:hover { filter: brightness(1.3); box-shadow: 0 0 18px rgba(201,168,76,0.35) !important; }
        .detect-row:hover td { background: rgba(155,125,42,0.06); }
        .leaflet-container { z-index: 1; }
        .custom-marker { animation: pulse-glow 2s ease-in-out infinite; }
        @keyframes pulse-glow {
          0%,100% { filter: drop-shadow(0 0 8px rgba(255,215,0,0.8)) drop-shadow(0 0 12px rgba(255,215,0,0.5)); }
          50%      { filter: drop-shadow(0 0 12px rgba(255,215,0,1)) drop-shadow(0 0 18px rgba(255,215,0,0.7)); }
        }
        @keyframes shimmer { 0% { background-position:-200% center; } 100% { background-position:200% center; } }
        .leaflet-popup-content-wrapper { background: linear-gradient(135deg, rgba(10,8,28,0.98), rgba(15,12,35,0.95)) !important; border: 1px solid rgba(155,125,42,0.4) !important; border-radius: 12px !important; box-shadow: 0 0 20px rgba(155,125,42,0.3), 0 8px 32px rgba(0,0,0,0.6) !important; }
        .leaflet-popup-content { color: #C9A84C !important; font-family: 'Cinzel', serif !important; margin: 12px !important; }
        .leaflet-popup-tip { background: rgba(10,8,28,0.98) !important; }
      `}</style>

      <Navbar />
      <div className="absolute inset-0"><SpellParticles /></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at top, rgba(155,100,20,0.12) 0%, transparent 70%)" }} />

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "104px 32px 80px", position: "relative", zIndex: 1 }}>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} style={{ marginBottom: "8px" }}>
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "5px 18px", borderRadius: "30px", background: "rgba(155,125,42,0.07)", border: "1px solid rgba(201,168,76,0.18)", marginBottom: "16px" }}>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.72rem", color: "rgba(201,168,76,0.35)" }}>ᚠ</span>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.55rem", letterSpacing: "0.36em", color: "rgba(201,168,76,0.5)" }}>ENCHANTED CARTOGRAPHY · WASTE DIVISION</span>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.72rem", color: "rgba(201,168,76,0.35)" }}>ᚠ</span>
          </motion.div>

          <h1 style={{
            fontFamily: "'Cinzel Decorative', 'Cinzel', serif",
            fontSize: "clamp(1.6rem, 3vw, 2.8rem)", fontWeight: 900, letterSpacing: "0.04em", lineHeight: 1.2,
            background: "linear-gradient(135deg, #FFF0A0 0%, #E8C84A 22%, #C9A84C 50%, #9B7D2A 75%, #C9A84C 100%)",
            backgroundSize: "200% auto", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            backgroundClip: "text", animation: "shimmer 6s linear infinite", marginBottom: "8px",
          }}>Garbage Heatmap Grimoire</h1>

          <p style={{ fontFamily: "'Cormorant Garamond','EB Garamond',serif", fontSize: "1.05rem", fontStyle: "italic", color: "rgba(155,125,42,0.6)", letterSpacing: "0.02em" }}>
            Visualise the taint of filth across enchanted territories — reveal hotspots and banish the chaos.
          </p>
        </motion.div>

        <QuillDivider />

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {summaryData.map((item, i) => (
            <motion.div key={item.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.1 }} whileHover={{ scale: 1.03 }}
              style={{ position: "relative", background: "linear-gradient(135deg, rgba(10,8,28,0.95), rgba(15,12,35,0.9))", borderRadius: "14px", border: "1px solid rgba(155,125,42,0.3)", padding: "20px 18px", overflow: "hidden", boxShadow: "0 4px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(201,168,76,0.08)" }}>
              <div className="absolute top-2 right-3" style={{ fontFamily: "'Cinzel', serif", fontSize: "1.8rem", color: "rgba(155,125,42,0.08)", fontWeight: 700 }}>{item.rune}</div>
              <div className="absolute bottom-0 right-0 w-16 h-16 rounded-full" style={{ background: "radial-gradient(circle, rgba(155,125,42,0.07), transparent)", filter: "blur(10px)" }} />
              <div style={{ fontSize: "1.4rem", marginBottom: "6px" }}>{item.icon}</div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.2em", color: "rgba(155,125,42,0.55)", marginBottom: "4px" }}>{item.label.toUpperCase()}</div>
              <div style={{ fontFamily: "'Cinzel Decorative','Cinzel',serif", fontSize: "1.65rem", fontWeight: 700, background: "linear-gradient(135deg, #FFE57A, #C9A84C)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{item.value}</div>
            </motion.div>
          ))}
        </div>

        {/* Waste Analytics Chart */}
        <WasteAnalyticsChart detections={filteredDetections} />

        {/* Clear + Filters */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="mb-6">
          <button onClick={clearDetections} disabled={isClearing || detections.length === 0} className="spell-btn" style={{
            padding: "10px 20px", borderRadius: "10px",
            background: detections.length === 0 ? "rgba(80,80,80,0.2)" : "linear-gradient(135deg, rgba(180,60,30,0.25), rgba(140,40,20,0.2))",
            border: detections.length === 0 ? "1px solid rgba(100,100,100,0.3)" : "1px solid rgba(180,60,30,0.5)",
            color: detections.length === 0 ? "rgba(100,100,100,0.5)" : "#E06040",
            cursor: detections.length === 0 ? "not-allowed" : "pointer",
            fontFamily: "'Cinzel', serif", fontSize: "0.7rem", letterSpacing: "0.12em", fontWeight: 600,
            transition: "all 0.3s", boxShadow: detections.length === 0 ? "0 0 8px rgba(0,0,0,0.2)" : "0 0 15px rgba(180,60,30,0.15)",
            opacity: isClearing ? 0.6 : 1,
          }}>{isClearing ? "⏳ BANISHING..." : "🧹 PURGE ALL DETECTIONS"}</button>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex flex-wrap items-center gap-4 mb-6">
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.65rem", letterSpacing: "0.2em", color: "rgba(155,125,42,0.55)" }}>✦ FILTER ENCHANTMENTS:</div>
          <SpellSelect value={wasteFilter} onChange={setWasteFilter} options={wasteTypes} icon="🜁" />
          <SpellSelect value={modeFilter} onChange={setModeFilter} options={modes} icon="⚗" />
          <button className="spell-btn" style={{ fontFamily: "'Cinzel', serif", fontSize: "0.65rem", letterSpacing: "0.12em", padding: "8px 18px", borderRadius: "8px", background: "linear-gradient(135deg, rgba(155,100,20,0.3), rgba(100,60,10,0.2))", border: "1px solid rgba(201,168,76,0.4)", color: "#C9A84C", cursor: "pointer", transition: "all 0.2s", boxShadow: "0 0 12px rgba(155,125,42,0.1)" }}>⚡ CAST FILTER</button>
        </motion.div>

        {/* Map */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, duration: 0.8 }}>
          <div className="mb-2 flex items-center justify-between">
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.65rem", letterSpacing: "0.2em", color: "rgba(155,125,42,0.55)" }}>✦ CARTOGRAPHIA IMMUNDUS — ENCHANTED SCRYING MAP</div>
            <div className="flex gap-2">
              {["Realtime", "7 Moons", "30 Moons"].map((t, i) => (
                <button key={i} style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.1em", padding: "4px 12px", borderRadius: "6px", background: i === 0 ? "rgba(155,125,42,0.2)" : "transparent", border: `1px solid ${i === 0 ? "rgba(201,168,76,0.45)" : "rgba(155,125,42,0.2)"}`, color: i === 0 ? "#C9A84C" : "rgba(155,125,42,0.45)", cursor: "pointer" }}>{t}</button>
              ))}
            </div>
          </div>
          <div style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(155,125,42,0.35)", boxShadow: "0 0 60px rgba(155,125,42,0.08), 0 0 100px rgba(70,130,180,0.15)" }}>
            <MapContainer center={mapCenter} zoom={calculateZoom()} style={{ height: "420px", width: "100%" }}>
              <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" attribution='&copy; OpenStreetMap contributors &copy; CARTO' />
              {filteredDetections.map((d) => (
                <Marker key={d.id} position={[d.lat, d.lng]} icon={goldenIcon}>
                  <Popup>
                    <div style={{ fontFamily: "'Cinzel', serif" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: 700, marginBottom: "8px", letterSpacing: "0.05em", color: "#FFE57A", borderBottom: "1px solid rgba(155,125,42,0.3)", paddingBottom: "6px" }}>{d.wasteType}</div>
                      <div style={{ fontSize: "0.65rem", color: "#C9A84C", lineHeight: "1.6" }}>
                        <div><strong>Count:</strong> {d.count}</div>
                        <div><strong>Confidence:</strong> {(d.confidence * 100).toFixed(1)}%</div>
                        <div><strong>Mode:</strong> {d.mode}</div>
                        <div style={{ marginTop: "6px", paddingTop: "6px", borderTop: "1px solid rgba(155,125,42,0.2)", fontSize: "0.6rem", color: "rgba(155,125,42,0.6)", fontStyle: "italic" }}>{new Date(d.timestamp).toLocaleString()}</div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </motion.div>

        <QuillDivider label="Chronicles of Taint" />

        {/* Table */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.25em", color: "rgba(155,125,42,0.5)", marginBottom: "4px" }}>✦ CHRONICLES OF TAINT</div>
              <h2 style={{ fontFamily: "'Cinzel Decorative','Cinzel',serif", fontSize: "1.3rem", fontWeight: 700, color: "#E8D49A", letterSpacing: "0.05em" }}>Recent Detections</h2>
            </div>
            <button style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.12em", padding: "7px 16px", borderRadius: "8px", background: "transparent", border: "1px solid rgba(155,125,42,0.3)", color: "rgba(201,168,76,0.6)", cursor: "pointer" }}>VIEW ALL ›</button>
          </div>

          <div style={{ background: "rgba(6,5,16,0.9)", borderRadius: "16px", border: "1px solid rgba(155,125,42,0.25)", overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(201,168,76,0.06)" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(155,125,42,0.2)", background: "rgba(155,125,42,0.04)" }}>
                  {["Location", "Arcana Type", "Count", "Mode", "Time Elapsed"].map((h, i) => (
                    <th key={i} style={{ textAlign: "left", padding: "14px 20px", fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.2em", color: "rgba(155,125,42,0.55)", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredDetections.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: "40px 20px", textAlign: "center", fontFamily: "'Cormorant Garamond','EB Garamond',serif", fontStyle: "italic", color: "rgba(155,125,42,0.4)", fontSize: "1rem" }}>No detections found. The realm awaits your first scrying…</td></tr>
                ) : filteredDetections.map((row, i) => (
                  <motion.tr key={row.id} className="detect-row" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 + i * 0.08 }}
                    onMouseEnter={() => setHoveredRow(i)} onMouseLeave={() => setHoveredRow(null)}
                    style={{ borderBottom: i < filteredDetections.length - 1 ? "1px solid rgba(155,125,42,0.1)" : "none", transition: "background 0.2s", background: hoveredRow === i ? "rgba(155,125,42,0.06)" : "transparent" }}>
                    <td style={{ padding: "15px 20px" }}><div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.72rem", color: "#E8D49A", letterSpacing: "0.03em" }}>Lat: {row.lat.toFixed(3)}, Lng: {row.lng.toFixed(3)}</div></td>
                    <td style={{ padding: "15px 20px" }}><span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.7rem", color: "rgba(201,168,76,0.75)", letterSpacing: "0.05em" }}>{row.wasteType}</span></td>
                    <td style={{ padding: "15px 20px" }}><span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.85rem", fontWeight: 600, color: row.count > 5 ? "#E06040" : "#C9A84C" }}>{row.count}</span></td>
                    <td style={{ padding: "15px 20px" }}><ModeBadge mode={row.mode} /></td>
                    <td style={{ padding: "15px 20px" }}><span style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "0.8rem", color: "rgba(155,125,42,0.5)" }}>{new Date(row.timestamp).toLocaleString()}</span></td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <QuillDivider />
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.78rem", letterSpacing: "0.6em", color: "rgba(155,125,42,0.15)", marginBottom: "8px" }}>ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ ᚷ ᚹ ᚺ ᚾ ᛁ ᛃ ᛇ ᛈ ᛉ ᛊ ᛏ ᛒ ᛖ ᛗ ᛚ ᛜ ᛞ ᛟ</div>
          <div style={{ fontFamily: "'Cormorant Garamond',serif", fontStyle: "italic", fontSize: "0.68rem", letterSpacing: "0.2em", color: "rgba(155,125,42,0.12)" }}>Ministry of Arcane Sanitation · Classified Registry</div>
        </div>
      </div>
    </div>
  );
}