# GD-20c LUOI-KET-QUA-PA — khớp / khác mockup ⑫ (C1–C4, E3)

Mockup: `thiet-ke/v21/gv-viet-it.html` khung C1–C4, E3 (chủ SP duyệt lời 50). Plan: `docs/superpowers/specs/2026-11-13-overhaul-v6/14-plan-giao-dien-dot-4.md` dòng GD-20c.
Ảnh cặp `cap-*.png` (trái mockup │ phải web, câu "đổi gì" ở trên). Web chụp bằng Playwright (Edge), phông Be Vietnam Pro đã nạp, ngày demo **22/09/2026**, tài khoản demo **GVCN 7 Trần Ngọc Hà** (MB FT 101).
Seed không có lớp nào ≥ 3 PA cùng kỳ của cùng GV ở ngày demo → trong DB demo CỤC BỘ (bỏ qua git) dời hạn 2 PA (id 45, 46) về 22/09 để lưới có 4 dòng (2 ghi được, 1 Học Tutor theo buổi, 1 Kết quả cuối).

## 1. Bảng truy vết — khung → thành phần → ảnh

| Khung | Thành phần | Mockup | Web | Ảnh | KHỚP / KHÁC / GIỮ / BỎ |
|---|---|---|---|---|---|
| C1 | Dòng gộp "Lớp · Ghi kết quả PA" + thẻ "n em" + "Kỳ W… " + nút "Ghi kết quả" | có | có (`DanhSachViec` `luoiKq`) | cap-c1 | KHỚP |
| C1 | Gộp theo lớp + **cùng kỳ** (khoá `gop:ghi_ket_qua_pa:{lớp}:u{người}:d{hạn kỳ}`), 1 PA → dòng lẻ | có | có (`gopViec.khoaGopCua`) | cap-c1 | KHỚP |
| C1 | Khay "n em ▾" | bỏ | bỏ (bấm dòng mở lưới, `moCaDong`) | cap-c1 | KHỚP (thay) |
| C2 | Đầu panel "Việc · Case học thuật" · "Ghi kết quả PA · {lớp}" + chip hạn · "Kỳ … · n PA · m em" | có (+ "hạn thứ Ba 13/10") | có, KHÔNG có "hạn thứ Ba …" | cap-c2 | KHÁC: chip hạn đã nói hạn; V8 "hạn = ngày thật, không thứ" |
| C2 | Dòng đếm "n đã lưu · n sẵn lưu · n chưa xong" | có | có | cap-c2 | KHỚP |
| C2 | Bảng 3 cột (Học viên · PA │ Tiến triển * · Nhận xét * │ Trạng thái), cột 186 / 1fr / 112 | có | 186 / 1fr / **124** | cap-c2 | KHÁC nhỏ: 124 px để "Lưu bản của tôi" không tràn |
| C2 | Em (link hồ sơ) · **kỹ năng** · PA · "MT2 L 5.5 · kỳ vọng 6.5" | có | có (MT từ mốc Case như panel; Case không có mốc MT thì không dòng MT) | cap-c2 | KHỚP |
| C2 | 5 chip Tiến triển, ký hiệu ✓ ↗ – ↓ ? TRONG chip, chọn = viền nhấn | có | có (đo: ký hiệu nằm trong viền, cao 30) | zoom-chip-1440 | KHỚP |
| C2 | Ô Nhận xét một dòng + gợi ý; đang gõ thiếu "Nhận xét ≥ 8 ký tự · 7/8" | có | có (+ "Tối đa 200 ký tự" khi quá dài) | cap-c2 | KHỚP |
| C2 | Trạng thái: Chưa ghi · Thiếu nhận xét · Sẵn lưu · Nháp · ⚠ Chưa lưu được · ✓ Đã lưu (xanh) | có | có, lỗi = "⚠ Không lưu được" (luật S3 một nghĩa một chữ) + "Thiếu tiến triển" (chưa chọn chip), "Đang lưu…" | cap-c2, cap-c2-loi | KHỚP |
| C2 | "Mở đầy đủ" / "Sửa" không viền (viền khi rê / focus); dòng bắt buộc mở đầy đủ có viền | có | có | cap-c2 | KHỚP |
| C2 | Dòng phức tạp: một câu "cần gì" trong khung viền đứt + "Mở đầy đủ" | Kết quả cuối · Mini Test | Kết quả cuối (Mini Test / kết luận PA) · Học theo buổi (Tutor, PA đếm buổi) — theo `ghiNhanh` máy chủ | cap-c2 | KHỚP |
| C2 | Nháp có quyết định "Điều chỉnh" ("nháp lưu 10:12 · Sửa PA này") | có | **không có** — nháp máy chủ chỉ giữ Tiến triển + Nhận xét (NHAP-KQ-PA), quyết định không lưu nháp | — | BỎ (dữ liệu không có; [XM-L1]) |
| C2 | "nháp lưu HH:MM" dưới trạng thái khi dòng đang là nháp máy chủ | (trong câu Điều chỉnh) | có | — | KHỚP |
| C2 | Thứ tự lỗi → chưa xong → đã lưu (gập một dòng + "Sửa"); không nhảy dòng khi đang gõ | có | có (xếp lại chỉ sau mỗi lần lưu) | cap-c2-loi | KHỚP |
| C2 | Dòng quy chế "Lưu = Giữ nguyên PA, kỳ sau hạn {ngày} · đổi quyết định: Mở đầy đủ" + ⓘ | có | có (`quyCheLuoiKetQua`; hạn kỳ sau = `hanKe` máy chủ) | cap-c2 | KHỚP |
| C2/C3 | Chân BA nút: Đóng · Lưu nháp · nút chính ("Lưu n dòng" / "Lưu · việc tiếp ›" / hết: "✓ Đã lưu" + "Việc tiếp ›") | có | có | cap-c2, cap-c3 | KHỚP |
| C3 | Chân "Đang lưu n dòng…" (nút tắt) · "✓ Đã lưu n · m dòng chưa xong ↑" · "✓ Đã lưu n · ⚠ n dòng không lưu được ↑" | có | có | cap-c3, c3-da-luu-2 | KHỚP |
| C3 | Lỗi một dòng → nút chính "Thử lại n dòng" | có | có cho lỗi mạng / máy chủ; **xung đột nháp** không thử lại hàng loạt — dòng đó có "Lưu bản của tôi" / "Dùng bản mới" (như panel, AUDIT-1454) | cap-c2-loi | KHÁC có lý do (chống đè nháp người khác) |
| C3 | "✓ Đã lưu · Hoàn tác" khi lưu hết | có link Hoàn tác | **không Hoàn tác** | — | BỎ — chủ SP 13/11: Kết quả PA không Hoàn tác, sửa bằng "Sửa kết quả" ở thẻ PA (dòng đã lưu có "Sửa") |
| C3 | Đang tải (bộ xương) · lỗi tải "⚠ Không tải được lưới · Thử lại" | có | có (`Skeleton`, `ErrorState`) | c3-loi-tai-1440-toi | KHỚP |
| C4 | "Mở đầy đủ" → panel thay chỗ lưới, "‹ Lưới {lớp} · n PA", nút gộp "… · về lưới" | form K4c gọn | **panel Case đang có** (`NganCase` mở sẵn form Ghi kết quả của PA đó), rộng 720, "‹ Lưới MB FT 101 · 4 PA", "Lưu · về lưới"; chữ đang gõ ở lưới giữ (lưới vẫn gắn, ẩn) | cap-c4, c4-ve-luoi | KHÁC có lý do: plan "Mở đầy đủ = panel đang có", không viết form mới |
| E3 | 375 sáng: thẻ (tên + trạng thái một hàng, chip xuống dòng, ô, nút), chân hai nút, Đóng = ✕ | có | có (+ "Mở đầy đủ" ở dòng thường — giữ lối Điều chỉnh) | cap-e3 | KHỚP |
| E3 | Dòng quy chế 375 | xuống dòng | cắt "…" + ⓘ (thành phần `DongQuyChe` chung) | cap-e3 | GIỮ thành phần chung |
| — | **[XM-G1]** Công việc ≥ 1024: khi lưới mở, danh sách trái ẩn, lưới rộng tối đa 1040 (mockup `.pn-rong` 1040); ✕ / Đóng về danh sách | — | có (`HoTroHocVienTab` `luoiRong`) | cap-c2 | MỚI — cột panel ~740 px làm chip xuống 2–3 hàng (dày hơn mockup, lời 47) |

Ước KHỚP: 24 dòng — 18 KHỚP, 4 KHÁC có lý do, 2 BỎ có lý do (dữ liệu / luật chủ SP) → hình ảnh các khung C1, C2, C3, E3 ≥ 90 % (C4 theo plan là panel đang có).

## 2. Bảng thao tác TRƯỚC → SAU

| Thao tác | TRƯỚC | SAU | Ghi chú |
|---|---|---|---|
| Ghi kết quả PA nhiều em cùng lớp, cùng kỳ | "n em ▾" → mở từng em, mỗi em một panel | bấm dòng → một lưới, gõ liền, "Lưu n dòng" | MỚI |
| Ghi kết quả PA một em (dòng lẻ, khác kỳ) | panel Case | như cũ | GIỮ |
| Quyết định Điều chỉnh / Thay PA / Xin hỗ trợ QL / Đề xuất PA khác / Kết thúc PA | panel | lưới: "Mở đầy đủ" → panel đó | GIỮ |
| Kết quả cuối · Mini Test · PA Tutor theo buổi · Số buổi · Người dạy · Ghi ngày · Đổi · Hoàn thành Case | panel | lưới: "Mở đầy đủ" (nút viền) | GIỮ |
| Lưu nháp | panel từng em | lưới "Lưu nháp" (các dòng đã sửa) + panel như cũ | GIỮ + MỚI |
| Xung đột nháp ("Dùng bản mới" / "Lưu bản của tôi") | panel | ngay tại dòng lưới, hoặc panel | GIỮ |
| Thử lại khi lỗi | chân panel | tại dòng + nút chính "Thử lại n dòng" | GIỮ |
| Sửa kết quả đã lưu | thẻ PA › Sửa kết quả | dòng đã lưu "Sửa" → panel Case, thẻ PA | GIỮ |
| Việc tiếp › | chân panel | "Lưu · việc tiếp ›" khi đủ hết; lưu hết → "Việc tiếp ›" | GIỮ |
| Xem hồ sơ em | link tên em trong khay | link tên em ở dòng lưới | GIỮ |
| Xem Case | "Xem Case" ở panel việc | "Mở đầy đủ" / "Sửa" mở panel Case | GIỮ |

Không mất thao tác nào.

## 3. [XM] cho PTA Plan

- **[XM-G1]** Danh sách Công việc ẩn khi lưới mở (≥ 1024) để lưới rộng như mockup. Không muốn ẩn → lưới trong cột ~740 px, chip 2 hàng.
- **[XM-L1]** Mockup có dòng "nháp Điều chỉnh"; nháp máy chủ không lưu quyết định → không có trạng thái đó. Muốn có → PR máy chủ riêng (thêm `decision` vào nháp). Chép vào Việc để sau.
- **[XM-L2]** C4 dùng panel Case đang có (đủ Case + PA), không phải form K4c gọn của mockup — theo plan "Mở đầy đủ = panel đang có".

## 4. Soi ✕ / chip / chữ (Playwright, `so.json`)

- ✕ đầu panel: 1440 nút 36×36, lệch tâm ngang −0,01 px · dọc −0,5 px; 375 nút 44×44, ngang −0,01 · dọc −0,5 → ≤ 1 px. `zoom-x-1440.png`.
- Chip chọn: ký hiệu ✓ ↗ … nằm TRONG viền (`trongVien: true`), cao 30. `zoom-chip-1440.png`.
- Chữ bị cắt trong panel: 0 · chữ < 12 px: 0 · 375: tràn ngang 0, vùng bấm < 44 px: 0. Không có "⋯" ở màn này.

## 5. Turso

- Mở lưới: `GET /interventions/luoi-ket-qua?ids=…` — **4 câu cố định** (1 câu PA + nháp + MT gần nhất, 1 câu phạm vi em, 2 câu quyền), 1 PA = 3 PA (phép kiểm `prLuoiKq`, trần `TRAN_GHI_LO.luoiKetQua = 6`; đường đo `DUONG_DO` "Công việc · lưới Kết quả PA"). Dòng ≈ số PA của dòng gộp (≤ 100, thường 2–7).
- Mở Công việc: không thêm câu (gộp theo kỳ chỉ đổi khoá trên dữ liệu đã nạp).
- Lưu: mỗi dòng một `POST /interventions/:id/result` như panel (không thêm); tải lại `/my-work` MỘT lần sau cả đợt lưu (trước: sau mỗi em).
- Ước / ngày: một GV mở lưới ~2 lần / 2 tuần × ~60 GV → < 1 000 dòng / ngày — không đáng kể.

## 6. Skill

- impeccable `audit` (detect): 0 anti-pattern, 1 gợi ý (cỡ chữ 14 px ngoài thang) → đã sửa `text-sm`. Điểm: A11y 3 · Hiệu năng 4 · Responsive 4 · Theme 4 · Toàn vẹn 4 = 19/20.
- `web-design-guidelines`: ô Nhận xét thêm `name` + `autocomplete="off"`; ngoặc kép cong ở câu xung đột; trạng thái chân `role="status"`, lỗi dòng `role="alert"`. Còn lại đạt.
- `/ponytail-review`: không cắt thêm (helper `lucNhap` / `xungDotCua` nhỏ trùng ý `CapNhatTuan.tsx` — không xuất từ đó để khỏi đụng tệp GD-20d đang sửa). Lean.
- `layout` / `polish` / `adapt` / `harden`: cột, khoảng cách, cỡ chữ theo `gv-viet-it.css .lkq`; 375 thẻ; lỗi từng dòng, chữ giữ (nháp trình duyệt `useNhap` — tải lại trang vẫn còn), xung đột nháp, kỳ đã chốt (409 daChot, không Thử lại).

## 7. Vòng 2 (PTA rà #1738, 15/11) — [XM] đã chốt, sửa 4 chỗ

PTA chốt: G1 (ẩn danh sách khi mở lưới; Đóng về đúng chỗ cuộn cũ — nhớ / trả vị trí cuộn như điện thoại), L1 để sau, L2 panel Case, bỏ Hoàn tác, "Không lưu được".
1. Chưa dòng nào sẵn: nút chính "Lưu" mờ + `title` nói còn thiếu gì ("Chưa có dòng đủ: chọn Tiến triển và Nhận xét ≥ 8 ký tự" / "Các dòng còn lại cần Mở đầy đủ") — thay "Lưu 0 dòng".
2. `DongQuyChe` (thành phần chung): 375 xuống dòng đủ chữ, không "…" (câu ≤ 90 ký tự → ≤ 2 dòng); ≥ 640 một dòng như cũ; ⓘ chỉ khi có chi tiết (bỏ ⓘ nhắc lại câu). Soi 375: lưới (2 dòng, không cắt), Ghi kết quả PA một em (2 dòng), việc Vận hành của QL (2 dòng) — `cap-e3`, `cap-qc-ket-qua-mot-pa`, `cap-qc-van-hanh`, số đo `so-375-vong2.json`.
3. Ô Nhận xét → `textarea` tự giãn (`field-sizing: content`); 375 ô trống cao đủ hai dòng nên chữ gợi ý không bị cắt.
4. PA máy chủ không trả (ngoài quyền xem) không tính vào đủ / xong → "Lưu · việc tiếp ›" đi được; dòng đếm thêm "· n PA ngoài quyền xem".
`npm run check` lại: 5783 đạt, tốc độ đạt, css / esbuild / hook sạch.
