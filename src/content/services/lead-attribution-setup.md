---
title: "Lead Attribution Setup and Revenue Join · OperStack"
description: "Attribution wired end to end: original and latest source captured at intake, identity stitched, and a revenue join your finance team will actually accept."
h1: "Lead Attribution Setup"
answer: "Attribution setup means capturing source at the moment of intake, keeping it immutable, and joining it to revenue in a way finance accepts. OperStack builds the capture and the join, and states plainly which questions attribution cannot answer."
order: 21
cardLabel: "Source to revenue"
pubDate: 2026-09-08
scope:
  - "Source capture at intake: original and latest, written once and never overwritten"
  - "UTM governance: a naming standard and validation that rejects malformed values"
  - "Identity stitching across sessions, forms, and known contacts"
  - "Offline and referral sources captured deliberately rather than dropped into direct"
  - "Revenue join at the account level, reconciled against finance figures"
  - "A stated list of what the model cannot attribute, published with the report"
deliverables:
  - "The attribution model in writing, including its known blind spots"
  - "Validated UTM standard with enforcement at intake"
  - "A revenue join that reconciles to finance within an agreed tolerance"
notIncluded:
  - "Multi-touch attribution modelling with fractional credit. We can build it and we will argue against it first"
  - "Replacing your analytics platform"
  - "Attributing offline conversations nobody logged. No model recovers unrecorded data"
entryPoint:
  tier: "setup"
  note: "Custom quote. The join is usually harder than the capture."
timeline: "3 to 5 weeks"
faq:
  - question: "Original source or latest source?"
    answer: "Both, captured separately at intake and never overwritten. Original answers what created awareness, latest answers what triggered this action. Teams that keep only one end up arguing about which question the number answers."
  - question: "Why does so much traffic show as direct?"
    answer: "Usually stripped referrers, app-to-browser transitions, and missing UTMs on internal campaigns. Direct is often a bucket for capture failures rather than genuine direct navigation, and the fix is at intake."
  - question: "Should we do multi-touch attribution?"
    answer: "Rarely. Fractional credit models assign percentages nobody can defend and finance will not accept. First and last touch, stated honestly with their limits, cause better decisions than a weighted model that looks precise."
  - question: "How do we make finance accept the numbers?"
    answer: "Join at the account level to closed revenue they already recognise, reconcile to their figure, and publish the difference. A join that does not reconcile will be dismissed, correctly, on its first appearance in a meeting."
  - question: "What can attribution never tell us?"
    answer: "Whether the channel caused the outcome. It records the path, not the counterfactual. Publishing that limitation alongside the report prevents the budget conversation from treating correlation as proof."
relatedGuides:
  - "lead-attribution-inbound"
  - "inbound-lead-reporting"
  - "website-lead-capture"
relatedServices:
  - "lead-management-system"
  - "marketing-automation-agency"
---

## The method is in the guide, this is the implementation

How original and latest source work, UTM rules, identity stitching and the revenue join are set
out in [inbound lead attribution](/guides/lead-attribution-inbound/).

This page describes having it built, and the honest boundaries.

## Capture once, at intake, and never overwrite

Source belongs on the record at the moment of creation, written as two immutable fields.
Analytics tools can rewrite session attribution retroactively. The record of what was true when
the person raised their hand should not change.

Teams that let the CRM overwrite source on the latest touch discover months later that every
old record now credits the retargeting campaign that reached them last week.

## Direct is usually a capture failure

When a large share of inbound shows as direct, the cause is rarely people typing the URL. It is
stripped referrers, links from apps, and internal campaigns without UTMs.

That is fixable at intake with a UTM standard and validation that rejects malformed values
rather than silently accepting them. It is unglamorous and it recovers more attributable volume
than any modelling.

The payload side is in [website lead capture](/guides/website-lead-capture/).

## The join is the hard part

Capture is a week. The join to revenue is where projects stall, because marketing joins on
contact and finance recognises revenue on account, and the two do not reconcile.

We join at account level, reconcile against the finance figure, and publish the gap. A number
that does not reconcile will be dismissed in its first meeting, and correctly so.

## Say what the model cannot answer

Attribution records the path. It does not establish that the channel caused the outcome, and no
amount of modelling turns a recorded sequence into a counterfactual.

We publish that limitation with the report. It sounds like a weakness and it is what stops the
budget conversation treating a correlation as proof, which is the failure mode that discredits
attribution work entirely.

## Where we argue against the brief

Teams ask for multi-touch with fractional credit. We will build it if you insist, and we will
say first that assigning 30 percent of a deal to a webinar is a number nobody can defend when
challenged.

First and last touch, published with their limits, cause better decisions than a weighted model
that looks precise and is not.
