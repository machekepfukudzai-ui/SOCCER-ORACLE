
import { GoogleGenAI } from "@google/genai";
import { MatchAnalysis, MatchFixture, MatchStats } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const fetchTodaysMatches = async (): Promise<MatchFixture[]> => {
  const modelId = "gemini-2.5-flash";
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  const prompt = `
    Find the top 6 most important soccer matches scheduled for today, ${today}.
    Prioritize LIVE matches or major leagues (Premier League, La Liga, Serie A, Champions League, etc.).
    
    Return a strictly formatted JSON array.
    
    Output Format:
    [
      {
        "home": "Home Team",
        "away": "Away Team",
        "time": "HH:MM UTC or 'LIVE 34\'' or 'FT'",
        "league": "League",
        "score": "1-0 (if LIVE/FT) or null",
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
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "[]";
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Failed to fetch matches:", error);
    return [];
  }
};

export const fetchLiveOdds = async (homeTeam: string, awayTeam: string): Promise<{ homeWin: number; draw: number; awayWin: number } | undefined> => {
  const modelId = "gemini-2.5-flash";
  const prompt = `
    Find the current live decimal betting odds for the soccer match between ${homeTeam} and ${awayTeam}.
    Look for major bookmakers (Bet365, William Hill, etc.) averages.
    
    Return ONLY a strictly formatted JSON object. No markdown.
    
    { 
      "homeWin": 1.50, 
      "draw": 4.00, 
      "awayWin": 6.50 
    }
    
    If you cannot find live odds, try to estimate based on pre-match data found.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Failed to fetch live odds:", error);
    return undefined;
  }
};

export const fetchTeamDetails = async (homeTeam: string, awayTeam: string): Promise<MatchStats['comparison'] | undefined> => {
  const modelId = "gemini-2.5-flash";
  const prompt = `
    Find the current squad market value (e.g. €500m), current league position, and estimated team strength rating (0-100 based on FIFA/FC ratings or ELO) for ${homeTeam} and ${awayTeam}.
    
    Return ONLY a strictly formatted JSON object:
    {
      "homeValue": "€X", "awayValue": "€Y",
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
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (error) {
    console.error("Failed to fetch team details:", error);
    return undefined;
  }
};

export const analyzeMatch = async (homeTeam: string, awayTeam: string, league?: string, liveState?: { score: string, time: string }): Promise<MatchAnalysis> => {
  const modelId = "gemini-2.5-flash";
  
  const context = league ? `in the ${league}` : '';
  const isLive = !!liveState;

  // Dynamic Prompt Construction
  let instructionPart = '';

  if (isLive) {
    instructionPart = `
      THIS IS A LIVE MATCH (IN-PLAY).
      Current Score: ${liveState.score}
      Match Time: ${liveState.time}

      INSTRUCTIONS (LIVE):
      1. Use Google Search to find REAL-TIME stats for this specific match (shots, possession, red cards, momentum).
      2. Your "Score Prediction" must be the PREDICTED FINAL SCORE based on the current score and momentum.
      3. In "Key Factors", focus on momentum shifts, player fatigue, or red cards happening NOW.
      4. In "Summary", advise on live betting angles (e.g. "Next goal likely Home team").
    `;
  } else {
    instructionPart = `
      THIS IS A SCHEDULED / UPCOMING MATCH.
      INSTRUCTIONS (PRE-MATCH):
      1. Use Google Search to find: recent form (last 5 games), head-to-head records, average goals, corner stats, referee card stats/booking averages.
      2. "Score Prediction" is based on historical data and form.
    `;
  }

  const prompt = `
    Analyze the soccer match between ${homeTeam} (Home) and ${awayTeam} (Away) ${context}.
    ${instructionPart}
    
    GOAL: Provide a highly accurate prediction.
    Keep the written analysis CONCISE (2-3 sentences per section).
    Format the output strictly using the headers below.

    OUTPUT FORMAT:
    ## Score Prediction
    [Specific FINAL score prediction, e.g. 2-1]

    ## Score Probability
    [Percentage e.g. 65%]

    ## Total Goals
    [e.g. Over 2.5 (Expected: 3 goals)]

    ## Corners
    [e.g. Over 9.5 (Likely: 10)]

    ## Cards
    [e.g. Over 3.5 Cards (Ref Avg: 4.1, Teams Aggressive)]
    
    ## Confidence
    [High/Medium/Low]
    
    ## Summary
    [Concise verdict]
    
    ## Recent Form
    [Brief check on last 5 games]
    
    ## Head-to-Head
    [Brief historical context]
    
    ## Key Factors
    [Injuries, Motivation, Strength]

    JSON DATA:
    At the VERY END, provide this JSON block for charts (estimate values if exact stats aren't found):
    \`\`\`json
    {
      "homeLast5Goals": [n, n, n, n, n],
      "awayLast5Goals": [n, n, n, n, n],
      "possession": { "home": n, "away": n },
      "winProbability": { "home": n, "draw": n, "away": n },
      "odds": { "homeWin": n.nn, "draw": n.nn, "awayWin": n.nn },
      "comparison": {
         "homeValue": "€X", "awayValue": "€Y",
         "homePosition": "Nth", "awayPosition": "Nth",
         "homeRating": n, "awayRating": n
      },
      "homeLogo": "URL_STRING_WIKIMEDIA_OR_PNG",
      "awayLogo": "URL_STRING_WIKIMEDIA_OR_PNG"
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
    
    // Inject live state into the result object
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
    confidence: '',
    summary: '',
    recentForm: '',
    headToHead: '',
    keyFactors: ''
  };
  
  let stats: MatchAnalysis['stats'] = undefined;

  // 1. Extract and remove JSON block
  const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
  const jsonMatch = text.match(jsonRegex);
  
  if (jsonMatch && jsonMatch[1]) {
    try {
      stats = JSON.parse(jsonMatch[1]);
    } catch (e) {
      console.error("Failed to parse stats JSON", e);
    }
  }

  const cleanText = text.replace(jsonRegex, '').trim();
  const lines = cleanText.split('\n');
  let currentSection: keyof MatchAnalysis['sections'] | 'unknown' = 'unknown';

  // 2. Robust Section Parsing
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Remove markdown bolding for header check
    const cleanLine = trimmed.replace(/\*\*/g, '');
    
    // Helper to check headers
    const checkAndSetSection = (header: string, key: keyof MatchAnalysis['sections']): boolean => {
      if (cleanLine.startsWith(header)) {
        currentSection = key;
        // Check for content on the same line (e.g. "## Score Prediction: 2-1")
        const inlineContent = cleanLine.substring(header.length).replace(/^[:\s-]+/, '').trim();
        if (inlineContent) {
          sections[key] = inlineContent;
        }
        return true;
      }
      return false;
    };

    // Check all headers
    if (checkAndSetSection('## Score Prediction', 'scorePrediction')) return;
    if (checkAndSetSection('## Score Probability', 'scoreProbability')) return;
    if (checkAndSetSection('## Total Goals', 'totalGoals')) return;
    if (checkAndSetSection('## Corners', 'corners')) return;
    if (checkAndSetSection('## Cards', 'cards')) return;
    if (checkAndSetSection('## Confidence', 'confidence')) return;
    if (checkAndSetSection('## Summary', 'summary')) return;
    if (checkAndSetSection('## Recent Form', 'recentForm')) return;
    if (checkAndSetSection('## Head-to-Head', 'headToHead')) return;
    if (checkAndSetSection('## Key Factors', 'keyFactors')) return;

    // Handle unknown headers
    if (cleanLine.startsWith('##')) {
      currentSection = 'unknown';
      return;
    }

    // Append content to current section
    if (currentSection !== 'unknown') {
      // If we just started the section and extracted inline content, we might append extra lines.
      // If the section was empty, just set it.
      if (!sections[currentSection]) {
        sections[currentSection] = trimmed;
      } else {
        // Don't duplicate if it's the exact same string (edge case)
        if (!sections[currentSection]!.includes(trimmed)) {
             sections[currentSection] += '\n' + trimmed;
        }
      }
    }
  });

  // Final cleanup of strings
  Object.keys(sections).forEach(key => {
    const k = key as keyof MatchAnalysis['sections'];
    if (sections[k]) {
      sections[k] = sections[k]!.trim();
    }
  });

  return {
    rawText: text,
    groundingChunks,
    sections,
    stats
  };
};
