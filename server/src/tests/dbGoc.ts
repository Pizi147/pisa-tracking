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
import { xoaNho } from '../platform/nguCanhRequest.ts';
import { clearScoringModeCache } from '../fasttrack/skillSchedule.ts';
import { datSoEmailThu, soEmailThu } from '../seed/emailThu.ts';
import { datTepDangDung, tepDbDangDung } from './banSaoDb.ts';

const GOC = path.join(path.dirname(DB_PATH), 'goc.sqlite');
/** Trạng thái tiến trình đi cùng DB gốc: số đếm `emailThu` lúc chụp. */
let emailGoc = 0;

/** Bộ nhớ đệm cấp module đọc từ DB: bỏ khi đổi kết nối (`clearScoringModeCache` bỏ cả nhớ bảng tham chiếu — TL-NEN `xoaNhoThamChieu`). */
function boNhoDem() { xoaNho(); clearScoringModeCache(); }

/** Gộp WAL vào tệp rồi chép DB_PATH → `goc.sqlite` cạnh nó. */
export function chupDbGoc(): string {
  db().pragma('wal_checkpoint(TRUNCATE)');
  for (const duoi of ['-wal', '-shm']) if (fs.existsSync(GOC + duoi)) fs.rmSync(GOC + duoi);
  fs.copyFileSync(DB_PATH, GOC);
  emailGoc = soEmailThu();
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
  const emailCu = soEmailThu();
  datKetNoiChoPhepKiem(conn);
  datTepDangDung(tep);
  datSoEmailThu(emailGoc);
  boNhoDem();
  const dong = () => {
    datKetNoiChoPhepKiem(cu);
    datTepDangDung(tepCu);
    datSoEmailThu(emailCu);
    boNhoDem();
    try { conn.close(); } catch { /* đã đóng */ }
    try { fs.rmSync(thuMuc, { recursive: true, force: true }); } catch { /* Windows còn giữ tệp — run.ts dọn z2- sau 1 giờ */ }
  };
  return { conn, tep, dong };
}

/**
 * CN-2: chia tệp độc lập vào nhóm 1…n THAM LAM — tệp lâu trước, mỗi tệp vào nhóm đang nhẹ nhất; nhóm 1 khởi đầu bằng `chuoiMs` (phần chuỗi).
 * Thuần (không đọc DB) — run.ts gọi lúc nạp, mọi nhóm ra cùng kết quả.
 */
export function chiaThamLam(thoiGian: Record<string, number>, chuoiMs: number, n: number): Map<string, number> {
  const tai = Array.from({ length: Math.max(1, n) }, (_, i) => (i === 0 ? chuoiMs : 0));
  const ra = new Map<string, number>();
  for (const [ten, ms] of Object.entries(thoiGian).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) {
    const k = tai.indexOf(Math.min(...tai));
    tai[k] += ms;
    ra.set(ten, k + 1);
  }
  return ra;
}

/** CN-3a: nhóm của MỘT tệp — tệp chuỗi (không độc lập) luôn nhóm 1; tệp độc lập theo `chia`, chưa có trong `chia` (chưa đăng ký) → 1. */
export function nhomCuaTep(chia: ReadonlyMap<string, number>, docLap: boolean, ten: string): number {
  return docLap ? chia.get(ten) ?? 1 : 1;
}
