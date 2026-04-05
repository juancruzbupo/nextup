'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import styles from './Coachmark.module.css';

interface Step {
  target: string;
  text: string;
  position?: 'top' | 'bottom';
}

interface CoachmarkProps {
  id: string;
  steps: Step[];
  showHelpButton?: boolean;
}

export function Coachmark({ id, steps, showHelpButton = true }: CoachmarkProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const [arrowDir, setArrowDir] = useState<'top' | 'bottom'>('top');
  const triggerRef = useRef<Element | null>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const key = `nextup-coachmark-${id}`;
    if (localStorage.getItem(key) === 'done') return;
    const timeout = setTimeout(() => {
      triggerRef.current = document.activeElement;
      setVisible(true);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [id]);

  const updatePosition = useCallback(() => {
    if (!visible || currentStep >= steps.length) return;
    const step = steps[currentStep];
    const el = document.querySelector(step.target);
    if (!el) return;

    const r = el.getBoundingClientRect();
    const pos = step.position || 'bottom';
    const tooltipW = Math.min(280, window.innerWidth - 32);

    if (pos === 'bottom') {
      setRect({
        top: r.bottom + 12,
        left: Math.max(16, Math.min(r.left + r.width / 2 - tooltipW / 2, window.innerWidth - tooltipW - 16)),
        width: tooltipW,
      });
      setArrowDir('top');
    } else {
      setRect({
        top: r.top - 80,
        left: Math.max(16, Math.min(r.left + r.width / 2 - tooltipW / 2, window.innerWidth - tooltipW - 16)),
        width: tooltipW,
      });
      setArrowDir('bottom');
    }
  }, [visible, currentStep, steps]);

  useEffect(() => {
    updatePosition();
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [updatePosition]);

  // Close on Escape key
  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible]);

  // Scroll target into view when step changes, focus next button
  useEffect(() => {
    if (!visible || currentStep >= steps.length) return;
    const el = document.querySelector(steps[currentStep].target);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    // Focus next button for keyboard users
    setTimeout(() => nextBtnRef.current?.focus(), 300);
  }, [visible, currentStep, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setVisible(false);
    localStorage.setItem(`nextup-coachmark-${id}`, 'done');
    // Restore focus to element that was active before modal opened
    if (triggerRef.current && 'focus' in triggerRef.current) {
      (triggerRef.current as HTMLElement).focus();
    }
  };

  const handleRestart = () => {
    triggerRef.current = document.activeElement;
    localStorage.removeItem(`nextup-coachmark-${id}`);
    setCurrentStep(0);
    setVisible(true);
  };

  const isDone = !visible || currentStep >= steps.length || !rect;

  if (isDone) {
    if (!showHelpButton) return null;
    const alreadySeen = typeof window !== 'undefined' && localStorage.getItem(`nextup-coachmark-${id}`) === 'done';
    if (!alreadySeen) return null;
    return (
      <button
        onClick={handleRestart}
        className={styles.helpBtn}
        aria-label="Ver guía de ayuda"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>
    );
  }

  const isLast = currentStep === steps.length - 1;

  return (
    <>
      {/* Overlay: clickable and keyboard-accessible */}
      <div
        className={styles.overlay}
        onClick={handleClose}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClose(); }}
        role="button"
        tabIndex={0}
        aria-label="Cerrar guía"
      />
      <div
        className={`${styles.tooltip} ${styles[arrowDir]}`}
        style={{ top: rect.top, left: rect.left, width: rect.width, position: 'fixed' }}
        role="dialog"
        aria-label="Guía de ayuda"
        aria-modal="true"
      >
        <button className={styles.close} onClick={handleClose} aria-label="Cerrar guía">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        <p className={styles.text}>{steps[currentStep].text}</p>
        <div className={styles.footer}>
          <span className={styles.counter} aria-live="polite" aria-atomic="true">
            Paso {currentStep + 1} de {steps.length}
          </span>
          <button ref={nextBtnRef} className={styles.nextBtn} onClick={handleNext}>
            {isLast ? 'Entendido' : 'Siguiente'}
          </button>
        </div>
      </div>
    </>
  );
}
