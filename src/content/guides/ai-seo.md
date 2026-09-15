---
title: "AI SEO: What It Is, What Actually Decides Citations, and How to Check Your Own Site"
description: "AI SEO in practice: why an answer engine quotes one site and skips another, the five things it checks before it can quote you, how to check each of them yourself in a browser for free, and the order to fix them in."
answer: "AI SEO is the work of making a site readable, identifiable and quotable for the systems that answer questions instead of listing links. It is decided by five things a machine can check in seconds: whether your robots.txt lets the AI fetchers in, whether there is a map for them at /llms.txt, whether your markup says what you actually do, whether any paragraph is short and factual enough to quote, and whether your pages can be dated and sourced."
pubDate: 2026-09-15
updatedDate: 2026-09-15
author: Maksim Shchegolev
faq:
  - question: What is AI SEO in plain language?
    answer: "Getting your site into the answers that assistants give, instead of only into the list of blue links. The assistant fetches a handful of pages while it writes the answer, names two or three sources, and moves on. AI SEO is the work that decides whether you are one of them."
  - question: Is AI SEO different from SEO?
    answer: "It overlaps but it is not the same job. SEO earns a position in a ranked list a person then clicks. AI SEO earns a place inside a sentence the model writes, and that happens at answer time, from pages the model fetches right then. A page can rank fifth in Google and be unusable to an assistant, usually because the fetcher is blocked or the text has nothing quotable in it."
  - question: How do I check whether AI can read my site at all?
    answer: "Open yoursite.com/robots.txt in a browser and look for Disallow lines naming OAI-SearchBot, ChatGPT-User, PerplexityBot, Claude-SearchBot or Google-Extended. One Disallow: / in the all-robots block closes you to every one of them at once. This is free, takes a minute, and is the single most common reason a site is invisible."
  - question: Does llms.txt matter, or is it hype?
    answer: "It is not an official standard and no major engine has promised to read it. It is cheap to generate and it is the only file that states, in your own words, which of your pages matter. Treat it as a low-cost bet rather than a requirement, and generate it from the site rather than writing it by hand, because a hand-written map drifts within weeks."
  - question: How do I know whether any of this worked?
    answer: "Three things are measurable. Crawler access: re-read robots.txt and the response codes. Arrivals: count visits that come from chatgpt.com, perplexity.ai and claude.ai on your own site. Citations in answers: you can watch them, but never treat one run as evidence, because the same question asked twice gets different answers."
  - question: How long does it take to see a change?
    answer: "Access changes take effect as soon as the file is re-read, which can be the same day. Content changes take as long as the engines take to fetch the pages again, which is usually days to weeks. Nobody can promise a date, and anyone who does is selling something."
  - question: What is the cheapest thing I can do today?
    answer: "Read your robots.txt and unblock the answer-engine fetchers if they are blocked. It costs nothing, takes ten minutes, and it is the only item on the list that can be worth every other item combined, because everything else is invisible while the door is shut."
---

Ask an assistant which company to use, and it does not hand you a list of ten links. It fetches a few pages while it is writing, names two or three sources in the answer, and stops. Everyone else in the market is not ranked lower. They are absent.

AI SEO is the work that decides whether you are one of the two or three. It has almost nothing to do with keyword density and almost everything to do with whether a machine can open your pages, tell what you are, and find a sentence worth quoting.

## In one sentence

**AI SEO is making a site readable, identifiable and quotable for systems that answer instead of listing, and it is decided by five things a machine checks in seconds rather than by anything a copywriter argues about.**

## Why it is a different job from SEO

Search ranks pages in advance and shows a list. A person scans the list and clicks. The work is to be higher in that list.

An answer engine assembles the answer at the moment of the question. It sends a fetcher to a handful of URLs, reads what comes back, and writes a paragraph with two or three attributions. Three consequences follow, and they are the whole difference:

1. **The fetch happens live, so access is decided live.** If your `robots.txt` says no to the fetcher, nothing else about your site matters. There is no cached version of you to fall back on.
2. **The unit that wins is a passage, not a page.** The model needs a short, self-contained, checkable statement. A page that opens with the founding story has nothing to give it, however well that page ranks.
3. **Being mentioned is not being visited.** Your name inside an answer earns nothing on its own. The click follows the citation only when the citation is attached to a source the reader wants to open.

## The five things that decide it

Every check that matters falls into one of five areas. This is the same list our free check measures, and each one can be verified by hand in a browser, which is the point: nothing here needs a tool to believe it.

| Area | What it decides | How to check it yourself, free |
|---|---|---|
| **Access** | Whether the answer engines can fetch your pages at all | Open `yoursite.com/robots.txt`. Look for `Disallow` lines naming `OAI-SearchBot`, `ChatGPT-User`, `PerplexityBot`, `Claude-SearchBot`, `Google-Extended`, `CCBot`. A `Disallow: /` under `User-agent: *` closes all of them at once |
| **A map for agents** | Whether a machine can learn which of your pages matter without crawling everything | Open `yoursite.com/llms.txt`. If it returns a normal page instead of plain text, or the links in it are dead, it is worse than not having one |
| **Entity** | Whether the machine can say what you are without guessing | View source on your home page and search for `application/ld+json`. The `@type` should name what you actually do, with an address and links to the profiles that confirm it |
| **Something to quote** | Whether any passage is short and factual enough to lift into an answer | Read your own first paragraph after the H1. If it is 20 to 90 words, answers the question the page is about, and carries a figure, it is quotable. If it is a welcome message, it is not |
| **Datable and trustworthy** | Whether the engine can tell how old the claim is and where it came from | Look for a visible date on the page and `datePublished` and `dateModified` in the markup, and for a named source next to every number |

Five areas, and none of them requires a subscription to see. That is deliberate: a score you cannot reproduce is a score you cannot trust, including ours.

## The order to do it in

The cheapest fixes are also the ones that decide the most, which is unusual and worth exploiting.

1. **Open the door.** Unblock the answer-engine fetchers in `robots.txt`. Minutes of work, and while it is shut everything else is invisible.
2. **Say who you are.** One block of `Organization` markup on the home page with your real activity, address and profiles. An hour, and it is the difference between a described business and an unnamed website.
3. **Give the engine one thing to quote per page.** Rewrite the first paragraph of your five most important pages so it answers the page's question in 20 to 90 words with a figure in it. An afternoon.
4. **Date everything and name your sources.** A visible date, the two fields in markup, and a named source beside every number. A machine treats an undated claim as a claim it cannot check.
5. **Publish a map.** Generate `llms.txt` from the live pages rather than writing it once. Cheap, and it is the only place where you say in your own words which pages matter.
6. **Then look at the harder things.** Tables, question-and-answer blocks with matching markup, and pages that are currently empty without JavaScript.

## How to tell whether it worked

Three measurements, in the order of how much you can trust them.

**Access is a fact.** Read `robots.txt` again, fetch a page as a plain request and see whether the text is in the HTML. It is either open or it is not, and the answer does not vary between runs.

**Arrivals are a fact.** Visits that come from `chatgpt.com`, `perplexity.ai`, `claude.ai` and the rest are real traffic, and almost nobody counts them, because analytics either buries them among referrals or drops them into direct. Counting them on your own site is free: [our visit counter](/visits/) is one line of code and shows the assistants apart by name.

**Citations in answers vary, and honest reporting says so.** You can ask a model the questions your buyers ask and note whether you were named. What you cannot do is treat one run as a measurement: the same question asked twice, an hour apart, produces different sources. Anyone showing you a single percentage without a method and a repeat count is showing you a number they cannot defend.

## What our tool does, plainly

Our [free check](/ai-visibility/) reads your `robots.txt` against the 14 AI crawlers we track, fetches `llms.txt` and the sitemap, and reads up to five pages the way a fetcher reads them, including what only appears when scripts run. It returns a score out of 100 made of the five areas above, so you can add them up by hand and get the same number, and the one fix that moves it most, written as three lines: what is there now, what to change, how to check it worked. No signup, no card, nothing to install.

Two facts about the score that matter more than its size. **What we could not read is not counted against you**: a refused `robots.txt` is marked "not measured" and drops out of the denominator, because an unread file is not evidence of a problem. And **we publish our own number**: this site scores 100 of 100 and the Russian one 99, measured on 2026-09-15 by the same code at build time, so the number falls the day we let our own site slip.

If you want the rest of the findings rather than the first one, that is what the [paid tiers](/products/) are for, and the prices are on those pages. Nothing on this page needs them.

## What AI SEO will not do for you

It will not invent demand. If nobody asks the questions your business answers, being quotable changes nothing about your pipeline.

It will not survive a bad product page. An assistant that names you sends a person to a page that still has to do its job.

And it will not hold still. Fetcher names change, `llms.txt` may be adopted or ignored, and answer formats move under everyone. The parts of this that are safe to build on are the parts that were true before AI search existed: an open site, a stated identity, a checkable claim, a dated page.

## Where to start

Open `yoursite.com/robots.txt` right now and look for the fetcher names. That check costs nothing and answers the only question that comes before all the others. If you would rather have all five areas measured at once, [run the free check](/ai-visibility/) and read the first fix it hands you.
