/**
 * PR-LOP (T2, T78, PF1, K1-46, K5-36, K5-37): cột số tuần chụp vào lớp · lộ trình RF · chương trình PREFOU · chỉ mục mã lớp chuẩn hoá khi sạch.
 * PR-SO (DEP-gỡ): bước chụp số tuần + đổi tên lớp cũ đã gỡ (DB cũ đã xoá); `dienMocLop` giữ cho seed.
 */
import { tx } from '../db.ts';
import { khoaMaLopSql } from '../../../shared/domain/index.ts';

const coCot = (conn: any, cot: string) => (conn.prepare('SELECT name FROM pragma_table_info(?)').all('classes') as any[]).some((c) => c.name === cot);

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
    const trung = conn.prepare(`SELECT ${khoaMaLopSql()} AS k FROM classes GROUP BY k HAVING COUNT(*) > 1 LIMIT 1`).get();
    if (!trung && !conn.prepare("SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = 'ux_classes_ma_chuan'").get()) {
      conn.exec(`CREATE UNIQUE INDEX ux_classes_ma_chuan ON classes (${khoaMaLopSql()})`);
      applied.push('Khoá trùng tên lớp không phân biệt hoa/thường, dấu "-"');
    }
  });
}
