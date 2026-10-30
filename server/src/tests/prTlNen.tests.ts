/**
 * PHÉP KIỂM TL-NEN (TRANG-LON S3, kế hoạch `docs/superpowers/plans/2026-10-31-trang-lon.md`):
 * N1 bảng tham chiếu nhớ theo tiến trình, khoá bằng phiên bản DB (`moc_he_thong` 'tham-chieu' + 15 trigger) ·
 * N2 quét đường đọc theo mốc DB toàn hệ thống (60 s, sau mỗi lần ghi qua API, sang ngày nghiệp vụ).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

export async function runPrTlNenTests(t: any) {
  const { check, checkAsync, assert, P, TODAY } = t;
  console.log('\nTL-NEN · bảng tham chiếu theo phiên bản DB + quét theo mốc DB');
  const { db } = await import('../db.ts');
  const mig: any = await import('../migrate/prTlNen.ts');
  const moc: any = await import('../platform/mocHeThong.ts');
  const ngu: any = await import('../platform/nguCanhRequest.ts');
  const { createApp } = await import('../app.ts');
  const { bangLop } = await import('../permissions.ts');
  const { allProgrammes, nguongDatKhacMacDinh } = await import('../normal/regular.ts');
  const { getConfig } = await import('../demoConfig.ts');
  const { moBanGoc } = await import('./dbGoc.ts');
  const { addDays } = await import('../util.ts');
  const week: any = await import('../platform/week.ts');

  const c = () => db() as any;
  const soThamChieu = () => (c().prepare(`SELECT so FROM moc_he_thong WHERE khoa = 'tham-chieu'`).get() as any)?.so as number;
  const lop = (c().prepare(`SELECT id FROM classes WHERE code = 'MB FT 101'`).get() as any).id as number;
  const VAI: Array<[string, number]> = [['QL', P.mbManager.userId], ['QT', P.admin.userId], ['GVCN', P.coreTeacher.userId]];
  const datMocQuet = (luc: string | null, ngay: string | null = TODAY) =>
    c().prepare(`UPDATE moc_he_thong SET luc = ?, ngay = ? WHERE khoa LIKE 'quet:%'`).run(luc, ngay);
  const mocQuet = () => c().prepare(`SELECT khoa, luc, ngay FROM moc_he_thong WHERE khoa LIKE 'quet:%' ORDER BY khoa`).all() as any[];
  const conHan = () => datMocQuet(new Date().toISOString());
  /** Câu SQL (đã gộp khoảng trắng) mà `fn` prepare trên kết nối hiện tại. */
  const ghiCau = async (fn: () => Promise<unknown>): Promise<string[]> => {
    const k = c(); const ds: string[] = []; const goc = k.prepare;
    k.prepare = function (this: unknown, sql: string) { ds.push(sql.replace(/\s+/g, ' ').trim()); return goc.call(this, sql); };
    try { await fn(); } finally { delete k.prepare; }
    return ds;
  };
  const CAU_THAM_CHIEU = [/^SELECT id, branch_id, is_fast_track, programme_code FROM classes$/, /FROM programmes p$/, /nguong_dat IS NOT NULL/];
  const coCauThamChieu = (ds: string[]) => ds.filter((s) => CAU_THAM_CHIEU.some((r) => r.test(s)));
  const CAU_QUET = [/^UPDATE moc_he_thong SET luc = \?, ngay = \?/, /FROM yeu_cau_duyet y WHERE y\.trang_thai = 'cho' AND \(/,
    /FROM lenh_chuyen_lop WHERE trang_thai = 'cho' AND tuan_bat_dau <= \?/, /FROM skill_move_requests r JOIN assessment_attempts a ON a\.id = r\.attempt_id WHERE r\.status = 'pending'/];
  const cauQuet = (ds: string[]) => ds.filter((s) => CAU_QUET.some((r) => r.test(s)));

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
  const json = async (r: Response) => `${r.status} ${await r.text()}`;
  const DUONG = (vai: string) => [
    '/my-work', ...(vai === 'GVCN' ? [] : ['/my-work?nguoi=tat-ca']), '/hoc-vien-lop', '/tong-quan/v5?ct=ft', `/classes/${lop}/overview`, `/classes/${lop}/roster`,
  ];

  // ---------------------------------------------------------------- N1
  check('N1-a · migrate chạy hai lần không lỗi; schema.sql có moc_he_thong + 15 trigger; dòng tham-chieu so ≠ 0', () => {
    const lan1: string[] = []; mig.migratePrTlNen(c(), lan1);
    const lan2: string[] = []; mig.migratePrTlNen(c(), lan2);
    assert(lan1.length === 0 && lan2.length === 0, `DB seed đã có đủ, migrate phải không làm gì: ${lan1.join(' · ')} | ${lan2.join(' · ')}`);
    const schema = fs.readFileSync(path.join(REPO, 'server/src/schema.sql'), 'utf8');
    assert(schema.includes('CREATE TABLE moc_he_thong') && (schema.match(/CREATE TRIGGER tg_tc_/g) ?? []).length === 15, 'schema.sql thiếu bảng / trigger');
    const tg = c().prepare(`SELECT COUNT(*) n FROM sqlite_master WHERE type = 'trigger' AND name LIKE 'tg_tc_%'`).get() as any;
    assert(tg.n === 15, `${tg.n} trigger`);
    assert(soThamChieu() > 0 && (c().prepare('SELECT COUNT(*) n FROM moc_he_thong').get() as any).n === 4, 'dòng mốc');
  });

  check('N1-b · mỗi bảng × INSERT / UPDATE / DELETE làm so tăng (BEGIN IMMEDIATE … ROLLBACK)', () => {
    for (const b of mig.BANG_THAM_CHIEU as string[]) {
      c().exec('BEGIN IMMEDIATE');
      try {
        c().exec('PRAGMA defer_foreign_keys = ON');
        const row = c().prepare(`SELECT rowid AS r__, * FROM ${b} LIMIT 1`).get() as any;
        assert(row, `${b} rỗng`);
        const s0 = soThamChieu();
        c().prepare(`UPDATE ${b} SET rowid = rowid WHERE rowid = ?`).run(row.r__);
        const s1 = soThamChieu();
        c().prepare(`DELETE FROM ${b} WHERE rowid = ?`).run(row.r__);
        const s2 = soThamChieu();
        const { r__, ...cot } = row;
        c().prepare(`INSERT INTO ${b} (${Object.keys(cot).join(', ')}) VALUES (${Object.keys(cot).map(() => '?').join(', ')})`).run(...Object.values(cot));
        const s3 = soThamChieu();
        assert(s1 === s0 + 1 && s2 === s1 + 1 && s3 === s2 + 1, `${b}: ${s0} → ${s1} → ${s2} → ${s3}`);
      } finally { c().exec('ROLLBACK'); }
    }
  });

  await checkAsync('N1-c · GET /my-work QL lần 2 không còn đọc lớp / chương trình / ngưỡng; ghi bảng lớp (ngoài API) → lần kế đọc lại', async () => {
    await voiMayChu(async (goi) => {
      await goi(P.mbManager.userId, '/my-work');
      conHan();
      await goi(P.mbManager.userId, '/my-work');
      const lan2 = await ghiCau(() => goi(P.mbManager.userId, '/my-work'));
      assert(coCauThamChieu(lan2).length === 0, `lần 2 vẫn đọc: ${coCauThamChieu(lan2).join(' | ')}`);
      c().prepare('UPDATE classes SET code = code WHERE id = ?').run(lop);
      const lan3 = await ghiCau(() => goi(P.mbManager.userId, '/my-work'));
      assert(lan3.some((s) => CAU_THAM_CHIEU[1].test(s)), 'sau ghi bảng lớp không đọc lại chương trình');
    });
  });

  const nhoMoi = () => {
    const ds = moc.nhoThamChieuHienTai() as Map<string, { so: number; giaTri: unknown }> | undefined;
    return ds ? [...ds.keys()] : [];
  };
  await checkAsync('N1-d · giống hệt: 6 đường × QL, QT, GVCN — JSON khi thamChieuDayDuKhiKiem bật === tắt (nhớ ấm)', async () => {
    await voiMayChu(async (goi) => {
      conHan();
      const sai: string[] = [];
      for (const [vai, uid] of VAI) {
        for (const url of DUONG(vai)) {
          await goi(uid, url);   // làm ấm nhớ tiến trình
          const tat = await json(await goi(uid, url));
          moc.thamChieuDayDuKhiKiem.bat = true;
          let bat = '';
          try { bat = await json(await goi(uid, url)); } finally { moc.thamChieuDayDuKhiKiem.bat = false; }
          if (tat !== bat) sai.push(`${vai} ${url}`);
        }
      }
      assert(!sai.length, `khác: ${sai.join(', ')}`);
      assert(['bang-lop', 'chuong-trinh', 'nguong-dat-lop'].every((k) => nhoMoi().includes(k)), `nhớ tiến trình thiếu khoá: ${nhoMoi().join(', ')}`);
    });
  });

  check('N1-e · RF1: sau N1-d, mọi giá trị nhớ tiến trình deep-equal đọc mới từ DB', () => {
    const ds = moc.nhoThamChieuHienTai() as Map<string, { so: number; giaTri: any }>;
    const cheDo = () => new Map((c().prepare('SELECT c.id, p.scoring_mode AS mode FROM classes c LEFT JOIN programmes p ON p.code = c.programme_code').all() as any[])
      .map((r) => [r.id, r.mode === 'ratio' ? 'ratio' : 'band']));
    const sai: string[] = [];
    moc.thamChieuDayDuKhiKiem.bat = true;
    try {
      ngu.chayTrongRequest('GET', () => {
        const moi: Record<string, () => unknown> = { 'bang-lop': bangLop, 'chuong-trinh': allProgrammes, 'nguong-dat-lop': nguongDatKhacMacDinh, 'che-do-lop': cheDo };
        for (const [k, v] of ds) {
          const doc = moi[k] ?? (k.startsWith('cfg:') ? () => getConfig(k.slice(4)) : null);
          assert(doc, `khoá lạ ${k}`);
          const s = (x: any) => JSON.stringify(x instanceof Map ? [...x] : x);
          if (s(v.giaTri) !== s(doc!())) sai.push(k);
        }
      });
    } finally { moc.thamChieuDayDuKhiKiem.bat = false; }
    assert(ds.size >= 4 && !sai.length, `giá trị nhớ bị sửa tại chỗ: ${sai.join(', ')} (${ds.size} khoá)`);
  });

  await checkAsync('N1-f · RF2: xoá dòng tham-chieu + migrate lại (giả reset) → so mới, GET kế đọc lại; kết nối khác không thấy nhớ kết nối cũ', async () => {
    await voiMayChu(async (goi) => {
      const cu = soThamChieu();
      c().prepare(`DELETE FROM moc_he_thong WHERE khoa = 'tham-chieu'`).run();
      mig.migratePrTlNen(c(), []);
      assert(soThamChieu() !== cu && soThamChieu() > 0, `so ${cu} → ${soThamChieu()}`);
      conHan();
      const ds = await ghiCau(() => goi(P.mbManager.userId, '/my-work'));
      assert(ds.some((s) => CAU_THAM_CHIEU[1].test(s)), 'so mới không đọc lại');
    });
    /* Kết nối hiện tại đặt so = so của DB gốc rồi làm ấm nhớ — kết nối mới (cùng so) vẫn phải đọc lại. */
    const b = moBanGoc('tl-nen');
    const soGoc = (b.conn.prepare(`SELECT so FROM moc_he_thong WHERE khoa = 'tham-chieu'`).get() as any).so;
    b.dong();
    c().prepare(`UPDATE moc_he_thong SET so = ? WHERE khoa = 'tham-chieu'`).run(soGoc);
    await voiMayChu(async (goi) => { conHan(); await goi(P.mbManager.userId, '/my-work'); });
    const b2 = moBanGoc('tl-nen-2');
    try {
      await voiMayChu(async (goi) => {
        conHan();
        await goi(P.mbManager.userId, '/notifications');   // đăng nhập trên DB mới
        const ds = await ghiCau(() => goi(P.mbManager.userId, '/my-work'));
        assert(ds.some((s) => CAU_THAM_CHIEU[1].test(s)), 'kết nối mới dùng nhớ của kết nối cũ');
      });
    } finally { b2.dong(); }
  });

  check('N1-g · ghi trong GET → phần còn lại của request không dùng nhớ tiến trình', () => {
    const m = { thamChieu: soThamChieu(), quet: {} };
    ngu.chayTrongRequest('GET', () => { ngu.datMoc(m); allProgrammes(); });
    let truoc: string[] = [], sau: string[] = [];
    const k = c(); const goc = k.prepare;
    try {
      ngu.chayTrongRequest('GET', () => {
        ngu.datMoc(m);
        k.prepare = function (this: unknown, sql: string) { truoc.push(sql); return goc.call(this, sql); };
        allProgrammes();
        delete k.prepare;
        c().prepare('UPDATE users SET id = id WHERE id = -1').run();
        k.prepare = function (this: unknown, sql: string) { sau.push(sql); return goc.call(this, sql); };
        allProgrammes();
      });
    } finally { delete k.prepare; }
    assert(truoc.length === 0, `trước ghi vẫn đọc: ${truoc.length}`);
    assert(sau.some((s) => /FROM programmes p/.test(s)), 'sau ghi vẫn dùng nhớ tiến trình');
  });

  // ---------------------------------------------------------------- N2
  await checkAsync('N2-a · mốc còn hạn, cùng ngày → GET /my-work QL: 0 câu quét', async () => {
    await voiMayChu(async (goi) => {
      await goi(P.mbManager.userId, '/my-work');
      conHan();
      const ds = await ghiCau(() => goi(P.mbManager.userId, '/my-work'));
      assert(cauQuet(ds).length === 0, `còn câu quét: ${cauQuet(ds).join(' | ')}`);
    });
  });

  await checkAsync('N2-b · RF3: GV ghi thành công → mốc NULL trong DB → GET của QL quét ngay; GET thứ hai trong 60 s không quét', async () => {
    await voiMayChu(async (goi) => {
      conHan();
      const r = await goi(P.coreTeacher.userId, '/notifications/doc-het', { method: 'POST', body: '{}' });
      assert(r.status < 400, `ghi ${r.status}`);
      await new Promise((ok) => setTimeout(ok, 20));   // móc chạy ở 'finish'
      assert(mocQuet().every((q) => q.luc === null), JSON.stringify(mocQuet()));
      const lan1 = await ghiCau(() => goi(P.mbManager.userId, '/my-work'));
      assert(lan1.some((s) => CAU_QUET[1].test(s)) && lan1.some((s) => CAU_QUET[3].test(s)), 'GET của QL không quét');
      const lan2 = await ghiCau(() => goi(P.mbManager.userId, '/my-work'));
      assert(cauQuet(lan2).length === 0, `GET thứ hai vẫn quét: ${cauQuet(lan2).join(' | ')}`);
    });
  });

  await checkAsync('N2-c · ghi 4xx / PUT /session/goc-nhin / POST /demo/session → mốc giữ nguyên', async () => {
    await voiMayChu(async (goi) => {
      await goi(P.mbManager.userId, '/notifications');
      conHan();
      const truoc = JSON.stringify(mocQuet());
      const r1 = await goi(P.mbManager.userId, '/attempts/99999999/scores/listening', { method: 'PUT', body: JSON.stringify({ rawScore: 1, rawTotal: 40 }) });
      const r2 = await goi(P.mbManager.userId, '/session/goc-nhin', { method: 'PUT', body: JSON.stringify({ gocNhin: null }) });
      const r3 = await goi(P.mbManager.userId, '/demo/session', { method: 'POST', body: JSON.stringify({ userId: P.mbManager.userId }) });
      await new Promise((ok) => setTimeout(ok, 20));
      assert(r1.status >= 400 && r2.status < 500 && r3.status < 500, `${r1.status} ${r2.status} ${r3.status}`);
      assert(JSON.stringify(mocQuet()) === truoc, `mốc đổi: ${truoc} → ${JSON.stringify(mocQuet())}`);
    });
  });

  await checkAsync('N2-d · RF4: mốc ngày hôm qua (luc = bây giờ) → GET /classes/:id/overview quét; lệnh tới hạn hôm nay được thi hành', async () => {
    const now = new Date().toISOString();
    const sid = Number(c().prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES ('PISA-TLNEN1', 'Học viên TL-NEN', 'hoc vien tl-nen', (SELECT branch_id FROM classes WHERE id = ?), 'active', ?)`)
      .run(lop, now).lastInsertRowid);
    /* Em không học lớp nguồn → thi hành = huỷ hệ thống ('huy'): đúng lượt thi hành lệnh tới hạn, không cần dựng lớp đích. */
    const id = Number(c().prepare(`INSERT INTO lenh_chuyen_lop (student_id, lop_nguon_id, huong, boi_canh, tuan_bat_dau, nguoi_ra_lenh, ngay_ra_lenh, trang_thai, tao_luc)
      VALUES (?, ?, 'len_lop', 'cuoi-khoa', ?, ?, ?, 'cho', ?)`).run(sid, lop, week.mondayOf(TODAY), P.mbManager.userId, TODAY, now).lastInsertRowid);
    await voiMayChu(async (goi) => {
      datMocQuet(now, addDays(TODAY, -1));
      const r = await goi(P.mbManager.userId, `/classes/${lop}/overview`);
      assert(r.status === 200, `overview ${r.status}`);
      const l = c().prepare('SELECT trang_thai FROM lenh_chuyen_lop WHERE id = ?').get(id) as any;
      assert(l.trang_thai !== 'cho', `lệnh vẫn chờ: ${l.trang_thai}`);
      assert(c().prepare(`SELECT ngay FROM moc_he_thong WHERE khoa = 'quet:lenh'`).get().ngay === TODAY, 'mốc lệnh chưa sang ngày');
    });
  });

  await checkAsync('N2-e · luc = now − 61 s → quét; now − 59 s → không', async () => {
    await voiMayChu(async (goi) => {
      await goi(P.mbManager.userId, '/my-work');
      datMocQuet(new Date(Date.now() - 59_000).toISOString());
      assert(cauQuet(await ghiCau(() => goi(P.mbManager.userId, '/my-work'))).length === 0, '59 s vẫn quét');
      datMocQuet(new Date(Date.now() - 61_000).toISOString());
      assert(cauQuet(await ghiCau(() => goi(P.mbManager.userId, '/my-work'))).length > 0, '61 s không quét');
    });
  });

  check('N2-f · hai lần nhận lượt liền nhau (cùng mốc cũ) → chỉ một lần quét', () => {
    datMocQuet(null);
    const m = moc.docMoc(JSON.stringify({ 'tham-chieu': [1, null, null], 'quet:lenh': [null, null, null] }));
    let n = 0;
    const lan = () => ngu.chayTrongRequest('GET', () => { ngu.datMoc(m); return moc.quetTheoMoc('quet:lenh', TODAY, () => { n++; }); });
    const a = lan(), b = lan();
    assert(a === true && b === false && n === 1, `${a} ${b} ${n}`);
  });

  check('N2-g · fn ném lỗi → luc về NULL, lỗi vẫn ném', () => {
    datMocQuet(null);
    const m = moc.docMoc(JSON.stringify({ 'quet:yeu-cau': [null, null, null] }));
    let loi = '';
    try { ngu.chayTrongRequest('GET', () => { ngu.datMoc(m); moc.quetTheoMoc('quet:yeu-cau', TODAY, () => { throw new Error('hong'); }); }); } catch (e: any) { loi = e.message; }
    const q = c().prepare(`SELECT luc FROM moc_he_thong WHERE khoa = 'quet:yeu-cau'`).get() as any;
    assert(loi === 'hong' && q.luc === null, `${loi} · ${q.luc}`);
  });

  check('N2-g2 · thiếu dòng mốc của khoá → vẫn quét mỗi lần (không tắt hẳn lượt quét); trongBoNho trong POST giữ mốc phiên', () => {
    const m = moc.docMoc(JSON.stringify({ 'tham-chieu': [1, null, null] }));
    let n = 0;
    for (let i = 0; i < 2; i++) ngu.chayTrongRequest('GET', () => { ngu.datMoc(m); moc.quetTheoMoc('quet:lenh', TODAY, () => { n++; }); });
    assert(n === 2, `thiếu dòng: quét ${n} lần`);
    const q = { luc: new Date().toISOString(), ngay: TODAY };
    const conHanM = { thamChieu: null, quet: { 'quet:lenh': q } };
    n = 0;
    ngu.chayTrongRequest('POST', () => { ngu.datMoc(conHanM); ngu.trongBoNho(() => moc.quetTheoMoc('quet:lenh', TODAY, () => { n++; })); });
    assert(n === 0, 'trongBoNho trong POST bỏ qua mốc còn hạn');
  });

  await checkAsync('N2-h · giống hệt: 5 đường × QL, QT, GVCN — JSON khi quét chạy === ngay sau (không quét)', async () => {
    await voiMayChu(async (goi) => {
      const sai: string[] = [];
      for (const [vai, uid] of VAI) {
        const ds = ['/my-work', ...(vai === 'GVCN' ? [] : ['/my-work?nguoi=tat-ca']), '/hoc-vien-lop', `/classes/${lop}/overview`, `/classes/${lop}/viec-theo-em?chi=toi`];
        for (const url of ds) {
          await goi(uid, url);
          datMocQuet(null);
          const quet = await json(await goi(uid, url));
          const khong = await json(await goi(uid, url));
          if (quet !== khong) sai.push(`${vai} ${url}`);
        }
      }
      assert(!sai.length, `khác: ${sai.join(', ')}`);
    });
  });

  await checkAsync('N2-i · việc đã xong không còn báo chờ: thẻ chết + một lần ghi qua API → /yeu-cau/dem của QL ngay sau giảm', async () => {
    const { DINH_NGHIA_LOAI } = await import('../duyet/loaiYeuCau.ts');
    const d: any = await import('../../../shared/domain/index.ts');
    const yc: any = await import('../duyet/yeuCau.ts');
    const GIA = 'thu_tl_nen' as any;
    (d.LOAI_YC_META as any)[GIA] = { phanLoai: 'hoc-thuat', nhan: 'Thử TL-NEN', kieuNut: 'duyet-tu-choi', hanNgay: 5, hangLoat: true };
    DINH_NGHIA_LOAI.push({ loai: GIA, chet: { sql: `y.doi_tuong_id < 0 AND NOT EXISTS (SELECT 1 FROM demo_config WHERE key = 'tl_nen_song')`, lyDo: 'Thử' },
      moTa: () => ({ tieuDe: 'Thử', dong: [] }) } as any);
    const hv = (c().prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' LIMIT 1`).get(lop) as any).student_id;
    try {
      c().prepare(`INSERT INTO demo_config (key, value, updated_at) VALUES ('tl_nen_song', '1', ?)`).run(new Date().toISOString());
      yc.taoYeuCau(c(), { loai: GIA, doiTuongLoai: 'thu', doiTuongId: -1, hocVienId: hv, nguoiXin: P.coreTeacher.userId, lyDo: 'Thử' });
      await voiMayChu(async (goi) => {
        conHan();
        const dem = async () => ((await (await goi(P.mbManager.userId, '/yeu-cau/dem')).json()) as any).cho as number;
        const truoc = await dem();
        c().prepare(`DELETE FROM demo_config WHERE key = 'tl_nen_song'`).run();   // đối tượng "chết" (ghi ngoài API — mốc còn hạn)
        assert(await dem() === truoc, 'chưa ghi qua API đã quét');
        const r = await goi(P.coreTeacher.userId, '/notifications/doc-het', { method: 'POST', body: '{}' });
        assert(r.status < 400, `ghi ${r.status}`);
        await new Promise((ok) => setTimeout(ok, 20));
        const sau = await dem();
        assert(sau === truoc - 1, `${truoc} → ${sau}`);
      });
    } finally {
      DINH_NGHIA_LOAI.splice(DINH_NGHIA_LOAI.findIndex((x: any) => x.loai === GIA), 1);
      c().prepare('DELETE FROM yeu_cau_duyet WHERE loai = ?').run(GIA);
      c().prepare(`DELETE FROM demo_config WHERE key = 'tl_nen_song'`).run();
      delete (d.LOAI_YC_META as any)[GIA];
    }
  });

  await checkAsync('N2-j · câu GET /my-work QL khi quét chạy − khi không ≤ 16', async () => {
    await voiMayChu(async (goi) => {
      await goi(P.mbManager.userId, '/my-work');
      const dem = async () => { const a = ngu.soCauSql(); await goi(P.mbManager.userId, '/my-work'); return ngu.soCauSql() - a; };
      datMocQuet(null);
      const quet = await dem();
      const khong = await dem();
      assert(quet - khong <= 16 && quet > khong, `quét ${quet} · không ${khong}`);
    });
  });
}
