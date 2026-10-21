"""Đo tương phản WCAG các cặp token trong v5-nen.css (sáng + tối). Chạy: python3 thiet-ke/v5/kiem-tuong-phan.py
Chữ cần ≥ 4,5 : 1; dấu / viền không chữ cần ≥ 3 : 1. Thoát mã 1 nếu có cặp trượt."""
import re, sys, pathlib

css = pathlib.Path(__file__).with_name('v5-nen.css').read_text(encoding='utf-8')

def khoi(chon):
    m = re.search(re.escape(chon) + r'\s*\{(.*?)\n\}', css, re.S)
    return dict(re.findall(r'--([\w-]+):\s*(#[0-9a-fA-F]{6})', m.group(1)))

sang = khoi(':root')
toi = {**sang, **khoi(':root[data-theme="dark"]')}

def lum(h):
    c = [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    c = [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]

def ti(a, b):
    la, lb = sorted((lum(a), lum(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)

NEN = ['be-mat', 'be-mat-2', 'nen']
# (chữ, [nền], ngưỡng)
CAP = [(c, NEN, 4.5) for c in ['chu', 'chu-2', 'chu-3', 'nhan', 'hong-chu', 'loi', 'canh-bao', 'dat', 'thieu', 'dang',
                                'kq-vuot', 'kq-bang', 'kq-duoi', 'sos1-chu', 'sos2-chu', 'sos3-chu']] + [
    ('dieu-huong-chu', ['dieu-huong-nen', 'dieu-huong-hover'], 4.5),
    ('dieu-huong-chu-mo', ['dieu-huong-nen'], 4.5),
    ('loi', ['loi-nen'], 4.5), ('canh-bao', ['canh-bao-nen'], 4.5), ('dat', ['dat-nen'], 4.5),
    ('dang', ['dang-nen'], 4.5), ('thieu', ['thieu-nen'], 4.5), ('lich-chu', ['lich-nen', 'be-mat', 'da-thi-nen'], 4.5),
    ('nhan', ['nhan-nen', 'dang-mo', 'hover'], 4.5), ('chu', ['dang-mo', 'da-thi-nen', 'hover'], 4.5),
    ('chu-3', ['dang-mo', 'da-thi-nen', 'hover'], 4.5),
    # dấu không chữ
    ('hong', ['be-mat', 'dieu-huong-nen'], 3.0), ('vien-o', ['be-mat'], 3.0), ('focus', ['be-mat', 'be-mat-2'], 3.0),
    ('sos1', ['be-mat'], 3.0), ('sos2', ['be-mat'], 3.0), ('sos3', ['be-mat'], 3.0),
    # V5-D P6: chữ trên nền SOS đặc + nền SOS tách khỏi mặt
    ('sos1-chu', ['sos1-nen'], 4.5), ('sos2-tren', ['sos2-nen'], 4.5), ('sos3-tren', ['sos3-nen'], 4.5),
    ('sos3-nen', ['be-mat'], 3.0),  # SOS 2 tách khỏi mặt nhờ viền --sos2 (đã đo ở trên)
]

loi = 0
for ten, bo in (('SÁNG', sang), ('TỐI', toi)):
    print(f'== {ten} ==')
    for chu, nens, nguong in CAP:
        for n in nens:
            r = ti(bo[chu], bo[n])
            ok = r >= nguong
            loi += not ok
            print(f"{'ok ' if ok else 'TRƯỢT'} {chu:18} trên {n:16} {r:5.2f} (≥ {nguong})")
# chữ trên nút chính
for ten, bo, chu in (('SÁNG', sang, '#ffffff'), ('TỐI', toi, '#060c18')):
    r = ti(chu, bo['nhan']); loi += r < 4.5
    print(f"{ten} chữ nút chính trên --nhan {r:.2f}")
sys.exit(1 if loi else 0)
