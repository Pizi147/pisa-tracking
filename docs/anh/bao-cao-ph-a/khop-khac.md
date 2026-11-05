# BAO-CAO-PH a — tab Báo cáo PH (hồ sơ lớp) + panel viết / đọc

Mockup: `thiet-ke/v15/bao-cao-ph.html` (chủ SP duyệt 06/11), ghi chú `thiet-ke/v15/bao-cao-ph-ghi-chu.md` (bản 2 thắng). Đặc tả: `docs/superpowers/specs/2026-11-05-bao-cao-ph/de-xuat.md` mục 10–12.
Dữ liệu web: bộ demo (MB FT 101 · 33 em, MB FOU 12 · 7 em), ngày demo 24/09/2026 (đợt Tháng 9 đang mở; FOU Final W3 SEP quá hạn 4 ngày). Mockup dùng MB FT 131 · 12 em · 24/11.

## Ảnh cặp (mockup | web) — `scripts/anh-cap.mjs`

| Khung | Tệp |
|---|---|
| t1 · tab, GV (Trần Ngọc Hà) · 1440 tối | `cap-t1-tab-gv-1440-toi.png` |
| d1 · tab, QL · 1440 tối | `cap-d1-tab-ql-1440-toi.png` |
| e1 · lớp FOU (L R W P, quá hạn) · 1440 tối | `cap-e1-fou-1440-toi.png` |
| t2 · panel viết L · 1440 tối | `cap-t2-panel-viet-1440-toi.png` |
| c1 · panel Nhận xét chung · 1440 tối | `cap-c1-chung-1440-toi.png` |
| d3 · panel đọc + Viết hộ (QL) · 1440 tối | `cap-d3-panel-doc-1440-toi.png` |
| g2 · tab 375 sáng | `cap-g2-tab-375-sang.png` |
| g1 · panel viết 375 sáng | `cap-g1-panel-375-sang.png` |

## Truy vết khung → thành phần

| # | Mockup | Web | Kết quả |
|---|---|---|---|
| 1 | Tab thứ 4 "Báo cáo PH" sau Phân tích lớp + chip nhẹ "Tháng 11 · hạn 30/11" (t0, t1) | `TAB_HO_SO_LOP` + `HangTab.chip` (12 px, nền bề mặt 2, chữ mờ) | KHỚP |
| 2 | Chip quá hạn đỏ "⚠ Progress · W3 NOV · quá hạn 2 ngày" (e1) | `chip.xau` — nền / chữ `late`, có ⚠ (không chỉ màu); chỉ khi đợt mới nhất quá hạn ≤ 7 ngày và lớp chưa đủ | KHỚP |
| 3 | Hàng công cụ ngoài bảng: ô chọn đợt · "3/12 em đủ" · Xuất lớp (QL / Admin / TVV) | `ChonDangNut` + số đậm + nút Xuất lớp (GV không có nút) | KHỚP |
| 4 | Bảng: Học viên · phần · cột Xuất; đầu cột hai dòng mã + tên GV / "Bạn" / "Chưa phân công" (G9: chỉ chữ) | bảng chung `Bang` (luật BANG-3), `phu` = tên GV xuống dòng (`.bang-bc .bang-chu-thich`) | KHỚP — đầu cột theo `Bang` chung (nền đầu cột, cột cuối ghi "Xuất" cho trình đọc màn); hàng 44 px của `Bang` |
| 5 | Ô: ✓ mờ · "nháp" vàng · "–" có viền khi người xem viết được (GV phần mình; QL mọi phần), không viền khi chỉ đọc | `.o-bc du / nhap(.cua) / chua(.doc)`; `aria-label` "{em} · {phần} · Đủ / Nháp / Chưa viết" | KHỚP |
| 6 | Dòng chân "Đủ" n/N mỗi cột | `tfoot` | KHỚP |
| 7 | d5 "Chưa có đợt · Đợt đầu: …"; chương trình chưa có mẫu → không có tab | `dotDau` (máy chủ) · `baoCaoPh = null` → không tab | KHỚP |
| 8 | Panel viết: dòng loại "BÁO CÁO PH · VIẾT", tiêu đề, ngữ cảnh "Tháng 11 · 4/12 em đủ · hạn 30/11" | `KhungPanel loai + dau.dong2` | KHỚP |
| 9 | Trái danh sách em (✓ đủ / nháp, em đang chọn vạch nhấn) | danh sách nút `aria-current` | KHỚP |
| 10 | Điểm "✓ 6.5 · MT4 · W3 NOV · Sửa"; đã sửa "6.0 · đã sửa · gốc 6.5 · Về điểm gốc" | `ODiem` (cùng màu kết quả), chip lượt + `tuanLich`, ô sửa tại chỗ (band 0–9 bước 0.5 / 0 → tổng; sai: viền đỏ + câu lỗi, không lưu) | KHỚP |
| 11 | Tiêu chí: hàng 4 nút trung tính, đang chọn nền nhấn, đặt sẵn viền đứt + chip "Đặt sẵn như Tháng 10"; hàng trống chấm vàng + viền nhóm vàng | `HangThang` + `.thang-bc` (radio, roving tabindex, ← → / phím 1–4, `aria-description` "như …") | KHỚP |
| 12 | GVCN: đầu mục "Trách nhiệm học tập" (3) · "Thái độ học tập" (4), ô "Nhận xét chung", không ô Điểm (c1) | dữ liệu `shared/domain/baoCaoPh.ts` | KHỚP |
| 13 | Chân: "Tự lưu khi rời ô · ✓ Đã lưu 14:02" · "Tiếp: {em}" · **Lưu · em tiếp ›** | `ChuLuu` + `chan.phu` + nút chính | KHỚP |
| 14 | a2 Hết em: "Đã xong phần của bạn" + **Phần tiếp ›** · **Lớp tiếp ›** · Đóng | Phần tiếp + Đóng | KHÁC — "Lớp tiếp" cần đọc lớp khác của GV (thêm request). Ghi Việc để sau |
| 15 | d3 panel đọc: Điểm · Tiêu chí (tên… **mức**, "n tiêu chí chưa chọn") · ô chữ · Lần sửa cuối; QL **Viết hộ** | `PanelDocBc` (ngăn phải 480 px như mọi panel đọc) | KHỚP (mockup vẽ thẻ cao theo nội dung; web giữ khung panel chung) |
| 16 | g2 375: "Phần của bạn" (Viết Chung · 9/12 …), thẻ em "Thiếu … / Nháp …", "Xem thêm n em", dòng Đủ | nhánh `useDienThoai` | KHỚP (tên phần trong "Thiếu" bấm được → panel) |
| 17 | g1 375: "‹ MB FT 131" về tab, hàng "‹ Em 5 · tên · Nháp ›", nút thang 44 px, Tiếp + Lưu dính đáy | `quayLai` "‹ {lớp}" (375), ‹ / › + ô chọn em, `.thang-bc` 44 px, `dongTren` Tiếp | KHỚP |
| 18 | Hồ sơ lớp ở tab Báo cáo PH không có khối Điểm cuối trang | ẩn `KhoiDiemLop` ở tab này | KHỚP |

18 dòng: 17 KHỚP, 1 KHÁC có lý do (dòng 14) → **94 %** (cổng ≥ 90 %).

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Hồ sơ lớp: tab Học viên · Ý thức & Phối hợp · Phân tích lớp (+ Tổng kết) | có | giữ nguyên; thêm "Báo cáo PH" (FT · FOU · BE · ELE, người xem có quyền) |
| Khối "Điểm Mock Test của lớp" cuối trang | hiện ở mọi tab trừ Ý thức | giữ; ẩn ở tab Báo cáo PH (tab không có trong mockup t1) |
| Nhập điểm · + Case · ⋯ đầu trang, thanh Việc của tôi | có | giữ nguyên |
| Viết báo cáo PH | làm tay trên Excel | bấm ô phần của mình → panel viết; QL: ô bất kỳ → đọc → Viết hộ |
| Xuất lớp / Xuất em | — | nút đặt chỗ (tắt, "Xuất Excel có ở bản kế tiếp") — PR b |

Không mất thao tác nào.

## Không làm ở PR a / [XM]
- Việc Admin ở Công việc + Excel 3 mức: PR b (kế hoạch).
- "Lớp tiếp ›" ở thẻ hết em (dòng 14) → Việc để sau.
- Chính tả EN của mẫu CP FT 131 (lexcial, acccuracy, "t increase", cohension) sửa khi chép vào dữ liệu — tệp gửi phụ huynh.
- "Nhận xét chung" EN dùng bản sẵn có "Overall comment" (khoá trùng phải cùng bản Anh); dữ liệu Excel vẫn "General comment".
