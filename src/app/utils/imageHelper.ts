/**
 * Image Helper - Pre-fetch and convert images to base64
 * Handles CORS issues by using proxy
 */

/**
 * Fetch image through CORS proxy and convert to base64
 */
export async function fetchImageAsBase64(imageUrl: string): Promise<string> {
  const proxies = [
    `https://corsproxy.io/?${encodeURIComponent(imageUrl)}`,
    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(imageUrl)}`,
    `https://cors-anywhere.herokuapp.com/${imageUrl}`,
  ];

  for (const proxyUrl of proxies) {
    try {
      const response = await Promise.race([
        fetch(proxyUrl, {
          method: 'GET',
          headers: {
            'Accept': 'image/png,image/*',
          }
        }),
        new Promise<Response>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout after 15s')), 15000)
        )
      ]);

      if (!response.ok) {
        console.warn(`Proxy failed with status ${response.status}`);
        continue;
      }

      const blob = await response.blob();

      // Check if we got a valid image
      if (!blob.type.startsWith('image/')) {
        console.warn(`Invalid content type: ${blob.type}`);
        continue;
      }

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('FileReader error'));
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn(`Proxy attempt failed:`, error);
      continue;
    }
  }

  // All proxies failed, return empty string (will use fallback initials)
  console.warn('All proxies failed for image:', imageUrl);
  return '';
}

/**
 * Fetch multiple images in parallel with graceful fallback
 */
export async function fetchImagesAsBase64(imageUrls: string[]): Promise<string[]> {
  // Fetch all images in parallel, but don't fail if some fail
  const results = await Promise.allSettled(
    imageUrls.map(url => fetchImageAsBase64(url))
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      console.error(`Failed to fetch image ${index}:`, result.reason);
      return ''; // Return empty string for failed images (will use fallback)
    }
  });
}