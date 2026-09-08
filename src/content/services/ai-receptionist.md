---
title: "AI Receptionist and Voice Agent for Inbound · OperStack"
description: "AI receptionist and voice agent setup for inbound calls: what it answers, when it transfers, how failure sounds to a caller, and where a voicemail beats a bot."
h1: "AI Receptionist and Voice Agent"
answer: "An AI receptionist answers inbound calls, captures the caller and the reason, books or transfers, and logs the result to your CRM. OperStack sets the transfer threshold deliberately, because a bot that keeps a confused caller talking costs more than one that hands over early."
order: 12
cardLabel: "Voice and phone"
pubDate: 2026-09-08
scope:
  - "Call flow design: what the agent answers, what it captures, when it transfers"
  - "Transfer thresholds, including an immediate human path the caller can always reach"
  - "Calendar integration for booking, with rules for the slots it may offer"
  - "CRM writeback: caller, reason, outcome, and the transcript attached to the record"
  - "Out-of-hours behaviour, which is where most of the value actually sits"
  - "Evaluation on recordings of your own calls before it answers a real one"
deliverables:
  - "The call flow in writing, reviewable by someone who has never seen the tool"
  - "Measured transfer and containment rates from your own evaluation set"
  - "A kill switch that routes everything to a human, owned by a named person"
notIncluded:
  - "Outbound calling campaigns. Inbound answering only"
  - "Telephony migration. We integrate with the phone system you already run"
  - "Any commitment to a caller. Quotes, availability promises, and pricing stay human"
entryPoint:
  tier: "setup"
  note: "Custom quote. Most teams start with out-of-hours only, then extend."
timeline: "3 to 5 weeks including evaluation on real recordings"
faq:
  - question: "What can an AI receptionist reliably handle?"
    answer: "Identifying the caller, capturing why they called, answering questions your documentation already answers, booking against calendar rules, and transferring. Those have testable outcomes. Negotiation and exceptions do not."
  - question: "When should it transfer to a human?"
    answer: "Earlier than most vendors configure. Two failed intent matches, any pricing question, any complaint, and any caller who asks for a person. A bot that keeps a frustrated caller in a loop costs more than the call it saved."
  - question: "Is starting with out-of-hours a good idea?"
    answer: "Usually the best starting point. Those calls currently reach voicemail or nothing, so the comparison is against zero rather than against a good human answer. The risk of a mediocre first version is much lower."
  - question: "How do we test it before going live?"
    answer: "On recordings of your own calls, scored for whether the agent would have captured the right reason and transferred at the right moment. Vendor demos use clean audio and cooperative callers, which is not your Tuesday afternoon."
  - question: "Will callers know it is not a person?"
    answer: "They should, and we configure it to say so. Callers who discover it later report the experience worse than callers told upfront, and in several jurisdictions disclosure is a legal question you should check locally."
relatedGuides:
  - "sla-speed-to-lead"
  - "ai-lead-qualification"
  - "lead-follow-up-system"
relatedServices:
  - "ai-customer-service-agent"
  - "ai-sdr"
---

## The metric vendors quote is the wrong one

Voice vendors sell containment: the share of calls handled without a human. Containment is
easy to raise and easy to raise badly, because a caller who gives up is contained.

The number that matters is resolved contacts, plus the transfer rate at the moment the caller
first signalled confusion. A high containment rate with a rising abandon rate is a worse
outcome than a bot that transfers a third of calls cleanly.

## Out-of-hours is where the honest value is

During business hours you are comparing the agent against a person who answers. That is a hard
comparison to win and the failure is visible to a customer.

Outside hours you are comparing it against voicemail, or against nothing. Capturing the caller,
the reason, and a callback slot at 22:40 is a genuine improvement over a message nobody returns
until Thursday. Start there.

Where the response clock starts and pauses, which decides whether that callback counts as fast,
is in the [speed-to-lead guide](/guides/sla-speed-to-lead/).

## Failure has to sound like something

Text agents fail quietly. Voice agents fail out loud, to a person, in real time. That changes
the design: the fallback is not a log entry, it is a sentence the caller hears and a transfer
that actually connects.

We script the failure explicitly, test it, and make sure the transfer target is staffed. An
agent that says "let me put you through" to an unstaffed queue is worse than no agent.

## Where a voicemail still wins

Low call volume, highly technical callers, or a business where the first question is always
about price. In those cases the agent adds a layer between the caller and the answer, and a
short voicemail with a fast callback beats it.

We will tell you that on the audit call. It is a small piece of revenue for us and a large
saving for you.
