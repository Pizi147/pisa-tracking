# PR-1 PHOI-HOP-V2 · màn Công việc — khớp / khác mockup #1368 (K1–K4)

Ảnh cặp mockup | web: `anh-cap/cv-1440-gvcn.png` (K1) · `anh-cap/cv-1440-tvv.png` (K3) · `anh-cap/cv-375-gvcn.png` (K4a) · `anh-cap/cv-375-panel-web.png` (K4b, web).
Seed 14/09/2026, GVCN Trần Ngọc Hà (MB FT 101), TVV Phan Mai. Phông Be Vietnam Pro đã tải (`document.fonts.check` = true).

## Truy vết khung → thành phần → ảnh

| Khung mockup | Thành phần web | Ảnh | |
|---|---|---|---|
| K1 tab "Ý thức & Phối hợp", hai mục Vi phạm · Phối hợp SOS | `shared/domain/tongQuan.ts` (phoi_hop_sos → y-thuc; mục `vi-pham`) | cv-1440-gvcn | KHỚP |
| K1 ô việc: tên 15/600 · số em · lớp chữ mờ · chip tên tròn ≤ 2 + "+n" · hạn · một nút; cao 64 px | `DanhSachViec.tsx` `DongGon` | cv-1440-gvcn | KHỚP |
| K1 một dòng mỗi (lớp × việc) | `phoiHop.ts dongPhoiHopTheoViec` + `mywork.ts` | cv-1440-gvcn | KHỚP |
| K1 panel ① Học viên cần làm → ② Đã làm → ③ Kết quả; Xác nhận tại dòng: Ngày + Nội dung; + Tệp · Người thực hiện | `BangPhoiHop.tsx` + `PanelViec.tsx PanelPhoiHop` | cv-1440-gvcn | KHỚP |
| K2 vừa lưu: dòng ở lại nền xanh nhạt, "✓ ngày · Bạn", Hoàn tác 10 s | `BangPhoiHop` (`vuaLuu`), `Toast.hoanTac({ ms })` | cv-1440-gvcn | KHỚP |
| K2 Meeting CX: ③ "Chờ TVV …" + hạn; ⋯ Bỏ việc… / Đưa lại Cần xử lý | `OKetQua`, `Menu3` | (bấm thử) | KHỚP |
| K2 ⋯ "Sửa hạn…" | — | — | GIỮ chỗ cũ: sửa hạn Meeting CX vẫn ở hồ sơ lớp / HV (ô hạn `DongHan`) — PR-2 đưa vào ⋯ |
| K3 TVV: mục Phối hợp SOS, ② GVCN xác nhận + nội dung gửi, ③ Kết quả · Ngày · Nội dung (≥ 10), SĐT PH | `viecBaoPhCuaToi` (nhóm `phoi_hop_tvv`), `FormTvv` | cv-1440-tvv | KHỚP |
| K3 tên dòng TVV "Meeting CX/GĐCN (sau Mock)" | "Báo PH · Meeting CX/GĐCN" | cv-1440-tvv | KHÁC — có lý do: em chưa có TVV thì GVCN giữ việc này; tên phải khác dòng "Meeting CX/GĐCN (sau Mock)" (bước xác nhận) của chính GVCN |
| K3 dòng "Báo PH sau vi phạm" kiểu mới (Report 2 + chip em) | giữ dòng Báo PH ý thức cũ | cv-1440-tvv | GIỮ — dòng cũ mang huy hiệu "⚠ Chưa liên hệ được · lần n", "còn n ngày" (mất nếu đổi sang ô gọn); đưa sang ô gọn ở PR Ý thức sau |
| K4a 375 ba tầng, "›" / "▾" | `DongGon` (375: ẩn nút dòng gộp, "▾" mờ) | cv-375-gvcn | KHỚP |
| K4b 375 panel thẻ em, Xác nhận rộng hết | `BangPhoiHop` lưới 375 | cv-375-panel-web | KHỚP |
| Chip tên mở đúng em | dòng gộp Ý thức: mở việc của em; dòng Phối hợp: mở panel (chưa cuộn tới em) | — | KHÁC nhỏ — ponytail, ghi Việc để sau |

## Thao tác TRƯỚC → SAU (không mất thao tác)

| Thao tác | Trước | Sau |
|---|---|---|
| Thấy việc Phối hợp (GVCN, QL) | tab Case học thuật, một dòng / lớp + thẻ điểm 3 em | tab Ý thức & Phối hợp, một dòng / (lớp × việc), chip tên |
| Việc TVV sau Meeting CX | không có | tab Báo PH › Phối hợp SOS; chuông Báo PH; em chưa có TVV → GVCN |
| Xác nhận | form: Ngày · Người · Ghi chú tuỳ chọn · Tệp | tại dòng: Ngày · **Nội dung bắt buộc** (Meeting CX: gửi TVV tuỳ chọn) · Tệp · Người thực hiện; Hoàn tác 10 s |
| Meeting CX ≥ 10 ký tự | GVCN | TVV (kết quả buổi họp) |
| Sửa việc đã xong | nút Sửa | "Sửa" ở ② |
| Đưa lại Cần xử lý | nút | ⋯ |
| Bỏ việc… + Hoàn tác | ⋯ | ⋯ (việc GVCN và việc TVV) |
| Khôi phục việc đã bỏ | nút | Hoàn tác ngay sau bỏ; về sau ở hồ sơ lớp / HV (giữ như cũ) |
| + Thêm việc | đầu thẻ em (panel) | hồ sơ lớp / HV (giữ như cũ) — panel Công việc là việc của một loại |
| Nội dung đã báo TVV (lớp thường) | panel Báo phụ huynh qua TVV | không đổi (`PanelBaoPh`) |
| Việc tiếp › | không có | chân panel |

## Chủ SP rà ảnh 12/11 (không mockup lại)
| Chỗ | Mockup #1368 | Web | |
|---|---|---|---|
| Tiêu đề cột ① | "Học viên cần làm" / "Học viên cần báo" | "Học viên" | KHÁC — chủ SP 12/11 |
| Dòng phụ dưới tên em | một chuỗi "MT2 · ✗ 5.5 / 6.0 · trượt L, R, W, S" | CHIA LOẠI: thẻ lượt "MT2" · "Overall" mờ + số ✗ / ✓ ba màu + "/ 6.0" · "Trượt" mờ + chip L R W S; xuống dòng giữa các khối, không cắt | KHÁC — chủ SP 12/11; một thành phần `DiemMotDong` cho panel, hồ sơ lớp, hồ sơ HV |
Ảnh: `anh-cap/cv-1440-panel-diem-web.png`, `anh-cap/cv-375-panel-web.png`.
