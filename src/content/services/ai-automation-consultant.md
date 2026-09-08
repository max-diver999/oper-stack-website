---
title: "AI Automation Consultant: What You Get · OperStack"
description: "Working with an AI automation consultant: the artefacts you keep, how advisory differs from build work, and when a consultant is the wrong thing to buy."
h1: "AI Automation Consulting"
answer: "An AI automation consultant maps where your inbound process leaks, decides which steps are safe to automate, and writes the rules before anyone builds. OperStack sells this as advisory work with named artefacts, separate from any build we might later do."
order: 8
cardLabel: "Advisory only"
pubDate: 2026-09-08
scope:
  - "Process map with the current failure rate at each handoff, measured not estimated"
  - "Automation boundary: which steps have a testable pass condition and which do not"
  - "Rule specification: precedence, ownership, fallbacks, written to be implemented by anyone"
  - "Metric definitions, including the failure metric that sits next to each success metric"
  - "Build or buy recommendation per module, with the reasoning stated"
  - "A sequencing plan, because doing three modules at once removes attribution"
deliverables:
  - "The specification, in your vocabulary, implementable by your team or a third party"
  - "Metric definitions with named owners, so a number cannot quietly change meaning"
  - "A written recommendation that includes what not to do"
notIncluded:
  - "Implementation. That is a separate engagement, and you are free to take the spec elsewhere"
  - "Ongoing management. Advisory ends when the specification is delivered and reviewed"
  - "Tool procurement or reseller commissions. We take none, which is why the advice is separable"
entryPoint:
  tier: "audit"
  note: "Free audit first, then a fixed advisory scope if a build is not what you need."
timeline: "2 to 3 weeks for a full specification"
faq:
  - question: "What is the difference between the consultant and the agency engagement?"
    answer: "The consultant delivers a specification and stops. The agency engagement delivers running automations. Buying the first does not commit you to the second, and the specification is written so another team could implement it."
  - question: "Why would we buy advisory instead of just building?"
    answer: "When you have engineers but no agreement on the rules. Most stalled automation projects are stalled on precedence and ownership questions, not on code. Those are cheaper to settle on paper."
  - question: "Do you take commission from tools you recommend?"
    answer: "No. That is deliberate, because a recommendation that pays us is not advice. It also means we sometimes recommend a setting change in software you already own instead of anything new."
  - question: "What if the specification says we should not automate?"
    answer: "Then it says that, with the reasoning. That has happened, and it is a better outcome than a build that measures well and changes nothing."
  - question: "Can our team implement the specification?"
    answer: "That is the intent. It is written for an implementer who was not in the room, with rule order and fallback behaviour explicit rather than assumed."
relatedGuides:
  - "lead-ops-vs-revops"
  - "lead-routing-playbook"
  - "inbound-automation-roi"
relatedServices:
  - "ai-readiness-assessment"
  - "ai-automation-services"
---

## Advisory is separable on purpose

We sell the specification separately from the build because bundling them corrupts the advice.
A consultant who only gets paid if there is a build will find a build.

You can take the specification to your own engineers, to another agency, or nowhere. That is
the point of writing it for an implementer who was not in the room.

## Most projects stall on precedence, not on code

The recurring pattern: an engineering team is ready, and the project sits for two months
because nobody has decided what happens when a lead matches two rules, or who owns a record
when the assigned rep leaves.

Those are one-page decisions that need a person with authority, not a sprint. Getting them
written down is usually the highest-value fortnight in the whole programme. The shape of those
rules is in the [lead routing playbook](/guides/lead-routing-playbook/).

## Every success metric gets a failure metric

Response time looks great until you notice it only counts records that got a response. Add
"records with no first response" beside it and the picture changes.

Specifying that pair for each metric is boring, quick, and prevents a year of confident
reporting on a number that was measuring the survivors. Who owns which artefact, and where
lead ops ends and RevOps begins, is covered in
[lead ops versus RevOps](/guides/lead-ops-vs-revops/).

## When a consultant is the wrong purchase

If you already know what to build and simply lack hands, buy the build. If your volume is low
enough that one person can watch every lead, buy neither and revisit in six months.

And if the real constraint is that nobody will own the rules afterwards, no specification fixes
that. We will say so, and it will not be in a proposal.
