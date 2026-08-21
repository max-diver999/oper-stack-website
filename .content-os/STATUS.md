# Content status — oper-stack.com (EN)

> Claude Code и Cursor читают **первым** после `git pull origin main`.

## Источник правды

- Репо: `max-diver999/oper-stack-website`, ветка **`main`**
- Сестра (RU): `oper-stack-ru` → https://oper-stack.ru/
- Программа: `more-group-content-os/programs/oper-stack.yaml`

## Фаза 0 — аудит и fix-batch (✅ 2026-08-21)

| Задача | Статус |
|---|---|
| Полный аудит 10 EN-гайдов | ✅ отчёт в `oper-stack-ru/.content-os/reports/SITE-AUDIT-2026-08-21.md` |
| Карта кластера vs `OPERSTACK_CONTENT_POLICY.md` | ✅ границы владения разведены |
| Gap vs SERP briefs | ✅ закрыт по объёму и покрытию must-cover |
| Fix-batch 10 EN-гайдов | ✅ опубликовано в PR #1 |

Что дал fix-batch: заголовки сведены с 22–35 до 15–17 на статью; служебный язык контент-движка убран; добавлены атрибутированные источники; pillar получил секцию LeadOps vs RevOps; восстановлены CTA-ссылки `/audit/?utm=guide-*`.

## Фаза 1 — опубликовано (✅ на сайте 2026-08-21)

PR #1 влит в `main`. Content OS PR #10 (SERP-брифы) тоже влит.

| | Было | Стало |
|---|---|---|
| Гайдов на oper-stack.com | 10 | **18** |
| Переписано | 10 | |
| Новых | | **8** |

Новые slug: `inbound-automation-roi`, `lead-ops-vs-revops`, `mql-sql-lead-handoff`, `website-lead-capture`, `lead-follow-up-system`, `inbound-lead-audit`, `inbound-lead-reporting`, `ai-sdr-vs-human-sdr`.

Bing IndexNow: **18/18** URL. Google: ключ локально не настроен, подхватит sitemap.

## Что НЕ смешивать

- **Не** контент moregroup.estate / moregroupestate.ru
- **Не** Phuket Дzen (`dzen-registry.md`)
- Технические паттерны MORE Group — только из playbook, не тексты

## Submodule

```bash
git pull origin main
git submodule update --init --recursive
```
