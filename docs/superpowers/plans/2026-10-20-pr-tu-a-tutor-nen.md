# PR TU-a — Tutor: nền dữ liệu + nhập liệu (20/10/2026)

Nguồn: đặc tả `docs/superpowers/specs/2026-10-19-tutor-head-tutor-design.md` (mục 3, 4, 5, 6, 9, 10, 11, 12, 13 — mục 13 thắng) +
mockup `thiet-ke/mockup-tutor-1-head-tutor-2026-10-19.html` mục 1, 7 (375), 8. Model: Opus 5.5. Phép kiểm: `server/src/tests/prTu.tests.ts` (cuối `run.ts`).
Không làm (TU-b): trang Tutor thật, tải danh sách, thêm / sửa / xoá tutor, gộp tên, nhận xét Head tutor, Hướng dẫn vai Head tutor.

## Tự quyết (ghi vào mô tả PR)
1. `GET /tutors/chon?q=&paId=` (Ghi kết quả) hoặc `?q=&studentId=` (Thêm / Sửa / Xác nhận PA) thay cho `classId` + `kyNang`: máy chủ tự suy lớp
   (`loadCase().class_id` = LOP_CUA_CASE, hoặc lớp đang học của em), kỹ năng (topic của Case) và quyền (`kiemQuyenPa` khi có `paId`; `sos.edit` bất kỳ phạm vi
   khi `studentId`). Trả `{ ds: TutorChon[], dienSan }` — `dienSan` (chỉ khi `paId`) = tutor buổi 1 điền sẵn (mục 5).
2. `tutors.ky_nang` lưu mã ngắn `L,R,W1,W2,S` (cùng `ENTRY_SKILL_SHORT`), thứ tự cố định. Topic Case → kỹ năng: listening L · reading R · writing* W1|W2 ·
   speaking / pronunciation S · còn lại (tong_hop…) không lọc kỹ năng.
3. Lần ghi đã có dòng buổi nhưng 3 ô NULL (ghi trước TU-a) = "cũ": Sửa không bắt 3 ô (web + máy chủ cùng `kiemBuoiTutor(n, buoi, cu3)`).
4. Head tutor ở TU-a: thanh trên chỉ "Tutor", `/` → `/tutor` (khung "Tutor" một dòng). Hướng dẫn vai Head tutor là TU-b; QL / QT có mục "Tutor" một dòng (HD-NAV).
5. Seed giữ tên gõ tay "Ms Mai", "Mr Long" (pb2b, duyệt) làm 2 tên chưa có trong danh sách; thêm 3 ô / đánh giá cho chúng + 1 buổi trỏ tutor danh sách.
6. Hình thức tự suy (`hinhThucTuSuy`) tính ở máy chủ cho từng dòng `/tutors/chon` (web không cần biết chi nhánh lớp).

## Task 1 — Migrate + schema + vai `head_tutor`  [ ]
Tệp: `server/src/migrate/prTu.ts` (mới), `server/src/migrate.ts` (một dòng `buoc`, SAU `migratePermissions` + `migratePrOv2`), `server/src/schema.sql`,
`shared/domain/people.ts` (ROLES, ROLE_LABEL, PERMISSIONS `TUTOR_VIEW`/`TUTOR_MANAGE`, PERMISSION_LABEL), `shared/domain/nhomQuyen.ts` (MO_TA_QUYEN),
`server/src/seed/data.ts` (ROLES + ROLE_PERMISSIONS: head_tutor [tutor.view, tutor.manage]; system_admin + cả hai; manager + tutor.view).
- `tutors(id, ten NOT NULL, sdt NULL, noi_day_branch_id NULL → branches, chi_online INTEGER NOT NULL DEFAULT 0, ky_nang NOT NULL, created_at, created_by → users,
  updated_at, updated_by → users)`; `CREATE UNIQUE INDEX idx_tutors_sdt ON tutors(sdt) WHERE sdt IS NOT NULL`.
- `tutor_nhan_xet(id, tutor_id NOT NULL → tutors, ket_luan CHECK IN ('on','can_cai_thien','ngung'), noi_dung NOT NULL, nguoi_id NOT NULL → users, luc NOT NULL,
  sua_luc NULL)` + `idx_tutor_nhan_xet(tutor_id, luc)`.
- 9 cột `case_followup_buoi`: tutor_id → tutors, hinh_thuc CHECK, chuan_bi, tai_lieu, feedback_gv, danh_gia CHECK 1–5, nhan_xet_tutor, lop_id → classes, ghi_luc;
  `idx_followup_buoi_tutor(tutor_id)`.
- Vai `head_tutor` + quyền theo khuôn `prOv2.ts` (chèn khi chưa có).
- `platform/xoaTaiKhoan.ts` COT_TRO_TAI_KHOAN thêm 3 cột dấu vết (tutors.created_by, updated_by, tutor_nhan_xet.nguoi_id); sửa số đếm trong phép kiểm xoá.
Đỏ trước (prTu T1): DB thiếu bảng / cột (DROP + tạo lại bảng buổi kiểu cũ trong giao dịch cuộn lại) → `migratePrTu` thêm đủ, lần 2 `applied` rỗng;
head_tutor có đúng 2 quyền; manager có tutor.view, không tutor.manage. DEPLOY-2c (schema = migrate) xanh.

## Task 2 — Luật chung buổi tutor  [ ]
Tệp: `shared/domain/paDongBo.ts` (+ re-export đã có qua index).
- `BuoiTutor = { tutorId?: number|null; tutor; nhanXet; hinhThuc?: 'offline'|'online'|null; chuanBi?: boolean|null; taiLieu?; feedbackGv?; danhGia?: number|null; nhanXetTutor?: string|null }`.
- `kiemBuoiTutor(n, buoi, cu3 = false)`: như cũ + (không cu3) 3 ô phải boolean → "buổi {x}: chọn Có hoặc Không ở 3 ô"; cu3 thì có giá trị vẫn phải boolean / null;
  `hinhThuc` ∈ offline/online/null; `danhGia` nguyên 1–5 hoặc trống; `nhanXetTutor` ≤ 1000; `tutorId` nguyên dương nếu có.
- `hinhThucTuSuy(t: { noiDayBranchId, chiOnline }, branchId)` → 'offline' | 'online' | null (mục 5.2, 13).
- `KN_TUTOR = ['L','R','W1','W2','S']`, `knTutorCuaTopic(topic)` → string[] (rỗng = không lọc).
Đỏ trước (prTu T2): thiếu một ô → câu lỗi; cu3 + thiếu → null; danhGia 0 / 6 / 2.5 → lỗi; hinhThuc 'x' → lỗi; hinhThucTuSuy 4 trường hợp.

## Task 3 — Máy chủ ghi / sửa / trả buổi  [ ]
Tệp: `server/src/cases/cases.ts`.
- `buoiTutorCua(iv, n, buoi, cu, cu3)`: gọi `kiemBuoiTutor`; `tutorId` phải có trong `tutors` → 400 "buổi x: tutor không có trong danh sách"; trả đủ trường.
- `ghiBuoiTutor(conn, followupId, buoi, lopId, truoc?)`: đọc dòng cũ (hoặc `truoc` từ nơi gọi đường đảo) theo `buoi_so`; dòng mới: `lop_id` = cũ ?? lopId;
  `ghi_luc` = cũ khi 3 ô + đánh giá không đổi, không thì `nowIso()` (dòng không 3 ô, không đánh giá → NULL).
- `updateResult`: lopId = `c.class_id`; opts thêm `buoiTruoc` (suaKetQua đọc trước `daoKetQua`) → cu3 + giữ ghi_luc / lop_id. `suaChuKetQua`: cu3 từ dòng cũ.
- `caseDetail` (buoiCua) + `moSuaKetQua` (giaTri.buoi): trả đủ trường (camelCase) — một câu, chỉ cột cần.
Đỏ trước (prTu T3): ghi PA Tutor 2 buổi thiếu ô → 400 (cả HTTP); đủ, đánh giá trống → lưu đủ cột, lop_id = lớp em, ghi_luc có; sửa chữ (không đổi 3 ô) → ghi_luc
giữ; đổi 1 ô → ghi_luc mới, lop_id giữ; sửa đổi lựa chọn (đường đảo) giữ trường; tutorId lạ → 400; lần ghi cũ (dòng buổi 3 ô NULL) sửa không gửi 3 ô → 200;
Hoàn tác → dòng buổi mất (CASCADE); QL chi nhánh khác GET case → 403; caseDetail trả hinhThuc/3 ô/danhGia.

## Task 4 — `GET /tutors/chon`  [ ]
Tệp: `server/src/tutors/chon.ts` (mới), `server/src/routes/index.ts` (một dòng), `server/src/tocDoDuong.ts` (trần).
- Một câu: tutors LEFT JOIN kết luận mới nhất (bỏ 'ngung'), lọc `q` (bỏ dấu, tên hoặc số cuối SĐT) trong bộ nhớ; xếp nhóm gợi ý (nơi dạy = chi nhánh lớp
  + có kỹ năng PA) → khác, theo tên; cắt 20. Dòng: `{ id, ten, noiDay, kyNang, sdtDuoi, goiY, hinhThuc }` — `sdtDuoi` = 3 số cuối (không bao giờ đủ số).
- `dienSan` (paId): performer_name của PA (không có performer_user_id) khớp đúng một tutor (bỏ dấu) → tutor đó; không thì buổi cuối của lần ghi trước của PA
  (tutorId nếu còn, tên chụp, hinhThuc tính lại).
Đỏ trước (prTu T4): GV lớp → 200, mọi dòng `sdtDuoi` 3 ký tự, không có trường `sdt`; tutor "Ngừng" không có; ≤ 20 dòng; gợi ý đầu là tutor MB có L;
CX / Head tutor → 403; GV không phụ trách PA (paId người khác, khác chi nhánh) → 403; `dienSan` = tutor buổi trước.

## Task 5 — Vai trên web: thanh trên, Tài khoản, khung `/tutor`  [ ]
Tệp: `shared/domain/dieuHuong.ts` (KhuVuc 'tutor', NavQuyen.tutor, khuVucCuaDuong), `server/src/platform/nav.ts` (tutor = tutor.view; overview / work bỏ cho
Head tutor), `server/src/platform/accounts.ts` + `web/src/modules/platform/AccountsAdmin.tsx` (VAI_TOAN_HE_THONG có head_tutor — không chọn chi nhánh),
`web/src/App.tsx` (route `/tutor`, `/` → `/tutor` khi chỉ có Tutor), `web/src/modules/tutor/TutorPage.tsx` (khung "Tutor" + một dòng), `shared/huongDan/ql.ts`, `qt.ts`
(mục Theo màn `/tutor`), `OverviewPage.tsx` (Navigate tới `/tutor` khi nav chỉ có tutor).
Đỏ trước (prTu T5): navOf(Head tutor) → chỉ khu 'tutor', overview false, work false; navOf(QL) có tutor; navOf(GV) không; grant head_tutor không chi nhánh → OK, branch_id NULL;
HD-NAV xanh (QL, QT có mục /tutor).

## Task 6 — Form Ghi kết quả PA Tutor + Người dạy nhóm Tutor + lịch sử Case  [ ]
Tệp: `web/src/ui/PeoplePicker.tsx` (ChonNguoi: prop `tutor?: { paId?; studentId?; chi?: boolean }` — gọi `/tutors/chon` (trễ 250 ms như `useNguoiSearch`),
tiêu đề nhóm ("{Chi nhánh} · {kỹ năng}" / "Khác" / "Tutor" / "Giáo viên"), dòng ngoài "Tutor khác: «…»" khi `chi`; `onChange(v, dong?)`),
`web/src/modules/cases/CapNhatTuan.tsx`, `web/src/modules/cases/BuoiTutorO.tsx` (mới: một buổi — Tutor, Hình thức, Nhận xét buổi, "Tutor buổi này" 3 nút đôi + "Cả 3 Có",
`<details>` Đánh giá tutor: 5 sao bấm lại = bỏ + Nhận xét về tutor), `FormPa.tsx`, `congViec/XacNhanPaLo.tsx` (ô Người dạy: `tutor` khi kind = tutor),
`cases/CasePanel.tsx` (lịch sử: chip hình thức + 3 dấu ✓/✗ + chữ + sao + nhận xét về tutor).
- Lỗi: khoá `buoi-{i}-tutor`, `buoi-{i}-nx`, `buoi-{i}-cb|tl|fb` ("Chọn Có hoặc Không"); chân "n ô còn thiếu"; bấm Lưu nhảy tới ô thiếu đầu (useLoiForm có sẵn).
- Điền sẵn: dòng mới trống → buổi 1 = `dienSan` (hoặc tutor vừa chọn ở Người dạy kỳ này); buổi n > 1 = buổi n−1 (tutor + hình thức). Sửa: không điền.
- Nháp / Hoàn tác giữ `buoi` đủ trường (đã đi theo mảng). 375: khối xếp dọc, Có · Không chia đôi, cao 44 px; sao 44 px.
Kiểm: typecheck + bấm thử (Task 8). Không phép kiểm chuỗi nguồn.

## Task 7 — Seed, EN, Hướng dẫn GV, sổ  [ ]
- `server/src/seed/tuSeed.ts` (mới): `buildTutorDs(conn, adminId)` TRƯỚC `buildDuyetDemo` — 8 tutor (MB 3, BC 1, CP 1, HD 1, 1 Chỉ online, 1 thiếu SĐT + nơi dạy);
  `buildHeadTutor(conn)` CUỐI (sau PET) — tài khoản "Hoàng Thị Hà · Head tutor" toàn hệ thống + 1 nhận xét "Ngừng hợp tác" cho 1 tutor.
- `pb2bSeed.ts`, `duyetSeed.ts`: buổi có 3 ô (+ 1 buổi "Không", 1 đánh giá 2/5, 1 buổi trỏ tutor danh sách); prOv12h / prOv13b phép kiểm cũ gửi 3 ô.
- `shared/i18n/en/tu.ts` (mới) + nạp vào bảng EN; `shared/huongDan/gv.ts` mục Ghi kết quả PA thêm 3 ô + Đánh giá tutor.
- `plan.md` mục 11 một dòng; `CODE_MAP.md` (prTu.ts, tutors/chon.ts, tuSeed.ts, TutorPage.tsx, BuoiTutorO.tsx, en/tu.ts).
Đỏ trước (prTu T7): seed có 8 tutor, 1 chi_online, 1 thiếu sdt + nơi dạy, 1 tài khoản head_tutor branch NULL, ≥ 2 buổi có 3 ô, ≥ 1 "Không", ≥ 1 đánh giá, ≥ 2 tên gõ tay.

## Task 8 — Kiểm, bấm thử, mở PR  [ ]
`npm run check` MỘT lần (nền). Bấm thử MỘT lần (PORT 4310 / WEB_PORT 5310): GV mở Ngăn Case PA Tutor → Ghi kết quả 2 buổi (thiếu ô → lỗi; Cả 3 Có; đánh giá)
→ Lưu → lịch sử Case; 1440 tối + 375 sáng → `docs/anh/pr-tu-a/`. `/impeccable audit` → `/ponytail-review` → PR vào main (≤ 30 dòng) → nhắn "PTA Plan".
Dòng đọc: `/tutors/chon` 2–3 câu (`[cham]`); `caseDetail` buổi: cùng 1 câu, thêm cột.
