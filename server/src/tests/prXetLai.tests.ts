/**
 * PHÉP KIỂM P9a XET-LAI — Xét lại lộ trình (plan.md 1.6 N21, kế hoạch `docs/superpowers/plans/2026-10-25-p9a-xet-lai.md`).
 * XL-1 luật thuần · XL-2 migrate thẻ Mini Test · XL-3 GET panel = việc · XL-4 POST lô · XL-5 tự giữ + Hoàn tác · XL-6 tốc độ.
 */
import fs from 'node:fs';
import path from 'node:path';
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
  const { voiBanSaoDb } = await import('./banSaoDb.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const QL = P.mbManager;
  const MB = get(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const CP = get(`SELECT id FROM branches WHERE code = 'CP'`).id as number;
  const NOW = new Date().toISOString();
  const THU_HAI = (d.tuanChonDuoc(TODAY) as string[])[0];
  const NGAY_FINAL = addDays(TODAY, -5);
  /* Điểm Final nhập trước mọi quyết định của phép kiểm, ngày (giờ VN) không quá NGAY_FINAL — mốc tính hạn cố định dù ngày demo khác ngày thật. */
  const TRUOC = new Date(Math.min(Date.now() - 3_600_000, Date.parse(`${NGAY_FINAL}T03:00:00.000Z`))).toISOString();

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
  const theMini = (sid: number, mtId: number) => Number(conn.prepare(
    `INSERT INTO yeu_cau_duyet (loai, phan_loai, doi_tuong_loai, doi_tuong_id, hoc_vien_id, trang_thai, tao_luc) VALUES ('bao_len_mini_test', 'bao-len', 'mini_test', ?, ?, 'cho', ?)`,
  ).run(mtId, sid, NOW).lastInsertRowid);
  /**
   * Giả DB cũ (chưa bảng) trên BẢN SAO RIÊNG của database kiểm — KIEM-CHAP-CHON: trước đây cất / trả bảng bằng DROP / RENAME ngay trên kết nối
   * dùng chung. SQLite từ chối DDL ("database table is locked") khi trên kết nối còn BẤT KỲ câu lệnh dở nào hoặc một kết nối khác cùng tệp
   * đang đọc (libsql dùng chung bộ đệm) — chập chờn khi `npm run check` chạy song song; lệnh trả bảng trong `finally` hỏng → bảng kẹt tên
   * `xet_lai_cat`, mọi phép kiểm sau báo "no such table: xet_lai_lo_trinh". Nay chạy trên bản sao riêng (`voiBanSaoDb`, banSaoDb.ts).
   */
  const voiDbCu = (fn: (ban: any) => void) => voiBanSaoDb('xl2', (ban) => {
    ban.exec('DROP INDEX IF EXISTS ix_xet_lai_hv; DROP INDEX IF EXISTS ux_xet_lai_tu_dong; DROP TABLE xet_lai_lo_trinh');
    ban.prepare('DELETE FROM demo_config WHERE key = ?').run(xl.MOC_TU_GIU);
    fn(ban);
  });
  check('XL-2 · migrate: DB cũ (chưa bảng) → tạo bảng + mốc tự giữ một lần; thẻ "Mini Test chưa đạt" của em KHÔNG có dòng (d) giữ nguyên; chạy hai lần không đổi gì, không tính tập; DB mã hiện hành không đổi', () => {
    const sid = get('SELECT id FROM students ORDER BY id LIMIT 1').id;
    const id = theMini(sid, 999001);
    const a0: string[] = [], a1: string[] = [], a2: string[] = [];
    mig.migratePrXetLai(conn, a0);
    assert(!a0.length && !get(`SELECT 1 FROM demo_config WHERE key = ?`, xl.MOC_TU_GIU), `DB mã hiện hành: ${JSON.stringify(a0)}`);
    /* KIEM-CHAP-CHON: một câu đang dở trên kết nối dùng chung (như lúc chạy song song) không được làm hỏng phép kiểm hay DB dùng chung. */
    const doDang = conn.prepare('SELECT id FROM students');
    doDang.run();
    try {
      voiDbCu((ban) => {
        const g = (sql: string, ...a: unknown[]) => ban.prepare(sql).get(...a) as any;
        mig.migratePrXetLai(ban, a1);
        assert(g('SELECT trang_thai FROM yeu_cau_duyet WHERE id = ?', id).trang_thai === 'cho', 'thẻ không có dòng (d) phải giữ');
        assert(g(`SELECT value FROM demo_config WHERE key = ?`, xl.MOC_TU_GIU)?.value === TODAY && a1.some((x) => /mốc tự giữ/.test(x)), `lần 1: ${JSON.stringify(a1)}`);
        /* Lần 2 (bảng đã có, thẻ chờ vẫn còn): không câu nào ngoài kiểm bảng — không tính tập Xét lại mỗi lần khởi động. */
        let n = 0; const goc = ban.prepare.bind(ban);
        ban.prepare = (sql: string) => { n += 1; return goc(sql); };
        try { mig.migratePrXetLai(ban, a2); } finally { delete ban.prepare; }
        assert(!a2.length && n === 1, `lần 2: ${JSON.stringify(a2)} · ${n} câu`);
      });
    } finally { doDang.all(); }   // chạy lại hết một lượt = đặt lại câu dở
    assert(get(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'xet_lai_lo_trinh'`), 'DB dùng chung vẫn còn bảng xet_lai_lo_trinh');
    conn.prepare('DELETE FROM yeu_cau_duyet WHERE id = ?').run(id);
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
    assert(g.lopHocLai.FOU?.some((l: any) => l.id === FOU_D.id) && g.lopHocLai.FOU.some((l: any) => l.id === FOU_CP.id)   // Q-RL6: mọi chi nhánh
      && g.lopHocLai.FOU.findIndex((l: any) => l.id === FOU_D.id) < g.lopHocLai.FOU.findIndex((l: any) => l.id === FOU_CP.id) && !g.chiXem, `lớp học lại (cùng chi nhánh trước): ${JSON.stringify(g.lopHocLai)}`);
    assert(viec(QL, CHO.fou.id)?.count === 1, 'lệnh chưa thi hành: việc ở lớp cũ');
    assert(!viec(P.cpManager, BE_D.id) && !viec(GVCN_BE, BE_D.id) && !viec(GVBM_BE, BE_D.id) && viec(P.admin, BE_D.id), 'QL CP / GVCN / GVBM không việc, QT có');
    const gv = trongBoNho(() => xl.xemXetLai(GVCN_BE, BE_D.id, null));
    assert(gv.chiXem && gv.em.length === g.em.length && !Object.keys(gv.lopHocLai).length, 'GVCN lớp mới: chỉ xem');
    assert(gv.em.every((x: any) => x.goiY === null && x.phuHuynh === null && x.banGiaoGvcnCu === null && x.daChot.lyDo === null && x.coTheNhanXet), `GVCN: bỏ gợi ý / PH / lý do: ${JSON.stringify(gv.em[0])}`);
    const gvCu = ganGv(CHO.fou.id, 5, true);
    assert(!trongBoNho(() => xl.xemXetLai(gvCu, CHO.fou.id, null)).em.length, 'GVCN lớp CŨ (lệnh chưa thi hành): không thấy');
    let m = 0; try { trongBoNho(() => xl.ghiNhanXetGvcnMoi(gvCu, CHO.fou.id, CHO.sid, 'x')); } catch (e: any) { m = e.status; }
    assert(m === 403, `GVCN lớp cũ ghi nhận xét: ${m}`);
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
    const sai = xl.luuXetLai(QL, CHO.fou.id, [{ studentId: CHO.sid, quyetDinh: 'hoc_lai', toClassId: BE_D.id, tuan: THU_HAI }]);
    assert(sai.failed.length === 1 && /Lớp học lại phải là lớp FOU/.test(sai.failed[0].message), JSON.stringify(sai));   // Q-RL6: khác chương trình vẫn lỗi; khác chi nhánh được (XL-RL6)
    const r2 = xl.luuXetLai(QL, CHO.fou.id, [{ studentId: CHO.sid, quyetDinh: 'hoc_lai', toClassId: FOU_D.id, tuan: THU_HAI }]);
    assert(!r2.failed.length, JSON.stringify(r2));
    const l1 = lenhCua(CHO.sid);
    assert(l1.id === l0.id && l1.huong === 'hoc_lai' && l1.lop_dich_id === FOU_D.id && soLenh() === n0, `sửa lệnh: ${JSON.stringify(l1)} (${soLenh()} lệnh)`);
    const e = dong(CHO.sid);
    assert(e?.quyetDinh?.quyetDinh === 'hoc_lai' && e.quyetDinh.lopDich === FOU_D.code && !viec(QL, CHO.fou.id), `đã quyết còn sửa được: ${JSON.stringify(e?.quyetDinh)}`);
  });

  check('XL-5 · Hoàn tác Học lại (lệnh chưa thi hành) → NGUYÊN dòng lệnh (xác nhận bàn giao GVCN, lam_lai, Target, hạn), LTT, không chuông / Hành trình còn lại; Học lại em đã thi hành → lệnh giữa khoá mới, Sửa sang Tiếp tục → lệnh mới huỷ; Tạm dừng + Hoàn tác', () => {
    /* Lệnh của CHO đang sửa (XL-4) — đưa về Lên BE trước, rồi dựng bàn giao đã xác nhận để soi Hoàn tác. */
    const id0 = get(`SELECT id FROM xet_lai_lo_trinh WHERE student_id = ? AND quyet_dinh = 'hoc_lai'`, CHO.sid).id;
    assert(!xl.hoanTacXetLai(QL, CHO.fou.id, [id0]).failed.length, 'hoàn tác XL-4');
    const lId = lenhCua(CHO.sid).id;
    conn.prepare(`UPDATE lenh_chuyen_lop SET xac_nhan_boi = ?, xac_nhan_luc = ?, nhan_xet_chung = 'Em chăm', han_gvcn = '2026-09-30' WHERE id = ?`).run(GVCN_BE.userId, NOW, lId);
    conn.prepare(`INSERT INTO ban_giao_mon (lenh_id, mon, noi_dung, nguoi_ghi, ghi_luc, lam_lai) VALUES (?, 'reading', 'Đọc chậm', ?, ?, 0)`).run(lId, GVCN_BE.userId, NOW);
    const truoc = { l: get('SELECT * FROM lenh_chuyen_lop WHERE id = ?', lId), bg: all('SELECT * FROM ban_giao_mon WHERE lenh_id = ?', lId),
      ltt: get('SELECT * FROM lo_trinh_tiep_theo WHERE student_id = ? AND class_id = ?', CHO.sid, CHO.fou.id),
      nt: get('SELECT COUNT(*) n FROM notifications').n, je: get('SELECT COUNT(*) n FROM journey_events WHERE student_id = ?', CHO.sid).n };
    const r0 = xl.luuXetLai(QL, CHO.fou.id, [{ studentId: CHO.sid, quyetDinh: 'hoc_lai', toClassId: FOU_D.id, tuan: THU_HAI }]);
    assert(!r0.failed.length, JSON.stringify(r0));
    const giua = get('SELECT * FROM lenh_chuyen_lop WHERE id = ?', lId);
    assert(giua.huong === 'hoc_lai' && giua.xac_nhan_boi === null && get('SELECT lam_lai FROM ban_giao_mon WHERE lenh_id = ?', lId).lam_lai === 1, `tiền đề — sửa lệnh làm lại phiếu: ${JSON.stringify(giua)}`);
    const nChuong = get('SELECT COUNT(*) n FROM notifications').n;
    const h = xl.hoanTacXetLai(QL, CHO.fou.id, [r0.ok[0].id]);
    assert(!h.failed.length, JSON.stringify(h));
    assert(JSON.stringify(get('SELECT * FROM lenh_chuyen_lop WHERE id = ?', lId)) === JSON.stringify(truoc.l), `lệnh: ${JSON.stringify(get('SELECT * FROM lenh_chuyen_lop WHERE id = ?', lId))} ≠ ${JSON.stringify(truoc.l)}`);
    assert(JSON.stringify(all('SELECT * FROM ban_giao_mon WHERE lenh_id = ?', lId)) === JSON.stringify(truoc.bg), 'phiếu môn: lam_lai về 0');
    assert(JSON.stringify(get('SELECT * FROM lo_trinh_tiep_theo WHERE student_id = ? AND class_id = ?', CHO.sid, CHO.fou.id)) === JSON.stringify(truoc.ltt), 'Lộ trình tiếp theo về như cũ');
    assert(get('SELECT COUNT(*) n FROM notifications').n === truoc.nt && nChuong >= truoc.nt, `chuông: ${truoc.nt} → ${nChuong} → ${get('SELECT COUNT(*) n FROM notifications').n}`);
    assert(get('SELECT COUNT(*) n FROM journey_events WHERE student_id = ?', CHO.sid).n === truoc.je, 'Hành trình về như cũ');
    assert(dong(CHO.sid)?.lyDo.ma === 'a', 'dòng mở lại');
    /* Sửa: Học lại lớp này → Học lại lớp khác — đảo về nguyên trạng rồi sửa lại, vẫn MỘT lệnh. */
    const r1 = xl.luuXetLai(QL, CHO.fou.id, [{ studentId: CHO.sid, quyetDinh: 'hoc_lai', toClassId: FOU_D.id, tuan: THU_HAI }]);
    const FOU_D2 = lop('FOU', 1);
    const rs = xl.luuXetLai(QL, CHO.fou.id, [{ studentId: CHO.sid, quyetDinh: 'hoc_lai', toClassId: FOU_D2.id, tuan: THU_HAI, suaId: r1.ok[0].id }]);
    assert(!rs.failed.length && lenhCua(CHO.sid).id === lId && lenhCua(CHO.sid).lop_dich_id === FOU_D2.id, `Sửa: ${JSON.stringify(rs)}`);
    /* XL-5 (sửa 5): Hoàn tác lần Sửa → trả lại quyết định TRƯỚC Sửa (Học lại FOU_D, cùng người + giờ quyết); Hoàn tác tiếp → lệnh gốc. */
    const cu1 = JSON.parse(get('SELECT quyet_cu FROM xet_lai_lo_trinh WHERE id = ?', rs.ok[0].id).quyet_cu ?? 'null');
    assert(cu1?.muc.quyetDinh === 'hoc_lai' && cu1.muc.toClassId === FOU_D.id && get(`SELECT COUNT(*) n FROM xet_lai_lo_trinh WHERE student_id = ? AND quyet_dinh IS NOT NULL`, CHO.sid).n === 1, `Sửa: dòng cũ đảo, giữ trong quyet_cu ${JSON.stringify(cu1)}`);
    const h2b = xl.hoanTacXetLai(QL, CHO.fou.id, [rs.ok[0].id]);
    const traLai = get(`SELECT * FROM xet_lai_lo_trinh WHERE student_id = ? AND quyet_dinh IS NOT NULL ORDER BY id DESC LIMIT 1`, CHO.sid);
    assert(!h2b.failed.length && lenhCua(CHO.sid).id === lId && lenhCua(CHO.sid).lop_dich_id === FOU_D.id && lenhCua(CHO.sid).huong === 'hoc_lai'
      && traLai?.quyet_dinh === 'hoc_lai' && traLai.nguoi_id === QL.userId && traLai.luc === cu1.luc, `Hoàn tác sau Sửa: ${JSON.stringify(h2b)} ${JSON.stringify(traLai)}`);
    assert(dong(CHO.sid)?.quyetDinh?.id === traLai.id && dong(CHO.sid).quyetDinh.lopDich === FOU_D.code, 'quyết định trước Sửa còn sửa được');
    const h2c = xl.hoanTacXetLai(QL, CHO.fou.id, [traLai.id]);
    assert(!h2c.failed.length && JSON.stringify(get('SELECT * FROM lenh_chuyen_lop WHERE id = ?', lId)) === JSON.stringify(truoc.l), 'Hoàn tác tiếp: về đúng lệnh gốc');
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
    /* Thẻ cũ (trước deploy) của em đã có dòng (d) → migrate đóng; "Đã xét lại" đúng quyết định trước. */
    const the = theMini(B.sid, mt.id), theKhac = theMini(B.sid, mt.id + 900_000);
    voiDbCu((ban) => {
      mig.migratePrXetLai(ban, []);
      const tt = (id: number) => ban.prepare('SELECT trang_thai FROM yeu_cau_duyet WHERE id = ?').get(id)?.trang_thai;
      assert(tt(the) === 'tu_dong', 'thẻ có dòng (d) đúng Mini Test: đóng');
      assert(tt(theKhac) === 'cho', 'thẻ Mini Test khác: giữ');
    });
    for (const id of [the, theKhac]) conn.prepare('DELETE FROM yeu_cau_duyet WHERE id = ?').run(id);
    assert(e.xetLaiTruoc?.quyetDinh === 'tiep_tuc' && e.xetLaiTruoc.chu === 'Tiếp tục BE' && !e.xetLaiTruoc.tuDong, `Đã xét lại: ${JSON.stringify(e.xetLaiTruoc)}`);
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

  check('XL-5d · mốc deploy: mục hết hạn TRƯỚC mốc không tự ghi "Tiếp tục", chỉ rời tập; mục hạn sau mốc vẫn tự ghi', () => {
    const E = kb(41, 'len_lop', { thiHanh: true });
    const han = dong(E.sid).han;
    const sau = addDays(han, 1);
    const cu = getConfig('demo_date');
    conn.prepare('INSERT OR REPLACE INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run(xl.MOC_TU_GIU, addDays(han, 1), NOW);
    setConfig('demo_date', sau);
    try {
      assert(!dong(E.sid, sau), 'hết hạn trước mốc: rời tập');
      assert(!get('SELECT 1 FROM xet_lai_lo_trinh WHERE student_id = ?', E.sid), 'không tự ghi');
      conn.prepare('UPDATE demo_config SET value = ? WHERE key = ?').run(han, xl.MOC_TU_GIU);
      assert(!dong(E.sid, sau) && !get('SELECT 1 FROM xet_lai_lo_trinh WHERE student_id = ?', E.sid), 'đường đọc không tự ghi (sửa 8)');
      xl.quetXetLaiHetHan(sau);
      assert(get('SELECT tu_dong FROM xet_lai_lo_trinh WHERE student_id = ?', E.sid)?.tu_dong === 1, 'hạn từ mốc: tự ghi');
    } finally { setConfig('demo_date', cu); conn.prepare('DELETE FROM demo_config WHERE key = ?').run(xl.MOC_TU_GIU); }
  });

  check('XL-5e · quyền Hoàn tác theo lớp LÚC QUYẾT (lop_id): QL CP không hoàn tác được quyết định ở lớp MB; tuan / toClassId sai kiểu → 400; Lên (dòng (c)) → lệnh sang BE, (a) không dùng được Lên', () => {
    const F = kb(43, 'len_lop', { thiHanh: true });
    const r = xl.luuXetLai(QL, BE_D.id, [{ studentId: F.sid, quyetDinh: 'tiep_tuc', lyDo: 'Thử 2 tuần' }]);
    assert(!r.failed.length && get('SELECT lop_id, chu FROM xet_lai_lo_trinh WHERE id = ?', r.ok[0].id).lop_id === BE_D.id, JSON.stringify(r));
    const h = xl.hoanTacXetLai(P.cpManager, FOU_CP.id, [r.ok[0].id]);
    assert(h.failed.length === 1 && /Quản lý chi nhánh/.test(h.failed[0].message) && get('SELECT 1 FROM xet_lai_lo_trinh WHERE id = ?', r.ok[0].id), `QL CP: ${JSON.stringify(h)}`);
    const ma400 = (b: any) => { try { xl.luuXetLai(QL, BE_D.id, [b]); } catch (e: any) { return e.status; } return 200; };
    assert(ma400({ studentId: F.sid, quyetDinh: 'hoc_lai', toClassId: FOU_D.id, tuan: 123 }) === 400 && ma400({ studentId: F.sid, quyetDinh: 'hoc_lai', toClassId: 'x', tuan: THU_HAI }) === 400
      && ma400({ studentId: F.sid, quyetDinh: 'hoc_lai', toClassId: FOU_D.id, tuan: { a: 1 } }) === 400, 'sai kiểu → 400');
    const C2 = kb(65, 'hoc_lai', { thiHanh: true });
    assert(dong(C2.sid)?.lyDo.ma === 'c', 'tiền đề (c)');
    const g = trongBoNho(() => xl.xemXetLai(QL, FOU_D.id, C2.sid));
    assert(g.lopLen.FOU?.some((l: any) => l.id === BE_D.id) && !g.lopLen.FOU.some((l: any) => l.id === FOU_D.id), `lopLen: ${JSON.stringify(g.lopLen)}`);
    const sai = xl.luuXetLai(QL, BE_D.id, [{ studentId: F.sid, quyetDinh: 'len', toClassId: BE_D.id, tuan: THU_HAI }]);
    assert(sai.failed.length === 1, `(a) Lên: ${JSON.stringify(sai)}`);
    const len = xl.luuXetLai(QL, FOU_D.id, [{ studentId: C2.sid, quyetDinh: 'len', toClassId: BE_D.id, tuan: THU_HAI }]);
    assert(!len.failed.length && lenhCua(C2.sid).lop_dich_id === BE_D.id && len.ok[0].chu === `Lên BE → ${BE_D.code}`, JSON.stringify(len));
    assert(get(`SELECT title FROM journey_events WHERE student_id = ? AND event_type = 'xet_lai'`, C2.sid)?.title === `QL xét lại: Lên BE → ${BE_D.code}`, 'Hành trình Lên');
    /* Lên FT (dòng (c)) kèm Target ghi tại thẻ → lệnh mang Target đó. */
    const C3 = kb(66, 'hoc_lai', { thiHanh: true });
    const FT = lop('FT', 1);
    const ft = xl.luuXetLai(QL, FOU_D.id, [{ studentId: C3.sid, quyetDinh: 'len', toClassId: FT.id, tuan: THU_HAI, mucTieu: '6.5' }]);
    assert(!ft.failed.length && lenhCua(C3.sid).lop_dich_id === FT.id && lenhCua(C3.sid).muc_tieu === 6.5, `Lên FT + Target: ${JSON.stringify(ft)} ${JSON.stringify(lenhCua(C3.sid))}`);
  });

  /* Hai em cùng lớp nguồn: lệnh Cuối khoá chờ → BE_D; lớp FOU mới có GVCN (nhận chuông "Sắp nhận"). */
  const FOU_N = lop('FOU', 1);
  const GVCN_N = ganGv(FOU_N.id, 5, true);
  const X = kb(45);
  const Y = (() => {
    seq += 1;
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-XL${seq}`, `Học viên XL${seq}`, `hoc vien xl${seq}`, MB, NOW).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, X.fou.id, addDays(week.mondayOf(TODAY), -49), NOW);
    regular.planRegularTests(P.admin, X.fou.id, { studentIds: [sid], kinds: ['final'] });
    const fid = get(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'final' ORDER BY id DESC LIMIT 1`, sid).id as number;
    for (const sk of regular.allProgrammes().get('FOU').skills as string[]) {
      conn.prepare('INSERT INTO assessment_scores (attempt_id, skill, raw_score, raw_total, entered_at, nhap_dau_ngay) VALUES (?,?,?,100,?,?)').run(fid, sk, 44, TRUOC, NGAY_FINAL);
    }
    assert(!lenh.raLenh(QL, { lopNguonId: X.fou.id, boiCanh: 'cuoi-khoa', tuanChung: THU_HAI, dongs: [{ studentId: sid, huong: 'len_lop', toClassId: BE_D.id, lyDo: 'XL' }] }).failed.length, 'raLenh Y');
    conn.prepare('UPDATE lenh_chuyen_lop SET ngay_ra_lenh = ? WHERE student_id = ?').run(addDays(TODAY, -12), sid);
    return { sid };
  })();
  const chuong = (uid: number, dich: number) => get(`SELECT * FROM notifications WHERE user_id = ? AND kind = 'sap_nhan' AND dedup_key = ?`, uid, `sap_nhan:${dich}:${X.fou.id}:${TODAY}`);

  check('XL-7 · Hoàn tác Học lại (lệnh chưa thi hành): chuông "Sắp nhận" đếm lại từ bảng lệnh — chuông dùng chung với em khác giữ, chỉ đổi số; chuông khác không bị xoá', () => {
    const r = xl.luuXetLai(QL, X.fou.id, [{ studentId: X.sid, quyetDinh: 'hoc_lai', toClassId: FOU_N.id, tuan: THU_HAI }, { studentId: Y.sid, quyetDinh: 'hoc_lai', toClassId: FOU_N.id, tuan: THU_HAI }]);
    assert(!r.failed.length && r.ok.length === 2, JSON.stringify(r));
    assert(chuong(GVCN_N.userId, FOU_N.id)?.title === `Sắp nhận 2 em vào lớp ${FOU_N.code}`, `tiền đề: ${JSON.stringify(chuong(GVCN_N.userId, FOU_N.id))}`);
    /* Chuông của người khác sinh SAU quyết định (trong dải id cũ) — không được mất. */
    conn.prepare(`INSERT INTO notifications (user_id, kind, title, dedup_key, created_at) VALUES (?, 'khac', 'Chuông khác', ?, ?)`).run(GVBM_BE.userId, `xl7:${NOW}`, NOW);
    const idX = r.ok.find((o: any) => o.studentId === X.sid).id;
    const h = xl.hoanTacXetLai(QL, X.fou.id, [idX]);
    assert(!h.failed.length, JSON.stringify(h));
    assert(chuong(GVCN_N.userId, FOU_N.id)?.title === `Sắp nhận 1 em vào lớp ${FOU_N.code}`, `chuông dùng chung đổi số: ${JSON.stringify(chuong(GVCN_N.userId, FOU_N.id))}`);
    assert(get(`SELECT 1 FROM notifications WHERE dedup_key = ?`, `xl7:${NOW}`), 'chuông khác còn');
    assert(lenhCua(X.sid).lop_dich_id === BE_D.id && lenhCua(Y.sid).lop_dich_id === FOU_N.id, 'X về BE_D, Y vẫn FOU_N');
    /* Hoàn tác nốt Y → FOU_N không còn em: chuông hôm nay của lớp đó bỏ (không còn "Sắp nhận 0 em"). */
    const idY = r.ok.find((o: any) => o.studentId === Y.sid).id;
    assert(!xl.hoanTacXetLai(QL, X.fou.id, [idY]).failed.length && !chuong(GVCN_N.userId, FOU_N.id), 'hết em: bỏ chuông hôm nay');
  });

  check('XL-8 · lệnh đã đổi ở Chuyển lớp sau quyết định Xét lại → Hoàn tác 409 "dùng Chuyển lớp", lệnh giữ bản đã đổi', () => {
    const r = xl.luuXetLai(QL, X.fou.id, [{ studentId: Y.sid, quyetDinh: 'hoc_lai', toClassId: FOU_N.id, tuan: THU_HAI }]);
    assert(!r.failed.length, JSON.stringify(r));
    const tuan2 = (d.tuanChonDuoc(TODAY) as string[])[1];
    lenh.suaLenh(QL, lenhCua(Y.sid).id, { tuan: tuan2 });
    const sau = JSON.stringify(lenhCua(Y.sid));
    const h = xl.hoanTacXetLai(QL, X.fou.id, [r.ok[0].id]);
    assert(h.failed.length === 1 && h.failed[0].message === 'Quyết định đã đổi ở Chuyển lớp — dùng Chuyển lớp.', JSON.stringify(h));
    assert(JSON.stringify(lenhCua(Y.sid)) === sau && get('SELECT 1 FROM xet_lai_lo_trinh WHERE id = ?', r.ok[0].id), 'lệnh + quyết định giữ nguyên');
  });

  check('XL-9 · hạn tính từ ngày mốc mở dòng: dòng tự giữ khi hết hạn, Final sửa sau đó → dòng mở lại có hạn MỚI (không tự giữ ngay)', () => {
    const G = kb(42, 'len_lop', { thiHanh: true });
    const han = dong(G.sid).han;
    const sau = addDays(han, 8);
    const cu = getConfig('demo_date');
    setConfig('demo_date', sau);
    try {
      xl.quetXetLaiHetHan(sau);
      assert(get('SELECT COUNT(*) n FROM xet_lai_lo_trinh WHERE student_id = ? AND tu_dong = 1', G.sid).n === 1, 'tiền đề: tự giữ');
      /* Sửa Final ngày `sau` (giờ thật ≥ lúc tự giữ để là mốc mới). */
      const luc = new Date(Math.max(Date.now() + 60_000, Date.parse(`${sau}T03:00:00.000Z`))).toISOString();
      conn.prepare('UPDATE assessment_scores SET raw_score = 41, entered_at = ? WHERE attempt_id = ?').run(luc, G.fid);
      const e = dong(G.sid, sau);
      assert(e?.lyDo.ma === 'a' && e.han >= sau, `mở lại, hạn mới: ${JSON.stringify(e && { han: e.han, ly: e.lyDo })} (sau ${sau})`);
      xl.quetXetLaiHetHan(sau);
      assert(get('SELECT COUNT(*) n FROM xet_lai_lo_trinh WHERE student_id = ? AND tu_dong = 1', G.sid).n === 1 && dong(G.sid, sau), 'không tự giữ ngay');
    } finally { setConfig('demo_date', cu); }
  });

  check('XL-10 · Mini Test < 70 % mà em KHÔNG ở tập Xét lại → vẫn thẻ "Mini Test chưa đạt" như trước; có dòng (d) → không thẻ', () => {
    const H = kb(55, 'len_lop', { thiHanh: true });
    const mt = get('SELECT * FROM mini_test WHERE student_id = ?', H.sid);
    assert(mt, 'tiền đề: H có Mini Test');
    conn.prepare(`UPDATE lenh_chuyen_lop SET tuan_bat_dau = ? WHERE student_id = ?`).run(addDays(TODAY, -90), H.sid);   // ngoài cửa sổ Xét lại
    ck.ghiMiniTest(QL, mt.id, { tyLe: 50, ngay: TODAY });
    assert(!dong(H.sid) && get(`SELECT 1 FROM yeu_cau_duyet WHERE loai = 'bao_len_mini_test' AND doi_tuong_id = ? AND trang_thai = 'cho'`, mt.id), 'ngoài tập: thẻ Báo QL');
  });

  check('XL-11 · luuXetLai: một em hai mục trong cùng lô → 400', () => {
    let ma = 0;
    try { xl.luuXetLai(QL, BE_D.id, [{ studentId: A.sid, quyetDinh: 'tiep_tuc', lyDo: 'x' }, { studentId: A.sid, quyetDinh: 'dung', lyDo: 'y' }]); } catch (e: any) { ma = e.status; }
    assert(ma === 400, `mã ${ma}`);
  });

  check('XL-12 · em ĐANG có lệnh chờ của quyết định Xét lại trước (dòng mở lại vì Final sửa): Học lại lần hai SỬA lệnh đó, Hoàn tác trả lệnh đó (không huỷ); bàn giao / cron đổi loi, thu_ngay, xác nhận không chặn Hoàn tác', () => {
    const K = kb(45, 'len_lop', { thiHanh: true });
    const r1 = xl.luuXetLai(QL, BE_D.id, [{ studentId: K.sid, quyetDinh: 'hoc_lai', toClassId: FOU_D.id, tuan: THU_HAI }]);
    assert(!r1.failed.length, JSON.stringify(r1));
    const lk = lenhCua(K.sid);
    assert(lk.trang_thai === 'cho' && lk.lop_dich_id === FOU_D.id, `tiền đề lệnh chờ: ${JSON.stringify(lk)}`);
    /* Final sửa sau quyết định → dòng (a) mở lại (mốc mới). */
    conn.prepare('UPDATE assessment_scores SET raw_score = 44, entered_at = ? WHERE attempt_id = ?').run(new Date(Date.now() + 60_000).toISOString(), K.fid);
    assert(dong(K.sid)?.lyDo.ma === 'a' && !dong(K.sid).quyetDinh, 'dòng mở lại');
    const FOU_D3 = lop('FOU', 1);
    const truoc = get('SELECT * FROM lenh_chuyen_lop WHERE id = ?', lk.id);
    const r2 = xl.luuXetLai(QL, BE_D.id, [{ studentId: K.sid, quyetDinh: 'hoc_lai', toClassId: FOU_D3.id, tuan: THU_HAI }]);
    assert(!r2.failed.length && lenhCua(K.sid).id === lk.id && lenhCua(K.sid).lop_dich_id === FOU_D3.id, `Học lại lần hai sửa lệnh chờ: ${JSON.stringify(r2)}`);
    assert(get('SELECT lenh_cu FROM xet_lai_lo_trinh WHERE id = ?', r2.ok[0].id).lenh_cu, 'đã chụp lệnh chờ');
    /* Bàn giao + cron ghi vào dòng lệnh (không phải trường Xét lại đặt) — Hoàn tác vẫn được. */
    conn.prepare(`UPDATE lenh_chuyen_lop SET loi = 'Lỗi thử', thu_ngay = ?, xac_nhan_boi = ?, xac_nhan_luc = ? WHERE id = ?`).run(TODAY, GVCN_BE.userId, NOW, lk.id);
    const h = xl.hoanTacXetLai(QL, BE_D.id, [r2.ok[0].id]);
    const sau = get('SELECT * FROM lenh_chuyen_lop WHERE id = ?', lk.id);
    assert(!h.failed.length && sau.trang_thai === 'cho' && sau.lop_dich_id === FOU_D.id && JSON.stringify(sau) === JSON.stringify(truoc), `Hoàn tác trả lệnh của quyết định trước: ${JSON.stringify(h)} ${JSON.stringify(sau)}`);
    assert(get('SELECT 1 FROM xet_lai_lo_trinh WHERE id = ?', r1.ok[0].id), 'quyết định trước còn');
  });

  check('XL-13 · Hoàn tác Tạm dừng khi trạng thái em đã bị người khác đổi (Kết thúc học) → 409, không đảo; còn đúng trạng thái đã quyết → đảo', () => {
    const S = kb(45, 'len_lop', { thiHanh: true });
    const r = xl.luuXetLai(QL, BE_D.id, [{ studentId: S.sid, quyetDinh: 'dung', trangThai: 'inactive', lyDo: 'Nghỉ ốm' }]);
    assert(!r.failed.length, JSON.stringify(r));
    conn.prepare(`UPDATE students SET status = 'finished' WHERE id = ?`).run(S.sid);
    const h = xl.hoanTacXetLai(QL, BE_D.id, [r.ok[0].id]);
    assert(h.failed.length === 1 && /Trạng thái học viên đã đổi/.test(h.failed[0].message) && get('SELECT status FROM students WHERE id = ?', S.sid).status === 'finished'
      && get('SELECT 1 FROM xet_lai_lo_trinh WHERE id = ?', r.ok[0].id), `đổi bởi người khác: ${JSON.stringify(h)}`);
    conn.prepare(`UPDATE students SET status = 'inactive' WHERE id = ?`).run(S.sid);
    const h2 = xl.hoanTacXetLai(QL, BE_D.id, [r.ok[0].id]);
    assert(!h2.failed.length && get('SELECT status FROM students WHERE id = ?', S.sid).status === 'active', `đúng trạng thái: ${JSON.stringify(h2)}`);
  });

  check('XL-RA (RA-LUONG-16) · Tạm dừng ở Xét lại khi em còn lệnh chuyển CHƯA thi hành → huỷ lệnh cùng quyết định; Hoàn tác → lệnh và trạng thái trở lại', () => {
    const S = kb(45, 'len_lop');
    const lenh = get(`SELECT id FROM lenh_chuyen_lop WHERE student_id = ? AND trang_thai = 'cho'`, S.sid);
    assert(lenh, 'tiền đề: lệnh chờ');
    const r = xl.luuXetLai(QL, S.fou.id, [{ studentId: S.sid, quyetDinh: 'dung', trangThai: 'inactive', lyDo: 'Nghỉ ốm' }]);
    assert(!r.failed.length && get('SELECT trang_thai FROM lenh_chuyen_lop WHERE id = ?', lenh.id).trang_thai === 'huy', `lệnh phải huỷ: ${JSON.stringify(r)}`);
    const h = xl.hoanTacXetLai(QL, S.fou.id, [r.ok[0].id]);
    assert(!h.failed.length && get('SELECT trang_thai FROM lenh_chuyen_lop WHERE id = ?', lenh.id).trang_thai === 'cho'
      && get('SELECT status FROM students WHERE id = ?', S.sid).status === 'active', `Hoàn tác: ${JSON.stringify(h)}`);
  });

  check('XL-RL6 (Q-RL6 chủ SP 29/10) · thẻ Xét lại: Học lại sang lớp FOU chi nhánh KHÁC → lưu được, như Chuyển lớp một em', () => {
    const S = kb(45, 'len_lop');
    const r = xl.luuXetLai(QL, S.fou.id, [{ studentId: S.sid, quyetDinh: 'hoc_lai', toClassId: FOU_CP.id, tuan: THU_HAI }]);
    assert(!r.failed.length && lenhCua(S.sid).lop_dich_id === FOU_CP.id, `khác chi nhánh: ${JSON.stringify(r)} ${JSON.stringify(lenhCua(S.sid))}`);
  });

  check('XL-14 · coXetLaiMiniTest chỉ đúng Mini Test gây dòng (d)', () => {
    const M = kb(55, 'len_lop', { thiHanh: true });
    const mt = get('SELECT * FROM mini_test WHERE student_id = ?', M.sid);
    ck.ghiMiniTest(QL, mt.id, { tyLe: 50, ngay: TODAY });
    assert(dong(M.sid)?.lyDo.ma === 'd' && xl.coXetLaiMiniTest(M.sid, mt.id) && !xl.coXetLaiMiniTest(M.sid, mt.id + 900_000), 'đúng Mini Test');
  });

  check('XL-15 · hạn cố định: Final ghi bằng giờ thật sau ngày demo → mốc = hôm nay demo, hạn không đổi theo ngày tra; quét định kỳ dùng ngày nghiệp vụ', () => {
    const G2 = kb(42, 'len_lop', { thiHanh: true });
    conn.prepare('UPDATE assessment_scores SET entered_at = ? WHERE attempt_id = ?').run(new Date(Date.parse(`${addDays(TODAY, 30)}T03:00:00.000Z`)).toISOString(), G2.fid);
    const h0 = dong(G2.sid)?.han;
    assert(h0 && h0 === dong(G2.sid, addDays(TODAY, 3))?.han && h0 >= TODAY, `hạn: ${h0} / ${dong(G2.sid, addDays(TODAY, 3))?.han}`);
    const src = fs.readFileSync(path.join(process.cwd(), 'server/src/ops/chotVangDinhKy.ts'), 'utf8');
    assert(/quetXetLaiHetHan\(o\.ngay \?\? demoToday\(\)\)/.test(src), 'chotVangDinhKy: quét theo demoToday()');
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
