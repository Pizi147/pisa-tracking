# 6b-3 PILOT-VIEC — truy vết + KHỚP / KHÁC + thao tác TRƯỚC → SAU (mockup `thiet-ke/v7/panel-pilot.html` khu ② "Panel việc")

Ảnh cặp mockup | web (seed nguyên, ngày demo 14/09/2026, vai GV Trần Ngọc Hà — userId 7; web chụp SAU khi bấm thật bằng Playwright):
`cap-a-ghi-ket-qua-1440-toi.png` (②a) · `cap-b-dai-viec-ke-1440-toi.png` (②b: việc kế có dải) · `cap-b2-xac-nhan-pa-1440-toi.png` (②b: hai nút) ·
`cap-c-xem-case-1440-toi.png` (②c) · `cap-d-het-viec-1440-toi.png` (②d) · `cap-e-375-sang.png` (②e).
Số / tên trên web là dữ liệu seed (khác số demo của mockup) — so khung, thứ tự, tên, kiểu chữ.

## Truy vết khung → thành phần

| # | Khung mockup | Thành phần web | Kết quả |
|---|---|---|---|
| 1 | ②a Danh sách trái theo nhóm, panel việc tại chỗ bên phải | trang Công việc ba tầng (#630) — giữ | GIỮ |
| 2 | ②a Đầu panel: "VIỆC · CASE HỌC THUẬT" · tên việc 17 · chip hạn · em ↗ · lớp · lượt | `KhungPanel` + `dauViec` (có sẵn) | KHỚP |
| 3 | ②a "Xem Case" trong dòng Bối cảnh "Case …" | "Xem Case" ở cuối dòng 2 của đầu panel — CÙNG chỗ cho mọi việc Case (Ghi kết quả, Xác nhận PA, Xác nhận Case, Mô tả Case, Thêm PA) | KHÁC — [XM-1] |
| 4 | ②a Bối cảnh: PA · Kỳ trước · Case | `BoiCanh`: Case · Phương án (nội dung PA qua `ChuDich`) · Kết quả kỳ trước | KHỚP |
| 5 | ②a Form Tiến triển · Quyết định · Nhận xét | `GhiNhanh` (Tiến triển · Nhận xét, Quyết định mặc định "Giữ nguyên", "Điều chỉnh / Kết thúc…" mở form đủ) | GIỮ |
| 6 | ②a Chân "Tiếp: Xác nhận PA · Nguyễn Minh An" + Lưu kết quả · **Lưu · việc tiếp ›** | hàng nút Lưu · Lưu · việc tiếp › + dòng "Tiếp: {việc} · {em}" ngay dưới (khuôn v3: nút trong khối Cần làm) | KHỚP |
| 7 | ②b dải "✓ Đã lưu kết quả · {em · kết quả} · Hoàn tác" ở đầu thân việc kế, 10 giây | `DaiVuaLuu` qua `DauViecCongViec.dai` (Hoàn tác = `/followups/:id/hoan-tac`, mở lại việc trước, chữ trả về) | KHỚP |
| 8 | ②b Xác nhận PA: nút **Xác nhận · việc tiếp ›** (một bấm) + Xác nhận PA | `NutXacNhan` trong `XacNhanPaPanel` (và `XacNhanCasePanel`) — chỉ sang việc kế khi máy chủ nhận; lỗi ô → ở lại | KHỚP |
| 9 | ②b form giữ Nội dung, Số buổi, Bắt đầu, "Đề xuất PA khác…" | giữ nguyên (+ "Không cần theo dõi…") | KHỚP |
| 10 | ②c "Xem Case" = view kế TRONG panel việc, "‹ Ghi kết quả kỳ 2" về đúng form, chữ còn | `PanelViec` ngăn xếp `useXem`; form việc vẫn gắn (ẩn) → chữ, lựa chọn, "✓ Đã lưu" còn nguyên; ‹ = tên việc không lặp tên em | KHỚP |
| 11 | ②c chân "✎ Ghi kết quả kỳ 2 chưa lưu — chữ còn" | không vẽ dòng này: form ở dưới còn nguyên; ✕ khi còn nháp vẫn hỏi "Bỏ chữ?" | KHÁC — [XM-2] |
| 12 | ②d "✓ Đã xác nhận Case · Hoàn tác" + "Hết việc Case học thuật của bạn" + "Còn: … · n việc" + Đóng / Việc tiếp › | `HetViecNhom` (#630) + dải thay dòng "✓ Đã lưu" | KHỚP |
| 13 | ②d "Hoàn tác" sau Xác nhận Case / Xác nhận PA | dải không có Hoàn tác (máy chủ chưa có đường đảo Xác nhận PA / Case) | KHÁC — [XM-3] |
| 14 | ②e 375: panel toàn màn, "Tiếp: …" + nút chính ở chân dính | giữ khung 375 sẵn có (toàn màn, "‹ Công việc" trên panel, nút 44+ px); form xác nhận / Thêm PA: "Tiếp: …" trong chân dính trên nút | KHỚP |
| 15 | (luật V19) Back trình duyệt ở view Case = lùi một view | view Case là mục lịch sử `?panel=case`: Back về form, Forward lại Case, F5 giữ view, ✕ đóng lùi đủ số mục | KHỚP |
| — | BỎ: mở thân Case dưới Bối cảnh (▾) + thay panel bằng Ngăn Case "‹ Việc" (`PanelViec.tsx:397` cũ, nhãn lặp) | thay bằng view Case kế (#10) | BỎ |
| — | BỎ: "‹ {Case}" ở view việc đầu chuỗi trong Công việc (thay view, mất form) | thay bằng "Xem Case" (#3) | BỎ |
| — | GIỮ (mockup không vẽ): "Em này còn", chế độ theo dõi / Làm thay, "Điều chỉnh / Kết thúc…", "Đề xuất PA khác…", "Không cần theo dõi…", lưu lỗi "⚠ Không lưu được · Thử lại" (thử lại đúng nút đã bấm) | | GIỮ |

**Đếm:** 15 dòng có khung — 11 KHỚP · 3 KHÁC ([XM-1..3]) · 1 GIỮ (không tính) → 11 / 14 = **79 %** theo dòng (dưới cổng 90 %: ba KHÁC đều là chỗ chọn có lý do, chờ PTA); theo khung ②a–②e (bố cục + thao tác chính): 5 / 5.

## Thao tác TRƯỚC → SAU (bấm thật 27/10, GV demo)

| Luồng | TRƯỚC (main) | SAU (PR này) | Bấm | Đổi trang | Mất / thêm |
|---|---|---|---|---|---|
| GV làm 3 việc liền: Ghi kết quả → Xác nhận PA → Xác nhận Case | Lưu · việc tiếp › → Xác nhận PA → "✓ Đã lưu" → Việc tiếp › → Xác nhận Case | Lưu · việc tiếp › → **Xác nhận · việc tiếp ›** → Xác nhận Case | 4 → **3** | 0 → 0 | Thêm: một bấm cho Xác nhận PA / Case; dải "✓ … · Hoàn tác" của việc trước ở việc kế (Hoàn tác không mất khi đã sang việc kế) |
| Đang ghi kết quả, xem lại Case rồi về form | "Case ▾" mở thân Case dưới bối cảnh; việc của Case thay panel, về bằng "‹ Việc" | "Xem Case" → view Case trong panel việc → "‹ Kết quả PA Speaking" | 2 → 2 | 0 → 0 | Sửa nhãn lặp; chữ + lựa chọn còn nguyên (form không dựng lại) |
| Xác nhận PA / Case, xem Case giữa chừng | "‹ Case …" thay view (form mất, không về được) | "Xem Case" → ‹ về form, chữ còn | — → 2 | 0 → 0 | Thêm đường về form |
| Lỡ tay "· việc tiếp ›" ở Ghi kết quả | Hoàn tác mất khi đã sang việc kế | dải "Hoàn tác" ở việc kế → hoàn tác + mở lại việc đó, chữ trả về | — → 1 | 0 → 0 | Thêm |
| Xác nhận Case ở việc cuối nhóm | "✓ Đã lưu" (Lưu thường) → Việc tiếp › → thẻ Hết việc | Xác nhận · việc tiếp › → thẻ Hết việc có "✓ Đã xác nhận Case" | 2 → 1 | 0 → 0 | Thêm |

Không mất thao tác nào: nút "Xác nhận PA" / "Xác nhận Case" / "Lưu" thường vẫn còn (ở lại "✓ Đã lưu · Việc tiếp ›" — V12 ①), "Đề xuất PA khác…",
"Không cần theo dõi…", "Điều chỉnh / Kết thúc…", "Em này còn", Làm thay, Hoàn tác 10 giây trong panel giữ nguyên. Thêm PA (việc "Case chưa có PA") nay cũng có "Thêm PA · việc tiếp ›"
(đề xuất cần Quản lý duyệt thì không).

## [XM] — hỏi PTA Plan

- **XM-1** "Xem Case" đặt ở cuối dòng 2 đầu panel (em ↗ · lớp · lượt · Xem Case) thay vì trong dòng Bối cảnh "Case" như mockup ②a — để MỌI việc Case
  (Xác nhận PA / Case, Mô tả Case, Thêm PA, Ghi kết quả đủ) có cùng một chỗ (luật "cùng loại thao tác cùng vị trí"); Bối cảnh các form khác không có dòng Case.
- **XM-2** Không vẽ dòng chân "✎ … chưa lưu — chữ còn" ở view Case: form việc còn gắn bên dưới (không cần nháp), ✕ vẫn hỏi một lần khi còn chữ. Muốn có dòng nhắc thì thêm ở chân view Case.
- **XM-3** Hoàn tác sau **Xác nhận PA / Xác nhận Case** cần đường đảo máy chủ (hiện chỉ có Ghi kết quả `/followups/:id/hoan-tac`, Thêm PA, rút đề xuất đổi PA).
  PR này không thêm đường máy chủ: dải chỉ báo "✓ Đã xác nhận …" (sửa sau đó qua Sửa PA / Sửa Case như cũ). Đề xuất PR máy chủ nhỏ nếu chủ SP cần.

- **XM-4** View Case mở từ việc Ghi kết quả / Xác nhận PA vẫn có ô ghi nhanh / nút "Xác nhận PA" của chính PA đó (thân Case dùng chung, nháp dùng chung nên
  không mất chữ). Critique đề nghị ẩn / đổi thành ‹ — chưa làm (đụng khối Case A dùng chung của 6b-2); để 6c nếu PTA đồng ý.

## Critique (impeccable, một lần, hai agent độc lập)

- **A (rà thiết kế, Opus): 29 / 40**, một P1 — Back trình duyệt ở view Case rời trang Công việc (trái V19) → **đã sửa** (`?panel=case`, mục lịch sử).
- Đã sửa thêm sau critique: "Thêm PA · việc tiếp ›" (chuỗi việc không gãy sau dải) · "Tiếp: …" ở chân dính 375 (không bị chân che) · "· Xem Case" không tách dòng ở 375 ·
  báo "Đã hoàn tác" · focus sang lớp vừa hiện khi Xem Case / ‹.
- Chưa sửa (ghi lại): XM-4; focus về đầu việc kế sau "· việc tiếp ›" (panel dựng lại — luật CV-09 không giành focus khi trang tự mở); Bối cảnh Xác nhận PA nằm dưới form (có sẵn);
  nhãn "VIỆC · …" ở view Case; link việc đã xong mở không báo gì (có sẵn, lỗi 6 bảng kê — 6c).
- **B (bộ dò CLI + trình duyệt, Sonnet):** 0 lỗi mới trong diff (3 mục `text-[17px]` có từ trước); 1440 / 375 không tràn ngang, tương phản đạt, mọi nút có tên.
- `/code-review high`: 6 điểm — sửa 5 (view Case tự nhảy sang form Xác nhận Case; Xác nhận · việc tiếp › im lặng ngoài Công việc; focus khi StrictMode;
  "Việc tiếp ›" sau Lưu thường mất Hoàn tác; nháp Xác nhận PA còn sau Đề xuất PA khác), bỏ 1 (hai `useBanPhim` khi đổi lớp ở 375 — nháy tạm).
