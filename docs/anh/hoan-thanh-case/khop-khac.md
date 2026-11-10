# Kết thúc PA cuối = "Hoàn thành Case" ngay trong form — bản rà 11/11 mục 3 #3

Chủ SP 11/11: "Theo hết 10 đề xuất, nhưng mục 3 chỉ để 'Hoàn thành case', không có dấu '?'". Gốc: G2-04, G2-05, G2-07. Thêm ô tick theo mẫu sẵn có (ô tick + khối con thụt như Điều chỉnh / Kết thúc PA) — không cần mockup.
Ảnh "trước": `docs/superpowers/specs/2026-11-11-ra-toan-bo/anh/G2-05-hv-nhi-case-chua-co-pa.png`, `G2-14-sau-ghi-kq.png`, `G2-15-form-hoan-thanh-case.png`. Ảnh "sau": `sau-*.png` (seed 14/09, QL vy.nguyen · La Khánh Chi, Case 1 PA Xếp tự học).

## Thao tác TRƯỚC → SAU

| Chỗ | Trước | Sau | Gốc |
|---|---|---|---|
| Kết quả PA › Kết thúc PA (PA cuối của Case) / Kết quả cuối PA quy chế | lưu xong Case vẫn "Đang làm", không việc nào nhắc; phải nhớ quay lại › Hoàn thành Case › chọn mức › gõ lại lý do › Hoàn thành (6 bước) | ô tick **"Hoàn thành Case"** trong form đang mở (mặc định tắt): mức điền sẵn theo Tiến triển, Kết luận điền sẵn Nhận xét (sửa được) → một lần Lưu = kết quả + Case xong; toast "Đã lưu kết quả · đã hoàn thành Case · Hoàn tác" (Hoàn tác = Mở lại Case + bỏ lần ghi) | G2-05 |
| Ô hiện khi | — | PA này là PA cuối còn chạy, Case chưa xong, người xem hoàn thành được Case (`canClose`, không Case tạm SOS); không ở Sửa kết quả | G2-05 |
| Hoàn thành Case (nút ở Kết luận) | ô "Vì sao kết luận vậy" trống | điền sẵn Nhận xét của Kết quả PA gần nhất (sửa được) | G2-07 |
| Dòng Case ở hồ sơ HV · hồ sơ lượt Mock | mọi PA đã khép: "Chưa có PA" | "**n PA xong · chờ Hoàn thành**" | G2-04 |

Không mất thao tác nào (nút Hoàn thành Case ở Kết luận giữ). Bước hoàn thành lỗi (vd mất mạng) → kết quả PA vẫn lưu, toast nói "chưa hoàn thành Case: …", nút Hoàn thành Case còn ở Case.

## Hình ảnh
Ô tick + khối con thụt viền trái như khối Điều chỉnh / Kết thúc PA sẵn có; mức 4 nút như form Hoàn thành Case. Không đổi màu, cỡ chữ.

## Đọc Turso
Mở trang: 0 câu thêm. Lưu có tick: +1 request (`POST /cases/:id/outcome`, như bấm Hoàn thành Case).

## Còn lại
"Kết thúc sớm…" (PA quy chế, GVCN / QL) chưa có ô tick — ô đó ghi lý do, không có Tiến triển để gợi ý mức; dùng nút Hoàn thành Case như cũ.
