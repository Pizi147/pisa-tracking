/**
 * PHÉP KIỂM BAND-THANG (thay phép kiểm PR-OV4c cũ — chủ SP 06/11 khuya): W1 / W2 / S ở MỌI lượt nhập MỘT trong hai kiểu — đủ 4 tiêu chí (Band tự tính)
 * HOẶC chỉ ô Band; gõ cả hai → `LOI_MOT_KIEU` (web đỏ ô + chữ nhỏ, máy chủ 400 cùng câu, cùng hàm `caHaiKieu`). Dữ liệu cũ không đổi.
 * Thay đổi so với OV-4c: "lượt thường: band thẳng → 400" thành "lượt thường nhận band thẳng"; `duocNhapBandThang` / `bandThang` / `LOI_BAND_TU_TINH` bỏ.
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
  const { luuDiemLo } = await import('../cham/luuLo.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nBAND-THANG · W / S: hoặc 4 tiêu chí hoặc Band, không cả hai (mọi lượt)');

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
  const ids = all(`SELECT a.id FROM assessment_attempts a WHERE a.class_id = ? AND a.kind = 'mock' AND a.status != 'cancelled' ORDER BY a.id LIMIT 2`, lop).map((r) => r.id as number);
  const aid = ids[0];
  const CAU = 'Chỉ chọn một kiểu: 4 tiêu chí hoặc Band';

  /** Lượt MT ở tuần hiện tại, chưa điểm; `cu` = MT cũ (`lich_su = 1`). */
  const dung = (cu: boolean, id = aid) => {
    skillSchedule.ensureSkillRows(id);
    conn.prepare('DELETE FROM assessment_scores WHERE attempt_id = ?').run(id);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, sit_status = 'scheduled', required = 1, absence_move_count = 0, huy_vang = 0,
      absent_from_no_show = 0, deadline_override = NULL WHERE attempt_id = ?`).run(W, id);
    conn.prepare(`UPDATE assessment_attempts SET status = 'planned', lich_su = ?, planned_period_id = ?, deadline_override = NULL WHERE id = ?`).run(cu ? 1 : 0, W, id);
    xoaNho();
  };
  const diem = (skill: string, id = aid) => one('SELECT band, c1, c2, c3, c4, raw_score FROM assessment_scores WHERE attempt_id = ? AND skill = ?', id, skill);

  check('BT-1 · caHaiKieu: chỉ tiêu chí / chỉ Band / cả hai / xoá một phía; "-" tính là chữ; số của máy chủ cũng đúng', () => {
    assert(d.caHaiKieu(['6', '', '', ''], '') === false, 'chỉ tiêu chí');
    assert(d.caHaiKieu(['', '', '', ''], '6.5') === false, 'chỉ Band');
    assert(d.caHaiKieu(['', '', '', ''], '') === false, 'trống');
    assert(d.caHaiKieu(['6', '', '', ''], '6.5') === true, 'cả hai');
    assert(d.caHaiKieu(['6', '', '', ''], '  ') === false, 'xoá Band → hết');
    assert(d.caHaiKieu(['', '', '', ''], '6.5') === false, 'xoá tiêu chí → hết');
    assert(d.caHaiKieu(['-', '', '', ''], '6.5') === true, '"-" cùng Band');
    assert(d.caHaiKieu([6, null, null, null], 6.5) === true && d.caHaiKieu([null, null, null, null], 6.5) === false && d.caHaiKieu([6, 6, 6, 6], null) === false, 'số máy chủ');
    assert(d.LOI_MOT_KIEU === CAU, d.LOI_MOT_KIEU);
  });

  check('BT-2 · criteriaPatchFrom: chỉ Band → {band}; chỉ tiêu chí → tiêu chí; cả hai → LOI_MOT_KIEU, không lệnh; xoá một phía → hết lỗi', () => {
    const o = { noShow: null };
    const a = d.criteriaPatchFrom(['', '', '', ''], o, '6.5');
    assert(a.patch?.band === 6.5 && a.preview === 6.5 && a.loi === null, JSON.stringify(a));
    assert(d.criteriaPatchFrom(['', '', '', ''], o, 'b7').patch?.band === 7, 'b7');
    const b = d.criteriaPatchFrom(['6', '6', '', ''], o, '6.5');
    assert(b.patch === null && b.loi === d.LOI_MOT_KIEU, JSON.stringify(b));
    assert(d.criteriaPatchFrom(['6', 'x', '', ''], o, '6.5').loi === d.LOI_MOT_KIEU, 'cả hai thắng lỗi chữ');
    assert(d.criteriaPatchFrom(['-', '', '', ''], o, '6.5').patch === null, '"-" cùng band');
    for (const x of ['6.3', '10', 'abc', '-1']) assert(d.criteriaPatchFrom(['', '', '', ''], o, x).patch === null, `band ${x}`);
    const c = d.criteriaPatchFrom(['6', '6', '6', '7'], o, '');
    assert(c.patch?.criteria?.length === 4 && c.preview === 6.5 && !('band' in (c.patch ?? {})) && c.loi === null, JSON.stringify(c));
    assert(d.criteriaPatchFrom(['', '', '', ''], { daChot: true }, '').patch?.noShow === false, 'gỡ dấu vẫn được');
    assert(d.criteriaPatchFrom(['', '', '', ''], o, '').patch?.criteria?.every((v: unknown) => v === null), 'xoá cả hai ô = xoá điểm');
  });

  check('BT-3 · máy chủ, lượt THƯỜNG và MT cũ: band thẳng ở W1 / W2 / S → lưu (tiêu chí rỗng); 4 tiêu chí → band tự tính; cả hai → 400 đúng câu, không ghi gì', () => thu(() => {
    for (const cu of [false, true]) {
      dung(cu);
      for (const k of ['writing1', 'writing2', 'speaking']) {
        attempts.saveScore(QL, aid, k, { band: 6.5 });
        const r = diem(k);
        assert(r.band === 6.5 && r.c1 === null && r.c4 === null, `${k} (${cu ? 'MT cũ' : 'thường'}): ${JSON.stringify(r)}`);
      }
      dung(cu);
      for (const k of ['writing1', 'speaking']) {
        attempts.saveScore(QL, aid, k, { criteria: [6, 7, 7, 6] });
        const r = diem(k);
        assert(r.band === 6.5 && r.c1 === 6 && r.c4 === 6, `${k}: ${JSON.stringify(r)}`);
      }
      dung(cu);
      for (const k of ['writing1', 'writing2', 'speaking']) {
        const e = loi(() => attempts.saveScore(QL, aid, k, { band: 6, criteria: [6, 6, null, null] }));
        assert(e?.status === 400 && e.message === CAU, `${k} (${cu ? 'MT cũ' : 'thường'}): ${e?.status} ${e?.message}`);
        assert(!diem(k), `${k}: không được ghi dòng điểm`);
      }
      const e2 = loi(() => attempts.saveScore(QL, aid, 'writing1', { band: 6, criteria: [null, null, null, 5] }));
      assert(e2?.status === 400 && e2.message === CAU, 'một tiêu chí cũng là cả hai');
    }
  }));

  check('BT-4 · đổi kiểu = xoá phía cũ: ô có tiêu chí → gửi {band} thay hết tiêu chí; ô chỉ band → tiêu chí thay band; band: null xoá; tiêu chí toàn null xoá', () => thu(() => {
    dung(false);
    attempts.saveScore(QL, aid, 'writing1', { criteria: [7, 7, 7, 7] });
    attempts.saveScore(QL, aid, 'writing1', { band: 6 });
    let r = diem('writing1');
    assert(r.band === 6 && r.c1 === null && r.c4 === null, `tiêu chí → band: ${JSON.stringify(r)}`);
    attempts.saveScore(QL, aid, 'writing1', { criteria: [8, 8, 8, 8] });
    r = diem('writing1');
    assert(r.band === 8 && r.c1 === 8, `band → tiêu chí: ${JSON.stringify(r)}`);
    attempts.saveScore(QL, aid, 'writing1', { band: null });
    r = diem('writing1');
    assert(r.band === null && r.c1 === null, `band: null: ${JSON.stringify(r)}`);
    attempts.saveScore(QL, aid, 'speaking', { band: 7 });
    attempts.saveScore(QL, aid, 'speaking', { criteria: [null, null, null, null] });
    assert(diem('speaking').band === null, 'tiêu chí toàn null xoá band');
  }));

  check('BT-5 · dữ liệu cũ không đổi: ô có band nhập thẳng từ trước vẫn đọc nguyên; L / R không đổi (band "6.5" và số câu; band cùng số câu vẫn 400)', () => thu(() => {
    dung(false);
    conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, band, nhap_dau_ngay) VALUES (?,?,?,?)`).run(aid, 'writing1', 6, TODAY);
    assert(diem('writing1').band === 6, 'band cũ');
    attempts.saveScore(QL, aid, 'listening', { band: 6.5 });
    assert(diem('listening').band === 6.5, JSON.stringify(diem('listening')));
    attempts.saveScore(QL, aid, 'reading', { rawScore: 30 });
    assert(diem('reading').raw_score === 30, JSON.stringify(diem('reading')));
    const e = loi(() => attempts.saveScore(QL, aid, 'reading', { band: 6, rawScore: 30 }));
    assert(e?.status === 400, 'L / R: band cùng số câu vẫn 400');
  }));

  check('BT-6 · Dán Excel (lô): dòng có cả Band lẫn tiêu chí → lỗi dòng đó đúng câu, dòng khác vẫn lưu', () => thu(() => {
    if (ids.length < 2) return;
    dung(false, ids[0]); dung(false, ids[1]);
    const r = luuDiemLo(QL, {
      classId: lop,
      dong: [
        { attemptId: ids[0], o: [{ skill: 'writing1', band: 6.5 }, { skill: 'speaking', criteria: [6, 6, 6, 6] }] },
        { attemptId: ids[1], o: [{ skill: 'writing1', band: 6, criteria: [6, 6, 6, 6] }] },
      ],
    });
    assert(r.dong[0].ok === true, JSON.stringify(r.dong[0]));
    assert(r.dong[1].ok === false && r.dong[1].loi === CAU && r.dong[1].status === 400, JSON.stringify(r.dong[1]));
    assert(diem('writing1', ids[0]).band === 6.5 && diem('speaking', ids[0]).band === 6, 'dòng đạt đã lưu');
    assert(!diem('writing1', ids[1]), 'dòng lỗi cuộn lại');
  }));

  check('BT-7 · ô trong lưới không còn cờ bandThang (máy chủ + web một luật)', () => thu(() => {
    dung(false);
    const sheet = attempts.classScoreSheet(QL, lop, W, TODAY) as any;
    const hang = sheet.rows.find((r: any) => r.attemptId === aid);
    assert(hang, 'phải có hàng trong lưới');
    for (const c of hang.cells) assert(!('bandThang' in c), `${c.skill}: còn cờ bandThang`);
  }));

  check('BT-8 · hộp nhập điểm: ô Band W / S luôn là ô nhập (không còn <output> / cờ bandThang); đỏ viền theo caHaiKieu + chữ LOI_MOT_KIEU', () => {
    const hop = nguon('web/src/modules/fasttrack/HopNhapDiem.tsx');
    assert(!/bandThang/.test(hop) && !/<output/.test(hop), 'hộp còn dấu vết OV-4c');
    assert(/criteriaPatchFrom\(vals, cell, bandText\)/.test(hop) && /caHaiKieu\(vals, bandText\)/.test(hop), 'hộp phải dùng hàm chung');
    assert(/stSai\(loi\?\.o === 4 \|\| haiKieu\)/.test(hop) && /\{LOI_MOT_KIEU\}/.test(hop), 'đỏ ô Band + chữ nhỏ');
    assert(/criteriaPatchFrom\(\['', '', '', ''\], cell, s\)/.test(hop), 'MT0 vẫn một ô Band');
    const se = nguon('web/src/modules/fasttrack/ScoreEntry.tsx');
    assert(!/bandThang/.test(se), 'Cell.bandThang đã bỏ');
  });
}
