/** PHÉP KIỂM PR-VN4 — Huỷ cả lượt theo lô (≤ 120 câu; PR-OV4a: điểm cất, đóng đúng tập hộp báo trước) + lỗi 500 `vi-pham-theo-nhom` (Quản trị). */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrVn4Tests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY } = t;
  const att: any = await import('../fasttrack/attempts.ts');
  const { soCauSql, xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { TRAN_GHI_LO } = await import('./tocDoDuong.ts');
  const thongKe: any = await import('../yThuc/thongKe.ts');
  const hoanTatSvc: any = await import('../fasttrack/hoanTat.ts');
  console.log('\nPR-VN4 · Huỷ lượt theo lô + vi-pham-theo-nhom');

  /** Chạy trong giao dịch rồi cuộn lại — mọi lượt đo trên cùng dữ liệu cuối run.ts. */
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const diemCo = (id: number) => all(
    `SELECT skill FROM assessment_scores WHERE attempt_id = ? AND (band IS NOT NULL OR raw_score IS NOT NULL) ORDER BY id`, id).map((r) => r.skill as string);

  type Moc = { cs: number; sig: number; jr: number; ph: number; as: number; ms: number };
  const moc = (): Moc => ({
    cs: all(`SELECT COALESCE(MAX(id), 0) n FROM sos_cases`)[0].n, sig: all(`SELECT COALESCE(MAX(id), 0) n FROM case_signals`)[0].n,
    jr: all(`SELECT COALESCE(MAX(id), 0) n FROM journey_events`)[0].n, ph: all(`SELECT COALESCE(MAX(id), 0) n FROM sos_coordination_actions`)[0].n,
    as: all(`SELECT COALESCE(MAX(id), 0) n FROM attempt_skills`)[0].n, ms: all(`SELECT COALESCE(MAX(id), 0) n FROM case_milestones`)[0].n,
  });
  const maxAudit = all(`SELECT COALESCE(MAX(id), 0) n FROM audit_logs`)[0].n as number;

  /*
   * Mọi lượt Mock còn hiệu lực CÓ điểm trên dữ liệu cuối run.ts — lượt nhiều ô + Case/Phối hợp là lượt nặng nhất. Bài lớp thường
   * đi nhánh riêng của `xoaDiemLuot` (PR-VN5).
   */
  const ds = all(`SELECT a.id, a.student_id FROM assessment_attempts a WHERE a.status != 'cancelled'
      AND EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id AND (s.band IS NOT NULL OR s.raw_score IS NOT NULL))
      AND NOT EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id AND s.skill NOT IN ('listening', 'reading', 'writing1', 'writing2', 'speaking'))
      /* PR-VN5: bài lớp thường (chấm tỉ lệ, trừ MT0) xoá ô qua saveRegularScore — kiểm ở prVn5 VN5-1. */
      AND NOT (a.kind != 'mt0' AND EXISTS (SELECT 1 FROM classes c JOIN programmes pg ON pg.code = c.programme_code WHERE c.id = a.class_id AND pg.scoring_mode = 'ratio'))
    ORDER BY a.id`);
  const QL = P.admin;
  const lyDo = 'Em nghỉ đợt này';

  check(`VN4-1 · Huỷ cả lượt (Quản trị) mọi lượt có điểm trên dữ liệu cuối run.ts ≤ ${TRAN_GHI_LO.huyCaLuot} câu SQL`, () => {
    assert(ds.length >= 20, `cần nhiều lượt có điểm: ${ds.length}`);
    let nang = { id: 0, n: 0, o: 0 };
    for (const a of ds) {
      const n = thu(() => { const s = soCauSql(); att.huyLuot(QL, a.id, { lyDo }); return soCauSql() - s; });
      if (n > nang.n) nang = { id: a.id, n, o: diemCo(a.id).length };
    }
    console.log('VN4-1 lượt nặng nhất', JSON.stringify({ luot: ds.length, ...nang }));
    assert(nang.n <= TRAN_GHI_LO.huyCaLuot, `lượt ${nang.id} (${nang.o} ô): ${nang.n} câu > trần ${TRAN_GHI_LO.huyCaLuot}`);
  });

  /*
   * PR-OV4a (đặc tả OV 3.4) thay "trùng cách cũ": Huỷ cả lượt Mock KHÔNG xoá điểm mà cất (`ket_qua_huy` loại `huy_luot`) và không tính lại SOS
   * giữa chừng. Nên với mọi lượt có điểm: không Case / tín hiệu / Phối hợp mới nào; Case đóng = đúng tập hộp huỷ báo trước (`heQuaHuyLuot`);
   * Phối hợp + tín hiệu còn chờ của lượt về 0; điểm ra khỏi `assessment_scores`, đủ trong bản cất; không nhật ký `score.*` từng ô (ô không đổi giá
   * trị, chỉ ẩn); `attempt.cancel` ghi trạng thái TRƯỚC huỷ. Huỷ rồi Khôi phục về nguyên trạng: `prOv4a` OV4a-10.
   */
  check('VN4-2 · Huỷ cả lượt mọi lượt có điểm: điểm cất (ẩn), không sinh gì trung gian, đóng đúng tập hộp báo trước', () => {
    const lech: string[] = [];
    for (const a of ds) {
      const m = moc();
      const truoc = all(`SELECT status FROM assessment_attempts WHERE id = ?`, a.id)[0].status as string;
      const soO = diemCo(a.id).length;
      const daDong = new Set(all(`SELECT id FROM sos_cases WHERE student_id = ? AND status = 'done'`, a.student_id).map((r) => r.id as number));
      const hq = att.heQuaHuyLuot(a.id);
      const l = thu(() => {
        att.huyLuot(QL, a.id, { lyDo });
        const dong = all(`SELECT id FROM sos_cases WHERE student_id = ? AND status = 'done'`, a.student_id).map((r) => r.id as number).filter((id) => !daDong.has(id));
        const kq = all(`SELECT so_diem FROM ket_qua_huy WHERE attempt_id = ? AND loai = 'huy_luot' AND khoi_phuc_luc IS NULL`, a.id);
        const nk = all(`SELECT action, before_json FROM audit_logs WHERE entity_type = 'assessment_attempt' AND entity_id = ? AND id > ?`, a.id, maxAudit);
        const moiTao = all(`SELECT (SELECT COUNT(*) FROM sos_cases WHERE id > ?) + (SELECT COUNT(*) FROM case_signals WHERE id > ?)
          + (SELECT COUNT(*) FROM sos_coordination_actions WHERE id > ?) n`, m.cs, m.sig, m.ph)[0].n;
        const conCho = all(`SELECT (SELECT COUNT(*) FROM sos_coordination_actions WHERE attempt_id = ? AND status = 'pending')
          + (SELECT COUNT(*) FROM case_signals WHERE attempt_id = ? AND status = 'pending') n`, a.id, a.id)[0].n;
        const sai = [
          moiTao ? `sinh ${moiTao} Case/tín hiệu/Phối hợp mới` : null,
          JSON.stringify([...dong].sort()) !== JSON.stringify([...hq.caseIds].sort()) ? `Case đóng ${JSON.stringify(dong)} ≠ hộp ${JSON.stringify(hq.caseIds)}` : null,
          conCho ? `còn ${conCho} Phối hợp / tín hiệu chờ` : null,
          diemCo(a.id).length || kq.length !== 1 || kq[0].so_diem !== soO ? `điểm chưa cất đủ (${soO} ô, bản cất ${JSON.stringify(kq)})` : null,
          nk.some((r) => r.action.startsWith('score.')) ? 'còn nhật ký score.* từng ô' : null,
          JSON.parse(nk.find((r) => r.action === 'attempt.cancel')?.before_json ?? '{}').status !== truoc ? 'attempt.cancel không ghi trạng thái trước huỷ' : null,
        ].filter(Boolean);
        return sai.length ? `lượt ${a.id}: ${sai.join('; ')}` : null;
      });
      if (l) lech.push(l);
    }
    assert(lech.length === 0, `${lech.length}/${ds.length} lượt sai:\n${lech.slice(0, 5).join('\n')}`);
  });

  check('VN4-2b · Đợt đã hoàn tất: người chỉ có quyền huỷ lượt (không plan.week / score.override) → 403, không ô nào bị xoá (R11 như Huỷ điểm)', () => {
    const a = ds.find((x) => hoanTatSvc.dotHoanTat(x.id, TODAY).hoanTat);
    assert(a, 'cần một lượt đã hoàn tất có điểm');
    const chiHuy = { ...QL, grants: QL.grants.map((g: any) => ({ ...g, permissions: new Set([...g.permissions].filter((x) => x !== 'plan.week' && x !== 'score.override')) })) };
    const truoc = diemCo(a.id).length;
    const loi = thu(() => { try { att.huyLuot(chiHuy, a.id, { lyDo }); return null; } catch (e: any) { return { status: e.status, conDiem: diemCo(a.id).length }; } });
    assert(loi?.status === 403 && loi.conDiem === truoc, `phải 403 và giữ ${truoc} ô: ${JSON.stringify(loi)}`);
  });

  check('VN4-3 · GET /metrics/vi-pham-theo-nhom vai Quản trị (toàn hệ thống) không lỗi; hợp các khoá = vi-pham-tong', () => {
    const nhom = thongKe.yThucMetric(P.admin, 'vi-pham-theo-nhom', {}) as any;
    const tong = thongKe.yThucMetric(P.admin, 'vi-pham-tong', {}) as any;
    assert(JSON.stringify(nhom.byKind['tat-ca:tat-ca']) === JSON.stringify(tong.ids), 'tat-ca:tat-ca phải = vi-pham-tong');
    assert(JSON.stringify(nhom.ids) === JSON.stringify(tong.ids), 'ids phải = vi-pham-tong');
  });
}
