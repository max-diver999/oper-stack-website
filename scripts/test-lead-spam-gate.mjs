#!/usr/bin/env node
import { assessLeadSpam, looksLikeGibberish, looksLikeDotSpamEmail } from '../src/lib/lead-spam-gate.ts';

const samples = [
  ['MeJaRqtwZCEKwhiUz', true],
  ['OtvpAtRcNquCpvvjDZEP', true],
  ['ViqdlrwwzSyVfuaczHxUEXSX', true],
  ['ctPtszTRVoVMwoQenj', true],
  ['John Smith', false],
  ['Maria', false],
  ['Christopher', false],
  ['Li Wei', false],
  ['Алексей', false],
];

let fail = 0;
for (const [name, expect] of samples) {
  const got = looksLikeGibberish(name);
  if (got !== expect) {
    console.error(`FAIL gibberish "${name}": expected ${expect}, got ${got}`);
    fail++;
  }
}

if (!looksLikeDotSpamEmail('a.k.u.g.e.r.u.l.o.l0.5.6@gmail.com')) {
  console.error('FAIL dot email should block');
  fail++;
}
if (!looksLikeDotSpamEmail('pr.ana.b.ses1@gmail.com')) {
  console.error('FAIL pr.ana.b.ses1 dot email should block');
  fail++;
}
if (looksLikeDotSpamEmail('john.smith@gmail.com')) {
  console.error('FAIL normal dotted email should pass');
  fail++;
}

const seoSpam = assessLeadSpam({
  name: 'Herbert',
  email: 'test@gmail.com',
  message: 'We recommend optimizing your website for search engines. Our SEO services can boost your visibility.',
  formElapsedMs: 8000,
});
if (!seoSpam.spam || seoSpam.reason !== 'seo_pitch') {
  console.error('FAIL SEO pitch should block', seoSpam);
  fail++;
}

const realLead = assessLeadSpam({
  name: 'John Smith',
  email: 'john@gmail.com',
  message: 'Looking for sea view condo in Bang Tao',
  formElapsedMs: 8000,
});
if (realLead.spam) {
  console.error('FAIL real lead blocked:', realLead.reason);
  fail++;
}

const fastAutofill = assessLeadSpam({
  name: 'John Smith',
  email: 'john@gmail.com',
  message: 'Found your website on Google. Want a 2-bed in Bang Tao.',
  formElapsedMs: 1500,
});
if (fastAutofill.spam) {
  console.error('FAIL fast autofill real lead blocked:', fastAutofill.reason);
  fail++;
}

const botLead = assessLeadSpam({
  name: 'MeJaRqtwZCEKwhiUz',
  email: 'a.k.u.g.e.r.u.l.o.l0.5.6@gmail.com',
  message: 'OtvpAtRcNquCpvvjDZEP',
  formElapsedMs: 8000,
});
if (!botLead.spam) {
  console.error('FAIL bot lead should block');
  fail++;
}

if (assessLeadSpam({ website: 'http://spam.com', formElapsedMs: 5000 }).reason !== 'honeypot') {
  console.error('FAIL honeypot');
  fail++;
}

if (!assessLeadSpam({ isHealthcheck: true, name: 'MeJaRqtwZCEKwhiUz' }).spam === false) {
  // healthcheck bypass
}

console.log(fail === 0 ? 'ALL PASS' : `${fail} FAIL`);
process.exit(fail ? 1 : 0);
