
import React, { useState } from 'react';
import { Search, Trophy, Zap, Activity, Snowflake, Dribbble, Hand } from 'lucide-react';
import { SportType } from '../types';

interface TeamInputProps {
  onAnalyze: (home: string, away: string, league: string) => void;
  onSportChange: (sport: SportType) => void;
  currentSport: SportType;
  disabled: boolean;
}

export const TeamInput: React.FC<TeamInputProps> = ({ onAnalyze, onSportChange, currentSport, disabled }) => {
  const [home, setHome] = useState('');
  const [away, setAway] = useState('');
  const [league, setLeague] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (home && away) {
      onAnalyze(home, away, league);
    }
  };

  const sports: { id: SportType; label: string; icon: React.ReactNode }[] = [
    { id: 'SOCCER', label: 'Soccer', icon: <Activity className="w-4 h-4" /> },
    { id: 'BASKETBALL', label: 'Basketball', icon: <Dribbble className="w-4 h-4" /> },
    { id: 'HOCKEY', label: 'Hockey', icon: <Snowflake className="w-4 h-4" /> },
    { id: 'HANDBALL', label: 'Handball', icon: <Hand className="w-4 h-4" /> },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-2xl p-6 shadow-xl space-y-6">
      
      {/* Sport Selector */}
      <div className="flex flex-wrap gap-2 justify-center">
        {sports.map((sport) => (
          <button
            key={sport.id}
            onClick={() => onSportChange(sport.id)}
            disabled={disabled}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-bold transition-all ${
              currentSport === sport.id
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {sport.icon}
            <span>{sport.label}</span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
          
          {/* VS Badge */}
          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-emerald-500 rounded-full items-center justify-center font-bold text-slate-900 z-10 border-4 border-slate-800">
            VS
          </div>

          {/* Home Team */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-400 uppercase tracking-wider">Home Team</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Zap className="h-5 w-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
              </div>
              <input
                type="text"
                value={home}
                onChange={(e) => setHome(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder={currentSport === 'SOCCER' ? "e.g. Man City, Real Madrid..." : currentSport === 'BASKETBALL' ? "e.g. Lakers, Real Madrid Baloncesto..." : "e.g. NY Rangers, PSG Handball..."}
                required
                disabled={disabled}
              />
            </div>
          </div>

          {/* Away Team */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-400 uppercase tracking-wider">Away Team</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Zap className="h-5 w-5 text-slate-500 group-focus-within:text-rose-400 transition-colors" />
              </div>
              <input
                type="text"
                value={away}
                onChange={(e) => setAway(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                placeholder={currentSport === 'SOCCER' ? "e.g. Liverpool, Chelsea..." : "Away Team Name..."}
                required
                disabled={disabled}
              />
            </div>
          </div>
        </div>

        {/* League (Optional) */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-400 uppercase tracking-wider">League (Optional)</label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Trophy className="h-5 w-5 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
            </div>
            <input
              type="text"
              value={league}
              onChange={(e) => setLeague(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
              placeholder={currentSport === 'BASKETBALL' ? "e.g. NBA, EuroLeague" : currentSport === 'HOCKEY' ? "e.g. NHL, KHL" : "e.g. Premier League"}
              disabled={disabled}
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={disabled}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 transform transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {disabled ? (
              <span className="animate-pulse">Scanning {currentSport} Data...</span>
            ) : (
              <>
                <Search className="w-5 h-5" />
                <span>Analyze {currentSport} Match</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
