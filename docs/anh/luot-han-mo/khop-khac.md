# LUOT-HAN-MO — "⚠ quá hạn" của người khác chữ mờ (FT) · nhật ký "Khôi phục" (một khái niệm một tên)

Hai việc "Để sau" của LUOT-TEN-GV (#660, P2) và LUOT-KHOI-PHUC (#668, P3). Không đổi bố cục. Ảnh trước / sau (1440 tối, DB demo cục bộ):
`ft-166-truoc.png` → `ft-166-sau.png` (GVCN vai 7, MT FT 166: L / R của tôi, W / S của người khác) ·
`lt-184-ls-truoc.png` → `lt-184-ls-sau.png` (QL vai 2, Lịch sử lượt 184 sau huỷ / khôi phục).

| # | Luật | Web | Kết quả |
|---|---|---|---|
| 1 | Đỏ chỉ khi là việc của người xem (#660, cột Trạng thái LT) | FT cột Trạng thái: `DeadlinePill mo` khi người xem không nhập được ô nào của môn → "⚠ quá hạn n ngày" chữ mờ (`text-slate-400`, không đậm); việc của tôi giữ đỏ đậm. `QuaHan` / `Han` / `DeadlinePill` thêm `mo` (mặc định như cũ — các màn khác không đổi) | KHỚP |
| 2 | Một khái niệm một tên | nhật ký lượt `reopened`: "Mở lại" → "Khôi phục" (cùng nút "Khôi phục …"), dùng chung FT + lớp thường (`DongThoiGianLuot`); EN "Restore" có sẵn. Mốc Case "Mở lại" (`MILESTONE_KIND_LABEL`) là khái niệm khác — giữ | KHỚP |

## Thao tác TRƯỚC → SAU

| Trước PR | Sau PR |
|---|---|
| FT: quá hạn môn người khác đỏ đậm như việc của mình | chữ mờ; việc của mình vẫn đỏ |
| Lịch sử lượt: "Mở lại" sau khi bấm "Khôi phục" | "Khôi phục" |

Không bỏ / thêm thao tác.
