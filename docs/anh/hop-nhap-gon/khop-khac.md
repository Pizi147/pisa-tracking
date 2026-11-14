# GD-3 HOP-NHAP-GON + DONG-QUY-CHE — KHỚP / KHÁC

Mockup `thiet-ke/v21/trang-dau-gv.html` (chủ SP duyệt hẳn 14/11, lời 17–20) · plan `docs/superpowers/specs/2026-11-13-overhaul-v6/07-plan-giao-dien-dot-1.md` dòng GD-3 · khung K2, K2b, K4a, K4b, K4c, K5d, K5e.
Ảnh cặp (trái mockup | phải web, bộ demo): xem danh sách tệp ở cuối.

## Truy vết khung → thành phần → kết quả (đếm lại sau góp ý chủ SP 14/11: "nhập điểm giống mockup hơn, cột cân đối; panel Case + vi phạm giống mockup, phần cần thiết mockup không có vẫn để")

| # | Khung | Thành phần mockup | Web | Kết quả |
|---|---|---|---|---|
| 1 | K2–K5 | Dòng quy chế ("Quy chế" · câu 13 px · ⓘ) ngay trên chân | `KhungPanel.quyChe` / `DongQuyChe`, câu ở `shared/domain/quyChe.ts` | KHỚP |
| 2 | K2 | Panel một lớp: tiêu đề = tên việc "Nhập điểm Listening, Reading", dòng 2 lớp · tuần · bài, lưới ngay dưới | `PanelNhapDiemTuan`: một lớp → không hàng gập lớp | KHỚP (dòng 2 ghi "10 bài", không "MT1 · còn 4 / 10" — dữ liệu dòng việc không có số còn lại) |
| 3 | K2 | Lưới: cột tên lấy phần còn lại, cột ô 112, Kết quả 132; đầu cột 12 / 600 màu mờ, đệm 8, nền trong; ô đệm 6 × 8, hàng 57, căn giữa dọc; lưới cách mép panel 20 | `OTrongPanel` (LuoiTrongPanel) → `LuoiFT` + `index.css .luoi-trong-panel` | KHỚP — đo DevTools: mockup 338 / 112 / 112 / 132 · hàng 57 · ô 96 × 44 viền 1 px rgb(102,120,159) bo 6; web 346 / 112 / 112 / 132 (panel web rộng hơn 8 px) · 57 · 96 × 44 · cùng viền / bo |
| 4 | K2 | Ô điểm 96 × 44, viền liền (trống cũng liền), số 15 + "27 câu" TRONG ô | `ODiemMt` nhánh trong panel | KHỚP |
| 5 | K2 | Kết quả "Chờ R" / "Chờ L, R" (chỉ kỹ năng của việc) | `choMon(row, hien)` trong panel | KHỚP |
| 6 | K2 | — | hàng "Mở lưới đầy đủ ›" · "Cả lớp" trên lưới | GIỮ (thao tác cũ, mockup không vẽ) |
| 7 | K2b | Hộp 440, đầu có ✕ (cao 67, đệm 12 12 10 16), thân / chân đệm 16; chân ⋯ (36 × 30) · Vắng · Lưu · bài tiếp › + "Tiếp: …" | `KhungHop` + `HopNhapDiem` (thêm ✕ cùng đường Esc) | KHỚP — đo DevTools cùng số |
| 8 | K2b | ⋯ = Lưu · đóng · Khôi phục điểm · Bỏ vắng, menu canh mép trái nút | `MenuDong canhTrai` | KHỚP (sát đáy màn thì menu mở lên) |
| 9 | K4a/b | Nhãn "Phương án" + hai ô chọn (Mặc định), dòng quy chế + nút chính đổi theo ô | `XacNhanPaPanel` | KHỚP |
| 10 | K4b | Ô "Lý do" | ô + đếm n / 300, máy chủ lưu, hiện ở thẻ QL + panel Case | KHỚP (không dấu * — luật Q3, PTA đang hỏi chủ SP) |
| 11 | K4a/b | Panel riêng "Chọn PA · Reading", dải "Reading 4.5 · kỳ vọng 5.5" | việc mở panel Case (đầu Case, Case trước) + thẻ PA chứa form | KHÁC có lý do: luồng V20 / CASE-PA-UI mở việc PA trong panel Case — đổi luồng ngoài phạm vi |
| 12 | K4a | Chỉ hai ô chọn | form PA (Nội dung *, Số buổi, Người dạy, Bắt đầu) + 3 link (Ghi kết quả… · Đề xuất PA khác… · Không cần theo dõi…) | GIỮ (luật: Xác nhận PA cần Nội dung — chủ SP 14/11) |
| 13 | K4c | Dải bối cảnh ĐẦU form, rồi Tiến triển · Nhận xét · Quyết định | `BoiCanh` lên đầu | KHỚP (nội dung dải theo nơi gọi: "Kết quả kỳ trước · Điểm") |
| 14 | K4c | Chip Tiến triển tròn có ký hiệu ✓ ↗ – ↓ ? | `KY_HIEU_TIEN_TRIEN` | KHỚP |
| 15 | K4c | Quyết định hàng chip tròn | chip tròn; PA quy chế chỉ Giữ nguyên · Điều chỉnh | KHỚP dáng (số lựa chọn theo luật) |
| 16 | K4c | Chân "Lưu nháp" (nút) · "Lưu" | đúng thứ tự + chữ; "Lưu kết quả" → "Lưu" (lời 13/11) | KHỚP |
| 17 | K4c | — | "Ngày ghi", câu "PA theo quy chế — không thay…" + "+ Thêm PA" | GIỮ (ghi lùi ngày, lối thêm PA) |
| 24 | K2 | Tiêu đề panel việc 17 / 700 | `KhungPanel` (Công việc): 22 → 17 (v21 ① thắng v17) | KHỚP |
| 18 | K5d/e | Đầu "Ý thức" · tiêu đề · dòng 2; không dòng "* = bắt buộc" | `dau` + bỏ ngCanh | KHỚP |
| 19 | K5d/e | Công tắc gọn · Học viên · Nhóm chip tròn · Vi phạm · Môn + Ngày · Mô tả (tuỳ chọn) · Bằng chứng một hàng; không tiêu đề khối | `RecordViolationPanel` / `DongViPham` sắp lại | KHỚP |
| 20 | K5d/e | Chân "Chưa lưu" · Đóng · Lưu vi phạm / Lưu nhắc nhở | `chan.trai` + `huyPhai` | KHỚP |
| 21 | K5d | Học viên là chip em đã chọn | ô chọn em của lớp (chọn nhiều) | GIỮ (ghi nhiều em một lần; ô chọn có tìm làm ở đợt ⑤) |
| 22 | K5d | — | "+ Thêm vi phạm", bộ đếm 0 / 60, cảnh báo trùng | GIỮ (thao tác cũ) |
| 23 | K8 375 | Ô điểm viền liền, dòng quy chế | ô dáng #4 cả dạng điện thoại; quy chế xuống 2 dòng khi hẹp | KHỚP (tab kỹ năng L / R / W1… của dạng điện thoại GIỮ — mockup chỉ vẽ 375 Chấm Speaking) |

**Đếm (bỏ dòng GIỮ — tính năng mockup không vẽ): KHỚP 17 / 18 = 94 %.** Còn lệch nhỏ đã biết (không tính KHÁC): dòng 2 panel không có "MT1 · còn x / y"; tên em có link lượt "MT3 ›" (GIỮ thao tác mở lượt); vạch hồng trước "Việc · …" chưa có. 1 KHÁC có lý do (#11: việc PA mở trong panel Case). 6 dòng GIỮ có lý do.

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

| Ghi kết quả PA: lưu (Giữ nguyên) | nút "Lưu kết quả" | nút "Lưu" | ĐỔI chữ (mockup K4c, lời 13/11) |
| Ghi kết quả PA: Lưu nháp | link chữ sau nút chính | nút phụ trước nút chính | ĐỔI dáng |
| Ghi kết quả PA: chọn Quyết định | nút đoạn | chip tròn | ĐỔI dáng |
| Ghi vi phạm: lưu | nút "Lưu" | nút "Lưu vi phạm" (nhắc nhở: "Lưu nhắc nhở" như cũ) | ĐỔI chữ |
| Ghi vi phạm: Đóng | chỉ ✕ / Esc (Đóng khi lưu lỗi một phần) | ✕ / Esc + nút Đóng ở chân (cùng đường hỏi bỏ chữ) | GIỮ + thêm |
| Nhập điểm (panel một lớp) | bấm hàng lớp để mở / gập lưới | lưới mở sẵn, không hàng lớp (nhiều lớp: giữ hàng gập) | ĐỔI (mockup K2) |

Không mất thao tác nào.

## [XM]
1. **[XM-1] — đã làm** (chủ SP 14/11): ô Lý do, không bắt buộc theo Q3. Nếu chủ SP muốn bắt buộc như dấu * của mockup thì là đổi luật Q3 — hỏi trước.
2. **[XM-2]** K4c ghi "hạn thứ Ba 22/09" — web theo luật P7 (không thứ). Giữ "hạn 22/09".

## Turso
0 câu / 0 dòng thêm — chỉ đổi giao diện, dùng dữ liệu panel đã nạp.

## Ảnh
- `k2-nhap-diem-1440.png` — K2 trang Công việc + panel Nhập điểm (GVCN Trần Ngọc Hà, MB FT 101 W3 SEP) · tối · cùng tỉ lệ 1:1
- `k2-panel-nhap-diem-1440.png` — chỉ panel Nhập điểm, mockup | web cùng tỉ lệ 1:1 (đo px)
- `k2b-hop-mot-o-1440.png` — K2b hộp một ô + ⋯ mở (ô thường: ⋯ chỉ có "Lưu · đóng"; Khôi phục điểm / Bỏ vắng chỉ khi ô ở trạng thái đó)
- `k4a-chon-pa-quy-che-1440.png` · `k4b-chon-pa-giu-1440.png` — Chọn PA trong panel Case (Công việc mở panel Case có thẻ PA; mockup vẽ panel riêng — khung panel giữ như web)
- `k4c-ket-qua-pa-1440.png` — Ghi kết quả PA: dòng quy chế ngay trên hàng nút
- `k5d-vi-pham-1440.png` · `k5e-nhac-nho-1440.png` — Ghi vi phạm ↔ nhắc nhở (hồ sơ lớp › Ý thức › + Ghi vi phạm)
- `k8-nhap-diem-375.png` — 375 sáng: panel Nhập điểm toàn màn, dòng quy chế xuống hai dòng khi hẹp (mockup K8c tối)

Ghi chú dữ liệu ảnh: seed không có Case nào có PA của GV khác PA quy chế — ảnh K4a/K4b chụp sau khi thêm một PA "Xếp tự học" (đang chạy) vào Case 36 trên DB demo của worktree (không commit).
Chọn PA · Theo PA quy chế vẫn hiện form PA (Nội dung *, Bắt đầu) — Xác nhận PA bắt buộc nội dung (luật, máy chủ chặn); mockup K4a không vẽ form → GIỮ form (tính năng theo luật).
