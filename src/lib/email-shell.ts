/**
 * Оформление писем OperStack.
 *
 * Простым языком: одно место, где решается, как выглядят все наши письма. Логотип, ширина,
 * цвета, крупные кнопки. Меняешь здесь, меняется везде.
 *
 * Почему всё сделано таблицами и через style прямо в теге, хотя так давно не пишут сайты.
 * Почта это не браузер. Outlook на Windows рисует письма движком от Word: он не знает ни
 * flexbox, ни grid, ни border-radius, а <style> в шапке часто просто выбрасывает. Всё, на
 * что можно рассчитывать во всех почтах сразу, это таблицы и стили в самом теге.
 *
 * Кнопка сделана ячейкой таблицы с цветом фона, а не ссылкой с оформлением. Ссылка с
 * оформлением в Outlook превращается в обычный синий текст, и большой кнопки не остаётся.
 *
 * Картинки в письмах по умолчанию не показываются у части людей, поэтому логотип ничего не
 * сообщает: письмо полностью читается и без него, а у картинки есть подпись.
 *
 * Шрифты не подгружаем: почта их почти везде игнорирует, и текст прыгает. Берём те, что уже
 * стоят у человека.
 *
 * Тёмная тема: Gmail и Apple Mail могут сами перекрасить письмо. Поэтому цвета выбраны так,
 * чтобы читаться и после инверсии, а на кнопке цвет текста задан явно.
 */

const SITE = 'https://oper-stack.com';
const LOGO = `${SITE}/email/logo.png`;

/** Цвета те же, что на сайте и на схемах: письмо должно узнаваться. */
const C = {
  paper: '#F5F2EC',
  outer: '#E7E2D8',
  text: '#14181C',
  dim: '#5A6470',
  line: '#CFC8BA',
  teal: '#1A8A7D',
  amber: '#C9922A',
  tint: '#E9F1EF',
};

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));

/* ---------------------------- кирпичики письма ---------------------------- */

/** Обычный абзац. */
export const p = (html: string) =>
  `<p style="margin:0 0 16px;font-family:${FONT};font-size:16px;line-height:1.55;color:${C.text}">${html}</p>`;

/** Мелкий серый абзац: сноски, пояснения, сравнения с рынком. */
export const note = (html: string) =>
  `<p style="margin:0 0 16px;font-family:${FONT};font-size:14px;line-height:1.5;color:${C.dim}">${html}</p>`;

/** Заголовок внутри письма. */
export const h2 = (text: string) =>
  `<h2 style="margin:26px 0 12px;font-family:${FONT};font-size:20px;line-height:1.25;font-weight:700;color:${C.text}">${esc(text)}</h2>`;

/** Крупная цифра, ради которой человек открыл письмо. */
export const scoreBlock = (host: string, score: number | string) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px">
    <tr><td align="center" bgcolor="${C.tint}" style="padding:22px 20px;border-radius:10px">
      <div style="font-family:${FONT};font-size:13px;line-height:1.3;letter-spacing:.06em;text-transform:uppercase;color:${C.dim}">${esc(host)}</div>
      <div style="font-family:${FONT};font-size:44px;line-height:1.1;font-weight:700;color:${C.teal};padding-top:4px">${esc(score)}<span style="font-size:20px;font-weight:400;color:${C.dim}"> / 100</span></div>
    </td></tr>
  </table>`;

/**
 * Кнопка. Ячейка таблицы с цветом фона, потому что оформленная ссылка в Outlook
 * превращается в обычный синий текст.
 */
export const button = (href: string, label: string, kind: 'main' | 'quiet' = 'main') =>
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 20px">
    <tr><td align="center" bgcolor="${kind === 'main' ? C.teal : C.paper}" style="border-radius:8px${kind === 'quiet' ? `;border:2px solid ${C.teal}` : ''}">
      <a href="${href}" style="display:inline-block;padding:15px 30px;font-family:${FONT};font-size:16px;line-height:1;font-weight:700;color:${kind === 'main' ? '#FFFFFF' : C.teal};text-decoration:none;border-radius:8px">${esc(label)}</a>
    </td></tr>
  </table>`;

/** Список находок. Каждая строка со своей меткой, потому что цвет один не читается. */
export const findings = (items: { level: string; area: string; text: string }[]) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px">
    ${items.map((it) => `<tr>
      <td valign="top" style="padding:0 10px 12px 0;font-family:${FONT};font-size:11px;line-height:1.7;letter-spacing:.05em;text-transform:uppercase;font-weight:700;color:${it.level === 'warn' ? C.amber : '#B4462F'};white-space:nowrap">${it.level === 'warn' ? 'Partial' : 'Problem'}</td>
      <td valign="top" style="padding:0 0 12px;font-family:${FONT};font-size:15px;line-height:1.5;color:${C.text}"><strong>${esc(it.area)}.</strong> ${esc(it.text)}</td>
    </tr>`).join('')}
  </table>`;

/** Задача целиком: «сейчас», «что сделать», «как проверить». */
export const taskBlock = (task: { now?: string; task?: string; verify?: string; rule?: string }) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px">
    <tr><td bgcolor="#FFFFFF" style="padding:20px 22px;border-left:4px solid ${C.teal};border-radius:0 10px 10px 0">
      ${[['Now', task.now], ['What to do', task.task], ['How to check', task.verify]]
        .filter(([, v]) => v)
        .map(([k, v]) => `<p style="margin:0 0 12px;font-family:${FONT};font-size:15px;line-height:1.5;color:${C.text}"><strong style="color:${C.teal}">${k}:</strong> ${esc(v)}</p>`).join('')}
      ${task.rule ? `<p style="margin:0;font-family:${FONT};font-size:13px;line-height:1.45;color:${C.dim}">${esc(task.rule)}</p>` : ''}
    </td></tr>
  </table>`;

/* ---------------------------- само письмо ---------------------------- */

export type Shell = {
  /** Серая строка рядом с темой в списке писем. Без неё почта покажет первое предложение. */
  preheader: string;
  heading: string;
  blocks: string[];
  unsubUrl?: string;
};

export function emailShell({ preheader, heading, blocks, unsubUrl }: Shell): string {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
</head>
<body style="margin:0;padding:0;background:${C.outer};-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:${C.outer}">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.outer}" style="background:${C.outer}">
  <tr><td align="center" style="padding:28px 12px 40px">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%">
      <tr><td style="padding:0 0 18px">
        <img src="${LOGO}" width="220" height="45" alt="OperStack" style="display:block;border:0;width:220px;height:auto">
      </td></tr>
      <tr><td bgcolor="${C.paper}" style="padding:34px 34px 26px;border-radius:14px">
        <h1 style="margin:0 0 20px;font-family:${FONT};font-size:26px;line-height:1.2;font-weight:700;color:${C.text}">${esc(heading)}</h1>
        ${blocks.join('\n        ')}
      </td></tr>
      <tr><td style="padding:20px 6px 0;font-family:${FONT};font-size:13px;line-height:1.6;color:${C.dim}">
        <a href="${SITE}" style="color:${C.dim};text-decoration:none">oper-stack.com</a>
        &nbsp;·&nbsp;
        <a href="mailto:info@oper-stack.com" style="color:${C.dim};text-decoration:none">info@oper-stack.com</a>
        ${unsubUrl ? `<br><a href="${unsubUrl}" style="color:${C.dim};text-decoration:underline">Not interested? One click and we stop.</a>` : ''}
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}
