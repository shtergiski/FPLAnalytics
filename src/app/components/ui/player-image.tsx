import React, { useState, useEffect } from 'react';
import { FPLImages } from '../../utils/corsProxy';

type PhotoSize = '40x40' | '110x140' | '250x250';

interface PlayerImageProps {
  code: number;
  teamCode: number;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  photoSize?: PhotoSize;
  className?: string;
}

const SIZE_MAP: Record<string, string> = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
};

/**
 * Three-tier fallback player image: photo → team badge → hidden.
 * Note: crossOrigin is NOT set because the CDN does not send CORS headers.
 * Export/canvas safety is handled by the proxy fallback in exportService.
 */
export function PlayerImage({
  code,
  teamCode,
  alt,
  size = 'md',
  photoSize = '110x140',
  className = '',
}: PlayerImageProps) {
  // 0 = photo, 1 = badge, 2 = hidden
  const [tier, setTier] = useState(0);

  // Reset when player changes
  useEffect(() => {
    setTier(0);
  }, [code]);

  if (tier >= 2) return null;

  const src =
    tier === 0
      ? FPLImages.playerPhoto(code, photoSize)
      : FPLImages.teamBadge(teamCode);

  return (
    <img
      src={src}
      alt={alt}
      className={`object-cover object-top ${SIZE_MAP[size] || ''} ${className}`}
      onError={() => setTier((prev) => prev + 1)}
    />
  );
}
