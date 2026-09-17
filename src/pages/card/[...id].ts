/**
 * Картинка для сторис и поста: то, что человек правда захочет выложить.
 *
 * Простым языком. Маленький значок 180 на 28 пикселей годится, чтобы повесить на свой сайт в
 * подвале. Но выложить его в сторис нельзя: там нужна большая картинка, на которой видно балл,
 * оценку, чей это сайт и кто мерил. 17.09.2026 владелец сказал прямо: «я там красавчик, я там
 * чемпион», и это правильное требование к такой картинке.
 *
 * Поэтому здесь второй формат, 1200 на 630: он же уходит в og:image, то есть появляется сам, когда
 * ссылку кидают в мессенджер.
 *
 * Без внешних шрифтов и скриптов намеренно: картинку тянут чужие площадки.
 */
import type { APIRoute } from 'astro';
import { loadCheck, latestForDomain } from '../../lib/check-store';

/*
 * PNG отдаём только по запросу ?png=1. Мессенджеры и соцсети не показывают SVG в превью ссылки
 * вовсе, поэтому og:image обязан быть растром. Рисует sharp, он уже стоит рядом с Astro.
 *
 * Шрифты на сервере это отдельный риск: в облачной функции их может не быть ни одного, и тогда
 * буквы просто не нарисуются. Поэтому ручка написана так, чтобы падение было видимым: не
 * получилось нарисовать растр, отдаём SVG с тем же содержимым, а не пустую картинку.
 */
async function toPng(svg: string): Promise<Uint8Array | null> {
  try {
    const sharp = (await import('sharp')).default;
    return await sharp(Buffer.from(svg), { density: 96 }).png({ compressionLevel: 9 }).toBuffer();
  } catch {
    return null;
  }
}

export const prerender = false;

const C = {
  ink: '#0B1017', paper: '#F5F1E8', muted: '#8C979D', line: 'rgba(255,255,255,.10)',
  good: '#3DB8A9', fair: '#E8B84A', poor: '#d2694f',
};
const tone = (n: number) => (n >= 80 ? C.good : n >= 45 ? C.fair : C.poor);
const grade = (n: number) => (n >= 80 ? 'A' : n >= 65 ? 'B' : n >= 45 ? 'C' : 'D');
const esc = (s: string) => String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] as string));

function card(domain: string, score: number, areas: { label: string; score: number; max: number }[], lang: string): string {
  const ru = lang === 'ru';
  const col = tone(score);
  const W = 1200, H = 630;

  /*
   * Геометрия считается, а не подбирается на глаз. Кольцо занимает от cy-r-stroke/2 до
   * cy+r+stroke/2, и подпись «оценка» ставится НИЖЕ этой границы с запасом: 17.09.2026 первая
   * версия налезала буквами на кольцо ровно потому, что я поставил её по ощущению.
   */
  const cx = 210, cy = 320, r = 96, stroke = 16;
  const ringBottom = cy + r + stroke / 2;
  const circ = 2 * Math.PI * r;

  // Подпись и число на ОДНОЙ строке, полоса под ними: иначе число висит над чужой полосой.
  const bars = areas.slice(0, 5).map((a, i) => {
    const y = 268 + i * 54;
    const pct = a.max ? Math.max(0, Math.min(1, a.score / a.max)) : 0;
    return `<text x="470" y="${y}" fill="${C.muted}" font-size="19">${esc(a.label)}</text>
      <text x="1120" y="${y}" fill="${C.paper}" font-size="19" text-anchor="end" font-weight="600">${a.score}/${a.max}</text>
      <rect x="470" y="${y + 12}" width="650" height="7" rx="3.5" fill="${C.line}"/>
      <rect x="470" y="${y + 12}" width="${(650 * pct).toFixed(0)}" height="7" rx="3.5" fill="${col}"/>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif">
  <rect width="${W}" height="${H}" fill="${C.ink}"/>
  <circle cx="1130" cy="-70" r="430" fill="${col}" opacity="0.06"/>

  <text x="80" y="92" fill="${C.muted}" font-size="19" letter-spacing="3">${ru ? 'ВИДИМОСТЬ В НЕЙРОСЕТЯХ' : 'AI VISIBILITY'}</text>
  <text x="80" y="150" fill="${C.paper}" font-size="40" font-weight="700">${esc(domain)}</text>

  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${C.line}" stroke-width="${stroke}"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${col}" stroke-width="${stroke}" stroke-linecap="round"
          stroke-dasharray="${circ.toFixed(1)}" stroke-dashoffset="${(circ * (1 - score / 100)).toFixed(1)}"
          transform="rotate(-90 ${cx} ${cy})"/>
  <text x="${cx}" y="${cy + 18}" fill="${C.paper}" font-size="76" font-weight="700" text-anchor="middle">${score}</text>
  <text x="${cx}" y="${cy + 54}" fill="${C.muted}" font-size="21" text-anchor="middle">${ru ? 'из 100' : 'of 100'}</text>
  <text x="${cx}" y="${ringBottom + 46}" fill="${col}" font-size="25" font-weight="700" text-anchor="middle" letter-spacing="1">${ru ? 'ОЦЕНКА' : 'GRADE'} ${grade(score)}</text>

  ${bars}

  <line x1="80" y1="556" x2="1120" y2="556" stroke="${C.line}"/>
  <text x="80" y="594" fill="${C.muted}" font-size="19">${ru ? 'Проверено на' : 'Measured at'} oper-stack.${ru ? 'ru' : 'com'}</text>
  <text x="1120" y="594" fill="${C.muted}" font-size="19" text-anchor="end">${ru ? 'Только публичные сигналы' : 'Public signals only'}</text>
</svg>`;
}

export const GET: APIRoute = async ({ params, url }) => {
  const id = String(params.id || '').replace(/\.(svg|png)$/, '').replace(/\/$/, '');
  const stored = await loadCheck(id);
  if (!stored) return new Response('not found', { status: 404 });
  // Свежайший балл того же домена: карточка обязана показывать сегодняшнее состояние.
  const current = (await latestForDomain(stored.domain, stored.lang)) || stored;
  const areas = ((current.payload || {}).areas || []).map((a: any) => ({ label: a.label, score: a.score, max: a.max }));
  const svg = card(current.domain, current.score, areas, stored.lang);

  if (url.searchParams.has('png')) {
    const png = await toPng(svg);
    if (png) {
      return new Response(png, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=300, s-maxage=300',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  }

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
