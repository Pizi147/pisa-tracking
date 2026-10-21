# 04 — Mâu thuẫn V4 → quyết định V5 → màn bị ảnh hưởng

> V5-A, 22/10. Nguồn: brief 00 mục 3–4, `01-quyet-dinh-22-10.md` mục 2–3, mockup V4 `thiet-ke/mockup-v4-*` + truy vết, `DESIGN.md` "Luật 21/10".
> Quy tắc: truy vết V4 **không còn ra lệnh** khi trái brief (brief 4 cuối). Cột "Căn cứ" chỉ ghi CHỐT khi có trong brief mục 3 / quyết định 22/10.

| # | V4 / luật cũ | Quyết định V5 | Căn cứ | Màn bị ảnh hưởng |
|---|---|---|---|---|
| M1 | Tổng quan = hàng đợi việc + form làm việc ở giữa (bố cục B, Q-A2) | Tổng quan = tình hình theo vai: 3–4 chỉ số + 2 khối + cột "Chờ bạn / Đi tiếp" (`07` mục 2, phương án B) | CHỐT C04 | Tổng quan mọi vai |
| M2 | TVV không có menu Công việc; việc TVV ở Tổng quan (Q-A1 ①, `DESIGN.md` G3) | TVV có **Công việc** riêng; Tổng quan TVV chỉ tình hình | CHỐT C05 | Thanh điều hướng, Tổng quan TVV, Công việc TVV, `DESIGN.md` G3 phải sửa |
| M3 | Panel chỉ số loại C có "Thêm PA / Tạo Case" | Panel báo cáo **chỉ đọc**: định nghĩa, phạm vi, tử / mẫu, bảng; không form / CTA | CHỐT C22 | Báo cáo, Phân tích, Tổng quan (số), Hồ sơ GV (số) |
| M4 | Tab "Tình trạng chấm" riêng (mockup V4; **mã hiện không có**) | Gộp vào Lịch tuần theo quyền QL / Admin; chưa tới hạn = trung tính, quá hạn thiếu điểm = đỏ ⚠ | CHỐT C13 | Test › Lịch tuần |
| M5 | Lịch Test ba khung (tuần trước / này / sau) | Một tuần đang xem + ‹ ›; tuần cũ xem / sửa theo quyền | CHỐT C13, brief 8.2 | Test › Lịch |
| M6 | Chấm Test thứ tự cũ | Quá hạn → Hạn tuần này → Bài thi Speaking tuần này (mở) → Hạn tuần sau (gập) | CHỐT C14 | Test › Chấm Test, Công việc GV |
| M7 | Speaking chấm chéo = nợ của mọi GV S / chỉ GV dạy S thấy | Mọi GV có kỹ năng S thấy bài S tuần này trong chi nhánh được phép; **không** là nợ cá nhân | CHỐT C12 | Chấm Test, Công việc, Tổng quan GV, Hồ sơ GV (Hành chính) |
| M8 | TVV 4 hàng chip (cách liên hệ, PH phản hồi, đồng ý phối hợp…) | Form: Đã báo PH / Chưa liên hệ được + Ngày (mặc định hôm nay) + Ghi chú; "Chưa liên hệ được" = một lần thử, việc còn mở, giữ hạn | CHỐT C15 | Công việc TVV, hồ sơ HV (Ý thức & Phối hợp) |
| M9 | Hạn việc TVV chưa rõ | 23:59 giờ VN ngày (lưu + 4) | CHỐT 22/10 | Công việc TVV, Tổng quan TVV, đếm quá hạn |
| M10 | "Cập nhật KQ thi thật" nằm ở Lịch thi | Sau thi một tuyến: KQ thi thật → Bước tiếp; lưu điểm riêng → "Đã có kết quả · Chưa chốt bước tiếp" | CHỐT C16 | Lịch thi (HV & Lớp), Phân tích › Kết quả thi (chỉ đọc), Công việc TVV, hồ sơ HV |
| M11 | Mobile bỏ W1 / W2 | Giữ: HV & Lớp W tổng + "W1 · W2" dòng phụ; hồ sơ lớp hai cột W1, W2 | CHỐT C18 | HV & Lớp, Hồ sơ lớp, thẻ 375 của `Bang` |
| M12 | "Đạt" chỉ là chữ, SOS có chip | Đạt / Chưa đạt / Chưa đủ dữ liệu cùng họ badge viền với SOS; "Đã thi · chờ KQ" thuộc nhóm lịch thi (nền đặc, góc vuông) | CHỐT C23 | Mọi bảng có kết quả; `ChipSos`, `Nhan` |
| M13 | Lịch / việc tự gợi ý MT4 sau MT3 | Bỏ gợi ý + chỉ số "xong MT3 chưa MT kế" (`02` mục 3); QL thêm tay ở Kế hoạch Test; MT4+ đã có giữ nguyên | CHỐT C20 | Tổng quan QL, Báo cáo, Kế hoạch Test |
| M14 | V4 Chấm Test nói QL nhập hộ, V4 Công việc nói QL không `score.edit` | Mã: QL / Admin / QT **nhập hộ được** (qua `plan.week` / `score.override`), không phải nợ của họ → mọi lối vào cùng ô "Nhập hộ" + lý do khi sửa | brief 4 + mã (`03` mục 2) | Lịch tuần, Hồ sơ lớp, Hồ sơ HV, Công việc (QL chỉ xem) |
| M15 | "Cùng số" nhưng nơi đếm bài, nơi đếm nhóm việc | Đơn vị luôn ghi: **việc / bài / HV / lượt / Case**; chỉ bắt bằng nhau khi cùng đơn vị + phạm vi; badge Công việc = số **việc** của người xem | brief 4, 7 | Thanh điều hướng, Công việc, Tổng quan, Chấm Test |
| M16 | Sau lưu: nơi chuyển ngay, nơi đợi 10 s, nơi "Việc kế" | Một luật: **Lưu** ở lại; **Lưu và tiếp** chuyển sau khi lưu xong; lỗi → ở lại giữ chữ; không tự chuyển theo giờ | brief 4, 5.3 | Mọi panel việc |
| M17 | Ghi chú "đã / chờ chủ SP duyệt" trong nguồn V4 | Không suy ra đã duyệt; mockup V5 ghi rõ "ĐỀ XUẤT THIẾT KẾ" tới khi chủ SP duyệt | brief 4 | Mọi tệp `thiet-ke/v5/` |
| M18 | Brief 3: "không dùng luật MT cũ gặp `-` thì huỷ ngay" | **Giữ #503**: MT cũ (≥ 2 tuần) `-` = huỷ ngay (Hoàn tác 10 s); MT hiện tại lần 1 dời, lần 2 huỷ, đếm theo tuần — câu brief **không áp** | CHỐT 22/10 (thắng brief) | Lịch tuần, Chấm Test, hồ sơ HV (T05) |
| M19 | `DESIGN.md` G13 / màu `accent` xanh pastel, SOS 3 magenta | Hệ màu PISA từ logo (`v5-nen.css`); SOS 3 đỏ (hồng chỉ để nhận diện) | CHỐT C02 + brief 5.2 | Toàn hệ; `index.css`, `DESIGN.md` (cập nhật sau khi chủ SP duyệt) |
| M20 | Hồ sơ GV: bảng đếm nhóm → Công việc | Hai nhóm Hành chính + Giảng dạy – Học thuật, phương án C | CHỐT C06 | Hồ sơ GV |
| M21 | Phân tích GV nhiều bảng / tô màu ngưỡng | Một bảng, hai nhóm cột; bỏ màu < 50 / ≥ 70 (không xếp loại) | CHỐT C07, C08 | Phân tích › GV |
| M22 | Phân tích GV tính kỹ năng dưới kỳ vọng là chưa đạt kể cả khi Overall đạt (`phanTichLop.ts:149-152`) | Quy tắc Overall: đạt → không tính kỹ năng tạch; thiếu Overall → trạng thái riêng | CHỐT C09, C10 | Phân tích GV, Hồ sơ GV, Báo cáo GV |
| M23 | Nhãn cột "Thi thật" ở lịch | "Ngày thi" (không đổi "Kết quả thi thật", "Điểm thi thật") | CHỐT C21 | HV & Lớp, Hồ sơ lớp, Lịch thi |
| M24 | Ghi nhận tuần / bài trên lớp sinh việc | Tuỳ chọn, không sinh việc, không trộn vào MT / KPI | CHỐT C11 | Hồ sơ HV (Hành trình), Hồ sơ lớp |

## Luật trong `DESIGN.md` "Luật 21/10" cần sửa khi chủ SP duyệt V5

| Luật | Sửa |
|---|---|
| G3 "TVV không thêm mục Công việc"; "việc của tôi ở trang đầu vai" | TVV có Công việc (C05); Tổng quan không chứa việc (C04) |
| G6 ô số / "›" / ↗ / ⓘ | GIỮ — bảng mẫu V5 mục 4 dùng đúng |
| G12 màu kết quả tô chính con số | GIỮ (màu mới) |
| G13 thang chữ | GIỮ |
| G14 đang chọn = nền nhấn nhạt + vạch trái 3 px | GIỮ (màu mới) |
| "5 nghĩa" mục Colors; SOS magenta; Đạt chỉ chữ | THAY bằng `v5-nen.css` + 4 nhóm badge |
