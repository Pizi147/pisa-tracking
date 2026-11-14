# v21 · ⑦ Test (Lịch Test tuần · Kế hoạch Test · trang lượt) — ghi chú cho người duyệt

Mockup: `thiet-ke/v21/test.html` (+ `test.css` phần thêm; `v21.css`, `bang-mau.css` chỉ đọc). Đề bài: `docs/superpowers/specs/2026-11-13-overhaul-v6/11-de-bai-mockup-dot-2.md` mục ⑦ (R7.1–R7.7) + G1–G5; chỗ lệch + danh sách GIỮ: `10-ra-dong-bo.md` C2.

**Ảnh cặp cho chủ SP (mở cái này trước):** `thiet-ke/v21/anh/test/doi-{a1…a6, b1…b5, b7, c1…c3}.png` — mỗi tệp: câu "Đổi: …" ở trên, trái = **TRƯỚC (web hiện tại)**, phải = **SAU (mockup)**. Ảnh khung SAU riêng: `anh/test/{id}-toi.png` + `{id}-sang.png` (1440), `{a6,b7,c3}-sang.png` (375).

Đã xem màn thật trước khi vẽ: seed 14/09/2026, dev cổng riêng 4171 / 5471, GV Trần Ngọc Hà (id 7), QL Nguyễn Khánh Vy (id 2); ảnh TRƯỚC chụp bằng Playwright (Edge), phông Be Vietnam Pro + Inter đã nạp (`document.fonts.check` = true) ở cả ảnh TRƯỚC lẫn SAU. Tên người trong mockup là tên bịa (GV Đinh Thu Hằng, QL Nguyễn Thanh Mai).

## 0. Lời chủ SP trong session này

_(chưa có — chủ SP nói gì sẽ ghi nguyên văn ở đây rồi chuyển PTA Overhaul)_

## 1. Bảng truy vết khung → thành phần → TRƯỚC → SAU

| Khung | Thành phần | Trước (web) | Sau (v21) | Loại |
|---|---|---|---|---|
| A1 | Đầu trang "Test" + Xuất Excel… + tab Lịch Test tuần · Kế hoạch Test | có | thanh tab chuẩn ⑤ H1 | GIỮ |
| A1 | Hàng lọc: ‹ tuần › · Tuần này · Tất cả / Fast Track n / Lớp thường n · Lịch thi thật › | có (`CongTacKhung v8`) | đoạn chuẩn `.doan` (⑤) | GIỮ, đổi dáng |
| A1 | Dải số "Của bạn: 14/38 bài đã chấm · 12 bài quá hạn" | thẻ cao 52, số to, số 0 vẫn bấm (`DaiSo.tsx`) | dải mỏng chuẩn 44 (⑤ H3): "Của bạn · Đã chấm 14 / 38 · Quá hạn ⚠ 12"; 0 không bấm; cùng đích bấm | ĐỔI (R7.1) |
| A1 | Nhóm "Quá hạn chấm" · "Test tuần này" | có | giữ; hàng Quá hạn cùng 8 cột với hàng lớp (đợt · môn · hạn · còn chờ · số bài · Nhập điểm) | GIỮ + ĐỔI cột |
| A1 | **Hàng lớp** | mã lớp · x/y bài · một viên; đợt, môn của bạn, hạn, bài chờ duyệt dời chỉ ở `title` (`HangLop.tsx:42-50`) | ghi THẲNG: Lớp (link) · Đợt (+ số em) · Môn của bạn (chip) · chip hạn chuẩn · thẻ "n bài chờ duyệt dời" · tiến độ · trạng thái; một hàng tiêu đề cột mảnh | ĐỔI (R7.1) |
| A1 | Lớp đã chấm xong | viên "Đã chấm" + hạn ẩn | ô hạn trống + "✓ Đã chấm" (việc xong không còn báo hạn) | GIỮ ý |
| A1 / A2 | Lưới nhập điểm (Học viên · L R W1 W2 W S · Kỳ vọng · Overall · Kết quả), ô gạch đứt, ✗ / ✓ + số câu | có (`LuoiNhung`) | y nguyên | GIỮ (R7.2) |
| A2 | Hộp nhập một ô: Lưu · bài tiếp › · Vắng · ⋯ · Tiếp: … | có ("Bỏ vắng" là chữ trong thân hộp) | hộp ⑤ E5: dòng vắng thành ô bối cảnh, "Bỏ vắng" vào ⋯ cạnh "Lưu · đóng" | GIỮ luồng, đổi dáng nhỏ |
| A3 | QL "Cả chi nhánh" · "Mở tất cả lớp" | chữ link | nút nhỏ chuẩn | ĐỔI (G2 "nút là nút") |
| A3 | Hàng lớp QL | như GV | cột "Môn" (cả môn của lượt) + cột "Còn chờ: GV (môn)" | ĐỔI (R7.1) |
| A3 | "GV chấm S" trên lưới | ô thả "chưa chọn ▾" | ô chọn có tìm mẫu A (GV Speaking chi nhánh trước) | ĐỔI (G2, lời 17) |
| A4 | Lối vào "Nhập điểm lớp ›" | `/nhap-diem/{lớp}?periodId=` (đường cũ, chuyển hướng) | thẳng `/test/lich?periodId=…&classId=…&kn=…`: đúng tuần của lượt, đúng lớp, con trỏ ô trống đầu | ĐỔI (R7.6) |
| A4 | Dòng đang lọc | "Đang lọc: lớp MB FT 101 ✕" | chip **"Lớp: MB FT 104 ✕"** — cùng dáng ở Kế hoạch Test (B5) | ĐỔI chữ (R7.5) |
| A5 | Rỗng · đang tải · lỗi | rỗng câu dài; tải = xương; lỗi = `ErrorState` toàn trang | rỗng một dòng; xương giữ; lỗi câu chuẩn "⚠ Không tải được … · Thử lại" trong thẻ | ĐỔI dáng |
| A6 | 375 | mã lớp + x/y bài + một viên; mở ra lưới thẻ từng em | mỗi lớp một thẻ: mã · tiến độ / đợt · môn / hạn · chờ duyệt dời · trạng thái; Quá hạn có nút "Nhập điểm" 44 | ĐỔI (R7.7) |
| A6 | Nút "Lọc" 375 (chi nhánh, phạm vi) | có | GIỮ (không vẽ — GV một chi nhánh không thấy) | GIỮ |
| A6 | 375: thanh trên (tìm · ? · chuông · tên) · Tuần này · Xuất Excel… · Lịch thi thật › · badge Công việc ở thanh dưới | có | thanh trên như ① / ④; "Tuần này" cạnh ô tuần; Xuất Excel… + Lịch thi thật › trong một nút "⋯" 44 px (khung phải của A6 vẽ ⋯ mở); badge "9" ở Công việc | GIỮ, gọn |
| B1 | Đầu trang: Xuất Excel… · Xếp nhiều MT… | có | giữ, nút chính | GIỮ |
| B1 | Hàng lọc: Fast Track n / Lớp thường n · chip "Chưa đủ MT n" · ô tìm · ⓘ · n HV · Mở tất cả lớp | ô tìm tự viết (`TimKeHoach`) "Tìm lớp, học viên hoặc email"; "Mở tất cả lớp" chữ link | ô chọn có tìm mẫu A, GIỮ tìm theo email (chữ gợi ý "Tìm lớp, học viên hoặc email"); "Chưa đủ MT" nút-chip lọc chuẩn; "Mở tất cả lớp" nút | ĐỔI (R7.5) |
| B1 | Hàng lớp: mã (link) · n HV · GVCN · tình trạng · "Chưa đủ MT · n em" | có | "Chưa đủ MT · n em" = ô số chuẩn (bấm = lọc) | GIỮ |
| B1 | Lưới HV × MT1…MTn + Thêm; ô = tuần · chip L R W S · trạng thái | có | giữ dáng | GIỮ (R7.3) |
| B1 | Ô mờ "Đã xoá · Khôi phục" | có | giữ; "Khôi phục" là nút | GIỮ |
| B1 | S Ex ô dẹt dưới MT1 ("+ S Ex 1" / có kết quả) | có | giữ | GIỮ |
| B1 | Ô bị chặn (MT trước chưa xếp) | "—" + lý do trong `title` (`LuoiKeHoach.tsx:269`) | CHỈ cột kế tiếp: nút mờ "Xếp MT2" + lý do ngay dưới "Xếp MT1 trước"; các cột sau nữa "—" | ĐỔI (R7.3, XM-5) |
| B1 | "+ MT ▾" | `ui/Menu` cũ (`LuoiKeHoach.tsx:383`) | menu chuẩn `.menu-tha` | ĐỔI dáng |
| B1 | "+ Ghi chú lớp" · "+ n HV · Hiện tất cả n" | chữ link | nút nhỏ | ĐỔI (G2) |
| B2 | Hộp xếp một kỹ năng: đầu (tên lượt link · lớp · Xoá MTn · ✕) · Cả lượt · Tuần chung · Từng môn (Dời · Vắng · Xoá · ⋯) · Ghi chú lịch Test | có | giữ | GIỮ (R7.3) |
| B2 | Chân hộp | "Nhật ký" + "Mở hồ sơ MT ›" trên chân + Đóng / Huỷ thay đổi + Lưu | MỘT chân: Đóng (Huỷ thay đổi khi đã sửa) · Lưu | ĐỔI (R7.3) |
| B2 | "Mở hồ sơ MT ›" | link riêng trên chân | BỎ link riêng — tên lượt ở đầu hộp đã là link hồ sơ MT (`duongDotTest`), nay có "›" | GỘP |
| B2 | Nhật ký (cả lượt + ⋯ từng môn) · Lịch sử ghi chú | ba kiểu, hai tên | MỘT khối "Lịch sử · n" (⑤ H4), dòng ghi tên môn | ĐỔI (G2) — [XM-3] |
| B2 | ⋯ từng môn | Dời hạn chấm · Huỷ điểm · Nhật ký | Dời hạn chấm · Huỷ điểm (mục nguy hiểm đỏ) | ĐỔI |
| B2 | Nút "Vắng" mờ (môn đã có điểm) | lý do trong `title` (rê chuột) | lý do đặt tại nút: bong nhỏ "Đã có điểm — Huỷ điểm trước" hiện khi chạm / focus nút mờ (nổi trên nút, không làm hàng cao thêm, đọc được ở 375) | ĐỔI (R7.3) |
| B2 | ⓘ "W = chấm cả W1 và W2" | ⓘ rê chuột (`title`) | ⓘ bấm được | ĐỔI (G2) |
| B2 | Chữ "Xóa lịch" / "Xóa" | "Xóa" | "Xoá" | ĐỔI chữ (R7.5) |
| B3 | Ngăn xếp lịch: tiêu đề | "Xếp lịch Mock Test" (nút ghi "Xếp nhiều MT…") | "Xếp nhiều MT" = tên nút | ĐỔI chữ |
| B3 | Fast Track / Lớp thường · Xếp theo tuần / theo học viên | hai cụm nút giống hệt (`BoLocDoan`) | thanh tab chuẩn + đoạn chuẩn | ĐỔI (R7.5) |
| B3 | Lớp · Tìm học viên | ô gõ tự viết (`TimLop`) | ô chọn có tìm (chọn nhiều lớp = chip) | ĐỔI (R7.5) |
| B3 | 1 Đợt · 2 Tuần và kỹ năng (Lịch riêng ▸) · 3 Học viên (Sẽ xếp · Cần xem · Không xếp được) · "Xếp lịch n em · m bài" | có | giữ; lý do "Cần xem / Không xếp được" ghi tại dòng | GIỮ |
| B4 | Lớp thường: "Xếp lịch Test…" · Progress / Final · đề xuất tuần · "Xếp cả lớp theo đề xuất" | có | giữ; cùng hàng lọc / nút như FT; không "Xoá" môn (luật) | GIỮ |
| B5 | GV chỉ xem | thẻ "Chỉ xem" mỗi hàng lớp | giữ; dòng lọc "Lớp: X ✕"; ô MT không là nút, không Xếp / + MT | GIỮ quyền, bày rõ |
| B6 | Rỗng khi lọc · lớp đang tải · lỗi | rỗng câu "Không lớp nào chưa đủ MT" + "Bỏ lọc" chữ link | một dòng + nút "Bỏ lọc"; lỗi câu chuẩn | ĐỔI dáng |
| B7 | 375 | cả bảng trôi ngang, mất tên em | cuộn ngang, cột Học viên dính trái | ĐỔI (R7.7) |
| C1 | Trang lượt FT: ‹ Lịch Test tuần · tên em · chọn lượt · ⓘ · Lớp lúc Test · Lịch · Target · Kỳ vọng | "Lớp lúc Test" chữ thường (`MockDetailPage.tsx:383`) | **link** hồ sơ lớp | ĐỔI (R7.4) |
| C1 | Chỉnh lịch ▾ | `ui/Menu` cũ (`MockDetailPage.tsx:389`), mỗi mục có dòng giải thích | menu chuẩn: Dời lịch cả đợt · Dời hạn chấm cả đợt · Khôi phục kết quả (tắt có lý do) · Xoá MT3 (đỏ) | ĐỔI (R7.4) — [XM-4] |
| C1 | Tóm tắt: Overall · n/4 kỹ năng · Còn lại (việc của lượt) | "L Nhập điểm" chip riêng | nút-chip chuẩn "Nhập điểm L" | ĐỔI dáng |
| C1 | Bảng kỹ năng + Nhập điểm / Trả lời đề nghị dời / ⋯ | có | giữ | GIỮ |
| C1 | Writing: công thức | chú thích tĩnh trong hộp (`HopNhapDiem.tsx:528`) | ⓘ cạnh "Writing" | ĐỔI (R7.4) — [XM-2] |
| C1 | Lịch sử | "Lịch sử lượt" kiểu riêng (`LichSuGon`) | MỘT khối "Lịch sử · n" chuẩn, có Khôi phục | ĐỔI (R7.4) |
| C1 | Câu "Chưa có kế hoạch hợp lệ…" (`MockDetailPage.tsx:980`) | đoạn chữ dài | GIỮ ý (lưu ý cần thiết: hậu quả), rút một dòng "⚠ Chưa đủ lịch: … · QL xếp lại" — không vẽ (seed không có ca này) | GIỮ |
| C2 | Lượt lớp thường cùng khung | có | lớp lúc Test + lớp hiện tại đều link; Lịch sử chuẩn | ĐỔI nhỏ |
| C3 | 375 trang lượt | bảng dồn hàng | mỗi kỹ năng một thẻ, nút 44 | ĐỔI dáng |

## 2. Bảng thao tác TRƯỚC → SAU (không mất thao tác nào)

| Thao tác (C2 "Giữ" + thao tác khác thấy trên web) | Trước | Sau | Ghi chú |
|---|---|---|---|
| ‹ / › đổi tuần · ô tuần (gõ tuần / ngày) · Tuần này | thanh tuần | như cũ | GIỮ |
| Tất cả / Fast Track / Lớp thường | `CongTacKhung` | đoạn chuẩn | GIỮ |
| Lớp tôi dạy / Tất cả · chi nhánh · Lọc (375) | có | như cũ (không vẽ hết) | GIỮ |
| Bấm số "đã chấm" / "quá hạn" | 2 ô to, 0 vẫn bấm | ô số chuẩn, 0 không bấm | GIỮ đích |
| Mở / thu nhóm, mở / thu hàng lớp (Xem · Thu) | có | như cũ (chevron + bấm hàng) | GIỮ |
| Nhập điểm (hàng Quá hạn) → lưới tại chỗ; đang mở thì "Thu" | có | như cũ | GIỮ |
| Mở tất cả lớp / Thu gọn tất cả (QL) | chữ link | nút | GIỮ, đổi dáng |
| Lịch thi thật › | có | 1440 như cũ; 375 trong "⋯" | GIỮ |
| Xuất Excel… | có | 1440 như cũ; 375 trong "⋯" (Lịch Test) | GIỮ |
| Gõ điểm · Lưu · bài tiếp › · Vắng · ⋯ (Lưu · đóng · Bỏ vắng · Khôi phục điểm) | có | như cũ (⑤ E) | GIỮ (R7.2) |
| Lớp tiếp: {mã} › (hết bài của mình ở lớp) | có | như cũ (không vẽ) | GIỮ |
| Chọn GV chấm S | ô thả | ô chọn có tìm | GIỮ, đổi dáng |
| MT cũ chưa nhập › | có | như cũ | GIỮ |
| Tên em / mã lớp / "MTn ›" mở hồ sơ | có | như cũ | GIỮ |
| Nhập điểm lớp › (trang lượt, hồ sơ lớp…) | qua `/nhap-diem/…` | thẳng Lịch Test đúng tuần + lớp (+ kỹ năng) | GIỮ, đổi đích (R7.6) |
| Bỏ lọc lớp (✕) | "Đang lọc: lớp X ✕" | "Lớp: X ✕" | GIỮ |
| Xếp nhiều MT… (FT) · Xếp lịch Test… (thường) | có | như cũ, một nhãn theo khung | GIỮ |
| Chưa đủ MT (lọc) · bấm "Chưa đủ MT · n em" | có | như cũ | GIỮ |
| Tìm lớp / học viên / email | ô tự viết | ô chọn có tìm, vẫn tìm được theo email | GIỮ |
| + MT ▾ (MTn · MT thường · S Ex) · + S Ex | có | menu chuẩn | GIỮ |
| Xếp MTn (đề xuất tuần) · Xếp cả lớp theo đề xuất | có | như cũ; ô bị chặn = nút tắt có lý do | GIỮ |
| + Ghi chú lớp · Hiện tất cả n | chữ link | nút | GIỮ |
| Hộp kỹ năng: Tuần chung ‹ › · Dời · Vắng · Xoá / Khôi phục · Dời hạn chấm · Huỷ điểm · Ghi chú lịch Test · Lý do · Lưu · Vẫn xếp vào tuần này · Huỷ thay đổi · Đóng · Xoá MTn (hỏi lại tại hộp) | có | như cũ | GIỮ |
| Hộp kỹ năng: Nhật ký (cả lượt) · Nhật ký từng môn · Lịch sử ghi chú | 3 lối | MỘT "Lịch sử · n" | GỘP — [XM-3] |
| Hộp kỹ năng: Mở hồ sơ MT › | link riêng | tên lượt ở đầu hộp (link có "›") | GỘP (trùng đích) |
| Ô mờ "Đã xoá · Khôi phục" | có | như cũ | GIỮ |
| Ngăn xếp: Lớp (chọn nhiều) · Tìm HV · Đợt · Tuần · L R W S · Lịch riêng ▸ · Thi lại · Chọn tất cả / Bỏ chọn · Xếp lịch n em · Đóng | có | như cũ | GIỮ |
| GV chỉ xem Kế hoạch Test | có | như cũ | GIỮ |
| Trang lượt: chọn lượt · ⓘ · ‹ quay lại · Nhập điểm · Trả lời đề nghị dời · ⋯ kỹ năng · mở kỹ năng (Case, nhận xét) | có | như cũ | GIỮ |
| Chỉnh lịch: Dời lịch cả đợt · Dời hạn chấm (cả đợt) · Khôi phục kết quả · Xoá MTn | có | menu chuẩn | GIỮ |
| Lịch sử chi tiết + Khôi phục | "Lịch sử lượt" | "Lịch sử · n" | GIỮ |

Không thao tác nào bị bỏ. Hai chỗ GỘP (Nhật ký → Lịch sử · n; Mở hồ sơ MT › → tên lượt) giữ nguyên đích.

## 3. [XM] — PTA Overhaul đã quyết 15/11 (ghi ngay dưới mỗi dòng)

1. **[XM-1] "Cần xếp lại" ↔ "Chưa đủ MT" (R7.5) — KHÁC nghĩa, không gộp tự động.** Web chỉ còn chip "Chưa đủ MT" (lộ trình chưa đủ số MT: 3 · RF 2). "Cần xếp lại" chỉ còn trong Hướng dẫn (`shared/i18n/en/hdb.ts`, `hdV2b.ts`, câu "chip Cần xếp lại: em vắng cần xếp lại") và mô tả tài khoản demo (`WelcomePage.tsx:341`) — nghĩa cũ "em vắng cần xếp lại", nay vắng tự dời / huỷ theo N38 ("huỷ là huỷ thôi"). Đề xuất: sửa chữ Hướng dẫn + demo thành "Chưa đủ MT" với nghĩa thật; không có khái niệm "Cần xếp lại" nữa.
   → **PTA: đồng ý, không gộp; sửa chữ Hướng dẫn + mô tả demo khi code.**
2. **[XM-2] Công thức Writing.** R7.4 bảo đưa vào ⓘ; bảng mẫu ⑤ E2 (đã duyệt) vẽ dòng "Writing = (W1 + 2×W2) / 3 · Task 1 6.0 → Writing 6.0 · kỳ vọng 5.5 ✓" dưới ô nhập. Đề xuất: hộp nhập giữ phần xem trước "Task 1 6.0 → Writing 6.0 · kỳ vọng 5.5 ✓", công thức vào ⓘ cạnh đó; trang lượt dùng ⓘ cạnh "Writing" (C1). Cần ⓪ sửa E2 cho khớp nếu PTA đồng ý.
   → **PTA: đồng ý — công thức vào ⓘ, hộp giữ dòng xem trước; PTA báo ⓪ sửa E2.**
3. **[XM-3] Nhật ký từng môn trong hộp kỹ năng.** Gộp ba lối thành một "Lịch sử · n" của cả lượt, mỗi dòng ghi tên môn. Nếu cần xem riêng một môn: mở "Lịch sử · n" từ ⋯ môn thì lọc sẵn môn đó (giữ ý cũ, không thêm lối). Hỏi PTA có cần lọc theo môn không.
   → **PTA: MỘT khối "Lịch sử · n", mỗi dòng ghi tên môn, KHÔNG lọc theo môn, không thêm mục vào ⋯.**
4. **[XM-4] Dòng giải thích dưới mục "Chỉnh lịch".** Menu chuẩn ⑤ H2 không có dòng mô tả (chỉ lý do khi tắt). Hậu quả vẫn nói ở bước sau: Xoá MT3 hỏi lại tại chỗ ("Ô vẫn hiện Đã xoá, khôi phục được"), Dời cả đợt mở hộp chọn tuần có câu "kỹ năng còn dời được sang một tuần". Đề xuất theo menu chuẩn.
   → **PTA: đồng ý.**
5. **[XM-5] Ô bị chặn ở Kế hoạch Test.** Nay vẽ nút mờ "Xếp MT2" + "Xếp MT1 trước" thay cho "—". Mỗi em thiếu MT1 sẽ có 2–3 nút mờ trên hàng → hàng cao hơn một chút. Nếu thấy rối: chỉ hiện nút mờ ở cột kế tiếp (MT2), cột sau nữa để "—".
   → **PTA: chỉ cột KẾ TIẾP có nút mờ + lý do; cột sau "—". Đã áp ở B1, B7.**
6. **[XM-6] Turso — không thêm đọc.** Đợt, môn của tôi (`phan.toi.kyNang`), hạn, số bài chờ duyệt dời đã có trong `/cham/lich-test` (đang chỉ dùng cho `title`) → hiện ra hàng không thêm câu / dòng. "Nhập điểm lớp ›" chỉ đổi đường dẫn. Ô "GV chấm S" dùng đúng danh sách đang nạp cho ô thả hiện tại. Ô chọn có tìm "Tìm lớp hoặc học viên" lọc trên dữ liệu Kế hoạch đã nạp (như `TimKeHoach`). Ước: 0 câu thêm mỗi lần mở trang.

## 4. Tự rà từng dòng đề bài

| Dòng | Yêu cầu | Đạt? | Ở đâu |
|---|---|---|---|
| R7.1 | Hàng lớp ghi THẲNG đợt · môn của tôi · hạn (chip chuẩn) · bài chờ duyệt dời; dải số chuẩn, 0 không bấm; giữ hai nhóm | Đạt | A1, A3, A5 (0 không bấm), A6 |
| R7.2 | Lưới nhập điểm giữ nguyên (hộp "Lưu · bài tiếp ›" + Vắng + ⋯) | Đạt | A1, A2 |
| R7.3 | Lưới HV × MT giữ; "Đã xoá · Khôi phục"; S Ex ô dẹt; GV chỉ xem; hộp kỹ năng Dời · Vắng · Xoá, MỘT chân, Lịch sử · n + Mở hồ sơ MT ở đầu hộp; nút xếp một nhãn theo khung; lý do tại nút | Đạt ([XM-3], [XM-5]) | B1, B2, B4, B5 |
| R7.4 | Chỉnh lịch menu chuẩn; Lớp lúc Test link; một khối Lịch sử · n; công thức Writing → ⓘ | Đạt ([XM-2], [XM-4]) | C1, C2, C3 |
| R7.5 | "Xoá" một chữ; "Chưa đủ MT" (kiểm "Cần xếp lại"); "Lớp: X ✕" cả hai tab; công tắc khung + tab ngăn xếp theo chuẩn; ô tìm = ô chọn có tìm | Đạt ("Cần xếp lại" khác nghĩa → [XM-1]) | A4, B1, B2, B3, B5 |
| R7.6 | "Nhập điểm lớp ›" trỏ thẳng Lịch Test đúng tuần + lớp | Đạt | A4, C1, bảng thao tác |
| R7.7 | 375: Lịch Test mỗi lớp một thẻ đủ đợt · môn · hạn; Kế hoạch cuộn ngang cột em dính | Đạt | A6, B7 (+ C3) |
| G1 | Nâng cấp, giữ bố cục + mọi thao tác | Đạt | mục 2 |
| G2 | Thành phần, chữ, vị trí theo ⑤ (tab, ô chọn có tìm, dải số, menu, lịch sử, câu lỗi, mã tuần, chip không đơn vị) | Đạt | toàn tệp |
| G3 | Không chú thích tĩnh / bước xác nhận / tab mới | Đạt (chỉ hỏi lại khi Xoá — như nay) | — |
| G4 | html + css riêng + ghi chú + ảnh 1440 Tối/Sáng, 375 Sáng, ảnh cặp TRƯỚC │ SAU, đủ trạng thái (rỗng, tải, lỗi, chỉ xem) | Đạt (B6 không có ảnh TRƯỚC: seed không có ca rỗng khi lọc) | `anh/test/` |
| G5 | PR chỉ `thiet-ke/v21/`, không merge, nhắn PTA Overhaul | Đạt | PR #1606 |
| PTA rà 1 | A6 đủ Tuần này · Xuất Excel… · Lịch thi thật › (⋯ 44 px, 2 mục) · thanh trên tìm + tên · badge Công việc thanh dưới | Đạt | A6 (hai khung) |
| PTA rà 2 | A6 nhóm "Quá hạn chấm · 2 lớp · 12 bài" như 1440 | Đạt | A6 |
| PTA rà 3 | Ô tìm Kế hoạch Test giữ tìm theo email | Đạt | B1, B4, B5, B7 + bảng thao tác |
| PTA rà 4 | XM-5: em thiếu MT1 chỉ một nút mờ | Đạt | B1, B7 |
| PTA rà 5 | Lý do "Vắng" mờ đặt tại nút, không làm hàng cao thêm | Đạt | B2 |
| PTA rà 6 | Tâm ✕ / ⋯ lệch ≤ 1 px so với ô chứa | Đạt — đo bằng Playwright (tâm mực chữ so với tâm nút): ✕ hộp kỹ năng / hộp nhập / ngăn xếp 36×36 dx 0 dy −0,3 · ✕ chip "Lớp: X" 24×24 dx 0,2 dy 1,0 · ✕ chip lớp ngăn xếp 22×22 dx 0,5 dy 1,0 · ⋯ 36×30 dx 0 dy 0,5 · ⋯ 375 44×44 dx 0,4 dy 1,0 | toàn tệp |

## 5. impeccable `critique` (15/11) — hai agent độc lập (A rà thiết kế · B detector)

Điểm Nielsen: **31/40**, không P0. Detector: 122 phát hiện, không P0/P1 mới (đa số trùng `bang-mau.html` đã duyệt: dấu số chú thích vàng, viền trái 3 px của dải nhóm, phông đã khoá; còn lại là đệm dọc 0 trong hàng cao cố định — báo nhầm).

| P1 | Xử lý |
|---|---|
| B2: nút "Vắng" mờ không có lý do tại nút | ĐÃ SỬA: lý do đặt tại nút (bong "Đã có điểm — Huỷ điểm trước" khi chạm / focus nút mờ — sau PTA rà 5). "Lưu" mờ khi chưa đổi gì giữ như web. |
| 375: ô điểm, chip lọc, ✕ bỏ lọc, ô số < 44 px | ĐÃ SỬA (`test.css` cuối tệp): mọi thứ bấm được ở 375 cao ≥ 44. |
| Nền sáng: chữ S Ex hồng #f25a98 ≈ 3,1 : 1 | ĐÃ SỬA: chữ S Ex nền sáng #b8285f (≥ 4,5 : 1), viền giữ hồng. |
| B3: "Sẽ xếp · 6" mà chỉ 3 dòng; C2 "nay" trùng lớp; 375 Tổng quan trùng biểu tượng Công việc | ĐÃ SỬA số liệu / chữ / biểu tượng. |
| B2: "Xoá MT3" ở đầu hộp cạnh ✕ | GIỮ như web (G1-12: một mục thì nút thẳng ở đầu hộp, xa nút Lưu; Xoá hỏi lại tại hộp). |
| C1: "Khôi phục" trong Lịch sử dáng chữ | GIỮ theo mẫu Lịch sử ⑤ H4 đã duyệt (`link-nho`); nếu đổi thì ⓪ đổi chung ở ⑤. |
| C1: dải "Còn lại · Nhập điểm L/R/W" trùng nút trên hàng | GIỮ (thao tác đang có, cho thấy việc còn lại của lượt + ai làm); chỉ đổi dáng nút-chip chuẩn. |

Không sửa (P2, ghi lại): "W2 SEP 2026" có năm trong hộp kỹ năng là luật C20 của web (hộp lịch luôn kèm năm) · nút "Tuần này" mờ khi đang ở tuần này (không cần lý do).
