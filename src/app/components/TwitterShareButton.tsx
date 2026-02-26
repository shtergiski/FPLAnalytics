import React from 'react';
import { Button } from './ui/button';
import { Share2 } from 'lucide-react';
import { shareToTwitter } from '../utils/cardThemes';

interface TwitterShareButtonProps {
  text: string;
  hashtags?: string[];
  className?: string;
}

export function TwitterShareButton({ text, hashtags = ['FPL', 'FantasyPL'], className = '' }: TwitterShareButtonProps) {
  const handleShare = () => {
    shareToTwitter(text, hashtags);
  };

  return (
    <Button 
      onClick={handleShare}
      variant="outline"
      className={`bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white border-[#1DA1F2] ${className}`}
    >
      <Share2 className="w-4 h-4 mr-2" />
      Share on X (Twitter)
    </Button>
  );
}
