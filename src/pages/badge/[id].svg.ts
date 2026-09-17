/**
 * Значок с баллом: картинка, которую владелец сайта вставляет к себе.
 *
 * Простым языком. Человек проверил сайт, получил хороший балл и хочет его показать. Он вставляет
 * к себе одну строку, и у него появляется наш значок. Каждая такая вставка это живая ссылка на
 * нас, а для него это доказательство, которое обновляется само: когда он проверит сайт снова,
 * значок покажет новое число без единой правки у него на странице.
 *
 * Почему значок берёт ПОСЛЕДНИЙ балл домена, а не тот, что был при первой проверке. Иначе он стал
 * бы витриной вчерашнего дня: человек всё починил, а значок показывает старое. Поэтому по адресу
 * лежит проверка, а рисуется свежайшая по тому же домену.
 *
 * Картинка намеренно без внешних шрифтов и без скриптов: значок вставляют на чужие сайты, и он
 * обязан рисоваться одинаково везде и ничего оттуда не утаскивать.
 */
import type { APIRoute } from 'astro';
import { loadCheck, latestForDomain } from '../../lib/check-store';

export const prerender = false;

const COLOURS = { good: '#2f9e6f', fair: '#c08a2e', poor: '#b8483c', ink: '#0B1017', paper: '#F5F1E8' };
const tone = (n: number) => (n >= 80 ? COLOURS.good : n >= 45 ? COLOURS.fair : COLOURS.poor);

function svg(score: number | null, label: string): string {
  const shown = score === null ? '?' : String(score);
  const right = score === null ? '#6b7280' : tone(score);
  // Ширина считается по числу знаков: значок должен одинаково хорошо смотреться с 7 и со 100.
  const rightW = 34 + shown.length * 9;
  const leftW = 118;
  const w = leftW + rightW;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="28" role="img" aria-label="${label}: ${shown} of 100">
  <title>${label}: ${shown} of 100</title>
  <rect width="${w}" height="28" rx="5" fill="${COLOURS.ink}"/>
  <rect x="${leftW}" width="${rightW}" height="28" rx="5" fill="${right}"/>
  <rect x="${leftW}" width="8" height="28" fill="${right}"/>
  <g font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" font-size="12">
    <text x="11" y="18" fill="${COLOURS.paper}" opacity="0.92">${label}</text>
    <text x="${leftW + rightW / 2}" y="18" fill="#fff" font-weight="700" text-anchor="middle">${shown}/100</text>
  </g>
</svg>`;
}

export const GET: APIRoute = async ({ params }) => {
  const id = String(params.id || '').replace(/\.svg$/, '');
  const stored = await loadCheck(id);
  // Свежайший балл того же домена: значок обязан показывать сегодняшнее состояние, а не то,
  // каким сайт был в день первой проверки.
  const current = stored ? await latestForDomain(stored.domain) : null;
  const score = current ? current.score : stored ? stored.score : null;
  return new Response(svg(score, 'AI visibility'), {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      // Пять минут кэша: значок стоит на чужих страницах и не должен бить по нашей базе на каждый
      // показ, но и устаревать на сутки ему нельзя.
      'Cache-Control': 'public, max-age=300, s-maxage=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
