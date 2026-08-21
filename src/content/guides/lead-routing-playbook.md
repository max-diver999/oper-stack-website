---
title: "Lead Routing Playbook: Rule Order, Owners, Fallbacks"
description: "How to assign inbound leads reliably: rule precedence, dedupe, account ownership, round robin and capacity, fallback queues, retries, and event logs."
pubDate: 2026-07-18
updatedDate: 2026-08-21
author: Maksim Shchegolev
faq:
  - question: What is lead routing?
    answer: "Lead routing is the rule set that decides who owns each qualified inbound lead, and when that ownership transfers. A complete route normalizes the record, removes duplicates, checks existing account ownership, filters for eligible reps, distributes among the remainder, and writes the reason for the decision it made."
  - question: What is the correct order of routing rules?
    answer: "Normalize first, then deduplicate, then match existing account or deal ownership, then filter eligibility, then distribute, then fall back. Distribution runs last among the surviving candidates because rotation applied too early overwrites relationships that already exist and splits one buyer across two owners."
  - question: Should account ownership override round robin?
    answer: "Yes in almost every B2B setup. If a company already has an owner or an open deal, rotation creates a second conversation the buyer never asked for. Route the record to the existing owner and let the rotation counter skip that turn rather than assigning a duplicate."
  - question: When is round robin actually fair?
    answer: "Round robin is fair when reps are interchangeable in skill, language, and deal size, and when open workload is tracked separately. Equal assignment counts are not equal workload, so pair rotation with a capacity cap and review acceptance and outcome rates by rep before calling it balanced."
  - question: What happens when no routing rule matches?
    answer: "The record goes to a named fallback queue that has a real owner, working hours, and a service target. It never goes to a null owner, a shared inbox, or the newest rep. Every fallback entry keeps its reason code so the gap in eligibility data can be fixed."
  - question: How do you test routing before launch?
    answer: "Build a synthetic fixture for every rule, conflict, empty roster, duplicate, and failed write, then assert the expected owner, fallback, and reason code for each. Run the same matrix after every rule version change, and keep a rollback path that restores the previous version without manual reassignment."
  - question: How should time off affect assignment?
    answer: "Availability belongs in the roster, not in a chat status. A dated absence removes the rep from the eligible pool, moves open qualified work to a named backup before the absence starts, and pauses the rotation slot so the counter does not silently hand leads to an empty seat."
---

**Lead routing** turns a qualified inbound event into accountable ownership. A reliable route normalizes the record, resolves identity, respects existing account ownership, filters for eligible reps, distributes among the survivors, and records why it made that choice. If the preferred owner cannot take the lead, a defined fallback and a running clock keep the record from disappearing into an inbox.

This playbook owns rule precedence, ownership, and fallback queues. [AI qualification](/guides/ai-lead-qualification/) supplies the fit and intent facts that routing reads. [CRM automation](/guides/crm-automation-inbound/) stores the resulting owner, stage, task, and history. [SLA and speed-to-lead](/guides/sla-speed-to-lead/) defines the timers and escalation ladder that measure what happens after the assignment lands.

## In one sentence

**Lead routing is the enforced rule set that decides who owns each qualified inbound lead. Rules run in a fixed order: remove duplicates, match an existing account owner, filter for eligible reps, distribute among the remaining candidates, then send anything unmatched to a staffed fallback queue with a recorded reason.**

## What are the symptoms of routing leakage?

Routing leakage appears when a lead exists but no eligible human is accountable for the next action. Ownership, acceptance, and fallback are three separate events, and each one can fail on its own. A CRM owner field can hold a valid name while that rep is on leave, over capacity, or simply never notified.

| Symptom | Likely cause | First thing to check |
| --- | --- | --- |
| Buyer replied in chat, no CRM owner | Channel bypassed the hub | Event source list vs assigned records |
| Same buyer assigned to two reps | No dedupe key before distribution | Identity fields and match window |
| Senior rep flooded, juniors idle | Skill rule matches too broadly | Threshold values and candidate pool size |
| Silence outside working hours | No on-call roster or scheduled callback | Roster calendar and fallback owner |
| Paid leads slower than organic | Source not read before assignment | Source fields present at route time |
| Reps pick leads from a shared view | Rotation not enforced, only displayed | Assignment events vs manual claims |
| Fallback queue growing weekly | Eligibility data incomplete | Reason codes on fallback entries |

Any repeat pattern here deserves investigation before more traffic is bought. Routing failures scale with volume, so a leak that costs a few records per week at the current spend becomes a structural loss after a campaign increase.

## How should data be normalized before routing?

Routing rules are only as good as the fields they read. If the country arrives as `RU`, `Russia`, and `рф` in the same week, a territory rule silently drops two of the three. Normalization happens before the first rule runs, and it is a routing responsibility even when the cleanup logic is shared with [CRM automation](/guides/crm-automation-inbound/).

A workable normalization pass does five things:

1. **Trim and canonicalize identity fields.** Lowercase the email, strip plus-addressing where policy allows, convert phone numbers to a single international format, and keep the raw value alongside the normalized one.
2. **Resolve the company.** Extract the email domain, drop free-mail domains from account matching, and keep an alias list so `acme.com` and `acme.co.uk` map to the same account when the business says they should.
3. **Map controlled vocabularies.** Country, language, product line, and source values map to a fixed enum. Anything unmapped is flagged, not guessed.
4. **Attach the source facts.** Original source, latest source, campaign, and channel arrive with the record, following the model in [lead attribution](/guides/lead-attribution-inbound/). A route that reads source cannot wait for a nightly attribution job.
5. **Stamp the qualification verdict.** Fit, intent, and confidence come from [AI qualification](/guides/ai-lead-qualification/) as explicit fields, never as free text a rule has to parse.

If any of these fields is missing, the route should record which one was missing rather than substituting a default. Missing-field reason codes are the fastest way to find out that a form change broke a rule three weeks ago.

## What is the correct precedence for routing rules?

Precedence is the core of this playbook. Most broken routing setups are not missing rules, they run good rules in the wrong order. The order below reads from most binding to least binding: each step can only narrow the candidate pool that the next step receives.

| Order | Step | Question it answers | Main inputs | What breaks if it runs later |
| --- | --- | --- | --- | --- |
| 1 | Deduplication | Have we seen this person already? | Normalized email, phone, CRM contact id, session id | Two reps work one buyer, both counters advance |
| 2 | Account match | Does this company already have an owner? | Domain, account id, open deal, recent closed deal | Rotation overwrites a live relationship |
| 3 | Eligibility | Who is allowed to take this lead right now? | Active status, certification, language, territory, schedule, capacity | Leads land on absent or untrained reps |
| 4 | Distribution | Which eligible rep gets it? | Rotation state, weights, skill tags, open workload | Distribution decides things ownership should have decided |
| 5 | Fallback | What happens when nothing matched? | Queue definition, reason code | Records stall with a null or generic owner |

### Step 1: deduplication and re-entry

Buyers return. Without a dedupe step, routing manufactures twins. Match in priority order: known CRM contact id, then normalized email or phone, then a chat session already linked to an identity. Define the match window explicitly, because "same person, six months later" and "same person, ten minutes later" are different business cases.

Re-entry rules worth writing down: an existing open deal returns to its current owner; a recently closed lost record goes to manager review or to the prior owner according to policy; a record still in nurture resumes its sequence instead of triggering a fresh assignment contest.

### Step 2: account and deal ownership

Company ownership beats rotation in nearly every B2B setup. Match by domain against named accounts, then by open deal, then by recent activity. When two owners have a claim, the tie goes to a named manager queue, not to whoever the rotation pointer happens to indicate. Ownership conflicts are a commercial decision and should surface as one.

### Step 3: eligibility filters

Eligibility answers a narrow question: who is allowed to receive this lead at this moment. Typical filters are active status, language, territory, product certification, working schedule, and current capacity. Eligibility is a filter, never a ranking. It removes candidates; it does not choose among them.

Certification belongs to [sales onboarding](/guides/sales-team-onboarding-ai/), and this guide does not restate its competency model. What routing needs is one machine-readable flag per rep, set by that program, that the eligibility step reads: a rep without the flag stays out of the pool for live qualified leads and can still receive nurture or shadow records. When the onboarding program changes its certification criteria, routing changes nothing, because it only reads the flag.

### Step 4: distribution

Only now does the system pick among equals. The patterns are covered in the next section. The important structural point is that distribution operates on a candidate pool that identity, ownership, and eligibility have already shaped.

### Step 5: fallback

If the pool is empty, the record does not get forced onto the least-bad candidate. It goes to a named queue with a reason code. A rising fallback rate is a signal about data quality, not a reason to loosen the rules.

### Resolving conflicts inside a step

Two rules inside the same step can both match. Pick one convention and apply it everywhere: most specific rule wins, and where specificity ties, the earlier rule in the ordered list wins. Then add a deterministic tie-break for distribution, such as the longest idle eligible rep. Deterministic tie-breaks matter more than they sound: they make the same fixture produce the same result in testing, which is what makes a regression visible.

## What is the difference between assignment, acceptance, and first meaningful touch?

Routing is not complete when an owner id is written. Three distinct events deserve three distinct timestamps, because each has a different failure mode and a different owner.

| Event | Definition | Proves | Common false positive |
| --- | --- | --- | --- |
| Assigned | Rule set selected an owner and wrote it | The rules ran | Owner written to an absent rep |
| Notified | Owner received the alert in a channel they read | Delivery worked | Message sent to a muted channel |
| Accepted | Owner confirmed responsibility explicitly | A human took the record | Bulk acceptance clicks with no follow-up |
| First touch | Any outbound attempt was made | Activity exists | Automated email counted as a call |
| First meaningful touch | A two-way exchange or a genuine live attempt | The buyer was actually reached | Voicemail logged as a conversation |

Teams that measure only the first event report excellent routing while buyers wait. Teams that measure only the last event cannot tell whether the delay was a rules problem or a staffing problem. Keep all of them and report the gaps between them: assignment latency is an engineering metric, acceptance latency is a management metric, and time to first meaningful touch is the one the buyer experiences.

## Which distribution patterns should teams use?

Most teams end up with a hybrid. The table compares the patterns on the terms that matter when choosing between them.

| Pattern | Fair when | Required data | Fairness check | Typical failure |
| --- | --- | --- | --- | --- |
| Round robin | Reps are interchangeable | Active roster, rotation pointer | Assignment counts by rep | Inactive reps left in the pool |
| Weighted rotation | Seniority should shift volume, not monopolize it | Weights per rep | Counts against weights | Weights set once and never reviewed |
| Skill based | Deal size, language, or product needs a specialist | Skill tags, thresholds | Pool size per skill | Threshold so loose that everything is senior |
| Territory | Local presence, hours, or compliance matter | Normalized country, region | Coverage gaps by territory | No route for uncovered regions |
| Capacity based | Open workload varies a lot per rep | Open work count, cap per rep | Open work spread | Cap counted on records, not on active work |
| Account ownership | Named accounts and repeat buyers exist | Account map, deal state | Conflicts per month | Domain map stale after renames |

**Round robin** is the default answer only for genuinely homogeneous teams. It distributes turns, not effort. A rep with eight stalled opportunities and a rep with one both take their turn, which is why rotation should be paired with a capacity cap that skips a rep who is already over the agreed number of open qualified records. That cap is an operating setting chosen from work type and team size, not an industry constant.

**Skill based** routing fails in a predictable way. A threshold gets set generously so senior reps see more good leads, and within a quarter the senior queue is the only queue. Review pool sizes per skill monthly and treat a shrinking junior pool as a routing defect.

**Territory** routing needs an explicit answer for uncovered regions before launch, not after the first miss.

**Source based** splits deserve a note. Paid, partner, and organic records often carry different service targets and different rosters. Keep the source facts on the record before assignment so the rule reads a field rather than guessing from a landing page. When [programmatic SEO](/guides/programmatic-seo-lead-gen/) launches new page clusters, each cluster needs a roster and a service tier assigned at launch. A cluster with no routing row inherits the generic organic path, which is exactly the case where underperformance hides, because the records get handled but nobody can separate them in reporting.

## How should fallback queues and retries work?

A fallback queue is a real staffed destination with an owner, working hours, a service target, and an escalation contact. It is not a null value, a generic admin user, or a shared inbox nobody opens. The default route should receive precisely the cases the rules cannot classify: unknown language, uncovered region, conflicting account ownership, empty specialist roster, or malformed qualification data.

Retries are the other half. Assignment crosses system boundaries, and boundaries fail.

| Failure | Retry policy | Idempotency key | Terminal action |
| --- | --- | --- | --- |
| CRM write times out | Bounded attempts with growing delay | Lead id plus rule version | Operator alert, record held in queue |
| CRM returns rate limit | Delayed retry inside the same window | Same as above | Batch pause, alert if window exceeded |
| Owner rejects or does not accept | No technical retry | Assignment id | Next eligible candidate, then fallback |
| Notification channel down | Retry through a second channel | Notification id | Manager alert |
| Roster returns empty pool | No retry | Not applicable | Fallback queue with reason code |
| Duplicate detected mid-retry | Abort the retry | Dedupe key | Link to existing record, no new owner |

The idempotency key is what stops a retry storm from producing five assignments for one lead. Without it, a slow CRM turns into a duplicate-ownership incident, and the reps involved learn to distrust the system.

Escalation after a missed acceptance or a missed response target belongs to [SLA and speed-to-lead](/guides/sla-speed-to-lead/), which defines the timers, the ladder, and the reporting. Routing's obligation is narrower: it must expose the acceptance event that the escalation ladder triggers on, and it must guarantee a staffed destination when the ladder fires. An escalation rule pointing at an unstaffed queue produces alerts, not answers.

## Where should routing rules live: CRM or a dedicated layer?

| Layer | Owns | Does not own |
| --- | --- | --- |
| Lead Hub | Rule order, roster state, dedupe, assignment events, fallback | Deal progression and closing |
| CRM | Pipeline stages, tasks, rep interface, activity history | Cross-channel source of truth |
| Chat and messaging tools | Conversation interface, transcripts | Owner of record |

Native CRM tooling can execute part or all of the routing when its behavior meets the policy. HubSpot documents a [record owner rotation action](https://knowledge.hubspot.com/records/how-to-set-a-record-owner) and notes that rotation counts are tied to each rotation action rather than to total workload, which matters when several workflows rotate the same team. Salesforce documents [lead assignment rules](https://help.salesforce.com/apex/HTViewHelpDoc?id=mktg.mktg_set_lead_assignment_rules.htm) that assign owners from ordered criteria entries.

Two questions decide whether a dedicated layer is worth it: do leads arrive through channels the CRM does not see, and does the team need assignment state that survives a CRM record being merged or deleted. If both answers are no, native rules are usually enough. See [Lead Hub vs CRM](/guides/lead-hub-vs-crm/) for the boundary in detail. Hub-led routing is one option, not a universal requirement, and the rule specification should stay tool independent either way.

## How should availability, working hours, and time off affect routing?

Availability is roster data. When it lives in a chat status or in a manager's head, the rules cannot read it, and leads land on empty seats.

| State | Effect on the pool | Effect on open work | New assignments |
| --- | --- | --- | --- |
| Inside working hours | Eligible | Normal | Yes |
| Outside working hours | Paused for the schedule | On-call handles urgent | On-call roster or scheduled callback |
| Planned time off, dated | Removed for the date range | Reassigned to a named backup before the first day | No |
| Unplanned absence | Removed same day | Reassigned by the manager that day | No |
| Public holiday | Calendar-driven pause | Reduced roster covers | Reduced roster only |
| Over capacity cap | Skipped, remains active | Unchanged | Skipped until under the cap |

Three rules keep this honest. Absences are dated and entered in advance, so open qualified work moves before the rep leaves rather than after a buyer complains. The rotation slot pauses instead of being deleted, so the pointer does not drift. And extending a service target outside working hours is only acceptable when the buyer was told what to expect and a real backup exists, which is a service policy decision covered in [SLA and speed-to-lead](/guides/sla-speed-to-lead/).

## What should the routing event log and rule versions record?

Routing decisions are only debuggable if the system wrote down what it decided and why. One event per decision step, not one event per record.

| Field | Example value (illustrative) | Why it matters |
| --- | --- | --- |
| `event_id` | `evt_9f31` | Deduplicates the log itself |
| `lead_id` | `ld_88214` | Joins to CRM and attribution |
| `rule_version` | `2026-08-14.3` | Tells you which logic ran |
| `step` | `account_match` | Locates the decision in the precedence chain |
| `decision` | `matched` / `no_match` / `skipped` | Makes a step outcome countable |
| `candidate_pool` | `["r12","r18"]` | Shows what eligibility left behind |
| `selected_owner` | `r18` | The assignment itself |
| `reason_code` | `existing_open_deal` | Turns explanations into statistics |
| `actor` | `system` / `manager:u4` | Separates automation from override |
| `previous_owner` | `r07` | Makes reassignment auditable |
| `timestamps` | assigned, notified, accepted | Feeds the latency metrics above |

Reason codes are the part teams skip and later regret. A free-text note cannot be counted; a code can, and the monthly distribution of codes is the most useful routing report there is.

Rule versions get the same discipline as code. Every change carries a version identifier, an approver, a date, and a rollback path.

| Version | Change | Approver role | Rollback path |
| --- | --- | --- | --- |
| 1.0 | Initial launch, one channel | Revenue operations | Disable automated assignment, manual queue |
| 1.1 | Add paid roster and source split | Sales manager | Revert to previous rule version |
| 1.2 | Add certification gate | Revenue operations | Disable the gate flag, keep the rest |
| 1.3 | Add capacity cap to rotation | Revenue operations | Raise cap to unlimited, no redeploy |

Note the pattern in the rollback column: the best rollback path is a setting change, not a redeploy. Design rules so each new behavior can be neutralized independently.

## How should routing be tested before launch and sampled afterwards?

Routing is tested with fixtures, not opinions. Build a synthetic case for every rule, every conflict, and every failure mode, and assert the owner, the fallback, and the reason code.

| Case | Fixture | Expected result | What it protects |
| --- | --- | --- | --- |
| Clean new lead | Unknown domain, complete fields | Next eligible rep by rotation | Baseline distribution |
| Duplicate inside the match window | Same email twice within minutes | One assignment, second linked | Dedupe before distribution |
| Known account, new contact | Domain matches owned account | Existing account owner | Ownership above rotation |
| Ownership conflict | Two owners claim the domain | Manager queue, conflict code | Silent overwrite prevention |
| Uncertified rep is next in rotation | Certification flag absent | Skipped, next candidate | Eligibility as a filter |
| Rep over capacity cap | Open work above cap | Skipped, still active | Cap logic correctness |
| Empty specialist roster | No eligible language match | Fallback queue, roster code | No forced bad assignment |
| CRM write failure | API error injected | Retry, then operator alert | Idempotency, no twins |
| Absence starting tomorrow | Dated absence entered | Open work reassigned, slot paused | Availability handling |

Run the whole matrix on every rule version, not only the changed rule. Precedence changes have effects two steps away, and that is precisely what a full matrix catches.

After launch, sample real cases from every rule and exception type on a fixed cadence. For each sampled case record whether the expected route matched the actual route, whether the stage and source fields were correct at entry, whether the service target was met, and whether a duplicate was created. Classify the cause of every mismatch instead of just counting mismatches. The release gate should come from business risk: high-value or regulated routes can require every critical case to pass before expansion, while a low-risk nurture route can tolerate a known gap with a dated fix.

Load behavior deserves one dedicated rehearsal before a campaign spike. Simulate concurrent events above the expected peak in a staging environment and verify idempotency, queue ordering, delayed jobs, rate-limit handling, and whether the operator alert actually fires. Choose the event count from your own traffic forecast plus a safety margin rather than copying a number from a vendor page.

Rollback is part of the test plan. Agree in advance on the triggers that revert a rule version: unowned qualified records appearing after a release, a fallback rate that jumps beyond its normal band, duplicate assignments in the log, or acceptance latency degrading across the whole roster. Write down who can pull the trigger and how affected records get replayed, because deciding that during an incident produces manual reassignment and lost history.

## How should international and multi-language inbound be routed?

Cross-border inbound fails on language before it fails on geography. A buyer routed to a rep who cannot hold the conversation is worse off than a buyer who waits an hour for the right one.

| Signal | Priority | Route | Fallback when no match |
| --- | --- | --- | --- |
| Explicit language selection | 1 | Roster with that language skill | Labeled shared-language queue |
| Content language of the request | 2 | Same as above, lower confidence | Labeled shared-language queue |
| Phone country code | 3 | Territory roster | Regional queue |
| Form or profile country | 4 | Territory roster | Regional queue |
| Time zone at submission | 5 | Working-hours filter, not a router | On-call or scheduled callback |

Two rules keep this workable. Language skill is a hard eligibility filter, so records never rotate into a mismatch "for practice". Local quiet hours are respected even when headquarters is awake, with a scheduled callback rather than a silent gap.

When nothing matches, the record goes to a clearly labeled shared-language queue rather than to a random rep, and the label carries into reporting. That label is the point: a growing unmatched-language queue is a hiring and coverage signal that marketing and sales management need to see, and it disappears the moment those records are quietly absorbed into the general pool. Currency, tax, and compliance questions branch during [AI qualification](/guides/ai-lead-qualification/), before assignment, so the route reads a decided field.

## Which metrics expose assignment failures?

| Metric | Definition | Direction | Read by |
| --- | --- | --- | --- |
| Time to assign | Qualified to owner written, median and high percentile | Down | Operations |
| Time to accept | Owner written to explicit acceptance | Down, without bulk clicking | Sales management |
| Unowned qualified records | Count with no accountable owner at day end | Zero | Operations |
| Fallback rate | Share of records reaching the default queue | Explainable and falling | Operations |
| Duplicate assignment rate | Records with two owner events | Down | Operations |
| Override rate | Manager reassignments per period | Stable, spikes investigated | Sales management |
| Assignment spread | Distribution of assignments against weights | Within agreed band | Sales management |
| Outcome by roster | Conversion by route, compared across fair pools | Compared, not ranked blindly | Leadership |
| Service target breach by source | Missed targets split by paid, organic, partner | Down | Leadership |

Leadership does not need all nine. The leadership view is a subset of the same numbers, not a separate report built from different definitions: median time to assign, unowned records at the end of the week, breach rate by source, outcome by roster as a fairness check, and override count with the top reasons. Reporting definitions that differ between the operations view and the leadership slide are how two teams end up arguing about whose number is wrong instead of fixing the route.

### How should service targets be set?

Set targets from buyer intent, channel expectation, staffing reality, and risk, then verify the roster can actually meet them. The original [MIT and InsideSales study](https://www.onecavo.com/wp-content/uploads/2015/11/MIT-InsideSales.com_Lead-Response-Management.pdf) found that delay reduced contact and qualification odds for web leads in that dataset, and [Harvard Business Review](https://hbr.org/2011/03/the-short-life-of-online-sales-leads) reported a 2011 audit of 2,241 companies where the average response among those that answered was around 42 hours. Both are useful for direction and neither defines the right timer for a specific modern B2B workflow. Measure your own assignment, acceptance, and first meaningful touch separately, pick a target the staffed roster can hold, and define the fallback before enforcing anything.

## What is the operator red flag?

The red flag is an assignment flow with no observable acceptance event. A successful workflow run or a CRM field update does not prove that a human saw the lead. If the system cannot distinguish "assigned" from "accepted", it cannot enforce a meaningful fallback, and every downstream service metric is measuring the automation instead of the team.

A concrete failure mode worth recognizing. A team enables rotation across six reps and reports even assignment counts for a month, so routing is declared solved. Two reps are quietly on extended leave, their chat status says away, and the roster was never updated. Their turns are being taken and the records sit unopened until a manager notices a customer complaint. The counts looked perfect because the metric measured the rotation pointer, not the humans.

Other patterns that repeat across audits:

- **Routing logic living in a bot prompt.** Prompts change without review; the rule set must be the source of truth.
- **CRM views presented as routing.** A filter displays records, it does not assign them or start a clock.
- **Manual announcements in a group chat.** No audit trail, no acceptance event, no fallback.
- **Per-rep personal messaging numbers.** Breaks attribution, breaks backup, and the history leaves with the rep.
- **Nurture records left unowned.** Nurture still needs an accountable owner for follow-up and compliance.
- **The manager queue used as a permanent fallback.** Fine for exceptions, but routine no-match traffic there hides broken eligibility data.
- **Round robin described as capacity balancing.** Equal counts are not equal load; track open work separately.

## How do you design and roll out a routing change?

Before a significant change, run one focused working session with revenue operations, sales management, marketing operations, and a rep who actually works the queue daily. The output is a versioned routing specification: the current de facto route including manual picking and manager interventions, the target rule order, the roster with eligibility flags, the fallback owners, and the list of unresolved ownership conflicts. Anything unresolved in that session becomes a fallback reason code rather than an assumption buried in a rule.

Then implement in this order:

1. Export a representative sample of inbound events with source, identity, assignment, acceptance, activity, and outcome. Measure the current route before redesigning it.
2. Fix normalization for identity, company, territory, language, and source fields.
3. Define dedupe keys and the match window, and agree on re-entry policy for open, lost, and nurture records.
4. Define account and deal ownership precedence, including the conflict destination.
5. Define eligibility fields as flags: active, certified, language, territory, schedule, capacity.
6. Order distribution rules from most specific to default, with a deterministic tie-break.
7. Define the fallback queue, its owner, its hours, and its reason codes.
8. Align CRM owner, stage, task, and audit fields, and add the acceptance event if it does not exist.
9. Build the synthetic test matrix and run it against the first rule version.
10. Pilot one channel with a small roster, review every fallback entry and every override by hand.
11. Expand channels only after the fallback queue and the operator alerts have been proven by a real failure.

The pilot step is the one teams skip. Reviewing every exception by hand for two weeks on one channel surfaces the data problems that no fixture predicted, and it does so while the volume is small enough to fix by hand.

## Which related guides complete the route?

Start with the [lead ops stack](/guides/lead-ops-stack/) pillar for the full system map, then [AI lead qualification](/guides/ai-lead-qualification/) for the evidence routing reads, [CRM automation](/guides/crm-automation-inbound/) for the lifecycle writes that follow assignment, and [Lead Hub vs CRM](/guides/lead-hub-vs-crm/) for the system boundary. [SLA and speed-to-lead](/guides/sla-speed-to-lead/) covers timers and escalation, [lead attribution](/guides/lead-attribution-inbound/) covers the source fields a route depends on, [sales onboarding](/guides/sales-team-onboarding-ai/) covers the certification flag, and [programmatic SEO](/guides/programmatic-seo-lead-gen/) covers the page clusters that create new routes. If AI answer engines are part of your inbound mix, [AEO and GEO](/guides/aeo-geo-inbound-marketing/) explains what those channels send you. The [OperStack system map](/) shows where routing sits between capture and the CRM writes that follow it, and a [routing audit](/audit/?utm=guide-routing) should return your current route map, the target rule order, the fallback matrix, and the ownership conflicts still unresolved. Scope and packaging are on the [pricing](/pricing/) page.
