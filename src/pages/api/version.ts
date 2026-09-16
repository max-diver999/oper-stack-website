/**
 * Какую версию движка сайт отдаёт прямо сейчас.
 *
 * Простым языком: у нас шесть мест, которые пользуются одним движком проверки. Поправили движок,
 * подняли версию в двух местах, забыли в третьем, и покупатель в письме получает работу недельной
 * давности. 16.09.2026 так и вышло: в коде была свежая версия, а письма уходили со старой.
 *
 * Проверять это по репозиториям бесполезно: репозиторий говорит, что должно собраться, а не что
 * собралось и работает. Поэтому сайт называет свою версию сам, и сторож на отдельной машине
 * спрашивает именно живой сайт.
 *
 * Отдаём без кеша: закешированный ответ соврёт ровно в тот момент, когда правда важнее всего.
 */
import type { APIRoute } from 'astro';
import enginePkg from '@operstack/audit/package.json';
import sitePkg from '../../../package.json';

export const prerender = false;

/** Момент запуска этого экземпляра. Показывает, когда сайт последний раз пересобирался. */
const startedAt = new Date().toISOString();

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      site: 'oper-stack.com',
      siteVersion: sitePkg.version,
      engine: enginePkg.version,
      startedAt,
    }),
    {
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store, max-age=0',
      },
    }
  );
