/**
 * PHÉP KIỂM PANEL-MC (PANEL-V10, luật N30): dòng điểm `DiemHv` đúng lượt làm em vào con số, 0 câu thêm khi vẽ ô số.
 *   M1 — luật ký hiệu ✓ / ✗, `diemTuEval` khớp `standingFor` (hai đường tính độc lập), kỹ năng thiếu / môn bỏ / lớp thường, 0 câu.
 *   M2 — `rowsFor('hoc-vien')` kèm điểm, "giống hệt" khi tắt cờ, lượt MT2 khi MT3 chưa điểm, số câu panel không đổi, dòng bài không lặp tên.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrPanelMcTests(t: YThucTestKit & { P: any }) {
  const { check, assert, conn, P, TODAY } = t;
  console.log('\nPANEL-MC · dòng điểm đúng lượt + dữ liệu panel');
  const d: any = await import('../../../shared/domain/index.ts');
  const { latestAttempts, studentsInScope } = await import('../worklist/danhGia.ts');
  const { diemTuEval, diemTuStanding } = await import('../worklist/diemDong.ts');
  const { standingFor } = await import('../students/standing.ts');
  const metrics: any = await import('../worklist/metrics.ts');
  const { chayTrongRequest, soCauSql } = await import('../platform/nguCanhRequest.ts');

  const lopFt = (conn.prepare(`SELECT id FROM classes WHERE code = 'MB FT 101'`).get() as any).id as number;
  const emLop = (lop: number) => (conn.prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' ORDER BY student_id`).all(lop) as any[]).map((r) => r.student_id as number);
  /** Chạy `fn` như một request GET; trả kết quả + số câu SQL. */
  const doCau = <T>(fn: () => T): { kq: T; cau: number } => chayTrongRequest('GET', () => { const a = soCauSql(); const kq = fn(); return { kq, cau: soCauSql() - a }; });
  /** Cùng `fn` khi tắt / bật trường mới. */
  const haiLan = <T>(fn: () => T) => {
    metrics.diemHvKhiKiem.tat = true;
    try { var tat = doCau(fn); } finally { metrics.diemHvKhiKiem.tat = false; }
    return { tat, bat: doCau(fn) };
  };
  const boMoi = (row: any) => { const { diemHv: _a, nguoi: _b, han: _c, title: _d, ...cu } = row; return cu; };

  check('M1 · dauDiem / nhanDocDiem: ✓ / ✗ / không ký hiệu; câu đọc có điểm + mốc', () => {
    assert(d.dauDiem(true) === '✓' && d.dauDiem(false) === '✗' && d.dauDiem(null) === null, 'dauDiem sai');
    const c = d.nhanDocDiem({ k: 'R', v: 5, dat: false }, { nhan: 'KV', v: 6 });
    assert(c.includes('5.0') && c.includes('6.0') && c.includes('✗'), `câu hụt: "${c}"`);
    assert(d.nhanDocDiem({ k: 'L', v: 6.5, dat: true }, { nhan: 'KV', v: 6 }) === 'L ✓ 6.5', 'câu đạt');
    assert(!/\d/.test(d.nhanDocDiem({ k: 'W', v: null, dat: null }, null)), 'chưa điểm không có số');
    assert(d.nhanDocDiem({ k: 'G+V', v: 52, dat: false }, { nhan: 'ngưỡng', v: 60 }).includes('52 %'), 'lớp thường ghi %');
  });

  check('M1 · diemTuEval khớp standingFor cùng lượt (hai đường tính độc lập): ✓ / ✗ từng kỹ năng, Overall, kỳ vọng', () => {
    const ids = studentsInScope(P.admin, null);
    const { kq: lat } = doCau(() => latestAttempts(ids, 'valid', TODAY));
    const st = standingFor([...lat.keys()]);
    let so = 0, coHut = 0, coThuong = 0;
    for (const [sid, ev] of lat) {
      const s = st.get(sid);
      if (!s || s.attemptId !== ev.attemptId) continue;
      const a = diemTuEval(ev), b = diemTuStanding(s)!;
      assert(JSON.stringify(a.kn) === JSON.stringify(b.kn), `em ${sid}: kn ${JSON.stringify(a.kn)} ≠ standing ${JSON.stringify(b.kn)}`);
      assert(a.overall === b.overall && JSON.stringify(a.soVoi) === JSON.stringify(b.soVoi) && a.luot === b.luot && a.tuan === b.tuan,
        `em ${sid}: ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`);
      /* ✗ đúng các kỹ năng `under` của chính lượt — cùng cờ SOS / Dưới kỳ vọng. */
      const hut = a.kn.filter((k: any) => k.dat === false).length;
      const under = Object.values(ev.skills).filter((x: any) => x.evaluable && x.under && !x.bo).length;
      assert(hut === under, `em ${sid}: ${hut} ✗ ≠ ${under} kỹ năng dưới kỳ vọng`);
      if (hut) coHut++;
      if (a.donVi === '%') coThuong++;
      so++;
    }
    assert(so > 20 && coHut > 0 && coThuong > 0, `demo phải có đủ loại: ${so} em, ${coHut} có kỹ năng hụt, ${coThuong} lớp thường`);
  });

  check('M1 · RF1: kỹ năng chưa điểm → v null, dat null; môn bỏ → dat null; lớp thường đơn vị % + mốc "ngưỡng"; FT luôn L R W S', () => {
    const ids = studentsInScope(P.admin, null);
    const lat = latestAttempts(ids, 'valid', TODAY);
    let thieu = 0;
    for (const ev of lat.values()) {
      const x = diemTuEval(ev);
      for (const k of x.kn) if (k.v === null) { assert(k.dat === null, `kỹ năng ${k.k} chưa điểm mà có dat`); thieu++; }
      for (const [sk, s] of Object.entries(ev.skills) as [string, any][]) if (s.bo) assert(x.kn.find((k: any) => k.k === d.tenMonNgan(null, sk))?.dat === null, 'môn bỏ có ✓ / ✗');
      if (x.donVi === '%') assert(x.soVoi === null || x.soVoi.nhan === 'ngưỡng', 'lớp thường phải so ngưỡng');
      else assert(x.kn.map((k: any) => k.k).join('') === 'LRWS' && (x.soVoi === null || x.soVoi.nhan === 'KV'), `FT: ${x.kn.map((k: any) => k.k).join('')}`);
    }
    assert(thieu > 0, 'demo phải có lượt thiếu kỹ năng');
  });

  check('M1 · 0 câu: dựng DiemHv từ lượt đã nạp không thêm câu; standingFor số câu như khi tắt', () => {
    const ids = emLop(lopFt);
    const them = chayTrongRequest('GET', () => { const lat = latestAttempts(ids, 'valid', TODAY); const a = soCauSql(); for (const ev of lat.values()) diemTuEval(ev); return soCauSql() - a; });
    assert(them === 0, `diemTuEval thêm ${them} câu`);
    const { tat, bat } = haiLan(() => standingFor(ids));
    assert(tat.cau === bat.cau, `standingFor: ${tat.cau} → ${bat.cau} câu`);
  });

  /* ---------------------------------------------------------------- M2 */
  const vai: [string, any][] = [['QL', P.mbManager], ['QT', P.admin], ['GVCN', P.coreTeacher]];
  const panel = (p: any, id: string, f: any = {}) => metrics.metricResponse(metrics.metricSet(p, id, f), true, p);

  check('M2 · giống hệt: n, ids, thứ tự dòng, mọi trường cũ bằng nhau khi tắt / bật (QL, QT, GVCN × 4 chỉ số)', () => {
    for (const [ten, p] of vai) {
      for (const [id, f] of [['hv-sos-hien-tai', {}], ['hv-duoi-ky-vong-mon', { skill: 'reading' }], ['hv-co-case-mo', {}], ['bai-qua-han-nhap-diem', {}]] as [string, any][]) {
        const { tat, bat } = haiLan(() => panel(p, id, f));
        assert(tat.kq.n === bat.kq.n && JSON.stringify(tat.kq.ids) === JSON.stringify(bat.kq.ids), `${ten} ${id}: n / ids đổi`);
        assert(JSON.stringify(tat.kq.rows.map(boMoi)) === JSON.stringify(bat.kq.rows.map(boMoi)), `${ten} ${id}: trường cũ của dòng đổi`);
        assert(tat.kq.rows.every((r: any) => !('diemHv' in r)), `${ten} ${id}: tắt mà còn diemHv`);
      }
    }
  });

  check('M2 · dòng HV có diemHv đúng lượt hiện tại (latestAttempts) — SOS: lượt có SOS, có ✗; tạm khi lượt chưa chốt', () => {
    const r = metrics.metricSet(P.admin, 'hv-sos-hien-tai', {});
    const rows = metrics.metricResponse(r, true, P.admin).rows;
    assert(rows.length > 0, 'demo phải có em SOS');
    const tam = new Set(r.splits.tamThoi);
    for (const row of rows) {
      const ev = r.luotHv.get(row.id);
      assert(row.diemHv?.luot === diemTuEval(ev).luot && row.diemHv.tuan === ev.weekStart, `em ${row.id}: lượt ${row.diemHv?.luot}`);
      assert(row.diemHv.kn.some((k: any) => k.dat === false) || ev.khongChiaMon, `em ${row.id}: SOS mà không kỹ năng ✗`);
      if (tam.has(row.id)) assert(row.diemHv.tam, `em ${row.id}: SOS tạm mà dòng không "tạm"`);
    }
  });

  check('M2 · RF2: em có lượt mới đến lịch chưa điểm → dòng điểm vẫn là lượt có điểm (không lấy lượt due)', () => {
    const ids = studentsInScope(P.admin, null);
    const valid = latestAttempts(ids, 'valid', TODAY), due = latestAttempts(ids, 'due', TODAY);
    const lech = [...valid].filter(([sid, ev]) => due.get(sid) && due.get(sid)!.attemptId !== ev.attemptId && due.get(sid)!.scored === 0);
    assert(lech.length > 0, 'demo phải có em có lượt mới chưa điểm');
    const rows = metrics.rowsFor('hoc-vien', lech.map(([s]) => s), undefined, P.admin);
    for (const row of rows) {
      const ev = valid.get(row.id)!;
      assert(row.diemHv?.luot === diemTuEval(ev).luot && row.diemHv?.tuan === ev.weekStart, `em ${row.id}: dòng ${row.diemHv?.luot} ≠ lượt có điểm ${diemTuEval(ev).luot}`);
    }
  });

  check('M2 · RF3 câu: QL / QT mở panel SOS hiện tại và Dưới kỳ vọng — số câu như khi tắt; ô số (không rows) không đổi', () => {
    for (const [ten, p] of vai.slice(0, 2)) {
      for (const [id, f] of [['hv-sos-hien-tai', {}], ['hv-duoi-ky-vong-mon', { skill: 'reading' }]] as [string, any][]) {
        const mo = haiLan(() => panel(p, id, f));
        assert(mo.bat.cau === mo.tat.cau, `${ten} ${id} rows=1: ${mo.tat.cau} → ${mo.bat.cau} câu`);
        const o = haiLan(() => metrics.metricResponse(metrics.metricSet(p, id, f), false, p));
        assert(o.bat.cau === o.tat.cau, `${ten} ${id} ô số: ${o.tat.cau} → ${o.bat.cau} câu`);
      }
    }
  });

  /*
   * Kế hoạch ước ≤ +3; đo 30/10: +8 (attemptsNewestFirst 1 + mỗi vòng lịch kỹ năng / điểm / bỏ môn cũ + chương trình, ngưỡng lớp). Chỉ khi MỞ panel,
   * chỉ tập id của panel (không cả chi nhánh); đường vẫn dưới ~30 câu. Trần +10 (ghi mô tả PR, báo PTA) — ponytail: muốn ≤ +3 thì gắn luotHv ở metricSetGoc.
   */
  check('M2 · panel dùng lượt mặc định (hv-co-case-mo): mở panel ≤ +10 câu, đường ≤ 30 câu', () => {
    for (const [ten, p] of vai) {
      const mo = haiLan(() => panel(p, 'hv-co-case-mo'));
      console.log(`      [đo] hv-co-case-mo ${ten}: ${mo.tat.cau} → ${mo.bat.cau} câu`);
      assert(mo.bat.cau <= mo.tat.cau + 10 && mo.bat.cau <= 30, `${ten}: ${mo.tat.cau} → ${mo.bat.cau} câu`);
    }
  });

  check('M2 · bài quá hạn: tiêu đề không tên em; nguoi = tên gọi người giữ việc (+ "chấm chéo"); han = hạn của chiTiet', () => {
    const r = metrics.metricSet(P.admin, 'bai-qua-han-nhap-diem', {});
    const rows = metrics.metricResponse(r, true, P.admin).rows;
    assert(rows.length > 0, 'demo phải có bài quá hạn');
    let coNguoi = 0;
    for (const row of rows) {
      assert(!row.em || !row.title.includes(row.em.ten), `bài ${row.id}: tiêu đề còn tên em "${row.title}"`);
      const c = r.chiTiet.get(row.id);
      assert(row.han === (c?.han[0] ?? null), `bài ${row.id}: hạn ${row.han} ≠ ${c?.han[0]}`);
      if (c?.nguoi.length) {
        coNguoi++;
        const full = (conn.prepare('SELECT full_name FROM users WHERE id = ?').get(c.nguoi[0]) as any).full_name as string;
        assert(row.nguoi?.startsWith(full.trim().split(/\s+/).pop()!), `bài ${row.id}: người "${row.nguoi}" ≠ ${full}`);
        if (c.chamCheo) assert(row.nguoi.includes('chấm chéo'), 'thiếu "chấm chéo"');
      } else assert(row.nguoi === (c?.chamCheo ? 'chấm chéo' : null), `bài ${row.id}: không người mà nguoi = ${row.nguoi}`);
    }
    assert(coNguoi > 0, 'demo phải có bài quá hạn có người giữ việc');
  });
}
