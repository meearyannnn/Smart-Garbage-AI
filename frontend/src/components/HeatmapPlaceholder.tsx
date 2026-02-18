import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

export default function HeatmapPlaceholder() {
  // Generate mock heatmap dots
  const dots = [
    { x: 25, y: 30, intensity: 0.9 },
    { x: 45, y: 50, intensity: 0.7 },
    { x: 70, y: 25, intensity: 0.5 },
    { x: 60, y: 65, intensity: 0.85 },
    { x: 35, y: 70, intensity: 0.6 },
    { x: 80, y: 45, intensity: 0.4 },
    { x: 15, y: 55, intensity: 0.75 },
    { x: 55, y: 40, intensity: 0.95 },
  ];

  const getColor = (intensity: number) => {
    if (intensity > 0.8) return "bg-eco-red";
    if (intensity > 0.6) return "bg-eco-amber";
    return "bg-eco-green";
  };

  return (
    <div className="relative w-full h-80 rounded-2xl overflow-hidden border border-border bg-muted/30">
      {/* Mock map grid */}
      <div className="absolute inset-0">
        <svg className="w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          {Array.from({ length: 20 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={`${i * 5}%`} x2="100%" y2={`${i * 5}%`} stroke="currentColor" strokeWidth="0.5" />
          ))}
          {Array.from({ length: 20 }).map((_, i) => (
            <line key={`v${i}`} x1={`${i * 5}%`} y1="0" x2={`${i * 5}%`} y2="100%" stroke="currentColor" strokeWidth="0.5" />
          ))}
        </svg>
      </div>

      {/* Heatmap dots */}
      {dots.map((dot, i) => (
        <motion.div
          key={i}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: i * 0.1, duration: 0.4 }}
          className="absolute"
          style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
        >
          <div className={`w-8 h-8 rounded-full ${getColor(dot.intensity)} opacity-40 blur-md`} />
          <div className="absolute inset-0 flex items-center justify-center">
            <MapPin className={`w-4 h-4 ${dot.intensity > 0.8 ? "text-eco-red" : dot.intensity > 0.6 ? "text-eco-amber" : "text-eco-green"}`} />
          </div>
        </motion.div>
      ))}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-card/90 backdrop-blur-sm rounded-xl px-4 py-3 border border-border">
        <div className="text-xs font-medium text-foreground mb-2">Density</div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-eco-green" />
          <span className="text-xs text-muted-foreground">Low</span>
          <div className="w-3 h-3 rounded-full bg-eco-amber" />
          <span className="text-xs text-muted-foreground">Med</span>
          <div className="w-3 h-3 rounded-full bg-eco-red" />
          <span className="text-xs text-muted-foreground">High</span>
        </div>
      </div>
    </div>
  );
}
