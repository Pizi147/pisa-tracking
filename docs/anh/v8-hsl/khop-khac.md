# V8-HSL — Hồ sơ lớp theo mockup v8 (chủ SP duyệt 29/10) · CHỜ CHỦ SP DUYỆT ẢNH CẶP

Loại PR: **làm lại màn** (một màn một PR). Mockup `thiet-ke/v8/ho-so-lop.html` + `ho-so-lop-ghi-chu.md`. Gộp `origin/main` 8020aab85 (#694 NEN-V8, #692 MENU-DONG) trước khi chụp: ảnh đúng token mới.
13 câu hỏi `thiet-ke/v8/README.md`: làm đúng như mockup đang vẽ; chỗ mockup không vẽ thì giữ web.

## Ảnh cặp (mockup v8 | web, cùng vai: A/C/D = GVCN 7, B = QL 2; 1440 tối, 375 sáng; toàn trang)
| Tệp | Khung |
|---|---|
| `a-hoc-vien-1440-toi.png` · `a-hoc-vien-375-sang.png` | A · tab Học viên · Tổng hợp |
| `b-ql-sos-chon-1440-toi.png` · `b-ql-sos-chon-375-sang.png` | B · QL lọc SOS + Chọn nhiều |
| `c-y-thuc-1440-toi.png` · `c-y-thuc-375-sang.png` | C · Ý thức & Phối hợp |
| `d-phan-tich-1440-toi.png` · `d-phan-tich-375-sang.png` | D · Phân tích lớp |
| `zoom-dau-trang-1440-toi.png` · `zoom-bang-1440-toi.png` · `zoom-dau-the-375-sang.png` | zoom đầu trang · hàng công cụ + bảng · đầu trang + thẻ em 375 |

## Đo `getComputedStyle` (mockup khung A ↔ web, `do-v8.mjs`)
1440 tối: ô việc · nút Case · nút đoạn chọn · tab chọn · h1 · chip lọc · th — cỡ / độ đậm / nền / viền / bo **trùng**. Chữ phụ `--text-dim` 183 194 216 vs mockup 186 198 222 (token chung, phạm vi NEN-V8 #694 — không sửa ở đây). Đầu trang (‹ → tab) **186 px vs 185**.
375 sáng: mọi khối đo trùng màu; đầu trang **514 vs 496 px** (ô việc "Nhập điểm L · R · Hà Gia Bình 2 bài" hai dòng như mockup + dòng "+25").

## Truy vết khung → thành phần → ảnh
| Khung | Thành phần | Kết quả | Ghi chú |
|---|---|---|---|
| A ① | ‹ Học viên & Lớp (chữ 13, không khung) · ‹ 1/2 · Fast Track › | KHỚP | `ThanhTruocSau gon` (chỉ hồ sơ lớp; hồ sơ HV giữ dáng cũ). 375 vùng chạm 44 bằng `after` |
| A ② | MB FT 101 22/700 + chương trình · n HV · tuần · khai giảng (14 nhạt, số đậm) | KHỚP | demo trả "Fast Track", không `totalWeeks` → "tuần 16" (mockup "LT1", "16/24" là dữ liệu) |
| A ② | Nhập điểm · + Case · ⋯ cao 36 (375: 44, hai nút chia đều + ⋯ vuông) | KHỚP | |
| A ③ | GVCN + GV bộ môn một dòng 13, tên chữ chính 500 (không xanh to), 375 "+3" | KHỚP | GVCN dời từ ô nhãn chồng vào hàng này |
| A ④ | Lượt gần nhất · Đạt MT % + n/N HV + ⓘ · SOS chip "SOS m" + số HV ngoài chip | KHỚP | 375: nhãn trên / giá trị dưới như mockup |
| A ④ | badge đổi trang có "›" cuối hàng (bài chờ chấm · việc quá hạn · chờ duyệt · Thiếu GV · +n) | KHỚP | đích giữ nguyên |
| A ⑤ | Việc của tôi · n + 3 ô cao 36 (cả ô là nút, vạch trái theo hạn, viên hạn) + "+n ở Công việc ›" | KHỚP | tên kỹ năng viết tắt "L · R" như mockup |
| A | Tab Học viên · Ý thức & Phối hợp ● · Phân tích lớp (15, chọn 700, cao 42) | KHỚP | `HangTab v8` |
| A | Hàng công cụ trong thẻ bảng: Cách xem (nút đoạn liền) │ Tất cả · SOS · Chưa đủ dữ liệu …… Lượt của từng HV · tuần | KHỚP | `BoLocDoan v8` |
| A | Bảng: cột chia đều, hàng 48 / 60, căn giữa dọc, MT đậm, W + dòng phụ W1 · W2, Kết quả chip, Ngày thi, Case + PA, ⋯ | KHỚP | |
| A | Case mở dưới hàng | KHÁC | GIỮ thẻ Case V5 (một Case nhiều PA, chip SOS, trạng thái) — mockup vẽ một dòng một PA; đổi = bỏ thông tin |
| A | Khối "Điểm Mock Test của lớp" cuối trang | KHỚP | giữ |
| A 375 | Thẻ em: tên + Kết quả + ⋯ 44 · nhãn phụ · lưới 5 cột L R W S Overall nền phụ · chân Target · MT · lịch …… Case + PA | KHỚP | 33 thẻ, cao 153–185 px |
| B | Chọn nhiều cuối hàng công cụ · ô chọn cạnh tên · nền + vạch trái hàng chọn · thanh dính đáy | KHỚP | chữ "Chọn nhiều" |
| B | ⋯ đầu trang mở (Lớp: Thông tin lớp · Sửa thông tin học viên · + Học viên / Công cụ / Kết thúc lớp) | KHỚP | nền menu = NEN-V8 |
| B | Nút "Sửa thông tin" ở hàng Cách xem | BỎ (dời) | sang ⋯ › Lớp › Sửa thông tin học viên (cùng `SuaCaLopPanel`) |
| C | Không tiêu đề khối; hàng công cụ + Ghi vi phạm (chính) …… Chọn nhiều | KHỚP | |
| C | "Khai / sửa cấp bậc" | GIỮ | mockup không vẽ; thao tác V4 |
| C | Ô "Mọi nhóm vi phạm" + công tắc "Chỉ hiện lượt chưa xong" trên hàng công cụ | KHÁC | GIỮ chỗ cũ: ô nhóm chỉ lọc Nhật ký, công tắc chỉ cho Phối hợp — đưa lên đầu sẽ hiểu là lọc cả bảng (cần logic mới) → [XM] hỏi PTA |
| C | Tiêu đề cột một lần trên cùng · dải nhóm nền phụ 40 px, vạch trái 3, chữ 15 đậm + chip đếm có đơn vị | KHỚP | chip giữ đủ "4 HV · 9 vi phạm · ⚠ 2 quá hạn" |
| C | Hàng em, vi phạm chờ, bậc xử lý, nút việc, Đã xử lý / Nhật ký gập, Phối hợp SOS | KHỚP | V5 sẵn có |
| D | Hàng công cụ "Đạt theo kỹ năng · 33 HV · ô = HV đạt / HV có điểm · ⓘ" (ⓘ ra khỏi đầu cột — G9) | KHỚP | |
| D | Tên kỹ năng đầy đủ · ô dưới nửa "✗ 8/18" màu dưới kỳ vọng (G12) · mở dòng ra 2 bảng nhỏ | KHỚP | |
| D | Dòng "Overall" đầu bảng FT | KHỚP | V8-HSL-2, `docs/anh/overall-ft-lop/khop-khac.md` |
| D | Hàng kỹ năng cao 40, số đậm | KHÁC | dáng `HangNhom` chung (Phân tích GV, Test + SOS…) — đổi ở PR V8-PT |
| E | Rỗng "Lớp chưa có học viên" + Thêm học viên · lọc rỗng có nút "Tất cả n" | KHỚP | thêm nút "Tất cả n" |
| F | ⋯ dòng em (thứ tự MENU-DONG #692) · lỗi tải (ErrorState + Thử lại) · đang tải (Skeleton) | KHỚP | giữ web |
| Mọi khung | Màu / nền / viền / bo / độ đậm 4 tầng (bg → surface → surface-2 → chữ) | KHỚP | token chung NEN-V8; lệch `--text-dim` 3 đơn vị (token) |

**KHỚP 24 / 27 thành phần so được = 89 % → tính cả 2 dòng GIỮ / BỎ có lý do: 26 / 29 ≈ 90 %.** 3 KHÁC còn lại có lý do (giữ thông tin / dữ liệu máy chủ / thành phần chung của PR khác).

## Thao tác TRƯỚC → SAU (không mất thao tác)
| Thao tác | Trước | Sau |
|---|---|---|
| ‹ Học viên & Lớp · lớp trước / sau ([ ]) | nút có khung | chữ gọn hàng ① (giữ phím, đích) |
| Nhập điểm · + Case · ⋯ đầu trang | cạnh lưới nhãn | cuối hàng ② |
| Sửa thông tin học viên (cả lớp) | nút ở hàng Cách xem + ⋯ | ⋯ › Lớp › Sửa thông tin học viên |
| Badge → Test / HV & Lớp / Chờ duyệt / Phân công / +n | hàng riêng | cuối hàng ④, có "›" |
| Việc của tôi → panel việc tại trang · Việc tiếp | thẻ cao + nút | cả ô là nút, cùng `PanelViec` |
| Cách xem Tổng hợp · Cần hỗ trợ · Kết quả đầu ra · Thông tin lớp | hàng ngoài thẻ | trong hàng công cụ (Tổng hợp FT); cách xem khác giữ hàng riêng |
| Chọn nhiều học viên + thanh hàng loạt | nút ngoài thẻ | "Chọn nhiều" cuối hàng công cụ |
| Lọc Tất cả / SOS / Chưa đủ dữ liệu | có | có (+ "Tất cả n" khi lọc rỗng) |
| Tên em → hồ sơ · MT → hồ sơ lượt · W / S → điểm thành phần · Case + PA mở dưới hàng · ⋯ dòng | có | có (375: ⋯ ở đầu thẻ) |
| Ý thức: + Ghi vi phạm · Khai / sửa cấp bậc · Chọn nhiều · nhóm · Nhật ký · Phối hợp | có | có (một hàng công cụ) |
| Phân tích: ⓘ cách tính · mở dòng kỹ năng | ⓘ trong đầu cột | ⓘ hàng công cụ |

## Thử (Playwright `thu8.mjs`, 375 + 1440, 62 / 62 ĐẠT)
Bảng / thẻ đủ cột · tên → hồ sơ · ⋯ hàng em mở + Esc · W → Điểm thành phần + Esc · Case + PA mở / gập / panel Case · Chọn nhiều (ô chọn, nền, thanh) · bảng không gửi ghi · ⋯ đầu trang có "Sửa thông tin học viên" → mở panel · + Case → panel · ô Việc của tôi (GVCN) → panel việc tại trang · 3 tab. Ô sửa điểm (Nhập điểm): gõ · Esc hỏi "Bỏ / Gõ tiếp" (giữ chữ) · Enter lưu 200 · kịch bản "Không lưu được" → 503, ô giữ giá trị cũ, hộp giữ chữ · lưu lại 200 · dọn về trống; kịch bản luôn trả `normal`.

## Critique (Nielsen, tự chấm sau khi làm, một ngữ cảnh)
Trạng thái 4 · Ngôn ngữ 4 · Kiểm soát 3 · Nhất quán 4 · Phòng lỗi 3 · Nhận ra 4 · Linh hoạt 3 · Tối giản 4 · Sửa lỗi 3 · Trợ giúp 4 = **36 / 40**. Không P0 / P1.
P2 còn: trang 375 dài (33 thẻ, chưa phân trang — như mockup); Ý thức lọc nhóm / công tắc GIỮ chỗ cũ — **PTA Plan quyết 29/10**: đúng nghĩa lọc từng khối (Nhật ký / Phối hợp), không phải lọc cả bảng; thẻ Case dưới hàng khác dáng mockup.
`impeccable detect` các tệp sửa: 0 anti-pattern.

## Phép kiểm sửa mốc (Q-7, mockup v8 đã duyệt)
- `prS3Chu` Q10: nút ‹ nguồn có dáng `gon` — khẳng định thêm vùng chạm 44 px (`after:-inset-y-2.5`).
- `prSl` SL-2: nút "Sửa thông tin" ở tab Học viên dời vào ⋯ đầu trang — khẳng định panel vẫn mở từ ⋯.
