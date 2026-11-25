# Panel Nhập điểm lớp (Công việc) — 3 lỗi chủ SP báo 25/11

Ca thử: Quản trị (làm thay) · Công việc › Của GV › Chấm điểm › **HD FT 306 · MT2 · W1 SEP · L R W1 W2** (Mạc Thùy Linh). Dữ liệu seed, ngày demo 14/09/2026.
Ảnh cặp `cap-<bề rộng>-<ca>.png` = TRƯỚC (origin/main 6d99d2fe1) | SAU. 1440 · 1280 tối, 375 sáng; khung nhìn cao 900. Phông Be Vietnam Pro đã nạp (`document.fonts.check`).

| Ca | Tệp |
|---|---|
| Panel mở (cột của việc) | `cap-*-mo.png` |
| Bấm "Cả lớp" (đủ cột) | `cap-*-ca-lop.png` |
| Cả lớp, cuộn ngang tới Kỳ vọng · Overall · Kết quả (ảnh 3 của chủ SP) | `cap-*-cuon.png` |
| Hộp nhập Reading mở, đã gõ 16 (dưới kỳ vọng → Nhóm nguyên nhân) | `cap-*-hop.png` |

## 3. Danh sách việc bên trái cuộn không ngừng — LỖI, đã sửa ở gốc

- **Tái hiện** (1440 × 760, mở lại ô đã có điểm → hộp có Lịch sử + Nhóm nguyên nhân cao hơn chỗ trống): `scrollTop` của `<main id="noi-dung">`
  (khung cuộn của danh sách trái) nhảy 618 → 291 → 446 → 600 → 274 → 428 … ~80 lần/giây.
- **Nguyên nhân gốc:** `KhungHop.dat()` (`fasttrack/HopNhapDiemHop.tsx`) khi hộp không đủ chỗ trên / dưới ô thì leo lên tìm khung cuộn chứa ô rồi cuộn nó.
  Ô nằm trong panel `position: fixed` → vòng leo vượt qua panel, chọn `<main>`. Cuộn `<main>` không dời ô, hộp vẫn không đủ chỗ; `dat()` nghe
  `scroll` (capture) nên mỗi lần cuộn lại gọi `dat()` → cuộn xuống tới đáy rồi cuộn lên, lặp mãi.
- **Sửa:** hàm `khungCuonCuaO(o)` — khung cuộn gần nhất mà cuộn nó THẬT dời ô; gặp phần tử `position: fixed` thì dừng (trả null → hộp thu vừa chỗ,
  tự cuộn bên trong như luật cũ). Trang không có panel fixed (Lịch Test, hồ sơ lớp › Nhập điểm) đi đúng đường cũ.
- **Sau:** cùng thao tác ở 1440 × 760 và 1280 × 760: `<main>` 0 lần cuộn, giữ nguyên vị trí; gõ điểm cũng không cuộn.
- **Phép kiểm:** `scripts/kiem-hop-neo.mjs` (trong `npm run check`) đỏ nếu `khungCuonCuaO` không dừng ở `fixed` hoặc `dat()` không dùng nó — đã thử gỡ sửa → đỏ.
- Các nghi vấn khác (`scrollIntoView` của lưới / hộp, `useBanPhim`, danh sách tải lại sau lưu): chỉ sửa một chỗ trên mà `<main>` còn 0 lần cuộn
  khi mở hộp, gõ, lưu → không phải nguồn gây cuộn.

## 2. Ô điểm và cột Kết quả

- **Trước:** ô `min-w-24` (96) trong cột chỉ còn ~80 → ô tràn, dính nhau, đè lên cột Kết quả; cột Kết quả bị chia đều (97) nên "Chưa có điểm" (95 + đệm 22) tràn trái, bị ô W2 che còn "ưa có điểm".
- **Sau (chủ SP 26/11, ảnh mẫu = mockup v24 P2):**
  - Ô trong panel **68 × 44 hai tầng**: band 14 / 700 trên (✓ / ✗ tô màu khi lưới có cột Kỳ vọng), "16 câu" 12 dưới (vắng / "→ W4 SEP" thay chỗ này nếu có).
    Dạng ngang "6.5 · 29/40" (#2173) chỉ còn ở Lịch Test tuần — nhánh ngoài panel của `ODiemMt` không đổi.
  - Ô co theo cột (`max-w-full`), đệm ngang ô điểm trong panel 6 → không bao giờ tràn sang ô kề.
  - Cột Kết quả giữ 124 px, căn phải (đủ "Chưa đủ điểm" một dòng, cả bản EN); các cột ô điểm chia đều phần còn lại (luật cột v24: tên 2 phần, cột số bằng nhau).
  - Đo 1440 / 1280 (panel 720): cột của việc 194 · 90 × 4 · 124; Cả lớp cuộn ngang trong lưới, L · R · W1 · W2 · S · Kỳ vọng · Overall bằng nhau.

## 1. Màu hai khu vực

- **Trước:** cột Kỳ vọng / Overall kiểu `noi-bat` (nền `--accent-soft`, sáng hơn hẳn); cột tên dính trái có bóng đổ 6 px tối khi cuộn.
- **Sau:** trong panel việc Kỳ vọng / Overall là cột thường (như Lịch Test tuần đã làm) — một nền `--surface`; cột tên dính chỉ một viền mảnh
  `--line-strong` khi đang cuộn (mockup v24 `.lc`). Mép phải mờ khi còn cột (đã có) giữ.

## Ngoài 3 ý — xấu thì sửa luôn

- Chân hộp nhập: câu nhắc "Nên có nhận xét — dùng làm mô tả vấn đề trên Case" bị bóp thành cột hẹp 6 dòng giữa các nút (1440 / 1280).
  Sau: một dòng riêng phía trên hàng nút ở mọi cỡ (375 đã vậy), nút chính vẫn sát phải.

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Bấm ô → hộp nhập (Lịch sử, Số câu, Nhận xét, Nhóm nguyên nhân, Vắng, ⋯ / Lưu · đóng, Lưu · bài tiếp) | có | giữ |
| Cả lớp · Mở lưới đầy đủ › · GV chấm S · Việc tiếp › | có | giữ |
| Esc / bấm ra ngoài khi đã gõ → Bỏ · Gõ tiếp | có | giữ |
| Hộp không đủ chỗ → cuộn khung chứa ô / thu hộp | cuộn nhầm `<main>` mãi | cuộn khung trong panel nếu có, không thì thu hộp |

Không thêm request. Không đổi máy chủ.

## Nơi khác dùng chung đã soát

- `KhungHop` (hộp điểm MT, hộp nhận xét lớp thường): đổi chỉ có tác dụng khi ô nằm trong phần tử `fixed` (panel việc). Lịch Test, hồ sơ lớp › Nhập điểm, Điểm theo lớp: như cũ.
- `ODiemMt` / `LuoiFT`: thay đổi chỉ trong nhánh `trongPanel` (`OTrongPanel` chỉ bật trong `LuoiTrongPanel`: panel Nhập điểm của việc, `PanelNhapDiemTuan`). Lưới ngoài panel không đổi.
- CSS cột Kết quả 124: chỉ `.luoi-trong-panel` trong panel `[data-pn]`, trừ lưới lớp thường gọn (Kết quả dưới tên). Panel lớp thường (MB FOU 12 Progress R) đã xem: không đổi bố cục.
