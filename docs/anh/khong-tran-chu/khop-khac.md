# KHONG-TRAN-CHU · chữ không tràn khỏi chip

Nguồn: lời chủ SP 15/11 "để ý là web không bị clipped như này đâu nhé" — ảnh: hồ sơ lớp › tab Ý thức › cột Học viên, chip mốc "Đã tới Report 4 + Meeting CX/GĐCN ▾" tràn khung, đè dòng TVV, chữ bị bẻ dọc.
Không đổi luật, dữ liệu, request (Turso 0).

## 1. Nguyên nhân · sửa

| # | Màn | Thành phần | Trước | Sau |
|---|---|---|---|---|
| 1 | Hồ sơ lớp › Ý thức (cột Học viên 248 px) · hồ sơ HV › Ý thức | `ChipBac` (`yThuc/BangLan.tsx`) — chip mốc vi phạm mở thang | cao CỐ ĐỊNH `h-6` (375: `h-11`), chữ dài xuống 2 dòng nhưng khung không giãn → chữ tràn trên / dưới, đè dòng sau | `min-h-6` (375: `min-h-11`), `py-[3px]`, căn trái, `max-w-full`; chữ trong `span min-w-0`, ▾ `shrink-0` giữ cuối. Không cắt "…", không bẻ chữ |
| 2 | Hồ sơ lớp › Cần hỗ trợ | chip mức "⚠ {mô tả mức}" (`BangCanHoTro`) | `h-5 shrink-0` — mô tả dài cùng lỗi | `min-h-5 max-w-full py-px leading-tight`, căn trái |

## 2. Quét (bước 2)

Công cụ mới `scripts/kiem-tran-chu.mjs` (Playwright, dev server): đo KHUNG CHỮ THẬT (Range trên nút chữ, bỏ chữ sr-only / `max-sm:sr-only`, bỏ vùng bấm ẩn `::after`) của mọi chip / nút / nhãn có viền hoặc nền, cao ≤ 48 px; chữ vượt khung > 2 px = lỗi. `KEO_DAI=1` ép chữ mốc dài nhất vào mọi chip ▾ mở hộp.
Màn quét (1440 tối + 375 sáng): HV & Lớp (QL, GVCN) · hồ sơ lớp 3, 6 (Học viên, Ý thức) · hồ sơ HV 65, 4 (Học thuật, Ý thức) · Công việc (Chấm điểm, Case, Ý thức) · Tổng quan QL · Test (GV, QL).
- Dữ liệu demo: **0 chỗ tràn** (trước và sau — demo không có em tới mốc REPORT 4 + MEETING).
- `KEO_DAI=1` trên hồ sơ lớp / HV › Ý thức: **trước 4 chỗ** (ChipBac 1440) → **sau 0**.
- Quét tĩnh chip `inline-flex` cao cố định không `whitespace-nowrap` / `truncate`: ngoài 2 chỗ trên, còn lại là chip chữ ngắn cố định (số SOS, "Lần n"…) hoặc tên người trong hàng `flex-wrap` (`TinhHinh`, `HopDotBaoCaoPh`, `NganXepLichMt`, `XepTheoHocVien`) — tên ≤ 1 dòng ở mọi cỡ đã quét, giữ.

## 3. Phép kiểm

`thanhPhanChung.tests.ts` › KHONG-TRAN-CHU: ChipBac không `h-6` / `max-sm:h-11`, có `min-h-6 max-w-full`, ▾ `shrink-0`; chip mức Cần hỗ trợ `min-h-5`; công cụ quét DOM có đo khung chữ + `KEO_DAI`. Quét DOM cần dev server nên chạy tay: `KHUNG_BASE=http://localhost:5173 node scripts/kiem-tran-chu.mjs` (thoát 1 khi có chỗ tràn).

## 4. Thao tác trước → sau

Không đổi: chip vẫn bấm mở thang tại chỗ, vùng bấm 375 vẫn ≥ 44 px.

## 5. Ảnh trước │ sau (`chip-moc-{1440,375}-{truoc,sau}[-zoom].png`)

GVCN demo (7), hồ sơ lớp MB FT 101 › Ý thức, chữ chip ép = "REPORT 4 + MEETING CX/GĐCN" (mốc dài nhất thật, demo không có em tới mốc này). Phông Be Vietnam Pro đã nạp.
- 1440 tối: trước chữ hai dòng tràn khung 24 px → sau khung giãn hai dòng, căn trái, ▾ cuối.
- 375 sáng: chip đủ rộng một dòng (trước / sau như nhau, sau căn trái).
