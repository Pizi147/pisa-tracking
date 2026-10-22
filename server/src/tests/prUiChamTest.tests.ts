/**
 * PHÉP KIỂM V5 · UI-CHAM-TEST (08 mục 6 dòng 4, mục 10; 10 mục 2 · Rulebook §21.4 T5):
 *  · Kế hoạch Test mặc định 3 MT — MT kế tiếp không mở cột trống (C20, T04); cột MT4+ chỉ khi có lượt;
 *  · ô đợt xong kèm Overall + kỳ vọng của lượt (cùng `resultOf`);
 *  · "Đã huỷ" kèm lý do: vắng 2 lần / vắng MT cũ / QL từ chối dời (chip Kế hoạch Test, dòng kỹ năng hộp một đợt).
 */
type Kit = { check: (n: string, f: () => void) => void; assert: (c: unknown, m: string) => void; conn: any; P: any; classId: (code: string) => number };

export async function runPrUiChamTestTests(t: Kit) {
  const { check, assert, conn, P } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const kh: any = await import('../keHoach/keHoachTest.ts');
  const at: any = await import('../fasttrack/attempts.ts');
  const lichSvc: any = await import('../classes/schedule.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nV5 · UI-CHAM-TEST — Kế hoạch Test 3 MT + Overall, lý do "Đã huỷ"');

  const lopFt = (conn.prepare(`SELECT id, code FROM classes WHERE route IS NOT NULL AND status = 'active'`).all() as any[]);

  check('UCT-1 (C20, T04) · Kế hoạch Test FT: số cột = max(lịch lộ trình lớp, MT lớn nhất có lượt), trần MT8 — MT kế tiếp không mở cột trống', () => {
    let keTiepVuot = 0;
    for (const l of lopFt) {
      xoaNho();
      const g = kh.luoiFT(P.admin, l.id);
      const c = conn.prepare('SELECT * FROM classes WHERE id = ?').get(l.id) as any;
      const lich = lichSvc.lichMtCua(c, c.route).length;
      const ngoai = conn.prepare(`SELECT MAX(a.attempt_no) AS n FROM assessment_attempts a JOIN learning_cycles cy ON cy.id = a.cycle_id AND cy.status = 'active'
        WHERE a.kind = 'mock' AND a.status != 'cancelled' AND a.student_id IN (${g.hang.map((h: any) => h.studentId).join(',') || 0})`).get() as any;
      const mong = Math.min(d.MT_TOI_DA, Math.max(lich, ngoai?.n ?? 0));
      assert(g.cot.length === mong, `${l.code}: ${g.cot.length} cột, mong ${mong} (lịch ${lich})`);
      keTiepVuot += g.hang.filter((h: any) => h.soKeTiep > g.cot.length).length;
    }
    assert(keTiepVuot > 0, 'seed phải có em xong hết cột (MT kế tiếp > số cột) — QL thêm tay qua "Xếp nhiều MT…"');
  });

  check('UCT-2 · ô đợt xong ghi Overall + kỳ vọng = resultOf của lượt; ô chưa xong không có Overall', () => {
    xoaNho();
    let co = 0;
    for (const l of lopFt) {
      const g = kh.luoiFT(P.admin, l.id);
      for (const h of g.hang) for (const n of g.cot) {
        const o = h.dot[n];
        if (!o?.attemptId) continue;
        if (o.trangThaiDot !== 'xong') { assert(o.ovr === undefined || o.trangThaiDot === 'done', `${l.code} ${h.ten} MT${n}: chưa xong mà có Overall`); continue; }
        if (o.ovr === undefined) continue;
        const r = at.resultOf(conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(o.attemptId));
        assert(r.overall === o.ovr && (r.expectation ?? null) === o.kyVong, `${l.code} ${h.ten} MT${n}: ${o.ovr}/${o.kyVong} ≠ ${r.overall}/${r.expectation}`);
        co += 1;
      }
    }
    assert(co > 0, 'seed phải có ít nhất một đợt xong có Overall');
  });

  check('UCT-3 (Rulebook §21.4 T5) · lyDoHuy: vắng MT cũ › vắng 2 lần › QL từ chối dời; không huỷ kỹ năng → null', () => {
    assert(d.lyDoHuy({ mtCu: true, huyVang: true, sit: 'cancelled' }) === 'vắng MT cũ', 'MT cũ');
    assert(d.lyDoHuy({ huyVang: true, sit: 'cancelled' }) === 'vắng 2 lần', 'vắng 2 lần');
    assert(d.lyDoHuy({ sit: 'cancelled' }) === 'QL từ chối dời', 'QL từ chối dời');
    assert(d.lyDoHuy({ sit: 'scheduled' }) === null && d.lyDoHuy({}) === null, 'không huỷ');
  });

  check('UCT-4 (T5) · chip Kế hoạch Test FT + dòng hộp một đợt ghi lý do huỷ; hai lý do khác nhau không gộp một chip', () => {
    const o = (x: object) => ({ trangThai: 'da-huy', tuan: '2026-09-07', periodId: 1, doiTu: null, batBuoc: true, khoa: 'đã huỷ', sit: 'cancelled', tuanKetThuc: '2026-09-13', choDuyet: false, hanCham: null, ...x });
    const nhom = d.nhomKyNang({ listening: o({ huyVang: true }), reading: o({}) }, '2026-09-14');
    const viec = nhom.map((g: any) => g.viec).sort();
    assert(JSON.stringify(viec) === JSON.stringify(['huỷ · QL từ chối dời', 'huỷ · vắng 2 lần']), JSON.stringify(viec));
    assert(d.chipDongKyNang(o({ huyVang: true }), '2026-09-14')?.chu === 'huỷ · vắng 2 lần', 'dòng hộp một đợt');
    assert(d.chipDongKyNang({ ...o({}), trangThai: 'xong', khongDuThi: true, sit: 'sat' }, '2026-09-14', null, true)?.chu === 'Đã huỷ · vắng MT cũ', 'MT cũ');
  });
}
