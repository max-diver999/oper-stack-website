#!/usr/bin/env python3
import urllib.request, urllib.parse, json, os, ssl, time, re
ctx = ssl.create_default_context()
U = os.environ['XMLRIVER_USER']; K = os.environ['XMLRIVER_KEY']
Q = ["внедрение ии","внедрение искусственного интеллекта","ии для бизнеса","нейросети для бизнеса",
     "внедрение ии в бизнес","разработка ии агентов","создание ии агентов","ии агенты для бизнеса",
     "автоматизация бизнес процессов","автоматизация с помощью ии","ии ассистент для бизнеса",
     "внедрение ии агентов","автоматизация продаж","внедрение crm","внедрение нейросетей"]
def serp(q, tries=4):
    p = {'user': U, 'key': K, 'query': q, 'groupby': 10, 'lr': 213}
    url = 'https://xmlriver.com/search_yandex/xml?' + urllib.parse.urlencode(p)
    for i in range(tries):
        try:
            r = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent':'Mozilla/5.0'}),
                                       timeout=60, context=ctx).read().decode('utf-8','ignore')
            docs = re.findall(r'<doc>(.*?)</doc>', r, re.S)
            out=[]
            for dd in docs[:10]:
                def cl(m):
                    if not m: return ''
                    s = re.sub(r'<!\[CDATA\[|\]\]>','',m.group(1))
                    return re.sub(r'<[^>]+>','',s).strip()
                out.append({'url': cl(re.search(r'<url>(.*?)</url>',dd,re.S)),
                            'title': cl(re.search(r'<title>(.*?)</title>',dd,re.S))})
            if out: return out
            time.sleep(3)
        except Exception: time.sleep(3)
    return []
res={}
for q in Q:
    res[q]=serp(q); print(f'{q[:40]:42s} {len(res[q])}', flush=True)
    json.dump(res, open('serp-ru.json','w',encoding='utf-8'), ensure_ascii=False)
print(f'DONE {len(Q)} cost={len(Q)*0.025:.2f} RUB')
