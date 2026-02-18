import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Camera, X, Sparkles, Wand2 } from "lucide-react";

interface Detection {
  label: string;
  confidence: number;
  bbox?: number[];
  area?: number;
  waste_type?: string;
}

interface WebcamDetectorProps {
  mode: "single" | "pile";
  onClose?: () => void;
}

export default function WebcamDetector({ mode, onClose }: WebcamDetectorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  
  const runningRef = useRef(false);
  const processingRef = useRef(false);
  
  const [isActive, setIsActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [detections, setDetections] = useState<Detection[]>([]);

  const FRAME_INTERVAL = 500;

  const stopDetection = useCallback(() => {
    runningRef.current = false;
    processingRef.current = false;
    setIsActive(false);
    setIsProcessing(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  useEffect(() => {
    startWebcam();
    return () => {
      stopDetection();
      stopWebcam();
    };
  }, [stopDetection]);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment", width: 1280, height: 720 } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing webcam:", err);
      alert("Could not access the scrying crystal. Please check permissions.");
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const captureFrame = useCallback(async (): Promise<Blob | null> => {
    if (!videoRef.current || !canvasRef.current) return null;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    ctx.drawImage(videoRef.current, 0, 0);

    return new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.8)
    );
  }, []);

  const drawBoxes = useCallback((detections: Detection[]) => {
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d")!;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    detections.forEach(det => {
      if (!det.bbox) return;

      const [x1, y1, x2, y2] = det.bbox;
      const width = x2 - x1;
      const height = y2 - y1;

      // Magical golden colors based on waste type
      const colors = {
        recyclable: "#10b981", // emerald
        organic: "#f59e0b", // amber
        hazardous: "#ef4444", // red
        default: "#D4A830", // magical gold
      };
      
      const color = det.waste_type 
        ? colors[det.waste_type as keyof typeof colors] || colors.default
        : colors.default;

      // Magical glow effect
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Draw main bounding box with ornate style
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.lineJoin = "round";
      ctx.strokeRect(x1, y1, width, height);

      // Draw corner ornaments (L-shapes)
      const cornerLength = 25;
      ctx.lineWidth = 5;
      
      // Top-left
      ctx.beginPath();
      ctx.moveTo(x1, y1 + cornerLength);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x1 + cornerLength, y1);
      ctx.stroke();

      // Top-right
      ctx.beginPath();
      ctx.moveTo(x2 - cornerLength, y1);
      ctx.lineTo(x2, y1);
      ctx.lineTo(x2, y1 + cornerLength);
      ctx.stroke();

      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(x1, y2 - cornerLength);
      ctx.lineTo(x1, y2);
      ctx.lineTo(x1 + cornerLength, y2);
      ctx.stroke();

      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(x2 - cornerLength, y2);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x2, y2 - cornerLength);
      ctx.stroke();

      // Reset shadow for text
      ctx.shadowBlur = 8;

      // Prepare label text
      const labelText = det.label.toUpperCase();
      const confidenceText = `${(det.confidence * 100).toFixed(1)}%`;
      
      // Label background
      ctx.font = "bold 15px 'Cinzel', serif";
      const labelWidth = ctx.measureText(labelText).width;
      ctx.font = "600 13px 'EB Garamond', serif";
      const confidenceWidth = ctx.measureText(confidenceText).width;
      const padding = 10;
      const labelHeight = 22;
      const totalWidth = Math.max(labelWidth, confidenceWidth) + padding * 2;

      // Draw ornate label background
      const gradient = ctx.createLinearGradient(x1, y1 - labelHeight - 32, x1, y1);
      gradient.addColorStop(0, "rgba(10, 8, 26, 0.95)");
      gradient.addColorStop(1, "rgba(6, 5, 18, 0.98)");
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x1, y1 - labelHeight - 32, totalWidth, labelHeight + 32);

      // Border for label
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x1, y1 - labelHeight - 32, totalWidth, labelHeight + 32);

      // Draw label text
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.fillStyle = color;
      ctx.font = "bold 15px 'Cinzel', serif";
      ctx.fillText(labelText, x1 + padding, y1 - 16);
      
      // Draw confidence text
      ctx.font = "600 13px 'EB Garamond', serif";
      ctx.fillStyle = "rgba(201, 168, 76, 0.8)";
      ctx.shadowBlur = 4;
      ctx.fillText(confidenceText, x1 + padding, y1 - 2);

      // Magical sparkle indicator
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#FFE57A";
      ctx.fillStyle = "#FFE57A";
      ctx.beginPath();
      ctx.arc(x1 + totalWidth - 15, y1 - 24, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Inner sparkle
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(x1 + totalWidth - 15, y1 - 24, 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.shadowBlur = 0;
    });
  }, []);

  const sendFrame = useCallback(async (blob: Blob) => {
    const formData = new FormData();
    formData.append("file", blob);
    formData.append("mode", mode === "single" ? "yolo_cnn" : "dual_yolo");

    const res = await fetch("http://127.0.0.1:8000/detect-frame", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error("Detection incantation failed");
    }

    const data = await res.json();

    return {
      detections: data.detections || [],
    };
  }, [mode]);

  const loop = useCallback(async (currentTime: number) => {
    if (!runningRef.current) {
      animationFrameRef.current = null;
      return;
    }

    const timeSinceLastFrame = currentTime - lastFrameTimeRef.current;

    if (timeSinceLastFrame < FRAME_INTERVAL || processingRef.current) {
      animationFrameRef.current = requestAnimationFrame(loop);
      return;
    }

    lastFrameTimeRef.current = currentTime;
    processingRef.current = true;
    setIsProcessing(true);

    try {
      const blob = await captureFrame();
      
      if (!blob) {
        processingRef.current = false;
        setIsProcessing(false);
        animationFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      const result = await sendFrame(blob);

      setDetections(result.detections);
      drawBoxes(result.detections);
    } catch (e) {
      console.error("Divination error:", e);
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }

    animationFrameRef.current = requestAnimationFrame(loop);
  }, [captureFrame, sendFrame, drawBoxes]);

  const startDetection = useCallback(() => {
    runningRef.current = true;
    setIsActive(true);
    lastFrameTimeRef.current = 0;
    animationFrameRef.current = requestAnimationFrame(loop);
  }, [loop]);

  const toggleDetection = () => {
    if (isActive) {
      stopDetection();
    } else {
      startDetection();
    }
  };

  const handleClose = () => {
    stopDetection();
    stopWebcam();
    onClose?.();
  };

  return (
    <div style={{ fontFamily: "'EB Garamond', Georgia, serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=EB+Garamond:wght@400;600&display=swap');
        
        @keyframes runeFloat {
          0%, 100% { transform: translateY(0px); opacity: 0.6; }
          50% { transform: translateY(-8px); opacity: 1; }
        }
        
        @keyframes magicalPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(212, 168, 48, 0.3); }
          50% { box-shadow: 0 0 30px rgba(212, 168, 48, 0.6); }
        }
      `}</style>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={{ display: "flex", flexDirection: "column", gap: "24px" }}
      >
        {/* Header */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          padding: "20px 24px",
          background: "linear-gradient(155deg, rgba(15,12,30,0.6) 0%, rgba(8,7,20,0.8) 100%)",
          border: "1px solid rgba(155,125,42,0.25)",
          borderRadius: "12px",
          position: "relative",
        }}>
          {/* Corner ornaments */}
          <div style={{
            position: "absolute", top: 0, left: 0,
            width: "30px", height: "30px",
            borderTop: "2px solid rgba(155,125,42,0.4)",
            borderLeft: "2px solid rgba(155,125,42,0.4)",
          }} />
          <div style={{
            position: "absolute", top: 0, right: 0,
            width: "30px", height: "30px",
            borderTop: "2px solid rgba(155,125,42,0.4)",
            borderRight: "2px solid rgba(155,125,42,0.4)",
          }} />

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{
              width: "52px", height: "52px",
              borderRadius: "12px",
              background: "rgba(155,125,42,0.15)",
              border: "1px solid rgba(201,168,76,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Camera style={{ width: "24px", height: "24px", color: "#D4A830" }} />
            </div>
            <div>
              <h3 style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "1.1rem",
                fontWeight: 700,
                color: "#C9A84C",
                letterSpacing: "0.02em",
              }}>
                Scrying Chamber
              </h3>
              <p style={{
                fontFamily: "'EB Garamond', serif",
                fontSize: "0.8rem",
                color: "rgba(155,125,42,0.6)",
                fontStyle: "italic",
              }}>
                {mode === "single" ? "Revelio Unum" : "Revelio Multum"}
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={handleClose}
              style={{
                padding: "10px",
                borderRadius: "8px",
                background: "rgba(155,125,42,0.1)",
                border: "1px solid rgba(155,125,42,0.2)",
                cursor: "pointer",
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(155,125,42,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(155,125,42,0.1)";
              }}
            >
              <X style={{ width: "20px", height: "20px", color: "#C9A84C" }} />
            </button>
          )}
        </div>

        {/* Video Display - Magical Crystal Frame */}
        <div style={{
          position: "relative",
          borderRadius: "16px",
          overflow: "hidden",
          border: "2px solid rgba(155,125,42,0.3)",
          background: "linear-gradient(155deg, rgba(10,8,26,0.8) 0%, rgba(6,5,18,0.9) 100%)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(201,168,76,0.1)",
        }}>
          {/* Decorative corners */}
          <div style={{ position: "absolute", top: "8px", left: "8px", width: "40px", height: "40px", borderTop: "3px solid rgba(212,168,48,0.5)", borderLeft: "3px solid rgba(212,168,48,0.5)", zIndex: 10, pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: "8px", right: "8px", width: "40px", height: "40px", borderTop: "3px solid rgba(212,168,48,0.5)", borderRight: "3px solid rgba(212,168,48,0.5)", zIndex: 10, pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "8px", left: "8px", width: "40px", height: "40px", borderBottom: "3px solid rgba(212,168,48,0.5)", borderLeft: "3px solid rgba(212,168,48,0.5)", zIndex: 10, pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: "8px", right: "8px", width: "40px", height: "40px", borderBottom: "3px solid rgba(212,168,48,0.5)", borderRight: "3px solid rgba(212,168,48,0.5)", zIndex: 10, pointerEvents: "none" }} />

          {/* Live Video Feed */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ 
              width: "100%", 
              borderRadius: "14px",
              maxHeight: "600px", 
              objectFit: "contain",
              display: "block",
            }}
          />

          {/* Overlay Canvas for Bounding Boxes */}
          <canvas
            ref={overlayCanvasRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              maxHeight: "600px",
              objectFit: "contain",
            }}
          />

          {/* Processing Indicator */}
          {isProcessing && (
            <div style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "rgba(10,8,26,0.95)",
              backdropFilter: "blur(8px)",
              padding: "8px 16px",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              border: "1px solid rgba(155,125,42,0.3)",
            }}>
              <Sparkles style={{ width: "14px", height: "14px", color: "#D4A830" }} className="animate-spin" />
              <span style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "0.7rem",
                fontWeight: 600,
                color: "#C9A84C",
                letterSpacing: "0.05em",
              }}>DIVINING...</span>
            </div>
          )}

          {/* Active Status Badge */}
          {isActive && !isProcessing && (
            <div style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              background: "linear-gradient(135deg, rgba(16,185,129,0.9), rgba(5,150,105,0.9))",
              backdropFilter: "blur(8px)",
              padding: "8px 16px",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              border: "1px solid rgba(16,185,129,0.4)",
              animation: "magicalPulse 2s ease-in-out infinite",
            }}>
              <div style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#ffffff",
                animation: "runeFloat 1.5s ease-in-out infinite",
              }} />
              <span style={{
                fontFamily: "'Cinzel', serif",
                fontSize: "0.7rem",
                fontWeight: 700,
                color: "#ffffff",
                letterSpacing: "0.1em",
              }}>SCRYING</span>
            </div>
          )}
        </div>

        {/* Hidden Canvas */}
        <canvas ref={canvasRef} style={{ display: "none" }} />

        {/* Controls - Magical Spell Buttons */}
        <div style={{ display: "flex", gap: "16px" }}>
          <button
            onClick={toggleDetection}
            style={{
              flex: 1,
              padding: "16px 24px",
              borderRadius: "12px",
              fontFamily: "'Cinzel', serif",
              fontWeight: 700,
              fontSize: "0.9rem",
              letterSpacing: "0.05em",
              transition: "all 0.3s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              border: isActive ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(155,125,42,0.4)",
              background: isActive 
                ? "linear-gradient(135deg, rgba(239,68,68,0.2), rgba(185,28,28,0.3))"
                : "linear-gradient(135deg, rgba(155,125,42,0.2), rgba(130,85,15,0.3))",
              color: isActive ? "#fca5a5" : "#D4A830",
              cursor: "pointer",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = isActive 
                ? "0 8px 25px rgba(239,68,68,0.3)"
                : "0 8px 25px rgba(155,125,42,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {isActive ? (
              <>
                <X style={{ width: "18px", height: "18px" }} />
                FINITE INCANTATEM
              </>
            ) : (
              <>
                <Wand2 style={{ width: "18px", height: "18px" }} />
                CAST DETECTION
              </>
            )}
          </button>
        </div>

        {/* Detection Results - Enchanted Scroll */}
        {detections.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: "linear-gradient(155deg, rgba(15,12,30,0.6) 0%, rgba(8,7,20,0.8) 100%)",
              borderRadius: "12px",
              border: "1px solid rgba(155,125,42,0.25)",
              padding: "24px",
              position: "relative",
            }}
          >
            {/* Decorative top border */}
            <div style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              width: "60%",
              height: "1px",
              background: "linear-gradient(90deg, transparent, rgba(212,168,48,0.6), transparent)",
            }} />

            <h4 style={{
              fontFamily: "'Cinzel', serif",
              fontSize: "0.9rem",
              fontWeight: 700,
              marginBottom: "16px",
              color: "#C9A84C",
              letterSpacing: "0.1em",
              textAlign: "center",
            }}>
              REVEALED ARTIFACTS ({detections.length})
            </h4>
            
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "12px",
            }}>
              {detections.map((det, i) => (
                <div
                  key={i}
                  style={{
                    padding: "14px",
                    borderRadius: "8px",
                    background: "rgba(155,125,42,0.08)",
                    border: "1px solid rgba(155,125,42,0.2)",
                    transition: "all 0.3s",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(155,125,42,0.15)";
                    e.currentTarget.style.borderColor = "rgba(212,168,48,0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(155,125,42,0.08)";
                    e.currentTarget.style.borderColor = "rgba(155,125,42,0.2)";
                  }}
                >
                  <div style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "#C9A84C",
                    marginBottom: "4px",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                  }}>
                    {det.label}
                  </div>
                  <div style={{
                    fontFamily: "'EB Garamond', serif",
                    fontSize: "0.75rem",
                    color: "rgba(155,125,42,0.6)",
                    fontStyle: "italic",
                  }}>
                    {(det.confidence * 100).toFixed(1)}% certainty
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}