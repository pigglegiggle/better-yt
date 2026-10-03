/**
 * Global Keyboard & Media Shortcuts Manager for Better-YT
 * Dispatches navigation, overlay triggers, and media controls.
 */

import { isEditable } from './utils/dom';
import { searchOverlay } from './ui/search-overlay';
import { settingsModal } from './ui/settings-modal';
import { settingsManager } from './settings';

const isMac =
  typeof navigator !== 'undefined' &&
  (navigator.platform.toUpperCase().includes('MAC') ||
    navigator.userAgent.toUpperCase().includes('MAC'));

export class ShortcutsManager {
  private isEnabled = true;

  constructor() {
    this.init();
  }

  private init(): void {
    window.addEventListener('keydown', this.handleKeyDown, true); // Capture phase
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.isEnabled) return;

    const target = e.target;
    const isTextEditing = isEditable(target);

    const hasModifier = isMac ? e.metaKey : e.ctrlKey;
    const isAlt = e.altKey;
    const isShift = e.shiftKey;
    const key = e.key;

    // -------------------------------------------------------------
    // Global Navigation & Overlays (Enabled even while in input if modifier pressed)
    // -------------------------------------------------------------

    // Search overlay: Cmd+L (Mac) or Ctrl+L (Win/Linux)
    if (hasModifier && !isAlt && !isShift && (key === 'l' || key === 'L')) {
      e.preventDefault();
      searchOverlay.toggle();
      return;
    }

    // Settings modal: Cmd+, (Mac) or Ctrl+, (Win/Linux)
    if (hasModifier && key === ',') {
      e.preventDefault();
      settingsModal.toggle();
      return;
    }

    // Escape: Closes active overlays
    if (key === 'Escape') {
      if (searchOverlay.getIsOpen()) {
        e.preventDefault();
        searchOverlay.close();
        return;
      }
      if (settingsModal.getIsOpen()) {
        e.preventDefault();
        settingsModal.close();
        return;
      }
    }

    // Back navigation: Cmd+[ (Mac) or Alt+Left (Win/Linux)
    if (
      (isMac && hasModifier && key === '[') ||
      (!isMac && isAlt && key === 'ArrowLeft')
    ) {
      e.preventDefault();
      window.history.back();
      return;
    }

    // Forward navigation: Cmd+] (Mac) or Alt+Right (Win/Linux)
    if (
      (isMac && hasModifier && key === ']') ||
      (!isMac && isAlt && key === 'ArrowRight')
    ) {
      e.preventDefault();
      window.history.forward();
      return;
    }

    // Reload: Cmd+R (Mac) or Ctrl+R (Win/Linux)
    if (hasModifier && !isShift && (key === 'r' || key === 'R')) {
      e.preventDefault();
      window.location.reload();
      return;
    }

    // Hard Reload: Cmd+Shift+R / Ctrl+Shift+R
    if (hasModifier && isShift && (key === 'r' || key === 'R')) {
      e.preventDefault();
      window.location.reload();
      return;
    }

    // Developer tools in dev mode: Cmd+Opt+I (Mac) or Ctrl+Shift+I (Win/Linux)
    const isDevToolsCombo =
      (isMac && hasModifier && e.altKey && (key === 'i' || key === 'I')) ||
      (!isMac && hasModifier && isShift && (key === 'i' || key === 'I'));

    if (isDevToolsCombo) {
      const settings = settingsManager.getSettings();
      if (settings.devToolsEnabled) {
        // Invoke Rust toggle_devtools command
        if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
          import('@tauri-apps/api/core').then(({ invoke }) => {
            invoke('toggle_devtools').catch(() => {});
          });
        }
      }
      return;
    }

    // -------------------------------------------------------------
    // Media Playback Shortcuts (MUST NOT trigger when typing in inputs!)
    // -------------------------------------------------------------
    if (isTextEditing) {
      return;
    }

    // If an overlay is open, don't execute media keys
    if (searchOverlay.getIsOpen() || settingsModal.getIsOpen()) {
      return;
    }

    const video = document.querySelector('video');
    if (!video) {
      return;
    }

    // Play / Pause: Space or K
    if (key === ' ' || key === 'k' || key === 'K') {
      e.preventDefault();
      if (video.paused) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
      return;
    }

    // Seek -10s: J
    if (key === 'j' || key === 'J') {
      e.preventDefault();
      video.currentTime = Math.max(0, video.currentTime - 10);
      return;
    }

    // Seek +10s: L
    if (key === 'l' || key === 'L') {
      e.preventDefault();
      video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 10);
      return;
    }

    // Seek -5s: Left Arrow
    if (key === 'ArrowLeft') {
      e.preventDefault();
      video.currentTime = Math.max(0, video.currentTime - 5);
      return;
    }

    // Seek +5s: Right Arrow
    if (key === 'ArrowRight') {
      e.preventDefault();
      video.currentTime = Math.min(video.duration || Infinity, video.currentTime + 5);
      return;
    }

    // Mute: M
    if (key === 'm' || key === 'M') {
      e.preventDefault();
      video.muted = !video.muted;
      return;
    }

    // Fullscreen: F
    if (key === 'f' || key === 'F') {
      e.preventDefault();
      const fsBtn = document.querySelector<HTMLButtonElement>('.ytp-fullscreen-button');
      if (fsBtn) {
        fsBtn.click();
      } else {
        if (!document.fullscreenElement) {
          video.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      }
      return;
    }

    // Captions toggle: C
    if (key === 'c' || key === 'C') {
      e.preventDefault();
      const subBtn = document.querySelector<HTMLButtonElement>('.ytp-subtitles-button');
      if (subBtn) {
        subBtn.click();
      }
      return;
    }

    // Speed increase: Shift+>
    if (isShift && (key === '>' || key === '.')) {
      e.preventDefault();
      video.playbackRate = Math.min(2.0, Math.round((video.playbackRate + 0.25) * 100) / 100);
      return;
    }

    // Speed decrease: Shift+<
    if (isShift && (key === '<' || key === ',')) {
      e.preventDefault();
      video.playbackRate = Math.max(0.25, Math.round((video.playbackRate - 0.25) * 100) / 100);
      return;
    }
  };

  public destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown, true);
  }
}

export const shortcutsManager = new ShortcutsManager();
