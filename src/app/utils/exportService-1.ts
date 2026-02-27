// Export Service - Handles image conversion for html-to-image
// Matches Claude app implementation for CORS-safe exports

import { toPng } from 'html-to-image';

/**
 * Converts all images in the DOM element to base64 data URLs
 * This is necessary because html-to-image can't read cross-origin images from canvas
 * 
 * Strategy 1 - Canvas extraction (for CORS-safe images):
 *   Works for player photos (resources.premierleague.com) because that CDN sends Access-Control-Allow-Origin: *
 * 
 * Strategy 2 - Proxy fetch (for CORS-blocked images):
 *   Fetches via corsproxy.io → allorigins.win fallback chain
 *   Converts blob to data URL via FileReader
 */
async function convertImages(element: HTMLElement): Promise<void> {
  // Find all <img> elements
  const images = Array.from(element.querySelectorAll('img'));

  // Find all SVG <image> elements (for kits)
  const svgImages = Array.from(element.querySelectorAll('image'));

  const allImages = [...images, ...svgImages];


  // Convert all images in parallel
  await Promise.all(allImages.map(async (img) => {
    try {
      const src = img instanceof HTMLImageElement ? img.src : img.href.baseVal;

      if (!src || src.startsWith('data:')) {
        // Already a data URL, skip
        return;
      }

      // Strategy 1: Try canvas extraction first (for CORS-safe images)
      try {
        const dataUrl = await canvasExtraction(img as HTMLImageElement);
        if (img instanceof HTMLImageElement) {
          img.src = dataUrl;
        } else {
          img.href.baseVal = dataUrl;
        }
        return;
      } catch (err) {
        // Canvas extraction failed (CORS blocked), try proxy fetch
      }

      // Strategy 2: Proxy fetch for CORS-blocked images
      try {
        const dataUrl = await proxyFetch(src);
        if (img instanceof HTMLImageElement) {
          img.src = dataUrl;
        } else {
          img.href.baseVal = dataUrl;
        }
      } catch (err) {
        // Image will be omitted from export, but don't fail the whole export
      }
    } catch (err) {
    }
  }));

}

/**
 * Strategy 1: Canvas extraction
 * Works for images with Access-Control-Allow-Origin: * header
 */
async function canvasExtraction(img: HTMLImageElement): Promise<string> {
  return new Promise((resolve, reject) => {
    // Wait for image to load if not already loaded
    if (!img.complete || img.naturalWidth === 0) {
      img.onload = () => performExtraction(img, resolve, reject);
      img.onerror = () => reject(new Error('Image failed to load'));
    } else {
      performExtraction(img, resolve, reject);
    }
  });
}

function performExtraction(
  img: HTMLImageElement,
  resolve: (value: string) => void,
  reject: (reason?: any) => void
): void {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    ctx.drawImage(img, 0, 0);
    const dataUrl = canvas.toDataURL('image/png');
    resolve(dataUrl);
  } catch (err) {
    // SecurityError thrown if image is from different origin without CORS
    reject(err);
  }
}

/**
 * Strategy 2: Proxy fetch for CORS-blocked images
 */
async function proxyFetch(url: string): Promise<string> {
  // Multiple proxies for better reliability
  const proxies = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  ];

  for (let i = 0; i < proxies.length; i++) {
    const proxyUrl = proxies[i];

    try {
      // Create timeout promise
      const timeoutPromise = new Promise<Response>((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 12000);
      });

      // Create fetch promise
      const fetchPromise = fetch(proxyUrl);

      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);

      if (!response.ok) {
        console.warn(`Proxy ${i + 1} failed with HTTP ${response.status}`);
        continue;
      }

      const blob = await response.blob();

      // Convert blob to base64 using FileReader
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
    } catch (err) {
      console.warn(`Proxy ${i + 1} failed:`, err);
      // Try next proxy
      continue;
    }
  }

  throw new Error('All proxies failed for image fetch');
}

/**
 * Main export function
 * Converts all images to base64, then exports to PNG
 */
export async function exportCard(
  element: HTMLElement,
  filename: string
): Promise<void> {
  try {

    // Step 1: Convert all images to base64 data URLs
    await convertImages(element);

    // Step 2: Export to PNG at 3x resolution
    const dataUrl = await toPng(element, {
      quality: 1.0,
      pixelRatio: 3, // 3x resolution for high quality
      cacheBust: true,
    });

    // Step 3: Download
    const link = document.createElement('a');
    link.download = `fpldave-${filename}.png`;
    link.href = dataUrl;
    link.click();

  } catch (error) {
    throw error;
  }
}

/**
 * Export service with all methods
 */
export const ExportService = {
  exportCard,

  /**
   * Export with default naming
   */
  async export(element: HTMLElement, name: string = 'card'): Promise<void> {
    const timestamp = new Date().toISOString().split('T')[0];
    await exportCard(element, `${name}-${timestamp}`);
  },
};