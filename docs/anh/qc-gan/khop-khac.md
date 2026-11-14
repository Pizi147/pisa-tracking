# QC-GAN — gắn các câu quy chế còn thiếu (Q74 Q75 Q77 Q80 Q82 Q83) · sửa 375 "Điểm theo lượt" · khớp / khác

Nguồn: `docs/anh/gd4b-dong-quy-che/khop-khac.md` dòng 55–58 · bảng 83 câu `thiet-ke/v21/bang-mau-ghi-chu.md` mục 2. Chỉ thêm câu giải thích luật, KHÔNG đổi luật nghiệp vụ.
Thành phần dùng lại: `DongQuyChe` (GD-3 / GD-4b, `ui/KhungPanel.tsx`) · `NutLuat` (ⓘ). Câu ở `shared/domain/quyCheVanHanh.ts` (bản Anh ở `shared/i18n/en/quyCheVanHanh.ts`).
Seed demo 14/09, phông Be Vietnam Pro đã nạp. Ảnh TRƯỚC chụp trên web + shared của main (#1703); ảnh SAU chụp trên nhánh này.

## Ảnh (TRƯỚC │ SAU)

| Ảnh | Nội dung |
|---|---|
| `cap-cuoi-khoa-1440-toi.png` | Cuối khoá MB FOU 22 · QL (vai 2): dòng "Quy chế · Hạn T5 10/09 · tới Thứ Hai tuần bắt đầu máy tự chuyển lớp" ở đầu chân |
| `cap-cuoi-khoa-375-sang.png` | như trên, 375: câu xuống dòng trong chân, không cắt chữ |
| `cap-bao-cao-ph-1440-toi.png` | tab Báo cáo PH MB FOU 12 · QL: ⓘ cạnh "Xuất PDF lớp" (Q83) |
| `cap-diem-theo-luot-375-sang.png` | MB FOU 15 · Bùi Minh Châu · 375: chữ "Progress Test" xuống dòng, không còn dính "✓ 18" (đo: tên lượt kết thúc x = 121,3 · số đầu x = 132,6 → khe 11 px; khối không tràn ngang) |

Không có ✕ / ⋯ nào bị đổi (chân Cuối khoá và ⋯ dòng em giữ nguyên).

## 1. Truy vết câu → chỗ gắn

| Q | Câu (theo mã) | Chỗ | Kết quả |
|---|---|---|---|
| Q74 | "Hạn {T5 10/09} · tới Thứ Hai tuần bắt đầu máy tự chuyển lớp" | chân trang Cuối khoá (QL), `quyCheChotLoTrinh` | KHỚP, chữ sửa theo mã [XM-Q74]: bảng ghi "Hạn thứ Năm {01/10} · Thứ Hai sau máy tự chuyển lớp". Theo mã thì hạn chốt lấy `mocLoTrinh` (cấu hình được, không cứng thứ Năm) và lệnh thi hành vào Thứ Hai của **tuần bắt đầu đã chọn** (`lenhChuyen.ts`), không luôn là "Thứ Hai sau" |
| Q75 | "Khác gợi ý: cần lý do" | như trên, khi có dòng đang sửa khác gợi ý Final | KHỚP |
| Q77 | "Do Trung tâm: Case + Tutor {n} buổi mỗi kỹ năng cho GV lớp FT" (n = `mocThuong().khongDatKyVong.tutor`) | như trên, khi Kỳ vọng FT "Không đạt · Trung tâm"; thắng Q75 | KHỚP |
| — | "⚠ Ghi lý do ngắn" ở từng dòng | GIỮ: đây là báo chặn của dòng (không gửi được khi thiếu lý do), không phải chú thích. Q75 ở chân nói luật chung | GIỮ |
| Q80 | "Chưa có lịch thì PA chưa có mốc kết quả cuối · Bỏ qua được" | — | KHÔNG GẮN: câu đã đúng mã ("Bỏ qua" có từ BO-QUA-XEP-MT 03/11), nhưng việc `moc:` "Xếp lịch MTn" không mở panel (bấm thì sang hồ sơ HV, nút "Bỏ qua" nằm ngay trên dòng việc). Không có panel nên không có dòng quy chế để gắn; `NganXepLichMt` là ngăn xếp lịch chung, không biết PA chờ mốc → ghi Việc để sau |
| Q82 | Nhập hộ điểm | — | CHƯA LÀM: lưới nhập điểm thuộc GD-11a (đang làm) → ghi Việc để sau (`plan.md` 15/11 QC-GAN) |
| Q83 | "Lớp đủ báo cáo · việc tự rời sau 7 ngày" / chưa đủ: "Đợt quá hạn còn thiếu em: việc Xuất hiện 7 ngày từ hạn" | ⓘ cạnh nút Xuất ở tab Báo cáo PH (`quyCheXuatBaoCaoPh`) — nút không có panel; luật ⓘ = giải thích, không thêm đoạn chú thích | KHỚP (theo `viecXuatBaoCaoPh`: 7 ngày từ ngày lớp đủ / từ hạn) |
| — | 375 "Điểm theo lượt" lớp thường: "Progress Test" dính "✓ 18" (có từ GD-6) | `MoRongThuong`: tên lượt chỉ `nowrap` từ 640 px, ô có `pr-2` | SỬA |

## 2. Bảng thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Cuối khoá: chọn hướng, lớp, tuần, Kỳ vọng, Lưu nháp, Chốt, Thử lại | chân dính đáy | giữ nguyên; thêm một dòng Quy chế ở đầu chân (QL; ẩn khi đang báo lỗi lưu) |
| GVCN lưu nhận xét | chân | giữ (GVCN không có dòng quy chế) |
| Xuất Excel / PDF lớp, Xuất từng em | tab Báo cáo PH | giữ; thêm ⓘ (chỉ khi có quyền Xuất) |
| Mở rộng em lớp thường (375) | — | giữ, chỉ đổi chỗ xuống dòng của tên lượt |

Không thao tác nào bị mất.

## 3. Turso

0 câu thêm: câu quy chế tính từ dữ liệu đã nạp (`mocLoTrinh`, `mocThuong`, số em đủ của tab).

## 4. Phép kiểm

- `thanhPhanChung.tests.ts` "QC-GAN · …": câu Q74 theo `mocLoTrinh` + `thuNgay` (không cứng "thứ Năm"); Q75; Q77 thắng Q75 với số buổi Tutor theo `mocThuong`; Q83 hai biến thể. Các câu được neo vào mã nguồn (`xuatBaoCaoPh.ts` 7 ngày, `lenhChuyen.ts` Thứ Hai tuần bắt đầu). Có kiểm chỗ gắn (Cuối khoá có `DongQuyChe`, GIỮ "⚠ Ghi lý do ngắn", ⓘ cạnh Xuất).
- impeccable detector trên 3 tệp: 6 phát hiện, đều ở mã có sẵn không do PR này sửa (`CuoiKhoaLop.tsx:743` viền trái 3 px của dải nhóm · `TabBaoCaoPh.tsx` cỡ 17 px) → không đụng (ngoài phạm vi).
