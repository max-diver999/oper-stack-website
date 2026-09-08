---
title: "AI Integration Services for Existing Systems · OperStack"
description: "AI integration into the CRM and forms you already run: where the model sits, what it may write, how failures surface, and when to skip it."
h1: "AI Integration Services"
answer: "AI integration means wiring a model into systems you already run, rather than replacing them. OperStack places the model behind your existing capture and CRM, scopes what it may write, and makes every call inspectable so a wrong answer can be traced instead of argued about."
order: 6
cardLabel: "Into your stack"
pubDate: 2026-09-08
scope:
  - "Integration map: where the model sits relative to capture, hub, and CRM"
  - "Contract per integration point: expected input, guaranteed output, timeout behaviour"
  - "Write scoping: which fields the model may set, and which stay human or rule driven"
  - "Idempotency and retries, so a duplicate webhook does not duplicate a record"
  - "Fallback behaviour when the model is slow or unavailable, tested before launch"
  - "Logging and alerting on the integration boundary, not only inside the model"
deliverables:
  - "Integration contracts in writing, one per boundary"
  - "Test payloads that exercise the timeout and failure branches"
  - "A monitoring view that shows the failure rate per integration point"
notIncluded:
  - "Replacing your CRM or form stack. Integration means working with what exists"
  - "On-premise model hosting. We integrate hosted models and say when that is a poor fit"
  - "Integrations we cannot test. If we get no sandbox, we will not put it in production"
entryPoint:
  tier: "setup"
  note: "Custom quote. Scope depends on how many boundaries need contracts."
timeline: "2 to 5 weeks depending on the number of systems"
faq:
  - question: "Where should the model sit in our stack?"
    answer: "Behind capture and beside the hub, not in front of the CRM. The CRM stays the system of record. The model proposes, the hub decides, the CRM stores what was decided and why."
  - question: "What happens when the model is slow or down?"
    answer: "The integration falls back to a rule or a human queue, and the record still moves. If your design has no answer to this question, an outage becomes lost leads rather than delayed ones."
  - question: "How do you stop duplicate records?"
    answer: "Idempotency keys on every write and deduplication before assignment. Webhooks retry by design, so any integration that assumes exactly-once delivery will eventually create duplicates."
  - question: "Can you integrate with our custom internal system?"
    answer: "If it has an API and we can get a sandbox, yes. If there is no sandbox, we will not put an integration into production, because the first real test would be with your live data."
  - question: "When is integration the wrong answer?"
    answer: "When the underlying data is inconsistent. Wiring a model into three systems that disagree about what a lead is produces faster disagreement. Fix the definitions first, which is cheaper than any integration."
relatedGuides:
  - "lead-hub-vs-crm"
  - "lead-attribution-inbound"
  - "website-lead-capture"
relatedServices:
  - "n8n-agency"
  - "ai-agent-development-company"
---

## Integration is a contract problem

The model is rarely the hard part. The hard part is the boundary: what exactly goes in, what is
guaranteed to come out, what happens after four seconds, and who is responsible when the shape
changes.

We write that contract per boundary, in plain language, before any code. Teams that skip it
end up debugging by reading logs from three systems that each believe they succeeded.

## The CRM stays the system of record

A common and expensive design puts the model in front of the CRM, writing records directly.
Now the CRM contains values nobody can explain, and there is no layer that remembers what was
true at the moment of capture.

The model proposes. The hub decides using inspectable rules. The CRM stores the decision and
the evidence. That boundary is the subject of
[Lead Hub versus CRM](/guides/lead-hub-vs-crm/).

## Retries are not optional

Every webhook provider retries. That is the correct behaviour on their side and a duplicate
record on yours unless you designed for it.

Idempotency keys, deduplication before assignment, and a dead letter store for payloads that
never parse. None of this is glamorous and all of it is what separates an integration that
survives a bad week from one that quietly loses a Tuesday.

## When we will tell you not to integrate

If your form, your hub, and your CRM disagree about what counts as a lead, integration makes
the disagreement faster and more visible, which feels like a regression.

The cheaper first step is a shared definition and a reconciliation count, described in the
[inbound lead audit](/guides/inbound-lead-audit/). Integration after that lands cleanly.
