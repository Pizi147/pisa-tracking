/** PHÉP KIỂM CN-1 — DB gốc (`dbGoc.ts`): tệp `DOC_LAP` chạy trên bản chép DB ngay sau seed, không lọt sang / từ DB chuỗi. */
import Database from 'libsql';
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runDbGocTests(t: YThucTestKit) {
  const { check, assert, conn, classId } = t;
  const { db } = await import('../db.ts');
  const { moBanGoc } = await import('./dbGoc.ts');
  const { chepDbKiem } = await import('./banSaoDb.ts');
  const { scoringModeOf } = await import('../fasttrack/skillSchedule.ts');
  const { batBienDb } = await import('./prTk.tests.ts');
  const { emailThu } = await import('../seed/emailThu.ts');
  console.log('\nCN-1 · DB gốc');
  const dem = (c: any) => (c.prepare('SELECT COUNT(*) n FROM assessment_attempts').get() as any).n as number;
  const ten = (c: any, id: number) => (c.prepare('SELECT full_name n FROM students WHERE id = ?').get(id) as any).n as string;

  check('DG-1 · bản gốc: COUNT(*) assessment_attempts qua conn mới = số ngay sau seed; ghi một em vào bản gốc không thấy ở chuỗi', () => {
    const b = moBanGoc('dg1');
    try {
      assert(b.conn !== conn && db() === b.conn, 'db() trỏ bản gốc');
      assert(dem(b.conn) === dem(conn) && dem(conn) > 0, `${dem(b.conn)} vs ${dem(conn)}`);   // chuỗi lúc này mới qua seed + prSeedUx (chỉ đọc)
      assert((b.conn.prepare('SELECT MAX(id) m FROM students').get() as any).m === t.seedMax.students, 'em seed');
      b.conn.prepare('UPDATE students SET full_name = ? WHERE id = 1').run('DG-1 gốc');
      assert(ten(b.conn, 1) === 'DG-1 gốc' && ten(conn, 1) !== 'DG-1 gốc', 'chuỗi không thấy');
    } finally { b.dong(); }
    assert(db() === conn, 'dong() trả kết nối chuỗi');
  });

  check('DG-2 · chepDbKiem trong lúc mở bản gốc chép đúng tệp bản gốc (em vừa ghi có trong bản sao)', () => {
    const b = moBanGoc('dg2');
    try {
      b.conn.prepare('UPDATE students SET full_name = ? WHERE id = 1').run('DG-2 gốc');
      const { tep } = chepDbKiem('dg2');
      const ban = new Database(tep);
      try { assert(ten(ban, 1) === 'DG-2 gốc', ten(ban, 1)); } finally { ban.close(); }
    } finally { b.dong(); }
  });

  check('DG-3 · đổi sysconfig + cách chấm + số đếm email thử trong bản gốc A → mở bản gốc B đọc lại giá trị seed', () => {
    const lop = classId('MB FT 101');
    const cfg = (c: any) => (c.prepare(`SELECT value v FROM demo_config WHERE key = 'normal_pass_threshold'`).get() as any).v;
    const seedCfg = cfg(conn);
    const seedMode = scoringModeOf({ class_id: lop });
    let emailA = '';
    const a = moBanGoc('dg3a');
    try {
      a.conn.prepare(`UPDATE demo_config SET value = '0.1' WHERE key = 'normal_pass_threshold'`).run();
      a.conn.prepare(`UPDATE programmes SET scoring_mode = ? WHERE code = (SELECT programme_code FROM classes WHERE id = ?)`).run(seedMode === 'band' ? 'ratio' : 'band', lop);
      assert(scoringModeOf({ class_id: lop }) !== seedMode, 'A thấy cách chấm vừa đổi (bộ nhớ đệm đã bỏ khi mở)');
      emailA = emailThu(); emailThu();
    } finally { a.dong(); }
    const b = moBanGoc('dg3b');
    try {
      assert(cfg(b.conn) === seedCfg, `B: ${cfg(b.conn)}`);
      assert(scoringModeOf({ class_id: lop }) === seedMode, 'B: cách chấm seed (không giữ bộ nhớ đệm của A)');
      assert(emailThu() === emailA, 'B: email thử đếm lại từ số lúc chụp gốc (em tạo trong B không phụ thuộc A)');
    } finally { b.dong(); }
    assert(scoringModeOf({ class_id: lop }) === seedMode, 'chuỗi: cách chấm seed');
  });

  check('DG-4 · hàm ném lỗi giữa chừng → sau dong() db() === kết nối chuỗi, inTransaction false', () => {
    const b = moBanGoc('dg4');
    let nem = false;
    try {
      b.conn.exec('BEGIN IMMEDIATE');
      b.conn.prepare('UPDATE students SET full_name = ? WHERE id = 1').run('DG-4');
      throw new Error('giả lỗi');
    } catch { nem = true; } finally { b.dong(); }
    assert(nem && db() === conn && !conn.inTransaction && ten(conn, 1) !== 'DG-4', 'trả chuỗi sạch');
  });

  check('DG-5 · tệp giả để lại dòng vi phạm bất biến trên bản gốc → batBienDb ném', () => {
    const b = moBanGoc('dg5');
    try {
      const kit = { conn: b.conn, assert, seedMax: t.seedMax };
      batBienDb(kit);   // bản gốc sạch
      const cy = (b.conn.prepare(`SELECT id FROM learning_cycles WHERE status = 'active' LIMIT 1`).get() as any).id;
      b.conn.prepare(`DELETE FROM ban_chup_lo_trinh WHERE cycle_id = ?`).run(cy);
      b.conn.prepare(`UPDATE learning_cycles SET status = 'completed' WHERE id = ?`).run(cy);
      let nem = false;
      try { batBienDb(kit); } catch { nem = true; }
      assert(nem, 'lộ trình đóng thiếu bản chụp phải đỏ');
    } finally { b.dong(); }
  });
}
