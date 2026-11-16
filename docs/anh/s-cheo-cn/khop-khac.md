# S-CHEO-CN — panel Chấm Speaking: theo lớp + mục "Chi nhánh khác" (chủ SP 16/11)
Dữ liệu demo (seed, ngày demo 14/09), GV Speaking demo id 17 (Đỗ Thu Hương, Monbay): 18 bài chính, 13 bài chi nhánh khác. Tối, 1440 + 375.

- `cap-1440-toi.png`, `cap-375-toi.png`: TRƯỚC (trái — tuần → lớp) │ SAU (phải — lớp, tuần dưới tên em).
- `sau-khac-1440-toi.png`, `sau-khac-375-toi.png`: "Chi nhánh khác" mở — chi nhánh → lớp.
- `sau-ngan-1440-toi.png`, `sau-ngan-375-toi.png`: mở một lớp chi nhánh khác — ô S sửa được, GV chấm, tên em / MTn chữ thường (không link).

Chủ SP 16/11 (nói thêm giữa phiên): "không chỉ là thứ tự… hiện luôn thanh tên + ô điểm của học sinh, hiện tuần bên dưới tên HV như bây giờ" → mỗi lớp MỘT ngăn, mở ra là lưới em luôn (không ngăn tuần), tuần ở dòng phụ dưới tên.

## Thao tác TRƯỚC → SAU
| Thao tác | TRƯỚC | SAU | Lý do |
|---|---|---|---|
| Gom | tuần Test → ngăn lớp | ngăn lớp; tuần dưới tên em | lời chủ SP 16/11 |
| Thứ tự lớp | mã lớp trong từng tuần | lớp thường có bài lên đầu → mã lớp số nhỏ trước (`soSanhLopCham`, dùng chung cho chấm Test); áp cả trong mỗi chi nhánh của "Chi nhánh khác" | chủ SP 16/11 (plan.md #1770) |
| Thứ tự em | tên | tuần gần nhất trên, rồi tên | "gần nhất lên đầu" chỉ áp cho tuần trong lớp |
| Tìm em | có | GIỮ (tìm cả phần Chi nhánh khác đã tải) | |
| Mở sẵn ngăn `lopDau` / ngăn đầu còn bài | có | GIỮ | |
| Ô "GV chấm" đầu ngăn | lớp × đợt | GIỮ, lớp × đợt của tuần mới nhất (một lựa chọn cho cả ngăn) | ngăn giờ gồm nhiều tuần |
| Lưới `LuoiFT`, hộp chấm, "Lưu · bài tiếp ›" | có | GIỮ | |
| "Đã có điểm · n bài" | có, dòng phụ "GV chấm: … · dd/mm" | GIỮ, dòng phụ thêm tuần trước | |
| "Lớp tiếp: {mã} ›" / "Việc tiếp ›" | có | GIỮ | |
| "✓ Đã lưu n bài" | có | GIỮ (đếm cả lưu ở chi nhánh khác) | |
| Chip quá hạn | đầu tuần + ngăn | đầu ngăn lớp (không quá hạn thì chip hạn) | |
| "Tuần cũ hơn" gập | có | **BỎ** | tuần đã ghi dưới tên em, em tuần cũ nằm dưới cùng ngăn lớp — thêm một tầng gập là thừa |
| "Chi nhánh khác" | — | **MỚI**: gập cuối, chỉ tải khi mở (`?cn=khac`), chi nhánh → lớp | lời chủ SP 16/11 |

## Quyền (đổi, N7)
- GV Speaking (`laGvSpeaking`) SỬA được ô S (Mock FT, MT0 lớp thường đang chạy) ở MỌI chi nhánh: `editableSkills` + `scoreEditPath` (nên `saveScore`, Huỷ điểm, Bỏ vắng ô S, ô "GV chấm" đi cùng). Không L/R/W.
- KHÔNG mở xem: Lịch Test, Kế hoạch Test, bảng chấm lớp, hồ sơ lượt / em chi nhánh khác vẫn 403 → dòng chi nhánh khác `xemHoSo: false` (tên + MTn chữ thường, mẫu GV-CU-BO-TRO).
- Chi nhánh khác KHÔNG vào số việc / chuông / quá hạn của GV (hàng đợi chính và `myWork` không đổi).

## [XM] để PTA Plan quyết
1. Dòng quy chế vẫn ghi "Mọi GV Speaking chi nhánh chấm được" (`quyCheChamSpeaking`, chung) — giữ hay đổi chữ?
2. 375: tên em dài bị cắt KHÔNG có "…" ("Lê Quang Hu|y MT3 ›") — lỗi sẵn có của `LuoiFT` (Link `max-sm:inline-flex` làm `truncate` mất hiệu lực), có cả trước PR; sửa ở lưới chung = PR riêng.
