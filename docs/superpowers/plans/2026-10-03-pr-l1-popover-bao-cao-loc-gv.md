# PR-L1 — Popover bị che · Thanh điều khiển Báo cáo đơn vị · Lọc giáo viên ở Quản trị — Kế hoạch (03/10, chủ sản phẩm)

> **Nguồn:** hai ảnh chụp của chủ sản phẩm 03/10 + một yêu cầu mới (lọc, phân loại giáo viên theo chi nhánh, xem ở Quản trị hệ thống).
> **Đối chiếu kế hoạch cũ (đã rà 03/10):**
> - Ảnh 1 (popover bị che): **chưa có** trong `2026-10-02-ux-sau-critique.md` (G4 chỉ nói cột thao tác Lịch Test). → mục **L1**.
> - Ảnh 2 (Báo cáo đơn vị): **chưa có kế hoạch cho bố cục thanh điều khiển.** UX-D7 (`2026-10-01-pr-uxd-dien-thoai.md`, Q1) chỉ hoãn việc
>   đổi bảng thành thẻ trên điện thoại; `2026-10-01-pr-don-ma-thua-quyen.md` mục 8/9 chỉ nói chữ "09/2026" và bộ lọc chi nhánh. → mục **L2**.
> - Lọc giáo viên: chưa có (Quản trị › Tài khoản chỉ có "Đang dùng / Đã xoá"). → mục **L3**.

## 0. Luật chung
- Tinh chỉnh, không làm lại (CLAUDE.md). Mã tuần `W1 OCT` giữ nguyên.
- Mỗi mục: phép kiểm trước (đỏ) nếu có logic → sửa → `npm run check` → ảnh 1440/375 sáng/tối → `/impeccable audit` → `/ponytail-review`.

## L1. Popover "Thiếu n" bị che bởi hàng dưới (ảnh 1)
- **Hiện tượng:** ở Học viên & Lớp, bấm badge "Thiếu 1" của hàng 2 → hộp "Cần bổ sung sớm: Tháng/năm dự kiến thi · CN" bị hàng 3 che mất
  nửa dưới và nửa trái (chỉ còn thấy "Cần bổ s…" và "CN").
- **Nguyên nhân (cần session code xác nhận bằng DevTools):** `MissingBadge.tsx:41` vẽ popover `absolute z-20` **ngay trong ô bảng**, nên bị
  kẹt trong ngữ cảnh xếp chồng của hàng/ô (ô có `.th`/`.hang-lon` sticky, `overflow` của `table-scroll`) → hàng sau vẽ đè.
- **Cách sửa:** vẽ popover bằng `createPortal(…, document.body)`, `position: fixed` theo `getBoundingClientRect()` của nút (BangHocVienLop đã
  dùng `createPortal`, theo mẫu đó). Lật lên trên nếu dưới không đủ chỗ; không tràn mép phải ở 375 px. Đóng khi bấm ra ngoài, nhấn Esc, hoặc cuộn.
  Giữ `aria-expanded`. Sửa **một chỗ** (`MissingBadge`) là đủ cho cả 5 nơi dùng: `BangHocVienLop`, `ClassRoster`, `BangDiemLopThuong`, `StudentDetailPage`.
- **Tiêu chí:** mở badge ở hàng đầu, giữa, cuối bảng; ở bảng cuộn ngang; ở thẻ điện thoại → hộp luôn đủ, nằm trên mọi hàng, không che nút ⋯.
- **Việc phụ thấy trong ảnh:** tooltip hệ thống "Tháng/năm dự kiến thi" (thuộc tính `title`) hiện đè lên popover. Khi popover mở thì bỏ `title` của nút badge (đã có danh sách trong popover).

## L2. Báo cáo đơn vị — thanh điều khiển (ảnh 2) · `MeetingPage.tsx:114-126`
Chủ sản phẩm không ghi rõ điểm nào chưa ổn; đây là những gì thấy trong ảnh (nếu ý khác, báo lại):
1. Thanh điều khiển vỡ thành 3 cụm lệch hàng: `WeekPicker` + nút "Tuần này" xuống dòng riêng; ô **Kỳ** lơ lửng giữa hàng 1 và 2 (nhãn "Kỳ" cao hơn ô chọn);
   link "Giao việc ở Vận hành ›" nổi một mình. Chiếm ~170 px chiều cao trước khi tới bảng.
2. Ba số "0 đơn vị đã nộp · 0 đang nhập · 6 chưa báo cáo": hai số 0 mờ như bị khoá, không rõ có bấm lọc được hay không (`locTrangThai`).
3. Bảng "Tình hình đơn vị": 3 cột "—" rỗng chiếm 3/5 chiều ngang khi tuần chưa có báo cáo.
- **Cách sửa (impeccable `layout` + `clarify`, không đổi dữ liệu):**
  - Một hàng ≥ 640 px: `[‹ W1 OCT · 28/09–04/10 ›] [Tuần này] [Kỳ: Tuần | Tháng]` bên trái; "Giao việc ở Vận hành ›" căn phải. Kỳ dùng `BoLocDoan` (hai nút) thay `<select>`
    để cùng kiểu bộ lọc ở Tài khoản; nhãn "Kỳ" cùng đường cơ sở.
  - < 640 px: giữ nguyên hành vi hiện tại (UX-D7 vẫn hoãn); chỉ bảo đảm không tràn ngang.
  - Ba số: nếu bấm lọc được → thành chip có trạng thái bật/tắt (`aria-pressed`), số 0 vẫn đọc rõ (chữ thường, không mờ); nếu chỉ là số đếm → bỏ kiểu nút.
  - Bảng: khi cả tuần chưa có báo cáo, thu cột rỗng bằng một dòng "Chưa đơn vị nào báo cáo — nộp từ Thứ Bảy 03/10 đến hết Thứ Tư 07/10" thay 18 ô "—". Có ít nhất một đơn vị đã báo cáo → bảng đầy đủ như cũ.
- **Không làm:** đổi bảng thành thẻ (UX-D7), thêm bộ lọc chi nhánh (`don-ma-thua-quyen` mục 9 — cần quyết riêng).

## L3. Quản trị hệ thống › Tài khoản: lọc và phân loại giáo viên theo chi nhánh
Chủ sản phẩm: "tạm thời cho tôi xem, lọc được ở phần quản trị hệ thống". Dữ liệu đã có sẵn ở `/admin/accounts` (`roles[{role, branchCode, branchName}]`,
`skills`, `status`) → **lọc ở trình duyệt, không đổi máy chủ.**
- **Bộ lọc** (hàng mới ngay dưới tiêu đề thẻ "Tài khoản", cạnh `BoLocDoan` Đang dùng / Đã xoá):
  - **Chi nhánh:** Tất cả · từng chi nhánh (Monbay, Bãi Cháy, Cẩm Phả, Uông Bí, Hải Dương, Tutor part-time) · Toàn hệ thống.
  - **Vai trò:** Tất cả · Giáo viên · Quản lý · Admin CN · Quản trị hệ thống (lấy từ `ROLES`/`roleLabel`).
  - **Kỹ năng:** Tất cả · L · R · W · S (từ `skills`, dùng `skillLabel`).
  - **Tìm:** tên, mã, email.
  - **Nhóm theo:** Không nhóm · Chi nhánh · Vai trò (mặc định Không nhóm). Nhóm theo chi nhánh có tiêu đề + số người (dùng `HangNhom`); người mang vai ở 2 chi nhánh xuất hiện ở cả 2 nhóm.
  - Nút "Xoá lọc" khi có bộ lọc; tiêu đề thẻ ghi `Tài khoản (n / tổng)`.
- **Luật khớp (quan trọng):** Vai trò + Chi nhánh phải khớp **cùng một lần cấp vai** (vd. "Giáo viên" + "Monbay" = ai có vai giáo viên **ở Monbay**,
  không phải "có vai giáo viên ở đâu đó và có vai gì đó ở Monbay"). Vai ghi "Toàn hệ thống" (`branchCode` null) chỉ khớp lựa chọn "Toàn hệ thống" hoặc "Tất cả".
- **Cách làm:** một hàm thuần `locTaiKhoan(rows, {chiNhanh, vai, kyNang, q})` đặt ở `shared/domain` (hoặc cạnh `AccountsAdmin`), có phép kiểm trong
  `server/src/tests/` (mẫu `prUxG.tests.ts`). Bộ lọc nhớ trong URL query (`?cn=MB&vai=teacher`) để chủ sản phẩm gửi link cho nhau; không lưu vào máy chủ.
- **Phân loại nhanh (chip, không nút to):** "Chưa có vai trò" · "Chưa có email" · "Chưa có kỹ năng" — để thấy tài khoản còn thiếu. Đếm cạnh chip.
- **Không làm:** xuất Excel, sửa hàng loạt, đổi quyền theo nhóm (nếu cần, báo riêng). Không đổi `/admin/accounts`.
- **Tiêu chí:** (1) lọc Giáo viên + Monbay trả đúng số GV Monbay trên dữ liệu seed; (2) người 2 chi nhánh hiện ở cả hai nhóm khi nhóm theo chi nhánh, đếm đúng;
  (3) lọc rỗng hiện "Không có tài khoản nào khớp" + nút Xoá lọc; (4) 375 px bộ lọc xuống dòng, bảng vẫn cuộn trong khung.

## Prompt cho session code

```
/ponytail lite

Làm PR-L1 trong docs/superpowers/plans/2026-10-03-pr-l1-popover-bao-cao-loc-gv.md: ba mục L1, L2, L3. Nhánh mới từ main: pr-l1-popover-bao-cao-loc-gv.
Đọc trước: CLAUDE.md, mục 0 của kế hoạch, thiet-ke/HE_GIAO_DIEN.md.

- L1: MissingBadge.tsx — vẽ popover bằng createPortal + position fixed (mẫu BangHocVienLop.tsx), lật lên khi thiếu chỗ, đóng khi bấm ngoài/Esc/cuộn,
  bỏ title của nút khi đang mở. Xác nhận nguyên nhân bằng DevTools trước khi sửa. impeccable `harden`.
- L2: MeetingPage.tsx:114-126 — thanh điều khiển một hàng, Kỳ dùng BoLocDoan, ba số thành chip lọc rõ trạng thái (hoặc bỏ kiểu nút nếu không lọc được),
  tuần chưa có báo cáo thì một dòng thay 18 ô "—". Dưới 640 px giữ nguyên. impeccable `layout` + `clarify`.
- L3: AccountsAdmin.tsx — bộ lọc Chi nhánh / Vai trò / Kỹ năng / Tìm / Nhóm theo + chip phân loại, lọc ở trình duyệt, hàm thuần `locTaiKhoan` có phép kiểm,
  khớp vai + chi nhánh trên CÙNG một lần cấp vai, trạng thái lọc trong URL query. Không đổi máy chủ.

Cách làm và kiểm:
1. Mục có logic (L3) viết phép kiểm trước (đỏ). L1/L2 kiểm bằng ảnh.
2. `npm run check` xanh.
3. `npm run seed && npm run dev`, chụp 1440 và 375, sáng và tối: Học viên & Lớp (mở badge ở hàng đầu/giữa/cuối), Công việc › Báo cáo đơn vị
   (tuần chưa có báo cáo và tuần có báo cáo), Quản trị › Tài khoản (không lọc, Giáo viên + Monbay, nhóm theo chi nhánh).
4. 375 px: không tràn ngang, vùng bấm ≥ 40 px.
5. `/impeccable audit` cho các màn đã sửa, rồi `/ponytail-review`.

Xong thì: đánh dấu [x] ở file kế hoạch, thêm một dòng vào mục 14 của plan.md, mở PR (không tự merge), liệt kê chú thích `ponytail:`,
báo ảnh sổ tay nào trong docs/so-tay/ bị lệch.
```
