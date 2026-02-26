import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import type { Player } from '../types/fpl';
import { Plus } from 'lucide-react';

interface PlayerSlotProps {
  player?: Player;
  position: string;
  onAddPlayer: () => void;
  onRemovePlayer: () => void;
}

const ItemType = 'PLAYER';

export function PlayerSlot({ player, position, onAddPlayer, onRemovePlayer }: PlayerSlotProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemType,
    item: player ? { player } : null,
    canDrag: !!player,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const [{ isOver }, drop] = useDrop(() => ({
    accept: ItemType,
    drop: (item: { player: Player }) => {
      if (!player) {
        // Add player to empty slot
        onAddPlayer();
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`
        relative w-14 h-14 sm:w-20 sm:h-20 rounded-full border-2 border-dashed border-white/40
        flex items-center justify-center cursor-pointer
        transition-all hover:scale-110
        ${isDragging ? 'opacity-50' : ''}
        ${isOver ? 'border-solid border-yellow-400 scale-105' : ''}
        ${player ? 'bg-white/20 backdrop-blur-sm' : 'bg-transparent'}
      `}
      onClick={player ? onRemovePlayer : onAddPlayer}
    >
      {player ? (
        <div className="text-center">
          <div className="text-[10px] sm:text-xs font-bold text-white truncate px-1">
            {player.web_name}
          </div>
          <div className="text-[8px] sm:text-[10px] text-white/80">
            £{(player.now_cost / 10).toFixed(1)}m
          </div>
        </div>
      ) : (
        <div className="text-center">
          <Plus className="w-4 h-4 sm:w-6 sm:h-6 text-white/60 mx-auto mb-0.5 sm:mb-1" />
          <div className="text-[8px] sm:text-[10px] text-white/60">{position}</div>
        </div>
      )}
    </div>
  );
}

interface TeamPitchProps {
  players: Player[];
  onAddPlayer: (position: string) => void;
  onRemovePlayer: (playerId: number) => void;
  formation?: string;
  gameweek?: number;
}

export function TeamPitch({ 
  players, 
  onAddPlayer, 
  onRemovePlayer,
  formation = '3-4-3',
  gameweek = 27
}: TeamPitchProps) {
  // Group players by position
  const goalkeepers = players.filter(p => p.element_type === 1).slice(0, 1);
  const defenders = players.filter(p => p.element_type === 2).slice(0, 5);
  const midfielders = players.filter(p => p.element_type === 3).slice(0, 5);
  const forwards = players.filter(p => p.element_type === 4).slice(0, 3);

  const [def, mid, fwd] = formation.split('-').map(Number);

  return (
    <div className="relative w-full rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 sm:px-6 py-3 sm:py-4">
        <h2 className="text-lg sm:text-2xl font-bold text-white">My Dream Team</h2>
        <p className="text-white/80 text-xs sm:text-sm">Gameweek {gameweek}</p>
      </div>

      {/* Football Pitch */}
      <div 
        className="relative h-[500px] sm:h-[600px] bg-gradient-to-b from-green-500 to-green-600"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(255,255,255,0.05) 50px, rgba(255,255,255,0.05) 51px),
            repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(255,255,255,0.05) 50px, rgba(255,255,255,0.05) 51px)
          `
        }}
      >
        {/* Center Circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 sm:w-32 sm:h-32 rounded-full border-2 border-white/30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white/40" />

        {/* Penalty Areas */}
        <div className="absolute top-6 sm:top-8 left-1/2 -translate-x-1/2 w-48 sm:w-64 h-16 sm:h-20 border-2 border-white/30 border-b-0" />
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 w-48 sm:w-64 h-16 sm:h-20 border-2 border-white/30 border-t-0" />

        {/* Goal Areas */}
        <div className="absolute top-6 sm:top-8 left-1/2 -translate-x-1/2 w-32 sm:w-40 h-10 sm:h-12 border-2 border-white/30 border-b-0" />
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 w-32 sm:w-40 h-10 sm:h-12 border-2 border-white/30 border-t-0" />

        {/* Players Layout */}
        <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-8">
          
          {/* Forwards */}
          <div className="flex justify-center gap-3 sm:gap-8 pt-2 sm:pt-4">
            {Array.from({ length: fwd }).map((_, i) => (
              <PlayerSlot
                key={`fwd-${i}`}
                player={forwards[i]}
                position="FWD"
                onAddPlayer={() => onAddPlayer('FWD')}
                onRemovePlayer={() => forwards[i] && onRemovePlayer(forwards[i].id)}
              />
            ))}
          </div>

          {/* Midfielders */}
          <div className="flex justify-center gap-2 sm:gap-6">
            {Array.from({ length: mid }).map((_, i) => (
              <PlayerSlot
                key={`mid-${i}`}
                player={midfielders[i]}
                position="MID"
                onAddPlayer={() => onAddPlayer('MID')}
                onRemovePlayer={() => midfielders[i] && onRemovePlayer(midfielders[i].id)}
              />
            ))}
          </div>

          {/* Defenders */}
          <div className="flex justify-center gap-2 sm:gap-6">
            {Array.from({ length: def }).map((_, i) => (
              <PlayerSlot
                key={`def-${i}`}
                player={defenders[i]}
                position="DEF"
                onAddPlayer={() => onAddPlayer('DEF')}
                onRemovePlayer={() => defenders[i] && onRemovePlayer(defenders[i].id)}
              />
            ))}
          </div>

          {/* Goalkeeper */}
          <div className="flex justify-center pb-2 sm:pb-4">
            <PlayerSlot
              player={goalkeepers[0]}
              position="GK"
              onAddPlayer={() => onAddPlayer('GK')}
              onRemovePlayer={() => goalkeepers[0] && onRemovePlayer(goalkeepers[0].id)}
            />
          </div>
        </div>

        {/* Watermark */}
        <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 text-white/40 text-xs sm:text-sm font-semibold">
          @FPL_Dave_
        </div>
      </div>

      {/* Substitutes Section */}
      <div className="bg-gray-900 px-4 sm:px-6 py-3 sm:py-4">
        <h3 className="text-xs sm:text-sm font-bold text-white mb-3 uppercase tracking-wide">
          Substitutes
        </h3>
        <div className="flex gap-2 sm:gap-4 overflow-x-auto">
          {Array.from({ length: 4 }).map((_, i) => (
            <PlayerSlot
              key={`sub-${i}`}
              player={undefined}
              position="SUB"
              onAddPlayer={() => onAddPlayer('SUB')}
              onRemovePlayer={() => {}}
            />
          ))}
        </div>
      </div>
    </div>
  );
}