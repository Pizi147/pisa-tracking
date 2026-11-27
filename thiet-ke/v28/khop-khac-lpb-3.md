# LPB-3 · Khung việc chung trên việc TVV · Bàn giao · việc Head — khớp / khác với mockup v28 (L6a–L6d)

Ảnh cặp cả màn (trái mockup · phải web, dữ liệu demo 14/09/2026; tối ở 1440 / 1280, sáng ở 375) — `docs/anh/lpb-3/`:
- `tvv-{1440,1280,375}.png` — TVV · Công việc › Sau thi · panel Sau thi (Chọn bước tiếp) — mockup L6a (demo không có việc Chốt ngày thi; cùng khung, cùng mã)
- `ban-giao-{1440,1280,375}.png` — GVCN · Bàn giao · Chuyển lớp — mockup L6b (375) / L6a (1440)
- `head-{1440,1280,375}.png` — Head · Chốt lộ trình — mockup L6c / L6d

Mockup không có khung 1280 cho L6 → web 1280 ghép với khung 1440.

## Cách làm (một điểm, không component mới)

Dòng Công việc có `khungViec` (máy chủ LPB-1) → `PanelViec` đặt `BocThan` → `KhungPanel` bọc THÂN panel chính sẵn có (không có "‹ quay lại" riêng) bằng
`KhungViecChung`: `KhoiGiaoViec` trên cùng · thân panel giữ nguyên · `MucViecCon` ("+ Việc con" theo cờ `quanViecCon`) · Lịch sử giao (`LichSuGap`).
Áp cho cả 9 loại có khung ở Công việc: Chốt ngày thi · Bước tiếp · KQ thi thật · Bàn giao (GVCN) · Bàn giao môn · Bàn giao đổi GV · Chốt lộ trình · Xét lại · Xếp lịch MT.
Panel mở ở hồ sơ lớp / HV không bọc. Bàn giao môn chưa có dòng → `POST /giao-viec/ban_giao_mon/mo` khi mở (đường sẵn có của LPB-1).

## Bảng truy vết khung → thành phần → ảnh

| Khung mockup | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|
| L6a khối Phụ trách · Hạn · Theo dõi đầu panel việc TVV | `KhungViecChung` → `KhoiGiaoViec` (sẵn có) | tvv-1440 / 1280 / 375 | KHỚP |
| L6a Phụ trách ô bấm "{tên} bạn ▾" · Hạn ô viền | `KhoiGiaoViec` C7 + `DongHan` | tvv-1440 | KHỚP |
| L6a thân panel (form việc) giữ nguyên | panel Sau thi / Chốt ngày thi sẵn có | tvv-1440 | GIỮ |
| L6a Việc con + "+ Việc con" | `MucViecCon` (cờ `quanViecCon`) | tvv-1440 / 375 | KHỚP |
| L6a Lịch sử ô gập dưới Việc con | `LichSuGap` lịch sử giao (chỉ hiện khi có đổi người / hạn / theo dõi) | — (demo chưa đổi) | KHỚP theo mã |
| L6a thứ tự Việc con → Lịch sử | panel Sau thi giữ link "Lịch sử" riêng (mở view Lịch sử điểm / bước tiếp) ở cuối thân → Việc con nằm sau link đó | tvv-1440 | KHÁC nhỏ — giữ thao tác cũ |
| L6b khối việc trên Bàn giao · Chuyển lớp | `KhoiGiaoViec` trên `BanGiaoPanel` | ban-giao-1440 / 375 | KHỚP |
| L6b Việc con cuối thân Bàn giao | `MucViecCon` | ban-giao-375 | KHỚP |
| L6b khối Tuyến trong Bàn giao | — (Bàn giao chưa có `tuyen` trong khối máy chủ) | — | BỎ — [XM-2] |
| L6c / L6d khối việc trên Chốt lộ trình | `KhoiGiaoViec` trên panel Chốt lộ trình (khe 720) | head-1440 / 375 | KHỚP |
| L6c hộp chọn người "Có quyền chốt lộ trình" | ô Đổi người lọc `QUYEN_NHAN` (LPB-1, sẵn có) | — (bấm trên demo) | KHỚP theo mã |
| L6c / L6d việc Head mở TẠI DÒNG (khay dưới dòng) + nút "Mở Cuối khoá ›" | web đã mở Chốt lộ trình / Xét lại làm PANEL tại chỗ (v25 chủ SP duyệt 25/11, R3-T2) → khối vào panel; "Mở ở trang riêng ›" sẵn có ở đầu panel | head-1440 | KHÁC — có lý do, [XM-1] |
| Đầu panel ⓘ · ✕ | `KhungPanel` sẵn có | mọi ảnh | KHỚP |

Tỉ lệ khớp (KHỚP + GIỮ + KHÁC nhỏ trên tổng; BỎ không tính, KHÁC có lý do tính nửa): 10 KHỚP / GIỮ · 1 KHÁC nhỏ · 1 KHÁC ½ · 1 BỎ → 11,5 / 12 ≈ **96 %**.

## Thao tác TRƯỚC → SAU PR

| Thao tác | Trước | Sau |
|---|---|---|
| Đổi người phụ trách / hạn / theo dõi / mô tả việc TVV, Bàn giao, việc Head | chỉ qua máy chủ (LPB-1), web không có chỗ bấm | ô bấm trong panel việc (như Báo PH, Nhận thông tin) |
| Thêm / tick việc con cho các việc trên | không có | "+ Việc con" trong panel (theo cờ máy chủ) |
| Hoàn tác đổi người | — | dải "Đã giao cho … · Hoàn tác" của khối (sẵn có) |
| Mọi thao tác cũ của panel (Chốt bước tiếp, Sửa điểm, Lịch sử, Xác nhận bàn giao, Chốt · Lưu nháp, Mở ở trang riêng ›, Việc tiếp ›) | có | GIỮ nguyên |

Không mất thao tác nào.

## Máy chủ

Không đổi máy chủ, không đường API mới. Mở panel thêm MỘT `GET /giao-viec/:loai/:id` (đường sẵn có, như mọi panel có khối); Bàn giao môn chưa có dòng thêm một `POST …/ban_giao_mon/mo` (một lần).

## [XM]

- **XM-1** Việc quản lý của Head: mockup mở tại dòng (khay); web giữ panel tại chỗ đã duyệt (v25 Chốt lộ trình, Xét lại R3-T2) — "một danh sách một kiểu mở". PTA chốt.
- **XM-2** L6b khối Tuyến "Chuyển lớp" trong panel Bàn giao: máy chủ chưa gửi `tuyen` cho loại `ban_giao` → PR sau (máy chủ nhỏ, dùng `GET /tuyen/chuyen_lop/:khoa` sẵn có).
- **XM-3** Theo dõi mặc định (mockup L6a "GVCN …", L6b "Head …, GVCN …") — máy chủ LPB-1 chưa đặt người theo dõi mặc định cho việc có khung; web hiện "Chưa có". PR máy chủ sau nếu chủ SP muốn.
- Bổ sung hồ sơ thiếu: dòng gộp nhiều em, máy chủ không gắn `khungViec` → không có khối (đúng máy chủ).

## Chú thích `ponytail:`

Không thêm.
