# PR TU-b — Trang Tutor (Head tutor + QL) — kế hoạch

> Làm bằng `superpowers:executing-plans` ngay trong session (KHÔNG subagent), mỗi Task `superpowers:test-driven-development` (đỏ trên DB test trước).
> Model: Opus 5.5 (B: Sonnet 5.5). Không Fable. `/ponytail lite` đầu phiên.

**Mục tiêu:** Head tutor / Quản trị rà soát tutor trên trang `/tutor` (bảng + panel + nhận xét + quản lý danh sách); QL chỉ xem tutor dạy em chi nhánh mình.
**Kiến trúc:** Máy chủ một module `server/src/tutors/trang.ts` (đọc + nhận xét + thêm/sửa/xoá + gộp) và `server/src/tutors/taiLen.ts` (xem trước / lưu tệp, cùng hàm kiểm);
đường `/tutors*` trong `routes/index.ts`. Web `web/src/modules/tutor/` (khung `/tutor` của TU-a). Một hàm `canChuY` ở máy chủ cho lọc + số menu + cột lý do.
**Đặc tả:** `docs/superpowers/specs/2026-10-19-tutor-head-tutor-design.md` mục 7, 8, 11 (TU-b), 12, 13 (13 thắng). Mockup `thiet-ke/mockup-tutor-1-head-tutor-2026-10-19.html` mục 2–7 —
khác đặc tả thì theo đặc tả: kỹ năng **L · R · W1 · W2 · S**; chỉ **Tên + Kỹ năng** bắt buộc; lọc thứ tư **"Thiếu thông tin"**; Nơi dạy trống = **chưa có** (không phải Chỉ online).

## Mã TU-a thật (#475, đã đọc 20/10)
- Bảng `tutors`, `tutor_nhan_xet` + 9 cột `case_followup_buoi` + chỉ mục `idx_followup_buoi_tutor`, `idx_tutor_nhan_xet(tutor_id, luc)` (`migrate/prTu.ts`, `schema.sql`).
- Vai `head_tutor` (toàn hệ thống), `PERMISSIONS.TUTOR_VIEW` / `TUTOR_MANAGE`; QL chỉ `tutor.view`; `navOf().tutor`; route web `/tutor` → `web/src/modules/tutor/TutorPage.tsx` (khung rỗng, thay ở Task 5).
- `server/src/tutors/chon.ts` (`GET /tutors/chon`); luật chung `shared/domain/paDongBo.ts`: `TIEU_CHI_TUTOR`, `KN_TUTOR`, `hinhThucTuSuy`. `normalizeName` (bỏ dấu) ở `server/src/util.ts`.
- **Chưa có** hàm chuẩn hoá SĐT → Task 3 thêm `chuanSdt` ở `shared/domain/paDongBo.ts` (web hộp Thêm dùng chung).
- Seed: 8 tutor (`tuSeed.ts`, Bùi Quang Minh thiếu SĐT + nơi dạy, Hồ Ngọc Lan Chỉ online), Head tutor "Hoàng Thị Hà" (id cuối seed), Đặng Thu Hà "Ngừng";
  buổi pb2b: Nguyễn Thu Lan (4 sao) + "Ms Mai" gõ tay (Không tài liệu, 2 sao); duyệt: "Mr Long" gõ tay (Không feedback). Tests tìm Head tutor qua `user_roles` như `prTu.tests.ts`.

## Ràng buộc chung
- Mọi `/tutors*` kiểm quyền máy chủ: đọc = `tutor.view`; ghi (thêm/sửa/xoá/tải/gộp/nhận xét) = `tutor.manage`. QL phạm vi = chi nhánh trong grant (`scopeFor`).
- QL chỉ thấy **buổi có `lop_id` thuộc chi nhánh mình**; số liệu chỉ tính các buổi đó; nhận xét Head tutor đọc được. Head tutor không mở được HV / Case / điểm (đã chặn ở TU-a, kiểm lại).
- Turso: không tham số đặt tên, ≤ 900 tham số (gộp / tải lên chia mẻ), `BEGIN IMMEDIATE`, không `SELECT *`, mỗi đường mới có dòng trong `server/src/tests/tocDoDuong.ts` + trần.
- Ngày buổi = `case_followups.created_at` theo giờ VN (dùng hàm đổi giờ VN đang có — grep `+7 hours` / `ngayVn`). Khoảng = `khoangTuThamSo` / `khoangTuUrl` (OV-15e).
- Màn: mã tuần ở bộ chọn; ngày chỉ ở nhật ký nhận xét / buổi (dd/mm). Trạng thái không chỉ bằng màu (✓/✗ + chữ, ⚠ + chữ). 375: bảng → thẻ, nút 44 px. EN đủ (`t()` + từ điển).
- Bảng không có chữ đếm phụ dưới số (Q13). Không thêm việc, thông báo, số ở Tổng quan / Phân tích.

## Review Focus (đã gắn phép kiểm vào Task)
1. SĐT từ Excel ở dạng số mất số 0 đầu (`912345678`) → coi là `0912345678` (Task 4, TUB-4f). Tự quyết, ghi mô tả PR.
2. Buổi ghi lúc 23:30 giờ VN phải rơi vào ngày VN, không ngày UTC trước (Task 2, TUB-2d).
3. Lưu tải lên khi dữ liệu đổi sau xem trước (SĐT vừa bị người khác thêm) → lưu chạy lại cùng hàm kiểm, dòng đó thành Lỗi, các dòng khác vẫn lưu, không lưu nửa vời (Task 4, TUB-4g).
4. Hoàn tác gộp sau khi Head tutor đã gộp lại dòng đó sang tutor khác → chỉ đặt NULL dòng còn trỏ đúng tutor của lần gộp (Task 6, TUB-6b).
5. Tên gõ tay khác dấu / hoa thường / khoảng trắng thừa ("cô  Thuỷ" vs "Cô Thủy") gom một dòng; khớp tên tải lên bỏ dấu (Task 4, 6).

---

### Task 1: Hàm "Cần chú ý" + số menu
**Files:** Tạo `server/src/tutors/trang.ts`; sửa `server/src/platform/nav.ts`; kiểm `server/src/tests/prTub.tests.ts` (gọi cuối `run.ts`).
**Produces:** `canChuY(conn, o: { lopIds?: number[] | null }): Map<number, { khong: { chuanBi: number; taiLieu: number; feedbackGv: number }; saoThap: number[] }>`
(`lopIds` null = toàn hệ thống). `lyDoChuY(v): string` — câu theo loại nhiều nhất: "3 buổi không gửi feedback cho GV", "1 buổi không chuẩn bị", "1 buổi không xin tài liệu đúng hạn", "1 buổi đánh giá 2/5".
- [x] **Đỏ — TUB-1** (gọi thẳng hàm trên DB test, trong `BEGIN … ROLLBACK`): tutor A buổi `feedback_gv = 0` → có trong map, lý do "1 buổi không gửi feedback cho GV";
  ghi `tutor_nhan_xet` `luc` sau `ghi_luc` → không còn; thêm buổi `chuan_bi = 0` có `ghi_luc` sau nhận xét → vào lại; buổi `danh_gia = 2` → vào; `danh_gia NULL`, 3 ô = 1 → không;
  kết luận mới nhất `ngung` → không; sửa nhận xét (`sua_luc`) không dời mốc; dòng cũ 3 ô NULL → không; buổi **ngoài khoảng ngày** vẫn tính (mọi thời gian).
  Nav: Head tutor + Quản trị `navOf` mục Tutor có số = `canChuY(...).size`; QL không có số (PTA Plan 20/10).
- [x] Chạy `npm run build:server && node dist-server/server/src/tests/run.js` (hoặc lệnh test hiện có) → TUB-1 đỏ.
- [x] **Xanh:** một câu SQL: buổi có (`chuan_bi = 0` OR `tai_lieu = 0` OR `feedback_gv = 0` OR `danh_gia <= 2`) AND `ghi_luc > COALESCE(max(luc) nhận xét của tutor, '')`,
  bỏ tutor có kết luận mới nhất `ngung`; gom ở JS. Chạy lại → xanh.

### Task 2: Đọc bảng + panel (`GET /tutors`, `GET /tutors/:id`)
**Files:** `server/src/tutors/trang.ts`, `server/src/routes/index.ts`, `server/src/tests/tocDoDuong.ts`, `prTub.tests.ts`.
**Produces:**
- `bangTutor(p: Principal, k: KhoangNgay): { dong: DongTutor[]; goTay: { soTen: number; soBuoi: number } | null; coSua: boolean; chiNhanh: string | null }`
  `DongTutor = { id, ten, sdt, noiDay: { branchId, ten } | 'online' | null, kyNang: string[], buoi, chuanBi: [co, tl], taiLieu: [co, tl], feedbackGv: [co, tl], danhGia: number | null,
  ketLuan: { kl, luc } | null, chuY: string | null, thieu: ('sdt' | 'noiDay')[] }`. Bộ lọc + tìm + phân trang ở web (danh sách ≤ vài trăm).
  QL: tutor có ≥ 1 buổi trong phạm vi + khoảng, cộng tutor nơi dạy = chi nhánh QL (cho "Tất cả"); `thieu` rỗng, `goTay` null, `coSua` false.
- `panelTutor(p, id, k): { tutor, so (5 ô), nhanXet: { id, kl, noiDung, luc, suaLuc, nguoi, coSua }[], buoi: { ngay, hocVien, lop, nguoiGhi, kn, hinhThuc, chuanBi, taiLieu, feedbackGv, danhGia, nhanXet, nhanXetTutor }[] }`.
  QL hỏi tutor ngoài phạm vi (không buổi trong phạm vi, nơi dạy khác) → 404.
- [x] **Đỏ — TUB-2:** (a) tỉ lệ: 3 buổi trong khoảng, một buổi `tai_lieu = 0`, một dòng cũ NULL → `taiLieu = [1, 2]`… đúng mẫu "có trả lời"; `danhGia` TB 1 chữ số lẻ (4, 5 → 4.5), không có → null.
  (b) QL MB qua HTTP: thấy tutor nơi dạy Bãi Cháy có buổi `lop_id` lớp MB; `buoi` chỉ đếm buổi MB; `GET /tutors/:id` không có buổi lớp chi nhánh khác; tutor chỉ dạy chi nhánh khác → 404.
  QL chi nhánh khác (vd QL HD) gọi `GET /tutors` cùng khoảng → không có tutor / buổi chỉ của MB (máy chủ chặn phạm vi, web chỉ lọc tiếp — PTA Plan 20/10).
  (c) GV `GET /tutors` → 403; Head tutor `GET /students/{hv}` → 403. (d) buổi ghi `created_at` 16:30Z (23:30 VN) ngày cuối khoảng → tính vào khoảng.
  (e) `soCauSql` + dòng đọc: ghi số đo vào log; trần `TRAN_TUTOR_BANG`, `TRAN_TUTOR_PANEL` = max(đo + 10, ⌈đo × 1,3⌉).
- [x] Đỏ → **Xanh:** bảng = 1 câu gom theo `tutor_id` (JOIN `case_followups` lọc ngày; QL thêm `lop_id IN (lớp chi nhánh)`) + 1 câu `tutors` + 1 câu kết luận mới nhất + `canChuY`;
  `noiDay` chi nhánh tên lấy từ bảng `branches` đã nạp. Panel: buổi JOIN HV + lớp + người ghi (chỉ cột cần). Thêm dòng `DUONG_DO` (QL, QT + vai Head tutor nếu `Vai` cho phép — thêm `'HT'` nếu cần).

### Task 3: Thêm / Sửa / Xoá tutor + Nhận xét
**Files:** `trang.ts`, `routes/index.ts`, `prTub.tests.ts`.
**Produces:** `POST /tutors` `{ ten, sdt?, noiDay?: number | 'online' | null, kyNang: string[] }` → `{ id, trungTen: boolean }`; `PATCH /tutors/:id` (cùng thân);
`DELETE /tutors/:id`; `POST /tutors/:id/nhan-xet { ketLuan: 'on'|'can_cai_thien'|'ngung', noiDung }`; `PATCH /tutors/nhan-xet/:id`; `DELETE /tutors/nhan-xet/:id`. Mỗi ghi một `writeAudit`.
Hàm kiểm một tutor `kiemTutor(conn, input, boQuaId?): { ok: TutorSach } | { loi: Record<'ten'|'sdt'|'noiDay'|'kyNang', string> }` — Task 4 dùng lại.
- [x] **Đỏ — TUB-3:** chỉ tên + kỹ năng → lưu; thiếu kỹ năng → 400 tại `kyNang`; SĐT trùng → 400 "SĐT đã có: {tên}"; trùng tên → lưu + `trungTen: true`; SĐT `+84 912.345.678` → `0912345678`;
  xoá tutor có buổi → 400 (gợi ý "Ngừng hợp tác"); không buổi → xoá được. QL `POST /tutors` → 403.
  Nhận xét: < 10 ký tự → 400; người khác sửa → 403; quá 24 giờ → 400; xoá trong 24 giờ → hết dòng, `audit_logs` giữ nội dung; QL đọc được nhận xét trong panel, `coSua` false.
- [x] Đỏ → **Xanh.**

### Task 4: Tải danh sách (xem trước + lưu)
**Files:** Tạo `server/src/tutors/taiLen.ts`; `routes/index.ts`; `prTub.tests.ts`.
**Produces:** `POST /tutors/tai-len { rows: string[][], luu: boolean }` → `{ dong: { so, ten, sdt, noiDay, kyNang, kq: 'moi'|'capNhat'|'loi'|'giuNguyen', doi?: string[], loi?: string[] }[], soMoi, soCapNhat, soLoi }`.
`luu: true` = chạy lại cùng `xemTruoc` rồi ghi dòng hợp lệ trong **một** `BEGIN IMMEDIATE`, một `writeAudit`. > 500 dòng → 400.
- Tiêu đề nhận bằng bí danh (bỏ dấu, như `chuanTieuDe` của `nhapHocVien.ts`): Tên/Họ tên · SĐT/Điện thoại · Nơi dạy/Chi nhánh · Kỹ năng; không tiêu đề → thứ tự 4 cột.
- Nơi dạy: tên hoặc mã chi nhánh (bỏ dấu); "Online" / "Chỉ online" → online; trống → không đổi (Cập nhật) / chưa có (Mới). Kỹ năng: tách `,` / dấu cách / `·`; "W" = W1 + W2.
- Khớp: có SĐT → theo SĐT; không SĐT → tên bỏ dấu khớp đúng một; nhiều → lỗi "Trùng tên — thêm SĐT". Ô trống không xoá giá trị cũ.
- [x] **Đỏ — TUB-4:** (a) trùng SĐT trong tệp → lỗi cả hai dòng "Trùng SĐT với dòng n"; (b) chi nhánh lạ "Nơi dạy "Hạ Long" không có"; SĐT 7 số → lỗi; thiếu kỹ năng → lỗi;
  (c) có / không tiêu đề cho cùng kết quả; "W" → W1, W2; (d) Cập nhật ghi "Kỹ năng: R → L · R"; ô SĐT trống không xoá SĐT cũ; (e) lưu, rồi gửi lại y hệt → 0 mới, 0 cập nhật;
  (f) ô SĐT `912345678` (Excel mất số 0) → `0912345678`; (g) giữa xem trước và lưu có tutor khác lấy SĐT → dòng đó Lỗi, dòng khác lưu; 501 dòng → 400; QL → 403.
- [x] Đỏ → **Xanh** (dùng `kiemTutor` của Task 3 cho từng dòng; chèn / sửa chia mẻ ≤ 900 tham số).

### Task 5: Trang `/tutor` (web) — bảng, lọc, thẻ 375
**Files:** Tạo `web/src/modules/tutor/TrangTutor.tsx` (thay khung rỗng TU-a); sửa `web/src/lib/api.ts` (hoặc nơi gọi API hiện có), từ điển EN.
- Đầu: "Tutor" · `BoChonThoiGian` (URL `kieu/tu/den` như Phân tích) · QL: nhãn chi nhánh · Head tutor/QT: **Thêm tutor**, **Tải danh sách**.
- Lọc `BoLocDoan` có số: Cần chú ý · Đang dạy · Ngừng hợp tác · Thiếu thông tin · Tất cả (QL bỏ Ngừng + Thiếu); Nơi dạy (QL bỏ), Kỹ năng, ô tìm tên / SĐT bỏ dấu.
  Mặc định Cần chú ý nếu > 0, không thì Đang dạy; lọc trong URL `loc`.
- Bảng `usePhanTrang` + `PhanTrang` đầu / cuối; cột theo đặc tả mục 7 (QL bỏ "Cần chú ý vì"); tên + SĐT dòng phụ + "Thiếu SĐT" / "Thiếu nơi dạy" chữ nhỏ trung tính;
  số 3 cột tỉ lệ có "Không" → cam + bấm mở panel lọc sẵn tiêu chí; Ngừng hợp tác mờ; chưa buổi → "—". Dải "n tên gõ tay … · Gộp…" (Head tutor/QT).
- 375 (`sm:` trở xuống): thẻ — tên · nơi dạy · kỹ năng, ⚠ lý do, 3 ô tỉ lệ, buổi · sao · kết luận.
- Rỗng: "Không có tutor cần chú ý" / "Chưa có tutor — Tải danh sách". Lỗi tải → `ErrorState` + Thử lại.
- [x] Kiểm: `npm run typecheck`; phép kiểm HD-NAV (`prHd.tests.ts`) xanh với `data-hd` mới.

### Task 6: Panel một tutor, hộp Thêm / Sửa, Tải danh sách, Gộp (web + máy chủ gộp)
**Files:** Tạo `web/src/modules/tutor/PanelTutor.tsx`, `HopTutor.tsx` (Thêm/Sửa + Gộp), `TaiDanhSach.tsx`; `trang.ts` + `routes/index.ts` (gộp); `prTub.tests.ts`.
**Produces (máy chủ):** `GET /tutors/go-tay` → `{ ten, soBuoi, lop: string[], ngay: string[] }[]` (gom `tutor_ten` bỏ dấu + hoa thường + khoảng trắng, chỉ `tutor_id IS NULL`);
`POST /tutors/gop { muc: { ten, tutorId }[] }` → `{ buoiIds: number[], tutorIds: number[] }`; `POST /tutors/gop/hoan-tac { buoiIds, tutorIds }`.
- [x] **Đỏ — TUB-6:** (a) "Ms Mai", "ms  mai" → một dòng 2 buổi; gộp → `tutor_id` đặt, `tutor_ten` giữ, số buổi trên bảng tăng; hoàn tác → NULL lại. (b) gộp rồi sửa tay một dòng sang tutor khác → hoàn tác không đụng dòng đó. QL → 403.
- [x] Đỏ → **Xanh** máy chủ.
- [x] Web: `PanelTutor` dùng `KhungPanel` (rộng 720, 375 tấm trượt): đầu (tên, SĐT, nơi dạy, kỹ năng, **Sửa** / **Bổ sung** khi thiếu) → 5 ô số bấm = lọc bảng buổi → Nhận xét
  (Kết luận \* `BoLocDoan` + Nhận xét \* ≥ 10, Lưu; `SaveState`; QL chỉ đọc) + dòng thời gian (⋯ Sửa / Xoá khi `coSua`) → Buổi dạy (người ghi dòng phụ, ✓/✗ + chữ, nút "Chỉ buổi chưa đạt").
  Đổi khoảng thời gian trong panel = đổi khoảng chung trang. `HopTutor` dùng `Modal`: 4 ô, kỹ năng 5 `NutChon`, nhắc trùng tên, "Xoá tutor" chỉ khi buổi = 0 (`ConfirmDialog`).
  `TaiDanhSach` (`KhungPanel`): Chọn tệp (.xlsx/.xls/.csv, `await import('xlsx')`, sheet đầu `sheet_to_json({ header: 1, raw: false })`) · Dán từ Excel (TSV) · **Tải mẫu** (.xlsx 4 cột);
  xem trước lọc Tất cả · Mới · Cập nhật · Lỗi, sửa ô lỗi tại bảng → gửi lại xem trước; chân "n dòng lỗi chưa lưu · Lưu n dòng". Gộp: `Modal` mỗi tên một dòng + chọn tutor / "Thêm vào danh sách";
  thông báo `useToast` có **Hoàn tác**. Không mất chữ đang gõ khi panel đóng nhầm (`chan.daSua` của `KhungPanel`).

### Task 7: Hướng dẫn + CODE_MAP + plan
**Files:** Tạo `shared/huongDan/headTutor.ts`; sửa `shared/huongDan/index.ts`, `kieu.ts` (nếu TU-a chưa thêm vai), `ql.ts` (Tutor chỉ xem), `CODE_MAP.md`, `plan.md` mục 11.
- headTutor: 5 việc (xem Cần chú ý · ghi nhận xét · tải danh sách · gộp tên · thêm / sửa tutor), "Chỉ cho tôi" trỏ `data-hd` có thật trên trang.
- [x] Kiểm: `prHd.tests.ts` (HD-NAV / HD-CHI) xanh.

### Task 8: Kiểm toàn bộ + bấm thử + PR
- [x] `npm run check` MỘT lần (exit 139 = libsql sập → chạy lại).
- [x] Bấm thử MỘT lần (cổng riêng `PORT`/`WEB_PORT`): Head tutor (lọc, panel, nhận xét, Tải danh sách, Gộp + Hoàn tác) + QL MB (chỉ xem); 1440 tối + 375 sáng → `docs/anh/pr-tu-b/`.
- [x] `/impeccable audit` → `/ponytail-review` → PR vào `main` (≤ 30 dòng: Task, phép kiểm, câu + dòng đọc trước → sau, ảnh, Tự quyết, `ponytail:`), không merge, không deploy.

## Rulings khi làm (20/10)
- Số "Tutor n": đường nhẹ `GET /tutors/dem` + cờ `nav.tutorSua` (không nhét vào phiên).
- Gộp / Hoàn tác: `POST /tutors/gop` trả `{ hoanTac: [{ tutorId, buoiIds }] }`, gửi nguyên gói vào `/tutors/gop/hoan-tac`.
- Tải lên: dữ liệu đổi giữa xem trước và lưu → lưu chạy lại cùng hàm kiểm (dòng thành Cập nhật, không lỗi UNIQUE) — TUB-4g theo đó.
- "Cần chú ý vì" không dùng ⚠ (ký hiệu đó chỉ nghĩa quá hạn, G-4); lý do bằng chữ màu cam.

## Tự quyết (ghi mô tả PR)
1. "Cần chú ý" của QL tính trên buổi trong phạm vi chi nhánh QL (cùng hàm, `lopIds`), không lộ buổi chi nhánh khác.
2. SĐT 9 số không bắt đầu bằng 0 từ tệp → thêm 0 đầu (Excel lưu dạng số).
3. Lọc / tìm / phân trang ở web trên danh sách đầy đủ của khoảng (một câu đọc); máy chủ không phân trang.
4. Tải mẫu dựng ở web bằng `xlsx`, không đường máy chủ.
