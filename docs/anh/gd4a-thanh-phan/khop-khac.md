# GD-4a — Thành phần chung (phần 1): dòng việc ô vuông + vạch hạn · nút "Không cần theo dõi" / "Xác nhận xử lý" · thang WL nổi

Plan: `docs/superpowers/specs/2026-11-13-overhaul-v6/09-plan-giao-dien-dot-2.md` dòng GD-4 (a), (b), (f). Mockup ⑤ `thiet-ke/v21/bang-mau.html` khu B, C (đã duyệt, lời 27) · mockup ③ `ho-so-hv.html` K4a (thang, nút — lời 28).
PTA Plan đồng ý / chờ đồng ý chia GD-4: **4a** (PR này) · **4b** 83 câu dòng quy chế (sau GD-3 #1563) · **4c** H1–H4 một dáng tab / menu / dải chỉ số / lịch sử. (d) bước chọn em = ô chọn có tìm thuộc GD-5.

Ảnh cặp (trái mockup · phải web, demo 14/09, GVCN Trần Ngọc Hà — vai 7):
`cap-1440-case.png` (⑤ B1 ↔ Công việc › Case học thuật) · `cap-1440-y-thuc-hv.png` (③ K4a ↔ hồ sơ HV Vũ Hải Đăng › Ý thức, thang mở).

## 1. Truy vết khung → thành phần → ảnh

| # | Khung | Thành phần web | Ảnh | Kết quả |
|---|---|---|---|---|
| 1 | ⑤ B1 ô vuông 28 px biểu tượng đầu mọi dòng việc (`.av.vuong`) | `AvViec` trong `DongViec` · `DongLop` · `DongGon` (em trong khay không có — như mockup) | cap-1440-case | KHỚP |
| 2 | ⑤ B1 biểu tượng theo loại: lớp / gộp = ô bảng · Chấm Speaking = micro · Báo cáo PH = tờ giấy | `icDong()` | cap-1440-case | KHỚP |
| 3 | ⑤ B1 vạch hạn trong mục: Quá hạn · Hôm nay · Hạn đến {CN} · Hạn sau {CN} · Không hạn | `DanhSachViec` — vạch chỉ khi mục có ≥ 2 nhóm hạn | cap-1440-case (Mô tả Case, Phương án) | KHỚP |
| 4 | ⑤ B1 dòng "Lớp · tên việc", tên em thẻ phụ | đã có (#1584) | cap-1440-case | KHỚP |
| 5 | ⑤ C nút-chip "Việc cần làm" không biểu tượng | đã có (#1566) | — | KHỚP |
| 6 | Lời 28 ý 1: "Không cần theo dõi" là NÚT mờ | `NUT_MO` (`ui/KhuonViec.tsx`) ở `CasePanel` + `CaseSosControls` (form Xác nhận PA) | — (seed GV 7 không có Case SOS đang chờ — kiểm mã) | KHỚP (mã) |
| 7 | Lời 28 ý 2: "Xác nhận xử lý" là NÚT | hồ sơ HV (`StudentYThucSection` ô bước + dòng vi phạm) · tab Ý thức lớp (`ClassYThucCard` ô bước + dòng) · panel Xem vi phạm (`PanelXemViPham` chân) | cap-1440-y-thuc-hv | KHỚP |
| 8 | Lời 28 ý 3 / ③ `.vach-bac b.wl`: WL 1, WL 2 nhãn đỏ nổi trên thanh (đã tới: đỏ đặc) | thang mini hồ sơ HV (`StudentYThucSection`) | cap-1440-y-thuc-hv | KHỚP |
| 9 | "mọi nơi hiện thang" | thang đầy đủ `ThangYThuc` (hồ sơ HV "Thang ▾", chip mốc tab lớp, panel Xử lý) — chip WL đỏ | cap-1440-y-thuc-hv (thang mở) | KHỚP |

**KHỚP 9 / 9 = 100 %** cho phạm vi 4a.

## 2. KHÁC (có lý do)
- **KHÁC-1** Cột hạn của việc không hạn ghi chữ mờ "không hạn" (web đang có); mockup ⑤ để trống cột khi đã có vạch "Không hạn". Giữ chữ: mục chỉ có việc không hạn thì không có vạch (một nhóm), cột trống sẽ mất thông tin.
- **KHÁC-2** Thang mini hồ sơ HV giữ 6 bậc mạch chính (Report 1 … WL 2) như web; mockup ③ vẽ 7 (thêm Report 7). Bậc sau WL 2 tăng mãi — thang đầy đủ ở "Thang ▾".
- **KHÁC-3** Menu "+ Task" chưa có biểu tượng mục ([XM-7] ⑤ — đề xuất, không bắt buộc); `MenuDong` chưa có trường biểu tượng — để 4c (một dáng menu).

## 3. Thao tác TRƯỚC → SAU

| Thao tác | Trước | Sau | |
|---|---|---|---|
| Không cần theo dõi… (Case SOS, form Xác nhận PA) | chữ link | nút mờ | ĐỔI dáng (lời 28) |
| Xác nhận xử lý (ô bước, dòng vi phạm, panel Xem vi phạm) | chữ link | nút viền | ĐỔI dáng (lời 28) |
| Đọc mốc WL trên thang | vạch xám / chip viền như Report | nhãn đỏ WL 1 / WL 2 | ĐỔI dáng (lời 28) |
| Đọc hạn trong mục việc | cột hạn từng dòng | + vạch nhóm hạn | THÊM |
| Mọi thao tác dòng việc, thang, panel | có | có | GIỮ |

Không thao tác nào bị mất.

## 4. Turso
Chỉ đổi hiển thị — 0 câu, 0 request thêm.
