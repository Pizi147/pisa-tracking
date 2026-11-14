# GD-3 HOP-NHAP-GON + DONG-QUY-CHE — KHỚP / KHÁC

Mockup `thiet-ke/v21/trang-dau-gv.html` (chủ SP duyệt hẳn 14/11, lời 17–20) · plan `docs/superpowers/specs/2026-11-13-overhaul-v6/07-plan-giao-dien-dot-1.md` dòng GD-3 · khung K2, K2b, K4a, K4b, K4c, K5d, K5e.
Ảnh cặp (trái mockup | phải web, bộ demo): xem danh sách tệp ở cuối.

## Truy vết khung → thành phần → kết quả

| Khung | Thành phần mockup | Thành phần web | Kết quả |
|---|---|---|---|
| K2 / K3 / K4 / K5 | **Dòng quy chế**: "Quy chế" 12 px đậm mờ · câu 13 px màu phụ · ⓘ cuối · kẻ trên · ngay trên chân panel | `KhungPanel` prop `quyChe` (một chỗ cho mọi panel); câu ở `shared/domain/quyChe.ts` (không viết tay từng panel); ⓘ = `NutLuat` (chi tiết) | KHỚP |
| K2 | Panel Nhập điểm (lưới) + dòng quy chế vắng | `PanelViec` › nhập điểm theo lượt + theo tuần: FT `"-" = vắng: lần 1 dời sang tuần sau · lần 2 huỷ`; lớp thường (`mode = ratio` / `khung = thuong`) `"-" = vắng: môn đó dời sang tuần sau` (luật N38) | KHỚP (thêm biến thể lớp thường theo luật) |
| K2b | Chân hộp một ô: ⋯ · Vắng · (phải) **Lưu · bài tiếp ›** | `HopNhapDiem` chân thường | KHỚP |
| K2b | ⋯ = Lưu · đóng · Khôi phục điểm · Bỏ vắng (hai mục sau chỉ khi ô ở trạng thái đó) | `MenuDong` (menu ⋯ dùng chung: phím ↑↓ Enter Esc) | KHỚP |
| K2b | "Tiếp: {em} · {kỹ năng}" dòng trên nút | giữ (`nhanTiep`) | GIỮ |
| K4a / K4b | Chọn PA: hai ô chọn "Theo PA quy chế" (Mặc định) / "Giữ PA của tôi"; dòng quy chế + nút chính đổi theo ô | `XacNhanPaPanel` (khi PA của GV khác PA quy chế): radiogroup cùng dáng ô chọn của panel Xác nhận xử lý; Theo PA quy chế → "PA của bạn dừng, kết quả giữ" + **Xác nhận PA**; Giữ → "QL duyệt trong 3 ngày · quá hạn theo bạn" + **Gửi Quản lý duyệt** (luật S3: tên đầy đủ — mockup ghi "Gửi QL duyệt"), form PA ẩn | KHỚP |
| K4b | Ô "Lý do *" khi Giữ PA của tôi | ô Lý do + đếm `n / 300`; máy chủ `giu-pa-gv` đã có cột `ly_do` — nay chặn > 300 ký tự (N35, không cắt lặng), web gửi lý do; hiện lại ở thẻ duyệt QL ("Lý do: “…”"), dòng "Chờ QL duyệt PA của GV" trong panel Case và nhật ký | KHỚP (chủ SP chốt 14/11) — **không có dấu \***: luật Q3 "lý do không bắt buộc" (nghiệp vụ thắng mockup) |
| K4c | Ghi kết quả PA: dòng quy chế "Kỳ 2 tuần · hạn thứ Ba 22/09 · Lưu là chốt, đổi bằng Sửa" | `CapNhatTuan`: "Kỳ 2 tuần · hạn 22/09 · Lưu là chốt, đổi bằng Sửa" (không có ở Sửa kết quả và PA chờ Mini Test) | KHỚP (bỏ chữ thứ: luật P7 "một nhãn hạn, không thứ") |
| K5d / K5e | Ghi vi phạm: công tắc Vi phạm \| Chỉ nhắc nhở đổi dòng quy chế "GVCN nhận việc xem · đủ 3 trong 2 tuần thì phải xử lý" ↔ "Không tính vào bậc, không sinh việc" | `RecordViolationPanel` — câu dưới công tắc (chỉ có ở Nhắc nhở) chuyển xuống dòng quy chế, ⓘ giữ câu cũ đầy đủ | KHỚP |
| — | Các panel khác (Case, Ý thức GVCN, TVV…) | chưa gắn — chờ bảng câu mockup ⑤ (R5.5), đúng plan | GIỮ (để sau) |

**KHỚP 11 / 11 = 100 %** (chủ SP chốt 14/11 các XM: hạn không ghi thứ · "Gửi Quản lý duyệt" · Chọn PA quy chế vẫn nhập Nội dung · làm ô Lý do).

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau | |
|---|---|---|---|
| Lưu · bài tiếp › (Enter) | nút chính | nút chính | GIỮ |
| Vắng | nút ngoài | nút ngoài | GIỮ |
| Lưu (ở lại hộp, "✓ Đã lưu · Bài tiếp ›") khi còn bài kế | nút ngoài | **⋯ › Lưu · đóng** (lưu rồi đóng hộp) | ĐỔI — mockup K2b (chủ SP duyệt); "Lưu ở lại" gộp vào "Lưu · đóng" ([XM-3] mockup ①) |
| Lưu khi không có bài kế | nút chính | nút chính | GIỮ |
| Khôi phục điểm (ô điểm đã huỷ) | nút ngoài | ⋯ › Khôi phục điểm | ĐỔI chỗ |
| Bỏ vắng (ô Không dự thi) | nút ngoài | ⋯ › Bỏ vắng | ĐỔI chỗ |
| Ô vắng: Bỏ vắng · Lưu điểm · đóng | nút ngoài | như cũ | GIỮ |
| Hoàn tác 10 s sau Vắng | thông báo | như cũ | GIỮ |
| Chọn PA: Theo PA quy chế | nút chính "Theo PA quy chế" | ô chọn (mặc định) + "Xác nhận PA" | ĐỔI chữ |
| Chọn PA: Giữ PA của tôi | nút trong thân (1 bấm) | ô chọn + "Gửi Quản lý duyệt" ở chân (2 bấm) | ĐỔI — mockup K4b; chân nói trước hậu quả |
| Đề xuất PA khác… · Không cần theo dõi… · Ghi kết quả… | link dưới form | như cũ (ẩn khi chọn Giữ PA của tôi) | GIỮ |
| Xem chi tiết quy chế | câu tĩnh trong thân (nơi có) | ⓘ ở dòng quy chế | ĐỔI chỗ |

Không mất thao tác nào.

## [XM]
1. **[XM-1] — đã làm** (chủ SP 14/11): ô Lý do, không bắt buộc theo Q3. Nếu chủ SP muốn bắt buộc như dấu * của mockup thì là đổi luật Q3 — hỏi trước.
2. **[XM-2]** K4c ghi "hạn thứ Ba 22/09" — web theo luật P7 (không thứ). Giữ "hạn 22/09".

## Turso
0 câu / 0 dòng thêm — chỉ đổi giao diện, dùng dữ liệu panel đã nạp.

## Ảnh
- `k2-nhap-diem-1440.png` — K2 trang Công việc + panel Nhập điểm (GVCN Trần Ngọc Hà, MB FT 101 W3 SEP) · tối
- `k2b-hop-mot-o-1440.png` — K2b hộp một ô + ⋯ mở (ô thường: ⋯ chỉ có "Lưu · đóng"; Khôi phục điểm / Bỏ vắng chỉ khi ô ở trạng thái đó)
- `k4a-chon-pa-quy-che-1440.png` · `k4b-chon-pa-giu-1440.png` — Chọn PA trong panel Case (Công việc mở panel Case có thẻ PA; mockup vẽ panel riêng — khung panel giữ như web)
- `k4c-ket-qua-pa-1440.png` — Ghi kết quả PA: dòng quy chế ngay trên hàng nút
- `k5d-vi-pham-1440.png` · `k5e-nhac-nho-1440.png` — Ghi vi phạm ↔ nhắc nhở (hồ sơ lớp › Ý thức › + Ghi vi phạm)
- `k8-nhap-diem-375.png` — 375 sáng: panel Nhập điểm toàn màn, dòng quy chế xuống hai dòng khi hẹp (mockup K8c tối)

Ghi chú dữ liệu ảnh: seed không có Case nào có PA của GV khác PA quy chế — ảnh K4a/K4b chụp sau khi thêm một PA "Xếp tự học" (đang chạy) vào Case 36 trên DB demo của worktree (không commit).
Chọn PA · Theo PA quy chế vẫn hiện form PA (Nội dung *, Bắt đầu) — Xác nhận PA bắt buộc nội dung (luật, máy chủ chặn); mockup K4a không vẽ form → GIỮ form (tính năng theo luật).
