# NHẸ HƠN · PR-6 Y-THUC — khớp / khác mockup v23

Mockup: `thang-y-thuc.html` Y1 – Y4 + ghi chú (XM-9, XM-10, góp ý chủ SP 22/11 vòng 1 – 2). Kế hoạch: `docs/superpowers/plans/2026-11-22-nhe-hon.md` mục PR-6; PTA chốt: thêm MỘT câu lô `meeting_phan`, hộp thang Y2 gập các lần xử lý khi > 3.
Ảnh cặp mockup | web (seed, ngày demo 14/09/2026, Playwright Edge, phông Be Vietnam Pro đã nạp): `docs/anh/nh-pr6/`. Em 58 có Meeting CX đã xác nhận + BPXL đã xếp lịch (bấm trên bản demo trước khi chụp).

## Bảng truy vết khung → thành phần → ảnh
| Khung mockup (v23) | Thành phần web | Ảnh | |
|---|---|---|---|
| Thanh bước 7 ô bằng nhau, chấm + tên ngắn R1 · R2 · WL1 · R4+M · R5 · WL2 · R7, không xuống dòng (cả 375) | `ThanhBuoc` (mới, `ThangYThuc.tsx`) · `oThang` + `tenNganBac` (`shared/domain/yThuc.ts`, phép kiểm `prYt4`) | y1-thang, y3-thang | KHỚP |
| Đang ở = bậc đã xử lý gần nhất, chấm nhấn to; đã qua ✓ chấm đặc xám; kế tiếp viền đứt "kế tiếp"; khai viền đứt + ✓ mờ (XM-9) | `oThang` (`dang` / `qua` / `ke` / `khai`) · lớp `CHAM` / `TEN` | y1-thang, y3-thang | KHỚP |
| Ngày dưới bậc đã qua (dd/mm/yyyy) — 375 ẩn, "kế tiếp" giữ | lần xử lý xong cùng loại trong `dongThoiGian` (đã nạp, +0 câu) · `@container < 420 px` ẩn ngày | y1-thang, y3-thang | KHỚP |
| Tên đầy đủ: rê (title) + ⓘ đầu khối | `title` từng ô + chữ cho trình đọc màn hình · ⓘ "Tên đầy đủ các bậc" (bảng R1 … R7 + luật nút) | y1-thang | KHỚP |
| Sau WL 2: ô đầu "…", vẫn 7 ô (Y4) | `oThang`: "…" + 5 bậc cuối + một bậc sau | phép kiểm | KHỚP |
| Đề xuất chờ: ô kế tiếp ghi "chờ Head" (Y4) · đề xuất ngoài thang (WL 3) | chữ dưới ô kế · đề xuất ngoài thang: một dòng dưới thang "Đề xuất WARNING LETTER 3 · chờ Head" | — | KHỚP (ngoài thang: dòng chữ thay chip cuối, vì 7 ô cố định) |
| Khối `.kt`: đầu "Thang xử lý vi phạm · FT" + "Xác nhận cấp bậc vi phạm" + ⓘ · chân "n vi phạm chưa xử lý" + hai nút cùng cỡ | `ThangYThuc` khối mới · hồ sơ HV: khối luôn hiện (thay dải "Đã tới" + thang vạch + "Thang ▾") | y1-thang | KHỚP |
| Hai cột: thang | "Vi phạm chưa xử lý" (Y1) | hồ sơ giữ MỘT bảng "Đang chờ" + "Lịch sử" (mockup v20 A4 đã duyệt — nơi có Xác nhận xử lý / Đã xem / Báo PH tại dòng) | y1-thang | KHÁC — giữ thao tác; thang thu về ≤ 640 px để ô không giãn |
| Vi phạm bấm mở mô tả dưới dòng: Nhóm · Người ghi (đậm tên + ngày) · Mô tả · Tệp (góp ý 1) | `DsVp` (`BangLan.tsx`, dùng chung hồ sơ HV + tab Ý thức lớp): khối mở nền nhấn nhạt — Nhóm · Người ghi rồi `ChiTietViPham` (Mô tả + Dịch · Tệp · Lần xử lý · Sửa / Xoá / Trả lại) | y1-vi-pham | KHỚP |
| Cột ngày vi phạm dd/mm/yyyy | 44 → 80 px | y1-vi-pham | KHỚP |
| Phối hợp SOS: dải lượt `.luot-dau` (SOS · MT2 · Overall / kỳ vọng · Học thuật ›) | `KhoiLuot`: dải nền `surface-2` trên các việc (thay ô gộp trái 22 %) · giữ x/y việc xong, + Thêm việc, Xem việc ▸ | y1-phoi-hop, y3-phoi-hop | KHỚP |
| Dòng việc `.ph-dong`: tên + dòng phụ · thanh chấm · hạn · một nút | `DongViecHoSo` (mới) — lưới 4 cột; < 760 px ba hàng (tên + hạn / chấm / nút) | y1-phoi-hop, y3-phoi-hop | KHỚP |
| Meeting N58: "GVCN xác nhận" nối, rồi Xếp lịch (BPXL) · Kết quả (CX) · Báo PH (TVV) độc lập, vạch dọc đứt, chữ dưới = người thật (không BPXL → TVV, không CX → Head) | `tienDoViec` + `ThanhBuoc doc` · máy chủ `phanMeetingCuaHanhDong` (vai mặc định như `giaoViec.ts` `vaiTai`) | y1-phoi-hop | KHỚP |
| Dòng phụ Meeting 2 dòng, tên người / giờ họp đậm (góp ý 4) · 375 một dòng gọn | `phu` / `phuNgan` | y1-phoi-hop, y3-phoi-hop | KHỚP |
| Việc chỉ GVCN: một chấm | `tienDoViec` một ô | y1-phoi-hop | KHỚP |
| Hạn: dd/mm/yyyy tô màu, không "quá hạn n ngày" ở hồ sơ | `HanEm soNgay={false}` (luật hạn PR-1: `mucHan` + ⚠); Meeting đã xác nhận: hạn phần Báo PH ở cột hạn | y1-phoi-hop | KHỚP |
| Hộp thang (Y2): thanh bước + các lần xử lý, gập khi > 3 | hộp chip bậc tab Ý thức lớp (`ClassYThucCard` `ThangEm`): `ThangYThuc lanXuLy khung={false}` — bỏ dòng "Thang · tên" + thang vạch trùng | — | KHỚP |
| Nút "Xem" ở dòng Meeting (Y1) | — | — | KHÁC — web chưa có panel Meeting mở từ hồ sơ; ba phần làm ở Công việc (PanelMeeting). [XM] cho PTA |

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau | |
|---|---|---|---|
| Khai / sửa cấp bậc (hồ sơ HV) | nút "Khai / sửa cấp bậc" ở dải mốc | link "Xác nhận cấp bậc vi phạm" / "Sửa cấp bậc" ở đầu khối thang (Y1) — cùng panel | GIỮ (đổi chỗ, tên theo khung) |
| Hỏi tình hình · Báo tình hình · + Vi phạm / Nhắc nhở | dải mốc | chân khối thang | GIỮ |
| Thang ▾ (mở thang đủ tên) | nút | thang luôn hiện; tên đủ ở rê / ⓘ | BỎ nút — thông tin luôn hiện |
| Xác nhận xử lý · Đề xuất Head duyệt (hộp thang lớp, panel) | có | có, cùng cỡ, chân khối | GIỮ |
| Lịch sử của em › · Khai / sửa cấp bậc (hộp thang lớp) | có | có | GIỮ |
| Bấm vi phạm → mở tại chỗ (Sửa / Xoá / Trả lại / Dịch / + Tệp) | có | có + Nhóm · Người ghi | GIỮ |
| Rê tên vi phạm → hộp thông tin | có | có | GIỮ |
| Phối hợp: Xác nhận · Sửa · ⋯ (Bỏ việc / Đưa lại / Khôi phục / Sửa hạn) · Hoàn tác 10 s | ô "Đã làm" + ⋯ | cột nút + ⋯ | GIỮ |
| Phối hợp: TVV Ghi kết quả / Sửa · Xem đủ ghi chú · Nội dung gửi TVV | ô "Kết quả" | dưới dòng phụ | GIỮ |
| + Thêm việc · Học thuật › · Xem việc ▸ (lượt đã xong) | ô gộp trái | dải lượt | GIỮ |
| Đầu cột "Lượt · Việc · Đã làm · Kết quả" | có | bỏ (khung không có; mỗi dòng tự nói) | BỎ — không phải thao tác |

## Turso
- `/students/:id/phoi-hop-sos`, `/classes/:id/phoi-hop-sos`: **+1 câu chỉ khi có Meeting CX đã xác nhận** (lô `meeting_phan WHERE phoi_hop_id IN (json_each)`, câu con vai trong cùng câu); 2 dòng / Meeting + vài dòng `user_roles`. Seed không có Meeting đã xác nhận → số đo trần hiện tại không đổi (trần `tocDoDuong.ts` còn dư ≥ 2 câu).
- Thang, vi phạm, hộp Y2: +0 câu (dữ liệu đã nạp).

## [XM] / để sau
- Nút "Xem" dòng Meeting ở hồ sơ (mở panel Meeting ba phần tại chỗ) — chưa làm, cần PTA chốt (panel thuộc PR-2b).
- Hai cột Y1 (thang | vi phạm chưa xử lý) — hồ sơ giữ bảng Đang chờ (thao tác tại dòng); nếu chủ SP muốn đúng hai cột thì là PR riêng.
- Mô tả vi phạm "tách câu, số đậm" nằm trong `ChiTietViPham.tsx` (ngoài phạm vi, không PR nào giữ) — chưa đổi.
- Sửa ngoài 4 tệp (cần cho việc đã giao): `server/src/yThuc/phoiHop.ts` (câu lô, PTA duyệt) · `PhoiHopSosSection.tsx` (kiểu `meeting`) · `ClassYThucCard.tsx` (`ThangEm` — hộp Y2) · `shared/domain/yThuc.ts` (`oThang`) · từ điển EN.
