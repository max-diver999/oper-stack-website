#!/usr/bin/env python3
"""Собрать ядра для загрузки в Topvisor.
EN из выгрузок Semrush, RU из классифицированного Wordstat.
Кластер = будущая группа в Topvisor и страница-владелец.

Запуск: python3 build_topvisor_core.py
На выходе topvisor-import-en.csv и topvisor-import-ru.csv в формате `фраза;группа`.
"""
import csv, json, os, re, sys, collections
HERE = os.path.dirname(os.path.abspath(__file__))
S = os.path.join(HERE, 'semrush')

# ---------- EN ----------
en = {}
def add(kw, vol, cluster=None):
    k = kw.strip().lower()
    if not k or ';' in k: return
    if k not in en or vol > en[k]['v']: en[k] = {'v': vol, 'c': cluster}
    elif cluster and not en[k]['c']: en[k]['c'] = cluster

for f in ('us_coreA.csv', 'us_coreB.csv', 'us_fullsearch.csv'):
    path = os.path.join(S, f)
    if not os.path.exists(path): continue
    for r in csv.DictReader(open(path, encoding='utf-8'), delimiter=';'):
        add(r['keyword'], int(r.get('volume') or 0))
sys.path.insert(0, S)
import countries as C
for db, d in C.V.items():
    for k, v in d.items(): add(k, v)

EN_CLUSTERS = [
 ('ai-automation-agency',   r'automation agenc|agency automation|agenc\w* automation|automation .*agenc|'
                            r'automation platform for agencies|\bai agency\b'),
 ('ai-consulting',          r'ai automation consult|ai (consulting|consultant|consultants|consultancy|consultation)|'
                            r'consulting (firm|compan|agenc)|ai strategy consulting|'
                            r'ai (ml|technology|business|marketing|healthcare) consult'),
 ('ai-automation-services', r'\bai\b.*automation (services|solutions|service)|automation (services|solutions).*\bai\b|'
                            r'^ai automation$|ai automation (tools|software|companies|businesses)|'
                            r'ai (business|workflow|process) automation|ai for business automation|'
                            r'what is ai automation|ai and automation|ai marketing automation|ai workflow automation'),
 ('ai-implementation',      r'ai implementation|implement ai|implementing ai|ai integration|ai adoption|'
                            r'ai transformation|ai readiness'),
 ('ai-agents',              r'\bai agent|agentic|custom ai agents|ai agents for business|llm integration|'
                            r'rag implementation'),
 ('ai-sales',               r'ai sdr|ai sales agent|ai appointment setter|ai receptionist|ai voice agent|'
                            r'ai phone agent|ai customer service|ai chatbot'),
 ('automation-tools',       r'\bn8n\b|zapier|make\.com'),
 ('workflow-automation',    r'workflow automation|business process automation|process automation'),
 ('ai-for-business',        r'ai for (business|small business)|ai solutions for business|chatgpt for business'),
 ('lead-routing',           r'lead (routing|assignment|distribution)|round robin'),
 ('lead-qualification',     r'lead (qualification|scoring)|mql|handoff|lead acceptance'),
 ('lead-management',        r'lead (management|tracking)|managing leads|lead manager|inbound crm|inbound lead'),
 ('lead-capture',           r'lead capture|web form|website lead'),
 ('lead-attribution',       r'attribution|closed loop'),
 ('speed-to-lead',          r'speed to lead|lead response|follow up|cadence|sales sequence|nurtur|lead leakage'),
 ('revops',                 r'revops|revenue operations|lead ops|lead operations|inbound sales process'),
 ('crm',                    r'\bcrm\b'),
]
def en_cluster(k):
    for name, rx in EN_CLUSTERS:
        if re.search(rx, k): return name
    return 'other'
for k, m in en.items():
    if not m['c']: m['c'] = en_cluster(k)

# ---------- RU ----------
ru_raw = json.load(open(os.path.join(HERE, 'ru-core-classified.json'), encoding='utf-8'))['kept']
RU_CLUSTERS = [
 ('goszakupki',              r'интеграция решений с применением'),
 ('ii-agenty',               r'\bии.?агент|агент\w* (ии|на базе)|разработк\w* ии.?агент|создани\w* ии.?агент|'
                             r'ии.?ассистент|ассистент\w* на базе'),
 ('vnedrenie-ii',            r'внедрен\w*.*(ии|искусственн|нейросет)|(ии|искусственн\w+ интеллект\w*|нейросет\w*).*внедрен'),
 ('ii-dlya-biznesa',         r'(ии|искусственн\w+ интеллект\w*|нейросет\w*|gpt|chatgpt).*(для бизнеса|для компани|в бизнесе|'
                             r'для предприят|бизнес)|(бизнес).*(ии|нейросет)'),
 ('avtomatizaciya-biznesa',  r'автоматизац\w* (бизнес\w*|компани|предприят|организац|управлен|малого|среднего|'
                             r'склад\w*|учет\w*|документооборот\w*|рутин\w*|задач)|систем\w* автоматизац|'
                             r'цифровизац|бизнес.?процесс'),
 ('avtomatizaciya-prodazh',  r'автоматизац\w* продаж|отдел\w* продаж|воронк\w* продаж|конверси\w*'),
 ('vnedrenie-crm',           r'\bcrm\b|amo ?crm|битрикс'),
 ('rabota-s-zayavkami',      r'заявк|\bлид\w*|лидогенерац|распределен|квалификац|скоринг|обработк'),
 ('skvoznaya-analitika',     r'сквозн\w* аналитик'),
 ('chatboty',                r'chat ?gpt|чат ?gpt|интеграц\w* chatgpt|чат.?бот|\bбот\b|голосов\w+ робот|телефони'),
 ('avtomatizaciya-obshaya',  r'автоматизац'),
]
def ru_cluster(k):
    for name, rx in RU_CLUSTERS:
        if re.search(rx, k): return name
    return 'ii-prochee'
ru = {k: {'v': v['v'], 'c': ru_cluster(k)} for k, v in ru_raw.items()}

# ---------- отчёт и файлы импорта ----------
def dump(name, data, path, minvol):
    keep = {k: m for k, m in data.items() if m['v'] >= minvol and ';' not in k}
    byc = collections.defaultdict(list)
    for k, m in keep.items(): byc[m['c']].append((k, m['v']))
    lines = []
    print(f'\n=== {name}: {len(keep)} фраз, {sum(m["v"] for m in keep.values()):,} показов/мес')
    print(f'{"группа":28s}{"фраз":>6s}{"показов":>11s}')
    for c in sorted(byc, key=lambda c: -sum(v for _, v in byc[c])):
        rows = sorted(byc[c], key=lambda t: -t[1])
        print(f'{c:28s}{len(rows):6d}{sum(v for _, v in rows):11,d}')
        lines += [f'{k};{c}' for k, _ in rows]
    open(path, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
    return len(keep)

n_en = dump('EN', en, os.path.join(HERE, 'topvisor-import-en.csv'), 20)
n_ru = dump('RU', ru, os.path.join(HERE, 'topvisor-import-ru.csv'), 30)
print(f'\nИТОГО к загрузке: {n_en + n_ru} фраз (EN {n_en}, RU {n_ru})')
