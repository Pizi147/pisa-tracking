/**
 * OV-6b1 (kế hoạch `2026-10-12-pr-ov6b1-chuong-trinh-cau-hinh.md`, chạy lặp được): cấu hình chương trình chép vào lớp lúc tạo.
 * (a) cột `routes.lich_mt` (tuần học của từng MT theo lộ trình), `programmes.nguong_dat`, bản chụp `classes.lich_mt` / `classes.nguong_dat` — chỉ thêm.
 * (b) điền cấu hình theo HẰNG SỐ ĐANG CHẠY (LT 6/12/16, RF 4/8, đạt từ 70 %) rồi điền bản chụp cho MỌI lớp còn trống — lớp đang chạy
 *     giữ đúng lịch cũ trước khi mã đọc cấu hình (luật số 1). Lớp thường còn thiếu số tuần lấy theo cấu hình hiện hành (`dienMocLop`).
 * `dienCauHinh` + `dienBanChupLop` dùng chung với seed (`duLieuNen.ts`, `seed.ts`): DB mới và DB cũ đi cùng một luật.
 */
import { tx } from '../db.ts';
import { lichMtGoc } from '../../../shared/domain/index.ts';
import { dienMocLop } from './prLop.ts';

const LICH_GOC_SQL = (route: string) => `CASE WHEN ${route} = 'RF' THEN '${JSON.stringify(lichMtGoc('RF'))}' ELSE '${JSON.stringify(lichMtGoc('LT1'))}' END`;
const LOP_THUONG_SQL = `programme_code IN (SELECT code FROM programmes WHERE scoring_mode = 'ratio')`;

/** Cấu hình còn trống → hằng số đang chạy. Trả số dòng đã điền. */
export function dienCauHinh(conn: any): number {
  return conn.prepare(`UPDATE routes SET lich_mt = ${LICH_GOC_SQL('code')} WHERE lich_mt IS NULL`).run().changes
    + conn.prepare(`UPDATE programmes SET nguong_dat = 0.7 WHERE nguong_dat IS NULL AND scoring_mode = 'ratio'`).run().changes;
}

/** Bản chụp còn trống của lớp: FT → tuần MT theo hằng số của lộ trình lớp; lớp thường → ngưỡng đạt của chương trình + số tuần. Trả số lớp đã điền. */
export function dienBanChupLop(conn: any): number {
  const n = (conn.prepare(
    `SELECT COUNT(*) n FROM classes WHERE (is_fast_track = 1 AND lich_mt IS NULL) OR (${LOP_THUONG_SQL} AND (nguong_dat IS NULL
       OR (so_tuan IS NULL AND (SELECT p.weeks FROM programmes p WHERE p.code = classes.programme_code) IS NOT NULL)))`,
  ).get() as any).n as number;
  conn.prepare(`UPDATE classes SET lich_mt = ${LICH_GOC_SQL('route')} WHERE is_fast_track = 1 AND lich_mt IS NULL`).run();
  conn.prepare(`UPDATE classes SET nguong_dat = COALESCE((SELECT p.nguong_dat FROM programmes p WHERE p.code = classes.programme_code), 0.7)
    WHERE nguong_dat IS NULL AND ${LOP_THUONG_SQL}`).run();
  dienMocLop(conn);
  return n;
}

export function migratePrOv6b1(conn: any, applied: string[]) {
  const cot = (bang: string) => (conn.prepare('SELECT name FROM pragma_table_info(?)').all(bang) as any[]).map((c) => c.name as string);
  if (!cot('routes').length || !cot('programmes').length || !cot('classes').includes('so_tuan')) return;
  tx(() => {
    const them = ([['routes', 'lich_mt', 'TEXT'], ['programmes', 'nguong_dat', 'REAL'], ['classes', 'lich_mt', 'TEXT'], ['classes', 'nguong_dat', 'REAL']] as const)
      .filter(([b, c]) => !cot(b).includes(c));
    for (const [b, c, kieu] of them) conn.exec(`ALTER TABLE ${b} ADD COLUMN ${c} ${kieu}`);
    if (them.length) applied.push('OV-6b1: thêm cột tuần MT theo lộ trình, ngưỡng đạt chương trình và bản chụp của lớp (lich_mt, nguong_dat).');
    if (dienCauHinh(conn)) applied.push('OV-6b1: điền cấu hình lộ trình / chương trình theo luật đang chạy (LT 6/12/16, RF 4/8, đạt từ 70 %).');
    const n = dienBanChupLop(conn);
    if (n) applied.push(`OV-6b1: chép bản chụp cấu hình vào ${n} lớp hiện có (lớp đang chạy giữ lịch cũ).`);
  });
}
