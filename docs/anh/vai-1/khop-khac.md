# VAI-1 (web) — khớp / khác mockup v29

Đặc tả `docs/superpowers/specs/2026-11-26-vai-gdcn-lead-tvv-bpxl/thiet-ke.md` mục 9–10 · mockup `thiet-ke/v29/` (`ke-hoach-test-bpxl.html` K1–K3, `vai-moi.html` V1–V4) · luật N74–N77.
Ảnh cặp (trái mockup | phải web, dữ liệu demo — tài khoản GĐCN / Lead TVV / BPXL thêm tay vào DB demo cục bộ): thư mục này.

## 1. Truy vết khung → thành phần → ảnh

| Khung | Thành phần web | Ảnh | KHỚP / KHÁC |
|---|---|---|---|
| K1a/b · ô Chi nhánh đầu hàng lọc, mặc định CN gán | `KeHoachTestTab` (`BranchFilter luon`, `cnGan`, `cn=all`) | K1a-1440, K1b-1280 | KHỚP (ô chọn gốc của web, cùng dáng mọi trang) |
| K1 · cụm "Xếp lịch Bạn · Bỏ nhận / {tên} · Nhận lại / Chưa ai nhận · Nhận lớp" | `XepLichLop` (`dong`) trong `LopKeHoach`, `.xl-dong` | K1a, K1b | KHỚP — nhãn căn phải, nút 100 px thẳng cột |
| K1b · 1280 ô số một dòng | `.hl-kh` cột cố định gọn ở ≤ 1400 px | K1b-1280 | KHỚP (đã sửa: trước "Vắng · 1 em" xuống dòng) |
| K1c · 375 ô Chi nhánh cả hàng, cụm Xếp lịch dòng riêng, nút 44 | `BranchFilter hetHang`, `.hl-kh > .xl-dong` | K1c-375 | KHỚP; GIỮ "Xuất Excel…" ở 375 (mockup không vẽ) |
| K2a/b · CN khác: "Đã có điểm" thay band, S Ex chỉ tuần, tên em không link, ⓘ giải thích | `LuoiKeHoach chiLich` · `ODotGon anDiem` · `HangSEx` (`diem != null`) · NutLuat thêm 1 dòng | K2a-1440, K2b-375 | KHỚP |
| K3a · bấm Nhận lớp → toast + Hoàn tác | `XepLichLop.doi` → `toast.hoanTac` ("· n việc Xếp lịch họp chuyển theo" khi máy chủ trả `soViec`) | K3a-1440 | KHỚP; Hoàn tác 10 giây như mọi toast (mockup ghi 15 phút = cửa sổ máy chủ) |
| K3b · 409 "Lớp vừa có người khác nhận." + Tải lại | `XepLichLop` nhánh 409 | K3b-375-web-loi409 (chỉ web) | KHỚP |
| V1a · ô vai có GĐCN, Lead TVV + dòng phụ hậu quả | `SuaVaiChiNhanh` (`dongPhuVai`), ô vai 200 px | V1a-1440 | KHÁC nhỏ: ô vai là `<select>` gốc (không vẽ được dòng phụ trong danh sách thả) — dòng phụ hậu quả nằm dưới chip như mockup |
| V1b · BPXL Toàn hệ thống = Lead BPXL, Lead TVV toàn HT | như trên | V1b-1440 | KHỚP (đã sửa ô vai cắt "Chuyên viên Xếp lịc") |
| V1c · 375 BPXL đủ 5 CN | như trên, 375: ô vai + Gỡ hàng đầu, chip hàng sau | V1c-375 | KHỚP |
| V2a · Head bấm ô tên → hộp chọn BPXL + "Bỏ người xếp lịch" | `XepLichDau` (DauTrangLop) → `XepLichLop ganHo` + `HopNeo` + `ChonNguoi` | V2a-1440 | KHỚP; đặt cùng dòng GV (đầu hồ sơ web khác khuôn mockup) |
| V2b · vừa đổi → toast Hoàn tác | như trên | V2b-1280 | KHỚP |
| V2c · 375 lớp chưa ai nhận | như trên | V2c-375 | KHỚP |
| V3a/b · GĐCN "Của tôi" có Kết quả meeting | không đổi mã (máy chủ VAI-0 giao; panel Meeting sẵn có) | — | Không chụp được: dữ liệu demo không có Meeting SOS 3 đang mở |
| V3c · GĐCN không việc riêng → mở "Tất cả" | `HoTroHocVienTab` (`laGdcn` → mặc định như CX) | V3c-1280 | KHỚP; GIỮ tab Chấm điểm / Chấm Speaking như Head (mockup vẽ ít tab hơn) |
| V4a/b · Lead TVV "Của tôi" chia tab kiểu TVV | `HoTroHocVienTab` (`tabTvv`) | V4a-1440, V4b-375 | KHỚP tab (dữ liệu demo chỉ có 1 việc Bổ sung hồ sơ) · KHÁC xem [XM-2], [XM-3] |

BỎ: không. GIỮ: mọi thao tác cũ (bảng mục 2).

## 2. Thao tác TRƯỚC → SAU

| Màn | Trước | Sau | Mất |
|---|---|---|---|
| Kế hoạch Test (BPXL) | lớp CN gán; không ô Chi nhánh (1 CN) | + ô Chi nhánh (mọi CN, "Tất cả"); + Nhận lớp / Bỏ nhận / Nhận lại + Hoàn tác; Xuất Excel…, Xếp nhiều MT…, + MT, S Ex, Ghi chú lớp, dải số giữ | không |
| Kế hoạch Test CN khác | không thấy | thấy + xếp được (máy chủ đã mở); ô xong "Đã có điểm", tên em chữ thường | không |
| Lịch Test tuần (BPXL) | CN gán | + ô Chi nhánh như Kế hoạch Test (đặc tả "dùng lại") | không |
| Sửa tài khoản | 8 vai | 10 vai + dòng phụ hậu quả (GĐCN, Lead TVV, BPXL toàn HT / theo CN) | không |
| Hồ sơ lớp | — | + "Xếp lịch {tên}": BPXL Nhận / Bỏ; Head / GĐCN / QT / lead BPXL đổi qua hộp chọn | không |
| Công việc GĐCN | (vai chưa có) | như Head; mặc định Của tôi khi có việc, không → Tất cả | — |
| Công việc Lead TVV | (vai chưa có) | như CX; "Của tôi" chia tab Báo PH · Sau thi · Chốt ngày thi · Bổ sung hồ sơ | — |

## 3. Máy chủ (nhỏ, phục vụ web)

- `GET /classes/:id/xep-lich` thêm `ganHo` + `ungVien` (mọi BPXL đang hoạt động, một câu, chỉ khi gán hộ được).
- `POST /classes/:id/xep-lich` trả thêm `soViec` (số việc Xếp lịch họp chuyển theo — toast).
- `GET /ref/branches`: BPXL nhận mọi chi nhánh (N77 — ô Chi nhánh của Test).
- Phiên: grant mang `vaiThat` (web nhận GĐCN / Lead TVV).

## 4. [XM] hỏi PTA Plan

- **[XM-1]** Mockup V4 bỏ "Của GV" cho Lead TVV ("như CX: Của tôi · Tất cả"), nhưng CX trên web hiện có Của tôi · Của GV · Tất cả → GIỮ như CX (một vai như CX, không bớt thao tác).
- **[XM-2]** Mockup V4a: dòng việc ghi "· chưa có TVV" / "· TVV đã nghỉ" và panel có khối "Em chưa có TVV · Gán TVV cho em ›" — chưa làm: máy chủ chưa gửi lý do (chưa gán / hết vai) theo việc; cần một cờ ở `/my-work`. Đề xuất PR nhỏ sau (máy chủ + web).
- **[XM-3]** V3a / V3b (GĐCN có Kết quả meeting) chưa chụp được trên dữ liệu demo; mã panel dùng chung với CX, không đổi.
- **[XM-4]** Cụm Xếp lịch ở Kế hoạch Test chỉ hiện cho BPXL (mockup chỉ vẽ BPXL); Head đổi người ở hồ sơ lớp.

## 5. Audit (impeccable `audit` + `web-design-guidelines`, phạm vi PR)

| Mục | Điểm | Ghi |
|---|---|---|
| A11y | 3 | nút có tên đọc màn ("Đổi người xếp lịch: {tên}", aria-haspopup / expanded); 375 nút 44; đã sửa ô Chi nhánh BPXL đứng đầu bằng thứ tự DOM (trước dùng CSS order — Tab lệch) |
| Hiệu năng | 4 | hồ sơ lớp chỉ GET xep-lich khi là BPXL / gán hộ được; danh sách BPXL một câu; Nhận lớp chỉ vô hiệu `/ke-hoach-test`, `/my-work` |
| Responsive | 3 | 1440 / 1280 / 375 đã soi: không cắt chữ (kiểm `.hl-kh-phu` scrollWidth), mã tuần một dòng |
| Theming | 4 | chỉ token (`text-dim`, `text-faint`, `var(--line)`), tối / sáng theo nền |
| Tính toàn vẹn | 4 | dùng lại `BranchFilter`, `HopNeo`, `ChonNguoi`, `toast.hoanTac`, `NutChon` |
| **Tổng** | **18/20** | không P0 / P1 |
