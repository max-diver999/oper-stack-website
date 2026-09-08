# oper-stack.com: план по англоязычному миру
Собран 7 сентября 2026, расширен 8 сентября. Рынок: США, Британия, Австралия, Канада.
Поисковик: Google. Связь с RU-сайтом: только бренд, ни одного общего slug.

## Состояние на 8 сентября 2026

| Волна | Страниц | Статус |
|---|---:|---|
| EN-0, аналитика и главные | 0 | GSC, GA4, Bing заведены. Главная и /audit/ не переписаны |
| EN-1, услуги ядра B | 9 | **в проде**, PR #3 смержен |
| EN-2 расширенная | 10 | **в PR**, ветка `cc/operstack-en-services-wave2` |
| EN-3, остаток ядра A плюс marketing automation | 7 | не начата |
| EN-4, перелинковка | 0 | частично сделана попутно |

Итого план вырос с 21 страницы до 26 после ревью волны 1 и разбора покрытия 8 сентября.

---

## 1. Ёмкость и что из неё исключено

| База | Ядро B | Ядро A | Всего |
|---|---:|---:|---:|
| us | 83 670 | 35 570 | **119 240** |
| in | 22 140 | 11 730 | 33 870 |
| uk | 18 510 | 7 030 | 25 540 |
| au | 12 750 | 3 770 | 16 520 |
| ca | 8 090 | 2 730 | 10 820 |
| ae + sg | 1 780 | 610 | 2 390 |
| **Итого** | **146 940** | **61 440** | **208 380** |

С хвостом порядка 400 000. Рабочий рынок (США, Британия, Австралия, Канада) 172 120.

**Исключено осознанно:**

| Что | Показов | Почему |
|---|---:|---|
| «agentic ai», «ai agents news» | ~90 500 | KD 88 до 98, новостной интент, покупателя нет |
| «ai for business», «chatgpt for business», «ai adoption» | ~24 000 | KD 69 до 85, держат IBM, EY, BCG |
| Индия отдельными страницами | 33 870 | CPC в 20 раз ниже, другой покупатель. В Topvisor как контроль |
| ОАЭ и Сингапур | 2 390 | 1,1 % рынка |

## 2. Что показала выдача

30 приоритетных запросов, 90 срезов по трём странам.

| Кто держит топ-10 США | Запросов из 30 |
|---|---:|
| Агентства и сервисные компании | 24 |
| Смешанный топ | 6 |
| Каталоги давят | 0 |
| Вендоры SaaS давят | 0 |

**Формула победителя: страница услуги или подборка. Лонгридов по коммерческим запросам в топе нет.**

`leewayhertz.com` держит около 30 000 показов головного спроса одной страницей
`/top-ai-consulting-companies/`. `automaly.io` берёт «ai automation services» на позицию 2
двумя URL. Это и есть причина, по которой волна 2 расширена подборками.

## 3. Разведка от 8 сентября: подборки и сравнения

| Фраза | Показов США | KD |
|---|---:|---:|
| n8n vs zapier | 1 900 | 40 |
| n8n vs make | 1 000 | 34 |
| top ai consulting firms | 1 000 | **9** |
| best ai consulting firms | 880 | 26 |
| ai agent vs chatbot | 720 | 41 |
| ai receptionist for small business | 720 | 51 |
| zapier vs make | 590 | 35 |
| best ai receptionist | 480 | 56 |
| ai sdr tools | 260 | 22 |
| best ai sdr tools | 210 | **12** |
| top ai agent development companies | 140 | 22 |
| top ai automation agencies | 110 | 27 |

Ось сравнений и подборок берётся при KD 9 до 41. Данные: `semrush/us_listicle_comparison.csv`.

## 4. Архитектура

```
/                                  переписать, сейчас 56 слов
/services/                         хаб, в проде
  ├── ai-automation-agency/        EN-1, в проде
  ├── ai-automation-services/      EN-1
  ├── n8n-agency/                  EN-1
  ├── ai-sdr/                      EN-1
  ├── ai-agent-development-company/ EN-1
  ├── ai-integration-services/     EN-1
  ├── ai-readiness-assessment/     EN-1
  ├── ai-automation-consultant/    EN-1
  ├── ai-consulting-services/      EN-2
  ├── workflow-automation-services/ EN-2
  ├── ai-implementation-services/  EN-2
  ├── ai-receptionist/             EN-2, голосовой кластер
  ├── ai-customer-service-agent/   EN-2, support-кластер
  ├── business-automation-agency/  EN-2
  ├── zapier-consultant/           EN-2
  └── … EN-3
/guides/                           21 гайд, из них 3 редакционных
  ├── top-ai-consulting-companies/ EN-2, подборка
  ├── top-ai-automation-agencies/  EN-2, подборка
  └── n8n-vs-zapier-vs-make/       EN-2, сравнение
/cases/  /pricing/  /audit/        переписать /audit/, 114 слов
```

## 5. Покрытие: что план берёт и что оставляет

**Поправка 8 сентября.** Раньше здесь стояло 208 380. Это была ошибка агрегата:
у 15 фраз шортлиста значения по США лежали в `us_fullsearch.csv` и не сливались с основной
выгрузкой, поэтому США по ним считались нулём. Недосчитано 15 670 показов.

Шортлист целиком: **224 050** показов на 95 фразах.

| | Показов | Доля | Что это |
|---|---:|---:|---|
| Покрыто страницами услуг | **172 420** | 77,0 % | 22 страницы услуги плюс хаб и 3 редакционные |
| Покрыто существующими гайдами | **24 350** | 10,9 % | revops, revenue operations, lead nurturing, mql vs sql, lead capture, sales cadence. Информационный интент, гайд это верный тип страницы, отдельная услуга каннибализировала бы |
| Исключено осознанно | **23 950** | 10,7 % | ai for business 10 970 KD 77, chatgpt for business 4 230 KD 85, ai adoption 3 430 KD 72, ai for small business 3 360 KD 70, ai solutions for business 1 960 KD 69 |
| Не закрыто | **3 330** | 1,5 % | ai transformation 2 630 KD 50, how to implement ai in business 430 KD 57, rag implementation 270 KD 51 |

**Адресовано сайтом: 196 770 из 224 050, то есть 87,8 %.**

Про исключённые 23 950. Это пять головных информационных фраз при KD 69 до 85, которые
держат IBM, Microsoft и блоги вендоров. Домену три месяца, базовая линия ноль.
Решение пересмотреть, когда GSC покажет, что домен набрал вес, а не раньше.

## 5a. Постраничный план

| Действие | Страниц |
|---|---:|
| создать | **26** (19 сделано, 7 осталось) |
| переделать | **3** (главная, /audit/, /guides/ как хаб) |
| склеить | **0** |
| закрыть | **0** |
| оставить | **18** гайдов |

Склеивать и закрывать нечего: повторов в трёх и более файлах 0,7 %, noindex нигде,
каннибализации нет.

## 6. Волна EN-3, что осталось

| URL | Заголовок | Показов | KD |
|---|---|---:|---|
| /services/lead-management-system/ | Lead Management System for Inbound Teams | 10 420 | 14-45 |
| /services/ai-lead-qualification/ | AI Lead Qualification: Fit, Intent, Handoff | 8 990 | 26-50 |
| /services/crm-automation-services/ | CRM Automation Services: Stages and Handoffs | 6 200 | 41 |
| /services/lead-attribution/ | Lead Attribution: Join Source Data to Revenue | 4 140 | 14-47 |
| /services/lead-routing-software/ | Lead Routing Software: Rules, Owners, Fallbacks | 2 610 | 15-23 |
| /services/speed-to-lead/ | Speed to Lead: Timers, Escalation, Reporting | 2 110 | 21-42 |
| /services/marketing-automation-agency/ | Marketing Automation Agency for Inbound Teams | 4 530 | 12-31 |

Добавлено 8 сентября. `marketing automation agency` даёт 2 400 в США при **KD 21**,
плюс 1 000 в Британии, 720 в Австралии, 260 в Канаде, 110 в Индии.
Хвост из `us_fullsearch`: b2b marketing automation agency 390 KD 20,
marketing automation implementation agency 210 **KD 12**, email automation agency 320 KD 31.

Это самая дешёвая по сложности страница из всех оставшихся. Пропущена была потому,
что при первом разборе покрытия я считал её в 2 130 показов: США по ней в агрегат не попали.

Самая дорогая фраза всего исследования: «lead routing software», CPC 49,99 доллара при KD 15.

## 7. Что подсказки Google дали сверх ядра

14 940 бесплатных запросов, 5 860 формулировок, 5 792 не было в купленном ядре.

| Ось | Формулировок | Что с этим сделано |
|---|---:|---|
| Формат работы | 840 | H2 «кому подходит» на страницах услуг |
| Выбор подрядчика | 415 | питает две подборки волны 2 |
| Связка с инструментом | 355 | сравнение n8n vs Zapier vs Make |
| Цена | 163 | блок точки входа на каждой странице услуги |
| Ниша | 114 | «for small business» подтверждено, отраслевых страниц не делаем |
| Рамка внедрения | 37 | лид-магнит на /services/ai-readiness-assessment/ |

Ловушка: 410 формулировок про работу и обучение (ai sdr jobs, revops bootcamp).
Соискатели, не покупатели. В ядро не берём, в отрицательные ключи для рекламы стоит.

## 8. Чего не обещаем

- Позиций по «ai consulting», «ai agency», «ai for business»: это 39 100 показов,
  которые держат EY, IBM, Slalom, BCG и Accenture при KD 45 до 71.
  Заходим хвостом: «ai consulting for small businesses» KD 12, «ai automation consulting» KD 11.
- Кластера «agentic ai»: 90 500 показов, KD 88 до 98, новостной интент.
- Сроков: базовая линия снята 7 сентября и равна нулю, GSC подключена 8 сентября.
  Первая честная оценка скорости через 6 до 8 недель.
- 208 380 это показы, не трафик. При доле 3 до 5 % это 6 000 до 10 000 показов в месяц,
  из которых кликов 5 до 8 %.

## 9. Что мерить и когда

Базовая линия: Topvisor 32876110, 169 фраз, 17 групп, Google по пяти регионам, найдено 0.

Около 10 сентября GSC накопит первые данные. Смотреть по кластерам, а не по отдельным
страницам, и обязательно device плюс country, чтобы отличить живые показы от рангтрекеров.

Через 6 до 8 недель повторить съём позиций: `python3 positions_poll.py EN`.
