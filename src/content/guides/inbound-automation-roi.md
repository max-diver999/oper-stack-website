---
title: "Marketing and Sales Automation ROI: An Auditable Model"
description: "Build an inbound automation ROI model finance can check: baseline, cost register, incremental contribution, three scenarios, break-even, sensitivity, payback."
answer: "Inbound automation ROI is the incremental contribution margin the change produces over a defined period, minus one-time and recurring costs, tested across 3 cases: conservative, base and upside. Build it on your own baseline rather than a vendor benchmark, value the hours released at a rate you actually pay, and state which assumption breaks the model first."
pubDate: 2026-08-21
author: Maksim Shchegolev
faq:
  - question: How do you calculate the ROI of inbound automation?
    answer: "Fix a baseline period, list one-time and recurring costs, estimate the extra won deals the change produces, convert them to contribution margin rather than revenue, add only the released hours you actually redeploy, subtract recurring cost, and repay the one-time cost from what is left. Then run the same arithmetic in a conservative and an upside case."
  - question: Which costs belong in an automation ROI model?
    answer: "One-time: discovery, integration build and testing, data cleanup, internal project hours, training. Recurring: licences, telephony and messaging usage, model and API usage, rule maintenance, vendor support. Teams routinely forget four lines: management attention during rollout, the throughput dip while people learn, the parallel run, and the cost of rolling back if the pilot fails."
  - question: How should time saved be valued in the model?
    answer: "Multiply hours released by a loaded hourly cost, then multiply again by a realization factor between zero and one. Released hours only become money when a planned hire is cancelled, overtime stops, or the hours go into selling activity with a measured output. Hours that simply return to the working day are worth nothing on the finance line."
  - question: What is a reasonable payback period for lead automation?
    answer: "There is no industry answer, and any number quoted as one is a marketing claim. Payback falls out of your own inputs: one-time cost divided by monthly net contribution, adjusted for the ramp. Compute it in all three scenarios and present the range. If the conservative case never pays back, that is the most useful line in the table."
  - question: How do you prove the extra revenue was incremental?
    answer: "Only a control arm proves it. Randomly hold back part of the accepted request flow, or compare a matched channel or team, and pre-register the expected effect and threshold before you start. A before-and-after comparison in a changing market proves correlation only, so label it that way in the paper you give finance."
  - question: How do you avoid double counting benefits in an ROI model?
    answer: "Write each effect once, against one mechanism, and name the guide that owns it. The three common collisions are hours released counted alongside the deals those hours produced, a conversion uplift applied to requests that were also counted as recovered leakage, and attribution improvements counted as new volume. Pick one side of each pair and record the choice."
  - question: How do you check the forecast against what actually happened?
    answer: "Book the review one quarter after full rollout, before go-live, and put the forecast table in the invitation. Fill a realized column for every input, not just the outcome, then recompute payback with the observed numbers. Most variance comes from the realization factor and recurring cost, not from the conversion story everyone argues about."
---

**Inbound automation ROI** is the incremental contribution margin a change in lead handling produces over a defined period, minus what the change costs to build and to run. Most calculators on the market skip the hard half: which effects are yours to claim, which inputs you actually observed, and what happens to the answer when one of them is wrong.

This guide owns the economics of the cluster. It covers the baseline, the cost register, incremental contribution, scenarios, break-even, sensitivity, and the review that compares forecast with realized value. No other OperStack guide computes payback; the others link here for the money question.

## In one sentence

**Inbound automation ROI is the incremental contribution margin the change produces over a defined period, minus one-time and recurring costs, tested across conservative, base and upside cases. Build it on your own baseline, value released hours only when they are redeployed, and confirm the forecast against realized numbers a quarter later.**

## What decision is this model actually for?

A model that answers "is automation good" answers nothing. Before any arithmetic, write the decision in one line, with an owner and a date: approve a fixed budget, choose between two scopes, decide whether to hire a person instead, or decide whether to stop a project already running. The decision determines which costs are relevant and which are sunk.

Four decision shapes come up constantly, and they need different models.

**Approve or reject a defined scope.** You need total cost, incremental contribution, break-even, and payback. This is the full model below.

**Choose between two scopes.** Only the differences matter. Model the increment between them, not both from zero, and the argument gets shorter.

**Automate or hire.** The comparison is against the fully loaded cost of the alternative person, including recruiting, ramp time, management, and the risk that they leave. That comparison sits in [AI SDR versus human SDR](/guides/ai-sdr-vs-human-sdr/); this guide gives you the cost side to plug into it.

**Continue or stop.** Build cost is already spent. The only live question is whether recurring cost is covered by ongoing contribution, which is a much lower bar and a different table.

Write down the decision rule too, not just the decision. "We proceed if the base case pays back inside twelve months and the conservative case does not lose money on recurring cost" is a rule. "We proceed if the ROI looks good" is a negotiation waiting to happen.

## What is the baseline, and over what period?

Every number in the model is a difference from something. If the something is undefined, the model is a wish. Freeze one representative period, export it before you change anything, and store the export where it can be reopened in six months.

Pick a period long enough to contain normal variation and short enough that the market has not moved: one quarter suits most B2B inbound teams. Two constraints matter more than length. The period must not contain a pricing change, a headcount change, or a campaign you would not repeat. And the deals must have had time to close, because requests from the last four weeks of the period are still in flight.

| Baseline input | Definition | Where it comes from | Illustrative value |
| --- | --- | --- | --- |
| Accepted requests | Requests passing spam and test filters | Hub or CRM create events | 1,200 per quarter |
| Requests with a first human response | At least one logged outbound attempt | Activity log | 1,020 |
| Requests never contacted | Accepted minus contacted | Derived | 180 |
| Median first response time | Capture to first outbound attempt | SLA timers | 6 h 40 min |
| Qualified requests | Meets the written qualified definition | Stage entry evidence | 260 |
| Won deals from this cohort | Closed won, cohorted by request date | CRM, measured at report date | 48 |
| Win rate on contacted requests | Won divided by contacted | Derived | 4.7% |
| Average first order revenue | Signed value, renewals excluded | Finance | $4,000 |
| Gross margin on that revenue | After delivery cost | Finance | 55% |
| Contribution margin per won deal | Revenue x margin, less variable selling cost | Finance, signed off | $2,200 |
| Manual minutes per request | Timed sample over at least one week | Direct observation | 6 minutes |
| Loaded hourly cost | Salary, taxes and overhead over productive hours | Finance | $28 |

Every figure in this guide is illustrative. They exist so the arithmetic is checkable, not because they describe your market or anyone else's.

Two baseline traps swallow more projects than any modelling error. The first is cohort closure: if you count won deals by close date instead of by request date, a good quarter for closing old deals looks like a good quarter for lead handling. Cohort by the date the request arrived, and state how much of the cohort is still open. The second is the uncontacted count. Almost nobody has it to hand, because the reports built inside a CRM count records that exist and activities that happened, not silence. That number is usually the single largest effect in the whole model, and it comes from the activity log, not from a stage report.

A [Harvard Business Review audit published in 2011](https://hbr.org/2011/03/the-short-life-of-online-sales-leads) examined 2,241 US companies and found a median first response of about 42 hours among firms that responded at all. That study is old, covers one sample, and is not a benchmark for your team. It is useful here for one reason: it shows that unmanaged inbound handling produces silence at a scale that surprises the people running it, which is exactly why the baseline export has to be measured rather than remembered.

If your baseline cannot be exported at all, the honest first project is not automation. It is measurement, and the diagnosis belongs in an [inbound lead audit](/guides/inbound-lead-audit/).

## Which costs belong in the model?

Cost is the half of the model you can know precisely, so there is no excuse for estimating it. Ask for quotes, split one-time from recurring, and put internal hours in at a loaded rate rather than pretending they are free.

| Cost line | One-time or recurring | Main driver | Illustrative base case |
| --- | --- | --- | --- |
| Discovery, definitions, process mapping | One-time | Channels and pipelines in scope | $2,400 |
| Integration build and testing | One-time | Systems connected, custom fields | $9,600 |
| Data cleanup and deduplication | One-time | Record count and duplicate rate | $3,000 |
| Internal project hours | One-time | 80 hours at a loaded $40 | $3,200 |
| Training and rollout | One-time | Headcount and shift pattern | $1,800 |
| Platform and CRM licences | Recurring | Seats and tier | $1,350 per quarter |
| Telephony and messaging usage | Recurring | Contact volume | $450 per quarter |
| Model and API usage | Recurring | Requests processed | $300 per quarter |
| Rule maintenance and change requests | Recurring | Rate of change in the business | $600 per quarter |
| Vendor support or retainer | Recurring | Contract terms | $900 per quarter |
| Totals | | | $20,000 one-time, $3,600 per quarter |

Five lines get left out almost every time, and together they are rarely small.

Management attention during rollout is real cost: someone senior spends weeks on this instead of on something else. The throughput dip while the team learns new rules is real, usually two to four weeks of slightly worse performance before it gets better. A parallel run, where the old process and the new one both operate, doubles some handling cost for its duration. Decommissioning the old process takes work nobody schedules. And the cost of being wrong belongs in the register too: what it costs to unwind the change if the pilot fails.

Data cleanup deserves its own note, because it is the line most often discovered halfway through. Deduplication, controlled value lists, and field ownership are prerequisites for almost every downstream effect, and their cost scales with how bad the data already is. What has to be cleaned and why is set out in [CRM automation for inbound leads](/guides/crm-automation-inbound/). Whether the work belongs inside your CRM or in a separate hub changes the build line materially, and that boundary is worked through in [Lead Hub versus CRM](/guides/lead-hub-vs-crm/). Scope options and what sits in each are on the [pricing page](/pricing/).

## How do you value the hours automation gives back?

Hours released are the favourite number of vendor calculators because they are large, easy to compute, and almost never real money. Hours become money in exactly three situations: a planned hire is cancelled, paid overtime stops, or the hours go into selling activity whose output you measure. Everything else is an hour that quietly returns to the working day.

So the capacity line has three factors, not two:

Capacity value = hours released x loaded hourly cost x realization factor

The realization factor is a number between zero and one that you have to defend. Set it low unless you can name the hire that was cancelled or point at the activity the hours moved into. In the illustrative base case here it is 0.40, which already assumes a fairly disciplined team. Making it 1.0 is the single fastest way to lose credibility in a finance review, because the first question will be "so which salary went down".

Measure the hours themselves by observation, not by asking. Sit with two people for a week, time the actual steps for a sample of requests, and separate them: reading and triaging the request, retyping data between systems, chasing the right owner, assembling the report at the end of the week. Reporting time is worth pulling out separately, because it is concentrated in one person and is often the easiest hour to genuinely reclaim; what a reporting cycle should contain is covered in [inbound lead reporting](/guides/inbound-lead-reporting/).

Redeploying released hours is a management task, not an automatic consequence. If nobody decides what the freed time is for, the realization factor is zero by default. Getting new capacity into productive selling is partly a training problem, covered in [sales team onboarding](/guides/sales-team-onboarding-ai/).

## Which effects may you claim, and who owns each one?

An ROI model built from unnamed effects is impossible to check. Give every claimed effect a mechanism, a measurement with enough volume to be observable, and a named home in the cluster where that mechanism is actually designed.

| Effect | Mechanism | How you measure it | Where the mechanism is designed |
| --- | --- | --- | --- |
| Leakage recovery | Requests that got no first response now get one | Contact rate on accepted requests | [Lead routing playbook](/guides/lead-routing-playbook/) |
| Persistence | More attempts per request before giving up | Attempts per request, contact rate by attempt | [Lead follow-up system](/guides/lead-follow-up-system/) |
| Speed effect | First response time falls | Median and 90th percentile response time | [SLA and speed-to-lead](/guides/sla-speed-to-lead/) |
| Capture completeness | Fewer abandoned or malformed submissions | Accepted over attempted submissions | [Website lead capture](/guides/website-lead-capture/) |
| Qualification accuracy | Senior time concentrated on fit requests | Qualified rate, later-rejected rate | [AI lead qualification](/guides/ai-lead-qualification/) |
| Handoff quality | Fewer qualified requests dropped at the seam | Accepted handoffs over sent handoffs | [MQL to SQL handoff](/guides/mql-sql-lead-handoff/) |
| Capacity release | Manual triage and retyping removed | Timed minutes per request | [CRM automation](/guides/crm-automation-inbound/) |
| Reporting time | Manual report assembly removed | Hours per reporting cycle | [Inbound lead reporting](/guides/inbound-lead-reporting/) |
| Headcount avoidance | Volume handled without an extra hire | Requests per rep per week | [AI SDR versus human SDR](/guides/ai-sdr-vs-human-sdr/) |

Two effects belong to other guides and should not be added to this model as separate revenue lines.

Source-to-revenue joins are owned by [inbound lead attribution](/guides/lead-attribution-inbound/). Better attribution changes where budget goes, and moving budget to a channel that converts can genuinely raise revenue. That gain belongs to the budget decision, not to the automation project, and counting it here is how a model doubles in size overnight. What attribution gives this model is narrower and more important: without a working join between source and closed revenue, you can only compute contribution at the total level, not per source. Model the total, and say so explicitly rather than presenting a per-channel breakdown you cannot support.

Diagnosis of what is broken is owned by the [inbound lead audit](/guides/inbound-lead-audit/). That guide tells you which failures exist in your flow and how large each one is; this guide prices the fix. Run them in that order. Pricing a fix before you know the defect list produces a number that describes a category of software rather than your situation, and it is the reason so many automation business cases survive approval and die at the first review.

Channel-side work raises the volume of requests rather than the quality of handling. If [answer engine visibility](/guides/aeo-geo-inbound-marketing/) or [programmatic SEO](/guides/programmatic-seo-lead-gen/) is part of the same programme, model them separately: this model prices what happens to a request after it arrives.

## Why does the model run on contribution margin instead of revenue?

Because revenue is not money you keep, and a finance director will stop reading at the first revenue-based ROI claim. Contribution margin per won deal is revenue times gross margin, less the variable selling cost of that deal. It is the amount an additional deal actually adds.

| Basis | What it counts | Why it fails or works here |
| --- | --- | --- |
| Revenue | Signed value | Ignores delivery cost, inflates every effect |
| Gross profit | Revenue less delivery cost | Better, still ignores variable selling cost |
| Contribution margin | Gross profit less variable selling cost | The defensible basis for an incremental deal |
| Lifetime value | Contribution over the full relationship | Depends on retention assumptions, keep it out of the base case |
| Booked value including renewals | Multi-period commitment | Mixes horizons, easy to double count |

Three rules keep this line honest. Agree the definition with finance in writing before you model anything, because it multiplies every revenue effect in the model and a late disagreement about it invalidates the whole sheet. Use first-order contribution in the base case and put expansion or renewal value in the upside case only, labelled as such. And state the horizon once, at the top, so nobody quietly compares a twelve-month benefit against a three-month cost.

Then be careful about which deals the margin applies to. Incremental deals from recovered leakage are often smaller and slower than average, because they were the requests nobody prioritised. Applying the average contribution margin to them is optimistic by construction. Either discount the margin for that group or discount the win rate, and never both, or you have applied the same caution twice.

## What does the worked model look like end to end?

Here is the whole calculation as a set of lines you can rebuild in a spreadsheet in twenty minutes. Every value is illustrative and every line names its formula, which is the point: a model you cannot re-derive is a model you cannot defend.

| Line | Formula | Illustrative base case |
| --- | --- | --- |
| A. Uncontacted requests | From the baseline | 180 per quarter |
| B. Recovery share | Assumption | 0.70 |
| C. Recovered contacts | A x B | 126 |
| D. Win rate on contacted | From the baseline | 4.7% |
| E. Discount on recovered requests | Assumption | 0.50 |
| F. Deals from leakage | C x D x E | 2.96 |
| G. Contacted requests | From the baseline | 1,020 |
| H. Conversion uplift | Assumption, percentage points | 0.2 pp |
| I. Deals from conversion uplift | G x H | 2.04 |
| J. Incremental won deals | F + I | 5.00 per quarter |
| K. Contribution per won deal | From the baseline | $2,200 |
| L. Contribution from deals | J x K | $11,000 per quarter |
| M. Hours released | Requests x minutes saved / 60 | 1,200 x 6 / 60 = 120 |
| N. Capacity value counted | M x loaded rate x realization | 120 x $28 x 0.40 = $1,344 |
| O. Gross quarterly benefit | L + N | $12,344 |
| P. Recurring cost | Cost register | $3,600 per quarter |
| Q. Net quarterly contribution | O less P | $8,744 |
| R. One-time cost | Cost register | $20,000 |
| S. Payback | R repaid from Q, adjusted for ramp | Month 10 |

Line E is where most vendor calculators cheat by leaving it out. A request that nobody contacted for a quarter is not equivalent to one that got a call in an hour, and pretending otherwise doubles the leakage effect at a stroke. Half the observed win rate is a starting assumption, not a finding.

The ramp in line S matters more than it looks. Effects do not start at full strength in week one: rules get tuned, exceptions surface, and people learn. Model it as a linear ramp to full effect over a stated number of months. In the base case here, full effect arrives in month four, which pushes payback from month seven to month ten. Skipping the ramp is the most common reason a forecast looks fine and the first review looks terrible.

## What do the conservative, base, and upside cases look like?

One number is not a model, it is a bet. Build three cases by changing inputs, never by changing the formulas, and hand over the whole table rather than the middle column.

| Input or output | Conservative | Base | Upside |
| --- | --- | --- | --- |
| Recovery share on uncontacted requests | 0.40 | 0.70 | 0.85 |
| Discount applied to recovered win rate | 0.35 | 0.50 | 0.65 |
| Conversion uplift on contacted requests | 0.0 pp | 0.2 pp | 0.4 pp |
| Hours released per quarter | 70 | 120 | 150 |
| Realization factor on released hours | 0.20 | 0.40 | 0.60 |
| Contribution margin per won deal | $1,900 | $2,200 | $2,400 |
| One-time cost | $26,000 | $20,000 | $18,000 |
| Recurring cost per quarter | $4,300 | $3,600 | $3,400 |
| Months to full effect | 6 | 4 | 2 |
| Incremental won deals per quarter | 1.18 | 5.00 | 8.75 |
| Gross quarterly benefit | $2,643 | $12,344 | $23,520 |
| Net quarterly contribution | Minus $1,657 | $8,744 | $20,120 |
| Payback | None within 24 months | Month 10 | Month 4 |

The conservative column is the useful one. Under these illustrative inputs it does not pay back at all: recurring cost exceeds the benefit and the project loses money every quarter it runs. That is not a reason to reject the project, and it is not a reason to delete the column. It is the information the decision needs, because it tells you exactly which assumptions have to hold for the investment to work, and those assumptions become the things you measure in the pilot.

Build the conservative case by taking the pessimistic end of every input at once. People object that this is unrealistic, since all inputs rarely disappoint together. They are right, and the column is still worth having, because it draws the floor. If the floor is survivable, the decision is easy. If the floor is a slow bleed with no exit, you need a stop rule and a review date written into the approval.

## Where is break-even, and what does payback really mean?

Break-even and payback answer different questions and get confused constantly. Break-even asks how much effect is needed for the thing to be worth running. Payback asks how long the build cost takes to come back.

Express break-even in the unit the business argues in: won deals per quarter. Two thresholds are worth having, using the illustrative base inputs above.

**Cash-neutral on running cost.** Recurring cost is $3,600 per quarter and the capacity line contributes $1,344 of that. The deals have to cover the remaining $2,256, which at $2,200 of contribution per deal is 1.03 additional won deals per quarter. Roughly one extra deal a quarter keeps the system from costing money.

**Full return inside twelve months.** Add the one-time $20,000 spread over four quarters, which is another $5,000 per quarter, or 2.27 deals. Total threshold: about 3.3 additional won deals per quarter.

That second number is the sentence to put in front of the decision maker. It converts an argument about percentages into a question anyone in the room can answer from experience: does one extra deal a month sound plausible from the requests we currently never call back?

Payback then has three honest definitions, and you should say which one you are using.

| Definition | What it counts | When to use it |
| --- | --- | --- |
| Simple payback | One-time cost over steady monthly net | Fast comparison between options |
| Ramped payback | Same, with the effect ramp applied | The default for a real forecast |
| Fully loaded payback | Ramped, plus internal hours and the throughput dip | Board-level approval |

The gap between the first and the third is often several months. Quoting the first while calling it the third is how a business case loses trust at the first review, and the difference is arithmetic rather than judgment, so there is no excuse for getting caught by it.

## Which input breaks the model first?

Sensitivity analysis is what separates a model from a brochure. Move one input at a time by a fixed amount, hold everything else, and record what happens to annual net contribution. In the base case that annual figure is about $35,000.

| Input moved by 25% | Direction | Annual net contribution | Change |
| --- | --- | --- | --- |
| Contribution margin per won deal | Down | $23,976 | Minus 31% |
| Recovery share on uncontacted requests | Down | $28,464 | Minus 19% |
| Discount applied to recovered win rate | Down | $28,464 | Minus 19% |
| Baseline win rate on contacted requests | Down | $28,464 | Minus 19% |
| Conversion uplift | Down | $30,488 | Minus 13% |
| Recurring cost | Up | $31,376 | Minus 10% |
| Hours released | Down | $33,632 | Minus 4% |
| Realization factor | Down | $33,632 | Minus 4% |
| One-time cost | Up | Unchanged | Payback moves to about month 11 |
| Months to full effect, 4 to 6 | Slower | First-year net falls 14% | Payback roughly unchanged |

Two findings come out of that table, and neither is obvious before you build it.

**Contribution margin breaks the model first.** It multiplies every revenue effect, so an error there is an error everywhere. This is why the definition has to be agreed with finance before the model exists rather than defended after it is presented. It is also why a project can survive a disappointing conversion result and die on a margin recalculation.

**The leakage chain compounds.** Recovery share, the discount factor, and the baseline win rate are multiplied together, so their errors multiply too. If all three land 25% below assumption at once, that line falls by 58%, not 25%, and annual net contribution drops by 43%. Any line built from three stacked estimates deserves the widest range in the scenario table and the first place in the pilot measurement plan.

The capacity line, meanwhile, barely moves the answer. That is worth knowing before you spend three weeks perfecting a time-and-motion study while the margin definition is still unsettled.

**Operator note.** The tell for a model built to sell rather than to decide is asymmetry of precision: benefits stated as a single confident number, costs itemised to the dollar, and no answer at all to "what if the conversion uplift is zero". Ask that question first in any vendor conversation. If the calculator cannot set an input to zero and show you the result, it is not a model, and the fastest reply is to rebuild their claim in your own sheet with your own baseline.

## How do you run a pilot with a holdout or a comparable baseline?

The model produces a forecast. A pilot is how you find out whether the forecast is about your business. The design decides what the pilot can prove, so choose it before you start rather than explaining it afterwards.

| Pilot design | When it is usable | What it proves | Main threat |
| --- | --- | --- | --- |
| Randomised holdout on requests | Enough volume, one queue, no fairness objection | Causal effect | Reps trade leads and break the split |
| Holdout by channel | Channels behave similarly | Directional | Channel mix differs from the treated arm |
| Holdout by team or shift | Teams comparable in tenure and skill | Directional | Skill differences, contamination between teams |
| Staggered rollout by segment | Medium volume, several segments | Reasonable | Order effects and seasonality |
| Before and after in time | Low volume, stable market | Weak | Anything else that changed in the period |

A randomised holdout on requests is the only design that proves causation, and it is the one people refuse for a reason worth taking seriously: it means some requests are deliberately handled the old way. Two mitigations usually settle it. Keep the holdout small and time-boxed, and exclude requests above a value threshold from the experiment entirely. What you cannot do is randomise and then let managers pull leads out of the control arm when they look promising, because a contaminated control arm is worse than no control arm: it produces a number that looks rigorous and is not.

Now the part vendor calculators never mention. Most inbound teams do not have the volume to detect a deal-level effect at all. With 1,200 requests a quarter and a 4.7% win rate, separating 4.7% from 4.9% using the standard approximation for comparing two proportions needs something on the order of a hundred thousand requests in each arm. You will never get there.

The way out is to measure upstream, where the volume lives, and reason forward.

| Metric | Illustrative baseline | Illustrative target | Roughly what a pilot arm needs |
| --- | --- | --- | --- |
| Contact rate on accepted requests | 85% | 95% | Around 150 requests |
| Requests contacted within 15 minutes | 22% | 70% | Under 50 requests |
| Median first response time | 6 h 40 min | Under 20 min | Tens of requests |
| Qualified rate on contacted | 25.5% | 28% | Several thousand requests |
| Win rate on contacted | 4.7% | 4.9% | Around 100,000 requests |

Those sample sizes come from a standard rule of thumb rather than a formal study design, and they exist to make one point. Contact rate and response time are measurable in a short pilot. Win rate is not. So the pilot proves the mechanism moved, and the model converts the mechanism into money using the assumptions you wrote down in advance. That is a weaker claim than "automation raised our win rate", and it is the strongest claim the data supports.

Pre-register the pilot in writing before it starts: the arms and how requests are allocated, the duration and the reason for it, the primary metric, the decision threshold, and what you will do if the result is ambiguous. A page written before the data arrives is worth more than any analysis written after it. The NIST [AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework) makes the same point in a wider setting: automated decisions are governable only when they are traceable and measured, and the same standard should apply to the business case that authorised them.

## How do you avoid counting the same effect twice?

Double counting is the most common defect in automation business cases, and it survives review because each individual line looks reasonable. The fix is mechanical. Write each effect once, against one mechanism, and record the choice where the reviewer can see it.

| Colliding pair | Where they overlap | Rule |
| --- | --- | --- |
| Hours released and extra deals | The same hour is counted as cost saved and as the selling time that produced the deal | Count the deal. Count the hour only where a hire was cancelled or overtime stopped |
| Leakage recovery and conversion uplift | A recovered request also benefits from faster response | Apply the uplift only to the already-contacted base |
| Speed effect and persistence effect | More attempts and faster first attempt both raise contact rate | Model one contact-rate change, not two |
| Attribution correction and volume growth | Reallocated budget raises volume; automation did not create those requests | The gain belongs to the budget decision |
| Automation and a concurrent hire | Two people started in the same quarter | Isolate with a holdout, or exclude the period |
| Automation and a price or packaging change | Contribution per deal moved for another reason | Hold margin constant, or restate the baseline |
| First-order contribution and renewal value | Two horizons mixed in one figure | Pick one horizon and label it |

The pair that costs the most credibility is the first one. A model that claims both "we saved 480 hours a year" and "we closed twenty more deals" is usually claiming the same hours twice, because the hours are exactly what produced the deals. Pick one. In practice, count the deals and treat capacity as headcount deferral only where you can name the hire that did not happen.

There is a second, quieter version of double counting: the same effect claimed by two projects. If a content programme and an automation programme are both approved in the same quarter and both count the resulting deals, the company has approved the same revenue twice. Keep one register of claimed effects across projects, with an owner per effect. It is a boring artefact that prevents an expensive argument.

## How do you compare the forecast with realized value after a quarter?

Book the review before go-live, one quarter after full rollout, and attach the forecast table to the invitation. A review scheduled after the fact turns into a search for a favourable framing.

Review every input, not just the outcome. The outcome tells you whether you were right; the inputs tell you why, and only the second kind of answer improves the next model.

| Line | Forecast for the quarter | Realized | Variance | What the gap means |
| --- | --- | --- | --- | --- |
| Contact rate on accepted requests | 95% | 92% | Minus 3 pp | Rules fire, the after-hours queue still leaks |
| Requests never contacted | 54 | 78 | Plus 24 | Recovery share was 0.57, not 0.70 |
| Median first response time | Under 20 min | 21 min | On target | Mechanism works as designed |
| Incremental won deals | 5.00 | 3.40 | Minus 1.6 | Recovered requests converted worse than assumed |
| Contribution per won deal | $2,200 | $2,050 | Minus $150 | Recovered deals were smaller, as expected |
| Hours released | 120 | 145 | Plus 25 | Time saving beat the estimate |
| Realization factor | 0.40 | 0.15 | Minus 0.25 | Nobody was redeployed, no hire was cancelled |
| Recurring cost per quarter | $3,600 | $4,250 | Plus $650 | Usage tiers and unplanned change requests |
| One-time cost | $20,000 | $22,400 | Plus $2,400 | Cleanup ran longer than scoped |

Recompute the model with the realized column rather than arguing about the forecast. Here that gives $6,970 of deal contribution plus $609 of capacity value, against $4,250 of recurring cost: about $3,329 net per quarter. Payback moves from month 10 to somewhere past month 20, and the project is still positive but is a different investment from the one that was approved.

Notice where the damage came from. The conversion story everyone argued about cost less than the two lines nobody discussed: the realization factor and recurring cost. That pattern repeats often enough to plan around it. Put a named owner on redeploying released hours at the start, and get usage-based pricing tiers modelled at the volume you expect to reach, not the volume you have today.

Three outcomes end the review. Continue as is, with updated inputs carried into the next forecast. Continue with a fix, where a named defect has an owner and a date. Or stop, which needs to be a real option: a review where stopping is unthinkable is not a review. Whatever the decision, write the revised model back into the same document, so the next business case in this company starts from measured inputs rather than from a vendor's default.

Keep the review separate from platform-reported figures where you can. Analytics platforms fill observation gaps with estimates, and [Google's Analytics documentation](https://support.google.com/analytics/answer/11242841) is worth reading before any platform-reported conversion number goes into a finance line. For this model, prefer counts you can trace to individual records: requests accepted, attempts logged, deals closed.

## What does this model not prove?

A model that claims too much gets used once. Say the limits out loud, in the same document, and the number survives contact with a sceptical reader.

It does not prove causation without a control arm. Without a holdout, the model shows that things moved together in a period when you also changed something. That is a reasonable basis for a decision and a poor basis for a claim.

It does not prove the market would have stayed still. Demand, competition, and pricing all move on their own. A comparable-baseline pilot narrows this; nothing eliminates it.

It does not value what it cannot count. Faster response is also a customer experience change, and bot-first handling can cost goodwill that shows up quarters later in referrals rather than immediately in the contact rate. Audit trails, resilience to staff turnover, and the ability to answer a regulator are all real benefits. Write them as a short qualitative annex with a named owner instead of inventing a number for them, because a fabricated number in that section discredits the sections that were measured.

It does not transfer. Your inputs are yours. A payback figure from another company, including one in the same industry, tells you nothing about yours, and this applies to the illustrative figures in this guide as strongly as to anyone else's.

It does not survive its own point estimate. The middle column is the least informative part of the scenario table. Present the range, the break-even deal count, and the sensitivity ranking; if you are asked for one number, give the break-even threshold rather than the forecast, because it is the only figure the audience can sanity-check from their own experience.

Old research deserves the same treatment. The MIT and InsideSales [lead response management study](https://www.leadresponsemanagement.org/lrm_study.pdf) compared contact odds inside its own dataset, collected around 2007, and the widely quoted multipliers drawn from it describe relative odds of making contact in that sample, not the conversion lift your project will produce. It appears in vendor calculators as a revenue assumption constantly. Cite it for the mechanism if you want; do not let it become a line in your forecast.

## What is the practical sequence, and where does this connect?

The order matters because each step removes an argument from the next one.

1. **Agree the contribution margin definition with finance, in writing.** Nothing else is worth doing until this line is settled, because it multiplies everything.
2. **Freeze and export a baseline period** before any change, including the uncontacted count from the activity log.
3. **Get the defect list** from an [inbound lead audit](/guides/inbound-lead-audit/), so you price a specific set of fixes rather than a category of software.
4. **Build the cost register** with quotes for external lines and loaded rates for internal hours, including the five forgotten lines.
5. **Write the three scenarios and the break-even deal count** before the first vendor demo, so the demo is measured against your model rather than the reverse.
6. **Pre-register the pilot**: design, arms, duration, primary metric, decision threshold, and what happens if the result is ambiguous.
7. **Run the pilot on upstream metrics**, contact rate and response time, not on the deal count you cannot measure in the time available.
8. **Recompute with realized inputs and decide.** Approve, rescope, or stop.
9. **Book the realized-value review** one quarter after full rollout, with the forecast table attached to the invitation.

Step five is the one that gets skipped, and skipping it inverts the whole exercise: instead of a model that evaluates a vendor, you get a vendor that supplies your model.

Where this sits in the wider system is straightforward. The [lead ops stack](/guides/lead-ops-stack/) describes the modules whose cost you are pricing. Who owns the economics inside the company, and how that differs from a revenue operations remit, is covered in [lead ops versus revops](/guides/lead-ops-vs-revops/). The [OperStack system map](/) shows how capture, routing, qualification, and handoff connect, which is the flow this model puts a price on.

If you want the model above filled in with your own baseline rather than illustrative figures, a [lead operations audit](/audit/?utm=guide-roi) returns your cost register, your three scenarios, and the break-even deal count your team would have to produce for the investment to return inside a year. Where the decision is which opportunities to fund at all, that assessment is sold on its own as [AI consulting services](/services/ai-consulting-services/).
