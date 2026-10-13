/**
 * PHÉP KIỂM PR-OV4c — W1 / W2 / S: Band tự tính từ 4 tiêu chí; nhập Band thẳng CHỈ ở MT cũ (`lich_su = 1`) và MT0 (một ô Band).
 * Máy chủ: `band` thẳng ở lượt thường → 400; `band: null` vẫn xoá; L / R không đổi. Web: `criteriaPatchFrom` nhận cờ, hộp không có ô nhập Band.
 * Mỗi ca cuộn lại (`thu`).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const nguon = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

export async function runPrOv4cTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, classId } = t;
  const d = await import('../../../shared/domain/index.ts');
  const attempts: any = await import('../fasttrack/attempts.ts');
  const skillSchedule: any = await import('../fasttrack/skillSchedule.ts');
  const week: any = await import('../platform/week.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nPR-OV4c · W / S: Band tự tính, nhập Band thẳng chỉ ở MT cũ');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const loi = (fn: () => unknown): any => { try { fn(); } catch (e) { return e; } return null; };

  const lop = classId('MB FT 101');
  const QL = P.mbManager;
  const W = week.ensurePeriod(week.mondayOf(TODAY)).id as number;
  const aid = one(
    `SELECT a.id FROM assessment_attempts a WHERE a.class_id = ? AND a.kind = 'mock' AND a.status != 'cancelled' ORDER BY a.id LIMIT 1`, lop).id as number;

  /** Lượt MT ở tuần hiện tại, chưa điểm; `cu` = MT cũ (`lich_su = 1`). */
  const dung = (cu: boolean) => {
    skillSchedule.ensureSkillRows(aid);
    conn.prepare('DELETE FROM assessment_scores WHERE attempt_id = ?').run(aid);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, sit_status = 'scheduled', required = 1, absence_move_count = 0, huy_vang = 0,
      absent_from_no_show = 0, deadline_override = NULL WHERE attempt_id = ?`).run(W, aid);
    conn.prepare(`UPDATE assessment_attempts SET status = 'planned', lich_su = ?, planned_period_id = ?, deadline_override = NULL WHERE id = ?`).run(cu ? 1 : 0, W, aid);
    xoaNho();
  };
  const diem = (skill: string) => one('SELECT band, c1, c2, c3, c4, raw_score FROM assessment_scores WHERE attempt_id = ? AND skill = ?', aid, skill);
  const CAU = 'Writing / Speaking: nhập 4 tiêu chí — Band tự tính. Band nhập thẳng chỉ cho MT cũ.';

  check('OV4c-1 · lượt thường: band thẳng ở W1 / W2 / S → 400 đúng câu, không ghi gì; 4 tiêu chí → band tự tính lưu đúng', () => thu(() => {
    dung(false);
    for (const k of ['writing1', 'writing2', 'speaking']) {
      const e = loi(() => attempts.saveScore(QL, aid, k, { band: 6.5 }));
      assert(e?.status === 400 && e.message === CAU, `${k}: ${e?.status} ${e?.message}`);
      assert(!diem(k), `${k}: không được ghi dòng điểm`);
    }
    attempts.saveScore(QL, aid, 'writing1', { criteria: [6, 6.5, 7, 6.5] });
    const r = diem('writing1');
    assert(r.band === 6.5 && r.c1 === 6 && r.c4 === 6.5, JSON.stringify(r));
    attempts.saveScore(QL, aid, 'speaking', { criteria: [7, 7, 7, 6] });
    assert(diem('speaking').band === 7, JSON.stringify(diem('speaking')));
  }));

  check('OV4c-2 · MT cũ (lich_su = 1): band thẳng → lưu (tiêu chí xoá); 4 tiêu chí → lưu', () => thu(() => {
    dung(true);
    attempts.saveScore(QL, aid, 'writing1', { band: 6.5 });
    const a = diem('writing1');
    assert(a.band === 6.5 && a.c1 === null, JSON.stringify(a));
    attempts.saveScore(QL, aid, 'speaking', { criteria: [6, 6, 6, 6] });
    assert(diem('speaking').band === 6, JSON.stringify(diem('speaking')));
    const e = loi(() => attempts.saveScore(QL, aid, 'writing2', { band: 6, criteria: [6, 6, null, null] }));
    assert(e?.status === 400, `band cùng tiêu chí ở MT cũ vẫn 400: ${e?.status}`);
  }));

  check('OV4c-3 · ô có band nhập thẳng từ trước (lượt thường): tiêu chí thay band; band: null xoá được', () => thu(() => {
    dung(false);
    conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, band, nhap_dau_ngay) VALUES (?,?,?,?)`).run(aid, 'writing1', 6, TODAY);
    conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, band, nhap_dau_ngay) VALUES (?,?,?,?)`).run(aid, 'speaking', 7, TODAY);
    attempts.saveScore(QL, aid, 'writing1', { criteria: [7, 7, 7, 7] });
    const a = diem('writing1');
    assert(a.band === 7 && a.c1 === 7, `tiêu chí phải thay band cũ: ${JSON.stringify(a)}`);
    attempts.saveScore(QL, aid, 'speaking', { band: null });
    const s = diem('speaking');
    assert(s.band === null && s.c1 === null, `band: null phải xoá: ${JSON.stringify(s)}`);
  }));

  check('OV4c-4 · L / R không đổi: band "6.5" và số câu vẫn nhận ở lượt thường', () => thu(() => {
    dung(false);
    attempts.saveScore(QL, aid, 'listening', { band: 6.5 });
    assert(diem('listening').band === 6.5, JSON.stringify(diem('listening')));
    attempts.saveScore(QL, aid, 'reading', { rawScore: 30 });
    assert(diem('reading').raw_score === 30, JSON.stringify(diem('reading')));
  }));

  check('OV4c-5 · duocNhapBandThang: lượt thường không; MT cũ có; MT0 có (một ô Band)', () => {
    assert(d.duocNhapBandThang({ lichSu: false }) === false, 'lượt thường');
    assert(d.duocNhapBandThang({ lichSu: true }) === true, 'MT cũ');
    assert(d.duocNhapBandThang({ lichSu: false, mt0: true }) === true, 'MT0');
  });

  check('OV4c-6 · criteriaPatchFrom: lượt thường + bandText → không gửi band, có câu; MT cũ → {band}; tiêu chí không đổi', () => {
    const o = { noShow: null };
    const a = d.criteriaPatchFrom(['', '', '', ''], o, '6.5', false);
    assert(a.patch === null && a.loi === d.LOI_BAND_TU_TINH, JSON.stringify(a));
    const b = d.criteriaPatchFrom(['', '', '', ''], o, '6.5', true);
    assert(b.patch?.band === 6.5 && b.preview === 6.5, JSON.stringify(b));
    const c = d.criteriaPatchFrom(['6', '6', '6.5', '7'], o, '', false);
    assert(c.patch?.criteria?.length === 4 && c.preview === 6.5 && !('band' in (c.patch ?? {})), JSON.stringify(c));
    assert(d.criteriaPatchFrom(['', '', '', ''], { daChot: true }, '', false).patch?.noShow === false, 'gỡ dấu vẫn được');
  });

  check('OV4c-7 · ô trong lưới mang cờ bandThang: lượt thường false, MT cũ true (một nguồn với máy chủ)', () => thu(() => {
    for (const cu of [false, true]) {
      dung(cu);
      const sheet = attempts.classScoreSheet(QL, lop, W, TODAY) as any;
      const hang = sheet.rows.find((r: any) => r.attemptId === aid);
      assert(hang, `lượt ${cu ? 'MT cũ' : 'thường'} phải có hàng trong lưới`);
      for (const c of hang.cells) assert(c.bandThang === cu, `${c.skill}: bandThang=${c.bandThang}, cần ${cu}`);
    }
  }));

  check('OV4c-8 · hộp nhập điểm: ô Band W / S chỉ đọc ở lượt thường; ô nhập chỉ khi cell.bandThang; MT0 giữ ô Band', () => {
    const hop = nguon('web/src/modules/fasttrack/HopNhapDiem.tsx');
    assert(/cell\.bandThang/.test(hop) && /criteriaPatchFrom\(vals, cell, bandText, cell\.bandThang\)/.test(hop), 'hộp phải đọc cell.bandThang');
    assert(/criteriaPatchFrom\(\['', '', '', ''\], cell, s, true\)/.test(hop), 'MT0 vẫn nhập Band thẳng');
    const se = nguon('web/src/modules/fasttrack/ScoreEntry.tsx');
    assert(/bandThang\??: boolean/.test(se), 'Cell.bandThang');
  });
}
