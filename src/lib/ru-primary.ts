/**
 * Первичная запись персональных данных на российской стороне.
 *
 * Простым языком. Закон требует, чтобы первая запись данных гражданина России попадала в базу,
 * которая физически стоит в России. Наши сайты живут на Vercel в США, а таблица лидов в Google,
 * то есть до этого модуля первая запись происходила за границей. Теперь заявка сначала ложится
 * файлом на Яндекс Диск, и только потом идёт дальше в привычные инструменты: Google Таблицу,
 * письмо, Telegram. Для работы ничего не меняется, меняется порядок и место первой записи.
 *
 * Почему Диск, а не Яндекс Облако. Консоль Облака из-за границы не открывается: у владельца
 * таймаут с любого канала, у нас цепочка переходов упирается в капчу. Без консоли не принять
 * пользовательское соглашение, без соглашения Облако не выдаёт служебный токен. Диск же это
 * обычный сервис Яндекса, он работает откуда угодно и стоит ноль. Проверено 15.09.2026.
 *
 * Права нарочно узкие. Токен выдан на доступ только к папке самого приложения (app:/), к
 * остальному Диску владельца он не дотянется при всём желании.
 *
 * Правило поведения при сбое. Заявка человека важнее нашего порядка записи: если Диск не
 * ответил, мы пробуем ещё раз, а дальше всё равно продолжаем обычный путь и возвращаем
 * 'failed'. Терять лид из-за недоступности Яндекса нельзя ни при каких условиях.
 *
 * Env: YANDEX_DISK_TOKEN. Не задан, запись молча выключена и возвращается 'off'.
 */
const API = 'https://cloud-api.yandex.net/v1/disk';
/** Столько ждём Яндекс и не дольше: форма на сайте не должна стоять из-за нас. */
const TIMEOUT_MS = 4000;
const FOLDER = 'app:/leads';

const env = (key: string, fallback = ''): string =>
  String((import.meta.env as Record<string, unknown>)[key] ?? process.env[key] ?? fallback).trim();

export const primaryConfigured = (): boolean => Boolean(env('YANDEX_DISK_TOKEN'));

/** Папку создаём один раз на инстанс. Существует уже, Яндекс отвечает 409, и это не ошибка. */
let folderReady: Promise<void> | null = null;
function ensureFolder(token: string): Promise<void> {
  if (!folderReady) {
    folderReady = fetch(`${API}/resources?path=${encodeURIComponent(FOLDER)}`, {
      method: 'PUT',
      headers: { Authorization: `OAuth ${token}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    }).then(() => undefined).catch(() => undefined);
  }
  return folderReady;
}

/** Имя файла: время плюс случайный хвост, чтобы две заявки в одну секунду не затёрли друг друга. */
function fileName(kind: string): string {
  const now = new Date().toISOString().replace(/[:.]/g, '-');
  const tail = Math.random().toString(36).slice(2, 8);
  return `${FOLDER}/${now}-${kind}-${tail}.json`;
}

async function putOnce(token: string, path: string, body: string): Promise<boolean> {
  const ask = await fetch(`${API}/resources/upload?path=${encodeURIComponent(path)}&overwrite=false`, {
    headers: { Authorization: `OAuth ${token}` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!ask.ok) return false;
  const href = (await ask.json())?.href;
  if (!href) return false;
  const put = await fetch(href, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  return put.ok;
}

/**
 * Записать заявку на российскую сторону. Вызывать ДО того, как данные уйдут в Google, в письмо
 * или в Telegram: смысл именно в очерёдности.
 *
 * @param kind  что за заявка: 'check', 'lead', 'order'
 * @param data  поля заявки, ровно те, что мы и так храним
 */
export async function recordPrimary(
  kind: 'check' | 'lead' | 'order',
  data: Record<string, unknown>,
): Promise<'written' | 'off' | 'failed'> {
  const token = env('YANDEX_DISK_TOKEN');
  if (!token) return 'off';
  const body = JSON.stringify({ kind, at: new Date().toISOString(), ...data }, null, 2);
  try {
    await ensureFolder(token);
    if (await putOnce(token, fileName(kind), body)) return 'written';
    // Одна повторная попытка: сеть до России бывает капризной, а лид у нас один.
    if (await putOnce(token, fileName(kind), body)) return 'written';
  } catch {
    // Наружу не выбрасываем никогда: см. правило поведения при сбое выше.
  }
  return 'failed';
}
