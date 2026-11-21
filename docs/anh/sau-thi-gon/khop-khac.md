# SAU-THI-GON (gói 6 AUDIT-2111) — khớp / khác

Mockup: `thiet-ke/v5/tvv.html` `panelSau()` (khung đã duyệt). Ảnh: `truoc/` │ `sau/` (seed, TVV 23 Nguyễn Thu Hương · TVV 31 Trịnh Thu Thảo; 1440 tối, 375 sáng). Kịch bản: `chup.mjs`.

## Mã mục → sửa → kiểm

| Mã | Sửa | Ảnh |
|---|---|---|
| P1-07 (A3-01 = B3-10) | Học tiếp xong panel giữ ảnh chụp KQ lúc lưu (máy chủ đã chuyển KQ vào lịch sử) tới khi `/cycles/:id` có KQ lại; chân "✓ Đã lưu {giờ} · Học tiếp" + Hoàn tác; chip "Đã chọn: Học tiếp"; ẩn "Sửa điểm". Mở lại sau đó (Xem lại việc vừa lưu / hồ sơ) → khối trạng thái `PanelBuocTiep` (KQ một dòng + Đổi · Hoàn tác) | `*-5-sau-hoc-tiep`, `1440-toi-6-sau-hoan-tac` |
| A3-13 | Dòng Chọn bước tiếp: phụ "Đinh Ngọc Quyên · OVR 7.0 · Đạt Target" — bỏ "Đã xong · " (máy chủ `viecBuocTiep`) và nhãn "Đã có kết quả · Chưa chốt bước tiếp" trên dòng (đầu panel còn nói) | `*-1-danh-sach` |
| B3-11 | Gõ đủ 4 điểm + chọn Học tiếp → MỘT nút "Lưu điểm · Học tiếp" (PUT outcome → POST buoc-tiep; bước 2 lỗi giữ điểm đã lưu, bấm lại chỉ chốt). Lộ trình mới vẫn lưu điểm trước rồi panel mở Lộ trình mới ngay | `*-8-go-diem-hoc-tiep` |
| RA 15 | Một bản ghi KQ thi thật: `PanelSauThi` dùng ở Công việc, Lịch thi, hồ sơ HV (Việc cần làm · `?viec=thi-that`), ngăn Tổng kết; xoá `KetQuaThiThatPanel.tsx` | `*-7-ho-so-kq` |
| Chủ SP 21/11 "target không cần nút giữ sửa" | Target của Học tiếp và Lộ trình mới là MỘT ô điểm điền sẵn (Target cũ; Lộ trình mới khi đã đạt: gợi ý +1.0) — sửa thẳng; bỏ "giữ · Sửa · Giữ Target"; để nguyên = giữ (không gửi). "Bỏ Target" (lộ trình Khác) giữ | `*-9-hoc-tiep-target`, `*-10-lo-trinh-moi-target` |

## Thao tác TRƯỚC → SAU (bản hồ sơ `KetQuaThiThatPanel` → `PanelSauThi`)

| Thao tác cũ | Sau PR |
|---|---|
| Ngày thi (ô + lịch, không sau hôm nay) | GIỮ — ô Ngày thi ở bước 1 khi nhập / sửa điểm (cả Công việc) |
| L R W S, OVR tự tính | GIỮ |
| Lưu thiếu kỹ năng (em báo dần) | GIỮ — lưu được; trống cả bốn mới báo "Nhập điểm"; Bước tiếp mở khi đủ 4 |
| Toast Hoàn tác sau lưu (khôi phục bản trước) | GIỮ |
| Lịch sử + Khôi phục bản trước | GIỮ (`khoiPhuc` truyền vào Lịch sử) |
| Lấy điểm lần thi trước (THI-LAI-1-KN) | GIỮ |
| "Tuần dạy" khi đã lưu đủ 4 | GIỮ — cạnh nhãn Đạt Target |
| KET / PET (thang Cambridge, Grade · CEFR, không Bước tiếp) | GIỮ — ô số nguyên trong thang, không bước 2 |
| Gia hạn | GIỮ cho hạn Bước tiếp (link "Gia hạn" ở đầu bước 2, như PanelBuocTiep). Gia hạn lúc "chờ KQ" bỏ: việc Cập nhật KQ không hạn, máy chủ trả 400 (RA-LUONG-4) |
| Lưu xong đổi sang Bước tiếp (PanelBuocTiep) | GỘP — bước 2 ngay trong cùng panel; đã chọn từ trước → khối trạng thái PanelBuocTiep (Đổi · Huỷ hẹn · Hoàn tác · Quay lại học · Sửa KQ) |
| Ô "Không thi" + Ghi chú riêng của KQ | ĐỔI — nút "Không thi" lưu ngay (mockup V5, một bấm); ghi chú cũ vẫn hiện cạnh "Không thi". Ghi chú trao đổi viết ở ô Ghi chú của Bước tiếp. **Mất: sửa ghi chú KQ khi Không thi** — lý do: một panel một ô ghi chú (mockup), ghi chú trao đổi đã có ở bước 2 |
| Chân "Đóng · Lưu" | ĐỔI — chân Sau thi ("Lưu điểm" / "Lưu điểm · {bước}" / Hoàn tác); đóng bằng ✕ (hỏi nếu đang gõ) |

## Khác mockup (có lý do)
- Ô Ngày thi ở bước 1: mockup không vẽ; giữ thao tác cũ của bản hồ sơ.
- Link "Gia hạn" đầu bước 2, "Tuần dạy": thao tác cũ, mockup không vẽ.
- Chân sau chốt nói hướng đã chọn ("Đã lưu 15:52 · Học tiếp") thay "Việc xong" — đúng đề xuất P1-07.

## Turso
- Công việc: không đổi (`/cycles/:id` + `/cycles/:id/buoc-tiep`).
- Hồ sơ › KQ thi thật: trước `/cycles/:id` + `/cycles/:id/han-sau-thi`; sau `/cycles/:id` + `/cycles/:id/buoc-tiep` — vẫn 2 câu mở panel. Không thêm câu ở `/my-work`.
