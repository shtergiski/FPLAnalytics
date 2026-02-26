import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
}

export function Loading({ 
  message = 'Loading data...', 
  size = 'md',
  fullScreen = false 
}: LoadingProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <Loader2 
          className={`${sizeClasses[size]} text-cyan-500 animate-spin`} 
          strokeWidth={3}
        />
        <div className="absolute inset-0 blur-xl bg-cyan-500/20 animate-pulse" />
      </div>
      {message && (
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-700 animate-pulse">
            {message}
          </p>
          <div className="flex gap-1 justify-center mt-2">
            <span className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      {content}
    </div>
  );
}

export function LoadingOverlay({ 
  message = 'Loading...', 
  show 
}: { 
  message?: string; 
  show: boolean 
}) {
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-md">
      <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-cyan-200">
        <Loading message={message} size="lg" />
      </div>
    </div>
  );
}
