# HVL-TINH-HINH · ⋯ dòng em có "Tình hình học tập" · khớp / khác mockup ⑥

Nguồn: backlog `plan.md` 14/11 21:50 ("⋯ dòng em ở HV & Lớp chưa có Tình hình học tập — cần hộp Tình hình một em neo ở menu") · mockup `thiet-ke/v21/hoc-vien-lop.html` K1 (menu ⋯ dòng em: nhóm "+ Task" · Case · Vi phạm / Nhắc nhở · **Tình hình học tập**) · lời 17 (thứ tự mục + Task).
Tài khoản demo tên giả: GV Trần Ngọc Hà (7) · TVV Nguyễn Thu Hương (23). Phông Be Vietnam Pro đã nạp trước mỗi ảnh.

| Ảnh | Mockup | Web |
|---|---|---|
| `cap-menu-gv-1440-toi.png` | K1 menu ⋯ dòng em | GV: ⋯ dòng em mở — "+ Task" · Case · Vi phạm / Nhắc nhở · **Tình hình học tập** |
| `cap-hop-gv-1440-toi.png` | K1 | GV: bấm mục → hộp **Báo tình hình** sẵn có, em điền sẵn, "Gửi tới TVV …" |
| `cap-hop-gv-375-sang.png` | K8a | GV 375: hộp là tấm dưới (như mọi nơi khác dùng hộp này) |
| `cap-menu-tvv-1440-toi.png` | K1 | TVV: ⋯ theo vai — "+ Task" · **Hỏi tình hình học tập** rồi việc thông tin |
| `cap-hop-tvv-1440-toi.png` | K1 | TVV: hộp **Hỏi tình hình** sẵn có (gửi GVCN), em điền sẵn |

## 1. Truy vết

| # | Thành phần (nguồn) | Web sau PR | Ảnh | Kết quả |
|---|---|---|---|---|
| 1 | ⋯ dòng em: nhóm "+ Task" có 3 mục Case · Vi phạm / Nhắc nhở · Tình hình học tập (mockup K1, lời 17) | `useThaoTacDongHocVien.mucCua`: "Tình hình học tập" ngay sau Vi phạm trong nhóm, vạch sau nhóm | cap-menu-gv | KHỚP |
| 2 | Bấm mục → hộp Tình hình MỘT em, tại trang | DÙNG LẠI `HopTinhHinh` (prTinhHinh, như "+ Task" hồ sơ HV): `bao` em điền sẵn kèm TVV của em; neo nút ⋯ vừa bấm (dưới, hoặc cạnh khi thiếu chỗ); 375 tấm dưới; "Gửi tới" một em chỉ ghi người nhận ("TVV Lê Thu"), nhiều em mới kèm tên em | cap-hop-gv, cap-hop-gv-375 | KHỚP |
| 3 | TVV (⋯ theo vai) | "+ Task" · **Hỏi tình hình học tập** (gửi GVCN) — cùng mục "+ Task" của TVV ở hồ sơ HV / trang đầu | cap-menu-tvv, cap-hop-tvv | KHỚP |
| 4 | Quyền theo máy chủ, vai không làm được thì không có mục | Báo: cờ `coTheGhiViPham` đã nạp (= `violation.record` ở lớp — đúng điều kiện `quyenGui` gv_tvv); Hỏi: cờ `suaThem` đã nạp (≈ `coTheGhi`: TVV có `student.edit_more`); em không đang học → không có mục; máy chủ vẫn kiểm khi gửi, lỗi ở lại hộp, chữ giữ | — | KHỚP |
| 5 | Hộp "Hỏi" từ danh sách phải nói rõ em nào | `HopTinhHinh`: khi đã có em (Báo hoặc Hỏi) luôn hiện "Học viên · {tên}" (trước chỉ hiện ở Báo) — áp chung, hồ sơ HV cũng thấy tên em | cap-hop-tvv | KHỚP |
| 6 | Mọi nơi có ⋯ dòng em | Tất cả · Đang SOS (cùng `MenuEm`) · hồ sơ lớp FT (`BangHoSoLop`) · lớp thường (`BangDiemLopThuong`) — cùng hook. Tab Lịch thi không có ⋯ dòng (mockup K4) | cap-menu-gv | KHỚP |

## 2. KHÁC (có lý do)

1. ~~Hộp ở hàng cuối trang ngắn kẹp sát mép trên~~ — **đã sửa (PTA rà #1708)** ở `HopNeo` (chung): chỉ lật lên khi phía trên (dưới thanh đầu trang) đủ chỗ; trên / dưới đều thiếu mà ô neo ở mép phải (⋯ cuối dòng) → đặt **cạnh trái nút ⋯**, dọc trong khoảng dưới thanh đầu → đáy màn; không thì phía rộng hơn, hộp cuộn trong. Không đè thanh đầu, không che nút ⋯. Soi lại "+ Task" trang Công việc (mở xuống như cũ); các chỗ đủ chỗ trên / dưới không đổi.
2. **Hộp Hỏi không có ✕ ở tiêu đề**: dáng sẵn có của `HopTinhHinh` (chỉ hộp Báo có ✕, theo ⑤ F3); đóng bằng "Đóng" / Esc / bấm ngoài.

## 3. Thao tác TRƯỚC → SAU

| # | Thao tác TRƯỚC | Ai | SAU | Mất? |
|---|---|---|---|---|
| 1 | Báo tình hình một em: "+ Task" đầu trang (gõ tìm em) · hồ sơ HV · hồ sơ lớp | GV, QL | giữ cả ba + **⋯ dòng em › Tình hình học tập** (em điền sẵn, không gõ tìm) | thêm |
| 2 | Hỏi tình hình: "+ Task" trang đầu TVV · hồ sơ HV | TVV | giữ + **⋯ dòng em › Hỏi tình hình học tập** | thêm |
| 3 | ⋯ dòng em: Case · Vi phạm / Nhắc nhở · Nhập điểm · Xác nhận xử lý · Sửa thông tin · Đề xuất / Chuyển lớp · Cuối khoá… | theo quyền | giữ đủ, cùng thứ tự | không |
| 4 | ⋯ theo vai (TVV / CX / Admin): Sửa thông tin · Tạm dừng / Kết thúc học · Kết quả thi thật · Mở hồ sơ | TVV, CX | giữ; TVV thêm nhóm "+ Task" trên cùng | không |
| 5 | Gửi xong → toast Hoàn tác (≤ 2 phút) · lỗi lưu ở lại hộp | — | giữ (cùng hộp) | không |

**Mất thao tác: không.**

## 4. Đo

- **Turso**: mở menu + bấm mục + hộp hiện = **0 request, 0 câu, 0 dòng** (đo request trình duyệt: GV 1440, GV 375, TVV 1440). Quyền từ cờ đã nạp cùng `/hoc-vien-lop`. Chỉ khi bấm Gửi mới gọi `POST /tinh-hinh` (đường sẵn có, không đổi). Máy chủ không sửa.
- **✕ / ⋯** (tâm ký tự so tâm nút): ✕ hộp 36 × 36 (1440) / 44 × 44 (375) lệch 0,01 / 0,5 px; ⋯ dòng 32 × 32 / 44 × 44 lệch 0 / ≤ 0,75 px → **≤ 1 px**.
- **Chữ bị cắt "…"** trong hộp: 0; cuộn ngang trang: không.
- impeccable `detect` + `audit`, `web-design-guidelines`: xem mô tả PR.
