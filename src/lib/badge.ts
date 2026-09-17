/**
 * Значок с баллом: картинка, которую владелец сайта вставляет к себе.
 *
 * Простым языком. Человек проверил сайт, получил хороший балл и хочет его показать. Он вставляет
 * к себе одну строку, и у него появляется наш значок. Каждая такая вставка это живая ссылка на
 * нас, а для него это доказательство, которое обновляется само: когда он проверит сайт снова,
 * значок покажет новое число без единой правки у него на странице.
 *
 * Рисунок кольца выбран владельцем 17.09.2026 из пяти вариантов. Балл видно рисунком, а не только
 * цифрой, поэтому значок читается и тем, кто на число не смотрит.
 *
 * Отрисовка живёт здесь, а не в самом маршруте, потому что размер картинки нужен ещё и странице
 * результата: она подставляет его в width и height, чтобы вёрстка не прыгала при загрузке. Две
 * формулы ширины в двух местах рано или поздно разойдутся, одна не разойдётся никогда.
 *
 * Картинка намеренно без внешних шрифтов и без скриптов: значок вставляют на чужие сайты, и он
 * обязан рисоваться одинаково везде и ничего оттуда не утаскивать.
 */

const C = {
  ink: '#0B1017',
  paper: '#F5F1E8',
  muted: '#8C979D',
  line: 'rgba(255,255,255,.12)',
  good: '#3DB8A9',
  fair: '#E8B84A',
  poor: '#d2694f',
  none: '#6b7280',
};
const tone = (n: number) => (n >= 80 ? C.good : n >= 45 ? C.fair : C.poor);

/*
 * Ширина строки без шрифтовых метрик. Доли ширины к размеру шрифта откалиброваны по настоящим
 * замерам в браузере: первая прикидка занижала кириллицу на двенадцать процентов, и надпись
 * «ИИ-видимость» налезала на балл. Кириллица шире латиницы, это надо считать отдельно.
 *
 * Оценка всё равно остаётся оценкой: на чужом сайте значок рисуется системным шрифтом, а он у
 * каждой системы свой. Поэтому каждая надпись рисуется с textLength, и браузер подгоняет её ровно
 * под ту ширину, которую мы под неё отвели. Ни наезда, ни пустоты не будет ни при каком шрифте.
 */
const W_NARROW = /[iljtfrI.,:;'`!|()[\]\-/]/;
const W_WIDE = /[mwMW@%]/;
const W_DIGIT = /[0-9]/;
const W_CYR_WIDE = /[мшщжыюфъМШЩЖЫЮФЪ]/;
const W_CYR_UPPER = /[А-ЯЁ]/;
const W_CYR = /[а-яё]/;
const W_UPPER = /[A-Z]/;

function textWidth(s: string, size: number): number {
  let u = 0;
  for (const ch of String(s)) {
    if (ch === ' ') u += 0.28;
    else if (W_CYR_WIDE.test(ch)) u += 0.78;
    else if (W_CYR_UPPER.test(ch)) u += 0.68;
    else if (W_CYR.test(ch)) u += 0.6;
    else if (W_NARROW.test(ch)) u += 0.32;
    else if (W_DIGIT.test(ch)) u += 0.58;
    else if (W_WIDE.test(ch)) u += 0.87;
    else if (W_UPPER.test(ch)) u += 0.62;
    else u += 0.535;
  }
  return Math.round(u * size);
}

const H = 34;
const PAD = 8;
const RING = 24;
const GAP = 9;
const R = 10;
const STROKE = 3.5;
const FS_LABEL = 9.5;
const FS_NUM = 13.5;

/** Ширина и высота значка. Страница результата подставляет их в img, чтобы вёрстка не прыгала. */
export function badgeSize(score: number | null, label: string): { width: number; height: number } {
  const shown = score === null ? '?' : String(score);
  // Запас к метке на разрядку: она набрана вразрядку прописными.
  const lw = textWidth(label.toUpperCase(), FS_LABEL) + Math.round(label.length * 0.9);
  const nw = textWidth(`${shown}/100`, FS_NUM);
  return { width: PAD + RING + GAP + Math.max(lw, nw) + PAD, height: H };
}

export function badgeSvg(score: number | null, label: string): string {
  const shown = score === null ? '?' : String(score);
  const col = score === null ? C.none : tone(score);
  const { width: w } = badgeSize(score, label);
  const lw = textWidth(label.toUpperCase(), FS_LABEL) + Math.round(label.length * 0.9);
  const nw = textWidth(`${shown}/100`, FS_NUM);
  const tx = PAD + RING + GAP;
  const circ = 2 * Math.PI * R;
  // Неизвестный балл кольцом не рисуем вовсе: пустое кольцо читалось бы как ноль.
  const filled = score === null ? 0 : score / 100;
  const title = `${label}: ${shown}/100`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${H}" viewBox="0 0 ${w} ${H}" role="img" aria-label="${title}">
  <title>${title}</title>
  <rect width="${w}" height="${H}" rx="7" fill="${C.ink}" stroke="${C.line}"/>
  <g transform="translate(${PAD + RING / 2} ${H / 2})">
    <circle r="${R}" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="${STROKE}"/>
    <circle r="${R}" fill="none" stroke="${col}" stroke-width="${STROKE}" stroke-linecap="round"
            stroke-dasharray="${circ.toFixed(1)}" stroke-dashoffset="${(circ * (1 - filled)).toFixed(1)}" transform="rotate(-90)"/>
  </g>
  <g font-family="Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif">
    <text x="${tx}" y="14" fill="${C.muted}" font-size="${FS_LABEL}" textLength="${lw}" lengthAdjust="spacingAndGlyphs">${label.toUpperCase()}</text>
    <text x="${tx}" y="27" fill="${C.paper}" font-size="${FS_NUM}" font-weight="700" textLength="${nw}" lengthAdjust="spacingAndGlyphs">${shown}<tspan fill="${C.muted}" font-size="${FS_NUM - 3}" font-weight="400">/100</tspan></text>
  </g>
</svg>`;
}

/** Подпись на значке. Одна на сайт: значок этого сайта говорит на языке этого сайта. */
export const BADGE_LABEL = 'AI visibility';
