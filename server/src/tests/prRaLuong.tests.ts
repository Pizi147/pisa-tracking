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

  check('RA-LUONG-5 · Huỷ quyết định chuyển lớp một em có Hoàn tác (cùng đường khôi phục `huy-lenh` → `khoi-phuc-lenh` của Cuối khoá)', () => {
    const nguon = fsMod.readFileSync('web/src/modules/students/ChuyenLopPanel.tsx', 'utf8') as string;
    const huy = nguon.slice(nguon.indexOf('const huyLenh = async'), nguon.indexOf('const nhanChinh'));
    assert(/toast\.hoanTac\(/.test(huy) && /hoanTacHangLoat\('huy-lenh', \[studentId\]\)/.test(huy), 'huyLenh thiếu Hoàn tác');
  });
}
