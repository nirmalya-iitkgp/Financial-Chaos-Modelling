/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MicrostructureDataPoint {
  time: number;
  price: number;
  bidDepth: number;
  askDepth: number;
  volume: number;
  spread: number;
  hftRatio: number;
}

export interface AssetPriceDataPoint {
  time: number;
  linearPrice: number;
  chPrice: number;
  linearVol: number;
  chVol: number;
  linearReturn: number;
  chReturn: number;
}

export interface MacroCycleDataPoint {
  time: number;
  linearGDP: number;
  chGDP: number; // also known as chaotic/bifurcating GDP
  leverage: number;
  potentialStable: number;
  potentialChaotic: number;
  recessionLevel: number;
}

export interface SimulationResult {
  microstructure: MicrostructureDataPoint[];
  assetPrice: AssetPriceDataPoint[];
  macroCycle: MacroCycleDataPoint[];
}

export interface SystemParameters {
  // Microstructure parameters
  liquidityDepth: number; // 1-100
  hftSpeed: number; // 1-100
  triggerSellSize: number; // 1-1000
  marketMakersPresence: number; // 1-100

  // Asset price parameters
  meanReversion: number; // 0-1
  volatilityFeedback: number; // 0-2
  hurstExponent: number; // 0.1-0.9
  bubbleGrowthRate: number; // 0-0.1

  // Macroeconomics parameters
  leverageLimit: number; // 1.0 - 5.0
  centralBankRate: number; // 0% - 15%
  shockMagnitude: number; // 0-100
  recoveryRegenerationSpeed: number; // 1-10
}

export type SectionType = 'hero' | 'microstructure' | 'assetPrice' | 'macroCycle' | 'portal' | 'game';

export interface HistoricalCrisisPreset {
  id: string;
  name: string;
  year: string;
  contextId: SectionType;
  description: string;
  defaultRegime: 'linear' | 'weakly-nonlinear' | 'chaotic';
  parameters: Partial<SystemParameters>;
}

export interface AnalysisRequest {
  contextId: string;
  regimeType: 'linear' | 'weakly-nonlinear' | 'chaotic';
  parameters: Record<string, number>;
  userQuestion?: string;
}

export interface AnalysisResponse {
  text: string;
  citations?: any[];
  error?: string;
}
