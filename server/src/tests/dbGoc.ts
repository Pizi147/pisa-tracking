/**
 * CN-1 · DB GỐC: chụp tệp DB kiểm NGAY SAU seed một lần mỗi nhóm; tệp phép kiểm trong `DOC_LAP` (run.ts) chạy trên bản chép MỚI của
 * DB gốc — dữ liệu nhỏ, không thấy dữ liệu tệp khác để lại, ghi gì cũng bỏ khi xong. Chạy riêng = chạy trong bộ.
 * Chỉ import SAU khi run.ts đặt `PISA_DB`.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'libsql';
import { DB_PATH, datKetNoiChoPhepKiem, db } from '../db.ts';
import { daGhiDb, xoaNho } from '../platform/nguCanhRequest.ts';
import { clearScoringModeCache } from '../fasttrack/skillSchedule.ts';
import { datTepDangDung, tepDbDangDung } from './banSaoDb.ts';

const GOC = path.join(path.dirname(DB_PATH), 'goc.sqlite');

/** Bộ nhớ đệm cấp module đọc từ DB: bỏ khi đổi kết nối (`daGhiDb` = lượt quét `quetGioiHan` kế chạy lại). */
function boNhoDem() { xoaNho(); clearScoringModeCache(); daGhiDb(); }

/** Gộp WAL vào tệp rồi chép DB_PATH → `goc.sqlite` cạnh nó. */
export function chupDbGoc(): string {
  db().pragma('wal_checkpoint(TRUNCATE)');
  for (const duoi of ['-wal', '-shm']) if (fs.existsSync(GOC + duoi)) fs.rmSync(GOC + duoi);
  fs.copyFileSync(DB_PATH, GOC);
  return GOC;
}

/** Mở bản chép mới của DB gốc và cho `db()` trỏ vào đó; `dong()` trả kết nối + tệp cũ, đóng, dọn. */
export function moBanGoc(ten: string): { conn: Database.Database; tep: string; dong: () => void } {
  const thuMuc = fs.mkdtempSync(path.join(os.tmpdir(), `z2-goc-${ten}-`));
  const tep = path.join(thuMuc, 'goc.sqlite');
  fs.copyFileSync(GOC, tep);
  const conn = new Database(tep);
  conn.pragma('journal_mode = WAL');
  conn.pragma('foreign_keys = ON');
  const cu = db();
  const tepCu = tepDbDangDung();
  datKetNoiChoPhepKiem(conn);
  datTepDangDung(tep);
  boNhoDem();
  const dong = () => {
    datKetNoiChoPhepKiem(cu);
    datTepDangDung(tepCu);
    boNhoDem();
    try { conn.close(); } catch { /* đã đóng */ }
    try { fs.rmSync(thuMuc, { recursive: true, force: true }); } catch { /* Windows còn giữ tệp — run.ts dọn z2- sau 1 giờ */ }
  };
  return { conn, tep, dong };
}
