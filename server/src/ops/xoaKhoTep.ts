/**
 * `npm run xoa-kho-tep` (PR-DEPLOY Task 5b — chủ sản phẩm chốt 02/10 "reset tại chỗ") — XOÁ SẠCH kho tệp bằng chứng (Netlify Blobs) của database đang trỏ tới.
 * Chỉ chạy TAY, đúng một lần khi reset bản chính: xoá rồi tạo lại database `pisatracking` cùng tên thì kho tệp `bang-chung-pisatracking-…` (tên đi theo
 * database, `khoTep.ts`) vẫn là kho cũ — tệp cũ sẽ trỏ vào dữ liệu không còn.
 *
 * Chốt an toàn: in tên kho + số tệp, bắt GÕ LẠI ĐÚNG tên kho; kho có chữ `demo` (kho của database THỬ, bản nháp đang dùng) bị từ chối trừ khi có cờ
 * `--cho-phep-demo`; không có Turso (kho cục bộ máy dev) thì từ chối. Không bao giờ in token. Hướng dẫn: TRIEN_KHAI.md mục 1a.
 */
import readline from 'node:readline/promises';

/** Kho Blobs tối thiểu cần để xoá (đúng hai hàm của `@netlify/blobs` Store). */
export type KhoXoaDuoc = {
  list(): Promise<{ blobs: { key: string }[] }>;
  delete(khoa: string): Promise<void>;
};

/** Số tệp trong kho — `init-ban-chinh` dùng để cảnh báo kho cũ còn tệp. Chỉ đọc. */
export async function demTepKho(kho: Pick<KhoXoaDuoc, 'list'>): Promise<number> {
  return (await kho.list()).blobs.length;
}

/** Xoá MỌI khoá của kho `ten`. Từ chối (không xoá gì) khi tên gõ lại không khớp, kho cục bộ, hoặc kho có `demo` mà không có cờ. */
export async function xoaSachKho(kho: KhoXoaDuoc, o: { ten: string; xacNhan: string; choPhepDemo?: boolean }): Promise<{ daXoa: number; conLai: number }> {
  if (o.ten === 'bang-chung-cuc-bo') throw new Error('Không có TURSO_DATABASE_URL — đây là kho cục bộ của máy dev, không phải kho bản chính. Chưa xoá gì.');
  if (/demo/i.test(o.ten) && !o.choPhepDemo) {
    throw new Error(`Kho ${o.ten} là kho của database THỬ (bản nháp đang dùng) — không xoá. Kiểm lại TURSO_DATABASE_URL. Chưa xoá gì.`);
  }
  if (o.xacNhan.trim() !== o.ten) throw new Error('Tên gõ lại không khớp tên kho — chưa xoá gì.');
  const { blobs } = await kho.list();
  let daXoa = 0;
  for (const { key } of blobs) { await kho.delete(key); daXoa += 1; }
  return { daXoa, conLai: await demTepKho(kho) };
}

/* Chỉ chạy khi được gọi như lệnh (phép kiểm import hàm mà không kích hoạt). */
if (process.argv[1] && /xoaKhoTep\.[jt]s$/.test(process.argv[1])) {
  const thieu = ['TURSO_DATABASE_URL', 'TURSO_AUTH_TOKEN', 'NETLIFY_SITE_ID', 'NETLIFY_AUTH_TOKEN'].filter((k) => !process.env[k]?.trim());
  if (thieu.length) {
    console.error(`[xoa-kho-tep] Thiếu biến: ${thieu.join(', ')} — xem TRIEN_KHAI.md mục 1a. Chưa xoá gì.`);
    process.exit(1);
  }
  const { moTaDichDb } = await import('../moiTruong.ts');
  const { tenKhoTep } = await import('../platform/khoTep.ts');
  const url = process.env.TURSO_DATABASE_URL!.trim();
  const ten = tenKhoTep(url);
  const { getStore } = await import('@netlify/blobs');
  const kho = getStore({ name: ten, siteID: process.env.NETLIFY_SITE_ID!.trim(), token: process.env.NETLIFY_AUTH_TOKEN!.trim() }) as unknown as KhoXoaDuoc;
  console.log(`[xoa-kho-tep] Database: ${moTaDichDb(url)}`);
  console.log(`[xoa-kho-tep] Kho tệp: ${ten} — đang có ${await demTepKho(kho)} tệp.`);
  const hoi = readline.createInterface({ input: process.stdin, output: process.stdout });
  const xacNhan = await hoi.question(`[xoa-kho-tep] Gõ lại ĐÚNG tên kho (${ten}) để XOÁ SẠCH, gõ khác để thoát: `);
  hoi.close();
  try {
    const r = await xoaSachKho(kho, { ten, xacNhan, choPhepDemo: process.argv.includes('--cho-phep-demo') });
    console.log(`[xoa-kho-tep] Xong. Đã xoá ${r.daXoa} tệp — kho còn ${r.conLai} tệp.`);
    if (r.conLai) process.exit(1);
  } catch (e) {
    console.error(`[xoa-kho-tep] TỪ CHỐI: ${(e as Error).message}`);
    process.exit(1);
  }
}
