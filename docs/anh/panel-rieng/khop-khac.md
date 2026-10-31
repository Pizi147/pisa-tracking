# PANEL-RIENG — khớp / khác mockup `thiet-ke/v10/panel-thong-tin.html` (B5 · B6 · B7) + backlog PANEL [XM-1, XM-2]

Chỉnh chủ SP / PTA thắng mockup: điểm kỹ năng **✓ / ✗ trước số** (không ▼), đạt ✓ màu Overall đạt, hụt ✗ màu hụt. Dừng → Kết thúc học giữ như web (T10, [XM-3]).
Ảnh cặp (trái mockup, phải web): `p5-1440` · `p5-375` · `p7-1440` · `p7-375` · `p1-1440` · `p3-1440` · `p6-1440`; ảnh đơn `p5-hop-sos-1440` (hộp "Vì sao SOS 3" mở).
Cách chụp: `KHUNG_BASE=http://localhost:5611 BAM="Mở Case của Kiều Thảo Nhi" node scripts/anh-cap.mjs thiet-ke/v10/panel-thong-tin.html "#p5 figure >> nth=0" "/hoc-vien?view=sos" 2 1440 …`
(p7: `/hoc-vien/lop/34?viec=xet-lai`, `BAM="Học lại FOU"` · p1 / p3: Tổng quan QL, `BAM="2 — SOS 2 · MB FT 101"` / `"9 — Chấm quá hạn · Cao Khánh Linh"` · p6: `/phan-tich?goc=hieu-qua-pa`, `BAM="Toàn bộ"`).

## Bảng truy vết khung → thành phần → ảnh

| Khung | Thành phần web | Ảnh | KHỚP / KHÁC |
|---|---|---|---|
| `#p5` 0 1440 đầu panel | `PanelMotEm` `dau`: loại "HỌC VIÊN" · tên = link hồ sơ + `ChipSos hienKyNang={false} soLieu` · "Hồ sơ ›" phải (+ chip hạn việc gấp nhất — GIỮ) | `p5-1440`, `p5-hop-sos-1440` | KHỚP. KHÁC: dòng "mở từ …" BỎ (panel không biết nguồn; ‹ về nguồn đã có ở nút quay lại khi lồng); hộp SOS dùng bảng số sẵn có của `ChipSos` (nhãn · số), không cột "thiếu 1.0" |
| `#p5` 0 hàng thông tin + khối điểm | Lớp · Target · TVV · Thi (`tachNhanLichThi`) + `DongDiem` trên nền `--surface-2`; panel 720 | `p5-1440` | KHỚP (Thi chỉ hiện khi có lịch — em demo chưa có) |
| `#p5` 0 Case đang mở / Ý thức | danh sách Case gập / mở + Cần làm + Việc khác + sau thi (như nay) | `p5-1440` | GIỮ (mockup thẻ Case rút gọn — web giữ thao tác Mô tả / Xác nhận / Ghi kết quả tại chỗ) |
| `#p5` 1 375 | như trên, `DongDiem` hai hàng | `p5-375` | KHỚP |
| `#p6` 0 Phân tích | thẻ "Chưa tính": "**n** PA chưa có kết quả ⓘ" (`NutLuat`); `VanDeKyNang` (Phân tích lớp): nút chữ + ⓘ → `NganDanhSach` (tên link · nút Ghi kết quả khi `viec.lam`) | `p6-1440` | KHỚP chữ + ⓘ. Demo có **0** PA chưa có kết quả → không mở được panel để chụp; panel là `NganDanhSach` chung (cùng ảnh p1 / p3) |
| `#p7` 0 1440 Khi lưu + ⓘ | khối vàng MỘT dòng "Khi lưu: {quyết định của em}" (`chuQuyet`, cùng chữ chân) + ⓘ phải mở 4 ý cũ (chữ giữ nguyên) | `p7-1440` | KHỚP |
| `#p7` 0 dòng điểm Final | `DongDiem` (`diemFinal`: % từng môn ✓ / ✗ của máy chủ, Tổng làm tròn xuống, ngưỡng 70 %) thay dòng "Final … ✗" tô đỏ tay | `p7-1440` | KHỚP. KHÁC: nhãn "Final" không tuần (dữ liệu xét lại không có tuần Final) |
| `#p7` 1 375 | như trên; `.dd.pt` 375: lượt │ Tổng, môn 2 × 2 (ô "G+V ✗ 44 %" không vừa 4 cột) | `p7-375` | KHÁC có lý do (đo tràn) |
| Dừng → Tạm dừng / Kết thúc học + lý do | như nay | — | GIỮ [XM-3] |
| Lưu nháp / Lưu n · Hoàn tác 10 s · Chọn nhiều / Áp cho n em | như nay | — | GIỮ |
| `#p1` / `#p3` đầu panel số (XM-1) | `KhungPanel dau.tieu`: tên số liệu + **n** + đơn vị (`unit` máy chủ) + ⓘ Cách tính (trước: `<details>` cuối panel) — `NganDanhSach`, `PanelGvTre` | `p1-1440`, `p3-1440` | KHỚP dòng tiêu đề. KHÁC: dòng ngữ cảnh "lớp · phạm vi · dữ liệu đến" không thêm (nơi gọi chưa truyền — PR riêng nếu cần) |
| `#p3` "Hà chấm" / Phân công (XM-2) | máy chủ `ganChiTiet`: "{tên} chấm" / "… chấm chéo"; không ai giữ ô → `chuaPhanCong` → web "chưa phân công" + nút **Phân công ›** (QL / QT) mở `/hoc-vien/lop/{lớp}?viec=phan-cong` | `p3-1440` (panel GV trễ) | KHÁC có lý do: mockup "Phân công…" mở tại chỗ — web đổi trang (cần dữ liệu cả lớp; `ChonPhuTrach` là bộ lọc Công việc, không gán người chấm) [XM-2b] |

Tỉ lệ KHỚP: 11 / 12 dòng có thành phần khớp hoặc GIỮ theo quyết định đã duyệt; dòng KHÁC hình duy nhất là 375 dòng % (đo tràn) → ≥ 90 %.

## Thao tác TRƯỚC → SAU

| Nơi | Trước | Sau |
|---|---|---|
| Panel một em · đầu | tên chữ · dòng 2 "Hồ sơ · lớp · lượt · chip SOS" | tên = link hồ sơ + chip SOS (bấm = hộp có số) · "Hồ sơ ›" phải; lớp / Target / TVV / Thi + dòng điểm trong thân |
| Panel một em · Case / Việc khác / sau thi / Phụ huynh | — | GIỮ, không đổi |
| Cần bổ sung đánh giá | nút chữ 14 chữ; panel mỗi dòng là link | "n PA chưa có kết quả ⓘ"; panel số chung: tên link, nút Ghi kết quả riêng; đóng panel → bảng đọc lại |
| Phân tích · Chưa tính | "PA chờ kết quả" | "PA chưa có kết quả" + ⓘ (một khái niệm một tên) |
| Xét lại · Học lại / Lên | khối vàng 4 dòng | 1 dòng "Khi lưu: …" + ⓘ (4 ý); chân "Khi lưu:" GIỮ |
| Xét lại · Final | chữ "Final 46 % · ✗ L 48 …" đỏ tay | dòng điểm chung ✓ / ✗ + Tổng / ngưỡng |
| Panel số (mọi) · Cách tính | `<details>` cuối danh sách | ⓘ cạnh số ở dòng tiêu đề (cùng chữ) |
| Bài quá hạn | "Hà" / không ghi gì khi chưa phân công | "Hà chấm"; "chưa phân công" + Phân công › (QL) |

## Đo / kiểm

- Đọc Turso: panel một em +1 câu (lộ trình mới nhất của MỘT em, 1 dòng) khi mở panel; vẽ ô số 0 câu; panel số 0 câu (đơn vị lấy từ `unit` đã trả).
- `PISA_CHI_TEP=prPanelRieng,prPanelMc,prPanelChung,prXetLai,prNenTypoMau,prSang,prS4f,prEn,prBang0,suaLoiNong,prHvLopViec,prBangEmGon,prUiHoSoGv`: 549 / 549 đạt.
- Bấm thử QL (vai 2) 1440 / 375: panel một em (hộp SOS mở), Xét lại (Học lại → chọn lớp → ⓘ), panel SOS 2, panel chấm quá hạn; không lỗi trang.
