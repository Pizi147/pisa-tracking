# UI-SUA-TK-GON — Quản trị · Sửa tài khoản gọn theo luật mật độ M1–M10 (`de-xuat.md` mục 1, hạng 7 mục 3)

PTA Plan 05/11 (đêm, chủ SP uỷ quyền PTA rà / merge): màn ⑦ **Quản trị · Sửa tài khoản** (panel). Bệnh (`de-xuat.md`): "Có đoạn giải thích dài dưới
'Quyền cấp riêng' (M4 → ⓘ)". **Giữ bố cục + mọi thao tác**; chỉ đổi chữ thừa. Panel Tạo tài khoản dùng chung thân form (`AccountDialog`) → sửa cùng.
Không đổi máy chủ, không thêm request. Chủ SP dặn đêm 05/11: "hạn chế text thừa, mọi thứ đẹp, gọn gàng, đơn giản hoá, logic".

Dữ liệu demo: Quản trị (vai 1, tiếng Việt) sửa tài khoản Nguyễn Khánh Vy (Quản lý · MB). Phông kiểm `document.fonts.check('600 14px "Be Vietnam Pro"') === true` ở mọi ảnh.
Ảnh cắt đúng panel (bên phải trang 1440; cả màn ở 375) — danh sách tài khoản phía sau không đổi.

## Ảnh trước | sau

| Màn | Ảnh |
|---|---|
| Sửa tài khoản · 1440 tối (nhóm quyền gập) | `truoc-sau-sua-1440-toi.png` |
| Sửa tài khoản · 1440 tối (mở nhóm Lịch & Test) | `truoc-sau-sua-mo-1440-toi.png` |
| Tạo tài khoản · 1440 tối | `truoc-sau-tao-1440-toi.png` |
| Sửa tài khoản · 375 sáng (mở nhóm) | `truoc-sau-sua-mo-375-sang.png` |
| Sau: tick một quyền → Lý do đổi quyền (0/200) + ⓘ Quyền cấp riêng đang mở | `sau-ly-do-va-o-i-1440-toi.png` |

## Đo trước → sau (chữ trong panel; màn đầu 1440 × 900 / 375 × 812)

| Màn | Từ màn đầu (cả panel) | Đậm màn đầu | Nút / ô (cả panel) |
|---|---|---|---|
| Sửa · nhóm gập 1440 | 164 → **74** | 24 % → 23 % | 24 → 26 (+2 ⓘ) |
| Sửa · mở nhóm 1440 | 184 (268) → **174 (178)** | 16 % → 17 % | 30 → 32 (+2 ⓘ) |
| Tạo · 1440 | 84 → **54** | 6 % → 6 % | 21 → 22 (+1 ⓘ) |
| Sửa · mở nhóm 375 | 149 (268) → **148 (178)** | 8 % → 8 % | 30 → 32 |

Đậm đã thấp (≤ 24 %) — màn này chỉ thừa chữ, không thừa đậm; giữ nguyên độ đậm.

## Chỗ ngợp → luật → cách sửa

| # | Trước | Luật | Sau |
|---|---|---|---|
| K1 | Đoạn 3 dòng dưới các nhóm quyền ("Quyền ở đây **cộng thêm** vào quyền của vai trò… không có trong danh sách.") | M4 | Vào ⓘ cạnh nhãn "Quyền cấp riêng" (cùng câu, cùng chữ đậm "cộng thêm") |
| K2 | Nhãn "Quyền cấp riêng cho người này" — cột bảng gọi "Quyền cấp riêng"; 375 nhãn + "Chưa cấp riêng quyền nào" xuống hai dòng | M5, M8 | Một tên "Quyền cấp riêng" (cả Hướng dẫn QT); 375 đầu khối một hàng |
| K3 | Dưới Kỹ năng: "Năng lực để gợi ý khi phân công — không phải quyền nhập điểm." (375 hai dòng) | M4 | ⓘ cạnh nhãn "Kỹ năng phụ trách được" |
| K4 | Dưới Đặt lại mật khẩu: "Hệ thống chưa có luồng quên mật khẩu — đặt lại mật khẩu ở đây. Bỏ trống nếu không đổi." | M4 | "Bỏ trống nếu không đổi" = chữ mờ trong ô; câu còn lại ở `title` ô |
| K5 | Lý do đổi quyền: "Ghi vào nhật ký để sau này tra lại vì sao người này có quyền đó. {n}/200 ký tự." | M4 | Dưới ô chỉ "{n}/200 ký tự"; câu nhật ký ở `title` ô (ô vẫn bắt buộc, vẫn có ví dụ trong ô) |
| K6 | Tạo: "Chỉ để hiển thị, không ảnh hưởng quyền." (Chức danh) · "Người dùng đổi lại ở hồ sơ cá nhân." (Mật khẩu ban đầu) | M4 | `title` ô. "Phải có đuôi .pisa@gmail.com." GIỮ — là luật ô, đổi cách gõ |
| GIỮ | Vai trò và chi nhánh (+ Thêm vai trò, chọn chi nhánh, Gỡ, khoá vai QT của mình), Kỹ năng L R W1 W2 S, nhóm quyền gập / mở + số quyền, mô tả + phạm vi từng quyền, Phạm vi (Toàn hệ thống / chi nhánh), cảnh báo "sẽ gỡ", lỗi dưới ô, chân Đóng / Lưu | — | không đổi |

**Không làm:** mô tả từng quyền (`MO_TA_QUYEN`, vd "Huỷ cả lượt MT — Huỷ cả một lượt Mock Test.") có chỗ gần lặp tên, nhưng là chữ miền dùng chung với
tab Quyền & nhật ký và là thứ Quản trị đọc để quyết cấp hay không → giữ; muốn gọt thì làm ở `shared/domain` một PR riêng (ghi Việc để sau nếu PTA đồng ý).

## Thao tác TRƯỚC → SAU (không mất thao tác)

| Thao tác | Trước | Sau |
|---|---|---|
| Thêm / đổi / gỡ vai, chọn chi nhánh, CX Toàn hệ thống | có | có |
| Chọn kỹ năng phụ trách | có | có |
| Mở / gập nhóm quyền, tick quyền, chọn phạm vi | có | có |
| Ghi Lý do đổi quyền (bắt buộc khi đổi quyền) | có | có |
| Đặt lại mật khẩu | có | có |
| Đọc giải thích quyền cấp riêng / kỹ năng | đoạn chữ dưới khối | bấm ⓘ (Esc / bấm ra ngoài đóng) |
| Tạo tài khoản: họ tên, chức danh, email, mật khẩu ban đầu, điện thoại | có | có |
| Lưu · Đóng (hỏi khi có thay đổi chưa lưu) | có | có |

## Dòng đọc Turso

Không đổi máy chủ, không thêm request — chỉ đổi chữ trên panel.

## Mã chạm

`web/src/modules/platform/AccountsAdmin.tsx` · `shared/i18n/en/sotQuanTri.ts`, `shared/i18n/en/hdb.ts` · `shared/huongDan/qt.ts` (một tên "Quyền cấp riêng").
