import { useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';

// Short click tone for the "Audio Feedback" accessibility option. Uses Web Audio,
// so it needs no sound files and works offline.
function playTapSound(audioContextRef) {
  try {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    const context = audioContextRef.current;
    if (context.state === 'suspended') context.resume();

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.08);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.08);
  } catch (error) {
    console.error('Tap sound failed:', error);
  }
}

// Applies kiosk-wide behaviour that isn't tied to a single page.
function KioskEnvironment() {
  const { state } = useApp();
  const { highContrast, largeText, audioEnabled } = state.accessibility;
  const audioContextRef = useRef(null);

  useEffect(() => {
    document.title = `${state.site.libraryName} Kiosk`;
  }, [state.site.libraryName]);

  // Accessibility classes go on <html> so every page, including fixed overlays and
  // rem-based sizes, picks them up.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('high-contrast', highContrast);
    root.classList.toggle('large-text', largeText);
  }, [highContrast, largeText]);

  // Block the long-press / right-click menu, which would expose browser actions.
  useEffect(() => {
    const preventContextMenu = (event) => event.preventDefault();
    document.addEventListener('contextmenu', preventContextMenu);
    return () => document.removeEventListener('contextmenu', preventContextMenu);
  }, []);

  useEffect(() => {
    if (!audioEnabled) return undefined;
    const onPointerDown = (event) => {
      if (event.target.closest('button, a, [role="button"], [role="switch"]')) {
        playTapSound(audioContextRef);
      }
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [audioEnabled]);

  return null;
}

export default KioskEnvironment;
