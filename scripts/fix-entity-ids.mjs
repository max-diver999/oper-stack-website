#!/usr/bin/env node
/**
 * Template: sync entity/media IDs in MDX from JSON source of truth.
 * Customize COLLECTION_MAP for your project, then run before deploy.
 *
 * Example map:
 *   { mdxDir: 'projects', jsonDir: 'data/projects', idField: 'entityId', mediaField: 'cloudinary' }
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const COLLECTION_MAP = [
  // { contentSubdir: 'projects', jsonSubdir: 'data/projects', slugFromFile: true },
];

console.log('[fix-entity-ids] Configure COLLECTION_MAP in scripts/fix-entity-ids.mjs');
if (!COLLECTION_MAP.length) {
  console.log('No collections configured — see SEO_SITE_PLAYBOOK §12.6');
  process.exit(0);
}

let changed = 0;
for (const { contentSubdir, jsonSubdir } of COLLECTION_MAP) {
  const contentDir = join(ROOT, 'src/content', contentSubdir);
  if (!existsSync(contentDir)) continue;
  for (const file of readdirSync(contentDir).filter((f) => f.endsWith('.mdx'))) {
    const slug = file.replace(/\.mdx$/, '');
    const jsonPath = join(ROOT, jsonSubdir, `${slug}.json`);
    if (!existsSync(jsonPath)) continue;
    // Implement: read JSON id, replace wrong IDs in MDX heroImage paths
    changed++;
  }
}
console.log(`[fix-entity-ids] Done. Files touched: ${changed}`);
