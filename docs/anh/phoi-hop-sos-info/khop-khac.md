# PHOI-HOP-SOS-INFO — thẻ kết quả SOS cạnh việc Phối hợp SOS (chủ SP 06/11)

Yêu cầu nguyên văn: "Công việc Phối hợp SOS cần phải có thông tin nho nhỏ rõ ràng là bạn thi thế nào, tạch những kĩ năng nào ở cạnh, xuất hiện cả trong trang CV lẫn trang hồ sơ lớp, hồ sơ HV."
Không có mockup riêng: thêm thẻ theo mẫu sẵn có (`ODiem` ✓ / ✗ + ba màu, thẻ chữ `the-phu`) — `plan.md` 1.3b. Phông đã kiểm `document.fonts.check('600 14px "Be Vietnam Pro"') === true`.
Dữ liệu demo 14/09: tài khoản GV Lâm Quang Vinh (GVCN MB FT 105, em Đoàn Minh Khang, MT2 Overall 5.5 / kỳ vọng 6.0, trượt W, S).

## Ảnh cặp (trước | sau)

| Nơi | 1440 tối | 375 sáng |
|---|---|---|
| Công việc (dòng Phối hợp SOS) | `truoc-cong-viec-1440-toi.jpg` · `sau-cong-viec-1440-toi.jpg` | `truoc-cong-viec-375-sang.jpg` · `sau-cong-viec-375-sang.jpg` |
| Hồ sơ lớp (thanh Việc của tôi + thẻ Phối hợp trong tab Ý thức) | `truoc-ho-so-lop-1440-toi.jpg` · `sau-ho-so-lop-1440-toi.jpg` | `truoc-ho-so-lop-375-sang.jpg` · `sau-ho-so-lop-375-sang.jpg` |
| Hồ sơ HV (tab Ý thức › Phối hợp SOS) | `truoc-ho-so-hv-1440-toi.jpg` · `sau-ho-so-hv-1440-toi.jpg` | `truoc-ho-so-hv-375-sang.jpg` · `sau-ho-so-hv-375-sang.jpg` |

## Nguồn một chỗ

| Việc | Cách làm |
|---|---|
| Dữ liệu thẻ | `TheSosLuot` (`shared/domain/diemDong.ts`): lượt · Overall · kỳ vọng (hoặc % tổng · ngưỡng lớp thường) · kỹ năng trượt · tạm. Dựng ở `theSosTuKetQua` (`phoiHop.ts`) từ `resultOf` / `evaluateRegular` ĐÃ tính |
| Chữ | `chuTruotSos`, `nhanDocTheSos` (cùng ý `nhanDocDiem`): "MT2, Overall ✗ 5.5, dưới kỳ vọng 6.0, trượt W, S" — chung cho ba nơi và trình đọc màn hình |
| Vẽ | `TheKetQuaSos` / `TheSosViec` (`web/src/ui/TheKetQuaSos.tsx`) dùng `ODiem`, không kiểu mới; ✓ / ✗ + chữ "trượt" (không chỉ bằng màu) |
| Công việc · thanh hồ sơ lớp | `WorkItem.theSos` (tối đa 3 lượt mới nhất của lớp; "+n lượt nữa" khi còn); thanh lớp lấy việc từ `/my-work` nên tự có |
| Thẻ Phối hợp (hồ sơ lớp, hồ sơ HV, panel Công việc) | `CoordinationTurn.the` — cùng hàm dựng; thẻ thay dòng phụ cũ / chip "MTn" |

## Khác biệt có chủ ý

| # | Trước | Sau | Lý do |
|---|---|---|---|
| 1 | Chip "SOS 2 · W1, S" + "MT2" riêng | Chip "SOS 2" (hộp giải thích vẫn đếm kỹ năng) + thẻ "MT2 ✗ 5.5 / 6.0 trượt W, S" | kỹ năng trượt chỉ ghi MỘT chỗ; thẻ đếm theo kết quả lượt (W = Writing chung), chip theo tín hiệu (W1 / W2) — nhãn có thể khác ở W |
| 2 | Lớp thường dòng phụ "Giữa khoá · 2/4 môn đạt · …" | thẻ "Giữa khoá ✗ 43 % / 70 % trượt G, V" + "2/4 môn đạt" giữ cạnh thẻ | luật "một hàm một số": % tổng so ngưỡng lớp như DongDiem; chữ "n/m môn đạt" (`nhanKetQuaThuong`) giữ nguyên cạnh thẻ |
| 3 | Dòng việc cả lớp chỉ ghi "n lượt" | + thẻ từng em (≤ 3) | yêu cầu chủ SP; lớp có nhiều lượt: "+n lượt nữa" |

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Mở panel Phối hợp từ dòng việc, Xác nhận / Bỏ / Khôi phục / Sửa / + Thêm việc / Học thuật › | có | có (không đổi mã) |
| Bấm chip SOS xem "Vì sao SOS n" | có | có |
| Link tên em (hồ sơ lớp → hồ sơ HV) | có | có |
| Biết em thi thế nào / trượt kỹ năng nào | mở hồ sơ | thấy ngay ở dòng |

Không mất thao tác nào.

## Luật Turso

`/my-work` +3 câu (lượt + điểm + lịch kỹ năng của thẻ, MỘT lô cho cả tập lớp — phép kiểm `prSosThe` S3: số câu một lớp ≈ mọi lớp): đo QL "Tất cả" 54 → 57, theo chi nhánh 46 → 47; trần `tocDoDuong.ts` 54 → 59 · 46 → 49 (đo + 2). Dòng đọc không vượt `TRAN_DONG`. Ước thêm ≈ 3 câu mỗi lần mở app của vai có việc Phối hợp SOS (badge `/my-work` gọi mỗi lần).
Hướng nhẹ hơn nếu cần: thẻ chỉ tải khi mở danh sách (thêm một đường GET) — chưa làm vì thêm request.

## Ghi chú `ponytail:` (liệt kê vào mô tả PR)

- `dongPhoiHopLop`: thẻ của lượt MỚI NHẤT mỗi lớp (tối đa 3), không xếp theo mức SOS.
- Băm TD4-a: `tocDo.run.ts` bỏ trường `theSos` (như `kns`, `lamThay`) — 11 băm cũ giữ nguyên, không chụp lại.
