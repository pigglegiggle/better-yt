/**
 * URL and Navigation Utilities for Better-YT
 */

const ALLOWED_INTERNAL_HOSTNAMES = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'accounts.google.com',
  'myaccount.google.com',
  'policies.google.com',
  'consent.youtube.com',
  'support.google.com',
]);

/**
 * Validates whether a URL should stay inside the application's WebView.
 * Strictly verifies the hostname and protocol to prevent phishing, spoofing,
 * or escaping to external domains.
 */
export function isInternalUrl(urlString: string): boolean {
  if (!urlString || typeof urlString !== 'string') {
    return false;
  }

  // Allow internal in-app or special browser URLs
  if (
    urlString.startsWith('tauri://') ||
    urlString.startsWith('http://localhost') ||
    urlString.startsWith('http://127.0.0.1') ||
    urlString === 'about:blank'
  ) {
    return true;
  }

  try {
    const parsed = new URL(urlString);

    // Only allow secure HTTP protocols
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // Direct match against known hosts
    if (ALLOWED_INTERNAL_HOSTNAMES.has(hostname)) {
      return true;
    }

    // Subdomains of youtube.com (e.g. studio.youtube.com, kids.youtube.com)
    if (hostname.endsWith('.youtube.com')) {
      const parts = hostname.split('.');
      // Check that the root domain is strictly youtube.com
      if (parts.length >= 3 && parts.slice(-2).join('.') === 'youtube.com') {
        return true;
      }
    }

    // Google login / auth redirection endpoints
    if (hostname.endsWith('.google.com')) {
      const parts = hostname.split('.');
      if (parts.length >= 3 && parts.slice(-2).join('.') === 'google.com') {
        const subdomain = parts.slice(0, -2).join('.');
        if (
          subdomain === 'accounts' ||
          subdomain === 'myaccount' ||
          subdomain === 'policies' ||
          subdomain === 'support' ||
          subdomain === 'consent'
        ) {
          return true;
        }
      }
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Extracts a YouTube video ID from various URL formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://www.youtube.com/shorts/VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - https://www.youtube.com/live/VIDEO_ID
 */
export function extractVideoId(urlOrString: string | URL): string | null {
  try {
    const parsed = typeof urlOrString === 'string' ? new URL(urlOrString) : urlOrString;
    const hostname = parsed.hostname.toLowerCase();

    // Standard watch URL: /watch?v=...
    if (hostname.includes('youtube.com')) {
      if (parsed.pathname === '/watch') {
        const v = parsed.searchParams.get('v');
        if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) {
          return v;
        }
      }

      // Shorts URL: /shorts/...
      const shortsMatch = parsed.pathname.match(/^\/shorts\/([a-zA-Z0-9_-]{11})/);
      if (shortsMatch) {
        return shortsMatch[1];
      }

      // Embed URL: /embed/...
      const embedMatch = parsed.pathname.match(/^\/embed\/([a-zA-Z0-9_-]{11})/);
      if (embedMatch) {
        return embedMatch[1];
      }

      // Live URL: /live/...
      const liveMatch = parsed.pathname.match(/^\/live\/([a-zA-Z0-9_-]{11})/);
      if (liveMatch) {
        return liveMatch[1];
      }
    }

    // Shortened URL: youtu.be/VIDEO_ID
    if (hostname === 'youtu.be') {
      const shortId = parsed.pathname.slice(1).split('/')[0].split('?')[0];
      if (/^[a-zA-Z0-9_-]{11}$/.test(shortId)) {
        return shortId;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Builds YouTube search URL given a query string.
 */
export function getSearchUrl(query: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query.trim())}`;
}

export function getHomeUrl(): string {
  return 'https://www.youtube.com/';
}

export function getSubscriptionsUrl(): string {
  return 'https://www.youtube.com/feed/subscriptions';
}

export function getLibraryUrl(): string {
  return 'https://www.youtube.com/feed/you';
}

export function getHistoryUrl(): string {
  return 'https://www.youtube.com/feed/history';
}
