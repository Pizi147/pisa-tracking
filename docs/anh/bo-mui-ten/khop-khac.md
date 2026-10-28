# BO-MUI-TEN — bỏ ký hiệu "↗" ở link trên web (chủ SP 28/10)

Tên em / mã lớp / chip vẫn là link (rê = màu nhấn + gạch chân, focus-visible như mọi link); chỉ bỏ ký hiệu. Thay luật G6 cũ ("↗" sau tên = mở hồ sơ) trong `DESIGN.md`.
Ảnh cặp TRƯỚC (main) | SAU, DB demo cục bộ, ngày demo 14/09, vai GVCN Trần Ngọc Hà (7):
`cap-panel-so-lieu-1440-toi.png` · `cap-panel-so-lieu-375-sang.png` (Tổng quan › Case đang xử lý) · `cap-lich-test-tuan-1440-toi.png` · `cap-cong-viec-1440-toi.png` · `cap-ho-so-lop-1440-toi.png`.

## Làm gì
- CSS chung: `.ten-ho-so::after` (↗ sau mọi tên / mã lớp hồ sơ: Tổng quan, Lịch Test, hồ sơ lớp…) → `content: none`, bỏ đệm phải của `.ten-ho-so.truncate`.
  Thêm luật đè ở cuối lớp `components` của `index.css`. Khối cũ gần dòng 474 không sửa vì PR #663 (HV-LOP-GON) chèn dòng ngay cạnh: sửa ở đó sẽ xung đột. Sau khi #663 merge, PTA có thể gộp lại (xoá `::after` cũ + `.khong-mui`).
- `span ↗` sau link bỏ hẳn: Hồ sơ lớp (panel Nhập điểm lớp), tên em ở hồ sơ lớp, tên em ở Công việc (thêm gạch chân khi rê), "lớp · lượt" và "n lớp · n bài" ở đầu panel việc,
  Hồ sơ GV / tên GV / tên em ở panel GV trễ, tên em ở đầu panel v3 (`KhuonViec`), tên em ở Lịch Test tuần (`LuoiFT`), "Mở trang Hướng dẫn" (+ khoá EN), bảng mẫu V5 (dev).
- Lịch Test tuần (`HangLop`) + Quá hạn chấm (`KhoiNo`): cột chỉ có "↗" (đường DUY NHẤT tới hồ sơ lớp) → **mã lớp thành link** hồ sơ lớp, bỏ cột. Hàng lớp vẫn bấm để mở / thu (link trong hàng không mở hàng).
  375: hàng lớp nay cũng có link mã lớp (trước 375 không có đường tới hồ sơ lớp ở đây).
- Panel số (`SoLieu`): "↗" cuối dòng → link chữ **"Hồ sơ"** cùng chỗ ở cả 3 kiểu dòng (luật 6c-2 "một danh sách một kiểu mở"). Lý do: tên em ở dòng Case và dòng làm được nằm trong nút mở, không thể làm link.
  **[XM]** đã hỏi PTA Plan (phương án khác: dòng chỉ đọc dùng tên em làm link).
- Chú thích code nhắc ↗ sửa theo; phép kiểm 6c-2 (`pr6cPanelAp`) đổi chữ (vẫn đòi link hồ sơ cùng chỗ ở 3 kiểu dòng).
- `DESIGN.md`: G6, V18 (tên em 15 / 600 = link), V19 (link = đổi trang).

## Giữ / bỏ qua
- GIỮ `shared/domain/cases.ts` `partial: '↗'`: ký hiệu tiến triển một phần, không phải link.
- KHÔNG sửa vì tệp thuộc PR khác (họ tự bỏ ↗):
  - `students/StudentsPage.tsx`, `DanhSachHvLop.tsx`, `PanelMotEm.tsx` (#663 HV-LOP-GON)
  - `modules/yThuc/*` (#662 UI-Y-THUC)
  - `test/keHoach/HopKhoiPhucKetQua.tsx` + khoá EN `'Mở {mt} mới ↗'` của nó (KE-HOACH-TEST)
  - `fasttrack/MockDetailPage.tsx`, `LuotThuongPage.tsx` (#660 LUOT-SAU)
  - màn Quản trị band (#666 BAND-QUY-DOI)

## Thao tác TRƯỚC → SAU

| Trước | Sau |
|---|---|
| Tên em / mã lớp có "↗" → hồ sơ | Cùng link, cùng đích, không "↗" |
| Lịch Test: nút "↗" cuối hàng lớp / dòng quá hạn → hồ sơ lớp | Bấm mã lớp → hồ sơ lớp; bấm phần còn lại của hàng → mở / thu như cũ |
| Panel số: "↗" cuối dòng → hồ sơ | Link "Hồ sơ" cùng chỗ → hồ sơ; thân dòng mở như cũ |
| "Mở trang Hướng dẫn ↗" | "Mở trang Hướng dẫn" (cùng link) |

Không bỏ thao tác nào.

## Kiểm (luật KIỂM NHANH 28/10)
- `npm run typecheck` ✓.
- `node scripts/kiem-esbuild.mjs` ✓: 0 cảnh báo.
- `npm run build:server` rồi chạy riêng 6 tệp kiểm: `pr6cPanelAp`, `nenGiaoDien`, `prBang0`, `prHk2`, `prS4f`, `prEn`. Đạt 117/118.
  - Phép không đạt: EN-HOSO, câu "PA Tutor…" của máy chủ. Không liên quan đến PR này: PR không đổi chữ máy chủ.
- Chưa chạy `npm run check` đầy đủ — PTA chạy chung khi merge.
