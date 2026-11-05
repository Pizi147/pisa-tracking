# Phân tích — panel có điểm, Test lớp thường gọn, tab Thi thật, mở hết lớp (chủ SP 05/11 trưa)

Nguồn: lời chủ SP 05/11 (plan.md mục 4, dòng "Chủ SP 05/11 trưa") + brainstorming cùng ngày. Trạng thái: **chủ SP duyệt hướng 05/11 ("Ok hết nhé") → mockup → chủ SP duyệt → kế hoạch PR.**

## 1. Vì sao

QL và CX dùng Phân tích để **quán xuyến chất lượng đầu ra** của trung tâm / chi nhánh. Đây là màn **báo cáo thuần** (luật G8): không có thao tác "làm việc tiếp".
Hiện có hai lỗi:
- Bấm số nhưng ra panel chỉ có tên em, không có điểm. Ảnh chủ SP: bản chính 30/10, Test + SOS FT, ô "SOS 3 · W5 OCT".
- Bảng Test lớp thường quá nặng, nhiều cột toàn số 0.

Chủ SP cần thêm một chỗ xem rõ **kết quả thi thật**: đạt / trượt / vượt bao nhiêu, theo từng kỹ năng, theo từng GV.

## 2. Đã chốt (lời chủ SP)

### A. Mọi ô số bấm được ở Phân tích → panel BẢNG có điểm

- Panel liệt kê **danh sách em** rơi vào trường hợp đó, kèm **điểm của chính đợt test tương ứng**: L R W1 W2 S + OVR (FT); lớp thường thì theo môn của chương trình.
- **Bấm vào điểm một kỹ năng** → hiện điểm chi tiết tại chỗ: W / S ra c1–c4, L / R ra số câu đúng / tổng. Dùng cùng kiểu hộp điểm thành phần đã có ở hồ sơ lớp (U03).
- **Điểm mục tiêu rõ hơn:** cột riêng "Kỳ vọng" (FT, theo lượt) hoặc "Target" (thi thật), đặt cạnh điểm. Ô điểm vẫn ✓ / ✗ theo mục tiêu.
- **Ô Tăng / Giữ / Giảm** của "Tiến bộ theo kỹ năng" (Báo cáo HV, Phân tích GV): danh sách em kèm điểm kỹ năng đó bài trước → bài sau và mức chênh, ví dụ "W 5.0 → 5.5 (+0.5)", và mục tiêu.
- **Mẫu nền:** `BangLuotPanel` (`web/src/ui/BangLuotPanel.tsx`, #901). Hiện chỉ ô `dot-test` FT của Test + SOS dùng bảng này. Mở rộng cho MỌI ô số của 6 tab Phân tích. Ô đếm theo HV thì lấy bài gần nhất trong khoảng đang xem. Cột kỹ năng đang xét được tô nền.
- Không còn ô nào mở ra panel chỉ có tên. Session mockup / code **kiểm kê mọi ô số** của 6 tab: ô → loại panel → cột.
- Panel chỉ đọc. Tên em → hồ sơ, "MTn" → đợt test, mã lớp → hồ sơ lớp. Link chữ thường, chỉ gạch chân khi rê chuột.

### B. Test lớp thường gọn

Bỏ ba nhóm cột: **Checkpoint**, **Mini Test**, **Xử lý** (HV - Case · Chưa chốt PA · Đang xử lý — PA đã có ở tab Hiệu quả PA). Giữ: Bài kiểm tra · Progress Test · Final Test · Thiếu điểm. Excel giữ như cũ, trừ khi chủ SP nói khác.

### C. Tab "Thi thật" thay "Kết quả Test"

- **Bỏ phần Mock Test** của tab "Kết quả Test": Test + SOS có panel bảng điểm thì phần này trùng. Tab đổi tên **"Thi thật"**. Xuất Excel kết quả MT giữ ở chỗ hợp lý — ghi vào bảng thao tác trước → sau.
- **Danh sách kết quả thi thật:** giữ như hiện có.
- **Khối thống kê đầu tab** theo bộ lọc chi nhánh · khoảng ngày thi · lớp. Chỉ IELTS; KET / PET không làm (KET-PET-THI-THAT giữ).
  - **Tổng:** số em thi; **Exceed** (OVR > Target) · **Đạt** (OVR = Target) · **Fail** (OVR < Target), mỗi nhóm có số và %. "Không thi" đếm riêng, không vào %.
  - **Từng kỹ năng L · R · W · S:** Exceed · Đạt · Fail theo điểm kỹ năng so **Target overall** của em (PTA chọn — Target chỉ một số), cùng điểm trung bình.
  - **Theo GV — mọi người từng dạy đều tính** (chủ SP): mỗi GV × kỹ năng một dòng: số em, tổng tuần dạy, điểm TB, % Exceed / Đạt / Fail.
    - **Tính theo trọng số tuần (chủ SP: "nếu rối quá thì thôi"; PTA thấy làm được):** trọng số = tuần GV dạy kỹ năng đó cho em ÷ tổng tuần em học kỹ năng đó trong lộ trình, tính đến ngày thi.
    - Nguồn: `teacher_assignments` (class, skill, effective_from / to) giao `enrollments` (started_at / ended_at) của em trong lộ trình.
    - Phân công cũ thiếu ngày kết thúc → session đếm trên bản sao 29/10, báo PTA. Nếu dữ liệu xấu thì rơi về "mỗi GV từng dạy = 1 em" và ghi rõ.
  - Mọi số bấm được → panel bảng: em · lớp · ngày thi · L R W S · OVR · Target (✓ / ✗). Panel GV thêm cột "tuần dạy / tổng (8/12 · 67 %)".
- Thi lại một kỹ năng (#969): em thi lại W → kỹ năng lấy lại (L R S) **không** tính là một lần thi mới của kỹ năng đó trong thống kê kỹ năng / GV (PTA chọn: chỉ kỹ năng thi lần này). OVR vẫn tính như kết quả thi thật.

### D. Mở hết lớp (QL + Quản trị)

Kế hoạch Test và Lịch Test tuần: một nút đổi **"Mở tất cả lớp" / "Thu gọn tất cả"**, chỉ QL và Quản trị thấy. Mặc định vẫn gập. Dùng mẫu nút sẵn có (như #4 U04 HV & Lớp) — không cần mockup riêng, nhưng mockup vẽ vị trí nút cho đồng bộ.

### E. PTA tự quyết sau khi rà (chủ SP xem lại được)

- **Ô số không phải điểm** (vi phạm ở Ý thức, PA ở Hiệu quả PA, bài chấm đúng hạn ở Phân tích GV): giữ nội dung riêng của panel (vi phạm / PA / bài chấm). Mỗi dòng phải có đủ thông tin liên quan: em · lớp · ngày / tuần · nội dung · trạng thái / kết quả. Không thay bằng bảng điểm. Không panel nào chỉ có tên.
- **Ai thấy khối "Theo GV" của tab Thi thật:** QL, Quản trị, CX (chủ SP: "bộ phận quản lý, CX cần"). TVV và GV thấy Tổng + Từng kỹ năng. Máy chủ chặn đúng vai, không chỉ ẩn trên web.
- **W1 / W2 do hai GV dạy:** trọng số tách theo task; kỹ năng W của thi thật chia đều cho hai task.
- **Em KCK** (không cam kết Target): không vào % Exceed / Đạt / Fail, giống luật hiện tại.

### F. Chủ SP chốt sau builder check (05/11, "Ok hết nhé")

- **Thay luật C10** (thi thật cho GV, 22–24/10: chỉ GV lớp cuối; OVR đạt → mọi kỹ năng Đạt; Vượt gộp Đạt) bằng luật mới ở **cả ba nơi**: tab Thi thật, Phân tích GV (cột thi thật, `giaoVien.ts` `mucThiThat` / `thiThatCuaGv`), hồ sơ GV.
  - Mọi GV từng dạy đều tính, có trọng số tuần.
  - Từng kỹ năng so Target overall.
  - Tách Exceed · Đạt · Fail.
  - **Một hàm dùng chung** cho cả ba nơi. PR kèm SQL chỉ đọc so số từng GV trước → sau.
- **Bỏ phần Mock Test** của tab Kết quả Test, kể cả 3 thao tác: chip SOS → panel Case, lọc "Mọi kết quả", xếp theo SOS. Lý do: Test + SOS đã chia cột theo mức SOS; Case xem ở hồ sơ (tên em trong panel dẫn tới); không panel lồng panel. Ghi vào bảng thao tác trước → sau.

## 3. Ràng buộc

- Luật CLAUDE.md:
  - một màn một PR;
  - giữ mọi thao tác cũ, có bảng thao tác trước → sau;
  - hình ảnh theo mockup sát;
  - mật độ M1–M10 (`docs/superpowers/specs/2026-11-05-mat-do-thong-tin/de-xuat.md`);
  - hạn chế chữ thừa.
- **Turso:** panel chỉ tải khi bấm. Thống kê thi thật không quá vài câu cho cả tab. Ước số câu / dòng cho từng đường trong đặc tả PR.
- Một hàm tính cho mỗi số (G-10): số trên ô = số dòng trong panel.

## 4. Để người làm quyết

Cách vẽ bảng thống kê (bảng hay ô số + thanh tỷ lệ), thứ tự khối, cách hiện trọng số, 375 xếp thẻ.
Đề xuất trong mockup; thanh tỷ lệ chỉ khi chủ SP thấy dễ đọc hơn.
