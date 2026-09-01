// Generates the OpenAPI document from the Zod schemas, and checks the committed
// snapshot for drift (api-conventions.md AC-10).
//
//   npm run openapi:generate   write docs/api/openapi.json
//   npm run openapi:check      regenerate in memory, fail if it differs
//
// AC-10 makes the Zod schemas the contract's single source of truth. That is
// only enforceable if something compares the generated result to what is
// committed: `openapi:check` is that comparison, and it runs in the Stop hook
// and in CI. A schema change that is not reflected in the snapshot fails the
// build instead of being noticed at review time.
//
// The snapshot is JSON, not YAML. It needs no parser dependency, and
// JSON.stringify gives one canonical serialization, so a diff is always a real
// contract change and never a formatting artefact. The per-Story approved
// contract (docs/designs/api/{story_id}-openapi.yaml) stays YAML; comparing the
// two is a separate, semantic check that belongs to design-reviewer and
// implementation-verifier.
//
// Operations register their full path including the `/api/v1` prefix (AC-1), so
// the document declares no `servers` entry — the deployment topology is an Open
// Decision and this file does not invent one.

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';

import { registry } from '../src/lib/openapi.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MODULES_DIR = join(ROOT, 'src', 'modules');
const SNAPSHOT = join(ROOT, 'docs', 'api', 'openapi.json');
const SNAPSHOT_REL = 'docs/api/openapi.json';

/**
 * Import every `src/modules/<module>/<module>.schemas.ts` so its registrations
 * land in the shared registry.
 *
 * Discovered rather than hard-coded: a hand-maintained list is the one input a
 * new module would silently miss, which is exactly the drift this gate exists
 * to catch. Sorted so the document is byte-identical between machines.
 */
async function loadModuleSchemas(): Promise<string[]> {
  const loaded: string[] = [];

  for (const entry of readdirSync(MODULES_DIR, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    if (!entry.isDirectory()) continue;

    const moduleDir = join(MODULES_DIR, entry.name);
    const schemaFiles = readdirSync(moduleDir)
      .filter((name) => name.endsWith('.schemas.ts'))
      .sort((a, b) => a.localeCompare(b));

    for (const file of schemaFiles) {
      await import(pathToFileURL(join(moduleDir, file)).href);
      loaded.push(`src/modules/${entry.name}/${file}`);
    }
  }

  return loaded;
}

function packageVersion(): string {
  const raw = readFileSync(join(ROOT, 'package.json'), 'utf8');
  const parsed = JSON.parse(raw) as { version?: string };
  return parsed.version ?? '0.0.0';
}

function buildDocument(): string {
  const document = new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'Customer Portal API',
      version: packageVersion(),
      description:
        'Generated from the Zod schemas in src/modules/*/*.schemas.ts. ' +
        'Do not edit by hand (docs/architecture/api-conventions.md AC-10).',
    },
  });

  return `${JSON.stringify(document, null, 2)}\n`;
}

function readSnapshot(): string | null {
  try {
    return readFileSync(SNAPSHOT, 'utf8');
  } catch {
    return null;
  }
}

async function main(): Promise<number> {
  const check = process.argv.includes('--check');
  const loaded = await loadModuleSchemas();
  const generated = buildDocument();

  if (!check) {
    writeFileSync(SNAPSHOT, generated, 'utf8');
    console.log(
      `openapi: wrote ${SNAPSHOT_REL} from ${loaded.length} schema file(s)` +
        (loaded.length === 0 ? ' (no operations registered yet)' : ''),
    );
    return 0;
  }

  const committed = readSnapshot();

  if (committed === null) {
    console.error(
      `openapi: ${SNAPSHOT_REL} is missing.\n` +
        'Run `npm run openapi:generate` and commit the result.',
    );
    return 1;
  }

  if (committed !== generated) {
    console.error(
      `openapi: ${SNAPSHOT_REL} is out of date — the Zod schemas and the committed\n` +
        'contract disagree (api-conventions.md AC-10).\n\n' +
        'Run `npm run openapi:generate` and commit the result. Never edit the\n' +
        'generated document by hand: fix the schemas instead.',
    );
    return 1;
  }

  console.log(`openapi: ${SNAPSHOT_REL} matches the schemas (${loaded.length} schema file(s)).`);
  return 0;
}

process.exitCode = await main();
