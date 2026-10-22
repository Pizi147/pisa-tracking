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
export const tenSql = (s: string) => `"${s.replace(/"/g, '""')}"`;

/**
 * Lọc bỏ ĐÚNG các đối tượng nội bộ `sqlite_…`. Trong LIKE, `_` khớp MỌI ký tự — `NOT LIKE 'sqlite_%'` bỏ sót luôn bảng
 * `sqliteish` của người dùng (rà soát 22/09) — nên phải ESCAPE.
 */
export const KHONG_NOI_BO = "name NOT LIKE 'sqlite\\_%' ESCAPE '\\'";

/**
 * BẢNG KHÔNG CHÉP DÒNG (chủ sản phẩm chốt 22/09): `demo_sessions` giữ MÃ ĐĂNG NHẬP còn hiệu lực — ai có một file sao lưu là
 * đăng nhập được như người đang đăng nhập, kể cả quản trị. Sao lưu và khôi phục giữ CẤU TRÚC bảng nhưng không chép dòng
 * nào: khôi phục xong mọi người đăng nhập lại. Đây là bảng DUY NHẤT chứa mã đăng nhập (không có mã đặt lại mật khẩu — ứng
 * dụng không có luồng quên mật khẩu). Tính chất (c): mọi bảng đúng số dòng như nguồn, TRỪ bảng này luôn rỗng có chủ đích.
 */
export const BANG_KHONG_CHEP_DONG: ReadonlySet<string> = new Set(['demo_sessions']);

export type DoiTuongDb = { type: string; name: string; sql: string };
/** Bảng (theo thứ tự tạo) và phần còn lại (chỉ mục, view, trigger — tạo SAU khi có dữ liệu). Chỉ đọc. */
export function docCauTruc(nguon: any): { bang: DoiTuongDb[]; conLai: DoiTuongDb[] } {
  const doiTuong = nguon.prepare(`SELECT type, name, sql FROM sqlite_master WHERE sql IS NOT NULL AND ${KHONG_NOI_BO} ORDER BY rowid`)
    .all() as DoiTuongDb[];
  return { bang: doiTuong.filter((o) => o.type === 'table'), conLai: doiTuong.filter((o) => o.type !== 'table') };
}

/**
 * Đọc MỌI dòng một bảng. `safeIntegers`: số nguyên đọc ra là BigInt — không thì số > 2^53 bị làm tròn và số nguyên ở cột
 * không khai kiểu thành REAL (rà soát 22/09, đã tái hiện). Chỉ đọc.
 */
export function docBang(nguon: any, ten: string): { cot: string[]; dong: Record<string, unknown>[] } {
  const cot = (nguon.prepare(`PRAGMA table_info(${tenSql(ten)})`).all() as { name: string }[]).map((c) => c.name);
  const dong = nguon.prepare(`SELECT * FROM ${tenSql(ten)}`).safeIntegers(true).all() as Record<string, unknown>[];
  return { cot, dong };
}

/**
 * Chèn các dòng vào `dich`, `moiLan` dòng một câu INSERT (qua mạng Turso mỗi câu là một lượt đi về — gộp lô cho nhanh).
 * Luôn truyền MẢNG tham số: libsql chết hẳn nếu một Buffer là tham số duy nhất (db.ts).
 */
export function chenDong(dich: any, ten: string, cot: string[], dong: Record<string, unknown>[], moiLan = 1): void {
  if (!dong.length) return;
  const k = Math.max(1, Math.min(moiLan, Math.floor(30000 / Math.max(1, cot.length))));
  const cau = (so: number) => `INSERT INTO ${tenSql(ten)} (${cot.map(tenSql).join(', ')}) VALUES `
    + Array.from({ length: so }, () => `(${cot.map(() => '?').join(', ')})`).join(', ');
  const thamSo = (ds: Record<string, unknown>[]) => ds.flatMap((r) => cot.map((c) => giaTriGhi(r[c])));
  const chenDu = dich.prepare(cau(k));
  let i = 0;
  for (; i + k <= dong.length; i += k) chenDu.run(thamSo(dong.slice(i, i + k)));
  if (i < dong.length) dich.prepare(cau(dong.length - i)).run(thamSo(dong.slice(i)));
}

export const demDong = (c: any, ten: string, schema = 'main') =>
  Number((c.prepare(`SELECT COUNT(*) AS n FROM ${schema}.${tenSql(ten)}`).get() as { n: number | bigint }).n);

/**
 * Đọc nguồn TRONG MỘT GIAO DỊCH ĐỌC: mọi bảng cùng một thời điểm (không lệch nhau nếu có người ghi giữa chừng). Chỉ có
 * BEGIN … COMMIT quanh các câu SELECT — không một câu ghi nào. Nguồn đã ở trong giao dịch thì dùng luôn giao dịch đó.
 */
export function trongGiaoDichDoc<T>(nguon: any, fn: () => T): T {
  if (nguon.inTransaction) return fn();
  nguon.exec('BEGIN');
  try {
    const out = fn();
    nguon.exec('COMMIT');
    return out;
  } catch (e) {
    try { nguon.exec('ROLLBACK'); } catch { /* giữ lỗi gốc */ }
    throw e;
  }
}

/** Chép mọi bảng (cấu trúc + dữ liệu) rồi mọi chỉ mục/view/trigger của `nguon` sang `dich` đang RỖNG. */
export function saoLuu(nguon: any, dich: any, o: { giaoDich?: boolean } = {}): { bang: number; dong: number } {
  if (dich.prepare(`SELECT 1 FROM sqlite_master WHERE ${KHONG_NOI_BO} LIMIT 1`).get()) {
    throw new Error('Database đích không rỗng — sao lưu chỉ ghi vào một file MỚI, không bao giờ ghi đè.');
  }
  /* ponytail: Turso cắt giao dịch tương tác dài ("connection closed before message completed", 22/10, DB 9 MB) — nguồn ở
     xa đọc từng bảng không giao dịch; bù lại chạy lúc không ai nhập liệu (TRIEN_KHAI mục 10). Cần đúng một thời điểm thì
     đọc theo lô trong nhiều giao dịch ngắn. */
  const chay = <T>(fn: () => T): T => (o.giaoDich === false ? fn() : trongGiaoDichDoc(nguon, fn));
  return chay(() => {
    const { bang, conLai } = docCauTruc(nguon);
    dich.pragma('foreign_keys = OFF');
    for (const b of bang) dich.exec(b.sql);
    let dong = 0;
    for (const b of bang) {
      /* Bảng mã đăng nhập: không đọc, không chép dòng nào — bản sao chỉ giữ cấu trúc. */
      const d = BANG_KHONG_CHEP_DONG.has(b.name) ? { cot: [], dong: [] } : docBang(nguon, b.name);
      if (d.dong.length) dich.transaction(() => chenDong(dich, b.name, d.cot, d.dong))();
      const daChep = demDong(dich, b.name);
      if (daChep !== d.dong.length) throw new Error(`Bảng ${b.name}: đọc ${d.dong.length} dòng nhưng bản sao có ${daChep}.`);
      dong += d.dong.length;
    }
    for (const o of conLai) dich.exec(o.sql);
    return { bang: bang.length, dong };
  });
}

/** Kiểm một bản sao (schema `ten` của kết nối `c`): toàn vẹn, có người dùng; có `soSanh` thì mọi bảng cùng số dòng với nó. */
function kiemBanSao(c: any, ten: string, soSanh?: string): void {
  const toanVen = (c.prepare(`PRAGMA ${ten}.integrity_check`).get() as { integrity_check?: string } | undefined)?.integrity_check;
  if (toanVen !== 'ok') throw new Error(`Bản sao hỏng (integrity_check: ${toanVen}).`);
  const coUsers = !!c.prepare(`SELECT 1 FROM ${ten}.sqlite_master WHERE type = 'table' AND name = 'users'`).get();
  const soNguoi = coUsers ? (c.prepare(`SELECT COUNT(*) AS n FROM ${ten}.users`).get() as { n: number }).n : 0;
  if (!(soNguoi > 0)) throw new Error('Bản sao không có người dùng nào — coi là hỏng, không giữ.');
  if (!soSanh) return;
  for (const { name } of c.prepare(`SELECT name FROM ${soSanh}.sqlite_master WHERE type = 'table' AND ${KHONG_NOI_BO}`).all() as { name: string }[]) {
    const a = demDong(c, name, soSanh);
    const b = demDong(c, name, ten);
    if (a !== b) throw new Error(`File sao lưu, bảng ${name}: có ${b} dòng, đúng ra ${a}.`);
  }
}

/**
 * Sao lưu ra ĐÚNG file `duongDan` (chưa có).
 *  1. Chép vào một database TRONG BỘ NHỚ và kiểm ở đó (toàn vẹn, có người dùng, mỗi bảng đủ dòng) — chưa đụng ổ đĩa.
 *  2. Ghi ra một file TẠM `<tên>.dang-ghi` bằng `VACUUM INTO` (SQLite tự từ chối nếu file đã có). Tên tạm không bao giờ
 *     khớp dạng tên bản sao lưu — ghi hỏng giữa chừng (Drive đầy…) thì file dở không bao giờ bị coi là một bản sao lưu.
 *  3. MỞ LẠI file tạm (ATTACH trên chính kết nối bộ nhớ), kiểm lần nữa, so từng bảng; xong DETACH.
 *  4. Chép file tạm sang tên thật với cờ "không ghi đè" (COPYFILE_EXCL), so dung lượng, xoá file tạm.
 * Vì sao không ghi thẳng ra file rồi đổi tên: trên Windows, libsql đã `prepare` câu lệnh thì `close()` chưa nhả file
 * (đã thử 22/09: xoá/đổi tên → EPERM), còn DETACH thì nhả ngay; và `rename` trên Windows GHI ĐÈ file cùng tên.
 * Hỏng ở bất kỳ bước nào → chỉ xoá file tạm của chính lần này, và file thật chỉ khi chính lần này đã tạo ra nó.
 */
export function saoLuuRaFile(nguon: any, duongDan: string, o: { giaoDich?: boolean } = {}): { bang: number; dong: number } {
  const tam = `${duongDan}.dang-ghi`;
  if (fs.existsSync(duongDan)) {
    throw new Error(`Đã có file ${path.basename(duongDan)} — không ghi đè bản sao lưu nào. Chờ một phút rồi chạy lại.`);
  }
  if (fs.existsSync(tam)) {
    throw new Error(`Đã có file dở ${path.basename(tam)} (một lần sao lưu trước bị ngắt?) — xoá tay file đó rồi chạy lại.`);
  }
  fs.mkdirSync(path.dirname(duongDan), { recursive: true });
  const chuoiTam = `'${tam.replace(/'/g, "''")}'`;
  const boNho = new Database(':memory:');
  let daTaoTam = false;
  let daTaoFile = false;
  try {
    const ketQua = saoLuu(nguon, boNho, o);
    kiemBanSao(boNho, 'main');
    try { boNho.exec(`VACUUM INTO ${chuoiTam}`); daTaoTam = true; } catch (e) {
      /* 'already exists' = có ai tạo file tạm đúng lúc này — không phải của mình, không đụng. Lỗi khác = file dở của mình. */
      if (!/already exists/i.test((e as Error).message)) daTaoTam = true;
      throw e;
    }
    boNho.exec(`ATTACH ${chuoiTam} AS kiem`);
    try { kiemBanSao(boNho, 'kiem', 'main'); } finally { boNho.exec('DETACH kiem'); }
    daTaoFile = true;
    try { fs.copyFileSync(tam, duongDan, fs.constants.COPYFILE_EXCL); } catch (e) {
      if ((e as NodeJS.ErrnoException).code === 'EEXIST') daTaoFile = false;   // file thật đã có từ trước — không phải của mình
      throw e;
    }
    if (fs.statSync(duongDan).size !== fs.statSync(tam).size) throw new Error('Chép ra file thật bị thiếu byte.');
    fs.rmSync(tam, { force: true });
    return ketQua;
  } catch (e) {
    if (daTaoTam) { try { fs.rmSync(tam, { force: true }); } catch { /* lỗi gốc bên dưới */ } }
    if (daTaoFile) { try { fs.rmSync(duongDan, { force: true }); } catch { /* lỗi gốc bên dưới */ } }
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
 * Một bản không xoá được (file đang bị giữ, Drive đang đồng bộ) thì bỏ qua bản đó, báo qua `khiLoi` — không có `khiLoi`
 * thì ném lỗi sau khi đã thử hết.
 */
export function giuBanMoiNhat(
  thuMuc: string, soBan: number,
  o: { tienTo?: string; giuLai?: string; khiLoi?: (ten: string, loi: Error) => void } = {},
): string[] {
  if (!fs.existsSync(thuMuc)) return [];
  const mau = mauBan(o.tienTo ?? '');
  const ban = fs.readdirSync(thuMuc)
    .filter((f) => mau.test(f) && fs.statSync(path.join(thuMuc, f)).isFile())
    .sort().reverse();
  const daXoa: string[] = [];
  const loi: [string, Error][] = [];
  for (const f of ban.slice(soBan).filter((x) => x !== o.giuLai)) {
    try {
      fs.rmSync(path.join(thuMuc, f), { force: true });
      daXoa.push(f);
      const thuMucTep = path.join(thuMuc, f.replace(/\.sqlite$/, '-tep'));
      if (fs.existsSync(thuMucTep)) fs.rmSync(thuMucTep, { recursive: true, force: true });
    } catch (e) {
      loi.push([f, e as Error]);
    }
  }
  if (loi.length && !o.khiLoi) throw new Error(`Không xoá được: ${loi.map(([f, e]) => `${f} (${e.message})`).join('; ')}`);
  for (const [f, e] of loi) o.khiLoi?.(f, e);
  return daXoa;
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
