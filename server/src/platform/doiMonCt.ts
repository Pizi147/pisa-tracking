/**
 * MON-CT-1311 (chủ SP 13/11, plan.md mục 4 "13/11 … chương trình") — ĐỔI MÔN của một chương trình lớp thường (Quản trị, migrate KET / PET).
 *
 *   - `programme_skills` + `class_skills` của MỌI lớp chương trình (Mở lại lớp dùng bộ mới).
 *   - Lượt CHƯA GHI (không điểm, không lịch tay, không bản huỷ chờ khôi phục) → dòng lịch đổi theo bộ mới: môn gộp nhận dòng của môn thành phần,
 *     môn tách nhận dòng của môn gộp (giữ tuần, phạm vi), môn mới hẳn = dòng mới theo tuần của lượt; môn bỏ → xoá dòng.
 *   - Lượt ĐÃ GHI → giữ bộ cũ: chụp vào `assessment_attempts.bo_mon` (đọc qua `boMonTheoLuot`). Bản chụp trùng bộ mới → bỏ chụp.
 *   - Phân công lớp ĐANG CHẠY: môn mới nhận GV khi rõ người (môn gộp: các môn thành phần cùng MỘT GV; môn tách: GV môn gộp) — còn lại "Chưa phân công".
 *     Môn bỏ: dòng phân công kết thúc, trừ khi lượt cũ còn ô chưa chấm / Case mở ở môn đó (`monGopConCanMany`).
 * `keHoachDoiMon` chỉ đọc (hộp xác nhận); `apDoiMon` ghi — gọi trong `tx` của nơi gọi.
 */
import { MON_GOP, docBoMonLuot, type SlotPhanCong } from '../../../shared/domain/index.ts';
import { ghiPhanCong } from '../classes/classes.ts';
import { capNhatConOCho } from '../fasttrack/conOCho.ts';
import { clearScoringModeCache } from '../fasttrack/skillSchedule.ts';
import { ghiSoTheoLop } from '../phanTich/soNghiaVu.ts';
import { nowIso } from '../util.ts';
import type { Principal } from '../permissions.ts';

const IN = (n: number) => Array(n).fill('?').join(',');
const cungBo = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((k, i) => k === b[i]);
const cungTap = (a: readonly string[], b: readonly string[]) => a.length === b.length && [...a].sort().join() === [...b].sort().join();

/**
 * Lượt ĐÃ GHI: có dòng điểm (điểm, "-", nhận xét), có bản huỷ chờ khôi phục, hoặc (lượt chưa huỷ) có lịch tay — môn xếp tuần tay, đã điểm danh / vắng,
 * đề nghị dời lịch đang chờ. Lịch tự sinh (`auto` · `scheduled`) không tính: dòng mới theo bộ mới ra đúng tuần như cũ.
 */
const DA_GHI = `(EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id)
  OR EXISTS (SELECT 1 FROM ket_qua_huy h WHERE h.attempt_id = a.id AND h.khoi_phuc_luc IS NULL)
  OR (a.status != 'cancelled' AND (EXISTS (SELECT 1 FROM attempt_skills k WHERE k.attempt_id = a.id AND (k.plan_source != 'auto' OR k.sit_status != 'scheduled'))
      OR EXISTS (SELECT 1 FROM skill_move_requests r WHERE r.attempt_id = a.id AND r.status = 'pending'))))`;

export type KeHoachDoiMon = {
  cu: string[]; moi: string[];
  /** Lớp đang chạy của chương trình. */
  lopDangChay: number;
  /** Lượt (chưa huỷ) của lớp đang chạy sẽ đổi môn. */
  luotDoi: number;
  /** Lớp đang chạy có môn mới chưa rõ GV → QL chọn lại. */
  lopChonLaiGv: number;
};
type ChiTiet = KeHoachDoiMon & {
  luot: { id: number; bo_mon: string | null; da_ghi: number }[];
  pc: Map<number, { code: string; active: any[]; them: SlotPhanCong[]; bo: Set<string> }>;
};

/** Nguồn dòng của môn mới `k` từ bộ cũ: môn gộp ← môn thành phần đầu tiên có trong bộ cũ; môn tách ← môn gộp cũ chứa nó. */
function nguonCua(k: string, cu: readonly string[]): string | null {
  if (MON_GOP[k]) return MON_GOP[k].find((x) => cu.includes(x)) ?? null;
  return cu.find((g) => MON_GOP[g]?.includes(k)) ?? null;
}
/** GV của môn mới `k` khi rõ người: môn gộp ← các môn thành phần (đủ trong bộ cũ) cùng một GV; môn tách ← GV môn gộp cũ. */
function gvCua(k: string, cu: readonly string[], gv: Map<string, number[]>): number | null {
  const mot = (m: string) => { const ds = gv.get(m) ?? []; return ds.length === 1 ? ds[0] : null; };
  if (MON_GOP[k]) {
    const ds = MON_GOP[k].map((x) => (cu.includes(x) ? mot(x) : null));
    return ds.every((u) => u != null && u === ds[0]) ? ds[0] : null;
  }
  const g = cu.find((x) => MON_GOP[x]?.includes(k));
  return g ? mot(g) : null;
}

function chiTiet(conn: any, code: string, moi: readonly string[]): ChiTiet {
  const cu = (conn.prepare('SELECT skill FROM programme_skills WHERE programme_code = ? ORDER BY seq, skill').all(code) as any[]).map((r) => r.skill as string);
  const lop = conn.prepare(`SELECT id, code, status FROM classes WHERE programme_code = ?`).all(code) as any[];
  const dangChay = lop.filter((l) => l.status === 'active');
  const luot = conn.prepare(
    `SELECT a.id, a.bo_mon, a.class_id, a.status, ${DA_GHI} AS da_ghi FROM assessment_attempts a
      WHERE a.class_id IN (SELECT id FROM classes WHERE programme_code = ?) ORDER BY a.id`,
  ).all(code) as any[];
  const chay = new Set(dangChay.map((l) => l.id as number));
  const chiThuTu = cungTap(cu, moi);                                // chỉ đổi thứ tự: lượt / phân công không đổi
  const luotDoi = chiThuTu ? 0 : luot.filter((a) => !a.bo_mon && !a.da_ghi && a.status !== 'cancelled' && chay.has(a.class_id)).length;
  /* Phân công lớp đang chạy (một câu cho cả chương trình). */
  const pcRows = dangChay.length ? conn.prepare(`SELECT * FROM teacher_assignments WHERE status = 'active' AND class_id IN (${IN(dangChay.length)})`)
    .all(...dangChay.map((l) => l.id)) as any[] : [];
  const pc = new Map<number, { code: string; active: any[]; them: SlotPhanCong[]; bo: Set<string> }>();
  let lopChonLaiGv = 0;
  for (const l of dangChay) {
    const active = pcRows.filter((r) => r.class_id === l.id);
    const gv = new Map<string, number[]>();
    for (const r of active) if (r.skill && !r.is_core) gv.set(r.skill, [...(gv.get(r.skill) ?? []), r.user_id]);
    const them: SlotPhanCong[] = [];
    let thieu = false;
    for (const k of moi.filter((x) => !cu.includes(x))) {
      if (gv.has(k)) continue;                                     // đã có dòng môn này (dòng cũ còn giữ)
      const u = gvCua(k, cu, gv);
      if (u == null) thieu = true; else them.push({ userId: u, skill: k, isCore: false });
    }
    if (thieu && !chiThuTu) lopChonLaiGv += 1;
    pc.set(l.id, { code: l.code, active, them, bo: new Set(cu.filter((x) => !moi.includes(x))) });
  }
  return { cu, moi: [...moi], lopDangChay: dangChay.length, luotDoi, lopChonLaiGv, luot, pc };
}

/** Hộp xác nhận (chỉ đọc): số lớp đang học · bài Test sẽ đổi môn · lớp cần chọn lại GV. */
export function keHoachDoiMon(conn: any, code: string, moi: readonly string[]): KeHoachDoiMon {
  const { cu, lopDangChay, luotDoi, lopChonLaiGv } = chiTiet(conn, code, moi);
  return { cu, moi: [...moi], lopDangChay, luotDoi, lopChonLaiGv };
}

/**
 * Ghi đổi môn (trong `tx` của nơi gọi). `p` = người đổi (migrate: principal hệ thống, `userId` null). Trả kế hoạch đã áp + số lượt giữ bộ cũ.
 * Bộ mới trùng bộ cũ (kể cả thứ tự) → không làm gì.
 */
export function apDoiMon(conn: any, p: Principal, code: string, moi: readonly string[], ngay: string): KeHoachDoiMon & { luotGiu: number } | null {
  const k = chiTiet(conn, code, moi);
  if (cungBo(k.cu, moi)) return null;
  clearScoringModeCache();
  conn.prepare('DELETE FROM programme_skills WHERE programme_code = ?').run(code);
  moi.forEach((m, i) => conn.prepare('INSERT INTO programme_skills (programme_code, skill, seq) VALUES (?,?,?)').run(code, m, i));
  /* Chỉ đổi thứ tự → bộ của lượt / lớp / phân công không đổi. */
  if (cungTap(k.cu, moi)) return { cu: k.cu, moi: [...moi], lopDangChay: k.lopDangChay, luotDoi: 0, lopChonLaiGv: 0, luotGiu: 0 };

  const lopIds = (conn.prepare('SELECT id FROM classes WHERE programme_code = ?').all(code) as any[]).map((r) => r.id as number);
  /* class_skills: bỏ môn không còn, thêm môn mới (giữ số buổi môn còn). */
  for (const id of lopIds) {
    conn.prepare(`DELETE FROM class_skills WHERE class_id = ? AND skill NOT IN (${IN(moi.length)})`).run(id, ...moi);
    for (const m of moi) conn.prepare('INSERT INTO class_skills (class_id, skill, sessions_per_week) SELECT ?, ?, 1 WHERE NOT EXISTS (SELECT 1 FROM class_skills WHERE class_id = ? AND skill = ?)').run(id, m, id, m);
  }
  /* Lượt. */
  const chupCu = JSON.stringify(k.cu);
  const doi: number[] = [];
  let luotGiu = 0;
  const bang = ['attempt_skills', 'attempt_skill_skips'].map((b) => ({
    b, cot: (conn.prepare('SELECT name FROM pragma_table_info(?)').all(b) as any[]).map((c) => c.name as string).filter((c) => c !== 'id' && c !== 'skill'),
  }));
  const moiHan = moi.filter((m) => !k.cu.includes(m));
  for (const a of k.luot) {
    const chup = docBoMonLuot(a.bo_mon);
    if (chup) {                                                      // đã giữ bộ cũ từ lần đổi trước
      if (cungTap(chup, moi)) conn.prepare('UPDATE assessment_attempts SET bo_mon = NULL WHERE id = ?').run(a.id);
      else luotGiu += 1;
      continue;
    }
    if (a.da_ghi) { conn.prepare('UPDATE assessment_attempts SET bo_mon = ? WHERE id = ?').run(chupCu, a.id); luotGiu += 1; continue; }
    for (const { b, cot } of bang) {
      for (const m of moiHan) {
        const nguon = nguonCua(m, k.cu);
        if (nguon) conn.prepare(`INSERT OR IGNORE INTO ${b} (skill, ${cot.join(', ')}) SELECT ?, ${cot.join(', ')} FROM ${b} WHERE attempt_id = ? AND skill = ?`).run(m, a.id, nguon);
      }
      conn.prepare(`DELETE FROM ${b} WHERE attempt_id = ? AND skill NOT IN (${IN(moi.length)})`).run(a.id, ...moi);
    }
    /* Môn mới hẳn (không nguồn) / lượt chưa có dòng lịch môn nguồn: dòng lịch tự sinh theo tuần của lượt. */
    if ((conn.prepare('SELECT COUNT(*) n FROM attempt_skills WHERE attempt_id = ?').get(a.id) as any).n) {
      for (const m of moiHan) {
        conn.prepare(`INSERT OR IGNORE INTO attempt_skills (attempt_id, skill, required, planned_period_id, plan_source, sit_status, created_at)
          SELECT id, ?, 1, planned_period_id, 'auto', 'scheduled', ? FROM assessment_attempts WHERE id = ?`).run(m, nowIso(), a.id);
      }
    }
    doi.push(a.id);
  }
  capNhatConOCho(doi);
  /* Phân công lớp đang chạy: giữ mọi dòng trừ môn bỏ (môn bỏ còn việc cũ thì `ghiPhanCong` tự giữ), thêm GV môn mới khi rõ người. */
  for (const [classId, x] of k.pc) {
    const slots: SlotPhanCong[] = [
      ...x.active.filter((r) => r.is_core || !r.skill || !x.bo.has(r.skill)).map((r) => ({ userId: r.user_id, skill: r.skill, isCore: !!r.is_core })),
      ...x.them,
    ];
    ghiPhanCong(p, classId, slots, ngay, { via: 'doi_mon_ct', ct: code, truoc: k.cu, sau: [...moi] }, x.code);
    ghiSoTheoLop(classId);
  }
  return { cu: k.cu, moi: [...moi], lopDangChay: k.lopDangChay, luotDoi: k.luotDoi, lopChonLaiGv: k.lopChonLaiGv, luotGiu };
}
