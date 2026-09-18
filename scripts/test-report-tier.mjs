/** Проверяем, что выдача узнаёт товар и по идентификатору, и по названию, когда его пересоздали. */
// Модуль тянет вёрстку письма, а она импортируется без расширения: для узла это не путь.
// Расширение дописываем здесь, чтобы сторож работал, а сборке Astro всё равно.
const { readWhopReport, reportTierMap } = await import('../src/lib/report-fulfilment.ts');
const tiers = reportTierMap('');
const cases = [
  ['знакомый id за 9', { data: { id: 'pay_1', product_id: 'prod_k66PVan90WYS8', user_email: 'a@b.c' } }, '9'],
  ['знакомый id за 29', { data: { id: 'pay_2', product_id: 'prod_hgpRpk84Kf0hB', user_email: 'a@b.c' } }, '29'],
  ['пересозданный товар за 9', { data: { id: 'pay_3', product_id: 'prod_NEWNEWNEW', product_name: 'Automatic site report', user_email: 'a@b.c' } }, '9'],
  ['пересозданный товар за 29', { data: { id: 'pay_4', product_id: 'prod_OTHER', product: { title: 'You and three rivals, watched for a month' }, user_email: 'a@b.c' } }, '29'],
  // Аудит за 149. С 18.09.2026 он такая же ступень отчёта, как 9 и 29: до этого его ветка
  // просила ответить письмом, а отчёт собирался руками. Имя товара менялось, поэтому ловим оба.
  ['знакомый id аудита', { data: { id: 'pay_6', product_id: 'prod_plySVogSlnVni', user_email: 'a@b.c' } }, 'audit'],
  ['аудит под новым именем', { data: { id: 'pay_7', product_id: 'prod_RENAMED', product_name: 'Why nobody shows you, and what to put on the site so they do', user_email: 'a@b.c' } }, 'audit'],
  ['аудит под старым именем', { data: { id: 'pay_8', product_id: 'prod_OLD', product: { title: 'Audit: why the site brings no leads, and what to fix first' }, user_email: 'a@b.c' } }, 'audit'],
  ['чужой товар', { data: { id: 'pay_5', product_id: 'prod_GmuHdBYWDHIBu', product_name: 'OperStack Site Kit', user_email: 'a@b.c' } }, null],
];
let bad = 0;
for (const [name, ev, want] of cases) {
  const got = readWhopReport(ev, tiers).tier;
  const ok = got === want;
  if (!ok) bad++;
  console.log(`${ok ? 'ок ' : 'НЕ '} ${name.padEnd(28)} ждали ${want} получили ${got}`);
}
console.log(bad ? `\nпровалов: ${bad}` : '\nвсе случаи проходят');
process.exit(bad ? 1 : 0);
