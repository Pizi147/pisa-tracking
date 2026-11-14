# GD-11a LICH-TEST-TUAN — khớp / khác mockup ⑦ A1–A6

Mockup `thiet-ke/v21/test.html` (⑦ khu A) + `test-ghi-chu.md` (A1–A6, [XM-6]). Plan `12-plan-giao-dien-dot-3.md` dòng GD-11a + V22 (hạn chỉ bằng màu, không ⚠).
Ảnh chụp seed demo (14/09/2026), tài khoản demo tên giả: GV "Trần Ngọc Hà" (vai 7), QL "Nguyễn Khánh Vy" (vai 2). Phông Be Vietnam Pro + Inter đã nạp (`document.fonts.check` = true trước mỗi ảnh). Công cụ: `scripts/anh-cap.mjs`.

## Ảnh cặp (mockup │ web)
| Ảnh | Khung | Nội dung |
|---|---|---|
| `a1-gv-1440-toi.png` | A1 | GV 1440 tối: Quá hạn chấm mở (cùng cột hàng lớp) · tiêu đề cột mảnh · hàng lớp ghi thẳng đợt · môn của bạn · hạn · "1 bài chờ duyệt dời" · lưới mở |
| `a3-ql-1440-toi.png` | A3 | QL 1440 tối: "Mở tất cả lớp" là nút · cột Môn (W1 W2) + Còn chờ "GV (môn)" · ô **GV chấm S** chọn có tìm tại chỗ · "Đang chấm" / "✓ Đã chấm" |
| `a4-loc-lop-1440-toi.png` | A4 | Vào từ "Nhập điểm lớp ›" (`/test/lich?classId&periodId&kn`): đúng tuần W2 SEP, chip **"Lớp: MB FT 101 ✕"** |
| `a5-rong-1440-toi.png` | A5 | Tuần không có Test: một dòng trong nhóm, Quá hạn chấm vẫn ở trên, "Đã chấm 0 / 0" không bấm |
| `a6-gv-375-sang.png` | A6 | 375 sáng: mỗi lớp một thẻ (mã · tiến độ / đợt · môn / hạn · chờ dời · trạng thái), dải số hai ô một hàng, công tắc khung đủ chữ |
| `a6-ba-cham-375-sang.png` | A6 | 375: nút **⋯** 44 px đầu trang mở Xuất Excel… · Lịch thi thật › |

## Bảng truy vết (khung → thành phần → ảnh)
| Khung | Thành phần | Sau PR | Ảnh | Đánh giá |
|---|---|---|---|---|
| A1 | Đầu trang · tab · hàng tuần · Lịch thi thật › · Xuất Excel… | GIỮ (GD-4 đã chuẩn) | a1 | KHỚP |
| A1 | Dải số "Của bạn · Đã chấm n / N · Quá hạn n", 0 không bấm | GIỮ (GD-4e `DaiChiSo`) | a1, a5 | KHỚP (⚠ trước số quá hạn: KHÁC theo V22) |
| A1 | Hàng lớp: Lớp · Đợt (+ số em) · Môn của bạn · hạn chip · thẻ "n bài chờ duyệt dời" · tiến độ · trạng thái | ĐỔI — ghi thẳng (trước chỉ ở `title`), bỏ `goiYHang` | a1 | KHỚP |
| A1 | Hàng tiêu đề cột mảnh 32 px | THÊM (`thead .lt-cot`) | a1, a3 | KHỚP |
| A1 | Hàng Quá hạn chấm cùng cột hàng lớp (Lớp · Đợt · Môn · Hạn · "còn chờ: GV (môn)" · số bài · Nhập điểm) | ĐỔI — `ColLichTest` chung, `HangNhom` có mũi tên | a1 | KHỚP |
| A1 | Lớp đã chấm xong: ô hạn trống + "✓ Đã chấm" (✓ trong chip) | ĐỔI — hạn chỉ khi còn bài (người có phân công: bài của mình) | a3 | KHỚP |
| A1 / A2 | Lưới nhập điểm + hộp nhập một ô | GIỮ y nguyên (LuoiNhung / LuoiChamLop không đổi) | a1, a3 | KHỚP |
| A1 | Chip hạn | `ChipHan vien` — đỏ quá hạn · vàng gần hạn · xám chưa tới | a1 | KHÁC theo V22 (mockup còn ⚠) |
| A3 | "Mở tất cả lớp" | nút nhỏ `btn btn-sm` (trước chữ link) | a3 | KHỚP |
| A3 | QL cột "Môn" (FT ghi W1 W2) + "Còn chờ: GV (môn)" | THÊM — máy chủ `gvMon` (phân công đang hiệu lực; S Mock = "chấm chéo S") | a3 | KHỚP |
| A3 | Trạng thái QL "Đang chấm" | hiện lại (trước ẩn — AUDIT-UI T3); mockup vẽ | a3 | KHỚP |
| A3 | Ô "GV chấm S" | `NutGvCham oChon` = `ChonNguoi` (GD-5) tại chỗ 300 px, GV Speaking chi nhánh trước | a3 | KHỚP (mockup vẽ lúc đang gõ "Hà") |
| A4 | "Nhập điểm lớp ›" → `/test/lich?classId&periodId&kn` | ĐỔI — trang lượt MT + `hrefDayDu` máy chủ (lưới theo tuần) trỏ thẳng; lượt lớp thường không theo tuần giữ panel Nhập điểm lớp | a4 | KHỚP |
| A4 | Chip "Lớp: X ✕" | ĐỔI chữ — cùng dáng chip bỏ lọc ở Kế hoạch Test (`nut-loc nut-loc-dang`) | a4 | KHỚP |
| A4 | Nhóm mở khi vào | web mở **Quá hạn chấm** khi lớp còn bài quá hạn của GV (luật lối vào cũ); mockup vẽ nhóm tuần mở | a4 | KHÁC — [XM] **PTA chốt 15/11: GIỮ như web** (lớp còn bài quá hạn → mở nhóm Quá hạn) |
| A5 | Rỗng một dòng · lỗi câu chuẩn trong thẻ ("Không tải được Lịch Test tuần." + "Dữ liệu đã lưu không mất." + Thử lại) · tải = xương | ĐỔI | a5 | KHỚP (lỗi + xương không chụp được trên seed — mã đã đọc) |
| A6 | 375 mỗi lớp một thẻ; Quá hạn có nút "Nhập điểm" 44 hết bề ngang | ĐỔI (< 1024 px) | a6 | KHỚP |
| A6 | Dải số 375 hai ô một hàng (không nhãn nhóm) | ĐỔI | a6 | KHỚP |
| A6 | Công tắc khung trên hàng tuần (trước trong "Lọc"); "Lọc" chỉ còn phạm vi + chi nhánh (GIỮ, GV một chi nhánh không thấy) | ĐỔI | a6 | KHỚP (mockup ghi "Thường", web "Lớp thường" — chữ của thành phần chung, đủ chỗ) |
| A6 | ⋯ 44 px: Xuất Excel… · Lịch thi thật › | THÊM (`MenuDong`) | a6-ba-cham | KHỚP |
| A1 | Mũi tên mở hàng | ▸ đặc (`MuiTenMo` chung) — mockup "›" nét | a1 | KHÁC — thành phần chung, đổi ở GD-18 (bàn giao PTA 15/11) |
| A1 | Dòng phụ đợt "dời vắng · 1 em" | web chỉ "1 em" | a1 | BỎ — máy chủ không trả cờ dời vắng cho hàng tuần (chỉ hàng Quá hạn); Việc để sau |
| A6 | Thẻ Quá hạn 375: "còn chờ: …" | web giữ dòng chữ nhỏ (thông tin đang có); mockup không vẽ | a6 | GIỮ |

### Vòng PTA rà #1705 (15/11)
| Chỗ | Sửa | Ảnh |
|---|---|---|
| Cột "còn chờ" / "Còn chờ" bị cắt "…" | không cắt nữa: xuống dòng (≤ 2 dòng ở 1440), quá 3 người → "+k"; `title` đủ tên; thẻ "chờ duyệt dời" chạy cùng dòng chữ | a1, a3, a4 |
| Nút hàng Quá hạn đang mở ghi "Thu" | "Thu gọn" (cùng chữ "Thu gọn tất cả" / mũi tên) | a4 |
| 375 nhóm Quá hạn chấm mặc định đóng | người có phân công còn bài quá hạn → mở sẵn (A1, A6); QL / QT thu (A3) | a1, a6 |
| 375 công tắc khung mất số | "Fast Track 1 · Lớp thường 4" (`CongTacKhung giuSo`) | a6 |
| 375 "MT cũ chưa nhập" có "," lẻ đầu dòng | mỗi mục một khối liền, dấu phẩy theo mục | a6 |

Đo lại trên mọi ảnh mới: không phần tử nào trong bảng Lịch Test bị cắt "…" (GV + QL, 1440 + 375); ✕ chip dy −0,8 px; ⋯ 375 dx 0 dy −0,5 px.

**KHỚP 19 / 23 = 83 %; bỏ 3 dòng KHÁC theo luật / thành phần chung có lịch (V22 ×1, `MuiTenMo` GD-18, A4 luật lối vào cũ) → 19 / 20 = 95 %.**

## Thao tác TRƯỚC → SAU (không mất thao tác)
| Thao tác | Trước | Sau | Ghi chú |
|---|---|---|---|
| ‹ / › đổi tuần · ô tuần · Tuần này | có | như cũ | GIỮ |
| Tất cả / Fast Track / Lớp thường | 1440 hàng tuần; 375 trong "Lọc" | 1440 + 375 hàng tuần | GIỮ, 375 bớt một bấm |
| Lớp tôi dạy / Tất cả · chi nhánh · Lọc (375) | có | như cũ | GIỮ |
| Bấm số "Đã chấm" / "Quá hạn" (0 không bấm) | có | như cũ | GIỮ |
| Mở / thu nhóm, mở / thu hàng lớp | có | như cũ (hàng Quá hạn nay có mũi tên như hàng lớp) | GIỮ |
| Nhập điểm (hàng Quá hạn) → lưới tại chỗ; "Thu" | có | như cũ | GIỮ |
| Mở tất cả lớp / Thu gọn tất cả (QL) | chữ link | nút | GIỮ, đổi dáng |
| Lịch thi thật › | hàng tuần | 1440 hàng tuần; 375 trong ⋯ | GIỮ |
| Xuất Excel… | đầu trang | 1440 đầu trang; 375 trong ⋯ | GIỮ |
| Gõ điểm · Lưu · bài tiếp › · Vắng · ⋯ · Lớp tiếp › · hỏi trước khi thu khi còn ô chưa lưu | có | như cũ | GIỮ (lưới không đổi) |
| Chọn GV chấm S | nút mở panel chọn | ô chọn có tìm tại chỗ (lưu ngay, lỗi thì trả lựa chọn cũ — như cũ) | GIỮ, bớt một bước |
| MT cũ chưa nhập › | có | như cũ | GIỮ |
| Mã lớp → hồ sơ lớp · tên em / MTn › | có | như cũ | GIỮ |
| Nhập điểm lớp › (trang lượt MT, lưới trong panel việc) | qua `/nhap-diem/…` chuyển hướng | thẳng `/test/lich?classId&periodId&kn` | GIỮ đích, bỏ một lần chuyển hướng |
| Bỏ lọc lớp ✕ | "Đang lọc: lớp X ✕" | "Lớp: X ✕" | GIỮ |
| Thử lại khi lỗi | khung lỗi chung | câu chuẩn trong thẻ + Thử lại | GIỮ |
| Rê chuột hàng xem đợt / môn / hạn / chờ dời | `title` | ghi thẳng trên hàng | BỎ `title` — thông tin nay luôn thấy |

Không thao tác nào bị bỏ.

## Turso (đo `tocDo.run`, dữ liệu demo ×3, trước → sau)
| Vai · đường | Câu | Dòng |
|---|---|---|
| GVCN / GVBM / GVCN lớp thường · `/cham/lich-test` (mọi biến thể) | 18 → 18 · 19 → 19 | không đổi |
| QL · `/cham/lich-test` (+ `phamVi=tat-ca`) | 18 → 20 | 1 375 → 1 395 |
| QT · `/cham/lich-test` (+ `phamVi=tat-ca`) | 21 → 23 | 2 378 → 2 405 |
| mọi vai · `?classId=` · `/qua-han` | không đổi | không đổi |

+2 câu chỉ khi người xem là QL / QT (cột "Còn chờ: GV (môn)" cần phân công đang hiệu lực của lớp chưa nạp ở khối Quá hạn; nhớ theo request). Ước ~20–30 dòng / lần mở QL → vài nghìn dòng / ngày. Trong trần `TRAN` hiện có (QL 32 câu); `tocDo.run` 74 kiểm tra đạt.

## Đo ✕ / ⋯ / chữ cắt (Playwright, khung chữ so khung nút)
- Chip "Lớp: X ✕" 138×32 (375: 138×44): dy −0,8 px.
- ⋯ đầu trang 375: 44×44, dx 0,0 · dy −0,5 px.
- Chip "✓ Đã chấm": ✓ là `::before` trong chip (theo #1695), căn giữa flex.
- Chữ "còn chờ" dài: xuống dòng, quá 3 người "+k", `title` đủ tên — 0 chữ bị cắt "…"; không hộp nào đè cột (cột cố định `COT_LICH_TEST`, "Còn chờ" giãn).

## Rà trước PR
- impeccable `audit`: detector 0 phát hiện; tự rà 18/20 (A11y 3 — mã lớp 375 là link chữ < 44 px như trước · Hiệu năng 4 · Responsive 3 · Theming 4 · Integrity 4).
- `web-design-guidelines`: sửa `min-w-0` cho chữ cắt trong flex; còn lại đạt.
- `/ponytail-review`: không có gì cắt (các thành phần nhỏ trong `HangLop` dùng ở cả hàng lớp và hàng Quá hạn).
