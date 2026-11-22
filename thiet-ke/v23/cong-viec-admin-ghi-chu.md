# v23 ④ Công việc Admin — ghi chú

Mockup: [`cong-viec-admin.html`](cong-viec-admin.html) · ảnh `anh/cong-viec-admin-*.png`.
Đặc tả mục 0, 3 (bản #1975). Chủ SP 22/11 đổi giữa phiên: **theo LOẠI việc** (không gom theo lớp), "nếu làm theo lớp thì cần phân biệt rõ đầu mục việc" → mockup vẽ theo loại.

## Truy vết

| Ý / mục | Khung | Thành phần web |
|---|---|---|
| ý 15: vận hành trước (đủ điểm / báo cáo / lịch thi / hồ sơ), người phụ trách sau | A1 | tab Admin: Tất cả · Điểm · Báo cáo PH · Lịch thi · Hồ sơ · Vận hành · Đang theo dõi |
| Đầu mục mỗi loại tách bạch: tiêu đề nổi + "n việc · m quá hạn" | A1, A3 | `.ds-dau` (chung với GV / TVV) |
| Dòng "lớp / em · thiếu gì" trước, người phụ trách nhỏ cuối dòng | A1 | `DanhSachViec.tsx` cột `ai` khi người xem ≠ người phụ trách |
| Việc đủ không hiện | A1 chân thẻ, A4a | lọc ở cùng hàm đếm |
| Bấm em → panel; không quyền → "ai làm được" (V11) | A2 | `PanelViec` + `chuAiLamDuoc` |
| W1 / W2 tách | A1, A2 | chip / bảng kỹ năng |

## Nguồn dữ liệu + Turso

- **Một nguồn:** cùng `GET /my-work` hiện có (`myWork(p)` → `nheMyWork`), web gom theo loại (`tabCuaViec` / `mucCuaViec`) và theo lớp trong loại (`classId`) tại máy. Số "thiếu" = `soBai` / số em của chính các dòng đó → khớp hồ sơ lớp / Công việc (cùng `demDongViec`).
- **Đo hiện tại** (audit 21/11 `b2.md`): Công việc Admin = 3 request · **25 câu · 573 dòng**.
- **Sau:** +0 câu (không câu theo từng lớp; mở lớp ra em dùng dòng đã nạp; lớp đủ không cần đọc danh sách lớp). Chân thẻ "9 lớp đủ" cần số lớp có Test tuần này — lấy từ `kemTestSapToi` đã gọi trong `/my-work`; nếu PR thấy phải thêm câu thì bỏ dòng chân (không đổi đầu ra) và ghi trong PR.
- Ước / ngày: Admin ≈ 2 người × ~10 lần mở × ~600 dòng ≈ 12 K dòng — không đổi.

## Thao tác TRƯỚC → SAU

| Trước | Sau |
|---|---|
| Tab theo loại (Chấm điểm…) | giữ theo loại, thêm "Tất cả" xếp các loại thành thẻ |
| Bấm dòng → panel | giữ (dòng em); dòng lớp mở em ngay dưới |
| Xuất báo cáo PH (việc của Admin) | giữ ("Bạn" ở cột người phụ trách) |
| + Task · ô chi nhánh | giữ |
| Nhắc GV (nếu Admin đang có) | giữ trong panel |
| Vận hành · Đang theo dõi | giữ |

## Tự rà

- Theo loại, đầu mục rõ, không trộn loại một dòng: đạt. Thiếu gì trước, người phụ trách sau: đạt. Việc đủ ẩn: đạt. Không thêm câu: đạt (ghi trên).
- Trạng thái: có việc + quá hạn (A1) · panel chỉ xem (A2) · 375 (A3) · rỗng (A4a) · lỗi (A4b).

## [XM]

- [XM-4] Tab "Tất cả" là mới (Admin xem cả 4 loại một lượt). Nếu chủ SP muốn đúng tab như cũ, bỏ "Tất cả", mở mặc định tab Điểm.
- [XM-5] Dòng lớp có › mở từng em (hai tầng trong một loại). Chủ SP chưa nói rõ có cần; giữ vì Admin cần biết em nào thiếu.

Critique: **34 / 40** (vẽ lại sau đổi hướng), không P0 / P1. P2: cột người phụ trách 190 px có thể cắt tên hai GV ("GV A · B") — PR dùng `title`.

## Góp ý chủ SP 22/11 vòng 2 (qua PTA Plan) — đã sửa

| Góp ý | Sửa |
|---|---|
| 6 không dàn cả trang; bấm hiện panel bên cạnh gọn | danh sách **556 px bên trái** như GV / TVV (dòng "lớp / em · thiếu gì" · hạn, không cột người phụ trách); bấm dòng lớp → **panel 58 %**: bảng từng em · còn thiếu (W1 / W2) · **người phụ trách** · hạn dd/mm/yyyy; bấm dòng em → panel em (A2). 375: danh sách → panel toàn màn (A3a, A3b) |
| 2 luật hạn | danh sách giữ "quá hạn n ngày"; bảng trong panel chỉ tô đỏ ngày |

- [XM-5] cũ (dòng lớp mở em ngay dưới) **thay** bằng panel bên cạnh — đóng.
