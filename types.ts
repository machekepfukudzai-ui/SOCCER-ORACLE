
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
    totalGoals?: string; // Now multi-line support for breakdown
    corners?: string; // Now multi-line support for breakdown
    cards?: string; // New section for booking/card predictions
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
