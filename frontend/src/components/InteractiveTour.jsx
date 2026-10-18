import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ChevronRight, ChevronLeft, X, Sparkles, Compass, 
  Check, CornerDownRight
} from 'lucide-react';

/**
 * InteractiveTour Component
 * Features:
 * - Dynamic spotlight box with seamless backdrop mask
 * - Click shield to prevent accidental underlying button clicks (e.g. Seed Demo / Reset DB)
 * - Always scrolls to the top of new tab pages (never to the bottom!)
 * - Smart popover dialog positioning keeping content visible under sticky headers
 * - Animated HUD reticle corners on highlighted elements
 * - Step progress indicator, keyboard controls (Left/Right/Esc), and tab auto-switching
 */
export default function InteractiveTour({
  isOpen,
  steps = [],
  currentStep = 0,
  onStepChange,
  onClose,
  onTabChange,
  isNeo = true
}) {
  const [targetRect, setTargetRect] = useState(null);
  const [popoverPos, setPopoverPos] = useState({ top: 140, left: 20, placement: 'bottom' });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const popoverRef = useRef(null);

  const step = steps[currentStep] || null;

  // Locate the target element and measure its bounding box
  const updateTargetPosition = useCallback(() => {
    if (!isOpen || !step) return;

    const el = document.querySelector(step.target);
    if (!el) {
      // Fallback: if element is not found, center the dialog cleanly below the header
      setTargetRect(null);
      setPopoverPos({
        top: Math.max(140, window.innerHeight / 2 - 140),
        left: Math.max(16, window.innerWidth / 2 - 230),
        placement: 'center'
      });
      return;
    }

    const rect = el.getBoundingClientRect();
    const padding = 6;
    const computedRect = {
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
      rawTop: rect.top,
      rawBottom: rect.bottom,
      rawLeft: rect.left,
      rawRight: rect.right
    };
    setTargetRect(computedRect);

    // Calculate smart dialogue popover placement
    const popoverWidth = Math.min(460, window.innerWidth - 32);
    const popoverHeight = 240; // estimated card height
    const gap = 14;
    const stickyHeaderHeight = 135; // sticky header + telemetry HUD
    let top = 0;
    let left = 0;
    let placement = step.placement || 'bottom';

    // If target is very tall (e.g. form or panel), cap effective height for positioning
    const effectiveHeight = Math.min(computedRect.height, 280);

    // Auto-detect best placement
    const spaceBelow = window.innerHeight - (computedRect.top + effectiveHeight);
    const spaceAbove = computedRect.rawTop - stickyHeaderHeight;
    const spaceRight = window.innerWidth - computedRect.rawRight;
    const spaceLeft = computedRect.rawLeft;

    if (placement === 'bottom' && spaceBelow < 220 && spaceAbove > 200) {
      placement = 'top';
    } else if (placement === 'right' && spaceRight < popoverWidth + gap) {
      placement = 'bottom';
    } else if (placement === 'left' && spaceLeft < popoverWidth + gap) {
      placement = 'bottom';
    }

    if (placement === 'bottom') {
      top = computedRect.top + effectiveHeight + gap;
      left = computedRect.left + (computedRect.width / 2) - (popoverWidth / 2);
    } else if (placement === 'top') {
      top = computedRect.top - popoverHeight - gap;
      left = computedRect.left + (computedRect.width / 2) - (popoverWidth / 2);
    } else if (placement === 'right') {
      top = Math.max(stickyHeaderHeight + 10, computedRect.top);
      left = computedRect.left + computedRect.width + gap;
    } else if (placement === 'left') {
      top = Math.max(stickyHeaderHeight + 10, computedRect.top);
      left = computedRect.left - popoverWidth - gap;
    }

    // Viewport Boundary Clamping
    left = Math.max(16, Math.min(left, window.innerWidth - popoverWidth - 16));
    top = Math.max(stickyHeaderHeight + 10, Math.min(top, window.innerHeight - popoverHeight - 16));

    setPopoverPos({ top, left, placement });
  }, [isOpen, step]);

  // When step changes, handle tab switching, scroll, and positioning
  useEffect(() => {
    if (!isOpen || !step) return;

    setIsTransitioning(true);

    // If step requires a specific tab, switch tab and reset window scroll immediately
    if (step.tab && onTabChange) {
      onTabChange(step.tab);
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    // Allow the DOM to settle, then scroll to target element with sticky-header offset
    const timer = setTimeout(() => {
      const el = document.querySelector(step.target);
      if (el) {
        const headerOffset = 130;
        const elRect = el.getBoundingClientRect();
        const absoluteTop = elRect.top + window.pageYOffset;
        const desiredScrollTop = Math.max(0, absoluteTop - headerOffset);
        
        window.scrollTo({
          top: desiredScrollTop,
          behavior: 'smooth'
        });
      }

      // Re-measure after smooth scroll completes
      const measureTimer = setTimeout(() => {
        updateTargetPosition();
        setIsTransitioning(false);
      }, 300);

      return () => clearTimeout(measureTimer);
    }, 120);

    return () => clearTimeout(timer);
  }, [isOpen, currentStep, step, onTabChange, updateTargetPosition]);

  // Listen to window scroll & resize to keep spotlight locked onto element
  useEffect(() => {
    if (!isOpen) return;

    let rafId;
    const handleScrollOrResize = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateTargetPosition);
    };

    window.addEventListener('resize', handleScrollOrResize, { passive: true });
    window.addEventListener('scroll', handleScrollOrResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize);
      cancelAnimationFrame(rafId);
    };
  }, [isOpen, updateTargetPosition]);

  // Keyboard navigation: ArrowRight / ArrowLeft / Esc
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        if (currentStep < steps.length - 1) {
          onStepChange(currentStep + 1);
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (currentStep > 0) {
          onStepChange(currentStep - 1);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep, steps.length, onStepChange, onClose]);

  if (!isOpen || !step) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 pointer-events-auto select-none overflow-hidden font-mono">
      {/* Dynamic Dark Backdrop Mask with Spotlight Box Shadow */}
      {targetRect ? (
        <div 
          className="fixed transition-all duration-300 ease-out"
          style={{
            top: `${Math.round(targetRect.top)}px`,
            left: `${Math.round(targetRect.left)}px`,
            width: `${Math.round(targetRect.width)}px`,
            height: `${Math.round(targetRect.height)}px`,
            boxShadow: '0 0 0 9999px rgba(3, 7, 18, 0.82)',
            borderRadius: '6px',
            zIndex: 51
          }}
        >
          {/* Transparent click shield over the spotlight to prevent accidental clicks on buttons underneath */}
          <div 
            className="absolute inset-0 pointer-events-auto cursor-default z-10"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          />

          {/* Tactical Target Reticle Framing */}
          <div className="relative w-full h-full pointer-events-none">
            {/* Outer pulsating neon border */}
            <div className={`absolute inset-0 rounded border-2 animate-pulse ${
              isNeo ? 'border-[#00ff66] shadow-[0_0_15px_rgba(0,255,102,0.6)]' : 'border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]'
            }`} />

            {/* Tactical HUD Corner Reticles */}
            <span className="absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2 border-white pointer-events-none" />
            <span className="absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2 border-white pointer-events-none" />
            <span className="absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2 border-white pointer-events-none" />
            <span className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2 border-white pointer-events-none" />

            {/* Target Label Pin */}
            <div className={`absolute -top-6 left-0 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${
              isNeo ? 'bg-[#00ff66] text-black shadow-[2px_2px_0px_#000]' : 'bg-emerald-500 text-black rounded'
            }`}>
              <CornerDownRight className="w-2.5 h-2.5 stroke-[3]" /> TARGET ACQUIRED
            </div>
          </div>
        </div>
      ) : (
        /* Fullscreen dark overlay if target isn't mapped */
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm pointer-events-none z-50" />
      )}

      {/* Floating Dialogue Box */}
      <div
        ref={popoverRef}
        style={{
          top: `${Math.round(popoverPos.top)}px`,
          left: `${Math.round(popoverPos.left)}px`,
          width: `${Math.min(460, window.innerWidth - 32)}px`,
          zIndex: 60
        }}
        className={`fixed transition-all duration-300 ease-out pointer-events-auto ${
          isNeo 
            ? 'bg-[#151726] border-3 border-black shadow-[6px_6px_0px_#00ff66]' 
            : 'bg-[#0d1424] border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-md'
        } ${isTransitioning ? 'opacity-90 scale-[0.98]' : 'opacity-100 scale-100'}`}
      >
        {/* Dialogue Card Top Bar */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${
          isNeo ? 'border-black bg-[#1b1e32]' : 'border-slate-800 bg-[#090d17] rounded-t-xl'
        }`}>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 flex items-center gap-1 ${
              isNeo ? 'bg-[#00e5ff] text-black' : 'bg-cyan-500/20 text-cyan-400 rounded'
            }`}>
              <Compass className="w-3 h-3" />
              {step.subtitle || `MISSION TOUR // STEP ${currentStep + 1} OF ${steps.length}`}
            </span>
            <span className="text-[10px] font-bold text-slate-400 hidden sm:inline">
              [{currentStep + 1}/{steps.length}]
            </span>
          </div>

          <button
            onClick={onClose}
            title="Exit Tour (Esc)"
            className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dialogue Card Body */}
        <div className="p-4 sm:p-5 space-y-3 text-xs">
          {/* Step Title */}
          <div>
            <h3 className="text-base font-black text-white tracking-wide flex items-center gap-2">
              {step.title}
            </h3>
          </div>

          {/* Description Content */}
          <div className="text-slate-300 leading-relaxed font-sans text-xs sm:text-[13px] space-y-2">
            {typeof step.content === 'string' ? (
              <p>{step.content}</p>
            ) : (
              step.content
            )}
          </div>

          {/* Optional Tactical Pro-Tip */}
          {step.tip && (
            <div className={`p-2.5 text-[11px] font-mono leading-tight flex items-start gap-2 ${
              isNeo 
                ? 'bg-black/60 border border-[#ffe600]/40 text-[#ffe600]' 
                : 'bg-amber-950/30 border border-amber-500/30 text-amber-300 rounded'
            }`}>
              <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-inherit" />
              <div>
                <strong className="uppercase font-black mr-1">Tactical Tip:</strong>
                {step.tip}
              </div>
            </div>
          )}
        </div>

        {/* Dialogue Card Footer Navigation */}
        <div className={`flex items-center justify-between px-4 py-3 border-t ${
          isNeo ? 'border-black bg-[#10121f]' : 'border-slate-800/80 bg-[#070a12] rounded-b-xl'
        }`}>
          {/* Progress Pips & Skip */}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="text-[11px] font-bold text-slate-400 hover:text-slate-200 uppercase cursor-pointer underline-offset-2 hover:underline"
            >
              Skip
            </button>

            {/* Clickable Step Pips */}
            <div className="hidden sm:flex items-center gap-1">
              {steps.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => onStepChange(idx)}
                  title={`Jump to step ${idx + 1}`}
                  className={`h-2 transition-all cursor-pointer ${
                    currentStep === idx 
                      ? (isNeo ? 'w-5 bg-[#00ff66]' : 'w-4 bg-emerald-400 rounded') 
                      : 'w-2 bg-slate-700 hover:bg-slate-500 rounded-full'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Nav Buttons */}
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                onClick={() => onStepChange(currentStep - 1)}
                className={`px-3 py-1.5 text-xs font-black uppercase flex items-center gap-1 cursor-pointer transition-transform ${
                  isNeo 
                    ? 'bg-[#222538] text-slate-200 border border-black neo-pressable' 
                    : 'text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded border border-slate-700'
                }`}
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}

            {!isLast ? (
              <button
                onClick={() => onStepChange(currentStep + 1)}
                className={`px-4 py-1.5 text-xs font-black uppercase flex items-center gap-1 cursor-pointer transition-transform ${
                  isNeo 
                    ? 'bg-[#00ff66] text-black border-2 border-black shadow-[2px_2px_0px_#000] neo-pressable' 
                    : 'bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded shadow-lg shadow-emerald-950/50'
                }`}
              >
                Next <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            ) : (
              <button
                onClick={onClose}
                className={`px-4 py-1.5 text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer transition-transform ${
                  isNeo 
                    ? 'bg-[#00ff66] text-black border-2 border-black shadow-[2px_2px_0px_#000] neo-pressable' 
                    : 'bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded shadow-lg shadow-emerald-950/50'
                }`}
              >
                Launch & Explore <Check className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
