import { renderTokenOptimization } from '../output/optimizer.js';

export async function optimizeCommand(): Promise<string> {
  return renderTokenOptimization();
}
