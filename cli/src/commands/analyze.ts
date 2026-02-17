import { renderTokenAnalysis } from '../output/analyzer.js';

export async function analyzeCommand(): Promise<string> {
  return renderTokenAnalysis();
}
