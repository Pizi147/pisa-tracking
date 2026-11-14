# Overhaul V6 — kết quả rà đồng bộ 15/11 (nguồn cho đề bài mockup đợt 2)

PTA Overhaul · 15/11 · theo lời 34. Ba agent chỉ đọc (mockup v21 · mã web các màn chưa có mockup · khu Phân tích). Dòng ghi "chưa chắc" = agent chưa kiểm tận nơi; session mockup kiểm lại trước khi dùng. Đường dẫn mã tính từ `web/src/modules/`.

## A. Năm mockup v21 — đã chốt mà chưa theo

| Tệp : dòng | Đang | Phải | Nguồn |
|---|---|---|---|
| bang-mau.html:451 (câu Q9) | MT0 "-" chỉ ghi dấu, hết tuần Không dự thi | áp luật vắng như Mock | lời 32 |
| bang-mau.html:514 (câu Q72) | thẻ thu hồi "Không tự chốt" | hết hạn duyệt tự chốt theo GVCN | lời 33 |
| bang-mau.html:717 (G2), :773 (H1) · trang-dau-gv.html:66, 163, 245, 380, 472, 531, 610, 692, 728 | badge tab Chấm Speaking đỏ / vàng | mờ (số bài) + ⚠ khi có bài quá hạn | lời 33 |
| trang-dau-gv.html:472 (K6), :692 (K8), chip :464, 492, 493 | tab riêng "Báo cáo PH", chip "Báo cáo PH ›" | nhóm trong tab Vận hành; chip thuộc "Vận hành" | lời 20 |
| trang-dau-gv.html K1 | chip `.vc` có biểu tượng | không biểu tượng | lời 20 |
| trang-dau-gv.html K1 (MB FT 108) | chip "Chấm Speaking · 6 bài" ở "Lớp của tôi" | không có | lời 20 |
| trang-dau-gv.html:93, 249 | "Việc chung của nhóm GV Speaking" | "Chấm Speaking" | lời 24 |
| trang-dau-gv.html K1 (11 chỗ `dt-khoi` + `ds-viec`) | vòng chữ đầu + tên em + cây việc | "Lớp · tên việc ngắn", tên em là thẻ phụ | lời 24 |
| trang-dau-gv.html:266, 666 | "GV chấm" là ô chọn thường | ô chọn có tìm (mẫu A) | lời 17 |
| trang-dau-gv.html:392, 409 · trang-dau-tvv.html:320 · ho-so-lop.html:47 | bước chọn em dáng `.goi-y` cũ | mẫu A `.oc-vung` (⑤ F2, F3) | lời 17 |
| bang-mau.html D1a / D1b (:351–390) | panel Xác nhận xử lý không có thang WL | thang nổi WL 1 / WL 2 (chưa chắc) | lời 28 |

PTA quyết: hồ sơ HV giữ dòng việc không tiền tố "Lớp ·" (mockup ③ được duyệt ở lời 28, sau lời 24; trong hồ sơ một em thì lớp đã ở đầu trang).

## B. Năm mockup v21 — cùng chức năng, khác dáng (theo mẫu ⑤ trừ khi ghi khác)

- **Chân panel:** ④ có "Lưu" + "Lưu · việc tiếp ›"; ② "Việc tiếp ›" cạnh nút chính khi chưa lưu; ① ⑤ "Đóng" + nút chính → ~~theo ⑤ D2~~ **lời 36: "Đóng" · "Lưu" · "Lưu · việc tiếp ›" khi còn việc kế** (giữ nút gộp của web).
- **Câu quy chế** vẽ trong ③ (ho-so-hv:236, 250, 264, 281, 297, 310, 387), ④ (tvv:184, 196, 217, 246, 284), ② (:56) khác bảng câu ⑤ → theo bảng ⑤.
- **Dải chỉ số:** ⑤ cao 44, số bấm được · ② cao 38, không bấm · ④ cao 58 có dòng phụ; nhãn "Chờ KQ" ↔ "Chờ KQ thi thật" → một dáng ⑤ H3.
- **Badge tab:** ② tab Ý thức chỉ có chấm; tab Báo cáo PH mang chip → viên tròn đỏ / vàng / mờ ⑤ H1.
- **Menu "+ Task":** ② không biểu tượng, còn lại có → ⑤ F1.
- **Hộp chọn em:** "Huỷ · Tiếp ›" ↔ "Đóng · Tiếp" ↔ "Đóng · Gửi TVV" → một chân.
- **Câu lỗi tải / hết việc:** ba mẫu câu → mẫu ① ("⚠ Không tải được … · Thử lại"; "Còn: Case học thuật · 3 việc" + "Việc tiếp ›").
- **Lịch sử:** "⌄Lịch sử (1)" ↔ "▸ Lịch sử" ↔ "Lịch sử · 4" → ⑤ H4.
- **"Không hạn":** ④ ghi chữ trong chip hạn → cột hạn trống + vạch nhóm (⑤ B1).
- **Tên bậc vi phạm:** "REPORT 1 / WARNING LETTER 1" (⑤) ↔ "Report 1 / WL 1" (③ ④) → PTA quyết: "Report 1", "WL 1" (chủ SP gọi "WL1, WL2" ở lời 28).
- **Số đếm việc:** "14 việc · ⚠ 9 quá hạn" ↔ "2 · ⚠ 1 quá hạn" ↔ "Việc cần làm · 5" → dạng ①.
- **Chip hạn:** ① "còn 1 ngày · 23/09" ↔ ⑤ "hạn hôm nay" cùng lớp màu → theo ⑤.
- Lặt vặt: ⋯ hồ sơ HV "Tạm dừng/ Kết thúc học" → "Tạm dừng / Kết thúc học" chữ đỏ (⑤ H2) · nút "+ Ghi vi phạm" tab Ý thức ↔ "Vi phạm / Nhắc nhở" · đầu panel chỉ số "Báo cáo · chỉ đọc" ↔ "Chỉ số" · bề rộng panel 720 ↔ 736 · tiêu đề khung B của ⑤ ghi hồ sơ lớp dùng dòng việc (② đã duyệt chip → sửa chữ ⑤) · ⑤ [XM-15] đã cũ · bảng kê ⑤ mục 3: bỏ `soMo` ở `XepTheoHocVien`, bỏ `LamDongSoLieu`.

## C. Các màn chưa có mockup v21 (mã web hiện tại)

### C1. Học viên & Lớp (`students/StudentsPage.tsx`, `DanhSachHvLop.tsx`, `GocLichThi.tsx`, `HangLichThi.tsx`, `GocPhanCongGv.tsx`, `phanCongGv/*`)
- Chưa đồng bộ: tab `HangTab v8 soMo` (:447) · `<select>` "Mọi lớp" (:388), "Xem" (:366), "Mọi TVV" (`GocLichThi.tsx:239`), "Xếp" (`TongHopPc.tsx:57`), tuần (`classes/HopLuuPhanCong.tsx:86`) · nút dáng chữ link ("Mở tất cả", "Bỏ lọc", Hoàn tác, Thử lại) · lịch sử Lịch thi tự viết (`HangLichThi.tsx:326`) · cột "Việc của tôi" ↔ "Việc tiếp" (`DanhSachHvLop.tsx:437`) · rỗng là câu dài (`GocLichThi.tsx:265`).
- Nâng cấp: tab chuẩn có badge (Lịch thi mang số việc của tôi) · lọc lớp / TVV là ô chọn có tìm, "Lớp của tôi" / "Tôi" trước, có ở cả tab Tất cả · Lịch thi: menu "Đặt lịch ▾" (`HangLichThi.tsx:156`) → chữ trạng thái + nút-chip việc tới lúc làm (vẫn ≤ 1 nút chính / hàng) · Phân công GV: Quản trị mặc định chi nhánh gần nhất.
- Giữ: Xuất Excel · + Thêm học viên · + Lớp mới · Lưu trữ · Bộ lọc thêm · Mở / Thu gọn tất cả · ⋯ lớp · tìm mọi chi nhánh · Lịch thi: Chốt / Sửa ngày, Đặt / Dời tháng, Ghi KQ, Bước tiếp, Sửa KQ, + Ghi chú, Hoàn tác · Phân công: Lưu, Huỷ sửa, Lưu cả n lớp, Thiếu GV, Bỏ trống, Bỏ tô, hiệu lực Ngay / Từ tuần, hỏi bàn giao.

### C2. Test (`test/TestPage.tsx`, `LichTestTab.tsx`, `lichTest/*`, `KeHoachTestTab.tsx`, `keHoach/*`, `fasttrack/MockDetailPage.tsx`, `LuotThuongPage.tsx`)
- Chưa đồng bộ: `DaiSo` cao 52, số 0 vẫn bấm · `CongTacKhung v8` · `ui/Menu` cũ ("Chỉnh lịch" `MockDetailPage.tsx:389`, "+ MT" `LuoiKeHoach.tsx:383`) · ⋯ một mục (`XepTheoHocVien.tsx:536`) · lịch sử 4 kiểu, hai tên "Nhật ký" / "Lịch sử" · chữ "Xoá" (mã, 06/11) ↔ "Bỏ khỏi đợt" (Hướng dẫn `shared/huongDan/ql.ts:213`, `:408`) · "Xóa" lẫn "Xoá" · "Đang lọc: lớp X ✕" ↔ "Lớp: X ✕" · "Cần xếp lại" ↔ "Chưa đủ MT" · tab ngăn xếp lịch `BoLocDoan` ↔ `HangTab` · "Lớp lúc Test" không là link (`MockDetailPage.tsx:383`) · chú thích tĩnh (`HopNhapDiem.tsx:528`, `MockDetailPage.tsx:980`) · ô chọn tự viết (`TimKeHoach`, `TimLop`).
- Nâng cấp: Lịch Test tuần — đợt, môn của tôi, hạn, bài chờ duyệt dời đang chỉ ở `title` (`HangLop.tsx:42-50`, `KhoiNo.tsx:254`) → dòng phụ / chip hạn trên hàng lớp · hộp `HopKyNang`: mỗi môn 3 nút + ⋯, chân thêm "Nhật ký", "Mở hồ sơ MT ›" → một chân chung, lịch sử vào ⋯ · Kế hoạch: lý do nút tắt đặt tại nút; nút xếp giữ một nhãn theo khung · "Nhập điểm lớp ›" trỏ thẳng Lịch Test đúng tuần + lớp.
- Giữ: Nhập điểm · Xem · Thu · Mở tất cả lớp · Lịch thi thật › · Lớp tiếp › · Xuất Excel… · Xếp nhiều MT… · Xếp lịch Test… · Chưa đủ MT · + MT · + S Ex · Xếp cả lớp theo đề xuất · Dời · Vắng · Xoá / Khôi phục · "Đã xoá · Khôi phục" · Vẫn xếp vào tuần này · GV chỉ xem · Chỉnh lịch (Dời lịch cả đợt, Dời hạn chấm, Khôi phục kết quả, Xoá MTn) · Lưu · bài tiếp › · Bỏ vắng · Khôi phục điểm · Lịch sử chi tiết.

### C3. Tổng quan QL / Admin / CX (`worklist/OverviewPage.tsx`, `TongQuanV5.tsx`, `MockTestAdmin.tsx`)
- Chưa đồng bộ: số đổi trang hai dáng (`SoDen` :95 ↔ class `link`) · một số ba tên "Case có PA" / "Case chưa PA" (:371) / "Case đang mở" · "Việc của tôi ›" còn "›" khi 0 (:469). Ô số thẻ lớn giữ (⑤ [XM-11]).
- Nâng cấp: QL / QT nhiều chi nhánh và CX thêm ô "Việc của tôi", "Chờ duyệt" (cùng nguồn badge) · bảng chi nhánh của CX bấm được dòng · một tên cho số Case.
- Giữ: cả ô số bấm được · Hộp duyệt › · Mở › · Xem toàn bộ lịch › · các link · công tắc FT / Thường · chọn chi nhánh.

### C4. Hồ sơ GV (`giaoVien/HoSoGiaoVienPage.tsx`)
- Chưa đồng bộ: dải số kiểu thứ ba (:250) · "Việc đang tồn" không dùng `OSo` (:543) · hai kiểu ⓘ · `CongTac` cũ (:388) · link chữ nhỏ · sửa kỹ năng không Hoàn tác (:170) · ô "Đúng hạn" ↔ panel "Điểm đúng hạn".
- Nâng cấp: "GVCN n lớp" → mã lớp là link · ô "Đúng hạn" tách Đúng hạn · Làm muộn · Chưa làm, cùng số Phân tích GV · 9 khối gom thành tab Lớp · Học thuật · Việc & Case (đề xuất) · nhận hai bảng + 3 ô số từ Tổng quan GV (GD-1).
- Giữ: Sửa / Lưu kỹ năng (QL / QT) · Việc của {tên} › · Hiệu quả PA › · Yêu cầu của tôi › · Chờ duyệt › · mọi số mở panel · Em đang bổ trợ.

### C5. Lưu trữ + Đã xoá (`students/LuuTruPage.tsx`, `platform/DaXoaAdmin.tsx`)
- Chưa đồng bộ: lớp là bảng, học viên là thẻ · `BranchFilter` ↔ ô "Xem" · chú thích tĩnh "Giữ 30 ngày…" · "Đã xoá" ở ba nơi.
- Nâng cấp: học viên dùng bảng như lớp · lối vào "Lưu trữ ›" thấy được ở đầu Học viên & Lớp (nay trong ⋯ :427) · "Đã xoá" thành tab thứ ba có số, câu 30 ngày vào ⓘ.
- Giữ: Tổng kết · Mở lại · Quay lại học (một / n em) · Xử lý tiếp · Sửa thông tin · Chọn nhiều · Khôi phục · Hoàn tác.

### C6. Quản trị (`platform/AdminPage.tsx` và các tệp con) — không thêm tab, không khung mới (12/11)
- Chưa đồng bộ: `<select>` ở `NhatKyChung.tsx:59`, `AccountsAdmin.tsx:481`, `SuaVaiChiNhanh.tsx:47`, `QuyenTheoVai.tsx:148`, `CatalogAdmin.tsx:326`, `HanMacDinhAdmin.tsx:160` · nhật ký hai kiểu · "Mở sửa lịch Test" là nút Bật / Tắt, chỗ khác là công tắc · Chương trình sửa bằng panel, Chi nhánh sửa tại dòng · câu chỉ-xem hai kiểu.
- Nâng cấp: lọc "Người" là ô chọn có tìm · nhật ký một dáng `LichSuThayDoi`, QL có "Xem tất cả ›" · công tắc thống nhất.
- Giữ: + Tạo tài khoản · Duyệt · Duyệt lại · Sửa thông tin · Xoá / Khôi phục tài khoản · + Chương trình · Sửa · So sánh · Huỷ thay đổi · Lưu n thay đổi · Ẩn / Hiện lại / Xoá / Khôi phục · Hoàn tác.

## D. Phân tích (`phanTich/*`) — kết luận: V2 ổn, khớp mockup đã duyệt; không làm lại cả khu, chỉnh vài chỗ

1. Ô "Chưa làm" ở tab Giáo viên bấm được → panel mọi bài / việc quá hạn, nhóm theo GV, có lý do (dùng lại `/phan-tich/giao-vien/danh-sach`; chỉ đọc khi bấm). Chỉ đổi cách bày.
2. Giải thích đang nằm trong `title` (rê chuột — `ui/ui.tsx:445`, `YThucPhoiHop.tsx:149–151`, `HieuQuaPa.tsx:218`) → ⓘ đầu thẻ; 375 đọc được.
3. Ô "Mọi lớp" → ô chọn có tìm; ô Tìm GV cùng dáng.
4. Hàng lọc giữ chỗ cố định giữa các tab (ô không áp dụng thì tắt, không biến mất); ô Thi thật ở tab Chi nhánh ghi rõ kỳ.
5. **Số liệu mới (cần chủ SP duyệt):** tab Thi thật thêm ô "Sắp thi · 6 tuần · còn SOS" → panel em: lớp, ngày thi, mức SOS. Ước + 2–3 câu, theo chi nhánh.
6. Ghi đơn vị ngay trên nhãn: "Đạt MT · HV" ↔ "Đạt kỳ vọng Test · lượt".
Không đề xuất lại: tuần dạy trong bảng Theo GV, xu hướng (đang hoãn), KPI tháng GV (đang hoãn). Lặt vặt: Excel Ý thức chưa theo khung `xuatV2.ts`; khối PA còn dòng "Chưa tính" (README V2-6 ghi vào ⓘ — chưa chắc bên nào thắng).
