/** PHÉP KIỂM PR-BN — nhớ câu lệnh đã chuẩn bị (db.ts): kết quả y hệt chuẩn bị mới, không rò trạng thái. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrBnTests(t: YThucTestKit) {
  const { check, assert, conn } = t;
  console.log('\nPR-BN · nhớ câu lệnh đã chuẩn bị');
  const SQL = 'SELECT id, full_name FROM students WHERE id >= ? ORDER BY id LIMIT 2';

  check('BN-1 · get() cùng câu SQL, tham số khác nhau → mỗi lần đúng dòng của tham số đó (libsql dùng lại statement trả dòng cũ)', () => {
    const ids = (conn.prepare('SELECT id FROM students ORDER BY id LIMIT 3').all() as { id: number }[]).map((r) => r.id);
    for (let vong = 0; vong < 2; vong++) {
      for (const id of ids) {
        const r: any = conn.prepare('SELECT id FROM students WHERE id = ?').get(id);
        assert(r && r.id === id, `vòng ${vong}: hỏi ${id} nhận ${JSON.stringify(r)}`);
      }
    }
    assert(conn.prepare('SELECT id FROM students WHERE id = ?').get(-1) === undefined, 'không có dòng → undefined');
  });

  check('BN-2 · safeIntegers(true) ở một lần dùng KHÔNG rò sang lần prepare sau (saoLuu dùng nó)', () => {
    const a: any = conn.prepare(SQL).safeIntegers(true).all(0);
    assert(typeof a[0].id === 'bigint', 'lần 1 phải là bigint');
    const b: any = conn.prepare(SQL).all(0);
    assert(typeof b[0].id === 'number', `lần 2 phải là number, nhận ${typeof b[0].id}`);
  });

  check('BN-3 · pluck() và raw(true) ở một lần dùng KHÔNG rò sang lần sau; get không lòi _metadata', () => {
    const p: any = conn.prepare(SQL).pluck().all(0);
    assert(typeof p[0] === 'number', 'pluck trả giá trị đơn');
    const r: any = conn.prepare(SQL).raw(true).all(0);
    assert(Array.isArray(r[0]), 'raw trả mảng');
    const o: any = conn.prepare(SQL).all(0);
    assert(o[0] && typeof o[0] === 'object' && !Array.isArray(o[0]) && 'full_name' in o[0], 'lần sau phải là đối tượng đủ cột');
    assert(!('_metadata' in (conn.prepare(SQL).get(0) as object)), 'get không lòi _metadata');
  });

  check('BN-4 · quá giới hạn bộ nhớ (1500 câu SQL khác nhau) vẫn chạy đúng; câu bị bỏ chuẩn bị lại được', () => {
    for (let i = 0; i < 1500; i++) {
      const v: any = conn.prepare(`SELECT ${i} AS n`).get();
      assert(v.n === i, `câu ${i}`);
    }
    assert((conn.prepare('SELECT 0 AS n').get() as any).n === 0, 'câu đầu (đã bị bỏ) chuẩn bị lại vẫn đúng');
  });
}
