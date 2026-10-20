# v4c — Kiểm định toàn web vòng 4: bảng phủ · ma trận trạng thái · hành trình theo vai · chữ so bản deploy (21/10/2026)

Người làm: agent v4c (Opus 5.5). **CHỈ ĐÁNH GIÁ** — không sửa repo, không git, không lưu gì trên demo.
Web demo `http://localhost:5173` (ngày demo 14/09/2026), mã = `main` của worktree `plan-ux-danh-gia`.
Công cụ riêng `NEW\chup\v4c-chup.mjs` = bản chép `chup.mjs` + **chặn mọi request ghi ở tầng trình duyệt** (POST/PUT/PATCH/DELETE tới `/api/` trả 503, trừ đăng nhập demo
và `POST /api/intake/preview` — máy chủ ghi rõ "Vẫn không ghi gì", `server/src/routes/index.ts:1584`) + bước giả lập mạng chậm / lỗi 500 / 401 / mất mạng **chỉ trong trình duyệt của tôi**.
Nhật ký: 3 lần bị chặn (2 lần `PATCH /api/me/profile` khi mở `/huong-dan` — ghi "đã xem"; 1 lần preview trước khi mở ngoại lệ). **0 request ghi tới máy chủ.**
Ảnh: `NEW\anh\v4c\` (183 ảnh, nhật ký `index.jsonl`) · số đo: `NEW\do\v4c\` · script: `NEW\chup\v4c-*`.
NEW = `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad`.
Mã cũ dẫn theo tài liệu chính + phụ lục (A1-, CV-, A3-, TST-, A5-, A7-, B-, V2A-, V2B-, V3A-, V3B-, 10.x, 11.x, 12.x). Mã mới của vòng này: **V4C-01…V4C-14**.
Phân loại theo master prompt: (A) đã chốt · (B) chủ SP đề xuất chưa chốt · (C) PTA đề xuất · (D) lỗi đã xác nhận · (E) cần kiểm chứng · (F) xung đột / chưa rõ.

---

## Tóm tắt 10 dòng

1. **Bảng phủ:** 17 route sản phẩm + 10 đường cũ chuyển hướng + 1 route dev; **~75 panel / hộp / menu** (63 tệp `KhungPanel`, 10 hộp nổi, 2 bản menu ⋯, 9 hộp `Modal`/`ConfirmDialog`). Trước vòng này **~24 mục chưa rà hoặc chỉ có ảnh không nhận xét**; vòng này rà thêm **31 mục** (ảnh 1440 tối + 375 sáng), còn **9 mục cần dữ liệu / ảnh bản chính** (mục 1.4).
2. **Lệch luật đã chốt (D, P1):** GVCN lưu xử lý vi phạm **không sinh việc nào cho TVV**; TVV **không có trang Công việc** — hạn "5 ngày" hiện là của GVCN ("GVCN ghi 'Đã thực hiện' trong 5 ngày"). Luật 1 + 2 chưa có chỗ trong giao diện (V4C-01).
3. **Hover vô hình (D, P2 — chủ SP II.6):** đo lại sau khi ghép nền từng ô: hàng học viên ở Học viên & Lớp **ΔL hiển thị 0** (ô `td` có nền riêng che hover của `tr`), hàng lớp bấm được **0**, đầu khối Công việc / Lịch Test **0**, chip lọc **0** — nặng hơn số v1 (3,6) vì v1 đo `tr`, không đo ô (V4C-02).
4. **Hai bản menu ⋯ khác hành vi phím (D, P2):** menu ⋯ hồ sơ HV không đưa focus vào mục, ↓ không chạy, Esc làm **mất focus**; menu ⋯ bảng thì đúng (V4C-03).
5. **"Đang chọn" 5 dáng** (nền / ✓ trong / huy hiệu ✓ góc bị cắt / gạch dưới / viền trong 2 px **trùng màu, trùng độ dày vòng focus**) (V4C-04). **Ô nhập tuần 4 dáng**, một dáng là hàng chip "Ngay hôm nay · W4 SEP · W1 OCT…" gần luật cấm 06/10 (V4C-05).
6. **Màn chưa ai rà có lỗi thấy được:** tab **Hành trình** vẽ một hành trình **3 lần** + chú giải 9 ký hiệu, 375 **cắt chữ** trong trục tuần (V4C-06); "Lộ trình tiếp theo" một em **đổi trang** + hộp giữa màn (V4C-07); ngăn Case hiện **mã thô `teacher_change_request`** (V4C-08); cùng màn lớp kết thúc, **70 % tô vàng ở Tổng kết, đỏ ở lưới** (V4C-09).
7. **Trạng thái hệ thống:** đang tải / lỗi / mất mạng làm **tốt** (giữ dữ liệu cũ + toast Thử lại, dải "Mất kết nối"); yếu ở **"không tìm thấy"** (chữ đỏ + Thử lại vô ích, không lối về), đường sai **về trang đầu im lặng**, Head tutor mở `/hoc-vien` thấy khung rỗng (V4C-10); lưu có **3 cách báo** khác nhau (V4C-11).
8. **Hành trình theo vai (XV):** 9 vai × 10 hành trình (mục 4). Điểm nghẽn chung: **một thẻ duyệt có 5 nơi duyệt**; QL/QT **không có chỗ xem "ai còn nợ điểm"** một bấm; TVV / CX / Head tutor mở trang đầu thấy **ô số 0 hoặc trang rỗng** — người mới không biết làm gì.
9. **Chữ so bản deploy (III.2):** đo nét chữ ảnh `5.webp` (tỉ lệ ảnh ×1,27 suy từ chữ menu 14 px) ↔ DOM `main`, cùng lưới lớp thường: tên HV **~14 → 13 px**, điểm **~14 → 13**, tiêu đề cột **11 IN HOA → 12 thường** (chữ thường thấp hơn ~27 %), dòng phụ / chip **giữ 12 / 11,5**. Lưới này **81 % ký tự ≤ 12,5 px**. → **Xác nhận 10.1 "đúng một phần"**, bổ sung số cho lưới Test.
10. **Đề xuất:** một hệ trạng thái **HTT-1…12** (mục 3.3, nối 10.1), sửa mâu thuẫn "đang chọn" giữa 10.1 và phụ lục v1 C2; **2 câu hỏi** cho chủ SP (việc TVV đặt ở đâu; hàng chip tuần có tính là hàng nút bị cấm 06/10 không) — còn lại PTA tự quyết.

---

## 1. Bảng phủ toàn web

Nguồn kiểm kê: router `web/src/App.tsx:234-265`, `shared/domain/dieuHuong.ts` (KHU_VUC, tab, `duongMoi`), `server/src/platform/nav.ts` (cờ theo quyền),
quét mã `NEW\chup\v4c-kiemke.cjs` → `NEW\do\v4c\kiemke.tsv` (mọi tệp có `<KhungPanel`, `<Modal`, `<ConfirmDialog`, `role="dialog"`, `<MenuDong`, `<Menu`, lịch, `createPortal`, `window.confirm`),
và đếm từ khoá trong 15 phụ lục `NEW\chup\v4c-tukhoa.cjs` → `NEW\do\v4c\tukhoa.tsv`.
**Ký hiệu cột "Đã rà":** a1…a7, b, v1 (nền chung / tổng quan), v2a, v2b, v3a, v3b = phụ lục; **"ảnh"** = chỉ có ảnh trong phạm vi, không nhận xét; **—** = chưa ai rà. Cột **v4c** = ảnh của vòng này (id trong `NEW\anh\v4c\`).

### 1.1 Vai có thật trong hệ thống

| Vai (mã) | Người demo | Trang đầu | Menu thấy |
|---|---|---|---|
| Quản trị hệ thống `system_admin` (QT) | 1 | `/` "Việc hôm nay" | Tổng quan · HV&Lớp · Test · Phân tích · Công việc · Tutor + Quản trị (menu tài khoản) |
| Quản lý `manager` (QL) | 2–6 (1/chi nhánh) | `/` "Việc hôm nay" | như QT, không Quản trị |
| Giáo viên `teacher` — GVBM | 8, 17–21 | `/cong-viec` (tự mở việc đầu) | HV&Lớp · Test · Công việc |
| — GVCN (suy ra từ `is_core`) | 7 (MB FT 101), 10 (102/103/104) | như GVBM | như GVBM + quyền lớp mình |
| — GV Speaking chấm chéo (`lopFtChoGvSpeaking`) | 9 (S, MB + BC) | `/cong-viec` mở "Chấm Speaking" | như GVBM |
| Admin văn phòng `office_admin` | 22 (CP) | `/` "Mock Test" | Tổng quan · HV&Lớp · Test · Phân tích · Công việc (chỉ Chấm điểm) |
| Tư vấn viên `consultant` (TVV) | 23 (CP) | `/` "Học viên của tôi" | Tổng quan · HV&Lớp · Phân tích — **không Công việc, không Test** |
| CX `cx` | 24 (mọi chi nhánh) | `/` "Số liệu" | Tổng quan · HV&Lớp · Phân tích |
| Head tutor `head_tutor` | 25 | `/tutor` | Tutor |
| Chưa đăng nhập | — | màn chào (Đăng nhập · Đăng ký · tài khoản demo) | — |
| Góc nhìn (QL/QT kiêm ≥ 2 vai, `coTheDoiGocNhin`) | **demo không có tài khoản nào** | dải "Góc nhìn: …" + "Về …" (`App.tsx:216-229`) | theo vai đang chọn |

### 1.2 Trang / route × vai

| Route · màn | Vai thấy (theo `nav.ts`) | Đã rà | v4c (ảnh) | Nhận xét vòng này |
|---|---|---|---|---|
| `/` Tổng quan QL/QT | QT, QL | a1, v1-tq, a7 | b3-dau-qt, b3-dau-ql, b1-dang-tai-tq | — (đã đủ) |
| `/` "Mock Test" (Admin) | Admin | a1 (A1-20) | b3-dau-admin22(-375) | người mới: 4 ô số 0 (mục 4.3) |
| `/` "Học viên của tôi" (TVV) | TVV | a1 (A1-20) | b3-dau-tvv23(-375) | không có danh sách việc — V4C-01 |
| `/` "Số liệu" (CX) | CX | a1 (A1-20) | b3-dau-cx24 | tiêu đề khối IN HOA 11 px (E2) |
| `/cong-viec` | QT, QL, GV, Admin | a2, v1-tq, v4a | b3-dau-gv*, b1-loi500-cv | — |
| `/cong-viec/cho-duyet` (trang đầy đủ) | QL, QT | ảnh a1, b (đo khung) | b2-cv-choduyet-ql | V4C-12 |
| `/cong-viec/yeu-cau` "Yêu cầu của tôi" | GV (không Admin, không QL — `nav.ts:45`, `dieuHuong.ts:144`) | **—** (b đo khung) | b2-cv-yeucau-gv7, -gv10 | thẻ tự gửi 4–5 nút; nhãn "Lịch thi" cho dời MT (V2A-03) |
| `/cong-viec/van-hanh` | QL, QT | b (chữ cắt 375) | b2-cv-vanhanh-ql(-375) | cột "Việc con" toàn "–"; bảng 375 cuộn ngang (B) |
| `/cong-viec/bao-cao` "Báo cáo đơn vị" | QL, QT | A5-35 (tên trùng) | b2-cv-baocao-ql(-375) | ô tuần dáng thứ 3 + "Kỳ: Tuần/Tháng" (V4C-05, 11.1b) |
| `/hoc-vien` (5 góc + Bộ lọc thêm) | mọi vai trừ HT | a3, v2a | b3-tvv23-hv, b3-cx24-hv | **HT mở được khung rỗng** — V4C-10 |
| `/hoc-vien/lop/:id` (Học viên / Ý thức / Phân tích lớp) | QT, QL, GV lớp mình | a3, v2b | b2-lop3-*, b3-lop3-ythuc-gv7 | — |
| `/hoc-vien/lop/:id?tab=tong-ket` (lớp đã kết thúc) | QT, QL | **—** | b2-lop1-ketthuc-ql | V4C-09 (70 % hai màu) |
| `/hoc-vien/lop/:id?che-do=lo-trinh` (Lộ trình tiếp theo, lớp thường) | QT, QL, GVCN | ảnh a3 (`lop-thuong-*`) | b2-lop6-lotrinhtiep | chip đang chọn huy hiệu góc (V4C-04); ô "Chọn lộ trình" rộng 660 px |
| `/hoc-vien/luu-tru` | QT, QL, GV (xem) | **ảnh a3 (`hv-luutru`)**, b | b1-luutru-* (5 ảnh) | ổn; "Tổng kết" là link mặc áo nút cạnh nút làm việc; chữ chưa `t()` |
| `/hoc-vien/:id` tab Học thuật | mọi vai có HV | a3 | b2-hv47-* | — |
| `/hoc-vien/:id` tab Ý thức & Phối hợp | như trên | a3, v2b | — | — |
| `/hoc-vien/:id` tab **Hành trình** | như trên | **ảnh a3, E4 (11 px)** | b1-hanhtrinh-* (5 bộ) | **V4C-06** |
| `/hoc-vien/:id` hồ sơ đã lưu trữ (chỉ xem) | QT, QL | **—** | b2-hv39-luutru | màu chip điểm vàng (12.1); chuỗi thô "[Final Test] R không đạt" (A3-32) |
| `/hoc-thuat/case/:id` | mọi vai xem được em | ảnh a3 (`hv-case-trang`), v3b | b1-case-36-*, b1-case-16-qt | chuyển hồ sơ HV + mở ngăn Case (đúng); **V4C-08** |
| `/hoc-thuat/case/:id?viec=ghi-ket-qua` (ngăn Case không hồ sơ) | người giữ việc Kết quả | **—** | b1-case-36-rieng | nền trống đen sau ngăn (không có trang dưới) — chấp nhận được |
| `/test/lich`, `/test/ke-hoach` | QT, QL, GV, Admin | a4, v3a | b3-admin22-test, b3-gvS9-test | Admin rỗng tuần: chữ hướng dẫn tốt |
| `/nhap-diem/:id`, `/bang-diem-thuong/:id` | như Test | a4, v3a (đề xuất bỏ) | b4-bdt-6-gv7 | dùng làm mẫu đo chữ (mục 5) |
| `/mock-test/:id` | QT, QL, GV, Admin | a4 (TST-20) | b3-mock-123-* | — |
| `/phan-tich` (6 tab) | QT, QL, Admin, TVV, CX | a5, v3b | b3-tvv23-pt | — |
| `/tutor` | QT, QL, HT | a5, v3b | b3-dau-ht25(-375) | trang rỗng khi mở (A5-06) |
| `/quan-tri` (Tài khoản · Chương trình · Quyền & nhật ký) | QT | a5 (A5-23, 24, 30) | b1-gv10-quantri | GV gõ thẳng → về trang đầu im lặng (V4C-10) |
| `/ho-so-ca-nhan` | mọi vai | a1 (A1-22) | b2-hoso-canhan-* | — |
| `/giao-vien/:id` | QT, QL, Admin, GV (mình) | a5 | b2-gv-hoso-* | CX bị chặn đúng |
| `/huong-dan` | mọi vai | a1 | b2-huongdan-ql | mở trang **ghi "đã xem"** (PATCH) — chú ý cho công cụ chụp |
| `*` (đường sai) | mọi vai | **—** | b1-404-qt, b1-404-gv10 | **V4C-10** |
| Đường cũ (`duongMoi`: `/tong-quan`, `/hoc-thuat`, `/tong-hop-tuan`, `/tien-trinh`, `/hop-tuan`, `/tien-do-cong-viec`, `/mock-test`, `/mock-test/lop/:id`, `/test/can-cham`, `?view=my_scores|no_plan`) | — | phép kiểm PR-O | — | không rà giao diện (chỉ chuyển hướng) |
| Màn chào / đăng nhập / đăng ký | chưa đăng nhập | ảnh a1 | b1-chua-dn(-375), b1-chua-dn-matmang | demo: mất mạng báo nhầm "Chưa có dữ liệu mẫu" (V4C-10, chỉ bản demo) |
| Dải "Góc nhìn" | QL/QT đa vai | a1 [CẦN ẢNH] | — | demo không có tài khoản → ảnh cần thêm #1 |
| `/dev/thanh-phan` | chỉ `npm run dev` | a6 | — | không phải màn sản phẩm |

### 1.3 Panel · modal · drawer · hộp nổi · menu

| Nhóm | Panel / hộp (chữ trên màn) | Mở từ | Đã rà | v4c | Ghi chú vòng này |
|---|---|---|---|---|---|
| Khung | Thông báo (chuông) · menu Tài khoản · ô tìm toàn cục · Hướng dẫn (panel + trang) | thanh trên | a1 (A1-17, 18, 23), b (B-09) | b2-huongdan-ql | đã đủ |
| Khung | "Chọn tài khoản demo" (Modal) · "Công cụ demo" | thanh demo | a1 (A1-24) | b2-demo-doitk, -congcu | chỉ bản demo; 25 thẻ, không ô tìm — P3 demo |
| Khung | Dải "Mất kết nối…" · toast "Chưa tải lại được" · màn "Trang gặp lỗi khi hiển thị" (`BatLoiTrang`) | tự hiện | **—** | b1-het401, b1-loi500-cv | V4C-10; màn lỗi render chưa tái hiện được (cần lỗi JS) |
| Case | Ngăn Case (`NganCase`/`CasePanel`) | hồ sơ HV, Công việc, Tổng quan, route Case | a1, a2, v1-tq | b1-case-* | V4C-08 |
| Case | Thêm PA · Sửa PA · Hoàn thành Case · Kết quả PA (ghi kết quả) | ngăn Case / việc | a2, v1-tq | b1-case-36-rieng | — |
| Case | Nhật ký PA (gập trong ngăn) · Sửa Case · Xoá Case · Xoá PA / Kết thúc PA (`MenuXoaPa`) | ngăn Case | **—** | (Nhật ký thấy gập) | Sửa/Xoá chưa mở (chạm nút xoá) — mục 1.4 |
| Case | + Case / Báo vấn đề (`QuickReport`) | hồ sơ HV, hồ sơ lớp | ảnh a3, b (đo khung) | — | — |
| Case | "{n} PA — Cần bổ sung đánh giá" (`NeedsEvaluation`) | `ClassIssueBoard` | **—** | — | có thể không còn lối vào sau OV-15e (bảng Vấn đề HV bỏ) — kiểm khi dọn mã |
| Chấm | Nhập điểm lớp (`PanelNhapDiemLop`) · hộp ô điểm · Sửa có lý do · GV chấm Speaking · Dán Excel · Lịch sử bài | Test, hồ sơ lớp, Công việc | a2, a4, v2b, v3a | — | — |
| Lớp | ⋯ hồ sơ lớp (MenuDong, 3 nhóm) | đầu hồ sơ lớp | a3 | b2-lop3-menu(-375) | — |
| Lớp | Thông tin lớp · Phân công | ⋯ / chip "Thiếu GV" | a2 (CV-07) | b2-lop3-thongtin | — |
| Lớp | **Chuyển tiếp lớp** (`TransitionPanel`, toàn màn, 2 bước) | ⋯ hồ sơ lớp FT | **—** | b2-lop3-chuyentiep | tiêu đề cột IN HOA; 3 điều khiển × 33 hàng = 99; chip tuần (V4C-05) |
| Lớp | **Kết thúc lớp / Xoá lớp / Mở lại lớp** (`XoaKetThucLopPanel`) | ⋯ hồ sơ lớp, Lưu trữ | **—** | b2-lop3-ketthuc | **mẫu tốt**: chặn + nói lý do + nút bước tiếp ("Chuyển tiếp lớp") |
| Lớp | Lịch sử (lớp) · Sửa thông tin HV cả lớp | ⋯ | a3 (A3-19) | b2-lop3-lichsu | — |
| Lớp | **Tạo lớp mới / Tạo nhiều lớp** (`ClassCreatePanel`, `LuoiTaoLop`) | HV&Lớp "+ Lớp mới" | a3 (A3-31, chỉ chi nhánh) | b2-hvl-lopmoi(-nhieu, -375) | ô tuần dáng stepper + "Tuần này"; chip chọn huy hiệu ✓ (V4C-04, 05) |
| Lớp | Bàn giao | dải chuyển lớp, Công việc | a2 (CV-28) | — | — |
| Lớp | Lộ trình 1 em (Modal, `BangLoTrinhTiep`) | ⋯ hồ sơ HV "Lộ trình tiếp theo" | **—** (a2 Chốt lộ trình là panel khác) | b2-hv11-lotrinhtiep | **V4C-07** |
| HV | ⋯ hồ sơ HV (Menu cũ) | đầu hồ sơ | a3 (A3-26 tên ⋯) | b2-hv47-menu, -gv7-menu, -gv10-menu | **V4C-03** |
| HV | **Chuyển lớp…** · Đề xuất chuyển lớp… | ⋯ hồ sơ HV | ảnh a3 (`hv-sos3-chuyenlop`) | b2-hv47-chuyenlop(-375), -gv7-dexuatcl | đầu panel kiểu cũ; chip tuần (V4C-05) |
| HV | **Lộ trình** (lịch MT của em, `StudentPlanPanel`) | ⋯ hồ sơ HV ("Lộ trình · lịch MT") | v2b (chỉ nhắc "xếp ở panel Lộ trình") | b3-hv47-lotrinh(-375) | đoạn giải thích 3 dòng dưới bảng (X10); "Lịch đã đúng" link mơ hồ |
| HV | **Kết quả thi thật** | ⋯ hồ sơ HV, Công việc | a3 (không mở được — thiếu dữ liệu) | b2-hv47-ketquathi | form gọn; OVR "–" |
| HV | **Tạm dừng / Thôi học** · Quay lại học · Học lại | ⋯ hồ sơ HV, Lưu trữ | **—** | b2-hv47-tamdung | ổn (2 tab, ONgay "Mặc định: hôm nay") |
| HV | Sửa thông tin (một em) | ⋯ | a3 | b2-hv47-suatt | — |
| HV | **Đề xuất sửa thông tin…** (GVBM) | ⋯ hồ sơ HV | **—** | b2-hv47-gv10-dexuat | ổn |
| HV | **Lịch sử** (`LichSuThayDoi`) | ⋯ hồ sơ HV / lớp, panel khác | ảnh a3 | b2-hv47-lichsu | đầu panel v3 (khác 4 panel cùng menu — V4C-13); giờ thật 20/10 trong demo 14/09 (A1-17) |
| HV | **Xoá học viên** | ⋯ (chỉ QT) | **—** | b2-hv47-xoa | **mẫu tốt**: liệt kê "những gì sẽ mất" + gõ XOÁ |
| HV | **Tổng kết lộ trình** (`NganTongKet`) | tab Hành trình, Lưu trữ | **—** | b2-hv96-tongket, b2-hv39-tongket | nút "Mở hồ sơ" khi đang ở chính hồ sơ đó (V4C-14) |
| HV | Kết luận khoá (`KetLuanKhoa`, lớp thường có Cuối khoá) | tab Học thuật | **—** | — | cần em lớp thường đã có điểm Final chưa kết luận — mục 1.4 |
| HV | Bước tiếp · Gia hạn | Công việc, hồ sơ | a2 (qt1-buoc-tiep, gia-han) | — | — |
| HV | **Thêm học viên** (`IntakePanel`, toàn màn) | HV&Lớp, hồ sơ lớp | ảnh a3, v3a (chỉ phần Excel) | b2-hvl-themhv(-375), b2-lop3-themhv | chữ gợi ý ô tuần bị cắt "W4 SEP hoặc d"; cột "Đã thi tới MT" (Thi/Test, V2A-03) |
| HV | Panel một em · Xuất danh sách · Vì sao SOS · popover "Thiếu" | HV&Lớp | a3, v2a | — | — |
| HV | Xem trước thao tác hàng loạt (`XemTruocHangLoatPanel`: Bỏ lưu trữ / Học lại / Lưu trữ / Kết thúc nhiều em) | thanh "Chọn nhiều" | **—** | — | cần bấm nút có chữ "Bỏ…" trên thanh chọn — không bấm (mục 1.4) |
| Duyệt | Thẻ Chờ duyệt · Từ chối… · Duyệt nhiều · Đề xuất sửa (GV) | Tổng quan, Công việc, hồ sơ HV, ngăn Case | a1, a2 | b2-cv-choduyet-ql, b2-cv-yeucau-gv7 | **5 nơi duyệt cùng thẻ** (mục 4.2-J) |
| Test | Kế hoạch Test (ô lịch, hộp kỹ năng, Xếp nhiều MT, Xếp lịch lớp thường, Xuất kế hoạch, Xuất điểm) | Test › Kế hoạch | a4, v3a, v3b | — | — |
| Test | Xử lý vắng · Khôi phục kết quả / Khôi phục MT cũ | Mock detail, Kế hoạch | **—** | b3-mock-123-menu | cần lượt có vắng đã xác nhận / điểm huỷ — mục 1.4 |
| Ý thức | Ghi vi phạm · Ghi nhận lô · Xác nhận xử lý · Phối hợp SOS · Đề xuất QL duyệt | Ý thức lớp / HV, Công việc | a2, a3, v2b | b3-lop3-ythuc-gv7 | — |
| Ý thức | Khai báo bậc (`KhaiBacPanel`) · Đã thực hiện (`DaThucHienPanel`) · Xem xử lý (`XemXuLyPanel`) · Xoá vi phạm (hộp) | Ý thức, Công việc | a2 (không có dữ liệu) | — | mục 1.4 |
| Vận hành | + Giao việc · Sửa công việc · Báo cáo đơn vị (sửa) | Công việc › Vận hành / Báo cáo | a2 (CV-19) | b2-cv-vanhanh-ql, b2-cv-baocao-ql | form sửa báo cáo đơn vị chưa mở (nút "Sửa" sát lưu) |
| Phân tích | Panel số (`NganDanhSach`), panel Báo cáo, bộ chọn thời gian, ⋯ Kết quả thi | Phân tích | a5, v3b | — | — |
| Tutor | Panel tutor · Thêm / Gộp (Modal) · Tải danh sách | Tutor | a5, v3b | — | — |
| Quản trị | Tạo / Sửa tài khoản · Duyệt lại · Xoá tài khoản · Chương trình · ma trận quyền (ConfirmDialog) | Quản trị | a5 | — | — |
| Hộp nổi chung | Chip SOS · ⓘ (`NutLuat`) · lịch nhỏ (`LichNho`) · popover Thiếu · hộp nhập điểm (portal) | nhiều nơi | a3, v3b (12.7: 15 bản "bấm ra ngoài") | đo ở mục 3 | — |
| Xác nhận | `window.confirm` "Bỏ nội dung đang gõ?" (mọi `KhungPanel` đang sửa dở), Góp ý tuần, Lịch Test, Công việc | đóng panel đang sửa | a5 (persona Sam) | log "dialog(confirm)" của công cụ | hộp của trình duyệt, khác dáng mọi hộp khác (V4C-11) |

### 1.4 Còn chưa rà được (vì sao · cần gì)

| Mục | Vì sao chưa | Cần |
|---|---|---|
| Dải Góc nhìn (đa vai) | demo không có tài khoản QL/QT kiêm vai khác | ảnh bản chính #1 hoặc seed thêm 1 tài khoản (GĐ0 SEED) |
| Sửa Case · Xoá Case · Xoá PA / Kết thúc PA | nút mở nằm cạnh hành động xoá; luật chỉ đọc | ảnh #5 (chỉ mở hộp, không bấm) |
| Xử lý vắng · Khôi phục kết quả · Khôi phục MT cũ | demo không có lượt vắng đã xác nhận / điểm huỷ cho em đã chọn | ảnh #4 |
| Khai báo bậc · Đã thực hiện · Xem xử lý · Xoá vi phạm | demo thiếu việc (a2 đã ghi) | ảnh #5 |
| Kết luận khoá | cần em lớp thường có Final chưa kết luận | ảnh #6 |
| Xem trước thao tác hàng loạt | phải bấm "Bỏ lưu trữ"/"Lưu trữ" trên thanh chọn nhiều | ảnh #7 (dừng ở bước xem trước) |
| Màn "Trang gặp lỗi khi hiển thị" | cần lỗi JS thật | không cần ảnh — đọc mã: chữ đỏ + mã lỗi + "Tải lại" (`App.tsx:22-37`) — ổn |
| `NeedsEvaluation` | có thể đã không còn lối vào | kiểm khi dọn mã (PR dọn) |
| Trạng thái SAU khi lưu (toast, Hoàn tác, lỗi lưu thật) | luật chỉ đọc | đọc mã (mục 3) + ảnh #8 |

---

## 2. Vấn đề mới (mỗi vấn đề đủ 10 ý)

Xếp nặng → nhẹ. Không lặp mã cũ — chỉ ghi phần mới / sâu hơn.

### V4C-01 TVV không có chỗ nhận việc "Ghi nhận kết quả xử lý vi phạm" — lệch luật đã chốt 1 + 2 · (D) · **P1**
1. **Ở đâu:** luồng Ý thức (GVCN lưu xử lý) → vai TVV (Tổng quan "Học viên của tôi", không có Công việc).
2. **Biểu hiện:** GVCN lưu xử lý vi phạm → không việc nào sinh cho TVV. Hạn 5 ngày hiện là của **GVCN** ("Nếu duyệt: GVCN ghi 'Đã thực hiện' trong 5 ngày" — thẻ Đề xuất WL 3, ảnh `b2-cv-choduyet-ql-p1`). TVV chỉ thấy em ở ô "Cần chú ý · Ý thức" (một lý do, không việc, không hạn).
3. **Bằng chứng:** `server/src/yThuc/xuLy.ts` không nhắc `consultant`/TVV; `server/src/worklist/hvCuaToi.ts:102-104` chỉ gắn nhãn `yThuc` vào lý do "Cần chú ý"; `nav.ts:24,42` — TVV không có `work.view` → không có Công việc (đã ghi CV-32); việc "Báo PH qua TVV" (`shared/domain/sos.ts:104,115`, `yThuc/phoiHop.ts:99-122`) là việc **phối hợp SOS sau Test**, không phải việc sau xử lý vi phạm. Ảnh `b3-dau-tvv23`, `b3-dau-tvv23-375`.
4. **Nguyên nhân:** luật mới (20/10) chưa có trong mã; mô hình vai TVV hiện chỉ "xem + sửa thông tin", không có hàng việc.
5. **Ảnh hưởng:** TVV không biết phải báo phụ huynh / ghi kết quả; GVCN không có vòng khép (vi phạm → xử lý → kết quả); QL không theo dõi được "đã báo PH chưa". Mọi vai đều thiếu một mắt xích.
6. **Phương án:** (a) **Khuyến nghị** — mở mục **Công việc cho TVV** chỉ gồm nhóm việc của TVV (Ghi nhận kết quả xử lý vi phạm · Báo PH qua TVV · Chốt ngày thi (11.2) · Bổ sung hồ sơ thiếu), dùng **cùng thành phần hàng đợi trái / chi tiết phải** của 10.2-B: 1 bấm mở việc, 1 form (Đã báo PH lúc · cách · PH phản hồi · kết quả) → 3–4 bấm, 0 đổi trang. (b) Nhét việc vào thẻ số "Cần chú ý" ở Tổng quan TVV: thêm 1 bấm mở danh sách + 1 đổi trang sang hồ sơ HV mỗi việc; dễ chìm giữa SOS. (c) Chỉ thông báo chuông: không có hạn, không đếm quá hạn → trái luật 2.
7. **Xuyên trang / vai:** Hồ sơ lớp › Ý thức + Hồ sơ HV › Ý thức (dòng vi phạm thêm trạng thái "TVV: chưa ghi nhận · hạn 25/09"), Tổng quan QL (nhóm "Vận hành quá hạn"), Phân tích › Ý thức ("Xử lý đã làm trong kỳ"), chuông TVV. Trùng với phạm vi agent phần XII — **dẫn chéo, không thiết kế form ở đây**.
8. **Luật:** luật 1 (sinh ngay khi GVCN lưu) + luật 2 (5 ngày lịch gồm T7, CN). Tình huống biên (TVV nghỉ, em không có TVV) → hỏi ở phần XII.
9. **Kiểm thử:** phép kiểm máy chủ: lưu xử lý → có đúng 1 việc TVV, `han = luu_luc + 5 ngày lịch`; ảnh cặp trang đầu TVV trước / sau; bấm thử TVV 23: việc hiện ở Công việc, mở form tại chỗ.
10. **Cần chủ SP:** **có** — câu hỏi Q1 (đặt việc TVV ở đâu).

### V4C-02 Hover vô hình trên phần lớn hàng / đầu khối / chip lọc — số đo theo ô thật · (D) · P2 (chủ SP II.6)
1. **Ở đâu:** Học viên & Lớp (hàng em, hàng lớp), Công việc / Lịch Test (đầu khối), mọi chip lọc `.nut-loc`, tab, nút đoạn.
2. **Biểu hiện:** rê chuột không đổi gì thấy được ở **hàng em** (cả hàng), **hàng lớp bấm được**, **đầu khối bấm được**, **chip lọc**; tab / nút đoạn chỉ sáng chữ.
3. **Bằng chứng (đo `NEW\chup\v4c-trangthai*.mjs` → `NEW\do\v4c\trangthai*.json`, nền ghép đủ tầng, ΔL OKLab×100):**
   | Thành phần | Tối ΔL | Sáng ΔL | Ghi chú |
   |---|---|---|---|
   | `tr.hang-con.row-hover` (hàng em HV&Lớp) — **ô `td`** | **0** | **0** | `tr` đổi +3,6 / −2,8 nhưng mọi `td` có nền `--hang-con-bg` (`index.css:305`) che mất |
   | `tr.hang-lon` (hàng lớp, `cursor:pointer`) | **0** | **0** | không có luật hover (`index.css:289-292`) |
   | `.khoi-nhom-dau` (đầu khối Công việc / Lịch Test) | **0** | — | `cursor:pointer`, không hover (`index.css:311-317`) |
   | `.nut-loc` chip lọc | **0** | **0** | `filter: brightness(1.2)` trên nền trong suốt (`index.css:234`) |
   | Tab / nút đoạn (chưa chọn) | 0 (chữ #aebcd3 → #e2e8f0) | — | chỉ màu chữ |
   | Dòng việc Công việc | +4,9 | — | yếu |
   | Nút `.btn` | +3,2 | −4,2 | yếu, có thêm viền nhấn |
   | Nút chính | +8,4 | −6,4 | rõ |
   | Chip SOS | +9,0 | −4,0 | rõ ở tối |
   v1 C1 ghi hàng bảng +3,6 vì đo `tr`; đo ô thật thì hàng con là **0**.
4. **Nguyên nhân:** hover viết trên `tr` (`background`) trong khi ô có nền riêng; mỗi loại hàng do một PR, không luật chung; "brightness" không có tác dụng trên nền trong suốt.
5. **Ảnh hưởng:** Cô Linh / Chị Vy không biết hàng nào đang trỏ, hàng nào bấm được (hàng lớp bấm được mà trông như hàng tĩnh, hàng em không bấm được mà con trỏ mặc định) — đúng lời chủ SP "hover dòng và vùng bao quanh gần như giống nhau".
6. **Phương án:** (a) **Khuyến nghị** — HTT-1/HTT-2 (mục 3.3): hover = lớp phủ `background-image` 8 % (tối) / 9 % (sáng) đặt **trên từng ô** (thắng nền riêng của ô dính, hàng con, hàng đã thi), **chỉ** cho thứ bấm được; hàng không bấm được không hover (hoặc "dò hàng" 3,5 % ở bảng ≥ 8 cột). (b) Đổi nền ô sang trong suốt để hover của `tr` lộ ra: sửa nhiều chỗ, phá phân cấp hàng nhóm / hàng con. Chọn (a): một luật CSS, kiểm máy được.
7. **Xuyên trang:** 31 tệp `.row-hover` + 21 chỗ `hover:bg-white/5` (v1 C2) + `HangNhom`, `KhoiNhom`, `.nut-loc`, `HangTab`, `BoLocDoan`.
8. **Luật:** không.
9. **Kiểm thử:** script đo (`v4c-trangthai.mjs` đưa vào `scripts/`): mọi phần tử có `cursor:pointer` → ΔL ô khi rê ≥ 5,8 cả hai chế độ; phần tử không bấm được → ΔL = 0 (hoặc ≤ 3,5 với "dò hàng"); ảnh cặp rê chuột ở HV&Lớp, Công việc, Lịch Test.
10. **Cần chủ SP:** không (đã có câu 10.7-9 về "dò hàng").

### V4C-03 Hai bản menu ⋯ khác hành vi bàn phím, khác dáng tiêu đề nhóm · (D) · P2
1. **Ở đâu:** `Menu` (⋯ hồ sơ HV, "Chỉnh lịch" Mock, Trước/Sau) ↔ `MenuDong` (⋯ hàng bảng, hồ sơ lớp, ⋯ trang HV&Lớp…).
2. **Biểu hiện:** đo bằng phím (`v4c-trangthai2`): **`Menu`** — Enter mở nhưng focus ở lại nút; ↓ không làm gì; phải Tab mới vào mục; Esc từ trong menu → **focus rơi về `body`** (mất chỗ). **`MenuDong`** — Enter mở, focus mục đầu, ↓ sang mục kế, Esc trả focus về ⋯ (đúng). Tiêu đề nhóm: `Menu` 11 px IN HOA, `MenuDong` 12 px thường. `Menu` vẽ `absolute z-30` trong trang (có thể bị khung cuộn cắt); `MenuDong` portal `fixed z-[60]`. Mục tắt: chỉ `MenuDong` có (`tat` + `title`).
3. **Bằng chứng:** `web/src/ui/Menu.tsx:33-43,53,62` · `web/src/ui/MenuDong.tsx:71-77,93-95,110-122`; `NEW\do\v4c\trangthai2.json` khoá `Menu-cu.banPhim`, `dark.MenuDong.banPhim`; ảnh `b2-hv47-menu`, `b2-lop3-menu`.
4. **Nguyên nhân:** `Menu` (PR-I) có trước, `MenuDong` (đặc tả §3.7) làm sau nhưng không thay hết (X7).
5. **Ảnh hưởng:** Sam (bàn phím / trình đọc màn) kẹt ở ⋯ hồ sơ HV — nơi có 7–8 việc quan trọng (Chuyển lớp, Tạm dừng, Lộ trình…); mọi người: hai dáng nhóm cho cùng một khái niệm.
6. **Phương án:** **một** menu ⋯ = `MenuDong` (thêm `hint` một dòng như `Menu`), gỡ `Menu` (3 nơi gọi). Không có phương án thứ hai hợp lý (giữ hai bản = giữ lỗi).
7. **Xuyên trang:** hồ sơ HV, Mock detail, `ThanhTruocSau`.
8. **Luật:** không.
9. **Kiểm thử:** phép kiểm bấm phím (Playwright): mở ⋯ bằng Enter → focus `[role=menuitem]` đầu; ↓ đổi mục; Esc → focus về nút ⋯; quét mã cấm import `ui/Menu.tsx`.
10. **Cần chủ SP:** không.

### V4C-04 "Đang chọn" có 5 dáng; dáng hàng trùng với vòng focus · (D) · P2
1. **Ở đâu:** mọi chỗ chọn / đang mở.
2. **Biểu hiện (đo):** (1) `BoLocDoan` (góc HV&Lớp, FT/LT): nền nhấn ΔL +10 + viền trong 1 px + "✓" — rõ, không chỉ bằng màu; (2) `.nut-loc` đang lọc: nền + viền + chữ nhấn, **không ký hiệu**; (3) `PhanDoan` (Tạo lớp: Một lớp / Fast Track / LT1; Lộ trình tiếp theo: Tất cả 7): **huy hiệu ✓ tròn ở góc trên phải, lấn ra ngoài viền, bị cắt mép** (ảnh `b2-hvl-lopmoi`, `b2-lop6-lotrinhtiep-p1`, `b2-lop3-chuyentiep` "W4 SEP"); (4) tab: chữ sáng + gạch dưới 2 px; (5) dòng việc / hàng lưới đang mở: viền **trong** 2 px `--accent` (`index.css:274-277`) — cùng màu, cùng 2 px với vòng focus **ngoài** (`index.css:144-148`); khi dòng vừa chọn vừa có focus, hai vòng chồng nhau.
3. **Bằng chứng:** `web/src/ui/ui.tsx:540-543` (BoLocDoan) · `web/src/modules/classes/ClassCreatePanel.tsx:307` (PhanDoan) · `index.css:235-237` (nut-loc) · `NEW\do\v4c\trangthai.json` khoá `hvl.goc chọn vs chưa`, `cv.dong chọn vs thường`, `khung.menu-tren chọn vs chưa`.
4. **Nguyên nhân:** mỗi thành phần tự định nghĩa "chọn"; v1 E16 đã đếm 4 dáng ở hàng, vòng này thêm dáng huy hiệu góc của `PhanDoan`.
5. **Ảnh hưởng:** người dùng phải học 5 tín hiệu; huy hiệu cắt mép trông như lỗi vẽ; trên lưới điểm khó biết ô nào đang "chọn" hay đang "focus".
6. **Phương án:** **Khuyến nghị** HTT-5/6 (mục 3.3): hai dáng duy nhất — **nút / chip chọn một** = nền nhấn + viền trong 1 px + ✓ đứng trước chữ (dáng BoLocDoan, áp cho `PhanDoan`, `.nut-loc`); **hàng / dòng đang mở** = nền `--accent-soft` + vạch trái 3 px (khác hẳn vòng focus ngoài 2 px). Đổi vạch trái **hàng nhóm** sang màu trung tính để không trùng. Lưu ý: 10.1 (tài liệu chính) viết "nền nhấn nhạt + viền trái 3 px" còn phụ lục v1 C2 viết "giữ viền khung 2 px" — **hai chỗ mâu thuẫn**, đề xuất theo 10.1.
7. **Xuyên trang:** toàn web.
8. **Luật:** không. Dáng "viền khung 2 px" là chọn của mockup 1 §1d (17/10) — đổi là quyết định thẩm mỹ, PTA tự quyết, ghi vào danh sách để chủ SP biết.
9. **Kiểm thử:** sân mẫu `/dev/thanh-phan` có đủ 2 dáng × sáng/tối; phép kiểm tĩnh cấm `box-shadow inset … var(--accent)` ngoài 2 lớp chuẩn; ảnh cặp lưới điểm có ô focus + hàng chọn.
10. **Cần chủ SP:** không.

### V4C-05 Ô nhập TUẦN có 4 dáng; một dáng là hàng chip gần luật cấm 06/10; chữ gợi ý bị cắt · (D) + (F) · P2
1. **Ở đâu:** ô nhập liệu (không phải bộ lọc — bộ lọc đã ở 11.1b): Thêm học viên, Tạo lớp, Chuyển lớp, Chuyển tiếp lớp, Báo cáo đơn vị, Tạm dừng, Lịch Test.
2. **Biểu hiện:** (1) `ONgay` "W4 SEP hoặc dd/mm" + nút lịch (Thêm HV) — **chữ gợi ý bị cắt "W4 SEP hoặc d"** ở cột "Tuần bắt đầu" (ảnh `b2-hvl-themhv`); (2) bậc thang ‹ [W3 SEP 14/09–20/09] › + "Tuần này" (Tạo lớp, Báo cáo đơn vị, Lịch Test); (3) **hàng chip** "Ngay hôm nay T2 14/09 · W4 SEP · W1 OCT · W2 OCT · Chọn tuần" (Chuyển lớp, Chuyển tiếp lớp — ảnh `b2-hv47-chuyenlop`, `b2-lop3-chuyentiep`); (4) `ChonTuan` gợi ý "Tuần này" (+ Case / Báo vấn đề).
3. **Bằng chứng:** `ChuyenLopPanel.tsx:83-99` (OTuanBatDau), `TransitionPanel.tsx:497-504` (OTuan), `ClassCreatePanel.tsx` "Tuần khai giảng", `ui/ChonNgay.tsx:40` (ChonTuan), `QuickReport.tsx:476-491`.
4. **Nguyên nhân:** mỗi PR tự dựng ô tuần; luật 06/10 ("ô ngày = ô gõ + nút lịch, KHÔNG hàng nút Hôm nay · Hôm qua") chỉ được áp cho ô **ngày**.
5. **Ảnh hưởng:** cùng một việc "chọn tuần bắt đầu" ba cách ở ba panel liền nhau trong một luồng (Tạo lớp → Thêm HV → Chuyển lớp); hàng chip chiếm 2 dòng ở 375.
6. **Phương án:** (a) **Khuyến nghị** — một `ONgay kieu="tuan"` cho mọi ô **nhập** tuần, **điền sẵn tuần đề xuất** (thay chip "W4 SEP") và có lựa chọn "Ngay hôm nay" trong lịch khi nghiệp vụ cho chuyển giữa tuần (OV-13l): 1 bấm khi đồng ý mặc định (như chip), 2–3 bấm khi đổi; ô đủ rộng cho chữ gợi ý. (b) Giữ hàng chip, chỉ sửa chữ gợi ý: nhanh hơn 1 bấm khi chọn tuần thứ 2–3, nhưng trái tinh thần luật 06/10 và thêm dáng thứ 4.
7. **Xuyên trang:** 7 panel trên; `Khoảng tuần` (11.1b) là bộ lọc — giữ riêng nhưng dùng cùng ô tuần bên trong.
8. **Luật:** luật giao diện 06/10 của chủ SP; "Ngay hôm nay" (OV-13l: chuyển ngay, không hoàn tác) giữ nguyên ý nghĩa.
9. **Kiểm thử:** phép kiểm tĩnh: ô tuần nhập liệu chỉ qua `ONgay kieu=tuan`; đo DOM: chữ gợi ý không bị cắt (`scrollWidth ≤ clientWidth`); ảnh cặp 3 panel.
10. **Cần chủ SP:** **có, nhẹ** — Q2 (hàng chip tuần có tính là hàng nút bị cấm không).

### V4C-06 Tab Hành trình: một hành trình vẽ 3 lần, chú giải 9 ký hiệu, chữ mâu thuẫn, 375 cắt chữ · (D) · P2
1. **Ở đâu:** Hồ sơ HV › Hành trình (mọi vai xem được em).
2. **Biểu hiện:** (a) cùng một lộ trình vẽ **3 lần**: bảng "Các lộ trình" → thẻ "Hành trình học tập" (thẻ lớp + Case + PA) → "trục tuần" (Gantt) ngay dưới, cộng nút "Xem trục tuần" dù trục đã hiện; (b) dòng chú giải **9 ký hiệu** (khung rỗng, khối đặc, ▸, ✓ ◑ ✗, ⚠, khung đứt, Tăng/Giảm, dự kiến, tạm dừng) tràn 2 dòng; (c) chữ mâu thuẫn trên cùng một hàng kỹ năng: "từ W4 AUG · **1 PA**" và ngay dưới "PA **chưa có PA** · Trần Ngọc Hà"; Speaking: chip **"Đã huỷ" màu xanh lá** cạnh thanh "✓ Xong W3 SEP"; "5.0 **?**" — dấu ? cạnh điểm dễ đọc thành "điểm chưa chắc"; (d) **375**: trục tuần cuộn ngang trong thẻ, chữ bị cắt "ác nhận PA", "ưa có PA", chip "Đang làm" đè lên lưới tuần; chú giải còn ký hiệu không chữ.
3. **Bằng chứng:** ảnh `b1-hanhtrinh-47-qt-p1`, `-p2`, `b1-hanhtrinh-47-375-p2`, `-p3`, `b1-hanhtrinh-11-qt-*`; mã `students/HanhTrinh.tsx:414` ("Xong / Đã huỷ giữ nhãn xanh"), `:507` ("chưa có PA" khi đếm PA đã xác nhận), 15 chỗ `text-[11px]` (v1 E4); trang 1440 ≈ 2 000 px cho **một** lộ trình.
4. **Nguyên nhân:** ba PR thêm ba lớp hiển thị (OV-5 thẻ, OV-11d trục tuần, bảng "Các lộ trình" OV-13) không bỏ lớp cũ (X4); đếm PA hai cách (mọi PA ↔ PA đã xác nhận).
5. **Ảnh hưởng:** TVV / GVCN muốn trả lời phụ huynh "em đã học gì, hỗ trợ gì" phải đọc 3 khối + chú giải; số PA mâu thuẫn gây hỏi lại GV; 375 gần như không dùng được.
6. **Phương án:** (a) **Khuyến nghị** — giữ **một** dòng thời gian theo lớp (thẻ lớp → mốc Test có điểm tô màu → Case / PA ghi bằng chữ + ký hiệu), trục tuần thành công tắc "Xem theo tuần" chỉ ở ≥ 1 280 px; bỏ bảng "Các lộ trình" khi chỉ có 1 lộ trình; chú giải ≤ 4 ký hiệu, còn lại ghi chữ; một hàm đếm PA ("1 PA · chờ xác nhận"); "Đã huỷ" màu trung tính + gạch. 375: chỉ dòng thời gian dọc. (b) Giữ 3 lớp, sửa chữ + 375: vẫn dài, vẫn trùng.
7. **Xuyên trang:** Tổng kết lộ trình (panel), Lưu trữ › "Tổng kết", hồ sơ HV tab Học thuật (cùng PA / Case).
8. **Luật:** không đổi luật PA / Case; chỉ cách hiển thị.
9. **Kiểm thử:** đo chiều cao tab (1 lộ trình ≤ 1 màn 1440); phép kiểm "cùng PA cùng số" giữa tab Học thuật và Hành trình; ảnh 375 không chữ cắt (`scrollWidth`).
10. **Cần chủ SP:** không (cần mockup trước khi code — màn đổi bố cục).

### V4C-07 "Lộ trình tiếp theo" cho MỘT em: đổi trang sang hồ sơ lớp + hộp giữa màn · (D) · P2
1. **Ở đâu:** Hồ sơ HV lớp thường › ⋯ › "Lộ trình tiếp theo".
2. **Biểu hiện:** bấm → **rời hồ sơ HV** sang `/hoc-vien/lop/6?che-do=lo-trinh` + mở **Modal giữa màn** "Lộ trình · Dương Ngọc Ánh" (Lên FT · Lên BE · Học lại · Tạm dừng học · Dừng học hẳn · Ghi chú · Lưu nháp · Chốt). Quay lại có "‹ Hồ sơ Dương Ngọc Ánh" (tốt). Dáng hộp giữa màn là dáng thứ 3 (panel phải / hộp neo / modal giữa).
3. **Bằng chứng:** ảnh `b2-hv11-lotrinhtiep` (URL cuối trong `index.jsonl`), `b2-lop6-lotrinhtiep-p1`; `classes/BangLoTrinhTiep.tsx` (Modal).
4. **Nguyên nhân:** form một em nằm trong bảng cả lớp; mục menu hồ sơ HV chỉ dẫn link tới bảng đó (X3).
5. **Ảnh hưởng:** GVCN / QL chốt lộ trình một em: 4–5 bấm + **2 lần đổi trang** (đi + về); mất ngữ cảnh hồ sơ (điểm, Case) đúng lúc cần nhìn để quyết.
6. **Phương án:** (a) **Khuyến nghị** — cùng thành phần form "Lộ trình một em" mở **tại hồ sơ HV** (panel phải 560 px, bậc 3 thang 10.3), bảng cả lớp dùng lại form đó trong khung phải: 3 bấm, 0 đổi trang. (b) Giữ đổi trang, đổi Modal thành panel: bớt 1 dáng hộp, vẫn 2 lần đổi trang.
7. **Xuyên trang:** hồ sơ lớp (bảng Lộ trình tiếp theo), Công việc / Tổng quan (Chốt lộ trình — CV-20 đã ghi 2 giao diện).
8. **Luật:** luật lộ trình lớp thường (QL chốt / GV bàn giao) giữ nguyên.
9. **Kiểm thử:** bấm thử QL 2: ⋯ → Lộ trình tiếp theo → URL không đổi `pathname`; đếm bấm.
10. **Cần chủ SP:** không.

### V4C-08 Ngăn Case hiện mã thô khi loại PA không có tên; nút chính sai vai · (D) · P3
1. **Ở đâu:** ngăn Case (mở từ `/hoc-thuat/case/:id`, hồ sơ HV, Công việc).
2. **Biểu hiện:** PA của Phan Minh Tú hiện tên **"teacher_change_request"** (chữ máy, tiếng Anh) ở đầu thẻ PA; QT mở Case "Chờ xác nhận PA" thấy nút chính **"Xác nhận PA"** (việc của GV người dạy).
3. **Bằng chứng:** ảnh `b1-case-16-qt`, `b1-case-36-qt`; dữ liệu seed `server/src/seed/students.ts:806` dùng loại không có trong `INTERVENTION_KINDS` (`shared/domain/cases.ts:617-639`); giao diện rơi về mã: `cases/CasePanel.tsx:328,354,473,530`, `cases/CapNhatTuan.tsx:295` (`INTERVENTION_KIND_LABEL[kind] ?? kind`).
4. **Nguyên nhân:** dữ liệu demo sai loại + mã hiển thị không có tên dự phòng; nút chính theo trạng thái Case, không theo vai người xem (cùng gốc A1-15).
5. **Ảnh hưởng:** nhỏ trên bản chính nếu dữ liệu sạch; nhưng mọi loại PA cũ bị đổi tên / bỏ sau này sẽ lộ mã. QT/QL bấm "Xác nhận PA" thay GV.
6. **Phương án:** tên dự phòng "Loại PA khác" + ghi log; seed sửa loại; nút chính theo vai (QL: "Duyệt"/"Xem"; GV đúng kỹ năng: "Xác nhận PA"). Một phương án (không có lựa chọn thật).
7. **Xuyên trang:** Hành trình, Phân tích › Hiệu quả PA (nhãn loại PA).
8. **Luật:** quyền xác nhận PA giữ nguyên.
9. **Kiểm thử:** phép kiểm: mọi giá trị `kind` trong DB ∈ `INTERVENTION_KINDS`; giao diện không bao giờ in chuỗi có `_`.
10. **Cần chủ SP:** không.

### V4C-09 Cùng một điểm, hai màu trên cùng màn (lớp đã kết thúc) · (D) · P2 (chủ SP I.3 / VIII.1)
1. **Ở đâu:** Hồ sơ lớp đã kết thúc › Tổng kết (MB FOU 03).
2. **Biểu hiện:** bảng Tổng kết: Final **"70%" chip nền vàng**, Progress "1/4 môn" chip vàng; khối lưới ngay dưới cùng màn: Kết quả **"70%" chip nền đỏ** "→ lên + bổ trợ". Vàng ở đây trùng nghĩa vàng = SOS 1 / sắp hạn.
3. **Bằng chứng:** ảnh `b2-lop1-ketthuc-ql-p1`; 12.1 đã đếm 6 dáng tô điểm — đây là **dáng thứ 7** (chip vàng ở Tổng kết lớp) và là ví dụ **cùng số, cùng màn, khác màu**.
4. **Nguyên nhân:** bảng Tổng kết tô theo "có môn trượt", lưới tô theo ngưỡng Final; hai hàm.
5. **Ảnh hưởng:** QL đọc Tổng kết thấy "cảnh báo nhẹ", lưới thấy "trượt" — không biết tin bên nào.
6. **Phương án:** một `ODiem` biến thể `ti-le` (12.1) cho cả hai bảng; chip SOS chỉ cho SOS. Không có phương án khác hợp lý.
7. **Xuyên trang:** Lưu trữ › Tổng kết, hồ sơ HV đã lưu trữ (chip vàng — ảnh `b2-hv39-luutru-p1`), Kết quả đầu ra.
8. **Luật:** giữ ngưỡng phân loại hiện hành.
9. **Kiểm thử:** phép kiểm "cùng giá trị → cùng lớp màu" trên trang; ảnh cặp.
10. **Cần chủ SP:** không (đã có 12.9-9).

### V4C-10 Trang "không tìm thấy", đường sai, vai không có quyền: không lối về, im lặng · (D) · P3
1. **Ở đâu:** `/hoc-vien/:id`, `/hoc-vien/lop/:id`, `/hoc-thuat/case/:id`, `/giao-vien/:id`, `/mock-test/:id` khi id không tồn tại; route `*`; `/hoc-vien` với Head tutor; màn chào khi mất mạng (demo).
2. **Biểu hiện:** "Không tìm thấy học viên / lớp" chữ đỏ + nút **"Thử lại"** (vô ích), không "‹ Quay lại", không nói vì sao (đã xoá? đã lưu trữ?). Cùng web, trang **ngoài phạm vi** làm đúng: câu + lý do + "‹ Học viên & Lớp". Đường sai (`/trang-khong-ton-tai`) → về trang đầu **không báo gì** (GV về Công việc). Head tutor mở `/hoc-vien` → khung Học viên & Lớp đủ góc, "Cần làm **!**", "Bạn chưa được cấp phạm vi nào" (route không chặn theo quyền như `/test`, `/quan-tri`). Màn chào bản demo khi mất mạng báo nhầm "Chưa có dữ liệu mẫu trong máy · npm run seed" (bản chính có nhánh riêng — chỉ demo).
3. **Bằng chứng:** ảnh `b1-hv-khongco`, `b1-lop-khongco`, `b1-gv10-lop-cn-khac`, `b1-404-qt`, `b1-404-gv10`, `b1-ht-hv`, `b1-ht-hv-ho-so`, `b1-chua-dn-matmang`; `App.tsx:264` (`*` → `/`), `App.tsx:239` (`/hoc-vien` không điều kiện `nav.students`), `modules/platform/WelcomePage.tsx:26-35,121-126`.
4. **Nguyên nhân:** `ErrorState` dùng chung cho lỗi tải (đáng thử lại) và 404 (không đáng); chưa có mẫu "không có / ngoài phạm vi" chung (A5-31 "chuyển hướng im lặng" là một trường hợp).
5. **Ảnh hưởng:** link cũ trong thông báo / Zalo tới em đã xoá → người dùng bấm Thử lại nhiều lần; vai hẹp (HT, CX) lạc vào khung trống.
6. **Phương án:** một mẫu **"Trang không mở được"**: tiêu đề nói rõ (không tồn tại / đã xoá / ngoài phạm vi / đường sai) + **một nút về đúng nơi** (danh sách cha hoặc trang đầu vai) + Thử lại **chỉ** khi lỗi mạng / 5xx; `*` hiện mẫu này thay vì chuyển im lặng; `/hoc-vien` chặn theo `nav.students`.
7. **Xuyên trang:** mọi route có `:id`.
8. **Luật:** phân quyền giữ nguyên (máy chủ vẫn chặn).
9. **Kiểm thử:** phép kiểm route: id không tồn tại → có nút về, không nút Thử lại; vai thiếu quyền → không vẽ khung trang.
10. **Cần chủ SP:** không.

### V4C-11 Báo "đang lưu / đã lưu / lỗi" có 3 cách; hỏi "bỏ chữ đang gõ" bằng hộp trình duyệt · (D) · P2
1. **Ở đâu:** form panel, lưới điểm, Lịch thi, mọi panel đang sửa dở.
2. **Biểu hiện (đọc mã — luật chỉ đọc không cho bấm Lưu):** (1) `SaveIndicator` "Đang lưu… / Đã lưu (xám) / Không lưu được + Thử lại" — **chỉ 5 module** dùng; (2) lưới điểm: "…" 11 px xám · "✓" 11 px **xanh lá** (trùng ✓ kết quả — E1) · "Lưu lại" đỏ gạch chân + viền ô; (3) panel: chữ trên nút / toast. Đóng panel đang sửa: `window.confirm` của trình duyệt ("Bỏ nội dung đang gõ?") — dáng khác hẳn mọi hộp của web, chữ hệ điều hành.
3. **Bằng chứng:** `web/src/ui/SaveState.tsx:1-15` (chú thích: "Đã lưu là việc xong… nên xám"), `cham/LuoiFT.tsx:484-490`, `ui/KhungPanel.tsx:70,107`; công cụ ghi `dialog(confirm)` khi đóng panel.
4. **Nguyên nhân:** mỗi PR tự báo; luật "Đã lưu xám" có trong một tệp nhưng lưới không theo.
5. **Ảnh hưởng:** Cô Linh nhập 20 bài thấy "✓ xanh" = đã lưu hay = đạt? Luật CLAUDE.md "phân biệt đang lưu / đã lưu / lỗi… không báo xong khi chưa lưu" đạt về chức năng nhưng không nhất quán về dáng.
6. **Phương án:** một mẫu HTT-10 (mục 3.3): ô / dòng: biểu tượng trung tính (đồng hồ → dấu lưu xám, tự ẩn 2 s) · lỗi: viền đỏ + "Lưu lại"; form: dòng trạng thái trên nút chính; hộp hỏi khi đóng dùng `ConfirmDialog` của web.
7. **Xuyên trang:** mọi lưới chấm, panel, Lịch thi, Góp ý tuần.
8. **Luật:** không.
9. **Kiểm thử:** sân mẫu 4 trạng thái lưu; giả lập lỗi bằng chặn request (như công cụ v4c) — ảnh từng trạng thái.
10. **Cần chủ SP:** không.

### V4C-12 Trang Chờ duyệt đầy đủ + Yêu cầu của tôi: cột lệch theo thẻ, hai dải lọc giống nhau · (D) · P3
1. **Ở đâu:** `/cong-viec/cho-duyet` (QL/QT), `/cong-viec/yeu-cau` (GV).
2. **Biểu hiện:** ô tick chỉ có ở thẻ duyệt hàng loạt được → chip loại ("Học thuật", "Ý thức"…) nhảy vị trí ngang giữa các thẻ (≈ 54 ↔ 78 px), tiêu đề thẻ lệch theo; hai dải nút đoạn cùng dáng ✓ đặt sát nhau ("Chờ duyệt 10 · Báo QL 5 · Đã xử lý" và "Tất cả 10 · Học thuật 6 · Ý thức 1 · Lịch thi 1 · Thông tin HV 2") — một là trạng thái, một là loại; thẻ tự gửi có 5 nút (Sửa… · Rút · Duyệt · Từ chối… · Mở).
3. **Bằng chứng:** ảnh `b2-cv-choduyet-ql-p1`, `b2-cv-yeucau-gv7-p1`.
4. **Nguyên nhân:** thẻ dùng chung `TheYeuCau` cho mọi nơi; cột tick không giữ chỗ khi không có.
5. **Ảnh hưởng:** Chị Vy quét danh sách khó bám cột; dễ bấm nhầm dải lọc.
6. **Phương án:** cột tick luôn giữ chỗ (ô trống); dải "loại" thành chip lọc (khác dáng nút đoạn trạng thái); thẻ tự gửi: "Sửa · Rút" vào ⋯. Khi làm 10.2-B / 7.3, trang này nên bị thay bởi nhóm "Chờ duyệt" của hàng đợi (A1-10).
7. **Xuyên trang:** Tổng quan, Công việc, hồ sơ HV (dải Chờ duyệt).
8. **Luật:** duyệt bắt buộc giữ nguyên (luật 3).
9. **Kiểm thử:** đo DOM: `x` của chip loại bằng nhau mọi thẻ (±1 px).
10. **Cần chủ SP:** không.

### V4C-13 Một menu, hai dáng đầu panel; khối IN HOA 11 px trong panel · (D) · P3 (mở rộng E2, E11)
1. **Ở đâu:** các mục của ⋯ hồ sơ HV.
2. **Biểu hiện:** "Lịch sử" mở đầu panel v3 (17 px, 2 dòng); "Chuyển lớp", "Kết quả thi thật", "Tạm dừng / Thôi học", "Xoá học viên", "Đề xuất sửa" mở đầu cũ (14 px, 1 dòng 52 px) — ngay trong cùng menu; tiêu đề khối IN HOA 11 px ("LỚP CHUYỂN ĐẾN", "TẠM DỪNG HỌC", "NHỮNG GÌ SẼ MẤT", "XÁC NHẬN KẾT THÚC"); Chuyển tiếp lớp dùng **tiêu đề cột IN HOA** (trái OV-15a "đầu cột không in hoa").
3. **Bằng chứng:** ảnh `b2-hv47-lichsu` ↔ `b2-hv47-chuyenlop`, `-tamdung`, `-xoa`, `b2-lop3-chuyentiep`; `ui/KhungPanel.tsx:118-136,196`.
4. **Nguyên nhân:** `dau` (v3) là tuỳ chọn; panel cũ chưa chuyển (X7).
5. **Ảnh hưởng:** nhìn như hai sản phẩm; chữ IN HOA 11 px tiếng Việt khó đọc.
6. **Phương án:** một đầu panel (17 px · tên việc · dòng 2 em/lớp), bỏ IN HOA trong panel (15/700 thường theo thang 10.1). Một phương án.
7. **Xuyên trang:** ~60 panel.
8. **Luật:** không.
9. **Kiểm thử:** phép kiểm tĩnh: `KhungPanel` không có `dau` → lỗi; cấm `uppercase` trong `web/src/modules/**` (trừ mã tuần).
10. **Cần chủ SP:** không.

### V4C-14 Panel dùng lại mang theo nút thừa theo ngữ cảnh · (D) · P3
1. **Ở đâu:** Tổng kết lộ trình (mở trong hồ sơ HV) — nút "Mở hồ sơ" dẫn về chính trang đang đứng; Lưu trữ — "Tổng kết" là **link** (đổi trang) mặc áo nút, đứng cạnh nút làm việc "Học lại", "Bỏ lưu trữ".
2. **Biểu hiện / 3. Bằng chứng:** ảnh `b2-hv96-tongket`, `b1-luutru-375-p1`; `students/NganTongKet.tsx:191`; `students/LuuTruPage.tsx:135,161`.
4. **Nguyên nhân:** panel / dòng viết cho một lối vào, dùng lại ở lối khác.
5. **Ảnh hưởng:** bấm "Mở hồ sơ" không có gì xảy ra (tải lại); lẫn "xem" với "làm" (luật CLAUDE.md tách nút làm việc / link xem hồ sơ).
6. **Phương án:** panel nhận "đang ở hồ sơ em này" → ẩn "Mở hồ sơ"; link xem dùng dáng chữ + "›".
7. **Xuyên trang:** panel một em, ngăn Case ("↗" ở tên em khi đang ở hồ sơ em).
8. **Luật:** không. 9. **Kiểm thử:** bấm thử; phép kiểm: link trùng `location.pathname` không vẽ. 10. **Cần chủ SP:** không.

**Ghi nhận tốt (giữ, dùng làm mẫu):** panel Kết thúc lớp (chặn + lý do + nút bước tiếp — `b2-lop3-ketthuc`); Xoá học viên (liệt kê thứ sẽ mất + gõ XOÁ — `b2-hv47-xoa`); trang ngoài phạm vi (lý do + lối về — `b1-gv10-lop-cn-khac`); tải lại nền lỗi giữ dữ liệu + toast Thử lại (`b1-loi500-cv`); dải "Mất kết nối… Bạn vẫn đang đăng nhập" (`b1-het401`); Skeleton theo khối, tôn trọng giảm chuyển động (`index.css:331-334`); Admin VP tuần rỗng có chữ "Đổi tuần… hoặc mở Kế hoạch Test" (`b3-admin22-test-p1`).
**Lỗi nhỏ thêm (P3, gom):** khi 401 + mất mạng cùng lúc thấy **2 nút Thử lại và hai câu trái nhau** ("Bạn vẫn đang đăng nhập" ↔ "Phiên hết hạn") — `b1-het401`; Vận hành cột "Việc con" toàn "–" (`b2-cv-vanhanh-ql-p1`); ô "Chọn lộ trình" giãn 660 px (`b2-lop6-lotrinhtiep-p1`); panel Lộ trình có đoạn giải thích 3 dòng dưới bảng (X10, `b3-hv47-lotrinh`); Lưu trữ chữ chưa qua `t()` (bản EN sẽ lẫn tiếng Việt).

---

## 3. Ma trận trạng thái

Đo bằng DOM (Edge, 1440 tối + 1440 sáng + 375 sáng; QL 2, GV 7, GV 10, QT 1), nền ghép đủ tầng, ΔL OKLab×100, tương phản WCAG.
Số liệu thô: `NEW\do\v4c\trangthai.json`, `trangthai2.json` (dạng chữ `trangthai.txt`). "Đang lưu / lỗi lưu" đọc mã (luật chỉ đọc).
Ký hiệu: ✓ có, rõ · ~ có nhưng yếu / chỉ bằng màu · ✗ không có hoặc sai · — không áp dụng.

### 3.1 Bảng

| Thành phần | Rê chuột (ΔL tối / sáng) | Focus phím | Đang chọn | Mở / gập | Tắt | Rỗng · tải · lỗi | Lưu |
|---|---|---|---|---|---|---|---|
| Nút chính `.btn-primary` | ✓ +8,4 / −6,4 | ✓ vòng 2 px nhấn, cách 2 px, tương phản 8,9:1 (sáng 5,5:1) | — | — | ✓ mờ 45 % + `not-allowed`; ~ không `title` lý do (lý do nằm trong thân — Kết thúc lớp) | — | ~ "Đang lưu…" trên nút (tuỳ panel) |
| Nút phụ `.btn` | ~ +3,2 / −4,2 (+ viền nhấn) | ✓ | — | — | ✓ | — | — |
| Nút ghost / chữ `.link` | ✓ gạch chân (link) · ✓ +8,8 (ghost, v1) | ✓ | — | — | ✓ | — | — |
| Hàng bảng **không** bấm (`.row-hover`) | ✗ ô thật **0** ở hàng con (HV&Lớp); +3,6 / −2,8 ở hàng thường trừ cột tên dính (0) | — (không focus) | ~ lưới điểm: viền trong 2 px (trùng dáng focus) | — | — | ✓ Skeleton · ✓ Empty | — |
| Hàng nhóm **bấm được** (`tr.hang-lon`) | ✗ 0 / 0 | ~ chỉ nút mũi tên 16×16 nhận focus | — | ✓ nền khác bậc (~4) + vạch trái + mũi tên xoay 90° | — | — | — |
| Đầu khối danh sách (`.khoi-nhom-dau`) | ✗ 0 | ~ chỉ mũi tên 16 px | — | ✓ ΔL 3,7 + vạch + xoay | ✓ `.rong` đầu tĩnh, không mũi tên | — | — |
| Dòng việc (Công việc, cả dòng bấm) | ~ +4,9 | ~ vòng quanh chữ tiêu đề, không quanh dòng | ✓ viền trong 2 px (trùng dáng focus) | ✓ "n em ▾" `aria-expanded` | — | ✓ "Chọn một việc ở danh sách" (CV-29: khung phải trống) | ✓ xong: mờ 55 % + gạch, "✓ Xong · Hoàn tác" (mã) |
| Menu ⋯ `MenuDong` | ✓ +4,2 (mục) | ✓ mở → mục đầu; ↑↓; Esc trả nút | — | ✓ `aria-expanded` | ✓ `aria-disabled` + mờ + `title` | — | — |
| Menu ⋯ `Menu` (cũ) | ✓ +4,2 | ✗ không vào mục; ↓ không chạy; Esc mất focus | — | ✓ | ✗ không có mục tắt | — | — |
| Chip lọc `.nut-loc` | ✗ 0 / 0 | ✓ | ~ nền + viền + chữ nhấn, không ký hiệu | — | — | — | — |
| Nút đoạn `BoLocDoan` | ~ chỉ màu chữ | ✓ | ✓ nền ΔL +10 + viền trong + "✓" | — | ✓ `aria-disabled` + 40 % | — | — |
| Nút đoạn `PhanDoan` | ~ | ✓ | ✗ huy hiệu ✓ góc, cắt mép | — | — | — | — |
| Tab `HangTab` | ~ chỉ màu chữ | ✓ vòng; ✗ ←→ không chuyển tab (A5-33) | ✓ chữ sáng + gạch dưới 2 px | — | — | — | — |
| Menu trên | ~ +4,5 | ✓ | ✓ nền + viền + chữ nhấn (ΔL +8,1) | — | — | — | — |
| Ô nhập `.field` (chữ gợi ý bị cắt ở Thêm HV — V4C-05) | — (không hover) | ✓ viền nhấn + vòng 2 px (hai lớp) | — | — | ✓ mờ 60 % + nền tắt | — | ✓ lỗi: viền đỏ + câu dưới ô (`Truong loi`) |
| Ô chọn `select.field` | — | ✓ | — | — | ✓ | — | — |
| Ô ngày / tuần (`ONgay`, lịch) | — | ✓ | — | ✗ hộp cha tự đóng khi bấm trong lịch (12.7) | ✓ | — | — |
| Số bấm được `SoLieuO` | ✗ nền 0, chữ trắng hơn; 8×20 px (1440) · 24×44 (375) | ✓ | ✗ không có "đang mở panel từ số này" | — | ✓ số 0 không bấm (trơn) | — | — |
| Chip SOS (mở "Vì sao") | ✓ +9,0 (tối) | ✓ | — | ✓ `aria-expanded` | — | — | — |
| Ô điểm lưới FT | ~ theo hàng +3,6 (cột tên 0); nút "Nhập" +3,2 | ✓ | ~ hàng `row-active` | — | ✓ chỉ đọc `.o-doc` không viền ↔ sửa được `.o-sua` | — | ~ "…" xám 11 px · ✗ "✓" xanh lá 11 px (trùng ✓ đạt) · ✓ "Lưu lại" đỏ + viền ô |
| Panel `KhungPanel` | — | ✓ giữ focus trong panel, Esc đóng panel trên cùng, trả focus | — | — | — | ✓ Skeleton / ErrorState trong thân | ~ `window.confirm` khi đóng lúc đang sửa |
| Hộp nổi (ChipSos, ⓘ, BoChonThoiGian, LichNho) | — | ✓ | — | ✗ 15 bản "bấm ra ngoài" (12.7) | — | — | — |
| Trang | — | ✓ "Bỏ qua tới nội dung" | ✓ mục menu sáng theo khu | — | — | ✓ đang tải: Skeleton từng khối · ✓ tải lại nền lỗi: giữ dữ liệu + toast Thử lại · ✓ mất kết nối phiên: dải vàng · ✗ "không tìm thấy" = ErrorState + Thử lại vô ích (V4C-10) | — |

**Theo quyền (đã kiểm):** mục ⋯ chỉ hiện việc vai làm được (QT 7 mục, GVCN 6, GVBM "Đề xuất sửa…" — `b2-hv47-*-menu`) ✓; ô điểm chỉ đọc không viền ✓; GV vào trang không quyền (Quản trị) → về trang đầu **im lặng** ✗; HT mở `/hoc-vien` thấy khung rỗng ✗ (V4C-10); TVV/CX bấm "Test" không có (đúng — redirect).
**Ít / nhiều dữ liệu:** rỗng — HT "Đang dạy 0" mặc định (A5-06), TVV/Admin ô số 0 không câu nào nói "không có việc" (mục 4.3), Lưu trữ "Chưa có lớp nào kết thúc" ✓; nhiều — Chuyển tiếp lớp 33 hàng × 3 điều khiển = 99 (`b2-lop3-chuyentiep`), thẻ Chờ duyệt "Xem thêm n" (A1-14).
**375:** vùng bấm đạt 44–46 px ở ⋯ (`after:-inset-[9px]`), chip SOS (46), số bấm (44) ✓; hover không có nghĩa trên điện thoại — trạng thái chạm `:active` **không có** ở mọi thành phần (đề xuất HTT-1 dùng chung phủ).

### 3.2 Gốc chung
1. Không có **token trạng thái**: mỗi thành phần tự chọn `bg-white/5`, `brightness`, `.row-hover` 4 %, màu chữ.
2. Hover đặt trên **phần tử cha** (`tr`), con có nền riêng che mất.
3. Hai họ thành phần cùng việc (`Menu`/`MenuDong`, `BoLocDoan`/`PhanDoan`/`.nut-loc`, 4 ô tuần, 3 cách báo lưu).
4. Không phép kiểm trạng thái (máy dò impeccable không bắt được "hover = 0").

### 3.3 Đề xuất một hệ trạng thái — HTT-1…12 (nối 10.1 "Hover + trạng thái", sửa chỗ mâu thuẫn)

| Mã | Trạng thái | Luật | Token / số |
|---|---|---|---|
| HTT-1 | Rê chuột (thứ bấm được) | lớp phủ `background-image` lên **từng ô / chính phần tử**, kèm `cursor:pointer`; 375 dùng cùng lớp phủ cho `:active` | `--phu-re`: tối `rgb(255 255 255/.08)`, sáng `rgb(15 23 42/.09)` → ΔL ≥ 5,8 mọi nền (v1 C2) |
| HTT-2 | Không bấm được | không hover, con trỏ mặc định; bảng ≥ 8 cột có ô bấm bên trong: "dò hàng" | `--phu-do` 3,5 % (hỏi 10.7-9 đã có) |
| HTT-3 | Focus phím | vòng 2 px `--accent` **ngoài** cách 2 px (giữ); dòng / hàng bấm được: `:focus-within` vẽ vòng quanh **cả dòng** | giữ `index.css:144` |
| HTT-4 | Hàng nhóm / đầu khối bấm được | nhận HTT-1; mũi tên 16 px + cả hàng là vùng bấm, nút mũi tên mở rộng ≥ 24 px | — |
| HTT-5 | Chọn một trong nhóm (nút đoạn, chip lọc, chip lựa chọn) | **một dáng**: nền `--accent-soft` + viền trong 1 px `--accent` + "✓" đứng trước chữ | thay `PhanDoan` (huy hiệu góc), `.nut-loc` đang lọc |
| HTT-6 | Dòng / hàng đang mở ở panel | nền `--accent-soft` + vạch trái 3 px `--accent-strong`; **không** dùng viền trong 2 px (trùng focus) | vạch trái hàng nhóm đổi sang `--line-strong` |
| HTT-7 | Mở / gập | mũi tên xoay + `aria-expanded`; hàng nguồn nhận HTT-6 | giữ |
| HTT-8 | Tắt | mờ 45 % + `not-allowed` + **lý do** (`title` hoặc dòng chữ cạnh) — luật CLAUDE.md "bị chặn thì nói lý do + bước tiếp" | giữ `.btn:disabled` |
| HTT-9 | Rỗng · đang tải · lỗi tải · không tìm thấy | Empty (tiêu đề + 1 câu + nút bước tiếp nếu có) · Skeleton · ErrorState (+ Thử lại chỉ khi mạng / 5xx) · mẫu "Trang không mở được" (V4C-10) | — |
| HTT-10 | Đang lưu · đã lưu · lỗi lưu · nháp | ô: đồng hồ xám → dấu lưu xám (ẩn sau 2 s) · lỗi: viền đỏ + "Lưu lại" · form: dòng trạng thái trên nút chính · nháp: chữ "Nháp" xám | bỏ "✓" xanh lá cho đã lưu (E1) |
| HTT-11 | Vừa xong (hàng đợi) | dòng mờ 55 % + gạch + "✓ Xong · Hoàn tác 8–10 s", đứng yên tới khi rời (giữ OV-5a) | — |
| HTT-12 | Hỏi trước khi mất dữ liệu | `ConfirmDialog` của web nêu đúng thứ sẽ mất; không `window.confirm` | — |

Thực hiện: 3 lớp CSS dùng chung (`.bam`, `.do-hang`, `.dang-mo`) + 1 `ODiem` + 1 menu ⋯ + 1 ô tuần; **phép kiểm DOM** (từ script v4c): mọi `cursor:pointer` có ΔL rê ≥ 5,8; không phần tử không bấm nào có hover; mọi `[aria-current],[aria-selected=true],[aria-pressed=true]` thuộc 1 trong 2 dáng HTT-5/6. Làm ở **NEN** (10.6) cùng thang chữ.

---

## 4. Hành trình theo vai (XV)

### 4.1 Ai làm hành trình nào (đọc `nav.ts`, `people.ts`, `permissions.ts`; kiểm bằng menu ⋯ / trang đầu từng vai)

| Hành trình | GVBM | GVCN | GV S chéo | TVV | CX | Admin VP | QL | QT | HT |
|---|---|---|---|---|---|---|---|---|---|
| A Xem việc | Công việc | Công việc | Công việc (mở sẵn Chấm Speaking) | Tổng quan ô số | Tổng quan số liệu | Công việc (chỉ Chấm điểm) + Tổng quan | Tổng quan + Công việc | như QL, mọi CN | Tutor |
| B Chấm Test | môn mình | môn mình | — | — | — | sửa điểm có lý do | nhập hộ (thành người chấm — V3A) | như QL | — |
| C Chấm S chéo | — | — | ✓ | — | — | — | phân công người chấm | ✓ | — |
| D Quản lý MT (xếp / dời / "-" / huỷ / khôi phục) | "-" ở ô → đề xuất dời (yêu cầu) | như GVBM + lớp thường dời 1 môn (12.9-7) | — | — | — | xếp / dời lịch (không huỷ, không khôi phục) | ✓ đủ + duyệt dời | ✓ | — |
| E SOS / PA | Thêm PA, Kết quả PA đúng kỹ năng | như GVBM — chỉ kỹ năng mình dạy (C02); đóng Case Ý thức lớp mình | — | xem | xem | — | duyệt PA đề xuất | ✓ | — |
| F Ý thức / Phối hợp | ghi vi phạm | xử lý, phối hợp SOS | ghi vi phạm | xem; (luật 1: ghi nhận kết quả) | xem | — | duyệt WL3 / ngoài thang | ✓ | — |
| G Xử lý vi phạm (chuỗi luật 1–2) | ghi | **lưu xử lý** | — | **ghi nhận kết quả (chưa có)** | — | — | duyệt khi cần | ✓ | — |
| H Tra cứu điểm | lớp mình | lớp mình | lớp chấm chéo | hồ sơ HV | hồ sơ HV | Test, Mock | Test, hồ sơ lớp, Phân tích | ✓ | — |
| I Xuất báo cáo | — | Xuất MT lớp mình | — | Xuất DS HV | Xuất DS HV | Xuất Excel Test | ✓ mọi lối | ✓ | — |
| J Duyệt | gửi / sửa / rút | gửi / sửa / rút | — | — | — | — | ✓ | ✓ | — |

### 4.2 Từng hành trình — mục tiêu · dữ liệu vào · bước hiện tại · điểm nhầm · quyền · phương án · ảnh hưởng chéo

**A. Xem việc (mọi vai)**
- *Mục tiêu:* biết hôm nay làm gì, cho ai, vào đâu. *Vào:* việc theo người phụ trách, hạn, quá hạn.
- *Hiện tại:* GV vào Công việc, **việc quá hạn lâu nhất tự mở** ở khung phải ("Nhập điểm · W1 JUL · quá hạn 68 ngày" — `b3-dau-gv10`), dải "Mới dùng PISA?" trên cùng; QL/QT vào "Việc hôm nay" 2,5 màn (A1); Admin "Mock Test" 4 ô số; TVV 5 ô số; CX 6 ô + 4 thẻ KPI IN HOA; HT trang Tutor rỗng.
- *Điểm nhầm:* tên trang ≠ tên menu (A1-07); số Công việc hai nghĩa (A1-13); GV thấy việc của QL (A3-30); TVV / CX / HT không có danh sách việc.
- *Phương án:* 10.2-B (hàng đợi trái / chi tiết phải) **cho mọi vai có việc**, gồm TVV (V4C-01); HT: mặc định "Tất cả" khi Đang dạy = 0 (A5-06). *Ảnh hưởng chéo:* phân vai Tổng quan ↔ Công việc của QL (10.7-2) quyết định GV thấy gì.

**B. Chấm Test (GV)**
- *Mục tiêu:* nhập đủ, đúng bài, đúng hạn. *Vào:* lượt / tuần thi, kỹ năng được phân công, hạn T4 tuần sau.
- *Hiện tại:* đã đếm ở V3A 3.4 — Cô Linh 2 lớp: ~11 bấm, 3 khối, 8 lưới 10 cột; lớp thường + nhận xét 3 em: ~8 bấm, 4 hộp. Thêm (vòng này): ô "W4 SEP hoặc d" bị cắt ở Thêm HV không ảnh hưởng chấm; trạng thái lưu "✓ xanh" trùng "đạt" (V4C-11).
- *Phương án:* 12.2-B (theo hạn, một nguồn) + HTT-10. *Chéo:* QL / Admin xem "Tình trạng chấm" (12.2).

**C. Chấm Speaking chéo (GV S)**
- *Hiện tại:* GV 9 vào trang đầu → panel "Chấm Speaking · 24 bài" mở sẵn, ô đứt nét chờ điểm, dòng "Nhập bởi Đỗ Vũ Tuấn Phong" (QT nhập hộ thành người chấm) — `b3-dau-gvS9`; ở Test mặc định Lớp thường nên không thấy bài S (V3A).
- *Phương án:* 12.9-6. *Chéo:* QL nhập hộ bị tính trễ (T18).

**D. Quản lý MT (QL, Admin VP, GV đề xuất)**
- *Mục tiêu:* lượt MT đúng tuần; dời / huỷ đúng luật 4. *Vào:* lịch đề xuất, vắng, "-".
- *Hiện tại:* một em: hồ sơ HV ⋯ → "Lộ trình · lịch MT" (panel 720 px) → "Dời lịch" từng lượt (`b3-hv47-lotrinh`); GV nhập "-" → sinh yêu cầu "Dời S · MT3 · lần 2 · Duyệt = S thi W4 SEP … Hết 20/09 chưa duyệt thì yêu cầu tự huỷ và phần thi bị huỷ" (`b2-cv-yeucau-gv7-p1`) → QL duyệt ở Chờ duyệt. Admin VP: Test / Kế hoạch Test, không huỷ / khôi phục (đúng `people.ts:11-13`).
- *Điểm nhầm:* thẻ dời MT mang nhãn **"Lịch thi"** (V2A-03); "-" lần 2 tạo **yêu cầu dời lần 2** có hạn tự huỷ — **cần đối chiếu luật 4** ("-" lần 2 → huỷ; MT hiện tại vẫn gửi duyệt): thuộc phạm vi agent phần XIV, **dẫn chéo**, không kết luận ở đây.
- *Phương án:* bảng chuyển trạng thái MT (phần XIV); nhãn "Dời Test"; khôi phục / huỷ tại hàng (TST, XIV). *Chéo:* GVCN thấy kết quả duyệt ở Yêu cầu của tôi.

**E. Cập nhật SOS / PA (GV đúng kỹ năng, QL duyệt)**
- *Hiện tại:* Công việc → việc Case → ngăn Case (panel) → Thêm PA / Xác nhận PA (a2); từ hồ sơ HV: ⋯ không có, phải từ bảng kỹ năng hoặc ngăn Case; route Case cũ mở đúng (V4C-08). QL duyệt đề xuất PA ở 5 nơi (J).
- *Điểm nhầm:* nút chính "Xác nhận PA" hiện cho QT (V4C-08); số PA hai cách đếm ở Hành trình (V4C-06).
- *Phương án:* 10.3 (Thêm PA tại hàng em ở bảng rộng; khung phải ở danh sách hẹp); nút chính theo vai.

**F. Ý thức / Phối hợp (GV ghi, GVCN xử lý, QL duyệt)**
- *Hiện tại:* đếm ở V2B-6: xử lý quá hạn 5 bấm, xác nhận phối hợp 4 bấm + dò ~1 700 px; hồ sơ HV một việc ở 3 chỗ (V2B-8). Thêm: tab Ý thức hồ sơ lớp có dấu "●" trên tab (`b3-lop3-ythuc-gv7`).
- *Phương án:* 11.3-A / 11.4. *Chéo:* G.

**G. Xử lý vi phạm (chuỗi luật 1–2)**
- *Mục tiêu:* vi phạm → GVCN lưu xử lý → **TVV ghi nhận kết quả trong 5 ngày lịch** → theo dõi.
- *Hiện tại:* bước TVV **không có** (V4C-01); GVCN ghi "Đã thực hiện" 5 ngày (thẻ WL3).
- *Phương án:* V4C-01 (a) + thiết kế form ở phần XII. *Chéo:* Phân tích › Ý thức (Y1 "Xử lý đã làm trong kỳ") đọc thêm kết quả TVV.

**H. Tra cứu điểm (QL, Admin, CX, TVV)**
- *Hiện tại:* CX / TVV: ô tìm → hồ sơ HV → tab Học thuật: 2 bấm, nhưng ô điểm hồ sơ HV là link màu nhấn (E9) và chip vàng (12.1); CX gõ `/test` → về Tổng quan (đúng quyền). QL hỏi "MT2 lớp X đủ chưa, ai nợ": 3–6 bấm + đổi trang (V3A 3.4); lớp kết thúc: Tổng kết + lưới cùng màn **khác màu** (V4C-09).
- *Phương án:* "Tình trạng chấm" (12.9-11) + `ODiem` một luật.

**I. Xuất báo cáo**
- *Hiện tại:* 11 lối, 5 bộ tên cột (V3B-07); hồ sơ lớp ⋯ "Xuất Excel" (nhóm Công cụ); Vận hành / Báo cáo đơn vị không xuất. *Phương án:* E1 (12.9-18).

**J. Duyệt (QL, QT)**
- *Hiện tại:* **cùng một thẻ duyệt hiện ở 5 nơi**: Tổng quan "Cần bạn quyết" · Công việc nhóm "Chờ bạn duyệt" · trang `/cong-viec/cho-duyet` · dải "CHỜ DUYỆT" ở hồ sơ HV (`b2-hv47-menu`) · thẻ đề xuất trong ngăn Case (`b1-case-16-qt`). Duyệt 10 thẻ có xem bối cảnh: ≈ 31 bấm · 20 đổi trang (v1-tq). Trang đầy đủ lệch cột (V4C-12).
- *Phương án:* 10.7-1/2 (B + phân vai): một nơi làm chính (Tổng quan QL), các nơi khác chỉ **dẫn tới** hoặc hiện chữ "chờ QL duyệt" (GV) — hồ sơ HV giữ dải duyệt vì là bối cảnh đúng. *Chéo:* GV sửa / rút ở Yêu cầu của tôi (luật 3: sửa sau lưu có lịch sử; duyệt bắt buộc giữ).

### 4.3 Người mới có hiểu ngay cần làm gì không (trang đầu từng vai, 1440 + 375)

| Vai | Trang đầu (ảnh) | Thấy đầu tiên | Hiểu ngay? | Rỗng / hướng dẫn | Đề xuất |
|---|---|---|---|---|---|
| QT / QL | `b3-dau-qt`, `b3-dau-ql` | "Việc hôm nay" + "Mới dùng PISA?" (QL) + dải số + 21–29 thẻ | ✗ quá dày (A1) | có dải Mới dùng | 10.2-B |
| GVCN / GVBM | `b3-dau-gvcn7`, `b3-dau-gv10`, `b3-dau-gv7-375` | "Chào Hà · Tuần W3 SEP · hôm nay 14/09 · ⚠10 quá hạn · 19 việc", việc cũ nhất tự mở | ~ hiểu "có việc", **không hiểu "W1 JUL" là tuần thi** (V3A) | có | nhãn "MT1 · thi W1 JUL · hạn T4 …" (12.9-4) |
| GV S chéo | `b3-dau-gvS9` | panel Chấm Speaking mở sẵn | ✓ | có | giữ; thêm hạn để nhìn (12.9-6) |
| Admin VP | `b3-dau-admin22(-375)` | "Mock Test" + 4 ô **0** + "Không có giáo viên nào chấm quá hạn" | ~ tiêu đề ≠ menu; không nói "hôm nay không có việc" | **không** có dải Mới dùng | câu rỗng "Không có việc hôm nay · Tuần sau: 5 lượt W1 OCT ›" |
| TVV | `b3-dau-tvv23(-375)` | "Học viên của tôi": 5 ô số (3 · 0 · 0 · 0 · 0) | ✗ không danh sách, không việc | có dải Mới dùng | V4C-01: hàng đợi việc TVV |
| CX | `b3-dau-cx24` | "Số liệu": 6 ô + 4 thẻ IN HOA + "Điểm đáng chú ý" | ~ đọc số, không biết làm gì (CX chủ yếu xem) | có | gọn theo A1-20; bỏ IN HOA |
| Head tutor | `b3-dau-ht25(-375)` | "Không có tutor khớp bộ lọc" (chip Đang dạy 0) | ✗ tưởng không có dữ liệu | không | mặc định "Tất cả" (A5-06) |
| Chưa đăng nhập | `b1-chua-dn(-375)` | Tiếng Việt / English · Đăng nhập / Đăng ký / Vào nhanh | ✓ | demo: mất mạng báo nhầm "chưa seed" | V4C-10 (demo) |

**Không tối ưu vai này làm khó vai khác (kiểm chéo):** (1) bỏ "Chờ duyệt" khỏi Công việc QL (10.7-2) → GV vẫn cần thấy "chờ QL duyệt" ở việc của mình (giữ chữ ở dòng việc GV); (2) Công việc cho TVV (V4C-01) không được kéo việc của GVCN sang (chỉ nhóm việc TVV); (3) bỏ trang `/cong-viec/cho-duyet` → link trong thông báo cũ phải chuyển về nhóm Chờ duyệt (bảng `duongMoi`); (4) HTT-6 đổi dáng "đang chọn" → hướng dẫn "Chỉ cho tôi" và sổ tay chụp lại.

---

## 5. Chữ: bản deploy ↔ mã hiện tại (III.2)

**Cách đo.** (1) Ảnh `5.webp` (bản chính, 1910×896, lưới lớp thường): đo **chiều cao nét** từng ký tự không dấu, không chân (L, H, K, N, chữ số) bằng `NEW\chup\v4c-chu-anh.mjs` (canvas, ngưỡng sáng, lấy dải liên tục ≥ 2 px); ảnh cắt soát ở `NEW\do\v4c\chu-5webp\`.
(2) Tỉ lệ ảnh: chữ menu "Test" / "C" (14 px ở **cả hai** bản — v1 A1 "menu trên 14 không đổi") cao **14 px** trong `5.webp` và **11 px** trong ảnh `main` chụp DPR 1 → **ảnh chủ SP phóng ×1,27** (máy để tỉ lệ màn ~125 %); số huy hiệu xác nhận (11 ↔ 9 px).
(3) `main`: cùng lưới `/bang-diem-thuong/6` — đo nét cùng cách (`NEW\do\v4c\chu-main\`) **và** đọc cỡ thật từ DOM (`NEW\chup\v4c-chu-dom.mjs` → `NEW\do\v4c\chu-dom.json`). Sai số đo nét ±1 px (±8 %).

| Vai trò chữ (lưới Test lớp thường) | Deploy — nét ÷ 1,27 → cỡ suy ra | `main` — cỡ DOM | Chênh |
|---|---|---|---|
| Tên học viên | L 14 px → 11,0 → **~14 px** | **13 px** (400) | −1 px (−7 %) |
| Điểm chỉ đọc "36/40" | số 13 px → 10,2 → **~14 px** | **13 px** | −1 px (−7 %) |
| Dòng phụ "Đạt · 90%" | 11 px → 8,7 → **~12 px** | **12 px** | = |
| Tiêu đề cột | H/K 11 px → 8,7 → **11 px IN HOA** (sổ tay 17/10 cùng dáng: "HỌC VIÊN · L (SỐ CÂU) · KỲ VỌNG") | **12 px chữ thường** (600) | chữ hoa +0,7 px nhưng chữ thường thấp hơn chữ hoa cũ **~27 %** (x-height 6,4 ↔ cap 8,7) — đúng v1 A1 (−21…−27 %) |
| "Nhận xét" / "Điền cả cột" | N 11 px → 8,7 → **~11–12 px** | **12 px** (500) | ≈ |
| Chip kết quả "3/3 môn đạt" | số 11 px → 8,7 → **~12 px** | **11,5 px** (700) | ≈ |
| Ô nhập số | 12 px → 9,4 → **~13 px** | (giá trị ô, không đo DOM) | — |

**Tỉ lệ chữ nhỏ trên `main` (ký tự ≤ 12,5 px / tổng ký tự thấy được, DOM):** lưới lớp thường **81 %** · hồ sơ lớp tab Học viên 55 % · Tổng quan QL 53 % · Công việc GV 56 %.

**Kết luận:** **xác nhận 10.1 "đúng một phần"** và bổ sung số cho màn chủ SP chụp:
1. Ở lưới Test lớp thường, **tên và điểm nhỏ đi 1 px** (14 → 13) và **tiêu đề cột thấp đi rõ** (IN HOA 11 → thường 12) — đúng cảm nhận "nhỏ hơn bản deploy".
2. Dòng phụ, nút chữ, chip **vốn đã 11,5–12 px ở bản deploy** và giữ nguyên → phần lớn chữ của lưới (81 %) nhỏ ở **cả hai** bản; chỉ đưa về 14 px như cũ là **không đủ** — cần thang 10.1 (ô 15 · lưới 14 · nhãn 13 · tối thiểu 12).
3. Chủ SP xem ở **~125 %**: 13 px hiện thành ~16,5 px thiết bị; ở máy 100 % (giáo viên laptop) chữ còn nhỏ hơn ảnh chủ SP thấy → nghiệm thu chữ phải chụp **cả 100 % và 125 %**.
4. Bổ sung cho thang 10.1: lưới điểm lớp thường là chỗ dày nhất (81 % chữ nhỏ) → làm cùng **BANG-1** (`ODiem` biến thể `ti-le`), không đợi màn Test.

---

## 6. Câu hỏi cho chủ SP (chỉ nghiệp vụ / quyền / định hướng — quan trọng trước)

1. **Việc TVV "Ghi nhận kết quả xử lý vi phạm" (luật 1–2 đã chốt) đặt ở đâu?** TVV hiện **không có trang Công việc**, chỉ có 5 ô số. — *Khuyến nghị:* **mở mục Công việc cho TVV**, chỉ chứa việc của TVV (Ghi nhận kết quả xử lý vi phạm · Báo PH qua TVV · Chốt ngày thi · Bổ sung hồ sơ thiếu), cùng dáng hàng đợi của QL; Tổng quan TVV giữ ô số để xem. (Phần form / người được giao trường hợp đặc biệt hỏi ở phần XII.)
2. **Hàng chip chọn tuần "Ngay hôm nay · W4 SEP · W1 OCT · W2 OCT · Chọn tuần"** (Chuyển lớp, Chuyển tiếp lớp) có tính là "hàng nút Hôm nay · Hôm qua" anh/chị cấm 06/10 không? — *Khuyến nghị:* **có** — thay bằng ô tuần gõ được + nút lịch, **điền sẵn tuần đề xuất**, "Ngay hôm nay" là một lựa chọn trong lịch (giữ nghĩa chuyển ngay, không hoàn tác).

## 7. PTA tự quyết (thẩm mỹ / UX) — liệt kê để chủ SP biết

- Hệ trạng thái HTT-1…12 (mục 3.3): hover 8 %/9 % trên từng ô, chỉ cho thứ bấm được; "đang chọn" 2 dáng; **đổi dáng "đang chọn" của hàng từ viền khung 2 px (mockup 1 §1d, 17/10) sang nền nhấn + vạch trái 3 px** để không trùng vòng focus; vạch trái hàng nhóm sang màu trung tính.
- Một menu ⋯ (`MenuDong`), gỡ `Menu` (V4C-03).
- Một đầu panel (v3, 17 px), bỏ IN HOA trong panel và tiêu đề cột Chuyển tiếp lớp (V4C-13).
- Một ô nhập tuần (`ONgay kieu=tuan`) cho 7 panel (V4C-05 — chờ câu 2 cho riêng hàng chip).
- Tab Hành trình: một dòng thời gian, trục tuần thành công tắc ≥ 1 280 px, chú giải ≤ 4 ký hiệu, "Đã huỷ" trung tính (V4C-06 — cần mockup).
- "Lộ trình tiếp theo" một em mở tại hồ sơ HV (V4C-07).
- Mẫu "Trang không mở được" + `/hoc-vien` chặn theo quyền + `*` báo đường sai (V4C-10).
- Một mẫu báo lưu (HTT-10) + `ConfirmDialog` thay `window.confirm` (V4C-11).
- Tên dự phòng "Loại PA khác" + nút chính theo vai trong ngăn Case (V4C-08).
- Cột tick giữ chỗ, dải "loại" thành chip lọc ở Chờ duyệt / Yêu cầu của tôi (V4C-12).
- Ẩn nút trùng trang ("Mở hồ sơ"), link xem dùng chữ + "›" (V4C-14).
- Nghiệm thu chữ chụp ở 100 % **và** 125 % (mục 5).

## 8. Ảnh tiêu biểu

Thư mục: `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\anh\v4c\`
- Hành trình 3 lớp + chú giải: `...\anh\v4c\b1-hanhtrinh-47-qt-p1.png`, `...\anh\v4c\b1-hanhtrinh-47-qt-p2.png` · 375 cắt chữ: `...\anh\v4c\b1-hanhtrinh-47-375-p2.png`, `...\anh\v4c\b1-hanhtrinh-47-375-p3.png`
- Ngăn Case mã thô: `...\anh\v4c\b1-case-16-qt.png`
- Không tìm thấy ↔ ngoài phạm vi: `...\anh\v4c\b1-hv-khongco.png`, `...\anh\v4c\b1-gv10-lop-cn-khac.png` · đường sai: `...\anh\v4c\b1-404-qt.png` · HT khung rỗng: `...\anh\v4c\b1-ht-hv.png`
- Mất mạng / lỗi / 401: `...\anh\v4c\b1-matmang-ql.png`, `...\anh\v4c\b1-loi500-cv.png`, `...\anh\v4c\b1-het401.png`, `...\anh\v4c\b1-chua-dn-matmang.png`
- Lộ trình tiếp theo đổi trang + Modal: `...\anh\v4c\b2-hv11-lotrinhtiep.png`
- Chip tuần + đầu panel cũ: `...\anh\v4c\b2-hv47-chuyenlop.png` · huy hiệu ✓ góc: `...\anh\v4c\b2-hvl-lopmoi.png` · Chuyển tiếp lớp IN HOA, 99 điều khiển: `...\anh\v4c\b2-lop3-chuyentiep.png`
- Chữ gợi ý cắt: `...\anh\v4c\b2-hvl-themhv.png` · 70 % hai màu: `...\anh\v4c\b2-lop1-ketthuc-ql-p1.png` · Chờ duyệt lệch cột: `...\anh\v4c\b2-cv-choduyet-ql-p1.png`
- Menu ⋯ cũ: `...\anh\v4c\b2-hv47-menu.png` · mẫu tốt: `...\anh\v4c\b2-lop3-ketthuc.png`, `...\anh\v4c\b2-hv47-xoa.png`
- Trang đầu theo vai: `...\anh\v4c\b3-dau-tvv23.png`, `...\anh\v4c\b3-dau-admin22.png`, `...\anh\v4c\b3-dau-ht25.png`, `...\anh\v4c\b3-dau-cx24.png`, `...\anh\v4c\b3-dau-gvS9.png`, `...\anh\v4c\b3-dau-gv7-375.png`
- Chữ: `main` `...\anh\v4c\b4-bdt-6-gv7.png` ↔ deploy `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking--claude-worktrees-plan-ux-danh-gia\73e605ad-8127-476a-aa89-6555907579b7\images\5.webp`; ảnh cắt đo nét `C:\Users\Admin\AppData\Local\Temp\claude\D--Github-Pisa-tracking\73e605ad-8127-476a-aa89-6555907579b7\scratchpad\do\v4c\chu-5webp\`, `...\do\v4c\chu-main\`
- Số đo: `...\scratchpad\do\v4c\trangthai.json`, `trangthai2.json`, `trangthai.txt`, `chu-dom.json`, `kiemke.tsv`, `tukhoa.tsv`

### Ảnh cần chủ SP chụp thêm (bản chính, dữ liệu thật — chỉ mở, không bấm Lưu / Xoá)

| # | Trang | Bước thao tác | Trạng thái cần thấy |
|---|---|---|---|
| 1 | Bất kỳ (tài khoản QL/QT kiêm GV) | menu tên mình › Góc nhìn › chọn "Giáo viên" | dải "Góc nhìn: …" + trang đầu + menu sau khi đổi; rồi bấm "Về Quản lý" |
| 2 | Hồ sơ HV có Case với PA loại cũ (Dời lịch thi / Meeting CX / Khác (mục cũ)) | mở Case từ tab Học thuật | tên loại PA ở thẻ PA có hiện chữ máy (có "_") không |
| 3 | Hồ sơ HV đã học ≥ 2 lớp | tab Hành trình, 1440 rồi điện thoại; kéo trục tuần | chữ trong ô tuần có bị cắt; số PA ở hai dòng có khớp |
| 4 | Test › Mock của một em có kỹ năng vắng đã xác nhận / có điểm bị huỷ | bấm ô vắng → "Xử lý vắng"; menu "Chỉnh lịch" → "Khôi phục kết quả" | hai panel ở trạng thái mở |
| 5 | Hồ sơ lớp › Ý thức & Phối hợp, em đã có lần xử lý | mở dòng vi phạm → ⋯ → "Xoá vi phạm"; "Khai báo bậc"; "Đã thực hiện" | ba hộp ở trạng thái mở (rồi Esc) |
| 6 | Hồ sơ HV lớp thường đã có điểm Final, chưa kết luận khoá | tab Học thuật | hộp "Kết luận khoá" |
| 7 | Lưu trữ › Học viên đã lưu trữ | "Chọn nhiều học viên" → tick 2 em → "Bỏ lưu trữ" | **chỉ** panel xem trước (đóng, không xác nhận) |
| 8 | Lưới chấm Test trên điện thoại khi mạng yếu | gõ một điểm rồi tắt mạng một lúc | ô ở trạng thái đang lưu / lỗi "Lưu lại" |
| 9 | Màn lưới Test như ảnh 5.webp ở bản mới (sau deploy), **cùng máy, cùng tỉ lệ màn** | — | để ghép ảnh cặp chữ deploy ↔ mới (hiện đo bằng suy tỉ lệ ×1,27) |
| 10 | Trang đầu TVV và Tutor (Head tutor) ở bản chính, sáng thứ Hai | — | để thiết kế hàng đợi TVV (V4C-01) và trạng thái rỗng HT bằng dữ liệu thật |
