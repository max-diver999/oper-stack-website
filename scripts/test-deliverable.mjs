/**
 * На мёртвый адрес письмо не уходит, на живой уходит.
 *
 * Отказ доставки бьёт по репутации домена, и следующие письма живым людям уезжают в спам.
 * 12-13 сентября девять таких отказов мы сделали себе сами тестовыми прогонами.
 */
import { canReceiveMail } from '../src/lib/deliverable.ts';

let bad = 0;
const ok = (n, c) => { if (c) console.log(`ok   ${n}`); else { bad++; console.error(`FAIL ${n}`); } };
const can = async (a) => (await canReceiveMail(a)).ok;

// ---- живые адреса проходят
ok('gmail проходит', await can('someone@gmail.com'));
ok('яндекс проходит', await can('someone@yandex.ru'));
ok('наш собственный домен проходит', await can('info@oper-stack.com'));

// ---- служебные имена из стандарта не проходят
for (const a of ['proba@example.test', 'kto@example.com', 'x@a.invalid', 'y@host.localhost']) {
  ok(`служебное имя отсекается: ${a}`, !(await can(a)));
}

// ---- мусор вместо адреса
for (const a of ['', 'без-собаки', '@нет-имени.ru', 'нет-домена@', 'кто@безточки']) {
  ok(`не адрес отсекается: ${JSON.stringify(a)}`, !(await can(a)));
}

// ---- несуществующий домен
ok('несуществующий домен отсекается',
  !(await can('kto@nesushchestvuyushchiy-domen-operstack-9f3a2.ru')));

// ---- опечатка в известном домене ловится, если такого домена нет
const typo = await canReceiveMail('kto@gmial-operstack-test-9f3a2.com');
ok('опечатка в домене ловится', typo.ok === false && typo.why.includes('neither a mail server'));

// ---- домены-обманки, которые существуют, но письмо там не прочитает никто
for (const [a, hint] of [['kto@gmial.com', 'gmail.com'], ['kto@gmai.com', 'gmail.com'],
                         ['kto@yandx.ru', 'yandex.ru'], ['kto@amil.ru', 'mail.ru']]) {
  const r = await canReceiveMail(a);
  ok(`опечатка в имени почтовика ловится: ${a}`, r.ok === false && r.why.includes(hint));
}

// ---- настоящие почтовики под нож не попадают, даже похожие на соседа по списку
for (const a of ['kto@mail.com', 'kto@gmx.com', 'kto@me.com', 'kto@live.com', 'kto@bk.ru', 'kto@list.ru']) {
  ok(`настоящий почтовик проходит: ${a}`, await can(a));
}

// ---- адреса наших живых покупателей
for (const a of ['railmi@yandex.ru', 'lady.bookman@inbox.ru', 'kuzviksi@ya.ru', 'sz@vin-tel.ru']) {
  ok(`живой покупатель проходит: ${a}`, await can(a));
}

console.log(bad ? `\nпровалов: ${bad}` : '\nвсё сходится');
process.exit(bad ? 1 : 0);
