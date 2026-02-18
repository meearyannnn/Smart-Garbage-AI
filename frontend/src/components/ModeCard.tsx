import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

interface ModeCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  models: string;
  to: string;
  delay?: number;
}

export default function ModeCard({ title, description, icon: Icon, models, to, delay = 0 }: ModeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Link to={to} className="block group">
        <div className="relative overflow-hidden rounded-2xl bg-card border border-border shadow-card transition-all duration-300 group-hover:shadow-card-hover group-hover:border-primary/30 group-hover:-translate-y-1">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: "var(--gradient-card-hover)" }} />
          <div className="relative p-8">
            <div className="w-14 h-14 rounded-xl gradient-eco flex items-center justify-center mb-5 group-hover:animate-pulse-glow transition-all">
              <Icon className="w-7 h-7 text-primary-foreground" />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">{title}</h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-4">{description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-primary bg-accent px-3 py-1 rounded-full">
                {models}
              </span>
              <span className="text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                Start Detection →
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
