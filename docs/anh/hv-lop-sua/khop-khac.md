# HV-LOP-SUA — truy vết + KHỚP / KHÁC + thao tác TRƯỚC → SAU

Khung: mockup đã duyệt `thiet-ke/v5/hoc-vien-lop.html` (+ `hoc-vien-lop-truy-vet.md`). Lời chủ SP 27/10 (`docs/superpowers/plans/2026-10-27-sua-toi.md` mục 1–2, D2).

**PR nào làm mất "danh sách theo lớp":** chính **#548 UI-HV-LOP** (theo khu d `dieu-chinh-cuoi.html`): gỡ bảng HV theo lớp, thay bằng danh sách phẳng + ô "Lớp" → dải lớp
(`docs/anh/ui-hv-lop/khop-khac.md`, dòng "Hàng lớp … GIỮ qua ô chọn Lớp", XM-1). #557 ghi chú gỡ thân bảng cũ trong `BangHocVienLop.tsx`. P11 `78bbd1ce` (cột Việc
theo vai) và UI-HV-LOP-TVV `0a71a948` (TVV / CX dùng chung bảng phẳng) giữ cách phẳng đó — không phải nơi bắt đầu.

Ảnh (DB demo cục bộ, ngày demo 14/09/2026; 1440 tối + 375 sáng): `truoc-{ql,gv,tvv,cx}-*.png` · `sau-{ql,gv,tvv,cx}-*.png` · `sau-sos-ql-*` · `sau-lich-ql-*`.
Vai: QL Nguyễn Khánh Vy · GV Trần Ngọc Hà · TVV Phan Mai · CX Vũ Thanh Tâm.

## Khung → thành phần → kết quả

| # | Khung mockup / yêu cầu chủ SP | Thành phần web | Kết quả |
|---|---|---|---|
| 1 | Hàng đầu: Tiêu đề · FT · Lớp thường · (phạm vi) · Chi nhánh · Xuất · + Thêm HV · ⋯ | `StudentsPage` (`chonKhung`, `chonPhamVi`) — mọi chế độ | KHỚP |
| 2 | FT / Lớp thường = hai chip bật / tắt (cả hai bật = mọi lớp) | `nut-loc aria-pressed`; tắt một = chỉ loại kia; chip bật một mình bấm lại = bật cả hai; số lớp trên chip | KHỚP |
| 3 | Chi nhánh trên hàng đầu | select hiện có (D3 làm component chung — rebase khi D3 merge) | KHÁC tạm |
| 4 | Dải lọc một hàng ở 1440 | Tìm · Thi tháng này · (chip vai TVV) · Có việc quá hạn · Đã thi · Bộ lọc thêm · "n HV · m lớp" — một hàng ở QL, GV, TVV, CX | KHỚP |
| 5 | Phần thêm vào "Bộ lọc thêm" | + nhóm "Theo vai" (Thiếu thông tin · Chờ chọn bước tiếp, chỉ khi có em) + "Xếp em trong lớp" (Theo tên · Cần chú ý trước) | KHỚP |
| 6 | Tất cả mặc định = THEO LỚP: ▾ · mã lớp ↗ · n HV · GVCN · ô SOS · việc cấp lớp | `HangNhom` + `DauLop`; mở ra là HV của lớp | KHỚP |
| 7 | Ô SOS 3 mức, viền đứt khi 0, đọc màn một câu | `OSosLop` (dáng `lopSos` từng mức, `role="img"` + `aria-label`) | KHỚP |
| 8 | Việc cấp lớp ở hàng lớp, không lặp ở HV | việc `studentId = null` có `classId` → hàng lớp; ô Việc em chỉ việc của em | KHỚP |
| 9 | Bỏ ô "Mọi lớp" ở Tất cả; chọn lớp chỉ ở Đang SOS, Lịch thi | `locChung` (tìm + lớp) chỉ ở 2 chế độ đó | KHỚP |
| 10 | Bỏ cột Xu hướng (mọi vai) | `COT_HV` | KHỚP |
| 11 | TVV bỏ cột Phụ huynh | `cotHv`: TVV không cột PH; CX (không có cột Việc) giữ PH | KHỚP |
| 12 | Dòng phụ dưới tên không lặp hàng lớp | `TenEm`: bỏ mã lớp, còn "TVV … / Kết thúc học / Tạm dừng" | KHỚP |
| 13 | Việc: mỗi việc một dòng, tên đậm vừa, hạn chip cùng dòng căn phải; tối đa 2 + "Xem thêm n" | `OViec` + `HanViec` (quá hạn / hôm nay chip ⚠; còn lại chữ phụ); `SO_DONG_VIEC_MAC_DINH` 3 → 2 | KHỚP |
| 14 | Tên việc trên dòng em không lặp tên em; việc cấp lớp không lặp mã lớp, thêm lượt (MT1 / MT2) khi trùng tên | `chuCua` (OViec) · `viecLop` (StudentsPage) — cắt SAU khi dịch (EN không vỡ) | KHỚP |
| 15 | Lớp mặc định mở | URL `mo`; chưa có: đang lọc / ≤ 2 lớp → mở hết, còn lại mở lớp đầu (mockup: FT 101 mở). Đổi lọc → về mặc định | KHỚP |
| 16 | Phân trang | theo LỚP ở Tất cả (10 / 20 / 50 lớp), việc / em một lớp không tách trang | KHÁC — mockup ghi "theo HV"; theo lớp đơn giản và không cắt ngang lớp |
| 17 | "Không có Case" mỗi dòng | "—" mờ (title "Không có Case") | KHÁC nhỏ — bớt chữ lặp (critique) |
| 18 | 375: thẻ lớp + thẻ em | `TheHvGon` (hàng lớp có ▾) → `TheHvLop` | KHỚP |
| 19 | Chú giải SOS trên bảng (mockup) | không vẽ — tooltip + đọc màn (V6 ít chữ) | BỎ |
| 20 | Cột tick + thanh "đã chọn" (mockup) | không có (chủ SP 23/10: Xuất theo bộ lọc — giữ #548) | BỎ |
| 21 | Cột điểm tách Target · OVR · L · R · W · S · Kết quả MT2 (mockup) | GIỮ cột Lộ trình + "MT gần nhất" gộp của #548 (khu d đã duyệt sau mockup này) | KHÁC — không thuộc phạm vi D2 |

**Đếm:** 16 KHỚP · 1 KHÁC tạm chờ D3 (#3) · 3 KHÁC có lý do (#16, #17, #21) · 2 BỎ đã có luật → 19 / 21 khớp hoặc khác đã có lý do = **90 %** (KHỚP thuần 16 / 21 = 76 % — chủ SP quyết #16, #17, #21).

Ảnh cặp mockup | web: `cap-mockup-web-gv-1440-toi.png`, `cap-mockup-web-gv-375-sang.png`.

## Thao tác TRƯỚC → SAU

| Trước PR | Sau PR | Ghi chú |
|---|---|---|
| Xuất Excel · n HV | **GIỮ** | |
| + Thêm học viên (đầu trang; ⋯ ở 375) | **GIỮ** | |
| ⋯ đầu trang: + Lớp mới · Lưu trữ | **GIỮ** | |
| Phạm vi · Chi nhánh (trong dải lọc) | **GIỮ**, dời lên hàng đầu trang | |
| Ô "Mọi chương trình" | **GIỮ** thành 2 chip FT · Lớp thường ở hàng đầu | |
| Ô "Lớp" → dải lớp (badge · ⋯ Hồ sơ lớp · Nhập điểm · + Học viên · ✕) | Tất cả: **thay bằng hàng lớp** (mã ↗ = Hồ sơ lớp, badge, ⋯ Hồ sơ lớp · Nhập điểm · + Học viên có lớp điền sẵn). Đang SOS / Lịch thi: **GIỮ** ô Lớp + dải lớp | chủ SP 27/10 |
| Badge lớp "n việc quá hạn" (→ lọc quá hạn của lớp) | **BỎ ở hàng lớp** — việc quá hạn có ⚠ trên từng việc; lọc bằng chip "Có việc quá hạn" | trùng thông tin (critique) |
| Badge lớp "n bài chờ chấm" | **GIỮ**; ẩn khi hàng lớp đã có việc "Nhập điểm" của người xem | trùng |
| Thi tháng này · Có việc quá hạn · Đã thi · chip vai TVV / CX | **GIỮ** (2 chip vai ít gặp vào Bộ lọc thêm; đang bật từ link thì vẫn hiện ở dải) | |
| Bộ lọc thêm (Case / PA · kỹ năng · kết quả · thời gian) | **GIỮ** | |
| Xếp: Lớp · tên / Cần chú ý trước (select) | **GIỮ** trong Bộ lọc thêm "Xếp em trong lớp" | danh sách đã chia theo lớp |
| Bấm việc ở ô Việc = làm tại chỗ | **GIỮ** (cả việc cấp lớp ở hàng lớp) | |
| ⋯ cuối dòng em | **GIỮ** | |
| Xem thêm (n) ở ô Việc QL | **GIỮ** "Xem thêm n", mặc định 2 dòng (trước 3) | |
| Cột Phụ huynh TVV (SĐT bấm gọi) | **BỎ ở 1440**; thẻ 375 vẫn có SĐT bấm gọi; hồ sơ HV có đủ | chủ SP 27/10 |
| Cột Xu hướng | **BỎ** | chủ SP 27/10 |
| Phân trang theo HV | theo lớp | #16 |

## Critique (impeccable, Operate)
Vòng 1: 28 / 40 (P1: căn hạn, badge trùng ở hàng lớp, tên việc cắt). Đã sửa. Vòng 2: 31 / 40, hết P0; P1 còn lại (tên việc dài bị cắt ở hàng lớp) đã tách "+n việc" ra ngoài phần cắt, tên đủ ở tooltip. Bộ dò `impeccable detect`: 0 phát hiện.
