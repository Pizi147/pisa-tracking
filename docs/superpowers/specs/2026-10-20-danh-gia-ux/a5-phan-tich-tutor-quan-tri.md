> Phụ lục của [Đánh giá lại UX/UI toàn diện 20/10/2026](../2026-10-20-danh-gia-lai-ux-ui-toan-dien.md). Báo cáo gốc của agent rà (Opus 5.5), giữ nguyên chữ. Đường `SCR\anh\…` / `SCR\…` là ảnh và tệp tạm của đợt rà (không lưu trong repo); ảnh tiêu biểu đã lưu ở `anh/`.

# a5 — Rà UX/UI: Phân tích · Báo cáo · Tutor · Quản trị · Hồ sơ GV (20/10/2026)

SCR = `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad`
Ảnh: `SCR\anh\a5\` (tên ở dưới là tên tệp trong thư mục này; `--t.txt` = chữ của màn / panel). Spec chụp: `SCR\chup\a5-*.json` (công cụ `a5-chup.mjs` = bản sao `chup.mjs` + bước select / print / eval).
Web demo `localhost:5621`, ngày demo 14/09/2026, chỉ đọc (không bấm Lưu / Xoá / Gửi; "Xem trước" Tải danh sách có gọi máy chủ với `luu:false`).
Phông: ảnh chụp trước tin điều phối (lỗi 403 tệp phông của môi trường thử) dùng phông dự phòng; mọi nhận xét về chữ, độ rộng, xuống dòng, cắt chữ dựa trên ảnh `a5-L-*` chụp lại sau khi phông nạp đúng.

---

## Phần 0. Phạm vi

**Đã rà (ảnh / chữ / mã):**
- **Phân tích, QT 1, Monbay, 1440 tối** — 6 tab × FT / Lớp thường: `a5-pt-bc-mb`, `a5-pt-bc-mb-thuong`, `a5-pt-bc-macdinh` (Tất cả chi nhánh), `a5-pt-th-mb(-thuong)`, `a5-pt-kq-mb`, `a5-pt-kq-mb-sos`, `a5-pt-kq-tt-mb`, `a5-pt-pa-mb(-thuong)`, `a5-pt-gv-mb(-thuong)`, `a5-pt-yt-mb`; chụp lại đúng phông `a5-L-bc-mb`, `a5-L-th-mb`, `a5-L-kq-mb`, `a5-L-gv-mb`.
- **Mọi số bấm được ở Báo cáo → panel**: `a5-bc-pn-{hvdathi, quahan (+ mở dòng), gv, sos, mock, chualich, chuadiem, casemo, pakq}`; Phân tích GV `a5-gv-pn-cham`, `a5-gv-pn-kq`, tooltip `a5-gv-tip`; Test + SOS `a5-th-pn`, menu ⋯ + "Xuất kết quả từng lượt" `a5-th-menu`; Ý thức `a5-yt-pn`; Hiệu quả PA `a5-pa-mo`.
- **Bộ chọn thời gian** (2 tuần · tuần · tháng · tùy chọn): `a5-bc-tg2`, `a5-L-tg`, `a5-thang-bc`, `a5-thang-tu`, `a5-L-thang`; khoảng khác `a5-bc-jun`, `a5-pa-8tuan`, `a5-gv-20tuan`, `a5-gv-tatca`, `a5-kq-tt-rong`.
- **In** (media print + PDF A4 ngang): `a5-bc-in--in.png`, `a5-bc-in--in.pdf` (1 trang).
- **Vai**: QL 2 `a5-ql-pt`, `a5-ql-gv`, `a5-ql-luong-bc`, `a5-ql-pn-quahan`, `a5-ql-gv-cham`; TVV 23 `a5-tvv-{pt,kq,yt}`; CX 24 `a5-cx-pt`; Admin VP 22 `a5-ad-{pt,gv,qt}`; Head tutor 25 `a5-ht-pt`; so chi nhánh QT `a5-cn-{th,kq,yt,pa}`; đối chiếu Tổng quan `a5-tq-qt-mb`.
- **375 sáng**: `a5-375-{bc, bc-pn, bc-mock, tg, th, kq, gv, pa, yt, ql-bc}`, `a5-L-375-{bc,kq,gv,th}`; 1440 sáng `a5-sang-{bc,gv}`; bàn phím `a5-kb-pt`; Quay lại `a5-L-bc-pn-mock`, `a5-L-bc-pn-quahan`, `a5-L-gv-pn-back`.
- **Tutor** (QT, Head tutor, QL; 1440 + 375): `a5-tu-{qt, qt-tatca, qt-thieu, qt-ngung, qt-thang10, qt-loc, pn, pn-rong, them, tai, gop, tg, ht, ql, ql-tatca, ql-pn}`, `a5-375-tu{,-tatca,-pn,-ht}`, `a5-L-tu-{qt,tatca,tai,gop}`, `a5-L-375-tu-tatca`.
- **Quản trị** (QT 1, Admin VP 22): `a5-qt-{tk, tao, sua, menu, xoa, nhom, ct, ct-sua, ct-moi, ct-ft, cfg, cfg-sua}`, `a5-375-qt-{tk,tao,cfg}`, `a5-L-qt-{tk,sua,cfg}`. **Hồ sơ GV**: `a5-gv-hs-{qt,ql,pn}`, `a5-375-gv-hs`, `a5-L-gv-hs`.
- **Mockup đã duyệt**: `a5-mk3-{bc,p4,p4c}`, `a5-mk6-m6`, `a5-mktu-{m2,m3}` + chữ trích từng khung (ov14-3 p0/p3/bc1440/p4/p4b/p4c/p5, ov14-6 m0/m6/m6b/m7, tutor m0–m7, vai v1–v6). Đọc đặc tả OV-14 mục 1 + 6, đặc tả Tutor, plan OV-15 §7 + OV-15e, mô tả PR #462.

**Chưa rà được (lý do):** Thi thật có dữ liệu + menu "Bước tiếp" (demo không có kết quả thi thật nào — `learning_cycles` không dòng nào có `thi_that_*`); Tutor có nhóm "Cần chú ý" (demo chỉ 2 buổi, không buổi "Không" nào gắn tutor); Đăng ký chờ duyệt (không ai chờ); hộp xác nhận Lưu quyền / Xoá tài khoản (không bấm theo luật); in ra giấy thật; trình đọc màn thật (chỉ kiểm thuộc tính ARIA + phím Tab).

---

## Phần 1. Điểm

| # | Heuristic | Điểm | Lý do cụ thể |
|---|---|---|---|
| 1 | Trạng thái hệ thống | 2 | Có skeleton, "Dữ liệu đến", tab đang chọn, toast lưu. Nhưng nhãn khoảng thời gian nói sai tháng (A5-01), ô "PA có kết quả trong kỳ" không theo kỳ (A5-02), TVV mở tab Ý thức bị đưa về Báo cáo im lặng, Phân tích GV chỉ báo lỗi 13 tuần sau khi đã chọn. |
| 2 | Khớp thế giới thật | 2 | Mã tuần, tên vai đúng nghề. Nhưng "không có = áp dụng, chưa có mục", "mẫu nhỏ", "Case SOS", "Lượt Mock", "PA chưa rõ nơi học lúc làm PA", "vấn đề đủ dữ liệu" là chữ của người làm hệ thống. |
| 3 | Kiểm soát, thoát | 2 | Esc / ✕ / Đóng, bộ lọc nằm trên URL, Gộp tên có Hoàn tác. Nhưng "Thôi học" lưu ngay không Hoàn tác (A5-08); Quay lại làm mất panel Mock / Chấm điểm (A5-15). |
| 4 | Nhất quán | 1 | Cùng bộ lọc, 3 tab ra 3 bộ số SOS / Đạt / lượt; bài quá hạn 28 / 53 / 58; ⚠4 / ⚠5; Chi nhánh khác chỗ các ô lọc khác; "— / không có / chưa có / mẫu nhỏ"; so kỳ trước hai kiểu; Tạo ≠ Sửa tài khoản; kiểu "số bấm được" khác mockup. Với khu vực số liệu, đây là lỗi gốc. |
| 5 | Phòng lỗi | 2 | Bộ chọn kiểm khoảng, form Tutor / Tài khoản báo lỗi tại ô, Tải danh sách có xem trước, ma trận quyền có hộp xác nhận. Nhưng Theo tháng ra sai tháng không cảnh báo, In bỏ dòng ngoài trang 1, chọn > 13 tuần được rồi mới lỗi. |
| 6 | Nhận ra hơn nhớ | 2 | ⓘ cách tính, chú thích cột. Nhưng số lớn không bấm được còn số nhỏ thì bấm được; "Tùy chọn" bị che trong hộp thời gian; 375 che 2 tab; so chi nhánh phải nhớ số qua 5 lần đổi ô. |
| 7 | Linh hoạt, nhanh | 3 | URL chia sẻ được, Xuất Excel ở 4 tab, phân trang 10 / 20 / 50, Xếp theo, cột hiện. Thiếu Xuất ở Phân tích GV, tab không có phím mũi tên, chưa có "tutor kế". |
| 8 | Tối giản | 2 | Báo cáo gọn trong một màn. Nhưng Phân tích GV 60 % ô là "—" / "không có" + 2 dòng chú giải; Kết quả thi 6 hàng điều khiển trước hàng dữ liệu đầu; Quyền & nhật ký 5 248 px; đoạn giải thích dài ở Quản trị, Tải danh sách. |
| 9 | Nhận biết, sửa lỗi | 2 | Lỗi dòng ở Tải danh sách rõ, sửa tại ô. Nhưng lỗi 13 tuần kèm nút "Thử lại" vô dụng; trang rỗng chỉ có câu gợi ý, không nút làm ngay. |
| 10 | Trợ giúp | 3 | Hướng dẫn theo vai (QL "Sáu tab phân tích", Head tutor 5 việc), "Cách tính" trong panel, chú thích cột nổi bằng chuột / Tab. |
| | **Tổng** | **21 / 40** | Mức "Acceptable" (20–27). Không xứng ≥ 35. |

**Cognitive load: trượt 5 / 8** (cao) — Single focus ✗ (Kết quả thi, Phân tích GV, Tutor rỗng) · Chunking ✗ (6 tab; bảng 13–17 cột) · Grouping ✗ (ô Chi nhánh tách khỏi hàng lọc) · Visual hierarchy ✓ (Báo cáo) · One thing at a time ✓ (panel) · Minimal choices ✗ (6 tab + 3–4 ô lọc + tab con + 4–5 chip) · Working memory ✗ (so chi nhánh, số lệch giữa tab, panel mất tên GV, link Lịch Test không lọc) · Progressive disclosure ✓.

**Vì sao chưa tới 35:** một lỗi P0 làm sai dữ liệu báo cáo theo tháng; các tab cùng bộ lọc cho số khác nhau mà nhãn không nói; panel số chỉ là danh sách tên (trái chốt C26); Tutor mở ra rỗng. Sửa 4 nhóm này (Phần 3.1–3.4) ước nâng H1, H4, H6, H8 thêm 1 điểm mỗi heuristic → ~25–26; tới 35 cần thêm bố cục theo mockup (3.2) và gọn Quản trị (3.5).

**Persona:**
- *Chị Vy (QL, giao ban 10 phút)*: Tổng quan → "Báo cáo ›" → In: nhanh (3 bấm). Nhưng SOS ở Báo cáo 2/3/0, Tổng quan 6/5/3, Kết quả thi SOS 3 = 2 → mất thời gian giải thích; bấm số chỉ ra tên, không ra điểm.
- *Cô Linh (GV, điện thoại)*: không có Phân tích; hồ sơ GV của chính mình gọn, nút "Mở Công việc ›" đúng chỗ.
- *Alex*: URL sâu, Xuất Excel tốt; nhưng chọn tháng 3 bấm mà ra sai tháng, "Tùy chọn" bị che, tab không phím mũi tên, sau Lưu nhận xét tutor phải đóng + chọn người kế.
- *Sam*: số bấm được có aria-label, chú thích cột mở bằng Tab, ✓ / ✗ có chữ ẩn "Bằng kỳ vọng"; trượt: hàng tab không phím mũi tên, "Tùy chọn" tới được bằng Tab nhưng không thấy, hộp gõ dở dùng `window.confirm` của trình duyệt.

**Cảm xúc:** mở Báo cáo thấy gọn, tin được → đối chiếu Tổng quan thì nghi ngờ số → Tutor mở ra trống (bối rối) → Kết quả thi chọn "Thôi học" một chạm (lo).
**Độ riêng của thiết kế:** đúng nghề (mã tuần, SOS, PA), không phải giao diện chung chung; nhưng phẳng hơn mockup (mất ô số viền, chip SOS màu, chip kết luận màu).

---

## Phần 2. Phát hiện (nặng → nhẹ)

### A5-01 "Theo tháng" ra tháng trước, cả nhãn lẫn số — PHÁT HIỆN · **P0** · mọi vai có Phân tích + Tutor
- **Vấn đề:** Chọn Theo tháng, hộp xem trước ghi "09/2026 · 31/08 – 27/09/2026" → Áp dụng → trang ghi "08/2026 · 03/08 – 30/08/2026" và số của tháng 8. Trang Tutor: gõ 10/2026 → URL tháng 10, nhãn + số tháng 9.
- **Bằng chứng:** `a5-L-thang--chon.png` → `a5-L-thang--sau.png` (URL `kieu=thang&tu=2026-08-31&den=2026-09-27`); `a5-thang-tu--chon.png`; gọi thẳng API `/phan-tich/bao-cao?…&kieu=thang&tu=2026-08-31&den=2026-09-27` → máy chủ trả `tu 2026-08-03, den 2026-08-30`; cùng tham số `kieu=tuy-chon` → đúng 31/08–27/09.
- **Nguyên nhân (triển khai):** `thamSoKhoang` ghi `tu` = Thứ Hai tuần đầu của tháng (thường rơi vào tháng trước) — `shared/domain/khoangThoiGian.ts:76-80`; `khoangTuUrl` suy tháng bằng `tu.slice(0,7)` — `:59-61`; máy chủ `khoangOf` dùng cùng hàm — `server/src/routes/index.ts:711-718`. Sai với mọi tháng mà ngày 1 không phải Thứ Hai.
- **Ảnh hưởng:** báo cáo tháng (in ra họp) ghi tên tháng sai, số sai, không ai biết. Chạm 6 tab Phân tích, trang Tutor, panel một tutor.
- **Phương án:** kiểu tháng ghi `thang=YYYY-MM` lên URL (hoặc suy tháng từ ngày giữa khoảng); một phép kiểm 12 tháng 2026 cho cả web lẫn máy chủ. Không đổi giao diện.

### A5-02 "PA có kết quả trong kỳ" không theo kỳ — PHÁT HIỆN · **P1** · QL, QT
- **Vấn đề:** Báo cáo Monbay FT ghi **10** cho W1+W2 SEP và vẫn **10** cho W1+W2 JUN. Hiệu quả PA cùng bộ lọc ghi **2** (2 tuần), **10** (8 tuần).
- **Bằng chứng:** `a5-pt-bc-mb--t.txt`, `a5-bc-jun--t.txt`, `a5-pt-pa-mb--t.txt`, `a5-pa-8tuan--t.txt`; panel `a5-bc-pn-pakq--t.txt` (10 dòng, không dòng nào ghi kết quả PA, mô tả PA lặp 2 lần mỗi dòng).
- **Nguyên nhân:** chỉ số `pa-co-ket-qua` bỏ qua `from/to` — `server/src/worklist/metrics.ts:902-907`; ô gắn nhãn "trong kỳ" — `web/src/modules/phanTich/BaoCao.tsx:165`.
- **Ảnh hưởng:** số sai trên giấy họp; hai tab cùng khái niệm khác số.
- **Phương án:** ô Báo cáo dùng chung hàm tập của Hiệu quả PA (theo khoảng); panel ghi kết quả (Tiến bộ rõ / Một phần / Không tiến bộ).

### A5-03 Cùng bộ lọc, ba tab ra ba bộ số SOS · Đạt · lượt — XÁC NHẬN-ẢNH (ảnh 9) + PHÁT HIỆN · **P1** · QL, QT
- **Bằng chứng (cùng lúc, QT · Monbay · FT · W1+W2 SEP):** Báo cáo "SOS theo lớp" Cả Monbay **2 / 3 / 0** (HV), Kết quả Mock **5 Đạt · 4 Chưa đạt · 8 Chưa đủ điểm**, "17 HV đã thi"; Test + SOS **16 lượt · Đạt 6 · SOS 2 / 3 / 0 · Thiếu điểm 5**; Kết quả thi **17 lượt · 5 Đạt · 8 Chưa đủ điểm · SOS 3: 2 · SOS 2: 4 · SOS 1: 3**; Tổng quan "SOS hiện tại" **6 / 5 / 3**. Ảnh `a5-L-bc-mb-p1`, `a5-L-th-mb`, `a5-L-kq-mb-p1`, `a5-tq-qt-mb--t.txt`.
- **Nguyên nhân (thiết kế + triển khai):** bốn định nghĩa, nhãn không nói: Báo cáo = HV, mức cao nhất **trong kỳ** (`server/src/phanTich/baoCao.ts:33-45`); Test + SOS = lượt, phân loại lượt; Kết quả thi = lượt, lấy mức SOS ghi trên lượt, **kể cả lượt chưa đủ điểm** (`server/src/phanTich/ketQuaThi.ts:82`; vd Lý Minh Châu "Chưa đủ điểm · SOS 1"); Tổng quan = lượt mới nhất **hiện tại**. "Đạt" (6) của Test + SOS ≠ "Đạt" OVR ≥ kỳ vọng (5); "Thiếu điểm" (5) ≠ "Chưa đủ điểm" (8).
- **Ảnh hưởng:** QL thấy SOS 3 = 2 ở Kết quả thi, 0 ở Báo cáo / Test + SOS, 3 ở Tổng quan → mất tin vào số; trái luật "cùng số liệu cùng hàm".
- **Phương án:** một bảng định nghĩa; mọi ô SOS ghi đơn vị + thời điểm ("HV · trong kỳ" / "lượt" / "hiện tại"); Kết quả thi ghi riêng SOS của lượt chưa đủ điểm / SOS tạm; Test + SOS "Đạt" → "Đạt kỳ vọng" dùng chung `ketQuaMock`, "Thiếu điểm" → "Chưa đủ điểm" chung hàm. Rule UX: Consistent patterns (Cognitive "Inconsistent Pattern").

### A5-04 Bài quá hạn, Case quá hạn: phạm vi khác nhau, nhãn không nói — XÁC NHẬN-ẢNH (ảnh 1, 9) · **P1** · QL, QT
- **Bằng chứng (cùng lúc, QT Monbay FT):** Báo cáo "⚠ 28 bài quá hạn" (lượt trong kỳ, FT); Tổng quan dải "58 bài trễ chấm · 4 GV" (gộp FT + Lớp thường); Tổng quan "Trễ chấm 53 bài · 3 GV" (FT); Lịch Test "Quá hạn chấm 58 bài · 4 lớp". Case: Báo cáo "⚠ 4 quá hạn · 3 chốt PA · 1 Kết quả PA" (FT) ↔ Tổng quan "⚠ 5 quá hạn" — khối "Case chưa chốt PA" ở Tổng quan liệt kê cả MB FOU 12, MB FOU 15 khi đang chọn Fast Track.
- **Nguyên nhân:** dải Tổng quan dùng chỉ số "gộp hai khung" (`web/src/modules/worklist/KhoiCanQuyet.tsx:22-23` chú thích, `:33` `phamVi = { branchId }` không có khung); Báo cáo lọc khung + lượt trong kỳ.
- **Phương án:** một tên "bài trễ chấm" cho mọi nơi; ghi phạm vi ngay sau số ("trong kỳ" / "tới hôm nay"); dải Tổng quan theo khung đang chọn.

### A5-05 "⚠ 28 bài quá hạn · 3 GV" nhưng bảng 4 dòng — XÁC NHẬN-ẢNH (ảnh 9) · **P2** · QL
- **Nguyên nhân:** chữ phụ đếm dòng có `gvId` (`BaoCao.tsx:87`); dòng "Speaking chấm chéo" không gắn người (`baoCao.ts:98`).
- **Phương án:** "28 bài · 3 GV + chấm chéo S"; dòng chấm chéo ghi "Speaking chấm chéo · chưa ai nhận", bấm mở danh sách bài S.
- **Lệch mockup:** khung 3 không có dòng chấm chéo — có lý do (chấm chéo S chốt 18/10, đặc tả OV-14 mục 0, sau mockup).

### A5-06 Tutor mở ra trang rỗng; chip đếm chồng nhau — XÁC NHẬN-ẢNH (ảnh 2) · **P1** · Head tutor, QT, QL
- **Bằng chứng:** `a5-L-tu-qt.png`, `a5-tu-ht.png` (Head tutor, trang duy nhất của vai), `a5-tu-ql--t.txt` (QL "Cần chú ý 0 · Đang dạy 0 · Tất cả 3"), `a5-375-tu.png`. Chip QT: 0 + 0 + 1 + 1 ≠ Tất cả 8.
- **Nguyên nhân:** (thiết kế) đặc tả Tutor §7 "mặc định Cần chú ý nếu > 0, không thì Đang dạy"; "Đang dạy" = có buổi **trong khoảng 2 tuần**; các lọc chồng nhau (`web/src/modules/tutor/TutorPage.tsx:21-27, 58`). (dữ liệu) buổi tutor demo mang ngày ghi thật 20/10 (`case_followups.created_at` qua `updateResult` ở `server/src/seed/pb2bSeed.ts:187`) — sau ngày demo 14/09 → mọi khoảng quá khứ 0 buổi; demo chỉ 2 buổi, 1 tên gõ tay (đặc tả §9 hứa "vài buổi Không, vài đánh giá, 2–3 tên gõ tay").
- **Ảnh hưởng:** Head tutor mở trang không thấy ai; phải đoán bấm "Tất cả" hoặc đổi thời gian (+1–4 bấm).
- **Phương án:** Đang dạy = 0 → mặc định "Tất cả"; tách "Cần chú ý" (công tắc riêng) khỏi nhóm trạng thái (Đang dạy · Ngừng · Thiếu thông tin · Tất cả); câu rỗng kèm nút "Xem tất cả tutor"; seed buổi theo ngày demo. Rule UX-79 Empty States.

### A5-07 Panel số của Báo cáo chỉ là danh sách tên (trái chốt C26) — PHÁT HIỆN · **P1** · QL, QT
- **Bằng chứng:** "17 HV đã thi" → tên + lớp (`a5-bc-pn-hvdathi--t.txt`); "SOS 2 · Cả Monbay" → 3 tên (`a5-bc-pn-sos--t.txt`); "10 PA có kết quả" → không kết quả (`a5-bc-pn-pakq--t.txt`); "28 bài" → 28 dòng "Nhập điểm · tên · MT1 · R", mở dòng chỉ "MB FT 101 · W1 SEP · Xem hồ sơ ↗" — không GV, không số ngày trễ, QL không có nút làm (`a5-bc-pn-quahan--mo-dong.png`, `a5-ql-pn-quahan--mo.png`); bấm số của dòng "Trần Ngọc Hà" → tiêu đề "7 bài — quá hạn chấm", **mất tên GV**.
- **Nguyên nhân:** dùng panel số chung (`NganDanhSach`, dòng `rowsFor`) thay mẫu "kết quả cụ thể"; máy chủ ghi đè tiêu đề (`baoCao.ts:152`). C26 chốt "điểm gì · của ai · đợt · kết quả; mở hàng em làm tại chỗ".
- **Ảnh hưởng:** giao ban hỏi "em nào, mấy điểm, ai trễ bao lâu" → mở từng hồ sơ (1 chuyển trang mỗi em).
- **Phương án:** một mẫu bảng nhỏ cho mọi panel của Báo cáo: Học viên · Lớp · Đợt · OVR / điểm · Kết quả · Việc tiếp; bài trễ nhóm theo GV · lớp · đợt, có số ngày trễ, nút "Mở lưới" đúng lớp-đợt; giữ tên GV ở tiêu đề.
- **Lệch mockup:** ov14-3 "Panel từ số 23 Chưa đạt" (Kỹ năng cần cải thiện, nút Lập PA / Mở Case, Mở bảng điểm) — không thấy lý do ghi lại.

### A5-08 "Thôi học" ở Kết quả thi › Thi thật lưu ngay, không Hoàn tác — PHÁT HIỆN (mã) · **P1** · QL, QT, TVV
- **Vấn đề:** menu Bước tiếp trên hàng: Tạm dừng / Thôi học / Chưa chọn **lưu ngay** (`KetQuaThi.tsx:197-205, 212-216`); "Thôi học" đổi trạng thái em sang Kết thúc học (`server/src/loTrinh/buocTiep.ts:226-227`); thông báo "Đã lưu · {tên}" không có Hoàn tác — muốn sửa phải mở lại menu, chọn "Chưa chọn".
- **Nguyên nhân:** mockup 6 khung 6 chốt "chọn ngay trên hàng, lưu ngay" — bám đúng; thiếu đường sửa nhanh.
- **Phương án (không thêm bước):** toast có "Hoàn tác" (mẫu `toast.hoanTac` đã dùng ở Gộp tên tutor) gọi `DELETE /cycles/:id/buoc-tiep`; mục "Thôi học" màu nguy hiểm, có vạch tách. Rule undo-support, destructive-emphasis.
- **CẦN ẢNH:** demo không có kết quả thi thật (Phần 4).

### A5-09 Ô Chi nhánh tách khỏi hàng lọc — XÁC NHẬN-ẢNH (ảnh 9) · **P2** · QT, CX
- **Bằng chứng:** `a5-L-bc-mb-p1.png`: nhãn "Chi nhánh" nằm trên ô, góc phải, trên hàng tab (y ≈ 125–175); FT / Lớp thường, Khoảng thời gian, Lớp nằm dưới tab (y ≈ 260). 375: ô chi nhánh chiếm 2 dòng đầu (`a5-L-375-bc-p1`).
- **Nguyên nhân:** `PhanTichPage.tsx:24-29` đặt `BranchFilter` (`web/src/ui/Filters.tsx:249-256`, nhãn trên ô) ở đầu trang.
- **Phương án:** dời vào hàng lọc dạng ô gọn "Chi nhánh · Monbay ▾" như mockup; QL một chi nhánh: chữ "Monbay" tĩnh trong hàng đó.
- **Lệch mockup:** ov14-3 khung 4, 4c và ov14-6 khung 6 đều đặt Chi nhánh là ô đầu của thanh lọc — không lý do.

### A5-10 Kết quả thi mất công tắc FT / Lớp thường và không nói "Fast Track" — XÁC NHẬN-ẢNH (ảnh 10) · **P2** · QL, QT
- **Bằng chứng:** `a5-L-kq-mb-p1.png`; `web/src/modules/phanTich/PhanTich.tsx:86` (`coCt` = false). Đang ở "Lớp thường" (tab Test) bấm sang Kết quả thi → công tắc biến mất, bảng hiện Mock FT, không chữ nào báo đổi khung.
- **Nguyên nhân:** mockup 6 bỏ Progress / Final khỏi bảng này (có lý do); thiếu nhãn ngữ cảnh.
- **Phương án:** giữ chỗ công tắc, hiện chữ cố định "Fast Track" + ⓘ "Lớp thường xem ở tab Test". Xem thêm A5-22.

### A5-11 Phân tích GV: chữ hướng dẫn dài, 60 % ô không có số, lệch khung 4c — XÁC NHẬN-ẢNH (ảnh 11) · **P2** · QL, QT, Admin
- **Bằng chứng:** `a5-L-gv-mb.png`: câu "7 giáo viên … rê chuột hoặc Tab vào tên cột gạch chấm để xem cách tính" + dòng chú giải 5 mục (`PhanTichGiaoVien.tsx:103-117`); 42 / 70 ô số là "—" hoặc "không có", ~10 ô "mẫu nhỏ".
- **Nguyên nhân:** PR #462 "giữ bảng" cũ (5 cột môn cố định L R W1 W2 S, môn không dạy ghi "—").
- **Phương án:** theo khung 4c: một ô "Kết quả môn dạy" chỉ liệt kê môn GV dạy, "Chấm đúng hạn" kèm "⚠ n bài quá hạn" (bấm → panel chấm trễ, A5-17), "Theo dõi và xử lý" gộp Kết quả PA + Vi phạm, nút Xuất Excel; chú giải vào ⓘ; "mẫu nhỏ" thành dấu nhỏ có title.
- **Lệch mockup:** ov14-3 khung 4c — lý do chỉ "giữ chiều sâu bảng cũ" (plan OV-15e ý 5), không nói bỏ bố cục, Xuất Excel, chip lọc trong panel kết quả.

### A5-12 "—" / "không có" / "chưa có" / "mẫu nhỏ" / "0" — XÁC NHẬN-ẢNH (ảnh 10, 11) · **P2**
- **Bằng chứng:** một hàng Kết quả thi (Hồ Gia Hân): OVR "—" (chưa tính được), W "chưa có", SOS "—" (không có), Case / PA "—"; Phân tích GV "—" = không áp dụng, "không có" = có áp dụng nhưng chưa có mục; Tutor "—" = chưa có buổi; Báo cáo dùng "0".
- **Phương án:** một bộ chữ toàn web: "—" chỉ = không áp dụng; "chưa có" = thiếu dữ liệu; 0 = đếm được bằng 0; bỏ "không có". Rule compact-label-semantics.

### A5-13 Hộp thời gian che mất "Tùy chọn" — PHÁT HIỆN · **P2** · mọi vai
- **Bằng chứng:** `a5-L-tg--hop.png` chỉ thấy "2 tuần vừa qua · Theo tuần · Theo tháng"; nhóm nút rộng 418 px trong khung 334 px (đo); chọn Tùy chọn thì "2 tuần vừa qua" bị cắt (`a5-bc-tg2--tuychon.png`).
- **Nguyên nhân:** hộp 360 px (`web/src/modules/phanTich/BoChonThoiGian.tsx:57`) + `BoLocDoan` `sm:overflow-x-auto` (`web/src/ui/ui.tsx:534`).
- **Phương án:** hộp 440 px hoặc 4 nút xếp 2 × 2. Rule UX-115 Chip Collection Reflow.

### A5-14 Phân tích GV chỉ nhận 13 tuần, bộ chọn chung cho 52 — PHÁT HIỆN · **P2**
- **Bằng chứng:** `a5-gv-20tuan--t.txt`: "Khoảng tối đa 13 tuần." + nút "Thử lại" (thử lại vẫn lỗi). Khoảng giữ khi đổi tab → xem 20 tuần ở Test + SOS rồi sang Phân tích GV là gặp lỗi.
- **Phương án:** tab GV tự lấy 13 tuần cuối của khoảng + một dòng "đang xem 13 tuần cuối"; bỏ nút "Thử lại" ở lỗi không thử lại được. Rule error-recovery.

### A5-15 Quay lại không mở lại panel — PHÁT HIỆN · **P2** · QL, QT
- **Bằng chứng:** Báo cáo › "4 Chưa đạt" → panel → bấm tên em → Quay lại: panel đóng (`a5-L-bc-pn-mock`, URL còn `?cn=1`); Phân tích GV › panel Chấm đúng hạn → tên em → Quay lại: đóng (`a5-L-gv-pn-back`). Panel số chung thì giữ được, mở đúng dòng (`a5-L-bc-pn-quahan`: `so-lieu=…&dong=1511`).
- **Nguyên nhân:** `moMock` (`BaoCao.tsx:45`), `chamDiem` / `moO` (`PhanTichGiaoVien.tsx:89-90`), `mo` của Tutor (`TutorPage.tsx:42`) giữ trong state, không trên URL.
- **Phương án:** dùng `useMoSoLieu` / `useThamSoUrl` như panel số. Rule state-preservation, UX-4 Back Button.

### A5-16 Panel Kết quả Mock trong Báo cáo phải cuộn ngang — PHÁT HIỆN · **P2** · QL
- **Bằng chứng:** `a5-L-bc-pn-mock--pn.png`: bảng tối thiểu 1 180 px trong panel 720 px; Kỳ vọng, Kết quả, SOS, Case / PA, Việc tiếp nằm ngoài khung.
- **Phương án:** trong panel dùng cột rút gọn (Học viên · Đợt · OVR / Kỳ vọng · Kỹ năng chưa đạt · Việc tiếp) như mockup 3, hoặc panel rộng toàn màn. Rule UX-71 Table Handling.

### A5-17 QL tìm GV chấm trễ: link ra Lịch Test không lọc — PHÁT HIỆN · **P2** · QL
- **Bằng chứng:** panel "Chấm đúng hạn · {GV}" có hạn + số ngày trễ (tốt) → "Mở Lịch Test / Chấm Test ›" → `/test/lich` tuần này, khối "Test quá hạn chấm 58" đang gập (`a5-ql-gv-cham--lich.png`); panel từ Báo cáo không có link mở lưới.
- **Phương án:** link sâu mở đúng lớp · đợt · kỹ năng; hoặc nhập điểm trong panel theo quyền (C30 "làm tại chỗ theo quyền").

### A5-18 In báo cáo bỏ dòng ngoài trang 1, thiếu "Dữ liệu đến" — PHÁT HIỆN (mã + ảnh in) · **P2** · QL
- **Bằng chứng:** `a5-bc-in--in.png`, `a5-bc-in--in.pdf` (1 trang A4 ngang, nền sáng — tốt). Thanh trang ẩn khi in (`web/src/ui/PhanTrang.tsx:41, 52`) nhưng bảng vẫn chỉ vẽ 10 dòng đang xem (`BaoCao.tsx:97, 126`) → "Quá hạn theo GV" / "SOS theo lớp" > 10 dòng in thiếu, không báo. Dòng "Dữ liệu đến" ở đầu trang bị `print:hidden`; gạch chấm dưới số vẫn in.
- **Phương án:** khi in vẽ đủ dòng; thêm "Dữ liệu đến 14/09/2026 · in lúc …"; bỏ gạch chấm khi in.

### A5-19 Số nào bấm được không rõ; số lớn không bấm — PHÁT HIỆN · **P2**
- **Bằng chứng:** `a5-L-bc-mb-p1.png`: "12 chưa điểm" (không bấm) / "53 bài" (bấm); "13 Case chưa chốt PA" / "19 Case"; "⚠ 4 quá hạn" / "3 · 1". Kiểu bấm = gạch chấm mờ.
- **Phương án:** số lớn cũng bấm (mở tập HV); mọi số bấm được dùng một kiểu như mockup (ô viền).
- **Lệch mockup:** ov14-3 khung 3, 4, 4c; tutor m2 — số bấm được nằm trong ô viền, SOS là chip màu; không thấy lý do ghi lại.

### A5-20 375: Test + SOS cuộn ngang 17 cột; hàng tab che 2 tab; thanh dưới 6 mục — PHÁT HIỆN · **P2** · QL điện thoại
- **Bằng chứng:** `a5-L-375-th.png` (thấy 3 / 17 cột số); hàng tab chỉ thấy "Báo cáo · Test + SOS · Kết quả thi · Hiệu quả P…" (`a5-L-375-bc-p1`); thanh dưới Tổng quan · Học viên · Test · Phân tích · Công việc · Tutor = 6 mục.
- **Phương án:** thẻ lớp như mockup 4 "375 · thẻ lớp"; hàng tab 375 thành ô chọn; Tutor của QL vào menu Tài khoản ở 375. Rule bottom-nav-limit (≤ 5).
- **Lệch mockup:** ov14-3 khung 4 (375 thẻ lớp) — không lý do.

### A5-21 Hiệu quả PA mặc định 2 tuần gần như trống — PHÁT HIỆN · **P2** · QL, QT
- **Bằng chứng:** `a5-pt-pa-mb--t.txt`: 2 PA, nằm trong hàng gập "2 vấn đề khác"; 8 tuần: 10 PA, vẫn một hàng gập (`a5-pa-8tuan-p1.png`); câu rỗng "thử khoảng thời gian dài hơn" không có nút.
- **Phương án:** bảng chỉ có hàng gập → mở sẵn; câu rỗng có nút "Xem 8 tuần" (một bấm). Rule UX-79 Empty States.

### A5-22 Lớp thường: Báo cáo không có khối kết quả — PHÁT HIỆN · **P2** · QL
- **Bằng chứng:** `a5-pt-bc-mb-thuong.png`: chỉ Test (đã thi / chấm / quá hạn), HV cần chú ý, Case / PA; không Đạt / Chưa đạt Progress, Final; Kết quả thi chỉ FT (mockup 6).
- **Phương án:** câu hỏi chủ SP (Phần 4, Q2).

### A5-23 Quản trị › Tài khoản: Tạo một panel, Sửa hai đường — PHÁT HIỆN · **P2** · QT
- **Bằng chứng:** `a5-qt-tao--panel.png` (tên, email, mật khẩu, SĐT, vai, kỹ năng — không có quyền riêng); `a5-L-qt-sua--panel.png` (vai, kỹ năng, quyền riêng, mật khẩu — không có tên / email); `a5-qt-menu--suatt.png` (⋯ › Sửa thông tin: tên, email, SĐT). Mã `AccountsAdmin.tsx:387, 578, 634`.
- **Ảnh hưởng:** đổi email + vai = 2 panel, 2 lần Lưu; cấp quyền riêng cho người mới = tạo xong, tìm lại, Sửa.
- **Phương án:** một panel "Tài khoản" cho Tạo và Sửa: khối Thông tin · Vai trò · Kỹ năng · Quyền riêng (gập) · Mật khẩu; ⋯ chỉ còn Xoá.

### A5-24 Quản trị › Quyền & nhật ký dài 5 248 px — PHÁT HIỆN · **P2** · QT
- **Bằng chứng:** `a5-qt-cfg-p1…p5`; 375: 12 375 px (~15 màn, `a5-375-qt-cfg`). Bốn ô số Học viên 130 · Lớp 30 · Lượt Mock 302 · Case SOS 80 (không bấm, không liên quan quyền, "Case SOS" là tên cũ); thẻ "Đơn vị báo cáo" 6 dòng bị kéo cao theo nhật ký 40 mục (trống ~2 000 px, `a5-qt-cfg-p4`); nhật ký không lọc, không phân trang; đoạn giải thích 9 dòng (`AdminPage.tsx:329-347`).
- **Phương án:** ba tab con Quyền · Nhật ký · Đơn vị; bỏ 4 ô số; nhật ký lọc theo người / loại + phân trang; giải thích vào ⓘ.

### A5-25 Demo thiếu dữ liệu để rà khu vực này — PHÁT HIỆN (dữ liệu) · **P2** cho đợt rà
- Không có kết quả thi thật (Thi thật luôn "0 lượt", kể cả 6 tháng — `a5-kq-tt-rong`); buổi tutor 2 dòng, ngày 20/10; "PA theo quy chế 0" mọi khoảng. Chủ SP không thể xem các màn này đầy đủ.
- **Phương án:** seed dùng ngày demo cho `created_at` buổi tutor; thêm vài lượt thi thật (có / không đạt Target, một em "Không thi").

### A5-26 Gộp tên gõ tay: hộp Thêm chồng lên hộp Gộp — PHÁT HIỆN · **P3** · Head tutor, QT
- **Bằng chứng:** `a5-L-tu-gop--chong.png`; `TutorPage.tsx:199-202` vẽ cả hai, `HopTutor` `z-[60]`.
- **Phương án:** chọn "+ Thêm vào danh sách" mở 2 ô Kỹ năng / Nơi dạy ngay dưới dòng (tên điền sẵn) — không hộp thứ hai. (Mockup m5 ghi "mở hộp Thêm" — đề xuất lệch nhỏ.)

### A5-27 Tutor 375 + bảng: chữ vụn — PHÁT HIỆN · **P3**
- "— · S" khi thiếu nơi dạy, "Tài liệu đúng / hạn" xuống dòng, "Buổi · Đánh giá 0 · —" (`a5-L-375-tu-tatca-p1`); mockup m7 dùng "Tài liệu".

### A5-28 TVV / CX thấy bảng "Quá hạn theo GV" (tên GV) — PHÁT HIỆN · **P3** · TVV, CX
- `a5-cx-pt--t.txt`, `a5-tvv-pt`; mockup vai §5 "CX không xem GV". → Q5.

### A5-29 "So kỳ trước" hai kiểu — PHÁT HIỆN · **P3**
- Báo cáo "Tăng 1 HV" (chữ) ↔ Ý thức "↑24" đỏ (`YThucPhoiHop.tsx:77-81`, `dungChung.tsx:64`); mockup 4 chốt chữ trung tính, không mũi tên, không màu.

### A5-30 Quản trị: chi tiết vụn — PHÁT HIỆN · **P3** · QT
- Kỹ năng "Listening, Reading, Writing Task 2" (nơi khác "L · R · W2"); lọc kỹ năng "W" gộp W1 + W2; chi nhánh ghi mã (MB, BC) trong form, tên trong bảng; sắp tên để "Đào, Đặng, Đỗ" sau "Vũ"; dấu ✓ đè lên chip kế bên (`a5-L-qt-sua--panel.png`); phụ đề "Tài khoản, danh mục và cấu hình quyền" ≠ tên tab "Chương trình", "Quyền & nhật ký"; không có chỗ thêm / sửa chi nhánh (chỉ đọc trong "Đơn vị báo cáo") → Q6.

### A5-31 Chuyển hướng im lặng — PHÁT HIỆN · **P3**
- Admin VP mở `/quan-tri` → về `/` không lời nào (`a5-ad-qt`); TVV mở `?goc=y-thuc` → hiện Báo cáo, URL vẫn `y-thuc`. Rule empty-nav-state.

### A5-32 Tải danh sách tutor: dòng giải thích dài, chữ dính mép — PHÁT HIỆN · **P3**
- Câu "Cột: Tên · SĐT · Nơi dạy (…) · Kỹ năng (…). Bắt buộc … Tối đa 500 dòng." 2 dòng (`web/src/modules/tutor/TaiDanhSach.tsx:110`, trái luật chữ ngắn); "1 dòng lỗi chưa lưu" sát mép trái panel (`a5-L-tu-tai--xem-truoc.png`). Phần xem trước tốt (tự lọc Lỗi, sửa tại ô, lý do rõ).

### A5-33 Hàng tab không có phím mũi tên — PHÁT HIỆN · **P3** · Sam
- `web/src/ui/HangTab.tsx:34-50` có `role="tab"` nhưng chỉ nhận bấm; Tab đi qua từng tab (Tab 18 lần mới tới "Phân tích GV", `a5-kb-pt`). Có link "Bỏ qua tới nội dung" (`App.tsx:186`) — tốt. Rule UX-41 Keyboard Navigation.

### A5-34 Tutor: nút chính là "Tải danh sách" — XÁC NHẬN-ẢNH (ảnh 2) · **P3**
- Đúng mockup tutor m2 (`btn-primary`) nên không phải lỗi triển khai; nhưng việc hằng ngày của Head tutor là đọc + kết luận, tải danh sách hiếm. → Q3.

### A5-35 "Báo cáo" trùng tên "Báo cáo đơn vị" — PHÁT HIỆN · **P3**
- Phân tích › Báo cáo (học tập 2 tuần) ↔ Công việc › Báo cáo đơn vị (tuần / tháng) ↔ Quản trị "Đơn vị báo cáo". Chủ SP chốt tên "Báo cáo" (đặc tả OV-14 mục 6) → chỉ nêu để biết.

### A5-36 Báo cáo kỳ cũ vẫn in số "hiện tại" — PHÁT HIỆN · **P3** · QL
- Báo cáo W1+W2 JUN vẫn hiện "HV cần chú ý · tại 14/09" và "Case / PA · tại 14/09" (`a5-bc-jun--t.txt`) — có ghi "tại", nhưng in ra dễ hiểu nhầm là số của tháng 6. Đề xuất: kỳ đã qua thì gập hai khối này hoặc ghi "số hôm nay, không phải của kỳ".

### A5-37 "2 chưa lịch Test" (Báo cáo) vs 3 (Tổng quan) — GIẢ THUYẾT (không tái hiện)
- Lúc rà cả hai = 3 (`a5-pt-bc-mb--t.txt`, `a5-tq-qt-mb--t.txt`), cùng chỉ số `hv-ft-xong-mt-cuoi-chua-mt-ke` (`baoCao.ts:132`, `bangChiNhanh.ts:219`). Giả thuyết: hai ảnh chụp ở hai thời điểm dữ liệu khác nhau, hoặc khác khung. Cách kiểm: chụp liền hai trang, cùng vai QT · Monbay · FT. Lưu ý thêm: CX "Tất cả chi nhánh" thấy 0 còn QT thấy 3 — số đổi theo vai mà nhãn không nói.

### Đối chiếu mockup (tóm tắt)

| Mockup / khung | Màn thật | Khác | Lý do ghi lại? |
|---|---|---|---|
| ov14-3 khung 3 Báo cáo | Phân tích › Báo cáo | Trang riêng "Báo cáo tuần" → tab đầu Phân tích | Có (plan OV-15 §7; PR #462) |
| | | Đầu trang 1 hàng (tên · chi nhánh · khung · kỳ · Dữ liệu đến · In) → 4 hàng | Không |
| | | Ô số viền + chip SOS màu + ✓ / ✗ cạnh Đạt → số gạch chấm, SOS số trơn | Không |
| | | Panel "Chưa đạt" có kỹ năng hụt + nút Lập PA / Mở Case → bảng Mock cuộn ngang; các panel khác chỉ tên | Không |
| | | Thêm dòng "Speaking chấm chéo" | Có (chấm chéo S, sau mockup) |
| ov14-3 khung 4 Test + SOS | Test + SOS | Chi nhánh ra khỏi hàng lọc; "Xếp theo" mặc định Lớp → Tuần; thiếu "Đạt kỳ vọng n/m %", "So 8 tuần trước"; Xuất Excel vào ⋯; 375 thẻ lớp → bảng cuộn ngang | Một phần (⋯ theo PR-HK2 cũ); còn lại không |
| ov14-3 4b + ov14-6 khung 6 Kết quả thi | Kết quả thi | Theo mockup 6 (Mock / Thi thật, cột) ✓; "Xếp theo" nút đoạn → ô chọn; Chi nhánh không trong hàng lọc | Mockup 6 thắng 4b ✓ |
| ov14-3 khung 4c Phân tích GV | Phân tích GV | Giữ bảng cũ; không "⚠ n bài quá hạn", không Xuất Excel, panel không chip lọc; thêm câu + chú giải dài | Một phần ("giữ chiều sâu bảng cũ") |
| ov14-6 khung 7 Phân trang | mọi bảng | Đúng (10 / 20 / 50, đầu + cuối) ✓ — nhưng In bỏ dòng (A5-18) | — |
| tutor m2–m7 | Tutor | Gần đúng; bộ chọn thời gian to (mockup chip gọn); Kết luận chữ trơn (mockup chip màu); bỏ ⚠ ở "Cần chú ý vì" (G-4, ghi trong mã); thêm "Thiếu thông tin" (chủ SP 20/10) | Phần lớn có |
| vai-tvv-admin-cx §6 | Phân tích theo vai | TVV / CX không Ý thức ✓; Admin giữ Phân tích GV ✓; CX vẫn thấy tên GV ở Báo cáo | Không |

---

## Phần 3. Đề xuất lớn

**Workflow thật (đếm trên demo):**

| Việc (vai) | Trước | Sau (đề xuất) |
|---|---|---|
| QL làm báo cáo 2 tuần + in (QL 2) | Tổng quan → "Báo cáo ›" → In → In: **3 bấm, 1 chuyển trang** (mặc định đúng 2 tuần). Thêm Lớp thường: +3 bấm, tờ thứ hai. Giải thích một số: bấm số → chỉ tên → mở hồ sơ từng em (+1 chuyển trang mỗi em). Rủi ro số sai (A5-01, 02), lệch Tổng quan (A5-03, 04), in thiếu dòng (A5-18). | 3 bấm; panel có điểm / kết quả → **0 chuyển trang** khi giải thích; "In" in cả FT + Lớp thường một lần (2 phần) → 3 bấm thay 6. |
| QT so sánh chi nhánh (QT 1) | Báo cáo: đổi ô chi nhánh 5 lần (**10 bấm, 5 màn, nhớ số**); chỉ Test + SOS có "Xếp theo · Chi nhánh" (2 bấm); Kết quả thi, Hiệu quả PA, Ý thức không so được; Phân tích GV bắt chọn một chi nhánh. | Báo cáo khi "Tất cả chi nhánh" thêm bảng "Theo chi nhánh" (một dòng mỗi chi nhánh, cùng 6 số): **1 bấm, 0 nhớ**. |
| QL tìm GV chấm trễ → xem bài trễ (QL 2) | Đường Báo cáo: Phân tích → số của GV → panel (mất tên GV, không ngày trễ) → mở dòng → Xem hồ sơ: **4 bấm, 2 chuyển trang**. Đường Phân tích GV: tab → "9/22" → panel (có ngày trễ) → Mở Lịch Test (không lọc) → mở khối quá hạn → cuộn tìm lớp: **5+ bấm, 2 chuyển trang, nhớ lớp / đợt**. | Một panel "Chấm trễ · {GV}" cho cả hai đường: nhóm lớp · đợt · kỹ năng, số ngày trễ, nút "Mở lưới" đúng lớp-đợt: **3 bấm, 1 chuyển trang, 0 nhớ**. |
| Head tutor đánh giá + kết luận (25) | Trang rỗng → "Tất cả" (1; hoặc đổi thời gian 3–4) → tên (1) → Kết luận (1) → gõ → Lưu (1) → Đóng (1) → tutor kế (1): **5–9 bấm tutor đầu, 4 bấm mỗi tutor sau**. | Mặc định có danh sách; sau Lưu tự mở tutor "Cần chú ý" kế (như panel số đã làm): **3 bấm + gõ mỗi tutor**. |
| QT tạo tài khoản GV + cấp quyền riêng (QT 1) | + Tạo (1) → gõ 4 ô → chi nhánh (1) → kỹ năng (1–5) → Lưu (1); quyền riêng: gõ tìm → Sửa (1) → mở nhóm (1) → tích (1) → phạm vi (1) → gõ lý do → Lưu (1): **10–14 bấm, 2 panel, 2 lần Lưu**. | Một panel Tạo có khối "Quyền riêng" gập: **6–10 bấm, 1 panel, 1 lần Lưu**. |

### 3.1 Một nguồn số cho Phân tích (A5-01, 02, 03, 04, 05, 37)
- **Hiện trạng:** cùng bộ lọc, Báo cáo / Test + SOS / Kết quả thi / Tổng quan cho số khác nhau; hai lỗi dữ liệu (Theo tháng, PA trong kỳ).
- **Đề xuất:** sửa 2 lỗi; một bảng định nghĩa (SOS hiện tại vs trong kỳ; HV vs lượt; Đạt = OVR ≥ kỳ vọng; Chưa đủ điểm; SOS tạm); mọi ô số ghi đơn vị + thời điểm ngắn ("HV · trong kỳ", "lượt", "hôm nay"); một tên "bài trễ chấm".
- **Bước:** không đổi số bước; bỏ việc đối chiếu 3 tab khi giao ban.
- **Rủi ro:** số quen thuộc đổi; cần phép kiểm "cùng tập" giữa các tab.
- **Chủ SP quyết:** SOS ở Báo cáo đếm theo HV (hiện nay) hay theo lượt (cho khớp Kết quả thi)?

### 3.2 Khung Phân tích gọn + panel "kết quả cụ thể" (A5-07, 09, 10, 15, 16, 19, 20)
- **Hiện trạng:** 4 hàng điều khiển trước nội dung; Chi nhánh tách chỗ; panel số chỉ tên; Quay lại mất panel.
- **Đề xuất:** một hàng lọc dính dưới tab: Chi nhánh · Chương trình (Kết quả thi hiện "Fast Track" cố định) · Khoảng thời gian · Lớp; tiêu đề Báo cáo gộp "Báo cáo · kỳ · chi nhánh · khung · Dữ liệu đến · In" một dòng như mockup 3; một mẫu panel bảng nhỏ cho mọi số (điểm · đợt · kết quả · việc tiếp + nút làm theo quyền), panel nằm trên URL; số bấm được dùng ô viền như mockup; 375 Test + SOS dạng thẻ lớp.
- **Bước:** giải thích một số trong giao ban từ 1 bấm + 1 chuyển trang mỗi em → 1 bấm, 0 chuyển trang.
- **Rủi ro:** nhiều tab chạm cùng lúc; đổi kiểu số bấm được là thay đổi hệ thiết kế (có mockup duyệt sẵn nên không cần mockup mới).
- **Chủ SP quyết:** đồng ý quay lại kiểu ô số viền của mockup?

### 3.3 Phân tích GV theo khung 4c + panel chấm trễ dùng chung (A5-11, 14, 17)
- **Hiện trạng:** bảng cũ 11 cột số, 60 % ô trống; link ra Lịch Test không lọc; giới hạn 13 tuần báo lỗi muộn.
- **Đề xuất:** bố cục 4c; "⚠ n bài quá hạn" mở panel "Chấm trễ · GV" (dùng chung với Báo cáo); Xuất Excel; tự lấy 13 tuần cuối.
- **Bước:** việc "QL tìm GV chấm trễ" 5+ bấm, 2 chuyển trang → 3 bấm, 1 chuyển trang.
- **Rủi ro:** bỏ cột cố định L R W1 W2 S làm khó so hai GV cùng môn → giữ "Xếp theo môn" nếu cần.
- **Chủ SP quyết:** làm theo 4c (đã duyệt) hay giữ bảng cũ (PR #462)?

### 3.4 Tutor có nội dung khi mở + "tutor kế" (A5-06, 26, 34)
- **Đề xuất:** mặc định "Tất cả" khi không ai "Cần chú ý" và không ai "Đang dạy"; "Cần chú ý" là công tắc riêng; sau "Lưu nhận xét" mở tutor cần chú ý kế; Gộp + Thêm trong một dòng; "Thêm tutor" là nút chính, "Tải danh sách" nút phụ.
- **Bước:** 5–9 → 3 bấm cho tutor đầu.
- **Rủi ro:** khác luật mặc định trong đặc tả §7 và mockup m2 (nút chính).
- **Chủ SP quyết:** Q3.

### 3.5 Quản trị: một panel tài khoản + tab con cho quyền (A5-23, 24, 30)
- **Đề xuất:** gộp Tạo / Sửa / Sửa thông tin thành một panel; tab "Quyền & nhật ký" tách 3 tab con, bỏ 4 ô số, nhật ký có lọc + phân trang; chữ giải thích vào ⓘ.
- **Bước:** 10–14 bấm, 2 panel → 6–10 bấm, 1 panel.
- **Rủi ro:** form dài hơn khi tạo → khối Quyền riêng gập mặc định.
- **Chủ SP quyết:** có cần màn thêm / sửa chi nhánh không (Q6)?

---

## Phần 4. Câu hỏi cho chủ SP + ảnh cần thêm

**Câu hỏi (mỗi câu một khuyến nghị):**
1. Báo cáo › SOS theo lớp: đếm **HV trong kỳ** (hiện tại) hay **lượt** (khớp Kết quả thi)? Khuyến nghị: giữ HV, ghi nhãn "HV · trong kỳ"; Kết quả thi ghi riêng SOS của lượt chưa đủ điểm.
2. Kết quả thi chỉ Fast Track (mockup 6). Lớp thường xem Đạt / Chưa đạt Progress, Final ở đâu? Báo cáo Lớp thường có cần khối "Kết quả Progress / Final" không? Khuyến nghị: có, một khối giống "Kết quả Mock Test".
3. Tutor: nút chính "Thêm tutor" hay "Tải danh sách" (mockup m2)? Mặc định khi không ai "Cần chú ý": "Tất cả" hay "Đang dạy" (đặc tả §7)? Khuyến nghị: "Thêm tutor" chính; mặc định "Tất cả".
4. "Thôi học" ở Kết quả thi › Thi thật: thêm **Hoàn tác trong thông báo** (không thêm bước) hay hộp xác nhận? Khuyến nghị: Hoàn tác.
5. TVV / CX có cần thấy bảng "Quá hạn theo GV" (tên GV) trong Báo cáo không? Khuyến nghị: ẩn (mockup vai §5).
6. Quản trị: cần thêm / sửa **chi nhánh** trên web không (hiện chỉ đọc)?
7. Phân tích GV: làm theo khung 4c (đã duyệt) hay giữ bảng cũ (PR #462)? Khuyến nghị: 4c.
8. Số bấm được: quay lại kiểu **ô viền** của mockup (hiện là gạch chấm)? Khuyến nghị: có.

**Ảnh cần thêm:**
- Báo cáo **và** Tổng quan chụp liền nhau, vai QT, Monbay, Fast Track, ghi giờ chụp — nếu còn thấy "2 chưa lịch Test" ↔ 3 (A5-37).
- Sau khi seed có kết quả thi thật: Phân tích › Kết quả thi › **Thi thật**, khoảng chứa ngày thi, menu "Chưa chọn ▾" đang mở, và thông báo sau khi chọn "Tạm dừng".
- Sau khi seed buổi tutor đúng ngày demo: trang Tutor của Head tutor lọc "Cần chú ý", panel một tutor sau khi bấm "Lưu nhận xét".
- In thật (PDF hoặc giấy) Báo cáo "Tất cả chi nhánh" khi bảng "Quá hạn theo GV" có > 10 dòng (A5-18).

---

## Phần 5. Ảnh tiêu biểu

1. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\a5\a5-L-thang--chon.png` — hộp chọn "09/2026 · 31/08 – 27/09" (A5-01)
2. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\a5\a5-L-thang--sau.png` — sau Áp dụng ra "08/2026" (A5-01)
3. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\a5\a5-L-bc-mb-p1.png` — Báo cáo: Chi nhánh tách chỗ, "3 GV" / 4 dòng, số lớn không bấm (A5-04, 05, 09, 19)
4. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\a5\a5-L-th-mb.png` — Test + SOS cùng bộ lọc: 16 lượt, Đạt 6, SOS 2 / 3 / 0 (A5-03)
5. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\a5\a5-L-kq-mb-p1.png` — Kết quả thi: 17 lượt, SOS 3: 2, không chữ "Fast Track", "—" / "chưa có" (A5-03, 10, 12)
6. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\a5\a5-L-gv-mb.png` — Phân tích GV: chữ dài, 60 % ô trống (A5-11)
7. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\a5\a5-ql-pn-quahan--mo.png` — panel "7 bài — quá hạn chấm" mất tên GV, không ngày trễ (A5-07)
8. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\a5\a5-L-bc-pn-mock--pn.png` — panel Mock cuộn ngang trong 720 px (A5-16)
9. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\a5\a5-L-tu-qt.png` — Tutor mở ra rỗng, chip 0 + 0 + 1 + 1 ≠ 8 (A5-06)
10. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\a5\a5-L-tg--hop.png` — hộp thời gian che "Tùy chọn" (A5-13)
11. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\a5\a5-L-tu-gop--chong.png` — hộp Thêm chồng hộp Gộp (A5-26)
12. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\a5\a5-qt-cfg-p4.png` — Quyền & nhật ký: thẻ trống kéo dài, nhật ký không lọc (A5-24)
