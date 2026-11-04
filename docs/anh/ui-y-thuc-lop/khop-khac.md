# UI-Y-THUC-LOP — bảng KHỚP / KHÁC (ảnh cặp `cap-*.png`)

Nguồn: `thiet-ke/v5/ho-so-lop.html?tab=y-thuc` (khung `lop-y-thuc-1440`, `-toi`, `-375`, `lop-y-thuc-bao-ph-1440` = `?lop=cp110`) ·
truy vết `thiet-ke/v5/ho-so-lop-truy-vet.md` dòng brief 10 + Báo PH · brief chủ SP 22/10 (`00-brief-chu-sp.md` "### Ý thức & Phối hợp", mục 7) ·
luật 28/10: HÌNH ẢNH sát mockup, TÍNH NĂNG theo luật + giữ thao tác V4.
Vai: cô Trần Ngọc Hà (GVCN, id 7) · QL (id 2) cho Báo PH · lớp MB FT 101 (id 3) · seed nguyên, ngày demo 14/09.

Ảnh: `cap-1440-toi.png` (mockup | web) · `cap-375.png` (375 sáng) · `cap-bao-ph-1440.png` (khung CP 110 | nhóm "Chờ TVV báo PH" của web) ·
`web-mo-hang-1440.png` (chi tiết em mở dưới hàng) · `web-bao-ph-panel-1440.png` (QL bấm "Ghi kết quả báo PH").

## Khung → thành phần

| # | Khung → thành phần | Kết quả |
|---|---|---|
| K1 | Bảng theo HV, 5 cột Học viên · Vi phạm chờ xử lý · Bậc xử lý · Duyệt · thu hồi · Báo PH (TVV) (200 px · 1.4fr · 1fr · 180 px · 150 px) → `HangEm`, `COT` | KHỚP |
| K2 | Tiêu đề nhóm "Cần xử lý" 14 px đậm + đếm "n HV · n vi phạm · ⚠ n quá hạn"; hàng tiêu đề cột nền `be-mat-2` ngay dưới nhóm đầu → `NhomHang` | KHỚP |
| K3 | Tên em trắng đậm, bấm sang hồ sơ HV (link: hover gạch chân, focus rõ). Bỏ "↗" của mockup theo quyết định chủ SP 28/10 (bỏ hết ↗ toàn web, thay luật G6) | KHỚP (đổi theo quyết định mới) |
| K4 | Vi phạm chờ: khối nền vàng nhạt không viền, dòng hạn đậm ("Hạn hôm nay · 14/09"), mỗi vi phạm `dd/mm tên` | KHỚP |
| K5 | Quá hạn: CHỈ khối đó nền đỏ nhạt + "⚠ Quá hạn n ngày · hạn dd/mm" — không tô đỏ hàng / bảng | KHỚP |
| K6 | Bậc xử lý: cửa sổ 3 bậc — bậc đã qua "✓" xanh viền xanh · bậc lần này viền nhấn nền nhấn đậm · bậc sau viền mờ · "› …" → `ThangNho` | KHỚP |
| K7 | Duyệt · thu hồi: chữ thường mờ ("Report 1 · 07/08", "Chưa có xử lý") + dòng phụ "Thu hồi được · QL duyệt" (khung CP 110) → `DuyetThuHoi` | KHỚP (chữ bấm được → xem lần xử lý, nơi có Thu hồi) |
| K8 | Báo PH: "—" khi chưa có; viên tròn nền vàng nhạt "Chờ báo PH · hạn dd/mm" + dòng phụ "Việc của TVV · …" → `BaoPh` | KHỚP — chấm tròn thay "⚠" trên viên CHỜ (luật V5: ⚠ chỉ nghĩa quá hạn); viên quá hạn có ⚠ nền đỏ |
| K9 | Một nút việc mỗi hàng, cột cuối, chấm hồng "việc của tôi"; hàng quá hạn nút chính | KHỚP — nhãn "Xác nhận xử lý" (tên V4, cùng tên thanh Chọn nhiều + thang; một khái niệm một tên) thay "Xử lý vi phạm" Hàng quá hạn: `btn-primary` (đã kiểm computed style). Ở TỐI nút chính là nền xanh thẫm + viền, không tô kín màu nhấn — theo D4 MAU-WEB (chủ SP 27/10, DESIGN.md mục Colors, mới hơn mockup V5 vẽ nút tô kín); ở SÁNG tô kín như mockup. |
| K10 | "▸ Đã xử lý · 7 ngày (n)" gập | KHỚP |
| K11 | Nhóm "Chờ TVV báo PH" (khung CP 110: em không còn vi phạm chờ, việc Báo PH mở) | KHỚP |
| K12 | Lịch sử em gập (khung CP 110 "Lịch sử Ngô Hải Yến") → "Chi tiết" (375: "Chi tiết · nhật ký") mở dưới hàng (thang đủ + vi phạm + lần xử lý + câu M6) | KHỚP |
| K13 | Hàng đang mở: nền `dang-mo` + vạch nhấn trái 3 px | KHỚP |
| K14 | Phối hợp SOS: tiêu đề "Phối hợp SOS · học thuật · tách khỏi vi phạm", mỗi em một khung xanh nhạt viền xanh, bo 10 px, chữ 14 px, tên 15 px, chip "SOS 2 · R, W"; chân là link | KHỚP — đo computed style: nền / viền lệch ≤ 6 RGB (token web `doing-bg` / `doing-line` = `dang-nen` / `dang-vien` V5) |
| K15 | Nội dung khung Phối hợp: mockup một dòng "MT2 · Case R (GV) PA đang làm" + nút "Xác nhận phối hợp" | KHÁC [XM] — web giữ thẻ lượt V4 (tên · MT · SOS · kỹ năng · "n/m việc hoàn thành" · Đang làm), bấm mở danh sách việc phối hợp và Xác nhận / Bỏ từng việc (thao tác V4; mockup gộp một nút không có trong luật Phối hợp) |
| K16 | 375: hàng xếp dọc (tên + "Chi tiết" cùng dòng · khối vi phạm · thang · Duyệt | Báo PH hai cột · nút việc đủ rộng) | KHỚP |
| K17 | Tab "Ý thức & Phối hợp ⚠ 2" ở hàng tab hồ sơ lớp | KHÁC [XM] — GIỮ chấm "●" hiện có: số đó đếm em CẦN xử lý (không phải quá hạn), "⚠" sai nghĩa theo luật V5; hàng tab thuộc `ClassOverviewPage` (session hồ sơ lớp khác đang sửa) |
| K18 | Chỉ xem (GVBM): không nút việc | KHỚP (máy chủ `canManage`) |
| K19 | Câu chú giải màu dưới thẻ mockup | BỎ — chú thích cho người duyệt mockup, không phải giao diện |
| B6 | BỎ khung dòng thời gian vi phạm mở sẵn (PR #547 ghi KHÁC) | KHỚP — "Nhật ký vi phạm của lớp (n)" gập, lọc nhóm vi phạm ở trong |

**Đếm:** 20 dòng (trừ K19 BỎ) — KHỚP 18 · KHÁC [XM] 2 (K15, K17, đều do luật / giữ thao tác V4). **18/20 = 90 %**.
PR #547 `docs/anh/ui-ho-so-lop/khop-khac.md` T11, T12, B6 (KHÁC [XM] "PR riêng") → nay KHỚP.

## Thao tác TRƯỚC → SAU

| Thao tác V4 | Sau PR | Ghi chú |
|---|---|---|
| + Ghi vi phạm (đầu thẻ) | GIỮ — đầu thẻ | |
| Chọn nhiều → ô tick mỗi em + thanh dính đáy: Xác nhận xử lý · Ghi nhận (Hoàn tác) · Xác nhận cấp bậc; nhóm "Chưa xác nhận cấp bậc" | GIỮ — ô tick cạnh tên ở mỗi hàng; nhóm "Chưa xác nhận cấp bậc" khi bật | `?mo=cap-bac` vẫn mở panel lô |
| Khung trái "Xử lý": chọn em theo nhóm Quá hạn › Bắt buộc › Chờ QL › Mới › Đã xử lý | ĐỔI → bảng theo HV, nhóm Cần xử lý (Quá hạn + Bắt buộc) › Chờ QL duyệt › Mới, chưa ghi nhận › Chờ TVV báo PH › Đã xử lý · 7 ngày (gập) | cùng `nhomEm` máy chủ |
| Khung phải theo em: thang + Xác nhận xử lý · Đề xuất QL duyệt · Xác nhận cấp bậc | GIỮ — "Chi tiết · nhật ký" mở dưới hàng | + nút việc ngay trên hàng (mở cùng panel) |
| Vi phạm của em: Ghi nhận · Bỏ ghi nhận · mở dòng → Sửa · Xoá · xem lần xử lý | GIỮ — trong chi tiết em | hàng "Mới" có thêm "Ghi nhận" ngay trên hàng (mọi vi phạm Mới của em) |
| Chân em: câu M6 + "Đã thực hiện…" | GIỮ — trong chi tiết; hàng đề xuất đã duyệt có nút "Đã thực hiện…" | |
| Xem lần xử lý (→ Thu hồi, luật 5) | GIỮ + MỚI: bấm chữ ở cột Duyệt · thu hồi; chi tiết em có danh sách "Lần xử lý" (kể cả đã thu hồi) | |
| "Hồ sơ" (link khung phải) | GIỮ — tên em ↗ | |
| "Cả lớp" (bỏ chọn em) | BỎ — không còn khung chọn em; đóng chi tiết bằng "Thu gọn" | |
| Dòng thời gian vi phạm cả lớp (mở sẵn) + lọc nhóm vi phạm | GIỮ, GẬP — "Nhật ký vi phạm của lớp (n)", lọc ở trong; bấm tên → mở hàng em | brief: không dàn nhật ký mặc định |
| Lọc nhóm vi phạm trong danh sách MỘT em | BỎ — danh sách một em ngắn, đã có nhãn nhóm từng dòng | |
| Tab con "Vi phạm & xử lý · Phối hợp SOS" (+ số) | ĐỔI → một trang, Phối hợp là khối riêng cuối thẻ; `?sub=phoi-hop` cuộn tới khối | |
| Phối hợp: thẻ lượt, Xác nhận / Bỏ / + Thêm việc, "Hiện cả lượt đã xong" | GIỮ — thẻ đóng sẵn (một dòng một em), bấm mở việc | |
| < md: hai tab "Theo xử lý · Theo vi phạm" | ĐỔI → hàng xếp dọc (mockup 375) | |
| Việc / thông báo `?hv=&mo=xu-ly|khai|da-thuc-hien&xl=` | GIỮ — mở sẵn hàng em, cuộn tới, mở panel | |
| — | MỚI: "Ghi kết quả báo PH" ngay trên hàng (TVV / QL ghi được — quyền máy chủ), cùng panel Báo PH của Công việc | |

Không mất thao tác nghiệp vụ. Hai thao tác bỏ ("Cả lớp", lọc nhóm trong một em) là điều hướng của bố cục hai khung cũ.

## Máy chủ

`GET /classes/:id/y-thuc` thêm cho mỗi hàng em: `viPhamCho` (vi phạm Mới · Cần xử lý · Quá hạn), `thuHoi` (đang xin thu hồi / đã thu hồi), `baoPh` (việc Báo PH mới nhất,
cùng hàm hạn hiệu lực + tên trạng thái với panel TVV), `deXuat.id`, `xuLyGanNhat.id`; thêm `choBaoPh` (em không còn việc Ý thức nhưng Báo PH còn mở).
Không đổi luật, không đổi schema. Phép kiểm: `prYt4.tests.ts` "UI-Y-THUC-LOP · Hàng em…".
