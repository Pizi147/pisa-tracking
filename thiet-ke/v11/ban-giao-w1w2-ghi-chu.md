# V11 · Bàn giao chuyển lớp tách W1 / W2 — ghi chú mockup (03/11, chờ chủ SP duyệt)

Mockup: [ban-giao-w1w2.html](ban-giao-w1w2.html) · nguồn: audit 03/11 mục 7 + 14.4 · tệp rà `docs/superpowers/specs/2026-11-03-audit-overhaul/11-ban-giao.md`.
Hình ảnh = v9 `phan-cong-gv.html` (CSS chép nguyên từ v9 + vài lớp mới cùng token). 1440 TỐI · 375 SÁNG.

## Đã vẽ
| Khung | Vai | Trạng thái |
|---|---|---|
| 1 (1440 + 375) | GVCN lớp cũ (mẫu F) | W1 đã có · W2 chờ (Điền thay) · R Cùng GV · dòng "Writing · cũ" chỉ đọc · nhận xét chung đã lưu |
| 2 (1440) | GV dạy CẢ W1 + W2 (mẫu G hai cột — MỚI) | đã lưu · đang gõ · đang lưu · lỗi giữ chữ · Không học W2 · Cùng GV W1 · câu cũ dưới ô trống · toast sau Đóng khi còn ô lỗi |
| 3 (1440) | GV chỉ dạy W2 (mẫu G một cột, như web) | Không học W2 · câu cũ để tham khảo |
| 4 (375) | GV dạy W1 + W2 | mỗi em một thẻ, hai ô dọc · Cùng GV · câu cũ |
| 5 (1440) | Công việc | MỘT việc "Bàn giao môn W1 · W2" cho GV dạy cả hai |

## Không vẽ
Công việc 375 (dòng việc như mọi việc, chỉ đổi chữ) · đang tải / lỗi tải (như mọi panel) · QL điền thay (như GVCN) · bàn giao khi đổi GV (đã tách W1 / W2 từ trước) · 1440 sáng / 375 tối (cùng token).

## Quyết định của người vẽ — chủ SP duyệt
1. GV dạy cả W1 + W2: gộp MỘT việc, bảng hai cột (mục 7 "không bắt mở hai panel"); 375 thành thẻ.
2. Ô không cần nhập = khung nét đứt có chữ ("Không học W2", "Cùng GV · không cần bàn giao") — không ẩn hàng (em vẫn cần câu môn khác).
3. Câu Writing cũ: dòng cuối danh sách môn (GVCN) + chữ nhỏ dưới ô còn trống (GVBM); không điền sẵn vào ô (17.4).
4. Không thêm nút "Chép W1 sang W2" (audit cho đề xuất "sao chép có chủ đích" — để sau nếu GV cần).

## Vòng critique
- Vòng 1 (03/11): 31/40, không P0. Đã sửa 5 P1 (nhãn ô theo em + task · số đếm một nguồn · câu báo Đóng nói rõ mất chữ · "Còn … ↑" là nút · Điền thay là nút 44 px ở 375) + P2 (hạn thống nhất 19/09, thẻ Cùng GV / câu cũ ở 375, listbox 375, đánh số khu, ✓/✗ ở cột Kết quả, toast sát chân).
- Vòng 2 (03/11): **35/40**, không P0 / P1. Đã sửa thêm P2: nút "Còn …" cao 44 px ở 375, ô lỗi có aria-invalid + aria-describedby, nhãn "Điền thay W2 · em", toast nằm trong panel, thống nhất gọi "khu".
