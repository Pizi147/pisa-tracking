# v16 · Lịch thi (HV & Lớp) — ghi chú mockup

Chủ SP 06/11 ý 3: "nhìn lôm côm quá, thông tin thì được nhưng mà nhìn rất kỳ quặc, ô tháng thì tự nhiên bị trồi lên, thử thiết kế lại nhé,
màu mè cũng kì lắm, không rõ là phải làm gì ấy". Kèm ý 5: bỏ tên TVV dưới tên em.

- Mockup: `thiet-ke/v16/lich-thi.html` (mở trực tiếp; `?k=a1` chỉ vẽ một khung).
- Ảnh: `thiet-ke/v16/anh/lt-*.png` — 14 khung 1440 tối + 4 khung 375 sáng.
- Nguồn đã đọc: `GocLichThi.tsx` (màn thật), `PanelSauThi.tsx`, `shared/domain/lichThiOv15f.ts` (`trangThaiLichThi`, `nhanLichThi`),
  `tongKetLoTrinh.ts` (`trangThaiSauThi`), `plan.md` N6 · N12 · OV-13q, mockup cũ `mockup-ov14-5-…`, `v11/hoc-vien-lop.html`, `DESIGN.md` Luật V5.
  Không chạy dev: mã + ảnh chủ SP đủ thấy hiện trạng.
- Brainstorm / shape: session tự trả lời theo vai người dùng (prompt PTA: không hỏi chủ SP).

## 1. Vì sao màn cũ "lôm côm" (hiện trạng đã kiểm trong mã)

| Chủ SP thấy | Nguyên nhân trong `GocLichThi.tsx` |
|---|---|
| Ô tháng trồi lên | Hộp Dời tháng: nhãn nằm TRÊN ô (`label block`), ô tháng `ONgay` có thêm dòng gợi ý "DEC 2026" dưới ô, ô Ghi chú không có → hai cột lệch chiều cao; hộp `ml-auto max-w-[640px]` nổi lệch phải, không thẳng cột nào |
| Màu mè kì | Mỗi hàng có chip lịch (nền xanh lơ / viền đứt), số MT đỏ / xanh, nút tô đặc khi "chưa chốt ngày", phần mở rộng nền xanh `accent-soft` |
| Không rõ phải làm gì | Hai nút Chốt ngày / Dời tháng giống nhau trên mọi hàng chưa có ngày (cả em chưa có tháng: "Dời tháng" sai nghĩa); em đã thi chỉ có "Sửa ngày" — không có lối ghi kết quả / bước tiếp; ô ghi chú trên mọi hàng ghi mờ "Chưa kết luận" — đọc như một trạng thái |

## 2. Brief (shape)

- **Ai, lúc nào:** TVV (giữ Chốt ngày thi · KQ thi thật · Bước tiếp — N6) và QL, ở máy tính trung tâm, thường trong buổi họp rà 10–40 em; điện thoại để tra.
- **Đầu ra:** mỗi em có lịch thi → có ngày → có KQ → có bước tiếp. Thi thật là kết thúc nhưng **không tự kết thúc** — kết thúc = ghi KQ + chọn bước tiếp.
- **Hướng:** giữ thế giới hình ảnh đã khoá (token `audit-0311/chung.css`, Be Vietnam Pro + chữ số Inter). Đổi cách đọc hàng:
  1. Cột **Lịch thi** = dải 4 đoạn *Tháng › Ngày › KQ › Bước tiếp* + chữ trạng thái (đúng tên của `nhanLichThi` / `chuSauThi`).
     Ba dáng, đọc bằng hình trước màu: đặc xám ngắn = xong · viền rỗng = chưa xong · **dài đặc nhấn** = làm bây giờ (dài đặc đỏ = quá hạn, luôn kèm chữ ⚠).
  2. Cột **Việc tiếp** đứng ngay sau Lịch thi. Chỉ hàng **tới lúc làm** có nút viết đúng việc (Đặt tháng · Chốt ngày · Ghi kết quả · Bước tiếp) — đúng số "Cần làm";
     quá hạn → nút tô đặc (chỉ vài hàng). Hàng chưa tới lúc (dự kiến tháng sau, chờ ngày thi, xong) chỉ có nút chữ (Chốt ngày · Dời tháng · Sửa ngày · Sửa KQ).
     Bấm nút → nút ở trạng thái đang mở (nền nhấn nhạt), hộp dưới hàng giữ nút lưu duy nhất.
  3. Mọi hộp làm tại chỗ là MỘT hàng dưới hàng em, thẳng cột Lịch thi, nhãn bên trái ô, mọi ô / nút cao 36 → hết "trồi".
  4. Ghi chú là chữ đọc, bấm để sửa; hàng trống chỉ hiện "+ Ghi chú" khi rê / focus.
  5. Bỏ chip màu trong cột, bỏ nền xanh phần mở; màu chỉ còn ở điểm (✓ / ✗ — G12), quá hạn, đoạn cần làm.
- **Không làm:** không thêm bước / trạng thái / điều kiện chặn mới; không tách danh sách thành nhóm (luật 29/10: một danh sách, thi gần nhất trước); không form KQ mới.

## 3. Khung

| Khung | Nội dung | Ảnh |
|---|---|---|
| a | Danh sách 11 em đủ 7 trạng thái lẫn nhau, rê một hàng | `lt-a1-1440-toi`, `lt-m1-375-sang` |
| b | Dời tháng (hộp một hàng) · sau lưu "Đã dời sang 11/2026" + Hoàn tác · em chưa có lịch "Đặt tháng" | `lt-b1`, `lt-b2`, `lt-b3` |
| c | Chốt ngày (ONgay ngày) · sau lưu "Thi 26/09 · còn 9 ngày" | `lt-c1`, `lt-c2`, `lt-m2-375-sang` |
| d | Đã có ngày, chờ thi · Sửa ngày | `lt-d1` |
| e | Ghi kết quả → `PanelSauThi` có sẵn (① KQ ② Bước tiếp) | `lt-e1`, `lt-m3-375-sang` |
| f | Chi tiết em: hết bề ngang, 6 trường (MT 5 kỹ năng · Test sắp tới · Case · GVCN · TVV · Lịch sử 3 dòng + Xem toàn bộ) | `lt-f1`, `lt-m4-375-sang` |
| g | Rỗng khoảng tháng · "Cần làm" hết việc · lỗi tải · lỗi lưu tại hàng (giữ chữ, Thử lại) · chỉ xem | `lt-g1` … `lt-g5` |

## 4. Bảng trạng thái → hàng

| Trạng thái (hàm có sẵn) | Dải | Chữ chính · phụ | Nút việc | Nút chữ |
|---|---|---|---|---|
| `chua-co` | ▬ cần · rỗng · rỗng · rỗng | Chưa có lịch · chưa có tháng thi | **Đặt tháng** | Chốt ngày |
| `du-kien` (tháng sau) | xám · rỗng · rỗng · rỗng | Dự kiến 10/2026 · chưa chốt ngày | — | Chốt ngày · Dời tháng |
| `chua-chot-ngay` (tới tháng) | xám · ▬ cần · rỗng · rỗng | Chưa chốt ngày · tháng thi 09/2026 | **Chốt ngày** | Dời tháng |
| `da-chot-ngay` | xám · xám · rỗng · rỗng | Thi 26/09 · còn 9 ngày (≤ 14) / chốt 05/09 · Lê Thu | — | Sửa ngày |
| `da_thi_cho_kq` | xám · xám · ▬ cần / ▬ đỏ · rỗng | Đã thi 08/09 · chờ KQ · hạn 15/09 (quá hạn: ⚠ đỏ) | **Ghi kết quả** (quá hạn: tô đặc) | Sửa ngày |
| `cho_buoc_tiep` | xám · xám · xám · ▬ cần | KQ ✓ 7.0 · chờ bước tiếp · hạn 19/09 | **Bước tiếp** | Sửa KQ |
| `xong` | xám ×4 | Xong · Kết thúc học · KQ ✓ 7.5 · thi 05/09 (chữ mờ) | — | Sửa KQ |

"Cần làm" (công tắc trên bảng) = em ở 4 trạng thái có nút việc in đậm ở bảng trên (demo: 5 em); đếm cùng hàm với hàng.

## 5. Thao tác trước → sau

| Thao tác | Trước (web 06/11) | Sau | |
|---|---|---|---|
| Đặt tháng (em chưa có lịch) | nút "Dời tháng" | nút **Đặt tháng**, cùng hộp, cùng API `chuyen-thang` | đổi chữ |
| Dời tháng | nút ngang Chốt ngày, hộp nổi phải, ô trồi | nút chữ phụ; hộp một hàng thẳng cột; "trước: 09/2026" | giữ + dáng |
| Chốt ngày | nút, tô đặc khi tới tháng | nút việc tiếp khi tới tháng; dự kiến tháng sau: nút chữ | giữ |
| Sửa ngày | nút "Sửa ngày" | nút chữ phụ; hộp ghi "Lưu ngày" | giữ |
| Ghi chú tại hàng | ô nhập mọi hàng, mờ "Chưa kết luận", rời ô = lưu | chữ đọc + người · ngày; bấm → ô tại chỗ (Enter lưu · Esc huỷ); trống: "+ Ghi chú" khi rê / focus, 375 trong thẻ | giữ + dáng |
| Ghi chú kèm Chốt / Dời | có | có (cùng giao dịch, OV-15h2) | giữ |
| Ghi kết quả thi thật | không có ở tab | **Ghi kết quả** → `PanelSauThi` | mới lối vào |
| Chọn bước tiếp | không có ở tab | **Bước tiếp** → cùng panel, bước ② | mới lối vào |
| Sửa KQ | không có ở tab | nút chữ "Sửa KQ" → cùng panel | mới lối vào |
| Gia hạn sau thi | Công việc / panel | trong panel (chân) | giữ |
| Hoàn tác sau lưu lịch | không có | "✓ Đã lưu · Hoàn tác" 10 giây | mới |
| Chi tiết em | ▸ dưới hàng, nền xanh, 4 khối co một góc | mũi tên xuống (SVG, mở = lật lên; không dùng "›" vì "›" = đổi trang — G6), hết bề ngang, nền như hàng, 6 trường + TVV | giữ + dáng |
| Lịch sử lịch thi | mọi dòng trong phần mở | 3 dòng mới nhất + "Xem toàn bộ" → panel Lịch sử có sẵn | giữ |
| Khoảng tháng Từ → Đến · lọc Lớp / chi nhánh | có | có, cùng hàng công cụ | giữ |
| Lọc TVV | không có (tên TVV ở dưới tên em) | ô **TVV** cạnh Lớp — bù cho việc bỏ tên TVV ở hàng (critique vòng 2); lọc trên dữ liệu đã nạp, không thêm câu đọc | mới |
| Đếm "b chưa chốt · a đã chốt · dk dự kiến" | chữ cuối hàng công cụ | **Cần làm n · Tất cả n** (bấm lọc được) | thay |
| Xuất Excel đúng danh sách đang hiện | nút đầu trang | giữ; "Cần làm" bật thì xuất đúng em đang hiện | giữ |
| Tên TVV dưới tên em | có | bỏ (ý 5) — TVV ở phần mở chi tiết | bỏ ở hàng |
| Thao tác bị mất | — | không có | — |

## 5b. Luật hàng sau khi lưu (cho session code)

- Lưu xong chỉ sửa hàng đó tại chỗ; **không xếp lại, không tải lại danh sách** trong lúc đang ở tab (hàng không nhảy chỗ giữa buổi họp).
- Em vừa dời ra ngoài khoảng tháng đang xem vẫn ở lại tới khi rời trang / đổi khoảng: chữ "Đã dời sang 11/2026" (đã có ở mã: `doiSang`).
- Số "Cần làm n" tính lại ngay từ dữ liệu đã nạp (cùng hàm với hàng).

## 6. [XM] — cần PTA Plan / chủ SP quyết

1. **[XM-1] Lối vào Ghi kết quả / Bước tiếp từ tab Lịch thi** — mới (trước chỉ ở Công việc, hồ sơ). Khuyến nghị: mở `PanelSauThi` có sẵn (panel phải), KHÔNG
   làm hộp KQ dưới hàng: cùng một form ở mọi nơi, có sẵn Không thi · Lần trước · Gia hạn · Bước tiếp hai hướng. Lệch nhẹ G4 ("một danh sách một kiểu mở"):
   lịch (tháng / ngày) mở dưới hàng, Sau thi mở panel — lý do: việc nhiều thông tin → panel (CLAUDE.md "việc ngắn → hộp nhỏ, việc nhiều thông tin → panel").
2. **[XM-2] Hoàn tác 10 giây sau lưu lịch** — mới (memory "Không khoá cứng": luôn Hoàn tác ngắn). Máy chủ: PUT lại giá trị cũ, có nhật ký; không cần bảng mới.
3. **[XM-3] Bỏ chip `NhanLich` trong cột Lịch thi của tab này** (thay bằng dải + chữ). Luật V4 (badge lịch thi) giữ ở nơi khác (cột Lịch thi tab Tất cả, đầu hồ sơ).
   Hai nơi khác dáng cho cùng dữ liệu — chấp nhận vì tab này là nơi LÀM lịch thi; nếu chủ SP muốn đồng bộ thì đổi tab Tất cả sau.
4. **[XM-4] Ô tháng ONgay có dòng gợi ý "DEC 2026" dưới ô** → trong hộp dùng `gon` (không dòng gợi ý). Code: kiểm mọi chỗ dùng `ONgay kieu="thang"` không `gon` cạnh ô khác.
5. **[XM-5] Em "Xong" (đã chọn bước tiếp) xuống cuối danh sách**, chữ mờ (critique vòng 1: đứng đầu bảng phí chỗ). PTA hiểu luật 29/10 "thi gần nhất trước" là
   kỳ thi CÒN tới / còn việc; em xong không còn kỳ thi tới. Vẫn một danh sách, không tách nhóm. Chủ SP sửa nếu khác.
6. **[XM-6] Gạch hồng trước "VIỆC · THI THẬT"** của panel là dáng `KhungPanel` có sẵn (V5) — giữ, không sửa trong PR này dù V2 nói hồng chỉ để nhận diện.
7. **[XM-7] "Lần trước · MT3"** trong panel Sau thi (`DongLanTruoc` có sẵn) đặt điểm Test cạnh ô điểm Thi — giữ (có sẵn, giúp gõ nhanh).

## 7. Dòng đọc Turso

- Danh sách: vẫn MỘT câu `GET /hoc-vien-lop/lich-thi` theo khoảng tháng. Thêm các cột đã có trên cùng hàng `learning_cycles` cho `trangThaiSauThi`
  (`thi_that_l/r/w/s`, `thi_that_khong_thi`, `buoc_tiep`, `ngay_kq`, `han_sau_thi`, `han_sau_thi_so_lan`) — **không thêm dòng đọc, không thêm câu**.
- Panel Sau thi: như ở Công việc (`/cycles/:id` + `/cycles/:id/buoc-tiep`) chỉ khi bấm. Sau lưu: chỉ sửa hàng đó tại chỗ, không tải lại danh sách (như nay).
- Hoàn tác: một PUT. Không cảnh báo.

## 8. Critique (impeccable, hai bản rà tách riêng: A thiết kế · B máy dò + tương phản)

| Vòng | Điểm Nielsen | P0 / P1 | Đã sửa sau vòng |
|---|---|---|---|
| 1 | 27/40 | 0 / 2 | Nút việc chỉ ở hàng tới lúc (= số "Cần làm"), quá hạn tô đặc · em Xong xuống cuối [XM-5] · cột Việc tiếp sát Lịch thi · dải 3 dáng, mọi đoạn ≥ 3 : 1 · nút đang mở có nền nhấn (không trùng nút với hộp) · 375 có tab Phân công GV, lọc Lớp, vùng chạm 44 · điểm MT 600 |
| 2 | 33/40 | 0 / 0 | Luật hàng sau lưu (5b) · lọc TVV · mũi tên mở chi tiết xuống (bỏ "›") · câu rỗng · hàng chờ bước tiếp có ngày thi |
| 3 | **36/40** | 0 / 0 | câu rỗng g1 nói rõ em chưa có lịch luôn hiện |

- Máy dò (`impeccable detect`): 2 "side-tab" = vạch trái 3 px của hàng đang mở (G14, đã duyệt); 2 "phông ngoài DESIGN.md" = Be Vietnam Pro / Inter (đúng luật);
  còn lại là màu / bo góc của phần chú thích mockup (nền vàng, bảng thao tác) — không lên web.
- Tương phản (B): mọi chữ ≥ 4,5 : 1 cả tối / sáng; đoạn dải sau sửa ≥ 3 : 1.
- P3 giữ lại: "Dự kiến 10/2026" vs "Chưa chốt ngày · tháng thi 09/2026" gần nghĩa (tên lấy từ `nhanLichThi` có sẵn — đổi thì đổi cả web, chưa đổi) ·
  chưa cảnh báo ngày chốt khác tháng dự kiến (không thêm điều kiện chặn — luật 08/10) · "Chỉ xem" lặp từng hàng · chưa đi hàng bằng phím.
