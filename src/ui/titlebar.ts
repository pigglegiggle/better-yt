/**
 * Sleek Desktop Control Bar for Better-YT
 * Provides navigation buttons, quick-jump links, search trigger,
 * SponsorBlock status, PiP trigger, and settings button.
 */

import {
  getHomeUrl,
  getSubscriptionsUrl,
  getLibraryUrl,
  getHistoryUrl,
} from '../utils/url';
import { createSvgElement } from '../utils/dom';
import { searchOverlay } from './search-overlay';
import { settingsModal } from './settings-modal';
import { showToast } from './toast';
import { settingsManager } from '../settings';

export class TitleBar {
  private barEl: HTMLElement | null = null;
  private sbBadgeEl: HTMLElement | null = null;

  constructor() {
    this.createDom();
    this.subscribeSettings();
  }

  private createDom(): void {
    if (this.barEl || document.getElementById('better-yt-desktop-bar')) {
      return;
    }

    const bar = document.createElement('header');
    bar.id = 'better-yt-desktop-bar';
    bar.className = 'better-yt-desktop-bar';

    // Left Section: App Logo, Title & Navigation
    const left = document.createElement('div');
    left.className = 'better-yt-bar-left';

    const logoSvg = createSvgElement(
      `<svg viewBox="0 0 32 32" width="20" height="20" fill="none" class="better-yt-bar-logo">
        <rect width="32" height="32" rx="8" fill="#27272a" />
        <path d="M13 10L22 16L13 22V10Z" fill="#ef4444" />
        <path d="M13 10L18 16L13 22V10Z" fill="#ffffff" fill-opacity="0.9" />
      </svg>`
    );
    if (logoSvg) {
      left.appendChild(logoSvg);
    }

    const title = document.createElement('span');
    title.className = 'better-yt-bar-title';
    title.textContent = 'YT Desktop';
    left.appendChild(title);

    // Nav controls: Back, Forward, Reload
    const navGroup = document.createElement('div');
    navGroup.className = 'better-yt-nav-group';

    const backBtn = this.createNavButton('Back (Cmd/Alt+[)', '←', () => {
      window.history.back();
    });
    navGroup.appendChild(backBtn);

    const fwdBtn = this.createNavButton('Forward (Cmd/Alt+])', '→', () => {
      window.history.forward();
    });
    navGroup.appendChild(fwdBtn);

    const reloadBtn = this.createNavButton('Reload (Cmd/Ctrl+R)', '↻', () => {
      window.location.reload();
    });
    navGroup.appendChild(reloadBtn);

    left.appendChild(navGroup);
    bar.appendChild(left);

    // Center Section: Quick Jumps & Search trigger
    const center = document.createElement('div');
    center.className = 'better-yt-bar-center';

    const jumps = [
      { label: 'Home', getUrl: getHomeUrl },
      { label: 'Subscriptions', getUrl: getSubscriptionsUrl },
      { label: 'Library', getUrl: getLibraryUrl },
      { label: 'History', getUrl: getHistoryUrl },
    ];

    for (const j of jumps) {
      const btn = document.createElement('button');
      btn.className = 'better-yt-jump-btn';
      btn.textContent = j.label;
      btn.type = 'button';
      btn.addEventListener('click', () => {
        window.location.href = j.getUrl();
      });
      center.appendChild(btn);
    }

    const searchBtn = document.createElement('button');
    searchBtn.className = 'better-yt-search-trigger-btn';
    searchBtn.type = 'button';
    searchBtn.title = 'Search YouTube (Cmd/Ctrl+L)';

    const sIcon = createSvgElement(
      `<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>`
    );
    if (sIcon) {
      searchBtn.appendChild(sIcon);
    }
    const searchText = document.createElement('span');
    searchText.textContent = 'Search...';
    searchBtn.appendChild(searchText);

    const kbd = document.createElement('kbd');
    kbd.textContent = navigator.platform.includes('Mac') ? '⌘L' : 'Ctrl+L';
    searchBtn.appendChild(kbd);

    searchBtn.addEventListener('click', () => {
      searchOverlay.open();
    });
    center.appendChild(searchBtn);

    bar.appendChild(center);

    // Right Section: SponsorBlock badge, PiP, Copy URL, External, Settings
    const right = document.createElement('div');
    right.className = 'better-yt-bar-right';

    // SponsorBlock badge
    const sbBadge = document.createElement('div');
    sbBadge.className = 'better-yt-sb-badge';
    sbBadge.title = 'SponsorBlock Active';
    const dot = document.createElement('span');
    dot.className = 'better-yt-sb-dot';
    const sbText = document.createElement('span');
    sbText.textContent = 'SB';
    sbBadge.appendChild(dot);
    sbBadge.appendChild(sbText);
    right.appendChild(sbBadge);
    this.sbBadgeEl = sbBadge;

    // PiP Button
    const pipBtn = document.createElement('button');
    pipBtn.className = 'better-yt-icon-btn';
    pipBtn.type = 'button';
    pipBtn.title = 'Picture in Picture';
    pipBtn.textContent = '⧉';
    pipBtn.addEventListener('click', async () => {
      const video = document.querySelector('video');
      if (!video) {
        showToast({ message: 'No active video found' });
        return;
      }
      try {
        if (document.pictureInPictureElement) {
          await document.exitPictureInPicture();
        } else if (document.pictureInPictureEnabled) {
          await video.requestPictureInPicture();
        }
      } catch (err) {
        showToast({ message: 'Picture-in-Picture not supported' });
      }
    });
    right.appendChild(pipBtn);

    // Copy URL Button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'better-yt-icon-btn';
    copyBtn.type = 'button';
    copyBtn.title = 'Copy Current URL';
    copyBtn.textContent = '🔗';
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(window.location.href);
      showToast({ message: 'URL copied to clipboard' });
    });
    right.appendChild(copyBtn);

    // Open in External Browser
    const openExtBtn = document.createElement('button');
    openExtBtn.className = 'better-yt-icon-btn';
    openExtBtn.type = 'button';
    openExtBtn.title = 'Open in System Browser';
    openExtBtn.textContent = '↗';
    openExtBtn.addEventListener('click', async () => {
      const currentUrl = window.location.href;
      try {
        if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
          const { invoke } = await import('@tauri-apps/api/core');
          await invoke('open_external_url', { url: currentUrl });
        } else {
          window.open(currentUrl, '_blank');
        }
      } catch {
        window.open(currentUrl, '_blank');
      }
    });
    right.appendChild(openExtBtn);

    // Settings Button
    const settingsBtn = document.createElement('button');
    settingsBtn.className = 'better-yt-icon-btn';
    settingsBtn.type = 'button';
    settingsBtn.title = 'Open Settings (Cmd/Ctrl+,)';
    settingsBtn.textContent = '⚙';
    settingsBtn.addEventListener('click', () => {
      settingsModal.open();
    });
    right.appendChild(settingsBtn);

    bar.appendChild(right);

    // Insert at top of document
    if (document.body) {
      document.body.prepend(bar);
    } else {
      document.documentElement.prepend(bar);
    }
    this.barEl = bar;
  }

  private createNavButton(title: string, label: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'better-yt-nav-icon-btn';
    btn.type = 'button';
    btn.title = title;
    btn.textContent = label;
    btn.addEventListener('click', onClick);
    return btn;
  }

  private subscribeSettings(): void {
    settingsManager.subscribe((settings) => {
      if (this.sbBadgeEl) {
        this.sbBadgeEl.style.display = settings.sponsorBlockEnabled ? 'inline-flex' : 'none';
      }
    });
  }
}

export const titleBar = new TitleBar();
