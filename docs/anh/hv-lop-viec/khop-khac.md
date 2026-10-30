# HV-LOP-VIEC — khớp / khác mockup `thiet-ke/v10/panel-thong-tin.html` khung `#hvl` (D2)

Chỉnh chủ SP / PTA thắng mockup: điểm kỹ năng **✓ / ✗ trước số** (không ▼); đạt ✓ cùng màu Overall đạt (`text-kq-bang`), hụt ✗ `text-kq-duoi` 700; KCK dưới kỳ vọng trung tính.
T8: web GIỮ cột của mình (Lộ trình · MT gần nhất + 5 ô mini · Hỗ trợ · Ý thức · Lịch thi) — mockup D2 "chỉ đổi bề rộng / thứ tự cột". T9 / Q2: "+n việc" (không "›") mở panel một em tại chỗ.
Ảnh cặp (trái mockup, phải web, lớp MB FT 101 mở `?mo=3`): `hvl-ql-1440.png` (QL, vai 2) · `hvl-gvcn-1440.png` (GVCN, vai 7) · `hvl-gvcn-375.png` (375 sáng, ảnh đơn — mockup không có khung 375).
Cách chụp: `KHUNG_BASE=http://localhost:5611 node scripts/anh-cap.mjs thiet-ke/v10/panel-thong-tin.html "#hvl figure >> nth=0" "/hoc-vien?mo=3" <vai> 1440 …`.

## Bảng truy vết khung → thành phần → ảnh

| Khung | Thành phần web | Ảnh | KHỚP / KHÁC |
|---|---|---|---|
| `#hvl` nth=0 · cột Việc | `COT_HV` `viec` `rong: 300` cột CUỐI, ⋯ (`nut`) ngay trước; Học viên giãn | `hvl-ql-1440`, `hvl-gvcn-1440` | KHỚP |
| `#hvl` nth=0 · nút việc | `OViec` `.viec-n` 28 px 13 / 600 một dòng "Nhập điểm … · ⚠ quá n ngày" / "… · hạn 16/09"; quá hạn viền + nền `--bad-*`; `title` = chữ đủ | `hvl-gvcn-1440` | KHỚP |
| `#hvl` nth=0 · việc người khác | `.viec-khac` 12 px mờ "… · hạn 18/09 · Trang" (tên gọi người giữ) — vẫn bấm làm tại chỗ | `hvl-ql-1440` | KHỚP |
| `#hvl` nth=0 · > 2 việc | ≤ `SO_DONG_VIEC_MAC_DINH` (2) dòng + "+n việc" (`.viec-them`) → `PanelMotEm` | `hvl-ql-1440` | KHÁC có lý do: mockup không vẽ "+n" (câu 5 → Q2) |
| `#hvl` nth=0 · điểm L R W S | `MiniKn` 5 ô L R W1 W2 S ✓ / ✗ trước số, bỏ nền đỏ ô | `hvl-*-1440` | KHÁC có lý do: T8 giữ ô mini trong cột MT gần nhất (không cột riêng); W1 W2 riêng như web |
| `#hvl` nth=0 · Overall | `OMtGan` `ODiem chiToHut` (✓ / ✗ màu Overall) | `hvl-*-1440` | KHỚP |
| `#hvl` nth=0 · Kết quả "✓ Đạt" / Lịch thi chữ | cột Hỗ trợ (`ChipSos` "· R, W") · `ChipLichThi` | — | GIỮ (T8; Hỗ trợ không có cột điểm riêng — câu (2)) |
| `#hvl` nth=1 TRƯỚC | — | — | BỎ (khung so) |
| ô tích · Xuất Excel · lọc · hàng lớp ▾ · ⋯ thao tác em | như nay | — | GIỮ |
| CX (không Công việc) | cột Phụ huynh giãn trước ⋯, Học viên 210 — bố cục cũ | — | GIỮ |
| panel một em khi bấm "+n việc" | `PanelMotEm` khối **Việc khác** (rà #758): mọi việc của em ngoài khối Case + ngoài khối sau thi, lấy từ việc trang đã nạp (cùng số "+n", 0 câu thêm); việc làm tại chỗ được → `PanelViec` THAY nội dung panel, đầu có "‹ tên em" (`QuayLaiPanel`); việc khác → link "… ›" sang trang của việc | `panel-viec-khac-1440`, `panel-viec-khac-lam-1440` | mockup không vẽ — theo luật xử lý tại chỗ, không panel lồng panel |
| Thẻ 375 (`TheHvLop`) | ≤ 2 việc + "+n việc" như 1440; nút xuống dòng trong nút (≥ 36 px), "+n việc" ≥ 44 px | `hvl-gvcn-375` | ảnh đơn (không khung mockup) |

Tỉ lệ KHỚP: 9 / 10 dòng có thành phần khớp hoặc GIỮ theo quyết định đã duyệt (T8, T9, Q1); dòng KHÁC duy nhất về hình là ô mini thay cột L R W S (T8) → ≥ 90 %.

## Thao tác TRƯỚC → SAU

| Nơi | Trước | Sau |
|---|---|---|
| Học viên & Lớp · ô Việc | nút việc + chip hạn riêng; "Xem thêm n" / "Thu gọn" mở hết tại chỗ | nút một dòng có hạn trong nút; "+n việc" mở panel một em (liệt kê đủ việc của em, bấm làm tại chỗ) |
| Học viên & Lớp · bấm một việc | mở panel làm việc như Công việc | GIỮ |
| QL / Admin · việc người khác | nút như việc của mình, mỗi môn một dòng + "+n việc" chữ | chữ 12 px mờ + tên người giữ, vẫn bấm được; mỗi môn một dòng; "+n" = mọi việc chưa hiện |
| ô điểm mini (bảng + chi tiết dưới hàng Lịch thi) | ô dưới kỳ vọng nền đỏ + chữ đỏ; em KCK vẫn đỏ | ✗ + màu hụt 700; đạt ✓ màu Overall đạt; KCK trung tính (cả chi tiết dưới hàng — truyền `kck`) |
| ⋯ thao tác em · ô tích · Xuất Excel · lọc · hàng lớp | — | GIỮ, không đổi (⋯ dời sang ngay trước cột Việc) |

## Đo

- Chi tiết dưới hàng Lịch thi (`MiniKn` 46/46/58/58/46 = 270 px): ô 301 px ở 1280, 332 px ở 1440 — không ô nào tràn (đo `scrollWidth` từng ô, 8 hàng mở).
- Bấm thử QL (vai 2) 1440: "+2 việc" → panel Hà Gia Bình, Việc khác 4 việc Nhập điểm → bấm "Nhập điểm" mở lưới tại chỗ, "‹ Hà Gia Bình" về panel; không lỗi trang.

- `do-khung.mjs hvl` + `do-bang.mjs hvl` (1440 tối · 1280 tối · 375 sáng, QL / GVCN / GVBM / cuối trang): Không lỗi.
- `do-khung.mjs lich`: `test-lichTest-375` "Phạm Bảo Ngọc" cắt 99 < 104 px — **có sẵn trên main** (đã chạy lại trên bản main), trang Test, ngoài PR này.
