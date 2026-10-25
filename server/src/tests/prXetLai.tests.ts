/**
 * PHÉP KIỂM P9a XET-LAI — Xét lại lộ trình (plan.md 1.6 N21, kế hoạch `docs/superpowers/plans/2026-10-25-p9a-xet-lai.md`).
 * XL-1 luật thuần · XL-2 migrate thẻ Mini Test · XL-3 GET panel = việc · XL-4 POST lô · XL-5 tự giữ + Hoàn tác · XL-6 tốc độ.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrXetLaiTests(t: YThucTestKit) {
  const { check, checkAsync, assert, conn, P, TODAY, addDays } = t;
  console.log('\nP9a XET-LAI · Xét lại lộ trình (4 trường hợp, hạn, panel, tự giữ)');
  const d: any = await import('../../../shared/domain/index.ts');
  const week: any = await import('../platform/week.ts');
  const intake: any = await import('../classes/intake.ts');
  const regular: any = await import('../normal/regular.ts');
  const lenh: any = await import('../classes/lenhChuyen.ts');
  const ck: any = await import('../normal/cuoiKhoa.ts');
  const xl: any = await import('../normal/xetLai.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const mig: any = await import('../migrate/prXetLai.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { createApp } = await import('../app.ts');
  const { getConfig, setConfig } = await import('../demoConfig.ts');
  const { trongBoNho } = await import('../platform/nguCanhRequest.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const QL = P.mbManager;
  const MB = get(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const CP = get(`SELECT id FROM branches WHERE code = 'CP'`).id as number;
  const NOW = new Date().toISOString();
  const TRUOC = new Date(Date.now() - 3_600_000).toISOString();   // điểm Final nhập trước mọi quyết định của phép kiểm
  const THU_HAI = (d.tuanChonDuoc(TODAY) as string[])[0];
  const NGAY_FINAL = addDays(TODAY, -5);

  let seq = 0;
  const lop = (kind: 'FOU' | 'BE' | 'FT', tuan = 1, branchId = MB) => {
    seq += 1;
    const start = addDays(week.mondayOf(TODAY), -7 * (tuan - 1));
    const c = intake.createClass(P.admin, {
      code: `${get('SELECT code FROM branches WHERE id = ?', branchId).code} XL-${seq} ${kind}`, branchId, kind, isFastTrack: kind === 'FT', route: kind === 'FT' ? 'LT1' : null,
      startDate: start, startPeriodId: week.ensurePeriod(start).id,
    });
    return { id: c.id as number, code: c.code as string };
  };
  const ganGv = (classId: number, n: number, core: boolean) => {
    const uid = get(`SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'teacher' AND ur.branch_id = ? ORDER BY ur.user_id LIMIT 1 OFFSET ?`, MB, n).id as number;
    conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,?,?, '2026-01-01', 'active', ?)`)
      .run(uid, classId, core ? null : 'reading', core ? 1 : 0, NOW);
    return loadPrincipal(uid);
  };
  const BE_D = lop('BE', 1);
  const FOU_D = lop('FOU', 1);
  const FOU_CP = lop('FOU', 1, CP);
  const GVCN_BE = ganGv(BE_D.id, 3, true);
  const GVBM_BE = ganGv(BE_D.id, 4, false);
  const lenhCua = (sid: number) => get('SELECT * FROM lenh_chuyen_lop WHERE student_id = ? ORDER BY id DESC LIMIT 1', sid);
  /**
   * Em FOU tuần 8 có Final `pct` % (mọi môn, nhập trước NGAY_FINAL) → lệnh Cuối khoá `huong` (ra ngày `ngayRa`). `thiHanh` → "Ngay hôm nay" (đã ở lớp mới).
   */
  const kb = (pct: number, huong: 'len_lop' | 'hoc_lai' = 'len_lop', o: { ngayRa?: string; thiHanh?: boolean } = {}) => {
    const fou = lop('FOU', 8);
    seq += 1;
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-XL${seq}`, `Học viên XL${seq}`, `hoc vien xl${seq}`, MB, NOW).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, fou.id, addDays(week.mondayOf(TODAY), -49), NOW);
    conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, start_period_id, started_at, status, created_at) VALUES (?,1,NULL,'FOU',6,?,?, 'active', ?)`)
      .run(sid, week.ensurePeriod(addDays(week.mondayOf(TODAY), -49)).id, addDays(week.mondayOf(TODAY), -49), NOW);
    regular.planRegularTests(P.admin, fou.id, { studentIds: [sid], kinds: ['final'] });
    const fid = get(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'final' ORDER BY id DESC LIMIT 1`, sid).id as number;
    for (const sk of regular.allProgrammes().get('FOU').skills as string[]) {
      conn.prepare('INSERT INTO assessment_scores (attempt_id, skill, raw_score, raw_total, entered_at, nhap_dau_ngay) VALUES (?,?,?,100,?,?)').run(fid, sk, pct, TRUOC, NGAY_FINAL);
    }
    const r = lenh.raLenh(QL, { lopNguonId: fou.id, boiCanh: 'cuoi-khoa', tuanChung: o.thiHanh ? TODAY : THU_HAI, dongs: [{ studentId: sid, huong, toClassId: huong === 'hoc_lai' ? FOU_D.id : BE_D.id, lyDo: 'XL' }] });
    assert(!r.failed.length, `raLenh: ${JSON.stringify(r.failed)}`);
    conn.prepare('UPDATE lenh_chuyen_lop SET ngay_ra_lenh = ? WHERE student_id = ?').run(o.ngayRa ?? addDays(TODAY, -12), sid);
    if (o.thiHanh) assert(lenhCua(sid).trang_thai === 'da_chuyen', `thi hành: ${JSON.stringify(lenhCua(sid))}`);
    return { sid, fid, fou };
  };
  const dong = (sid: number, today = TODAY) => trongBoNho(() => (xl.tapXetLai(today) as any[]).find((e) => e.studentId === sid));
  const viec = (p: any, lopId: number) => trongBoNho(() => (mywork.myWork(p, {}).groups.flatMap((g: any) => g.items) as any[]).find((it) => it.key === `xetlai:${lopId}`));
  async function voiMayChu(fn: (goi: (userId: number, url: string, init?: RequestInit) => Promise<Response>) => Promise<void>) {
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
    try { await fn(goi); } finally { may.close(); }
  }

  check('XL-1 · lyDoXetLai (a)–(d) + biên 0.4999 / 0.5 / 0.5999 / 0.6 / Mini Test 0.7, lệnh trước / sau Final, đã quyết; hanXetLai 3 trường hợp', () => {
    const FINAL = '2026-09-24T03:00:00.000Z';
    const vao = (o: any) => ({ huong: 'len_lop', tyLe: 0.46, du: true, ngayRaLenh: '2026-09-16', mocFinal: FINAL, ngayFinal: '2026-09-24', miniTest: null, quyetLuc: null, ...o });
    const ma = (o: any) => d.lyDoXetLai(vao(o))?.ma ?? null;
    const ca: [any, string | null][] = [
      [{ tyLe: 0.4999 }, 'a'], [{ huong: 'fast_track', tyLe: 0.4999 }, 'a'], [{ tyLe: 0.4999, ngayRaLenh: '2026-09-25' }, 'a'],
      [{ tyLe: 0.5 }, 'b'], [{ tyLe: 0.5999 }, 'b'], [{ tyLe: 0.6 }, null], [{ tyLe: 0.55, ngayRaLenh: '2026-09-25' }, null],
      [{ tyLe: 0.55, ngayRaLenh: '2026-09-24' }, null],   // chốt cùng ngày Final đủ điểm = đã thấy Final
      [{ tyLe: 0.55, ngayFinal: null }, null],
      [{ huong: 'fast_track', tyLe: 0.55 }, 'b'],
      [{ huong: 'hoc_lai', tyLe: 0.5999 }, null], [{ huong: 'hoc_lai', tyLe: 0.6 }, 'c'], [{ huong: 'hoc_lai', tyLe: 0.95 }, 'c'],
      [{ huong: 'bao_luu', tyLe: 0.1 }, null], [{ tyLe: 0.3, du: false }, null], [{ tyLe: null, du: false }, null],
      [{ tyLe: 0.62, miniTest: { tyLe: 0.69, luc: '2026-10-09T05:00:00.000Z' } }, 'd'], [{ tyLe: 0.62, miniTest: { tyLe: 0.7, luc: '2026-10-09T05:00:00.000Z' } }, null],
      /* Đã quyết sau mốc → null; quyết trước Mini Test → dòng (d) mới. */
      [{ quyetLuc: '2026-10-01T02:00:00.000Z' }, null],
      [{ tyLe: 0.55, quyetLuc: '2026-10-01T02:00:00.000Z', miniTest: { tyLe: 0.55, luc: '2026-10-09T05:00:00.000Z' } }, 'd'],
      [{ tyLe: 0.55, quyetLuc: '2026-10-10T02:00:00.000Z', miniTest: { tyLe: 0.55, luc: '2026-10-09T05:00:00.000Z' } }, null],
      [{ quyetLuc: '2026-09-20T02:00:00.000Z' }, 'a'],   // quyết trước Final (sửa điểm sau) → vẫn dòng
    ];
    for (const [o, mong] of ca) assert(ma(o) === mong, `${JSON.stringify(o)} → ${ma(o)} (mong ${mong})`);
    const chu = (o: any) => d.lyDoXetLai(vao(o)).chu;
    assert(chu({ tyLe: 0.4999 }) === 'Final 49 % · đã cho lên' && chu({ tyLe: 0.55 }) === 'Final 55 % · chốt trước Final'
      && chu({ huong: 'hoc_lai', tyLe: 0.64 }) === 'Final 64 % · đang học lại' && chu({ tyLe: 0.62, miniTest: { tyLe: 0.55, luc: '2026-10-09' } }) === 'Mini Test 55 % · cần ≥ 70 %',
    'chữ lý do');
    assert(d.chuTyLeXetLai(0.4996) === '49 %' && d.chuTyLeXetLai(0.7) === '70 %', 'chuTyLeXetLai làm tròn xuống');
    /* Hạn: (a)(b)(c) hết CN tuần 2 kể từ tuần bắt đầu lớp mới (lệnh chưa thi hành: cùng công thức = CN tuần thi hành + 1); Final muộn hơn → ít nhất hết CN tuần đó. (d) CN tuần sau ngày ghi. */
    const han = (ma: string, tuanBatDau: string, moc: string) => d.hanXetLai({ ma, tuanBatDau, moc });
    assert(han('a', '2026-09-28', FINAL) === '2026-10-11', `a: ${han('a', '2026-09-28', FINAL)}`);
    assert(han('b', '2026-09-30', FINAL) === '2026-10-11', `Ngay hôm nay T4: ${han('b', '2026-09-30', FINAL)}`);
    assert(han('c', '2026-09-28', '2026-10-14T01:00:00.000Z') === '2026-10-18', `Final muộn: ${han('c', '2026-09-28', '2026-10-14')}`);
    assert(han('d', '2026-09-28', '2026-10-09T05:00:00.000Z') === '2026-10-18', `d: ${han('d', '2026-09-28', '2026-10-09')}`);
    assert(han('d', '2026-09-28', '2026-10-11') === '2026-10-18', 'd: ghi CN → CN tuần sau');
  });

  // ---------------------------------------------------------------- XL-2 · migrate
  check('XL-2 · migrate: thẻ "Mini Test chưa đạt" đang chờ → đóng (tu_dong), bảng có sẵn; chạy hai lần không đổi gì thêm', () => {
    const sid = get('SELECT id FROM students ORDER BY id LIMIT 1').id;
    const id = Number(conn.prepare(`INSERT INTO yeu_cau_duyet (loai, phan_loai, doi_tuong_loai, doi_tuong_id, hoc_vien_id, trang_thai, tao_luc) VALUES ('bao_len_mini_test', 'bao-len', 'mini_test', 999001, ?, 'cho', ?)`)
      .run(sid, NOW).lastInsertRowid);
    const a1: string[] = [], a2: string[] = [];
    mig.migratePrXetLai(conn, a1);
    const y = get('SELECT trang_thai, ly_do_dong FROM yeu_cau_duyet WHERE id = ?', id);
    assert(y.trang_thai === 'tu_dong' && /Xét lại/.test(y.ly_do_dong), JSON.stringify(y));
    assert(a1.some((x) => /thẻ "Mini Test chưa đạt"/.test(x)) && !a1.some((x) => /bảng/.test(x)), `lần 1: ${JSON.stringify(a1)}`);
    mig.migratePrXetLai(conn, a2);
    assert(!a2.length, `lần 2: ${JSON.stringify(a2)}`);
  });

  // ---------------------------------------------------------------- XL-3 · tập em = việc = GET
  const A = kb(46, 'len_lop', { thiHanh: true });                         // (a) đã ở BE_D
  const B = kb(55, 'len_lop', { thiHanh: true });                         // (b) chốt 12 ngày trước Final
  const B2 = kb(55, 'len_lop', { thiHanh: true, ngayRa: addDays(TODAY, -4) });   // chốt SAU Final → không dòng
  const C = kb(64, 'hoc_lai', { thiHanh: true });                         // (c) đang học lại ở FOU_D
  const CHO = kb(40, 'len_lop');                                          // lệnh chưa thi hành → dòng ở lớp CŨ

  check('XL-3 · tập em (a)(b)(c) + lệnh chưa thi hành ở lớp cũ; chốt sau Final không dòng; việc QL = số dòng GET, hạn, nút "Xét lại ›"; QL CP / GVCN / GVBM không việc', () => {
    for (const [x, ma, lopId] of [[A, 'a', BE_D.id], [B, 'b', BE_D.id], [C, 'c', FOU_D.id], [CHO, 'a', CHO.fou.id]] as const) {
      const e = dong(x.sid);
      assert(e?.lyDo.ma === ma && e.lopHienTai.id === lopId, `${ma}: ${JSON.stringify(e && { lyDo: e.lyDo, lop: e.lopHienTai })}`);
    }
    assert(!dong(B2.sid), 'chốt sau Final: không dòng');
    const e = dong(A.sid);
    assert(e.han === addDays(TODAY, 13) && e.daThiHanh && e.final.mon.length === 4 && e.final.mon.every((m: any) => m.pt === 46 && !m.dat), `A: ${JSON.stringify(e)}`);
    assert(e.daChot.chu === 'Lên BE' && e.daChot.luc === addDays(TODAY, -12) && e.goiY === 'Học lại FOU' && e.lyDo.chu === 'Final 46 % · đã cho lên', `A daChot: ${JSON.stringify(e.daChot)} ${e.goiY}`);
    assert(dong(CHO.sid).han === addDays(THU_HAI, 13) && !dong(CHO.sid).daThiHanh, `CHO: ${JSON.stringify(dong(CHO.sid))}`);
    const eb = dong(B.sid);
    assert(eb.goiY === 'Quản lý cân nhắc' && eb.boTro && eb.boTro.tong > 0 && eb.boTro.mon.length > 0 && eb.boTro.miniTest.tyLe === null, `B bổ trợ: ${JSON.stringify(eb.boTro)}`);
    const v = viec(QL, BE_D.id);
    const g = trongBoNho(() => xl.xemXetLai(QL, BE_D.id, null));
    assert(v && v.count === g.em.length && v.count >= 2 && v.actionLabel === 'Xét lại ›' && v.href === `/hoc-vien/lop/${BE_D.id}?viec=xet-lai` && v.due === g.han
      && v.tieuDe === `Xét lại lộ trình · ${BE_D.code} · ${v.count} em` && /46 %/.test(v.contextLabel), `việc ${JSON.stringify(v)} · GET ${g.em.length} ${g.han}`);
    assert(g.lopHocLai.FOU?.some((l: any) => l.id === FOU_D.id) && !g.lopHocLai.FOU.some((l: any) => l.id === FOU_CP.id) && !g.chiXem, `lớp học lại: ${JSON.stringify(g.lopHocLai)}`);
    assert(viec(QL, CHO.fou.id)?.count === 1, 'lệnh chưa thi hành: việc ở lớp cũ');
    assert(!viec(P.cpManager, BE_D.id) && !viec(GVCN_BE, BE_D.id) && !viec(GVBM_BE, BE_D.id) && viec(P.admin, BE_D.id), 'QL CP / GVCN / GVBM không việc, QT có');
    const gv = trongBoNho(() => xl.xemXetLai(GVCN_BE, BE_D.id, null));
    assert(gv.chiXem && gv.em.length === g.em.length && !Object.keys(gv.lopHocLai).length, 'GVCN lớp mới: chỉ xem');
    assert(!trongBoNho(() => xl.xemXetLai(GVBM_BE, BE_D.id, null)).em.length && !trongBoNho(() => xl.xemXetLai(P.cpManager, BE_D.id, null)).em.length, 'GVBM / QL CP: em []');
    assert(trongBoNho(() => xl.xemXetLai(QL, BE_D.id, A.sid)).em.length === 1, '?studentId: một em');
  });

  await checkAsync('XL-3b · HTTP: GET /classes/:id/xet-lai = việc; GVCN ghi nhận xét (PUT), QL thấy; GVBM PUT 403; POST GVCN 403', async () => {
    await voiMayChu(async (goi) => {
      const r = await goi(QL.userId, `/classes/${BE_D.id}/xet-lai`);
      const j: any = await r.json();
      assert(r.status === 200 && j.em.some((e: any) => e.studentId === A.sid) && j.lop.code === BE_D.code, `${r.status} ${JSON.stringify(j).slice(0, 300)}`);
      const n = await goi(GVCN_BE.userId, `/classes/${BE_D.id}/xet-lai/${A.sid}/nhan-xet`, { method: 'PUT', body: JSON.stringify({ nhanXet: 'Theo được bài nghe, viết còn chậm' }) });
      assert(n.status === 200, `GVCN PUT ${n.status} ${await n.text()}`);
      const j2: any = await (await goi(QL.userId, `/classes/${BE_D.id}/xet-lai`)).json();
      assert(j2.em.find((e: any) => e.studentId === A.sid)?.nhanXetGvcnMoi === 'Theo được bài nghe, viết còn chậm', 'QL thấy nhận xét');
      const b = await goi(GVBM_BE.userId, `/classes/${BE_D.id}/xet-lai/${A.sid}/nhan-xet`, { method: 'PUT', body: JSON.stringify({ nhanXet: 'x' }) });
      const c = await goi(GVCN_BE.userId, `/classes/${BE_D.id}/xet-lai`, { method: 'POST', body: JSON.stringify({ items: [{ studentId: A.sid, quyetDinh: 'tiep_tuc', lyDo: 'x' }] }) });
      const q = await goi(P.cpManager.userId, `/classes/${BE_D.id}/xet-lai`, { method: 'POST', body: JSON.stringify({ items: [{ studentId: A.sid, quyetDinh: 'tiep_tuc', lyDo: 'x' }] }) });
      assert(b.status === 403 && c.status === 403 && q.status === 403, `GVBM PUT ${b.status} · GVCN POST ${c.status} · QL CP POST ${q.status}`);
    });
  });

  // ---------------------------------------------------------------- XL-4 · POST lô
  check('XL-4 · lô: (a) Tiếp tục không lý do → lỗi giữ dòng, em khác vẫn lưu; Tiếp tục (b) đóng dòng + Hành trình; Học lại lệnh chưa thi hành = SỬA lệnh (không lệnh thứ hai); Học lại lớp khác chương trình / chi nhánh → lỗi', () => {
    const r1 = xl.luuXetLai(QL, BE_D.id, [{ studentId: A.sid, quyetDinh: 'tiep_tuc' }, { studentId: B.sid, quyetDinh: 'tiep_tuc' }]);
    assert(r1.failed.length === 1 && r1.failed[0].studentId === A.sid && r1.failed[0].message === 'Ghi lý do ngắn' && r1.ok.length === 1 && r1.ok[0].studentId === B.sid, JSON.stringify(r1));
    assert(dong(A.sid) && !dong(B.sid), 'A còn dòng, B hết');
    const j = get(`SELECT title, detail FROM journey_events WHERE student_id = ? AND event_type = 'xet_lai'`, B.sid);
    assert(j?.title === 'QL xét lại: Tiếp tục BE' && /đã lên BE/.test(j.detail) && /Final 55 %/.test(j.detail), JSON.stringify(j));
    const l0 = lenhCua(CHO.sid);
    const soLenh = () => get('SELECT COUNT(*) n FROM lenh_chuyen_lop WHERE student_id = ?', CHO.sid).n;
    const n0 = soLenh();
    const sai = xl.luuXetLai(QL, CHO.fou.id, [{ studentId: CHO.sid, quyetDinh: 'hoc_lai', toClassId: FOU_CP.id, tuan: THU_HAI }]);
    assert(sai.failed.length === 1 && /cùng chi nhánh/.test(sai.failed[0].message), JSON.stringify(sai));
    const r2 = xl.luuXetLai(QL, CHO.fou.id, [{ studentId: CHO.sid, quyetDinh: 'hoc_lai', toClassId: FOU_D.id, tuan: THU_HAI }]);
    assert(!r2.failed.length, JSON.stringify(r2));
    const l1 = lenhCua(CHO.sid);
    assert(l1.id === l0.id && l1.huong === 'hoc_lai' && l1.lop_dich_id === FOU_D.id && soLenh() === n0, `sửa lệnh: ${JSON.stringify(l1)} (${soLenh()} lệnh)`);
    const e = dong(CHO.sid);
    assert(e?.quyetDinh?.quyetDinh === 'hoc_lai' && e.quyetDinh.lopDich === FOU_D.code && !viec(QL, CHO.fou.id), `đã quyết còn sửa được: ${JSON.stringify(e?.quyetDinh)}`);
  });

  check('XL-5 · Hoàn tác Học lại (lệnh chưa thi hành) → lệnh về Lên BE; Học lại em đã thi hành → lệnh giữa khoá mới, Sửa sang Tiếp tục → lệnh mới huỷ; Tạm dừng + Hoàn tác', () => {
    const id = get(`SELECT id FROM xet_lai_lo_trinh WHERE student_id = ? AND quyet_dinh = 'hoc_lai'`, CHO.sid).id;
    const h = xl.hoanTacXetLai(QL, CHO.fou.id, [id]);
    const l = lenhCua(CHO.sid);
    assert(!h.failed.length && l.huong === 'len_lop' && l.lop_dich_id === BE_D.id && l.trang_thai === 'cho' && dong(CHO.sid)?.lyDo.ma === 'a', `hoàn tác: ${JSON.stringify(h)} ${JSON.stringify(l)}`);
    assert(!get(`SELECT 1 FROM journey_events WHERE dedup_key = ?`, `xet_lai:${id}`), 'Hành trình xoá');
    /* A đã ở BE_D: Học lại → lệnh giữa khoá mới (chuyen_lop), dòng còn (sửa được). */
    const r = xl.luuXetLai(QL, BE_D.id, [{ studentId: A.sid, quyetDinh: 'hoc_lai', toClassId: FOU_D.id, tuan: THU_HAI }]);
    assert(!r.failed.length, JSON.stringify(r));
    const moi = lenhCua(A.sid);
    assert(moi.boi_canh === 'giua-khoa' && moi.huong === 'chuyen_lop' && moi.lop_dich_id === FOU_D.id && moi.trang_thai === 'cho', JSON.stringify(moi));
    const e = dong(A.sid);
    assert(e?.quyetDinh?.id === r.ok[0].id, `dòng sửa được: ${JSON.stringify(e?.quyetDinh)}`);
    const r2 = xl.luuXetLai(QL, BE_D.id, [{ studentId: A.sid, quyetDinh: 'tiep_tuc', lyDo: 'Gia đình xin thử 2 tuần', suaId: e.quyetDinh.id }]);
    assert(!r2.failed.length && get('SELECT trang_thai FROM lenh_chuyen_lop WHERE id = ?', moi.id).trang_thai === 'huy' && !dong(A.sid), `Sửa: ${JSON.stringify(r2)}`);
    /* Tạm dừng: lý do bắt buộc; Hoàn tác trả nguyên trạng. */
    const D1 = kb(45, 'len_lop', { thiHanh: true });
    const k = xl.luuXetLai(QL, BE_D.id, [{ studentId: D1.sid, quyetDinh: 'dung', trangThai: 'inactive' }]);
    assert(k.failed[0]?.message === 'Ghi lý do ngắn', JSON.stringify(k));
    const t2 = xl.luuXetLai(QL, BE_D.id, [{ studentId: D1.sid, quyetDinh: 'dung', trangThai: 'inactive', lyDo: 'Nghỉ ốm' }]);
    assert(!t2.failed.length && get('SELECT status FROM students WHERE id = ?', D1.sid).status === 'inactive' && !dong(D1.sid), JSON.stringify(t2));
    const h2 = xl.hoanTacXetLai(QL, BE_D.id, [t2.ok[0].id]);
    assert(!h2.failed.length && get('SELECT status FROM students WHERE id = ?', D1.sid).status === 'active' && dong(D1.sid)?.lyDo.ma === 'a', `hoàn tác tạm dừng: ${JSON.stringify(h2)}`);
  });

  check('XL-5b · hết hạn: CN tuần 2 còn dòng, T2 sau tự ghi "Tiếp tục" (tu_dong) một lần, chạy hai lần không trùng; em đã chuyển trước hạn → không ghi', () => {
    const han = dong(C.sid).han;
    assert(dong(C.sid, han), 'ngày hạn còn dòng');
    const D2 = kb(42, 'len_lop', { thiHanh: true });
    conn.prepare(`UPDATE students SET status = 'finished' WHERE id = ?`).run(D2.sid);   // thôi học trước hạn
    const sau = addDays(han, 1);
    const cu = getConfig('demo_date');
    setConfig('demo_date', sau);
    try {
      assert(!dong(C.sid, sau), 'quá hạn: rời tập');
      xl.quetXetLaiHetHan(sau);
      const rows = all(`SELECT * FROM xet_lai_lo_trinh WHERE student_id = ? AND tu_dong = 1`, C.sid);
      assert(rows.length === 1 && rows[0].quyet_dinh === 'tiep_tuc', `tự ghi (hai lượt quét): ${JSON.stringify(rows)}`);
      const j = get(`SELECT title FROM journey_events WHERE student_id = ? AND event_type = 'xet_lai'`, C.sid);
      assert(j?.title === 'QL xét lại: Tiếp tục FOU · tự giữ (hết hạn xét lại)', JSON.stringify(j));
      assert(!get(`SELECT 1 FROM xet_lai_lo_trinh WHERE student_id = ?`, D2.sid), 'thôi học: không ghi tự động');
    } finally { setConfig('demo_date', cu); }
  });

  check('XL-5c · Mini Test < 70 % sau Tiếp tục → dòng (d) mới, hạn CN tuần sau; không thẻ "Mini Test chưa đạt"; Tiếp tục lần hai đóng lại', () => {
    const mt = get('SELECT * FROM mini_test WHERE student_id = ?', B.sid);
    assert(mt, 'tiền đề: B có Mini Test');
    ck.ghiMiniTest(QL, mt.id, { tyLe: 55, ngay: TODAY });
    const e = dong(B.sid);
    assert(e?.lyDo.ma === 'd' && e.lyDo.chu === 'Mini Test 55 % · cần ≥ 70 %' && e.han === addDays(week.mondayOf(TODAY), 13), `d: ${JSON.stringify(e?.lyDo)} ${e?.han}`);
    assert(!get(`SELECT 1 FROM yeu_cau_duyet WHERE loai = 'bao_len_mini_test' AND doi_tuong_id = ? AND trang_thai = 'cho'`, mt.id), 'không còn thẻ Báo lên');
    const r = xl.luuXetLai(QL, BE_D.id, [{ studentId: B.sid, quyetDinh: 'tiep_tuc' }]);
    assert(!r.failed.length && !dong(B.sid), `Tiếp tục lần hai: ${JSON.stringify(r)}`);
  });

  check('XL-4b · Học lại "Ngay hôm nay": chuyển ngay (daChuyen), Hoàn tác → 409 "đã chuyển lớp"', () => {
    const N = kb(44, 'len_lop', { thiHanh: true });
    const r = xl.luuXetLai(QL, BE_D.id, [{ studentId: N.sid, quyetDinh: 'hoc_lai', toClassId: FOU_D.id, tuan: TODAY }]);
    assert(!r.failed.length && r.ok[0].daChuyen && get(`SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'active'`, N.sid).class_id === FOU_D.id, JSON.stringify(r));
    const h = xl.hoanTacXetLai(QL, BE_D.id, [r.ok[0].id]);
    assert(h.failed.length === 1 && /đã chuyển lớp/.test(h.failed[0].message), JSON.stringify(h));
  });

  check('XL-6 · tốc độ: tapXetLai cùng số câu SQL khi 3 hay 12 em (≤ 14)', () => {
    const demCau = (fn: () => void): number => {
      let n = 0; const goc = conn.prepare.bind(conn);
      (conn as any).prepare = (sql: string) => { n += 1; return goc(sql); };
      try { fn(); } finally { (conn as any).prepare = goc; }
      return n;
    };
    const dem = () => trongBoNho(() => { regular.allProgrammes(); return demCau(() => xl.tapXetLai(TODAY)); });
    const n1 = dem();
    for (let i = 0; i < 9; i++) kb(40 + i, 'len_lop', { thiHanh: true });
    const n2 = dem();
    assert(n1 === n2 && n2 <= 14, `${n1} → ${n2} câu`);
  });
}
