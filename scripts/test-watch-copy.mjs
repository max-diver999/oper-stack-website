// Копия модуля Watch на сайте совпадает с очередью писем (если дерево очереди лежит рядом).
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
const here = new URL('../src/lib/watch/', import.meta.url);
const queue = new URL('../../ops-runner-watch/', import.meta.url);
const md5 = (u) => createHash('md5').update(readFileSync(u)).digest('hex');
if (!existsSync(new URL('chatgpt-watch.mjs', queue))) { console.log('test-watch-copy: дерева очереди рядом нет, пропуск'); process.exit(0); }
const bad = ['chatgpt-watch.mjs', 'email-shell.mjs', 'log-redact.mjs'].filter((f) => md5(new URL(f, here)) !== md5(new URL(f, queue)));
if (bad.length) { console.error('копия расходится с очередью:', bad.join(', ')); process.exit(1); }
console.log('test-watch-copy: ok');
