---
title: "AI Lead Qualification: Fit, Intent, and Human Handoff"
description: "How AI qualification separates fit from intent, scores confidence, routes deterministically, and hands inbound conversations to a rep with evidence."
pubDate: 2026-07-18
updatedDate: 2026-08-21
author: Maksim Shchegolev
faq:
  - question: What is AI lead qualification?
    answer: "AI lead qualification is a scripted conversational layer on chat, WhatsApp, or Telegram that asks the questions a rep would ask, separates fit from buying intent, records the supporting evidence, and passes a structured outcome to deterministic rules that decide what happens next. The model interprets language. It does not own the decision."
  - question: How is it different from lead scoring?
    answer: "Predictive lead scoring ranks records you already hold using historical patterns, and it produces a probability. Conversational qualification collects new evidence in a live dialogue and produces facts plus an outcome. Scoring tells you who to call first among known contacts. Qualification tells you what an unknown request actually is."
  - question: Should AI automatically disqualify leads?
    answer: "Only against hard written constraints such as an unsupported market or a product you do not sell, and only when the rule and the captured evidence are stored with the record. Soft signals like a vague budget answer should route to human review or nurture, never to a silent rejection the buyer cannot appeal."
  - question: How is qualification accuracy tested?
    answer: "Build a representative test set from real conversation patterns plus adversarial cases, label the expected outcome for each, and re-run it before every script or prompt change. Then review live failures weekly and tag each one by layer: capture, identity, fit rule, intent interpretation, grounding, summary, or routing."
  - question: How do you stop the bot from inventing answers?
    answer: "Restrict factual answers to an approved source set with a named owner and a review date, and require the bot to say what it cannot confirm rather than filling the gap. Keep pricing, contractual, legal, and security answers out of the bot entirely until a human has reviewed the source text."
  - question: When should AI hand off to a human?
    answer: "On low confidence, on any risk flag, on explicit buyer request, on frustration, and on topics your policy reserves for people such as custom commercial terms. Handoff should also happen when the buyer contradicts an earlier answer, because contradiction usually means the script has misread the situation."
  - question: How does qualification connect to CRM?
    answer: "Qualification writes a structured outcome, the evidence behind it, consent state, and source fields. CRM automation then maps that outcome to lifecycle stages, tasks, and owners. Keeping interpretation and CRM writes in separate layers means you can change the script without rewriting your pipeline definitions."
---

**AI lead qualification** takes an inbound request, separates fit from buying intent, records the facts a sales rep needs, and hands the conversation to a human at the right moment. Done well, it removes waiting and guesswork. Done badly, it lets a model invent policy, reject ambiguous buyers, and hide the reason behind a friendly automated reply.

This guide covers the qualification layer inside a [lead ops stack](/guides/lead-ops-stack/): capture, identity, fit, intent, confidence, and human handoff. Assignment logic after handoff belongs to the [lead routing playbook](/guides/lead-routing-playbook/), and response timers belong to [SLA and speed-to-lead](/guides/sla-speed-to-lead/).

## In one sentence

**AI lead qualification is an automated first response plus structured interpretation of fit, intent, and urgency, after which deterministic rules choose the outcome and write it into CRM with source, evidence, and an auditable trail.** The model interprets language. It does not get to make the final call on its own.

## Why do slow responses and messy handoffs happen?

Slow responses happen because inbound requests land in several inboxes, qualification facts live in free text, and no system owns the handoff. Automation helps only when it produces structured context and a clear next owner. A fast generic acknowledgement is not the same as a useful response.

Requests rarely arrive one at a time during business hours. They hit the site at 23:40, arrive in a messaging channel while the rep is on a call, or duplicate across chat and email under two spellings of the same company name. Without a qualification layer the same failures repeat: reps cherry-pick easy chats while complex buyers wait, CRM records lack budget and timeline until a human finally types something in, marketing can tie spend to form fills but not to qualified pipeline, and managers discover the gap in the weekly review instead of when the timer breaches.

The original [MIT and InsideSales lead response study](https://www.onecavo.com/wp-content/uploads/2015/11/MIT-InsideSales.com_Lead-Response-Management.pdf) found that the odds of contacting and qualifying a web lead fell sharply as call response was delayed, within that dataset. It measured contact and qualification odds, not closed revenue, and it predates current messaging channels. [Harvard Business Review](https://hbr.org/2011/03/the-short-life-of-online-sales-leads) reported a separate 2011 audit of 2,241 companies, finding an average first response of 42 hours among those that responded at all. Both are old and directional. Use them to remove avoidable delay, then set your own targets from your own data.

## How is qualification different from lead scoring?

Vendor language merges these two, and it should not. Predictive scoring ranks records you already hold. Conversational qualification collects evidence about a request that just arrived.

| | Conversational qualification | Predictive lead scoring |
| --- | --- | --- |
| Input | Live dialogue, form answers, channel context | Historical CRM and behavioural data |
| Output | Facts, an outcome, a confidence level | A relative rank or probability |
| Works on | New and unknown requests | Known contacts with history |
| Explains itself by | Quoting what the buyer said | Feature weights, at best |
| Fails by | Misreading language, missing a question | Learning last year's buyer, drifting silently |
| Cold start | Works on day one | Needs enough labelled history |

Most teams need both, in that order. Qualification decides whether a request is real and what it is about. Scoring, where volume supports it, ranks the qualified pile. A team with 200 requests a month does not have the label volume for a trustworthy predictive model and does not need one.

A predictive score is also a poor thing to show a rep at handoff. "Score 84" is not evidence. "Team of 400, migrating off a legacy system in Q4, asked about single sign-on" is evidence.

## What should automation do better than a manual inbox?

| Dimension | Manual inbox | AI qualification plus Lead Hub |
| --- | --- | --- |
| Script consistency | Varies by rep, day, and mood | Same core questions every time |
| CRM data quality | Partial, if entered at all | Required fields written before handoff |
| Source attribution | Often lost by the second reply | Captured at entry, preserved downstream |
| Audit trail | Screenshots in a group chat | Logged events, versions, stage changes |
| Reversibility | None, the conversation is gone | Replay the case, roll back the rule |

Automation does not remove humans. It removes **delay and ambiguity** before humans engage. Where the qualification layer ends and the record system begins is covered in [Lead Hub vs CRM](/guides/lead-hub-vs-crm/).

## How does AI qualification work end to end?

1. **Capture.** The hub stores channel, consented acquisition context, landing page, and session identifier.
2. **Identify.** Known email, normalized phone, or channel identity links the request to an existing contact. An unresolved identity is recorded as unresolved, never guessed.
3. **Clarify.** The conversation records what the person wants now, not what the model infers from a page view.
4. **Test fit.** Rules check product, segment, geography, contract minimum, and other approved eligibility fields.
5. **Interpret intent and urgency.** Timing, requested next step, active evaluation, and decision process indicate urgency separately from fit.
6. **Assign confidence.** Each interpreted field carries a confidence level and a pointer to the text supporting it.
7. **Decide deterministically.** A rule engine, not the model, maps the structured fields to one outcome: qualified, nurture, human review, support, partner, or out of scope. Uncertainty resolves to human review.
8. **Hand off and close the loop.** The hub writes structured fields and an evidence-based summary, routing assigns an owner, and rep corrections feed script review and [CRM automation](/guides/crm-automation-inbound/).

Step 7 is what most implementations get wrong. If the prompt decides who gets the lead, your business rules now live in a text file that nobody versions and nobody tests. Interpretation belongs to the model; the decision belongs to the rule engine.

## What belongs in the qualification script?

Scripts should mirror what your best rep asks on a good day, not everything the CRM has a field for.

### Intent block

- What triggered contact today?
- What outcome do they want in the next 30 to 90 days?
- Have they evaluated alternatives already?

### Fit block

- Budget range or investment band, as ranges rather than exact numbers where that is culturally sensitive
- Timeline to a decision, and who else is involved in it
- Geography or regulatory constraints

### Scope, objection, and consent block

- Product tier, service level, implementation size, integration or compliance requirements
- Blockers that need human skill: legal, custom pricing, an executive sponsor
- Preferred follow-up channel and time window, with explicit opt-in for nurture

Avoid essay questions. Use branching: if the budget answer sits below a written threshold, route to nurture instead of a senior rep. If the timeline is "just researching", tag nurture and do not spend senior capacity.

Ground factual answers in an approved source set, not general model recall. Each answerable topic needs a named owner, a current source document, and a review date. When the source does not support an answer, the bot should say what it cannot confirm and offer a human. Pricing, contract terms, legal positions, and security commitments are the four topics that most often need to stay out of the bot entirely.

## How should fit, intent, and confidence be scored, and when should thresholds move?

Fit, intent, urgency, and confidence are four different things, and collapsing them into one number is the most common design error in AI qualification.

### Score the dimensions separately

**Fit** answers whether you can serve this buyer at all: market, segment, contract size, required integrations, regulatory constraints. Fit is mostly deterministic, checked against written rules rather than inferred from tone.

**Intent** answers how close they are to acting: trigger event, requested next step, active evaluation, internal decision process. Intent is interpretive and belongs to the model, which is exactly why the supporting quote has to be stored.

**Urgency** is not intent. A buyer can have high intent and a June budget cycle. Urgency changes queue position and timer tier. Intent changes whether the conversation goes to sales at all.

**Confidence** is the model's reported certainty about each interpreted field, plus a record of which evidence is missing. Confidence separates "low intent" from "we never got an answer to the intent question", and those two cases have very different correct actions.

A strong-fit company researching next year belongs in nurture with a named checkpoint. A low-fit prospect demanding a demo today needs an honest redirect, not a booked call that wastes both sides. One opaque score makes those cases indistinguishable.

### Map the combinations to outcomes

| Fit | Intent | Confidence | Outcome |
| --- | --- | --- | --- |
| High | High | High | Immediate handoff to the qualified queue |
| High | High | Low | Handoff, flagged for the rep to re-verify |
| High | Low or unknown | Any | Nurture with an explicit checkpoint and date |
| Low | High | High | Transparent redirect, with referral if you have one |
| Low | High | Low | Human review, because a low-fit read may be a misread |
| Low | Low | High | Close, or low-frequency nurture, per written policy |
| Unknown | Any | Any | Ask one clarifying question, then human review |

Read the table from the confidence column first. Every low-confidence row ends with a person looking at the case. That is the point.

### Treat thresholds as your own numbers

Confidence thresholds are configuration, not an industry benchmark, and there is no correct number to copy. A workable starting template for a first pilot is three bands: auto-proceed above an upper band, human review in the middle, one more question below the lower band. Where the boundaries sit depends on the cost of a false handoff against the cost of a delayed one, and you should expect to move them after two weeks of case review.

Never let the lower band loop. One clarifying question, then a person. A bot asking a fourth clarifying question has already lost the buyer.

### Know when to tighten and when to loosen

**Tighten** when close rate falls while qualified volume rises, when reps start rejecting handoffs, or when CRM junk grows. Add a required field, raise the auto-proceed band, or narrow the qualified branch. Change one thing at a time so you can attribute the effect.

**Loosen** when qualified rate is low but the traffic is demonstrably good: strong engagement, strong source performance, reps saying the rejected cases looked fine. Add nurture branches rather than disqualifying early research. Loosening disqualification is almost always safer than loosening qualification.

Treat a rising override rate as a signal to inspect cases, not as proof that the bot or the reps are wrong. Overrides also rise for good reasons, such as a new segment the definitions have not caught up with.

## How should scripts branch without becoming interrogations?

| Path type | Example branch | Typical failure |
| --- | --- | --- |
| Fast track | Skip nurture, route to senior queue | Triggered by enthusiasm, not evidence |
| Standard | Full fit block, then decide | Too many fields, buyer drops at question five |
| Nurture | Capture contact, no senior assign | Never revisited, becomes a dead list |
| Redirect | Honest exit plus referral | Phrased as rejection, damages the brand |
| Human now | Escalate with context, pause bot | Escalation queue nobody watches |

Document the paths in a table sales and operations review together. That table is also your change log: when someone edits a branch, the diff should be visible to the people working the queue.

## Where does qualification stop, and how does it connect to the rest of the stack?

Qualification stops the moment the system has recorded an outcome and the evidence behind it. Keeping that seam clean is what makes each layer testable.

**The boundary with routing.** Routing begins when policy selects an eligible owner or queue. Keep those rules in the hub, not in the bot prompt. Prompts change weekly; ownership rules need versioning and an audit trail. [Salesforce documents lead assignment rules](https://help.salesforce.com/apex/HTViewHelpDoc?id=mktg.mktg_set_lead_assignment_rules.htm) as ordered, evaluated criteria for exactly this reason: the order is inspectable. Rule precedence, ownership, and fallback queues belong to the [lead routing playbook](/guides/lead-routing-playbook/).

**The boundary with CRM.** CRM owns lifecycle stages, field definitions, deduplication, and data hygiene. Qualification supplies the outcome and evidence; CRM decides which stage that maps to. [HubSpot's lead pipeline automation documentation](https://knowledge.hubspot.com/object-settings/set-up-lead-pipeline-automation) shows the pattern of stage transitions triggered by property changes rather than ad hoc edits. The field and stage model lives in [CRM automation for inbound teams](/guides/crm-automation-inbound/).

**The boundary with SLA timers.** Qualification produces the first timer event, and this is where teams argue. A bot greeting is not a human response. Report bot acknowledgement and first meaningful human action separately, or you will show a healthy median while buyers wait for a person. Timer definitions belong to [SLA and speed-to-lead](/guides/sla-speed-to-lead/).

**What feeds it and what it feeds.** Qualification consumes chat starts from organic search and [AI-visible content](/guides/aeo-geo-inbound-marketing/), campaign traffic with preserved UTM parameters, and long-tail intent from [programmatic pages](/guides/programmatic-seo-lead-gen/). It outputs to CRM, to reporting, to [source attribution](/guides/lead-attribution-inbound/) for first and latest source, and to [sales onboarding](/guides/sales-team-onboarding-ai/), where real transcripts are the best training material a new rep can get.

## How should the handoff package be structured?

The handoff should let a rep act without rereading a transcript, while preserving enough evidence that a wrong read can be corrected. Summaries must separate facts from interpretation. "Enterprise prospect" is an interpretation. "Team of 400, asked about single sign-on and a procurement timeline" is evidence.

| Handoff field | Example content | Rule |
| --- | --- | --- |
| Requested action | Wants a technical discovery call | Use the buyer's stated request |
| Fit evidence | Uses a supported CRM, 400 seats | Facts, not adjectives |
| Intent evidence | "We are comparing three vendors this month" | Quote or close paraphrase |
| Confidence and gaps | Intent high, budget never answered | Never hide missing data |
| Risk flag | Asked for custom data retention terms | Human review before any commitment |
| Preferred contact | Email, weekday mornings | Respect the stated preference |
| Source | Organic, landing URL, campaign | Preserve first and latest source |
| Conversation link | Auditable transcript reference | Apply retention and access policy |

Do not claim the model produces perfect notes. It does not. Summaries drift, quotes get paraphrased into something slightly stronger than what was said, and a confident tone survives even when the evidence is thin. The defence is structural: the rep sees the quote next to the interpretation, and the transcript is one click away. When a rep corrects a summary, that correction is a labelled training case, so capture it rather than letting it sit in a private note.

## How is qualification accuracy tested before and after launch?

Testing is what separates a demo from an operating system. Two things are needed: a representative test set that runs before every change, and a failure review that runs continuously after launch.

### Build a representative test set

A test set is a collection of fixed conversations with a labelled expected outcome for each. Build it from real question patterns in your own transcripts, then add adversarial cases deliberately:

- Contradictory answers inside one conversation
- A returning contact who already exists under a different email
- An unsupported language, or a language switch mid-conversation
- An angry buyer, and a request to delete data mid-qualification
- Attempts to override the bot's instructions through the message text
- Ambiguous fit, where the honest answer is "we cannot tell yet"

Cover every branch, fallback, and escalation trigger at least once, then add more for anything regulated or high risk. Re-run the whole set before any prompt, script, source document, or threshold change ships. A change that improves one branch and quietly breaks another is the normal outcome of editing prompts, and only a regression set catches it.

| Pre-launch criterion | Weight | Pass condition |
| --- | --- | --- |
| Required fields captured | High | Every policy-required field on the relevant path |
| Correct outcome on the test set | High | Matches the reviewed expected outcome |
| Safe uncertainty handling | High | Escalates rather than inventing or guessing |
| Approved-source fidelity | High | No unsupported policy, pricing, or product answers |
| Escalation triggers fire | High | Every risk phrase reaches the human queue |
| Handoff summary usefulness | Medium | A rep can name the next action and the missing facts |

### Tag failures by layer, then measure

After launch the useful review is case-level, not aggregate. Tag every disputed outcome by the layer that caused it: capture, identity, fit rule, intent interpretation, confidence threshold, grounding, summary, or routing. The tag tells you where the fix belongs. A misroute caused by a bad fit rule and one caused by a stale roster look identical in a dashboard and need completely different corrections.

| Metric | Definition | Healthy direction |
| --- | --- | --- |
| Time to first meaningful reply | Median from first message to a substantive response | Down |
| Time to first human action | Median from qualified outcome to human contact | Down |
| Qualified rate | Share meeting your written qualified definition | Stable or up without a close-rate drop |
| Handoff acceptance | Share of handoffs reps confirm as usable | Up |
| Override rate | Share of model outcomes a human changes | Investigate, cause decides direction |
| False disqualification rate | Sampled disqualifications a reviewer overturns | Down, sampled every week |

Weekly, not monthly. If qualified rate rises while close rate falls, the script is too loose. If speed improves while rework spikes, tighten required fields before handoff. Track false disqualifications even when the number looks boring, because it is the only metric that catches the failures a funnel report structurally cannot show: the buyers who left.

## How do operators keep the system auditable and reversible?

An AI qualification layer changes behaviour every time someone edits a prompt, updates a source document, or moves a threshold. Without version control and a rollback path you cannot answer the two questions that matter after a bad week: what changed, and how do we undo it. The [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework) frames this as mapping, measuring, and managing risk across a system's life. The operational translation is concrete.

**Version everything that can change an outcome.** Prompts, scripts, fit rules, thresholds, and the approved source set all need a version identifier, stamped onto every conversation record. When outcomes shift you compare cohorts by version instead of arguing from memory.

**Log decisions, not just messages.** A transcript says what was said. A decision log says which rule fired, which fields were populated, what confidence was assigned, and which branch was taken. Reconstructing a decision from a transcript alone is guesswork.

**Keep a rollback that takes minutes.** The realistic failure is a Friday change that starts disqualifying a whole segment. The fix is reverting to the previous version, not editing prompts live under pressure. Test the rollback before you need it, and name the condition under which qualification stops entirely and everything falls through to a human queue. A kill switch pointing at an unwatched inbox is worse than none.

**Give people an appeal path.** A buyer told they are out of scope needs a visible way to reach a human, offered as an option rather than buried. Internally, a rep should be able to reopen any automated disqualification, with the reopening logged as a labelled failure case. Automated decisions nobody can contest are an operational risk before they are anything else.

### Operator note: the failure nobody sees

The dangerous failure mode here is not the loud one. It is a fit rule that quietly starts disqualifying a whole segment after someone edits a definition, because disqualified requests generate no complaints, no CRM records, and no movement in the funnel report. Everything looks fine. Volume from that segment simply stops.

Two defences: sample a fixed number of disqualifications every week regardless of how healthy the dashboard looks, and alert on disqualification rate by segment rather than in aggregate. A segment whose disqualification rate doubles overnight is a configuration change, not a change in buyer behaviour.

## What are the red flags?

The strongest red flag is a model that can mark a request unqualified without storing the facts and the rule behind that decision. Operators cannot audit an unexplained label, buyers cannot correct a misunderstanding, and sales cannot tell a policy problem from a model error.

**Generic FAQ bot.** If it cannot record an outcome and produce evidence, it is not qualification. It is a deflection widget.

**CRM as chat archive.** Pasting transcripts into a notes field is not automation. Fields and stages have to update.

**No feedback loop.** If rep corrections and call outcomes do not reach the script owner weekly, the script decays. Related: an approved source set with no owner and no review date is a stale source set within a quarter.

**One bot per channel.** Separate bots break attribution and produce three different answers to the same question.

**No clear human boundary.** Sensitive topics, frustration, custom commercial terms, and low confidence all need an explicit escalation path with a named owner.

**Automation counted as human response.** A greeting that stops a timer while the buyer waits for a person is a reporting artefact, not a service level.

## What is the practical implementation sequence?

The sequence below is a starting structure, not a promised timeline. Move on when the exit condition is met, not when the calendar says so. Complexity drives the schedule: legacy CRM data, multiple languages, and a large roster each add real work.

| Phase | Deliverable | Exit condition |
| --- | --- | --- |
| Define | Fit rules, intent signals, outcomes, human boundaries | Sales and ops agree on the written qualified definition |
| Map | Channel fields, identity keys, CRM fields, consent records | A request can be traced end to end on paper |
| Ground | Approved source set with owners and review dates | Every answerable topic has a current source |
| Script and test | Short paths, explicit escalation, reviewed fixtures | The regression set passes and is stored for reuse |
| Pilot | One channel, one trained roster, daily case review | High-risk failures closed, remaining errors explainable |
| Tune | Corrected definitions, prompts, fields, thresholds | Two consecutive weeks without a new failure category |
| Expand | Additional channels on the same field contract | The shared contract survives the new channel |

### Running the pilot and reviewing after launch

Pick one channel and a small roster that knows this is a pilot. Publish the hours and the fallback behaviour so nobody is surprised. Review every disputed outcome and a sample of accepted ones, tagging each by layer.

Compare three things weekly: what the bot decided, what the human changed, and what happened downstream. Divergence between the first two is a definition problem. Agreement between the first two plus poor downstream movement is a strategy problem, and it means your qualified definition is wrong even though the system is executing it correctly.

Post-launch review is about definition errors, not aggregate rates. Inspect false disqualifications, rep overrides, failed identity matches, unsupported answers, and handoffs that reached the wrong queue. Trace each case from capture to CRM stage so the correction lands in the right layer instead of being patched into the prompt, which is where corrections go to disappear. Expand only after high-risk failures are closed and operators can explain the errors that remain. "We do not know why it did that" is a blocking condition, not a note for later.

## How should consent, retention, and deletion be handled?

Capture consent before qualification deepens. The opening message should state who you are, why you are asking, and how to opt out. Store the consent timestamp, the wording shown, and the purpose, tied to the person record, because "they agreed" without the wording is not much of a record.

| Data class | Typical handling | Common mistake |
| --- | --- | --- |
| Raw transcript | Restricted access, defined expiry | Copied into three systems, deleted from none |
| Structured qualification fields | Written to CRM, retained per policy | Free-text notes duplicating the same facts |
| Consent record | Timestamp, wording, purpose, channel | Implied from a form submission |
| Special-category topics | Human review queue, no bot handling | Health or finance details captured by default |
| Payment details | Never collected in chat | A helpful bot asking for card details |
| Deletion requests | Routed to a named owner, logged | Handled by whoever saw the message first |

Reps usually need the structured handoff and an authorized link to the transcript, not unrestricted copies. Restrict bot knowledge to approved documents rather than open web retrieval for buyer-specific claims, and keep a human review queue for sensitive categories.

On automated decisions: GDPR Article 22 restricts decisions based solely on automated processing that produce legal or similarly significant effects, and European case law has extended scrutiny to automated scoring in some contexts. Whether it applies to a specific qualification flow depends on the decision, the effect on the person, the jurisdiction, and whether a human is meaningfully involved. It does not apply automatically to every chatbot. Treat meaningful human involvement and a working appeal path as good practice regardless, and confirm the legal position for your markets with qualified counsel.

## Which channels change the script, and how do you handle languages?

One script with channel overlays performs better than three disconnected bots. The qualification logic stays identical; what changes is pacing, message length, identity handling, and expectations about response time.

**Site chat.** Visitors are usually mid-research and expect fast answers about fit and next steps. Keep opening messages short and offer a human within two turns if sentiment turns negative. Preserve page URL and referrer in hub metadata for [source attribution](/guides/lead-attribution-inbound/), because chat is where source data most often gets lost.

**WhatsApp and Telegram.** Buyers expect a conversational tone but still need structure. Use numbered questions sparingly, confirm phone identity once, and respect quiet hours with scheduled follow-up rather than a message at 23:00. Route these handoffs to reps who actually watch mobile notifications, or the channel's speed advantage disappears at the handoff. Telegram often carries community-sourced traffic, so tag the community name separately from the channel and reporting will show which groups convert rather than one undifferentiated row.

**Email and forms.** Asynchronous channels have no turn-taking, so ask the three highest-value questions in one message and accept that you will get two answers. Never send a second clarifying email before a human has read the first reply.

### Language handling

Branch at entry on browser language or first-message detection, and never make a buyer repeat qualification because they landed in the wrong language queue.

| Language branch | Bot behaviour | Human roster | Watch for |
| --- | --- | --- | --- |
| Primary market | Full script | Standard queue rotation | Nothing unusual |
| Secondary market | Reviewed translation, same logic | Language-certified reps | Idioms that shift intent meaning |
| Unsupported | Capture contact, offer a callback | Manager queue | Silent disqualification by language |

Evaluate confidence thresholds per language. A model that reads intent reliably in your primary language may be materially less reliable in a secondary one, and the same threshold will then produce a very different error rate. Test each language against its own labelled set before treating its outcomes as equivalent, and pair language tags with rosters in the [lead routing playbook](/guides/lead-routing-playbook/).

If your script, field map, and handoff ownership are unclear, the fastest diagnostic is to trace ten real requests end to end and mark where the evidence disappears. The [lead ops stack guide](/guides/lead-ops-stack/) shows where qualification sits between capture and routing, and that trace usually returns three things: the questions worth keeping, the fields that never reach the CRM, and the handoff nobody currently owns. Implementation scope and options are on the [pricing page](/pricing/), and a [lead qualification audit](/audit/?utm=guide-ai-qual) runs that same trace against your own conversations, returning the disqualification rules worth keeping and the ones quietly costing you pipeline.
