#!/usr/bin/env python3
"""Top-10 Google via XMLRiver for the priority queries, 3 buyer countries. 0.025 RUB per request."""
import urllib.request, urllib.parse, json, os, ssl, time, re, sys
ctx = ssl.create_default_context()
U = os.environ['XMLRIVER_USER']; K = os.environ['XMLRIVER_KEY']
OUT = 'serp.json'
COUNTRIES = {'us': 2840, 'uk': 2826, 'au': 2036}

QUERIES = [
 # ядро B, коммерческое
 "ai automation agency","ai automation services","ai automation consultant","ai consulting services",
 "ai consulting companies","ai integration services","ai implementation services","ai implementation consultant",
 "ai agent development company","ai agents for business","ai readiness assessment","ai appointment setter",
 "generative ai consulting services","business automation agency","workflow automation services",
 "n8n agency","zapier consultant","ai sdr","ai receptionist","how to implement ai in business",
 # ядро A, коммерческое
 "lead routing software","lead routing","speed to lead","lead distribution software","ai lead qualification",
 "inbound lead management","lead attribution","mql vs sql","lead capture form","closed loop reporting",
]

def serp(q, cid, tries=4):
    p = {'user': U, 'key': K, 'query': q, 'groupby': 10, 'country': cid, 'lr': 'en', 'device': 'desktop'}
    url = 'https://xmlriver.com/search/xml?' + urllib.parse.urlencode(p)
    for i in range(tries):
        try:
            r = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0'}),
                                       timeout=60, context=ctx).read().decode('utf-8','ignore')
            if '<error' in r and 'retry' in r.lower():
                time.sleep(3); continue
            docs = re.findall(r'<doc>(.*?)</doc>', r, re.S)
            out = []
            for dd in docs[:10]:
                u = re.search(r'<url>(.*?)</url>', dd, re.S)
                t = re.search(r'<title>(.*?)</title>', dd, re.S)
                def cl(x):
                    if not x: return ''
                    s = x.group(1)
                    s = re.sub(r'<!\[CDATA\[|\]\]>', '', s)
                    return re.sub(r'<[^>]+>', '', s).strip()
                out.append({'url': cl(u), 'title': cl(t)})
            if out: return out
            time.sleep(2)
        except Exception:
            time.sleep(3)
    return []

res = {}
n = 0
for q in QUERIES:
    res[q] = {}
    for c, cid in COUNTRIES.items():
        res[q][c] = serp(q, cid); n += 1
    got = {c: len(v) for c, v in res[q].items()}
    print(f'{q[:38]:40s} {got}', flush=True)
    json.dump(res, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False)
print(f'DONE requests={n} cost={n*0.025:.2f} RUB')
