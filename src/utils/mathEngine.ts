/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MicrostructureDataPoint, AssetPriceDataPoint, MacroCycleDataPoint, SystemParameters, SectionType } from "../types";

// Seed-based stable random number generator to ensure smooth parameter edits 
// and non-flickering, deterministic chart updates when sliding the parameters.
class SeededRandom {
  private seed: number;

  constructor(seed: number = 42) {
    this.seed = seed;
  }

  // Linear congruential generator parameters
  public next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  // Box-Muller transform for standard Normal distribution
  public gaussian(): number {
    let u = 0, v = 0;
    while(u === 0) u = this.next(); 
    while(v === 0) v = this.next();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }
}

/**
 * 1. SIMULATE MARKET MICROSTRUCTURE
 * Linear: High liquidity, small random fluctuations, stable bid/ask depth, flat spread.
 * Chaotic (Flash Crash): Feedback cascade where selling triggers algorithmic liquidity pull-out,
 * which gaps the book, driving price downward in a vertical capitulation before partial reset.
 */
export function simulateMicrostructure(
  params: SystemParameters | SystemParameters[],
  regime: 'linear' | 'weakly-nonlinear' | 'chaotic'
): MicrostructureDataPoint[] {
  const rand = new SeededRandom(111);
  const data: MicrostructureDataPoint[] = [];
  const totalTicks = 200;
  
  const paramsList = Array.isArray(params) ? params : Array(5).fill(params);
  let currentPrice = 100.0;

  for (let t = 0; t < totalTicks; t++) {
    const activeParams = paramsList[Math.min(4, Math.floor(t / 40))];
    const baseLiquidity = activeParams.liquidityDepth;
    const hftSpeedFactor = activeParams.hftSpeed;
    const hftRate = hftSpeedFactor / 100;
    
    // Adaptive spread based on market-makers presence
    const defaultSpread = Math.max(0.01, 0.2 - (activeParams.marketMakersPresence / 500));
    const params = activeParams; // back-compat for loop body using 'params'
    let priceTick = 0;
    let spread = defaultSpread;
    let bidDepth = baseLiquidity + rand.next() * 10 - 5;
    let askDepth = baseLiquidity + rand.next() * 10 - 5;
    let hftRatio = hftRate * (0.8 + rand.next() * 0.4);
    let volume = 50 + rand.next() * 100;

    if (regime === 'linear') {
      // Small random walk (Near Brownian motion, no memory, fast mean-reverting impact)
      // Liquidity depth and market makers dampen the random variance
      const mmDampening = 0.7 + (params.marketMakersPresence / 100) * 0.5;
      const dampening = (1 + (baseLiquidity / 20)) * mmDampening;
      
      // HFT presence introduces slight tick noise
      const hftMultiplier = 0.8 + (hftRate * 0.6);
      const randomNoise = (rand.gaussian() * 0.15 * hftMultiplier) / dampening;
      
      priceTick = randomNoise;
      
      // Small panic blip at tick 100 representing standard trading order absorption
      if (t === 100) {
        priceTick -= (params.triggerSellSize / 1500) / mmDampening;
      }
      
      currentPrice += priceTick;
      
      // Keep depth thick and balanced
      bidDepth = Math.max(10, bidDepth);
      askDepth = Math.max(10, askDepth);
    } else if (regime === 'weakly-nonlinear') {
      // Weakly Non-Linear: Mini flash event / Liquidity dip (e.g. AAPL 2013)
      // Sudden trigger around tick 80
      const triggerTick = 80;
      
      if (t < triggerTick) {
        // Routine trading responsive to HFT speed, MM presence and liquidity
        const mmDampening = 0.7 + (params.marketMakersPresence / 100) * 0.5;
        const dampening = (1 + (baseLiquidity / 20)) * mmDampening;
        const hftMultiplier = 0.8 + (hftRate * 0.6);
        priceTick = (rand.gaussian() * 0.12 * hftMultiplier) / dampening;
        currentPrice += priceTick;
      } else if (t >= triggerTick && t < triggerTick + 30) {
        // Sudden order-book asymmetry (transient liquidity dip)
        const elapsed = t - triggerTick;
        
        // Threshold effect: liquidity dries up briefly as a trade occurs
        const shockFactor = params.triggerSellSize / 400; // moderate shock
        const dampeningHawkes = Math.exp(-elapsed * 0.15); // decays quickly
        
        // Hawkes intensity: self-excitation that dies out fast
        const hawkesIntensity = (hftRate * 0.8) * dampeningHawkes;
        
        // Moderate spread expansion cushioned by MM
        const mmCushionFactor = 1.5 - (params.marketMakersPresence / 100);
        spread = defaultSpread * (1.0 + 3.0 * hawkesIntensity * mmCushionFactor);
        
        // Transitory liquidity drain (asymmetric depth)
        bidDepth = Math.max(5, baseLiquidity * (0.2 + 0.8 * (1.0 - dampeningHawkes)));
        askDepth = baseLiquidity * (0.6 + rand.next() * 0.4);
        
        // Temporary price dislocation (dip) cushioned by MM presence
        const mmCushion = 0.6 + (params.marketMakersPresence / 100) * 0.8;
        const dipDrift = -0.08 * (params.triggerSellSize / 400) * (1.0 + hftRate) * dampeningHawkes / mmCushion;
        const noise = rand.gaussian() * 0.1 * (1.0 + hawkesIntensity);
        
        priceTick = dipDrift + noise;
        currentPrice += priceTick;
        volume = 120 + elapsed * (8 * hftSpeedFactor) * dampeningHawkes;
        hftRatio = Math.min(0.95, hftRate * 1.1 + hawkesIntensity * 0.2);
      } else {
        // Self-correction / Mean reversion
        const elapsed = t - (triggerTick + 30);
        const recoveryStrength = 0.12 * (params.marketMakersPresence / 100);
        const noise = rand.gaussian() * 0.1;
        
        // Re-attract to stable center
        const gap = 100.0 - currentPrice;
        priceTick = (gap * 0.05) + recoveryStrength * 0.5 + noise;
        currentPrice += priceTick;
        
        // Gradual recovery of depth and spread
        const recoveryPercent = Math.min(1.0, elapsed / 60);
        bidDepth = Math.max(10, baseLiquidity * 0.3 + baseLiquidity * 0.7 * recoveryPercent);
        askDepth = Math.max(10, baseLiquidity * 0.4 + baseLiquidity * 0.6 * recoveryPercent);
        spread = Math.max(defaultSpread, spread * (0.8 + 0.2 * (1.0 - recoveryPercent)));
        volume = 60 + rand.next() * 80;
        hftRatio = Math.max(hftRate, hftRate * (1.0 - recoveryPercent * 0.3));
      }
    } else {
      // Chaotic: Dynamic feedback flash crash
      // Trigger event occurs around tick 65
      const triggerTick = 65;
      
      if (t < triggerTick) {
        // Quiet trading day
        const dampening = 1 + (baseLiquidity / 20);
        priceTick = (rand.gaussian() * 0.12) / dampening;
        currentPrice += priceTick;
      } else if (t >= triggerTick && t < triggerTick + 45) {
        // Core Crash Phase: Triggered selling cascades on algos
        const elapsed = t - triggerTick;
        
        // Initial large sell impact
        const coreSellTrigger = params.triggerSellSize / 250; // Size of trigger order
        
        // Positive feedback loop strength is boosted by HFT speed
        const cascadeFeedback = (hftRate * 1.4) * Math.sin((elapsed / 45) * Math.PI);
        
        // Order book liquidity dries up
        const spreadMultiplier = 1 + (elapsed * hftRate * 1.5);
        spread = defaultSpread * spreadMultiplier;
        
        // Algos pull orders (liquidity evaporating)
        bidDepth = Math.max(2, baseLiquidity * Math.exp(-elapsed * 0.1));
        askDepth = baseLiquidity * (0.5 + Math.random() * 0.5); // asymmetric depth
        
        // Extreme negative delta price change
        const crashDrift = -0.15 * (1 + elapsed * 0.04) * (1 + hftRate * 1.5);
        const noise = rand.gaussian() * 0.15 * (1 + elapsed * 0.05);
        
        if (elapsed === 0) {
          priceTick = -coreSellTrigger;
        } else {
          priceTick = crashDrift + noise;
        }

        currentPrice += priceTick;
        volume = 200 + elapsed * (15 * hftSpeedFactor);
        hftRatio = Math.min(0.99, hftRate * 1.2 + (elapsed / 60));
      } else {
        // Recovery / Stabilization Phase: Algos re-enter, liquidity returns slowly
        const elapsed = t - (triggerTick + 45);
        const maxDrawdownPrice = currentPrice;
        
        // Stabilizing market force
        const forceRecovery = 0.15 * (params.marketMakersPresence / 100);
        const noise = rand.gaussian() * 0.2;
        
        priceTick = forceRecovery + noise;
        currentPrice = Math.min(100.0, currentPrice + priceTick);
        
        // Depth builds back
        const recoveryPercent = Math.min(1.0, elapsed / 90);
        bidDepth = Math.max(10, baseLiquidity * 0.2 + baseLiquidity * 0.8 * recoveryPercent);
        askDepth = Math.max(10, baseLiquidity * 0.3 + baseLiquidity * 0.7 * recoveryPercent);
        spread = Math.max(defaultSpread, spread * 0.9);
        volume = 100 + rand.next() * 100;
        hftRatio = Math.max(hftRate, hftRate * (1 - recoveryPercent * 0.5));
      }
    }

    // Ensure price doesn't hit weird boundaries
    currentPrice = Math.max(50.0, currentPrice);

    data.push({
      time: t,
      price: Number(currentPrice.toFixed(4)),
      bidDepth: Math.round(bidDepth),
      askDepth: Math.round(askDepth),
      volume: Math.round(volume),
      spread: Number(spread.toFixed(4)),
      hftRatio: Number(hftRatio.toFixed(3)),
    });
  }

  return data;
}

/**
 * 2. SIMULATE ASSET PRICE DYNAMICS (Daily/Weekly Series)
 * Linear: Constant drift (fundamentals) + standard independent Gaussian steps (random walk / thin tail).
 * Weakly Non-Linear: Multi-regime Markov-switching cycles (Bull & Bear correction), stationary GARCH.
 * Chaotic: Volatility clustering (GARCH-like feedback) and fractal speculative bubble-bust trends.
 */
export function simulateAssetPrice(
  params: SystemParameters | SystemParameters[],
  regime: 'linear' | 'weakly-nonlinear' | 'chaotic'
): AssetPriceDataPoint[] {
  const rand = new SeededRandom(222);
  const data: AssetPriceDataPoint[] = [];
  const totalDays = 300;
  
  const paramsList = Array.isArray(params) ? params : Array(5).fill(params);
  let lPrice = 100.0;
  let chPrice = 100.0;
  
  let activeVol = 0.02; // Initial conditional standard deviation for chaotic returns
  let lastChReturn = 0.0;
  let activeState: 'bull' | 'bear' = 'bull';

  // Track fractal memory queue to model self-similarity (unbalanced weight sums)
  const returnsHistory: number[] = [];

  for (let d = 0; d < totalDays; d++) {
    const activeParams = paramsList[Math.min(4, Math.floor(d / 60))];
    const meanRevStrength = activeParams.meanReversion; // Reversion speed to center potential
    const volFeedback = activeParams.volatilityFeedback; // GARCH feedback
    const hurst = activeParams.hurstExponent; // Fractal memory indicator (0.5 = normal, >0.5 = trending)
    const bubbleRate = activeParams.bubbleGrowthRate; // Speculative drift parameter
    const params = activeParams; // back-compat for loop body using 'params'
    // A. LINEAR ASSET DYNAMICS
    // Steady trend around fundamental value. Changes are Gaussian, memoryless.
    const baselineGrowth = 0.05 + bubbleRate * 0.5; // modest standard return drift
    
    // Mean Reversion back to 100 in linear mode
    const linDev = 100.0 - lPrice;
    const linReversion = linDev * meanRevStrength * 0.0003;
    
    // Hurst persistent trend contribution
    let linMemory = 0;
    const hWeightExp = hurst - 0.5;
    if (returnsHistory.length > 0) {
      const historySlice = returnsHistory.slice(-10);
      historySlice.forEach((oldRet, index) => {
        const lag = historySlice.length - index;
        const weight = Math.pow(lag, hWeightExp - 1.2);
        linMemory += oldRet * weight;
      });
    }
    const linMemoryImpact = Math.max(-0.01, Math.min(0.01, linMemory * 0.15));
    
    // Volatility feedback adjustment
    const linVol = 0.012 * (0.7 + volFeedback * 0.3);
    
    const linearReturn = (baselineGrowth / totalDays) + linReversion + linMemoryImpact + rand.gaussian() * linVol;
    lPrice *= (1 + linearReturn);

    // B. CHAOTIC / NON-LINEAR ASSET DYNAMICS (VOLATILITY CLUSTERING & FRACTAL SHOCKS)
    let chReturn = 0.0;

    if (regime === 'linear') {
      // Under stable setting, just match the linear growth or trend nicely
      chReturn = linearReturn;
      chPrice *= (1 + chReturn);
      activeVol = linVol;
    } else if (regime === 'weakly-nonlinear') {
      // WEAKLY NON-LINEAR: Markov Switching between Bull & Bear Regimes with stationary GARCH
      // Transition probabilities react to price level and volatility
      const extremeDeviationFactor = Math.max(0, (chPrice - 100) / 100);
      const lowPriceFactor = Math.max(0, (100 - chPrice) / 100);

      // Probabilities of switching
      const pToBear = 0.04 + 0.12 * extremeDeviationFactor + 0.04 * volFeedback;
      const pToBull = 0.08 + 0.16 * lowPriceFactor;

      if (activeState === 'bull') {
        if (rand.next() < pToBear) {
          activeState = 'bear';
        }
      } else {
        if (rand.next() < pToBull) {
          activeState = 'bull';
        }
      }

      // Base parameters depending on the regime state
      const baseStateDrift = activeState === 'bull' 
        ? (0.10 / totalDays + bubbleRate * 0.2) 
        : (-0.14 / totalDays - volFeedback * 0.005);
      
      const stateBaseVol = activeState === 'bull' ? 0.008 : 0.022;

      // Volatility clustering clustering GARCH(1,1) (Stationary)
      const omega = 1e-5;
      const alpha = volFeedback * 0.18; // Keep stationary (alpha + beta < 1)
      const beta = 0.65;
      const nextVariance = omega + alpha * (lastChReturn * lastChReturn) + beta * (activeVol * activeVol);
      activeVol = Math.sqrt(Math.max(1e-5, nextVariance)) + stateBaseVol * 0.1;

      // Small Hurst persistent memory
      let memorySum = 0;
      const hWeightExp = (hurst * 0.6) - 0.3; // weak to moderate persistence
      if (returnsHistory.length > 0) {
        const historySlice = returnsHistory.slice(-15);
        historySlice.forEach((oldRet, index) => {
          const lag = historySlice.length - index;
          const weight = Math.pow(lag, hWeightExp - 1);
          memorySum += oldRet * weight;
        });
      }
      const fractionalImpact = Math.max(-0.015, Math.min(0.015, memorySum * 0.25));

      // Standard GARCH step
      const shock = rand.gaussian() * activeVol;
      chReturn = baseStateDrift + fractionalImpact + shock;

      // Moderate mean reversion towards fundamental center
      if (chPrice > 140) {
        chReturn -= meanRevStrength * 0.008;
      } else if (chPrice < 70) {
        chReturn += meanRevStrength * 0.008;
      }

      chReturn = Math.max(-0.16, Math.min(0.16, chReturn));
      chPrice *= (1 + chReturn);
      lastChReturn = chReturn;
      returnsHistory.push(chReturn);

    } else {
      // CHAOTIC / FRACTAL BUBBLE & CRASH
      // 1. Volatility Clustering: $\sigma_t^2 = \omega + \alpha \cdot r_{t-1}^2 + \beta \cdot \sigma_{t-1}^2$
      const omega = 0.0001;
      const alpha = volFeedback * 0.45;
      const beta = 0.52;
      
      const nextVariance = omega + alpha * (lastChReturn * lastChReturn) + beta * (activeVol * activeVol);
      activeVol = Math.sqrt(Math.max(1e-6, nextVariance));

      // 2. Speculative Bubble Phase during 60 - 220 ticks
      let bubbleDrift = 0;
      if (d > 60 && d < 215) {
        // Speculative positive feedback (price drive increases price further)
        // Higher bubble rate results in exponential accelerating price before collapse
        const acceleration = Math.pow((d - 60) / 155, 2);
        bubbleDrift = bubbleRate * 1.6 * (1 + acceleration);
      } else if (d >= 215 && d < 235) {
        // Massive bubble pop crash (Negative panic feedback)
        bubbleDrift = -0.07 - (volFeedback * 0.035);
      }

      // 3. Fractal memory (fractional Brownian noise simulator)
      // Long history autocorrelation: sum of previous returns weighted by power law
      let memorySum = 0;
      const hWeightExp = hurst - 0.5; // positive weight for persistent memory (H > 0.5)
      
      if (returnsHistory.length > 0) {
        const historySlice = returnsHistory.slice(-25); // last 25 steps
        historySlice.forEach((oldRet, index) => {
          const lag = historySlice.length - index;
          const weight = Math.pow(lag, hWeightExp - 1);
          memorySum += oldRet * weight;
        });
      }
      const fractionalImpact = Math.max(-0.035, Math.min(0.035, memorySum * 0.45));

      // 4. Mean Reversion boundaries (Strange Attractor pattern inside bounded limit)
      // If price gets too high, gravitational mean reversion pulls back
      let meanReversionAdjustment = 0;
      if (chPrice > 260) {
        meanReversionAdjustment = -meanRevStrength * 0.012 * (chPrice - 260);
      } else if (chPrice < 55) {
        meanReversionAdjustment = meanRevStrength * 0.012 * (55 - chPrice);
      }

      // Final dynamic return calculation
      const shock = rand.gaussian() * activeVol;
      chReturn = (0.01 / totalDays) + bubbleDrift + fractionalImpact + meanReversionAdjustment + shock;
      
      // Limit extreme single-day returns for visualization sanity
      chReturn = Math.max(-0.25, Math.min(0.25, chReturn));
      
      chPrice *= (1 + chReturn);
      lastChReturn = chReturn;
      returnsHistory.push(chReturn);
    }

    // Defensive price floor
    if (chPrice < 10) chPrice = 10;
    if (lPrice < 10) lPrice = 10;

    data.push({
      time: d,
      linearPrice: Number(lPrice.toFixed(2)),
      chPrice: Number(chPrice.toFixed(2)),
      linearVol: Number((0.012 * 100).toFixed(2)), // percentage representation
      chVol: Number((activeVol * 100).toFixed(2)),
      linearReturn: Number((linearReturn * 100).toFixed(3)),
      chReturn: Number((chReturn * 100).toFixed(3))
    });
  }

  return data;
}

/**
 * 3. SIMULATE MACROECONOMIC & FINANCIAL CYCLES
 * Linear (Equilibrium): Stable cycles oscillating around GDP potential. Shocks dissolve smoothly.
 * Chaotic (Regime Shift / Catastrophe): Network feedback levered up. Sinks under normal conditions
 * but a small interest rate raise or credit event causes system to cross bifurcation point (tipping point).
 * It cascades vertically into a deep recessionary sink (basin of attraction).
 */
export function simulateMacroCycle(
  params: SystemParameters | SystemParameters[],
  regime: 'linear' | 'weakly-nonlinear' | 'chaotic'
): MacroCycleDataPoint[] {
  const rand = new SeededRandom(333);
  const data: MacroCycleDataPoint[] = [];
  const totalQuarters = 40; // 10 years (Quarters 0 to 40)
  
  const paramsList = Array.isArray(params) ? params : Array(5).fill(params);
  let lGDP = 100.0;
  let chGDP = 100.0;
  let activeLeverage = paramsList[0].leverageLimit;
  
  // Potential energy function helper. Catastrophe potential: $V(x) = \frac{1}{4}x^4 - \frac{1}{2}\mu(leverage) x^2 - shock \cdot x$
  // Under low leverage, single equilibrium well near 100. Under high leverage, dual equilibria basins: Boom (high state) and Bust (liquidity trap).
  const getPotentialWells = (lev: number, stateVal: number, shockVal: number) => {
    // Normalised position: mapped from 50..150 to -2..2
    const x = (stateVal - 100) / 25;
    const mu = lev > 2.5 ? (lev - 2.5) * 0.8 : 0; // bifurcation parameter
    const s = shockVal / 100;
    
    // Potentials (energy index)
    const energy = 0.25 * Math.pow(x, 4) - 0.5 * mu * Math.pow(x, 2) - s * x;
    return Number(energy.toFixed(3));
  };

  for (let q = 0; q <= totalQuarters; q++) {
    const activeParams = paramsList[Math.min(4, Math.floor(q / 8))];
    const cbRate = activeParams.centralBankRate / 100; // e.g. 5%
    const regenSpeed = activeParams.recoveryRegenerationSpeed / 10;
    const params = activeParams; // back-compat for loop body using 'params'

    // Potential Energy plots for frontend visualization
    const linearEnergy = getPotentialWells(1.5, lGDP, 0);

    // Business oscillation cycle frequency (baseline 4-year cycle: 16 quarters)
    // Dynamic amplitude depends on credit leverage and is dampened by central bank rate
    const leverageAmp = 1.0 + (params.leverageLimit - 1.8) * 0.35;
    const rateCushion = 1.0 + (cbRate * 2.0);
    const cycleFreq = (2 * Math.PI) / 16;
    const baselineOsc = Math.sin(q * cycleFreq) * 1.5 * leverageAmp / rateCushion;
    
    // Core shock event hits at Quarter 15 (e.g., housing market crack / rate hike)
    const shockTime = 16;
    const isShockQuarter = (q === shockTime);
    const rawShockSize = isShockQuarter ? params.shockMagnitude : 0;

    // A. LINEAR ECONOMIC CYCLE
    // Shocks dissipate linearly. Steady economic growth trends smoothly.
    let lGDPDelta = 0.5 + baselineOsc; // Standard quarterly expansion
    if (isShockQuarter) {
      // Shock scales with magnitude and is compounded by leverage
      lGDPDelta -= (rawShockSize * 0.1 * (1.0 + params.leverageLimit * 0.15)); 
    } else if (q > shockTime && q < shockTime + 8) {
      // Linear smooth standard recovery back to steady state, speed controlled by regen slider
      const elapsed = q - shockTime;
      const speedCoeff = 0.035 * params.recoveryRegenerationSpeed;
      lGDPDelta += (elapsed * speedCoeff);
    }
    lGDP += lGDPDelta;
    
    // B. CHAOTIC / WEAKLY NON-LINEAR REGIME SHIFT (METASTABILITY & BIFURCATION SINK)
    let chGDPDelta = 0;
    let chaoticEnergy = 0;

    if (regime === 'linear') {
      chGDPDelta = lGDPDelta;
      chGDP = lGDP;
      activeLeverage = Math.max(1.0, activeLeverage - 0.02);
      chaoticEnergy = linearEnergy;
    } else if (regime === 'weakly-nonlinear') {
      // WEAKLY NON-LINEAR: METASTABLE BOOM (FRAGILE credit-fueled Minsky boom before sudden correction)
      // Leverage amplifies correction slightly, but remains bounded.
      const leveragedAssetFallRatio = 1.0 + (activeLeverage * 0.3);
      chaoticEnergy = getPotentialWells(activeLeverage * 0.85, chGDP, rawShockSize * 0.5);

      if (q < shockTime) {
        // Build leverage and bubble boom
        activeLeverage += 0.028;
        chGDPDelta = 0.55 + baselineOsc * 1.1 + (activeLeverage * 0.12);
        chGDP += chGDPDelta;
      } else if (isShockQuarter) {
        // Moderately sharp drop reflecting debt correction threshold trigger (Minsky Moment)
        const fireSaleLoss = rawShockSize * 0.16 * leveragedAssetFallRatio;
        const creditCrunchMultiplier = 1 + (cbRate * 1.2);
        chGDPDelta = -(fireSaleLoss * creditCrunchMultiplier);
        chGDP += chGDPDelta;
        
        // De-levering
        activeLeverage *= 0.72;
      } else if (q > shockTime && q < shockTime + 11) {
        // Prolonged sluggish stagflation / slow-recovery consolidation
        const elapsed = q - shockTime;
        const deflationFeedbackSpiral = -0.75 * (activeLeverage * 0.075) * Math.exp(-elapsed * 0.11);
        const monetaryCushion = Math.max(0, (0.08 - cbRate) * 7.5);
        
        chGDPDelta = deflationFeedbackSpiral + monetaryCushion + (rand.gaussian() * 0.35);
        chGDP += chGDPDelta;
        
        activeLeverage = Math.max(1.1, activeLeverage - 0.035);
      } else {
        // Robust recovery back towards potential path but with small debt drag
        const elapsed = q - (shockTime + 11);
        const growthPathVal = Math.pow(elapsed / 13, 1.45) * (regenSpeed * 2.3);
        const noise = rand.gaussian() * 0.28;
        
        chGDPDelta = growthPathVal + noise;
        chGDP += chGDPDelta;
        
        activeLeverage += 0.015;
      }
    } else {
      // Non-linear model incorporating debt-deflation feedback loops
      // Leverage amplifies feedback loop.
      const leveragedAssetFallRatio = 1.0 + (activeLeverage * 0.6);
      
      chaoticEnergy = getPotentialWells(activeLeverage, chGDP, rawShockSize);

      if (q < shockTime) {
        // Slow bubble boom as credit builds leverage
        activeLeverage += 0.04;
        chGDPDelta = 0.6 + baselineOsc * 1.2 + (activeLeverage * 0.15);
        chGDP += chGDPDelta;
      } else if (isShockQuarter) {
        // System bifurcates. High leverage locks in catastrophic collapse.
        const fireSaleLoss = rawShockSize * 0.25 * leveragedAssetFallRatio;
        
        // Raising central bank rate increases cost of capital, compounding failures
        const creditCrunchMultiplier = 1 + (cbRate * 2.0);
        
        chGDPDelta = -(fireSaleLoss * creditCrunchMultiplier);
        chGDP += chGDPDelta;
        
        // Leverage forces flash de-levering (bank credit contraction)
        activeLeverage *= 0.65;
      } else if (q > shockTime && q < shockTime + 12) {
        // Severe Recession Phase (Basin of Attraction: liquidity trap / systemic friction)
        const elapsed = q - shockTime;
        
        // Negative feedbacks: low GDP drives high unemployment, driving low credit, causing debt deflation spiral
        const deflationFeedbackSpiral = -1.5 * (activeLeverage * 0.1) * Math.exp(-elapsed * 0.08);
        
        // Central bank intervention (CB rate cuts are simulated as easing recession speed)
        const monetaryCushion = Math.max(0, (0.08 - cbRate) * 12); // low rates alleviate, high rates depress
        
        chGDPDelta = deflationFeedbackSpiral + monetaryCushion + (rand.gaussian() * 0.5);
        chGDP += chGDPDelta;
        
        // Still de-levering
        activeLeverage = Math.max(1.2, activeLeverage - 0.05);
      } else {
        // Rebuilding Phase (Slow non-linear emergence)
        const elapsed = q - (shockTime + 12);
        
        // Sells finished. Non-linear recovery emerges as regeneration speed is reached
        const growthPathVal = Math.pow(elapsed / 12, 1.8) * (regenSpeed * 2.5);
        const noise = rand.gaussian() * 0.4;
        
        chGDPDelta = growthPathVal + noise;
        chGDP += chGDPDelta;
        
        // Leverage starts restoring slowly
        activeLeverage += 0.01;
      }
    }

    // Defensive floors for GDP to prevent negative economies
    lGDP = Math.max(40.0, lGDP);
    chGDP = Math.max(40.0, chGDP);

    // Calculate recession line baseline (average potential)
    const recessionLevel = 90.0;

    data.push({
      time: q,
      linearGDP: Number(lGDP.toFixed(2)),
      chGDP: Number(chGDP.toFixed(2)),
      leverage: Number(activeLeverage.toFixed(2)),
      potentialStable: linearEnergy,
      potentialChaotic: chaoticEnergy,
      recessionLevel: recessionLevel
    });
  }

  return data;
}

/**
 * Historical Crises parameters mapping to default parameters inside simulator
 */
export const HISTORICAL_PRESETS = [
  {
    id: "aapl_mini_flash_2013",
    name: "AAPL Liquidity Dip (2013)",
    year: "2013",
    contextId: "microstructure" as SectionType,
    description: "A weakly non-linear transient feedback event. Some algorithmic response caused moderate order-book dislocation, but order depth self-corrected and the price mean-reverted quickly.",
    defaultRegime: "weakly-nonlinear" as const,
    parameters: {
      liquidityDepth: 55,
      hftSpeed: 60,
      triggerSellSize: 450,
      marketMakersPresence: 55
    }
  },
  {
    id: "flash_crash_2010",
    name: "Flash Crash (2010)",
    year: "2010",
    contextId: "microstructure" as SectionType,
    description: "An intraday order-book feedback loop. An automated institutional sell order triggered high-frequency traders to aggressively withdraw liquidity and join the selling wave, generating a vertical 1,000-point plunge in minutes.",
    defaultRegime: "chaotic" as const,
    parameters: {
      liquidityDepth: 25,
      hftSpeed: 95,
      triggerSellSize: 850,
      marketMakersPresence: 15
    }
  },
  {
    id: "quiet_trading",
    name: "Quiet Market Intraday",
    year: "Continuous",
    contextId: "microstructure" as SectionType,
    description: "A highly liquid, stable session. Many market participants trade independently, resulting in balanced bid-ask spreads and efficient price adjustments that resemble a memoryless Brownian motion.",
    defaultRegime: "linear" as const,
    parameters: {
      liquidityDepth: 85,
      hftSpeed: 30,
      triggerSellSize: 150,
      marketMakersPresence: 80
    }
  },
  {
    id: "gfc_2008",
    name: "Global Financial Crisis",
    year: "2007-2008",
    contextId: "macroCycle" as SectionType,
    description: "A catastrophic systemic bifurcation. Highly levered investment banks holding subprime debt triggered a global credit freeze, which bifurcated stable growth into an unstable debt-deflation spiral.",
    defaultRegime: "chaotic" as const,
    parameters: {
      leverageLimit: 4.8,
      centralBankRate: 5.25, // pre-crisis high rates
      shockMagnitude: 90,
      recoveryRegenerationSpeed: 2
    }
  },
  {
    id: "macro_equilibrium",
    name: "Standard Regulated Expansion",
    year: "1994-1999",
    contextId: "macroCycle" as SectionType,
    description: "A smooth, equilibrium cycle. Economic downturns are gradual and manageable. Monetary policy adjustments effectively dampen macroeconomic shocks, steering the economy back to full trend growth.",
    defaultRegime: "linear" as const,
    parameters: {
      leverageLimit: 1.8,
      centralBankRate: 3.5,
      shockMagnitude: 20,
      recoveryRegenerationSpeed: 7
    }
  },
  {
    id: "minsky_boom_2005",
    name: "Minsky Metastable Boom",
    year: "2003-2007",
    contextId: "macroCycle" as SectionType,
    description: "A weakly non-linear fragile expansion. Low interest rates and cumulative credit growth feed speculative pricing and leverage buildup, generating high pre-shock metastability.",
    defaultRegime: "weakly-nonlinear" as const,
    parameters: {
      leverageLimit: 2.9,
      centralBankRate: 1.5,
      shockMagnitude: 45,
      recoveryRegenerationSpeed: 4
    }
  },
  {
    id: "crypto_bubble_2021",
    name: "Crypto Speculative Run",
    year: "2020-2022",
    contextId: "assetPrice" as SectionType,
    description: "A speculative crypto boom-bust cycle. Relentless positive feedback drives price expansion to extreme peaks, manifesting extreme GARCH volatility clustering, and finally popping with fractal recurring crashes.",
    defaultRegime: "chaotic" as const,
    parameters: {
      meanReversion: 0.15,
      volatilityFeedback: 1.85,
      hurstExponent: 0.85,
      bubbleGrowthRate: 0.08
    }
  },
  {
    id: "efficient_equities",
    name: "EFM Equities Calm Phase",
    year: "2012-2015",
    contextId: "assetPrice" as SectionType,
    description: "Equities trading matching the Efficient Market Hypothesis. Prices oscillate around fundamental values with thin returns and stable volatility over time.",
    defaultRegime: "linear" as const,
    parameters: {
      meanReversion: 0.65,
      volatilityFeedback: 0.15,
      hurstExponent: 0.50, // Pure random walk
      bubbleGrowthRate: 0.01
    }
  },
  {
    id: "commodity_supercycle_2010",
    name: "Commodity Supercycle (2010)",
    year: "2010-2014",
    contextId: "assetPrice" as SectionType,
    description: "A weakly non-linear regime-switching scenario. Periods of extended bullish momentum alternate with abrupt bearish corrections, yet prices remain overall bounded and mean-reverting.",
    defaultRegime: "weakly-nonlinear" as const,
    parameters: {
      meanReversion: 0.35,
      volatilityFeedback: 0.85,
      hurstExponent: 0.62,
      bubbleGrowthRate: 0.03
    }
  }
];
