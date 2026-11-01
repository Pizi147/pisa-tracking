/**
 * PHÉP KIỂM CHUONG-NHE — chuông nhẹ (kế hoạch `docs/superpowers/plans/2026-10-30-toc-do.md`).
 * C1 đồng bộ chuông chỉ đọc lượt lớp đang dạy (giống hệt đường đủ) · C2 mốc đồng bộ lưu ở DB (`users.chuong_dong_bo_luc`).
 */
import fs from 'node:fs';
import path from 'node:path';

export async function runPrChuongNheTests(t: any) {
  const { check, checkAsync, assert, conn, P, TODAY } = t;
  console.log('\nCHUONG-NHE · chuông nhẹ (lượt lớp đang dạy, mốc đồng bộ ở DB)');
  const td: any = await import('../platform/thongBaoTuDong.ts');
  const { loadPrincipal, activeAt } = await import('../permissions.ts');
  const { soCauSql, soDongSql, chayTrongRequest, xoaNho, demHienTai, datMoc: datMocRequest } = await import('../platform/nguCanhRequest.ts');
  /* TL-NEN: như GET có phiên thật ngay sau một lượt quét — mốc quét còn hạn (quét đường đọc không chạy), không nhớ bảng tham chiếu theo tiến trình. */
  const MOC_CON_HAN = () => { const q = { luc: new Date().toISOString(), ngay: TODAY }; return { thamChieu: null, quet: { 'quet:yeu-cau': q, 'quet:lenh': q, 'quet:doi-qua-han': q } }; };
  const mig: any = await import('../migrate/prChuongNhe.ts');
  const { createApp } = await import('../app.ts');
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];

  /** Khoá + nội dung `viecMuon` (đã sắp) và số dòng đọc — đường mới / đường đủ. */
  const chay = (p: any, du: boolean) => {
    td.viecMuonDayDuKhiKiem.bat = du;
    xoaNho();
    try {
      const d0 = soDongSql();
      let cau: string[] = [];
      const m = chayTrongRequest('GET', () => { datMocRequest(MOC_CON_HAN()); const r = td.viecMuon(p, TODAY); cau = [...(demHienTai()?.theoCau.keys() ?? [])]; return r; }) as Map<string, unknown>;
      return { json: JSON.stringify([...m].sort((a, b) => a[0].localeCompare(b[0]))), khoa: [...m.keys()], dong: soDongSql() - d0, cau };
    } finally { td.viecMuonDayDuKhiKiem.bat = false; }
  };
  const khongDay = (p: any) => !p.assignments.some((a: any) => activeAt(a, TODAY));

  check('C1 · viecMuon giống hệt đường đủ — mọi người dùng active; có GV có khoá tudong:cham:*', () => {
    let cham = 0;
    for (const { id } of all(`SELECT id FROM users WHERE status = 'active'`)) {
      const p = loadPrincipal(id);
      const moi = chay(p, false), du = chay(p, true);
      assert(moi.json === du.json, `user ${id}: ${moi.json.slice(0, 300)} ≠ ${du.json.slice(0, 300)}`);
      if (moi.khoa.some((k) => k.startsWith('tudong:cham:'))) cham++;
    }
    assert(cham > 0, 'dữ liệu demo: phải có ít nhất một GV có thông báo Quá hạn chấm (phép so không rỗng)');
  });

  for (const [ten, p] of [['RF2 QL MB', P.mbManager], ['QT (Quản trị)', P.admin]] as const) {
    /* Kế hoạch ghi ÷ 5; demo ít lượt nên phần còn lại (bảng lớp / chương trình, Chốt, Case, Báo PH — không đổi) chiếm ~1/3 → kiểm "không còn câu
       đọc lượt / điểm" + ÷ 3. Dữ liệu thật nhiều lượt hơn hẳn nên tỉ lệ lớn hơn. */
    check(`C1 · ${ten} không dạy lớp nào: Chốt / Case / Báo PH giống đường đủ, không đọc lượt, dòng đọc < đường đủ ÷ 3`, () => {
      assert(khongDay(p), `${ten} phải không có phân công hiệu lực`);
      const moi = chay(p, false), du = chay(p, true);
      assert(moi.json === du.json, `${moi.json.slice(0, 300)} ≠ ${du.json.slice(0, 300)}`);
      const luot = moi.cau.filter((c) => /assessment_(attempts|scores)|^WITH ids|^SELECT a\.\*/.test(c));
      assert(!luot.length && du.cau.some((c) => /assessment_attempts|^SELECT a\.\*/.test(c)), `còn đọc lượt: ${luot.join(' | ')}`);
      assert(moi.dong < du.dong / 3, `dòng mới ${moi.dong}, đường đủ ${du.dong}`);
    });
  }

  check('C2 · migrate chạy hai lần không lỗi; cột có trong schema.sql', () => {
    const ap: string[] = [];
    mig.migratePrChuongNhe(conn, ap); mig.migratePrChuongNhe(conn, ap);
    assert((conn.prepare('PRAGMA table_info(users)').all() as any[]).some((c) => c.name === 'chuong_dong_bo_luc'), 'thiếu cột');
    const sql = fs.readFileSync(path.resolve(process.cwd(), 'server/src/schema.sql'), 'utf8');
    assert(/chuong_dong_bo_luc TEXT/.test(sql), 'schema.sql thiếu cột chuong_dong_bo_luc');
  });

  /** Gọi API thật trong tiến trình (đếm câu / dòng chung với `soCauSql`); phiên dựng trước, không tính. */
  async function voiApp(fn: (goi: (userId: number, url: string, init?: RequestInit) => Promise<Response>) => Promise<void>) {
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
  const moc = (id: number) => (conn.prepare('SELECT chuong_dong_bo_luc AS m FROM users WHERE id = ?').get(id) as any).m as string | null;
  const datMoc = (id: number, m: string | null) => conn.prepare('UPDATE users SET chuong_dong_bo_luc = ? WHERE id = ?').run(m, id);
  const soThongBao = (id: number) => (conn.prepare('SELECT COUNT(*) n, COALESCE(MAX(id), 0) mx FROM notifications WHERE user_id = ?').get(id) as any);

  await checkAsync('C2 · mốc trong 5 phút → GET /notifications không đồng bộ (không ghi notifications), ≤ 15 câu, ≤ 500 dòng — QL, QT, GVCN', async () => {
    await voiApp(async (goi) => {
      for (const [ten, p] of [['QL', P.mbManager], ['QT', P.admin], ['GVCN', P.coreTeacher]] as const) {
        await goi(p.userId, '/ref/branches');   // dựng phiên trước
        datMoc(p.userId, new Date().toISOString());
        conn.prepare(`INSERT INTO notifications (user_id, kind, title, dedup_key, created_at) VALUES (?, 'cham_qua_han', 'việc đã xong', 'tudong:cham:0:0:cn', ?)`).run(p.userId, TODAY);
        const tr = soThongBao(p.userId);
        const c0 = soCauSql(), d0 = soDongSql();
        const r = await goi(p.userId, '/notifications');
        const cau = soCauSql() - c0, dong = soDongSql() - d0;
        assert(r.status === 200, `${ten}: ${r.status}`);
        const sau = soThongBao(p.userId);
        assert(sau.n === tr.n && sau.mx === tr.mx, `${ten}: trong mốc mà vẫn đồng bộ (${JSON.stringify(tr)} → ${JSON.stringify(sau)})`);
        assert(cau <= 15 && dong <= 500, `${ten}: ${cau} câu, ${dong} dòng`);
        conn.prepare(`DELETE FROM notifications WHERE user_id = ? AND dedup_key = 'tudong:cham:0:0:cn'`).run(p.userId);
      }
    });
  });

  await checkAsync('C2 · mốc quá 5 phút → đồng bộ, mốc ghi lại; ghi thành công → mốc NULL → lần GET kế đồng bộ ngay; ghi lỗi giữ mốc', async () => {
    const p = P.mbManager;
    const con = () => !!conn.prepare(`SELECT 1 FROM notifications WHERE user_id = ? AND dedup_key = 'tudong:cham:0:0:cn'`).get(p.userId);
    const gia = () => conn.prepare(`INSERT OR IGNORE INTO notifications (user_id, kind, title, dedup_key, created_at) VALUES (?, 'cham_qua_han', 'việc đã xong', 'tudong:cham:0:0:cn', ?)`).run(p.userId, TODAY);
    await voiApp(async (goi) => {
      await goi(p.userId, '/ref/branches');
      const cu = new Date(Date.now() - 6 * 60_000).toISOString();
      datMoc(p.userId, cu); gia();
      await goi(p.userId, '/notifications');
      assert(!con(), 'quá 5 phút: phải đồng bộ (thông báo việc đã xong hết)');
      const m1 = moc(p.userId);
      assert(!!m1 && m1 > cu, `mốc phải ghi lại: ${m1}`);
      gia();
      const loi = await goi(p.userId, '/tasks', { method: 'POST', body: '{}' });   // đường thật, có phiên, dữ liệu sai → 4xx
      assert(loi.status >= 400, `POST /tasks rỗng phải lỗi: ${loi.status}`);
      await new Promise((r) => setTimeout(r, 50));
      assert(moc(p.userId) === m1, 'ghi lỗi: mốc giữ');
      const ok = await goi(p.userId, '/notifications/doc-het', { method: 'POST', body: '{}' });
      assert(ok.status < 400, `doc-het: ${ok.status}`);
      await new Promise((r) => setTimeout(r, 50));
      assert(moc(p.userId) === null, `ghi thành công: mốc phải NULL (${moc(p.userId)})`);
      await goi(p.userId, '/notifications');
      assert(!con(), 'sau ghi: lần mở chuông kế đồng bộ ngay');
      assert(!!moc(p.userId), 'đồng bộ xong ghi mốc mới');
    });
    for (const x of [P.mbManager, P.admin, P.coreTeacher]) datMoc(x.userId, null);
  });

  await checkAsync('C2 · ghi mốc lỗi (giả lỗi DB) → GET /notifications vẫn 200, vẫn đồng bộ', async () => {
    const p = P.mbManager;
    const gia = () => conn.prepare(`INSERT OR IGNORE INTO notifications (user_id, kind, title, dedup_key, created_at) VALUES (?, 'cham_qua_han', 'việc đã xong', 'tudong:cham:0:0:cn', ?)`).run(p.userId, TODAY);
    const loiCu = console.error;
    await voiApp(async (goi) => {
      await goi(p.userId, '/ref/branches');
      datMoc(p.userId, null); gia();
      conn.exec(`CREATE TEMP TRIGGER cn_gia_loi BEFORE UPDATE OF chuong_dong_bo_luc ON users BEGIN SELECT RAISE(ABORT, 'giả lỗi ghi mốc'); END`);
      console.error = () => {};
      try {
        const r = await goi(p.userId, '/notifications');
        assert(r.status === 200, `ghi mốc lỗi mà chuông ${r.status}`);
        assert(!conn.prepare(`SELECT 1 FROM notifications WHERE user_id = ? AND dedup_key = 'tudong:cham:0:0:cn'`).get(p.userId), 'ghi mốc lỗi: vẫn phải đồng bộ');
      } finally { console.error = loiCu; conn.exec('DROP TRIGGER IF EXISTS cn_gia_loi'); }
    });
  });
}
