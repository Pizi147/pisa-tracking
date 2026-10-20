import { db } from '../db.ts';
import { nhoTheoId } from '../platform/nguCanhRequest.ts';
import { tachBaiId, type ChiSo, type ChuongTrinh } from '../../../shared/domain/index.ts';
import { parseObligation } from './metrics.ts';

/**
 * MỖI PHẦN TỬ CỦA MỘT TẬP CHỈ SỐ THUỘC LỚP NÀO (plan PR-Pa Q2) — một định nghĩa cho cả bộ lọc chương trình lẫn dòng phụ
 * "MB FT 101 (8) · CP FT 110 (4)" của Cần xử lý, để hai thứ không bao giờ nói hai chuyện khác nhau.
 *
 *   học viên            lớp ĐANG học (active trước), không còn thì lớp gần nhất
 *   Case                lớp của lượt Test sinh ra Case; Case tạo tay thì lớp của học viên — cùng `classKind` của `listCases`
 *   PA / nghĩa vụ       qua Case của nó
 *   tín hiệu            lớp của tín hiệu
 *   bài / lượt          lớp của lượt
 *   vi phạm / PA xử lý  qua học viên
 *   lớp                 chính lớp đó (PR-VAI-a)
 * Chương trình = `classes.is_fast_track`. Không tìm được lớp → `isFt = null`: chỉ có mặt ở chỉ số gộp (không lọc khung).
 * Truy vấn theo lô 400 — không một câu mỗi phần tử.
 */
export type LopCuaPhanTu = { classId: number | null; code: string | null; isFt: boolean | null };
const RONG: LopCuaPhanTu = { classId: null, code: null, isFt: null };

function theoLo<T>(ids: number[], fn: (chunk: number[], ph: string) => T[]): T[] {
  const out: T[] = [];
  for (let i = 0; i < ids.length; i += 400) {
    const chunk = ids.slice(i, i + 400);
    out.push(...fn(chunk, chunk.map(() => '?').join(',')));
  }
  return out;
}
const lopTu = (r: any): LopCuaPhanTu =>
  r && r.class_id ? { classId: r.class_id, code: r.code ?? null, isFt: r.is_fast_track === null ? null : !!r.is_fast_track } : RONG;

/** OV-15h1: nhớ lớp theo PHẦN TỬ trong request — nhiều chỉ số trên cùng một trang (Tổng quan QL) hỏi lại cùng em / Case / lượt. */
const nhoLop = (tienTo: string, ids: number[], doc: (thieu: number[]) => Map<number, LopCuaPhanTu>): Map<number, LopCuaPhanTu> =>
  new Map([...nhoTheoId(tienTo, ids, (thieu) => new Map([...doc(thieu)].map(([id, x]) => [id, [x]])))].map(([id, [x]]) => [id, x]));

/** Lớp của học viên: lớp đang học trước, rồi lớp gần nhất. */
function lopHocVien(ids: number[]): Map<number, LopCuaPhanTu> {
  return nhoLop('lop-hv:', ids, (thieu) => {
    const out = new Map<number, LopCuaPhanTu>();
    for (const r of theoLo(thieu, (chunk, ph) => db().prepare(
      `SELECT e.student_id AS id, c.id AS class_id, c.code, c.is_fast_track
         FROM enrollments e JOIN classes c ON c.id = e.class_id
        WHERE e.student_id IN (${ph})
        ORDER BY e.student_id, CASE WHEN e.status = 'active' THEN 0 ELSE 1 END, e.id DESC`,
    ).all(...chunk) as any[])) if (!out.has(r.id)) out.set(r.id, lopTu(r));
    return out;
  });
}
function lopCase(ids: number[]): Map<number, LopCuaPhanTu> {
  return nhoLop('lop-case:', ids, (thieu) => {
    const out = new Map<number, LopCuaPhanTu>();
    const hvCuaCase = new Map<number, number>();
    for (const r of theoLo(thieu, (chunk, ph) => db().prepare(
      `SELECT sc.id, COALESCE(sc.student_id, a.student_id) AS sid, c.id AS class_id, c.code, c.is_fast_track
         FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
         LEFT JOIN classes c ON c.id = a.class_id WHERE sc.id IN (${ph})`,
    ).all(...chunk) as any[])) {
      if (r.class_id) out.set(r.id, lopTu(r)); else if (r.sid) hvCuaCase.set(r.id, r.sid);
    }
    const hv = lopHocVien([...new Set(hvCuaCase.values())]);
    for (const [cid, sid] of hvCuaCase) out.set(cid, hv.get(sid) ?? RONG);
    return out;
  });
}
function quaCase(pairs: { id: number; caseId: number }[]): Map<number, LopCuaPhanTu> {
  const cm = lopCase([...new Set(pairs.map((x) => x.caseId))]);
  return new Map(pairs.map((x) => [x.id, cm.get(x.caseId) ?? RONG]));
}
function quaHocVien(pairs: { id: number; sid: number }[]): Map<number, LopCuaPhanTu> {
  const hm = lopHocVien([...new Set(pairs.map((x) => x.sid))]);
  return new Map(pairs.map((x) => [x.id, hm.get(x.sid) ?? RONG]));
}

export function lopCuaTap(unit: ChiSo['donVi'], ids: number[]): Map<number, LopCuaPhanTu> {
  if (!ids.length) return new Map();
  const conn = db();
  switch (unit) {
    case 'hoc-vien': return lopHocVien(ids);
    case 'case': return lopCase(ids);
    case 'phuong-an':
      return quaCase(theoLo(ids, (chunk, ph) => conn.prepare(
        `SELECT id, case_id AS caseId FROM case_interventions WHERE id IN (${ph})`).all(...chunk) as any[]));
    case 'nghia-vu': {
      const ivOf = new Map(ids.map((id) => [id, parseObligation(id).interventionId]));
      const iv = lopCuaTap('phuong-an', [...new Set(ivOf.values())]);
      return new Map(ids.map((id) => [id, iv.get(ivOf.get(id)!) ?? RONG]));
    }
    case 'bai-thi': case 'dot-test': case 'luot-sos':
      return nhoLop('lop-luot:', ids, (thieu) => {
        const out = new Map<number, LopCuaPhanTu>();
        for (const r of theoLo(thieu, (chunk, ph) => conn.prepare(
          `SELECT a.id, c.id AS class_id, c.code, c.is_fast_track FROM assessment_attempts a
             LEFT JOIN classes c ON c.id = a.class_id WHERE a.id IN (${ph})`).all(...chunk) as any[])) out.set(r.id, lopTu(r));
        return out;
      });
    case 'bai': {
      /* PR-UXF-a Q7: bài = ô điểm của một lượt → lớp của lượt (`tachBaiId`). */
      const luot = lopCuaTap('bai-thi', [...new Set(ids.map((id) => tachBaiId(id).attemptId))]);
      return new Map(ids.map((id) => [id, luot.get(tachBaiId(id).attemptId) ?? RONG]));
    }
    case 'lop': {
      /* PR-VAI-a: phần tử là chính lớp đó. */
      const out = new Map<number, LopCuaPhanTu>();
      for (const r of theoLo(ids, (chunk, ph) => conn.prepare(
        `SELECT id, id AS class_id, code, is_fast_track FROM classes WHERE id IN (${ph})`).all(...chunk) as any[])) out.set(r.id, lopTu(r));
      return out;
    }
    case 'vi-pham':
      return quaHocVien(theoLo(ids, (chunk, ph) => conn.prepare(
        `SELECT id, student_id AS sid FROM violations WHERE id IN (${ph})`).all(...chunk) as any[]));
    case 'bien-phap':
      return quaHocVien(theoLo(ids, (chunk, ph) => conn.prepare(
        `SELECT id, student_id AS sid FROM discipline_measures WHERE id IN (${ph})`).all(...chunk) as any[]));
    default:
      return new Map();
  }
}

/** Giữ phần tử thuộc đúng chương trình. Không xác định được lớp → bị loại khỏi cả hai chương trình. */
export function locTheoChuongTrinh(unit: ChiSo['donVi'], ids: number[], ct: ChuongTrinh): number[] {
  if (!ids.length) return ids;
  const m = lopCuaTap(unit, ids);
  const muonFt = ct === 'ft';
  return ids.filter((id) => { const x = m.get(id); return !!x && x.isFt !== null && x.isFt === muonFt; });
}

/** Dòng phụ ≤ 60 ký tự (G-3): hai lớp nhiều nhất kèm số, còn lại "+k lớp". Một phần tử: chỉ tên lớp. */
export function tachTheoLop(unit: ChiSo['donVi'], ids: number[], toiDa = 2): string {
  if (!ids.length) return '';
  const m = lopCuaTap(unit, ids);
  const dem = new Map<string, number>();
  for (const id of ids) { const code = m.get(id)?.code ?? 'Chưa rõ lớp'; dem.set(code, (dem.get(code) ?? 0) + 1); }
  if (ids.length === 1) return [...dem.keys()][0];
  const xep = [...dem.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'vi'));
  const phan = xep.slice(0, toiDa).map(([c, n]) => `${c} (${n})`);
  if (xep.length > toiDa) phan.push(`+${xep.length - toiDa} lớp`);
  return phan.join(' · ');
}
