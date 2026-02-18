import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Detection {
  label: string; confidence: number;
  bbox?: number[]; area?: number;
  waste_type?: string; yolo_class?: string; yolo_conf?: number; source?: string;
}
interface DetectionResult {
  output_image?: string; image_base64?: string;
  detections: Detection[]; total_objects: number;
  mode?: string; smart_guide?: SmartGuide;
}
interface SmartGuide {
  bin: string; color: string; rune: string; title: string;
  subtitle: string; steps: string[]; tip: string; impact: string; prohibition: string;
}
interface DetectionResultsProps { mode: "single" | "pile"; result: DetectionResult; }

// ── Eco Impact Data ───────────────────────────────────────────────────────────
const ecoImpactData: Record<string, { co2: number; water: number; energy: number; trees: number }> = {
  Plastic:   { co2: 1.8, water: 15, energy: 2.5, trees: 0.08 },
  Paper:     { co2: 1.0, water: 10, energy: 1.2, trees: 0.05 },
  Cardboard: { co2: 0.9, water: 8,  energy: 1.0, trees: 0.04 },
  Glass:     { co2: 0.8, water: 5,  energy: 0.7, trees: 0.02 },
  Organic:   { co2: 0.5, water: 3,  energy: 0.2, trees: 0.01 },
  Metal:     { co2: 2.1, water: 20, energy: 3.2, trees: 0.10 },
  "E-Waste": { co2: 3.5, water: 25, energy: 5.0, trees: 0.15 },
  Battery:   { co2: 2.8, water: 18, energy: 4.0, trees: 0.12 },
  Hazardous: { co2: 4.0, water: 30, energy: 6.0, trees: 0.20 },
  Textile:   { co2: 2.2, water: 22, energy: 2.8, trees: 0.09 },
};

// ── Bin Rules ─────────────────────────────────────────────────────────────────
const BIN_RULES: Record<string, string> = {
  Plastic: "Blue", Organic: "Green", Glass: "Green",
  Paper: "Blue", Cardboard: "Blue", Metal: "Blue",
  "E-Waste": "Red", Battery: "Red", Hazardous: "Red", Textile: "Black",
};

// ── Confidence Bar ────────────────────────────────────────────────────────────
function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const color = pct > 80 ? "#C9A84C" : pct > 55 ? "#9B7D2A" : "#7A5A20";
  return (
    <div style={{ marginTop: "5px" }}>
      <div style={{ height: "3px", borderRadius: "2px", background: "rgba(155,125,42,0.15)", overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{ height: "100%", borderRadius: "2px", background: `linear-gradient(90deg, ${color}, rgba(255,220,80,0.8))`, boxShadow: `0 0 6px ${color}` }}
        />
      </div>
    </div>
  );
}

// ── Stat Tile ─────────────────────────────────────────────────────────────────
function StatTile({ label, value, rune, accent = false }: { label: string; value: string; rune: string; accent?: boolean }) {
  return (
    <div style={{
      position: "relative", textAlign: "center", padding: "18px 12px", borderRadius: "12px",
      background: accent ? "linear-gradient(135deg, rgba(155,100,20,0.18), rgba(100,65,10,0.1))" : "rgba(155,125,42,0.06)",
      border: `1px solid ${accent ? "rgba(201,168,76,0.3)" : "rgba(155,125,42,0.15)"}`,
      overflow: "hidden",
    }}>
      <div style={{ position: "absolute", top: "4px", right: "8px", fontFamily: "'Cinzel', serif", fontSize: "1.2rem", color: "rgba(155,125,42,0.1)", fontWeight: 700, pointerEvents: "none" }}>{rune}</div>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.55rem", letterSpacing: "0.22em", color: "rgba(155,125,42,0.5)", marginBottom: "6px" }}>{label.toUpperCase()}</div>
      <div style={{ fontFamily: "'Cinzel', serif", fontSize: "1rem", fontWeight: 700, background: accent ? "linear-gradient(135deg, #FFE57A, #C9A84C)" : "linear-gradient(135deg, #C9A84C, #9B7D2A)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", letterSpacing: "0.05em" }}>{value}</div>
    </div>
  );
}

// ── Quill Divider ─────────────────────────────────────────────────────────────
function QuillDivider({ glyph = "⚗", label }: { glyph?: string; label?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "20px 0" }}>
      <div style={{ flex: 1, height: "1px", background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.45))" }} />
      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.65rem", color: "rgba(201,168,76,0.4)" }}>✦</span>
        {label
          ? <span style={{ fontFamily: "'Cormorant Garamond','EB Garamond',serif", fontSize: "0.68rem", letterSpacing: "0.28em", color: "rgba(201,168,76,0.48)", fontStyle: "italic", whiteSpace: "nowrap" as const }}>{label}</span>
          : <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.72rem", color: "rgba(201,168,76,0.38)" }}>{glyph}</span>
        }
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.65rem", color: "rgba(201,168,76,0.4)" }}>✦</span>
      </div>
      <div style={{ flex: 1, height: "1px", background: "linear-gradient(270deg, transparent, rgba(201,168,76,0.45))" }} />
    </div>
  );
}

// ── Eco Bar ───────────────────────────────────────────────────────────────────
function EcoBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ height: "4px", borderRadius: "3px", background: "rgba(255,255,255,0.06)", overflow: "hidden", marginTop: "6px" }}>
      <motion.div
        initial={{ width: 0 }} animate={{ width: `${pct}%` }}
        transition={{ duration: 1.1, ease: "easeOut", delay: 0.3 }}
        style={{ height: "100%", borderRadius: "3px", background: `linear-gradient(90deg, ${color}80, ${color})`, boxShadow: `0 0 8px ${color}50` }}
      />
    </div>
  );
}

// ── Eco Impact Calculator ─────────────────────────────────────────────────────
function EcoImpactCalculator({ detections }: { detections: Detection[] }) {
  let totalCO2 = 0, totalWater = 0, totalEnergy = 0, totalTrees = 0;
  detections.forEach(det => {
    const d = ecoImpactData[det.label];
    if (d) { totalCO2 += d.co2; totalWater += d.water; totalEnergy += d.energy; totalTrees += d.trees; }
  });
  if (totalCO2 === 0 && totalWater === 0) return null;

  const metrics = [
    { icon: "🌫️", label: "CO₂ Saved",     value: `${totalCO2.toFixed(2)} kg`,   subLabel: "carbon emissions averted",      color: "#50C878", bar: totalCO2,    max: 10,   rune: "ᚠ" },
    { icon: "💧", label: "Water Saved",    value: `${totalWater} L`,              subLabel: "litres of freshwater preserved", color: "#4A90E2", bar: totalWater,  max: 50,   rune: "ᚢ" },
    { icon: "⚡", label: "Energy Saved",   value: `${totalEnergy.toFixed(1)} kWh`, subLabel: "kilowatt-hours conserved",      color: "#F1C40F", bar: totalEnergy, max: 15,   rune: "ᛇ" },
    { icon: "🌳", label: "Trees Equiv.",   value: `${totalTrees.toFixed(2)}`,      subLabel: "trees worth of oxygen saved",   color: "#34D399", bar: totalTrees,  max: 0.5,  rune: "ᛁ" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.25 }}
      style={{
        marginTop: "8px", borderRadius: "18px",
        background: "linear-gradient(150deg, rgba(5,14,8,0.97), rgba(7,18,12,0.95))",
        border: "1px solid rgba(80,200,120,0.22)",
        boxShadow: "0 6px 50px rgba(0,0,0,0.6), 0 0 40px rgba(80,200,120,0.06), inset 0 1px 0 rgba(80,200,120,0.06)",
        overflow: "hidden", position: "relative",
      }}
    >
      <div style={{ height: "2px", background: "linear-gradient(90deg, transparent, rgba(80,200,120,0.5), rgba(52,211,153,0.6), rgba(80,200,120,0.5), transparent)" }} />
      <div style={{ position: "absolute", top: 0, right: 0, width: "220px", height: "220px", background: "radial-gradient(circle, rgba(80,200,120,0.08), transparent)", filter: "blur(50px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, width: "160px", height: "160px", background: "radial-gradient(circle, rgba(52,211,153,0.05), transparent)", filter: "blur(35px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "16px", right: "24px", fontSize: "6rem", color: "rgba(80,200,120,0.04)", pointerEvents: "none", lineHeight: 1 }}>🌍</div>

      <div style={{ padding: "28px 30px 30px", position: "relative", zIndex: 1 }}>
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.55rem", letterSpacing: "0.32em", color: "rgba(80,200,120,0.55)", marginBottom: "8px" }}>✦ ENVIRONMENTAL PROPHECY SCROLL</div>
          <h3 style={{
            fontFamily: "'Cinzel Decorative', 'Cinzel', serif", fontSize: "1.05rem", fontWeight: 700,
            background: "linear-gradient(135deg, #A7F3D0, #50C878)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            letterSpacing: "0.04em", margin: "0 0 6px",
          }}>Eco Impact Calculator</h3>
          <p style={{ fontFamily: "'Cormorant Garamond', 'EB Garamond', serif", fontSize: "0.95rem", fontStyle: "italic", color: "rgba(80,200,120,0.5)", margin: 0, lineHeight: 1.6 }}>
            The realm shall be spared — these savings manifest upon correct disposal
          </p>
        </div>

        <QuillDivider glyph="ᛁ" label="Ecological Savings Divined" />

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))", gap: "14px", marginBottom: "20px" }}>
          {metrics.map((m, i) => (
            <motion.div
              key={m.label}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
              style={{
                padding: "16px 18px", borderRadius: "14px",
                background: `linear-gradient(135deg, ${m.color}10, ${m.color}05)`,
                border: `1px solid ${m.color}25`, position: "relative", overflow: "hidden",
              }}
            >
              <div style={{ position: "absolute", top: "6px", right: "10px", fontFamily: "'Cinzel', serif", fontSize: "1.4rem", color: `${m.color}10`, fontWeight: 700, pointerEvents: "none" }}>{m.rune}</div>
              <div style={{ fontSize: "1.3rem", marginBottom: "8px" }}>{m.icon}</div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.58rem", letterSpacing: "0.2em", color: `${m.color}80`, marginBottom: "4px" }}>{m.label.toUpperCase()}</div>
              <div style={{
                fontFamily: "'Cinzel Decorative', 'Cinzel', serif", fontSize: "1.25rem", fontWeight: 700,
                background: `linear-gradient(135deg, ${m.color}DD, ${m.color}99)`,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                letterSpacing: "0.03em", marginBottom: "2px",
              }}>{m.value}</div>
              <div style={{ fontFamily: "'EB Garamond', serif", fontSize: "0.72rem", fontStyle: "italic", color: `${m.color}55`, marginBottom: "8px" }}>{m.subLabel}</div>
              <EcoBar value={m.bar} max={m.max} color={m.color} />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          style={{
            padding: "14px 18px", borderRadius: "12px",
            background: "linear-gradient(135deg, rgba(80,200,120,0.08), rgba(52,211,153,0.04))",
            border: "1px solid rgba(80,200,120,0.2)",
            display: "flex", alignItems: "center", gap: "14px",
          }}
        >
          <motion.span animate={{ scale: [1, 1.12, 1] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} style={{ fontSize: "1.4rem", flexShrink: 0 }}>🌿</motion.span>
          <div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.2em", color: "rgba(80,200,120,0.7)", marginBottom: "4px" }}>✦ WISDOM OF THE EARTH SPIRITS</div>
            <p style={{ fontFamily: "'EB Garamond', serif", fontSize: "0.9rem", fontStyle: "italic", color: "rgba(80,200,120,0.55)", margin: 0, lineHeight: 1.6 }}>
              Every relic correctly sorted is a spell cast against entropy — thy actions ripple through the realm for generations hence.
            </p>
          </div>
        </motion.div>
      </div>
      <div style={{ height: "2px", background: "linear-gradient(90deg, transparent, rgba(52,211,153,0.3), transparent)" }} />
    </motion.div>
  );
}

// ── Live Sorting Simulation ───────────────────────────────────────────────────
function LiveSortingSimulation({ label }: { label: string }) {
  const correctBin = BIN_RULES[label] || "Black";
  const [result, setResult] = useState<"idle" | "correct" | "wrong">("idle");
  const [xp, setXp] = useState(0);
  const [wrongBin, setWrongBin] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const bins = [
    { name: "Blue", color: "#4A90E2", rune: "ᚢ", label: "Recyclables" },
    { name: "Green", color: "#50C878", rune: "ᛁ", label: "Organic" },
    { name: "Red", color: "#E74C3C", rune: "ᚱ", label: "Hazardous" },
    { name: "Black", color: "#8899AA", rune: "ᛟ", label: "General" },
  ];
  const handleDrop = (binName: string) => {
    setIsDragging(false);
    if (binName === correctBin) { setResult("correct"); setWrongBin(null); setXp(p => p + 10); }
    else { setResult("wrong"); setWrongBin(binName); }
  };
  const handleReset = () => { setResult("idle"); setWrongBin(null); };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      style={{
        marginTop: "8px", padding: "28px", borderRadius: "18px",
        background: "linear-gradient(135deg, rgba(6,5,16,0.97), rgba(10,8,26,0.94))",
        border: "1px solid rgba(201,168,76,0.22)",
        boxShadow: "0 4px 40px rgba(0,0,0,0.55), 0 0 30px rgba(155,125,42,0.06), inset 0 1px 0 rgba(201,168,76,0.05)",
        position: "relative", overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", top: 0, right: 0, width: "200px", height: "200px", background: "radial-gradient(circle, rgba(201,168,76,0.07), transparent)", filter: "blur(50px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", top: "16px", right: "24px", fontFamily: "'Cinzel', serif", fontSize: "4.5rem", color: "rgba(155,125,42,0.05)", fontWeight: 900, pointerEvents: "none", zIndex: 0 }}>ᚷ</div>

      <div style={{ position: "relative", zIndex: 1, marginBottom: "20px" }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.55rem", letterSpacing: "0.3em", color: "rgba(155,125,42,0.45)", marginBottom: "6px" }}>✦ ARCANE SORTING TRIAL</div>
        <h3 style={{ fontFamily: "'Cinzel Decorative', 'Cinzel', serif", fontSize: "1.05rem", fontWeight: 700, color: "#E8D49A", letterSpacing: "0.05em", margin: 0 }}>Live Sorting Ritual</h3>
        <p style={{ fontFamily: "'Cormorant Garamond', 'EB Garamond', serif", fontSize: "0.9rem", fontStyle: "italic", color: "rgba(155,125,42,0.5)", margin: "6px 0 0" }}>Drag the relic into its destined vessel to earn Eco XP</p>
      </div>

      <QuillDivider glyph="ᚦ" />

      <div style={{ position: "relative", zIndex: 1, marginBottom: "24px" }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.55rem", letterSpacing: "0.2em", color: "rgba(155,125,42,0.4)", marginBottom: "10px" }}>⚗ SPECIMEN TO SORT</div>
        <motion.div
          draggable={result !== "correct"}
          onDragStart={(e) => { (e as unknown as React.DragEvent).dataTransfer.setData("item", label); setIsDragging(true); handleReset(); }}
          onDragEnd={() => setIsDragging(false)}
          animate={result === "correct" ? { scale: 0.92, opacity: 0.45 } : isDragging ? { scale: 1.06, rotate: 2 } : { scale: 1, rotate: 0, opacity: 1 }}
          whileHover={result !== "correct" ? { scale: 1.04 } : {}}
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
          style={{
            display: "inline-flex", alignItems: "center", gap: "12px",
            padding: "14px 20px", borderRadius: "12px",
            border: result === "correct" ? "1px solid rgba(80,200,120,0.35)" : "1px solid rgba(201,168,76,0.35)",
            background: result === "correct" ? "linear-gradient(135deg, rgba(80,200,120,0.1), rgba(50,160,90,0.06))" : "linear-gradient(135deg, rgba(155,100,20,0.16), rgba(100,65,10,0.1))",
            cursor: result === "correct" ? "default" : "grab",
            boxShadow: result === "correct" ? "0 0 18px rgba(80,200,120,0.15)" : "0 0 18px rgba(201,168,76,0.12), inset 0 1px 0 rgba(255,220,80,0.06)",
            userSelect: "none",
          }}
        >
          <span style={{ fontFamily: "'Cinzel', serif", fontSize: "1rem", color: result === "correct" ? "rgba(80,200,120,0.7)" : "rgba(201,168,76,0.6)" }}>ᛞ</span>
          <div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.9rem", fontWeight: 700, background: result === "correct" ? "linear-gradient(135deg, #90EE90, #50C878)" : "linear-gradient(135deg, #FFE57A, #C9A84C)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", letterSpacing: "0.06em" }}>{label}</div>
            <div style={{ fontFamily: "'EB Garamond', serif", fontSize: "0.7rem", fontStyle: "italic", color: "rgba(155,125,42,0.45)", marginTop: "2px" }}>{result === "correct" ? "Correctly sorted ✓" : "Drag to a bin below"}</div>
          </div>
        </motion.div>
      </div>

      <div style={{ position: "relative", zIndex: 1, marginBottom: "20px" }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.55rem", letterSpacing: "0.2em", color: "rgba(155,125,42,0.4)", marginBottom: "12px" }}>⚗ THE FOUR VESSELS</div>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {bins.map((bin) => {
            const isCorrectDrop = result === "correct" && bin.name === correctBin;
            const isWrongDrop = wrongBin === bin.name;
            return (
              <motion.div
                key={bin.name}
                onDragOver={(e) => e.preventDefault()} onDrop={() => handleDrop(bin.name)}
                animate={isCorrectDrop ? { boxShadow: [`0 0 10px ${bin.color}40`, `0 0 35px ${bin.color}80`, `0 0 20px ${bin.color}50`] } : isWrongDrop ? { x: [-6, 6, -5, 5, -3, 3, 0] } : { boxShadow: `0 0 0px ${bin.color}00` }}
                transition={isCorrectDrop ? { duration: 0.8, repeat: Infinity, repeatType: "reverse" } : isWrongDrop ? { duration: 0.4 } : { duration: 0.3 }}
                whileHover={{ scale: 1.04, y: -2 }}
                style={{
                  flex: "1 1 100px", minWidth: "100px", maxWidth: "140px", height: "110px", borderRadius: "14px",
                  background: isCorrectDrop ? `linear-gradient(135deg, ${bin.color}22, ${bin.color}14)` : isWrongDrop ? "linear-gradient(135deg, rgba(231,76,60,0.18), rgba(180,40,20,0.1))" : `linear-gradient(135deg, ${bin.color}10, ${bin.color}06)`,
                  border: isCorrectDrop ? `2px solid ${bin.color}80` : isWrongDrop ? "2px solid rgba(231,76,60,0.55)" : `1px solid ${bin.color}45`,
                  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  gap: "6px", cursor: "pointer", transition: "background 0.25s, border 0.25s",
                  position: "relative", overflow: "hidden",
                }}
              >
                {isCorrectDrop && (
                  <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: [0, 0.6, 0], scale: [0.5, 1.5, 2] }} transition={{ duration: 1.2, repeat: Infinity }}
                    style={{ position: "absolute", inset: 0, borderRadius: "12px", background: `radial-gradient(circle, ${bin.color}30, transparent)`, pointerEvents: "none" }} />
                )}
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: "1.4rem", color: isCorrectDrop ? bin.color : `${bin.color}90`, textShadow: isCorrectDrop ? `0 0 12px ${bin.color}` : "none", transition: "all 0.3s" }}>{bin.rune}</span>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.65rem", fontWeight: 700, color: isCorrectDrop ? bin.color : `${bin.color}cc`, letterSpacing: "0.08em", textShadow: isCorrectDrop ? `0 0 8px ${bin.color}80` : "none" }}>{bin.name}</div>
                <div style={{ fontFamily: "'EB Garamond', serif", fontSize: "0.62rem", fontStyle: "italic", color: `${bin.color}70` }}>{bin.label}</div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {result === "correct" && (
          <motion.div key="correct" initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }}
            style={{ padding: "16px 20px", borderRadius: "12px", background: "linear-gradient(135deg, rgba(80,200,120,0.12), rgba(50,160,90,0.07))", border: "1px solid rgba(80,200,120,0.3)", display: "flex", alignItems: "center", gap: "14px" }}>
            <motion.span animate={{ rotate: [0, 15, -10, 8, 0] }} transition={{ duration: 0.6 }} style={{ fontSize: "1.3rem" }}>✅</motion.span>
            <div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.72rem", letterSpacing: "0.12em", color: "#50C878", marginBottom: "3px" }}>CORRECT VESSEL CHOSEN</div>
              <div style={{ fontFamily: "'EB Garamond', serif", fontSize: "0.85rem", fontStyle: "italic", color: "rgba(80,200,120,0.7)" }}>The ancient spirits reward thy wisdom — +10 Eco XP granted</div>
            </div>
          </motion.div>
        )}
        {result === "wrong" && (
          <motion.div key="wrong" initial={{ opacity: 0, y: 8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.35 }}
            style={{ padding: "16px 20px", borderRadius: "12px", background: "linear-gradient(135deg, rgba(231,76,60,0.12), rgba(180,40,20,0.07))", border: "1px solid rgba(231,76,60,0.3)", display: "flex", alignItems: "flex-start", gap: "14px" }}>
            <span style={{ fontSize: "1.3rem", flexShrink: 0 }}>❌</span>
            <div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.72rem", letterSpacing: "0.12em", color: "#E74C3C", marginBottom: "3px" }}>FORBIDDEN VESSEL</div>
              <div style={{ fontFamily: "'EB Garamond', serif", fontSize: "0.85rem", fontStyle: "italic", color: "rgba(231,76,60,0.7)", marginBottom: "8px" }}>
                The spirits recoil — {label} belongs in the{" "}
                <span style={{ color: "#C9A84C", fontStyle: "normal", fontFamily: "'Cinzel', serif", fontSize: "0.78rem" }}>{correctBin}</span>{" "}vessel. Drag again to redeem thyself.
              </div>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={handleReset}
                style={{ fontFamily: "'Cinzel', serif", fontSize: "0.6rem", letterSpacing: "0.12em", color: "#C9A84C", background: "rgba(155,125,42,0.1)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: "6px", padding: "5px 14px", cursor: "pointer" }}>
                ᚱ RETRY RITUAL
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {xp > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            style={{ marginTop: "16px", display: "inline-flex", alignItems: "center", gap: "10px", padding: "8px 18px", borderRadius: "20px", background: "linear-gradient(135deg, rgba(155,100,20,0.18), rgba(100,65,10,0.1))", border: "1px solid rgba(201,168,76,0.28)", boxShadow: "0 0 16px rgba(201,168,76,0.1)" }}>
            <motion.span animate={{ rotate: [0, 20, -20, 15, 0] }} transition={{ duration: 1, repeat: Infinity, repeatDelay: 2 }} style={{ fontSize: "1rem" }}>🌟</motion.span>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.72rem", letterSpacing: "0.1em", background: "linear-gradient(135deg, #FFE57A, #C9A84C)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", fontWeight: 700 }}>ECO XP: {xp}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function DetectionResults({ mode, result }: DetectionResultsProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

      {/* Annotated image */}
      <div style={{ position: "relative", borderRadius: "16px", overflow: "hidden", border: "1px solid rgba(155,125,42,0.3)", background: "rgba(6,5,16,0.9)", boxShadow: "0 4px 40px rgba(0,0,0,0.6), 0 0 20px rgba(155,125,42,0.07)" }}>
        {[{ top: "8px", left: "10px" }, { top: "8px", right: "10px" }, { bottom: "8px", left: "10px" }, { bottom: "8px", right: "10px" }].map((pos, i) => (
          <span key={i} style={{ position: "absolute", fontFamily: "'Cinzel', serif", fontSize: "0.65rem", color: "rgba(155,125,42,0.25)", pointerEvents: "none", zIndex: 2, ...pos }}>{["ᚠ", "ᚢ", "ᛟ", "ᛞ"][i]}</span>
        ))}
        {result.image_base64 ? <img src={`data:image/jpeg;base64,${result.image_base64}`} alt="Live Detection" style={{ width: "100%", display: "block", borderRadius: "15px" }} />
          : result.output_image ? <img src={`http://127.0.0.1:8000${result.output_image}`} alt="Detection Output" style={{ width: "100%", display: "block", borderRadius: "15px" }} />
          : <div style={{ height: "220px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px" }}><span style={{ fontSize: "2rem" }}>🔮</span><div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.7rem", letterSpacing: "0.15em", color: "rgba(155,125,42,0.4)" }}>THE CRYSTAL IS EMPTY</div></div>}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px 14px", background: "linear-gradient(transparent, rgba(4,3,10,0.85))", display: "flex", justifyContent: "space-between", alignItems: "flex-end", zIndex: 2 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.55rem", letterSpacing: "0.2em", color: "rgba(201,168,76,0.5)" }}>ARCANE VISION OUTPUT</div>
          <div style={{ fontFamily: "'EB Garamond', serif", fontStyle: "italic", fontSize: "0.6rem", color: "rgba(155,125,42,0.4)" }}>{result.image_base64 ? "Scrying Mirror" : "Specimen Analysis"}</div>
        </div>
      </div>

      {/* Single result */}
      {mode === "single" && result.detections.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ background: "linear-gradient(135deg, rgba(6,5,16,0.95), rgba(10,8,26,0.9))", borderRadius: "16px", border: "1px solid rgba(155,125,42,0.28)", padding: "24px", boxShadow: "0 4px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(201,168,76,0.06)" }}>
          <div style={{ marginBottom: "18px" }}>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.55rem", letterSpacing: "0.28em", color: "rgba(155,125,42,0.45)", marginBottom: "4px" }}>✦ THE ENCHANTMENT REVEALS</div>
            <h3 style={{ fontFamily: "'Cinzel Decorative','Cinzel',serif", fontSize: "1.05rem", fontWeight: 700, color: "#E8D49A", letterSpacing: "0.06em", margin: 0 }}>Detection Result</h3>
          </div>
          <QuillDivider />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" }}>
            <StatTile label="Detected Class" value={result.detections[0].label} rune="ᛞ" accent />
            <StatTile label="Confidence" value={`${(result.detections[0].confidence * 100).toFixed(1)}%`} rune="ᛟ" />
            <StatTile label="Model" value="YOLO + CNN" rune="ᚱ" />
          </div>
        </motion.div>
      )}

      {/* Pile result */}
      {mode === "pile" && result.detections.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          style={{ background: "linear-gradient(135deg, rgba(6,5,16,0.95), rgba(10,8,26,0.9))", borderRadius: "16px", border: "1px solid rgba(155,125,42,0.28)", padding: "24px", boxShadow: "0 4px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(201,168,76,0.06)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "18px" }}>
            <div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.55rem", letterSpacing: "0.28em", color: "rgba(155,125,42,0.45)", marginBottom: "4px" }}>✦ CHRONICLES OF THE PILE</div>
              <h3 style={{ fontFamily: "'Cinzel Decorative','Cinzel',serif", fontSize: "1.05rem", fontWeight: 700, color: "#E8D49A", letterSpacing: "0.06em", margin: 0 }}>Detection Summary</h3>
            </div>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.58rem", letterSpacing: "0.1em", padding: "4px 12px", borderRadius: "20px", background: "rgba(155,125,42,0.12)", border: "1px solid rgba(201,168,76,0.25)", color: "#C9A84C", whiteSpace: "nowrap" as const }}>{result.mode === "dual_yolo" ? "YOLO + YOLO" : "YOLO + CNN"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px", padding: "16px 20px", borderRadius: "12px", background: "linear-gradient(135deg, rgba(155,100,20,0.14), rgba(100,65,10,0.08))", border: "1px solid rgba(201,168,76,0.2)" }}>
            <div style={{ fontFamily: "'Cinzel Decorative','Cinzel',serif", fontSize: "2.4rem", fontWeight: 900, background: "linear-gradient(135deg, #FFE57A, #C9A84C)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text", lineHeight: 1 }}>{result.total_objects}</div>
            <div>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.7rem", color: "#C9A84C", letterSpacing: "0.05em" }}>Artefacts Identified</div>
              <div style={{ fontFamily: "'EB Garamond', serif", fontStyle: "italic", fontSize: "0.72rem", color: "rgba(155,125,42,0.5)" }}>across the enchanted pile</div>
            </div>
          </div>
          <QuillDivider glyph="ᚱ" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "10px" }}>
            {result.detections.map((det, i) => (
              <motion.div key={i} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.05 }}
                style={{ padding: "12px 14px", borderRadius: "10px", background: "rgba(155,125,42,0.06)", border: "1px solid rgba(155,125,42,0.15)", transition: "all 0.2s", cursor: "default" }}
                whileHover={{ background: "rgba(155,125,42,0.12)", borderColor: "rgba(201,168,76,0.3)" }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.55rem", letterSpacing: "0.15em", color: "rgba(155,125,42,0.35)", marginBottom: "4px" }}>#{String(i + 1).padStart(2, "0")}</div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.75rem", fontWeight: 600, color: "#E8D49A", letterSpacing: "0.04em", marginBottom: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{det.label}</div>
                <div style={{ fontFamily: "'EB Garamond', serif", fontSize: "0.72rem", color: "rgba(155,125,42,0.55)", fontStyle: "italic" }}>{(det.confidence * 100).toFixed(1)}%</div>
                <ConfidenceBar value={det.confidence} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Eco Impact Calculator */}
      {result.detections.length > 0 && <EcoImpactCalculator detections={result.detections} />}

      {/* Live Sorting */}
      {result.detections.length > 0 && <LiveSortingSimulation label={result.detections[0].label} />}

      {/* No detections */}
      {result.detections.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          style={{ background: "rgba(6,5,16,0.9)", borderRadius: "16px", border: "1px solid rgba(155,125,42,0.2)", padding: "48px 24px", textAlign: "center", boxShadow: "0 4px 30px rgba(0,0,0,0.4)" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🔮</div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.75rem", letterSpacing: "0.15em", color: "rgba(155,125,42,0.55)", marginBottom: "8px" }}>THE SCRYING GLASS SEES NOTHING</div>
          <div style={{ fontFamily: "'EB Garamond', serif", fontStyle: "italic", fontSize: "0.85rem", color: "rgba(155,125,42,0.35)" }}>Try submitting a different relic or adjusting the detection enchantments</div>
        </motion.div>
      )}
    </motion.div>
  );
}