/**
 * TAB PHÂN TÍCH LỚP (PR-Qa, đặc tả §3.7, mockup 06) — lớp tiến bộ hay đi lùi ở kỹ năng nào qua các đợt.
 *
 *   FT         5 kỹ năng (L · R · W1 · W2 · S) × MT1…MT5. Ô = số HV có band ≥ kỳ vọng CỦA ĐỢT ĐÓ / số HV có điểm ô đó.
 *              W1, W2 so riêng từng bài với kỳ vọng (SOS vẫn tính Writing gộp — web ghi rõ ở ⓘ).
 *   Lớp thường 4 môn (L · R · W · S) × Giữa khoá / Cuối khoá. Ô = số HV đạt (từ 70%) / số HV có điểm môn đó.
 *
 * Chỉ học viên ĐANG HỌC lớp này (không lưu trữ), chỉ lộ trình đang chạy. Chưa có điểm KHÁC trượt: không vào mẫu số.
 */
import {
  ENTRY_SKILLS, ENTRY_SKILL_SHORT, PERMISSIONS, REGULAR_SKILLS, categoryOf, skillShort, tenKyNang,
} from '../../../shared/domain/index.ts';
import { db } from '../db.ts';
import { require_, type Principal } from '../permissions.ts';
import { loadBundle } from '../fasttrack/attempts.ts';
import { expectationFor } from '../fasttrack/scoring.ts';
import { evaluateRegular, programmeOfClass } from '../normal/regular.ts';

export type OPhanTich = { dat: number; tong: number };
export type PhanTichLop = {
  loai: 'ft' | 'thuong';
  dong: { key: string; nhan: string; tenDayDu: string; category: string }[];
  cot: { key: string; nhan: string }[];
  o: Record<string, OPhanTich>;
  soHocVien: number;
};

export function phanTichLop(p: Principal, classId: number): PhanTichLop {
  require_(p, PERMISSIONS.ATTEMPT_VIEW, { classId }, 'Lớp này nằm ngoài phạm vi bạn được xem.');
  const conn = db();
  const prog = programmeOfClass(classId);
  const thuong = prog?.scoringMode === 'ratio';
  const hv = conn.prepare(
    `SELECT s.id, cy.id AS cycle_id, cy.target_score FROM enrollments e
       JOIN students s ON s.id = e.student_id
       LEFT JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
      WHERE e.class_id = ? AND e.status = 'active' AND s.archived_at IS NULL`,
  ).all(classId) as any[];
  const mucTieu = new Map<number, number | null>(hv.filter((h) => h.cycle_id).map((h) => [h.cycle_id, h.target_score ?? null]));
  const cycleIds = [...mucTieu.keys()];
  const attempts = cycleIds.length
    ? conn.prepare(
      `SELECT * FROM assessment_attempts WHERE cycle_id IN (${cycleIds.map(() => '?').join(',')}) AND status != 'cancelled'`,
    ).all(...cycleIds) as any[]
    : [];
  const bundle = loadBundle(attempts.map((a) => a.id));
  const o: Record<string, OPhanTich> = {};
  const cong = (k: string, dat: boolean) => {
    const x = o[k] ?? (o[k] = { dat: 0, tong: 0 });
    x.tong += 1;
    if (dat) x.dat += 1;
  };

  if (thuong) {
    const mon = [...(prog?.skills ?? REGULAR_SKILLS)];
    for (const a of attempts) {
      if (a.kind !== 'progress' && a.kind !== 'final') continue;
      const r = evaluateRegular(mon, (bundle.scores.get(a.id) ?? []) as any);
      for (const x of r.skills) if (x.outcome === 'pass' || x.outcome === 'fail') cong(`${x.skill}|${a.kind}`, x.outcome === 'pass');
    }
    return {
      loai: 'thuong',
      dong: mon.map((k) => ({ key: k, nhan: skillShort(k), tenDayDu: tenKyNang(k), category: categoryOf(k) ?? k })),
      cot: [{ key: 'progress', nhan: 'Giữa khoá' }, { key: 'final', nhan: 'Cuối khoá' }],
      o, soHocVien: hv.length,
    };
  }

  let soDot = 5;
  for (const a of attempts) {
    if ((a.kind ?? 'mock') !== 'mock') continue;
    soDot = Math.max(soDot, a.attempt_no);
    const kyVong = expectationFor(mucTieu.get(a.cycle_id) ?? null, a.attempt_no);
    if (kyVong === null) continue;
    for (const s of (bundle.scores.get(a.id) ?? []) as any[]) {
      if (s.band === null || s.band === undefined) continue;
      cong(`${s.skill}|mt${a.attempt_no}`, s.band >= kyVong);
    }
  }
  return {
    loai: 'ft',
    dong: ENTRY_SKILLS.map((k) => ({ key: k, nhan: ENTRY_SKILL_SHORT[k], tenDayDu: tenKyNang(k), category: k })),
    cot: Array.from({ length: soDot }, (_, i) => ({ key: `mt${i + 1}`, nhan: `MT${i + 1}` })),
    o, soHocVien: hv.length,
  };
}
