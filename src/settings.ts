/**
 * Settings Management for Better-YT
 */

export interface AppSettings {
  // General
  launchMaximized: boolean;
  minimizeToTray: boolean;
  closeToTray: boolean;
  openExternalLinksInBrowser: boolean;

  // Content
  hideShorts: boolean;
  hideComments: boolean;
  hideRecommendations: boolean;
  hideHomeRecommendations: boolean;
  hideMerchPromo: boolean;
  sponsorBlockEnabled: boolean;
  sponsorCategories: string[];

  // Playback
  defaultPlaybackSpeed: number;
  preferredQuality: 'Auto' | '720p' | '1080p' | '1440p' | '2160p';

  // Appearance
  theme: 'system' | 'dark' | 'light';
  compactSidebar: boolean;
  reduceAnimations: boolean;

  // Advanced
  devToolsEnabled: boolean;
}

export const VALID_SPONSOR_CATEGORIES = [
  'sponsor',
  'selfpromo',
  'interaction',
  'intro',
  'outro',
  'preview',
] as const;

export type SponsorCategory = (typeof VALID_SPONSOR_CATEGORIES)[number];

export const VALID_PLAYBACK_SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;
export const VALID_QUALITIES = ['Auto', '720p', '1080p', '1440p', '2160p'] as const;

export const DEFAULT_SETTINGS: Readonly<AppSettings> = {
  // General
  launchMaximized: false,
  minimizeToTray: false,
  closeToTray: false,
  openExternalLinksInBrowser: true,

  // Content
  hideShorts: true,
  hideComments: false,
  hideRecommendations: false,
  hideHomeRecommendations: false,
  hideMerchPromo: true,
  sponsorBlockEnabled: true,
  sponsorCategories: ['sponsor'], // Default: only "sponsor" enabled as required

  // Playback
  defaultPlaybackSpeed: 1,
  preferredQuality: 'Auto',

  // Appearance
  theme: 'system',
  compactSidebar: false,
  reduceAnimations: false,

  // Advanced
  devToolsEnabled: false,
};

const STORAGE_KEY = 'better_yt_settings_v1';

/**
 * Validates untrusted or partial data against AppSettings, clamping values
 * and providing fallback defaults for corrupted or missing fields.
 */
export function validateSettings(input: unknown): AppSettings {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ...DEFAULT_SETTINGS };
  }

  const data = input as Record<string, unknown>;

  // Helper for booleans
  const getBool = (key: keyof AppSettings, fallback: boolean): boolean => {
    return typeof data[key] === 'boolean' ? (data[key] as boolean) : fallback;
  };

  // Helper for categories
  let sponsorCategories: string[] = DEFAULT_SETTINGS.sponsorCategories;
  if (Array.isArray(data.sponsorCategories)) {
    const validSet = new Set<string>(VALID_SPONSOR_CATEGORIES);
    const filtered = data.sponsorCategories.filter(
      (cat): cat is string => typeof cat === 'string' && validSet.has(cat)
    );
    if (filtered.length > 0) {
      sponsorCategories = filtered;
    }
  }

  // Helper for playback speed
  let defaultPlaybackSpeed = DEFAULT_SETTINGS.defaultPlaybackSpeed;
  if (typeof data.defaultPlaybackSpeed === 'number') {
    if (VALID_PLAYBACK_SPEEDS.includes(data.defaultPlaybackSpeed as (typeof VALID_PLAYBACK_SPEEDS)[number])) {
      defaultPlaybackSpeed = data.defaultPlaybackSpeed;
    } else if (data.defaultPlaybackSpeed >= 0.25 && data.defaultPlaybackSpeed <= 2.0) {
      defaultPlaybackSpeed = data.defaultPlaybackSpeed;
    }
  }

  // Helper for preferred quality
  let preferredQuality = DEFAULT_SETTINGS.preferredQuality;
  if (
    typeof data.preferredQuality === 'string' &&
    VALID_QUALITIES.includes(data.preferredQuality as (typeof VALID_QUALITIES)[number])
  ) {
    preferredQuality = data.preferredQuality as (typeof VALID_QUALITIES)[number];
  }

  // Helper for theme
  let theme: 'system' | 'dark' | 'light' = DEFAULT_SETTINGS.theme;
  if (data.theme === 'system' || data.theme === 'dark' || data.theme === 'light') {
    theme = data.theme;
  }

  return {
    launchMaximized: getBool('launchMaximized', DEFAULT_SETTINGS.launchMaximized),
    minimizeToTray: getBool('minimizeToTray', DEFAULT_SETTINGS.minimizeToTray),
    closeToTray: getBool('closeToTray', DEFAULT_SETTINGS.closeToTray),
    openExternalLinksInBrowser: getBool('openExternalLinksInBrowser', DEFAULT_SETTINGS.openExternalLinksInBrowser),

    hideShorts: getBool('hideShorts', DEFAULT_SETTINGS.hideShorts),
    hideComments: getBool('hideComments', DEFAULT_SETTINGS.hideComments),
    hideRecommendations: getBool('hideRecommendations', DEFAULT_SETTINGS.hideRecommendations),
    hideHomeRecommendations: getBool('hideHomeRecommendations', DEFAULT_SETTINGS.hideHomeRecommendations),
    hideMerchPromo: getBool('hideMerchPromo', DEFAULT_SETTINGS.hideMerchPromo),
    sponsorBlockEnabled: getBool('sponsorBlockEnabled', DEFAULT_SETTINGS.sponsorBlockEnabled),
    sponsorCategories,

    defaultPlaybackSpeed,
    preferredQuality,

    theme,
    compactSidebar: getBool('compactSidebar', DEFAULT_SETTINGS.compactSidebar),
    reduceAnimations: getBool('reduceAnimations', DEFAULT_SETTINGS.reduceAnimations),

    devToolsEnabled: getBool('devToolsEnabled', DEFAULT_SETTINGS.devToolsEnabled),
  };
}

type SettingsListener = (settings: AppSettings) => void;

class SettingsManager {
  private currentSettings: AppSettings = { ...DEFAULT_SETTINGS };
  private listeners: Set<SettingsListener> = new Set();
  private initialized = false;

  public async init(): Promise<AppSettings> {
    if (this.initialized) {
      return this.currentSettings;
    }

    try {
      // Check if running inside Tauri
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const { invoke } = await import('@tauri-apps/api/core');
        const remoteSettings = await invoke<unknown>('get_settings');
        this.currentSettings = validateSettings(remoteSettings);
      } else {
        // Fallback to localStorage for browser testing
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          this.currentSettings = validateSettings(JSON.parse(raw));
        }
      }
    } catch {
      // In case of error, fall back gracefully to defaults
      this.currentSettings = { ...DEFAULT_SETTINGS };
    }

    this.initialized = true;
    return this.currentSettings;
  }

  public getSettings(): AppSettings {
    return { ...this.currentSettings };
  }

  public async updateSettings(newSettings: Partial<AppSettings>): Promise<AppSettings> {
    const merged = validateSettings({
      ...this.currentSettings,
      ...newSettings,
    });

    this.currentSettings = merged;

    // Persist
    try {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const { invoke } = await import('@tauri-apps/api/core');
        await invoke('save_settings', { settings: merged });
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      }
    } catch (err) {
      // Fallback to localStorage if Tauri command fails
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
      } catch {
        // Ignore storage quotas or restrictions
      }
      console.warn('Failed to save settings via Tauri IPC, cached locally:', err);
    }

    // Notify subscribers
    for (const listener of this.listeners) {
      try {
        listener(this.currentSettings);
      } catch (err) {
        console.error('Settings listener error:', err);
      }
    }

    return this.currentSettings;
  }

  public subscribe(listener: SettingsListener): () => void {
    this.listeners.add(listener);
    // Call immediately with current settings
    listener(this.currentSettings);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const settingsManager = new SettingsManager();
