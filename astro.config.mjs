import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import referenceConfig from './reference-infra.config.json' with { type: 'json' };
import { collectContentLastmod } from './scripts/reference-infra/content-lastmod.mjs';
import rehypeTableLabels from './scripts/rehype/table-labels.mjs';

const contentLastmod = await collectContentLastmod(referenceConfig, { root: process.cwd() });
const lastmodByUrl = new Map(contentLastmod.map((item) => [item.url, item.lastmod]));

export default defineConfig({
  /*
   * Проверку источника выключаем сознательно, ради отписки в один клик.
   *
   * Gmail и Яндекс с 2024 года требуют от отправителя заголовок List-Unsubscribe-Post и шлют на
   * адрес отписки обычный POST без заголовка Origin. Встроенная защита Astro такой запрос
   * отбивает кодом 403 ещё до обработчика, поэтому обещать отписку в один клик было нельзя, а
   * без неё письма уезжают в спам.
   *
   * Чем мы при этом рискуем: ничем. Защита от подделки запроса нужна там, где браузер сам
   * прикладывает к запросу пропуск, то есть куку или сессию. Ни один наш адрес их не читает:
   * заявка защищена ловушкой для ботов и ограничением по адресу, отписка подписанным токеном,
   * заказ ловушкой и проверкой на спам. Отнять у нас через чужую страницу нечего.
   */
  security: { checkOrigin: false },
  site: 'https://oper-stack.com',
  output: 'static',
  trailingSlash: 'always',
  adapter: vercel({ maxDuration: 30 }),
  markdown: {
    // Подписи колонок в ячейках: на телефоне таблица раскладывается в карточки, и без подписи
    // ячейка теряет смысл. Делается на сборке, чтобы подпись была в готовой странице.
    rehypePlugins: [rehypeTableLabels],
  },
  integrations: [
    sitemap({
      filter(page) {
        // Страницы под noindex в карте сайта дают противоречивый сигнал:
        // карта говорит «индексируй», мета на странице говорит «не индексируй».
        //
        // Сравниваем путь целиком, а не вхождением. Вхождение '/site-report/' выбрасывало из карты
        // сайта страницу товара /products/site-report/, то есть ровно ту, которую надо продавать, а
        // форму /report/, закрытую от индексации, оставляло внутри.
        // /visits/numbers/ открывается только по личной ссылке и стоит под noindex.
        // /fix/ и /email-settings/ (25.09.2026) открываются только по подписанной ссылке из письма Watch.
        const excludedExact = ['/report/', '/visits/numbers/', '/visits/stop/', '/fix/', '/email-settings/'];
        const excludedPrefix = ['/thanks/'];
        const path = new URL(page).pathname;
        return !excludedExact.includes(path) && !excludedPrefix.some((p) => path.startsWith(p));
      },
      serialize(item) {
        const lastmod = lastmodByUrl.get(item.url);
        return lastmod ? { ...item, lastmod: new Date(`${lastmod}T00:00:00Z`) } : item;
      },
    }),
  ],
});
