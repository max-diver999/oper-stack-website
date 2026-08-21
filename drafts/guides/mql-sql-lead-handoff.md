---
title: "MQL vs SQL: Handoff Agreement, Acceptance, Rejection"
description: "MQL vs SQL without another glossary entry: acceptance criteria written as evidence, rejection reason codes, a recycling loop, and one joint report."
pubDate: 2026-08-21
author: Maksim Shchegolev
faq:
  - question: What is the difference between an MQL and an SQL?
    answer: "An MQL is marketing asserting that a record meets criteria the two teams wrote down together and deserves a sales attempt now. An SQL is sales confirming, after contact, that a real opportunity exists and is worth working. The first is a claim about evidence, the second is a judgment after inspection. Both definitions are local to your agreement."
  - question: Is there a standard definition of an MQL?
    answer: "No. No industry body defines MQL, and vendor templates describe their own products rather than your buyers. The only definition that changes behavior is the one marketing and sales wrote down, dated, and agreed to enforce. Copying another company's threshold gives you their argument about lead quality instead of a resolution to yours."
  - question: What is a sales accepted lead?
    answer: "A sales accepted lead is a record a rep has checked against the written criteria and taken ownership of, before anyone knows whether it becomes an opportunity. It separates two different questions: was the lead as promised, and did it convert. Without that middle state, every failed deal reads as a marketing quality problem."
  - question: What happens when sales rejects a lead?
    answer: "The rep picks a reason code from a short controlled list, and the code decides the next move. Data and evidence problems go back to marketing as a fix. Timing rejections recycle into nurture with a revisit date. Only permanent conditions disqualify. A rejection with no code is not a rejection, it is a record quietly going cold."
  - question: How quickly should sales accept or reject a lead?
    answer: "Fast enough that a rejection still helps marketing, which in practice means hours rather than days. A common starting template is one working hour for acceptance and one working day for the outcome, then tuned to volume. The acceptance window is an obligation on sales in the same way lead quality is an obligation on marketing."
  - question: Who decides when a lead is sales ready?
    answer: "The written agreement decides, and a named arbitrator resolves the cases the agreement does not cover. That arbitrator is usually whoever owns revenue operations or the manager both teams report to. Leaving the decision to whoever argues hardest in the moment is what produces two teams reporting different numbers from the same records."
  - question: What is a healthy lead rejection rate?
    answer: "There is no benchmark worth copying, because the number depends on your criteria, your channels, and how strict acceptance is. What matters is the trend and the reason mix. A rate of zero is a warning sign rather than a success: it usually means reps accept everything to avoid the argument, and the criteria have stopped meaning anything."
---

**MQL and SQL are not definitions you look up, they are a boundary two teams agree to enforce.** Marketing hands a record over, sales decides whether to work it, and somebody has to have written down in advance what makes that handoff valid. Most published answers stop at the acronyms. The acronyms were never the problem.

This guide owns the definitions, the acceptance agreement, the rejection and recycling loop, and dispute resolution. Lifecycle stages as a state machine belong to [CRM automation for inbound leads](/guides/crm-automation-inbound/), and the scoring model behind a qualification decision belongs to [AI lead qualification](/guides/ai-lead-qualification/).

## In one sentence

**An MQL is marketing's claim that a record meets criteria both teams wrote down, an SQL is sales confirming after contact that a real opportunity exists, and the boundary only works when acceptance criteria are stated as evidence, rejections carry reason codes, both sides owe each other a response time, and one joint report settles the argument.**

## What is an MQL, and what is an SQL?

Start with what each term actually asserts, because that is where glossary answers go wrong. They describe the marketing funnel and skip the assertion.

An **MQL** is a marketing qualified lead: marketing is stating that this record satisfies the criteria the two teams agreed on and is worth a sales attempt in this period. It is a claim about evidence present in the record. It is not a prediction that the deal will close, and it is not a reward for engagement.

An **SQL** is a sales qualified lead: after contact, a rep has confirmed that a real opportunity exists, meaning there is a problem worth solving, someone with authority to solve it, and a plausible reason to act inside a known timeframe. It is a judgment made with information marketing never had.

Between them sits the state most teams skip and then regret skipping. A **sales accepted lead** is a record a rep has checked against the written criteria and taken responsibility for, before anyone knows what it becomes. Acceptance answers "was this lead as promised". Qualification answers "is this an opportunity". Collapsing the two is why a quarter of ordinary lost deals gets argued about as a lead quality failure.

| Term | Who declares it | What it asserts | Evidence behind it | What it triggers |
| --- | --- | --- | --- | --- |
| Inbound request | System | Someone submitted something | Timestamp, channel, payload | Deduplication and routing |
| MQL | Marketing or the qualification step | Meets the written criteria | Fields present in the record | Handoff to a named owner |
| Sales accepted | The assigned rep | The criteria are genuinely met | Rep confirmation plus a timestamp | The response clock and outreach |
| Sales rejected | The assigned rep | Criteria not met, with a reason | Reason code plus a short note | Fix, recycle, or disqualify |
| SQL | The assigned rep | A real opportunity exists | Conversation, need, authority, timing | Opportunity or deal record |
| Disqualified | Rep, with manager review | Permanently not a buyer | Stated permanent condition | Suppression, no recycling |

Two properties of that table matter more than the labels. Each row names one declaring party, so there is never a shared decision with no owner. And each row names evidence, so the transition can be checked by a second person later.

There is no universal definition of an MQL. No standards body publishes one, vendor templates describe their own product rather than your buyers, and a competitor's threshold encodes a sales motion you cannot see. The useful definition is the one your two teams wrote down, dated, and agreed to enforce. Everything else in this guide assumes that document exists.

## What is the difference between a stage and a label?

A stage is a state in a system: it has entry evidence, exactly one current occupant, a defined set of allowed next states, and a required next action with an owner. A label is a description somebody applies to a record because it felt right.

The test is blunt. Take a record at random, show it to two people who both know the criteria, and ask which state it is in. If they can disagree without either of them being wrong, you have a label. Labels are not useless, but they cannot carry a service commitment, they cannot drive a report anyone trusts, and they cannot support an argument between teams.

| Property | Stage | Label |
| --- | --- | --- |
| Entry condition | Written evidence, checkable in the record | Judgment applied at the time |
| Number held at once | Exactly one | Several, legitimately |
| Next action | Required, with an owner and a due time | None implied |
| Reversibility | Only through an allowed transition | Anyone can remove it |
| Reporting use | Counts and conversion between states | Segmentation and filtering |
| Suitable for MQL and SQL | Yes, this is the point | No, this is the failure mode |

MQL and SQL have to behave as stages. "Hot", "engaged", "interested" and "warm" are labels, and they belong in a score field or a tag, not in the boundary. The mechanics of stage transitions, allowed moves, and stage-driven tasks are configured once and live in [CRM automation for inbound leads](/guides/crm-automation-inbound/), which is where the transition table for the whole pipeline belongs. This guide only decides what has to be true at the two moments the record crosses between teams.

## Why does the boundary exist, and what does it cost when it is implicit?

Every team has a boundary. The question is whether it is written or whether it is renegotiated in every pipeline meeting.

An implicit boundary does not stay neutral. It drifts toward whoever is under more pressure this quarter. When marketing is short of pipeline, the definition of ready loosens. When sales is short of capacity, it tightens. Neither shift is announced, both are visible in the numbers a month later, and neither team believes the other's explanation.

The cost is concrete and it is mostly not about lead quality at all.

| Symptom | What is actually missing | Where it gets fixed |
| --- | --- | --- |
| Two teams report different qualified counts | One definition and one denominator | The written definition and the joint report |
| Reps cherry-pick and the rest go cold | An acceptance obligation with a deadline | Mutual service commitments |
| "Marketing sends junk" with no examples | A rejection record with reason codes | The rejection loop |
| Same argument every monthly review | An arbitrator and a decision record | Dispute resolution cadence |
| Good leads contacted a week late | Acceptance treated as optional | Acceptance window plus escalation |
| Nurture is a graveyard | A recycling rule with a revisit date | Recycling versus disqualification |
| Threshold changed, history now unreadable | Versioning with effective dates | Renegotiation rules |

Response lag is the symptom that shows up outside the company. A Harvard Business Review audit published in [2011](https://hbr.org/2011/03/the-short-life-of-online-sales-leads) covered 2,241 US companies and found a median first response of about 42 hours among the firms that answered at all. That study is old, it measured one sample, and it is not a current benchmark. Read it as a description of how far handoffs drift when nothing in the record obliges anyone to act by a specific time. The mechanism is unchanged: an unowned record has no deadline, and a record in dispute is unowned by definition.

## What should acceptance criteria look like as evidence rather than a score?

This is the section the scoring-threshold articles skip. A score is a compression of several signals into one number, which is useful for ranking a queue and useless as a contract, because two records with the same score can fail for completely different reasons. Sales cannot commit to accept a number. Sales can commit to accept a specified set of facts.

Write each criterion as three columns: what must be true, where the proof sits in the record, and what does not count as proof. That third column prevents most disputes before they start.

| Criterion | Evidence that satisfies it | Not accepted as evidence |
| --- | --- | --- |
| Reachable contact | Validated email or phone that survived normalization | A generic info address with no name |
| Identified organization | Company name plus domain or registration detail | Free mail address with a guessed company |
| In the served profile | Segment, size band, and region on the record | A rep's impression of the brand |
| Stated need | The buyer's own words in the form, chat, or call transcript | A content download on the topic |
| Role and access | Job title plus a named path to a decision | Seniority inferred from the email prefix |
| Timeframe signal | A date, event, or deadline the buyer mentioned | High visit frequency |
| Consent to contact | Consent record with source and timestamp | An assumption based on the channel |
| Not already in play | No open opportunity on the same account | A rep's memory |

Two rules keep this list honest. Every criterion has to be checkable by someone who was not there, otherwise it is an opinion with a table cell around it. And the list stays short enough that a rep can verify it in about a minute, because criteria that take ten minutes to check are criteria nobody checks.

Scores still belong in the system, one layer below the boundary. Fit, intent, and confidence scoring, including how to move a threshold and how to test it, is owned by [AI lead qualification](/guides/ai-lead-qualification/). Use the score to order the queue and to decide which criteria to verify first. Do not use it as the acceptance criterion, because a threshold is a dial anyone can turn quietly, and a written evidence list is not.

**Operator note.** Score thresholds, acceptance windows, and rejection rates in this guide are configurable operating choices with no industry standard behind them. Any specific number below is a starting template for a small B2B inbound team, meant to be replaced with your own after two months of your own data.

## How do you write the handoff agreement?

The agreement is a short document, not a policy binder. One page is normal and two pages is the practical limit, because nobody enforces a document they cannot hold in their head.

It contains seven parts and no more. The definitions of MQL, sales accepted, SQL, and disqualified in your own words. The acceptance criteria table. The rejection reason codes. The service commitments on both sides. The dispute process, with a named arbitrator. The joint report definition. The version history with effective dates.

| Section | Owner of the content | Question it answers | Failure if omitted |
| --- | --- | --- | --- |
| Definitions | Both, jointly | What do these four words mean here | Everyone uses vendor defaults |
| Acceptance criteria | Sales proposes, marketing agrees | What will sales accept | Quality argued case by case |
| Rejection codes | Both, jointly | What do we do with a no | Rejections vanish silently |
| Service commitments | Each side for its own | Who owes what by when | Leads sit while nobody is late |
| Dispute process | The arbitrator | Who breaks a tie, how often | The loudest voice sets policy |
| Joint report | Revenue operations | Which numbers are the numbers | Two reports, two truths |
| Version history | The arbitrator | What changed, when, why | Old cohorts become unreadable |

Sign it in the plainest sense of the word: both leaders confirm in writing, with a date, and the file lives somewhere both teams can find in ten seconds. An agreement nobody can locate is an agreement that does not exist.

One structural warning. Do not write the criteria in a way that only your current CRM configuration can express. Criteria describe buyers, and buyer definitions outlive tooling. If a criterion cannot be checked without a specific vendor feature, you have written a configuration note, and it will silently expire during your next migration. The boundary between what belongs in a hub and what belongs in the CRM is worked through in [Lead Hub vs CRM](/guides/lead-hub-vs-crm/).

## What happens when sales rejects a lead?

Rejection is the feature, not the exception. A boundary with no rejection path is a suggestion, and a rejection with no record is a lead going quietly cold with an opinion attached.

Give the rep a short controlled list. Five to nine codes is workable; twenty codes means reps pick the first plausible one and the data becomes noise. Each code names what happens next, so choosing the code is the same action as deciding the outcome.

| Reason code | Meaning | Next move | Who owns the next step |
| --- | --- | --- | --- |
| Out of profile | Segment, size, or region we do not serve | Suppress from the qualified path, review criteria | Marketing |
| No stated need | Engagement without a problem to solve | Recycle to nurture, no revisit date | Marketing |
| Wrong role | Contact has no path to a decision | Recycle, seek a second contact at the account | Marketing |
| Not this period | Real need, wrong timing | Recycle with a revisit date | Marketing |
| Unreachable | Contact data invalid after documented attempts | Return for data repair or suppression | Marketing |
| Duplicate or in play | Open opportunity already exists on the account | Attach to the existing record | Sales |
| Not a buyer | Student, job seeker, competitor, vendor | Disqualify | Sales, manager visible |
| Criteria not met | The record lacks required evidence | Return to marketing, no penalty either way | Marketing |
| Spam or test | Automated or internal submission | Discard, log the pattern | Operations |

Notice what the codes separate. "Criteria not met" and "unreachable" say the lead was not as promised, and marketing owes a fix. "Not this period" and "no stated need" say the lead was as promised and still is not an opportunity, and nobody owes anybody anything. That distinction is the whole reason the reason codes exist. Without it, every rejection reads as an accusation, reps stop rejecting to avoid the conflict, and the boundary quietly disappears.

Three process rules make rejections usable. A rejection requires the code plus one sentence of context, because the sentence is what makes the monthly sample review possible. A rejection is logged as an event with a timestamp and the rep's name, not as an overwritten field, so the history survives. And a rejection is never a silent stage change; the record moves through an allowed transition and the previous state stays visible.

**The agreement is worthless without a record of rejections.** If your CRM cannot show every rejection from the last quarter with its code, its author, and its date, then you do not have a boundary, you have a shared belief about lead quality that nobody can check.

## What does a rejection rate of zero mean?

It means the criteria stopped working, not that the leads got perfect.

A zero or near-zero rejection rate usually has one of four causes. Reps accept everything and then let weak records go cold without touching the reject button, which converts a visible disagreement into an invisible loss. The criteria are so loose that nothing could fail them. Rejection is treated as a complaint about a colleague, so nobody files one. Or acceptance is automatic after a timeout and the timeout is doing all the work.

Treat the rejection rate as a health signal with a range rather than a target. Watch three things instead of one: the rate over time, the mix of codes, and the share of rejections that later convert anyway after recycling. A stable rate with a varied code mix means the boundary is being used. A rate that drops to zero the same month a manager complains about lead quality means reps decided the argument was not worth it.

The opposite extreme is equally readable. A rejection rate that climbs past the point where marketing can act on it usually means the criteria are aspirational rather than agreed, or that a channel changed and the criteria did not. Either way the fix is a criteria review, not a louder meeting.

## When should a lead be recycled, and when should it be disqualified?

Recycling returns ownership to marketing with the history intact. Disqualification removes the record from the qualified path for good. Teams conflate them, and the result is either a nurture list full of people who will never buy or a suppression list full of people who would have bought next year.

The test is permanence. If the blocking condition can change without the buyer becoming a different organization, recycle. If it cannot, disqualify.

| Condition | Can it change | Decision | Handling |
| --- | --- | --- | --- |
| Budget cycle closed for this period | Yes, on a known date | Recycle | Revisit date, sequence paused until then |
| Contact has no authority | Yes, another person exists | Recycle | Target a second contact at the account |
| Just signed with a competitor | Yes, contracts end | Recycle | Long revisit interval, note the renewal window |
| No problem to solve today | Yes | Recycle | Standard nurture, no date |
| Company outside the served region | Rarely | Disqualify | Suppress, revisit only on a policy change |
| Not an organization we sell to at all | No | Disqualify | Suppress |
| Individual is a competitor or job seeker | No | Disqualify | Suppress, no marketing contact |
| Consent withdrawn | No | Disqualify | Suppress permanently, honor the request |

Recycling only works if something actually happens after it. A recycled lead needs an owner on the marketing side, a revisit date or a defined sequence, and a rule for re-entry: what has to change for the record to become an MQL again, and whether the previous rep gets first claim. The mechanics of the nurture path itself, the sequence design, and the re-engagement triggers belong to the [lead follow-up system](/guides/lead-follow-up-system/). This guide only decides when a record enters that path and under what conditions it leaves.

Disqualification deserves one guardrail: it is visible to a manager. Not approved in advance, which would slow everything down, but reviewable in a list. Permanent suppression applied by a rep at the end of a bad week is the single most expensive one-click action in the funnel.

## What does each side commit to, and how fast must acceptance happen?

Most handoff agreements are written as obligations on marketing only, which is why sales never signs them in practice. Write both columns or do not bother.

| Obligation | Owed by | Starting template | What breaks without it |
| --- | --- | --- | --- |
| Handoff package complete on delivery | Marketing | All required evidence fields present | Reps rebuild context by hand |
| Volume forecast for the period | Marketing | Shared before the period starts | Capacity planning is guesswork |
| Notice before criteria or channel changes | Marketing | One week before the effective date | Sales sees a quality shift with no cause |
| Accept or reject decision | Sales | Within one working hour of handoff | Rejections arrive too late to act on |
| First contact attempt | Sales | Same working day as acceptance | Speed advantage is lost |
| Reason code on every rejection | Sales | No exceptions | Quality debate has no data |
| Outcome recorded within the period | Sales | Within one working week | Conversion by cohort is unreadable |
| Sample review attendance | Both | Fixed weekly slot | Disputes accumulate |

The acceptance window is the obligation teams forget to write, and it is the one that decides whether the loop closes. A rejection that arrives four days later tells marketing nothing it can act on, because the campaign that produced the lead has already spent its budget. A rejection that arrives inside the hour is a control signal.

Acceptance speed is not the same clock as response speed. The acceptance clock measures how long a rep takes to decide whether the record meets the criteria. The response clock measures how long the buyer waits for a human. They start at the same moment and they answer different questions, and timer definitions, escalation, and the reporting that keeps them honest are owned by [SLA and speed-to-lead](/guides/sla-speed-to-lead/).

Decide the timeout behavior explicitly, because both options cost something. Auto-accept after the window keeps records moving and makes the acceptance rate meaningless. Escalate to a manager after the window preserves the signal and adds work to the manager's day. A reasonable compromise for a small team: auto-accept with the timeout recorded as its own acceptance type, so the joint report can show how much of your acceptance is actually a clock running out.

## Who arbitrates a dispute, and on what cadence?

Every agreement produces edge cases. The failure is not having disputes, it is resolving them in a meeting where the person with more authority wins and nothing is written down.

Name one arbitrator. Usually that is whoever owns revenue operations, or the manager both teams report to. The role is not to judge individual leads on demand, it is to run the sample review and decide what the agreement should say next. If your organization is still deciding who owns the operating layer between the two teams, the comparison in [lead ops vs revops](/guides/lead-ops-vs-revops/) is the shorter route than another reorganization.

| Forum | Frequency | Who attends | Input | Output |
| --- | --- | --- | --- | --- |
| Disputed lead sample | Weekly, 20 minutes | Arbitrator, one manager per side | 5 to 10 disputed records | Per-record ruling, logged |
| Reason code review | Monthly | Arbitrator, both managers | Code mix, trend, examples | Clarification or a new code |
| Criteria review | Quarterly | Arbitrator, both leaders | Rejection reasons, won-deal traits | Versioned amendment |
| Escalation, out of cycle | Rare, by exception | Arbitrator plus the two reps | One record, both accounts | Ruling plus a rule if it repeats |

The weekly sample is the mechanism that actually keeps the boundary alive. Ten records, twenty minutes, each one ruled either accepted or rejected under the current wording. Two outcomes are possible and both are useful: the wording covered the case and someone applied it wrong, which is a coaching item; or the wording did not cover the case, which is an amendment for the quarterly review. What is not allowed is a third outcome where everyone agrees it was borderline and moves on, because that is where boundaries die.

Record every ruling in one place with the date, the record id, the decision, and the reasoning in one sentence. That log becomes the training material for new reps faster than any onboarding deck, which is one reason the case library shows up again in [sales team onboarding](/guides/sales-team-onboarding-ai/).

## What goes in the joint report both teams read?

Separate reports guarantee conflict, and the reason is arithmetic rather than politics. Marketing counts leads by the month they were created. Sales counts by the month the deal moved. Marketing uses the campaign as the unit, sales uses the account. Both are correct inside their own frame, and the two numbers can never be reconciled in a meeting because the disagreement is in the denominators, not in the data.

One report, one set of definitions, one owner who publishes it. Both teams read the same file and neither team produces a private version for the same period.

| Metric | Definition | What a bad value means |
| --- | --- | --- |
| Handoffs in period | Records that entered the MQL stage | Volume context for everything below |
| Acceptance rate | Accepted over handed off | Falling means criteria drift or capacity strain |
| Time to acceptance | Handoff to accept or reject, median and 90th percentile | A long tail means the queue is being cherry-picked |
| Auto-accepted share | Accepted by timeout rather than by a rep | High means the acceptance signal is fiction |
| Rejection rate and code mix | Rejected over handed off, split by code | Zero is a symptom, a single dominant code is a criteria bug |
| Recycled and returning | Recycled records that later re-enter as MQLs | Zero means nurture is a graveyard |
| Accepted to SQL | Accepted records that became qualified opportunities | Read by cohort, never as a promise |
| Disputed and overturned | Rulings from the weekly sample, by direction | One-sided means the wording favors one team |
| Criteria version in force | Version stamped on each cohort | Mixed versions in one number means the trend is unreadable |

Two disciplines make this report survive. Report by cohort of handoff date rather than by activity date, so a change in criteria shows up where it happened. And stamp the criteria version on every record at handoff, so a comparison across a change is either honest or refused. Deeper report construction, including the difference between operational and executive views, belongs to [inbound lead reporting](/guides/inbound-lead-reporting/).

Do not publish a conversion rate between stages as a target unless you measured it in your own data over a period long enough to include your sales cycle. Rates copied from an article describe someone else's motion, and a team that starts optimizing against a borrowed number will hit it by relabeling records.

## How do you renegotiate the agreement without rewriting history?

Criteria have to change. Channels shift, the product moves upmarket, a segment turns out to churn. The failure mode is not change, it is retroactive change: the threshold moves and last quarter's counts move with it, so the trend line becomes fiction and nobody can tell whether the change helped.

Treat the agreement like a versioned document with effective dates.

| Rule | Practice | What it protects |
| --- | --- | --- |
| Versions, not edits | Each change gets a number and a date | The ability to compare periods |
| Effective from, never before | New criteria apply to records handed off after the date | Historical cohorts stay intact |
| Version stamped on the record | The criteria version is a field written at handoff | Cohort analysis after any change |
| Old records keep their label | Never rescore or relabel past handoffs | Trust in the report |
| Change reason recorded | One paragraph on why, with the evidence | Repeating a reverted change |
| Announced before it applies | Both teams notified before the effective date | Unexplained quality shifts |
| Scheduled review after | Compare the two adjacent cohorts | Change without measurement |

Quarterly is a sensible default cadence for criteria changes, with an out-of-cycle path for something urgent like a new channel producing volume the criteria never anticipated. Change one thing at a time. Two simultaneous changes to the criteria and the routing rules produce a movement in the numbers that nobody can attribute, and the next argument will be about which change to blame.

Keep the amendments short and keep the old versions readable. The most common practical question three months later is "what did we mean by in profile in the version that was live in March", and a versioned file answers it in seconds.

## Where do MQL and SQL sit relative to what is already configured?

The boundary depends on four systems that are not owned here, and pushing this guide's rules into them is how a definition project turns into a configuration mess.

**Lifecycle stages and field ownership.** The stage list, allowed transitions, deduplication, and which system may write which field are configured once for the whole pipeline in [CRM automation for inbound leads](/guides/crm-automation-inbound/). This guide adds nothing to that state machine, it only specifies what has to be true at the two crossings.

**Scoring.** Fit, intent, and confidence scoring, threshold movement, and accuracy testing are owned by [AI lead qualification](/guides/ai-lead-qualification/). The score orders the queue and suggests what to verify first; the written evidence list decides acceptance.

**Assignment.** Which rep receives a handed-off record, rule precedence, and fallback queues belong to the [lead routing playbook](/guides/lead-routing-playbook/). Note the vocabulary collision worth avoiding: routing acceptance means a rep claiming an assigned record, while acceptance here means confirming the record met the agreed criteria. Use different field names or the joint report will mix them.

**Timers.** Response clocks, escalation ladders, and after-hours behavior belong to [SLA and speed-to-lead](/guides/sla-speed-to-lead/). The acceptance window in this agreement is a separate clock with its own definition and its own escalation.

**Recycling.** Once a record goes back to marketing, the sequence design, revisit triggers, and re-engagement rules belong to the [lead follow-up system](/guides/lead-follow-up-system/).

Where all five modules connect, and which one to build first, is laid out in the [lead ops stack](/guides/lead-ops-stack/).

## When should the boundary stay informal?

Sometimes the agreement costs more than the problem. Say so out loud rather than shipping process to a team that does not need it.

| Situation | Recommendation | Minimum still worth writing |
| --- | --- | --- |
| Founder-led sales, no marketing function | Stay informal | A three-line list of who is not a fit |
| One or two reps, one channel, low volume | Stay informal | The reject reasons, written down anywhere |
| One person doing both jobs | No agreement needed | A revisit rule so nothing goes cold |
| Two or more reps, marketing owns campaigns | Write the agreement | Full document, weekly sample |
| Several channels feeding one queue | Write it before scaling spend | Criteria plus reason codes plus joint report |
| Two teams already arguing about quality | Write it this week | Start with reason codes and the sample review |
| Handoffs sit between two managers | Write it, name the arbitrator | Dispute cadence first |

The dividing line is not headcount, it is whether the person who generates the lead and the person who works it are the same person. Once they are two people with two managers and two sets of numbers, the boundary exists whether or not anyone wrote it. Before that point, one page of criteria and a habit of noting why a lead was dropped will carry you further than a process nobody has the volume to feed.

Even in the informal case, keep the rejection note. It costs one sentence per dropped lead and it is the only artifact that lets you write real criteria later instead of inventing them from memory.

## What is the practical implementation sequence?

Do not start by writing definitions in a meeting room. Start by reading what your records already say, because the criteria you can enforce are the ones your data can support.

1. **Sample fifty handoffs.** Take fifty records sales worked recently and split them into three piles: became opportunities, were worked and went nowhere, were never touched. The third pile is the one that explains your boundary problem.
2. **Extract the real criteria.** From the first pile, list what was actually present at handoff time. This becomes the draft acceptance criteria, and it is usually shorter and more concrete than what either team would have proposed from memory.
3. **Draft the codes with two reps.** Write the rejection reason codes with the people who will click them, not with managers. Keep the list under ten.
4. **Write the one-page agreement.** Definitions, criteria, codes, both service commitments, arbitrator, joint report, version one with a date.
5. **Instrument before enforcing.** Add the acceptance and rejection events, the reason code field, the criteria version field, and the acceptance timestamp. Confirm all four appear in an export.
6. **Run four weeks in observation mode.** Everyone records acceptance and rejection, nobody is accountable to a number yet. This is where you find out the codes are wrong.
7. **Start the weekly sample.** Ten disputed records, twenty minutes, rulings logged from the first session.
8. **Publish the joint report.** One file, both teams, the same numbers, from the first month.
9. **Review the criteria at the quarter.** Amend as version two with an effective date, then compare the adjacent cohorts.

Step six is the one that gets skipped and it is the one that matters. Enforcing a set of criteria you have never tested against real records produces a month of rejections that are all really complaints about the wording, and the team concludes the process failed when what failed was the draft.

Before any of this, if you cannot say how many of last quarter's handoffs were rejected, an [inbound lead audit](/guides/inbound-lead-audit/) will answer that faster than instrumenting the boundary and waiting a month for data.

## What is the operator red flag?

The red flag is a pipeline meeting where both teams present qualified counts and neither number can be traced back to a rule.

When you see it, the argument is never really about lead quality. It is about two reports built on two definitions, with no rejection record to test either one. Adding a scoring model at that moment makes it worse, because a score gives both sides a new number to disagree about without adding a single checkable fact.

The sequence out is short. Write the criteria as evidence. Add the reason codes. Publish one report. Hold the weekly sample for a month. Only then consider whether the threshold in your scoring model needs to move.

Two claims are worth repeating because they are the ones teams get backwards. An agreement with no record of rejections is decoration, since the rejection log is the only evidence that the boundary is being applied at all. And a rejection rate of zero is a symptom rather than an achievement, because it almost always means reps stopped rejecting rather than that marketing started sending perfect records.

Salesforce documents [lead assignment rules](https://help.salesforce.com/apex/HTViewHelpDoc?id=mktg.mktg_set_lead_assignment_rules.htm) with ordered entries and a default owner, and HubSpot documents [lead pipeline automation](https://knowledge.hubspot.com/object-settings/set-up-lead-pipeline-automation) where recorded outreach and a connected reply move a record forward. Both are worked examples of the same principle: movement follows recorded evidence. The NIST [AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework) makes a related point that applies well beyond AI, that automated decisions have to be traceable to be governable. If your system can move a record from MQL to accepted, you should be able to say who or what decided it, on what evidence, and under which version of the criteria. Verify current product behavior in the vendor documentation before depending on it.

Where the whole flow sits together is visible on the [OperStack system map](/), and scope options are on the [pricing page](/pricing/). If you want the criteria table, the reason codes, and the joint report definition filled in from your own last quarter of handoffs rather than drafted from scratch, that is what a [lead operations audit](/audit/?utm=guide-mql-sql) returns, along with the list of rejections nobody recorded.
