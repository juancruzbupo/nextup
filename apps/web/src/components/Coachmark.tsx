'use client';

import { useState, useEffect } from 'react';
import styles from './Coachmark.module.css';

interface Step {
  target: string; // CSS selector of the element to highlight
  text: string;
  position?: 'top' | 'bottom';
}

interface CoachmarkProps {
  id: string; // unique key for localStorage (e.g. "venue-client-tour")
  steps: Step[];
}

export function Coachmark({ id, steps }: CoachmarkProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, arrowDir: 'top' as 'top' | 'bottom' });

  useEffect(() => {
    const key = `nextup-coachmark-${id}`;
    if (localStorage.getItem(key) === 'done') return;
    // Small delay to let the page render
    const timeout = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timeout);
  }, [id]);

  useEffect(() => {
    if (!visible || currentStep >= steps.length) return;

    const step = steps[currentStep];
    const el = document.querySelector(step.target);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const scrollY = window.scrollY;
    const pos = step.position || 'bottom';

    if (pos === 'bottom') {
      setPosition({
        top: rect.bottom + scrollY + 12,
        left: Math.max(16, Math.min(rect.left + rect.width / 2 - 140, window.innerWidth - 296)),
        arrowDir: 'top',
      });
    } else {
      setPosition({
        top: rect.top + scrollY - 80,
        left: Math.max(16, Math.min(rect.left + rect.width / 2 - 140, window.innerWidth - 296)),
        arrowDir: 'bottom',
      });
    }

    // Scroll element into view
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

  if (!visible || currentStep >= steps.length) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  return (
    <>
      <div className={styles.overlay} onClick={handleClose} />
      <div
        className={`${styles.tooltip} ${styles[position.arrowDir]}`}
        style={{ top: position.top, left: position.left }}
      >
        <button className={styles.close} onClick={handleClose} aria-label="Cerrar guía">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        <p className={styles.text}>{step.text}</p>
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
