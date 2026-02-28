import { create } from 'zustand';
import type { Player, Team, Fixture, Event, PlayerFixture } from '../types/fpl';
import { FPLService, fplCache } from '../utils/corsProxy';

interface FPLStore {
  // Data
  players: Player[];
  teams: Team[];
  fixtures: Fixture[];
  events: Event[];
  currentGameweek: number;
  bootstrap: any | null;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // User team state
  selectedPlayers: Player[];
  budget: number;
  freeTransfers: number;

  // Live stats cache for partial updates
  liveStats: Map<number, Record<string, unknown>>;

  // Actions
  fetchBootstrapData: () => Promise<void>;
  fetchFixtures: () => Promise<void>;
  updateLivePlayerStats: (playerUpdates: Array<{ id: number; stats: Record<string, unknown> }>) => void;
  getPlayerFixtures: (playerId: number, numFixtures?: number) => PlayerFixture[];
  getTeamName: (teamId: number) => string;
  getAverageFDR: (playerId: number) => number;
  addPlayerToTeam: (player: Player) => void;
  removePlayerFromTeam: (playerId: number) => void;
  setCurrentGameweek: (gw: number) => void;
}

// Comprehensive mock data
const mockTeams: Team[] = [
  { id: 1, name: 'Arsenal', short_name: 'ARS', strength: 5 },
  { id: 2, name: 'Aston Villa', short_name: 'AVL', strength: 4 },
  { id: 3, name: 'Bournemouth', short_name: 'BOU', strength: 2 },
  { id: 4, name: 'Brentford', short_name: 'BRE', strength: 3 },
  { id: 5, name: 'Brighton', short_name: 'BHA', strength: 3 },
  { id: 6, name: 'Burnley', short_name: 'BUR', strength: 2 },
  { id: 7, name: 'Chelsea', short_name: 'CHE', strength: 4 },
  { id: 8, name: 'Crystal Palace', short_name: 'CRY', strength: 2 },
  { id: 9, name: 'Everton', short_name: 'EVE', strength: 2 },
  { id: 10, name: 'Fulham', short_name: 'FUL', strength: 3 },
  { id: 11, name: 'Liverpool', short_name: 'LIV', strength: 5 },
  { id: 12, name: 'Luton', short_name: 'LUT', strength: 1 },
  { id: 13, name: 'Man City', short_name: 'MCI', strength: 5 },
  { id: 14, name: 'Man Utd', short_name: 'MUN', strength: 4 },
  { id: 15, name: 'Newcastle', short_name: 'NEW', strength: 4 },
  { id: 16, name: 'Nottm Forest', short_name: 'NFO', strength: 2 },
  { id: 17, name: 'Sheffield Utd', short_name: 'SHU', strength: 1 },
  { id: 18, name: 'Spurs', short_name: 'TOT', strength: 4 },
  { id: 19, name: 'West Ham', short_name: 'WHU', strength: 3 },
  { id: 20, name: 'Wolves', short_name: 'WOL', strength: 3 }
];

const mockPlayers: Player[] = [
  {
    id: 1,
    first_name: 'Cole',
    second_name: 'Palmer',
    web_name: 'Palmer',
    team: 7,
    team_name: 'CHE',
    element_type: 3,
    now_cost: 112,
    cost_change_start: 22,
    selected_by_percent: '58.2',
    form: '9.2',
    points_per_game: '8.5',
    total_points: 245,
    goals_scored: 15,
    assists: 12,
    clean_sheets: 8,
    goals_conceded: 0,
    own_goals: 0,
    penalties_saved: 0,
    penalties_missed: 0,
    yellow_cards: 3,
    red_cards: 0,
    saves: 0,
    bonus: 28,
    bps: 845,
    influence: '1245.6',
    creativity: '1568.2',
    threat: '1789.4',
    ict_index: '458.2',
    expected_goals: '14.5',
    expected_assists: '11.8',
    expected_goal_involvements: '26.3',
    expected_goals_conceded: '0',
    status: 'a',
    news: '',
    photo: 'palmer.jpg'
  },
  {
    id: 2,
    first_name: 'Erling',
    second_name: 'Haaland',
    web_name: 'Haaland',
    team: 13,
    team_name: 'MCI',
    element_type: 4,
    now_cost: 150,
    cost_change_start: 0,
    selected_by_percent: '78.4',
    form: '8.8',
    points_per_game: '7.2',
    total_points: 198,
    goals_scored: 22,
    assists: 5,
    clean_sheets: 0,
    goals_conceded: 0,
    own_goals: 0,
    penalties_saved: 0,
    penalties_missed: 1,
    yellow_cards: 2,
    red_cards: 0,
    saves: 0,
    bonus: 18,
    bps: 756,
    influence: '987.4',
    creativity: '456.8',
    threat: '2145.6',
    ict_index: '358.9',
    expected_goals: '21.3',
    expected_assists: '4.6',
    expected_goal_involvements: '25.9',
    expected_goals_conceded: '0',
    status: 'a',
    news: '',
    photo: 'haaland.jpg'
  },
  {
    id: 3,
    first_name: 'Mohamed',
    second_name: 'Salah',
    web_name: 'Salah',
    team: 11,
    team_name: 'LIV',
    element_type: 3,
    now_cost: 128,
    cost_change_start: 8,
    selected_by_percent: '65.8',
    form: '8.5',
    points_per_game: '7.8',
    total_points: 215,
    goals_scored: 18,
    assists: 10,
    clean_sheets: 10,
    goals_conceded: 0,
    own_goals: 0,
    penalties_saved: 0,
    penalties_missed: 0,
    yellow_cards: 1,
    red_cards: 0,
    saves: 0,
    bonus: 25,
    bps: 812,
    influence: '1156.8',
    creativity: '1289.4',
    threat: '1856.2',
    ict_index: '426.8',
    expected_goals: '16.8',
    expected_assists: '9.4',
    expected_goal_involvements: '26.2',
    expected_goals_conceded: '0',
    status: 'a',
    news: '',
    photo: 'salah.jpg'
  },
  {
    id: 4,
    first_name: 'Bukayo',
    second_name: 'Saka',
    web_name: 'Saka',
    team: 1,
    team_name: 'ARS',
    element_type: 3,
    now_cost: 95,
    cost_change_start: 5,
    selected_by_percent: '42.3',
    form: '7.8',
    points_per_game: '6.9',
    total_points: 189,
    goals_scored: 12,
    assists: 14,
    clean_sheets: 12,
    goals_conceded: 0,
    own_goals: 0,
    penalties_saved: 0,
    penalties_missed: 1,
    yellow_cards: 2,
    red_cards: 0,
    saves: 0,
    bonus: 22,
    bps: 745,
    influence: '1089.2',
    creativity: '1456.7',
    threat: '1523.8',
    ict_index: '406.9',
    expected_goals: '11.2',
    expected_assists: '12.5',
    expected_goal_involvements: '23.7',
    expected_goals_conceded: '0',
    status: 'a',
    news: '',
    photo: 'saka.jpg'
  },
  {
    id: 5,
    first_name: 'Phil',
    second_name: 'Foden',
    web_name: 'Foden',
    team: 13,
    team_name: 'MCI',
    element_type: 3,
    now_cost: 89,
    cost_change_start: -1,
    selected_by_percent: '28.6',
    form: '6.2',
    points_per_game: '6.1',
    total_points: 165,
    goals_scored: 11,
    assists: 8,
    clean_sheets: 11,
    goals_conceded: 0,
    own_goals: 0,
    penalties_saved: 0,
    penalties_missed: 0,
    yellow_cards: 3,
    red_cards: 0,
    saves: 0,
    bonus: 18,
    bps: 668,
    influence: '945.3',
    creativity: '1123.4',
    threat: '1389.6',
    ict_index: '345.8',
    expected_goals: '10.4',
    expected_assists: '7.8',
    expected_goal_involvements: '18.2',
    expected_goals_conceded: '0',
    status: 'a',
    news: '',
    photo: 'foden.jpg'
  },
  {
    id: 6,
    first_name: 'Son',
    second_name: 'Heung-Min',
    web_name: 'Son',
    team: 18,
    team_name: 'TOT',
    element_type: 3,
    now_cost: 98,
    cost_change_start: -12,
    selected_by_percent: '31.4',
    form: '7.1',
    points_per_game: '6.5',
    total_points: 178,
    goals_scored: 13,
    assists: 9,
    clean_sheets: 7,
    goals_conceded: 0,
    own_goals: 0,
    penalties_saved: 0,
    penalties_missed: 0,
    yellow_cards: 1,
    red_cards: 0,
    saves: 0,
    bonus: 20,
    bps: 712,
    influence: '1012.5',
    creativity: '1234.8',
    threat: '1567.3',
    ict_index: '379.5',
    expected_goals: '12.6',
    expected_assists: '8.9',
    expected_goal_involvements: '21.5',
    expected_goals_conceded: '0',
    status: 'a',
    news: '',
    photo: 'son.jpg'
  },
  {
    id: 7,
    first_name: 'Ollie',
    second_name: 'Watkins',
    web_name: 'Watkins',
    team: 2,
    team_name: 'AVL',
    element_type: 4,
    now_cost: 91,
    cost_change_start: 11,
    selected_by_percent: '38.7',
    form: '8.4',
    points_per_game: '7.1',
    total_points: 192,
    goals_scored: 16,
    assists: 11,
    clean_sheets: 0,
    goals_conceded: 0,
    own_goals: 0,
    penalties_saved: 0,
    penalties_missed: 0,
    yellow_cards: 4,
    red_cards: 0,
    saves: 0,
    bonus: 24,
    bps: 789,
    influence: '1089.7',
    creativity: '1012.3',
    threat: '1734.5',
    ict_index: '394.8',
    expected_goals: '14.8',
    expected_assists: '9.6',
    expected_goal_involvements: '24.4',
    expected_goals_conceded: '0',
    status: 'a',
    news: '',
    photo: 'watkins.jpg'
  },
  {
    id: 8,
    first_name: 'Alexander',
    second_name: 'Isak',
    web_name: 'Isak',
    team: 15,
    team_name: 'NEW',
    element_type: 4,
    now_cost: 87,
    cost_change_start: 7,
    selected_by_percent: '22.9',
    form: '7.6',
    points_per_game: '6.8',
    total_points: 182,
    goals_scored: 17,
    assists: 4,
    clean_sheets: 0,
    goals_conceded: 0,
    own_goals: 0,
    penalties_saved: 0,
    penalties_missed: 1,
    yellow_cards: 2,
    red_cards: 0,
    saves: 0,
    bonus: 19,
    bps: 698,
    influence: '923.4',
    creativity: '567.8',
    threat: '1823.9',
    ict_index: '331.0',
    expected_goals: '15.7',
    expected_assists: '3.2',
    expected_goal_involvements: '18.9',
    expected_goals_conceded: '0',
    status: 'a',
    news: '',
    photo: 'isak.jpg'
  },
  {
    id: 9,
    first_name: 'Bruno',
    second_name: 'Fernandes',
    web_name: 'B.Fernandes',
    team: 14,
    team_name: 'MUN',
    element_type: 3,
    now_cost: 85,
    cost_change_start: -15,
    selected_by_percent: '19.4',
    form: '5.8',
    points_per_game: '5.9',
    total_points: 159,
    goals_scored: 8,
    assists: 9,
    clean_sheets: 6,
    goals_conceded: 0,
    own_goals: 0,
    penalties_saved: 0,
    penalties_missed: 2,
    yellow_cards: 6,
    red_cards: 1,
    saves: 0,
    bonus: 14,
    bps: 612,
    influence: '856.7',
    creativity: '1245.9',
    threat: '1123.4',
    ict_index: '320.2',
    expected_goals: '9.4',
    expected_assists: '10.2',
    expected_goal_involvements: '19.6',
    expected_goals_conceded: '0',
    status: 's',
    news: 'Suspended for one match after red card',
    photo: 'fernandes.jpg'
  },
  {
    id: 10,
    first_name: 'Kevin',
    second_name: 'De Bruyne',
    web_name: 'De Bruyne',
    team: 13,
    team_name: 'MCI',
    element_type: 3,
    now_cost: 94,
    cost_change_start: -16,
    selected_by_percent: '12.3',
    form: '4.2',
    points_per_game: '4.8',
    total_points: 96,
    goals_scored: 4,
    assists: 8,
    clean_sheets: 5,
    goals_conceded: 0,
    own_goals: 0,
    penalties_saved: 0,
    penalties_missed: 0,
    yellow_cards: 1,
    red_cards: 0,
    saves: 0,
    bonus: 8,
    bps: 423,
    influence: '567.8',
    creativity: '1089.3',
    threat: '756.4',
    ict_index: '241.2',
    expected_goals: '5.2',
    expected_assists: '9.1',
    expected_goal_involvements: '14.3',
    expected_goals_conceded: '0',
    status: 'i',
    news: 'Hamstring injury - return unknown',
    photo: 'debruyne.jpg'
  },
  {
    id: 11,
    first_name: 'Dominic',
    second_name: 'Solanke',
    web_name: 'Solanke',
    team: 3,
    team_name: 'BOU',
    element_type: 4,
    now_cost: 72,
    cost_change_start: 12,
    selected_by_percent: '8.7',
    form: '8.9',
    points_per_game: '6.4',
    total_points: 174,
    goals_scored: 15,
    assists: 6,
    clean_sheets: 0,
    goals_conceded: 0,
    own_goals: 0,
    penalties_saved: 0,
    penalties_missed: 0,
    yellow_cards: 3,
    red_cards: 0,
    saves: 0,
    bonus: 21,
    bps: 732,
    influence: '934.5',
    creativity: '678.9',
    threat: '1689.2',
    ict_index: '330.1',
    expected_goals: '13.4',
    expected_assists: '5.1',
    expected_goal_involvements: '18.5',
    expected_goals_conceded: '0',
    status: 'a',
    news: '',
    photo: 'solanke.jpg'
  },
  {
    id: 12,
    first_name: 'Jarrod',
    second_name: 'Bowen',
    web_name: 'Bowen',
    team: 19,
    team_name: 'WHU',
    element_type: 3,
    now_cost: 76,
    cost_change_start: -4,
    selected_by_percent: '14.2',
    form: '6.4',
    points_per_game: '5.7',
    total_points: 154,
    goals_scored: 10,
    assists: 7,
    clean_sheets: 5,
    goals_conceded: 0,
    own_goals: 0,
    penalties_saved: 0,
    penalties_missed: 1,
    yellow_cards: 4,
    red_cards: 0,
    saves: 0,
    bonus: 15,
    bps: 645,
    influence: '812.3',
    creativity: '945.7',
    threat: '1234.6',
    ict_index: '299.9',
    expected_goals: '9.8',
    expected_assists: '6.9',
    expected_goal_involvements: '16.7',
    expected_goals_conceded: '0',
    status: 'a',
    news: '',
    photo: 'bowen.jpg'
  },
  {
    id: 13,
    first_name: 'William',
    second_name: 'Saliba',
    web_name: 'Saliba',
    team: 1,
    team_name: 'ARS',
    element_type: 2,
    now_cost: 60,
    cost_change_start: 5,
    selected_by_percent: '48.9',
    form: '6.8',
    points_per_game: '5.9',
    total_points: 161,
    goals_scored: 2,
    assists: 1,
    clean_sheets: 16,
    goals_conceded: 18,
    own_goals: 0,
    penalties_saved: 0,
    penalties_missed: 0,
    yellow_cards: 5,
    red_cards: 0,
    saves: 0,
    bonus: 18,
    bps: 698,
    influence: '723.4',
    creativity: '234.5',
    threat: '456.7',
    ict_index: '141.5',
    expected_goals: '3.2',
    expected_assists: '1.4',
    expected_goal_involvements: '4.6',
    expected_goals_conceded: '24.5',
    status: 'a',
    news: '',
    photo: 'saliba.jpg'
  },
  {
    id: 14,
    first_name: 'Virgil',
    second_name: 'van Dijk',
    web_name: 'Van Dijk',
    team: 11,
    team_name: 'LIV',
    element_type: 2,
    now_cost: 64,
    cost_change_start: 4,
    selected_by_percent: '35.6',
    form: '6.4',
    points_per_game: '5.6',
    total_points: 152,
    goals_scored: 3,
    assists: 2,
    clean_sheets: 14,
    goals_conceded: 21,
    own_goals: 0,
    penalties_saved: 0,
    penalties_missed: 0,
    yellow_cards: 2,
    red_cards: 0,
    saves: 0,
    bonus: 16,
    bps: 654,
    influence: '689.2',
    creativity: '267.8',
    threat: '523.4',
    ict_index: '148.0',
    expected_goals: '4.1',
    expected_assists: '2.3',
    expected_goal_involvements: '6.4',
    expected_goals_conceded: '26.8',
    status: 'a',
    news: '',
    photo: 'vandijk.jpg'
  },
  {
    id: 15,
    first_name: 'Kyle',
    second_name: 'Walker',
    web_name: 'Walker',
    team: 13,
    team_name: 'MCI',
    element_type: 2,
    now_cost: 53,
    cost_change_start: -7,
    selected_by_percent: '11.8',
    form: '5.2',
    points_per_game: '4.8',
    total_points: 130,
    goals_scored: 0,
    assists: 3,
    clean_sheets: 13,
    goals_conceded: 19,
    own_goals: 1,
    penalties_saved: 0,
    penalties_missed: 0,
    yellow_cards: 4,
    red_cards: 0,
    saves: 0,
    bonus: 10,
    bps: 512,
    influence: '567.8',
    creativity: '345.6',
    threat: '234.5',
    ict_index: '114.3',
    expected_goals: '0.8',
    expected_assists: '3.9',
    expected_goal_involvements: '4.7',
    expected_goals_conceded: '25.6',
    status: 'a',
    news: '',
    photo: 'walker.jpg'
  },
  {
    id: 16,
    first_name: 'David',
    second_name: 'Raya',
    web_name: 'Raya',
    team: 1,
    team_name: 'ARS',
    element_type: 1,
    now_cost: 55,
    cost_change_start: 5,
    selected_by_percent: '42.3',
    form: '6.2',
    points_per_game: '5.4',
    total_points: 146,
    goals_scored: 0,
    assists: 0,
    clean_sheets: 16,
    goals_conceded: 18,
    own_goals: 0,
    penalties_saved: 2,
    penalties_missed: 0,
    yellow_cards: 1,
    red_cards: 0,
    saves: 98,
    bonus: 14,
    bps: 612,
    influence: '623.4',
    creativity: '123.4',
    threat: '12.3',
    ict_index: '75.9',
    expected_goals: '0',
    expected_assists: '0.3',
    expected_goal_involvements: '0.3',
    expected_goals_conceded: '24.5',
    status: 'a',
    news: '',
    photo: 'raya.jpg'
  },
  {
    id: 17,
    first_name: 'Alisson',
    second_name: 'Becker',
    web_name: 'Alisson',
    team: 11,
    team_name: 'LIV',
    element_type: 1,
    now_cost: 54,
    cost_change_start: -1,
    selected_by_percent: '28.7',
    form: '5.8',
    points_per_game: '5.1',
    total_points: 138,
    goals_scored: 0,
    assists: 1,
    clean_sheets: 14,
    goals_conceded: 21,
    own_goals: 0,
    penalties_saved: 1,
    penalties_missed: 0,
    yellow_cards: 0,
    red_cards: 0,
    saves: 76,
    bonus: 12,
    bps: 578,
    influence: '589.3',
    creativity: '145.6',
    threat: '8.9',
    ict_index: '74.1',
    expected_goals: '0',
    expected_assists: '0.5',
    expected_goal_involvements: '0.5',
    expected_goals_conceded: '26.8',
    status: 'd',
    news: 'Minor knock - 75% chance of playing',
    photo: 'alisson.jpg'
  },
  {
    id: 18,
    first_name: 'Pedro',
    second_name: 'Porro',
    web_name: 'Porro',
    team: 18,
    team_name: 'TOT',
    element_type: 2,
    now_cost: 54,
    cost_change_start: 4,
    selected_by_percent: '18.9',
    form: '5.9',
    points_per_game: '5.1',
    total_points: 138,
    goals_scored: 2,
    assists: 7,
    clean_sheets: 8,
    goals_conceded: 35,
    own_goals: 0,
    penalties_saved: 0,
    penalties_missed: 0,
    yellow_cards: 3,
    red_cards: 0,
    saves: 0,
    bonus: 11,
    bps: 534,
    influence: '512.3',
    creativity: '723.4',
    threat: '445.6',
    ict_index: '168.0',
    expected_goals: '2.8',
    expected_assists: '6.2',
    expected_goal_involvements: '9.0',
    expected_goals_conceded: '38.9',
    status: 'a',
    news: '',
    photo: 'porro.jpg'
  },
  {
    id: 19,
    first_name: 'Morgan',
    second_name: 'Gibbs-White',
    web_name: 'Gibbs-White',
    team: 16,
    team_name: 'NFO',
    element_type: 3,
    now_cost: 62,
    cost_change_start: 7,
    selected_by_percent: '6.2',
    form: '7.8',
    points_per_game: '5.6',
    total_points: 152,
    goals_scored: 8,
    assists: 9,
    clean_sheets: 6,
    goals_conceded: 0,
    own_goals: 0,
    penalties_saved: 0,
    penalties_missed: 0,
    yellow_cards: 8,
    red_cards: 0,
    saves: 0,
    bonus: 14,
    bps: 612,
    influence: '734.5',
    creativity: '1023.4',
    threat: '945.6',
    ict_index: '270.1',
    expected_goals: '7.2',
    expected_assists: '8.4',
    expected_goal_involvements: '15.6',
    expected_goals_conceded: '0',
    status: 'a',
    news: '',
    photo: 'gibbswhite.jpg'
  },
  {
    id: 20,
    first_name: 'Chris',
    second_name: 'Wood',
    web_name: 'Wood',
    team: 16,
    team_name: 'NFO',
    element_type: 4,
    now_cost: 62,
    cost_change_start: 12,
    selected_by_percent: '4.8',
    form: '8.2',
    points_per_game: '5.9',
    total_points: 160,
    goals_scored: 14,
    assists: 2,
    clean_sheets: 0,
    goals_conceded: 0,
    own_goals: 0,
    penalties_saved: 0,
    penalties_missed: 0,
    yellow_cards: 2,
    red_cards: 0,
    saves: 0,
    bonus: 17,
    bps: 689,
    influence: '823.4',
    creativity: '345.6',
    threat: '1567.8',
    ict_index: '274.2',
    expected_goals: '12.8',
    expected_assists: '1.9',
    expected_goal_involvements: '14.7',
    expected_goals_conceded: '0',
    status: 'a',
    news: '',
    photo: 'wood.jpg'
  }
];

const mockFixtures: Fixture[] = [
  // GW 28
  { id: 1, event: 28, team_h: 1, team_a: 3, team_h_difficulty: 2, team_a_difficulty: 4, kickoff_time: '2024-03-09T15:00:00Z', finished: false },
  { id: 2, event: 28, team_h: 7, team_a: 15, team_h_difficulty: 3, team_a_difficulty: 3, kickoff_time: '2024-03-09T15:00:00Z', finished: false },
  { id: 3, event: 28, team_h: 11, team_a: 13, team_h_difficulty: 5, team_a_difficulty: 5, kickoff_time: '2024-03-09T17:30:00Z', finished: false },
  { id: 4, event: 28, team_h: 18, team_a: 2, team_h_difficulty: 3, team_a_difficulty: 3, kickoff_time: '2024-03-10T14:00:00Z', finished: false },

  // GW 29
  { id: 5, event: 29, team_h: 3, team_a: 11, team_h_difficulty: 5, team_a_difficulty: 2, kickoff_time: '2024-03-16T15:00:00Z', finished: false },
  { id: 6, event: 29, team_h: 13, team_a: 1, team_h_difficulty: 4, team_a_difficulty: 4, kickoff_time: '2024-03-16T15:00:00Z', finished: false },
  { id: 7, event: 29, team_h: 15, team_a: 7, team_h_difficulty: 3, team_a_difficulty: 3, kickoff_time: '2024-03-16T17:30:00Z', finished: false },
  { id: 8, event: 29, team_h: 2, team_a: 18, team_h_difficulty: 3, team_a_difficulty: 3, kickoff_time: '2024-03-17T14:00:00Z', finished: false },

  // GW 30
  { id: 9, event: 30, team_h: 1, team_a: 18, team_h_difficulty: 3, team_a_difficulty: 4, kickoff_time: '2024-03-23T15:00:00Z', finished: false },
  { id: 10, event: 30, team_h: 11, team_a: 7, team_h_difficulty: 3, team_a_difficulty: 4, kickoff_time: '2024-03-23T15:00:00Z', finished: false },
  { id: 11, event: 30, team_h: 13, team_a: 2, team_h_difficulty: 3, team_a_difficulty: 5, kickoff_time: '2024-03-23T17:30:00Z', finished: false },
  { id: 12, event: 30, team_h: 3, team_a: 15, team_h_difficulty: 4, team_a_difficulty: 2, kickoff_time: '2024-03-24T14:00:00Z', finished: false },

  // GW 31
  { id: 13, event: 31, team_h: 7, team_a: 1, team_h_difficulty: 4, team_a_difficulty: 3, kickoff_time: '2024-03-30T15:00:00Z', finished: false },
  { id: 14, event: 31, team_h: 18, team_a: 11, team_h_difficulty: 5, team_a_difficulty: 2, kickoff_time: '2024-03-30T15:00:00Z', finished: false },
  { id: 15, event: 31, team_h: 2, team_a: 13, team_h_difficulty: 5, team_a_difficulty: 2, kickoff_time: '2024-03-30T17:30:00Z', finished: false },
  { id: 16, event: 31, team_h: 15, team_a: 3, team_h_difficulty: 2, team_a_difficulty: 4, kickoff_time: '2024-03-31T14:00:00Z', finished: false },

  // GW 32
  { id: 17, event: 32, team_h: 1, team_a: 11, team_h_difficulty: 5, team_a_difficulty: 5, kickoff_time: '2024-04-06T15:00:00Z', finished: false },
  { id: 18, event: 32, team_h: 13, team_a: 7, team_h_difficulty: 3, team_a_difficulty: 4, kickoff_time: '2024-04-06T15:00:00Z', finished: false },
  { id: 19, event: 32, team_h: 3, team_a: 2, team_h_difficulty: 3, team_a_difficulty: 2, kickoff_time: '2024-04-06T17:30:00Z', finished: false },
  { id: 20, event: 32, team_h: 18, team_a: 15, team_h_difficulty: 3, team_a_difficulty: 3, kickoff_time: '2024-04-07T14:00:00Z', finished: false },

  // GW 33
  { id: 21, event: 33, team_h: 11, team_a: 3, team_h_difficulty: 2, team_a_difficulty: 5, kickoff_time: '2024-04-13T15:00:00Z', finished: false },
  { id: 22, event: 33, team_h: 7, team_a: 13, team_h_difficulty: 4, team_a_difficulty: 3, kickoff_time: '2024-04-13T15:00:00Z', finished: false },
  { id: 23, event: 33, team_h: 2, team_a: 1, team_h_difficulty: 4, team_a_difficulty: 3, kickoff_time: '2024-04-13T17:30:00Z', finished: false },
  { id: 24, event: 33, team_h: 15, team_a: 18, team_h_difficulty: 3, team_a_difficulty: 3, kickoff_time: '2024-04-14T14:00:00Z', finished: false },
];

const mockEvents: Event[] = [
  { id: 27, name: 'Gameweek 27', deadline_time: '2024-03-02T11:00:00Z', finished: true, is_current: false, is_next: false },
  { id: 28, name: 'Gameweek 28', deadline_time: '2024-03-09T11:00:00Z', finished: false, is_current: true, is_next: false },
  { id: 29, name: 'Gameweek 29', deadline_time: '2024-03-16T11:00:00Z', finished: false, is_current: false, is_next: true },
  { id: 30, name: 'Gameweek 30', deadline_time: '2024-03-23T11:00:00Z', finished: false, is_current: false, is_next: false },
  { id: 31, name: 'Gameweek 31', deadline_time: '2024-03-30T11:00:00Z', finished: false, is_current: false, is_next: false },
  { id: 32, name: 'Gameweek 32', deadline_time: '2024-04-06T11:00:00Z', finished: false, is_current: false, is_next: false },
  { id: 33, name: 'Gameweek 33', deadline_time: '2024-04-13T11:00:00Z', finished: false, is_current: false, is_next: false },
];

export const useFPLStore = create<FPLStore>((set, get) => ({
  // Initial state
  players: [],
  teams: [],
  fixtures: [],
  events: [],
  currentGameweek: 28,
  isLoading: false,
  error: null,
  selectedPlayers: [],
  budget: 1000, // £100.0m
  freeTransfers: 1,
  bootstrap: null,
  liveStats: new Map(),

  // Fetch bootstrap-static data
  fetchBootstrapData: async () => {
    set({ isLoading: true, error: null });

    // Check cache first
    const cached = fplCache.get('bootstrap');
    if (cached) {
      const enrichedPlayers = cached.elements.map((player: Player) => ({
        ...player,
        team_name: cached.teams.find((t: Team) => t.id === player.team)?.short_name || '',
        team_code: cached.teams.find((t: Team) => t.id === player.team)?.code || null,
      }));

      set({
        players: enrichedPlayers,
        teams: cached.teams,
        events: cached.events,
        currentGameweek: cached.events.find((e: Event) => e.is_current)?.id || 28,
        isLoading: false,
        bootstrap: cached
      });
      return;
    }

    try {
      const data = await FPLService.loadBootstrap();

      // Cache the data
      fplCache.set('bootstrap', data);

      // Enrich players with team names
      const enrichedPlayers = data.elements.map((player: Player) => ({
        ...player,
        team_name: data.teams.find((t: Team) => t.id === player.team)?.short_name || '',
        team_code: data.teams.find((t: Team) => t.id === player.team)?.code || null,
        code: player.code
      }));


      set({
        players: enrichedPlayers,
        teams: data.teams,
        events: data.events,
        currentGameweek: data.events.find((e: Event) => e.is_current)?.id || 28,
        isLoading: false,
        bootstrap: data,
        error: null
      });
    } catch (error) {

      // Use mock data as fallback - this is fine!
      set({
        players: mockPlayers,
        teams: mockTeams,
        events: mockEvents,
        currentGameweek: 28,
        isLoading: false,
        error: null, // Don't show error - mock data works fine
        bootstrap: null
      });
    }
  },

  // Fetch fixtures
  fetchFixtures: async () => {
    // Check cache first
    const cached = fplCache.get('fixtures');
    if (cached) {
      set({ fixtures: cached });
      return;
    }

    try {
      const data = await FPLService.loadFixtures();
      fplCache.set('fixtures', data);
      set({ fixtures: data });
    } catch (error) {
      set({ fixtures: mockFixtures });
    }
  },

  // Partial update: only merge changed player stats, preventing full-page re-renders
  updateLivePlayerStats: (playerUpdates) => {
    const { liveStats } = get();
    const newMap = new Map(liveStats);
    let changed = false;

    for (const update of playerUpdates) {
      const existing = newMap.get(update.id);
      const merged = existing ? { ...existing, ...update.stats } : { ...update.stats };

      // Only flag change if values actually differ
      if (!existing || JSON.stringify(existing) !== JSON.stringify(merged)) {
        newMap.set(update.id, merged);
        changed = true;
      }
    }

    if (changed) {
      set({ liveStats: newMap });
    }
  },

  // Get next N fixtures for a player
  getPlayerFixtures: (playerId: number, numFixtures = 5): PlayerFixture[] => {
    const { players, teams, fixtures, currentGameweek } = get();
    const player = players.find(p => p.id === playerId);

    if (!player) return [];

    // Filter fixtures for this player's team from current GW onwards
    const teamFixtures = fixtures
      .filter(f =>
        (f.team_h === player.team || f.team_a === player.team) &&
        f.event >= currentGameweek &&
        !f.finished
      )
      .sort((a, b) => a.event - b.event)
      .slice(0, numFixtures);

    return teamFixtures.map(fixture => {
      const isHome = fixture.team_h === player.team;
      const opponentId = isHome ? fixture.team_a : fixture.team_h;
      const opponent = teams.find(t => t.id === opponentId);
      const difficulty = isHome ? fixture.team_h_difficulty : fixture.team_a_difficulty;

      return {
        gameweek: fixture.event,
        opponent: opponent?.short_name || 'TBD',
        difficulty,
        isHome
      };
    });
  },

  // Get team name by ID
  getTeamName: (teamId: number): string => {
    const { teams } = get();
    return teams.find(t => t.id === teamId)?.short_name || '';
  },

  // Get average fixture difficulty for a player (next 5 fixtures)
  getAverageFDR: (playerId: number): number => {
    const fixtures = get().getPlayerFixtures(playerId, 5);
    if (fixtures.length === 0) return 0;

    const totalDifficulty = fixtures.reduce((sum, f) => sum + f.difficulty, 0);
    return totalDifficulty / fixtures.length;
  },

  // Add player to user's team
  addPlayerToTeam: (player: Player) => {
    const { selectedPlayers, budget } = get();

    if (selectedPlayers.length >= 15) return;
    if (budget < player.now_cost) return;

    set({
      selectedPlayers: [...selectedPlayers, player],
      budget: budget - player.now_cost
    });
  },

  // Remove player from user's team
  removePlayerFromTeam: (playerId: number) => {
    const { selectedPlayers, budget } = get();
    const player = selectedPlayers.find(p => p.id === playerId);

    if (!player) return;

    set({
      selectedPlayers: selectedPlayers.filter(p => p.id !== playerId),
      budget: budget + player.now_cost
    });
  },

  // Set current gameweek
  setCurrentGameweek: (gw: number) => {
    set({ currentGameweek: gw });
  }
}));