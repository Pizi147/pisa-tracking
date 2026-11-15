# HD3-5 — Nội dung Hướng dẫn V3 · Admin văn phòng (+ mục "Luật và hạn" các vai)

Nguồn: `15-huong-dan-v3.md` mục 4 + 6 + 8. Mã main 15/11 (GD-11a/b/c, GD-14, GD-19, GD-20; lời 49). **Xếp chồng sau #1758 (HD3-3) → #1756 (HD3-2).**
Bảng sự thật (tệp:dòng): ghi chú nhóm session `hd3-5-su-that-admin.md`. Viết tắt: `mw` = `server/src/worklist/mywork.ts` · `xbc` = `server/src/classes/xuatBaoCaoPh.ts` · `HT` = `web/src/modules/congViec/HoTroHocVienTab.tsx` · `TBC` = `web/src/modules/classes/TabBaoCaoPh.tsx` · `MTA` = `web/src/modules/worklist/MockTestAdmin.tsx` · `HKN` = `web/src/modules/test/keHoach/HopKyNang.tsx` · `tt` = `shared/domain/thaoTacMt.ts`.

## Đã làm

- **Thẻ việc Admin**: Xuất báo cáo PH (`viecWeb: xuat_bc_ph`) khuôn bảy dòng; Nhập hộ, nhập bù điểm khuôn bảy dòng (dòng Nhập hộ ở Công việc là việc của GV, `mine = false` → "?" mở thẻ GV + dải "Việc của Giáo viên. Bạn làm thay được."; thẻ Admin cho Tôi muốn…, tìm, panel ở Lịch Test).
- **Tên tab theo vai** (`HuongDan.tenTab`): Admin thấy "Việc quản lý" thay "Vận hành" — đúng tên trên trang (`HT:222`). QL dùng cùng cơ chế ở HD3-4.
- **Sửa 15 câu sai / cũ** ở `admin.ts` (bảng dưới). Panel Admin có thẻ: Nhập điểm → Nhập hộ, Xếp lịch Test → Xếp, dời lịch MT, Sửa thông tin, Xuất danh sách, Xuất Excel.
- **8 trường hợp Admin**; nhịp theo 4.3.
- **Mục "Luật và hạn" mọi vai đổi sang mã chèn** (PTA Overhaul rà #1756): GV / QL / Admin (han-cham, han-xac-nhan, han-ket-qua, han-vi-pham, han-ql, sos-case, ban-giao), QL (ql-han-duyet, ql-chuyen-lop, ql-buoc-tiep), TVV (tvv-luat-thi-that, tvv-luat-bao-ph, tvv-luat-phoi-hop), CX (cx-luat-thi-that); trang `/huong-dan` chèn hạn khi in luật (`MucHuongDan`). Phép HD-HAN soát cả `luat` (số ngày gõ tay; "Thứ Ba" của kỳ Kết quả PA là hằng trong mã, cho qua).
- Sửa luôn dòng luật TVV còn câu sai "có việc ngay kể cả khi chờ QL duyệt" (chỉ Nâng 1 bậc có ngay); "Speaking chấm chéo" → "Chấm Speaking chung" (lời 19).
- Danh sách chờ: bỏ `xuat_bc_ph`, panel `xep-lich-mt`, `admin: Đánh dấu đã đọc`. Còn chờ: việc QL (HD3-4).

## Câu → nguồn

| Thẻ | Nguồn từng dòng (Khi nào có · Làm · Xong · Hạn · Làm sai · Không làm được · Sau đó) |
|---|---|
| Xuất báo cáo PH (`xuat_bc_ph`) | `xbc:265-312`, `mw:1419-1436` · `TBC:448-477`, `HT:612-620` (Xuất Excel lớp · Xuất PDF lớp; thiếu: Báo cáo PH ›) · `xbc:265-308` (tự rời) · `mw:1424-1430` (dòng thiếu `due` = hạn đợt, overdue) · `xbc:1-6`, `TBC:155-158` · `bc:21, 42` (viết hộ chỉ QL) · `mw:347-350` |
| Nhập hộ, nhập bù điểm | `mw:886-916`, L1 §2 · `HT:446-455, 545` (Lọc thêm › Một GV), `dsv:207` (Nhập hộ) · L1 §2 · han `cham_test`, `tt:113-127` (Dời hạn chấm "Chỉ Quản lý") · `HopNhapDiem.tsx:577` (Lý do sửa), `attempts.ts:1599` · L1 §2 |

| Câu cũ (admin.ts) | Sửa | Nguồn |
|---|---|---|
| "Tổng quan › Mock Test" | "Tổng quan", "Xem số của chi nhánh"; thêm **Lịch tuần ›** | lời 49; `OverviewPage.tsx:38-63`; `MTA:13-18` |
| tab "Vận hành" | "Việc quản lý" (`tenTab`) | `HT:222` |
| "ô ▾ chọn một GV" | **Lọc thêm** rồi chọn GV | `HT:509, 545`; `ChonPhuTrach.tsx:51` |
| Xuất báo cáo PH chỉ "lớp đủ" | thêm lớp thiếu: **Báo cáo PH ›** | `mw:1427`; `TBC:457-477` |
| ⋯ môn: Dời hạn chấm (như Admin làm được) | Dời hạn chấm mờ "Chỉ Quản lý"; Huỷ điểm, Lịch sử; FT xoá lượt ở ⋯ đầu hộp (Hoàn tác) | `tt:52-56, 113-127`; `HKN:355-366` |
| "Chỉ Quản lý: … huỷ / khôi phục lượt" | huỷ / khôi phục lượt khi **Mở sửa lịch Test** bật; Chỉ QL: dời hạn chấm, Target, môn học, chuyển lớp, viết hộ BC PH | `attempts.ts:1637`; `moSuaLichTest.ts:50-53` |
| "khoá cuối tuần theo công tắc" | T6–CN máy hỏi, **Vẫn đổi lịch** | `skillSchedule.ts:48-57` |
| chuông "gom theo loại … Đánh dấu đã đọc", "số chuông bằng số Công việc" | GD-19: thanh = tab, chỉ việc của bạn; ✓ từng tin, **Đã xem hết**, **Xem tất cả** | `HopChuong.tsx:144-162, 274-331`; `chuong.ts:99-100` |
| "GV quá hạn tự nhận thông báo" | bỏ (không có nguồn) | `MTA:32-37, 84-98` |
| "Tìm lớp, học viên hoặc email…" | bỏ "…" (nhãn thật) | `TimKeHoach.tsx:64` |
| Phân tích "Chi nhánh · SOS · Thi thật · Giáo viên" | thứ tự web: Chi nhánh · Thi thật · SOS · Giáo viên | `shared/domain/phanTich.ts:29` |
| Công việc "tab Chấm điểm" | thêm tab Chấm Speaking | `tongQuan.ts:125-128` |

| Trường hợp | Nguồn |
|---|---|
| Báo cáo PH lớp chưa đủ / đợt quá hạn | `xbc:286-308`; `bc:21, 393-405`; `TBC:155-158` |
| Nhập điểm hộ GV | `mw:886-916`; `attempts.ts:1599` |
| Không thấy nút / không có quyền | `mw:754-756`; `tt:113-127`; `seed/data.ts:91-97` |
| Không lưu được, mất mạng | `LuoiFT.tsx:655-700`; `TBC:469` |
| Nhập sai, muốn sửa | L0 B7; `tt:63-81`; `HopNhapDiem.tsx:609-640` |
| Lịch Test đổi / em vắng | L0 B6, B9; L1 §4; `skillSchedule.ts:48-57, 1070-1100` |
| Em chuyển lớp | L0 A7, E3; L4 L-06, L-15 |
| Em tạm dừng / kết thúc học | L1 §3; L4 |

## [XM] cho PTA

1. Dòng **chưa phân công** / **S chấm chéo** (chưa ai giữ, `mine = false`) cũng ra thẻ GV + dải "Việc của Giáo viên. Bạn làm thay được." — chữ dải chưa đúng hẳn khi chưa ai giữ; đổi dải theo `ownerId` là việc khung nhỏ (nói nếu cần).
2. Chuông Admin chỉ đếm việc `mine` còn đầu trang Công việc đếm mọi dòng — hai số khác nhau là mã hiện hành; thẻ không còn câu "bằng nhau".
3. Tài khoản vừa Admin vừa GV: `phamViXemViec` = `'cham-diem'` có thể cắt việc Case / Ý thức (chưa thử trên dữ liệu) — ghi để PR mã xem.

## Ảnh (tài khoản demo Admin Phạm Thanh Xuân; ngày demo 14/09/2026; phông đã kiểm)

`ad-tq-1440-toi.png` (Tổng quan, tầng 3) · `ad-vh-1440-toi.png` (Công việc › Việc quản lý, tầng 2) · `ad-nhapho-1440-toi.png` · `ad-nhapho-375-sang.png` (đang mở Nhập hộ → thẻ GV + dải làm thay) · `ad-th-1440-toi.png` · `ad-th-375-sang.png` (Trường hợp). Không chữ bị cắt "…". Turso: 0 câu đọc thêm.

## Kiểm

`npm run check` đầy đủ: KẾT_QUẢ. `PISA_CHI_TEP=prHd`: 400 / 400.
