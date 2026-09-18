/**
 * Одна выдача на одну покупку, сколько бы событий Whop ни прислал.
 *
 * Зачем. До 18.09.2026 вебхук был подписан ровно на одно событие, `payment.succeeded`. Оно не
 * приходит вовсе, если человек оформил товар по промокоду со стопроцентной скидкой: платежа нет,
 * значит и события нет, и покупатель остаётся ни с чем. Чтобы бесплатная выдача работала, нужно
 * подписаться ещё и на `membership.activated`, но тогда обычная покупка порождает два события
 * подряд и два одинаковых письма.
 *
 * Поэтому здесь замок. Первое событие про эту покупку берёт ключ и выдаёт товар, второе видит
 * занятый ключ и молчит. Ключ живёт в той же базе Neon, что и счётчик визитов: своей таблицей,
 * без чужих данных, только отпечаток покупки и время.
 *
 * Если база не настроена, замок не срабатывает и выдача идёт как раньше: потерять письмо хуже,
 * чем прислать второе.
 */
import { neon } from '@neondatabase/serverless';

const CONNECTION = import.meta.env.DATABASE_URL || process.env.DATABASE_URL || '';

/** Столько времени считаем два события одной покупкой. Whop присылает их подряд, секунд за десять. */
const WINDOW_MINUTES = 120;

let ready = false;

async function ensureTable(sql: ReturnType<typeof neon>): Promise<void> {
  if (ready) return;
  await sql`CREATE TABLE IF NOT EXISTS webhook_once (
    key text PRIMARY KEY,
    created_at timestamptz NOT NULL DEFAULT now()
  )`;
  ready = true;
}

/**
 * Занять ключ. Возвращает true, если эта покупка обслуживается впервые, и false, если её уже
 * обслужили. База не настроена или недоступна значит true: лучше второе письмо, чем ни одного.
 *
 * @param key отпечаток покупки: товар плюс почта покупателя, без платежа. Идентификатор платежа
 *            сюда не годится, у бесплатной выдачи его нет, а у события про членство он другой.
 */
export async function claimOnce(key: string): Promise<boolean> {
  if (!CONNECTION || !key) return true;
  try {
    const sql = neon(CONNECTION);
    await ensureTable(sql);
    await sql`DELETE FROM webhook_once WHERE created_at < now() - make_interval(mins => ${WINDOW_MINUTES})`;
    const rows = await sql`INSERT INTO webhook_once (key) VALUES (${key})
      ON CONFLICT (key) DO NOTHING RETURNING key`;
    return rows.length > 0;
  } catch (err) {
    console.error('webhook-once:', (err as Error).message);
    return true;
  }
}

/** Отпечаток покупки. Почта в нижнем регистре: Whop присылает её по-разному в разных событиях. */
export function purchaseKey(product: string, email: string): string {
  return `${String(product || '').trim()}:${String(email || '').trim().toLowerCase()}`;
}
