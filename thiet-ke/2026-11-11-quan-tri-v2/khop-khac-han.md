# Quản trị › Hạn mặc định (QTV2-HAN, #1399) — thao tác TRƯỚC → SAU

| Thao tác | Ai | Trước | Sau | |
|---|---|---|---|---|
| Xem các hạn mặc định | QT, QL | không có (viết cứng trong mã) | tab Hạn mặc định, 13 hạn, 4 nhóm | MỚI |
| Sửa một hạn | QT | sửa mã | bấm ô hạn → sửa tại dòng → Enter (Esc khi đã đổi: hỏi Ở lại / Bỏ thay đổi) | MỚI |
| Về bản gốc | QT | — | "gốc: … · Về gốc" ở dòng đã đổi | MỚI |
| Hoàn tác lần sửa | QT | — | Hoàn tác trên thông báo — chỉ đảo đúng hạn đó, thành một bản mới | MỚI |
| Xem ai đổi gì | QT, QL | — | cột Nhật ký (8 dòng) + Quyền & nhật ký › mục Hạn | MỚI |
| Hạn của việc đã sinh | — | — | giữ hạn lúc sinh; Gia hạn tay từng việc vẫn thắng | GIỮ |
| Sửa hạn Meeting CX / GĐCN (N34) | QT | — | **không ở tab này** — Quản trị › Case & SOS, hạn theo từng việc ở ô Mốc SOS (#1390) | CHỖ |
| Mọi thao tác cũ (Gia hạn từng việc, Sửa hạn Báo PH / Meeting CX tại việc) | GV, QL | có | giữ nguyên | GIỮ |

## Một hạn một chỗ sửa (PTA 11/11)
- Meeting CX / GĐCN (và bước TVV hạn 5 của Phối hợp SOS V2) thuộc **Case & SOS** (#1390: `hanNgay` của từng việc mốc SOS). Tab Hạn mặc định bỏ dòng này (13 hạn, không còn 14); nhóm "Ý thức & phối hợp" đổi thành "Ý thức". Không đặt lối "Case & SOS ›" vì #1399 merge trước, tab đích chưa có — #1390 thêm sau nếu chủ SP muốn.
- Đã rà các hạn còn lại với cấu hình của #1390: Xác nhận Case / thêm PA, Ghi kết quả PA, PA quy chế "1 tháng" (số ngày) — #1390 chỉ chọn LOẠI kết thúc PA (`one_month`…), nhóm nguyên nhân, nhóm PA, việc mốc SOS; không sửa số ngày nào trong 13 hạn này ⇒ không trùng.
- Bảng `cau_hinh_phien_ban`: #1399 tạo (migrate `prCauHinhPhienBan`, tên bảng / chỉ mục `idx_chpb_loai` / trigger `tg_tc_cau_hinh_phien_ban_{ins,upd,del}`). #1390 dùng lại, không tạo lần hai (PTA báo session CAU-HINH-CASE-SOS).

## Nhật ký
- Tên trường hiện chữ ("Xử lý vi phạm: 5 → 7"); dòng cũ ghi khoá thô (`meeting_cx.ngay`) cũng dịch. Bỏ "· Hạn mặc định" lặp sau "Sửa hạn mặc định".
