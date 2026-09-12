/** Проверяем, что выдача узнаёт товар и по идентификатору, и по названию, когда его пересоздали. */
import { readWhopReport, reportTierMap } from '../src/lib/report-fulfilment.ts';
const tiers = reportTierMap('');
const cases = [
  ['знакомый id за 9', { data: { id: 'pay_1', product_id: 'prod_xGGOfxv4ZJ9bf', user_email: 'a@b.c' } }, '9'],
  ['знакомый id за 29', { data: { id: 'pay_2', product_id: 'prod_8YWVnEpYSnOSe', user_email: 'a@b.c' } }, '29'],
  ['пересозданный товар за 9', { data: { id: 'pay_3', product_id: 'prod_NEWNEWNEW', product_name: 'Automatic site report', user_email: 'a@b.c' } }, '9'],
  ['пересозданный товар за 29', { data: { id: 'pay_4', product_id: 'prod_OTHER', product: { title: 'You and three rivals, watched for a month' }, user_email: 'a@b.c' } }, '29'],
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
