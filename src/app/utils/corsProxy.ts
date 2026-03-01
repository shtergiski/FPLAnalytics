// CORS Proxy utility
// In development: Vite proxy rewrites /fpl-api/* → fantasy.premierleague.com/api/*
// In production: Cloudflare Worker at WORKER_URL proxies all FPL API requests

const FPL_BASE = 'https://fantasy.premierleague.com/api';
const isDev = import.meta.env.DEV;

// ⚠️  After deploying the Cloudflare Worker, paste your worker URL here:
const WORKER_URL = import.meta.env.VITE_FPL_WORKER_URL || '';

/**
 * Build the URL for an FPL API path.
 * Dev  → /fpl-api/bootstrap-static/  (Vite proxy, no CORS)
 * Prod → https://your-worker.workers.dev/api/bootstrap-static/  (CF Worker, no CORS)
 */
function buildUrl(apiPath: string, bustCache: boolean): string {
  let url: string;

  if (isDev) {
    url = `/fpl-api/${apiPath}`;
  } else if (WORKER_URL) {
    // Cloudflare Worker — our own proxy, no CORS issues
    url = `${WORKER_URL}/api/${apiPath}`;
  } else {
    // Fallback: direct FPL URL (will need third-party CORS proxy)
    url = `${FPL_BASE}/${apiPath}`;
  }

  if (!bustCache) return url;
  // Minute-based versioning: data is never older than 60 seconds
  const minuteVersion = Math.floor(Date.now() / 60000);
  return `${url}${url.includes('?') ? '&' : '?'}v=${minuteVersion}`;
}

/**
 * Fetch an FPL API path, handling CORS transparently.
 */
async function fetchFPL(apiPath: string, bustCache = false): Promise<Response> {
  const url = buildUrl(apiPath, bustCache);

  // Dev (Vite proxy) or Production with Cloudflare Worker — direct fetch works
  if (isDev || WORKER_URL) {
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      cache: bustCache ? 'no-store' : 'default',
    });
    if (response.ok) return response;
    throw new Error(`FPL API error: ${response.status} ${response.statusText}`);
  }

  // Fallback: third-party CORS proxies (only if no Worker URL configured)
  // Tries the full proxy chain, then retries once after a short delay
  const proxies = [
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  ];

  const attemptProxyChain = async (): Promise<Response | null> => {
    for (const proxyUrl of proxies) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const response = await fetch(proxyUrl, {
          headers: { 'Accept': 'application/json' },
          signal: controller.signal,
          cache: bustCache ? 'no-store' : 'default',
        });

        clearTimeout(timeoutId);

        if (response.ok) return response;
      } catch (_proxyErr: unknown) {
        continue;
      }
    }
    return null;
  };

  // First attempt
  const first = await attemptProxyChain();
  if (first) return first;

  // Single retry after 5s delay (rate-limit recovery)
  await new Promise(resolve => setTimeout(resolve, 5000));
  const retry = await attemptProxyChain();
  if (retry) return retry;

  throw new Error('All proxies failed. Please try again later.');
}

// Export the fetch proxy function for direct use
export async function corsProxyFetch(url: string): Promise<unknown> {
  // For direct URL usage, extract the API path from the full FPL URL
  const apiPath = url.replace(`${FPL_BASE}/`, '');
  const response = await fetchFPL(apiPath);
  return await response.json();
}

// FPL API Service
export const FPLService = {
  async loadBootstrap() {
    const response = await fetchFPL('bootstrap-static/');
    return await response.json();
  },

  async loadFixtures(forceRefresh = false) {
    const response = await fetchFPL('fixtures/', forceRefresh);
    return await response.json();
  },

  async loadManager(managerId: number, forceRefresh = false) {
    const response = await fetchFPL(`entry/${managerId}/`, forceRefresh);
    return await response.json();
  },

  async loadManagerTeam(managerId: number, gameweek: number, forceRefresh = false) {
    const response = await fetchFPL(`entry/${managerId}/event/${gameweek}/picks/`, forceRefresh);
    return await response.json();
  },

  async loadManagerHistory(managerId: number) {
    const response = await fetchFPL(`entry/${managerId}/history/`);
    return await response.json();
  },

  async loadLiveGameweek(gameweek: number) {
    // Live data always bypasses cache
    const response = await fetchFPL(`event/${gameweek}/live/`, true);
    return await response.json();
  },

  async loadPlayerDetails(playerId: number) {
    const response = await fetchFPL(`element-summary/${playerId}/`);
    return await response.json();
  },

  async loadLeagueStandings(leagueId: number, forceRefresh = false) {
    const response = await fetchFPL(`leagues-classic/${leagueId}/standings/`, forceRefresh);
    return await response.json();
  },

  // Alias methods for backward compatibility
  getBootstrap() {
    return this.loadBootstrap();
  },

  getFixtures() {
    return this.loadFixtures();
  },

  getManager(managerId: number) {
    return this.loadManager(managerId);
  },

  getManagerTeam(managerId: number, gameweek: number) {
    return this.loadManagerTeam(managerId, gameweek);
  },

  // Team Planner Studio methods
  getEntry(managerId: number) {
    return this.loadManager(managerId);
  },

  getEntryPicks(managerId: number, gameweek: number) {
    return this.loadManagerTeam(managerId, gameweek);
  },
};

// Cache manager for FPL data
class FPLCache {
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private TTL = 10 * 60 * 1000; // 10 minutes

  get(key: string): unknown | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  set(key: string, data: unknown): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const fplCache = new FPLCache();

// Image URL builders
export const FPLImages = {
  // Player photo - CORS-safe (resources.premierleague.com sends Access-Control-Allow-Origin: *)
  playerPhoto(code: number | string, size: '40x40' | '110x140' | '250x250' = '110x140'): string {
    return `https://resources.premierleague.com/premierleague/photos/players/${size}/p${code}.png`;
  },

  // Team kit - proxied through Vite (dev) or Cloudflare Worker (prod) to avoid CORS
  teamKit(teamCode: number, shirtType: number = 1): string {
    const kitPath = `shirts/standard/shirt_${teamCode}_${shirtType}-220.webp`;
    if (isDev) {
      return `/fpl-img/${kitPath}`;
    }
    if (WORKER_URL) {
      return `${WORKER_URL}/img/${kitPath}`;
    }
    // Fallback: direct CDN (display-only, CORS-blocked for canvas)
    return `https://fantasy.premierleague.com/dist/img/${kitPath}`;
  },

  // Team badge - CORS-safe
  teamBadge(teamCode: number): string {
    return `https://resources.premierleague.com/premierleague/badges/70/t${teamCode}.png`;
  },
};
