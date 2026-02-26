// FPL API Types
export interface Team {
  id: number;
  name: string;
  short_name: string;
  strength: number;
}

export interface Player {
  id: number;
  first_name: string;
  second_name: string;
  web_name: string;
  team: number;
  team_name?: string;
  element_type: number; // 1=GK, 2=DEF, 3=MID, 4=FWD
  now_cost: number; // price in tenths (e.g., 65 = £6.5m)
  cost_change_start: number;
  selected_by_percent: string;
  form: string;
  points_per_game: string;
  total_points: number;
  goals_scored: number;
  assists: number;
  clean_sheets: number;
  goals_conceded: number;
  own_goals: number;
  penalties_saved: number;
  penalties_missed: number;
  yellow_cards: number;
  red_cards: number;
  saves: number;
  bonus: number;
  bps: number;
  influence: string;
  creativity: string;
  threat: string;
  ict_index: string;
  expected_goals: string;
  expected_assists: string;
  expected_goal_involvements: string;
  expected_goals_conceded: string;
  status: string; // 'a' = available, 'i' = injured, 'd' = doubtful, 's' = suspended
  news: string;
  photo: string;
  code: number;
  team_code: number;
  transfers_in_event: number;
  transfers_out_event: number;
}

export interface Fixture {
  id: number;
  event: number; // gameweek
  team_h: number;
  team_a: number;
  team_h_difficulty: number;
  team_a_difficulty: number;
  kickoff_time: string;
  finished: boolean;
}

export interface BootstrapStatic {
  events: Event[];
  teams: Team[];
  elements: Player[];
}

export interface Event {
  id: number;
  name: string;
  deadline_time: string;
  finished: boolean;
  is_current: boolean;
  is_next: boolean;
}

export interface PlayerFixture {
  gameweek: number;
  opponent: string;
  difficulty: number;
  isHome: boolean;
}
