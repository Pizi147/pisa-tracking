# TL-2 · Trả lại vi phạm — chuẩn bị (pha 1)

Session code TL-2, 21/11/2026. Nền: main `5ffc7f9b6`. CHƯA sửa mã web. Pha 2 chờ PTA báo "TL-1 + GV-2 đã merge".
Nguồn: mockup `thiet-ke/v22/tra-lai-vi-pham.html` + `-ghi-chu.md` (ĐÃ CHỐT mục 4), luật `plan.md` 1.6 N61 · N58 · N34 · N41, `thiet-ke.md` mục E.
Ảnh TRƯỚC: `docs/anh/tl-2/truoc-*.png` (mục 5).

## 1. Hiện trạng mã (đã đọc)

| Chỗ | Tệp | Hôm nay |
|---|---|---|
| Panel Báo PH (TVV) | `web/src/modules/congViec/PanelBaoPhTvv.tsx` | `GET /y-thuc/bao-ph/:id`; đầu panel ⋯ (`MenuDong`: "Bỏ việc…"); dải ①②③ `TienTrinh`; `DongHan` (sửa hạn N34); `BoiCanh`: Vi phạm (danh sách `DongViPham` — bấm tên mở MÔ TẢ, không người ghi / giờ ghi), Ghi chú GVCN, Phụ huynh, Điện thoại; form Kết quả (`LuaChonRadio` Đã báo PH / Chưa liên hệ được) · Ngày (`ONgay`) · Nội dung bắt buộc; Lịch sử (`LichSuGap`, lần ghi + lần đổi hạn); chân: Đóng · Lưu · Lưu · việc tiếp ›; sau lưu: "Sửa"; việc đã bỏ: Khôi phục; toast Hoàn tác khi bỏ. Cũng mở từ `ClassYThucCard.tsx:601`, `StudentYThucSection.tsx:343` |
| Dữ liệu vi phạm trong panel | type `ViecBaoPh.boiCanh.viPham` | `{ id, ngay, ten, moTa, skill }` — THIẾU người ghi, giờ ghi, buổi |
| Chi tiết vi phạm (tab Ý thức lớp / HV, panel Xem vi phạm) | `web/src/modules/yThuc/ChiTietViPham.tsx` (dùng ở `ClassYThucCard.tsx:234`, `StudentYThucSection.tsx:129`, `PanelXemViPham.tsx:91`) | `GET /violations/:id` → Mô tả · Bằng chứng · Lần xử lý · "Đã sửa n lần · Xem" · Sửa / Xoá (khi `canEdit`) |
| Dòng vi phạm mở tại chỗ | `web/src/modules/yThuc/DongViPham.tsx` | một kiểu mở cho mọi danh sách vi phạm (▾ / ▴) |
| Định tuyến panel việc | `web/src/modules/congViec/PanelViec.tsx` (`switch (it.group)`) | `bao_ph_yt` → PanelBaoPhTvv; `yt_hoi_tinh_hinh` → PanelHoiTinhHinh (mẫu gần nhất cho việc của GV) |
| Dòng việc Ý thức & Phối hợp | `web/src/modules/congViec/DanhSachViec.tsx` `DongGon` (`LA_GON`, `tenGon`, `nutGon`) | ô gọn 64 px; nhóm → tab ở `shared/domain/tongQuan.ts:50` (`tabCuaViec`), icon `:169`, tên chuông `shared/domain/chuong.ts:22` |
| Mục / gập | `HoTroHocVienTab.tsx`, `DanhSachViec.tsx` (`DaiNhom` — GAP-MO) | |
| Khối Phụ trách · Hạn · Theo dõi | GV-2 (chưa merge) | hôm nay chỉ có `DongHan` |

## 2. Bảng truy vết khung → thành phần → ảnh

Ảnh nghiệm thu: `docs/anh/tl-2/{khung}-{toi-1440|sang-375}.png`, ảnh cặp mockup | web toàn trang.

| Khung | Thành phần mockup | Tệp web (dự kiến) | GIỮ / BỎ / MỚI | Ảnh |
|---|---|---|---|---|
| T1 | Danh sách vi phạm thành dòng bấm được (ngày · chip môn · nội dung · người ghi · ›), một dòng mở một lúc | `PanelBaoPhTvv.tsx` (khối Vi phạm) + dòng mới trong `DongViPham.tsx` hoặc biến thể `DongViPhamTraLai` trong `yThuc/` | MỚI (thay ▾ ▴ chỉ-mô-tả trong panel này; các danh sách khác GIỮ `DongViPham`) | t1 |
| T1 | Chi tiết dưới dòng: Ghi lúc (ngày giờ · người ghi · buổi) · Nội dung | cùng tệp | MỚI | t1 |
| T1 | Ô "Lý do trả lại *" ≥ 8 ký tự + bộ đếm + báo tại ô · dòng phụ "Về {người nhận} · hạn sửa {ngày}" · Huỷ / Trả lại | thành phần `TraLaiViPham` mới (`web/src/modules/yThuc/TraLai.tsx`), dùng `Truong` + `useLoiForm` + `useNhap` (nháp theo việc, không mất chữ) | MỚI | t1, t2c |
| T1 | Khối Phụ trách · Hạn · Theo dõi | thành phần của GV-2 | DÙNG LẠI (không tự vẽ) | t1 |
| T1 | Dải ①②③ (`.ttr`), Ghi chú GVCN, PH, Điện thoại, Kết quả, Nội dung, Quy chế, chân Đóng · Lưu · Lưu · việc tiếp › | `PanelBaoPhTvv.tsx` | GIỮ | t1 |
| T1 | Mockup T1 không vẽ ô Ngày + Nội dung + Lịch sử dưới Kết quả | — | GIỮ (thao tác cũ; mockup chỉ cắt khung) — ghi KHÁC có lý do | t1 |
| T2a | ⋯ thêm "Trả lại cả lần xử lý" (trên "Bỏ việc…") | `PanelBaoPhTvv.tsx` (`MenuDong` muc) | MỚI + GIỮ "Bỏ việc…" | t2a |
| T2b | Hộp nhỏ: tên lần xử lý · em · "về GVCN {tên}" · Lý do * · "GVCN sửa trong 3 ngày · hạn {ngày}" · Huỷ / Trả lại | `TraLai.tsx` trong hộp sẵn có (`HopNeo` / `HopXacNhanChung` — chọn cái đang dùng cho hộp nhỏ cùng loại) | MỚI | t2b |
| T2c | Lý do < 8: "Cần ít nhất 8 ký tự (đang n)" tại ô | `TraLai.tsx` | MỚI | t2c |
| T3a | Tiêu đề panel thẻ "Chờ GV sửa" (chữ + nền lam) | `PanelBaoPhTvv.tsx` + `KhungPanel` (chỗ phụ của tiêu đề nếu có, không thì cạnh `tieuDe`) | MỚI | t3a |
| T3a | Dải "✓ Đã trả lại cho {tên}" + Hoàn tác (60 giây) | `toast.hoanTac` sẵn có HAY dải trong panel như mockup → theo mockup: dải trong thân panel; cùng lúc toast? — chọn MỘT, theo mẫu "Đã bỏ việc" hiện dùng `toast.hoanTac` → [XM-1] | MỚI | t3a |
| T3a | Dải "Chờ GV sửa · n vi phạm · {GV} · hạn sửa {ngày} · «lý do» · Rút" | `PanelBaoPhTvv.tsx` (khối mới `.cho-sua`) | MỚI | t3a |
| T3a | Dòng Hạn: "19/09 · tạm dừng", không nút Sửa hạn | khối Hạn của GV-2 / `DongHan` (cần trạng thái tạm dừng) | MỚI (hỏi GV-2 có cờ không) | t3a |
| T3a | Dòng vi phạm có thẻ "Chờ GV sửa" | dòng vi phạm (T1) | MỚI | t3a |
| T3a | Form Báo PH vẫn dùng được · Quy chế "Hạn tạm dừng khi chờ GV · GV gửi lại → hạn mới 5 ngày" | `PanelBaoPhTvv.tsx`, `quyCheBaoPhTvv` (`shared/domain`) | GIỮ form + đổi chữ quy chế | t3a |
| T3b | Dòng việc danh sách TVV: thẻ "Chờ GV sửa" + chip hạn "tạm dừng" | `DanhSachViec.tsx` (dòng Báo PH) | MỚI | t3b |
| T3c | Rút → "✓ Đã rút · hạn Báo PH {ngày} chạy lại" + Hoàn tác | `PanelBaoPhTvv.tsx` | MỚI | t3c |
| T4a | Mục "Vi phạm bị trả lại" trong tab Ý thức & Phối hợp (GV); dòng: lớp · tên việc · chip em · "{TVV} trả" · hạn · nút "Sửa" | `DanhSachViec.tsx` (`LA_GON`, `tenGon`, `nutGon` thêm nhóm mới), `shared/domain/tongQuan.ts` (tab + icon), `shared/domain/chuong.ts` (tên) | MỚI | t4a |
| T4a | Panel "Vi phạm bị trả lại": loại "Việc · Ý thức" · tiêu đề + chip hạn · em · lớp · lần xử lý; khối Phụ trách (không "Đổi") · Hạn (Sửa hạn) · Theo dõi | panel mới `web/src/modules/yThuc/PanelViPhamTraLai.tsx` + `PanelViec.tsx` (case nhóm mới) + khối GV-2 | MỚI | t4a |
| T4a | Khối "{TVV} trả lại · ngày giờ · «lý do»" (`.gui-gv`) | panel mới | MỚI | t4a |
| T4a | Ba lựa chọn `.cach` (Sửa rồi gửi lại · Giữ nguyên + trả lời · Xoá vi phạm); nút chính đổi chữ; dòng quy chế đổi | panel mới, `LuaChonRadio` (dáng `khungRo`) hoặc thành phần `.cach` sẵn có — tìm trước khi viết | MỚI | t4a–c |
| T4a | Sửa rồi gửi lại: Ngày (`ONgay`) · Môn (L R W S) · Nội dung * + bộ đếm · Lịch sử vi phạm · n (gập) | panel mới; dùng lại phần form của `RecordViolationPanel.tsx` nếu tách được, không thì `ONgay` + `NutChon` | MỚI | t4a |
| T4b | Giữ nguyên: tóm tắt vi phạm · "Trả lời TVV *" ≥ 8 · "Gửi trả lời" | panel mới | MỚI | t4b |
| T4c | Xoá: "Sẽ xoá … · Còn lại n vi phạm trong {lần}" · quy chế "Vào Đã xoá 30 ngày · khôi phục được" · nút đỏ "Xoá vi phạm" | panel mới; đường xoá sẵn có `xoaViPham` (`DeleteViolationConfirm.tsx`) nếu TL-1 không có đường riêng | MỚI | t4c |
| T5 | GVCN "Lần xử lý bị trả lại · {lần}": ba lựa chọn Sửa rồi gửi lại · Giữ nguyên + trả lời · Thu hồi (Lý do thu hồi * · "Gửi QL duyệt") | panel mới (cùng tệp, biến thể cả lần), Thu hồi gọi đường N5 sẵn có (tìm ở `XemXuLyPanel.tsx`) | MỚI | t5 |
| T6a | Chuông TVV, mục Cập nhật: "GV đã sửa" / "GV đã trả lời" (/ "GV đã xoá") · lớp · giờ · "{em} · {GV} · nội dung" hai dòng; bấm tin mở panel Báo PH | thành phần chuông sẵn có (tin `notify()` của TL-1 — chỉ cần chữ + đích nếu dáng tin chung đủ) | MỚI (chữ) / GIỮ dáng | t6a |
| T6b | Panel sau gửi lại: hạn mới "còn 5 ngày · tính lại sau khi GV gửi lại"; dòng vi phạm thẻ "đã sửa"; chi tiết có "Lịch sử vi phạm · n" (cũ → mới, trả lại, ghi); nút "Trả lại" vẫn còn | `PanelBaoPhTvv.tsx`, dòng vi phạm, `DsLichSu` / `LichSuGap` | MỚI | t6b |
| T7a | Dòng việc GV quá hạn: chip đỏ "quá hạn n ngày", vào số quá hạn mục | `DanhSachViec.tsx` (đường quá hạn chung) | GIỮ cơ chế chung | t7a |
| T7b | Dải TVV đỏ "GV quá hạn n ngày" | khối `.cho-sua` (biến thể `qua`) | MỚI | t7b |
| T8a | 375 GV: panel toàn màn, "‹ Công việc", ba lựa chọn một cột ≥ 44 px, chân dính đáy | panel mới + `KhungPanel` (375 sẵn có) | MỚI | t8a |
| T8b | 375 TVV: dòng vi phạm BỎ cột người ghi (người ghi trong chi tiết), chi tiết một cột | dòng vi phạm | MỚI | t8b |
| — | Mở "Trả lại" từ chi tiết vi phạm ở tab Ý thức lớp / HV (vai phía TVV) | `ChiTietViPham.tsx` (thêm nút cạnh Sửa / Xoá, dùng `TraLai.tsx`) | MỚI — mockup KHÔNG vẽ; theo N61 + đề bài; dáng như T1 | ảnh riêng `y-thuc-tra-lai` |
| — | Báo PH đã xong / đã bỏ: không nút "Trả lại", không mục ⋯ trả cả lần | `PanelBaoPhTvv.tsx`, `ChiTietViPham.tsx` (theo cờ máy chủ) | MỚI (ĐÃ CHỐT ghi chú mục 4) | kiểm bấm |
| — | Rỗng / lỗi / đang lưu / quyền từng vai (GVBM, GVCN, TVV khác chi nhánh, CX, Head) | các tệp trên | MỚI (mockup không vẽ) | ảnh phụ |

## 3. Thao tác TRƯỚC → SAU

### Panel Báo PH (TVV, CX, Head; GVCN mở từ tab Ý thức)

| Thao tác | TRƯỚC | SAU |
|---|---|---|
| Ghi kết quả Đã báo PH / Chưa liên hệ được | có | GIỮ (cả khi "Chờ GV sửa" — không chặn) |
| Ngày (`ONgay`), Nội dung bắt buộc, nháp theo việc | có | GIỮ |
| Đóng · Lưu · Lưu · việc tiếp › (Thử lại khi lỗi) | có | GIỮ |
| Sau lưu "Đã báo PH": Sửa | có | GIỮ |
| Sửa hạn (`DongHan`, N34) | có | GIỮ (trong khối Phụ trách · Hạn · Theo dõi GV-2); tạm dừng khi chờ GV → không sửa (theo T3a) [XM-2] |
| Phụ trách · Đổi · Theo dõi + | — (GV-2 thêm) | GIỮ như GV-2 |
| ⋯ › Bỏ việc… (lý do, Ở lại / Bỏ việc này, toast Hoàn tác) | có | GIỮ |
| ⋯ › Trả lại cả lần xử lý | — | MỚI |
| Khôi phục việc đã bỏ | có | GIỮ |
| Bấm tên vi phạm → mô tả | có (▾) | ĐỔI: bấm cả dòng → chi tiết (ghi lúc · người ghi · buổi · nội dung) — nhiều thông tin hơn, một dòng mở một lúc |
| Dịch tên + mô tả vi phạm (`NutDichGop`) | có trong `DongViPham` | GIỮ trong chi tiết |
| Trả lại một vi phạm | — | MỚI |
| Rút yêu cầu + Hoàn tác | — | MỚI |
| Lịch sử (lần ghi, đổi hạn) | có | GIỮ + thêm trả lại / rút / GV gửi lại (nếu TL-1 trả về) |
| Gọi PH (`tel:`) | có | GIỮ |
| Thông báo "GVCN đang xin thu hồi" | có | GIỮ |

### Chi tiết vi phạm (tab Ý thức lớp / HV, panel Xem vi phạm)

| Thao tác | TRƯỚC | SAU |
|---|---|---|
| Xem mô tả, Dịch | có | GIỮ |
| Bằng chứng (+ Tệp · + Liên kết khi có quyền) | có | GIỮ |
| Mở lần xử lý | có | GIỮ |
| Đã sửa n lần · Xem | có | GIỮ (thêm dòng trả lại / trả lời nếu `history` có) |
| Sửa / Xoá (khi `canEdit`), Xoá thẳng + Hoàn tác | có | GIỮ |
| Trả lại (vai phía TVV, khi Báo PH còn mở) | — | MỚI |

### Phía GV (mới hoàn toàn)

| Thao tác | SAU |
|---|---|
| Thấy việc "Vi phạm bị trả lại" / "Lần xử lý bị trả lại" ở Công việc › Ý thức & Phối hợp | MỚI |
| Sửa hạn (khối chung), không Đổi người phụ trách | MỚI |
| Sửa rồi gửi lại (Ngày · Môn · Nội dung) | MỚI |
| Giữ nguyên + trả lời ≥ 8 | MỚI |
| Xoá vi phạm (nút đỏ, Đã xoá 30 ngày) | MỚI |
| GVCN Thu hồi → Gửi QL duyệt | MỚI lối vào; đường N5 GIỮ |
| Sửa / Xoá ở tab Ý thức như cũ | GIỮ |

## 4. Dữ liệu / API cần từ TL-1 (KHÔNG đoán — đối chiếu mô tả PR TL-1 ở pha 2)

| Khung | Cần |
|---|---|
| T1 | `GET /y-thuc/bao-ph/:id` → mỗi `viPham`: người ghi (tên), giờ ghi (`created_at`), buổi / kỹ năng; cờ `coTheTraLai` (vai + Báo PH còn mở) mỗi vi phạm và cho cả lần; người nhận dự kiến (người ghi / GVCN nếu đã nghỉ) + hạn sửa dự kiến (để vẽ "Về {tên} · hạn sửa {ngày}" trước khi gửi) — hoặc quy tắc tính hạn từ `shared/domain` |
| T1, T2 | `POST` trả lại một vi phạm `{ violationId, lyDo, viecBaoPhId? }`; trả cả lần `{ xuLyId / viecBaoPhId, lyDo }`; lỗi 400 khi lý do < 8 / Báo PH đã xong (chữ lỗi tiếng Việt) |
| T3a | trong `ViecBaoPh`: danh sách yêu cầu trả lại đang mở (id, vi phạm nào / cả lần, người nhận, hạn sửa, quá hạn?, lý do); cờ hạn tạm dừng; `nhanTrangThai` "Chờ GV sửa" |
| T3a, T3c | Hoàn tác 60 giây (đường + trong bao lâu); `POST` rút + hoàn tác rút |
| T3b | `/my-work` dòng `bao_ph_yt`: cờ "Chờ GV sửa" + hạn tạm dừng (không tính quá hạn) |
| T4, T5 | nhóm việc mới trong `/my-work` (tên `group`, `key`, `due`, người trả, lớp, em, lần xử lý; một vi phạm hay cả lần); `GET` chi tiết yêu cầu (lý do, người trả, lúc, vi phạm hiện tại, lịch sử, cờ GVCN / Thu hồi được); `POST` ba lựa chọn (gửi lại kèm ngày · môn · nội dung; trả lời; xoá) + Thu hồi (đường N5 cũ hay đường mới) ; sửa hạn qua khung GV-1 |
| T6a | tin `notify()`: loại "GV đã sửa / đã trả lời / đã xoá", đích bấm (mở panel Báo PH nào) |
| T6b | hạn Báo PH mới + cờ "tính lại sau khi GV gửi lại"; `violation_history` cho trả lại / sửa / trả lời / rút (field + cũ → mới + người + lúc) — trong `bao-ph/:id` hay phải gọi `/violations/:id` khi mở dòng |
| T7 | quá hạn yêu cầu (số ngày) phía TVV + phía GV (`urgency` chung) |
| tab Ý thức | `GET /violations/:id` → cờ trả lại được + yêu cầu đang mở |
| Dòng đọc | trần mới ở `tocDoDuong.ts` cho các đường trên; panel Báo PH không thêm request nếu `bao-ph/:id` đủ dữ liệu chi tiết |
| GV-2 | tên + props khối Phụ trách · Hạn · Theo dõi; có trạng thái "tạm dừng" / ẩn "Đổi" không |

## 5. Ảnh TRƯỚC (main `5ffc7f9b6`)

Dev server worktree cổng 4317 / 5317, seed nguyên (ngày demo 14/09/2026), `document.fonts.check('600 14px "Be Vietnam Pro"')` = true mọi ảnh. Toàn trang, 1440 tối + 375 sáng.
Em demo: Ngô Hải Yến (id 23, CP FT 110, lớp id 10), Báo PH việc 8 (REPORT 1, 3 vi phạm 09–11/09, "Chưa liên hệ được · lần 1"); TVV Nguyễn Thu Hương (23); GVCN Ngô Bảo Nam (13, cũng là người ghi).

| Ảnh | Nội dung |
|---|---|
| `truoc-bao-ph-tvv-{toi-1440,sang-375}` | TVV · Công việc › Báo PH, panel mở, vi phạm đầu mở mô tả (▾). Đầu panel "Bỏ việc…" hiện thành nút (⋯ một mục) |
| `truoc-vi-pham-hv-gv-*` | GVCN · hồ sơ HV › Ý thức, một vi phạm mở `ChiTietViPham`: Mô tả · Bằng chứng · Lần xử lý · Sửa / Xoá |
| `truoc-vi-pham-hv-tvv-*` | TVV · cùng chỗ: chi tiết KHÔNG có Sửa / Xoá (chỗ sẽ thêm "Trả lại") + "Ghi kết quả báo PH" |
| `truoc-y-thuc-lop-*` | GVCN · lớp CP FT 110 › Ý thức & Phối hợp |
| `truoc-cong-viec-gv-y-thuc-*` | GVCN · Công việc: hôm nay KHÔNG có tab Ý thức & Phối hợp (không việc) — sau TL-2 mục "Vi phạm bị trả lại" sẽ làm tab hiện |

Ghi chú: T1 mockup cho thấy "⋯" là nút vuông có menu; web hiện vẽ một mục ⋯ thành nút chữ "Bỏ việc…" (`MenuDong` một mục). Khi thêm "Trả lại cả lần xử lý", ⋯ có hai mục → thành menu như T2a, tự khớp.
Nhánh TL-1 / GV-2 chưa có trên origin lúc 21/11 (fetch) — chưa đối chiếu được.

## 6. [XM] cần PTA

- **XM-1** Hoàn tác sau "Trả lại": mockup T3a vẽ dải trong thân panel; app hiện dùng `toast.hoanTac` cho "Đã bỏ việc". Đề xuất: theo mockup (dải trong panel, cùng dáng `.da-luu`), toast không thêm.
- **XM-2** Khi hạn tạm dừng: mockup T3a không có "Sửa hạn". N34 ③ "hạn chọn không trượt theo Tạm dừng" nói về Tạm dừng lớp. Đề xuất: ẩn "Sửa hạn" khi chờ GV (theo mockup), sửa lại được sau khi GV gửi lại / rút.
- **XM-3** "Trả lại" từ tab Ý thức (lớp / HV): mockup không vẽ. Đề xuất: nút "Trả lại" cạnh Sửa / Xoá trong `ChiTietViPham`, mở cùng ô lý do T1 ngay trong chi tiết.
