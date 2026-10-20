# 07 — Kế hoạch PR (CHƯA TRIỂN KHAI) · PISA Tracking overhaul UX/UI + workflow

> **Trạng thái (21/10): chủ SP đã trả lời 17/17 câu + đồng ý gói PTA tự quyết** ([02](02-conflict-decision-log.md) mục 5, 2.9) — kế hoạch đã cập nhật theo (luật 4 sửa, việc TVV + hạn, S chéo, "Cần làm", Chấm Test chờ mockup). **Việc tiếp: chủ SP duyệt plan cuối = merge PR #486 → GĐ0.** Không PR mã nào được mở / merge / deploy trước bước đó (master prompt I Giai đoạn 4–5).
> Người soạn: session planning "PTA Plan" (Opus 5.5), 21/10/2026. Thay **mục 8** (GĐ0–GĐ4) + 10.6 / 11.7 / 12.10 của tài liệu đánh giá — những mục đó giữ làm lịch sử.
> Bộ tài liệu: [00 mục lục](00-muc-luc.md) · [01 sổ góp ý](01-feedback-register.md) · [02 xung đột + quyết định + câu hỏi](02-conflict-decision-log.md) · [03 kiểm định](03-ux-ui-audit.md) · [04 hệ thiết kế](04-design-system.md) · [05 IA + workflow](05-ia-workflow.md) · [06 mockup ↔ web](06-mockup-gap.md) · **07 kế hoạch PR (tệp này)** · tài liệu đánh giá gốc [`2026-10-20-danh-gia-lai-ux-ui-toan-dien.md`](../2026-10-20-danh-gia-lai-ux-ui-toan-dien.md).

---

## 0. Đọc nhanh

- **Thứ tự lý do:** sửa cách làm + công cụ (để không lặp lỗi lệch mockup, lệch bảng) → sửa **số sai, lỗi chức năng, lệch luật đã chốt** (không đổi bố cục) → dựng **nền hệ thiết kế** một lần (chữ, màu điểm, trạng thái, bảng, ô điểm, ô số, panel, ô tuần) → **làm lại từng màn theo mockup mới đã duyệt**, mỗi màn một PR, chủ SP duyệt ảnh cặp → thống nhất chi tiết → chấm lại.
- **Trước deploy (GĐ1)** — chủ SP chọn **Q-E1 ①** (02): số liệu đúng · lỗi chức năng · lỗi bộ chọn tuần tự đóng · lịch thi "tháng = đã thi" · chữ Thi ↔ Test · luật 3 (gỡ khoá Progress) · **luật 4 sửa 21/10** (MT cũ "-" = huỷ ngay; "-" ghi muộn → dời tuần kế của lịch; đếm theo tuần; Khôi phục = được dời 2 lần; QL duyệt thêm = +1; Hoàn tác 10 s; không còn "Không dự thi") · **luật 5** (thu hồi / không tăng bậc qua QL — dùng mẫu thẻ duyệt sẵn có) · nền bảng + lưới điểm (BANG-0/1).
- **Việc TVV (luật 1–2) + 4 việc TVV 21/10** (Chốt ngày thi · Chọn bước tiếp hạn 1 tuần · Bổ sung hồ sơ thiếu · Cập nhật KQ thi thật chuyển từ GVCN — không hạn) cần màn mới nhỏ (khối việc TVV, form Báo PH) + **gán TVV cho học viên** → mockup trước → **GĐ1b** (deploy riêng, ngay sau GĐ1) — chủ SP chọn Q-E1 ① "cả gói, trừ việc TVV".
- **Không PR đổi bố cục nào merge khi chủ SP chưa duyệt ảnh cặp** (9.1-2). Session code được làm liên tục, kể cả xuyên đêm (Giai đoạn 5), nhưng PR đổi bố cục **đứng chờ duyệt**, không merge qua đêm; PR chỉ máy chủ / chữ / phép kiểm planning tự merge khi rà đạt + check xanh (bộ nhớ "Planning tự merge").

---

## 1. Giả định (nói rõ để chủ SP sửa nếu sai)

1. Mã nền = `main` hiện tại (đã có OV-14, OV-15a…i2, Tutor TU-a/b; **chưa deploy** — bản chính là deploy 18/10).
2. Một deploy chỉ sau khi chủ SP bảo, theo `DEPLOY_2026-10.md` / `TRIEN_KHAI.md`; trước deploy chủ SP còn gộp hồ sơ trùng + bổ sung 13 email + **gán TVV** (điều kiện luật 1).
3. Câu hỏi ở [02](02-conflict-decision-log.md) **đã trả lời 21/10 (17/17)**. Còn **Q-C1**: phần Chấm Test của M5 dừng ở bước mockup tới khi chủ SP duyệt; phần khác chạy.
4. Mọi số "bấm / đổi trang" trong tiêu chí lấy từ [03](03-ux-ui-audit.md) / [05](05-ia-workflow.md) và phụ lục; nghiệm thu đo lại trên bản demo seed theo ngày demo.
5. Model: Opus 5.5 (không Fable, mọi session / agent). PR giao diện: `/ponytail lite` đầu phiên; lệnh impeccable `clarify` / `layout` / `harden` / `adapt` trong phạm vi PR; `audit` + skill `web-design-guidelines` trước khi mở PR; `/ponytail-review` trước PR.

---

## 2. Cổng chung cho mọi PR

| Loại PR | Trước khi code | Trước khi mở PR | Merge |
|---|---|---|---|
| **Tài liệu** (Rulebook, thuật ngữ, mockup, CLAUDE / DESIGN / plan) | — | planning rà | planning tự merge (chủ SP đã duyệt nội dung) |
| **Máy chủ / dữ liệu / phép kiểm** (không đổi giao diện) | đặc tả trong 05 | `npm run check` xanh + phép kiểm mới đỏ trước / xanh sau | planning tự merge khi rà đạt; rà sâu (plan.md 1.3) nếu chạm quyền / dữ liệu |
| **Giao diện không đổi bố cục** (chữ, điều kiện hiện nút, sửa lỗi) | — | check xanh + bấm thử một lần + ảnh trước / sau | planning tự merge khi rà đạt |
| **Giao diện đổi bố cục / màn mới / thành phần mới** | **mockup HTML 1440 tối + 375 sáng, đủ trạng thái, chủ SP duyệt** (CLAUDE.md) + **bảng truy vết khung → thành phần → ảnh** (có dòng BỎ / GIỮ) | ảnh cặp toàn trang mockup \| web cùng vai, cùng dữ liệu · **≥ 90 % KHỚP** (KHÁC chỉ khi có lý do chủ SP đồng ý) · `do-khung` + `do-bang` xanh · chiều cao trang trong ngân sách | **chủ SP duyệt ảnh cặp / bản chạy** → merge (không qua đêm) |

Kiểm thử hồi quy mọi PR: `npm run check` (≤ 3 lần chạy song song trên máy) · phép kiểm hành vi thay phép kiểm đọc chuỗi mã khi chạm tệp đó (11.1a R6) · bấm thử luồng thật của **mỗi vai bị ảnh hưởng** một lần ở session code · ảnh trước / sau.
Rà sâu ECC (chỉ khi kế hoạch ghi): quyền / đăng nhập → `ecc:security-reviewer`; dữ liệu / migrate / API → `ecc:silent-failure-hunter`; React lớn → `ecc:react-reviewer`; tối đa 2.

---

## 3. GĐ0 — Cách làm + công cụ + dữ liệu (trước mọi PR giao diện)

| PR | Phạm vi | Phụ thuộc | Tiêu chí nghiệm thu | Rủi ro |
|---|---|---|---|---|
| **TL-QT** (tài liệu) | Ghi vào CLAUDE.md / plan.md / DESIGN.md / mẫu rà 10B: khung đã duyệt thắng kế hoạch + luật cũ (trừ nghiệp vụ, quyền, chống mất dữ liệu) · một màn một PR · bảng truy vết · ảnh cặp + cổng 90 % · chủ SP duyệt trước merge PR đổi bố cục · **5 luật nghiệp vụ đã chốt** (Phần II + luật 5 ngày 21/10; **luật 4 bản sửa 21/10**) + 2 luật mới 21/10 (việc TVV + hạn; S chéo theo kỹ năng hồ sơ GV) · luật mới: Thi / Test, "việc của tôi ở trang đầu vai", một danh sách một kiểu mở, thang làm tại chỗ 0–5, ô số / ⓘ / "›", báo cáo thuần, cấm điều khiển trong tiêu đề bảng, "Toàn bộ" chỉ ở Phân tích | chủ SP duyệt plan cuối | mỗi luật một dòng, dẫn nguồn quyết định; CLAUDE.md vẫn ngắn (chi tiết ở DESIGN / plan) | thấp |
| **TL-LUAT** (tài liệu) | Sửa chữ **Rulebook** (16 chỗ v4b + 3 chỗ v3a: hạn lớp thường T4, nhận xét MT bắt buộc OV-12b, PR-LT3 đã có, dời lịch môn chỉ QL…) + luật 1–5 (**luật 4 bản sửa 21/10**: MT cũ "-" = huỷ ngay, đếm theo tuần, Khôi phục = được dời 2 lần, duyệt thêm = +1) + **việc TVV 21/10** (4 việc, hạn) + **S chéo theo kỹ năng hồ sơ GV** · **bảng thuật ngữ** (Thi ↔ Test: C-028, C-035, C-036…) · đánh dấu mockup hết hiệu lực / sửa (06): mockup 6 khung 10, ba khối 06/10, mockup 2 khung 1a / 1d, mockup 3 khung 3, mockup 5 khung 1 / 2 | TL-QT | so từng dòng với mã đã dẫn (v4b Phần A); không đổi luật nào ngoài 5 luật đã chốt + quyết định 21/10 (02 mục 2.9) | thấp |
| **SEED-UX** | Dữ liệu demo theo **ngày demo**: buổi tutor trong 4 tuần trước ngày demo, thi thật có kết quả, em "Đã thi · chờ KQ", em B "chưa chốt ngày thi", **gán TVV** cho đa số em, lần xử lý vi phạm có / chưa báo PH, MT cũ có "-", lớp thường Progress "Đủ điểm" | — | mọi khung mockup có dữ liệu để chụp; X11 hết | thấp (chỉ seed demo) |
| **CONG-CU** | `scripts/do-bang.mjs` (lệch tiêu đề ↔ ô ≤ 2 px, đường cơ sở ≤ 2 px, cao hàng 44 / 64, **đè nhau** > 2 px, cỡ chữ ∈ thang; 1 440 / 1 280 / 375; bỏ miễn đo lưới chấm) gắn vào `do-khung` · **cảnh báo esbuild = lỗi** trong `npm run check` (+ `no-duplicate-case`) · phép kiểm "bấm trong lịch không đóng hộp cha" cho mọi hộp có ô ngày · script ảnh cặp mockup \| web toàn trang | — | chạy trên main hiện tại ra **đỏ đúng chỗ đã biết** (lưới MT, ô tổng lớp thường, `case` trùng `yt_xem`, `BoChonThoiGian`) | thấp |

---

## 4. GĐ1 — Sửa số sai, lỗi chức năng, lệch luật đã chốt (KHÔNG đổi bố cục) — đề xuất làm **trước deploy**

| PR | Phạm vi (mã vấn đề) | Phụ thuộc | Tiêu chí nghiệm thu | Rủi ro dữ liệu / nghiệp vụ |
|---|---|---|---|---|
| **SL1 — số liệu đúng** | A5-01 "Theo tháng" ra tháng trước: **bỏ 3 kiểu thừa** trong hộp thời gian (chỉ Từ tuần – Đến tuần) + đọc link cũ `kieu=thang` đúng tháng · A7-02 "PA có kết quả trong kỳ" · A7-01 Chờ duyệt theo chi nhánh đang lọc (9.1-4, 02 X-03) · A1-01 số "nháy" · A7-05 chuông · A7-14 làm mới sau Duyệt nhiều · A3-02 / A7-09 đếm trước khi chia trang · CV-01 / A7-10 · `luotMacDinh` theo ô quá hạn của người xem (V2B-3) · dải đếm Lịch thi cộng sai (V2A-06) · 2 lệch phạm vi xuất (V3B-07) · **(v4d, FB-4-36) chuông bước 1 = N1 (05 mục 2.7):** 3 loại tự động vào Cần làm (A1-04) · thông báo "SOS n" của GVCN (`kind sos` + lượt) sang Để biết (nay kẹt Cần làm) · một Case một dòng · số trên nút = Cần làm còn mở (9.2-4) · dòng có hạn, sắp theo hạn · tiêu đề nhóm không IN HOA · Case tạo tay cho người khác → chuông người phụ trách (02 4.7 C23) | CONG-CU | phép kiểm 12 tháng 2026; "số trên trang = số dòng panel" cho mọi số còn bấm; "cùng chỉ số hai tab = cùng tập"; chuông GV 7: 5 "Quá hạn chấm" + Case quá hạn ở Cần làm, 0 dòng "SOS n" ở Cần làm; QL 2: 6 "Chốt lộ trình" ở Cần làm | không đổi dữ liệu |
| **SL2 — một phạm vi một trang** | 9.1-4: công tắc chương trình áp cả Tổng quan (bỏ "gộp hai khung"); một định nghĩa "SOS hiện tại"; đơn vị + phạm vi cạnh số | SL1 | bảng số liệu a7 §2.1 hết cặp lệch không nhãn | không |
| **CV-LOI — Công việc chạy đúng** | CV-03, CV-05, CV-07, CV-08, CV-09, CV-10, CV-14, A1-14, A1-15, A5-08 · **`case` trùng `yt_xem`** (Ghi nhận một em làm tại chỗ — 11.1e) · **"Phân công…" sai case + Case không gán chủ khi phân công** (V4A, ảnh v4-2) · **lưới CSS `WorkList.tsx:148` làm cột tiêu đề 0 px** (V4A, ảnh v4-3) · "Xếp lại bài vắng" hiện cho GVCN mà máy chủ 403 (V4B) · ẩn Dán Excel ở panel việc (12.3) · **(v4d) "+ Case cho {kỹ năng}" ở hồ sơ HV chọn sẵn kỹ năng** (nay mở form trống kỹ năng — `StudentDetailPage.tsx:334`, 02 X-74) | CONG-CU | bấm thử các trạng thái sau lưu trên demo riêng; ảnh trước / sau ảnh v4-2, v4-3; phép kiểm "nút chỉ hiện khi máy chủ cho" | phân công: kiểm trước bằng lệnh chỉ đọc Case nào đang thiếu chủ |
| **KHUNG-LOI — khung không vỡ** | A1-05 thanh trên + 375 ≤ 5 · B-02 vùng bấm số · B-05 focus bị che · B-09 menu tài khoản 375 · B-08 tương phản · TST-05 chú giải màu · A1-07 tiêu đề = tên menu · A1-09 · **hook "bấm ra ngoài" dùng chung** (thay 15 bản tự viết) + **vá `BoChonThoiGian` tự đóng** (12.7, V3B-09) · menu ⋯ hồ sơ HV mất focus (V4C) | CONG-CU | `do-khung` xanh ở 1 100 / 1 280 / 1 440 / 375; phép kiểm hộp có ô ngày; bấm ‹ › trong lịch ở Phân tích / Tutor / Bộ lọc thêm chọn được tuần | không |
| **LT-SV — lịch thi thật (máy chủ)** | `trangThaiLichThi` một hàm (A "đã chốt ngày" / B "chưa chốt ngày") · bỏ "tháng (và tuần) = ngày thi" ở `ngayThiSauThi`, cận dưới `thiThat.ts`, `profile.ts:802` · việc "Chốt ngày thi" **không hạn** · nhận ngày đã qua · "Sắp tới" hồ sơ HV gồm kỳ thi thật · một hàm nhãn | Q-C3 ①, Q-C4 ① (đã trả lời 21/10) | phép kiểm bảng trạng thái (tháng trước / này / sau, có / không ngày, tuần, ngày đã qua); lệnh chỉ đọc liệt kê lộ trình đang "Đã thi" chỉ nhờ tháng trước khi đổi | **dữ liệu**: em đang "Đã thi · chờ KQ" chỉ nhờ tháng sẽ về B — báo chủ SP danh sách trước khi merge |
| **CHU-THI — chữ** | ~295 chuỗi "thi" → "Test" / "làm bài" (11.1d) + "Thời gian" + "Ghi chú" + nhãn "MT2 · thi W2 SEP · hạn T4 16/09" (12.2) + "chấm chéo" thay "GV khác" + luật đếm ô quá hạn theo phạm vi (V3A-2) · EN · Hướng dẫn · tên cột tệp xuất | TL-LUAT (thuật ngữ) | phép kiểm chặn chữ cũ trong tệp Test (trừ danh sách thi thật); bấm thử Lịch Test GV S | không |
| **LUAT-34 — sửa sau lưu + "-" MT (máy chủ + chữ)** | **Luật 3**: gỡ R11 cho GVBM đúng ô (FT, lớp thường, MT cũ 7 ngày) — ảnh v4-4; **lớp đã kết thúc giữ chỉ QL sửa điểm, H21 giữ "Mở lại"** (Q-B1 ①); chip "Đã hoàn tất" → "Đủ điểm"; "Khôi phục điểm" một bấm; "Huỷ điểm" không xoá nhận xét / nhóm nguyên nhân; nới tutor sửa nhận xét quá 24 h (4.7 A19) · **Luật 4 sửa 21/10** (02 mục 2.9): MT hiện tại "-" lần 1 → dời tuần kế (không dời được → thẻ "Dời lịch Test" gửi QL), **đếm theo tuần** (sửa / gõ lại "-" trong cùng tuần không tính), lần 2 ("-" ở tuần đã dời tới) → huỷ; "-" ghi muộn (sau tuần thi, < 2 tuần) → tuần kế **của lịch** nếu còn thi được, không thì thẻ QL; **MT cũ (≥ 2 tuần) "-" → huỷ ngay**; QL **Khôi phục** → chuỗi đặt lại, được dời 2 lần; QL **duyệt thẻ dời → +1 lần**, vắng tiếp → huỷ; **Hoàn tác 10 s** sau "-", sau đó người có quyền sửa ô khôi phục được (lịch sử + chuông QL "để biết"); nút "Vắng" (không còn "Không dự thi"); lớp thường không đổi | TL-LUAT; luật 4 sửa 21/10 (đã trả lời) | **một bảng chuyển trạng thái → một test** (`mtTrangThai.tests.ts`, **31 dòng T01–T31** — 05 mục 4.3, 13 trạng thái; dòng lệch đỏ trước khi sửa); hàm thuần `chuyenVang` 12 ca ngày + ca 21/10 (đếm theo tuần, MT cũ huỷ ngay, sau Khôi phục được dời 2 lần, sau duyệt +1, Hoàn tác 10 s); lịch sử "ai · lúc · cũ → mới" cho mọi sửa | **dữ liệu**: không migrate; ô "Không dự thi" cũ giữ bản ghi — ở MT cũ **hiện "Đã huỷ"** (khôi phục được), liệt kê cho QL trước merge; rà sâu `ecc:silent-failure-hunter` |
| **LUAT-5 — thu hồi / không tăng bậc (máy chủ + nút theo mẫu sẵn có)** | Luật 5: "Thu hồi…" thay "Xoá lần xử lý" của GVCN (`xuLy.ts:622-638`) → thẻ Chờ duyệt loại Ý thức, **lý do bắt buộc**; "xử lý không tăng bậc" qua đường "Đề xuất QL duyệt" sẵn có; thu hồi được duyệt = trạng thái "Đã thu hồi" (giữ dòng + lịch sử, không xoá vật lý); QL thu hồi thẳng có lý do (nhật ký); không Hoàn tác sau lưu xử lý (02 4.7 B15) | TL-LUAT; Q-D1 ① (đã trả lời — chỉ ảnh hưởng GĐ1b) | phép kiểm: GVCN không còn đường xoá thẳng; thẻ duyệt có lý do; lịch sử đủ; bấm thử GVCN → QL duyệt / từ chối | **dữ liệu**: thôi xoá vật lý; rà sâu `ecc:silent-failure-hunter` |
| **BANG-0 + BANG-1** (trong gói Q-E1 ① — chủ SP chọn 21/10) | xem NEN-BANG (§6) + lưới điểm 6 lối vào (hồ sơ lớp, panel Nhập điểm, Lịch Test, Công việc, `/nhap-diem`, Điểm theo lớp) + lưới lớp thường | CONG-CU, NEN-TYPO-MAU (thang chữ) | `do-bang` xanh trên mọi lối lưới; ảnh cặp mockup 6 khung 3 ≥ 90 %; chủ SP duyệt bảng mẫu | viết lại ~40 phép kiểm đọc chuỗi |
| **CASE-NHIEU — Tạo Case nhiều kỹ năng (máy chủ + panel theo mẫu sẵn có)** (v4d, FB-4-35 — yêu cầu đã chốt 21/10) | Máy chủ: `POST /cases/report` nhận nhiều kỹ năng, gọi thân `reportIssue` n lần trong **một giao dịch** (tất cả hoặc không), khoá chống gửi đôi theo lô + kỹ năng; `case-topics` trả thêm Case đang mở + người phụ trách theo kỹ năng. Panel `QuickReport`: chip kỹ năng chọn nhiều, phần chung một lần (em, mức độ, tuần, bằng chứng gắn mọi Case), một khối mỗi kỹ năng (nguyên nhân, tên, mô tả, "phụ trách: …") bằng `Khoi` / `Truong` sẵn có; trùng / chờ xác nhận báo ngay khi chọn chip; một kỹ năng = y như nay; ghi bù giữ một kỹ năng (05 mục 7.1b) | CONG-CU; "+ Case cho" (CV-LOI) | `caseLo.tests.ts` (2 kỹ năng → 2 Case đúng người phụ trách + hạn; trùng "Ghi vào" → 1 mới + 1 ghi thêm; chờ xác nhận / một thẻ sai → 0 Case; gửi lại không trùng; ngoài lớp 403; tệp gắn đủ); bấm thử GV 7 (L + R), GVCN 10 (W2 + S); ảnh trước / sau 1440 + 375 — một kỹ năng giống hệt nay. Loại PR: giao diện **không đổi bố cục** (thêm ô theo mẫu sẵn có — CLAUDE.md, plan.md 1.3b); nếu PTA Plan coi khối mỗi kỹ năng là đổi bố cục → vẽ một khung mockup (1440 tối + 375 sáng, 5 trạng thái) trước | thấp — không đổi luật Case, không migrate; **không chặn deploy** (ngoài gói Q-E1 ①; chạy song song) |

**Thứ tự GĐ1:** CONG-CU → (SL1 ∥ CV-LOI ∥ KHUNG-LOI) → SL2 → (LT-SV ∥ LUAT-34 ∥ LUAT-5 — câu biên đã trả lời 21/10) → CHU-THI (sau TL-LUAT) → NEN-TYPO-MAU → BANG-0 → BANG-1 → **deploy** (khi chủ SP bảo). Gói Q-E1 ① chủ SP đã chọn (21/10) — giữ đủ. **CASE-NHIEU** (v4d) chạy song song bất kỳ lúc nào sau CONG-CU + CV-LOI, không chặn deploy.

---

## 5. GĐ1b — Việc TVV (luật 1, 2 + 4 việc TVV 21/10) — deploy riêng, ngay sau GĐ1

| PR | Phạm vi | Phụ thuộc | Tiêu chí nghiệm thu | Rủi ro |
|---|---|---|---|---|
| **DATA-TVV** (vận hành, không mã) | Chủ SP / QL **gán TVV** cho học viên đang học (bản chính hầu như chưa gán) — lệnh chỉ đọc đếm trước: số em có / chưa TVV theo chi nhánh | — | ≥ 95 % em đang học có TVV, hoặc chủ SP chấp nhận việc về QL | việc rơi về QL nếu thiếu |
| **SV-YT-TVV** (máy chủ) | Luật 1–2: mỗi lần **lưu xử lý** (GVCN hoặc QL, một em / lô) → một việc "Báo PH · {bậc} · {em}" cho TVV phụ trách em (không có TVV → QL chi nhánh), **sinh ngay khi lưu kể cả lần xử lý đang chờ QL duyệt** · hạn 5 ngày lịch (ngày lưu + 4, hết 23:59 giờ VN — 02) · lưu kết quả báo PH gắn lần xử lý · quyền TVV mới · chuông · `/lich-su` loại Ý thức · biên: QL từ chối / thu hồi được duyệt → Q-D1 ① (chưa ghi tự huỷ kèm lý do; đã ghi giữ + nhãn + chuông) · không có TVV → QL chi nhánh, TVV được "Kết thúc · không liên hệ được" (Q-D3 ①) · không sinh cho lần xử lý trước ngày bật | DATA-TVV; Q-D1 ①, Q-D3 ① (đã trả lời) | test K1–K12 (v4b); hạn T7 / CN; QL từ chối; TVV đổi | **quyền mới** → rà sâu `ecc:security-reviewer` |
| **SV-TVV-VIEC** (máy chủ — luật 21/10, Q-A3) | 4 việc TVV, **một người giữ = TVV của em** (không có → QL chi nhánh — Q-D3 ①): **Chốt ngày thi** (không hạn; theo `trangThaiLichThi` của LT-SV) · **Chọn bước tiếp sau thi** (hạn 1 tuần từ khi có KQ thi thật — giữ hạn `buoc_tiep` = ngày có kết quả + 7; bỏ "của tôi" cho QL + mọi TVV chi nhánh) · **Bổ sung hồ sơ thiếu** (không hạn; `missingForStudent` 7 → 4 trường: Ngày sinh · Email · Tuần bắt đầu · Target FT — Q-D4 ①; một dòng tổng) · **Cập nhật kết quả thi thật** (chuyển **GVCN lớp cuối → TVV**, **bỏ hạn** đang có; sửa câu hướng dẫn "hạn 4 tuần" `mywork.ts:220-224`). "Báo PH kết quả Test lớp thường" **giữ GVCN** (không chuyển) | DATA-TVV; LT-SV | phép kiểm: mỗi việc đúng 1 người giữ (TVV của em / QL khi thiếu TVV); KQ thi thật không hạn, không vào số / chuông quá hạn; Bước tiếp quá hạn sau 7 ngày kể từ ngày có kết quả; GVCN không còn việc KQ thi thật; "Thiếu" chỉ đếm 4 trường | **dữ liệu**: việc KQ thi thật đang mở của GVCN chuyển sang TVV — lệnh chỉ đọc liệt kê trước; số "Thiếu n" ở HV & Lớp đổi (46/51 em → đếm lại); rà sâu `ecc:security-reviewer` |
| **UI-YT-TVV** (giao diện — **mockup trước**) | Khối "Việc của bạn" ở trang đầu TVV (Q-A1 ①: Tổng quan TVV, **không** thêm menu Công việc) + form Báo PH (4 ô, SĐT bấm gọi, "Kết thúc · không liên hệ được" — Q-D3 ①) · dòng trạng thái báo PH trong ô "Thang" (Ý thức lớp / HV) · **4 việc TVV 21/10** cùng hàng đợi: Chốt ngày thi · Chọn bước tiếp (hạn 1 tuần) · Bổ sung hồ sơ thiếu · Cập nhật kết quả thi thật (không hạn) | SV-YT-TVV, SV-TVV-VIEC, LUAT-5 (GĐ1), mockup duyệt | ảnh cặp ≥ 90 %; bấm thử TVV / GVCN / QL | thấp |

---

## 6. NEN — Nền hệ thiết kế (một lần, trước GĐ2) — chi tiết ở [04](04-design-system.md)

Mỗi PR nền có **sân mẫu `/dev/thanh-phan`**; chủ SP duyệt **một lần** bảng mẫu (câu ở 02) — các PR màn sau chỉ cần ảnh cặp.

| PR | Phạm vi | Tiêu chí nghiệm thu |
|---|---|---|
| **NEN-TYPO-MAU** | thang chữ 12·13·14·15·17·22·28 (ô bảng 15, lưới điểm 14, nhãn 13, tối thiểu 12; không in hoa; line-height Việt) · 3 token kết quả `--kq-vuot / --kq-bang / --kq-duoi` (tô chính con số, ✓ / ✗ trước số) · hệ trạng thái HTT (hover chỉ cho thứ bấm được · đang chọn = nền nhấn nhạt + vạch trái 3 px · focus vòng 2 px · đang lưu / đã lưu / lỗi / Hoàn tác một cách báo) · thứ tự menu + thanh trên < 1 440 + thanh dưới 375 ≤ 5 nút | phép kiểm chặn chữ < 12 px, cỡ ngoài thang, màu điểm ngoài token; tương phản ≥ 4,5 : 1 trên 9 nền; mù màu ΔE ≥ 10 |
| **NEN-BANG** (= BANG-0) | `Bang` + 13 kiểu cột (căn tiêu đề = căn ô; cột px; hàng 44 / 64; đường cơ sở; công cụ ngoài khung; nhóm 2 tầng; cấm điều khiển trong tiêu đề; 375 thành thẻ) · `ODiem` (đọc / sửa / `ti-le` "✗ 17/25" / lớn) · bỏ luật `index.css:267` | phép kiểm BANG-1…5 + `do-bang` xanh trên bảng mẫu |
| **NEN-SO-PANEL** | `OSo` (ô số bấm được; ô số = mở tại chỗ / panel · chữ "›" = đổi trang · ⓘ = giải thích; bỏ gạch chấm chấm) · vỏ **"Khung việc"** (khuôn panel 6 phần) · `PanelChiSo` (A thông tin / C thông tin + thao tác) · hộp nhỏ · mở rộng dưới hàng · luật **một danh sách một kiểu mở** | "số trên trang = số dòng panel"; panel trên URL (Quay lại mở lại đúng dòng); không panel chồng |
| **NEN-TUAN** | `Khoảng tuần` (hai ô tuần, đổi là áp dụng, không hộp, ‹ › dời cả khoảng, "Mặc định") + dáng một tuần · **"Toàn bộ" chỉ ở Phân tích** · ô tháng thi / ngày thi riêng (không thay bằng ô tuần) · bỏ hàng nút "Tuần này · Tuần trước" (luật 06/10) | phép kiểm chọn ngược tự đổi chỗ, khác năm, > 52 tuần; URL giữ khoảng |

---

## 7. GĐ2 — Làm lại từng màn (mỗi màn một PR; PR máy chủ của màn đi trước)

Trước GĐ2: **PR tài liệu MOCKUP** — vẽ mockup mới / sửa mockup cũ theo [06](06-mockup-gap.md) (1440 tối + 375 sáng, đủ trạng thái), chủ SP duyệt từng màn. Song song tối đa **2 PR giao diện khác màn**.

| Thứ tự | PR máy chủ đi trước | PR màn | Nội dung chính (dẫn 05) | Mockup |
|---|---|---|---|---|
| M0 | — | **Khung trang** | đầu trang một hàng · dải lọc dính · `Khoảng tuần` vào dải · thanh trên / dưới | m1 2a / 2b + mới |
| M1 | SV-M1: hàng đợi "Cần bạn quyết" một nguồn | **Tổng quan** (QL / QT + TVV / CX / Admin VP / Head tutor) | bố cục **B** (Q-A2 ①: một hàng đợi trái / chi tiết phải, Chờ duyệt nhóm đầu) · bỏ dải "HV cần chú ý" · bỏ Trễ chấm (đã chốt) · Lớp cần chú ý mở rộng hàng (SOS, Thêm PA tại chỗ) · "Tuần này" một hàng · **việc của tôi ở trang đầu vai** (TVV / CX / Admin / Head tutor dùng cùng thành phần) | mới |
| M2 | SV-M2: **`hangCham` một nguồn** cho Công việc + Test · **giữ luật S chéo 21/10** (Q-C1): nhóm "Chấm Speaking chéo" đọc `lopFtChoGvSpeaking` — mã **đã** gồm GV có kỹ năng S trong hồ sơ, kể cả không dạy lớp nào, phạm vi chi nhánh (OV-14c, `server/src/permissions.ts:281-297`) → **không cần PR máy chủ riêng**; thêm phép kiểm "GV S 0 lớp thấy nhóm S chéo trong `hangCham`", `prOv14c` OV14c-2 / OV14c-10 phải còn xanh · (v4d) `GET /notifications` trả khối Cần làm từ **cùng hàm hàng đợi trang đầu**; bỏ `thongBaoTuDong.ts` | **Công việc** | danh sách phương án A (dòng 3 vùng: Hạn · Việc + đối tượng · ›), nhóm cố định theo vai, gom nợ cũ một dòng · khung phải "Khung việc" · phân vai với Tổng quan (Công việc QL / QT / Admin = theo dõi việc GV, giao việc, lịch sử duyệt) · **(v4d, FB-4-36) chuông = hộp "Nhắc việc" N2** (05 mục 2.7): Cần làm ≤ 8 dòng `DongViec` cùng thứ tự trang đầu + "Xem đủ ›", số trên nút = số dòng đó, Để biết = tin một chiều; không tự bật khi đăng nhập | mới (+ khung hộp chuông 1440 / 375) |
| M3 | — | **Hồ sơ lớp** | lưới Điểm Test gập + Nhập điểm cuộn + mở tại chỗ (đã chốt) · `Bang` cho mọi bảng · Ý thức & Phối hợp phương án A (một bảng theo em, mặc định "Cần làm") · 12 chỗ "đã có trên trang thì làm tại đó" (11.1c) | m1 khung 4, m6 khung 2 (sửa) |
| M3b | SV-YT (đã ở GĐ1b) | **Hồ sơ HV** | Ý thức cùng ngôn ngữ, mật độ một em · chip lịch thi A / B đầu dòng 2 · Hành trình một lần (V4C) · lịch sử / khôi phục | mới |
| M4 | LT-SV (GĐ1) | **Học viên & Lớp** | góc "Cần làm" thành **bộ lọc trong bảng Tất cả, giữ tên "Cần làm"** (Q-A4 21/10 — cột Việc · Người phụ trách · Hạn, quá hạn trước, cùng hàm đếm với Công việc) + chip "⚠ n quá hạn" trên hàng lớp · Lịch thi theo trạng thái (2 nút Chốt ngày · Dời tháng; Q-C3 ①; bỏ "Cần xác nhận" → "Chưa kết luận" — Q-C4 ①) · cột "Thi thật" · panel Xuất chọn em (Q-E2 ①) · Đang SOS mockup 6 khung 1 · hàng em một dòng | m1 khung 3, m5 (sửa), m6 khung 1 |
| M5 | SV-M2 (dùng chung) | **Test** | **Chấm Test theo hạn — mockup trước, chủ SP duyệt** (Q-C1 21/10: "vẽ mockup cho lựa chọn 1, tôi xem xong sẽ duyệt"; phần chấm chờ duyệt, phần khác của M5 không chờ) (giữ luật chia khối) + nhóm "Chấm Speaking chéo" cho **mọi GV có kỹ năng S, kể cả không dạy lớp nào** (21/10) · **Tình trạng chấm** cho QL / QT · **hộp chấm một mẫu** (FT + lớp thường, nhận xét tuỳ chọn trong hộp — đã chốt; bỏ ⋯ trong ô) · lưới gọn (cột của tôi) · Dán Excel duy nhất ở lưới theo lượt (đã chốt) · Kế hoạch Test mockup 4 · MT **một hộp một đợt** + Khôi phục điểm · gộp 2 panel xuất | **mới: Chấm Test theo hạn — vẽ đầu tiên (chủ SP chờ)**; m2 1a / 1d (sửa), m4; ba khối 06/10 hết hiệu lực khi mockup mới được duyệt |
| M6 | SV-M6: nguồn panel trả cột theo loại số · "chấm trễ trong kỳ" (Q-C2 ① đã duyệt) · "Theo chi nhánh" · "Vấn đề & PA" · mọi xuất qua máy chủ + nhật ký + từ điển cột · "Toàn bộ" (`tu` rỗng + trả khoảng thật) | **Phân tích** | Báo cáo làm lại theo mockup 3 khung 3 (đã sửa) + nút **Chiếu** · `PanelChiSo` cho mọi số (luật L1) · báo cáo thuần (bỏ cột việc) · Ý thức Y1 · "Vấn đề & PA" · xuất E1 · thời gian "Toàn bộ" + "Chọn khoảng tuần", mặc định theo bảng | m3 khung 3 (sửa), 4, 4c; mới cho panel C / Chiếu |
| M7 | (dữ liệu tutor thật / SEED-UX) | **Tutor + Quản trị + Hồ sơ GV** | Tutor F1 (khối "Việc của bạn", 3 chip, "Lọc ▾") + B1 (cột "Kết luận / lý do") · 375 theo m7 · Quản trị / Hồ sơ GV dùng `Bang` | mockup tutor (sửa) |

**Tiêu chí chung mỗi màn:** bảng truy vết đủ dòng (kể cả BỎ) · ảnh cặp toàn trang 1440 tối + 375 sáng ≥ 90 % · `do-khung` + `do-bang` xanh · chiều cao trang trong ngân sách (05) · số bước của các việc chính ≤ số "Sau" ở 05 (đếm lại trên demo) · "số trên trang = số dòng panel" · chủ SP "đạt" trên PR.

---

## 8. GĐ3 — Thống nhất chi tiết · GĐ4 — Chấm lại

- **GĐ3:** đổi hết bảng còn lại sang `Bang` (danh sách miễn của BANG-2 / BANG-3 về 0) · thuật ngữ toàn web + Hướng dẫn + sổ tay PDF + EN · 375 (bảng → thẻ ở Kế hoạch Test, Quản trị, Vận hành) · xoá thành phần cũ (`SoLieuO`, `NganDanhSach`, `BoChonThoiGian`, 7 kiểu ô điểm…).
- **GĐ4:** chấm lại cùng phương pháp đợt 20/10 (Nielsen theo khu vực, đo chiều cao trang, vùng bấm, bảng số liệu, % khớp mockup, ma trận trạng thái). Chỉ khi **≥ 35/40** và không còn cặp số lệch không nhãn mới ghi "đạt".

---

## 9. Sơ đồ phụ thuộc (rút gọn)

```
TL-QT → TL-LUAT → CHU-THI
CONG-CU → SL1 → SL2
        → CV-LOI, KHUNG-LOI
        → CV-LOI → CASE-NHIEU (v4d, không chặn deploy)
câu trả lời 21/10 (02 mục 5, 2.9) → LT-SV, LUAT-34 (luật 4 sửa), LUAT-5
NEN-TYPO-MAU → NEN-BANG (= BANG-0) → BANG-1
[deploy GĐ1]
DATA-TVV → SV-YT-TVV + SV-TVV-VIEC → (mockup) UI-YT-TVV → [deploy GĐ1b]
NEN-BANG → M3, M5 …
            → NEN-SO-PANEL → M1, M2, M6
            → NEN-TUAN → M0 → mọi màn
MOCKUP (từng màn, chủ SP duyệt; Chấm Test theo hạn vẽ trước) → M0 → M1 → M2 → M3 → M3b → M4 → M5 → M6 → M7 → GĐ3 → GĐ4
```

---

## 10. Rủi ro chính + cách giữ an toàn

| Rủi ro | Nơi | Giữ an toàn |
|---|---|---|
| Đổi trạng thái lịch thi làm em "Đã thi" quay về "chưa chốt ngày" | LT-SV | lệnh chỉ đọc liệt kê trước; chủ SP xem danh sách trước merge |
| Luật 4 sửa 21/10 đổi ý nghĩa "-" (MT cũ "-" = huỷ ngay) | LUAT-34 | không migrate; "Không dự thi" cũ giữ bản ghi (MT cũ hiện "Đã huỷ") + liệt kê; Hoàn tác 10 s + khôi phục có lịch sử; một bảng chuyển trạng thái = một test (31 dòng) |
| Việc "Cập nhật kết quả thi thật" chuyển GVCN → TVV | SV-TVV-VIEC | lệnh chỉ đọc liệt kê việc đang mở trước merge; em chưa có TVV → QL (không rơi việc) |
| Gỡ khoá R11 → GV sửa điểm sau "đủ điểm" | LUAT-34 | lịch sử bắt buộc; SOS / Case tự tính lại đã có (QL vẫn sửa được) — phép kiểm hệ quả |
| Quyền mới của TVV, QL nhập thay (nếu duyệt) | SV-YT-TVV, M1 | rà sâu `ecc:security-reviewer`; quyền máy chủ đi cùng giao diện theo vai |
| Việc TVV rơi về QL vì chưa gán TVV | GĐ1b | DATA-TVV trước khi bật |
| Lặp lỗi lệch mockup | mọi màn | bảng truy vết + ảnh cặp + cổng 90 % + chủ SP duyệt (06) |
| Lặp lỗi lệch bảng | mọi bảng | `Bang` + phép kiểm tĩnh + `do-bang` trong check / do-khung |
| "Toàn bộ" chậm (> 52 tuần) | SV-M6 | đo trên DB lớn nhất; chậm thì kẹp + ghi nhãn (02) |
| Phép kiểm đọc chuỗi mã vỡ hàng loạt khi dựng lại | BANG-1, M* | viết lại theo hành vi trong cùng PR |

---

## 11. Việc chủ SP cần làm để kế hoạch chạy

1. ✓ (21/10) Đã trả lời 17/17 câu **PHẢI HỎI** + **đồng ý cả gói PTA tự quyết** ([02](02-conflict-decision-log.md) mục 5, 2.9).
2. **Duyệt plan cuối = merge PR #486** → bắt đầu GĐ0. Duyệt **mockup Chấm Test theo hạn** (Q-C1) khi PTA vẽ xong.
3. Cung cấp ảnh / dữ liệu còn thiếu ([03](03-ux-ui-audit.md) mục 5): đường đau MT đã gặp (4 ảnh) · "báo trễ" ở bảng Ý thức · số liệu bản chính (em có TVV, lần xử lý / tuần, ô "Không dự thi", SĐT phụ huynh) · số tutor / buổi thật.
4. Gán TVV cho học viên (trước GĐ1b); gộp hồ sơ trùng + 13 email (trước deploy).
5. Duyệt mockup từng màn + bảng mẫu `/dev/thanh-phan` một lần + ảnh cặp từng PR đổi bố cục.
