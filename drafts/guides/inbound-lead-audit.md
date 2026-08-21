---
title: "Inbound Lead Audit: Find Out Where Your Leads Are Lost"
description: "Run the inbound lead audit yourself: reconcile arrived, created, owned and worked counts, trace every gap to one layer, and rank findings by cost."
pubDate: 2026-08-21
author: Maksim Shchegolev
faq:
  - question: Why are we losing inbound leads?
    answer: "Usually not for one reason. Volume leaks at several layers at once: requests that never became records, records nobody owns, records with an owner who never called, and records worked once and abandoned. The audit exists because guessing which of those is happening produces the wrong fix roughly as often as the right one."
  - question: How do you audit a lead process?
    answer: "Pick one closed period. Count four things: requests that arrived at any channel, records created, records with a live owner, and records with logged work. Every gap between two counts belongs to a specific layer. Confirm each gap with an export you already have, then rank the findings by how much volume they affect."
  - question: How do you know if leads are being ignored?
    answer: "Count records with no logged outbound attempt at all, and separately count records with no open task and no closed outcome. Both numbers come straight from a CRM activity export. Averages hide this completely: a healthy median response time coexists comfortably with a group of records nobody ever touched."
  - question: Why do CRM lead counts not match the website?
    answer: "Because they measure different things. Analytics counts sessions and events at the edge, the CRM counts records that survived capture, integration and deduplication. Phone calls, chat apps and inbound email never appear in web analytics at all. The gap is normal; the gap you cannot explain line by line is the finding."
  - question: How often should you audit lead handling?
    answer: "Full diagnostic once a quarter, the four counts monthly, and a short exception check weekly for ownerless records and missed response windows. Also re-run the affected layers whenever something changes: a new landing page, a new channel, a routing rule edit, or a rep leaving with open records."
  - question: What should a lead audit report contain?
    answer: "One table with one row per finding: the layer, the finding in a sentence, the exact export or query that proves it, the count of affected records in the period, one named person who owns the fix, and the guide that carries it. Plus an explicit list of what you could not measure."
  - question: How do you prioritize lead process fixes?
    answer: "By affected volume and recoverability, not by how easy the fix looks. Teams that rank by effort fix the reporting layer first, because reporting is the least disruptive to change, and then wonder why nothing improved. Sort by standing, recoverable, well evidenced findings, and only then check that a fix can actually ship."
---

**An inbound lead audit** is a fixed diagnostic that answers one question with evidence: between the moment a request arrives and the moment somebody actually works it, where does volume disappear, and how much of it. It is not a conversion review and not an opinion about the funnel. It is a reconciliation of counts, layer by layer, against records your team already stores.

This guide owns the method: the symptom catalogue, the confirming evidence, and the ranking. It owns no metric definition and no repair. Every layer below names the guide that carries the fix.

## In one sentence

**An inbound lead audit compares four counts over one fixed period: requests that arrived, records created, records with a named owner, and records with real work logged. Each gap is then traced to one layer, confirmed with evidence the team already stores, ranked by what it costs, and handed to the guide that owns the fix.**

## What is an inbound lead audit, and what is it not?

An audit is a counting exercise with a fixed scope. You choose a period, assemble the evidence, produce four numbers, explain every gap between them, and stop. What makes it useful is the stopping: an audit that drifts into strategy, tooling opinions and rep performance stops being falsifiable, and an unfalsifiable audit cannot be argued with or acted on.

The confusion is worth resolving early, because most of what is sold as a lead audit answers a different question than the one you asked.

| Question | Does the audit answer it? | Where it belongs |
| --- | --- | --- |
| Did every arriving request become a record? | Yes, with counts on both sides | This guide |
| Which layer lost the volume? | Yes, with an export per layer | This guide |
| How much volume did each problem affect? | Yes, as a count in the period | This guide |
| Is our conversion rate good for our market? | No, and nobody honestly can | Your own trend, not a benchmark |
| What should our response window be? | No | [SLA and speed to lead](/guides/sla-speed-to-lead/) |
| Will fixing this pay for itself? | No | [Inbound automation ROI](/guides/inbound-automation-roi/) |
| Which channel deserves more budget? | No | [Inbound lead attribution](/guides/lead-attribution-inbound/) |
| Are the reps any good? | No, out of scope by design | [Sales team onboarding](/guides/sales-team-onboarding-ai/) |
| Is the offer wrong? | Only as an exclusion, at the end | Last section of this guide |

Two things follow from that table. The audit produces no revenue estimate, because turning a count of lost records into a revenue figure requires assumptions the audit has not tested. And the audit assigns no blame, because every finding in the catalogue below can be produced by a system with competent people in it.

## Why does an analytics review miss most of the leakage?

Because web analytics stops at the edge. Google's documentation on [traffic source dimensions](https://support.google.com/analytics/answer/11242841) describes how a session gets attributed to a source and campaign, which is exactly the right job for acquisition analysis and exactly the wrong tool for handling analysis. Analytics can tell you a form was submitted. It cannot tell you whether a record was created, whether anybody owns it, or whether a human ever called.

The second half of the blind spot is the mirror image. CRM reports count what exists in the CRM. A request that never became a record is invisible there too. So the most expensive category of loss, requests that arrived and were never entered into any system, is missing from both of the two reports every team already looks at. No standard dashboard shows it, which is why teams can watch their numbers weekly for a year and never see it.

Add the channels that never touch a website at all: inbound phone calls including the missed ones, chat apps, an old sales alias that still forwards to one person's inbox, a marketplace or partner portal that emails a notification, a referral typed directly to a rep. Each of those can be a healthy source and an invisible one at the same time.

Response lag is the visible tip of this. A Harvard Business Review audit published in [2011](https://hbr.org/2011/03/the-short-life-of-online-sales-leads) covered 2,241 US companies and found a median first response of 42 hours among the firms that answered at all. That study is old and describes one sample, so treat it as a description of how bad unmanaged handling gets rather than a current benchmark. The mechanism is what still applies: nothing in the record obliged anyone to act, and no report showed that nobody had.

## What evidence do you need, and over what period?

Gather the evidence before you form a hypothesis. The order matters, because an audit that starts from a suspicion tends to find that suspicion.

| Evidence | Where it comes from | What it proves | What it cannot prove |
| --- | --- | --- | --- |
| Channel receipts | Form provider log, phone system call log, chat export, inbox rules | A request physically arrived | That it was handled |
| CRM record export | Records created in the period with created time, source, channel, owner | What the system of record believes | What never reached it |
| Activity export | Calls, emails, messages with timestamps and direction | Whether work happened, and when | Whether the work was good |
| Field change history | CRM audit trail | Who or what changed owner, stage, source | Intent behind a change |
| Task and queue export | Open and closed tasks with due times | Whether a next action exists | Whether anyone will do it |
| Integration failure log | Dead letter queue, webhook error log | Silent technical loss | Loss with no error at all |
| Roster and calendar | Working hours, absences, headcount changes | Whether the work was possible | Whether it was attempted |
| The written rules | Routing rules, response policy, qualification definition | The standard you are auditing against | That anyone follows it |

That last row causes more failed audits than any technical problem. If there is no written routing rule, no written response window and no written qualification definition, you are not auditing, you are inventing a standard retroactively. When the rules are missing, record that as finding number one and audit against the weakest defensible version: every request gets a record, every record gets an owner, every owned record gets a first attempt.

**Choosing the period.** Use one closed period, never a rolling window, and align it to whole working weeks so weekend arrivals are not split across boundaries. It has to be long enough that your follow-up cycle completed inside it: if the sequence runs fourteen days, records created last week are still in flight and will look abandoned when they are not. It also has to be long enough to survive one absence and one campaign spike, because a single week is mostly noise. A workable starting template is one full quarter for the four counts and one recent full month for the detailed layer read, adjusted to your own cycle length rather than copied.

**Exclusions are a documented count, not a cleanup.** Test submissions, obvious spam, internal traffic and known partners all get removed, and each removal is recorded with its number and its rule. The sentence "we took out the junk" is where an audit stops being reproducible, and the size of the junk category is itself frequently a finding.

## The reconciliation check: four counts that have to line up

This is the part almost nobody runs, and it is the part that catches leaks no layer owns. Four counts, one period, same channels in each.

**A. Arrived.** Requests that reached any channel edge: form submissions in the provider's own log, inbound calls including missed and abandoned ones, chat conversations started, emails to the sales addresses, portal and marketplace notifications.

**B. Created.** Records that exist in the CRM for that period and those channels.

**C. Owned.** Of B, records with a named owner who is an active user and was not on leave for the whole window.

**D. Worked.** Of C, records with at least one logged outbound attempt inside the window your policy defines.

| Count | Where the number comes from | A gap to the previous count means | Owning guide |
| --- | --- | --- | --- |
| A, arrived | Channel side logs, assembled by hand the first time | Baseline for everything else | [Website lead capture](/guides/website-lead-capture/) |
| B, created | CRM export by created date and source | Capture failure, integration loss, or silent deduplication | [CRM automation for inbound](/guides/crm-automation-inbound/) |
| C, owned | Owner field joined to the active user list | Assignment failure or a rule with no fallback | [Lead routing playbook](/guides/lead-routing-playbook/) |
| D, worked | Activity export joined to record ids | Response failure, or work happening off system | [SLA and speed to lead](/guides/sla-speed-to-lead/) |

Count A is the hard one, and its difficulty is diagnostic in itself. If assembling "how many requests arrived last month" takes two days and five exports, you have already found a reporting layer problem before you have looked at a single record. Teams with a working [Lead Hub](/guides/lead-hub-vs-crm/) get count A for free, which is most of the argument for having one.

Two traps will corrupt the reconciliation if you let them. First, decide whether you are counting events or people, write it down, and keep it consistent across all four counts. One buyer who calls, then submits a form, then messages on chat is three events and one person, and mixing the two conventions produces gaps that look like leaks and are arithmetic. Report both numbers if you can: the event count sizes the workload, the person count sizes the market. Second, deduplication legitimately reduces B below A, so quantify it separately instead of treating it as loss. A merge log with counts turns an unexplained gap into an explained one.

Anything still unexplained after those adjustments is the number to put at the top of the report. It is the only figure in the audit that no existing dashboard in the company produces.

## How does the layer-by-layer diagnostic work?

Seven layers, in the order a request passes through them. For each one: the observable symptom, the confirming evidence from data you already hold, and the guide that owns the repair. Work them in order, because a finding at an early layer changes the denominator of every layer after it.

| Layer | The question it answers | Typical symptom | Confirm with | Owner |
| --- | --- | --- | --- | --- |
| Capture | Did the request become an event at all? | Channel log count exceeds CRM count | Daily join of provider log and CRM created dates | [Website lead capture](/guides/website-lead-capture/) |
| Identity | Is one buyer one record? | Same person on several records, split history | Normalized key duplicate count in the export | [CRM automation for inbound](/guides/crm-automation-inbound/) |
| Qualification | Is the sorting decision real and recorded? | Field empty, uniform, or written after the fact | Field history timestamps and value distribution | [AI lead qualification](/guides/ai-lead-qualification/) |
| Assignment | Does every record have a live, correct owner? | Ownerless records, skewed load, owner churn | Owner field joined to active users and absences | [Lead routing playbook](/guides/lead-routing-playbook/) |
| Response | Did the first attempt happen in the window? | Long tail and a group with no attempt at all | Arrival time to first outbound activity, full distribution | [SLA and speed to lead](/guides/sla-speed-to-lead/) |
| Follow-up | Did attempts two through N happen? | One attempt then silence, no open task | Attempt count per record, records with no task and no outcome | [Lead follow-up system](/guides/lead-follow-up-system/) |
| Reporting | Can anyone see any of the above? | Two dashboards disagree, source mostly unknown | Recompute one published number from raw exports | [Inbound lead reporting](/guides/inbound-lead-reporting/) |

## Capture and identity: did the request become a record at all?

Capture loss is the cheapest loss to find and the most expensive to leave. Nothing downstream can recover a request that exists only in a form provider's log.

| Symptom | How to confirm it with data you already have | Usual cause |
| --- | --- | --- |
| Provider log count above CRM count on specific days | Join both by day and channel, look at the daily shape not the total | Integration outage or throttling |
| Records arrive in bursts at round times | Histogram of created timestamps by minute | Batch sync, not real time delivery |
| Missed calls with no matching record | Phone system export minus CRM records with a call source | No record created for unanswered calls |
| Submissions with required fields empty | Compare provider payloads to CRM field values | Validation on the form, silent drop in the mapping |
| Requests on a channel nobody owns | List every published address, number and form endpoint, then check each one appears as a source value | An alias or number outside the process |
| Failure queue exists but is empty for weeks | Send a deliberately invalid test event | Events are not reaching the queue |

The inventory in row five is worth doing on its own even without an audit. Every published phone number, every form endpoint, every chat entry point and every email alias, listed against the source value it produces in the CRM. Anything on the list with no corresponding source value is an uncontrolled channel, and uncontrolled channels are where the largest single-cause leaks hide.

Identity loss is subtler because nothing disappears. The buyer exists, twice, and each copy holds half the history. Confirm it by normalizing keys in the export rather than in the CRM: lowercase emails, phones to one international format, company names stripped of legal suffixes. Then count exact duplicate keys inside the period, and separately count records created in the period whose key matches a record older than the period. That second number is returning buyers being treated as strangers, which is both a leak and an insult to the buyer.

If a rise in identity problems started on a specific date, look for a new landing page, a new integration or an import. Duplicates are almost always introduced by a change, not accumulated by drift.

## Qualification and assignment: did anyone become responsible?

Qualification is audited as a record, not as a judgment. You are not asking whether the calls were graded correctly, you are asking whether a decision was made, when, and on what.

| Symptom | How to confirm it | What it usually means |
| --- | --- | --- |
| The qualification field is empty on most records | Value distribution across the period | The step exists on paper only |
| Almost every record has the same value | Same distribution, look for one value above the rest | The field is being clicked through |
| Outcome written after the deal closed | Field history timestamp against close date | Backfilled reporting, no live decision |
| Disqualified within seconds of creation | Created time to qualification write | Nobody looked at the request |
| Disqualified with no reason, or one reason everywhere | Reason field distribution and blank count | No controlled vocabulary |

Definitions belong elsewhere: what counts as qualified lives in [AI lead qualification](/guides/ai-lead-qualification/), and the boundary where marketing hands to sales lives in [the MQL to SQL handoff](/guides/mql-sql-lead-handoff/). The audit only establishes whether the decision was recorded at the moment it was supposedly made.

Assignment is where the sharpest single number in the whole audit lives: the count of records with no owner. The target is zero, there is no defensible reason for it to be anything else, and almost every team has a number above zero that nobody has looked at.

| Symptom | How to confirm it | What it usually means |
| --- | --- | --- |
| Ownerless records exist | Owner field blank, counted by created week | No fallback in the routing rules |
| Owner is a deactivated user | Join owner to the active user list | Nobody reassigned a departure |
| Owner was on leave the whole window | Join owner to the absence calendar | Rules do not read availability |
| One rep holds several times another rep's volume | Records by owner by week against the stated rule | The rule is not doing what people believe |
| Owner changed three or more times before first contact | Owner change count from the field history | Two systems fighting over the field |

Salesforce documents [lead assignment rules](https://help.salesforce.com/apex/HTViewHelpDoc?id=mktg.mktg_set_lead_assignment_rules.htm) with ordered entries and a default owner for records that match nothing, which is a good reminder of what to look for during the audit: a working fallback. Check the current product behavior in the documentation rather than assuming it. Precedence, fallback queues and reassignment rules belong to the [lead routing playbook](/guides/lead-routing-playbook/).

A departure deserves its own check. When a rep leaves, their open records usually stay assigned to a disabled user and vanish from every list that filters by active owner. Run the ownerless count and the deactivated owner count as two separate numbers, because the second one hides inside a passing result for the first.

## Response and follow-up: did the work actually happen?

Measure the first response from arrival time, not from record creation time. The difference between those two timestamps is your integration delay, and measuring from creation hides exactly the leak you are hunting. If arrival time is not stored on the record, that is a finding at the capture layer and it blocks a defensible response measurement until it is fixed.

Then refuse to look at the average. Report the full distribution and three numbers beside it: the share above your policy threshold, the count of records whose first attempt never happened at all, and the same two figures for after-hours arrivals separately. A healthy median coexists comfortably with a group nobody ever touched, and the untouched group is the actual loss.

| Symptom | How to confirm it | Where the fix lives |
| --- | --- | --- |
| Bimodal response distribution | Histogram of arrival to first attempt, not the mean | [SLA and speed to lead](/guides/sla-speed-to-lead/) |
| Records with zero outbound attempts | Left join records to outbound activities, keep the nulls | [SLA and speed to lead](/guides/sla-speed-to-lead/) |
| After-hours arrivals never recover | Split the distribution by arrival hour | [SLA and speed to lead](/guides/sla-speed-to-lead/) |
| Exactly one attempt then silence | Attempt count per record, count the records sitting at one | [Lead follow-up system](/guides/lead-follow-up-system/) |
| All attempts on one channel | Attempts grouped by channel per record | [Lead follow-up system](/guides/lead-follow-up-system/) |
| No open task and no closed outcome | Records with no open task and no terminal stage | [Lead follow-up system](/guides/lead-follow-up-system/) |
| Sequence stopped after a bounce | Sequence exit reasons, count the technical exits | [Lead follow-up system](/guides/lead-follow-up-system/) |

The limbo count in row six is the most useful follow-up number that exists, and it takes one query. A record with no open task and no closed outcome is not being worked and is not being counted as lost. It is simply gone, while still appearing in the pipeline as if it were live. Teams that track nothing else from this guide should track that one number weekly.

Two honest caveats. Work that happens on a personal phone or a personal chat account is invisible to this measurement and will be reported as loss, so check whether your channel coverage is complete before accusing anyone. And a logged attempt is not proof of a real attempt, since a call logged with a three second duration is a click, not a conversation. Where the activity export carries durations, look at them.

## Reporting and attribution: can you see any of this?

The reporting layer is audited last and fixed first in only one case: when nobody can agree on the numbers, every other finding will be disputed rather than acted on.

The cleanest test takes an hour. Pick one number that leadership sees weekly, then recompute it from raw exports without touching the dashboard. If the two disagree, find out why before anything else in the report is discussed. The usual causes are a filter nobody remembers, a date field that is not the one people assume, records excluded by an owner filter, or two definitions of the same word living in two tools.

| Symptom | How to confirm it | Owner |
| --- | --- | --- |
| Two reports give different totals | Recompute one from raw exports | [Inbound lead reporting](/guides/inbound-lead-reporting/) |
| Large unknown or direct source group | Source value distribution, count the blanks | [Inbound lead attribution](/guides/lead-attribution-inbound/) |
| Original source changes over a record's life | Field history on the source field | [Inbound lead attribution](/guides/lead-attribution-inbound/) |
| Nobody can produce count A without manual work | Time how long it takes | [Inbound lead reporting](/guides/inbound-lead-reporting/) |
| No report shows ownerless or untouched records | Read the current report list | [Inbound lead reporting](/guides/inbound-lead-reporting/) |
| Same word means two things in two tools | Compare the definitions in writing | [Lead ops versus RevOps](/guides/lead-ops-vs-revops/) |

Attribution problems and handling problems are easy to confuse. A channel that appears to produce nothing may be producing requests that are lost at capture, assigned to nobody, or attributed to direct after a redirect stripped the parameters. Do not cut a channel's budget on audit evidence until the four counts for that channel specifically are clean.

## Is it a leak or a capacity problem?

These two produce almost identical dashboards. Response times rise, follow-up thins out, untouched records accumulate. The difference is whether the work was physically possible, and you settle it with arithmetic rather than argument: for each rep, records assigned per working day and attempts logged per working day, across the period, using the roster for the denominator.

| Signal | Points to a leak | Points to capacity |
| --- | --- | --- |
| When untouched records appear | Spread across all hours and days | Clustered in the peak windows |
| Shape of the response distribution | Fast group plus a never touched group | Whole distribution shifts later |
| Attempts per rep per working day | Well below what the team can sustain | At or above the sustainable ceiling |
| Which records go untouched | Arbitrary: one channel, one form, one hour | Consistently the lowest priority ones |
| Effect of adding one person | Little or none | Roughly proportional improvement |
| Ownerless count | Above zero | Zero, everything is assigned and queued |
| Arrived versus created gap | Present | Absent, capacity cannot cause it |

That last row is the reliable separator. Headcount has no effect whatsoever on whether an arriving request becomes a record, so any gap between counts A and B is a leak by definition, no matter how busy the team is. Run the reconciliation before anyone is allowed to say the word capacity.

The honest third answer is both, and it is common. A genuine capacity problem gives everyone a satisfying explanation, and under its cover the process problems stop being investigated. Report them separately: capacity findings go to a staffing or automation decision covered in [AI SDR versus human SDR](/guides/ai-sdr-vs-human-sdr/) and [inbound automation ROI](/guides/inbound-automation-roi/), leak findings go to the layer owners.

## How do you rank findings by cost instead of by ease?

The standard failure mode of a good audit: fourteen findings, the team fixes the three easiest, all three are in the reporting layer because reporting is the least disruptive thing to change, and a quarter later nothing has improved. Ranking by effort feels like momentum and reliably produces none.

Rank by cost. Cost here means affected volume, not money, and this guide will not convert one into the other. What you can compute from your own data is the number of records affected in the period, the layer at which they were lost, and whether they can still be contacted. Turning that into a revenue figure requires assumptions about close rates and deal values that the audit has not tested, and that calculation belongs to [inbound automation ROI](/guides/inbound-automation-roi/) with its assumptions written down.

| Ranking input | How you get it | The trap |
| --- | --- | --- |
| Affected volume | Count of records showing the symptom in the period | Counting one record under two findings |
| Layer position | Which layer lost it | Early loss is unconditional, not automatically largest |
| Recoverability | Can these specific records still be contacted | Old records inflate a number nobody can act on |
| Concentration | One channel, one segment, one rep, or spread everywhere | Concentrated loss is usually far cheaper to fix |
| Recurrence | Standing condition or a one-off incident | A one week outage looks huge and fixed itself |
| Evidence strength | How directly the export proves the claim | A guessed large finding outranking a proven medium one |

Do not build a weighted score out of those six. Sort by affected volume among findings that are standing, recoverable and well evidenced, break ties by evidence strength, and only then apply the practical filter: does this fix have a named owner, and can it ship this quarter. Findings that fail the practical filter stay on the list with a note, they do not get quietly reordered to the bottom.

One deliberate exception to volume ranking. A finding that makes other findings unmeasurable jumps the queue regardless of its own size. Missing arrival timestamps, an unwritten routing rule and a source field that gets overwritten are all in that category: until they are fixed, the next audit produces the same uncertainty as this one.

## What does the audit output look like?

One table, one row per finding, and nothing else that matters. Adjectives, tool recommendations and named individuals as causes all belong outside the document.

| Field | What goes in it | Rule |
| --- | --- | --- |
| ID | A stable reference number | Never renumber between audits |
| Layer | One of the seven | Exactly one, no shared findings |
| Finding | One sentence, observable | No causes, no adjectives |
| Evidence | The named export or query | A skeptic must be able to re-run it |
| Affected count | Records in the period | State event or person basis |
| Recoverable | Yes, no, or partly | Drives the ranking |
| Fix owner | One person by name | Never a team, never a role |
| Owning guide | The guide that carries the repair | One link, not a plan |
| Status | Open, in progress, verified closed | Closed requires a re-measurement |

A filled row reads like this, with placeholder figures standing in for your own counts rather than any real result: **F3, capture layer. Requests arriving on the partner portal channel do not create records on days when the nightly sync fails. Evidence: portal export joined to CRM created dates by day, period April to June, script in the audit folder. Affected count: the daily gaps summed over the period, on an event basis. Recoverable: partly, contacts are still in the portal. Fix owner: named operations engineer. Owning guide: website lead capture. Status: open.**

Close the document with a section titled what we could not measure. Channels with no exportable log, work done on personal devices, a period where the audit trail retention had already expired, records deleted before the export. That section prevents the report from claiming more certainty than it has, and it usually turns into next quarter's instrumentation work.

**Operator note.** Circulating the findings table without a walkthrough is how audits die. The first reaction to a large capture finding is disbelief, and disbelief aimed at the numbers rather than the process buries the whole report. Present count A, count B and the join that produced the gap, in that order, and let people re-run it themselves. A finding somebody reproduced is a finding somebody will fix.

## When is the diagnosis not a leak at all?

Sometimes the four counts line up, response times sit inside the policy, follow-up completes, and revenue is still short. That is a real and valuable result. It means the problem is upstream of handling, and the audit has just eliminated the most expensive assumption in the business.

| Observation | Likely diagnosis | Where it goes next |
| --- | --- | --- |
| Handling clean, volume adequate, most losses cite price or fit | Offer or targeting mismatch | Loss reason analysis and ICP definition, not lead ops |
| Handling clean, volume adequate, quality poor on every channel | Demand quality problem | [AEO and GEO for inbound](/guides/aeo-geo-inbound-marketing/) and channel mix |
| Handling clean, volume falling | Demand volume problem | Marketing programs, [programmatic SEO](/guides/programmatic-seo-lead-gen/) |
| One channel produces volume that never qualifies | Source quality, not handling | [Attribution](/guides/lead-attribution-inbound/) plus the qualification definition |
| Everything measurable is fine but nobody trusts the numbers | Definition problem | [Inbound lead reporting](/guides/inbound-lead-reporting/) |
| Sales cycle lengthened with no handling change | Market or pricing, outside this audit | Commercial review |

The fastest single test is the loss reason distribution. If the leading reason is no response from the client or could not reach, the diagnosis is handling and this guide applies. If the leading reasons are price, timing or wrong fit, more speed will not help, and rebuilding the routing rules is expensive theater. This only works if loss reasons come from a controlled list; free text loss reasons tell you nothing, which is itself a finding for [CRM automation](/guides/crm-automation-inbound/).

## How do you run this as a recurring review?

The first audit is expensive because you are building the evidence pipeline, not because the analysis is hard. Keep every export as a saved query, and the second one is a reading rather than a project.

| Cadence | What runs | Who | Output |
| --- | --- | --- | --- |
| Weekly, fifteen minutes | Ownerless count, records with no next task, failure queue depth, records past the response window | Operations | Exceptions cleared the same day |
| Monthly | The four counts for the closed month, split by channel | Operations with the sales lead | Drift check against previous months |
| Quarterly | Full seven layer diagnostic, re-ranked findings, verification that last quarter's fixes held | Named audit owner | Findings table |
| On change | Targeted re-run of the affected layers only | Whoever made the change | Pass or a new finding |

The on-change row earns its place. Most leaks are introduced rather than inherited: a new landing page pointing at a different endpoint, a routing rule edited to cover a holiday and never reverted, a rep leaving with open records, a CRM field renamed, a chat widget swapped. Tie a short re-run to each of those events and the quarterly audit stops finding month old problems.

Verification is not optional and is usually skipped. A fix is closed when the same query returns a different number over a later period, not when someone says the change shipped. Keep the original query, run it again, record both numbers in the findings row.

Give the audit one named owner. In small teams that is whoever runs operations, in larger ones it is a defined function, and the boundary between that function and revenue operations is drawn in [lead ops versus RevOps](/guides/lead-ops-vs-revops/).

## What to fix first, and where each fix lives?

Fix in layer order, not in severity order, with one exception: anything that makes other findings unmeasurable goes first. After that, capture before ownership, ownership before clocks, clocks before follow-up, follow-up before reporting polish. The logic is arithmetic. Improving follow-up on records that were never created changes nothing, and every downstream percentage is computed against a denominator the capture layer defines.

1. **Instrumentation.** Arrival timestamps, a source value per channel, a failure queue somebody reads, and the routing and response rules written down.
2. **Capture.** Close the gap between counts A and B, channel by channel, starting with the largest. Owned by [website lead capture](/guides/website-lead-capture/).
3. **Identity.** Deduplicate before assignment so ownership and history stop splitting. Owned by [CRM automation for inbound](/guides/crm-automation-inbound/).
4. **Ownership.** Drive the ownerless count to zero and add a fallback for every rule. Owned by the [lead routing playbook](/guides/lead-routing-playbook/).
5. **Response.** Start the clock at arrival and act on the tail, not the median. Owned by [SLA and speed to lead](/guides/sla-speed-to-lead/).
6. **Follow-up.** Eliminate the limbo count: no record without either an open task or a closed outcome. Owned by the [lead follow-up system](/guides/lead-follow-up-system/).
7. **Reporting.** Publish the four counts as a standing report so the next audit is a reading. Owned by [inbound lead reporting](/guides/inbound-lead-reporting/).
8. **Re-measure.** Re-run every query behind a closed finding on a later period and record the new number.

If several layers fail at once, the underlying question is architectural rather than a sequence of repairs, and [Lead Hub versus CRM](/guides/lead-hub-vs-crm/) is where that boundary gets decided. The full module map sits in the [lead ops stack](/guides/lead-ops-stack/), the interactive version of the same flow is on the [OperStack home page](/), and scope options are on the [pricing page](/pricing/).

Run it yourself first. The method above uses nothing you do not already have, and a team that produces its own four counts argues about fixes instead of about whether there is a problem. If assembling count A is the part that stalls you, a [lead operations audit](/audit/?utm=guide-lead-audit) returns the four counts and the ranked findings table built from your own exports, with the queries handed over so you can re-run them next quarter without us.
