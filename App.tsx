
import React, { useState, useEffect } from 'react';
import { TeamInput } from './components/TeamInput';
import { AnalysisResult } from './components/AnalysisResult';
import { MatchList } from './components/MatchList';
import { analyzeMatch, fetchTodaysMatches } from './services/geminiService';
import { MatchAnalysis, MatchFixture, LoadingState, SportType } from './types';
import { Radar, RefreshCw } from 'lucide-react';

const App: React.FC = () => {
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [analysisData, setAnalysisData] = useState<MatchAnalysis | null>(null);
  const [teams, setTeams] = useState<{home: string, away: string, league: string}>({ home: '', away: '', league: '' });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Sport State
  const [currentSport, setCurrentSport] = useState<SportType>('SOCCER');

  // Live Match State
  const [todaysMatches, setTodaysMatches] = useState<MatchFixture[]>([]);
  const [loadingMatches, setLoadingMatches] = useState<boolean>(true);

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

  useEffect(() => {
    loadMatches();
  }, [currentSport]);

  const handleAnalyze = async (home: string, away: string, league: string, liveState?: { score: string, time: string }) => {
    setLoadingState(LoadingState.ANALYZING);
    setErrorMsg(null);
    setTeams({ home, away, league });
    setAnalysisData(null);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });

    try {
      const result = await analyzeMatch(home, away, league, liveState, currentSport);
      setAnalysisData(result);
      setLoadingState(LoadingState.COMPLETE);
    } catch (error) {
      console.error(error);
      setErrorMsg("Failed to analyze match. This may be due to high demand or data connectivity. Please try again.");
      setLoadingState(LoadingState.ERROR);
    }
  };

  const handleRetry = () => {
      if (teams.home && teams.away) {
          handleAnalyze(teams.home, teams.away, teams.league, undefined);
      } else {
          setLoadingState(LoadingState.IDLE);
          setErrorMsg(null);
      }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Background Accents */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-emerald-900/20 rounded-full blur-[120px]"></div>
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-6xl">
        
        {/* Navigation Bar */}
        <nav className="flex flex-col md:flex-row items-center justify-between mb-12 bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-4 shadow-lg">
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
             <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <Radar className="w-6 h-6 text-emerald-400" />
             </div>
             <div>
                <h1 className="text-xl font-black tracking-tight text-white leading-none">
                  MatchOracle<span className="text-emerald-500">.ai</span>
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Global Prediction Engine</span>
             </div>
          </div>
        </nav>

        {/* Intro Content */}
        {loadingState === LoadingState.IDLE && !analysisData && (
          <div className="text-center mb-12 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-3xl md:text-5xl font-bold text-white">
              Predict the <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Unpredictable</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Select a live match below or search manually to generate AI-powered predictions grounded in real-time data.
            </p>
          </div>
        )}

        {/* Match List (Real-time/Today) */}
        <MatchList 
          matches={todaysMatches} 
          isLoading={loadingMatches} 
          onSelectMatch={handleAnalyze} 
          onRefresh={loadMatches}
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

        {/* Error Message with Retry */}
        {loadingState === LoadingState.ERROR && (
           <div className="max-w-md mx-auto text-center p-6 bg-slate-800 border border-slate-700 rounded-xl mb-8 shadow-xl">
             <div className="text-rose-400 font-bold mb-2">Analysis Interrupted</div>
             <p className="text-slate-400 text-sm mb-4">{errorMsg}</p>
             <button 
                onClick={handleRetry}
                className="flex items-center justify-center gap-2 mx-auto bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-full font-bold text-sm transition-all"
             >
                <RefreshCw className="w-4 h-4" /> Try Again
             </button>
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
        
        {/* Loading Indicator */}
        {loadingState === LoadingState.ANALYZING && (
          <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-emerald-900 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-slate-400 animate-pulse font-medium">Analyzing live physical data & form...</p>
          </div>
        )}

        <footer className="mt-24 text-center text-slate-600 text-sm pb-8">
          <p>&copy; {new Date().getFullYear()} MatchOracle AI. Data sourced via Google Search Grounding.</p>
          <p className="mt-2 text-xs opacity-60">Predictions are estimates. Please use responsibly.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
