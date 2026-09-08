---
title: "AI SDR: What It Does and What Stays Human · OperStack"
description: "An AI SDR handles research, first touch, and reply triage. It does not handle objections or pricing. Task by task, with the conditions where each one degrades."
h1: "AI SDR Setup"
answer: "An AI SDR automates research, first-touch drafting, reply classification, and meeting booking. It does not handle pricing negotiation, unusual objections, or anything requiring a commitment. OperStack sets the boundary per task and tests each one on your own data before it goes live."
order: 4
cardLabel: "AI SDR, task by task"
pubDate: 2026-09-08
scope:
  - "Task split: which SDR steps are automated, which are assisted, which stay fully human"
  - "Research and enrichment before first touch, with sources logged per record"
  - "First-touch drafting with a review gate until accuracy is measured, not assumed"
  - "Reply classification into interested, not now, wrong person, and unsubscribe"
  - "Meeting booking with calendar rules and a fallback when no slot fits"
  - "Escalation: what reaches a human immediately, and how fast"
deliverables:
  - "A written task boundary, so nobody has to guess what the bot is allowed to say"
  - "A labelled evaluation set from your own inbox, with measured accuracy per task"
  - "Escalation rules and a kill switch with a named owner"
notIncluded:
  - "Cold outbound list buying or scraping. We work on inbound and existing lists you own"
  - "Autonomous pricing or discount decisions. That stays human, without exception"
  - "Replacing your SDR team. The task split usually redistributes work rather than removing it"
entryPoint:
  tier: "setup"
  note: "Custom quote. Most teams start with reply triage before first-touch drafting."
timeline: "3 to 6 weeks including the evaluation period"
faq:
  - question: "What can an AI SDR reliably do today?"
    answer: "Research and enrich records, draft a first touch, classify replies into a few buckets, and book meetings against calendar rules. These have testable pass conditions, which is why they hold up."
  - question: "What should an AI SDR never do?"
    answer: "Negotiate price, handle an unusual objection, or make any commitment on your behalf. Those need a person who can be held to the answer, and a wrong answer is expensive and hard to detect."
  - question: "How do you test a vendor's AI SDR claims?"
    answer: "On your own data, not their demo. Label a few hundred real replies, run the classifier, and measure accuracy per bucket. Vendor benchmarks are directional at best and rarely match your vocabulary."
  - question: "Does the AI SDR reply without a human first?"
    answer: "Not at the start. Drafts go through a review gate until measured accuracy justifies removing it. Teams that skip that step discover the error rate through customers, which is the expensive way."
  - question: "Will this reduce our SDR headcount?"
    answer: "That is your decision, not an outcome we promise. What changes is the mix: less research and triage, more conversations that needed a person. Whether that means fewer people depends on your pipeline."
relatedGuides:
  - "ai-sdr-vs-human-sdr"
  - "ai-lead-qualification"
  - "sla-speed-to-lead"
relatedServices:
  - "ai-lead-qualification"
  - "ai-agent-development-company"
---

## The task split is the whole engagement

"AI SDR" names a bundle, and bundles hide the important question: which task, under which
conditions. Research is close to solved. Reply classification works well on common intents and
degrades on ambiguous ones. Objection handling is not close.

We take your actual SDR workflow, list the steps, and mark each one automated, assisted, or
human. The list is short and boring and it is what makes the rest work.

The task by task breakdown is in
[AI SDR versus human SDR](/guides/ai-sdr-vs-human-sdr/).

## Test on your data, not their demo

Every vendor demo works. It works because the examples were chosen. Your inbox contains
replies in your customers' vocabulary, with your product names and your edge cases.

The only test that predicts production is a labelled set from your own inbox, scored per
bucket. Expect the accuracy on "not now" versus "interested" to be materially worse than on
"unsubscribe", and plan the escalation around that gap.

## Confidence is a routing input, not a score to admire

A classification with 62 percent confidence should not be treated the same as one with 95.
Below the threshold the record goes to a human with the draft attached, and that is a success
condition, not a failure.

How to separate fit from intent and where the handoff sits is covered in
[AI lead qualification](/guides/ai-lead-qualification/).

## The limit worth stating plainly

If your reps are slow to reply because they are busy, an AI SDR helps. If they are slow
because nobody owns the queue overnight, the fix is a routing rule and a fallback owner, which
is cheaper and more reliable than a model.

The [speed-to-lead guide](/guides/sla-speed-to-lead/) covers how to tell those two apart before
you buy anything.
