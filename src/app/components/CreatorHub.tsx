import React, { useState, useRef } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  ImageIcon, 
  Users, 
  TrendingUp, 
  Calendar,
  Award,
  ArrowRightLeft,
  Trophy,
  Sparkles
} from 'lucide-react';
import { Player } from '../types/fpl';
import { PlayerCardsGallery } from './PlayerCardsGallery';
import { GameweekReviewBuilder } from './builders/GameweekReviewBuilder';
import { TeamLineupBuilderAdvanced } from './builders/TeamLineupBuilderAdvanced';
import { HeadToHeadBuilder } from './builders/HeadToHeadBuilder';
import { FDRFixtureBuilder } from './builders/FDRFixtureBuilder';
import { StatsInfographicBuilder } from './builders/StatsInfographicBuilder';
import { TransferSuggestionBuilder } from './builders/TransferSuggestionBuilder';
import { MiniLeagueBuilder } from './builders/MiniLeagueBuilder';

interface CreatorHubProps {
  players: Player[];
}

export function CreatorHub({ players }: CreatorHubProps) {
  const [activeBuilder, setActiveBuilder] = useState('player-cards');
  const builderContentRef = useRef<HTMLDivElement>(null);

  const builders = [
    {
      id: 'player-cards',
      name: 'Player Cards',
      icon: ImageIcon,
      description: 'Create beautiful player stat cards',
      color: 'from-purple-500 to-purple-600',
    },
    {
      id: 'gameweek-review',
      name: 'Gameweek Review',
      icon: Award,
      description: 'Design gameweek summary graphics',
      color: 'from-blue-500 to-blue-600',
    },
    {
      id: 'team-lineup',
      name: 'Team Lineup',
      icon: Users,
      description: 'Build formation-based team cards',
      color: 'from-green-500 to-green-600',
    },
    {
      id: 'head-to-head',
      name: 'Head-to-Head',
      icon: ArrowRightLeft,
      description: 'Compare two players visually',
      color: 'from-orange-500 to-orange-600',
    },
    {
      id: 'fdr-fixtures',
      name: 'Fixture Difficulty',
      icon: Calendar,
      description: 'Create FDR fixture graphics',
      color: 'from-cyan-500 to-cyan-600',
    },
    {
      id: 'stats-infographic',
      name: 'Stats Infographic',
      icon: TrendingUp,
      description: 'Design stat milestone graphics',
      color: 'from-pink-500 to-pink-600',
    },
    {
      id: 'transfer-suggestion',
      name: 'Transfer Tips',
      icon: ArrowRightLeft,
      description: 'Create transfer recommendation cards',
      color: 'from-indigo-500 to-indigo-600',
    },
    {
      id: 'mini-league',
      name: 'Mini-League Rank',
      icon: Trophy,
      description: 'Showcase league standings',
      color: 'from-yellow-500 to-yellow-600',
    },
  ];

  const handleBuilderSelect = (builderId: string) => {
    setActiveBuilder(builderId);
    
    // Scroll to builder content on mobile
    if (window.innerWidth < 1024 && builderContentRef.current) {
      setTimeout(() => {
        builderContentRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }, 100);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Creator Hub</h2>
          <p className="text-gray-600">Design stunning FPL graphics for social media</p>
        </div>
      </div>

      {/* Builder Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {builders.map((builder) => {
          const Icon = builder.icon;
          const isActive = activeBuilder === builder.id;
          return (
            <Card
              key={builder.id}
              className={`p-6 cursor-pointer transition-all hover:scale-105 min-h-[200px] flex flex-col ${
                isActive 
                  ? 'ring-2 ring-purple-500 shadow-lg' 
                  : 'hover:shadow-lg'
              }`}
              onClick={() => handleBuilderSelect(builder.id)}
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${builder.color} rounded-xl flex items-center justify-center mb-4 flex-shrink-0`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{builder.name}</h3>
              <p className="text-sm text-gray-600 flex-grow leading-relaxed">{builder.description}</p>
            </Card>
          );
        })}
      </div>

      {/* Active Builder Content */}
      <div className="min-h-[600px]" ref={builderContentRef}>
        {activeBuilder === 'player-cards' && <PlayerCardsGallery players={players} />}
        {activeBuilder === 'gameweek-review' && <GameweekReviewBuilder players={players} />}
        {activeBuilder === 'team-lineup' && <TeamLineupBuilderAdvanced players={players} />}
        {activeBuilder === 'head-to-head' && <HeadToHeadBuilder players={players} />}
        {activeBuilder === 'fdr-fixtures' && <FDRFixtureBuilder players={players} />}
        {activeBuilder === 'stats-infographic' && <StatsInfographicBuilder players={players} />}
        {activeBuilder === 'transfer-suggestion' && <TransferSuggestionBuilder players={players} />}
        {activeBuilder === 'mini-league' && <MiniLeagueBuilder />}
      </div>
    </div>
  );
}