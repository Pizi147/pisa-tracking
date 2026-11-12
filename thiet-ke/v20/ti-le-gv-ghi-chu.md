# v20 · Tỉ lệ GV theo tuần cho điểm thi thật — ghi chú mockup

Mockup: `thiet-ke/v20/ti-le-gv.html` (1440 + 375, tối + sáng, dữ liệu giả). Đề bài: `docs/superpowers/specs/2026-11-12-tinh-hinh-hoc-tap/de-bai.md` mục 4.
Nền: v19 (ô số hộp G6, màu, panel). Khung hồ sơ HV = web thật (thanh Trước · Sau, đầu hai dòng, ô điểm to, tab Học thuật · Ý thức & Phối hợp · Lộ trình & lớp, bảng MT L · R · W1 · W2 · S). PTA rà + chốt XM 12/11; chờ chủ SP duyệt rồi mới code.

## 1. Một luật

- Điểm kỹ năng thi thật (L / R / W / S) ở mọi nơi → **ô số hộp** (dáng `.os` v19; màu chữ giữ nghĩa so Target: xanh trên · thường bằng · đỏ dưới).
- Bấm → **hộp nhỏ** (popover, mũi chỉ vào ô; 375 = sheet dưới, nền mờ): kỹ năng · điểm · ngày thi · tên em → **khoảng tính** `W1 SEP → W1 NOV · 10 tuần` (tuần bắt đầu lộ trình → tuần thi) + ⓘ → **dòng lớp** (chỉ khi em chuyển lớp: lớp · tuần từ–đến · số tuần) → **GV** xếp số tuần giảm dần: tên · lớp đã dạy em · thanh nhỏ · `5,5/10 tuần` · `55 %` (tuần có thể lẻ ,5) → **Chưa phân công** (nếu có tuần trống) cuối.
- GV tỉ lệ cao nhất: nền nhạt + viền nhấn + tên đậm + thanh màu nhấn + % đậm. **Không** chữ "phụ trách chính". Bằng nhau → cả hai nổi.
- W: bài thi thật chỉ có MỘT điểm W, phân công tách W1 / W2 → hộp có hai nhóm "W1 · Writing Task 1", "W2 · Writing Task 2", mỗi nhóm % riêng (mỗi nhóm cộng 100 %). Bảng MT hồ sơ HV giữ cột W1 · W2 (không gộp W); ở hàng Thi thật ô W trải hai cột W1 + W2 (như web hiện tại).
- Trạng thái: một GV 100 % · nhiều GV (chuyển lớp + đổi GV) · bằng nhau · tuần trống một phần · chưa có phân công (cả khoảng; QL thấy link "Phân công <lớp> ›") · đang tải (khung xương) · lỗi (Thử lại, nói rõ điểm không đổi).
- Hàng nút **L R W S** dưới tiêu đề: chuyển kỹ năng ngay trong hộp (không đóng, 0 request).
- Đóng: ✕ · Esc · bấm ngoài; 375: vuốt xuống / chạm nền. Focus vào hộp khi mở, trả về ô khi đóng. Ô đang mở `.os.mo` + `aria-expanded`.
- ⓘ (bấm → hiện trong hộp, khung 1i): "Đếm theo tuần, từ tuần bắt đầu lộ trình đến tuần thi; tuần GV được phân công kỹ năng này ở lớp em học thì tính cho GV đó. Tuần hai GV cùng dạy: chia đôi (0,5 mỗi người), tổng luôn 100 %. Chỉ tính lớp Fast Track."
- % làm tròn theo phần dư lớn nhất để các dòng (gồm Chưa phân công) cộng đúng 100 %.

## 2. Nơi áp dụng

| Nơi | Tệp web | Điểm hiện | SAU |
|---|---|---|---|
| Hồ sơ HV › Học thuật, hàng Thi thật (1440 bảng · 375 thẻ) | `students/StudentDetailPage.tsx` | L R W(trải W1+W2) S OVR | L R W S = hộp → hộp nhỏ (khung 2a, 5a–5b, 6a–6b) |
| Hồ sơ HV · ô điểm to đầu trang (`DiemDau`) | `students/HanhTrinhKyNang.tsx` | Thi thật IELTS · L R W S | **Giữ** bấm = chọn kỹ năng cho Hành trình, không mở hộp [XM-9] |
| Tổng kết lộ trình (ngăn) | `students/NganTongKet.tsx` | ô lớn L R W S OVR | ô lớn = hộp lớn → hộp nhỏ (4a) |
| Panel KQ thi thật (nhập điểm) | `students/KetQuaThiThatPanel.tsx` | ô nhập | nút chữ **Tuần dạy** cạnh OVR khi đã lưu → hộp tóm tắt 5 kỹ năng (4b) [XM-4] |
| Phân tích › Thi thật › Danh sách | `phanTich/KetQuaThi.tsx` | L R W S | hộp → hộp nhỏ (3a) |
| Phân tích › Thi thật › panel ô (bảng lượt kiểu thi thật) | `ui/BangLuotPanel.tsx` | L R W S | CÙNG ô + hộp như 3a |
| Hồ sơ lớp › Tổng kết | `classes/TabTongKetLop.tsx` | chỉ OVR thi thật | OVR = hộp → hộp tóm tắt 5 kỹ năng (4c) [XM-3] |

Mock Test, OVR ở nơi đã có đủ L R W S, "—": giữ chữ thường.

## 3. Thao tác TRƯỚC → SAU

| Việc | TRƯỚC | SAU |
|---|---|---|
| Biết GV nào dạy em kỹ năng R tới lúc thi | Không có trên web (chỉ khối Theo GV tổng hợp ở Phân tích, vai QL/QT/CX); phải dò phân công từng lớp + lịch sử chuyển lớp | Bấm điểm R → hộp nhỏ (1 bấm, không đổi trang) |
| Xem kỹ năng khác cùng em | — | Bấm L R W S trong hộp (hoặc ô khác): 0 request thêm (đã nạp cả 5 kỹ năng) |
| Em chuyển lớp / đổi GV giữa chừng | — | Dòng lớp + GV ghi lớp đã dạy; tuần trống ghi "Chưa phân công · lớp · tuần" |
| Sửa phân công còn trống (QL) | Vào lớp › phân công | Link "Phân công <lớp> ›" ngay trong hộp (chỉ QL / QT) |
| Nhập / sửa điểm thi thật, Xuất Excel, + Case, ⋯, link tên em / lớp | như cũ | **Giữ nguyên**, không mất thao tác nào |

## 4. Turso (chỉ đọc khi bấm)

- Mở trang: **+0 câu, +0 dòng** (không đọc trước).
- Bấm lần đầu một lần thi: **1 request mới** trả cả 5 kỹ năng (L, R, W1, W2, S); bấm ô khác cùng em: 0 request (nhớ theo `cycleId` ở web).
- Cần **endpoint mới**: `GET /hoc-vien/thi-that/:cycleId/tuan-day` → `{ tu, den, tong, lop: [{id, ten, tu, den, tuan}], kn: { l|r|w1|w2|s: { gv: [{userId, ten, lop[], tuan}], trong: {tuan, lop, tu}|null } } }`.
  Dùng lại `tuanDay` (`server/src/phanTich/thiThatThongKe.ts`) cho tập một phần tử; thêm: `tong` (Thứ Hai em có ghi danh FT trong khoảng), tuần trống mỗi kỹ năng, danh sách lớp của GV.
- **Đổi cách đếm (XM-7):** tuần có k GV cùng phân công một kỹ năng → mỗi người 1/k tuần (hiện `tuanDay` đếm trọn cho mỗi người). Vì Phân tích › Theo GV dùng CÙNG `tuanDay` làm trọng số tuần, sửa ở hàm chung → Theo GV đổi theo (cùng nguồn, cùng hàm — luật nhất quán). % trên Theo GV có thể lệch ít ở GV có tuần dạy chung; ghi trong mô tả PR code.
- Ước mỗi lần bấm: kiểm quyền xem em 1–2 câu · lần thi + `started_at` 1 câu (theo id) · ghi danh em 1 câu (1–4 dòng) · phân công các lớp đó kèm tên GV + tên lớp 1 câu (5–20 dòng) → **≈ 4–5 câu, < 40 dòng**.
  Giả sử 300 lần bấm / ngày toàn hệ thống → ≈ 12 000 dòng / ngày (≈ 0,1 % trần 15 triệu). Không cần cảnh báo.
- Trần câu + dòng cho đường mới thêm ở `server/src/tests/tocDoDuong.ts` (đề xuất ≤ 6 câu, ≤ 100 dòng).

## 5. [XM] — PTA Plan chốt 12/11

- **[XM-1] Điểm kỹ năng thi thật thành hộp** (v19 ghi chữ thường): ✓ đồng ý — hộp = bấm được. Mock Test giữ chữ.
- **[XM-2] Tên GV dưới mỗi điểm ở Phân tích › Danh sách:** ✗ KHÔNG làm (khung 3b đã bỏ).
- **[XM-3] Hồ sơ lớp › Tổng kết (chỉ OVR):** ✓ OVR thành hộp → hộp tóm tắt 5 kỹ năng, bấm dòng → chi tiết trong hộp.
- **[XM-4] Panel KQ thi thật:** ✓ nút chữ "Tuần dạy" cạnh OVR (khi đã lưu) → hộp tóm tắt.
- **[XM-5] Ô "↺":** ✓ khoảng tính đến tuần của lần thi có điểm đó.
- **[XM-6] Quyền:** ✓ ai xem được điểm thi thật của em thì xem được hộp; link "Phân công ›" chỉ QL / QT.
- **[XM-7] Hai GV cùng tuần:** PTA chốt **chia đều** (0,5 mỗi người khi hai GV) → % cộng đúng 100 %; số tuần có thể lẻ ,5 (khung 1b, 2a: tuần bàn giao W4 SEP). Sửa ở `tuanDay` chung (xem mục 4).
- **[XM-8] Chỉ tính lớp FT:** ✓ giữ; ghi trong ⓘ.
- **[XM-9] Mới — ô điểm to đầu hồ sơ** (`DiemDau`: Thi thật IELTS · L R W S) đang bấm = chọn kỹ năng cho Hành trình. Đề xuất GIỮ (một ô một việc), xem tuần dạy ở hàng Thi thật bảng MT ngay dưới. Cần PTA / chủ SP xác nhận.

## 6. Tự rà đề bài mục 4

| Ý đề bài | Có ở mockup |
|---|---|
| Mọi chỗ hiện điểm thi thật của em (hồ sơ HV Học thuật, Tổng kết lộ trình, panel KQ thi thật, Phân tích › Thi thật danh sách / panel ô, hồ sơ lớp Tổng kết) | ✓ bảng mục 2; khung 2a, 4a, 4b, 3a (+ panel ô cùng ô), 4c |
| Bấm điểm một kỹ năng → hộp nhỏ: GV · số tuần · % | ✓ 1a–1h, 2a, 3a, 4a, 5b–5c |
| GV tỉ lệ cao nhất làm nổi, KHÔNG chữ "Phụ trách chính" | ✓ nền nhạt + viền + đậm; không nhãn; 1d bằng nhau |
| Tính từ `started_at` tới ngày thi, gồm chuyển lớp + đổi GV | ✓ dòng khoảng tính + dòng lớp (1b, 2a) |
| Chỉ đọc khi bấm | ✓ mục 4 (+0 khi mở trang; 1 request / lần thi) |
| (prompt) 375 sheet dưới · tối + sáng · tải / lỗi / chưa phân công · ⓘ · ô bấm nhìn ra | ✓ 5a–5d, 6a–6b, 1e–1g, mục 0 |
| (prompt) [XM] tên GV dưới mỗi kỹ năng ở Danh sách | ✓ đã đề xuất; PTA chốt không làm (XM-2) |
| (PTA 12/11) bảng MT W1 · W2, khung = web thật, % cộng 100 % | ✓ 2a, 5a, 6a; 1b chia đôi |

## 7. Skill đã dùng

impeccable `shape` (brief trong tệp này, mục 1) → `critique` (subagent độc lập: vòng 1 **28/40** → vòng 2 **31/40**, không P0/P1; sau vòng 2 đã sửa thêm P2/P3: ⓘ ngắn, rỗng gọn, hàng L R W S) · `ui-ux-pro-max` (popover / sheet, vùng chạm ≥ 44 px, trạng thái không chỉ bằng màu) · `dataviz` (phần–tổng một chiều → thanh nhỏ + số, không vòng / bánh; một màu nhấn cho GV cao nhất, còn lại trung tính).

## 8. Ảnh

`thiet-ke/v20/anh/f00–f24.png` theo thứ tự khung (f00–f08 = 1a–1i tối, f09–f13 = sáng, f14 = 2a hồ sơ HV 1440 tối, f15 = 3a Phân tích 1440 tối, f16–f18 = 4a–4c, f19–f22 = 375 tối (f20 sheet R, f21 sheet W), f23–f24 = sáng).
