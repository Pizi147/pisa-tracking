# GD-20b BAN-GIAO-CHEN — "Chèn" từng ô + "Chèn cho n em" ở bàn giao (mockup ⑫ `thiet-ke/v21/gv-viet-it.html` B1–B4, E2)

Dùng chung thành phần của GD-20a (`web/src/ui/KhoiDaGhi.tsx`: `KhoiDaGhi` · `useChen` · thêm `useChenLo` + `DaiChenLo`), không dựng bản thứ hai.

## Ảnh cặp (trái mockup │ phải web; demo 14/09; `scripts/anh-cap.mjs`, Edge headless 1:1)
Seed không có đủ ca → thêm vào DB demo CỤC BỘ (không commit, như session mockup): mô tả Case R / W2 cho vài em MB FOU 22 · MB FT 103, Tình hình học tập 2 em MB FT 103, một việc bàn giao đổi GV (MB FT 101 · R: GV 7 → GV 9); xoá câu R seed sẵn của phiếu MB FOU 22.
| Ảnh | Khung | Web |
|---|---|---|
| `cap-1440-toi-b1.png` | B1 | GV 8 · mở từ Công việc › Vận hành › Bàn giao môn R · G+V (MB FOU 22, bảng hai cột vì GV dạy cả R và G+V): ô trống có dòng "Mô tả Case · câu" + Chèn; "Cùng GV" không dòng; chân Đóng · Việc tiếp › (nút chính) |
| `cap-1440-toi-b3.png` | B3 | GV 10 (GVCN MB FT 103): "Chèn cho 2 em" đầu danh sách, khối "Bạn đã ghi tháng này" cạnh Nhận xét chung, nút "GVCN xác nhận bàn giao" giữ |
| `cap-1440-toi-b4.png` | B4 | GV 7 · đổi GV MB FT 101 · R sau "Chèn cho 9 em": dải "✓ Đã chèn 9 em · Hoàn tác", chip "Đã chèn", khối cạnh ô góp ý, "Xác nhận bàn giao" giữ |
| `cap-375-sang-e2.png` | E2 | 375 sáng · mở từ Công việc · thẻ từng em, Chèn 44 px, chân Đóng · Việc tiếp › |

B2 (dải sau "Chèn cho n em" ở bảng GVBM): seed chỉ có một ô GVBM không "Cùng GV" nên nút không hiện (cần ≥ 2); cùng `useChenLo` + `DaiChenLo` với B4 (ảnh b4) — bấm thử ở mục "Bấm thử".

## Truy vết khung → thành phần → ảnh
| # | Khung | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|---|
| 1 | B1 bảng GVBM (Học viên · Kết quả · Thông tin bàn giao), "Cùng GV", "● Đang gõ", "✓ Đã lưu", "Còn n em ↑", Đóng · Việc tiếp › | `BangGvbm` (GIỮ) | b1 | GIỮ |
| 2 | B1 dưới ô TRỐNG một dòng "nguồn · câu" (≤ 2 dòng) + Chèn; ô có câu / "Cùng GV" / em không có nguồn → không dòng | `.goi-bg` + `cauBanGiao` | b1, e2 | KHỚP |
| 3 | B1 dải trên bảng "a / b em đã có" + "Chèn cho n em" (≥ 2 ô trống có gợi ý) | dải trên bảng trong `BangGvbm` | (seed 1 ô) | KHỚP (mã) |
| 4 | B2 sau chèn: ô có chữ, tự lưu như gõ; "✓ Đã chèn n em · Hoàn tác" 10 giây | `useChenLo` + `DaiChenLo`; gỡ = `POST /lenh-chuyen/:id/ban-giao-mon/go-chen` | b4 (cùng thành phần) | KHỚP |
| 5 | B3 panel GVCN: danh sách em, Tự điền, câu GVBM + Viết / Điền thay, Nhận xét chung, "GVCN xác nhận bàn giao" | `MasterDetail` (GIỮ) | b3 | GIỮ |
| 6 | B3 "Chèn cho n em" đầu danh sách | `DsEmBanGiao dau` (MỚI prop) | b3 | KHỚP |
| 7 | B3 khối "Bạn đã ghi tháng này" cạnh Nhận xét chung (vi phạm · xử lý · tình hình) | `KhoiDaGhi` + `useChen` (lưu nháp như gõ) | b3 | KHỚP |
| 8 | B4 panel đổi GV: Nhận xét chung cả lớp, danh sách em, Tự điền, ô góp ý, Em tiếp ↓, Xác nhận bàn giao | `BanGiaoGvPanel` (GIỮ) | b4 | GIỮ |
| 9 | B4 dải "✓ Đã chèn n em · Hoàn tác" + chip "Đã chèn" (không chặn Xác nhận, mất khi mở em) | `DaiChenLo` + `ttHien` (chỉ hiển thị, không vào số đủ) | b4 | KHỚP |
| 10 | B4 khối cạnh ô góp ý; câu đã có trong ô → "✓ Đã chèn" | `OGopY goiY` (MỚI prop) + `KhoiDaGhi chu` | b4 | KHỚP |
| 11 | E2 375: thẻ từng em, Chèn 44 px | `@media (max-width: 639px)` | e2 | KHỚP |
| BỎ | — | không bỏ thành phần nào | — | — |

## KHÁC (có lý do)
1. **Dải "Chèn cho n em" của panel đổi GV nằm trên danh sách em**, mockup B4 đặt ngang cả panel dưới "Nhận xét chung cả lớp". Lý do: cùng chỗ với panel GVCN (B3 đặt trong danh sách) — một chỗ cho một thao tác, khỏi thêm một dải ngang. [XM-c].
2. **Nguồn MT không "/ kỳ vọng"** — như GD-20a [XM-b].
3. **Tên nguồn mô tả Case là "Mô tả Case"**, mockup "Case R" — cùng chữ khối A (một khái niệm một tên).
4. Panel đổi GV ở mockup có chip hạn đầu trang ("hạn hôm nay") — web giữ chip hạn ở dòng phụ như cũ (GD-4, không thuộc PR).

## Thao tác TRƯỚC → SAU (không mất thao tác)
| Thao tác | TRƯỚC | SAU | Ghi chú |
|---|---|---|---|
| GVBM viết câu bàn giao | gõ từng ô | gõ; **Chèn** từng ô; **Chèn cho n em** + **Hoàn tác** 10 giây | MỚI |
| "Cần làm lại" + "Giữ và lưu", "Không học {môn}", "Còn n em ↑", Việc tiếp › | có | có | GIỮ |
| GVCN viết Nhận xét chung (nháp), Viết / Điền thay câu GVBM, Xác nhận từng em, Sửa → Huỷ thay đổi / Lưu, ↑↓ | có | có + **Chèn** cạnh ô, **Chèn cho n em** + Hoàn tác | MỚI |
| Đổi GV: góp ý từng em, Nhận xét chung cả lớp, Em tiếp ↓, Xác nhận bàn giao, Xác nhận · việc tiếp › | có | có + **Chèn** cạnh ô, **Chèn cho n em** + Hoàn tác, chip "Đã chèn" | MỚI |
| Tự điền · chỉ đọc (`TuDien`) | có | có | GIỮ |

## Sửa sau rà PTA (#1745)
- [XM-c] PTA đồng ý.
- Chân bảng GVBM: mở từ Công việc (có việc kế) → "Việc tiếp ›" luôn là nút chính bên phải (trước: nút thường khi còn em thiếu); mở từ hồ sơ lớp → chỉ "Đóng". Chụp lại b1 + e2 từ Công việc.
- Tiêu đề panel 375 bị cắt "… MB F…" (PTA: sửa luôn): `KhungPanel` đầu panel dạng thường — < 640 px tiêu đề xuống dòng, không "…", ✕ cùng hàng góc phải trên; ≥ 640 một dòng như cũ. Soi 3 panel 375: Bàn giao môn R · G+V · MB FOU 22 (2 dòng) · Bàn giao MB FT 101 · R cho Phạm Thu Trang (2 dòng) · Báo cáo PH · MB FT 101 · Nhận xét chung (1 dòng, ✕ ở hàng "‹ Quay lại") — không panel nào còn cắt. Chụp lại e2.

## Máy chủ
- `POST /lenh-chuyen/:id/ban-giao-mon/go-chen` · `POST /ban-giao-gv/:id/gop-y/go-chen`: Hoàn tác "Chèn cho n em" — máy chủ không nhận câu rỗng nên cần đường gỡ. Cùng quyền ghi; chỉ xoá khi câu đang lưu ĐÚNG bằng câu vừa chèn (đã sửa → giữ, `ok: false`); có nhật ký (`ban_giao.go_chen`, `ban_giao_gv.go_chen`). Nhận xét chung GVCN: dùng đường nháp sẵn có (nhận rỗng).

## Lượt đọc Turso
- Mỗi panel bàn giao: **+1 request** `GET /classes/:id/chu-da-ghi?tu=&den=` (30 ngày gần nhất), một lần khi mở; panel chỉ đọc (người xem không viết) không gọi. tocDo: 6 câu (4 câu chữ + 2 phiên), trần 8 (LG-13).

## Bấm thử (Edge, dev demo)
- Đổi GV (GV 7, 33 em): Chèn cho 9 em → "9/33 em đủ góp ý", dải + chip; Hoàn tác → "0/33", 9 PUT + 9 gỡ, 0 lỗi; DB về 0 góp ý.
- GVCN (GV 10, MB FT 103): Chèn cho 2 em → nháp "Em tập trung hơn…" lưu; Hoàn tác → ô trống, nháp về rỗng (DB `nhan_xet_chung` NULL).
- GVBM (GV 8, MB FOU 22): Chèn một ô → câu vào ô, lưu như gõ.
- impeccable `detect`: 0 lỗi trên 4 tệp. Phép kiểm máy chủ: `prCt` + `prBanGiaoGv` (gỡ khớp / đã sửa / sai quyền / nhật ký), `prLg13` (`cauBanGiao`).
