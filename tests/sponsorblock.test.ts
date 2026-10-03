import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SponsorBlockManager } from '../src/sponsorblock';

describe('SponsorBlock Manager & API Parsing', () => {
  let manager: SponsorBlockManager;

  beforeEach(() => {
    manager = new SponsorBlockManager();
  });

  afterEach(() => {
    manager.cleanup();
    vi.restoreAllMocks();
  });

  it('correctly parses and filters valid segment payloads', async () => {
    const mockApiResponse = [
      {
        category: 'sponsor',
        segment: [15.2, 45.8],
        UUID: 'uuid-1',
        actionType: 'skip',
      },
      {
        category: 'selfpromo',
        segment: [120.0, 140.5],
        UUID: 'uuid-2',
        actionType: 'skip',
      },
      {
        // Malformed segment (end before start)
        category: 'sponsor',
        segment: [50.0, 10.0],
        UUID: 'uuid-3',
        actionType: 'skip',
      },
    ];

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockApiResponse,
    } as Response);

    manager.setEnabled(true);
    manager.setCategories(['sponsor']);

    const segments = await manager.loadSegments('testVideo123');
    expect(segments.length).toBe(1);
    expect(segments[0].category).toBe('sponsor');
    expect(segments[0].segment).toEqual([15.2, 45.8]);
    expect(segments[0].UUID).toBe('uuid-1');
  });

  it('handles multiple allowed categories', async () => {
    const mockApiResponse = [
      { category: 'sponsor', segment: [10, 20], UUID: '1', actionType: 'skip' },
      { category: 'selfpromo', segment: [30, 40], UUID: '2', actionType: 'skip' },
      { category: 'interaction', segment: [50, 60], UUID: '3', actionType: 'skip' },
      { category: 'intro', segment: [0, 5], UUID: '4', actionType: 'skip' },
    ];

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockApiResponse,
    } as Response);

    manager.setEnabled(true);
    manager.setCategories(['sponsor', 'intro']);

    const segments = await manager.loadSegments('testVideoMulti');
    expect(segments.length).toBe(2);
    expect(segments.map((s) => s.category)).toEqual(['sponsor', 'intro']);
  });

  it('handles 404 (no segments found) gracefully', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    manager.setEnabled(true);
    const segments = await manager.loadSegments('noSegmentsVideo');
    expect(segments).toEqual([]);
  });

  it('handles network failure without throwing', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));

    manager.setEnabled(true);
    const segments = await manager.loadSegments('networkErrorVideo');
    expect(segments).toEqual([]);
  });

  it('caches segments for subsequent calls', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [
        { category: 'sponsor', segment: [10, 20], UUID: 'c1', actionType: 'skip' },
      ],
    } as Response);

    manager.setEnabled(true);
    manager.setCategories(['sponsor']);

    await manager.loadSegments('cachedVideo');
    await manager.loadSegments('cachedVideo');

    // Fetch should only be called once due to in-memory caching
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
