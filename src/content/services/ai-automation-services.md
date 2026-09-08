---
title: "AI Automation Services: Scope, Price, Timeline · OperStack"
description: "AI automation services priced by handoff, not by seat: what is in scope, how long a first working layer takes, and the failure modes to test first."
h1: "AI Automation Services"
answer: "AI automation services replace manual steps between systems: capture, enrichment, qualification, assignment, follow-up, and reporting. OperStack scopes each step separately, so you can buy the two that leak and skip the four that already work."
order: 2
cardLabel: "Scope, price, timeline"
pubDate: 2026-09-08
scope:
  - "Capture normalisation: one payload shape from every channel, with consent evidence attached"
  - "Enrichment and deduplication before assignment, not after"
  - "Qualification with a confidence threshold and a documented human fallback"
  - "Assignment rules, round robin with capacity, and a fallback queue that is actually staffed"
  - "Follow-up sequences with stop rules and writeback to the CRM record"
  - "A live report per module, showing the failure metric alongside the success metric"
deliverables:
  - "Per-module runbook: what it does, what it skips, how to turn it off"
  - "Test fixtures for each automation, so a change can be verified before release"
  - "Event log schema, so a missing lead can be traced end to end"
notIncluded:
  - "Cleanup of historical records. We fix the intake, not the archive, unless scoped separately"
  - "Custom model training. We use hosted models and say when a task is beyond them"
  - "Guaranteed conversion uplift. Automation removes leakage, it does not create demand"
entryPoint:
  tier: "setup"
  note: "Custom quote. Typical scope is Lead Hub plus three to five modules."
timeline: "2 to 4 weeks per module, run in parallel where data allows"
faq:
  - question: "What is included in AI automation services?"
    answer: "Capture, enrichment, deduplication, qualification, routing, follow-up, and reporting. Most teams need two or three of those, not all seven. The audit decides which, based on which handoff loses the most records."
  - question: "How is AI automation priced?"
    answer: "By scope, not by seat. Each module is quoted separately after the audit, because a routing rebuild on clean data and the same rebuild on data with no owner field are different jobs."
  - question: "How long before something is live?"
    answer: "Two to four weeks per module when the source data is already consistent. Longer when the capture layer emits different field names per channel, which is the most common delay."
  - question: "What breaks most often after launch?"
    answer: "Rules that had no fallback branch. A record matching no rule needs a default owner, otherwise it sits unassigned and nobody sees it. That single gap accounts for most of the leads teams call lost."
  - question: "Can we start with one module?"
    answer: "Yes, and usually you should. One module with a working event log teaches you more about your funnel than five launched together, because you can attribute the change."
relatedGuides:
  - "crm-automation-inbound"
  - "lead-routing-playbook"
  - "inbound-automation-roi"
relatedServices:
  - "ai-automation-agency"
  - "ai-automation-consultant"
---

## Buy the leak, not the platform

Vendors sell platforms, and platforms are priced per seat. That means cost scales with your
headcount rather than with the problem. A team of forty with one broken handoff pays forty
times over for one fix.

Scoping by handoff inverts that. You pay for the capture rebuild because capture is where
records disappear, and you do not pay for qualification because your two-field form already
tells a model everything it could infer.

## The order that actually works

Deduplicate before you assign. Assign before you score. Score before you sequence.

Teams routinely run this backwards: score a record, route it, then discover it duplicates an
account another rep already owns. Now two reps have contacted the same company with different
offers, and the CRM holds two histories that will never be merged.

That dependency chain is covered in
[CRM automation for inbound leads](/guides/crm-automation-inbound/).

## Why the audit is free

Scoping without seeing data is guesswork, and guesswork gets priced defensively. Once we can
count how many records arrive, get created, get an owner, and get worked, the quote reflects
the real job rather than our uncertainty.

How to turn that into a model your finance team will accept is in
[the automation ROI guide](/guides/inbound-automation-roi/).

## What we will not promise

We will not promise a conversion rate. Automation reduces leakage between steps, which raises
the ceiling on conversion, but it does not turn an unqualified visitor into a buyer.

If the honest answer after the audit is that your funnel converts fine and your problem is
traffic, we will say so, and this page will have cost you nothing.
