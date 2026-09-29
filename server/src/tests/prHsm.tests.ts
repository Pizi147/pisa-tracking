/** PHÉP KIỂM PR-HSM — hồ sơ Mock, nhận xét W/S, GV chấm Speaking, tiêu chí W1 TA / W2 TR. Harness do `run.ts` truyền vào. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrHsmTests(t: YThucTestKit) {
  const { check, assert, conn } = t;
  const d = await import('../../../shared/domain/index.ts');
  const { migratePrHsm } = await import('../migrate/prHsm.ts');
  const { default: SqliteDb } = await import('libsql');
  console.log('\nPR-HSM · Hồ sơ Mock, nhận xét W/S, GV chấm Speaking');

  const coCot = (c: any, cot: string) => (c.prepare('SELECT name FROM pragma_table_info(?)').all('assessment_scores') as any[]).some((x) => x.name === cot);

  check('HSM (1a) · migrate thêm 3 cột trên DB cũ, chạy lại không làm gì; DB demo đã có đủ', () => {
    const tam = new SqliteDb(':memory:');
    tam.exec('CREATE TABLE users (id INTEGER PRIMARY KEY); CREATE TABLE assessment_scores (id INTEGER PRIMARY KEY, attempt_id INTEGER, skill TEXT)');
    const a: string[] = []; migratePrHsm(tam, a);
    assert(a.length === 1 && ['comment', 'examiner_user_id', 'examiner_name'].every((c) => coCot(tam, c)), a.join('; '));
    const b: string[] = []; migratePrHsm(tam, b);
    assert(b.length === 0, `lần 2 vẫn thêm: ${b.join('; ')}`);
    tam.close();
    const c: string[] = []; migratePrHsm(conn, c);
    assert(c.length === 0 && coCot(conn, 'examiner_name'), 'schema.sql thiếu cột PR-HSM');
  });

  check('HSM (1b) · tiêu chí theo bài nhập: W1 TA, W2 TR, L/R không có', () => {
    assert(d.tieuChiNganCua('writing1')?.[0] === 'TA' && d.tieuChiNganCua('writing2')?.[0] === 'TR', 'sai tên tắt W1/W2');
    assert(d.tieuChiCua('writing2')?.[0] === 'Task Response' && d.tieuChiNganCua('speaking')?.join(' ') === 'FC LR GRA P', 'sai tên đủ');
    assert(d.tieuChiNganCua('listening') === null && d.tieuChiCua('reading') === null, 'L/R không có tiêu chí');
  });

  check('HSM (1c) · kiemNhanXet: trống → null, > 1000 → lỗi, không phải chữ → lỗi', () => {
    assert(JSON.stringify(d.kiemNhanXet('  ')) === '{"gt":null}' && JSON.stringify(d.kiemNhanXet(null)) === '{"gt":null}', 'trống phải null');
    assert(JSON.stringify(d.kiemNhanXet('  Tốt ')) === '{"gt":"Tốt"}', 'phải cắt khoảng trắng');
    assert('loi' in d.kiemNhanXet('a'.repeat(1001)) && !('loi' in d.kiemNhanXet('a'.repeat(1000))), 'trần 1000');
    assert('loi' in d.kiemNhanXet(5), 'số phải lỗi');
  });

  check('HSM (1d) · nhanXetW gộp Task 1 / Task 2, bỏ phần trống', () => {
    assert(d.nhanXetW(null, null) === null, 'cả hai trống');
    assert(d.nhanXetW('A', null) === 'Task 1: A' && d.nhanXetW(null, 'B') === 'Task 2: B', 'một phần');
    assert(d.nhanXetW('A', 'B') === 'Task 1: A\nTask 2: B', 'hai phần');
  });

  check('HSM (1e) · tenGvCham ưu tiên tài khoản', () => {
    assert(d.tenGvCham({ examinerUserName: 'Trang', examinerName: 'Lan' }) === 'Trang', 'phải lấy tài khoản');
    assert(d.tenGvCham({ examinerName: 'Cô Lan' }) === 'Cô Lan' && d.tenGvCham({}) === null, 'tên ngoài / trống');
  });
}
