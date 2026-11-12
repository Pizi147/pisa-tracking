# v20 · Tỉ lệ GV theo tuần cho điểm thi thật — ghi chú mockup

Mockup: `thiet-ke/v20/ti-le-gv.html` (1440 + 375, tối + sáng, dữ liệu giả). Đề bài: `docs/superpowers/specs/2026-11-12-tinh-hinh-hoc-tap/de-bai.md` mục 4.
Nền: v19 (ô số hộp G6, màu, panel). Chờ chủ SP duyệt rồi mới code.

## 1. Một luật

- Điểm kỹ năng thi thật (L / R / W / S) ở mọi nơi → **ô số hộp** (dáng `.os` v19; màu chữ giữ nghĩa so Target: xanh trên · thường bằng · đỏ dưới).
- Bấm → **hộp nhỏ** (popover, mũi chỉ vào ô; 375 = sheet dưới, nền mờ): kỹ năng · điểm · ngày thi · tên em → **khoảng tính** `W1 SEP → W1 NOV · 10 tuần` (tuần bắt đầu lộ trình → tuần thi) + ⓘ → **dòng lớp** (chỉ khi em chuyển lớp: lớp · tuần từ–đến · số tuần) → **GV** xếp số tuần giảm dần: tên · lớp đã dạy em · thanh nhỏ · `5/10 tuần` · `50 %` → **Chưa phân công** (nếu có tuần trống) cuối.
- GV tỉ lệ cao nhất: nền nhạt + viền nhấn + tên đậm + thanh màu nhấn + % đậm. **Không** chữ "phụ trách chính". Bằng nhau → cả hai nổi.
- W: điểm thi một ô W, phân công tách W1 / W2 → hộp có hai nhóm "W1 · Task 1", "W2 · Task 2".
- Trạng thái: một GV 100 % · nhiều GV (chuyển lớp + đổi GV) · bằng nhau · tuần trống một phần · chưa có phân công (cả khoảng; QL thấy link "Phân công <lớp> ›") · đang tải (khung xương) · lỗi (Thử lại, nói rõ điểm không đổi).
- Hàng nút **L R W S** dưới tiêu đề: chuyển kỹ năng ngay trong hộp (không đóng, 0 request).
- Đóng: ✕ · Esc · bấm ngoài; 375: vuốt xuống / chạm nền. Focus vào hộp khi mở, trả về ô khi đóng. Ô đang mở `.os.mo` + `aria-expanded`.
- ⓘ (bấm → hiện trong hộp, khung 1i): "Hai GV cùng tuần: mỗi người đều tính, tổng có thể quá 100 %. Đếm theo tuần, từ tuần bắt đầu lộ trình đến tuần thi; tuần GV được phân công kỹ năng này ở lớp em học thì tính cho GV đó."

## 2. Nơi áp dụng

| Nơi | Tệp web | Điểm hiện | SAU |
|---|---|---|---|
| Hồ sơ HV › Học thuật, hàng Thi thật (1440 bảng · 375 thẻ) | `students/StudentDetailPage.tsx` | L R W S OVR | L R W S = hộp → hộp nhỏ (khung 2a, 5a–5b, 6a–6b) |
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
- Ước mỗi lần bấm: kiểm quyền xem em 1–2 câu · lần thi + `started_at` 1 câu (theo id) · ghi danh em 1 câu (1–4 dòng) · phân công các lớp đó kèm tên GV + tên lớp 1 câu (5–20 dòng) → **≈ 4–5 câu, < 40 dòng**.
  Giả sử 300 lần bấm / ngày toàn hệ thống → ≈ 12 000 dòng / ngày (≈ 0,1 % trần 15 triệu). Không cần cảnh báo.
- Trần câu + dòng cho đường mới thêm ở `server/src/tests/tocDoDuong.ts` (đề xuất ≤ 6 câu, ≤ 100 dòng).
- [XM-2] nếu làm 3b (tên GV dưới điểm ở Danh sách): vai Theo GV đã có `tuanDay` sẵn trong `thiThatTab` → +0 câu; vai khác +2 câu / lần mở tab (ghi danh + phân công của tập, vài trăm dòng). Chưa khuyến nghị.

## 5. [XM] — cần chủ SP / PTA chốt

- **[XM-1] Điểm thi thật thành hộp.** v19 ghi "điểm thi là chữ thường (không bấm)". v20 đổi riêng điểm kỹ năng thi thật (nay bấm được, theo G6 "hộp = bấm được"). Mock Test giữ chữ. Khuyến nghị: duyệt.
- **[XM-2] Tên GV dưới mỗi điểm ở Phân tích › Thi thật › Danh sách** (khung 3b, đề xuất tuỳ chọn trong đề bài). Dày bảng, thêm đọc cho vai không có Theo GV, lặp thông tin của hộp. Khuyến nghị: **chưa làm**; làm sau nếu QL cần quét nhanh.
- **[XM-3] Nơi chỉ có OVR (hồ sơ lớp › Tổng kết):** OVR thành hộp, mở hộp tóm tắt 5 kỹ năng (kỹ năng · điểm · GV nhiều tuần nhất · % · "+1 GV · 1 tuần trống"), bấm dòng → chi tiết kỹ năng ngay trong hộp ("‹ Kỹ năng" quay lại). Khuyến nghị: duyệt (không thêm cột L R W S vào bảng).
- **[XM-4] Panel KQ thi thật:** ô là ô nhập, không bấm mở được → nút chữ "Tuần dạy" cạnh OVR (chỉ khi đã lưu) mở hộp tóm tắt. Hộp trong panel (không phải panel lồng panel). Khuyến nghị: duyệt.
- **[XM-5] Kỹ năng "↺" (lấy KQ lần thi trước):** khoảng tính đến tuần của lần thi có điểm đó (đúng người dạy điểm đó). Khuyến nghị: duyệt.
- **[XM-6] Quyền.** Khối Theo GV ở Phân tích chỉ QL / QT / CX (2E). Hộp này nói về MỘT em, tên GV đã công khai ở phân công lớp. Khuyến nghị: ai xem được điểm thi thật của em thì xem được hộp; link "Phân công ›" chỉ QL / QT. Cần chủ SP chốt.
- **[XM-7] Hai GV cùng tuần (dạy chung / bàn giao giữa tuần):** mỗi người đều tính tuần đó → tổng > 100 % (giải thích ở ⓘ). Giữ như `tuanDay` hiện tại, không chia đôi.
- **[XM-8] Lớp thường trong khoảng:** `tuanDay` chỉ tính lớp FT; tuần em học lớp thường (nếu có) không vào `tong`. Giữ.

## 6. Tự rà đề bài mục 4

| Ý đề bài | Có ở mockup |
|---|---|
| Mọi chỗ hiện điểm thi thật của em (hồ sơ HV Học thuật, Tổng kết lộ trình, panel KQ thi thật, Phân tích › Thi thật danh sách / panel ô, hồ sơ lớp Tổng kết) | ✓ bảng mục 2; khung 2a, 4a, 4b, 3a (+ panel ô cùng ô), 4c |
| Bấm điểm một kỹ năng → hộp nhỏ: GV · số tuần · % | ✓ 1a–1h, 2a, 3a, 4a, 5b–5c |
| GV tỉ lệ cao nhất làm nổi, KHÔNG chữ "Phụ trách chính" | ✓ nền nhạt + viền + đậm; không nhãn; 1d bằng nhau |
| Tính từ `started_at` tới ngày thi, gồm chuyển lớp + đổi GV | ✓ dòng khoảng tính + dòng lớp (1b, 2a) |
| Chỉ đọc khi bấm | ✓ mục 4 (+0 khi mở trang; 1 request / lần thi) |
| (prompt) 375 sheet dưới · tối + sáng · tải / lỗi / chưa phân công · ⓘ · ô bấm nhìn ra | ✓ 5a–5d, 6a–6b, 1e–1g, mục 0 |
| (prompt) [XM] tên GV dưới mỗi kỹ năng ở Danh sách | ✓ 3b, XM-2 |

## 7. Skill đã dùng

impeccable `shape` (brief trong tệp này, mục 1) → `critique` (subagent độc lập: vòng 1 **28/40** → vòng 2 **31/40**, không P0/P1; sau vòng 2 đã sửa thêm P2/P3: ⓘ ngắn, rỗng gọn, hàng L R W S) · `ui-ux-pro-max` (popover / sheet, vùng chạm ≥ 44 px, trạng thái không chỉ bằng màu) · `dataviz` (phần–tổng một chiều → thanh nhỏ + số, không vòng / bánh; một màu nhấn cho GV cao nhất, còn lại trung tính).

## 8. Ảnh

`thiet-ke/v20/anh/f00–f25.png` theo thứ tự khung (f14 = 2a hồ sơ HV 1440 tối, f15 = 3a Phân tích 1440 tối, f20–f23 = 375 tối (f21 sheet R, f22 sheet W), f24–f25 = sáng).
