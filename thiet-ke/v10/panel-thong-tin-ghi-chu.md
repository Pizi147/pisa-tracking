# V10 · Panel có thông tin + bảng em gọn — ghi chú mockup

Mockup: [panel-thong-tin.html](panel-thong-tin.html) (mở qua máy chủ tĩnh `thiet-ke/`, cần `../v5/v5-nen.css` + `../v7/bang-mau-moi.css`).
Đặc tả đã duyệt: `docs/superpowers/specs/2026-10-30-dot-toc-do-panel-design.md` khối 2 + mục 5b ý 2, 4 · luật N30 (`plan.md` 1.6).
Trạng thái: **chờ chủ SP duyệt** — chưa code. Sau duyệt PTA soạn kế hoạch code (máy chủ `rowsFor` + panel chung trước, rồi từng màn).

## Câu hỏi cho chủ SP (5 — mỗi câu có khuyến nghị)

1. **Bỏ màu xanh ✓ trên điểm đạt?** Mẫu dòng chỉ tô kỹ năng HỤT (▼ + đỏ); kỹ năng đạt là số thường, Overall đạt "✓ 7.0" chữ thường.
   Trái luật cũ G12 ("màu kết quả tô mọi điểm", 21/10) — đặc tả 30/10 mới hơn. **Khuyến nghị: đồng ý**, áp cho panel, bảng em hồ sơ lớp và Học viên & Lớp (một luật một nơi).
2. **Chip SOS ở bảng em bỏ "· R, W"?** Cột L R W S đã có ▼ đúng kỹ năng đó. **Khuyến nghị: bỏ ở bảng có cột điểm** (chip nhỏ "SOS 2"); nơi không có cột điểm
   (Công việc, Tổng quan) giữ "SOS 2 · R, W". Bấm chip vẫn mở hộp "Vì sao SOS" có số. Dùng tham số `hienKyNang` sẵn có của `ChipSos`.
3. **Đổi "Cần bổ sung đánh giá" → "PA chưa có kết quả"?** Câu cũ 14 chữ; tên mới khớp nút "Ghi kết quả" (một khái niệm một tên). **Khuyến nghị: đổi** (+ bản Anh).
4. **Xét lại lộ trình — khối "Khi lưu" một dòng + ⓘ** cho mọi lựa chọn? Hậu quả lớn (đổi lớp, đóng khoá) vẫn nằm ở dòng tóm, chi tiết 4 ý trong ⓘ.
   **Khuyến nghị: một dòng + ⓘ cho Học tiếp / Học lại; riêng "Dừng → Kết thúc học" giữ khối đủ** (hậu quả lớn nhất, không đảo được bằng một bấm).
5. **Học viên & Lớp — cột Việc 300 px ở mép phải:** em có > 2 việc của bạn thì hiện 2 nút + "+n việc ›" (mở panel việc của em) hay cho hàng cao thêm?
   **Khuyến nghị: tối đa 2 nút + "+n ›"** — hàng không cao vọt, điểm giữ thẳng hàng.

## Quyết định thiết kế (không cần hỏi — theo đặc tả / luật đã chốt)

- **Một mẫu dòng điểm** (khu A) cho mọi panel có HV, cùng luật với bảng em: tên (link hồ sơ) · lớp chỉ khi tiêu đề chưa có · lý do bên phải │
  lượt · tuần · "tạm" │ L R W S cột 64 px thẳng hàng giữa các dòng (chữ số Inter) │ Overall ✓ / ✗ + mốc so (KV / Target / ngưỡng).
- **Kỹ năng hụt** = dưới kỳ vọng TỪNG kỹ năng của chính lượt (5b ý 2), cùng hàm SOS / `danhGia`; thi thật so Target; lớp thường % từng môn, ▼ môn dưới ngưỡng.
  Dấu ▼ đọc được khi bỏ màu; trình đọc màn hình đọc "R 5.0, dưới kỳ vọng 6.0"; rê số hụt hiện kỳ vọng.
- **Dòng điểm = đúng lượt làm em vào con số** (5b ý 4): SOS → lượt tạo SOS (có thể là MT2 khi MT3 chưa có điểm — dòng ghi một câu phụ); Đạt MT → MT trong kỳ tính %;
  bài quá hạn → bài đó (không có điểm, dòng phụ là lý do).
- 375: dòng điểm hai hàng (lượt + Overall │ 4 kỹ năng chia đều) — vẫn thẳng cột giữa các thẻ.
- Dòng chỉ đọc: tên là link. Dòng có việc người xem làm được: **nút riêng** (Nhập điểm, Ghi kết quả, Thêm PA) — tách nút làm với link hồ sơ (CLAUDE.md "Xử lý tại chỗ").
- Cách tính / giải thích dài → ⓘ ở dòng ngữ cảnh (V6, N30).
- TVV trong bảng em hồ sơ lớp: chữ 12 `text-faint` ngay dưới tên; em chưa có TVV không ghi gì; chip việc (Ý thức, Thiếu bài) cùng hàng sau TVV.

## Từng panel: dữ liệu lấy từ đâu · ƯỚC DÒNG ĐỌC thêm

Quy ước: "ô số" = lần vẽ con số trên trang (không `rows=1`) · "mở panel" = `rows=1`. Ước trên lớp 33 HV / chi nhánh ~600 HV. Hàm trích là hàm **đã có**.

| Panel | Dòng lấy từ đâu (máy chủ hiện có) | Thêm khi vẽ ô số | Thêm khi mở panel |
|---|---|---|---|
| Mẫu dòng (mọi panel HV) | `rowsFor('hoc-vien')` (`worklist/metrics.ts:202`) thêm cờ `kemDiem`: lấy `latestAttempts(ids,'valid')` (`worklist/danhGia.ts:179`, nhớ trong request — `metricSet` vừa gọi thì **0 câu**) + kỳ vọng từng kỹ năng trong `AttemptEval` | **0** | Tổng quan: 0 (đã nạp). Trang khác: ≤ 3 câu (`attemptsNewestFirst` + 1–2 vòng điểm TD7) · ~33 em × ~6 lượt ≈ 200 dòng lượt + ~260 dòng điểm (chi nhánh: chỉ đúng tập ID của panel, không cả chi nhánh) |
| B1 SOS n · lớp | `hv-sos-hien-tai` / SOS lớp → `standingFor` (`students/standing.ts:153`) — lượt tạo SOS có sẵn trong standing | 0 | 0–3 câu như dòng mẫu |
| B2 Đạt MT · lớp | `baoCao.ts:337` — 4 kỹ năng của MT trong kỳ đã có sẵn khi tính % | 0 | **0** (dữ liệu đi cùng `numeratorIds` / `denominatorIds`; tab chỉ chia tập) |
| B3 Bài quá hạn nhập điểm | `overdueScoreBai` (`metrics.ts:711`) đã có `chiTiet` (người chấm, hạn) → `metricResponse` (`metrics.ts:450`) đưa vào dòng | 0 | **0** (bỏ lặp tên; quyền "Nhập điểm" theo `kemViec` sẵn có) |
| B4 Tiến bộ kỹ năng | dữ liệu Phân tích lớp đã nạp; chỉ sửa `NganDanhSach.veDong` (`web/src/ui/SoLieu.tsx:345`) không bỏ `sub` khi có `em` | 0 | 0 |
| B5 Panel một em | `standingFor([id])` + Case mở `chiTietCaseMo` · `ChipSos` nhận `soLieu` (`ui/ChipSos.tsx:15`) | 0 | ≤ 4 câu · < 60 dòng (một em) |
| B6 PA chưa có kết quả | `rowsFor('phuong-an')` + `ghiDuocPaMany` (quyền nút Ghi kết quả) — đã có | 0 | 0 |
| B7 Xét lại lộ trình | `PanelXetLai` đã nạp em + `cuoiKhoaTheoHocVien` (% từng môn) — [đoán: kiểm đường xét lại đã trả % từng môn chưa] | 0 | 0–1 câu (điểm Final của **một lớp**) · ≤ ~150 dòng |
| C Duyệt Công việc QL | chip SOS ở "Chờ bạn duyệt": `standingFor(em của yêu cầu chờ)` · "Lịch sử · n": đếm nhật ký theo yêu cầu | **+2 câu** trên `/my-work` QL (1 `standingFor` ≤ ~20 em ≈ 120 dòng · 1 `COUNT … GROUP BY` ≤ 20 dòng) | mở Lịch sử: 1 câu ≤ ~20 dòng · điểm bối cảnh 0 (dùng standing đã nạp) |
| D Bảng em gọn | điểm + kỳ vọng từng kỹ năng đã có (đang dùng để tô màu ô) — chỉ đổi cách vẽ | 0 | — |
| D TVV dưới tên | `hocVienCuaLop` (`classes/classes.ts:347`): thêm `LEFT JOIN users tv ON tv.id = s.consultant_user_id` + `tv.full_name` vào câu danh sách em đang có | **0 câu**, +0 dòng (thêm 1 cột) | — |
| D2 Học viên & Lớp | chỉ đổi bề rộng / thứ tự cột | 0 | 0 |

**Cảnh báo:** không đường nào vượt ~30 câu / ~2 000 dòng. Thêm đọc duy nhất đáng kể: **C (+2 câu trên `/my-work` của QL)** ≈ +140 dòng / lần mở Công việc
→ ~5 QL × ~30 lần / ngày ≈ **+21 nghìn dòng / ngày** (< 0,3 % mức 8 triệu). Nhẹ hơn nữa (nếu cần): chỉ đếm Lịch sử khi mở panel duyệt, bỏ số "n" trên nút gập → +1 câu.
Mẫu dòng ở trang khác Tổng quan: ≤ 3 câu khi MỞ panel (không khi vẽ ô số), đúng luật đặc tả (≤ ~4).

## Thao tác TRƯỚC → SAU (không mất thao tác)

| Nơi | Trước | Sau | Ghi chú |
|---|---|---|---|
| Panel số (mọi) | dòng "tên · lớp", bấm dòng mở rộng | dòng có điểm + lý do; tên = link hồ sơ; việc làm được = nút riêng; dòng chỉ đọc không mở rộng | mở rộng tại chỗ (Xác nhận PA) giữ cho dòng Case có việc |
| Bài quá hạn | "tên · MT2 · R · …" lặp tên, không người chấm | "MT2 · R · thi W2 OCT · ⚠ quá 6 ngày · Hà chấm" + Nhập điểm / Phân công… | bài vừa lưu giữ chỗ "✓ Đã nhập" |
| Tiến bộ kỹ năng | dòng có em **mất** "Tăng / Giảm" (lỗi) | chip ▲ / ▼ / = / Cải thiện đầu dòng + điểm hai lượt | sửa lỗi, không bớt |
| Cần bổ sung đánh giá | link 14 chữ; cả dòng là link | "3 PA chưa có kết quả ⓘ"; tên link + nút Ghi kết quả | Câu hỏi 3 |
| Xét lại | khối "Khi lưu, web sẽ" 4 dòng | 1 dòng + ⓘ (4 ý) | Câu hỏi 4 |
| Duyệt Công việc QL | chân không dính; Lịch sử không số; dòng chờ duyệt không SOS | chân Từ chối… / Duyệt dính; "Lịch sử · 2 ▸"; chip SOS | Duyệt / Từ chối… / Duyệt nhiều / Yêu cầu tiếp › giữ nguyên |
| Bảng em hồ sơ lớp | mọi ô điểm màu ✓/✗; "SOS 2 · R, W"; "✓ Đạt" viền xanh; lịch thi chip; "mới vào" chip | chỉ kỹ năng hụt ▼ màu; chip SOS nhỏ; Đạt / ngày thi / mới vào chữ thường; TVV dưới tên | GIỮ: Cách xem, lọc, Chọn nhiều, MT link lượt, W1 · W2, vắng, Case + PA (mở dưới hàng), ⋯ (MENU-DONG), Nhập điểm, + Case |
| Học viên & Lớp | cột Việc chiếm phần còn lại (~480 px) giữa bảng | Việc 300 px mép phải; nút gọn một dòng có hạn; việc người khác chữ mờ | Câu hỏi 5; ô tích, Xuất Excel, lọc giữ |

## Xung đột / [XM]

- [XM-1] G12 (21/10) "màu kết quả tô mọi điểm" ↔ đặc tả 30/10 "chỉ tô kỹ năng hụt" — theo đặc tả mới hơn; Câu hỏi 1 để chủ SP xác nhận phạm vi. Nếu đồng ý: sửa `DESIGN.md` G12 (session planning).
- [XM-2] `DiemDong` hiện tô nổi kỹ năng GV phụ trách (hồ sơ GV, chủ SP 23/10). Mẫu mới giữ nghĩa đó ở hồ sơ GV (viền nhấn cho kỹ năng của GV) — không vẽ lại ở đây; kế hoạch code ghi rõ.
- Luật nghiệp vụ không đổi.

## Cổng chất lượng

Critique impeccable (Nielsen /40, hai agent tách: A đánh giá thiết kế · B máy dò + đo trên trình duyệt): **29 → 31 → 33**, không còn P0 / P1.
Luật cổng 28/10: chạm 30 thì tối đa 2 vòng nữa, rồi chỉ cần không P0 / P1 → **đạt** (dừng ở 33, chưa tới 35).

| Vòng | Điểm | Đã sửa |
|---|---:|---|
| 1 | 29 | P1 vùng chạm 375 < 44 px (tên, chip SOS, MT, ⓘ, Lịch sử, chip lọc) · dòng điểm chưa đồng nhất (thiếu Overall ở vài dòng, thẻ 375 bảng em khác mẫu, ✓ Overall lúc có lúc không, chip đầu panel một em lặp kỹ năng) · thiếu khung duyệt nhiều + sau Duyệt · "MT3 · W2" trùng mã tuần · nhãn xếp danh sách dài |
| 2 | 31 | P1 sau Duyệt đầu panel còn "⚠ quá 1 ngày", số chờ duyệt không giảm · ô ghi chú còn sửa được sau duyệt · dữ liệu mẫu lệch giữa các khu |
| 3 | 33 | (không P0 / P1) — sửa tiếp dữ liệu mẫu cho khớp (B4, B1 / B2, ngày ở C, ngày thi B3) |

Máy dò (`impeccable detect`): 5 cảnh báo `side-tab` / `dark-glow` = vạch trái 3 px dải nhóm / dòng đang chọn (luật V18, V21, G14 — hệ thiết kế đã duyệt) và bóng panel v8; 11 gợi ý lệch token nằm ở ghi chú vàng (không lên web).
Đo: mọi chữ ≥ 12 px; tương phản thấp nhất 4,97 : 1 (`.dd .ov` sáng); không tràn ngang ở 375; mọi thứ bấm được ở 375 ≥ 42 px (chip SOS nới vùng chạm bằng `::after`).

Còn lại (P3, không chặn): KV / PA / KCK là viết tắt nghề — giữ; kỳ vọng từng kỹ năng chỉ hiện khi rê / trình đọc màn hình (đúng luật ít chữ V6).
