import { Link, useLocation } from "react-router-dom";
import { Recycle, BarChart3, ScanSearch, BookOpen, Menu, X } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Nav links with Smart Guide added ─────────────────────────────────────────
const navLinks = [
  { to: "/",           label: "Home",        icon: Recycle,    rune: "ᚠ", spell: "Domus"       },
  { to: "/detect",     label: "Detection",   icon: ScanSearch, rune: "ᛞ", spell: "Revelatio"   },
  { to: "/smart-guide", label: "Guide",      icon: BookOpen,   rune: "ᚷ", spell: "Sapientia"   },
  { to: "/dashboard",  label: "Dashboard",   icon: BarChart3,  rune: "ᛟ", spell: "Cartografia" },
];

export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=EB+Garamond:ital,wght@0,400;0,500;1,400&display=swap');

        .nav-link-hp { transition: all 0.2s; }
        .nav-link-hp:hover { color: #E8D49A !important; }
        .nav-link-hp:hover .nav-link-bg { opacity: 1 !important; }
        .mobile-link-hp:hover { background: rgba(155,125,42,0.1) !important; color: #C9A84C !important; }
      `}</style>

      <nav style={{
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 50,
        background: "rgba(4,3,10,0.88)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(155,125,42,0.2)",
        boxShadow: "0 4px 30px rgba(0,0,0,0.5), 0 1px 0 rgba(201,168,76,0.06) inset",
      }}>
        {/* Subtle golden shimmer line at very top */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "1px",
          background: "linear-gradient(90deg, transparent 0%, rgba(201,168,76,0.5) 30%, rgba(255,220,80,0.7) 50%, rgba(201,168,76,0.5) 70%, transparent 100%)",
        }} />

        <div style={{
          maxWidth: "1280px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "64px",
          padding: "0 24px",
        }}>

          {/* ── Logo ──────────────────────────────────────────────── */}
          <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Crest */}
            <motion.div
              whileHover={{ scale: 1.08 }}
              style={{
                width: "38px", height: "38px",
                borderRadius: "8px",
                background: "linear-gradient(135deg, #B8920A 0%, #7A6020 60%, #9B7D2A 100%)",
                border: "1px solid rgba(255,220,80,0.35)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 14px rgba(155,125,42,0.3), inset 0 1px 0 rgba(255,230,120,0.25)",
                position: "relative", overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {/* Shimmer sweep */}
              <motion.div
                style={{
                  position: "absolute", inset: 0, pointerEvents: "none",
                  background: "linear-gradient(90deg, transparent, rgba(255,230,120,0.2), transparent)",
                }}
                animate={{ x: ["-100%", "200%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
              />
              <Recycle size={18} style={{ color: "#0A0814", position: "relative" }} />
            </motion.div>

            {/* Brand text */}
            <div>
              <div style={{
                fontFamily: "'Cinzel', serif",
                fontWeight: 700,
                fontSize: "1rem",
                letterSpacing: "0.12em",
                background: "linear-gradient(135deg, #FFE57A 0%, #C9A84C 50%, #9B7D2A 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                lineHeight: 1.1,
              }}>
                IMMUNDUS AI
              </div>
              <div style={{
                fontFamily: "'EB Garamond', serif",
                fontStyle: "italic",
                fontSize: "0.52rem",
                letterSpacing: "0.2em",
                color: "rgba(155,125,42,0.5)",
                lineHeight: 1,
              }}>
                Ministry of Arcane Sanitation
              </div>
            </div>
          </Link>

          {/* ── Desktop Links ──────────────────────────────────────── */}
          <div className="hidden md:flex" style={{ alignItems: "center", gap: "4px" }}>
            {navLinks.map((link) => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className="nav-link-hp"
                  style={{
                    position: "relative",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    textDecoration: "none",
                    color: active ? "#E8D49A" : "rgba(155,125,42,0.55)",
                    display: "flex", alignItems: "center", gap: "7px",
                  }}
                >
                  {/* Active / hover background */}
                  <div
                    className="nav-link-bg"
                    style={{
                      position: "absolute", inset: 0, borderRadius: "8px",
                      background: "rgba(155,125,42,0.12)",
                      border: "1px solid rgba(201,168,76,0.25)",
                      opacity: active ? 1 : 0,
                      transition: "opacity 0.2s",
                      boxShadow: active ? "0 0 12px rgba(155,125,42,0.1)" : "none",
                    }}
                  />

                  {/* Active bottom glow line */}
                  {active && (
                    <motion.div
                      layoutId="nav-active-line"
                      style={{
                        position: "absolute", bottom: 0, left: "20%", right: "20%", height: "1px",
                        background: "linear-gradient(90deg, transparent, #C9A84C, transparent)",
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}

                  {/* Rune badge */}
                  <span style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: "0.6rem",
                    color: active ? "rgba(201,168,76,0.7)" : "rgba(155,125,42,0.3)",
                    lineHeight: 1,
                    transition: "color 0.2s",
                  }}>
                    {link.rune}
                  </span>

                  <link.icon size={13} style={{ position: "relative", flexShrink: 0 }} />

                  <span style={{
                    fontFamily: "'Cinzel', serif",
                    fontSize: "0.68rem",
                    fontWeight: 600,
                    letterSpacing: "0.1em",
                    position: "relative",
                  }}>
                    {link.label.toUpperCase()}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* ── Status pill ───────────────────────────────────────── */}
          <div className="hidden md:flex" style={{
            alignItems: "center", gap: "6px",
            padding: "5px 12px",
            borderRadius: "20px",
            background: "rgba(155,125,42,0.08)",
            border: "1px solid rgba(155,125,42,0.2)",
          }}>
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80" }}
            />
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: "0.58rem", letterSpacing: "0.12em", color: "rgba(201,168,76,0.55)" }}>
              SCRYING
            </span>
          </div>

          {/* ── Mobile hamburger ──────────────────────────────────── */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px", height: "36px",
              borderRadius: "8px",
              border: "1px solid rgba(155,125,42,0.25)",
              background: "rgba(155,125,42,0.08)",
              color: "#C9A84C",
              cursor: "pointer",
            }}
            className="md:hidden"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={mobileOpen ? "close" : "open"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                {mobileOpen ? <X size={16} /> : <Menu size={16} />}
              </motion.div>
            </AnimatePresence>
          </button>
        </div>

        {/* ── Mobile Menu ───────────────────────────────────────────── */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              style={{
                overflow: "hidden",
                background: "rgba(4,3,10,0.97)",
                borderTop: "1px solid rgba(155,125,42,0.15)",
                borderBottom: "1px solid rgba(155,125,42,0.2)",
              }}
            >
              {/* Runic divider inside mobile */}
              <div style={{
                margin: "0 20px",
                height: "1px",
                background: "linear-gradient(90deg, transparent, rgba(155,125,42,0.3), transparent)",
              }} />

              <div style={{ padding: "10px 16px 16px" }}>
                {navLinks.map((link, i) => {
                  const active = location.pathname === link.to;
                  return (
                    <motion.div
                      key={link.to}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.07 }}
                    >
                      <Link
                        to={link.to}
                        onClick={() => setMobileOpen(false)}
                        className="mobile-link-hp"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px 16px",
                          borderRadius: "10px",
                          textDecoration: "none",
                          color: active ? "#E8D49A" : "rgba(155,125,42,0.55)",
                          background: active ? "rgba(155,125,42,0.12)" : "transparent",
                          border: active ? "1px solid rgba(201,168,76,0.2)" : "1px solid transparent",
                          marginBottom: "4px",
                          transition: "all 0.2s",
                        }}
                      >
                        {/* Rune */}
                        <span style={{
                          fontFamily: "'Cinzel', serif",
                          fontSize: "0.9rem",
                          color: active ? "#C9A84C" : "rgba(155,125,42,0.3)",
                          width: "16px", textAlign: "center",
                        }}>
                          {link.rune}
                        </span>

                        <link.icon size={14} />

                        {/* Label + latin spell name */}
                        <div>
                          <div style={{ fontFamily: "'Cinzel', serif", fontSize: "0.72rem", fontWeight: 600, letterSpacing: "0.1em" }}>
                            {link.label.toUpperCase()}
                          </div>
                          <div style={{ fontFamily: "'EB Garamond', serif", fontStyle: "italic", fontSize: "0.62rem", color: "rgba(155,125,42,0.4)", letterSpacing: "0.06em" }}>
                            {link.spell}
                          </div>
                        </div>

                        {/* Active right indicator */}
                        {active && (
                          <div style={{
                            marginLeft: "auto",
                            width: "4px", height: "4px",
                            borderRadius: "50%",
                            background: "#C9A84C",
                            boxShadow: "0 0 6px #C9A84C",
                          }} />
                        )}
                      </Link>
                    </motion.div>
                  );
                })}

                {/* Mobile footer runes */}
                <div style={{
                  marginTop: "12px",
                  paddingTop: "12px",
                  borderTop: "1px solid rgba(155,125,42,0.1)",
                  textAlign: "center",
                  fontFamily: "'Cinzel', serif",
                  fontSize: "0.7rem",
                  letterSpacing: "0.5em",
                  color: "rgba(155,125,42,0.18)",
                }}>
                  ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}