# HD3-3 — Nội dung Hướng dẫn V3 · Tư vấn viên (TVV) + CX

Nguồn: `15-huong-dan-v3.md` mục 4 + 6 + 8 (mục 8 thắng). Mã main 15/11 (GD-8, GD-13b đã merge). **Xếp chồng sau #1756 (HD3-2)** — cùng sửa `maViec` / danh sách chờ.
Bảng sự thật đầy đủ (tệp:dòng): ghi chú nhóm session `hd3-3-su-that-tvv-cx.md`.
Viết tắt: `L3`, `L4` = `luat/3-y-thuc-phoi-hop-tvv.md`, `luat/4-lop-lo-trinh-quyen.md` · `bp` = `server/src/yThuc/baoPhTvv.ts` · `vt` = `server/src/worklist/viecTvv.ts` · `tt` = `server/src/loTrinh/thiThat.ts` ·
`bt` = `server/src/loTrinh/buocTiep.ts` · `xl` = `server/src/yThuc/xuLy.ts` · `PBP` = `web/src/modules/congViec/PanelBaoPhTvv.tsx` · `PST` = `web/src/modules/congViec/PanelSauThi.tsx` · `BPH` = `web/src/modules/yThuc/BangPhoiHop.tsx` · `qcY` = `shared/domain/quyCheYThuc.ts`.

## Đã làm

- **6 thẻ việc TVV theo tên dòng việc** (`viecWeb`): Báo PH (vi phạm · báo lại sau thu hồi · tình hình học tập — một thẻ: cùng panel, nút, hạn) · Báo PH · Meeting CX/GĐCN · Chốt ngày thi · Cập nhật kết quả thi thật · Chọn bước tiếp · Bổ sung hồ sơ thiếu.
- `maViec` thêm **Chốt ngày thi** (`missing_data` `chot-ngay-thi:` → `chot_ngay_thi`): QL giữ việc này khi em chưa có TVV → thẻ TVV, không dải "làm thay" (15 mục 8.1, mockup K2g).
- Sửa câu cũ SAI ở thẻ Báo PH: "có việc ngay, kể cả khi Chờ QL duyệt" → chỉ Nâng 1 bậc có việc ngay; cách khác khi QL duyệt / máy chốt (`xl:206, 1076-1088`).
- **9 trường hợp TVV**, **3 trường hợp CX** (CX không Công việc).
- Panel TVV / CX có `the` (Báo PH, Phối hợp SOS, Chốt ngày thi, Sau thi / Kết quả thi thật, Lộ trình mới, Sửa thông tin ×2, Thêm HV, Xuất danh sách) → mở panel từ hồ sơ em, "?" ra thẳng thẻ.
- Nhịp theo 4.3 (Hằng ngày · Hằng tháng · Khi có) cho TVV và CX.
- Danh sách chờ HD-DU: bỏ `bao_ph_yt`, `phoi_hop_tvv`, `thi_that`, `buoc_tiep`, `bo_sung_ho_so` + panel `bao-ph`, `chot-ngay-thi`, `lo-trinh`. Còn chờ: việc QL / Admin (HD3-4, HD3-5).

## Câu → nguồn luật (Khi nào có · Làm · Xong khi · Hạn · Làm sai · Không làm được · Sau đó)

| Thẻ (`viecWeb`) | Chữ | Nguồn |
|---|---|---|
| Báo PH (`bao_ph_yt`) | 90 | `xl:206, 1076-1088`, `bp:64-84`, `tinhHinh.ts:96-99`, L3 Y-08, Y-09, Y-11, Y-17 · PBP:84, 196-216 · `bp:283-284` · han `bao_ph_vi_pham`, `shared/domain/baoPhTvv.ts:12-40`, `DongHan.tsx:64-83` (Sửa hạn) · PBP:122, 143 (Sửa, Khôi phục) · `mywork` dòng "Chưa liên hệ được · lần n", `vt:18-23` (QL khi chưa có TVV) · `bp:285-299` |
| Báo PH · Meeting CX/GĐCN (`phoi_hop_tvv`) | ~83 | `phoiHop.ts:355-372`, L3 Y-19 · BPH:235-245, 320-358 · `bp:276-279`, `sos.ts:167` (≥ 10 ký tự) · `phoiHop.ts:363`, `sos.ts:166` (cấu hình Case & SOS, không mã Hạn mặc định) · BPH:244 (Sửa) · `bp:144, 454-461`, BPH:241 (GVCN, không GVCN → QL) · qcY:63 |
| Chốt ngày thi (`chot_ngay_thi`) | ~62 | `vt:106-119`, L4 L-19 · PST:235-282 · qcY:75-78 · (không hạn: `vt:117`) · PST:231-233 + Học viên & Lớp › Lịch thi (cùng đường lưu) · `vt:18-23` · `tt:255-259` |
| Cập nhật kết quả thi thật (`thi_that`) | ~68 | `tt:224-259` · PST:158-189 · qcY:80-81 · (không hạn) · PST:186-189, `KetQuaThiThatPanel.tsx:111` · `tt:43-51`, L4 L-20 · `bt:525-531` |
| Chọn bước tiếp (`buoc_tiep`) | ~86 | `bt:528-534` · PST:104-148, 193-205 · PST:126-127 · han `buoc_tiep_sau_thi`, `tongKetLoTrinh.ts:137-150`, Gia hạn `HoTroHocVienTab.tsx:611-613` · PST:127-128, `PanelBuocTiep.tsx:150-160` · `bt:556-559` · qcY:83-87, L4 L-21 |
| Bổ sung hồ sơ thiếu (`bo_sung_ho_so`) | ~73 | `vt:121-144` · `PanelViec.tsx:104-118`, `StudentManagePanel.tsx:456-465` · qcY:90 · (không hạn) · `StudentManagePanel.tsx:389-430` · `vt:141` · `mywork.ts:1416-1417` |

| Trường hợp | Nguồn |
|---|---|
| Em chưa có TVV / đổi TVV | `bp:5, 44-49, 451-462`; `vt:1-3, 18-23`; `StudentManagePanel.tsx:381-383` |
| Phụ huynh không nghe máy | `bp:6-7, 283`; qcY:70-72; `DanhSachViec.tsx:584-585` |
| Em thi thật xong | `tt:255-259`; L4 L-20, L-21; han `buoc_tiep_sau_thi` |
| Em tạm dừng / kết thúc học | `bp:438`; `baoPhTvv.ts` (shared) 28-40; `vt:94-98`; `bt:531`; L4 L-09 |
| Việc quá hạn | `tongQuan.ts:172-196`; `bt:568`; `loaiYeuCau.ts` (không loại Báo QL cho việc TVV) |
| Không thấy nút / không có quyền | `routes/index.ts:585-588`; `bp:140-143` |
| Không lưu được, mất mạng | `KhuonViec.tsx:140-150`; PBP:69-81, 106-115; `bp:262-271` |
| GVCN thu hồi / QL từ chối xử lý | `bp:27-29, 64-100`; PBP:164-169 |
| Em chuyển lớp | `bp:41-42, 440-441`; `tinhHinh.ts:243-246` |
| CX · Không thấy nút / chỉ xem | `nav.ts:31-33`; `seed/data.ts:103-104`; `permissions.ts:813-816` |
| CX · Em thi thật xong | `tt:43-51`; `KetQuaThiThatPanel.tsx:111-145`; `PanelBuocTiep.tsx:138` |

## Chỗ mã khác mockup ⑭ (theo mã)

1. Mã chèn mockup `han:bao_ph` không có → `{han:bao_ph_vi_pham}`. Meeting CX/GĐCN không có mã Hạn mặc định → "Theo cấu hình Case & SOS".
2. Mockup thẻ Báo PH "Làm sai" ẩn; mã có **Sửa** ngay sau lưu và **Khôi phục** việc bỏ nhầm → hiện.
3. Mockup "Em chưa có TVV: QL chi nhánh làm" đúng cho mọi việc TVV **trừ** Báo PH · Meeting CX/GĐCN (GVCN lớp em; không GVCN → QL) — thẻ Meeting ghi đúng.
4. Panel Sau thi ở Công việc không có Hoàn tác / Khôi phục bản trước (chỉ panel hồ sơ em) → thẻ ghi "panel ở hồ sơ em có Hoàn tác".

## [XM] cho PTA

1. **Báo PH ba biến thể một thẻ** (vi phạm · báo lại · tình hình): `ViecMo` chỉ có `tieuDe` để tách; cùng panel, nút, hạn → một thẻ, dòng "Khi nào có" nêu ba nguồn. Muốn tách thì thêm mã theo `tieuDe`.
2. **CX mockup K2e** (CX mở Case → thẻ GV + dải "Bạn chỉ xem"): mã CX không qua `PanelViec` và `p-case` không có thẻ → "?" ra tầng 3 Case đang mở. Cần thêm ngữ cảnh Case ở `NganCase` (PR khung).
3. Panel TVV không có nút **Sửa hạn** cho Meeting CX/GĐCN dù máy chủ cho phép — ghi để PR giao diện xem.
4. Chữ ⓘ tab Báo PH viết cứng "ngày lưu xử lý + 4" (`HoTroHocVienTab.tsx:853`) — không theo Hạn mặc định (PR giao diện).

## Ảnh (tài khoản demo TVV Phan Mai / Nguyễn Thu Hương, CX Vũ Thanh Tâm; ngày demo 14/09/2026; phông đã kiểm)

| Ảnh | Nội dung |
|---|---|
| `tvv-baoph-1440-toi.png` · `tvv-baoph-375-sang.png` | Công việc › Báo PH, đang mở Báo PH → thẻ Báo PH |
| `tvv-buoctiep-1440-toi.png` | Sau thi, đang mở Chọn bước tiếp → thẻ Chọn bước tiếp |
| `tvv-th-1440-toi.png` · `tvv-th-375-sang.png` | Trường hợp của TVV |
| `cx-hoso-1440-toi.png` | CX ở Hồ sơ học viên (tầng 3) |
| `cx-th-1440-toi.png` | Trường hợp của CX |

Không chữ bị cắt "…" trong thẻ. Turso: 0 câu đọc thêm.

## Kiểm

`npm run check` đầy đủ: xanh — 5802 kiểm tra + 74 tốc độ. `PISA_CHI_TEP=prHd`: 400 / 400.
