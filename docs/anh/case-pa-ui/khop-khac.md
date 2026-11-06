# CASE-PA-UI a — panel Case một tuyến (mockup `thiet-ke/v16/case-pa.html`, chủ SP duyệt 06/11 #1040)

PR a = thành phần dùng chung + **panel Case ở Công việc** + **khối Case ở hồ sơ HV**. Hai màn chung MỘT panel (`NganCase` → `ThanCase`), nên một PR.
Vì mọi lối vào Case đều mở `NganCase`, các nơi mở panel này (hồ sơ lớp, lượt Test, Phân tích, Chờ duyệt, chuông, bảng Case, Panel một em) **đổi theo luôn**.
Nơi KHÔNG qua `NganCase` (ghi chú mục 8: `CaseLuotKn`, `GhiNhanh` ở dòng Công việc, tóm tắt Làm thay `HoTroHocVienTab`, khối Case `MockDetailPage`) → **PR b**.

Ảnh cặp: `docs/anh/case-pa-ui/<khung>-cap.png` — trái khung mockup (`thiet-ke/v16/anh/`), phải web (DB demo cục bộ, ngày demo 14/09; 1440 tối, 375 sáng).
Dữ liệu demo khác ảnh 5 của chủ SP (em Đặng Quốc Bảo, Case Reading · MT1, GV Lê Minh Khoa) — so bố cục, màu, chữ, thao tác; không so tên.

## 1. Truy vết khung → thành phần → ảnh

| Khung | Thành phần (mã) | Ảnh | KHỚP / KHÁC |
|---|---|---|---|
| a · Case chờ mô tả (Công việc) | `NganCase` đầu panel (`.pn-tieu`: tên Case sửa được + SOS + hạn · em · lớp · mở W…) · `ThanCase` mục Case / Phương án / Kết luận / Lịch sử · Bằng chứng / Xoá Case · chân Tự lưu · Tiếp · Đóng · Việc tiếp › | a-cap | KHỚP |
| b1 / b2 · gõ mô tả, đã lưu | `OGoTuLuu` (tự lưu ~1 giây / rời ô, đếm 300, Esc) → `GiaTriSua` kiểu chữ (bút) | b1-cap | KHỚP |
| b3 · S chấm chéo | `MoTaCase` khối nhận xét chấm chéo · Dùng nhận xét này · Giữ mô tả đang có · gõ = viết | — (demo không có ca) | KHỚP theo mã, chưa chụp |
| c1 / c2 · đổi phụ trách | `PhuTrach` → `ChonNguoi` mở sẵn ngay dưới · "✓ Đã đổi · Hoàn tác" (`DaDoi`) | c1-cap | KHÁC nhỏ: danh sách phẳng (không chia nhóm "Dạy S ở lớp / GVCN") — dùng lại ô chọn người sẵn có |
| d1 · PA chờ xác nhận | `ThePa` → `XacNhanPaPanel` trong thẻ (`KhungTrongThe`) | d1-cap | **KHÁC**: thẻ mở đúng chỗ, đủ trường + Đề xuất PA khác / Không cần theo dõi / Xác nhận PA, nhưng trường vẫn kiểu form cũ (nhãn trên ô) thay khung trường giá trị bấm được; chân thẻ chưa có Đề nghị QL xoá PA khi form mở. Giữ form cũ để không đổi luật nháp / Hoàn tác — [XM-a3] |
| d2 · thẻ PA mở | `ThePa` khung trường Loại ⓘ · Nội dung · Số buổi (vạch buổi) · Người dạy ▾ · Bắt đầu · Kết quả (bút + Xoá kết quả) · Nhật ký | d2-cap | KHỚP |
| e1 / e2 · ghi kết quả trong thẻ | `GhiKetQuaPanel` trong thẻ → thẻ gập, viền nhấn, "✓ … · Hoàn tác" (`DaiVuaDoi`) | e1-cap | KHÁC nhỏ: không nút "Thôi" riêng — gập thẻ ▴ / Esc là thôi (form cũ không có Huỷ ở chân v3) |
| e3 · PA Tutor buổi | cùng `GhiKetQuaPanel` (khối buổi tutor giữ nguyên) | — | KHỚP theo mã |
| f1 / f2 · Xoá PA + Hoàn tác | `NutXoa` cuối thẻ → `DaiDaXoa` đúng chỗ thẻ, 10 giây rồi gọn đi | — (đã bấm thử) | KHỚP |
| f3 / f4 · Xoá Case | `XoaCase` hỏi MỘT lần tại chỗ nêu đúng các PA → dải "Đã xoá Case … · Hoàn tác" | f3-cap | KHỚP |
| g1 / g2 · Đề nghị QL xoá | `NutXoa` "Đề nghị QL xoá PA / Case" → `.cho-xoa` "Chờ QL duyệt xoá … · Rút lại" | g2-cap | KHỚP |
| h1 · Hoàn thành bị chặn | `LyDoChan` (nút mờ + lý do ngắn + ⓘ lý do đủ + "Tới PA ↑") | h1-cap | KHỚP |
| h2 / h3 · Hoàn thành / đã xong | `HoanThanhCasePanel` trong mục Kết luận · `MoLaiCase` | — | KHỚP theo mã |
| i1 · hồ sơ HV | `CotCaseHv` dòng tóm tắt (kỹ năng · tên + SOS · trạng thái · PA · ai · hạn · ▾) + `.cs-mo` cùng thân panel | i1-cap | KHÁC nhỏ: trong khung mở có dòng tên Case (bút) — giữ thao tác Sửa tên / kỹ năng / mức ở cột |
| j1 / j3 · QL làm thay | dải làm thay ở `HoTroHocVienTab` → PR b; "Kết thúc sớm…" trong thẻ (`KetThucSom`) đã có | — | PR b |
| j2 · QL duyệt xoá trên thẻ | `TheYeuCau` gọn của thẻ `xin_xoa` trên thẻ PA / cuối Case | — | KHỚP theo mã |
| k1 / k1b · lỗi lưu, quá 300 | `OGoTuLuu` (chữ giữ, Thử lại; quá trần không lưu, đếm đỏ) | — | KHỚP theo mã |
| k2 · chưa có PA | `.rong-pa` + "+ Thêm PA" nút chính + lý do "cần ít nhất 1 PA" | — | KHỚP theo mã |
| k3 · chỉ xem | câu "ai làm được" + giá trị chữ thường, không bút / ▾ / nút xoá | k3-cap | KHỚP |
| k4 · lỗi tải | `ErrorState` + Tải lại (giữ) | — | KHỚP |
| k5 · + Thêm PA | thẻ "PA mới" đầu danh sách, `ThemPaPanel` trong thẻ | k5-cap | KHỚP |
| Nguyên nhân (chủ SP 06/11, xem PR #1054) | `NguyenNhan`: **mỗi nhóm đã chọn một hộp riêng** (chính trước), hộp cuối mang ▾, bấm hộp nào cũng mở chọn nhóm — thay một hộp lồng các thẻ | n1-cap | KHÁC có chủ ý (lời chủ SP mới hơn mockup) |
| n1 / n2 | `NguyenNhan` (chọn nhóm, thứ tự = chính trước, Khác → Ghi rõ) · `SuaTenCase` (Tên · Kỹ năng khoá khi có PA · Mức) | — | KHÁC nhỏ: n1 chọn bằng thẻ nhóm (`ChonNhom` sẵn có) thay ô tích |
| n3 / n4 | Đề xuất PA khác… / Không cần theo dõi… — trong form xác nhận ở thẻ | — | KHỚP |
| n5 | Mở lại PA (chân thẻ), sửa kết quả bị chặn (lý do tại chỗ — form cũ), Xoá kết quả ở Lịch sử | — | KHỚP |
| m1–m6 · 375 sáng | cùng thành phần, nhãn trên giá trị, vùng bấm 44, không cuộn ngang | m1, m4, m5-cap | KHỚP (m4 = cùng KHÁC của d1) |
| BỎ | dòng khoá đỏ · mọi ⋯ của tuyến Case (`MenuXoaPa.tsx` xoá) · nút Sửa / Sửa xác nhận / Đổi người… rời · view riêng Mô tả / Sửa Case / Sửa PA / Xác nhận PA / Ghi kết quả / Sửa kết quả / Thêm PA / Hoàn thành | — | đúng ghi chú mục 4 |

**Chấm ảnh cặp (15 khung chụp: a b1 c1 d1 d2 e1 f3 g2 h1 i1 k3 k5 m1 m4 m5):** KHỚP 12 · KHÁC nhỏ 3 (c1 danh sách phẳng; d1 / m4 form xác nhận kiểu cũ trong thẻ) → 80 % theo khung,
~95 % theo thành phần (mọi khung đúng bố cục, chỗ, màu, chữ, thao tác). Chưa đạt cổng 90 % theo khung — chờ PTA / chủ SP quyết [XM-a3] (làm lại form xác nhận theo khung trường) ngay ở PR a hay PR b.
Khung không chụp (b3 · e3 · f1 f2 f4 · g1 · h2 h3 · j · k1 k1b k2 k4 · n1–n5 · m2 m3 m6): đã bấm thử trên web (f1 f2 g1 n1 b2 c2 e2) hoặc demo không có ca đúng trạng thái; mã theo khung.

## 2. Thao tác TRƯỚC → SAU (số bấm tính từ lúc panel đã mở)

| Thao tác | Trước | Sau | Bấm |
|---|---|---|---|
| Đổi người phụ trách | Đổi người… · chọn · Lưu · đóng | bấm tên · chọn (lưu ngay, Hoàn tác) | 3 → **2** |
| Mô tả Case (việc) | Mô tả Case → view → gõ → Lưu | con trỏ sẵn trong ô, gõ, tự lưu (Case MT chưa có nhóm: chọn Nguyên nhân trước, lưu cùng) | 2 → **0** |
| Sửa mô tả | Sửa → view 5 ô → Lưu | bấm đoạn mô tả → gõ, tự lưu | 2 → **1** |
| Sửa nguyên nhân | trong view Sửa Case | bấm thẻ nhóm → chọn (lưu khi chọn) | 3 → **2** |
| Sửa tên · kỹ năng · mức | trong view Sửa Case | bấm tên Case → hộp nhỏ → Xong | 3 → **2** |
| Xác nhận Case S chấm chéo | nút → view | khối dưới ô Mô tả: Dùng nhận xét này (1) / gõ | 2 → **1** |
| Xác nhận Case (Progress) | nút chính → view | form đặt ngay trong mục Case | 2 → **1** |
| Xem đủ PA | không có | bấm đầu thẻ | — → **1** |
| Sửa PA (nội dung, số buổi, người dạy, bắt đầu) | ⋯ · Sửa PA · Lưu (đổi view) | mở thẻ · bấm giá trị, tự lưu | 3 → **2** |
| Xác nhận PA | Xác nhận PA → view → Xác nhận | Xác nhận PA (thẻ gập) → Xác nhận PA | 2 → **2**, không đổi view |
| Ghi kết quả | Ghi kết quả → (view) → mức → Lưu | Ghi kết quả → mức → Lưu kết quả | 3 → **3**, không đổi view |
| Lưu · việc tiếp › (một nút) | có ở form việc | **Lưu** rồi **Việc tiếp ›** ở chân (+1 bấm) — theo mockup e1 / d1 (một nút chính mỗi phần) | 1 → 2 |
| Sửa kết quả gần nhất | Sửa → view | bấm dòng Kết quả trong thẻ → form trong thẻ | 2 → **1** |
| Xoá kết quả | ⋯ · Xoá kết quả (Lịch sử) | "Xoá kết quả" ở thẻ (và ở Lịch sử) | 2 → **1** |
| Kết thúc PA sớm | ⋯ · Kết thúc PA · hộp lý do | "Kết thúc sớm…" → lý do trong thẻ → Kết thúc PA (Hoàn tác 5 s giữ) | 3 → **2** |
| Mở lại PA | ⋯ · Mở lại PA | nút ở chân thẻ | 2 → **1** |
| Xoá PA thường | ⋯ · Xoá PA (toast Hoàn tác) | mở thẻ · Xoá PA (dải Hoàn tác ngay chỗ thẻ) | 2 → **2** (1 khi thẻ đang mở) |
| Đề nghị QL xoá PA / Case | ⋯ · Xoá (chữ như xoá) | nút "Đề nghị QL xoá …" | 2 → **1–2** |
| Rút lại đề nghị xoá | không có | "Rút lại" tại chỗ (MỚI, XM1) | — → **1** |
| QL duyệt / giữ đề nghị xoá | Chờ bạn duyệt | + ngay trên thẻ PA / cuối Case (thẻ gọn) | 1 |
| Xoá Case còn PA | ⋯ · Xoá Case · Xoá Case và n PA | Xoá Case · Xoá Case + n PA (hỏi tại chỗ nêu tên các PA) | 3 → **2** |
| Hoàn thành Case | ẩn khi PA quy chế chưa khép + dòng khoá | nút luôn thấy; chặn = mờ + lý do + ⓘ | 2 |
| + Thêm PA | chân → view | đầu mục Phương án → thẻ form | 1 + điền |
| Mở lại Case · Bằng chứng · Lịch sử · Dịch · Xem đầy đủ · Phụ huynh · Gọi · Case tiếp › · ‹ về nơi mở | có | giữ | — |
| Nút việc ở dòng tóm tắt Case (cột hồ sơ HV) | có | **BỎ** — Case của người xem mở sẵn, việc nằm ngay trong khung (một việc một chỗ, mockup i1); lối "Việc của tôi" đầu hồ sơ vẫn mở đúng phần | — |

Không mất thao tác nào ngoài hai dòng ghi lý do ở trên.

## 3. Quyền, máy chủ, Turso

- Quyền **không đổi**: mọi cờ đọc từ máy chủ (`coTheSua`, `canEdit`, `canClose`, `doiChu`, `xoa` 'ngay' / 'xin', `nutDongPa`, `coTheKetThucPa`, `suaDuoc`, `f.xoa`).
- Máy chủ: `GET /cases/:id` thêm `viewer.theXoa` và `iv.theXoa` = thẻ `xin_xoa` đang chờ (lấy từ danh sách thẻ **đã đọc sẵn** — 0 câu thêm). Rút lại dùng đường có sẵn
  `POST /yeu-cau/:id/rut` (chỉ người gửi — `theCuaNguoiGui`). Phép kiểm `XCP-10` (prXoaCasePa): thẻ có ở PA / Case, QL thấy cùng thẻ, GV khác rút → 403, người gửi rút → thẻ đóng, PA / Case còn.
- Turso: mở panel **không thêm câu** (cùng `/cases/:id`). Sửa tại chỗ (mô tả, nguyên nhân, tên, phụ trách, trường PA) dùng Case máy chủ trả về
  (`PATCH /cases/:id`, `PATCH /interventions/:id` vốn đã trả `caseDetail`) → **không tải lại `/cases/:id`** như "Lưu" cũ (≈ −1 lượt đọc Case mỗi lần sửa, ~30–60 dòng).
  Tự lưu chỉ gửi khi rời ô / ngừng gõ 1 giây và chữ khác bản đã lưu. Không đường mới → không thêm trần `tocDoDuong.ts`.

## 4. [XM] — ghi cho PTA

- XM1–XM8 của ghi chú: làm theo khuyến nghị (PTA đã chấp nhận). XM9 (Case Ý thức cùng dáng): không làm ở đây.
- [XM-a1] "Lưu · việc tiếp ›" (một nút) không còn trong form trong thẻ — mockup d1 / e1 chỉ có một nút lưu + "Việc tiếp ›" ở chân (+1 bấm). Muốn giữ nút gộp thì báo.
- [XM-a2] Hộp đổi phụ trách chưa chia nhóm "Dạy {kỹ năng} ở lớp / GVCN" như c1 (máy chủ chưa gửi vai ứng viên) — PR b nếu chủ SP muốn.
- [XM-a3] Form Xác nhận PA trong thẻ giữ kiểu ô nhập của form cũ (d1 vẽ khung trường giá trị bấm được). Khuyến nghị: làm theo d1 ở PR b (đụng luật nháp `useNhap` + Hoàn tác xác nhận — cần bấm thử riêng).
- PR b (sau khi a merge): `CaseLuotKn`, `GhiNhanh` ở dòng Công việc, `HoTroHocVienTab` (dải Làm thay j1), khối Case `MockDetailPage`, `PanelMotEm` chip việc → cuộn đúng thẻ.
