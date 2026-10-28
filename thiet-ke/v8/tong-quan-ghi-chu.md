# V8 · Tổng quan QL · GV · TVV — ghi chú mockup đề xuất (29/10)

Tệp: `thiet-ke/v8/tong-quan.html`. Khung 1440 tối | 375 sáng, 5 trạng thái:
A QL Fast Track · B QL đang lọc Lớp thường + Học thuật · C GV (GVCN + dạy) · D TVV, Báo PH chưa có dữ liệu · E rỗng (QL chi nhánh mới + bảng GV lỗi tải · GV chưa được phân công).
Trạng thái: **ĐỀ XUẤT**, chờ chủ SP duyệt. Chưa sửa mã web.

## Điểm hiện tại (web, critique 29/10)
**QL 28 · GV 27 · TVV 29 /40.**

## Vấn đề bố cục chính
1. **GV 1440 chia 3 cột ~500 px** (dạy · chủ nhiệm · điều hướng), nên cắt chữ "MB Pre FO…" và "LT1 · MT1 · W3 S…". Cột SOS xếp 3 dòng, hàng cao gấp đôi.
2. **Mỗi chỗ vẽ SOS một kiểu.** Chip rỗng + số gạch chân rời, xuống dòng.
3. **Thẻ bảng ở 375 lệch lưới nhãn – số**, vì nhãn dài tự gãy dòng.
4. **TVV có 3 chỉ số**, nên ở 375 thẻ thứ 3 mồ côi nửa hàng. "– Chưa có dữ liệu" là chữ đậm trơn.
5. **Nút đoạn ở 375 vỡ thành nút rời.** Không có trạng thái lỗi tải từng khối.

## Phương án
- Dải chỉ số 4 ô (TVV 3 ô) → bố cục trái 1fr | phải 360 (Chờ bạn duyệt · Điều hướng). Giữ đúng như web.
- **GV:** hai bảng *Kỹ năng tôi dạy* và *Lớp tôi chủ nhiệm* **xếp chồng** ở cột trái (~1010 px). Dòng phụ đủ chữ, không còn "…". ⓘ đặt cạnh tiêu đề khối.
- **SOS một kiểu:** chip mức (MAU-MUC: 1 rỗng · 2 nền vừa · 3 đặc) + ô số HV, `nowrap`, cột 340 px. Dùng chung với đầu Hồ sơ lớp.
- **375:** bảng chuyển thành thẻ có lưới hàng cố định: hàng nhãn căn đáy, hàng số, rồi hàng mẫu (bỏ hàng mẫu nếu thẻ không có). Nhãn gãy 2 dòng thì số vẫn thẳng hàng. SOS nằm hàng riêng dưới lưới.
- **TVV:** 1440 có ba cột đều; 375 cho thẻ đầu full bề rộng. "– Chưa có dữ liệu" thành viên viền đứt. Dòng Thi thật thêm dòng phụ nói đích đổi trang.
- **Lỗi một khối:** báo lỗi + Thử lại ngay trong khối, các khối khác vẫn dùng được (E).

## Thao tác TRƯỚC → SAU (không mất thao tác)
| Thao tác web hiện tại | Sau (mockup V8) |
|---|---|
| Công tắc Fast Track / Lớp thường (QL, QT) | Giữ nguyên, đầu trang bên phải. Ở 375 là một khối liền full bề rộng |
| Ô số chỉ số: Đạt MT · Case có PA · "n chưa PA" · Thi tháng này → panel đúng tập | Giữ nguyên. ⓘ luật Đạt MT giữ nguyên |
| Lớp cần chú ý: mã lớp là link · Đạt MT · SOS theo mức · Case chưa PA · Thi tháng này đều là ô số. Tối đa 5 lớp | Giữ nguyên. Số HV của từng mức SOS vẫn là ô số |
| GV cần chú ý: Hành chính / Học thuật (`?gv=`) · tên GV là link · ô số · ⚠ Quá hạn → panel GV trễ chấm | Giữ nguyên |
| Chờ bạn duyệt: bấm dòng mở panel duyệt (`KhungPanel`) · "Hộp duyệt ›" | Giữ nguyên. Dòng không cắt chữ (cho xuống dòng) |
| Điều hướng QL: HV thi tháng này · Case chưa có PA · Lịch thi · Việc của tôi · Báo cáo | Giữ nguyên |
| GV: Việc của tôi · Case đang xử lý (ô số) · Đạt kỳ vọng Test · Tiến bộ (ô số) | Giữ nguyên |
| GV: bảng kỹ năng (Đạt / Tiến bộ / Chờ chấm / ⚠ quá hạn là ô số) · ⓘ · bảng chủ nhiệm (Dưới kỳ vọng / SOS / Case / Thi là ô số) · Điều hướng 2 dòng | Giữ nguyên. ⓘ "Số chủ nhiệm tách riêng…" thêm vào khối chủ nhiệm (trước là chữ dưới bảng) |
| TVV: Báo PH đúng hạn (ô số khi có) · Thi tháng này (link) · Chờ KQ · Lộ trình tiếp (2 link) · Thi thật 3 link · Điều hướng 2 | Giữ nguyên |
| Rỗng: "Không lớp nào cần chú ý" + Học viên & Lớp › · "Bạn chưa được phân công…" | Giữ nguyên |
| QT / CX / Admin (Theo chi nhánh, Mock Test) | Không vẽ. Áp cùng dải chỉ số, bảng và thẻ 375 |

## Câu hỏi cho chủ SP
1. GV ở 1440: xếp chồng hai bảng thay vì để ba cột cạnh nhau. Khối chủ nhiệm sẽ nằm dưới, phải cuộn mới thấy. Đồng ý không?
2. Dòng Thi thật của TVV: mockup V5 có tên em + hạn, nhưng web chưa có dữ liệu này. Mockup V8 chỉ ghi đích đổi trang. Có cần thêm dữ liệu máy chủ để hiện tên em không?
3. SOS: cùng câu hỏi với Hồ sơ lớp — số ngoài chip (23/10) hay trong chip (critique mục 4)?

## Critique mockup (Nielsen, tự chấm, một ngữ cảnh)
Detector `impeccable` báo 1 `dark-glow`. Đây là báo nhầm, do token `--bong-noi` khai trong `v5-nen.css` mà mockup không dùng.

| Vòng | Điểm | Đã sửa |
|---|---|---|
| 1 (bản đầu) | 31/40 | — |
| 2 | 32/40 | dòng Chờ bạn duyệt / Điều hướng chồng lên nhau (trùng lớp `.dong` của v5-nen) · căn đầu cột SOS = căn ô · ⓘ cạnh tiêu đề · rỗng ghi số 0 · thẻ 375 bỏ hàng mẫu trống |
| 3 | **33/40** | thêm lỗi tải một khối + Thử lại |

Điểm từng mục (vòng 3): Trạng thái 3 · Ngôn ngữ 4 · Kiểm soát 3 · Nhất quán 4 · Phòng lỗi 3 · Nhận ra 4 · Linh hoạt 3 · Tối giản 3 · Sửa lỗi 3 · Trợ giúp 3.
**Không còn P0 / P1.** P2 còn lại: trang QL ở 375 dài ~3100 px (bảng GV 5 thẻ); TVV 1440 còn nhiều khoảng trống.
