"""TD-QUET (17/11): bảng đo (đường mẫu × vai) câu · dòng · quét cả bảng từ <ra>.json của do-ban-chep.mjs (nhiều tệp: a.json,b.json), nhân tần suất log 24 h bản chính.
python -I scripts/do-toan-bo-bang.py <ra.json[,…]> <log 24h> [bảng .md]   (DOIT=<ra do-it.py> thêm cột quét · CHI_TIET=<.md> bảng từng vai × url)"""
import json, re, sys, collections, urllib.parse
sys.stdout.reconfigure(encoding='utf-8')
kq = {}
for f in sys.argv[1].split(','): kq.update(json.load(open(f, encoding='utf8')))
def mau(p):
    p = urllib.parse.unquote(p.split('?')[0])
    p = re.sub(r'/\d+(?=/|$)', '/:id', p)
    return re.sub(r'/diem-theo-luot/[^/]+$', '/diem-theo-luot/:luot', p)
# tần suất log
pat = re.compile(r'\[(t|cham)\] (GET|POST|PUT|PATCH|DELETE) (\S+) (\d+) ms · (\d+) câu, (\d+) dòng')
tan = collections.Counter(); logd = collections.Counter(); logms = collections.Counter()
for line in open(sys.argv[2], encoding='utf8'):
    m = pat.search(line)
    if m:
        k = m.group(2) + ' ' + mau(m.group(3).removeprefix('/api')); tan[k] += 1; logd[k] += int(m.group(6)); logms[k] += int(m.group(4))
# dòng quét cả bảng (do-it.py) theo khoá — tuỳ chọn, biến DOIT=<tệp ra của do-it.py>
import os
quet = {}
if os.environ.get('DOIT'):
    for line in open(os.environ['DOIT'], encoding='utf8'):
        p_ = [x.strip() for x in line.split('|')]
        if len(p_) >= 6 and p_[1].isdigit(): quet[p_[5]] = int(p_[1])
# gộp đo
g = collections.defaultdict(list)
for khoa, v in kq.items():
    ten, url = khoa.split(' · ', 1)
    meth = 'GET'
    if re.match(r'^(POST|PUT|PATCH|DELETE) ', url): meth, url = url.split(' ', 1)
    if v['status'] >= 300: continue
    g[meth + ' ' + mau(url)].append((ten, url, v['n'], v['dong'], v['ms'], quet.get(khoa, 0)))
hang = []
for k, ds in g.items():
    mx = max(ds, key=lambda x: x[3])
    tb = sum(x[3] for x in ds) / len(ds)
    hang.append((k, len(ds), max(x[2] for x in ds), mx[3], round(tb), max(x[5] for x in ds), mx[0], mx[1], tan[k], round(tan[k] * tb)))
hang.sort(key=lambda h: (-h[9], -h[3]))
def khu(k):
    p = k.split(' ', 1)[1]
    if p.startswith('/my-work'): return 'TD-VIEC'
    if p in ('/hoc-vien-lop', '/tong-quan/v5', '/tong-quan/lop-toi-day/hai-khoi', '/phan-tich/giao-vien'): return 'TD-HVL'
    if p.startswith('/cham/lich-test') or p in ('/yeu-cau/dem', '/classes/:id/viec-theo-em'): return 'TD-CHAM'
    return 'TD-QUET'
out = ['| Đường | khu | lượt đo | câu max | dòng max | dòng TB | quét cả bảng max | vai · url dòng max | lần / 24 h | ms TB (log) | dòng / ngày (ước) | vượt |', '|---|---|---:|---:|---:|---:|---:|---|---:|---:|---:|---|']
for h in hang:
    vuot = ' '.join(x for x, c in (('câu', h[2] > 30), ('dòng', h[3] > 2000), ('quét', h[5] > 1000)) if c)
    lms = round(logms[h[0]] / tan[h[0]]) if tan[h[0]] else ''
    out.append(f'| `{h[0]}` | {khu(h[0])} | {h[1]} | {h[2]} | {h[3]} | {h[4]} | {h[5]} | {h[6]} `{h[7][:60]}` | {h[8]} | {lms} | {h[9]} | {vuot} |')
txt = '\n'.join(out)
if os.environ.get('CHI_TIET'):
    ct = ['| Đường mẫu | vai | url | mã | câu | dòng | quét cả bảng | ms (SQLite cục bộ) |', '|---|---|---|---:|---:|---:|---:|---:|']
    tat = []
    for khoa, v in kq.items():
        ten, url = khoa.split(' · ', 1); meth = 'GET'
        if re.match(r'^(POST|PUT|PATCH|DELETE) ', url): meth, url = url.split(' ', 1)
        tat.append((v['dong'], meth + ' ' + mau(url), ten, url, v['status'], v['n'], quet.get(khoa, 0), v['ms']))
    for d, m_, ten, url, st, n, q, ms in sorted(tat, key=lambda r: (-r[0], r[1])):
        ct.append(f'| `{m_}` | {ten} | `{url[:90]}` | {st} | {n} | {d} | {q} | {ms} |')
    open(os.environ['CHI_TIET'], 'w', encoding='utf8').write('\n'.join(ct) + '\n')
if len(sys.argv) > 3: open(sys.argv[3], 'w', encoding='utf8').write(txt)
print(txt[:20000])
print('tổng dòng/ngày ước', sum(h[9] for h in hang), '· đường', len(hang))
