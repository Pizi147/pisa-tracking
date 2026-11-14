# GD-12a + web GD-12b — Phân tích theo mockup ⑨ (`thiet-ke/v21/phan-tich.html`, CHỈNH — không làm lại)

Plan: `docs/superpowers/specs/2026-11-13-overhaul-v6/12-plan-giao-dien-dot-3.md` dòng GD-12a, GD-12b (+ V22 cuối tệp). Ghi chú: `thiet-ke/v21/phan-tich-ghi-chu.md` (mục 2 truy vết, 3 thao tác, 6 [XM] đã quyết, 9 ghi cho PR code).
Máy chủ ô Sắp thi: #1674 (đã merge). Luật: V22 (hạn chỉ màu, không ⚠), lời 35 / 36 / 40; "Toàn bộ" chỉ ở Phân tích (giữ).

Ảnh cặp (trái mockup · phải web; seed demo 14/09, vai demo QL Nguyễn Khánh Vy = 2 · Quản trị = 1 · TVV = 27; phông Be Vietnam Pro + Inter đã nạp):
- 1440 tối QL: `cap-a1` Chi nhánh · `cap-c1` Thi thật · `cap-c5` panel Sắp thi · `cap-b1` SOS · `cap-b5` ⓘ Theo tuần · `cap-d1` Giáo viên · `cap-d5` / `cap-d6` panel Chưa làm (Chấm Test / Việc) · `cap-y1` Ý thức · `cap-y2` ⓘ Học viên cần chú ý
- 375 sáng QL: `cap-a6` · `cap-c4` · `cap-c6` · `cap-b3` · `cap-d4` · `cap-d7` · `cap-y3`
- Quản trị: `cap-a1-qt-1440-toi` · `cap-d1-qt-1440-toi` · `cap-a6-qt-375-sang` · TVV: `cap-e4-tvv-1440-toi`
- C1 / C4 / C5 / C6: seed không có kết quả thi thật trong kỳ và không em nào sắp thi → để chụp ô / panel có số, DB dev của worktree được đặt TẠM lịch thi cho 10 em SOS (7 chốt ngày, 3 tháng dự kiến) rồi trả lại như cũ. Khối kết quả thi thật hiện câu rỗng (dữ liệu seed), không phải khác bố cục.
- TRƯỚC: `thiet-ke/v21/anh/phan-tich/truoc/` (web main lúc vẽ mockup).

## 1. Truy vết khung → thành phần → ảnh

| # | Khung | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|---|
| 1 | mọi khung · thanh tab 5 mục chuẩn ⑤ H1 | `HangTab` (GD-4c, giữ) | mọi cặp | KHỚP |
| 2 | L1 · hàng lọc MỘT thứ tự ở 5 tab, ô không áp dụng mờ + viền đứt + `disabled` (lý do ở aria-label, không `title`) | `PhanTich.tsx`: Chương trình luôn đứng đầu (`ChonChuongTrinh tat`: Thi thật khoá Fast Track, Ý thức mờ cả hai) · ô Lớp mờ ở Chi nhánh / Giáo viên | a1, c1, d1, y1 | KHỚP |
| 3 | L4 / 375: ô không áp dụng ẨN (PTA chỉnh 3) | `max-sm:hidden` | a6, c4, d4, y3 | KHỚP |
| 4 | L2 · "Mọi lớp" ô chọn có tìm, nhóm Đang chạy · Đã kết thúc | `ChonLop` (GD-5, giữ) | b1 | KHỚP |
| 5 | L3 · Tìm GV ô chọn có tìm: gõ lọc bảng theo chữ, chọn một GV → còn một dòng, ✕ bỏ | `ChonLoc` + `onGo` (thêm prop nhỏ cho `ChonNguoi` / `ChonLoc`) | d1 | KHỚP |
| 6 | L1 · SOS: ⋯ trước, Xuất Excel cuối | `TongHopTestSos` | b1 | KHỚP |
| 7 | A1 · "Đạt MT · HV", ô Thi thật ghi kỳ ("W2 + W3 SEP/2026") | `BaoCao.tsx` (`nhanKhoang`) | a1 | KHỚP |
| 8 | A1 · số to, bảng Theo lớp, Tiến bộ theo kỹ năng, In, Xuất | giữ | a1 | KHỚP |
| 9 | C1 · ô thứ ba "Sắp thi · tới hết T{n} · còn SOS" — số em + chip SOS 1 · 2 · 3 (bấm được) + "hiện tại" + ⓘ | `SapThiSos.tsx` `OSapThiSos` (số từ `sapThi` đã nạp) | c1, c4 | KHỚP |
| 10 | E2 · Sắp thi = 0 không bấm; có cả khi kỳ rỗng | `KetQuaThi` nhánh rỗng vẫn vẽ ô | (chụp seed gốc) | KHỚP |
| 11 | C5 / C6 · panel em: loại · tiêu đề · ngữ · chip chia SOS + "đã chốt ngày n · dự kiến n" · bảng Học viên (link) · Lớp (link) · Lịch thi ("thi 18/09" + mã tuần ↔ "dự kiến T10 · chưa chốt ngày", dự kiến cuối) · SOS · MT mới nhất · TVV; 375 thẻ; chân "Đóng" | `PanelSapThi` (`/phan-tich/thi-that/o?o=sap-thi[:mức]`, chỉ khi bấm) | c5, c6 | KHỚP |
| 12 | B1 · dải 6 ô, bảng Theo tuần, khối PA | giữ | b1 | KHỚP |
| 13 | B5 · ⓘ "Theo tuần" mở dải ngay dưới đầu thẻ (đẩy bảng, không che), ✕ / Esc / ⓘ lần nữa đóng; mỗi cột một dòng; bỏ `title` ở tiêu đề cột / ô | `DauThe` (dải `.hop-i`) · `cachTinh` thêm HV - Case, Chờ duyệt · n, "—" | b5 | KHỚP |
| 14 | B3 · 375 ⓘ mở hộp hết bề ngang | `DauThe` thêm vào bản thẻ 375 | b3 | KHỚP |
| 15 | B6 · PA: bỏ `title` "mỗi vấn đề ≤ 2 PA…", chip "Nên dùng" — câu vào ⓘ | `HieuQuaPa` | b5 | KHỚP |
| 16 | D1 · ô Chưa làm: hai số đỏ bấm được (bài · việc) + "+ n bài S chéo chung" bấm được | `PhanTichGiaoVien` (`soChuaLam`, `scO`) | d1 | KHỚP (V22: không ⚠) |
| 17 | D5 / D6 / D7 · panel Chưa làm: tab con Chấm Test · Việc (badge mờ = số ô), nhóm theo GV (tên link · số), dòng việc chuẩn CHỈ ĐỌC ("Lớp · việc" · thẻ phụ em / tuần · viên quá hạn), nhóm cuối "S chéo chung · không vào tỉ lệ", chân "Đóng" | `PanelChuaLam.tsx` (`/phan-tich/giao-vien/danh-sach`, chỉ khi bấm; máy chủ thêm `gvId`) | d5, d6, d7 | KHỚP |
| 18 | D1 · bỏ `title` "Bấm ▸ xem từng chi nhánh" (×2) | `PhanTichGiaoVien` | d1-qt | KHỚP |
| 19 | D1 · bảng GV (hộp, % đúng hạn, S chéo chung / Chưa phân công cuối), panel 3 tab, Thi thật theo GV ›, Xuất | giữ | d1 | KHỚP |
| 20 | D4 · thẻ 375 "Đạt kỳ vọng Test · lượt" | giữ (đã có) | d4 | KHỚP |
| 21 | Y1 / Y2 · bỏ `hint` 6 cột → ⓘ "Học viên cần chú ý" (cách chọn + từng cột + thang danh sách viết tắt VIẾT HOA) và "Lớp nhiều vi phạm" (xếp · HV có vi phạm · ± kỳ trước) | `YThucPhoiHop` | y1, y2 | KHỚP |
| 22 | Y1 · tên bậc VIẾT HOA ("REPORT 1 › REPORT 2", "WL 2 › WL 3") | `bacNgan` (đã có) | y1 | KHỚP |
| 23 | E1 / E5 · lỗi tải một dải (⚠ · câu · Thử lại), hàng lọc vẫn dùng | `ErrorState` (U1, đã là dải) | — | KHỚP |
| 24 | E3 · panel đang tải | `Skeleton` trong panel | — | KHỚP |
| 25 | E4 · TVV: không tab Giáo viên, hàng lọc giữ chỗ | giữ | e4 | KHỚP |
| 26 | ✕ dải ⓘ (mockup `.hop-i`): 32 × 32, cách mép 7 / 7 | đo web 7 / 7, 32 × 32 (**0 px**) | b5 | KHỚP |
| 27 | ✕ panel (C5, D5): mockup cách mép phải 21 · trên 11 (gồm viền 1 px) | `KhungPanel` (chung, không sửa) 20 · 10, 36 × 36 — **≤ 1 px** | c5, d5 | KHỚP |
| 28 | Hướng dẫn "?" (QL): hàng lọc cố định, Chưa làm, Sắp thi, ⓘ | `huongDan/ql.ts` + `en/gd12.ts` | — | KHỚP |

**KHỚP 28 / 28 (100 %).**

## 2. KHÁC (có lý do)

1. **V22**: mockup còn ⚠ trước số / chip quá hạn — web chỉ màu.
2. **Đầu panel**: mockup đặt ⓘ cạnh ✕ ở đầu panel; web để ⓘ cạnh dòng đếm "15 bài · 3 GV" trong thân (khung `KhungPanel` chung không có chỗ ⓘ đầu — không sửa thành phần chung cho một chỗ). Nhãn loại theo khung chung ("Số · Giáo viên", chữ thường).
3. **Dòng panel Chưa làm**: mỗi dòng một bài (em · môn) theo nguồn `danh-sach` (mockup gom "2 bài" một dòng) — cùng nguồn Excel, không thêm đường.
4. **C1 bảng "Theo lớp"** trong hình mockup không phải R9.x (nền V2) — web chưa có, không thêm trong PR này (ghi chú ⑨: "khung SAU = web + R9.x").
5. **SOS 375**: Xuất Excel vẫn ở ⋯ như web (mockup vẽ nút ⬇ riêng) — giữ thao tác cũ 375.

Không có [XM] mới.

## 3. Thao tác TRƯỚC → SAU

| Tab | Trước | Sau |
|---|---|---|
| Chung | Đổi tab giữ khoảng, link `?goc=` cũ, toast không quyền | GIỮ |
| Chung | Chương trình · Toàn bộ / Chọn khoảng · tuần → tuần | GIỮ; ô không áp dụng vẫn đứng chỗ, mờ, không bấm (375 ẩn) |
| Chung | Chọn lớp (ô có tìm) | GIỮ |
| Chung | Rê chuột xem giải thích | **Bấm ⓘ** đầu thẻ → dải giải thích dưới đầu thẻ (đọc được trên điện thoại); ⓘ ở ô số giữ hộp nổi |
| Chi nhánh | In · Xuất · chuyển trang · bấm ô Thi thật | GIỮ |
| Thi thật | Công tắc · đoạn thanh · bảng · phân trang · Xuất | GIỮ |
| Thi thật | — | **Mới:** bấm số / chip SOS n của "Sắp thi · còn SOS" → panel em; tên em → hồ sơ HV, mã lớp → hồ sơ lớp |
| SOS | Xếp theo · mở dòng · ⋯ · Xuất · bấm số | GIỮ (⋯ trước Xuất) |
| Giáo viên | Tìm GV (gõ lọc) · số → panel 3 tab · tên → hồ sơ GV · phân trang · Xuất · Thi thật theo GV › | GIỮ; Tìm GV thêm chọn đúng một GV |
| Giáo viên | Ô Chưa làm chỉ đọc | **Mới:** bấm số bài / việc → panel Chưa làm; "+ n bài S chéo chung" → panel S chéo chung |
| Ý thức | Mở nhóm · số → panel · tên → hồ sơ (tab Ý thức) · mã lớp · Xuất | GIỮ |

Không mất thao tác.

## 4. Đo

- **Turso khi mở tab**: không đổi — không sửa chỗ gọi API nào; ô Sắp thi dùng `sapThi` đã có trong `GET /phan-tich/thi-that` (#1674); Tìm GV dùng hàng đã nạp. GET mỗi tab (QL Monbay): Chi nhánh 2 · Thi thật 3 · SOS 5 · Giáo viên 2 · Ý thức 4 (kể cả `/ref/branches`, `/ref/classes` như trước).
- **Chỉ khi bấm**: panel Chưa làm = `GET /phan-tich/giao-vien/danh-sach` (đường Excel đang có, có trần ở `tocDoDuong.ts`; thêm cột `gvId` không thêm câu) · panel Sắp thi = `o=sap-thi` (#1674, có trần).
- ✕: dải ⓘ 0 px; panel ≤ 1 px (đo tự động, mục 1 dòng 26–27).
- impeccable `detect`: chỉ 2 ghi chú cỡ 28 px (số to thẻ chỉ số — mẫu đã có của `DaiChiSo`).
