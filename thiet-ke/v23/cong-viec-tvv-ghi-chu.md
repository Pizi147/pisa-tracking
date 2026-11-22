# v23 ③ Công việc TVV — ghi chú

Mockup: [`cong-viec-tvv.html`](cong-viec-tvv.html) · ảnh `anh/cong-viec-tvv-*.png`. Đặc tả mục 1, 3.

## Truy vết

| Ý / mục | Khung | Thành phần web |
|---|---|---|
| Đầu trang "n việc · m quá hạn" | T1, T3a | `CongViecPage.tsx` |
| Tab TVV giữ thứ tự: Báo PH · Bổ sung hồ sơ · Vận hành · Sau thi · Đang theo dõi | T1, T2 | `NHOM_CV_TVV` |
| Theo loại việc, đầu mục nổi; dòng "em · còn thiếu gì" trước | T1, T2, T3a | `DanhSachViec.tsx` |
| "HV của tôi" gọn: tên · lớp · một chip (mục 3) | T1, T3a | `HvCuaToi.tsx` (4 cột; 375: 3 cột, lớp xuống dòng phụ) |
| Panel Sau thi có "Không thi" | T2, T3b | `PanelSauThi.tsx` (đoạn chọn Đã thi · Không thi) |
| W1 / W2 (điểm thi thật) | — | thi thật nhập L R W S band (giữ như web: W là một band IELTS) |

## Thao tác TRƯỚC → SAU

| Trước | Sau |
|---|---|
| Ghi báo PH / Bổ sung / Ghi KQ / Chọn | giữ |
| Không thi | giữ (đoạn chọn đầu thân) |
| Lưu điểm · Chốt bước tiếp | giữ hai nút chân |
| Hoàn tác sau lưu | giữ |
| HV của tôi: Tìm em, "n em khác ›", số việc bấm lọc | giữ |
| HV của tôi: cột "Việc cần làm" chữ dài | thay bằng số (bấm = lọc theo em) |
| + Task | giữ |

## Tự rà

- Như GV + bảng HV gọn: đạt. Panel Sau thi "Không thi": đạt (T2, T3b). Trạng thái: có việc · quá hạn · chưa lưu · đã lưu · rỗng (T4).
- Không có Phân tích ở menu TVV (ý 14 — SUA làm): ảnh đã bỏ.

## [XM]

- [XM-3] Bước tiếp ghi "gợi ý theo kết quả" trong ô (chữ nhỏ) — là dữ liệu `goiYSauThi`, không phải chú thích tĩnh; bỏ nếu chủ SP thấy thừa.

Critique: **35 / 40**, không P0 / P1.

## Góp ý chủ SP 22/11 vòng 2 (qua PTA Plan) — đã sửa

- Luật hạn: mọi ngày dd/mm/yyyy, hạn vàng khi còn ≤ 2 ngày, đỏ quá hạn; "quá hạn n ngày" chỉ ở dòng Công việc / đầu panel (hồ sơ HV · Phối hợp SOS chỉ tô đỏ ngày). Thang 375: ngày dưới chấm ẩn (rê / bấm xem), "kế tiếp" giữ.
