/**
 * P13 KET-PET (plan.md 1.6 N18; plan `2026-10-26-p13-ket-pet.md` Task 0 + 2) — CHECKPOINT PET / KET TÁCH R · W · L · S. Mỗi bước một `tx`.
 * Bước 1–2 chạy ĐÚNG MỘT LẦN (khoá `demo_config` `pr_ket_pet_at`, mẫu `prCvLoi`) — Quản trị đặt lại môn gộp sau này thì deploy sau không tách lại:
 *   1. `programme_skills` PET / KET còn đúng bộ gộp mặc định (L+S, R+W) → 4 môn. Quản trị đã sửa khác → không đụng (ghi `applied`).
 *   2. Chỉ với chương trình đang là đúng 4 môn:
 *      2a. MỌI lớp (đang chạy và đã kết thúc — Mở lại lớp không ra lượt 4 môn mà GV chỉ có ô gộp), CHỈ hai bảng: `class_skills` gộp → 2 môn tách (giữ số buổi);
 *          phân công GV môn gộp GIỮ NGUYÊN (lịch sử + người phụ trách ô gộp cũ) và THÊM dòng hai môn tách cho GV đó (chép nguyên dòng: trạng thái, ngày hiệu lực).
 *      2b. Lớp ĐANG CHẠY: lượt CHƯA ghi gì ở môn gộp (không dòng `assessment_scores` môn gộp) → mọi bảng khoá (lượt, môn) — `attempt_skills`,
 *          `attempt_skill_skips`, `skill_move_requests`… — đổi môn gộp sang hai môn tách (chép nguyên dòng). Lượt đã có điểm / dấu "-" / nhận xét ở môn gộp,
 *          lượt đã huỷ / có bản huỷ chưa khôi phục GIỮ. `assessment_scores`, `case_signals` không đụng.
 *      Một luật đọc: `boMonTheoLuot` (lượt còn dòng lịch / điểm môn gộp → bộ gộp, còn lại → bộ chương trình).
 * Bước 3–4 chạy mỗi lần (không còn gì thì không làm), đụng MỌI lộ trình KET / PET kể cả khoá đã đóng; mỗi lộ trình một dòng nhật ký `cycle.update`
 * (trước → sau, nguồn "migrate prKetPet") trong cùng `tx`:
 *   3. Bỏ dấu KCK (Target Cambridge không có KCK; Target giữ).   4. Target ngoài thang Cambridge (band cũ, số lẻ) → trống.
 *   Case mở theo môn gộp giữ nguyên.
 */
import { tx } from '../db.ts';
import { voiNguon, writeAuditLo } from '../platform/audit.ts';
import { nowIso } from '../util.ts';
import { CHUONG_TRINH_LIEN_TUC_CO_SAN, MON_GOP, kyThiCuaChuongTrinh } from '../../../shared/domain/index.ts';

const GOP = Object.keys(MON_GOP);                                   // listening_speaking, reading_writing
const MA = CHUONG_TRINH_LIEN_TUC_CO_SAN.map((c) => c.code);         // PET, KET
const BON = CHUONG_TRINH_LIEN_TUC_CO_SAN[0].skills;                 // listening, reading, writing, speaking
const IN = (n: number) => Array(n).fill('?').join(',');
const boMon = (conn: any, ma: string): string[] =>
  (conn.prepare('SELECT skill FROM programme_skills WHERE programme_code = ? ORDER BY seq, skill').all(ma) as any[]).map((r) => r.skill);
const cungBo = (a: readonly string[], b: readonly string[]) => a.length === b.length && [...a].sort().join() === [...b].sort().join();
const coBang = (conn: any, b: string) => !!conn.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?`).get(b);
const cotCua = (conn: any, b: string): string[] => (conn.prepare('SELECT name FROM pragma_table_info(?)').all(b) as any[]).map((c) => c.name as string);
/** Cột duy nhất MỘT mình (khoá chống trùng `idempotency_key`, `dedup_key`…) — bản chép để trống, không trùng dòng gốc. */
const cotDuyNhat = (conn: any, b: string): Set<string> => new Set((conn.prepare('SELECT name FROM pragma_index_list(?) WHERE "unique" = 1').all(b) as any[])
  .map((ix) => conn.prepare('SELECT name FROM pragma_index_info(?)').all(ix.name) as any[]).filter((c) => c.length === 1).map((c) => c[0].name as string));

/** Lượt của lớp PET / KET đang chạy còn dòng lịch môn gộp: `co_diem` = đã có dòng điểm môn gộp (giữ), ngược lại tách. */
function luotGop(conn: any, ma: readonly string[]): { id: number; class_id: number; co_diem: number }[] {
  if (!ma.length) return [];
  return conn.prepare(
    `SELECT a.id, a.class_id, EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id AND s.skill IN (${IN(GOP.length)})) AS co_diem
       FROM assessment_attempts a JOIN classes c ON c.id = a.class_id
      WHERE c.programme_code IN (${IN(ma.length)}) AND c.status = 'active' AND a.status != 'cancelled'
        /* Lượt đã huỷ / có bản huỷ chưa khôi phục: GIỮ nguyên (bản huỷ cất dòng lịch + điểm môn gộp — khôi phục trả đúng như cũ). */
        AND NOT EXISTS (SELECT 1 FROM ket_qua_huy h WHERE h.attempt_id = a.id AND h.khoi_phuc_luc IS NULL)
        AND EXISTS (SELECT 1 FROM attempt_skills k WHERE k.attempt_id = a.id AND k.skill IN (${IN(GOP.length)}))
      ORDER BY a.id`,
  ).all(...GOP, ...ma, ...GOP) as any[];
}
/** Mọi lớp của chương trình (đang chạy + đã kết thúc) — bước 2a. */
const lopCuaCt = (conn: any, ma: readonly string[]) =>
  conn.prepare(`SELECT id, code FROM classes WHERE programme_code IN (${IN(ma.length)})`).all(...ma) as { id: number; code: string }[];
/** Dòng môn tách "anh em" của một dòng phân công gộp: cùng lớp, GV, môn tách, trạng thái; dòng đã kết thúc thì cùng ngày hiệu lực. */
const coAnhEm = (conn: any, t: any, k: string) => !!conn.prepare(
  `SELECT 1 FROM teacher_assignments WHERE class_id = ? AND user_id = ? AND skill = ? AND status = ? AND (status = 'active' OR effective_from = ?)`,
).get(t.class_id, t.user_id, k, t.status, t.effective_from);
/** Phân công môn gộp còn thiếu dòng môn tách — lớp đang chạy: dòng đang dạy; lớp đã kết thúc: mọi dòng (Mở lại lớp dùng lại). */
const phanCongThieuTach = (conn: any, ma: readonly string[]) => (ma.length ? conn.prepare(
  `SELECT t.* FROM teacher_assignments t JOIN classes c ON c.id = t.class_id
    WHERE c.programme_code IN (${IN(ma.length)}) AND (c.status != 'active' OR t.status = 'active') AND t.skill IN (${IN(GOP.length)})`,
).all(...ma, ...GOP) as any[] : []).filter((t: any) => MON_GOP[t.skill].some((k) => !coAnhEm(conn, t, k)));
const SQL_KCK = (ma: readonly string[]) => `FROM learning_cycles WHERE route IS NULL AND khong_cam_ket = 1 AND programme_code IN (${IN(ma.length)})`;
/** Target khoá KET / PET ngoài thang Cambridge của khoá (band cũ, số lẻ…) — không đọc được theo thang → để trống. */
const SQL_TARGET_SAI = () => `FROM learning_cycles WHERE route IS NULL AND target_score IS NOT NULL AND (${MA.map(() =>
  '(programme_code = ? AND (target_score < ? OR target_score > ? OR target_score != CAST(target_score AS INTEGER)))').join(' OR ')})`;
const THAM_TARGET_SAI = () => MA.flatMap((m) => [m, kyThiCuaChuongTrinh(m)!.min, kyThiCuaChuongTrinh(m)!.max]);

export const KHOA_PR_KET_PET = 'pr_ket_pet_at';
export const NGUON_PR_KET_PET = 'migrate prKetPet';

/** Bước 3–4: sửa từng lộ trình + MỘT dòng nhật ký `cycle.update` mỗi lộ trình (trước → sau, nguồn migrate) — cùng `tx`. */
function suaLoTrinh(conn: any, sql: string, tham: unknown[], cot: 'khong_cam_ket' | 'target_score', moi: number | null): number {
  const ds = conn.prepare(`SELECT id, student_id, programme_code, ${cot} AS cu ${sql}`).all(...tham) as any[];
  if (!ds.length) return 0;
  conn.prepare(`UPDATE learning_cycles SET ${cot} = ? WHERE id IN (SELECT id ${sql})`).run(moi, ...tham);
  voiNguon(NGUON_PR_KET_PET, () => writeAuditLo(ds.map((c) => ({
    actorUserId: null, action: 'cycle.update', entityType: 'learning_cycle', entityId: c.id,
    before: { [cot]: c.cu }, after: { [cot]: moi, kyThi: kyThiCuaChuongTrinh(c.programme_code)?.ma },
  }))));
  return ds.length;
}

export function migratePrKetPet(conn: any, applied: string[]) {
  if (!coBang(conn, 'programme_skills') || !coBang(conn, 'attempt_skills') || !coBang(conn, 'ket_qua_huy')) return;
  /* 3. KCK: Target Cambridge không có dấu KCK (chạy cả khi Quản trị đã sửa bộ môn; mọi khoá, kể cả đã đóng). */
  tx(() => {
    const n = suaLoTrinh(conn, SQL_KCK(MA), MA, 'khong_cam_ket', 0);
    if (n) applied.push(`P13 KET-PET: bỏ dấu KCK của ${n} lộ trình KET / PET (Target Cambridge không có KCK; Target giữ nguyên; nhật ký từng lộ trình).`);
  });
  /* 4. Target khoá KET / PET ngoài thang (band cũ…) → trống: không so được với điểm Cambridge; người nhập lại theo thang. */
  tx(() => {
    const n = suaLoTrinh(conn, SQL_TARGET_SAI(), THAM_TARGET_SAI(), 'target_score', null);
    if (n) applied.push(`P13 KET-PET: ${n} lộ trình KET / PET có Target ngoài thang Cambridge (band cũ / số lẻ) → để trống, nhập lại theo thang (nhật ký từng lộ trình).`);
  });
  /* Bước 1–2: một lần. */
  if (conn.prepare('SELECT 1 FROM demo_config WHERE key = ?').get(KHOA_PR_KET_PET)) return;
  tachMon(conn, applied);
  conn.prepare('INSERT INTO demo_config (key, value, updated_at) VALUES (?,?,?)').run(KHOA_PR_KET_PET, nowIso(), nowIso());
}

function tachMon(conn: any, applied: string[]) {
  /* 1. Bộ môn chương trình: chỉ đổi khi còn ĐÚNG bộ gộp mặc định. */
  tx(() => {
    for (const m of MA) {
      if (!cungBo(boMon(conn, m), GOP)) continue;
      conn.prepare('DELETE FROM programme_skills WHERE programme_code = ?').run(m);
      BON.forEach((k, i) => conn.prepare('INSERT INTO programme_skills (programme_code, skill, seq) VALUES (?,?,?)').run(m, k, i));
      applied.push(`P13 KET-PET: ${m} — môn L+S, R+W → L · R · W · S.`);
    }
  });
  const ma = MA.filter((m) => cungBo(boMon(conn, m), BON));
  if (!ma.length) return;
  /* 2a. Môn của MỌI lớp (đang chạy + đã kết thúc) + phân công GV (dòng gộp giữ, thêm dòng môn tách). */
  tx(() => {
    const cotTa = cotCua(conn, 'teacher_assignments').filter((c) => c !== 'id' && c !== 'skill');
    const doiLop = new Set<number>();
    for (const l of lopCuaCt(conn, ma)) {
      for (const cs of conn.prepare(`SELECT * FROM class_skills WHERE class_id = ? AND skill IN (${IN(GOP.length)})`).all(l.id, ...GOP) as any[]) {
        for (const k of MON_GOP[cs.skill]) conn.prepare('INSERT OR IGNORE INTO class_skills (class_id, skill, sessions_per_week) VALUES (?,?,?)').run(l.id, k, cs.sessions_per_week);
        conn.prepare('DELETE FROM class_skills WHERE id = ?').run(cs.id);
        doiLop.add(l.id);
      }
    }
    for (const t of phanCongThieuTach(conn, ma)) {
      for (const k of MON_GOP[t.skill]) {
        if (coAnhEm(conn, t, k)) continue;
        conn.prepare(`INSERT INTO teacher_assignments (skill, ${cotTa.join(', ')}) SELECT ?, ${cotTa.join(', ')} FROM teacher_assignments WHERE id = ?`).run(k, t.id);
      }
      doiLop.add(t.class_id);
    }
    for (const l of lopCuaCt(conn, ma).filter((x) => doiLop.has(x.id))) {
      applied.push(`P13 KET-PET: lớp ${l.code} — môn L+S, R+W → L · R · W · S; GV môn gộp dạy thêm hai môn tách (dòng phân công gộp giữ).`);
    }
  });
  /* 2b. Lượt chưa ghi gì ở môn gộp → mọi bảng khoá (lượt, môn) trừ bảng điểm: dòng môn gộp → hai môn tách (chép mọi cột). */
  tx(() => {
    /* Bảng khoá (lượt, môn) — cột tính MỘT lần mỗi bảng. Không đụng bảng điểm (căn cứ giữ / tách) và `case_signals` (tín hiệu gắn điểm đã có). */
    const bang = (conn.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT IN ('assessment_scores', 'case_signals')`).all() as any[])
      .map((r) => r.name as string).filter((b) => { const c = cotCua(conn, b); return c.includes('attempt_id') && c.includes('skill'); })
      .map((b) => { const duyNhat = cotDuyNhat(conn, b); return { b, cot: cotCua(conn, b).filter((c) => c !== 'id' && c !== 'skill' && !duyNhat.has(c)) }; });
    const dem = new Map<number, number>();
    for (const l of luotGop(conn, ma).filter((x) => !x.co_diem)) {
      for (const { b, cot } of bang) {
        for (const g of GOP) {
          const [dau, sau] = MON_GOP[g];
          if (!conn.prepare(`SELECT 1 FROM ${b} WHERE attempt_id = ? AND skill = ?`).get(l.id, g)) continue;
          conn.prepare(`INSERT OR IGNORE INTO ${b} (skill, ${cot.join(', ')}) SELECT ?, ${cot.join(', ')} FROM ${b} WHERE attempt_id = ? AND skill = ?`).run(sau, l.id, g);
          conn.prepare(`UPDATE OR IGNORE ${b} SET skill = ? WHERE attempt_id = ? AND skill = ?`).run(dau, l.id, g);
          conn.prepare(`DELETE FROM ${b} WHERE attempt_id = ? AND skill = ?`).run(l.id, g);   // còn sót (trùng khoá) — dòng tách đã có
        }
      }
      dem.set(l.class_id, (dem.get(l.class_id) ?? 0) + 1);
    }
    for (const [lop, n] of dem) {
      applied.push(`P13 KET-PET: ${(conn.prepare('SELECT code FROM classes WHERE id = ?').get(lop) as any).code} — ${n} lượt chưa có điểm môn gộp → 4 môn.`);
    }
  });
}
