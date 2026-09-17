/**
 * Маршрут значка. Сам рисунок и его размер живут в src/lib/badge.ts: размер нужен ещё и странице
 * результата, а две формулы ширины в двух местах рано или поздно разойдутся.
 *
 * Почему значок берёт ПОСЛЕДНИЙ балл домена, а не тот, что был при первой проверке. Иначе он стал
 * бы витриной вчерашнего дня: человек всё починил, а значок показывает старое. Поэтому по адресу
 * лежит проверка, а рисуется свежайшая по тому же домену и на том же языке.
 *
 * Почему файл называется [...id].ts, а не [id].svg.ts. Второй вариант Astro разбирает не так, как
 * кажется, и маршрут просто не находится: 17.09.2026 значок отдавал 404 и на боевом, и на локальном,
 * хотя страница результата рядом работала. Здесь маршрут ловит всё после /badge/, а расширение .svg
 * отрезается ниже. Проверять такие вещи только живым запросом: сборка их не видит.
 */
import type { APIRoute } from 'astro';
import { loadCheck, latestForDomain } from '../../lib/check-store';
import { BADGE_LABEL, badgeSvg } from '../../lib/badge';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const id = String(params.id || '').replace(/\.svg$/, '');
  const stored = await loadCheck(id);
  const current = stored ? await latestForDomain(stored.domain, stored.lang) : null;
  const score = current ? current.score : stored ? stored.score : null;
  return new Response(badgeSvg(score, BADGE_LABEL), {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      // Пять минут кэша: значок стоит на чужих страницах и не должен бить по нашей базе на каждый
      // показ, но и устаревать на сутки ему нельзя.
      'Cache-Control': 'public, max-age=300, s-maxage=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
