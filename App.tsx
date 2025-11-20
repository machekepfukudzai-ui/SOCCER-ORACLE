
import React, { useState, useEffect } from 'react';
import { TeamInput } from './components/TeamInput';
import { AnalysisResult } from './components/AnalysisResult';
import { MatchList } from './components/MatchList';
import { LoginScreen } from './components/LoginScreen';
import { analyzeMatch, fetchTodaysMatches } from './services/geminiService';
import { authService } from './services/authService';
import { MatchAnalysis, MatchFixture, LoadingState, SportType, User } from './types';
import { Radar, LogOut, User as UserIcon } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.IDLE);
  const [analysisData, setAnalysisData] = useState<MatchAnalysis | null>(null);
  const [teams, setTeams] = useState<{home: string, away: string}>({ home: '', away: '' });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Sport State
  const [currentSport, setCurrentSport] = useState<SportType>('SOCCER');

  // Live Match State
  const [todaysMatches, setTodaysMatches] = useState<MatchFixture[]>([]);
  const [loadingMatches, setLoadingMatches] = useState<boolean>(true);

  // Check for existing session on mount
  useEffect(() => {
    try {
      const storedUser = authService.getCurrentUser();
      if (storedUser) {
        setUser(storedUser);
      }
    } catch (error) {
      console.error("Failed to restore session", error);
      authService.logout();
    }
  }, []);

  useEffect(() => {
    if (user) {
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
    }
  }, [currentSport, user]);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setAnalysisData(null);
    setLoadingState(LoadingState.IDLE);
  };

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

  // Authentication Gate
  if (!user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

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
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Premium Edition</span>
             </div>
          </div>

          <div className="flex items-center space-x-4">
             <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-900/50 rounded-full border border-slate-700/50">
               <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">
                 {user.name.charAt(0).toUpperCase()}
               </div>
               <span className="text-xs text-slate-300 font-medium pr-1">Welcome, {user.name.split(' ')[0]}</span>
             </div>
             
             <button 
               onClick={handleLogout}
               className="flex items-center space-x-2 text-xs font-bold text-slate-400 hover:text-rose-400 transition-colors px-3 py-2 rounded-lg hover:bg-rose-500/10"
             >
               <LogOut className="w-4 h-4" />
               <span>Sign Out</span>
             </button>
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
