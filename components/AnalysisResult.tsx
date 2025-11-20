
import React, { useState, useEffect } from 'react';
import { MatchAnalysis, PlayerStat, SportType } from '../types';
import { TrendingUp, History, AlertTriangle, Activity, ExternalLink, CheckCircle2, Flag, Goal, Percent, BarChart3, Shield, Trophy, Users, Coins, RefreshCw, StickyNote, Timer, Radio, User, Siren, Dribbble, Snowflake, Hand, GripHorizontal, CloudRain, Gavel, Brain, Zap, ArrowRightCircle, Target, Sparkles, EyeOff, Minus, MessageCircle, MapPin, Volume2, Image as ImageIcon, Video, Loader2, Play } from 'lucide-react';
import { fetchLiveOdds, fetchTeamDetails, getStadiumDetails, playMatchAudio, generateMatchImage } from '../services/geminiService';

interface AnalysisResultProps {
  data: MatchAnalysis;
  homeTeam: string;
  awayTeam: string;
  sport: SportType;
}

const SectionCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; colorClass: string; className?: string }> = ({ title, icon, children, colorClass, className = '' }) => (
  <div className={`bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden h-full flex flex-col transition-all duration-500 ${className}`}>
    <div className={`px-5 py-3 border-b border-slate-700/50 bg-slate-800/60 flex items-center space-x-2 ${colorClass}`}>
      {icon}
      <h3 className="font-semibold tracking-wide">{title}</h3>
    </div>
    <div className="p-5 text-slate-300 leading-relaxed whitespace-pre-wrap text-sm flex-1">
      {children}
    </div>
  </div>
);

const StatCard: React.FC<{ label: string; value: string; icon: React.ReactNode; color: string; accentColor: string; className?: string }> = ({ label, value, icon, color, accentColor, className = '' }) => (
  <div className={`relative overflow-hidden bg-slate-800/80 border border-slate-700 rounded-xl p-5 shadow-lg group hover:border-slate-600 transition-all duration-500 ${className}`}>
    <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${accentColor}`}>
      {React.cloneElement(icon as React.ReactElement<any>, { className: "w-16 h-16" })}
    </div>
    <div className="flex items-start space-x-4 relative z-10">
      <div className={`p-3 rounded-xl ${color} bg-opacity-10 shadow-inner`}>
        {React.cloneElement(icon as React.ReactElement<any>, { className: `w-8 h-8 ${color.replace('bg-', 'text-')}` })}
      </div>
      <div className="flex-1">
        <div className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">{label}</div>
        <div className="text-lg font-bold text-white whitespace-pre-wrap leading-snug">{value || "N/A"}</div>
      </div>
    </div>
  </div>
);

const RiskAlert: React.FC<{ content: string; className?: string }> = ({ content, className = '' }) => {
  if (!content || content.toLowerCase().includes('none') || content.length < 3 || content === 'OFFLINE_MODE') return null;

  return (
    <div className={`w-full bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 animate-in fade-in slide-in-from-top-4 duration-500 transition-all ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="bg-red-500/20 p-2 rounded-lg mt-1">
          <Siren className="w-5 h-5 text-red-400 animate-pulse" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-1">Risk & Physical Factor Alert</h3>
          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
      </div>
    </div>
  );
};

const RefereeBadge: React.FC<{ text: string }> = ({ text }) => {
  const lower = text.toLowerCase();
  let tendency = "Moderate";
  let color = "bg-amber-500/10 text-amber-400 border-amber-500/20";
  let icon = <Minus className="w-3 h-3" />;

  if (lower.includes('strict') || lower.includes('high') || lower.includes('red') || lower.includes('many') || lower.includes('heavy')) {
    tendency = "Strict / High Cards";
    color = "bg-rose-500/10 text-rose-400 border-rose-500/20";
    icon = <AlertTriangle className="w-3 h-3" />;
  } else if (lower.includes('lenient') || lower.includes('low') || lower.includes('few') || lower.includes('flow') || lower.includes('let play')) {
    tendency = "Lenient / Flows";
    color = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    icon = <CheckCircle2 className="w-3 h-3" />;
  }

  return (
    <div className={`flex items-center gap-2 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${color} ml-auto`}>
      {icon}
      <span>{tendency}</span>
    </div>
  );
};

const TeamLogo: React.FC<{ url?: string, name: string }> = ({ url, name }) => {
  const [error, setError] = useState(false);

  if (!url || error) {
    return (
      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center mb-4 mx-auto shadow-lg group hover:border-slate-500 transition-colors">
        <Shield className="w-8 h-8 md:w-10 md:h-10 text-slate-600 group-hover:text-slate-500" />
      </div>
    );
  }

  return (
    <div className="w-16 h-16 md:w-20 md:h-20 relative mb-4 mx-auto filter drop-shadow-xl hover:scale-105 transition-transform duration-300">
        <img 
            src={url} 
            alt={`${name} logo`} 
            className="w-full h-full object-contain"
            onError={() => setError(true)}
            loading="lazy"
        />
    </div>
  );
};

const ReasoningBreakdown: React.FC<{ content?: string; className?: string }> = ({ content, className = '' }) => {
  if (!content) return null;
  const reasons = content.split('\n').filter(l => l.trim().length > 0);
  return (
    <div className={`bg-slate-900/60 border border-indigo-500/30 rounded-xl p-5 mb-8 relative overflow-hidden transition-all duration-500 ${className}`}>
      <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-indigo-400" />
        <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">Step-by-Step Prediction Logic</h3>
      </div>
      <div className="space-y-3">
        {reasons.map((reason, idx) => (
          <div key={idx} className="flex items-start gap-3 text-sm text-slate-300">
             <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500/50 flex-shrink-0"></div>
             <p className="leading-relaxed">{reason.replace(/^[•-]\s*/, '')}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const LivePredictionPanel: React.FC<{ 
  content?: string, 
  nextGoal?: string,
  liveTip?: string,
  score: string, 
  time: string,
  className?: string 
}> = ({ content, nextGoal, liveTip, score, time, className = '' }) => {
  return (
    <div className={`bg-slate-950 border border-rose-500/30 rounded-2xl overflow-hidden mb-8 shadow-2xl shadow-rose-900/20 animate-in fade-in slide-in-from-top-6 duration-700 transition-all ${className}`}>
      <div className="bg-rose-500/10 border-b border-rose-500/20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
           <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
           </span>
           <h3 className="text-lg font-bold text-white tracking-tight">Live Pulse HUD</h3>
        </div>
        <div className="font-mono font-bold text-rose-400 bg-rose-950/50 px-3 py-1 rounded border border-rose-500/30 shadow-sm">
          {time} • {score}
        </div>
      </div>
      
      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="md:col-span-2 space-y-4">
            <div>
              <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4" /> Momentum Analysis
              </h4>
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">
                {content || "Analyzing current match momentum and pressure..."}
              </p>
            </div>
            {liveTip && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg flex items-start gap-3">
                 <Sparkles className="w-5 h-5 text-emerald-400 mt-0.5" />
                 <div>
                    <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">AI Suggestion</div>
                    <div className="text-white font-medium text-sm">{liveTip}</div>
                 </div>
              </div>
            )}
         </div>
         
         <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 flex flex-col justify-center items-center text-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-rose-500/5 group-hover:bg-rose-500/10 transition-colors"></div>
            <Target className="w-10 h-10 text-rose-500 mb-3 animate-pulse" />
            <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Next Goal Prediction</div>
            <div className="text-white font-bold text-lg md:text-xl">{nextGoal || "Analyzing..."}</div>
         </div>
      </div>
    </div>
  );
};

const FormTrendChart: React.FC<{ homeData: number[]; awayData: number[]; homeTeam: string; awayTeam: string; sport: SportType }> = ({ homeData, awayData, homeTeam, awayTeam, sport }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const height = 100;
  const width = 300;
  const padding = 10;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;
  
  const safeHomeData = homeData && homeData.length > 0 ? homeData : [0,0,0,0,0];
  const safeAwayData = awayData && awayData.length > 0 ? awayData : [0,0,0,0,0];

  const maxVal = Math.max(...safeHomeData, ...safeAwayData, sport === 'BASKETBALL' ? 120 : 3); 
  const minVal = sport === 'BASKETBALL' ? Math.min(...safeHomeData, ...safeAwayData) * 0.8 : 0;
  
  const getPoints = (data: number[]) => {
    return data.map((val, idx) => {
      const x = padding + (idx / (data.length - 1)) * chartW;
      const normalizedVal = (val - minVal) / (maxVal - minVal);
      const y = height - padding - (normalizedVal) * chartH;
      return `${x},${y}`;
    }).join(' ');
  };

  const homePoints = getPoints(safeHomeData);
  const awayPoints = getPoints(safeAwayData);

  return (
    <div className="flex flex-col w-full">
      <div className="flex justify-between items-center mb-2 text-xs font-semibold">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <span className="text-slate-300">{homeTeam}</span>
        </div>
        <div className="flex items-center space-x-2">
           <span className="text-slate-300">{awayTeam}</span>
           <div className="w-3 h-3 rounded-full bg-rose-500"></div>
        </div>
      </div>
      <div className="relative w-full bg-slate-900/50 rounded-lg border border-slate-700/50 p-2">
         <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24 overflow-visible">
            {[0, 0.5, 1].map(t => (
              <line key={t} x1={padding} y1={padding + t * chartH} x2={width-padding} y2={padding + t * chartH} stroke="#334155" strokeWidth="1" strokeDasharray="4 4"/>
            ))}
            <polyline points={homePoints} fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md"/>
            <polyline points={awayPoints} fill="none" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md"/>
         </svg>
         <div className="text-center text-[10px] text-slate-500 mt-1 uppercase tracking-wider">{sport === 'BASKETBALL' ? 'Points Scored (Last 5)' : 'Goals Scored (Last 5)'}</div>
      </div>
    </div>
  );
};

const ProbabilityBar: React.FC<{ home: number; draw: number; away: number; homeTeam: string; awayTeam: string }> = ({ home, draw, away, homeTeam, awayTeam }) => {
  return (
    <div className="w-full space-y-2">
       <div className="flex justify-between text-xs font-semibold text-slate-400">
         <span>{homeTeam} Win</span>
         {draw > 0 && <span>Draw</span>}
         <span>{awayTeam} Win</span>
       </div>
       <div className="w-full h-6 bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
          <div style={{ width: `${home}%` }} className="bg-emerald-500 h-full flex items-center justify-center relative group">
             <span className="text-[10px] font-bold text-emerald-950 px-1">{home}%</span>
          </div>
          {draw > 0 && (
            <div style={{ width: `${draw}%` }} className="bg-slate-600 h-full flex items-center justify-center relative group">
               <span className="text-[10px] font-bold text-slate-200 px-1">{draw}%</span>
            </div>
          )}
          <div style={{ width: `${away}%` }} className="bg-rose-500 h-full flex items-center justify-center relative group">
             <span className="text-[10px] font-bold text-rose-950 px-1">{away}%</span>
          </div>
       </div>
    </div>
  );
};

const OddsDisplay: React.FC<{ 
  odds: { homeWin: number; draw: number; awayWin: number }, 
  probabilities?: { home: number; draw: number; away: number },
  isRefreshing: boolean, 
  onRefresh: () => void,
  bettingMode: boolean
}> = ({ odds, probabilities, isRefreshing, onRefresh, bettingMode }) => {
  
  const calculateEdge = (prob: number, odd: number) => {
    if (!prob || !odd) return null;
    const impliedProb = (1 / odd) * 100;
    const edge = prob - impliedProb;
    return edge > 5.0 ? edge : null; // Show value if edge > 5%
  };

  const homeEdge = probabilities ? calculateEdge(probabilities.home, odds.homeWin) : null;
  const awayEdge = probabilities ? calculateEdge(probabilities.away, odds.awayWin) : null;
  const drawEdge = probabilities ? calculateEdge(probabilities.draw, odds.draw) : null;

  const ValueBadge = ({ edge }: { edge: number | null }) => {
    if (!bettingMode || !edge) return null;
    return (
      <div className="absolute -top-2 -right-2 bg-amber-400 text-amber-950 text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-lg animate-pulse flex items-center border border-amber-300">
        <Sparkles className="w-2 h-2 mr-0.5" /> VALUE
      </div>
    );
  };

  return (
    <div className="bg-slate-900/80 border border-amber-500/30 rounded-xl p-4 relative overflow-hidden">
      {/* Active Pulse Indicator */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-amber-500/50"></div>
      
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
           <Coins className="w-4 h-4" /> Live Market Odds
        </h4>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{isRefreshing ? 'Syncing...' : 'Live'}</span>
          <button onClick={onRefresh} disabled={isRefreshing} className={`p-1.5 rounded hover:bg-slate-800 text-slate-500 hover:text-white border border-slate-700 ${isRefreshing ? 'animate-spin' : ''}`}>
            <RefreshCw className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div className={`bg-slate-800/80 rounded-lg p-3 border transition-all relative ${homeEdge ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]' : 'border-slate-700 hover:border-emerald-500/30'}`}>
           <ValueBadge edge={homeEdge} />
           <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Home</div>
           <div className="text-emerald-400 font-bold font-mono text-lg">{odds.homeWin.toFixed(2)}</div>
           <div className="text-[9px] text-slate-600 mt-1 border-t border-slate-700/50 pt-1">
             Implied: {((1/odds.homeWin)*100).toFixed(0)}%
           </div>
        </div>
        
        <div className={`bg-slate-800/80 rounded-lg p-3 border transition-all relative ${drawEdge ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]' : 'border-slate-700 hover:border-slate-500/30'}`}>
           <ValueBadge edge={drawEdge} />
           <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Draw</div>
           <div className="text-slate-200 font-bold font-mono text-lg">{odds.draw === 0 ? '-' : odds.draw.toFixed(2)}</div>
           <div className="text-[9px] text-slate-600 mt-1 border-t border-slate-700/50 pt-1">
             {odds.draw > 0 ? `Implied: ${((1/odds.draw)*100).toFixed(0)}%` : '-'}
           </div>
        </div>
        
        <div className={`bg-slate-800/80 rounded-lg p-3 border transition-all relative ${awayEdge ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]' : 'border-slate-700 hover:border-rose-500/30'}`}>
           <ValueBadge edge={awayEdge} />
           <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Away</div>
           <div className="text-rose-400 font-bold font-mono text-lg">{odds.awayWin.toFixed(2)}</div>
           <div className="text-[9px] text-slate-600 mt-1 border-t border-slate-700/50 pt-1">
             Implied: {((1/odds.awayWin)*100).toFixed(0)}%
           </div>
        </div>
      </div>
      
      <div className="mt-3 text-[10px] text-slate-600 text-center flex items-center justify-center gap-1">
        <CheckCircle2 className="w-3 h-3" />
        <span>Verified via Google Search Grounding</span>
      </div>
    </div>
  );
};

const PossessionMeter: React.FC<{ home: number; away: number; homeTeam: string; awayTeam: string; sport: SportType }> = ({ home, away, homeTeam, awayTeam, sport }) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-slate-400 font-semibold">
        <span>{homeTeam}</span>
        <span className="text-slate-500">{sport === 'SOCCER' ? 'Possession' : 'Win % Trend'}</span>
        <span>{awayTeam}</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="text-sm font-bold text-emerald-400 w-8 text-right">{home}%</div>
        <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden flex">
          <div style={{ width: `${home}%` }} className="bg-emerald-500/80 h-full"></div>
          <div style={{ width: `${away}%` }} className="bg-rose-500/80 h-full"></div>
        </div>
        <div className="text-sm font-bold text-rose-400 w-8">{away}%</div>
      </div>
    </div>
  )
}

const StrengthComparison: React.FC<{ 
  homeValue?: string, awayValue?: string, 
  homePosition?: string, awayPosition?: string,
  homeRating?: number, awayRating?: number,
  keyPlayers?: { home: PlayerStat[], away: PlayerStat[] },
  homeTeam: string, awayTeam: string 
}> = ({ homeValue, awayValue, homePosition, awayPosition, homeRating, awayRating, keyPlayers, homeTeam, awayTeam }) => {
  const hRating = homeRating || 50;
  const aRating = awayRating || 50;
  return (
    <div className="bg-slate-900/50 rounded-lg p-4 space-y-4 border border-slate-700/50 mb-4">
      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
         <Shield className="w-3 h-3" /> Squad Strength
      </h4>
      <div className="space-y-1">
        <div className="h-2 w-full bg-slate-800 rounded-full flex overflow-hidden">
           <div style={{ width: `${hRating}%` }} className="bg-emerald-500 h-full"></div>
           <div className="flex-1 bg-transparent"></div>
        </div>
        <div className="h-2 w-full bg-slate-800 rounded-full flex overflow-hidden transform rotate-180">
           <div style={{ width: `${aRating}%` }} className="bg-rose-500 h-full"></div>
           <div className="flex-1 bg-transparent"></div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-xs pb-2">
        <div className="space-y-1">
           <div className="text-slate-500">Standing</div>
           <div className="flex justify-between font-semibold">
              <span className="text-emerald-300">{homeTeam}: {homePosition || 'N/A'}</span>
              <span className="text-rose-300">{awayTeam}: {awayPosition || 'N/A'}</span>
           </div>
        </div>
        <div className="space-y-1">
           <div className="text-slate-500">Value/Record</div>
           <div className="flex justify-between font-semibold">
              <span className="text-emerald-300">{homeValue || 'N/A'}</span>
              <span className="text-rose-300">{awayValue || 'N/A'}</span>
           </div>
        </div>
      </div>
      {keyPlayers && (
        <div className="mt-2 pt-4 border-t border-slate-800">
          <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1">
             <User className="w-3 h-3" /> Impact Players
          </h5>
          <div className="grid grid-cols-2 gap-4">
            <div>
               <div className="text-xs font-bold text-emerald-400 mb-2">{homeTeam}</div>
               <div className="space-y-2">
                 {keyPlayers.home?.map((p, i) => (
                   <div key={i} className="bg-slate-800/60 rounded-lg p-2 border border-slate-700/50">
                         <div className="text-xs font-bold text-slate-200 truncate">{p.name}</div>
                         <div className="text-[10px] text-slate-500 leading-tight">{p.stat}</div>
                   </div>
                 ))}
               </div>
            </div>
            <div>
               <div className="text-xs font-bold text-rose-400 mb-2">{awayTeam}</div>
               <div className="space-y-2">
                 {keyPlayers.away?.map((p, i) => (
                   <div key={i} className="bg-slate-800/60 rounded-lg p-2 border border-slate-700/50">
                         <div className="text-xs font-bold text-slate-200 truncate">{p.name}</div>
                         <div className="text-[10px] text-slate-500 leading-tight">{p.stat}</div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ data, homeTeam, awayTeam, sport }) => {
  const { scorePrediction, scoreProbability, totalGoals, corners, cards, weather, referee, redFlags, confidence, summary, recentForm, headToHead, keyFactors, predictionLogic, liveAnalysis, nextGoal, liveTip } = data.sections;
  const stats = data.stats;
  const liveState = data.liveState;
  const [odds, setOdds] = useState(stats?.odds);
  const [isRefreshingOdds, setIsRefreshingOdds] = useState(false);
  const [comparison, setComparison] = useState(stats?.comparison);
  const [bettingMode, setBettingMode] = useState(false);
  
  // New Features State
  const [stadium, setStadium] = useState<{text: string, mapLink?: {uri: string, title: string}} | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  useEffect(() => {
    setOdds(stats?.odds);
    setComparison(stats?.comparison);
    // Fetch Stadium Info automatically
    getStadiumDetails(homeTeam).then(res => setStadium(res));
  }, [stats, homeTeam]);

  const handleManualOddsRefresh = async () => {
    if (isRefreshingOdds) return;
    setIsRefreshingOdds(true);
    try {
      const newOdds = await fetchLiveOdds(homeTeam, awayTeam);
      if (newOdds) setOdds(newOdds);
    } catch (err) {
      console.error("Error refreshing odds", err);
    } finally {
      setIsRefreshingOdds(false);
    }
  };

  const handleShareToWhatsApp = () => {
    const icon = sport === 'BASKETBALL' ? '🏀' : sport === 'HOCKEY' ? '🏒' : '⚽';
    const text = 
      `🤖 *MatchOracle AI Prediction* 🤖%0A%0A` +
      `${icon} *${homeTeam} vs ${awayTeam}*%0A` +
      (liveState?.isLive ? `🔴 *LIVE:* ${liveState.currentScore} (${liveState.matchTime})%0A` : '') +
      `🔮 *Prediction:* ${scorePrediction} ${scoreProbability ? `(${scoreProbability})` : ''}%0A` +
      `📊 *Stats:* ${totalGoals || 'N/A'} | ${corners || 'N/A'}%0A` +
      `🧠 *Confidence:* ${confidence}%0A%0A` +
      `💡 *Verdict:* ${summary}%0A%0A` +
      (liveTip ? `🔥 *Live Tip:* ${liveTip}%0A%0A` : '') +
      `_Generated via MatchOracle AI_`;
    
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handlePlayAudio = async () => {
      if (isPlayingAudio) return;
      setIsPlayingAudio(true);
      await playMatchAudio(`Match Oracle Analysis for ${homeTeam} versus ${awayTeam}. Prediction: ${scorePrediction}. ${summary}`);
      setIsPlayingAudio(false);
  };

  const handleGenerateImage = async () => {
      if (isGeneratingImage) return;
      setIsGeneratingImage(true);
      const prompt = `A realistic cinematic soccer match poster for ${homeTeam} vs ${awayTeam}, stadium atmosphere, 4k, dramatic lighting`;
      const b64 = await generateMatchImage(prompt);
      if (b64) setGeneratedImage(`data:image/jpeg;base64,${b64}`);
      setIsGeneratingImage(false);
  };

  useEffect(() => {
    const fetchDynamicData = async () => {
      try {
        const details = await fetchTeamDetails(homeTeam, awayTeam, sport);
        if (details) setComparison(prev => ({ ...prev, ...details }));
      } catch (e) {}
    };
    fetchDynamicData();
    const intervalId = setInterval(async () => {
      setIsRefreshingOdds(true);
      try {
        const newOdds = await fetchLiveOdds(homeTeam, awayTeam);
        if (newOdds) setOdds(newOdds);
      } catch (err) {} finally { setIsRefreshingOdds(false); }
    }, 120000);
    return () => clearInterval(intervalId);
  }, [homeTeam, awayTeam, sport]);

  const getConfidenceColor = (level?: string) => {
    const l = level?.toLowerCase() || '';
    if (l.includes('high')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (l.includes('medium')) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    if (l.includes('low')) return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
  };

  const focusClass = (isTarget: boolean) => {
    if (!bettingMode) return '';
    return isTarget ? 'ring-2 ring-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.2)] opacity-100 scale-[1.01] z-10 relative transition-all duration-500' : 'opacity-20 grayscale blur-[2px] pointer-events-none transition-all duration-500';
  };

  const getStatLabels = () => {
    switch(sport) {
      case 'BASKETBALL': return { main: { label: "Total Points", icon: <Dribbble /> }, sec: { label: "Rebounds", icon: <Activity /> }, ter: { label: "Turnovers", icon: <GripHorizontal /> } };
      case 'HOCKEY': return { main: { label: "Total Goals", icon: <Goal /> }, sec: { label: "Shots", icon: <Snowflake /> }, ter: { label: "Penalties", icon: <StickyNote /> } };
      case 'HANDBALL': return { main: { label: "Total Goals", icon: <Goal /> }, sec: { label: "7m Throws", icon: <Hand /> }, ter: { label: "Suspensions", icon: <StickyNote /> } };
      default: return { main: { label: "Total Goals", icon: <Goal /> }, sec: { label: "Corners", icon: <Flag /> }, ter: { label: "Cards", icon: <StickyNote /> } };
    }
  }
  const statConfig = getStatLabels();

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      <div className="flex justify-end gap-2">
          <button onClick={handleShareToWhatsApp} className="flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all duration-300 bg-green-600 text-white hover:bg-green-500 border border-green-500 shadow-lg shadow-green-500/20">
              <MessageCircle className="w-4 h-4" />
              Share to WhatsApp
          </button>
          <button onClick={() => setBettingMode(!bettingMode)} className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all duration-300 ${bettingMode ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-slate-700'}`}>
              {bettingMode ? <Target className="w-4 h-4 animate-pulse" /> : <EyeOff className="w-4 h-4" />}
              {bettingMode ? 'Betting Focus Active' : 'Highlight Betting Angles'}
          </button>
      </div>

      {redFlags && <RiskAlert content={redFlags} className={focusClass(true)} />}
      
      {liveState?.isLive && (
        <LivePredictionPanel content={liveAnalysis} nextGoal={nextGoal} liveTip={liveTip} score={liveState.currentScore} time={liveState.matchTime} className={focusClass(true)} />
      )}

      <div className={`relative overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl border border-slate-700 shadow-2xl shadow-black/40 transition-all duration-500 ${bettingMode ? 'opacity-80' : ''}`}>
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="relative p-8 md:p-10 flex flex-col items-center justify-center text-center space-y-8">
          {liveState?.isLive && (
             <div className="absolute top-6 right-6 flex items-center space-x-2 bg-rose-500/20 text-rose-400 px-3 py-1 rounded-full border border-rose-500/20 animate-pulse">
               <Radio className="w-4 h-4" />
               <span className="text-xs font-bold tracking-wider uppercase">In-Play ({liveState.matchTime})</span>
             </div>
          )}
          <div className="flex items-center space-x-3">
             <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest border shadow-sm ${getConfidenceColor(confidence)}`}>
              {confidence || 'AI'} Confidence
             </span>
             <span className="text-xs font-mono text-slate-500 uppercase bg-slate-900/50 px-2 py-1 rounded">{sport}</span>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 w-full">
            <div className="text-center flex-1 order-2 md:order-1 flex flex-col items-center">
              <TeamLogo url={stats?.homeLogo} name={homeTeam} />
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 tracking-tight">{homeTeam}</h2>
              <div className="text-xs md:text-sm font-semibold text-slate-500 uppercase tracking-widest">Home</div>
            </div>
            <div className="flex flex-col items-center min-w-[200px] order-1 md:order-2 bg-slate-950/30 rounded-2xl p-6 border border-slate-700/50 backdrop-blur-sm shadow-inner">
              {liveState?.isLive && (
                <div className="mb-4 pb-4 border-b border-slate-700/50 w-full flex flex-col items-center">
                   <div className="text-lg text-slate-400 uppercase font-bold text-[10px] tracking-widest mb-1">Current</div>
                   <div className="text-3xl font-mono text-white">{liveState.currentScore}</div>
                </div>
              )}
              <div className="text-5xl md:text-7xl font-black text-white tracking-tighter drop-shadow-2xl text-center">
                {scorePrediction || "- : -"}
              </div>
              <span className="text-xs text-emerald-400 mt-3 uppercase tracking-widest font-bold">
                 {liveState?.isLive ? "Predicted Final" : "Projected Score"}
              </span>
              {scoreProbability && (
                <div className="mt-3 flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/50">
                  <Percent className="w-3 h-3 text-slate-400" />
                  <span className="text-xs text-slate-300 font-medium">{scoreProbability}</span>
                </div>
              )}
            </div>
            <div className="text-center flex-1 order-3 flex flex-col items-center">
              <TeamLogo url={stats?.awayLogo} name={awayTeam} />
              <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 tracking-tight">{awayTeam}</h2>
              <div className="text-xs md:text-sm font-semibold text-slate-500 uppercase tracking-widest">Away</div>
            </div>
          </div>
          
          <div className="max-w-3xl mx-auto text-center bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 relative overflow-hidden flex items-center gap-4">
             <p className="text-slate-200 text-lg leading-relaxed font-medium flex-1">"{summary || "Analysis complete."}"</p>
             <button 
                onClick={handlePlayAudio}
                disabled={isPlayingAudio}
                className="bg-slate-700 hover:bg-slate-600 text-emerald-400 p-2 rounded-full transition-colors disabled:opacity-50"
             >
                {isPlayingAudio ? <Loader2 className="w-5 h-5 animate-spin" /> : <Volume2 className="w-5 h-5" />}
             </button>
          </div>
        </div>
      </div>
      
      {/* --- GEN AI MEDIA LAB --- */}
      <div className={`bg-slate-900/60 border border-purple-500/20 rounded-xl p-6 ${focusClass(false)}`}>
          <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <h3 className="font-bold text-purple-100">Generative Media Lab</h3>
              </div>
              <span className="text-[10px] font-bold bg-purple-500/10 text-purple-400 px-2 py-1 rounded border border-purple-500/20">Gemini Powered</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Imagen */}
              <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50 flex flex-col items-center justify-center min-h-[200px]">
                  {generatedImage ? (
                      <div className="relative w-full h-full group">
                          <img src={generatedImage} alt="Generated Poster" className="w-full h-48 object-cover rounded-lg shadow-lg" />
                          <a href={generatedImage} download="match-poster.jpg" className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                              <span className="text-white font-bold text-sm">Download Poster</span>
                          </a>
                      </div>
                  ) : (
                      <div className="text-center space-y-3">
                          <div className="bg-slate-700/50 p-3 rounded-full w-fit mx-auto">
                              <ImageIcon className="w-6 h-6 text-purple-400" />
                          </div>
                          <p className="text-sm text-slate-400">Create a cinematic match poster with AI.</p>
                          <button 
                            onClick={handleGenerateImage}
                            disabled={isGeneratingImage}
                            className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2 mx-auto"
                          >
                            {isGeneratingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            Generate Poster
                          </button>
                      </div>
                  )}
              </div>
              
              {/* Stadium / Veo Placeholder */}
              <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50 space-y-4">
                  <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-blue-400 mt-1" />
                      <div>
                          <h4 className="text-sm font-bold text-slate-200">Stadium Intel</h4>
                          <p className="text-xs text-slate-400 mt-1 leading-relaxed">{stadium?.text || "Locating stadium info via Google Maps..."}</p>
                          {stadium?.mapLink && (
                              <a href={stadium.mapLink.uri} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-2 font-bold">
                                  View on Maps <ExternalLink className="w-3 h-3" />
                              </a>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <ReasoningBreakdown content={predictionLogic} className={focusClass(false)} />

      {stats && (
        <>
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-6`}>
            <div className={`bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 transition-all duration-500 ${focusClass(true)}`}>
              <div className="flex items-center space-x-2 mb-6 text-blue-400">
                <BarChart3 className="w-5 h-5" />
                <h3 className="font-semibold tracking-wide">Win Probability</h3>
              </div>
              <div className="space-y-6">
                  <ProbabilityBar home={stats.winProbability.home} draw={stats.winProbability.draw} away={stats.winProbability.away} homeTeam={homeTeam} awayTeam={awayTeam} />
                  <PossessionMeter home={stats.possession.home} away={stats.possession.away} homeTeam={homeTeam} awayTeam={awayTeam} sport={sport} />
              </div>
            </div>
            <div className={`bg-slate-800/40 border border-slate-700/50 rounded-xl p-6 transition-all duration-500 ${focusClass(false)}`}>
              <div className="flex items-center space-x-2 mb-6 text-purple-400">
                <Activity className="w-5 h-5" />
                <h3 className="font-semibold tracking-wide">Recent Scoring Trend</h3>
              </div>
              <FormTrendChart homeData={stats.homeLast5Goals} awayData={stats.awayLast5Goals} homeTeam={homeTeam} awayTeam={awayTeam} sport={sport} />
            </div>
          </div>
          
          {odds && (
            <div className={`transition-all duration-500 ${focusClass(true)}`}>
              <OddsDisplay odds={odds} probabilities={stats.winProbability} isRefreshing={isRefreshingOdds} onRefresh={handleManualOddsRefresh} bettingMode={bettingMode} />
            </div>
          )}
        </>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label={liveState?.isLive ? "Rest of Game" : statConfig.main.label} value={totalGoals || "Calculating..."} icon={statConfig.main.icon} color="text-emerald-400" accentColor="text-emerald-500" className={focusClass(true)} />
        <StatCard label={statConfig.sec.label} value={corners || "Calculating..."} icon={statConfig.sec.icon} color="text-amber-400" accentColor="text-amber-500" className={focusClass(true)} />
        <StatCard label={statConfig.ter.label} value={cards || "Calculating..."} icon={statConfig.ter.icon} color="text-rose-400" accentColor="text-rose-500" className={focusClass(true)} />
      </div>
      
      {(weather || referee) && (
         <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-500 ${focusClass(true)}`}>
            {weather && (
               <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 flex items-center space-x-4">
                  <div className="bg-blue-500/10 p-3 rounded-full">
                     <CloudRain className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                     <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Conditions</div>
                     <div className="text-sm text-white font-semibold">{weather}</div>
                  </div>
               </div>
            )}
            {referee && (
               <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-amber-500/10 p-3 rounded-full">
                        <Gavel className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                        <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Referee</div>
                        <div className="text-sm text-white font-semibold truncate max-w-[150px]">{referee}</div>
                    </div>
                  </div>
                  <RefereeBadge text={referee} />
               </div>
            )}
         </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SectionCard title="Recent Form Analysis" icon={<Activity className="w-5 h-5" />} colorClass="text-blue-400" className={focusClass(false)}>{recentForm || "No recent form data available."}</SectionCard>
        <SectionCard title="Head to Head History" icon={<History className="w-5 h-5" />} colorClass="text-purple-400" className={focusClass(false)}>{headToHead || "No historical data available."}</SectionCard>
        <SectionCard title={liveState?.isLive ? "Live Factors" : "Key Physical Factors"} icon={liveState?.isLive ? <Timer className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />} colorClass={liveState?.isLive ? "text-rose-400" : "text-amber-400"} className={focusClass(true)}>
          {(comparison || stats?.comparison || stats?.keyPlayers) && (
            <StrengthComparison homeValue={comparison?.homeValue || stats?.comparison?.homeValue} awayValue={comparison?.awayValue || stats?.comparison?.awayValue} homePosition={comparison?.homePosition || stats?.comparison?.homePosition} awayPosition={comparison?.awayPosition || stats?.comparison?.awayPosition} homeRating={comparison?.homeRating || stats?.comparison?.homeRating} awayRating={comparison?.awayRating || stats?.comparison?.awayRating} keyPlayers={stats?.keyPlayers} homeTeam={homeTeam} awayTeam={awayTeam} />
          )}
          {keyFactors || "No critical factors identified."}
        </SectionCard>
        <SectionCard title="AI Logic & Grounding" icon={<TrendingUp className="w-5 h-5" />} colorClass="text-emerald-400" className={focusClass(false)}>
          <p className="text-slate-400 mb-3">Prediction generated using live search results for {sport.toLowerCase()}, analyzing physical metrics, form, and roster availability.</p>
          <div className="flex items-center space-x-2 text-emerald-400 text-sm font-bold bg-emerald-900/20 p-2 rounded-lg w-fit">
            <CheckCircle2 className="w-4 h-4" />
            <span>Live Data Grounding Active</span>
          </div>
        </SectionCard>
      </div>
      {data.groundingChunks && data.groundingChunks.length > 0 && (
        <div className={`bg-slate-900/50 rounded-xl p-6 border border-slate-800 ${focusClass(false)}`}>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Verified Data Sources</h4>
          <div className="flex flex-wrap gap-3">
            {data.groundingChunks.map((chunk, idx) => {
               if (!chunk.web?.uri) return null;
               return (
                <a key={idx} href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-emerald-400 px-3 py-2 rounded-lg text-xs transition-colors border border-slate-700">
                  <span className="truncate max-w-[200px]">{chunk.web.title || "Source Link"}</span>
                  <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
                </a>
               );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
