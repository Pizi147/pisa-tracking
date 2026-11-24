/**
 * PHÉP KIỂM OV-15e2 — sửa lẻ sau rà OV-15e (#462):
 *  · lượt Mock của Kết quả thi / Báo cáo không còn subquery tương quan theo từng lượt (lọc "có band" sau khi nạp điểm), đầu ra trùng khít;
 *  · link cũ chỉ có `?tg=…` mở Test + SOS;
 *  · Báo cáo qua HTTP: TVV 403 (SUA-2211-B), CX (lọc chi nhánh / toàn hệ thống): 200, số trong phạm vi, panel = số.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv15e2Tests(t: YThucTestKit) {
  const { check, checkAsync, assert, conn, P, TODAY } = t as any;
  const d: any = await import('../../../shared/domain/index.ts');
  const kqt: any = await import('../phanTich/ketQuaThi.ts');
  const { createApp } = await import('../app.ts');
  const { createSession } = await import('../auth.ts');
  const { xoaNho, soCauSql, soDongSql } = await import('../platform/nguCanhRequest.ts');
  const { mondayOf } = await import('../platform/week.ts');
  console.log('\nOV-15e2 · sửa lẻ sau rà OV-15e');

  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const MB = one(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const CP = one(`SELECT id FROM branches WHERE code = 'CP'`).id as number;
  const QL = P.mbManager;
  const t2 = d.mondayOfDate(TODAY);
  const RONG = { tu: d.addDaysIso(t2, -77), den: d.addDaysIso(t2, 6) };

  check('OV15e2-1 · lượt Mock: câu lượt không có subquery tương quan; tập lượt = lượt có ít nhất một band (trùng khít)', () => {
    const ghi: string[] = [];
    const goc = conn.prepare;
    conn.prepare = function (this: unknown, sql: string) { ghi.push(sql); return goc.call(this, sql); };
    let mk: any[];
    try { xoaNho(); mk = kqt.mockTrongKhoang(QL, { branchId: MB, ...RONG }, { boCase: true }); } finally { delete conn.prepare; xoaNho(); }
    const cauLuot = ghi.filter((s) => /FROM assessment_attempts a\s+JOIN report_periods rp/.test(s));
    assert(cauLuot.length === 1, `một câu lượt: ${cauLuot.length}`);
    const ke = (conn.prepare(`EXPLAIN QUERY PLAN ${cauLuot[0]}`).all(...Array((cauLuot[0].match(/\?/g) ?? []).length).fill(null)) as any[])
      .map((r) => r.detail).join(' | ');
    assert(!/CORRELATED/.test(ke), `câu lượt còn subquery tương quan: ${ke}`);
    const mong = (conn.prepare(`SELECT a.id FROM assessment_attempts a JOIN report_periods rp ON rp.id = a.planned_period_id JOIN classes c ON c.id = a.class_id
        WHERE a.status != 'cancelled' AND a.kind = 'mock' AND c.is_fast_track = 1 AND c.branch_id = ? AND rp.week_start BETWEEN ? AND ?
          AND EXISTS (SELECT 1 FROM assessment_scores sx WHERE sx.attempt_id = a.id AND sx.band IS NOT NULL) ORDER BY a.id`)
      .all(MB, mondayOf(RONG.tu), mondayOf(RONG.den)) as any[]).map((r) => r.id).join(',');
    assert(mong.length > 0 && mk!.map((r) => r.attemptId).sort((a, b) => a - b).join(',') === mong, `lượt khác: ${mk!.length}`);
  });

  check('OV15e2-2 · link cũ chỉ có ?tg=… mở Test + SOS (không mở Báo cáo)', () => {
    const g = (s: string) => d.gocNhinTuThamSo(new URLSearchParams(s));
    assert(g('tg=8').goc === 'tong-hop', `tg=8 → ${g('tg=8').goc}`);
    assert(g('goc=giao-vien&tg=26').goc === 'giao-vien' && g('goc=hieu-qua-pa&tg=26').goc === 'tong-hop', 'có goc thì theo goc (V2: Hiệu quả PA → SOS)');
    assert(g('').goc === 'bao-cao', 'không tham số → Báo cáo');
  });

  check('OV15e2-4 · Thi thật: Target một chữ số lẻ như OVR (6 → "6.0", KCK → "6.0 KCK")', () => {
    conn.exec('BEGIN IMMEDIATE');
    try {
      xoaNho();
      const cy = one(`SELECT c.id FROM learning_cycles c JOIN enrollments e ON e.student_id = c.student_id AND e.status = 'active'
        JOIN classes l ON l.id = e.class_id AND l.branch_id = ? WHERE c.route IS NOT NULL AND c.status = 'active'
          AND c.seq = (SELECT MAX(x.seq) FROM learning_cycles x WHERE x.student_id = c.student_id) ORDER BY c.id LIMIT 1`, MB);
      assert(cy, 'bộ demo có lộ trình FT');
      const hom = d.addDaysIso(TODAY, -2);
      conn.prepare(`UPDATE learning_cycles SET target_score = 6, khong_cam_ket = 0, thi_that_ngay = ?, thi_that_l = 6, thi_that_r = 6.5, thi_that_w = 6, thi_that_s = 6 WHERE id = ?`).run(hom, cy.id);
      const dong = () => kqt.ketQuaThiThatKq(QL, { branchId: MB, ...RONG }).rows.find((x: any) => x.cycleId === cy.id);
      assert(dong()?.target === '6.0', `Target: ${JSON.stringify(dong()?.target)}`);
      conn.prepare('UPDATE learning_cycles SET khong_cam_ket = 1 WHERE id = ?').run(cy.id);
      assert(dong()?.target === '6.0 KCK', `Target KCK: ${JSON.stringify(dong()?.target)}`);
    } finally { conn.exec('ROLLBACK'); xoaNho(); }
  });

  await checkAsync('OV15e2-3 · Báo cáo HTTP: TVV 403 (SUA-2211-B), CX (lọc CP / toàn hệ thống) 200, số trong phạm vi, panel số = số ô; đo Kết quả thi', async () => {
    const vai = (k: string) => one(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = ? AND ur.status = 'active' ORDER BY ur.user_id LIMIT 1`, k).id as number;
    const TVV = vai('consultant'), CX = vai('cx');
    const may = createApp().listen(0);
    try {
      const cong = (may.address() as any).port as number;
      const goi = async (uid: number, url: string) => {
        const res = await fetch(`http://127.0.0.1:${cong}/api${url}`, { headers: { cookie: `pisa_demo_session=${createSession(uid)}` } });
        return { status: res.status, json: await res.json().catch(() => null) as any };
      };
      const k = `ct=ft&kieu=tuan&tu=${RONG.tu}&den=${RONG.den}`;
      /* SUA-2211-B (chủ SP 22/11 ý 14): TVV không có khu Phân tích — 403 mọi đường. CX: CX lọc CP ⊆ CX toàn hệ thống, chỉ lớp CP; panel số = số ô. */
      /* D-03: `GET /phan-tich/bao-cao` đã gỡ — soi trên panel `/o` (cùng `tinh()`, cùng quyền). */
      assert((await goi(TVV, `/phan-tich/bao-cao/o?${k}&o=hv-da-thi`)).status === 403, 'TVV Báo cáo → 403');
      const cxCp = await goi(CX, `/phan-tich/bao-cao/o?branchId=${CP}&${k}&o=hv-da-thi`);
      const cx = await goi(CX, `/phan-tich/bao-cao/o?${k}&o=hv-da-thi`);
      assert(cxCp.status === 200 && cx.status === 200, `CX ${cxCp.status}/${cx.status}`);
      assert(cx.json.n >= cxCp.json.n && cx.json.n > 0, `CX ${cx.json.n} · CX·CP ${cxCp.json.n}`);
      for (const q of [`branchId=${CP}&`, '']) {
        for (const ma of ['hv-da-thi', 'bai-da-cham', 'bai-qua-han']) {
          const p = (await goi(CX, `/phan-tich/bao-cao/o?${q}${k}&o=${encodeURIComponent(ma)}`)).json;
          assert(p.rows.length === p.n, `CX ${q || 'tất cả'} ${ma}: panel ${p.n}/${p.rows.length}`);
        }
      }
      /* Đo (dòng đọc Turso): QL Kết quả thi Mock — câu SQL + dòng trả về; số lượt mà EXISTS cũ phải dò điểm. */
      const c0 = soCauSql(), d0 = soDongSql();
      const mk = await goi(QL.userId, `/phan-tich/ket-qua-thi?branchId=${MB}&loai=mock&xep=sos&kieu=tuan&tu=${RONG.tu}&den=${RONG.den}`);
      const doRo = one(`SELECT COUNT(*) AS n FROM assessment_attempts a JOIN report_periods rp ON rp.id = a.planned_period_id JOIN classes c ON c.id = a.class_id
          WHERE a.status != 'cancelled' AND a.kind = 'mock' AND c.is_fast_track = 1 AND c.branch_id = ? AND rp.week_start BETWEEN ? AND ?`, MB, mondayOf(RONG.tu), mondayOf(RONG.den)).n;
      console.log(`      (đo: QL /phan-tich/ket-qua-thi ${soCauSql() - c0} câu, ${soDongSql() - d0} dòng trả về, ${mk.json?.rows?.length} lượt có band / ${doRo} lượt trong khoảng)`);
      assert(mk.status === 200, `Kết quả thi QL: ${mk.status}`);
    } finally { may.close(); }
  });
}
