---
title: "AI Implementation Services: Roadmap and Scope · OperStack"
description: "AI implementation for inbound operations: a sequenced roadmap with an exit test per step, honest failure rates, and why most implementations stall."
h1: "AI Implementation Services"
answer: "AI implementation is the work between deciding to automate and having something running that people trust. OperStack sequences it with an exit test per step, so each release can be judged on its own, and stops the programme early when a step fails its test."
order: 11
cardLabel: "Roadmap and delivery"
pubDate: 2026-09-08
scope:
  - "Sequenced roadmap with an exit test per step, agreed before any build starts"
  - "Data readiness work: consistent payloads, identity matching, owner fields populated"
  - "Implementation of each step in your environment, on your credentials"
  - "Evaluation against a set built from your real cases, run before and after each release"
  - "Rollback path per step, with a named owner permitted to use it"
  - "Handover documentation written for whoever inherits this after us"
deliverables:
  - "The roadmap, with exit tests, usable even if you implement it yourself"
  - "Working steps in production, one at a time, each independently reversible"
  - "Evaluation sets and scores, so the next change has a baseline to beat"
notIncluded:
  - "Enterprise programme management across departments. We implement one process"
  - "Procurement, vendor negotiation, or licence management"
  - "Guaranteed outcomes. We guarantee the exit tests are honest, not that they all pass"
entryPoint:
  tier: "setup"
  note: "Custom quote after the audit. Priced per step, so you can stop between steps."
timeline: "6 to 12 weeks for a full sequence, 2 to 4 weeks per step"
faq:
  - question: "Why do most AI implementations stall?"
    answer: "Two reasons in our experience. The data was less consistent than the plan assumed, and nobody was named as the owner of the rules after launch. Both are visible before the build starts if anyone looks."
  - question: "What is an exit test?"
    answer: "A number agreed before the step is built that decides whether it worked. Without one, every release is judged by whether it feels better, and programmes continue past the point where they stopped adding value."
  - question: "Can we stop halfway?"
    answer: "Yes, and the pricing is per step for that reason. Each step is independently reversible and leaves you with something working. A programme you cannot exit is a programme that keeps going for the wrong reasons."
  - question: "Do you need access to production?"
    answer: "Eventually yes, on credentials you issue and can revoke. Early phases run on exports and a sandbox. We do not ask for broad admin access, and you should be sceptical of anyone who does."
  - question: "What if a step fails its exit test?"
    answer: "We stop, report why, and either fix the underlying cause or recommend abandoning that step. Continuing past a failed test is how programmes end up delivering a lot of work and no measurable change."
relatedGuides:
  - "lead-ops-stack"
  - "inbound-automation-roi"
  - "inbound-lead-audit"
relatedServices:
  - "ai-readiness-assessment"
  - "ai-automation-services"
---

## Implementation is mostly sequencing

The technical work in a typical inbound automation is not hard. What decides the outcome is
the order, and whether anyone agreed what "done" means before starting.

We sequence so each step has an exit test and a rollback. That constrains us usefully: we
cannot claim a step worked because the demo looked good, and you can stop between any two steps
with something running.

## Data readiness is the invisible half

Plans assume the capture layer emits consistent payloads. It usually does not. Three channels,
three field names for the same thing, one of them optional, and the automation downstream now
has to guess.

Fixing that is unglamorous and it is frequently the entire difference between an implementation
that lands and one that produces confident nonsense. The checks that surface it are in the
[inbound lead audit](/guides/inbound-lead-audit/).

## The exit test, in practice

Before building the routing step, we agree the number: records with no owner after twenty-four
hours drops below a stated threshold. After release we measure it. If it did not move, the step
failed, and we say so rather than adding a dashboard that shows something else improving.

This is the discipline that most distinguishes an implementation from a project. The economics
behind choosing which tests matter are in
[inbound automation ROI](/guides/inbound-automation-roi/).

## Why we price per step

A fixed-price programme creates an incentive to finish the plan rather than to stop when the
value runs out. Per-step pricing means we have to justify the next step on the result of the
last one.

It also means you can take the roadmap and implement the rest internally, which some clients
do after two or three steps, and that is a reasonable outcome rather than a lost sale.

## Where implementation is the wrong purchase

If nobody will own the rules after handover, the implementation degrades within two quarters.
If the process is still being argued about internally, build a specification first, which is
sold separately as [AI automation consulting](/services/ai-automation-consultant/).
