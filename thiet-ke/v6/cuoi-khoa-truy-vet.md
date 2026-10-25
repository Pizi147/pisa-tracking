# Truy vết — `cuoi-khoa.html` (V6 · Cuối khoá lớp thường)

> **MOCKUP-V6 · CHỜ CHỦ SP DUYỆT**. Mở khoá P9. Nguồn: spec 24/10 mục 3.9, R5.1–R5.3, GPT 1–4, 9; Rulebook §20.6–20.9; tham chiếu `thiet-ke/mockup-cuoi-khoa-2-2026-10-08.html` phần 1–4.
> **Q9 sửa 25/10 theo quy chế lớp thường** (chủ SP, "Quy định và Chế tài lớp thường" — P. Học thuật): Kết quả đầu ra **máy tự ghi** theo Final; **chỉ em Lên FT** có Đạt / Không đạt **kỳ vọng** (chỉ QL). Mã đối chiếu: `shared/domain/cuoiKhoa.ts` (`chuHopKetLuan`, `goiYCuoiKhoa`, `NGUONG_KY_VONG`, `goiYKyVong`), `shared/domain/chuyenLop.ts` (`khacGoiY`, `kiemDongLenh`).
> Ảnh: `anh/cuoi-khoa-{1440-toi,375}.png`, từng khung `anh/cuoi-khoa-k1…k9-*.png` (+ `-375`). Dữ liệu demo: khung 2 **T5 17/09 · W3 SEP** (trước Final); khung 3–9 **T5 24/09 · W4 SEP**, MB FOU 12 Final 21/09 đã chấm đủ (lệch `du-lieu-demo.md` có Final rải 14–28/09).

## 1. Yêu cầu → khung → thành phần

| Yêu cầu | Khung (ảnh) | Thành phần |
|---|---|---|
| GPT 1 một không gian, ba lối vào | k1 `-k1-loi-vao` | Công việc QL "Chốt lộ trình · MB FOU 12" · hồ sơ lớp ⋯ "Cuối khoá…" · hồ sơ HV "Cuối khoá … ›" → cùng trang con hồ sơ lớp |
| Trước Final (tình huống thường gặp nhất, §20.6 hạn hết CN trước tuần Final) | k2 `-k2-truoc-final` | Kết quả đầu ra "Chờ Final · 0/4 môn" + "Progress 24/08 · 3/4 môn đạt · Không đạt: P"; Gợi ý = đề xuất GVCN; QL chốt được; em Lên FT "Kỳ vọng · Chờ MT0" (nút tắt); chân "Bổ trợ Final và Xét lại lộ trình tự sinh khi có Final" |
| Q9 Kết quả đầu ra máy ghi | k3 `-k3-bang-ql` | MỘT cột: dòng 1 % Final + ✓/✗ + dải (Pass · Lên BE + bổ trợ · Quản lý cân nhắc · Học lại FOU · Quản lý báo phụ huynh qua TVV) — không nút; dòng 2 % từng môn, môn < 70 % có ✗; thiếu → "Chờ Final · 3/4 môn". Giữ cột "Gợi ý · GVCN" |
| R5.1 chọn nhóm, áp chung, ô gõ lớp cùng chi nhánh, mở lớp tại chỗ | k3 | Chọn tất cả · 12 + chọn nhóm theo Hướng (đếm em); thanh "Áp cho n em": Hướng · Lớp (gõ-tìm, chỉ MB, "+ Mở lớp mới…") · Tuần — không còn cụm Kết quả đầu ra chung |
| Kỳ vọng FT chỉ em Lên FT | k4 `-k4-ngoai-le-ky-vong` | khối "Kỳ vọng IELTS 4.0 · MT0 x" + band 4 kỹ năng + Đạt / Không đạt (máy gợi ý, chỉ QL); Không đạt → Nguyên nhân Trung tâm (kỹ năng điền sẵn = kỹ năng MT0 dưới ngưỡng, sửa được, "→ Case + Tutor 10 buổi/kỹ năng") / Học viên (ô Phương án, không Case — biến thể dưới bảng); chọn nhóm "Lên FT" → thanh có cụm Kỳ vọng FT |
| Hướng khác gợi ý → Lý do | k4 | Hứa Đức Anh 46 % (gợi ý Học lại) chọn Lên BE → ô "Lý do" ngay dưới ô Hướng ("Ghi lý do ngắn" khi trống) |
| GPT 3 tóm tắt tác động | k2–k6 chân | "Khi chốt: n em sẵn sàng · → lớp · tuần" + "Tạo n Case bổ trợ Final · n việc Báo PH qua TVV · n Case Tutor FT · em chưa có hướng / chờ lớp" + Lưu nháp · Chốt · n em |
| Review Focus 2 mở lớp giữa chừng | k5 `-k5-mo-lop-moi` | hộp Mở lớp mới → lớp điền vào thanh, 3 em vẫn chọn; lỗi mã trùng tại ô |
| GPT 4 / Review Focus 3 lỗi một phần | k6 `-k6-loi-mot-phan` | "✓ Đã chốt 5 em · ⚠ 2 em chưa lưu"; dòng lỗi giữ dữ liệu + lý do; lọc "Lỗi 2"; "Thử lại 2 em" |
| §20.6 GVCN đề xuất | k7 `-k7-gvcn` | GVCN chỉ đề xuất Hướng + Nhận xét (dùng cho Báo PH qua TVV); Kết quả đầu ra máy ghi; Kỳ vọng FT chỉ đọc (Rulebook :842 chỉ QL); em đã chốt khoá + "Bạn đề xuất: …" |
| R5.3 lớp FT | k8 `-k8-lop-ft` | bỏ ⋯ "Chuyển tiếp lớp…"; chọn em → Chuyển lớp… |
| 375 | k9 `-k9-375`, `cuoi-khoa-375` | thẻ em (% + dải); tấm "Áp cho n em" Hướng · Lớp (Kỳ vọng FT chỉ khi nhóm Lên FT); chân tóm tắt dính đáy |

## 2. Thao tác TRƯỚC → SAU

Nguồn TRƯỚC: `BangLoTrinhTiep.tsx` (hộp "Lộ trình · em", `<select>` lớp), `TabDauRa.tsx` (tab "Đánh giá đầu ra", từng em "Lưu và em tiếp"), `HopKetQua` (KQĐR Lên FT, một em một lần), `TransitionPanel.tsx` (FT: Áp cho n em, + Mở lớp mới…, 1 Soạn › 2 Xác nhận).

| Tình huống (bảng 10.3) | Trước | Sau |
|---|---|---|
| Cả lớp cùng hướng, 3 em khác hướng (12 em) | chọn từng em › Lộ trình… › hướng › lớp (`<select>`) › Chốt; rồi hộp 3 em riêng ≈ **25 bấm** | Chọn nhóm (1) › gõ lớp + chọn (2) › Áp (1) › sửa 3 dòng trên bảng (6) › Chốt (1) = **11 bấm** |
| Kết quả đầu ra cả lớp | tab Đánh giá đầu ra, ~3 bấm / em (≈ 36) | **0 bấm** — máy ghi theo Final |
| Kỳ vọng em Lên FT | HopKetQua từng em, chỉ sau khi chốt lệnh | chọn nhóm "Lên FT" › Đạt / Không đạt › Nguyên nhân › Áp (4) — hoặc bấm trên dòng; máy gợi ý sẵn từ MT0 |
| Tạo lớp ngay khi chọn lớp đích | không có ở lớp thường (rời bảng, mất lựa chọn) | "+ Mở lớp mới…" › điền › Mở lớp (3), em vẫn chọn |
| Chốt trước Final | được (thiếu điểm vẫn chuyển) | giữ; Bổ trợ Final / Xét lại lộ trình tự sinh khi có Final |
| Chốt nhiều em, một số em lỗi | toast "n em chưa lưu" | giữ + lọc "Lỗi n" + "Thử lại n em" |
| GIỮ | Lưu nháp, Huỷ quyết định, Hoàn tác, bàn giao + hạn, `huong_gvcn`, việc "Chốt lộ trình · lớp", "Ngay hôm nay", Xét lại lộ trình, Lý do khi khác gợi ý | như cũ |
| BỎ | tab "Đánh giá đầu ra", nút Đạt / Không đạt theo Final, hộp KQĐR riêng, bước "2 Xác nhận", ⋯ "Chuyển tiếp lớp…" lớp FT, dải "Chưa chuyển được" | Q9 sửa 25/10, R5.3 |

## 3. Giả định · cần xác minh

- Ngưỡng kỳ vọng FOU → FT = 4.0 (`NGUONG_KY_VONG` FOU 4 · BE 4 · ELE 4.5, OV-3b) — **[XM] đã đóng**, giữ.
- **Nhãn (PTA Plan 25/10):** tên cột = "Kết quả đầu ra"; khối FT = "Kỳ vọng" + chữ quy chế `KY_VONG_DAU_RA` (FOU IELTS > 3.5 · BE IELTS 4.0 · ELE IELTS 4.5–5.0). P9 đổi tiền tố cũ "Kết quả đầu ra (…)" ở `chuHopKetLuan` thành "Kỳ vọng …" (một khái niệm một tên). Mockup ghi "Kỳ vọng IELTS 4.0" là minh hoạ — web dùng đúng chữ quy chế.
- **Báo PH (PTA Plan 25/10):** giữ theo dải — Final < 50 % luôn có việc Báo PH qua TVV, kể cả khi QL cho lên (như k4). P9 kiểm mã hiện có giữ đúng như vậy.
- Progress ở khung 2 hiện theo môn (T58, `nhanKetQuaThuong`): "Progress 24/08 · 3/4 môn đạt · Không đạt: P"; đủ đạt "4/4 môn đạt".
- Nguyên nhân dùng chữ "Học viên" (như mã `HopKetQua`), không "Học sinh".
- Lý do khi khác gợi ý theo `khacGoiY`: gợi ý "lên" khớp Lên BE + Lên FT; "học lại" khớp Học lại; 50–59 % không gợi ý → không bắt lý do.
- Hướng "Tạm dừng/ Kết thúc học" thay "Tạm dừng học" + "Dừng học hẳn" (cùng luật trang-thai-hv).
- Dữ liệu demo V6: Final % từng môn, MT0 4.5 (Đinh Bảo Anh) / 3.5 (Phí Ngọc Diệp, R W S < 4.0), lớp MB BE 05 / 06 / 07, MB FT 106, MB FOU 14 / 15.
