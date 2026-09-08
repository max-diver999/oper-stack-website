---
title: "Lead Qualification Setup: Fit, Intent, Handoff · OperStack"
description: "Qualification wired into your stack: fit and intent separated, a confidence threshold that routes to a human, and acceptance criteria sales will actually sign."
h1: "Lead Qualification Setup"
answer: "Qualification setup means deciding what fit and intent mean for your business, encoding them separately, and routing low-confidence records to a person. OperStack builds it as an evidence contract sales agrees to, not as a score nobody can commit to."
order: 17
cardLabel: "Fit, intent, handoff"
pubDate: 2026-09-08
scope:
  - "Fit and intent defined separately, because they fail for different reasons"
  - "Evidence-based acceptance criteria, written as facts rather than a threshold score"
  - "Confidence scoring with an explicit route for records below the threshold"
  - "Rejection reason codes and a recycling loop back to marketing"
  - "A labelled evaluation set from your own records, scored before launch"
  - "One joint report both teams read, with the disagreement metric on it"
deliverables:
  - "The acceptance contract in writing, signed off by whoever runs sales"
  - "The evaluation set and measured accuracy per category"
  - "Rejection codes and the recycling rules, live in your CRM"
notIncluded:
  - "Buying intent data from third parties. We work with signals you already collect"
  - "Deciding your ICP for you. We encode the definition, we do not invent it"
  - "Guaranteeing sales will accept more leads. The contract may raise the bar, not lower it"
entryPoint:
  tier: "setup"
  note: "Custom quote. The evaluation set is built before anything is automated."
timeline: "3 to 5 weeks including the labelling work"
faq:
  - question: "Why separate fit from intent?"
    answer: "They fail differently. A perfect-fit company with no current need should be nurtured. A poor-fit company ready to buy should usually be declined. Collapsing both into one score makes those two records look identical."
  - question: "Why not just use a lead score?"
    answer: "Because sales cannot commit to a number. Two records with the same score can fail for completely different reasons. An acceptance contract listing required facts is something a sales lead will actually sign and be held to."
  - question: "What happens to low-confidence records?"
    answer: "They go to a human with the evidence attached. That is a designed outcome, not a failure. A qualification layer with no human path either guesses or drops records, and both are worse than a short queue."
  - question: "How accurate is AI qualification in practice?"
    answer: "It depends on your vocabulary, and the only honest number comes from a labelled set of your own records. Expect materially lower accuracy on ambiguous intent than on clear signals, and design the escalation around that gap."
  - question: "What if sales rejects most of what we send?"
    answer: "Then the contract is doing its job and the definition needs work, which is cheaper to discover in week three than after a quarter of arguing. Rejection reason codes are what turn that into a fixable list."
relatedGuides:
  - "ai-lead-qualification"
  - "mql-sql-lead-handoff"
  - "inbound-lead-reporting"
relatedServices:
  - "lead-routing-software"
  - "ai-sdr"
---

## The guide owns the model, this page owns the build

How fit, intent and confidence work, with the tables and the failure modes, is in
[AI lead qualification](/guides/ai-lead-qualification/). The acceptance and rejection side is in
[MQL versus SQL](/guides/mql-sql-lead-handoff/).

This page is what it costs to have it built and tested against your own records.

## A score is not a contract

The recurring failure in this category is a scoring model nobody will commit to. Marketing sends
everything above 70, sales rejects half of it, and both teams point at the model.

The fix is to stop asking sales to accept a number and start asking them to accept a set of
facts. Company size confirmed, budget signal present, named decision maker identified. Those are
checkable, and a rejection can cite which one was missing.

## Labelling comes before automating

We build the evaluation set from your records before writing any classification. A few hundred
real cases, labelled by someone who knows the business, with the hard cases deliberately
included.

Without it you cannot tell whether a change helped, and every subsequent adjustment is guesswork
dressed as iteration. Vendor accuracy figures are measured on their data, not your vocabulary.

## Rejection is data, not conflict

Every rejected record needs a reason code from a short fixed list, and every code needs an
owner. Then the argument stops being about whether lead quality is bad and starts being about
which of five specific causes accounts for most of it.

That change alone resolves most marketing and sales disputes we walk into, and it needs no
technology at all.

## Where this stops helping

If your form collects two fields and neither predicts fit, qualification has nothing to work
with, and the fix is upstream in
[website lead capture](/guides/website-lead-capture/).

If volume is low enough that a rep reads everything, a qualification layer adds latency to
records that were going to be read anyway.
