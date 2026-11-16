# AU-CHU · PR3 CASE-Y-THUC-GON — khớp / khác

Gói 7 audit 16/11 (A1-04, A1-13, B3-05, B3-06, B3-07, B3-22). Ảnh cặp TRƯỚC (main 4719a608b) | SAU, demo, tối, phông Be Vietnam Pro đã nạp:

| Ảnh | Màn · vai | Thấy gì |
|---|---|---|
| `xac-nhan-case-1440.png` | Công việc › Case học thuật › Xác nhận Case · GVCN 7 | Tiêu đề "[Progress Test] L không đạt [SOS 1]" → "Case Listening · Progress Test" (SOS ở chip); "Việc tiếp ›" thành nút viền khi Case chờ xác nhận (một nút chính "Xác nhận Case" trong thân); dòng danh sách "MB FOU 15 · Listening", "MB FT 101 · Listening" (động từ ở nút) — A1-04, A1-13 |
| `mo-ta-case-1440.png` | Công việc › Mô tả Case · GVCN 7 | Case chưa có nguyên nhân: hàng chip mở sẵn — B3-05 |
| `xu-ly-chen-1440.png` | Hồ sơ HV › Xác nhận xử lý · GVCN 7 | Nút "Chèn" dưới ô Mô tả: điền "REPORT 2 · {các vi phạm đang chọn}", sửa được — B3-06 |
| `vi-pham-goi-y-1440.png` | Hồ sơ HV › + Vi phạm / Nhắc nhở · GV S 9 | Chọn Nhóm BTVN → chip "Không nộp BTVN · Nộp thiếu BTVN · Nộp BTVN muộn" điền ô Vi phạm — B3-07 |
| `phoi-hop-1440.png` · `phoi-hop-lo-1440.png` · `phoi-hop-lo-375.png` | Công việc › Phối hợp SOS · Trao đổi với gia đình (8 em) · GVCN 7 | Nút "Xác nhận 8 em ▾" → chọn em (mặc định tất cả) · Ngày (hôm nay) · Nội dung chung → "Xác nhận n em" — B3-22 |

| Mã | Sửa | Ghi chú |
|---|---|---|
| A1-04 | Tên Case lớp thường tự sinh → khuôn "Case {kỹ năng} · {bài}"; bỏ dòng "SOS · SOS 1 · theo số môn trượt…" trong thân; "Việc tiếp ›" viền khi Case chờ xác nhận; chip "Em này còn" xuống dòng ở 375 | tên Case GV tự đặt giữ nguyên |
| A1-13 | Danh sách tab Case: bỏ động từ "Xác nhận Case · / Xác nhận PA · / Chọn PA ·" khỏi tên dòng (đã có ở nút); panel mở từ "Ghi Mini Test" tên "Ghi Mini Test" | KHÁC: chip "Đạt kỳ vọng" lên dòng phụ chưa làm (đổi bố cục dòng — để gói 10 / mockup) |
| B3-05 | Panel Case chưa có nguyên nhân: hàng chip mở sẵn, chọn là lưu như cũ (bớt bấm "Sửa nguyên nhân") | Case MT: nhóm vẫn lưu cùng Mô tả như cũ |
| B3-06 | Xác nhận xử lý: nút "Chèn" điền bậc kế + tên các vi phạm đang chọn; ô vẫn bắt buộc, sửa được, không điền sẵn (NT-SUA P1-3 giữ) | |
| B3-07 | Ghi vi phạm: chọn Nhóm → 3 câu hay dùng (`GOI_Y_VI_PHAM`), bấm là điền ô Vi phạm; "Khác" không gợi ý | câu gợi ý do PTA soạn — chủ SP đổi được ở `shared/domain/yThuc.ts` |
| B3-22 | Phối hợp SOS (GVCN, ≥ 2 em chờ): "Xác nhận n em ▾" → chọn em · Ngày · Nội dung chung → gọi đường xác nhận sẵn có từng em; lô lỗi một phần: em lỗi giữ chọn + câu lỗi | KHÁC: chọn em bằng chip trong khối (không thêm ô chọn ở từng hàng — giữ lưới dòng) |
| (sửa PR 1) | Ô "Vi phạm" dùng `dem.can` làm TRẦN 60 → sau A1-19 mất bộ đếm; đổi sang `toiDa` ("n / 60") | lỗi do #1790 |

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau |
|---|---|---|
| Xác nhận Phối hợp 8 em | 8 × (Xác nhận → gõ → Lưu) = 16+ bấm | Xác nhận 8 em ▾ → gõ một lần → Xác nhận 8 em (3 bấm); từng em vẫn Xác nhận / Sửa ở dòng |
| Ghi vi phạm | chọn Nhóm + gõ Vi phạm | chọn Nhóm + bấm chip (hoặc gõ) |
| Mô tả xử lý | gõ tay | Chèn rồi sửa (hoặc gõ) |
| Case chưa nguyên nhân | Sửa nguyên nhân → chọn → Xong | chọn (chip mở sẵn) |
Không mất thao tác nào.

## Dòng đọc Turso
0 câu đọc thêm. B3-22 gọi đường `/phoi-hop-sos/:id/confirm` sẵn có cho từng em đã chọn (cùng số lần ghi như bấm từng em).
