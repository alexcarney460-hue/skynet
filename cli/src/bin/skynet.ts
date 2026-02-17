#!/usr/bin/env node

import { program } from 'commander';
import { SkynetClient } from '../api/client.js';
import { getToken } from '../auth/storage.js';
import { statusCommand } from '../commands/status.js';
import { artifactsCommand } from '../commands/artifacts.js';
import { artifactCommand } from '../commands/artifact.js';
import { entitlementsCommand } from '../commands/entitlements.js';
import { authLoginCommand, authLogoutCommand } from '../commands/auth.js';
import { unlockCommand } from '../commands/unlock.js';
import { demoCommand } from '../commands/demo.js';
import { analyzeCommand } from '../commands/analyze.js';
import { optimizeCommand } from '../commands/optimize.js';
import { analyzeSessionCommand } from '../commands/analyze-session.js';
import { compressSessionCommand } from '../commands/compress-session.js';
import { renderError } from '../output/renderer.js';
import { showSplash } from '../output/splash.js';

const VERSION = '1.0.0';

// Run demo on startup if no arguments provided
const shouldRunDemo = process.argv.length <= 2;

async function main() {
  // Initialize client first
  const token = getToken();
  const client = new SkynetClient(token?.access_token);

  // Run demo on startup
  if (shouldRunDemo) {
    try {
      const output = await demoCommand(client);
      console.log(output);
      process.exit(0);
    } catch (err) {
      console.error(renderError(err instanceof Error ? err.message : String(err)));
      process.exit(1);
    }
  }

  program
    .name('skynet')
    .description('Skynet - Registry of Performance-Optimized Agent Systems')
    .version(VERSION);

  // status command
  program
    .command('status')
    .description('Show system status')
    .action(async () => {
      try {
        const output = await statusCommand(client);
        console.log(output);
      } catch (err) {
        console.error(renderError(err instanceof Error ? err.message : String(err)));
        process.exit(1);
      }
    });

  // artifacts command
  program
    .command('artifacts')
    .description('List all artifacts')
    .action(async () => {
      try {
        const output = await artifactsCommand(client);
        console.log(output);
      } catch (err) {
        console.error(renderError(err instanceof Error ? err.message : String(err)));
        process.exit(1);
      }
    });

  // artifact command
  program
    .command('artifact <slug>')
    .description('Show artifact details')
    .option('--content', 'Show full content if unlocked')
    .action(async (slug: string, options: { content?: boolean }) => {
      try {
        const output = await artifactCommand(client, slug, options.content || false);
        console.log(output);
      } catch (err) {
        console.error(renderError(err instanceof Error ? err.message : String(err)));
        process.exit(1);
      }
    });

  // entitlements command
  program
    .command('entitlements')
    .description('Show user entitlements')
    .action(async () => {
      try {
        const output = await entitlementsCommand(client);
        console.log(output);
      } catch (err) {
        console.error(renderError(err instanceof Error ? err.message : String(err)));
        process.exit(1);
      }
    });

  // auth login command
  program
    .command('auth:login')
    .description('Authenticate with Skynet')
    .action(async () => {
      try {
        const output = await authLoginCommand();
        console.log(output);
      } catch (err) {
        console.error(renderError(err instanceof Error ? err.message : String(err)));
        process.exit(1);
      }
    });

  // auth logout command
  program
    .command('auth:logout')
    .description('Clear authentication token')
    .action(async () => {
      try {
        const output = await authLogoutCommand();
        console.log(output);
      } catch (err) {
        console.error(renderError(err instanceof Error ? err.message : String(err)));
        process.exit(1);
      }
    });

  // unlock command
  program
    .command('unlock [slug]')
    .option('--full', 'Unlock full registry')
    .description('Initiate artifact or registry unlock')
    .action(async (slug: string | undefined, options: { full?: boolean }) => {
      try {
        const output = await unlockCommand(slug, options.full || false);
        console.log(output);
      } catch (err) {
        console.error(renderError(err instanceof Error ? err.message : String(err)));
        process.exit(1);
      }
    });

  // demo command
  program
    .command('demo')
    .description('Run interactive demo (for videos/presentations)')
    .action(async () => {
      try {
        const output = await demoCommand(client);
        console.log(output);
      } catch (err) {
        console.error(renderError(err instanceof Error ? err.message : String(err)));
        process.exit(1);
      }
    });

  // analyze command
  program
    .command('analyze')
    .description('Token efficiency analysis & diagnostics')
    .option('--tokens', 'Show token analysis')
    .action(async () => {
      try {
        const output = await analyzeCommand();
        console.log(output);
      } catch (err) {
        console.error(renderError(err instanceof Error ? err.message : String(err)));
        process.exit(1);
      }
    });

  // analyze session command
  program
    .command('session')
    .description('Session context stability & memory state inspection')
    .action(async () => {
      try {
        const output = await analyzeSessionCommand();
        console.log(output);
      } catch (err) {
        console.error(renderError(err instanceof Error ? err.message : String(err)));
        process.exit(1);
      }
    });

  // optimize command
  program
    .command('optimize')
    .description('Activate token optimization mode')
    .action(async () => {
      try {
        const output = await optimizeCommand();
        console.log(output);
      } catch (err) {
        console.error(renderError(err instanceof Error ? err.message : String(err)));
        process.exit(1);
      }
    });

  // compress command
  program
    .command('compress')
    .description('Session context compression & deduplication')
    .action(async () => {
      try {
        const output = await compressSessionCommand();
        console.log(output);
      } catch (err) {
        console.error(renderError(err instanceof Error ? err.message : String(err)));
        process.exit(1);
      }
    });

  await program.parseAsync(process.argv);
}

main().catch(err => {
  console.error(renderError(err instanceof Error ? err.message : String(err)));
  process.exit(1);
});
