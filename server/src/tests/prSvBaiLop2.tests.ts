/**
 * PHÉP KIỂM SV-BAI-LOP-2 (kế hoạch M5 `docs/superpowers/plans/2026-10-27-m5-code.md` PR ①, mockup `thiet-ke/v7/ho-so-hv.html` form Ghi tiến độ):
 *   (1) Tiến độ trên lớp: tên bài / điểm / thang được trống, thêm `band` (0–9, bước 0.5); có điểm thì có thang và điểm ≤ thang; band và x/y không cùng lúc;
 *       nhận xét bắt buộc · migrate prSvBaiLop2 đổi bảng cũ, giữ dữ liệu, chạy lặp được;
 * Mỗi ca ghi trong một giao dịch rồi cuộn lại (`thu`).
 */
export async function runPrSvBaiLop2Tests(t: any) {
  const { check, assert, conn, P, classId } = t;
  const bai: any = await import('../students/baiTrenLop.ts');
  const { lichSu } = await import('../platform/lichSu.ts');
  const { demoToday } = await import('../demoConfig.ts');
  const { mondayOf } = await import('../platform/week.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nSV-BAI-LOP-2 · Tiến độ trên lớp: band · nhận xét bắt buộc · migrate');

  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const maLoi = (fn: () => unknown): number | string => { try { fn(); return 'không ném'; } catch (e: any) { return e?.status ?? String(e?.message ?? e); } };
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const LOP = classId('MB FT 101');
  const tuan = mondayOf(demoToday());
  const em = () => get(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' ORDER BY student_id LIMIT 1`, LOP).student_id as number;
  /** Mẫu "chỉ nhận xét" — không tên bài, không kết quả. */
  const nx = (o: Record<string, unknown> = {}) => ({ classId: LOP, skill: 'speaking', tuan, nhanXet: 'Trả lời Part 3 dài hơn.', ...o });
  const dong = (sid: number, id: number) => bai.dsBaiTrenLop(P.mbManager, sid).bai.find((x: any) => x.id === id);

  check('SVBL2-1 · chỉ nhận xét (không tên bài, điểm, thang) lưu được; đọc lại tenBai / diem / thang / band = null', () => thu(() => {
    const sid = em();
    const { id } = bai.themBaiTrenLop(P.mbManager, sid, nx());
    const b = dong(sid, id);
    assert(b && b.tenBai === null && b.diem === null && b.thang === null && b.band === null && b.nhanXet === 'Trả lời Part 3 dài hơn.', `dòng ${JSON.stringify(b)}`);
  }));

  check('SVBL2-2 · band 5.5 lưu được (kèm tên bài tuỳ chọn); x/y cũ vẫn lưu, band = null', () => thu(() => {
    const sid = em();
    const a = dong(sid, bai.themBaiTrenLop(P.mbManager, sid, nx({ band: 5.5 })).id);
    assert(a.band === 5.5 && a.diem === null && a.thang === null && a.tenBai === null, `band ${JSON.stringify(a)}`);
    const b = dong(sid, bai.themBaiTrenLop(P.mbManager, sid, nx({ band: 6, tenBai: 'Part 2' })).id);
    assert(b.band === 6 && b.tenBai === 'Part 2', `band + tên ${JSON.stringify(b)}`);
    const c = dong(sid, bai.themBaiTrenLop(P.mbManager, sid, nx({ diem: 6, thang: 10 })).id);
    assert(c.diem === 6 && c.thang === 10 && c.band === null && c.tenBai === null, `x/y không tên ${JSON.stringify(c)}`);
  }));

  check('SVBL2-3 · 400: band lẻ / ngoài 0–9 / chữ; band cùng x/y; điểm thiếu thang; thang thiếu điểm; thiếu nhận xét — không dòng nào lọt', () => thu(() => {
    const sid = em();
    const sai: [string, Record<string, unknown>][] = [
      ['band 5.3', { band: 5.3 }], ['band 9.5', { band: 9.5 }], ['band -0.5', { band: -0.5 }], ['band chữ', { band: '6' }],
      ['band + điểm', { band: 6, diem: 6, thang: 10 }], ['điểm thiếu thang', { diem: 6 }], ['thang thiếu điểm', { thang: 10 }],
      ['thiếu nhận xét', { nhanXet: undefined }], ['nhận xét trống', { nhanXet: '   ' }], ['nhận xét null', { nhanXet: null }],
    ];
    for (const [ten, o] of sai) assert(maLoi(() => bai.themBaiTrenLop(P.mbManager, sid, nx(o))) === 400, `${ten} → 400`);
    assert(!get('SELECT 1 AS c FROM bai_tren_lop WHERE student_id = ?', sid), 'không dòng nào lọt');
  }));

  check('SVBL2-4 · sửa x/y → band: điểm / thang về trống; sửa bỏ nhận xét → 400; lịch sử có Band', () => thu(() => {
    const sid = em();
    const { id } = bai.themBaiTrenLop(P.mbManager, sid, nx({ tenBai: 'Part 2', diem: 6, thang: 10 }));
    assert(bai.suaBaiTrenLop(P.mbManager, id, nx({ band: 6.5 })).doi, 'sửa sang band');
    const r = get('SELECT ten_bai, diem, thang, band FROM bai_tren_lop WHERE id = ?', id);
    assert(r.ten_bai === null && r.diem === null && r.thang === null && r.band === 6.5, `dòng ${JSON.stringify(r)}`);
    assert(maLoi(() => bai.suaBaiTrenLop(P.mbManager, id, nx({ nhanXet: '' }))) === 400, 'sửa bỏ nhận xét → 400');
    const tom = lichSu(P.mbManager, { loai: 'bai-lop', id: sid }).dong[0].truong.map((x: any) => `${x.ten}:${x.cu ?? '∅'}>${x.moi ?? '∅'}`).join('|');
    assert(tom.includes('Điểm:6 / 10>∅') && tom.includes('Band:∅>6.5') && tom.includes('Tên bài:Part 2>∅'), `lịch sử ${tom}`);
  }));

  const { default: Database } = await import('libsql');
  const { migratePrSvBaiLop } = await import('../migrate/prSvBaiLop.ts');
  const { migratePrSvBaiLop2 } = await import('../migrate/prSvBaiLop2.ts');
  check('SVBL2-5 · migrate prSvBaiLop2: bảng cũ (NOT NULL, chưa band) → cột trống được + band, dữ liệu + chỉ mục giữ; lần hai không làm gì; DB thử đã đúng dạng', () => {
    const cot = (c: any) => Object.fromEntries((c.prepare('PRAGMA table_info(bai_tren_lop)').all() as any[]).map((x) => [x.name, x.notnull]));
    const moi = new Database(':memory:');
    try {
      /* Bảng khoá ngoài trỏ tới phải có: RENAME đọc lại cả lược đồ. */
      for (const [b, id] of [['students', 1], ['classes', 2], ['users', 3]]) moi.exec(`CREATE TABLE ${b} (id INTEGER PRIMARY KEY); INSERT INTO ${b} VALUES (${id})`);
      migratePrSvBaiLop(moi, []);
      moi.prepare(`INSERT INTO bai_tren_lop (student_id, class_id, skill, ten_bai, diem, thang, tuan, nhan_xet, ghi_boi, ghi_luc) VALUES (1, 2, 'writing', 'Task 1', 7, 10, '2026-09-14', NULL, 3, 'x')`).run();
      const a: string[] = []; migratePrSvBaiLop2(moi, a);
      const b: string[] = []; migratePrSvBaiLop2(moi, b);
      const c = cot(moi);
      assert(a.length === 1 && b.length === 0, `applied ${a} / ${b}`);
      assert(c.ten_bai === 0 && c.diem === 0 && c.thang === 0 && c.band === 0 && c.student_id === 1 && c.nhan_xet === 0, `cột ${JSON.stringify(c)}`);
      const r = moi.prepare('SELECT * FROM bai_tren_lop').get() as any;
      assert(r.id === 1 && r.ten_bai === 'Task 1' && r.diem === 7 && r.thang === 10 && r.band === null && r.ghi_luc === 'x', `dữ liệu ${JSON.stringify(r)}`);
      assert(moi.prepare(`SELECT 1 AS c FROM sqlite_master WHERE type = 'index' AND name = 'idx_bai_tren_lop_hv'`).get(), 'chỉ mục giữ');
    } finally { moi.close(); }
    const d = cot(conn);
    assert(d.ten_bai === 0 && d.band === 0, `DB thử (schema.sql) ${JSON.stringify(d)}`);
  });
}
