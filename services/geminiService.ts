
import { GoogleGenAI } from "@google/genai";
import { MatchAnalysis, MatchFixture, MatchStats, SportType } from "../types";

// Helper to initialize AI lazily to prevent top-level crashes
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const fetchTodaysMatches = async (sport: SportType = 'SOCCER'): Promise<MatchFixture[]> => {
  const ai = getAI();
  const modelId = "gemini-2.5-flash";
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  const prompt = `
    Find a diverse and comprehensive list of ${sport} matches scheduled for today, ${today}.
    
    CRITICAL INSTRUCTIONS:
    1. Focus specifically on major and secondary leagues for **${sport}**.
    2. If ${sport} is SOCCER, include Cyber/Esports.
    3. If ${sport} is BASKETBALL, include NBA, EuroLeague, NCAA, or top domestic leagues.
    4. If ${sport} is HOCKEY, include NHL, KHL, SHL, etc.
    5. If ${sport} is HANDBALL, include EHF Champions League, Bundesliga, etc.
    6. **MANDATORY**: Include matches from AFRICA (e.g., Nigeria NPFL, South Africa PSL, Ghana Premier, Egypt, Morocco, CAF Champions League) and ASIA (e.g., Japan J-League, Korea K-League, Saudi Pro, Thailand, Vietnam, Indonesia, India).
    7. **INCLUDE LOWER LEAGUES**: Specifically look for 2nd/3rd divisions in England, Asia, and Africa.
    
    Aim for 15-20 fixtures to cover global timezones.
    
    Return a strictly formatted JSON array.
    
    Output Format:
    [
      {
        "home": "Home Team",
        "away": "Away Team",
        "time": "HH:MM UTC or 'LIVE'",
        "league": "League Name",
        "score": "Current Score (if live)",
        "status": "SCHEDULED" | "LIVE" | "FINISHED"
      }
    ]
    
    Do NOT include markdown. Just the raw JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType: "application/json", // Unsupported with googleSearch
      },
    });

    const text = response.text || "[]";
    // Extract JSON array from potential markdown
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    const cleanText = jsonMatch ? jsonMatch[0] : text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const matches = JSON.parse(cleanText);
    return matches.map((m: any) => ({ ...m, sport }));
  } catch (error) {
    console.error("Failed to fetch matches:", error);
    return [];
  }
};

export const fetchLiveOdds = async (homeTeam: string, awayTeam: string): Promise<{ homeWin: number; draw: number; awayWin: number } | undefined> => {
  const ai = getAI();
  const modelId = "gemini-2.5-flash";
  const prompt = `
    Find the current live decimal betting odds for the match between ${homeTeam} and ${awayTeam}.
    Check major bookmakers.
    
    Return ONLY a strictly formatted JSON object. No markdown.
    
    { 
      "homeWin": 1.50, 
      "draw": 4.00, 
      "awayWin": 6.50 
    }
    
    If draw is not applicable (e.g. Basketball moneyline), set draw to 0.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType: "application/json", // Unsupported with googleSearch
      },
    });

    const text = response.text || "{}";
    // Extract JSON object from potential markdown
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const cleanText = jsonMatch ? jsonMatch[0] : text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Failed to fetch live odds:", error);
    return undefined;
  }
};

export const fetchTeamDetails = async (homeTeam: string, awayTeam: string, sport: SportType = 'SOCCER'): Promise<MatchStats['comparison'] | undefined> => {
  const ai = getAI();
  const modelId = "gemini-2.5-flash";
  
  const isCyber = homeTeam.toLowerCase().includes('cyber') || homeTeam.toLowerCase().includes('esoccer');
  
  let specificPrompt = "";
  if (sport === 'SOCCER') {
    specificPrompt = isCyber ? `
      Find stats for Cyber/Esports teams. Look for Gamer rating.
    ` : `
      Find squad market value (e.g. €500m), league position, and team strength rating (0-100).
    `;
  } else {
    specificPrompt = `
      Find current standings position, and estimated team strength rating (0-100) for ${sport} context.
      For squad value, use payroll or budget if applicable, or win %.
    `;
  }

  const prompt = `
    Find team details for ${homeTeam} vs ${awayTeam} (${sport}).
    ${specificPrompt}
    
    Return ONLY a strictly formatted JSON object:
    {
      "homeValue": "Value/Record", "awayValue": "Value/Record",
      "homePosition": "Nth", "awayPosition": "Nth",
      "homeRating": 85, "awayRating": 82
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        // responseMimeType: "application/json", // Unsupported with googleSearch
      },
    });

    const text = response.text || "{}";
    // Extract JSON object from potential markdown
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const cleanText = jsonMatch ? jsonMatch[0] : text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Failed to fetch team details:", error);
    return undefined;
  }
};

export const analyzeMatch = async (homeTeam: string, awayTeam: string, league?: string, liveState?: { score: string, time: string }, sport: SportType = 'SOCCER'): Promise<MatchAnalysis> => {
  const ai = getAI();
  const modelId = "gemini-2.5-flash";
  
  const context = league ? `in ${league}` : '';
  const isLive = !!liveState;

  // Sport Specific Instructions
  let sportInstructions = '';
  let outputTemplate = '';

  switch (sport) {
    case 'BASKETBALL':
      sportInstructions = `
        SPORT: BASKETBALL.
        PHYSICAL FACTORS:
        1. **Load Management & Fatigue**: Check for back-to-back games. Teams playing the 2nd night of a B2B often underperform.
        2. **Injuries**: Critical check for star players.
        3. **Matchups**: Height advantages, pace of play (fast vs slow teams).
        
        STATS TO PREDICT:
        - Total Points (Over/Under)
        - Key Stat: 3-Pointers or Rebounds
        - Key Stat 2: Turnovers or Fouls
      `;
      outputTemplate = `
        ## Total Points
        [e.g. Over 215.5 (Expected: 220)]
        
        ## Key Stat
        [e.g. Home Rebound Adv: +5.2]
        
        ## Key Stat 2
        [e.g. Low Turnovers Expected]
      `;
      break;

    case 'HOCKEY':
      sportInstructions = `
        SPORT: ICE HOCKEY.
        PHYSICAL FACTORS:
        1. **Starting Goalies**: CRITICAL. Is the #1 goalie confirmed or is it a backup? Backup goalies significantly change odds.
        2. **Fatigue**: 3rd game in 4 nights? Travel fatigue?
        3. **Special Teams**: Power Play vs Penalty Kill efficiency.
        
        STATS TO PREDICT:
        - Total Goals (Over/Under)
        - Key Stat: Shots on Goal (SOG)
        - Key Stat 2: Penalties / Power Plays
      `;
      outputTemplate = `
        ## Total Goals
        [e.g. Over 5.5 (Expected: 3-4)]
        
        ## Key Stat
        [e.g. High Shot Volume Expected (>30)]
        
        ## Key Stat 2
        [e.g. Heavy Penalty Minutes Likely]
      `;
      break;

    case 'HANDBALL':
      sportInstructions = `
        SPORT: HANDBALL.
        PHYSICAL FACTORS:
        1. **Rotation & Depth**: Teams with deeper benches sustain pace better in 60 mins.
        2. **Fatigue**: Recent tournament intensity?
        
        STATS TO PREDICT:
        - Total Goals
        - Key Stat: 7m Throws / Fast Breaks
        - Key Stat 2: 2-min Suspensions
      `;
      outputTemplate = `
        ## Total Goals
        [e.g. Over 58.5]
        
        ## Key Stat
        [e.g. High Fast Break Efficiency]
        
        ## Key Stat 2
        [e.g. Physical Defense (Many 2-mins)]
      `;
      break;

    default: // SOCCER
      const isCyber = homeTeam.toLowerCase().includes('cyber') || homeTeam.toLowerCase().includes('esoccer');
      if (isCyber) {
         sportInstructions = `
           SPORT: CYBER SOCCER / ESPORTS.
           1. Ignore physical fatigue/weather.
           2. Focus on Gamer/Algorithm trends and recent H2H volatility.
           3. High scoring nature of cyber leagues.
         `;
      } else {
         sportInstructions = `
           SPORT: SOCCER.
           
           **MANDATORY FOR LOWER LEAGUES (African/Asian/South American 2nd Div):**
           - If advanced stats (xG, Heatmaps) are missing, YOU MUST PREDICT based on:
             1. **League Standings**: Position differences.
             2. **Recent Form**: Last 5 games (W-D-L).
             3. **Goal Difference**: Home Attack vs Away Defense.
           - Do NOT refuse to predict due to "lack of data". Use available basic metrics.

           GRANULAR PHYSICAL FACTORS (For Major Leagues):
           1. **Weather**: Search for forecast at stadium. Heavy rain/wind? (Affects passing/goals).
           2. **Referee**: Identify the referee. Are they strict? (Avg Cards per game > 4.5?).
           3. **Injuries**: CONFIRM key missing players.
         `;
      }
      outputTemplate = `
        ## Total Goals
        [e.g. Over 2.5]
        
        ## Corners
        [e.g. Over 9.5]
        
        ## Cards
        [e.g. Over 3.5 Cards]
      `;
      break;
  }

  let instructionPart = '';
  if (isLive) {
    instructionPart = `
      THIS IS A LIVE MATCH.
      User provided Score: ${liveState.score}
      User provided Time: ${liveState.time}
      
      CRITICAL ACCURACY TASKS:
      1. **VERIFY LIVE DATA**: Search for the *current* live score and minute to ensure user data is accurate.
      2. **LIVE STATS**: Find REAL-TIME stats: Possession %, Shots on Target, xG (Expected Goals), Dangerous Attacks.
      3. **MOMENTUM**: Analyze events from the last 10-15 minutes. Who is pressuring?
      4. **PREDICTION**: Predict the *rest of the match* outcome based on this live data.
      
      ${sportInstructions}
    `;
  } else {
    instructionPart = `
      THIS IS AN UPCOMING MATCH.
      INSTRUCTIONS: Check Form, H2H. ${sportInstructions}
      INTEGRITY CHECK: Look for Suspicious Odds or "Fixed" match signals.
      ACCURACY: Use the latest team news (last 24h) to confirm injuries and lineups.
    `;
  }

  const prompt = `
    Analyze the ${sport} match between ${homeTeam} (Home) and ${awayTeam} (Away) ${context}.
    ${instructionPart}
    
    GOAL: HIGH PRECISION PREDICTION.
    REQUIRED: You MUST cite specific numbers found in search results (e.g. "xG is 1.2 vs 0.4", "Ref Avg 4.2 cards", "Rain forecasted", "5th vs 12th in table").
    Do NOT be vague.
    
    OUTPUT FORMAT STRICTLY:
    ## Score Prediction
    [Specific FINAL score]

    ## Score Probability
    [Percentage e.g. 65%]

    ${outputTemplate}
    
    ## Weather
    [Condition e.g. "Rainy, 15°C" or "N/A" (if Cyber/Indoor)]

    ## Referee
    [Name & Stat e.g. "M. Oliver (4.5 Cards/Game)" or "N/A"]

    ## Red Flags
    [Integrity/Ref/Injury Warnings]

    ## Confidence
    [High/Medium/Low]
    
    ## Summary
    [Concise verdict citing SPECIFIC DATA found]
    
    ## Recent Form
    [Last 5 games summary]
    
    ## Head-to-Head
    [Historical context]
    
    ## Key Factors
    [Detailed Physical/Mental/Statistical analysis including Injuries]

    JSON DATA:
    At the VERY END, provide this JSON block for charts. 
    IMPORTANT: If match is LIVE, use CURRENT LIVE STATS for possession and players if available.
    \`\`\`json
    {
      "homeLast5Goals": [n, n, n, n, n], // For basketball use points/10 (scaled) or raw points
      "awayLast5Goals": [n, n, n, n, n],
      "possession": { "home": n, "away": n }, // USE LIVE POSSESSION IF MATCH IS LIVE
      "winProbability": { "home": n, "draw": n, "away": n },
      "odds": { "homeWin": n.nn, "draw": n.nn, "awayWin": n.nn },
      "comparison": {
         "homeValue": "String", "awayValue": "String",
         "homePosition": "String", "awayPosition": "String",
         "homeRating": n, "awayRating": n
      },
      "keyPlayers": {
        "home": [{"name": "Name", "stat": "Stat"}],
        "away": [{"name": "Name", "stat": "Stat"}]
      },
      "homeLogo": "URL",
      "awayLogo": "URL"
    }
    \`\`\`
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as any[];

    const analysis = parseResponse(text, groundingChunks);
    
    if (isLive && liveState) {
      analysis.liveState = {
        isLive: true,
        currentScore: liveState.score,
        matchTime: liveState.time
      };
    }

    return analysis;
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};

const parseResponse = (text: string, groundingChunks: any[]): MatchAnalysis => {
  const sections: MatchAnalysis['sections'] = {
    scorePrediction: '',
    scoreProbability: '',
    totalGoals: '',
    corners: '',
    cards: '',
    weather: '',
    referee: '',
    redFlags: '',
    confidence: '',
    summary: '',
    recentForm: '',
    headToHead: '',
    keyFactors: ''
  };
  
  let stats: MatchAnalysis['stats'] = undefined;

  // 1. Extract JSON
  const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
  const jsonMatch = text.match(jsonRegex);
  if (jsonMatch && jsonMatch[1]) {
    try { stats = JSON.parse(jsonMatch[1]); } catch (e) { console.error("JSON Parse Error", e); }
  }

  const cleanText = text.replace(jsonRegex, '').trim();
  const lines = cleanText.split('\n');
  let currentSection: keyof MatchAnalysis['sections'] | 'unknown' = 'unknown';

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const cleanLine = trimmed.replace(/\*\*/g, '');
    
    const checkAndSetSection = (header: string, key: keyof MatchAnalysis['sections']): boolean => {
      if (cleanLine.startsWith(header)) {
        currentSection = key;
        const inlineContent = cleanLine.substring(header.length).replace(/^[:\s-]+/, '').trim();
        if (inlineContent) sections[key] = inlineContent;
        return true;
      }
      return false;
    };

    if (checkAndSetSection('## Score Prediction', 'scorePrediction')) return;
    if (checkAndSetSection('## Score Probability', 'scoreProbability')) return;
    
    // MAPPINGS FOR MULTI-SPORT
    // Primary Stat (Goals/Points)
    if (checkAndSetSection('## Total Goals', 'totalGoals')) return;
    if (checkAndSetSection('## Total Points', 'totalGoals')) return; 

    // Secondary Stat (Corners/Key Stat 1)
    if (checkAndSetSection('## Corners', 'corners')) return;
    if (checkAndSetSection('## Key Stat', 'corners')) return; // Maps to corners field

    // Tertiary Stat (Cards/Key Stat 2)
    if (checkAndSetSection('## Cards', 'cards')) return;
    if (checkAndSetSection('## Key Stat 2', 'cards')) return; // Maps to cards field
    
    if (checkAndSetSection('## Weather', 'weather')) return;
    if (checkAndSetSection('## Referee', 'referee')) return;

    if (checkAndSetSection('## Red Flags', 'redFlags')) return;
    if (checkAndSetSection('## Confidence', 'confidence')) return;
    if (checkAndSetSection('## Summary', 'summary')) return;
    if (checkAndSetSection('## Recent Form', 'recentForm')) return;
    if (checkAndSetSection('## Head-to-Head', 'headToHead')) return;
    if (checkAndSetSection('## Key Factors', 'keyFactors')) return;

    if (cleanLine.startsWith('##')) {
      currentSection = 'unknown';
      return;
    }

    if (currentSection !== 'unknown') {
      if (!sections[currentSection]) sections[currentSection] = trimmed;
      else if (!sections[currentSection]!.includes(trimmed)) sections[currentSection] += '\n' + trimmed;
    }
  });

  Object.keys(sections).forEach(key => {
    const k = key as keyof MatchAnalysis['sections'];
    if (sections[k]) sections[k] = sections[k]!.trim();
  });

  return { rawText: text, groundingChunks, sections, stats };
};
