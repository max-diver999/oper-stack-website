---
title: "Lead Routing Software: Setup, Rules, Fallbacks · OperStack"
description: "Lead routing configured properly: rule precedence, capacity-aware round robin, staffed fallback queues, and a log that explains every assignment."
h1: "Lead Routing Setup"
answer: "Lead routing decides who owns each inbound record. OperStack configures it in the tools you already run, with explicit rule precedence, a fallback branch on every rule, and an event log, because the expensive failure is not slow routing but records assigned to nobody."
order: 19
cardLabel: "Assignment and rules"
pubDate: 2026-09-08
scope:
  - "Rule precedence written as an ordered list, inspectable by someone non-technical"
  - "Account ownership check before any round robin, so existing relationships are respected"
  - "Capacity and availability, including holidays, so records do not queue behind an absent rep"
  - "A fallback branch on every rule, with a named default owner"
  - "Reassignment rules for what happens when the owner changes mid-cycle"
  - "Event log per record: which rules were evaluated, which matched, who was assigned"
deliverables:
  - "The rule set as a document, implementable in any tool"
  - "Working routing in your stack, with the precedence visible"
  - "A daily count of records with no owner, which should be zero"
notIncluded:
  - "Routing software licences. We configure what you own or help you choose without commission"
  - "Territory design or quota setting. We encode the model, sales leadership defines it"
  - "Routing for outbound or partner channels, unless scoped in"
entryPoint:
  tier: "setup"
  note: "Custom quote. Often the smallest engagement with the largest measurable effect."
timeline: "1 to 3 weeks"
faq:
  - question: "What is lead routing software?"
    answer: "The layer that assigns each inbound record to an owner using rules. It can be native CRM assignment, a dedicated tool, or logic in your hub. Which of those you need depends on rule complexity, not on team size."
  - question: "Do we need a dedicated routing tool?"
    answer: "Often not. Native CRM assignment plus a hub covers most cases. Dedicated tools earn their price when you need capacity awareness, complex territory logic, or speed guarantees that native assignment cannot meet."
  - question: "What is the single most common routing defect?"
    answer: "A rule set with no fallback branch. Records matching nothing sit unassigned, and no report counts them because reports are built on assigned records. Teams discover it when a customer asks why nobody called."
  - question: "How should round robin work?"
    answer: "It should check account ownership first, then availability, then capacity, then rotate. Plain rotation ignores who already owns the relationship and who is on holiday, which produces exactly the two failures it was meant to prevent."
  - question: "How fast should assignment be?"
    answer: "Fast enough that the response clock is not spent waiting for an owner. If assignment takes four minutes, that is four minutes of your response target gone before any human has seen the record."
relatedGuides:
  - "lead-routing-playbook"
  - "sla-speed-to-lead"
  - "lead-hub-vs-crm"
relatedServices:
  - "speed-to-lead"
  - "lead-management-system"
---

## The method is in the playbook, this is the build

Rule precedence, ownership models, fallback queues and retries are set out in the
[lead routing playbook](/guides/lead-routing-playbook/), which is long and complete enough to
implement from.

This page is what it costs to have us do it and what you get.

## The zero that matters

One number tells you whether routing works: records with no owner, counted daily, which should
be zero.

It is almost never zero when we arrive. There is usually one rule near the end of the chain
with no else branch, and everything that falls through lands nowhere. Because reports are built
on assigned records, nothing surfaces it.

We instrument that count first, before changing any logic, so the effect of the fix is
measurable rather than asserted.

## Precedence is a decision, not a detail

When two rules match, which wins. That question needs an answer written down and agreed by
someone with authority, because the answer decides revenue attribution and rep compensation.

Most stalled routing projects are stalled here, not on implementation. Engineering is ready and
nobody will decide whether territory beats account ownership.

## Round robin without capacity is a queue

Plain rotation assigns to the next rep in the list regardless of whether they have forty open
records or are on leave. The result looks fair in the configuration and is not fair in practice.

Availability and capacity checks turn rotation into something that survives a holiday period,
which is when the failure is most expensive because volume is often highest.

## What routing cannot fix

If reps are slow because the record arrives without context, faster assignment does not help.
If the fallback queue exists but nobody watches it, it is a slower way of losing records.

Assignment is the first link. What happens after it is covered in
[speed to lead](/guides/sla-speed-to-lead/) and the
[lead follow-up system](/guides/lead-follow-up-system/).
