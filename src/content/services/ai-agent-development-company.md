---
title: "AI Agent Development Company: Scope and Limits · OperStack"
description: "Custom AI agents for lead operations: what an agent should own, how tool access is scoped, how failure is handled, and what you keep afterwards."
h1: "AI Agent Development"
answer: "AI agent development means building a bounded assistant that reads your data, calls a small set of approved tools, and hands off when confidence drops. OperStack builds agents for inbound tasks only, with every tool call logged and a documented failure path."
order: 5
cardLabel: "Custom agents"
pubDate: 2026-09-08
scope:
  - "Agent charter: the one job it owns, and the jobs explicitly out of bounds"
  - "Tool scoping: exactly which systems it may read, which it may write, and under what conditions"
  - "Retrieval over your own content, with source attribution on every answer"
  - "Confidence thresholds and a handoff path that carries context to the human"
  - "Full call logging, so any answer can be reconstructed after the fact"
  - "Evaluation set built from your real cases, run before and after every change"
deliverables:
  - "The agent running in your environment, with credentials you control"
  - "Its charter and tool permissions in writing, reviewable by someone non-technical"
  - "An evaluation set and scores, so the next change can be compared to this baseline"
notIncluded:
  - "Agents with unbounded write access to production systems. We scope writes narrowly, always"
  - "Fine-tuning a foundation model. We use hosted models with retrieval, and say when that is not enough"
  - "Agents that make commitments to customers. Quotes, discounts, and promises stay human"
entryPoint:
  tier: "setup"
  note: "Custom quote. A single well-scoped agent is a smaller engagement than a full stack setup."
timeline: "4 to 8 weeks including evaluation"
faq:
  - question: "What is an AI agent, in practical terms?"
    answer: "A bounded program that reads context, decides which of a few approved tools to call, and either completes a task or hands off. The boundary is the product. An agent with unlimited tools is not an agent, it is an incident waiting to happen."
  - question: "What should the first agent do?"
    answer: "One job with a testable pass condition and a cheap failure. Reply triage, enrichment, or answering questions from your own documentation. Not pricing, not scheduling around exceptions, not anything a customer would quote back at you."
  - question: "How do you stop an agent from inventing answers?"
    answer: "Retrieval with source attribution, plus a confidence threshold that routes uncertain cases to a person. You cannot eliminate confabulation, so you design for detecting it rather than for preventing it entirely."
  - question: "What happens when the agent gets it wrong?"
    answer: "The call log shows what it read, which tool it called, and what it returned. Without that log a wrong answer is unfixable, which is why logging is scoped in from the start rather than added after the first incident."
  - question: "Do we own the agent afterwards?"
    answer: "Yes. It runs in your environment on your credentials, and the charter, prompts, tool definitions, and evaluation set are yours. There is no lock-in through hosting."
relatedGuides:
  - "ai-lead-qualification"
  - "lead-hub-vs-crm"
  - "aeo-geo-inbound-marketing"
relatedServices:
  - "ai-sdr"
  - "ai-integration-services"
---

## The charter is the product

Most failed agent projects failed at the charter, not the model. Somebody scoped "an assistant
for the sales team", which is not a job, and six weeks later it does five things badly and
nobody can say whether it works.

We start by writing one sentence: this agent owns X, and explicitly does not own Y or Z. If
that sentence is hard to write, the project is not ready, and we say so before quoting.

## Tools are permissions, not features

Every tool an agent can call is a permission you granted. Read access to your knowledge base
is cheap. Write access to CRM records is not, because a confident wrong write is harder to
detect than a missing one.

We scope writes narrowly, log every call, and default to proposing rather than executing where
the reversal cost is high. Where the boundary between agent and system of record should sit is
covered in [Lead Hub versus CRM](/guides/lead-hub-vs-crm/).

## Evaluation before deployment, and after every change

An agent without an evaluation set cannot be improved, only fiddled with. You change a prompt,
it feels better, and you have no idea what it broke.

We build the set from your real cases before writing the agent, score against it, and rerun on
every change. The score is not a marketing number. It is the thing that tells you whether
today's edit was an improvement.

## Where agents genuinely do not help

If the task has no clear pass condition, an agent produces confident output nobody can check.
If your source content is contradictory, retrieval surfaces the contradiction faster, which is
useful, but it is a content problem and not an agent problem.

And if the answer changes by customer, by contract, or by month, the honest recommendation is
a better internal document first, and an agent on top of it later.
