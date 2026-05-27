# 🌐 Financial Chaos Modelling — High-Fidelity Systemic Risk Sandbox

> An immersive, full-stack, stochastic playground and interactive macroeconomic stabilizer simulation built in React, TypeScript, and Tailwind CSS. Take on the role of a sovereign banking regulator to neutralize cascading systemic collapses, market flash crashes, and speculatively inflated asset bubbles across **5 consecutive, feedback-sensitive intervals ($T_1$ to $T_5$)**.

---

## 🎨 App Logo Icon
An ultra-modern, geometric logo representing high-frequency signals and systemic stability is located at `/public/logo.png`.

---

## 🚀 Concept Overview

Traditional risk forecasting models fail because they view the economy through a static, linear lens. In reality, markets are highly non-linear, adaptive-chaotic systems. Small initial dislocations (e.g., a single large block trade or a central bank rate hike) feed into cascading loops—reversion strength, GARCH-like conditional volatility, and fractal speculatively driven dynamics—amplifying linear trends into self-accelerating crises.

In **Financial Chaos Modelling**, you step behind the console of a treasury or central bank regulator. The simulation isn't passive: it is segmented into **5 consecutive intervals ($T_1 \rightarrow T_2 \rightarrow T_3 \rightarrow T_4 \rightarrow T_5$)**. At each step, you must inspect the evolving chart trajectory, evaluate key macro indicators, and tweak individual regulatory parameters before committing and advancing to the next temporal stage.

---

## 📊 Core Simulation Domains

The engine models three distinct regimes of financial failure:

### 1. 📉 Market Microstructure Cascade (e.g., Flash Crashes & Liquidity Dry-Ups)
- **The Threat:** High-frequency trading (HFT) bots and algorithmic feedback loops trigger domino-style orderbook exhaustion.
- **Key Mathematical Controls:**
  - **Liquidity Depth (%):** Determines the shock-absorption threshold of orderbooks.
  - **HFT Execution Speed (ms):** Controls the speed of automated response runs. Higher speed triggers severe volatility.
  - **Min Trigger Sell Size:** The threshold trades that trigger panic stop-losses and flash cascades.
- **Sovereign Goal:** Prevent the asset price from dropping past the critical liquidity sink line.

### 2. 📈 Speculative Asset Bubble Chaos (Fractal Memory & Speculation Dynamics)
- **The Threat:** Speculative herd behavior fuels feedback loops (modeled using GARCH volatility and varying Hurst exponents representing fractal memory).
- **Key Mathematical Controls:**
  - **Mean Reversion Rate:** The gravitational pull bringing speculative prices back to fundamental valuations.
  - **Conditional Volatility (GARCH Feed):** Represents market memory, compounding past shocks into future feedback.
  - **Hurst Exponent ($H$):** Measures trend persistence ($H > 0.5$ drives long-term speculation; $H < 0.5$ drives mean reversion; $H = 0.5$ is pure Brownian noise).
- **Sovereign Goal:** Maintain market sanity, preventing speculative capital flights or bubbles from exceeding bounds.

### 3. 🏛️ Macromarket GDP Cycle (Catastrophe Potentials & Liquidity Traps)
- **The Threat:** Credit-expansion booms leading directly to debt-deleveraging busts, modeled using non-linear potential energy wells. Under low leverage, a single stable equilibrium exits near 100 GDP. High leverage triggers dual-basins: a high-state Boom and a deep recessionary liquidity trap (basin of attraction).
- **Key Mathematical Controls:**
  - **Central Bank Interest Rate (%):** Tames speculative inflation but exerts high drag on recovery.
  - **Leverage Ceiling Ratio:** Controls the depth and bifurcation threshold of macro potential energy wells.
  - **Recovery Recovery Speed:** The speed at which business confidence regenerates fundamental investment.
- **Sovereign Goal:** Dampen the non-linear macroeconomic cycle to keep simulated GDP above standard contraction levels.

---

## 🎮 Game Engine Features

- **Sequential 5-Interval Timeline Control ($T_1$ through $T_5$):** Tweak sliders for distinct phases of the timeline. Execute intermediate simulation animations, observe the path, pause to rethink, and then unlock the next stage.
- **Interactive SVG Vector Trajectory Charts:** Real-time rendering of chaotic stochastic paths with color-coded alerts (Emerald for stabilized growth, Neon Amber for simulation progress, and Crimson/Magenta for catastrophic collapse).
- **Collapsible Scientific Reference Overlays:** Expand background histories and mathematical formulations (with LaTeX math formatting) at the bottom to dive deep into GFC 1929, Black Monday 1987, Flash Crash 2010, the 2008 Subprime Collapse, and Eurozone Sovereign Crises.
- **Dynamic Performance Evaluation Matrix:** After completing $T_5$, receive an absolute financial health grade (A+ through F) based on metrics like Max Peak-to-Trough Drawdown, Cumulative Volatility, Cascade Count, and GDP Trajectory Stability.

---

## 🛠️ Tech Stack & Architecture

- **UI Layer:** React 18 with Vite, designed with a premium, low-light Dark Swiss/Fintech style featuring high contrast monochrome displays.
- **Layout Animations:** Powered by `motion` (`motion/react`) for fluid component state transitions, physics-like micro-animations, and slide-down accordions.
- **Stochastic Mathematical Solvers:** Custom-built deterministic Seeds, standard GARCH calculations, Fractional Brownian Memory approximations, and potential-well catastrophe differential steps.
- **Typography:** Custom global pairings using **Inter** for crisp readable numerical grids and **JetBrains Mono** for cybernetic indicators and logs.

---

## 💻 Local Quickstart

### Prerequisites:
- **Node.js**: `v18+` or higher.
- **NPM** or **PNPM**.

### Installation:
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Build & Compilation:
```bash
# Compile and package for production
npm run build

# Start production server
npm start
```

---

## 📜 Regulatory Rulebook (Guidelines to Master the Game)

1. **Watch the Thresholds:** Check the **Crisis Control Goal Target** for your chosen scenario before launching simulation intervals.
2. **Smooth Out Transition Phases:** Do not make radical slider adjustments from $T_1$ to $T_2$ unless you are reacting to extreme volatility. Gradual changes mirror natural monetary policy operations.
3. **Analyze Multi-Step Paths:** Volatility can cluster. An early calm period could be storing potential energy for an explosive GARCH feedback wave in later stages. Keep buffer rates high!
