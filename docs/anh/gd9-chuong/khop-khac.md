# GD-9 — Chuông (mockup v21 ⑤ khu G) · khớp / khác

Plan: `09-plan-giao-dien-dot-2.md` dòng GD-9 · mockup `thiet-ke/v21/bang-mau.html` khu G + `bang-mau-ghi-chu.md` G1–G4, [XM-1] (PTA Overhaul 14/11).
Seed 14/09, GVCN tài khoản 7 (tên bịa của bộ demo). Phông Be Vietnam Pro đã nạp.

## Ảnh

| Ảnh | Khung | Nội dung |
|---|---|---|
| `cap-g1-1440-toi.png` | G1 | hộp chuông dáng v2 — mockup │ web |
| `cap-g2-1440-toi.png` | G2 | bấm "Xử lý vi phạm" → Công việc tab Ý thức & Phối hợp (cả tab) |
| `cap-g4-375-sang.png` | G4 | 375 sáng — hộp neo hai mép, cao ≤ 70 vh |

## 1. Truy vết

| # | Khung | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|---|
| 1 | G1 hộp chuông GIỮ dáng v2 (11/11): đầu khối "n quá hạn · n hôm nay · n việc" + "Công việc ›" · một dòng mỗi LOẠI việc (tên + "● n mới" · "n việc" · chip quá hạn / hôm nay · ›) · Cập nhật nhẹ ở dưới | `HopChuong` (không đổi dáng) | g1, g4 | KHỚP |
| 2 | G2: bấm một loại → trang Công việc ĐÚNG TAB của loại đó (cả tab, không lọc riêng loại); Nhập điểm → Chấm điểm · Chọn PA, Kết quả PA → Case học thuật · Xử lý vi phạm, Phối hợp SOS → Ý thức & Phối hợp · Viết Báo cáo PH, Bàn giao → Vận hành | đích `/cong-viec?nhom={tab}` qua `nhomViecCua` (TVV: `nhomViecTvvCua`) — cùng hàm tab của trang Công việc; "Báo PH kết quả Test" (`phoi_hop`) → Ý thức & Phối hợp (lời chủ SP 14/11) | g2 | KHỚP |
| 3 | Không có dòng Chấm Speaking (việc chung, không đếm) | `gomViecChuong` bỏ `laViecChamCheo` (đã có) — phép kiểm mới | g1 | KHỚP |
| 4 | Tên bậc viết hoa | `bacNgan` (GD-4d, đã có) ở tin Cập nhật | g1 | KHỚP |
| 5 | V22: quá hạn / hôm nay chỉ màu | `.chv-qua` / `.chv-nay` không ⚠ (đã có) | g1, g4 | KHỚP (mockup vẽ ⚠ → KHÁC theo V22) |

**KHỚP 5 / 5 = 100 %.**

Bấm thử (GV 7): Xử lý vi phạm → `?nhom=y-thuc` · Viết Báo cáo PH → `?nhom=van-hanh` · Bàn giao → `?nhom=van-hanh` · Nhập điểm → `?nhom=cham-diem` · Kết quả PA → `?nhom=case-hoc-thuat`.

## 2. [XM] — hỏi PTA Plan
- **[XM-9a] Tổng số việc chuông ≠ Công việc 1 đơn vị** (seed GV 7: chuông "33 việc", Công việc "34 việc"; số quá hạn cùng 9, badge cùng 9). Có từ trước PR này (GD-9 không đổi cách đếm). Chuông đếm việc CỦA TÔI (`gomViecChuong` lọc `mine`), đầu Công việc đếm mọi dòng của trang — cần PTA chốt một nguồn hay để PR riêng.

## 3. Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Bấm một dòng loại việc | Công việc `?loai=` — tab của loại, CHỈ loại đó | Công việc `?nhom=` — CẢ tab của loại (mockup G2) |
| Bấm "Công việc ›" · "Chờ bạn duyệt" · việc từ tin · Cập nhật · Xem tất cả · Đánh dấu đã đọc | có | giữ |

Không thao tác nào bị mất (lọc riêng một loại vẫn có ở link `?loai=` của Tổng quan).

## 4. Lời 40 · Đo ✕ / ⋯
Không đổi phần hiện theo trạng thái (đã có: không việc → "Không còn việc nào", Cập nhật rỗng ẩn). Hộp chuông không có ✕ / ⋯ (đóng bằng bấm ngoài / Esc) — không có gì phải đo.

## 5. Hướng dẫn "?"
`gv.ts` (Xem chuông thông báo), `ql.ts` (Xem việc cần làm ở chuông): "bấm dòng mở Công việc đúng tab của loại đó"; khoá dịch `shared/i18n/en/gd9Chuong.ts`.

## 6. Turso — 0
Không request mới: chuông vẫn dùng `/my-work` App đã tải; Công việc mở tab như link cũ.
