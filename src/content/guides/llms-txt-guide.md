---
title: "llms.txt: What It Is, How to Write One, and Why Most of Them Rot"
description: "A practical guide to llms.txt: what the format actually asks for, a working example, how to generate it so it cannot drift, and how to check whether the links in yours still lead anywhere."
answer: "llms.txt is a plain text file at the root of a site that lists the pages worth reading, one line each, written for programs rather than people. The format asks for one H1 naming the site, a short blockquote summary, and sections of links in the form [title](address): note. No search engine requires it and none has promised to honour it; it matters to assistants that fetch a site to answer a question, because with a map they read the right pages and without one they read whatever the HTML gives them. The common failure is not a wrong format but a stale one: nobody ever opens that URL, so dead links in it go unnoticed for months."
pubDate: 2026-09-12
updatedDate: 2026-09-12
author: Maksim Shchegolev
faq:
  - question: What is llms.txt in plain language?
    answer: "A short list of your pages, written for machines, kept at yoursite.com/llms.txt. An assistant that wants to answer a question about you reads that list instead of crawling everything, and decides from it which pages to open. It is a map, not a permission file: robots.txt controls access, llms.txt suggests what is worth reading."
  - question: Is llms.txt an official standard?
    answer: "No. It was proposed by an independent community at llmstxt.org and adopted by a number of documentation sites and tools. Google has not required it and has not promised to read it. Treat it as cheap and useful rather than as a ranking lever, and be suspicious of anyone who tells you it guarantees citations."
  - question: What does the format actually require?
    answer: "One H1 on the first line naming the site. Everything else is recommended rather than required: a blockquote summary under the heading, then sections introduced by H2 headings, each holding a list of links in the form of a markdown link with a short note after a colon. A file that is only a list of bare addresses is valid text but gives a reader no idea what is behind each link."
  - question: What is llms-full.txt?
    answer: "The companion file that carries the full text of the listed pages in one request, so a reader that wants everything does not have to fetch forty URLs. It is optional. If you publish one, generate it from the same source as the site, or it will disagree with your pages within weeks."
  - question: How do I know whether mine still works?
    answer: "Follow its links. That is the whole check, and it is the one nobody does, because the file is written once and no human opens it again. Pages get renamed, sections disappear, and the map keeps pointing at them. A free checker that fetches the file and follows its links is published at oper-stack.com/tools/llms-txt-checker/."
  - question: Should I write it by hand?
    answer: "Only if you never change the site. A hand-written map is accurate on the day it is written and drifts from then on. Generate it from the same content that builds your pages and it cannot disagree with them; the free OperStack Astro starter does this on every build."
  - question: Does llms.txt replace a sitemap?
    answer: "No. A sitemap tells a crawler every URL that exists so it can index them. llms.txt tells a reader which handful are worth reading and what is in them. They answer different questions and both are cheap to keep."
---

Ask an assistant about a company and it fetches the site before it answers. What it gets back is whatever the HTML happens to give it: a navigation menu, a cookie banner, a hero slogan, and somewhere below that the paragraph you wanted it to read. It has no idea which of your four hundred pages matters.

llms.txt is the attempt to fix that with one file: a short list of the pages worth reading, written in plain text, with a line each saying what is behind them. It costs an hour to publish and almost nothing to maintain if you generate it. Most of the ones already published are broken, and their owners do not know, because that URL is the one page on the internet nobody opens twice.

## In one sentence

**llms.txt is a plain text map of your site written for programs: one heading naming the site, a short summary, and sections of links with a line explaining each one.** No engine requires it and none has promised to honour it. It matters to assistants that fetch a site to answer a question, because with a map they read the right pages and without one they guess.

## What the format asks for

The specification at llmstxt.org is short, and only the first line is strictly required.

| Part | Required | What it is for |
|---|---|---|
| `# Name` on the first line | Yes | Tells a reader whose map this is. Without it the file is an orphan list of URLs. |
| `> One-line summary` | Recommended | The sentence an assistant quotes when it explains what your site is. Write it as if it will be read out loud, because it will. |
| `## Section` headings | Recommended | Lets a reader tell guides from products without opening anything. |
| `- [Title](address): note` | Recommended | The note is the part that decides whether the link gets opened. A bare address tells a reader nothing. |
| `llms-full.txt` beside it | Optional | The full text of those pages in one request, for a reader that wants everything at once. |

Here is a complete file that follows all of it:

```
# Isla Verde Property

> Independent buyer guides for Isla Verde: what condos cost by district, the fees at completion, and the title checks that matter.

## Buyer guides

- [Fees and taxes at completion](https://example.com/guides/fees-and-taxes-at-completion/): every fee a buyer pays, with worked examples at three prices
- [Service charges in condo buildings](https://example.com/guides/service-charges/): what the monthly charge covers and how it is set

## Districts

- [Playa Norte](https://example.com/areas/playa-norte/): prices, what is being built, who buys there
```

That is the entire format. Anything more elaborate is someone's invention.

## The three ways it goes wrong

**It does not exist.** By far the most common case. An assistant that wants a map finds a 404 and falls back to reading your HTML, which means it reads your menu and your footer alongside your answer.

**It was written by hand.** A hand-written file is correct on the day it is written. Then a page gets renamed, a section is retired, a guide moves under a new prefix, and nothing in your build notices, because the file is a static text file with no relationship to your content. Six months later a third of it points at nothing.

**It lists bare addresses.** A line that reads `- https://example.com/guides/fees/` is valid text and useless information. The reader deciding which two of your forty pages to fetch has nothing to decide on. Give every link a title and a note, and write the note for a machine that will act on it, not for a person skimming.

## Generate it, do not maintain it

The fix for drift is not discipline, it is generation. Build the file from the same content collection that builds your pages, on every deploy, and it cannot disagree with the site: a page that is renamed appears under its new address, a page set to noindex disappears from the map on the same build, a new page appears without anyone remembering to add it.

The free [OperStack Astro starter](/products/starter/) does this: `llms.txt` and `llms-full.txt` are routes that read the corpus at build time, so the map is a function of the content rather than a copy of it. Any generator that reads your sitemap will do the same job. The principle matters more than the tool: **if a human has to remember to update it, it is already out of date.**

## Check the one you have

Everything above is advice. This part is measurable, and it takes ten seconds.

Fetch your own file and follow every link in it. Count how many answer with a page, how many redirect, and how many lead nowhere. Redirects matter more than they look: each hop is a chance for a reader to give up, and a map should point at the final address.

We publish a [free llms.txt checker](/tools/llms-txt-checker/) that does exactly this: it reads the file, checks it against the format, and follows up to twelve of its links to see where each one actually goes. No account, nothing stored. The same check runs inside the [free MCP server](/products/mcp/) if you would rather ask Claude or Cursor to do it while you work.

## What it will not do for you

It will not make an assistant cite you. Nothing will: engines choose sources by their own rules and change them without notice. A map makes it likelier that the page it does read is the one you would have chosen, which is the part you control.

It will not fix a page that has nothing quotable on it. If the page a reader lands on opens with a slogan and buries the answer in the middle, a perfect map delivers a reader to a page that cannot be quoted. The map decides what gets read; the writing decides what gets used.

And it will not replace a sitemap, crawlable HTML, or internal links. It is one cheap file that removes one specific kind of guesswork.

## Where to start

If you have no file, write the ten-line version above with your five most useful pages, publish it, and generate it properly later. Ten accurate lines beat forty stale ones.

If you have one, check it before you touch it. The odds are good that the format is fine and a third of the links are not.
