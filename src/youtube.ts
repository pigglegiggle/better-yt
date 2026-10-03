/**
 * YouTube Page & Player Management for Better-YT
 * Handles SPA navigation, resilient DOM content filtering, and playback controls.
 */

import { extractVideoId } from './utils/url';
import { debounce, waitForElement } from './utils/dom';
import { AppSettings, settingsManager } from './settings';
import { sponsorBlockManager } from './sponsorblock';

export class YouTubeManager {
  private lastUrl = '';
  private filterStyleEl: HTMLStyleElement | null = null;
  private observer: MutationObserver | null = null;
  private homePlaceholderEl: HTMLElement | null = null;
  private currentVideoEl: HTMLVideoElement | null = null;

  constructor() {
    this.init();
  }

  private init(): void {
    this.lastUrl = window.location.href;

    // Navigation events dispatched by YouTube's Polymer/custom framework
    window.addEventListener('yt-navigate-finish', this.onNavigation);
    window.addEventListener('yt-page-data-updated', this.onNavigation);
    window.addEventListener('popstate', this.onNavigation);
    window.addEventListener('hashchange', this.onNavigation);

    // Fallback URL change observer
    setInterval(() => {
      if (window.location.href !== this.lastUrl) {
        this.onNavigation();
      }
    }, 400);

    // Subscribe to settings changes
    settingsManager.subscribe((settings) => {
      this.applyFilterStyles(settings);
      this.scanAndFilterDom(settings);
      this.applyPlaybackSpeed(settings.defaultPlaybackSpeed);
      sponsorBlockManager.setEnabled(settings.sponsorBlockEnabled);
      sponsorBlockManager.setCategories(settings.sponsorCategories);
    });

    // Setup debounced DOM MutationObserver
    this.setupMutationObserver();

    // Initial run
    this.onNavigation();
  }

  private onNavigation = (): void => {
    const currentUrl = window.location.href;
    this.lastUrl = currentUrl;

    const settings = settingsManager.getSettings();
    this.applyFilterStyles(settings);
    this.scanAndFilterDom(settings);

    // Check for active video
    const videoId = extractVideoId(currentUrl);
    waitForElement<HTMLVideoElement>('video', 4000).then((videoEl) => {
      this.currentVideoEl = videoEl;
      if (videoEl) {
        this.applyPlaybackSpeed(settings.defaultPlaybackSpeed);
      }
      sponsorBlockManager.handleVideoChange(videoId, videoEl);
    });

    // Check homepage distraction-free state
    this.handleHomepageDistractionFree(settings);
  };

  /**
   * Applies CSS rules dynamically to #better-yt-filter-styles
   */
  private applyFilterStyles(settings: AppSettings): void {
    if (!this.filterStyleEl) {
      const existing = document.getElementById('better-yt-filter-styles');
      if (existing instanceof HTMLStyleElement) {
        this.filterStyleEl = existing;
      } else {
        const style = document.createElement('style');
        style.id = 'better-yt-filter-styles';
        (document.head || document.documentElement).appendChild(style);
        this.filterStyleEl = style;
      }
    }

    const rules: string[] = [];

    // Hide Shorts
    if (settings.hideShorts) {
      rules.push(`
        ytd-rich-section-renderer:has(ytd-rich-shelf-renderer[is-shorts]),
        ytd-rich-shelf-renderer[is-shorts],
        ytd-reel-shelf-renderer,
        ytd-guide-entry-renderer:has(a[title="Shorts"]),
        ytd-mini-guide-entry-renderer[aria-label="Shorts"],
        ytd-video-renderer:has(a[href*="/shorts/"]),
        ytd-grid-video-renderer:has(a[href*="/shorts/"]),
        [is-shorts],
        a[title="Shorts"],
        a[href^="/shorts"] {
          display: none !important;
        }
      `);
    }

    // Hide Comments
    if (settings.hideComments) {
      rules.push(`
        ytd-comments#comments,
        #comments.ytd-watch-flexy,
        ytd-item-section-renderer:has(ytd-comments-header-renderer) {
          display: none !important;
        }
      `);
    }

    // Hide Sidebar Recommendations on Watch Pages
    if (settings.hideRecommendations) {
      rules.push(`
        #related.ytd-watch-flexy,
        ytd-watch-next-secondary-results-renderer,
        #secondary.ytd-watch-flexy #related {
          display: none !important;
        }
      `);
    }

    // Hide Homepage Recommendation Grid
    if (settings.hideHomeRecommendations) {
      rules.push(`
        ytd-browse[page-subtype="home"] #contents.ytd-rich-grid-renderer,
        ytd-browse[page-subtype="home"] ytd-rich-grid-renderer {
          display: none !important;
        }
      `);
    }

    // Hide Merchandise & Promo Shelves
    if (settings.hideMerchPromo) {
      rules.push(`
        ytd-merch-shelf-renderer,
        ytd-promoted-sparkles-web-renderer,
        ytd-player-legacy-desktop-watch-ads-renderer,
        ytd-ad-slot-renderer,
        #panels ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-ads"],
        ytd-in-feed-ad-layout-renderer {
          display: none !important;
        }
      `);
    }

    // Compact Sidebar
    if (settings.compactSidebar) {
      rules.push(`
        tp-yt-app-drawer#guide {
          width: 72px !important;
        }
      `);
    }

    // Reduce Animations
    if (settings.reduceAnimations) {
      rules.push(`
        *, *::before, *::after {
          animation-duration: 0.001ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.001ms !important;
        }
      `);
    }

    this.filterStyleEl.textContent = rules.join('\n');
  }

  /**
   * Resilient DOM filtering via debounced scans for dynamic elements
   * that CSS alone might miss in legacy browser versions.
   */
  private scanAndFilterDom = debounce((settings: AppSettings) => {
    // Shorts elements
    if (settings.hideShorts) {
      const shortsLinks = document.querySelectorAll<HTMLAnchorElement>('a[href^="/shorts"]');
      shortsLinks.forEach((a) => {
        const item = a.closest('ytd-guide-entry-renderer') || a.closest('ytd-rich-item-renderer');
        if (item instanceof HTMLElement) {
          item.style.display = 'none';
        }
      });
    }

    // Homepage placeholder
    this.handleHomepageDistractionFree(settings);
  }, 250);

  private handleHomepageDistractionFree(settings: AppSettings): void {
    const isHomePage =
      window.location.pathname === '/' || window.location.pathname === '';

    if (settings.hideHomeRecommendations && isHomePage) {
      const browse = document.querySelector('ytd-browse[page-subtype="home"]');
      if (browse && !document.getElementById('better-yt-distraction-free-banner')) {
        const banner = document.createElement('div');
        banner.id = 'better-yt-distraction-free-banner';
        banner.className = 'better-yt-home-placeholder';

        const title = document.createElement('h2');
        title.textContent = 'Distraction-Free Mode Active';
        banner.appendChild(title);

        const sub = document.createElement('p');
        sub.textContent = 'Homepage recommendation feed is hidden. Use Search above or check your Subscriptions.';
        banner.appendChild(sub);

        browse.prepend(banner);
        this.homePlaceholderEl = banner;
      }
    } else {
      if (this.homePlaceholderEl && this.homePlaceholderEl.parentNode) {
        this.homePlaceholderEl.parentNode.removeChild(this.homePlaceholderEl);
        this.homePlaceholderEl = null;
      }
    }
  }

  private applyPlaybackSpeed(speed: number): void {
    if (this.currentVideoEl && speed >= 0.25 && speed <= 2.0) {
      this.currentVideoEl.playbackRate = speed;
    }
  }

  private setupMutationObserver(): void {
    const debouncedScan = debounce(() => {
      const settings = settingsManager.getSettings();
      this.scanAndFilterDom(settings);
    }, 300);

    this.observer = new MutationObserver((mutations) => {
      // Light-weight inspection: only scan if nodes were added
      let hasAddedNodes = false;
      for (const m of mutations) {
        if (m.addedNodes.length > 0) {
          hasAddedNodes = true;
          break;
        }
      }
      if (hasAddedNodes) {
        debouncedScan();
      }
    });

    const target = document.body || document.documentElement;
    this.observer.observe(target, {
      childList: true,
      subtree: true,
    });
  }

  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    window.removeEventListener('yt-navigate-finish', this.onNavigation);
    window.removeEventListener('yt-page-data-updated', this.onNavigation);
    window.removeEventListener('popstate', this.onNavigation);
    window.removeEventListener('hashchange', this.onNavigation);
  }
}

export const youTubeManager = new YouTubeManager();
