/**
 * Main Injection & App Entry Point for Better-YT (YT Desktop)
 * Orchestrates settings, shortcuts, UI components, filtering, and external link handling.
 */

import coreStyles from './styles.css?inline';
import { settingsManager } from './settings';
import { youTubeManager } from './youtube';
import { shortcutsManager } from './shortcuts';
import { titleBar } from './ui/titlebar';
import { searchOverlay } from './ui/search-overlay';
import { settingsModal } from './ui/settings-modal';
import { offlineManager } from './ui/offline';
import { isInternalUrl } from './utils/url';
import { showToast } from './ui/toast';

// Expose on window for native menu / tray triggers
declare global {
  interface Window {
    __better_yt_search?: typeof searchOverlay;
    __better_yt_settings?: typeof settingsModal;
  }
}

window.__better_yt_search = searchOverlay;
window.__better_yt_settings = settingsModal;

function injectCoreStyles(): void {
  const existing = document.getElementById('better-yt-core-styles');
  if (existing) return;

  const styleEl = document.createElement('style');
  styleEl.id = 'better-yt-core-styles';
  styleEl.textContent = coreStyles;

  const target = document.head || document.documentElement;
  if (target) {
    target.appendChild(styleEl);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      (document.head || document.documentElement).appendChild(styleEl);
    });
  }
}

function setupExternalLinkInterception(): void {
  // Capture clicks on links
  document.addEventListener(
    'click',
    async (e) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const anchor = target.closest('a');
      if (!anchor || !anchor.href) return;

      const href = anchor.href;
      // Skip empty or anchor targets
      if (href.startsWith('#') || href.startsWith('javascript:')) return;

      const settings = settingsManager.getSettings();
      if (!settings.openExternalLinksInBrowser) return;

      // If the link is external (not YouTube or Google Auth)
      if (!isInternalUrl(href)) {
        e.preventDefault();
        e.stopPropagation();

        try {
          if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
            const { invoke } = await import('@tauri-apps/api/core');
            await invoke('open_external_url', { url: href });
          } else {
            window.open(href, '_blank', 'noopener,noreferrer');
          }
        } catch {
          window.open(href, '_blank', 'noopener,noreferrer');
        }
      }
    },
    true // Capture phase
  );
}

function setupFallbackPageInteractions(): void {
  const retryBtn = document.getElementById('yt-desktop-retry-btn');
  const settingsBtn = document.getElementById('yt-desktop-open-settings-btn');
  const statusText = document.getElementById('yt-desktop-status-text');

  if (retryBtn) {
    retryBtn.addEventListener('click', async () => {
      if (statusText) statusText.textContent = 'Checking connection...';
      const connected = await offlineManager.checkAndReconnect();
      if (!connected && statusText) {
        statusText.textContent = 'Connection failed';
      }
    });
  }

  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      settingsModal.open();
    });
  }

  // Auto-check on page load if running as standalone fallback
  if (window.location.protocol === 'tauri:' || window.location.hostname === 'localhost') {
    offlineManager.checkAndReconnect();
  }
}

async function bootstrap(): Promise<void> {
  // 1. Inject Styles
  injectCoreStyles();

  // 2. Initialize Settings
  await settingsManager.init();

  // 3. Initialize External Link Interceptor
  setupExternalLinkInterception();

  // 4. Initialize Local Fallback Interactions (if loaded on index.html)
  if (document.getElementById('yt-desktop-status-area')) {
    setupFallbackPageInteractions();
  }

  // 5. Initialize Services
  void titleBar;
  void searchOverlay;
  void settingsModal;
  void shortcutsManager;
  void youTubeManager;
  void offlineManager;

  // 6. Report Readiness in development
  if (import.meta.env && import.meta.env.DEV) {
    showToast({
      message: 'YT Desktop Active',
      durationMs: 2500,
    });
  }
}

// Run immediately or on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    bootstrap().catch((err) => {
      console.error('[YT Desktop] Bootstrap failure:', err);
    });
  });
} else {
  bootstrap().catch((err) => {
    console.error('[YT Desktop] Bootstrap failure:', err);
  });
}
