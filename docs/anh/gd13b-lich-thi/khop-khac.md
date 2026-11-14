# GD-13b · Học viên & Lớp — tab Lịch thi · khớp / khác mockup ⑥

Nguồn: `12-plan-giao-dien-dot-3.md` dòng GD-13b · mockup `thiet-ke/v21/hoc-vien-lop.html` (K4, K5, K8b) + `hoc-vien-lop-ghi-chu.md` · lời 35 / 37 / 38 / 40 / 42 · luật V22.
Ảnh TRƯỚC (web main trước PR, seed): `truoc-k4-tvv-1440-toi.png` · `truoc-k4-ql-1440-toi.png` · `truoc-k5-gv-1440-toi.png` · `truoc-k8b-tvv-375-sang.png`.
Ảnh cặp mockup │ web (sau): `cap-*.png`. Tài khoản demo tên giả: TVV Nguyễn Thu Hương (23) · QL Nguyễn Khánh Vy (2) · GV bộ môn Phạm Thu Trang (9, chỉ xem). Phông Be Vietnam Pro đã nạp (`document.fonts.check` = true) trước mỗi ảnh.
Dữ liệu demo để đủ trạng thái: TVV 23 chốt ngày 26/09 cho một em (Đã chốt), ngày 08/09 cho một em (Đã thi · chờ KQ); em có KQ là dữ liệu seed.

| Ảnh | Khung mockup | Web |
|---|---|---|
| `cap-k4-co-kq-tvv-1440-toi.png` | K4 (phần mở **có KQ** + hộp Tháng dự kiến) | TVV: mở em có KQ + bấm "Dự kiến 12/2026" |
| `cap-k4-cho-kq-tvv-1440-toi.png` | K4 (phần mở **chờ KQ**) | TVV: mở em "Đã thi 08/09 · chờ KQ" |
| `cap-k4-chua-thi-tvv-1440-toi.png` | K4 (phần mở **chưa thi**) | TVV: mở em "Thi 26/09" |
| `cap-k5-gv-1440-toi.png` | K5 (chỉ xem) | GV bộ môn (không quyền sửa) |
| `cap-k8b-tvv-375-sang.png` | K8b (375, hộp sửa xếp dọc) | TVV 375 sáng, bấm "Thi 26/09" |
| `web-k4-da-luu-tvv-1440-toi.png` | K4 hàng "✓ Đã lưu · Hoàn tác" | sau "Dời tháng" |
| `web-k4-loi-luu-tvv-1440-toi.png` | K4 hàng "⚠ Không lưu được · Thử lại" | lưu lỗi (giả máy chủ 503), hộp đã đóng |
| `zoom-hang-mo-ql-1440-toi.png` | — | zoom ×2: ô lịch thi, ⌄, ô điểm ✓ / ✗, phần mở |
| `zoom-co-kq-tvv-1440-toi.png` | — | zoom ×2: phần mở có KQ — Lịch sử · 1 (ghi KQ), Chọn bước tiếp, + Ghi chú |

## 1. Truy vết khung → thành phần → ảnh

| # | Khung | Thành phần (nguồn chuẩn) | Web sau PR | Ảnh | Kết quả |
|---|---|---|---|---|---|
| 1 | K4, K5 | Cột: Học viên · **Lịch thi** · **Target** · MT gần nhất · **SOS** · Ghi chú · ⌄ (lời 37, 38) — không nhãn nhóm "Hiện tại" | `COT_LICH` 230 · 280 · 100 · 160 · 180 · giãn · 52 như `.ltt` | cap-k4-* | KHỚP |
| 2 | K4 | BỎ cột "Việc tiếp", menu "Đặt lịch ▾", nút chính trên hàng (lời 35) | thao tác dời vào giá trị lịch thi + phần mở (mục 2) | cap-k4-* | BỎ có lý do |
| 3 | K4 | BỎ cột Lộ trình · tuần (lời 37) — web trước không có cột này | — | — | GIỮ (không có) |
| 4 | K4 | Ô lịch thi MỘT dòng, không dòng phụ ("chốt ngày khi tới tháng", "hạn 21/09 · thi 12/09" bỏ) | `chuLich`: Chưa có lịch · Dự kiến 10/2026 · Chưa chốt ngày · Thi 26/09 · Đã thi 08/09 · chờ KQ · ✓ 7.0 · chờ bước tiếp · ✓ 7.5 · Kết thúc học | cap-k4-* | KHỚP |
| 5 | K4 | Giá trị bấm được: viền nhạt + gạch chấm (nhận ra cả khi không rê), mở = viền nhấn + nền nhấn + vạch đáy | `.lt-gt-nut` (cùng số đo `.gt-lt`: cao 40, bo 8, lệch −5/−9) | cap-k4-co-kq, zoom | KHỚP |
| 6 | K4 | Bấm giá trị → hộp MỘT hàng dưới hàng thẳng cột Lịch thi: đoạn **Tháng dự kiến \| Ngày thi** · ô (`ONgay`) · "trước: …" · Ghi chú · Đóng · nút chính | `HopLich` (một hộp làm đủ 4 việc lịch); chờ KQ chỉ "Ngày thi" | cap-k4-co-kq, cap-k8b | KHỚP |
| 7 | K4 | Có KQ → giá trị mở panel Sau thi có sẵn (Bước tiếp · Sửa KQ); chờ KQ → giá trị là NGÀY thi nên mở hộp sửa ngày, **Ghi kết quả** ở Làm tiếp (PTA rà #1704: một thao tác một chỗ) | `viecGiaTri` | cap-k4-cho-kq | KHỚP (xem KHÁC 8) |
| 8 | K4 | "✓ Đã lưu · Hoàn tác" (nút) và "⚠ Không lưu được · Thử lại" (nút) ngay ô, xanh / đỏ | `.lt-luu` + `btn nut-nho` cao 24; Hoàn tác 10 giây; lỗi khi hộp mở nằm ở hộp, chữ giữ | web-k4-da-luu, web-k4-loi-luu | KHỚP |
| 9 | K4 | Phần mở **chưa thi**: MT gần nhất (6 ô, kỳ vọng, ↑↓ so MT trước) · Hỗ trợ đang mở · Test sắp tới · Phụ trách · Làm tiếp | `DaiMo` gd `chua-thi` | cap-k4-chua-thi | KHỚP |
| 10 | K4 | Phần mở **chờ KQ** (lời 40): Kỳ thi · KQ thi thật "Chưa có" · Phụ trách · Làm tiếp (**Ghi kết quả** · + Ghi chú · Lịch sử) — không MT gần nhất / Test sắp tới | `DaiMo` gd `cho-kq` | cap-k4-cho-kq | KHỚP (xem KHÁC 1) |
| 11 | K4 | Phần mở **có KQ**: KQ thi thật so Target (Overall + L R W S) · Kỳ thi (Ngày thi · Ghi KQ) · Phụ trách · Làm tiếp · "hạn chọn bước tiếp" (trung tính, [XM-4]) · **Chọn bước tiếp** | `DaiMo` gd `co-kq`; 4 ô thi thật đọc từ cột đã có trong câu | cap-k4-co-kq | KHỚP (xem KHÁC 1) |
| 12 | K4, K8b | TRÊN HÀNG mọi em vẫn có MT gần nhất (lời 42) | `CotMt` mọi trạng thái + "MT3 · W3 AUG" | cap-k4-* | KHỚP |
| 13 | K4 | Luôn có Phụ trách · **+ Ghi chú** (hiện luôn, không cần rê) · **Lịch sử · n** chuẩn (`LichSuGap` + `DsLichSu`, GD-4c) — ẩn chỉ khi n = 0 thật | "+ Ghi chú" (chưa có) / "Sửa ghi chú" (đã có) — cùng quy tắc ba trạng thái; n đếm từ hai câu nhật ký đã đọc, nay gồm cả **ghi KQ thi thật** (`cycle.thi_that`, cùng câu, cùng chỉ mục — 0 câu thêm); mở > 3 dòng thì đọc đủ một lần | cap-k4-co-kq, cap-k4-cho-kq, zoom-co-kq | KHỚP |
| 14 | K4, K5 | Lọc trạng thái thi **Tất cả · Chưa chốt ngày · Đã chốt · Chờ KQ · Có KQ** ([XM-1] chủ SP duyệt) thay "Cần làm / Tất cả" | `.doan.lt-loc-thi`; số đếm từ dữ liệu đã nạp; số 0 không bấm; hàng vừa đổi trạng thái ở lại tới khi đổi lọc | cap-k4-* | KHỚP |
| 15 | K4 | Hàng lọc: Tìm · Mọi lớp · Mọi TVV · Tháng thi từ → đến · phải: trạng thái thi — MỘT hàng ở 1440 | Tìm 200 · ô 156 · tháng 134 (ô gõ + nút lịch) · đoạn 13 px | cap-k4-* | KHỚP |
| 16 | K4 | Không chữ đỏ "quá hạn" (cảnh báo ở Công việc TVV) — [XM-4] | bỏ `lt-qua`, bỏ "· 1 cần làm · 1 quá hạn" ở dải lớp | cap-k4-co-kq | KHỚP |
| 17 | K4 | Dải nhóm lớp: **mã lớp (link hồ sơ lớp)** · n em ([XM-3]) | `ChuLop` → `/hoc-vien/lop/:id` | cap-k4-* | KHỚP |
| 18 | K4 | Cột SOS: chip SOS n · kỹ năng | `ChipSos` từ `standing.sosLevel` + kỹ năng dưới kỳ vọng — CÙNG nguồn cột Hỗ trợ tab Tất cả, dữ liệu đã nạp | cap-k5 | KHỚP |
| 19 | K5 | Chỉ xem: giá trị là chữ thường, không viền / gạch chấm; phần mở không "Làm tiếp", không "+ Ghi chú"; bỏ chữ "Chỉ xem" mỗi hàng | `viecGiaTri` null → `.lt-gt-chu`; khối Làm tiếp chỉ còn Lịch sử | cap-k5-gv | KHỚP |
| 20 | K8b | 375: mỗi em một thẻ — tên · ⌄ / lịch thi một dòng (bấm 44) / Target · MT · SOS; hộp sửa xếp dọc (đoạn hai nửa, ô 44, Đóng · nút chính); hàng lọc Tìm + **Lọc · n** | thẻ `lt-the`; khi hộp mở ẩn dòng điểm như mockup; "Lọc" gom lớp · TVV · tháng · trạng thái (như tab Tất cả B26) | cap-k8b-tvv-375-sang | KHỚP (xem KHÁC 4) |
| 21 | — | BỎ: `CotViec`, `laMenuLich`, `canLam`, menu "Đặt lịch ▾", "Hết việc lịch thi…" (rỗng của Cần làm), dòng phụ ô lịch thi, "Xem toàn bộ" tự viết, "+ Ghi chú" hiện khi rê | thay bằng mục 4–14 | — | BỎ có lý do |

**KHỚP 19 / 19 dòng có thành phần (100 %)**; dòng 2 và 21 là danh sách BỎ, dòng 3 GIỮ (web chưa từng có).

## 2. KHÁC (có lý do)

1. **Nơi thi · "Có KQ khoảng 21/09"** (K4 khối Kỳ thi): máy chủ không có cột nơi thi, không có luật ngày dự kiến có KQ → không vẽ, không bịa. Thêm cột = migrate + ô nhập mới → **Việc để sau**.
2. **Mọi TVV mặc định**: mockup vẽ "Tôi ✕" đã chọn (trạng thái minh hoạ); web giữ mặc định "Mọi TVV" như trước (ô Xem "HV của tôi" đã lọc em của TVV).
3. **Lọc trạng thái thi + Mọi TVV ở tab Lịch thi vẫn là state trang** (như "Cần làm / Tất cả" trước) — chưa lên URL; về lại tab thì về "Tất cả". → Việc để sau (đồng bộ URL `tvv` với tab Tất cả).
4. **375 dòng ghi chú**: mockup K8b không vẽ ghi chú trên thẻ; web giữ dòng "Ghi chú: …" khi em CÓ ghi chú (thông tin đã có trên thẻ trước PR, không mất); không có thì không có dòng.
5. **Fast Track / Lớp thường ở đầu trang TVV**: mockup K4 vẽ đoạn FT / LT; web TVV không có đoạn này từ trước (ngoài phạm vi tab).
6. **K5 chụp bằng GV bộ môn**: GVCN của lớp SỬA ĐƯỢC lịch thi theo quyền máy chủ (F15-5), nên mockup K5 "GV chỉ xem" khớp với GV không phụ trách lớp; không đổi quyền.
8. **Chờ KQ — bấm giá trị**: mockup K4 cho "Chờ KQ" mở thẳng Ghi kết quả; PTA rà #1704 chốt một thao tác một chỗ: giá trị (ngày thi) → sửa ngày, Ghi kết quả ở "Làm tiếp". Không mất thao tác, không nút "Sửa ngày" lặp.
9. **375 tab "Đang SOS"**: một tên ở mọi cỡ màn (trước PR 375 ghi "SOS"); số 0 / chưa nạp thì không badge.
7. **V22**: mockup K4 "⚠ Không lưu được" — ⚠ ở đây là lỗi lưu (không phải hạn) nên giữ ⚠ đúng V22.

## 3. Thao tác TRƯỚC → SAU

| # | Thao tác TRƯỚC | Ai | SAU — nằm ở đâu | Mất? |
|---|---|---|---|---|
| 1 | "Đặt lịch ▾" › Đặt tháng dự kiến | TVV, QL, GVCN | bấm "Chưa có lịch" → hộp, đoạn **Tháng dự kiến** | không |
| 2 | Nút chính / menu "Chốt ngày" | TVV, QL, GVCN | bấm "Chưa chốt ngày" / "Dự kiến …" → hộp, đoạn **Ngày thi** (tới tháng thì mở sẵn Ngày thi) | không |
| 3 | "Dời tháng" | TVV, QL, GVCN | bấm "Dự kiến …" → hộp, đoạn Tháng dự kiến (nút "Dời tháng") | không |
| 4 | "Sửa ngày" | TVV, QL, GVCN | bấm "Thi 26/09" hoặc "Đã thi 08/09 · chờ KQ" → hộp, Ngày thi (nút "Lưu ngày") | không |
| 5 | Nút chính "Ghi kết quả" | TVV, QL (FT) | nút **Ghi kết quả** ở "Làm tiếp" phần mở → panel Sau thi (bước KQ) | không |
| 6 | Nút chính "Bước tiếp" | TVV, QL (FT) | bấm "✓ 7.0 · chờ bước tiếp" → panel Sau thi; **Chọn bước tiếp** ở "Làm tiếp" | không |
| 7 | "Sửa KQ" | TVV, QL (FT) | bấm "✓ 7.5 · Kết thúc học" → panel Sau thi | không |
| 8 | Ghi chú: bấm ô để sửa · "+ Ghi chú" khi rê | TVV, QL, GVCN | bấm ô để sửa (giữ) · "+ Ghi chú" / "Sửa ghi chú" ở phần mở (hiện luôn) | không |
| 9 | Hoàn tác 10 giây sau lưu lịch | TVV, QL, GVCN | nút "Hoàn tác" cạnh "✓ Đã lưu" ngay ô lịch thi — **nay cả sau lưu ghi chú** (trả ghi chú cũ, không đụng lịch) | không (thêm) |
| 10 | "Thử lại" khi lỗi lưu (chữ giữ) | TVV, QL, GVCN | nút "Thử lại" ngay ô (hộp đóng) / trong hộp (hộp mở, chữ giữ) | không |
| 11 | ⌄ mở chi tiết · bấm thanh hàng mở chi tiết | mọi vai | giữ; nội dung theo trạng thái thi (lời 40) | không |
| 12 | "Lịch sử lịch thi" 3 dòng + "Xem toàn bộ" | mọi vai | "Lịch sử · n" chuẩn (mở = xem hết; > 3 dòng đọc đủ khi mở) | không |
| 13 | Hỗ trợ đang mở: kỹ năng → panel Case | mọi vai | giữ (link kỹ năng) | không |
| 14 | Cần làm / Tất cả | mọi vai | lọc trạng thái thi (Tất cả · Chưa chốt ngày · Đã chốt · Chờ KQ · Có KQ) — việc tới hạn ở Công việc TVV | không ([XM-1] đã duyệt) |
| 15 | Tháng thi từ → đến · Mọi lớp · Mọi TVV · Tìm | mọi vai | giữ, một thứ tự hàng lọc; 375 vào nút "Lọc · n" | không |
| 16 | Tên em → hồ sơ HV | mọi vai | giữ | không |
| 17 | — | mọi vai | mã lớp ở dải nhóm → hồ sơ lớp | thêm |
| 18 | Xuất Excel (đầu trang, đúng danh sách đang lọc) | mọi vai | giữ (`onIds` = em đang hiện) | không |

**Mất thao tác: không.**

## 4. Sửa lỗi gốc đi kèm

- **"Dời tháng" không đổi lịch với em đang giữ TUẦN thi** (`server/src/fasttrack/cycles.ts` `updateCycle`): tháng → tháng khác giữ `exam_period_id` cũ, mà `examPlanOf` ưu tiên tuần → lưu "✓" nhưng vẫn "Dự kiến 12/2026". Sửa ở hàm chung (mọi nơi đổi dự kiến thi đi qua đây): tuần cũ không thuộc tháng mới thì bỏ tuần. Phép kiểm: `prOv15f.tests.ts` F15-4.

## 5. Đo

- **✕ / ⋯ / ⌄** (tâm ký tự so tâm nút, `getBoundingClientRect`, TVV · QL · GVBM 1440 + TVV · QL 375): ⌄ `.lt-mo-ct` 4 + 51 + 48 + 4 + 51 chỗ — lệch ngang 0, dọc 0 → **≤ 1 px**. ✕ / ⋯ của trang không đổi (GD-13a đã đo).
- **Chữ bị cắt "…" / hộp đè cột**: đo `scrollWidth > clientWidth` mọi `.lt-s1`, ghi chú, tên, điểm phụ, tiêu đề khối, phản hồi lưu — **0 chỗ**; con tràn khỏi ô `td` — **0**; cuộn ngang trang — không (1440 + 375).
- **Chip ✓**: ô điểm "✓ 6.0" / "✗ 5.0" và "✓ Đã lưu" luôn màu đạt (`--ok`) — `zoom-hang-mo-ql-1440-toi.png`, `web-k4-da-luu-tvv-1440-toi.png`.
- **Turso**: xem mô tả PR (trước → sau từng vai, `tocDo.run` `PISA_IN_DO`).
- **impeccable detect** (`HangLichThi.tsx`, `GocLichThi.tsx`): 0 phát hiện. **audit**: a11y — giá trị lịch thi là `<button>` có tên truy cập chứa chữ thấy + "Sửa lịch thi · tên" (WCAG 2.5.3), ⌄ có `aria-label` + `aria-expanded`, SVG `aria-hidden`, phản hồi lưu `role=status` / `alert`; chạm 44 ở 375; chuyển động chỉ `transform`, có `prefers-reduced-motion`; màu từ token. **web-design-guidelines**: đạt; ghi nhận — lọc trạng thái / TVV chưa lên URL (KHÁC 3), `autoFocus` chỉ ở ô ghi chú vừa bấm sửa (có chủ ý).
