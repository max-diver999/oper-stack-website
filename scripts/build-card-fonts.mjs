#!/usr/bin/env node
/**
 * Пересборка src/lib/card-fonts.ts.
 *
 * Шрифт для растровой карточки зашит в код строками base64, потому что в облачной функции Vercel
 * нет ни одного шрифта, а файл рядом сборщик в функцию не кладёт. Этот скрипт собирает тот модуль
 * заново, если шрифт понадобится поменять.
 *
 * Как запускать:
 *   npm i --no-save @fontsource/inter wawoff2
 *   node scripts/build-card-fonts.mjs
 *
 * Берёт четыре статических начертания Inter (латиница и кириллица, 400 и 700), разжимает woff2 в
 * ttf (растеризатор woff2 не читает) и пишет модуль. Ничего не качает из сети сам.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const NAMES = ['inter-latin-400-normal', 'inter-latin-700-normal', 'inter-cyrillic-400-normal', 'inter-cyrillic-700-normal'];

const woff2 = require('wawoff2');
const dir = path.join(path.dirname(require.resolve('@fontsource/inter/package.json')), 'files');

const parts = [];
for (const name of NAMES) {
  const ttf = Buffer.from(await woff2.decompress(await fs.readFile(path.join(dir, `${name}.woff2`))));
  parts.push(`  // ${name}\n  '${ttf.toString('base64')}',`);
  console.log(`[fonts] ${name}: ${ttf.length} байт`);
}

const out = path.join(process.cwd(), 'src/lib/card-fonts.ts');
const current = await fs.readFile(out, 'utf8');
const head = current.slice(0, current.indexOf('const B64: string[] = ['));
const tail = current.slice(current.indexOf('];'));
await fs.writeFile(out, `${head}const B64: string[] = [\n${parts.join('\n')}\n${tail}`, 'utf8');
console.log(`[fonts] записан ${out}`);
