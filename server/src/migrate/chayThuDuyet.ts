/**
 * `npm run chay-thu:duyet` — CHẠY THỬ CHỈ ĐỌC trước bước migrate của PR-DUYET (T78).
 *
 * Mở cùng database như `migrate/run.ts` nhưng KHÔNG gọi `migrate()` và không ghi gì — chỉ SELECT. In 3 mục:
 *   (1) số thẻ sẽ tạo theo loại + 5 dòng mẫu · (2) thẻ chết bị bỏ (PA chờ mà đã huỷ/Case đóng; đề nghị dời đã quá hạn duyệt) ·
 *   (3) số GVCN đang sửa được target/lộ trình (sẽ mất quyền — Câu 1 = B, chuyển lớp giữ).
 */
import fs from 'node:fs';
import { DB_PATH, closeDb, db, isInitialised, laDbTuXa } from '../db.ts';
import { keHoachDuyet } from './prDuyet.ts';

const dd = (iso: string | null) => (iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}` : 'không hạn');
const bang = (rows: any[]) => { if (rows.length) console.table(rows); else console.log('    (không có)'); };
const mau = (rows: any[]) => rows.slice(0, 5).map((r) => ({ dòng: `#${r.id} · ${r.hv ?? '?'} · ${r.lop ?? '?'} · hạn ${dd(r.han)}` }));

console.log(`[chay-thu:duyet] CHỈ ĐỌC — không nâng cấp, không ghi. Database: ${DB_PATH}`);
if (!laDbTuXa() && !fs.existsSync(DB_PATH)) {
  console.log('[chay-thu:duyet] Không có file database ở đường dẫn trên — không có gì để chạy thử.');
  process.exit(0);
}
if (!isInitialised()) {
  console.log('[chay-thu:duyet] Database chưa có bảng nào — không có gì để chạy thử.');
  closeDb();
  process.exit(0);
}

const kh = keHoachDuyet(db());
console.log(`\n(1) Sẽ tạo ${kh.mauPa.length + kh.mauDoi.length} thẻ: Đề xuất PA ${kh.mauPa.length}`
  + ` (trong đó ${kh.mauPa.filter((r) => r.xinCu).length} là "Xin hỗ trợ QL" kiểu cũ) · Dời lịch lần 2 ${kh.mauDoi.length}`);
console.log('    Đề xuất PA:'); bang(mau(kh.mauPa));
console.log('    Dời lịch lần 2:'); bang(mau(kh.mauDoi));
console.log(`\n(2) Thẻ chết bị bỏ: ${kh.paChet} PA "chờ duyệt" mà PA đã huỷ hoặc Case đã đóng (không tạo thẻ)`
  + ` · ${kh.doiQuaHan} đề nghị dời đã quá hạn duyệt (tạo thẻ rồi tự đóng ở lần mở đầu tiên)`);
console.log(`\n(3) ${kh.gvcnMatQuyen} GVCN đang sửa được target/lộ trình — sau nâng cấp gửi "Đề xuất sửa" để Quản lý duyệt`);
console.log('\n[chay-thu:duyet] Xong — database không bị đổi.');
closeDb();
