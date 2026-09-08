#!/usr/bin/env python3
"""Wordstat via XMLRiver new endpoint for oper-stack.ru. 0.025 RUB per seed.
Returns 'popular' (phrases containing the seed) and 'associations' (related demand)."""
import urllib.request, urllib.parse, json, os, ssl, time, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import seeds

ctx = ssl.create_default_context()
U = os.environ['XMLRIVER_USER']; K = os.environ['XMLRIVER_KEY']
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'wordstat.json')

def ws(q, tries=3):
    url = 'https://xmlriver.com/wordstat/new/json?' + urllib.parse.urlencode({'user': U, 'key': K, 'query': q})
    for i in range(tries):
        try:
            r = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}),
                                       timeout=45, context=ctx).read().decode('utf-8', 'ignore')
            d = json.loads(r)
            if isinstance(d, dict) and 'error' in d:
                return {'error': d.get('error')}
            return d
        except Exception as e:
            if i == tries - 1: return {'error': str(e)}
            time.sleep(2)
    return {'error': 'unreachable'}

res = {}
for i, s in enumerate(seeds.RU_ALL, 1):
    d = ws(s)
    res[s] = d
    pop = d.get('popular', []) if isinstance(d, dict) else []
    ass = d.get('associations', []) if isinstance(d, dict) else []
    top = pop[0] if pop else {}
    print(f'{i:3d}/{len(seeds.RU_ALL)} {s[:44]:46s} popular={len(pop):3d} assoc={len(ass):3d} '
          f'head={top.get("value","-")}', flush=True)
    json.dump(res, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False)
print(f'DONE seeds={len(seeds.RU_ALL)} cost={len(seeds.RU_ALL)*0.025:.2f} RUB')
