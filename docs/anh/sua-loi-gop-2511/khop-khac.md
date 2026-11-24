# SUA-LOI-GOP-2511 · PR 1 — 7 lỗi + 3 nâng cấp Cuối khoá (chủ SP duyệt 25/11)

Hình ảnh giữ như hiện tại (không đổi màu, khung, cột). Chỉ đổi chữ / thao tác theo mẫu sẵn có.
Ảnh cặp cả màn trước | sau: `cuoi-khoa-1440.png` · `cuoi-khoa-1280.png` · `cuoi-khoa-375.png` (MB FOU 12, QL, chọn 3 em, thanh Áp "Lên BE · MB BE 05", một em Học lại chưa có lớp).
Chờ duyệt trước | sau: `cho-duyet-lo-loi-1440.png` · `-1280` · `-375` (chọn 1 thẻ, Duyệt lỗi một phần: trước mất lựa chọn + lý do ở toast; sau giữ thẻ, lý do dưới dòng, chip "Tutor") · `cho-duyet-chon-1440.png` (nút "Từ chối 1…" → "Từ chối 1 yêu cầu").

## Thao tác trước → sau

| Chỗ | Trước | Sau | Mất thao tác? |
|---|---|---|---|
| Thanh Áp › Lớp › "+ Mở lớp mới…" | Lớp mới chỉ vào ô của thanh; các em đã tick không có lớp; hai toast "Đã tạo lớp" + "Đã mở" | Lớp mới vào ngay các em đã tick (như chọn lớp có sẵn); một toast "Đã tạo lớp" | Không |
| Thanh Áp › đổi một ô (Bước tiếp / Lớp / Tuần / Kỳ vọng) | Ghi lại cả hướng + lớp + tuần cho mọi em đang chọn (đè phần sửa tay) | Chỉ áp ô vừa đổi; đổi Bước tiếp thì bỏ lớp không còn hợp | Không |
| Bỏ hết lựa chọn (ô dòng, Chọn tất cả, tick nhóm, sau Chốt / Lưu nháp) | Thanh Áp giữ giá trị cũ cho lần chọn sau | Thanh Áp về trống | Không |
| Lưu nháp có em lỗi khi xoá nháp | Dừng giữa chừng, không tải lại, không báo em nào | Em lỗi giữ dòng + lý do; chân "Thử lại n em" chỉ gửi em lỗi | Không |
| GVCN Lưu nhận xét khi đang gõ ô khác | Chữ đang gõ bị xoá | Chữ gõ thêm giữ nguyên; gõ rồi trả về như cũ = 0 thay đổi, rời trang không hỏi | Không |
| Tạo / Mở lớp — chi nhánh tải lỗi / đang tải | Ô chi nhánh "…" mãi, khối Phân công mất, không báo | Hộp lỗi + "Thử lại"; đang tải khoá ô; chi nhánh ngoài quyền báo rõ, nút Mở lớp khoá | Không |
| Tạo / Mở lớp — đổi tuần / lịch MT / chương trình rồi ✕ hoặc "‹ Chốt lộ trình" | Đóng luôn, mất phần đã chọn | Hỏi "Bỏ chữ đang gõ?"; form vừa mở thì đóng không hỏi | Không |
| Chờ duyệt › Duyệt / Từ chối nhiều lỗi một phần | Bỏ hết lựa chọn, mất chữ lý do, lý do chỉ 3 thẻ đầu qua toast | Giữ thẻ lỗi (bỏ thẻ người khác đã xử lý / không còn), giữ chữ lý do, lý do ở từng dòng; bấm gửi lại thì đọc lại trạng thái máy chủ trước (đọc lỗi → báo, nút không khoá) | Không |
| Chờ duyệt › thanh chọn | "Từ chối 1…" (đọc như bị cắt) | "Từ chối 1 yêu cầu" (cùng dáng "Duyệt 1 yêu cầu") | Không |
| Thanh Áp › tick thêm em sau khi đã chọn Bước tiếp, rồi chọn Lớp | Em mới có lớp, không có hướng | Em chưa có hướng / hướng theo gợi ý nhận kèm hướng của thanh; em sửa tay hướng khác chỉ nhận lớp hợp hướng | Không |
| GVCN bấm Lưu nhận xét lần nữa khi chưa tải lại xong | Gửi lại với dấu thời gian cũ → 409 | Chữ vừa gửi không tính đổi (nút "· 0 em", rời trang không hỏi) | Không |
| Chờ duyệt › dòng Đề xuất PA / PA khác quy chế | Chip đợt (MT1) | Chip loại PA "Tutor" / "Bổ trợ" + chip đợt (mockup v24 H1) | Không |
| (a) Nút Chốt | "Chốt · 2 em" | "Chốt 2 em → MB BE 05 · W4 SEP"; nhiều lớp / tuần: "2 lớp" / "2 tuần"; không lớp: "Không chuyển lớp" | Không |
| (b) Số "n em chờ chọn lớp / cần sửa / chưa có hướng" ở chân | Chữ thường | Bấm được: lọc đúng các em đó (chip "✓ … ✕" để bỏ lọc) + con trỏ vào ô Lớp / Hướng em đầu | Không |
| (c) Thanh Áp | "3 em đã chọn" | "3 em đã chọn · 2 sẵn sàng chốt" | Không |

## Ghi chú
- 375: chữ "Ngay hôm nay" trong nút xuống 3 dòng — có từ trước (cả ảnh trước), thuộc rà cân cột (`ra-can-cot`), không sửa ở đây.
- Nút Chốt ở 375 xuống hàng riêng rộng hết (chữ dài hơn) — không cắt "…".
