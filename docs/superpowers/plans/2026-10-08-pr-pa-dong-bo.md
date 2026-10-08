# PR-PA — PA đồng bộ một mẫu (§8)

Spec: `docs/superpowers/plans/2026-10-08-ke-hoach-tong-cuoi-khoa.md` §8 + bảng xung đột X1, X2 (đè mockup); đặc tả
`docs/superpowers/specs/2026-10-08-cuoi-khoa-che-tai-gop-viec-design.md` §3, §7. Mockup duyệt: `thiet-ke/mockup-pa-dong-bo-2026-10-08.html`
(cách 1, SỬA theo §8: **không có ô Người theo dõi**). Nhánh `pr-pa-dong-bo`, worktree `.claude/worktrees/pr-pa-dong-bo`.

## Global Constraints
- Chữ trên web = đúng chữ mockup, ngắn (nhãn 1–3 từ). Không đổi phông/màu/bố cục khoá; chỉ token màu có sẵn (`--line-strong`, `--surface-2`, `--ok`, `--late`, `--accent`).
- Ô PA: **Loại · Nội dung · Số buổi · Người dạy · Ngày bắt đầu**. Số buổi chỉ với `tutor`, `self_study`, `bo_tro`, `bo_tro_mien_phi`;
  không bắt buộc; số nguyên 1–60. Ô người: không có với `self_study`; nhãn "Người dạy" với `tutor`/`bo_tro`/`bo_tro_mien_phi`,
  "Người thực hiện" với loại khác (mặc định "Tôi"); **không bắt buộc**. Không có ô Người theo dõi.
- Việc "Kết quả" (Công việc, Tổng quan `pa-can-cap-nhat`, quyền ghi) giao **GVBM của Case** = phân công đang hiệu lực đúng môn
  (`sos_cases.topic`; `writing1/2` → `writing`) ở **lớp hiện tại** của em; Case `tong_hop` hoặc PA Bổ trợ nhóm chung (`gk:{lượt}`) →
  GVCN lớp hiện tại; không có → chủ Case (`owner_user_id`). Người giữ việc luôn THẤY và GHI được việc đó.
- "Người dạy tuần này" = ô "Người phụ trách" cũ (X2): lưu ở cột cũ `case_followups.phu_trach_user_id / phu_trach_ten`, không thêm cột
  `nguoi_day_*`. Hiện với mọi loại trừ `self_study`, điền sẵn Người dạy của PA; bắt buộc khi PA có Số buổi và Số buổi tuần này ≥ 1.
- Kết quả: PA có Số buổi → "Số buổi tuần này" **bắt buộc**, mặc định 1, số nguyên 0–60. Đã dạy = tổng `case_followups.so_buoi` của PA.
  Đủ / vượt → chỉ gợi ý "Kết thúc PA", không tự kết thúc.
- Sửa PA = cùng form; Loại khoá; Số buổi ≥ đã dạy; Ngày bắt đầu khoá khi đã có kết quả; mỗi lần lưu một dòng nhật ký cũ → mới
  (`case_intervention_revisions`, `source = 'sua_pa'`). Quyền như Điều chỉnh (người ghi được Kết quả của PA đó).
- Migrate CHỈ THÊM CỘT, file riêng `server/src/migrate/prPa.ts`, chạy lặp được. Turso: không tham số đặt tên, ≤ 900 tham số/câu,
  ≤ 200 câu SQL mỗi lần ghi.
- "Ghi kết quả" → "Kết quả", "Ghi kết quả cuối" → "Kết quả cuối" ở mọi chữ người dùng thấy (web, `shared/domain`, chữ máy chủ trả).
- Phép kiểm mới: `server/src/tests/prPa.tests.ts`, gọi ở CUỐI `server/src/tests/run.ts`; đỏ trước trên DB test, theo hành vi.

## Task 1: Migrate + luật thuần + một hàm tạo PA
Files: `server/src/migrate/prPa.ts` (mới), `server/src/migrate.ts`, `server/src/schema.sql`, `shared/domain/paDongBo.ts` (mới) +
`shared/domain/index.ts`, `server/src/cases/taoPa.ts` (mới), `server/src/cases/cases.ts` (`recordIntervention`), `server/src/cases/sosAuto.ts`
(dựng PA quy chế), `server/src/cases/boTro.ts` (`taoPaBoTro`), `server/src/normal/cuoiKhoa.ts` (`taoCaseTutorFt`, `paRows`),
`server/src/tests/prPa.tests.ts` (mới) + `run.ts`.
- Migrate `migratePrPa(conn, applied)` (khuôn `prLuiA2.ts`): `case_interventions.so_buoi INTEGER`, `case_followups.so_buoi INTEGER`,
  `case_intervention_revisions.old_so_buoi INTEGER, new_so_buoi INTEGER, old_started_date TEXT, new_started_date TEXT`. Điền bù (chỉ
  dòng `so_buoi IS NULL`): `bo_tro_mien_phi` ← `mini_test.so_buoi` cùng `nhom_bo_tro`; `tutor` của Case `origin_kind = 'chuyen_cap'` có
  title `LIKE 'Kỳ vọng đầu ra%'` ← 10. Thêm cột vào `schema.sql`.
- `shared/domain/paDongBo.ts`: `LOAI_CO_SO_BUOI`, `coSoBuoi(kind)`, `coNguoiDay(kind)`, `nhanNguoiDay(kind)` ('Người dạy' | 'Người thực hiện'),
  `kiemSoBuoiPa(v, daDay = 0)` → câu lỗi | null ("Từ 1 đến 60 buổi, hoặc để trống"; nhỏ hơn đã dạy: "Đã dạy n buổi — Số buổi từ n trở lên, hoặc để trống"),
  `kiemSoBuoiTuan(v)` (0–60 nguyên), `demBuoi(daDay, tong)` → `{ da, tong, con, tt: 'chua' | 'du' | 'vuot' }`.
- `taoPa.ts`: `chenPa(conn, dong[])` chèn THEO LÔ, một bộ cột cố định cho mọi đường, trả id; ép luật chung: `so_buoi` NULL với loại
  không có số buổi, ném lỗi khi ngoài 1–60; người = tài khoản XOR tên; `self_study` không người. Mọi INSERT PA ở các file trên gọi qua
  `chenPa` (giữ nguyên giá trị cột từng đường). Bổ trợ miễn phí điền `so_buoi = x.b.soBuoi`; Tutor kỳ vọng đầu ra `so_buoi = 10`,
  **Người dạy = GV cũ** dạy kỹ năng đó ở lớp BE/ELE cũ (phân công đang hiệu lực; không còn → NULL) — X1.
- `recordIntervention` nhận `soBuoi`; người không còn bắt buộc (`batBuoc: false`).
- Phép kiểm PA1: mọi đường (tay, quy chế SOS, bổ trợ giữa khoá, bổ trợ miễn phí, tutor kỳ vọng) ra cùng dạng (cột người XOR, `so_buoi`
  đúng luật); PA2: migrate chạy hai lần không lỗi, điền bù đúng; PA3: `recordIntervention` không người vẫn lưu; số buổi 0 / 61 / với loại
  không có số buổi → 400.

## Task 2: Máy chủ — Sửa PA, Kết quả có số buổi, Điều chỉnh cùng ô
Files: `server/src/cases/cases.ts` (`updateResult`, `caseDetail`, hàm mới `suaPa`), `server/src/cases/planRevisions.ts`,
`server/src/cases/sosAuto.ts` (`xacNhanPaQuyChe` nhận `soBuoi`), `server/src/cases/boTro.ts` (`chepKetQuaNhom` chép `so_buoi`),
`server/src/routes/index.ts`, `server/src/tests/prPa.tests.ts`.
- `PATCH /interventions/:id` → `suaPa(p, id, { description, soBuoi, performerSelf/UserId/Name, startedDate })`: quyền như `updateResult`;
  PA đã kết thúc/huỷ → 400; Loại không nhận; Số buổi ≥ đã dạy; `startedDate` chỉ khi PA chưa có kết quả; không đổi gì → trả Case không ghi;
  ghi một dòng revisions `source 'sua_pa'` (cũ → mới gồm số buổi, ngày bắt đầu) + audit `intervention.edit`.
- `updateResult`: nhận `soBuoi` (bắt buộc khi PA có `so_buoi`, 0–60) lưu `case_followups.so_buoi`; body `nguoiDay` thay `phuTrach`
  (lưu cột `phu_trach_*`, nhãn lỗi "Người dạy tuần này"); bắt buộc khi PA có số buổi và `soBuoi ≥ 1` (bỏ `batBuocPhuTrach` ở route).
  Điều chỉnh (`adjust`) nhận `soBuoi` (≥ đã dạy) — `chuanHoaDieuChinh` / `apDungDieuChinh` cập nhật `so_buoi` + cột revisions.
- `caseDetail`: PA có `soBuoi`, `daDay`; followups `soBuoi`, `nguoiDay` (thay `phuTrach`); revisions trả `before/after.soBuoi`, `startedDate`.
- Phép kiểm PA4…: Sửa PA số buổi < đã dạy → 400; ngày bắt đầu khoá sau kết quả; nhật ký cũ → mới; Kết quả thiếu số buổi khi PA có số buổi → 400;
  0 hợp lệ; thiếu người dạy khi ≥ 1 → 400; đếm đúng qua 3 tuần (3 + 2 + 0 = 5/10); Điều chỉnh đổi số buổi ghi revisions.

## Task 3: Máy chủ — người giữ việc Kết quả (không mồ côi)
Files: `server/src/cases/giuKetQua.ts` (mới), `server/src/worklist/mywork.ts` (2b), `server/src/worklist/metrics.ts` (`overdueUpdatePlans`),
`server/src/cases/cases.ts` (`updateResult` + `suaPa` quyền; `caseDetail` cờ `ghiDuoc` mỗi PA), `server/src/tests/prViecNho2.tests.ts` (VN2-1d),
`server/src/tests/prPa.tests.ts`.
- `nguoiGiuKetQua(rows, ngay)` theo lô (dùng `phanCongDangHieuLuc` + GVCN đang hiệu lực) → Map id PA → userId | null, luật ở Global Constraints.
- Công việc 2b: lớp của dòng = lớp HIỆN TẠI trước (`COALESCE(cur.class_id, a.class_id)`, như `LOP_CUA_CASE`); `owner_id` = người giữ;
  người giữ luôn thấy dòng (không qua lọc quyền); `ownerId` của dòng = người giữ. Chỉ số `pa-can-cap-nhat` `nguoi` = người giữ.
- `updateResult` / `suaPa`: người giữ được ghi dù không qua quyền cũ. `caseDetail` PA có `ghiDuoc`.
- Phép kiểm: em chuyển lớp → việc về GVBM lớp mới; lớp chưa phân công môn → chủ Case; Bổ trợ nhóm chung → GVCN; VN2-1d `r.loi.length === 0`.

## Task 4: Web — một form PA (Thêm PA · Sửa PA · Thay PA · Xác nhận PA)
Files: `web/src/modules/cases/FormPa.tsx` (mới), `web/src/modules/cases/ThaoTacCase.tsx` (`ThemPaPanel`, `SuaPaPanel` mới),
`web/src/modules/cases/CasePanel.tsx` (`ViewCase` thêm `{ loai: 'sua-pa'; paId }`), `web/src/modules/students/NganCase.tsx`,
`web/src/modules/yThuc/CaseSosControls.tsx` (`XacNhanPaPanel` dùng `FormPa`, Loại khoá, Nội dung ≥ 15).
- `FormPa`: khối "Phương án" (Loại select | khoá có ổ khoá + phụ "Đổi loại: Kết quả › Thay PA"; Nội dung; Số buổi ô nhỏ, phụ
  "Có số buổi thì web đếm sau mỗi tuần Kết quả") + khối "Người và thời gian" (ô người theo `nhanNguoiDay`, `ChonNguoi`; Ngày bắt đầu `ONgay`/`ChonNgayGan`,
  khoá khi đã chạy với phụ "Đã có kết quả tuần — không đổi"). Đổi Loại giữ chữ Nội dung. Lỗi chỉ sau khi bấm.
- Sửa PA: tiêu đề "Sửa PA", dòng đầu "Web tạo …" cho PA hệ thống, khối "Nhật ký PA", chân Huỷ thay đổi / Lưu (`daSua`), gọi `PATCH`.

## Task 5: Web — panel Kết quả
Files: `web/src/modules/cases/CapNhatTuan.tsx`, `NganCase.tsx` (truyền `soBuoi`, `daDay`, người dạy).
- Tiêu đề "Kết quả" / "Kết quả cuối"; ngữ cảnh "Học Tutor · 10 buổi"; khối đếm (`dem-buoi`): "Số buổi tuần này *" (mặc định 1) + "Người dạy tuần này"
  + vạch + "Đã dạy 3/10 → sau khi lưu 5/10 · còn 5" / "· đủ buổi" (xanh, phụ "Xong PA thì chọn Kết thúc PA ở mục 2.") / "· vượt n buổi" (cam);
  PA không số buổi: chỉ ô Người dạy tuần này (không bắt buộc). Bỏ ô "Người phụ trách". Điều chỉnh: Nội dung · Số buổi · Người dạy + Lý do.
  Nút "Lưu kết quả" (Giữ nguyên) — `NUT_LUU_KET_QUA`.

## Task 6: Web — panel Case mới + dòng PA + bảng kỹ năng
Files: `web/src/modules/students/NganCase.tsx`, `web/src/modules/cases/CasePanel.tsx` (`ThanCase`, `TheKhoiPa`), `MenuXoaPa.tsx`,
`web/src/modules/cases/SkillBoard.tsx`, `TheKyNang.tsx`.
- Đầu panel: dải nền nhạt (chip trạng thái một lần · "mở W2 OCT · X báo" · nút Sửa cùng hàng); điều kiện hoàn thành một dòng có ổ khoá.
- Thẻ Vấn đề / Phương án / Bằng chứng (viền `--line-strong`, đầu `--surface-2`, tiêu đề 13.5px đậm + số đếm). Vấn đề: tên + SOS một hàng,
  mô tả, hàng "Nhóm nguyên nhân" dạng nhãn–giá trị. Lịch sử kết quả cuối thẻ Phương án (thu gọn). Chân: Đóng · + Thêm PA · Kết quả.
- Dòng PA: tên loại + khoá quy chế + chip · ⋯ (Sửa PA · Xoá PA) · nội dung · "Dạy X / Thực hiện X · Từ W1 OCT · mốc" · vạch buổi
  (khi có) · chân gạch đứt "Kết quả · hạn T2 13/10" (quá hạn cam đậm) + nút "Kết quả" · "Nhật ký PA (n)" (Sửa PA + Điều chỉnh).
- Bảng kỹ năng: nút "Kết quả", dòng phụ thêm "3/10 buổi".

## Task 7: Đổi chữ "Ghi kết quả" → "Kết quả" ở mọi chỗ còn lại
Files: mọi chuỗi người dùng thấy trong `web/src`, `shared/domain`, `server/src` (việc Công việc, việc tiếp, sổ tay chữ trong mã); sửa phép
kiểm cũ khớp chữ cũ. Không đổi tên hàm/khoá (`ghi-ket-qua` giữ trong URL).

## Task 8: Kiểm, ảnh, PR
`npm run check` xanh; ảnh 375/1440 sáng/tối, vai QL (2), GVCN (7), GVBM (9) ở `thiet-ke/anh/pa/`; `/impeccable audit`; `/ponytail-review`;
CODE_MAP.md; một dòng plan.md mục 11; mở PR vào main.
