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
