/**
 * The weekly note that brings an owner back.
 *
 * A counter nobody opens is a counter nobody values, and nothing in this product asks for attention
 * on its own. So once a week we say what happened, in one short email, with the number first.
 *
 * Two rules keep it from becoming noise. We only write when there is something to say, or once when
 * a week has passed and nothing has been counted at all, because that silence usually means the
 * line was never pasted. And every email carries the link that stops it.
 */
import { visitsDb } from './visits-db';

export type WeeklyRow = {
  id: string;
  domain: string;
  email: string;
  view_token: string;
  created_at: string;
  last_report_at: string | null;
  lang: string;
};

export type WeeklyNumbers = {
  thisWeek: number;
  lastWeek: number;
  byAssistant: Array<{ assistant: string; hits: number }>;
  everCounted: number;
};

/** Sites whose owner asked for the note and has not had one in the last six days. */
export async function dueForReport(limit = 200): Promise<WeeklyRow[]> {
  const sql = visitsDb();
  return (await sql`
    select id, domain, email, view_token, created_at, last_report_at, lang
    from sites
    where weekly = true
      and email is not null
      and view_token is not null
      and (last_report_at is null or last_report_at < now() - interval '6 days')
      and created_at < now() - interval '7 days'
    order by created_at asc
    limit ${limit}`) as unknown as WeeklyRow[];
}

export async function numbersFor(siteId: string): Promise<WeeklyNumbers> {
  const sql = visitsDb();
  const rows = await sql`
    select
      coalesce(sum(hits) filter (where day >= current_date - 7), 0)::int  as this_week,
      coalesce(sum(hits) filter (where day >= current_date - 14
                                   and day <  current_date - 7), 0)::int as last_week,
      coalesce(sum(hits), 0)::int                                         as ever
    from visits where site_id = ${siteId}`;
  const byAssistant = (await sql`
    select assistant, sum(hits)::int as hits
    from visits
    where site_id = ${siteId} and day >= current_date - 7
    group by assistant order by hits desc, assistant asc`) as unknown as Array<{
    assistant: string;
    hits: number;
  }>;
  return {
    thisWeek: rows[0].this_week,
    lastWeek: rows[0].last_week,
    everCounted: rows[0].ever,
    byAssistant,
  };
}

/** How the week compares with the one before it, in words rather than a percentage. */
export function movement(thisWeek: number, lastWeek: number, ru = false): string {
  if (lastWeek === 0 && thisWeek > 0) return ru ? 'первая неделя, когда кто-то пришёл' : 'the first week with any';
  if (lastWeek === 0) return '';
  const diff = thisWeek - lastWeek;
  if (diff === 0) return ru ? 'столько же, сколько неделей раньше' : 'the same as the week before';
  if (ru) return `на ${Math.abs(diff)} ${diff > 0 ? 'больше' : 'меньше'}, чем неделей раньше`;
  return `${Math.abs(diff)} ${diff > 0 ? 'more' : 'fewer'} than the week before`;
}

/** Russian needs three forms of the word, and getting it wrong reads as machine output. */
function visitsWord(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'визит';
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return 'визита';
  return 'визитов';
}

/**
 * Either the numbers, or the one nudge we send when a week has passed and nothing arrived.
 * Returns null when there is nothing worth an email, which is most weeks for most sites.
 */
export function composeWeekly(
  row: WeeklyRow,
  n: WeeklyNumbers,
  siteUrl: string,
  /** The other half: can anybody quote this site at all, and did that move. */
  score?: { score: number; day: string } | null,
  scoreBefore?: { score: number; day: string } | null,
): { subject: string; text: string; html: string } | null {
  const dashboard = `${siteUrl}/visits/numbers/?t=${row.view_token}`;
  const stop = `${siteUrl}/visits/stop/?t=${row.view_token}`;

  const ru = row.lang === 'ru';

  /** One line about the score, or nothing when we have never taken one. */
  const scoreLine = (() => {
    if (!score) return '';
    const diff = scoreBefore ? score.score - scoreBefore.score : 0;
    if (ru) {
      const move = !scoreBefore ? '' : diff === 0 ? ', без изменений' : `, ${diff > 0 ? 'выросла на ' : 'упала на '}${Math.abs(diff)}`;
      return `Оценка «могут ли вас процитировать»: ${score.score} из 100${move}.`;
    }
    const move = !scoreBefore ? '' : diff === 0 ? ', unchanged' : `, ${diff > 0 ? 'up ' : 'down '}${Math.abs(diff)}`;
    return `Whether you can be quoted at all: ${score.score} of 100${move}.`;
  })();

  if (n.everCounted === 0) {
    // Only once: after the first silent week. A second identical nudge is nagging.
    if (row.last_report_at) return null;
    if (ru) {
      return {
        subject: `На ${row.domain} пока ничего не насчитано`,
        text: [
          `Неделя прошла, а визитов от ИИ-ассистентов на ${row.domain} не насчиталось ни одного.`,
          '',
          'Для небольшого сайта это нормально, и ровно так же выглядит не вставленная строчка.',
          'Откройте свой сайт, посмотрите исходный код страницы и поищите в нём v.js. Если его там',
          'нет, строчка не сохранилась, и вставить её заново это минута.',
          '',
          `Ваши числа: ${dashboard}&lang=ru`,
          `Отписаться: ${stop}&lang=ru`,
        ].join('\n'),
        html: `<p>Неделя прошла, а визитов от ИИ-ассистентов на <b>${esc(row.domain)}</b> не насчиталось ни одного.</p>
<p>Для небольшого сайта это нормально, и ровно так же выглядит не вставленная строчка. Откройте свой сайт, посмотрите исходный код страницы и поищите в нём <code>v.js</code>. Если его там нет, строчка не сохранилась, и вставить её заново это минута.</p>
<p><a href="${dashboard}&lang=ru">Ваши числа</a> · <a href="${stop}&lang=ru">отписаться</a></p>`,
      };
    }
    const subject = `Nothing counted yet on ${row.domain}`;
    const lines = [
      `A week in and no visits from AI assistants have been counted on ${row.domain}.`,
      '',
      'That is normal for a small site, and it is also exactly what a missing line looks like.',
      'Open your site, view the page source, and search it for v.js. If it is not there, the line',
      'did not save, and pasting it again takes a minute.',
      '',
      `Your numbers: ${dashboard}`,
      `Stop these emails: ${stop}`,
    ];
    return {
      subject,
      text: lines.join('\n'),
      html: `<p>A week in and no visits from AI assistants have been counted on <b>${esc(row.domain)}</b>.</p>
<p>That is normal for a small site, and it is also exactly what a missing line looks like. Open your site, view the page source, and search it for <code>v.js</code>. If it is not there, the line did not save, and pasting it again takes a minute.</p>
<p><a href="${dashboard}">Your numbers</a> · <a href="${stop}">stop these emails</a></p>`,
    };
  }

  if (n.thisWeek === 0) return null; // a quiet week on a working counter needs no email

  if (ru) {
    const moveRu = movement(n.thisWeek, n.lastWeek, true);
    const visitsRu = `${n.thisWeek} ${visitsWord(n.thisWeek)}`;
    const listRu = n.byAssistant.map((a) => `  ${a.assistant}: ${a.hits}`).join('\n');
    const rowsRu = n.byAssistant
      .map((a) => `<tr><td style="padding:4px 12px 4px 0">${esc(a.assistant)}</td><td align="right">${a.hits}</td></tr>`)
      .join('');
    return {
      subject: `${visitsRu} из ИИ на ${row.domain}`,
      text: [
        `За последние семь дней на ${row.domain} пришло ${visitsRu} от ИИ-ассистентов${moveRu ? ', ' + moveRu : ''}.`,
        ...(scoreLine ? ['', scoreLine] : []),
        '',
        listRu,
        '',
        `Ваши числа: ${dashboard}&lang=ru`,
        `Отписаться: ${stop}&lang=ru`,
      ].join('\n'),
      html: `<p>За последние семь дней на <b>${esc(row.domain)}</b> пришло <b>${visitsRu}</b> от ИИ-ассистентов${moveRu ? ', ' + esc(moveRu) : ''}.</p>
${scoreLine ? `<p>${esc(scoreLine)}</p>` : ''}
<table style="border-collapse:collapse;font:14px system-ui,sans-serif">${rowsRu}</table>
<p><a href="${dashboard}&lang=ru">Ваши числа</a> · <a href="${stop}&lang=ru">отписаться</a></p>`,
    };
  }

  const move = movement(n.thisWeek, n.lastWeek);
  const visits = `${n.thisWeek} ${n.thisWeek === 1 ? 'visit' : 'visits'}`;
  const subject = `${visits} from AI assistants on ${row.domain}`;
  const list = n.byAssistant.map((a) => `  ${a.assistant}: ${a.hits}`).join('\n');
  const rows = n.byAssistant
    .map((a) => `<tr><td style="padding:4px 12px 4px 0">${esc(a.assistant)}</td><td align="right">${a.hits}</td></tr>`)
    .join('');

  return {
    subject,
    text: [
      `${visits} arrived at ${row.domain} from AI assistants in the last seven days${move ? ', ' + move : ''}.`,
      ...(scoreLine ? ['', scoreLine] : []),
      '',
      list,
      '',
      `Your numbers: ${dashboard}`,
      `Stop these emails: ${stop}`,
    ].join('\n'),
    html: `<p><b>${visits}</b> arrived at <b>${esc(row.domain)}</b> from AI assistants in the last seven days${move ? ', ' + esc(move) : ''}.</p>
${scoreLine ? `<p>${esc(scoreLine)}</p>` : ''}
<table style="border-collapse:collapse;font:14px system-ui,sans-serif">${rows}</table>
<p><a href="${dashboard}">Your numbers</a> · <a href="${stop}">stop these emails</a></p>`,
  };
}

function esc(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
