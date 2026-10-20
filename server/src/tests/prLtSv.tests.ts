/**
 * PHÉP KIỂM LT-SV (kế hoạch 2026-10-21-pr-lt-sv.md) — lịch thi thật: MỘT hàm trạng thái (A đã chốt ngày / B chưa chốt ngày), hết "tháng (tuần) = ngày thi",
 * việc "Chốt ngày thi" không hạn, nhận ngày đã qua, ô "Sắp tới" của hồ sơ gồm kỳ thi thật. Mỗi mục dựng lớp / em riêng.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrLtSvTests(t: YThucTestKit) {
  const { check, checkAsync, assert, conn, TODAY, P, addDays } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const week: any = await import('../platform/week.ts');
  const intake: any = await import('../classes/intake.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const { examPlanOf } = await import('../fasttrack/cycles.ts');
  const profile: any = await import('../students/profile.ts');
  const { getConfig, setConfig } = await import('../demoConfig.ts');
  const { createApp } = await import('../app.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nLT-SV · lịch thi thật: trạng thái A / B, không "tháng = đã thi", việc Chốt ngày thi, ngày đã qua, Sắp tới');

  // ------------------------------------------------------------------ 1 · bảng trạng thái (hàm thuần)
  check('LTSV-1 · bảng trạng thái: tháng trước / này / sau × có / không ngày × tuần × ngày đã qua → trangThaiLichThi, nhãn, ngày thi sau thi', () => {
    const h = '2026-11-15';
    const W = (thuHai: string) => ({ exam_week: thuHai });
    /* [mô tả, cột lộ trình, trạng thái, nhãn, ngayThiSauThi, giai đoạn sau thi] */
    const bang: [string, any, string, string, string | null, string][] = [
      ['tháng trước, chưa ngày', { exam_month: '2026-10' }, 'chua-chot-ngay', 'Chưa chốt ngày thi 10/2026', null, 'chua_thi'],
      ['tháng này, chưa ngày', { exam_month: '2026-11' }, 'chua-chot-ngay', 'Chưa chốt ngày thi 11/2026', null, 'chua_thi'],
      ['tháng sau, chưa ngày', { exam_month: '2026-12' }, 'du-kien', 'Dự kiến thi 12/2026', null, 'chua_thi'],
      ['tuần tháng trước, chưa ngày', { exam_month: '2026-10', ...W('2026-10-19') }, 'chua-chot-ngay', `Chưa chốt ngày thi ${d.tuanLich('2026-10-19', h)}`, null, 'chua_thi'],
      ['tuần tháng này, chưa ngày', W('2026-11-16'), 'chua-chot-ngay', `Chưa chốt ngày thi ${d.tuanLich('2026-11-16', h)}`, null, 'chua_thi'],
      ['tuần tháng sau, chưa ngày', W('2026-12-07'), 'du-kien', `Dự kiến thi ${d.tuanLich('2026-12-07', h)}`, null, 'chua_thi'],
      ['ngày tháng sau', { exam_month: '2026-12', exam_date: '2026-12-05' }, 'da-chot-ngay', 'Thi 05/12', '2026-12-05', 'chua_thi'],
      ['ngày tháng này, còn 3 ngày', { exam_month: '2026-11', exam_date: '2026-11-18' }, 'da-chot-ngay', 'Thi 18/11 · còn 3 ngày', '2026-11-18', 'chua_thi'],
      ['ngày hôm nay', { exam_date: '2026-11-15' }, 'da-chot-ngay', 'Thi 15/11 · hôm nay', '2026-11-15', 'chua_thi'],
      ['ngày đã qua tháng này', { exam_month: '2026-11', exam_date: '2026-11-10' }, 'da-thi', 'Đã thi 10/11', '2026-11-10', 'da_thi_cho_kq'],
      ['ngày đã qua tháng trước', { exam_date: '2026-10-28', ...W('2026-10-26') }, 'da-thi', 'Đã thi 28/10', '2026-10-28', 'da_thi_cho_kq'],
      ['ngày năm sau', { exam_date: '2027-01-20' }, 'da-chot-ngay', 'Thi 20/01/2027', '2027-01-20', 'chua_thi'],
      ['ngày thi thật đã nhập thắng dự kiến tháng sau', { exam_month: '2026-12', thi_that_ngay: '2026-11-12' }, 'da-thi', 'Đã thi 12/11', '2026-11-12', 'da_thi_cho_kq'],
      ['chưa có gì', {}, 'chua-co', 'Chưa có tháng thi', null, 'chua_thi'],
      ['tháng rác', { exam_month: '15/01' }, 'chua-co', 'Chưa có tháng thi', null, 'chua_thi'],
      /* Luật nhắc cũ giữ: KHÔNG có dự kiến nào mà lộ trình đã đóng → ngày đóng; có tháng mà đã đóng → vẫn chưa chốt ngày (không bịa ngày). */
      ['đã đóng, không dự kiến', { ended_at: '2026-11-01' }, 'chua-co', 'Chưa có tháng thi', '2026-11-01', 'da_thi_cho_kq'],
      ['đã đóng, tháng trước', { exam_month: '2026-10', ended_at: '2026-11-01' }, 'chua-chot-ngay', 'Chưa chốt ngày thi 10/2026', null, 'chua_thi'],
    ];
    for (const [mo, c, tt, nhan, ngayThi, gd] of bang) {
      const ke = examPlanOf({ exam_month: c.exam_month, exam_date: c.exam_date, ...(c.exam_week ? { exam_period_id: 1, exam_week_code: 'W', exam_week_start: c.exam_week } : {}) });
      const l = d.trangThaiLichThi(c, ke, h);
      const s = d.trangThaiSauThi(c, h);
      assert(l.trangThai === tt && d.nhanLichThi(l, h) === nhan && s.ngayThi === ngayThi && s.giaiDoan === gd,
        `${mo}: ${JSON.stringify({ l, nhan: d.nhanLichThi(l, h), ngayThi: s.ngayThi, gd: s.giaiDoan })}`);
    }
    /* Có kết quả mà không có ngày thi (chỉ tháng / Không thi): hạn Chọn bước tiếp = ngày có kết quả + 7, không đỏ ngay hôm sau. */
    const bt = d.trangThaiSauThi({ exam_month: '2026-10', thi_that_khong_thi: 1, ngay_kq: '2026-11-14' }, h);
    assert(bt.giaiDoan === 'cho_buoc_tiep' && bt.han === '2026-11-21' && !bt.quaHan, JSON.stringify(bt));
  });

  // ------------------------------------------------------------------ 2 · máy chủ
  const MB = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id as number;
  const NOW = new Date().toISOString();
  const T2 = week.mondayOf(TODAY) as string;
  const thangTruoc = (() => { const [y, m] = TODAY.split('-').map(Number); return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`; })();
  let seq = 0;
  const lop = (ft = true) => {
    seq += 1;
    const start = addDays(T2, -7 * 10);
    return intake.createClass(P.admin, ft
      ? { code: `MB LTSV-${seq}`, branchId: MB, kind: 'FT', isFastTrack: true, route: 'LT1', startDate: start, startPeriodId: week.ensurePeriod(start).id }
      : { code: `MB LTSV-T${seq}`, branchId: MB, kind: 'BE', isFastTrack: false, programmeCode: 'BE', startDate: start, startPeriodId: week.ensurePeriod(start).id }).id as number;
  };
  const gvcnMoi = (classId: number) => {
    seq += 1;
    const uid = accounts.createAccount(P.admin, { email: `ltsv.${seq}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-ltsv', fullName: `GVCN LTSV ${seq}`, roles: [{ role: 'teacher', branches: ['MB'] }] }).userId as number;
    conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,NULL,1,'2026-01-01','active',?)`).run(uid, classId, NOW);
    return uid;
  };
  const em = (l: number, thi: { exam_month?: string | null; exam_date?: string | null }, route: string | null = 'LT1') => {
    seq += 1;
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-LTSV-${seq}`, `Học viên LTSV ${seq}`, `hoc vien ltsv ${seq}`, MB, NOW).lastInsertRowid);
    const bd = addDays(T2, -7 * 10);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, l, bd, NOW);
    const cy = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, start_period_id, started_at, status, created_at, exam_date, exam_month)
      VALUES (?,1,?,?,6.5,?,?, 'active', ?, ?, ?)`)
      .run(sid, route, route ? 'FT' : 'BE', week.ensurePeriod(bd).id, bd, NOW, thi.exam_date ?? null, thi.exam_month ?? (thi.exam_date ? thi.exam_date.slice(0, 7) : null)).lastInsertRowid);
    return { sid, cy };
  };
  async function voiMayChu(fn: (goi: (userId: number, url: string, init?: RequestInit) => Promise<Response>) => Promise<void>) {
    const cu = getConfig('demo_date');
    const may = createApp().listen(0);
    const cong = (may.address() as any).port as number;
    const phien = new Map<number, string>();
    const goi = async (userId: number, url: string, init: RequestInit = {}) => {
      if (!phien.has(userId)) {
        const s = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }) });
        phien.set(userId, (s.headers.get('set-cookie') ?? '').split(';')[0]);
      }
      return fetch(`http://127.0.0.1:${cong}/api${url}`, { ...init, headers: { 'content-type': 'application/json', cookie: phien.get(userId)!, ...(init.headers ?? {}) } });
    };
    try { setConfig('demo_date', TODAY); xoaNho(); await fn(goi); } finally { may.close(); setConfig('demo_date', cu); xoaNho(); }
  }
  const json = async (r: Response): Promise<any> => { const x = await r.json().catch(() => null); if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(x)}`); return x; };
  const viec = async (goi: any, uid: number, sid: number, q = '') => ((await json(await goi(uid, `/my-work${q}`))).dong as any[])
    .flatMap((x: any) => (x.con?.length ? x.con : [x])).filter((x: any) => x.studentId === sid);
  const QL = P.mbManager.userId as number;

  await checkAsync('LTSV-2 · em FT chỉ có tháng đã tới: KHÔNG "Cập nhật kết quả thi thật"; có "Chốt ngày thi" không hạn cho GVCN (QL "Tất cả" thấy); lớp thường, em có ngày: không việc', async () => {
    const l = lop(); const g = gvcnMoi(l);
    const b = em(l, { exam_month: thangTruoc });
    const a = em(l, { exam_date: addDays(TODAY, 10) });
    const lt = lop(false); const gt = gvcnMoi(lt);
    const th = em(lt, { exam_month: thangTruoc }, null);
    await voiMayChu(async (goi) => {
      const vb = await viec(goi, g, b.sid);
      assert(!vb.some((x) => x.group === 'thi_that'), `không còn "tháng = đã thi": ${JSON.stringify(vb)}`);
      const chot = vb.filter((x) => x.key === `chot-ngay-thi:${b.cy}`);
      assert(chot.length === 1 && chot[0].due === null && chot[0].urgency === 'normal' && chot[0].tieuDe === 'Chốt ngày thi', JSON.stringify(vb));
      assert((await viec(goi, QL, b.sid, '?nguoi=tat-ca')).some((x) => x.key === `chot-ngay-thi:${b.cy}`), 'QL "Tất cả" thấy việc của GVCN');
      assert(!(await viec(goi, g, a.sid)).some((x) => String(x.key).startsWith('chot-ngay-thi:')), 'em đã có ngày: không việc');
      assert(!(await viec(goi, gt, th.sid)).some((x) => String(x.key).startsWith('chot-ngay-thi:')), 'lớp thường: chỉ chip, không việc');
    });
  });

  await checkAsync('LTSV-3 · Lịch thi nhận NGÀY ĐÃ QUA: em B chốt ngày 3 hôm trước → 200, trạng thái "đã thi", hết việc Chốt ngày, GVCN có việc Cập nhật kết quả', async () => {
    const l = lop(); const g = gvcnMoi(l);
    const b = em(l, { exam_month: TODAY.slice(0, 7) });
    await voiMayChu(async (goi) => {
      const truoc = (await json(await goi(QL, `/hoc-vien-lop/lich-thi?thang=${TODAY.slice(0, 7)}`))).rows.find((r: any) => r.studentId === b.sid);
      assert(truoc?.lichThi?.trangThai === 'chua-chot-ngay', `trước: ${JSON.stringify(truoc?.lichThi)}`);
      const r = await json(await goi(QL, `/hoc-vien-lop/lich-thi/${b.cy}`, { method: 'PUT', body: JSON.stringify({ ketLuan: 'chot-ngay', ngay: addDays(TODAY, -3) }) }));
      assert(r.lichThi?.trangThai === 'da-thi' && r.coNgay, JSON.stringify(r));
      xoaNho();
      const v = await viec(goi, g, b.sid);
      assert(v.some((x) => x.group === 'thi_that') && !v.some((x) => String(x.key).startsWith('chot-ngay-thi:')), JSON.stringify(v));
    });
  });

  check('LTSV-4 · hồ sơ HV: ô "Sắp tới" là kỳ thi thật khi sớm hơn MT kế; đầu hồ sơ nói trạng thái lịch thi (một hàm nhãn)', () => {
    const l = lop(); gvcnMoi(l);
    const a = em(l, { exam_date: addDays(TODAY, 3) });
    const b = em(l, { exam_month: thangTruoc });
    const cu = getConfig('demo_date');
    try {
      setConfig('demo_date', TODAY); xoaNho();
      const pa = profile.studentProfile(P.admin, a.sid).dauHoSo;
      assert(pa.o.sapToi.gt === d.nhanLichThi({ trangThai: 'da-chot-ngay', ngay: addDays(TODAY, 3), thang: null, tuan: null }, TODAY), JSON.stringify(pa.o.sapToi));
      const pb = profile.studentProfile(P.admin, b.sid).dauHoSo;
      assert(pb.thongTin.thiDuKien?.gt === d.nhanThang(thangTruoc) && pb.thongTin.thiDuKien?.nhan === 'Chưa chốt ngày thi', JSON.stringify(pb.thongTin));
    } finally { setConfig('demo_date', cu); xoaNho(); }
  });
}
