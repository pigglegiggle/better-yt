import { describe, it, expect } from 'vitest';
import {
  isInternalUrl,
  extractVideoId,
  getSearchUrl,
  getHomeUrl,
  getSubscriptionsUrl,
  getLibraryUrl,
  getHistoryUrl,
} from '../src/utils/url';

describe('URL Hostname Classification (isInternalUrl)', () => {
  it('allows legitimate YouTube hostnames', () => {
    expect(isInternalUrl('https://www.youtube.com/')).toBe(true);
    expect(isInternalUrl('https://youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
    expect(isInternalUrl('https://m.youtube.com/feed/subscriptions')).toBe(true);
    expect(isInternalUrl('https://music.youtube.com/explore')).toBe(true);
    expect(isInternalUrl('https://studio.youtube.com/channel')).toBe(true);
  });

  it('allows Google authentication & policy endpoints', () => {
    expect(isInternalUrl('https://accounts.google.com/signin/v2')).toBe(true);
    expect(isInternalUrl('https://myaccount.google.com/')).toBe(true);
    expect(isInternalUrl('https://policies.google.com/privacy')).toBe(true);
    expect(isInternalUrl('https://consent.youtube.com/m?continue=...')).toBe(true);
    expect(isInternalUrl('https://support.google.com/youtube')).toBe(true);
  });

  it('allows in-app and local protocols', () => {
    expect(isInternalUrl('tauri://localhost/index.html')).toBe(true);
    expect(isInternalUrl('http://localhost:5173/')).toBe(true);
    expect(isInternalUrl('about:blank')).toBe(true);
  });

  it('rejects external websites', () => {
    expect(isInternalUrl('https://github.com/')).toBe(false);
    expect(isInternalUrl('https://twitter.com/')).toBe(false);
    expect(isInternalUrl('https://patreon.com/creator')).toBe(false);
    expect(isInternalUrl('https://discord.gg/invite')).toBe(false);
  });

  it('strictly blocks domain spoofing and sub-string bypass attempts', () => {
    // Malicious attacker domains with youtube in subdomain or query
    expect(isInternalUrl('https://youtube.com.attacker.com/')).toBe(false);
    expect(isInternalUrl('https://fake-youtube.com/login')).toBe(false);
    expect(isInternalUrl('https://evil.org/?url=https://youtube.com')).toBe(false);
    expect(isInternalUrl('https://google.com.phishing.com/')).toBe(false);
    expect(isInternalUrl('https://unauthorized.google.com/')).toBe(false);
    expect(isInternalUrl('https://notyoutube.com')).toBe(false);
  });

  it('handles invalid or empty URLs safely', () => {
    expect(isInternalUrl('')).toBe(false);
    expect(isInternalUrl('not-a-valid-url')).toBe(false);
    expect(isInternalUrl('javascript:alert(1)')).toBe(false);
    expect(isInternalUrl('data:text/html,test')).toBe(false);
  });
});

describe('YouTube Video ID Extraction (extractVideoId)', () => {
  it('extracts ID from standard watch URLs', () => {
    expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractVideoId('https://youtube.com/watch?v=jNQXAC9IVRw&t=42s')).toBe('jNQXAC9IVRw');
  });

  it('extracts ID from Shorts URLs', () => {
    expect(extractVideoId('https://www.youtube.com/shorts/3jz_e3HwP2k')).toBe('3jz_e3HwP2k');
    expect(extractVideoId('https://youtube.com/shorts/abcdef12345?feature=share')).toBe('abcdef12345');
  });

  it('extracts ID from youtu.be short links', () => {
    expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ?t=10')).toBe('dQw4w9WgXcQ');
  });

  it('extracts ID from Embed and Live URLs', () => {
    expect(extractVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    expect(extractVideoId('https://www.youtube.com/live/jfKfPfyJRdk')).toBe('jfKfPfyJRdk');
  });

  it('returns null for non-video or invalid URLs', () => {
    expect(extractVideoId('https://www.youtube.com/')).toBeNull();
    expect(extractVideoId('https://www.youtube.com/feed/subscriptions')).toBeNull();
    expect(extractVideoId('https://www.youtube.com/watch?v=invalid_short_id')).toBeNull();
    expect(extractVideoId('https://example.com/watch?v=dQw4w9WgXcQ')).toBeNull();
    expect(extractVideoId('')).toBeNull();
  });
});

describe('Navigation URL Generation', () => {
  it('encodes search queries properly', () => {
    expect(getSearchUrl('lofi music')).toBe('https://www.youtube.com/results?search_query=lofi%20music');
    expect(getSearchUrl('rust & tauri v2')).toBe('https://www.youtube.com/results?search_query=rust%20%26%20tauri%20v2');
    expect(getSearchUrl('  trimmed  ')).toBe('https://www.youtube.com/results?search_query=trimmed');
  });

  it('generates standard navigation URLs', () => {
    expect(getHomeUrl()).toBe('https://www.youtube.com/');
    expect(getSubscriptionsUrl()).toBe('https://www.youtube.com/feed/subscriptions');
    expect(getLibraryUrl()).toBe('https://www.youtube.com/feed/you');
    expect(getHistoryUrl()).toBe('https://www.youtube.com/feed/history');
  });
});
