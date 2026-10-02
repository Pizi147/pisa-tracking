# UX sau critique toàn web 02/10 — Kế hoạch (CHƯA LÀM, chờ chủ sản phẩm chọn gói)

> **Nguồn:** `/impeccable critique` (session planning 02/10/2026) trên dữ liệu demo 14/09. Hai đánh giá độc lập:
> A: soát thiết kế, khoảng 75 ảnh 1440/375; B: bộ dò `impeccable detect` + overlay trình duyệt trên 11 trang/panel.
> **Điểm Nielsen: 26/40** (26/09 là 24/40). Bộ dò tĩnh sạch (0 lỗi). Overlay trình duyệt bắt: chữ 11–11,5 px, nút nhỏ hơn 40 px
> trên điện thoại, badge không đồng nhất.
> **Chưa phủ:** giao diện sáng (ảnh chụp đều ra tối), các panel Ghi vi phạm · Giao việc · Chuyển lớp · thân Case drawer
> (B mở được Ghi vi phạm và Giao việc, A thì chưa), `/giao-vien/:id`, `/ho-so-ca-nhan`, `/hoc-vien/luu-tru`.
> Session code bấm thử các màn này ở bước `audit`.
>
> **Quan hệ với kế hoạch 26/09** (`2026-09-26-ux-sau-danh-gia.md`): mục nào trùng thì làm theo kế hoạch 26/09, file này
> chỉ ghi những gì **vẫn còn** sau các PR UXD/UXF/Dọn-b/S3, hoặc mới thấy.

## 0. Luật chung
- Tinh chỉnh, không làm lại: giữ phông Be Vietnam Pro, bảng màu, bố cục, mã tuần `W2 OCT` (CLAUDE.md).
- Thang SOS và kiểu "tạm thời" (viền đứt + chữ "tạm thời") đã chốt 26/09, xem `thiet-ke/HE_GIAO_DIEN.md` §2, §5.
- Nút huỷ theo luật S3: không dùng "Huỷ" trần; form có thay đổi thì dùng "Huỷ thay đổi" (như Dọn-b 15).
- Mỗi gói: phép kiểm trước (đỏ) → sửa → `npm run check` → ảnh 1440/375 sáng/tối → `/impeccable audit` → `/ponytail-review`.

## Gói UX-G — Trạng thái nói đúng, một màu một nghĩa · ƯU TIÊN 1 (P1)
- [ ] **G1. SOS tạm thời mất chữ "tạm thời" ở hồ sơ HV.** Bùi Thảo Vy: ở hồ sơ lớp là `SOS 1 tạm thời`; ở ô "Kết quả gần nhất"
  và banner "MT3 SOS 1: đang hỗ trợ Speaking" của hồ sơ HV lại là `SOS 1` đặc (mới có điểm 1/4 phần).
  Sửa: cho ô và banner đi qua `<KetQuaDot>`. File: `web/src/modules/students/DauHoSo.tsx:223`, `shared/domain/hoSoHocVien.ts:204`.
  Phép kiểm: hồ sơ HV có lượt chưa đủ 4 kỹ năng thì không được trả nhãn SOS mà thiếu `tamThoi`.
- [ ] **G2. Một trạng thái, một màu.** Có một bảng trạng thái → tone duy nhất trong `web/src/ui/Nhan.tsx`, mọi chỗ khác tra bảng này:
  - "Chờ chấm" (tím `wait`) và "Chờ bạn chấm" (vàng `soon`) ở `web/src/modules/test/lichTest/KhoiNo.tsx:32-33` dùng chung một tone.
  - "x chờ duyệt" ở danh sách lớp và đầu hồ sơ lớp đang màu xanh dương, trong khi xanh dương nghĩa là "đang chạy". Đổi sang tone chờ.
  - Mức độ Case "Bình thường" ở Tổng quan GV đang là chip vàng. Đổi sang trung tính.
  - "Cần làm" trên yêu cầu bị từ chối ("Yêu cầu của tôi") đổi thành "Bị từ chối".
- [ ] **G3. Thông báo dùng giờ thật thay vì ngày nghiệp vụ.** Thông báo hiện `02/10 22:57` trong khi ngày demo là 14/09.
  Sửa theo `web/src/ui/ngayNghiepVu.ts`. Đồng thời sửa chữ "Tạo task cho TVV trên Base…" thành
  "Nhờ TVV báo phụ huynh (4 nội dung), xong thì đánh dấu đã làm".
  File: `web/src/modules/platform/Header.tsx:17-21`, `server/src/yThuc/phoiHop.ts:130`, `server/src/worklist/mywork.ts:157`.
- [ ] **G4. Lịch Test bị cắt cột thao tác.** Nút "Nhập điểm" bị cắt mép phải ở 1440 và ở thẻ 375, vì bảng rộng hơn
  `card overflow-hidden`. Sửa: cột "GV chấm" có max-width và cho xuống dòng; cột thao tác luôn nằm trong khung.
  File: `web/src/modules/test/lichTest/KhoiNo.tsx:80, 126`.
- [ ] **G5. Ý thức khi 0 vi phạm.** Tab vẫn hiện hai nút chính "Xác nhận xử lý" và "Đề xuất QL duyệt", và ô "Chưa xử lý lần nào"
  đọc như cảnh báo. Sửa: ẩn hai nút khi không có vi phạm mở; ô ghi "Không có vi phạm".
  File: `web/src/modules/yThuc/StudentYThucSection.tsx`, `shared/domain/hoSoHocVien.ts:289`.
  ⚠ Đối chiếu quyết định 02/10 (commit `cec29ba`: "xử lý được cả khi mới 1 vi phạm"): chỉ ẩn khi **0** vi phạm.

## Gói UX-H — Badge một họ · ƯU TIÊN 2 (P2)
Hiện có hai họ badge: `Nhan` (bo tròn hẳn, đậm 700, không viền, `ui/Nhan.tsx:26`) và `NhanTrangThai`/ClassRoster/MissingBadge
(bo `rounded-md`, 600, có viền, `ui/ui.tsx:525`, `students/ClassRoster.tsx:285`, `students/MissingBadge.tsx:32`).
Cỡ chữ có 4 mức (11 / 11,5 / 12 / 12,5 px) và 3 chiều cao dòng cho cùng một chip "Quá hạn"/"Cần làm".
- [ ] **H1.** Chủ sản phẩm chốt (câu hỏi Q-H): chỉ giữ `Nhan`, hay giữ hai họ có nghĩa riêng (trạng thái và thuộc tính)?
- [ ] **H2.** Gom các chip làm riêng lẻ về họ đã chốt:
  - `test/lichTest/KhoiNo.tsx:91` · `test/LichTestTab.tsx:272`
  - `giaoVien/HoSoGiaoVienPage.tsx:168,175`
  - `students/ChuongLop.tsx:143`
  - `phanTich/HieuQuaPa.tsx:119,129` · `phanTich/TongHopTestSos.tsx:152`
  - `worklist/MeetingPage.tsx:320`
  - `ui/HangNhom.tsx:67` · `ui/HangTab.tsx:33` · `App.tsx:49`
  - `yThuc/NhanViPham.tsx:42` · `ui/ui.tsx:115,195,215,249`
- [ ] **H3.** Bỏ dấu "·" thừa ở đầu badge Mock Test: "· Chưa có điểm · 0/4 kỹ năng".
- [ ] **H4.** Nhãn nhóm "Báo QL / Học thuật / Ý thức" ở Chờ duyệt đang trông như nút (viền xám giống nút thao tác). Đổi sang chip không viền.
- [ ] **H5.** Chú giải Đạt/SOS1/2/3/Tạm thời ở Phân tích: nếu là chú giải thì không có kiểu nút; nếu là bộ lọc thì có trạng thái bật/tắt rõ ràng.
- [ ] **H6.** Chip "+1" ở dòng lớp đang giấu việc (desktop chỉ hiện khi rê chuột): bấm vào thì mở được danh sách.

## Gói UX-I — Panel và form · ƯU TIÊN 3 (P2)
- [ ] **I1.** Nút ở chân panel: "Đóng" khi form chưa sửa, "Huỷ thay đổi" khi đã sửa (luật S3).
  File: `ui/KhungPanel.tsx:88` (mặc định), `ui/Drawer.tsx:49`. Áp cho Tạo Case, Thêm học viên, Từ chối inline.
- [ ] **I2. Tạo Case:**
  - Không chọn sẵn "Mức độ: Bình thường".
  - "Nhóm nguyên nhân" có placeholder "Chọn nhóm".
  - Kỹ năng ghi W1/W2, không ghi W.
  - "Bắt đầu theo dõi" dùng bộ chọn tuần, không dùng ngày `14/09/2026`.
- [ ] **I3. Thêm học viên:**
  - Cột "OVERAL…" bị cắt chữ; placeholder "dd/mm/yyy" bị cắt.
  - Ô dán đang dùng phông monospace.
  - Nút "Đọc nội dung đã dán" chuyển xuống dưới ô dán.
  - Lời nhắc khoảng 100 chữ cạnh "+ Thêm dòng" tách thành 2 dòng ngắn.
- [ ] **I4.** Chuyển nốt các panel còn dùng `Drawer` sang `KhungPanel`: GvCham, ScoreEntry, MockDetail, HopThaoTacMt, NhanXet,
  DeleteViolationConfirm, StudentDetailPage. Chỉ đổi khung, giữ nguyên hành vi.
- [ ] **I5. Hồ sơ Mock Test:**
  - Ô "vắng · dời sang W3 SEP · lần 1" khi đang xem W3 SEP đổi thành "Thi bù tuần này (lần 1)".
  - Placeholder nhận xét "Không bắt buộc" (`fasttrack/NhanXet.tsx:109`) đổi thành câu ví dụ.
- [ ] **I6. Panel Ghi vi phạm:**
  - Xem `<li class=inline-flex>` bị dính mép trên.
  - Chữ "(bắt buộc)" lặp 3 lần: dùng dấu `*` kèm một dòng chú thích.

## Gói UX-J — Chữ · ƯU TIÊN 4 (P2–P3, đối chiếu `thiet-ke/TU_DIEN_VA_CHU.md`, `THUAT_NGU_DA_CHOT.md`)
- [ ] **J1. "Thiếu" đang có hai nghĩa:** thiếu thông tin hồ sơ ("Thiếu 2 thông tin") và dưới kỳ vọng ("thiếu 2" cạnh 5.0).
  Sửa vế dưới kỳ vọng thành "dưới KV 2" hoặc chỉ dấu ▾.
- [ ] **J2. Mã học viên có hai dạng:** `000048` ở bảng lớp, `PISA-000048` ở hồ sơ và ở bảng nhập điểm. Dùng một dạng.
- [ ] **J3.** Cột "Cần xử lý" ở Tổng quan QL trộn "quá hạn từ W1 SEP" với "quá hạn 7 ngày". Dùng một cách ghi.
- [ ] **J4. Bỏ lời giải thích viết cho người làm app** ở Tổng quan QL ("Gộp hai khung · …", "Chỉ phần số đổi theo khung · …"),
  hoặc chuyển vào ⓘ.
- [ ] **J5.** Dòng tóm tắt Chờ duyệt "gồm 9 Báo QL (1 Mini Test chưa đạt, 2 Case…)" đổi thành hàng chip đếm.
- [ ] **J6. Cột "TARGET"** (chữ hoa, tiếng Anh) ở Học viên & Lớp đổi thành "Mục tiêu".
- [ ] **J7.** Bỏ chữ "Bạn" lặp ở mỗi dòng (31 việc) của Tổng quan GV.
- [ ] **J8.** Chữ bị cắt mất nghĩa: "Ghi kết q…" (Theo dõi ở trang lớp), "Cao Khánh Linh, Lê …", "L, R, W1, W…". Cho xuống dòng
  hoặc rút gọn có chủ đích kèm title.
- [ ] **J9.** Làm rõ "Xác nhận PA Tutor · đến lúc thi"; nút "– sửa" ở Nhập điểm; tiêu đề cột S "GV chấm: Tôi ⌄".
- [ ] **J10.** Chi tiết nhỏ:
  - Cột "Quyền cấp riêng" ở Quản trị toàn "—": ẩn khi rỗng.
  - Ô "—" kèm chữ "chưa có dữ liệu" ngay dưới "chưa có điểm" ở hồ sơ HV đang nói một ý hai lần.

## Gói UX-K — Mật độ, bộ lọc, điện thoại · ƯU TIÊN 5 (P2–P3)
- [ ] **K1. Bộ lọc Học viên & Lớp:**
  - Hai hàng "Tất cả" khác kiểu (dạng chia đoạn `Tất cả 19` và dạng viên thuốc `Tất cả 95`): gộp thành một hàng, thêm dropdown "Loại lớp".
  - Trên điện thoại, hàng chip trôi khỏi màn và nút ⋯ rơi xuống dòng riêng.
- [ ] **K2. Phân tích › Tổng hợp:**
  - Tiêu đề cột bị cắt ("TẠM THỜ", "CHƯA ĐI"); ô "16 (1 quá hạn)" xuống dòng. Sửa: tiêu đề nhóm gọn và dính trên, ghi "16 ⚠1".
  - Có hơn 15 nút điều khiển: gom "Cột hiện" và hai nút xuất vào menu ⋯.
- [ ] **K3. Vùng bấm trên điện thoại ≥ 40 px** (đo ở 375 px):
  - `.btn-sm` (28 px), nút ⋯ (28×28).
  - Link tên học viên ở /test và /nhap-diem (20 px); số bấm được ở Tổng quan (10–20×24).
  - Tab Phân tích (32 px); `.field`/select (36–37 px).
  - Chỉ áp ở màn nhỏ (`max-sm:`), giữ mật độ desktop.
- [ ] **K4.** Nút "Vắng" ở bảng nhập điểm điện thoại ghi ngay một chạm: thêm Hoàn tác trong toast (đối chiếu UX-C 26/09).
- [ ] **K5.** Demo bar cộng header chiếm khoảng 125 px trên điện thoại: thu demo bar thành một dòng hoặc cho gập. Chỉ ảnh hưởng bản demo.
- [ ] **K6.** Chữ 11 px: overlay đếm khoảng 300 chỗ `text-[11px]`. Không sửa đại trà. Chỉ nâng lên 12 px với chữ mang nội dung (meta
  dòng, nhãn ô), giữ 11–11,5 px cho tiêu đề cột và badge. Cần chủ sản phẩm chốt (Q-K).
- [ ] **K7.** Icon ⋯ ngang và ⋮ dọc đang dùng lẫn: dùng một loại.

## Ghi nhận tốt (giữ nguyên, đừng làm lại)
- Tổng quan QL, khối "Cần xử lý": quá hạn lên đầu, có cột người phụ trách, mỗi dòng một nút.
- Nhập điểm điện thoại "một kỹ năng một lúc"; Từ chối inline bắt buộc lý do.
- Thông báo điện thoại có nhóm "Cần làm" và "Đánh dấu đã đọc".
- Không tràn ngang ở 375 px trên mọi trang/panel đã đo.

## Câu hỏi cho chủ sản phẩm
- **Q-H:** Giữ một họ badge (`Nhan`) hay hai họ có nghĩa riêng?
- **Q-K:** Cỡ chữ tối thiểu cho chữ nội dung là 12 px?
- **Q-D:** 9/22 mục ở Chờ duyệt là "Không cần duyệt — để QL biết". Tách ra danh sách "Để QL biết" riêng không?
- **Q-B:** Chờ duyệt có cần "Duyệt nhiều" / "Nhắc tất cả" không?

## File → mục
| File | Mục |
|---|---|
| `ui/Nhan.tsx`, `ui/ui.tsx` | G2, H1–H2 |
| `students/DauHoSo.tsx`, `shared/domain/hoSoHocVien.ts` | G1, G5, J10 |
| `test/lichTest/KhoiNo.tsx` | G2, G4, H2 |
| `platform/Header.tsx`, `server/src/yThuc/phoiHop.ts`, `server/src/worklist/mywork.ts` | G3 |
| `ui/KhungPanel.tsx`, `ui/Drawer.tsx` | I1, I4 |
| `cases/*` (form Tạo Case) | I2 |
| `students/StudentsPage`, panel Thêm HV | I3, J6, K1 |
| `phanTich/*` | H5, K2 |
| `index.css` (`.btn-sm`, `.field`) | K3 |
