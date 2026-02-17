import { renderSessionAnalysis } from '../output/session-analyzer.js';

export async function analyzeSessionCommand(): Promise<string> {
  return renderSessionAnalysis();
}
