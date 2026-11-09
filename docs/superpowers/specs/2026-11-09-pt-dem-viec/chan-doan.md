# Chẩn đoán bộ đếm Phân tích GV (PT-DEM-VIEC, 09/11/2026)

Bản chép bản chính xuất 08/11 (`pisatracking-261107.db`, điểm nhập tới 08/11), hôm nay = 09/11. Chạy chính hàm máy chủ của `main` (48e481ab4), chỉ đọc.
Không ghi tên thật. Khoảng rộng: tuần thi 31/08 → 02/11 · khoảng mặc định của trang: 19/10 → 15/11.

## 1. Bài chưa chấm đã quá hạn (mọi chi nhánh, khoảng rộng)

| Nguyên nhân | Số bài | Hiện tại | Đúng không |
|---|---:|---|---|
| Được tính (vào "Chấm Test đúng hạn", tab "Quá hạn chưa chấm") | 330 | tính | đúng |
| Speaking chấm chéo chưa ai nhập (MB 123 · BC 19 · UB 12 · CP 5 · HD 3 — hết ở FT) | 150 | **không tính cho ai** (luật T18 cũ) | sai theo lời chủ SP 09/11 |
| Không có phân công ở ngày hạn (phân công nhập vào hệ thống SAU ngày thi: MB thường 75 · CP thường 11) | 86 | **biến mất** (Công việc vẫn giao cho GV hiện tại) | lỗi |
| Dấu "-" | 60 | không tính | đúng luật |
| Em không đang học ở ngày hạn | 20 | không tính | đúng luật |

**Rơi do kỳ lọc** (khoảng mặc định): bài quá hạn có tuần thi TRƯỚC kỳ không vào kỳ đang xem — 69 bài tính được + 86 không phân công + 74 S chéo.
Ví dụ: một lớp FT thi W1 OCT chưa chấm thì từ W4 OCT trở đi bảng mặc định không còn thấy.

**Cẩm Phả FT (ảnh của chủ SP):** sau khi bỏ dấu "-", em nghỉ, S chéo thì CP FT không còn bài chưa chấm quá hạn nào → panel chỉ có tab "Đã nhập". Số trễ của CP FT
là bài **đã nhập muộn**, gần hết có tuần thi ≤ W3 OCT (giai đoạn mới dùng hệ thống, điểm nhập bù).

## 2. Bài đã nhập: chấm hộ, nhập muộn

| | ≤ W3 OCT | ≥ W4 OCT |
|---|---:|---:|
| Tự nhập, đúng hạn | 322 | 315 |
| Tự nhập, muộn | 267 | 227 |
| Người khác nhập (QL / Admin / GV khác), đúng hạn | 45 | 17 |
| Người khác nhập, muộn → đang tính muộn cho GV phụ trách | 37 | 41 |
| Speaking chéo, người khác nhập thay GV chấm đã ghi, muộn | 14 | 1 |

`entered_by` là người ghi cuối (sửa sau cũng đổi), nên số "người khác nhập" chỉ gần đúng.

## 3. Việc (không phải chấm bài)

- Mọi việc quá hạn đang có người giữ + hạn trong khoảng đều được tính (0 việc rơi vì không người / không hạn). Việc quá hạn đang mở: MB 6 · BC 1 · CP 16 · UB 50 · HD 1.
- **Đặt lại hạn 07/11** (`viec_han_lan`): 374 việc dời hạn sang 14/11 – 21/11 → hiện là "chưa tới hạn", không hiện quá hạn:
  - Kết quả PA 306 (111 đã quá hạn lúc đặt lại) · Xác nhận / Mô tả Case 65 (cả 65 đã quá hạn, 25 có hạn gốc trước W4 OCT) · Thêm PA 3.
  - Đây là lý do nhiều GV "—" ở Việc đúng hạn: việc quá hạn của họ đã thành chưa tới hạn. Không mất dòng; qua hạn mới mà chưa làm thì sẽ quá hạn lại.
- Việc quá hạn có hạn trước kỳ đang xem: rơi khỏi kỳ (cùng lỗi kỳ lọc như bài); khoảng mặc định trên bản chép hiện 0 việc vì đợt đặt lại hạn.
- 59 lần ghi Kết quả PA muộn trước đợt đặt lại: không tính (chủ SP 06/11 "Xoá luôn").

## 4. Thử nghiệm (đã bỏ, thay bằng sổ nghĩa vụ)

Bản vá thử (nhánh `claude/pt-dem-viec-732239`, commit WIP, không mở PR): bài quá hạn trước kỳ vẫn tính · không phân công lúc hạn → GV hiện tại ·
mốc ≤ W3 OCT đã nhập = đúng hạn. Trên khoảng rộng: Chấm Test 783/1 728 (45 %) → 1 274/1 977 (64 %); Việc 136/259 → 187/262. Khoảng mặc định: Chấm Test mẫu 945 → 1 054.
Bộ luật mới: `docs/superpowers/specs/2026-11-09-so-nghia-vu-design.md`.
