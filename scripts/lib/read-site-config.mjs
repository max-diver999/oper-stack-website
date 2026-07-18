import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const CANDIDATES = ['site.config.json', 'scripts/site.config.json'];

export function readSiteConfig(cwd = process.cwd()) {
  for (const name of CANDIDATES) {
    const path = join(cwd, name);
    if (!existsSync(path)) continue;
    return JSON.parse(readFileSync(path, 'utf8'));
  }
  throw new Error(
    'site.config.json not found. Copy 08_Идеи/_templates/site.config.example.json → site.config.json',
  );
}
