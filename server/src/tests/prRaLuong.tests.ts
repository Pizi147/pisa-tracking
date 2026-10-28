/**
 * PHÉP KIỂM RA-LUONG (rà soát luồng đêm 29/10).
 * RA-LUONG-2 (Rulebook R14, 14/10-Q13): dời TAY lịch Test một môn lớp thường — chỉ Quản lý; GVCN / GVBM lớp thường 403 (máy vẫn tự dời khi gõ "-").
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrRaLuongTests(t: YThucTestKit) {
  const { check, assert, conn, TODAY, P, addDays } = t;
  const week: any = await import('../platform/week.ts');
  const lich: any = await import('../fasttrack/skillSchedule.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const fsMod: any = await import('node:fs');
  const require_sos: any = await import('../cases/sos.ts');
  const require_mywork: any = await import('../worklist/mywork.ts');
  const require_perm: any = await import('../permissions.ts');
  const require_hangLoat: any = await import('../students/hangLoat.ts');
  const require_keHoach: any = await import('../keHoach/keHoachTest.ts');
  const require_thongBao: any = await import('../platform/thongBao.ts');
  const require_chotVang: any = await import('../ops/chotVangDinhKy.ts');
  const require_d: any = await import('../../../shared/domain/index.ts');
  console.log('\nRA-LUONG · rà soát luồng đêm 29/10');

  const nem = (fn: () => unknown): number | null => { try { fn(); return null; } catch (e: any) { return e?.status ?? -1; } };
  const vaiLop = (core: 0 | 1) => conn.prepare(
    `SELECT s.attempt_id, s.skill, a.class_id, ta.user_id
       FROM attempt_skills s JOIN assessment_attempts a ON a.id = s.attempt_id
       JOIN classes c ON c.id = a.class_id AND c.is_fast_track = 0 AND c.status = 'active'
       JOIN teacher_assignments ta ON ta.class_id = c.id AND ta.status = 'active' AND ta.is_core = ?
            AND (ta.is_core = 1 OR ta.skill = s.skill)
      WHERE s.required = 1 AND s.planned_period_id IS NOT NULL AND a.status <> 'cancelled'
      ORDER BY s.attempt_id LIMIT 1`,
  ).all(core)[0] as any;

  check('RA-LUONG-2 · lớp thường: GVBM đúng môn và GVCN dời tay lịch một môn → 403 (chỉ Quản lý); Quản lý không bị chặn quyền', () => {
    const toi = week.ensurePeriod(addDays(week.mondayOf(TODAY), 14)).id as number;
    for (const [ten, r] of [['GVBM', vaiLop(0)], ['GVCN', vaiLop(1)]] as const) {
      assert(r, `${ten}: seed phải có lượt lớp thường có lịch`);
      const st = nem(() => lich.setSkillWeek(loadPrincipal(r.user_id), r.attempt_id, r.skill, toi, { force: true, today: TODAY }));
      assert(st === 403, `${ten} dời tay phải 403, được ${st}`);
    }
    const r = vaiLop(0);
    const st = nem(() => lich.setSkillWeek(P.mbManager, r.attempt_id, r.skill, toi, { force: true, today: TODAY }));
    assert(st !== 403, `Quản lý không được 403 (có thể 400 vì luật lịch), được ${st}`);
  });

  check('RA-LUONG-4 · Công việc: nút "Gia hạn" chỉ ở việc Chọn bước tiếp — "Cập nhật KQ thi thật" không hạn (N6), máy chủ từ chối gia hạn', () => {
    const fs: any = fsMod;
    const nguon = fs.readFileSync('web/src/modules/congViec/HoTroHocVienTab.tsx', 'utf8') as string;
    const dong = nguon.split('\n').find((l) => l.includes('nutPhu={(x) =>')) ?? '';
    assert(/x\.group === 'buoc_tiep'/.test(dong) && !/thi_that/.test(dong), `nutPhu: ${dong.trim()}`);
  });

  check('RA-LUONG-7 · Case tái phát (Case cũ đã đóng): thừa kế chủ Case cũ CHỈ khi người đó còn dạy lớp; đã thôi dạy → GV đang dạy kỹ năng (N8 ②)', () => {
    const sos = require_sos;
    const d = require_d;
    const r = conn.prepare(
      `SELECT a.*, ta.user_id AS gv FROM assessment_attempts a JOIN classes c ON c.id = a.class_id AND c.is_fast_track = 1
         JOIN teacher_assignments ta ON ta.class_id = a.class_id AND ta.skill = 'reading' AND ta.status = 'active'
        WHERE a.kind = 'mock' AND a.cycle_id IS NOT NULL ORDER BY a.id LIMIT 1`).all()[0] as any;
    assert(r, 'seed phải có lượt Mock lớp FT có GV Reading');
    const ngoai = conn.prepare(`SELECT id FROM users WHERE id NOT IN (SELECT user_id FROM teacher_assignments WHERE class_id = ? AND status = 'active') ORDER BY id LIMIT 1`).all(r.class_id)[0] as any;
    const key = d.caseDedupKey({ category: 'reading', studentId: r.student_id, cycleId: r.cycle_id });
    conn.prepare('UPDATE sos_cases SET dedup_key = NULL WHERE dedup_key = ?').run(key);
    const cu = Number(conn.prepare(`INSERT INTO sos_cases (attempt_id, student_id, cycle_id, topic, category, origin_kind, detected_at, sos_level, status, dedup_key, owner_user_id, created_at)
      VALUES (?,?,?, 'reading','reading','mock', ?, 1, 'done', ?, ?, ?)`).run(r.id, r.student_id, r.cycle_id, TODAY, key, ngoai.id, TODAY).lastInsertRowid);
    const moi = sos.upsertCategoryCase(P.mbManager, r, 'reading', 'reading', 1, TODAY);
    const chu = (conn.prepare('SELECT owner_user_id o, previous_case_id p FROM sos_cases WHERE id = ?').all(moi.id)[0] as any);
    assert(chu.p === cu, `phải là Case tái phát nối Case cũ (${chu.p} ≠ ${cu})`);
    assert(chu.o !== ngoai.id && chu.o === r.gv, `chủ Case mới phải là GV Reading đang dạy (${r.gv}), được ${chu.o}`);
  });

  check('RA-LUONG-8 · Case tạm (em KCK, lượt chưa chốt) KHÔNG sinh việc "Mô tả Case" (N8 ④ — SOS tạm không việc)', () => {
    const mywork: any = require_mywork;
    const { loadPrincipal: lp } = require_perm;
    const c = conn.prepare(
      `SELECT sc.id, sc.owner_user_id, sc.tam, sc.kck FROM sos_cases sc WHERE sc.status != 'done' AND sc.owner_user_id IS NOT NULL AND sc.tam = 0
          AND EXISTS (SELECT 1 FROM case_interventions p WHERE p.case_id = sc.id AND p.preset = 1)
          AND NOT EXISTS (SELECT 1 FROM case_issues ci WHERE ci.case_id = sc.id AND ci.role = 'primary') ORDER BY sc.id LIMIT 1`).all()[0] as any;
    assert(c, 'seed phải có Case SOS chưa mô tả');
    const coViec = () => (mywork.myWork(lp(c.owner_user_id)).items as any[]).some((x) => x.caseId === c.id && (x.group === 'ghi_nhan_xet' || x.group === 'cause'));
    assert(coViec(), 'tiền đề: Case thật chưa mô tả có việc');
    conn.prepare('UPDATE sos_cases SET tam = 1, kck = 1 WHERE id = ?').run(c.id);
    try { assert(!coViec(), 'Case tạm vẫn sinh việc Mô tả Case'); }
    finally { conn.prepare('UPDATE sos_cases SET tam = ?, kck = ? WHERE id = ?').run(c.tam, c.kck, c.id); }
  });

  check('RA-LUONG-10 · Hồ sơ lớp: badge "n việc quá hạn" đếm bằng `demViec` (cùng đơn vị Công việc / Tổng quan), không đếm dòng', () => {
    const nguon = fsMod.readFileSync('web/src/modules/classes/DauTrangLop.tsx', 'utf8') as string;
    const dong = nguon.split('\n').find((l) => l.includes('const soViecQuaHan')) ?? '';
    assert(/demViec\(/.test(dong) && !/demQuaHan/.test(nguon), `soViecQuaHan: ${dong.trim()}`);
  });

  check('RA-LUONG-12 · Hàng loạt học viên: lỗi máy chủ ở em giữa lô → em trước đã lưu vẫn báo "ok" + em đó và em sau "chưa lưu", không ném 500 cả lô', () => {
    const hl: any = require_hangLoat;
    const ds = conn.prepare(
      `SELECT s.id FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active' JOIN classes c ON c.id = e.class_id AND c.code = 'MB FT 101'
        WHERE s.status = 'active' AND s.archived_at IS NULL ORDER BY s.id LIMIT 3`).all().map((x: any) => x.id as number);
    assert(ds.length === 3, 'seed phải có 3 em đang học MB FT 101');
    conn.exec(`CREATE TEMP TRIGGER ra_luong_12 BEFORE UPDATE ON students WHEN NEW.id = ${ds[1]} BEGIN SELECT RAISE(ABORT, 'thu loi may chu'); END`);
    let kq: any = null, nem: any = null;
    try { kq = hl.chay(P.mbManager, { viec: 'tam-dung', studentIds: ds }); } catch (e) { nem = e; }
    finally { conn.exec('DROP TRIGGER IF EXISTS ra_luong_12'); }
    try {
      assert(!nem, `không được ném cả lô: ${nem?.message}`);
      assert(kq.ok.join() === String(ds[0]) && kq.failed.map((f: any) => f.studentId).join() === `${ds[1]},${ds[2]}`, `ok ${kq?.ok} · failed ${JSON.stringify(kq?.failed)}`);
    } finally { if (kq?.ok?.length) hl.chay(P.mbManager, { viec: 'hoan-tac-tam-dung', studentIds: kq.ok }); }
  });

  check('RA-LUONG-11 · Ý thức cả lớp: lưu được một phần → giữ nháp + còn "đã sửa" (đóng thì hỏi) — không mất chữ đang gõ của em chưa lưu', () => {
    const nguon = fsMod.readFileSync('web/src/modules/yThuc/LoYThucPanel.tsx', 'utf8') as string;
    assert(/if \(coOk\) \{ if \(!coLoi\) xoaNhap\(\);/.test(nguon), 'xoá nháp cả khi còn em chưa lưu');
    assert(/daSua: \(!soOk \|\| soLoi > 0\)/.test(nguon), 'còn em chưa lưu mà panel không coi là đã sửa');
  });

  check('RA-LUONG-13 · Thêm học viên: bỏ dòng đã thêm theo dòng ĐÃ GỬI (đối tượng), không theo chỉ số lưới lúc trả về — sửa / dán đè trong lúc chờ không mất dòng', () => {
    const nguon = fsMod.readFileSync('web/src/modules/students/IntakePanel.tsx', 'utf8') as string;
    assert(/const gui = rows;/.test(nguon) && /rows: gui,/.test(nguon) && /rs\.filter\(\(x\) => !daThem\.has\(x\)\)/.test(nguon), 'commit chưa chụp dòng đã gửi');
  });

  check('RA-LUONG-14 · Hồ sơ HV tab Ý thức: em chưa có lộ trình (`cycle` null) không văng trang — đọc `cy?.ratio` như mọi chỗ khác', () => {
    const nguon = fsMod.readFileSync('web/src/modules/students/StudentDetailPage.tsx', 'utf8') as string;
    const dong = nguon.split('\n').find((l) => l.includes('<StudentYThucSection')) ?? '';
    assert(/thuong=\{!!cy\?\.ratio\}/.test(dong), `tab Ý thức còn đọc cy.ratio khi cy có thể null: ${dong.trim()}`);
  });

  check('RA-LUONG-15 · Sửa cả lớp: một ô lỗi không chặn cả bảng — Lưu gửi các em hợp lệ, em có ô lỗi ở lại lưới (lô lỗi một phần)', () => {
    const nguon = fsMod.readFileSync('web/src/modules/students/SuaCaLopPanel.tsx', 'utf8') as string;
    assert(/const guiDuoc = payload\.filter\(\(r\) => !emLoi\.has\(r\.studentId\)\)/.test(nguon) && /chiaLoSuaCaLop\(guiDuoc,/.test(nguon), 'Lưu chưa lọc em lỗi');
    assert(!/soLoi > 0 \|\| !xem\}/.test(nguon), 'nút Lưu còn khoá khi có ô lỗi');
  });

  check('RA-LUONG-17 · Xếp "MT mới" hàng loạt: bấm Lưu lại CÙNG khoá + cùng nội dung (mất phản hồi) → trả kết quả cũ, không tạo MT n+1; khoá mới → lần lưu mới', () => {
    const kh: any = require_keHoach;
    const lop = conn.prepare(`SELECT id FROM classes WHERE code = 'MB FT 105'`).all()[0] as any;
    const em = (conn.prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' ORDER BY student_id LIMIT 2`).all(lop.id) as any[]).map((x) => x.student_id as number);
    const tuanId = week.ensurePeriod(addDays(week.mondayOf(TODAY), 35)).id as number;
    const tuan = { listening: tuanId, reading: tuanId, writing: tuanId, speaking: tuanId };
    const soMt = () => (conn.prepare(`SELECT COUNT(*) n FROM assessment_attempts WHERE kind = 'mock' AND status != 'cancelled' AND student_id IN (${em.map(() => '?').join(',')})`).all(...em)[0] as any).n as number;
    const truoc = soMt();
    const gui = { classId: lop.id, attemptNo: 'moi', studentIds: em, tuan, force: true, idempotencyKey: 'ra-luong-17' };
    const r1 = kh.xepHangLoat(P.mbManager, gui, TODAY);
    const sau1 = soMt();
    const r2 = kh.xepHangLoat(P.mbManager, gui, TODAY);
    assert(r1.daLuu > 0 && sau1 === truoc + r1.daLuu, `lần một phải tạo MT: ${JSON.stringify(r1.dong.map((d: any) => [d.hanhDong, d.loi]))}`);
    assert(soMt() === sau1 && JSON.stringify(r2) === JSON.stringify(r1), 'bấm lại cùng khoá không được tạo thêm MT');
    kh.xepHangLoat(P.mbManager, { ...gui, idempotencyKey: 'ra-luong-17b' }, TODAY);
    assert(soMt() > sau1, 'khoá mới = lần lưu mới (MT kế tiếp)');
  });

  check('RA-LUONG-19 · Chuông: "Case giao" chỉ Cần làm với người ĐANG phụ trách; dòng Cần làm đã đọc không bị 60 dòng chưa đọc đẩy khỏi 50 dòng', () => {
    const tb: any = require_thongBao;
    const c = conn.prepare(`SELECT sc.id, sc.owner_user_id FROM sos_cases sc WHERE sc.status != 'done' AND sc.owner_user_id IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM case_interventions ci WHERE ci.case_id = sc.id AND ci.status != 'cancelled') ORDER BY sc.id LIMIT 1`).all()[0] as any;
    assert(c, 'seed phải có Case mở chưa PA có người phụ trách');
    const khac = (conn.prepare(`SELECT id FROM users WHERE id NOT IN (?) ORDER BY id LIMIT 1`).all(c.owner_user_id)[0] as any).id as number;
    const them = conn.prepare(`INSERT INTO notifications (user_id, kind, title, entity_type, entity_id, dedup_key, read_at, created_at) VALUES (?,?,?,?,?,?,?,?)`);
    const moc = (conn.prepare('SELECT COALESCE(MAX(id), 0) m FROM notifications').all()[0] as any).m as number;
    try {
      them.run(c.owner_user_id, 'case_giao', 'ra-luong-19', 'sos_case', c.id, `ra19:${c.id}`, TODAY, TODAY);
      them.run(khac, 'case_giao', 'ra-luong-19', 'sos_case', c.id, `ra19:${c.id}`, null, TODAY);
      for (let n = 0; n < 60; n++) them.run(c.owner_user_id, 'thu', `ra-luong-19 ${n}`, null, null, `ra19-moi:${n}`, null, TODAY);
      const cua = (u: number) => (tb.thongBaoCua(u) as any[]).find((x) => x.title === 'ra-luong-19' && x.entity_id === c.id);
      const chu = cua(c.owner_user_id);
      assert(chu && chu.con_viec === 1, `người phụ trách: Case giao đã đọc vẫn trong danh sách và còn việc (${JSON.stringify(chu)})`);
      assert(cua(khac)?.con_viec === 0, 'người không phụ trách: Case giao thành Để biết');
    } finally { conn.prepare('DELETE FROM notifications WHERE id > ?').run(moc); }
  });

  check('RA-LUONG-18 · quét định kỳ (cron thứ Hai) chạy cả `sweepExpiredMoves` và `quetYeuCau` — không chỉ khi có người mở web (P08); chạy lặp vô hại', () => {
    const cv: any = require_chotVang;
    const nguon = fsMod.readFileSync('server/src/ops/chotVangDinhKy.ts', 'utf8') as string;
    assert(/sweepExpiredMoves\(\)/.test(nguon) && /quetYeuCau\(/.test(nguon), 'chotVangDinhKy chưa gọi hai lượt quét');
    const a = cv.chotVangDinhKy({ ngay: TODAY }), b = cv.chotVangDinhKy({ ngay: TODAY });
    assert(a.boQua === null && b.boQua === null && b.daChuyen === 0, `chạy hai lần: ${JSON.stringify([a, b])}`);
  });

  check('RA-LUONG-5 · Huỷ quyết định chuyển lớp một em có Hoàn tác (cùng đường khôi phục `huy-lenh` → `khoi-phuc-lenh` của Cuối khoá)', () => {
    const nguon = fsMod.readFileSync('web/src/modules/students/ChuyenLopPanel.tsx', 'utf8') as string;
    const huy = nguon.slice(nguon.indexOf('const huyLenh = async'), nguon.indexOf('const nhanChinh'));
    assert(/toast\.hoanTac\(/.test(huy) && /hoanTacHangLoat\('huy-lenh', \[studentId\]\)/.test(huy), 'huyLenh thiếu Hoàn tác');
  });
}
