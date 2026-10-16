/**
 * PHÉP KIỂM OV-13m (chủ SP 15/10) — Có kết quả thi thật → lộ trình "Đã xong" + Bước tiếp (Lộ trình mới · Tạm dừng · Thôi học), gọi QUA HTTP như bản chính.
 *  1 · lưu kết quả (em còn ghi danh) → việc Chọn bước tiếp sinh ngay, "Đã xong · OVR 6.5 · Đạt Target", số Công việc = Tổng quan TVV · 2 · quyền (QL / TVV 200,
 *  GVCN / GV / CX 403) · 3 · Thôi học + Hoàn tác · 4 · Tạm dừng + Quay lại học (= Lộ trình mới) · 5 · Lộ trình mới lớp này ngay (tuần này = tuần 1, Target giữ / Sửa)
 *  + Hoàn tác · 6 · lớp khác ngay (đúng đường Chuyển lớp, lộ trình MỚI, điểm cũ ở lại) · 7 · lớp khác hẹn tuần + Huỷ hẹn + tới tuần tự chuyển · 8 · lớp này hẹn
 *  tuần → tới tuần tự bắt đầu · 9 · migrate hai lần · 10 · Lịch sử sửa có "Bước tiếp" · 11 · sửa kèm: khoá mốc "Sang lộ trình" hai lần đổi trong ngày.
 * Không bọc giao dịch (mỗi lần gọi API tự mở giao dịch) — mỗi mục dựng lớp / em riêng; chạy cuối `run.ts`.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv13mTests(t: YThucTestKit) {
  const { checkAsync, check, assert, conn, TODAY, P, addDays } = t;
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const sysClose: any = await import('../cases/systemClose.ts');
  const { migratePrOv13m } = await import('../migrate/prOv13m.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { getConfig, setConfig } = await import('../demoConfig.ts');
  const { createApp } = await import('../app.ts');
  const { xoaNho, soCauSql } = await import('../platform/nguCanhRequest.ts');
  console.log('\nOV-13m · Bước tiếp sau thi thật (qua HTTP)');

  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const QL = P.mbManager.userId as number;
  const MB = one(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const NOW = new Date().toISOString();
  const T2 = week.mondayOf(TODAY) as string;
  const TUAN_SAU = addDays(T2, 7) as string;
  let seq = 0;
  const nguoi = (role: string, branches: string[]) => {
    seq += 1;
    return accounts.createAccount(P.admin, { email: `ov13m.${seq}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-ov13m', fullName: `Thử OV13m ${seq}`, roles: [{ role, branches }] }).userId as number;
  };
  const TVV = nguoi('consultant', ['MB']);
  const CX = nguoi('cx', []);
  const GV_KHAC = nguoi('teacher', ['MB']);
  const lop = (route = 'LT1') => {
    seq += 1;
    const start = addDays(T2, -7 * 10);
    return intake.createClass(P.admin, { code: `MB M13-${seq}`, branchId: MB, kind: 'FT', isFastTrack: true, route, startDate: start, startPeriodId: week.ensurePeriod(start).id }).id as number;
  };
  /** GVCN mới của lớp (tài khoản riêng: không chạm phân công lớp seed). */
  const gvcn = (classId: number) => {
    const uid = nguoi('teacher', ['MB']);
    conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,NULL,1,'2026-01-01','active',?)`).run(uid, classId, NOW);
    return uid;
  };
  /** Em đang học lớp FT, lộ trình LT1 Target 6.5 bắt đầu 10 tuần trước, một MT1 có điểm (điểm cũ phải ở lại lộ trình cũ). */
  const em = (classId: number) => {
    seq += 1;
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-M13-${seq}`, `Học viên M13 ${seq}`, `hoc vien m13 ${seq}`, MB, NOW).lastInsertRowid);
    const bd = addDays(T2, -7 * 10);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, classId, bd, NOW);
    const cy = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, start_period_id, started_at, status, created_at) VALUES (?,1,'LT1','FT',6.5,?,?, 'active', ?)`)
      .run(sid, week.ensurePeriod(bd).id, bd, NOW).lastInsertRowid);
    const a = Number(conn.prepare(`INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, status, created_at) VALUES (?,?,1,'mock',?,?,'completed',?)`)
      .run(cy, sid, classId, week.ensurePeriod(addDays(T2, -7 * 4)).id, NOW).lastInsertRowid);
    conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, band, entered_at) VALUES (?, 'listening', 6, ?)`).run(a, NOW);
    return { sid, cy };
  };

  /** Máy chủ thật (mẫu prOv13h): `ngay` = ngày demo trong lúc gọi; trả `goi(userId, url, init)`. */
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
  const post = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) });
  const KQ = { ngayThi: addDays(TODAY, -5), l: 7, r: 6.5, w: 6, s: 6.5 };   // OVR 6.5 = Target → Đạt
  const viecBt = (w: any) => ((w.dong ?? []) as any[]).flatMap((x: any) => (x.con?.length ? x.con : [x])).filter((x: any) => x.group === 'buoc_tiep');
  const hs = (sid: number) => one('SELECT status, archived_at FROM students WHERE id = ?', sid);
  const lt = (cy: number) => one('SELECT * FROM learning_cycles WHERE id = ?', cy);
  const dangChay = (sid: number) => all(`SELECT * FROM learning_cycles WHERE student_id = ? AND status = 'active'`, sid);
  const ghiDanh = (sid: number) => one(`SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'active'`, sid)?.class_id ?? null;
  /** Lớp + em + GVCN nhập kết quả thi thật qua HTTP. */
  const coKetQua = async (goi: any, l = lop()) => {
    const g = gvcn(l); const e = em(l);
    await json(await goi(g, `/cycles/${e.cy}/outcome`, { method: 'PUT', body: JSON.stringify(KQ) }));
    return { ...e, lop: l, gvcn: g };
  };

  await checkAsync('M13-1 · lưu kết quả (em còn học) → lộ trình "Đã xong", việc Chọn bước tiếp sinh ngay (OV-13q: hạn = ngày thi + 7), số Tổng quan TVV = góc Cần làm TVV', async () => {
    await voiMayChu(TODAY, async (goi) => {
      const x = await coKetQua(goi);
      assert(hs(x.sid).status === 'active' && lt(x.cy).status === 'active', 'lưu kết quả không đóng lộ trình / không đổi trạng thái em');
      const bt = await json(await goi(QL, `/cycles/${x.cy}/buoc-tiep`));
      assert(bt.daXong === 'Đã xong · OVR 6.5 · Đạt Target' && bt.chon === null && bt.coTheChon && bt.han === addDays(TODAY, 2) && bt.target === '6.5' && bt.lopNay?.id === x.lop, JSON.stringify(bt));
      const v = viecBt(await json(await goi(QL, '/my-work'))).filter((i: any) => i.studentId === x.sid);
      assert(v.length === 1 && v[0].tieuDe === 'Chọn bước tiếp' && v[0].due === addDays(TODAY, 2) && /OVR 6\.5 · Đạt Target/.test(v[0].reason) && v[0].href.includes(`buoc-tiep=${x.cy}`), JSON.stringify(v));
      const dong = (await json(await goi(QL, `/students/${x.sid}/lo-trinh`))) as any[];
      assert(dong[0].buocTiep?.daXong === bt.daXong, JSON.stringify(dong[0]));
      const hoSo = await json(await goi(QL, `/students/${x.sid}`));
      assert(hoSo.buocTiep?.daXong === bt.daXong && hoSo.dauHoSo.viec.cuaBan.some((i: any) => i.loai === 'buoc-tiep' && i.chu === bt.daXong), JSON.stringify(hoSo.dauHoSo.viec.cuaBan));
      /* TVV: ô Tổng quan "Chờ chọn bước tiếp" = góc Cần làm (Học viên & Lớp) — cùng tập em. */
      conn.prepare('UPDATE students SET consultant_user_id = ? WHERE id = ?').run(TVV, x.sid);   // em của TVV (phạm vi "Của tôi" của cả hai màn)
      const tq = await json(await goi(TVV, '/tong-quan/hoc-vien'));
      const cl = await json(await goi(TVV, '/hoc-vien-lop/theo-vai'));
      assert(String(x.sid) in cl.viec.buocTiep && tq.dem['cho-buoc-tiep'] === Object.keys(cl.viec.buocTiep).length, `Tổng quan ${tq.dem['cho-buoc-tiep']} · Cần làm ${Object.keys(cl.viec.buocTiep).length}`);
    });
  });

  await checkAsync('M13-2 · quyền: QL / TVV chọn được (200); GVCN chỉ đọc (GET coTheChon=false), GVCN / GV khác / CX chọn → 403', async () => {
    await voiMayChu(TODAY, async (goi) => {
      const x = await coKetQua(goi);
      const doc = await json(await goi(x.gvcn, `/cycles/${x.cy}/buoc-tiep`));
      assert(doc.coTheChon === false && doc.daXong.startsWith('Đã xong'), JSON.stringify(doc));
      for (const u of [x.gvcn, GV_KHAC, CX]) {
        const r = await goi(u, `/cycles/${x.cy}/buoc-tiep`, post({ chon: 'ket_thuc' }));
        assert(r.status === 403, `người ${u}: ${r.status}`);
      }
      assert(!lt(x.cy).buoc_tiep, 'không ai ghi được');
      assert((await goi(TVV, `/cycles/${x.cy}/buoc-tiep`, post({ chon: 'tam_dung' }))).status === 200, 'TVV');
      assert((await goi(QL, `/cycles/${x.cy}/buoc-tiep`, { method: 'DELETE' })).status === 200, 'QL hoàn tác');
    });
  });

  await checkAsync('M13-3 · Thôi học = Kết thúc học + Lưu trữ (lộ trình đóng, hết việc); Hoàn tác → em đang học, lộ trình mở lại, việc quay lại', async () => {
    await voiMayChu(TODAY, async (goi) => {
      const x = await coKetQua(goi);
      const r = await json(await goi(QL, `/cycles/${x.cy}/buoc-tiep`, post({ chon: 'ket_thuc' })));
      assert(r.chon === 'ket_thuc' && hs(x.sid).status === 'finished' && !!hs(x.sid).archived_at && lt(x.cy).status !== 'active', JSON.stringify([r, hs(x.sid), lt(x.cy).status]));
      assert(!viecBt(await json(await goi(QL, '/my-work'))).some((i: any) => i.studentId === x.sid), 'hết việc');
      assert(one(`SELECT title FROM journey_events WHERE cycle_id = ? AND event_type = 'buoc_tiep' ORDER BY id DESC LIMIT 1`, x.cy).title === 'Sau thi: Thôi học', 'mốc Hành trình');
      await json(await goi(QL, `/cycles/${x.cy}/buoc-tiep`, { method: 'DELETE' }));
      assert(hs(x.sid).status === 'active' && !hs(x.sid).archived_at && lt(x.cy).status === 'active' && !lt(x.cy).buoc_tiep, JSON.stringify([hs(x.sid), lt(x.cy).status]));
      assert(!one(`SELECT 1 x FROM ban_chup_lo_trinh WHERE cycle_id = ?`, x.cy), 'hoàn tác Thôi học gỡ bản chụp lúc đóng');
      assert(viecBt(await json(await goi(QL, '/my-work'))).some((i: any) => i.studentId === x.sid), 'việc quay lại');
    });
  });

  await checkAsync('M13-4 · Tạm dừng (TVV): đóng lộ trình + em Tạm dừng; Quay lại học = Lộ trình mới lớp này → em đang học, lộ trình MỚI tuần này là tuần 1, Target giữ', async () => {
    await voiMayChu(TODAY, async (goi) => {
      const x = await coKetQua(goi);
      await json(await goi(TVV, `/cycles/${x.cy}/buoc-tiep`, post({ chon: 'tam_dung' })));
      assert(hs(x.sid).status === 'inactive' && lt(x.cy).status === 'completed' && lt(x.cy).buoc_tiep === 'tam_dung' && !dangChay(x.sid).length, JSON.stringify([hs(x.sid), lt(x.cy)]));
      assert(one(`SELECT ly_do FROM ban_chup_lo_trinh WHERE cycle_id = ? ORDER BY lan DESC LIMIT 1`, x.cy).ly_do === 'tam_dung', 'bản chụp');
      const r = await json(await goi(TVV, `/cycles/${x.cy}/buoc-tiep`, post({ chon: 'lo_trinh_moi', batDau: 'ngay' })));
      const moi = dangChay(x.sid);
      assert(r.chon === 'lo_trinh_moi' && hs(x.sid).status === 'active' && ghiDanh(x.sid) === x.lop && moi.length === 1 && moi[0].seq === 2, JSON.stringify([r, hs(x.sid), moi]));
      assert(moi[0].started_at === TODAY && one('SELECT week_start w FROM report_periods WHERE id = ?', moi[0].start_period_id).w === T2 && moi[0].target_score === 6.5, JSON.stringify(moi[0]));
      assert(one('SELECT COUNT(*) n FROM assessment_attempts WHERE cycle_id = ? AND status = \'completed\'', x.cy).n === 1, 'điểm cũ ở lại lộ trình cũ');
    });
  });

  await checkAsync('M13-5 · Lộ trình mới · Lớp này · Ngay bây giờ (QL, Target Sửa 7.0): lộ trình cũ đóng, lộ trình mới ở lớp cũ; Hoàn tác gỡ lộ trình mới, trả lộ trình cũ', async () => {
    await voiMayChu(TODAY, async (goi) => {
      const x = await coKetQua(goi);
      const s0 = soCauSql();
      await json(await goi(QL, `/cycles/${x.cy}/buoc-tiep`, post({ chon: 'lo_trinh_moi', batDau: 'ngay', mucTieu: 7 })));
      const cau = soCauSql() - s0;
      const moi = dangChay(x.sid);
      assert(lt(x.cy).status === 'completed' && moi.length === 1 && moi[0].id !== x.cy && moi[0].target_score === 7 && ghiDanh(x.sid) === x.lop && hs(x.sid).status === 'active', JSON.stringify([lt(x.cy).status, moi]));
      assert(cau < 150, `${cau} câu SQL`);
      console.log(`      (đo: ${cau} câu một lời gọi)`);
      await json(await goi(QL, `/cycles/${x.cy}/buoc-tiep`, { method: 'DELETE' }));
      const sau = dangChay(x.sid);
      assert(sau.length === 1 && sau[0].id === x.cy && !lt(x.cy).buoc_tiep && hs(x.sid).status === 'active' && !one('SELECT 1 x FROM learning_cycles WHERE id = ?', moi[0].id), JSON.stringify(sau));
    });
  });

  await checkAsync('M13-6 · Lộ trình mới · Lớp khác · Ngay bây giờ: đúng đường Chuyển lớp (lệnh đã chuyển, hạn bàn giao ≥ 7 ngày), lộ trình MỚI ở lớp mới, điểm cũ ở lại', async () => {
    await voiMayChu(TODAY, async (goi) => {
      const x = await coKetQua(goi);
      const dich = lop('LT2'); gvcn(dich);
      const s0 = soCauSql();
      const r = await json(await goi(QL, `/cycles/${x.cy}/buoc-tiep`, post({ chon: 'lo_trinh_moi', lopMoiId: dich, batDau: 'ngay' })));
      const cau = soCauSql() - s0;
      const l = one('SELECT * FROM lenh_chuyen_lop WHERE student_id = ? ORDER BY id DESC LIMIT 1', x.sid);
      const moi = dangChay(x.sid);
      assert(r.chon === 'lo_trinh_moi' && l?.trang_thai === 'da_chuyen' && l.tuan_bat_dau === TODAY && l.han_gvcn >= addDays(TODAY, 6), JSON.stringify(l));
      assert(ghiDanh(x.sid) === dich && moi.length === 1 && moi[0].id !== x.cy && moi[0].route === 'LT2' && moi[0].target_score === 6.5 && lt(x.cy).status === 'completed', JSON.stringify(moi));
      assert(one(`SELECT ly_do FROM ban_chup_lo_trinh WHERE cycle_id = ? ORDER BY lan DESC LIMIT 1`, x.cy).ly_do === 'lo_trinh_moi', 'bản chụp lộ trình cũ: Lộ trình mới (không phải "chuyển lớp")');
      assert(one(`SELECT class_id FROM assessment_attempts WHERE cycle_id = ? AND status = 'completed'`, x.cy).class_id === x.lop, 'điểm cũ ở lại lớp cũ');
      assert(cau < 150, `${cau} câu SQL`);
      console.log(`      (đo: ${cau} câu một lời gọi)`);
      assert((await goi(QL, `/cycles/${x.cy}/buoc-tiep`, { method: 'DELETE' })).status === 409, 'chuyển ngay không hoàn tác');
      assert((await json(await goi(QL, `/cycles/${x.cy}/buoc-tiep`))).hoanTacDuoc === false, 'web ẩn Hoàn tác (cờ hoanTacDuoc)');
    });
  });

  await checkAsync('M13-7 · Lộ trình mới · Lớp khác · hẹn tuần sau: lệnh chờ + "Hẹn bắt đầu"; Huỷ hẹn → về Chọn bước tiếp; hẹn lại → tới Thứ Hai tự chuyển, lộ trình mới bắt đầu Thứ Hai đó', async () => {
    let x: any; let dich = 0;
    await voiMayChu(TODAY, async (goi) => {
      x = await coKetQua(goi);
      dich = lop('LT1'); gvcn(dich);
      const r = await json(await goi(QL, `/cycles/${x.cy}/buoc-tiep`, post({ chon: 'lo_trinh_moi', lopMoiId: dich, batDau: TUAN_SAU })));
      const l = one('SELECT * FROM lenh_chuyen_lop WHERE student_id = ? ORDER BY id DESC LIMIT 1', x.sid);
      assert(r.hen === TUAN_SAU && l.trang_thai === 'cho' && l.tuan_bat_dau === TUAN_SAU && lt(x.cy).status === 'active' && ghiDanh(x.sid) === x.lop, JSON.stringify([r, l]));
      await json(await goi(QL, `/cycles/${x.cy}/buoc-tiep`, { method: 'DELETE' }));
      assert(one('SELECT trang_thai FROM lenh_chuyen_lop WHERE id = ?', l.id).trang_thai === 'huy' && !lt(x.cy).buoc_tiep && !lt(x.cy).buoc_tiep_hen, 'Huỷ hẹn');
      assert(viecBt(await json(await goi(QL, '/my-work'))).some((i: any) => i.studentId === x.sid), 'việc quay lại');
      await json(await goi(QL, `/cycles/${x.cy}/buoc-tiep`, post({ chon: 'lo_trinh_moi', lopMoiId: dich, batDau: TUAN_SAU })));
    });
    await voiMayChu(TUAN_SAU, async (goi) => {
      await json(await goi(QL, `/cycles/${x.cy}/buoc-tiep`));
      const moi = dangChay(x.sid);
      assert(ghiDanh(x.sid) === dich && moi.length === 1 && moi[0].id !== x.cy && moi[0].started_at === TUAN_SAU && lt(x.cy).status === 'completed', JSON.stringify(moi));
    });
  });

  await checkAsync('M13-8 · Lộ trình mới · Lớp này · hẹn tuần sau: chưa đổi gì (em chờ); tới Thứ Hai tự bắt đầu ở lớp cũ (tuần đó = tuần 1), hết "Hẹn"', async () => {
    let x: any;
    await voiMayChu(TODAY, async (goi) => {
      x = await coKetQua(goi);
      const r = await json(await goi(TVV, `/cycles/${x.cy}/buoc-tiep`, post({ chon: 'lo_trinh_moi', batDau: TUAN_SAU })));
      assert(r.hen === TUAN_SAU && r.henLop && lt(x.cy).status === 'active' && hs(x.sid).status === 'active' && dangChay(x.sid).length === 1, JSON.stringify(r));
      assert(!(String(x.sid) in (await json(await goi(TVV, '/hoc-vien-lop/theo-vai?phamVi=chi-nhanh'))).viec.buocTiep), 'đã chọn → hết việc');
      assert((await goi(TVV, `/cycles/${x.cy}/buoc-tiep`, post({ chon: 'lo_trinh_moi', batDau: addDays(TUAN_SAU, 1) }))).status === 400, 'không phải Thứ Hai → 400');
    });
    await voiMayChu(TUAN_SAU, async (goi) => {
      const r = await json(await goi(QL, `/cycles/${x.cy}/buoc-tiep`));
      const moi = dangChay(x.sid);
      assert(r.hen === null && moi.length === 1 && moi[0].id !== x.cy && moi[0].started_at === TUAN_SAU && moi[0].target_score === 6.5 && ghiDanh(x.sid) === x.lop, JSON.stringify([r, moi]));
      assert(one('SELECT week_start w FROM report_periods WHERE id = ?', moi[0].start_period_id).w === TUAN_SAU, 'tuần 1 = tuần hẹn');
    });
  });

  await checkAsync('M13-12 · rà #422: Target sai (abc · 9,5) → 400 ở hẹn lớp này / lớp khác / ngay; không ghi gì', async () => {
    await voiMayChu(TODAY, async (goi) => {
      const x = await coKetQua(goi);
      const dich = lop('LT1'); gvcn(dich);
      for (const than of [{ batDau: TUAN_SAU, mucTieu: 'abc' }, { batDau: TUAN_SAU, mucTieu: '9,5' }, { lopMoiId: dich, batDau: 'ngay', mucTieu: 'abc' }, { lopMoiId: dich, batDau: TUAN_SAU, mucTieu: '9,5' }]) {
        const r = await goi(QL, `/cycles/${x.cy}/buoc-tiep`, post({ chon: 'lo_trinh_moi', ...than }));
        assert(r.status === 400, `${JSON.stringify(than)} → ${r.status}`);
      }
      assert(!lt(x.cy).buoc_tiep && !one('SELECT 1 x FROM lenh_chuyen_lop WHERE student_id = ?', x.sid), 'không ghi lựa chọn / lệnh');
    });
  });

  await checkAsync('M13-13 · rà #422: hẹn tới tuần mà không bắt đầu được → ghi MỘT lần, lộ trình về "Chọn bước tiếp" (có việc), không thử lại mãi', async () => {
    let x: any;
    await voiMayChu(TODAY, async (goi) => {
      x = await coKetQua(goi);
      await json(await goi(QL, `/cycles/${x.cy}/buoc-tiep`, post({ chon: 'lo_trinh_moi', batDau: TUAN_SAU })));
      conn.prepare(`UPDATE learning_cycles SET buoc_tiep_json = json_set(buoc_tiep_json, '$.mucTieu', 'abc') WHERE id = ?`).run(x.cy);   // dữ liệu hẹn hỏng (đường cũ)
    });
    await voiMayChu(TUAN_SAU, async (goi) => {
      await goi(QL, `/cycles/${x.cy}/buoc-tiep`);
      xoaNho();
      const bt = await json(await goi(QL, `/cycles/${x.cy}/buoc-tiep`));
      const moc = one(`SELECT COUNT(*) n FROM journey_events WHERE cycle_id = ? AND title = 'Sau thi: hẹn bắt đầu không thành'`, x.cy).n;
      assert(bt.chon === null && bt.hen === null && lt(x.cy).status === 'active' && dangChay(x.sid).length === 1 && moc === 1, JSON.stringify([bt, moc]));
      assert(viecBt(await json(await goi(QL, '/my-work'))).some((i: any) => i.studentId === x.sid), 'việc Chọn bước tiếp hiện lại');
      assert(one(`SELECT COUNT(*) n FROM notifications WHERE kind = 'buoc_tiep_loi' AND entity_id = ?`, x.sid).n === 1, 'báo người đã chọn một lần');
    });
  });

  await checkAsync('M13-14 · rà #422: Case mở của lộ trình đã xong — Lớp khác ngay / hẹn tới tuần → Case đóng, không bàn giao, GV lớp mới không có việc Case cũ', async () => {
    const caseMo = (sid: number, cy: number) => Number(conn.prepare(`INSERT INTO sos_cases (student_id, cycle_id, category, topic, origin_kind, status, sos_level, detected_at, created_at) VALUES (?,?, 'listening', 'listening', 'teacher_report', 'open', 1, ?, ?)`)
      .run(sid, cy, TODAY, NOW).lastInsertRowid);
    for (const batDau of ['ngay', TUAN_SAU]) {
      let x: any; let cid = 0; let dich = 0; let gvMoi = 0;
      await voiMayChu(TODAY, async (goi) => {
        x = await coKetQua(goi);
        cid = caseMo(x.sid, x.cy);
        dich = lop('LT1'); gvMoi = gvcn(dich);
        await json(await goi(QL, `/cycles/${x.cy}/buoc-tiep`, post({ chon: 'lo_trinh_moi', lopMoiId: dich, batDau })));
      });
      await voiMayChu(batDau === 'ngay' ? TODAY : TUAN_SAU, async (goi) => {
        await goi(QL, `/cycles/${x.cy}/buoc-tiep`);
        assert(ghiDanh(x.sid) === dich && one('SELECT status FROM sos_cases WHERE id = ?', cid).status === 'done', `${batDau}: ${JSON.stringify(one('SELECT status, owner_user_id FROM sos_cases WHERE id = ?', cid))}`);
        for (const [u, url] of [[gvMoi, '/my-work'], [QL, '/my-work?nguoi=tat-ca']] as const) {
          const w = await json(await goi(u, url));
          assert(!JSON.stringify(w).includes(`"caseId":${cid},`), `${batDau}: người ${u} còn việc Case cũ`);
        }
      });
    }
  });

  await checkAsync('M13-15 · rà #422: Tạm dừng → Quay lại học (hẹn) → Huỷ hẹn → Hoàn tác → em đang học, lộ trình mở lại', async () => {
    await voiMayChu(TODAY, async (goi) => {
      const x = await coKetQua(goi);
      await json(await goi(QL, `/cycles/${x.cy}/buoc-tiep`, post({ chon: 'tam_dung' })));
      await json(await goi(QL, `/cycles/${x.cy}/buoc-tiep`, post({ chon: 'lo_trinh_moi', batDau: TUAN_SAU })));
      const huy = await json(await goi(QL, `/cycles/${x.cy}/buoc-tiep`, { method: 'DELETE' }));
      assert(huy.chon === 'tam_dung' && hs(x.sid).status === 'inactive', `Huỷ hẹn → về Tạm dừng: ${JSON.stringify([huy.chon, hs(x.sid)])}`);
      const ht = await json(await goi(QL, `/cycles/${x.cy}/buoc-tiep`, { method: 'DELETE' }));
      assert(ht.chon === null && hs(x.sid).status === 'active' && lt(x.cy).status === 'active', JSON.stringify([ht.chon, hs(x.sid), lt(x.cy).status]));
    });
  });

  await checkAsync('M13-16 · rà #422: lưu lại đúng lựa chọn (bấm đúp) → không làm lại (lệnh giữ, không chuông huỷ; Lớp này ngay lần hai < 30 câu)', async () => {
    await voiMayChu(TODAY, async (goi) => {
      const x = await coKetQua(goi);
      const dich = lop('LT1'); gvcn(dich);
      const than = post({ chon: 'lo_trinh_moi', lopMoiId: dich, batDau: TUAN_SAU });
      await json(await goi(QL, `/cycles/${x.cy}/buoc-tiep`, than));
      const l1 = one('SELECT id FROM lenh_chuyen_lop WHERE student_id = ? ORDER BY id DESC LIMIT 1', x.sid).id;
      await json(await goi(QL, `/cycles/${x.cy}/buoc-tiep`, post({ chon: 'lo_trinh_moi', lopMoiId: dich, batDau: TUAN_SAU })));
      assert(one('SELECT COUNT(*) n FROM lenh_chuyen_lop WHERE student_id = ?', x.sid).n === 1 && one('SELECT trang_thai t FROM lenh_chuyen_lop WHERE id = ?', l1).t === 'cho'
        && !one(`SELECT 1 x FROM notifications WHERE kind = 'huy_lenh' AND entity_id = ?`, x.sid), 'lệnh giữ, không huỷ');
      const y = await coKetQua(goi);
      await json(await goi(QL, `/cycles/${y.cy}/buoc-tiep`, post({ chon: 'lo_trinh_moi', batDau: 'ngay' })));
      const s0 = soCauSql();
      await json(await goi(QL, `/cycles/${y.cy}/buoc-tiep`, post({ chon: 'lo_trinh_moi', batDau: 'ngay' })));
      const cau = soCauSql() - s0;
      assert(cau < 30 && dangChay(y.sid).length === 1 && one('SELECT COUNT(*) n FROM learning_cycles WHERE student_id = ?', y.sid).n === 2, `${cau} câu`);
    });
  });

  check('M13-9 · migrate prOv13m: cột buoc_tiep_hen có sẵn → chạy lại hai lần không đổi gì', () => {
    const a: string[] = [];
    migratePrOv13m(conn, a); migratePrOv13m(conn, a);
    assert(!a.length && all('SELECT name FROM pragma_table_info(?)', 'learning_cycles').some((c) => c.name === 'buoc_tiep_hen'), JSON.stringify(a));
  });

  await checkAsync('M13-10 · Lịch sử sửa: lựa chọn Bước tiếp hiện theo trường (Bước tiếp · Hẹn bắt đầu)', async () => {
    await voiMayChu(TODAY, async (goi) => {
      const x = await coKetQua(goi);
      await json(await goi(QL, `/cycles/${x.cy}/buoc-tiep`, post({ chon: 'lo_trinh_moi', batDau: TUAN_SAU })));
      const ls = await json(await goi(QL, `/students/${x.sid}/lich-su-sua`));
      const tr = ls.dong.flatMap((d: any) => d.truong);
      assert(tr.some((f: any) => f.ten === 'Bước tiếp' && f.cu === null && f.moi === 'Lộ trình mới') && tr.some((f: any) => f.ten === 'Hẹn bắt đầu' && f.moi), JSON.stringify(tr));
    });
  });

  check('M13-11 · sửa kèm: mốc "Sang lộ trình" LT1 → LT2 → LT1 → LT2 cùng ngày → đủ bốn mốc (khoá có số lần đổi trong ngày)', () => {
    const c = one(`SELECT id, student_id, cycle_id FROM sos_cases WHERE status != 'done' AND cycle_id IS NOT NULL ORDER BY id LIMIT 1`);
    conn.exec('BEGIN IMMEDIATE');
    try {
      const n0 = one(`SELECT COUNT(*) n FROM case_milestones WHERE case_id = ? AND kind = 'route_changed'`, c.id).n;
      for (const r of ['LT2', 'LT1', 'LT2', 'LT1']) sysClose.chuyenCaseSangLoTrinh(null, c.student_id, c.cycle_id, c.cycle_id, r, TODAY);
      const n = one(`SELECT COUNT(*) n FROM case_milestones WHERE case_id = ? AND kind = 'route_changed'`, c.id).n - n0;
      assert(n === 4, `${n} mốc`);
    } finally { conn.exec('ROLLBACK'); }
  });
  void loadPrincipal;
}
