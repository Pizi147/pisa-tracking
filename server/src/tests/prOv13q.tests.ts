/**
 * PHÉP KIỂM OV-13q (chủ SP 16/10) — "Đã thi xong · hạn 1 tuần" + Gia hạn, gọi QUA HTTP theo vai như bản chính.
 *  1 · hàm `trangThaiSauThi` (ngày / tuần / tháng / thi_that_ngay, gia hạn, bước tiếp, quá hạn) · 2 · việc thi_that hiện HÔM SAU ngày thi, hạn +7, lộ trình mới
 *  nhất / em Lưu trữ lọc, GVCN / QL / GVBM · 3 · cùng hạn ở Công việc / Tổng quan TVV / Học viên & Lớp / panel một em / hồ sơ · 4 · gia hạn + bỏ gia hạn + quyền +
 *  nhật ký + Lịch sử sửa · 5 · sửa ngày thi sau thi / sau kết quả 200, hạn tính lại, gia hạn muộn hơn giữ · 6 · kết quả nhập sau hạn → bước tiếp không quá hạn
 *  ngay, sửa kết quả không dời · 7 · migrate ĐẦY ĐỦ trên bản sao DB demo bỏ cột mới, hai lần · 8 · EXPLAIN không SCAN learning_cycles mỗi em.
 * Không bọc giao dịch (mỗi lần gọi API tự mở giao dịch) — mỗi mục dựng lớp / em riêng; chạy cuối `run.ts`.
 */
import Database from 'libsql';
import { createRequire } from 'node:module';
import type { YThucTestKit } from './yThuc.tests.ts';

const require = createRequire(import.meta.url);

export async function runPrOv13qTests(t: YThucTestKit) {
  const { checkAsync, check, assert, conn, TODAY, P, addDays } = t;
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  const thiThat: any = await import('../loTrinh/thiThat.ts');
  const buocTiep: any = await import('../loTrinh/buocTiep.ts');
  const m13q: any = await import('../migrate/prOv13q.ts');
  const { getConfig, setConfig } = await import('../demoConfig.ts');
  const { createApp } = await import('../app.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nOV-13q · Đã thi xong · hạn 1 tuần + Gia hạn (qua HTTP)');

  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const QL = P.mbManager.userId as number;
  const MB = one(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const NOW = new Date().toISOString();
  const T2 = week.mondayOf(TODAY) as string;
  let seq = 0;
  const nguoi = (role: string, branches: string[]) => {
    seq += 1;
    return accounts.createAccount(P.admin, { email: `ov13q.${seq}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-ov13q', fullName: `Thử OV13q ${seq}`, roles: [{ role, branches }] }).userId as number;
  };
  const TVV = nguoi('consultant', ['MB']);
  const CX = nguoi('cx', []);
  const ADMIN = nguoi('office_admin', ['MB']);
  const lop = () => {
    seq += 1;
    const start = addDays(T2, -7 * 10);
    return intake.createClass(P.admin, { code: `MB Q13-${seq}`, branchId: MB, kind: 'FT', isFastTrack: true, route: 'LT1', startDate: start, startPeriodId: week.ensurePeriod(start).id }).id as number;
  };
  const phanCong = (classId: number, core: boolean) => {
    const uid = nguoi('teacher', ['MB']);
    conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,?,?,'2026-01-01','active',?)`)
      .run(uid, classId, core ? null : 'listening', core ? 1 : 0, NOW);
    return uid;
  };
  /** Lớp FT + GVCN + GVBM + một em (TVV = `TVV`) có lộ trình LT1 Target 6.5, ngày thi dự kiến `thi`. */
  const em = (thi: { exam_date?: string | null; exam_month?: string | null; exam_period_id?: number | null }) => {
    const l = lop(); const g = phanCong(l, true); const gvbm = phanCong(l, false);
    seq += 1;
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, consultant_user_id, created_at) VALUES (?,?,?,?, 'active', ?, ?)`)
      .run(`PISA-Q13-${seq}`, `Học viên Q13 ${seq}`, `hoc vien q13 ${seq}`, MB, TVV, NOW).lastInsertRowid);
    const bd = addDays(T2, -7 * 10);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, l, bd, NOW);
    const cy = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, start_period_id, started_at, status, created_at, exam_date, exam_month, exam_period_id)
      VALUES (?,1,'LT1','FT',6.5,?,?, 'active', ?, ?, ?, ?)`)
      .run(sid, week.ensurePeriod(bd).id, bd, NOW, thi.exam_date ?? null, thi.exam_month ?? (thi.exam_date ? thi.exam_date.slice(0, 7) : null), thi.exam_period_id ?? null).lastInsertRowid);
    return { sid, cy, lop: l, gvcn: g, gvbm };
  };

  async function voiMayChu(ngay: string, fn: (goi: (userId: number, url: string, init?: RequestInit) => Promise<Response>) => Promise<void>) {
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
    try { setConfig('demo_date', ngay); xoaNho(); await fn(goi); } finally { may.close(); setConfig('demo_date', cu); xoaNho(); }
  }
  const json = async (r: Response): Promise<any> => { const x = await r.json().catch(() => null); if (!r.ok) throw new Error(`${r.status} ${JSON.stringify(x)}`); return x; };
  const ma = async (r: Response) => { await r.text().catch(() => ''); return r.status; };
  const put = (body: unknown): RequestInit => ({ method: 'PUT', body: JSON.stringify(body) });
  const viec = async (goi: any, uid: number, group: string, sid: number, q = '') => ((await json(await goi(uid, `/my-work${q}`))).dong as any[])
    .flatMap((x: any) => (x.con?.length ? x.con : [x])).filter((x: any) => x.group === group && x.studentId === sid);
  const KQ = { l: 7, r: 6.5, w: 6, s: 6.5 };

  // ------------------------------------------------------------------ 1 · hàm thuần
  check('Q13-1 · trangThaiSauThi: ngày / thi_that_ngay (tuần, tháng = chưa chốt ngày — LT-SV); hạn gốc +7; gia hạn muộn hơn mới có hiệu lực; bước tiếp = muộn hơn của hạn và ngày có kết quả', () => {
    const h = '2026-10-16';
    const a = d.trangThaiSauThi({ exam_date: '2026-10-10' }, h);
    assert(a.giaiDoan === 'da_thi_cho_kq' && a.ngayThi === '2026-10-10' && a.hanGoc === '2026-10-17' && a.han === '2026-10-17' && !a.quaHan && !a.daGiaHan, JSON.stringify(a));
    assert(d.trangThaiSauThi({ exam_week: '2026-10-05' }, h).ngayThi === null, 'LT-SV: tuần chưa phải ngày thi');
    assert(d.trangThaiSauThi({ exam_month: '2026-09' }, h).ngayThi === null && !d.trangThaiSauThi({ exam_month: '2026-09' }, h).quaHan, 'LT-SV: tháng chưa phải ngày thi, không quá hạn');
    assert(d.trangThaiSauThi({ exam_date: '2026-10-01', thi_that_ngay: '2026-10-12' }, h).ngayThi === '2026-10-12', 'thi_that_ngay thắng');
    assert(d.trangThaiSauThi({ exam_date: '2026-10-16' }, h).giaiDoan === 'chua_thi' && d.trangThaiSauThi({ exam_date: '2026-10-15' }, h).giaiDoan === 'da_thi_cho_kq', 'từ hôm sau');
    const g = d.trangThaiSauThi({ exam_date: '2026-10-01', han_sau_thi: '2026-10-20', han_sau_thi_so_lan: 2 }, h);
    assert(g.han === '2026-10-20' && g.daGiaHan && g.soLanGiaHan === 2 && !g.quaHan, JSON.stringify(g));
    assert(d.trangThaiSauThi({ exam_date: '2026-10-15', han_sau_thi: '2026-10-20' }, h).han === '2026-10-22', 'sửa ngày thi muộn hơn → hạn gốc thắng gia hạn sớm hơn');
    const bt = d.trangThaiSauThi({ exam_date: '2026-10-01', ...KQ, thi_that_l: 7, thi_that_r: 6.5, thi_that_w: 6, thi_that_s: 6.5, ngay_kq: '2026-10-16' }, h);
    assert(bt.giaiDoan === 'cho_buoc_tiep' && bt.han === '2026-10-16' && !bt.quaHan, JSON.stringify(bt));
    assert(d.trangThaiSauThi({ exam_date: '2026-10-01', thi_that_khong_thi: 1, buoc_tiep: 'ket_thuc' }, h).giaiDoan === 'xong', 'đã chọn → xong');
    assert(d.LOAI_HAN_CUA_VIEC.thi_that === 'sau-thi' && d.LOAI_HAN_CUA_VIEC.buoc_tiep === 'sau-thi', 'loại hạn sau-thi');
  });

  // ------------------------------------------------------------------ 2 · việc thi_that
  await checkAsync('Q13-2 · việc "Cập nhật kết quả thi thật" hiện HÔM SAU ngày thi, hạn = ngày thi + 7; GVCN có, QL "Tất cả" thấy, GVBM không; lộ trình cũ / em Lưu trữ không', async () => {
    const x = em({ exam_date: TODAY });
    await voiMayChu(TODAY, async (goi) => {
      assert((await viec(goi, x.gvcn, 'thi_that', x.sid)).length === 0, 'thi hôm nay → chưa có việc (không chờ thứ Hai, nhưng từ hôm sau)');
    });
    await voiMayChu(addDays(TODAY, 1), async (goi) => {
      const v = await viec(goi, x.gvcn, 'thi_that', x.sid);
      assert(v.length === 1 && v[0].due === addDays(TODAY, 7) && v[0].mine && v[0].cycleId === x.cy && /^Đã thi .* · hạn /.test(v[0].contextLabel) && v[0].urgency === 'normal', JSON.stringify(v));
      assert((await viec(goi, QL, 'thi_that', x.sid, '?nguoi=tat-ca')).length === 1, 'QL Tất cả thấy');
      assert((await viec(goi, x.gvbm, 'thi_that', x.sid)).length === 0, 'GVBM không');
    });
    await voiMayChu(addDays(TODAY, 8), async (goi) => {
      const v = await viec(goi, x.gvcn, 'thi_that', x.sid);
      assert(v[0]?.urgency === 'overdue', `quá hạn sau +7: ${JSON.stringify(v)}`);
    });
    /* Lộ trình mới hơn (seq 2) → lộ trình cũ không còn nhắc; em Lưu trữ → không nhắc. */
    const y = em({ exam_date: addDays(TODAY, -3) });
    const z = em({ exam_date: addDays(TODAY, -3) });
    conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at) VALUES (?, 2, 'LT2', 'FT', ?, 'active', ?)`).run(y.sid, TODAY, NOW);
    conn.prepare(`UPDATE learning_cycles SET status = 'completed', ended_at = ? WHERE id = ?`).run(TODAY, y.cy);
    conn.prepare('UPDATE students SET archived_at = ? WHERE id = ?').run(NOW, z.sid);
    await voiMayChu(TODAY, async (goi) => {
      assert((await viec(goi, y.gvcn, 'thi_that', y.sid)).length === 0, 'lộ trình không mới nhất → không việc');
      assert((await viec(goi, z.gvcn, 'thi_that', z.sid)).length === 0, 'em Lưu trữ → không việc');
    });
  });

  // ------------------------------------------------------------------ 3 · cùng hạn mọi nơi
  await checkAsync('Q13-3 · cùng hạn ở Công việc · Tổng quan TVV (ô Đã thi · chờ kết quả, Sắp thi không còn em) · Học viên & Lớp TVV / CX · panel một em · hồ sơ', async () => {
    const x = em({ exam_date: addDays(TODAY, -2) });
    const han = addDays(TODAY, 5);
    await voiMayChu(TODAY, async (goi) => {
      const v = await viec(goi, x.gvcn, 'thi_that', x.sid);
      assert(v[0]?.due === han, `Công việc ${JSON.stringify(v)}`);
      const tq = await json(await goi(TVV, '/tong-quan/hoc-vien'));
      const cl = await json(await goi(TVV, '/hoc-vien-lop/theo-vai'));
      assert(cl.ids['da-thi'].includes(x.sid) && !cl.ids['sap-thi'].includes(x.sid) && tq.dem['da-thi'] === cl.ids['da-thi'].length, `Tổng quan ${tq.dem['da-thi']} · chip ${cl.ids['da-thi'].length}`);
      const r = cl.rows.find((h: any) => h.id === x.sid);
      assert(r?.sauThi?.giaiDoan === 'da_thi_cho_kq' && r.sauThi.han === han && cl.viec.ketQuaThi[x.sid]?.han === han, JSON.stringify([r?.sauThi, cl.viec.ketQuaThi[x.sid]]));
      const cx = await json(await goi(CX, '/hoc-vien-lop/theo-vai'));
      assert(cx.rows.find((h: any) => h.id === x.sid)?.sauThi?.han === han, 'CX cùng hạn');
      const pm = await json(await goi(x.gvcn, `/hoc-vien-lop/em/${x.sid}`));
      assert(pm.sauThi?.han === han && pm.sauThi.coTheNhap && pm.sauThi.coTheGiaHan && !pm.sauThi.coTheChon, JSON.stringify(pm.sauThi));
      const pmCx = await json(await goi(CX, `/hoc-vien-lop/em/${x.sid}`));
      assert(pmCx.sauThi && !pmCx.sauThi.coTheGiaHan, 'CX không có nút Gia hạn');
      const hs = await json(await goi(x.gvcn, `/students/${x.sid}`));
      const tv = hs.dauHoSo.viec.cuaBan.find((i: any) => i.loai === 'thi-that');
      assert(hs.sauThi?.han === han && tv?.han === han && tv.key === v[0].key && tv.mo.href.includes('viec=thi-that'), JSON.stringify([hs.sauThi, tv]));
    });
  });

  // ------------------------------------------------------------------ 4 · gia hạn + quyền
  await checkAsync('Q13-4 · Gia hạn / Bỏ gia hạn: GVCN lớp cuối · QL · TVV 200; GVBM · Admin · CX 403; hạn trước hôm nay / không sau hạn gốc 400; nhật ký + Lịch sử sửa "Hạn sau thi"', async () => {
    const x = em({ exam_date: addDays(TODAY, -10) });   // hạn gốc đã qua (TODAY - 3)
    await voiMayChu(TODAY, async (goi) => {
      const moi = addDays(TODAY, 4);
      for (const u of [x.gvbm, ADMIN, CX]) assert(await ma(await goi(u, `/cycles/${x.cy}/han-sau-thi`, put({ han: moi }))) === 403, `vai ${u} phải 403`);
      assert(await ma(await goi(x.gvcn, `/cycles/${x.cy}/han-sau-thi`, put({ han: addDays(TODAY, -1) }))) === 400, 'trước hôm nay 400');
      const r = await json(await goi(x.gvcn, `/cycles/${x.cy}/han-sau-thi`, put({ han: moi, lyDo: 'Chờ phiếu điểm' })));
      assert(r.han === moi && r.daGiaHan && r.soLanGiaHan === 1 && !r.quaHan, JSON.stringify(r));
      const v = await viec(goi, x.gvcn, 'thi_that', x.sid);
      assert(v[0]?.due === moi && v[0].urgency === 'normal' && v[0].daGiaHan && /đã gia hạn/.test(v[0].contextLabel), JSON.stringify(v));
      assert((await json(await goi(QL, `/cycles/${x.cy}/han-sau-thi`, put({ han: addDays(TODAY, 6) })))).soLanGiaHan === 2, 'QL gia hạn lần 2');
      assert((await json(await goi(TVV, `/cycles/${x.cy}/han-sau-thi`, put({ han: addDays(TODAY, 7) })))).han === addDays(TODAY, 7), 'TVV gia hạn');
      assert(one(`SELECT COUNT(*) n FROM audit_logs WHERE action = 'cycle.han_sau_thi' AND entity_id = ?`, x.cy).n === 3
        && one(`SELECT COUNT(*) n FROM journey_events WHERE cycle_id = ? AND event_type = 'han_sau_thi'`, x.cy).n === 3, 'nhật ký + Hành trình');
      const ls = await json(await goi(QL, `/students/${x.sid}/lich-su-sua`));
      assert(ls.dong.flatMap((k: any) => k.truong).some((f: any) => f.ten === 'Hạn sau thi'), 'Lịch sử sửa có "Hạn sau thi"');
      const bo = await json(await goi(x.gvcn, `/cycles/${x.cy}/han-sau-thi`, put({ han: null })));
      assert(bo.han === bo.hanGoc && !bo.daGiaHan && bo.quaHan, `Bỏ gia hạn → hạn gốc: ${JSON.stringify(bo)}`);
      /* Hạn gốc còn tương lai: hạn mới không sau hạn gốc → 400 nói lý do. */
      const y = em({ exam_date: addDays(TODAY, -1) });
      assert(await ma(await goi(y.gvcn, `/cycles/${y.cy}/han-sau-thi`, put({ han: addDays(TODAY, 3) }))) === 400, 'không sau hạn gốc 400');
    });
  });

  // ------------------------------------------------------------------ 5 · sửa ngày thi không chặn
  await checkAsync('Q13-5 · sửa ngày thi sau thi / sau có kết quả → 200, hạn tính lại; gia hạn muộn hơn hạn mới thì giữ', async () => {
    const x = em({ exam_date: addDays(TODAY, -5) });
    await voiMayChu(TODAY, async (goi) => {
      await json(await goi(x.gvcn, `/cycles/${x.cy}`, { method: 'PATCH', body: JSON.stringify({ examDate: addDays(TODAY, -2) }) }));
      assert((await viec(goi, x.gvcn, 'thi_that', x.sid))[0]?.due === addDays(TODAY, 5), 'sau thi: sửa ngày → hạn tính lại');
      await json(await goi(x.gvcn, `/cycles/${x.cy}/han-sau-thi`, put({ han: addDays(TODAY, 12) })));
      await json(await goi(x.gvcn, `/cycles/${x.cy}`, { method: 'PATCH', body: JSON.stringify({ examDate: addDays(TODAY, -1) }) }));
      assert((await viec(goi, x.gvcn, 'thi_that', x.sid))[0]?.due === addDays(TODAY, 12), 'gia hạn muộn hơn giữ');
      await json(await goi(x.gvcn, `/cycles/${x.cy}/outcome`, put({ ...KQ, ngayThi: addDays(TODAY, -1) })));
      assert(await ma(await goi(x.gvcn, `/cycles/${x.cy}`, { method: 'PATCH', body: JSON.stringify({ examDate: addDays(TODAY, -3) }) })) === 200, 'sau có kết quả: sửa ngày thi dự kiến 200');
      assert(await ma(await goi(x.gvcn, `/cycles/${x.cy}/outcome`, put({ ngayThi: addDays(TODAY, -4) }))) === 200, 'sau có kết quả: sửa ngày thi thật 200');
      const bt = (await viec(goi, QL, 'buoc_tiep', x.sid))[0];
      assert(bt?.due === addDays(TODAY, 12) && bt.daGiaHan, `bước tiếp giữ gia hạn: ${JSON.stringify(bt)}`);
    });
  });

  // ------------------------------------------------------------------ 6 · kết quả nhập sau hạn
  await checkAsync('Q13-6 · kết quả nhập SAU hạn → Chọn bước tiếp hạn = ngày nhập (không quá hạn ngay); sửa kết quả hôm sau không dời hạn; chọn bước tiếp không bị chặn', async () => {
    const x = em({ exam_date: addDays(TODAY, -20) });
    await voiMayChu(TODAY, async (goi) => {
      assert((await viec(goi, x.gvcn, 'thi_that', x.sid))[0]?.urgency === 'overdue', 'tiền đề: việc kết quả quá hạn');
      await json(await goi(x.gvcn, `/cycles/${x.cy}/outcome`, put({ ...KQ, ngayThi: addDays(TODAY, -20) })));
      const bt = (await viec(goi, QL, 'buoc_tiep', x.sid))[0];
      assert(bt?.due === TODAY && bt.urgency === 'normal', `bước tiếp: ${JSON.stringify(bt)}`);
    });
    await voiMayChu(addDays(TODAY, 1), async (goi) => {
      await json(await goi(x.gvcn, `/cycles/${x.cy}/outcome`, put({ s: 7 })));
      const bt = (await viec(goi, QL, 'buoc_tiep', x.sid))[0];
      assert(bt?.due === TODAY && bt.urgency === 'overdue', `sửa kết quả không dời hạn: ${JSON.stringify(bt)}`);
      assert(await ma(await goi(QL, `/cycles/${x.cy}/buoc-tiep`, { method: 'POST', body: JSON.stringify({ chon: 'tam_dung' }) })) === 200, 'chọn khi quá hạn: không chặn');
    });
  });

  // ------------------------------------------------------------------ 7 · migrate
  check('Q13-7 · migrate ĐẦY ĐỦ trên bản sao DB demo bỏ 5 cột OV-13q (chưa khoá): thêm cột, lộ trình quá hạn → hôm nay + 7 (so_lan 0, lý do chuyển luật); lần hai không đổi', () => {
    const fs = require('node:fs') as typeof import('node:fs'), os = require('node:os') as typeof import('node:os');
    const pathMod = require('node:path') as typeof import('node:path'), cp = require('node:child_process') as typeof import('node:child_process');
    const qua = em({ exam_date: addDays(TODAY, -30) });   // chưa kết quả, hạn luật mới đã qua
    const dir = fs.mkdtempSync(pathMod.join(os.tmpdir(), 'z2-ov13q-'));
    try {
      const f = pathMod.join(dir, 'cu.sqlite');
      conn.exec(`VACUUM INTO '${f.replace(/'/g, "''")}'`);
      const c = new Database(f);
      for (const k of ['han_sau_thi_so_lan', 'han_sau_thi_ly_do', 'han_sau_thi_luc', 'han_sau_thi_boi', 'han_sau_thi']) c.exec(`ALTER TABLE learning_cycles DROP COLUMN ${k}`);
      c.prepare('DELETE FROM demo_config WHERE key = ?').run(m13q.KHOA_PR_OV13Q);
      c.close();
      const lib = require('node:url').pathToFileURL(pathMod.join(process.cwd(), 'dist-server/server/src/migrate.js')).href;
      const goi = () => cp.spawnSync(process.execPath, ['--input-type=module', '-e', `const m = await import(${JSON.stringify(lib)}); console.log('APPLIED' + JSON.stringify(m.migrate().applied));`],
        { env: { ...process.env, TURSO_DATABASE_URL: '', TURSO_AUTH_TOKEN: '', BAN_CHINH: '', PISA_DB: f }, encoding: 'utf8', timeout: 120_000 });
      const doc = (r: any): string[] => { assert(r.status === 0, `migrate lỗi: ${String(r.stderr).slice(-400)}`); return JSON.parse(String(r.stdout).split('APPLIED').pop()!); };
      /* Rà #436: chạy ĐÚNG tệp dist như chủ SP (node riêng — module nạp từ chính lệnh, bắt được vòng import): kiểm trước ra số, không lỗi. */
      const chay = (tep: string) => cp.spawnSync(process.execPath, [pathMod.join(process.cwd(), 'dist-server/server/src', tep)],
        { env: { ...process.env, TURSO_DATABASE_URL: '', TURSO_AUTH_TOKEN: '', BAN_CHINH: '', PISA_DB: f }, encoding: 'utf8', timeout: 120_000 });
      const kt = chay('ops/kiemTruocOv13q.js');
      assert(kt.status === 0 && /\d+ lộ trình đã thi chưa xong/.test(kt.stdout) && !/ReferenceError/.test(kt.stderr), `kiem-truoc-ov13q: ${kt.status} ${String(kt.stderr).slice(-300)}`);
      const a1 = doc(goi());
      const c2 = new Database(f);
      const dong = c2.prepare('SELECT han_sau_thi, han_sau_thi_so_lan, han_sau_thi_ly_do FROM learning_cycles WHERE id = ?').get(qua.cy) as any;
      const truoc = JSON.stringify(c2.prepare('SELECT id, han_sau_thi, han_sau_thi_luc FROM learning_cycles ORDER BY id').all());
      c2.close();
      assert(a1.some((x) => x.startsWith('OV-13q: thêm cột')) && a1.some((x) => /^OV-13q: \d+ lộ trình/.test(x)), `lần 1: ${JSON.stringify(a1)}`);
      assert(dong.han_sau_thi === addDays(TODAY, 7) && dong.han_sau_thi_so_lan === 0 && dong.han_sau_thi_ly_do === m13q.LY_DO_CHUYEN_LUAT, JSON.stringify(dong));
      const a2 = doc(goi());
      const c3 = new Database(f);
      const sau = JSON.stringify(c3.prepare('SELECT id, han_sau_thi, han_sau_thi_luc FROM learning_cycles ORDER BY id').all());
      c3.close();
      assert(!a2.some((x) => x.startsWith('OV-13q')) && sau === truoc, `lần 2 đổi: ${JSON.stringify(a2)}`);
      const r = chay('migrate/run.js');
      assert(r.status === 0 && /Không có gì để nâng cấp/.test(r.stdout), `migrate/run.js: ${r.status} ${String(r.stdout).slice(-200)} ${String(r.stderr).slice(-300)}`);
    } finally { try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* Windows còn giữ file */ } }
  });

  // ------------------------------------------------------------------ rà #436
  await checkAsync('Q13-9 · em Kết thúc học (lộ trình bỏ dở) CHƯA có kết quả: không việc, không nhãn, không ô Tổng quan, migrate không đặt hạn; đã có kết quả → vẫn Chọn bước tiếp', async () => {
    const x = em({ exam_date: addDays(TODAY, -20) });
    conn.prepare(`UPDATE students SET status = 'finished' WHERE id = ?`).run(x.sid);
    conn.prepare(`UPDATE learning_cycles SET status = 'abandoned', ended_at = ? WHERE id = ?`).run(addDays(TODAY, -15), x.cy);
    const y = em({ exam_date: addDays(TODAY, -20) });
    conn.prepare(`UPDATE students SET status = 'finished' WHERE id = ?`).run(y.sid);
    conn.prepare(`UPDATE learning_cycles SET status = 'abandoned', ended_at = ?, thi_that_ngay = ?, thi_that_l = 6, thi_that_r = 6, thi_that_w = 6, thi_that_s = 6, outcome = 'not_reached', outcome_score = 6 WHERE id = ?`)
      .run(addDays(TODAY, -15), addDays(TODAY, -20), y.cy);
    await voiMayChu(TODAY, async (goi) => {
      assert((await viec(goi, x.gvcn, 'thi_that', x.sid)).length === 0 && (await viec(goi, QL, 'thi_that', x.sid, '?nguoi=tat-ca')).length === 0, 'em thôi học: không việc');
      const pm = await json(await goi(x.gvcn, `/hoc-vien-lop/em/${x.sid}`));
      const hs = await json(await goi(x.gvcn, `/students/${x.sid}`));
      const cl = await json(await goi(TVV, '/hoc-vien-lop/theo-vai'));
      assert(pm.sauThi === null && hs.sauThi === null && !cl.ids['da-thi'].includes(x.sid) && !cl.rows.find((h: any) => h.id === x.sid)?.sauThi, 'không nhãn / ô');
      assert(!m13q.canDatHanOv13q(conn, TODAY).some((c: any) => c.id === x.cy), 'migrate không đặt hạn');
      assert((await viec(goi, QL, 'buoc_tiep', y.sid)).length === 1 && (await json(await goi(QL, `/hoc-vien-lop/em/${y.sid}`))).sauThi?.giaiDoan === 'cho_buoc_tiep', 'có kết quả → vẫn chờ bước tiếp');
    });
  });

  await checkAsync('Q13-10 · gia hạn: ngày không có thật 400; "chờ bước tiếp" chỉ QL / TVV (GVCN 403); hạn = ngày có kết quả (muộn hơn gia hạn) → không ghi "đã gia hạn"', async () => {
    const x = em({ exam_date: addDays(TODAY, -6) });   // hạn gốc = TODAY + 1
    await voiMayChu(TODAY, async (goi) => {
      assert(await ma(await goi(x.gvcn, `/cycles/${x.cy}/han-sau-thi`, put({ han: '2026-09-31' }))) === 400, '31/09 phải 400');
      await json(await goi(x.gvcn, `/cycles/${x.cy}/han-sau-thi`, put({ han: addDays(TODAY, 3) })));
    });
    await voiMayChu(addDays(TODAY, 5), async (goi) => {
      await json(await goi(x.gvcn, `/cycles/${x.cy}/outcome`, put({ ...KQ, ngayThi: addDays(TODAY, -6) })));   // nhập sau gia hạn
      const bt = (await viec(goi, QL, 'buoc_tiep', x.sid))[0];
      assert(bt?.due === addDays(TODAY, 5) && !bt.daGiaHan && !/đã gia hạn/.test(bt.contextLabel), `hạn từ ngày có kết quả: ${JSON.stringify(bt)}`);
      assert(await ma(await goi(x.gvcn, `/cycles/${x.cy}/han-sau-thi`, put({ han: addDays(TODAY, 9) }))) === 403, 'GVCN chờ bước tiếp 403');
      const pm = await json(await goi(x.gvcn, `/hoc-vien-lop/em/${x.sid}`));
      assert(pm.sauThi?.giaiDoan === 'cho_buoc_tiep' && !pm.sauThi.coTheGiaHan, 'GVCN không có nút Gia hạn ở chờ bước tiếp');
      assert((await json(await goi(QL, `/cycles/${x.cy}/han-sau-thi`, put({ han: addDays(TODAY, 9) })))).daGiaHan, 'QL gia hạn được');
    });
  });

  // ------------------------------------------------------------------ 8 · câu SQL
  check('Q13-8 · EXPLAIN: câu việc thi thật / bước tiếp / Học viên & Lớp / migrate không SCAN learning_cycles hay journey_events cho từng em', () => {
    const cau: [string, unknown[]][] = [
      [thiThat.SQL_CHO_KET_QUA_THI, [TODAY]], [buocTiep.SQL_CHO_BUOC_TIEP, []],
      [`SELECT s.id, ${thiThat.cotSauThi('cy', 'rp')} FROM students s
         LEFT JOIN learning_cycles cy ON cy.id = (SELECT x.id FROM learning_cycles x WHERE x.student_id = s.id ORDER BY x.status = 'active' DESC, x.seq DESC LIMIT 1)
         LEFT JOIN report_periods rp ON rp.id = cy.exam_period_id WHERE s.id IN (1, 2, 3)`, []],
    ];
    const loi: string[] = [];
    for (const [sql, args] of cau) {
      const ke = conn.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...args) as any[];
      const cha = new Map(ke.map((r) => [r.id, r]));
      for (const r of ke) {
        if (!/^SCAN (learning_cycles|journey_events|x|j)\b/.test(r.detail)) continue;
        let p = cha.get(r.parent); let tuongQuan = false;
        while (p) { if (/CORRELATED/.test(p.detail)) tuongQuan = true; p = cha.get(p.parent); }
        if (tuongQuan) loi.push(`${r.detail} · ${sql.replace(/\s+/g, ' ').slice(0, 80)}`);
      }
    }
    assert(!loi.length, `quét cả bảng cho từng em:\n        ${loi.join('\n        ')}`);
  });
}
