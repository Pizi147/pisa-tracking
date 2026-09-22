/**
 * MỘT NƠI ĐỌC BIẾN MÔI TRƯỜNG của bản chính. Nơi khác không đọc thẳng process.env cho các biến này.
 * Tên biến là hợp đồng với TRIEN_KHAI.md — đổi tên ở đây thì sửa TRIEN_KHAI.md cùng commit.
 */
import path from 'node:path';

export function laBanChinh(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.BAN_CHINH === '1';
}

export type CauHinhDb =
  | { kieu: 'file'; duongDan: string }
  | { kieu: 'turso'; url: string; authToken: string };

export function cauHinhDb(env: NodeJS.ProcessEnv = process.env, macDinh = ''): CauHinhDb {
  const url = env.TURSO_DATABASE_URL?.trim();
  if (url) {
    const authToken = env.TURSO_AUTH_TOKEN?.trim();
    if (!authToken) throw new Error('Có TURSO_DATABASE_URL nhưng thiếu TURSO_AUTH_TOKEN — không kết nối.');
    return { kieu: 'turso', url, authToken };
  }
  return { kieu: 'file', duongDan: env.PISA_DB || macDinh || path.resolve('data', 'pisa-demo.sqlite') };
}

/** Tên máy chủ của URL database (viết thường). Dùng để so NGUYÊN tên, không so "có chứa". */
export function tenMayChuDb(url: string): string {
  try { return new URL(url.replace(/^libsql:/, 'https:')).hostname.toLowerCase(); } catch { return ''; }
}

/**
 * Tên máy chủ có dạng database BẢN CHÍNH (`pisatracking-<tổ chức>…`, KHÔNG có `-demo-`)? Tên thật chủ sản phẩm đặt 22/09:
 * bản chính `pisatracking`, bản thử `pisatracking-demo` — tên bản chính nằm trọn trong tên bản thử, nên luôn so phần đầu.
 */
export function laTenDbBanChinh(url: string): boolean {
  const ten = tenMayChuDb(url);
  return ten.startsWith('pisatracking-') && !ten.startsWith('pisatracking-demo-');
}

/**
 * Cho `npm run seed` (XOÁ SẠCH rồi dựng demo) chạy vào Turso? Chỉ khi biến cho phép là NGUYÊN tên máy chủ của
 * database đang trỏ tới. Lý do (22/09): tên bản chính `pisatracking` nằm trọn trong tên bản thử
 * `pisatracking-demo`, nên so "có chứa" sẽ để lọt bản chính. Tên máy chủ kiểu bản chính thì LUÔN từ chối, bất kể biến
 * cho phép — dán nhầm tên bản chính vào biến cũng không xoá được bản chính.
 */
export function choPhepSeedTurso(url: string, choPhep: string | undefined): boolean {
  if (laTenDbBanChinh(url)) return false;
  const ten = tenMayChuDb(url);
  return !!ten && !!choPhep && ten === choPhep.trim().toLowerCase();
}
