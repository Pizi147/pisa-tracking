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
  const { diemTuEval, diemTuStanding, diemTuMock } = await import('../worklist/diemDong.ts');
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
    let so = 0, coHut = 0, coThuong = 0, khacKv = 0;
    for (const [sid, ev] of lat) {
      const s = st.get(sid);
      if (!s || s.attemptId !== ev.attemptId) continue;
      /* Lệch CÓ SẴN (không do PANEL-MC): lượt không có Target lúc thi — `resultOf` không kỳ vọng, `standingFor` rơi về Target lộ trình (T9). Không so. */
      if (s.mode !== 'ratio' && ev.kyVong !== s.expectation) { khacKv++; continue; }
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
    if (khacKv) console.log(`      [đo] ${khacKv} em: kỳ vọng latestAttempts ≠ standingFor (lượt thiếu Target lúc thi — có sẵn)`);
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
   * Kế hoạch ≤ +3. Sau gom lô (PTA 30/10): +4 = lượt của tập em (1) · chương trình (1, gộp từ 3) · lịch kỹ năng (1) · điểm (1) — mỗi loại MỘT câu
   * cho cả tập (json_each ≤ 900); ngưỡng lớp đi cùng câu lượt, bảng bỏ môn cũ chỉ hỏi khi lượt chưa có lịch kỹ năng. Chỉ khi MỞ panel.
   */
  check('M2 · panel dùng lượt mặc định (hv-co-case-mo): mở panel ≤ +4 câu (một câu mỗi loại theo lô), đường ≤ 30 câu', () => {
    for (const [ten, p] of vai) {
      const mo = haiLan(() => panel(p, 'hv-co-case-mo'));
      console.log(`      [đo] hv-co-case-mo ${ten}: ${mo.tat.cau} → ${mo.bat.cau} câu`);
      assert(mo.bat.cau <= mo.tat.cau + 4 && mo.bat.cau <= 30, `${ten}: ${mo.tat.cau} → ${mo.bat.cau} câu`);
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

  /* ---------------------------------------------------------------- M3 */
  const bc: any = await import('../phanTich/baoCao.ts');
  const hq: any = await import('../phanTich/hieuQuaPa.ts');
  const cnMb = (conn.prepare(`SELECT branch_id FROM classes WHERE id = ?`).get(lopFt) as any).branch_id as number;
  const ky = { tu: d.addDaysIso(TODAY, -120), den: TODAY };

  check('M3 · Đạt MT: dòng điểm = lượt MT trong kỳ đã tính % (diemTuMock), số câu như khi tắt; bỏ diemCase', () => {
    const f = { branchId: null, ct: 'ft', ...ky, o: 'dat-mt' };
    const { tat, bat } = haiLan(() => bc.oBaoCao(P.mbManager, f));
    assert(bat.kq.n > 0 && bat.kq.n === tat.kq.n, `Đạt MT n ${tat.kq.n} → ${bat.kq.n}`);
    assert(bat.cau === tat.cau, `Đạt MT: ${tat.cau} → ${bat.cau} câu`);
    const luot = bc.tapDatMt(P.mbManager, f).luot;
    for (const r of bat.kq.rows) {
      assert(r.diemHv?.luot === `MT${luot.get(r.id).mt}` && r.diemHv.tuan === luot.get(r.id).tuan && !('diemCase' in r), `em ${r.id}: ${JSON.stringify(r.diemHv)}`);
    }
  });

  check('M3 · Kết quả MT: mỗi dòng có diemHv (MT: lượt của ô · thi thật: so Target), số câu như khi tắt', () => {
    for (const o of ['kq-mt:mt1:dat', 'kq-mt:mt2:chua-du', 'kq-mt:thi:dat', 'kq-mt:mt3+:thieu-0.5']) {
      const { tat, bat } = haiLan(() => bc.oBaoCao(P.mbManager, { branchId: null, ct: 'ft', ...ky, o }));
      assert(bat.cau === tat.cau && bat.kq.n === tat.kq.n, `${o}: ${tat.cau} → ${bat.cau} câu`);
      for (const r of bat.kq.rows) assert(r.diemHv && r.diemHv.kn.length === 4 && (o.includes(':thi:') ? r.diemHv.soVoi?.nhan !== 'KV' : r.diemHv.luot.startsWith('MT')), `${o} em ${r.id}: ${JSON.stringify(r.diemHv)}`);
    }
  });

  check('M3 · Tiến bộ kỹ năng: xuHuong khớp chữ sub cũ (Tăng / Giữ nguyên / Giảm) + điểm hai lượt; số câu như khi tắt', () => {
    const r = bc.baoCao(P.mbManager, { branchId: cnMb, ct: 'ft', ...ky });
    let so = 0;
    for (const x of r.tienBo) {
      const { tat, bat } = haiLan(() => bc.oBaoCao(P.mbManager, { branchId: cnMb, ct: 'ft', ...ky, o: `tien-bo:${x.skill}` }));
      assert(bat.cau === tat.cau, `${x.skill}: ${tat.cau} → ${bat.cau} câu`);
      for (const row of bat.kq.rows) {
        const chu = row.sub.split(' · ').pop();
        const mong = { Tăng: 'tang', 'Giữ nguyên': 'giu', Giảm: 'giam' }[chu as string];
        assert(row.xuHuong?.huong === mong, `bài ${row.id}: "${chu}" ≠ ${row.xuHuong?.huong}`);
        const { truoc, sau } = row.xuHuong;
        assert(typeof truoc?.v === 'number' && typeof sau?.v === 'number' && Math.sign(sau.v - truoc.v) === { tang: 1, giu: 0, giam: -1 }[mong as 'tang'], `bài ${row.id}: ${JSON.stringify(row.xuHuong)}`);
        so++;
      }
    }
    assert(so > 0, 'demo phải có mục tiến bộ');
  });

  check('M3 · PA cải thiện: xuHuong cai-thien / chua-cai-thien khớp sub', () => {
    const p = bc.oBaoCao(P.mbManager, { branchId: null, ct: 'ft', ...ky, o: 'pa-co-ket-qua' });
    for (const r of p.rows) assert(r.xuHuong?.huong === (r.sub.endsWith('Chưa cải thiện') ? 'chua-cai-thien' : 'cai-thien'), `PA ${r.id}: ${r.sub} · ${r.xuHuong?.huong}`);
  });

  await t.checkAsync('M3 · PA chưa có kết quả (Hiệu quả PA): mỗi dòng kèm việc Ghi kết quả — lam theo ghiDuocPaMany (QT được; người thực hiện được); câu ≤ trước + 3', async () => {
    const { loadPrincipal } = await import('../permissions.ts');
    const f = { branchId: null, ct: 'ft', classId: null, soTuan: 8, dong: 'chua-ghi-ket-qua', cot: 'pa' };
    const { tat, bat } = haiLan(() => hq.oHieuQuaPa(P.admin, f));
    const o = bat.kq;
    assert(o.n > 0 && o.rows.every((r: any) => r.viec?.loai === 'ghi-ket-qua' && r.viec.lam === true), `QT: ${JSON.stringify(o.rows.map((r: any) => r.viec))}`);
    assert(bat.cau <= tat.cau + 3, `câu ${tat.cau} → ${bat.cau}`);
    const iv = conn.prepare('SELECT performer_user_id AS u FROM case_interventions WHERE id = ?').get(o.rows[0].id) as any;
    if (iv?.u) {
      const pGv = loadPrincipal(iv.u);
      const r0 = metrics.rowsFor('phuong-an', [o.rows[0].id], metrics.PA_CHUA_CO_KET_QUA, pGv, true)[0];
      assert(r0.viec?.lam === true, 'người thực hiện PA phải ghi được');
    }
    /* QL chi nhánh khác không ghi được: ba QL ba chi nhánh — ít nhất một ngoài chi nhánh của PA. */
    const lam = [P.mbManager, P.cpManager, P.bcManager].map((q) => metrics.rowsFor('phuong-an', [o.rows[0].id], metrics.PA_CHUA_CO_KET_QUA, q, true)[0].viec?.lam);
    assert(lam.includes(false), `QL ba chi nhánh đều ghi được: ${lam}`);
  });

  /* ---------------------------------------------------------------- M4 */
  const hvSos: any = await import('../classes/hocVienSos.ts');
  const classesMod: any = await import('../classes/classes.ts');

  check('M4 · panel một em: diem có đúng số ✗ = mức SOS (FT), luot.soLieu có kỳ vọng + band kỹ năng hụt; 0 câu thêm (diemTuStanding thuần)', () => {
    const ids = studentsInScope(P.admin, null);
    const st = standingFor(ids);
    const em = [...st.values()].find((x) => x.mode === 'ielts_band' && x.sosLevel === 2 && !x.provisional);
    assert(em, 'demo phải có em FT SOS 2 đã chốt');
    const r = hvSos.panelMotEm(P.admin, em!.studentId);
    assert(r.diem && r.diem.kn.filter((k: any) => k.dat === false).length === 2, `diem: ${JSON.stringify(r.diem)}`);
    assert(r.luot.sosLevel === 2 && r.luot.kyNang.length === 2 && r.luot.tam === false, `luot: ${JSON.stringify(r.luot)}`);
    const nhan = r.luot.soLieu.map(([k]: [string]) => k);
    assert(nhan.some((k: string) => k.startsWith('Kỳ vọng')) && r.luot.kyNang.every((k: string) => nhan.includes(k)), `soLieu: ${JSON.stringify(r.luot.soLieu)}`);
    const { cau } = doCau(() => diemTuStanding(em!));
    assert(cau === 0, `diemTuStanding ${cau} câu`);
    /* Em chưa thi lượt nào có điểm → diem null. */
    const chua = [...st.values()].find((x) => x.attemptId === null);
    if (chua) assert(hvSos.panelMotEm(P.admin, chua.studentId).diem === null, 'em chưa có điểm mà có diem');
  });

  check('M4 · roster: tvv = họ tên TVV (consultant_user_id) cùng câu; em không TVV → null; GV lớp khác vẫn 403', () => {
    const rows = classesMod.classRoster(P.mbManager, lopFt);
    assert(rows.length > 0, 'lớp trống');
    let co = 0;
    for (const r of rows) {
      const u = conn.prepare(`SELECT u.full_name FROM students s LEFT JOIN users u ON u.id = s.consultant_user_id WHERE s.id = ?`).get(r.id) as any;
      assert(r.tvv === (u?.full_name ?? null), `em ${r.id}: tvv ${r.tvv} ≠ ${u?.full_name}`);
      if (r.tvv) co++;
    }
    assert(co > 0, 'demo phải có em có TVV');
    const lopKhac = (conn.prepare(`SELECT c.id FROM classes c WHERE c.status = 'active' AND c.id NOT IN (SELECT class_id FROM teacher_assignments WHERE user_id = ?) LIMIT 1`).get(P.subjectTeacher.userId) as any).id;
    let loi = '';
    try { classesMod.classRoster(P.subjectTeacher, lopKhac); } catch (e: any) { loi = String(e.status ?? e.statusCode ?? e.message); }
    assert(/403|ngoài phạm vi/.test(loi), `GV lớp không dạy: "${loi}"`);
  });

  /* ---------------------------------------------------------------- M5 */
  const yc: any = await import('../duyet/yeuCau.ts');

  check('M5 · giống hệt: hộp Chờ duyệt QL / QT — danh sách id + mọi trường cũ bằng nhau khi tắt / bật; Đã xử lý không thêm câu', () => {
    const boMoiThe = (x: any) => { const { sos: _a, diemHv: _b, soLichSu: _c, ...cu } = x; return cu; };
    for (const [ten, p] of vai.slice(0, 2)) {
      const { tat, bat } = haiLan(() => yc.hopChoDuyet(p, { xem: 'cho', boiCanh: true }));
      assert(bat.kq.the.length > 0, `${ten}: demo phải có thẻ chờ duyệt`);
      assert(JSON.stringify(tat.kq.the.map(boMoiThe)) === JSON.stringify(bat.kq.the.map(boMoiThe)) && JSON.stringify(tat.kq.dem) === JSON.stringify(bat.kq.dem), `${ten}: thẻ cũ đổi`);
      console.log(`      [đo] /yeu-cau?hop=cho-duyet ${ten}: ${tat.cau} → ${bat.cau} câu`);
      /*
       * Kế hoạch ≤ +2–3. Sau gom lô: +4 = lượt (1) · chương trình (1) · lịch kỹ năng (1) · điểm (1) của MỌI em các thẻ (latestAttempts theo lô);
       * số Lịch sử đếm trong câu đọc thẻ (0 câu). Chỉ khi xin `boiCanh` (panel duyệt); không cờ → 0 câu thêm (phép dưới).
       */
      assert(bat.cau <= tat.cau + 4 && bat.cau <= 30, `${ten}: ${tat.cau} → ${bat.cau} câu`);
      const khong = haiLan(() => yc.hopChoDuyet(p, { xem: 'cho' }));
      assert(khong.bat.cau === khong.tat.cau && khong.bat.kq.the.every((x: any) => !('soLichSu' in x)), `${ten} không boiCanh: ${khong.tat.cau} → ${khong.bat.cau} câu`);
      const xl = haiLan(() => yc.hopChoDuyet(p, { xem: 'da-xu-ly', boiCanh: true }));
      assert(xl.bat.cau === xl.tat.cau && xl.bat.kq.the.every((x: any) => !('soLichSu' in x)), `${ten} Đã xử lý: ${xl.tat.cau} → ${xl.bat.cau} câu`);
    }
  });

  check('M5 · chip SOS + dòng điểm ở thẻ Chờ duyệt = lượt hiện tại (latestAttempts, như chỉ số SOS hiện tại); thẻ không em → null', () => {
    const the = yc.hopChoDuyet(P.admin, { xem: 'cho', boiCanh: true }).the;
    const lat = latestAttempts(studentsInScope(P.admin, null), 'valid', TODAY);
    const sosHt = new Set(metrics.metricSet(P.admin, 'hv-sos-hien-tai', {}).ids);
    let coSos = 0;
    for (const x of the) {
      const ev = x.hocVienId ? lat.get(x.hocVienId) : null;
      assert(!!x.sos === (!!x.hocVienId && sosHt.has(x.hocVienId)), `thẻ ${x.id}: chip SOS ${JSON.stringify(x.sos)} ≠ SOS hiện tại`);
      if (x.sos) { coSos++; assert(x.sos.muc === ev!.sosLevel, `thẻ ${x.id}: mức ${x.sos.muc} ≠ ${ev!.sosLevel}`); }
      assert(JSON.stringify(x.diemHv ?? null) === JSON.stringify(ev ? diemTuEval(ev) : null), `thẻ ${x.id}: diemHv lệch`);
    }
    assert(coSos > 0, 'demo phải có thẻ của em SOS');
  });

  check('M5 · Lịch sử yêu cầu: soLichSu = số dòng /lich-su?loai=yeu-cau; GVBM → 403; ≤ 3 câu, ≤ 50 dòng; câu đếm đi chỉ mục audit', () => {
    const the = yc.hopChoDuyet(P.admin, { xem: 'cho', boiCanh: true }).the;
    const pa = the.find((x: any) => x.loai && x.soLichSu > 0 && x.doiTuongId) ?? the[0];
    const { kq, cau } = doCau(() => yc.lichSuYeuCau(P.admin, pa.id));
    assert(kq.dong.length === Math.min(pa.soLichSu, 50) && kq.dong.length <= 50, `thẻ ${pa.id}: soLichSu ${pa.soLichSu} ≠ ${kq.dong.length} dòng`);
    assert(cau <= 3, `lichSuYeuCau ${cau} câu`);
    assert(the.some((x: any) => x.soLichSu > 0), 'demo phải có thẻ có nhật ký');
    let loi = '';
    try { yc.lichSuYeuCau(P.subjectTeacher, pa.id); } catch (e: any) { loi = String(e.status ?? e.statusCode ?? ''); }
    assert(loi === '403', `GVBM: "${loi}"`);
    const ke = (conn.prepare(`EXPLAIN QUERY PLAN SELECT y.*, (SELECT COUNT(*) FROM audit_logs a WHERE (a.entity_type = 'yeu_cau_duyet' AND a.entity_id = y.id)
      OR (a.entity_type = CASE y.doi_tuong_loai WHEN 'intervention' THEN 'case_intervention' ELSE y.doi_tuong_loai END AND a.entity_id = y.doi_tuong_id)) AS n
      FROM yeu_cau_duyet y WHERE y.trang_thai = 'cho'`).all() as any[]).map((r) => r.detail).join(' | ');
    assert(!/SCAN (a|audit_logs)\b(?! USING)/.test(ke), `audit_logs bị quét cả bảng: ${ke}`);
  });


  /* ---------------------------------------------------------------- rà sâu PTA (30/10) */
  const kqt: any = await import('../phanTich/ketQuaThi.ts');

  check('RS · Báo cáo SOS trong kỳ (sos:tong:n, sos:<lớp>:n) + HV đã thi: dòng điểm = lượt MT TRONG KỲ tạo mức đó (MT lớn nhất), không lượt hiện tại; 0 câu thêm', () => {
    const f = { branchId: null, ct: 'ft', ...ky };
    const mk = kqt.mockTrongKhoang(P.mbManager, { branchId: null, tu: ky.tu, den: ky.den }, { boCase: true });
    const hien = latestAttempts(studentsInScope(P.mbManager, null), 'valid', TODAY);
    let so = 0, khacHienTai = 0;
    for (const muc of [1, 2, 3]) {
      const { tat, bat } = haiLan(() => bc.oBaoCao(P.mbManager, { ...f, o: `sos:tong:${muc}` }));
      assert(bat.cau === tat.cau && bat.kq.n === tat.kq.n, `SOS ${muc}: ${tat.cau} → ${bat.cau} câu`);
      for (const r of bat.kq.rows) {
        const mt = Math.max(...mk.filter((d: any) => d.studentId === r.id && d.sos === muc).map((d: any) => d.mt));
        assert(r.diemHv?.luot === `MT${mt}`, `SOS ${muc} em ${r.id}: dòng ${r.diemHv?.luot} ≠ MT${mt} trong kỳ`);
        if (hien.get(r.id) && diemTuEval(hien.get(r.id)!).luot !== r.diemHv.luot) khacHienTai++;
        so++;
      }
      const lop = bat.kq.rows[0] && mk.find((d: any) => d.studentId === bat.kq.rows[0].id && d.sos === muc)?.classId;
      if (lop) {
        const o = bc.oBaoCao(P.mbManager, { ...f, o: `sos:${lop}:${muc}` });
        for (const r of o.rows) {
          const mt = Math.max(...mk.filter((d: any) => d.studentId === r.id && d.sos === muc && d.classId === lop).map((d: any) => d.mt));
          assert(r.diemHv?.luot === `MT${mt}`, `SOS ${muc} lớp ${lop} em ${r.id}: ${r.diemHv?.luot} ≠ MT${mt}`);
        }
      }
    }
    assert(so > 0, 'demo phải có em SOS trong kỳ');
    console.log(`      [đo] ${so} dòng SOS trong kỳ · ${khacHienTai} dòng có lượt trong kỳ ≠ lượt hiện tại (trước sửa sẽ hiện sai)`);
    const da = bc.oBaoCao(P.mbManager, { ...f, o: 'hv-da-thi' });
    for (const r of da.rows) {
      const mt = Math.max(...mk.filter((d: any) => d.studentId === r.id).map((d: any) => d.mt));
      assert(r.diemHv?.luot === `MT${mt}`, `HV đã thi em ${r.id}: ${r.diemHv?.luot} ≠ MT${mt}`);
    }
    const th = bc.oBaoCao(P.mbManager, { branchId: null, ct: 'thuong', ...ky, o: 'hv-da-thi' });
    assert(th.rows.length > 0 && th.rows.every((r: any) => r.diemHv && r.diemHv.donVi === '%'), `lớp thường HV đã thi: ${JSON.stringify(th.rows[0]?.diemHv)}`);
  });

  check('RS · DongMock: môn bỏ không ✓ / ✗; cờ tạm theo lượt chưa chốt (không theo SOS)', () => {
    const mk = kqt.mockTrongKhoang(P.admin, { branchId: null, tu: ky.tu, den: ky.den }, { boCase: true });
    for (const d of mk) {
      const x = d && diemTuMock(d);
      assert(x.tam === !d.chot, `lượt ${d.attemptId}: tam ${x.tam} ≠ chưa chốt ${!d.chot}`);
    }
    assert(mk.some((d: any) => !d.chot && !d.sos), 'demo phải có lượt chưa chốt không SOS');
    const bo = conn.prepare(`SELECT attempt_id FROM attempt_skills WHERE required = 0 AND skill IN ('listening','reading','speaking') LIMIT 50`).all() as any[];
    for (const { attempt_id } of bo) {
      const d = mk.find((x: any) => x.attemptId === attempt_id);
      const sk = (conn.prepare(`SELECT skill FROM attempt_skills WHERE attempt_id = ? AND required = 0`).all(attempt_id) as any[]).map((r) => r.skill);
      if (d) for (const k of sk) if (d.kn[k]) assert(d.kn[k].dat === null, `lượt ${attempt_id}: môn bỏ ${k} có dat ${d.kn[k].dat}`);
    }
  });
}
