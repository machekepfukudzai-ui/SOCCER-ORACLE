
export type SportType = 'SOCCER' | 'BASKETBALL' | 'HOCKEY' | 'HANDBALL';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface MatchFixture {
  home: string;
  away: string;
  time: string; // e.g., "14:00", "LIVE 23'", "FT"
  league: string;
  score?: string; // e.g., "1-0"
  status?: 'SCHEDULED' | 'LIVE' | 'FINISHED';
  sport?: SportType;
}

export interface PlayerStat {
  name: string;
  stat: string; // e.g. "5 Goals in last 3 games"
}

export interface MatchStats {
  homeLast5Goals: number[];
  awayLast5Goals: number[];
  possession: { home: number; away: number };
  winProbability: { home: number; draw: number; away: number };
  odds?: {
    homeWin: number;
    draw: number;
    awayWin: number;
  };
  comparison?: {
    homeValue: string;
    awayValue: string;
    homePosition: string;
    awayPosition: string;
    homeRating: number; // 0-100
    awayRating: number; // 0-100
  };
  keyPlayers?: {
    home: PlayerStat[];
    away: PlayerStat[];
  };
  homeLogo?: string;
  awayLogo?: string;
}

export interface LiveState {
  isLive: boolean;
  currentScore: string;
  matchTime: string;
}

export interface MatchAnalysis {
  rawText: string;
  groundingChunks?: GroundingChunk[];
  stats?: MatchStats;
  liveState?: LiveState; // Added for In-Play context
  sections: {
    scorePrediction?: string;
    scoreProbability?: string; // Estimated probability of the specific score
    totalGoals?: string; // Generic container for Primary Stat (Goals/Points)
    corners?: string; // Generic container for Secondary Stat (Corners/Rebounds/Shots)
    cards?: string; // Generic container for Tertiary Stat (Cards/Fouls/Penalties)
    weather?: string; // New: Weather conditions
    referee?: string; // New: Referee stats
    redFlags?: string; // New section for integrity/referee warnings
    confidence?: string; // High, Medium, Low
    summary: string;
    recentForm: string;
    headToHead: string;
    keyFactors: string;
  };
}

export enum LoadingState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}
