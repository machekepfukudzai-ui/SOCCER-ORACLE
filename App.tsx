
import React, { useState, useEffect } from 'react';
import { TeamInput } from './components/TeamInput';
import { AnalysisResult } from './components/AnalysisResult';
import { MatchList } from './components/MatchList';
import { analyzeMatch, fetchTodaysMatches } from './services/geminiService';
import { MatchAnalysis, MatchFixture, LoadingState, SportType } from './types';
import { Radar, User as UserIcon } from 'lucide-react';

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
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Free Premium Edition</span>
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
              Select a live match below or search manually to generate AI-powered predictions powered by real-time data grounding.
            </p>
          </div>
        )}

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
        
        {/* Loading Indicator */}
        {loadingState === LoadingState.ANALYZING && (
          <div className="flex flex-col items-center justify-center space-y-4 py-12">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-emerald-900 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-slate-400 animate-pulse font-medium">Analyzing physical data & recent form...</p>
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
