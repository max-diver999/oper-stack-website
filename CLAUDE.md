# oper-stack.com — Claude Code entry

B2B **OperStack** (не недвижимость). Sister: **oper-stack.ru**. Program: `more-group-content-os/programs/oper-stack.yaml`.

Read **`.content-os/STATUS.md`** first after `git pull origin main`.

One-line prompts: **`CLAUDE-CODE-START.md`**.

## Paths

| What | Where |
|---|---|
| Passport | `.content-os/site-passport.yaml` |
| Content OS | `more-group-content-os/` (submodule — add on GitHub) |
| Cluster policy | `docs/OPERSTACK_CONTENT_POLICY.md` |
| Positioning | `POSITIONING.md` |
| SERP briefs | `more-group-content-os/content-engine/serp-briefs/oper-stack-website` |

## Workflow

1. Audit 10 guides → report + roadmap → **stop for Maxim «ок»**
2. After «ок»: new guides in batches → PR `cc/operstack-en-*`
3. Cursor: review, merge, deploy (Maxim «выложи»)

## Forbidden

- push main, deploy, index without Maxim + Cursor
- MORE Group / Phuket / listing content
- copy from moregroup.estate corpora

## Licence fulfilment (Site Kit)

`src/pages/api/paddle-webhook.ts` receives Paddle `transaction.completed`, verifies the signature, issues an Ed25519 licence key (`src/lib/licence-fulfilment.ts`) and emails it with a signed 30-day download link (`src/pages/api/kit-download.ts`, which redirects to the private GitHub release asset). Mail goes out over Workspace SMTP (`src/lib/mail-smtp.ts`). Offline tests: `node scripts/test-licence-fulfilment.mjs`. Production env: PADDLE_WEBHOOK_SECRET, PADDLE_API_KEY, PADDLE_SITE_KIT_PRICE_IDS, OPERSTACK_LICENCE_PRIVATE_KEY_B64, KIT_DOWNLOAD_SECRET, KIT_GITHUB_TOKEN, KIT_GITHUB_REPO, SMTP_USER, SMTP_PASS, LICENCE_FROM, LICENCE_NOTIFY_EMAIL. Values live in `MORE_Group/.secrets/` (paddle.env, google.env). Never log keys or tokens.

## Site Kit checkout

`PUBLIC_SITE_KIT_CHECKOUT_URL` (Vercel env) turns the Site Kit page from "Join the launch list" into "Buy for 79 USD" pointing at the Paddle checkout link. Leave it unset until Paddle approves oper-stack.com; the fulfilment webhook then emails the key.
