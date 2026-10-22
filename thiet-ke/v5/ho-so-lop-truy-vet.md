# Truy vết — `ho-so-lop.html` (Hồ sơ lớp)

> V5-B2, dựa trên nền V5-A. **ĐỀ XUẤT THIẾT KẾ** — chờ chủ SP duyệt. Dữ liệu demo (MB FT 101 22 HV: 6 HV nền + 16 HV [B2] để khớp 15/20 đạt).
> Rà mã: `b2-ra-soat.md` mục 2. Tham số: `?lop=ft101|fou12|cp110&vai=ha|khoa|vy&tab=hoc-vien|dau-ra|y-thuc&viec=…&luot=MT2|MT3&khung=…&theme=dark`.

## 1. Yêu cầu → khung → thành phần

| Yêu cầu | Khung (ảnh `anh/`) | Thành phần |
|---|---|---|
| Brief 10 đầu trang gọn | `lop-ft-1440-sang`, `-toi` | Một dòng: mã lớp · chương trình · GVCN · số HV · tuần; một dòng số: Đạt MT2 75 % (15/20, ô số → panel báo cáo) · SOS 5 HV · Thi tháng này 1 · Việc của tôi ở lớp 6; hai nút + Case, ⋯ |
| Tab có mục đích, ít tầng | `lop-ft-*`, `lop-fou12-1440` | Học viên · Ý thức & Phối hợp · Phân tích lớp (+ Đánh giá đầu ra khi lớp có việc này); bảng chính hiện ngay, không lớp "cách xem" thứ hai |
| C18 / T13 tách W1 / W2 | `lop-ft-1440-sang`, `lop-ft-375` | Cột W1, W2 riêng; cột W nền xám nhạt chỉ để tính Overall (ⓘ công thức); thẻ 375 vẫn W1 · W2 |
| C21 cột Ngày thi đúng ngày / chưa chốt | `lop-ft-1440-sang` | Badge nhóm lịch thi: "Ngày thi 17/09" nền đặc + "còn 3 ngày" · "Dự kiến FEB 2027" viền · "Chưa có lịch" viền xám — dự kiến không trông như đã chốt |
| C19 nhiều việc một HV, việc người xem trước | `lop-ft-1440-sang` (cô Hà), `lop-ft-c19-khoa-1280` (thầy Khoa) | Mỗi việc một dòng; việc của người xem = nút động từ có chấm hồng + badge tiến độ; việc người khác = chữ phụ có tên. Cùng HV Lê Quang Huy: cô Hà thấy PA R + Xử lý vi phạm trước, thầy Khoa thấy PA W1 trước · máy chủ → SV-LOP (`GET /classes/:id/viec-theo-em`) |
| Việc cấp lớp ở hàng riêng, lưới nhập gập | `lop-ft-1440-sang` | Dải "VIỆC CẤP LỚP · Nhập điểm MT3 · L, R · L 1/22 · R 1/22 bài · Hạn 23/09 · Mở lưới MT3 ▾" (gập mặc định, không cuộn bất ngờ) |
| C17 panel việc tại chỗ, đúng HV + kỹ năng | `lop-panel-viec-1440`, `lop-panel-t21-375` | Bấm "Ghi kết quả PA · R" → khung phải 480 px: loại (vạch hồng) → tiêu đề → bối cảnh (lý do Case, PA) → Kết quả PA (5 lựa chọn mã `FOLLOWUP_OUTCOMES`) → ghi chú → lịch sử gập → chân lưu. Hàng đang mở = nền nhấn + vạch trái |
| Trạng thái lưu, việc kế | `lop-panel-da-luu-1440`, `lop-panel-loi-luu-1440` | "✓ Đã lưu 10:42" + "Đóng" + "Việc kế: Xử lý vi phạm · Lê Quang Huy ›"; lỗi giữ chữ + Thử lại |
| T15 hai người cùng sửa | `lop-t15-xung-dot-1440`, `-375` | Ô điểm bấm → panel "Sửa R · MT2"; khung vàng "QL Nguyễn Khánh Vy vừa lưu R = 5.5 lúc 10:41 … bản của bạn vẫn giữ" + "Dùng bản mới" / "Lưu bản của tôi đè lên"; lịch sử có dòng của QL |
| C17 / T12 đánh giá đầu ra liên tiếp trong panel | `lop-t12-dau-ra-1440`, `-toi`, `-375` | Tab "Đánh giá đầu ra 2/12" (MB FOU 12) → "Đánh giá lần lượt · từ em 3"; panel "3 / 12" + thanh 12 vạch; bảng Progress → Final 4 kỹ năng; Kết quả (máy tính); Nhận xét GVCN; Đề xuất bước tiếp (Lên lớp kế · Lên FT · Học lại · Tạm dừng · Dừng học); "Lưu" · "Lưu và em tiếp" |
| Brief 10 Ý thức & Phối hợp phân cấp màu | `lop-y-thuc-1440`, `-toi`, `-375` | Bảng theo HV, 4 cột nghĩa: Vi phạm chờ (nền vàng nhạt; quá hạn nền đỏ nhạt + ⚠) · Bậc xử lý (thang: bậc qua ✓ xanh, bậc lần này viền nhấn) · Duyệt · thu hồi (chữ) · Báo PH (viên tiến độ). Một CTA mỗi hàng. Lịch sử "Đã xử lý · 7 ngày" gập. Phối hợp SOS = khung xanh nhạt riêng, học thuật |
| Báo PH (TVV) trên hàng Ý thức | `lop-y-thuc-bao-ph-1440` (CP FT 110) | Ngô Hải Yến, Lý Tuấn Bình: "Chờ báo PH · hạn 18/09" (lưu 14/09 + 4, 23:59); "Thu hồi được — cần QL duyệt, giữ lịch sử" |
| Chỉ xem / tải / lỗi | `lop-chi-xem-1440`, `lop-tai-1440`, `lop-loi-tai-1440` | Lớp đã kết thúc: dải chỉ xem, ẩn nút động từ; khung xương; `bao-loi` + Tải lại |

## 2. BỎ / GIỮ

| | Thứ | Lý do |
|---|---|---|
| BỎ | Nhãn "Hồ sơ lớp" trên h1, hộp GVCN riêng, dòng GV bộ môn "+k", "Final Test du/tong" ở đầu (`DauTrangLop.tsx:151-249`) | Brief 10 đầu gọn; GV bộ môn xem ở ⋯ › Thông tin lớp |
| BỎ | 6 "cách xem" trong tab Học viên (`TabHocVienLop.tsx:35-37`) | Quá nhiều tầng; Góp ý tuần, Lộ trình tiếp, Cần hỗ trợ, Thông tin lớp → chip lọc / ⋯ / tab Đánh giá đầu ra |
| BỎ | Cột "Theo dõi" chỉ 1 việc (`ClassRoster.tsx:387-394`) | C19 |
| BỎ | Việc là `<Link>` đổi trang (`thaoTacDongHocVien.tsx:58-66`) | C17 panel tại chỗ |
| BỎ | Modal giữa màn `HopKetQua` từng em (`BangLoTrinhTiep.tsx:505-575`) | T12 panel liên tiếp |
| BỎ | Khung phải "dòng thời gian mọi vi phạm cả lớp" mở sẵn, 5 tiêu đề nhóm cùng xám (`ClassYThucCard.tsx:193-203, 321`) | Brief 10 |
| BỎ | Lưới điểm mở sẵn dưới mọi tab (`ClassOverviewPage.tsx:48, 145`) | Gập, chỉ ở tab Học viên |
| GIỮ | Công thức W, Overall (`scoring.ts`), thang Ý thức (`yThuc.ts:128`), lựa chọn bước tiếp (`lenLop.ts:15`), Case outcome | Nghiệp vụ |
| GIỮ | GVCN đề xuất, QL chốt bước tiếp | Quyền hiện hành |

## 3. Giả định · cần xác minh

- **[B2]** 16 HV MB FT 101, 12 HV MB FOU 12, điểm Progress /25, nội dung vi phạm Huy / Ngọc, PA "skimming + scanning", "Report 1 đã duyệt 25/08" của Ngọc, liên hệ PH — bổ sung cho mockup.
- **Đã chốt R3a (`08` mục 1) → SV-LOP:** lớp thường chỉ đánh giá đầu ra khi Final đủ điểm; trước đó "Chờ Final" (`classRoster` → `dauRa.trangThai = 'cho-final'`). Câu [XM] dưới thay bằng luật này.
- ~~**[XM] T12 với dữ liệu tới 14/09:** MB FOU 12 chưa có Final (L, R thi 14/09 chưa nhập; W 21/09; S 28/09) → Kết quả hiện "– Chưa đủ dữ liệu", GVCN vẫn ghi nhận xét + đề xuất. Khi đủ Final, cùng panel hiện Đạt / Chưa đạt (mã hiện: KQĐR chỉ sau QL chốt Lên FT + có MT0 — `BangLoTrinhTiep.tsx:180-182`). Cần chủ SP xác nhận đánh giá đầu ra lớp thường có thể bắt đầu trước khi đủ Final.~~
- **[ĐX]** "Đánh giá đầu ra" là tên tác vụ (không dùng "Kết quả lớp trước" — brief 10).
- Mockup chưa vẽ: QL chốt bước tiếp trong cùng panel (dùng cùng khung, thêm nút "Chốt"), tab Phân tích lớp (B3).

> → PR #547 (UI-HO-SO-LOP): khu b + T12 làm; GIỮ V4 (Cách xem, GV bộ môn, khối Điểm lớp, tab Ý thức) ghi [XM] — chấm trong `docs/anh/ui-ho-so-lop/khop-khac.md`.
