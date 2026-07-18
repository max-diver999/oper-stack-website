# OperStack guide policy

This policy applies to `drafts/guides/` before any article moves to `src/content/guides/`.

## Editorial goal

OperStack publishes operator-grade guidance for teams that depend on inbound leads. Each article must solve one search intent, give a usable operating model, and state where the model stops working. The site does not promise a number-one ranking or guaranteed AI citations.

## Cluster roles

| Slug | Role | Primary intent | Topic it owns |
| --- | --- | --- | --- |
| `lead-ops-stack` | Pillar | What is a lead ops stack? | End-to-end system and module map |
| `ai-lead-qualification` | Supporting | How does AI qualify inbound leads? | Fit, intent, confidence, human handoff |
| `crm-automation-inbound` | Supporting | How should inbound CRM automation work? | Lifecycle stages, tags, tasks, data hygiene |
| `programmatic-seo-lead-gen` | Supporting | How can lead-gen firms use programmatic SEO? | Dataset, templates, uniqueness, quality gates |
| `lead-routing-playbook` | Supporting | How should inbound leads be assigned? | Rule precedence, ownership, fallback queues |
| `aeo-geo-inbound-marketing` | Supporting | How can inbound content earn AI citations? | Evidence, extractability, entity clarity, measurement |
| `sales-team-onboarding-ai` | Supporting | How can AI support sales onboarding? | Competencies, practice, evidence, certification |
| `lead-attribution-inbound` | Supporting | How should inbound source tracking work? | Original/latest source, UTMs, identity, revenue join |
| `sla-speed-to-lead` | Supporting | How should speed-to-lead SLAs be designed? | Timer definitions, evidence, escalation, reporting |
| `lead-hub-vs-crm` | Architecture | What belongs in a Lead Hub vs CRM? | System boundary, contracts, migration |

When a supporting article needs another article's owned topic, it gives a short answer and links to the owner. It does not reproduce the owner's table or checklist.

## Content floor

- `lead-ops-stack`: at least 2,800 body words
- other guides: at least 2,200 body words
- title: 50 to 60 characters
- description: 120 to 160 characters
- five or more FAQ items in frontmatter; the article layout renders them visibly
- three or more useful tables
- five or more contextual internal links with trailing slashes
- direct 40 to 60 word answer near the start
- at least one operator note, red flag, or failure mode
- at least one implementation sequence specific to the topic

Word count is a floor, not a target. Repeated checklists and generic conclusions fail the quality gate even when the file exceeds the minimum.

## Evidence policy

Use primary or official sources where possible:

- Google Search Central for search and scaled-content policies
- original MIT/InsideSales Lead Response Management study for the 5 vs 30 minute finding
- Harvard Business Review 2011 for its separate 2,241-company response audit
- official CRM documentation for feature claims
- peer-reviewed GEO research for measured visibility effects

Old studies must be identified by year and limitations. Vendor benchmarks are directional and labeled as vendor data. OperStack does not invent client results, proprietary conversion rates, integration coverage, or customer counts.

## Voice

- direct operator language
- specific examples before abstract explanation
- short paragraphs and varied rhythm
- honest boundaries and trade-offs
- no hype, fake certainty, or guaranteed ranking language
- no em dash or en dash
- `Maksim`, never `Maxim`
- standalone B2B positioning; no MORE Group or real-estate language

## GEO and AEO

- question-led headings where they match real queries
- answer-first opening paragraph under major headings
- self-contained passages with named subjects
- attributed evidence for consequential claims
- Organization, Article, and FAQ schema when published
- no manual FAQ copy in the body; frontmatter is the single source for the rendered FAQ
- `llms.txt` may support machine discovery, but it is not presented as a Google ranking requirement

## Draft gate

Run:

```bash
npm run audit:drafts
```

Publishing remains a separate action. Passing this draft gate does not authorize a commit, push, deployment, analytics setup, or indexing request.
