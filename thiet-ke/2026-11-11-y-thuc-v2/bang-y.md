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
| Báo PH sau xử lý — ghi KQ | TVV của em, TVV cùng CN, QL | badge / nút "Ghi kết quả báo PH" → `PanelBaoPhTvv` (Kết quả · Ngày · Ghi chú) | ô Bước tiếp của vai TVV: "Ghi kết quả báo PH" → **cùng panel**, form: Kết quả · Ngày · **Nội dung** (một ô cho mọi kết quả — đổi tên "Ghi chú kết quả", bắt buộc) |
| **Đọc KQ Báo PH** | GV của lớp (GVCN, GVBM), QL, TVV | KHÔNG có | ô **"TVV báo PH"** của lần: trạng thái + ngày + 2 dòng "Nội dung" (TVV ghi đã báo gì, PH nói gì) ; "Xem đủ ▾" mở tại chỗ mọi lần ghi (thử lần 1, lần 2…) |
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
2. **Đọc trái → phải đúng thứ tự xử lý**: Vi phạm (ai ghi) → **GVCN xử lý** (Đã xem / bậc + ngày / chờ QL) → **TVV báo PH** (trạng thái, Nội dung TVV ghi) → **Bước tiếp** (một nút đúng vai người xem; không phải việc của mình thì ghi ai đang làm).
3. **Báo PH đúng lần** của khối (sửa R2).
4. **GV đọc được Báo PH** ngay trên dòng; "Xem đủ ▾" mở tại chỗ (không panel).
5. **Một kiểu dòng cho Cần làm, Lịch sử, hồ sơ HV**; hồ sơ HV bỏ cột Học viên.
6. Không thêm bước, không thêm trạng thái chặn.
7. **Vòng 2 (chủ SP 11/11):** chip môn trên mỗi vi phạm (dữ liệu `violations.skill` đã có — ô Môn tuỳ chọn khi ghi; không môn thì không chip) · bảng lớp gọn: bỏ dòng phụ "nhóm · người ghi", rê / focus tên vi phạm hiện hộp thông tin (nhóm, ngày, người ghi, mô tả, bằng chứng, trong lần nào); 375 chạm tên mở tại chỗ · panel Công việc (Xác nhận xử lý, Xem vi phạm mới, Báo PH) mở đầu bằng dải tiến trình ①②③ cùng tab, bước đang làm có chữ "Bạn".

## 4. Ý trong yêu cầu → chỗ trong mockup

| # | Ý (nguồn) | Chỗ trong mockup |
|---|---|---|
| 1 | Ý thức hồ sơ lớp + HV "rối, không biết thao tác thế nào cho đúng" (chủ SP 11/11) | K1–K4: tiêu đề cột là thứ tự xử lý; ô Bước tiếp một nút chính |
| 2 | GV đọc được KQ Báo PH: TVV báo gì, PH phản hồi gì (chủ SP 11/11) | K1 hàng Quang Huy (mở "Xem đủ"), Khánh Linh (Nội dung ghi PH chưa trả lời), K3 hồ sơ HV, K2/K4 375 |
| 3 | Một vi phạm một dòng, trái → phải theo thứ tự xử lý (PTA) | mọi bảng: cột Vi phạm mỗi dòng một vi phạm; ô gộp theo lần |
| 4 | Bước kế tiếp: một nút đúng vai (PTA) | cột Bước tiếp; K5 so 4 vai (GVCN · TVV · QL · GVBM) cùng một lần |
| 5 | Thao tác tại chỗ, không thêm bước (PTA, CLAUDE.md) | mở dòng tại chỗ (vi phạm, Báo PH); panel cũ giữ cho việc nhiều trường |
| 6 | Tóm tắt Báo PH: ngày, nội dung; xem đủ tại chỗ (PTA; vòng 2 bỏ kênh) | ô "TVV báo PH" + dòng mở K1 |
| 7 | Quyền xem theo vai GV lớp, GVCN, QL; máy chủ trả dữ liệu, đọc theo lô (PTA) | mục 6 dưới — máy chủ đã cho; bảng lớp thêm cột vào câu sẵn có |
| 8 | Trạng thái: chưa có vi phạm · chờ xử lý · đã báo chờ PH · PH đã phản hồi · nhiều vi phạm (PTA) | K6 rỗng · K1 Bắt buộc / Mới · K1 Khánh Linh · K1 Quang Huy · K1 Thanh Lâm (3 vi phạm) |
| 9 | 1440 + 375, tối (CLAUDE.md) | K1 · K2 · K3 · K4 (375 tối) |
| 10 | Giữ mọi thao tác cũ, bảng TRƯỚC → SAU (CLAUDE.md, 10 mục 8) | mục 5 dưới + cuối mockup |
| 11 | Trạng thái không chỉ bằng màu (CLAUDE.md) | mọi badge có chữ + dấu (✓ ⚠ ●) |
| 12 | Không chú thích tĩnh (bo-chu-thich) | luật nhóm vào ⓘ; chỉ giữ hạn, ai đang làm |
| 13 | Mã tuần ưu tiên; ngày cho hạn / ngày vi phạm (CLAUDE.md) | dải đầu "W2 NOV"; ngày dd/mm cho vi phạm, hạn, ngày báo |
| 15 | Chip môn mỗi vi phạm; bảng lớp gọn + hộp rê (chủ SP 11/11 vòng 2) | K1 (hộp ở hàng Khôi) · mọi bảng / thẻ |
| 16 | Panel Công việc đồng bộ ①②③ (chủ SP 11/11 vòng 2) | K8a–d + K5b |
| 17 | Chỉ một ô Nội dung, không Kênh (chủ SP 11/11 vòng 2) | K5b · K8d · mọi ô ③ |
| 18 | Chỉ rõ chỗ "Chờ QL duyệt" / "QL từ chối" (chủ SP 11/11 vòng 2) | K9a web hiện tại · K9b V2 |
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
| Ghi kết quả báo PH (TVV) | badge / nút | Bước tiếp | GIỮ, ô "Ghi chú kết quả" → "Nội dung" |
| Sửa hạn / Bỏ việc / Khôi phục Báo PH | panel | panel | GIỮ |
| Thang › | trong Chi tiết | chip bậc → hộp nhỏ | ĐỔI chỗ |
| Lịch sử của em › | trong Chi tiết | chip bậc hộp nhỏ "Lịch sử của em ›" | ĐỔI chỗ |
| "▾ Chi tiết" cả hàng | có | **BỎ** — mở đúng thứ cần (vi phạm / Báo PH / lần xử lý) | BỎ: chỉ lặp thông tin (R5) |
| **Đọc KQ Báo PH (GV)** | không có | ô TVV báo PH + Xem đủ ▾ | **MỚI** |

## 6. Máy chủ (cho bước code — đo trước → sau trong PR)
- Quyền đọc: `xemViecBaoPh` đã cho `STUDENT_VIEW` (GV có phân công ở lớp em, QL, Quản trị); SĐT PH chỉ cho người ghi được — giữ.
- Bảng lớp (`bangYThucLop`): Báo PH lấy **theo lần xử lý** (đã có `measure_id` trong câu `dongThoiGian`), thêm vào câu sẵn có: lần ghi mới nhất (kết quả, ngày, nội dung, người) + số lần ghi. Không thêm câu; thêm ~1–2 dòng đọc / lần xử lý (chỉ mục `idx_viec_bao_ph_lan`). Ước: lớp 30 lần xử lý → +~60 dòng / lần mở tab.
- "Xem đủ ▾": gọi `GET /y-thuc/bao-ph/:id` có sẵn **khi mở** (3–4 câu, < 20 dòng); không gọi trước.
- DB: **không migrate** (chủ SP 11/11: một ô Nội dung) — dùng cột `ghi_chu` sẵn có, đổi nhãn web "Ghi chú kết quả" → "Nội dung"; máy chủ kiểm Nội dung bắt buộc. Chip môn dùng `violations.skill` sẵn có.
- Trần ở `tocDoDuong.ts` cho `/classes/:id/y-thuc` + `/students/:id/y-thuc` (đo trước → sau).

## 7. Chủ SP đã chốt (11/11, qua PTA: "ok theo đề xuất của bạn, làm đi")
- Duyệt hướng mockup V2.
- Báo PH: một ô **Nội dung**, **bắt buộc**, cho mọi kết quả; không Kênh; không ô PH phản hồi riêng.
- "Chờ QL duyệt" / "QL từ chối" chỉ ở **Cần làm**; Lịch sử chỉ Đã xem · Đã xử lý · Đã thu hồi.
- Chủ SP xem kỹ bản HTML trước khi code (PTA báo).

## 8. Vòng tự rà + critique
Agent rà riêng (impeccable critique + ui-ux-pro-max, đọc 11 ảnh):
- Vòng 1: **29/40**. Sửa 4 lỗi P1: vùng chạm 375 (chip bậc, badge bấm được) lên 44 px · 375 có thêm "Xem đủ ▾" khi chữ bị cắt · ô "Nội dung" bắt buộc khi Đã báo PH · Lịch sử bỏ "Thu hồi…" khỏi cột, cột đổi tên "Thao tác". Sửa P2: hạn tách thành dòng riêng, bỏ câu tĩnh ở ô rỗng, "Có việc khi GVCN lưu xử lý" thành "—" + ⓘ, dải bậc HV thống nhất.
- Vòng 2: **33/40**, không còn P0 / P1. Sửa thêm P2: nhãn "Nội dung" dùng chung ở mọi nơi; tên QL nằm trên một dòng.
- Theo luật cổng (đã qua 30): dừng ở đây.
- Tự rà theo từng ý của chủ SP (mục 4): đạt cả 14 ý.
- **Vòng 3 (sau góp ý chủ SP 11/11):** chip môn · bảng gọn + hộp rê · một ô Nội dung, bỏ Kênh · K8 panel Công việc · K9 Chờ QL / QL từ chối. Agent rà: **33/40**, sửa 1 P1 (trùng tên em K8a / K9b) + P2 (thứ tự nút chân 375, chừa chỗ chip khi không môn, "Xem đủ" lý do từ chối). Không còn P0 / P1.
