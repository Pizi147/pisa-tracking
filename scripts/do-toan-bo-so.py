"""So JSON từng khoá hai lượt đo (PISA_IN_JSON=1) + bảng câu / dòng trước → sau các khoá đổi. python -I so.py <truoc.json> <sau.json>"""
import json, sys
sys.stdout.reconfigure(encoding='utf-8')
a = json.load(open(sys.argv[1], encoding='utf8')); b = json.load(open(sys.argv[2], encoding='utf8'))
lech = [k for k in a if k in b and (a[k]['status'] != b[k]['status'] or a[k].get('body') != b[k].get('body'))]
thieu = [k for k in a if k not in b]
print(f'{len(a)} khoá · JSON lệch {len(lech)} · thiếu {len(thieu)}')
for k in lech[:20]:
    x, y = a[k].get('body', ''), b[k].get('body', '')
    i = next((i for i in range(min(len(x), len(y))) if x[i] != y[i]), min(len(x), len(y)))
    print('  LỆCH', k, a[k]['status'], b[k]['status'], '…', x[max(0, i - 80):i + 80], '|||', y[max(0, i - 80):i + 80])
doi = [(k, a[k]['n'], b[k]['n'], a[k]['dong'], b[k]['dong']) for k in a if k in b and (a[k]['n'] != b[k]['n'] or a[k]['dong'] != b[k]['dong'])]
print(f'{len(doi)} khoá đổi câu / dòng:')
for k, n1, n2, d1, d2 in sorted(doi, key=lambda r: r[4] - r[3]): print(f'  {n1:>4} → {n2:<4} câu {d1:>6} → {d2:<6} dòng  {k}')
