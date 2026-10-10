/** PHÉP KIỂM PR-VN5 — Huỷ bài lớp thường có ô `writing` / `tong_hop` + `ban_chup_luot.trang_thai` đúng ngay sau huỷ. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrVn5Tests(t: YThucTestKit) {
  const { check, assert, conn, P } = t;
  const att: any = await import('../fasttrack/attempts.ts');
  const { soCauSql, xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { TRAN_GHI_LO } = await import('./tocDoDuong.ts');
  console.log('\nPR-VN5 · Huỷ bài lớp thường + bản chụp sau huỷ');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const diemCo = (id: number) => all(
    `SELECT id, skill FROM assessment_scores WHERE attempt_id = ? AND (band IS NOT NULL OR raw_score IS NOT NULL) ORDER BY id`, id);
  const QL = P.admin;

  /* Bài lớp thường (Progress Test / Final Test) còn hiệu lực có điểm — trước PR-VN5 huỷ báo "Kỹ năng không hợp lệ". */
  const ds = all(`SELECT a.id, a.kind FROM assessment_attempts a JOIN classes c ON c.id = a.class_id JOIN programmes pg ON pg.code = c.programme_code
      WHERE a.status != 'cancelled' AND pg.scoring_mode = 'ratio' AND a.kind IN ('progress', 'final')
        AND EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id AND s.raw_score IS NOT NULL) ORDER BY a.id`);

  check(`VN5-1 · QL huỷ Progress Test / Final Test lớp thường có ô writing / tong_hop: điểm xoá, nhật ký từng ô, ≤ ${TRAN_GHI_LO.huyCaLuot} câu`, () => {
    const kinds = new Set(ds.map((a) => a.kind));
    assert(kinds.has('progress') && kinds.has('final'), `cần cả Progress và Final có điểm: ${[...kinds]}`);
    const loaiO = new Set<string>();
    let nang = 0;
    for (const a of ds) {
      const o = diemCo(a.id);
      for (const s of o) loaiO.add(s.skill);
      thu(() => {
        const n0 = soCauSql();
        att.huyLuot(QL, a.id, { lyDo: 'Em nghỉ' });
        nang = Math.max(nang, soCauSql() - n0);
        assert(all(`SELECT status FROM assessment_attempts WHERE id = ?`, a.id)[0].status === 'cancelled', `bài ${a.id} chưa huỷ`);
        assert(diemCo(a.id).length === 0, `bài ${a.id} còn điểm`);
        const nk = all(`SELECT entity_id FROM audit_logs WHERE entity_type = 'assessment_score' AND action LIKE 'regular.score%'
            AND entity_id IN (${o.map(() => '?').join(',')}) AND json_extract(after_json, '$.raw_score') IS NULL
            AND json_extract(after_json, '$.lyDo') = 'Em nghỉ'`, ...o.map((s) => s.id));
        assert(nk.length === o.length, `bài ${a.id}: nhật ký ${nk.length}/${o.length} ô`);
      });
    }
    assert(loaiO.has('writing') && loaiO.has('tong_hop'), `cần ô writing + tong_hop: ${[...loaiO]}`);
    console.log('VN5-1', JSON.stringify({ bai: ds.length, loaiO: [...loaiO], cauNhieuNhat: nang }));
    assert(nang <= TRAN_GHI_LO.huyCaLuot, `${nang} câu > trần ${TRAN_GHI_LO.huyCaLuot}`);
  });

  check('VN5-2 · ban_chup_luot.trang_thai = cancelled ngay sau huỷ (lộ trình đã đóng)', () => {
    const ds2 = all(`SELECT DISTINCT a.id FROM assessment_attempts a JOIN ban_chup_luot b ON b.attempt_id = a.id
      WHERE a.status != 'cancelled' AND b.trang_thai IS NOT NULL AND b.ban_chup_id = (SELECT MAX(id) FROM ban_chup_lo_trinh x WHERE x.cycle_id = a.cycle_id) ORDER BY a.id`);
    assert(ds2.length > 0, 'cần lượt thuộc lộ trình đã chụp');
    let co = 0;
    for (const a of ds2) {
      if (!att.heQuaHuyLuot(a.id).cachDuoc) continue;
      co++;
      thu(() => {
        att.huyLuot(QL, a.id, { lyDo: 'Em nghỉ' });
        const tt = all(`SELECT DISTINCT trang_thai FROM ban_chup_luot WHERE attempt_id = ?
          AND ban_chup_id = (SELECT MAX(b.id) FROM ban_chup_lo_trinh b JOIN assessment_attempts x ON x.cycle_id = b.cycle_id WHERE x.id = ?)`, a.id, a.id)
          .map((r) => r.trang_thai);
        assert(tt.length === 1 && tt[0] === 'cancelled', `lượt ${a.id}: trang_thai ${tt}`);
      });
    }
    assert(co > 0, 'cần lượt huỷ được');
  });
}
