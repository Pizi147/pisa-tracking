# P9b CUOI-KHOA — khớp / khác mockup `thiet-ke/v6/cuoi-khoa.html` (ĐÃ DUYỆT 25/10)

Dữ liệu demo web: ngày demo **T2 14/09** (`seed`), lớp **MB FOU 12** (7 em, Final W3 SEP 14/09 — 1 em đã đủ điểm 58 %). Mockup dùng 12 em, Final 21/09 đã chấm (khung 3–9) → chữ / số khác, **bố cục và thành phần** so được.
Ảnh cặp: `cap-k3-ql-1440-toi.png` · `cap-k7-gvcn-1440-toi.png` · `cap-k9-375-sang.png`; web thêm: `web-1440-chon-nhom-ap.png` (chọn nhóm + thanh Áp + chân tóm tắt) · `web-1440-da-chot.png` (sau Chốt · 7 em) · `web-1440-gvcn.png` · `web-1280-toi.png` · `web-1440-zoom125-toi.png` (1440 ở 125 % = khung 1152) · `web-ft-chuyen-lop-nhieu-em.png` (k8).

## 1. Khung → thành phần → ảnh (≥ 90 % KHỚP: 31/33 dòng KHỚP, 2 dòng KHÁC có lý do)

| Khung | Thành phần mockup | Web (tệp) | Ảnh | Kết quả |
|---|---|---|---|---|
| k1a | Việc QL "Chốt lộ trình · lớp" + nút "Cuối khoá ›", hạn / quá hạn | `mywork.ts` (`href ?xem=cuoi-khoa`, `actionLabel 'Cuối khoá ›'`), chuông 3 mốc `thongBaoTuDong.ts` | — | KHỚP |
| k1b | ⋯ hồ sơ lớp: nhóm "Cuối khoá" = Cuối khoá… · Kết thúc lớp | `menuHoSoLop` (`shared/domain/hocVienLop.ts`) | bấm thử (menu: … Cuối khoá… · Kết thúc lớp …) | KHỚP |
| k1c | Hồ sơ HV "Cuối khoá ›" → trang lớp, em chọn sẵn + cuộn | `KetLuanKhoa.tsx` + `duongLoTrinhLop(…, em)` → `?xem=cuoi-khoa&em=` | — | KHỚP (nút trong hộp Kết luận khoá, không thêm dải mới) |
| k2 | Trước Final: "Chờ Final · 0/4 môn" + "Progress {ngày} · x/4 môn đạt · Không đạt: …"; Gợi ý "Chờ Final"; chân "Bổ trợ Final và Xét lại lộ trình tự sinh khi có Final" | `oKetQua`, `oGoiY`, `tomTat` | cap-k3 (web đang ở trạng thái trước Final) | KHỚP |
| k2 | Chip hạn "Hạn hôm nay" / "hạn T5 …" / "Quá hạn n ngày · hạn T5 …" | `chipHan` (N20 `mocLoTrinh`) | cap-k3 | KHỚP |
| k3 | Đầu: "Cuối khoá · lớp" + CT · n em · Final · GVCN + "x/n em đã chốt" | `CuoiKhoaLop.tsx` đầu thẻ | cap-k3 | KHỚP |
| k3 | Chọn tất cả · n + "Chọn nhóm:" chip theo Hướng (đếm em) | `demNhom`, `chonNhom` | web-1440-chon-nhom-ap | KHỚP |
| k3 | Lọc "Chưa chốt n" (+ "Lỗi n") | `loc` | cap-k3 | KHỚP (+ GIỮ "Còn bàn giao n") |
| k3 | Thanh "n em đã chọn · Hướng · Lớp (gõ-tìm, chỉ MB, + Mở lớp mới…) · Tuần · Áp cho n em · Bỏ chọn" | `thanhAp`, `ChonLop moLopMoi ghiChuDs` | web-1440-chon-nhom-ap | KHỚP |
| k3 | Cột Kết quả đầu ra máy ghi: % ✓/✗ + dải, dòng 2 % từng môn (✗ < ngưỡng) | `oKetQua` + `chuDaiKetQua` | cap-k3 (Nguyễn Thảo Vy 58 %) | KHỚP |
| k3 | Cột Gợi ý = hướng máy + "GVCN: nhận xét" | `oGoiY` | — | KHỚP |
| k3 | Cột Hướng ô chọn; đã chốt → "🔒 hướng" | `oHuong` | web-1440-da-chot | KHỚP |
| k3 | Cột Lớp chuyển đến ô gõ / lớp đã chọn ✕ + tuần | `oLop` | web-1440-chon-nhom-ap | KHỚP |
| k3 | Cột Bàn giao "Chờ bàn giao · hạn" / "Đã bàn giao" | `oBanGiao` | web-1440-da-chot | KHỚP |
| k3 | Chân dính "Khi chốt: n em sẵn sàng · a → lớp · bắt đầu tuần" + dòng tác động + Lưu nháp · Chốt · n em | chân `tomTat` (`tacDongChot` — cùng luật máy chủ lúc thi hành) | web-1440-chon-nhom-ap | KHỚP |
| k4 | Hướng khác gợi ý → ô Lý do + "Ghi lý do ngắn" | `oHuong` (`khacGoiY` + `kiemDongLenh`) | — | KHỚP |
| k4 | "đã sửa" cạnh tên | `oTen` | web-1440-chon-nhom-ap | KHỚP |
| k4 | Khối Kỳ vọng FT (chỉ Hướng = Lên FT): "Kỳ vọng {quy chế} · MT0", band, Đạt / Không đạt, "máy gợi ý", Nguyên nhân, Kỹ năng, "→ Case + Tutor 10 buổi/kỹ năng", Học viên → ô Phương án | `oKyVong` | — (demo không có em Lên FT có MT0) | KHỚP (phép kiểm CK-5) |
| k4 | Thanh có cụm "Kỳ vọng FT" khi mọi em chọn là Lên FT | `thanhAp` (`tatCaFt`) | — | KHỚP |
| k4 | Ô Target chỉ khi em Lên FT chưa có Target | `oHuong` (`canTarget`) | — | KHỚP |
| k5 | "+ Mở lớp mới…" → hộp: Mã / Chương trình (khoá) / Chi nhánh (khoá) / tuần / GVCN; xong điền vào thanh, em vẫn chọn | `ClassCreatePanel khoa` | — | **KHÁC**: panel (dùng lại `ClassCreatePanel` có sẵn — Số lớp + Tuần khai giảng + Phân công), không hộp giữa màn; chữ "Mở lớp mới" / "Mở lớp" / "Đã mở {lớp}" đúng mockup |
| k5 | Lỗi mã trùng tại ô | `ClassCreatePanel` ("Đã có lớp {mã}") | — | KHỚP |
| k6 | "✓ Đã chốt n em · ⚠ n em chưa lưu — xem lý do ở dòng"; dòng lỗi giữ dữ liệu + lý do; lọc "Lỗi n" bật sẵn; chân "n em chưa lưu · tên — hướng, lớp đã chọn vẫn giữ" + Đóng · Thử lại n em | `ketThuc`, `chan` | web-1440-da-chot (phần ✓) | KHỚP |
| k7 | GVCN: 5 cột Học viên · Kết quả đầu ra · Gợi ý · Hướng · QL chốt · Nhận xét (ô nhập); em chưa chốt "QL chưa chốt"; Kỳ vọng nút tắt | `laGvcn` nhánh | cap-k7 | KHỚP |
| k7 | Chân "n nhận xét đã sửa · QL thấy dưới cột Gợi ý…" + Lưu nhận xét · n em | `chan` (GVCN) | cap-k7 | KHÁC nhỏ: không nút "Đóng" (trang, không panel — "‹ lớp" ở đầu trang) |
| k8 | Lớp FT: ⋯ không còn "Chuyển tiếp lớp…" | `menuHoSoLop` | bấm thử (menu FT: Thông tin lớp · … · Kết thúc lớp) | KHỚP |
| k8 | Chọn em → "Chuyển lớp…" | `TabHocVienLop` (`ThanhChonNhieu` + `ChuyenLopNhieuEm emIds`) | web-ft-chuyen-lop-nhieu-em | KHỚP |
| k9 | 375 thẻ em: ☐ tên · % + dải · GVCN · "hướng · lớp" | thẻ `dt` (+ nút "Sửa" mở ô tại thẻ) | cap-k9 | KHỚP |
| k9 | Chip nhóm | công cụ | cap-k9 | KHỚP |
| k9 | Tấm "Áp cho n em" (Hướng · Lớp · Tuần) | `Modal` `tam` | — | KHỚP |
| k9 | Chân tóm tắt dính đáy | chân sticky (375: chữ một hàng, nút chia đôi) | cap-k9 | KHỚP |
| R5.3 | Gỡ dải "Chưa chuyển được" lớp FT, nhánh "Kết thúc lớp › đi tiếp" FT | `daiChuyenLop.ts`, `ClassOverviewPage` | — | KHỚP |

## 2. GIỮ / BỎ

| | Thành phần | Ở đâu sau PR |
|---|---|---|
| GIỮ | Lưu nháp (chỉ QL thấy) · Xoá nháp (đổi Hướng về trống rồi Lưu nháp) | chân trang |
| GIỮ | Huỷ quyết định (lý do) + **Hoàn tác** (10 s, `hoanTacHangLoat`) | dòng đã chốt › Sửa › Huỷ quyết định |
| GIỮ | Sửa quyết định đã chốt (Hướng / Lớp / Tuần / Lý do) | dòng đã chốt › Sửa |
| GIỮ | Bàn giao + hạn, mở panel Bàn giao | cột Bàn giao |
| GIỮ | Việc "Chốt lộ trình · lớp", chuông (nay 3 mốc N20) | Công việc / chuông |
| GIỮ | "Ngay hôm nay" (khung vàng) + **hộp xác nhận nêu tên em** (N22 ③) | thanh Áp › Tuần |
| GIỮ | Lý do khi khác gợi ý · Ghi chú cho GV lớp mới ("+ Ghi chú") · Target / KCK Lên FT · Tạm dừng "Có thể quay lại học" + tuần xem lại | ô Hướng |
| GIỮ | Việc QL Kỳ vọng (`ky_vong_dau_ra`, đổi tên "Kỳ vọng") + bảng chỉ đọc 4 tuần ở lớp FT | Công việc → Cuối khoá lớp cũ |
| GIỮ | Lọc "Còn bàn giao" · "Chưa chuyển được: lỗi" ở dòng | trang Cuối khoá |
| GIỮ | Chuyển MỘT em khác chi nhánh (Chuyển lớp…) | hồ sơ HV |
| BỎ | Tab "Đánh giá đầu ra" (`TabDauRa.tsx`) — nhận xét GVCN chuyển sang cột Nhận xét; `danh_gia_dau_ra.de_xuat` chỉ đọc | N17, N22 ① |
| BỎ | Cách xem "Lộ trình tiếp theo" (`BangLoTrinhTiep.tsx`), hộp "Lộ trình · em", hộp "Kết quả đầu ra" (`HopKetQua`) | thay bằng trang Cuối khoá |
| BỎ | GVCN đề xuất Kết quả đầu ra (`PUT /students/:id/ket-qua-de-xuat`) | N22 ② chỉ QL |
| BỎ | `TransitionPanel` (FT "Chuyển tiếp lớp…", bước "2 Xác nhận"), dải "Chưa chuyển được" FT | R5.3 |
| BỎ | Lớp đích chi nhánh khác ở luồng cả lớp | N17 (máy chủ chặn) |

## 3. Thao tác TRƯỚC → SAU

| Tình huống | Trước PR | Sau PR |
|---|---|---|
| 12 em, cả lớp Lên BE, 3 em khác | tab Lộ trình tiếp theo › chọn từng em › hộp Lộ trình › `<select>` lớp › Chốt; nhóm khác làm lại ≈ 25 bấm | Chọn nhóm (1) › Lớp gõ + chọn (2) › Áp (1) › sửa 3 dòng (6) › Chốt (1) = **11 bấm** |
| Kết quả đầu ra cả lớp | tab Đánh giá đầu ra, ~3 bấm / em | **0** — máy ghi theo Final |
| Kỳ vọng em Lên FT | hộp từng em sau khi chốt; GVCN đề xuất rồi QL chốt | Đạt / Không đạt trên dòng (hoặc thanh Áp cho nhóm Lên FT), lưu cùng "Chốt" |
| Lớp đích chưa có | rời bảng, tạo lớp, quay lại chọn lại em | "+ Mở lớp mới…" › điền › Mở lớp (3), em vẫn chọn, lớp tự điền |
| Lỗi một phần | toast "n em chưa lưu" | giữ + "Lỗi n" bật sẵn + "Thử lại n em" |
| GVCN | ghi Đề xuất + Nhận xét ở tab Đánh giá đầu ra (panel lần lượt) | gõ Nhận xét ngay trên dòng › "Lưu nhận xét · n em" (409 khi người khác vừa sửa) |
| Lớp FT đổi lớp nhiều em | ⋯ Chuyển tiếp lớp… › 1 Soạn › 2 Xác nhận | Chọn nhiều học viên › chọn em › Chuyển lớp… (ô lớp có "+ Mở lớp mới…") |

Không mất thao tác: mọi thao tác cũ còn đường (bảng mục 2).

## 4. [XM] — xin PTA Plan xác nhận

1. **[XM-1] Nhận xét GVCN lưu ở `danh_gia_dau_ra.nhan_xet`** (bảng cũ, có lịch sử `audit_logs` + 409). Kế hoạch ghi "bảng `danh_gia_dau_ra` chỉ còn đọc lịch sử": PR giữ **cột `de_xuat` chỉ đọc**, nhưng **vẫn ghi `nhan_xet`** (một nơi, không thêm cột mới). Đổi nếu PTA muốn cột riêng.
2. **[XM-2] Báo PH khi Final < 50 % mà QL cho lên:** mã cũ chỉ tạo việc Báo PH khi Học lại; PR theo truy vết 25/10 ("luôn có việc Báo PH") — nay < 50 % luôn có, cả khi Lên (`coBaoPhKhiChot`).
3. **[XM-3] Kỳ vọng · Học viên không Case** (N17) — trước: 1 Case không PA. Đổi theo N17; hộp Kết luận khoá hồ sơ HV ghi "Ghi phương án, không Case."
4. **[XM-4] Hướng "Chưa quyết"** trong ô của mockup → web để trống ("Chọn hướng") = chưa quyết, không lệnh (lệnh không có hướng chua_quyet).
5. **[XM-5] Hộp "Mở lớp mới"** dùng lại panel Tạo lớp có sẵn (khoá Chương trình + Chi nhánh), không hộp giữa màn như mockup k5.
6. **[XM-6] Lớp FT "Chuyển lớp…" nhiều em** dùng `ChuyenLopNhieuEm` (cùng tệp P9a có thể đổi) — gộp với P9a thì giữ prop `emIds`, `lop`.

## 5. Đo

- `do-khung` + `do-bang` kịch bản `cuoi-khoa`, `cuoi-khoa-ap`, `cuoi-khoa-gvcn` × 1440 / 1280 / 375 × tối / sáng: **không lỗi**; miễn P9b (`scripts/mien-do.json`) g1 cột ô chọn / ô nhập (máy đo không có chữ để so mép) + g3 hàng cao có ô nhập (như mockup k3).
- Bấm thử QL lớp thường: chọn nhóm → Lớp → Áp → Chốt · 7 em (bàn giao + hạn 20/09 hiện ngay); GVCN: chỉ Nhận xét; QL lớp FT: ⋯ không Chuyển tiếp lớp, Chọn nhiều → Chuyển lớp · MB FT 101 · 2 em.
