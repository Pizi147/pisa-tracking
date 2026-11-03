# UI-CONG-VIEC · U01 Công việc — khớp / khác (mockup `thiet-ke/audit-0311/u01-cong-viec.html`)

Ảnh cặp (trái mockup · phải web, demo 14/09/2026, seed nguyên): `a1-gv-xac-nhan-pa-1440.png` · `a2-ql-theo-doi-1440.png` · `a3-ql-lam-thay-1440.png` (1440 tối) ·
`b1-gv-375.png` · `b2-ql-theo-doi-375.png` · `b3-gv-xac-nhan-pa-375.png` (375 sáng). Phông: `document.fonts.check('600 14px "Be Vietnam Pro"') = true` trước khi chụp.

## Truy vết khung → thành phần → ảnh

| Khung | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|
| A1 GVCN · Xác nhận PA | `HoTroHocVienTab` (đầu trang, hàng lọc) · `DanhSachViec` (thẻ phụ, Cả lớp, hạn chỉ chữ) · `XacNhanPaPanel` + `dauCase` (dải sự kiện, Case → Phương án, chân một hàng) | a1 | KHỚP (KHÁC 1, 2) |
| A2 QL · theo dõi | `TomTatTheoDoi` (mới) · badge `App.tsx` | a2 | KHỚP (KHÁC 3) |
| A3 QL · làm thay | `DaiLamThay` (mới, trong thân panel) · loại "LÀM THAY" | a3 | KHỚP (KHÁC 4) |
| A4 việc cuối vừa lưu | dòng giữ chỗ mờ + gạch + "Xem lại" (`CotNut`) · chip "✓ n xong hôm nay" | — (cần lưu thật; bấm thử ở máy) | KHỚP |
| A5 lọc Đã xong hôm nay | `xemXong` + `dsXong` | — | KHỚP (KHÁC 5) |
| B1 375 GV | cùng `DanhSachViec`; hàng lọc lưới `1fr 1fr auto` | b1 | KHỚP |
| B2 375 QL theo dõi | `TomTatTheoDoi` toàn màn "‹ Công việc" | b2 | KHỚP |
| B3 375 Xác nhận PA | `XacNhanPaPanel` | b3 | KHỚP (KHÁC 2) |
| C1 lỗi lưu | `TrangThaiLuu` ở chân trái (có sẵn, nay ở chân dính) | — | GIỮ |
| C2 Nội dung PA > 200 (N35) | — | — | KHÁC 6 |
| C3 mở từ chuông · việc đã xong | đường cũ (Case) | — | GIỮ |
| C4 không quyền làm thay | `TomTatTheoDoi`: "Chỉ {ai} hoặc Quản lý làm được việc này." | — | KHỚP |
| C5 TVV Báo PH hạn đã sửa | thuộc AUDIT-Y-THUC UI-1 | — | BỎ (ngoài phạm vi) |
| C6 rỗng | `Empty` "Không còn việc đang mở" có sẵn | — | GIỮ |
| C7 EN chân không cắt nút | nút chân `KhungPanel` xuống dòng (`flex-wrap`) | — | GIỮ |
| C8 đang tải | `Skeleton` có sẵn | — | GIỮ |
| C9 Chờ bạn duyệt · Việc quản lý · Đã bỏ qua | giữ nguyên (`HopChoDuyet`, `LoiVanHanh`, `DaBoQua`) | a2 | GIỮ |
| C10 Hết việc nhóm | `HetViecNhom` có sẵn | — | GIỮ |
| C11 ✓ Đã lưu · Em này còn | có sẵn (V12) | — | GIỮ |

## KHÁC (lý do)
1. Vạch hạn nhóm Chấm điểm giữ "Quá hạn · Hạn đến {CN} · Hạn sau {CN} ▸" (T14, gập sẵn việc xa) — mockup vẽ "Quá hạn · Hôm nay · Sắp tới". Đổi = đổi luật vạch, không vẽ thêm.
2. ~~Form PA ba ô không cùng hàng~~ — đã sửa (PTA 04/11): Số buổi · Người dạy · Bắt đầu MỘT hàng ở mọi form PA trong khối con (hồ sơ HV theo cùng).
3. Badge QL = `summary.viec` của `/my-work` (số "Của tôi" máy chủ) — demo QL Vy: badge **6**, ô "Của tôi" **5**. Lệch do việc "Nhập điểm MT cũ" / "Điền Target" (`mywork.ts`): góc "toi" gán người xem, góc "tat-ca" gán GVCN lớp → sửa ở PR máy chủ riêng (PTA 04/11).
4. ~~Panel làm thay giữ đầu dòng 2~~ — đã sửa (PTA 04/11): Ghi kết quả PA có dải sự kiện (+ "Phụ trách" khi làm thay), chân Lưu / Lưu · việc tiếp › ở đáy panel.
5. "Đã xong hôm nay" = việc lưu trong phiên này (mất khi tải lại trang) — `ponytail:` ghi trong mã; giữ qua phiên cần nhật ký máy chủ.
6. N35 (Nội dung PA ≤ 200, bộ đếm) là PR máy chủ + web của AUDIT-LOI — form vẫn bộ đếm cũ "0/15" (tối thiểu).

## Thao tác TRƯỚC → SAU (không mất thao tác nào)

| Thao tác | Trước | Sau |
|---|---|---|
| Phạm vi Của tôi · Của GV · Tất cả | hàng lọc | GIỮ |
| Một GV ▾ · Mọi khung ▾ · Chi nhánh ▾ | hàng lọc | vào "Lọc thêm ▾" (mở một hàng dưới; đang bật thì mở sẵn, nút ghi số) |
| Mọi hạn ▾ | Quá hạn · Hạn đến {CN} | + **Hôm nay** |
| Loại việc (nhóm) | chip từ Tổng quan | ô "Loại việc ▾" hiện sẵn (chip `loai=` từ Tổng quan giữ) |
| Đầu trang "n nhóm · n việc · n HV · n bài" | có "n nhóm" | BỎ "n nhóm" (chủ SP) |
| Badge Công việc QL | số thẻ chờ duyệt mọi chi nhánh | số việc "Của tôi" (V13) |
| Dòng việc phụ "a · b · c" | chuỗi | thẻ phụ; tuần ghi "tuần W4 JUL" |
| Dòng gộp / lớp | ô số chồng, không người | ô bảng + "Cả lớp {mã} · việc", thẻ n em · n việc, **người phụ trách**; nút "4 em ▾" |
| Chip "Bình thường" | có | BỎ (chỉ "Gấp") |
| Hạn quá / sắp | viên nền | chữ + ⚠ không nền (`ChipHan`, mọi màn) |
| Xem thêm | "n việc" (đếm dòng) | "n dòng" |
| Tên việc | "Kết quả PA Reading" | "Ghi kết quả PA · Reading" (nút "Ghi kết quả PA"); "Thêm PA học thuật · Reading", "Xác nhận Case · Listening", "Mô tả Case · …" — đổi tận nguồn `mywork.ts` |
| Theo dõi việc GV khác | dải + form mờ | tóm tắt chỉ đọc + Làm thay (chân, nút chính) → form + dải vàng "Bạn đang làm thay … · Thôi, chỉ xem" |
| Xác nhận PA | form trước, bối cảnh sau, 4 nút ngang | dải sự kiện → Case → Phương án; chân: Tiếp / trạng thái lưu · Xác nhận PA · Xác nhận · việc tiếp ›; 2 lối khác là link |
| Sau lưu | dòng mờ "✓ Đã lưu" | + "Xem lại" trên dòng + chip "✓ n xong hôm nay" lọc được |
| Bỏ qua · Khôi phục · Gia hạn · Chờ bạn duyệt · + Giao việc · Vận hành · Báo cáo | có | GIỮ |
| Yêu cầu của tôi · Lớp tôi dạy | mở sẵn cuối trang | nhóm gập cuối trang (tải khi mở) |

## Đọc Turso
- GV mở Công việc: không đổi (một `/my-work`, badge gộp cùng GET).
- QL / QT: **+1 `/my-work`** mỗi lần nạp app cho badge (trần đo 49 câu / ~1 100–1 400 dòng, `tocDoDuong.ts`) — ước ~20 lần mở app / QL / ngày × 10 QL ≈ 0,3 triệu dòng / ngày (< 2 % mốc 15 triệu). Đổi lại bỏ một `/yeu-cau/dem`? Không: nhóm "Chờ bạn duyệt" vẫn cần.
- Panel theo dõi: một `/cases/:id` (form làm thay đọc lại cùng đường — trước đây form mờ đã đọc khi mở).
- Yêu cầu của tôi · Lớp tôi dạy gập sẵn → GV **bớt** hai đường đọc mỗi lần mở trang.

## Vòng sửa hình 04/11 (PTA: hình theo mockup SÁT)
- Khối Case: hàng nhãn mờ / giá trị sáng, kẻ ngăn, không nền; Điểm "✗ 5.0 / kỳ vọng 6.0 · Target 7.0"; Nguyên nhân = chip; Mô tả = trích vạch trái + "Xem Case" ngay dưới (bỏ ở đầu panel).
- Phương án: tiêu đề mục "Phương án · Học Tutor" + thẻ "theo quy chế" · mốc, không hộp lồng; nhãn ô 15 / 700 (panel Công việc); bỏ "(không bắt buộc)" và câu "Có số buổi thì web đếm…"; "Đổi" trong ô người là chữ nhấn; hai link sát dưới hàng ô; bộ đếm "n / 200" luôn hiện.
- Đầu panel: Lượt "MT1 · tuần W4 AUG"; hạn chưa quá chữ thường, quá hạn "⚠ 08/09 · quá hạn 6 ngày".
- Làm thay (A3): Tiến triển nút 36 px như mockup, Nhận xét ô lớn + bộ đếm, "Điều chỉnh PA…" link dưới, chân ở đáy.
- Danh sách: hạn sắp tới chữ thường (chỉ "hạn hôm nay" vàng ⚠, quá hạn đỏ ⚠), thẻ phụ đệm 8 px.
- Còn giữ (có lý do): "Chỉ xem" thay "Thôi, chỉ xem" (từ điển S3, PTA đồng ý) · nhóm "Chờ bạn duyệt" của QL mở sẵn (mockup vẽ gập — giữ hành vi cũ vì badge không còn đếm yêu cầu) · "Tới đâu" là một dòng trạng thái (chưa có dữ liệu từng bước như mockup).
