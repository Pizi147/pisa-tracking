/** PHÉP KIỂM PR-VN4 — Huỷ cả lượt theo lô (≤ 120 câu, trạng thái cuối như cách cũ) + lỗi 500 `vi-pham-theo-nhom` (Quản trị). */
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
  /** Bỏ cột thời điểm (`*_at`, `*_luc`) — hai lần chạy khác giờ, không phải khác trạng thái. */
  const bo = (rows: any[]): any[] => rows.map((r) => Object.fromEntries(Object.entries(r).filter(([k]) => !/(_at|_luc)$/.test(k))));
  const diemCo = (id: number) => all(
    `SELECT skill FROM assessment_scores WHERE attempt_id = ? AND (band IS NOT NULL OR raw_score IS NOT NULL) ORDER BY id`, id).map((r) => r.skill as string);

  type Moc = { cs: number; sig: number; jr: number; ph: number; as: number; ms: number };
  /** Trạng thái cuối: lượt, điểm, phần thi, Case/PA/Phối hợp/tín hiệu (SOS), bản chụp, Hành trình, nhật ký của lượt. */
  const chup = (a: { id: number; student_id: number }, moc: Moc): Record<string, unknown> => ({
    luot: bo(all(`SELECT id, status, cancel_reason, plan_source FROM assessment_attempts WHERE student_id = ? ORDER BY id`, a.student_id)),
    diem: bo(all(`SELECT * FROM assessment_scores WHERE attempt_id = ? ORDER BY skill`, a.id)),
    /* Phần thi có sẵn (lượt cũ thiếu dòng: Huỷ điểm từng ô tạo dòng qua `ensureSkillRows` — lượt đã huỷ không cần). */
    phanThi: bo(all(`SELECT * FROM attempt_skills WHERE attempt_id = ? AND id <= ? ORDER BY skill`, a.id, moc.as)),
    /* Case / tín hiệu có sẵn: đủ cột; sinh trong lúc huỷ (mốc trung gian của cách cũ) chỉ tính khi còn mở. */
    /* Cách cũ xoá W1 trước nên W2 đứng một mình bị coi là "đạt" → lời đóng Case nói sai "sửa lại thành đạt kỳ vọng"; cách mới: "đã bị xoá". */
    caseCu: bo(all(`SELECT * FROM sos_cases WHERE student_id = ? AND id <= ? ORDER BY id`, a.student_id, moc.cs))
      .map((r) => ({ ...r, outcome_note: r.outcome_note?.replace(/đã được sửa lại thành đạt kỳ vọng\.$/, 'đã bị xoá.') ?? null })),
    caseMoiMo: all(`SELECT COUNT(*) n FROM sos_cases WHERE student_id = ? AND id > ? AND status != 'done'`, a.student_id, moc.cs)[0].n,
    pa: bo(all(`SELECT ci.id, ci.status FROM case_interventions ci JOIN sos_cases sc ON sc.id = ci.case_id WHERE sc.student_id = ? AND sc.id <= ? ORDER BY ci.id`, a.student_id, moc.cs)),
    /* Phối hợp có sẵn đủ cột; cách cũ còn sinh Phối hợp trung gian theo từng ô rồi gỡ ngay — chỉ tính cái còn chờ. */
    phoiHop: bo(all(`SELECT id, status, remove_reason_code FROM sos_coordination_actions WHERE attempt_id = ? AND id <= ? ORDER BY id`, a.id, moc.ph)),
    phoiHopMoiCho: all(`SELECT COUNT(*) n FROM sos_coordination_actions WHERE student_id = ? AND id > ? AND status = 'pending'`, a.student_id, moc.ph)[0].n,
    sigCu: bo(all(`SELECT id, status, case_id, withdrawn_reason FROM case_signals WHERE student_id = ? AND id <= ? ORDER BY id`, a.student_id, moc.sig)),
    sigMoiMo: all(`SELECT COUNT(*) n FROM case_signals WHERE student_id = ? AND id > ? AND status IN ('pending', 'linked')`, a.student_id, moc.sig)[0].n,
    /* `trang_thai` của bản chụp trễ một nhịp từ trước (`refreshOutcome` làm mới bản chụp TRƯỚC khi đổi trạng thái lượt) — không so. */
    banChup: bo(all(`SELECT * FROM ban_chup_luot WHERE attempt_id = ? ORDER BY ky_nang`, a.id)).map(({ id: _i, trang_thai: _t, ...r }: any) => r),
    hanhTrinh: all(`SELECT event_type, title, detail FROM journey_events WHERE student_id = ? AND id > ? AND event_type = 'mock_cancelled'`, a.student_id, moc.jr),
    /*
     * Nhật ký từng ô: cách cũ xoá lần lượt nên từ ô thứ hai đợt có thể hết "hoàn tất" (do chính ô vừa xoá) → đường ghi / `sauHoanTat`
     * đổi giữa chừng — mốc trung gian. Cách mới ghi mọi ô theo đợt LÚC HUỶ; VN4-2 kiểm riêng điều đó.
     */
    nhatKy: all(`SELECT action, entity_label, before_json, after_json FROM audit_logs WHERE entity_type = 'assessment_attempt' AND entity_id = ? AND id > ?
      ORDER BY entity_label, action`, a.id, maxAudit).map((r) => ({
      ...r, action: r.action.startsWith('score.') ? 'score' : r.action,
      after_json: r.after_json && bo([JSON.parse(r.after_json)]).map(({ sauHoanTat: _s, ...x }: any) => x)[0],
      /* Tham chiếu dưới đây xoá điểm TRƯỚC khi gọi huyLuot nên đọc trạng thái lượt sau xoá; cách cũ thật đọc trước — kiểm riêng. */
      before_json: r.action === 'attempt.cancel' || !r.before_json ? null : JSON.parse(r.before_json),
    })),
  });
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

  /** Chỗ lệch đầu tiên giữa hai giá trị (đường dẫn + hai bên) — để báo lỗi đọc được. */
  const lechDau = (x: any, y: any, duong = ''): string | null => {
    if (JSON.stringify(x) === JSON.stringify(y)) return null;
    if (x && y && typeof x === 'object' && typeof y === 'object') {
      for (const k of new Set([...Object.keys(x), ...Object.keys(y)])) { const l = lechDau(x[k], y[k], `${duong}.${k}`); if (l) return l; }
    }
    return `${duong} cũ=${JSON.stringify(x)?.slice(0, 400)} mới=${JSON.stringify(y)?.slice(0, 400)}`;
  };

  /*
   * Cách cũ xoá TỪNG Ô rồi tính lại SOS trên số ô còn lại → có lượt sinh tín hiệu / Case / Phối hợp / mốc TRUNG GIAN (đổi mức SOS của
   * Case đang chạy, gắn rồi đóng cả Case GV tự báo). Chủ SP 10/10 (a): bỏ những thứ đó. Nên:
   *  · lượt cách cũ KHÔNG sinh gì trung gian → trạng thái cuối trùng tuyệt đối;
   *  · lượt có mốc trung gian → lượt / điểm / Hành trình trùng; không Case / tín hiệu / Phối hợp mới nào; Case đóng ⊆ cách cũ và
   *    ⊇ đúng tập hộp huỷ báo trước (`heQuaHuyLuot`); Phối hợp còn chờ của lượt về 0 như cách cũ.
   */
  check('VN4-2 · Huỷ cả lượt theo lô: trạng thái cuối trùng cách cũ (Huỷ điểm từng ô rồi huỷ lượt), trừ mốc trung gian — mọi lượt có điểm', () => {
    const lech: string[] = [];
    let sach = 0, trungGian = 0;
    const dongCase = (a: any, m: any) => all(`SELECT id FROM sos_cases WHERE student_id = ? AND id <= ? AND status = 'done'`, a.student_id, m.cs).map((r) => r.id as number);
    for (const a of ds) {
      const m = moc();
      const truoc = all(`SELECT status FROM assessment_attempts WHERE id = ?`, a.id)[0].status as string;
      const daDong = new Set(dongCase(a, m));
      const hq = att.heQuaHuyLuot(a.id);
      const hoanTat = hoanTatSvc.dotHoanTat(a.id, TODAY).hoanTat as boolean;
      const cu = thu(() => {
        for (const s of diemCo(a.id)) att.saveScore(QL, a.id, s, { rawScore: null, criteria: [null, null, null, null], lyDo });
        att.huyLuot(QL, a.id, { lyDo });
        const tg = all(`SELECT
            (SELECT COUNT(*) FROM sos_cases WHERE id > ?) + (SELECT COUNT(*) FROM case_signals WHERE id > ?)
          + (SELECT COUNT(*) FROM sos_coordination_actions WHERE id > ?) + (SELECT COUNT(*) FROM case_milestones WHERE id > ?)
          + (SELECT COUNT(*) FROM audit_logs WHERE id > ? AND action IN ('signal.raised', 'sos_coordination.sync')) n`,
        m.cs, m.sig, m.ph, m.ms, maxAudit)[0].n > 0;
        return { ...chup(a, m), dong: dongCase(a, m).filter((id) => !daDong.has(id)), tg };
      });
      const moi = thu(() => {
        att.huyLuot(QL, a.id, { lyDo });
        const nk = all(`SELECT action, before_json, after_json FROM audit_logs WHERE entity_type = 'assessment_attempt' AND entity_id = ? AND id > ?`, a.id, maxAudit);
        const huy = nk.find((r) => r.action === 'attempt.cancel'), o = nk.filter((r) => r.action.startsWith('score.'));
        return {
          ...chup(a, m), dong: dongCase(a, m).filter((id) => !daDong.has(id)),
          moiTao: all(`SELECT (SELECT COUNT(*) FROM sos_cases WHERE id > ?) + (SELECT COUNT(*) FROM case_signals WHERE id > ?)
            + (SELECT COUNT(*) FROM sos_coordination_actions WHERE id > ?) n`, m.cs, m.sig, m.ph)[0].n,
          truocHuy: JSON.parse(huy.before_json).status === truoc,
          /* Mọi ô MỘT đường ghi; cờ sauHoanTat = đợt hoàn tất LÚC HUỶ. */
          motDuong: new Set(o.map((r) => r.action)).size === 1 && o.every((r) => !!JSON.parse(r.after_json).sauHoanTat === hoanTat),
        };
      });
      const { tg, ...c } = cu;
      const chung = { moiTao: 0, truocHuy: true, motDuong: true };
      let l: string | null;
      if (!tg) { sach++; l = lechDau({ ...c, ...chung }, moi); }
      else {
        trungGian++;
        const pick = (x: any) => ({ luot: x.luot, diem: x.diem, hanhTrinh: x.hanhTrinh, caseMoiMo: x.caseMoiMo, sigMoiMo: x.sigMoiMo, phoiHopMoiCho: x.phoiHopMoiCho });
        l = lechDau({ ...pick(c), ...chung, phoiHopCho: 0, dongTrongCu: true, dongDuHop: true }, {
          ...pick(moi), moiTao: moi.moiTao, truocHuy: moi.truocHuy, motDuong: moi.motDuong,
          phoiHopCho: ((moi as any).phoiHop as any[]).filter((r) => r.status === 'pending').length,
          dongTrongCu: moi.dong.every((id: number) => c.dong.includes(id)),
          dongDuHop: (hq.caseIds as number[]).every((id) => moi.dong.includes(id)),
        });
      }
      if (l) lech.push(`lượt ${a.id}${tg ? ' (có mốc trung gian)' : ''}: ${l}`);
    }
    console.log('VN4-2', JSON.stringify({ sach, trungGian }));
    assert(sach >= 50 && trungGian >= 5, `cần đủ hai nhóm lượt: sạch ${sach}, trung gian ${trungGian}`);
    /* Gom theo chỗ lệch (bỏ số thứ tự) — mỗi kiểu một ví dụ. */
    const kieu = new Map<string, string>();
    for (const l of lech) { const k = l.replace(/^lượt \d+[^:]*: /, '').split(' ')[0].replace(/\.\d+/g, '.#'); if (!kieu.has(k)) kieu.set(k, l); }
    assert(lech.length === 0, `${lech.length}/${ds.length} lượt lệch:\n${[...kieu.values()].join('\n')}`);
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
