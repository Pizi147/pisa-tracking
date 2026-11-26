# BO-BAO-CAO-PH — bỏ Báo cáo PH của từng em (chủ SP 26/11)

Không mockup: thêm link theo mẫu sẵn có ở dòng em (cùng dáng link Excel / PDF), không đổi bố cục (plan.md 1.3b).
Ảnh cặp TRƯỚC (main) | SAU (PR), tab Báo cáo PH, Head MB, lớp MB FT 101: `1440-` · `1280-` (tối) · `375-` (sáng) `bao-cao-ph-truoc-sau.png`.

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Bỏ báo cáo MỘT em một đợt | Không có (chỉ "Không báo cáo đợt này" cho cả lớp) | Head / Quản trị / Admin: link "Không báo cáo" cuối dòng em (375: trên dòng tên) → làm ngay, toast Hoàn tác |
| Khôi phục em đã bỏ | — | Link "Khôi phục" đúng chỗ đó ở dòng mờ cuối bảng (375: danh sách mờ sau "Xem thêm") |
| Thấy em đã bỏ | — | Dòng mờ cuối bảng: "Không báo cáo · {người bỏ} · {ngày}", ô phần "–", không Xuất |
| "Cả lớp đủ n / N", hàng Đủ, "bạn còn n / m", Đặt nhanh, nút "Viết …" (375) | Mọi em | Chỉ em cần báo cáo |
| Viết / xem phần, Xuất Excel / PDF lớp, Xuất từng em, Đặt nhanh, + Đợt, Không báo cáo đợt này, Sửa / Xoá đợt | Có | Giữ nguyên (không mất thao tác nào) |
| GV, TVV | — | Không thấy link; gọi thẳng API → 403 |

## Ngoài màn (cùng một hàm `emTrongDot`)
Em đã bỏ rời: việc GV "Báo cáo PH" (Công việc, chuông, badge), chip tab lớp, việc Admin "Xuất báo cáo PH", nhắc QL "Báo cáo PH quá hạn",
Excel / PDF lớp + Xuất Excel nhiều lớp theo tháng. Bỏ em cuối còn thiếu → lớp "đủ" → tin Admin như khi viết xong.

## Chỉnh nhỏ
- Cột phần 120 → 108 px khi người xem có cột "Không báo cáo" — bảng vừa 1280 không cắt chữ (1440 vẫn chia đều).
- Không hộp hỏi lý do: bỏ là làm ngay + Hoàn tác (khôi phục được, bài đã viết giữ) — luật "không thêm bước". Lịch sử: ai / lúc nào trên dòng + nhật ký em (hồ sơ HV › Lịch sử).
