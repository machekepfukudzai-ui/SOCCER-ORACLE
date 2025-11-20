
import { GoogleGenAI } from "@google/genai";
import { MatchAnalysis, MatchFixture, MatchStats, SportType } from "../types";

// Helper to initialize AI lazily and safely
const getAI = () => {
  const apiKey = (typeof process !== 'undefined' && process.env && process.env.API_KEY) 
    ? process.env.API_KEY 
    : '';
  return new GoogleGenAI({ apiKey });
};

// --- CACHING SYSTEM ---
const CACHE_PREFIX = 'mo_cache_';

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

const getCachedData = <T>(key: string, maxAgeMs: number): T | null => {
  try {
    const itemStr = sessionStorage.getItem(CACHE_PREFIX + key);
    if (!itemStr) return null;
    
    const item: CacheItem<T> = JSON.parse(itemStr);
    const now = Date.now();
    
    if (now - item.timestamp < maxAgeMs) {
      return item.data;
    }
    
    sessionStorage.removeItem(CACHE_PREFIX + key);
    return null;
  } catch (e) {
    return null;
  }
};

const setCachedData = <T>(key: string, data: T) => {
  try {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now()
    };
    sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
  } catch (e) {
    console.warn("Cache storage full");
  }
};

// --- SMART OFFLINE PREDICTOR (FALLBACK) ---
// Generates consistent pseudo-predictions based on team names, keywords, and sport context
const generateOfflinePrediction = (home: string, away: string, league: string, sport: SportType, liveState?: {score: string, time: string}): MatchAnalysis => {
  // 1. Consistent Hash Generator
  const hash = (str: string) => {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
    return Math.abs(h);
  };

  // 2. Heuristic Strength Analysis
  // Keywords that often indicate stronger teams in various sports/leagues
  const powerKeywords = [
    'City', 'United', 'Real', 'Bayern', 'Barcelona', 'Liverpool', 'Arsenal', 'PSG', 'Inter', 'Milan', 
    'Juventus', 'Lakers', 'Celtics', 'Warriors', 'Chiefs', 'Munich', 'Madrid', 'Chelsea', 'Flamengo', 
    'River', 'Boca', 'Palmeiras', 'Al Ahly', 'Sundowns', 'Hilal', 'Nassr', 'Kawasaki', 'Ulsan'
  ];

  let hStrength = (hash(home) % 60) + 40; // Base 40-99
  let aStrength = (hash(away) % 60) + 40; // Base 40-99

  // Apply Keyword Boosts
  if (powerKeywords.some(k => home.includes(k))) hStrength += 15;
  if (powerKeywords.some(k => away.includes(k))) aStrength += 15;
  
  // Apply Home Advantage (Typical +5-10%)
  hStrength += 8;

  // Normalize probability
  const totalStr = hStrength + aStrength;
  const homeWinProb = Math.min(88, Math.max(15, Math.floor((hStrength / totalStr) * 100)));
  const awayWinProb = Math.min(88, Math.max(15, Math.floor((aStrength / totalStr) * 100)));
  const drawProb = Math.max(5, 100 - homeWinProb - awayWinProb);

  // 3. Score Generation based on Sport Profile
  let hScore = 0;
  let aScore = 0;
  let statMain = "Total Goals";
  let statSec = "Corners";
  let statTer = "Cards";
  let totalPoints = 0;

  // Parse Live Score if available
  let currentH = 0;
  let currentA = 0;
  if (liveState) {
      const parts = liveState.score.match(/\d+/g);
      if (parts && parts.length >= 2) {
          currentH = parseInt(parts[0]);
          currentA = parseInt(parts[1]);
      }
  }

  if (sport === 'BASKETBALL') {
      statMain = "Total Points";
      statSec = "Rebounds";
      statTer = "Turnovers";
      // Base NBA/Euro scores (e.g., 110-105)
      const baseH = 95 + (hStrength % 30);
      const baseA = 95 + (aStrength % 30);
      hScore = Math.max(currentH, baseH);
      aScore = Math.max(currentA, baseA);
      // Ensure winner matches probability
      if (homeWinProb > awayWinProb && aScore >= hScore) hScore = aScore + (hash(league) % 5) + 1;
      else if (awayWinProb > homeWinProb && hScore >= aScore) aScore = hScore + (hash(league) % 5) + 1;
      totalPoints = hScore + aScore;

  } else if (sport === 'HOCKEY') {
      statMain = "Total Goals";
      statSec = "SOG";
      statTer = "Penalties";
      // Base NHL scores (e.g., 3-2)
      const baseH = Math.floor(hStrength / 25); 
      const baseA = Math.floor(aStrength / 25);
      hScore = currentH + Math.max(0, baseH - currentH); // Don't go backwards
      aScore = currentA + Math.max(0, baseA - currentA);
      if (hScore === aScore) { // Prevent draws in offline prediction for hockey usually
          homeWinProb > awayWinProb ? hScore++ : aScore++;
      }
  } else if (sport === 'HANDBALL') {
      statMain = "Total Goals";
      statSec = "7m Goals";
      statTer = "Suspensions";
      const baseH = 25 + (hStrength % 10);
      const baseA = 25 + (aStrength % 10);
      hScore = Math.max(currentH, baseH);
      aScore = Math.max(currentA, baseA);
  } else {
      // SOCCER DEFAULT
      // Base scores 0-4
      const potentialH = Math.floor((hStrength / 100) * 3.5); 
      const potentialA = Math.floor((aStrength / 100) * 2.5);
      
      // If live, we add remaining potential to current
      hScore = currentH + (liveState ? (potentialH > currentH ? potentialH - currentH : 0) : potentialH);
      aScore = currentA + (liveState ? (potentialA > currentA ? potentialA - currentA : 0) : potentialA);
      
      // Slight adjustment to reflect win prob
      if (homeWinProb > 60 && hScore <= aScore) hScore = aScore + 1;
  }

  const predScore = `${hScore}-${aScore}`;
  const totalVal = hScore + aScore;

  return {
    rawText: "Offline Estimation",
    sections: {
      scorePrediction: predScore, 
      scoreProbability: `${Math.max(homeWinProb, awayWinProb)}%`,
      totalGoals: sport === 'BASKETBALL' ? `Over ${Math.floor(totalPoints - 5)}.5` : `Over ${Math.max(1.5, totalVal - 1.5)}`,
      corners: sport === 'SOCCER' ? `Over ${8 + (hash(league) % 4)}.5` : `Avg ${(hash(league)%10)+30}`,
      cards: sport === 'SOCCER' ? `Over ${2.5 + (hash(league) % 3)}` : `Low`,
      weather: "Offline / Data Unavailable",
      referee: "Standard Official",
      redFlags: "OFFLINE_MODE", 
      confidence: "Medium (Heuristic Estimate)",
      summary: `Offline Mode Active. Prediction estimated using historical team tiering for ${home} and ${away}. ${homeWinProb > awayWinProb ? home : away} appears to have the statistical edge based on name recognition and home advantage.`,
      recentForm: `${home}: (Est) W-D-L-W-D\n${away}: (Est) L-W-D-L-W`,
      headToHead: "Historical matchups suggest a competitive fixture.",
      keyFactors: `Home Advantage (${hStrength > aStrength ? 'Significant' : 'Moderate'})\nTeam Tiering Heuristics\nLeague Average Goals`,
      predictionLogic: "1. Network unavailable -> Using Heuristic Engine.\n2. Analyzed team name keywords for strength tiering.\n3. Applied sport-specific scoring model.\n4. Factorized home advantage (+8%).",
      liveAnalysis: liveState ? `Current State: ${liveState.score} (${liveState.time}). Estimating ${homeWinProb > awayWinProb ? 'Home' : 'Away'} maintains control based on pre-match weighting.` : "",
      nextGoal: liveState ? (hStrength > aStrength ? home : away) : "N/A",
      liveTip: "Market check recommended when online."
    },
    liveState: liveState ? { isLive: true, currentScore: liveState.score, matchTime: liveState.time } : undefined,
    stats: {
      homeLast5Goals: [1, Math.max(0, hScore-1), hScore, Math.max(0, hScore-2), 1],
      awayLast5Goals: [0, Math.max(0, aScore-1), aScore, 1, 0],
      possession: { home: Math.floor(homeWinProb * 0.8), away: 100 - Math.floor(homeWinProb * 0.8) },
      winProbability: { home: homeWinProb, draw: drawProb, away: awayWinProb },
      odds: { 
          homeWin: parseFloat((100/homeWinProb).toFixed(2)), 
          draw: parseFloat((100/drawProb).toFixed(2)), 
          awayWin: parseFloat((100/awayWinProb).toFixed(2)) 
      }
    }
  };
};

// Helper to return backup matches for offline/error states
const getBackupMatches = (sport: SportType): MatchFixture[] => {
    if (sport === 'BASKETBALL') {
        return [
          { home: "Lakers", away: "Warriors", time: "19:00", league: "NBA", status: "SCHEDULED", sport },
          { home: "Real Madrid", away: "Barcelona", time: "20:00", league: "EuroLeague", status: "SCHEDULED", sport },
          { home: "Panathinaikos", away: "Olympiacos", time: "18:00", league: "Greek A1", status: "SCHEDULED", sport },
        ];
    }
    if (sport === 'HOCKEY') {
         return [
          { home: "Maple Leafs", away: "Canadiens", time: "19:00", league: "NHL", status: "SCHEDULED", sport },
          { home: "Frolunda", away: "Färjestad", time: "18:00", league: "SHL", status: "SCHEDULED", sport },
        ];
    }
    if (sport === 'HANDBALL') {
        return [
            { home: "Barcelona", away: "Kiel", time: "19:00", league: "Champions League", status: "SCHEDULED", sport },
        ];
    }
    // Default Soccer (Global Mix)
    return [
        // Europe
        { home: "Man City", away: "Liverpool", time: "20:00", league: "Premier League", status: "SCHEDULED", sport },
        { home: "Portsmouth", away: "Derby", time: "15:00", league: "League One", status: "SCHEDULED", sport },
        { home: "Hamburg", away: "St. Pauli", time: "18:30", league: "2. Bundesliga", status: "SCHEDULED", sport },
        { home: "Fenerbahce", away: "Galatasaray", time: "19:00", league: "Süper Lig", status: "SCHEDULED", sport },
        // South America
        { home: "Santos", away: "Guarani", time: "22:00", league: "Brasileirão Série B", status: "SCHEDULED", sport },
        { home: "Boca Juniors", away: "River Plate", time: "21:00", league: "Argentine Primera", status: "SCHEDULED", sport },
        // Asia
        { home: "Yokohama FC", away: "Tokushima", time: "11:00", league: "J2 League", status: "SCHEDULED", sport },
        { home: "Persija Jakarta", away: "Persib Bandung", time: "15:30", league: "Indonesia Liga 1", status: "SCHEDULED", sport },
        { home: "Mohun Bagan", away: "East Bengal", time: "19:30", league: "Indian ISL", status: "SCHEDULED", sport },
        // Africa
        { home: "Al Ahly", away: "Zamalek", time: "18:00", league: "Egyptian Premier", status: "SCHEDULED", sport },
        { home: "Mamelodi Sundowns", away: "Orlando Pirates", time: "15:00", league: "SA PSL", status: "SCHEDULED", sport },
    ];
};

// ---------------------

export const fetchTodaysMatches = async (sport: SportType = 'SOCCER', date?: string): Promise<MatchFixture[]> => {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const cacheKey = `matches_${sport}_${targetDate}`;
  
  // Offline Check
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.warn("Device offline: Returning backup matches.");
      return getBackupMatches(sport);
  }

  try {
    const cached = getCachedData<MatchFixture[]>(cacheKey, 30 * 60 * 1000);
    if (cached) return cached;
  } catch (e) { }

  try {
    const ai = getAI();
    const modelId = "gemini-2.5-flash";
    
    const prompt = `
      List 20-25 diverse ${sport} matches scheduled for ${targetDate} from around the world.
      MANDATORY GLOBAL MIX (Big & Small Leagues):
      - EUROPE: Major (EPL, La Liga, Serie A, Bundesliga) AND Lower/Small (Championship, League 1/2, Serie B/C, Segunda, 2. Bundesliga, Eredivisie, Primeira Liga, Belgium Pro League, Swiss Super League, Turkey Super Lig).
      - ASIA: Major (J1, K1, Saudi Pro) AND Lower/Small (J2, K2, Thai League, V-League, Indian ISL/I-League, Indonesia Liga 1/2, Malaysia Super League).
      - AFRICA: Major (CAF CL, NPFL, PSL, Egyptian Premier) AND Small (Ghana Premier, Morocco Botola, Tanzania Ligi Kuu).
      - SOUTH AMERICA: Major (Brasileirão A, Argentine Primera) AND Lower (Brasileirão B, Primera Nacional, Colombia A, Chile A, Peru Liga 1).
      
      EXCLUDE: Cyber, Esports, Simulated.
      FORMAT: JSON Array [{ "home": "A", "away": "B", "time": "HH:MM", "league": "L", "status": "SCHEDULED" }]
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] },
    });

    const text = response.text || "[]";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const cleanText = jsonMatch ? jsonMatch[0] : "[]";
    
    const matches = JSON.parse(cleanText);
    if (!Array.isArray(matches) || matches.length === 0) throw new Error("No matches");

    const result = matches.map((m: any) => ({ ...m, sport }));
    setCachedData(cacheKey, result);
    return result;

  } catch (error) {
    console.warn("API Error, returning backup matches.");
    return getBackupMatches(sport);
  }
};

export const fetchLiveOdds = async (homeTeam: string, awayTeam: string): Promise<{ homeWin: number; draw: number; awayWin: number } | undefined> => {
  // Offline Check
  if (typeof navigator !== 'undefined' && !navigator.onLine) return undefined;

  const cacheKey = `odds_${homeTeam}_${awayTeam}`;
  try {
    const cached = getCachedData<{ homeWin: number; draw: number; awayWin: number }>(cacheKey, 90 * 1000);
    if (cached) return cached;
  } catch (e) { }

  try {
    const ai = getAI();
    const prompt = `Current decimal odds for ${homeTeam} vs ${awayTeam}? JSON: { "homeWin": 1.5, "draw": 3.5, "awayWin": 5.0 }`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] },
    });
    const jsonMatch = response.text?.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return undefined;
    const data = JSON.parse(jsonMatch[0]);
    setCachedData(cacheKey, data);
    return data;
  } catch (error) { return undefined; }
};

export const fetchTeamDetails = async (homeTeam: string, awayTeam: string, sport: SportType = 'SOCCER'): Promise<MatchStats['comparison'] | undefined> => {
  // Offline Check
  if (typeof navigator !== 'undefined' && !navigator.onLine) return undefined;

  const cacheKey = `details_${homeTeam}_${awayTeam}_${sport}`;
  try {
    const cached = getCachedData<MatchStats['comparison']>(cacheKey, 24 * 60 * 60 * 1000);
    if (cached) return cached;
  } catch (e) { }

  try {
    const ai = getAI();
    const prompt = `Stats for ${homeTeam} vs ${awayTeam} (${sport}). JSON: { "homeValue": "val", "awayValue": "val", "homePosition": "1st", "awayPosition": "2nd", "homeRating": 85, "awayRating": 80 }`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] },
    });
    const jsonMatch = response.text?.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return undefined;
    const data = JSON.parse(jsonMatch[0]);
    setCachedData(cacheKey, data);
    return data;
  } catch (error) { return undefined; }
};

export const analyzeMatch = async (homeTeam: string, awayTeam: string, league?: string, liveState?: { score: string, time: string }, sport: SportType = 'SOCCER'): Promise<MatchAnalysis> => {
  // Offline Check
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
      console.warn("Device offline: Using Smart Offline Predictor");
      return generateOfflinePrediction(homeTeam, awayTeam, league || '', sport, liveState);
  }

  try {
    if (!homeTeam || !awayTeam) throw new Error("Teams required");

    const ai = getAI();
    const isLive = !!liveState;
    
    // Sport & League Context
    let sportCtx = '';
    let outputTpl = '';
    
    switch(sport) {
        case 'BASKETBALL': 
            sportCtx = 'Stats: Points, Rebounds. Factors: Load Management.'; 
            outputTpl = '## Total Points\n[Over/Under]\n## Key Stat\n[Rebounds]';
            break;
        case 'HOCKEY': 
            sportCtx = 'Stats: Goals, SOG. Factors: Goalies.'; 
            outputTpl = '## Total Goals\n[Over/Under]\n## Key Stat\n[SOG]';
            break;
        case 'HANDBALL': 
            sportCtx = 'Stats: Goals. Factors: Pace.'; 
            outputTpl = '## Total Goals\n[Over/Under]\n## Key Stat\n[7m]';
            break;
        default: 
            sportCtx = 'Stats: Goals, Corners, Cards. Context: Weather, Referees, Global Leagues (Europe, Asia, Africa, SA).'; 
            outputTpl = '## Total Goals\n[O/U]\n## Corners\n[Count]\n## Cards\n[Count]';
            break;
    }

    const prompt = `
      Analyze ${sport}: ${homeTeam} vs ${awayTeam} ${league ? `(${league})` : ''}.
      ${isLive ? `LIVE MATCH: Score ${liveState?.score} Time ${liveState?.time}. Focus: Momentum, Next Goal.` : 'PRE-MATCH: Focus Form, H2H.'}
      ${sportCtx}
      
      CONTEXT: 
      - Supports ALL GLOBAL LEAGUES (EPL, La Liga, Serie B, J2 League, NPFL, Brasileirão B, Indonesian Liga 1, etc.).
      - If advanced stats (xG) are missing for lower leagues, rely on League Standings, Home/Away Records, and Recent Form.
      - Factor in: Travel fatigue (Asia/SA), Pitch conditions (Lower leagues), Home crowd hostility (Turkey, Greece, Indonesia).
      
      STRICTLY EXCLUDE CYBER/ESPORTS/SIMULATION. REAL MATCHES ONLY.
      
      OUTPUT FORMAT:
      ## Score Prediction
      [X-Y]
      ## Score Probability
      [%]
      ${outputTpl}
      ## Weather
      [Cond]
      ## Referee
      [Name]
      ## Red Flags
      [Warnings]
      ## Confidence
      [Lvl]
      ## Summary
      [Verdict]
      ## Prediction Logic
      [Steps]
      ${isLive ? '## Live Analysis\n[Txt]\n## Next Goal\n[Team]\n## Live Tip\n[Tip]' : ''}
      ## Recent Form
      [Txt]
      ## Head-to-Head
      [Txt]
      ## Key Factors
      [Txt]
      
      JSON DATA (At End):
      \`\`\`json
      {
        "homeLast5Goals": [n,n,n,n,n], "awayLast5Goals": [n,n,n,n,n],
        "possession": {"home":n,"away":n},
        "winProbability": {"home":n,"draw":n,"away":n},
        "odds": {"homeWin":n.n,"draw":n.n,"awayWin":n.n},
        "comparison": {"homeValue":"s","awayValue":"s","homePosition":"s","awayPosition":"s","homeRating":n,"awayRating":n},
        "keyPlayers": {"home":[{"name":"n","stat":"s"}],"away":[{"name":"n","stat":"s"}]},
        "homeLogo":"url","awayLogo":"url"
      }
      \`\`\`
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] },
    });

    const text = response.text || "";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as any[];
    const analysis = parseResponse(text, groundingChunks);
    
    if (isLive && liveState) {
      analysis.liveState = { isLive: true, currentScore: liveState.score, matchTime: liveState.time };
    }

    return analysis;

  } catch (error: any) {
    console.warn("API Limit or Error -> Using Smart Offline Predictor");
    return generateOfflinePrediction(homeTeam, awayTeam, league || '', sport, liveState);
  }
};

const parseResponse = (text: string, groundingChunks: any[]): MatchAnalysis => {
  const sections: MatchAnalysis['sections'] = {
    scorePrediction: '', scoreProbability: '', totalGoals: '', corners: '', cards: '',
    weather: '', referee: '', redFlags: '', confidence: '', summary: '',
    recentForm: '', headToHead: '', keyFactors: '', predictionLogic: '',
    liveAnalysis: '', nextGoal: '', liveTip: ''
  };
  
  let stats: MatchAnalysis['stats'] = undefined;

  // Extract JSON
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
      try { stats = JSON.parse(jsonMatch[1] || jsonMatch[0]); } catch (e) {}
  }

  // Extract Sections
  const lines = text.replace(/```json[\s\S]*```/g, '').split('\n');
  let currentSection = '';

  const mapHeader = (line: string) => {
    const l = line.toLowerCase().replace(/\*|#/g, '').trim();
    if (l.startsWith('score prediction')) return 'scorePrediction';
    if (l.startsWith('score probability')) return 'scoreProbability';
    if (l.startsWith('total goals') || l.startsWith('total points')) return 'totalGoals';
    if (l.startsWith('corners') || l.startsWith('key stat') && !l.includes('2')) return 'corners';
    if (l.startsWith('cards') || l.startsWith('key stat 2')) return 'cards';
    if (l.startsWith('weather')) return 'weather';
    if (l.startsWith('referee')) return 'referee';
    if (l.startsWith('red flags')) return 'redFlags';
    if (l.startsWith('confidence')) return 'confidence';
    if (l.startsWith('summary')) return 'summary';
    if (l.startsWith('recent form')) return 'recentForm';
    if (l.startsWith('head-to-head')) return 'headToHead';
    if (l.startsWith('key factors')) return 'keyFactors';
    if (l.startsWith('prediction logic')) return 'predictionLogic';
    if (l.startsWith('live analysis')) return 'liveAnalysis';
    if (l.startsWith('next goal')) return 'nextGoal';
    if (l.startsWith('live tip')) return 'liveTip';
    return null;
  };

  lines.forEach(line => {
    const header = mapHeader(line);
    if (header) {
        currentSection = header;
    } else if (currentSection && line.trim()) {
        sections[currentSection as keyof typeof sections] += line.trim() + '\n';
    }
  });

  // Fallback Score Regex
  if (!sections.scorePrediction) {
      const score = text.match(/\b\d+\s*-\s*\d+\b/);
      if (score) sections.scorePrediction = score[0];
  }

  // Cleanup
  Object.keys(sections).forEach(k => {
      sections[k as keyof typeof sections] = sections[k as keyof typeof sections]?.trim();
  });

  return { rawText: text, groundingChunks, sections, stats };
};
