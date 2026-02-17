import { renderSessionCompression } from '../output/compressor.js';

export async function compressSessionCommand(): Promise<string> {
  return renderSessionCompression();
}
