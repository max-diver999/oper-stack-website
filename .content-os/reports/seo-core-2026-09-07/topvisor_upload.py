#!/usr/bin/env python3
"""Привязать поисковики с регионами и загрузить ядра в проекты OperStack.
EN 32876110 (oper-stack.com), RU 32876111 (oper-stack.ru).

Создание проектов, групп и загрузка фраз бесплатны. Платится только съём позиций.

Грабли, на которые уже наступили, не повторять:
  1. Файл импорта кодировать в CP1251, не в UTF-8. UTF-8 проходит без ошибки, но
     фразы ложатся двойной кодировкой: «внедрение ии» становится «рірѕрµрґсђрµрѕрёрµ рёрё».
  2. add/keywords_2/keywords/import каждый раз создаёт новый комплект групп, а не
     переиспользует по имени. Повторный импорт плодит дубли.
  3. Переносить фразы между группами нечем: edit/keywords_2/keywords не существует,
     а del/keywords_2/groups уносит фразы вместе с группой.
  Отсюда правило: перед импортом снести все группы и импортировать ОДИН раз.

Запуск:
  set -a; source ~/.config/more-group/seo-keys.env; set +a
  python3 topvisor_upload.py
"""
import json, os, time, uuid, urllib.request, urllib.error, collections

API = 'https://api.topvisor.com/v2/json/'
AUTH = {'User-Id': os.environ['TOPVISOR_USER_ID'],
        'Authorization': 'bearer ' + os.environ['TOPVISOR_KEY']}
HERE = os.path.dirname(os.path.abspath(__file__))
EN, RU = 32876110, 32876111


def call(method, payload):
    req = urllib.request.Request(API + method, json.dumps(payload).encode(),
                                 dict(AUTH, **{'Content-Type': 'application/json'}))
    try:
        return json.loads(urllib.request.urlopen(req, timeout=120).read().decode())
    except urllib.error.HTTPError as e:
        return {'errors': e.read().decode()[:250]}


def upload(method, field, fields, body_bytes, filename):
    boundary = '----tv' + uuid.uuid4().hex
    head = ''.join(f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'
                   for k, v in fields.items())
    head += (f'--{boundary}\r\nContent-Disposition: form-data; name="{field}"; '
             f'filename="{filename}"\r\nContent-Type: text/csv\r\n\r\n')
    payload = head.encode() + body_bytes + f'\r\n--{boundary}--\r\n'.encode()
    req = urllib.request.Request(API + method, payload,
                                 dict(AUTH, **{'Content-Type': f'multipart/form-data; boundary={boundary}'}))
    try:
        return json.loads(urllib.request.urlopen(req, timeout=180).read().decode())
    except urllib.error.HTTPError as e:
        return {'errors': e.read().decode()[:250]}


def attach_regions(pid, searcher_key, regions, lang):
    """regions: список (Название по-русски, код страны). Формат строки:
    searcher_key;"регион";код;язык;устройство;глубина, файл в CP1251."""
    print('  поисковик:', json.dumps(call('add/positions_2/searchers',
          {'project_id': pid, 'searcher_key': searcher_key}), ensure_ascii=False)[:100])
    body = ''.join(f'{searcher_key};"{name}";{cc};{lang};0;1\n' for name, cc in regions).encode('cp1251')
    print('  регионы   :', json.dumps(upload('add/positions_2/searchers/regions/import', 'regions',
          {'project_id': pid}, body, 'regions.csv'), ensure_ascii=False)[:100])


def wipe_and_import(pid, csv_path, label):
    """Снести все группы, затем импортировать один раз. Иначе будут дубли групп."""
    groups = call('get/keywords_2/groups', {'project_id': pid, 'fields': ['id', 'name']}).get('result') or []
    if groups:
        call('del/keywords_2/groups', {'project_id': pid,
             'filters': [{'name': 'id', 'operator': 'IN', 'values': [g['id'] for g in groups]}]})
        time.sleep(2)
    left = call('get/keywords_2/keywords', {'project_id': pid, 'fields': ['id'], 'limit': 5000}).get('result') or []
    if left:
        call('del/keywords_2/keywords', {'project_id': pid,
             'filters': [{'name': 'id', 'operator': 'IN', 'values': [k['id'] for k in left]}]})
        time.sleep(2)
    text = open(csv_path, encoding='utf-8').read()
    res = upload('add/keywords_2/keywords/import', 'keywords',
                 {'project_id': pid}, text.encode('cp1251'), os.path.basename(csv_path))
    print(f'  импорт    : {json.dumps(res, ensure_ascii=False)[:160]}')
    kw = call('get/keywords_2/keywords', {'project_id': pid,
              'fields': ['id', 'name', 'group_id'], 'limit': 5000}).get('result') or []
    g = call('get/keywords_2/groups', {'project_id': pid, 'fields': ['id', 'name']}).get('result') or []
    dups = [n for n, c in collections.Counter(x['name'] for x in g).items() if c > 1]
    moji = [k['name'] for k in kw[:200] if any(x in (k.get('name') or '') for x in ('рё', 'рѕ', 'сђ', 'Ð'))]
    print(f'  проверка  : групп {len(g)}, фраз {len(kw)}, дубли групп {dups or "нет"}, '
          f'кракозябр {len(moji)}')


if __name__ == '__main__':
    print('--- OperStack EN', EN)
    attach_regions(EN, 1, [('США', 'US'), ('Великобритания', 'GB'), ('Австралия', 'AU'),
                           ('Канада', 'CA'), ('Индия', 'IN')], 'en')
    wipe_and_import(EN, os.path.join(HERE, 'topvisor-import-en.csv'), 'EN')

    print('\n--- OperStack RU', RU)
    attach_regions(RU, 0, [('Москва', 'RU')], 'ru')   # Яндекс
    attach_regions(RU, 1, [('Россия', 'RU')], 'ru')   # Google
    wipe_and_import(RU, os.path.join(HERE, 'topvisor-import-ru.csv'), 'RU')

    print('\nЦена съёма (запускать отдельно через edit/positions_2/checker/go):')
    for pid, label in ((EN, 'EN'), (RU, 'RU')):
        p = call('get/positions_2/checker/price',
                 {'filters': [{'name': 'id', 'operator': 'EQUALS', 'values': [pid]}]})
        for _, v in ((p.get('result') or {}).get('pricesByUsers') or {}).items():
            print(f"  {label}: {v['price']} руб за {v['limits']} проверок")
