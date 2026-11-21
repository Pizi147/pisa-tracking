# VH-2 · giao diện Vận hành — chuẩn bị (pha 1)

Luật N59 (+ N58 khối Phụ trách · Hạn · Theo dõi, N60 gập / mở). Mockup đã duyệt `thiet-ke/v22/van-hanh.html` + `van-hanh-ghi-chu.md`.
Nền: main `5ffc7f9b6` (đã có GV-1 #1924, GAP-MO #1922, BPXL-1 #1923). Chưa có: VH-1 (máy chủ), GV-2 (khối dùng chung + tab "Đang theo dõi").
Phạm vi thêm N62 (chủ SP 21/11, main `6928ac4be`): ô Hạng mục, lớp / HV liên quan, "+ Giao việc" ở trang Công việc, việc tay trong đúng mục.
Pha 2 chỉ bắt đầu khi PTA báo VH-1 #1929 VÀ VH-1b (máy chủ N62) đã merge.

## 1. Hiện trạng web đã kiểm (main, seed nguyên, ảnh `docs/anh/vh-2/truoc-*.png`)

| Nơi | Ai thấy | Có gì |
|---|---|---|
| `/cong-viec/van-hanh` — `TasksBoard` (`web/src/modules/worklist/MgmtTasksPage.tsx`) | Head, Quản trị (`canSeeBoard`) | trang riêng "‹ Công việc · Vận hành"; hàng 4 số bấm lọc (Quá hạn · Chờ người khác · Cần quyết định · Vừa hoàn thành 7 ngày, ✕ bỏ lọc); "+ Giao việc"; thẻ "Công việc n việc" + lọc chi nhánh; lọc Nhóm (select 4 nhóm cố định, có số) · Trạng thái (select có số) · Người phụ trách (`ChonNguoi`); bảng 5 cột Việc · Người phụ trách · Hạn · Trạng thái · Việc con, một danh sách |
| Panel xem — `NganViecVanHanh` | Head / QT / người phụ trách | nhãn trạng thái + hạn + người + "theo dõi: {một người}"; dòng hạn đã dời; Lịch sử hạn; lý do Tạm ngưng / Dừng hẳn; ghi chú; nút Cập nhật tiến độ · Sửa · + Việc con; việc con (một tầng); Lịch sử cập nhật; Case làm căn cứ ⓘ; dòng Quy chế |
| Khối Cập nhật tiến độ — `UpdateDialog` | người có `canUpdate` | chip 5 trạng thái; chặn Xong / Dừng hẳn khi còn việc con mở; Lý do (Tạm ngưng / Dừng hẳn); Cần ai hỗ trợ + Ngày xem lại (Tạm ngưng); Ghi chú |
| Sửa — `SuaViec` (view kế trong cùng panel) | `canEdit` | tên, nhóm, người phụ trách (có tên ngoài hệ thống), MỘT người theo dõi, hạn, **lý do dời hạn bắt buộc**, ghi chú |
| Tạo — `CreateTask` / `CreateTaskForm` | Head / QT; cũng mở từ "Việc quản lý" (`HoTroHocVienTab`), Báo cáo đơn vị, + Việc con | chip Việc chi nhánh / Giao GV theo lớp + kỹ năng (lớp, kỹ năng, tuần — sinh Case); tên; nhóm; người phụ trách; một người theo dõi; hạn `ONgay`; chi nhánh; ghi chú; khoá gửi một lần mở |
| Công việc › tab "Việc quản lý" (Head) | Head | việc theo luật + cuối thẻ "+ Giao việc · Vận hành › · Họp đơn vị ›" (`HoTroHocVienTab.tsx:951`) |
| Công việc › tab Vận hành › mục **"Việc được giao"** (GV…) | người được giao, không có bảng | `/my-work` nhóm `mgmt` → mục `giao`, gập / mở `DaiNhom` (GAP-MO), vạch theo hạn; dòng "Cập nhật" mở `NganViecVanHanh` tại chỗ (`PanelViec.tsx:178`) |

Lỗi thấy khi chụp (sửa trong VH-2 vì cùng dòng): thẻ phụ dòng "Việc được giao" lặp lại đúng tên việc (vd "Giáo trình BE — Reading" hai lần); việc con không ghi "việc con của …".

## 2. Bảng truy vết khung → thành phần / tệp → ảnh nghiệm thu

| Khung | Thành phần mockup | Tệp / thành phần web sẽ sửa | Ảnh nghiệm thu (`docs/anh/vh-2/`) | GIỮ / BỎ / MỚI |
|---|---|---|---|---|
| V1 | đầu trang "Công việc" + Nhóm… + "+ Giao việc" | `TasksBoard` (đầu) — xem [XM-1] | `cap-v1-1440-toi.png`, `cap-v1-375-sang.png` | MỚI nút Nhóm… |
| V1 | dải 4 số | `TasksBoard` hàng số → kiểu "dải số chuẩn" (`oso`) | như trên | GIỮ (đổi dáng) |
| V1 | thẻ "Việc vận hành · n việc" + chi nhánh | `Card` + `BranchFilter` | như trên | GIỮ (đổi tên thẻ "Công việc" → "Việc vận hành" theo mockup) |
| V1 | hàng lọc Nhóm · Trạng thái · Người phụ trách | select Nhóm đọc nhóm tự đặt (VH-1) thay `TASK_GROUPS`; 2 lọc còn lại giữ | như trên | GIỮ |
| V1 | hàng nhóm `<tr class="nh">` trong `tbody`, cả hàng là nút, chevron, "n việc · m quá hạn", "Không phân loại" cuối vạch xám | thành phần mới trong `MgmtTasksPage.tsx` (hàng nhóm của bảng), nhớ gập / mở theo người như GAP-MO (dùng lại khoá / hàm nhớ của `DanhSachViec`) | như trên + `bam-v1-gap.png` | MỚI |
| V1 | dòng phụ "↻ hằng tuần · thứ Hai · 1 tệp"; cột người "+n theo dõi" | ô Việc / ô Người phụ trách | như trên | MỚI |
| V1 | cột Hạn, Trạng thái, Việc con "x/y xong" + việc con quá hạn | giữ logic hiện tại | như trên | GIỮ |
| V2 | panel tạo 736: đoạn Việc chi nhánh / Giao GV theo lớp + kỹ năng | `CreateTaskForm` | `cap-v2-1440-toi.png`, `cap-v2-375-sang.png` | GIỮ |
| V2 / V2b | Nhóm: ô chọn có tìm, "Không phân loại" cuối, ✕ bỏ | thay `<select>` bằng ô chọn có tìm sẵn có (dạng `ChonLop` / `ChonNguoi`) | `cap-v2b-1440-toi.png` | ĐỔI |
| V2 | Loại việc Trong kỳ / Dài hạn | thêm chip (máy chủ đã có `taskType`) | `cap-v2` | MỚI trên form (đang ngầm theo mặc định) |
| V2 | Người phụ trách (một) · Hạn `ONgay` | `ChonNguoi`, `ONgay` giữ | `cap-v2` | GIỮ |
| V2 | Người theo dõi nhiều (chip, người giao tự vào) | ô chọn nhiều — dùng thành phần của GV-2 nếu có, không viết bản hai | `cap-v2` | ĐỔI (một → nhiều) |
| V2 | Việc con: dòng tên · người · hạn · ✕, "+ Việc con" | phần mới trong `CreateTaskForm` | `cap-v2` | MỚI |
| V2 / V2c | Lặp lại: Không · Hằng tuần (T2…CN) · Hằng tháng (ngày) | phần mới, chip `NutChon` | `cap-v2c-1440-toi.png` | MỚI |
| V2 | Tệp: "+ Thêm tệp", dòng tệp ✕ | `TepCho` (tệp chờ, tải sau khi có id — luật `attachments.ts`) | `cap-v2` | MỚI |
| V2 | dòng Quy chế lặp ⓘ; chân Chưa lưu · Huỷ · Giao việc | `KhungPanel quyChe` + `chan` | `cap-v2` | GIỮ (chữ nút "Tạo" → "Giao việc") |
| V2d | thiếu tên báo tại ô | `useLoiForm` sẵn có | `cap-v2d-1440-toi.png` | GIỮ |
| V3 | đầu panel: nhóm, ⋯ (Sửa công việc, Xoá), tên + hạn, ngữ cảnh "Trong kỳ · CN · {người} giao {ngày}" | `NganViecVanHanh` | `cap-v3-1440-toi.png`, `cap-v3-375-sang.png` | ĐỔI (Sửa vào ⋯) |
| V3 | khối Phụ trách · Hạn · Theo dõi (Đổi, Sửa hạn, ✕ / +) | thành phần GV-2 — chờ | `cap-v3` | MỚI (thay nhãn rời + "theo dõi: một người") |
| V3 | Trạng thái + "Cập nhật tiến độ" | `UpdateDialog` giữ nguyên luật | `cap-v3` | GIỮ |
| V3 / V3b | dòng Lặp lại + Dừng lặp, Hoàn tác 10 giây | phần mới | `cap-v3b-1440-toi.png` | MỚI |
| V3 | Việc con: ô tick · tên · người · hạn, "+ Việc con" | danh sách việc con (đổi dáng), tick = cập nhật Xong việc con | `cap-v3` | ĐỔI |
| V3c | đóng việc cha còn việc con mở → hỏi một lần "Xong cả n việc" | hiện tại CHẶN (Alert) — xem [XM-3] | `cap-v3c-1440-toi.png` | xem [XM-3] |
| V3 | Tệp: tải về / bỏ / + Thêm tệp | `BangChung` (ownerType mới từ VH-1) | `cap-v3` | MỚI |
| V3 | Lịch sử · n (gập) | gộp Lịch sử hạn + Lịch sử cập nhật + giao / theo dõi / lặp vào một `details` | `cap-v3` | ĐỔI |
| V3 | (mockup không vẽ) Case làm căn cứ ⓘ, lý do Tạm ngưng / Dừng hẳn | giữ | — | GIỮ |
| V4 / V4b | hộp "Nhóm công việc": Đổi tên tại dòng (Enter / Esc), ▲▼, Ẩn / Hiện, + Nhóm mới, "Không phân loại · luôn cuối", Hoàn tác 10 giây | thành phần mới `HopNhomViec` (trong `MgmtTasksPage.tsx` hoặc tệp riêng nếu > 150 dòng) | `cap-v4-1440-toi.png`, `cap-v4b-1440-toi.png`, `cap-v4-375-sang.png` | MỚI |
| V5 | tab Vận hành › mục "Việc được giao": vạch con = nhóm (thứ tự Head sắp, Không phân loại cuối); dòng: tên · "{người} giao" / "việc con của {tên}" · "1/3 việc con" · ↻ · hạn · Cập nhật | `DanhSachViec` / `HoTroHocVienTab` (vạch theo nhóm cho mục `giao`) + dữ liệu `/my-work` | `cap-v5-1440-toi.png` | ĐỔI (vạch theo hạn → theo nhóm) |
| V5 | panel người được giao: khối ba dòng, việc con của tôi tick được, chip trạng thái, ô Cập nhật, Tệp (thêm được), Lịch sử, chân Đóng · Lưu | `NganViecVanHanh` theo vai (người phụ trách không có ⋯) | `cap-v5` | ĐỔI |
| V5 | mục "Vận hành" đang có (Bàn giao, Báo cáo PH) | giữ | `cap-v5` | GIỮ |
| V5 | BPXL: "Việc được giao" là TAB riêng (ĐÃ CHỐT) | `nhanTabCv` / nhóm tab — kiểm sau BPXL-2 / GV-2 | ảnh BPXL 1440 | MỚI |
| V6a | 375 Việc được giao (nút ẩn, chạm cả dòng) | dòng chuẩn 375 sẵn có | `cap-v6a-375-sang.png` | GIỮ dáng chuẩn |
| V6b | 375 panel toàn màn, "‹ Công việc", chân dính đáy | `KhungPanel` 375 sẵn có | `cap-v6b-375-sang.png` | GIỮ |
| V6c | 375 Head: hàng nhóm giữ, mỗi việc một thẻ (tên · người · hạn · trạng thái), không cuộn ngang; Nhóm… vào ⋯ đầu trang | bảng có dạng thẻ dưới `sm` (hiện tại `minWidth 52rem` cuộn ngang) | `cap-v6c-375-sang.png` | ĐỔI |
| — | Ảnh TRƯỚC | — | `truoc-*.png` (9 ảnh, đã chụp) | — |
| N62 | form V2: ô **Hạng mục** sau Tên — ô chọn có tìm, hai nhóm có tiêu đề: **Chính thống** (các mục của Công việc theo thứ tự `MUC_CV`: Xếp lịch họp, Báo PH, Ý thức & Phối hợp, Chấm điểm, Case học thuật, Sau thi, Chốt ngày thi, Bổ sung hồ sơ…) │ **Tự đặt** (nhóm Vận hành + "Không phân loại" cuối). Gộp ô Nhóm của V2 vào ô này (một ô, không hai) — [XM-6] | `CreateTaskForm` (thay ô Nhóm V2b bằng ô Hạng mục cùng dáng, thêm vạch tiêu đề nhóm trong danh sách); nhãn mục lấy từ `MUC_CV` (`shared/domain/tongQuan.ts`, cần export nhãn) | `cap-n62-hang-muc-1440-toi.png` (ô mở) | MỚI |
| N62 | ô **Mô tả** (tuỳ chọn) | ô "Nội dung" của V2 đổi nhãn "Mô tả" (một ô, map vào `note`) | `cap-v2` | ĐỔI nhãn |
| N62 | ô **Lớp / HV liên quan** (tuỳ chọn) | `ChonLop` + ô chọn em có tìm sẵn có (`/tim/hoc-vien`, cùng ô của `NutTask`) — đặt hàng hai cột cạnh nhau sau Người theo dõi | `cap-v2` | MỚI |
| N62 | nút **"+ Giao việc"** ở đầu trang Công việc cạnh "+ Task" (Head, Quản trị, CX) | `HoTroHocVienTab` đầu trang (chỗ `NutTask`), mở đúng `CreateTask` đang dùng ở dòng 806; lối cuối thẻ "Việc quản lý" (`LoiVanHanh`) GIỮ | `cap-n62-cong-viec-1440-toi.png`, `-375-sang.png` | MỚI |
| N62 | việc tay có hạng mục chính thống hiện TRONG đúng mục của người nhận, nhãn "{tên} giao", mục tự hiện | `mucCuaViec` (`tongQuan.ts`) xếp dòng `mgmt` có `hangMuc` vào mục đó; dòng dùng thẻ "{tên} giao" (cùng thẻ GV-1 / V5); bấm mở `NganViecVanHanh` như dòng mgmt hiện tại | `cap-n62-gv-muc-1440-toi.png` (vd việc tay trong Báo PH) | MỚI |

## 3. Thao tác TRƯỚC → SAU (mọi thao tác cũ phải GIỮ)

| Thao tác | Trước | Sau VH-2 |
|---|---|---|
| Hàng 4 số bấm lọc, bấm lại bỏ lọc, tự chuyển Trạng thái "Mọi trạng thái" | có | GIỮ |
| "+ Giao việc" | có | GIỮ (cạnh "Nhóm…") |
| Lọc chi nhánh · Nhóm · Trạng thái (có số) · Người phụ trách (gồm "Tôi") | có | GIỮ; Nhóm đọc nhóm tự đặt + Không phân loại |
| Đường dẫn `?open=` · `?tao=1&nhom=&baoCao=&periodId=` (Báo cáo đơn vị) · `?mo-viec=` · `viec=mgmt:` | có | GIỮ (`nhom=` cũ là khoá chuỗi — cần ánh xạ sang id nhóm, hỏi VH-1) |
| Bấm dòng / Enter / Space mở panel | có | GIỮ |
| Việc con "x/y xong" + "quá hạn: …" | có | GIỮ |
| Bảng một danh sách | có | chia theo nhóm, hàng nhóm gập / mở, nhớ theo người |
| Cập nhật tiến độ (5 trạng thái, Lý do, Cần ai hỗ trợ, Ngày xem lại, Ghi chú) | có | GIỮ |
| Sửa công việc (tên, nhóm, người, hạn, ghi chú) | nút "Sửa" | GIỮ trong ⋯ (V3); người + hạn chuyển sang khối ba dòng |
| Sửa hạn | chỉ Head, lý do bắt buộc | Head + người phụ trách, lý do tuỳ chọn, có lịch sử (N59) |
| Người theo dõi | MỘT | nhiều; thêm / bỏ tại khối ba dòng |
| Người phụ trách "tên ngoài hệ thống" | có | GIỮ — [XM-4] |
| + Việc con (từ panel việc cha) | có | GIỮ; thêm việc con ngay khi tạo việc cha |
| Đóng việc cha còn việc con mở | chặn | [XM-3] |
| Giao GV theo lớp + kỹ năng (lớp, kỹ năng, tuần, sinh Case) | có | GIỮ nguyên |
| Chọn chi nhánh khi tạo (Toàn hệ thống / CN) | có | GIỮ (mockup không vẽ — để trong form) |
| Case làm căn cứ ⓘ | có | GIỮ |
| Lặp lại · Dừng lặp · Hoàn tác | — | MỚI |
| Tệp đính kèm | — | MỚI |
| Nhóm…: tạo / đổi tên / ▲▼ / ẩn / hiện | — | MỚI |
| CX tạo / giao | — | MỚI (theo quyền VH-1) |
| Người được giao: Việc được giao chia theo nhóm, tick việc con của mình | phẳng theo hạn | chia theo nhóm |
| "+ Giao việc" từ trang Công việc (N62) | chỉ ở cuối thẻ "Việc quản lý" (Head) + bảng Vận hành | thêm nút đầu trang cạnh "+ Task" cho Head / Quản trị / CX; lối cũ GIỮ |
| Chọn nơi việc hiện (N62) | chỉ 4 nhóm cố định → luôn ở "Việc được giao" | ô Hạng mục: mục chính thống → việc nằm trong mục đó ở Công việc người nhận; tự đặt / bỏ trống → tab Vận hành |
| Gắn lớp / HV cho việc tay (N62) | — | MỚI, tuỳ chọn |
| "+ Task" của GV (Case · Vi phạm / Nhắc nhở · Tình hình) | có | GIỮ nguyên, GV không có "+ Giao việc" |

## 4. Dữ liệu / API cần từ VH-1 (pha 2 đọc mô tả PR VH-1, không đoán)

| Khung | Cần |
|---|---|
| V1 | `GET /mgmt-tasks` mỗi dòng thêm: `groupId` (null = Không phân loại), `soTheoDoi`, `lap` (`{kieu:'tuan', thu:[…]} \| {kieu:'thang', ngay}` \| null), `soTep`; `facets.group` theo id; danh sách nhóm (id, tên, thứ tự, ẩn) trả kèm — không request thứ hai; `canEdit` đúng cho CX; quyền "Nhóm…" (`canNhom`?) |
| V2 | `POST /mgmt-tasks` nhận `groupId`, `taskType`, `theoDoi: id[]`, `viecCon: [{title, assigneeUserId, due}]`, `lap`; trả `id` (để tải tệp sau); người giao tự vào theo dõi ở máy chủ |
| V2 / V3 / V5 | ownerType tệp cho việc Vận hành trong `platform/attachments.ts` (`OWNER_TYPES`) + quyền: người phụ trách / người giao / Head thêm, người theo dõi chỉ xem |
| V3 | `GET /mgmt-tasks/:id` thêm: nhóm (tên), người giao + lúc giao, `phuTrach` / `theoDoi` theo hình khối GV-2 (`/giao-viec/van_hanh/:id`?), `lap` + bản tới, `viewer.suaHan`, lịch sử gộp (giao, theo dõi, hạn, tạo bản lặp, cập nhật) |
| V3 | đổi người / sửa hạn (lý do tuỳ chọn) / thêm-bỏ theo dõi: dùng đường chung `/giao-viec/:loai/:id/*` với `loai='van_hanh'` hay đường riêng `/mgmt-tasks` — theo VH-1 |
| V3b | `POST /mgmt-tasks/:id/dung-lap` + hoàn tác |
| V3c | đóng cha kèm đóng con một lần (nếu PTA chốt [XM-3]) |
| V3 | tick việc con = `POST /mgmt-tasks/:subId/update {progress:'done'}` (đã có) |
| V4 | `GET/POST/PATCH` nhóm: tạo, đổi tên, thứ tự (▲▼), ẩn / hiện, số việc mỗi nhóm; hoàn tác |
| V5 | `/my-work` dòng `mgmt` thêm `groupId` / tên nhóm / thứ tự nhóm, "{người} giao", tên việc cha, "x/y việc con của bạn", `lap` — **không thêm dòng đọc** (`/my-work` GV sát trần), chỉ cột trên câu đang có |
| V5 BPXL | tab riêng "Việc được giao" — nhóm tab của `nhanTabCv` |
| Chuông | tin "Cập nhật" khi được giao (máy chủ VH-1, web chỉ hiện) |
| N62 · form (VH-1b) | `POST/PATCH /mgmt-tasks` nhận `hangMuc` (khoá `MUC_CV`, máy chủ kiểm) + `classId` / `studentId` tuỳ chọn; danh sách khoá hạng mục hợp lệ cùng nguồn `shared` (web không tự liệt kê riêng) |
| N62 · quyền (VH-1b) | cờ trong `session.nav` (hoặc `/my-work`) cho biết người xem được "+ Giao việc" (Head / Quản trị / CX) — không suy ở web |
| N62 · `/my-work` (VH-1b) | dòng `mgmt` thêm `hangMuc`, `giaoBoi` (tên), lớp / HV liên quan (`classCode`, `studentName` hiện có của dòng) — không thêm câu |
| N62 · panel | `GET /mgmt-tasks/:id` trả `hangMuc`, lớp / HV liên quan để hiện ở ngữ cảnh panel + sửa trong "Sửa công việc" |

## 5. [XM] — chờ PTA

- **[XM-1] Vị trí bảng Head.** Mockup V1 vẽ bảng trong trang "Công việc" có hàng tab (Chờ bạn duyệt · Hỗ trợ học viên · Vận hành · Đang theo dõi). Web hiện tại: bảng là trang riêng `/cong-viec/van-hanh` ("‹ Công việc · Vận hành"), còn Công việc của Head có tab "Việc quản lý" với lối "Vận hành ›" (OV-15d). Đề xuất: GIỮ đường `/cong-viec/van-hanh` (không đổi điều hướng trong PR này), áp HÌNH ẢNH khung V1 cho phần thân (đầu thẻ, nút Nhóm… + "+ Giao việc", dải số, lọc, bảng). Gộp vào tab là đổi bố cục màn Công việc — PR riêng nếu chủ SP muốn.
- **[XM-2] Khối Phụ trách · Hạn · Theo dõi** chưa có trong main (GV-2). Pha 2 chờ GV-2 merge; không viết bản hai.
- **[XM-3] Đóng việc cha còn việc con mở.** Ghi chú mockup ghi "GIỮ (⋯ / hộp hỏi một lần)" và V3c vẽ "Xong cả 3 việc", nhưng web hiện tại CHẶN (Q11: "Còn n việc con chưa khép lại"). Đổi chặn → hỏi một lần cần máy chủ VH-1 đóng cả con. Theo mockup đã duyệt: làm hộp hỏi nếu VH-1 có đường; không có thì GIỮ chặn và ghi KHÁC.
- **[XM-4] "Dùng tên ngoài hệ thống"** ở Người phụ trách (PR-DUYET) mockup không vẽ; N59 "giao cho ai có tài khoản ở chi nhánh". Đề xuất GIỮ cho việc cũ đang có tên ngoài, hỏi PTA có bỏ ở form tạo mới không.
- **[XM-5] Nút "Sửa"** chuyển vào ⋯ (V3: "Sửa công việc, Xoá"). Hiện web KHÔNG có Xoá việc Vận hành; không thêm Xoá nếu VH-1 không có đường.

- **[XM-6] (N62) Ô Nhóm (V2) và ô Hạng mục.** Đề xuất GỘP thành MỘT ô "Hạng mục" (hai nhóm Chính thống │ Tự đặt), vì nhóm tự đặt chính là phần "Tự đặt"; hai ô cạnh nhau dễ chọn mâu thuẫn. Hỏi: việc có hạng mục chính thống có cần thêm nhóm tự đặt không (để hiện ở bảng Vận hành của Head) — nếu không, ở bảng Head việc đó vào hàng nhóm nào? Đề xuất: bảng Head có thêm hàng nhóm theo tên hạng mục chính thống (trước "Không phân loại").
- **[XM-7] (N62) "+ Giao việc" ở 375.** "+ Task" 375 là nút tròn nổi trên thanh dưới. Head / CX không có "+ Task" → đề xuất "+ Giao việc" thành nút đầu trang (như V6c); người vừa có "+ Task" vừa "+ Giao việc" (vd Head kiêm GV) thì "+ Giao việc" vào ⋯ đầu trang. Không có mockup — dùng mẫu V6c.
- **[XM-8] (N62) Bảng Vận hành có còn chứa việc tay hạng mục chính thống không?** Đề xuất CÓ (bảng Head là nơi theo dõi mọi việc tay), để Head không mất việc mình giao.

## 6. Dòng đọc (đo ở pha 2)

Bảng Head: giữ MỘT request `/mgmt-tasks` (nhóm trả kèm); panel `/mgmt-tasks/:id` một request; hộp Nhóm dùng danh sách đã nạp (chỉ tải lại sau lưu). "Việc được giao" dùng dòng `/my-work` đã nạp. Panel tệp: `BangChung` một request khi mở panel.
