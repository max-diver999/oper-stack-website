---
title: "Lead Ops vs RevOps: Scope, Artifacts, and Who Owns What"
description: "Lead ops vs RevOps compared by accountability, not tools: what each function optimizes, which artifact it owns, and the failure signature of a wrong boundary."
pubDate: 2026-08-21
author: Maksim Shchegolev
faq:
  - question: Is lead ops part of revenue operations?
    answer: "It can be, and it often is. Lead ops is the execution layer for the interval between a request arriving and a human accepting it, so it fits naturally under a RevOps function that owns definitions. It also exists in companies with no RevOps at all, because someone wrote the first assignment rule long before anyone wrote a stage schema."
  - question: How is lead ops different from RevOps?
    answer: "The clock and the artifact. RevOps decides what a qualified request means, which stages exist, and what the board number counts, on a quarterly rhythm. Lead ops decides what happens to one specific request in the next few minutes and produces evidence that it happened. One owns agreement, the other owns execution."
  - question: Who owns lead routing rules?
    answer: "Split it in two. The routing policy, meaning which segments matter and who should serve them, belongs with whoever owns definitions, usually RevOps or sales management. The executable rule set, its precedence order, fallback queue, and exception log belong to lead ops. When one group owns both, the policy drifts from what production actually does."
  - question: Do we need a RevOps team?
    answer: "Not as a maturity requirement. There is no headcount at which a company must create the role. You need the function when several teams report different numbers for the same month and nobody can arbitrate the definition. You need it as a titled team only when that arbitration takes more time than the people doing it have."
  - question: What does a lead ops person do day to day?
    answer: "Mostly they watch the path between capture and acceptance and remove ambiguity from it. Reviewing yesterday's exceptions and unassigned records, testing a routing change against fixtures before release, fixing a source value that stopped normalizing, and answering the question of why one specific request went to the wrong person."
  - question: When should a company hire for RevOps?
    answer: "When definition disputes are recurring, expensive, and nobody neutral can settle them. The signal is not revenue or team size. It is that marketing, sales, and finance each hold a different version of the same number, the argument repeats every month, and the current owner of the definitions has no time to maintain them."
  - question: What if the company is too small for either named role?
    answer: "Then both exist as work rather than as roles, and that is a normal state, not a gap. Name one person per artifact instead of one person per department: the assignment rule, the response target, the source vocabulary, and the definition of qualified. Four short documents cover most of what either function would produce."
---

Lead ops and RevOps answer two different questions, and the confusion between them is usually paid for by one inbound request sitting unanswered on a Friday evening. RevOps asks what the revenue process should be. Lead ops asks what happens to this specific request in the next five minutes and how you prove afterwards that it happened.

This guide owns the category comparison and the accountability split. The module map of the system itself belongs to the [lead ops stack](/guides/lead-ops-stack/), which carries a short version of this comparison and links here for the long one. Metric definitions live in [inbound lead reporting](/guides/inbound-lead-reporting/), not here.

## In one sentence

**RevOps owns the definitions and the plan for the whole revenue process on a quarterly clock, while lead ops owns the execution path from an inbound request to an accountable human on a clock measured in minutes; neither is a maturity stage, and the only question worth arguing about is which decisions have a named owner today.**

## Why does the usual RevOps definition not answer the question?

Search for this comparison and you will mostly read agencies and platform vendors. Their definitions are broad on purpose, because a broad definition sells a broad engagement. None of it is false. It is simply scoped for a buying committee rather than for an operating manual, so it describes ambition and leaves scope untouched.

Run any definition through one test: does it name who is accountable for an inbound request between the form submit and the first human action? If it does not, it is a positioning statement.

| Definition you will read | What it actually tells you | What it leaves open |
| --- | --- | --- |
| Aligning marketing, sales, and customer success around one revenue process | The ambition and the sponsor | Who acts on the request that arrived at 18:52 |
| The connective tissue between go-to-market teams | A metaphor | Which system is allowed to write the owner field |
| The team that owns the revenue technology stack | A budget line | Whether owning the tools includes owning runtime decisions |
| End-to-end ownership of the revenue lifecycle | Scope in principle | Where the lifecycle is considered to start |

This is a content problem, not a discipline problem. RevOps works, in plenty of companies, exactly as described. The trouble is that a reader arrives with a narrow operational question and receives a category pitch, then concludes that hiring a RevOps lead will fix a handoff that nobody has written down.

## What is lead ops?

Lead ops is the operating discipline for the interval between a request existing and a human being accountable for it. That interval is short, it is where most avoidable loss happens, and it is almost never anyone's named job.

Its scope is bounded on both sides. It starts when an event exists on any channel, including the ones that never look like a form: a chat session, a missed call, a marketplace push, a partner API write. It ends when a named person has accepted the request and a clock has recorded that. Everything downstream, the deal, the forecast, the renewal, belongs elsewhere.

Concretely, lead ops holds the capture contract, identity resolution and duplicate handling, the qualification handoff threshold, the assignment rule set with its precedence order, the service clocks, the exception path when a rule cannot resolve, and the evidence log that makes any of this arguable after the fact. Rule precedence itself is worked through in the [lead routing playbook](/guides/lead-routing-playbook/), and clock definitions in [SLA and speed-to-lead](/guides/sla-speed-to-lead/).

What lead ops does not own: quota, territory design, compensation mechanics, the forecast model, the stage schema, and the definitions behind reported metrics. It implements those and reports against them.

In OperStack terms, the architecture pattern that implements lead ops is a Lead Hub, a single node every request passes through so that forms, bots, and CRM workflows cannot make contradictory decisions about the same request. That is our pattern, not a requirement of the discipline. Many teams run competent lead ops entirely inside one CRM with native rules, and the boundary question in [Lead Hub vs CRM](/guides/lead-hub-vs-crm/) is about when that stops being enough.

## What is RevOps?

RevOps is the governance and planning function for revenue across marketing, sales, and customer success. It exists to make one version of the process authoritative when several teams have incentives to hold different versions.

Its work is definitional and structural: the stage schema and what evidence moves a record between stages, what counts as qualified, how territories are drawn, how the forecast is built and what it is allowed to include, which systems are the record of truth for which objects, and the roadmap that changes any of the above. Its output is agreement that survives an audit, published where anyone can read it.

Vendor and analyst definitions usually stress alignment and a single revenue view. Read those as framing rather than as a specification. The operational content of RevOps in a given company is whatever set of definitions that company has actually written down and enforces.

Two common misreadings are worth separating. RevOps is not the same as the person who administers the CRM, although the function frequently starts there because that person is the only one who can see all the objects at once. And RevOps is not a synonym for analytics; producing a number is different from owning what the number means.

## What are marketing automation and sales ops in this picture?

Both appear in the same conversation and neither is a competitor to the other two. They are named here only as contrast, so that the boundary is legible.

Marketing automation is a tooling layer whose unit of work is a segment and a send. It decides which message a cohort receives on which day, tracks engagement, and maintains list hygiene. The confusion becomes expensive for one narrow reason: a marketing automation workflow is perfectly capable of setting an owner on a record. It assigns, but it does not arbitrate, and it has no view of the chat that assigned a different owner ninety seconds earlier. Assignment inside a campaign tool is a side effect of a campaign, not a routing policy.

Sales ops sits closer to the rep. Its unit of work is a seller and a quarter: quota administration, territory maintenance, pipeline hygiene cadence, deal desk, forecast submission discipline. In smaller companies sales ops and RevOps are the same person; in larger ones sales ops executes inside the definitions RevOps sets, which makes it structurally parallel to lead ops on the other side of the funnel.

## What does each function optimize, and on what clock?

The clock is the cleanest separator available, and it is more useful than any org chart. A decision that has to be correct inside a shift belongs to execution. A decision that has to be correct across a quarter belongs to governance. Mixing the two is what produces routing policy that lives in a slide deck and gets edited twice a year.

| Function | Unit of work | The decision it makes | Horizon of one decision | How often its own rules change | What it is blamed for when a quarter misses |
| --- | --- | --- | --- | --- | --- |
| Lead ops | One inbound request | Who acts on this, by when, with what evidence | Seconds to hours | Weekly, sometimes daily | Requests that reached nobody, or reached the wrong person silently |
| RevOps | One process definition | What this term means and who reports it | A quarter to a year | Quarterly, with a migration plan | Numbers that three teams read differently |
| Marketing automation | One segment and one send | Which message this cohort gets next | Days to weeks | Per campaign cycle | Volume delivered that never converted to conversation |
| Sales ops | One seller and one period | Coverage, capacity, and pipeline discipline | A quarter | Quarterly, at planning | Uneven coverage and unreliable forecast submission |

Speed is the reason the short clock deserves its own owner. The original [MIT and InsideSales lead response study](https://www.onecavo.com/wp-content/uploads/2015/11/MIT-InsideSales.com_Lead-Response-Management.pdf) compared relative odds of contact and qualification at different response delays inside its own 2007 dataset. It is evidence that delay costs something, not a conversion promise for your business today. What matters structurally is that nobody governing on a quarterly cadence can be accountable for a delay measured in minutes.

## Which artifact does each function actually own?

Job descriptions are unreliable. Artifacts are not. The fastest way to find out which of these functions really exists in your company is to ask for four documents and start a timer.

| Function | Core artifact | Where it lives | Who signs a change | Test that it is real | The decoration version of it |
| --- | --- | --- | --- | --- | --- |
| Lead ops | Executable rule set: precedence, fallback, clocks, exception log | Hub or CRM configuration, under version control | Lead ops owner, countersigned on definitions | Someone produces current precedence and last month's exception count within an hour | A routing diagram that does not match production |
| RevOps | Definition set: stage schema, qualified criteria, forecast model, systems roadmap | Published documentation and the reporting layer | RevOps lead with sales and finance | Two teams pull the same number for the same stage without negotiating | A dashboard nobody can trace back to a definition |
| Marketing automation | Campaign plan: segments, nurture flows, send calendar | Campaign tool | Marketing operations | You can name which segment received what and when | Nurture running on records that have no owner |
| Sales ops | Coverage plan: quota, territory, capacity model | Planning documents and CRM territory setup | Sales leadership | Every seller can see their own coverage and how it was derived | A territory map that routing never implemented |

The exception log deserves emphasis, because it is the artifact teams skip and the one that settles arguments. A rule set without a record of every case it could not resolve is a rule set nobody can improve. It is also the cheapest thing on this table to start: a single list of requests that did not resolve cleanly, with a date, a reason, and what a human did instead.

Notice that three of the four artifacts are documents and one is configuration. That asymmetry is the whole comparison in miniature. RevOps produces agreements about meaning. Lead ops produces behavior that runs without anyone present.

## How does accountability split across policy, execution, and campaigns?

Write accountability per decision, never per department. Departments negotiate; decisions have owners. The pattern that holds is three layers: a policy layer that decides what a thing means, an execution layer that makes it happen and proves it, and a campaign layer that operates on cohorts rather than individuals.

| Decision | Defined by | Executed by | Audited by | Arbiter when they disagree |
| --- | --- | --- | --- | --- |
| What counts as qualified | RevOps with sales | Qualification step, bot or human | Sales management | RevOps, in writing, with a version date |
| Which stages exist and what moves a record | RevOps | CRM automation | RevOps | RevOps |
| Which person gets this specific request | Sales management sets the policy | Lead ops rule set | Lead ops exception log | Sales management, on the policy; lead ops, on the rule |
| What happens at 19:40 on a Friday | RevOps or sales management | Lead ops fallback queue | Lead ops | Whoever owns the response target |
| How a duplicate resolves | RevOps data model | Lead ops matching step | Lead ops | RevOps |
| When the service clock starts | RevOps or sales management | Lead ops capture step | Reporting | Reporting definition owner |
| Which cohort receives Tuesday's email | Marketing | Marketing automation | Marketing operations | Marketing |
| Territory and quota | Sales ops with finance | Sales ops | Finance | Sales leadership |
| What the board number means | RevOps | Reporting layer | Finance | RevOps |

Two rules make this table usable rather than decorative. A definition with no execution owner is a slide. An execution rule with no definition owner is a local habit that will be discovered during an incident. Both failures are common and neither is anyone's fault in particular, which is exactly why the split has to be written before it is tested.

The handoff threshold between marketing-qualified and sales-qualified sits right on the seam and is worth its own treatment; that argument lives in [MQL to SQL handoff](/guides/mql-sql-lead-handoff/).

## What is the failure signature when the boundary is drawn wrong?

Boundaries do not fail loudly. They fail as a pattern that looks normal for a quarter and then shows up as a number nobody can explain. Each way of drawing them wrong has its own signature.

| Boundary drawn wrong | What you see day to day | What the report says | First check that exposes it | Who has to take it back |
| --- | --- | --- | --- | --- |
| Lead ops folded into marketing automation | Owners set inside campaign workflows | Response times look fine on the records that have owners | Count records with no owner and no campaign membership | Lead ops, or whoever will hold it |
| Routing policy owned by RevOps but never implemented | Reps assign by habit and by speaking up first | Territory coverage looks even | Compare the written policy to yesterday's actual assignments | RevOps hands execution to lead ops |
| Lead ops writing its own definitions | Two working definitions of qualified in the same company | Funnel conversion improves for no traceable reason | Ask two teams to define qualified without conferring | RevOps takes definitions back |
| Both functions writing the owner field | Ownership flips between systems | Rotation looks balanced in aggregate | Audit owner change events on a single busy day | One system of record per field |
| Nobody owns after-hours and weekends | Monday morning backlog treated as normal | Median response time hides a bimodal distribution | Split response times by hour of arrival | Response target owner |
| Lead ops reporting to whoever complained last | Rules change without a record | Nothing, which is the problem | Ask for the change log for the last ten rule edits | A single named owner with a change protocol |

That third row is the expensive one, because it looks like progress. When execution starts inventing definitions, reports improve while agreement quietly disappears, and the correction later requires renaming stages in historical data.

A Harvard Business Review audit published in [2011](https://hbr.org/2011/03/the-short-life-of-online-sales-leads) covered 2,241 US companies and found a median first response of around 42 hours among those that responded at all, with a large share never responding. The study is old, its channel mix predates modern messaging, and it measured one sample. Use it for what it still describes accurately: when the interval between arrival and human action has no owner, it stretches, and nobody inside the company experiences that as a decision.

## Does lead ops sit inside RevOps, beside it, or before it?

All three arrangements work. This section is a trade-off, not a ranking, and the right answer depends on where your disputes actually occur.

The historical answer to the sequencing question is the least discussed one: in most companies, lead ops exists as work long before RevOps exists as a word. Somebody wrote the first assignment rule, usually in a CRM, usually to stop an argument, and did it years before anyone drafted a stage schema. Asking whether lead ops belongs inside RevOps often means asking whether an existing practice should be brought under new governance.

| Arrangement | What it looks like | Works well when | Where it strains | Early warning | Cheapest correction |
| --- | --- | --- | --- | --- | --- |
| Inside RevOps | Lead ops is a role or workstream reporting to RevOps | Definitions and execution both need to move fast together | Execution work gets scheduled on a quarterly planning cadence | Routing changes wait for a planning cycle | Give the rule set its own release cadence |
| Beside RevOps | Peer functions with a written contract on shared objects | Inbound volume is high and definitions are relatively stable | The contract is verbal, so both sides assume the other checks | Repeated disagreements about the owner field | Write the shared object table and name an arbiter |
| Before RevOps exists | One operator holds capture, routing, and clocks; nobody holds definitions | Early stage, one channel, one pipeline | A second channel or a second product line appears | Two teams count the same month differently | Write four definitions before adding a fifth channel |
| Inside sales, no RevOps | Sales management owns both policy and execution | Sales is the only consumer of inbound requests | Marketing spend decisions need source data sales does not maintain | Attribution arguments at budget time | Move source vocabulary ownership out of sales |

None of these is a stage in a progression, and moving between them is not promotion. A company can run the third arrangement profitably for years, and a company can move from the first back to the second because the planning cadence was slowing execution down.

## How do the two functions agree on owner, stage, and source?

Cooperation is not a meeting cadence. It is a written contract on the small number of objects both functions touch. Three of them cause most of the friction, and a few more are worth adding before they do.

| Shared object | Meaning defined by | Value written by | Override allowed to | Change protocol | Symptom when unowned |
| --- | --- | --- | --- | --- | --- |
| Owner | Sales management policy | Lead ops rule set, one writer | Manager, with a stated reason, logged | Change record plus fixture tests before release | Ownership oscillates between systems |
| Stage | RevOps schema | CRM automation on recorded evidence | Record owner, within allowed transitions | Quarterly review, migration plan for renames | Stage counts that nobody trusts |
| Source | RevOps vocabulary | Capture and normalization step | Nobody, corrections only with a reason | Versioned list, deprecate rather than delete | Paid channels appear to produce no revenue |
| Qualification outcome | RevOps criteria | Qualification step | Manager on new evidence | Version the criteria, keep the score history | Two definitions of qualified in one company |
| Clock start event | Reporting definition owner | Lead ops capture step | Nobody | Documented once, changed with a restatement | Integration delay invisible in response reports |
| Exception and breach | Response target owner | Lead ops exception log | Nobody | Reviewed weekly, escalated by rule | Breaches discovered in a monthly review |
| Account match | RevOps data model | Lead ops matching step | Operations, with a merge record | Documented match keys and strength tiers | One buyer, two owners, two clocks |

Two mechanics keep the contract alive. First, versioning with a migration plan: renaming a stage without one rewrites last year's reports, which is how a definition change becomes a reporting incident. Second, fixture tests before any rule release, because the rule set is code even when it is configuration.

Platform behavior belongs inside the contract too, not outside it. Salesforce documents how [lead assignment rules](https://help.salesforce.com/apex/HTViewHelpDoc?id=mktg.mktg_set_lead_assignment_rules.htm) evaluate in order and assign a default owner when nothing matches, and HubSpot documents behavior around [setting a record owner](https://knowledge.hubspot.com/records/how-to-set-a-record-owner), including how manual owner changes interact with rotation. Verify current product behavior in the documentation before you depend on it, then write the observed behavior into your own contract, because a platform default is a decision your company has made by not making it.

The cadence follows from the clock difference. Definitions change quarterly, rules change weekly, so the contract needs a version number and a place where the current version lives. Field-level ownership mechanics are worked out in [CRM automation for inbound leads](/guides/crm-automation-inbound/), and source model details in [inbound lead attribution](/guides/lead-attribution-inbound/).

## What does a lead ops person do day to day?

The role reads as vague until you separate it by horizon. Side by side with RevOps attention on the same horizons, the division stops being abstract.

| Horizon | Lead ops attention | RevOps attention |
| --- | --- | --- |
| This hour | Unassigned records, failed writes, a request that resolved to the wrong queue | Nothing routine |
| Today | Yesterday's exception list, one rule fix, a source value that stopped normalizing | Answering a definition question that blocked someone |
| This week | Fixture tests for a routing change, after-hours coverage gaps, acceptance rate by queue | Reporting reconciliation, a stage that two teams read differently |
| This month | Channel additions, duplicate rate, review of overrides and why they happened | Pipeline review inputs, systems roadmap grooming |
| This quarter | Rule set cleanup, retiring rules that never fire, capacity assumptions | Stage schema review, forecast model changes, territory and comp interlock |
| This year | Channel architecture, replacing point-to-point integrations | Data model, systems consolidation, planning cycle design |

The day-to-day is mostly ambiguity removal, and the deliverable is often a sentence rather than a feature: this queue takes overflow after 19:00, this source value maps to that one, this override needs a reason field. It is not a CRM administration job, although configuration is part of it, and it is not analytics, although it produces the evidence analytics reads.

One honest limitation: this table describes attention, not a job description, and plenty of competent teams distribute these lines across three people with other titles.

## Which signals mean you need lead ops rather than more RevOps?

Neither function is a maturity requirement, and there is no headcount, revenue level, or funding stage at which a company must create either role. Anyone who tells you otherwise is describing their own company or selling a service. What does exist is a set of symptoms, and each one points at a specific missing capability rather than at a title.

| Symptom | Points to | Cheapest first move | What it is not |
| --- | --- | --- | --- |
| Nobody can say what happened between form submit and first call | Lead ops | Log capture time and acceptance time on every request | A reporting tool purchase |
| Marketing and sales report different counts for the same month | RevOps | Write one definition of a counted request, with a version date | A routing problem |
| Routing exceptions are handled by messaging a manager | Lead ops | Write the fallback queue and the escalation rule | A staffing problem |
| Forecast is reviewed weekly, pipeline entry is unmanaged | Both, starting with lead ops | Instrument entry before refining the forecast | A forecast accuracy project |
| Reps argue about who owns a returning buyer | Lead ops, with a RevOps definition | Define re-entry handling and log the previous owner | A compensation dispute, yet |
| Three systems each claim to be the record of truth | RevOps | Assign one system of record per object | An integration project |
| A bot or model makes decisions nobody reviews | Lead ops | Sample decisions weekly and record overrides | A model quality issue |
| Attribution arguments repeat at every budget cycle | RevOps vocabulary, lead ops enforcement | Freeze the source list and stop free-text entry | A dashboard gap |

The distinguishing question is whether the pain is disagreement or execution. Disagreement about meaning, repeated and expensive, points to governance. Requests reaching the wrong person, or nobody, points to execution. Hiring for one when you need the other is the most common expensive mistake in this whole comparison, and it usually shows up as a new leader spending two quarters documenting a process that then still does not run. A structured way to find out which you have is in the [inbound lead audit](/guides/inbound-lead-audit/), and the cost side of the decision is in [inbound automation ROI](/guides/inbound-automation-roi/).

## What if the company is too small for either as a named role?

Then both exist as work rather than as roles, which is a normal operating state and not a gap to apologize for. The mistake small teams make is not the absence of titles. It is the absence of artifacts, because artifacts are what survive the founder answering the phone personally.

Name one person per artifact instead of one person per department. Six short documents cover most of what either function would produce, and none of them takes a week.

| Minimum artifact | Who usually holds it | First version takes | What breaks without it |
| --- | --- | --- | --- |
| One assignment rule with a fallback | Whoever runs sales | An afternoon | Requests sit until someone notices |
| One response target with a defined start event | Same person | An hour | Response time is discussed but never proved |
| One source vocabulary, no free text | Whoever runs marketing | An afternoon | Channel performance is unknowable later |
| One place duplicates resolve | Whoever administers the CRM | A day | One buyer, two owners, two conversations |
| One definition of qualified | The two of them together | An hour, then an argument | Handoff disputes repeat weekly |
| One weekly exception review | Whoever runs sales | Thirty minutes a week | Nothing improves, because nothing is recorded |

Two failure modes bracket this stage. One is hiring a senior governance leader to fix what is actually a missing assignment rule. The other is buying a platform in place of making a decision, which produces a well-configured system executing an argument nobody settled. Both are expensive relative to a company of this size, and both are avoidable by writing the six lines above first.

Sequencing the tooling that eventually supports this is a separate question; the module view is in the [lead ops stack](/guides/lead-ops-stack/), and what the hosted pattern costs is on the [pricing page](/pricing/).

## In what order should these capabilities be built?

This sequence is about drawing the boundary, not about building the system. It assumes nothing about your headcount and works whether one person or three departments are involved.

1. **Write a one-page scope statement for each function, even if the same person holds both.** Two paragraphs each: what it decides, what it does not decide, what it produces. Contradictions surface immediately and are cheap to fix on paper.
2. **Inventory decisions, not tools.** Take the nine decisions from the accountability table above and put a human name next to each. Blank rows are the actual finding.
3. **Make execution provable before making definitions elegant.** A crude assignment rule with a timestamp and an exception log beats a beautiful stage schema sitting on top of an unmeasured handoff.
4. **Fill in the shared object contract for owner, stage, and source.** Three rows is enough to start. Add the rest when a fourth object causes an argument.
5. **Publish the exception path and name the arbiter.** Most boundary damage happens in cases the rules did not anticipate, and those cases need a destination before they occur, not after.
6. **Set two cadences deliberately.** Weekly for execution review, quarterly for definitions. Running both on the same calendar is how routing changes end up waiting for planning season.
7. **Decide titles and reporting lines last.** Once the artifacts have owners, the org chart question becomes small, and often the answer is that no new role is needed this year.
8. **Re-check the boundary whenever a channel, a product line, or a country is added.** Each of those introduces a new way for two rules to both be correct.

Step three is the one that gets reversed most often, usually with good intentions. Definitions feel like the responsible place to start because they feel foundational. In practice, a definition written before anyone can observe the process describes an imagined process, and the rewrite costs more than the delay would have.

## Where does this sit in the rest of the stack?

This comparison is the scope boundary around everything else in the cluster. Once the accountability split is written, the rest of the work is implementation, and each piece has an owner document.

Assignment precedence, fallback queues, and reassignment rules are in the [lead routing playbook](/guides/lead-routing-playbook/). Clock definitions, escalation, and breach handling are in [SLA and speed-to-lead](/guides/sla-speed-to-lead/). The qualification threshold that both functions have to agree on is in [AI lead qualification](/guides/ai-lead-qualification/), and the argument about where marketing hands over is in [MQL to SQL handoff](/guides/mql-sql-lead-handoff/). Capture design, which determines what the whole path receives, is in [website lead capture](/guides/website-lead-capture/). Persistence after the first touch is in [lead follow-up systems](/guides/lead-follow-up-system/), and the staffing version of the same question is in [AI SDR vs human SDR](/guides/ai-sdr-vs-human-sdr/). System boundaries between the hub and the CRM are in [Lead Hub vs CRM](/guides/lead-hub-vs-crm/), and the whole architecture is visible on the [OperStack system map](/).

If you want the boundary drawn against your own instance rather than in the abstract, a [lead operations audit](/audit/?utm=guide-revops) returns the accountability table and the shared object contract filled in with the names and rules currently running in your systems, plus the list of decisions that turned out to have no owner at all. Where the answer is a written specification rather than a build, that is sold separately as [AI automation consulting](/services/ai-automation-consultant/).
