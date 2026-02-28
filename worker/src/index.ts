/**
 * FPL API Proxy — Cloudflare Worker
 *
 * Proxies requests to the Fantasy Premier League API, adding proper
 * CORS headers so the React frontend can call it directly.
 *
 * Routes:
 *   GET /api/*  →  https://fantasy.premierleague.com/api/*
 *
 * Deploy:
 *   cd worker && npx wrangler deploy
 */

interface Env {
  FPL_API_BASE: string;
  FPL_IMG_BASE: string;
}

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
  // Add your production domain here, e.g.:
  // 'https://fpl-analytics.pages.dev',
  // 'https://yourdomain.com',
];

function getCorsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get('Origin') || '';
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Max-Age': '86400',
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const corsHeaders = getCorsHeaders(request);

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // Only allow GET
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405, headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Image proxy: /img/* → fantasy.premierleague.com/dist/img/*
    if (path.startsWith('/img/')) {
      const imgBase = env.FPL_IMG_BASE || 'https://fantasy.premierleague.com';
      const imgUrl = `${imgBase}/dist${path}`;

      try {
        const imgResponse = await fetch(imgUrl, {
          headers: { 'User-Agent': 'FPL-Analytics-Proxy/1.0' },
        });

        const responseHeaders = new Headers(imgResponse.headers);
        for (const [key, value] of Object.entries(corsHeaders)) {
          responseHeaders.set(key, value);
        }
        responseHeaders.set('Cache-Control', 'public, max-age=86400');

        return new Response(imgResponse.body, {
          status: imgResponse.status,
          headers: responseHeaders,
        });
      } catch (_err) {
        return new Response('Failed to fetch image', {
          status: 502,
          headers: corsHeaders,
        });
      }
    }

    // Must start with /api/
    if (!path.startsWith('/api/')) {
      return new Response('Not found. Use /api/* or /img/* to proxy FPL endpoints.', {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Strip the cache-buster param before forwarding to FPL
    url.searchParams.delete('_cb');

    // Build the FPL API URL
    const fplPath = path; // /api/bootstrap-static/ etc.
    const fplUrl = `${env.FPL_API_BASE}${fplPath.replace('/api', '')}${url.search}`;

    try {
      const fplResponse = await fetch(fplUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'FPL-Analytics-Proxy/1.0',
        },
      });

      // Clone response and add CORS headers
      const responseHeaders = new Headers(fplResponse.headers);
      for (const [key, value] of Object.entries(corsHeaders)) {
        responseHeaders.set(key, value);
      }

      // Add cache control — live data gets short cache, static data gets longer
      if (path.includes('/live/')) {
        responseHeaders.set('Cache-Control', 'public, max-age=30');
      } else if (path.includes('/bootstrap-static/')) {
        responseHeaders.set('Cache-Control', 'public, max-age=300');
      } else {
        responseHeaders.set('Cache-Control', 'public, max-age=60');
      }

      return new Response(fplResponse.body, {
        status: fplResponse.status,
        headers: responseHeaders,
      });
    } catch (_err) {
      return new Response(
        JSON.stringify({ error: 'Failed to fetch from FPL API' }),
        {
          status: 502,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        },
      );
    }
  },
};
