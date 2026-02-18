import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Zap, Upload, Camera, MapPin, BookOpen, Feather, Scroll } from "lucide-react";
import Navbar from "@/components/Navbar";
import ImageUploader from "@/components/ImageUploader";
import DetectionResults from "@/components/DetectionResults";
import WebcamDetector from "@/components/WebcamDetector";
import { runDetection } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────
type Mode = "single" | "pile";

interface Detection {
  label: string;
  confidence: number;
  bbox?: number[];
  area?: number;
  waste_type?: string;
}

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

interface DetectionResult {
  output_image: string;
  detections: Detection[];
  total_objects: number;
  waste_type?: string;
  smart_guide?: SmartGuide;
}

interface UserLocation {
  lat: number;
  lng: number;
}

// ── GPS ───────────────────────────────────────────────────────────────────────
const getUserLocation = (): Promise<UserLocation> =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported by this browser"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        const msgs: Record<number, string> = {
          1: "Location permission denied",
          2: "Location information unavailable",
          3: "Location request timed out",
        };
        reject(new Error(msgs[err.code] || "Failed to get location"));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });

// ── Save detection ────────────────────────────────────────────────────────────
const saveDetectionToBackend = async (
  result: DetectionResult,
  mode: Mode,
  location: UserLocation
) => {
  const wasteType =
    result.waste_type ||
    (mode === "single"
      ? result.detections[0]?.waste_type || result.detections[0]?.label || "unknown"
      : "mixed");
  const avgConfidence =
    result.detections.reduce((s, d) => s + d.confidence, 0) / result.detections.length;

  const res = await fetch("http://127.0.0.1:8000/save-detection", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      wasteType,
      count: result.total_objects,
      confidence: avgConfidence,
      mode,
      lat: location.lat,
      lng: location.lng,
      timestamp: new Date().toISOString(),
      detections: result.detections,
    }),
  });
  if (!res.ok) throw new Error(`Server responded with ${res.status}`);
  return res.json();
};

// ── Floating Rune Particle ────────────────────────────────────────────────────
function FloatingParticle({ delay, x, size, glyph }: {
  delay: number; x: number; size: number; glyph: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: "100vh", x: `${x}vw` }}
      animate={{
        opacity: [0, 0.3, 0.18, 0],
        y: [0, -220, -520, -920],
        x: [`${x}vw`, `${x + 2.5}vw`, `${x - 1.5}vw`, `${x + 1}vw`],
        rotate: [0, 25, -18, 40],
      }}
      transition={{ duration: 20 + delay * 2.5, delay, repeat: Infinity, ease: "linear" }}
      style={{
        position: "fixed", bottom: 0,
        fontSize: `${size}rem`,
        color: "#C9A84C",
        fontFamily: "'Cinzel', serif",
        pointerEvents: "none", zIndex: 0,
        filter: "blur(0.4px)", userSelect: "none",
      }}
    >{glyph}</motion.div>
  );
}

// ── Magical Orb ───────────────────────────────────────────────────────────────
function MagicalOrb({ x, y, size, color, delay }: {
  x: string; y: string; size: number; color: string; delay: number;
}) {
  return (
    <motion.div
      animate={{ scale: [1, 1.18, 0.92, 1], opacity: [0.04, 0.11, 0.05, 0.04] }}
      transition={{ duration: 9 + delay, repeat: Infinity, delay, ease: "easeInOut" }}
      style={{
        position: "fixed", left: x, top: y,
        width: `${size}px`, height: `${size}px`,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${color}, transparent 70%)`,
        filter: "blur(45px)", pointerEvents: "none", zIndex: 0,
      }}
    />
  );
}

// ── Quill Divider ─────────────────────────────────────────────────────────────
function QuillDivider({ label }: { label?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "14px", margin: "24px 0" }}>
      <div style={{
        flex: 1, height: "1px",
        background: "linear-gradient(90deg, transparent, rgba(155,125,42,0.15), rgba(201,168,76,0.45))",
      }} />
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.7rem", color: "rgba(201,168,76,0.4)" }}>✦</span>
        {label ? (
          <span style={{
            fontFamily: "'Cormorant Garamond', 'EB Garamond', serif",
            fontSize: "0.7rem", letterSpacing: "0.32em",
            color: "rgba(201,168,76,0.5)", fontStyle: "italic", whiteSpace: "nowrap",
          }}>{label}</span>
        ) : (
          <span style={{
            fontFamily: "'Cinzel', serif", fontSize: "0.9rem",
            color: "rgba(201,168,76,0.38)", letterSpacing: "0.38em",
          }}>ᚱ ᚢ ᚾ</span>
        )}
        <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.7rem", color: "rgba(201,168,76,0.4)" }}>✦</span>
      </div>
      <div style={{
        flex: 1, height: "1px",
        background: "linear-gradient(270deg, transparent, rgba(155,125,42,0.15), rgba(201,168,76,0.45))",
      }} />
    </div>
  );
}

// ── Incantation Tab ───────────────────────────────────────────────────────────
function SpellTab({ active, onClick, label, sub }: {
  active: boolean; onClick: () => void; label: string; sub: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: "14px 16px", borderRadius: "11px",
        background: active
          ? "linear-gradient(135deg, rgba(155,125,42,0.2), rgba(100,75,20,0.13))"
          : "transparent",
        border: active ? "1px solid rgba(212,175,55,0.38)" : "1px solid transparent",
        color: active ? "#EAD89A" : "rgba(155,125,42,0.45)",
        cursor: "pointer", transition: "all 0.28s",
        boxShadow: active ? "0 0 22px rgba(155,125,42,0.14), inset 0 1px 0 rgba(201,168,76,0.09)" : "none",
        textAlign: "center" as const, position: "relative", overflow: "hidden",
      }}
    >
      {active && (
        <motion.div
          style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "linear-gradient(105deg, transparent 30%, rgba(255,220,80,0.05) 50%, transparent 70%)",
          }}
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
        />
      )}
      <div style={{
        fontFamily: "'Cinzel', serif", fontSize: "0.78rem",
        fontWeight: 700, letterSpacing: "0.07em",
      }}>{label}</div>
      <div style={{
        fontFamily: "'Cormorant Garamond', 'EB Garamond', serif",
        fontStyle: "italic", fontSize: "0.7rem", opacity: 0.6, marginTop: "3px",
      }}>{sub}</div>
    </button>
  );
}

// ── Source Toggle ─────────────────────────────────────────────────────────────
function ToggleTab({ active, onClick, icon, label }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        gap: "8px", padding: "10px 16px", borderRadius: "10px",
        background: active ? "rgba(155,125,42,0.15)" : "transparent",
        border: active ? "1px solid rgba(212,175,55,0.28)" : "1px solid transparent",
        color: active ? "#C9A84C" : "rgba(155,125,42,0.42)",
        fontFamily: "'Cinzel', serif", fontSize: "0.68rem",
        letterSpacing: "0.12em", cursor: "pointer", transition: "all 0.22s",
      }}
    >
      {icon}{label}
    </button>
  );
}

// ── Wax Seal ──────────────────────────────────────────────────────────────────
function WaxSealSmall() {
  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
        <circle cx="18" cy="18" r="16" fill="rgba(155,125,42,0.1)" stroke="rgba(201,168,76,0.35)" strokeWidth="1" />
        <circle cx="18" cy="18" r="11" fill="rgba(155,125,42,0.08)" stroke="rgba(201,168,76,0.2)" strokeWidth="0.75" />
        {[0, 60, 120, 180, 240, 300].map((a) => (
          <ellipse
            key={a}
            cx={18 + 12 * Math.cos((a * Math.PI) / 180)}
            cy={18 + 12 * Math.sin((a * Math.PI) / 180)}
            rx="2.5" ry="1.5"
            fill="rgba(201,168,76,0.18)"
            transform={`rotate(${a}, ${18 + 12 * Math.cos((a * Math.PI) / 180)}, ${18 + 12 * Math.sin((a * Math.PI) / 180)})`}
          />
        ))}
      </svg>
      <span style={{
        position: "absolute",
        fontFamily: "'Cinzel', serif",
        fontSize: "0.75rem",
        color: "rgba(201,168,76,0.65)",
      }}>⚗</span>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function DetectPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialMode = (searchParams.get("mode") as Mode) || "single";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [result, setResult] = useState<DetectionResult | null>(null);
  const [useWebcam, setUseWebcam] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>("");
  const [savingStatus, setSavingStatus] = useState<string>("");

  const handleDetect = async () => {
    if (!image) return;
    setLoading(true);
    setShowResults(false);
    setLocationStatus("");
    setSavingStatus("");
    try {
      const data = await runDetection(image, mode);
      setResult(data);
      setShowResults(true);
      setLocationStatus("📍 Capturing location...");
      let location: UserLocation;
      try {
        location = await getUserLocation();
        setLocationStatus(`✅ Location: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
      } catch (locErr) {
        setLocationStatus(`⚠️ ${locErr instanceof Error ? locErr.message : "Location unavailable"}`);
        return;
      }
      setSavingStatus("💾 Saving detection...");
      await saveDetectionToBackend(data, mode, location);
      setSavingStatus("✅ Detection saved successfully!");
    } catch (err) {
      console.error("Detection error:", err);
      alert("Detection failed. Please try again.");
      setSavingStatus("❌ Failed to save detection");
    } finally {
      setLoading(false);
    }
  };

  const handleViewGuide = () => {
    if (!result) return;
    const wasteType =
      result.waste_type ||
      result.detections[0]?.waste_type ||
      result.detections[0]?.label ||
      "unknown";
    navigate(`/smart-guide?type=${encodeURIComponent(wasteType)}`);
  };

  const particles = [
    { delay: 0,  x: 5,  size: 0.8,  glyph: "ᚠ" },
    { delay: 4,  x: 20, size: 0.65, glyph: "ᚱ" },
    { delay: 7,  x: 38, size: 0.9,  glyph: "✦" },
    { delay: 2,  x: 58, size: 0.7,  glyph: "ᛟ" },
    { delay: 9,  x: 75, size: 0.75, glyph: "ᛞ" },
    { delay: 5,  x: 88, size: 0.85, glyph: "ᚢ" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(170deg, #030209 0%, #060410 28%, #070818 58%, #040610 82%, #030209 100%)",
      fontFamily: "'EB Garamond', Georgia, serif",
      color: "#C9B97A",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* ── Fonts & global styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cinzel+Decorative:wght@400;700;900&family=EB+Garamond:ital,wght@0,400;0,500;1,400;1,500&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: rgba(6,4,15,0.5); }
        ::-webkit-scrollbar-thumb { background: rgba(155,125,42,0.35); border-radius: 2px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(201,168,76,0.5); }

        .cast-btn:hover:not(:disabled) {
          box-shadow: 0 0 35px rgba(201,168,76,0.5), 0 0 70px rgba(155,100,20,0.22) !important;
          filter: brightness(1.12);
        }
        .cast-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .cast-btn { transition: all 0.28s !important; }

        .guide-btn:hover {
          box-shadow: 0 0 25px rgba(155,125,42,0.25) !important;
          border-color: rgba(201,168,76,0.55) !important;
          color: #FFE57A !important;
        }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      {/* ── Ambient particles ── */}
      {particles.map((p, i) => <FloatingParticle key={i} {...p} />)}

      {/* ── Magical orbs ── */}
      <MagicalOrb x="8%"  y="15%" size={420} color="#9B7D2A" delay={0} />
      <MagicalOrb x="72%" y="8%"  size={360} color="#3A1A70" delay={4} />
      <MagicalOrb x="80%" y="65%" size={300} color="#0D2855" delay={7} />

      {/* ── Runic grid ── */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        backgroundImage: `linear-gradient(rgba(155,125,42,0.025) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(155,125,42,0.025) 1px, transparent 1px)`,
        backgroundSize: "52px 52px",
      }} />

      {/* ── Top aurora ── */}
      <div style={{
        position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
        width: "900px", height: "420px", pointerEvents: "none", zIndex: 0,
        background: "radial-gradient(ellipse at top, rgba(110,75,10,0.14) 0%, rgba(50,30,90,0.07) 40%, transparent 70%)",
      }} />

      <Navbar />

      <div style={{ maxWidth: "740px", margin: "0 auto", padding: "100px 28px 90px", position: "relative", zIndex: 1 }}>

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{ marginBottom: "12px" }}
        >
          {/* Ministry badge */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{
              display: "inline-flex", alignItems: "center", gap: "10px",
              padding: "5px 18px", borderRadius: "30px",
              background: "rgba(155,125,42,0.07)",
              border: "1px solid rgba(201,168,76,0.18)",
              marginBottom: "20px",
            }}
          >
            <WaxSealSmall />
            <span style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "0.55rem", letterSpacing: "0.36em",
              color: "rgba(201,168,76,0.5)",
            }}>ARCANE ANALYSIS CHAMBER</span>
            <WaxSealSmall />
          </motion.div>

          {/* Main title */}
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.7 }}
            style={{
              fontFamily: "'Cinzel Decorative', 'Cinzel', serif",
              fontSize: "clamp(1.7rem, 4.5vw, 3rem)",
              fontWeight: 900,
              letterSpacing: "0.04em",
              lineHeight: 1.18,
              background: "linear-gradient(135deg, #FFF0A0 0%, #E8C84A 22%, #C9A84C 50%, #9B7D2A 75%, #C9A84C 100%)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              animation: "shimmer 6s linear infinite",
              marginBottom: "14px",
            }}
          >
            Waste Detection Ritual
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.44 }}
            style={{
              fontFamily: "'Cormorant Garamond', 'EB Garamond', serif",
              fontSize: "1.15rem", fontStyle: "italic",
              color: "rgba(201,168,76,0.55)",
              letterSpacing: "0.025em", lineHeight: 1.65,
              maxWidth: "520px",
            }}
          >
            Submit a relic unto the arcane lens — the enchantment shall divine its nature and reveal its destined vessel.
          </motion.p>
        </motion.div>

        <QuillDivider />

        {/* ── Mode tabs ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ marginBottom: "18px" }}
        >
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "0.55rem", letterSpacing: "0.3em",
            color: "rgba(155,125,42,0.4)", marginBottom: "10px",
          }}>✦ CHOOSE THY INCANTATION</div>
          <div style={{
            display: "flex", gap: "8px", padding: "6px",
            background: "rgba(5,4,14,0.88)",
            borderRadius: "14px", border: "1px solid rgba(155,125,42,0.18)",
            boxShadow: "inset 0 1px 0 rgba(201,168,76,0.04)",
          }}>
            {([
              { key: "single" as Mode, label: "Single Object", sub: "YOLO · CNN" },
              { key: "pile"   as Mode, label: "Garbage Pile",  sub: "YOLO · YOLO" },
            ]).map((tab) => (
              <SpellTab
                key={tab.key}
                active={mode === tab.key}
                onClick={() => { setMode(tab.key); setShowResults(false); setResult(null); }}
                label={tab.label}
                sub={tab.sub}
              />
            ))}
          </div>
        </motion.div>

        {/* ── Source toggle ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
          style={{ marginBottom: "30px" }}
        >
          <div style={{
            display: "flex", gap: "6px", padding: "5px",
            background: "rgba(4,3,12,0.75)",
            borderRadius: "12px", border: "1px solid rgba(155,125,42,0.14)",
          }}>
            <ToggleTab
              active={!useWebcam}
              onClick={() => { setUseWebcam(false); setShowResults(false); setResult(null); }}
              icon={<Upload size={13} style={{ marginRight: "2px" }} />}
              label="UPLOAD RELIC"
            />
            <ToggleTab
              active={useWebcam}
              onClick={() => { setUseWebcam(true); setShowResults(false); setResult(null); setImage(null); }}
              icon={<Camera size={13} style={{ marginRight: "2px" }} />}
              label="LIVE SCRYING"
            />
          </div>
        </motion.div>

        {/* ── Webcam or Upload ── */}
        <AnimatePresence mode="wait">
          {useWebcam ? (
            <motion.div
              key="webcam"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.35 }}
            >
              <div style={{
                position: "relative",
                borderRadius: "20px",
                border: "1px solid rgba(155,125,42,0.28)",
                background: "rgba(5,4,14,0.92)",
                boxShadow: "0 0 50px rgba(155,125,42,0.07), inset 0 1px 0 rgba(201,168,76,0.05)",
                overflow: "hidden", padding: "4px",
              }}>
                {/* Corner runes */}
                {(["ᚠ", "ᚢ", "ᛟ", "ᛞ"] as const).map((rune, i) => (
                  <span key={i} style={{
                    position: "absolute",
                    fontFamily: "'Cinzel', serif", fontSize: "0.68rem",
                    color: "rgba(155,125,42,0.22)", pointerEvents: "none", zIndex: 2,
                    top: i < 2 ? "10px" : "auto", bottom: i >= 2 ? "10px" : "auto",
                    left: i % 2 === 0 ? "14px" : "auto", right: i % 2 === 1 ? "14px" : "auto",
                  }}>{rune}</span>
                ))}
                {/* Top and bottom accent bars */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: "2px",
                  background: "linear-gradient(90deg, transparent, rgba(155,125,42,0.4), transparent)",
                  pointerEvents: "none", zIndex: 2,
                }} />
                <WebcamDetector mode={mode} />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="upload"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.35 }}
            >
              {/* Upload panel */}
              <div style={{
                position: "relative",
                borderRadius: "20px",
                border: "1px solid rgba(155,125,42,0.26)",
                background: "linear-gradient(155deg, rgba(6,5,18,0.97), rgba(10,8,28,0.93))",
                boxShadow: "0 6px 50px rgba(0,0,0,0.55), 0 0 35px rgba(155,125,42,0.06), inset 0 1px 0 rgba(201,168,76,0.06)",
                padding: "28px",
                overflow: "hidden",
              }}>
                {/* Ambient corner glow */}
                <div style={{
                  position: "absolute", bottom: 0, right: 0,
                  width: "180px", height: "180px",
                  background: "radial-gradient(circle, rgba(155,125,42,0.07), transparent)",
                  filter: "blur(25px)", pointerEvents: "none",
                }} />
                {/* Top bar */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: "2px",
                  background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.35), transparent)",
                  pointerEvents: "none",
                }} />

                {/* Label */}
                <div style={{
                  display: "flex", alignItems: "center", gap: "10px",
                  marginBottom: "18px",
                }}>
                  <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.75rem", color: "rgba(201,168,76,0.35)" }}>⚗</span>
                  <span style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: "0.56rem", letterSpacing: "0.28em",
                    color: "rgba(155,125,42,0.45)",
                  }}>SUBMIT SPECIMEN FOR ARCANE ANALYSIS</span>
                  <div style={{
                    flex: 1, height: "1px",
                    background: "linear-gradient(90deg, rgba(155,125,42,0.2), transparent)",
                  }} />
                </div>

                <ImageUploader onImageSelect={setImage} />
              </div>

              {/* Status messages */}
              <AnimatePresence>
                {(locationStatus || savingStatus) && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    style={{
                      marginTop: "14px",
                      padding: "12px 18px",
                      borderRadius: "12px",
                      background: "rgba(5,4,14,0.85)",
                      border: "1px solid rgba(155,125,42,0.18)",
                      display: "flex", alignItems: "center", gap: "12px",
                    }}
                  >
                    <MapPin size={15} style={{ color: "#C9A84C", flexShrink: 0 }} />
                    <div style={{
                      fontFamily: "'EB Garamond', serif",
                      fontSize: "0.88rem", color: "#C9B97A",
                    }}>
                      {locationStatus && <div>{locationStatus}</div>}
                      {savingStatus && <div style={{ marginTop: locationStatus ? "3px" : 0 }}>{savingStatus}</div>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Cast button ── */}
              <div style={{ marginTop: "30px", display: "flex", justifyContent: "center" }}>
                <motion.button
                  className="cast-btn"
                  onClick={handleDetect}
                  disabled={!image || loading}
                  whileTap={image && !loading ? { scale: 0.96 } : {}}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "12px",
                    padding: "16px 48px",
                    borderRadius: "13px",
                    fontFamily: "'Cinzel', serif",
                    fontWeight: 700, fontSize: "0.82rem", letterSpacing: "0.16em",
                    border: "none",
                    cursor: image && !loading ? "pointer" : "not-allowed",
                    background: "linear-gradient(135deg, #C8A020 0%, #9B7D2A 40%, #7A6020 70%, #9B7D2A 100%)",
                    color: "#090712",
                    boxShadow: image
                      ? "0 0 25px rgba(155,125,42,0.4), 0 6px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,235,130,0.35)"
                      : "none",
                    position: "relative", overflow: "hidden",
                  }}
                >
                  {/* Shimmer streak */}
                  {image && !loading && (
                    <motion.div
                      style={{
                        position: "absolute", inset: 0, pointerEvents: "none",
                        background: "linear-gradient(90deg, transparent, rgba(255,235,100,0.18), transparent)",
                      }}
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 2.8, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                  {loading ? (
                    <>
                      <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                      Divining…
                    </>
                  ) : (
                    <>
                      <Zap size={16} />
                      CAST DETECTION SPELL
                    </>
                  )}
                </motion.button>
              </div>

              {/* ── Results section ── */}
              <AnimatePresence>
                {showResults && result && (
                  <motion.div
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    style={{ marginTop: "44px" }}
                  >
                    {/* Results heading */}
                    <div style={{ marginBottom: "18px" }}>
                      {/* Badge pill */}
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: "8px",
                        padding: "4px 14px", borderRadius: "20px",
                        background: "rgba(155,125,42,0.08)",
                        border: "1px solid rgba(201,168,76,0.18)",
                        marginBottom: "12px",
                      }}>
                        <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.65rem", color: "rgba(201,168,76,0.4)" }}>✦</span>
                        <span style={{
                          fontFamily: "'Cinzel', serif",
                          fontSize: "0.54rem", letterSpacing: "0.32em",
                          color: "rgba(155,125,42,0.5)",
                        }}>THE ENCHANTMENT REVEALS</span>
                        <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.65rem", color: "rgba(201,168,76,0.4)" }}>✦</span>
                      </div>

                      <h2 style={{
                        fontFamily: "'Cinzel Decorative', 'Cinzel', serif",
                        fontSize: "1.3rem", fontWeight: 700,
                        background: "linear-gradient(135deg, #FFE57A, #C9A84C)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        letterSpacing: "0.05em", margin: 0,
                      }}>Detection Results</h2>

                      <p style={{
                        fontFamily: "'Cormorant Garamond', 'EB Garamond', serif",
                        fontStyle: "italic", fontSize: "0.95rem",
                        color: "rgba(155,125,42,0.45)", margin: "6px 0 0",
                        letterSpacing: "0.015em",
                      }}>The scrying glass has divined the nature of thy relic</p>
                    </div>

                    {/* Results card */}
                    <div style={{
                      borderRadius: "18px",
                      border: "1px solid rgba(155,125,42,0.24)",
                      background: "linear-gradient(155deg, rgba(5,4,14,0.96), rgba(8,6,22,0.92))",
                      boxShadow: "0 6px 50px rgba(0,0,0,0.55), 0 0 25px rgba(155,125,42,0.06), inset 0 1px 0 rgba(201,168,76,0.05)",
                      overflow: "hidden", padding: "4px",
                      position: "relative",
                    }}>
                      {/* Top accent */}
                      <div style={{
                        position: "absolute", top: 0, left: 0, right: 0, height: "2px",
                        background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent)",
                        pointerEvents: "none",
                      }} />
                      <DetectionResults mode={mode} result={result} />
                    </div>

                    {/* ── View guide button ── */}
                    {result.detections.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        style={{ marginTop: "22px", textAlign: "center" }}
                      >
                        <button
                          onClick={handleViewGuide}
                          className="guide-btn"
                          style={{
                            display: "inline-flex", alignItems: "center", gap: "12px",
                            padding: "13px 36px",
                            borderRadius: "12px",
                            fontFamily: "'Cinzel', serif",
                            fontWeight: 600, fontSize: "0.74rem", letterSpacing: "0.14em",
                            border: "1px solid rgba(155,125,42,0.38)",
                            cursor: "pointer",
                            background: "linear-gradient(135deg, rgba(155,125,42,0.18), rgba(100,75,20,0.12))",
                            color: "#C9A84C",
                            boxShadow: "0 0 22px rgba(155,125,42,0.12)",
                            transition: "all 0.28s",
                            position: "relative", overflow: "hidden",
                          }}
                        >
                          <motion.div
                            style={{
                              position: "absolute", inset: 0, pointerEvents: "none",
                              background: "linear-gradient(105deg, transparent 35%, rgba(255,220,80,0.05) 50%, transparent 65%)",
                            }}
                            animate={{ x: ["-100%", "200%"] }}
                            transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
                          />
                          <BookOpen size={15} />
                          VIEW FULL DISPOSAL GRIMOIRE
                        </button>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Footer ── */}
        <div style={{ marginTop: "70px", textAlign: "center" }}>
          <QuillDivider />
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: "0.76rem", letterSpacing: "0.6em",
            color: "rgba(155,125,42,0.13)",
            marginBottom: "8px",
          }}>ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ ᚷ ᚹ ᚺ ᚾ ᛁ ᛃ ᛇ ᛈ ᛉ ᛊ</div>
          <div style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: "italic", fontSize: "0.68rem", letterSpacing: "0.2em",
            color: "rgba(155,125,42,0.11)",
          }}>Ministry of Arcane Sanitation · Analysis Wing</div>
        </div>
      </div>
    </div>
  );
}