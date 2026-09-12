/** Plain-language layer for the product pages: what each product is for someone who does not write
 *  code, and who it is for. Rendered above the technical description. Every commitment here is one
 *  the owner approved on 11 September 2026; do not add delivery times, calls or support promises. */

export type PlainCopy = {
  /** Two to four sentences a site owner or marketer understands without any IT vocabulary. */
  plain: string;
  /** Who it is for, one line per person. */
  who: string[];
  /** What you do, step by step, in the words of the buyer. Optional: shown as "What you actually do". */
  youDo?: string[];
};

export const PRODUCTS_PLAIN: Record<string, PlainCopy> = {
  'ai-visibility': {
    plain:
      'Type in your website address and in ten seconds you see whether ChatGPT, Perplexity and Google\'s AI answers can read your site and quote it when someone asks a question you answer. You get a score out of 100 and the three things to fix first, in plain words. Nothing to install, no account.',
    who: [
      'A business owner who wants to know why AI assistants recommend competitors and not them',
      'A marketer who needs one number and three fixes to bring to the next meeting',
      'A developer or agency checking a site before and after a change',
    ],
    youDo: ['Paste the address of any public website', 'Read the score and the three fixes', 'Send the fixes to whoever runs the site, or order the full audit'],
  },
  gates: {
    plain:
      'The gates are an automatic proofreader for a whole website. One command reads every page and lists what should never go live: a title cut in the middle, a paragraph copied from another page with the numbers changed, an empty section, a link that leads nowhere, a figure with no source. It is free and it never sends your files anywhere.',
    who: [
      'A site owner whose pages are written by a team or by an AI tool and who wants a check before publishing',
      'A developer who wants the check in the build so bad pages cannot ship',
      'An agency that keeps several content sites and needs one standard for all of them',
    ],
    youDo: ['Open the terminal in your site folder and run one command', 'Read the table: green is fine, red says which file and which line', 'Fix the red lines, run again'],
  },
  starter: {
    plain:
      'A ready-made website you copy and fill with your own business: guides, area pages, comparisons, project cards and news, with the search and AI-visibility work already done inside. You change one settings file with your names and places, delete the example pages, add yours. It is free.',
    who: [
      'A business owner who wants a content site that brings enquiries from search and AI assistants, without paying for a custom build',
      'A marketer who needs a site where every page follows the same proven structure',
      'A developer who wants to skip two weeks of setup',
    ],
    youDo: ['Copy the project to your computer', 'Fill one settings file: your company, market, currency, contact', 'Delete the demo pages, add your own, put the site online'],
  },
  plugin: {
    plain:
      'If you write your site\'s pages with Claude Code, this add-on makes it check its own work: after every edit it runs the quality gates on that page and shows what is wrong, and it writes new pages in the answer-first shape that search engines and AI assistants quote. Free.',
    who: [
      'A site owner or marketer who writes pages with Claude Code and wants them checked before publishing',
      'A developer who maintains a content site with Claude Code',
    ],
    youDo: ['Add the OperStack marketplace to Claude Code with one command', 'Install the plugin', 'Write pages as usual; the checks run by themselves'],
  },
  'site-report': {
    plain:
      'You pay nine dollars, type the address of your site into one field, and a report arrives by email. It reads up to twenty of your pages the way a search engine and an AI read them, and tells you in plain words what they can and cannot see: which pages are too thin to quote, how much of your text disappears if scripts do not run, whether the files an AI assistant looks for exist on your site at all. Nobody reads the report for you: every number in it is measured, and the wording is assembled from those measurements.',
    who: [
      'An owner who ran the free check, saw a bad score on one page, and wants to know how bad the whole site is',
      'A marketer who needs the real numbers before asking for a budget',
      'Anyone weighing up the full audit and wanting to see the measurements first',
    ],
    youDo: ['Pay by card', 'Open the link from the email and type your site address', 'Read the PDF that arrives'],
  },
  'site-kit': {
    plain:
      'Everything one person needs to launch a content website that brings clients from Google and AI assistants, without hiring a developer or a writer. The kit finds what your market actually searches for, writes the first pages from the facts you give it, checks every page with the gates, and walks you through putting the site online and getting it into Google. You follow numbered steps; the instructions explain every word.',
    who: [
      'A business owner who wants a site that brings enquiries and is ready to spend a few evenings instead of a few thousand dollars',
      'A marketer who has to launch a content site for one market and wants the whole method, not a template',
      'A developer who wants the generator and the discovery module on top of the free starter',
    ],
    youDo: [
      'Buy the kit; the licence key and the download link arrive by email',
      'Follow the quick start: install one free program, open the terminal, copy the commands',
      'Fill the settings file with your business facts, run discovery, generate the first pages, read them',
      'Put the site online (the guide shows the free way) and submit it to Google and Bing',
    ],
  },
  'seo-audit': {
    plain:
      'You send your website address, we send back a ten-page report in plain words: what stops your site from being found in Google and quoted by AI assistants, what to fix first, what each fix costs, and a 90 day plan. Everything is written down, nothing depends on a call. You can hand the plan to any developer or ask us to do the work.',
    who: [
      'A business owner whose site does not bring enquiries and who wants to know why before spending more',
      'A marketer who needs a written plan with prices to get a budget approved',
      'An agency that wants a second opinion on a client site',
    ],
    youDo: ['Send the site address and how to reach you', 'Pay the invoice when we confirm the scope', 'Receive the PDF by email, forward the plan to whoever will do the fixes'],
  },
};

/** The founder's note, first person, shown on the products index and on every product page.
 *  Figures are the ones already published on /cases/ (organic clicks +279% month over month across
 *  13 brands, a greenfield site with organic traction within six weeks). No deal counts: the group's
 *  deals came from paid advertising and must not be attributed to search or AI. */
export const FOUNDER_STORY = {
  heading: 'Why I share this',
  paragraphs: [
    'I sell property to international buyers. It is a niche where a single advertising lead costs more than most products on this page, and where the buyer reads for weeks before writing to anyone. For years the enquiries came from paid ads. Then I built content sites that answer the questions those buyers ask, and the enquiries started arriving on their own: from Google first, then, more and more, from ChatGPT and Perplexity, which quote the pages when someone asks.',
    'The numbers are on the cases page: organic clicks up 279 percent month over month across thirteen brands in more than ten countries, and a brand-new site that reached its first organic traction within six weeks of going live. Every tool on this page is a piece of the pipeline behind those sites, stripped of my data and packaged so you can run it in your own niche: the method for finding what a market actually searches for, the page shapes that get quoted, and the checks that stop a bad page from going live.',
    'I am not a software company. I am an operator who got tired of paying for every lead, and these are the tools I use every week. If they work for you the way they work for me, tell me; if they do not, the refund is seven days and no questions.',
  ],
  signature: 'Maksim Shchegolev, founder of OperStack',
};
