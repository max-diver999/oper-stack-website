#!/usr/bin/env node
/**
 * Ссылки в подписи под ответом MCP ведут на живые страницы.
 *
 * 16.09.2026 я вписал в подпись адрес /products/watch/, которого не существует, и он ушёл в бой.
 * Помощник показал бы человеку битую ссылку в ответ на просьбу проверить сайт. Адреса товаров
 * меняются, поэтому проверять их надо машиной, а не памятью.
 */
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../src/lib/mcp-tools.ts', import.meta.url), 'utf8');
const links = [...src.matchAll(/https:\/\/oper-stack\.(?:com|ru)\/[^\s'"`)]+/g)].map((m) => m[0]);
let bad = 0;
for (const url of [...new Set(links)]) {
  const r = await fetch(url, { method: 'GET', redirect: 'follow' }).catch(() => null);
  const code = r?.status ?? 0;
  if (code === 200) console.log(`ok   ${url}`);
  else { bad++; console.error(`FAIL ${url} -> ${code || 'нет ответа'}`); }
}
console.log(bad ? `\nбитых ссылок: ${bad}` : '\nвсе ссылки живые');
process.exit(bad ? 1 : 0);
