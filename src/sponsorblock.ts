/**
 * SponsorBlock Integration for Better-YT
 * Connects to the public SponsorBlock API and skips configured segment categories.
 */

import { showToast } from './ui/toast';

export interface SponsorSegment {
  category: string;
  segment: [number, number]; // [start, end] in seconds
  UUID: string;
  actionType: string;
}

interface CacheEntry {
  segments: SponsorSegment[];
  timestamp: number;
}

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache
const API_BASE_URL = 'https://sponsor.ajay.app/api/skipSegments';

export class SponsorBlockManager {
  private cache: Map<string, CacheEntry> = new Map();
  private currentVideoId: string | null = null;
  private currentSegments: SponsorSegment[] = [];
  private videoElement: HTMLVideoElement | null = null;
  private isEnabled = true;
  private allowedCategories: Set<string> = new Set(['sponsor']);
  private skippedUuidsForPlayback: Set<string> = new Set();
  private isProcessing = false;
  private unskipState: { previousTime: number; segment: SponsorSegment } | null = null;

  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.currentSegments = [];
    }
  }

  public setCategories(categories: string[]): void {
    this.allowedCategories = new Set(categories);
    // Invalidate current segments to reload with new categories if video active
    if (this.currentVideoId) {
      this.loadSegments(this.currentVideoId);
    }
  }

  /**
   * Called when a new video starts or navigation occurs.
   */
  public async handleVideoChange(videoId: string | null, videoEl: HTMLVideoElement | null): Promise<void> {
    this.currentVideoId = videoId;
    this.videoElement = videoEl;
    this.skippedUuidsForPlayback.clear();
    this.currentSegments = [];
    this.unskipState = null;

    if (!this.isEnabled || !videoId || !videoEl) {
      return;
    }

    // Check if livestream (duration is Infinity)
    if (!isFinite(videoEl.duration) || document.querySelector('.ytp-live')) {
      return;
    }

    await this.loadSegments(videoId);
    this.attachPlaybackListener(videoEl);
  }

  /**
   * Fetches segments from SponsorBlock API or in-memory cache.
   */
  public async loadSegments(videoId: string): Promise<SponsorSegment[]> {
    if (!this.isEnabled || this.allowedCategories.size === 0) {
      return [];
    }

    // Check cache
    const cached = this.cache.get(videoId);
    const now = Date.now();
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      this.currentSegments = this.filterSegments(cached.segments);
      return this.currentSegments;
    }

    try {
      const categoriesParam = encodeURIComponent(JSON.stringify(Array.from(this.allowedCategories)));
      const url = `${API_BASE_URL}?videoID=${encodeURIComponent(videoId)}&categories=${categoriesParam}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (response.status === 404) {
        // No segments for this video
        this.cache.set(videoId, { segments: [], timestamp: now });
        this.currentSegments = [];
        return [];
      }

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      if (!Array.isArray(data)) {
        return [];
      }

      const parsed: SponsorSegment[] = [];
      for (const item of data) {
        if (
          item &&
          typeof item === 'object' &&
          Array.isArray(item.segment) &&
          item.segment.length === 2 &&
          typeof item.segment[0] === 'number' &&
          typeof item.segment[1] === 'number' &&
          typeof item.category === 'string'
        ) {
          parsed.push({
            category: item.category,
            segment: [item.segment[0], item.segment[1]],
            UUID: typeof item.UUID === 'string' ? item.UUID : `${item.segment[0]}-${item.segment[1]}`,
            actionType: typeof item.actionType === 'string' ? item.actionType : 'skip',
          });
        }
      }

      this.cache.set(videoId, { segments: parsed, timestamp: now });
      this.currentSegments = this.filterSegments(parsed);
      return this.currentSegments;
    } catch {
      // Network failure, abort, or offline - fail gracefully without breaking video
      return [];
    }
  }

  private filterSegments(segments: SponsorSegment[]): SponsorSegment[] {
    return segments.filter(
      (s) => this.allowedCategories.has(s.category) && s.segment[1] > s.segment[0]
    );
  }

  private attachPlaybackListener(videoEl: HTMLVideoElement): void {
    // Prevent duplicate event listeners
    videoEl.removeEventListener('timeupdate', this.onTimeUpdate);
    videoEl.addEventListener('timeupdate', this.onTimeUpdate);
  }

  private onTimeUpdate = (): void => {
    if (!this.isEnabled || !this.videoElement || this.isProcessing || this.currentSegments.length === 0) {
      return;
    }

    const currentTime = this.videoElement.currentTime;

    for (const segment of this.currentSegments) {
      const [start, end] = segment.segment;

      // If playback is inside a segment
      if (currentTime >= start && currentTime < end - 0.2) {
        // Prevent loop if user recently unskipped this segment
        if (this.skippedUuidsForPlayback.has(segment.UUID)) {
          continue;
        }

        this.isProcessing = true;
        this.skippedUuidsForPlayback.add(segment.UUID);

        const prevTime = this.videoElement.currentTime;
        this.videoElement.currentTime = end;
        this.unskipState = { previousTime: prevTime, segment };

        // Pretty format category name
        const categoryLabel = this.formatCategoryName(segment.category);
        const durationSec = Math.round(end - start);

        showToast({
          message: `Skipped ${categoryLabel} (${durationSec}s)`,
          actionLabel: 'Unskip',
          onAction: () => {
            if (this.videoElement && this.unskipState) {
              this.videoElement.currentTime = this.unskipState.previousTime;
              this.unskipState = null;
            }
          },
          durationMs: 4500,
        });

        this.isProcessing = false;
        break;
      }
    }
  };

  private formatCategoryName(category: string): string {
    switch (category) {
      case 'sponsor':
        return 'Sponsor';
      case 'selfpromo':
        return 'Self Promotion';
      case 'interaction':
        return 'Interaction Reminder';
      case 'intro':
        return 'Intermission / Intro';
      case 'outro':
        return 'Endcards / Outro';
      case 'preview':
        return 'Preview / Recap';
      default:
        return category.charAt(0).toUpperCase() + category.slice(1);
    }
  }

  public cleanup(): void {
    if (this.videoElement) {
      this.videoElement.removeEventListener('timeupdate', this.onTimeUpdate);
      this.videoElement = null;
    }
    this.currentSegments = [];
    this.skippedUuidsForPlayback.clear();
  }
}

export const sponsorBlockManager = new SponsorBlockManager();
