# LT-DONG-GV — Lịch Test tuần: dòng "GV …" dưới mã lớp (mockup `thiet-ke/v23/lich-test.html` #l1 · #l2)

Làm lại phần PR-4 (#1998) đã BỎ vì +1 câu Turso — chủ SP 23/11 bỏ lo dòng đọc, chỉ giữ tốc độ + compute.

## Bảng truy vết khung → thành phần → ảnh

| Khung mockup | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|
| L1: mã lớp đậm + `.gv` "GV Vũ Thu Lan" (12 px, `--text-faint`, block) ở MỌI hàng lớp, cả Quá hạn chấm và Test tuần này | `DongGv` (`HangLop.tsx`) — dùng ở `HangLop` và `KhoiNo`; `.lt-gv` (`index.css`) 12 px 400 `--text-faint`, một dòng | l1-1440-toi | KHỚP |
| L1: hai GV "GV Vũ Thu Lan · Hà Quốc Bảo" | `chuGvLop`: ≤ 2 tên nối " · "; > 2 → "GV A · B +n"; hai tên dài quá ~27 ký tự (không vừa cột 256 một dòng) → "GV A +n" để "…" không nuốt "+n"; đủ tên ở tooltip | l1-1440-toi | KHỚP (+n: mockup không vẽ, theo đề bài) |
| L1: tên lớp không cắt | `.lt-ma` giữ `nowrap`; dòng GV `width:0; min-width:100%` — không góp bề rộng tối thiểu, không đẩy cột / thẻ | l1-1440-toi | KHỚP |
| L2 (375): thẻ lớp | mockup 375 không vẽ dòng GV; web: dòng riêng của thẻ ngay dưới mã lớp (hết bề ngang thẻ, tiến độ vẫn bên phải dòng mã) | l2-375-sang | KHÁC — có lý do: đề bài yêu cầu 375 cũng có; đo 375: không tràn ngang (`scrollWidth` = `clientWidth`), mọi dòng GV đủ chữ |
| Lớp không có phân công đang hiệu lực | không vẽ dòng (không ghi "chưa phân công" — đã có ở "Còn chờ" khi mở lớp) | — | GIỮ |

## Nguồn dữ liệu (máy chủ)

- `GET /cham/lich-test` trả thêm `gvLop: { classId: [tên…] }` cho mọi lớp của khối 1 (Quá hạn chấm) + khối 3 (tuần đang xem), mọi vai.
- Cùng hàm `phanCongDangHieuLuc` với "Còn chờ" (một lô `json_each`, nhớ theo lớp trong request: lớp đã nạp không hỏi lại) — phân công `active`, đang hiệu lực
  hôm nay; tài khoản xoá → phân công kết thúc → không hiện. Mỗi môn người phân công đầu tiên; thứ tự L · R · W · S; trùng tên một lần.

## Tốc độ (đo `tocDo.run.js`, bộ demo — câu · dòng)

| Đường | Trước | Sau |
|---|---|---|
| QL `/cham/lich-test` | 20 · 499 | 21 · 503 |
| QT | 23 · 853 | 24 · 857 |
| GVCN | 18 · 343 | 19 · 350 |
| GVBM | 18 · 392 | 19 · 407 |
| CX | 22 · 848 | 23 · 852 |
| TVV | 19 · 494 | 20 · 498 |
| `?classId=3` (mọi vai) | 19 · 173 | 19 · 173 |
| `/cham/lich-test/qua-han` | không đổi | không đổi |

Mọi đường khác không đổi. Trần `tocDoDuong.ts` còn dư (QL 21 / 32) — giữ, ghi số đo vào chú thích.

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Bấm mã lớp → hồ sơ lớp | có | có (không đổi) |
| Bấm hàng → mở lưới chấm tại chỗ | có | có (không đổi) |
| Nhập điểm / Thu gọn / Xem ở Quá hạn chấm | có | có (không đổi) |
| "Còn chờ: GV (môn)" khi mở lớp | có | có (không đổi) |
| Xem GV đang dạy lớp ngay trên hàng | không | có (mới) |

Không mất thao tác nào.

## Phép kiểm

`server/src/tests/prLtDongGv.tests.ts`: LTGV-1 (QL · QT · GVCN · GVBM — mọi lớp trên trang có đúng GV, thứ tự môn, trùng tên một lần; có hàng không còn chờ GV khác vẫn có tên) ·
LTGV-2 (kết thúc phân công → tên không hiện). Chạy câu SQL thật (xoá nhớ request trước mỗi lần).
