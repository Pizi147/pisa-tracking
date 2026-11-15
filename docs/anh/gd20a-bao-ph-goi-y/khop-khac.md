# GD-20a BAO-PH-GOI-Y — khối "Bạn đã ghi tháng này" + Chèn (mockup ⑫ `thiet-ke/v21/gv-viet-it.html` A1–A6, E1)

## Ảnh cặp (trái mockup │ phải web; demo 14/09, GV 7 Trần Ngọc Hà, MB FT 101 · Tháng 8; `scripts/anh-cap.mjs`, Edge headless 1:1, phông Be Vietnam Pro đã nạp)
| Ảnh | Khung | Trạng thái web |
|---|---|---|
| `cap-1440-toi-a1.png` | A1 | Listening · Lê Quang Huy · ô trống, khối mở, câu kết quả PA (nguồn dài, xuống 2 dòng — không cắt) + Chèn |
| `cap-1440-toi-a5.png` | A5 | Nhận xét chung · Phạm Bảo Ngọc · xử lý Report 1 + 3 vi phạm (người khác ghi có "· {tên} ghi") |
| `cap-1440-toi-a6.png` | A6 | Listening · Lê Quang Huy · ô đã có chữ → khối gập "Bạn đã ghi tháng này · 1 · Xem" |
| `cap-375-sang-e1.png` | E1 | 375 sáng · Listening · Lê Quang Huy · khối dưới ô, nguồn đủ chữ, Chèn 44 px, chân Đóng · Lưu · em tiếp › |

A2 (sau Chèn), A3 (không có câu), A4 (đang tải / lỗi) bấm thử trên trình duyệt (mục "Bấm thử"), không chụp riêng vì cùng thành phần.

## Truy vết khung → thành phần → ảnh
| # | Khung | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|---|
| 1 | A1 đầu panel, danh sách em, Điểm, "Cả n tiêu chí", tiêu chí 4 mức, đặt sẵn viền đứt | `PanelVietBc` / `FormEm` (GIỮ, #1719) | a1 | KHỚP |
| 2 | A1 ô chữ trống khi mở, có chữ gợi ý "Viết cho phụ huynh: …" | `textarea` + `placeholder` (MỚI chữ gợi ý theo mockup) | a1 | KHỚP |
| 3 | A1 khối 280 px bên phải ô, nền lặng, viền 1 px | `.viet-ghi` / `.da-ghi` (`web/src/index.css`) | a1 | KHỚP |
| 4 | A1 mỗi dòng: nguồn một dòng 12 px (đậm + tuần · điểm / Tiến triển) + Chèn cùng dòng + câu ≤ 3 dòng chữ phụ | `KhoiDaGhi` (`web/src/ui/KhoiDaGhi.tsx`), `nguonChuDaGhi` | a1, a5 | KHỚP |
| 5 | A2 Chèn → câu vào CUỐI ô (không đè), "✓ Đã chèn" ở dòng nguồn, dưới ô "✓ Đã chèn câu … · Hoàn tác chèn" 10 giây | `useChen` + `chenCau` / `goCau`, `DuoiOChu` | bấm thử | KHỚP (trừ tô nhẹ — KHÁC 1) |
| 6 | A3 không có câu → không khối, ô rộng như cũ | `.viet-ghi.mot`, `KhoiDaGhi` trả null | bấm thử | KHỚP |
| 7 | A4 đang tải (không giữ chỗ) · lỗi + Thử lại, không chặn viết | `DuoiOChu` (`role="status"`) | bấm thử | KHỚP |
| 8 | A6 ô có chữ / em đã đủ → khối gập "… · n" + Xem, cao bằng ô | `KhoiDaGhi gapDau` | a6 | KHỚP |
| 9 | A6 lớp thường "Bạn đã ghi đợt này" | nhãn theo `data.ft` | (không có lớp thường của GV 7 có câu trong đợt) | KHỚP (mã) |
| 10 | A5 phần Chung: vi phạm + xử lý, Tình hình học tập, "· {tên} ghi" | máy chủ trả `chung` (vi phạm · xử lý · tình hình) + người ghi | a5 | KHỚP (KHÁC 4) |
| 11 | A1 · A5 chân: "Tự lưu khi rời ô" · "Tiếp: {em chưa đủ}" · Đóng · Lưu · em tiếp › | `chan.phu` thêm nút Đóng (lời 36) | a1, a5 | KHỚP |
| 12 | A1 · A5 dòng quy chế | `quyCheBaoCaoPh` (GIỮ) | a1, a5 | GIỮ (chữ theo luật GD-4b, không đổi ở PR này) |
| 13 | E1 375: khối dưới ô, Chèn / Xem 44 px, chân Đóng · Lưu | CSS `@media (max-width: 639px)` | e1 | KHỚP |
| 14 | E1 chọn em "Lý Minh Châu 3/8 · Em khác ▾" | ô chọn em có tìm + ‹ › (GD-5, có sẵn) | e1 | GIỮ — KHÁC 3 |
| BỎ | — | không bỏ thành phần nào | — | — |

KHỚP 13 / 14 dòng (dòng 14 là thành phần cũ giữ nguyên, chủ SP duyệt GD-5). Cổng ≥ 90 % đạt khi tính dòng GIỮ là khớp chức năng.

## KHÁC (có lý do)
1. **[XM-a] PTA chốt: đồng ý.** **Câu vừa chèn không tô nhẹ trong ô.** Ô là `textarea` gốc — không tô được một đoạn; đổi sang ô rich text là đổi thành phần ô của cả Báo cáo PH (ngoài phạm vi). Phản hồi thay: dòng "✓ Đã chèn câu … · Hoàn tác chèn" dưới ô + "✓ Đã chèn" ở khối. [XM-a] hỏi PTA Plan nếu cần tô.
2. **[XM-b] PTA: thêm nếu 0 câu — không lấy được nên giữ.** **Nguồn MT chỉ có band, không "/ kỳ vọng"** (mockup "R 5.5 / 6.0"): kỳ vọng không phải cột của ô điểm — tính từ lộ trình + bảng kỳ vọng theo lượt (`ketLuanKyVong`), phải đọc thêm. Kỳ vọng của lượt cần đọc thêm (lộ trình + bảng kỳ vọng) — đường này giữ 4 câu theo trần LG-13. Điểm + ✓ / ✗ kỳ vọng đã có ở dòng "Điểm" ngay trên. [XM-b].
3. **375 chọn em = ô chọn có tìm + ‹ ›** (GD-5, R5.2 #48 đã duyệt) thay nút "Em khác ▾" của mockup — giữ thao tác cũ.
4. **Nguồn vi phạm không ghi bậc ("REPORT 1"), tình hình không ghi "· đã gửi TVV".** Bậc nằm ở dòng xử lý riêng ("Report 1 · W1 AUG"); tình hình ghi người gửi — đủ để GV biết nguồn, không thêm câu đọc.
5. Chữ gợi ý trong ô không kết thúc "…" (web-design-guidelines khuyên) — giữ đúng chữ mockup đã duyệt.

## Sửa sau rà PTA (#1742)
- Dòng nguồn không cắt "…": xuống tối đa 2 dòng, nút Chèn / "✓ Đã chèn" giữ góc phải trên (`.da-ghi .muc` canh trên). Chụp lại a1 + e1.
- Dòng quy chế 375 còn "…": chờ #1738 (`DongQuyChe`) merge rồi gộp main — không sửa ở PR này.
- Ảnh a1 / e1 dùng phần L: dữ liệu demo cục bộ của GD-20b (việc đổi GV) chuyển R của MB FT 101 sang GV 9.

## Thao tác TRƯỚC → SAU (không mất thao tác)
| Thao tác | TRƯỚC (#1719) | SAU | Ghi chú |
|---|---|---|---|
| Viết ô Đề xuất cải thiện / Nhận xét chung | gõ vào ô trống | gõ; hoặc **Chèn** câu đã ghi rồi sửa; **Hoàn tác chèn** 10 giây | MỚI |
| Xem câu đã ghi khi ô có chữ | — | khối gập → **Xem** | MỚI |
| Tải lỗi khối | — | **Thử lại** dưới ô, ô vẫn gõ được | MỚI |
| Đặt mức tiêu chí, "Cả n tiêu chí" + Hoàn tác, Sửa điểm / Về điểm gốc | có | có | GIỮ |
| Tự lưu khi rời ô, Lưu · em tiếp ›, đi từng em (danh sách / ‹ › / ô tìm 375), Phần tiếp › | có | có | GIỮ |
| Đóng | ✕ / Esc / Quay lại | ✕ / Esc / Quay lại + nút **Đóng** ở chân (lời 36) | THÊM |
| Viết hộ (QL), Đặt nhanh, Xuất, đợt (thêm / bỏ) | có | có (ngoài panel, không đổi) | GIỮ |

## Lượt đọc Turso
- Mở panel: **+1 request** `GET /classes/:id/chu-da-ghi?dot=` — một lần cho lớp × đợt, đổi em / đổi phần không gọi lại. Đo `tocDo` (demo): **9 câu** (4 câu chữ + 3 câu tính khoảng đợt + 2 phiên), trần 11.
- Bản chép thật 15/11 (đường `?tu=&den=` cùng 4 câu chữ): 89 lớp, TB 123 dòng, tối đa 210 dòng / lớp.

## Bấm thử (Edge, dev demo, GV 7)
- Chèn (Listening, Lê Quang Huy): câu vào ô, "✓ Đã chèn", dòng Hoàn tác; `PUT /classes/3/bao-cao-ph` 200 (lưu như gõ); 10 giây sau dòng Hoàn tác tự mất.
- Chèn → Hoàn tác chèn (Nhận xét chung, Phạm Bảo Ngọc): ô về rỗng, nút Chèn hiện lại.
- Đo (sáng / tối · 1440 / 375): tương phản nguồn ≥ 4,97 : 1 (sáng) / 6,74 : 1 (tối), câu 6,95 / 8,97; nút 26 px (1440) / 44 px (375); chữ nhỏ nhất 12 px; không tràn ngang.
- impeccable `detect`: 0 lỗi (5 ghi chú cỡ chữ 17 px ở dòng cũ, không thuộc PR). `audit` + web-design-guidelines: sửa `role="status"` cho dòng dưới ô, nhãn đọc màn "Chèn câu {nguồn · tuần}" để không trùng giữa các dòng "Vi phạm".
