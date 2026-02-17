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
import { renderError } from '../output/renderer.js';

const VERSION = '1.0.0';

async function main() {
  program
    .name('skynet')
    .description('Skynet - Registry of Performance-Optimized Agent Systems')
    .version(VERSION);

  // Initialize client
  const token = getToken();
  const client = new SkynetClient(token?.access_token);

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

  await program.parseAsync(process.argv);
}

main().catch(err => {
  console.error(renderError(err instanceof Error ? err.message : String(err)));
  process.exit(1);
});
