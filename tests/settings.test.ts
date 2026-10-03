import { describe, it, expect } from 'vitest';
import {
  DEFAULT_SETTINGS,
  validateSettings,
  AppSettings,
  VALID_SPONSOR_CATEGORIES,
} from '../src/settings';

describe('Settings Validation & Defaults', () => {
  it('provides complete and sensible defaults', () => {
    expect(DEFAULT_SETTINGS.launchMaximized).toBe(false);
    expect(DEFAULT_SETTINGS.minimizeToTray).toBe(false);
    expect(DEFAULT_SETTINGS.closeToTray).toBe(false);
    expect(DEFAULT_SETTINGS.openExternalLinksInBrowser).toBe(true);

    expect(DEFAULT_SETTINGS.hideShorts).toBe(true);
    expect(DEFAULT_SETTINGS.hideComments).toBe(false);
    expect(DEFAULT_SETTINGS.hideRecommendations).toBe(false);
    expect(DEFAULT_SETTINGS.hideHomeRecommendations).toBe(false);
    expect(DEFAULT_SETTINGS.hideMerchPromo).toBe(true);

    expect(DEFAULT_SETTINGS.sponsorBlockEnabled).toBe(true);
    // Requirement: Default: only "sponsor" enabled
    expect(DEFAULT_SETTINGS.sponsorCategories).toEqual(['sponsor']);

    expect(DEFAULT_SETTINGS.defaultPlaybackSpeed).toBe(1);
    expect(DEFAULT_SETTINGS.preferredQuality).toBe('Auto');
    expect(DEFAULT_SETTINGS.theme).toBe('system');
    expect(DEFAULT_SETTINGS.compactSidebar).toBe(false);
    expect(DEFAULT_SETTINGS.reduceAnimations).toBe(false);
    expect(DEFAULT_SETTINGS.devToolsEnabled).toBe(false);
  });

  it('falls back to defaults when receiving null or invalid objects', () => {
    expect(validateSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(validateSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(validateSettings('corrupted string')).toEqual(DEFAULT_SETTINGS);
    expect(validateSettings([1, 2, 3])).toEqual(DEFAULT_SETTINGS);
    expect(validateSettings({})).toEqual(DEFAULT_SETTINGS);
  });

  it('preserves valid custom values and merges with defaults', () => {
    const custom: Partial<AppSettings> = {
      hideShorts: false,
      hideComments: true,
      defaultPlaybackSpeed: 1.5,
      preferredQuality: '1080p',
      theme: 'dark',
      sponsorCategories: ['sponsor', 'selfpromo', 'interaction'],
    };

    const validated = validateSettings(custom);
    expect(validated.hideShorts).toBe(false);
    expect(validated.hideComments).toBe(true);
    expect(validated.defaultPlaybackSpeed).toBe(1.5);
    expect(validated.preferredQuality).toBe('1080p');
    expect(validated.theme).toBe('dark');
    expect(validated.sponsorCategories).toEqual(['sponsor', 'selfpromo', 'interaction']);
    // Untouched properties stay as defaults
    expect(validated.openExternalLinksInBrowser).toBe(true);
    expect(validated.launchMaximized).toBe(false);
  });

  it('clamps and sanitizes invalid values safely', () => {
    const invalidInput = {
      defaultPlaybackSpeed: 100, // Excessive speed
      preferredQuality: '8K_SUPER_HD', // Non-standard quality
      theme: 'neon-cyberpunk', // Invalid theme
      sponsorCategories: ['malicious_cat', 'sponsor', 'hacker'],
    };

    const validated = validateSettings(invalidInput);
    expect(validated.defaultPlaybackSpeed).toBe(DEFAULT_SETTINGS.defaultPlaybackSpeed);
    expect(validated.preferredQuality).toBe(DEFAULT_SETTINGS.preferredQuality);
    expect(validated.theme).toBe(DEFAULT_SETTINGS.theme);
    // Filters out invalid categories while keeping valid ones
    expect(validated.sponsorCategories).toEqual(['sponsor']);
  });

  it('contains only permitted SponsorBlock categories', () => {
    const validSet = new Set(VALID_SPONSOR_CATEGORIES);
    for (const cat of DEFAULT_SETTINGS.sponsorCategories) {
      expect(validSet.has(cat as (typeof VALID_SPONSOR_CATEGORIES)[number])).toBe(true);
    }
  });
});
