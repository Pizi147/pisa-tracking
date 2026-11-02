"""DOC-IT (02/11): đo dòng quét của từng (vai × đường) trên DB ×3 mà `tocDo.run` chép ra (cờ PISA_DO_IT — xem docs/toc-do/doc-it-0211.md).

  python -I scripts/do-it.py <base> [lọc-khoá-regex]          bảng: bước máy ảo · dòng quét cả bảng · chỉ mục tự dựng · câu · dòng trả · bảng bị SCAN
  python -I scripts/do-it.py <base> --top "<vai> <đường>"       các câu nặng nhất của một đường kèm EXPLAIN QUERY PLAN

<base>.json = câu đã ghi, <base>.sqlite = DB ×3. Đếm bằng sqlite3_stmt_status của sqlite3.dll đi kèm Python: FULLSCAN_STEP (dòng đi qua
khi quét CẢ bảng — Turso tính hết), AUTOINDEX (dòng chép vào chỉ mục tự dựng = thiếu chỉ mục), VM_STEP (bước máy ảo — tỉ lệ với dòng đọc qua chỉ mục).
Chỉ đọc, chỉ câu SELECT / WITH.
"""
import ctypes, json, os, re, sqlite3, sys
sys.stdout.reconfigure(encoding='utf-8')
base, args = sys.argv[1], sys.argv[2:]
L = ctypes.CDLL(os.path.join(os.path.dirname(sys.executable), 'DLLs', 'sqlite3.dll'))
P = ctypes.c_void_p
L.sqlite3_open_v2.argtypes = [ctypes.c_char_p, ctypes.POINTER(P), ctypes.c_int, ctypes.c_char_p]
L.sqlite3_prepare_v2.argtypes = [P, ctypes.c_char_p, ctypes.c_int, ctypes.POINTER(P), P]
L.sqlite3_step.argtypes = L.sqlite3_finalize.argtypes = [P]
L.sqlite3_bind_null.argtypes = [P, ctypes.c_int]
L.sqlite3_bind_int64.argtypes = [P, ctypes.c_int, ctypes.c_longlong]
L.sqlite3_bind_double.argtypes = [P, ctypes.c_int, ctypes.c_double]
L.sqlite3_bind_text.argtypes = [P, ctypes.c_int, ctypes.c_char_p, ctypes.c_int, P]
L.sqlite3_stmt_status.argtypes = [P, ctypes.c_int, ctypes.c_int]
dbp = P()
assert L.sqlite3_open_v2(f'{base}.sqlite'.encode(), ctypes.byref(dbp), 1, None) == 0   # 1 = chỉ đọc
py = sqlite3.connect(f'file:{base}.sqlite?mode=ro', uri=True)
co = {r[0]: py.execute(f'SELECT count(*) FROM "{r[0]}"').fetchone()[0] for r in py.execute("SELECT name FROM sqlite_master WHERE type = 'table'")}

def phang(a):
    r = []
    for x in a:
        if isinstance(x, list): r.extend(phang(x))
        else: r.append(None if isinstance(x, dict) else x)
    return r

nho = {}
def do(sql, a):
    """(dòng quét cả bảng, dòng chỉ mục tự dựng, bước máy ảo, dòng trả, các bảng > 100 dòng bị SCAN)."""
    k = (sql, json.dumps(a))
    if k in nho: return nho[k]
    st, b = P(), sql.encode()
    if L.sqlite3_prepare_v2(dbp, b, len(b), ctypes.byref(st), None): return (0, 0, 0, 0, [])
    for i, x in enumerate(a, 1):
        if x is None: L.sqlite3_bind_null(st, i)
        elif isinstance(x, (bool, int)): L.sqlite3_bind_int64(st, i, int(x))
        elif isinstance(x, float): L.sqlite3_bind_double(st, i, x)
        else: t = str(x).encode(); L.sqlite3_bind_text(st, i, t, len(t), P(-1))
    dong = 0
    while L.sqlite3_step(st) == 100: dong += 1
    s = [L.sqlite3_stmt_status(st, k, 0) for k in (1, 3, 4)]
    L.sqlite3_finalize(st)
    bi = dict((m[1], m[0]) for m in re.findall(r'(?:FROM|JOIN)\s+(\w+)\s+(?:AS\s+)?(\w+)', sql, re.I))
    scan = []
    for r in py.execute('EXPLAIN QUERY PLAN ' + sql, a):
        m = re.match(r'SCAN (\w+)( USING (?:COVERING )?INDEX (\w+))?$', r[3])
        t = m and bi.get(m.group(1), m.group(1))
        if t and co.get(t, 0) > 100: scan.append(t + (f'·{m.group(3)}' if m.group(3) else ''))
    nho[k] = (*s, dong, scan)
    return nho[k]

data = json.load(open(f'{base}.json', encoding='utf-8'))
def cau(khoa):
    for c in data[khoa]['cau']:
        if re.match(r'\s*(SELECT|WITH)\b', c['sql'], re.I): yield c['sql'], phang(c['args'])

if args[:1] == ['--top']:
    ds = sorted(((*do(s, a), s, a) for s, a in cau(args[1])), key=lambda x: -x[2])
    print(f"{args[1]}: {sum(x[2] for x in ds)} bước · {sum(x[0] for x in ds)} dòng quét cả bảng")
    for q, ai, vm, d, sc, s, a in ds[:int(os.environ.get('TOP', '8'))]:
        print(f"{vm:>8} bước {q:>5} quét {ai:>4} tự dựng {d:>5} dòng | {re.sub(r'\s+', ' ', s)[:200]}")
        print('         ' + ' | '.join(r[3] for r in py.execute('EXPLAIN QUERY PLAN ' + s, a))[:400])
    sys.exit()
loc = re.compile(args[0] if args else '.')
hang = []
for khoa, v in data.items():
    if not loc.search(khoa): continue
    t = [0, 0, 0]; scan = set()
    for s, a in cau(khoa):
        q, ai, vm, _, sc = do(s, a); t = [t[0] + vm, t[1] + q, t[2] + ai]; scan.update(sc)
    hang.append((t, v['n'], v['dong'], khoa, sorted(scan)))
print('bước VM | quét cả bảng | tự dựng | câu | dòng trả | (vai × đường) | SCAN')
for t, n, d, khoa, sc in sorted(hang, key=lambda h: -h[0][0]):
    print(f"{t[0]:>8} | {t[1]:>6} | {t[2]:>4} | {n:>3} | {d:>6} | {khoa} | {', '.join(sc)}")
