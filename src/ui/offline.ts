/**
 * Offline & Error Screen Component for Better-YT
 * Provides a clean, dark-themed offline view with automated reconnection and retry.
 */

import { getHomeUrl } from '../utils/url';
import { createSvgElement } from '../utils/dom';

export class OfflineManager {
  private overlayEl: HTMLElement | null = null;
  private isOffline = false;

  constructor() {
    this.initListeners();
  }

  private initListeners(): void {
    window.addEventListener('offline', () => {
      this.showOfflineScreen();
    });

    window.addEventListener('online', () => {
      this.checkAndReconnect();
    });

    // Check initial status
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.showOfflineScreen();
    }
  }

  public showOfflineScreen(customMessage?: string): void {
    if (this.overlayEl && document.body.contains(this.overlayEl)) {
      return;
    }

    this.isOffline = true;

    const overlay = document.createElement('div');
    overlay.id = 'better-yt-offline-screen';
    overlay.className = 'better-yt-offline-overlay';

    const card = document.createElement('div');
    card.className = 'better-yt-offline-card';

    // Logo
    const logoSvg = createSvgElement(
      `<svg viewBox="0 0 64 64" width="72" height="72" fill="none" class="better-yt-offline-logo">
        <rect width="64" height="64" rx="16" fill="#18181b" />
        <rect x="2" y="2" width="60" height="60" rx="14" stroke="#27272a" stroke-width="2" />
        <path d="M26 20L44 32L26 44V20Z" fill="#ef4444" />
        <path d="M26 20L36 32L26 44V20Z" fill="#ffffff" fill-opacity="0.9" />
      </svg>`
    );
    if (logoSvg) {
      card.appendChild(logoSvg);
    }

    const title = document.createElement('h1');
    title.className = 'better-yt-offline-title';
    title.textContent = "You're offline";
    card.appendChild(title);

    const desc = document.createElement('p');
    desc.className = 'better-yt-offline-desc';
    desc.textContent =
      customMessage || 'Check your internet connection and try again.';
    card.appendChild(desc);

    const statusPill = document.createElement('div');
    statusPill.className = 'better-yt-status-pill';
    const dot = document.createElement('span');
    dot.className = 'better-yt-status-dot offline';
    const statusText = document.createElement('span');
    statusText.id = 'better-yt-offline-status-text';
    statusText.textContent = 'Disconnected from YouTube';
    statusPill.appendChild(dot);
    statusPill.appendChild(statusText);
    card.appendChild(statusPill);

    const retryBtn = document.createElement('button');
    retryBtn.className = 'better-yt-btn better-yt-btn-primary';
    retryBtn.textContent = 'Retry Connection';
    retryBtn.type = 'button';
    retryBtn.addEventListener('click', () => {
      this.checkAndReconnect();
    });
    card.appendChild(retryBtn);

    overlay.appendChild(card);
    document.body.appendChild(overlay);
    this.overlayEl = overlay;
  }

  public hideOfflineScreen(): void {
    this.isOffline = false;
    if (this.overlayEl && this.overlayEl.parentNode) {
      this.overlayEl.parentNode.removeChild(this.overlayEl);
      this.overlayEl = null;
    }
  }

  public getIsOffline(): boolean {
    return this.isOffline;
  }

  public async checkAndReconnect(): Promise<boolean> {
    const statusText = document.getElementById('better-yt-offline-status-text');
    if (statusText) {
      statusText.textContent = 'Checking connectivity...';
    }

    try {
      // Test network using YouTube connectivity endpoint with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      await fetch('https://www.youtube.com/generate_204', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-store',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      this.hideOfflineScreen();
      // If we are on fallback page, navigate to YouTube
      if (!window.location.hostname.includes('youtube.com')) {
        window.location.href = getHomeUrl();
      } else {
        window.location.reload();
      }
      return true;
    } catch {
      if (statusText) {
        statusText.textContent = 'Still offline. Please check network.';
      }
      return false;
    }
  }
}

export const offlineManager = new OfflineManager();
