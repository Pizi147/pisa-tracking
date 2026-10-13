/**
 * OV-6b2 (kế hoạch `2026-10-12-pr-ov6b2-pet-ket.md`, chạy lặp được): chương trình liên tục + PET / KET.
 * (a) cột `programmes.lap_moi_tuan` (Checkpoint mỗi n tuần) và bản chụp `classes.moc_lap` — chỉ thêm.
 * (b) chèn PET, KET nếu chưa có (`chenPetKet`, dùng chung với seed): L+S · R+W · đúng/tổng · đạt từ 70 % · liên tục · Checkpoint mỗi 6 tuần.
 * Mã đã có (Quản trị đã sửa) thì không đụng.
 */
import { tx } from '../db.ts';
import { CHUONG_TRINH_LIEN_TUC_CO_SAN } from '../../../shared/domain/index.ts';
import { nowIso } from '../util.ts';

/** Chèn PET / KET còn thiếu. Trả các mã đã chèn. */
export function chenPetKet(conn: any): string[] {
  const moi: string[] = [];
  for (const c of CHUONG_TRINH_LIEN_TUC_CO_SAN) {
    if (conn.prepare('SELECT 1 FROM programmes WHERE code = ?').get(c.code)) continue;
    conn.prepare(`INSERT INTO programmes (code, name, weeks, scoring_mode, nguong_dat, lap_moi_tuan, status, created_at) VALUES (?, ?, NULL, 'ratio', ?, ?, 'active', ?)`)
      .run(c.code, c.name, c.nguongDat, c.lapMoiTuan, nowIso());
    c.skills.forEach((k, i) => conn.prepare('INSERT INTO programme_skills (programme_code, skill, seq) VALUES (?,?,?)').run(c.code, k, i));
    moi.push(c.code);
  }
  return moi;
}

export function migratePrOv6b2(conn: any, applied: string[]) {
  const cot = (bang: string) => (conn.prepare('SELECT name FROM pragma_table_info(?)').all(bang) as any[]).map((c) => c.name as string);
  if (!cot('programmes').length || !cot('classes').length) return;
  tx(() => {
    const them = ([['programmes', 'lap_moi_tuan'], ['classes', 'moc_lap']] as const).filter(([b, c]) => !cot(b).includes(c));
    for (const [b, c] of them) conn.exec(`ALTER TABLE ${b} ADD COLUMN ${c} INTEGER`);
    if (them.length) applied.push('OV-6b2: thêm cột Checkpoint mỗi n tuần (programmes.lap_moi_tuan, classes.moc_lap).');
    const moi = chenPetKet(conn);
    if (moi.length) applied.push(`OV-6b2: thêm chương trình ${moi.join(', ')} (L+S, R+W · liên tục · Checkpoint mỗi 6 tuần).`);
  });
}
