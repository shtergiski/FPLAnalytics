import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { FPLImages } from '../../utils/corsProxy';

interface TeamBadgeProps {
  teamCode: number;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP: Record<string, { img: string; icon: number }> = {
  sm: { img: 'w-6 h-6', icon: 16 },
  md: { img: 'w-8 h-8', icon: 20 },
  lg: { img: 'w-10 h-10', icon: 24 },
};

/**
 * Team badge with fallback to a Shield icon.
 * Note: crossOrigin is NOT set because the badge CDN does not send CORS headers.
 * Export/canvas safety is handled by the proxy fallback in exportService.
 */
export function TeamBadge({ teamCode, alt, size = 'md', className = '' }: TeamBadgeProps) {
  const [failed, setFailed] = useState(false);
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md;

  if (failed) {
    return (
      <Shield
        className={`text-gray-400 ${sizeConfig.img} ${className}`}
        size={sizeConfig.icon}
      />
    );
  }

  return (
    <img
      src={FPLImages.teamBadge(teamCode)}
      alt={alt}
      className={`${sizeConfig.img} ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
