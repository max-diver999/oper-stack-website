#!/usr/bin/env python3
"""Русские подсказки Яндекса. Бесплатно.
Разбор через raw_decode: ответ вида suggest.apply([...]) несёт хвост после массива,
и json.loads на нём падает с 'Extra data'."""
import urllib.request, urllib.parse, json, ssl, sys, os, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import seeds
ctx=ssl.create_default_context()
DEC=json.JSONDecoder()
OUT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'suggest-ru.json')

def yandex(q, tries=2):
    url='https://suggest.yandex.ru/suggest-ya.cgi?'+urllib.parse.urlencode(
        {'srv':'morda_ru_desktop','wiz':'TrWth','uil':'ru','part':q})
    for _ in range(tries):
        try:
            r=urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),
                                     timeout=15,context=ctx).read().decode('utf-8','ignore')
            i=r.find('(')
            if i<0: return []
            d,_=DEC.raw_decode(r[i+1:])          # берём только первый JSON, хвост игнорируем
            out=[]
            for x in (d[1] if len(d)>1 else []):
                out.append(x[0] if isinstance(x,list) else x)
            return [s for s in out if isinstance(s,str)]
        except Exception:
            time.sleep(1)
    return []

MODS=[''] + [' '+c for c in 'абвгдежзиклмнопрстуфхцчшщэюя'] + \
     [' цена',' стоимость',' сколько стоит',' под ключ',' услуги',' компания',
      ' заказать',' для',' что такое',' как',' примеры',' отзывы',' этапы',' сроки']
PRE=['как ','что такое ','сколько стоит ','лучшие ','заказать ']

# самопроверка перед прогоном
probe=yandex('внедрение ии')
print('самопроверка:', len(probe), 'подсказок,', probe[:3], flush=True)
if not probe:
    print('эндпоинт молчит, прогон не начинаю'); sys.exit(1)

out={}; n=0
for i,s in enumerate(seeds.RU_ALL,1):
    for m in MODS:
        for r in yandex(s+m): out.setdefault(r.lower(),set()).add(s); n+=1
    for p in PRE:
        for r in yandex(p+s): out.setdefault(r.lower(),set()).add(s); n+=1
    print(f'{i:3d}/{len(seeds.RU_ALL)} {s[:42]:44s} всего={len(out)} запросов~{i*(len(MODS)+len(PRE))}', flush=True)
    json.dump({k:sorted(v) for k,v in out.items()},open(OUT,'w',encoding='utf-8'),ensure_ascii=False)
print(f'DONE уникальных={len(out)}')
