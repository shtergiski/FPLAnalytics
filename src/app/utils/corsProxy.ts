// CORS Proxy utility - matches working Claude app implementation
// Tries multiple proxies in sequence with better error handling

async function fetchProxy(url: string): Promise<Response> {
  // Try direct fetch first (in case CORS is allowed)
  try {
    console.log(`🔗 Attempting direct fetch (no proxy)...`);
    const directResponse = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });
    if (directResponse.ok) {
      console.log(`✅ Direct fetch succeeded!`);
      return directResponse;
    }
  } catch (error: any) {
    console.log(`ℹ️ Direct fetch blocked (expected):`, error.message);
  }

  // Multiple proxies for better reliability
  const proxies = [
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    `https://thingproxy.freeboard.io/fetch/${url}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  ];
  
  console.log(`🌐 Attempting to fetch via proxies...`);
  
  for (let i = 0; i < proxies.length; i++) {
    const proxyUrl = proxies[i];
    const proxyName = i === 0 ? 'codetabs.com' : i === 1 ? 'thingproxy' : i === 2 ? 'corsproxy.io' : 'allorigins.win';
    
    try {
      console.log(`📡 Trying proxy ${i + 1}/${proxies.length}: ${proxyName}`);
      
      // Create timeout promise
      const timeoutPromise = new Promise<Response>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 15000);
      });
      
      // Create fetch promise
      const fetchPromise = fetch(proxyUrl, {
        headers: {
          'Accept': 'application/json',
        },
      });
      
      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (response.ok) {
        console.log(`✅ Success with ${proxyName}`);
        return response;
      }
      
      console.warn(`❌ ${proxyName} returned HTTP ${response.status}`);
    } catch (error: any) {
      console.warn(`❌ ${proxyName} failed:`, error.message);
      // Try next proxy
      continue;
    }
  }
  
  throw new Error('All proxies failed. Please try again later.');
}

// Export the fetch proxy function for direct use
export async function corsProxyFetch(url: string): Promise<any> {
  const response = await fetchProxy(url);
  return await response.json();
}

// FPL API Service
export const FPLService = {
  async loadBootstrap() {
    const url = 'https://fantasy.premierleague.com/api/bootstrap-static/';
    const response = await fetchProxy(url);
    return await response.json();
  },

  async loadFixtures() {
    const url = 'https://fantasy.premierleague.com/api/fixtures/';
    const response = await fetchProxy(url);
    return await response.json();
  },

  async loadManager(managerId: number) {
    const url = `https://fantasy.premierleague.com/api/entry/${managerId}/`;
    const response = await fetchProxy(url);
    return await response.json();
  },

  async loadManagerTeam(managerId: number, gameweek: number) {
    const url = `https://fantasy.premierleague.com/api/entry/${managerId}/event/${gameweek}/picks/`;
    const response = await fetchProxy(url);
    return await response.json();
  },

  async loadManagerHistory(managerId: number) {
    const url = `https://fantasy.premierleague.com/api/entry/${managerId}/history/`;
    const response = await fetchProxy(url);
    return await response.json();
  },

  async loadLiveGameweek(gameweek: number) {
    const url = `https://fantasy.premierleague.com/api/event/${gameweek}/live/`;
    const response = await fetchProxy(url);
    return await response.json();
  },

  async loadPlayerDetails(playerId: number) {
    const url = `https://fantasy.premierleague.com/api/element-summary/${playerId}/`;
    const response = await fetchProxy(url);
    return await response.json();
  },

  async loadLeagueStandings(leagueId: number) {
    const url = `https://fantasy.premierleague.com/api/leagues-classic/${leagueId}/standings/`;
    const response = await fetchProxy(url);
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
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private TTL = 10 * 60 * 1000; // 10 minutes

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    
    console.log(`📦 Using cached data for: ${key}`);
    return cached.data;
  }

  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
    console.log(`💾 Cached data for: ${key}`);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const fplCache = new FPLCache();

// Image URL builders (no CORS proxy needed - browser fetches directly)
export const FPLImages = {
  // Player photo - CORS-safe (resources.premierleague.com sends Access-Control-Allow-Origin: *)
  playerPhoto(code: number | string): string {
    return `https://resources.premierleague.com/premierleague/photos/players/110x140/p${code}.png`;
  },

  // Team kit - CORS-blocked for canvas but renders fine in UI
  teamKit(teamCode: number, shirtType: 1 | 2 = 1): string {
    return `https://fantasy.premierleague.com/dist/img/shirts/standard/shirt_${teamCode}_${shirtType}-220.webp`;
  },

  // Team badge
  teamBadge(teamCode: number): string {
    return `https://resources.premierleague.com/premierleague/badges/70/t${teamCode}.png`;
  },
};