# Bàn giao PTA Plan — sáng 31/10/2026 (sau đêm chạy tự động)

Đọc sau `2026-10-29-ban-giao-pta-dem.md`. Kế hoạch đợt: đặc tả `docs/superpowers/specs/2026-10-30-dot-toc-do-panel-design.md`; kế hoạch `plans/2026-10-30-{toc-do,panel,sua-nho,don,phan-cong-gv}.md`; plan.md mục 4 (khối 30/10 + backlog đêm 30/10).

## 1. Đã merge đêm 30–31/10 (CHƯA deploy)
- #722 CHUONG-NHE (⚠ migrate `prChuongNhe` — cột `users.chuong_dong_bo_luc` nằm trong câu đăng nhập: migrate TRƯỚC khi mã mới chạy) · #724 QUET-THEO-KY (Q2 revert) · #729 SUA-NHO-QUYEN · #735 LOP-1-LOP · #742 DON-LUONG (migrate `donLuong` — chỉ mục `idx_scores_no_show`) · #746 QUYEN-LIEN-HE (GV không sửa ô Liên hệ ở máy chủ).
- #734 CN-1 + #743 CN-2 + #745 CN-3a: **check đầy đủ ~25 phút → ~3 phút**, RAM ~2,4 GB; luật ô check nới tối đa 3 (#744).
- Tài liệu: #717–#721, #723 (mockup v10), #725, #727, #728, #730, #737–#741, #744, #747.
- Migrate cần cho deploy sau (thêm vào 5 migrate 30/10 đã deploy): `prChuongNhe`, `donLuong` (+ `prBanGiaoGv`, `prPhanCongGv`… khi PR-B merge).

## 2. PR mở — chờ chủ SP duyệt ảnh (đã rà sâu + check)
| PR | Nội dung | Tình trạng |
|---|---|---|
| #733 + #736 | PANEL-MC (máy chủ) + PANEL-CHUNG (dòng điểm ✓/✗ panel chung) | check đầy đủ main+#733+#736 ĐẠT 4863/4863 (bản 42a61fecc). Merge CÙNG LÚC sau duyệt ảnh #736 (`docs/anh/panel-chung`) |
| #731 | Phân công GV PR-B bàn giao đổi GV | rà sâu: 1 lỗi quyền + 4 điểm đã sửa; cần check đầy đủ lại trên main mới trước merge |
| #732 | SUA-NHO-UI (⋯ không đè ô lưới, dải lỗi .bao-loi, "Fast Track n" mọi màn, Xóa lịch vào ⋯, lớp sai loại mờ, tab "Kết quả Test / Thi") | ảnh `docs/anh/sua-nho-ui-3010/`; cần check đầy đủ |
| #726 | Phân công GV PR-C góc web (session CLOUD — PTA không nhắn được) | còn lỗi 375: bảng tổng hợp mất cột "Tổng"; chủ SP dán tin nhắn PTA cho session cloud |

## 3. Câu hỏi chủ SP (sáng 31/10)
1. Duyệt ảnh #736, #732, #731, #726 (sau khi cloud sửa cột "Tổng" 375).
2. Panel: kỹ năng đạt = ✓ + cùng màu Overall đạt (PTA tự quyết theo lời "như chỗ Overall") — giữ? · "+2 việc" mở panel một em tại chỗ (PTA tự quyết).
3. #731: [PTA đoán] GVCN lớp mới = GVCN lớp cũ → nhận xét chung bàn giao chuyển lớp KHÔNG bắt buộc — đúng ý? · (PTA tự quyết) hạn việc bàn giao khi hiệu lực "Từ tuần" = 5 ngày tính từ ngày hiệu lực.
4. TRANG-LON (đo T1 `docs/superpowers/specs/2026-10-31-trang-lon-t1.md`): 5 đường lớn vẫn ~40–50 câu. PTA khuyên S3 trước (rủi ro thấp → ~28–50 câu), S1 "đếm trước, chi tiết khi mở nhóm" sau nếu còn chậm, không S2. Cần duyệt: nghĩa mới của quét (quetYeuCau / quetLenhDenHan mỗi 60 s toàn hệ thống + ngay sau ghi, thay vì mỗi tiến trình).
5. Check nay ~3 phút → đề xuất session code CHẠY check đầy đủ trước khi mở PR (thay luật 28/10 "chỉ kiểm nhanh").
6. (nhỏ) Người kiêm GV + TVV không sửa được ô Liên hệ (vai GV thắng) — giữ? (khuyến nghị giữ) · QUYEN-THEO-CN (quyền liên hệ xét theo vai toàn tài khoản, không theo chi nhánh — luật cũ).
- Đã xử lý, chỉ báo: #729 "Em chưa có lộ trình" dù có LT1 = lỗi → đã sửa · VO-HIEU-HEP ĐÓNG (đo: thu hẹp vô hiệu bớt 0 GET) · Q2 napBai revert (đọc tăng ở chi nhánh nhỏ).

## 4. Việc tiếp (thứ tự)
- Sau duyệt ảnh: merge #733 + #736 → PANEL-RIENG ‖ DUYET-QL, BANG-EM-GON ‖ HV-LOP-VIEC (không song song PR-B / PR-D / PR-C cùng màn) · #732 → DON-MA → CN-3 (gỡ phép trùng) · #731 + #726 → PR-D.
- TRANG-LON theo lựa chọn câu 4 (TL-NEN, TL-VIEC, TL-HVL, TL-TQ, TL-NAPBAI).
- DON-HINH, V8-PT-2, V8-HSL-2 sau khối panel. Backlog plan.md mục 4: LECH-CACH-CHAM, TAB-A11Y, QUYEN-THEO-CN, PANEL [XM].
- Theo dõi: nhóm 1 check chết 0xC0000005 (libsql) chập chờn 2 lần đêm 31/10 — chạy lại đạt.

## 5. Session đang mở (local)
- BAN-GIAO-GV (#731; đã làm DON-LUONG #742, QUYEN-LIEN-HE #746) · SUA-NHO-UI (#732) · PANEL-MC (#733, #736) · CN-1 (CN-1/2/3a xong; chờ CN-3 gỡ phép trùng sau DON-MA). Đã archive: CHUONG-NHE, QUET-THEO-KY, PANEL-V10, SUA-NHO-QUYEN, LOP-1-LOP.
