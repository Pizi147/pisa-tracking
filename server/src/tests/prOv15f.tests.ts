/**
 * PHÉP KIỂM OV-15f (kế hoạch 2026-10-19-ov15-overhaul-6-pr.md mục OV-15f) — Học viên & Lớp › Lịch thi (rà soát lịch thi thật), Xuất Excel danh sách HV,
 * phân trang danh sách. Gọi QUA HTTP theo vai (QL, Admin, GV) như bản chính; mỗi mục dựng lớp / em riêng; chạy cuối `run.ts`.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv15fTests(t: YThucTestKit) {
  const { checkAsync, check, assert, conn, TODAY, P, addDays } = t;
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const util: any = await import('../util.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const m15f: any = await import('../migrate/prOv15f.ts');
  const Database = (await import('libsql')).default as any;
  const { getConfig, setConfig } = await import('../demoConfig.ts');
  const { createApp } = await import('../app.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nOV-15f · Lịch thi (rà soát thi thật), Xuất Excel danh sách HV, phân trang (qua HTTP)');

  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const QL = P.mbManager.userId as number;
  const MB = one(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const NOW = new Date().toISOString();
  const T2 = week.mondayOf(TODAY) as string;
  const tuan = (thuHai: string) => week.ensurePeriod(thuHai).id as number;
  let seq = 0;
  const nguoi = (role: string, branches: string[]) => {
    seq += 1;
    return accounts.createAccount(P.admin, { email: `ov15f.${seq}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-ov15f', fullName: `Thử OV15f ${seq}`, roles: [{ role, branches }] }).userId as number;
  };
  const ADMIN = nguoi('office_admin', ['MB']);
  const GV = nguoi('teacher', ['MB']);
  const lop = (code = `MB F15-${++seq}`) => {
    const start = addDays(T2, -7 * 10);
    return intake.createClass(P.admin, { code, branchId: MB, kind: 'FT', isFastTrack: true, route: 'LT1', startDate: start, startPeriodId: tuan(start) }).id as number;
  };
  /** Một em FT đang học `l`; `thi` = cột dự kiến thi của lộ trình (`exam_month` / `exam_date`). */
  const em = (l: number, ten: string, o: { email?: string | null; month?: string | null; date?: string | null } = {}) => {
    seq += 1;
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, email, branch_id, status, created_at) VALUES (?,?,?,?,?, 'active', ?)`)
      .run(`PISA-F15-${seq}`, ten, util.normalizeName(ten), o.email ?? null, MB, NOW).lastInsertRowid);
    const bd = addDays(T2, -7 * 10);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, l, bd, NOW);
    const cy = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, start_period_id, started_at, status, exam_month, exam_date, created_at)
      VALUES (?,1,'LT1','FT',6.5,?,?, 'active', ?, ?, ?)`).run(sid, tuan(bd), bd, o.month ?? null, o.date ?? null, NOW).lastInsertRowid);
    return { sid, cy };
  };
  const NAM = Number(TODAY.slice(0, 4));
  const M1 = `${NAM + 1}-03`, M2 = `${NAM + 1}-04`, M3 = `${NAM + 1}-05`;
  conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,NULL,1,'2026-01-01','active',?)`).run(GV, lop(), NOW);

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
  const loi = async (r: Response): Promise<{ status: number; error: string }> => { const x: any = await r.json().catch(() => ({})); return { status: r.status, error: x?.error ?? '' }; };
  const put = (body: unknown): RequestInit => ({ method: 'PUT', body: JSON.stringify(body) });
  const post = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) });

  // ------------------------------------------------------------------ 1 · hàm thuần
  check('F15-1 · Lịch thi (hàm thuần): tháng, kết luận có hiệu lực, việc ghi vào lịch, dải đếm', () => {
    assert(JSON.stringify(d.dsThangLichThi('2026-12, 2026-11,xx,2026-11,2026-13')) === JSON.stringify(['2026-11', '2026-12']), 'dsThangLichThi: lọc sai dạng, không trùng, tăng dần');
    assert(d.nhanThang('2026-11') === '11/2026' && d.thangKeTiep('2026-12-20') === '2027-01' && d.thangKeTiep('2026-10-19') === '2026-11', 'nhãn + tháng kế tiếp (qua năm)');
    assert(d.cuaSoThang('2026-10-19', 1, 3).join() === '2026-09,2026-10,2026-11,2026-12,2027-01', d.cuaSoThang('2026-10-19', 1, 3).join());
    const kl = (coNgay: boolean, thangDuKien: string | null, luu: any) => d.ketLuanHienTai({ coNgay, thangDuKien, luu });
    assert(kl(true, '2026-11', null) === 'chot-ngay', 'có ngày = chốt ngày');
    assert(kl(false, '2026-11', { ketLuan: 'giu-thang', thang: '2026-11' }) === 'giu-thang', 'giữ tháng còn hiệu lực');
    assert(kl(false, '2026-12', { ketLuan: 'giu-thang', thang: '2026-11' }) === null, 'đã dời sang tháng khác = lần rà mới');
    assert(kl(false, '2026-11', { ketLuan: 'can-xac-nhan', thang: '2026-11' }) === 'can-xac-nhan', 'cần xác nhận');
    assert(kl(false, '2026-11', { ketLuan: 'chuyen-thang', thang: '2026-11' }) === null, 'chuyển tháng không là trạng thái giữ lại');
    const s = (x: any) => d.suaLichTheoKetLuan({ coNgay: false, thangDuKien: '2026-11', ...x });
    assert(s({ ketLuan: 'chot-ngay', ngay: '2026-11-21' }).examDate === '2026-11-21' && s({ ketLuan: 'chot-ngay' }).loi, 'chốt ngày cần ngày');
    assert(s({ ketLuan: 'chuyen-thang', thang: '2026-12' }).examDate === '2026-12' && s({ ketLuan: 'chuyen-thang', thang: 'x' }).loi, 'chuyển tháng cần tháng');
    assert(s({ ketLuan: 'giu-thang' }).examDate === undefined && s({ ketLuan: 'can-xac-nhan' }).examDate === undefined, 'giữ / cần xác nhận không đổi lịch');
    assert(s({ ketLuan: 'giu-thang', coNgay: true }).examDate === '2026-11', 'giữ tháng khi đã có ngày = bỏ ngày, về tháng');
    assert(s({ ketLuan: 'giu-thang', thangDuKien: null }).loi, 'chưa có tháng thì không giữ được');
    const dem = d.demKetLuan([
      { ketLuan: 'chot-ngay', chuaCoDuKien: false }, { ketLuan: 'chot-ngay', chuaCoDuKien: false }, { ketLuan: 'giu-thang', chuaCoDuKien: false },
      { ketLuan: null, chuaCoDuKien: false, chuyenSang: '2026-12' }, { ketLuan: 'can-xac-nhan', chuaCoDuKien: false },
      { ketLuan: null, chuaCoDuKien: false }, { ketLuan: null, chuaCoDuKien: false }, { ketLuan: null, chuaCoDuKien: false },
      { ketLuan: null, chuaCoDuKien: true }, { ketLuan: null, chuaCoDuKien: true },
    ]);
    assert(JSON.stringify(dem) === JSON.stringify({ chotNgay: 2, giuThang: 1, chuyenThang: 1, canXacNhan: 1, chuaRa: 3, chuaCoDuKien: 2 }), JSON.stringify(dem));
  });

  check('F15-2 · Xuất danh sách (hàm thuần): ba mẫu cột, chọn cột, ô thiếu để trống, một hàng một em', () => {
    assert(d.COT_THEO_MAU['theo-doi-sos'].length === 11 && d.COT_THEO_MAU['co-ban'].length === 4, 'Cơ bản 4 cột · Theo dõi SOS 11 cột (mockup 5)');
    assert(d.cotXuatDs('co-ban', null).join() === d.COT_THEO_MAU['co-ban'].join(), 'không chọn = cột của mẫu');
    assert(d.cotXuatDs('co-ban', ['target', 'ten', 'lạ']).join() === 'ten,target', 'chỉ khoá hợp lệ, giữ thứ tự chuẩn');
    const hv = (o: any) => ({ ten: 'A', gmail: null, lop: 'MB FT 101', coSo: 'Monbay', sos: null, tamChinh: null, mt: null, kyNang: null, caseTt: null, paTt: null, phuTrach: null,
      diem: { OVR: null, L: 6, R: null, W1: null, W2: null, S: null }, target: null, lichThi: null, tuanThi: null, ketQua: null, ketLuan: null, ghiChuHop: null, ...o });
    const b = d.bangXuatDanhSach([hv({}), hv({ ten: '=cmd', gmail: 'a@x' })], ['ten', 'gmail', 'diem']);
    assert(b[0].join() === 'Tên học sinh,Gmail,OVR,L,R,W1,W2,S', b[0].join());
    assert(b.length === 3 && b[1][1] === null && b[1][2] === null && b[1][3] === 6 && b[2][0] === '=cmd', 'thiếu = null (không 0); chữ giữ nguyên');
  });

  // ------------------------------------------------------------------ 2 · Lịch thi
  await checkAsync('F15-3 · GET lich-thi: em có tháng chọn + em chưa có dự kiến; không lẫn tháng khác; quyền sửa theo vai', async () => {
    const l = lop();
    const a = em(l, 'Bùi Thảo Vy', { month: M1 }), b = em(l, 'Hoàng Bảo Ngọc', { month: M2 }), c = em(l, 'Tạ Minh Quân', { date: `${M1}-14` }), n = em(l, 'Dương Tuấn Kiên');
    await voiMayChu(async (goi) => {
      const r = await json(await goi(QL, `/hoc-vien-lop/lich-thi?thang=${M1}&q=${encodeURIComponent('MB F15')}`));
      const ten = r.rows.map((x: any) => x.ten);
      assert(ten.includes('Bùi Thảo Vy') && ten.includes('Tạ Minh Quân') && ten.includes('Dương Tuấn Kiên') && !ten.includes('Hoàng Bảo Ngọc'), ten.join('|'));
      const ra = r.rows.find((x: any) => x.studentId === a.sid), rc = r.rows.find((x: any) => x.studentId === c.sid), rn = r.rows.find((x: any) => x.studentId === n.sid);
      assert(ra.thangDuKien === M1 && ra.ketLuan === null && !ra.chuaCo && ra.coTheSua === true, JSON.stringify(ra));
      assert(rc.coNgay === true && rc.ketLuan === 'chot-ngay' && rc.thangDuKien === M1, 'có ngày = Chốt ngày');
      assert(rn.chuaCo === true && rn.cycleId === n.cy, 'chưa có dự kiến vào nhóm riêng');
      const hai = await json(await goi(QL, `/hoc-vien-lop/lich-thi?thang=${M1},${M2}&q=${encodeURIComponent('MB F15')}`));
      assert(hai.rows.some((x: any) => x.studentId === b.sid), 'nhiều tháng cùng lúc');
      /* GV không phụ trách em → xem được (nếu trong phạm vi) nhưng không sửa; Admin chi nhánh sửa được (cột Dự kiến thi). */
      const e = await loi(await goi(GV, `/hoc-vien-lop/lich-thi/${a.cy}`, put({ ketLuan: 'giu-thang' })));
      assert(e.status === 403, `GV không phụ trách: ${JSON.stringify(e)}`);
    });
  });

  await checkAsync('F15-4 · Lưu kết luận: Chốt ngày / Chuyển tháng ghi vào lịch chuẩn; Giữ tháng / Cần xác nhận ghi nhật ký (không đổi lịch); ghi chú giữ kết luận', async () => {
    const l = lop();
    const a = em(l, 'Lương Bảo Anh', { month: M1 }), b = em(l, 'Đinh Gia Huy', { month: M1 }), c = em(l, 'Mạc Đức Long', { month: M1 }), n = em(l, 'Phan Gia Bảo');
    const cuaEm = (cy: number) => one(`SELECT exam_month, exam_date FROM learning_cycles WHERE id = ?`, cy);
    await voiMayChu(async (goi) => {
      const dong = async (sid: number, thang = M1) => (await json(await goi(QL, `/hoc-vien-lop/lich-thi?thang=${thang}&q=${encodeURIComponent('MB F15')}`))).rows.find((x: any) => x.studentId === sid);
      /* Chốt ngày */
      const r1 = await json(await goi(QL, `/hoc-vien-lop/lich-thi/${a.cy}`, put({ ketLuan: 'chot-ngay', ngay: `${M1}-21` })));
      assert(r1.coNgay && r1.ketLuan === 'chot-ngay', JSON.stringify(r1));
      const ca = cuaEm(a.cy);
      assert(ca.exam_date === `${M1}-21` && ca.exam_month === M1, JSON.stringify(ca));
      assert((await dong(a.sid)).ketLuan === 'chot-ngay', 'đọc lại: chốt ngày');
      /* Chuyển tháng */
      await json(await goi(QL, `/hoc-vien-lop/lich-thi/${b.cy}`, put({ ketLuan: 'chuyen-thang', thang: M3 })));
      assert(cuaEm(b.cy).exam_month === M3, 'tháng mới vào lịch chuẩn');
      assert(!(await dong(b.sid)), 'rời danh sách tháng cũ');
      assert((await dong(b.sid, M3))?.thangDuKien === M3, 'vào danh sách tháng mới');
      /* Giữ tháng: lịch không đổi, nhật ký có; ghi chú sau đó giữ kết luận */
      const g = await json(await goi(QL, `/hoc-vien-lop/lich-thi/${c.cy}`, put({ ketLuan: 'giu-thang' })));
      assert(g.ketLuan === 'giu-thang' && cuaEm(c.cy).exam_month === M1 && cuaEm(c.cy).exam_date === null, JSON.stringify(g));
      assert(all(`SELECT 1 FROM audit_logs WHERE entity_type = 'lich_thi' AND entity_id = ?`, c.cy).length === 1, 'một dòng nhật ký (chỉ là nhật ký)');
      const cc = one(`SELECT lich_thi_ket_luan, lich_thi_thang, lich_thi_ghi_chu FROM learning_cycles WHERE id = ?`, c.cy);
      assert(cc.lich_thi_ket_luan === 'giu-thang' && cc.lich_thi_thang === M1 && cc.lich_thi_ghi_chu === null, `trạng thái nằm ở cột lộ trình: ${JSON.stringify(cc)}`);
      await json(await goi(QL, `/hoc-vien-lop/lich-thi/${c.cy}`, put({ ghiChu: 'Đăng ký IDP trước 30/10' })));
      const rc = await dong(c.sid);
      assert(rc.ketLuan === 'giu-thang' && rc.luu.ghiChu === 'Đăng ký IDP trước 30/10' && rc.luu.ai, `ghi chú giữ kết luận: ${JSON.stringify(rc.luu)}`);
      const gc = one(`SELECT lich_thi_ghi_chu, lich_thi_ghi_chu_boi, lich_thi_ghi_chu_luc FROM learning_cycles WHERE id = ?`, c.cy);
      assert(gc.lich_thi_ghi_chu === 'Đăng ký IDP trước 30/10' && gc.lich_thi_ghi_chu_boi === QL && !!gc.lich_thi_ghi_chu_luc, `người / lúc ghi chú: ${JSON.stringify(gc)}`);
      /* Cần xác nhận → rồi đổi tháng ở nơi khác thì là lần rà mới */
      await json(await goi(QL, `/hoc-vien-lop/lich-thi/${c.cy}`, put({ ketLuan: 'can-xac-nhan' })));
      assert((await dong(c.sid)).ketLuan === 'can-xac-nhan', 'cần xác nhận');
      conn.prepare(`UPDATE learning_cycles SET exam_month = ? WHERE id = ?`).run(M2, c.cy);
      assert((await dong(c.sid, M2)).ketLuan === null, 'đã dời tháng = chưa rà lại');
      /* Đặt tháng cho em chưa có dự kiến = Chuyển tháng không có tháng cũ */
      await json(await goi(QL, `/hoc-vien-lop/lich-thi/${n.cy}`, put({ ketLuan: 'chuyen-thang', thang: M2 })));
      assert(cuaEm(n.cy).exam_month === M2, 'đặt tháng');
      /* Sai: thiếu ngày, ngày sai, kết luận lạ, rỗng */
      for (const [body, re] of [[{ ketLuan: 'chot-ngay' }, /ngày/i], [{ ketLuan: 'chot-ngay', ngay: '2026-02-30' }, /.+/], [{ ketLuan: 'bay' }, /không hợp lệ/], [{}, /Chọn/]] as const) {
        const e = await loi(await goi(QL, `/hoc-vien-lop/lich-thi/${a.cy}`, put(body)));
        assert(e.status === 400 && re.test(e.error), `${JSON.stringify(body)} → ${JSON.stringify(e)}`);
      }
      assert((await loi(await goi(QL, `/hoc-vien-lop/lich-thi/99999999`, put({ ketLuan: 'giu-thang' })))).status === 404, 'lộ trình lạ → 404');
    });
  });

  await checkAsync('F15-5 · Lịch thi theo vai: Admin chi nhánh sửa được dự kiến thi; GVCN của lớp sửa được; em lưu trữ bị chặn', async () => {
    const l = lop();
    const a = em(l, 'Kiều Thu Trang', { month: M1 }), b = em(l, 'Trịnh Mai Anh', { month: M1 });
    const gvcn = nguoi('teacher', ['MB']);
    conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,NULL,1,'2026-01-01','active',?)`).run(gvcn, l, NOW);
    await voiMayChu(async (goi) => {
      const x = await json(await goi(ADMIN, `/hoc-vien-lop/lich-thi/${a.cy}`, put({ ketLuan: 'chuyen-thang', thang: M2 })));
      assert(x.thangDuKien === M2, 'Admin sửa được (cùng quyền cột Dự kiến thi)');
      const y = await json(await goi(gvcn, `/hoc-vien-lop/lich-thi/${b.cy}`, put({ ketLuan: 'can-xac-nhan' })));
      assert(y.ketLuan === 'can-xac-nhan', 'GVCN của lớp sửa được');
      const r = await json(await goi(gvcn, `/hoc-vien-lop/lich-thi?thang=${M1}`));
      assert(r.rows.every((z: any) => z.coTheSua === true || z.coTheSua === false), 'có cờ quyền ở mọi hàng');
      conn.prepare(`UPDATE students SET archived_at = ? WHERE id = ?`).run(NOW, b.sid);
      const e = await loi(await goi(QL, `/hoc-vien-lop/lich-thi/${b.cy}`, put({ ketLuan: 'giu-thang' })));
      assert(e.status === 400, `lưu trữ khoá: ${JSON.stringify(e)}`);
      /* Ngoài phạm vi: QL chi nhánh khác và TVV chi nhánh khác không sửa được lịch thi của em chi nhánh này. */
      const tvvCp = nguoi('consultant', ['CP']);
      for (const [ai, ten] of [[P.cpManager.userId as number, 'QL CP'], [tvvCp, 'TVV CP']] as const) {
        const x = await loi(await goi(ai, `/hoc-vien-lop/lich-thi/${a.cy}`, put({ ketLuan: 'can-xac-nhan' })));
        assert(x.status === 403, `${ten} sửa em chi nhánh khác → 403: ${JSON.stringify(x)}`);
      }
    });
  });

  // ------------------------------------------------------------------ 3 · Xuất danh sách
  await checkAsync('F15-6 · POST /hoc-vien-lop/xuat: một hàng một em, mẫu cột, em học hai lớp ghi cả hai, xem trước không ghi nhật ký, 0 em / ngoài phạm vi bị chặn', async () => {
    const l1 = lop(), l2 = lop();
    const a = em(l1, 'Nguyễn Hữu Phát', { email: 'phat.nh@pisa.edu.vn', month: M1 }), b = em(l1, '=HYPERLINK("x")');
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(a.sid, l2, TODAY, NOW);
    await voiMayChu(async (goi) => {
      const truoc = all(`SELECT 1 FROM audit_logs WHERE action = 'hoc_vien.xuat_excel'`).length;
      const x = await json(await goi(QL, '/hoc-vien-lop/xuat', post({ ids: [a.sid, b.sid, a.sid], mau: 'theo-doi-sos', boLoc: 'Đang SOS · Monbay', xemTruoc: true })));
      assert(x.dem.hocVien === 2 && x.sheets[0].aoa.length === 3, `một hàng một em: ${x.sheets[0].aoa.length}`);
      assert(x.sheets[0].aoa[0].length === 11 && x.sheets[0].aoa[0][0] === 'Tên học sinh', x.sheets[0].aoa[0].join());
      const ha = x.sheets[0].aoa.find((r: any[]) => r[0] === 'Nguyễn Hữu Phát');
      assert(ha[1] === 'phat.nh@pisa.edu.vn' && /→/.test(ha[2]) && ha[2].includes('F15'), `Gmail + Lớp ghi cả hai: ${JSON.stringify(ha)}`);
      assert(x.sheets[0].aoa.some((r: any[]) => r[0] === '=HYPERLINK("x")'), 'chữ người nhập giữ nguyên (web ghi ô kiểu chữ)');
      assert(x.sheets[1].ten === 'Thông tin xuất' && x.sheets[1].aoa.some((r: any[]) => r[0] === 'Số học viên' && r[1] === 2), 'sheet Thông tin xuất');
      assert(/^PISA_HV_.+_\d{4}-\d{2}-\d{2}\.xlsx$/.test(x.tenTep), x.tenTep);
      assert(all(`SELECT 1 FROM audit_logs WHERE action = 'hoc_vien.xuat_excel'`).length === truoc, 'xem trước không ghi nhật ký');
      const y = await json(await goi(QL, '/hoc-vien-lop/xuat', post({ ids: [a.sid], mau: 'co-ban', cot: ['ten', 'target'], boLoc: 'Tất cả', pham: 'chon' })));
      assert(y.sheets[0].aoa[0].join() === 'Tên học sinh,Target' && y.sheets[0].aoa[1][1] === '6.5', `chọn cột: ${JSON.stringify(y.sheets[0].aoa)}`);
      assert(all(`SELECT 1 FROM audit_logs WHERE action = 'hoc_vien.xuat_excel'`).length === truoc + 1, 'tải thật ghi nhật ký');
      await json(await goi(QL, `/hoc-vien-lop/lich-thi/${a.cy}`, put({ ketLuan: 'giu-thang', ghiChu: 'Chờ phụ huynh' })));
      const z = await json(await goi(QL, '/hoc-vien-lop/xuat', post({ ids: [a.sid], mau: 'co-ban', cot: ['ten', 'lichThi', 'ketLuan', 'ghiChuHop'], xemTruoc: true })));
      const hz = z.sheets[0].aoa[1];
      assert(hz[0] === 'Nguyễn Hữu Phát' && /\d{2}\/\d{4}|NOV|MAR|APR|MAY/i.test(String(hz[1])) && hz[2] === 'Giữ tháng' && hz[3] === 'Chờ phụ huynh', `Lịch thi + kết luận + ghi chú: ${JSON.stringify(hz)}`);
      assert((await loi(await goi(QL, '/hoc-vien-lop/xuat', post({ ids: [], mau: 'co-ban' })))).status === 400, '0 em → không có tệp');
      assert((await loi(await goi(QL, '/hoc-vien-lop/xuat', post({ ids: [a.sid], mau: 'la' })))).status === 400, 'mẫu lạ');
      const cp = one(`SELECT s.id FROM students s JOIN enrollments e ON e.student_id = s.id JOIN classes c ON c.id = e.class_id JOIN branches br ON br.id = c.branch_id WHERE br.code = 'CP' AND e.status = 'active' LIMIT 1`);
      if (cp) assert((await loi(await goi(QL, '/hoc-vien-lop/xuat', post({ ids: [a.sid, cp.id], mau: 'co-ban' })))).status === 403, 'em ngoài phạm vi → 403');
    });
  });

  await checkAsync('F15-7 · Xuất mẫu Theo dõi SOS / Kết quả thi: mức SOS, kỹ năng, điểm, Đạt / Chưa đạt dùng cùng nguồn trang', async () => {
    const l = lop();
    const a = em(l, 'Phạm Đức Anh');
    const dot = Number(conn.prepare(`INSERT INTO assessment_attempts (student_id, cycle_id, class_id, kind, attempt_no, status, planned_period_id, created_at) VALUES (?,?,?, 'mock', 1, 'done', ?, ?)`)
      .run(a.sid, a.cy, l, tuan(addDays(T2, -7)), NOW).lastInsertRowid);
    for (const [k, v] of [['listening', 6], ['reading', 6.5], ['writing1', 5.5], ['writing2', 5.5], ['speaking', 6]] as const) {
      conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, band, entered_at) VALUES (?,?,?,?)`).run(dot, k, v, NOW);
    }
    await voiMayChu(async (goi) => {
      const x = await json(await goi(QL, '/hoc-vien-lop/xuat', post({ ids: [a.sid], mau: 'ket-qua-thi', boLoc: 'Tất cả', xemTruoc: true })));
      const [dau, dong] = x.sheets[0].aoa;
      assert(dau.join() === 'Tên học sinh,Gmail,Lớp,MT liên quan,Tuần thi,OVR,L,R,W1,W2,S,Target,Kết quả', dau.join());
      assert(dong[dau.indexOf('L')] === 6 && dong[dau.indexOf('R')] === 6.5 && dong[dau.indexOf('W1')] === 5.5, JSON.stringify(dong));
      assert(['Đạt', 'Chưa đạt', 'Chưa đủ điểm'].includes(dong[dau.indexOf('Kết quả')]), `kết quả: ${dong[dau.indexOf('Kết quả')]}`);
      assert(dong[dau.indexOf('Target')] === '6.5', 'Target');
    });
  });

  await checkAsync('F15-8 · Lịch thi gồm cả lớp thường (em có tháng); nhóm "Chưa có dự kiến" chỉ em FT', async () => {
    const thuong = one(`SELECT c.id FROM classes c JOIN programmes pg ON pg.code = c.programme_code WHERE pg.scoring_mode = 'ratio' AND c.status = 'active' AND c.branch_id = ? LIMIT 1`, MB)?.id as number | undefined;
    assert(thuong, 'seed có lớp thường MB');
    const coThang = em(thuong!, 'Võ Thường Có Tháng', { month: M3 });
    const khong = em(thuong!, 'Võ Thường Không Dự Kiến');
    const ft = em(lop(), 'Võ FT Không Dự Kiến');
    await voiMayChu(async (goi) => {
      const r = await json(await goi(QL, `/hoc-vien-lop/lich-thi?thang=${M3}`));
      const rc = r.rows.find((x: any) => x.studentId === coThang.sid);
      assert(rc && rc.thuong === true && rc.thangDuKien === M3 && !rc.chuaCo, `lớp thường có tháng vào danh sách: ${JSON.stringify(rc)}`);
      assert(!r.rows.some((x: any) => x.studentId === khong.sid), 'lớp thường chưa có dự kiến KHÔNG vào nhóm "Chưa có"');
      assert(r.rows.some((x: any) => x.studentId === ft.sid && x.chuaCo), 'em FT chưa có dự kiến vào nhóm "Chưa có"');
      const s = await json(await goi(QL, `/hoc-vien-lop/lich-thi/${coThang.cy}`, put({ ketLuan: 'giu-thang' })));
      assert(s.ketLuan === 'giu-thang', 'lớp thường lưu được kết luận');
    });
  });

  await checkAsync('F15-9 · Xuất "Theo dõi SOS" lấy cột SOS từ CHÍNH danh sách Đang SOS (lượt mới nhất, cả lớp thường) + Case chỉ của các em trong tệp', async () => {
    await voiMayChu(async (goi) => {
      const t = await json(await goi(QL, '/hoc-vien-lop?goc=sos&tuan=tat-ca'));
      const moiNhat = new Map<number, any>();
      for (const r of t.rows) { const cu = moiNhat.get(r.studentId); if (!cu || r.tuan > cu.tuan) moiNhat.set(r.studentId, r); }
      assert(moiNhat.size > 0, 'bộ demo có em SOS');
      const mau = [...moiNhat.values()].filter((r) => r.ft).slice(0, 2).concat([...moiNhat.values()].filter((r) => !r.ft).slice(0, 1));
      assert(mau.some((r) => !r.ft), 'có em lớp thường SOS để kiểm');
      const x = await json(await goi(QL, '/hoc-vien-lop/xuat', post({ ids: mau.map((r) => r.studentId), mau: 'theo-doi-sos', boLoc: 'Đang SOS', xemTruoc: true, sos: { tuan: 'tat-ca' } })));
      const [dau, ...dong] = x.sheets[0].aoa;
      const k = (ten: string) => dau.indexOf(ten);
      for (const r of mau) {
        const h = dong.find((z: any[]) => z[k('Tên học sinh')] === r.ten);
        assert(h, `thiếu em ${r.ten}`);
        assert(h[k('Mức SOS')] === `SOS ${r.sosLevel}` && h[k('MT liên quan')] === r.luot, `${r.ten}: ${h[k('Mức SOS')]} / ${h[k('MT liên quan')]} ≠ SOS ${r.sosLevel} / ${r.luot}`);
        assert(h[k('Tạm / Chính thức')] === (r.tam ? 'Tạm' : 'Chính thức'), `${r.ten}: tạm / chính thức`);
        assert((h[k('Kỹ năng cần xử lý')] ?? '') !== '' || r.kyNang.length === 0, `${r.ten}: kỹ năng`);
        if (r.cases.some((c: any) => !c.done)) assert(!!h[k('Trạng thái Case')], `${r.ten}: có Case mở thì có trạng thái Case`);
      }
      /* Em không có lượt SOS trong bộ lọc → để trống (không tự tính SOS riêng cho tệp). */
      const ngoai = one(`SELECT s.id FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active' JOIN classes c ON c.id = e.class_id WHERE c.branch_id = ? ORDER BY s.id DESC LIMIT 1`, MB).id as number;
      if (!moiNhat.has(ngoai)) {
        const y = await json(await goi(QL, '/hoc-vien-lop/xuat', post({ ids: [ngoai], mau: 'theo-doi-sos', xemTruoc: true, sos: { tuan: 'tat-ca' } })));
        assert(y.sheets[0].aoa[1][y.sheets[0].aoa[0].indexOf('Mức SOS')] === null, 'em không SOS → ô trống');
      }
    });
  });

  check('F15-10 · migrate prOv15f: thêm đúng 5 cột NULL trên learning_cycles giống schema.sql; chạy lần hai không làm gì', () => {
    const tam = new Database(':memory:');
    tam.exec('CREATE TABLE learning_cycles (id INTEGER PRIMARY KEY)');
    const ap: string[] = [];
    m15f.themCotPrOv15f(tam, ap);
    m15f.themCotPrOv15f(tam, ap);
    assert(ap.length === 1, JSON.stringify(ap));
    const cot = (c: any) => c.prepare(`SELECT name, type, "notnull" AS nn, dflt_value AS dv FROM pragma_table_info('learning_cycles') WHERE name LIKE 'lich_thi_%' ORDER BY name`).all().map((x: any) => `${x.name}:${x.type}:${x.nn}:${x.dv}`).join(',');
    assert(cot(tam) === cot(conn) && cot(conn).split(',').length === 5, `${cot(tam)} ≠ ${cot(conn)}`);
    tam.close();
  });
}
