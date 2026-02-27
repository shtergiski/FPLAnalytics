/**
 * Convert an external image URL to a base64 data URL to bypass CORS restrictions
 * This is essential for html-to-image export functionality
 */
export async function convertImageToBase64(url: string): Promise<string> {
  try {
    // Try using CORS proxy
    const corsProxy = 'https://corsproxy.io/?';
    const proxyUrl = corsProxy + encodeURIComponent(url);
    
    const response = await fetch(proxyUrl);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to convert image:', error);
    // Return empty string if conversion fails
    return '';
  }
}

/**
 * Load and convert multiple images to base64
 */
export async function loadImagesAsBase64(urls: string[]): Promise<string[]> {
  return Promise.all(urls.map(url => convertImageToBase64(url)));
}
