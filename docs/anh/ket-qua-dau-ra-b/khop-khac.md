# PR-4 KET-QUA-DAU-RA-b — bảng Kết quả đầu ra làm tại chỗ (khớp / khác)

Nguồn: đặc tả `docs/superpowers/specs/2026-11-14-ky-vong-mt0-ket-qua-dau-ra-design.md` mục 5.2 · plan `2026-11-14-nhap-diem-ky-vong.md` PR-4 · lời chủ SP 14/11
"Làm tại chỗ nhưng làm đẹp hơn đi, nhất là chỗ phần điểm nhìn kinh dị thực sự" · tin PTA Plan 14/11 (em chưa chốt quá 27 ngày). **Không có mockup** (chủ SP chọn "làm tại chỗ", duyệt bằng ảnh trước → sau).

Dữ liệu ảnh: DB demo + 5 em mẫu chèn tay vào bản demo cục bộ (BE 04 → FT 101): Đỗ Minh An MT0 4.0 (tự Đạt) · Lương Gia Bảo 3.5 (chưa chốt) · Phan Thu Hà chưa MT0 · Vương Khải W đã huỷ, S 3.5 · Hồ Ngọc Lan vào FT 03/08 (quá 4 tuần, chưa chốt). Cùng dữ liệu cho ảnh TRƯỚC và SAU. Phông Be Vietnam Pro đã nạp (kiểm `document.fonts`).

## Ảnh

| Khung | TRƯỚC | SAU |
|---|---|---|
| QL 1440 tối | `truoc-ql-1440-toi.png` | `sau-ql-1440-toi.png` |
| QL 1440 sáng | — | `sau-ql-1440-sang.png` |
| QL 375 sáng | `truoc-ql-375-sang.png` | `sau-ql-375-sang.png` |
| GV 1440 tối | `truoc-gv-1440-toi.png` | `sau-gv-1440-toi.png` |
| GV 375 sáng | `truoc-gv-375-sang.png` | `sau-gv-375-sang.png` |
| Hộp chốt · Trung tâm (1440) | — | `sau-hop-chot-trung-tam-1440-toi.png` |
| Hộp chốt · Học viên (1440) | — | `sau-hop-chot-hoc-vien-1440-toi.png` |
| Hộp chốt 375 (em có kỹ năng huỷ) | — | `sau-hop-chot-375-sang.png` |
| Zoom ô Kết quả (2×) | — | `sau-zoom-o-ket-qua-1440-toi.png` |

## Truy vết: yêu cầu → thành phần → ảnh

| Yêu cầu (5.2 / PTA) | Thành phần | Ảnh | |
|---|---|---|---|
| Phần điểm "kinh dị" → ô L · R · W · S · Overall riêng như bảng Tổng hợp | `Bang` chung (nhóm cột "MT0") + `ODiem kieu="gon"` (✓ / ✗ là chữ trong cùng span với số) | sau-ql-1440 · zoom | KHỚP |
| Chỉ tô đỏ kỹ năng dưới mốc khi CHƯA đạt; đạt thì màu thường | ô kỹ năng: ✗ đỏ chỉ khi `!dat && monTruot`; Overall ✓ xanh khi đạt, ✗ khi chưa | Đỗ Minh An (W 3.0 thường, ✓ 4.0) | KHỚP |
| Final "76 %" không "●" | `ODiem` "✓ 73%" — bỏ chip tròn có chấm | sau-ql-1440 | KHỚP (màu kết quả trên chính số — G12) |
| QL chốt / sửa ngay ở cột Kết quả bằng hộp nhỏ | `HopNeo` neo ô (mũi chỉ ô): Đạt · Không đạt · Trung tâm (kỹ năng, điền sẵn kỹ năng MT0 dưới mốc, "mỗi kỹ năng một Case + Tutor {n} buổi" theo cấu hình) · Không đạt · Học viên (phương án) → `PUT /students/:id/ket-luan-ft` | sau-hop-* | KHỚP |
| Đạt rồi thì Không đạt tắt, có lý do | `NutChon disabled` + dòng "MT0 đã đạt mốc {ct} — Kết quả đầu ra là Đạt." (máy chủ cũng chặn, #1662) | — (em tự Đạt không mở hộp) | KHỚP |
| Tự Đạt → chip "Đạt" + "tự theo MT0" qua ⓘ | `NhanKq dat` + `NutLuat` ⓘ "MT0 Overall 4.0 ≥ mốc BE 4.0 — tự Đạt, không cần chốt." | Đỗ Minh An | KHỚP |
| "Chờ MT0" (< 3 band) chữ mờ; quá tuần 2 FT → QL chốt tay | "Chờ MT0" mờ; `moTay` (máy chủ, tuần của lệnh Lên FT như `ghiKetLuanFt`) → "Chốt…" | Phan Thu Hà | KHỚP |
| GV chỉ xem | `chotDuoc` (máy chủ: `request.approve` lớp cũ) — GV thấy "– Chưa chốt" viền đứt, không nút | sau-gv-* | KHỚP |
| Hỗ trợ: link Case gọn ("Case Tutor · L, R ›") | "Case Tutor · R" — mỗi chữ kỹ năng là link Case | Chu Nhật Minh | KHÁC nhỏ: không "›" (G6: link chữ trong dòng là tên kỹ năng, không phải nút đổi trang) |
| Bàn giao: tối đa 2 dòng + "Xem" mở hộp đọc | `line-clamp-2` + "Xem" (> ~110 ký tự / > 2 dòng) → `HopNeo` đọc | (demo chưa có bàn giao) | KHỚP |
| Đợt: dải nhóm như hiện có, gọn | dải `surface-2` "Đợt W2 SEP · hiện tới hết W1 OCT" (bỏ "vào lớp W2 SEP" lặp); đợt quá 4 tuần: "còn em chưa chốt" | sau-ql-1440 | KHỚP |
| 375: mỗi em một thẻ (tên · Final · lưới MT0 5 ô · kết quả + nút) | `Bang theRieng`: tên · lớp cũ / lưới 6 ô Final L R W S OVR / kết quả + nút 44 px / Hỗ trợ / Bàn giao | sau-ql-375 | KHỚP |
| [XM] PTA: em CHƯA CHỐT dù quá 27 ngày vẫn hiện | `kqdrLopFt`: thêm em vào FT quá 4 tuần, không kết quả lưu, có lệnh Lên FT từ lớp cũ (cùng tập việc "Kỳ vọng"); tự Đạt thì bỏ | Hồ Ngọc Lan (đợt W1 AUG) | KHỚP |
| Việc "Kỳ vọng" mở được khi lớp 0 đợt trong 4 tuần | `TabHocVienLop`: `?che-do=ket-qua` mở được dù `kqdrDot` = 0 (không thêm câu ở đầu trang lớp) | — | KHỚP |
| Sửa ghi cứng "Tutor 10 buổi" | `KetLuanKhoa.tsx`, `CuoiKhoaLop.tsx`, bảng: `mocThuong().khongDatKyVong.tutor` | — | KHỚP |
| Hướng dẫn "?" QL | `shared/huongDan/ql.ts`: việc "Chốt Kết quả đầu ra (lên FT)" (lối chính Công việc › Vận hành › Kỳ vọng, lối tắt hồ sơ lớp) + mục "Kết quả đầu ra lên FT" ở màn hồ sơ lớp | — | KHỚP |

GIỮ: tên em là link hồ sơ · lớp cũ (nay dòng phụ dưới tên) · nhóm theo chương trình nguồn · hiện 4 tuần · trạng thái rỗng / lỗi / đang tải · "Chưa bàn giao".
BỎ: cột "Lớp cũ" riêng (gộp thành dòng phụ dưới tên — bảng có thêm 5 cột điểm) · chuỗi "MT0 · L R W S · Overall" một ô · chip Final có "●".

## Thao tác TRƯỚC → SAU

| Thao tác | TRƯỚC | SAU |
|---|---|---|
| Xem Kết quả đầu ra lớp FT | bảng chỉ đọc | giữ (GV, TVV, CX chỉ xem) |
| QL chốt Kết quả đầu ra em đã sang FT | không có chỗ (Cuối khoá lớp cũ không còn em) — hoặc đi hồ sơ HV | **"Chốt…" ngay ô, hộp nhỏ, Lưu** |
| QL sửa kết quả đã chốt | hồ sơ HV | **bấm thẳng chip** (không ⋯ một mục — luật "Case – PA bấm thẳng") |
| Em MT0 đạt mốc | QL phải bấm Đạt tay | **tự Đạt**, không thao tác |
| Đọc bàn giao dài | chữ dài kéo cao hàng | 2 dòng + "Xem" (hộp đọc) |
| Mở Case hỗ trợ | link "Case R · Tutor 10 buổi" | link chữ kỹ năng trong "Case Tutor · R" |
| Việc "Kỳ vọng" (QL) | mở Cuối khoá lớp cũ (em đã chuyển thì không thấy) | mở bảng này ở lớp FT, đủ cả em quá 4 tuần chưa chốt |
| Hồ sơ HV / Cuối khoá: "Không đạt" khi MT0 đạt | bấm được → máy chủ 400 | nút tắt, lý do khi rê |

Không mất thao tác nào.

## Sau lưu / sửa sai
- Lưu chờ máy chủ; lỗi → ở lại hộp, giữ chữ, báo lỗi (`role="alert"`). Không đổi gì → Lưu chỉ đóng (V12 ③). Đã sửa mà bấm ngoài / Esc → hộp giữ (không mất chữ đang gõ); "Đóng" mới bỏ. Bấm thử Playwright: Esc khi đã gõ giữ hộp · Lưu ghi DB, bảng cập nhật · em tự Đạt không có nút sửa · 0 lỗi console.
- Sửa sai = bấm chip, chọn lại. Đổi từ Trung tâm sang khác: Case đã tạo giữ, toast nói rõ (máy chủ `luuY`).

## Đo
- ✕ / ⋯: màn này **không có** ✕ / ⋯ (hộp dùng nút chữ "Đóng"; sửa bấm thẳng chip). Ô Kết quả lệch tâm dọc so với tên em cùng hàng: 1,3 · 1 · 1,5 · 1 · 1,3 · 0,5 · 1,3 px (cùng đường cơ sở hàng 64 px của `Bang`).
- impeccable `detect`: 0 lỗi (1 gợi ý cỡ chữ 14 px → đã đổi 15 px). Web Interface Guidelines: sửa `name` / `autocomplete` ô phương án, rê chip, Lưu không tắt khi chưa đổi.
- Turso bản chép thật 12/11 (QL chi nhánh 3): `/classes/12/ket-qua-dau-ra` trước 2 câu · 1 dòng (bảng rỗng, việc "Kỳ vọng · CP FT 141 · 6 em" là ngõ cụt) → sau 9 câu · 185 dòng (6 em chưa chốt). `/classes/94/ket-qua-dau-ra` 7 câu · 82 dòng trước = sau. Trần câu 23 giữ (KQDR-B1 khoá), trần dòng 64 (seed) giữ.

## [XM] / để sau
- Ô kỹ năng Đã huỷ hiện "—" như chưa thi (máy chủ bỏ band huỷ; muốn chữ "Huỷ" phải trả thêm danh sách kỹ năng huỷ — chưa cần).
- `loTrinh/tongKet.ts` (Tổng kết lộ trình lớp thường) chưa suy tự Đạt (từ #1662, ghi lại).
