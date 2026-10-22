# UI-HO-SO-LOP — bảng KHỚP / KHÁC (ảnh cặp `cap-*.png`)

Nguồn: `thiet-ke/v5/ho-so-lop-truy-vet.md` (13 yêu cầu + 7 BỎ + 2 GIỮ) + `dieu-chinh-cuoi.html` khu b (11 dòng) + **GIỮ V4** (chủ SP 22/10, `10` mục 8 — nâng cấp, không chép mockup).
Vai: cô Trần Ngọc Hà (GVCN, id 7) · lớp MB FT 101 (id 3), MB FOU 12 (id 6) · seed nguyên.

## Khu b (`dieu-chinh-cuoi.html`)

| # | Khung → thành phần | Kết quả |
|---|---|---|
| K1 | Đầu trang: mã lớp + nhãn nhỏ / giá trị đậm (GVCN · Học viên · Lượt gần nhất · Đạt · SOS 1·n / 2·n / 3·n) → `DauTrangLop` | KHỚP |
| K2 | Thanh Việc cần làm, mỗi việc một ô (việc · em · trạng thái hạn · `dd/mm` · nút), vạch trái theo hạn → `ThanhViecLop` | KHỚP (3 ô + "+n việc khác ở Công việc ›") |
| K3 | Chip lọc Tất cả · SOS · Chưa đủ dữ liệu + "Lượt của từng HV · tuần" (P8) → `BangHoSoLop` | KHỚP |
| K4 | Cột MT = lượt của từng em | KHỚP |
| K5 | W hiện một lần + dòng phụ W1 · W2 | KHỚP |
| K6 | Bấm W / S → điểm thành phần (người chấm, 4 tiêu chí, công thức W, "Sửa ›") → `PopThanhPhan` | KHỚP |
| K7 | Điểm to 17 px, ✓ / ✗ theo kỳ vọng lượt (`ODiem kieu="to"`, R4) | KHỚP |
| K8 | Kết quả: SOS thay "Chưa đạt" (không hai badge) | KHỚP |
| K9 | Ngày thi chip nhỏ (Thi dd/mm · Dự kiến MM/YYYY · Chưa có lịch) | KHỚP |
| K10 | Case + PA: "n Case · m PA" → mở dưới hàng, PA gắn từng Case (Kết quả · Hạn ghi KQ · thao tác theo quyền) | KHỚP |
| K11 | Thao tác PA | KHÁC — form ghi KQ không mở ngay trong hàng mà mở panel Case của Công việc tại trang (`08` dòng UI-HO-SO-LOP: "thao tác panel Công việc ngay trên trang") |

## Truy vết `ho-so-lop.html`

| # | Yêu cầu | Kết quả |
|---|---|---|
| T1 | Đầu trang gọn | KHỚP (khu b) |
| T2 | Tab có mục đích, ít tầng | KHÁC [XM] — tab Học viên · Đánh giá đầu ra · Ý thức · Phân tích đúng; hàng "Cách xem" GIỮ theo V4 (chủ SP 22/10) |
| T3 | C18 W1 / W2 | KHỚP |
| T4 | C21 Ngày thi | KHỚP |
| T5 | C19 nhiều việc một HV | KHỚP (khu b thay cột Việc bằng thanh Việc cần làm) |
| T6 | Việc cấp lớp hàng riêng, lưới gập | KHÁC [XM] — ô "Nhập điểm" ở thanh việc; khối "Điểm Mock Test của lớp" GIỮ vị trí + mở sẵn như V4 |
| T7 | C17 panel việc tại chỗ | KHỚP (`PanelViec`) |
| T8 | Trạng thái lưu, việc kế | KHỚP |
| T9 | T15 hai người cùng sửa | KHÁC — chưa xác minh (sửa điểm đi qua hồ sơ lượt, luồng cũ) |
| T10 | T12 đánh giá đầu ra liên tiếp trong panel | KHỚP (`TabDauRa`, "Lưu và em tiếp"; chỗ lưu C17 mới) |
| T11 | Ý thức & Phối hợp phân cấp màu | KHÁC [XM] — GIỮ tab Ý thức V4 (khung trái / phải, Chọn nhiều, Ghi vi phạm); làm lại = PR riêng nếu PTA Plan duyệt |
| T12 | Báo PH trên hàng Ý thức | KHÁC [XM] — như T11 |
| T13 | Chỉ xem / tải / lỗi | KHỚP |
| B1 | BỎ nhãn "Hồ sơ lớp", hộp GVCN, GV bộ môn, Final du/tổng ở đầu | KHÁC [XM] — bỏ nhãn + hộp; dòng GV bộ môn GIỮ (V4) |
| B2 | BỎ 6 cách xem | KHÁC [XM] — GIỮ (V4) |
| B3 | BỎ cột Theo dõi một việc | KHỚP |
| B4 | BỎ việc là link đổi trang | KHỚP |
| B5 | BỎ modal giữa màn từng em | KHỚP (panel phải) |
| B6 | BỎ khung dòng thời gian vi phạm mở sẵn | KHÁC [XM] — như T11 |
| B7 | BỎ lưới mở sẵn dưới mọi tab | KHÁC [XM] — như T6 |
| G1 | GIỮ công thức W, Overall, thang Ý thức, bước tiếp | KHỚP |
| G2 | GIỮ GVCN đề xuất, QL chốt | KHỚP |

## GIỮ V4 (chủ SP 22/10) — vị trí V4, màu / chữ V5

| # | Thao tác | Nơi |
|---|---|---|
| V1 | Nhập điểm · + Case · ⋯ (Thông tin lớp, Sửa thông tin HV, + Học viên, Lộ trình tiếp theo / Chuyển tiếp, Xuất Excel, Lịch sử, Mở lại / Xoá / Kết thúc lớp) | đầu trang, phải |
| V2 | Badge lớp (bài chờ chấm, việc quá hạn, thiếu GV, chờ duyệt, xếp lớp…) bấm được | dưới đầu trang |
| V3 | Dòng GV bộ môn (tên → hồ sơ GV) | dưới đầu trang |
| V4 | Trước / Sau lớp, ‹ Học viên & Lớp | đầu trang |
| V5 | Cách xem Tổng hợp · Góp ý hàng tuần · Lộ trình tiếp theo · Cần hỗ trợ · Kết quả đầu ra · Thông tin lớp; Sửa thông tin; Chọn nhiều học viên (QL) | tab Học viên |
| V6 | ⋯ từng dòng em (xử lý Ý thức, nhập điểm, chuyển lớp…), nhãn thiếu thông tin / Ý thức / mới vào, Target, Phụ huynh (TVV / CX) | bảng FT |
| V7 | Khối Điểm Mock Test của lớp (Dán từ Excel, ô sửa) | cuối trang |
| V8 | Bảng điểm lớp thường (Progress | Final) | tab Học viên lớp thường |

**Đếm:** 11 + 22 = 33 dòng — KHỚP 23 · KHÁC 10 (8 [XM] do GIỮ V4 / tab Ý thức, 1 chưa xác minh T15, 1 K11 theo `08`). **23/33 = 69,7 %**; nếu chủ SP chấp nhận 8 dòng [XM] (GIỮ V4 theo 10 mục 8) và K11: 32/33 = 97 %.

## Thao tác TRƯỚC → SAU PR (CLAUDE.md "PR giao diện V5 = nâng cấp")

| Thao tác (V4 / main) | Sau PR | Ghi chú |
|---|---|---|
| Nhập điểm (đầu trang) | GIỮ — cùng chỗ | + ô "Nhập điểm" ở thanh Việc cần làm (panel tại chỗ) |
| + Case | GIỮ | |
| ⋯ đầu trang (Thông tin lớp, Sửa thông tin HV, + Học viên, Lộ trình tiếp theo / Chuyển tiếp, Xuất Excel, Lịch sử, Mở lại / Xoá / Kết thúc) | GIỮ | |
| Badge lớp bấm được | GIỮ | |
| Dòng GV bộ môn | GIỮ | [XM] truy vết V5 ghi BỎ |
| Trước / Sau lớp, ‹ Học viên & Lớp | GIỮ | |
| Cách xem (Tổng hợp · Góp ý tuần · Lộ trình tiếp theo · Cần hỗ trợ · Kết quả đầu ra · Thông tin lớp) | GIỮ | [XM] truy vết V5 ghi BỎ |
| Sửa thông tin · Chọn nhiều học viên (QL) + thanh hàng loạt | GIỮ | ô chọn cạnh tên ở bảng mới |
| ⋯ từng dòng em | GIỮ | cột cuối bảng |
| Cột Theo dõi (một việc, link đổi trang) | ĐỔI → thanh Việc cần làm (mọi việc của tôi, panel tại chỗ) + Case + PA mở dưới hàng | khu b; 3 ô + "+n việc khác ở Công việc ›" |
| 2 mốc điểm chồng (mốc cũ mờ) | ĐỔI → một lượt của từng em (cột MT); lượt cũ xem ở hồ sơ HV / bấm MT | P8, khu b |
| Bảng FT dạng thẻ ở < 640 px | ĐỔI → bảng cuộn ngang | mockup 375 |
| Khối Điểm Mock Test của lớp (Dán Excel, sửa ô) | GIỮ — mở sẵn, cuối trang | [XM] truy vết V5 ghi "gập, chỉ tab Học viên" |
| Tab Ý thức & Phối hợp (Ghi vi phạm, Chọn nhiều, khung trái / phải) | GIỮ nguyên | [XM] mockup vẽ bảng 4 cột — PR riêng nếu duyệt |
| — | MỚI: popover điểm thành phần W / S · Case + PA dưới hàng (Ghi KQ PA · Sửa · Lịch sử) · tab Đánh giá đầu ra + panel lần lượt (lớp thường) | |

Không mất thao tác nào. Còn thiếu so với luật mới: ghi chú "vắng W3 SEP" (`chuDoiVang`) chưa có trong ô điểm của bảng mới — `/roster` chưa trả tuần dời từng kỹ năng [XM].
