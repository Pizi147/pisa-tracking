/**
 * PR-LOP (T2, T78, PF1, K1-46, K5-36, K5-37, K5-68): cột số tuần chụp vào lớp · lộ trình RF · chương trình PREFOU · điền số tuần lớp cũ ·
 * đổi tên lớp cũ sang `{CN} {ký hiệu} {số}` (BỎ QUA lớp va chạm / không theo mẫu — in ở `chay-thu:lop`) · chỉ mục mã lớp chuẩn hoá khi sạch.
 */
import { tx } from '../db.ts';
import { chuanHoaMaLop, tenMoiChoLopCu } from '../../../shared/domain/index.ts';

const KHOA_SQL = "lower(replace(replace(code, '-', ''), ' ', ''))";   // = chuanHoaMaLop, viết bằng SQL
const coCot = (conn: any, cot: string) => (conn.prepare('SELECT name FROM pragma_table_info(?)').all('classes') as any[]).some((c) => c.name === cot);

export function keHoachDoiTenLop(conn: any) {
  const rows = conn.prepare(`SELECT c.id, c.code, c.programme_code, c.route, b.code AS cn FROM classes c JOIN branches b ON b.id = c.branch_id ORDER BY c.id`).all() as any[];
  const theoKhoa = new Map<string, any[]>();
  for (const r of rows) theoKhoa.set(chuanHoaMaLop(r.code), [...(theoKhoa.get(chuanHoaMaLop(r.code)) ?? []), r]);
  const doi: { id: number; cu: string; moi: string }[] = [];
  const vaCham: { id: number; cu: string; moi: string | null; trungVoi: string }[] = [];
  const khongTheoMau: { id: number; cu: string; lyDo: 'khong-tien-to' | 'khong-theo-mau' | 'lech-chuong-trinh' }[] = [];
  for (const r of rows) {
    const kq = tenMoiChoLopCu({ code: r.code, branchCode: r.cn, programmeCode: r.programme_code, route: r.route });
    const cung = (theoKhoa.get(chuanHoaMaLop(r.code)) ?? []).filter((x) => x.id !== r.id);
    if (cung.length) { vaCham.push({ id: r.id, cu: r.code, moi: 'moi' in kq ? kq.moi : null, trungVoi: cung.map((x) => x.code).join(', ') }); continue; }
    if ('loi' in kq) { khongTheoMau.push({ id: r.id, cu: r.code, lyDo: kq.loi }); continue; }
    if (kq.moi !== r.code) doi.push({ id: r.id, cu: r.code, moi: kq.moi });
  }
  return { doi, vaCham, khongTheoMau };
}

/** Điền số tuần + mốc Giữa/Cuối khoá (bảng `programmes`/`programme_checkpoints`) cho lớp thường còn trống. FT giữ NULL. */
export function dienMocLop(conn: any): number {
  return conn.prepare(
    `UPDATE classes SET
       so_tuan = (SELECT weeks FROM programmes p WHERE p.code = classes.programme_code),
       tuan_giua_khoa = (SELECT study_week FROM programme_checkpoints k WHERE k.programme_code = classes.programme_code AND k.kind = 'progress'),
       tuan_cuoi_khoa = (SELECT study_week FROM programme_checkpoints k WHERE k.programme_code = classes.programme_code AND k.kind = 'final')
     WHERE so_tuan IS NULL AND programme_code IS NOT NULL AND programme_code != 'FT'`).run().changes;
}

export function migratePrLop(conn: any, applied: string[]) {
  const now = new Date().toISOString();
  tx(() => {
    const moi = ['so_tuan', 'tuan_giua_khoa', 'tuan_cuoi_khoa'].filter((c) => !coCot(conn, c));
    for (const c of moi) conn.exec(`ALTER TABLE classes ADD COLUMN ${c} INTEGER`);
    if (moi.length) applied.push('Thêm số tuần và mốc Giữa/Cuối khoá chụp vào từng lớp (PF1)');
    if (!conn.prepare("SELECT 1 FROM routes WHERE code = 'RF'").get()) {
      const seq = (conn.prepare('SELECT COALESCE(MAX(seq), 0) + 1 AS n FROM routes').get() as any).n;
      conn.prepare("INSERT INTO routes (code, name, note, seq, status, created_at) VALUES ('RF', 'Refire', NULL, ?, 'active', ?)").run(seq, now);
      applied.push('Thêm lộ trình RF (Refire)');
    }
    if (!conn.prepare("SELECT 1 FROM programmes WHERE code = 'PREFOU'").get()) {
      conn.prepare("INSERT INTO programmes (code, name, weeks, scoring_mode, status, created_at) VALUES ('PREFOU', 'Pre Foundation', 5, 'ratio', 'active', ?)").run(now);
      conn.prepare("INSERT INTO programme_skills (programme_code, skill, seq) VALUES ('PREFOU', 'tong_hop', 0)").run();
      conn.prepare("INSERT INTO programme_checkpoints (programme_code, kind, study_week) VALUES ('PREFOU', 'final', 5)").run();
      applied.push('Thêm chương trình Pre FOU (5 tuần, chỉ Cuối khoá, một điểm Tổng hợp)');
    }
    const dien = dienMocLop(conn);
    if (dien) applied.push(`Chụp số tuần cho ${dien} lớp thường đang có`);
    const kh = keHoachDoiTenLop(conn);
    for (const x of kh.doi) conn.prepare('UPDATE classes SET code = ? WHERE id = ?').run(x.moi, x.id);
    if (kh.doi.length) applied.push(`Đổi tên ${kh.doi.length} lớp sang mẫu mới (T2)`);
    const boQua = kh.vaCham.length + kh.khongTheoMau.length;
    if (boQua) applied.push(`Giữ nguyên tên ${boQua} lớp trùng/không theo mẫu — xem lệnh chạy thử đổi tên lớp`);
    const trung = conn.prepare(`SELECT ${KHOA_SQL} AS k FROM classes GROUP BY k HAVING COUNT(*) > 1 LIMIT 1`).get();
    if (!trung && !conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = 'ux_classes_ma_chuan'").get()) {
      conn.exec(`CREATE UNIQUE INDEX ux_classes_ma_chuan ON classes (${KHOA_SQL})`);
      applied.push('Khoá trùng tên lớp không phân biệt hoa/thường, dấu "-"');
    }
  });
}

/** T7: lớp đang học mà không còn phân công nào (tạo lớp cũ tách hai bước, bước 2 hỏng). */
export function lopMoCoi(conn: any): { id: number; code: string; chiNhanh: string; soHv: number; taoLuc: string }[] {
  return conn.prepare(
    `SELECT c.id, c.code, b.code AS chiNhanh, c.created_at AS taoLuc,
            (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id AND e.status = 'active') AS soHv
       FROM classes c JOIN branches b ON b.id = c.branch_id
      WHERE c.status = 'active' AND NOT EXISTS (SELECT 1 FROM teacher_assignments ta WHERE ta.class_id = c.id AND ta.status = 'active')
      ORDER BY c.created_at DESC`).all();
}

/** Chuẩn bị K5-60: lớp FT có em đang ở lộ trình khác lộ trình của lớp. */
export function lopFtLechLoTrinh(conn: any): { id: number; code: string; loTrinhLop: string | null; loTrinhHv: string; soHv: number }[] {
  return conn.prepare(
    `SELECT c.id, c.code, c.route AS loTrinhLop, cy.route AS loTrinhHv, COUNT(*) AS soHv
       FROM classes c JOIN enrollments e ON e.class_id = c.id AND e.status = 'active'
       JOIN learning_cycles cy ON cy.student_id = e.student_id AND cy.status = 'active'
      WHERE c.is_fast_track = 1 AND cy.route IS NOT NULL AND cy.route != COALESCE(c.route, '')
      GROUP BY c.id, cy.route ORDER BY c.code`).all();
}
