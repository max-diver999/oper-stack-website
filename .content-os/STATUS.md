# Content status — oper-stack.com (EN)

> Claude Code и Cursor читают **первым** после `git pull origin main`.

## Источник правды

- Репо: `max-diver999/oper-stack-website`, ветка **`main`**
- Сестра (RU): `oper-stack-ru` → https://oper-stack.ru/
- Программа: `more-group-content-os/programs/oper-stack.yaml`

## Фаза 0 — аудит + fix-batch + roadmap (✅ 2026-08-21, ждёт «ок» Максима)

Content OS pilot подключён **2026-08-21**, на GitHub `main`.

| Задача Claude | Статус |
|---|---|
| Полный аудит 10 EN-гайдов | ✅ отчёт в `oper-stack-ru/.content-os/reports/SITE-AUDIT-2026-08-21.md` |
| Карта кластера vs `OPERSTACK_CONTENT_POLICY.md` | ✅ прямой каннибализации нет, пограничные зоны разведены |
| Gap vs SERP briefs в content-os | ✅ закрыт по объёму и покрытию must-cover |
| Fix-batch 10 EN-гайдов | ✅ ветка `claude/operstack-en-content-fix` |
| Roadmap новых статей EN (+ sync slug RU) | ✅ `oper-stack-ru/.content-os/batches/content-roadmap-2026-08-21.md` |
| Dzen B2B темы (RU) | ✅ `dzen-roadmap-2026-08-21.md` |
| Написание новых статей | ⛔ СТОП до «ок» Максима |

### Опубликованный корпус (10 guides)

Pillar: `lead-ops-stack`. Supporting: ai-lead-qualification, crm-automation-inbound, programmatic-seo-lead-gen, lead-routing-playbook, aeo-geo-inbound-marketing, sales-team-onboarding-ai, lead-attribution-inbound, sla-speed-to-lead, lead-hub-vs-crm.

### Что сделал fix-batch

- Слияние фрагментированных секций: было 22–35 H2 на статью при ~2 300 словах (по 70–100 слов на секцию), стало 15–17 H2 при существенно большем объёме. Политика прямо запрещает статьи-склейки из чек-листов.
- Служебный GEO-язык убран из читательских заголовков: «Citability block», «Probe query library for OperStack guides», «AI sub-query cluster map», «Monthly probe log». Содержание секций сохранено под нормальными вопросами.
- Добавлены атрибутированные источники, 3–5 на статью. `lead-hub-vs-crm` был единственным гайдом с нулём источников, теперь их четыре. Старые исследования подаются с годом и ограничениями: HBR 2011 как отдельный аудит 2 241 компании со средним ответом около 42 часов среди ответивших, MIT/InsideSales как сравнение шансов внутри своего датасета.
- Pillar получил секцию «LeadOps vs RevOps vs marketing automation» (пункт №1 must-cover брифа). До этого RevOps не упоминался во всём корпусе ни разу, то есть кластер был нецитируем по определяющему сравнению своей категории.
- Границы владения темами приведены в соответствие с политикой: эскалация ушла к `sla-speed-to-lead`, аттестация к `sales-team-onboarding-ai`, дедупликация к `crm-automation-inbound`. В остальных статьях остались абзац и ссылка.
- Проставлен `updatedDate: 2026-08-21`, FAQ доведены до 6–7 пунктов.
- Восстановлены CTA-ссылки `/audit/?utm=guide-*`: страница `/audit/` читает эту метку и передаёт её в заявку.

### Новый бриф

`lead-hub-vs-crm` был единственным опубликованным slug без SERP-брифа. Бриф создан в `more-group-content-os` (ветка `claude/operstack-briefs-fix`), там же переименован `inbound-sla-speed-to-lead.md` в `sla-speed-to-lead.md` под реальный slug.

### Что НЕ смешивать

- **Не** контент moregroup.estate / moregroupestate.ru
- **Не** Phuket Дzen (`dzen-registry.md`)
- Технические паттерны MORE Group — только из playbook, не тексты

### Следующий шаг

После «ок» Максима волна 1: `inbound-automation-roi`, `lead-ops-vs-revops`, `mql-sql-lead-handoff` (EN + RU). Сначала PR с briefs в `more-group-content-os`, затем PR с MDX в оба сайта.

## Submodule

```bash
git pull origin main
git submodule update --init --recursive
```
