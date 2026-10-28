"""MAU-MUC — đo 3 mức SOS TRƯỚC / SAU, tối + sáng. Chạy: python thiet-ke/v7/kiem-mau-muc.py
Chữ chip / nền chip ≥ 4,5 · viền chip / nền thẻ ≥ 3 · giữa các mức: ΔL (OKLab, độ sáng NỀN chip) ≥ 0,10 và ΔE OKLab ≥ 0,10
(kể cả khi giả lập mù màu đỏ – lục deutan / protan). Thoát 1 khi SAU có cặp trượt (TRƯỚC chỉ để so)."""
import sys
sys.stdout.reconfigure(encoding="utf-8")

def lin(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]

def ti(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True); return (la + 0.05) / (lb + 0.05)

def lum(h):
    r, g, b = lin(h); return 0.2126 * r + 0.7152 * g + 0.0722 * b

def oklab(rgb):
    r, g, b = rgb
    l = (0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b) ** (1 / 3)
    m = (0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b) ** (1 / 3)
    s = (0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b) ** (1 / 3)
    return (0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
            1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
            0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s)

# Machado 2009, mức nặng 1.0 (tuyến tính sRGB)
MU = {'thường': None,
      'deutan': ((0.367322, 0.860646, -0.227968), (0.280085, 0.672501, 0.047413), (-0.011820, 0.042940, 0.968881)),
      'protan': ((0.152286, 1.052583, -0.204868), (0.114503, 0.786281, 0.099216), (-0.003882, -0.048116, 1.051998))}

def nhin(h, kieu):
    c = lin(h); m = MU[kieu]
    if m: c = [max(0.0, min(1.0, sum(m[i][j] * c[j] for j in range(3)))) for i in range(3)]
    return oklab(c)

def de(a, b, kieu):
    x, y = nhin(a, kieu), nhin(b, kieu); return sum((p - q) ** 2 for p, q in zip(x, y)) ** 0.5

# Mỗi mức: (nền chip, viền, chữ). Nền thẻ = 'surface'.
BO = {
    ('TỐI', 'TRƯỚC'): dict(surface='#111c33', m1=('#111c33', '#ccb96d', '#d9c981'), m2=('#35261a', '#cf815b', '#df9f7c'), m3=('#873c34', '#b7544c', '#ffffff')),
    ('TỐI', 'SAU'):   dict(surface='#111c33', m1=('#111c33', '#ccb96d', '#d9c981'), m2=('#5a320f', '#9a6633', '#f3c79c'), m3=('#a33d2d', '#c45a47', '#ffffff')),
    ('SÁNG', 'TRƯỚC'): dict(surface='#ffffff', m1=('#ffffff', '#9b7e47', '#715c32'), m2=('#f8ece1', '#c1764e', '#905538'), m3=('#862e27', '#862e27', '#ffffff')),
    ('SÁNG', 'SAU'):   dict(surface='#ffffff', m1=('#ffffff', '#9b7e47', '#715c32'), m2=('#f6d8b8', '#b9773f', '#7c4316'), m3=('#862e27', '#862e27', '#ffffff')),
}

loi = 0
for (gd, khi), b in BO.items():
    sau = khi == 'SAU'; print(f'== {gd} {khi} ==')
    def kt(ok, s):
        global loi
        if sau and not ok: loi += 1
        print(f"{'ok ' if ok else 'TRƯỢT'} {s}")
    for k in ('m1', 'm2', 'm3'):
        nen, vien, chu = b[k]
        kt(ti(chu, nen) >= 4.5, f'SOS {k[1]} chữ / nền chip {ti(chu, nen):5.2f}')
        # mức có nền đặc khác nền thẻ thì nền là "viền"; mức rỗng thì viền phải ≥ 3
        biên = max(ti(vien, b['surface']), ti(nen, b['surface']))
        kt(biên >= 3.0, f'SOS {k[1]} mép chip / nền thẻ {biên:5.2f}')
    for a, c in (('m1', 'm2'), ('m2', 'm3'), ('m1', 'm3')):
        dl = abs(oklab(lin(b[a][0]))[0] - oklab(lin(b[c][0]))[0])
        kt(dl >= 0.10, f'SOS {a[1]}↔{c[1]} ΔL nền {dl:.3f}')
        for kieu in MU:
            # so cả nền lẫn chữ: mắt đọc chip là khối nền + màu chữ
            d = min(de(b[a][0], b[c][0], kieu) + de(b[a][2], b[c][2], kieu), 9)
            kt(d >= 0.10, f'SOS {a[1]}↔{c[1]} ΔE nền+chữ ({kieu}) {d:.3f}')
sys.exit(1 if loi else 0)
