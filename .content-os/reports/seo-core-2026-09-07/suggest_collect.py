#!/usr/bin/env python3
"""Free vocabulary discovery: Google Autocomplete (EN, several gl) + Yandex suggest (RU).
No keys, no cost. Gives shape and phrasing, not volume."""
import urllib.request, urllib.parse, json, ssl, time, sys, os, itertools, string

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import seeds

ctx = ssl.create_default_context()
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'suggest.json')

def google(q, gl='us', hl='en'):
    url = 'https://suggestqueries.google.com/complete/search?' + urllib.parse.urlencode(
        {'client': 'firefox', 'q': q, 'gl': gl, 'hl': hl})
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}),
                                   timeout=15, context=ctx).read().decode('utf-8', 'ignore')
        return json.loads(r)[1]
    except Exception:
        return []

def yandex(q):
    url = 'https://suggest.yandex.ru/suggest-ya.cgi?' + urllib.parse.urlencode(
        {'srv': 'morda_ru_desktop', 'wiz': 'TrWth', 'uil': 'ru', 'part': q})
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}),
                                   timeout=15, context=ctx).read().decode('utf-8', 'ignore')
        i, j = r.find('('), r.rfind(')')
        d = json.loads(r[i+1:j])
        return [x[0] if isinstance(x, list) else x for x in d[1]]
    except Exception:
        return []

MODS_EN = [''] + [' ' + c for c in string.ascii_lowercase] + \
          [' for', ' cost', ' price', ' pricing', ' company', ' companies', ' services',
           ' best', ' how to', ' vs', ' near me', ' software', ' tools', ' examples', ' template']
PRE_EN  = ['how to ', 'what is ', 'best ', 'top ']
MODS_RU = [''] + [' ' + c for c in 'абвгдежзиклмнопрстуфхцчшщэюя'] + \
          [' цена', ' стоимость', ' сколько стоит', ' под ключ', ' услуги', ' компания',
           ' заказать', ' для', ' что такое', ' как', ' примеры', ' отзывы']
PRE_RU  = ['как ', 'что такое ', 'сколько стоит ', 'лучшие ']

out = {'google': {}, 'yandex': {}}
GL = [('us','en'), ('uk','en'), ('ca','en'), ('au','en'), ('de','en'), ('sg','en'), ('ae','en'), ('in','en')]

n = 0
for s in seeds.EN_ALL:
    for gl, hl in GL[:3]:                    # us, uk, ca get full modifier sweep
        for m in MODS_EN:
            for r in google(s + m, gl, hl):
                out['google'].setdefault(r.lower(), set()).add(gl)
            n += 1
    for p in PRE_EN:
        for r in google(p + s, 'us', 'en'):
            out['google'].setdefault(r.lower(), set()).add('us')
        n += 1
    for gl, hl in GL[3:]:                    # au, de, sg, ae, in: bare seed only
        for r in google(s, gl, hl):
            out['google'].setdefault(r.lower(), set()).add(gl)
        n += 1
    print(f'EN {s[:40]:42s} total={len(out["google"])} reqs={n}', flush=True)

for s in seeds.RU_ALL:
    for m in MODS_RU:
        for r in yandex(s + m):
            out['yandex'].setdefault(r.lower(), set()).add('ru')
        n += 1
    for p in PRE_RU:
        for r in yandex(p + s):
            out['yandex'].setdefault(r.lower(), set()).add('ru')
        n += 1
    print(f'RU {s[:40]:42s} total={len(out["yandex"])} reqs={n}', flush=True)

json.dump({'google': {k: sorted(v) for k, v in out['google'].items()},
           'yandex': sorted(out['yandex'].keys()),
           'requests': n},
          open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'DONE requests={n} google={len(out["google"])} yandex={len(out["yandex"])}')
