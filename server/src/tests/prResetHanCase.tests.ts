/**
 * PHÉP KIỂM RESET-HAN-CASE (chủ SP 06/11 khuya: việc tuyến Case quá hạn → làm lại từ bây giờ, không xoá).
 *  1. Reset đúng tập: sau reset Công việc "Tất cả" không còn việc tuyến Case quá hạn; việc vừa reset hạn = hôm nay + 7; mọi hạn khác (chưa quá hạn,
 *     hạn = hôm nay, đã xong) giữ nguyên — so ảnh chụp bốn cột hạn trước / sau.
 *  2. Kết quả PA: nghĩa vụ chưa ghi của các đợt đã lỡ biến khỏi "Việc đúng hạn" (`dung-han-cap-nhat`), lần ghi đã có giữ nguyên.
 *  3. Chạy lặp không đổi (hàm + khoá migrate) · hoàn tác trả về đúng như cũ.
 */
export async function runPrResetHanCaseTests(t: any) {
  const { check, assert, conn, P, TODAY, addDays } = t;
  const mig: any = await import('../migrate/prResetHanCase.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const metrics: any = await import('../worklist/metrics.ts');
  const sosState: any = await import('../cases/sosState.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nRESET-HAN-CASE · việc tuyến Case quá hạn → hạn hôm nay + 7, hoàn tác được');

  const thu = (fn: () => void) => { conn.exec('BEGIN IMMEDIATE'); try { fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); } };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const MOI = addDays(TODAY, mig.SO_NGAY_RESET), MOI_PA = addDays(TODAY, mig.SO_NGAY_RESET_PA);
  const moiCua = (loai: string) => loai === 'reset_case:action_due' ? MOI_PA : MOI;
  const NHOM_CASE = new Set(['cause', 'ghi_nhan_xet', 'xac_nhan_pa', 'xem_nx_s', 'no_plan', 'ghi_ket_qua_pa', 'mini_test']);
  const chup = () => JSON.stringify([
    all('SELECT id, han_xac_nhan, han_them_pa FROM sos_cases ORDER BY id'),
    all('SELECT id, action_due FROM case_interventions ORDER BY id'),
    all('SELECT id, han FROM mini_test ORDER BY id'),
  ]);
  const viecCase = () => { xoaNho(); return (mywork.myWork(P.admin, { nguoi: 'tat-ca' }).items as any[]).filter((i) => NHOM_CASE.has(i.group)); };
  const nghiaVu = () => { xoaNho(); return metrics.metricSet(P.admin, 'dung-han-cap-nhat', {}) as { ids: number[]; numeratorIds: number[] }; };

  /* Dựng: mỗi nguồn hạn một việc quá hạn + một việc chưa quá hạn (hạn = hôm nay — không phải quá hạn). */
  const dung = () => {
    const caseXn = all(`SELECT sc.id FROM sos_cases sc WHERE sc.status != 'done' AND sc.tam = 0 AND sc.han_xac_nhan IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM case_issues ci WHERE ci.case_id = sc.id AND ci.role = 'primary') ORDER BY sc.id LIMIT 2`).map((r) => r.id as number);
    const caseKhongPa = all(`SELECT sc.id FROM sos_cases sc WHERE sc.status != 'done' AND sc.kck = 0 AND sc.tam = 0 AND sc.disposition IS NULL
      AND COALESCE(sc.sos_level, 1) > 0 AND NOT EXISTS (SELECT 1 FROM case_interventions iv WHERE iv.case_id = sc.id AND iv.status != 'cancelled')
      ORDER BY sc.id LIMIT 1`).map((r) => r.id as number);
    const pa = all(`SELECT iv.id FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
      WHERE iv.status IN ('planned', 'started') AND COALESCE(iv.approval_state, '') != 'pending' AND ${sosState.NOT_UNCONFIRMED_PRESET('iv')}
        AND sc.status != 'done' AND NOT EXISTS (SELECT 1 FROM case_followups f WHERE f.intervention_id = iv.id AND f.cycle_no = iv.cycle_no)
      ORDER BY iv.id LIMIT 3`).map((r) => r.id as number);
    assert(caseXn.length === 2 && caseKhongPa.length === 1 && pa.length === 3, `seed thiếu dữ liệu dựng: ${JSON.stringify({ caseXn, caseKhongPa, pa })}`);
    conn.prepare('UPDATE sos_cases SET han_xac_nhan = ? WHERE id = ?').run(addDays(TODAY, -3), caseXn[0]);
    conn.prepare('UPDATE sos_cases SET han_xac_nhan = ? WHERE id = ?').run(TODAY, caseXn[1]);
    conn.prepare('UPDATE sos_cases SET detected_at = ? WHERE id = ?').run(addDays(TODAY, -30), caseKhongPa[0]);
    conn.prepare('UPDATE case_interventions SET action_due = ? WHERE id = ?').run(addDays(TODAY, -30), pa[0]);   // lỡ ba đợt hai tuần
    conn.prepare('UPDATE case_interventions SET action_due = ? WHERE id = ?').run(addDays(TODAY, 5), pa[1]);   // chưa quá hạn, tới hạn trước mốc PA → vào
    conn.prepare('UPDATE case_interventions SET action_due = ? WHERE id = ?').run(addDays(TODAY, mig.SO_NGAY_RESET_PA), pa[2]);   // = mốc PA → không
    return { caseXn, caseKhongPa, pa };
  };

  check('RH-1 · reset đúng tập: Công việc không còn việc Case quá hạn, việc reset hạn = hôm nay + 7 (Kết quả PA + 14, gồm đợt tới hạn trước mốc), mọi hạn khác giữ nguyên', () => thu(() => {
    const { caseXn, caseKhongPa, pa } = dung();
    const truoc = viecCase();
    assert(truoc.some((i) => i.urgency === 'overdue'), 'tiền đề: có việc Case quá hạn');
    const giu = new Map(truoc.filter((i) => i.urgency !== 'overdue').map((i) => [i.key, i.due]));
    const ds = mig.viecCaseQuaHan(conn, TODAY) as { loai: string; id: number; han: string }[];
    const co = (loai: string, id: number) => ds.some((v) => v.loai === loai && v.id === id);
    assert(co('reset_case:han_xac_nhan', caseXn[0]) && !co('reset_case:han_xac_nhan', caseXn[1]), 'Case quá hạn vào, Case hạn hôm nay không');
    assert(co('reset_case:han_them_pa', caseKhongPa[0]) && co('reset_case:action_due', pa[0]) && co('reset_case:action_due', pa[1]) && !co('reset_case:action_due', pa[2]), 'Thêm PA + Kết quả PA (hạn < mốc +14)');
    assert(ds.every((v) => v.han < (v.loai === 'reset_case:action_due' ? MOI_PA : TODAY)), 'chỉ việc hạn < hôm nay; Kết quả PA hạn < mốc PA');

    const cuAnh = JSON.parse(chup());
    const daDoi = mig.datLaiHanCase(conn, TODAY);
    assert(daDoi.length === ds.length, `đổi ${daDoi.length} / chọn ${ds.length}`);
    const sau = viecCase();
    const conQua = sau.filter((i) => i.urgency === 'overdue');
    assert(!conQua.length, `còn quá hạn: ${JSON.stringify(conQua.map((i) => [i.key, i.due]))}`);
    for (const [k, han] of giu) {
      const x = sau.find((i) => i.key === k);
      assert(!x || x.due === han, `việc chưa quá hạn ${k} đổi hạn ${han} → ${x?.due}`);
    }
    const HXN = new Set(['cause', 'ghi_nhan_xet', 'xac_nhan_pa', 'xem_nx_s']);
    assert(sau.filter((i) => (i.caseId === caseXn[0] && HXN.has(i.group)) || (i.caseId === caseKhongPa[0] && i.group === 'no_plan')).every((i) => i.due === MOI), 'việc reset hạn = mốc chung');

    /* Ảnh chụp: chỉ đúng các ô trong `ds` đổi, sang MOI; nhật ký đủ hạn cũ. */
    const moiAnh = JSON.parse(chup());
    const doi: string[] = [];
    const so = (bang: number, cot: string, ten: string) => cuAnh[bang].forEach((r: any, i: number) => {
      if (r[cot] !== moiAnh[bang][i][cot]) {
        doi.push(`${ten}:${r.id}`);
        assert(moiAnh[bang][i][cot] === moiCua(ten), `${ten}:${r.id} → ${moiAnh[bang][i][cot]}`);
      }
    });
    so(0, 'han_xac_nhan', 'reset_case:han_xac_nhan'); so(0, 'han_them_pa', 'reset_case:han_them_pa');
    so(1, 'action_due', 'reset_case:action_due'); so(2, 'han', 'reset_case:mini_test');
    assert(JSON.stringify(doi.sort()) === JSON.stringify(ds.map((v) => `${v.loai}:${v.id}`).sort()), `ô đổi ≠ tập chọn: ${doi.length} / ${ds.length}`);
    const nk = all(`SELECT loai, viec_id, han_cu, han_moi, boi FROM viec_han_lan WHERE loai LIKE 'reset_case:%'`);
    assert(nk.length === ds.length && nk.every((l) => l.han_moi === moiCua(l.loai) && l.boi === null && ds.some((v) => v.loai === l.loai && v.id === l.viec_id && v.han === l.han_cu)), 'nhật ký hạn cũ → mới');
  }));

  check('RH-2 · Kết quả PA: đợt đã lỡ không còn tính trong "Việc đúng hạn"; lần ghi đã có giữ nguyên', () => thu(() => {
    const { pa } = dung();
    const truoc = nghiaVu();
    const cua = (ids: number[]) => ids.filter((id) => metrics.parseObligation(id).interventionId === pa[0]);
    assert(cua(truoc.ids).length >= 2 && !cua(truoc.numeratorIds).length, `tiền đề: PA lỡ ≥ 2 đợt, có ${cua(truoc.ids).length}`);
    mig.datLaiHanCase(conn, TODAY);
    const sau = nghiaVu();
    assert(!cua(sau.ids).length, `còn ${cua(sau.ids).length} nghĩa vụ đã lỡ`);
    assert(one('SELECT action_due FROM case_interventions WHERE id = ?', pa[0]).action_due === MOI_PA, 'Kết quả PA hạn = hôm nay + 14');
    xoaNho();
    assert(!(mywork.myWork(P.admin, { nguoi: 'tat-ca' }).items as any[]).some((i) => i.group === 'ghi_ket_qua_pa' && i.paId === pa[0]), 'Kết quả PA ẩn tới hạn − 2 (luật sẵn có)');
    const daGhi = new Set(all('SELECT DISTINCT intervention_id AS iv FROM case_followups WHERE intervention_id IS NOT NULL').map((r) => r.iv as number));
    const ghiTruoc = truoc.ids.filter((id) => daGhi.has(metrics.parseObligation(id).interventionId) && metrics.parseObligation(id).interventionId !== pa[0]);
    assert(ghiTruoc.every((id) => sau.ids.includes(id) && truoc.numeratorIds.includes(id) === sau.numeratorIds.includes(id)), 'nghĩa vụ của lần ghi đã có giữ');
  }));

  check('RH-3 · chạy lặp không đổi; migrate có khoá không làm gì; hoàn tác trả về như cũ', () => thu(() => {
    dung();
    const goc = chup();
    conn.prepare('DELETE FROM demo_config WHERE key = ?').run(mig.KHOA_PR_RESET_HAN_CASE);
    const ap: string[] = [];
    mig.migratePrResetHanCase(conn, ap);
    assert(ap.some((x) => x.startsWith('RESET-HAN-CASE')) && !!one('SELECT 1 FROM demo_config WHERE key = ?', mig.KHOA_PR_RESET_HAN_CASE), 'lần đầu: đổi + ghi khoá');
    const sau1 = chup();
    assert(sau1 !== goc && !mig.datLaiHanCase(conn, TODAY).length && chup() === sau1, 'lần hai: không còn việc nào');
    conn.prepare('UPDATE sos_cases SET han_xac_nhan = ? WHERE id = (SELECT viec_id FROM viec_han_lan WHERE loai = ? LIMIT 1)').run(addDays(TODAY, -1), 'reset_case:han_xac_nhan');
    const sau2 = chup(), ap2: string[] = [];
    mig.migratePrResetHanCase(conn, ap2);
    assert(chup() === sau2 && !ap2.length, 'có khoá: không làm gì');
    conn.prepare('UPDATE sos_cases SET han_xac_nhan = ? WHERE id = (SELECT viec_id FROM viec_han_lan WHERE loai = ? LIMIT 1)').run(addDays(TODAY, 7), 'reset_case:han_xac_nhan');
    const n = mig.hoanTacResetHanCase(conn);
    assert(n > 0 && chup() === goc, 'hoàn tác: đúng như trước reset');
    assert(!one(`SELECT 1 FROM viec_han_lan WHERE loai LIKE 'reset_case:%'`), 'xoá nhật ký reset');
  }));

  check('RH-4 · hanThemPa: hạn đã đặt lại thắng công thức (Công việc, hồ sơ HV, Tổng hợp xử lý cùng hàm); KCK vẫn không hạn', () => {
    const c = { detected_at: '2026-01-01', urgency: 'normal', sos_level: 2, kck: 0 };
    assert(d.hanThemPa({ ...c, han_them_pa: '2026-12-01' }) === '2026-12-01' && d.hanThemPa(c) !== '2026-12-01', 'cột thắng');
    assert(d.hanThemPa({ ...c, kck: 1, han_them_pa: '2026-12-01' }) === null, 'KCK không hạn');
    assert(sosState.XU_LY_COT_SQL.includes('sc.han_them_pa'), 'Tổng hợp xử lý đọc cột');
  });

  check('RH-5 · [XM-2] cờ KQ_PA_TRE_TRUOC_RESET: mặc định lần ghi trễ cũ vẫn tính; tắt → trễ có hạn trước ngày reset không vào "Việc đúng hạn", phần khác giữ', () => thu(() => {
    conn.prepare('INSERT OR REPLACE INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run(mig.KHOA_PR_RESET_HAN_CASE, TODAY, TODAY);
    const tre = new Set(all('SELECT intervention_id AS iv, cycle_no AS c FROM case_followups WHERE late = 1 AND cycle_due < ?', TODAY).map((r) => `${r.iv}|${r.c}`));
    const laTre = (r: { ids: number[]; numeratorIds: number[] }) => r.ids.filter((id) => {
      const o = metrics.parseObligation(id);
      return !r.numeratorIds.includes(id) && tre.has(`${o.interventionId}|${o.cycle}`);
    });
    const truoc = nghiaVu();
    assert(laTre(truoc).length > 0, 'tiền đề: seed có lần ghi trễ');
    metrics.KQ_PA_TRE_TRUOC_RESET.tinh = false;
    let sau: { ids: number[]; numeratorIds: number[] };
    try { sau = nghiaVu(); } finally { metrics.KQ_PA_TRE_TRUOC_RESET.tinh = true; }
    const bo = new Set(truoc.ids.filter((id) => !sau.ids.includes(id)));
    assert(!laTre(sau).length && bo.size === laTre(truoc).length && [...bo].every((id) => laTre(truoc).includes(id)), `bỏ ${bo.size} / trễ ${laTre(truoc).length}`);
    assert(JSON.stringify(sau.numeratorIds) === JSON.stringify(truoc.numeratorIds), 'đúng hạn giữ');
  }));
}
