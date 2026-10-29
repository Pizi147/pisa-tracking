/**
 * KIEM-BAN-SAO (#702 KIEM-CHAP-CHON): phép kiểm cần DB "cũ" (bỏ bảng / cột rồi chạy migrate) làm DDL trên BẢN SAO riêng, không trên kết nối
 * kiểm dùng chung. SQLite từ chối DDL / VACUUM ("database table is locked", "SQL statements in progress") khi trên kết nối còn bất kỳ câu dở
 * nào hoặc một kết nối khác cùng tệp đang đọc (libsql dùng chung bộ đệm) — chập chờn khi `npm run check` chạy song song; hỏng giữa chừng thì
 * DB dùng chung kẹt ở trạng thái "cũ" và mọi phép kiểm sau đỏ theo.
 * Chỉ import từ tệp `*.tests.ts` (nạp SAU khi run.ts đặt `PISA_DB`).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'libsql';
import { DB_PATH, datKetNoiChoPhepKiem, db } from '../db.ts';

/** Tệp DB `db()` đang trỏ tới: DB_PATH, hoặc bản chép DB gốc trong lúc tệp `DOC_LAP` chạy (dbGoc.ts). */
let tepDangDung = DB_PATH;
export function tepDbDangDung(): string { return tepDangDung; }
export function datTepDangDung(tep: string): void { tepDangDung = tep; }

/**
 * Chép tệp DB kiểm + WAL sang thư mục tạm tiền tố `z2-` (run.ts dọn sau 1 giờ — Windows không cho xoá ngay khi câu lệnh đã nhớ ở db.ts
 * chưa được dọn). Không chạy lệnh nào trên kết nối dùng chung (khác `VACUUM INTO`); tiến trình kiểm chạy đồng bộ nên tệp + WAL nhất quán.
 */
export function chepDbKiem(tienTo: string): { thuMuc: string; tep: string } {
  const thuMuc = fs.mkdtempSync(path.join(os.tmpdir(), `z2-${tienTo}-`));
  const tep = path.join(thuMuc, 'ban-sao.sqlite');
  for (const duoi of ['', '-wal']) if (fs.existsSync(tepDangDung + duoi)) fs.copyFileSync(tepDangDung + duoi, tep + duoi);
  return { thuMuc, tep };
}

/** Chạy `fn` trên bản sao: `db()` trỏ vào bản sao trong lúc chạy (mã dùng `db()` / `tx()` cũng chạy trên đó), xong trả kết nối cũ, đóng, dọn. */
export function voiBanSaoDb<T>(tienTo: string, fn: (ban: any) => T): T {
  const { thuMuc, tep } = chepDbKiem(tienTo);
  const ban = new Database(tep);
  const cu = db();
  datKetNoiChoPhepKiem(ban);
  try {
    return fn(ban);
  } finally {
    datKetNoiChoPhepKiem(cu);
    ban.close();
    try { fs.rmSync(thuMuc, { recursive: true, force: true }); } catch { /* Windows còn giữ tệp — run.ts dọn sau */ }
  }
}
