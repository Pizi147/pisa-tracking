# TUYEN-1 (web) — khớp / khác mockup v27

Mockup: `tuyen-cong-viec.html` T0 – T4, T7 + ghi chú (C5 – C8). Đặc tả: `docs/superpowers/specs/2026-11-26-tuyen-cong-viec-yt-phoi-hop/thiet-ke.md` mục 4.1, 4.6, 7 (TUYEN-1).
Luật mới hơn mockup: `plan.md` 1.6 N72 – N77 (người đọc từ API, web không suy).
Ảnh cặp mockup | web (seed 14/09/2026, Playwright Edge, phông Be Vietnam Pro đã nạp — `document.fonts` kiểm): `docs/anh/tuyen-1/` — 1440 + 1280 tối, 375 sáng.
Dữ liệu thêm trên DB demo cục bộ trước khi chụp (đường API sẵn có): Head duyệt thẻ WL 3 (yêu cầu 7) · TVV trả lại vi phạm 61 · GV gửi tình hình (em 2) · TVV hỏi tình hình (em 4).

## Bảng truy vết khung → thành phần → ảnh

| Khung mockup (v27) | Thành phần web | Ảnh | |
|---|---|---|---|
| T0 khối Tuyến gọn: nhãn "Tuyến · {tên}" + "Xong a/b · đang n" + ⓘ, không khung / nền, kẻ trên + dưới, dòng 36 px | `KhoiTuyen` (mới, `yThuc/KhoiTuyen.tsx`) · CSS `.tn*` chép `v27.css` (`index.css`) | t1 … t7 | KHỚP |
| T0 dấu khác hình ✓ · chấm đặc + quầng · vòng đứt · × · ⏸ (ô vuông vàng); tên đọc màn đọc trạng thái trước tên bước | `Dau` + `.tb-dau` · `sr-only` "Xong / Đang ở bước này / Chưa tới lượt / Đã bỏ / Tạm dừng" | t1, t3, t4 | KHỚP |
| T0 cột subgrid: dấu · tên · chi tiết · người ("Bạn" đậm) · ngày / "hạn dd/mm/yyyy" tô theo hạn · ˅ | `.tn-ds` subgrid 34 · co giãn · ngày sát phải · 32 | t1 – t7 1440 / 1280 | KHỚP |
| T0 bước chưa tới lượt: chữ mờ, cột ngày = điều kiện ("sau khi bạn lưu") | `cho` → `chiTiet` máy chủ vào cột ngày | t1 | KHỚP |
| T0 bấm dòng có nội dung → mở ngay dưới dòng (cả dòng là vùng bấm, ˅ / ˄); không quyền → không ˅, title "Không xem được nội dung" | `coNoiDung` / `khongQuyen` (máy chủ C3) · `.nd-than` | t2, t4, t7a | KHỚP |
| T0 bước con / song song thụt, nhánh ngang 20 px; "Cùng lúc · n bước" | `cha` / `cungLuc` máy chủ → `.con` + dòng `.nhom` · máy chủ (PTA chốt [XM 1]) đánh `cungLuc` cho "Đã thực hiện ‖ Báo PH" khác mặc định (chờ Head: cả hai "sau khi Head duyệt") | t2 | KHỚP |
| T0 b gập các bước đã xong "Xem n bước đã xong" khi tuyến dài | gập khi > 5 bước (T0 b gập 6; T2 / T3 / T4 vẽ 5 bước mở sẵn) | t2 (5 bước, mở) | KHỚP |
| T0 375: hai tầng — tên + ngày · người + chi tiết; dòng ≥ 44 px | `@container (max-width:560px)` + `.tb-phu2` | t1 – t7 375 | KHỚP |
| Khung base 4.6 thứ tự: đầu → khối việc → Tuyến → nội dung / form → Việc con → Lịch sử → chân | 5 panel: Xử lý vi phạm · Đã thực hiện · Báo PH · Vi phạm bị trả lại · Tình hình (TVV hỏi) | t1 – t7 | KHỚP |
| C7 ô bấm Phụ trách (tên · "bạn" · ▾) — bỏ nút "Đổi"; không quyền → chữ trơn | `KhoiGiaoViec` cụm Phụ trách `.o-bam` / `.o-bam.khoa` | t1 – t7 (t4: chữ trơn) | KHỚP |
| C7 ô bấm Hạn (ngày tô màu) — bỏ "Sửa hạn"; tạm dừng → "dừng · ngày" vàng, không bấm | `DongHan` (khối) + `HanBam oBam` | t1, t3 | KHỚP |
| Critique ⑮ "mặc định" / "{tên} giao" = chữ phụ, không viền | `KhoiGiaoViec` `theGiao` | t1 | KHỚP |
| Hạn chỉ ở khối (bỏ ngày lặp ở đầu panel) | 5 panel bỏ `ChipHan` đầu panel khi khối đã tải | t1 – t7 | KHỚP |
| T1 đầu panel "Xử lý vi phạm" (tên nhóm việc / bước) | `XacNhanXuLyPanel` tiêu đề (trước "Xác nhận xử lý") | t1 | KHỚP |
| T1 "Cách xử lý" một hàng chip tròn, "Nâng 1 bậc · mặc định" | `ChipRadio` (mới, `ui/ChipRadio.tsx`) — chữ phụ từng cách ở title | t1 | KHỚP |
| T1-375 chọn cách khác mặc định → thêm ○ Head duyệt "5 ngày sau khi gửi", bước sau "sau khi duyệt" | `quaHeadDuyet` (web xem trước, chưa lưu): + ○ Head duyệt (tên `tuyen.head` = `headCua` máy chủ, N74 — PTA chốt [XM 2]) + ○ Đã thực hiện ‖ Báo PH cùng lúc "sau khi duyệt" | t1-375 (bấm "Vượt bậc"; em seed chưa có bậc nên "Không nâng" tắt) | KHỚP |
| T1 bỏ ⓘ "Sau khi chốt" · bỏ dòng quy chế "TVV báo PH, hạn …" | đã bỏ; giữ câu hậu quả khi Head / Quản trị áp thẳng | t1 | KHỚP |
| T1 "3 vi phạm đưa vào": một dòng "Nhóm — tên" · "{người} ghi" sát phải, bảng viền | `DongViPham tienTo` + "{người} ghi" ở cột phải; nhãn trạng thái chỉ khi khác "Cần xử lý"; ngày một dòng (375: ngày trên tên). GIỮ ô tick chọn vi phạm (thao tác cũ) | t1 | KHỚP |
| T1 không có dòng "Thang xử lý" | bỏ dòng vạch (bậc hiện tại · bậc kế đã ở dòng trên; thang đủ ở hồ sơ) | t1 | KHỚP |
| T2 đầu "Đã thực hiện · em · lớp · WL 3"; Head duyệt ở Tuyến | đầu panel `bacNgan` · bỏ "Head duyệt {ngày}" ở đầu · bỏ khối "n vi phạm được xử lý" khi có Tuyến | t2 | KHỚP |
| T2 "Kết quả: Đã thực hiện / Chưa thực hiện" | `ChipRadio` Kết quả: chưa lưu → "Chưa thực hiện" = việc vẫn mở (ẩn form, chân Đóng); đã ghi → "Chưa thực hiện" gọi đường sẵn có `POST /y-thuc/xu-ly/:id/chua-thuc-hien` (OV-7a, quyền Sửa xử lý) — cả ở màn "Đã lưu" | t2 | KHỚP |
| T3 Báo PH: khối → Tuyến (⏸ Báo PH Chờ GV sửa) → Phụ huynh · Ghi chú GVCN → Kết quả · Ngày · Nội dung | `PanelBaoPhTvv` + `KhoiTuyen`; bỏ `TomLanXuLy` khi có Tuyến | t3 | KHỚP |
| T3 không có danh sách vi phạm riêng | danh sách vi phạm (`DsViPhamBaoPh`: bấm xem · Trả lại từng vi phạm) chuyển vào nội dung bước "GV ghi n vi phạm" của Tuyến (`KhoiTuyen thanRieng`) — bấm bước là mở | t3 | KHỚP |
| T4 lời TVV trả mở sẵn ở bước "Vi phạm bị trả lại" (thay hộp riêng) | `KhoiTuyen moSan={dangCoNoiDung}`; hộp riêng chỉ khi Tuyến không có nội dung đó | t4 | KHỚP |
| T4 "Bạn chọn" hàng chip | `ChipRadio` | t4 | KHỚP |
| T4 ô sửa vi phạm (Ngày · Nhóm · Ghi chú gửi TVV) | GIỮ form cũ TL-2 (Ngày · Môn · Vi phạm · Mô tả — đúng trường máy chủ `gui-lai`) | t4 | KHÁC — có lý do (trường lưu thật của máy chủ) |
| T7a nội dung GV gửi mở sẵn ở bước "GV gửi tình hình" | `moSan={guiCoNoiDung}`, bỏ hộp nội dung riêng | t7a | KHỚP |
| T7b GVCN · TVV hỏi: khối → Tuyến (câu hỏi mở sẵn) → Kết quả | `PanelHoiTinhHinh` + `KhoiTuyen` | t7b-375 | KHỚP |
| Việc con mọi panel: "+ Việc con", tick xong, người · hạn | `MucViecCon` (mới) — dữ liệu `viecCon` đi cùng khối (0 request thêm); tạo `POST /mgmt-tasks` `chaLoai/chaId`; hạn = ô bấm sửa tại chỗ (`PATCH`). PTA chốt [XM 4]: NGƯỜI ĐANG GIỮ việc cha tạo / tick / sửa (máy chủ `giuViecCha` + cổng `/mgmt-tasks` cho `chaLoai`), Head · QT · CX như cũ, người theo dõi chỉ xem (phép kiểm 403) | t2, t3 (có việc con mẫu), còn lại "+ Việc con" | KHỚP |
| Lịch sử gập cuối panel (T1 "Lịch sử · 1 mục · Mở 13/09") | `LichSuGap` + `dongLichSuGiao` (thêm ở Xử lý vi phạm, Đã thực hiện) — hiện khi có đổi người / hạn / theo dõi / mô tả; chưa có lần nào thì không vẽ (luật GD-4c) | t1 (seed chưa có lần đổi → không vẽ) | KHÁC — dữ liệu: việc Xử lý tính theo em, chưa có dòng "Mở {ngày}" (máy chủ không lưu ngày mở việc khi chưa ai giao / đặt hạn). Có đổi người / hạn thì Lịch sử hiện như mockup. |

Đếm (sau góp ý PTA 26/11, vòng 2): 29 dòng · KHỚP 27 · KHÁC 2: form sửa vi phạm TL-2 (trường lưu thật của máy chủ `gui-lai`) · dòng "Mở {ngày}" của Lịch sử (máy chủ không lưu ngày mở việc Xử lý).
**KHỚP thuần 27 / 29 = 93 %.**

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau | |
|---|---|---|---|
| Đổi người phụ trách | nút "Đổi" cạnh tên | bấm thẳng vào ô tên (▾) — cùng hộp Đổi người, Hoàn tác 10 s | GIỮ (đổi chỗ bấm, C7) |
| Sửa hạn | bấm ngày gạch chấm | bấm ô ngày (viền mảnh) — cùng ô sửa tại chỗ, Về mặc định | GIỮ |
| Đặt hạn (việc không hạn) | "Chưa có hạn" gạch chấm | "Chưa có hạn" trong ô bấm | GIỮ |
| Theo dõi + / ✕ · "+n người" | có | có | GIỮ |
| Mô tả việc (+ Thêm / Sửa) | có | có | GIỮ |
| Đổi người / hạn / theo dõi ở Xử lý vi phạm, Đã thực hiện | không có khối | có khối Phụ trách · Hạn · Theo dõi (N72 ⑥, BAOPH-0) | THÊM |
| Xem bước trước / sau của việc | câu luật ⓘ "Sau khi chốt…", dòng tóm lần xử lý | khối Tuyến, bấm bước xem nội dung | THAY (không mất thông tin) |
| Xử lý: chọn cách (Nâng · Không nâng · Vượt · Ngoài thang) | 4 thẻ cao | hàng chip, chữ phụ ở title | GIỮ |
| Xử lý: tick vi phạm · Cũ hơn · Chèn · Khai cấp bậc · Không xử lý · Gửi Head duyệt · Lưu · việc tiếp › · Hoàn tác | có | có | GIỮ |
| Xử lý: thang vạch "Thang xử lý" | có | bỏ (bậc hiện tại / kế ở dòng trên; thang đủ ở hồ sơ HV) | BỎ (chỉ xem) |
| Đã thực hiện: Ngày · Người · Ghi chú · PH dự họp · Lưu · việc tiếp › | có | có | GIỮ |
| Báo PH: Kết quả · Ngày · Nội dung · Lưu · việc tiếp › · Trả lại cả lần (⋯) · Rút · Bỏ việc · Khôi phục · Hoàn tác 60 s · gọi PH | có | có | GIỮ |
| Báo PH: Trả lại TỪNG vi phạm | danh sách vi phạm riêng dưới khối | trong bước "GV ghi n vi phạm" của Tuyến (bấm bước → bấm vi phạm → Trả lại) — +1 lần bấm | GIỮ (đổi chỗ, mockup T3) |
| Trả lại (GV): Sửa rồi gửi lại · Giữ nguyên + trả lời · Xoá vi phạm · Thu hồi · Hoàn tác | radio thẻ | hàng chip | GIỮ |
| Tình hình (GVCN trả lời): Kết quả · Lưu · gửi TVV · Hoàn tác · Việc tiếp › | có | có | GIỮ |
| Việc con | chỉ Vận hành | + Việc con · tick · sửa hạn (ô bấm): người đang giữ việc cha + Head · Quản trị · CX; người được giao việc con tick việc mình; người theo dõi chỉ xem | THÊM |
| Đã thực hiện: Kết quả Đã / Chưa thực hiện | "Chưa thực hiện" chỉ ở panel Xem xử lý (hồ sơ) | thêm hàng chọn ở panel Công việc + nút "Chưa thực hiện" ở màn Đã lưu (đường OV-7a sẵn có) | THÊM |

Mất thao tác: không. Bỏ duy nhất: thang vạch chỉ xem ở panel Xử lý.

## Sửa kèm (lỗi thấy khi chụp — xấu thì sửa luôn)
- Ngày vi phạm "10/09/202 6" gãy dòng ở panel Xử lý (cột 84 px) và Báo PH 375 → cột 6 rem / 86 px + `whitespace-nowrap`; 375 ngày nằm trên tên (tên không bị bóp một chữ mỗi dòng) — `DongViPham.tsx`, `TraLai.tsx`.

## Ngoài 5 panel (sửa chung, ảnh hưởng màn khác)
- `KhoiGiaoViec` ô bấm Phụ trách / Hạn áp cho MỌI nơi dùng khối (Vận hành, Meeting, Đang theo dõi) — một kiểu mọi nơi (C7 "áp mọi panel").
- `DongViPham` dùng chung Ghi vi phạm, Xem xử lý, bảng lượt — chỉ đổi cột ngày.

## Máy chủ (PTA chốt 26/11, làm trong PR này)
- `yThuc/tuyen.ts`: khác mặc định — "Đã thực hiện" ‖ "Báo PH" `cungLuc` (cả khi chờ Head: Báo PH "sau khi Head duyệt", trước là "sau khi đã thực hiện") · tuyến "đang chờ xử lý" trả `head` = tên MỘT Head (`headCua`, N74). +0 câu (`nguoiVai` đã nạp theo request).
- `worklist/mgmttasks.ts` `giuViecCha`: người đang giữ việc cha (`docViec().phuTrach`, việc còn mở) tạo / tick / sửa việc con như Head; người theo dõi không. `routes/index.ts`: cổng khu Công việc cho `POST /mgmt-tasks` có `chaLoai` (TVV không có khu Công việc vẫn tạo việc con của việc mình; dịch vụ kiểm người giữ). Tạo việc Vận hành thường vẫn 403.
- Phép kiểm: `prTuyen0` (cùng lúc · tên Head) · `prBaoPh0` "TUYEN-1 · việc con" (người giữ tạo / tick / sửa hạn; người ngoài 403 ba đường; người theo dõi 403; giao việc cha đi → mất quyền, người mới có quyền) · `prYt4` (regex Cách xử lý nhận `ChipRadio`).

## Tốc độ / compute
- +0 request, +0 câu: tuyến đi trong đường panel sẵn có (`/students/:id/y-thuc`, `/y-thuc/xu-ly/:id`, `/y-thuc/bao-ph/:id`, `/y-thuc/tra-lai/:id`, `/giao-viec/tinh_hinh/:id`) — TUYEN-0. Khối Xử lý / Đã thực hiện: +1 GET `/giao-viec/xu_ly|da_thuc_hien/:id` song song (đường BAOPH-0 đã có trần ở `tocDoDuong.ts`). Việc con đi cùng khối. Không đường API mới.

## [XM] — PTA Plan / chủ SP (PTA chốt 26/11: 1, 2, 4 làm trong PR này · 3 làm bằng đường "Chưa thực hiện" sẵn có · 5 → TUYEN-2)
1. ~~Máy chủ chưa đánh `cungLuc` cho "Đã thực hiện ‖ Báo PH" (tuyến vi phạm khác mặc định) → web không vẽ "Cùng lúc · 2 bước". Sửa nhỏ ở `tuyen.ts` (TUYEN-0) nếu muốn đúng T2.~~ Đã làm.
2. ~~Bước ○ Head duyệt xem trước (T1-375) ghi vai "Head chi nhánh", không tên — muốn tên thật thì `/students/:id/y-thuc` trả thêm tên Head (`headCua`).~~ Đã làm (`tuyen.head`).
3. ~~T2 "Kết quả: Đã thực hiện / Chưa thực hiện" — luật chưa có "Chưa thực hiện"; không làm.~~ Có ở máy chủ (OV-7a `chuaThucHien`, xuLy.ts) — đã làm nút.
4. ~~"+ Việc con" chỉ Head · Quản trị · CX (quyền máy chủ BAOPH-0). Mockup vẽ GVCN / TVV / GV tạo được → nếu đúng ý chủ SP, mở quyền `createMgmtTask` cho người giữ việc cha (PR máy chủ nhỏ). Hạn việc con chưa bấm sửa tại chỗ (sửa ở Vận hành).~~ Đã làm (người giữ việc cha; hạn ô bấm).
5. Lỗi sẵn có trên main (không thuộc TUYEN-1): việc "Kết quả Progress / Final" (nguồn Phối hợp, `phoi_hop_id`) mở panel tên "Meeting CX/GĐCN" (`PanelBaoPhTvv` `laMeeting` = có `phoiHopId`) → TUYEN-2 (tab Báo PH đủ mọi nguồn).
