#!/usr/bin/env node
import {
  addRefCodeToWhatsAppHref,
  buildMessengerRefCode,
  detectMessengerChannel,
  isMessengerPlacement,
} from '../src/lib/messenger-intent.ts';

let failures = 0;

function expect(label, actual, expected) {
  if (actual !== expected) {
    console.error(`FAIL ${label}: expected ${expected}, got ${actual}`);
    failures++;
  }
}

expect(
  'commercial page ref',
  buildMessengerRefCode('/kupit-nedvizhimost-phuket/', 'header'),
  'KUPITNEDVIZHIMOST-HEADER',
);
expect('WhatsApp detection', detectMessengerChannel('https://wa.me/66000000000'), 'whatsapp');
expect('Telegram detection', detectMessengerChannel('https://t.me/Maksim_MOREGroup'), 'telegram');
expect('MAX detection', detectMessengerChannel('https://max.ru/u/example'), 'max');
expect('valid placement', isMessengerPlacement('lead_form_error'), true);
expect('invalid placement', isMessengerPlacement('bad placement'), false);

const refHref = addRefCodeToWhatsAppHref(
  'https://wa.me/66000000000?text=Здравствуйте',
  'KUPITNEDVIZHIMOST-HEADER',
);
const refMessage = new URL(refHref).searchParams.get('text') || '';
expect('WA ref marker', refMessage.includes('[Ref: KUPITNEDVIZHIMOST-HEADER]'), true);
expect('WA ref is idempotent', addRefCodeToWhatsAppHref(refHref, 'KUPITNEDVIZHIMOST-HEADER'), refHref);

console.log(failures === 0 ? 'ALL PASS' : `${failures} FAIL`);
process.exit(failures ? 1 : 0);
