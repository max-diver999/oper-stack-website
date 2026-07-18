# oper-stack.com

OperStack marketing site: interactive system map homepage, `/audit` lead form.

## Local

```bash
npm install
npm run dev
```

Open http://localhost:4321/

## Deploy

Push to `main` on GitHub → Vercel auto-deploy.

DNS: Cloudflare CNAME `@` + `www` → `cname.vercel-dns.com`  
Email: `info@oper-stack.com` → `maks.shchegolev@gmail.com`

## Env (Vercel)

| Variable | Purpose |
|---|---|
| `TG_TOKEN` | Telegram bot for lead alerts |
| `TG_CHAT_ID` | Telegram chat |
| `NOTION_TOKEN` | Optional CRM |
| `NOTION_LEADS_DB` | Optional Notion database |
