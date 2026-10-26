"""R1-PHAN-CAP-TEST: ΔL (OKLCH, thang 0–100) giữa hai nền cấp liền nhau ≥ 3 + chữ WCAG ≥ 4,5 : 1 trên mỗi nền — giá trị chép từ web/src/index.css (đổi token thì sửa ở đây). Chạy: python3 thiet-ke/v7/kiem-tuong-phan-cap.py"""
import sys
def lin(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
def L_ok(h):
    r, g, b = lin(h)
    l = 0.4122214708*r + 0.5363325363*g + 0.0514459929*b
    m = 0.2119034982*r + 0.6806995451*g + 0.1073969566*b
    s = 0.0883024619*r + 0.2817188376*g + 0.6299787005*b
    l, m, s = l ** (1/3), m ** (1/3), s ** (1/3)
    return 100 * (0.2104542553*l + 0.7936177850*m - 0.0040720468*s)
def lum(h):
    r, g, b = lin(h); return 0.2126*r + 0.7152*g + 0.0722*b
def ti(a, b):
    x, y = sorted((lum(a), lum(b)), reverse=True); return (x + .05) / (y + .05)
CHE = {
  'tối': dict(the='#111c33', nhom='#283452', lop='#1d3b72', lop_dong='#172b50', dau_cot='#0a1224', chu='#e7edf7', chu_mo='#bac6de', do='#ff9a8f', nhan='#94bdf2'),
  'sáng': dict(the='#ffffff', nhom='#cfd6e4', lop='#d4e1fb', lop_dong='#edf2fd', dau_cot='#eceff5', chu='#141a2b', chu_mo='#4a536c', do='#b42318', nhan='#273c8f'),
}
KE = [('nhom', 'the'), ('nhom', 'lop_dong'), ('nhom', 'lop'), ('lop', 'lop_dong'), ('lop_dong', 'the'), ('lop', 'the'), ('dau_cot', 'the'), ('dau_cot', 'lop')]  # lop_dong ↔ dau_cot không liền nhau (thanh công cụ nền thẻ ở giữa)
CHU = [('chu', ['nhom', 'lop', 'lop_dong', 'dau_cot', 'the']), ('chu_mo', ['nhom', 'lop', 'lop_dong', 'dau_cot', 'the']), ('do', ['nhom']), ('nhan', ['lop_dong', 'lop'])]
truot = 0
for che, t in CHE.items():
    print(f'== {che}')
    for a, b in KE:
        d = abs(L_ok(t[a]) - L_ok(t[b])); ok = d >= 3; truot += not ok
        print(f'  ΔL {a:9} ↔ {b:9} {d:5.1f} {"✓" if ok else "✗"}')
    for c, ds in CHU:
        for n in ds:
            r = ti(t[c], t[n]); ok = r >= 4.5; truot += not ok
            print(f'  chữ {c:7} / {n:9} {r:5.2f}:1 {"✓" if ok else "✗"}')
print('trượt', truot); sys.exit(1 if truot else 0)
