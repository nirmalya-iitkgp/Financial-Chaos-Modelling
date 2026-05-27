import { useState, useMemo, useEffect } from 'react';
import { 
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Play, 
  ArrowLeft, 
  ArrowRight, 
  ShieldAlert, 
  ShieldCheck, 
  Activity, 
  Info, 
  TrendingUp, 
  Coins, 
  Layers, 
  Cpu, 
  BookOpen, 
  Zap,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SCENARIO_CHALLENGES, Challenge } from '../data/challenges';
import { 
  simulateMicrostructure, 
  simulateAssetPrice, 
  simulateMacroCycle 
} from '../utils/mathEngine';
import { SystemParameters } from '../types';

export default function CrisisGame() {
  const [selectedChallengeId, setSelectedChallengeId] = useState<string | null>(null);
  
  // Collapse controls for secondary text/math
  const [showBackstory, setShowBackstory] = useState<boolean>(false);
  const [showMathematics, setShowMathematics] = useState<boolean>(false);

  // 5 dynamic periods of parameters
  const [fivePeriodsParams, setFivePeriodsParams] = useState<SystemParameters[]>([]);
  const [activePeriodIndex, setActivePeriodIndex] = useState<number>(0);
  const [maxRevealedPeriod, setMaxRevealedPeriod] = useState<number>(0);

  const defaultParams: SystemParameters = {
    liquidityDepth: 85,
    hftSpeed: 30,
    triggerSellSize: 150,
    marketMakersPresence: 80,
    meanReversion: 0.65,
    volatilityFeedback: 0.15,
    hurstExponent: 0.50,
    bubbleGrowthRate: 0.01,
    leverageLimit: 1.8,
    centralBankRate: 3.5,
    shockMagnitude: 20,
    recoveryRegenerationSpeed: 7
  };

  // Current selected challenge object lookups
  const activeChallenge = useMemo(() => {
    return SCENARIO_CHALLENGES.find(c => c.id === selectedChallengeId) || null;
  }, [selectedChallengeId]);

  // Reset the scenario to initial default parameters and Period 1
  const resetEntireScenario = () => {
    setPlayHeadIndex(0);
    setActivePeriodIndex(0);
    setMaxRevealedPeriod(0);
    setGameEvaluation(null);
    setIsGameSimulating(false);
    
    if (activeChallenge) {
      let initialParams = { ...defaultParams };
      
      if (activeChallenge.presetId === "gfc_2008") {
        initialParams.leverageLimit = 4.8;
        initialParams.centralBankRate = 5.25;
        initialParams.shockMagnitude = 90;
        initialParams.recoveryRegenerationSpeed = 2;
      } else if (activeChallenge.presetId === "flash_crash_2010") {
        initialParams.liquidityDepth = 25;
        initialParams.hftSpeed = 95;
        initialParams.triggerSellSize = 850;
        initialParams.marketMakersPresence = 15;
      } else if (activeChallenge.presetId === "crypto_bubble_2021") {
        initialParams.meanReversion = 0.15;
        initialParams.volatilityFeedback = 1.85;
        initialParams.hurstExponent = 0.85;
        initialParams.bubbleGrowthRate = 0.08;
      } else if (activeChallenge.presetId === "minsky_boom_2005") {
        initialParams.leverageLimit = 2.9;
        initialParams.centralBankRate = 1.5;
        initialParams.shockMagnitude = 45;
        initialParams.recoveryRegenerationSpeed = 4;
      } else if (activeChallenge.presetId === "aapl_mini_flash_2013") {
        initialParams.liquidityDepth = 55;
        initialParams.hftSpeed = 60;
        initialParams.triggerSellSize = 450;
        initialParams.marketMakersPresence = 55;
      } else if (activeChallenge.presetId === "commodity_supercycle_2010") {
        initialParams.meanReversion = 0.35;
        initialParams.volatilityFeedback = 0.85;
        initialParams.hurstExponent = 0.62;
        initialParams.bubbleGrowthRate = 0.03;
      } else if (activeChallenge.presetId === "quiet_trading") {
        initialParams.liquidityDepth = 85;
        initialParams.hftSpeed = 30;
        initialParams.triggerSellSize = 150;
        initialParams.marketMakersPresence = 80;
      } else if (activeChallenge.presetId === "efficient_equities") {
        initialParams.meanReversion = 0.65;
        initialParams.volatilityFeedback = 0.15;
        initialParams.hurstExponent = 0.50;
        initialParams.bubbleGrowthRate = 0.01;
      } else if (activeChallenge.presetId === "macro_equilibrium") {
        initialParams.leverageLimit = 1.8;
        initialParams.centralBankRate = 3.5;
        initialParams.shockMagnitude = 20;
        initialParams.recoveryRegenerationSpeed = 7;
      }
      
      setFivePeriodsParams(Array(5).fill(null).map(() => ({ ...initialParams })));
    }
  };

  // Load selected scenario parameters
  useEffect(() => {
    if (activeChallenge) {
      resetEntireScenario();
    }
  }, [selectedChallengeId]);

  // Active parameter values loaded in current sliders
  const gameParams = useMemo(() => {
    return fivePeriodsParams[activePeriodIndex] || defaultParams;
  }, [fivePeriodsParams, activePeriodIndex]);

  // Determine indices boundaries/limits for each of the 5 periods
  const getLimitForPeriod = (category: 'microstructure' | 'assetPrice' | 'macroCycle', periodIdx: number) => {
    if (category === 'microstructure') {
      return (periodIdx + 1) * 40;
    } else if (category === 'assetPrice') {
      return (periodIdx + 1) * 60;
    } else {
      return (periodIdx + 1) * 8;
    }
  };

  // Simulating animation states
  const [playHeadIndex, setPlayHeadIndex] = useState<number>(0);
  const [isGameSimulating, setIsGameSimulating] = useState<boolean>(false);
  const [gameEvaluation, setGameEvaluation] = useState<{
    success: boolean;
    reason: string;
    metrics: Record<string, string | number>;
  } | null>(null);

  // Completed challenges tracker (stored in local state but could persist in localStorage)
  const [completedChallenges, setCompletedChallenges] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('stabilizer_game_completed');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const markChallengeAsCompleted = (id: string, success: boolean) => {
    if (success) {
      const updated = { ...completedChallenges, [id]: true };
      setCompletedChallenges(updated);
      try {
        localStorage.setItem('stabilizer_game_completed', JSON.stringify(updated));
      } catch (e) {
        // fail silently
      }
    }
  };

  // Run the core math simulation based on active 5-period parameter sets
  const currentScenarioRunData = useMemo(() => {
    if (!activeChallenge || !fivePeriodsParams.length) return [];
    
    if (activeChallenge.category === 'microstructure') {
      return simulateMicrostructure(fivePeriodsParams, 'chaotic'); // passes the 5-period parameters list
    } else if (activeChallenge.category === 'assetPrice') {
      return simulateAssetPrice(fivePeriodsParams, 'chaotic');
    } else {
      return simulateMacroCycle(fivePeriodsParams, 'chaotic');
    }
  }, [fivePeriodsParams, activeChallenge]);

  // Tick simulation loop
  useEffect(() => {
    if (!isGameSimulating || !activeChallenge || !fivePeriodsParams.length) return;
    
    const category = activeChallenge.category;
    const startTick = activePeriodIndex === 0 ? 0 : getLimitForPeriod(category, activePeriodIndex - 1);
    const endTick = activePeriodIndex === 4 ? currentScenarioRunData.length - 1 : getLimitForPeriod(category, activePeriodIndex);
    
    let current = startTick;
    setPlayHeadIndex(startTick);

    const interval = setInterval(() => {
      // Advance by category-specific step speeds
      const step = category === 'microstructure' ? 1 : category === 'assetPrice' ? 2 : 1;
      current += step;
      
      if (current >= endTick) {
        current = endTick;
        setPlayHeadIndex(current);
        setIsGameSimulating(false);
        clearInterval(interval);
        
        // Elevate revealed limit for past states visualization
        setMaxRevealedPeriod(prev => Math.max(prev, activePeriodIndex + 1));

        // Evaluate win/loss constraints upon final T5 period completion
        if (activePeriodIndex === 4) {
          const evalResult = activeChallenge.evaluate({
            microstructure: currentScenarioRunData,
            assetPrice: currentScenarioRunData,
            macroCycle: currentScenarioRunData
          });
          setGameEvaluation(evalResult);
          markChallengeAsCompleted(activeChallenge.id, evalResult.success);
        }
      } else {
        setPlayHeadIndex(current);
      }
    }, category === 'macroCycle' ? 120 : category === 'assetPrice' ? 30 : 40);

    return () => clearInterval(interval);
  }, [isGameSimulating, currentScenarioRunData, activeChallenge, activePeriodIndex, fivePeriodsParams]);

  // Run instant evaluation across all five periods at once
  const runInstantEvaluation = () => {
    if (!activeChallenge) return;
    setIsGameSimulating(false);
    setPlayHeadIndex(currentScenarioRunData.length - 1);
    setActivePeriodIndex(4);
    setMaxRevealedPeriod(5);
    
    const evalResult = activeChallenge.evaluate({
      microstructure: currentScenarioRunData,
      assetPrice: currentScenarioRunData,
      macroCycle: currentScenarioRunData
    });
    setGameEvaluation(evalResult);
    markChallengeAsCompleted(activeChallenge.id, evalResult.success);
  };

  // Run animated simulation for current period
  const triggerAnimatedSimulation = () => {
    if (!activeChallenge) return;
    setGameEvaluation(null);
    setIsGameSimulating(true);

    const category = activeChallenge.category;
    const startTick = activePeriodIndex === 0 ? 0 : getLimitForPeriod(category, activePeriodIndex - 1);
    setPlayHeadIndex(startTick);
  };

  // Dynamic parameters updater for active period
  const handleSliderValueChange = (key: string, val: number) => {
    setFivePeriodsParams(prev => {
      const copy = prev.map((item, idx) => {
        if (idx === activePeriodIndex) {
          return { ...item, [key]: val };
        }
        return item;
      });
      return copy;
    });

    // Reset progress/outcomes if modifying parameters from a completed or evaluated sequence
    if (gameEvaluation) {
      setGameEvaluation(null);
      setPlayHeadIndex(0);
      setActivePeriodIndex(0);
      setMaxRevealedPeriod(0);
    }
  };

  // SVG Chart builders
  const chartPoints = useMemo(() => {
    if (!currentScenarioRunData || !currentScenarioRunData.length || !activeChallenge) return '';
    
    let sliceCount = 0;
    const category = activeChallenge.category;
    if (isGameSimulating) {
      sliceCount = playHeadIndex + 1;
    } else {
      if (activePeriodIndex === 0) {
        sliceCount = 1;
      } else {
        sliceCount = getLimitForPeriod(category, activePeriodIndex - 1);
      }
    }
    
    if (gameEvaluation || maxRevealedPeriod === 5) {
      sliceCount = currentScenarioRunData.length;
    }

    const values = currentScenarioRunData.map((d: any) => {
      if (activeChallenge.category === 'microstructure') return d.price;
      if (activeChallenge.category === 'assetPrice') return d.chPrice;
      return d.chGDP;
    });

    const minVal = Math.min(...values) * 0.98;
    const maxVal = Math.max(...values) * 1.02;
    const valDiff = maxVal - minVal || 1;

    const width = 800;
    const height = 240;
    const padding = 20;

    return currentScenarioRunData
      .slice(0, sliceCount)
      .map((d: any, idx: number) => {
        const val = activeChallenge.category === 'microstructure' ? d.price :
                    activeChallenge.category === 'assetPrice' ? d.chPrice : d.chGDP;
        
        const x = padding + (idx / (currentScenarioRunData.length - 1)) * (width - padding * 2);
        const y = height - padding - ((val - minVal) / valDiff) * (height - padding * 2);
        return `${x},${y}`;
      })
      .join(' ');
  }, [currentScenarioRunData, isGameSimulating, playHeadIndex, activeChallenge, activePeriodIndex, gameEvaluation, maxRevealedPeriod]);

  const advancePeriod = () => {
    const nextIdx = activePeriodIndex + 1;
    if (nextIdx < 5) {
      setFivePeriodsParams(prev => {
        const copy = [...prev];
        copy[nextIdx] = { ...prev[activePeriodIndex] };
        return copy;
      });
      setActivePeriodIndex(nextIdx);
    }
  };

  // Chart axes helpers
  const chartBoundaries = useMemo(() => {
    if (!currentScenarioRunData || !currentScenarioRunData.length || !activeChallenge) return { min: 0, max: 100 };
    const values = currentScenarioRunData.map((d: any) => {
      if (activeChallenge.category === 'microstructure') return d.price;
      if (activeChallenge.category === 'assetPrice') return d.chPrice;
      return d.chGDP;
    });
    return {
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }, [currentScenarioRunData, activeChallenge]);

  return (
    <div id="crisis-game-panel" className="flex-1 w-full flex flex-col bg-slate-950 font-sans text-slate-100 min-h-screen">
      
      {/* Upper Navigation Rail */}
      <div className="w-full bg-slate-950 border-b border-slate-900 py-3.5 px-6 flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          {selectedChallengeId ? (
            <button 
              id="game-back-to-menu-btn"
              onClick={() => {
                setSelectedChallengeId(null);
                setGameEvaluation(null);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 shadow rounded text-xs hover:text-white text-slate-300 font-mono transition-all border border-slate-900 hover:border-slate-800 cursor-pointer text-center font-bold"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Scenarios List</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Award className="h-4.5 w-4.5 text-amber-500" />
              <span className="font-display font-black text-xs uppercase text-slate-200 tracking-wider">
                Stabilizer Scenarios Mode
              </span>
            </div>
          )}
          
          <div className="h-4 w-px bg-slate-900 hidden md:block"></div>
          
          <div className="hidden md:flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest text-emerald-400 font-black uppercase bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-900/30">
              Crisis Control Room
            </span>
            <span className="text-slate-600 text-[10px] font-mono">
              STABILIZATION RATIO SECURED: {Object.keys(completedChallenges).length} / 9 SCENARIOS
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {selectedChallengeId && (
            <span className="font-mono text-xs text-slate-500 font-bold hidden sm:inline">
              Active Challenge Category: <span className="text-indigo-400 capitalize">{activeChallenge?.category === 'microstructure' ? 'Microstructure Trading' : activeChallenge?.category === 'assetPrice' ? 'Asset Volatility' : 'Macro Debt Cycle'}</span>
            </span>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!selectedChallengeId ? (
          /* LEVEL 1: GRID SCENARIO SELECTOR */
          <motion.main 
            key="sandbox-crisis-list"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 flex flex-col space-y-10"
          >
            <div className="text-center space-y-3 max-w-2xl mx-auto select-none">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[10px] text-amber-300 font-mono uppercase tracking-widest mb-1 shadow-sm">
                <Award className="h-3 w-3 text-amber-400 animate-pulse" /> Historical Crisis Stabilizer Game
              </div>
              <h2 className="text-3xl md:text-5xl font-black font-display tracking-tight text-white leading-none">
                Neutralize Systemic <span className="text-emerald-400">Collapse</span>
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-xl mx-auto">
                Select one of the 9 historical financial scenarios below. Adjust regulatory parameters, alter system feedback loops, and hit target stability bounds before systemic positive-feedback cascades trigger complete collapse.
              </p>
            </div>

            {/* Selector Grid of Challenges */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {SCENARIO_CHALLENGES.map((challenge, index) => {
                const isCompleted = completedChallenges[challenge.id];
                const typeIcon = challenge.category === 'microstructure' ? <Cpu className="h-4 w-4" /> :
                                 challenge.category === 'assetPrice' ? <TrendingUp className="h-4 w-4" /> :
                                 <Layers className="h-4 w-4" />;
                const typeColor = challenge.category === 'microstructure' ? 'text-emerald-400 bg-emerald-950/20 border-emerald-900/40' :
                                  challenge.category === 'assetPrice' ? 'text-indigo-400 bg-indigo-950/20 border-indigo-900/40' :
                                  'text-cyan-400 bg-cyan-950/20 border-cyan-900/40';

                return (
                  <motion.div 
                    key={challenge.id}
                    id={`game-preset-card-${challenge.id}`}
                    whileHover={{ y: -3, borderColor: isCompleted ? '#10b981' : '#334155' }}
                    onClick={() => setSelectedChallengeId(challenge.id)}
                    className={`bg-slate-900/30 rounded-xl border transition-all p-5 flex flex-col justify-between h-64 cursor-pointer select-none relative overflow-hidden group ${
                      isCompleted 
                        ? 'border-emerald-950 hover:bg-slate-900/40 shadow-[0_4px_16px_rgba(16,185,129,0.03)]' 
                        : 'border-slate-900 hover:bg-slate-900/40'
                    }`}
                  >
                    {/* Completion Stamp Watermark badge */}
                    {isCompleted && (
                      <div className="absolute top-0 right-0 p-3 bg-emerald-500/10 text-emerald-400 rounded-bl-xl border-l border-b border-emerald-900/40 flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-wider">
                        <Check className="h-3 w-3" /> SECURED
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 font-mono font-bold tracking-wider uppercase">
                          SCENARIO {index + 1} • {challenge.year}
                        </span>
                        
                        <div className={`p-1.5 rounded border flex items-center justify-center shrink-0 ${typeColor}`}>
                          {typeIcon}
                        </div>
                      </div>

                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold font-display text-white group-hover:text-emerald-400 transition-colors">
                          {challenge.name}
                        </h3>
                        {/* Shorthand specs */}
                        <div className="flex items-center gap-2 text-[9px] font-mono select-none">
                          <span className={`px-1.5 py-0.2 rounded font-black ${
                            challenge.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-950' :
                            challenge.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-950' :
                            'bg-rose-500/10 text-rose-400 border border-rose-950'
                          }`}>
                            {challenge.difficulty}
                          </span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400 capitalize">{challenge.category === 'microstructure' ? 'Limit Book Matching' : challenge.category === 'assetPrice' ? 'Speculative Pricing' : 'Macro Sovereign credit'}</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3">
                        {challenge.backstory}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-900/60 flex items-center justify-between mt-auto">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-black leading-none flex items-center gap-1 group-hover:text-slate-300 transition-colors">
                        <BookOpen className="h-3 w-3 text-indigo-400" /> MISSION PROFILE
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Stabilize Room <ArrowRight className="h-3.3 w-3.3" />
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Quick Informational Bottom Disclaimer segment */}
            <div className="p-4 rounded-xl bg-slate-900/10 border border-slate-900 text-center text-xs text-slate-500 max-w-xl mx-auto font-mono">
              Pro-tip: If simulation dynamics fail due to extreme herding or high leverage loops, inspect the math formula representing the positive-feedback trigger, and decrease parameters fueling it!
            </div>
          </motion.main>
        ) : (
          /* LEVEL 2: COMPREHENSIVE HERO PAGE FOR ACTIVE SCENARIO CHALLENGE */
          <motion.main 
            key="challenge-hero-details"
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.99 }}
            className="flex-1 w-full flex flex-col p-6 overflow-y-auto max-w-7xl mx-auto"
          >
            {/* Header segment with title and breadcrumb */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-900 pb-5 mb-6 gap-4">
              <div className="space-y-1 select-none">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono font-bold tracking-widest text-slate-500 uppercase">
                    Challenge Level Room • {activeChallenge.year}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800 text-[8px] font-mono font-extrabold uppercase">
                    {activeChallenge.difficulty} Difficulty
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-950/40 text-indigo-400 border border-indigo-900/40 text-[8px] font-mono font-black uppercase">
                    Active tuning: Period T{activePeriodIndex + 1}
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black font-display text-white">
                  Scenario Challenge: {activeChallenge.name}
                </h1>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 select-none">
                <button
                  onClick={resetEntireScenario}
                  disabled={isGameSimulating}
                  className="px-3.5 py-2.5 rounded-xl text-xs font-mono bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                  title="Reset scenario to Period 1"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset All</span>
                </button>

                {maxRevealedPeriod > activePeriodIndex && activePeriodIndex < 4 ? (
                  <button
                    onClick={advancePeriod}
                    disabled={isGameSimulating}
                    className="px-5 py-2.5 rounded-xl text-xs font-mono font-bold bg-indigo-600 hover:bg-indigo-500 border border-indigo-700 hover:border-indigo-600 text-white transition-all flex items-center gap-2 cursor-pointer shadow-lg animate-bounce"
                  >
                    <span>Advance to T{activePeriodIndex + 2} Controls</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    id="game-launch-simulation-btn"
                    onClick={triggerAnimatedSimulation}
                    disabled={isGameSimulating || (maxRevealedPeriod > activePeriodIndex)}
                    className={`px-4.5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-md border ${
                      isGameSimulating 
                        ? 'bg-slate-900 border-slate-800 text-indigo-400 cursor-not-allowed font-extrabold animate-pulse'
                        : maxRevealedPeriod > activePeriodIndex
                        ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-500/80 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-700 hover:border-emerald-600 text-slate-950 font-extrabold'
                    }`}
                  >
                    <Play className={`h-4.2 w-4.2 ${isGameSimulating ? 'animate-spin' : ''}`} />
                    <span>
                      {isGameSimulating 
                        ? `Simulating T${activePeriodIndex + 1}...` 
                        : maxRevealedPeriod > activePeriodIndex 
                        ? `T${activePeriodIndex + 1} Done` 
                        : `Simulate Phase T${activePeriodIndex + 1}`
                      }
                    </span>
                  </button>
                )}

                <button
                  id="game-quick-evaluation-btn"
                  onClick={runInstantEvaluation}
                  disabled={isGameSimulating}
                  className="px-4 py-2.5 rounded-xl text-xs font-mono bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-400 font-bold transition-all cursor-pointer shadow-sm"
                >
                  <span>Fast Run T1-T5</span>
                </button>
              </div>
            </div>

            {/* Timeline Progress panel */}
            <div className="bg-slate-900/40 rounded-xl border border-slate-900 p-4 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-indigo-400 font-bold uppercase tracking-wider block">
                  Sovereign Micro-Feedback Loop Timeline
                </span>
                <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                  Neutralize systemic collapses through <span className="text-white underline decoration-indigo-500 decoration-2">5 consecutive periods</span>. 
                  Modify sliders for each interval below, run that phase, then tweak based on feedback.
                </p>
              </div>
              
              <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
                {[0, 1, 2, 3, 4].map((idx) => {
                  const isCompleted = idx < maxRevealedPeriod;
                  const isActive = idx === activePeriodIndex;
                  const label = `T${idx + 1}`;
                  
                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (idx <= maxRevealedPeriod && !isGameSimulating) {
                          setActivePeriodIndex(idx);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 border border-transparent select-none ${
                        idx <= maxRevealedPeriod ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'
                      } ${
                        isActive
                          ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_12px_rgba(99,102,241,0.4)] scale-105 font-black'
                          : isCompleted
                          ? 'bg-emerald-950/20 text-emerald-400 border-emerald-900/40 hover:bg-emerald-950/30'
                          : 'bg-slate-950 text-slate-600 border-slate-900/40'
                      }`}
                      title={idx <= maxRevealedPeriod ? "Click to view/edit parameters for this period" : "Awaiting previous intervals simulation"}
                    >
                      {isCompleted ? (
                        <Check className="h-3 w-3 text-emerald-400 stroke-[3px]" />
                      ) : isActive ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping block" strokeWidth="3" />
                      ) : null}
                      <span>Interval {label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 1. Stochastic Evaluation Plot Graph on TOP (Prominent & Full-Width) */}
            <article className="bg-slate-900/10 border border-slate-900 rounded-xl p-5 mb-6 shadow-lg space-y-3">
              <div className="flex items-center justify-between border-b border-slate-900 pb-2 select-none font-mono">
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-indigo-400" />
                  Sovereign Market Trend Real-time Trajectory
                </span>
                {isGameSimulating ? (
                  <span className="text-[8.5px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 animate-pulse font-extrabold border border-amber-500/20">
                    SIMULATION ACTIVE • TICK {playHeadIndex} / {currentScenarioRunData.length - 1}
                  </span>
                ) : (
                  <span className="text-[8.5px] px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 font-bold border border-slate-900">
                    {gameEvaluation ? "SIMULATION COMPLETE" : `AWAITING PHASE T${activePeriodIndex + 1}`}
                  </span>
                )}
              </div>

              <div className="relative bg-slate-950 rounded-xl border border-slate-900 p-2.5 pt-4">
                {/* SVG plotting surface */}
                <div className="h-44 md:h-56 w-full flex items-center justify-center relative">
                  {currentScenarioRunData.length > 0 ? (
                    <svg className="w-full h-full" viewBox="0 0 800 240" preserveAspectRatio="none">
                      {/* Grid references */}
                      <line x1="20" y1="20" x2="780" y2="20" stroke="#111827" strokeWidth="1" />
                      <line x1="20" y1="60" x2="780" y2="60" stroke="#111827" strokeWidth="1" />
                      <line x1="20" y1="120" x2="780" y2="120" stroke="#111827" strokeWidth="1" strokeDasharray="3" />
                      <line x1="20" y1="180" x2="780" y2="180" stroke="#111827" strokeWidth="1" />
                      <line x1="20" y1="220" x2="780" y2="220" stroke="#111827" strokeWidth="1" />

                      {/* Render historical timeline curve */}
                      {chartPoints && (
                        <polyline
                          fill="none"
                          stroke={isGameSimulating ? "#f59e0b" : gameEvaluation?.success ? "#10b981" : gameEvaluation ? "#f43f5e" : "#6366f1"}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={chartPoints}
                        />
                      )}

                      {/* Dynamic playback head tracking circle */}
                      {chartPoints && (
                        <circle
                          cx={chartPoints.split(' ').pop()?.split(',')[0]}
                          cy={chartPoints.split(' ').pop()?.split(',')[1]}
                          r="5"
                          fill="#ffffff"
                          className={isGameSimulating ? "animate-ping" : ""}
                        />
                      )}
                    </svg>
                  ) : (
                    <div className="text-slate-600 font-mono text-[10px] uppercase select-none">
                      No trajectory dataset analyzed
                    </div>
                  )}
                </div>

                {/* Chart axis label tags */}
                <div className="flex justify-between font-mono text-[8.5px] text-slate-500 px-1 select-none uppercase mt-2">
                  <span>Epoch T0</span>
                  <span>Stochastic trajectory bounds: [{chartBoundaries.min.toFixed(1)}, {chartBoundaries.max.toFixed(1)}]</span>
                  <span>End {currentScenarioRunData.length - 1}</span>
                </div>
              </div>
            </article>

            {/* 2. Interactive Workspace & Split Controls panels below */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Left Side: Regulatory Controls (col span 7) */}
              <section className="lg:col-span-7 space-y-6">
                <article className="bg-slate-900/10 border border-slate-900 rounded-xl p-5 shadow-lg select-none">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
                    <h3 className="text-xs font-bold font-mono uppercase text-slate-200 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-400" /> Regulatory Control Knobs (T{activePeriodIndex + 1})
                    </h3>
                    <span className="text-[8.5px] font-mono text-slate-500 uppercase tracking-widest">
                      Adjust parameters to target stability
                    </span>
                  </div>

                  <div className="space-y-5.5 pt-4">
                    {activeChallenge.knobs.map((knob) => {
                      const currentVal = (gameParams as any)[knob.key] !== undefined ? (gameParams as any)[knob.key] : 0;
                      return (
                        <div key={knob.key} className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <label className="font-semibold text-slate-200 font-sans flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                              {knob.label}
                            </label>
                            <span className="font-mono font-black text-indigo-400 px-1.5 py-0.5 rounded bg-indigo-950/20 border border-indigo-900/30">
                              {currentVal}
                              {knob.key === 'centralBankRate' ? '%' : ''}
                              {knob.key === 'leverageLimit' ? 'x' : ''}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <input
                              type="range"
                              min={knob.min}
                              max={knob.max}
                              step={knob.step}
                              value={currentVal}
                              onChange={(e) => handleSliderValueChange(knob.key, parseFloat(e.target.value))}
                              className="flex-1 h-1.2 rounded bg-slate-900 appearance-none accent-indigo-500 cursor-ew-resize outline-none hover:bg-slate-800"
                            />
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono italic">
                            {knob.description}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </article>
              </section>

              {/* Right Side: Goals, Progress Logs and Evaluation Outputs (col span 5) */}
              <section className="lg:col-span-5 space-y-6">
                
                {/* Target Objectives Goal */}
                <article className="p-4.5 bg-indigo-950/10 border border-indigo-500/20 rounded-xl space-y-2.5 shadow">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
                    <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-200">
                      Crisis Control Goal Target
                    </h3>
                  </div>
                  <p className="text-xs text-indigo-200 leading-relaxed font-sans font-semibold">
                    {activeChallenge.goal}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono flex items-start gap-1">
                    <Info className="h-3.5 w-3.5 text-indigo-400 shrink-0 mt-0.2" />
                    <span>Rule: {activeChallenge.winExplanation}</span>
                  </p>
                </article>

                {/* Micro-Feedback Sovereign Interval pause card */}
                {maxRevealedPeriod > activePeriodIndex && activePeriodIndex < 4 && !isGameSimulating && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4.5 bg-indigo-950/25 border-2 border-indigo-500/40 rounded-xl space-y-2.5 shadow-[0_0_12px_rgba(99,102,241,0.12)] select-none"
                  >
                    <div className="flex items-center gap-2 text-indigo-400">
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0" />
                      <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-100">
                        Interval T{activePeriodIndex + 1} Paused
                      </h4>
                    </div>
                    <div className="text-[11px] text-slate-300 space-y-1.5 font-sans">
                      <p>
                        Cycle paused at the end of <strong className="text-white">Period T{activePeriodIndex + 1}</strong>.
                      </p>
                      <p className="text-indigo-200">
                        To counter upcoming feedback curves for <strong className="text-white">T{activePeriodIndex + 2}</strong>:
                      </p>
                      <ul className="list-disc pl-4 text-slate-400 space-y-0.5 text-[10px] font-mono">
                        <li>Adjust sliders for Period T{activePeriodIndex + 2}.</li>
                        <li>Click <strong className="text-indigo-400">Advance to T{activePeriodIndex + 2}</strong> at the top to lock in settings.</li>
                      </ul>
                    </div>
                  </motion.div>
                )}

                {/* Success / Failure Outcome Overlay & Historical Reality card */}
                {gameEvaluation && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`border rounded-xl p-5 space-y-3.5 shadow-xl select-none ${
                      gameEvaluation.success 
                        ? 'bg-emerald-950/10 border-emerald-500/30' 
                        : 'bg-rose-950/10 border-rose-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {gameEvaluation.success ? (
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                          <ShieldCheck className="h-5.5 w-5.5 animate-bounce" />
                        </div>
                      ) : (
                        <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                          <XCircle className="h-5.5 w-5.5" />
                        </div>
                      )}
                      
                      <div className="space-y-0.5">
                        <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 font-extrabold block">
                          Mission Performance Report
                        </span>
                        <h4 className={`text-sm font-extrabold font-display uppercase tracking-wider ${gameEvaluation.success ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {gameEvaluation.success ? "Mission Successful" : "Scenario Exploded"}
                        </h4>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                      {gameEvaluation.reason}
                    </p>

                    {/* Scenario specific analytics checklist items */}
                    <div className="grid grid-cols-2 gap-2.5 py-3 px-3 bg-slate-950 rounded-xl border border-slate-900 font-mono text-[9px]">
                      {Object.entries(gameEvaluation.metrics).map(([name, val]) => (
                        <div key={name} className="space-y-0.5 bg-slate-900/30 py-1 px-2 rounded border border-slate-900/60 shadow-inner">
                          <span className="text-slate-500 text-[8px] block uppercase font-bold leading-none">{name}:</span>
                          <span className="text-slate-300 font-black tracking-wide block pt-0.5 text-xs">{val}</span>
                        </div>
                      ))}
                    </div>

                    {/* What Actually Happened narrative backstories */}
                    <div className="p-3 bg-slate-950/80 border border-slate-900 rounded-xl space-y-1 select-text">
                      <div className="flex items-center gap-1 font-mono text-[9px] uppercase font-black text-indigo-400">
                        <Info className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                        <span>Reality Check History</span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-sans font-medium">
                        {activeChallenge.historyTruth}
                      </p>
                    </div>

                    {/* Success action triggers */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={resetEntireScenario}
                        className={`px-3 py-2 rounded-xl text-[11px] font-mono font-bold uppercase transition-all flex items-center justify-center gap-1 cursor-pointer border ${
                          gameEvaluation.success
                            ? 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                            : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-700 hover:border-indigo-600 text-white'
                        }`}
                      >
                        <RotateCcw className="h-3 w-3" />
                        <span>Adjust & Retry</span>
                      </button>

                      <button
                        onClick={() => setSelectedChallengeId(null)}
                        className="px-3 py-2 rounded-xl text-[11px] font-mono bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/30 text-indigo-400 font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shadow"
                      >
                        <span>Choose Scenario</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </motion.div>
                )}

              </section>

            </div>

            {/* 3. Collapsible Additional Info Accordions (At the absolute bottom, keeps UI Simple) */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 mt-6 border-t border-slate-900 select-none">
              <button
                onClick={() => setShowBackstory(!showBackstory)}
                className={`flex-1 py-3 px-4 rounded-xl border font-mono text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  showBackstory 
                    ? 'bg-indigo-950/20 border-indigo-500/30 text-white' 
                    : 'bg-slate-900/30 hover:bg-slate-900/60 border-slate-900 hover:border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-indigo-400" />
                  <span>{showBackstory ? "Hide Background History" : "Read Background History"}</span>
                </div>
                <span className="text-[10px] text-slate-500">{showBackstory ? "▲ Collapse" : "▼ Expand"}</span>
              </button>

              <button
                onClick={() => setShowMathematics(!showMathematics)}
                className={`flex-1 py-3 px-4 rounded-xl border font-mono text-xs font-bold flex items-center justify-between transition-all cursor-pointer ${
                  showMathematics 
                    ? 'bg-emerald-950/20 border-emerald-500/30 text-white' 
                    : 'bg-slate-900/30 hover:bg-slate-900/60 border-slate-900 hover:border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  <span>{showMathematics ? "Hide Mathematical Formulas" : "Read System Mathematics"}</span>
                </div>
                <span className="text-[10px] text-slate-500">{showMathematics ? "▲ Collapse" : "▼ Expand"}</span>
              </button>
            </div>

            <AnimatePresence>
              {showBackstory && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-5 bg-slate-900/30 border border-slate-900 rounded-xl space-y-3 overflow-hidden"
                >
                  <h3 className="text-xs font-bold font-mono uppercase text-indigo-400 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" /> Historical Backstory Detailed Profile
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    {activeChallenge.backstory}
                  </p>
                </motion.div>
              )}

              {showMathematics && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 p-5 bg-slate-900/30 border border-slate-900 rounded-xl space-y-4 overflow-hidden"
                >
                  <h3 className="text-xs font-bold font-mono uppercase text-emerald-400 flex items-center gap-2">
                    <Activity className="h-4 w-4" /> Systemic Mathematics Formulation
                  </h3>
                  
                  {/* Latex styled math equation container */}
                  <div className="py-4 px-3 bg-slate-950 rounded-lg border border-slate-900 font-mono text-xs sm:text-sm text-center text-indigo-300 overflow-x-auto select-all font-black">
                    {activeChallenge.mathematics}
                  </div>
                  
                  <div className="space-y-1.5 flex items-start gap-2 pt-1 px-1">
                    <Info className="h-3.8 w-3.8 text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-400 leading-relaxed font-sans">
                      <b className="text-slate-300">Mathematical Formulation Breakdown:</b> {activeChallenge.mathExplanation}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}
