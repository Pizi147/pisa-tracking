# Sổ nghĩa vụ — bộ đếm việc / bài chấm (thiết kế, 09/11/2026)

Chủ SP duyệt hướng A, phần 1 (luật) và phần 2 (máy chạy) ngày 09/11. Lời chủ SP: `plan.md` mục 4, "BỘ ĐẾM VIỆC / BÀI CHẤM".
Trạng thái: CHƯA CODE. Chờ chủ SP đọc tài liệu này, rồi mới lên kế hoạch PR.

## Tóm tắt cho chủ SP (đọc phần này là đủ)

- **Mỗi bài phải chấm và mỗi việc có hạn là một dòng** trong sổ. Dòng ghi: của ai, hạn khi nào, xong ngày nào, ai làm.
- **Mỗi dòng nằm ở đúng một trong bốn ô:** Đúng hạn · Làm muộn (n ngày) · Chưa làm (quá n ngày) · Chưa tới hạn.
- **Mỗi người, mỗi kỳ có 3 số:** Đúng hạn x · Làm muộn y · Chưa làm z. Bấm vào số là ra đúng danh sách bài / việc đó.
- **Xem được ba cách:** theo chi nhánh, tổng mọi chi nhánh (mỗi người một dòng), và ở hồ sơ GV.
- **Không ai trốn được:**
  - Chưa làm mà quá hạn thì luôn hiện.
  - Bài không có người phân công hiện cho QL với nhãn "Chưa phân công".
- **Không ai bị phạt oan:**
  - Em vắng, có dấu "-", lượt bị huỷ, hoặc em đã nghỉ trước hạn: không tính.
  - Chấm hộ mà đúng hạn thì GV phụ trách vẫn được tính đúng hạn.
- **Việc trước tuần 4 tháng 10** (hạn trước thứ Hai W4 OCT 2026): đã làm thì tính đúng hạn.
- **Người dùng không phải làm gì thêm:** sổ nằm ở máy chủ, không thêm nút, màn hay bước nào. Giao diện chỉ khác hai chỗ: số đúng hơn, panel chia 3 nhóm.

## 1. Luật đếm

### 1.1 Nghĩa vụ
- **Bài chấm** = một ô điểm, tức một kỹ năng của một lượt Test (MT, MT0, Progress, Final, S Ex…). Chỉ tính ô bắt buộc theo luật lượt hiện có.
- **Việc** = mọi loại việc CÓ HẠN ở Công việc:
  - Mô tả Case
  - Xác nhận Case (kể cả Case S)
  - Xác nhận PA
  - Thêm PA
  - Kết quả PA (mỗi kỳ là một nghĩa vụ)
  - Ghi Mini Test
  - Báo PH
  - Chọn bước tiếp sau thi
  - Bàn giao (lớp / môn / GV)
  - Xử lý vi phạm bắt buộc (từ 3 vi phạm, hạn 5 ngày)
  - Phối hợp SOS
- **Không vào sổ:** việc không có hạn, như Thiếu dữ liệu, Xem vi phạm mới, Khai bậc, Thi thật chờ KQ, Bổ sung hồ sơ.

### 1.2 Người chịu trách nhiệm
Một nghĩa vụ tính cho đúng một người. Ngoại lệ duy nhất là mục c.

a. **Bài thường:** GV được phân công kỹ năng đó ở lớp em học tại tuần thi, theo phân công có hiệu lực ở ngày hạn. Writing FT: GV W1 hoặc W2, theo ô.
   - Chấm hộ: vẫn tính cho GV này.
   - Không có phân công ở ngày hạn (phân công nhập muộn — chẩn đoán 09/11: 86 bài): lấy phân công **gần nhất có hiệu lực SAU ngày hạn** của cùng lớp + kỹ năng (như Công việc đang giao), ghi cờ `pc_nhap_sau`.
   - Lớp + kỹ năng không có phân công nào: để trống người, gắn nhãn **"Chưa phân công"**, hiện cho QL chi nhánh. Đếm riêng, không bị mất.

b. **Việc:** người giữ việc theo Công việc ở ngày hạn. Ví dụ: chủ Case, GVCN / GVBM theo phân công lúc hạn, TVV của em, người giữ Mini Test, người nhận bàn giao.
   - **Em chuyển lớp (chủ SP 10/11):** việc của GV lớp cũ, tại ngày chuyển:
     - đã quá hạn mà chưa làm → GV cũ bị tính **Chưa làm** (giữ nguyên, không đổi người);
     - chưa tới hạn → GV cũ **không tính** (`khong_tinh = chuyen-lop`).
     - Cả hai trường hợp: GV lớp mới nhận việc mới, **hạn tính lại theo luật** của loại việc từ ngày em vào lớp mới (khoá mới, hạn gốc mới).

c. **Speaking chấm chéo** (S Mock FT, S của MT0):
   - Chưa ai nhập: tính cho **mọi GV có kỹ năng S** (theo hồ sơ GV) của chi nhánh, có vai GV ở ngày hạn.
   - Đã nhập, người chấm có tài khoản: **chỉ tính cho người đó**.
   - Người chấm là tên ngoài, không có tài khoản: không tính cho ai, ghi "Người ngoài".
   - **Nhóm S tính theo kỹ năng TẠI NGÀY HẠN (chủ SP 10/11):** lưu lịch sử đổi kỹ năng (`user_skill_lich_su`). Bỏ S → bài hạn sau ngày bỏ không tính cho người đó; bài đã quá hạn trước ngày bỏ vẫn tính (không tự bỏ kỹ năng để trốn).
   - Nhập điểm S chéo: chỉ chọn được người chấm là GV có kỹ năng S (hoặc ghi tên ngoài → không tính ai).
   - Chi nhánh không còn ai có kỹ năng S → bài hiện "Chưa phân công".
   - **Hiển thị (đề xuất, chủ SP duyệt qua ảnh PR-2):** bài S chéo chưa ai nhận KHÔNG cộng vào 3 số riêng; hiện dòng phụ "+ n S chéo chung" (mọi GV S cùng số), panel tab Chưa làm chia "Bài của bạn" / "S chéo chung".

### 1.3 Trạng thái
Mọi trạng thái so với **hạn hiện tại**.

- **Hạn:**
  - Hạn của bài = mốc trễ hiện có `mocTreNhapDiem` = ngày muộn hơn giữa hạn chấm và Chủ nhật tuần thi.
  - Hạn của việc = hạn ở Công việc.
- **Bốn trạng thái:**
  - **Đúng hạn:** xong trước hoặc đúng hạn.
  - **Làm muộn:** xong sau hạn; ghi số ngày muộn.
  - **Chưa làm:** hôm nay đã qua hạn mà chưa xong; ghi số ngày quá hạn.
  - **Chưa tới hạn:** chưa tính.
- **Thế nào là "xong":**
  - Bài: lần nhập điểm đầu tiên. Sửa điểm về sau không tính.
  - Việc: ngày xong đang dùng ở `viecDaXong.ts`, mục "Ngày xong".
- **Việc đã xong nhưng không có ngày xong** (dữ liệu cũ):
  - Nghĩa vụ trước mốc W4 OCT: coi là xong trước mốc, tính đúng hạn.
  - Nghĩa vụ sau mốc: ghi "Thiếu ngày xong", không tính, liệt kê cho PTA.

### 1.4 Không tính
Các dòng dưới đây vẫn nằm trong sổ, chỉ ghi lý do để không tính, không xoá dòng.

- Em vắng.
- Có dấu "-".
- Lượt hoặc ô bị huỷ.
- Đang chờ duyệt dời lịch.
- Em Kết thúc học, Lưu trữ hoặc Tạm dừng **trước** ngày hạn.
- MT lịch sử nhập bù.
- Nghĩa vụ bị huỷ theo luật (Case bị xoá, PA dừng…).

### 1.5 Đặt lại hạn
- Sổ giữ cả **hạn gốc** (lần đầu) và **hạn hiện tại**.
- Trạng thái tính theo hạn hiện tại. Khi hai hạn khác nhau, panel ghi thêm "hạn gốc …".
- Đặt lại hạn không xoá việc: việc vẫn phải làm.

### 1.6 Mốc bắt đầu tính (chủ SP 09/11)
- Hạn gốc trước thứ Hai W4 OCT 2026 (với bài: tuần thi trước W4 OCT):
  - Đã xong: **Đúng hạn**, bất kể xong ngày nào.
  - Chưa xong: vẫn **Chưa làm**.
- Mốc là một hằng có ngày, kiểm ở một hàm duy nhất.

### 1.7 Đếm và xem
- **Kỳ:** tính các nghĩa vụ có hạn hiện tại nằm trong kỳ đang xem. Việc "Chưa làm" của kỳ cũ vẫn hiện trong kỳ của nó và trong chế độ "Toàn bộ".
- **Số của mỗi người:** Đúng hạn x · Làm muộn y · Chưa làm z; tỉ lệ = x / (x + y + z).
  - Bài và việc là hai cột riêng: Chấm Test · Việc.
- **Ba cách xem:**
  - Theo chi nhánh (mặc định).
  - Tổng mọi chi nhánh: mỗi người một dòng, bấm vào thì tách ra từng chi nhánh.
  - Hồ sơ GV.
- Bảng, panel, hồ sơ GV và Tổng quan đọc **cùng một hàm**.
- **Panel số:**
  - 3 tab, "Chưa làm" đứng đầu: Chưa làm · Làm muộn · Đúng hạn.
  - Mỗi dòng: việc / bài · học viên · lớp · hạn (kèm hạn gốc nếu khác) · trạng thái + số ngày.

## 2. Máy chạy (ở máy chủ, không có giao diện)

### 2.1 Bảng `nghia_vu`
Các cột:

| Cột | Ý nghĩa |
|---|---|
| `id` | Mã dòng. |
| `loai` | `bai` hoặc `viec`. |
| `kieu` | Mã loại việc hoặc kỹ năng. |
| `khoa` | Khoá nguồn, duy nhất: lượt + kỹ năng, Case, PA + kỳ, Mini Test, lệnh bàn giao… |
| `chi_nhanh`, `lop`, `hoc_vien` | Nơi và em của nghĩa vụ. |
| `nguoi` | Người chịu trách nhiệm; null = chưa phân công, hoặc S chéo chưa ai nhận. |
| `s_cheo` | 0 / 1. |
| `han_goc`, `han` | Hạn gốc và hạn hiện tại. |
| `xong_luc`, `nguoi_lam` | Ngày xong và ai làm. |
| `khong_tinh` | null, hoặc mã lý do không tính. |
| `cap_nhat` | Lần ghi cuối. |

Chỉ mục: (`chi_nhanh`, `han`), (`nguoi`, `han`), và `khoa` là duy nhất.

### 2.2 Ghi sổ
- Hàm `ghiSo(khoa)` tính lại MỘT dòng từ dữ liệu gốc rồi upsert. Hàm dùng lại các hàm luật đang có: `skillCells`, `regularSkillViews`, phân công lúc hạn, ngày xong ở `viecDaXong`. Gọi lại bao nhiêu lần cũng ra cùng kết quả.
- Gọi `ghiSo` sau mọi thao tác làm đổi nghĩa vụ:
  - nhập hoặc xoá điểm;
  - xếp, dời hoặc huỷ lịch;
  - vắng, dấu "-";
  - đổi phân công (các ô bị ảnh hưởng);
  - ghi hoặc sửa Case, PA, Kết quả PA, Mini Test, Báo PH, bước tiếp, bàn giao, xử lý vi phạm;
  - đặt lại hạn;
  - đổi trạng thái em, chuyển lớp.
- Đổi phân công hoặc đổi trạng thái em ảnh hưởng nhiều dòng: ghi lại mọi dòng của lớp / em đó có hạn từ ngày đổi trở đi, trong một câu theo lô.

### 2.3 Đối chiếu hằng đêm (lưới an toàn)
- Mỗi đêm, với mỗi chi nhánh: tính lại các nghĩa vụ có hạn trong 8 tuần gần nhất, cộng mọi dòng "Chưa làm".
- Dòng lệch: sửa, và ghi vào nhật ký `nghia_vu_lech` để biết thao tác nào quên gọi `ghiSo`.
- Phép kiểm: sổ phải khớp với kết quả tính lại từ gốc trên seed, cho mọi loại.

### 2.4 Nạp dữ liệu cũ
- Một lệnh migrate chạy một lần: dựng sổ cho mọi nghĩa vụ từ đầu khoá hiện hành.
- Thử trên bản chép `mig.sqlite`, rồi so với cách đếm cũ theo từng người.
- Chênh lệch ghi thành bảng kèm lý do. Chủ SP xem bảng này trước khi bật giao diện.

### 2.5 Đọc Turso (ước tính; đo thật trước khi bật)
- **Phân tích GV, một chi nhánh, một kỳ:** 1–2 câu GROUP BY trên chỉ mục (`chi_nhanh`, `han`), đọc vài nghìn dòng. Cách cũ cần hàng chục câu qua nhiều bảng.
- **Panel một người:** 1 câu, vài chục dòng.
- **Hồ sơ GV:** 1–2 câu.
- **Tổng mọi chi nhánh:** 1 câu theo kỳ.
- **Ghi:** thêm 1–2 câu mỗi thao tác.
- **Đối chiếu đêm:** ước dưới 0,5 triệu dòng mỗi đêm cho toàn trung tâm.
- Thêm trần câu / dòng ở `server/src/tests/tocDoDuong.ts`.

## 3. Chia PR
Kế hoạch chi tiết lên sau khi chủ SP duyệt tài liệu này.

1. Bảng sổ, `ghiSo`, gắn vào mọi thao tác, nạp dữ liệu cũ, đối chiếu đêm.
   - Chạy song song với cách đếm cũ, chưa đổi giao diện.
   - Gửi bảng chênh lệch để chủ SP duyệt.
2. Chuyển sang đọc sổ: Phân tích GV (theo chi nhánh và tổng), hồ sơ GV, Tổng quan.
   - Panel chia 3 tab.
   - Thêm trạng thái "Chưa phân công", "Người ngoài".
3. Bỏ cách đếm cũ: `tapChamDiem`, `viecQuaHanMo`, phần đếm của `viecDaXong`; dọn phép kiểm.

## 4. Phép kiểm bắt buộc
Mỗi trường hợp dưới đây một ca:

- Chưa làm quá hạn · làm muộn · đúng hạn.
- Chấm hộ.
- S chéo: chưa ai nhận (tính cả nhóm) · có người chấm · người ngoài.
- Đặt lại hạn (hạn gốc phải giữ nguyên).
- Không có phân công.
- Em vắng · dấu "-" · nghỉ trước hạn · nghỉ sau hạn.
- Trước W4 OCT: đã làm · chưa làm.
- Chuyển lớp giữa kỳ.
- GV dạy hai chi nhánh: xem tổng chỉ có một dòng.
- Cùng một số ở bảng = panel = hồ sơ GV = Tổng quan.
