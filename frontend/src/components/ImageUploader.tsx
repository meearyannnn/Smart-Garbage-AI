import { useState, useCallback, useRef } from "react";
import { Upload, Camera, X, Image as ImageIcon, StopCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ── Types (unchanged) ─────────────────────────────────────────────────────────
interface ImageUploaderProps {
  onImageSelect: (file: File | null) => void;
  onWebcamToggle?: (active: boolean) => void;
  isWebcamActive?: boolean;
}

// ── Shared button style helper ────────────────────────────────────────────────
const spellButtonStyle = (accent = false): React.CSSProperties => ({
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
  padding: "9px 18px",
  borderRadius: "9px",
  fontFamily: "'Cinzel', serif",
  fontSize: "0.65rem",
  fontWeight: 600,
  letterSpacing: "0.12em",
  cursor: "pointer",
  transition: "all 0.2s",
  border: accent
    ? "1px solid rgba(201,168,76,0.45)"
    : "1px solid rgba(155,125,42,0.25)",
  background: accent
    ? "linear-gradient(135deg, rgba(155,100,20,0.22), rgba(100,65,10,0.14))"
    : "rgba(155,125,42,0.08)",
  color: accent ? "#E8D49A" : "rgba(155,125,42,0.7)",
  boxShadow: accent ? "0 0 14px rgba(155,125,42,0.12)" : "none",
});

// ── Main component (ALL LOGIC UNCHANGED) ─────────────────────────────────────
export default function ImageUploader({
  onImageSelect,
  onWebcamToggle,
  isWebcamActive = false,
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
      onImageSelect(file);
    };
    reader.readAsDataURL(file);
  }, [onImageSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFile(file);
  }, [handleFile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      onWebcamToggle?.(true);
    } catch (error) {
      console.error("Error accessing webcam:", error);
      alert("Unable to access webcam. Please check permissions.");
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    onWebcamToggle?.(false);
  };

  const clear = () => {
    setPreview(null);
    onImageSelect(null);
    if (isWebcamActive) stopWebcam();
  };

  // ── Shared enchanted frame wrapper ──────────────────────────────
  const EnchantedFrame = ({ children, minH = "256px" }: { children: React.ReactNode; minH?: string }) => (
    <div style={{
      position: "relative",
      borderRadius: "16px",
      overflow: "hidden",
      border: "1px solid rgba(155,125,42,0.3)",
      background: "rgba(6,5,16,0.92)",
      boxShadow: "0 4px 40px rgba(0,0,0,0.55), 0 0 20px rgba(155,125,42,0.06), inset 0 1px 0 rgba(201,168,76,0.06)",
      minHeight: minH,
    }}>
      {/* Corner runes */}
      {[
        { top: "8px",    left:  "10px" },
        { top: "8px",    right: "10px" },
        { bottom: "8px", left:  "10px" },
        { bottom: "8px", right: "10px" },
      ].map((pos, i) => (
        <span key={i} style={{
          position: "absolute",
          fontFamily: "'Cinzel', serif",
          fontSize: "0.6rem",
          color: "rgba(155,125,42,0.22)",
          pointerEvents: "none",
          zIndex: 3,
          ...pos,
        }}>
          {["ᚠ", "ᚢ", "ᛟ", "ᛞ"][i]}
        </span>
      ))}
      {children}
    </div>
  );

  return (
    <div style={{ width: "100%" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap');
        .uploader-btn:hover { filter: brightness(1.25); box-shadow: 0 0 16px rgba(155,125,42,0.2) !important; }
        .stop-btn:hover { background: rgba(200,50,30,0.35) !important; }
        .clear-btn:hover { background: rgba(155,125,42,0.25) !important; }
      `}</style>

      <AnimatePresence mode="wait">

        {/* ── Webcam live view ──────────────────────────────────── */}
        {isWebcamActive ? (
          <motion.div
            key="webcam"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3 }}
          >
            <EnchantedFrame>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{
                  width: "100%",
                  height: "256px",
                  objectFit: "cover",
                  display: "block",
                  background: "#000",
                }}
              />

              {/* Overlay scan lines */}
              <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(155,125,42,0.02) 3px, rgba(155,125,42,0.02) 4px)",
              }} />

              {/* Stop button */}
              <button
                onClick={clear}
                className="stop-btn"
                style={{
                  position: "absolute", top: "12px", right: "12px",
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "7px 14px",
                  borderRadius: "8px",
                  fontFamily: "'Cinzel', serif",
                  fontSize: "0.6rem",
                  letterSpacing: "0.1em",
                  border: "1px solid rgba(220,60,40,0.45)",
                  background: "rgba(160,40,20,0.25)",
                  color: "#F47060",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  zIndex: 4,
                  backdropFilter: "blur(8px)",
                }}
              >
                <StopCircle size={13} />
                END SCRYING
              </button>

              {/* Live indicator */}
              <div style={{
                position: "absolute", bottom: "12px", left: "12px",
                display: "flex", alignItems: "center", gap: "7px",
                padding: "5px 12px",
                borderRadius: "20px",
                background: "rgba(4,3,10,0.8)",
                border: "1px solid rgba(220,60,40,0.4)",
                backdropFilter: "blur(8px)",
                zIndex: 4,
              }}>
                <motion.div
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                  style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#F47060", boxShadow: "0 0 6px #F47060" }}
                />
                <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.58rem", letterSpacing: "0.15em", color: "#F47060" }}>
                  SCRYING LIVE
                </span>
              </div>
            </EnchantedFrame>
          </motion.div>

        /* ── Preview ──────────────────────────────────────────── */
        ) : preview ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3 }}
          >
            <EnchantedFrame>
              <img
                src={preview}
                alt="Upload preview"
                style={{ width: "100%", height: "256px", objectFit: "cover", display: "block" }}
              />

              {/* Bottom label strip */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                padding: "28px 14px 10px",
                background: "linear-gradient(transparent, rgba(4,3,10,0.88))",
                display: "flex", justifyContent: "space-between", alignItems: "flex-end",
                zIndex: 2,
                pointerEvents: "none",
              }}>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.53rem", letterSpacing: "0.2em", color: "rgba(201,168,76,0.5)" }}>
                  SPECIMEN READY
                </div>
                <div style={{ fontFamily: "'EB Garamond', serif", fontStyle: "italic", fontSize: "0.6rem", color: "rgba(155,125,42,0.4)" }}>
                  awaiting the incantation
                </div>
              </div>

              {/* Clear button */}
              <button
                onClick={clear}
                className="clear-btn"
                style={{
                  position: "absolute", top: "12px", right: "12px",
                  width: "30px", height: "30px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: "8px",
                  border: "1px solid rgba(155,125,42,0.3)",
                  background: "rgba(6,5,16,0.75)",
                  color: "#C9A84C",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  backdropFilter: "blur(8px)",
                  zIndex: 4,
                }}
              >
                <X size={13} />
              </button>
            </EnchantedFrame>
          </motion.div>

        /* ── Drop zone ────────────────────────────────────────── */
        ) : (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "256px",
                borderRadius: "16px",
                border: `2px dashed ${dragging ? "rgba(201,168,76,0.65)" : "rgba(155,125,42,0.25)"}`,
                background: dragging
                  ? "rgba(155,100,20,0.09)"
                  : "rgba(6,5,16,0.6)",
                cursor: "pointer",
                transition: "all 0.25s",
                boxShadow: dragging
                  ? "0 0 30px rgba(155,125,42,0.14), inset 0 0 30px rgba(155,100,20,0.06)"
                  : "inset 0 0 20px rgba(0,0,0,0.3)",
              }}
            >
              {/* Hidden file input over entire zone */}
              <input
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer", zIndex: 1 }}
              />

              {/* Decorative corner marks */}
              {[
                { top:  0,    left:  0,  borderTop: "2px solid", borderLeft: "2px solid",  borderRadius: "4px 0 0 0" },
                { top:  0,    right: 0,  borderTop: "2px solid", borderRight: "2px solid", borderRadius: "0 4px 0 0" },
                { bottom: 0,  left:  0,  borderBottom: "2px solid", borderLeft: "2px solid",  borderRadius: "0 0 0 4px" },
                { bottom: 0,  right: 0,  borderBottom: "2px solid", borderRight: "2px solid", borderRadius: "0 0 4px 0" },
              ].map((s, i) => (
                <div key={i} style={{
                  position: "absolute",
                  width: "16px", height: "16px",
                  borderColor: dragging ? "rgba(201,168,76,0.6)" : "rgba(155,125,42,0.3)",
                  pointerEvents: "none",
                  ...s,
                }} />
              ))}

              {/* Icon */}
              <motion.div
                animate={dragging
                  ? { scale: 1.15, y: -4 }
                  : { scale: 1, y: 0 }
                }
                transition={{ duration: 0.25 }}
                style={{
                  width: "54px", height: "54px",
                  borderRadius: "12px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: "16px",
                  background: dragging
                    ? "rgba(155,100,20,0.2)"
                    : "rgba(155,125,42,0.08)",
                  border: `1px solid ${dragging ? "rgba(201,168,76,0.4)" : "rgba(155,125,42,0.2)"}`,
                  boxShadow: dragging ? "0 0 20px rgba(155,125,42,0.2)" : "none",
                  transition: "all 0.25s",
                  position: "relative", zIndex: 2,
                }}
              >
                <Upload size={22} style={{ color: dragging ? "#C9A84C" : "rgba(155,125,42,0.5)" }} />
              </motion.div>

              {/* Text */}
              <p style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: "0.08em",
                color: dragging ? "#E8D49A" : "rgba(201,168,76,0.65)",
                marginBottom: "5px",
                position: "relative", zIndex: 2,
                transition: "color 0.2s",
              }}>
                {dragging ? "Release the Relic" : "Drop thy specimen here"}
              </p>
              <p style={{
                fontFamily: "'EB Garamond', serif",
                fontStyle: "italic",
                fontSize: "0.78rem",
                color: "rgba(155,125,42,0.38)",
                marginBottom: "22px",
                position: "relative", zIndex: 2,
              }}>
                or invoke the archive · PNG, JPG up to 10MB
              </p>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: "10px", position: "relative", zIndex: 2 }}>
                <label
                  className="uploader-btn"
                  style={spellButtonStyle(true)}
                >
                  <ImageIcon size={13} />
                  UPLOAD RELIC
                  <input type="file" accept="image/*" onChange={handleInputChange} style={{ display: "none" }} />
                </label>

                <button
                  onClick={(e) => { e.stopPropagation(); startWebcam(); }}
                  className="uploader-btn"
                  style={spellButtonStyle(false)}
                >
                  <Camera size={13} />
                  OPEN MIRROR
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}