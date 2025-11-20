
import React, { useState, useEffect } from 'react';
import { TeamInput } from './components/TeamInput';
import { AnalysisResult } from './components/AnalysisResult';
import { MatchList } from './components/MatchList';
import { analyzeMatch, fetchTodaysMatches } from './services/geminiService';
import { MatchAnalysis, MatchFixture, LoadingState, SportType } from './types';
import { Radar } from 'lucide-react';

const App: React.FC = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [analysisData, setAnalysisData] = useState<MatchAnalysis | null>(null);
  const [teams, setTeams] = useState<{home: string, away: string}>({ home: '', away: '' });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Sport State
  const [currentSport, setCurrentSport] = useState<SportType>('SOCCER');

  // Live Match State
  const [todaysMatches, setTodaysMatches] = useState<MatchFixture[]>([]);
  const [loadingMatches, setLoadingMatches] = useState<boolean>(true);

  useEffect(() => {
    const loadMatches = async () => {
      setLoadingMatches(true);
      try {
        const matches = await fetchTodaysMatches(currentSport);
        setTodaysMatches(matches);
      } catch (e) {
        console.error("Error fetching matches", e);
      } finally {
        setLoadingMatches(false);
      }
    };
    loadMatches();
  }, [currentSport]);

  const handleAnalyze = async (home: string, away: string, league: string, liveState?: { score: string, time: string }) => {
    setLoadingState(LoadingState.ANALYZING);
    setErrorMsg(null);
    setTeams({ home, away });
    setAnalysisData(null);
    
    // Scroll to results
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const result = await analyzeMatch(home, away, league, liveState, currentSport);
      setAnalysisData(result);
      setLoadingState(LoadingState.COMPLETE);
    } catch (error) {
      console.error(error);
      setErrorMsg("Failed to analyze match. Please try again or check your API limits.");
      setLoadingState(LoadingState.ERROR);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Background Accents */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-emerald-900/20 rounded-full blur-[120px]"></div>
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-6xl">
        
        {/* Header */}
        <header className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center justify-center space-x-3 bg-slate-800/50 backdrop-blur border border-slate-700 rounded-full px-4 py-1.5 mb-4">
             <Radar className="w-4 h-4 text-emerald-400" />
             <span className="text-xs font-semibold text-emerald-400 tracking-wider uppercase">AI Powered Multi-Sport Predictor</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white">
            MatchOracle<span className="text-emerald-500">.ai</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Advanced prediction engine for Soccer, Basketball, Hockey, and Handball. Analyzing physical factors like fatigue, injuries, and live momentum.
          </p>
        </header>

        {/* Match List (Real-time/Today) */}
        <MatchList 
          matches={todaysMatches} 
          isLoading={loadingMatches} 
          onSelectMatch={handleAnalyze} 
        />

        {/* Input Section */}
        <div className="mb-16">
          <TeamInput 
            onAnalyze={(h, a, l) => handleAnalyze(h, a, l)} 
            onSportChange={setCurrentSport}
            currentSport={currentSport}
            disabled={loadingState === LoadingState.ANALYZING} 
          />
        </div>

        {/* Error Message */}
        {loadingState === LoadingState.ERROR && (
           <div className="max-w-md mx-auto text-center p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 mb-8">
             {errorMsg}
           </div>
        )}

        {/* Results Section */}
        {loadingState === LoadingState.COMPLETE && analysisData && (
          <AnalysisResult 
            data={analysisData} 
            homeTeam={teams.home} 
            awayTeam={teams.away} 
            sport={currentSport}
          />
        )}
        
        {/* Loading Indicator (Visual only, main logic in button) */}
        {loadingState === LoadingState.ANALYZING && (
          <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-emerald-900 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-slate-400 animate-pulse font-medium">Analyzing physical data & recent form...</p>
          </div>
        )}

        <footer className="mt-24 text-center text-slate-600 text-sm">
          <p>&copy; {new Date().getFullYear()} MatchOracle AI. Data sourced via Google Search Grounding.</p>
          <p className="mt-2 text-xs opacity-60">Predictions are estimates. Please use responsibly.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
