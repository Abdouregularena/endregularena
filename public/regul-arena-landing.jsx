import { useState, useEffect, useRef, useCallback } from "react";

// ── TOKENS ────────────────────────────────────────────────────────────────────
const T = {
  bg:      "#0A192F",
  card:    "#112240",
  div:     "#233554",
  gold:    "#F5C453",
  goldM:   "#C5A059",
  goldD:   "#8B6914",
  text:    "#F8F9FA",
  muted:   "#8892B0",
  cyan:    "#00B4D8",
};

// ── CONSTELLATION CANVAS (fidèle à la vidéo) ──────────────────────────────────
function ConstellationCanvas() {
  const ref = useRef(null);
  useEffect(() => {
    const cv = ref.current;
    const ctx = cv.getContext("2d");
    let W, H, nodes, raf, t = 0;

    const resize = () => {
      W = cv.width  = cv.offsetWidth;
      H = cv.height = cv.offsetHeight;
    };

    const mkNodes = () => {
      nodes = Array.from({ length: 55 }, (_, i) => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 2.5 + 1,
        dx: (Math.random() - 0.5) * 0.18,
        dy: (Math.random() - 0.5) * 0.18,
        // gold or white/blue dots as in video
        gold: Math.random() > 0.55,
        pulse: Math.random() * Math.PI * 2,
      }));
    };

    const draw = () => {
      t += 0.012;
      ctx.clearRect(0, 0, W, H);

      // Subtle radial gradient overlay (depth)
      const grd = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W * 0.6);
      grd.addColorStop(0, "rgba(17,34,64,0.0)");
      grd.addColorStop(1, "rgba(10,25,47,0.55)");
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, W, H);

      // Draw edges (gold lines like video)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dist = Math.hypot(a.x - b.x, a.y - b.y);
          const maxD = W < 600 ? 130 : 190;
          if (dist < maxD) {
            const op = (1 - dist / maxD) * 0.45;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            // gold-tinted lines as in video
            ctx.strokeStyle = `rgba(197,160,89,${op})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      nodes.forEach(n => {
        n.x += n.dx; n.y += n.dy;
        if (n.x < 0) n.x = W; if (n.x > W) n.x = 0;
        if (n.y < 0) n.y = H; if (n.y > H) n.y = 0;

        const pulse = Math.sin(t + n.pulse) * 0.4 + 0.7; // breathing
        const r = n.r * pulse;

        if (n.gold) {
          // Gold glowing node
          const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 3.5);
          g.addColorStop(0, `rgba(245,196,83,0.9)`);
          g.addColorStop(0.4, `rgba(197,160,89,0.4)`);
          g.addColorStop(1, `rgba(197,160,89,0)`);
          ctx.beginPath();
          ctx.arc(n.x, n.y, r * 3.5, 0, Math.PI * 2);
          ctx.fillStyle = g;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = n.gold
          ? `rgba(245,196,83,${0.8 * pulse})`
          : `rgba(248,249,250,${0.3 * pulse})`;
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };

    resize(); mkNodes(); draw();
    const ro = new ResizeObserver(() => { resize(); mkNodes(); });
    ro.observe(cv);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);

  return (
    <canvas ref={ref} style={{
      position: "absolute", inset: 0,
      width: "100%", height: "100%",
      pointerEvents: "none",
    }} />
  );
}

// ── LOGO SVG (monogramme RA stylisé) ─────────────────────────────────────────
function LogoMark({ size = 36 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      {/* R shape */}
      <path d="M6 8 L6 32 L6 20 L20 20 Q26 20 26 14 Q26 8 20 8 Z" stroke={T.gold} strokeWidth="2.5" fill="none" strokeLinejoin="round"/>
      <path d="M6 20 L26 32" stroke={T.gold} strokeWidth="2.5" strokeLinecap="round"/>
      {/* A shape diagonal */}
      <path d="M22 32 L32 8 L34 32" stroke={T.goldM} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" fill="none"/>
      <path d="M24.5 22 L32 22" stroke={T.goldM} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

// ── LARGE 3D-STYLE LOGO SVG ───────────────────────────────────────────────────
function HeroLogo() {
  return (
    <svg width="160" height="160" viewBox="0 0 160 160" fill="none" style={{ filter: `drop-shadow(0 0 40px ${T.gold}88) drop-shadow(0 0 80px ${T.gold}44)` }}>
      {/* Outer ring */}
      <circle cx="80" cy="80" r="76" stroke={T.gold} strokeWidth="1" strokeDasharray="4 6" opacity="0.4" />
      <circle cx="80" cy="80" r="68" stroke={T.goldM} strokeWidth="0.5" opacity="0.25" />

      {/* R — thick strokes, 3D feel */}
      <path d="M32 40 L32 120" stroke={T.gold} strokeWidth="10" strokeLinecap="round"/>
      <path d="M32 40 L70 40 Q90 40 90 58 Q90 76 70 76 L32 76" stroke={T.gold} strokeWidth="9" strokeLinejoin="round" fill="none"/>
      <path d="M32 76 L90 120" stroke={T.gold} strokeWidth="8" strokeLinecap="round"/>

      {/* Highlight on R */}
      <path d="M34 42 L68 42 Q86 42 87 58" stroke="rgba(255,220,120,0.6)" strokeWidth="3" strokeLinecap="round" fill="none"/>

      {/* A — right side, lighter gold */}
      <path d="M88 120 L110 40 L132 120" stroke={T.goldM} strokeWidth="8" strokeLinejoin="round" strokeLinecap="round" fill="none"/>
      <path d="M95 88 L125 88" stroke={T.goldM} strokeWidth="7" strokeLinecap="round"/>

      {/* Highlight on A */}
      <path d="M110 44 L128 116" stroke="rgba(255,220,120,0.35)" strokeWidth="2.5" strokeLinecap="round"/>

      {/* Bottom glow arc */}
      <path d="M30 130 Q80 148 130 130" stroke={T.gold} strokeWidth="1.5" strokeLinecap="round" opacity="0.35" fill="none"/>
    </svg>
  );
}

// ── NAVBAR LINK ───────────────────────────────────────────────────────────────
function NavLink({ label, active }) {
  const [hov, setHov] = useState(false);
  return (
    <a
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        color: active || hov ? T.gold : T.muted,
        fontSize: 12, fontWeight: 700, letterSpacing: 1.5,
        textDecoration: "none", cursor: "pointer",
        textTransform: "uppercase",
        fontFamily: "'Montserrat', sans-serif",
        transition: "color 0.18s",
        borderBottom: active ? `2px solid ${T.gold}` : "2px solid transparent",
        paddingBottom: 2,
      }}
    >{label}</a>
  );
}

// ── PILL BUTTON ───────────────────────────────────────────────────────────────
function PillBtn({ children, variant = "outline", onClick }) {
  const [hov, setHov] = useState(false);
  const isPri = variant === "primary";
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        padding: isPri ? "9px 22px" : "8px 18px",
        borderRadius: 999, border: "none", cursor: "pointer",
        fontFamily: "'Montserrat', sans-serif",
        fontWeight: 800, fontSize: 12, letterSpacing: 1.5,
        textTransform: "uppercase",
        background: isPri
          ? hov ? `linear-gradient(135deg, #FFD56B, ${T.gold})` : `linear-gradient(135deg, ${T.gold}, ${T.goldM})`
          : hov ? "rgba(245,196,83,0.1)" : "rgba(245,196,83,0.06)",
        color: isPri ? T.bg : T.gold,
        border: isPri ? "none" : `1.5px solid ${T.gold}88`,
        boxShadow: isPri
          ? hov ? `0 0 28px ${T.gold}88, 0 4px 16px rgba(0,0,0,0.4)` : `0 0 14px ${T.gold}55`
          : "none",
        transform: hov ? "translateY(-1px)" : "none",
        transition: "all 0.2s ease",
        whiteSpace: "nowrap",
      }}>{children}</button>
  );
}

// ── LARGE CTA BUTTON ─────────────────────────────────────────────────────────
function HeroCTA({ children, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        padding: "14px 44px", borderRadius: 8, border: "none", cursor: "pointer",
        fontFamily: "'Montserrat', sans-serif", fontWeight: 800,
        fontSize: 14, letterSpacing: 2, textTransform: "uppercase",
        background: hov
          ? `linear-gradient(135deg, #FFD56B, ${T.gold})`
          : `linear-gradient(135deg, ${T.gold}, ${T.goldM})`,
        color: T.bg,
        boxShadow: hov
          ? `0 0 40px ${T.gold}99, 0 8px 32px rgba(0,0,0,0.5)`
          : `0 0 20px ${T.gold}55, 0 4px 16px rgba(0,0,0,0.4)`,
        transform: hov ? "translateY(-2px) scale(1.02)" : "none",
        transition: "all 0.25s ease",
      }}>{children}</button>
  );
}

// ── STATS TICKER ──────────────────────────────────────────────────────────────
function StatPill({ value, label }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "8px 20px",
      borderRadius: 8,
      background: "rgba(17,34,64,0.7)",
      border: `1px solid ${T.div}`,
      backdropFilter: "blur(8px)",
    }}>
      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: 2, color: T.gold, lineHeight: 1 }}>{value}</span>
      <span style={{ fontSize: 10, color: T.muted, letterSpacing: 1.5, fontWeight: 700, textTransform: "uppercase", marginTop: 2 }}>{label}</span>
    </div>
  );
}

// ── FEATURE CARD ──────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, accent = T.gold }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: "rgba(17,34,64,0.85)", borderRadius: 14,
        border: `1px solid ${hov ? accent + "55" : T.div}`,
        padding: "24px 20px",
        backdropFilter: "blur(12px)",
        boxShadow: hov ? `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${accent}22` : "0 4px 16px rgba(0,0,0,0.3)",
        transform: hov ? "translateY(-4px)" : "none",
        transition: "all 0.25s ease",
        cursor: "default",
      }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 800, fontSize: 14, color: T.text, marginBottom: 8, letterSpacing: 0.5 }}>{title}</div>
      <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.7, fontFamily: "'Lato', sans-serif" }}>{desc}</div>
      <div style={{ width: 32, height: 3, borderRadius: 2, background: accent, marginTop: 14, boxShadow: `0 0 8px ${accent}66` }} />
    </div>
  );
}

// ── LENS FLARE (cinematic, like intro video) ─────────────────────────────────
function LensFlare() {
  return (
    <div style={{ position: "absolute", top: "22%", left: "52%", pointerEvents: "none", transform: "translate(-50%,-50%)" }}>
      <div style={{
        width: 320, height: 320, borderRadius: "50%",
        background: `radial-gradient(circle, ${T.gold}22 0%, ${T.gold}08 35%, transparent 70%)`,
        animation: "pulse 3s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
        width: 80, height: 80, borderRadius: "50%",
        background: `radial-gradient(circle, white 0%, ${T.gold}66 30%, transparent 70%)`,
        animation: "pulse 2.5s ease-in-out infinite 0.3s",
      }} />
    </div>
  );
}

// ── SCROLL INDICATOR ─────────────────────────────────────────────────────────
function ScrollDots({ count = 4, active = 0 }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          width: i === active ? 18 : 6, height: 6, borderRadius: 3,
          background: i === active ? T.gold : T.div,
          transition: "all 0.3s ease",
        }} />
      ))}
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function ReguArenaLanding() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [activeDot, setActiveDot] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActiveDot(d => (d + 1) % 4), 2800);
    return () => clearInterval(t);
  }, []);

  const navLinks = ["Home", "Recordings", "Seminars", "Players", "Contacts"];
  const features = [
    { icon: "🏦", title: "Quiz Réglementaire UEMOA", desc: "Maîtrisez les instructions BCEAO, circulaires de change et textes fondateurs de l'UMOA à travers des challenges gamifiés.", accent: T.gold },
    { icon: "⚔️", title: "Duels & Tournois", desc: "Affrontez des professionnels de 14 pays en temps réel. Grimpez au classement et devenez référence réglementaire.", accent: T.cyan },
    { icon: "📜", title: "Bibliothèque SWIFT", desc: "UCP 600, RUGD 2010, ISO 20022, MT 700/707 — tous les textes officiels accessibles et consultables.", accent: T.goldM },
    { icon: "🎓", title: "Certifications Reconnues", desc: "Obtenez des attestations valorisables : BCEAO, CEMAC, conformité LCB-FT, crédits documentaires.", accent: "#F472B6" },
    { icon: "📊", title: "Analytics & Progression", desc: "Suivez votre évolution module par module avec des indicateurs précis et des recommandations personnalisées.", accent: T.cyan },
    { icon: "🌍", title: "Réseau Panafricain", desc: "Rejoignez 2 847 banquiers, régulateurs et juristes de la zone franc. Échangez et co-apprenez.", accent: T.gold },
  ];

  return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", background: T.bg, color: T.text, minHeight: "100vh", overflowX: "hidden" }}>
      {/* Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Montserrat:wght@400;600;700;800;900&family=Lato:wght@400;700&family=JetBrains+Mono:wght@400;600&display=swap');
        * { box-sizing: border-box; margin:0; padding:0; }
        body { background: ${T.bg}; overflow-x: hidden; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background: ${T.div}; border-radius:2px; }
        @keyframes pulse {
          0%,100% { opacity:0.6; transform: translate(-50%,-50%) scale(1); }
          50% { opacity:1; transform: translate(-50%,-50%) scale(1.15); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(28px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0%,100% { opacity:0.4; }
          50% { opacity:1; }
        }
        .fadeUp { animation: fadeUp 0.7s ease both; }
        .fadeUp1 { animation: fadeUp 0.7s 0.15s ease both; }
        .fadeUp2 { animation: fadeUp 0.7s 0.3s ease both; }
        .fadeUp3 { animation: fadeUp 0.7s 0.45s ease both; }
        .fadeUp4 { animation: fadeUp 0.7s 0.6s ease both; }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        height: 62,
        background: "rgba(10,25,47,0.88)",
        backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${T.div}`,
        display: "flex", alignItems: "center",
        padding: "0 32px",
        gap: 0,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 48 }}>
          <LogoMark size={34} />
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 3, color: T.gold, lineHeight: 1 }}>REGUL ARENA</div>
            <div style={{ fontSize: 8, color: T.muted, letterSpacing: 2, fontWeight: 700 }}>REGULATORY EXCELLENCE</div>
          </div>
        </div>

        {/* Nav links — desktop */}
        <div style={{ display: "flex", gap: 28, flex: 1, alignItems: "center" }}>
          {navLinks.map((l, i) => <NavLink key={l} label={l} active={i === 0} />)}
        </div>

        {/* Right actions (faithful to video) */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Search icon */}
          <div style={{ color: T.muted, cursor: "pointer", fontSize: 16 }}>🔍</div>

          {/* "View Databases" outlined pill */}
          <PillBtn variant="outline">View Databases</PillBtn>

          {/* "Sign In / Up" gold pill */}
          <PillBtn variant="primary">Sign Up</PillBtn>

          {/* Hamburger */}
          <div onClick={() => setMenuOpen(o => !o)} style={{ cursor: "pointer", display: "flex", flexDirection: "column", gap: 4, padding: "4px 6px" }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: 20, height: 2, borderRadius: 1, background: T.muted,
                transform: menuOpen && i === 0 ? "rotate(45deg) translate(4px,4px)" : menuOpen && i === 2 ? "rotate(-45deg) translate(4px,-4px)" : "none",
                opacity: menuOpen && i === 1 ? 0 : 1,
                transition: "all 0.2s",
              }} />
            ))}
          </div>
        </div>
      </nav>

      {/* ── HERO SECTION ── */}
      <section style={{
        position: "relative", minHeight: "100vh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        paddingTop: 62, overflow: "hidden",
      }}>
        {/* Background constellation */}
        <ConstellationCanvas />

        {/* Deep vignette */}
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse 70% 60% at 50% 50%, transparent 30%, rgba(10,25,47,0.7) 100%)`,
          pointerEvents: "none",
        }} />

        {/* Lens flare effect (like splash video) */}
        <LensFlare />

        {/* Hero content */}
        <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 0, textAlign: "center", padding: "0 24px" }}>

          {/* Badge */}
          <div className="fadeUp" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 16px", borderRadius: 999,
            background: "rgba(245,196,83,0.1)",
            border: `1px solid ${T.gold}44`,
            marginBottom: 28,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ADE80", boxShadow: "0 0 8px #4ADE8088", animation: "shimmer 2s ease infinite" }} />
            <span style={{ fontSize: 11, color: T.gold, fontWeight: 700, letterSpacing: 2 }}>LIVE — 14 PAYS · UEMOA / CEMAC</span>
          </div>

          {/* Main logo */}
          <div className="fadeUp1" style={{ marginBottom: 20 }}>
            <HeroLogo />
          </div>

          {/* Title */}
          <h1 className="fadeUp2" style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "clamp(42px, 8vw, 88px)",
            letterSpacing: "0.08em",
            lineHeight: 1,
            marginBottom: 10,
            background: `linear-gradient(135deg, ${T.text} 0%, ${T.gold} 55%, ${T.goldM} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            REGUL ARENA
          </h1>

          {/* Subtitle */}
          <p className="fadeUp3" style={{
            fontSize: "clamp(13px, 2vw, 16px)",
            color: T.muted, maxWidth: 520, lineHeight: 1.8,
            marginBottom: 36, fontFamily: "'Lato', sans-serif",
          }}>
            La première plateforme africaine de formation réglementaire gamifiée.<br />
            Maîtrisez les normes <span style={{ color: T.gold, fontWeight: 700 }}>BCEAO · UEMOA · BSDA</span> par le jeu, les duels et les certifications.
          </p>

          {/* CTA row */}
          <div className="fadeUp4" style={{ display: "flex", gap: 16, alignItems: "center", marginBottom: 48, flexWrap: "wrap", justifyContent: "center" }}>
            <HeroCTA>Get Started</HeroCTA>
            <PillBtn variant="outline">▶ Voir la démo</PillBtn>
          </div>

          {/* Scroll dots (like video) */}
          <div className="fadeUp4" style={{ marginBottom: 32 }}>
            <ScrollDots count={4} active={activeDot} />
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { value: "2 847", label: "Membres actifs" },
              { value: "14", label: "Pays UEMOA/CEMAC" },
              { value: "912", label: "Quiz complétés / mois" },
              { value: "87%", label: "Score moyen" },
            ].map(s => <StatPill key={s.label} {...s} />)}
          </div>
        </div>

        {/* Scroll arrow */}
        <div style={{
          position: "absolute", bottom: 28, left: "50%", transform: "translateX(-50%)",
          color: T.muted, fontSize: 11, letterSpacing: 2, fontWeight: 700,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
          animation: "fadeUp 1.2s 0.8s ease both",
        }}>
          <span>SCROLL</span>
          <div style={{ width: 1, height: 28, background: `linear-gradient(to bottom, ${T.gold}88, transparent)` }} />
        </div>
      </section>

      {/* ── FEATURES SECTION ── */}
      <section style={{
        padding: "100px 48px", maxWidth: 1200, margin: "0 auto",
        position: "relative",
      }}>
        {/* Section header */}
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 11, color: T.gold, letterSpacing: 3, fontWeight: 700, marginBottom: 10 }}>
            POURQUOI REGUL ARENA
          </div>
          <h2 style={{
            fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(32px, 5vw, 56px)",
            letterSpacing: "0.06em", color: T.text, lineHeight: 1,
          }}>
            TOUT CE DONT VOUS AVEZ <span style={{ color: T.gold }}>BESOIN</span>
          </h2>
          <div style={{ width: 60, height: 3, background: T.gold, margin: "16px auto 0", borderRadius: 2, boxShadow: `0 0 12px ${T.gold}66` }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {features.map(f => <FeatureCard key={f.title} {...f} />)}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section style={{
        margin: "0 48px 80px",
        borderRadius: 20,
        background: `linear-gradient(135deg, ${T.card} 0%, #0D2137 100%)`,
        border: `1px solid ${T.div}`,
        padding: "60px 48px",
        textAlign: "center",
        position: "relative", overflow: "hidden",
        boxShadow: `0 0 80px rgba(245,196,83,0.08)`,
      }}>
        {/* Decorative constellation on banner */}
        <div style={{ position: "absolute", inset: 0, opacity: 0.3 }}>
          <ConstellationCanvas />
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 11, color: T.gold, letterSpacing: 3, fontWeight: 700, marginBottom: 10 }}>REJOIGNEZ LA COMMUNAUTÉ</div>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "clamp(28px, 4vw, 52px)", letterSpacing: "0.06em", color: T.text, marginBottom: 12 }}>
            DEVENEZ L'EXPERT <span style={{ color: T.gold }}>RÉGLEMENTAIRE</span> QUE VOUS MÉRITEZ
          </h2>
          <p style={{ color: T.muted, fontSize: 14, maxWidth: 520, margin: "0 auto 36px", lineHeight: 1.8, fontFamily: "'Lato', sans-serif" }}>
            Rejoignez 2 847 professionnels de 14 pays. Certification reconnue, progression mesurée, réseau panafricain.
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <HeroCTA>Créer un compte gratuit</HeroCTA>
            <PillBtn variant="outline">En savoir plus</PillBtn>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: `1px solid ${T.div}`,
        padding: "32px 48px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexWrap: "wrap", gap: 16,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LogoMark size={28} />
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: 3, color: T.gold }}>REGUL ARENA</div>
        </div>
        <div style={{ fontSize: 11, color: T.muted, letterSpacing: 1 }}>
          © 2026 NDAO DIGITAL · Dakar, Sénégal · <span style={{ color: T.gold }}>contact@regularena.com</span>
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          {["Confidentialité", "CGU", "OAPI"].map(l => (
            <span key={l} style={{ fontSize: 11, color: T.muted, cursor: "pointer", letterSpacing: 1, fontWeight: 700 }}>{l}</span>
          ))}
        </div>
      </footer>
    </div>
  );
}
