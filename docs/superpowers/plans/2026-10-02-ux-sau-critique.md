# UX sau critique toàn web 02/10 — Kế hoạch (chủ sản phẩm chọn làm CẢ 5 gói, 02/10)

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

## Gói UX-G — Trạng thái nói đúng, một màu một nghĩa · ƯU TIÊN 1 (P1) · ✅ XONG 02/10 (nhánh `claude/happy-dirac-8cxe3k`, phép kiểm `prUxG.tests.ts`, ảnh `thiet-ke/anh/ux-g/`)
- [x] **G1. SOS tạm thời mất chữ "tạm thời" ở hồ sơ HV.** Bùi Thảo Vy: ở hồ sơ lớp là `SOS 1 tạm thời`; ở ô "Kết quả gần nhất"
  và banner "MT3 SOS 1: đang hỗ trợ Speaking" của hồ sơ HV lại là `SOS 1` đặc (mới có điểm 1/4 phần).
  Sửa: cho ô và banner đi qua `<KetQuaDot>`. File: `web/src/modules/students/DauHoSo.tsx:223`, `shared/domain/hoSoHocVien.ts:204`.
  Phép kiểm: hồ sơ HV có lượt chưa đủ 4 kỹ năng thì không được trả nhãn SOS mà thiếu `tamThoi`.
- [x] **G2. Một trạng thái, một màu.** Có một bảng trạng thái → tone duy nhất trong `web/src/ui/Nhan.tsx`, mọi chỗ khác tra bảng này:
  - "Chờ chấm" (tím `wait`) và "Chờ bạn chấm" (vàng `soon`) ở `web/src/modules/test/lichTest/KhoiNo.tsx:32-33` dùng chung một tone.
  - "x chờ duyệt" ở danh sách lớp và đầu hồ sơ lớp đang màu xanh dương, trong khi xanh dương nghĩa là "đang chạy". Đổi sang tone chờ.
  - Mức độ Case "Bình thường" ở Tổng quan GV đang là chip vàng. Đổi sang trung tính.
  - "Cần làm" trên yêu cầu bị từ chối ("Yêu cầu của tôi") đổi thành "Bị từ chối".
- [x] **G3. Thông báo dùng giờ thật thay vì ngày nghiệp vụ.** Thông báo hiện `02/10 22:57` trong khi ngày demo là 14/09.
  Sửa theo `web/src/ui/ngayNghiepVu.ts`. Đồng thời sửa chữ "Tạo task cho TVV trên Base…" thành
  "Nhờ TVV báo phụ huynh (4 nội dung), xong thì đánh dấu đã làm".
  File: `web/src/modules/platform/Header.tsx:17-21`, `server/src/yThuc/phoiHop.ts:130`, `server/src/worklist/mywork.ts:157`.
- [x] **G4. Lịch Test bị cắt cột thao tác.** Nút "Nhập điểm" bị cắt mép phải ở 1440 và ở thẻ 375, vì bảng rộng hơn
  `card overflow-hidden`. Sửa: cột "GV chấm" có max-width và cho xuống dòng; cột thao tác luôn nằm trong khung.
  File: `web/src/modules/test/lichTest/KhoiNo.tsx:80, 126`.
- [x] **G5. Ý thức khi 0 vi phạm.** Tab vẫn hiện hai nút chính "Xác nhận xử lý" và "Đề xuất QL duyệt", và ô "Chưa xử lý lần nào"
  đọc như cảnh báo. Sửa: ẩn hai nút khi không có vi phạm mở; ô ghi "Không có vi phạm".
  File: `web/src/modules/yThuc/StudentYThucSection.tsx`, `shared/domain/hoSoHocVien.ts:289`.
  ⚠ Đối chiếu quyết định 02/10 (commit `cec29ba`: "xử lý được cả khi mới 1 vi phạm"): chỉ ẩn khi **0** vi phạm.

## Chia đợt H và K theo deploy (chủ sản phẩm chốt 02/10: cần deploy sớm)

| Đợt | Mục | Lý do |
|---|---|---|
| **TRƯỚC deploy** (PR-HK1) | **K3**, **K1**, **H3**, **H4**, **H5** | GV dùng điện thoại nhiều. K3/K1 là CSS gọn, rủi ro thấp; H3–H5 sửa nhỏ, ít file |
| **SAU deploy** | **H1/H2** | Gom ba kiểu badge đụng khoảng 15 file: rủi ro hồi quy lớn ngay trước deploy, làm lỗi thời 24 ảnh sổ tay QL/GV |
| **SAU deploy** | **K2, K5, K7** | K5 chỉ ảnh hưởng bản demo; K2, K7 là chỉnh bố cục, không gấp |
| **SAU deploy** | **K6** (chữ nội dung 11 → 12 px) | Cần chụp lại ảnh sổ tay |

Các mục sau deploy làm chung một đợt với việc chụp lại ảnh sổ tay (`docs/so-tay/`), để chỉ chụp lại một lần.

## Gói UX-H — Badge một họ · ƯU TIÊN 2 (P2)
Hiện có hai họ badge: `Nhan` (bo tròn hẳn, đậm 700, không viền, `ui/Nhan.tsx:26`) và `NhanTrangThai`/ClassRoster/MissingBadge
(bo `rounded-md`, 600, có viền, `ui/ui.tsx:525`, `students/ClassRoster.tsx:285`, `students/MissingBadge.tsx:32`).
Cỡ chữ có 4 mức (11 / 11,5 / 12 / 12,5 px) và 3 chiều cao dòng cho cùng một chip "Quá hạn"/"Cần làm".
- [ ] **H1. Ba kiểu chip, mỗi kiểu một nghĩa** (chủ sản phẩm chốt 02/10, Q-H):
  - **Tròn hẳn, nền đặc** (`Nhan`): trạng thái của học viên hoặc lớp (Cần chú ý, Tốt, Chờ chấm, SOS). Số tạm thì viền đứt (`dut`).
  - **Góc vuông bo nhẹ, viền liền** (`NhanTrangThai`): trạng thái của **việc** (Cần làm, Đang làm, Chờ duyệt, Quá hạn, Xong, Đã huỷ).
    ClassRoster `:285` và MissingBadge `:32` dùng chung kiểu này.
  - **Góc vuông, viền đứt khi tạm** (`KetQuaDot`): kết quả điểm. Giữ nguyên như đã chốt 26/09.
  - Cả ba thống nhất cỡ chữ 11,5 px và một chiều cao dòng (hiện có 4 cỡ và 3 chiều cao dòng).
- [ ] **H2.** Gom các chip làm riêng lẻ về họ đã chốt:
  - `test/lichTest/KhoiNo.tsx:91` · `test/LichTestTab.tsx:272`
  - `giaoVien/HoSoGiaoVienPage.tsx:168,175`
  - `students/ChuongLop.tsx:143`
  - `phanTich/HieuQuaPa.tsx:119,129` · `phanTich/TongHopTestSos.tsx:152`
  - `worklist/MeetingPage.tsx:320`
  - `ui/HangNhom.tsx:67` · `ui/HangTab.tsx:33` · `App.tsx:49`
  - `yThuc/NhanViPham.tsx:42` · `ui/ui.tsx:115,195,215,249`
- [x] **H3.** Bỏ dấu "·" thừa ở đầu badge Mock Test: "· Chưa có điểm · 0/4 kỹ năng".
- [x] **H4.** Nhãn nhóm "Báo QL / Học thuật / Ý thức" ở Chờ duyệt đang trông như nút (viền xám giống nút thao tác). Đổi sang chip không viền.
- [x] **H5.** Chú giải Đạt/SOS1/2/3/Tạm thời ở Phân tích: nếu là chú giải thì không có kiểu nút; nếu là bộ lọc thì có trạng thái bật/tắt rõ ràng.
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
- [x] **J5.** (PR-GVb) Dòng tóm tắt Chờ duyệt "gồm 9 Báo QL (1 Mini Test chưa đạt, 2 Case…)" đổi thành hàng chip đếm.
- [x] **J5b. Tách "Để QL biết" khỏi Chờ duyệt** (PR-GVb) (chủ sản phẩm chốt 02/10, Q-D). Các mục "Không cần duyệt — để QL biết"
  (9/22 trong demo) chuyển sang một nhóm hoặc tab riêng "Để QL biết". Chờ duyệt chỉ còn mục có nút Duyệt, và badge đếm
  Chờ duyệt chỉ đếm những mục đó. Tìm file nguồn: `web/src/modules/duyet/*`, `server/src/` (nguồn danh sách duyệt).
  Phép kiểm: số trên badge Chờ duyệt bằng số dòng có nút Duyệt.
- [ ] **J6. Cột "TARGET"** (chữ hoa, tiếng Anh) ở Học viên & Lớp đổi thành "Mục tiêu".
- [ ] **J7.** Bỏ chữ "Bạn" lặp ở mỗi dòng (31 việc) của Tổng quan GV.
- [ ] **J8.** Chữ bị cắt mất nghĩa: "Ghi kết q…" (Theo dõi ở trang lớp), "Cao Khánh Linh, Lê …", "L, R, W1, W…". Cho xuống dòng
  hoặc rút gọn có chủ đích kèm title.
- [ ] **J9.** Làm rõ "Xác nhận PA Tutor · đến lúc thi"; nút "– sửa" ở Nhập điểm; tiêu đề cột S "GV chấm: Tôi ⌄".
- [ ] **J10.** Chi tiết nhỏ:
  - Cột "Quyền cấp riêng" ở Quản trị toàn "—": ẩn khi rỗng.
  - Ô "—" kèm chữ "chưa có dữ liệu" ngay dưới "chưa có điểm" ở hồ sơ HV đang nói một ý hai lần.

## Gói UX-K — Mật độ, bộ lọc, điện thoại · ƯU TIÊN 5 (P2–P3)
- [~] **K1. Bộ lọc Học viên & Lớp:** (PR-HK1 xong phần điện thoại; gộp dropdown "Loại lớp" để sau deploy vì đổi giao diện desktop)
  - Hai hàng "Tất cả" khác kiểu (dạng chia đoạn `Tất cả 19` và dạng viên thuốc `Tất cả 95`): gộp thành một hàng, thêm dropdown "Loại lớp".
  - [x] Trên điện thoại, hàng chip trôi khỏi màn và nút ⋯ rơi xuống dòng riêng. (PR-HK1: mép mờ + khối nút)
- [ ] **K2. Phân tích › Tổng hợp:**
  - Tiêu đề cột bị cắt ("TẠM THỜ", "CHƯA ĐI"); ô "16 (1 quá hạn)" xuống dòng. Sửa: tiêu đề nhóm gọn và dính trên, ghi "16 ⚠1".
  - Có hơn 15 nút điều khiển: gom "Cột hiện" và hai nút xuất vào menu ⋯.
- [x] **K3. Vùng bấm trên điện thoại ≥ 40 px** (đo ở 375 px):
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
- **Q-H:** ĐÃ CHỐT 02/10: ba kiểu chip như H1.
- **Q-K:** ĐÃ CHỐT 02/10: 12 px cho chữ nội dung.
- **Q-D:** ĐÃ CHỐT 02/10: tách "Để QL biết" (J5b).
- **Q-B:** ĐÃ CHỐT 02/10 — **XONG ở PR-GVb** (nhánh `pr-gvb-cho-duyet`): duyệt nhiều ở tab Tất cả + "Chọn hết n" (cùng loại, ≤ 50), "Nhắc tất cả (n)" ở tab Để QL biết, không nhắc lặp trong ngày, kết quả một câu "Đã duyệt 7/9 — 2 không có quyền". Giới hạn còn lại (G5): Công việc › "Của GV" chưa có "Nhắc tất cả".

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
| `duyet/*` | H4, J5, J5b |
| `index.css` (`.btn-sm`, `.field`) | K3 |

## Prompt cho session code

### PR-HK1 — trước deploy (dán nguyên khối)
```
/ponytail lite

Làm PR-HK1 trong docs/superpowers/plans/2026-10-02-ux-sau-critique.md: các mục K3, K1, H3, H4, H5. CHỈ năm mục này.
Đây là đợt trước deploy, nên giữ diff nhỏ và rủi ro thấp. Không đụng H1/H2, K2, K5, K6, K7 (để sau deploy).
Nhánh mới từ main: pr-hk1-dien-thoai-badge.

Đọc trước: CLAUDE.md, mục "0. Luật chung" và "Chia đợt H và K theo deploy" trong file kế hoạch, thiet-ke/HE_GIAO_DIEN.md.

Việc cần làm:
- K3: trên điện thoại, mọi vùng bấm cao ít nhất 40 px. CHỈ dùng `max-sm:`, desktop giữ nguyên mật độ. Gồm:
  - `.btn-sm`, nút ⋯ (đang 28×28)
  - `.field` và select (đang 36–37 px)
  - tab Phân tích (đang 32 px)
  - link tên học viên ở /test và /nhap-diem (đang 20 px), số bấm được ở Tổng quan (10–20×24)
  Ưu tiên sửa ở index.css. Link nằm trong chữ thì nới vùng bấm bằng padding hoặc pseudo-element, không đổi bố cục.
- K1 (Học viên & Lớp):
  - Ở 375 px, hàng chip lọc không được trôi khỏi màn: cho cuộn ngang có mép mờ, hoặc xuống dòng.
  - Nút ⋯ không được rơi xuống dòng riêng.
  - Phần gộp hai hàng "Tất cả" thành dropdown "Loại lớp" chỉ làm nếu diff nhỏ. Nếu lớn thì ghi lại để sau deploy.
- H3: bỏ dấu "·" thừa ở đầu badge Mock Test ("· Chưa có điểm · 0/4 kỹ năng").
- H4: nhãn nhóm "Báo QL / Học thuật / Ý thức" ở Chờ duyệt chuyển sang chip không viền, để không trông như nút.
- H5: chú giải Đạt/SOS1/2/3/Tạm thời ở Phân tích. Kiểm xem đó là chú giải hay bộ lọc:
  - là chú giải thì bỏ kiểu nút;
  - là bộ lọc thì có trạng thái bật/tắt rõ ràng (aria-pressed).

Cách làm và kiểm:
1. Mục nào có logic thì viết phép kiểm trước. Riêng CSS thì kiểm bằng ảnh và đo kích thước.
2. `npm run check` phải xanh.
3. `npm run seed && npm run dev`, chụp ảnh 375 và 1440, sáng và tối, ở: Tổng quan, Học viên & Lớp, /test, /nhap-diem,
   Chờ duyệt, Phân tích, Mock Test.
4. Đo bằng Playwright ở 375 px: không phần tử bấm được nào cao dưới 40 px (bỏ qua demo bar), không tràn ngang.
5. Ảnh 1440 phải giống trước khi sửa, trừ H3–H5.
6. `/impeccable audit` cho các màn đã sửa, rồi `/ponytail-review`.

Xong thì:
- đánh dấu [x] trong file kế hoạch, thêm một dòng vào mục 11 của plan.md;
- mở PR, không tự merge, liệt kê chú thích `ponytail:`;
- báo cho chủ sản phẩm: ảnh sổ tay nào trong docs/so-tay/ bị lệch vì đợt này.
```

### PR-HK2 — sau deploy (H1/H2, K2, K5, K6, K7)
```
/ponytail lite

Làm PR-HK2 trong docs/superpowers/plans/2026-10-02-ux-sau-critique.md: các mục H1, H2, K2, K5, K6, K7, cộng phần K1 còn lại
nếu PR-HK1 đã hoãn. Chỉ làm sau khi bản chính đã deploy. Nhánh mới từ main: pr-hk2-badge-chu.
Đọc trước: CLAUDE.md, mục 0 và các mục trên trong file kế hoạch, mục "Câu hỏi cho chủ sản phẩm" (Q-H ba kiểu badge, Q-K chữ 12 px), plan.md mục 3–4,
thiet-ke/HE_GIAO_DIEN.md.

- H1/H2: ba kiểu chip đã chốt.
  - Tròn đặc (`Nhan`): trạng thái học viên/lớp.
  - Vuông viền liền (`NhanTrangThai`): trạng thái việc.
  - `KetQuaDot`: kết quả điểm, giữ nguyên.
  - Cả ba cùng cỡ 11,5 px và một chiều cao dòng. Gom các chip làm riêng lẻ liệt kê ở H2.
  - Thêm phép kiểm quét mã: không còn `rounded-full` làm badge ngoài ui/Nhan.tsx.
- K6: chữ nội dung tối thiểu 12 px; tiêu đề cột và badge giữ 11–11,5 px. Sửa theo từng file, không thay hàng loạt.
- K2: Phân tích bị cắt tiêu đề cột; ô "16 (1 quá hạn)" đổi thành "16 ⚠1"; gom "Cột hiện" và nút xuất vào menu ⋯.
- K5: demo bar trên điện thoại còn một dòng hoặc gập được.
- K7: dùng một kiểu icon ⋯ ở mọi chỗ.

Kiểm như PR-HK1 (check, ảnh 1440/375 sáng/tối, audit, ponytail-review). Chụp lại toàn bộ ảnh sổ tay QL/GV trong
docs/so-tay/ trong cùng PR. Đánh dấu [x], thêm dòng mục 11 plan.md, mở PR, không tự merge.
```
