# Content status — oper-stack.com (EN)

> Claude Code и Cursor читают **первым** после `git pull origin main`.

## Источник правды

- Репо: `max-diver999/oper-stack-website`, ветка **`main`**
- Сестра (RU): `oper-stack-ru` → https://oper-stack.ru/
- Программа: `more-group-content-os/programs/oper-stack.yaml`

## Фаза 0 — аудит + topic discovery (⏳ старт 2026-08-21)

Content OS pilot подключён **2026-08-21**, на GitHub `main`.

| Задача Claude | Статус |
|---|---|
| Полный аудит 10 EN-гайдов | не начат |
| Карта кластера vs `OPERSTACK_CONTENT_POLICY.md` | не начат |
| Gap vs 10 SERP briefs в content-os | не начат |
| Roadmap новых статей EN (+ sync slug RU) | не начат |
| Dzen B2B темы (RU) | см. `dzen-registry-operstack.md` |

### Опубликованный корпус (10 guides)

Pillar: `lead-ops-stack`. Supporting: ai-lead-qualification, crm-automation-inbound, programmatic-seo-lead-gen, lead-routing-playbook, aeo-geo-inbound-marketing, sales-team-onboarding-ai, lead-attribution-inbound, sla-speed-to-lead, lead-hub-vs-crm.

### Что НЕ смешивать

- **Не** контент moregroup.estate / moregroupestate.ru  
- **Не** Phuket Дzen (`dzen-registry.md`)  
- Технические паттерны MORE Group — только из playbook, не тексты

### Следующий шаг для Claude (скопировать в чат)

```text
Pull main. oper-stack.com EN — Content OS pilot. Прочитай .content-os/STATUS.md, site-passport, programs/oper-stack.yaml, docs/OPERSTACK_CONTENT_POLICY.md, SERP briefs oper-stack-website.

Задача: полный аудит сайта + предложить roadmap новых гайдов (EN) и sync-тем для RU + идеи для Dzen B2B (отдельный реестр). Отчёт в .content-os/reports/ и roadmap в .content-os/batches/. СТОП до «ок». PR только после «ок».
```

## Submodule

```bash
git pull origin main
git submodule update --init --recursive
```

Submodule `more-group-content-os` → commit `7ebb62c` (program oper-stack).
