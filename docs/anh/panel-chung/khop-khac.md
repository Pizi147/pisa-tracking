# PANEL-CHUNG — khớp / khác mockup `thiet-ke/v10/panel-thong-tin.html`

Chỉnh của chủ SP / PTA thắng mockup: điểm kỹ năng **✓ / ✗ trước số** (không ▼), kỹ năng đạt **✓ cùng màu Overall đạt** (`text-kq-bang`, như `DiemKq`), hụt **✗ + `text-kq-duoi`**.
Ảnh cặp (trái mockup, phải web): `p1-1440.png` · `p1-375.png` · `p2-1440.png` · `p4-1440.png` · `mau-1440.png`.
Cách chụp: `KHUNG_BASE=http://localhost:5612 node scripts/anh-cap.mjs thiet-ke/v10/panel-thong-tin.html "#p1 figure >> nth=0" "<đường>?so-lieu=<khoá>" 2 1440 …`.
Khoá panel lấy bằng bấm ô số rồi đọc `?so-lieu=` (panel chỉ mở khi ô số của khoá có trên trang).

## Bảng truy vết khung → thành phần → ảnh

| Khung | Thành phần web | Ảnh | KHỚP / KHÁC |
|---|---|---|---|
| `#mau` 0–2 mẫu dòng | `DongDiem` + `.dd` (lưới 132 px · 4 × 64 px · Overall mép phải; 375 hai hàng) | `mau-1440`, `p1-375` | KHỚP (✓ / ✗ theo chỉnh chủ SP) |
| `#p1` SOS 2 · lớp | `veDongHv` + `DongDiem`; lớp ẩn khi tiêu đề có lớp | `p1-1440`, `p1-375` | KHỚP dòng. KHÁC: đầu panel (chip "SOS 2 · 4 HV", dòng ngữ cảnh) là `KhungPanel` chung — ngoài PR này [XM-1]; ô "SOS 2" đầu hồ sơ lớp chưa bấm được → ảnh lấy từ ô SOS 2 · MB FT 101 ở Tổng quan QL; câu phụ "S chưa chấm…" bỏ theo T6 |
| `#p2` Đạt MT · tab | tab Chưa đạt · Đạt (GIỮ, nay có `ketQua` từ máy chủ) + `DongDiem` | `p2-1440` | KHỚP dòng + tab. KHÁC: tiêu đề "Đạt MT" (chữ nơi gọi, quy ước 6b-1) thay "Đạt MT3 56 % · 10/18" [XM-1] |
| `#p3` Bài quá hạn | dòng `bai`: tên (link hồ sơ) · lớp · hàng 3 "MT2 · R" (link lượt) · tuần · ⚠ quá n ngày · người; **Nhập điểm** = nút riêng | — (panel số chỉ đọc ở Tổng quan; bấm thử ở hồ sơ GV) | KHỚP cấu trúc. KHÁC: "Hà chấm" hiện "Hà" (máy chủ gửi tên gọi; chưa thêm chữ "chấm") · "Phân công…" BỎ (không có `ChonPhuTrach` cho bài) [XM-2] |
| `#p4` Tiến bộ | chip `.xh` (▲ Tăng 1.0 · ▼ Giảm · = Không đổi · Cải thiện) + `.doi` "MT2 **3.5** → MT3 **4.5**"; sửa lỗi bỏ `sub` | `p4-1440` | KHỚP. KHÁC: hàng 3 "MT3 · L · W2 SEP" giữ (link trang lượt — GIỮ thao tác); thứ tự giảm trước (máy chủ cũ) |
| `#tt` dài · cột lý do | `knNhan` → `.k.nhan` nền `--accent-soft` (từ `extra.skill` / `skill=` của nguồn) | — | KHỚP (chưa có ô số kỹ năng trên Tổng quan demo để chụp) |
| `#tt` rỗng / lỗi / đang tải | `Empty` · `ErrorState` · `Skeleton` | — | GIỮ |
| dòng Case nhóm (6b-2) | `veDongCase` | — | GIỮ, không đổi |
| link "Hồ sơ" cuối dòng | tên em = link hồ sơ | — | BỎ ở dòng HV; GIỮ ở dòng không em (lớp, vận hành) |
| hồ sơ GV (Đạt Test · lớp) | `DongDiem` với `kn[].cua` → `.k.cua` viền 2 px nhấn (XM-2 cũ) | — | KHỚP nghĩa; bỏ ▲▼ chênh |

Tỉ lệ KHỚP (theo dòng bảng có ảnh / thành phần): 9 / 10 dòng khớp phần thân panel (≥ 90 %); phần khác nằm ở đầu panel chung (ngoài phạm vi) và chữ "chấm".

## Thao tác TRƯỚC → SAU

| Nơi | Trước | Sau |
|---|---|---|
| Panel số — dòng HV | tên chữ thường; link "Hồ sơ" cuối dòng; điểm (hồ sơ GV) ▲▼ chênh | tên = link hồ sơ HV; ngữ cảnh (lượt / Case) = link trang của dòng; dòng điểm ✓ / ✗ đúng lượt |
| Dòng có việc làm được | cả dòng là nút mở rộng → "Cần làm" | nút riêng (chữ việc) bên phải: Xác nhận PA vẫn mở rộng tại chỗ (Xác nhận PA · Sửa PA); việc khác mở panel làm việc như cũ |
| Dòng vừa làm | "✓ …" giữ chỗ | GIỮ (nền `--ok-bg`) |
| Tiến bộ kỹ năng | dòng có em mất chữ Tăng / Giảm (lỗi) | chip ▲ / ▼ / = + điểm hai lượt |
| Đạt MT (Báo cáo) | danh sách phẳng, Overall ✓ / ✗ | tab Chưa đạt · Đạt + dòng điểm đủ 4 kỹ năng |
| Tab Chưa đạt · Đạt · Vượt, phân trang, Cách tính, Hoàn tác | — | GIỮ |

## [XM] — chép vào plan.md "Việc để sau"
- [XM-1] Đầu panel số theo mockup v10 (chip SOS + số + dòng ngữ cảnh ⓘ; "Đạt MT3 56 % · 10/18 HV") — `KhungPanel` dùng chung, ngoài PANEL-CHUNG.
- [XM-2] Bài quá hạn: "Hà chấm" (chữ "chấm" sau tên) + nút "Phân công…" cho QL khi bài chưa phân công — cần `ChonPhuTrach` cho bài.
