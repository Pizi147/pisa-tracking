# NHAP-DIEM-TU-DO — nhập điểm thoải mái, Huỷ điểm một kỹ năng (thiết kế)

PTA Plan · 14/11/2026 · chủ SP chốt luật (plan.md mục 4, dòng "Chủ SP 14/11 (nhập điểm GV — brainstorming)" và "ba việc"); chủ SP giao PTA chọn cách làm → **A**.

## 1. Ý định (lời chủ SP)
"Nhập điểm thoải mái, sửa thoải mái, GV nhập có quyền ghi vắng, bỏ vắng, hủy điểm = xóa khỏi danh sách điểm trong kĩ năng MT, coi như không làm - và có thể khôi phục." · "chỉ hủy 1 kĩ năng thôi" · "nếu muốn xóa điểm bình thường thì chỉ cần xóa chỗ nhập đi xong lưu là được" · "sao cứ sửa đi sửa lại mãi thế?" → mọi nơi phải tính theo MỘT luật.

Đầu ra: GV tự làm xong phần điểm của mình, không phải nhờ QL; số "chờ nhập / quá hạn" ở mọi nơi đúng với thực tế (huỷ rồi thì không còn nợ).

## 2. Hiện trạng đã kiểm (rà mã 14/11)
- Sửa / xoá điểm đã lưu: GV làm được (LUAT-34 bỏ khoá). Bỏ vắng: làm được mọi lúc.
- **Huỷ điểm** (`keHoachTest.ts` `huyDiem`) = ghi null vào ô + cất điểm cũ (`ket_qua_huy`). `attempt_skills` không đổi → kỹ năng vẫn `due`, quá hạn, quay lại việc "Nhập điểm", nợ chấm, Lịch Test. **Đây là lỗi chủ SP gặp.**
- Ba nút gần giống nhau: Huỷ điểm (xoá ô) · Huỷ môn (`huyTay`, lớp thường, cần ≥ 1 "-", `sit_status=cancelled`) · Xoá kỹ năng (`setSkillScope` `required=0`, chỉ QL, chỉ FT, khoá N15).
- Chỗ chặn GV: chưa tới tuần Test → 400 "nhờ QL dời về tuần này" · hộp nhập ở chế độ vắng ẩn ô điểm, bắt "Bỏ vắng" trước · lớp thường: ô có điểm không nhận "-", ô vắng / huỷ không có ô nhập, sửa điểm qua hộp riêng `SuaDiemCoLyDo`, 375 không có ⋯ · Mock: GV môn không có ⋯ "Vắng" · ô chỉ đọc luôn ghi "Bạn không được phân công kỹ năng này" · xoá ô rồi nhập lại bị tính muộn (`nhap_dau_ngay` về null) · lớp thường ⋯ "Nhập điểm" mở hộp rỗng · lớp thường nhập điểm vào môn đã Huỷ môn vẫn "Đã huỷ".

## 3. Mục tiêu · không làm · thất bại
- Mục tiêu: (a) một hành động **Huỷ điểm** cho đúng một kỹ năng / môn của một em trong một lượt, ai nhập được ô thì làm được, khôi phục được; (b) huỷ = không còn nợ ở MỌI nơi; (c) bỏ các chỗ chặn ở mục 2; (d) Mock, MT0, lớp thường cùng một cách.
- Không làm: không đổi luật vắng N38 (MT0 / Mock lần 2 tự huỷ; Progress / Final lớp thường không tự huỷ) · không đổi quyền ai được nhập môn nào · không đổi "Thi lại", "Dời hạn chấm" (QL).
- Thất bại dù chạy được: còn nơi nào báo quá hạn / chờ nhập cho kỹ năng đã huỷ; Khôi phục mất điểm cũ; GV phải nhờ QL cho việc thường ngày.

## 4. Các cách đã cân nhắc
| Cách | Nội dung | Được | Mất |
|---|---|---|---|
| **A (chọn)** | Một trạng thái "Đã huỷ" của kỹ năng (`attempt_skills.sit_status='cancelled'` + cờ huỷ tay), dùng chung Mock / MT0 / lớp thường; điểm cũ cất `ket_qua_huy`; gộp Huỷ môn + Xoá kỹ năng vào "Huỷ điểm" | một luật, một tên, mọi nơi đã loại `cancelled` khỏi nợ / quá hạn (`viewSkill`, `NOT_DEBT`, Lịch Test) | sửa nhiều chỗ một lần |
| B | Mở `setSkillScope` (Xoá kỹ năng, `required=0`) cho GV | ít sửa | không áp lớp thường (luật 4 môn), Khôi phục thiếu điểm cũ, vẫn 3 nút |
| C | Chỉ vá chỗ tính quá hạn bỏ qua ô đã huỷ điểm | nhanh | vẫn 3 nút, chỗ chặn còn nguyên, dễ phải sửa lại |
Chủ SP giao PTA chọn → A.

## 5. Thiết kế (A)
### 5.1 Huỷ điểm (một kỹ năng)
- Ai: người nhập được ô đó (GV môn; GV Speaking cho S chéo), GVCN lớp, QL. Kiểm ở máy chủ.
- Làm: ô có điểm → cất điểm cũ vào `ket_qua_huy` (đường `catDiemO` sẵn có); đặt `sit_status='cancelled'`, cờ huỷ tay (dùng lại `huy_vang` + `skill_huy_tay` của #1601 hoặc một cờ rõ tên — người code chọn, ghi lý do); nhật ký + lịch sử ghi ai · lúc · lý do (tuỳ chọn).
- Không hộp xác nhận; toast "Đã huỷ {kỹ năng} · Hoàn tác" 10 giây; sau đó vẫn **Khôi phục** từ ⋯.
- Writing hai task: huỷ theo ô người chọn (W1 / W2) như hiện tại, mỗi ô là một "kỹ năng" để huỷ.
- Một đường máy chủ cho mọi loại bài (gộp `huyDiem` + `huyTay`; `setSkillScope` chỉ còn dùng cho thao tác lập lịch của QL nếu nơi khác cần — người code grep, không để hai nút cùng nghĩa trên giao diện).
### 5.2 Khôi phục
- Về đúng trạng thái trước khi huỷ: tuần cũ, số lần vắng cũ, điểm cũ (từ `ket_qua_huy`, giữ ngày nhập đầu). Ô đã có điểm mới → hỏi một lần (giữ như `khoiPhucDiem`).
### 5.3 Nợ / quá hạn
- Kỹ năng "Đã huỷ" không vào: việc "Nhập điểm" (`myPendingDetail`, `/my-work`, hồ sơ HV `viecHocVien`), nợ chấm (`scoreDebt`), Lịch Test (`canCham`), chuông, Phân tích, chip / badge. Một hàm quyết "còn phải nhập" dùng chung (nếu chưa có thì tạo, mọi nơi gọi).
- Kết quả bài: tính trên kỹ năng còn lại (đã có cho lớp thường — LG-9b `evaluateRegular` `daHuy`; áp cùng ý cho Mock / MT0 overall nếu chỗ đó đang để trống — ghi rõ trong PR).
### 5.4 Xoá điểm thường
- Xoá trắng ô + Lưu = bỏ điểm, kỹ năng về "chờ nhập" như cũ (nợ quay lại là đúng). **Không** reset ngày nhập đầu (nhập lại không bị tính muộn).
### 5.5 Bỏ chỗ chặn
- GV nhập điểm khi chưa tới tuần Test: máy tự dời kỹ năng về tuần này, không hỏi, không cần QL (N15 đã cho "nhập điểm" là ngoại lệ).
- Gõ điểm đè "-": lưu điểm, coi như đã làm bài, không hỏi.
- Gõ "-" đè điểm: cất điểm cũ, ghi vắng, toast Hoàn tác thay hộp hỏi.
- Hộp nhập ở chế độ vắng: vẫn có ô điểm.
- Lớp thường dùng chung cách nhập với Mock: ô vắng / huỷ có ô nhập; sửa điểm tại chỗ (bỏ hộp `SuaDiemCoLyDo`, lý do tuỳ chọn ở ⋯ nếu cần); ô có điểm nhận "-"; 375 có ⋯.
- GV môn có ⋯ "Vắng" ở Mock như GVCN.
- Ô chỉ đọc nói đúng lý do (chưa phân công · lượt đã huỷ · …).
- Bỏ mục ⋯ "Nhập điểm" mở hộp rỗng (lớp thường).
- Nhập điểm vào môn "Đã huỷ" → tự bỏ huỷ, môn thành có điểm.
### 5.6 Giao diện
- ⋯ của ô: Vắng / Bỏ vắng · **Huỷ điểm** / **Khôi phục** · (QL) Dời lịch · Dời hạn chấm · Lịch sử. Nhãn đỏ cho Huỷ điểm. Ô "Đã huỷ": chữ "Đã huỷ" màu mờ (không ⚠, V22).
- Hướng dẫn "?" (GV, QL) sửa theo.

## 6. Ràng buộc
- Turso: mở trang 0 câu thêm; Huỷ / Khôi phục ≤ trần `huyTay` hiện có (60). Có trần trong `tocDoDuong.ts`.
- Chống mất dữ liệu: điểm cũ luôn cất trước khi huỷ / ghi "-" đè; phép kiểm Khôi phục trả đủ.
- Thử trên bản chép thật (mig.sqlite): huỷ / khôi phục Mock, MT0, Final lớp thường; số nợ trước → sau.
- `/security-review` (đường máy chủ đổi quyền).

## 6b. Quyết định PTA sau rà người đọc (14/11)
- **Writing:** Huỷ điểm áp cho CẢ kỹ năng Writing (một dòng `attempt_skills`), không huỷ riêng W1 / W2 ("chỉ hủy 1 kĩ năng"). Bỏ ý "mỗi ô là một kỹ năng" ở 5.1. Bỏ một task vẫn qua "Học một task" (N13) sẵn có.
- **Một trạng thái "Đã huỷ":** huỷ tay và huỷ do vắng lần 2 (N38) cùng là "Đã huỷ"; Khôi phục / nhập điểm vào ô đã huỷ áp như nhau, ai nhập được ô thì làm được. Khôi phục kỹ năng huỷ do vắng → về tuần trước lần vắng thứ hai, số lần vắng giữ (lần vắng sau lại huỷ theo N38). Luật vắng N38 không đổi.
- **Gõ điểm đè "-" đã chốt** = Bỏ vắng (đường `goVangDaChot`: về tuần gốc, trừ một lần vắng) rồi lưu điểm, trong cùng một lần lưu.
- **N15 (khoá cuối tuần):** Huỷ điểm / Khôi phục / tự dời khi nhập sớm là thao tác điểm → thuộc ngoại lệ "nhập điểm", không khoá.
- **Tự dời khi nhập sớm:** chỉ dời kỹ năng đó (lớp thường: bài đó) về tuần này; trái thứ tự lượt / nhảy lượt (luật 1, RKC-1b) → vẫn cho, ghi cảnh báo trong lịch sử, không chặn.
- **Chủ SP chốt 14/11 (kết quả khi có kỹ năng "Đã huỷ"):** "Đủ bài, xét 3 KN còn lại" → bài coi như đủ; SOS / số kỹ năng trượt / Case tính trên kỹ năng còn lại; KHÔNG có Overall IELTS; MT0 lớp thường khi không có Overall thì xét từng kỹ năng theo mốc chương trình (xem đặc tả KY-VONG-MT0 cùng ngày). Lịch sử ghi ai huỷ.

## 7. Để người code quyết
Tên cờ huỷ tay; gộp đường máy chủ thế nào; thứ tự PR (gợi ý: PR-a máy chủ + một hàm "còn phải nhập" + phép kiểm; PR-b giao diện hộp nhập / lưới / ⋯ / 375). Mọi lựa chọn ghi trong mô tả PR.
