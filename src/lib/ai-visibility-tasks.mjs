/**
 * Одна находка бесплатной проверки превращается в задачу, которую покупатель
 * отдаёт своему разработчику или вставляет в ChatGPT, Claude или Cursor.
 *
 * Тот же формат, что в платном списке задач: что сейчас, что сделать, как проверить.
 * Разница только в объёме: бесплатно отдаём одну задачу, за 9 долларов все.
 *
 * Правило внутри каждой задачи: не выдумывать факты о бизнесе. Без него помощник
 * дописывает адреса, телефоны и цифры, которых на сайте нет.
 */

const RULE = 'Do not invent facts about the business. Anything that is not already on the site and was not given to you, ask the owner about and leave a note instead of guessing.';

/** id находки -> задача. Порядок полей совпадает с платным файлом. */
const TASKS = {
  'robots-all-blocked': {
    title: 'Let readers into the site',
    task: 'Open robots.txt at the root of the site. It currently disallows everything for every user agent. Decide which paths genuinely must stay closed (admin, cart, internal search) and disallow only those. Everything meant to be found by people should be allowed. Do not add rules for individual AI crawlers yet: first make the default open.',
    verify: 'robots.txt no longer contains a Disallow: / rule under User-agent: *, and the homepage is allowed.',
  },
  'robots-fetchers-blocked': {
    task: 'In robots.txt, remove the Disallow rules that block the answer-engine fetchers named in the finding. These are the bots that read a page live when someone asks an assistant a question and then quote it with a link. They are not training crawlers and blocking them removes the site from answers. If you want to keep training crawlers out, leave those rules alone and remove only the fetcher ones.',
    verify: 'The named fetchers are no longer disallowed in robots.txt, and the site still blocks whatever you deliberately wanted blocked.',
  },
  'robots-training-blocked': {
    task: 'Decide deliberately whether the training crawlers named in the finding should stay blocked. Blocking them keeps the site out of model training, which is a fair choice, but it also means an assistant will know less about the brand when it answers from memory. If the block was not a deliberate decision, remove those lines from robots.txt.',
    verify: 'The decision is deliberate and written down somewhere, and robots.txt matches it.',
  },
  'noai': {
    task: 'Find the page carrying a noai robots meta tag and decide whether that was deliberate. The tag asks AI systems not to use the page. If it was copied in from a template or a plugin default, remove it.',
    verify: 'No page carries a noai meta tag unless you meant it to.',
  },
  'noai-meta': {
    task: 'Find the page carrying a noai robots meta tag and decide whether that was deliberate. The tag asks AI systems not to use the page. If it was copied in from a template or a plugin default, remove it.',
    verify: 'No page carries a noai meta tag unless you meant it to.',
  },
  'llms-missing': {
    task: 'Create a file called llms.txt at the root of the site, reachable at /llms.txt, served as plain text. Put in it: one line saying what the business is and where it operates, then a list of the pages that actually matter, each as a full address with a short description of what is on it. Fifteen to forty lines is plenty. Take the descriptions from what the pages really say.',
    verify: 'Opening /llms.txt in a browser shows plain text, not a web page, and every link in it opens a working page on this site.',
  },
  'llms-not-text': {
    task: 'The address /llms.txt currently returns a web page instead of a text file, which usually means the server is serving the 404 page or a route is catching it. Put a real text file there and make sure it is served with the content type text/plain.',
    verify: 'Opening /llms.txt shows plain text in the browser and the response content type is text/plain.',
  },
  'llms-foreign': {
    task: 'The llms.txt file links mostly to other websites rather than to this one. An AI system reading it may attach the site to the wrong business. Rewrite it so the links point at this site\'s own pages. Links to other sites belong in the text of a page, not in the map of what this business is.',
    verify: 'Every link in /llms.txt points at this domain.',
  },
  'schema-org-missing': {
    task: 'Add Organization markup (schema.org, JSON-LD) to the homepage: the business name, the site address, the logo, the city and country, an email or phone, and links to the company profiles elsewhere. Fill it only with what actually exists. An invented address or a profile that is not yours is worse than nothing.',
    verify: 'The homepage carries Organization JSON-LD, it passes the Rich Results Test, and every field in it is true.',
  },
  'schema-faq-missing': {
    task: 'Find a page that already answers real customer questions and mark those questions up as FAQPage (schema.org, JSON-LD). Use the questions and answers that are already written on the page, word for word. Do not invent new questions to fill the markup, and do not mark up text that is not visible to a visitor.',
    verify: 'The page carries FAQPage JSON-LD, every question in it appears on the visible page, and it passes the Rich Results Test.',
  },
  'schema-article-missing': {
    task: 'Add Article markup (schema.org, JSON-LD) to the content pages: the headline as it appears on the page, the publication date, the modified date if there is one, and the author. Use the real dates. If a page has no author, name the company rather than inventing a person.',
    verify: 'Content pages carry Article JSON-LD with a real publication date, and it passes the Rich Results Test.',
  },
  'canonical-missing': {
    task: 'Add a canonical link tag to the homepage pointing at its own preferred address, and check the rest of the site does the same. Pick one form of the address, with or without www, and be consistent. Without it, the same page reachable at several addresses gets treated as several pages.',
    verify: 'The homepage source contains one canonical link tag and it points at the address you want people to land on.',
  },
  'og-missing': {
    task: 'Add Open Graph tags to the homepage: og:title, og:description, og:image with a picture at least 1200 by 630 pixels, and og:url. Take the title and description from the page itself, do not write new promises. Check the image opens by direct link without a login.',
    verify: 'Pasting the homepage address into a messenger shows a card with a title, a description and a picture.',
  },
  'thin-pages': {
    task: 'Take the pages named as too short and decide for each one: either it has something to say and should say it properly, or it should not be a separate page at all. For the ones worth keeping, add what a reader actually needs: what the thing is, who it suits, what it costs, what happens next. Do not pad with words to reach a length. Merge or remove the rest.',
    verify: 'Every page either carries a real answer of its own or no longer exists as a separate page.',
  },
  'answer-first-missing': {
    task: 'On each page named, put a short paragraph right after the main heading that answers the question the page is about, in twenty to ninety words, with a concrete figure in it. That paragraph is what an answer engine quotes. Write it from what the page already says; if there is no figure on the page, do not invent one, use the most concrete fact there is.',
    verify: 'Each page opens with a short paragraph directly under the H1 that answers the page question and can be read on its own.',
  },
  'few-h2': {
    task: 'Break the named pages into sections with at least three second-level headings, and make each heading say what the section answers rather than naming a topic. "How much it costs" beats "Pricing". A wall of text with no sections cannot be quoted in parts.',
    verify: 'Each page has three or more H2 headings and each one describes what its section answers.',
  },
  'no-tables': {
    task: 'Find the place on the site where you compare things or list numbers in prose, and turn it into a real table. Prices by type, options side by side, what is included and what is not. Tables are the second most quoted format after the opening paragraph. Use only figures that are already on the site.',
    verify: 'At least one important page carries a real HTML table, not a picture of one.',
  },
  'dates-missing': {
    task: 'Expose publication and modified dates on the content pages: visible to a reader near the top or bottom, and in the page markup. Use the real dates. Do not set today as the date on an old page to look fresh: an engine that sees a date change without a text change learns to distrust the site.',
    verify: 'Each content page shows a date a reader can see, and the same date appears in the page markup.',
  },
  'sources-missing': {
    task: 'Go through the paragraphs that contain figures and say next to each one where it comes from: a link to the original, or words such as "according to the 2026 register". If neither you nor the owner has a source for a figure, remove the figure rather than leaving it bare. Do not attach a source at random: a wrong source is worse than none.',
    verify: 'Every paragraph with a figure either links to a source or names one in words.',
  },
  'sitemap-no-lastmod': {
    task: 'Add lastmod dates to the sitemap, taken from when each page actually changed. Most site generators can do this automatically. Do not write today\'s date for every page: a sitemap where everything changed today tells a crawler nothing.',
    verify: 'The sitemap carries a lastmod for each page and the dates differ between pages.',
  },
};

/** Порядок важности: чем раньше в списке, тем сильнее двигает результат. */
const PRIORITY = [
  'robots-all-blocked', 'robots-fetchers-blocked', 'llms-missing', 'llms-not-text', 'llms-foreign',
  'schema-org-missing', 'answer-first-missing', 'thin-pages', 'dates-missing', 'sources-missing',
  'schema-faq-missing', 'no-tables', 'few-h2', 'og-missing', 'canonical-missing',
  'schema-article-missing', 'sitemap-no-lastmod', 'noai-meta', 'noai', 'robots-training-blocked',
];

/**
 * Выбрать одну задачу: ту, что сильнее всего двигает результат.
 * @param {{fixes?: Array<{id?: string, area?: string, text?: string}>}} result
 * @returns {{id: string, area: string, now: string, task: string, verify: string, rule: string}|null}
 */
export function topTask(result) {
  const fixes = Array.isArray(result?.fixes) ? result.fixes : [];
  if (!fixes.length) return null;
  const ranked = [...fixes].sort((a, b) => {
    const ia = PRIORITY.indexOf(a.id); const ib = PRIORITY.indexOf(b.id);
    return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
  });
  for (const f of ranked) {
    const t = TASKS[f.id];
    if (t) return { id: f.id, area: f.area || '', now: f.text || '', task: t.task, verify: t.verify, rule: RULE };
  }
  return null;
}

/** Задача обычным текстом, как она уходит в письмо. */
export function renderTask(task, host) {
  if (!task) return '';
  return [
    `What to fix first on ${host}`,
    '',
    'Copy everything below and hand it to whoever looks after your site, or paste it into ChatGPT, Claude or Cursor. Keep the "Now" and "How to check" lines: without them nobody knows where to start or when it is done.',
    '',
    `Now: ${task.now}`,
    '',
    `What to do: ${task.task}`,
    '',
    `How to check: ${task.verify}`,
    '',
    task.rule,
  ].join('\n');
}

export const TASK_IDS = Object.keys(TASKS);
