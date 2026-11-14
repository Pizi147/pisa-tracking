# XM-K6 — Kết quả PA / Mini Test ở hồ sơ lớp thường · khớp / khác

Mockup: `thiet-ke/v21/ho-so-lop.html` K6 (+ `ho-so-lop-ghi-chu.md` mục 0, lớp thường). Backlog GD-6 [XM-K6] (`docs/anh/gd6-ho-so-lop/khop-khac.md` dòng 34, 54, 78).
Dữ liệu seed 14/09 (tên bịa của bộ demo), GVCN tài khoản 7 · lớp MB FOU 15 (id 16). Phông Be Vietnam Pro đã nạp (`document.fonts.check` = true).

## Ảnh

| Ảnh | Nội dung |
|---|---|
| `cap-k6-1440-toi.png` | Bùi Minh Châu · R: PA có KQ → "Tiến bộ rõ / W3 SEP" + nút "Ghi kết quả cuối" + hạn (màu) — mockup │ web |
| `cap-k6-mini-test-1440-toi.png` | Ninh Gia Bảo · thẻ **Chung** (Case không gắn môn, Bổ trợ miễn phí 4 buổi): "– / Mini Test W4 SEP", "buổi 0 / 4 · đến Mini Test · 27/09", nút "Ghi kết quả PA" + hạn |
| `cap-k6-chua-kq-1440-toi.png` | Lê Hoàng Anh: PA chưa có KQ → "–" |
| `cap-375-sang.png` | 375 sáng: tóm tắt môn xếp dọc, Kết quả PA dưới Case · PA, nút cao 44 (mockup K8 là FT — không vẽ 375 lớp thường) |
| TRƯỚC | `docs/anh/gd6-ho-so-lop/cap-k6-1440-toi.png` (cột "Việc tiếp") |

## 1. Truy vết khung → thành phần → kết quả

| # | Khung K6 | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|---|
| 1 | Tóm tắt môn 3 cột: Điểm · Case · PA · Kết quả PA | `MoRongThuong` — cột 3 "Việc tiếp" → **Kết quả PA** | k6 | KHỚP |
| 2 | Kết quả PA = Mini Test: "–" + "Mini Test W4 SEP" (chưa ghi) | `KetQuaPaO` (máy chủ `pas[].miniTest`); đã ghi → `✓ / ✗ 75 %` (`ODiem`, ngưỡng `nguongMiniTest`) | mini-test | KHỚP |
| 3 | Case · PA: "Bổ trợ miễn phí · 4 buổi · đang chạy · buổi 2 / 4" | tên PA + dòng phụ "buổi a / b · mốc" (`pas[].buoi` + `mocChu`) | mini-test | KHỚP (chữ "đang chạy" đã ở trạng thái Case dòng trên) |
| 4 | Kết quả PA của PA thường | lần ghi có kết luận gần nhất: `NhanKetPa` + tuần (cùng kiểu FT `TomTatKn`) | k6 | KHỚP (mockup không vẽ, theo FT) |
| 5 | Giá trị trên, tuần dưới (chữ 13 mờ) | `KetQuaPaO` xếp dọc | k6 | KHỚP |
| 6 | — (mockup không vẽ nút việc) | Ghi kết quả PA → dưới Kết quả PA; Xác nhận Case / PA, Chờ QL duyệt → dưới Case trong cột Case · PA | k6, mini-test | GIỮ thao tác, đổi chỗ (xử lý tại chỗ: nút cạnh thứ nó làm) |
| 7 | — | Hạn của việc: `ChipHan` viên — đỏ quá hạn · vàng gần hạn · xám chưa tới, không biểu tượng (V22) | k6 | KHỚP V22 (trước: chữ "Quá hạn n ngày" / chữ mờ, không vàng) |
| 8 | — (lời 40) | Môn không Case / Case chưa PA: KHÔNG có cột Kết quả PA (Case · PA rộng ra); thẻ Chung không có cột Điểm | chua-kq | THEO LUẬT lời 40 |
| 9 | — | Thẻ **Chung** cuối hàng thẻ khi em có Case không gắn môn (vd Case "tổng hợp" của Bổ trợ miễn phí) — GD-6 làm rơi Case này (Ninh Gia Bảo hiện "Không Case" ở cả 4 môn) | mini-test | SỬA LỖI GD-6 [XM-K6a] |

## 2. Bảng thao tác TRƯỚC → SAU

| Thao tác | Trước (GD-6) | Sau | Ghi chú |
|---|---|---|---|
| Ghi kết quả PA (`viecCase` loai `ghi-ket-qua`, panel Ngăn Case) | nút ở cột "Việc tiếp" | nút dưới Kết quả PA, cùng `onMo` / panel | giữ |
| Xác nhận Case · Mô tả Case (`xac-nhan`) | cột "Việc tiếp" | dưới trạng thái Case (cột Case · PA) | giữ |
| Xác nhận PA (`xac-nhan-pa`) | cột "Việc tiếp" | dưới trạng thái Case | giữ |
| Chờ Quản lý duyệt (chữ bấm mở panel) | cột "Việc tiếp" | dưới trạng thái Case | giữ |
| Việc khác của Case (Thêm PA…) | cột "Việc tiếp" | dưới trạng thái Case | giữ |
| Xem chi tiết (panel Case) · + Case · Hồ sơ HV › | đầu tóm tắt | không đổi | giữ |
| Việc của Case không gắn môn (Bổ trợ miễn phí tổng hợp) | **mất** (không thẻ nào) | thẻ Chung → cùng nút, cùng panel | lấy lại |

Không thao tác nào bị mất.

## 3. Turso (bản chép thật `mig.sqlite` 12/11 + migrate, `scripts/do-ban-chep.mjs`)

| Đường | Trước | Sau |
|---|---|---|
| `/classes/{lớp thường}/can-ho-tro` (CP BE 71 · UB FOU 08 · MB BE 117; GVCN / GVBM / QL) | 8 câu · 111–132 dòng · 4 dòng quét cả bảng | 9 câu · 125–148 dòng · 4 dòng quét cả bảng (bước máy ảo +~10 %) |
| `/classes/{FT}/can-ho-tro` | — | không đổi (câu mới chỉ chạy với lớp `ratio`) |

Một câu theo lô Case (`idx_followup_iv`, Mini Test ≤ 1 dòng / PA), `ORDER BY iv.id`; JSON phần cũ y hệt trước (so `PISA_IN_JSON`). Trần `tocDoDuong.ts`: lớp thường 25 → 26 (QT 22 → 23). Ước thêm ≈ 15 dòng mỗi lần mở một em lớp thường (đường đọc một lần cho cả lớp) — không đáng kể so trần 15 triệu / ngày.

## 4. Phép kiểm

- `prHvl.tests.ts` "XM-K6 · can-ho-tro…": Case không PA (pas rỗng) · PA có KQ (lần có kết luận gần nhất, buổi 2 / 4) · PA huỷ không có · Mini Test chưa ghi / đã ghi (đạt theo ngưỡng) · FT không đọc thêm · ≤ 1 câu thêm.
- "XM-K6 · web…": cột Kết quả PA chỉ khi có PA, nút việc giữ `viecCase`, hạn `ChipHan`.
- impeccable detector 0 phát hiện; audit tay (a11y, 375, token) đạt; web-design-guidelines đạt.

## 5. Để sau

- Không có.
