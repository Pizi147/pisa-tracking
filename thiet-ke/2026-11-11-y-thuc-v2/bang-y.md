# Ý THỨC V2 — tab Ý thức hồ sơ lớp + hồ sơ HV (session Y-THUC-V2, 11/11)

Nguồn: chủ SP 11/11 (plan.md dòng "Chủ SP 11/11 — Ý THỨC VI PHẠM làm lại") · luật L1–L5 + N34 + N36 (plan.md 1.6) ·
mockup đã duyệt 03/11 `thiet-ke/audit-0311/u10-y-thuc.html` (hình ảnh, màu giữ) · mã hiện tại (`ClassYThucCard.tsx`, `StudentYThucSection.tsx`,
`khoiYThuc.tsx`, `PanelBaoPhTvv.tsx`, `server/src/yThuc/{board,baoPhTvv}.ts`).
Mockup: `y-thuc-v2.html` (cùng thư mục). Ảnh: `anh/`.

## 1. Bấm thử trên seed (11/11, cô Hà — GVCN MB FT 101, ngày demo 14/09) — HIỆN TRẠNG ĐÃ KIỂM

| # | Chỗ rối (thấy trên seed) | Vì sao rối |
|---|---|---|
| R1 | Hàng em có **3 cột trạng thái** (Cần làm · Bậc "Đã tới / Lần này / Bậc kế / Đề xuất" · Báo PH "Lần … / badge / hạn") + cột Việc | đọc phải giải mã 7–9 mẩu chữ mới biết bước tiếp; không thấy thứ tự Ghi → GVCN → TVV |
| R2 | **Báo PH không gắn đúng lần**: Kiều Minh Đức đang chờ xử lý Report 1 nhưng ô Báo PH ghi "Lần Đình chỉ học tạm thời · Đã bỏ"; Hà Phương Linh "Đã tới Report 1 · 08/09" mà Báo PH "Lần Meeting CX/GĐCN" | máy chủ trả việc Báo PH **mới nhất của em** (`baoPhMoiNhat`), không theo lần xử lý của hàng |
| R3 | **GV không đọc được KQ Báo PH**: badge Báo PH chỉ bấm được khi người xem ghi được (TVV / QL); Lịch sử chỉ "đã báo 12/09"; panel Xem lần xử lý không có Báo PH | máy chủ ĐÃ cho GV đọc (`GET /y-thuc/bao-ph/:id`, quyền `STUDENT_VIEW` = GV có phân công ở lớp em, QL) nhưng web không mở; bảng lớp chỉ trả trạng thái + ngày |
| R4 | TVV ghi KQ chỉ có **một ô "Ghi chú kết quả"** | không tách "đã báo PH gì" và "PH phản hồi gì", không có kênh (gọi / Zalo / gặp) — luật L1 đã ghi "phụ huynh phản hồi" |
| R5 | "▾ Chi tiết" mở **lặp lại** cùng thông tin của hàng (Vi phạm của lần này, Bậc kế, Báo PH) + khối rỗng "Không còn vi phạm chờ" | ba nơi cùng nói một điều |
| R6 | **Hai kiểu danh sách**: Cần làm (bảng 6 cột theo em) ≠ Lịch sử (Ngày · HV · Loại · Nội dung · Ai) | trái luật "một danh sách một kiểu mở"; Lịch sử lẫn cả lần đang "Chờ QL duyệt" |
| R7 | Hồ sơ HV: hàng nút 4 kiểu khác nhau (Đã xem · 1 viền · Xác nhận xử lý chữ · Đề xuất QL duyệt chữ · ⓘ) + "Lần này Report 4 + Meeting" khi em chưa phải xử lý | "Lần này" đọc như việc bắt buộc; không rõ nút nào là bước chính |
| R8 | Hồ sơ HV: thẻ việc "Xem 1 vi phạm mới · Đã xem" ở đầu trang **và** nút "Đã xem · 1" trong tab | hai nút cùng nghĩa (giữ thẻ việc — luật "việc của tôi ở trang đầu", chỉ ghi lại) |

## 2. Việc → ai → bước hiện tại → đề xuất

| Việc | Ai làm (máy chủ kiểm) | Hiện tại (web 11/11) | Đề xuất V2 |
|---|---|---|---|
| Ghi vi phạm | mọi GV có phân công lớp, QL | "+ Ghi vi phạm" đầu tab (lớp + HV), panel `RecordViolationPanel` | **giữ** nguyên chỗ + panel |
| Sửa / Xoá vi phạm, bằng chứng | người ghi; GVCN, QL | mở tên vi phạm trong "Chi tiết" (lớp) / dòng (HV) | bấm **tên vi phạm** trên dòng → mở tại chỗ ngay dưới (mô tả, bằng chứng, Sửa · Xoá) — một tầng |
| Đã xem (vi phạm lẻ, không lên bậc) | GVCN, QL | nút "Đã xem · n" cột Việc + "Đã xem vi phạm này" trong Chi tiết | ô **Bước tiếp** của lần "Mới": nút viền "Đã xem · n"; từng vi phạm: trong dòng mở. Sau bấm: dòng ở lại "✓ Đã xem hh:mm · Hoàn tác · Xem lại" (giữ F03) |
| Bỏ xem | GVCN, QL | Lịch sử › dòng Đã xem › "Bỏ xem" | giữ ở Lịch sử (cùng kiểu dòng) + Hoàn tác tại chỗ |
| Xác nhận xử lý (theo thang) | GVCN, QL | nút chính cột Việc / hàng nút HV → panel `XacNhanXuLyPanel` | ô **Bước tiếp**: nút chính (bắt buộc) hoặc chữ phụ (vi phạm lẻ nghiêm trọng) → **giữ panel** |
| Đề xuất QL duyệt (WL 3, ngoài thang) | GVCN | chữ phụ dưới nút chính | giữ chữ phụ dưới nút chính |
| Duyệt / Từ chối đề xuất, thu hồi | QL | nhóm Chờ QL duyệt, nút Duyệt + Từ chối… | giữ; ô Bước tiếp của vai QL |
| Đánh dấu đã thực hiện (đề xuất đã duyệt) | GVCN | nút chính | giữ, ô Bước tiếp |
| Xem lần xử lý · Thu hồi… · Sửa vi phạm của lần · Rút đề xuất | GVCN, QL (máy chủ quyết) | nút "Xem lần xử lý" / "Xem" | bấm **ô "GVCN xử lý"** của lần (chữ "Report 2 · 05/11") → panel `XemXuLyPanel` như cũ (thêm khối Báo PH chỉ đọc) |
| Báo PH sau xử lý — ghi KQ | TVV của em, TVV cùng CN, QL | badge / nút "Ghi kết quả báo PH" → `PanelBaoPhTvv` (Kết quả · Ngày · Ghi chú) | ô Bước tiếp của vai TVV: "Ghi kết quả báo PH" → **cùng panel**, form tách: Kết quả · Ngày · **Kênh** · **Nội dung** · **PH phản hồi** |
| Ghi phản hồi PH đến sau | TVV, QL | không có (phải "Sửa" ngay sau lưu) | **mới**: lần đã báo mà "PH chưa phản hồi" → chữ "+ Ghi phản hồi PH" trong ô Báo PH (TVV) — **không** mở lại việc, không đổi hạn / Báo PH đúng hạn |
| **Đọc KQ Báo PH** | GV của lớp (GVCN, GVBM), QL, TVV | KHÔNG có | ô **"TVV báo PH"** của lần: trạng thái + ngày + kênh + 1 dòng "Nội dung" + 1 dòng "PH" ; "Xem đủ ▾" mở tại chỗ mọi lần ghi (thử lần 1, lần 2…) |
| Sửa hạn Báo PH | TVV, TVV cùng CN, GVCN lớp em, QL (N34) | trong panel Báo PH | giữ trong panel; dòng mở "Xem đủ" có "Sửa hạn" cho GVCN (không đổi luật) |
| Bỏ việc / Khôi phục Báo PH | TVV, QL | ⋯ trong panel | giữ |
| Khai / sửa cấp bậc | GVCN, QL | nút đầu tab | giữ |
| Chọn nhiều (lô Xác nhận xử lý · Đã xem · cấp bậc) | GVCN, QL | nút đầu tab + thanh dưới | giữ (ô chọn ở ô Học viên) |
| Thang | mọi vai đọc | "Thang ›" trong Chi tiết / ⓘ ở HV | chip bậc cạnh tên em ("Đã tới WL 1") → **hộp nhỏ tại chỗ** thang + Khai bậc |
| Lịch sử (Đã xem · Đã xử lý · Đã thu hồi, phạm vi, tìm em) | mọi vai | phân đoạn Lịch sử, kiểu dòng khác | giữ phân đoạn + bộ lọc, **cùng kiểu dòng** với Cần làm |
| Phối hợp SOS | GVCN | phân đoạn riêng | **không đổi** (ngoài phạm vi) |
| Điểm Mock Test › | mọi vai | chữ đầu tab | giữ |

## 3. Nguyên tắc V2 (một câu mỗi ý)
1. **Một lần = một khối dòng, một vi phạm = một dòng.** Các vi phạm cùng một lần (đang chờ, hoặc trong một lần xử lý) nằm liền nhau; ô bên phải gộp (rowspan) cho cả lần.
2. **Đọc trái → phải đúng thứ tự xử lý**: Vi phạm (ai ghi) → **GVCN xử lý** (Đã xem / bậc + ngày / chờ QL) → **TVV báo PH** (trạng thái, kênh, đã báo gì, PH phản hồi gì) → **Bước tiếp** (một nút đúng vai người xem; không phải việc của mình thì ghi ai đang làm).
3. **Báo PH đúng lần** của khối (sửa R2).
4. **GV đọc được Báo PH** ngay trên dòng; "Xem đủ ▾" mở tại chỗ (không panel).
5. **Một kiểu dòng cho Cần làm, Lịch sử, hồ sơ HV**; hồ sơ HV bỏ cột Học viên.
6. Không thêm bước, không thêm trạng thái chặn; PH chưa phản hồi **không** thành việc.

## 4. Ý trong yêu cầu → chỗ trong mockup

| # | Ý (nguồn) | Chỗ trong mockup |
|---|---|---|
| 1 | Ý thức hồ sơ lớp + HV "rối, không biết thao tác thế nào cho đúng" (chủ SP 11/11) | K1–K4: tiêu đề cột là thứ tự xử lý; ô Bước tiếp một nút chính |
| 2 | GV đọc được KQ Báo PH: TVV báo gì, PH phản hồi gì (chủ SP 11/11) | K1 hàng Quang Huy (mở "Xem đủ"), Khánh Linh (PH chưa phản hồi), K3 hồ sơ HV, K2/K4 375 |
| 3 | Một vi phạm một dòng, trái → phải theo thứ tự xử lý (PTA) | mọi bảng: cột Vi phạm mỗi dòng một vi phạm; ô gộp theo lần |
| 4 | Bước kế tiếp: một nút đúng vai (PTA) | cột Bước tiếp; K5 so 4 vai (GVCN · TVV · QL · GVBM) cùng một lần |
| 5 | Thao tác tại chỗ, không thêm bước (PTA, CLAUDE.md) | mở dòng tại chỗ (vi phạm, Báo PH); panel cũ giữ cho việc nhiều trường |
| 6 | Tóm tắt Báo PH: ngày, kênh, nội dung, phản hồi; xem đủ tại chỗ (PTA) | ô "TVV báo PH" + dòng mở K1 |
| 7 | Quyền xem theo vai GV lớp, GVCN, QL; máy chủ trả dữ liệu, đọc theo lô (PTA) | mục 6 dưới — máy chủ đã cho; bảng lớp thêm cột vào câu sẵn có |
| 8 | Trạng thái: chưa có vi phạm · chờ xử lý · đã báo chờ PH · PH đã phản hồi · nhiều vi phạm (PTA) | K6 rỗng · K1 Bắt buộc / Mới · K1 Khánh Linh · K1 Quang Huy · K1 Thanh Lâm (3 vi phạm) |
| 9 | 1440 + 375, tối (CLAUDE.md) | K1 · K2 · K3 · K4 (375 tối) |
| 10 | Giữ mọi thao tác cũ, bảng TRƯỚC → SAU (CLAUDE.md, 10 mục 8) | mục 5 dưới + cuối mockup |
| 11 | Trạng thái không chỉ bằng màu (CLAUDE.md) | mọi badge có chữ + dấu (✓ ⚠ ●) |
| 12 | Không chú thích tĩnh (bo-chu-thich) | luật nhóm vào ⓘ; chỉ giữ hạn, ai đang làm |
| 13 | Mã tuần ưu tiên; ngày cho hạn / ngày vi phạm (CLAUDE.md) | dải đầu "W2 NOV"; ngày dd/mm cho vi phạm, hạn, ngày báo |
| 14 | Hình ảnh theo mockup đã duyệt (màu, nền, viền) (nang-cap-khong-bat-chuoc) | dùng `audit-0311/chung.css` + `ro.css` + badge `.bv` của U10 |

## 5. Bảng thao tác TRƯỚC → SAU (không mất thao tác)

| Thao tác | Trước | Sau | |
|---|---|---|---|
| + Ghi vi phạm | đầu tab | đầu tab | GIỮ |
| Khai / sửa cấp bậc | đầu tab | đầu tab + hộp thang | GIỮ |
| Chọn nhiều + thanh lô | đầu tab | đầu tab, ô chọn ở ô Học viên | GIỮ |
| Điểm Mock Test › | đầu tab | đầu tab | GIỮ |
| Vi phạm · Phối hợp SOS | phân đoạn | phân đoạn | GIỮ |
| Cần làm · Lịch sử | phân đoạn, 2 kiểu dòng | phân đoạn, **1 kiểu dòng** | ĐỔI hình |
| Xác nhận xử lý | cột Việc | cột Bước tiếp | GIỮ |
| Đề xuất QL duyệt | chữ phụ | chữ phụ | GIỮ |
| Đã xem · n / Đã xem vi phạm này | cột Việc / Chi tiết | Bước tiếp / dòng vi phạm mở | GIỮ |
| Hoàn tác · Xem lại sau Đã xem | hàng ở lại | hàng ở lại | GIỮ |
| Bỏ xem | Lịch sử | Lịch sử | GIỮ |
| Sửa / Xoá vi phạm, bằng chứng | Chi tiết › tên | bấm tên vi phạm trên dòng | GIỮ (bớt 1 bấm) |
| Xem lần xử lý · Thu hồi… · Rút | nút Xem | bấm ô "GVCN xử lý" | GIỮ |
| Duyệt · Từ chối (QL) | cột Việc | Bước tiếp | GIỮ |
| Đánh dấu đã thực hiện | cột Việc | Bước tiếp | GIỮ |
| Ghi kết quả báo PH (TVV) | badge / nút | Bước tiếp | GIỮ, form thêm Kênh + tách 2 ô |
| Sửa hạn / Bỏ việc / Khôi phục Báo PH | panel | panel | GIỮ |
| Thang › | trong Chi tiết | chip bậc → hộp nhỏ | ĐỔI chỗ |
| Lịch sử của em › | trong Chi tiết | chip bậc hộp nhỏ "Lịch sử của em ›" | ĐỔI chỗ |
| "▾ Chi tiết" cả hàng | có | **BỎ** — mở đúng thứ cần (vi phạm / Báo PH / lần xử lý) | BỎ: chỉ lặp thông tin (R5) |
| **Đọc KQ Báo PH (GV)** | không có | ô TVV báo PH + Xem đủ ▾ | **MỚI** |
| **+ Ghi phản hồi PH (TVV)** | không có | trong ô TVV báo PH | **MỚI** |

## 6. Máy chủ (cho bước code — đo trước → sau trong PR)
- Quyền đọc: `xemViecBaoPh` đã cho `STUDENT_VIEW` (GV có phân công ở lớp em, QL, Quản trị); SĐT PH chỉ cho người ghi được — giữ.
- Bảng lớp (`bangYThucLop`): Báo PH lấy **theo lần xử lý** (đã có `measure_id` trong câu `dongThoiGian`), thêm vào câu sẵn có: lần ghi mới nhất (kết quả, ngày, kênh, đã báo, PH phản hồi, người) + số lần ghi. Không thêm câu; thêm ~1–2 dòng đọc / lần xử lý (chỉ mục `idx_viec_bao_ph_lan`). Ước: lớp 30 lần xử lý → +~60 dòng / lần mở tab.
- "Xem đủ ▾": gọi `GET /y-thuc/bao-ph/:id` có sẵn **khi mở** (3–4 câu, < 20 dòng); không gọi trước.
- DB: `viec_bao_ph_lan` thêm `kenh TEXT`, `phan_hoi TEXT` (migrate thêm cột, dữ liệu cũ: `ghi_chu` hiện là "Ghi chú"); lần "Ghi phản hồi PH" = một dòng mới `ket_qua = 'phan_hoi'`, không đổi trạng thái việc.
- Trần ở `tocDoDuong.ts` cho `/classes/:id/y-thuc` + `/students/:id/y-thuc` (đo trước → sau).

## 7. Câu hỏi [XM] cho chủ SP (khuyến nghị in đậm)
1. Khi chọn **Đã báo PH**: **"Nội dung" bắt buộc** (để GV luôn đọc được TVV báo gì); **"PH phản hồi" không bắt buộc** — để trống thì dòng hiện "PH chưa phản hồi" + TVV "+ Ghi phản hồi PH" sau (không thành việc, không trễ hạn). Đồng ý?
2. Kênh: **Gọi điện · Zalo · Gặp trực tiếp · Khác**, mặc định **Gọi điện**. Đủ chưa?
3. Lịch sử: dòng "Chờ QL duyệt" / "QL từ chối" hiện ở Cần làm, **bỏ khỏi Lịch sử** (chỉ Đã xem · Đã xử lý · Đã thu hồi)?

## 8. Vòng tự rà + critique
Agent rà riêng (impeccable critique + ui-ux-pro-max, đọc 11 ảnh):
- Vòng 1: **29/40**. Sửa 4 lỗi P1: vùng chạm 375 (chip bậc, badge bấm được) lên 44 px · 375 có thêm "Xem đủ ▾" khi chữ bị cắt · ô "Nội dung" bắt buộc khi Đã báo PH · Lịch sử bỏ "Thu hồi…" khỏi cột, cột đổi tên "Thao tác". Sửa P2: hạn tách thành dòng riêng, bỏ câu tĩnh ở ô rỗng, "Có việc khi GVCN lưu xử lý" thành "—" + ⓘ, dải bậc HV thống nhất.
- Vòng 2: **33/40**, không còn P0 / P1. Sửa thêm P2: nhãn "Nội dung" dùng chung ở mọi nơi; tên QL nằm trên một dòng.
- Theo luật cổng (đã qua 30): dừng ở đây.
- Tự rà theo từng ý của chủ SP (mục 4): đạt cả 14 ý.
