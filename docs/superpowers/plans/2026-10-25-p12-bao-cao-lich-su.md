# P12 BAO-CAO-LICH-SU — Báo cáo quá khứ không đổi theo Target / lớp / trạng thái hiện tại — Implementation Plan

> **For agentic workers:** chạy NGAY TRONG SESSION bằng superpowers:executing-plans + test-driven-development (plan.md 1.2). Steps `- [ ]`. PR có migrate → PTA Plan rà sâu `/code-review high`.

**Goal:** kết quả MT / thi thật / chấm điểm của kỳ đã qua gán đúng Target, lớp, GV và trạng thái TẠI THỜI ĐIỂM đó; đổi Target / lớp / GV / lưu trữ về sau không làm sai báo cáo quá khứ; HV lưu trữ vẫn trong báo cáo lịch sử.

**Architecture:** sửa trong các hàm tập sẵn có (không hàm đếm thứ hai): `server/src/phanTich/giaoVien.ts`, `ketQuaThi.ts`, `baoCao.ts`, `server/src/loTrinh/thiThat.ts`; thêm một cột lưu Target lúc nhập KQ thi thật; một hàm chung chọn lớp lúc thi thật.

**Tech Stack:** TypeScript, libsql; migrate `server/src/migrate/prBaoCaoLichSu.ts` (chạy lặp được); phép kiểm `server/src/tests/prBaoCaoLichSu.tests.ts`.

**Spec:** thiết kế `docs/superpowers/specs/2026-10-24-cai-tien-da-chot-design.md` mục 2 (E6–E8), 1 (R2.4, R4.2), Q12; `plan.md` 1.6 N19 (Q12).

## Global Constraints
- MT: so với `assessment_attempts.target_at_attempt` và KCK lúc lượt (`kck_at_attempt` — kiểm tên cột thật; cùng `resultOf` `attempts.ts:270-281`), không `cy.target_score` / `cy.khong_cam_ket` hiện tại.
- Thi thật: thêm `learning_cycles.thi_that_target REAL` ghi lúc nhập / sửa KQ (`thiThat.ts`); hiển thị và tính "Đạt Target thi thật", khoảng thiếu, Pass Target đọc cột này (NULL → Target hiện tại, ghi chú `ponytail:` "dữ liệu trước migrate"). Backfill: lộ trình đã có KQ → `thi_that_target = target_score` hiện tại (ghi trong DEPLOY_2026-10.md là ước lượng).
- Lớp lúc thi thật: MỘT hàm `lopLucThiThat(studentId, ngayThi): number | null` = ghi danh hiệu lực tại ngày thi (bắt đầu ≤ ngày ≤ kết thúc / NULL), nhiều thì bắt đầu muộn nhất, không có thì lớp của MT cuối của lộ trình — dùng ở Phân tích GV (`giaoVien.ts:281-283`) và Kết quả thi (`ketQuaThi.ts:120-129`). Bản chụp lộ trình đã đóng (`banChup.ts`) giữ nguyên (dữ liệu đóng băng).
- Chấm điểm GV (`tapChamDiem`, `giaoVien.ts:129, 210`): bỏ ô của em theo trạng thái TẠI HẠN NHẬP (ghi danh hiệu lực ở hạn), không theo `HV_DANG_HOC_SQL` hôm nay.
- **Q12:** Tổng quan Admin (`server/src/worklist/tongQuanMt.ts`): bài Speaking chấm chéo chưa có người giữ KHÔNG tính "quá hạn" (T18) — vẫn hiện dòng "Chưa có GV · n bài chờ chấm". Trước khi sửa, xác định đúng tập 12 bài (MB FT 101 / 105, MT1 W1 JUL) là S chấm chéo hay S của lớp thiếu GV S — nếu là lớp thiếu GV S thì GIỮ quá hạn và ghi lại trong PR (không đổi luật).
- Không đổi số "hiện tại" (SOS hiện tại, Thi tháng này, sĩ số); không đổi quyền. KHÔNG commit tệp DB.

## Review Focus
1. Em đổi Target 6.5 → 7.0 sau MT2: Phân tích GV kỳ chứa MT2 vẫn tính theo 6.5.
2. Em đổi lớp sau ngày thi thật: thi thật gán cho GV lớp cũ ở cả Phân tích GV và Kết quả thi (cùng lớp).
3. Em lưu trữ hôm nay: Chấm điểm GV kỳ trước không mất ô của em (em đang học tại hạn).
4. Lộ trình cũ chưa có `thi_that_target` (trước migrate) → vẫn hiện, dùng Target hiện tại, không lỗi.
5. Migrate chạy hai lần không đổi gì; DB mới (`napDuLieuNen`) có cột.

---

### Task 1: MT theo Target / KCK lúc lượt
**Files:** `server/src/phanTich/giaoVien.ts:~129, 240-254`. Test `PBC-1`: dựng trong `thu` một em, đổi `learning_cycles.target_score` sau lượt → `chiSoHoSoGv` / `phanTichGiaoVien` kỳ đó cho cùng kết quả như trước khi đổi.
- [ ] FAIL → sửa → PASS → commit.

### Task 2: Cột `thi_that_target` + hàm lớp lúc thi thật
**Files:** Create `server/src/migrate/prBaoCaoLichSu.ts` (thêm cột + backfill, chạy lặp), Modify `server/src/migrate.ts` (gọi), `server/src/schema.sql`, `server/src/seed/duLieuNen.ts` nếu cần khoá, `server/src/loTrinh/thiThat.ts` (ghi cột lúc nhập / sửa KQ), `server/src/phanTich/{giaoVien,ketQuaThi,baoCao}.ts` (đọc cột + `lopLucThiThat`), nơi đặt `lopLucThiThat` (`server/src/phanTich/phamVi.ts` hoặc tệp mới `server/src/phanTich/lopLucThi.ts`).
- [ ] `PBC-2`: migrate hai lần → lần hai `applied` rỗng; cột có giá trị cho lộ trình có KQ.
- [ ] `PBC-3`: nhập KQ thi thật → `thi_that_target` = Target lúc đó; đổi Target sau → "Đạt Target thi thật" (Báo cáo HV, Kết quả thi, Pass Target hồ sơ GV) không đổi.
- [ ] `PBC-4`: em có hai ghi danh (đổi lớp sau ngày thi) → `lopLucThiThat` = lớp cũ; Phân tích GV và Kết quả thi cùng lớp đó.
- [ ] FAIL → sửa → PASS → commit.

### Task 3: Chấm điểm GV theo trạng thái tại hạn
**Files:** `server/src/phanTich/giaoVien.ts:~129, 210`. Test `PBC-5`: em lưu trữ hôm nay → `chamDiem` của GV ở kỳ trước giữ nguyên số trước / sau khi lưu trữ.
- [ ] FAIL → sửa → PASS → commit.

### Task 4: Q12 bài S chấm chéo chưa ai nhận (Admin)
**Files:** `server/src/worklist/tongQuanMt.ts` (+ nơi `myWork` gắn `urgency` cho dòng đó nếu cần — CẨN THẬN băm TD4-a: nếu JSON Công việc đổi thì chụp lại băm theo luật ghi trong `tocDo.run.ts`). Test `PBC-6`: Admin seed: ô quá hạn + Σ bảng khớp nhau sau sửa; dòng "Chưa có GV" ghi "chờ chấm", không "quá hạn n ngày".
- [ ] Điều tra tập trước (ghi kết quả vào PR) → FAIL → sửa → PASS → commit.

### Task 5: Kiểm cuối
- [ ] `npm run check` xanh; `/ponytail-review`; `DEPLOY_2026-10.md` một dòng migrate `prBaoCaoLichSu`; mô tả PR: số trước / sau trên seed (Phân tích GV, Kết quả thi, Admin), dòng 10.3 "HV đổi GV / lớp / Target hoặc lưu trữ". Mở PR, KHÔNG merge; nhắn "PTA Plan".
