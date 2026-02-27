import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  Download,
  TrendingUp,
  Activity,
  Menu,
  X,
  BarChart3,
  DollarSign,
  Sparkles,
  ListIcon,
  Target
} from 'lucide-react';
import { Button } from './ui/button';
import xLogo from '../../assets/logo.jpg';

interface LayoutProps {
  children: React.ReactNode;
  currentPage?: string;
  onNavigate?: (page: string) => void;
  activePageId?: string;
}

const navigationItems = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { id: 'comparison', name: 'Player Comparison', icon: Users },
  { id: 'fixtures', name: 'Fixtures', icon: TrendingUp },
  { id: 'fdr-fixtures', name: 'Team Fixtures (FDR)', icon: Activity },
  { id: 'price-changes', name: 'Price Changes', icon: DollarSign },
  { id: 'export-cards', name: 'Export Cards', icon: Download },
  { id: 'analytics', name: 'Analytics', icon: BarChart3 },
  { id: 'creator-hub', name: 'Creator Hub', icon: Sparkles },
  { id: 'player-stats', name: 'Player Stats', icon: ListIcon },
  { id: 'team-planner', name: 'Team Planner Studio', icon: Target },
];

export function DashboardLayout({ children, currentPage = 'Dashboard', onNavigate, activePageId }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-3 sm:px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <span className="text-white font-bold text-sm">FD</span>
          </div>
          <div>
            <span className="font-bold text-gray-900 text-sm sm:text-base">FPL Dave</span>
            <div className="text-xs text-gray-500 hidden sm:block">Analytics Hub</div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="touch-manipulation"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-72 sm:w-64 bg-gray-900 text-white z-40
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="p-4 sm:p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
              <span className="text-white font-bold">FD</span>
            </div>
            <div>
              <div className="font-bold text-base sm:text-lg">FPL Dave</div>
              <div className="text-xs text-gray-400">Analytics Hub</div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 sm:p-4 space-y-1 sm:space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePageId === item.id;

            return (
              <button
                key={item.id}
                className={`
                  w-full flex items-center gap-3 px-3 sm:px-4 py-3 rounded-lg
                  transition-colors font-medium text-sm touch-manipulation
                  ${isActive
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white active:bg-gray-700'
                  }
                `}
                onClick={() => {
                  onNavigate && onNavigate(item.id);
                  setSidebarOpen(false);
                }}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="truncate">{item.name}</span>
              </button>
            );
          })}
        </nav>

        {/* X Logo */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-800 bg-gray-950">
          <div className="p-3 sm:p-4">
            <a
              href="https://twitter.com/FPL_Dave_"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 hover:opacity-80 transition-opacity touch-manipulation"
            >
              <img src={xLogo} alt="FPL Dave" className="w-10 h-10 rounded-full" />
              <div className="text-xs text-gray-400">
                <div className="font-bold text-white">@FPL_Dave_</div>
                <div>Follow on X</div>
              </div>
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`lg:ml-64 min-h-screen ${sidebarOpen ? 'blur-sm lg:blur-none' : ''}`}>
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 px-3 sm:px-4 md:px-6 py-3 sm:py-4 mt-14 lg:mt-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{currentPage}</h1>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">
                2025/26 Season
              </p>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-3 sm:p-4 md:p-6">
          {children}
        </div>

        {/* Footer */}
        <footer className="border-t border-gray-200 mt-auto">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
              <div className="text-center md:text-left">
                <div className="text-xs sm:text-sm text-gray-600">
                  Created by <span className="font-bold text-purple-600">@FPL_Dave_</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  FPL Analytics Hub © 2026
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                <a
                  href="https://twitter.com/FPL_Dave_"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-purple-600 transition-colors font-medium touch-manipulation"
                >
                  Follow on X
                </a>
                <div className="text-gray-400">
                  Data from FPL API
                </div>
              </div>
            </div>
          </div>
        </footer>
      </main>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}