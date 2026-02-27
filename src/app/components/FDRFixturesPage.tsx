import React, { useEffect } from 'react';
import { Card } from './ui/card';
import { useFPLStore } from '../store/fpl-store';
import { Loader2, ArrowUpDown, ArrowUp, ArrowDown, Star } from 'lucide-react';

// Official FPL FDR Colors
const getFDRColor = (difficulty: number) => {
  switch(difficulty) {
    case 1: return 'bg-[#375523]'; // Dark green (easiest) - Updated color
    case 2: return 'bg-[#00FF87]'; // Light green
    case 3: return 'bg-gray-400';  // Gray (neutral)
    case 4: return 'bg-[#FF1751]'; // Pink/red
    case 5: return 'bg-[#861134]'; // Dark red (hardest)
    default: return 'bg-gray-400';
  }
};

const getFDRTextColor = (difficulty: number) => {
  switch(difficulty) {
    case 1: return 'text-white'; // White text for darker green
    case 2: return 'text-gray-900';
    case 3: return 'text-white';
    case 4: return 'text-white';
    case 5: return 'text-white';
    default: return 'text-white';
  }
};

export function FDRFixturesPage() {
  const { bootstrap, fixtures, fetchBootstrapData, fetchFixtures } = useFPLStore();
  const [sortColumn, setSortColumn] = React.useState<string>('avgFDR');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (!bootstrap) fetchBootstrapData();
    if (!fixtures) fetchFixtures();
  }, [bootstrap, fixtures, fetchBootstrapData, fetchFixtures]);

  if (!bootstrap || !fixtures) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // Get next 5 fixtures for each team
  const teamFixturesData = bootstrap.teams?.map(team => {
    const teamFixtures = fixtures
      .filter(f => 
        (f.team_h === team.id || f.team_a === team.id) && 
        !f.finished
      )
      .sort((a, b) => {
        // Sort by event number, handling null events
        const aEvent = a.event ?? 999;
        const bEvent = b.event ?? 999;
        return aEvent - bEvent;
      })
      .slice(0, 5) // Take up to 5 remaining fixtures
      .map(f => {
        const isHome = f.team_h === team.id;
        const opponentId = isHome ? f.team_a : f.team_h;
        const opponent = bootstrap.teams?.find(t => t.id === opponentId);
        const difficulty = isHome ? f.team_h_difficulty : f.team_a_difficulty;
        
        return {
          gameweek: f.event || 'TBC',
          opponent: opponent?.short_name || 'TBC',
          difficulty: difficulty || 3,
          isHome,
        };
      });
    
    // Calculate average FDR
    const avgFDR = teamFixtures.length > 0
      ? teamFixtures.reduce((sum, f) => sum + f.difficulty, 0) / teamFixtures.length
      : 0;
    
    // Find best (easiest) fixture
    const bestFixtureIndex = teamFixtures.length > 0
      ? teamFixtures.reduce((bestIdx, curr, currIdx, arr) => 
          curr.difficulty < arr[bestIdx].difficulty ? currIdx : bestIdx, 0)
      : -1;
    
    return {
      team,
      fixtures: teamFixtures,
      avgFDR,
      bestFixtureIndex,
    };
  });

  // Sorting logic
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedData = [...(teamFixturesData || [])].sort((a, b) => {
    let compareValue = 0;
    
    if (sortColumn === 'avgFDR') {
      compareValue = a.avgFDR - b.avgFDR;
    } else if (sortColumn === 'team') {
      compareValue = a.team.name.localeCompare(b.team.name);
    } else if (sortColumn.startsWith('gw')) {
      const gwIndex = parseInt(sortColumn.replace('gw', ''));
      const aFDR = a.fixtures[gwIndex]?.difficulty ?? 999;
      const bFDR = b.fixtures[gwIndex]?.difficulty ?? 999;
      compareValue = aFDR - bFDR;
    }
    
    return sortDirection === 'asc' ? compareValue : -compareValue;
  });

  // Get the maximum number of fixtures any team has (for dynamic columns)
  const maxFixtures = Math.max(...(teamFixturesData?.map(t => t.fixtures.length) || [5]));
  const fixtureCount = Math.min(maxFixtures, 5); // Max 5 columns

  // Get actual gameweek numbers from the first team's fixtures
  const gameweekHeaders = teamFixturesData?.[0]?.fixtures.map(f => f.gameweek) || [];

  const SortIcon = ({ column }: { column: string }) => {
    if (sortColumn !== column) return <ArrowUpDown className="w-4 h-4 ml-1 opacity-30" />;
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 ml-1" />
      : <ArrowDown className="w-4 h-4 ml-1" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-br from-purple-600 to-pink-600 text-white">
        <h2 className="text-2xl font-bold mb-2">Team Fixtures - FDR Analysis</h2>
        <p className="text-sm opacity-90">
          Fixture Difficulty Rating (FDR) for the next {fixtureCount} {fixtureCount === 1 ? 'Gameweek' : 'Gameweeks'} • Official FPL Colors
        </p>
      </Card>

      {/* FDR Legend */}
      <Card className="p-6">
        <h3 className="text-sm font-bold text-gray-900 mb-3">FDR LEGEND</h3>
        <div className="flex flex-wrap gap-4">
          {[1, 2, 3, 4, 5].map(difficulty => (
            <div key={difficulty} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded ${getFDRColor(difficulty)} flex items-center justify-center ${getFDRTextColor(difficulty)} font-bold`}>
                {difficulty}
              </div>
              <span className="text-sm text-gray-600">
                {difficulty === 1 && 'Very Easy'}
                {difficulty === 2 && 'Easy'}
                {difficulty === 3 && 'Moderate'}
                {difficulty === 4 && 'Difficult'}
                {difficulty === 5 && 'Very Difficult'}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* FDR Table */}
      <Card className="p-3 sm:p-6 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 sm:py-4 px-2 sm:px-4 font-bold text-gray-900 lg:sticky lg:left-0 bg-white lg:z-10 text-xs sm:text-base">Rank</th>
              <th 
                className="text-left py-3 sm:py-4 px-2 sm:px-4 font-bold text-gray-900 lg:sticky lg:left-16 bg-white lg:z-10 cursor-pointer hover:bg-gray-50 text-xs sm:text-base"
                onClick={() => handleSort('team')}
              >
                <div className="flex items-center">
                  Team
                  <SortIcon column="team" />
                </div>
              </th>
              {Array.from({ length: fixtureCount }).map((_, index) => (
                <th 
                  key={index} 
                  className="text-center py-3 sm:py-4 px-2 sm:px-4 font-bold text-gray-900 cursor-pointer hover:bg-gray-50 text-xs sm:text-base"
                  onClick={() => handleSort(`gw${index}`)}
                >
                  <div className="flex items-center justify-center">
                    GW {gameweekHeaders[index] || (index + 1)}
                    <SortIcon column={`gw${index}`} />
                  </div>
                </th>
              ))}
              <th 
                className="text-center py-3 sm:py-4 px-2 sm:px-4 font-bold text-gray-900 cursor-pointer hover:bg-gray-50 text-xs sm:text-base"
                onClick={() => handleSort('avgFDR')}
              >
                <div className="flex items-center justify-center">
                  Avg FDR
                  <SortIcon column="avgFDR" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedData?.map((data, index) => {
              const isBestOverallFDR = index === 0 && sortColumn === 'avgFDR' && sortDirection === 'asc';
              
              return (
                <tr 
                  key={data.team.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    isBestOverallFDR ? 'bg-green-50' : ''
                  }`}
                >
                  <td className={`py-2 sm:py-3 px-2 sm:px-4 lg:sticky lg:left-0 text-xs sm:text-base ${isBestOverallFDR ? 'bg-green-50' : 'bg-white'}`}>
                    <div className="font-bold text-purple-600">
                      #{index + 1}
                      {isBestOverallFDR && <span className="ml-1 text-yellow-500">⭐</span>}
                    </div>
                  </td>
                  <td className={`py-2 sm:py-3 px-2 sm:px-4 lg:sticky lg:left-16 ${isBestOverallFDR ? 'bg-green-50' : 'bg-white'}`}>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <img
                        src={`https://resources.premierleague.com/premierleague/badges/70/t${data.team.code}.png`}
                        alt={data.team.name}
                        className="w-6 h-6 sm:w-8 sm:h-8"
                      />
                      <div>
                        <div className="font-semibold text-gray-900 text-xs sm:text-base">{data.team.short_name}</div>
                        <div className="text-xs text-gray-500 hidden sm:block">{data.team.name}</div>
                      </div>
                    </div>
                  </td>
                  {Array.from({ length: fixtureCount }).map((_, gwIndex) => {
                    const fixture = data.fixtures[gwIndex];
                    const isBestFixture = gwIndex === data.bestFixtureIndex;
                    
                    if (!fixture) {
                      return (
                        <td key={gwIndex} className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                          <div className="bg-gray-200 rounded-lg p-2 sm:p-3">
                            <div className="text-xs text-gray-500">-</div>
                          </div>
                        </td>
                      );
                    }
                    return (
                      <td key={gwIndex} className="py-2 sm:py-3 px-2 sm:px-4">
                        <div className={`${getFDRColor(fixture.difficulty)} rounded-lg p-2 sm:p-3 flex flex-col items-center justify-center min-h-[50px] sm:min-h-[60px] relative ${
                          isBestFixture ? 'ring-2 ring-yellow-400 ring-offset-2' : ''
                        }`}>
                          {isBestFixture && (
                            <Star className={`absolute -top-1 sm:-top-2 -right-1 sm:-right-2 w-4 h-4 sm:w-5 sm:h-5 fill-yellow-400 text-yellow-400`} />
                          )}
                          <div className={`text-xs font-bold ${getFDRTextColor(fixture.difficulty)}`}>
                            {fixture.isHome ? 'H' : 'A'}
                          </div>
                          <div className={`text-xs sm:text-sm font-bold ${getFDRTextColor(fixture.difficulty)} mt-0.5 sm:mt-1`}>
                            {fixture.opponent}
                          </div>
                          <div className={`text-xs ${getFDRTextColor(fixture.difficulty)} opacity-70 mt-0.5 sm:mt-1 hidden sm:block`}>
                            FDR: {fixture.difficulty}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                  <td className="py-2 sm:py-3 px-2 sm:px-4 text-center">
                    <div className="font-bold text-base sm:text-lg text-gray-900">
                      {data.avgFDR.toFixed(2)}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* Additional Info */}
      <Card className="p-6 bg-blue-50 border-2 border-blue-200">
        <div className="flex items-start gap-3">
          <div className="text-blue-600 text-xl">ℹ️</div>
          <div>
            <h3 className="font-bold text-blue-900 mb-2">How to use FDR</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Lower average FDR</strong> = easier run of fixtures</li>
              <li>• <strong>Green fixtures (1-2)</strong> = good time to target those team's players</li>
              <li>• <strong>Red fixtures (4-5)</strong> = consider avoiding or benching players</li>
              <li>• <strong>H/A indicator</strong> = Home or Away fixture</li>
              <li>• <strong>⭐ Star icon</strong> = Best (easiest) fixture for each team</li>
              <li>• <strong>Click column headers</strong> to sort by that column</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default FDRFixturesPage;