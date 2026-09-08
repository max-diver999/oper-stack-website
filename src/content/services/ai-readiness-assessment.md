---
title: "AI Readiness Assessment: Free Scorecard · OperStack"
description: "A free AI readiness assessment for inbound teams: seven checks on data, handoffs and ownership that decide whether automation will help at all."
h1: "AI Readiness Assessment"
answer: "An AI readiness assessment checks whether your data, handoffs, and ownership rules can support automation before you buy any. OperStack runs seven checks and returns a written score with the two things to fix first, which is often not an AI project at all."
order: 7
cardLabel: "Free scorecard"
pubDate: 2026-09-08
scope:
  - "Capture check: does every channel emit the same payload, with consent evidence"
  - "Identity check: can two records for one company be reliably matched"
  - "Ownership check: does every record have a live owner, and every rule a fallback"
  - "Definition check: do marketing, sales, and finance count a lead the same way"
  - "Latency check: where the clock starts, where it pauses, and who watches it"
  - "Evidence check: could you reconstruct why a specific lead was handled the way it was"
  - "Decision check: does any current report actually cause a decision"
deliverables:
  - "A written score per check, with the evidence we used to reach it"
  - "The two highest-cost gaps, ranked by what they cost you rather than by effort"
  - "A short recommendation, including when the recommendation is to do nothing yet"
notIncluded:
  - "A vendor shortlist. We are not a reseller and we do not rank tools for you"
  - "A maturity model with five levels and a logo. The output is two problems and a number"
  - "Access to your production systems. Read-only exports and a call are enough"
entryPoint:
  tier: "audit"
  note: "Free. 30 to 45 minutes plus the written score afterwards."
timeline: "One call plus 3 to 5 working days for the written score"
faq:
  - question: "What does an AI readiness assessment actually measure?"
    answer: "Whether the inputs an automation would depend on are consistent enough to automate. Payload shape, identity matching, ownership, shared definitions, timing, and evidence. Model choice is not part of it, because model choice is rarely the constraint."
  - question: "Is it really free?"
    answer: "Yes, and there is no obligation afterwards. Scoping without seeing data is guesswork, so the assessment is as much for us as for you. Roughly speaking, if we cannot see the leak we cannot quote the fix."
  - question: "What if the answer is that we are not ready?"
    answer: "Then that is the answer and we say it. Usually the blocker is a capture layer emitting different field names per channel, which is a week of work and not an AI project."
  - question: "What do you need from us?"
    answer: "A read-only export of recent inbound records, a look at your form and routing configuration, and forty-five minutes with someone who knows how leads actually get worked. No production access."
  - question: "How is this different from a sales call?"
    answer: "The output is a written list you keep whether or not you hire us. If the fix is inside your existing tooling, we will tell you which setting to change rather than quote for it."
relatedGuides:
  - "inbound-lead-audit"
  - "inbound-lead-reporting"
  - "mql-sql-lead-handoff"
relatedServices:
  - "ai-automation-consultant"
  - "ai-automation-agency"
---

## Readiness is about inputs, not ambition

Teams asking whether they are ready for AI usually mean whether the technology is mature
enough. That is the wrong question. The technology is ahead of most companies' data.

The real question is whether the inputs an automation depends on are consistent. If two
channels call the same field by different names, a model will happily produce confident
nonsense from both, and you will not notice for a month.

## The seven checks, and the one that fails most

Capture, identity, ownership, definitions, latency, evidence, decisions.

Ownership fails most often. Not because nobody is assigned, but because at least one routing
rule has no fallback branch, so records matching nothing sit with no owner. Nobody sees them
because no report counts records that were never assigned.

The reconciliation that surfaces this is described in the
[inbound lead audit](/guides/inbound-lead-audit/).

## Definitions fail second

Marketing counts a lead at form submit. Sales counts it at accepted. Finance counts it at
first invoice. All three are defensible and none of them agree, so every meeting starts by
reconciling numbers instead of deciding anything.

Fixing this costs one meeting and a written definition, and it is worth more than most
automation. The acceptance side of it is in
[MQL versus SQL](/guides/mql-sql-lead-handoff/).

## When we tell you not to buy anything

If your capture layer is inconsistent, fix that first. If your reports do not cause decisions,
adding a dashboard makes it worse. If you have fewer than a few dozen inbound records a month,
the leak is small enough that a person can watch it and automation is premature.

We would rather say that in week one than sell a setup that measures well and changes nothing.
The reporting principle behind it is in
[inbound lead reporting](/guides/inbound-lead-reporting/).
