# Truy vết — `trang-thai-hv.html` (V6 · trạng thái HV · Bước tiếp · Lưu trữ)

> **MOCKUP-V6 · CHỜ CHỦ SP DUYỆT** (25/10). Mở khoá P7. Nguồn: `docs/superpowers/specs/2026-10-24-cai-tien-da-chot-design.md` 3.1, 3.2, GPT 7; câu hỏi Q1 (chủ SP chọn khuyến nghị 25/10).
> Ảnh: `anh/trang-thai-hv-{1440-toi,375}.png` (toàn trang), từng khung `anh/trang-thai-hv-k1…k6-*.png` (1440 tối) và `…-375.png`. Dữ liệu demo T2 14/09/2026.

## 1. Yêu cầu → khung → thành phần

| Yêu cầu | Khung (ảnh) | Thành phần |
|---|---|---|
| R2.1a một nút "Tạm dừng/ Kết thúc học" | k1 `-k1-menu` | menu ⋯ chia nhóm Hồ sơ · Lớp & lộ trình · Trạng thái; một mục, đúng chữ chủ SP |
| R2.1b em tạm dừng vào Lưu trữ, Q1 | k2 `-k2-hop` a | hộp nhỏ: Từ ngày (ONgay) · Lý do (tuỳ chọn) · ô "Có thể quay lại học" (bật giữa khoá) · "Khi lưu, web sẽ" (Lưu trữ · giữ chỗ lớp · lộ trình đứng yên · Case dừng hạn) |
| Kết thúc học | k2 b | cùng hộp, ô tắt → nút "Kết thúc học", tóm tắt viền vàng (rời lớp · kết thúc lộ trình · đóng Case · huỷ lượt chưa điểm) |
| Trạng thái lưu, lỗi, chặn | k2 c–f | Đang lưu… (nút tắt) · lỗi mạng giữ chữ + Thử lại · toast Hoàn tác 10 s · bị chặn: lý do + nút đi tiếp (Chuyển lớp…) |
| Hàng loạt lớp | k3 `-k3-hang-loat` | thanh chọn "3 em đã chọn": Tạm dừng/ Kết thúc học · Chuyển lớp… · Xuất · Bỏ chọn → cùng hộp "· 3 em"; lỗi một phần: "Đã lưu 2 em" + em lỗi giữ lý do + "Thử lại 1 em" |
| R2.2 Bước tiếp hai hướng | k4 `-k4-buoc-tiep` | KQ thi một dòng + Sửa · hai nút lớn không chọn sẵn · "Gia hạn 1 tuần" · Lịch sử; chọn hướng 1 → nội dung hộp ngay trong panel, ô tắt sẵn; hướng 2 → panel Lộ trình mới (`lo-trinh-moi.html` k1); GVCN chỉ xem; đã chọn → Hoàn tác |
| R2.1c Trang Lưu trữ + Quay lại học | k5 `-k5-luu-tru` | tab Học viên đã lưu trữ có em tạm dừng (nhãn tiến độ "Tạm dừng · Có thể quay lại") · một nút Quay lại học; lớp cũ còn chạy → một bấm + Hoàn tác; lớp cũ đã kết thúc → hộp chọn lớp (ô gõ lớp P4) + Bắt đầu; rỗng |
| R2.4 / GPT 7 hồ sơ lưu trữ | k6 `-k6-ho-so-luu-tru` | dòng tóm tắt (lộ trình gần nhất · Target · thi thật · kết quả · ngày kết thúc) + "Lộ trình & lớp" như cũ + nút chính Quay lại học; biến thể em tạm dừng |

## 2. Thao tác TRƯỚC → SAU

| Thao tác | Trước (mã 24/10) | Sau | Lý do |
|---|---|---|---|
| Tạm dừng một em | ⋯ › "Tạm dừng / Thôi học" › tab Tạm dừng › Lưu (4 bước) | ⋯ › "Tạm dừng/ Kết thúc học" › Tạm dừng (3) | một hộp |
| Kết thúc học + lưu trữ | ⋯ › Tạm dừng / Thôi học › tab Thôi học › Lưu › ⋯ › Lưu trữ › xác nhận (6) | ⋯ › mục › bỏ tích › Kết thúc học (4) | lưu trữ tự động |
| Hàng loạt | chọn n › Tạm dừng hoặc Kết thúc học hoặc Lưu trữ (3 mục) | chọn n › một mục › nút | gộp |
| Bước tiếp sau thi | 3 lựa chọn (Lộ trình mới · Tạm dừng · Thôi học) | 2 nút | R2.2 |
| Quay lại học em tạm dừng | hồ sơ ⋯ › Quay lại học (em không ở Lưu trữ) | Lưu trữ › Quay lại học (1 bấm, Hoàn tác) | em nay ở Lưu trữ |
| Em Kết thúc học quay lại | Lưu trữ › Bỏ lưu trữ › hồ sơ ⋯ › Học lại (bị chặn khi lưu trữ, `students.ts:276`) | Lưu trữ › Quay lại học → panel Lộ trình mới | bỏ ngõ cụt |
| GIỮ | Hoàn tác 10 s · Gia hạn Bước tiếp · Huỷ hẹn · Tổng kết · Chọn nhiều ở Lưu trữ · tìm + lọc chi nhánh | như cũ | V1 |
| BỎ | mục menu "Lưu trữ", "Bỏ lưu trữ", "Học lại"; tab Thôi học riêng | thay bằng Kết thúc học (tự lưu trữ) + Quay lại học | một khái niệm một tên |

## 3. Giả định · cần xác minh

- Q1 khuyến nghị: tạm dừng giữ chỗ lớp, lộ trình đứng yên, Case dừng hạn; migrate một lần đưa em `inactive` hiện có vào Lưu trữ.
- Kết thúc học đóng Case như hiện có (`cases/systemClose.ts`, Hoàn tác mở lại đúng Case). "Huỷ MT3 chưa có điểm" theo luật thôi học hiện hành — P7 kiểm lại dòng tóm tắt bằng cùng hàm máy chủ.
- Lý do chặn ở k2 f / k3 (quyết định chuyển lớp đang chờ) là ví dụ; P7 dùng đúng câu lỗi máy chủ.
- Dữ liệu demo V6: Bùi Thanh Tùng, Hoàng Gia Bảo, MB FT 98 / 95 / 81 / 104 / 107; điểm thi thật của Đinh Ngọc Quyên (L 7.5 R 7.0 W 6.5 S 6.5).
- Không cần [XM] thêm.
