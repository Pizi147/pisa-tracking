/**
 * PHÉP KIỂM CV-SUA-1011 (chủ SP 10/11, `plan.md` mục 4 "5 ý") — ② "-" ở một W = CẢ HAI W vắng · ④ GVCN không S không còn việc "Chấm Speaking"
 * (bỏ dòng theo dõi T18 06/11) · ⑤ dòng Theo dõi Nhập điểm / Chấm Speaking mở thẳng lưới (hàng đợi của đúng GV đang xem).
 * Ca W dựng trong giao dịch rồi cuộn lại (`thu`), như prOv1b.
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { docSach } from './panelUx3.tests.ts';
import { LUOT_LO_TRINH_CUOI_SQL } from '../students/tamDung.ts';

export async function runPrCvSua1011Tests(t: YThucTestKit) {
  const { check, assert, assertThrows, conn, P, classId, TODAY } = t as any;
  const attempts: any = await import('../fasttrack/attempts.ts');
  const skillSchedule: any = await import('../fasttrack/skillSchedule.ts');
  const week: any = await import('../platform/week.ts');
  const perm: any = await import('../permissions.ts');
  const mw: any = await import('../worklist/mywork.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nCV-SUA-1011 · W "-" cả hai · bỏ Chấm Speaking của GVCN · theo dõi mở thẳng lưới');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];

  // ------------------------------------------------------------------ ② W "-"
  const lop = classId('MB FT 101');
  /* Tuần thi W1 NOV 2026 (02–08/11): trong tuần = 04/11; MT cũ của kỹ năng (cách ≥ 2 tuần) = 25/11. */
  const WS = '2026-11-02', TRONG = '2026-11-04', CU = '2026-11-25';
  const W = week.ensurePeriod(WS).id as number, W1 = week.ensurePeriod('2026-11-09').id as number;
  const a = one(
    `SELECT a.id FROM assessment_attempts a JOIN students s ON s.id = a.student_id AND s.status = 'active' AND s.archived_at IS NULL AND ${LUOT_LO_TRINH_CUOI_SQL('a')}
      JOIN enrollments e ON e.student_id = s.id AND e.class_id = a.class_id AND e.status = 'active'
     WHERE a.class_id = ? AND a.kind = 'mock' AND a.status != 'cancelled' AND a.lich_su = 0
       AND a.attempt_no = (SELECT MAX(x.attempt_no) FROM assessment_attempts x WHERE x.cycle_id = a.cycle_id AND x.kind = 'mock')
     ORDER BY a.id LIMIT 1`, lop)?.id as number;
  /** Lượt sạch: mọi kỹ năng ở tuần W, chưa điểm, chưa vắng (như `dung` của prOv1b). */
  const dung = () => {
    skillSchedule.ensureSkillRows(a);
    conn.prepare('DELETE FROM assessment_scores WHERE attempt_id = ?').run(a);
    conn.prepare('DELETE FROM skill_move_requests WHERE attempt_id = ?').run(a);
    conn.prepare('DELETE FROM attempt_skill_skips WHERE attempt_id = ?').run(a);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, sit_status = 'scheduled', required = 1, absence_move_count = 0, huy_vang = 0,
      absent_from_no_show = 0, deadline_override = NULL, bo_task = NULL WHERE attempt_id = ?`).run(W, a);
    conn.prepare(`UPDATE assessment_attempts SET status = 'planned', planned_period_id = ?, deadline_override = NULL WHERE id = ?`).run(W, a);
    xoaNho();
  };
  const ky = () => one(`SELECT * FROM attempt_skills WHERE attempt_id = ? AND skill = 'writing'`, a);
  const dau = (s: string) => one('SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = ?', a, s);

  check('CV1011-0 · tiền đề: có lượt MT cuối ở MB FT 101', () => assert(!!a, 'không tìm được lượt'));

  check('CV1011-1 · W1 "-" trong tuần → W2 cùng "-", Writing dời NGAY một lần; gõ "-" W2 sau đó vô hại (không dời lần 2)', () => thu(() => {
    dung();
    const r = attempts.saveScore(P.w1Teacher, a, 'writing1', { noShow: true }, TRONG);
    let k = ky();
    assert(k.planned_period_id === W1 && k.absence_move_count === 1 && k.sit_status === 'scheduled', `W1 "-": ${JSON.stringify(k)}`);
    const w2 = dau('writing2');
    assert(w2?.no_show_period_id === W && !!w2.no_show_settled_at && w2.band === null, `W2 phải cùng "-" đã chốt: ${JSON.stringify(w2)}`);
    assert(r.vang?.kq === 'doi', `hậu quả trả web: ${JSON.stringify(r.vang)}`);
    assert(one(`SELECT COUNT(*) n FROM audit_logs WHERE entity_id = ? AND action = 'score.no_show' AND entity_label = 'writing2'`, a).n === 1, 'nhật ký "-" W2 (theo W1)');
    attempts.saveScore(P.w2Teacher, a, 'writing2', { noShow: true }, TRONG);
    k = ky();
    assert(k.planned_period_id === W1 && k.absence_move_count === 1 && k.sit_status === 'scheduled', `W2 "-" lại: ${JSON.stringify(k)}`);
  }));

  check('CV1011-2 · gỡ "-" (vắng đã chốt) ở W2 → gỡ cả W1 + W2, Writing về tuần gốc, lần vắng 0', () => thu(() => {
    dung();
    attempts.saveScore(P.w1Teacher, a, 'writing1', { noShow: true }, TRONG);
    attempts.saveScore(P.w2Teacher, a, 'writing2', { noShow: false }, TRONG);
    const k = ky();
    assert(k.planned_period_id === W && k.absence_move_count === 0 && k.sit_status === 'scheduled', `gỡ: ${JSON.stringify(k)}`);
    assert(!dau('writing1')?.no_show_period_id && !dau('writing2')?.no_show_period_id, 'còn dấu "-" sau khi gỡ');
  }));

  check('CV1011-3 · MT cũ của kỹ năng: W2 "-" → CẢ HAI Không dự thi; gỡ "-" W1 → gỡ cả hai', () => thu(() => {
    dung();
    const r = attempts.saveScore(P.w2Teacher, a, 'writing2', { noShow: true }, CU);
    assert(r.vang?.kq === 'khong-du-thi', `hậu quả: ${JSON.stringify(r.vang)}`);
    assert(dau('writing1')?.no_show_cu === 1 && dau('writing2')?.no_show_cu === 1, `cả hai Không dự thi: ${JSON.stringify([dau('writing1'), dau('writing2')])}`);
    assert(ky().planned_period_id === W && ky().absence_move_count === 0, 'MT cũ không dời, không đếm');
    attempts.saveScore(P.w1Teacher, a, 'writing1', { noShow: false }, CU);
    assert(!dau('writing1')?.no_show_period_id && !dau('writing2')?.no_show_period_id, 'gỡ một W phải gỡ cả hai');
  }));

  check('CV1011-4 · W1 có điểm + W2 "-": điểm W1 giữ nguyên (không ghi "-" đè), cả W dời như luật cũ', () => thu(() => {
    dung();
    attempts.saveScore(P.w1Teacher, a, 'writing1', { criteria: [6, 6, 6, 6] }, TRONG);
    attempts.saveScore(P.w2Teacher, a, 'writing2', { noShow: true }, TRONG);
    const w1 = dau('writing1');
    assert(w1.band === 6 && !w1.no_show_period_id, `W1: ${JSON.stringify(w1)}`);
    assert(ky().planned_period_id === W1 && ky().absence_move_count === 1, `dời cả W: ${JSON.stringify(ky())}`);
  }));

  // ------------------------------------------------------------------ ④ GVCN không S
  /* GVCN đang hiệu lực của lớp FT chi nhánh MB, không là GV Speaking. */
  const gvcnKhongS = [...new Set(all(
    `SELECT ta.user_id FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id JOIN branches b ON b.id = c.branch_id
      WHERE ta.is_core = 1 AND ta.status = 'active' AND c.is_fast_track = 1 AND c.status = 'active' AND b.code = 'MB'
        AND ta.effective_from <= ? AND (ta.effective_to IS NULL OR ta.effective_to >= ?)`, TODAY, TODAY).map((r) => r.user_id as number))]
    .map((id) => perm.loadPrincipal(id)).filter((x: any) => !perm.laGvSpeaking(x, TODAY));

  check('CV1011-5 · GVCN không là GV Speaking: không việc "Chấm Speaking" ở Của tôi, ở "Của GV" của QL, không hàng đợi', () => {
    assert(gvcnKhongS.length > 0, 'dữ liệu demo: cần GVCN lớp FT MB không dạy S');
    for (const x of gvcnKhongS) {
      assert(!(mw.myWork(x).items as any[]).some((i) => i.key === d.KHOA_CHAM_SPEAKING), `${x.fullName}: Của tôi còn Chấm Speaking`);
      assert(!(mw.viecCuaNguoi(P.mbManager, x.userId).items as any[]).some((i) => i.key === d.KHOA_CHAM_SPEAKING), `${x.fullName}: Của GV còn Chấm Speaking`);
      assert(attempts.baiChamSpeaking(x, TODAY).rows.length === 0, `${x.fullName}: còn hàng đợi Chấm Speaking`);
    }
  });

  // ------------------------------------------------------------------ ⑤ theo dõi Chấm Speaking = hàng đợi của GV đang xem
  check('CV1011-6 · QL xem việc GV Speaking: hàng đợi `?nguoi=` = đúng số bài dòng việc của GV đó (không panel trống); GV gửi nguoi= → 403', () => {
    const gvS = P.sTeacher;
    const it = (mw.viecCuaNguoi(P.mbManager, gvS.userId).items as any[]).find((i) => i.key === d.KHOA_CHAM_SPEAKING);
    const { x, pv } = mw.gvDangXem(P.mbManager, gvS.userId);
    const h = attempts.baiChamSpeaking(P.mbManager, TODAY, { ai: x, cn: pv.branchIds });
    assert(it ? h.soBai === it.soBai && h.soBai > 0 : h.soBai === 0, `hàng đợi ${h.soBai} bài ≠ dòng việc ${it?.soBai}`);
    /* Không truyền `xem` = hàng đợi của chính QL — khác hàng đợi của GV (gốc panel trống). */
    assert(!it || attempts.baiChamSpeaking(gvS, TODAY).soBai >= h.soBai, 'hàng đợi theo dõi rộng hơn của chính GV');
    assertThrows(() => mw.gvDangXem(P.subjectTeacher, gvS.userId), /chỉ xem được việc của mình/, 'GV xem hàng đợi GV khác');
  });

  check('CV1011-7 · web: Theo dõi Nhập điểm / Chấm Speaking mở thẳng lưới (không tóm tắt + "Nhập hộ"); Chấm Speaking đọc hàng đợi của GV đang xem', () => {
    const tab = docSach('web/src/modules/congViec/HoTroHocVienTab.tsx');
    assert(/const moThang = theoDoiChon && chon\.group === 'score';/.test(tab), 'thiếu mở thẳng việc Nhập điểm');
    assert(/const khoaPanel = theoDoiChon && !moThang && /.test(tab), 'việc Nhập điểm theo dõi vẫn ra tóm tắt');
    assert(/nguoi=\{it\.mine \? null : it\.ownerId\}/.test(docSach('web/src/modules/congViec/PanelViec.tsx')), 'Chấm Speaking theo dõi đọc hàng đợi người xem');
    assert(/cham-speaking\$\{nguoi \? `\?nguoi=\$\{nguoi\}` : ''\}/.test(docSach('web/src/modules/congViec/PanelChamSpeaking.tsx')), 'panel không gửi nguoi=');
  });
}
