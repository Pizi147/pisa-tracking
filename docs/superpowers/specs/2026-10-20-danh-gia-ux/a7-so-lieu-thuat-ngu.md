> Phụ lục của [Đánh giá lại UX/UI toàn diện 20/10/2026](../2026-10-20-danh-gia-lai-ux-ui-toan-dien.md). Báo cáo gốc của agent rà (Opus 5.5), giữ nguyên chữ. Đường `SCR\anh\…` / `SCR\…` là ảnh và tệp tạm của đợt rà (không lưu trong repo); ảnh tiêu biểu đã lưu ở `anh/`.

# A7 — Số liệu nhất quán · Thuật ngữ · Lỗi nền (rà 20/10/2026)

Agent a7. Chỉ đánh giá, không sửa mã, không ghi dữ liệu (chỉ GET). Web demo `localhost:5621`, ngày demo 14/09/2026, mã `main` e3405b93.
Luật soi: CLAUDE.md "cùng một số liệu ở nhiều nơi phải cùng nguồn, cùng hàm tính (việc đã xong không được nơi nào còn báo chờ / quá hạn)", "một khái niệm một tên"; đặc tả OV-14 §3.1 "Số trên trang = số hàng trong panel", §3.4 "thông báo tự hết khi việc xong; đã đọc ≠ đã xong".

---

## Phần 0. Phạm vi

**Cách lấy số:** script Playwright riêng `SCR/a7/mang.mjs` đăng nhập demo, mở trang, ghi MỌI request (đường, mã, ms), lỗi console, chữ `<main>`, thân JSON của mọi GET `/api/…` → `SCR/a7/out/<id>/{net.json, api.json, text.txt}`; đọc số bằng `SCR/a7/xem.mjs`, tổng kết mạng bằng `SCR/a7/tong-ket-mang.mjs`. Sau khi sửa phông: **53 lần mở trang · 518 GET API · 9 vai · 0 lỗi console · 0 request ≥ 400**.
Cùng vai + cùng bộ lọc như ảnh chủ SP: **QT (user 1), chi nhánh Monbay đã nhớ (không có `cn` trên URL — đúng như chủ SP vào từ thanh trên), khung Fast Track**; đối chứng QL Monbay (user 2), GV Cao Khánh Linh (10), GV Trần Ngọc Hà (7), GV Phạm Thu Trang (9), Admin (22), TVV (23), CX (24), Head tutor (25).

| Nhóm | id (ảnh ở `SCR/anh/a7/<id>.png`, dữ liệu ở `SCR/a7/out/<id>/`) |
|---|---|
| Tổng quan | `a7-tq-qt-nho` (+`-p1..p3`), `a7-tq-qt-cn` (`?cn=1`), `a7-tq-qt-macdinh` (Tất cả chi nhánh), `a7-tq-qt-thuong--thuong` (Lớp thường), `a7-tq-ql2`, `a7-font` |
| Công việc | `a7-cv-qt`, `a7-cv-ql2`, `a7-cv-gv10`, `a7-cv-gv10-viec--panel` (việc "Nhập điểm Writing Task 2 · MT1 W1 JUL"), `a7-cv-gv7`, `a7-v9-cv` |
| Chuông | `a7-chuong-qt--chuong`, `a7-chuong-gv10--chuong` |
| Test | `a7-test-lich-qt` (+`-p1,-p2`), `a7-test-lich-qt-ft--ft`, `a7-test-lich-ql2`, `a7-test-lich-gv10`, `a7-test-kh-qt`, `a7-test-kh-ql2`, `a7-v9-test`, `a7-v22-test` |
| Phân tích | `a7-pt-bc-qt` (+`-p1`), `a7-pt-bc-ql2`, `a7-pt-th-qt`, `a7-pt-kqt-qt`, `a7-pt-hq-qt`, `a7-pt-gv-qt`, `a7-pt-yt-qt`, `a7-api-ky` (Báo cáo × 4 khoảng thời gian), `a7-v2-pt-gv` |
| Học viên & Lớp | `a7-hv-qt`, `a7-hv-canlam-qt` (10 dòng/trang), `a7-hv-canlam50-qt--50` (50 dòng), `a7-hv-sos-qt`, `a7-hv-ql2`, `a7-hv-canlam-ql2`, `a7-lop101-qt`, `a7-lop101-ql2`, `a7-v7-hv`, `a7-v7-lop` |
| Tutor + vai khác | `a7-tutor-qt`, `a7-v2-tutor`, `a7-v25-tutor`, `a7-v22-*`, `a7-v23-*`, `a7-v24-*` |

**Chưa rà / giới hạn:** không bấm Duyệt / Lưu nên lỗi "số không làm mới sau khi duyệt nhiều" (A7-14) chỉ kiểm bằng mã; khung Lớp thường chỉ đối chiếu dải Tổng quan + Lịch Test; Ý thức, Hiệu quả PA chỉ đối chiếu số trùng với Báo cáo; không rà 375 (số không đổi theo khổ).
**Ghi chú môi trường (không phải lỗi sản phẩm — xem A7-06):** trước khi PTA Plan thêm `fs.allow` vào `vite.config` của worktree (20/10, trong đợt rà), demo 5621 không nạp được phông Be Vietnam Pro / Inter (mọi "lỗi 403" console là tệp phông) → ảnh chụp trước lúc đó dùng phông dự phòng (Segoe UI). Toàn bộ số liệu, mạng và ảnh của a7 đã **chạy lại sau khi sửa** (53 lần mở trang, `SCR/a7/out/`); bản trước sửa giữ ở `SCR/a7/out-truoc-sua-phong/` để đối chứng. Số liệu hai lần giống hệt.

---

## Phần 1. Điểm (chỉ phạm vi số liệu · thuật ngữ · lỗi nền)

| # | Heuristic | Điểm | Lý do cụ thể |
|---|---|---|---|
| 1 | Trạng thái hệ thống | **2** | Số không nói phạm vi của mình (khung, chi nhánh, toàn bộ / trong kỳ) → cùng tên khác số mà không có dấu hiệu nào (A7-01…05). Đầu nhóm "⚠ n việc quá hạn" đổi theo số dòng/trang (A7-09). Số "Chờ duyệt n" ở Tổng quan không làm mới sau Duyệt nhiều (A7-14). Chuông trễ tới 5 phút (A7-15). Tốt: "Dữ liệu đến 14/09/2026", dải đang tải hiện "…", lỗi từng khối có Thử lại. |
| 2 | Ngôn ngữ đời thực | **2** | "Đang SOS" và "SOS hiện tại" cùng nghĩa tiếng Việt, khác số (9 vs 14). "Case chờ xác nhận nguyên nhân … chưa thành Case" tự mâu thuẫn. "12 chưa điểm" là 12 **HV**, đứng cạnh "58 bài". Phân tích GV định nghĩa "không có = áp dụng, chưa có mục" ngược cách đọc thường. Trang tên "Tổng quan" mà tiêu đề "Việc hôm nay". |
| 3 | Kiểm soát, tự do | n/a | — |
| 4 | Nhất quán, chuẩn | **1** | ≥ 12 cặp số cùng nhãn, cùng vai, cùng bộ lọc mà khác giá trị (bảng 2.1); 9 tên cho "bài quá hạn chấm"; badge "Công việc n" một chỗ hai nghĩa theo vai; "Chờ duyệt" hai nghĩa + ba đơn vị; "Đạt" hai nghĩa trong cùng Phân tích. |
| 5 | Ngăn lỗi | n/a | — |
| 6 | Nhận ra hơn nhớ | n/a | — |
| 7 | Linh hoạt | n/a | — |
| 8 | Tối giản | n/a | — |
| 9 | Nhận ra / sửa lỗi | **3** | Sau khi sửa môi trường: 0 lỗi console, 0 request ≥ 400 trên mọi trang / vai đã mở; lỗi tải hiện tại khối kèm "Thử lại", chip Cần làm hiện "!" khi lỗi; câu máy chủ rõ ("Giáo viên này không còn bài trễ chấm — có thể vừa nhập xong hoặc bộ lọc vừa đổi"). Trừ điểm: số lệch không kèm lời giải thích nào (người dùng không biết đó là "khác định nghĩa" hay "lỗi"). |
| **Tổng** | | **8 / 16 (50 %)** | Quy đổi ≈ 20/40 → mức "Acceptable" thấp. **Không xứng ≥ 35/40** ở phạm vi này: người dùng không tin được con số khi hai nơi cùng tên báo khác nhau — đây là lỗi nền của mọi màn quản lý. |

**Cognitive load (phạm vi số liệu): trượt 3/8 → trung bình.** Trượt: *Working memory* (muốn hiểu vì sao 10 ≠ 12, 58 ≠ 53 phải nhớ số từ màn khác); *Chunking* (dải "HV cần chú ý" 6 số + ⚠ trên một dòng, hai phạm vi khác nhau); *Visual hierarchy* (số khác phạm vi cùng kiểu chữ, không tách). Đạt: Single focus, Grouping, One thing at a time, Minimal choices, Progressive disclosure (ⓘ phân rã Case chưa chốt PA).

---

## Phần 2. Kết quả

### 2.1 Bản đồ số liệu (QT · Monbay nhớ · FT · 14/09, trừ khi ghi khác)

| # | Số | Nơi A | Nơi B (C, D…) | Khớp? | Hàm tính | Kết luận |
|---|---|---|---|---|---|---|
| 1 | Chờ duyệt | TQ "Chờ duyệt **10** ⚠1" | TQ thẻ: 3 + "Xem thêm 9" = **12** (có BC FT 205, CP FT 110) · Công việc "10 chờ bạn duyệt" / 12 thẻ · badge "Công việc **12**" (⚠2) · HV&L chip "Chờ duyệt **6**" · hồ sơ MB FT 101 "**8** chờ duyệt" | ✗ | số: `tongQuan.ts:196` `demYeuCau(p,{branchId})`, `HoTroHocVienTab.tsx:275`; thẻ: `HopChoDuyet.tsx:51,70-76` (chỉ đọc `cn` trên URL); badge `App.tsx:150` `/yeu-cau/dem` | **Lỗi** bộ lọc không áp (A7-01) + khác đơn vị: thẻ (10/12/8) vs HV (6) |
| 2 | ⚠ quá hạn Chờ duyệt | TQ ⚠**1** | 2 thẻ đỏ "Quá hạn" (BC FT 205 · 6 ngày; MB FT 101 · 1 ngày) | ✗ | như #1 | **Lỗi** cùng gốc #1 |
| 3 | Case chưa chốt PA | TQ dải 13 HV · **19** Case | Lớp cần chú ý "Cả Monbay" 13/19 · Báo cáo 13 / 19 | ✓ | `metricSet('case-cho-xac-dinh-nguyen-nhan', {program:'ft'})` `bangChiNhanh.ts:66`, `baoCao.ts:116` | Khớp |
| 4 | Case quá hạn | TQ dải "⚠ **5** quá hạn" (ngay sau "19 Case") · Cần bạn quyết "Case chưa chốt PA **5** ⚠5" | Báo cáo "⚠ **4** quá hạn · 3 chốt PA · 1 Kết quả PA" | ✗ | TQ `case-xac-dinh-nguyen-nhan-qua-han` GỘP hai khung (`tongQuan.ts:81-85`, `KhoiCanQuyet.tsx:32,44`); Báo cáo FT = 3 + `pa-can-cap-nhat` 1 (`baoCao.ts:138-139`, `BaoCao.tsx:166`) | Khác định nghĩa **và** khác khung. 2/5 là Case lớp thường (MB FOU 12, MB FOU 15) nên 5 **không** thuộc 19 (A7-03) |
| 5 | Bài trễ / quá hạn chấm | TQ dải "**58** bài trễ chấm · **4** GV" | TQ khối "Trễ chấm **53** bài · **3** GV" (4 dòng) · Lịch Test Tất cả "Quá hạn chấm **58** · 4 lớp" · Lịch Test FT **53** · 2 lớp · Báo cáo "⚠ **28** bài quá hạn · 3 GV" (4 dòng) · Báo cáo "chưa điểm · **53** bài" | ✗ | dải gộp khung `tongQuan.ts:116-121`; khối theo khung `tongQuanQl.ts:35-66`; "GV" bỏ dòng chấm chéo `TongQuanQl.tsx:336`, `BaoCao.tsx:87`; Báo cáo chỉ lượt thi trong kỳ `baoCao.ts:64-70` | 3 định nghĩa (gộp khung / FT toàn bộ / FT lượt trong kỳ) dưới gần cùng một nhãn; "4 GV" vs "3 GV": dải đếm cả Phạm Thu Trang (bài lớp thường), khối không đếm "Speaking chấm chéo" (A7-03, A7-18) |
| 6 | HV chưa điểm | TQ "12 chưa điểm" | Báo cáo "12 chưa điểm" | ✓ | `bangChiNhanh.ts:222-228` = HV của `bai-qua-han-nhap-diem` | Khớp, nhưng nhãn không có đơn vị (12 HV, cạnh "58 bài") |
| 7 | Chưa lịch Test | TQ **3** | Báo cáo **3** (ảnh chủ SP ghi 2) · Kế hoạch Test MB FT 101 "MT2 chưa xếp 1 em", MB FT 105 "MT2 chưa xếp **4** em" (TQ hàng MB FT 105 = **0**) | TQ = BC ✓ · TQ ≠ KH Test | TQ + BC cùng `hv-ft-xong-mt-cuoi-chua-mt-ke` (`metrics.ts:860`); KH Test `keHoachTest.ts:128-137` (đợt kế theo MT đang thi) | 3 = 3 ở 4 khoảng thời gian (`a7-api-ky`); "2" của chủ SP **không tái hiện** → [GIẢ THUYẾT] hai ảnh chụp lúc dữ liệu khác (demo seed lại 16:36). Nơi báo (TQ) và nơi sửa (KH Test) đếm khác luật (A7-12) |
| 8 | SOS | TQ "SOS hiện tại" Cả Monbay **6/5/3** (14 HV) | HV&L "Đang SOS **9**" (HV FT, 8 tuần thi) · Báo cáo "SOS theo lớp" **2/3/0** (5 HV) · Kết quả thi "SOS 3: **2** · SOS 2: **4** · SOS 1: **3**" (9 lượt, 4 là "tạm") · Lớp tôi dạy (GV) MB FT 101 SOS 8 = TQ 5+2+1 ✓ | ✗ | TQ `danhGia.ts:237-245` (lượt hợp lệ mới nhất, **gồm tạm**); Đang SOS `hocVienSos.ts:94-130` (lượt đã chấm đủ, `SO_TUAN_SOS = 8`); Báo cáo `baoCao.ts:33-45` + `tongHop.ts:33-40` (**bỏ tạm**); Kết quả thi `ketQuaThi.ts:82,89-95` (**gồm tạm**) | 4 định nghĩa; "Đang SOS" ≈ "SOS hiện tại" về chữ; luật SOS tạm ngược nhau giữa hai tab Phân tích (A7-04) |
| 9 | Kết quả Mock (W1+W2 SEP) | Báo cáo Đạt 5 · Chưa đạt 4 · Chưa đủ điểm 8 | Kết quả thi 5 · 4 · 8 ✓ · Test + SOS "Đạt **6**" · "Thiếu điểm **5**" · **16** lượt (Kết quả thi **17**) | ✗ (Test+SOS) | Báo cáo = Kết quả thi `mockTrongKhoang`; Test+SOS `phanLoaiLuot` (`tongHop.ts:33-40`: Đạt = không SOS, chưa chốt = chưa đủ) | "Đạt" hai nghĩa (OVR ≥ kỳ vọng vs không SOS); "Thiếu điểm" vs "Chưa đủ điểm" (A7-11) |
| 10 | PA có kết quả | Báo cáo "**10** PA có kết quả trong kỳ" | Hiệu quả PA cùng bộ lọc: **2** (W1+W2 SEP) · 6 (W1+W2 AUG) · 0 (JUN) — Báo cáo vẫn **10** ở cả 4 khoảng, kể cả 05–18/01/2026 | ✗ | `metrics.ts:902-908` bỏ qua `from/to` dù hợp đồng ghi `thoiGian: 'ket-qua-trong-ky'` (`shared/domain/metrics.ts:125-129`); Báo cáo truyền khoảng `baoCao.ts:137` | **Lỗi** — báo cáo in A4 sai (A7-02) |
| 11 | Việc quá hạn (QL 2, Tất cả) | Công việc "⚠ **33** quá hạn · 84 việc" | HV&L › Cần làm "Quá hạn **40** việc · 181 việc" | ✗ | cùng `/my-work`; Công việc đếm dòng gộp (`summary.overdue`); HV&L tách `con` + thêm dòng Chờ duyệt / Thiếu thông tin (`StudentsPage.tsx:209-224`) | Cùng nguồn, khác đơn vị đếm (A7-07) |
| 12 | Cần làm (HV&L) | chip "Cần làm **51**" | "Tất cả **51**" · danh sách "1–10 / **118** việc" | ✗ nghĩa | `StudentsPage.tsx:266-271` đếm **HV** của mọi việc + Thiếu thông tin (46/51 em) | Chip lọc = tất cả → vô nghĩa; chip đếm HV, danh sách đếm việc (A7-08) |
| 13 | Đầu nhóm MB FT 101 (Cần làm) | 10 dòng/trang: "⚠ **8** việc quá hạn · **1** em" | 50 dòng/trang: "⚠ **22** việc quá hạn · **15** em" | ✗ | `StudentsPage.tsx:558` truyền `pt.cat(viecHien)` → `BangCanLam.tsx:56-74` đếm trên trang | **Lỗi** (A7-09) |
| 14 | Badge "Công việc n" | GV 10: **5** = "⚠ 5 quá hạn" ✓ | QT: **12** = thẻ chờ duyệt mọi chi nhánh (trang Monbay 10; việc quá hạn của QT là 33) | nghĩa khác | `App.tsx:150-158` (`/yeu-cau/dem` cho người duyệt, `/my-work` overdue cho GV) | Một vị trí, hai nghĩa theo vai, không theo chi nhánh (A7-13) |
| 15 | Thông báo n | QT "**30**" = 11 Cần làm + 19 Để biết | GV 10 "**9**" = 1 + 8 | — | `Header.tsx:119` đếm chưa đọc; nhóm `duongHoSo.ts:150-158` | 8 "Chốt lộ trình … quá hạn" (QT) và 5 việc quá hạn (GV) bị xếp **Để biết**; 6 thẻ đã xử lý vẫn tên "Chờ duyệt · …" và vẫn được đếm (A7-05) |
| 16 | Việc GV "2 bài" | Công việc "Nhập điểm Writing Task 2 · MT1 W1 JUL · **2** bài" (`emIds` 63, 64) | Panel: **3** em (Bùi Thảo Vy, Lương Bảo Anh, Tạ Minh Quân), 3 ô trống giống nhau | ✗ | em thứ 3 là lượt MT lịch sử (`assessment_attempts.id 126, lich_su = 1`) — không phải nợ (`scoreDebt.ts:29`) nhưng lưới tuần `classes/3/cham?periodId=31` hiện mọi lượt | **Lỗi hiển thị** (A7-10) |
| 17 | Bài chờ chấm của lớp | hồ sơ / HV&L MB FT 101 "**78** bài chờ chấm" | TQ Trễ chấm theo GV ở MB FT 101: 17+10+11+11 = **49** · Lịch Test tuần này "17/21" | ✗ nghĩa | `classes.ts:215-273` `pendingSkillsOf` (gồm bài chưa tới hạn, không loại `lich_su`); quá hạn `attempts.ts:486` (loại `lich_su`) | Khác định nghĩa không ghi; nhiều khả năng gồm cả 8 lượt MT cũ của lớp (A7-10) |
| 18 | GV: quá hạn chấm | Lịch Test "Quá hạn chấm **11** bài · 1 lớp" | Công việc 4 việc quá hạn (2+1+2+6 = 11 bài) · Lớp tôi dạy "11 quá hạn" · chuông 4 "Quá hạn chấm" | ✓ | cùng `overdueScoreBai` / `/my-work` | Khớp (mẫu tốt) |
| 19 | GV: số việc tuần | "**10** việc đến hết W3 SEP" | nhóm 6 + 3 + 1 + 1 = **11** dòng (1 việc hạn 23/09) | ✗ nhẹ | `HoTroHocVienTab.tsx` (đếm đến hết tuần) vs danh sách đủ | Nhãn đúng nhưng danh sách không tách việc tuần sau (P3) |
| 20 | Tutor chip | Cần chú ý 0 · Đang dạy 0 · Ngừng 1 · Thiếu TT 1 | Tất cả **8** (QL: 3) | ✗ tổng | `TutorPage.tsx:21-27,58` | Chip chồng nhau, "Đang dạy" theo buổi trong kỳ; mặc định chip rỗng → trang trống (A7-16) |
| 21 | Cần xếp lại | KH Test "Cần xếp lại (**5**)" | hàng lớp 4 + 1 | ✓ | `keHoachTest.ts:115-126` | Khớp |
| 22 | Lịch tuần này | TQ "Tuần này · W3 SEP **7**" | Lịch Test "Lịch Test tuần này **47** · 6 lớp" | ✗ đơn vị | TQ `highlights` = em có Mock (FT); Lịch Test = bài (cả hai khung) | Khác đơn vị, số 7 không ghi "em" (P3) |
| 23 | HV FT Monbay | TQ 51 | HV&L 51 · KH Test 51 | ✓ | | Khớp |

### 2.2 Kiểm kê thuật ngữ (đếm biến thể bằng `SCR/a7/thuat-ngu.mjs`, kết quả `SCR/a7/thuat-ngu.txt`)

| Khái niệm | Tên đang dùng (nơi) | Nên chốt | Căn cứ |
|---|---|---|---|
| Trang đầu của QL | "Tổng quan" (thanh trên) · "Việc hôm nay" (h1 cùng trang, `dieuHuong.ts:160`) | **Tổng quan** | A-002/A-003 (01/10) chốt "Việc hôm nay" là TAB; OV-15e đã bỏ tab |
| Bài quá hạn chưa có điểm | "bài trễ chấm", "Trễ chấm" (TQ) · "Quá hạn chấm" (Lịch Test, chuông) · "bài quá hạn" (Báo cáo) · "bài quá hạn chưa nhập điểm" (nhãn chỉ số) · "Quá hạn theo GV" · "Bài chờ chấm … 11 quá hạn" (Lớp tôi dạy) · "Nợ điểm" (Hướng dẫn admin) · "chưa điểm" (đơn vị **HV**) | **bài quá hạn chấm** (bài) · **HV có bài quá hạn chấm** (HV) — [ĐỀ XUẤT, hỏi chủ SP] | C-002 "Quá hạn"; C-024 "Chờ nhập điểm" |
| Bài đến lịch chưa chấm | "bài chờ chấm" (badge lớp, gồm cả quá hạn) · "Còn phải chấm" (Lịch Test, chỉ tuần này) · "Chờ chấm" · "cần chấm" | **bài chờ chấm** = đến lịch, chưa quá hạn; badge tách "n quá hạn · m chờ chấm" | E-016 đã chốt "Bài chờ chấm" |
| Case chưa có PA chạy | "Case chưa chốt PA" (TQ, Báo cáo) · "Case trống PA" (nhóm con) · "Case chưa có PA" (cột `thieuPa`, `TongQuanQl.tsx:326`) · "Thiếu PA" · "Case chờ xác nhận nguyên nhân" (chuông, `signals.ts:142`) · "Chờ nhận xét / nguyên nhân" | **Case chưa chốt PA** (+ 5 nhóm con của C23); bỏ "Case chờ xác nhận nguyên nhân" | C23 [CHỐT] đặc tả OV-14 |
| Hộp thẻ chờ QL | "Chờ duyệt" (TQ) · "Chờ bạn duyệt" (Công việc) · "{n} thẻ cần duyệt" (badge, đọc màn) · "Mở hộp duyệt" | **Chờ bạn duyệt** ở cả hai trang | A-011 |
| "Chờ duyệt" nghĩa khác | đầu nhóm Đang SOS "1 chờ duyệt" = Case chưa chốt PA (`BangSos.tsx:132,139`); chip HV&L "Chờ duyệt 6" = HV | Đang SOS ghi **chưa chốt PA**; chip ghi đơn vị "6 HV" | một tên một nghĩa |
| SOS | "SOS hiện tại" (TQ) · "Đang SOS" (HV&L) · "SOS theo lớp" (Báo cáo) · "SOS n tạm" (Kết quả thi) · "lượt SOS" | **SOS hiện tại** (trạng thái em) · **lượt SOS trong kỳ** (Phân tích) · đổi chip "Đang SOS" → "SOS · 8 tuần thi" — [hỏi chủ SP, xem Q3] | E-001 chốt "Học viên có SOS" |
| Đạt | "Đạt" = không SOS (Test + SOS) · "Đạt" = OVR ≥ kỳ vọng (Kết quả thi, Báo cáo) | Test + SOS đổi cột thành **Không SOS** | C27 |
| Chưa đủ điểm | "Chưa đủ điểm" (Kết quả thi, Báo cáo) · "Thiếu điểm" (Test + SOS) · "Chờ 4 kỹ năng" (cột Kết quả lưới) | **Chưa đủ điểm** | C05 |
| Người giữ việc | "Người giữ" (HV&L Cần làm) · "Người phụ trách" (Công việc) · "—" cho Speaking chấm chéo (HV&L) · "Speaking chấm chéo" (TQ) · "GV chấm chéo" (Công việc) · "GV chấm S: <tên người xem>" (Lịch Test) | **Người phụ trách**; **GV chấm chéo** | E-024 chốt "Người phụ trách" |
| Việc kế của Case | "Việc tiếp theo" (HV&L Tất cả, `StudentsPage.tsx:311`) · "Việc tiếp" (Đang SOS, Kết quả thi, Cần hỗ trợ) | **Việc tiếp** | E-028 |
| Kết quả | cột "Kết quả" = SOS / "Chờ 4 kỹ năng" (lưới Lịch Test) · = Đạt/Chưa đạt (Kết quả thi) · "Kết quả gần nhất" (HV&L) · "Kết quả đến nay" (Đang SOS = kết quả PA) · "Kết quả PA" · "Kết quả đầu ra" | lưới nhập: **SOS** hoặc **Kết luận MT**; Đang SOS: **Kết quả PA** — [ĐỀ XUẤT] | E-031 |
| Cần chú ý | "HV cần chú ý" (TQ: lịch/điểm/Case) · sheet "HV cần chú ý" (Ý thức: vi phạm) · "Cần chú ý" (TVV/CX: SOS, Case mới, Ý thức 14 ngày) · "Cần chú ý" (Tutor) · "Điểm đáng chú ý" (CX) · "Lớp cần chú ý" | giữ "HV cần chú ý" cho TQ (C23); Ý thức → **HV vi phạm cần xử lý** — [ĐỀ XUẤT] | C23 |
| Chưa có lịch | "chưa lịch Test", cột "Chưa lịch" (TQ) · "MT2 chưa xếp" (KH Test) · "MT2 · chưa xếp" (Sắp tới) · "chưa có lịch" (Lớp tôi dạy) | **Chưa xếp** (+ đợt) | C-029 "Chưa xếp tuần" |
| Ô rỗng | "—" (Kết quả thi cột SOS/Case; Phân tích GV = không áp dụng) · "chưa có" (Kết quả thi ô điểm, cùng hàng) · "không có" (Phân tích GV = áp dụng nhưng chưa có mục) · "0" (Lớp cần chú ý) · "Chưa có" | "—" = không áp dụng; "0" = có áp dụng, chưa có; bỏ "không có" / "chưa có" trong ô số — [ĐỀ XUẤT] | HE_GIAO_DIEN bốn trạng thái |
| Mở | "Mở" (thẻ duyệt, Cần làm, Đang SOS — đều là **làm việc**) · "Mở Case" · "↗" ("1 lớp · 2 bài ↗", "Mở lưới đầy đủ ↗", cột Lịch Test) · "Mở hộp duyệt ›" · "Mở hồ sơ lớp ›" · "Xem" | nút làm việc = động từ việc ("Nhập điểm", "Chốt PA"); link = "Tên đích ›"; "↗" chỉ cho trang riêng | CLAUDE.md "tách nút làm việc với link xem hồ sơ"; D-009 |
| Đóng / bỏ lọc | "Đóng" (chân panel) · "✕" (đầu panel) · "✕" cũng là **bỏ lọc** ("Quá hạn · n ✕", "Lớp … ✕", "Mọi lúc ✕") | "Đóng" cho panel; chip lọc giữ ✕ nhưng có nhãn đọc "Bỏ lọc …" | D-004 (01/10) |
| Mốc thời gian | "Dữ liệu đến 14/09/2026" · "tại 14/09" (Báo cáo) · "hôm nay 14/09" (Công việc) · chuông "Ghi nhận 20/10 16:38" (giờ máy thật trong demo 14/09) | một mẫu: **Dữ liệu đến 14/09**; chuông demo theo ngày demo | luật 30/09 mã tuần |
| Ký hiệu không nhãn | "L R W S" mờ cuối hàng Lịch sắp tới (`Highlights.tsx:130`) | thêm đầu cột "Môn thi" hoặc bỏ | — |

### 2.3 Lỗi nền

**(a) Lỗi console / mạng theo vai — SAU khi PTA Plan sửa môi trường phông.** Chạy lại 53 lần mở trang (QT, QL, GV 7 / 9 / 10, Admin, TVV, CX, Head tutor; Tổng quan, Công việc + panel việc, chuông, Lịch Test, Kế hoạch Test, 6 tab Phân tích, Học viên & Lớp 3 góc, hồ sơ lớp, Tutor): **518 GET API · 0 lỗi console · 0 request ≥ 400 (API hay không) · 0 request hỏng**; `document.fonts`: 15/20 mặt phông nạp, 0 lỗi (5 mặt không cần). Không có 4xx nào nên không có URL `/api/` nào cần soi. Không màn nào gọi API của vai không có quyền. Chữ 16 trang trước / sau khi sửa giống hệt từng dòng (`SCR/a7/so-sanh.mjs`) → mọi số ở bảng 2.1 giữ nguyên.
Trước khi sửa (chỉ để đối chứng, không phải lỗi sản phẩm — A7-06): 22–35 lỗi console mỗi trang, 100 % là tệp phông `/@fs/…/@fontsource/…` bị Vite trả 403; 0 lỗi ở `/api/`.

**(b) Tải trang (máy rà, bản dev, sau khi sửa phông — chỉ để so):**

| Trang (vai) | Tải tới mạng yên | GET API | GET trùng | API chậm nhất |
|---|---|---|---|---|
| Tổng quan (QT / QL) | 1,5–1,7 s | 9–11 | `demo/session` ×2 | `/tong-quan/quan-ly` 59–95 ms |
| Tổng quan CX (24) | 1,7 s | 15 | `demo/session` ×2 | `/tong-quan/chi-nhanh?ct=ft` **241 ms** |
| Công việc (QT / QL / GV) | 1,4–1,6 s | 7–11 | `demo/session` ×2; GV: `/my-work` ×2; QL: `/yeu-cau/dem` ×2 | `/my-work` 36–92 ms |
| Test › Lịch Test | 1,3–1,7 s | 9–15 | `demo/session` ×2 | ≤ 56 ms |
| Kế hoạch Test | 1,4–1,5 s | 6–8 | `demo/session` ×2 | ≤ 26 ms |
| Phân tích (6 tab) | 1,3–1,6 s | 6–10 | `demo/session` ×2 | ≤ 40 ms (CX Báo cáo 129 ms) |
| Học viên & Lớp | 1,5–1,8 s | 6–10 | `demo/session` ×2 | `/hoc-vien-lop?goc=sos` 59–105 ms |
| Hồ sơ lớp MB FT 101 | 1,6–1,8 s | 15–17 | `demo/session`, `roster`, `diem-theo-luot`, `hoc-vien-lop/ids` ×2 (GV thêm `/my-work` ×2) | `/hoc-vien-lop/ids` 68–122 ms |
| Tutor | 1,2–1,4 s | 6–7 | `demo/session` ×2 | ≤ 56 ms |
| Mở chuông | — | +1 | `/notifications` ×2 (mở chuông gọi lại) | — |

Mọi trang có 7 GET khung (`demo/session` ×2, `notifications`, `ref/classes`, `yeu-cau/dem`, `tutors/dem`, `ref/branches`). Bản dev tải 186–383 tệp script mỗi trang — không đại diện bản chính. Không có trang chậm đáng kể; điểm cần dọn là GET trùng (A7-29).

**(c) Số / trạng thái không khớp sau khi việc xong (đọc mã):**
- Badge GV = `/my-work` (cùng Công việc) ✓ tự làm mới khi `invalidate('/my-work')`.
- Badge QL = `/yeu-cau/dem` ✓ làm mới sau duyệt; nhưng **không theo chi nhánh đang xem** (A7-13).
- Tổng quan "Chờ duyệt n" + dải: **không làm mới sau Duyệt nhiều / Từ chối nhiều** (`HopChoDuyet.tsx:113,133` không `invalidate('/tong-quan')`; duyệt từng thẻ thì có — `TheYeuCau.tsx:105,150`) (A7-14).
- Chuông: thông báo tự động đồng bộ khi GET `/notifications`, tối đa 5 phút / người, nhớ trong tiến trình (`thongBaoTuDong.ts:101-117`) — việc người khác làm xong vẫn báo quá hạn tới chu kỳ sau (A7-15); thông báo thẻ duyệt không bao giờ tự hết (A7-05).
- HV&L Cần làm dùng `/my-work` nhưng đếm khác Công việc (A7-07).

### 2.4 Phát hiện (nặng → nhẹ)

### A7-01 "Chờ duyệt 10" nhưng hiện 12 thẻ, có thẻ chi nhánh khác — Loại [XÁC NHẬN-ẢNH] · **P1** · QT / QL nhiều chi nhánh
- Vấn đề: Tổng quan và Công việc khi chi nhánh lấy từ lần chọn trước (URL không có `cn`): đầu nhóm "Chờ duyệt 10 ⚠1 quá hạn" (Monbay) nhưng danh sách là thẻ MỌI chi nhánh: 3 thẻ + "Xem thêm 9" = 12, thẻ đầu BC FT 205 (quá hạn 6 ngày) và CP FT 110; hai thẻ đỏ "Quá hạn" trong khi số ghi ⚠1.
- Bằng chứng: `a7-tq-qt-nho-p1.png`, `a7-cv-qt.png`; API `/tong-quan/quan-ly?branchId=1` → `choDuyet.cho = 10, quaHan = 1`; `/yeu-cau?hop=cho-duyet` (không `branchId`) → 12 thẻ. Có `?cn=1` thì 10 = 10 (`a7-tq-qt-cn`); "Tất cả chi nhánh" thì 12 = 12 (`a7-tq-qt-macdinh`). QL một chi nhánh không gặp (`a7-tq-ql2`).
- Nguyên nhân: triển khai + hai quyết định chồng nhau. `HopChoDuyet.tsx:50-51` chỉ đọc `cn` trên URL (ghi chú "chủ SP 06/10: hộp LUÔN mở Tất cả chi nhánh … khớp badge"), còn trang dùng `params.get('cn') ?? useChiNhanhMacDinh()` (`OverviewPage.tsx:35-36`, `HoTroHocVienTab.tsx:67`) và OV-15h1 cho số theo chi nhánh (`HoTroHocVienTab.tsx:274-275`, `tongQuan.ts:196`).
- Ảnh hưởng: Chị Vy (QL đa chi nhánh) duyệt thẻ chi nhánh khác tưởng của mình; số không bằng số dòng → mất tin vào mọi số.
- Phương án: truyền `branchId` của trang vào `HopChoDuyet` (prop), số đầu nhóm lấy từ CHÍNH danh sách đã lọc (`ds.length`, `quaHan` của `ds`); khi đang lọc chi nhánh và còn thẻ nơi khác: một dòng "2 thẻ ở chi nhánh khác · Xem" (không giấu). Badge thanh trên giữ tổng mọi chi nhánh, chữ đọc màn + `title` ghi "mọi chi nhánh".
- Lý do: một bộ lọc cho cả trang (CLAUDE.md "cùng số liệu cùng nguồn"; đặc tả §3.1 "số = số hàng"). Lệch mockup: mockup 3 khung 1 vẽ số = số thẻ.

### A7-02 Báo cáo "10 PA có kết quả trong kỳ" không theo kỳ — Loại [PHÁT HIỆN] · **P1** · QL, QT, CX (báo cáo in)
- Vấn đề: số 10 giữ nguyên ở mọi khoảng thời gian, kể cả 05–18/01/2026 (chưa có lớp nào); tab Hiệu quả PA cùng bộ lọc ra 2 (W1+W2 SEP), 6 (W1+W2 AUG), 0 (JUN).
- Bằng chứng: `SCR/a7/out/a7-api-ky/eval-ky.json`; ảnh `a7-pt-bc-qt.png` (khối Case / PA). Mã: `server/src/worklist/metrics.ts:902-908` không dùng `f.from/f.to`; hợp đồng `shared/domain/metrics.ts:125-129` ghi `thoiGian: 'ket-qua-trong-ky'`; `baoCao.ts:137` truyền khoảng; nhãn `BaoCao.tsx:165`.
- Nguyên nhân: triển khai (chỉ số chưa áp thời gian).
- Ảnh hưởng: báo cáo 2 tuần in cho giao ban sai số; panel khi bấm cũng ra 10 dòng (cùng hàm) nên không ai phát hiện.
- Phương án: lọc `planOutcomes` theo ngày kết quả cuối ∈ [tu, den] ngay trong `metricSetGoc` (một chỗ, mọi nơi gọi đều đúng); thêm phép kiểm "Báo cáo.paKetQua = Hiệu quả PA.paCoKetQua" cùng bộ lọc.

### A7-03 Dải "HV cần chú ý" trộn hai phạm vi khung — Loại [XÁC NHẬN-ẢNH] · **P1** · QL, QT
- Vấn đề: dải nằm ngay dưới công tắc Fast Track · Lớp thường nhưng chỉ 3 số theo công tắc; "⚠ 5 quá hạn" và "58 bài trễ chấm · 4 GV" luôn gộp hai khung. FT: "13 HV · 19 Case chưa chốt PA · ⚠5"; Lớp thường: "11 HV · 14 Case · ⚠5" — cùng ⚠5. Đọc "19 Case · ⚠5 quá hạn" ai cũng hiểu 5 trong 19 — sai (2/5 là MB FOU 12, MB FOU 15). Ngay dưới, khối "Trễ chấm 53 bài · 3 GV" theo khung → hai số "trễ chấm" khác nhau trên một màn.
- Bằng chứng: `a7-tq-qt-nho-p1.png` vs `a7-tq-qt-thuong--thuong.png`; `KhoiCanQuyet.tsx:25-49` (`bang` theo khung + `data.canXuLy` gộp); `tongQuan.ts:39-42,81-85` ("LUÔN GỘP HAI KHUNG"); `tongQuanQl.ts:35-37`.
- Nguyên nhân: thiết kế (OV-15d/h1 giữ "Cần xử lý" gộp khung để đổi khung không tải lại).
- Ảnh hưởng: QL đọc sai quy mô việc của từng khung; phải mở Báo cáo / Lịch Test để đối chiếu (thêm 2–3 lần chuyển trang).
- Phương án: mọi số trên trang theo công tắc khung (máy chủ: `/tong-quan/ql?ct=` trả luôn `caseQuaHan` và `baiQuaHan` theo khung — `metricSet(…, {program: ct})`); Cần bạn quyết có thể giữ gộp nhưng ghi rõ "cả hai khung" ở đầu khối. Số đổi khi bấm công tắc là đúng kỳ vọng người dùng.

### A7-04 Bốn số "SOS" cho cùng chi nhánh + khung, nhãn không phân biệt — Loại [XÁC NHẬN-ẢNH] · **P1** · QL, QT, GVCN
- Vấn đề: TQ "SOS hiện tại" 6/5/3 (14 HV) · HV&L "Đang SOS" 9 HV · Báo cáo "SOS theo lớp" 2/3/0 (5 HV) · Kết quả thi SOS 3/4/2 (9 lượt). "Đang SOS" và "SOS hiện tại" cùng nghĩa trong tiếng Việt mà khác số. Báo cáo và Kết quả thi cùng khoảng W1+W2 SEP: SOS 3 là 0 vs 2 (Kết quả thi tính 4 SOS "tạm" của MB FT 105, Báo cáo không).
- Bằng chứng: bảng 2.1 dòng 8; `a7-tq-qt-nho-p2.png`, `a7-hv-sos-qt.png`, `a7-pt-bc-qt.png`, `a7-pt-kqt-qt.png`; mã ở bảng.
- Nguyên nhân: thiết kế — mỗi màn tự chọn định nghĩa (trạng thái mới nhất / 8 tuần thi / trong kỳ) và luật SOS tạm ngược nhau; nhãn không nói định nghĩa.
- Ảnh hưởng: giao ban hỏi "Monbay đang có bao nhiêu em SOS?" → 4 câu trả lời; GVCN không biết em nào thật sự cần theo dõi.
- Phương án: hai khái niệm, hai tên: (1) **SOS hiện tại** = `hv-sos-hien-tai` (TQ, Lớp tôi dạy, và số trên chip Học viên & Lớp); (2) **Lượt SOS trong kỳ** (Báo cáo, Test + SOS, Kết quả thi) với MỘT luật tạm: đếm cả tạm, ghi "(n tạm)". Góc "Đang SOS" giữ lọc tuần thi (chủ SP 14/10) nhưng đổi chữ thành "SOS theo tuần thi" — xem Q3.

### A7-05 Chuông xếp việc quá hạn vào "Để biết"; thẻ đã xử lý vẫn "Chờ duyệt" và vẫn được đếm — Loại [PHÁT HIỆN] · **P1** · mọi vai
- Vấn đề: GV 10: "CẦN LÀM 1 · ĐỂ BIẾT 8" — 4 "Quá hạn chấm · MB FT 101 … quá hạn 5–68 ngày" và "Case chưa chốt PA quá hạn · Đỗ Minh Khôi" nằm ở **Để biết**. QT: 8 "Chốt lộ trình … quá hạn 8–64 ngày" ở Để biết; 6 thông báo "Chờ duyệt · …" của thẻ đã xử lý (`con_viec = 0`) vẫn chưa đọc, vẫn tính vào "Thông báo 30", tiêu đề vẫn "Chờ duyệt".
- Bằng chứng: `a7-chuong-gv10--chuong.png`, `a7-chuong-qt--chuong.png`; `shared/domain/duongHoSo.ts:150-158` (`LOAI_CAN_LAM` thiếu `cham_qua_han`, `case_chua_chot_pa`, `chot_lo_trinh`), trong khi `server/src/platform/thongBao.ts:39-40` ghi "luôn là Cần làm"; thông báo thường không đồng bộ xoá (`thongBaoTuDong.ts` chỉ lo 3 loại tự động).
- Nguyên nhân: triển khai (OV-15d thêm 3 loại ở máy chủ, quên bảng nhóm ở web) + thiết kế (thông báo duyệt không tự hết).
- Ảnh hưởng: GV bỏ sót bài quá hạn vì nghĩ chỉ "để biết"; số chuông thổi phồng bởi việc đã xong → trái luật "việc đã xong không nơi nào còn báo chờ".
- Phương án: thêm 3 loại vào `LOAI_CAN_LAM` (một dòng); thông báo `con_viec = 0` hiển thị "Đã xử lý · …" và không tính vào số (hoặc tự đánh dấu đã đọc khi việc xong); số trên chuông = số Cần làm còn mở — Q5. (ui-ux-pro-max `tab-badge`: số trên mục điều hướng chỉ báo việc đang chờ, hết khi đã xử lý.)

### A7-06 (RÚT — môi trường thử, không phải lỗi sản phẩm) "~32 lỗi 403 khi QT mở Tổng quan"
- Kết luận: trước khi PTA Plan sửa, 100 % lỗi console (22–35 / trang, Tổng quan QT = 32) là tệp phông `/@fs/D:/Github/Pisa-tracking/node_modules/@fontsource/…` bị Vite chặn (worktree có `node_modules` liên kết ra ngoài thư mục được phép); 0 lỗi nằm ở `/api/`. Đã sửa bằng `fs.allow` tạm trong worktree; chạy lại 53 lần mở trang: **0 lỗi console, 0 request ≥ 400** (mục 2.3 a). Không tính vào điểm, không cần việc cho session code. Bằng chứng trước sửa: `SCR/a7/out-truoc-sua-phong/*/net.json`, `a7-font/eval-font.json` (0/20 mặt phông nạp được); ảnh chủ SP `1.jpg` đúng phông nên máy chủ SP không gặp.
- Việc cho đợt rà: ảnh agent chụp TRƯỚC lúc sửa dùng phông dự phòng — không dựa vào chúng để chấm chữ / độ rộng cột / chữ bị cắt "…".

### A7-07 Cùng `/my-work`, hai số "việc quá hạn" — Loại [PHÁT HIỆN] · **P2** · QL, QT
- Vấn đề: QL Monbay: Công việc "⚠ 33 quá hạn · 84 việc"; Học viên & Lớp › Cần làm "Quá hạn 40 việc · 181 việc" (cùng phạm vi). Code ghi "cùng số Công việc" nhưng HV&L tách việc gộp (`con`) thành 126 dòng (40 quá hạn) rồi thêm dòng Chờ duyệt / Thiếu thông tin.
- Bằng chứng: `a7-cv-ql2`, `a7-hv-canlam-ql2`; `StudentsPage.tsx:162-166, 209-224`; API `my-work?nguoi=tat-ca&branchId=1`: `summary.overdue = 33`, tách `con` → 40.
- Nguyên nhân: triển khai (hai cách đếm một nguồn).
- Ảnh hưởng: QL không biết "bao nhiêu việc trễ" — hai trang hai số.
- Phương án: một đơn vị "việc" = dòng của Công việc (gộp như Công việc); HV&L hiện dòng gộp có số em, mở ra mới thấy dòng con.

### A7-08 "Cần làm 51" = "Tất cả 51" — Loại [XÁC NHẬN-ẢNH] · **P2** · QL, QT
- Vấn đề: chip Cần làm đếm **HV có ít nhất một việc**, gồm cả "Thiếu thông tin" (46/51 em FT) → chip lọc ra gần như toàn bộ; trong khi danh sách đếm **việc** ("1–50 / 118 việc"); lọc phụ trộn đơn vị: "Quá hạn 23 việc · Chờ duyệt 6 · Thiếu thông tin 46" (hai số sau là HV).
- Bằng chứng: `a7-hv-canlam-qt.png`; `StudentsPage.tsx:233-271` (`viecTatCa = [...viecCongViec, ...viecPhu]`, `emCua`).
- Nguyên nhân: kế hoạch (P14: Thiếu thông tin, Chờ duyệt nằm trong Cần làm) + triển khai (đơn vị chip).
- Ảnh hưởng: chip vô nghĩa; "Thiếu thông tin" (việc hành chính) che việc học thuật.
- Phương án: chip Cần làm đếm **việc** (= Công việc trong phạm vi trang); "Thiếu thông tin" thành lọc phụ không cộng vào Cần làm — câu hỏi Q7 (đụng P14).

### A7-09 Đầu nhóm lớp ở Cần làm đếm theo trang — Loại [XÁC NHẬN-ẢNH] · **P2** · QL, QT, GV
- Vấn đề: cùng lớp MB FT 101: 10 dòng/trang → "⚠ 8 việc quá hạn · 1 em"; 50 dòng/trang → "⚠ 22 việc quá hạn · 15 em" (ảnh chủ SP là bản 50).
- Bằng chứng: `a7-hv-canlam-qt.png` vs `a7-hv-canlam50-qt--50.png`; `StudentsPage.tsx:558` truyền `pt.cat(viecHien)`; `BangCanLam.tsx:56-74` đếm trên mảng đã cắt.
- Nguyên nhân: triển khai.
- Phương án: đếm đầu nhóm trên `viecHien` đầy đủ (truyền tổng theo lớp vào `BangCanLam`), phân trang chỉ cắt dòng; lớp kéo qua hai trang ghi "(tiếp)".

### A7-10 Việc "2 bài" mở ra 3 em; badge lớp "78 bài chờ chấm" — Loại [XÁC NHẬN-ẢNH] · **P2** · GV, QL
- Vấn đề: việc "Nhập điểm Writing Task 2 · MT1 W1 JUL · 2 bài" (em 63, 64) mở panel lưới tuần có 3 hàng, hàng Bùi Thảo Vy là lượt **MT lịch sử** (attempt 126, `lich_su = 1` — không phải nợ), ô trống giống hệt hai ô cần nhập, không có nhãn "MT cũ". Cùng gốc: badge lớp "78 bài chờ chấm" (gồm bài chưa tới hạn và — theo mã — cả MT cũ) cạnh "Trễ chấm" của lớp = 49.
- Bằng chứng: `a7-cv-gv10-viec--panel.png`; API `my-work` (`emIds [64,63]`), `classes/3/cham?periodId=31&kind=mock` (3 hàng); DB lớp 3 có 8 lượt `lich_su = 1` đang chờ (5 em) = "MT cũ chưa nhập · MB FT 101 · MT1 · 5 em" ở Lịch Test; `scoreDebt.ts:29` loại `lich_su`, `attempts.ts:486` (`overdue` loại), `shared/domain/fasttrack.ts:279-284` + `classes.ts:200-273` (badge không loại).
- Nguyên nhân: triển khai (panel việc dùng lưới cả tuần; badge dùng hàm khác).
- Ảnh hưởng: Cô Linh nhập thừa hoặc lo "thiếu 1 bài"; QL thấy 78 mà Trễ chấm 49.
- Phương án: panel của việc chỉ hiện em trong `emIds` (nút "Cả lớp" đã có để xem hết); hàng MT cũ ghi "MT cũ · không bắt buộc"; badge lớp tách "n quá hạn chấm · m chờ chấm" bằng CHÍNH tập nợ điểm (`overdueScoreBai`), MT cũ đếm riêng.

### A7-11 Phân tích: "Đạt", "lượt", "chưa đủ điểm" khác nhau giữa các tab — Loại [PHÁT HIỆN] · **P2** · QL, QT
- Vấn đề: cùng Monbay · FT · W1+W2 SEP: Test + SOS "16 lượt · Đạt 6 · Thiếu điểm 5"; Kết quả thi và Báo cáo "17 lượt · Đạt 5 · Chưa đủ điểm 8".
- Bằng chứng: `a7-pt-th-qt.png`, `a7-pt-kqt-qt.png`; `tongHop.ts:33-40,135-136` (Đạt = không SOS; bỏ lượt KCK; chưa chốt = chưa đủ) vs `ketQuaThi.ts:89-95`. Lượt thứ 17 bị Test + SOS bỏ: Hồ Gia Hân (attempt 190, chu kỳ không cam kết) — Kết quả thi vẫn đếm.
- Nguyên nhân: thiết kế (hai thang: mức SOS và đạt kỳ vọng) dùng chung chữ.
- Phương án: Test + SOS đổi "Đạt" → **Không SOS**, "Thiếu điểm" → **Chưa đủ điểm**; ⓘ ghi vì sao 16 ≠ 17 (lượt KCK).

### A7-12 Nơi báo "chưa lịch Test" và nơi xếp lịch đếm khác luật — Loại [XÁC NHẬN-ẢNH (một phần)] · **P2** · QL
- Vấn đề: TQ hàng MB FT 105 "Chưa lịch 0", Kế hoạch Test cùng lớp "MT2 chưa xếp 4 em"; MB FT 101: TQ 3, KH Test "MT2 chưa xếp 1 em". Nghi vấn "3 (TQ) vs 2 (Báo cáo)": hiện cả hai = 3, cùng hàm, kiểm 4 khoảng thời gian đều 3 → [GIẢ THUYẾT] hai ảnh chụp lúc dữ liệu khác.
- Bằng chứng: `a7-test-kh-qt.png`, API `ke-hoach-test/lop?branchId=1` (`chuaCoLichTiep` 2 / 3, `tomTat`), `a7-api-ky`.
- Nguyên nhân: thiết kế (TQ = "xong MT cuối, chưa MT kế"; KH Test = "đợt kế của MT đang thi").
- Phương án: Kế hoạch Test thêm chip "Chưa lịch Test (3)" dùng CHÍNH `hv-ft-xong-mt-cuoi-chua-mt-ke`, bấm số ở TQ mở thẳng Kế hoạch Test lọc 3 em đó.

### A7-13 Badge "Công việc n" hai nghĩa — Loại [XÁC NHẬN-ẢNH] · **P2** · mọi vai
- Vấn đề: GV: "Công việc 5" = việc quá hạn của tôi (khớp "⚠ 5 quá hạn"). QL/QT: "Công việc 12" = thẻ chờ duyệt mọi chi nhánh (trang đang Monbay 10; việc quá hạn của QT 33 không có ở đâu trên thanh trên).
- Bằng chứng: `a7-cv-gv10/header.txt` ("5 việc quá hạn"), `a7-tq-qt-nho/header.txt` ("12 thẻ cần duyệt, 2 quá hạn"); `App.tsx:150-158`.
- Phương án: giữ nghĩa theo vai (việc cần chính mình làm ngay) nhưng ghi `title` hiện được bằng chuột / chạm ("12 thẻ chờ bạn duyệt · mọi chi nhánh"); với QL đa chi nhánh lấy theo chi nhánh đã nhớ — Q6. (ui-ux-pro-max `tab-badge`, `contextual-live-badge-updates`.)

### A7-14 Tổng quan không làm mới số sau "Duyệt nhiều" — Loại [PHÁT HIỆN — mã, chưa bấm thử] · **P2** · QL, QT
- Vấn đề: duyệt / từ chối nhiều thẻ tại Tổng quan: danh sách và badge làm mới, "Chờ duyệt n" + dải + Case chưa chốt PA vẫn số cũ tới khi tải lại trang.
- Bằng chứng: `HopChoDuyet.tsx:113,133` chỉ `invalidate('/yeu-cau' | '/my-work' | '/cases')`; duyệt một thẻ có `invalidate('/tong-quan')` (`TheYeuCau.tsx:105,150`).
- Phương án: thêm `invalidate('/tong-quan')` ở hai chỗ — hoặc (tốt hơn, cùng A7-01) số đầu nhóm lấy từ chính danh sách. [CẦN ẢNH] bấm thử trên bản sao dữ liệu.

### A7-15 Chuông trễ ≤ 5 phút và theo bộ nhớ tiến trình — Loại [PHÁT HIỆN — mã] · **P2** · GV
- Vấn đề: QL nhập điểm thay GV → chuông GV còn "Quá hạn chấm … quá hạn n ngày" tới lần đồng bộ sau (≥ 5 phút, khi GV tải trang); bản chính nhiều bản hàm có thể lâu hơn. Mã tự ghi nhận (`thongBaoTuDong.ts:104-110`, "ponytail: OV-15i1 ý 12 — chưa làm").
- Phương án: đường ghi điểm / Case xoá thông báo theo `dedup_key` của người giữ việc ngay khi việc hết (một câu DELETE), không chờ chu kỳ.

### A7-16 Tutor mở ra trang rỗng; chip không cộng ra Tất cả — Loại [XÁC NHẬN-ẢNH] · **P2** · QT, Head tutor, QL
- Vấn đề: chip mặc định = Cần chú ý nếu > 0, không thì **Đang dạy** — Đang dạy 0 (không ai có buổi trong 2 tuần) → "Không có tutor khớp bộ lọc" dù có 8 tutor (QL: 3). 0 + 0 + 1 + 1 ≠ 8: chip chồng nhau, "Đang dạy" theo kỳ, "Ngừng / Thiếu" không theo kỳ, 6 tutor không thuộc chip nào.
- Bằng chứng: `a7-tutor-qt.png`, `a7-v2-tutor`; `TutorPage.tsx:21-27,56-58`; API `/tutors?…` (8 dòng, `buoi` = 0).
- Phương án: mặc định rơi về **Tất cả** khi chip mặc định rỗng; thêm "Chưa có buổi trong kỳ" hoặc ⓘ "chip lọc chồng nhau, không cộng". (ui-ux-pro-max Feedback › Empty States: rỗng phải là kết quả thật, kèm hành động — không để bộ lọc mặc định tạo ra trang rỗng.)

### A7-17 "Case chưa chốt PA 5" ở Cần bạn quyết cùng tên với "19 Case chưa chốt PA" — Loại [XÁC NHẬN-ẢNH] · **P2** · QL
- Vấn đề: nhóm chỉ chứa Case **quá hạn** (gộp khung) nhưng tên giống dải; đầu nhóm lặp "5 ⚠5 quá hạn".
- Bằng chứng: `KhoiCanQuyet.tsx:94` (`nhom(t('Case chưa chốt PA'), caseQh.length, caseQh.length)`).
- Phương án: tên "Case chưa chốt PA quá hạn · 5", bỏ chip ⚠ lặp.

### A7-18 Bài quá hạn chấm có 4 số, "GV" không đếm chấm chéo — Loại [XÁC NHẬN-ẢNH] · **P2** · QL, QT
- Vấn đề: 58 · 4 GV (dải) / 53 · 3 GV (khối, 4 dòng) / 28 · 3 GV (Báo cáo, 4 dòng) / 58 · 4 lớp (Lịch Test). Phần khung đã nêu ở A7-03; phần còn lại: Báo cáo đếm bài **của lượt thi trong kỳ** mà nhãn chỉ "bài quá hạn"; "3 GV" đứng trên bảng 4 dòng (dòng "Speaking chấm chéo").
- Bằng chứng: `baoCao.ts:54-70`, `BaoCao.tsx:87`, `TongQuanQl.tsx:335-336`.
- Phương án: Báo cáo ghi "28 bài quá hạn · của lượt thi trong kỳ"; mọi chỗ ghi "3 GV + chấm chéo".

### A7-19 Chuông "Cần làm" có việc mà Công việc không có — Loại [PHÁT HIỆN] · **P2** · GV
- Vấn đề: GV 10, nhóm CẦN LÀM: "Case chờ xác nhận nguyên nhân · Reading · Chu Minh Hiếu — Hạn 16/09. Từ điểm vừa nhập, chưa thành Case." Công việc của GV (11 việc) không có việc nào về em này. Tên cũ và tự mâu thuẫn ("Case … chưa thành Case").
- Bằng chứng: `a7-chuong-gv10--chuong.png`; DB `case_signals.id 8` (`status pending`, `owner_user_id 10`, lớp MB FT 102, `verify_due 2026-09-16`); `/my-work` GV 10; `server/src/cases/signals.ts:140-143`, `thongBao.ts:42`.
- Nguyên nhân: [GIẢ THUYẾT] luồng tín hiệu (`case_signals`) không còn sinh việc trong `myWork` nhưng vẫn sinh thông báo — cần session code xác nhận luồng còn dùng.
- Phương án: hoặc sinh việc tương ứng trong Công việc, hoặc thôi báo / đóng tín hiệu; đổi chữ theo C23.

### A7-20 "Tổng quan" vs "Việc hôm nay" — Loại [XÁC NHẬN-ẢNH] · **P2** · QL, QT
- Vấn đề: thanh trên "Tổng quan", h1 cùng trang "Việc hôm nay"; trang chứa cả Lớp cần chú ý, Tuần này, Trễ chấm (68 ngày) — không chỉ "hôm nay". GV có "Chào Linh · hôm nay 14/09" ở Công việc.
- Bằng chứng: `shared/domain/dieuHuong.ts:160`, `OverviewPage.tsx:52,75`.
- Phương án: h1 = "Tổng quan" (một trang một tên); "Tuần này" chỉ bao Lịch sắp tới, chuyển Trễ chấm lên khối việc.

### A7-21 Chín tên cho "bài quá hạn chấm"; "chưa điểm" là HV — Loại [PHÁT HIỆN] · **P2** · mọi vai
- Vấn đề / bằng chứng: bảng 2.2 dòng 2–3 (`TongQuanQl.tsx:202-217`, `DaiSo.tsx:23-27`, `BaoCao.tsx:87,159`, `LopToiDay.tsx:49-54`, `thongBaoTuDong.ts:51`, `shared/huongDan/admin.ts:18`).
- Phương án: "bài quá hạn chấm" (bài) · "HV có bài quá hạn chấm" (HV) · "bài chờ chấm" (đến lịch, chưa quá hạn) — Q8.

### A7-22 "Chờ duyệt": hai nghĩa, ba đơn vị, hai tên hộp — Loại [PHÁT HIỆN] · **P2** · QL
- Vấn đề / bằng chứng: bảng 2.1 dòng 1; `BangSos.tsx:132,139` ("1 chờ duyệt" = Case chưa chốt PA); TQ "Chờ duyệt" vs Công việc "Chờ bạn duyệt" cho cùng hộp.
- Phương án: hộp = "Chờ bạn duyệt" ở mọi nơi; Đang SOS ghi "chưa chốt PA"; mọi số kèm đơn vị ("10 thẻ", "6 HV").

### A7-23 Người giữ việc / chấm chéo nhiều tên — Loại [PHÁT HIỆN] · **P3** · QL
- Bằng chứng: `BangCanLam.tsx:28,119-120` ("Người giữ", "—" cho Speaking), `TongQuanQl.tsx` ("Speaking chấm chéo"), Công việc "GV chấm chéo", Lịch Test "GV chấm S: <tên người xem>".
- Phương án: "Người phụ trách" (E-024); "GV chấm chéo" ở mọi nơi, không để "—".

### A7-24 "Kết quả" một chữ nhiều nghĩa — Loại [PHÁT HIỆN] · **P3** · GV, QL
- Bằng chứng: cột "Kết quả" lưới Lịch Test hiện "SOS 1 · S" / "Chờ 4 kỹ năng"; Kết quả thi hiện Đạt/Chưa đạt; Đang SOS "Kết quả đến nay" = kết quả PA.
- Phương án: lưới nhập: "Kết luận MT"; Đang SOS: "Kết quả PA".

### A7-25 Ô rỗng bốn cách — Loại [PHÁT HIỆN] · **P3** · mọi vai
- Bằng chứng: Kết quả thi cùng một hàng "chưa có" (ô điểm) và "—" (SOS, Case, Việc tiếp) (`a7-pt-kqt-qt.png`); Phân tích GV chú giải "— không áp dụng · không có = áp dụng, chưa có mục" (`shared/domain/phanTichGv.ts:78`); Lớp cần chú ý "0".
- Phương án: "—" = không áp dụng; "0" = áp dụng, chưa có; bỏ "không có" / "chưa có" trong ô số.

### A7-26 "HV cần chú ý" ba định nghĩa — Loại [PHÁT HIỆN] · **P3** · QL, TVV, CX
- Bằng chứng: `KhoiCanQuyet.tsx:38-39` (lịch / điểm / Case), `YThucPhoiHop.tsx:70` (sheet vi phạm), `HocVienTheoVai.tsx:78` (SOS, Case mới, Ý thức 14 ngày).
- Phương án: giữ cho TQ (C23); sheet Ý thức "HV vi phạm cần xử lý"; chip TVV/CX giữ "Cần chú ý" kèm ⓘ (đã có).

### A7-27 Nút "Mở" dùng cho việc làm và cho xem; "↗" lẫn — Loại [PHÁT HIỆN] · **P3** · mọi vai
- Bằng chứng: bảng 2.2 dòng "Mở"; `TheYeuCau.tsx:267`, `BangCanLam.tsx:84`, `BangSos.tsx:145`, `PanelViec.tsx:170,218,271`.
- Phương án: nút làm việc = động từ việc; link = "Tên đích ›"; "↗" chỉ khi mở trang riêng.

### A7-28 Ký hiệu ✕ hai nghĩa; mốc thời gian ba cách; số không đơn vị — Loại [PHÁT HIỆN] · **P3**
- Bằng chứng: ✕ đóng panel và ✕ bỏ lọc (`HopChoDuyet.tsx:168`, chip lớp); "Dữ liệu đến 14/09/2026" / "tại 14/09" / "hôm nay 14/09"; chuông demo "Ghi nhận 20/10 16:38" trong ngày demo 14/09 (thông báo "từ tương lai" — chỉ demo); "Tuần này · W3 SEP 7" không ghi "em"; "L R W S" mờ không nhãn.
- Phương án: theo bảng 2.2.

### A7-29 Tải trùng + 7 GET khung mỗi trang — Loại [PHÁT HIỆN] · **P3**
- Bằng chứng: bảng 2.3 (b).
- Phương án: hồ sơ lớp gom `roster` / `diem-theo-luot` / `hoc-vien-lop/ids` một lần; `/my-work` một lần mỗi trang; `demo/session` một lần.

---

## Phần 3. Đề xuất lớn — "Một sổ số liệu cho cả web"

**Hiện trạng:** mỗi màn tự chọn phạm vi (khung, chi nhánh, toàn bộ / trong kỳ / tuần), tự chọn đơn vị (bài, HV, thẻ, việc, lượt) và tự chọn luật (SOS tạm), nhưng dùng chung nhãn → ≥ 12 cặp số "cùng tên khác số" (bảng 2.1).

**Đề xuất (4 luật, áp cho mọi màn quản lý):**
1. **Bộ lọc trang = bộ lọc mọi số trên trang** (chi nhánh đã nhớ / trên URL, khung, khoảng thời gian). Số nào cố ý khác phạm vi (badge thanh trên, chuông) ghi rõ "mọi chi nhánh" ngay cạnh số.
2. **Một khái niệm = một chỉ số trong sổ `shared/domain/metrics.ts` = một tên.** Thêm chỉ số còn thiếu: "lượt SOS trong kỳ" (một luật tạm), "bài quá hạn chấm của lượt trong kỳ"; sửa `pa-co-ket-qua` theo kỳ. Màn chỉ chọn chỉ số, không tự đếm (Học viên & Lớp, Báo cáo, Kết quả thi, Test + SOS đọc qua `metricSet`).
3. **Số luôn kèm đơn vị** ("10 thẻ", "6 HV", "58 bài", "33 việc", "9 lượt").
4. **Chuông = Công việc:** nhóm Cần làm chỉ gồm việc còn mở có trong Công việc (cùng hàm); việc xong → thông báo đổi "Đã xử lý" và rời số đếm; đồng bộ ngay khi ghi.
Kèm **một phép kiểm "cùng số"** ở máy chủ: mỗi dòng ✓ của bảng 2.1 thành một khẳng định (TQ Chờ duyệt = số thẻ cùng chi nhánh; Báo cáo.paKetQua = Hiệu quả PA; Báo cáo SOS = Kết quả thi SOS; Công việc overdue = HV&L Quá hạn…).

**Số bước trước / sau (tình huống thật):**
- Chị Vy giao ban, đối chiếu Chờ duyệt: trước — thấy 10, đếm 12 thẻ, đổi chi nhánh hoặc mở hộp duyệt để hiểu (3–4 bấm + nghi ngờ mọi số); sau — 10 = 10 thẻ + dòng "2 thẻ ở chi nhánh khác", 0 bấm.
- QL in Báo cáo 2 tuần: trước — "10 PA có kết quả" sai, muốn kiểm phải mở Hiệu quả PA (2 bấm, so tay); sau — 0 bấm, số đúng.
- QL hỏi "bao nhiêu em SOS": trước — 4 số ở 4 màn, phải nhớ định nghĩa; sau — "SOS hiện tại 14 HV" một chỗ, Phân tích ghi "lượt SOS trong kỳ 9 (4 tạm)".
- Cô Linh mở việc "2 bài": trước — 3 ô trống, phân vân ô thứ 3; sau — 2 hàng đúng việc, "Cả lớp" khi cần.

**Rủi ro:** số quen thuộc sẽ đổi (dải TQ theo khung; Báo cáo PA); cần ghi nhật ký thay đổi cho QL. Phép kiểm "cùng số" tăng thời gian `npm run check` một chút.
**Chủ SP cần quyết:** Q1–Q8 dưới đây (đặc biệt Q1 đụng quyết định 06/10, Q3 đụng quyết định 14/10, Q7 đụng P14).

---

## Phần 4. Câu hỏi cho chủ SP + ảnh cần thêm

1. **Q1** Hộp Chờ duyệt ở Tổng quan / Công việc theo chi nhánh đang chọn (khuyến nghị: số = thẻ = chi nhánh đang chọn, kèm dòng "n thẻ ở chi nhánh khác") hay luôn mọi chi nhánh như quyết định 06/10?
2. **Q2** Dải "HV cần chú ý" và Cần bạn quyết theo công tắc Fast Track / Lớp thường (khuyến nghị) hay giữ gộp hai khung?
3. **Q3** "Đang SOS" (theo tuần thi, quyết định 14/10) và "SOS hiện tại" (TQ) đang khác số. Đổi chữ chip thành "SOS theo tuần thi" (khuyến nghị) hay đổi định nghĩa cho bằng SOS hiện tại?
4. **Q4** SOS "tạm" (chưa đủ điểm) có tính vào Báo cáo không? Hiện Kết quả thi tính, Báo cáo không.
5. **Q5** Số trên chuông: đếm mọi thông báo chưa đọc (hiện tại, gồm việc đã xong) hay chỉ việc Cần làm còn mở (khuyến nghị)?
6. **Q6** Badge "Công việc n" của QL: thẻ chờ duyệt (hiện tại) hay số việc quá hạn như GV?
7. **Q7** Học viên & Lớp › Cần làm có gồm "Thiếu thông tin" (P14) không? Hiện làm Cần làm = Tất cả (51 = 51).
8. **Q8** Chốt một tên cho bài quá hạn chấm: "bài quá hạn chấm" (khuyến nghị) / "bài trễ chấm" / "nợ điểm"?

**Ảnh cần thêm:**
- [CẦN ẢNH] Tổng quan rồi Phân tích › Báo cáo (Monbay, Fast Track, W1 + W2 SEP) chụp **liền nhau trong 1 phút**, vùng "HV cần chú ý" của cả hai — để chốt nghi vấn "3 vs 2 chưa lịch Test" (hiện tái hiện 3 = 3).
- [CẦN ẢNH] Trên bản sao dữ liệu: Tổng quan › Cần bạn quyết, tích 2 thẻ cùng loại › "Duyệt 2 yêu cầu", chụp số "Chờ duyệt n" trước / sau — kiểm A7-14.
- [CẦN ẢNH] Chuông của GV sau khi QL nhập điểm thay GV đó (một bài quá hạn) — chụp ngay và sau 5 phút — kiểm A7-15.

---

## Phần 5. Ảnh tiêu biểu

1. `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b\scratchpad\anh\a7\a7-tq-qt-nho-p1.png` — Chờ duyệt 10 vs 12 thẻ có BC/CP; dải trộn khung.
2. `…\scratchpad\anh\a7\a7-tq-qt-thuong--thuong.png` — bật Lớp thường: ⚠5 và 58 · 4 GV không đổi.
3. `…\scratchpad\anh\a7\a7-pt-bc-qt.png` — Báo cáo: 28 bài · 3 GV (4 dòng), SOS 2/3/0, "10 PA có kết quả trong kỳ".
4. `…\scratchpad\anh\a7\a7-pt-kqt-qt.png` — Kết quả thi cùng kỳ: SOS 3/4/2 (có tạm), "chưa có" cạnh "—".
5. `…\scratchpad\anh\a7\a7-pt-th-qt.png` — Test + SOS: 16 lượt, Đạt 6, Thiếu điểm 5.
6. `…\scratchpad\anh\a7\a7-hv-canlam50-qt--50.png` — Cần làm 51 = Tất cả 51; đầu nhóm 22 · 15 em (đổi theo trang).
7. `…\scratchpad\anh\a7\a7-hv-canlam-qt.png` — cùng lớp, 10 dòng/trang: 8 · 1 em.
8. `…\scratchpad\anh\a7\a7-cv-gv10-viec--panel.png` — việc "2 bài", panel 3 em (MT cũ không nhãn).
9. `…\scratchpad\anh\a7\a7-chuong-gv10--chuong.png` — chuông GV: việc quá hạn ở "Để biết", "Case … chưa thành Case" ở "Cần làm".
10. `…\scratchpad\anh\a7\a7-chuong-qt--chuong.png` — chuông QT: Chốt lộ trình quá hạn ở Để biết, "Chờ duyệt ·" đã xử lý.
11. `…\scratchpad\anh\a7\a7-tutor-qt.png` — Tutor mặc định rỗng, chip 0+0+1+1 vs 8.
12. `…\scratchpad\anh\a7\a7-test-kh-qt.png` — Kế hoạch Test "MT2 chưa xếp 4 em" (TQ hàng MB FT 105 = 0).

(`…` = `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\70d93ba9-2455-4a02-8433-456a3eba2d7b`. Ảnh chụp lại SAU khi sửa phông — đúng Be Vietnam Pro.)
