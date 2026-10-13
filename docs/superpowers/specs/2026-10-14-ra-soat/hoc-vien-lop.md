> Phụ lục rà soát 13–14/10 (báo cáo agent, planning đã đối chiếu các mục chặn). Đường ảnh `$SP/anh/...` chỉ có trên máy planning — tái hiện theo bước ghi trong mục.

# Rà chức năng — HỌC VIÊN & LỚP + HỒ SƠ LỚP (mã khu HL, N=2, DB a2, ngày demo 14/09/2026)

## Đã đi
| Trang | Vai | Thao tác đã thử |
|---|---|---|
| `/hoc-vien` 1440 tối | QT, QL, QLCP, GVCN, GVBM, GVW, ADMIN, TVV, CX | ô chi nhánh / Phạm vi (giá trị mặc định + lựa chọn), từng chip: số trên chip = số em hiện ra (mở hết lớp bằng `open=`) — 9 vai × 5 chip, đều khớp |
| `/hoc-vien` ⋯ dòng học viên | QL (FT 3, FOU 6), GVCN (3, 6), GVBM (3), ADMIN (10), TVV, CX | bấm từng mục: Ghi vi phạm · + Case · Nhập điểm · Sửa thông tin · Lộ trình tiếp theo · Chuyển lớp / Đề xuất chuyển lớp · Tạm dừng / Thôi học · Kết quả thi thật · Mở hồ sơ — đều mở đúng panel / trang, không 4xx |
| `/hoc-vien` Admin | ADMIN | cột Lượt MT · Ô chưa nhập, badge "1 HV quá hạn việc" → `?view=qua-han` |
| Hồ sơ lớp đầu trang + ⋯ + tab + cách xem | QL: 3, 5, 6, 7, 17, 19, 30, 1, 2 | nút Nhập điểm (href), + Case, ⋯ (nhóm + thứ tự), tab lượt, khối điểm cuối trang (mở sẵn) |
| Nhập điểm → Điểm theo lớp | QL: 3, 5, 6, 30 | đúng lớp + đúng lượt (`luot=mt:3`, `thuong:final`, `cp:1`) |
| Trước/Sau + Quay lại | QL | từ `/hoc-vien?view=can-lam&khung=thuong` → hồ sơ lớp → Sau → đổi tab → Sau → Quay lại về đúng URL có lọc |
| Panel Thông tin lớp | QL: 19, 3, 28 | 3 phần Sửa cùng lúc; Lớp lỗi trùng mã (400 "Đã có lớp MB FOU 15.") → Lịch Test + Phân công giữ chữ; Lưu Lịch Test riêng được, Lớp vẫn giữ số đã gõ |
| Panel Sửa cả lớp | QL: 5 · GVCN: 19, 3 | cột theo vai (QL có Liên hệ, GVCN không), đổi Target không lý do → chặn tại panel, GVCN ô Target khoá "Chỉ Quản lý đổi Target" |
| Panel Thêm học viên | QL: 19 | dán Excel 3 dòng (không email · thiếu ngày sinh · email sai) → thêm 1, 2 dòng lỗi ở lại đúng ô |
| `/hoc-vien` lọc lớp (`classId`) | QL (16), GVBM (3) | badge "n HV quá hạn việc" → chip Quá hạn: **lệch** (HL-9) |
| `/hoc-vien` tìm · Loại lớp · Xếp | QL | tìm tên / mã lớp / không ra; đổi Loại lớp khi đang chip SOS; tải lại giữ URL |
| `/hoc-vien` TVV Phạm vi · CX chi nhánh | TVV (HV của tôi → Chi nhánh), CX (Tất cả → Monbay) | chip = số dòng, khớp; so tập em QL ↔ CX cùng MB (HL-19) |
| Chọn nhiều học viên | QL: 23 | Kết thúc học 1 em → toast Hoàn tác → Hoàn tác OK; xem trước Lưu trữ (em đang học bị bỏ qua có lý do), Huỷ chuyển lớp 2 em (đòi lý do) |
| Lộ trình tiếp theo (lớp thường) | QL, GVCN, GVBM, CX: 6 | bảng theo hướng; hạn "chốt trước hết W1 SEP · bàn giao trước hết W3 SEP" (Final W3 SEP) đúng; Lưu nháp → QL thấy "Nháp", GVCN/GVBM/CX không thấy (cả API); Chốt Lên FT → MT0 W3 SEP, bàn giao hạn 20/09 |
| Kết quả đầu ra | GVCN → QL: 6 | nhập MT0 3.5 cả 4 kỹ năng (API) → hộp gợi ý "Không đạt · ngưỡng FOU > 3.5" đúng; GVCN Lưu đề xuất (không tạo Case); QL Chốt → Case chờ ngày thi hành (đúng `kyVong.ts:22`) |
| Lớp FT | QL: 3, 23 · QT: 13 | ⋯ Chuyển tiếp lớp (panel Soạn/Xác nhận), cách xem Kết quả đầu ra (đợt W2 SEP, hiện tới hết W1 OCT), Cần hỗ trợ, Phân tích lớp, dòng "Đầu vào · chỉ Overall" (HD FT 302) |
| Hồ sơ lớp theo vai | GVCN: 3, 6, 28 (ngoài phạm vi), 30 · GVBM: 3, 6, 8 · ADMIN: 10 · TVV: 10 · CX: 3, 6 | nút đầu trang, ⋯ (GVBM không có ⋯), cách xem theo vai, Thông tin lớp đọc (TVV/CX/Admin), GVCN Thông tin lớp chỉ sửa Phân công (GVBM) |
| API thẳng thao tác bị ẩn | GVCN, GVBM, ADMIN, TVV, CX | 17 đường ghi (thong-tin, teachers, progress, lo-trinh-nhap, transition, ky-vong, hang-loat, sua-ca-lop, intake, ket-thuc, mo-lai, ket-qua-de-xuat, hoc-lai, archive, xoa…) → đều 403 / bị chặn đúng; không thấy nút hiện mà bấm 403 |
| Kết thúc lớp → Lưu trữ → Mở lại lớp | QL: 1 | panel xác nhận, vào Lưu trữ, tab Tổng kết, ⋯ chỉ "Mở lại lớp"; sửa điểm khối cuối (HL-10); Mở lại → Hoàn tác |
| Học lại (Lưu trữ) | QL | Vũ Thu Uyên về lớp cũ MB BE 08 (HL-1) |
| TVV / CX Sửa thông tin | TVV (CP FT 110), CX, QT | Target đổi đòi lý do → lưu (PATCH + target-revision 200); em thiếu ngày sinh chỉ đổi SĐT bị chặn (HL-11); Tạm dừng / Thôi học mở 2 tab |
| 375 sáng | QL, GVCN | `/hoc-vien` (thẻ lớp + thẻ em), hồ sơ lớp FT 3 + thường 6 (thẻ thay bảng), cách xem Lộ trình / Cần hỗ trợ, 3 panel màn đầy đủ — không tràn ngang |

Chưa đi (ngoài phạm vi / thiếu thời gian): + Lớp mới, Xuất Excel, panel Bàn giao (ghi phiếu), gửi Đề xuất chuyển lớp, thao tác trong Cần hỗ trợ, nội dung Phân tích lớp (chỉ mở được, không lỗi). DB a2 đã bị ghi: lớp 28 Progress tuần 3, lớp 19 +1 em "Rà Soát Một", lớp 6 nháp/chốt/MT0/KQĐR của Bùi Khánh Linh + Dương Ngọc Ánh, lớp 1 kết thúc → mở lại + điểm L 29, Vũ Thu Uyên học lại, Đinh Ngọc Quyên Target 7.0 — muốn sạch: `bash env.sh 2 reset`.

## Phát hiện

### HL-1 · lỗi (dữ liệu demo) · Hai lớp "đã kết thúc" của demo không ở trạng thái kết thúc
- Trang · vai: `/hoc-vien/lop/1` (MB FOU 03), `/hoc-vien/lop/2` (MB BE 08) · QL
- Tái hiện: mở hai hồ sơ lớp → không có dải "Lớp đã kết thúc — chỉ xem", không có tab Tổng kết; vẫn có Nhập điểm, + Case, ⋯ "+ Học viên", "Kết thúc lớp". `/hoc-vien/luu-tru` không có hai lớp này (Lưu trữ · 1 HV, 0 lớp).
- Hệ quả đã tái hiện: `/hoc-vien/luu-tru` › Học viên đã lưu trữ › Vũ Thu Uyên › Học lại "Về lớp cũ MB BE 08" → "Đã cho Vũ Thu Uyên học lại" → em thành `active`, ghi danh vào lớp `ended` → **biến khỏi cả Học viên & Lớp (`/hoc-vien-lop?q=Vũ Thu Uyên` rỗng) lẫn Lưu trữ** (máy chủ `hocLai` chỉ đòi mở lại lớp khi `class_status === 'finished'`, `server/src/students/students.ts:400,412`). Với lớp `finished` thật thì máy chủ chặn có câu rõ — chỉ demo bị.
- Thấy: DB demo `classes.status = 'ended'`, `finished_at` NULL · Đúng ra: `status = 'finished'` (mọi chỗ của web chỉ hiểu `'finished'`: `classes.ts:329,767`, `luuTru.ts:36`, `xoaKetThucLop.ts:79`).
- Nguyên nhân: `server/src/seed/seed.ts:177` ghi `c.status === 'ended' ? 'ended' : 'active'`; `server/src/seed/journeys.ts:250,256` khai `status: 'ended'`.
- Đề xuất: seed ghi `'finished'` + `finished_at` (vd ngày cuối khoá). Chỉ demo — bản chính lớp kết thúc qua `xoaKetThucLop.ts` / `luatLoTrinh.ts:220` đã ghi `'finished'`. Không cần mockup. (Vì vậy phần "lớp đã kết thúc" mình thử bằng lớp tự kết thúc — xem HL dưới.)
- Ảnh: `$SP/anh/hoc-vien-lop/c-lop-QL-1-1440-dark.png`

### HL-2 · lỗi (xung đột OV-2c ↔ OV-10c) · "Thiếu thông tin" không đếm ngày sinh — ba tài liệu nói ba cách
- Trang · vai: `/hoc-vien` chip "Thiếu thông tin", Tổng quan TVV/CX ô "Thiếu thông tin", hồ sơ HV · mọi vai
- Tái hiện: QL MB: chip "Thiếu thông tin 46" — 46 em này thiếu tháng thi (43), điểm đầu vào (44), mốc tiếp (14), Target (2); MB không em nào thiếu ngày sinh. BC ELE 01 có 1 em thiếu ngày sinh mà không vì thế vào chip.
- Thấy: chip = `missingForStudent` (thiếu sót học thuật, cố ý bỏ ngày sinh — `server/src/classes/schedule.ts:764`); Tổng quan TVV/CX dùng lại đúng cờ đó (`server/src/worklist/hvCuaToi.ts:102-106`). Số khớp nhau giữa các nơi.
- Đúng ra (chưa thống nhất): đặc tả §2 "em cũ thiếu [email/ngày sinh] → nhãn Thiếu thông tin"; plan.md nhật ký OV-2c "Thiếu thông tin chỉ đếm ngày sinh"; bàn giao 13/10 "ô Thiếu thông tin Tổng quan TVV không tính ngày sinh / email" (đã báo chủ SP). OV-10c đã đè thay đổi `!r.dob` của OV-2c (`git show 635088d1 -- server/src/worklist/hvCuaToi.ts`).
- Đề xuất: chủ SP chốt MỘT định nghĩa; nếu ngày sinh bắt buộc khi thêm/sửa (OV-2c giữ) thì thêm `dob` vào `missingForStudent` (một hàm cho chip, badge dòng, ô Tổng quan). Sửa plan.md dòng nhật ký OV-2c cho khỏi hiểu sai. Không cần mockup.
- Ảnh: `$SP/anh/hoc-vien-lop/a-hv-QL-1440-dark.png`

### HL-3 · thừa (không nhất quán) · "Nhập điểm" của cùng một lớp mở hai trang khác nhau
- Trang · vai: `/hoc-vien` · GVCN 7, QL
- Tái hiện: (a) Hồ sơ lớp MB FOU 12 → nút Nhập điểm → `/test/diem-lop?lop=6&luot=thuong:final` (Điểm theo lớp, đúng OV-1a). (b) `/hoc-vien?open=6` → ⋯ dòng em → "Nhập điểm Progress Test" → `/bang-diem-thuong/6?kind=progress` (trang Nhập điểm cũ `ChamDiemPage`, tab Test sáng). (c) ⋯ hàng lớp "Nhập điểm" → `/bang-diem-thuong/:id` / `/nhap-diem/:id`; (d) link "Cả lớp: Nhập điểm …" và Việc tiếp theo "Nhập điểm" cũng ra trang cũ.
- Thấy: hai màn nhập điểm cho cùng lớp, khác bố cục / cách chọn bài · Đúng ra: đặc tả §4 + OV-1a "Nhập điểm → Điểm theo lớp" (CLAUDE.md "cùng loại thao tác cùng vị trí, phản hồi").
- Nguyên nhân: `web/src/modules/students/StudentsPage.tsx:363`, `web/src/modules/classes/thaoTacDongHocVien.tsx:36` (`nhapDiemCua`) vẫn dựng đường cũ; `DauTrangLop.tsx:122` dựng đường mới.
- Đề xuất: `nhapDiemCua` + ⋯ hàng lớp trỏ `/test/diem-lop?lop={id}&luot={mã lượt}` (dùng `vietMaLuot`); giữ route cũ làm chuyển hướng. Không cần mockup.
- Ảnh: `$SP/anh/hoc-vien-lop/b-menu-GVCN-6-Nhập-điểm-Progress-T.png`, `d-nhapdiem-QL-6.png`

### HL-4 · lỗi nhỏ · "đủ điểm" của lớp thường có hai mẫu số trên cùng một trang
- Trang · vai: `/hoc-vien/lop/6` (MB FOU 12) · QL
- Tái hiện: đầu trang "Final Test: 1/7 em có đủ điểm"; ngay dưới, tab lượt + khối "Điểm Test của lớp" ghi "Final Test 1/6 đủ điểm" (Progress "3/5").
- Thấy: đầu trang chia cho mọi em đang học (`overview.cuoiKhoa.tong = 7`), khối điểm chia cho em có lịch bài đó (`diem-theo-luot.coLich = 6`) · Đúng ra: một số liệu một cách tính (CLAUDE.md "cùng nguồn, cùng hàm").
- Nguyên nhân: `server/src/classes/classes.ts` (`cuoiKhoa`) vs `server/src/cham/diemTheoLuot.ts` (`danhSachLuot`).
- Đề xuất: đầu trang dùng cùng `duDiem/coLich` của `danhSachLuot` (hoặc ghi rõ "1/6 em có lịch · 1 em chưa có lịch"). Không cần mockup.
- Ảnh: `$SP/anh/hoc-vien-lop/c-lop-QL-6-1440-dark.png`

### HL-5 · gợi ý · Dải "Lộ trình tiếp theo" quá hạn chỉ báo bằng màu
- Trang · vai: `/hoc-vien/lop/6`, `/hoc-vien/lop/7` · QL
- Tái hiện: hôm nay W3 SEP; dải đỏ "Lộ trình tiếp theo · chốt trước hết W1 SEP · 0/7 em" — không có chữ "quá hạn".
- Đúng ra: CLAUDE.md "trạng thái không chỉ phân biệt bằng màu"; dải Bàn giao bên dưới đã dùng `<Han>` (có chữ quá hạn).
- Nguyên nhân: `web/src/modules/classes/DaiChuyenLop.tsx:43`.
- Đề xuất: thay "chốt trước hết {tuần}" bằng `<Han loai="viec-van-hanh" han={hanChot}>` như dải Bàn giao. Không cần mockup.

### HL-6 · gợi ý · Từ hồ sơ lớp bấm Nhập điểm thì mất đường về hồ sơ lớp
- Trang · vai: hồ sơ lớp → Nhập điểm → `/test/diem-lop?lop=3&luot=mt:3` · QL
- Thấy: trang Điểm theo lớp không có "‹ Hồ sơ lớp MB FT 101" (chỉ còn nút trình duyệt / bấm lại menu) · Đúng ra (CLAUDE.md): "Quay lại về đúng nguồn".
- Đề xuất: khi mở từ hồ sơ lớp, Điểm theo lớp hiện "‹ Hồ sơ lớp {mã}" (dùng chồng nguồn Quay lại đã có của OV-5). Không cần mockup (thêm link theo mẫu `DuongVe`).
- Ảnh: `$SP/anh/hoc-vien-lop/d-nhapdiem-QL-3.png`

### HL-7 · gợi ý (chữ) · "Tuần này là tuần học 1 của lớp" đứng cạnh nút "Tuần này"
- Trang · vai: Thông tin lớp › Lịch Test của lớp › Sửa · QL, lớp 19 (khai giảng W2 SEP, hôm nay W3 SEP = tuần 2)
- Thấy: câu gợi ý đọc như "tuần hiện tại là tuần 1" (sai, đang tuần 2/10 ngay dòng trên) · Đề xuất: "Tuần khai giảng = tuần học 1 của lớp." (`web/src/modules/classes/ClassProgressPanel.tsx:148`). Không cần mockup.
- Ảnh: `$SP/anh/hoc-vien-lop/e-ttlop-QL-19-sua.png`

### HL-8 · thừa (OV-10a/10b) · Admin thấy chip + badge việc của GV/QL mà bảng của Admin không có cột giải thích
- Trang · vai: `/hoc-vien`, `/hoc-vien/lop/10` · ADMIN (22)
- Tái hiện: `/hoc-vien` Admin có chip "Cần làm 2 · Chờ duyệt 1 · Đang SOS" và badge đỏ "1 HV quá hạn việc" (cả đầu hồ sơ lớp CP FT 110). Bấm badge → `?view=qua-han&classId=10` → dòng Hồ Thanh Tùng chỉ có "MT3 · W3 AUG · 4/4 ô có điểm · Ô chưa nhập —": không thấy việc gì quá hạn, Admin cũng không làm được (việc Case).
- Đúng ra: plan.md mục 3 (13/10) "Hiển thị theo vai: TVV / CX / Admin thấy cột, khối … theo việc của vai". Đầu hồ sơ lớp đã lọc badge cho TVV/CX (`DauTrangLop.tsx:103-104`) nhưng chưa cho Admin; trang `/hoc-vien` không lọc (`StudentsPage.tsx:130`, `345-352`).
- Đề xuất: Admin chỉ giữ chip Tất cả · Thiếu thông tin (hoặc thêm "Còn ô chưa nhập"), bỏ badge `qua-han` / `cho-duyet` / `xep-lop` cho Admin như TVV/CX. Không cần mockup (ẩn chip/badge).
- Ảnh: `$SP/anh/hoc-vien-lop/a-hv-ADMIN-1440-dark.png`, `h-admin-qua-han.png`

### HL-9 · lỗi · Lọc theo một lớp (badge "n HV quá hạn việc", "Thiếu n thông tin") thì số trên chip vẫn là số cả trang
- Trang · vai: `/hoc-vien?view=qua-han&classId=…` · QL, GVBM (mọi vai dùng trang theo lớp)
- Tái hiện: (1) QL `/hoc-vien` → hàng MB FOU 15 badge "1 HV quá hạn việc" → trang mở với chip "Lớp MB FOU 15 ✕" · **"Quá hạn 7"** · "Tất cả 100" · "Thiếu thông tin 46" nhưng chỉ **1** em hiện. (2) GVBM 9 hồ sơ lớp MB FT 101 badge "6 HV quá hạn việc" → `/hoc-vien?view=qua-han&classId=3` → chip **"Quá hạn 12"**, 6 em hiện. Badge đầu hồ sơ lớp "Thiếu n thông tin" (`?view=thieu_tt&classId=`) cùng lỗi.
- Thấy: badge nói 1, chip nói 7, danh sách 1 · Đúng ra: brief + CLAUDE.md "số trên chip = số em hiện ra; cùng số liệu cùng nguồn".
- Nguyên nhân: `web/src/modules/students/StudentsPage.tsx:128` `demLoc(data?.hocVien ?? [], khung)` không lọc `chiLop` (lọc lớp chỉ áp ở `lopHien`, dòng 147-148).
- Đề xuất: `demLoc(data.hocVien.filter(h => !chiLop || h.classId === chiLop), khung)`. Không cần mockup.
- Ảnh: `$SP/anh/hoc-vien-lop/y-ql-quahan-lop16.png`

### HL-10 · lỗi (mâu thuẫn) · Lớp đã kết thúc ghi "chỉ xem" nhưng khối điểm cuối trang vẫn sửa điểm được
- Trang · vai: `/hoc-vien/lop/1` sau khi QL ⋯ › Kết thúc lớp (MB FOU 03) · QL
- Tái hiện: Kết thúc lớp → hồ sơ hiện dải "Lớp đã kết thúc W3 SEP — chỉ xem", tab Tổng kết, ⋯ chỉ còn "Mở lại lớp" → kéo xuống khối "Điểm Test của lớp" (mở sẵn): ô tổng + nút "Điền cả cột" bật; bấm ô L của Nguyễn Minh An → hộp "Sửa Listening · Đang lưu 28/40 · Giá trị mới · Lý do (tuỳ chọn)" → Lưu → `PUT /regular/attempts/2/scores/listening` **200** (28 → 29). Điểm Final của lớp đã đóng đổi, kết quả lớp (Tổng kết, bản chụp lộ trình) đổi theo.
- Đúng ra: CODE_MAP "Lớp đã kết thúc — chế độ chỉ xem (mọi cờ viewer `false`)"; dải trên cùng trang nói "chỉ xem". (plan.md 13/10 "Sửa sau khi lưu" chưa nói gì về lớp đã kết thúc — **chủ SP chốt**: khoá, hay cho QL sửa có lý do như MT cũ T22.)
- Nguyên nhân: `web/src/modules/classes/ClassOverviewPage.tsx:142` gắn `KhoiDiemLop` theo `coTheXemDiem`, không truyền trạng thái lớp; `DiemTheoLop gon` + `saveScore` lớp thường không kiểm `classes.status = 'finished'`.
- Đề xuất: lớp `finished` → bảng điểm chỉ đọc (không ô tổng / Điền cả cột / hộp sửa) và máy chủ từ chối ghi; hoặc nếu chủ SP muốn cho sửa thì bỏ chữ "chỉ xem" và bắt lý do. Không cần mockup.
- Ảnh: `$SP/anh/hoc-vien-lop/q-ketthuc-1-hoso.png`, `r-sua-diem-kt-QL-1.png`

### HL-11 · lỗi (OV-10b ↔ OV-2b) · Sửa thông tin MỘT em thiếu ngày sinh: chỉ thêm SĐT cũng bị chặn; Sửa cả lớp thì cho
- Trang · vai: ⋯ dòng / hồ sơ HV › Sửa thông tin · QT 1, CX 24 (em Lê Thu Thảo · BC ELE 01, chưa có ngày sinh)
- Tái hiện: mở Sửa thông tin → chỉ gõ "SĐT em" 0912000111 → Lưu → "1 ô cần sửa ↑", ô Ngày sinh đỏ "Em chưa có ngày sinh — điền để lưu"; không gửi request nào.
- Thấy: không lưu được liên hệ khi chưa biết ngày sinh · Đúng ra: plan.md mục 3 (11/10) "Email + ngày sinh bắt buộc khi thêm/sửa, **không chặn việc khác**"; OV-10b liên hệ "không bắt nhập… thường TVV nhập"; Sửa cả lớp máy chủ đã miễn: "chỉ sửa liên hệ thì không đòi ngày sinh" (`server/src/classes/suaCaLop.ts:142`). Hai cửa cùng việc, hai luật.
- Nguyên nhân: `web/src/modules/students/StudentManagePanel.tsx:446` luôn `if (!dob) loi.push('ngay-sinh')`.
- Đề xuất: chỉ đòi ngày sinh khi dòng có sửa trường ngoài liên hệ (cùng điều kiện `LIEN_HE` của `suaCaLop.ts`), kiểm cả `PATCH /students/:id`. Không cần mockup.
- Ảnh: `$SP/anh/hoc-vien-lop/w-QT-chi-sdt.png`

### HL-12 · gợi ý (mặc định hiển nhiên) · Hộp Lộ trình lớp thường: không điền sẵn tuần, câu lỗi sai nghĩa, lớp chi nhánh khác đứng đầu
- Trang · vai: `/hoc-vien/lop/6?che-do=lo-trinh` › bấm ô Lộ trình của em · QL
- Tái hiện: chọn "Lên FT" → ô Lớp chuyển đến xếp A→Z: **BC FT 205, CP FT 110, HD FT 302** trước các lớp MB (QL MB dễ chọn nhầm); "Tuần bắt đầu" trống; bấm Chốt → "Tuần bắt đầu phải từ tuần sau trở đi" (ô đang trống, không phải tuần sai). Nhập 21/09 + Target → chốt được, MT0 W3 SEP tạo đúng, hạn bàn giao 20/09 đúng luật Final.
- Đúng ra: CLAUDE.md "Mặc định làm điều hiển nhiên" — lớp FT đã điền sẵn (`dienSanChuyenTiep`).
- Nguyên nhân: `web/src/modules/classes/BangLoTrinhTiep.tsx:370` `useState(goc?.tuan ?? '')`; câu ở `shared/domain/chuyenLop.ts:167` dùng chung cho trống và sai.
- Đề xuất: điền sẵn tuần sau tuần Final (`kh.tuanKetThuc + 7`); trống → "Chọn tuần bắt đầu."; lớp cùng chi nhánh lên đầu ô chọn. Không cần mockup.
- Ảnh: `$SP/anh/hoc-vien-lop/j-lotrinh-QL-6-sau-chot.png`

### HL-13 · gợi ý (chữ) · "n/4 môn" mang hai nghĩa
- Trang · vai: hồ sơ lớp thường · QL
- Thấy: bảng Lộ trình tiếp theo cột Progress "3/4 môn" = **số môn có điểm** (`BangLoTrinhTiep.tsx:157`); tab Tổng kết lớp đã kết thúc "1/4 môn" = **số môn đạt**; trang nhập điểm "1/3 môn đạt". Cùng hình, khác nghĩa.
- Đề xuất: bảng Lộ trình ghi "3/4 môn có điểm" (hoặc "chưa đủ điểm"). Không cần mockup.

### HL-14 · gợi ý · Tìm không ra em thì mất nút "+ Học viên"
- Trang · vai: `/hoc-vien?q=khongcoai` · QL
- Thấy: đầu trang còn "+ Lớp mới · ⋯", nút "+ Học viên" biến mất (đúng lúc vừa tìm không thấy em, cần thêm) · Nguyên nhân: `StudentsPage.tsx:186` hiện nút khi `rows.some(r => r.viewer.coTheSuaHocVien)` — rows đã lọc theo ô tìm.
- Đề xuất: cờ trang `coTheThemHocVien` (như `coTheTaoLop`) không phụ thuộc kết quả tìm. Không cần mockup.

### HL-15 · gợi ý · Mở hồ sơ lớp ngoài phạm vi: chỉ có "Thử lại", không đường về
- Trang · vai: `/hoc-vien/lop/28` · GVCN 7 (lớp không dạy)
- Thấy: "Lớp này nằm ngoài phạm vi bạn được xem. Bạn chỉ thao tác được trong lớp mình được phân công. [Thử lại]" — Thử lại luôn 403, không có "‹ Học viên & Lớp" · Đúng ra: CLAUDE.md "bị chặn thì nói lý do + bước tiếp theo".
- Đề xuất: lỗi 403 ở hồ sơ (lớp / HV) thay "Thử lại" bằng nút về trang cha. Không cần mockup.
- Ảnh: `$SP/anh/hoc-vien-lop/y-gvcn-lop28.png`

### HL-16 · gợi ý (chữ) · Một việc hai tên: ⋯ "Chuyển tiếp lớp" mở panel "Chuyển lớp · MB FT 101 · 33 em"
- Trang · vai: hồ sơ lớp FT › ⋯ › Chuyển tiếp lớp · QL · Đề xuất: thống nhất một tên (CLAUDE.md "một khái niệm một tên"). Không cần mockup.

### HL-17 · gợi ý · Mở lại lớp khi đang ở tab Tổng kết → 404 nền
- Trang · vai: `/hoc-vien/lop/1` (đã kết thúc) › ⋯ Mở lại lớp · QL · Thấy: `GET /api/classes/1/tong-ket` 404 "Lớp chưa kết thúc" ngay sau khi mở lại (tab Tổng kết còn gắn một nhịp). Không thấy chữ lỗi trên màn. Đề xuất: sau Mở lại, xoá `tab` khỏi URL trước khi tải lại.

### HL-18 · gợi ý (375) · Vùng bấm nhỏ
- 375 sáng, QL/GVCN: không tràn ngang ở `/hoc-vien`, hồ sơ lớp FT/thường, cách xem Lộ trình / Cần hỗ trợ; 3 panel (Thông tin lớp, Sửa thông tin HV, Thêm HV) phủ đủ màn 375×812. Riêng nút "+k" của dòng GV bộ môn đầu hồ sơ lớp cao 16 px, không có vùng mở rộng (`DauTrangLop.tsx:223`); badge "Thiếu n" ở dòng em cao 21 px. Đề xuất: thêm vùng bấm 44 px như `Nhan`/`MenuDong`.
- Ảnh: `$SP/anh/hoc-vien-lop/u375-QL-lop-thuong.png`, `u375-GVCN-hv-ft.png`

### HL-19 · thừa / chặn mềm · Em "Đã kết thúc học" chưa lưu trữ không nằm ở danh sách nào của QL
- Trang · vai: `/hoc-vien`, `/hoc-vien/luu-tru`, hồ sơ lớp MB FT 101 · QL 2 (so với CX 24)
- Tái hiện: demo có Ngô Thanh Tùng (#96, `status = finished`, `archived_at` NULL, lớp cuối MB FT 101). QL: `/hoc-vien` tìm "Ngô Thanh Tùng" → rỗng; Lưu trữ → 0 HV; roster MB FT 101 không có em. Chỉ ra ở ô tìm đầu trang (`/students?q=`). CX cùng chi nhánh MB: "Tất cả **102**" (có em này + Vũ Thu Uyên của HL-1), QL "Tất cả **100**" — cùng chữ "Tất cả" hai cách đếm.
- Cũng xảy ra ngay sau Chọn nhiều › Kết thúc học: hết 5 giây Hoàn tác thì em rời danh sách lớp, chưa vào Lưu trữ (Lưu trữ đòi đã kết thúc học) — muốn Lưu trữ / Học lại / Hoàn tác kết thúc phải nhớ tên để tìm.
- Đúng ra: CLAUDE.md "không để người dùng kẹt; làm sai thì sửa / khôi phục đường nào"; plan.md 13/10 OV-8a (QL chọn Kết thúc → Lưu trữ).
- Nguyên nhân: `server/src/classes/hocVienLop.ts:154` chỉ lấy ghi danh `e.status = 'active'`; `server/src/classes/luuTru.ts` chỉ lấy em đã lưu trữ; bảng TVV/CX (`hocVienTheoVai.ts`) lấy mọi em chưa lưu trữ.
- Đề xuất: Lưu trữ thêm nhóm "Đã kết thúc học · chưa lưu trữ" (có Lưu trữ · Học lại · Hoàn tác), hoặc Học viên & Lớp hiện em đó mờ ở lớp cuối như bảng TVV/CX. Đổi bố cục Lưu trữ → **cần mockup** nếu thêm nhóm mới; hiện mờ trong lớp theo mẫu `row-muted` sẵn có thì không.
