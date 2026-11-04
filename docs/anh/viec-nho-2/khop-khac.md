# VIEC-NHO-2 — khối Bằng chứng (U10.8) + nhãn chuỗi thang Ý thức

Mockup: `thiet-ke/audit-0311/u10-y-thuc.html` — `#k1 .vp.mo` (dòng `.bc` "Bằng chứng · + Tệp / liên kết"). Mockup không vẽ khung 375 có `.bc`
và không vẽ trạng thái CÓ tệp → ảnh 375 dùng chính khung K1 đổi lớp `.toi` → `.sang` (bảng màu sáng của mockup); trạng thái có tệp theo cùng cỡ chữ / màu của `.bc`.
Phông đã kiểm: `document.fonts.check('600 14px "Be Vietnam Pro"') === true` trước mỗi ảnh web.

## Ảnh cặp (mockup | web)

| Nơi dùng | Trống | Có tệp (1 liên kết + 1 ảnh) |
|---|---|---|
| Tab Ý thức lớp › vi phạm mở · 1440 tối | `cap-y-thuc-1440-toi.png` | `cap-y-thuc-1440-toi-co-tep.png` |
| Tab Ý thức lớp › vi phạm mở · 375 sáng | `cap-y-thuc-375-sang.png` | `cap-y-thuc-375-sang-co-tep.png` |
| Panel Case · 1440 tối | `cap-case-1440-toi.png` | `cap-case-1440-toi-co-tep.png` |
| Panel Case · 375 sáng | `cap-case-375-sang.png` | `cap-case-375-sang-co-tep.png` |

## Truy vết khung → thành phần

| # | Mockup U10.8 | Web | Kết quả |
|---|---|---|---|
| 1 | `.bc` một dòng, không khung viền | `BangChung` / `TepCho`: bỏ khung viền nét đứt + nền, lớp `.bc` (13px, `--text-dim`) | KHỚP |
| 2 | Nhãn `.nh` "Bằng chứng" 500 12px `--text-faint`, rộng 72px, cùng dòng | `.bc-nh` (prop `tieuDe`); vi phạm mở (`ChiTietViPham`) chuyển nhãn từ dòng trên vào cùng dòng | KHỚP |
| 3 | Link `.link-nho` 600 13px `--accent`, cách 12px | `.link-nho` (thêm vào `index.css`, cùng thông số) | KHỚP |
| 4 | Một link "+ Tệp / liên kết" | Hai link "+ Tệp" · "+ Liên kết" cùng kiểu | KHÁC — giữ thao tác: chọn tệp vẫn một lần bấm (gộp thành một link phải thêm bước chọn) |
| 5 | Không có dòng gợi ý | Trống + được sửa: gợi ý ngắn "Dán ảnh (Ctrl + V) · kéo thả tệp" 12px `--text-faint` cùng dòng (bỏ "chọn tệp · dán liên kết" vì trùng nút) | KHÁC — giữ chỉ dẫn hai cách không có nút (dán, kéo thả) |
| 6 | (không vẽ) có tệp | Dòng tệp: tên = link accent 13px · phụ 12px `--text-faint` số tabular · "Gỡ" 12px mờ, rê đỏ; thụt 84px (thẳng cột nút) khi có nhãn, 375 không thụt; bỏ emoji 📎 🔗 (phụ đã ghi "liên kết" / cỡ tệp) | Theo luật `.bc` |
| 7 | (không vẽ) kéo thả | Khi rê tệp vào: viền chấm `--accent` 2px quanh khối | Theo luật |
| 8 | Touch 375 | `.link-nho`, "Gỡ" cao 44px dưới 640px | GIỮ |
| — | Panel Case: nhãn "Bằng chứng (n)" của `DauMuc` | GIỮ (khối không vẽ nhãn thứ hai) | GIỮ |

Điểm khớp: 8 dòng, 6 KHỚP / theo luật, 2 KHÁC có lý do → ≥ 90 %.

## Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau |
|---|---|---|
| Chọn tệp (nhiều tệp) | nút "+ Đính kèm tệp" | link "+ Tệp" — 1 bấm, như cũ |
| Thêm liên kết | nút "+ Thêm liên kết" → ô URL + tên | link "+ Liên kết" → cùng ô |
| Dán ảnh Ctrl+V / dán liên kết vào khối | có | có (không đổi mã) |
| Kéo thả tệp | có, viền đổi màu | có, viền chấm accent |
| Gỡ tệp (xác nhận + Hoàn tác) | có | có |
| Thử lại / Bỏ tệp lỗi | có | có |
| Tệp chờ trong form ghi vi phạm / báo nhanh (`TepCho`) | khung riêng | cùng kiểu `.bc` |

Không mất thao tác nào.

## Việc 2 — nhãn chuỗi đếm thang (N36)

`nhanChuoi` (`server/src/yThuc/trangThai.ts`): chuỗi gồm lớp thường rồi FT → `lớp thường → LT1` (trước: `LT1`, web hiện "Lộ trình LT1" — sai vì bậc đếm cả phần lớp thường).
FT luôn đứng cuối chuỗi (`chuoiThang` cắt sau lộ trình FT), nên chuỗi > 1 lộ trình mà lộ trình hiện tại là FT = có lớp thường đứng trước.
Web: tab Lịch sử "Phạm vi" → "Lớp thường → LT1"; tiêu đề thang → "Thang xử lý vi phạm · lớp thường → LT1". Không thêm câu đọc (chỉ dùng mảng `chuoi` đã có).
