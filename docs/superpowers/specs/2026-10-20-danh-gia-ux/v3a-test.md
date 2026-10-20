# v3a — TEST: workflow chấm · Excel · nhận xét lớp thường + ⋯ · màu điểm · căn bảng (rà vòng 3 · 20/10)

> Phạm vi: góp ý vòng 3 mục **I.1–I.5** + mở rộng toàn web. **Chỉ đánh giá + đề xuất**: không sửa repo, không lưu gì trên demo (chỉ mở hộp / menu rồi Esc).
> Web `http://localhost:5173` (ngày demo **14/09/2026 = W3 SEP**), mã `main` (OV-15b / h2 đã merge, **chưa deploy** — bản chính đang chạy là deploy 18/10).
> NEW = `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad` · ảnh `NEW\anh\v3a\` (90 tệp) · spec / script `NEW\chup\v3a-*.json|mjs` · số đo `NEW\do\v3a-cat.json`, `NEW\do\v3a-bang.json`.
> Nhãn: **[ĐÃ CHỐT]** · **[ĐỀ XUẤT]** · **[ĐÃ KIỂM]** (đo DOM / đọc mã / gọi API GET / DB chỉ đọc) · **[GIẢ THUYẾT]** (+ cách kiểm) · **[CẦN DỮ LIỆU]**. Mã cũ dẫn lại: TST-xx (a4), V2B-x, 11.1a…, 9.2-xx.

---

## Tóm tắt 10 dòng

1. **[ĐÃ KIỂM] GV nhầm tuần vì web gọi tên theo TUẦN THI ở chỗ này, theo TUẦN CHẤM ở chỗ khác.** Khối "Test chấm tuần này" chứa bài **thi tuần trước**; "Lịch Test tuần này" chứa bài thi tuần này mà **chấm được ngay** (hạn T4 tuần sau) nhưng thu gọn; Công việc ghi "Nhập điểm · W1 JUL" (W1 JUL là tuần thi, đã quá hạn 68 ngày); hộp chấm ghi "W2 SEP" không chữ "thi", không hạn.
2. **"Ba khung chấm"** có hai nghĩa đều đúng trên web: (A) ba khối của Lịch Test; (B) ba lối chấm — Lịch Test (theo tuần thi) · Công việc (theo việc) · Hồ sơ lớp (theo lượt MT). Cả hai dùng chung một lưới (`LuoiChamLop`) nhưng **gom khác nhau, đếm khác đơn vị** (việc ↔ bài ↔ ô), nên cùng một bài hiện ở 3–4 nơi với 3 cách gọi.
3. **[ĐÃ KIỂM] Speaking chấm chéo bị nói sai chủ:** GV S (GV 9) thấy ô S lớp FT ghi **"GV khác"**, dải "0/0 bài", "Quá hạn chấm **49** bài · 1 lớp" trong khi khối 1 ngay dưới ghi **0** · 2 lớp; việc thật nằm ở Công việc "Chấm Speaking · 24 bài" — Lịch Test không có.
4. **Đề xuất một hệ thống chấm Test** (không đổi luật): **Hàng chấm theo hạn** (giữ đúng ba nhóm T15–T17, đổi tên theo hạn, một dáng hàng "MT2 · thi W2 SEP · hạn T4 16/09"), **cùng một nguồn cho Công việc và Test**; **lưới gọn** chỉ cột + ô của tôi; **tự sang nhóm kế**; **một hộp chấm** cho mọi loại Test; QL có **Tình trạng chấm** (lớp × bài · đủ x/y · ai còn nợ theo kỹ năng). Cô Linh: ~11 bấm qua 3 khối, 7 lưới → **1–2 bấm**; QL tra "MT2 lớp X đủ chưa, ai nợ": 5–6 bấm + 1 đổi trang → **1 bấm**.
5. **[ĐÃ KIỂM] Nhập Excel chỉ có MỘT thành phần** (`DanExcel`) nhưng hiện ở **8 lối** (mọi lưới có ô sửa được); chưa ai dùng thật (tính năng 19/10, sau deploy 18/10; DB demo 0 lần). **Giữ duy nhất ở lưới theo lượt** (hồ sơ lớp + panel Nhập điểm lớp — cùng một thành phần), bỏ 6 lối theo tuần / theo việc / trang riêng, ẩn ở 375. Hết hiệu lực CV-02; 9.2-24 giữ nhưng thu phạm vi.
6. **[ĐÃ KIỂM] Nút ⋯ không bị "cắt" mà ĐÈ:** đặt `absolute right-0.5 top-0.5` trong ô 207 px, 28 × 28 px, che **18 × 24 px (41 %) ô "tổng"** ở mọi ô lớp thường, chỉ hiện khi rê chuột. Menu = Dời lịch thi (QL) · Huỷ điểm · Vắng · Lịch sử — đều có đường khác hoặc là việc QL. **Bỏ ⋯ khỏi ô**, đưa thao tác vào chân hộp chấm.
7. **Nhận xét lớp thường → vào hộp chấm** (tuỳ chọn, ô 1 dòng tự giãn): lớp thường dùng **cùng hộp với FT** (đã có nhận xét trong hộp). Bỏ nút "Nhận xét" riêng (20–32 nút / trang), bỏ hộp "Sửa … Lý do" riêng, bỏ "tổng [25] Điền cả cột" trên tiêu đề. 3 em có nhận xét: ~8 bấm, 4 hộp → **1–2 bấm, 1 hộp**.
8. **[ĐÃ KIỂM] Một môn trượt lớp thường có 6 dáng màu:** số đỏ trong ô nhập · số đỏ **không ký hiệu** (ô chỉ đọc) · "× 27/40" đỏ · khung nền đỏ · **chip nền vàng** (hồ sơ HV — mới, chưa có trong v1 B1) · dòng "Chưa đạt · 67,5%". Luật đề xuất cho "x / tổng": **"✗ 17/25"** — tô **số đúng** theo 3 token, mẫu số nhạt, **bỏ % khỏi ô** (giữ ở hộp + cột "% tổng").
9. **[ĐÃ KIỂM] Bảng Test chưa đo ở vòng 2:** lưới lớp thường ô tổng tiêu đề lệch **≈ 86 px** so ô tổng của hàng, hàng 57 px vì dòng % + chip "Đã hoàn tất"; khối 1 cột "Hạn" lệch **76,5 px**; Kế hoạch Test hàng **34–79 px**, đường cơ sở lệch 24 px. 11.1a đủ hướng nhưng **thiếu 3 kiểu**: `diem-ti-le` (x / tổng), tiêu đề có chú thích ("/25 ✎"), **nhóm cột 2 tầng** (Progress / Final).
10. **Rulebook lệch mã 4 chỗ** (hạn lớp thường CN ↔ T4; nhận xét MT "không bắt buộc" ↔ OV-12b bắt buộc; GV lớp thường dời lịch; PR-LT3 "chưa có trong code") — chỉ sửa chữ, hỏi một điểm. 14 câu hỏi cho chủ SP ở cuối, quan trọng trước.

---

## Phần 0. Phạm vi + cách làm

| Nhóm | Vai · cỡ | Ảnh (`NEW\anh\v3a\`) |
|---|---|---|
| Lịch Test (ba khối) | GV 7, 8, 9 (+ "Tất cả · FT"), 10, QL 2, QT 1 · 1440 tối; GV 7, 8, 9, 10, QL 2, QT 1 · 375 sáng | `b-*`, `c-*` |
| Lưới lớp thường MB FOU 14 (tái hiện ảnh 1) | QT · rê chuột / mở ⋯ / bấm ô có điểm / Nhận xét · 1440, 1280, 375 | `a1-qt-thuong28--hover|menu|sua|nhanxet`, `f-qt-thuong28-1280`, `a2-*` |
| Hộp chấm FT, hộp S chấm chéo | GV 10 (W2), GV 9 | `f-gv10-hopW2`, `f-gv9-cham-s-hop` |
| Công việc · việc Nhập điểm / Chấm Speaking | GV 10, 9, 7, QL 2 · 1440 + 375 | `d-*` |
| Khối 1 mở (QT), khối 3 mở (GV 7), khối 1 ở 375 (GV 10) | | `f-qt-lt-k1`, `f-gv7-lt-k3`, `c-gv10-375-k1--mo` |
| Hồ sơ lớp lớp thường / FT, Kế hoạch Test, hồ sơ Mock, hồ sơ HV (FT + lớp thường), Tổng quan Admin văn phòng | GV 7, QL 2, QT 1, Admin 22 | `e-*`, `f-ql2-hsl3-mt-*` |

**Đo:** `v3a-cat.mjs` (mới — nút bị tổ tiên cắt, chữ tràn bị cắt, nút / ô nhập đè nhau, riêng ô ⋯ vs ô tổng) + `v2b-do-bang.mjs` (vòng 2) trên 15 màn; `v3a-lt.mjs` gọi **GET** `/cham/lich-test` + `/my-work` cho 6 vai để đọc đúng ba khối và việc "Nhập điểm"; DB demo chỉ đọc (`audit_logs`). Không bấm Lưu.
**Chưa làm được:** panel "Xếp nhiều MT" (bước chọn lớp lỗi khi đo → dựa TST-14 của a4); lượng dùng Dán Excel thật (tính năng chưa lên bản chính).

---

## Phần 1. Bảng luật chấm Test (Rulebook §20 ưu tiên + mã)

Rb = `thiet-ke/PISA-Rulebook-2026-09-19.md` (số dòng); `sd/` = `shared/domain/`, `ss/` = `server/src/`.

### 1a. Theo loại Test

| Loại | Kỹ năng / ô | Ai chấm (là VIỆC của) | Ai nhập được (QUYỀN) | Mở ô từ | Hạn chấm | Quá hạn khi | Nhận xét | Vắng / dời / huỷ | Nguồn |
|---|---|---|---|---|---|---|---|---|---|
| **MT (Mock FT)** L, R | số câu (0–40) → band; hoặc band thẳng | GVBM được phân công kỹ năng | + QL/QT mọi ô mọi lúc (lý do tuỳ chọn) · Admin văn phòng (`score.override`) nhập hộ | thứ Hai tuần thi **của chính kỹ năng** (chưa tới: khoá, cả QL) | **hết T4 tuần kế** tuần thi | tuần thi đã hết **và** qua hạn (mốc = max(hạn, CN tuần thi)) | **bắt buộc ≥ 10 ký tự** khi ô có điểm; dưới kỳ vọng → **≥ 1 nhóm nguyên nhân** | "-" sửa tới CN, chốt T2: lần 1 máy dời tuần kế, lần 2 huỷ "vắng 2 lần" | Rb 237, 684, 717, 741–746; `ss/platform/week.ts:89-114`; `sd/nhanXet.ts:16-52`; `ss/permissions.ts:550-566` |
| MT W1, W2 | **hai ô riêng**, 4 tiêu chí → band tự tính | GVBM W1 / GVBM W2 | như trên | như trên | như trên | như trên | bắt buộc (mỗi task) | W chốt vắng khi **cả** W1 + W2 "-" | Rb 813, 682, 744 |
| MT S | 4 tiêu chí | **không GV mặc định** (T18) — việc "Chấm Speaking · n bài" của **mọi GV có phân công S ở một lớp FT cùng chi nhánh**, từ thứ Hai tuần thi, **không hạn / không quá hạn** cho ai | + ghi **"GV chấm"** (tài khoản hoặc tên ngoài) | thứ Hai tuần thi | ô vẫn có hạn T4 tuần kế | quá hạn chỉ **báo** GVBM S + GVCN, **không tính nợ** họ; người chấm chéo nhập muộn → tính trễ cho **người đó** | bắt buộc | như MT | Rb 609–614, 639, 814; `sd/chamDiem.ts:45-51`; `ss/worklist/mywork.ts:530-559` |
| MT cũ (xếp vào tuần ≥ 2 tuần trước) | như MT | **không nợ, không hạn** | GVCN + QL mọi ô, kể cả đã có điểm | ngay | — | — | **tuỳ chọn** | "-" = **Không dự thi**, chốt ngay, không đếm vắng | Rb 677, 687, 688; `sd/nhanXet.ts:37` |
| MT0 (lớp thường lên FT) | L R W1 W2 S band thẳng | GV bộ môn lớp thường đang học | + QL | tuần Cuối khoá | T4 tuần sau | như trên | tuỳ chọn | dời ≤ T2 tuần 2 FT, luôn trước MT1 | Rb 778; `sd/mt0.ts:26` |
| **Progress Test** (Giữa khoá) FOU / BE / ELE | **đúng / tổng** từng môn (FOU L R G+V P; BE/ELE L R W S) | GVBM đúng môn; GVCN chỉ môn mình dạy | + QL/QT mọi ô | tuần giữa khoá của lớp | **T4 tuần sau** (Rb 772 còn ghi "CN tuần thi" — **lệch**, xem V3A-10) | như trên | **tuỳ chọn** | "-" → môn dời tuần sau, **lặp** tới khi có điểm (GV ghi lại mỗi tuần — C08-b); QL "xác nhận huỷ" **chưa có** (C08-a) | Rb 684, 749–758, 772–773, 893–895 |
| Progress — kết quả | ngưỡng **70 %** trên tỷ lệ chưa làm tròn | — | — | — | — | — | — | môn < 70 % → Case "[Giữa khoá] môn" + PA Bổ trợ; **nhãn SOS theo số môn trượt** (1 / 2 / ≥ 3) | Rb 772–773, **876–877** (web lưới chưa theo — TST-09) |
| **Final Test** (Cuối khoá) | như Progress; **% tổng = Σ đúng / Σ tổng** khi đủ môn; Pre FOU **một ô Tổng hợp** | như Progress | như Progress | tuần cuối khoá | T4 tuần sau | như trên | tuỳ chọn | không sinh Case; dải < 50 · 50–59 · 60–69 · ≥ 70 chỉ là **gợi ý** hướng | Rb 774 |
| Checkpoint (lớp liên tục — PET) | đúng / tổng | GVBM | + QL | theo lịch | T4 tuần sau | như trên | tuỳ chọn | chip "Đạt" / "SOS · L+S" **chỉ để nhìn**, không Case | `cham/LuoiThuong.tsx:57`; OV-6b2 |
| Mini Test (sau bổ trợ miễn phí) | **%** + ngày — ghi ở **việc Case**, không ở lưới | người dạy bổ trợ | sửa chỉ QL, có lý do | buổi cuối | buổi cuối + 2 ngày | — | — | ≥ 70 % Case tự xong; < 70 % báo QL | Rb 722, 774; `sd/cuoiKhoa.ts:114-117` |

### 1b. Luật chung

| Luật | Nội dung | Nguồn |
|---|---|---|
| Một đợt nhiều lịch kỹ năng | L/R/W tuần này, S tuần sau vẫn cùng đợt; **mỗi kỹ năng một hạn**; bảng chấm theo tuần dùng lịch kỹ năng | Rb 199–205 |
| Chia khối ở Lịch Test (UI, chốt 05/10) | khối 1 = thi **trước tuần trước** và quá hạn (theo **hôm nay**, đổi tuần xem không đổi); khối 2 = thi **tuần trước** (ở lại hết CN kể cả quá hạn — chỉ thêm badge); khối 3 = thi tuần đang xem | Rb 636–637; `sd/chamDiem.ts:37-42` (`khoiCham`) |
| Sửa điểm đã có | GVBM trước khi đợt hoàn tất; sau đó chỉ QL; xoá trắng ô = huỷ điểm, lý do **tuỳ chọn** | Rb 687, 723, 816 |
| Nhập ô **trống** sau hoàn tất / lớp đã kết thúc | GVBM đúng môn vẫn được; nhận xét ghi được cả khi ô khoá điểm (lớp thường như FT) | Rb 696 |
| Xếp / dời lịch | FT: chỉ QL/QT; lớp thường: Rb 818 ghi "GVCN, GVBM đúng môn cũng dời được" — **web chỉ cho QL** (`sd/thaoTacMt.ts:49-70`, chú thích "luật 09/10") → **câu hỏi Q12** | Rb 818, 819 |
| Ai xem | GV: lớp mình dạy (+ GV S: lớp FT cùng chi nhánh, "Tất cả"); GVCN: lớp mình; QL: chi nhánh; QT: mọi chi nhánh; Admin văn phòng: Test + Mock của chi nhánh; **TVV / CX: không có khu Test**, xem điểm trong hồ sơ HV (`attempt.view`) | `ss/platform/nav.ts:22-23`; Rb 838 |
| Xuất Excel kết quả Test | QL/QT (phạm vi) + GVCN lớp mình; GVBM không | Rb 838 |

**Luật mơ hồ → câu hỏi:** (a) "nợ" của ô S Mock khi không ai chấm: hiện chỉ "báo", nên web đếm ô đó là **"GV khác"** ở người có phân công S — sai chữ, không sai luật (V3A-2); (b) lớp thường GV có được dời lịch không (Q12); (c) lớp thường "theo từng MT" khi giữ Excel = theo từng **bài** (Progress / Final)? (Q6).

---

## Phần 2. Vấn đề (mỗi mục đủ 9 ý)

### V3A-1. Workflow chấm Test: GV không chắc "chấm tuần nào, ở đâu" — P1 · GV, QL · [ĐÃ KIỂM]

**1. Vấn đề hiện tại.**
- **Ba khung là gì (xác minh):**

  | Cách hiểu | Khung | Gom theo | Đơn vị đếm | Mở mặc định |
  |---|---|---|---|---|
  | **A — ba khối Lịch Test** | 1 "Test quá hạn chấm" · 2 "Test chấm tuần này" · 3 "Lịch Test tuần này" | tuần **thi** so với hôm nay + cờ quá hạn | "bài" (= ô một kỹ năng) | 1 thu · 2 mở · 3 thu (`LichTestTab.tsx:121`) |
  | **B — ba lối chấm** | Lịch Test (`LuoiNhung`) · Công việc (`PanelNhapDiemTuan` / `PanelNhapDiem`) · Hồ sơ lớp (`DiemTheoLop`, V2B-3) (+ trang thứ tư `/nhap-diem`, `/bang-diem-thuong`) | tuần thi · việc (lớp × tuần thi × người) · **lượt** (MT1/MT2/MT3, Progress/Final) | bài · **việc** · em "đủ điểm" | — |

  Cả hai đều là "ba khung" trên web; mockup "ba khối 06/10" là nghĩa A. Câu chủ SP "chấm **ở đâu**" chạm cả nghĩa B. Đề xuất ở Phần 3 xử lý cả hai.
- **Tuần làm bài vs tuần ghi kết quả bị đặt tên lẫn:**
  - Khối 2 tên "**Test chấm tuần này**" nhưng chứa bài **thi tuần trước** (phụ: "bài thi W2 SEP · hạn 16/09") — `LichTestTab.tsx:260, 380`.
  - Khối 3 tên "**Lịch Test tuần này**" chứa bài thi tuần này — **đã chấm được** (tuần thi đã tới, hạn T4 tuần sau) — nhưng **thu gọn mặc định** và tên là "lịch", không phải "chấm" (`:121, 381`). GV 7: khối 3 có **24 bài của chính GV 7** ở 5 lớp (API), không thấy nếu không mở (`b-gv7-p1`).
  - Công việc: tiêu đề việc "Nhập điểm · **W2 SEP** · 3 bài", dòng phụ "MT1 **W1 JUL**", tiêu đề panel "Nhập điểm · W1 JUL" — mã tuần là **tuần thi** nhưng không có chữ "thi" (`ss/worklist/mywork.ts:500, 503`; `congViec/PanelViec.tsx:211`) → đọc như "tuần phải nhập". Việc W1 JUL quá hạn **68 ngày** (`d-cv-gv10--ds`).
  - Hộp chấm FT: phụ đề "Lương Bảo Anh · MB FT 101 · **W2 SEP**" — không "thi", **không hạn** (`f-gv10-hopW2`); hộp Nhận xét lớp thường tương tự (`a1-…--nhanxet`).
- **Thông tin thiếu tại chỗ chấm:** hạn chỉ có ở hàng lớp, không ở hộp / ô; lưới FT mở **đủ 10 cột** cho GV chỉ có một cột (W2) → dò từ tiêu đề "W2" sang ô lệch 45 px (11.1a), cạnh W1 cùng dáng (`b-gv10-p1`).
- **Số đếm ba đơn vị:** GV 10 — Công việc "6 việc" · Lịch Test "Còn phải chấm 9 bài · Quá hạn 11 bài" · hồ sơ lớp "n bài chờ chấm" · hồ sơ lớp lưới "MT3 3/32 đủ điểm" (em). Cùng khối lượng, bốn con số (API `v3a-lt.mjs`).

**2. Nguyên nhân (bằng chứng).**
- Khối đặt theo **tuần thi tương đối** (`khoiCham`, `sd/chamDiem.ts:37-42`) rồi đặt tên theo **tuần xem** ("tuần này") — hai trục trộn trong tên. PR-LT3 (Rb 636) chốt cách chia, không chốt chữ.
- Hai hàm gom độc lập: Lịch Test (`ss/cham/canCham.ts` `lichTest`, `hangLopTuan`) vs Công việc (`mywork.ts:403-516` `gomBaiChuaCham`), mỗi bên tự viết chữ ("Đợt" + tuần; "contextLabel" + tuần).
- Một hàm nhãn tuần (`tuanLich`) trả "W2 SEP" trơn, không có loại mốc (thi / hạn / nhập).
- Lưới chấm là một component (`LuoiChamLop`) nhưng lối Lịch Test không truyền `chiCot` (cột của tôi) — chỉ Công việc có (`PanelViec.tsx:183, 240`).

**3. Ảnh hưởng.** Cô Linh (W2, 3 lớp) phải hiểu ba khối + 6 việc + 3 lưới đủ cột để biết hôm nay chấm gì: **~11 bấm, 0 đổi trang, 7 lưới** (Lịch Test) hoặc **6–7 bấm, 6 panel nối tiếp** (Công việc). Rủi ro nhầm: bỏ sót khối 3 (thu gọn) → bài thành quá hạn tuần sau; tưởng "Test chấm tuần này" là bài vừa thi; nhập nhầm W1 ↔ W2. Chị Vy (QL): ba số dải + ba khối, không ra "ai còn nợ" (V3A-3). Người mới: không có câu nào nói "bài thi tuần này chấm trước T4 tuần sau".

**4. Liên quan trang / component khác.** `LuoiChamLop` ở 7 lối (V3A-5); `HopNhapDiem` (FT) / `ODiemThuong` (lớp thường) — hai dáng hộp (V3A-6); thông báo tự động "bài quá hạn chấm" (OV-15d) dùng chữ riêng; hồ sơ lớp chip "n bài chờ chấm" (V2B-3 đổi thành "⚠ n ô quá hạn chấm"); Tổng quan TVV / Admin "Ô điểm chưa nhập" (`e-tq-admin22`).

**5. Các phương án.**
- **A — Giữ ba khối + vá:** đổi tên khối, dải bỏ (9.2-20), lưới gọn (9.2-21), hạn trong hộp.
- **B — Hàng chấm theo hạn, một nguồn cho Công việc + Test** (Phần 3): giữ đúng luật chia ba nhóm, đổi tên theo **hạn**, một dáng hàng, lưới gọn chỉ cột + ô của tôi, tự sang nhóm kế, hộp chấm một mẫu.
- **C — Chỉ chấm ở Công việc**, Test chỉ còn quản lý / lịch.

**6. Ưu / nhược (đếm ở bảng Phần 3.4).**

| | A | **B** | C |
|---|---|---|---|
| Hết nhầm tuần | một phần (tên mới, nhưng Công việc vẫn chữ khác) | **có** — một hàm nhãn "thi … · hạn …" cho mọi chỗ | có ở Công việc; Test không còn để nhầm |
| Số khớp nhau | không (hai hàm gom) | **có** (một hàm) | có |
| Cô Linh chấm hết bài đến hạn | 6–9 bấm | **1–2 bấm** | 2–3 bấm |
| GV mở Test theo thói quen | như cũ | như cũ | **mất chỗ chấm** — phải học lại |
| Chi phí | thấp | vừa (gộp hai hàm gom; component có sẵn) | vừa + bỏ thói quen |
| Làm hệ thống phức tạp hơn | không | **giảm** (bớt 1 cách gom, 1 dải số, 2 dáng hộp) | giảm nhưng một vai mất chỗ |

**7. Đề xuất: B** — vì sửa đúng gốc (hai trục tuần trong tên + hai hàm gom), giữ luật chia khối đã chốt, giữ thói quen "Test → chấm" và "Công việc → việc", và là phương án duy nhất làm **cùng một con số ở mọi nơi** (luật CLAUDE.md "cùng số liệu cùng nguồn, cùng hàm"). Chi tiết Phần 3.

**8. Ảnh hưởng workflow / nghiệp vụ.** **Không đổi luật** chấm, hạn, quá hạn, quyền, ai chấm. Đổi **trình bày** đã chốt ở PR-LT3 (tên khối, dải số 4 ô — Rb 640 (a) vẫn "chờ chủ SP") và mockup ba khối 06/10 → cần chủ SP đồng ý (Q2).

**9. Cần chủ SP xác nhận.** Q1 (nghĩa "ba khung"), Q2 (B thay ba khối), Q3 (một nguồn Công việc ↔ Test), Q4 (chấm theo tuần thi, xem theo lượt). Khuyến nghị: **có cả bốn**.

---

### V3A-2. Speaking chấm chéo: Lịch Test nói "GV khác", số lệch 0 ↔ 49 — P1 · GV S, QL · [ĐÃ KIỂM]

**1. Vấn đề hiện tại.** GV 9 (S ở MB + BC): Lịch Test **mặc định "Lớp thường"** (TST-19) — bài S Mock không có. Chọn "Fast Track" + "Tất cả": dải "Tuần này đã chấm **0/0** bài · Còn phải chấm **0** bài · 54 bài của GV khác", ô "Quá hạn chấm **49** bài · **1 lớp**", **khối 1 ngay dưới: 0 · 2 lớp**; hàng BC FT 205 "**L, R, W, S: GV khác**", MB FT 101 "**W, S: GV khác**" — S là môn của chính GV 9 (`b-gv9-tatca-ft-p1`). Công việc lại có "Chấm Speaking · **24 bài** · 4 lớp" (không hạn) (`d-cv-gv9`). Trong hộp chấm S của việc đó: "Người chấm: **Chưa chọn** · Đổi" (`f-gv9-cham-s-hop`); ở lưới Lịch Test: "GV chấm S: {người đang xem}" — QL Vy thành người chấm (`b-ql2-p1`, TST-12). Danh sách "24 bài chờ chấm" lẫn các bài đã có điểm ("Nhập bởi Đỗ Vũ Tuấn Phong · 5.5").

**2. Nguyên nhân.** T18 (Rb 639): S Mock **không GV mặc định** → máy chủ không xếp ô S vào `phan.toi` của ai, nên `OPhan` gắn nhãn "GV khác" cho mọi phần không phải "của bạn" (`test/lichTest/HangLop.tsx:28-31`). Ô "Quá hạn chấm" gọi `/cham/lich-test/qua-han?phamVi=tat-ca` — ở phạm vi "Tất cả" đếm **mọi** ô vào `n` (49), còn khối 1 đếm phần của người xem (0) → hai luật đếm trên cùng màn ([ĐÃ KIỂM] API: `{n:49, khac:0}` vs `tongQuanKhung.ft.no.bai = 0`). Việc "Chấm Speaking" dựng riêng ở `mywork.ts:530-559` (OV-14c), Lịch Test không đọc nó.

**3. Ảnh hưởng.** GV S không biết bài S là việc của mình hay không; nhìn Lịch Test tưởng "không có gì" (0/0) hoặc "49 quá hạn" — hai kết luận trái nhau. GV S người nước ngoài (sổ tay) càng khó. QL nhập hộ dễ ghi chính mình là người chấm → **tính trễ cho QL** (T18: người nhập muộn bị tính trễ).

**4. Liên quan.** Hồ sơ Mock "GV chấm: chưa chọn" (`e-mock171-p1`); Phân tích GV (cột Chấm điểm của người chấm chéo); thông báo "báo GVBM S + GVCN" khi S quá hạn; panel `PanelChamSpeaking.tsx:99-100` không truyền `gvMacDinh`.

**5. Phương án.** (a) Chỉ đổi chữ "GV khác" → "chấm chéo" + sửa luật đếm ô quá hạn theo phạm vi. (b) Như (a) + trong **Hàng chấm** (Phần 3) GV có phân công S thấy một nhóm riêng "**Chấm Speaking chéo** · 24 bài · W2 SEP · không tính nợ" (cùng tập với việc ở Công việc), khung mặc định "Tất cả" khi có bài S chéo; người chấm mặc định = chính GV có kỹ năng S (9.2-25).

**6. Ưu / nhược.** (a) rẻ, nhưng GV S vẫn phải đổi 2 công tắc mới thấy bài, và vẫn hai nơi khác nhau. (b) thêm một nhóm trong danh sách có sẵn (không thêm màn); Lịch Test, Công việc, Hồ sơ Mock cùng số **24**; chấm: 3 bấm (mở nhóm, ô, Lưu · em tiếp) thay ~5 (đổi khung, Tất cả, mở lớp, tìm cột S, Đổi người chấm).

**7. Đề xuất: (b).** Một tập bài, một tên "chấm chéo", một số; không thêm khung.

**8. Ảnh hưởng nghiệp vụ.** **Không đổi luật T18** (vẫn không tính nợ cho GVBM S / GVCN; người nhập muộn bị tính trễ). Chỉ đổi chữ, luật đếm hiển thị và mặc định người chấm (đã có câu 9.2-25).

**9. Xác nhận.** Q5: nhóm "Chấm Speaking chéo" trong Hàng chấm + chữ "chấm chéo" thay "GV khác" + hiện hạn (chỉ để nhìn — 9.2-12) — khuyến nghị **có**.

---

### V3A-3. Xem lại / quản lý kết quả Test (I.4.4) — P1 · QL, QT, Admin văn phòng · [ĐÃ KIỂM]

**1. Vấn đề.**
- **QL hỏi "MB FT 101 MT2 đã chấm đủ chưa, ai còn nợ":** MT2 của lớp nằm ở **khối 1 hai dòng** ("MT2 · W2 AUG · 10 bài", "MT2 · W1 SEP · 5 bài"), **khối 2 một dòng gộp "MT1, MT2, MT3"**, có thể cả khối 3. Cột "GV chấm" chỉ là **danh sách tên** ("Cao Khánh Linh, Lê Minh Khoa, Trần Ngọc Hà, GV chấm chéo") — không nói ai nợ kỹ năng nào, bao nhiêu (`f-qt-lt-k1`, `KhoiNo.tsx:45-58, 120-121`). Mọi dòng có nút chính "Nhập điểm" kể cả với QT (TST-17).
- Lối khác: Học viên & Lớp → hồ sơ lớp → lưới "Điểm Mock Test" → tab MT2 "24/33 đủ điểm" → dò ô trống, nhớ cột nào GV nào (đầu hồ sơ lớp có "L·R Trần Ngọc Hà · …") — **5–6 bấm + 1 đổi trang**, lưới dưới mọi tab (V2B-3).
- **Admin văn phòng tra điểm MT của một em:** ô tìm → hồ sơ → cuộn tới "Mock Test": **2 bấm + cuộn** (tốt), nhưng số L R W S là **link xanh, không màu kết quả** (MT1 R 5.0 < kỳ vọng 5.5 trông như số đạt), chỉ chip cuối hàng "✓ Đã đủ điểm · Đạt kỳ vọng" (`e-hv20-admin22-p1/p2`).
- **Lớp thường một em** (hồ sơ HV): cùng môn trượt R 27/40 hiện **3 dáng** trên một màn (khung nền đỏ · chip nền **vàng** · chữ "3/4 môn đạt" trắng + chip "SOS 1 · R"), dòng Case ghi "Chưa đạt · không mở Case" cạnh chip SOS 1 (`e-hv8-fou-qt-p1`).

**2. Nguyên nhân.** Lịch Test được dựng cho **người chấm** (theo tuần), QL dùng lại cùng màn; không có góc "theo lớp × bài" cho người quản lý. Hồ sơ HV dùng `Outcome` tone `warn` cho môn trượt lớp thường (`students/StudentDetailPage.tsx:600-608`), bảng Mock dùng link màu nhấn (v1 B1 #10).

**3. Ảnh hưởng.** Chị Vy giao ban 10 phút không trả lời được "lớp nào, bài nào, ai nợ" mà không mở 3–5 lưới; số "58 bài · 4 lớp" không tách theo người. Admin văn phòng đọc được điểm nhưng không thấy kỹ năng nào dưới kỳ vọng.

**4. Liên quan.** Phân tích › Test + SOS, Phân tích GV (Chấm điểm đúng hạn), Báo cáo (A5), Kế hoạch Test (chip trạng thái từng em — TST-06), Tổng quan QL (đã chốt bỏ khối Trễ chấm — 10.0 II.4).

**5. Phương án.** (a) Thêm cột "Còn nợ theo kỹ năng" vào khối 1 hiện có. (b) **"Tình trạng chấm"** cho QL/QT ở Test: một bảng lớp × bài (MT2 / Progress / Final) trong Khoảng tuần (mặc định 4 tuần thi gần nhất — 11.1b): **Lớp · Bài · Tuần thi · Đủ điểm x/y em · Còn n ô · Ai còn nợ ("Hà L,R 6 · Linh W2 3 · chấm chéo S 6") · Hạn / ⚠ quá hạn n ngày**, quá hạn lên đầu; bấm hàng → lưới lượt mở **ngay dưới hàng** (bậc 2, cùng `DiemTheoLop`), QL nhập hộ được (9.2-1). (c) Dùng Phân tích GV.

**6. Ưu / nhược.** (a) vẫn chia theo tuần thi → MT2 vẫn 2–3 dòng. (b) trả lời câu hỏi trong **1 bấm, 0 đổi trang**; thay dải 3 ô + khối 1 kiểu cũ cho QL (không thêm khối mới — thay thế). (c) Phân tích là báo cáo, không làm việc tại chỗ.

**7. Đề xuất: (b)** + hồ sơ HV / bảng Mock dùng `ODiem` (V3A-8).

**8. Nghiệp vụ.** Không đổi luật; "ai còn nợ" = cùng `phanCongDangHieuLuc` + T18 (ô S Mock ghi "chấm chéo").

**9. Xác nhận.** Q11 — khuyến nghị **có**.

---

### V3A-5. Nhập điểm bằng Excel (I.5) — [ĐÃ CHỐT: giữ duy nhất "theo lớp, theo từng MT"] · [ĐÃ KIỂM]

**1. Vấn đề — kiểm kê mọi chỗ DÁN / TẢI để nhập ĐIỂM:**

| # | Chỗ (lối vào) | Vai | Tệp:dòng | Nhập gì · gom theo | Dùng thật | Giữ / Bỏ |
|---|---|---|---|---|---|---|
| 1 | Lịch Test › hàng lớp khối 2 / 3 (lưới mở) | GV, QL, QT | `LuoiNhung.tsx:35` → `LuoiChamLop.tsx:179-190` | điểm + nhận xét · FT **theo tuần thi** (`luot = null`, máy chủ chỉ ràng lớp), lớp thường theo bài | **0** — tính năng 19/10, bản chính deploy 18/10; DB demo `audit_logs` 0 dòng `score.dan_excel` | **BỎ** (theo tuần, không theo MT) |
| 2 | Lịch Test › dòng khối 1 mở | GV, QL | `KhoiNo.tsx:186` | như #1, chỉ em còn nợ | 0 | **BỎ** |
| 3 | Công việc › panel "Nhập điểm · W2 SEP" (nhiều lớp) | GV | `PanelViec.tsx:239` | như #1 | 0 | **BỎ** |
| 4 | Công việc › panel việc một lớp | GV | `PanelViec.tsx:183` | một lượt nhưng **chỉ cột + em của việc** | 0 | **BỎ** (theo việc, không cả lớp) |
| 5 | Trang `/nhap-diem/:id` | GV, QL | `ChamDiemPage.tsx:145` | theo tuần | 0 | **BỎ** (trang bỏ — 9.2-27) |
| 6 | Trang `/bang-diem-thuong/:id` | GV, QL | `ChamDiemPage.tsx:145` | lớp thường theo bài | 0 | **BỎ** (trang bỏ, chuyển hướng) |
| 7 | **Hồ sơ lớp › "Điểm Test của lớp"** (tab lượt MT1/MT2/MT3 · Progress/Final) | GV, GVCN, QL | `classes/ClassOverviewPage.tsx:203` → `DiemTheoLop.tsx:242` | **theo lớp × lượt** (`luot = mt:2`, máy chủ ràng lớp + lượt) | 0 | **GIỮ** |
| 8 | **Panel "Nhập điểm lớp"** (⋯ hàng lớp ở Học viên & Lớp, cột Theo dõi, "Cả lớp ↗" ở Công việc, link cũ `/test/diem-lop`) | GV, QL | `PanelNhapDiemLop.tsx:26` → `DiemTheoLop` | như #7 (cùng component) | 0 | **GIỮ** (V2B-3: chỉ cho lối **ngoài** hồ sơ lớp) |
| 9 | Màn < 768 px (mọi lối trên) | GV | `LuoiChamLop.tsx:205` (khối dán toàn màn) | như lối chứa nó | 0 | **BỎ ở 375** — chép vùng Excel trên điện thoại không thực tế |
| — | Thêm học viên (`IntakePanel.tsx:210`) | QL, GVCN | — | danh sách HV + **điểm đầu vào** OVR/L/R/W/S + "Đã thi tới MT" | — | **Ngoài phạm vi** (không phải điểm Test) — giữ; hỏi Q6 |
| — | Tutor › Tải danh sách (`tutor/TaiDanhSach.tsx:16`) · Bằng chứng (`ui/BangChung.tsx`, `ui/TepCho.tsx`) | — | — | danh sách tutor · ảnh / tệp | — | Ngoài phạm vi |

Không có chỗ nào **tải tệp .xlsx** để nhập điểm; chỉ dán (TSV). Một thành phần (`cham/DanExcel.tsx`), một API (`POST /attempts/scores/lo`, `/regular/scores/lo` — `ss/cham/luuLo.ts:60-117`). XUẤT Excel (Lịch Test "Xuất Excel", Kế hoạch Test "Xuất điểm Test" / "Xuất Excel") là việc khác (TST-04), không đụng.

**2. Nguyên nhân.** OV-15b đặt nút trong `LuoiChamLop` với điều kiện "người xem sửa được ≥ 1 ô" (`LuoiChamLop.tsx:105-112`) → mọi lối dùng lưới đều có nút; mockup 2 khung 1d ghi "**Mọi lưới nhập (cùng component)**". Dán theo tuần (#1–3, 5) không ràng lượt (`luot = null`).

**3. Ảnh hưởng.** Một trang Lịch Test QL có **một nút "Dán từ Excel" + "?" cho mỗi lưới đang mở** (`b-ql2-p1`: 2 trong khung nhìn đầu); lưới theo tuần trộn MT1 + MT3 cùng tuần → mẫu Excel của GV (thường theo một MT) không khớp hàng; thanh nút chen giữa viền và tiêu đề bảng (11.1a R5).

**4. Liên quan.** Hướng dẫn GV "Dán từ Excel" (`shared/huongDan/gv.ts:87`) + EN (`shared/i18n/en/ov15b.ts:16-74`); phép kiểm `prOv15b/h2/i1/i2.tests.ts` (API giữ); **CV-02** ("Dán Excel trong panel bị cắt") → **hết hiệu lực** (panel việc không còn dán); **9.2-24** (W/S nhận 4 cột tiêu chí, ô lỗi chỉ chặn ô đó) → **giữ, chỉ áp cho lưới theo lượt**; mockup 2 khung 1d sửa chữ "Mọi lưới" → "Lưới theo lượt".

**5. Phương án (UX của chức năng giữ lại).** (a) Giữ một chỗ: thanh công cụ của lưới theo lượt (hồ sơ lớp + panel Nhập điểm lớp — cùng component). (b) Như (a) + mọi lưới theo tuần / việc có link "Dán từ Excel ở lưới cả lượt ›". (c) Một trang "Nhập điểm theo lớp" riêng.

**6. Ưu / nhược.** (b) thêm link ở 5 lối — trái tinh thần "bỏ"; GV đã có "Cả lớp" ở panel việc dẫn tới lưới lượt. (c) thêm trang. (a) một chỗ, một nút, đúng lời chủ SP.

**7. Đề xuất: (a)**, kèm 6 chỉnh cho chính khối dán (đều trên thành phần có sẵn):
1. Nút ở thanh công cụ **ngoài** khung bảng, bên phải, sau "Chỉ ô còn trống" (11.1a 4e); chỉ khi lượt đang chọn có ô **tôi** nhập được; ẩn < 768 px.
2. Tiêu đề khối: "Dán từ Excel · **MT2 · MB FT 101** · 33 em" (nay: "Dán từ Excel · MT2"); dòng phụ nói **cột đã nhận theo vai**: GVBM chỉ cột kỹ năng của mình ("Dán cột W2 + Nhận xét W2"), QL mọi cột.
3. "Sao chép mẫu" sinh **đúng cột của người xem** + cột Nhận xét (MT: bắt buộc → mẫu ghi "Nhận xét * ≥ 10 ký tự") — nay sinh mọi cột đang mở (`DanExcel.tsx:484-505`).
4. Bảng xem trước giữ nguyên (khớp tên bỏ dấu, trùng tên → chọn em, ghi đè trước → sau, lỗi từng ô, Hoàn tác) — đây là phần tốt nhất của chức năng.
5. 9.2-24: nhận thêm 4 cột tiêu chí liền nhau cho W1/W2/S; ô lỗi chỉ chặn ô đó.
6. Máy chủ: `luot` **bắt buộc** ở `/scores/lo` (đóng đường dán theo tuần, chặn dán nhầm lượt) — một kiểm ở cửa API.

**8. Nghiệp vụ.** Không đổi luật lưu (mỗi ô vẫn qua `saveScore` / `saveRegularScore`, cùng quyền, nhận xét MT bắt buộc). Bỏ 6 lối → còn 2 lối cùng một thành phần.

**9. Xác nhận.** Q6: (i) lớp thường "theo từng MT" hiểu là **theo từng bài** (Progress / Final) — khuyến nghị **giữ cho lớp thường theo bài**; (ii) ẩn ở 375 — **có**; (iii) "Thêm học viên" (điểm đầu vào) không thuộc I.5 — **giữ**.

---

### V3A-6. Nhận xét lớp thường đặt rời ô, nút ⋯ đè ô "tổng" (I.2) — [ĐÃ CHỐT: nhận xét tuỳ chọn, trong hộp chấm] · [ĐÃ KIỂM] · P1 · GV lớp thường, QL

**1. Vấn đề hiện tại (ảnh 1 tái hiện: `a1-qt-thuong28--hover|menu|sua|nhanxet`).**
- Mỗi ô lớp thường: **nút "Nhận xét"** (66 px) đứng **trước** hai ô "đúng / tổng" (44 px mỗi ô) → mở **hộp riêng** "Nhận xét · Grammar + Vocabulary" chỉ có một ô chữ + Lưu (`a1-…--nhanxet`). Trang QT MB FOU 14: 20 nút "Nhận xét" + 4 "Điền cả cột" (5 em × 4 môn).
- Ô **đã có điểm** vẫn là hai ô nhập (chỉ đọc); bấm → **hộp thứ hai** "Sửa Grammar + Vocabulary · Lưu Bảo Ngân / Đã lưu: 17/25 (68%) / Giá trị mới / Lý do sửa (tuỳ chọn) / Đóng · Lưu" — hộp này **không có nhận xét** (`a1-…--sua`).
- **Nút ⋯ "bị cắt":** đo DOM (`v3a-cat.json` › `t-thuong28-qt`): ô 207 × 57 px; ⋯ 28 × 28 px tại (177, 2); ô "tổng" 44 × 30 tại (151, 6) → **giao 18 × 24 px = 432 px² = 41 % bề ngang ô tổng**, ở **mọi** ô có ⋯ (đo 40 cặp trên trang). Không có tổ tiên `overflow` nào cắt nó (0 phần tử bị cắt ngoài vùng cuộn của `main`). ⋯ `opacity: 0` tới khi rê chuột (`@media(hover:hover)`) → lúc rê vào ô, ⋯ **hiện đè lên số "25"**, trông như mẩu khuyết.
- **⋯ làm gì** (`sd/thaoTacMt.ts:49-70`, `LuoiThuong.tsx:429-445`): ô có điểm → **Dời lịch thi** (QL) · **Huỷ điểm** · **Lịch sử**; ô đang tới tuần chưa điểm → **Vắng** (GVCN/QL) · **Dời hạn chấm** (QL) · Dời lịch thi (QL) · Lịch sử; ô vắng → Xếp lại bài vắng (GVCN/QL). GVBM thường chỉ thấy "Huỷ điểm · Lịch sử" hoặc chỉ "Lịch sử". QT thấy (ảnh): "Dời lịch thi · Huỷ điểm · Lịch sử" (`a1-…--menu`).

**2. Nguyên nhân.**
- OV-4b thêm nút "Nhận xét" vào ô mà **cột giữ 190 px** (`LuoiThuong.tsx:202` "+nút Nhận xét") → nội dung 66 + 4 + 44 + 8 + 44 ≈ 166 px trong 183 px khả dụng → **không còn chỗ** cho ⋯ → ⋯ thành lớp phủ `absolute right-0.5 top-0.5` (`:438`).
- Ô lớp thường là **ô nhập thẳng** (HD2 11/10 "giữ gõ thẳng đúng/tổng"), khác FT (ô là nút → **hộp chấm** có sẵn nhận xét — `fasttrack/HopNhapDiem.tsx:418`). Hai mô hình cho cùng việc → nhận xét lớp thường phải đi đường riêng (`NutNhanXet`, `HopNhapDiem.tsx:598-657`), sửa điểm đi đường riêng thứ ba (`SuaDiemCoLyDo`, `fasttrack/ScoreEntry.tsx:759-821`).
- FT **không có ⋯ trong ô** (thao tác ở hộp lịch Kế hoạch Test / hồ sơ Mock) → lớp thường lệch khuôn chung.

**3. Ảnh hưởng.** GV 7 chấm Progress BE 03 cho 3 em có nhận xét: bấm ô (1) → gõ đúng, Tab, Enter ×3 → mỗi nhận xét: "Nhận xét" (1) + gõ + Lưu (1) → **~8 bấm, 4 hộp**; sửa một điểm + ghi lý do + nhận xét = **2 hộp khác nhau**. Ô tổng bị che 41 % lúc rê chuột → đọc sai mẫu số (25 ↔ 2_). Nhận xét chỉ đọc được qua `title` của nút (chuột) — QL / GVCN xem lại trên điện thoại / bàn phím không thấy. Hàng 57 px vì dòng "Đạt · 80%".

**4. Liên quan.** Cùng lưới ở Lịch Test, `/bang-diem-thuong`, hồ sơ lớp, panel Công việc, panel Nhập điểm lớp; 375 `MotKyNang` (nút "Nhận xét" + "Vắng" ngoài ô); 9.2-38 (⋯ luôn hiện mờ) → **thay**; TST-08 ("Nhận xét" + "Điền cả cột" lặp) → **giải quyết luôn**; mockup 2 khung 1a ("[ ] / 25 **Nhận xét**" sau ô) → **sửa mockup** theo quyết định vòng 3.

**Rà luật nhận xét các loại Test khác (để không làm sai):**

| Loại | Nhận xét | Đang ở | Sau đề xuất |
|---|---|---|---|
| MT (L R W1 W2 S) | **bắt buộc ≥ 10 ký tự** khi có điểm + nhóm nguyên nhân khi dưới kỳ vọng (OV-12b, `sd/nhanXet.ts:16-52`) | trong hộp chấm FT (+ khối Nhận xét ở hồ sơ Mock — TST-20) | giữ trong hộp; ô hiện "thiếu nhận xét" (chữ phụ ưu tiên 1 — V2B-2) |
| MT cũ, MT0 | tuỳ chọn (`batBuocNhanXetMt` = false) | trong hộp chấm FT | giữ |
| S chấm chéo | bắt buộc (MT) + thấy "Nhận xét GV phụ trách" | hộp | giữ |
| Lớp thường Progress / Final / Pre FOU / Checkpoint | **tuỳ chọn** (OV-4b; Rb 696) | nút + hộp riêng | **vào hộp chấm** |
| Mini Test | không có (ghi % ở việc Case) | Case | không đổi |

**5. Phương án.**
- **A — Hộp chấm một mẫu cho lớp thường** (cùng `HopNhapDiem` của FT, nhánh "đúng / tổng"): ô lưới thành `ODiem` chỉ đọc ("✗ 17/25"), bấm hoặc gõ số trên ô → hộp neo tại ô: đầu "**G+V · Lưu Bảo Ngân**" + phụ "**Progress · thi W2 SEP · hạn T4 16/09**"; dòng "Đúng [17] / [25] · 68 % · chưa đạt (cần 70 %)"; "**Nhận xét (tuỳ chọn)**" ô 1 dòng tự giãn tới 4 dòng; **chỉ khi sửa điểm đã có**: "＋ Lý do sửa" gập; chân: **Vắng** · **Thêm ▾** (Lịch sử · Huỷ điểm · Dời hạn [QL] · Dời lịch [QL]) · Lưu · **Lưu · em tiếp ›** (Enter). Bỏ nút "Nhận xét", bỏ ⋯ trong ô, bỏ hộp "Sửa … Lý do" riêng, bỏ "tổng [25] Điền cả cột" (tổng lấy sẵn tổng phổ biến của cột — đã có `tongLaySan`; đổi đề cả cột bằng "/25 ✎" ở tiêu đề).
- **B — Giữ ô nhập thẳng, nhận xét mở trong hàng:** focus ô → một dải "Nhận xét G+V · [ ]" mở ngay dưới hàng; ⋯ chuyển ra ngoài ô (cột cuối hàng).
- **C — Chỉ sửa vị trí:** nới cột 190 → 230 px để ⋯ không đè; giữ nút Nhận xét.

**6. Ưu / nhược (GV 7, BE 03, 3 em, có nhận xét; Cô Linh 20 em chỉ điểm).**

| | A hộp chấm | B dải trong hàng | C nới cột |
|---|---|---|---|
| 3 em có nhận xét | **1 bấm** + gõ (Tab sang nhận xét) + Enter ×3 · **1 hộp** | 1 + (Tab vào dải) ×3 · 0 hộp, hàng nhảy cao | ~8 bấm · 4 hộp (như nay) |
| 20 em chỉ điểm | 1 bấm + (gõ + Enter) ×20 — **bằng nay** (Enter = em tiếp) | bằng nay | bằng nay |
| Sửa điểm + lý do + nhận xét | **1 hộp** | 2 chỗ | 2 hộp |
| Một khuôn với FT | **có** | không | không |
| Cao hàng | 44 px (bỏ dòng %, bỏ nút) | 44 px (+ dải khi mở) | 57 px |
| Bảng rộng | cột môn ~96 px (×4) → bảng hẹp ~380 px | cột 190 px | cột 230 px — rộng hơn nữa |
| Rủi ro | gõ thẳng trên lưới thành gõ trong hộp (giữ "gõ số = mở hộp" như ô có điểm đang làm — `ScoreEntry.tsx:782`) | dải mở/đóng theo focus dễ giật | không giải quyết lời chủ SP |

**7. Đề xuất: A** — đúng lời chủ SP ("mở chỗ chấm là nhập được điểm + nhận xét"), một hộp cho mọi loại Test (CLAUDE.md "cùng loại thao tác cùng vị trí, phản hồi"), bỏ được 3 thứ (nút Nhận xét, ⋯ trong ô, hộp Sửa) thay vì thêm. **375:** giữ `MotKyNang` ô to gõ thẳng (đang tốt), thêm "＋ Nhận xét" mở ô nhận xét **ngay dưới hàng** (không hộp nổi), "Lịch sử / Huỷ điểm" vào nút "Thêm" của hàng.

**8. Nghiệp vụ.** Không đổi luật: nhận xét lớp thường vẫn tuỳ chọn, lưu riêng không cần lý do, không đổi "Nhập bởi"; lý do sửa vẫn tuỳ chọn; quyền từng mục của "Thêm ▾" giữ đúng `thaoTacKyNang`. Chỉ đổi chỗ đặt.

**9. Xác nhận.** Q7 (hộp chấm cho lớp thường, bỏ ô gõ thẳng ≥ 768 px) — **có**; Q8 (bỏ ⋯ trong ô, thay 9.2-38) — **có**.

---

### V3A-7. Clipping / đè / lệch khác ở Test và chỗ tương tự — P2 · [ĐÃ KIỂM]

**1. Vấn đề (đo `v3a-cat.mjs`, 15 màn, chỉ tính lỗi thật — bỏ phần tử nằm ngoài vùng đang cuộn).**

| # | Chỗ | Đo / ảnh | Mức |
|---|---|---|---|
| a | ⋯ đè ô tổng — mọi lưới lớp thường (Lịch Test, `/bang-diem-thuong`, hồ sơ lớp, Công việc) | 432 px² / ô (V3A-6) | P1 |
| b | Tiêu đề cột lớp thường: ô "tổng [25]" của tiêu đề nằm **trên ô "đúng"** của hàng (x ≈ 342–385 vs ô đúng 370–413, ô tổng 428–471) → lệch **≈ 86 px** so ô mà nó điều khiển; nhãn môn "L" nằm trên ô **tổng** | `a1-qt-thuong28--hover` (1440, tỉ lệ 1:1) | P1 |
| c | 375 lưới lớp thường: link tên em có vùng bấm 44 px (`max-sm:py-3 -my-3`) **đè 6 px** lên hàng ô nhập ngay dưới (8 cặp đè) → chạm mép trên ô "đúng" có thể mở hồ sơ | `t-thuong28-375` | P2 |
| d | Khối 1 cột "Hạn": tiêu đề trái, ô "hạn 08/07 ⚠ quá hạn 68 ngày" căn lẫn → lệch **76,5 px** | `v3a-bang.json` › `t-lt-qt1` T0 | P2 |
| e | Hộp "Sửa Grammar + Vocabulary · Lưu Bảo Ngân" (w 288 px) tiêu đề xuống 2 dòng, hộp che 3 hàng dưới | ảnh 1, `a1-…--sua` | P3 |
| f | Phân tích › Kết quả thi: cột việc `td truncate` cắt link "Kết quả PA Tự học Speaking…" (294 / 604 px), chỉ còn `title` | `t-kqthi-qt` | P2 — **chuyển agent Phân tích** |
| g | 375 khối 1: mỗi dòng 5–6 dòng chữ, "quá hạn 68 ngày" lặp hai lần, liệt kê "L, R, W1, W2, S" dù GV chỉ có W2 | `c-gv10-375-k1--mo` | P2 |

Các bảng còn lại đo **0** phần tử bị cắt / đè.

**2. Nguyên nhân.** (a, b) tiêu đề chứa điều khiển (ô nhập + nút) rộng hơn nội dung ô, căn phải, cùng cột với nội dung căn phải khác bề rộng; (c) mẹo nới vùng bấm bằng padding âm đè hàng dưới; (d) cột chữ không có kiểu cột (11.1a R1); (g) dòng 375 ghép mọi thông tin của bảng 9 cột.

**3. Ảnh hưởng.** Đọc sai mẫu số (a); tưởng ô tổng ở tiêu đề sửa ô "đúng" (b); bấm nhầm mở hồ sơ trên điện thoại khi đang chấm (c) — mất chỗ, Quay lại về đầu lưới (TST-11).

**4. Liên quan.** 11.1a (R1, R5), V2B-2 (ô điểm), X5 (hàng dày).

**5. Phương án.** (1) Vá từng chỗ (dời ⋯ ra cột cuối, đổi padding tên, căn cột Hạn). (2) Gốc: hộp chấm (V3A-6) bỏ (a)(b); `Bang` kiểu cột bỏ (d); quy tắc vùng bấm ≥ 44 px bằng `min-height` của chính phần tử, **không padding âm**, áp ở `TheDong` 375 (c); dòng 375 khối 1 dùng định nghĩa cột (11.1a 4g) chỉ phần của tôi (g).

**6. Ưu / nhược.** (1) nhanh nhưng giữ cấu trúc sinh lỗi; (2) theo đúng hai nền đã đề xuất (11.1a, hộp chấm), không thêm việc riêng.

**7. Đề xuất: (2)**; thêm vào `do-bang` phép đo **"đè nhau" (giao nhau > 2 px giữa hai phần tử bấm được)** và **"tiêu đề có điều khiển"** — script `NEW\chup\v3a-cat.mjs` dùng lại được.

**8. Nghiệp vụ.** Không đổi.

**9. Xác nhận.** Không cần (đi cùng Q7, Q13 vòng 2).

---

### V3A-8. Màu điểm: lớp thường và các nơi chưa theo luật vòng 1 (I.1) — [ĐÃ CHỐT: tô chính con số, 3 token] · [ĐÃ KIỂM]

**1. Vấn đề — một môn trượt lớp thường (R 27/40 = 67,5 %) hiện 6 dáng:**

| # | Nơi | Dáng hiện tại | Tệp:dòng | Có trong v1 B1? |
|---|---|---|---|---|
| 1 | Lưới chấm (ô có điểm, sửa được) | số **đỏ trong ô nhập** + dòng 2 "Chưa đạt · 67,5%" đỏ; đạt: số trắng + "Đạt · 80%" xám | `ScoreEntry.tsx:778, 472-481` | #13 |
| 2 | Lưới chấm (ô **chỉ đọc**: môn GV khác / đã hoàn tất) | "11/20" **đỏ, không ký hiệu** — **chỉ bằng màu** | `ScoreEntry.tsx:742` | **mới** |
| 3 | Cột Kết quả lưới | chip **nền đỏ** "3/4 môn đạt" (có 1 môn trượt), nền xanh "4/4", Pre FOU nền vàng | `LuoiThuong.tsx:599-611` | #14 |
| 4 | Hồ sơ lớp › Tổng hợp lớp thường | "**× 27/40**" đỏ cả cụm; "% tổng" trắng; "Chưa có điểm" vàng | `classes/BangDiemLopThuong.tsx:224-241, 208-210` | #15 (một phần) |
| 5 | Hồ sơ HV › Tiến độ theo kỹ năng | "27/40" **khung nền đỏ**, đạt khung nền xanh | `cases/SkillBoard.tsx` | #12 |
| 6 | Hồ sơ HV › Kết quả Test | chip "R 27/40" **nền VÀNG** (`warn`), đạt nền xanh | `students/StudentDetailPage.tsx:600-608` | **mới** |

Thêm (FT / khác, chưa có hoặc chưa đủ trong B1): Chấm Speaking danh sách "5.5" trắng, không ký hiệu (`d-cv-gv9`); 375 `MotKyNang` FT "7.0" không ký hiệu, không màu (`c-gv10-375-p1`); hồ sơ HV bảng Mock: số là **link xanh**, MT1 R 5.0 < 5.5 trông như đạt (`e-hv20-admin22-p2`, B1 #10); Kết quả FT "Đạt kỳ vọng" chip **nền xanh** cạnh "SOS 1 · S" **viền vàng** (`b-ql2-p1`).

**2. Nguyên nhân.** Mỗi màn tự dựng ô (V2B-2 — 7 cấu trúc); lớp thường thêm 3 kiểu riêng (ô nhập, chữ, chip `Outcome`). `warn` (vàng) chọn cho "chưa đạt" ở hồ sơ HV trùng nghĩa vàng = SOS 1 / sắp hạn. Ô chỉ đọc bỏ ký hiệu vì ô hẹp.

**3. Ảnh hưởng.** Cùng một điểm, đọc ở hai nơi ra hai mức (đỏ / vàng); người mù màu đỏ-lục không phân biệt ô chỉ đọc "11/20" với "18/20"; chip nền đỏ "3/4 môn đạt" nói "gần đạt" bằng màu "trượt". Admin văn phòng không thấy kỹ năng nào dưới kỳ vọng.

**4. Liên quan.** Học viên & Lớp bảng lớp thường "3/4 môn đạt SOS 1 · G+V" (v2a), Phân tích › Test + SOS, Báo cáo (lớp thường chưa có khối kết quả — A5), tệp xuất (không màu — không áp).

**5. Phương án — luật cho điểm dạng "x / tổng".**
- **P1 — "✗ 17/25", tô số đúng:** ký hiệu ✓ / ✗ (13 px) **trước**, **số đúng 15 / 700** màu `--kq-vuot` (≥ 70 %) hoặc `--kq-duoi` (< 70 %), **"/25" 13 / 400 `--text-faint`** liền sau, cùng đường cơ sở; **không %** trong ô.
- **P2 — tô cả cụm "17/25"** cùng màu, % nhỏ cạnh (như mockup 2 khung 1a "✗ 16/25 64%").
- **P3 — chỉ hiện %** ("✗ 68 %") ở ô, số câu ở hộp.

**6. Ưu / nhược.** P2 đúng mockup cũ nhưng hai số cùng màu → mẫu số (tham chiếu) cũng "đỏ"; thêm % → ô 2 thông tin, rộng ~110 px. P3 gọn nhưng GV chấm theo **số câu** và Rulebook nói "tỷ lệ chính xác 7/10" — % làm mất số đã nhập. **P1**: số mắt cần (số câu) to và có màu; mẫu số là tham chiếu như kỳ vọng (vòng 1: "Kỳ vọng, Target không tô"); đạt / chưa đạt đã nói bằng ✓/✗ + màu nên % thừa trong ô; ô 1 dòng → hàng 44 px (nay 57).

**7. Đề xuất: P1**, và:
- **% chỉ ở:** hộp chấm ("68 % · chưa đạt — cần 70 %"), tooltip ô, cột **"% tổng"** (Final / Checkpoint / Pre FOU — luật dùng % tổng): "**62 %**" tô cùng ngưỡng 70 %, dải 50 / 60 nói bằng **chữ** ở dòng phụ gợi ý ("bổ trợ 2 buổi"), **không thêm màu thứ tư**.
- **Mẫu số:** luôn trong ô (đề có thể khác nhau từng em); khác tổng phổ biến của cột → mẫu số chữ thường màu `--soon` + `title` "đề khác" (thay viền vàng ô nhập).
- **Kết quả bài lớp thường:** Progress = chip SOS **viền** "SOS 1 · G+V" (§20.17, = 9.2-26) — bỏ chip nền "n/4 môn đạt"; đủ môn đạt = "✓ Đạt" chữ `--kq-vuot` **không nền**; chưa đủ = "Chưa đủ điểm · còn P" trung tính. Final = "62 %" (như trên) + hướng gợi ý. Checkpoint = như Progress nhưng không SOS (chỉ "✓ Đạt" / "✗ Chưa đạt · L+S").
- Thay 6 dáng ở bảng trên + 4 chỗ FT bằng **một `ODiem`** (V2B-2) có biến thể `ti-le` — gồm ô chỉ đọc (có ký hiệu), hồ sơ HV (bỏ nền vàng / nền khung), bảng Mock hồ sơ HV (số tô màu, link chỉ gạch chân khi rê — v1 B2).

**8. Nghiệp vụ.** **Không đổi ngưỡng** (70 % trên số chưa làm tròn, so kỳ vọng FT); "Đạt" lớp thường = ≥ 70 % từng môn. Chỉ đổi cách hiện.

**9. Xác nhận.** Q9 (P1 + bỏ % khỏi ô — lệch mockup 2 khung 1a "64%") — **có**; Q10 (Kết quả Progress = chip SOS, = 9.2-26) — **có**.

---

### V3A-9. Căn bảng Test chưa đo ở vòng 2 (I.3) — [ĐÃ CHỐT: sửa triệt để] · [ĐÃ KIỂM]

**1. Vấn đề (đo `v2b-do-bang.mjs`, 1440 tối — `NEW\do\v3a-bang.json`).**

| Bảng (lối) | Tệp | Cột lệch > 2 px | Cao hàng | Lệch đường cơ sở trung vị / max | Cỡ chữ trong ô | Ghi chú |
|---|---|---|---|---|---|---|
| Lưới lớp thường (Lịch Test, `/bang-diem-thuong`, hồ sơ lớp, Công việc) | `cham/LuoiThuong.tsx` | 4 / 6 (10 px — do ⋯ vô hình ở mép phải) + **ô "tổng" tiêu đề ≈ 86 px** | **57** (2 dòng: số + "Đạt · 80%"; + chip "Đã hoàn tất" dưới tên) | 10,5 / 12,5 | 11 · 11,5 · 12 · 13 | tiêu đề 4 dòng ("L" / "tổng [25] Điền cả cột") |
| Kế hoạch Test FT (MB FT 101, 33 em) | `test/keHoach/LuoiKeHoach.tsx` | 0 / 5 | **34–79** (trung vị 49) | 7,5 / **24** | 11,5 · 12 · 13 | chip 2–3 dòng / ô (TST-06) |
| Kế hoạch Test lớp thường | `LopKeHoach` | 0 / 3 | 57 | 13 / 13 | 11 · 13 | — |
| Lịch Test khối 1 | `test/lichTest/KhoiNo.tsx` | 1 / 9 (**Hạn 76,5**) | 48,6 | 10 / 10 | 11,5 · 12 · 13 · 14 | "Đợt" / "Kỹ năng" xuống 2 dòng |
| Lưới FT ở Lịch Test / panel Công việc | `LuoiFT` | 8–9 / 10 (45–69) · panel L 36, R 36, Kết quả 25,5 | 64–75,8 | 11,5 / 22,4 | 11 → 15 | đã có ở 11.1a |
| Hồ sơ HV › Kết quả Test (lớp thường) | `StudentDetailPage` | 1 / 5 (Kết quả 8) | 39,6–56,6 | 9 / 9 | 11,5 · 12 · 13 | chip điểm trong ô |
| Hồ sơ lớp › Tổng hợp lớp thường | `BangDiemLopThuong` | **[ĐÃ KIỂM bằng ảnh]** thẳng (số + tiêu đề cùng giữa); script không ghép được tiêu đề 2 tầng `rowSpan` (số −183 / −379 là lỗi đo) | 46,6–58,6 ("Chưa có điểm" 2 dòng) | — | 12 · 13 | `e-hsl-fou12-gv7-p1` |
| Hồ sơ Mock › Lịch Test | `MockDetailPage` (lưới div) | 0 (v2b) | — | — | tiêu đề **IN HOA 11 px** ("KỸ NĂNG · LỊCH TEST · TRẠNG THÁI VÀ HẠN · THAO TÁC") | trái luật chữ vòng 1 |
| Chấm Speaking (danh sách div) | `PanelChamSpeaking` | không bảng — tên trái, ô điểm phải: thẳng | 60 | — | — | — |
| Xếp nhiều MT | `NganXepLichMt` | **[GIẢ THUYẾT]** không đo được (bước chọn lớp lỗi) — a4 TST-14 | | | | đo lại khi chuyển sang `Bang` |

**2. Nguyên nhân.** Như 11.1a (R1 không component bảng, R2 luật căn theo tên lớp, R4 ô nhiều cấu trúc) + **gốc riêng của lưới lớp thường**: tiêu đề cột chứa **điều khiển** (ô "tổng" + nút) rộng hơn ô dữ liệu, ô dữ liệu chứa nút "Nhận xét" + 2 ô nhập + ⋯ phủ; chip trạng thái hàng ("Đã hoàn tất") nằm **dưới** tên thay vì ký hiệu sau tên (mockup 2 vẽ "✓" sau tên).

**3. Ảnh hưởng.** Như ảnh 1 + 11.1a: dò cột sai, hàng dày (57 vs 44 px → lưới 5 em cao thêm 65 px; 33 em thêm 430 px), Kế hoạch Test hàng lệch nhau 45 px làm mất mạch đọc từng em.

**4. Liên quan.** 53 tệp bảng (V2B-1 mục 6); mọi lối của `LuoiThuong`.

**5. Phương án.** (a) Vá: căn tiêu đề trái, nới cột. (b) **11.1a `Bang` + `ODiem` + 3 kiểu cột bổ sung** (dưới). 
**6. Ưu / nhược.** (a) tái phát (lý do ở 11.1a); (b) một lần cho mọi bảng, có phép kiểm.

**7. Đề xuất: (b)** — **xác nhận 11.1a đủ hướng**, bổ sung:

| Bổ sung cho 11.1a 4b | Dùng ở | Định nghĩa |
|---|---|---|
| Kiểu **`diem-ti-le`** ("x / tổng") | lưới lớp thường, Tổng hợp lớp thường, hồ sơ HV, Checkpoint, Pre FOU | `ODiem` biến thể `ti-le`: [ký hiệu 13][số đúng căn phải 2ch, 15/700][/tổng căn trái 3ch, 13 faint]; cột **88 px**, căn **giữa theo dấu "/"** (hai nửa cố định → số thẳng hàng dù tổng 20 / 25 / 40) |
| Kiểu **`phan-tram`** | "% tổng" Final / Checkpoint | như `so` (giữa, 64 px) + màu theo ngưỡng (V3A-8) |
| **Tiêu đề có chú thích** (`phu`) | "G+V · /25 ✎", "S · chấm chéo" | tiêu đề **một dòng** nhãn + chú thích 12 px cùng hàng; điều khiển (✎) mở hộp nhỏ bậc 2 — **cấm ô nhập / nút trong `th`** (thêm vào phép kiểm BANG-2) |
| **Nhóm cột 2 tầng** (`nhom`) | Tổng hợp lớp thường (Progress / Final), lưới FT (Kỳ vọng · Overall) | hàng tiêu đề nhóm 32 px, đường kẻ dọc 1 px giữa nhóm; `do-bang` phải ghép tiêu đề có `rowSpan` (sửa script) |
| Trạng thái hàng = **ký hiệu sau tên** | "Đã hoàn tất", "vào muộn", "Thiếu n" | "✓" 13 px sau tên + `title`, không chip dòng 2 (mockup 2 khung 1a) |

**8. Nghiệp vụ.** Không đổi.

**9. Xác nhận.** Q13 — khuyến nghị **có** (cùng 11.8-1, 11.8-13).

---

### V3A-10. Rulebook lệch mã — P3 (tài liệu) · [ĐÃ KIỂM]

**1. Vấn đề.** (a) Rb 772 "Hạn chấm [lớp thường] hết **Chủ nhật** tuần thi" ↔ Rb 684, 718 + `ss/platform/week.ts:89-93`: **T4 tuần sau**. (b) Rb 605 "Nhận xét W/S **không bắt buộc**; L/R không có" ↔ OV-12b (14/10) **bắt buộc ≥ 10 ký tự cho mọi ô MT có điểm**, cả L/R (`sd/nhanXet.ts:16-52`; ảnh `b-ql2-p1` "thiếu nhận xét" dưới L, R) — §20 chưa chép OV-12b. (c) Rb 818 "Lớp thường: GVCN và GVBM đúng môn **cũng dời được** lịch" ↔ web chỉ QL (`sd/thaoTacMt.ts:67` "luật 09/10: GVCN không xử lý lịch Test"; plan.md "QL-TEST chỉ QL lo lịch") — trong khi máy chủ `moveableSkills` vẫn cho GV lớp thường (`ss/permissions.ts:596-599`). (d) Rb 631 tiêu đề PR-LT3 "**CHƯA CÓ trong code**" — đã có.
**2. Nguyên nhân.** Quyết định sau 02/10 ghi ở plan / đặc tả, không chép lại §20. **3. Ảnh hưởng.** Ai viết Hướng dẫn / sổ tay từ Rulebook sẽ sai (đã từng — Rb 652). **4. Liên quan.** Hướng dẫn GV, sổ tay. **5–6. Phương án.** Sửa chữ Rulebook (PR tài liệu GĐ0) vs để nguyên — để nguyên thì lỗi lặp. **7. Đề xuất:** sửa (a)(b)(d) theo mã; (c) **hỏi**. **8. Nghiệp vụ:** không đổi luật — chỉ ghi đúng luật đang chạy; (c) nếu chủ SP muốn GV lớp thường dời được thì máy chủ đã cho, chỉ thiếu UI. **9.** Q12.

---

## Phần 3. Hệ thống chấm Test đề xuất (I.4.3 + I.4.4) [ĐỀ XUẤT]

### 3.1 Brainstorm — 17 ý, đánh giá từng ý

| # | Ý | Lợi ích | Chi phí | Tác động workflow | Phức tạp hơn? | Kết luận |
|---|---|---|---|---|---|---|
| 1 | **Một hàm nhãn bài chấm**: "MT2 · thi W2 SEP · hạn T4 16/09" (thi + hạn, mọi hàng / hộp / việc / thông báo) | hết nhầm tuần làm bài ↔ tuần ghi | thấp (chữ) | không đổi bước | không | **GIỮ** |
| 2 | **Gom theo hạn**: "⚠ Quá hạn" · "Hạn T4 16/09 · bài thi W2 SEP" · "Bài thi tuần này · hạn T4 23/09" (đúng luật chia khối T15–T17) | câu hỏi thật của GV là "xong trước khi nào" | thấp (tên + thứ tự) | khối 3 có ô của tôi thì **mở**, không thu | giảm | **GIỮ** |
| 3 | **Một nguồn** cho Công việc "Chấm điểm" và Test (cùng hàm, cùng hàng, cùng số) | hết 4 con số cho một khối lượng | vừa (gộp `gomBaiChuaCham` + `lichTest`) | không | **giảm** | **GIỮ** |
| 4 | **Lưới gọn**: chỉ cột của tôi + chỉ ô trống; "Cả lớp" xem đủ (9.2-21, TST-01) | bớt dò cột (W1 ↔ W2), bớt ô đã xong | thấp (tham số `chiCot` có sẵn) | không | không | **GIỮ** |
| 5 | **Tự sang nhóm kế** khi xong nhóm: "✓ Xong MB FT 101 · MT2 thi W2 SEP — tiếp: MB FT 102 · MT1 ›" (mockup 2 khung 1e) | 0 bấm giữa các lớp | thấp–vừa | Enter đi xuyên nhóm | không | **GIỮ** |
| 6 | **Một hộp chấm** cho mọi loại Test (V3A-6), đầu hộp có tên em · bài · thi · hạn | ngữ cảnh tại chỗ; nhận xét lớp thường vào hộp | vừa | bớt 2 hộp | **giảm** | **GIỮ** |
| 7 | **Ô ba trạng thái rõ**: chưa chấm (khung đứt) · đang lưu / lỗi (dấu góc trên) · đã chấm (`ODiem` chữ) — không chỉ màu | biết ô nào còn | thấp (đã có phần lớn) | không | không | **GIỮ** |
| 8 | **Nhóm "Chấm Speaking chéo"** cho GV có phân công S (V3A-2) | GV S thấy đúng việc | thấp | không | không | **GIỮ** |
| 9 | **Tình trạng chấm** cho QL/QT: lớp × bài · đủ x/y · ai còn nợ theo kỹ năng (V3A-3) | giao ban 1 bấm | vừa | thay dải 3 ô + khối 1 kiểu cũ của QL | không (thay, không thêm) | **GIỮ** |
| 10 | Người mới: trạng thái rỗng dạy luật ("Bài thi tuần này chấm trước T4 tuần sau"), ⓘ 1 câu ở đầu nhóm | người mới không phải hỏi | thấp | không | không | **GIỮ** |
| 11 | Sau khi chấm: dòng "✓ Đã lưu 6 bài · MT2 MB FT 101 · Hoàn tác" ở đầu nhóm (như Dán Excel) | kiểm tra sau | vừa (Hoàn tác từng ô) | +0 bấm | thêm trạng thái | **BỎ** — ô đã có trạng thái lưu từng ô + "Lịch sử"; Hoàn tác ô làm phức tạp |
| 12 | Cảnh báo mềm khi điểm bất thường (band lệch ≥ 2.0 so lượt trước; đúng > 90 % tổng khác cột) | bắt gõ nhầm cột / em | vừa | +1 xác nhận đôi khi | thêm trạng thái, dễ báo nhầm | **BỎ** (giữ viền tổng khác cột đã có) |
| 13 | Xác nhận trước khi lưu ô ("chắc chưa?") | — | thấp | +1 bấm mỗi ô | có | **BỎ** (CLAUDE.md: xác nhận chỉ khi hậu quả lớn) |
| 14 | Tô nền cả hàng quá hạn | nổi bật | thấp | không | thêm nghĩa màu | **BỎ** (DESIGN: quá hạn = chữ + ⚠) |
| 15 | Badge số bài chờ chấm trên menu "Test" | nhắc | thấp | không | trùng badge Công việc | **BỎ** |
| 16 | Lưới theo tuần **khoá** ô của bài tuần khác (chỉ sửa ở đúng nhóm) | chống sửa nhầm bài cũ trong việc tuần này (`d-cv-gv7-thuong`: ô 27/40 thi W3 AUG nằm trong việc W3 SEP) | thấp (lưới gọn ẩn sẵn) | "Cả lớp" vẫn sửa được qua hộp có lý do | không | **GIỮ** (thuộc #4) |
| 17 | Đổi "Lớp tôi dạy · Tất cả" → "Lớp của tôi · Mọi lớp"; khung mặc định "Tất cả" khi GV có bài S chéo (TST-19) | hết hai "Tất cả" | thấp | không | không | **GIỮ** |

### 3.2 Hệ thống (cho cả chấm và xem lại)

```
                ┌──────────── MỘT NGUỒN: hangCham(nguoi, homNay) ─────────────┐
                │ nhóm theo hạn (luật khoiCham giữ nguyên) · hàng = lớp × bài × tuần thi × người │
                └───────────────┬───────────────────────────────┬─────────────┘
       Công việc › Chấm điểm (GV: trang nhà)              Test › Chấm Test
       hàng gọn → lưới gọn ở khung phải (bậc 4)           hàng → lưới gọn ngay dưới hàng (bậc 2)
                         └──────────── cùng LuoiChamLop gọn (cột + ô của tôi) ───────────┘
                                         ô = ODiem · bấm / gõ số = HopCham (một mẫu)
       Hồ sơ lớp › Điểm Test của lớp (theo LƯỢT, V2B-3)  ← "Cả lớp", xem lại, Dán từ Excel (duy nhất)
       Test › Tình trạng chấm (QL/QT): lớp × bài · đủ x/y · ai còn nợ → mở lưới lượt dưới hàng
       Test › Lịch tuần (đổi tuần, chỉ xem): ai thi gì tuần W1 OCT  ← khối 3 khi xem tuần khác
       Hồ sơ HV › Kết quả Test (Admin / TVV / CX): ODiem màu + Kết quả
```

**Chấm Test (người chấm)** — một danh sách:
- `⚠ Quá hạn chấm · 11 bài` (mở khi có) → hàng: **MB FT 101 · MT1 · thi W1 JUL · W2 của bạn: 2 · ⚠ quá hạn 68 ngày** → lưới gọn (cột W2, 2 em).
- `Hạn T4 16/09 · bài thi W2 SEP · 3 bài` → MB FT 101 (MT3 · 1) · MB FT 102 (MT1 · L, R · 2).
- `Bài thi tuần này W3 SEP · hạn T4 23/09 · 6 bài` → **mở khi có ô của tôi** (nay thu).
- `Chấm Speaking chéo · 24 bài · không tính nợ` (chỉ GV có phân công S).
- Không dải số; không bộ chọn tuần (hàng chấm luôn theo hôm nay — đúng T16); link nhỏ "Lịch tuần khác ›".
**QL/QT** thấy cùng ba nhóm ở dạng **Tình trạng chấm** (hàng có "ai còn nợ"), nhập hộ được (9.2-1), người chấm S phải chọn (9.2-25).

### 3.3 So với các đề xuất đã có

| Mã cũ | Nội dung | Sau vòng 3 |
|---|---|---|
| 11.1a `Bang` / `ODiem` | hệ thống bảng | **giữ** + 3 kiểu cột (V3A-9) + biến thể `ODiem ti-le` (V3A-8) |
| V2B-3 Nhập điểm tại chỗ hồ sơ lớp | lưới theo lượt gập, nút cuộn + mở | **giữ** — là góc "theo lượt" duy nhất + nơi duy nhất có Dán Excel |
| 11.1c | 12 chỗ "làm ngay đó" | **giữ**; #11 (Lịch Test "Mở lưới đầy đủ ↗") → "Cả lớp" tại chỗ; #2 chip "78 bài chờ chấm" → đọc từ `hangCham` |
| TST-01 lưới gọn | chỉ em + cột còn nợ | **giữ**, thu hẹp thêm: cột **của tôi** |
| TST-02 / 7.6 "một panel theo **lượt** cho mọi lối" | | **đổi**: chấm theo **tuần thi** (hàng chấm — một lần thi có thể trộn MT1 + MT3 cuốn chiếu, tách theo lượt = 2 panel cho một chồng bài), xem / nhập cả lớp theo **lượt**; vẫn bỏ trang `/nhap-diem` (9.2-27) + **bỏ `/bang-diem-thuong`** |
| TST-03 / 9.2-20 bỏ dải 3 ô | | **giữ** (hàng chấm không dải; QL có Tình trạng chấm) |
| TST-12 / 9.2-25 người chấm S | | **giữ** + chữ "chấm chéo" (V3A-2) |
| TST-17 khối 1 8 nút chính | | **thay** bằng Tình trạng chấm (QL) / hàng của tôi (GV) |
| 9.2-21 lưới gọn | | **giữ** |
| 9.2-12 Speaking có hạn | | **giữ** (hiện hạn, không tính nợ) |
| 9.2-24 Dán W/S 4 cột | | **giữ**, chỉ ở lưới theo lượt (V3A-5) |
| 9.2-26 Progress chip SOS | | **giữ** (V3A-8) |
| 9.2-38 ⋯ luôn hiện mờ | | **thay**: bỏ ⋯ khỏi ô (V3A-6) |
| CV-02 Dán Excel trong panel | | **hết hiệu lực** |
| Mockup ba khối 06/10, mockup 2 khung 1a / 1d | | **sửa**: tên nhóm theo hạn; ô lớp thường "✗ 16/25" không %, không nút Nhận xét; 1d chỉ lưới theo lượt |

### 3.4 Đếm bước — sáu việc thật (bấm = bấm chuột / chạm, không tính gõ điểm; đếm theo mã + ảnh, không lưu thật)

| Việc | Nay | Sau (B) |
|---|---|---|
| **Cô Linh** (GV 10, W2) chấm mọi bài đến hạn + quá hạn: 11 + 3 + 6 bài, 2 lớp | Lịch Test: menu (1) · ô K2 lớp 101 (1) + lớp 102 (1) · mở K3 (1) + ô (1) · mở K1 (1) + 5 dòng "Nhập điểm" (5) = **~11 bấm, 3 khối, 8 lưới 10 cột**; hoặc Công việc **6–7 bấm, 6 panel** | menu (1) · nhóm Quá hạn tự mở, con trỏ ở ô W2 đầu · Enter đi hết nhóm, tự sang nhóm kế = **1–2 bấm, 1 lưới gọn mỗi nhóm** |
| **GV S chấm chéo** lớp không phải lớp mình (GV 9) | Công việc (1) · "Chấm Speaking" (1) · ô (1) · "Người chấm: Chưa chọn · Đổi" + chọn (2) = **5 bấm**; từ Lịch Test: đổi khung + "Tất cả" + mở lớp + tìm cột S (≥ 4) và nhãn nói "GV khác" | nhóm "Chấm Speaking chéo" (1) · ô (1), người chấm mặc định = tôi = **2 bấm** |
| **GV nhập bài quá hạn** (GV 7, L R MT1 thi W1 SEP) | Test (1) · mở K1 (1) · dò 6 dòng, 5 dòng "MB FT 101" giống nhau · "Nhập điểm" (1) = **3 bấm + dò** | Test (1) — nhóm Quá hạn đầu trang, mở sẵn = **1 bấm** |
| **GV lớp thường chấm Progress + nhận xét** (GV 7, MB BE 03; giả định 3 em cần chấm + nhận xét — demo còn 1 em) | Test (1) · ô (1) · (gõ, Enter) ×3 · Nhận xét + Lưu ×3 (6) = **~8 bấm, 4 hộp** | Test (1) · ô (1) · (gõ, Tab nhận xét, Enter) ×3 = **2 bấm, 1 hộp** |
| **QL tra "MB FT 101 MT2 đủ chưa, ai còn nợ"** | Lịch Test: mở K1 (1) · đọc 2 dòng MT2 · mở K2 dòng "MT1, MT2, MT3" (1) · mở lưới (1) · cột "GV chấm" không nói ai nợ gì → **3–5 bấm + cộng nhẩm**, chưa trả lời hết; hoặc hồ sơ lớp **5–6 bấm + 1 đổi trang** | Test › Tình trạng chấm (1) · đọc hàng (ví dụ) "MT2 · 24/33 · còn 15 ô · Hà L,R 6 · Linh W2 3 · chấm chéo S 6" = **1 bấm, 0 đổi trang** |
| **Admin văn phòng tra điểm MT một em** | tìm + chọn (2) · cuộn tới "Mock Test" · số không màu | như nay **2 bấm** · số tô màu theo kỳ vọng của lượt (đọc được kỹ năng nào dưới kỳ vọng) |

**Chiều cao trang (1440):** Lịch Test QT 2 629 px (mở K1: 3 203), QL 2 170, GV 8 1 517; 375: QT 3 923, QL 3 339, GV 8 2 276. Sau (ước): QL ~1 000 px (Tình trạng chấm 1 hàng / lớp × bài), GV chỉ hàng của mình (GV 10: 3 nhóm × 1–2 hàng ≈ 600 px trước khi mở lưới).

### 3.5 Trình tự đề xuất (khớp mục 8 + 11.7 tài liệu chính)
1. **GĐ1** (không đổi bố cục): hàm nhãn "thi … · hạn …" cho mọi chỗ (#1); "GV khác" → "chấm chéo" + luật đếm ô quá hạn theo phạm vi (V3A-2); `luot` bắt buộc ở `/scores/lo` + ẩn Dán Excel ngoài lưới theo lượt (V3A-5) — đều chữ / điều kiện hiển thị; sửa chữ Rulebook (V3A-10).
2. **BANG-0 / BANG-1** (11.8-1): `Bang` + `ODiem` (+ `ti-le`, 3 kiểu cột) — lưới lớp thường vào luôn.
3. **M5 Test** (cần **mockup mới** 1440 tối + 375 sáng, đủ trạng thái): Chấm Test theo hạn + Tình trạng chấm + Lịch tuần; **HopCham** một mẫu (FT + lớp thường); một nguồn với Công việc (M2 dùng lại).
4. **M3 Hồ sơ lớp** (V2B-3) — giữ là góc theo lượt + Dán Excel.

---

## Câu hỏi cho chủ SP (quan trọng trước — mỗi câu có khuyến nghị)

1. **"Ba khung chấm Test"** anh/chị nói là **ba khối của Lịch Test** (Quá hạn · Chấm tuần này · Lịch tuần này) hay **ba nơi chấm** (Lịch Test · Công việc · Hồ sơ lớp)? — *Đề xuất ở Phần 3 xử lý cả hai; xin xác nhận để viết mockup đúng chỗ.*
2. **Thay ba khối bằng "Chấm Test" gom theo hạn** (giữ đúng luật chia khối T15–T17 đã chốt 05/10; đổi tên "Quá hạn chấm · Hạn T4 16/09 (bài thi W2 SEP) · Bài thi tuần này (hạn T4 23/09)", khối 3 mở khi có ô của mình, bỏ dải số, bỏ bộ chọn tuần khỏi phần chấm)? — **Có.**
3. **Một nguồn cho "Chấm điểm" ở Công việc và Test** (cùng hàng, cùng chữ, cùng số)? — **Có.**
4. **Chấm theo tuần thi, xem / nhập cả lớp theo lượt** (thay TST-02 "theo lượt cho mọi lối"; vẫn bỏ `/nhap-diem` và bỏ thêm `/bang-diem-thuong`)? — **Có.**
5. **Speaking chấm chéo:** nhóm riêng "Chấm Speaking chéo" trong danh sách chấm của GV có phân công S, chữ "chấm chéo" thay "GV khác", hiện hạn chỉ để nhìn (không tính nợ — T18 giữ)? — **Có.**
6. **Excel:** (i) giữ duy nhất ở lưới theo lượt (hồ sơ lớp + panel Nhập điểm lớp); với lớp thường "theo từng MT" = **theo từng bài** (Progress / Final)? (ii) ẩn ở điện thoại? (iii) "Thêm học viên" (có cột điểm đầu vào) không thuộc việc bỏ? — **Có / có / có.**
7. **Lớp thường dùng hộp chấm như FT** (bấm hoặc gõ số trên ô → hộp: đúng / tổng · nhận xét tuỳ chọn · lý do sửa gập · Vắng · Thêm ▾ · Lưu · em tiếp), bỏ ô gõ thẳng ở máy tính, bỏ nút "Nhận xét" riêng và "Điền cả cột"; điện thoại giữ ô to + "＋ Nhận xét" trong hàng? — **Có.**
8. **Bỏ ⋯ khỏi ô điểm** (Lịch sử · Huỷ điểm · Dời hạn · Dời lịch chuyển vào chân hộp chấm) — thay câu 9.2-38? — **Có.**
9. **Điểm "x / tổng" = "✗ 17/25"**: tô **số đúng** theo 3 token, mẫu số nhạt, **không % trong ô** (% ở hộp, tooltip, cột "% tổng") — lệch mockup 2 khung 1a ("✗ 16/25 64%")? — **Có.**
10. **Kết quả Progress lớp thường = chip SOS viền** (§20.17), bỏ chip nền "3/4 môn đạt"; đủ đạt "✓ Đạt" chữ xanh không nền (= 9.2-26)? — **Có.**
11. **"Tình trạng chấm" cho QL / QT** (lớp × bài · đủ x/y · còn n ô · ai còn nợ theo kỹ năng · quá hạn), thay dải 3 ô + cột "GV chấm" chỉ có tên? — **Có.**
12. **Lớp thường: GV (GVCN / GVBM đúng môn) có được dời lịch một môn không?** Rulebook §20.9 nói có; web hiện chỉ QL ("luật 09/10"); máy chủ vẫn cho. — *Khuyến nghị: theo luật 09/10 (chỉ QL), sửa chữ Rulebook* — cần anh/chị chốt vì là luật.
13. **Bổ sung 11.1a**: kiểu cột `diem-ti-le`, `phan-tram`, tiêu đề có chú thích (cấm ô nhập / nút trong tiêu đề), nhóm cột 2 tầng; trạng thái hàng là ký hiệu sau tên ("✓" thay chip "Đã hoàn tất")? — **Có.**
14. **Rulebook sửa chữ** 3 chỗ lệch mã (hạn lớp thường T4; nhận xét MT bắt buộc OV-12b; PR-LT3 đã có trong code)? — **Có** (chỉ ghi đúng luật đang chạy).

---

## Ảnh tiêu biểu (`C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v3a\`)

1. `…\anh\v3a\a1-qt-thuong28--hover.png` — ảnh 1 tái hiện: ⋯ đè ô "25" (G+V hàng 1), "Nhận xét" trước ô, "tổng [25] Điền cả cột" lệch ô tổng (V3A-6, V3A-7, V3A-9).
2. `…\anh\v3a\a1-qt-thuong28--menu.png` — ⋯ mở: Dời lịch thi · Huỷ điểm · Lịch sử.
3. `…\anh\v3a\a1-qt-thuong28--sua.png` — hộp "Sửa … Lý do" (không có nhận xét) — hộp thứ hai.
4. `…\anh\v3a\a1-qt-thuong28--nhanxet.png` — hộp Nhận xét riêng, phụ đề "W2 SEP" không "thi".
5. `…\anh\v3a\b-gv10-p1.png` — Cô Linh: "Test chấm tuần này" = bài thi W2 SEP; lưới đủ 10 cột cho một cột W2 (V3A-1).
6. `…\anh\v3a\d-cv-gv10--ds.png` — Công việc tự mở "Nhập điểm · W1 JUL" (tuần thi, quá hạn 68 ngày) (V3A-1).
7. `…\anh\v3a\b-gv9-tatca-ft-p1.png` — GV S: "0/0 bài", "Quá hạn 49 · 1 lớp" vs khối 1 "0 · 2 lớp", "S: GV khác" (V3A-2).
8. `…\anh\v3a\f-gv9-cham-s-hop.png` — Chấm Speaking: "Người chấm: Chưa chọn", danh sách "chờ chấm" lẫn bài đã có điểm (V3A-2).
9. `…\anh\v3a\f-qt-lt-k1.png` — khối 1 QT: MB FT 101 năm dòng, "GV chấm" chỉ là danh sách tên (V3A-3).
10. `…\anh\v3a\f-gv10-hopW2.png` — hộp chấm FT (mẫu cho hộp chấm một mẫu): nhận xét bắt buộc trong hộp, thiếu hạn.
11. `…\anh\v3a\e-hv8-fou-qt-p1.png` — một môn trượt lớp thường 3 dáng trên một màn: khung đỏ · chip vàng · chip SOS (V3A-8).
12. `…\anh\v3a\d-cv-gv7-thuong.png` — việc "Nhập điểm · W3 SEP" mà lưới lẫn ô 27/40 thi W3 AUG (V3A-1 tình huống nhầm bài).
13. `…\anh\v3a\c-gv10-375-k1--mo.png` — 375 khối 1: dòng 6 dòng chữ (V3A-7).

Số đo: `…\scratchpad\do\v3a-cat.json` (cắt / đè), `…\scratchpad\do\v3a-bang.json` (căn bảng). Script: `…\scratchpad\chup\v3a-cat.mjs`, `v3a-lt.mjs` (ba khối + việc theo vai, chỉ GET), `v3a-api.mjs`.
