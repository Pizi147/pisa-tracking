# V3B — Góp ý vòng 3, nhóm II (Phân tích) + III.1 (Tutor) + mở rộng toàn web

Người rà: agent **v3b** (Opus 5.5). Chỉ đánh giá: không sửa repo, không đổi dữ liệu demo, không bấm Lưu / Áp dụng / Xuất.
Web http://localhost:5173 (API 4000), ngày demo **14/09/2026**, mã `main` (worktree `plan-ux-danh-gia`).
NEW = `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad`.
Ảnh: `NEW\anh\v3b\` (≈ 110 tệp, nhật ký `index.jsonl`, kết quả tái hiện lỗi lịch `tg-ket-qua.json`). Spec + script: `NEW\chup\v3b-*.json|mjs`. Số đo DOM bảng: `NEW\do\v3b-do.json` (công cụ `v2b-do-bang.mjs`).
Nhãn: [ĐÃ CHỐT] · [ĐỀ XUẤT] · [ĐÃ KIỂM] · [GIẢ THUYẾT] (+ cách kiểm) · [CẦN ẢNH] · [CẦN DỮ LIỆU]. Mã cũ (A5-xx, A7-xx, X1–X11, 9.2-n, 10.x, 11.1a…, V2A-xx, V2B-x) dẫn tới tài liệu 20/10 — không lặp lại.
Phương pháp: impeccable critique + operate ("mọi thành phần đủ trạng thái", "dáng bấm nhất quán toàn bề mặt"), luật ui-ux-pro-max (`touch-target-size`, `consistency`, `progressive-disclosure`, `state-preservation`, `back-behavior`, `deep-linking`, `empty-states`, `compact-label-overflow`, `Chip Collection Reflow`, `data-table`, `time-scale-clarity`, `drill-down-consistency`, `export-option`), skill dataviz (chọn dạng: bảng ≤ 7 nhóm + thanh một màu, không heatmap khi mẫu thưa), persona Chị Vy (QL, giao ban 10 phút) · Admin văn phòng · Head tutor.

---

## Tóm tắt 10 dòng

1. **Lỗi bộ chọn tự đóng (II.6) [ĐÃ KIỂM — tái hiện 6/6 lần]:** bấm ‹ › hay một ngày trong lịch → **cả hộp "Khoảng thời gian" đóng, tuần không được chọn**. Bị ở **4 chỗ dùng `BoChonThoiGian`**: Phân tích (6 tab, 1440 + 375), Tutor, panel một tutor, Bộ lọc thêm (Học viên & Lớp). **Không bị** ở 2 panel xuất (Xuất kết quả Test, Xuất điểm Test). Hiện chỉ đổi được bằng gõ tay vào ô.
2. **Số bấm được có 5 dáng, gạch chấm mang 4 nghĩa** (mở panel · đổi trang · giải thích cột · chú thích KCK). Đề xuất **một dáng "ô số"** (viền 1 px, nền khi rê, ≥ 24 / 44 px) = đúng "ô viền" mockup 3 + mockup tutor; số chỉ xem để trơn; đổi trang chỉ bằng chữ có "›".
3. **Luật chọn loại panel:** số **trong kỳ** → A (thông tin cụ thể); số **hiện tại = việc đang chờ** → C (thông tin + nút làm); số để so → 0; số có trang chuyên → D (đúng lọc). Kiểm kê **~60 chỉ số** ở Phân tích + toàn web (bảng V3B-02): 9 chỗ dẫn sai ngữ cảnh (về Hồ sơ lớp / Lịch Test chung chung).
4. **Mẫu panel C** (tiêu đề = chỉ số + phạm vi + số dòng; bảng ≤ 6 cột; một nút động từ / dòng; làm ngay dưới dòng; "✓ Xong · Hoàn tác"): SOS lớp 14 → 7 bấm, 2 → 0 đổi trang; bài quá hạn GV 4–5 bấm + nhớ → 2 bấm.
5. **Báo cáo khớp mockup 3 khung 3 chỉ ~36 %** (18 quyết định: 2 KHỚP · 9 MỘT PHẦN · 7 KHÁC). Gốc: kế hoạch dịch "mở sáng, chữ lớn để chiếu" thành "khi in"; dùng lại `SoLieuO` gạch chấm; khối số xếp dọc. Mockup cũng có chỗ nên nâng (panel Chưa đạt 10 cột vẫn cuộn ngang, dải bộ chọn 4 kiểu đã hết hiệu lực).
6. **Trộn báo cáo ↔ việc:** 5/7 bảng Phân tích có cột việc (Quá hạn, Bậc kế, Chưa chốt PA, Đang xử lý, Việc tiếp, Case/PA). **Ý thức › "Học viên cần chú ý"** là **hàng đợi việc theo trạng thái hiện tại** (không theo khoảng) → đề xuất bỏ khỏi Phân tích, việc đó đã có ở Hồ sơ lớp › Ý thức (V2B-6) + Công việc; Phân tích Ý thức chỉ còn xu hướng vi phạm theo lớp / loại.
7. **Xuất Excel: 11 lối, 5 bộ tên cột** ("Tên" / "Tên học sinh" / "Học viên"; "Email" / "Gmail"; "OVR" / "Overall"). 3 lối dựng ở trình duyệt **không ghi nhật ký** (Ý thức có email + tình trạng kỷ luật). Lệch phạm vi: Xuất kết quả Test từ Lịch Test (trang xem 1 tuần, tệp mặc định từ đầu tháng); Kế hoạch Test "Chỉ cần xếp lại" vẫn xuất mọi em.
8. **Thời gian (II.5):** một thành phần `Khoảng tuần` + lựa chọn **"Toàn bộ"** (= từ tuần đầu có dữ liệu trong phạm vi đang lọc; chọn lớp = từ khai giảng lớp). Mặc định theo bảng: Báo cáo 2 tuần hoàn chỉnh · Test + SOS 8 tuần · Kết quả thi Mock 4 tuần, Thi thật Toàn bộ · Hiệu quả PA Toàn bộ · Phân tích GV 4 tuần · Ý thức 4 tuần · Tutor 4 tuần gồm tuần này. Vướng: trần 52 tuần ở máy chủ (`khoangThoiGian.ts:17-18`) → hỏi.
9. **Hiệu quả PA:** demo 26 tuần chỉ 10 PA, cả 10 nằm trong một hàng gập "8 vấn đề khác" → bảng gần như trống, **không thấy loại PA nào**. Bảng "Tổng hợp vấn đề HV" đã bỏ ở OV-15e (C28). So 4 phương án → khuyến nghị **một bảng "Vấn đề & PA"** (kỹ năng → vấn đề, cột PA đã dùng + "Không tiến bộ n" mở panel C), giữ khối PA quy chế riêng — không đổi luật "Nên dùng".
10. **Tutor:** bảng căn đúng (0 px lệch) nhưng cột "Cần chú ý vì" rộng 418 px **trống cả 8 dòng**; 5 chip trạng thái chồng nghĩa (Cần chú ý tính **mọi thời gian**, Đang dạy theo khoảng); 375 tốn ~460 px cho bộ lọc trước tutor đầu; tiêu đề "Feedback G…" bị cắt trong panel. Phần lớn đánh giá còn lại **[CẦN DỮ LIỆU]**: demo 8 tutor, 2 buổi, ghi theo giờ thật 20/10.

---

## V3B-01 Một dáng "số bấm được" thay gạch chấm (II.1.1) · [ĐÃ CHỐT bỏ gạch chấm; dáng mới ĐỀ XUẤT] · P1

**1. Vấn đề [ĐÃ KIỂM]**
- Gạch chấm dưới chữ đang mang **4 nghĩa** trên cùng một trang:
  | Nghĩa | Nơi | Tệp:dòng |
  |---|---|---|
  | Mở panel danh sách | mọi `SoLieuO`, `SoLieu`, nút Kết quả Mock, ô số Phân tích GV | `ui/SoLieuO.tsx:29` · `ui/SoLieu.tsx:312` · `phanTich/BaoCao.tsx:151` · `phanTich/PhanTichGiaoVien.tsx:68` · `phanTich/dungChung.tsx:45` |
  | Đổi trang (link) | mã lớp ở Học viên & Lớp, Đang SOS, Cần làm, TVV; "5 lớp" ở Phân tích GV | `students/StudentsPage.tsx:708` · `BangSos.tsx:136` · `BangCanLam.tsx:70` · `HocVienTheoVai.tsx:244` · `PhanTichGiaoVien.tsx:187` |
  | Giải thích (tooltip) | tên cột Phân tích GV ("rê chuột vào tên cột gạch chấm") | `PhanTichGiaoVien.tsx:50` |
  | Chú thích chữ viết tắt | "KCK", "Thiếu n" | `ui/ui.tsx:468` · `students/MissingBadge.tsx:82` |
- Ngoài gạch chấm còn **4 dáng bấm khác**: cả ô thẻ (`ODem`, Tổng quan TVV / CX / Admin — `worklist/HocVienCuaToi.tsx:11-19`) · chip / badge bấm được (hàng lớp, đầu hồ sơ lớp) · chữ màu link cam (ô tỉ lệ Tutor `tutor/TutorPage.tsx:212`) · chip vuông chứa số gạch chấm (Test + SOS `TongHopTestSos.tsx:181` — hai dấu hiệu chồng nhau).
- Trong cùng một khối, số to không bấm còn số nhỏ cạnh nó thì bấm: Báo cáo "12 chưa điểm" (trơn) · "53 bài" (gạch chấm); "⚠ 4 quá hạn" (trơn) · "3 chốt PA · 1 Kết quả PA" (gạch chấm) (ảnh `bc-ql-1440.png`; = A5-19, vẫn còn).
- Vùng bấm = đúng chữ số (8×12 px ở 1440; B-02).

**2. Nguyên nhân**
- Quyết định 16/10 (G-10) chọn gạch chấm cho "số = số dòng khi bấm"; mockup 3 / mockup tutor (17–19/10) vẽ **ô viền**, kế hoạch OV-15e không ghi "đổi dáng số" → PR #462 dùng lại `SoLieuO` (N1, N2 ở a6).
- Không có thành phần "số bấm được" chung cho cả ô lớn và ô nhỏ; mỗi màn tự thêm lớp `underline decoration-dotted` (12 tệp).

**3. Ảnh hưởng**
- Chị Vy không đoán được: gạch chấm → panel, → trang khác, hay chỉ là chú thích. Phải thử bấm từng số.
- Persona Sam (bàn phím): số và tên cột cùng dáng nhưng một cái là nút, một cái là `span tabIndex` → thứ tự Tab rối.
- Màn chiếu / in: gạch chấm vẫn in (A5-18), nhìn như lỗi chính tả.

**4. Liên quan:** X2, 9.2-31 ("ô viền"), 10.2 phân loại (a)–(d), 10.3 thang làm tại chỗ, V2B-1 (hệ `Bang`: kiểu cột "số"), Tổng quan (dải HV cần chú ý), Hồ sơ GV (8 số), Công việc "Lớp tôi dạy", Tutor.

**5. Phương án**
| | Mô tả |
|---|---|
| **P1 — "ô số" (mockup)** | Số bấm được nằm trong ô viền 1 px `--line-strong`, bo 6 px, đệm 2×8 px, rộng tối thiểu 28 px; rê chuột: nền phủ 8 % + viền `--accent`; focus vòng 2 px; **đang mở panel từ số này**: nền `--accent-soft` + viền nhấn (trạng thái "đang chọn" của hệ vòng 1); vùng bấm ≥ 24×24 (1440) / 44×44 (375) bằng `::after`. Số lớn ở thẻ báo cáo: **cả ô (số + nhãn) là nút** như "68 HV đã thi" của mockup. Chip SOS / chip kết quả **chính nó là nút** (không thêm khung). Số chỉ xem: trơn, không viền, không hover. |
| P2 — chữ nhấn + mũi tên | Số tô màu `--accent` + "›" nhỏ. Gọn nhưng đụng luật màu vòng 1 (xanh dương đã mang 5 nghĩa; số điểm cũng tô màu theo kết quả) và "›" là dấu đổi trang. |
| P3 — chỉ đổi khi rê | Số trơn, rê chuột mới hiện nền. Không thấy trên điện thoại (không có rê), Chị Vy phải thử. |

Luật đi kèm (một nghĩa một dáng):
- **Ô số** = mở panel / mở rộng tại chỗ (A, B, C).
- **Chữ có "›"** (hoặc "↗" cho hồ sơ) = đổi trang (D). Không dùng con số làm link đổi trang; nếu một con số cần dẫn sang trang chuyên, đặt chữ "Xem ở Lịch Test ›" ở chân panel.
- **ⓘ** = giải thích. Bỏ gạch chấm ở tên cột, KCK, "Thiếu n".
- **Chip lọc có số** (`BoLocDoan`) = lọc tại chỗ (b) — giữ dáng hiện tại.

**6. Ưu / nhược**
| Tình huống | P1 | P2 | P3 |
|---|---|---|---|
| Chị Vy mở Báo cáo, cần biết số nào bấm được | nhìn là biết (viền) | phải phân biệt xanh = bấm hay xanh = "bằng kỳ vọng" | không biết cho tới khi rê |
| Điện thoại | ô 44 px, rõ | chữ nhỏ, vùng bấm phải mở rộng | không có tín hiệu |
| Bảng dày (Test + SOS 14 cột số) | nhiều ô viền → dày mắt | gọn | gọn |
| Khớp mockup đã duyệt | **khớp** (m3 khung 3, 4; mockup tutor m2) | không | không |
Nhược P1 ở bảng dày xử lý bằng luật "ô 0 không viền" + "chỉ số có việc / có danh sách giá trị mới bấm" (V3B-02): Test + SOS còn ~8 cột bấm thay 14.

**7. Đề xuất: P1.** Khớp mockup đã duyệt, khớp 9.2-31, một nghĩa một dáng, đạt `touch-target-size`, `consistency`. Thành phần: `OSo` (một) thay `SoLieuO` / `SoO` / `OSo` của Phân tích GV / nút Mock của Báo cáo; nhận `loai: 'A' | 'B' | 'C'` chỉ để đặt `aria-haspopup` / `aria-expanded`.

**8. Nghiệp vụ:** không đổi luật. Đổi hệ thiết kế (cần bảng mẫu `/dev/thanh-phan` duyệt trước — 11.8-13).

**9. Cần chủ SP xác nhận:** Q1 (dáng ô số P1, áp toàn web, kể cả Tổng quan / Hồ sơ GV / Tutor) — **khuyến nghị: có**.

---

## V3B-02 Kiểm kê chỉ số bấm được: bấm ra gì, có đúng tập / đúng ngữ cảnh không (II.1.2 + II.1.3) · [ĐÃ KIỂM] · P1

**1. Vấn đề [ĐÃ KIỂM — bấm thử + đọc mã]**
- Gần như mọi số mở **cùng một panel tên** (`NganDanhSach`, dòng = tên + lớp; mở dòng chỉ có "Mở trang ↗"), dù người bấm cần điểm, kỹ năng hụt, trạng thái Case hay số ngày trễ. Ảnh: `bc-ql-pn-sos.png` (3 tên), `bc-ql-pn-gv.png` ("7 bài — quá hạn chấm", **mất tên GV**, dòng "Nhập điểm" mà QL không nhập được), `pt-th-ql-pn-sos.png` ("MT1 · Đặng Quốc Bảo", không kỹ năng, không điểm), `pt-yt-ql-pn-mo.png` (mở dòng: chữ lặp 2 lần + "Mở trang ↗").
- 9 chỗ dẫn **sai ngữ cảnh** (về trang chung chung, mất lọc) — bảng dưới, cột "Đúng?" = ✗.
- Ngược lại có mẫu tốt nên nhân rộng: panel sổ chỉ số "Case chưa chốt PA" (`bc-ql-pn-casechot.png` — dòng = việc tiếp + em + lớp + ⚠ quá hạn n ngày, bấm dòng mở đúng việc), panel một tutor (thông tin + nhận xét + buổi), chip lọc Kết quả thi.

**Bảng kiểm kê** (vai QL 2 / QT 1; "Cần" = điều người bấm muốn biết / làm; loại: **0** chỉ xem · **A** thông tin · **B** mở khu làm việc · **C** thông tin + thao tác · **D** đổi trang đúng ngữ cảnh)

| # | Chỉ số (nơi) | Dáng nay | Bấm ra (nay) | Đúng? | Cần | Đề xuất |
|---|---|---|---|---|---|---|
| **Phân tích › Báo cáo** (`phanTich/BaoCao.tsx`) |
| 1 | "17 HV đã thi" | số 20 px gạch chấm | panel tên + lớp | ✗ ít | em nào, MT nào, đạt chưa | **A** = panel Kết quả Mock "Tất cả" (bảng gọn, xem V3B-03) |
| 2 | "72/100 bài đã chấm" | gạch chấm ở 72 | panel tên | ✗ | tiến độ — không ai cần danh sách bài đã xong | **0** |
| 3 | "⚠ 28 bài quá hạn · 3 GV" | gạch chấm | 28 dòng "Nhập điểm · tên · MT · kỹ năng", không GV, không số ngày | ✗ | ai trễ, lớp · đợt nào, trễ bao lâu | **A** nhóm GV › lớp · đợt · kỹ năng, "trễ n ngày", chân nhóm "Mở lưới lớp · đợt ›" (D đúng lọc). QL nhập thay = C nếu chủ SP mở quyền (9.2-1) |
| 4 | Số bài của dòng GV ("7") | gạch chấm | như #3, **mất tên GV** (`baoCao.ts:152`) | ✗ | như #3 nhưng một GV | **A** = #3 lọc sẵn GV, tiêu đề giữ tên GV |
| 5 | SOS 1/2/3 của một lớp | gạch chấm | panel tên | ✗ | em nào, kỹ năng hụt, Case / PA tới đâu, ai làm | **C** (mẫu V3B-03) |
| 6 | SOS hàng "Cả Monbay" | gạch chấm, đậm | panel tên mọi lớp | ✗ | như #5, gom theo lớp | **C** gom nhóm lớp |
| 7 | Kết quả Mock "5 Đạt" | gạch chấm | panel `BangMock` lọc Đạt, **cuộn ngang** 1 180 px trong 720 px (A5-16) | một phần | ai đạt, OVR | **A** bảng gọn 5 cột |
| 8 | "4 Chưa đạt" | gạch chấm | như #7 lọc Chưa đạt (`bc-ql-pn-chuadat.png`: Kỳ vọng, Kết quả, SOS, Case, Việc tiếp ngoài khung) | một phần | kỹ năng hụt, Case tới đâu, làm gì tiếp | **C** (mockup 3 "Panel từ số 23 Chưa đạt") |
| 9 | "8 Chưa đủ điểm" | gạch chấm | như #7 | một phần | thiếu kỹ năng nào, ai chấm, trễ chưa | **A** (QL không nhập điểm) |
| 10 | "2 chưa lịch Test" (tại 14/09) | gạch chấm | panel sổ: tên | ✗ | em nào, MT vừa xong, MT kế | **C** — QL xếp lịch MT kế bằng hộp nhỏ chọn tuần (`plan.week`) |
| 11 | "12 chưa điểm" | **trơn, không bấm** | — | — | như #9 | **0** (đã có #3 / #9; đây là số em) |
| 12 | "53 bài" (dưới 12) | gạch chấm | panel sổ "Nhập điểm" | ✗ | — | **0** — trùng #3 với phạm vi khác (28 trong kỳ / 53 tới hôm nay; A5-04) |
| 13 | "13 Case chưa chốt PA · 19 Case" | "13" trơn, "19" gạch chấm | panel sổ dòng việc ✓ | ✓ | việc tiếp từng Case | **C** — bấm **cả ô** (13), giữ panel sổ |
| 14 | "26 Case đang mở" | gạch chấm | panel sổ | một phần | — | **0** (bức tranh; chi tiết ở #13, #16) |
| 15 | "10 PA có kết quả trong kỳ" | gạch chấm | panel không có kết quả PA; **số không theo kỳ** (A5-02) | ✗ | PA nào, cho em nào, tiến bộ không | **A** cột Kết quả PA; sửa A5-02 trước |
| 16 | "⚠ 4 quá hạn · 3 chốt PA · 1 Kết quả PA" | "4" trơn; "3", "1" gạch chấm | panel sổ dòng việc ✓ | ✓ | việc quá hạn | **C** — bấm cả ô "⚠ 4", chip lọc "Chốt PA 3 · Kết quả PA 1" trong panel |
| **Phân tích › Test + SOS** (`TongHopTestSos.tsx:158-163`) — mỗi ô số → `/phan-tich/tong-hop/o` → panel tên |
| 17 | Lượt MT / Bài | chip-số gạch chấm | panel "MT1 · tên" | ✗ | — | **0** (tổng) |
| 18 | Đạt | chip vuông xanh + gạch chấm | panel tên | ✗ | ai đạt | **A** = bảng Kết quả Mock gọn lọc Đạt + dòng / tuần |
| 19 | SOS 1/2/3 | chip vuông màu + gạch chấm | panel "MT · tên" (`pt-th-ql-pn-sos.png`) | ✗ | như #5 | **C** |
| 20 | Thiếu điểm | gạch chấm xám | panel tên | ✗ | thiếu kỹ năng nào, ai | **A** |
| 21 | Dưới kỳ vọng L · R · W1 · W2 · S | gạch chấm | panel tên | ✗ | em nào, điểm / kỳ vọng kỹ năng đó | **A** (cột "R 5.5/6.0 · thiếu 0.5") |
| 22 | HV - Case · Chưa chốt PA (⚠) · Đang xử lý | hai số gạch chấm trong một ô | panel tên / Case | ✗ | việc | **C** nếu giữ cột; khuyến nghị **bỏ cột việc khỏi bảng phân tích** (V3B-05) |
| **Phân tích › Kết quả thi** (`KetQuaThi.tsx`) |
| 23 | Chip "Tất cả 17 · Đạt 5 · Chưa đạt 4 · Chưa đủ điểm 8" | chip lọc có số | lọc tại chỗ ✓ | ✓ | — | **(b)** giữ |
| 24 | "MT · tuần" (link) | chữ link | hồ sơ MT (đổi trang) | ✓ ngữ cảnh | xem bài | **D** giữ, thêm "↗" |
| 25 | "Việc tiếp" (link) | chữ link | **trang Case** `/hoc-thuat/case/:id` hoặc hồ sơ MT (`:93`) | ✗ (đổi trang để làm việc — X3) | làm việc | **C** mở panel việc tại chỗ (như #13) — hoặc bỏ cột (V3B-05) |
| **Phân tích › Hiệu quả PA** (`HieuQuaPa.tsx:47-51, 193-196`) |
| 26 | Số PA · Học viên · Có cải thiện | gạch chấm | panel tên PA / em | ✗ | PA gì, em nào, kết quả, bao lâu | **A** cột Loại PA · Em · Kết quả · Tuần |
| 27 | "n PA chờ kết quả" · "n Case chưa chọn nhóm nguyên nhân" (chân bảng) | gạch chấm | panel | một phần | đây là **việc** | **C** (hoặc chuyển về Công việc — V3B-05) |
| 28 | "n PA chưa rõ nơi học" | gạch chấm | panel | ✓ | dữ liệu thiếu | **A** |
| **Phân tích › Phân tích GV** (`PhanTichGiaoVien.tsx`) |
| 29 | "5 lớp" | **link gạch chấm** → hồ sơ GV | đổi trang | ✓ ngữ cảnh, sai dáng | xem GV | **D** chữ "Hồ sơ ›" ở cột tên, bỏ gạch chấm ở số |
| 30 | Chấm điểm "6/14" | gạch chấm | panel "Chấm đúng hạn · GV" có hạn + ngày trễ ✓, link "Mở Lịch Test / Chấm Test ›" **không lọc** (`:285`, A5-17) | ✗ link | ô nào trễ, mở đúng lưới | **A** + D đúng lọc (lớp · tuần · kỹ năng) |
| 31 | Kết quả PA · Xử lý vi phạm · PA hiệu quả · kết quả môn · HV tiến bộ | gạch chấm | panel tên | ✗ | mục nào trễ / hụt | **A** |
| **Phân tích › Ý thức** (`YThucPhoiHop.tsx`) |
| 32 | Vi phạm · Chưa xử lý của một em | gạch chấm | panel vi phạm; mở dòng: chữ lặp + "Mở trang ↗" | ✗ | xử lý | bỏ bảng (V3B-06); nếu giữ: **D** "Xử lý ở hồ sơ ›" tab Ý thức đúng em |
| 33 | Tên lớp ở "Lớp nhiều vi phạm" | link | **Hồ sơ lớp tab mặc định** (`:94`) | ✗ (đang xem Ý thức, về tab Học viên) | Ý thức của lớp | **D** `/hoc-vien/lop/:id?tab=y-thuc` |
| 34 | Vi phạm · Chưa xử lý · HV có vi phạm của lớp / nhóm | gạch chấm | panel vi phạm | một phần | vi phạm gì, em nào | **A** |
| **Tutor** (`tutor/TutorPage.tsx`) |
| 35 | Chip "Cần chú ý 0 · Đang dạy 0 · …" | chip lọc | lọc ✓ (số không cộng ra Tất cả — A5-06) | một phần | — | (b), sửa nghĩa (V3B-11) |
| 36 | Ô tỉ lệ có buổi "Không" ("4/6" cam) | chữ link cam | panel tutor lọc sẵn tiêu chí + ô nhận xét ✓ | ✓ | vì sao + nhận xét | **C** giữ (mẫu tốt), đổi dáng sang ô số |
| 37 | "Buổi" | trơn | — | — | buổi nào | mockup vẽ ô viền → **A** (panel tutor, phần Buổi) |
| **Toàn web** |
| 38 | Tổng quan QL: dải "HV cần chú ý" + hàng tổng (8 số) | gạch chấm | **không mở gì** (A1-01) | ✗ | — | 10.2: bỏ dải; hàng tổng **0** |
| 39 | Tổng quan QL: số của hàng lớp (Chưa lịch, Chưa điểm, SOS, Case, Đã thi) | gạch chấm / chip SOS | panel tên | ✗ | em + việc | 10.2 / 10.7-4: **B** mở rộng hàng lớp (dòng em có nút = C tại chỗ) |
| 40 | Tổng quan Admin VP: "Đề nghị dời chờ" | cả ô thẻ | `/test/lich` **chung** (`MockTestAdmin.tsx:36`) | ✗ | thẻ dời lịch chờ duyệt | **D** Công việc › Chờ duyệt lọc loại "dời lịch" (hoặc C hộp duyệt) |
| 41 | Tổng quan Admin VP: "MT chưa xếp lịch" | cả ô thẻ | Kế hoạch Test FT **không lọc** (`:37`) | ✗ | em chưa có lượt | **D** Kế hoạch Test lọc "chưa xếp" |
| 42 | Tổng quan Admin VP: "Lượt MT tuần này", "Ô điểm chưa nhập" | cả ô thẻ | Kế hoạch Test tuần · Công việc nhóm chấm điểm | ✓ | — | **D** giữ, đổi dáng ô số |
| 43 | Tổng quan TVV / CX: 5 ô đếm | cả ô thẻ | Học viên & Lớp `view=…` | ✓ | — | **D** giữ |
| 44 | Học viên & Lớp + đầu hồ sơ lớp: "n bài chờ chấm" | chip | Lịch Test lọc lớp (`StudentsPage.tsx:653`, `DauTrangLop.tsx:121`) — không mở đúng lượt / ô; số gồm bài chưa tới hạn (A7-10) | ✗ một phần | ô quá hạn của lớp | hồ sơ lớp: **B** cuộn + mở lưới (11.1c #2); hàng lớp: **C** panel Nhập điểm lớp |
| 45 | "n chờ duyệt" (hàng lớp, đầu hồ sơ) | chip | **đổi trang** Công việc › Chờ duyệt lọc lớp | ✗ (đổi trang để duyệt) | duyệt | **C** khung Chờ duyệt lọc lớp tại chỗ (11.8-17) |
| 46 | "⚠ n việc quá hạn" | chip đỏ | góc Cần làm lọc lớp | một phần | việc của lớp | **B** dải việc dưới hàng lớp (11.2 / 11.8-8) |
| 47 | "Thiếu n thông tin" | chip | Học viên & Lớp `view=thieu_tt` (rời hồ sơ lớp) | ✗ ở hồ sơ lớp | điền | **C** mở "Sửa thông tin" lọc em thiếu (11.1c #4) |
| 48 | "+n" (menu chip ẩn): "Thiếu GV", "n HV chưa chốt lộ trình" khi người xem không chuyển tiếp được | menu | **Hồ sơ lớp tab mặc định** ("không có đích riêng thì mở Hồ sơ lớp" — `StudentsPage.tsx:667-669`, `:654`) | ✗ chung chung | đúng việc | **0** với người không có việc (chỉ chữ); người có việc → C đúng panel (Phân công, Lộ trình tiếp) |
| 49 | Hồ sơ GV: 8 số (lớp, HV, Case, quá hạn, yêu cầu…) | gạch chấm | panel tên | một phần | mục cụ thể | **A**; chip "Bàn giao" → hồ sơ lớp `?viec=ban-giao` ✓ |
| 50 | Công việc › "Lớp tôi dạy": số bài / em | gạch chấm | panel (ngăn phủ chồng — CV-19) | một phần | nhập | **C** Nhập điểm lớp (thay khung phải) |

**2. Nguyên nhân**
- Một panel chung `NganDanhSach` cho mọi số (máy chủ `rowsFor(unit, ids)` chỉ trả tên + lớp — `server/src/worklist/metrics.ts:191-205`); C26 [CHỐT] "panel báo cáo hiện kết quả cụ thể" không thành hành động trong kế hoạch (A5-07).
- Lối "không có đích thì về hồ sơ lớp" được ghi thẳng trong mã (B4, `StudentsPage.tsx:667`) — chọn "có chỗ để đi" hơn "đúng chỗ".
- Mỗi PR thêm link về trang có sẵn thay vì panel (N7, X3).

**3. Ảnh hưởng:** giao ban: mỗi câu hỏi "em nào, tới đâu" = 1 bấm + 1–2 đổi trang mỗi em; Quay lại mất panel (A5-15). 9 chỗ ✗ ngữ cảnh làm người dùng phải tự tìm lại đúng tab / lớp / tuần.

**4. Liên quan:** X1 (số = dòng), X2, X3, A5-07, A5-15, A5-17, A1-01, A3-07, A7-10, 10.2, 10.3, 11.1c.

**5–6. Phương án luật chọn loại**
| | Luật | Nhược |
|---|---|---|
| **L1 — theo bản chất số** | số **trong kỳ** (đếm lượt / bài / PA đã xảy ra) → **A**; số **hiện tại = việc đang chờ** ("tại 14/09", quá hạn, chưa lịch, chưa chốt PA) → **C**; số tổng / tiến độ để so → **0**; số mà trang chuyên có sẵn bộ lọc đúng (hồ sơ MT, Học viên & Lớp `view=`) → **D** | phải phân loại ~60 số một lần (bảng trên đã làm) |
| L2 — mọi số đều C | panel nào cũng có nút | số trong kỳ (lượt đã thi tuần trước) không còn việc → nút giả (đúng thứ chủ SP chê ở 10.2 "panel chỉ ra tên") |
| L3 — mọi số đều D | chuyển sang trang chuyên | đổi trang cho việc xem nhanh; trái "xử lý tại chỗ" |

**7. Đề xuất: L1** + bảng trên làm danh sách việc của PR. Phép kiểm máy (X1): "số trên trang = số dòng panel" cho mọi `OSo`; "link từ số giữ đủ tham số lọc (lớp, tuần, tab)".

**8. Nghiệp vụ:** không đổi luật. #3 / #4 / #44 "nhập thay" chỉ khi chủ SP cấp quyền (9.2-1).

**9. Cần xác nhận:** Q2 (luật L1) — **có**; Q3 (#22, #25, #27: bỏ cột việc khỏi bảng phân tích thay vì làm C) — xem V3B-05.

---

## V3B-03 Mẫu panel C "thông tin + thao tác" + luật "số trên trang = số dòng panel" (II.1.2) · [ĐỀ XUẤT] · P1

**1. Vấn đề:** chưa có mẫu C. Hai panel gần đúng nhưng khác nhau: panel sổ "Case chưa chốt PA" (dòng = việc, không bảng, không bối cảnh điểm) và panel tutor (thẻ số + form + bảng buổi). Panel Mock trong Báo cáo có bảng nhưng 14 cột cuộn ngang, không nút việc; tên em đổi trang.

**2. Nguyên nhân:** thang "làm tại chỗ" (10.3) mới là luật đề xuất; chưa có thành phần.

**3. Ảnh hưởng:** xem đếm bước ở mục 6.

**4. Liên quan:** 10.2 S-B (hàng lớp mở rộng — cùng "dòng em"), Đang SOS mockup 6 khung 1 (dòng em), 11.3 Ý thức A, Tổng quan B (khung phải). Panel C dùng **cùng dòng em** với các chỗ đó.

**5. Thiết kế mẫu panel C [ĐỀ XUẤT]**
```
┌ SOS 2 · MB FT 101 · W1 + W2 SEP · 3 HV ──────────────────── ✕ ┐   ← tiêu đề = chỉ số · phạm vi · đúng số vừa bấm
│ HV có ≥ 2 kỹ năng dưới kỳ vọng ở lượt gần nhất trong kỳ  ⓘ      │   ← định nghĩa 1 dòng, ⓘ "Cách tính" (sổ chỉ số)
│ [Cần làm 2] [Đang chạy 1] [Xong 0]                 Xuất · 3 HV │   ← chip lọc trạng thái việc (b), có số; Xuất tuỳ chọn
├──────────────────────────────────────────────────────────────┤
│ Học viên          Kỹ năng hụt         Case / PA          Việc        │
│ Đỗ Minh Khôi ↗   W 6.0/6.5 · S 5.0   Case trống PA      [Thêm PA]   │   ← 1 nút động từ / dòng, theo quyền
│ MB FT 101 · MT2   · thiếu 0.5 / 1.5   ⚠ quá hạn 3 ngày               │
│   └ (bấm Thêm PA → form 2 hàng mở ngay dưới dòng; Lưu → "✓ Đã thêm PA · Hoàn tác") │
│ Đoàn Minh Khang ↗ R 6.0/6.5 · W 5.5  PA đang chạy · Tutor  —         │   ← không có việc → chữ tình trạng, không nút
├──────────────────────────────────────────────────────────────┤
│ Xem cả danh sách ở Học viên & Lớp › Đang SOS ›              Đóng │   ← D đúng lọc (lớp + SOS 2), tách khỏi nút làm
└──────────────────────────────────────────────────────────────┘
```
- **Cột tối đa 6**, rộng panel 720 px, **không cuộn ngang**; điểm gộp thành "R 5.5/6.0 · thiếu 0.5" (mockup 3) thay 6 cột L R W S OVR Kỳ vọng.
- **Nhóm** khi > 1 nhóm (lớp ở "Cả Monbay"; GV ở bài quá hạn): hàng nhóm một dòng có số.
- **Một nút / dòng**, động từ của việc kế tiếp, theo quyền; người không có quyền thấy chữ tình trạng. Việc ngắn (Thêm PA, Xếp lịch MT kế, Gia hạn) → **form mở dưới dòng** (bậc 2); việc dài (Xác nhận Case, Chốt lộ trình) → **thay nội dung panel** + "‹ Danh sách (3)" (bậc 3), không panel chồng.
- **Tên em** = link "↗" mở hồ sơ ở tab đúng (SOS → tab Học thuật; vi phạm → tab Ý thức), tách khỏi nút làm.
- **Trạng thái:** đang tải (khung xương), lỗi giữ chữ đang gõ, đang lưu / đã lưu, "người khác vừa xử lý" (dòng mờ + chữ), rỗng ("Không còn em nào cần làm ✓").
- **Luật "số = dòng":** số trên tiêu đề = số vừa bấm = số dòng (đếm bằng cùng hàm `tinh()`). Dòng làm xong **ở lại** (mờ, "✓ Xong") tới khi đóng panel → số tiêu đề không nhảy giữa chừng; đóng panel thì số trên trang tải lại. Panel nằm trên URL (`?so=…&dong=…`) → Quay lại mở lại đúng dòng (sửa A5-15).
- **375:** toàn màn, dòng thành thẻ 2 dòng, nút 44 px dính đáy dòng.

**6. Đếm bước — trước → sau (QL Monbay, demo)**
| Chỉ số | Việc thật | Nay | Panel C |
|---|---|---|---|
| SOS 2 · MB FT 101 (Báo cáo, 2 em) | biết em nào, Case tới đâu, thêm PA cho em chưa có | bấm số → panel tên → mở dòng → "Mở trang ↗" (đổi trang) → tìm Case → Thêm PA → Lưu → Quay lại (panel đã đóng) ≈ **7 bấm + 1 đổi trang / em → 14 bấm, 2 đổi trang** | bấm ô → Thêm PA → Lưu ≈ **1 + 3 / em → 7 bấm, 0 đổi trang** |
| Case quá hạn "⚠ 4" (Báo cáo) | làm 4 việc quá hạn | phải bấm đúng số nhỏ "3" rồi "1" (hai panel) → dòng → việc ≈ **3–4 bấm / việc + 1 bấm đổi panel** | bấm cả ô "⚠ 4" → panel có chip "Chốt PA 3 · Kết quả PA 1" → **3 bấm / việc**, một panel |
| Chưa có PA (Test + SOS "Chưa chốt PA 3 ⚠1") | thêm PA cho Case trống | ô số → panel tên Case → mở dòng → "Mở trang ↗" (trang Case) → Thêm PA → Lưu ≈ **5 bấm + 1 đổi trang** | **3 bấm, 0 đổi trang** (nếu giữ cột; khuyến nghị V3B-05 bỏ cột khỏi bảng phân tích và để việc ở Tổng quan / Công việc) |
| Bài quá hạn chấm của GV "7" (Báo cáo) | biết GV trễ ở lớp · đợt nào, mở đúng lưới | số → panel 7 dòng mất tên GV → mở dòng → Xem hồ sơ (đổi trang) … hoặc Phân tích GV → "9/22" → "Mở Lịch Test" (không lọc) → mở khối quá hạn → tìm lớp ≈ **4–5 bấm, 2 đổi trang, phải nhớ lớp / đợt** | panel **A** nhóm "MB FT 101 · MT1 · R · trễ 6 ngày (3 em)" → "Mở lưới ›" = **2 bấm, 1 đổi trang, 0 nhớ** |
| Vi phạm chưa xử lý của một em (Ý thức "3") | xử lý | số → panel → mở dòng → "Mở trang ↗" → tab Ý thức → Xác nhận xử lý → Lưu ≈ **6 bấm + 1 đổi trang** | theo V3B-06: việc này ở Hồ sơ lớp › Ý thức (A); từ Phân tích chỉ còn **D** "Xử lý ở hồ sơ ›" = 2 bấm tới đúng form |

**7. Đề xuất:** một thành phần `PanelChiSo` (A và C cùng vỏ; A = không cột Việc, không chip trạng thái) thay `NganDanhSach` cho mọi số Phân tích / Báo cáo / Hồ sơ GV. Máy chủ: mỗi nguồn `…/o` trả **cột theo loại số** (điểm, kỹ năng hụt, trạng thái Case, việc kế + hạn + quyền) thay `rowsFor` chỉ tên.

**8. Nghiệp vụ:** không đổi luật (nút chỉ gọi đúng việc đã có, theo quyền máy chủ). Cần mockup (thành phần mới): panel C 1440 + 375, đủ trạng thái.

**9. Cần xác nhận:** Q4 (mẫu panel C + "dòng xong ở lại tới khi đóng") — **có**.

---

## V3B-04 Báo cáo không giống mockup đã duyệt (II.2) · [ĐÃ CHỐT sửa theo mockup; ĐÃ KIỂM lệch] · P1

**1. Vấn đề — đối chiếu từng quyết định** (mockup `thiet-ke/mockup-ov14-3-tong-quan-bao-cao-phan-tich-2026-10-17.html` khung **3** `#bc1440`, `#bc375`, bộ chọn, "Panel từ số 23 Chưa đạt"; mockup 6 **không có khung Báo cáo** — khung 10 chỉ đổi tên trang "Tổng quan → Báo cáo", đã hết hiệu lực theo 10.5). Ảnh cặp: `mk3-bc--bc1440.png` ↔ `bc-ql-1440.png`; `mk3-bc--bc375.png` ↔ `bc-ql-375-p1.png`; `mk3-bc--panel.png` ↔ `bc-ql-pn-chuadat.png`.

| # | Quyết định trong khung | Web 20/10 (QL 2 / QT 1) | Kết quả | Lý do ghi lại? |
|---|---|---|---|---|
| 1 | Nằm ở Tổng quan › "Báo cáo tuần" (`/bao-cao-tuan`) | tab đầu của Phân tích | KHÁC | **Có** — plan §7, PR #462 |
| 2 | Đầu trang **một hàng**: "Báo cáo tuần · Monbay · Fast Track · W1 + W2 OCT/2026 (ngày) · [Khoảng thời gian ▾] · Dữ liệu đến … · In" | **4 hàng**: "Phân tích · Dữ liệu đến" / tab / FT-LT + bộ chọn / "Báo cáo W1 + W2…" + In; QT thêm ô "Chi nhánh" nhãn trên ở góc phải (A5-09) | KHÁC | Không |
| 3 | **Mở sáng, chữ lớn để chiếu** (khung "1440 · mở sáng") | theo giao diện người dùng (tối); sáng chỉ khi bấm In (`BaoCao.tsx:49-57`) | THIẾU | Không — kế hoạch 15e.3 viết "in / chiếu nền sáng A4 ngang", PR chỉ làm "In" |
| 4 | Tên "Báo cáo tuần" | "Báo cáo W1 + W2 SEP/2026" | MỘT PHẦN | — |
| 5 | Khối Test: 3 **ô số lớn có viền** (68 · 229/272 · ⚠ 43), chữ dưới | số 20 px, gạch chấm, nhãn 12 px xám | KHÁC | Không |
| 6 | Bảng "Quá hạn theo GV · Kỹ năng · Bài (ô viền) · Lớp", 4 GV | cùng cột; số gạch chấm; thêm dòng "Speaking chấm chéo" | MỘT PHẦN | dòng chấm chéo: **có** (chốt 18/10, A5-05) |
| 7 | SOS theo lớp: **chip tròn màu** SOS 1 vàng / 2 cam / 3 đỏ viền đôi; SOS tạm **viền đứt**; 0 xám; hàng "Cả Monbay" **nền nhấn** | số trơn gạch chấm; không màu; không "tạm"; hàng tổng chỉ đậm | KHÁC | Không |
| 8 | "So 2 tuần trước": chữ trung tính "Tăng 2 HV" | đúng | KHỚP (một phần cùng #7) | — |
| 9 | Kết quả Mock: **ô số + chữ cùng hàng** "41 ✓ Đạt · tỷ lệ đạt 64 % (41/64)", "23 × Chưa đạt" đỏ, "4 Chưa đủ điểm · không tính vào tỷ lệ" | số **trên**, chữ **dưới** (xếp dọc 3 tầng); không ✓ / ×; không màu | KHÁC | Không |
| 10 | HV cần chú ý · tại 17/10: ô số + chữ ngang; "10 chưa điểm · 58 bài" | dọc; "12" không bấm, "53 bài" bấm | MỘT PHẦN | Không |
| 11 | Case / PA: "26 Case mở · tại", "9 PA có kết quả trong kỳ", "⚠ 4 quá hạn · 3 chốt PA · 1 Kết quả PA" | cùng chữ, xếp dọc; "PA trong kỳ" **sai số** (A5-02) | MỘT PHẦN | — |
| 12 | Lưới: hàng 1 Test (7/12) + SOS (5/12); hàng 2 ba khối 4/4/4 | đúng | KHỚP | — |
| 13 | Bộ chọn: 4 kiểu + "Từ tuần [W1 OCT ▾][2026 ▾]" | 4 kiểu, ô `ONgay`; hộp 360 px che "Tùy chọn" (A5-13); **tự đóng khi bấm lịch** (V3B-09) | MỘT PHẦN | phần này **hết hiệu lực** (II.5 chốt "Toàn bộ + Chọn khoảng tuần") |
| 14 | Panel từ số "Chưa đạt": Học viên · Đợt · Kỳ vọng · OVR · L R W S · **Kỹ năng cần cải thiện** · Case + nút **Lập PA / Mở Case**; chip Đạt / Chưa đạt / Chưa đủ; Xuất Excel; "Mở bảng điểm"; tên HV xem nhận xét **trong panel** | chip ✓, Xuất ✓; bảng 14 cột **cuộn ngang** (Kỳ vọng → Việc tiếp ngoài khung); **không** cột kỹ năng hụt, **không** nút việc; tên HV **đổi trang** | MỘT PHẦN | Không |
| 15 | Mọi số khác mở "kết quả cụ thể · làm tại chỗ" (C26) | panel tên (V3B-02) | KHÁC | Không |
| 16 | 375: một cột, đầu trang gọn (chi nhánh · kỳ · bộ chọn · In), bảng GV 3 cột, chip SOS | một cột ✓; trước khối đầu: tab bị cắt "Hiệu qu…", FT/LT, bộ chọn, tiêu đề 2 dòng, nút In riêng hàng (≈ 330 px); số trơn | MỘT PHẦN | Không |
| 17 | Không khung "Đã thi – Chờ KQ" (C25) | không có | KHỚP | — |
| 18 | "Dữ liệu đến 17/10 14:30" + In ở đầu báo cáo; in một trang | "Dữ liệu đến" ở đầu trang Phân tích, **ẩn khi in**; In chỉ in 10 dòng / bảng (A5-18) | MỘT PHẦN | Không |

**Khớp ≈ (2 KHỚP + 9 × ½) / 18 ≈ 36 %** (tài liệu 3.1 ước cả nhóm Phân tích ~75 % vì Kết quả thi khớp tốt; riêng Báo cáo thấp hơn nhiều).

**2. Nguyên nhân [ĐÃ KIỂM — đọc `gh pr view 462`, plan, mã]**
- **Kế hoạch dịch sai một ý:** "mở sáng, chữ lớn để chiếu" → "15e.3 in / chiếu nền sáng A4 ngang" → PR chỉ làm sáng **khi in** (N1).
- **Dùng lại thành phần cũ:** `SoLieuO` (gạch chấm, 16/10) cho mọi số, `NganDanhSach` cho mọi panel; viết mới `Khoi` / `So` nhưng xếp **dọc** (số → nhãn → phụ) thay "ô số | chữ" ngang của mockup (N2).
- **Không có ảnh cặp khi rà PR:** mô tả PR #462 chỉ ghi "Báo cáo: Test · SOS · Kết quả Mock · HV cần chú ý · Case/PA" (đủ **khối**, không so **dáng**) (N4).
- **Đầu trang:** không ai sở hữu khung trang chung (X6); Báo cáo thừa hưởng 3 hàng của trang Phân tích.

**3. Ảnh hưởng:** Chị Vy chiếu giao ban: nền tối, số 20 px, chữ 12 px — người ngồi xa không đọc được; mất màu SOS nên không nhìn ra lớp có SOS 3; giải thích số phải đổi trang (V3B-03); in thiếu dòng.

**4. Liên quan:** A5-07, A5-09, A5-13, A5-16, A5-18, A5-19, A5-36, 9.2-32 (nút "Chiếu"), X6 (khung trang), V1 thang chữ, V3B-01/02/03/09.

**5. Đánh giá lại chính mockup (impeccable critique) — tách 4 loại**
| Loại | Điểm |
|---|---|
| **(a) Web sai / thiếu so mockup** — sửa theo mockup | #2 đầu trang một hàng · #3 chế độ chiếu (sáng, chữ lớn) · #5 #9 #10 #11 ô số + chữ ngang · #7 chip SOS màu + "tạm" viền đứt + hàng tổng nhấn · #14 cột "Kỹ năng cần cải thiện" + nút việc + xem nhận xét trong panel · #15 panel kết quả cụ thể · #16 đầu trang 375 · #18 "Dữ liệu đến" khi in |
| **(b) Mockup đúng, nên giữ** | lưới 7/5 + 4/4/4 vừa một màn · tách "trong kỳ" ↔ "tại 17/10" ghi rõ trên khối · "So 2 tuần trước" chữ trung tính · bỏ Đã thi – Chờ KQ · Quá hạn theo GV một bảng nhỏ |
| **(c) Nâng cấp được so mockup** | 1) Panel Chưa đạt của mockup **cũng tràn** (10 cột, tên xuống 3 dòng, nút bị cắt — ảnh `mk3-bc--panel.png`) → gộp "R 5.5/6.0 · thiếu 0.5" thay 6 cột điểm, 5 cột như V3B-03. 2) Mockup vẽ "⚠ 43 bài quá hạn" trong Báo cáo — đó là số **việc tới hôm nay** trộn vào báo cáo kỳ (II.3) → đổi thành "bài **chấm trễ trong kỳ**" (đếm bài có hạn trong kỳ mà chấm sau hạn, kể cả đã chấm) — đúng nghĩa đánh giá kỳ, không đổi khi in lại. 3) Hai khối "HV cần chú ý · tại" và "Case / PA · tại" là **ảnh chụp hiện tại**: với kỳ cũ (A5-36) ẩn hoặc ghi "số hôm nay". 4) QT "Tất cả chi nhánh": thêm bảng **"Theo chi nhánh"** (một dòng / chi nhánh, cùng 6 số) — mockup không vẽ, a5 3.2 đã đề xuất. 5) Thời gian theo II.5 (bỏ 4 kiểu). |
| **(d) Đề xuất mới cần duyệt** | 1) Nút **"Chiếu"** (9.2-32) = toàn màn, nền sáng, thang chữ lớn (số 40, nhãn 17), ẩn thanh trên + tab, mũi tên trái / phải chuyển khối; Esc thoát. 2) Báo cáo **lớp thường** có khối "Kết quả Progress / Final" (A5-22, 9.2-29). 3) In gồm cả FT + Lớp thường một lần (a5 Phần 3). |

**6. Ưu / nhược hai cách sửa**
| | **K1 — dựng lại màn theo khung (một PR màn M6, ảnh cặp)** | K2 — vá từng chỗ (đổi `So`, thêm màu chip) |
|---|---|---|
| Khớp sau sửa | ~90 % (cổng Q4) | ~60 % — đầu trang 4 hàng còn nguyên |
| Rủi ro tái phát | thấp nếu có ảnh cặp + chủ SP duyệt (9.1-2) | cao (đúng chuỗi N1–N4 lần trước) |
| Công | 1 PR màn + PR máy chủ cho panel (V3B-03) | nhiều PR nhỏ |

**7. Đề xuất: K1 — kế hoạch có hệ thống**
1. **PR tài liệu**: sửa mockup 3 khung 3 theo (c) (panel 5 cột, "chấm trễ trong kỳ", bỏ 4 kiểu thời gian, thêm "Theo chi nhánh") + vẽ khung "Chiếu" (d1) → chủ SP duyệt.
2. **Máy chủ trước** (tự merge được): sửa A5-02 (PA trong kỳ), nguồn panel trả cột cụ thể (V3B-03), số "chấm trễ trong kỳ" (nếu duyệt), bảng "Theo chi nhánh".
3. **PR màn Báo cáo** (M6 — sau M0 khung trang + NEN thang chữ + `OSo`): bảng truy vết 18 dòng ở trên (thêm dòng BỎ: hàng tiêu đề riêng "Báo cáo …", số gạch chấm, `Khoi` dọc) → ảnh cặp 1440 tối + 375 sáng + Chiếu → cổng ≥ 90 % → chủ SP duyệt.
4. Phép kiểm: "in đủ dòng", "số = dòng panel", "Chiếu không cuộn ngang ở 1 280".

**8. Nghiệp vụ:** không đổi luật. "Bài chấm trễ trong kỳ" là **định nghĩa số mới** → chủ SP quyết (Q6).

**9. Cần xác nhận:** Q5 (K1 + nút Chiếu) — **có**; Q6 (thay "bài quá hạn tới hôm nay" bằng "bài chấm trễ trong kỳ" ở Báo cáo) — **có**.

---

## V3B-05 Mục đích từng bảng Phân tích + trộn báo cáo ↔ việc (II.3) · [ĐÃ CHỐT nguyên tắc; ĐỀ XUẤT từng bảng] · P1

**1. Vấn đề [ĐÃ KIỂM]** — kiểm kê 11 bảng (ảnh `pt-*.png`, mã `phanTich/*.tsx`):

| Bảng (tab) | Mục đích thật · người dùng | Kết luận cần rút ra | Cột nay | Cột cần | Cột thừa / sai chỗ (việc) | Trình bày tốt hơn |
|---|---|---|---|---|---|---|
| Báo cáo › Test (3 số + Quá hạn theo GV) | QL giao ban: kỳ vừa qua chấm có kịp không | "chấm xong bao nhiêu %, GV nào trễ" | HV đã thi · bài đã chấm x/y · ⚠ bài quá hạn · bảng GV | giữ; "bài chấm trễ trong kỳ" | "bài quá hạn" (tới hôm nay = việc) | ô số ngang (V3B-04) |
| Báo cáo › SOS theo lớp | QL: lớp nào nhiều SOS, tăng hay giảm | "lớp X tăng 2 SOS 3" | Lớp · SOS 1-3 · So kỳ trước | giữ | — | chip màu như mockup; thanh nhỏ ở "Cả Monbay" không cần |
| Báo cáo › Kết quả Mock | tỉ lệ đạt kỳ | "56 % đạt" | 3 số | giữ | — | ô số + chữ ngang; tỉ lệ thành thanh ngang một màu (dataviz: một chỉ số so giới hạn → meter) |
| Báo cáo › HV cần chú ý · tại | **việc hiện tại** | — | chưa lịch · chưa điểm · Case chưa chốt PA | — | **cả khối là việc** | giữ trong Báo cáo (mockup (b), ghi "tại"), số C; kỳ cũ ẩn |
| Báo cáo › Case / PA | Case mở (hiện tại) + PA có kết quả (kỳ) + quá hạn (việc) | "PA chạy có kết quả không" | 3 số | "PA có kết quả trong kỳ · n cải thiện" | "⚠ quá hạn" là việc | tách: kỳ → khối Kết quả; việc → khối "tại" |
| Test + SOS | QL / QT: xu hướng kết quả theo tuần / lớp / đợt / chi nhánh | "tuần nào / lớp nào nhiều SOS, kỹ năng nào dưới kỳ vọng" | Lượt · Đạt · SOS 1-3 · Thiếu điểm · L R W1 W2 S · HV-Case · Chưa chốt PA (⚠) · Đang xử lý (14 cột số) | Lượt · Đạt kỳ vọng n/m % (mockup 4) · SOS 1-3 · L R W S (W gộp) · So 8 tuần trước | **HV - Case, Chưa chốt PA ⚠, Đang xử lý** = tình trạng việc **hôm nay** ("Tính theo hôm nay, không phải lúc chấm" — `phanTich.ts:252`) | bỏ 3 cột việc (số Case ở Báo cáo / Tổng quan); mockup 4 thêm "Đạt kỳ vọng %" + "So 8 tuần trước" — khớp kết luận |
| Kết quả thi › Mock | QL / Admin tra kết quả từng lượt, lọc Đạt / Chưa đạt | "em nào chưa đạt, hụt kỹ năng gì" | Học viên · Lớp · MT · tuần · OVR · L R W S · Kỳ vọng · Kết quả · SOS · **Case / PA** · **Việc tiếp** | thêm "Kỹ năng hụt" (mockup 3) nếu bỏ cột việc | **Case / PA, Việc tiếp** (việc — link đổi trang sang Case) | bỏ 2 cột việc → còn 11 cột, vừa 1 280 không cuộn |
| Kết quả thi › Thi thật | kết quả thi thật + Bước tiếp | "ai đạt Target" | … · Bước tiếp · Người chọn | — | **Bước tiếp chọn ngay trên hàng** = việc (mockup 6 chốt) | **giữ** (chủ SP duyệt mockup 6 khung 6; đây là bảng theo dõi kết quả + quyết định — ngoại lệ có lý do) — hỏi Q7 |
| Hiệu quả PA | QL: loại PA nào giúp em tiến bộ cho từng vấn đề | "Tutor hiệu quả với Writing · tổ chức ý" | Vấn đề / loại PA · Số PA · HV · Có cải thiện · Thời gian · Nên dùng; chân: PA chờ kết quả · Case chưa phân nhóm · PA chưa rõ nơi học | xem V3B-10 | **chân bảng** = việc làm sạch dữ liệu (PA chờ kết quả là việc của GV) | V3B-10 |
| Phân tích GV | QL / Admin: GV nào đúng hạn, kết quả môn | "GV A chấm trễ 57 %" | 12 cột 2 tầng | khung 4c (A5-11) | "Đúng hạn" = **đánh giá việc đã làm** (hợp lệ trong phân tích GV — không phải việc đang chờ) | 4c; giữ |
| Ý thức › Học viên cần chú ý | **hàng đợi xử lý** (Quá hạn · Bắt buộc · Chờ QL duyệt · Bậc kế) | — | Học viên · Lớp · **Trạng thái** · Bậc hiện tại · **Bậc kế** · Vi phạm · **Chưa xử lý** · Lần xử lý gần nhất (+ "QL từ chối") | — | **cả bảng là việc** (V3B-06) | bỏ khỏi Phân tích |
| Ý thức › Lớp nhiều vi phạm | QL: lớp nào nhiều vi phạm, loại gì, tăng hay giảm → nói với GVCN | "MB FT 101 tăng 24 vi phạm, chủ yếu BTVN" | Lớp / nhóm · Vi phạm · **Chưa xử lý** · HV có vi phạm / sĩ số · ± kỳ trước · GVCN | Vi phạm · HV có vi phạm / sĩ số · loại nhiều nhất · ± kỳ trước (chữ trung tính) · GVCN | **Chưa xử lý** (việc); "±" đỏ / xanh mũi tên (trái mockup 4 — A5-29) | thanh ngang một màu ở cột Vi phạm (so lớp) |

- Đếm: **5/7 nhóm bảng** có cột / khối việc (Báo cáo ×2, Test + SOS, Kết quả thi, Hiệu quả PA chân, Ý thức ×2).
- **Căn lệch** ở bảng dùng `HangNhom` / `HangCon` [ĐÃ KIỂM DOM `NEW\do\v3b-do.json`]: Hiệu quả PA cột số **45–47 px** (tiêu đề giữa, số phải); Ý thức "Lớp nhiều vi phạm" **48–53 px**; Test + SOS lệch ~20 px nhìn ảnh (tiêu đề 2 tầng làm công cụ đo đo sai — không lấy số). Bảng `td` thường (Báo cáo, Ý thức HV, Tutor) **0 px**. Cùng gốc 11.1a R2 (`index.css:267`) → BANG-0/1 phủ, thêm 3 bảng này vào danh sách chuyển.

**2. Nguyên nhân:** mỗi bảng sinh ra cùng lúc với một việc cần theo dõi (PR-HK2 thêm nhóm "Xử lý" 07/10; PR-YT4 "Học viên cần chú ý" theo cửa trạng thái); chưa có luật "báo cáo thuần" (vừa chốt vòng 3).

**3. Ảnh hưởng:** số việc trong bảng phân tích **đổi theo giờ xem, không theo kỳ** → in báo cáo kỳ cũ ra số hôm nay (A5-36); hai nơi một việc (Công việc / Tổng quan và Phân tích) khác số; bảng rộng 14 cột cuộn ngang ở 1 280 / 375.

**4. Liên quan:** X4 (trùng việc), A5-03/04/36, V3B-06, V3B-10, Tổng quan B (nơi việc QL nên nằm), Công việc.

**5. Phương án**
| | Mô tả |
|---|---|
| **T1 — tách hẳn** | bảng phân tích chỉ số **đã xảy ra trong kỳ**; mọi cột việc bỏ (dữ liệu giữ); việc ở Tổng quan "Cần bạn quyết" / Công việc / hồ sơ. Ngoại lệ có lý do: Thi thật · Bước tiếp (mockup 6), khối "tại" của Báo cáo (mockup 3 (b)). |
| T2 — giữ cột việc, làm C | mỗi cột việc thành ô số mở panel C | bảng vẫn 14 cột; số việc vẫn không theo kỳ |
| T3 — công tắc "Hiện cột xử lý" | mặc định ẩn | thêm điều khiển (trái V "đừng thêm bộ lọc chỉ vì có thể") |

**6. Ưu / nhược (Chị Vy giao ban, Admin tra cứu):** T1: bảng Test + SOS 14 → 11 cột, vừa 1 280, số in ra không đổi theo giờ; xử lý việc vẫn 1 bấm từ Tổng quan. T2: mỗi việc có 2 lối (dễ trùng, đúng X4). T3: thêm một lựa chọn mà người mới không hiểu.

**7. Đề xuất: T1.**

**8. Nghiệp vụ:** không đổi luật, không xoá dữ liệu; chỉ đổi chỗ hiển thị.

**9. Cần xác nhận:** Q3 — **T1**; Q7 (Thi thật giữ Bước tiếp trên hàng) — **giữ**.

---

## V3B-06 Bảng Ý thức: vì sao có "quá hạn / trạng thái / bậc kế", bỏ khỏi Phân tích (II.3 đặc biệt) · [ĐỀ XUẤT] · P1

**1. Vấn đề [ĐÃ KIỂM]** (ảnh `pt-yt-ql-p1.png`, `pt-yt-ql-pn-mo.png`, `pt-yt-ql-375-p1.png`)
- "Học viên cần chú ý" = em đang ở nhóm **Quá hạn · Bắt buộc xử lý · Chờ QL duyệt** của **cửa trạng thái hiện tại** (`server/src/phanTich/yThucPhanTich.ts:116-139`, `trangThaiYThuc(…, homNay)`). Chỉ cột "Vi phạm" theo khoảng; "Trạng thái", "Chưa xử lý" (`:124` — không lọc ngày), "Bậc kế", "Lần xử lý gần nhất · QL từ chối" đều **tại hôm nay**.
- Panel từ "Chưa xử lý 3": danh sách vi phạm, mở dòng chỉ lặp chữ + "Mở trang ↗" — **không làm được gì** (không Xác nhận xử lý, không Ghi nhận).
- "Lớp nhiều vi phạm" có cột "Chưa xử lý" (việc) và "± kỳ trước" mũi tên đỏ / xanh (A5-29).
- [CẦN ẢNH] chủ SP nói "**báo trễ**": tab Ý thức **không có chữ "trễ"**; chữ gần nhất là "Quá hạn" (chip đỏ), "Chờ QL duyệt", "QL từ chối", và ở Phân tích GV cột "Đúng hạn › Xử lý vi phạm". Nếu ý chủ SP là cột Phân tích GV → xem 9.2 (cột đó đánh giá **việc GV đã làm**, hợp lệ trong phân tích GV).

**2. Ai đặt ra và vì sao [ĐÃ KIỂM — mã + chú thích]**
- PR-UX4 (mockup 16 §5, Q14–Q16): Ý thức có "Học viên cần chú ý" + "Lớp nhiều vi phạm"; ý định: QL **nhìn nhanh em nào cần xử lý** khi xem thống kê.
- PR-YT4 (K1-25, K1-26): đổi định nghĩa "cần chú ý" từ luật 8 tuần / Thư CC sang **3 nhóm của cửa trạng thái** + bậc hiện tại / bậc kế — từ đó bảng thành **hàng đợi việc**, không còn là thống kê.
- "Phối hợp SOS" đã được đưa ra khỏi đây sang Việc của GVCN (`shared/domain/phanTich.ts:33`) — tức đã có tiền lệ "việc không ở Phân tích".

**3. Ảnh hưởng:** QL vào Phân tích thấy 6 em "Quá hạn / Bắt buộc" nhưng không xử lý được tại đó; phải sang hồ sơ (6 bấm + 1 đổi trang). Cùng tập em này đã có ở Hồ sơ lớp › Ý thức (nhóm "QUÁ HẠN · 3 · BẮT BUỘC GỬI · 2 · CHỜ QL DUYỆT · 1" — ảnh 2 vòng 2), Công việc (việc "Xử lý vi phạm" có hạn), Tổng quan (nếu 10.2 B làm nhóm "Vận hành quá hạn") → **3–4 nơi một việc** (X4). Tệp Xuất Excel sheet 1 xuất trạng thái hôm nay dưới tiêu đề có khoảng thời gian → hiểu nhầm.

**4. Liên quan:** V2B-6 (Ý thức hồ sơ lớp phương án A: một bảng theo em, mặc định "Cần làm"), V2B-8 (hồ sơ HV), Công việc nhóm Ý thức (CV-15), V3B-07 (xuất), A5-29.

**5. Phương án**
| | Mô tả |
|---|---|
| **Y1 — Phân tích Ý thức chỉ còn thống kê** | bỏ bảng "Học viên cần chú ý"; giữ "Lớp nhiều vi phạm" → đổi tên **"Vi phạm theo lớp"**, bỏ cột "Chưa xử lý", thêm "Loại nhiều nhất"; thêm một hàng **"Theo loại vi phạm"** (Chuyên cần · BTVN · Thái độ · Kỷ luật — số, ± kỳ trước) và **"Xử lý đã làm trong kỳ theo loại"** (đang chỉ có trong Excel). Việc xử lý ở Hồ sơ lớp › Ý thức (A) + Công việc. Một dòng chữ đầu tab: "6 em đang chờ xử lý — ở Hồ sơ lớp › Ý thức ›" (D, lọc chi nhánh) để không ai lạc. |
| Y2 — giữ bảng, làm panel C | nút Xác nhận xử lý ngay tại Phân tích | thêm nơi thứ 4 cho cùng việc |
| Y3 — giữ nguyên, ghi "tại hôm nay" | ít công | vẫn trộn; số in ra vẫn đổi |

**6. Ưu / nhược (QL Monbay):** Y1: Phân tích Ý thức trả lời "lớp nào / loại nào tăng" trong 1 màn; xử lý một em = từ dòng chữ "6 em đang chờ ›" 1 bấm tới Hồ sơ lớp (đã lọc) + 2–3 bấm làm (≈ cùng số bước Y2) nhưng **một nơi xử lý**. Y2: nhanh hơn 1 bấm nhưng 4 nơi. Y3: không giải quyết.

**7. Đề xuất: Y1.**

**8. Nghiệp vụ:** không đổi luật (cửa trạng thái, thang 6 bậc, hạn 5 ngày giữ). Không xoá dữ liệu. Tệp Excel đổi theo V3B-07.

**9. Cần xác nhận:** Q8 (Y1) — **có**; Q9 [CẦN ẢNH] "báo trễ" chủ SP thấy ở đâu (chụp vùng đó).

---

## V3B-07 Xuất Excel toàn web: mục đích, cột, phạm vi (II.4) · [ĐÃ KIỂM mã + bấm mở panel] · P2

**1. Vấn đề — kiểm kê 11 lối XUẤT** (tách bạch với NHẬP — Tải danh sách tutor, Dán từ Excel thuộc agent khác)
| # | Chỗ · vai | Tệp:dòng | Dựng ở | Cột hiện xuất | Theo bộ lọc đang áp? | Mục đích · người dùng tệp | Cột đề xuất | Cột bỏ |
|---|---|---|---|---|---|---|---|---|
| 1 | Học viên & Lớp › "Xuất Excel · n HV" (QL, QT, GV) | `students/StudentsPage.tsx:350` → `NganXuatDs.tsx:56` → `server/src/classes/xuatDanhSach.ts:35-163` | máy chủ (+ nhật ký `hoc_vien.xuat_excel`) | 3 mẫu: Cơ bản 4 cột · Theo dõi SOS 11 · Kết quả thi 8 (+ chọn trong 18 cột `lichThiOv15f.ts:90-103`) + sheet "Thông tin xuất" | một phần — ô tick "Chọn tất cả" chỉ lấy lớp **đang mở ở trang này** (V2A-05) | gửi danh sách cho TVV / phụ huynh / họp | giữ mẫu; đổi "Ghi chú họp" → "Ghi chú" (chốt vòng 2) | "Kết luận" (nếu bỏ "Cần xác nhận" — 11.8-6) |
| 2 | Học viên & Lớp › Lịch thi | `GocLichThi.tsx:117, 165` | như #1 | mẫu Cơ bản | theo tháng đang chọn ✓ | danh sách thi tháng | thêm "Thi thật" (A/B — V2A-08) | — |
| 3 | Học viên & Lớp (TVV / CX) + Đang SOS | `HocVienTheoVai.tsx:258, 324` | như #1 | mẫu "Theo dõi SOS" khi ở Đang SOS | ✓ | theo dõi SOS | — | — |
| 4 | Test › Kế hoạch Test › "Xuất Excel" (QL) | `KeHoachTestTab.tsx:201, 228` → `keHoach/NganXuatKeHoach.tsx` → `server/src/keHoach/keHoachTest.ts:1364-1412` | máy chủ (+ nhật ký) | `Gmail · Tên học sinh · Lớp · MT1…MT10` (ô = **lịch**, không phải điểm) | lớp ✓, tuần ✓; **"Chỉ cần xếp lại" chỉ lọc lớp, tệp vẫn mọi em của lớp** (`KeHoachTestTab.tsx:99-102`, server nhận `classIds` — `:1338-1341`) | gửi lịch MT cho GV / em | thêm "Tên" trước "Gmail" (cùng thứ tự #1) | — |
| 5 | Test › Kế hoạch Test › "Xuất điểm Test" (QL) | `keHoach/NganXuatDiem.tsx:55-70` → `keHoachTest.ts:1417-1471` | máy chủ | 14 cột `Tên học sinh · Gmail · Lớp · MT · Tuần thi · L R W1 W2 W S · OVR · Kỳ vọng · Kết quả` (+ 2 cột nhận xét) | bộ lọc riêng trong panel | gửi điểm / lưu hồ sơ | "Tuần thi" → "Tuần Test" (11.1d) | — |
| 6 | Test › Lịch Test › "Xuất Excel" → "Xuất kết quả Test" (QL, **GV** — nav `xuatMt`) | `LichTestTab.tsx:296, 384-386` → `NganXuatMt.tsx` → `/xuat-mt` | máy chủ | Gọn 16 cột `Tên · Email · Chi nhánh · Lớp · Lộ trình · MT · Tuần · L R W S · Overall · Target · Kỳ vọng · SOS · Trạng thái lượt`; Đầy đủ +~30 (tiêu chí W / S, tuần từng kỹ năng, Người nhập, 6 cột nhận xét, nhóm nguyên nhân, GV chấm S) (`shared/domain/xuatMt.ts:135-142`) | **lệch**: trang xem **một tuần** (W3 SEP), tệp mặc định **từ tuần đầu tháng → tuần đang xem** (`tuanDauThangCua`); trang "Tất cả" (FT + LT) → tệp chỉ **Fast Track** (`loai ?? 'ft'`) | QL lưu / gửi kết quả | mặc định = đúng tuần đang xem + khung đang chọn | "SOS 0" trong xem trước → "—" (ảnh `tg-xuat-kq-test-lich-test-ql--c-sau-bam-ngay.png`) |
| 7 | Hồ sơ lớp › ⋯ › Xuất kết quả Test | `classes/ClassOverviewPage.tsx:155-157` | như #6 | như #6, mặc định **theo đợt** (MT1…) | lớp ✓ | lưu kết quả lớp | — | — |
| 8 | Phân tích › Test + SOS › ⋯ "Xuất bảng này" (QL, QT, Admin) | `TongHopTestSos.tsx:142-155` · `shared/domain/phanTich.ts:505-522` | **trình duyệt, không nhật ký** | đúng cột đang hiện (Cột hiện) + mọi hàng kể cả hàng con chưa mở + Tổng; dòng 1 ghi bộ lọc ✓ | ✓ | báo cáo tuần / tháng | bỏ 3 cột Xử lý (theo V3B-05) | HV có Case, Case, Chưa chốt PA, Đang xử lý |
| 9 | Phân tích › Test + SOS › ⋯ "Xuất kết quả từng lượt" | `TongHopTestSos.tsx:190, 307-310` | như #6 | như #6 | khoảng + khung + lớp của trang ✓ | — | — | — |
| 10 | Phân tích › Kết quả thi › Mock "Xuất Excel · n lượt" + panel Báo cáo | `KetQuaThi.tsx:68-80, 113` | trình duyệt, không nhật ký | 14 cột `Học viên · Lớp · MT · Tuần · OVR · L R W S · Kỳ vọng · Kết quả · SOS · Case / PA · Việc tiếp` | theo chip Kết quả ✓, khoảng ✓; **tên tệp không có chi nhánh / khoảng** (`ket-qua-thi-mock-14-09-2026.xlsx`); **Thi thật không có Xuất** | tra cứu kết quả (Admin VP) | thêm Email (định danh như #6), Chi nhánh | Case / PA, Việc tiếp (việc, đổi theo giờ) |
| 11 | Phân tích › Ý thức "⤓ Xuất Excel" (QL, QT) | `YThucPhoiHop.tsx:45-74` | **trình duyệt, không nhật ký** | 3 sheet: "HV cần chú ý" 10 cột (`Học viên · Email · Lớp · Trạng thái · Bậc hiện tại · Bậc kế · Vi phạm · Chưa xử lý · Lần xử lý gần nhất · Ngày` — `phanTich.ts:477`) · "Lớp nhiều vi phạm" 7 cột · "Xử lý theo loại" (**không có trên màn**) | khoảng ✓ lớp ✓; sheet 1 là **tình trạng hôm nay** dưới tiêu đề có khoảng | ? (họp kỷ luật / gửi GVCN) | theo V3B-06: "Vi phạm theo lớp" · "Theo loại vi phạm" · "Xử lý đã làm theo loại" | sheet "HV cần chú ý" (email + tình trạng kỷ luật từng em) |
- Không có Xuất: Báo cáo (chỉ In), Hiệu quả PA, Phân tích GV (A5-11), Kết quả thi › Thi thật, Tutor, Hồ sơ GV. "⤓ Tải mẫu" ở Tải danh sách tutor là **tệp mẫu để nhập**, không phải xuất.
- **Tên cột 5 bộ:** "Tên" (#6) · "Tên học sinh" (#1, #4, #5) · "Học viên" (#10, #11); "Email" (#6, #11) · "Gmail" (#1, #4, #5); "Overall" (#6) · "OVR" (#5, #10); "Tuần" (#6, #10) · "Tuần thi" (#5); thứ tự "Gmail" đầu (#4) ↔ "Tên" đầu (mọi tệp khác).

**2. Nguyên nhân:** mỗi PR thêm một lối xuất với bộ cột riêng (C17, C31, T40, Q13, OV-13f); hai kiểu dựng (máy chủ có nhật ký / trình duyệt không); không từ điển cột chung; mặc định của panel xuất không lấy đúng bộ lọc trang gọi.

**3. Ảnh hưởng:** Admin văn phòng ghép tệp từ hai nơi phải đổi tên cột; QL xuất "tuần này" ở Lịch Test nhận cả tháng; tệp Ý thức mang email + tình trạng kỷ luật từng em **không để lại dấu vết** ai xuất (trái thói quen các tệp máy chủ đang ghi nhật ký).

**4. Liên quan:** TST-04 (3 lối xuất điểm), V2A-05 (ô tick), 11.1d (chữ "thi"), V3B-05 / 06, agent Test (NHẬP Excel — I.5).

**5–6. Phương án**
| | Mô tả | Ưu / nhược |
|---|---|---|
| **E1 — một từ điển cột + một luật phạm vi** | `COT_XUAT` chung (Tên · Email · Chi nhánh · Lớp · …), mọi tệp lấy tên từ đây, thứ tự "Tên · Email" đầu; panel xuất **mặc định = bộ lọc trang gọi** (khung, lớp, khoảng tuần), đổi được trong panel; nút ghi số "Xuất · n lượt" bằng cùng hàm xem trước; mọi xuất **đi máy chủ + nhật ký**; bỏ cột việc khỏi tệp phân tích | sửa một lần cho 11 lối; tệp ghép được |
| E2 — chỉ sửa 3 lỗi (phạm vi #4, #6; nhật ký #11) | ít công | tên cột vẫn 5 bộ |

**7. Đề xuất: E1**, làm cùng PR gộp panel xuất (TST-04, M5) + PR màn Phân tích (M6).

**8. Nghiệp vụ:** không đổi luật. **Bảo mật / riêng tư:** tệp có email + kỷ luật nên ghi nhật ký (đề xuất, chủ SP quyết).

**9. Cần xác nhận:** Q10 (E1 + mọi xuất ghi nhật ký) — **có**; Q11 (bỏ sheet "HV cần chú ý" khỏi tệp Ý thức) — **có**.

---

## V3B-08 Thời gian Phân tích: "Toàn bộ" + "Chọn khoảng tuần", mặc định từng bảng (II.5) · [ĐÃ CHỐT hai chế độ; ĐỀ XUẤT mặc định] · P1

**1. Vấn đề [ĐÃ KIỂM]:** bộ chọn nay 4 kiểu (2 tuần vừa qua · Theo tuần · Theo tháng · Tùy chọn), một mặc định cho cả 6 tab (2 tuần hoàn chỉnh, C24) → Hiệu quả PA gần trống (A5-21: 26 tuần vẫn chỉ 10 PA, ảnh `pt-pa-ql-26t-p1.png`), Tutor rỗng (A5-06), Phân tích GV chỉ nhận 13 tuần (A5-14). Vòng 2 đề xuất `Khoảng tuần` (V2A-01) **chưa có "Toàn bộ"**.

**2. Nguyên nhân:** C29 chốt "một bộ chọn, giữ khi đổi tab" — đúng cho nhất quán nhưng ép một mặc định cho bảng có nhịp dữ liệu khác nhau (Test 2 tuần / MT ~4 tuần / PA kết thúc sau 2–6 tuần / Thi thật vài tháng). Trần **52 tuần** cả web + máy chủ ("bảng mở nhanh, Turso đọc vừa phải" — `shared/domain/khoangThoiGian.ts:17-18`, `phanTich.ts:384`).

**3. Ảnh hưởng:** mở tab ra trống / mỏng → người dùng tưởng không có dữ liệu; đổi khoảng 5 thao tác (V2A-01) — và hiện **không đổi được bằng lịch** (V3B-09).

**4. Liên quan:** V2A-01 (`Khoảng tuần`), 11.1b, 11.8-10, A5-06/13/14/21, V3B-09, V3B-10, V3B-11.

**5. Phương án — hợp nhất với `Khoảng tuần`**
```
Thời gian  [Toàn bộ | Khoảng tuần]   ‹ [W1 SEP ▾] → [W2 SEP ▾] ›   Mặc định
```
- Hai chế độ là **hai nút đoạn** đứng trước hai ô tuần. "Toàn bộ" → hai ô thành chữ "Toàn bộ · 22/06 – 13/09/2026" (khoảng có dữ liệu thật, đọc từ máy chủ) — người đọc biết "toàn bộ" là từ đâu.
- **Nghĩa "Toàn bộ"** = từ **tuần đầu có dữ liệu của bảng đó trong phạm vi đang lọc** (chi nhánh + chương trình + lớp) → hết tuần này. Chọn **một lớp** → từ tuần khai giảng lớp. Cột "So kỳ trước" ẩn khi Toàn bộ (không có kỳ trước).
- Đổi tab: chế độ / khoảng **người dùng đã chọn** giữ (C29); nếu chưa chọn gì (URL không `tu/den`) thì mỗi tab dùng **mặc định của tab** (bảng dưới). Nhãn "Mặc định" trả về mặc định tab.

| Bảng | Câu hỏi | Mặc định đề xuất | Lý do | "Toàn bộ" nghĩa là |
|---|---|---|---|---|
| Báo cáo | 2 tuần vừa xong ra sao | **2 tuần hoàn chỉnh trước** (W−2 → W−1) | giữ C24; kỳ báo cáo cố định, tuần này chưa chấm xong | từ đầu dữ liệu chi nhánh (dùng cho báo cáo quý / năm) |
| Test + SOS | xu hướng theo tuần / lớp | **8 tuần hoàn chỉnh** (W−8 → W−1) | mockup 3 khung 4 vẽ 8 tuần; trước PR #462 mặc định cũng 8 tuần ("Test + SOS mặc định 8 tuần → 2 tuần" — mô tả PR); 2 tuần không thấy xu hướng | từ tuần Test đầu tiên |
| Kết quả thi › Mock | lượt gần đây ai chưa đạt | **4 tuần gồm tuần này** | mỗi lớp có ≥ 1 lượt MT trong ~4 tuần → không lớp nào biến mất; tuần này đang chấm vẫn cần tra | mọi lượt (có phân trang) |
| Kết quả thi › Thi thật | ai đạt Target | **Toàn bộ** | thi thật thưa, vài em / tháng; 2 tuần thường rỗng (A5-25) | mọi kỳ thi thật trong phạm vi |
| Hiệu quả PA | loại PA nào hiệu quả | **Toàn bộ** | cần mẫu đủ (≥ 5 PA mới xếp hạng — `NGUONG_IT_DU_LIEU`); 2 tuần ≈ 0 | mọi PA đã kết thúc |
| Phân tích GV | GV đúng hạn không | **4 tuần hoàn chỉnh** | một chu kỳ MT; máy chủ nhận ≤ 13 tuần (A5-14) | **không có** "Toàn bộ" (trần 13 tuần) — hoặc nâng trần (hỏi) |
| Ý thức (vi phạm theo lớp) | lớp nào tăng vi phạm | **4 tuần hoàn chỉnh** | 2 tuần ít vi phạm, "± kỳ trước" dao động mạnh | từ vi phạm đầu tiên |
| Tutor + panel tutor | tutor nào cần chú ý, dạy bao nhiêu | **4 tuần gồm tuần này** | buổi tutor theo PA kỳ 2 tuần; gồm tuần này để buổi vừa ghi hiện ngay (sửa A5-06 phần thời gian) | mọi buổi |
| Bộ lọc thêm › "Thời gian" (HV & Lớp) | lọc em theo thời điểm kết quả | **Toàn bộ** (= không lọc) | đúng hành vi hiện tại "Mọi lúc"; bỏ chip "Mọi lúc ✕" nói ngược (V2A-01) | không lọc |
| Panel Xuất kết quả Test | — | **= khoảng trang gọi** (Lịch Test: đúng tuần đang xem) | sửa lệch V3B-07 #6 | mọi lượt |
| Lịch Test · Góp ý tuần · Báo cáo đơn vị | làm việc theo một tuần | dáng **một tuần** (V2A-01) | — | **không** áp |
| Lịch thi | tháng dự kiến | đơn vị **tháng** (11.8-7) | nghiệp vụ | **không** áp |
| Đang SOS | SOS hiện tại | **không bộ lọc thời gian** (9.1-4) | — | — |

- **"Toàn bộ" ngoài Phân tích:** áp ở **Tutor, Bộ lọc thêm, panel Xuất** (đều là "xem / lấy dữ liệu đã xảy ra"); **không** áp ở màn làm việc theo tuần (Lịch Test, Góp ý tuần, Báo cáo đơn vị), Lịch thi (tháng), Đang SOS.

**6. Ưu / nhược**
| | **Phương án trên (mặc định theo bảng)** | Một mặc định chung (2 tuần) + Toàn bộ |
|---|---|---|
| Mở Hiệu quả PA | có dữ liệu ngay (0 thao tác) | trống → 2 thao tác |
| Đổi tab giữ khoảng (C29) | giữ khi người dùng đã chọn | giữ |
| Nguy cơ hiểu nhầm | mỗi tab một khoảng → nhãn khoảng luôn hiện trên đầu bảng (đã có ở Hiệu quả PA "Fast Track · Monbay · W3 MAR – W2 SEP") | ít |
| Hiệu năng | "Toàn bộ" có thể > 52 tuần | — |

**7. Đề xuất:** phương án trên. Máy chủ: `tu` rỗng = Toàn bộ; trả `khoangThat {tu, den}` để web ghi nhãn. Trần 52 tuần: giữ cho "Khoảng tuần"; với "Toàn bộ" đo thật trên DB lớn nhất trước khi bỏ trần (ghi `ponytail:` nếu kẹp).

**8. Nghiệp vụ:** không đổi luật. Đổi C24 ở 4 tab (Báo cáo giữ).

**9. Cần xác nhận:** Q12 (bảng mặc định + "Toàn bộ" áp Tutor / Bộ lọc thêm / Xuất) — **đồng ý cả gói**; Q13 (trần 52 tuần với "Toàn bộ") — **đo trước, kẹp 104 tuần nếu chậm, ghi rõ trên nhãn**.

---

## V3B-09 Lỗi: bấm trong lịch tuần là cả bộ chọn đóng (II.6) · [LỖI — ĐÃ KIỂM tái hiện] · **P1**

**1. Vấn đề — tái hiện** (script `NEW\chup\v3b-tg.mjs`, kết quả `NEW\anh\v3b\tg-ket-qua.json`; mỗi chỗ: mở bộ chọn → "Theo tuần" → bấm nút lịch ô "Từ tuần" → bấm ‹ "Tháng trước" → mở lại → bấm một ngày)
| Chỗ (vai) | Lịch mở? | Bấm ‹ trong lịch | Bấm một ngày | Kết quả | Ảnh trước / sau |
|---|---|---|---|---|---|
| Phân tích › Báo cáo (QL 2, 1440) | có | **hộp đóng + lịch đóng** | **hộp đóng, tuần không đổi** (nhãn vẫn W1 + W2 SEP) | **BỊ** | `tg-phan-tich-ql--a-lich-mo.png` → `--b-sau-bam-thang-truoc.png` → `--c-sau-bam-ngay.png` |
| Phân tích (QL 2, 375) | có | đóng | đóng, không đổi | **BỊ** | `tg-phan-tich-ql-375--*.png` |
| Tutor (QT 1) | có | đóng | đóng, không đổi | **BỊ** | `tg-tutor-qt--*.png` |
| Panel một tutor (QT 1) | có | hộp đóng (panel còn) | đóng, không đổi | **BỊ** | `tg-tutor-panel-qt--*.png` |
| Học viên & Lớp › Bộ lọc thêm › "Tuần thi của kết quả" (QL 2) | có | đóng | đóng, không đổi | **BỊ** | `tg-hvl-bo-loc-them-ql--*.png` |
| Test › Lịch Test › Xuất kết quả Test (panel) | có | **lịch còn mở**, panel còn | chọn được (lịch đóng, ô đổi) | **không bị** | `tg-xuat-kq-test-lich-test-ql--*.png` |
| Test › Kế hoạch Test › Xuất điểm Test (panel) | có | lịch còn mở | chọn được ("W3 SEP" → "W5 JUL") | **không bị** | `tg-xuat-diem-ke-hoach-ql--*.png` |
- Cũng mất: nút "Tuần này · Tuần trước · 2 tuần trước" trong lịch (cùng cơ chế). Đường còn dùng được duy nhất: **gõ tay** "W1 AUG" vào ô rồi "Áp dụng".
- [ĐÃ KIỂM mã, không bấm] **không bị**: bộ chọn tuần một ô (Lịch Test, Báo cáo đơn vị, Góp ý tuần — `ui/Filters.tsx:202` chính là `LichNho`), ‹ › Đang SOS (không có lịch), ô ngày trong hộp Kế hoạch Test (`HopKyNang.tsx:328` bỏ qua `[role="dialog"]`).

**2. Nguyên nhân (gợi ý cho PTA Plan — PTA tự đọc mã gốc):** chỉ bị ở 4 chỗ dùng `BoChonThoiGian`; lịch `LichNho` vẽ qua portal ra `body` (`ui/LichNho.tsx:208-211`, `role="dialog"`), còn `BoChonThoiGian` đóng khi `mousedown` ngoài hộp của nó (`phanTich/BoChonThoiGian.tsx:25-33`) — nơi không bị đều bỏ qua `[role="dialog"]` hoặc là panel.

**3. Ảnh hưởng:** QL / QT / Head tutor gần như **không chọn được khoảng bằng lịch** ở Phân tích, Tutor, Bộ lọc thêm → kẹt ở mặc định (đúng lời chủ SP). Người dùng chuột không biết gõ "W1 AUG".

**4. Liên quan:** V3B-08 (thành phần `Khoảng tuần` thay hẳn hộp này — lỗi mất theo), A5-13 (hộp 360 px che "Tùy chọn" — vẫn còn, ảnh `tg-phan-tich-ql--a-lich-mo.png`), mọi popover chứa `ONgay` sau này.

**5–6. Phương án:** (S1) vá ngay ở GĐ1: bộ chọn bỏ qua bấm trong lịch con (một dòng như `HopKyNang`) + phép kiểm bấm thử "‹ trong lịch không đóng hộp cha" cho mọi popover chứa `ONgay`. (S2) chờ `Khoảng tuần` (M0) — lỗi tồn tại tới GĐ2. S1 rẻ, bỏ chặn ngay; S2 để lỗi trên bản deploy.

**7. Đề xuất: S1 trong GĐ1 (SL1)** + phép kiểm trên **mọi** popover tự đóng bằng `mousedown` (15 chỗ ở `web/src` — `ChonPhuTrach`, `MissingBadge`, `TimKeHoach`, `Menu`, `MenuDong`, `NutLuat`, `PeoplePicker`…), rồi M0 thay bằng `Khoảng tuần`.

**8. Nghiệp vụ:** không đổi.

**9. Cần xác nhận:** không (lỗi rõ). Ghi chú: hàng nút "Tuần này · Tuần trước · 2 tuần trước" **trong** lịch tuần có thể trái luật 06/10 ("không làm hàng nút Hôm nay · Hôm qua…") → Q14 (giữ hay bỏ) — khuyến nghị **giữ trong lịch tuần** (không phải ô nhập ngày; là lối tắt chọn tuần), chủ SP quyết.

---

## V3B-10 Hiệu quả PA + Tổng hợp vấn đề học viên (II.7) · [ĐỀ XUẤT] · P2 ([CẦN DỮ LIỆU] để chốt)

**1. Vấn đề [ĐÃ KIỂM]**
- **Hiệu quả PA** (ảnh `pt-pa-ql-p1.png` 2 tuần, `pt-pa-ql-8t-p1.png`, `pt-pa-ql-26t-p1.png`, `pt-pa-ql-26t-mo-p1.png`, QT `pt-pa-qt-p1.png`, lớp thường `pt-pa-qt-thuong-p1.png`, Admin VP `pt-pa-ad-p1.png`, 375 `pt-pa-ql-375-p1.png`):
  - Hai khối: "PA do giáo viên thêm" (hàng lớn = **vấn đề** = mã lỗi chính của Case → hàng con = loại PA) và "PA theo quy chế" (SOS 1·2·3 / Bổ trợ; "không so, không xếp hạng") — `HieuQuaPa.tsx:15-20`, `server/src/phanTich/hieuQuaPa.ts:15-19`.
  - Monbay FT 26 tuần: **10 PA có kết quả, 0 vấn đề đủ dữ liệu → cả 10 dồn vào một hàng gập "8 vấn đề khác, mỗi vấn đề ≤ 2 PA"**; mở ra là 8 vấn đề, **không thấy loại PA nào** (hàng con của nhóm gom là vấn đề, không phải loại PA). Mỗi dòng mang hai nhãn trùng ý "mẫu nhỏ" + "Ít dữ liệu". "Thời gian thường mất" luôn "—" (< 5 PA). Lớp thường: 2 PA. Quy chế: 0.
  - Cột số lệch tiêu đề 45–47 px (V3B-05). Chân bảng là 3 việc làm sạch dữ liệu.
  - Không có cột kết quả cụ thể của em; không có "em nào PA không ăn thua".
- **Tổng hợp vấn đề HV (bảng cũ)** — **đã bỏ** ở OV-15e (`git show 0c591e8e^:web/src/modules/phanTich/TongHopVanDeHv.tsx`; C28 "Tên bảng Phân tích" không còn nó; máy chủ `/phan-tich/van-de-hv` bỏ ở OV-15h2 — `phanTich.ts:21-23`). Bảng cũ: hàng **kỹ năng → nhóm nguyên nhân**, cột Số HV · Số lớp · 3 lớp nhiều nhất · So với Test trước · Nguyên nhân phổ biến; công tắc "Vấn đề chính / + đi kèm", "Gộp theo nhóm nguyên nhân chung". Link cũ `goc=van-de` nay về Test + SOS.
- Dữ liệu demo: 43 PA do GV thêm (19 đã kết thúc, 22/06–11/09, mọi chi nhánh), 7 loại PA (Tutor 13 · Tự học 12 · Điều chỉnh dạy 10 · Hỗ trợ thêm 3 · Meeting CX 2 · BTVN thêm 2 · Đề nghị đổi GV 1); 38 PA quy chế (2 đã kết thúc).

**2. Nguyên nhân:** bảng xếp theo **vấn đề** (~30 mã lỗi) chia mẫu quá mỏng — đa số ô < 5 PA nên "Nên dùng" gần như không bao giờ hiện; bảng Vấn đề HV bị bỏ khi đổi tên bảng (C28) mà không ai ghi "câu hỏi 'kỹ năng nào nhiều vấn đề' trả lời ở đâu".

**3. Ảnh hưởng — Chị Vy hỏi 3 câu:**
| Câu | Nay | 
|---|---|
| "PA nào hiệu quả?" | không trả lời được: loại PA ẩn trong nhóm gom; phải mở nhóm rồi bấm từng "Số PA" (panel tên) |
| "Kỹ năng nào nhiều vấn đề nhất?" | **không có nơi nào** (bảng cũ đã bỏ); Test + SOS có "Dưới kỳ vọng L R W S" theo **lượt** (gần đúng, không nguyên nhân) |
| "Em nào PA không ăn thua?" | không có; phải lọc Học viên & Lớp "PA xong · chờ đóng" rồi mở từng hồ sơ |

**4. Liên quan:** Test + SOS (cột Dưới kỳ vọng), Báo cáo "PA có kết quả trong kỳ" (A5-02), Case (nhóm nguyên nhân, kết quả PA), Phân tích GV ("PA hiệu quả"), Đang SOS.

**5. Phương án**
| | Mô tả |
|---|---|
| **H1 — giữ hai bảng, làm lại** | (a) khôi phục "Vấn đề HV" (kỹ năng → nhóm nguyên nhân, Số HV, xu hướng); (b) Hiệu quả PA hàng lớn = **loại PA** → con = vấn đề; khối quy chế giữ |
| **H2 — một bảng "Vấn đề & PA"** | hàng lớn = **kỹ năng** (L · R · W · S · G+V lớp thường), hàng con = **vấn đề** (nhóm nguyên nhân). Cột: **HV có vấn đề** (trong kỳ, thanh một màu trong ô) · **Đã có PA** · **PA có kết quả** · **Có cải thiện %** · **PA đã dùng** (chữ gọn "Tutor 3/4 · Tự học 1/3", chip **Nên dùng** đúng luật hiện tại — tính ở cấp vấn đề như nay) · **Không tiến bộ n** (ô số → panel C: em · PA · kết quả · việc kế "Thêm PA mới / Mở Case"). Khối PA quy chế giữ riêng phía dưới. Một dòng tóm tắt đầu bảng: "19 PA có kết quả · 15 cải thiện (79 %) · nhiều nhất Tutor 13". |
| H3 — một bảng theo **loại PA** + thanh kỹ năng | 7 dòng loại PA (Số PA · Cải thiện % · Thời gian · Học viên) + một thanh ngang "HV có vấn đề theo kỹ năng" phía trên + số "n em PA không tiến bộ" → panel C |
| H4 — ma trận nhiệt vấn đề × loại PA | ô = % cải thiện (n) |

**6. Ưu / nhược (tình huống Chị Vy, giao ban 10 phút; dữ liệu thưa như demo)**
| | Câu 1 "PA nào hiệu quả" | Câu 2 "kỹ năng nào nhiều vấn đề" | Câu 3 "em nào không ăn thua" | Dữ liệu thưa | Luật "Nên dùng" |
|---|---|---|---|---|---|
| H1 | 0 bấm (bảng b) | 1 bấm đổi bảng | không có lối | bảng b vẫn thưa theo vấn đề | phải xoay chiều → **tính lại** ở cấp loại PA (đụng luật) |
| **H2** | 1 bấm mở kỹ năng (cột "PA đã dùng") | **0 bấm** (hàng lớn sắp theo HV, thanh trong ô) | **1 bấm** ("Không tiến bộ n" → C) | kỹ năng gom ~5 dòng → luôn có số; vấn đề mỏng vẫn đọc được ở hàng con | **giữ** (vẫn tính ở vấn đề) |
| H3 | 0 bấm | 0 bấm (thanh) | 1 bấm | tốt (7 dòng) | mất liên hệ vấn đề ↔ PA → "Nên dùng" theo vấn đề không còn chỗ hiện |
| H4 | phải dò ô | phải cộng hàng | không | **sai lệch**: hầu hết ô 1–2 PA → % 0 / 100 gây hiểu lầm (dataviz: không heatmap khi mẫu thưa) | giữ được nhưng khó đọc |

**7. Đề xuất: H2** — trả lời cả 3 câu trong ≤ 1 bấm, giữ luật "Nên dùng" ở cấp vấn đề, khôi phục câu hỏi "kỹ năng nào nhiều vấn đề" mà không thêm tab (C28 giữ 6 tab: tab đổi tên **"Vấn đề & PA"**). Dataviz: chỉ **thanh ngang một màu trong ô "HV có vấn đề"** (so độ lớn 5 kỹ năng); không biểu đồ riêng, không heatmap; có bảng nên không cần bảng thay thế.
Bỏ: nhãn trùng "mẫu nhỏ" (giữ "Ít dữ liệu" một chỗ), hàng gom "n vấn đề khác" (kỹ năng gom thay), chân bảng 3 việc (V3B-05 — "PA chờ kết quả" về Công việc; "PA chưa rõ nơi học" thành ⓘ ở tóm tắt).

**8. Nghiệp vụ:** **không đổi logic PA** (định nghĩa cải thiện, "Nên dùng", PA quy chế không xếp hạng, gán theo nơi em học lúc làm PA). Máy chủ: khôi phục phần đếm "HV có vấn đề" theo kỹ năng / nhóm nguyên nhân từ mã OV-15h2 đã bỏ (đã có phép kiểm cũ `phanTich.tests.ts:303`).

**9. Cần xác nhận:** Q15 (H2, tab đổi tên "Vấn đề & PA") — **có**; Q16 [CẦN DỮ LIỆU] số PA kết thúc / tháng / chi nhánh trên dữ liệu thật (để biết "Ít dữ liệu" có phủ gần hết bảng không) và lớp thường có cần bảng này không (demo 2 PA).

---

## V3B-11 Tutor — bộ lọc (III.1) · [ĐỀ XUẤT] · P2

**1. Vấn đề** (QT 1 / Head tutor 25 / QL 2; 1440 + 375 — ảnh `tu-qt-macdinh.png`, `tu-qt-tatca.png`, `tu-ht-macdinh.png`, `tu-ql-tatca-p1.png`, `tu-qt-375-p1.png`, `tu-ht-375-macdinh-p1.png`, `tu-qt-hop-tg.png`; mockup `mkt--m2.png`, `mkt--m7.png`)

| Bộ lọc | Mục đích | Cần? | Trùng / chồng | Đề xuất | Loại phát hiện |
|---|---|---|---|---|---|
| Khoảng thời gian (đầu trang, cạnh "Tutor") | số buổi / tỉ lệ trong khoảng | cần | **"Cần chú ý" không theo khoảng** (mọi thời gian sau nhận xét gần nhất — `server/src/tutors/trang.ts:48-80`), "Đang dạy" theo khoảng | `Khoảng tuần` mặc định 4 tuần gồm tuần này (V3B-08); dời vào hàng lọc | **UI xác định ngay**: tự đóng khi bấm lịch (V3B-09); hộp che "Tùy chọn" (A5-13) |
| Chip "Cần chú ý 0 · Đang dạy 0 · Ngừng hợp tác 1 · Thiếu thông tin 1 · Tất cả 8" | trạng thái | cần 3 | chồng nghĩa: một tutor vừa "Cần chú ý" vừa "Đang dạy"; "Thiếu thông tin" là **dữ liệu thiếu**, không phải trạng thái; số không cộng ra Tất cả (A5-06) | **"Cần chú ý n"** thành dòng việc riêng phía trên bảng (như "n tên gõ tay"), chip trạng thái còn **Đang dạy · Ngừng · Tất cả** (mặc định Tất cả nếu Đang dạy = 0); "Thiếu thông tin" thành chữ trong dòng việc "1 tutor thiếu SĐT / nơi dạy ›" | **UX cấu trúc** |
| Nơi dạy (ô chọn, chỉ người sửa) | lọc theo chi nhánh / online | **[CẦN DỮ LIỆU]** số tutor, số nơi dạy | — | ≤ ~30 tutor: gộp vào **"Lọc ▾"** (Nơi dạy + Kỹ năng), ẩn mặc định; > 30: giữ | giả thuyết |
| Kỹ năng (ô chọn) | tìm tutor dạy S… | như trên | — | như trên | giả thuyết |
| Tìm tên / SĐT | tìm nhanh | cần | — | giữ, đứng **đầu** hàng lọc | — |
| Dải "1 tên gõ tay … Gộp…" | việc dọn dữ liệu | cần với Head tutor | — | gộp với "Cần chú ý" thành một khối **"Việc của bạn"** 1–3 dòng | UX cấu trúc |
- Thứ tự đề xuất (1440, một hàng): `Tìm · [Đang dạy | Ngừng | Tất cả] · Thời gian [Toàn bộ | Khoảng tuần] · Lọc ▾ (Nơi dạy, Kỹ năng)`; nút chính "Thêm tutor" (9.2-34), "Tải danh sách" phụ.
- 375: nay bộ lọc + nút chiếm **~460 px** (y 158 → 615) trước tutor đầu; mockup m7 chỉ có một hàng thời gian + một nút tải + 3 chip → đề xuất như mockup + "Lọc ▾" (tấm dưới).

**2. Nguyên nhân:** đặc tả Tutor §7 + mockup m2 (4 chip) + chủ SP 20/10 thêm "Thiếu thông tin" vào **cùng** nhóm chip; "Cần chú ý" định nghĩa theo mọi thời gian (đúng nghiệp vụ: chưa nhận xét sau buổi xấu) nhưng đặt cạnh chip theo khoảng.

**3. Ảnh hưởng:** Head tutor mở trang **rỗng** ("Đang dạy 0", ảnh `tu-ht-macdinh.png`) → +1–4 bấm; đọc "Cần chú ý 0 · Đang dạy 0 · Tất cả 8" không hiểu vì sao không cộng; 375 cuộn 1 màn mới tới tutor đầu.

**4. Liên quan:** A5-06, A5-13, A5-26, A5-34, V3B-08, V3B-09, 9.2-34.

**5–6. Phương án:** (F1) như bảng trên — 6 điều khiển → 4, "Cần chú ý" thành việc; (F2) giữ 5 chip, chỉ sửa mặc định "Tất cả" khi rỗng — ít đổi nhưng giữ chồng nghĩa. Head tutor mở trang: F1 0 bấm thấy việc + danh sách; F2 0 bấm thấy danh sách nhưng chip vẫn khó hiểu.

**7. Đề xuất: F1.**

**8. Nghiệp vụ:** không đổi định nghĩa "Cần chú ý", "Đang dạy", "Ngừng hợp tác".

**9. Cần xác nhận:** Q17 (F1) — **có**; Q18 [CẦN DỮ LIỆU] (xem cuối V3B-12).

---

## V3B-12 Tutor — bảng, panel, 375 (III.1) · [ĐÃ KIỂM DOM + ảnh] · P2

**1. Vấn đề** — tách 4 loại:
- **Lỗi UI xác định ngay [ĐÃ KIỂM]:**
  1. Cột **"Cần chú ý vì" rộng 418 px (1440) / 258 px (1280) trống cả 8 dòng** (`NEW\do\v3b-do.json` `tu-qt-1440`) — bảng rộng 1 398 px mà nửa phải gần như trống.
  2. Panel một tutor: tiêu đề cột **"Feedback G…" bị cắt** (bảng Buổi dạy) (ảnh `tu-qt-pn-lan.png`); panel có **bộ chọn thời gian thứ hai** (cùng lỗi V3B-09); "NHẬN XÉT", "BUỔI DẠY" in hoa nhỏ (trái thang chữ vòng 1).
  3. Hàng 54,6 px vì tên + SĐT 2 dòng; số ở giữa hàng lệch đường cơ sở **8 px** với dòng tên (đo: `lechCoSo.max 8`).
  4. Chữ ô 13 px, tên 12–13 px (dưới thang 15 của vòng 1).
  5. 375 (`tu-qt-375-p1.png`): mỗi thẻ ~220 px chủ yếu là "—"; nhãn "Tài liệu đúng / hạn" xuống dòng (A5-27 vẫn còn).
- **UX phân tích từ cấu trúc:**
  6. Kết luận chữ trơn ("Ngừng hợp tác 14/09") — mockup m2 vẽ **chip** (Ổn xanh / Cần cải thiện vàng) → lệch mockup.
  7. Ô số "Buổi" và tỉ lệ: mockup = ô viền (bấm được), web = số trơn / chữ link cam (V3B-01).
  8. Cột ít giá trị khi chưa có buổi: 3 cột tỉ lệ + Đánh giá = "—" ở 7/8 dòng → bảng nhiễu.
  9. Căn: **0 px lệch** ở 9 cột (tốt — bảng `td` thường); Tutor có thể làm bảng mẫu cho `Bang`.
- **Cần dữ liệu thật [CẦN DỮ LIỆU]:** demo có **8 tutor, 2 buổi (1 buổi tên gõ tay), 1 nhận xét**, buổi ghi theo **giờ thật 20/10** (ngoài ngày demo 14/09 → mọi khoảng quá khứ = 0 buổi — X11). Ảnh duy nhất có số: `tu-qt-tatca-2t-truoc-nay.png` (W3 + W4 OCT: Nguyễn Thu Lan 1 buổi 1/1 · ★ 4.0).
- **Giả thuyết:** Head tutor gọi tutor qua điện thoại nên SĐT cần trên hàng — [GIẢ THUYẾT], kiểm bằng hỏi chủ SP / quan sát Head tutor.

**2. Nguyên nhân:** cột "Cần chú ý vì" dựng theo mockup m2 (mockup có nội dung cho 3/3 dòng vì lọc "Cần chú ý"); khi lọc "Tất cả" cột rỗng. Dữ liệu seed theo giờ thật (`server/src/seed/pb2bSeed.ts:187`, A5-06).

**3. Ảnh hưởng:** Head tutor quét 23+ tutor (mockup) trên bảng nửa trống; 375 cuộn dài; người mới không biết số nào bấm.

**4. Liên quan:** A5-06, A5-26, A5-27, A5-34, V3B-01, V3B-11, V2B-1 (`Bang`).

**5–6. Phương án bảng**
| | Mô tả | Ưu / nhược |
|---|---|---|
| **B1** | gộp "Cần chú ý vì" vào cột **"Kết luận / lý do"**: có chú ý → chữ cam "3 buổi không gửi feedback cho GV"; không → chip Kết luận + ngày; tên một dòng, SĐT vào panel + `title` (hoặc giữ nếu Q18 nói cần); nhóm tiêu đề "Buổi có trả lời: Chuẩn bị · Tài liệu · Feedback GV"; ô số theo V3B-01; hàng 44 px; tutor 0 buổi trong khoảng: 4 cột số gộp thành "chưa có buổi trong khoảng" (một ô kéo dài) | bảng 9 → 8 cột, ~1 000 px, không nửa trống; giữ đủ 3 tiêu chí mockup |
| B2 | giữ cột, chỉ ẩn khi rỗng | đơn giản; cột nhảy khi đổi lọc |
375: theo mockup m7 (thẻ: tên + nơi dạy · kỹ năng / lý do chú ý / 3 ô tỉ lệ một hàng / "6 buổi ★ 2.8 · chip").

**7. Đề xuất: B1 + 375 theo m7.** Panel: bỏ bộ chọn thứ hai (dùng khoảng của trang), sửa cắt "Feedback G…" (tiêu đề 2 dòng hoặc "Feedback"), tiêu đề khối không in hoa.

**8. Nghiệp vụ:** không đổi (3 tiêu chí, sao, kết luận, nhóm chú ý giữ nguyên).

**9. Cần xác nhận:** Q18 [CẦN DỮ LIỆU] — chủ SP cho biết: (a) số tutor thật (hiện / 6 tháng tới), (b) số buổi tutor / tuần mỗi chi nhánh, (c) tỉ lệ buổi có "Không" / đánh giá ≤ 2, (d) Head tutor có lọc theo nơi dạy / kỹ năng hằng ngày không, (e) có gọi điện tutor từ trang này không (SĐT trên hàng?), (f) bao lâu Head tutor viết nhận xét một lần, (g) tên gõ tay xuất hiện nhiều không. **Và** seed demo buổi tutor theo ngày demo (Q11 của 3.3 / SEED-UX) để chụp lại trạng thái có dữ liệu.

---

## V3B-13 Mở rộng toàn web — cùng gốc ở chỗ chủ SP chưa chụp (ngắn) · [ĐÃ KIỂM mã]

| Gốc | Chỗ khác bị | Mục xử lý |
|---|---|---|
| Gạch chấm 4 nghĩa | Học viên & Lớp (mã lớp), Đang SOS, Cần làm, TVV / CX, Phân tích GV (tên cột + "n lớp"), KCK, "Thiếu n" | V3B-01 |
| Panel tên (`NganDanhSach`) | Tổng quan QL (hàng lớp), Hồ sơ GV (8 số), Công việc "Lớp tôi dạy", Tổng quan QT theo chi nhánh (`BranchPulse.tsx:70`) | V3B-02 / 03 |
| Về trang chung chung | "+n" hàng lớp, "n HV chưa chốt lộ trình", Ý thức tên lớp, Admin VP "Đề nghị dời" / "MT chưa xếp lịch", Phân tích GV "Mở Lịch Test" | V3B-02 #33, 40, 41, 48, 30 |
| Bộ chọn tự đóng (`BoChonThoiGian`) | Phân tích, Tutor, panel tutor, Bộ lọc thêm | V3B-09 |
| `HangNhom` / `HangCon` căn lệch 45–53 px | Hiệu quả PA, Ý thức lớp, Test + SOS (cùng 11.1a R2) | BANG-1 thêm 3 bảng |
| Cột việc trong bảng phân tích | Test + SOS, Kết quả thi, Hiệu quả PA chân, Ý thức ×2, Báo cáo "bài quá hạn" | V3B-05 / 06 |
| Xuất trình duyệt không nhật ký | Test + SOS, Kết quả thi, Ý thức | V3B-07 |
| Tiêu đề khối in hoa nhỏ | panel tutor, panel Xuất kết quả Test ("PHẠM VI", "THỜI GIAN", "LƯỢT VÀ CỘT", "XEM TRƯỚC") | thang chữ vòng 1 |

---

## Câu hỏi cho chủ SP (quan trọng trước; mỗi câu kèm khuyến nghị)

1. **Lỗi bộ chọn tự đóng (V3B-09)** vá ngay ở GĐ1 trước deploy (một dòng + phép kiểm mọi popover), rồi M0 thay bằng `Khoảng tuần`? — **Có.**
2. **Luật chọn loại panel (V3B-02):** số trong kỳ → A thông tin; số hiện tại = việc → C thông tin + nút; số tổng → không bấm; số có trang chuyên → đổi trang **đúng lọc**? — **Có.**
3. **Báo cáo thuần (V3B-05, T1):** bỏ mọi cột việc khỏi bảng Phân tích (Test + SOS: HV - Case · Chưa chốt PA · Đang xử lý; Kết quả thi: Case / PA · Việc tiếp; chân Hiệu quả PA) — dữ liệu giữ, việc ở Tổng quan / Công việc / hồ sơ? — **Có.**
4. **Mẫu panel C (V3B-03):** tiêu đề = chỉ số + phạm vi + số; ≤ 6 cột; một nút / dòng; dòng xong ở lại tới khi đóng; panel trên URL? — **Có** (cần mockup).
5. **Báo cáo sửa theo mockup 3 khung 3 bằng một PR màn (K1)** + nút **"Chiếu"** (sáng, chữ lớn, toàn màn)? — **Có.**
6. Báo cáo dùng **"bài chấm trễ trong kỳ"** (không đổi khi in lại) thay "bài quá hạn tới hôm nay"? — **Có.**
7. Kết quả thi › Thi thật giữ "Bước tiếp chọn trên hàng" (ngoại lệ có lý do, mockup 6 khung 6)? — **Giữ.**
8. **Ý thức (Y1):** bỏ bảng "Học viên cần chú ý" khỏi Phân tích (việc ở Hồ sơ lớp › Ý thức + Công việc), còn "Vi phạm theo lớp" + "Theo loại vi phạm" + "Xử lý đã làm theo loại"? — **Có.**
9. [CẦN ẢNH] "Báo trễ" ở bảng Ý thức chủ SP thấy ở đâu? Chụp vùng đó (tab Ý thức không có chữ "trễ"; Phân tích GV có cột "Đúng hạn › Xử lý vi phạm").
10. **Xuất Excel (E1):** một từ điển cột (Tên · Email đầu), panel xuất mặc định = bộ lọc trang gọi, **mọi xuất đi máy chủ + ghi nhật ký**? — **Có.**
11. Bỏ sheet "HV cần chú ý" (email + tình trạng kỷ luật từng em) khỏi tệp Ý thức? — **Có.**
12. **Thời gian (V3B-08):** "Toàn bộ" = từ tuần đầu có dữ liệu trong phạm vi (chọn lớp = từ khai giảng); mặc định theo bảng (Báo cáo 2 tuần · Test + SOS 8 · Mock 4 · Thi thật Toàn bộ · Hiệu quả PA Toàn bộ · GV 4 · Ý thức 4 · Tutor 4 gồm tuần này); "Toàn bộ" áp cả Tutor, Bộ lọc thêm, panel Xuất; không áp Lịch Test / Góp ý tuần / Báo cáo đơn vị / Lịch thi / Đang SOS? — **Đồng ý cả gói.**
13. Trần 52 tuần khi chọn "Toàn bộ": bỏ trần sau khi đo tốc độ, hay kẹp (vd 104 tuần) và ghi rõ trên nhãn? — **Đo trước; chậm thì kẹp + ghi nhãn.**
14. Hàng nút "Tuần này · Tuần trước · 2 tuần trước" **trong** lịch tuần có trái luật 06/10 không? — **Giữ** (lối tắt chọn tuần, không phải ô nhập ngày).
15. **Hiệu quả PA → một bảng "Vấn đề & PA" (H2)**, khôi phục "kỹ năng nào nhiều vấn đề", giữ khối PA quy chế, giữ luật "Nên dùng"; tab đổi tên "Vấn đề & PA"? — **Có.**
16. [CẦN DỮ LIỆU] Số PA kết thúc / tháng / chi nhánh trên dữ liệu thật; lớp thường có cần bảng này không?
17. **Tutor bộ lọc (F1):** "Cần chú ý" + "tên gõ tay" + "thiếu thông tin" thành khối "Việc của bạn"; chip còn Đang dạy · Ngừng · Tất cả; Nơi dạy + Kỹ năng vào "Lọc ▾"? — **Có** (Nơi dạy / Kỹ năng luôn hiện nếu > 30 tutor).
18. [CẦN DỮ LIỆU] Tutor: số tutor thật, buổi / tuần / chi nhánh, tỉ lệ buổi "Không", Head tutor có lọc nơi dạy / kỹ năng hằng ngày, có gọi điện từ trang (SĐT trên hàng), nhịp viết nhận xét, tần suất tên gõ tay. **+ seed buổi tutor theo ngày demo** để chụp lại.
19. **Một dáng "ô số" (V3B-01, P1)** áp toàn web (Phân tích, Tổng quan, Hồ sơ GV, Tutor, Công việc); gạch chấm bỏ hẳn, giải thích dùng ⓘ, đổi trang dùng chữ "›"? — **Có** (khớp mockup + 9.2-31).

---

## Ảnh tiêu biểu (đường đủ)

Thư mục: `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v3b\`

1. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v3b\tg-phan-tich-ql--a-lich-mo.png` — lịch tuần mở trong hộp Khoảng thời gian (trước khi bấm)
2. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v3b\tg-phan-tich-ql--b-sau-bam-thang-truoc.png` — sau bấm ‹: cả hộp đóng (II.6)
3. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v3b\tg-xuat-kq-test-lich-test-ql--c-sau-bam-ngay.png` — đối chứng: panel Xuất kết quả Test chọn được tuần
4. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v3b\mk3-bc--bc1440.png` — mockup 3 khung 3 Báo cáo (ô số viền, chip SOS màu, mở sáng)
5. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v3b\bc-ql-1440.png` — Báo cáo web: 4 hàng đầu trang, số gạch chấm, khối dọc
6. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v3b\mk3-bc--panel.png` ↔ `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v3b\bc-ql-pn-chuadat.png` — panel "Chưa đạt": mockup (kỹ năng hụt + nút) ↔ web (cuộn ngang, không nút)
7. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v3b\bc-ql-pn-gv.png` — "7 bài — quá hạn chấm": mất tên GV, "Nhập điểm" QL không làm được
8. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v3b\bc-ql-pn-casechot.png` — mẫu tốt: panel sổ có dòng việc + quá hạn
9. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v3b\pt-yt-ql-p1.png` — Ý thức: "Học viên cần chú ý" = hàng đợi việc (Quá hạn · Bậc kế); "Lớp nhiều vi phạm" lệch cột 50 px
10. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v3b\pt-yt-ql-pn-mo.png` — panel vi phạm: mở dòng chỉ lặp chữ + "Mở trang ↗"
11. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v3b\pt-pa-ql-26t-mo-p1.png` — Hiệu quả PA 26 tuần: 10 PA trong nhóm gom, không thấy loại PA, cột lệch 45 px
12. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v3b\pt-th-ql-p1.png` — Test + SOS: 3 cột việc (HV - Case, Chưa chốt PA ⚠, Đang xử lý), chip + gạch chấm
13. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v3b\pt-gv-ql-p1.png` — Phân tích GV: gạch chấm 3 nghĩa (tên cột, số, "5 lớp")
14. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v3b\tu-qt-tatca.png` ↔ `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v3b\mkt--m2.png` — Tutor web (cột "Cần chú ý vì" 418 px trống, 5 chip) ↔ mockup m2 (ô viền, chip kết luận)
15. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v3b\tu-ht-macdinh.png` — Head tutor mở trang rỗng ("Đang dạy 0")
16. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v3b\tu-qt-375-p1.png` ↔ `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v3b\mkt--m7.png` — Tutor 375: ~460 px bộ lọc ↔ mockup m7 gọn
17. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v3b\tu-qt-pn-lan.png` — panel tutor (mẫu C tốt) — tiêu đề "Feedback G…" bị cắt, bộ chọn thời gian thứ hai
