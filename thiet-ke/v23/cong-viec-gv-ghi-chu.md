# v23 ② Công việc GV — ghi chú

Mockup: [`cong-viec-gv.html`](cong-viec-gv.html) · ảnh `anh/cong-viec-gv-*.png`. Đặc tả mục 1, 3 (bản #1975: **Công việc mọi vai theo loại việc**).

## Truy vết

| Ý / mục | Khung | Thành phần web |
|---|---|---|
| Đầu trang chỉ "n việc · m quá hạn" (mục 0, 3) | G1, G3 | `CongViecPage.tsx` đầu trang (bỏ `DaiSo`) |
| Theo loại việc, đầu mục nổi + "n việc · m quá hạn" (chủ SP 22/11, mục 3) | G1, G2 | tab `TAB_CV` giữ; đầu nhóm `DaiNhom` → `.ds-dau` (nền surface-2, vạch nhấn, 16 / 700) |
| Mỗi lớp một dòng, thứ còn thiếu trước "MB FT 101 · W3 NOV · thiếu 5 em" (ý 9a, mục 3) | G1 | `DanhSachViec.tsx` dòng việc (SUA-2211-B đã tách "Cả lớp") |
| ≤ 2 chip, ≤ 1 điểm màu (mục 1) | G1 | chip kỹ năng gom một chip; hạn = chữ |
| W1 / W2 tách (chủ SP 22/11 trong phiên) | G1, G3 | chip "L R W1 W2" theo bài thiếu |
| Lớp của tôi (v21) giữ | G1 | `LopCuaToi.tsx` → bảng 4 cột cố định |
| Panel 58 % (mục 2) | G2, G3b | `KhungPanel` |

## Thao tác TRƯỚC → SAU

| Trước | Sau |
|---|---|
| Bấm dòng → panel | giữ |
| Nút "Nhập điểm" / "Ghi mô tả" / "Chọn PA" | giữ (một nút / dòng) |
| "Cả lớp · 2 lớp" ▾ mở khay lớp | thay bằng mỗi lớp một dòng (SUA-2211-B) |
| + Task | giữ |
| Lớp của tôi (link lớp, số việc) | giữ, bảng gọn |
| Hết việc → "Việc tiếp ›" | giữ (G4a) |
| 375 chạm cả dòng | giữ |

## Tự rà

- Đầu trang một dòng: đạt. Dòng ≤ 2 chip, ≤ 1 màu: đạt. Theo loại, không trộn loại: đạt. Không ghi người phụ trách (GV xem việc của mình): đạt.
- Trạng thái: có việc + quá hạn (G1) · đang lưu (G2) · lỗi lưu (G3b) · rỗng (G4a) · lỗi tải (G4b).

## [XM]

- [XM-2] Khối cây ba tầng V18 (nhóm → em → việc) cho Case / Ý thức thành dòng phẳng "em · còn thiếu gì" + lớp ở dòng phụ — theo đặc tả 22/11 (dòng phụ chỉ giữ em / lớp / tuần / số bài). Nếu chủ SP muốn giữ khối em (một em nhiều việc), PR màn có thể gom bằng thứ tự, không thêm tầng.

Critique: **35 / 40**, không P0 / P1.

## Góp ý chủ SP 22/11 (qua PTA Plan) — đã sửa

| Góp ý | Sửa |
|---|---|
| 4 chữ dài | khối nguồn Case: điểm hai lần trước đậm; ô Mô tả là chữ người dùng gõ (không định dạng) |
| 2 khối Phụ trách | Mô tả Case / Chọn PA là việc học thuật (N58 không áp) → giữ khối gập |

## Góp ý chủ SP 22/11 vòng 2 (qua PTA Plan) — đã sửa

- Luật hạn: mọi ngày dd/mm/yyyy, hạn vàng khi còn ≤ 2 ngày, đỏ quá hạn; "quá hạn n ngày" chỉ ở dòng Công việc / đầu panel (hồ sơ HV · Phối hợp SOS chỉ tô đỏ ngày). Thang 375: ngày dưới chấm ẩn (rê / bấm xem), "kế tiếp" giữ.
