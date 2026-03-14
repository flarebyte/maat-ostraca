import type { Language } from '../../../core/contracts/language.js';
import { computeSymbolMetrics, sha256OfText } from './metrics.js';

export interface SymbolMetricsIoFields {
  loc: number;
  sloc: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  maxNestingDepth: number;
  tokens: number;
  sha256: string;
  loops: number;
  conditions: number;
  returnCount: number;
  ioCallsCount: number;
  ioReadCallsCount: number;
  ioWriteCallsCount: number;
}

export interface IoCounts {
  all: number;
  read: number;
  write: number;
}

interface SymbolMetricsLike {
  loc: number;
  sloc: number;
  cyclomaticComplexity: number;
  cognitiveComplexity: number;
  maxNestingDepth: number;
  tokens: number;
  loops: number;
  conditions: number;
  returnCount: number;
}

export const buildSymbolMetricsIoFieldsFromMetrics = (
  metrics: SymbolMetricsLike,
  sha256: string,
  ioCounts: IoCounts,
): SymbolMetricsIoFields => {
  return {
    loc: metrics.loc,
    sloc: metrics.sloc,
    cyclomaticComplexity: metrics.cyclomaticComplexity,
    cognitiveComplexity: metrics.cognitiveComplexity,
    maxNestingDepth: metrics.maxNestingDepth,
    tokens: metrics.tokens,
    sha256,
    loops: metrics.loops,
    conditions: metrics.conditions,
    returnCount: metrics.returnCount,
    ioCallsCount: ioCounts.all,
    ioReadCallsCount: ioCounts.read,
    ioWriteCallsCount: ioCounts.write,
  };
};

export const buildSymbolMetricsIoFields = async (
  code: string,
  language: Language,
  ioCounts: IoCounts,
): Promise<SymbolMetricsIoFields> => {
  const metrics = await computeSymbolMetrics(code, language);
  return buildSymbolMetricsIoFieldsFromMetrics(
    metrics,
    sha256OfText(code),
    ioCounts,
  );
};
