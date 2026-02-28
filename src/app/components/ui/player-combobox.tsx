import React, { useState } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { Button } from './button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './command';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from './utils';
import type { Player } from '../../types/fpl';
import { PlayerImage } from './player-image';

interface PlayerComboboxProps {
  players: Player[];
  value?: number | null;
  onSelect: (player: Player | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function PlayerCombobox({
  players,
  value,
  onSelect,
  placeholder = 'Search players...',
  className,
  disabled = false
}: PlayerComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedPlayer = value ? players.find(p => p.id === value) : null;

  // Filter players based on search query
  const filteredPlayers = players.filter(player => {
    const query = searchQuery.toLowerCase();
    return (
      player.web_name.toLowerCase().includes(query) ||
      player.first_name.toLowerCase().includes(query) ||
      player.second_name.toLowerCase().includes(query)
    );
  }).slice(0, 100); // Limit results for performance

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selectedPlayer ? (
            <span className="truncate">
              {selectedPlayer.web_name} - £{(selectedPlayer.now_cost / 10).toFixed(1)}m
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search player by name..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>No player found.</CommandEmpty>
            <CommandGroup>
              {filteredPlayers.map((player) => {
                const posMap = { 1: 'GKP', 2: 'DEF', 3: 'MID', 4: 'FWD' };
                const position = posMap[player.element_type as keyof typeof posMap];
                
                return (
                  <CommandItem
                    key={player.id}
                    value={player.web_name}
                    onSelect={() => {
                      onSelect(player);
                      setOpen(false);
                      setSearchQuery('');
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === player.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                      <PlayerImage
                        code={player.code}
                        teamCode={player.team_code}
                        alt=""
                        photoSize="40x40"
                        className="w-full h-full"
                      />
                    </div>
                    <div className="flex items-center justify-between flex-1 gap-2">
                      <span className="font-medium">{player.web_name}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-semibold">{position}</span>
                        <span>£{(player.now_cost / 10).toFixed(1)}m</span>
                      </div>
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
