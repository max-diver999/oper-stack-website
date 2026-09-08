#!/usr/bin/env python3
"""Ждать окончания съёма в обоих проектах, потом выгрузить позиции и свести по кластерам."""
import json, os, time, urllib.request, urllib.error, datetime, collections, sys
API='https://api.topvisor.com/v2/json/'
A={'User-Id':os.environ['TOPVISOR_USER_ID'],'Authorization':'bearer '+os.environ['TOPVISOR_KEY']}
HERE=os.path.dirname(os.path.abspath(__file__))
REG=json.load(open(os.path.join(HERE,'regions.json'),encoding='utf-8'))
if len(sys.argv)>1:  # ограничить набор проектов: positions_poll.py EN
    want=set(a.upper() for a in sys.argv[1:])
    REG={k:v for k,v in REG.items() if k.upper() in want}
print('слежу за проектами:', list(REG), flush=True)
TODAY=datetime.date.today().isoformat()

def call(m,p):
    r=urllib.request.Request(API+m,json.dumps(p).encode(),dict(A,**{'Content-Type':'application/json'}))
    try: return json.loads(urllib.request.urlopen(r,timeout=120).read().decode())
    except urllib.error.HTTPError as e: return {'errors':e.read().decode()[:200]}
    except Exception as e: return {'errors':str(e)[:200]}

def total_cells(pid, nregions):
    """Сколько ячеек обязано быть: все фразы проекта на все регионы."""
    kw=call('get/keywords_2/keywords',{'project_id':pid,'fields':['id'],'limit':5000}).get('result') or []
    return len(kw)*nregions, len(kw)

def fetch(pid, idxs):
    return call('get/positions_2/history',{
        'project_id':pid,'regions_indexes':idxs,'date1':TODAY,'date2':TODAY,
        'show_headers':1,'show_exists_dates':1,
        'fields':['id','name','group_id'],'limit':2000})

PLACEHOLDER={'--','', None}
def parse_pos(v):
    """Topvisor отдаёт '--' пока запрос не проверен, и число либо '>100' когда проверен."""
    if v in PLACEHOLDER: return 'pending'
    s=str(v).strip()
    if s.startswith('>'): return 101
    try: return int(s)
    except ValueError: return 'pending'

def ready(r, expected, label):
    """Готово, когда история отдала все ожидаемые ячейки И ни одна не заглушка '--'.
    История наполняется постепенно, поэтому одной проверки на '--' мало."""
    res=r.get('result')
    if not isinstance(res,dict): return False
    kws=res.get('keywords') or []
    cells=[parse_pos(v.get('position'))
           for k in kws for v in (k.get('positionsData') or {}).values()]
    pend=sum(1 for c in cells if c=='pending')
    done=len(cells)-pend
    print(f'     {label}: ячеек {len(cells)} из {expected}, проверено {done}, заглушек {pend}', flush=True)
    return len(cells)>=expected and pend==0

deadline=time.time()+3*3600
state={}
while time.time()<deadline:
    allok=True
    for label,meta in REG.items():
        if state.get(label): continue
        idxs=[x['index'] for x in meta['regions']]
        expected,nkw=total_cells(meta['pid'],len(idxs))
        r=fetch(meta['pid'],idxs)
        if ready(r,expected,label):
            state[label]=r
            print(f'[{datetime.datetime.now():%H:%M}] {label} готов', flush=True)
        else:
            allok=False
            print(f'[{datetime.datetime.now():%H:%M}] {label} ещё считается', flush=True)
    if allok and len(state)==len(REG): break
    time.sleep(120)

json.dump({k:v for k,v in state.items()}, open(os.path.join(HERE,'positions-raw-%s.json'%'-'.join(REG)),'w'),
          ensure_ascii=False)

# ---------- сводка ----------
def groups_of(pid):
    g=call('get/keywords_2/groups',{'project_id':pid,'fields':['id','name']}).get('result') or []
    return {str(x['id']):x['name'] for x in g}

report={}
for label,meta in REG.items():
    r=state.get(label)
    if not r:
        print(f'\n{label}: съём не завершился за 3 часа'); continue
    gmap=groups_of(meta['pid'])
    names={str(x['index']):x['name'] for x in meta['regions']}
    kws=r['result'].get('keywords') or []
    rows=[]
    for k in kws:
        pd=k.get('positionsData') or {}
        for key,val in pd.items():
            idx=key.split(':')[-1]
            pos=parse_pos(val.get('position'))
            if pos=='pending': pos=None
            rows.append({'kw':k.get('name'),'group':gmap.get(str(k.get('group_id')),'?'),
                         'region':names.get(idx,idx),'pos':pos})
    report[label]=rows
    inTop={'1-3':0,'4-10':0,'11-30':0,'31-100':0,'нет':0}
    for x in rows:
        p=x['pos']
        if p is None or p>100: inTop['нет']+=1
        elif p<=3: inTop['1-3']+=1
        elif p<=10: inTop['4-10']+=1
        elif p<=30: inTop['11-30']+=1
        else: inTop['31-100']+=1
    print(f'\n=== {label}: {len(rows)} проверок ===')
    for k,v in inTop.items(): print(f'   {k:8s} {v:5d}  {v/max(len(rows),1)*100:5.1f} %')
    found=[x for x in rows if x['pos'] and x['pos']<=100]
    if found:
        print(f'\n   НАШЛОСЬ В ТОП-100: {len(found)}')
        for x in sorted(found,key=lambda x:x['pos'])[:40]:
            print(f"     {x['pos']:4d}  {x['region']:16s} {x['group']:24s} {x['kw'][:50]}")
    else:
        print('\n   ни одной позиции в топ-100')
json.dump(report, open(os.path.join(HERE,'positions-report-%s.json'%'-'.join(REG)),'w'), ensure_ascii=False, indent=1)
print('\nDONE')
