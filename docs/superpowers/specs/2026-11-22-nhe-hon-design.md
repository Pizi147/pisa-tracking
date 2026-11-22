# NHẸ HƠN (22/11) — web nhẹ, trực diện, panel rộng; Công việc Admin theo lớp

Nguồn: chủ SP 22/11, 16 ý kèm 11 ảnh demo main (nguyên văn ở `plan.md` mục 4, khối "Chủ SP 22/11 (11 ảnh demo main…)"). Brainstorm cùng PTA Plan, chủ SP duyệt từng phần trong chat 22/11.

Đặc tả này phủ các ý **4, 13, 15, 16** và phần đổi bố cục của **1, 6, 9b, 10b**. Các ý sửa không đổi bố cục (2, 3, 5, 7, 8, 9a, 10a, 11, 12, 14) do session SUA-2211-A / SUA-2211-B làm riêng. Đợt này không đổi luật nghiệp vụ hay quyền, và giữ mọi thao tác trừ chỗ chủ SP bảo bỏ (nút "+ Ghi chú" ở Cuối khoá).

## 0. Chủ SP đã chọn (22/11)

| Câu | Chọn |
|---|---|
| Dày ở đâu (GV / TVV) | Cả bốn: chip / nhãn màu · dải số đầu trang · chữ phụ / Quy chế · panel hẹp, cuộn nhiều. Theo quy tắc **60-30-10**; **giữ badge tính chất** |
| Dải số đầu trang GV / TVV | Chỉ còn "n việc · m quá hạn" |
| Panel làm việc | Cao từ dưới thanh menu tới đáy, rộng ~55–60 %, đầu panel 1 dòng, chân mỏng |
| Công việc Admin | ~~Theo lớp~~ → chủ SP 22/11: "Thôi công việc vẫn nên để phân loại theo loại công việc đi chứ không để theo lớp nữa nhé, còn nếu làm theo lớp thì cần phải phân biệt rõ ràng đầu mục việc ra" → **theo loại việc**, mỗi dòng "còn thiếu gì" trước, người phụ trách sau |
| Cách làm | **Sửa khung chung trước**: một bộ mockup chung → PR khung chung → mỗi màn một PR |

## 1. Nguyên tắc nhìn (mọi màn)

- **60-30-10:**
  - 60 % nền trung tính.
  - 30 % bề mặt thẻ / bảng và chữ phụ (màu nhạt).
  - 10 % màu nhấn, chỉ cho nút chính của việc và trạng thái cần xử lý (quá hạn, chưa đạt, SOS 2–3).
  - Mỗi dòng có tối đa **một** điểm màu nổi.
- **Chữ:**
  - Chữ thường 15 → **14 px**.
  - Thang mới 12 · 13 · 14 · 16 · 20 · 26, thay 12 · 13 · 14 · 15 · 17 · 22 · 28 ở `web/src/index.css:200` và `DESIGN.md`.
  - Bảng và lưới điểm 13–14 px.
  - Vùng bấm ở 375 vẫn ≥ 44 px.
- **Badge tính chất giữ, gom một kiểu:**
  - SOS, Đạt / Chưa đạt, kỹ năng L R W S, mã tuần.
  - Mặc định viền mảnh, không nền. Chỉ SOS 2–3 và "quá hạn" có nền màu.
  - Dòng việc tối đa **2 chip**.
- **Chữ phụ:**
  - Bỏ hàng "Quy chế …" ở chân panel và câu giải thích lặp; luật vào ⓘ (theo luật Bỏ chú thích 07/11).
  - Dòng phụ dưới tên việc chỉ giữ thông tin phân biệt: em / lớp / tuần / số bài.
- **Luật bảng chung:**
  - Cột tên đủ rộng, tên HV không cắt (N55).
  - Cột số / điểm hẹp và đều; cột kết quả co theo nội dung.
  - Không điều khiển trong tiêu đề bảng; mã tuần một dòng.
  - Áp cho Lịch Test, hồ sơ lớp, Phân tích, lưới điểm.

## 2. Khung panel làm việc (`web/src/ui/KhungPanel.tsx`, mọi panel)

- **Chiều cao:** từ ngay dưới thanh menu tới đáy khung nhìn; không hở trên.
- **Chiều rộng ở 1440:**
  - Panel việc thường ~55–60 %, thay 480 / 720 px. Danh sách việc bên trái vẫn thấy.
  - Panel bảng / lưới (chấm điểm, Cuối khoá, `bang`, `vua`) ~75 %.
  - 375: toàn màn.
- **Đầu panel một dòng:**
  - Tên việc · tên em · lớp · hạn, dàn ngang (xuống dòng khi thiếu chỗ).
  - Bỏ dòng nhãn "Việc · …" phía trên.
  - ⋯ và ✕ ở góc, thẳng hàng (≤ 1 px).
- **Chân panel một hàng mỏng:**
  - Trái: trạng thái lưu ("Đã lưu 15:52 · Hoàn tác").
  - Phải: tối đa 2 nút ("Lưu" · "Lưu · việc tiếp ›").
  - Không còn hàng "Quy chế".
- **Thân:**
  - Nội dung chính (ô nhập, lưới) ngay dưới đầu panel.
  - Khối phụ (Phụ trách · Hạn · Mô tả · Theo dõi, Lịch sử) gập sẵn thành một dòng tóm tắt, bấm mở.

## 3. Các màn

- **Công việc GV / TVV:**
  - Đầu trang: "Công việc · n việc · m quá hạn"; bỏ dải số.
  - Dòng việc: tên (đậm) · một dòng phụ · hạn (đỏ chỉ khi quá hạn) · một nút.
  - Mỗi lớp một dòng (SUA-2211-B đã tách "Cả lớp").
  - Bảng "HV của tôi" (TVV) gọn: tên · lớp · một chip trạng thái.
- **Công việc MỌI VAI — THEO LOẠI VIỆC (chủ SP 22/11: "công việc của admin? ý tôi là công việc của tất cả mọi vai ấy chứ?"):**
  - Mọi vai (GV, GVCN, TVV, Head, QL, Admin, CX, BPXL, QT) giữ phân loại theo loại việc như hiện nay (tab / nhóm: Chấm điểm · Case · Ý thức & Phối hợp · Báo PH · Sau thi · Bổ sung hồ sơ · Vận hành…), KHÔNG gom theo lớp.
  - Đầu mục mỗi loại việc tách bạch rõ: tiêu đề nhóm nổi + số việc · quá hạn; không trộn loại việc trong một dòng.
  - Trong một loại việc: mỗi dòng một lớp / em cụ thể (không "Cả lớp"), nói **thứ còn thiếu trước** (vd "MB FT 101 · W2 SEP · thiếu 5 điểm"). Người phụ trách ghi nhỏ cuối dòng, chỉ khi người xem không phải người phụ trách (Head / QL / Admin / CX xem "Tất cả").
- **Riêng Admin (ý 15):** góc nhìn vận hành — đủ điểm / đủ báo cáo / lịch thi / hồ sơ trước, người phụ trách sau; tối giản bớt chip / chữ phụ, bớt phần GV-centric (số liệu theo GV để ở Head).
  - Head giữ phần GV như hiện nay.
  - Dữ liệu dùng chung nguồn đếm với `/my-work` (cùng hàm). Mockup + kế hoạch code phải ước câu / dòng Turso, và không thêm câu theo từng lớp.
- **Panel chấm điểm:**
  - Rộng ~75 %. Mỗi lớp một khối, đầu khối nổi rõ: lớp · tuần · kỹ năng · số bài.
  - Lưới: cột tên + ô điểm + kết quả, không khoảng trống thừa.
- **Lịch Test tuần:**
  - Bảng lớp dùng một bộ cột cố định (lớp · đợt · môn · hạn · tiến độ · trạng thái).
  - Lưới mở ra dùng cùng cột tên, thẳng hàng giữa các lớp.
- **Cuối khoá:**
  - Thanh thao tác một hàng: chọn → Bước tiếp → Lớp → Tuần.
  - Dòng em: tên · điểm gọn · bước tiếp · lớp mới.
  - Bỏ nút "+ Ghi chú" (chủ SP: "không cần thiết"); ghi chú cũ nếu có vẫn hiện.
  - Khối kỳ vọng FT gọn một dòng.
  - Ô tick theo theme (SUA-2211-A).
- **Thang Ý thức:**
  - Một thanh bước ngang không xuống dòng: chấm + tên ngắn (R1 · R2 · WL1 · R4+M · R5 · WL2 · R7).
  - Bậc đang ở nổi; bậc đã qua có dấu ✓.
  - Tên đầy đủ khi rê chuột / trong ⓘ.

## 4. Cách làm

1. Chủ SP duyệt đặc tả này.
2. Session mockup (Opus 5.5 · medium; B: Sonnet 5.5 · high) vẽ `thiet-ke/v23/`:
   - Màn: khung panel (việc thường + bảng) · Công việc GV · Công việc TVV · Công việc Admin theo loại việc · panel chấm điểm · Lịch Test tuần · Cuối khoá · thang Ý thức.
   - Mỗi màn 1440 tối + 375 sáng, đủ trạng thái: rỗng / có việc / quá hạn / đang lưu / lỗi.
   - Cổng chất lượng mockup: critique ≥ 35, không P0 / P1. PTA rà theo từng ý của tệp này trước khi gửi.
   - Chủ SP duyệt mockup.
3. Code:
   - PR khung chung trước: thang chữ + token, `KhungPanel`, chip chung, luật bảng.
   - Sau đó mỗi màn một PR có bảng truy vết khung → thành phần → ảnh. Ảnh cặp mockup │ web; chủ SP duyệt trước merge, không merge qua đêm.
   - Giữ thao tác cũ: bảng TRƯỚC → SAU, mất thao tác nào phải có lý do.
   - Turso trước → sau mỗi PR.

## 5. Nghiệm thu

- Panel việc thường ở 1440 không phải cuộn để thấy nút chính với việc ngắn (Báo PH, Bổ sung hồ sơ, xác nhận).
- Đầu + chân panel cộng lại ≤ ~120 px.
- Dòng việc GV / TVV: ≤ 2 chip, ≤ 1 điểm màu nổi; đầu trang chỉ "n việc · m quá hạn".
- Lịch Test: các lớp thẳng cột; tên HV không cắt ở mọi bảng (đo `do-khung` / `do-bang` 1440 · 1280 · 375).
- Admin: theo loại việc, đầu mục tách rõ; việc đủ không hiện; số "thiếu" khớp hồ sơ lớp / Công việc (cùng hàm).
- Chữ thường 14 px khắp nơi; không tràn ngang ở 375.
