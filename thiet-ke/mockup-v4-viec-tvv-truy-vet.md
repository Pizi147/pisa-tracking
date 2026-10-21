# Truy vết — `mockup-v4-viec-tvv.html` (UI-YT-TVV · Việc TVV + form Báo PH) · 21/10/2026

Mockup: [`mockup-v4-viec-tvv.html`](mockup-v4-viec-tvv.html) · ảnh: `anh/mockup-v4-viec-tvv-<khung>.png` (k1–k9 = 1440 tối; a–d = 375 sáng).
Nguồn: 02 mục 2.1 (L1, L2, L3, L5), 2.9 (21/10-TVV, Q-A1 ①, Q-D1 ①, Q-D3 ①, Q-D4 ①) · 05 mục 1.4, 5.1–5.12, 7.2 · 04 mục 9, 10, 12 · 07 GĐ1b UI-YT-TVV · 06 mục 4 (M1b).

## 1. Quyết định → khung → thành phần

| Mã | Nội dung | Khung | Thành phần |
|---|---|---|---|
| Q-A1 ① (05 1.4 T1) | Việc TVV ở "Việc của bạn" trên Tổng quan TVV; không thêm menu Công việc | k1–k7, a | `HangDoiViec` |
| L1 (05 5.1–5.3) | Việc sinh ngay khi GVCN lưu, kể cả lần chờ QL duyệt ("chờ QL duyệt"); GVCN xin thu hồi → việc vẫn chạy (ghi rõ) | k1, a | dòng việc |
| L2 · 05 5.4 | Hạn = ngày lưu + 4, hết 23:59; dòng "⚠ 2 ngày" / "Hôm nay" / "còn 4 ngày"; chi tiết "hạn hết 23:59 12/09" | k1–k3 | `ChipHan` |
| 05 5.5 F2 | Form 4 hàng chip: Liên hệ PH · Cách + ngày (`ONgay`) · PH phản hồi · Kết quả / ghi chú (+ "＋ Thực tế khác nội dung GVCN"); đầu chỉ đọc, không nhập lại dữ liệu GVCN; SĐT bấm gọi | k1, k9, b | `KhungViec` · `chip-chon` |
| 05 5.5 | "Có ý kiến khác" → ghi chú bắt buộc; chuông GVCN | k9 | — |
| Q-D3 ① (05 5.8 b) | "Chưa liên hệ được" → hàng Lần thử + "Lưu lần thử"; "Kết thúc · không liên hệ được…" hộp neo, ghi chú bắt buộc, GVCN nhận chuông; không bắt đủ n lần | k2, k3 | hộp neo bậc 2a |
| Q-D3 ① (05 5.7) | Em chưa có TVV → việc về QL ("Chưa có TVV · Gán TVV…"); thiếu SĐT → thêm trong form | k9 | — |
| 21/10-TVV · 05 7.2 | Chốt ngày thi (không hạn): ngày thi hoặc dời tháng; ngày đã qua chọn được; chip B "◌ Chưa chốt ngày thi · 09/2026" | k4, c | `ONgay`, `ChipLichThi` |
| 21/10-TVV | Cập nhật KQ thi thật (không hạn, chuyển từ GVCN lớp cuối); "Em không thi…" | k5 | — |
| 21/10-TVV | Chọn bước tiếp: hạn 1 tuần từ ngày có KQ thi thật; một người giữ (TVV của em) | k6 | — |
| Q-D4 ① | Bổ sung hồ sơ: 4 trường (Ngày sinh · Email · Tuần bắt đầu · Target FT), một dòng tổng, sửa từng ô | k7 | `Bang` |
| 05 5.11 | Ô "Thang" (hồ sơ lớp › Ý thức, bảng theo em) có dòng phụ trạng thái báo PH: "PH: chờ TVV · hạn" · "⚠ TVV quá hạn n ngày" · "PH ✓ dd/mm" · "PH ✗ không liên hệ được" (chữ + ký hiệu); mở dưới hàng có lịch sử TVV; toast GVCN "TVV … nhận việc · hạn …" | k8, d | `Bang` + mở dưới hàng |
| 05 5.6 | Trạng thái: Chờ ghi kết quả · Chưa liên hệ được · lần n · Đã báo PH · dd/mm · Không liên hệ được · Đã huỷ · {lý do} | k1, k2, k8 | `Nhan` |
| HTT-10, 11 | Bản nháp / đang lưu / đã lưu; dòng xong mờ, tự sang việc kế; lỗi kiểm khi bấm, giữ chữ | k2, k3, k7 | `TrangThaiLuu` |
| 04 16 | 375: toàn màn, nút Gọi to 48 px, chip 40 px, nút dính đáy; Chốt ngày thi = tấm dưới đáy | b, c | khung 375 |

## 2. GIỮ
Thang 6 bậc, bậc kế máy điền, hạn 5 ngày của GVCN, thẻ Báo QL khi GVCN quá hạn (không thêm cho TVV) · "Báo PH kết quả Test lớp thường" vẫn của GVCN · Phối hợp SOS ≠ vi phạm.

## 3. BỎ (web hiện tại)

| Bỏ | Nguồn |
|---|---|
| GVCN tự ghi "Đã gửi Report cho PH qua Zalo" trong ô mô tả | `yThuc` |
| TVV chỉ đọc Ý thức, không có việc | quyền TVV |
| "Chọn bước tiếp" là "của tôi" cho QL + mọi TVV chi nhánh | `buoc_tiep` |
| "Cập nhật KQ thi thật" của GVCN lớp cuối, có hạn | X-80 |
| "Thiếu thông tin" 7 trường, mỗi em một việc | X-26 |
| Tiêu đề "Học viên của tôi" | Tổng quan TVV |
| Xoá thẳng lần xử lý (`xoaXuLy`) — thay "Thu hồi…" qua QL | `server/src/yThuc/xuLy.ts:622-638` (k8 nút "Thu hồi…") |

## 4. Đích đo
Ca thường "đã gọi, PH đồng ý": 3 bấm, không gõ · việc đầu: 3 bấm từ khi đăng nhập (vào trang là thấy, việc đầu chọn sẵn) · Chốt ngày thi: 2 bấm · 0 đổi trang mọi việc.

## 5. Cần chủ SP chọn
1. Form F2 bốn hàng chip.
2. Tên việc "Ghi kết quả xử lý · …", nút "Ghi kết quả".
3. Hạn ngày lưu + 4, hết 23:59.
4. "Kết thúc · không liên hệ được" không bắt đủ n lần thử.
5. Bổ sung hồ sơ sửa ngay trong khung phải.

## 6. Dữ liệu cần (DATA-TVV / SEED-UX)
Gán TVV cho em (demo 4/129 có TVV) trước khi bật; SĐT PH; tài khoản TVV "Hoàng Gia Mai" (tên giả trong mockup).
