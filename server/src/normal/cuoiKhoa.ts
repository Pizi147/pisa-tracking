import { db, theoLo } from '../db.ts';
import { goiYCuoiKhoa, type GoiYCuoiKhoa } from '../../../shared/domain/index.ts';
import { allProgrammes, evaluateRegular } from './regular.ts';

/**
 * CUỐI KHOÁ LỚP THƯỜNG — MỘT CỬA phía máy chủ (T47, T49, §6.3). Luật thuần ở `shared/domain/cuoiKhoa.ts`; file này chỉ đọc dữ liệu
 * THEO LÔ và đưa vào luật đó, để lưới, hồ sơ HV, Hành trình, Excel, việc, màn Chuyển lớp (PR-CT) cùng ra MỘT con số % và MỘT hướng gợi ý.
 */

export type TyLeLuot = {
  /** Σ điểm / Σ tổng, CHƯA làm tròn; `null` khi chưa đủ môn. */
  tyLe: number | null; du: boolean; scored: number; required: number;
  ct: string | null; monTruot: string[]; kind: string;
};

/** % tổng của nhiều lượt lớp thường — 2 câu cho cả lô (lượt + điểm), mỗi lượt qua `evaluateRegular`. Lượt không phải lớp thường → không có trong kết quả. */
export function tyLeTongLo(attemptIds: readonly number[]): Map<number, TyLeLuot> {
  const out = new Map<number, TyLeLuot>();
  if (!attemptIds.length) return out;
  const conn = db();
  const luot = new Map<number, { kind: string; ct: string | null }>();
  const diem = new Map<number, any[]>();
  theoLo([...new Set(attemptIds)], (lo, ph) => {
    for (const r of conn.prepare(
      `SELECT a.id, a.kind, c.programme_code FROM assessment_attempts a LEFT JOIN classes c ON c.id = a.class_id WHERE a.id IN (${ph})`,
    ).all(...lo) as any[]) luot.set(r.id, { kind: r.kind, ct: r.programme_code ?? null });
    for (const r of conn.prepare(`SELECT attempt_id, skill, raw_score, raw_total FROM assessment_scores WHERE attempt_id IN (${ph})`).all(...lo) as any[]) {
      if (!diem.has(r.attempt_id)) diem.set(r.attempt_id, []);
      diem.get(r.attempt_id)!.push(r);
    }
  });
  const chuongTrinh = allProgrammes();
  for (const [id, l] of luot) {
    const prog = l.ct ? chuongTrinh.get(l.ct) : null;
    if (!prog || prog.scoringMode !== 'ratio') continue;
    const kq = evaluateRegular(prog.skills, diem.get(id) ?? [], prog.code);
    out.set(id, {
      tyLe: kq.tyLeTong, du: kq.complete, scored: kq.scored, required: kq.required, ct: prog.code, kind: l.kind,
      monTruot: kq.skills.filter((s) => s.outcome === 'fail').map((s) => s.skill),
    });
  }
  return out;
}

export type EmCuoiKhoa = {
  attemptId: number | null; tyLe: number | null; scored: number; required: number; monTruot: string[];
  goiY: GoiYCuoiKhoa | null;
  /** Quản lý đã quyết khi thi hành chuyển lớp (`lo_trinh_tiep_theo.quyet_*`). */
  quyetDinh: { boiId: number; boi: string | null; luc: string } | null;
  /** T49: kết luận kỳ vọng đầu ra BE/ELE lên FT. */
  ketLuanFt: { dat: boolean | null; nguyenNhan: 'trung_tam' | 'hoc_sinh' | null; mon: string[]; ghiChu: string | null } | null;
};

const jsonMang = (s: string | null): string[] => { try { const v = JSON.parse(s ?? '[]'); return Array.isArray(v) ? v.map(String) : []; } catch { return []; } };

/** `lo_trinh_tiep_theo` → phần kết luận của một em (dùng chung cho lớp và hồ sơ). */
export function ketLuanCuaDong(r: any): Pick<EmCuoiKhoa, 'quyetDinh' | 'ketLuanFt'> {
  return {
    quyetDinh: r?.quyet_luc ? { boiId: r.quyet_boi, boi: r.quyet_ten ?? null, luc: r.quyet_luc } : null,
    ketLuanFt: r && (r.ky_vong_dat !== null || r.ky_vong_nguyen_nhan)
      ? { dat: r.ky_vong_dat === null ? null : !!r.ky_vong_dat, nguyenNhan: r.ky_vong_nguyen_nhan ?? null, mon: jsonMang(r.ky_vong_mon), ghiChu: r.ky_vong_ghi_chu ?? null }
      : null,
  };
}

/**
 * Mọi em ĐANG học lớp thường `classId` (hoặc chỉ `sids`): bài Cuối khoá mới nhất, % tổng, gợi ý hướng, quyết định, kỳ vọng đầu ra.
 * 4 câu cho cả lớp (em × bài · lượt · điểm · lộ trình tiếp theo). Hướng gợi ý KHÔNG lưu — tính lại mỗi lần đọc nên sửa điểm là đổi theo.
 */
export function cuoiKhoaTheoHocVien(classId: number, sids?: readonly number[]): Map<number, EmCuoiKhoa> {
  const out = new Map<number, EmCuoiKhoa>();
  if (sids && !sids.length) return out;
  const conn = db();
  const loc = sids ? ` AND e.student_id IN (${sids.map(() => '?').join(',')})` : '';
  const dong = conn.prepare(
    `SELECT e.student_id, a.id AS attempt_id FROM enrollments e
       LEFT JOIN assessment_attempts a ON a.student_id = e.student_id AND a.class_id = e.class_id AND a.kind = 'final' AND a.status != 'cancelled'
      WHERE e.class_id = ? AND e.status = 'active'${loc} ORDER BY a.id`,
  ).all(classId, ...(sids ?? [])) as any[];
  const luotCuaEm = new Map<number, number | null>();
  for (const r of dong) luotCuaEm.set(r.student_id, r.attempt_id ?? luotCuaEm.get(r.student_id) ?? null);   // nhiều bài Cuối khoá → bài id lớn nhất
  const tyLe = tyLeTongLo([...luotCuaEm.values()].filter((x): x is number => x !== null));
  const dinhKem = new Map<number, any>();
  for (const r of conn.prepare(
    `SELECT lt.*, u.full_name AS quyet_ten FROM lo_trinh_tiep_theo lt LEFT JOIN users u ON u.id = lt.quyet_boi WHERE lt.class_id = ?`,
  ).all(classId) as any[]) dinhKem.set(r.student_id, r);
  for (const [sid, attemptId] of luotCuaEm) {
    const t = attemptId ? tyLe.get(attemptId) : undefined;
    out.set(sid, {
      attemptId, tyLe: t?.tyLe ?? null, scored: t?.scored ?? 0, required: t?.required ?? 0, monTruot: t?.monTruot ?? [],
      goiY: t ? goiYCuoiKhoa({ ct: t.ct, tyLe: t.tyLe, monTruot: t.monTruot }) : null,
      ...ketLuanCuaDong(dinhKem.get(sid)),
    });
  }
  return out;
}
