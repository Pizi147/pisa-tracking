/**
 * THỬ ĐƯỜNG MẠNG TỚI TURSO (cửa dừng Task 3 của PR-Z2) — giữ lại để chẩn đoán sau này.
 * Chạy độc lập, mở kết nối riêng, chỉ đụng hai bảng tạm `_thu` / `_thu_b` rồi tự dọn. KHÔNG in token.
 * Chạy: nạp TURSO_DATABASE_URL + TURSO_AUTH_TOKEN vào môi trường rồi `npm run thu-turso`.
 */
import Database from 'libsql';
import { cauHinhDb, laBanChinh, laTenDbBanChinh } from '../moiTruong.ts';

const c = cauHinhDb();
if (c.kieu !== 'turso') { console.error('Cần TURSO_DATABASE_URL + TURSO_AUTH_TOKEN'); process.exit(1); }
/* Script này TẠO và XOÁ bảng `_thu*` — chỉ dành cho database THỬ. Hỏi trước khi mở kết nối. */
if (laBanChinh() || laTenDbBanChinh(c.url)) {
  console.error('[thu-turso] TỪ CHỐI: chỉ chạy với database THỬ (pisatracking-demo-…), không bao giờ với bản chính hay khi BAN_CHINH=1.');
  process.exit(1);
}
const conn = new Database(c.url, { authToken: c.authToken } as Database.Options);   // ép kiểu: xem db.ts
const ketQua: [string, string][] = [];
const thu = (ten: string, fn: () => string) => {
  try { ketQua.push([ten, 'ĐẠT · ' + fn()]); } catch (e: any) { ketQua.push([ten, 'HỎNG · ' + e.message]); }
};
const doMs = (fn: () => void, lan = 20) => { const t = performance.now(); for (let i = 0; i < lan; i++) fn(); return ((performance.now() - t) / lan).toFixed(1) + ' ms/lần'; };

thu('1. SELECT 1 (độ trễ một lượt)', () => doMs(() => conn.prepare('SELECT 1').get()));
thu('2. exec nhiều câu một lần', () => { conn.exec('DROP TABLE IF EXISTS _thu; CREATE TABLE _thu (id INTEGER PRIMARY KEY, v TEXT);'); return 'ok'; });
thu('3. PRAGMA foreign_keys', () => { conn.pragma('foreign_keys = ON'); return JSON.stringify(conn.pragma('foreign_keys')); });
thu('4. lastInsertRowid', () => String(conn.prepare('INSERT INTO _thu (v) VALUES (?)').run('a').lastInsertRowid));
thu('5. transaction() thành công', () => { conn.transaction(() => { conn.prepare('INSERT INTO _thu (v) VALUES (?)').run('b'); })(); return String((conn.prepare('SELECT COUNT(*) n FROM _thu').get() as any).n); });
thu('6. transaction() lỗi thì cuộn lại', () => {
  try { conn.transaction(() => { conn.prepare('INSERT INTO _thu (v) VALUES (?)').run('c'); throw new Error('cố ý'); })(); } catch { /* đúng */ }
  const n = (conn.prepare("SELECT COUNT(*) n FROM _thu WHERE v = 'c'").get() as any).n;
  if (n !== 0) throw new Error('KHÔNG cuộn lại — dòng c vẫn còn'); return 'đã cuộn lại';
});
thu('7. SAVEPOINT trong transaction', () => { conn.transaction(() => { conn.exec('SAVEPOINT s1'); conn.prepare('INSERT INTO _thu (v) VALUES (?)').run('d'); conn.exec('ROLLBACK TO s1'); conn.exec('RELEASE s1'); })(); return 'ok'; });
thu('8. inTransaction đúng ở cả hai phía (tx() của db.ts dựa vào nó để chọn SAVEPOINT)', () => {
  let trong: boolean | null = null;
  conn.transaction(() => { trong = conn.inTransaction; })();
  if (trong !== true || conn.inTransaction !== false) throw new Error(`trong giao dịch = ${trong}, ngoài = ${conn.inTransaction}`);
  return 'trong = true, ngoài = false';
});
thu('8b. foreign_keys còn BẬT ở câu lệnh sau (db() chỉ đặt một lần lúc mở kết nối)', () => {
  const fk = conn.prepare('PRAGMA foreign_keys').all() as any[];
  if (fk[0]?.foreign_keys !== 1) throw new Error(JSON.stringify(fk));
  conn.exec('CREATE TABLE IF NOT EXISTS _thu_cha (id INTEGER PRIMARY KEY); CREATE TABLE IF NOT EXISTS _thu_con (id INTEGER PRIMARY KEY, cha INTEGER NOT NULL REFERENCES _thu_cha(id));');
  let chan = false;
  try { conn.prepare('INSERT INTO _thu_con (cha) VALUES (?)').run(999); } catch { chan = true; }
  conn.exec('DROP TABLE _thu_con; DROP TABLE _thu_cha;');
  if (!chan) throw new Error('Khoá ngoại KHÔNG được thực thi — chèn dòng con mồ côi vẫn thành công');
  return 'khoá ngoại được thực thi';
});
thu('9. 100 INSERT trong một transaction', () => doMs(() => conn.transaction(() => { for (let i = 0; i < 100; i++) conn.prepare('INSERT INTO _thu (v) VALUES (?)').run('x'); })(), 1));
thu('9b. .get() qua mạng có _metadata không (kết nối riêng, CHƯA qua vá của db.ts — chỉ để biết)', () => {
  const row = conn.prepare('SELECT 1 AS a').get() as Record<string, unknown>;
  return JSON.stringify(Object.keys(row));
});
thu('9c. Tệp nhị phân (BLOB) đi kèm tham số khác', () => {
  conn.exec('CREATE TABLE IF NOT EXISTS _thu_b (id INTEGER PRIMARY KEY, b BLOB, v TEXT)');
  conn.prepare('INSERT INTO _thu_b (b, v) VALUES (?, ?)').run(Buffer.from('xin chao'), 'x');
  const r = conn.prepare('SELECT b FROM _thu_b').get() as any;
  conn.exec('DROP TABLE _thu_b');
  return Buffer.from(r.b).toString();
});
thu('10. dọn', () => { conn.exec('DROP TABLE _thu'); return 'ok'; });
console.table(ketQua);
conn.close();
