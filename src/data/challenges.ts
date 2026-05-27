export interface Challenge {
  id: string;
  name: string;
  year: string;
  category: 'microstructure' | 'assetPrice' | 'macroCycle';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  presetId: string;
  backstory: string;
  mathematics: string;
  mathExplanation: string;
  goal: string;
  winExplanation: string;
  historyTruth: string;
  knobs: {
    key: string;
    label: string;
    description: string;
    min: number;
    max: number;
    step: number;
  }[];
  // returns { success: boolean; reason: string; metrics: Record<string, string | number> }
  evaluate: (simulationData: any) => {
    success: boolean;
    reason: string;
    metrics: Record<string, string | number>;
  };
}

export const SCENARIO_CHALLENGES: Challenge[] = [
  {
    id: "gfc",
    name: "Global Financial Crisis",
    year: "2007-2008",
    category: "macroCycle",
    difficulty: "Hard",
    presetId: "gfc_2008",
    backstory: "In 2007, a massive shadow banking credit expansion connected with subprime mortgages created high systemic leverage. When defaults began, the system crossed a tipping point. Highly levered institutions were forced into rapid asset fire sales, which caused a drastic credit crunch and froze international bank lending. This triggered a severe recession, demonstrating how leverage can bifurcate economic balance into a self-reinforcing debt-deflation spiral.",
    mathematics: "Y_t = Y_0 - \\delta_{fire} (L_t) \\cdot (1 + R_{cb}) + \\beta \\cdot \\text{intervene}",
    mathExplanation: "The economic system bifurcates. Leverage ($L_t$) and higher central bank rates ($R_{cb}$) compound collateral fire sale losses during a shock. As GDP enters the deep basin of attraction of a liquidity trap, positive debt-deflation feedbacks trap output far below potential.",
    goal: "Soothe the sovereign crisis: Adjust policy controls to prevent the chaotic GDP from dropping below 85.0 (unregulated shock collapses GDP below 60.0).",
    winExplanation: "You must lower the Maximum Leverage Limit (to <= 2.2x) and reduce the Central Bank Rate (to <= 2.5%) to ease capital cost and release credit pressure, allowing the recovery speed to restore equilibrium.",
    historyTruth: "In 2008, the Federal Reserve lowered interest rates to near 0% and introduced Quantitative Easing (QE) to buy distressed assets, while bank capital standards (Basel III) were later introduced to strictly limit leverage ratios.",
    knobs: [
      { key: "leverageLimit", label: "Max Leverage Limit", description: "Limits how much banks can borrow to fund assets.", min: 1.0, max: 5.0, step: 0.1 },
      { key: "centralBankRate", label: "Central Bank Rate (%)", description: "Cost of borrowing capital; high rates suppress investment.", min: 0.0, max: 15.0, step: 0.25 },
      { key: "shockMagnitude", label: "Economic Shock Size", description: "Magnitude of the surprise default stress test.", min: 0.0, max: 100.0, step: 1.0 },
      { key: "recoveryRegenerationSpeed", label: "Recovery Speed", description: "Structural speed at which consumer demand builds back.", min: 1.0, max: 10.0, step: 0.5 }
    ],
    evaluate: (data: any) => {
      const macro = data.macroCycle || [];
      if (!macro.length) return { success: false, reason: "No simulation data", metrics: {} };
      const minGDP = Math.min(...macro.map((d: any) => d.chGDP));
      const maxLeverage = Math.max(...macro.map((d: any) => d.leverage));
      
      const success = minGDP >= 85.0;
      return {
        success,
        reason: success 
          ? "Excellent work! By regulatory compression of leverage limits and proactive credit easing (lower interest rates), you prevented bankruptcy feedback spirals and cushioned national GDP above 85."
          : `Failure: The national GDP collapsed to a devastating low of ${minGDP.toFixed(1)} points. Leverage was too high or credit was too tight, pushing the economy into a deep structural depression.`,
        metrics: {
          "Minimum GDP Reached": `${minGDP.toFixed(1)} pts`,
          "Peak Leverage Ratio": `${maxLeverage.toFixed(2)}x`,
          "Bankruptcy Threshold": "85.0 pts"
        }
      };
    }
  },
  {
    id: "flash_crash",
    name: "Wall Street Flash Crash",
    year: "2010",
    category: "microstructure",
    difficulty: "Hard",
    presetId: "flash_crash_2010",
    backstory: "On May 6, 2010, inside a 36-minute window, US stock markets plunged about 9% (nearly 1,000 index points) then quickly recovered. An institutional algo sell order self-excited under high-speed high frequency trading (HFT) activity. HFT algorithms aggressively matched and quickly turned around to sell, which dried up order book depth, causing empty bid layers and a vertical price capitulation.",
    mathematics: "\\lambda_t = \\mu + \\int_0^t \\alpha e^{-\\beta(t-s)} dN_s \\quad \\Rightarrow \\quad D_{\\text{bid}} \\to 0",
    mathExplanation: "Under Hawkes self-exciting point processes, algorithmic trades excite more rapid-fire selling. If high-speed bot participation is extremely high and buyer reserves are low, bid depths ($D_{\\text{bid}}$) dry up exponentially, leading to an immediate liquidity vacuum.",
    goal: "Maintain order book stability: Keep the minimum bid depth above 25 contracts and maintain index price above 85.0 (unrestricted crash drops bid depth to 2 and price to 52.0).",
    winExplanation: "You must boost Buyer Reserves (liquidity depth >= 65) and elevate Market Maker Presence (>= 50), while cutting down High-Speed Bot Shares (hftSpeed <= 45) to restrict predatory algorithmic positive loops.",
    historyTruth: "Following the Flash Crash, the SEC implemented mandatory 'Limit-Up/Limit-Down' circuit breakers which automatically pause trading if a stock swings beyond a standard threshold, alongside bans on algorithmic naked access.",
    knobs: [
      { key: "liquidityDepth", label: "Buyer Reserves", description: "Available pool of waiting buy orders in the book.", min: 10, max: 100, step: 1 },
      { key: "hftSpeed", label: "High-Speed Bot Share", description: "Intensity and execution frequency of HFT algos.", min: 1, max: 100, step: 1 },
      { key: "triggerSellSize", label: "Trigger Sell Order", description: "The initial large sell order that shocks the book.", min: 100, max: 1000, step: 50 },
      { key: "marketMakersPresence", label: "Market Maker Share", description: "Constant active quote providers cushioning spreads.", min: 5, max: 100, step: 1 }
    ],
    evaluate: (data: any) => {
      const micro = data.microstructure || [];
      if (!micro.length) return { success: false, reason: "No data", metrics: {} };
      const minBidDepth = Math.min(...micro.map((d: any) => d.bidDepth));
      const minPrice = Math.min(...micro.map((d: any) => d.price));
      const maxSpread = Math.max(...micro.map((d: any) => d.spread));

      const success = minBidDepth >= 25 && minPrice >= 85.0;
      return {
        success,
        reason: success
          ? "Success! You successfully managed the crisis. By capping high-frequency algos, you limited the positive-feedback sell cascade, and your deep buyer/market maker reserves cushioned the price above 85."
          : `Failure: Systemic liquidity evaporated. Minimum bid depth plunged to a fragile ${minBidDepth} contracts, allowing price to plummet to ${minPrice.toFixed(2)}. The HFT algorithmic bots completed their destructive feedback cascade.`,
        metrics: {
          "Minimum Bid Depth": `${minBidDepth} contracts`,
          "Minimum Price Level": `$${minPrice.toFixed(2)}`,
          "Target Bid Depth": ">= 25 contracts",
          "Target Price Safeguard": ">= $85.00"
        }
      };
    }
  },
  {
    id: "crypto_bubble",
    name: "Crypto Bubbles & Crashes",
    year: "2020-2022",
    category: "assetPrice",
    difficulty: "Medium",
    presetId: "crypto_bubble_2021",
    backstory: "Between 2020 and 2022, cryptocurrency asset prices flew to unprecedented peaks before cascading in multiple 70% drawdowns. Low macro rates coupled with retail herd behaviors fueled strong speculative momentum. Because momentum traders buy purely based on recent price trends (high Hurst fractal memory), volatility feed-back (GARCH) took over, feeding a huge speculative bubble that collapsed mathematically as soon as buying momentum slowed down.",
    mathematics: "\\sigma_t^2 = \\omega + \\alpha \\epsilon_{t-1}^2 + \\beta \\sigma_{t-1}^2 \\quad \\& \\quad H_s > 0.5",
    mathExplanation: "A high Hurst fraction ($H_s > 0.5$) indicates long-term positive feedback, driving price bubbles. GARCH volatility feedback ($\\sigma^2_t$) clusters returns; high speculative drift couples with volatility, generating explosive boom-bust cycles.",
    goal: "Pop the bubble safely: Constrain price volatility so that the peak asset price does not exceed 150.0 and the collapse is stabilized above 75.0 (normally price spikes to 195.0 and crashes below 60.0).",
    winExplanation: "You should reduce the Herd Memory Factor (hurstExponent <= 0.60), curb the Hype Growth Speculation (bubbleGrowthRate <= 0.03), and keep the Sentiment Reversion to Value >= 0.40.",
    historyTruth: "The spectacular rise and crash of crypto tokens in 2017 and 2021 was heavily driven by extreme leverage on retail exchanges and herd-centric social herding, leading to structural liquidations.",
    knobs: [
      { key: "meanReversion", label: "Value Pull-Back", description: "Constant force pulling price back to fundamentals.", min: 0.05, max: 1.0, step: 0.05 },
      { key: "volatilityFeedback", label: "Volatility Feedback", description: "GARCH feedback strength multiplying herding waves.", min: 0.0, max: 2.0, step: 0.1 },
      { key: "hurstExponent", label: "Herd Memory Factor", description: "Self-similarity memory. >0.5 signals strong herding.", min: 0.1, max: 0.9, step: 0.02 },
      { key: "bubbleGrowthRate", label: "Hype Growth Speculation", description: "The organic upward speculative drift rate.", min: 0.0, max: 0.1, step: 0.01 }
    ],
    evaluate: (data: any) => {
      const asset = data.assetPrice || [];
      if (!asset.length) return { success: false, reason: "No data", metrics: {} };
      const prices = asset.map((d: any) => d.chPrice);
      const maxPrice = Math.max(...prices);
      const minPrice = Math.min(...prices);

      const success = maxPrice <= 150.0 && minPrice >= 75.0;
      return {
        success,
        reason: success
          ? "Brilliant calibration! By constraining the organic bubble growth and reducing speculative trend-following memory, you kept pricing close to fundamental expectations and smoothed the crash with sentiment reversion."
          : `Failure: Speculative momentum got out of control. Price peaked at a wild $${maxPrice.toFixed(1)} before cratering to $${minPrice.toFixed(1)}. Retail herding created a classic bubble-and-burst cycle.`,
        metrics: {
          "Peak Bubble Price": `$${maxPrice.toFixed(1)}`,
          "Post-Crash Floor": `$${minPrice.toFixed(1)}`,
          "Target Volatility Range": "$75.00 - $150.00"
        }
      };
    }
  },
  {
    id: "minsky_boom",
    name: "Minsky Metastable Boom",
    year: "2003-2007",
    category: "macroCycle",
    difficulty: "Medium",
    presetId: "minsky_boom_2005",
    backstory: "In 1992, economist Hyman Minsky proposed that 'stability is destabilizing.' During long periods of quiet growth, corporate participants slowly increase their leverage. Hedge financing turns to speculative financing, and finally to Ponzi financing. The economy appears highly stable, but actually becomes metastable. When a tiny shock occurs, the system experiences a 'Minsky Moment' and collapses under cascading debt obligations.",
    mathematics: "\\frac{dL}{dt} \\propto \\gamma \\cdot Y_t \\quad \\Rightarrow \\quad \\text{Metastable Basin Boundary Extends}",
    mathExplanation: "Prolonged growth encourages profit-seeking actors to increase leverage ($L_t$). This decreases the distance to the bifurcation edge. Even a small supply shock then triggers a complete state-space transfer into recession.",
    goal: "Protect the credit cycle: Prevent a sharp Minsky Moment: Limit the peak-to-trough GDP contraction to less than 6.0 points (a fragile unregulated boom suffers an immediate 15+ point drop inside 3 quarters).",
    winExplanation: "Reduce the Maximum Leverage Limit (to <= 2.2x), raise the Interest Rate slightly (to >= 2.5% to restrict excessive risk-taking), and maintain moderate shock margins.",
    historyTruth: "The mid-2000s Great Moderation was widely celebrated for low inflation and continuous stability, yet it was hiding massive leverage buildup in commercial mortgages that exploded in 2007.",
    knobs: [
      { key: "leverageLimit", label: "Max Leverage Limit", description: "Borrowing ceiling; restricts excessive leverage expansion.", min: 1.0, max: 5.0, step: 0.1 },
      { key: "centralBankRate", label: "Central Bank Rate (%)", description: "Interest rates set by the Federal Reserve.", min: 0.0, max: 15.0, step: 0.25 },
      { key: "shockMagnitude", label: "Economic Shock Size", description: "The sudden contract shock triggering asset defaults.", min: 0.0, max: 100.0, step: 1.0 },
      { key: "recoveryRegenerationSpeed", label: "Recovery Speed", description: "Economic capacity to repair damaged balance sheets.", min: 1.0, max: 10.0, step: 0.5 }
    ],
    evaluate: (data: any) => {
      const macro = data.macroCycle || [];
      if (!macro.length) return { success: false, reason: "No data", metrics: {} };
      const gdps = macro.map((d: any) => d.chGDP);
      const peakGDP = Math.max(...gdps.slice(0, 15)); // Pre-shock peak
      const shockGDP = Math.min(...gdps.slice(15, 30)); // Post-shock bottom
      const drop = Math.max(0, peakGDP - shockGDP);

      const success = drop <= 6.0;
      return {
        success,
        reason: success
          ? "Outstanding! You managed credit leverage perfectly. Proactive interest rate tightening coupled with strict macroprudential leverage limits limited speculative credit growth. The Minsky Moment was neutralized!"
          : `Failure: A severe Minsky Moment occurred. High pre-shock leverage caused GDP to collapse by ${drop.toFixed(1)} points (from a peak of ${peakGDP.toFixed(1)} to a trough of ${shockGDP.toFixed(1)}). The credit bubble violently popped.`,
        metrics: {
          "GDP Peak-to-Trough drop": `${drop.toFixed(1)} pts`,
          "Target Allowed Drop": "<= 6.0 pts",
          "Stabilized GDP Floor": `${shockGDP.toFixed(1)} pts`
        }
      };
    }
  },
  {
    id: "aapl_jitters",
    name: "AAPL Algorithmic Jitters",
    year: "2013",
    category: "microstructure",
    difficulty: "Easy",
    presetId: "aapl_mini_flash_2013",
    backstory: "In early 2013, Apple (AAPL) stock experienced a sudden, dramatic 'mini flash crash' dropping or jumping several dollars within milliseconds before restoring. These transient events are weakly non-linear and are triggered by temporary imbalance inside the order book spread. When high speed bots trade around moderate shock order sizes, spread buffers thin out but self-correct if market makers are sufficiently present.",
    mathematics: "D_{\\text{ask}} - D_{\\text{bid}} \\to \\text{Transient Spread Expansion}",
    mathExplanation: "High-frequency trade surges trigger temporary Hawkes intensity excitation. The spread widens briefly as liquidity makers lag incoming volume, but recovers as soon as bots slow down and depth refills.",
    goal: "Soften the algorithmic pullback: Ensure the intraday price stays above 96.50 under the non-linear dip (normally price drops to 90.0).",
    winExplanation: "Ensure Buyer Reserves (liquidity depth) are elevated to >= 70, keep Market Maker Presence >= 65, and moderate High-Speed Bot Share (< 60) to provide orderly price clearance.",
    historyTruth: "Mini-flash events happen thousands of times a day across global financial exchanges and are usually invisible to human retail traders, absorbed by market-maker algorithmic inventory reserves.",
    knobs: [
      { key: "liquidityDepth", label: "Buyer Reserves", description: "Default order size depth waiting on the bids.", min: 10, max: 100, step: 1 },
      { key: "hftSpeed", label: "High-Speed Bot Share", description: "HFT activity rate inside trading corridors.", min: 1, max: 100, step: 1 },
      { key: "triggerSellSize", label: "Trigger Sell Order", description: "The sudden sell block order hitting the book.", min: 100, max: 1000, step: 50 },
      { key: "marketMakersPresence", label: "Market Maker Share", description: "Percentage of stable market-making quote providers.", min: 5, max: 100, step: 1 }
    ],
    evaluate: (data: any) => {
      const micro = data.microstructure || [];
      if (!micro.length) return { success: false, reason: "No data", metrics: {} };
      const minPrice = Math.min(...micro.map((d: any) => d.price));

      const success = minPrice >= 96.5;
      return {
        success,
        reason: success
          ? "Success! You managed the micro jitters successfully. Deep buyer reserves and active market-making buffers completely absorbed the algorithmic pullback."
          : `Failure: The index price fell to $${minPrice.toFixed(2)}. The order book bids were too thin to support the trade sizes, and the brief liquidity vacuum triggered a steep pullback.`,
        metrics: {
          "Minimum Price Reached": `$${minPrice.toFixed(2)}`,
          "Required Floor": ">=$96.50",
          "Buyer Liquidity Cushion": "Successful"
        }
      };
    }
  },
  {
    id: "commodity_supercycle",
    name: "Commodity Supercycles",
    year: "2010-2014",
    category: "assetPrice",
    difficulty: "Medium",
    presetId: "commodity_supercycle_2010",
    backstory: "In the early 2010s, commodities (oil, copper, gold) went on a multi-year cycle of extreme upward pressure driven by huge infrastructure demands from emerging markets, followed by sudden cyclical drops. Speculators herded around long-term economic trends, using momentum-following behaviors that created persistent bullish spikes with sudden mean-reverting corrections.",
    mathematics: "dX_t = \\theta (\\mu - X_t)dt + \\sigma(t) dW_t",
    mathExplanation: "Multi-regime drift processes. Mean-reversion pulls prices back to historical long-term averages ($\\mu$), while high self-similarity momentum (Hurst exponent) extends price deviations into prolonged speculative macro-trends.",
    goal: "Curb speculative commodity spikes: Manage parameters so the asset price stays below 110.0 and never collapses below 90.0 (normally price spikes past 125.0, creating extreme inflation and manufacturing shocks).",
    winExplanation: "Lower the Herd Memory Factor (hurstExponent <= 0.55), lower Hype Growth Speculation (bubbleGrowthRate <= 0.02) and keep Value Pull-Back (meanReversion) above 0.50.",
    historyTruth: "The commodity supercycle of 2000-2014 drove inflation across developed nations and ended with a crash in 2014 as global supplies finally expanded in shale oil and mineral mining.",
    knobs: [
      { key: "meanReversion", label: "Value Pull-Back", description: "The strength of anchoring force back to nominal fair value.", min: 0.05, max: 1.0, step: 0.05 },
      { key: "volatilityFeedback", label: "Volatility Feedback", description: "Impact of recent standard returns on current volatility.", min: 0.0, max: 2.0, step: 0.1 },
      { key: "hurstExponent", label: "Herd Memory Factor", description: "Speculative trend persistence index.", min: 0.1, max: 0.9, step: 0.02 },
      { key: "bubbleGrowthRate", label: "Hype Growth Speculation", description: "Base rate of commodity trend drift.", min: 0.0, max: 0.1, step: 0.01 }
    ],
    evaluate: (data: any) => {
      const asset = data.assetPrice || [];
      if (!asset.length) return { success: false, reason: "No data", metrics: {} };
      const prices = asset.map((d: any) => d.chPrice);
      const maxPrice = Math.max(...prices);
      const minPrice = Math.min(...prices);

      const success = maxPrice <= 110.0 && minPrice >= 90.0;
      return {
        success,
        reason: success
          ? "Great work! You curbed the commodity supercycle. Price variance was successfully smoothed out, providing a stable regime for global manufacturing inputs."
          : `Failure: Speculative spikes erupted. Prices reached a peak of $${maxPrice.toFixed(1)} before sliding to $${minPrice.toFixed(1)}. Speculative herd memory extended cycles beyond safe margins.`,
        metrics: {
          "Maximum commodity price": `$${maxPrice.toFixed(1)}`,
          "Minimum commodity price": `$${minPrice.toFixed(1)}`,
          "Target Allowed Ceiling": "$110.00"
        }
      };
    }
  },
  {
    id: "quiet_floor",
    name: "Quiet Market Intraday",
    year: "Continuous",
    category: "microstructure",
    difficulty: "Easy",
    presetId: "quiet_trading",
    backstory: "In highly liquid, standard market states, trade execution matches the expectations of general economic textbooks. Hundreds of independent, small participants buy and sell assets, which cushions transaction impacts. Bid and ask queue depths are balanced and thick, and bid-ask spreads remain extremely tiny and flat, matching a memoryless Brownian motion.",
    mathematics: "dS_t = \\sigma dW_t \\quad \\Rightarrow \\quad \\text{Bid-Ask Spread } \\approx \\text{Constant}",
    mathExplanation: "The limit order book matches an infinite-density queuing process. Independent arrivals satisfy Poisson conditions, ensuring that buy-sell spreads remain stationary and spreads stay tightly pinned near marginal broker fees.",
    goal: "Achieve the ideal efficient market state: Keep the trading spread below 0.12 and bid/ask depths strictly above 50 contracts.",
    winExplanation: "Maximize Buyer Reserves (liquidity depth >= 80) and keep Market Maker Presence >= 75 while limiting High-Speed Bot Share <= 40.",
    historyTruth: "Standard daily stock trading on major equities like AAPL or MSFT operates under this quiet, highly liquid regime about 95% of active market hours.",
    knobs: [
      { key: "liquidityDepth", label: "Buyer Reserves", description: "Number of buy contracts sitting in background bid limits.", min: 10, max: 100, step: 1 },
      { key: "hftSpeed", label: "High-Speed Bot Share", description: "Frequency of trading loops executed by speed bots.", min: 1, max: 100, step: 1 },
      { key: "triggerSellSize", label: "Trigger Sell Order", description: "Magnitude of randomized order imbalances.", min: 100, max: 1000, step: 50 },
      { key: "marketMakersPresence", label: "Market Maker Share", description: "Active spread cushioning quote depth.", min: 5, max: 100, step: 1 }
    ],
    evaluate: (data: any) => {
      const micro = data.microstructure || [];
      if (!micro.length) return { success: false, reason: "No data", metrics: {} };
      const spreads = micro.map((d: any) => d.spread);
      const bidDepths = micro.map((d: any) => d.bidDepth);
      const maxSpread = Math.max(...spreads);
      const minBidDepth = Math.min(...bidDepths);

      const success = maxSpread <= 0.12 && minBidDepth >= 50;
      return {
        success,
        reason: success
          ? "Excellent! You satisfied all criteria. Your high buyer depth and reliable market maker activity provided seamless executions, keeping spreads tight and predictable."
          : `Failure: Spreads surged to ${maxSpread.toFixed(3)} and bid depth sank to ${minBidDepth} contracts. Market liquidity was too poor to satisfy Poisson matching bounds.`,
        metrics: {
          "Maximum Trading Spread": `${maxSpread.toFixed(3)}`,
          "Minimum Bid Depth Found": `${minBidDepth} contracts`,
          "Target Max Spread Limit": "0.12 pts",
          "Target Min Depth Limit": "50 contracts"
        }
      };
    }
  },
  {
    id: "efficient_equities_challenge",
    name: "EFM Equities Calm Phase",
    year: "2012-2015",
    category: "assetPrice",
    difficulty: "Easy",
    presetId: "efficient_equities",
    backstory: "Eugene Fama proposed the Efficient Market Hypothesis (EMH), claiming that asset prices reflect all available information. Prices oscillate in a pure, memoryless random walk around fundamental values. There is no volatility herding, no speculative bubbles, and long-term traders immediately buy up any brief mispricings.",
    mathematics: "\\ln(P_t) = \\ln(P_{t-1}) + \\epsilon_t \\quad \\& \\quad H_s \\approx 0.50",
    mathExplanation: "Hurst exponent near 0.5 indicates that asset returns are non-correlated, proving the absence of momentum. Volatility feedback remains low, which blocks GARCH-driven clustering, and prices revert cleanly.",
    goal: "Prove efficient pricing: Keep the asset price tightly bound within the $96.00 to $104.00 range around historical fair value, neutralizing speculative herding.",
    winExplanation: "Maintain strong Sentiment Reversion (meanReversion >= 0.60), curb the Volatility Feedback (< 0.25), and lock the Herd Memory Factor near 0.50.",
    historyTruth: "US indices like the S&P 500 during the quiet expansion of 2012-2015 stayed closely bound to slow macroeconomic improvements, matching random walks.",
    knobs: [
      { key: "meanReversion", label: "Value Pull-Back", description: "Speculative pull-back forces pulling prices to fundamental 100.", min: 0.05, max: 1.0, step: 0.05 },
      { key: "volatilityFeedback", label: "Volatility Feedback", description: "Impact of past shocks on today's volatility.", min: 0.0, max: 2.0, step: 0.1 },
      { key: "hurstExponent", label: "Herd Memory Factor", description: "Fractal memory. 0.50 indicates zero systemic herding.", min: 0.1, max: 0.9, step: 0.02 },
      { key: "bubbleGrowthRate", label: "Hype Growth Speculation", description: "speculative price upward bias.", min: 0.0, max: 0.1, step: 0.01 }
    ],
    evaluate: (data: any) => {
      const asset = data.assetPrice || [];
      if (!asset.length) return { success: false, reason: "No data", metrics: {} };
      const prices = asset.map((d: any) => d.chPrice);
      const maxPrice = Math.max(...prices);
      const minPrice = Math.min(...prices);

      const success = maxPrice <= 104.0 && minPrice >= 96.0;
      return {
        success,
        reason: success
          ? "Outstanding calibration! You proved that strong mean-reversion and a lack of herd memory prevent the formation of speculative bubbles, maintaining complete market efficiency."
          : `Failure: The asset price drifted out of bounds, reaching extremes of $${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}. Speculative trend memory distorted the efficient market walk.`,
        metrics: {
          "Maximum Price Deviation": `$${maxPrice.toFixed(2)}`,
          "Minimum Price Deviation": `$${minPrice.toFixed(2)}`,
          "Allowed Fair Range": "$96.00 - $104.00"
        }
      };
    }
  },
  {
    id: "regulated_expansion",
    name: "Sustainable Economic Growth",
    year: "1994-1999",
    category: "macroCycle",
    difficulty: "Medium",
    presetId: "macro_equilibrium",
    backstory: "During the 1990s 'Clinton Boom' or 'Great Moderation', macroeconomic indicators recorded high steady growth. Central banking policy was active, using small adjustments to interest rates to preempt inflationary spikes, and commercial banking leverage was strictly bounded by Basel guidelines. Financial default shocks did occur, but they were smoothly absorbed by robust household savings buffers.",
    mathematics: "dY_t = Y_t (k - \\alpha \\cdot R_{cb} ) dt \\quad \\& \\quad L_t \\le L_{max}",
    mathExplanation: "Stable macroeconomic growth paths modeled under constant technological progress. Leverage ($L_t$) remains low, cushioning the economy from bifurcations and keeping the output comfortably in the stable basin of attraction.",
    goal: "Maximize long-term GDP: Ensure the chaotic GDP index climbs above 112.0 point targets at simulation end, while maintaining banking leverage below 2.0x.",
    winExplanation: "Set Max Leverage Limit <= 2.0x, keep Central Bank Rate around 3.5%, and ensure Recovery Speed is set high (>= 7.0).",
    historyTruth: "The 1990s US economy enjoyed 116 consecutive months of growth, the longest recorded expansion in military history up to that point.",
    knobs: [
      { key: "leverageLimit", label: "Max Leverage Limit", description: "Sovereign limit on financial leverage ratios.", min: 1.0, max: 5.0, step: 0.1 },
      { key: "centralBankRate", label: "Central Bank Rate (%)", description: "National interest rate to check price inflation.", min: 0.0, max: 15.0, step: 0.25 },
      { key: "shockMagnitude", label: "Economic Shock Size", description: "Adverse global default threat size.", min: 0.0, max: 100.0, step: 1.0 },
      { key: "recoveryRegenerationSpeed", label: "Recovery Speed", description: "Business reinvestment speed.", min: 1.0, max: 10.0, step: 0.5 }
    ],
    evaluate: (data: any) => {
      const macro = data.macroCycle || [];
      if (!macro.length) return { success: false, reason: "No data", metrics: {} };
      const finalGDP = macro[macro.length - 1].chGDP;
      const maxLeverage = Math.max(...macro.map((d: any) => d.leverage));

      const success = finalGDP >= 112.0 && maxLeverage <= 2.0;
      return {
        success,
        reason: success
          ? "Sovereign economic triumph! You sustained growth perfectly. Keep the leverage low was key to insulation against global default shocks, enabling high trend investments."
          : `Failure: Economic objectives missed. Final GDP was ${finalGDP.toFixed(1)} pts and peak leverage reached ${maxLeverage.toFixed(2)}x (Target: final GDP >= 112, Max Leverage <= 2.0).`,
        metrics: {
          "Final Output GDP": `${finalGDP.toFixed(1)} pts`,
          "Maximum Debt Leverage": `${maxLeverage.toFixed(2)}x`,
          "Target GDP": ">= 112.0 pts",
          "Target Leverage Cap": "<= 2.00x"
        }
      };
    }
  }
];
