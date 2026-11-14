# GD-15 — Hồ sơ GV theo mockup ⑧ (`thiet-ke/v21/ho-so-gv.html` H1–H7, lời 37)

Plan: `docs/superpowers/specs/2026-11-13-overhaul-v6/12-plan-giao-dien-dot-3.md` dòng GD-15. Ghi chú mockup: `thiet-ke/v21/tong-quan-ghi-chu.md` (mục 1 bảng Hồ sơ GV, mục 2 H1–H7, mục 3 thao tác, mục 6 [XM] đã chốt, **mục 10 lời 37**).
Luật áp: V22 (hạn / quá hạn chỉ màu, không ⚠), lời 35 (badge / chip không đơn vị), 36, 37, 40; ✓ Đã lưu xanh (toast có sẵn).
GD-4c (D3): ô "Việc đang tồn" nay **mở panel tại chỗ** (máy chủ có nguồn `cot=viec`, đọc khi bấm).

Ảnh cặp (trái mockup · phải web, seed demo 14/09; phông Be Vietnam Pro + Inter đã nạp; GV demo Trần Ngọc Hà = vai 7, QL = vai 2):
- `cap-h1-gv-1440-toi.png` — H1 tab Lớp, GV xem mình
- `cap-h2-hoc-thuat-1440-toi.png` — H2 tab Học thuật
- `cap-h3-viec-case-1440-toi.png` — H3 tab Việc & Case
- `cap-h4-ql-1440-toi.png` — H4 QL xem GV, đang sửa kỹ năng
- `cap-h5-panel-1440-toi.png` — H5 bấm "Cần làm trước" → Ngăn Case tại trang
- `cap-h7a-gv-375-sang.png` — H7a 375 GV · `cap-h7b-ql-375-sang.png` — H7b 375 QL tab Việc & Case
- TRƯỚC: `thiet-ke/v21/anh/ho-so-gv/truoc-{gv-cua-minh,ql-xem-gv}-{1440-toi,375-sang}.png` (web main lúc vẽ mockup — không đổi tới PR này)

## 1. Truy vết khung → thành phần → ảnh

| # | Khung | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|---|
| 1 | H1 đầu trang: tên · Từ tuần / đến (ô gõ + lịch) · ⓘ kỳ · Mở Công việc › / Việc của {tên} › | `HoSoGiaoVienPage` header (giữ ONgay, NutLuat) | h1, h4 | KHỚP |
| 2 | H1 `.o-tin` Vai · Kỹ năng · **GVCN = mã lớp link** (R8.4) | `.o-tin` + `NhanDau`; GVCN = `lop.laGvcn` → Link hồ sơ lớp | h1 | KHỚP |
| 3 | H1 dải chuẩn **Việc · % đúng hạn · Chưa làm │ Chấm Test · % đúng hạn · Chưa làm** (lời 37) | `DaiDungHan` (DaiChiSo `ODai nhom`) — % → panel tab Đúng hạn, Chưa làm → tab Chưa làm | h1 | KHỚP (KHÁC theo V22: không ⚠) |
| 4 | H1 thanh tab Lớp (mờ n) · Học thuật · Việc & Case (đỏ = quá hạn) | `HangTab` + `?tab=`; badge = Σ quá hạn của "Việc đang tồn" (cùng GET) | h1 | KHỚP |
| 5 | H1 **Lớp đang dạy** bảng: Lớp (+ GVCN, Bàn giao n/m em — XM-10) · Kỹ năng · HV · GVCN (chỉ GV khác) · Chưa nhập (hộp) · Quá hạn (hộp đỏ); đầu khối "n ⓘ lớp · 65 HV" | `KhoiLop` (`Bang`, `.o-so-hop`) | h1 | KHỚP |
| 6 | H1 dòng phụ lớp "LT1 · MT1 · W3 SEP" / "tuần 8/8 · Final · W3 SEP" — chỉ hồ sơ mình (XM-5) | `phuLopDay` từ `/tong-quan/lop-toi-day/hai-khoi` (đường đã gọi) | h1 | KHỚP |
| 7 | H1 gom "Kỹ năng tôi dạy" vào Lớp đang dạy (XM-5) | bỏ bảng `day` ở `LopToiDay`; Đạt / Tiến bộ theo lớp ở tab Học thuật, Chờ chấm → cột Chưa nhập / Quá hạn | h1 | KHỚP |
| 8 | H1 **Lớp chủ nhiệm** (chỉ hồ sơ mình), cột "Case đang mở" | `LopChuNhiem` (tách từ `HaiKhoiGv`) | h1 | KHỚP |
| 9 | H1 **Em đang bổ trợ** + số đếm; hạn Mini Test = viên hạn | `KhoiBoTro` (`DemDau`, `ChipHan vien`) | h1 | KHỚP |
| 10 | H2 dải tab: Đạt kỳ vọng Test (n/N lượt) · Tiến bộ · Kết quả thi thật (chưa có dữ liệu → câu) | `KhoiHocThuat` — Đạt kỳ vọng Test theo khung đang chọn = hàng Cộng (`ket-qua:<khung>`, máy chủ thêm dạng không kỹ năng) | h2 | KHỚP |
| 11 | H2 công tắc Fast Track / Lớp thường (đoạn chuẩn) + ⓘ bên phải dải | `CongTac v8` + `NutLuat` | h2 | KHỚP |
| 12 | H2 hai bảng Theo kỹ năng · Theo lớp GIỮ, % trong hộp | `BangKyNang`, `BangLop` (giữ), `.o-so-hop`, ô % rộng 58 | h2 | KHỚP |
| 13 | H3 **Case đang phụ trách** + số (panel) · chip trạng thái (Case quá hạn · Cần làm · Chờ duyệt · Đang làm) │ vạch │ Có việc quá hạn · **Chưa có PA** | `KhoiCase` — "Case có PA" % của dải cũ → chip "Chưa có PA" (panel `case-chua-pa`) | h3 | KHỚP (V22: không ⚠) |
| 14 | H3 **Cần làm trước** = dòng việc chuẩn (biểu tượng · "lớp · việc" · thẻ phụ em / Case · viên hạn · nút động từ) | `KhoiCase` hàng `li` (cột như `COT_VIEC`) | h3 | KHỚP |
| 15 | H3 bấm dòng → panel việc tại trang (XM-9; QL làm thay) | `NganCase` mở đúng màn (Thêm PA / Ghi kết quả / Xác nhận / Xác nhận PA / Mô tả) | h5 | KHỚP — xem KHÁC 1 |
| 16 | H3 **Việc đang tồn** bảng nhỏ: Nhóm › · Việc (hộp) · Quá hạn (hộp đỏ) + hàng Tất cả (lời 37 thay XM-8) | `KhoiViec` (`Bang`) — hộp → panel `cot=viec&nhom=…[&qh=1]` | h3 | KHỚP |
| 17 | H3 **Yêu cầu đã gửi** bảng nhỏ: Chờ duyệt (Số · Quá hạn) · Bị từ chối · 60 ngày qua; link Yêu cầu của tôi › / Chờ duyệt › | `KhoiYeuCau` — Quá hạn → panel `cot=yc-cho&qh=1` (mới, cùng điều kiện số đếm) | h3, h4 | KHỚP |
| 18 | H3 bố cục Case trái │ phải 400 (Việc đang tồn + Yêu cầu) | lưới như `BoCuc` | h3 | KHỚP |
| 19 | H4 QL: Sửa kỹ năng tại chỗ (5 chip · Lưu · Đóng) → **"✓ Đã lưu kỹ năng · Hoàn tác"** 10 giây | `KyNangGv` + `toast.hoanTac` (ghi lại bộ cũ, cùng đường + kiểm quyền) | h4 | KHỚP |
| 20 | H4 badge tab Việc & Case **mờ** khi xem người khác | `HangTab` `so` (mờ) / `badge` (đỏ, chỉ hồ sơ mình) | h4 | KHỚP |
| 21 | H4 "Hiệu quả PA của {tên} ›" đầu khối Case; "Yêu cầu {tên} đã gửi" + "Chờ duyệt ›" | giữ | h4 | KHỚP |
| 22 | H4 QL: không Lớp chủ nhiệm, không dòng phụ Test sắp tới (XM-5) | `useHaiKhoi(false)` không gọi | h4 | KHỚP |
| 23 | H5 chân "Đóng · Lưu · Việc tiếp ›" | `NganCase onTiep` = dòng Cần làm trước kế | h5 | KHỚP |
| 24 | H5 ✕ panel | `KhungPanel` (chung, không sửa) — đo: mockup phải 20 · trên 10 · 36×36, web 20 · 10 · 36×36 (**0 px**) | h5 | KHỚP |
| 25 | H6 trạng thái: Skeleton · ErrorState · Empty · lỗi kỳ; chưa có số liệu → một câu | giữ + `DaiDungHan` "Chưa có số liệu trong kỳ" | — | KHỚP |
| 26 | H7 375: dải hai nhóm (nhãn nhóm một hàng, hai ô thẳng cột) | `.dai-cs-2nhom` (CSS 375) | h7a, h7b | KHỚP |
| 27 | H7a 375: Lớp đang dạy = thẻ (tên + chip · dòng phụ · HV / Chưa nhập / Quá hạn), 3 lớp + "+ n lớp" | `KhoiLop` `theRieng` | h7a | KHỚP |
| 28 | H7 375 đầu trang: hai ô tuần "–", nút việc rộng hết; Vai / Kỹ năng / GVCN xếp dọc | `max-sm:` | h7a, h7b | KHỚP |
| 29 | H7b 375 thứ tự Việc đang tồn → Case → Yêu cầu | `order` < 1280 | h7b | KHỚP |
| 30 | Hướng dẫn "?" GV / QL / Admin cho màn mới (Chỉ cho tôi → hàng tab) | `huongDan/{gv,ql,admin}.ts`, `data-hd="hsgv-tab"`, bản Anh `en/gd15.ts` | — | KHỚP |

**KHỚP 30 / 30 (100 %).**

## 2. KHÁC (có lý do)

1. **H5 panel**: mockup vẽ `PanelViec` (khung việc + "Lưu · việc tiếp ›"); web mở **Ngăn Case** ngay đúng màn việc (Thêm PA, Ghi kết quả PA, Xác nhận…), chân "Việc tiếp ›". Lý do: dòng "Cần làm trước" là Case của hồ sơ (`caseMo`), không phải dòng `myWork`; `PanelViec` với việc Case cũng mở chính Ngăn Case này — cùng form, cùng quyền, không thêm câu đọc.
2. **V22**: mockup còn ⚠ trước số quá hạn / chưa làm, chip "Case quá hạn", viên hạn — web chỉ màu (luật V22 mới hơn mockup).
3. **Dải đầu trang** bỏ dòng nhỏ "+ n S chéo chung" của dải cũ (lời 37: một ý; S chéo chung không là việc của GV này — đã ở hàng cuối bảng Giáo viên Tổng quan).
4. Tên việc ở "Cần làm trước" giữ tên môn ngắn "Thêm PA R" (cùng `viecTiepCuaEm` dùng ở mọi nơi) — mockup ghi "Reading".
5. Badge tab Việc & Case lấy từ `/giao-vien/:id/viec` (đã gọi khi mở trang) — mockup ghi chú mục 5 gợi ý tải khi mở tab; giữ GET lúc mở vì badge cần số ngay.

6. **Dải tab Học thuật** thêm ô "PA cải thiện n/m" (FT, khi có PA trong kỳ) — mockup H2 không vẽ; giữ thao tác của dải cũ (ô Case có PA · PA cải thiện → panel), số theo kỳ nên đặt ở tab Học thuật.

Không có [XM] mới. Hai KHÁC của GD-14 (SOS 2–3 panel theo chi nhánh; 375 gập chi nhánh rỗng) không dùng chung thành phần với GD-15 → để nguyên trong backlog.

## 3. Thao tác TRƯỚC → SAU (không mất thao tác)

| Thao tác cũ | Sau | Ghi chú |
|---|---|---|
| ‹ quay lại · Từ tuần / đến · ⓘ kỳ · Mở Công việc › / Việc của {tên} › | GIỮ | kỳ theo URL `tu`, `den` (XM-13 đã có) |
| Sửa kỹ năng → Lưu / Đóng | GIỮ + **Hoàn tác 10 giây** | |
| Dải: % Điểm đúng hạn / Việc → panel 3 tab | GIỮ (% → tab Đúng hạn) + **Chưa làm → tab Chưa làm** | |
| Dải: Đạt kỳ vọng Test · Tiến bộ · Kết quả thi thật (▼ ▲ ★) → panel | chuyển sang dải tab Học thuật, cùng panel | Đạt kỳ vọng theo khung đang chọn |
| Dải: Case có PA % → panel Case đang phụ trách; PA cải thiện n/m → panel | chip **Chưa có PA** → panel `case-chua-pa`; số Case đầu khối → panel Case đang phụ trách; **PA cải thiện n/m → panel `pa-hieu-qua`** ở dải tab Học thuật (FT, theo kỳ) | xem KHÁC 6 |
| Mã lớp → hồ sơ lớp · chip Bàn giao → hồ sơ lớp việc Bàn giao (&mon=) | GIỮ | |
| Số HV đang học → panel | GIỮ (đầu khối "lớp · 65 HV") | |
| Chưa nhập / quá hạn theo lớp → panel | GIỮ (hai cột hộp) | |
| Kỹ năng tôi dạy: Đạt KV / Tiến bộ theo lớp → panel | tab Học thuật bảng Theo lớp (cùng `ket-qua-lop`, `tien-bo-lop`) | theo kỳ đang chọn |
| Kỹ năng tôi dạy: Chờ chấm / quá hạn → panel `/tong-quan/lop-toi-day/o` | cột Chưa nhập / Quá hạn (`/giao-vien/:id/o?cot=chua-nhap|qua-han&lop=`) | cùng tập bài nợ điểm |
| Lớp chủ nhiệm: Dưới kỳ vọng · SOS · Case · Thi → panel | GIỮ | |
| Học thuật: công tắc khung · % → panel · phân trang 7 lớp · ⓘ ký hiệu | GIỮ | |
| Việc đang tồn: số nhóm → Công việc đúng nhóm | tên nhóm › → Công việc đúng nhóm (GIỮ); **hộp số → panel tại chỗ** (GD-4c D3) | |
| Việc đang tồn: "n quá hạn" → Công việc lọc quá hạn | hộp Quá hạn → **panel việc quá hạn tại chỗ** (mỗi dòng có "Hồ sơ" / link việc) | lọc quá hạn ở Công việc vẫn có qua tên nhóm › rồi bộ lọc |
| Em đang bổ trợ: tên → hồ sơ HV | GIỮ | |
| Case: số · chip trạng thái · Case có việc quá hạn → panel | GIỮ (chip đổi tên "Có việc quá hạn") + Chưa có PA | |
| Cần làm trước: tên em / Case / việc → hồ sơ HV (Case mở sẵn) | dòng / nút động từ → **Ngăn Case tại trang** đúng màn; tên em vẫn link hồ sơ HV | XM-9 |
| Hiệu quả PA của {tên} › · Yêu cầu: chờ / từ chối → panel · Yêu cầu của tôi › / Chờ duyệt › | GIỮ + Quá hạn duyệt → panel | |

## 4. Đo

**Turso — GET khi mở trang** (Playwright, seed demo):
- GV xem mình (vai 7): 4 → 4 (`/giao-vien/7`, `/chi-so`, `/viec`, `/tong-quan/lop-toi-day/hai-khoi`) — không đổi.
- QL xem GV (vai 2): 3 → 3 (`/giao-vien/7`, `/chi-so`, `/viec`) — không đổi.
- Đổi tab không gọi thêm (mọi tab dùng dữ liệu đã nạp).

**Panel mới (đọc khi bấm, `tocDoDuong.ts`):** `/giao-vien/7/o?cot=viec…` — QL 43 · GVCN 39 · QT 42 · GVBM 403 (4) câu; trần = trần `/giao-vien/7/viec` (cùng `myWork` / `viecCuaNguoi`). `cot=yc-cho&qh=1` · `chi-so/o?cot=ket-qua:<khung>`: cùng câu với đường đã có.
Kiểm số: panel = số đếm (vai 7: 34 · 9 quá hạn · Case học thuật 13 / 3 · Chấm điểm 7 · Ý thức 8 · Vận hành 6; Admin chỉ Chấm điểm 7; `ket-qua:ft` 11/15 = hàng Cộng FT).

**Check:** `npm run check` đầy đủ trên bản đã merge `origin/main` — xem mô tả PR. impeccable `detect`: sạch. `/ponytail-review`: lean.
