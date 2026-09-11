/**
 * Оплата картой на страницах продуктов.
 *
 * Пока Paddle не подтвердил аккаунт, чек-ауты у него выключены, и любая кнопка «купить» вела бы
 * человека в тупик. Поэтому включение идёт от переменных окружения: нет переменной, значит нет
 * кнопки, и страница показывает тот же порядок, что и сегодня, счёт письмом после согласования.
 * Когда Paddle откроет оплату, мы ставим переменные на Vercel, и кнопки появляются сами, одним
 * деплоем, без правки страниц.
 *
 * Переменные (Vercel, окружение production):
 *   PUBLIC_PADDLE_CLIENT_TOKEN   клиентский токен: Paddle > Developer tools > Authentication
 *   PUBLIC_PADDLE_PRICE_SITE_KIT id цены Site Kit, вида pri_...
 *   PUBLIC_PADDLE_PRICE_AUDIT    id цены аудита
 *
 * Токен клиентский, он предназначен для публикации в коде страницы. Серверный ключ сюда не
 * кладётся никогда: им можно выпускать возвраты и читать чужие покупки.
 */

/**
 * Кнопка оплаты есть только там, где купить можно сразу, ничего предварительно не согласовав:
 * комплект скачивается, аудит делается по одному адресу сайта. У Fix и Foundation кнопки нет и
 * не будет: их страницы обещают, что список работ согласуется письменно до оплаты, а кнопка
 * «купить» позволила бы заплатить раньше согласования и сломала бы это обещание. Цена на них
 * выставляется ссылкой на оплату после того, как клиент утвердил список.
 *
 * Ключи читаются по одному: Vite подставляет только те, что написаны в коде буквально.
 */
const PRICE_BY_SLUG: Record<string, string> = {
  'site-kit': String(import.meta.env.PUBLIC_PADDLE_PRICE_SITE_KIT || '').trim(),
  'seo-audit': String(import.meta.env.PUBLIC_PADDLE_PRICE_AUDIT || '').trim(),
};

export const PADDLE_TOKEN = String(import.meta.env.PUBLIC_PADDLE_CLIENT_TOKEN || '').trim();

/** Ссылка на готовый чек-аут Paddle, если оверлей не используется. Оставлена для Site Kit. */
export const KIT_CHECKOUT_URL = String(import.meta.env.PUBLIC_SITE_KIT_CHECKOUT_URL || '').trim();

const looksLikePrice = (x: string) => /^pri_[a-z0-9]{20,}$/i.test(x);

/** id цены для товара, если оплата для него включена и настроена правильно. */
export function priceFor(slug: string): string | null {
  const id = PRICE_BY_SLUG[slug] || '';
  return PADDLE_TOKEN && looksLikePrice(id) ? id : null;
}

/** Включена ли оплата картой хоть где-нибудь: по этому решаем, грузить ли Paddle.js. */
export const paddleEnabled = Boolean(PADDLE_TOKEN) && Object.keys(PRICE_BY_SLUG).some((s) => priceFor(s));

/** Надпись на кнопке. Цена берётся из карточки товара, чтобы не разошлась с тем, что на странице. */
export function buyLabel(price: string): string {
  return `Buy for ${price}`;
}
