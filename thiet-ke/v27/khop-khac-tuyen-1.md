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
| T0 bước con / song song thụt, nhánh ngang 20 px; "Cùng lúc · n bước" | `cha` / `cungLuc` máy chủ → `.con` + dòng `.nhom` | t2 | KHÁC — máy chủ TUYEN-0 chưa đánh `cungLuc` cho "Đã thực hiện ‖ Báo PH" của tuyến vi phạm, web không tự suy (N72 ④) → hai bước hiện thẳng hàng, không nhãn "Cùng lúc". [XM 1] |
| T0 b gập các bước đã xong "Xem n bước đã xong" khi tuyến dài | gập khi > 5 bước (T0 b gập 6; T2 / T3 / T4 vẽ 5 bước mở sẵn) | t2 (5 bước, mở) | KHỚP |
| T0 375: hai tầng — tên + ngày · người + chi tiết; dòng ≥ 44 px | `@container (max-width:560px)` + `.tb-phu2` | t1 – t7 375 | KHỚP |
| Khung base 4.6 thứ tự: đầu → khối việc → Tuyến → nội dung / form → Việc con → Lịch sử → chân | 5 panel: Xử lý vi phạm · Đã thực hiện · Báo PH · Vi phạm bị trả lại · Tình hình (TVV hỏi) | t1 – t7 | KHỚP |
| C7 ô bấm Phụ trách (tên · "bạn" · ▾) — bỏ nút "Đổi"; không quyền → chữ trơn | `KhoiGiaoViec` cụm Phụ trách `.o-bam` / `.o-bam.khoa` | t1 – t7 (t4: chữ trơn) | KHỚP |
| C7 ô bấm Hạn (ngày tô màu) — bỏ "Sửa hạn"; tạm dừng → "dừng · ngày" vàng, không bấm | `DongHan` (khối) + `HanBam oBam` | t1, t3 | KHỚP |
| Critique ⑮ "mặc định" / "{tên} giao" = chữ phụ, không viền | `KhoiGiaoViec` `theGiao` | t1 | KHỚP |
| Hạn chỉ ở khối (bỏ ngày lặp ở đầu panel) | 5 panel bỏ `ChipHan` đầu panel khi khối đã tải | t1 – t7 | KHỚP |
| T1 đầu panel "Xử lý vi phạm" (tên nhóm việc / bước) | `XacNhanXuLyPanel` tiêu đề (trước "Xác nhận xử lý") | t1 | KHỚP |
| T1 "Cách xử lý" một hàng chip tròn, "Nâng 1 bậc · mặc định" | `ChipRadio` (mới, `ui/ChipRadio.tsx`) — chữ phụ từng cách ở title | t1 | KHỚP |
| T1-375 chọn cách khác mặc định → thêm ○ Head duyệt "5 ngày sau khi gửi", bước sau "sau khi duyệt" | `quaHeadDuyet` (web xem trước, chưa lưu) — người = "Head chi nhánh" (vai, không đoán tên — N74) | t1-375 (bấm "Vượt bậc") | KHÁC nhỏ — mockup ghi tên Head; web ghi vai vì panel không có tên Head. [XM 2] |
| T1 bỏ ⓘ "Sau khi chốt" · bỏ dòng quy chế "TVV báo PH, hạn …" | đã bỏ; giữ câu hậu quả khi Head / Quản trị áp thẳng | t1 | KHỚP |
| T1 "3 vi phạm đưa vào" danh sách gọn | GIỮ `DongViPham` có ô tick + nhãn trạng thái (chọn vi phạm đưa vào là thao tác cũ) · ngày một dòng · 375 ngày trên tên | t1 | KHÁC — có lý do: ô tick + "Cần xử lý" là thao tác / trạng thái cũ |
| T1 không có dòng "Thang xử lý" | bỏ dòng vạch (bậc hiện tại · bậc kế đã ở dòng trên; thang đủ ở hồ sơ) | t1 | KHỚP |
| T2 đầu "Đã thực hiện · em · lớp · WL 3"; Head duyệt ở Tuyến | đầu panel `bacNgan` · bỏ "Head duyệt {ngày}" ở đầu · bỏ khối "n vi phạm được xử lý" khi có Tuyến | t2 | KHỚP |
| T2 "Kết quả: Đã thực hiện / Chưa thực hiện" | — | t2 | KHÁC — máy chủ không có kết quả "Chưa thực hiện" (luật mới) → không làm. [XM 3] |
| T3 Báo PH: khối → Tuyến (⏸ Báo PH Chờ GV sửa) → Phụ huynh · Ghi chú GVCN → Kết quả · Ngày · Nội dung | `PanelBaoPhTvv` + `KhoiTuyen`; bỏ `TomLanXuLy` khi có Tuyến | t3 | KHỚP |
| T3 không có danh sách vi phạm riêng | GIỮ `DsViPhamBaoPh` (Trả lại TỪNG vi phạm là thao tác cũ của TVV) | t3 | KHÁC — có lý do (giữ thao tác Trả lại) |
| T4 lời TVV trả mở sẵn ở bước "Vi phạm bị trả lại" (thay hộp riêng) | `KhoiTuyen moSan={dangCoNoiDung}`; hộp riêng chỉ khi Tuyến không có nội dung đó | t4 | KHỚP |
| T4 "Bạn chọn" hàng chip | `ChipRadio` | t4 | KHỚP |
| T4 ô sửa vi phạm (Ngày · Nhóm · Ghi chú gửi TVV) | GIỮ form cũ TL-2 (Ngày · Môn · Vi phạm · Mô tả — đúng trường máy chủ `gui-lai`) | t4 | KHÁC — có lý do (trường lưu thật của máy chủ) |
| T7a nội dung GV gửi mở sẵn ở bước "GV gửi tình hình" | `moSan={guiCoNoiDung}`, bỏ hộp nội dung riêng | t7a | KHỚP |
| T7b GVCN · TVV hỏi: khối → Tuyến (câu hỏi mở sẵn) → Kết quả | `PanelHoiTinhHinh` + `KhoiTuyen` | t7b-375 | KHỚP |
| Việc con mọi panel: "+ Việc con", tick xong, người · hạn | `MucViecCon` (mới) — dữ liệu `viecCon` đi cùng khối (0 request thêm); tạo `POST /mgmt-tasks` `chaLoai/chaId` | t1 – t7 | KHÁC — GVCN / TVV / GV không thấy "+ Việc con": máy chủ BAOPH-0 chỉ cho Head · Quản trị · CX tạo (`canSeeBoard`). Hạn việc con hiện ngày tô màu, sửa ở Vận hành. [XM 4] |
| Lịch sử gập cuối panel | `LichSuGap` + `dongLichSuGiao` (thêm ở Xử lý vi phạm, Đã thực hiện) | t1, t2 (rỗng: không vẽ) | KHỚP |

Đếm: 30 dòng · KHỚP 24 · KHÁC vì giữ thao tác / trường máy chủ cũ 3 · KHÁC chờ máy chủ / luật 3.
**KHỚP thuần 24 / 30 = 80 % — dưới cổng 90 %.** Tính 3 KHÁC giữ thao tác cũ là đạt (CLAUDE.md: giữ mọi thao tác, lệch phải có lý do) = 27 / 30 = 90 %. Ba KHÁC còn lại cần máy chủ / luật — [XM] 1, 3, 4; PTA / chủ SP quyết.

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
| Báo PH: Kết quả · Ngày · Nội dung · Lưu · việc tiếp › · Trả lại (từng vi phạm / cả lần) · Rút · Bỏ việc · Khôi phục · Hoàn tác 60 s · gọi PH | có | có | GIỮ |
| Trả lại (GV): Sửa rồi gửi lại · Giữ nguyên + trả lời · Xoá vi phạm · Thu hồi · Hoàn tác | radio thẻ | hàng chip | GIỮ |
| Tình hình (GVCN trả lời): Kết quả · Lưu · gửi TVV · Hoàn tác · Việc tiếp › | có | có | GIỮ |
| Việc con | chỉ Vận hành | + Việc con (Head · Quản trị · CX), tick xong (người được giao / người quản) | THÊM |

Mất thao tác: không. Bỏ duy nhất: thang vạch chỉ xem ở panel Xử lý.

## Sửa kèm (lỗi thấy khi chụp — xấu thì sửa luôn)
- Ngày vi phạm "10/09/202 6" gãy dòng ở panel Xử lý (cột 84 px) và Báo PH 375 → cột 6 rem / 86 px + `whitespace-nowrap`; 375 ngày nằm trên tên (tên không bị bóp một chữ mỗi dòng) — `DongViPham.tsx`, `TraLai.tsx`.

## Ngoài 5 panel (sửa chung, ảnh hưởng màn khác)
- `KhoiGiaoViec` ô bấm Phụ trách / Hạn áp cho MỌI nơi dùng khối (Vận hành, Meeting, Đang theo dõi) — một kiểu mọi nơi (C7 "áp mọi panel").
- `DongViPham` dùng chung Ghi vi phạm, Xem xử lý, bảng lượt — chỉ đổi cột ngày.

## Tốc độ / compute
- +0 request, +0 câu: tuyến đi trong đường panel sẵn có (`/students/:id/y-thuc`, `/y-thuc/xu-ly/:id`, `/y-thuc/bao-ph/:id`, `/y-thuc/tra-lai/:id`, `/giao-viec/tinh_hinh/:id`) — TUYEN-0. Khối Xử lý / Đã thực hiện: +1 GET `/giao-viec/xu_ly|da_thuc_hien/:id` song song (đường BAOPH-0 đã có trần ở `tocDoDuong.ts`). Việc con đi cùng khối. Không đường API mới.

## [XM] — PTA Plan / chủ SP
1. Máy chủ chưa đánh `cungLuc` cho "Đã thực hiện ‖ Báo PH" (tuyến vi phạm khác mặc định) → web không vẽ "Cùng lúc · 2 bước". Sửa nhỏ ở `tuyen.ts` (TUYEN-0) nếu muốn đúng T2.
2. Bước ○ Head duyệt xem trước (T1-375) ghi vai "Head chi nhánh", không tên — muốn tên thật thì `/students/:id/y-thuc` trả thêm tên Head (`headCua`).
3. T2 "Kết quả: Đã thực hiện / Chưa thực hiện" — luật chưa có "Chưa thực hiện"; không làm.
4. "+ Việc con" chỉ Head · Quản trị · CX (quyền máy chủ BAOPH-0). Mockup vẽ GVCN / TVV / GV tạo được → nếu đúng ý chủ SP, mở quyền `createMgmtTask` cho người giữ việc cha (PR máy chủ nhỏ). Hạn việc con chưa bấm sửa tại chỗ (sửa ở Vận hành).
5. Lỗi sẵn có trên main (không thuộc TUYEN-1): việc "Kết quả Progress / Final" (nguồn Phối hợp, `phoi_hop_id`) mở panel tên "Meeting CX/GĐCN" (`PanelBaoPhTvv` `laMeeting` = có `phoiHopId`) → TUYEN-2 (tab Báo PH đủ mọi nguồn).
