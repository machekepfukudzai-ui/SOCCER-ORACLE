
import React, { useState, useEffect, useMemo } from 'react';
import { MatchFixture, SportType } from '../types';
import { Play, Calendar, Trophy, ArrowRight, Activity, Snowflake, Dribbble, Hand, RefreshCw, Check, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface MatchListProps {
  matches: MatchFixture[];
  onSelectMatch: (home: string, away: string, league: string, liveState?: { score: string, time: string }) => void;
  onRefresh?: () => void;
  isLoading: boolean;
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export const MatchList: React.FC<MatchListProps> = ({ matches, onSelectMatch, onRefresh, isLoading, selectedDate, onDateChange }) => {
  const [showSuccess, setShowSuccess] = useState(false);

  // Filter States
  const [filterLeague, setFilterLeague] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterSport, setFilterSport] = useState<string>('ALL');

  useEffect(() => {
    if (!isLoading && showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, showSuccess]);

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
      setShowSuccess(true);
    }
  };

  const changeDate = (offset: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + offset);
    onDateChange(date.toISOString().split('T')[0]);
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return 'Today';
    // Append time to avoid timezone shift issues when parsing YYYY-MM-DD
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  };
  
  const getSportIcon = (sport?: string) => {
    switch(sport) {
      case 'BASKETBALL': return <Dribbble className="w-3 h-3" />;
      case 'HOCKEY': return <Snowflake className="w-3 h-3" />;
      case 'HANDBALL': return <Hand className="w-3 h-3" />;
      default: return <Activity className="w-3 h-3" />;
    }
  };

  // derive unique options from data
  const uniqueLeagues = useMemo(() => {
    const leagues = new Set(matches.map(m => m.league));
    return Array.from(leagues).sort();
  }, [matches]);

  const uniqueSports = useMemo(() => {
    const sports = new Set(matches.map(m => m.sport || 'SOCCER'));
    return Array.from(sports).sort();
  }, [matches]);

  // Filter Logic
  const filteredMatches = useMemo(() => {
    return matches.filter(match => {
      const statusMatch = filterStatus === 'ALL' 
        ? true 
        : filterStatus === 'LIVE' 
          ? match.status === 'LIVE' 
          : filterStatus === 'SCHEDULED' 
            ? match.status !== 'LIVE' && match.status !== 'FINISHED'
            : true;

      const leagueMatch = filterLeague === 'ALL' ? true : match.league === filterLeague;
      const sportMatch = filterSport === 'ALL' ? true : (match.sport || 'SOCCER') === filterSport;

      return statusMatch && leagueMatch && sportMatch;
    });
  }, [matches, filterStatus, filterLeague, filterSport]);

  const resetFilters = () => {
    setFilterLeague('ALL');
    setFilterStatus('ALL');
    setFilterSport('ALL');
  };

  const hasActiveFilters = filterLeague !== 'ALL' || filterStatus !== 'ALL' || filterSport !== 'ALL';

  if (isLoading && matches.length === 0) {
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

  return (
    <div className="w-full mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Controls Header */}
      <div className="flex flex-col gap-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-emerald-400" />
            <h3 className="text-slate-200 text-lg font-bold uppercase tracking-wide">Fixtures</h3>
          </div>

          {/* Date Navigator */}
          <div className="flex items-center self-start sm:self-auto bg-slate-800 border border-slate-700 p-1 rounded-lg shadow-sm">
            <button 
              onClick={() => changeDate(-1)} 
              className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
              title="Previous Day"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="relative px-4 py-1 min-w-[140px] text-center group cursor-pointer">
               <input 
                  type="date" 
                  value={selectedDate} 
                  onChange={(e) => onDateChange(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
               />
               <div className="flex items-center justify-center gap-2 group-hover:text-emerald-400 transition-colors">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-bold text-white">{formatDateDisplay(selectedDate)}</span>
               </div>
            </div>

            <button 
              onClick={() => changeDate(1)} 
              className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors"
              title="Next Day"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
           {/* Filters */}
           <div className="flex items-center gap-2 bg-slate-800/50 p-1 rounded-lg border border-slate-700/50 overflow-x-auto max-w-full scrollbar-hide">
              <Filter className="w-3 h-3 text-slate-500 ml-2" />
              
              {/* Status Filter */}
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent text-xs text-slate-300 font-medium py-1.5 px-2 outline-none cursor-pointer hover:text-white border-r border-slate-700/50"
              >
                <option value="ALL">All Status</option>
                <option value="LIVE">Live Now</option>
                <option value="SCHEDULED">Scheduled</option>
              </select>

              {/* Sport Filter */}
              <select 
                value={filterSport}
                onChange={(e) => setFilterSport(e.target.value)}
                className="bg-transparent text-xs text-slate-300 font-medium py-1.5 px-2 outline-none cursor-pointer hover:text-white border-r border-slate-700/50"
              >
                <option value="ALL">All Sports</option>
                {uniqueSports.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              {/* League Filter */}
              <select 
                value={filterLeague}
                onChange={(e) => setFilterLeague(e.target.value)}
                className="bg-transparent text-xs text-slate-300 font-medium py-1.5 px-2 outline-none cursor-pointer hover:text-white max-w-[140px] truncate"
              >
                <option value="ALL">All Leagues</option>
                {uniqueLeagues.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
           </div>

           {hasActiveFilters && (
             <button onClick={resetFilters} className="p-1.5 bg-slate-800 rounded hover:bg-rose-500/20 hover:text-rose-400 text-slate-500 transition-colors" title="Reset Filters">
               <X className="w-4 h-4" />
             </button>
           )}

           <div className="h-4 w-px bg-slate-700 hidden md:block"></div>

           {showSuccess && <span className="text-xs text-emerald-400 animate-in fade-in font-bold">Refreshed!</span>}
           {onRefresh && (
             <button 
               onClick={handleRefresh} 
               disabled={isLoading}
               className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all disabled:opacity-50 flex items-center justify-center border border-slate-700"
               title="Refresh Fixtures"
             >
               {isLoading ? <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" /> : <RefreshCw className="w-4 h-4" />}
             </button>
           )}
        </div>
      </div>
      
      {filteredMatches.length === 0 ? (
        <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-12 text-center">
           <div className="bg-slate-800 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-6 h-6 text-slate-500" />
           </div>
           <p className="text-slate-400 font-medium mb-2">No matches found for {formatDateDisplay(selectedDate)}.</p>
           <p className="text-xs text-slate-500 mb-4">Try changing the filters or selecting a different date.</p>
           
           {hasActiveFilters ? (
             <button onClick={resetFilters} className="text-sm bg-slate-800 hover:bg-slate-700 text-emerald-400 px-4 py-2 rounded-lg transition-colors">
               Clear Filters
             </button>
           ) : onRefresh && (
             <button onClick={handleRefresh} className="text-sm bg-slate-800 hover:bg-slate-700 text-emerald-400 px-4 py-2 rounded-lg transition-colors">
               Refresh Data
             </button>
           )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMatches.map((match, idx) => (
            <button
              key={idx}
              onClick={() => {
                const isLive = match.status === 'LIVE';
                const liveState = isLive && match.score ? { score: match.score, time: match.time } : undefined;
                onSelectMatch(match.home, match.away, match.league, liveState);
              }}
              className="group relative bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/50 hover:border-emerald-500/50 rounded-xl p-4 transition-all duration-300 text-left w-full flex flex-col shadow-sm hover:shadow-lg hover:shadow-emerald-900/10"
            >
              {/* Status Badge */}
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1 bg-slate-900/50 px-2 py-1 rounded-md border border-slate-800">
                  {getSportIcon(match.sport)}
                  <Trophy className="w-3 h-3 ml-1" /> <span className="truncate max-w-[100px]">{match.league}</span>
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
                  <span className="text-xs font-mono text-slate-500 bg-slate-900/50 px-2 py-1 rounded-md border border-slate-800">{match.time}</span>
                )}
              </div>

              {/* Teams */}
              <div className="flex items-center justify-between flex-1">
                <div className="space-y-3 w-full">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-200 group-hover:text-white transition-colors line-clamp-1 mr-2">{match.home}</span>
                    {match.score && <span className="font-mono font-bold text-emerald-400">{match.score.split('-')[0]}</span>}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-200 group-hover:text-white transition-colors line-clamp-1 mr-2">{match.away}</span>
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
      )}
    </div>
  );
};
