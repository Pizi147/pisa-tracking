# XEP-CHAM-TEST — thứ tự danh sách chấm Test (chủ SP 16/11, plan.md #1771)
GV demo id 8 (Lê Minh Khoa), tab Chấm điểm, tối. `cap-1440-toi.png`, `cap-375-toi.png`: TRƯỚC (trái) │ SAU (phải).
Ví dụ thấy được: vạch Quá hạn của Mock Test — MB FT 101 trước: W1 JUL · W4 JUL · W1 SEP (theo hạn) → sau: W1 SEP · W4 JUL · W1 JUL (tuần gần nhất lên đầu).

## Thao tác TRƯỚC → SAU
| Thao tác | TRƯỚC | SAU | Lý do |
|---|---|---|---|
| Thứ tự dòng trong mục Mock / Progress-Final / Checkpoint (Công việc › Chấm điểm) | hạn sớm trước | GIỮ vạch hạn (Quá hạn · Hôm nay · Hạn đến CN · Hạn sau CN · Không hạn); TRONG vạch: lớp thường có bài → mã lớp số nhỏ → tuần gần nhất | chủ SP 16/11; vạch là bố cục GD-4a (không đổi bố cục) |
| Lớp con của dòng gộp "Cả lớp · n lớp" + panel nhiều lớp + "Lớp tiếp ›" | theo hạn | theo thứ tự chấm (`soSanhViecCham`) | cùng luật |
| Test › Chấm Test: nợ chấm, bảng lớp, chấm tuần này | `soSanhLop` (trong lớp: quá hạn → hạn → tuần cũ trước) | `xepLopCham` (lớp thường có bài → mã lớp); trong lớp tuần gần nhất | cùng luật |
| Mọi thao tác khác (Nhập điểm, mở panel, Việc tiếp, lọc hạn) | | GIỮ | |

## [XM] cho PTA Plan
1. Vạch hạn: giữ (thứ tự lớp áp TRONG từng vạch). Nếu chủ SP muốn tab Chấm điểm xếp HẲN theo lớp (bỏ vạch "Quá hạn / Hạn đến / Hạn sau") thì đó là đổi bố cục — cần quyết.
2. Dòng gộp theo tuần nhiều lớp (OV-13c) giữ nguyên, đứng theo lớp đầu của nó.
