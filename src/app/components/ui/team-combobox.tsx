import React, { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from './button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './command';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { cn } from './utils';

interface Team {
  id: number;
  name: string;
  short_name: string;
  code: number;
}

interface TeamComboboxProps {
  teams: Team[];
  value?: number | null;
  onSelect: (team: Team | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function TeamCombobox({
  teams,
  value,
  onSelect,
  placeholder = 'Search teams...',
  className,
  disabled = false
}: TeamComboboxProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedTeam = value ? teams.find(t => t.id === value) : null;

  // Filter teams based on search query
  const filteredTeams = teams.filter(team => {
    const query = searchQuery.toLowerCase();
    return (
      team.name.toLowerCase().includes(query) ||
      team.short_name.toLowerCase().includes(query)
    );
  });

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
          {selectedTeam ? (
            <span className="truncate">
              {selectedTeam.name} ({selectedTeam.short_name})
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search team by name..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>No team found.</CommandEmpty>
            <CommandGroup>
              {filteredTeams.map((team) => (
                <CommandItem
                  key={team.id}
                  value={team.name}
                  onSelect={() => {
                    onSelect(team);
                    setOpen(false);
                    setSearchQuery('');
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === team.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex items-center justify-between flex-1 gap-2">
                    <span className="font-medium">{team.name}</span>
                    <span className="text-xs text-muted-foreground font-semibold">
                      {team.short_name}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
