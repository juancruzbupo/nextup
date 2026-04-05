'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './Coachmark.module.css';

interface Step {
  target: string;
  text: string;
  position?: 'top' | 'bottom';
}

interface CoachmarkProps {
  id: string;
  steps: Step[];
}

export function Coachmark({ id, steps }: CoachmarkProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);
  const [arrowDir, setArrowDir] = useState<'top' | 'bottom'>('top');

  useEffect(() => {
    const key = `nextup-coachmark-${id}`;
    if (localStorage.getItem(key) === 'done') return;
    const timeout = setTimeout(() => setVisible(true), 1000);
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

    // Recalculate on scroll and resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);
    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [updatePosition]);

  // Scroll target into view when step changes
  useEffect(() => {
    if (!visible || currentStep >= steps.length) return;
    const el = document.querySelector(steps[currentStep].target);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
  };

  if (!visible || currentStep >= steps.length || !rect) return null;

  const isLast = currentStep === steps.length - 1;

  return (
    <>
      <div className={styles.overlay} onClick={handleClose} />
      <div
        className={`${styles.tooltip} ${styles[arrowDir]}`}
        style={{ top: rect.top, left: rect.left, width: rect.width, position: 'fixed' }}
      >
        <button className={styles.close} onClick={handleClose} aria-label="Cerrar guía">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        <p className={styles.text}>{steps[currentStep].text}</p>
        <div className={styles.footer}>
          <span className={styles.counter}>{currentStep + 1} / {steps.length}</span>
          <button className={styles.nextBtn} onClick={handleNext}>
            {isLast ? 'Entendido' : 'Siguiente'}
          </button>
        </div>
      </div>
    </>
  );
}
