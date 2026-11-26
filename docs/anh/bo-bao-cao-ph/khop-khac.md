# BO-BAO-CAO-PH — bỏ Báo cáo PH của từng em, chọn nhiều (chủ SP 26/11)

Không mockup: ô tick + thanh thao tác dính đáy theo khuôn chọn nhiều sẵn có (`chonNhieuHocVien.tsx` — Lưu trữ, Học viên lớp), không đổi bố cục (plan.md 1.3b).
Ảnh cặp TRƯỚC (main) | SAU (PR, đang tick 3 em, một em đã bỏ), tab Báo cáo PH, Head MB, lớp MB FT 101:
`1440-` · `1280-` (tối) · `375-` (sáng) `bao-cao-ph-truoc-sau.png`.

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Bỏ báo cáo một / nhiều em một đợt | Không có (chỉ "Không báo cáo đợt này" cho cả lớp) | Head / Quản trị / Admin: tick em (ô đầu dòng; 375: trên dòng tên) → thanh dính đáy "n đã chọn · Không báo cáo · n em · Bỏ chọn" → làm ngay, MỘT toast Hoàn tác cho cả lô |
| Khôi phục em đã bỏ | — | Tick dòng mờ → "Khôi phục · n em" (chọn lẫn hai loại: hiện cả hai nút) |
| Thấy em đã bỏ | — | Dòng mờ cuối bảng: "Không báo cáo · {người bỏ} · {ngày}", ô phần "–", không Xuất; 375: danh sách mờ sau "Xem thêm" |
| "Cả lớp đủ n / N", hàng Đủ, "bạn còn n / m", Đặt nhanh, nút "Viết …" (375) | Mọi em | Chỉ em cần báo cáo |
| Viết / xem phần, Xuất Excel / PDF lớp, Xuất từng em, Đặt nhanh, + Đợt, Không báo cáo đợt này, Sửa / Xoá đợt | Có | Giữ nguyên (không mất thao tác nào) |
| GV, TVV | — | Không có ô tick; gọi thẳng API → 403 |
| Đổi đợt | — | Bỏ chọn (chọn theo đợt) |

## Ngoài màn (cùng một hàm `emTrongDot`)
Em đã bỏ rời: việc GV "Báo cáo PH" (Công việc, chuông, badge), chip tab lớp, việc Admin "Xuất báo cáo PH", nhắc QL "Báo cáo PH quá hạn",
Excel / PDF lớp + Xuất Excel nhiều lớp theo tháng. Bỏ em cuối còn thiếu → lớp "đủ" → tin Admin + việc Xuất (ngày đủ = sau cùng của lần lưu / lần bỏ).
Bỏ theo LỚP: em học hai lớp, bỏ ở lớp A không ảnh hưởng lớp B.

## Chỉnh nhỏ
- Không tiêu đề cột "chọn tất cả" (luật V5: không điều khiển trong tiêu đề bảng).
- Không hộp hỏi lý do: bỏ là làm ngay + Hoàn tác (khôi phục được, bài đã viết giữ) — luật "không thêm bước". Lịch sử: ai / lúc nào trên dòng + nhật ký mỗi em (hồ sơ HV › Lịch sử).
