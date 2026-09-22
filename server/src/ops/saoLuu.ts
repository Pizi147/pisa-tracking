/**
 * SAO LƯU (PR-Z2) — chép TOÀN BỘ database (cấu trúc + dữ liệu) ra một file .sqlite mới, và tải kho tệp bằng chứng.
 *
 * AN TOÀN DỮ LIỆU:
 *   - Nguồn chỉ được ĐỌC: tới nguồn chỉ có SELECT và PRAGMA đọc. Không một câu ghi nào.
 *   - Đích phải RỖNG; file đích đã có thì từ chối — không bao giờ ghi đè một bản sao lưu.
 *   - Dựng và kiểm bản sao TRONG BỘ NHỚ trước, mới ghi ra đĩa (`VACUUM INTO`, không ghi đè), rồi mở lại file để kiểm.
 *     Hỏng thì chỉ xoá đúng file của chính lần sao lưu này (xem `saoLuuRaFile`).
 *   - Giữ 14 bản: chỉ xoá file đúng dạng `pisa-NĂM-THÁNG-NGÀY-GIỜPHÚT.sqlite` (và thư mục `…-tep` của đúng bản đó).
 * Điểm chạy lệnh: `runSaoLuu.ts`.
 */
import fs from 'node:fs';
import path from 'node:path';
import Database from 'libsql';
import { khoTepODia } from '../platform/khoTep.ts';
import { tenMayChuDb } from '../moiTruong.ts';

/**
 * Tên một bản sao lưu: `pisa-<tiền tố database>-NĂM-THÁNG-NGÀY-GIỜPHÚT.sqlite` (tiền tố rỗng = dạng cũ không tên database).
 * Chỉ file ĐÚNG dạng này, ĐÚNG tiền tố, mới có thể bị `giuBanMoiNhat` xoá — bản của database khác không bao giờ bị đụng.
 */
const mauBan = (tienTo: string) =>
  new RegExp(`^pisa-${tienTo ? tienTo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '-' : ''}\\d{4}-\\d{2}-\\d{2}-\\d{4}\\.sqlite$`);

/**
 * Tiền tố tên bản sao lưu = phần đầu tên máy chủ database (`pisatracking-pizi147`), không có thì `cuc-bo` (máy dev, URL
 * `file:`). Để bản sao lưu nói rõ CỦA DATABASE NÀO, và luật 14 bản tính riêng từng database (rà soát 22/09).
 */
export function tienToBanSaoLuu(url: string | null): string {
  return (url ? tenMayChuDb(url).split('.')[0] : '') || 'cuc-bo';
}

/** Giá trị đọc từ libsql → giá trị ghi được: cột BLOB đọc ra là ArrayBuffer, ghi vào phải là Buffer. */
const giaTriGhi = (v: unknown) => (v instanceof ArrayBuffer ? Buffer.from(v) : v);
const tenSql = (s: string) => `"${s.replace(/"/g, '""')}"`;

/** Chép mọi bảng (cấu trúc + dữ liệu) rồi mọi chỉ mục/view/trigger của `nguon` sang `dich` đang RỖNG. */
export function saoLuu(nguon: any, dich: any): { bang: number; dong: number } {
  if (dich.prepare("SELECT 1 FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' LIMIT 1").get()) {
    throw new Error('Database đích không rỗng — sao lưu chỉ ghi vào một file MỚI, không bao giờ ghi đè.');
  }
  const doiTuong = nguon.prepare(
    "SELECT type, name, sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY rowid",
  ).all() as { type: string; name: string; sql: string }[];
  const bang = doiTuong.filter((o) => o.type === 'table');

  dich.pragma('foreign_keys = OFF');
  for (const b of bang) dich.exec(b.sql);
  let dong = 0;
  for (const b of bang) {
    const cot = (nguon.prepare(`PRAGMA table_info(${tenSql(b.name)})`).all() as { name: string }[]).map((c) => c.name);
    const cacDong = nguon.prepare(`SELECT * FROM ${tenSql(b.name)}`).all() as Record<string, unknown>[];
    if (cacDong.length) {
      /* Luôn truyền MẢNG tham số: libsql chết hẳn nếu một Buffer là tham số duy nhất (db.ts). */
      const chen = dich.prepare(`INSERT INTO ${tenSql(b.name)} (${cot.map(tenSql).join(', ')}) VALUES (${cot.map(() => '?').join(', ')})`);
      dich.transaction(() => { for (const r of cacDong) chen.run(cot.map((c) => giaTriGhi(r[c]))); })();
    }
    const daChep = (dich.prepare(`SELECT COUNT(*) AS n FROM ${tenSql(b.name)}`).get() as { n: number }).n;
    if (daChep !== cacDong.length) throw new Error(`Bảng ${b.name}: đọc ${cacDong.length} dòng nhưng bản sao có ${daChep}.`);
    dong += cacDong.length;
  }
  for (const o of doiTuong.filter((x) => x.type !== 'table')) dich.exec(o.sql);
  return { bang: bang.length, dong };
}

/** Kiểm một bản sao (schema `ten` của kết nối `c`): toàn vẹn, có người dùng; có `soSanh` thì mọi bảng cùng số dòng với nó. */
function kiemBanSao(c: any, ten: string, soSanh?: string): void {
  const toanVen = (c.prepare(`PRAGMA ${ten}.integrity_check`).get() as { integrity_check?: string } | undefined)?.integrity_check;
  if (toanVen !== 'ok') throw new Error(`Bản sao hỏng (integrity_check: ${toanVen}).`);
  const coUsers = !!c.prepare(`SELECT 1 FROM ${ten}.sqlite_master WHERE type = 'table' AND name = 'users'`).get();
  const soNguoi = coUsers ? (c.prepare(`SELECT COUNT(*) AS n FROM ${ten}.users`).get() as { n: number }).n : 0;
  if (!(soNguoi > 0)) throw new Error('Bản sao không có người dùng nào — coi là hỏng, không giữ.');
  if (!soSanh) return;
  for (const { name } of c.prepare(`SELECT name FROM ${soSanh}.sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`).all() as { name: string }[]) {
    const a = (c.prepare(`SELECT COUNT(*) AS n FROM ${soSanh}.${tenSql(name)}`).get() as { n: number }).n;
    const b = (c.prepare(`SELECT COUNT(*) AS n FROM ${ten}.${tenSql(name)}`).get() as { n: number }).n;
    if (a !== b) throw new Error(`File sao lưu, bảng ${name}: có ${b} dòng, đúng ra ${a}.`);
  }
}

/**
 * Sao lưu ra ĐÚNG file `duongDan` (chưa có).
 *  1. Chép vào một database TRONG BỘ NHỚ và kiểm ở đó (toàn vẹn, có người dùng, mỗi bảng đủ dòng) — chưa đụng ổ đĩa.
 *  2. Ghi ra đĩa bằng `VACUUM INTO`: SQLite tự từ chối nếu file đã có (lớp chống ghi đè thứ hai) và đóng file ngay.
 *  3. MỞ LẠI file vừa ghi (ATTACH trên chính kết nối bộ nhớ) và kiểm lần nữa, so từng bảng; xong DETACH.
 * Vì sao không ghi thẳng ra file rồi đổi tên: trên Windows, libsql đã `prepare` câu lệnh thì `close()` chưa nhả file
 * (đã thử 22/09: xoá/đổi tên → EPERM), nên không dọn được file dở. DETACH thì nhả ngay.
 * Hỏng ở bước 1 → không có file nào; hỏng ở bước 3 → chỉ xoá đúng file vừa ghi ở bước 2.
 */
export function saoLuuRaFile(nguon: any, duongDan: string): { bang: number; dong: number } {
  if (fs.existsSync(duongDan)) {
    throw new Error(`Đã có file ${path.basename(duongDan)} — không ghi đè bản sao lưu nào. Chờ một phút rồi chạy lại.`);
  }
  fs.mkdirSync(path.dirname(duongDan), { recursive: true });
  const chuoiFile = `'${duongDan.replace(/'/g, "''")}'`;
  const boNho = new Database(':memory:');
  let daGhi = false;
  try {
    const ketQua = saoLuu(nguon, boNho);
    kiemBanSao(boNho, 'main');
    boNho.exec(`VACUUM INTO ${chuoiFile}`);
    daGhi = true;
    boNho.exec(`ATTACH ${chuoiFile} AS kiem`);
    try { kiemBanSao(boNho, 'kiem', 'main'); } finally { boNho.exec('DETACH kiem'); }
    return ketQua;
  } catch (e) {
    if (daGhi) { try { fs.rmSync(duongDan, { force: true }); } catch { /* không xoá được — lỗi bên dưới nói rõ */ } }
    throw e;
  } finally {
    boNho.close();
  }
}

/**
 * Tên bản sao lưu theo giờ Việt Nam: `pisa-<tiền tố>-NĂM-THÁNG-NGÀY-GIỜPHÚT` (cùng tiền tố thì sắp theo tên = sắp theo
 * thời gian). Không tiền tố → dạng cũ `pisa-NĂM-…`.
 */
export function tenBanSaoLuu(luc: Date = new Date(), tienTo = ''): string {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(luc).map((x) => [x.type, x.value]));
  return `pisa-${tienTo ? `${tienTo}-` : ''}${p.year}-${p.month}-${p.day}-${p.hour}${p.minute}`;
}

/**
 * Giữ `soBan` bản mới nhất CỦA MỘT database (`tienTo`), xoá bản cũ hơn cùng thư mục `…-tep` của đúng bản đó. Chỉ đụng
 * file đúng dạng tên + đúng tiền tố; không bao giờ xoá `giuLai` (bản vừa tạo). Trả danh sách đã xoá.
 */
export function giuBanMoiNhat(thuMuc: string, soBan: number, o: { tienTo?: string; giuLai?: string } = {}): string[] {
  if (!fs.existsSync(thuMuc)) return [];
  const mau = mauBan(o.tienTo ?? '');
  const ban = fs.readdirSync(thuMuc)
    .filter((f) => mau.test(f) && fs.statSync(path.join(thuMuc, f)).isFile())
    .sort().reverse();
  const xoa = ban.slice(soBan).filter((f) => f !== o.giuLai);
  for (const f of xoa) {
    fs.rmSync(path.join(thuMuc, f), { force: true });
    const thuMucTep = path.join(thuMuc, f.replace(/\.sqlite$/, '-tep'));
    if (fs.existsSync(thuMucTep)) fs.rmSync(thuMucTep, { recursive: true, force: true });
  }
  return xoa;
}

/** Kho Blobs tối thiểu cần cho sao lưu (đúng hai hàm của `@netlify/blobs` Store). */
export type KhoDocDuoc = {
  list(): Promise<{ blobs: { key: string }[] }>;
  get(khoa: string, o: { type: 'arrayBuffer' }): Promise<ArrayBuffer | null>;
};

/** Tải MỌI tệp của kho ra `thuMuc`, giữ đường dẫn khoá (`violation/<tên>.pdf`…). Chỉ đọc kho. */
export async function saoLuuTep(kho: KhoDocDuoc, thuMuc: string): Promise<{ tep: number; byte: number }> {
  const { blobs } = await kho.list();
  const ghi = khoTepODia(thuMuc);   // có sẵn chốt: khoá không được thoát ra ngoài thư mục
  let tep = 0, byte = 0;
  for (const { key } of blobs) {
    const ab = await kho.get(key, { type: 'arrayBuffer' });
    if (!ab) continue;                // bị xoá giữa lúc liệt kê và lúc tải
    const duLieu = Buffer.from(ab);
    await ghi.ghi(key, duLieu, '');
    tep += 1;
    byte += duLieu.length;
  }
  return { tep, byte };
}
