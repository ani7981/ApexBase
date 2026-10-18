import React, { useState, useEffect } from "react";
import { Crosshair } from "lucide-react";

export default function FighterJetIntro({ onComplete }) {
  // phase: "title" | "fly" | "fade" | "done"
  const [phase, setPhase] = useState("title");

  useEffect(() => {
    // Stage 1: Keep title & logo on screen for 2.5s
    const t1 = setTimeout(() => {
      setPhase("fly");
    }, 2500);

    // Stage 2: Jet finishes flying across in 0.65s (2500 + 650 = 3150ms), trigger fade
    const t2 = setTimeout(() => {
      setPhase("fade");
    }, 3150);

    // Stage 3: Animation complete at 3550ms (400ms fade)
    const t3 = setTimeout(() => {
      setPhase("done");
      if (onComplete) onComplete();
    }, 3550);

    const handleKeyDown = (e) => {
      if (e.key === "Escape" || e.code === "Space") {
        setPhase("done");
        if (onComplete) onComplete();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onComplete]);

  if (phase === "done") return null;

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden pointer-events-auto neo-grid-bg transition-opacity duration-300 ${
        phase === "fade" ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{
        backgroundColor: "#080911",
      }}
    >
      {/* Skip button in top right (Dark Neobrutalism) */}
      <button
        onClick={() => {
          setPhase("done");
          if (onComplete) onComplete();
        }}
        className="absolute top-5 right-5 z-50 text-xs font-mono font-black uppercase tracking-wider bg-[#ffe600] text-black border-2 border-black px-3.5 py-1.5 shadow-neo-black neo-pressable cursor-pointer transition-all"
      >
        Skip [ESC]
      </button>

      {/* ── STAGE 1: Heading that says ApexBase (DARK NEOBRUTALISM) ──────────────── */}
      <div
        className={`absolute inset-0 flex flex-col items-center justify-center p-4 pointer-events-none transition-all duration-300 ${
          phase === "title"
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 -translate-y-6"
        }`}
      >
        <div className="max-w-xl w-full p-6 sm:p-8 bg-[#121422] border-3 border-black shadow-[8px_8px_0px_#00ff66] text-center space-y-4">
          {/* Logo Emblem */}
          <div className="flex justify-center mb-1">
            <div className="w-14 h-14 bg-[#00ff66] text-black border-3 border-black shadow-[4px_4px_0px_#000000] flex items-center justify-center">
              <Crosshair className="w-8 h-8 stroke-[2.5]" />
            </div>
          </div>

          {/* Top Badges */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="px-3 py-1 bg-[#00ff66] text-black border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0px_#000] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-black animate-ping"></span>
              DEFCON 1 // AIR COMBAT C2
            </span>
            <span className="px-2.5 py-1 bg-[#00e5ff] text-black border-2 border-black font-black uppercase text-xs shadow-[2px_2px_0px_#000]">
              NEO4J BOLT ENGINE
            </span>
          </div>

          {/* Main Title with Chakra Petch font */}
          <h1 className="font-display font-black text-6xl sm:text-8xl tracking-wider uppercase text-white drop-shadow-[4px_4px_0px_#000000]">
            APEX<span className="text-[#00ff66]">BASE</span>
          </h1>

          <p className="font-heading font-bold text-xs sm:text-sm text-slate-300 uppercase tracking-widest">
            TACTICAL SORTIE OPERATIONS & ORDNANCE SYSTEM
          </p>

          {/* Bottom Telemetry Strip */}
          <div className="pt-3 border-t-2 border-black flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono font-bold">
            <span className="px-2 py-0.5 bg-[#1a1c2e] border border-black text-[#00ff66]">
              AIRFRAMES: READY
            </span>
            <span className="px-2 py-0.5 bg-[#1a1c2e] border border-black text-[#ffe600]">
              SQUADRONS: ONLINE
            </span>
            <span className="px-2 py-0.5 bg-[#1a1c2e] border border-black text-[#ff3366]">
              MACH-2 SCRAMBLE
            </span>
          </div>
        </div>
      </div>

      {/* ── STAGE 2: Fighter Jet Takeoff Overlay ────────────── */}
      <div
        className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-300 ${
          phase === "fly" || phase === "fade" ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Jet Wrapper (Straight vertical path, constant speed, full wingspan across screen) */}
        <div
          className={`jet-flying-actor ${phase === "fly" || phase === "fade" ? "animate-jet-launch" : ""}`}
          style={{
            position: "absolute",
            left: "50%",
            top: "100%",
            /* Guaranteed to span full screen width: 108vw on horizontal, max with 130vh on portrait */
            width: "max(108vw, 130vh)",
            maxWidth: "none",
            willChange: "transform",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          {/* Afterburner flame behind the nozzle */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: "-4%",
              transform: "translateX(-50%)",
              pointerEvents: "none",
              zIndex: 0,
            }}
          >
            <div className="ab-outer-flame"></div>
            <div className="ab-inner-flame"></div>
          </div>

          {/* SVG F-16 Top-Down Vector */}
          <div style={{ position: "relative", zIndex: 1, width: "100%" }}>
<svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-200 -345 400 625"
      width="100%"
      height="auto"
      style={{ display: "block", overflow: "visible" }}
      shapeRendering="geometricPrecision"
    >
      <defs>

        {/*  ── FUSELAGE GRADIENT (convex cross-section) ─────────  */}
        <linearGradient id="gFuse" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#30343f"/>
          <stop offset="14%"  stopColor="#52586a"/>
          <stop offset="32%"  stopColor="#7e8694"/>
          <stop offset="50%"  stopColor="#b0b8c6"/>  {/*  spine specular  */}
          <stop offset="68%"  stopColor="#7e8694"/>
          <stop offset="86%"  stopColor="#52586a"/>
          <stop offset="100%" stopColor="#30343f"/>
        </linearGradient>

        {/*  ── LERX GRADIENT ───────────────────────────────────  */}
        <linearGradient id="gLerx" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#40465a"/>
          <stop offset="50%"  stopColor="#636c7e"/>
          <stop offset="100%" stopColor="#353944"/>
        </linearGradient>
        <linearGradient id="gLerxR" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#40465a"/>
          <stop offset="50%"  stopColor="#636c7e"/>
          <stop offset="100%" stopColor="#353944"/>
        </linearGradient>

        {/*  ── WING GRADIENT – left (leading→trailing, sweepwise)  */}
        <linearGradient id="gWingL" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#232830"/>  {/*  leading edge shadow  */}
          <stop offset="10%"  stopColor="#4a5260"/>  {/*  edge bevel  */}
          <stop offset="38%"  stopColor="#6a7280"/>  {/*  upper surface  */}
          <stop offset="65%"  stopColor="#7c8490"/>  {/*  mid-panel lighter  */}
          <stop offset="88%"  stopColor="#585e6a"/>
          <stop offset="100%" stopColor="#2e3240"/>  {/*  trailing shadow  */}
        </linearGradient>
        {/*  ── WING GRADIENT – right ──────────────────────────  */}
        <linearGradient id="gWingR" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#232830"/>
          <stop offset="10%"  stopColor="#4a5260"/>
          <stop offset="38%"  stopColor="#6a7280"/>
          <stop offset="65%"  stopColor="#7c8490"/>
          <stop offset="88%"  stopColor="#585e6a"/>
          <stop offset="100%" stopColor="#2e3240"/>
        </linearGradient>

        {/*  ── WING SPECULAR SHEEN ─────────────────────────────  */}
        <linearGradient id="gWingShL" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"  stopColor="white" stopOpacity="0"/>
          <stop offset="30%" stopColor="white" stopOpacity="0.065"/>
          <stop offset="50%" stopColor="white" stopOpacity="0.11"/>
          <stop offset="70%" stopColor="white" stopOpacity="0.04"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="gWingShR" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"  stopColor="white" stopOpacity="0"/>
          <stop offset="30%" stopColor="white" stopOpacity="0.065"/>
          <stop offset="50%" stopColor="white" stopOpacity="0.11"/>
          <stop offset="70%" stopColor="white" stopOpacity="0.04"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </linearGradient>

        {/*  ── STABILATOR GRADIENT ─────────────────────────────  */}
        <linearGradient id="gStab" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#2c3040"/>
          <stop offset="45%"  stopColor="#5c6270"/>
          <stop offset="100%" stopColor="#22262e"/>
        </linearGradient>
        <linearGradient id="gStabR" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#2c3040"/>
          <stop offset="45%"  stopColor="#5c6270"/>
          <stop offset="100%" stopColor="#22262e"/>
        </linearGradient>

        {/*  ── FUSELAGE SPINE HIGHLIGHT ────────────────────────  */}
        <linearGradient id="gSpine" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="white" stopOpacity="0"/>
          <stop offset="38%"  stopColor="white" stopOpacity="0.10"/>
          <stop offset="50%"  stopColor="white" stopOpacity="0.22"/>
          <stop offset="62%"  stopColor="white" stopOpacity="0.10"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </linearGradient>

        {/*  ── CANOPY ───────────────────────────────────────────  */}
        <radialGradient id="gCanopy" cx="38%" cy="28%" r="68%">
          <stop offset="0%"   stopColor="#d8f0ff" stopOpacity="0.96"/>
          <stop offset="22%"  stopColor="#5cb0e0" stopOpacity="0.85"/>
          <stop offset="60%"  stopColor="#1a5080" stopOpacity="0.88"/>
          <stop offset="100%" stopColor="#061828" stopOpacity="0.96"/>
        </radialGradient>

        {/*  ── INTAKE SHADOW ───────────────────────────────────  */}
        <radialGradient id="gIntake" cx="50%" cy="38%" r="62%">
          <stop offset="0%"   stopColor="#1c2030"/>
          <stop offset="45%"  stopColor="#0c0f18"/>
          <stop offset="100%" stopColor="#040610"/>
        </radialGradient>

        {/*  ── NOZZLE ───────────────────────────────────────────  */}
        <radialGradient id="gNozzle" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#fff4c0"/>
          <stop offset="20%"  stopColor="#ff9030"/>
          <stop offset="50%"  stopColor="#6a1a06"/>
          <stop offset="80%"  stopColor="#280a02"/>
          <stop offset="100%" stopColor="#140501"/>
        </radialGradient>



        {/*  ── RADOME GRADIENT ─────────────────────────────────  */}
        <linearGradient id="gRadome" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#38404e"/>
          <stop offset="50%"  stopColor="#5e6878"/>
          <stop offset="100%" stopColor="#38404e"/>
        </linearGradient>

        {/*  ── Clip paths to keep specular layers inside shapes ─  */}
        <clipPath id="cpWingL">
          <polygon points="-68,-82 -190,68 -181,86 -17,86 -17,58 -37,58"/>
        </clipPath>
        <clipPath id="cpWingR">
          <polygon points="68,-82 190,68 181,86 17,86 17,58 37,58"/>
        </clipPath>

      </defs>

      {/*  ═══════════════════════════════════════════════════════
           LAYER 1 — HORIZONTAL STABILATORS (drawn first, behind)
           ═══════════════════════════════════════════════════════  */}

      {/*  Left stabilator  */}
      <polygon
        points="-20,125  -92,172  -84,204  -16,184"
        fill="url(#gStab)"
      />
      {/*  Leading-edge bevel highlight  */}
      <line x1="-20" y1="125" x2="-92" y2="172"
        stroke="#8090a4" strokeWidth="0.9" opacity="0.45"/>
      {/*  Panel / spar line  */}
      <line x1="-20" y1="125" x2="-16" y2="184"
        stroke="#1e2330" strokeWidth="0.45" opacity="0.75"/>
      {/*  Elevon break line  */}
      <line x1="-92" y1="172" x2="-16" y2="184"
        stroke="#1a1e2a" strokeWidth="0.7" opacity="0.8"/>
      {/*  Elevon surface (slightly darker)  */}
      <polygon
        points="-92,172  -84,204  -16,184  -16,181"
        fill="#2a2e38" opacity="0.45"
      />
      {/*  Tip edge  */}
      <line x1="-92" y1="172" x2="-84" y2="204"
        stroke="#6a7280" strokeWidth="0.8" opacity="0.5"/>

      {/*  Right stabilator  */}
      <polygon
        points="20,125  92,172  84,204  16,184"
        fill="url(#gStabR)"
      />
      <line x1="20" y1="125" x2="92" y2="172"
        stroke="#8090a4" strokeWidth="0.9" opacity="0.45"/>
      <line x1="20" y1="125" x2="16" y2="184"
        stroke="#1e2330" strokeWidth="0.45" opacity="0.75"/>
      <line x1="92" y1="172" x2="16" y2="184"
        stroke="#1a1e2a" strokeWidth="0.7" opacity="0.8"/>
      <polygon
        points="92,172  84,204  16,184  16,181"
        fill="#2a2e38" opacity="0.45"
      />
      <line x1="92" y1="172" x2="84" y2="204"
        stroke="#6a7280" strokeWidth="0.8" opacity="0.5"/>

      {/*  ═══════════════════════════════════════════════════════
           LAYER 2 — MAIN WINGS
           F-16 cropped-delta planform:
             Leading edge root  : (±68, -82)
             Wing tip (LE)      : (±190, 68)
             Wing tip (TE)      : (±181, 86)
             Inboard TE root    : (±17,  86)
             Inboard TE blend   : (±37,  58) — meets LERX/fuse
           ═══════════════════════════════════════════════════════  */}

      {/*  LEFT wing base fill  */}
      <polygon
        points="-68,-82  -190,68  -181,86  -17,86  -17,58  -37,58"
        fill="url(#gWingL)"
      />
      {/*  LEFT wing specular overlay (clipped to wing shape)  */}
      <polygon
        points="-68,-82  -190,68  -181,86  -17,86  -17,58  -37,58"
        fill="url(#gWingShL)"
        clipPath="url(#cpWingL)"
      />
      {/*  Leading-edge bevel highlight (sharp metal edge glint)  */}
      <line x1="-68" y1="-82" x2="-190" y2="68"
        stroke="#90a0b4" strokeWidth="1.1" opacity="0.45" strokeLinecap="round"/>
      {/*  Trailing edge fine line  */}
      <line x1="-181" y1="86" x2="-17" y2="86"
        stroke="#1a1e2a" strokeWidth="0.7" opacity="0.7"/>
      {/*  Wing root / fuselage boundary  */}
      <line x1="-17" y1="58" x2="-37" y2="58"
        stroke="#1a1e2a" strokeWidth="0.6" opacity="0.6"/>
      {/*  Tip edge  */}
      <line x1="-190" y1="68" x2="-181" y2="86"
        stroke="#788090" strokeWidth="0.9" opacity="0.55"/>
      {/*  Spar lines (structural ribs)  */}
      <line x1="-68" y1="-82" x2="-37" y2="58"
        stroke="#22272e" strokeWidth="0.55" opacity="0.80"/>
      <line x1="-105" y1="-40" x2="-80" y2="78"
        stroke="#22272e" strokeWidth="0.45" opacity="0.65"/>
      <line x1="-145" y1="10"  x2="-114" y2="84"
        stroke="#22272e" strokeWidth="0.38" opacity="0.55"/>
      <line x1="-170" y1="45"  x2="-150" y2="85"
        stroke="#22272e" strokeWidth="0.32" opacity="0.50"/>
      {/*  Aileron break line  */}
      <line x1="-155" y1="52" x2="-17" y2="65"
        stroke="#181d26" strokeWidth="0.85" opacity="0.88"/>
      {/*  Aileron surface tint (darker)  */}
      <polygon
        points="-155,52  -181,86  -17,86  -17,65"
        fill="#252a36" opacity="0.38"
      />
      {/*  Outboard wing texture gradient overlay  */}
      <polygon
        points="-68,-82  -190,68  -181,86  -17,86  -17,58  -37,58"
        fill="none" stroke="#1e2330" strokeWidth="0.35"
      />

      {/*  RIGHT wing base fill  */}
      <polygon
        points="68,-82  190,68  181,86  17,86  17,58  37,58"
        fill="url(#gWingR)"
      />
      <polygon
        points="68,-82  190,68  181,86  17,86  17,58  37,58"
        fill="url(#gWingShR)"
        clipPath="url(#cpWingR)"
      />
      <line x1="68" y1="-82" x2="190" y2="68"
        stroke="#90a0b4" strokeWidth="1.1" opacity="0.45" strokeLinecap="round"/>
      <line x1="181" y1="86" x2="17" y2="86"
        stroke="#1a1e2a" strokeWidth="0.7" opacity="0.7"/>
      <line x1="17" y1="58" x2="37" y2="58"
        stroke="#1a1e2a" strokeWidth="0.6" opacity="0.6"/>
      <line x1="190" y1="68" x2="181" y2="86"
        stroke="#788090" strokeWidth="0.9" opacity="0.55"/>
      <line x1="68" y1="-82" x2="37" y2="58"
        stroke="#22272e" strokeWidth="0.55" opacity="0.80"/>
      <line x1="105" y1="-40" x2="80" y2="78"
        stroke="#22272e" strokeWidth="0.45" opacity="0.65"/>
      <line x1="145" y1="10"  x2="114" y2="84"
        stroke="#22272e" strokeWidth="0.38" opacity="0.55"/>
      <line x1="170" y1="45"  x2="150" y2="85"
        stroke="#22272e" strokeWidth="0.32" opacity="0.50"/>
      <line x1="155" y1="52" x2="17" y2="65"
        stroke="#181d26" strokeWidth="0.85" opacity="0.88"/>
      <polygon
        points="155,52  181,86  17,86  17,65"
        fill="#252a36" opacity="0.38"
      />
      <polygon
        points="68,-82  190,68  181,86  17,86  17,58  37,58"
        fill="none" stroke="#1e2330" strokeWidth="0.35"
      />

      {/*  ═══════════════════════════════════════════════════════
           LAYER 3 — WEAPONS / PYLONS
           ═══════════════════════════════════════════════════════  */}

      {/*  Left outboard pylon + AIM-9X Sidewinder  */}
      <g transform="rotate(-52, -155, 48)">
        <rect x="-158" y="28" width="5.5" height="36" rx="1.5"
          fill="#282d38" stroke="#141820" strokeWidth="0.35"/>
        {/*  missile body  */}
        <rect x="-160.5" y="16" width="5" height="42" rx="2.5"
          fill="#22262e" stroke="#12161e" strokeWidth="0.35"/>
        {/*  nose cone  */}
        <ellipse cx="-158" cy="16" rx="2.5" ry="3" fill="#1a1e28"/>
        {/*  tail fins  */}
        <polygon points="-162,50 -155,50 -155,54 -165,57" fill="#1e2230"/>
        <polygon points="-154,50 -161,50 -161,54 -151,57" fill="#1e2230"/>
        {/*  seeker head  */}
        <circle cx="-158" cy="15" r="2" fill="#2a3048" stroke="#0e1220" strokeWidth="0.3"/>
      </g>

      {/*  Left inboard pylon + AIM-120 AMRAAM  */}
      <g transform="rotate(-52, -100, 20)">
        <rect x="-103" y="2" width="5.5" height="40" rx="1.5"
          fill="#282d38" stroke="#141820" strokeWidth="0.35"/>
        <rect x="-105.5" y="-12" width="5" height="55" rx="2.5"
          fill="#22262e" stroke="#12161e" strokeWidth="0.35"/>
        <ellipse cx="-103" cy="-12" rx="2.5" ry="4" fill="#1a1e28"/>
        {/*  AMRAAM fins  */}
        <polygon points="-107,28 -100,28 -100,33 -110,36" fill="#1e2230"/>
        <polygon points="-99,28 -106,28 -106,33 -96,36" fill="#1e2230"/>
      </g>

      {/*  Right outboard pylon + AIM-9X  */}
      <g transform="rotate(52, 155, 48)">
        <rect x="152" y="28" width="5.5" height="36" rx="1.5"
          fill="#282d38" stroke="#141820" strokeWidth="0.35"/>
        <rect x="155.5" y="16" width="5" height="42" rx="2.5"
          fill="#22262e" stroke="#12161e" strokeWidth="0.35"/>
        <ellipse cx="158" cy="16" rx="2.5" ry="3" fill="#1a1e28"/>
        <polygon points="162,50 155,50 155,54 165,57" fill="#1e2230"/>
        <polygon points="154,50 161,50 161,54 151,57" fill="#1e2230"/>
        <circle cx="158" cy="15" r="2" fill="#2a3048" stroke="#0e1220" strokeWidth="0.3"/>
      </g>

      {/*  Right inboard pylon + AIM-120  */}
      <g transform="rotate(52, 100, 20)">
        <rect x="97" y="2" width="5.5" height="40" rx="1.5"
          fill="#282d38" stroke="#141820" strokeWidth="0.35"/>
        <rect x="100.5" y="-12" width="5" height="55" rx="2.5"
          fill="#22262e" stroke="#12161e" strokeWidth="0.35"/>
        <ellipse cx="103" cy="-12" rx="2.5" ry="4" fill="#1a1e28"/>
        <polygon points="107,28 100,28 100,33 110,36" fill="#1e2230"/>
        <polygon points="99,28 106,28 106,33 96,36" fill="#1e2230"/>
      </g>

      {/*  ═══════════════════════════════════════════════════════
           LAYER 4 — MAIN FUSELAGE
           Smooth bezier curves — blended-wing-body F-16 shape
           ═══════════════════════════════════════════════════════  */}
      <path
        id="fuselage"
        d="
          M 0,-338
          C 3,-322  7,-300  8,-278
          C 10,-255  10,-236  10,-216
          C 11,-196  13,-178  16,-160
          C 20,-138  28,-115  34,-92
          C 40,-70   42,-46   41,-22
          C 40,4     36,30    29,58
          C 23,86    19,114   16,142
          C 13,168   10,196   7,222
          C 5,238    2,252    0,262
          C -2,252  -5,238  -7,222
          C -10,196 -13,168 -16,142
          C -19,114 -23,86  -29,58
          C -36,30  -40,4   -41,-22
          C -42,-46 -40,-70 -34,-92
          C -28,-115 -20,-138 -16,-160
          C -13,-178 -11,-196 -10,-216
          C -10,-236 -10,-255 -8,-278
          C -7,-300  -3,-322  0,-338
          Z
        "
        fill="url(#gFuse)"
        stroke="#18191f" strokeWidth="0.4"
      />

      {/*  Spine highlight overlay (re-draws on top of texture)  */}
      <path
        d="
          M 0,-338
          C 3,-322  7,-300  8,-278
          C 10,-255  10,-236  10,-216
          C 11,-196  13,-178  16,-160
          C 20,-138  28,-115  34,-92
          C 40,-70   42,-46   41,-22
          C 40,4     36,30    29,58
          C 23,86    19,114   16,142
          C 13,168   10,196   7,222
          C 5,238    2,252    0,262
          C -2,252  -5,238  -7,222
          C -10,196 -13,168 -16,142
          C -19,114 -23,86  -29,58
          C -36,30  -40,4   -41,-22
          C -42,-46 -40,-70 -34,-92
          C -28,-115 -20,-138 -16,-160
          C -13,-178 -11,-196 -10,-216
          C -10,-236 -10,-255 -8,-278
          C -7,-300  -3,-322  0,-338
          Z
        "
        fill="url(#gSpine)"
        pointer-events="none"
      />

      {/*  ═══════════════════════════════════════════════════════
           LAYER 5 — LERX (Leading-Edge Root Extensions)
           Distinctive triangular strakes ahead of the main wing.
           Left apex at fuselage (~-13,-196), sweeps to wing root
           ═══════════════════════════════════════════════════════  */}

      {/*  LEFT LERX  */}
      <path
        d="M -13,-196  L -68,-82  L -37,58  L -17,58  L -17,-154  Z"
        fill="#545c6e"
        stroke="#1a1e28" strokeWidth="0.35"
      />
      {/*  LERX shading overlay  */}
      <path
        d="M -13,-196  L -68,-82  L -37,58  L -17,58  L -17,-154  Z"
        fill="url(#gLerx)" opacity="0.55"
      />
      {/*  LERX leading-edge glint  */}
      <line x1="-13" y1="-196" x2="-68" y2="-82"
        stroke="#98a8be" strokeWidth="1.0" opacity="0.52"/>
      {/*  LERX / fuselage boundary  */}
      <line x1="-13" y1="-196" x2="-17" y2="-154"
        stroke="#22262e" strokeWidth="0.45" opacity="0.7"/>
      {/*  Vortex generator ridge on LERX  */}
      <line x1="-25" y1="-165" x2="-50" y2="-50"
        stroke="#2e3340" strokeWidth="0.35" opacity="0.5"/>

      {/*  RIGHT LERX  */}
      <path
        d="M 13,-196  L 68,-82  L 37,58  L 17,58  L 17,-154  Z"
        fill="#545c6e"
        stroke="#1a1e28" strokeWidth="0.35"
      />
      <path
        d="M 13,-196  L 68,-82  L 37,58  L 17,58  L 17,-154  Z"
        fill="url(#gLerxR)" opacity="0.55"
      />
      <line x1="13" y1="-196" x2="68" y2="-82"
        stroke="#98a8be" strokeWidth="1.0" opacity="0.52"/>
      <line x1="13" y1="-196" x2="17" y2="-154"
        stroke="#22262e" strokeWidth="0.45" opacity="0.7"/>
      <line x1="25" y1="-165" x2="50" y2="-50"
        stroke="#2e3340" strokeWidth="0.35" opacity="0.5"/>

      {/*  ═══════════════════════════════════════════════════════
           LAYER 6 — FUSELAGE SURFACE DETAIL
           ═══════════════════════════════════════════════════════  */}

      {/*  Centreline spine seam (faint dashed)  */}
      <line x1="0" y1="-338" x2="0" y2="262"
        stroke="#2a2f3c" strokeWidth="0.38" opacity="0.45"
        strokeDasharray="9,7"/>

      {/*  Forward avionics bay seam lines  */}
      <line x1="-8" y1="-272" x2="8" y2="-272"
        stroke="#18202c" strokeWidth="0.65" opacity="0.75"/>
      <line x1="-9" y1="-248" x2="9" y2="-248"
        stroke="#18202c" strokeWidth="0.55" opacity="0.65"/>

      {/*  Canopy tub forward edge  */}
      <line x1="-9" y1="-228" x2="9" y2="-228"
        stroke="#18202c" strokeWidth="0.55" opacity="0.60"/>

      {/*  Wing-root blending seams  */}
      <line x1="-17" y1="-154" x2="-37" y2="58"
        stroke="#1c2030" strokeWidth="0.5" opacity="0.6"/>
      <line x1="17" y1="-154" x2="37" y2="58"
        stroke="#1c2030" strokeWidth="0.5" opacity="0.6"/>

      {/*  Mid-fuselage panel boundary  */}
      <line x1="-14" y1="-90" x2="14" y2="-90"
        stroke="#18202c" strokeWidth="0.6" opacity="0.65"/>

      {/*  Aft fuselage panel boundary  */}
      <line x1="-11" y1="112" x2="11" y2="112"
        stroke="#18202c" strokeWidth="0.55" opacity="0.55"/>

      {/*  M61 Vulcan gun port area (left forward fuselage)  */}
      <rect x="-16" y="-180" width="6" height="18" rx="1.2"
        fill="#242830" stroke="#10141c" strokeWidth="0.35"/>
      <circle cx="-13" cy="-171" r="2" fill="#1a1e28"/>
      <circle cx="-13" cy="-171" r="0.9" fill="#0e1018"/>

      {/*  Access hatches  */}
      <rect x="-8" y="-110" width="5.5" height="20" rx="1"
        fill="none" stroke="#18202c" strokeWidth="0.55"/>
      <rect x="2.5" y="-110" width="5.5" height="20" rx="1"
        fill="none" stroke="#18202c" strokeWidth="0.55"/>
      <rect x="-8" y="22" width="5.5" height="20" rx="1"
        fill="none" stroke="#18202c" strokeWidth="0.55"/>
      <rect x="2.5" y="22" width="5.5" height="20" rx="1"
        fill="none" stroke="#18202c" strokeWidth="0.55"/>
      {/*  Fastener bolts on hatch corners  */}
      <g fill="#14181e" opacity="0.8">
        <circle cx="-7.5" cy="-109.5" r="0.7"/>
        <circle cx="-3"   cy="-109.5" r="0.7"/>
        <circle cx="-7.5" cy="-90.5"  r="0.7"/>
        <circle cx="-3"   cy="-90.5"  r="0.7"/>
        <circle cx="3"    cy="-109.5" r="0.7"/>
        <circle cx="7.5"  cy="-109.5" r="0.7"/>
        <circle cx="3"    cy="-90.5"  r="0.7"/>
        <circle cx="7.5"  cy="-90.5"  r="0.7"/>
      </g>

      {/*  Chin intake (from top: dark oval below nose)  */}
      <ellipse cx="0" cy="-148" rx="17" ry="12"
        fill="url(#gIntake)" stroke="#181c26" strokeWidth="0.7"/>
      {/*  Intake lip highlight  */}
      <ellipse cx="0" cy="-149" rx="17" ry="12"
        fill="none" stroke="#586878" strokeWidth="0.65" opacity="0.4"/>
      {/*  Intake throat (deeper)  */}
      <ellipse cx="0" cy="-148" rx="11.5" ry="8"
        fill="#080c14" stroke="#0e1220" strokeWidth="0.35"/>
      <ellipse cx="0" cy="-148" rx="7" ry="5"
        fill="#040810"/>
      {/*  Intake splitter plate lines  */}
      <line x1="-17" y1="-152" x2="-17" y2="-144"
        stroke="#2a3040" strokeWidth="0.5"/>
      <line x1="17"  y1="-152" x2="17"  y2="-144"
        stroke="#2a3040" strokeWidth="0.5"/>

      {/*  Ventral strake hints (left + right sides of aft fuse)  */}
      <path d="M -14,48 C -22,70 -22,100 -18,118 L -14,115 C -17,98 -18,70 -11,50 Z"
        fill="#3c4250" stroke="#1a1e28" strokeWidth="0.3" opacity="0.7"/>
      <path d="M 14,48 C 22,70 22,100 18,118 L 14,115 C 17,98 18,70 11,50 Z"
        fill="#3c4250" stroke="#1a1e28" strokeWidth="0.3" opacity="0.7"/>

      {/*  Fuselage rivet rows  */}
      <g fill="#16191e" opacity="0.65">
        {/*  Left fuselage line  */}
        <circle cx="-6"  cy="-272" r="0.65"/><circle cx="-7"  cy="-255" r="0.65"/>
        <circle cx="-8"  cy="-236" r="0.65"/><circle cx="-8"  cy="-216" r="0.65"/>
        <circle cx="-9"  cy="-196" r="0.65"/><circle cx="-11" cy="-175" r="0.65"/>
        <circle cx="-12" cy="-155" r="0.65"/><circle cx="-14" cy="-130" r="0.65"/>
        <circle cx="-16" cy="-110" r="0.65"/><circle cx="-18" cy="-88"  r="0.65"/>
        <circle cx="-19" cy="-65"  r="0.65"/><circle cx="-19" cy="-42"  r="0.65"/>
        <circle cx="-18" cy="-18"  r="0.65"/><circle cx="-17" cy="8"    r="0.65"/>
        <circle cx="-16" cy="34"   r="0.65"/><circle cx="-14" cy="60"   r="0.65"/>
        <circle cx="-12" cy="85"   r="0.65"/><circle cx="-11" cy="112"  r="0.65"/>
        <circle cx="-9"  cy="138"  r="0.65"/>
        {/*  Right fuselage line (mirror)  */}
        <circle cx="6"   cy="-272" r="0.65"/><circle cx="7"   cy="-255" r="0.65"/>
        <circle cx="8"   cy="-236" r="0.65"/><circle cx="8"   cy="-216" r="0.65"/>
        <circle cx="9"   cy="-196" r="0.65"/><circle cx="11"  cy="-175" r="0.65"/>
        <circle cx="12"  cy="-155" r="0.65"/><circle cx="14"  cy="-130" r="0.65"/>
        <circle cx="16"  cy="-110" r="0.65"/><circle cx="18"  cy="-88"  r="0.65"/>
        <circle cx="19"  cy="-65"  r="0.65"/><circle cx="19"  cy="-42"  r="0.65"/>
        <circle cx="18"  cy="-18"  r="0.65"/><circle cx="17"  cy="8"    r="0.65"/>
        <circle cx="16"  cy="34"   r="0.65"/><circle cx="14"  cy="60"   r="0.65"/>
        <circle cx="12"  cy="85"   r="0.65"/><circle cx="11"  cy="112"  r="0.65"/>
        <circle cx="9"   cy="138"  r="0.65"/>
        {/*  Wing rivet rows (L)  */}
        <circle cx="-45" cy="-55" r="0.65"/><circle cx="-70"  cy="-28" r="0.65"/>
        <circle cx="-98" cy="2"   r="0.65"/><circle cx="-125" cy="30"  r="0.65"/>
        <circle cx="-152" cy="55" r="0.65"/><circle cx="-168" cy="68"  r="0.65"/>
        {/*  Wing rivet rows (R)  */}
        <circle cx="45"  cy="-55" r="0.65"/><circle cx="70"   cy="-28" r="0.65"/>
        <circle cx="98"  cy="2"   r="0.65"/><circle cx="125"  cy="30"  r="0.65"/>
        <circle cx="152" cy="55"  r="0.65"/><circle cx="168"  cy="68"  r="0.65"/>
      </g>

      {/*  ═══════════════════════════════════════════════════════
           LAYER 7 — VERTICAL FIN (narrow raised strip)
           From top the fin appears as a slightly thicker, raised
           section along the aft fuselage spine.
           ═══════════════════════════════════════════════════════  */}
      <path
        d="M -4.5,72 C -5.5,90 -6,118 -5.5,162 L -2.5,182 L 2.5,182 L 5.5,162
           C 6,118 5.5,90 4.5,72 Z"
        fill="#4e5568"
        stroke="#18202c" strokeWidth="0.35"
      />
      {/*  Fin centerline  */}
      <line x1="0" y1="72" x2="0" y2="168"
        stroke="#9098a8" strokeWidth="0.45" opacity="0.35"/>
      {/*  Fin leading-edge glint  */}
      <line x1="-4.5" y1="72" x2="-5.5" y2="162"
        stroke="#8090a0" strokeWidth="0.5" opacity="0.4"/>

      {/*  ═══════════════════════════════════════════════════════
           LAYER 8 — CANOPY (distinctive F-16 bubble)
           ═══════════════════════════════════════════════════════  */}
      {/*  Canopy tub/frame  */}
      <ellipse cx="0" cy="-212" rx="10" ry="24"
        fill="#20262e" stroke="#14181e" strokeWidth="0.6"/>
      {/*  Bubble canopy glass (one-piece, no aft frame)  */}
      <ellipse cx="0" cy="-212" rx="8.5" ry="22"
        fill="url(#gCanopy)"/>
      {/*  HUD (Heads-Up Display) combiner glass forward  */}
      <rect x="-5" y="-232" width="10" height="8" rx="2"
        fill="none" stroke="#3a6080" strokeWidth="0.6" opacity="0.55"/>
      {/*  Forward canopy frame  */}
      <ellipse cx="0" cy="-226" rx="7.5" ry="7"
        fill="none" stroke="#2a3848" strokeWidth="0.8" opacity="0.55"/>
      {/*  Main canopy highlight (specular bubble)  */}
      <ellipse cx="-2.5" cy="-220" rx="3.5" ry="7"
        fill="white" opacity="0.15"/>
      <ellipse cx="2.5" cy="-208" rx="2" ry="4.5"
        fill="white" opacity="0.06"/>
      {/*  Canopy aft rail  */}
      <line x1="-9.5" y1="-190" x2="9.5" y2="-190"
        stroke="#2a3040" strokeWidth="0.8" opacity="0.55"/>
      {/*  Ejection seat headrest hint  */}
      <rect x="-3" y="-210" width="6" height="8" rx="1.5"
        fill="#1a2030" stroke="#0e1420" strokeWidth="0.35" opacity="0.7"/>

      {/*  ═══════════════════════════════════════════════════════
           LAYER 9 — RADOME + NOSE PROBES
           ═══════════════════════════════════════════════════════  */}
      {/*  Radome (slightly different shade, fibreglass)  */}
      <path
        d="M 0,-338 C 2,-328 5,-312 6,-292 L 3,-278 L -3,-278 L -6,-292
           C -5,-312 -2,-328 0,-338 Z"
        fill="url(#gRadome)"
        stroke="#18202c" strokeWidth="0.35"
      />
      {/*  Radome seam  */}
      <line x1="0" y1="-338" x2="0" y2="-278"
        stroke="#30384a" strokeWidth="0.38" opacity="0.55"/>
      {/*  Pitot probe  */}
      <line x1="0" y1="-345" x2="0" y2="-336"
        stroke="#a0aab8" strokeWidth="1.9" strokeLinecap="round"/>
      {/*  Angle-of-Attack (AoA) vane — left  */}
      <line x1="-9"  y1="-318" x2="-22" y2="-323" stroke="#6a7888" strokeWidth="0.8" strokeLinecap="round"/>
      <line x1="-22" y1="-323" x2="-24" y2="-317" stroke="#5a6878" strokeWidth="0.7"/>
      {/*  Angle-of-Attack (AoA) vane — right  */}
      <line x1="9"   y1="-318" x2="22"  y2="-323" stroke="#6a7888" strokeWidth="0.8" strokeLinecap="round"/>
      <line x1="22"  y1="-323" x2="24"  y2="-317" stroke="#5a6878" strokeWidth="0.7"/>
      {/*  FLIR/avionics fairing below nose on left cheek  */}
      <ellipse cx="-14" cy="-295" rx="4" ry="6" fill="#323844" stroke="#14181e" strokeWidth="0.4"/>

      {/*  ═══════════════════════════════════════════════════════
           LAYER 10 — ENGINE NOZZLE
           F100/F110 variable-geometry convergent-divergent nozzle
           ═══════════════════════════════════════════════════════  */}
      {/*  Rear fuselage nozzle shroud ring  */}
      <ellipse cx="0" cy="254" rx="14" ry="14"
        fill="#1a1c24" stroke="#10141c" strokeWidth="0.6"/>
      {/*  Nozzle base (hot section visible from rear)  */}
      <ellipse cx="0" cy="254" rx="13" ry="13"
        fill="url(#gNozzle)"/>
      {/*  Variable nozzle petals (12 petals)  */}
      <g stroke="#200a02" strokeWidth="0.42" opacity="0.85">
        <line x1="0" y1="241" x2="0"   y2="267"/>
        <line x1="0" y1="241" x2="6.5" y2="265" transform="rotate(30,0,254)"/>
        <line x1="0" y1="241" x2="6.5" y2="265" transform="rotate(60,0,254)"/>
        <line x1="0" y1="241" x2="6.5" y2="265" transform="rotate(90,0,254)"/>
        <line x1="0" y1="241" x2="6.5" y2="265" transform="rotate(120,0,254)"/>
        <line x1="0" y1="241" x2="6.5" y2="265" transform="rotate(150,0,254)"/>
        <line x1="0" y1="241" x2="6.5" y2="265" transform="rotate(180,0,254)"/>
        <line x1="0" y1="241" x2="6.5" y2="265" transform="rotate(210,0,254)"/>
        <line x1="0" y1="241" x2="6.5" y2="265" transform="rotate(240,0,254)"/>
        <line x1="0" y1="241" x2="6.5" y2="265" transform="rotate(270,0,254)"/>
        <line x1="0" y1="241" x2="6.5" y2="265" transform="rotate(300,0,254)"/>
        <line x1="0" y1="241" x2="6.5" y2="265" transform="rotate(330,0,254)"/>
      </g>
      {/*  Inner glow layers  */}
      <ellipse cx="0" cy="254" rx="7.5" ry="7.5" fill="#e05010" opacity="0.8"/>
      <ellipse cx="0" cy="254" rx="4.5" ry="4.5" fill="#ffb040" opacity="0.9"/>
      <ellipse cx="0" cy="254" rx="2.2" ry="2.2" fill="#fff8d0" opacity="0.9"/>

      {/*  ═══════════════════════════════════════════════════════
           LAYER 11 — NATIONAL INSIGNIA (USAF)
           ═══════════════════════════════════════════════════════  */}
      {/*  Left wing — rotated to align with wing surface  */}
      <g transform="translate(-128, 20) rotate(-52)">
        <circle r="10"  fill="#12285a"/>
        <circle r="8"   fill="#f0f0f0"/>
        <circle r="6.5" fill="#b01828"/>
        <circle r="4"   fill="#f0f0f0"/>
        <circle r="2.2" fill="#12285a"/>
        {/*  Wing bars (USAF style)  */}
        <rect x="7.5" y="-1.5" width="7" height="3" rx="0.5" fill="#f0f0f0"/>
        <rect x="-14.5" y="-1.5" width="7" height="3" rx="0.5" fill="#f0f0f0"/>
      </g>
      {/*  Right wing  */}
      <g transform="translate(128, 20) rotate(52)">
        <circle r="10"  fill="#12285a"/>
        <circle r="8"   fill="#f0f0f0"/>
        <circle r="6.5" fill="#b01828"/>
        <circle r="4"   fill="#f0f0f0"/>
        <circle r="2.2" fill="#12285a"/>
        <rect x="7.5" y="-1.5" width="7" height="3" rx="0.5" fill="#f0f0f0"/>
        <rect x="-14.5" y="-1.5" width="7" height="3" rx="0.5" fill="#f0f0f0"/>
      </g>

      {/*  ═══════════════════════════════════════════════════════
           LAYER 12 — NAVIGATION LIGHTS
           ═══════════════════════════════════════════════════════  */}
      {/*  Nose anti-collision beacon (red, blinking)  */}
      <circle cx="0" cy="-338" r="2.2" fill="#ff2020">
        <animate attributeName="opacity" values="0.9;0.1;0.9" dur="0.9s" repeatCount="indefinite"/>
      </circle>
      {/*  Left wingtip position light (red)  */}
      <circle cx="-190" cy="68" r="2.8" fill="#ff1818" opacity="0.9">
        <animate attributeName="opacity" values="0.95;0.15;0.95" dur="0.9s"
          repeatCount="indefinite" begin="0.08s"/>
      </circle>
      {/*  Right wingtip position light (green)  */}
      <circle cx="190" cy="68" r="2.8" fill="#18d838" opacity="0.9">
        <animate attributeName="opacity" values="0.95;0.15;0.95" dur="0.9s"
          repeatCount="indefinite" begin="0.08s"/>
      </circle>
      {/*  Tail strobe (white, rear fuse)  */}
      <circle cx="0" cy="175" r="1.5" fill="#ffffff" opacity="0.7">
        <animate attributeName="opacity" values="0.7;0.05;0.7" dur="1.4s"
          repeatCount="indefinite" begin="0.45s"/>
      </circle>

    </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
