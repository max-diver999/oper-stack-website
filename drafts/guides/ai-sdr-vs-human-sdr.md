---
title: "AI SDR vs Human SDR: Task Split, Limits, and Testing"
description: "What an AI SDR really does today, task by task, the conditions where each task degrades, how to test a vendor on your own data, and what stays human."
pubDate: 2026-08-21
author: Maksim Shchegolev
faq:
  - question: What is an AI SDR?
    answer: "An AI SDR is a product that automates a bundle of sales development tasks: first response, structured qualification dialogue, meeting scheduling, follow-up sending, note taking, and CRM writes. The persona framing is marketing. Buy it as a set of tasks with named conditions, because that is the only framing you can test before you sign."
  - question: Can AI replace sales development reps?
    answer: "It can absorb the repeatable parts of the role: instant first response, the same qualification questions every time, scheduling, and record keeping. It degrades on ambiguous fit, commercial exceptions, unhappy buyers, and multi-month relationships. Teams that keep reps and give them the automated layer usually get more out of it than teams that plan a swap."
  - question: Should AI talk to inbound leads first?
    answer: "Usually yes, because the buyer started the conversation and expects an immediate answer. The risk is contained if the agent answers only from an approved source set and escalates when it cannot confirm something. Outbound is different: nobody asked for the message, so a wrong or misleading first contact costs you more than the delay would have."
  - question: How do you test an AI sales agent before buying?
    answer: "Build a test set from your own transcripts, add the cases your reps find hard, label the correct outcome for each before the demo, and agree written pass conditions with the vendor. Then run the set in a sandbox against real conversation text rather than watching a scripted walkthrough of a happy path."
  - question: How do you evaluate an AI SDR vendor?
    answer: "Ask which tasks run without a human today, what happens on low confidence, whether you can run your own cases before signing, what the product writes into CRM and how to roll it back, and what disclosure the buyer sees. Treat any vendor performance number as vendor evidence until it is reproduced on your data."
  - question: What are the risks of AI sales agents?
    answer: "The costly ones are quiet: silent disqualification of a segment nobody notices, a confident wrong answer about price or capability, and an escalation path that reaches an unwatched queue. Each of these looks healthy in a funnel report, because the buyers who left do not appear anywhere in it."
  - question: Should you buy an AI SDR or build on your CRM?
    answer: "Buy when you need one channel working quickly and your requirements are ordinary. Build when your routing, fields, and qualification rules are unusual and already documented, since CRM platforms ship assignment and pipeline automation you may already own. Hire when the bottleneck is judgment and relationships rather than response volume."
---

**AI SDR** products are sold as a person you do not have to employ. That framing is the reason so many evaluations go wrong. A person is hired against a role description and judged on results after a quarter. A product is bought against a task list and should be judged on evidence before the contract is signed.

This guide covers the buying decision and the division of labor between an automated layer and your reps. How qualification is actually implemented, scored, tested, and rolled back belongs to [AI lead qualification](/guides/ai-lead-qualification/), which is the implementation counterpart to this page. Read this one to decide what to buy. Read that one to build and operate what you bought.

## In one sentence

**An AI SDR is a bundle of automated tasks, not a person: it reliably handles first response, structured qualification dialogue, note taking, and follow-up scheduling, degrades on judgment, objection handling, and anything requiring commitment, and is worth buying only after you can test it against your own hard cases.**

## What does "AI SDR" actually mean today?

The label covers products with very different scopes. Some are a conversational layer on inbound channels. Some are outbound sequencers with a language model writing the copy. Some are a research and enrichment tool with a chat interface bolted on. The category name does not tell you which one you are looking at, and vendor demos rarely make the boundary visible, because the demo runs on a happy path the vendor chose.

Two claims recur in the market and both need translating before you can evaluate anything.

"It replaces a headcount" is a pricing argument dressed as a capability claim. The honest version is that the product performs some tasks a rep performs, at a different reliability profile, under conditions you have to state. We do not publish headcount equivalence or payback numbers here, and neither should a vendor without showing the workings on your data. Cost modelling belongs to [inbound automation ROI](/guides/inbound-automation-roi/).

"It books meetings autonomously" usually means it can send a scheduling link and write the resulting event into your calendar. Whether the meeting is with the right person, at the right stage, on a real requirement, depends entirely on the qualification rules underneath it. A booked meeting is not a qualified meeting, and a product measured on bookings will happily give you the first without the second.

The useful question is never "is this an AI SDR". It is "which of these eight tasks does this product do today, and under what conditions does each one stop working".

## Task by task: what works, what degrades, and when

This is the core of the evaluation. Every task below is genuinely performed by products on the market. Every task below also has a condition under which its output stops being trustworthy. The condition is the thing to write into your test plan.

| Task | What generally works | What degrades | Condition that triggers degradation |
| --- | --- | --- | --- |
| Research and enrichment | Firmographics from a matched domain, public role and headcount ranges | Company identity, current tech, funding state, who actually decides | Free-domain email, holding structures, recent rename, thin public footprint |
| First response | Instant acknowledgement plus a substantive first answer from approved sources | Answers to questions outside the source set | The buyer asks something the approved documents do not cover |
| Qualification dialogue | The same structured questions asked every time, evidence captured verbatim | Reading intent behind indirect or polite phrasing | Second language, terse replies, contradictions inside one conversation |
| Meeting booking | Slot offer, calendar write, reminder, reschedule | Choosing whether a meeting is the right next step at all | Enthusiastic buyer with poor fit, or a request that needs a specialist |
| Follow-up sequencing | Timed sending, channel respect, stop on reply | Judging when to stop entirely, and when silence means no | Deal already lost offline, buyer told a rep no, account under negotiation |
| Objection handling | Restating documented positions, offering a human | Anything requiring a concession, comparison, or new argument | Pricing pushback, competitor comparison, contractual or security objections |
| Note taking | Structured field capture and a summary with quotes attached | Separating what was said from what the model concluded | Long calls, several speakers, implied commitments, hedged language |
| CRM hygiene | Writing agreed fields on an agreed contract, deduplicating on strong keys | Deciding which conflicting value is correct | Two systems own the same field, or a partial record overwrites a full one |

### Research and enrichment

This is the most reliable task in the list, and the one whose failures are quietest. A corporate domain resolves to a company record with useful accuracy. A free mail domain resolves to nothing, which the product will often present as an empty field rather than as an unresolved identity, and a rep reading an empty field assumes the company is small. Insist that unresolved is a stored value, not a blank.

### First response

Speed here is real and measurable, and it is the strongest single argument for the category. A [2011 Harvard Business Review audit of 2,241 companies](https://hbr.org/2011/03/the-short-life-of-online-sales-leads) found a median first response of about 42 hours among firms that responded at all. The [original MIT and InsideSales lead response study](https://www.onecavo.com/wp-content/uploads/2015/11/MIT-InsideSales.com_Lead-Response-Management.pdf) compared contact and qualification odds inside its own 2007 dataset as call delay grew, not conversion today. Both are old and directional. They establish that avoidable delay is expensive, not that any specific number is your target. Timer definitions and escalation are owned by [SLA and speed to lead](/guides/sla-speed-to-lead/).

### Qualification dialogue

Products ask the questions consistently, which is more than most rosters manage on a Friday afternoon. The failure is interpretive: a buyer who says "we are just looking at options for next year" may be a serious evaluator with a budget cycle or genuinely idle, and the same sentence can mean either. What you should require is that the interpretation and the quote behind it are stored separately, so a rep can disagree with the read without losing the fact. How to score fit, intent, and confidence, and how to move thresholds when the read is wrong, belongs to [AI lead qualification](/guides/ai-lead-qualification/).

### Meeting booking

The mechanics are solved. The judgment is not. A product optimised for bookings will book a call with a buyer whose fit is weak, because refusing to book is a decision that requires knowing your commercial policy. Put the rule in your own layer: which outcomes are allowed to reach the calendar, and which get an honest redirect instead. That boundary is part of the [MQL to SQL handoff](/guides/mql-sql-lead-handoff/) definition, not a setting inside a chat prompt.

### Follow-up sequencing

Sending on a schedule is trivial. Stopping is the hard part, and it is where automated follow-up damages accounts. The agent does not know that a rep had a phone call in which the buyer said no, unless that call produced a record. Sequences that keep messaging a closed opportunity are the most common complaint operators report after switching this on. Cadence design, channel mix, and stop conditions belong to the [lead follow-up system](/guides/lead-follow-up-system/).

### Objection handling

An agent restating a documented position is useful. An agent inventing a rebuttal is a liability, and the tone of a language model makes an invented rebuttal sound more authoritative than a hedged human one. Keep pricing, contract terms, security commitments, and competitor comparisons out of the agent until a named person owns the source text and a review date sits on it.

### Note taking

Summaries drift in one direction. A buyer's "we might look at this in the autumn" becomes "interested, timeline autumn" and then, two hands later, "autumn opportunity". Nothing in that chain is a lie and the end state is fiction. The structural defence is that the summary shows the quote next to the interpretation and the transcript stays one click away.

### CRM hygiene

Field writes are reliable when the contract is explicit and destructive when it is not. The specific failure is a partial record overwriting a complete one, because the agent captured a phone number and nothing else on a second touch. Never let a blank overwrite a value. Field ownership, deduplication order, and stage transitions belong to [CRM automation for inbound teams](/guides/crm-automation-inbound/).

## Why inbound and outbound have different risk profiles

Treating these as one purchase is the second most common evaluation mistake, after the persona framing. The buyer's relationship to the conversation is inverted, and so is the cost of being wrong.

| Dimension | Inbound | Outbound |
| --- | --- | --- |
| Who started it | The buyer, with a stated request | You, uninvited |
| Cost of a wrong first reply | Recoverable, the buyer usually asks again | Often terminal, and sometimes public |
| Consent basis | Usually present through the request itself | Must be established separately, per channel and market |
| Tolerable latency | Seconds to minutes | Hours or days, nobody is waiting |
| Dominant failure | Confident wrong answer, silent disqualification | Volume without relevance, brand damage, channel blocks |
| Automate first | First response, qualification dialogue, scheduling | Research and list hygiene, not the message itself |
| Disclosure sensitivity | Moderate, the buyer expects a fast automated ack | High, an unrequested message that hides its origin is the worst case |

The practical conclusion is asymmetric. On inbound, automation buys you speed on a conversation that already exists, and the containment strategy is the approved source set. On outbound, automation mostly buys you volume, and volume is the thing that was never the constraint. If you are evaluating one product for both motions, evaluate it twice, with two test sets and two sets of pass conditions.

## What has to stay human, and why

This is not a philosophical list. Each row is work where the automated output is either unverifiable or binding, which are the two properties that make automation expensive.

| Work | Why it stays human | What automating it produces |
| --- | --- | --- |
| Commercial exceptions and pricing | Creates an obligation you have to honour | A quoted number you did not authorise, in writing |
| Ambiguous fit calls | The honest answer is "we cannot tell yet" | A confident label that nobody can appeal |
| An unhappy buyer | Recovery depends on being heard by a person | Correct sentences that make the situation worse |
| Relationship continuity | Context accumulates over months across people | A restart every conversation, and a buyer who notices |
| Discovery of the unstated problem | The real requirement is often not the asked question | A well-documented answer to the wrong question |
| Internal advocacy | Getting engineering or legal to move needs a colleague | A task nobody picks up |
| Reopening an automated decision | Appeals require authority, not another model call | A closed loop with no exit |

Note what is not on that list. Speed is not human work. Consistency is not human work. Record keeping is not human work. Teams that describe their reps as "the human touch" and then hand them the transcription and CRM entry are protecting the wrong half of the job.

The judgment cases matter more than the volume cases, which is why the roster you keep should be your better people, not your cheapest. Certification and practice for reps working alongside an automated layer belong to [sales team onboarding with AI](/guides/sales-team-onboarding-ai/).

## What has to exist before an AI SDR can work at all

Most disappointing deployments are not model failures. They are automation applied to a process that was never written down, which turns an unstated process into an unstated process running faster.

| Prerequisite | How to test that you have it | What breaks without it |
| --- | --- | --- |
| A written definition of qualified | Two managers write it separately and the texts match | The agent optimises a target nobody agreed |
| One entry point for requests | You can name every channel and where each one lands | Some channels stay manual and the comparison is meaningless |
| A named owner for every outcome | Each branch ends at a person, not a shared inbox | Escalations reach nobody, in silence |
| An approved source set | Every answerable topic has a document, an owner, a review date | The agent answers from general recall |
| A working escalation roster with hours | You can name who receives a handoff at 19:00 | Speed at the front, a queue at the back |
| Consent and source fields captured at entry | Trace one request end to end on paper | You cannot report on what changed after you buy |
| A field contract with your CRM | Each field has one source of truth and an overwrite rule | The agent and your integrations fight over records |
| A baseline measurement | Four weeks of current response times and outcomes | No way to tell whether the product helped |

The baseline is the one people skip and the one they regret. Without four weeks of before, every post-purchase argument becomes a matter of impressions. A structured way to produce that baseline is the [inbound lead audit](/guides/inbound-lead-audit/), and the capture side of it is covered in [website lead capture](/guides/website-lead-capture/).

If three or more rows in that table fail, the product is not your next purchase. The definitions are.

## How do you test an AI SDR before you buy it?

A demo shows you the vendor's best case on the vendor's data. What you need is your worst case on your data, with the pass conditions agreed in writing before anyone sees a result. Agreeing the criteria afterwards is how every evaluation ends up justifying the purchase that was already decided.

This is a buyer's acceptance test, run once, before signing. It is a different artefact from the ongoing regression suite you run after every prompt change, which is owned by [AI lead qualification](/guides/ai-lead-qualification/). Build this one first; the regression suite grows out of it later.

### Build the set from your own transcripts

Pull sixty to eighty real conversations from the last two quarters. That range is a working starting point for a team handling a few hundred requests a month, not an industry standard, and a higher-variance business needs more. Include the boring ones, because a product that fumbles a routine request is disqualified quickly and cheaply.

Then label the correct outcome for each case before the vendor sees it. Labelling afterwards is not a test.

### Add the cases your reps find hard

| Case class | Why it belongs in a buyer's test set | Pass condition |
| --- | --- | --- |
| Strong fit, vague timing | Separates a real read from optimism | Nurture with a checkpoint, not a booked call |
| Weak fit, urgent tone | Tests whether enthusiasm overrides rules | Honest redirect, no meeting created |
| Question outside the source set | Tests grounding, the highest-risk behaviour | Says what it cannot confirm, offers a person |
| Pricing pressure in message two | Tests where commercial authority sits | No number quoted, escalation raised |
| Returning buyer under a second email | Tests identity handling | Links to the existing record or flags unresolved |
| Contradiction inside one conversation | Tests whether it notices being wrong | Asks once, then hands to a human |
| Language switch mid-conversation | Tests reliability outside the primary language | Continues correctly or escalates, never silently degrades |
| Angry buyer, explicit request for a human | Tests the escalation path end to end | A named person receives it, with context, inside your stated window |
| Deletion request during qualification | Tests data handling under pressure | Routed to an owner, logged, dialogue stops |
| Instruction embedded in the buyer's message | Tests whether the script can be talked out of | Ignores it and continues the qualification path |

### Agree the success criteria before the pilot

Write down what a pass means for each class, who reviews the results, and what happens if the product fails a high-risk class. The three that should be blocking rather than scored are grounding, escalation, and the absence of unauthorised commitments. A product that is excellent at eight classes and invents a price on the ninth has not passed.

Two evaluation rules save a lot of money. Run the set in a sandbox against real conversation text, not as a slide walkthrough. And re-run the same set at the end of the pilot, because the version you tested in week one is rarely the version you are running in week six.

The [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework) is a useful reference for the language here, because it treats measurement and traceability as properties of the system rather than as a report you produce afterwards. The operational translation for a buyer is simple: if you cannot reconstruct why the product did something, you cannot manage it, and you should price that uncertainty into the decision.

## What should you ask a vendor, and which answers end the conversation?

| Question | What a workable answer contains | Answer that should end the conversation |
| --- | --- | --- |
| Which tasks run today with no human in the loop? | A named list, with the conditions each one assumes | "It handles the full SDR function" |
| What happens when the model is not confident? | A threshold, a named behaviour, a named receiver | "It always finds an answer" |
| Where do factual answers come from? | An approved document set, with owners and review dates | "It has been trained on your industry" |
| Can we run our own cases before signing? | A sandbox, your transcripts, your labels, a written schedule | A benchmark number offered instead of access |
| What does it write into our CRM, and how do we undo it? | A field-level contract, versioning, a rollback path | "It syncs with your CRM" |
| What does the buyer see about who they are talking to? | Configurable disclosure per channel and market | "Nobody can tell it is not a person", offered as a benefit |
| Who owns the transcripts, and are they used for training? | A clear answer with retention and deletion terms | Hesitation, or a redirect to a legal page |
| Show us a deployment that went badly | A specific story with a specific fix | "We have not had failures" |

Three of those are disqualifying on their own. A vendor who will not let you run your own cases is asking you to buy on their evidence. A vendor selling undetectability as a feature has told you how they think about buyers. A vendor with no failure story either has no customers or has not been listening to them.

On numbers: treat every vendor figure as vendor evidence, including the ones in case studies with logos on them. Not because vendors lie, but because the number was produced in someone else's process, on someone else's traffic, with a definition of "qualified" you have not seen. Ask for the definition. The answer is usually more informative than the number.

## What goes wrong after purchase

The loud failures get fixed in week one. The expensive ones are quiet, and they share a property: they look healthy in a funnel report, because the buyers involved never became rows in it.

| Failure mode | What it looks like from inside | Why reports miss it | First check |
| --- | --- | --- | --- |
| Silent disqualification | Volume from one segment simply stops | Rejected requests create no records and no complaints | Disqualification rate by segment, weekly |
| Confident wrong answer | A buyer quotes back a capability you do not have | The transcript looks calm and competent | Sample answers on topics outside the source set |
| Escalation with no receiver | Handoffs sit in a queue overnight | The bot's timer stopped, so the report is green | Time from escalation raised to human action |
| Booking without qualification | Calendar full, close rate falling | Meetings booked is the headline metric | Meetings held versus meetings that produced a next step |
| Sequence that will not stop | A closed-lost account keeps getting messages | Sends are counted, sentiment is not | Replies containing "stop" or "already spoke to" |
| Overwritten records | A complete record becomes a partial one | The record still exists, so nothing looks lost | Field change history on a sample of updated records |
| Timer stopped by a greeting | Median response time improves, buyers still wait | Bot acknowledgement counted as a response | Report bot ack and first human action separately |

### Operator note: the quarter nobody noticed

The failure to plan for is not a dramatic one. It is a definition change made on a Thursday. Someone tightens a fit rule so the agent stops passing requests from companies below a headcount threshold, because a rep complained about junk. The rule works. Requests from that segment now end with a polite message and no record.

Nothing breaks. Qualified rate goes up, because the denominator shrank. Close rate goes up, because the remaining requests are easier. The dashboard has never looked better, and a segment that used to produce a quarter of your smaller deals has silently gone dark. It surfaces three months later, when someone asks why a source that used to convert has stopped.

Two defences, both cheap. Sample a fixed number of automated rejections every week regardless of how the numbers look, and alert on rejection rate per segment rather than in aggregate. A segment whose rejection rate doubles overnight is a configuration change, not a change in the market.

## Buy, build, or hire: a real three-way choice

Vendors frame this as buy or fall behind. Skeptics frame it as hire or get burned. Both are selling something. The honest version is that all three are viable and the right answer depends on which constraint you actually have.

| Dimension | Buy a product | Build on your stack | Hire a person |
| --- | --- | --- | --- |
| Time to something working | Fastest, if your case is ordinary | Slower, gated by your own clarity | Slow, plus ramp |
| What you control | Configuration inside their model | Rules, fields, order, everything | Behaviour, through management |
| Where it breaks | The edge of their assumptions | Your ability to maintain it | Turnover, sickness, coverage |
| Cost shape | Recurring, scales with volume or seats | Front-loaded, then maintenance | Recurring, plus management overhead |
| Reversibility | Contract term, and data you may not get back | High, you own the pieces | High, but slow and human |
| What it teaches you | Little about your own process | A great deal, painfully | Everything, through their complaints |
| Best when | One channel, ordinary requirements, need speed | Rules already documented and unusual | The constraint is judgment, not volume |

Building is more available than most teams assume, because part of it is already paid for. [Salesforce documents lead assignment rules](https://help.salesforce.com/apex/HTViewHelpDoc?id=mktg.mktg_set_lead_assignment_rules.htm) as ordered, inspectable criteria, and [HubSpot documents lead pipeline automation](https://knowledge.hubspot.com/object-settings/set-up-lead-pipeline-automation) as stage transitions driven by property changes. If routing and stage movement are your problem, you may be shopping for something you own. Where that boundary sits is the subject of [Lead Hub vs CRM](/guides/lead-hub-vs-crm/), and rule precedence itself belongs to the [lead routing playbook](/guides/lead-routing-playbook/).

The combination people underrate is hire plus build: one strong person, plus an automated first response layer that stops requests rotting overnight. It solves the constraint that actually hurts, which is usually the gap between arrival and the first useful reply, without asking a product to make commercial judgments.

## What do buyers think they are talking to?

Disclosure is a design decision before it is a compliance question. Requirements differ by jurisdiction and by channel, some markets and some messaging platforms impose specific rules, and this guide does not give legal advice. Confirm your position for your markets with qualified counsel. What follows is the operator's half of the problem.

The practical test is whether a buyer, on reading the transcript later, would feel misled. That standard is stricter than most rules and simpler to apply. An opening line that names the assistant and offers a person costs you nothing in inbound conversion, because the buyer contacted you and wants an answer more than they want a colleague.

Three concrete positions worth writing down. Say what the assistant is at the start of the conversation, not in a footer. Make "talk to a person" available in every turn, not only after a failed exchange. And never let the agent claim to be a named employee, which is the version of this that turns a product decision into a reputational one.

Recording matters here too. Where a conversation is transcribed or summarised, the buyer should know, and consent state should live in the record next to the transcript rather than in the vendor's system alone. The mechanics of storing consent, retention, and deletion routing sit with [AI lead qualification](/guides/ai-lead-qualification/).

## How does the work divide day to day?

Once the purchase is made, the division of labor is what determines whether reps use the thing or route around it. The pattern that survives contact with a real roster is narrow: the automated layer holds the conversation until there is either a clear outcome or a reason to stop, and the rep starts from a structured package rather than a transcript.

The seam to protect is the moment of transfer. A rep who has to read the whole conversation to find out what happened will stop trusting the summary within a week, and once that trust is gone the layer becomes an expensive greeter. Give the rep the requested action, the evidence behind the read, the gaps, and a link to the source, and let them correct the record in one click. Those corrections are the highest-value data the system produces, so capture them as labelled cases rather than private notes.

The reverse direction matters as much. When a rep learns something offline, the automated layer has to know: a call where the buyer said no has to stop the sequence, a deal moved to negotiation has to suppress nurture, and a reassignment has to move the escalation target. Most of the ugly post-purchase failures in the table above are this loop being open in one direction only.

## What does the evaluation sequence look like?

This is a purchasing sequence, not an implementation plan. Move on when the exit condition is met, not when the calendar says so.

| Step | Deliverable | Exit condition |
| --- | --- | --- |
| Name the tasks | The list of tasks you want covered, ranked | Sales and operations agree on the top three |
| Check prerequisites | The readiness table above, filled honestly | No more than two rows failing |
| Baseline | Four weeks of current response times and outcomes | Numbers nobody disputes |
| Build the test set | Real cases plus the hard classes, labelled | Labels fixed before any vendor sees them |
| Shortlist | Two or three vendors, plus the build option costed | Each one answered the vendor questions |
| Run the set | Sandbox execution against real text | Written results per case class |
| Decide | Buy, build, or hire, with the reasoning recorded | The decision names the tasks it covers, not a headcount |
| Pilot | One channel, one roster, daily case review | High-risk failures closed, remaining errors explainable |
| Re-test | The same set, against the version now running | No regression on blocking classes |

Step seven is the one worth being pedantic about. Write the decision down as a sentence about tasks: "we are buying instant first response and structured qualification on the site chat channel, and keeping objection handling and commercial calls with the team". A decision recorded that way can be reviewed. A decision recorded as "we are getting an AI SDR" cannot.

## How do you review the decision after a quarter?

Set the review date at purchase, before anyone is invested in the outcome. Bring evidence per task, because that is how the decision was made, and an aggregate verdict will tell you nothing about what to change.

| Question | Evidence to bring | Decision it supports |
| --- | --- | --- |
| Did the tasks we bought actually get done? | Volume and outcome per task, not per product | Keep, narrow, or drop specific tasks |
| Where did reps override it, and why? | Override cases tagged by cause | Fix definitions, or accept the override as correct |
| What did it get confidently wrong? | Sampled answers outside the source set | Tighten grounding, or remove a topic entirely |
| Did anyone get lost? | Sampled rejections and unanswered escalations | The only check that finds silent failures |
| Did the human queue get faster or slower? | Escalation raised to human action, weekly | Roster and hours, not product configuration |
| Did the test set still pass? | Re-run against the current version | Renew, renegotiate, or exit |

Two outcomes are worth naming in advance because teams handle them badly. If it works for two tasks and fails for six, that is a success you should narrow to, not a failure you should abandon. And if the results are ambiguous after a quarter, the honest reading is usually that the prerequisites were weak, not that the product was. Ambiguity here is almost always a measurement problem.

## Where this guide stops

This page owns the buying decision, the task-level division of labor, and vendor evaluation. It deliberately does not own the parts that come after the signature.

Scoring fit and intent, confidence thresholds, testing after launch, and rollback belong to [AI lead qualification](/guides/ai-lead-qualification/). Response timers and escalation windows belong to [SLA and speed to lead](/guides/sla-speed-to-lead/). Follow-up cadence belongs to the [lead follow-up system](/guides/lead-follow-up-system/). Cost modelling belongs to [inbound automation ROI](/guides/inbound-automation-roi/). What to measure afterwards is covered in [inbound lead reporting](/guides/inbound-lead-reporting/), and where all these modules sit relative to each other is mapped in the [lead ops stack guide](/guides/lead-ops-stack/) and on the [home page](/) interactive diagram.

If you are shortlisting vendors now, the highest-return hour you can spend is building the test set: sixty real conversations, ten hard classes, labels fixed before the demos. Implementation scope is on the [pricing page](/pricing/), and an [inbound audit](/audit/?utm=guide-ai-sdr) produces the baseline and the labelled test set from your own conversations, so you walk into vendor calls with the cases that decide the purchase already written.
