# Truy vết — `cuoi-khoa.html` (V6 · Cuối khoá lớp thường)

> **MOCKUP-V6 · CHỜ CHỦ SP DUYỆT** (25/10). Mở khoá P9. Nguồn: spec 24/10 mục 3.9, R5.1–R5.3, GPT 1–4, 9; Q9 (chủ SP chọn khuyến nghị 25/10); Rulebook §20.6–20.9; tham chiếu `thiet-ke/mockup-cuoi-khoa-2-2026-10-08.html` phần 1–4.
> Ảnh: `anh/cuoi-khoa-{1440-toi,375}.png`, từng khung `anh/cuoi-khoa-k1…k8-*.png` (+ `-375`). Dữ liệu demo **T5 24/09/2026 · W4 SEP** — MB FOU 12 Final 21/09 đã chấm đủ (lệch `du-lieu-demo.md` có Final rải 14–28/09; đổi để có Final đủ cho cột Kết quả đầu ra).

## 1. Yêu cầu → khung → thành phần

| Yêu cầu | Khung (ảnh) | Thành phần |
|---|---|---|
| GPT 1 một không gian, ba lối vào | k1 `-k1-loi-vao` | Công việc QL "Chốt lộ trình · MB FOU 12" (một dòng / lớp, chữ đếm em) · hồ sơ lớp ⋯ "Cuối khoá…" · hồ sơ HV dòng "Cuối khoá … ›" → cùng trang con của hồ sơ lớp; từ HV thì em đó chọn sẵn |
| R5.1 chọn tất cả / nhóm, áp chung, ô gõ lớp cùng chi nhánh, mở lớp tại chỗ | k2 `-k2-bang-ql` | hàng công cụ: Chọn tất cả · 12 + chọn nhóm theo hướng gợi ý (đếm) + lọc; thanh "Áp cho n em": Kết quả đầu ra (Đạt / Không đạt → Nguyên nhân Trung tâm / Học viên → Kỹ năng "Theo Final") · Hướng · Lớp (gõ-tìm, chỉ MB, "+ Mở lớp mới…") · Tuần |
| Q9 cột Kết quả đầu ra | k2, k3 | Đạt / Không đạt bấm tại chỗ (máy gợi ý theo Final ≥ 70 %); Không đạt hiện "Nguyên nhân · kỹ năng"; em Lên FT thêm "MT0 · kỳ vọng Đạt / Không đạt" → Trung tâm = Case + Tutor 10 buổi |
| GPT 2 ngoại lệ trên dòng | k3 `-k3-ngoai-le` | ô Hướng / Lớp / Kết quả của từng dòng sửa được, chấm "đã sửa"; lớp lọc theo hướng |
| GPT 3 tóm tắt tác động | k2–k5 chân dính | "Khi chốt: n em sẵn sàng · → lớp · tuần · Case tạo · em chưa có hướng / chờ lớp" + Lưu nháp · Chốt · n em (một bước) |
| Review Focus 2 mở lớp giữa chừng | k4 `-k4-mo-lop-moi` | hộp nhỏ Mở lớp mới (Mã · Chương trình suy từ hướng · Chi nhánh khoá · Ngày bắt đầu · GVCN) → toast + lớp mới điền vào thanh, 3 em vẫn chọn; lỗi mã trùng tại ô |
| GPT 4 / Review Focus 3 lỗi một phần | k5 `-k5-loi-mot-phan` | dải "✓ Đã chốt 5 em · ⚠ 2 em chưa lưu"; dòng lỗi nền đỏ nhạt + lý do dưới tên, giữ dữ liệu; lọc "Lỗi 2" bật sẵn; "Thử lại 2 em" |
| §20.6 GVCN đề xuất, QL chốt | k6 `-k6-gvcn` | GVCN: Hướng + Kết quả + Ghi chú; em đã chốt → chữ + 🔒 + "Bạn đề xuất: …"; dải "QL đã chốt 23/09 · 5 em · Hướng khoá"; "Lưu đề xuất · 2 em" |
| Bàn giao | k2, k5 | cột Bàn giao: "Chờ bàn giao · hạn 01/10" / "Đã bàn giao" (giữ luồng bàn giao hiện có) |
| R5.3 lớp FT bỏ "Chuyển tiếp lớp" | k7 `-k7-lop-ft` | menu ⋯ lớp FT TRƯỚC / SAU; chuyển nhiều em FT = chọn em → Chuyển lớp… |
| 375 | k8 `-k8-375`, `cuoi-khoa-375` | thẻ mỗi em; thanh áp gọn "3 em đã chọn · Áp cho 3 em…" → tấm dưới; chân tóm tắt dính đáy |

## 2. Thao tác TRƯỚC → SAU

Nguồn TRƯỚC: `BangLoTrinhTiep.tsx` (tab Học viên › Lộ trình tiếp theo; hộp "Lộ trình · em" Lưu nháp / Chốt / Huỷ quyết định; thanh chọn nhiều; `<select>` lớp), `TabDauRa.tsx` (tab "Đánh giá đầu ra", từng em "Lưu và em tiếp"), `HopKetQua` (KQĐR Lên FT, một em một lần, sau khi chốt), `TransitionPanel.tsx` (FT: Áp cho n em, + Mở lớp mới…, 1 Soạn › 2 Xác nhận).

| Tình huống (bảng 10.3) | Trước | Sau |
|---|---|---|
| Cả lớp cùng hướng, 3 em khác hướng (12 em) | chọn từng em (12 ô tích) › Lộ trình… › chọn hướng › chọn lớp (`<select>`) › Chốt; rồi mở hộp 3 em riêng, mỗi em 3 bấm ≈ **25 bấm** | Chọn nhóm "Lên BE 7" (1) › gõ lớp + chọn (2) › Áp (1) › sửa 3 dòng ngay trên bảng (3 × 2 = 6) › Chốt (1) = **11 bấm** |
| Kết quả đầu ra cả lớp | tab Đánh giá đầu ra › từng em mở panel › chọn › Lưu và em tiếp (~3 bấm / em ≈ 36) + KQĐR Lên FT riêng sau khi chốt | máy gợi ý sẵn; chỉ sửa em khác gợi ý: chọn nhóm › Không đạt › Nguyên nhân › Áp (4) |
| Tạo lớp ngay khi chọn lớp đích | không có ở lớp thường: rời bảng, tạo lớp ở trang Lớp, quay lại, chọn lại em (mất lựa chọn) | "+ Mở lớp mới…" › điền › Mở lớp (3) — lớp điền sẵn, em vẫn chọn |
| Chốt nhiều em, một số em lỗi | toast "n em chưa lưu — xem lý do ở dòng" (đã có) | giữ; thêm lọc "Lỗi n" bật sẵn + "Thử lại n em" ở chân |
| GIỮ | Lưu nháp (chỉ QL thấy), Huỷ quyết định, Hoàn tác, bàn giao + hạn, đề xuất GVCN riêng (`huong_gvcn`), việc "Chốt lộ trình · lớp", chuyển ngay "Ngay hôm nay" (chọn ở ô Tuần), Xét lại lộ trình | như cũ |
| BỎ | tab "Đánh giá đầu ra", hộp KQĐR Lên FT riêng, bước "2 Xác nhận", ⋯ "Chuyển tiếp lớp…" lớp FT, dải "Chưa chuyển được" | gộp vào một bảng (Q9, R5.3) |

## 3. Giả định · cần xác minh

- [XM] **Ngưỡng kỳ vọng MT0 cho FOU → FT**: Rulebook chỉ có BE 4.0 / ELE 4.5 (`mockup-cuoi-khoa-2` phần 3). Mockup không ghi ngưỡng — P9 hỏi PTA Plan nếu FOU cần ngưỡng riêng.
- Nguyên nhân dùng chữ "Học viên" (như mã hiện có `HopKetQua`), không "Học sinh" như plan — một khái niệm một tên.
- Hướng "Tạm dừng/ Kết thúc học" thay hai hướng "Tạm dừng học" + "Dừng học hẳn" (cùng luật trang-thai-hv), ô "Có thể quay lại học" hiện ở ô Lớp của dòng đó (không vẽ).
- "Kỹ năng · Theo Final" = mỗi em lấy đúng kỹ năng dưới 70 % của mình (áp chung không ghi đè kỹ năng từng em).
- Cùng chi nhánh cho luồng cả lớp: máy chủ chặn ở `transition` / `raLenh` (spec 3.9); chuyển một em khác chi nhánh giữ (Chuyển lớp…).
- Dữ liệu demo V6: Final % và điểm từng môn của 12 em MB FOU 12, lớp MB BE 05 / 06 / 07, MB FT 106, MB FOU 14 / 15, MT0 4.5 / 5.0.
