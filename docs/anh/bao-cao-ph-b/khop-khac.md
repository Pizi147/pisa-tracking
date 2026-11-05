# BAO-CAO-PH b — việc Admin "Xuất báo cáo PH" + Excel em · lớp · chi nhánh

Mockup: `thiet-ke/v15/bao-cao-ph.html` (k1, g3, f1, d1), ghi chú `thiet-ke/v15/bao-cao-ph-ghi-chu.md` mục 7. Đặc tả `docs/superpowers/specs/2026-11-05-bao-cao-ph/de-xuat.md` mục 5.3, 5.4, 12.
Dữ liệu web: bộ demo, ngày demo 24/09/2026 (MB FOU 12 / 22 Final W3 SEP quá hạn 4 ngày; MB FOU 15 Progress đã viết đủ). Mẫu Excel: `CP FT 131.xlsx`.

## Ảnh cặp (mockup | web)

| Khung | Tệp |
|---|---|
| k1 · Công việc Admin · 1440 tối | `cap-k1-cong-viec-admin-1440-toi.png` |
| g3 · Công việc Admin · 375 sáng | `cap-g3-cong-viec-admin-375-sang.png` |
| f1 · Học viên & Lớp › Xuất Excel › Báo cáo PH · 1440 tối | `cap-f1-ngan-xuat-1440-toi.png` |
| d1 · tab Báo cáo PH, QL (Xuất lớp / Xuất em bật) · 1440 tối | `cap-d1-tab-xuat-1440-toi.png` |

## Truy vết khung → thành phần

| # | Mockup | Web | Kết quả |
|---|---|---|---|
| 1 | k1: nhóm có sẵn "Việc quản lý" (không thêm nhóm, không đổi `NHOM_VIEC`) | loại việc `xuat_bc_ph` → nhóm Vận hành, Admin thấy tên "Việc quản lý", mở sẵn | KHỚP |
| 2 | Dòng "Cả lớp {mã} · Xuất báo cáo PH" + thẻ đợt + "thiếu n em" / "n/n em đủ" | `DongLop` (dòng cả lớp sẵn có) | KHỚP — mã tuần thành thẻ riêng "tuần W3 SEP" theo luật Công việc U01 #3 (mockup ghép "Progress · W3 NOV" một thẻ) |
| 3 | Quá hạn: viên đỏ "⚠ quá hạn n ngày", link "Báo cáo PH ›" → tab | `ChipHan` + nút việc "Báo cáo PH ›" (đi trang) | KHỚP — nút theo mẫu nút dòng việc (viền), mockup vẽ link chữ |
| 4 | Đủ: viên xám "đủ 23/11", nút **Xuất lớp** tải file ngay; bấm tên → tab | `Nhan muted` "đủ dd/mm" + `NutXuatLopBc` (nút phụ của dòng) | KHỚP (viên có chấm theo `Nhan` chung) |
| 5 | g3 375: chạm cả dòng → tab, ẩn nút | nút Xuất lớp `max-sm:hidden`, chạm dòng → tab | KHỚP |
| 6 | Vạch "Quá hạn" / "Đủ · xuất gửi PH" | vạch hạn sẵn có của danh sách (quá hạn / không hạn) | KHỚP theo luật danh sách |
| 7 | f1: khối **Mẫu** Danh sách · Báo cáo PH | `NganXuatDs` khối Mẫu (radio) — "Danh sách" giữ nguyên ngăn cũ (mẫu theo góc trang, cột nhớ máy) | KHỚP |
| 8 | f1: Phạm vi giữ (Bộ lọc hiện tại · Cả chi nhánh) | giữ | KHỚP |
| 9 | f1: ô **Tháng** "Tháng 11 · 2026" thay khối Cột | `select` 12 tháng gần nhất | KHỚP |
| 10 | f1: bảng đếm Lớp FT · đợt Tháng n / Lớp thường · đợt có hạn trong tháng / Không có đợt ⓘ / Em đủ mọi phần | đếm trước (`xemTruoc`, không đọc điểm); ⓘ `NutLuat` nêu tên lớp khi có | KHỚP |
| 11 | f1: nút "Xuất n HV" | "Xuất n HV" (n = HV của lớp có đợt) | KHỚP |
| 12 | f1: dòng loại "— XUẤT" trên tiêu đề panel | panel Xuất sẵn có không có dòng loại | KHÁC — giữ panel cũ (đổi riêng mẫu này làm lệch mẫu Danh sách) |
| 13 | d1: Xuất lớp (đầu bảng) · Xuất (cuối hàng) | bật: tải Excel lớp / một em | KHỚP |

13 dòng: 12 KHỚP, 1 KHÁC có lý do → **92 %**.

## Tệp Excel (đúng mẫu CP FT 131)
- Mỗi lớp một sheet, tên = mã lớp (≤ 31 ký tự, trùng thêm số; lớp thường hai đợt cùng tháng: "{mã} · Final"); hàng 1 = mã lớp + họ tên từng em; cột A nhãn song ngữ.
- Thứ tự mẫu: "Giáo viên chủ nhiệm (Core teacher):" · "Nhận xét chung (General comment):" · 7 tiêu chí đánh số "1. …\nEN" (I 1–3, II 1–4); mỗi kỹ năng
  "Giáo viên nghe (Listening Teacher) :" · "Điểm:\nScore:" · "Đề xuất cải thiện (Suggestion):" · tiêu chí "VI\nEN". Ô mức "Khá (Sound)".
- Điểm: điểm sửa tay, không thì điểm gốc lúc bấm xuất (FT band; lớp thường "17/25"). Một em = một sheet một cột.
- Không đánh dấu "đã xuất"; ghi nhật ký `bao_cao_ph.xuat`.
- ponytail: chưa gộp ô (merge) hàng tên GV như mẫu, chưa xuống dòng trong ô (thư viện `xlsx` bản cộng đồng không ghi định dạng) — thêm khi chủ SP cần.

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Công việc của Admin | chỉ nhóm Chấm điểm (Nhập hộ / theo dõi) | giữ; thêm nhóm "Việc quản lý" khi có việc Xuất báo cáo PH |
| Công việc của QL | Việc quản lý gập cuối | không đổi (QL không nhận việc này) |
| Học viên & Lớp › Xuất Excel | Phạm vi + Cột (mẫu theo góc trang) | giữ y nguyên ở mẫu "Danh sách"; thêm mẫu "Báo cáo PH" (Phạm vi + Tháng) |
| Tab Báo cáo PH › Xuất lớp / Xuất em | nút tắt (PR a) | tải Excel ngay |

Không mất thao tác nào.
