# Truy vết — `con-lai.html` (V5-B3 · trang còn lại)

> **Đã vào mã → PR #560 UI-CON-LAI** (TL-V5, 24/10). Mockup đã duyệt (`10` đầu tệp: phần chủ SP không góp ý = duyệt); chỗ web khác khung + lý do: `docs/anh/<pr>/khop-khac.md` của PR đó.

V5-B3 · 22/10/2026 · dựa trên nền V5-A. Trạng thái: **ĐỀ XUẤT THIẾT KẾ**. Dữ liệu demo. Ảnh toàn trang `anh/con-lai-{1440-sang,1440-toi,1280,375}.png`, từng khung `anh/con-lai-k1…k8-*.png`.
Tệp này gồm 8 khung tĩnh (một trang dài, mục lục ở thanh mockup). Tương tác chỉ minh hoạ bằng trạng thái vẽ sẵn — không phải bằng chứng workflow chạy được (brief 19 B).

## Yêu cầu → khung → thành phần

| Yêu cầu (brief 16 "rà soát cả…") | Loại | Khung (ảnh) | Thành phần / quyết định |
|---|---|---|---|
| Tìm kiếm | ĐX | k1 `con-lai-k1-tim-kiem` | ô ở thanh trên (/ hoặc Ctrl K); kết quả nhóm HV / Lớp / GV có số; chữ khớp tô hồng nhận diện; ↑ ↓ Enter Esc; chỉ trong phạm vi quyền; rỗng nói cách tìm tiếp |
| Bộ lọc tuần | ĐX | k2 `-chon-tuan` | một kiểu ‹ W3 SEP › + "Tuần này" + lịch theo tháng (tuần thuộc tháng chứa thứ Năm); khoảng tuần chỉ ở Phân tích, tối đa 13, lỗi nói đã giữ gì |
| Hộp duyệt · T22 thu hồi / sửa xử lý đã duyệt | CHỐT (T22) + ĐX | k3 `-hop-duyet-thu-hoi` | danh sách cũ nhất trước + panel duyệt đủ bối cảnh; nêu hậu quả trước khi duyệt; lịch sử TVV giữ; "Duyệt thu hồi / Từ chối (lý do)"; Hoàn tác 5 s chỉ cho thao tác của chính mình, không vòng qua duyệt; MT4 chỉ do người thêm tay (T04) |
| Thông báo ≠ số việc (brief 7) | CHỐT | k4 `-thong-bao` | Công việc (n) = việc của tôi; chuông = chưa đọc, dáng khác (nền trắng chữ xanh); đọc ≠ xong việc |
| Biểu mẫu thêm / sửa · T15 xung đột / mất mạng | CHỐT (T15) | k5 `-bieu-mau-xung-dot` | lỗi tại ô + "Còn 1 ô cần sửa"; ô ngày gõ được + nút lịch (ONgay); xung đột: bảng "Bản đã lưu / Bạn đang sửa", chưa ghi đè, chọn một; mất mạng: không báo đã lưu giả, Thử lại, giữ chữ |
| Trang rỗng / lỗi | CHỐT | k6 `-rong-loi` | băng mất kết nối (đếm thay đổi chưa gửi); 403 nói lý do + đường khác; 404 / lưu trữ; rỗng đúng nghĩa một dòng (brief 6.6) |
| In / xuất · brief 12 xuất theo bộ lọc | CHỐT | k7 `-in-xuat` | panel Xuất: phạm vi "theo bộ lọc 38 HV (cả 3 trang)" / "đã chọn 12 HV", nút ghi số HV; In A4 ngang nền sáng, có tử / mẫu, ký hiệu ✓ ✗ – |
| T21 mobile mở bàn phím trong panel | CHỐT | k8 `-mobile-ban-phim`, `con-lai-375` | panel toàn màn, thanh dưới ẩn, chân Lưu dính trên bàn phím (`visualViewport`), ô ≥ 44 px, chữ ô 16 px |

## BỎ

- Hàng nút "Hôm nay · Hôm qua · 2 ngày trước" ở ô ngày (CLAUDE.md).
- Chuông dùng chung số việc (nhập nhằng việc / thông báo).
- Xuất ngầm chỉ trang đang thấy.

## GIỮ

- Luật thu hồi hiện hành (`server/src/yThuc/xuLy.ts:668-735`): GVCN gửi duyệt, QL áp; vi phạm về "chưa xử lý"; `06` điểm 6.
- Hoàn tác chung 5 s (`shared/domain/hoanTac.ts`); MT "-" 10 s (#503) không vẽ ở đây.
- Quyền xem hồ sơ GV người khác (`analysis.view_teacher`).

## Giả định

- Panel Báo PH ở k8 dùng dáng của bảng mẫu V5-A mục 7 (chi tiết form do V5-B1 vẽ ở `tvv.html`).
- Thời điểm TVV "Đã báo PH 14/09 15:30" ở k3 là tình huống riêng cho T22 (khác T10 ở B1).

## CẦN XÁC MINH

- Không có (luật thu hồi khi TVV đã ghi đã chốt theo khuyến nghị `06` điểm 6).
