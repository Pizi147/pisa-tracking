# UI-HO-SO-HV U02 — hồ sơ học viên theo mockup audit 03/11 (chủ SP duyệt)

Mockup: `thiet-ke/audit-0311/u02-ho-so-hv.html` (bảng ý `13-ra-ux-a.md` 6c, UA-Q1, UA-Q2, UA-Q4, N33 ① ②). Ảnh cặp mockup | web (`scripts/anh-cap.mjs`, DB demo cục bộ,
ngày demo 14/09, phông Be Vietnam Pro đã kiểm `document.fonts.check` = true):
- `a1-gv-overall-1440-toi.png` — GVBM Speaking (vai 9) · em Lê Quang Huy (id 3) · mặc định Overall · Case của mình mở sẵn
- `a2-gv-ky-nang-1440-toi.png` — cùng em, bấm ô L · Hành trình + Tiến độ + Case của L
- `a3-vai-xem-1440-toi.png` — CX (vai 24) · vai xem: nút rời, khối Đang xử lý, không Case nào mở sẵn
- `b-gv-375-sang.png` — 375: Case trước, Tiến độ sau · bảng Mock Test một dòng mỗi lượt
- `c-gvcn-nhieu-case-1440-toi.png` — GVCN (vai 7) · Trịnh Bảo Ngọc (id 70) · 4 Case, 2 Case của mình mở sẵn, nút việc ở dòng

## Truy vết khung → thành phần → ảnh

| # | Dòng bảng ý | Thành phần web | Kết quả | Ảnh |
|---|---|---|---|---|
| 1 | Đầu hồ sơ nhãn trên – giá trị dưới, vạch ngăn; "Tuần học", "Thi thật" | `DongThongTin` (`.o-tin`) | KHỚP | a1, b |
| 1 | Liên hệ: thẻ nhỏ mờ (PH · email · ngày sinh), "PH: chưa có" | `DongLienHe` (`.the-phu.nhat`) | KHỚP | a1 |
| 2 | Ô điểm: một dòng phụ "MT2 · kỳ vọng 7.5", bỏ chênh lệch; ô chọn viền nhấn | `DiemDau` / `ODiemTo` | KHỚP | a1, b |
| 3, 8 | Thẻ việc "Ghi kết quả PA · {kỹ năng}" + thẻ Kỳ / PA + hạn + nút "Ghi kết quả PA" | `viecHocVien.ts` + `OViec` | KHỚP | (dữ liệu demo 14/09 chưa tới kỳ ghi — ô việc khác cùng khuôn ở a1, c) |
| 4, 11 | Case: mỗi Case một dòng tóm tắt (thẻ kỹ năng · tên · SOS · hạn | MT ✗ điểm / kỳ vọng · PA · phụ trách); xếp của mình → quá hạn → còn lại | `CotCaseHv` | KHỚP | a1, c |
| 4 | Case của người xem mở sẵn; bấm dòng mở / gập, mở nhiều được; "n Case đã đóng" gập | `CotCaseHv` | KHỚP | a1, c |
| 5 | Tiến độ: Overall chỉ đọc, mỗi kỹ năng một dòng gần nhất / "Chưa có ghi nhận"; chọn kỹ năng → danh sách + "+ Ghi tiến độ" | `TienDoTrenLop` | KHỚP (W gộp — KHÁC 2) | a1, a2 |
| 6 | Case mở = một khung trường nhãn trái (Mở · Nguyên nhân · Mô tả · Phương án · Kết luận · Lịch sử · Bằng chứng) + chân nút | `DauMuc` khi `ThanTrongCot`, `NganCase` trong cột | KHỚP | a1, c |
| 7 | Mô tả dài ≤ 3 dòng + "Xem đầy đủ", không cắt dữ liệu; Dịch giữ | `MoTaGon` (`CasePanel`) | KHỚP | — (demo không có mô tả > 180 chữ) |
| 9 | Một việc một chỗ: nút việc ở dòng tóm tắt; Case mở không lặp (chân giữ Hoàn thành Case) | `anViecChinh`, `anNutMoTa` | KHỚP | c |
| 13 | Tiêu đề khối 17 / 700 (Mock Test · Hành trình · Tiến độ · Case) | | KHỚP | a1 |
| 14 | Mock Test: "Chưa tới tuần" một ô; Kết quả "✓ Đạt kỳ vọng" / "SOS n · L, W" (bỏ "Đã đủ điểm", UA-Q4) | `KetQuaMt` | KHỚP | a1, c |
| 15 | TVV / CX: nút rời, Đang xử lý, không Case mở sẵn, không nút ghi | | KHỚP | a3 |
| 16 | 375: Case trước Tiến độ; thẻ Case gập chỉ 1 dòng + hạn; Mock Test một dòng / lượt | | KHỚP | b |
| D7 | Bằng chứng trống: "chưa có · + Thêm"; bấm mới mở khung tệp / liên kết | `ThanCase` | KHỚP | a1 |
| 10 | Hộp hành trình 375 = khay đáy (B3) | — | BỎ ở PR này | → PR U07 (13-ra-ux-a mục 7) |
| 17 | Tab Ý thức & Phối hợp | — | GIỮ nguyên | UI-3 của AUDIT-Y-THUC (PTA 03/11) |

KHỚP 15 / 16 dòng có trong PR (bỏ dòng 10 chuyển U07) = 94 %.

## KHÁC (PTA Plan trả lời [XM] 03/11)
1. Chân Case **"Hoàn thành Case"** (mockup "Kết luận Case…") — KHÁC có lý do: một khái niệm một tên (panel, Công việc, Rulebook đều "Hoàn thành Case").
2. Tiến độ Overall **một dòng W** (mockup W1 / W2) — KHÁC có lý do: bài trên lớp chỉ ghi chung "writing" (SV-BAI-LOP-2), không tách được. Ô điểm MT vẫn W1 / W2.
3. ~~Ô mặc định~~ → đã sửa theo mockup: FT mặc định **Overall** (lớp thường không có Overall: giữ môn có Case gấp nhất). Ảnh a1 chụp lại không cần bấm.
4. ~~Trường "Mở"~~ → đã sửa theo mockup: "Mở" là trường sau Mô tả trong khung Case.
5. Chỉ việc "Ghi kết quả PA" đổi chữ + thẻ phụ; việc khác giữ chữ cũ (PTA đồng ý).

## Thao tác TRƯỚC → SAU

| Trước (main) | Sau | Giữ / đổi — vì sao |
|---|---|---|
| + Case · ⋯ (Sửa thông tin, Tạm dừng / Kết thúc học, Kết quả thi thật, Lịch sử…) · Trước / Sau · Gia hạn | như cũ | GIỮ |
| Bấm ô điểm đổi kỹ năng (Hành trình + Tiến độ + Case) | như cũ | GIỮ |
| Thanh việc: nút "Kết quả" / "Kết quả cuối" | "Ghi kết quả PA" / "Ghi kết quả cuối" | ĐỔI chữ (dòng 8) |
| Mọi Case mở đủ trong cột | dòng tóm tắt, của mình mở sẵn, bấm mở / gập; đã đóng gập | ĐỔI — UA-Q1 |
| Nút việc tiếp ở chân từng Case | nút ở dòng tóm tắt (mở thẳng form trong Case); chân giữ Hoàn thành Case | ĐỔI vị trí (dòng 9) |
| Sửa · Đổi người… ở dải đầu Case | ở chân Case cùng + Thêm PA | ĐỔI vị trí (mockup) |
| + Thêm PA · Ghi kết quả · Xác nhận PA · Mô tả Case · Mở lại · Lịch sử · Dịch · ⋯ PA | như cũ, trong Case mở | GIỮ |
| Bằng chứng: khung kéo thả luôn hiện | "chưa có · + Thêm" → bấm mở khung (có bằng chứng: như cũ) | ĐỔI — D7 |
| Tiến độ ở Overall: danh sách mọi kỹ năng + "+ Ghi tiến độ" | Overall chỉ đọc (gần nhất từng kỹ năng); ghi / sửa / xoá khi chọn kỹ năng | ĐỔI — N33 ② (mất ghi ở Overall: chọn ô kỹ năng là có, ít hơn một bấm) |
| Mock Test 375: thẻ đủ điểm từng kỹ năng | một dòng MTn › · tuần · OVR · Kết quả; điểm từng kỹ năng ở hồ sơ lượt | ĐỔI — mockup B1 |
| Biểu đồ / Bảng · hộp hành trình · tab Ý thức · Lộ trình & lớp | như cũ | GIỮ |

## Turso
Không đường API mới. Mở hồ sơ: cột Case chỉ gọi `/cases/:id` + `/attachments` cho **Case đang mở** (trước: mọi Case) — em 4 Case, mở sẵn 1–2 → bớt 2–3 cặp lời gọi / lần mở. Dữ liệu dòng tóm tắt lấy từ `skill-board` đã nạp.
