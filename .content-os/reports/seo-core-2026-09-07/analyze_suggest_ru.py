#!/usr/bin/env python3
"""Что русские подсказки Яндекса дали сверх сетки сидов и сверх купленного ядра Wordstat."""
import json, re, sys, os, collections
HERE=os.path.dirname(os.path.abspath(__file__))
sug=json.load(open(os.path.join(HERE,'suggest-ru.json'),encoding='utf-8'))
core=json.load(open(os.path.join(HERE,'ru-core-classified.json'),encoding='utf-8'))
have={k.lower() for k in core['kept']} | {k.lower() for k in core['rejected']}
sys.path.insert(0,HERE); import seeds
seedset={s.lower() for s in seeds.RU_ALL}

new=[k for k in sug if k not in have and k not in seedset]
print(f'подсказок всего: {len(sug)}')
print(f'уже было в сборе Wordstat: {len(set(sug)&have)}')
print(f'НОВЫХ формулировок: {len(new)}\n')

STOP=re.compile(r'ваканси|зарплат|курс|обучени|бесплатн|скачать|реферат|диплом|отзывы сотрудник|'
                r'нейросеть (рису|для картин|для фото|для видео|для музык|для песен)')
PAT={
 'цена и стоимость':   r'\b(цена|цены|стоимость|сколько стоит|прайс|тариф|расценк|бюджет|за сколько)\b',
 'под ключ и формат':  r'\b(под ключ|аутсорс|подрядчик|исполнител|агентство|компания|студия|фрилансер|заказать|услуг)\b',
 'этапы и сроки':      r'\b(этап|пошагов|план|дорожн|сроки|за сколько времени|с чего начать|как внедрить|инструкц|чек.?лист|регламент)\b',
 'отрасль и размер':   r'\b(для (малого|среднего|крупного|производств|ритейл|логистик|медицин|клиник|юрист|стоматолог|салон|ресторан|строител|общепит|hr|интернет.?магазин))\b',
 'риски и возражения': r'\b(риск|проблем|ошибк|минус|недостатк|подводн|стоит ли|окупаемост|эффект|результат|кейс)\b',
 'локальный стек':     r'\b(1с|битрикс|amocrm|амосrm|амо ?срм|телеграм|telegram|яндекс|сбер|gigachat|алис|max)\b',
 'право и госсектор':  r'\b(закон|44.?фз|223.?фз|госзакуп|тендер|персональны|152.?фз|гост|сертифик|импортозамещ)\b',
}
agg=collections.defaultdict(list)
kept=[k for k in new if not STOP.search(k)]
print(f'после отсева учебного и потребительского: {len(kept)}\n')
for k in kept:
    for name,rx in PAT.items():
        if re.search(rx,k): agg[name].append(k)
for name in PAT:
    v=sorted(set(agg[name]))
    print(f'--- {name}: {len(v)}')
    for x in sorted(v,key=len)[:10]: print(f'      {x}')
    print()
json.dump({'new':kept,'buckets':{k:sorted(set(v)) for k,v in agg.items()}},
          open(os.path.join(HERE,'suggest-ru-new.json'),'w'),ensure_ascii=False,indent=1)
print('сохранено в suggest-ru-new.json')
