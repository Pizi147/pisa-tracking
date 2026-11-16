"""TD-QUET (17/11): so hai lượt đo toàn bộ (trước / sau đợt) theo đường mẫu × tần suất log 24 h — dòng trả và bước VM (do-it.py) / ngày.
python -I scripts/do-toan-bo-dot.py <truoc.json[,…]> <doit-truoc.txt> <sau.json[,…]> <doit-sau.txt> <log 24h> [bảng .md]
Chỉ so khoá (vai × url) có ở CẢ hai lượt, mã 200."""
import json, re, sys, collections, urllib.parse
sys.stdout.reconfigure(encoding='utf-8')
tr, dtr, sa, dsa, log = sys.argv[1:6]

def nap(ds):
    kq = {}
    for f in ds.split(','): kq.update(json.load(open(f, encoding='utf8')))
    return kq

def buoc(f):
    m = {}
    for l in open(f, encoding='utf8'):
        p = [x.strip() for x in l.split('|')]
        if len(p) >= 6 and p[0].isdigit(): m[p[5]] = int(p[0])
    return m

def mau(p):
    p = urllib.parse.unquote(p.split('?')[0])
    p = re.sub(r'/\d+(?=/|$)', '/:id', p)
    return re.sub(r'/diem-theo-luot/[^/]+$', '/diem-theo-luot/:luot', p)

def tach(khoa):
    ten, url = khoa.split(' · ', 1); meth = 'GET'
    if re.match(r'^(POST|PUT|PATCH|DELETE) ', url): meth, url = url.split(' ', 1)
    return meth + ' ' + mau(url)

pat = re.compile(r'\[(t|cham)\] (GET|POST|PUT|PATCH|DELETE) (\S+) (\d+) ms · (\d+) câu, (\d+) dòng')
tan = collections.Counter(); logd = collections.Counter()
for line in open(log, encoding='utf8'):
    m = pat.search(line)
    if m: k = m.group(2) + ' ' + mau(m.group(3).removeprefix('/api')); tan[k] += 1; logd[k] += int(m.group(6))

A, B, VA, VB = nap(tr), nap(sa), buoc(dtr), buoc(dsa)
g = collections.defaultdict(lambda: [[], [], [], [], [], []])   # dòng a, dòng b, bước a, bước b, câu a, câu b
for k in A.keys() & B.keys():
    if A[k]['status'] != 200 or B[k]['status'] != 200: continue
    x = g[tach(k)]
    x[0].append(A[k]['dong']); x[1].append(B[k]['dong']); x[4].append(A[k]['n']); x[5].append(B[k]['n'])
    if k in VA and k in VB: x[2].append(VA[k]); x[3].append(VB[k])
tb = lambda v: sum(v) / len(v) if v else 0
def khu(k):
    p = k.split(' ', 1)[1]
    if p.startswith('/my-work'): return 'TD-VIEC'
    if p in ('/hoc-vien-lop', '/tong-quan/v5', '/tong-quan/lop-toi-day/hai-khoi', '/phan-tich/giao-vien'): return 'TD-HVL'
    if p.startswith('/cham/lich-test') or p in ('/yeu-cau/dem', '/classes/:id/viec-theo-em'): return 'TD-CHAM'
    return 'TD-QUET'
hang = []
for k, x in g.items():
    n = tan[k]
    hang.append(dict(k=k, khu=khu(k), n=n, ca=round(tb(x[4])), cb=round(tb(x[5])), da=round(tb(x[0])), db=round(tb(x[1])),
                     va=round(tb(x[2])), vb=round(tb(x[3])), nda=round(n * tb(x[0])), ndb=round(n * tb(x[1])), nva=round(n * tb(x[2])), nvb=round(n * tb(x[3]))))
S = lambda f, h=hang: sum(r[f] for r in h)
out = [f"Tổng (đường có ở log 24 h, {sum(1 for r in hang if r['n'])} đường): dòng trả / ngày {S('nda'):,} → {S('ndb'):,} "
       f"({round(100 * (S('ndb') - S('nda')) / max(S('nda'), 1))} %) · bước VM / ngày {S('nva'):,} → {S('nvb'):,} ({round(100 * (S('nvb') - S('nva')) / max(S('nva'), 1))} %)", '']
out.append('| Khu | dòng / ngày trước | sau | Δ % | bước VM / ngày trước | sau | Δ % |'); out.append('|---|---:|---:|---:|---:|---:|---:|')
for kh in ('TD-VIEC', 'TD-HVL', 'TD-CHAM', 'TD-QUET'):
    h = [r for r in hang if r['khu'] == kh]
    out.append(f"| {kh} | {S('nda', h):,} | {S('ndb', h):,} | {round(100 * (S('ndb', h) - S('nda', h)) / max(S('nda', h), 1))} | {S('nva', h):,} | {S('nvb', h):,} | {round(100 * (S('nvb', h) - S('nva', h)) / max(S('nva', h), 1))} |")
out += ['', '| Đường | khu | lần / 24 h | câu TB trước → sau | dòng TB trước → sau | bước VM TB trước → sau | dòng / ngày trước → sau | bước VM / ngày sau |',
        '|---|---|---:|---|---|---|---|---:|']
for r in sorted(hang, key=lambda r: (-r['nvb'], -r['vb'])):
    out.append(f"| `{r['k']}` | {r['khu']} | {r['n']} | {r['ca']} → {r['cb']} | {r['da']:,} → {r['db']:,} | {r['va']:,} → {r['vb']:,} | {r['nda']:,} → {r['ndb']:,} | {r['nvb']:,} |")
txt = '\n'.join(out)
if len(sys.argv) > 6: open(sys.argv[6], 'w', encoding='utf8').write(txt + '\n')
print('\n'.join(out[:40]))
