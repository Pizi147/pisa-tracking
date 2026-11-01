# V8-PT-2 — backlog V8-PT màn Phân tích (`thiet-ke/v8/phan-tich.html`, chủ SP duyệt 29/10 #688)

Loại PR: sửa theo mockup đã duyệt, không đổi bố cục khung; **chủ SP duyệt ảnh trước merge**. Nguồn việc: `docs/anh/v8-phan-tich/khop-khac.md` "Để sau", kế hoạch `docs/superpowers/plans/2026-10-30-don.md` PR V8-PT-2.

## Truy vết backlog → thành phần → ảnh
| # | Mục | Thành phần | Ảnh | KHỚP / KHÁC |
|---|---|---|---|---|
| 1 | Thẻ "Thời gian thường mất" (Hiệu quả PA) | `tvTuanCua`, `thoiGianThuongMat` · `HieuQuaPa` | `cap-a5`, `cap-c3` | KHỚP (ít dữ liệu: "—" + "Ít dữ liệu") |
| 2 | Số thẻ chỉ số bấm được → panel | `oKetQuaThi` (đường `/phan-tich/ket-qua-thi/o`), `oHieuQuaPa dong=tong`, `oYThucPhanTich dong=tong · hv-can-chu-y` · `OSo` | `cap-a3`, `cap-a2` (panel), `cap-a5`, `cap-b3` | KHỚP |
| 3 | "16 HV" ở thẻ Lượt MT | `soHv` · `TongHopTestSos` | `cap-a1`, `cap-c1` | KHỚP |
| 4 | Xem Toàn bộ khi rỗng ở 4 tab còn lại | `NutXemToanBo` · Kết quả Test (Mock, Thi thật), Hiệu quả PA, Ý thức, Báo cáo HV | `cap-d2` | KHỚP |
| 5 | ⋯ / Xuất cạnh ô đoạn ở 375 · thẻ 375 cho Ý thức | `canhDoan` (`PhanTich`), `NutXuat`, `TheDong` | `cap-c1`, `cap-c2`, `cap-b3-y-thuc-375-sang` | KHỚP |

Làm thêm vì ảnh cặp lộ lệch (cùng mockup, +0 câu): thẻ Vi phạm "↑30 so kỳ trước" · Ý thức: cột theo mockup (200 · 120 · 170 · 100 · 110), "Quá hạn" dạng viên có nền, số căn giữa, bảng Lớp căn giữa, "Lần xử lý gần nhất" không còn "—" thừa khi có lần chờ duyệt · Test + SOS: hàng lớn 44 / hàng con 38 / Tổng 44 đúng mockup, số 0 chữ thường · Kết quả Test: hàng 44, nút Xuất có biểu tượng như mockup.

## Bảng so khung (đếm thành phần; ≥ 90 % KHỚP)
| Khung | Thành phần KHỚP / tổng | KHÁC còn lại |
|---|---|---|
| A1 Test + SOS | 11 / 11 | — |
| A2 panel | 3 / 4 | panel theo khung panel khối 2 (toàn chiều cao, dòng điểm), không phải khung nổi của mockup — panel chung đã duyệt sau |
| A3 Kết quả Mock | 10 / 11 | % Chưa đủ điểm không hiện: luật "không vào tỷ lệ" thắng mockup |
| A4 Thi thật | 7 / 7 (demo không có lượt, chỉ thấy rỗng + thẻ 0) | — |
| A5 Hiệu quả PA | 9 / 10 | chữ "Chưa tính" dài hơn mockup (giữ tên đầy đủ đã có: một khái niệm một tên) |
| B1 Báo cáo HV · B2 Phân tích GV | 12 / 12 | không đổi trong PR này |
| B3 Ý thức | 9 / 9 | — |
| C1 · C2 · C3 375 | 18 / 18 | — |
| D2 rỗng | 3 / 3 | Kết quả Test giữ thẻ 0 phía trên ô rỗng (mockup D2 vẽ Test + SOS) |
| **Tổng** | **82 / 85 = 96 %** | |

## Thao tác TRƯỚC → SAU (không mất thao tác)
| Thao tác | Trước | Sau |
|---|---|---|
| Bấm số thẻ Kết quả Test / Hiệu quả PA / Ý thức | không bấm được | mở panel đúng tập, chỉ đọc |
| Chip SOS ở thẻ Kết quả Test | chữ | bấm được như Test + SOS |
| Xem Toàn bộ khi rỗng | chỉ Test + SOS | thêm Kết quả Test, Hiệu quả PA, Ý thức, Báo cáo HV |
| ⋯ (Test + SOS) · Xuất Excel (Kết quả Test) ở 375 | cuối hàng lọc | cạnh ô đoạn đầu; Xuất là nút vuông 44, chữ ở aria-label |
| Xuất Excel Ý thức ở 375 | nút chữ | nút vuông 44, cùng hàng ô lớp |
| Ý thức ở 375 | bảng cuộn ngang | thẻ từng dòng; mở nhóm vi phạm bằng "n nhóm ▾"; mọi số vẫn bấm được |
| Báo cáo HV: Kết quả MT khi cả bảng trống | bảng toàn "—" | câu rỗng + Xem Toàn bộ |
| Mọi thao tác khác (lọc, xếp, Cột hiện, Xuất từng lượt, phân trang, In) | như cũ | như cũ |

## Quyết định của session (chủ SP / PTA xem)
- **Thời gian thường mất tính trên PA có cải thiện**, dưới 5 PA → "—": theo mockup ("trung vị · PA có cải thiện") và cột cùng tên trong bảng; kế hoạch ghi "các PA có kết quả". Một khái niệm một công thức (`tvTuanCua`).
- **Panel thẻ Kết quả Test 6 câu nghiệp vụ** (HTTP 7 câu), kế hoạch ghi ≤ ~4: phải chấm lại bằng đúng hàm đếm thì số mới bằng dòng; hạ thêm cần đường đếm thứ hai. Thẻ khác: Thi thật 6 · Hiệu quả PA 15 · Ý thức 12 (HTTP). Chỉ chạy khi MỞ; vẽ trang +0 câu.
- **Panel Mock / Thi thật một dòng một lượt** (một em hai lượt = hai dòng) để số thẻ = số dòng.
- Phân tích GV không thêm Xem Toàn bộ (không nằm trong tệp kế hoạch; ô rỗng tab này nói về bài trễ).

## Đo
- `do-khung` + `do-bang` trên 6 tab (thêm tạm kịch bản 4 tab, không commit): 1440 / 1366 / 1280 / 375 × tối / sáng. Không còn lỗi tràn, cắt chữ, chạm mép ở các tab sửa.
- Lỗi còn lại, đều không phải lệch mockup: g1 bảng Test + SOS (đầu cột `rowSpan` hai tầng làm công cụ lệch chỉ số cột) · g3 "38" (hàng con 38 là số của mockup) · g2 / g3 Kết quả Test, Ý thức (ô Xử lý, Lần xử lý hai dòng, chữ thật dài) · g1 "Trạng thái", "Kết quả" (đo chữ trong viên / chip) · g1 "Lớp / nhóm vi phạm" (mũi tên ▸).
- `phan-tich-375`: "nút bị cắt ở mép «ⓘ»" ở Báo cáo HV: PR không sửa thẻ này, ảnh `cap-b1-bao-cao-375-sang` không thấy cắt.

## Dòng đọc Turso
Vẽ trang: +0 câu ở `/phan-tich/hieu-qua-pa`, `/tong-hop`, `/y-thuc`, `/ket-qua-thi` (`TRAN` không đổi). Đường mới có trần ở `tocDoDuong.ts`.
