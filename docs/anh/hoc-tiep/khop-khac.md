# HOC-TIEP (N51, chủ SP 18/11) — Bước tiếp sau thi thật thêm hướng "Học tiếp"

Ảnh cặp TRƯỚC (main) | SAU, DB demo (em "Đinh Ngọc Quyên" — tên giả của bộ demo, lộ trình 23 có KQ thi thật 12/09, chưa chọn bước tiếp),
phông Be Vietnam Pro đã nạp (`document.fonts.check` = true ở mọi ảnh). 1440 tối · 375 sáng.

| Ảnh | Nội dung |
|---|---|
| `ho-so-1440.png` · `ho-so-375.png` | Panel Bước tiếp ở hồ sơ HV (Quản trị, `?buoc-tiep=23`): TRƯỚC · SAU mở panel · SAU chọn Học tiếp |
| `cong-viec-1440.png` · `cong-viec-375.png` | Panel Sau thi ở Công việc (TVV giữ việc, `?viec=buoc_tiep:23`): TRƯỚC · SAU chọn Học tiếp |
| `ho-so-1440-da-chon.png` | SAU lưu: "✓ Đã chọn Học tiếp" + Hoàn tác · mở lại: "Đã chọn: Học tiếp · ngày · người" + Đổi · Hoàn tác; đầu hồ sơ "Thi thật: Chưa có lịch", MT4 hiện lại |

Không cần mockup (plan.md 1.3b: thêm lựa chọn theo mẫu sẵn có của panel).

## Thành phần TRƯỚC → SAU

| Thành phần | TRƯỚC | SAU |
|---|---|---|
| Lựa chọn Bước tiếp (hồ sơ) | 2 nút lớn, 2 cột (≥ 640) | 3 nút lớn, MỘT cột (panel 480 px: 3 cột làm "Tạm dừng / Kết thúc học" gãy 3 dòng) — thứ tự Tạm dừng / Kết thúc học · Học tiếp · Lộ trình mới |
| Lựa chọn Bước tiếp (Công việc) | 2 nút radio | 3 nút radio, cùng thứ tự |
| Khối dưới khi chọn Học tiếp | — | Target (giữ + Sửa → ô, "Giữ Target") · Lớp (Giữ {lớp} / Lớp khác → ô chọn lớp FT) · "Khi lưu, web sẽ" · nút "Học tiếp" — mặc định không phải điền gì |
| Em không còn học lộ trình (đã nghỉ / tạm dừng / lộ trình đã đóng) | — | Chọn Học tiếp → một dòng lý do + bước kế "Chỉ khi em đang học lộ trình này — chọn Lộ trình mới." (không bày ô; máy chủ cũng 400) |
| Hoàn tác | như hai hướng kia | như hai hướng kia; Học tiếp có đổi lớp (đã chuyển) → ẩn Hoàn tác, Đổi vẫn được (như Lộ trình mới · Lớp khác) |
| "Sửa" KQ ở panel hồ sơ | có | ẩn khi đã chọn Học tiếp (KQ lần đó đã vào lịch sử; ô KQ của lộ trình là lần thi sau) |
| Hướng dẫn (QL, GV, TVV) + chữ việc | "Lộ trình mới hoặc Tạm dừng / Kết thúc học" | "Tạm dừng / Kết thúc học, Học tiếp hoặc Lộ trình mới" + một bước giải thích Học tiếp (QL) |

## Thao tác TRƯỚC → SAU

| Thao tác | TRƯỚC | SAU |
|---|---|---|
| Tạm dừng / Kết thúc học | có | giữ nguyên |
| Lộ trình mới (LT1 · LT2 · RF · Khác, lớp, hẹn) | có | giữ nguyên |
| Học tiếp | không có | MỚI: một bấm (mặc định); tuỳ chọn Target / lớp |
| Đổi giữa các hướng · Hoàn tác · Gia hạn · Lịch sử | có | giữ nguyên (đủ 3 hướng) |
| API cũ `chon: 'hoc_tiep' + lopMoiId` (OV-8a "học tiếp lộ trình mới") | mở lộ trình mới ở lớp khác | = Học tiếp N51 (cùng lộ trình, chuyển lớp). Web không gửi từ P7; bản chép thật 12/11: 0 lộ trình `hoc_tiep`. Dòng cũ (nếu có) hoàn tác như cũ |
| Mất thao tác | — | không |

## Audit
- web-design-guidelines (bộ luật vercel-labs mới nhất), phần mới: ô Target `aria-label` + `autoComplete="off"` + `inputMode="decimal"`; lỗi chặn `role="alert"` kèm bước kế; nút đều `<button>`, chạm ≥ 44 px ở 375; ngày qua hàm sẵn có (`ngay`) — không phát hiện mới.
- 375: một cột, không tràn ngang; chân panel giữ nút chính "Học tiếp".
