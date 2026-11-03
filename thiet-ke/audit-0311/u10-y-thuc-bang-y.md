# U10 · Ý thức + task Báo PH — bảng "ý trong file → chỗ trong mockup" (03/11, TRƯỚC khi vẽ, chờ PTA kiểm)

Nguồn: `00` = `D:/Download/Pisa tracking web/PISA-Tracking-Claude-Audit-Overhaul-2026-11-03.md` · `12` = `docs/superpowers/specs/2026-11-03-audit-overhaul/12-y-thuc-bao-ph.md` · N34 (plan.md 1.6).
Ảnh: Ảnh 1 = U10 `y thuc vi pham.jpg`. Kiểu badge / màu / nút: chép `thiet-ke/audit-0311/chung.css` + `thiet-ke/v11/` (đồng bộ U01–U09).
Mockup sẽ vẽ: `thiet-ke/audit-0311/u10-y-thuc.html` (khung K1–K8 dưới) · 1440 tối + 375 sáng · dữ liệu dày như Ảnh 1 (CP FT 116, 7 HV, 6 vi phạm Lê Thảo Nhi, mô tả EN dài).

## Khung
| Khung | Màn · vai | Trạng thái phải có |
|---|---|---|
| K1 | Hồ sơ lớp › tab Ý thức · GVCN · 1440 tối | Bắt buộc xử lý (có quá hạn) · Mới, chưa xem · Chờ QL duyệt · Đã xử lý 7 ngày · một hàng mở tại chỗ · một hàng vừa "Đã xem" |
| K2 | K1 ở 375 sáng | thẻ em; một nút chính; mở tại chỗ |
| K3 | Hồ sơ HV › tab Ý thức · GVBM | chỉ Ghi vi phạm + xem trạng thái, không nút quản lý |
| K4 | Hồ sơ lớp › tab Ý thức · QL | Chờ duyệt (Duyệt / Từ chối) · thu hồi chờ duyệt · Đã thu hồi |
| K5 | Công việc › Báo PH · TVV · 1440 + 375 | hạn mặc định · đã sửa hạn ("Đã chỉnh") · quá hạn · đang sửa hạn (ONgay) · sau lưu kết quả · lịch sử (liên hệ + đổi hạn) · 409 |
| K6 | Lịch sử (phân đoạn trong tab) | lọc Đã xem · Đã xử lý · Đã thu hồi; dòng vừa thao tác được đánh dấu |
| K7 | Học viên & Lớp › chip bậc | hộp nhỏ tại chỗ (không panel trượt): bậc, số vi phạm chờ, hạn, "Hồ sơ ›" |
| K8 | Phối hợp SOS · GVCN | Meeting CX có hạn + Sửa hạn; Trao đổi gia đình không hạn |

## Bảng ý → chỗ
| # | Ý (nguồn) | Chỗ trong mockup | Ghi chú |
|---|---|---|---|
| 1 | Phân cấp khó đọc, mô tả chưa rõ, bấm nhiều lớp (`00` 1.2) | K1: hàng em 4 ô tách trường (Vi phạm chờ · Cần làm + hạn · Bậc · Báo PH) + một cột "Việc cần làm"; chi tiết mở NGAY dưới hàng, một tầng | không panel lồng panel |
| 2 | "Ghi nhận" ≠ "Xử lý"; bấm Ghi nhận vi phạm biến mất (`00` 1.2, F03) | K1: nút "Đã xem" (N34) cạnh "Xác nhận xử lý", khác kiểu (phụ / chính); sau bấm hàng ở lại "✓ Đã xem 2 vi phạm · Hoàn tác · Xem lại" | không toast-only |
| 3 | Sửa hạn Báo PH, mặc định nếu không chọn, sửa lại được, không trần / duyệt (`00` 1.3, 5.2) | K5: dòng "Hạn 07/11 · mặc định" + nút "Sửa hạn" → ô ONgay tại dòng + "Về mặc định"; sau lưu "Hạn 10/11 · đã chỉnh" | không panel riêng cho ngày |
| 4 | Ghi nhận ≠ xử lý ≠ báo PH ≠ đóng Case (`00` 3.4) | K1: bốn chữ trạng thái khác nhau, không "Xong" chung; Báo PH ô riêng | |
| 5 | Ghi nhận không đẩy bậc; bắt buộc không có Ghi nhận; không Hoàn tác xử lý (`00` 3.5) | K1: hàng bắt buộc không có "Đã xem" + một câu ngắn tại hàng "≥ 3 vi phạm / 2 tuần — phải xử lý"; lần xử lý đã lưu chỉ có "Thu hồi…" | |
| 6 | Báo PH sinh khi lưu xử lý, kể cả chờ duyệt (`00` 3.6) | K4: hàng Chờ QL duyệt vẫn có ô Báo PH "Chờ báo · hạn …" | |
| 7 | Bốn tầng Vi phạm · Xử lý · Báo PH · Lịch sử, không dùng chung một badge (`00` 6.1) | K1 chi tiết dưới hàng: 3 khối có nhãn (Vi phạm của lần này · Lần xử lý · Báo PH) + K6 Lịch sử | |
| 8 | Một lần xử lý nhiều vi phạm: thấy quan hệ, không lặp mô tả (`00` 6.1) | K1: khối "Lần xử lý WL 1 · 19/10" liệt kê tên vi phạm (không mô tả) | |
| 9 | Đầu vùng: em / bậc + một hành động chính; thang không chiếm chỗ (`00` 6.2.1, U10.2) | K1: ô Bậc "Đã tới WL 1 · lần này Report 4 + Meeting"; thang đủ trong "Thang ›" mở tại chỗ | bỏ chuỗi chip mỗi hàng |
| 10 | Khối cần làm, mô tả đủ nhận diện, động từ rõ; nhiều dòng giống nhau thì nhóm (`00` 6.2.2) | K1: vi phạm chờ "25/10 Homework W4"; trùng tên gộp "Homework W4, W5 · 25/10, 01/11" | |
| 11 | Mở một dòng: nguồn → lần xử lý → task Báo PH (`00` 6.2.3) | K1 hàng mở: thứ tự 3 khối như #7 | |
| 12 | Sau thao tác có kết quả tại chỗ + lối xem lại (`00` 6.2.4) | #2 + K5 sau lưu "✓ Đã lưu 14:20 · Việc xong · Sửa" | |
| 13 | Lịch sử có Đã ghi nhận / Đã xử lý / Đã thu hồi + lọc (`00` 6.2.5, F03) | K6: phân đoạn "Lịch sử (26)" mở được ngay đầu tab, lọc 3 chip có số | thay "Nhật ký … (26)" gập cuối |
| 14 | Chữ: Ghi vi phạm · Đã xem · Xác nhận xử lý · Đề xuất xử lý (`00` 6.2, 21) | mọi khung; "Đề xuất QL duyệt" giữ tên web | |
| 15 | Theo vai GVBM / GVCN / TVV / QL (`00` 6.3) | K3 GVBM · K1 GVCN · K5 TVV · K4 QL | |
| 16 | Đường sửa sai: Bỏ xem · Sửa / Xoá vi phạm · Thu hồi · Chưa liên hệ được giữ việc mở · sửa kết quả (`00` 6.4) | K1 (Hoàn tác, Sửa / Xoá trong vi phạm mở) · K6 (Bỏ xem ở dòng Đã xem) · K4 (thu hồi) · K5 (Chưa liên hệ được, Sửa) | |
| 17 | Phân cấp 3 tầng trang → khối → trường; không toàn chữ nhỏ xám (`00` 12) | mọi khung: nhãn trường riêng dòng / cột, giá trị đậm hơn nhãn | lỗi U01–U03 bị trả: "chữ liền mạch" |
| 18 | Một hành động chính mỗi vùng; Lưu / Đã xem / Xác nhận xử lý khác kiểu (`00` 12, 21) | K1: cột Việc một nút chính; phụ ở ⋯ hoặc nút viền | |
| 19 | Không giấu dữ kiện trong hover (`00` 12) | ⓘ chỉ cho giải thích luật; hạn, người, lần xử lý hiện chữ | |
| 20 | Mô tả dài đọc đủ một thao tác (`00` 12, 21) | K1 vi phạm mở: mô tả EN dài 3 dòng + "Xem đầy đủ" tại chỗ | |
| 21 | Rỗng ≠ lỗi ≠ không quyền (`00` 8, 21) | K1 ô Báo PH "—" chỉ khi chưa có lần xử lý; K5 409 "Hạn vừa được người khác sửa" | |
| 22 | U10.1 nút không đặt dưới cột Báo PH (U10-NUT-COT) | K1: cột "Việc cần làm" riêng, cột Báo PH chỉ trạng thái + hạn | |
| 23 | U10.3 tóm tắt em: số chờ, mô tả, hạn xử lý, người phụ trách, hành động; Mới vs Cần xử lý nói rõ khác (U10-HAI-HAN) | K1: tiêu đề nhóm có một câu ngắn ("chưa cần biện pháp — xem trước 05/11" / "phải xử lý trước 05/11") + ô "Cần làm" ghi loại hạn | màu nền khác + chữ |
| 24 | U10.4 chi tiết chỉ vi phạm của lần đang làm; lịch sử tách (`00` U10.4) | K1 mở: chỉ vi phạm chờ; vi phạm đã xử lý / đã xem → "Lịch sử của em (3) ›" lọc K6 | |
| 25 | U10.5 sau ghi nhận phản hồi tại chỗ + "Xem đã ghi nhận" | #2 "Xem lại" → K6 lọc Đã xem, dòng vừa làm sáng | |
| 26 | U10.6 bắt buộc: giải thích ngắn tại tác vụ | #5 | |
| 27 | U10.7 "Đã báo PH" gắn lần xử lý; hạn Báo PH riêng (U10-BAOPH-CU) | K1 ô Báo PH: "WL 1 · đã báo 29/10"; vi phạm mới chưa có lần xử lý → không nhập chung | |
| 28 | U10.8 bằng chứng trống gọn; có tệp hiện số + lối xem (U10-BANG-CHUNG) | K1 vi phạm mở: "+ Tệp / liên kết" một dòng; có tệp "2 tệp ›" | bỏ câu hướng dẫn dài |
| 29 | U10.9 Phối hợp SOS tách nhóm với kỷ luật; bảng điểm MT xem lại (22.1) | **CHỜ CHỦ SP** (đã hỏi 03/11): đề xuất phân đoạn "Vi phạm \| Phối hợp SOS" trong tab; bảng Điểm Mock Test chuyển sang tab Học viên, tab Ý thức giữ link | không tự bỏ |
| 30 | X08 phạm vi "Cả lịch sử" chỉ áp vi phạm (`12`) | K6: nút phạm vi đặt TRONG phân đoạn Vi phạm; Phối hợp SOS ghi "mọi lượt" | |
| 31 | N34 17.1 ai sửa hạn Báo PH; 17.2 loại việc; PTA: ghi rõ ai thấy Sửa hạn | K5 + K8 + bảng "Ai thấy Sửa hạn" trong mockup (TVV / TVV cùng CN / GVCN / QL: Báo PH có; GVCN / QL: Meeting CX có; TVV Meeting CX không; GVBM không) | |
| 32 | 17.3 đúng hạn theo hạn hiệu lực; lịch sử giữ hạn gốc (`00` 5.2) | K5 lịch sử: "07/11 → 10/11 · Phan Mai · 04/11 09:12" | |
| 33 | Hạn ngày đã qua hiện quá hạn, không sửa ngầm (`00` 5.2) | K5 trạng thái quá hạn: "Hạn 02/11 · quá hạn 2 ngày" | |
| 34 | Việc xong / bỏ / thu hồi: sửa hạn không mở lại (`00` 5.2) | K5 việc xong: không có "Sửa hạn" | |
| 35 | Lối vào: tab Ý thức hồ sơ lớp / HV; chip bậc nơi khác → panel hoặc trang đều được (chủ SP 03/11) + "không panel trượt ở HV & Lớp" (chủ SP 03/11, qua PTA) | K7: chip bậc → hộp nhỏ tại chỗ + "Hồ sơ ›" | |
| 36 | "Thừa thì đừng thêm text" (chủ SP 03/11) | không đoạn hướng dẫn dưới khối; câu luật một dòng, chi tiết trong ⓘ | |
| 37 | Thời gian = mã tuần; ngày cho hạn / ngày vi phạm (CLAUDE.md) | ngày dd/mm cho hạn + vi phạm; lớp ghi "W1 NOV" | |
| 38 | Bảng thao tác trước → sau (CLAUDE.md, `00` 14) | cuối mockup: Ghi vi phạm · Khai / sửa cấp bậc · Chọn nhiều (lô Xác nhận xử lý / Đã xem / cấp bậc) · Xác nhận xử lý · Đề xuất QL duyệt · Đã xem · Bỏ xem · Sửa / Xoá vi phạm · Đính kèm · Thu hồi · Xem lần xử lý · Báo PH tại chỗ · Ghi kết quả · Bỏ việc / Khôi phục · Sửa hạn (mới) · Phối hợp SOS · Cả lịch sử | không bỏ thao tác nào |

## Không vẽ (lý do)
EN (cùng chức năng) · đang tải / lỗi tải (như mọi panel) · lớp thường "Phối hợp" (như FT, đổi chữ) · Khai bậc (giữ panel hiện có).
