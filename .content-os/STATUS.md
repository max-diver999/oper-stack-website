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
| Fix-batch 10 EN-гайдов | ✅ ветка `claude/operstack-en-content-fix` |

Что дал fix-batch: заголовки сведены с 22–35 до 15–17 на статью (было по 70–100 слов на секцию, статьи читались как склейка чек-листов); служебный язык контент-движка убран из читательских заголовков; добавлены атрибутированные источники, 3–5 на статью, у `lead-hub-vs-crm` их было ноль; pillar получил секцию «LeadOps vs RevOps vs marketing automation», до этого RevOps не упоминался во всём корпусе; восстановлены CTA-ссылки `/audit/?utm=guide-*`, которые страница аудита читает как источник заявки.

## Фаза 1 — новые статьи (✅ одобрено Максимом 2026-08-21)

Одобрение и волны зафиксированы в `oper-stack-ru/.content-os/lock.json`.

Восемь новых EN-slug: `inbound-automation-roi`, `lead-ops-vs-revops`, `mql-sql-lead-handoff`, `website-lead-capture`, `lead-follow-up-system`, `inbound-lead-audit`, `inbound-lead-reporting`, `ai-sdr-vs-human-sdr`. Английский корпус вырос с 10 до 18 гайдов.

Каждая статья написана по SERP-брифу с явным разделом «Ownership boundary», который запрещает забирать тему у существующего гайда. Аудит фазы 0 показал, что кластер ломается именно так, поэтому граница фиксировалась до написания, а не чинилась после.

Чем закрываются дыры: кластер покрывал только середину воронки. Новые статьи закрывают приём заявки, дожим, отчётность, экономику и три позиционных провала (RevOps, граница MQL и SQL, решение о покупке ИИ-агента). `inbound-lead-audit` работает диагностической точкой входа и навигатором по кластеру, он же поддерживает страницу `/audit/`.

**Локальная политика:** тема, которая не имеет смысла на английском, на английском не пишется, и наоборот (`locale_only_slugs_allowed` в программе). Поэтому у двух русских slug (`amocrm-bitrix24-lead-ops`, `telegram-leads-crm`) английских пар нет и не будет. Ссылаться на них из английских файлов нельзя.

## Что НЕ смешивать

- **Не** контент moregroup.estate / moregroupestate.ru
- **Не** Phuket Дzen (`dzen-registry.md`)
- Технические паттерны MORE Group — только из playbook, не тексты

## Ветки

| Репозиторий | Ветка |
|---|---|
| oper-stack-website | `claude/operstack-en-content-fix` |
| oper-stack-ru | `claude/operstack-content-audit-5g58sm` |
| more-group-content-os | `claude/operstack-briefs-fix` |

PR не открыты: открываю только по явной просьбе. Порядок обязателен: сначала PR в `more-group-content-os` с briefs, затем PR в оба сайта.

## Submodule

```bash
git pull origin main
git submodule update --init --recursive
```
