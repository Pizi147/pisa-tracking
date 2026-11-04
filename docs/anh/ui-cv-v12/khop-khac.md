# UI-CV-V12 — Công việc gọn (S1–S13) theo mockup đã duyệt `thiet-ke/v12/cong-viec.html`

Chủ SP 05/11 "Duyệt, code". Giữ bố cục U01 (nhóm, thứ tự, panel, mọi thao tác); chỉ sửa S1–S13 + luật đếm S11.
Dữ liệu demo 14/09/2026 (QL Nguyễn Khánh Vy = vai 2, GV cô Trần Ngọc Hà = vai 7). Phông đã kiểm trên dev server worktree:
`document.fonts.check('600 14px "Be Vietnam Pro"') === true` (node_modules riêng của worktree sau `npm ci`, không 403).

## Ảnh cặp (trái mockup | phải web, toàn trang)

| Khung mockup | Web | Ảnh |
|---|---|---|
| A1 · 1440 tối · QL xem việc cô Hà (`[data-k="a1"]`, khung chỉ vẽ cột danh sách) | `/cong-viec?nguoi=7` vai 2 | `cap-a1-ql-mot-gv-1440-toi.png` |
| A2 · 1440 tối · QL Tất cả (`[data-k="a2"]`) | `/cong-viec?nguoi=tat-ca` vai 2 | `cap-a2-ql-tat-ca-1440-toi.png` |
| A3 · 1440 tối · GV cô Hà (`[data-k="a3"]`) | `/cong-viec` vai 7 | `cap-a3-gv-1440-toi.png` |
| B1 · 375 sáng · GV cô Hà (`[data-k="b1"]`, khung cao 780 cắt sau nhóm Chấm điểm) | `/cong-viec` vai 7 | `cap-b1-gv-375-sang.png` |

## Số đếm (bảng D của mockup) — mockup → web

| Chỗ | Mockup "Sau" | Web | |
|---|---|---|---|
| Badge Công việc · GV cô Hà | 9 (đỏ) | 9 (đỏ) — thanh trên + thanh dưới 375 | KHỚP |
| Badge · QL Vy | không số | không số | KHỚP |
| Đầu trang | bỏ "n việc · n HV · n bài" | bỏ | KHỚP |
| Ô phạm vi QL | Của tôi · Của GV · Tất cả (Của tôi có số khi > 0) | không số (Vy 0) | KHỚP |
| Chấm điểm · cô Hà | 7 việc · ⚠ 4 quá hạn | 7 việc · ⚠ 4 quá hạn | KHỚP |
| Case học thuật · cô Hà | 16 việc · ⚠ 3 | 16 việc · ⚠ 3 | KHỚP |
| Ý thức & Phối hợp · cô Hà | 2 việc · ⚠ 2 | 2 việc · ⚠ 2 | KHỚP |
| Vận hành · cô Hà | 2 việc | 2 việc | KHỚP |
| Chấm điểm · QL Tất cả | 26 việc · ⚠ 14 | 26 việc · ⚠ 14 | KHỚP |
| Case học thuật · QL Tất cả | 39 việc · ⚠ 5 | 39 việc · ⚠ 5 | KHỚP |
| Speaking chấm chéo · QL | ⚠ 2 quá hạn (không số việc) | ⚠ 2 quá hạn | KHỚP |
| Chờ bạn duyệt · QL | 12 yêu cầu · ⚠ 1 | 12 yêu cầu · ⚠ 1 | KHỚP |
| Vạch hạn | mở: "Quá hạn" · gập: "Hạn sau 20/09 · 2 việc ▸" | như mockup (QL Tất cả: "· 6 việc") | KHỚP |

Cùng một hàm ở mọi nơi (`demDongViec`, `shared/domain/tongQuan.ts`): Tổng quan GV "Việc của tôi" 27 · ⚠ 9 = tổng đầu nhóm 7 + 16 + 2 + 2;
hồ sơ GV cô Hà 7 / 16 / 2 / 2 (⚠ 4 / 3 / 2 / 0) = đầu nhóm Công việc; badge hồ sơ lớp "n việc quá hạn" đếm dòng (MB FT 101: GV 6, QL 15).
Dữ liệu thật (bản sao 29/10, đã migrate tới main): badge QL MB 165 → **9**, GVCN nhiều lớp nhất MB 10 → **4**.

## Truy vết khung → thành phần → ảnh

| # | Mockup v12 | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|---|
| S1a | Chỉ tên em 600 | `MucNhom` (giữ 15 / 600) | A1–A3, B1 | KHỚP |
| S1b | Tên việc 500 (`.viec .t1`) | `DongViec`, `DongLop` 600 → 500; `DongDuyet` (dòng em) 500 | A1–A3 | KHỚP |
| S1c | "Cả lớp {mã}" 600, phần việc 500 (`.lop-gop`) | `DongLop` `<b>` 700 → 600 | A1, A2 | KHỚP |
| S1d | Thẻ phụ 500 mờ | `ThePhu` 600 → 500 `text-dim` | A1–B1 | KHỚP |
| S1e | Người 400 mờ | `NguoiGiu` 400 `text-dim` (trước: chữ sáng) | A2 | KHỚP |
| S2 | Thẻ phụ một hàng, cắt "…" (rê thấy đủ) | `ThePhu` `flex-nowrap` + `truncate` từng thẻ + `title` | A1–B1 | KHỚP |
| S3a | Lọc một GV: không ghi tên GV đó ở dòng | `useDong` `nguoiAn` = id GV đang xem | A1 | KHỚP |
| S3b | Bỏ "GV chấm chéo" ở dòng | `useDong`: dòng chấm chéo không người | A2 | KHỚP |
| S4a | Bỏ "+ n việc ở …" | `MucNhom` bỏ `khacCua` | A1–A3 | BỎ (như mockup) |
| S4b | Vạch hạn 0 việc ẩn | `VachHan` chỉ vẽ khi có việc | A1–A3 | KHỚP |
| S4c | Bỏ thẻ "Xong hết hôm nay ✓" | `HoTroHocVienTab` bỏ `xongHet` | — | BỎ |
| S4d | Bỏ dòng "Nếu duyệt: …" ở Chờ bạn duyệt → rê chuột / panel | `DongDuyet`: `title` của dòng; panel duyệt (`TheYeuCau`) giữ | A2 | KHỚP |
| S4e | Bỏ câu "Làm tại đây, không đổi trang." | khung chờ một câu | A2, A3 | BỎ |
| S5 | Nút một dòng: "Chấm", "Phối hợp" | `CotNut` `nowrap` + cắt "…" + `title`; chấm chéo "Chấm"; `phoi_hop` / `phoi_hop_sos` "Phối hợp" | A2, A3 | KHỚP |
| S6 | Không khối Chờ bạn duyệt khi xem một GV | có từ #926 — giữ | A1 | KHỚP |
| S7 | Chữ khung chờ ở đầu khung, một câu, cao tối thiểu 320 | khung `min-h-[320px]`, `pt-14`, chữ `text-dim` | A2, A3 | KHỚP |
| S8 | 375: dải nhóm một hàng (số cùng hàng tên) | `DaiNhom` bỏ `flex-wrap` / `basis-full` | B1 | KHỚP (xem K2) |
| S9 | Chỉ "không hạn" | `CotHan` "Chưa có hạn" → "không hạn" | A3 (Thiếu dữ liệu đánh giá) | KHỚP |
| S10 | Vạch mở chỉ tên; vạch gập giữ "· n việc" | `VachHan` | A1–A3 | KHỚP |
| S11 | Luật đếm (bảng trên) | `demDongViec` / `soCuaToi` (shared), `demSo` (máy chủ), `App` badge `canLamNgay` | A1–B1 | KHỚP |
| S12a | Bậc 1: giữa em / dòng "Cả lớp" / vạch hạn 1 px `--o-vien` hết bề ngang | `BAC_1` = `--o-nhap-vien` (cùng giá trị #66789f / #7f8aa6) ở `MucNhom`, `VachHan`, `CayDuyet` | A1–B1 | KHỚP |
| S12b | Bậc 2: giữa hai việc cùng em 1 px `--line` từ chữ tên việc (54 / 46 px) | `KeBac2` (việc + yêu cầu duyệt) | A2 (Hà Gia Bình, Hồ Thu Trang) | KHỚP |
| S13a | Hạn = viên tròn theo mức (quá hạn đỏ ⚠ · hôm nay vàng viền ⚠ · còn hạn xám) | `ChipHan vien` (chỉ dòng Công việc / Chờ duyệt; panel giữ chữ) | A1–B1 | KHỚP |
| S13b | Người = chữ mờ + biểu tượng người | `NguoiGiu` (SVG nét 12 px `--text-faint`) | A2 | KHỚP |
| S13c | Chờ duyệt: loại = chip VIỀN, lượt = chip nhạt, người đề xuất về cột người | `ThePhu vien` + `NguoiGiu` ở cột hạn | A2 | KHỚP |
| S13d | "Từ chối…" · "Mở ›" hai link 13 px giữa dưới nút | `justify-center gap-x-2` | A2 | KHỚP |
| S13e | Cột hạn / người / nút thẳng mọi dòng (150 · 118) | `COT_VIEC` sẵn có; `DongDuyet` 136 · 112 → 150 · 118 | A2 | KHỚP |
| S13f | Nút viền, chữ căn giữa | `justify-center` (trước căn trái) | A1–A3 | KHỚP |
| K1 | Nút dòng chữ 600 (`.nut` của `chung.css`) | giữ 500 (`index.css .btn-sm` D10 "nút lặp từng dòng không đậm" — mọi màn; S1 giảm đậm) | A1–A3 | **[XM]** — mockup (CSS chung) ≠ luật D10 toàn web; đổi một dòng nếu PTA chốt 600 |
| K2 | 375: tên nhóm `nowrap` | tên nhóm dài ("Case học thuật", "Ý thức & Phối hợp") XUỐNG DÒNG, số + ⚠ vẫn cùng hàng — 375 chỉ còn ~95 px cho tên; mockup không vẽ hai nhóm này mở ở 375; luật M2 "tên được xuống dòng, không cắt" | B1 | KHÁC — có lý do |
| K3 | A3 / B1: Case, Ý thức, Vận hành vẽ gập | giữ hành vi U01: nhóm mở sẵn (QL 375 gập từ nhóm 3 — SUA-CHAM-LAI Đ1) — v12 không có mục đổi luật gập | A3, B1 | KHÁC — giữ thao tác cũ |
| K4 | Khung chờ "Chọn một việc ở danh sách." | khi có nhóm Chờ bạn duyệt giữ "…hoặc yêu cầu…" (bấm yêu cầu cũng mở panel) | A2 | KHÁC — chữ đúng ngữ cảnh |
| — | Thẻ "MT1" ở dòng Nhập điểm | dữ liệu: #922 (N39) đổi nhãn việc chấm Mock thành "W1 JUL" — không có "MT1" | A1–A3 | dữ liệu, không tính |
| GIỮ | Bố cục danh sách trái + panel phải, nhóm → em → việc, vạch hạn, dòng "Cả lớp" + "n em ▾", nhóm Speaking chấm chéo, vòng chữ đầu, màu, SOS, dải "Mới dùng PISA", "✓ n xong hôm nay", Việc quản lý | không đổi | A1–B1 | GIỮ |

Điểm khớp: 33 dòng — 29 KHỚP / BỎ đúng mockup · 3 KHÁC có lý do (K2 luật M2, K3 giữ thao tác cũ, K4 chữ đúng ngữ cảnh) · 1 [XM] (K1, chờ PTA)
→ **32 / 33 = 97 %** (≥ 90 %).

## Thao tác TRƯỚC → SAU (không mất thao tác)

| Thao tác | Trước | Sau |
|---|---|---|
| Mở việc (bấm tên / dòng) → panel phải | có | có |
| Nhập điểm / Nhập hộ / Làm thay / Chấm / Phối hợp (nút dòng) | có (chữ dài, 2 dòng) | có — chữ một dòng ("Chấm", "Phối hợp") |
| "n em ▾" mở khay em của dòng gộp | có | có |
| Gia hạn (Chọn bước tiếp) · Bỏ qua (QL) | có | có |
| Xem thêm n dòng · gập / mở nhóm · gập / mở vạch "Hạn sau" | có | có |
| Lọc: Của tôi / Của GV / Tất cả · Mọi hạn · Loại việc · Lọc thêm (một GV · khung · chi nhánh) | có (ô phạm vi có số) | có — chỉ "Của tôi" có số khi > 0 (= badge) |
| Chờ bạn duyệt: Duyệt / Duyệt… / Trả lời… · Từ chối… · Mở › · tích nhiều + thanh chọn · ⓘ Duyệt nhiều | có | có |
| Xem "Nếu duyệt: …" | dòng thứ ba (bị cắt) | rê chuột dòng (`title`) hoặc bấm dòng → panel duyệt (đủ chữ) |
| Theo dõi một GV → Làm thay / Nhập hộ | có | có |
| Việc tiếp › · Hết việc nhóm · Hoàn tác sau lưu | có | có |
| ✓ n xong hôm nay (lọc việc vừa xong) | có | có |
| "+ n việc ở {nhóm}" (nhắc em còn việc nhóm khác) | chữ ở tên em | BỎ (S4, chủ SP duyệt) — panel việc vẫn có "Em này còn: …" một bấm sang việc khác của em |
| Thẻ "Xong hết hôm nay ✓" | có | BỎ (S4: báo trái dữ liệu khi còn việc) |
| Khôi phục việc đã bỏ qua · + Giao việc · Vận hành › · Họp đơn vị › · Yêu cầu của tôi · Lớp tôi dạy | có | có |

## Dòng đọc Turso (`/my-work`, bản sao dữ liệu thật 29/10 đã migrate tới main, bộ nhớ tham chiếu đã nóng — trước = main `00f84b376`, sau = nhánh)

| Góc | Trước | Sau |
|---|---|---|
| QL MB "Của tôi" (`/my-work`, cũng là badge) | 55 câu · 10 886 dòng | 55 câu · 10 886 dòng |
| QL MB "Tất cả" | 59 câu · 11 560 dòng | 59 câu · 11 560 dòng |
| QL xem một GV | 43 câu · 6 438 dòng | 43 câu · 6 438 dòng |
| GV "Của tôi" | 39 câu · 6 433 dòng | 39 câu · 6 433 dòng |

Không thêm câu, không thêm request: luật đếm chỉ tính lại trên `dong` đã nạp (máy chủ `demSo`, web `soCuaToi` / `demDongViec`); badge hồ sơ lớp gộp
dòng trong bộ nhớ (`gopViecTheoLop`). Băm JSON `/my-work` (TD4-a) không đổi — chỉ trường `summary` đổi (`canLamNgay` mới; bỏ `bai` / `nhom` / `hv`).
