---
title: "Speed to Lead: SLA Setup and Escalation · OperStack"
description: "Speed to lead implemented properly: where the clock starts and pauses, escalation before a lead goes cold, and the records nobody answered."
h1: "Speed to Lead Setup"
answer: "Speed to lead is the time between a request arriving and a real first response. OperStack defines where the clock starts and pauses, builds escalation before the target is breached, and reports the records that got no response at all, which most dashboards quietly exclude."
order: 20
cardLabel: "Response time"
pubDate: 2026-09-08
scope:
  - "Clock definition per channel: start event, pause conditions, stop event"
  - "Targets by tier and channel, set from your data rather than from a benchmark"
  - "Escalation before breach, not a report about it afterwards"
  - "Out-of-hours and weekend behaviour, defined rather than implied"
  - "Backup owner rules, including eligibility so an untrained rep does not inherit a hot record"
  - "Reporting that shows records with no first response beside average response time"
deliverables:
  - "The clock definition in writing, agreed by sales and marketing"
  - "Working escalation with a named owner per tier"
  - "A daily count of records with no first response, which is the number that matters"
notIncluded:
  - "Hiring or staffing decisions. We show where the coverage gap is, you decide how to fill it"
  - "Guaranteeing a response time. Targets are yours to staff; we build the mechanism"
  - "Changing your working hours. We define the out-of-hours path, not the roster"
entryPoint:
  tier: "setup"
  note: "Custom quote. Often bundled with routing, since assignment consumes response time."
timeline: "2 to 4 weeks"
faq:
  - question: "What is a realistic speed-to-lead target?"
    answer: "Set it from your own data, not from a study. The widely cited five-minute finding comes from research on a specific market and era. What matters is whether your target is achievable with the coverage you actually have."
  - question: "Where should the clock start?"
    answer: "At the moment the request arrives, not when a record is created or assigned. Starting it at assignment hides the routing delay, which on some stacks is the larger half of the total."
  - question: "Should the clock pause?"
    answer: "Yes, for defined conditions such as awaiting a customer reply or outside stated hours. Every pause condition must be written down, otherwise the metric becomes negotiable and stops meaning anything."
  - question: "Why report records with no response separately?"
    answer: "Average response time only counts records that got a response. A team can improve its average while the number of ignored records grows. Both numbers have to appear on the same report."
  - question: "Is faster always better?"
    answer: "Up to a point. A fast, badly informed first response can cost more than a slower one with context. The target should be fast enough to stay in the buying window, not fast enough to win a benchmark."
relatedGuides:
  - "sla-speed-to-lead"
  - "lead-follow-up-system"
  - "lead-routing-playbook"
relatedServices:
  - "lead-routing-software"
  - "ai-receptionist"
---

## The guide has the model, this page builds it

Timer definitions, escalation windows, tiering and the reporting that cannot be gamed are in
[SLA and speed to lead](/guides/sla-speed-to-lead/).

This page is the engagement: what we configure, what it costs, and where it stops.

## Most of the delay is before a human sees it

Teams measure from assignment because that is what the CRM records. The interval between the
form submit and the assignment is invisible, and on several stacks we have measured it is the
larger half.

Deduplication, enrichment, a webhook retry, a routing rule waiting on an external call. None of
that is a rep being slow, and none of it appears in a report that starts the clock at
assignment.

So the first thing we do is instrument the real start event.

## Escalate before the breach, not after

A report showing that 40 percent of records breached the target last month is an autopsy. What
changes outcomes is a trigger at 70 percent of the window that alerts a backup owner while the
record is still warm.

Escalation needs an eligibility rule attached, so a record does not land on someone who has not
been certified for that product or tier. The competency side of that is in
[sales onboarding](/guides/sales-team-onboarding-ai/).

## The number dashboards hide

Average response time is computed over records that received a response. Records that received
nothing are excluded from the denominator, which means a team can improve its average by
ignoring more records.

We put "records with no first response" on the same report, counted daily. It is uncomfortable
in week one and it is the number that moves revenue.

## Out of hours is a design decision

Every inbound team has an out-of-hours path, whether or not anyone designed it. Usually it is
voicemail and an inbox nobody reads until Monday.

Defining it explicitly, even if the answer is "capture and respond at 09:00 with a stated
expectation", beats leaving it implicit. Where volume justifies it, an
[AI receptionist](/services/ai-receptionist/) covers the window against a baseline of nothing.

## When this is not your problem

If your median response is already inside the buying window and your close rate is flat, speed
is not the constraint and this engagement will not move your number. We check that first, in
the free audit, and say so.
