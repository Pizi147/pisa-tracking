# GD-11c TRANG-LUOT-TEST — khớp / khác mockup ⑦ C1–C3

Mockup `thiet-ke/v21/test.html` (⑦) + `test-ghi-chu.md` (C1–C3, [XM-2], [XM-3], [XM-4]). Plan `12-plan-giao-dien-dot-3.md` dòng GD-11c + V22.
Ảnh chụp seed demo, tài khoản demo tên giả: QL "Nguyễn Khánh Vy", GV "Trần Ngọc Hà". Phông Be Vietnam Pro đã nạp (kiểm `document.fonts`).

## Ảnh cặp (mockup │ web)
| Ảnh | Khung | Nội dung |
|---|---|---|
| `cap-c1-ql-1440-toi.png` | C1 | QL, lượt Mock FT: menu **Chỉnh lịch** mở — Dời lịch cả đợt · Dời hạn chấm cả đợt · Khôi phục kết quả (tắt, lý do dưới mục) · Xoá MT1 (đỏ) |
| `cap-c1-gv-1440-toi.png` | C1 | GV, lượt Mock FT: Lớp lúc Test là link · ⓘ Writing · ⋯ cao bằng nút chính · khối **Lịch sử · 15** mở |
| `cap-c2-ql-1440-toi.png` | C2 | QL, lượt lớp thường (Progress): cùng khung, Lớp lúc Test là link, **Lịch sử · 6** |
| `cap-c3-gv-375-sang.png` | C3 | GV 375 sáng: mỗi kỹ năng một thẻ — tên · ô điểm bên phải; tuần · chip · hạn; nút chính rộng + ⋯ 44 |
| `web-lt-gv-1440-toi.png`, `web-lt-gv-375-sang.png` | C2 / C3 | GV, lớp thường 1440 tối + 375 sáng (mockup không vẽ C3 lớp thường) |
| `web-mock-ql-375-sang.png` | C3 | QL 375 sáng, lượt Mock |
| `web-mock-gv-ba-cham-1440-toi.png` | C1 | GV mở ⋯ một kỹ năng: **Vắng · Huỷ điểm** (luật nhập điểm mới #1664 / #1676) |

## Bảng truy vết (khung → thành phần → ảnh)
| Khung | Thành phần | Sau PR | Ảnh | Đánh giá |
|---|---|---|---|---|
| C1 | Chỉnh lịch ▾ | `MenuDong` chuẩn, bỏ dòng mô tả (`goi`) dưới mục; Khôi phục kết quả luôn hiện cho QL, tắt khi chưa có gì + lý do; Xoá MTn bị chặn → tắt + lý do | cap-c1-ql | KHỚP |
| C1 / C2 | Lớp lúc Test | `LopLucTest`: mã lớp là link hồ sơ lớp; "· nay {lớp}" cũng là link | cap-c1-*, cap-c2 | KHỚP |
| C1 | Tóm tắt Còn lại | nút-chip chuẩn "Nhập điểm L" (việc trước, kỹ năng sau) | cap-c1-* | KHỚP |
| C1 | Writing ⓘ | ⓘ "Cách tính Writing" cạnh tên, cùng câu với hộp nhập ([XM-2]) | cap-c1-gv | KHỚP |
| C1 | Mũi mở dòng | "›" xoay khi mở (`MuiMoDong`), FT + lớp thường | cap-c1-*, cap-c2 | KHỚP |
| C1 | ⋯ dòng kỹ năng | `NUT_BA_CHAM_DONG`: 36×30 cạnh nút 30 (đo lệch tâm 0 px), 375 vuông 44 | cap-c1-gv, cap-c3 | KHỚP |
| C1 / C2 | Lịch sử | MỘT khối "Lịch sử · n" cuối trang, mỗi dòng ghi kỹ năng; bỏ dải Lịch sử riêng trong vùng mở từng kỹ năng ([XM-3] PTA chốt); "Lịch sử chi tiết" (có Khôi phục) giữ | cap-c1-gv, cap-c2 | KHỚP |
| C1 | Bảng kỹ năng + Nhập điểm / Trả lời đề nghị dời / ⋯ | giữ | cap-c1-* | KHỚP |
| C1 | Chỉ xem | lý do qua `lyDoChiDoc` (cùng hàm ô chỉ đọc: "Lượt đã huỷ" / "Không có trong đợt này" / chưa phân công) | cap-c1-gv | KHỚP |
| C3 | 375 mỗi kỹ năng một thẻ | ô điểm sát phải; tuần · chip · hạn một hàng; nút chính rộng + ⋯ 44 | cap-c3 | KHỚP |
| C1 | Chip "Chờ nhập điểm" | web xanh "đang làm", mockup vàng | cap-c1-* | KHÁC — `Status` dùng chung mọi trang; màu hạn theo V22 do hàm chung quyết, không đổi riêng ở đây |
| C1 | Ô Writing | web "—" + "W1 Nhập · W2 Nhập" (nhập từng task), mockup ô "—" + tên GV ở Trạng thái | cap-c1-gv | KHÁC — GIỮ thao tác nhập từng task đã có |
| C1 | Đường về đầu trang | "‹ Hồ sơ {em}" theo nguồn mở (mockup vẽ "‹ Lịch Test tuần") | cap-c1-* | KHÁC theo nguồn (luật Quay lại về đúng nguồn) |
| C1 | Chọn đợt | ô chọn hệ thống (`ChonDot`) — mockup vẽ nút có ▾ | cap-c1-* | KHÁC nhỏ — thành phần dùng chung, không đổi trong PR này |

**KHỚP 10 / 14 = 71 % tính cả dòng KHÁC có lý do; bỏ 3 dòng KHÁC theo luật / giữ thao tác (V22, giữ nhập từng task, Quay lại về nguồn) → 10 / 11 = 91 %.**

## Thao tác TRƯỚC → SAU
| Thao tác | Trước | Sau | Ghi chú |
|---|---|---|---|
| Chỉnh lịch: Dời lịch cả đợt · Dời hạn chấm cả đợt · Khôi phục kết quả · Khôi phục MTn cũ · Đưa lại cả 4 kỹ năng · Xoá MTn | có, mỗi mục một dòng mô tả | cùng mục, menu chuẩn | GIỮ — hậu quả Xoá nói ở toast Hoàn tác ([XM-4]) |
| Khôi phục kết quả khi chưa có gì bị huỷ | mục ẩn | mục mờ + "Chưa có kết quả nào bị huỷ" | GIỮ, rõ hơn |
| Xoá MTn khi bị chặn (khoá cuối tuần) | bấm được, máy chủ báo lỗi | mục mờ + lý do | GIỮ, không bấm thừa |
| Mở hồ sơ lớp lúc Test / lớp hiện tại | không (chữ thường) | link | THÊM |
| ⋯ kỹ năng: Vắng · Huỷ điểm · Khôi phục · Dời lịch · Dời hạn chấm (FT); + Lịch sử (lớp thường) | có | giữ | GIỮ |
| Nhập điểm / Sửa điểm / Trả lời đề nghị dời / Nhập điểm lớp › | có | giữ | GIỮ |
| Lịch sử trong vùng mở từng kỹ năng | dải "Lịch sử · n" mỗi kỹ năng | dòng có tên kỹ năng trong khối "Lịch sử · n" cuối trang | GỘP ([XM-3] PTA chốt) |
| Lịch sử lượt + Lịch sử chi tiết (Khôi phục) | "Lịch sử lượt · n" | "Lịch sử · n" | GIỮ |
| Còn lại: bấm việc mở đúng dòng | có | giữ, chữ "Nhập điểm L" | GIỮ |

Không thao tác nào bị bỏ.

## Rà chữ / nút cũ (luật nhập điểm #1664, #1676)
Trang lượt FT + lớp thường không còn "Huỷ môn", "Khôi phục điểm", "Lịch sử lượt"; ⋯ kỹ năng lấy từ `thaoTacKyNang` (Vắng · Huỷ điểm · Khôi phục). Còn ngoài phạm vi: nhãn Nhật ký Quản trị `shared/domain/nhatKy.ts` (`attempt.huy_tay` "Huỷ môn…", `score.khoi_phuc` "Khôi phục điểm") — ghi cho PR sau.

## Hướng dẫn "?"
GV `nd-luot` (⋯ Vắng · Huỷ điểm · Khôi phục, một khối Lịch sử) · QL `nd-chinh-lich` (Chỉnh lịch, Lớp lúc Test link, Lịch sử chi tiết có Khôi phục) · TVV sửa câu "⋯ › Lịch sử" thành khối Lịch sử. Khoá dịch `shared/i18n/en/gd11cLuotTest.ts`.

## Turso
0 câu, 0 dòng thêm: chỉ đổi giao diện; Lịch sử dựng từ dữ liệu trang đã nạp (bỏ 4 lần dựng lọc theo kỹ năng ở web).

## Đo
⋯ dòng kỹ năng so nút chính: 1440 lệch tâm 0 px (36×30 / 30), 375 lệch 0 px (44×44 / 44) — FT + lớp thường.

## Sửa sau rà PTA (375)
- Thẻ Writing 375 cùng dáng L / R: tên + ô điểm (ô "—" có viền như ô khác) cùng hàng, "W1 Nhập · W2 Nhập" đứng trước ô trên cùng hàng; lịch, trạng thái, người chấm dòng dưới; hàng nút cuối thẻ, ⋯ sát phải. `zoom-ba-cham-375.png`: mép phải ⋯ 4 thẻ (Mock) và 4 thẻ (lớp thường) cùng x = 346 px (lệch 0 px), 1440 cùng x = 1407 px.
- Khối "Còn lại" ẩn ở 375 (lời 40 — mỗi việc đã là nút trong thẻ kỹ năng, mockup C3); 1440 giữ.

## Writing = hai ô W1 / W2 (chủ SP 15/11: "Để W1 W2 thành 2 ô cạnh nhau, hoặc 1 cái trên 1 cái dưới đi, đừng để mỗi W phải bấm chữ")
- Thay chữ "W1 Nhập · W2 Nhập" + ô "—" chung bằng HAI ô điểm thật nhãn W1 / W2, cùng dáng ô L / R (`oTask` trong `ODiemLon.tsx` — dùng chung trang lượt Mock + dải ô lớn `DaiODiemLon` ở hồ sơ HV). Bấm ô nào mở đúng task đó (hộp neo dưới ô, `web-w1-hop-1440-toi.png`). Có điểm: số task + ✓ / ✗ so kỳ vọng; band Writing chung là dòng phụ "Writing ✓ 6.5" dưới hai ô. Không nhập được: ô chỉ đọc.
- 1440: hai ô cạnh nhau (cột Điểm 13rem) — `web-w1-w2-diem-1440-toi.png`, `zoom-w1-w2-1440.png`. 375: cạnh nhau, sát phải cùng hàng tên; chỗ hẹp thì tự xuống dòng — `web-w1-w2-diem-375-sang.png`, `zoom-w1-w2-375.png`.
- ⋯ vẫn thẳng hàng: mép phải 8 thẻ cùng x (1407 px / 346 px), lệch tâm so nút chính 0 px.
- Hồ sơ HV (bảng Mock Test, dải ô gần nhất) đã tách W1 / W2 từ trước — không đổi.
