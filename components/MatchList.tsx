
import React from 'react';
import { MatchFixture } from '../types';
import { Play, Calendar, Trophy, ArrowRight, Activity, Snowflake, Dribbble, Hand } from 'lucide-react';

interface MatchListProps {
  matches: MatchFixture[];
  onSelectMatch: (home: string, away: string, league: string, liveState?: { score: string, time: string }) => void;
  isLoading: boolean;
}

export const MatchList: React.FC<MatchListProps> = ({ matches, onSelectMatch, isLoading }) => {
  
  const getSportIcon = (sport?: string) => {
    switch(sport) {
      case 'BASKETBALL': return <Dribbble className="w-3 h-3" />;
      case 'HOCKEY': return <Snowflake className="w-3 h-3" />;
      case 'HANDBALL': return <Hand className="w-3 h-3" />;
      default: return <Activity className="w-3 h-3" />;
    }
  };

  if (isLoading) {
    return (
      <div className="w-full mb-10">
        <div className="flex items-center space-x-2 mb-4">
          <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Loading Fixtures...</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-slate-800/30 border border-slate-800 rounded-xl h-32 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (matches.length === 0) return null;

  return (
    <div className="w-full mb-12">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <h3 className="text-slate-200 text-sm font-semibold uppercase tracking-wider">Today's Top Matches</h3>
        </div>
        <span className="text-xs text-slate-500">Select a match to analyze</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {matches.map((match, idx) => (
          <button
            key={idx}
            onClick={() => {
              const isLive = match.status === 'LIVE';
              const liveState = isLive && match.score ? { score: match.score, time: match.time } : undefined;
              onSelectMatch(match.home, match.away, match.league, liveState);
            }}
            className="group relative bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/50 hover:border-emerald-500/50 rounded-xl p-4 transition-all duration-300 text-left w-full flex flex-col"
          >
            {/* Status Badge */}
            <div className="flex justify-between items-center mb-4">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 bg-slate-900/50 px-2 py-1 rounded-md">
                {getSportIcon(match.sport)}
                <Trophy className="w-3 h-3 ml-1" /> {match.league}
              </span>
              {match.status === 'LIVE' ? (
                <span className="flex items-center space-x-1.5 bg-rose-500/20 text-rose-400 px-2 py-1 rounded-md border border-rose-500/20 text-[10px] font-bold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                  <span>LIVE {match.time.replace('LIVE', '')}</span>
                </span>
              ) : (
                <span className="text-xs font-mono text-slate-500 bg-slate-900/50 px-2 py-1 rounded-md">{match.time}</span>
              )}
            </div>

            {/* Teams */}
            <div className="flex items-center justify-between flex-1">
              <div className="space-y-3 w-full">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-200 group-hover:text-white transition-colors">{match.home}</span>
                  {match.score && <span className="font-mono font-bold text-emerald-400">{match.score.split('-')[0]}</span>}
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-200 group-hover:text-white transition-colors">{match.away}</span>
                  {match.score && <span className="font-mono font-bold text-rose-400">{match.score.split('-')[1]}</span>}
                </div>
              </div>
            </div>
            
            {/* Hover Action */}
            <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-center text-emerald-400 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
              <span>{match.status === 'LIVE' ? 'Analyze Live Game' : 'Analyze Match'}</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
