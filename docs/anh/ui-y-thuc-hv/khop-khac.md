# UI-Y-THUC-HV — khớp / khác mockup

Nguồn: `thiet-ke/v7/ho-so-hv-y-thuc.html` (chủ SP duyệt 28/10, "Duyệt cả bốn"), khung `#w1440` / `#w375`, `?tt=…&vai=…&theme=…`.
Web: `/hoc-vien/:id?tab=y-thuc` — `StudentYThucSection` (+ `ThangYThuc`, `DuyetThuHoi` / `BaoPh` dùng chung tab lớp, `PhoiHopSosSection xanh`).
Luật 28/10: hình ảnh sát mockup, tính năng giữ V4.

Ảnh cặp (trái mockup | phải web): `cap-1440-toi.png` (tt=cho ↔ HV Lê Quang Huy, GVCN), `cap-375.png` (tt=moi, sáng ↔ HV Mạc Tuấn Kiệt),
`cap-cho-duyet-1440.png` (tt=cho-duyet ↔ HV Lương Gia Bảo, có Báo PH TVV).

## Truy vết khung → thành phần

| # | Khung mockup | Web | Kết quả |
|---|---|---|---|
| H1 | Tiêu đề "Ý thức & Phối hợp" 17 px đậm + "+ Ghi vi phạm" nút chính | `StudentYThucSection` đầu | KHỚP |
| H2 | Khối Thang `surface-2` viền đậm, bo 10: "Thang xử lý vi phạm · chuỗi" + góc phải Xác nhận / Sửa cấp bậc | `ThangYThuc` (+ `onSuaKhai`) | KHỚP |
| H3 | Bậc: đã qua ✓ viền xanh lá · lần này viền nhấn đậm nền nhấn nhạt · còn lại viền mảnh; một dòng mờ mép, ≤ 600 px xuống dòng đủ tên | `BacO` + `<ol>` (`sm:` thay `@container 600`) | KHỚP |
| H4 | Xác nhận xử lý (nút chính + chấm hồng; trạng thái chỉ Mới → nút thường) · Đề xuất QL duyệt · ⓘ | `xuLyChinh`, `NutLuat` | KHỚP |
| H5 | Dòng trạng thái hai ô `Duyệt · thu hồi` \| `Báo PH (TVV)`; 375 xếp dọc | `TrangThaiDong` (ô = `DuyetThuHoi` / `BaoPh` tab lớp) | KHỚP |
| H6 | Cả hai ô trống → một dòng mờ có nhãn | `TrangThaiDong` nhánh rỗng | KHỚP |
| H7 | Đề xuất đã duyệt: "Đánh dấu đã thực hiện" nút chính trong ô Duyệt | `TrangThaiDong` | KHỚP |
| H8 | Báo PH: viên chờ (chấm) / quá hạn (⚠ đỏ) / đã báo (✓) + "Việc của TVV · bậc"; TVV có "Ghi kết quả báo PH" | `BaoPh` + `PanelBaoPhTvv` | KHỚP |
| H9 | Hai cột 1.35 : 1 (≥ 900 px), hẹp xếp dọc | lưới `@container(min-width:900px)` | KHỚP |
| H10 | Thẻ "Vi phạm chưa xong" + ⓘ luật + "Ghi nhận tất cả (n)" (≥ 2 Mới, nút chính + chấm) | `NutLuat`, nút lô | KHỚP |
| H11 | Khối vàng nhạt (quá hạn đỏ nhạt + ⚠), dòng đầu đậm nói hạn + lý do | `KhoiViPham` `bg-soon-bg` / `bg-late-bg` | KHỚP — chữ lý do dùng câu máy chủ đã có "n vi phạm trong tuần này + tuần trước → bắt buộc xử lý" thay "n vi phạm / 2 tuần" (cùng nghĩa, đã dịch EN) |
| H12 | Dòng vi phạm: ngày · tên ▸ mở tại chỗ (mô tả · Sửa · Xoá) · nhóm + người ghi · Ghi nhận / nhãn khi khác khối | `KhoiViPham` + `ChiTietViPham` | KHỚP |
| H13 | Em không còn vi phạm chờ: một câu + lần gần nhất | nhánh rỗng | KHỚP |
| H14 | Thẻ "Phối hợp SOS · học thuật · tách khỏi vi phạm", khung xanh nhạt viền xanh | `PhoiHopSosSection cot1="luot" xanh` | KHỚP |
| H15 | Nội dung thẻ lượt: "MT2 SOS 2 · R, W · 1/3 · Đang làm" + danh sách việc (Xác nhận · Bỏ ▾) + "+ Thêm việc" · "Hiện cả lượt đã xong" · "Case & PA ở tab Học thuật ›" | `TheSos` V4 | KHÁC [XM] — giữ thẻ lượt V4 (đầu thẻ 3 cột, link "Hỗ trợ học thuật xem ở tab Học thuật", Sửa / Đưa lại Cần xử lý ở việc đã xong) như K15 tab lớp |
| H16 | Không có lượt: một dòng chữ nhỏ | `PhoiHopSosSection xanh` rỗng | KHỚP |
| H17 | "▸ Nhật ký · chuỗi (n)" gập; mở sẵn khi em không còn gì chờ; trong: bộ lọc một hàng + nhóm + dòng thời gian + dòng đếm + Xem cả lịch sử | thẻ Nhật ký | KHỚP |
| H18 | Lỗi tải: câu + Tải lại (không ⚠) | `ErrorState`; Phối hợp `LoiTaiNho` | KHỚP |
| H19 | Toast "✓ Đã ghi nhận … · Hoàn tác" | `toast.hoanTac` | KHỚP |
| H20 | QL: "Duyệt" / "Từ chối…" ngay trong ô Duyệt | bấm chữ đề xuất → panel Xem lần xử lý (thẻ yêu cầu có Duyệt / Từ chối) | KHÁC [XM] — một chỗ duyệt (thẻ yêu cầu `duyet/TheYeuCau.tsx` thuộc session khác, không đụng); thêm nút tại chỗ cần PR riêng |
| H21 | Chấm tab "●" (quá hạn đỏ) ở hàng tab hồ sơ | hàng tab `StudentDetailPage` giữ như cũ | GIỮ — hàng tab hồ sơ ngoài phạm vi PR |
| H22 | Khung ngoài tab | bỏ `Card` bọc tab (thẻ lồng thẻ) | KHỚP |

**Đếm:** 21 dòng (trừ H21 GIỮ) — KHỚP 19 · KHÁC [XM] 2 (H15 giữ thao tác V4, H20 một chỗ duyệt). **19/21 = 90,5 %**.

## Thao tác TRƯỚC → SAU

| Thao tác V4 | Sau PR |
|---|---|
| + Ghi vi phạm | giữ, đầu tab |
| Xác nhận xử lý · Đề xuất QL duyệt (khối Thang) | giữ; + ⓘ giải thích; chấm hồng ở nút chính |
| Xác nhận cấp bậc vi phạm / Sửa cấp bậc | giữ — Sửa cấp bậc dời vào góc phải khối Thang |
| Thanh việc: Ghi nhận n | → "Ghi nhận tất cả (n)" ở thẻ Vi phạm + "Ghi nhận" từng dòng; có Hoàn tác |
| Thanh việc: Đánh dấu đã thực hiện | → ô Duyệt · thu hồi |
| Ghi nhận / Bỏ ghi nhận ở dòng thời gian | giữ trong Nhật ký |
| Mở vi phạm → Sửa · Xoá · xem lần xử lý | giữ (ở khối Vi phạm chưa xong và Nhật ký) |
| Xem lần xử lý → Thu hồi… / Đã thực hiện… | giữ (nút Xem ở Nhật ký + bấm chữ ở ô Duyệt · thu hồi) |
| Lọc Tất cả / Cần xử lý / Chờ duyệt / Đã xử lý + nhóm | giữ trong Nhật ký |
| Xem cả lịch sử / Chỉ chuỗi hiện tại | giữ |
| Tab con "Vi phạm & xử lý · Phối hợp SOS" | → một trang hai cột; `&sub=phoi-hop` cuộn tới khối Phối hợp |
| Phối hợp: Xác nhận · Bỏ · + Thêm việc · Sửa · Đưa lại Cần xử lý · link tab Học thuật | giữ (thẻ lượt V4) |
| `?mo=xu-ly`, `?mo=da-thuc-hien&xl=` | giữ |
| MỚI | Ghi kết quả báo PH tại chỗ (TVV / QL — quyền máy chủ); dòng trạng thái Duyệt · thu hồi \| Báo PH |

Không mất thao tác nào.

## Máy chủ

`GET /students/:id/y-thuc` thêm `hang` = `{ xuLyGanNhat, tuChoi, thuHoi, baoPh }` từ `hangCuaEm` (`board.ts`) — cùng hàm, cùng câu với hàng em tab lớp
(`baoPhMoiNhat`, `danhDauDangXinThuHoi` tách ra dùng chung). Không đổi luật, không đổi schema. Phép kiểm: `prYt4` "UI-Y-THUC-HV: tab HV cùng ô".
