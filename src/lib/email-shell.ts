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
/* С 25.09.2026 у логотипа тот же фон, что у шапки письма (#E7E2D8): старый стоял светлым прямоугольником. */
const LOGO = `${SITE}/email/logo-v2.png`;

/** Цвета те же, что на сайте и на схемах: письмо должно узнаваться. */
const C = {
  paper: '#F5F2EC',
  outer: '#E7E2D8',
  text: '#14181C',
  dim: '#5A6470',
  // Подвал: серый #5A6470 при 13px читался бледно (задание 25.09.2026, 13.4).
  foot: '#3E4751',
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
  `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 20px;max-width:100%">
    <tr><td align="center" bgcolor="${kind === 'main' ? C.teal : C.paper}" style="border-radius:8px${kind === 'quiet' ? `;border:2px solid ${C.teal}` : ''}">
      <a href="${href}" style="display:block;padding:15px 24px;font-family:${FONT};font-size:16px;line-height:1.3;font-weight:700;color:${kind === 'main' ? '#FFFFFF' : C.teal};text-decoration:none;border-radius:8px">${esc(label)}</a>
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
  `<!--copy--><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px">
    <tr><td bgcolor="#FFFFFF" style="padding:20px 22px;border-left:4px solid ${C.teal};border-radius:0 10px 10px 0">
      ${[['Now', task.now], ['What to do', task.task], ['How to check', task.verify]]
        .filter(([, v]) => v)
        .map(([k, v]) => `<p style="margin:0 0 12px;font-family:${FONT};font-size:15px;line-height:1.5;color:${C.text}"><strong style="color:${C.teal}">${k}:</strong> ${esc(v)}</p>`).join('')}
      ${task.rule ? `<p style="margin:0;font-family:${FONT};font-size:13px;line-height:1.45;color:${C.dim}">${esc(task.rule)}</p>` : ''}
    </td></tr>
  </table><!--/copy-->`;

/* ---------------------------- само письмо ---------------------------- */

export type Shell = {
  /** Серая строка рядом с темой в списке писем. Без неё почта покажет первое предложение. */
  preheader: string;
  /** Строкой или несколькими строками. Несколько нужны, чтобы домен не рвался посередине. */
  heading: string | string[];
  blocks: string[];
  unsubUrl?: string;
};

/**
 * Отделка письма (задание Максима 25.09.2026, раздел 13): у списков и ячеек шрифт задан явно,
 * иначе почта рисует их с засечками, и число не отрывается от своей единицы переносом строки
 * («7 days», «$35 a month», «89 out of 100»). Меняется только текст между тегами.
 */
const NB = '&nbsp;';
export function keepTogether(text: string): string {
  return String(text)
    .replace(/(\d+(?:[.,]\d+)*) out of (\d)/g, `$1${NB}out${NB}of${NB}$2`)
    .replace(/(\$?\d+(?:[.,]\d+)*%?) (?=[a-z$])/g, `$1${NB}`)
    .replace(/\b(of|to) (?=\$?\d)/g, `$1${NB}`)
    .replace(/(\d)(&nbsp;)?a (month|year)\b/g, (m, d) => `${d}${NB}a${NB}${m.endsWith('month') ? 'month' : 'year'}`);
}
// Текст, который человек копирует себе на сайт (задача), идёт между <!--copy--> и <!--/copy-->:
// неразрывные пробелы в нём уехали бы на его страницу.
function finish(html: string): string {
  let copying = false;
  return String(html)
    .split(/(<!--(?:\/)?copy-->|<[^>]*>)/)
    .map((part) => {
      if (part === '<!--copy-->') { copying = true; return part; }
      if (part === '<!--/copy-->') { copying = false; return part; }
      if (!part.startsWith('<')) return copying ? part : keepTogether(part);
      return part
        .replace(/^<(ul|ol|li|td|th)>$/, `<$1 style="font-family:${FONT}">`)
        .replace(/^<(ul|ol|li|td|th)( [^>]*?)?style="(?![^"]*font-family)([^"]*)"/, (m, tag, rest = '') => `<${tag}${rest || ' '}style="font-family:${FONT};${m.split('style="')[1]}`);
    })
    .join('');
}

// После прехедера невидимый заполнитель: иначе почта дописывает к нему заголовок письма (25.09.2026).
const PREHEADER_FILL = '&#847;&zwnj;&nbsp;'.repeat(90);
export function emailShell({ preheader, heading, blocks, unsubUrl }: Shell): string {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
</head>
<body style="margin:0;padding:0;background:${C.outer};-webkit-font-smoothing:antialiased">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:${C.outer}">${esc(preheader)}${PREHEADER_FILL}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.outer}" style="background:${C.outer}">
  <tr><td align="center" style="padding:24px 12px 36px">
    <!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin:0 auto">
      <tr><td style="padding:0 0 16px">
        <img src="${LOGO}" width="200" alt="OperStack" style="display:block;border:0;width:200px;max-width:60%;height:auto">
      </td></tr>
      <tr><td bgcolor="${C.paper}" style="padding:26px 22px 20px;border-radius:14px">
        <h1 style="margin:0 0 18px;font-family:${FONT};font-size:24px;line-height:1.25;font-weight:700;color:${C.text}">${keepTogether((Array.isArray(heading) ? heading : [heading]).map(esc).join('<br>'))}</h1>
        ${finish(blocks.join('\n        '))}
      </td></tr>
      <tr><td style="padding:18px 4px 0;font-family:${FONT};font-size:14px;line-height:1.6;color:${C.foot}">
        <a href="${SITE}" style="color:${C.foot};text-decoration:none">oper-stack.com</a>
        &nbsp;·&nbsp;
        <a href="mailto:info@oper-stack.com" style="color:${C.foot};text-decoration:none">info@oper-stack.com</a>
        ${unsubUrl ? `<br><a href="${unsubUrl}" style="color:${C.foot};text-decoration:underline">Not interested? One click and we stop.</a>` : ''}
      </td></tr>
    </table>
    <!--[if mso]></td></tr></table><![endif]-->
  </td></tr>
</table>
</body></html>`;
}

/**
 * Баллы по областям таблицей, с цветом. Человек видит результат, не открывая вложение.
 * Зелёное это хорошо, жёлтое средне, красное плохо: цвет считается, а не проставляется руками.
 */
export const scoreTable = (rows: [string, number | null][]) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 22px">
    ${rows.map(([label, v]) => {
      const colour = v === null ? C.dim : v >= 9 ? C.teal : v >= 7 ? C.amber : '#B4462F';
      const shown = v === null ? 'not measured' : `${v} / 10`;
      return `<tr>
        <td style="padding:9px 10px;border-bottom:1px solid ${C.line};font-family:${FONT};font-size:15px;line-height:1.35;color:${C.text}">${esc(label)}</td>
        <td align="right" style="padding:9px 10px;border-bottom:1px solid ${C.line};font-family:${FONT};font-size:15px;font-weight:700;white-space:nowrap;color:${colour}">${shown}</td>
      </tr>`;
    }).join('')}
  </table>`;

/** Ключ лицензии в рамке: крупно и моноширинно, чтобы выделялся одним касанием на телефоне. */
export const keyBlock = (title: string, value: string) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px">
    <tr><td align="center" bgcolor="${C.tint}" style="padding:20px 16px;border-radius:10px">
      <div style="font-family:${FONT};font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:${C.dim}">${esc(title)}</div>
      <div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:18px;line-height:1.5;color:${C.text};word-break:break-all;padding-top:6px">${esc(value)}</div>
    </td></tr>
  </table>`;
