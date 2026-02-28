/**
 * Image utilities for CORS-safe image conversion.
 *
 * Used by exportService.ts and any component that needs to convert
 * external images to base64 data URLs for canvas/export operations.
 */

/**
 * Fetch an image through a CORS proxy chain and return as base64 data URL.
 * Tries multiple proxies with a 12s timeout per attempt.
 */
export async function proxyFetchAsBase64(url: string): Promise<string> {
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  ];

  for (let i = 0; i < proxies.length; i++) {
    const proxyUrl = proxies[i];

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(proxyUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) continue;

      const blob = await response.blob();

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to read blob'));
          }
        };
        reader.onerror = () => reject(new Error('FileReader error'));
        reader.readAsDataURL(blob);
      });
    } catch (_err) {
      continue;
    }
  }

  throw new Error('All proxies failed for image fetch');
}

/**
 * Convert an external image URL to a base64 data URL to bypass CORS restrictions.
 * This is essential for html-to-image export functionality.
 */
export async function convertImageToBase64(url: string): Promise<string> {
  try {
    return await proxyFetchAsBase64(url);
  } catch (_error) {
    return '';
  }
}

/**
 * Load and convert multiple images to base64.
 */
export async function loadImagesAsBase64(urls: string[]): Promise<string[]> {
  return Promise.all(urls.map(url => convertImageToBase64(url)));
}
