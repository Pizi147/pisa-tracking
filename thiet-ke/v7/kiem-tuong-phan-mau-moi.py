"""D4 MAU-WEB — đo tương phản bảng màu TRƯỚC / SAU (bang-mau-moi.css), tối + sáng. Chạy: python3 thiet-ke/v7/kiem-tuong-phan-mau-moi.py
Chữ ≥ 4,5 : 1 · dấu / viền ô nhập ≥ 3 : 1 · nền liền nhau tách nhau ΔL ≥ 0,02 (OKLCH). Thoát 1 khi SAU có cặp trượt (TRƯỚC chỉ để so)."""
import re, sys, pathlib

css = pathlib.Path(__file__).with_name('bang-mau-moi.css').read_text(encoding='utf-8')

def khoi(chon):
    m = re.search(re.escape(chon) + r'\s*\{(.*?)\n\}', css, re.S)
    return dict(re.findall(r'--([\w-]+):\s*(#[0-9a-fA-F]{6})', m.group(1)))

def lin(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]

def lum(h):
    r, g, b = lin(h); return 0.2126 * r + 0.7152 * g + 0.0722 * b

def ti(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True); return (la + 0.05) / (lb + 0.05)

def oklch(h):
    r, g, b = lin(h)
    l = (0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b) ** (1 / 3)
    m = (0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b) ** (1 / 3)
    s = (0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b) ** (1 / 3)
    L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s
    A = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s
    B = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
    return L, (A * A + B * B) ** 0.5

NEN = ['bg', 'surface', 'surface-2']
CHU = (['text', 'chu-2', 'text-dim', 'text-faint', 'accent', 'hong-chu', 'ok', 'bad', 'soon', 'doing', 'muted',
        'kq-vuot', 'kq-bang', 'kq-duoi', 'sos1-chu', 'sos2-chu'])
CAP = [(c, NEN, 4.5) for c in CHU] + [
    ('text', ['hang-lon-bg', 'hang-con-bg', 'da-thi-bg', 'accent-soft', 'nut-hover', 'o-nhap-nen'], 4.5),
    ('text-faint', ['hang-lon-bg', 'hang-con-bg', 'da-thi-bg', 'accent-soft'], 4.5),
    ('hang-con-chu', ['hang-con-bg'], 4.5), ('accent', ['accent-soft'], 4.5),
    ('ok', ['ok-bg'], 4.5), ('bad', ['bad-bg'], 4.5), ('soon', ['soon-bg'], 4.5), ('doing', ['doing-bg'], 4.5), ('muted', ['muted-bg'], 4.5),
    ('sos2-chu', ['sos2-nen'], 4.5), ('sos3-tren', ['sos3-nen'], 4.5), ('lich-chu', ['lich-nen', 'surface'], 4.5),
    ('accent-ink', ['accent'], 4.5), ('dieu-huong-chu', ['dieu-huong-nen', 'dieu-huong-hover'], 4.5), ('hong-chu', ['hong-nen'], 4.5),
    ('o-nhap-vien', ['surface', 'o-nhap-nen'], 3.0), ('sos1', ['surface'], 3.0), ('sos2', ['surface'], 3.0), ('sos3-vien', ['surface'], 3.0),
    ('hong', ['dieu-huong-nen'], 3.0), ('sos3', ['surface', 'surface-2'], 3.0), ('sos1', ['surface-2'], 3.0), ('sos2', ['surface-2'], 3.0),
] + [(f'sos{k}-chu', ['hang-lon-bg', 'da-thi-bg'], 4.5) for k in (1, 2, 3)] + [('sos3-chu', NEN, 4.5), ('text-dim', ['da-thi-bg'], 4.5)]

loi = 0
for ten, chon in (('TỐI', '.truoc'), ('TỐI', '.sau'), ('SÁNG', '[data-theme="light"] .truoc'), ('SÁNG', '[data-theme="light"] .sau')):
    bo = khoi(chon); sau = chon.endswith('.sau')
    print(f'== {ten} {"SAU" if sau else "TRƯỚC"} ==')
    for chu, nens, nguong in CAP:
        for n in nens:
            r = ti(bo[chu], bo[n]); ok = r >= nguong
            if sau: loi += not ok
            print(f"{'ok ' if ok else 'TRƯỢT'} {chu:15} / {n:15} {r:5.2f}")
    # độ chói: chữ chính trên nền trang (tối: ≤ 13 cho đỡ chói) · nền tách lớp
    r = ti(bo['text'], bo['bg']); print(f"   chữ chính / nền trang {r:.2f}")
    if sau and ten == 'TỐI' and r > 13: loi += 1; print('TRƯỢT chữ chính tối quá chói (> 13 : 1)')
    can = 1.15 if ten == 'TỐI' else 1.09; r = ti(bo['bg'], bo['surface']); ok = r >= can   # prOv15a: thẻ tách nền trang
    if sau: loi += not ok
    print(f"{'ok ' if ok else 'TRƯỢT'} thẻ / nền trang {r:.2f} (≥ {can})")
    for a, b in (('bg', 'surface'), ('surface', 'surface-2'), ('surface', 'hang-con-bg')):
        d = abs(oklch(bo[a])[0] - oklch(bo[b])[0]); ok = d >= 0.02
        if sau: loi += not ok
        print(f"{'ok ' if ok else 'TRƯỢT'} ΔL {a}/{b} {d:.3f}")
    print('   chroma (độ bão hoà) ' + ' · '.join(f"{k} {oklch(bo[k])[1]:.3f}" for k in ('accent', 'ok', 'bad', 'soon', 'sos3-nen', 'hong')))
sys.exit(1 if loi else 0)
