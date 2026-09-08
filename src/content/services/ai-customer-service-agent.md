---
title: "AI Customer Service Agent and Chatbot Setup · OperStack"
description: "AI support agents on your site: what they answer from your own documentation, the deflection metric that misleads, and when a good help page beats a chatbot."
h1: "AI Customer Service Agent"
answer: "An AI customer service agent answers questions from your own documentation, creates a ticket when it cannot, and hands over with the conversation attached. OperStack measures resolution rather than deflection, because deflection counts the people who gave up."
order: 13
cardLabel: "Support and chat"
pubDate: 2026-09-08
scope:
  - "Source audit: which of your documents the agent may answer from, and which contradict each other"
  - "Retrieval with source attribution, so every answer can be traced to a document"
  - "Escalation rules, including an always-available path to a person"
  - "Ticket creation with the full conversation, not a summary the agent wrote"
  - "Separation of support questions from sales intent, routed differently"
  - "Evaluation on your real conversation history before launch"
deliverables:
  - "A cleaned source set, which is often worth more than the agent"
  - "Measured answer accuracy and escalation rate per question category"
  - "Escalation and kill switch owned by a named person"
notIncluded:
  - "Writing your documentation from scratch. We audit and flag, you own the content"
  - "Refunds, credits, or account changes. The agent does not take actions with money attached"
  - "Multilingual support without a per-language evaluation. Accuracy differs by language, always"
entryPoint:
  tier: "setup"
  note: "Custom quote. Source cleanup is usually the larger half of the work."
timeline: "3 to 6 weeks, most of it on sources rather than the agent"
faq:
  - question: "Why is deflection a misleading metric?"
    answer: "Deflection counts conversations that did not reach a human. A customer who gave up and left is deflected. Measure resolution, repeat contact within seven days, and escalation rate, and the picture changes materially."
  - question: "What does the agent need to work at all?"
    answer: "Documentation that agrees with itself. If two pages state different refund windows, retrieval surfaces both and the agent picks one. That is a content problem the agent makes visible rather than causes."
  - question: "Should support and sales chat be the same agent?"
    answer: "No. The questions look similar and the routing is completely different. A pricing question from an existing customer is support, the same words from a stranger is sales, and they belong in different queues."
  - question: "How do you stop it inventing answers?"
    answer: "Retrieval with attribution plus a confidence threshold that escalates rather than guesses. You cannot eliminate confabulation, so the design goal is that a wrong answer is traceable and rare, not impossible."
  - question: "When is a chatbot the wrong answer?"
    answer: "When your top ten questions could be answered by a better help page and a search box. That fixes the same volume, costs less, and does not require an evaluation set. We check this first."
relatedGuides:
  - "ai-lead-qualification"
  - "website-lead-capture"
  - "aeo-geo-inbound-marketing"
relatedServices:
  - "ai-receptionist"
  - "ai-agent-development-company"
---

## The source set is the project

Teams budget for the agent and discover the work is in the documents. Three pages describing
the same policy differently, a help centre last reviewed two years ago, and an internal wiki
nobody told the project about.

Retrieval does not resolve contradictions, it surfaces them faster and with more confidence.
So the first phase is a source audit: what is canonical, what is stale, what disagrees.

Most clients tell us afterwards that the cleaned source set was the more valuable half.

## Deflection versus resolution

A deflection rate of 70 percent sounds like success. It counts every conversation that did not
reach a human, including the customer who asked twice, got nothing useful, and emailed your
sales address instead.

Resolution, repeat contact within seven days, and escalation rate together describe what
actually happened. We instrument those three from day one, because retrofitting them means
losing the baseline.

The general principle, that every success metric needs a failure metric beside it, is in
[inbound lead reporting](/guides/inbound-lead-reporting/).

## Support and sales are different queues

The same sentence means different things from different people. "How much is the enterprise
plan" from a logged-in customer on the billing page is support. The same words from an
anonymous visitor on the pricing page is sales, and it should reach a rep, fast.

Splitting that intent before routing is the difference between an agent that helps and one that
buries revenue in a support inbox. How that identity and intent split works is covered in
[AI lead qualification](/guides/ai-lead-qualification/).

## The cheaper alternative we check first

If your top ten questions are answerable by one well-written page and a working search box,
build that. It handles the same volume, needs no evaluation set, no escalation design, and no
monitoring.

We check this before quoting, and often enough it is the recommendation.
