# PR-CT2 — Chế tài Final khi đủ điểm · MT0 thứ Tư · bỏ duyệt kế hoạch bổ trợ

Spec: `docs/superpowers/plans/2026-10-08-ke-hoach-tong-cuoi-khoa.md` §8, bảng xung đột X3, X7, X9, mục "PR-CT2"; đặc tả
`docs/superpowers/specs/2026-10-08-cuoi-khoa-che-tai-gop-viec-design.md` §1 (MT0 thứ Tư, thi hành thứ Hai không chờ điểm), §2 (§3 là PR-KV — KHÔNG làm ở đây).
Rulebook `thiet-ke/PISA-Rulebook-2026-09-19.md` dòng 696, 702, 743, 753, 754, 758 (cập nhật ở Task 6). Nhánh `pr-ct2-che-tai`, worktree `.claude/worktrees/pr-ct2-che-tai`
(từ origin/main 6d93b2ab, đã có PR-PA). Có sửa giao diện (gỡ panel, đổi chữ, bộ đếm): `/ponytail lite` cho Task 1 (3) và Task 3 phần web; còn lại `full`.
Ba việc Task 1 do PLANNING PISA nhắn sau khi merge #269.

## Global Constraints
- **Đủ điểm** = `regularResultOf(attempt).complete` của bài `kind = 'final'` lớp thường, đi qua `refreshRegularOutcome` (`server/src/normal/regular.ts:758`) — nơi MỌI đường ghi / xoá / khôi phục điểm đi qua. Không thêm đường thứ hai.
- **Quyết định** = lệnh `lenh_chuyen_lop` `trang_thai = 'cho'`, `boi_canh = 'cuoi-khoa'`, `lop_nguon_id` = lớp của bài Final (`huong`, `lop_dich_id`, `tuan_bat_dau`). Không đọc hướng gợi ý, không đọc Lộ trình tiếp theo.
- **Có bổ trợ Final** khi và chỉ khi: đủ điểm · `goiYCuoiKhoa(...).boTroNeuLen` ≠ null · hướng ∈ {`len_lop`, `fast_track`} · `coBoTroFinal(ct, toFt)` (mới, `shared/domain/cuoiKhoa.ts`): `false` khi `toFt && ct ∈ {BE, ELE}`.
  ELE: "lên" = FT nên `goiYCuoiKhoa` trả `boTroNeuLen = null` cho ELE (nhãn hết "+ bổ trợ").
- **Số buổi** (`boTro()` trong `shared/domain/cuoiKhoa.ts:61`): Pre FOU 50–59 = 4, 60–69 = 2 (giữ); FOU/BE (chia môn) = số môn trượt × `soTuan` → 50–59 = **2 buổi/kỹ năng** (2 tuần), 60–69 = 1 buổi/kỹ năng (1 tuần). `soBuoi` của MỖI PA trong nhóm `mt:{lượt}` = tổng của nhóm (như PR-PA, Kết quả chép cả nhóm).
- **Sinh sớm** (em còn `active` ở lớp của bài Final, lộ trình của bài còn `active`): Case / PA / Mini Test gắn `cycle_id` = lộ trình HIỆN TẠI; chủ Case = `suggestCaseOwner(lớp cũ, hạng mục)`; Người dạy PA = GV cũ
  (`phanCongDangHieuLuc([lớp cũ], hôm nay)` đúng môn; không có → NULL). Ngày bắt đầu = thứ Hai muộn nhất trong {`tuan_bat_dau` của lệnh, thứ Hai sau hôm nay (hôm nay là thứ Hai thì hôm nay), tuần khai giảng lớp đích};
  `lichBoTro` / `weeklyUpdateDue` như cũ. Mốc `opened`/`repeat` ngày = hôm nay.
- **Một lần**: cờ "đã sinh" = dòng `mini_test` (UNIQUE `student_id, tu_attempt_id`). Giữ nguyên khoá `mt:{lượt}` (nhóm), `cuoi-khoa:{lượt}:{case}` (mốc), `bo-tro-mien-phi:{lượt}:{gv}` (chuông). Sửa điểm sau khi đã sinh: không sinh thêm, không tự sửa số buổi.
- **"Chưa ai đụng"** = `mini_test.ty_le IS NULL` + không có `case_followups` nào của PA nhóm `mt:{lượt}` + các PA đó còn `started`. Chỉ phần chưa ai đụng mới được web tự huỷ.
- **Thi hành thứ Hai** (`sauChuyenCuoiKhoa`): lớp thường → lớp thường giữ bước (1) mang Case sang lộ trình mới + đổi chủ Case sang GV lớp mới; thêm `UPDATE mini_test SET cycle_id = mới WHERE student_id = ? AND cycle_id = cũ`. PA giữ Người dạy (GV cũ).
- **Kế hoạch bổ trợ Giữa khoá**: KHÔNG còn nộp / duyệt. Xác nhận Case (có PA `bo_tro` `planned`) → `chayPaBoTro(conn, nhom, p.userId, hôm nay)` trong cùng tx (chỉ Case đã có nguyên nhân chạy — FOU nhóm chung giữ luật đó).
  Loại thẻ `ke_hoach_bo_tro` và nhãn mốc `nop_ke_hoach` / `ke_hoach_duyet` / `ke_hoach_tu_choi` GIỮ để đọc lịch sử; không còn đường tạo. Cột `han_ke_hoach` giữ (chỉ thêm cột), không ghi nữa.
- **Hạn chấm MT0** = thứ Tư tuần sau tuần thi = `addDaysIso(mondayOfDate(tuanThi), 9)` (`shared/domain/mt0.ts:25`) — bằng luật lớp thường / Final (`skillScoreDeadline`). `deadline_override` giữ.
- **Người dạy tuần này** (Kết quả): KHÔNG bắt buộc ở mọi trường hợp (máy chủ + web). Vẫn kiểm định dạng khi có (tài khoản đang làm việc / tên ngoài).
- **Bộ đếm ký tự** (`Truong` `dem`): chỉ hiện `co/can` khi `co < can`; đạt tối thiểu thì ẩn. Một chỗ `web/src/ui/KhungPanel.tsx:149`, áp mọi form.
- Migrate: file riêng `server/src/migrate/prCt2.ts`, gọi CUỐI `server/src/migrate.ts` (sau `migratePrPa`), chạy lặp được; phần điền bù chạy MỘT lần nhờ khoá `demo_config` `pr_ct2_dien_buoi` (khuôn `prQu.ts`).
  Turso: không tham số đặt tên, ≤ 900 tham số/câu, ≤ 200 câu SQL mỗi lần ghi (`theoLo`, `chenNhieuDong`).
- Phép kiểm mới: `server/src/tests/prCt2.tests.ts`, gọi CUỐI `server/src/tests/run.ts` (sau `runPrPaTests`); đỏ trước, theo hành vi, trên DB test.

## Quyết định cần chủ sản phẩm (session code áp MẶC ĐỊNH và ghi vào mô tả PR)
1. **FOU → FT** có còn bổ trợ Final không (đặc tả chỉ nêu BE/ELE)? Mặc định: **còn, nhưng sinh lúc thi hành thứ Hai như hôm nay** — Case phải sống ở lộ trình FT (Writing → W2), mà lúc đổi chương trình hệ thống đóng Case lớp thường.
2. **Final đủ điểm mà QL chưa ra quyết định**: mặc định **chưa sinh**; sinh ngay khi QL ra quyết định (cùng giao dịch `raLenh`).
3. **Sửa điểm sau khi đã sinh** mà dải / môn trượt đổi: mặc định **không tự sửa** PA / Mini Test; QL dùng Sửa PA. Sửa thành KHÔNG còn bổ trợ (Pass, < 50) mà chưa ai đụng → web tự huỷ (như mục 4).
4. **Đổi / huỷ quyết định sau khi đã sinh**: chưa ai đụng → web huỷ (Case do lần sinh này mở: hệ thống đóng, lý do mới "Đổi quyết định lộ trình"; Case Giữa khoá nhận PA: chỉ huỷ PA + xoá mốc; xoá dòng Mini Test); đã có Kết quả / Mini Test → giữ nguyên, QL xử lý tay.
5. **Điền bù "Đã dạy" cho Bổ trợ miễn phí cũ**: **không** — một tuần Kết quả có thể là 1–3 buổi, không suy ra an toàn; PA sống ≤ 2 tuần nên tự hết.
6. **Bộ đếm ký tự**: **ẩn khi đã đủ tối thiểu** (mọi form; không thêm "/2000").
7. **Báo PH qua TVV** (học lại) vẫn sinh lúc thi hành thứ Hai như cũ.

## Task 1: Ba việc từ planning (commit đầu, phép kiểm đỏ trước)
Files: `server/src/cases/cases.ts` (`updateResult` ~3236–3238), `shared/domain/paDongBo.ts` (`loiKetQuaTuan`), `web/src/modules/cases/CapNhatTuan.tsx` (~165–168),
`server/src/tests/prPa.tests.ts` (PA4, PA17), `server/src/migrate/prCt2.ts` (mới) + `server/src/migrate.ts`, `web/src/ui/KhungPanel.tsx` (`Truong`, dòng 149), `server/src/tests/prCt2.tests.ts` (mới) + `run.ts`.
- (1) Bỏ chặn "thiếu Người dạy tuần này khi ≥ 1 buổi" ở máy chủ; `loiKetQuaTuan` gọi `nguoiThieu(nguoi, false)` (vẫn báo tên ngoài quá ngắn); CapNhatTuan: ô "Người dạy tuần này"
  luôn `tuyChon`, không `batBuoc`, bỏ `canNguoi`. Sửa PA4 (`soBuoi: 3` không người → lưu được) và PA17. Sửa chú thích `routes/index.ts:1748`.
- (2) `migratePrCt2(conn, applied)` phần A (một lần, khoá `demo_config` `pr_ct2_dien_buoi`; bảng `demo_config` chưa có thì thoát):
  `UPDATE case_followups SET so_buoi = 1 WHERE so_buoi IS NULL AND intervention_id IN (SELECT id FROM case_interventions WHERE kind = 'tutor' AND so_buoi IS NOT NULL AND case_id IN (SELECT id FROM sos_cases WHERE origin_kind = 'chuyen_cap' AND title LIKE 'Kỳ vọng đầu ra%'))`
  → ghi `applied` số dòng. Không đụng `bo_tro_mien_phi` (Quyết định 5). Khoá vì `case_followups` còn đường khác chèn dòng không `so_buoi`; chạy lại sẽ đếm oan.
  Lưu ý deploy: bản chính chưa chạy `prPa` → lần 2 chạy `prPa` (điền Số buổi 10) rồi `prCt2` (điền buổi đã dạy), đúng thứ tự.
- (3) `Truong`: `{dem && dem.co < dem.can && <span …>{dem.co}/{dem.can}</span>}`. Không đổi chữ khác.
- Phép kiểm CT2-0: Kết quả PA Tutor 10 buổi, 2 buổi, không người → lưu, `phu_trach_*` NULL; `loiKetQuaTuan` không có lỗi `nguoi-day`; tên ngoài 1 ký tự vẫn lỗi.
  CT2-0b: dựng Case Tutor kỳ vọng đầu ra có 2 Kết quả `so_buoi` NULL + 1 Kết quả `so_buoi = 0`, xoá khoá → migrate → `1,1,0`; chạy lần hai → không đổi, `applied` rỗng; Bổ trợ miễn phí NULL giữ NULL.
  Bộ đếm: kiểm tĩnh (như `thanhPhanChung.tests.ts`) rằng `Truong` không hiện khi `co ≥ can`.

## Task 2: Luật thuần — số buổi, BE/ELE → FT, MT0 thứ Tư
Files: `shared/domain/cuoiKhoa.ts` (`boTro`, `goiYCuoiKhoa`, `coBoTroFinal` mới), `shared/domain/mt0.ts` (`hanChamMt0`), `server/src/platform/week.ts:90` + `server/src/fasttrack/skillSchedule.ts:299` (chú thích),
`server/src/tests/prMt0.tests.ts:111`, `prLt2b.tests.ts`, `prS5fA.tests.ts` (số buổi cũ), `prCt2.tests.ts`.
- `boTro`: chia môn → `soBuoi = monTruot.length * soTuan`. `goiYCuoiKhoa`: `ct === 'ELE'` → `bo = null`. `coBoTroFinal(ct, toFt) = !(toFt && (ct === 'BE' || ct === 'ELE'))`.
- `hanChamMt0`: `+ 9`, chú thích "thứ Tư tuần sau tuần thi (= luật lớp thường, đặc tả §1)". Không migrate (hạn tính khi đọc).
- Phép kiểm CT2-1 (từng dải × chương trình): Pre FOU 55% → 4 / 65% → 2; FOU 55% hai môn trượt → 4 buổi · 2 tuần; FOU 65% hai môn → 2 · 1 tuần; BE 55% một môn → 2; ELE 55% / 65% → `boTroNeuLen` null;
  < 50 và ≥ 70 → null; `coBoTroFinal('BE', true) === false`, `('BE', false)`, `('FOU', true)` true.
  CT2-2: `hanChamMt0('2026-10-19') === '2026-10-28'`; chạy lại `prMt0` + `prLt3` (X9): khối quá hạn đúng.

## Task 3: Bỏ nộp / duyệt kế hoạch bổ trợ — PA Bổ trợ Giữa khoá chạy ngay sau Xác nhận Case
Files (máy chủ): `server/src/cases/boTro.ts` (xoá `coQuyenNop`, `phaiGuiKemKeHoach`, `CAU_THIEU_KE_HOACH`, `kiemKeHoach`, `nopKeHoachBoTro`, `chayNeuKeHoachDaDuyet`, `khiDuyetKeHoach`, `khiTuChoiKeHoach`, `theHienHanh`, `minIdNhom`;
`taoPaBoTro` bỏ `hanKeHoach`; `BoTroDto` / `boTroCuaCase` bỏ `keHoach`, `hanKeHoach`, `coTheNop`, `phaiGuiKem`), `server/src/cases/sosAuto.ts` (`xacNhanCase` bỏ `keHoach`, gọi `chayPaBoTro`; `datLaiHanCase` bỏ câu `han_ke_hoach`),
`server/src/cases/sosState.ts`, `server/src/phanTich/tongHop.ts`, `server/src/duyet/loaiYeuCau.ts` (giữ mục `ke_hoach_bo_tro` để đọc thẻ cũ; `khiDuyet`/`khiTuChoi` → conflict "Đã bỏ bước duyệt kế hoạch bổ trợ."),
`server/src/routes/index.ts` (xoá route nộp kế hoạch), `server/src/worklist/mywork.ts` (nhóm `ke_hoach_bo_tro`), `server/src/worklist/nhacViec.ts`, `server/src/students/viecHocVien.ts`, `server/src/students/hanhTrinh.ts`,
`server/src/cases/cases.ts`, `server/src/seed/lt2aSeed.ts`, `server/src/platform/timNguoi.ts` (chú thích).
Files (shared): `shared/domain/sosV4.ts` (bỏ `cho-ke-hoach`, `cho-duyet-ke-hoach`), `tongQuan.ts`, `display.ts`, `hanhTrinh.ts`, `phanTich.ts`, `hoSoHocVien.ts`, `duongHoSo.ts` (`viec: 'ke-hoach'`), `hocVienLop.ts`, `yeuCauDuyet.ts` (giữ loại, "chỉ đọc lịch sử").
Files (web, `/ponytail lite`): xoá `web/src/modules/cases/NopKeHoachPanel.tsx` (dời type `BoTro` còn dùng sang `CasePanel.tsx`); `CasePanel.tsx` (`nutKeHoach`, nhãn `chuaChay` → "Chưa bắt đầu"), `SkillBoard.tsx`, `TheKyNang.tsx`,
`NganCase.tsx`, `DauHoSo.tsx`, `StudentDetailPage.tsx`, `HanhTrinh.tsx`, `CaseSosControls.tsx` (bỏ `KhoiKeHoach` / `phaiGuiKem` khỏi form Xác nhận Case), `web/src/ui/Han.tsx` (loại hạn `ke-hoach-bo-tro`).
- `chuaChay` giữ nghĩa mới "PA Bổ trợ chờ Xác nhận Case".
- `migratePrCt2` phần B (chạy lặp được): mọi nhóm có PA `bo_tro` `planned`, Case chưa đóng, ĐÃ có nguyên nhân → `chayPaBoTro(conn, nhom, nguoiNop, hôm nay)` (`nguoiNop` = `nguoi_xin` thẻ mới nhất, không có thì người ghi nguyên nhân chính).
  Thẻ `ke_hoach_bo_tro` `cho` → `chotYeuCau(… 'tu_dong', lyDo 'Bỏ bước duyệt kế hoạch — PA bổ trợ đã chạy')`. Lần hai: không ghi gì.
- Phép kiểm CT2-3: Case Giữa khoá BE trượt S → Xác nhận Case (không kế hoạch) → PA `started`, `action_due = weeklyUpdateDue(hôm nay)`; không có thẻ `ke_hoach_bo_tro`; Công việc không có nhóm đó; việc tiếp = "Kết quả".
  FOU nhóm chung hai môn: xác nhận một môn → chỉ PA môn đó chạy. Route nộp kế hoạch → 404.
  CT2-4 (migrate B): thẻ `cho` + nhóm "chờ nộp" → PA chạy, thẻ `tu_dong`; chạy hai lần → lần hai `applied` rỗng. Sửa `prLt2a.tests.ts` theo luật mới.

## Task 4: Chế tài Final sinh khi đủ điểm (máy chủ)
Files: `server/src/normal/cuoiKhoa.ts` (`taoBoTroFinal` tách từ Pha 1–3 của `sauChuyenCuoiKhoa`; `dongBoCheTaiFinal` mới; `huyBoTroFinal` mới), `server/src/normal/regular.ts:788`,
`server/src/classes/lenhChuyen.ts` (`raLenh`, `huyMotLenh`, `khoiPhucLenh`), `shared/domain/cases.ts` (`SYSTEM_CLOSE_REASONS` + `doi_quyet_dinh: 'Đổi quyết định lộ trình'`),
`server/src/worklist/mywork.ts` + `cuoiKhoa.ts` `ghiMiniTest` (người giữ Mini Test), `prCt2.tests.ts`, `prLt2b.tests.ts`, `prS5fA.tests.ts`.
- `taoBoTroFinal(p, dongs: { sid, luot, t, fromClassId, toClassId, toFt, cycleId, ownerClassId, ngay, batDau }[])` = Pha 1–3 hiện có, KHÔNG đổi câu SQL. Đổi: điều kiện thêm `coBoTroFinal(t.ct, toFt)`;
  chủ Case = `suggestCaseOwner(ownerClassId, …)`; `performerUserId` = GV cũ (`phanCongDangHieuLuc([fromClassId], ngay)`, khoá `${from}|${mon}`; không có → NULL). `sauChuyenCuoiKhoa` gọi với `cycleId` = lộ trình mới, `ownerClassId` = lớp đích.
- `dongBoCheTaiFinal(p, classId, sids?)` theo lô. Mỗi em: `can` = đủ điểm ∧ lệnh ∧ hướng ∈ {len_lop, fast_track} ∧ `boTroNeuLen` ∧ `coBoTroFinal` ∧ ¬(lên FT từ FOU — Quyết định 1); `co` = có `mini_test`.
  `can ∧ ¬co` → `taoBoTroFinal` sinh sớm. `¬can ∧ co ∧ chưa ai đụng ∧ (đủ điểm hoặc không còn lệnh)` → `huyBoTroFinal`. Ngoài ra không làm gì.
- `huyBoTroFinal`: Case mở bởi lần sinh này và không PA sống khác → `closeCasesBySystem({ caseIds, reason: 'doi_quyet_dinh' })`; Case Giữa khoá nhận PA → PA nhóm `mt:{lượt}` `cancelled`, `closed_reason = 'system_closed'`,
  xoá mốc `cuoi-khoa:{lượt}:{case}`; xoá dòng `mini_test`; audit `cuoi_khoa.bo_tro_huy`.
- Gọi `dongBoCheTaiFinal` ở: `refreshRegularOutcome` khi `a.kind === 'final'` (em còn học lớp đó; đã chuyển → `capNhatCuoiKhoaSauChuyen` như cũ); cuối `raLenh` khi `boiCanh === 'cuoi-khoa' && !nguonFt`; `huyMotLenh`; `khoiPhucLenh`. Trong tx nơi gọi.
- `sauChuyenCuoiKhoa` bước (1): sau `chuyenCaseSangLoTrinh` thêm `UPDATE mini_test SET cycle_id = ? WHERE student_id = ? AND cycle_id = ? AND ty_le IS NULL` (theo lô).
- Người giữ việc Ghi Mini Test = `nguoiGiuKetQua` của PA đại diện nhóm (nhóm `mt:` → GVCN lớp hiện tại). `ghiMiniTest` lần đầu cho thêm người giữ đó.
- Phép kiểm CT2-5 (từng dải × chương trình, đường thật): FOU 55% (2 môn trượt) + lệnh `len_lop` → nhập ô Final cuối → TRƯỚC thứ Hai đã có Case/PA, `so_buoi = 4`, Người dạy = GV cũ, `cycle_id` = lộ trình FOU, `mini_test` một dòng.
  Pre FOU 65% → 1 Case `tong_hop`, 2 buổi. BE 62% → ELE: 1 buổi/môn.
  CT2-6 (một lần): sửa một ô Final → không đổi số; xoá rồi nhập lại → không nhân đôi; thi hành thứ Hai → không thêm PA, Case + `mini_test` sang lộ trình mới, chủ Case = GV lớp mới, Người dạy giữ GV cũ, việc Kết quả về GVCN lớp mới.
  CT2-7 (BE/ELE → FT): không Case / PA / Mini Test theo Final — cả lúc đủ điểm lẫn lúc thi hành. BE 60% `len_lop` → có.
  CT2-8 (quyết định): đủ điểm chưa lệnh → không gì; `raLenh` → sinh; đổi sang `hoc_lai` → huỷ; ra lại → đúng một bộ; đã có Kết quả → huỷ lệnh không huỷ gì.
  CT2-9: FOU 55% `fast_track` → không sinh sớm; thi hành → bổ trợ ở lộ trình FT như cũ.

## Task 5: Migrate dữ liệu đang chờ + seed
Files: `server/src/migrate/prCt2.ts` (phần C), `server/src/seed/build.ts` (nếu seed dựng em đủ điểm Final + lệnh chờ), `prCt2.tests.ts`.
- Phần C (chạy lặp được): lớp thường có lệnh `cho` `cuoi-khoa` mà em đã đủ điểm Final và chưa có `mini_test` → `dongBoCheTaiFinal(principal người ra lệnh, lớp, sids)` (khuôn `prLc.ts`: mỗi lớp một savepoint). Em đã chuyển: không đụng.
- Phép kiểm CT2-10: dựng em đủ điểm + lệnh `cho` không có `mini_test` → migrate → đủ bộ; lần hai `applied` rỗng; em đã chuyển có sẵn bổ trợ → không đổi.

## Task 6: Kiểm, tài liệu, PR
- `npm run check` xanh; chạy riêng lại `prMt0`, `prLt3`, `prLt2a`, `prLt2b`, `prS5fA`, `prPa`, `prCt2`.
- Rulebook dòng 696, 743, 753, 754, 758. CODE_MAP.md. Một dòng `plan.md` mục 11.
- Ảnh 375/1440 sáng/tối vai QL (2), GVCN (7), GVBM (9) ở `thiet-ke/anh/ct2/` (Xác nhận Case Giữa khoá, Kết quả, ngăn Case có PA Bổ trợ); `/impeccable audit`; `/ponytail-review`.
- Mô tả PR ghi 7 mặc định và bước deploy: migrate `prPa` rồi `prCt2`. Mở PR, KHÔNG merge; nhắn PLANNING PISA.
