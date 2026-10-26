/**
 * P13 KET-PET (plan.md 1.6 N18; plan `2026-10-26-p13-ket-pet.md` Task 0 + 2) — CHECKPOINT PET / KET TÁCH R · W · L · S. Chạy lặp được, mỗi bước một `tx`:
 *   1. `programme_skills` PET / KET còn đúng bộ gộp mặc định (L+S, R+W) → 4 môn. Quản trị đã sửa khác → không đụng (ghi `applied`).
 *   2. Chỉ với chương trình đang là đúng 4 môn: lớp ĐANG CHẠY —
 *      `class_skills` gộp → 2 môn tách (giữ số buổi); phân công GV môn gộp → GV đó dạy cả hai môn tách;
 *      lượt Checkpoint: cả đợt (lớp + số Checkpoint) CHƯA ô nào ghi gì ở môn gộp → dòng lịch môn tách (giữ tuần, trạng thái);
 *      đợt đã có điểm / dấu "-" / nhận xét ở môn gộp → GIỮ nguyên (không chia điểm — không có căn cứ), đọc theo môn của lượt (`boMonCuaLuot`).
 *   Case mở theo môn gộp giữ nguyên; lớp đã kết thúc không đụng.
 * `kiemTruocKetPet` = số liệu Task 0, CHỈ ĐỌC (`npm run kiem-truoc-ket-pet`).
 */
import { tx } from '../db.ts';
import { nowIso } from '../util.ts';
import { CHUONG_TRINH_LIEN_TUC_CO_SAN, MON_GOP } from '../../../shared/domain/index.ts';

const GOP = Object.keys(MON_GOP);                                   // listening_speaking, reading_writing
const MA = CHUONG_TRINH_LIEN_TUC_CO_SAN.map((c) => c.code);         // PET, KET
const BON = CHUONG_TRINH_LIEN_TUC_CO_SAN[0].skills;                 // listening, reading, writing, speaking
const IN = (n: number) => Array(n).fill('?').join(',');
const boMon = (conn: any, ma: string): string[] =>
  (conn.prepare('SELECT skill FROM programme_skills WHERE programme_code = ? ORDER BY seq, skill').all(ma) as any[]).map((r) => r.skill);
const cungBo = (a: readonly string[], b: readonly string[]) => a.length === b.length && [...a].sort().join() === [...b].sort().join();
const coBang = (conn: any, b: string) => !!conn.prepare(`SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?`).get(b);

/** Đợt Checkpoint (lớp, số) của lớp đang chạy có môn gộp: `coDiem` = đã có ô ghi ở môn gộp (giữ), ngược lại tách. */
function dotCheckpoint(conn: any, ma: readonly string[]) {
  if (!ma.length) return [] as { class_id: number; attempt_no: number; so_luot: number; co_diem: number }[];
  return conn.prepare(
    `SELECT a.class_id, a.attempt_no, COUNT(DISTINCT a.id) AS so_luot,
            MAX(EXISTS (SELECT 1 FROM assessment_scores s WHERE s.attempt_id = a.id AND s.skill IN (${IN(GOP.length)}))) AS co_diem
       FROM assessment_attempts a JOIN classes c ON c.id = a.class_id
      WHERE c.programme_code IN (${IN(ma.length)}) AND c.status = 'active' AND a.kind = 'checkpoint' AND a.status != 'cancelled'
        AND EXISTS (SELECT 1 FROM attempt_skills k WHERE k.attempt_id = a.id AND k.skill IN (${IN(GOP.length)}))
      GROUP BY a.class_id, a.attempt_no ORDER BY a.class_id, a.attempt_no`,
  ).all(...GOP, ...ma, ...GOP) as any[];
}

export type KiemTruocKetPet = {
  boMon: Record<string, string[]>; lop: { ma: string; status: string; so: number }[]; soEm: number;
  dotGiu: number; luotGiu: number; dotTach: number; luotTach: number; phanCongGop: number; caseMoGop: number;
};
export function kiemTruocKetPet(conn: any): KiemTruocKetPet {
  const r: KiemTruocKetPet = { boMon: {}, lop: [], soEm: 0, dotGiu: 0, luotGiu: 0, dotTach: 0, luotTach: 0, phanCongGop: 0, caseMoGop: 0 };
  if (!coBang(conn, 'programme_skills')) return r;
  for (const m of MA) r.boMon[m] = boMon(conn, m);
  r.lop = conn.prepare(`SELECT programme_code AS ma, status, COUNT(*) AS so FROM classes WHERE programme_code IN (${IN(MA.length)}) GROUP BY 1, 2 ORDER BY 1, 2`).all(...MA) as any[];
  r.soEm = (conn.prepare(`SELECT COUNT(DISTINCT e.student_id) AS n FROM enrollments e JOIN classes c ON c.id = e.class_id
     WHERE c.programme_code IN (${IN(MA.length)}) AND e.status = 'active'`).get(...MA) as any).n;
  for (const d of dotCheckpoint(conn, MA)) {
    if (d.co_diem) { r.dotGiu++; r.luotGiu += d.so_luot; } else { r.dotTach++; r.luotTach += d.so_luot; }
  }
  r.phanCongGop = (conn.prepare(`SELECT COUNT(*) AS n FROM teacher_assignments t JOIN classes c ON c.id = t.class_id
     WHERE c.programme_code IN (${IN(MA.length)}) AND c.status = 'active' AND t.status = 'active' AND t.skill IN (${IN(GOP.length)})`).get(...MA, ...GOP) as any).n;
  r.caseMoGop = (conn.prepare(`SELECT COUNT(*) AS n FROM sos_cases WHERE status != 'done' AND (topic IN (${IN(GOP.length)}) OR category IN (${IN(GOP.length)}))`)
    .get(...GOP, ...GOP) as any).n;
  return r;
}

export function migratePrKetPet(conn: any, applied: string[]) {
  if (!coBang(conn, 'programme_skills') || !coBang(conn, 'attempt_skills')) return;
  /* 1. Bộ môn chương trình: chỉ đổi khi còn ĐÚNG bộ gộp mặc định. */
  tx(() => {
    for (const m of MA) {
      const bo = boMon(conn, m);
      if (!cungBo(bo, GOP)) continue;
      conn.prepare('DELETE FROM programme_skills WHERE programme_code = ?').run(m);
      BON.forEach((k, i) => conn.prepare('INSERT INTO programme_skills (programme_code, skill, seq) VALUES (?,?,?)').run(m, k, i));
      applied.push(`P13 KET-PET: ${m} — môn L+S, R+W → L · R · W · S.`);
    }
  });
  const ma = MA.filter((m) => cungBo(boMon(conn, m), BON));
  if (!ma.length) return;
  /* 2a. Môn của lớp đang chạy + phân công GV. */
  tx(() => {
    const lop = conn.prepare(`SELECT id, code FROM classes WHERE programme_code IN (${IN(ma.length)}) AND status = 'active'`).all(...ma) as any[];
    for (const l of lop) {
      let doi = 0;
      for (const cs of conn.prepare(`SELECT * FROM class_skills WHERE class_id = ? AND skill IN (${IN(GOP.length)})`).all(l.id, ...GOP) as any[]) {
        for (const k of MON_GOP[cs.skill]) conn.prepare('INSERT OR IGNORE INTO class_skills (class_id, skill, sessions_per_week) VALUES (?,?,?)').run(l.id, k, cs.sessions_per_week);
        conn.prepare('DELETE FROM class_skills WHERE id = ?').run(cs.id);
        doi++;
      }
      for (const t of conn.prepare(`SELECT * FROM teacher_assignments WHERE class_id = ? AND status = 'active' AND skill IN (${IN(GOP.length)})`).all(l.id, ...GOP) as any[]) {
        const [dau, sau] = MON_GOP[t.skill];
        const coSan = (k: string) => !!conn.prepare(`SELECT 1 FROM teacher_assignments WHERE class_id = ? AND user_id = ? AND skill = ? AND status = 'active'`).get(l.id, t.user_id, k);
        /* GV đã có sẵn môn tách đầu → kết thúc dòng gộp (không thành hai dòng trùng); chưa có → dòng gộp thành môn đó. */
        if (!coSan(sau)) {   // chép TRƯỚC khi dòng gộp đổi / kết thúc (bản chép giữ trạng thái đang dạy)
          const cotTa = (conn.prepare('SELECT name FROM pragma_table_info(?)').all('teacher_assignments') as any[]).map((c) => c.name as string).filter((c) => c !== 'id' && c !== 'skill');
          conn.prepare(`INSERT INTO teacher_assignments (skill, ${cotTa.join(', ')}) SELECT ?, ${cotTa.join(', ')} FROM teacher_assignments WHERE id = ?`).run(sau, t.id);
        }
        if (coSan(dau)) conn.prepare(`UPDATE teacher_assignments SET status = 'ended', effective_to = COALESCE(effective_to, ?) WHERE id = ?`).run(nowIso().slice(0, 10), t.id);
        else conn.prepare('UPDATE teacher_assignments SET skill = ? WHERE id = ?').run(dau, t.id);
        doi++;
      }
      if (doi) applied.push(`P13 KET-PET: lớp ${l.code} — môn và phân công GV L+S, R+W → L · R · W · S.`);
    }
  });
  /* 2b. Đợt Checkpoint chưa ô nào ghi ở môn gộp → dòng lịch môn tách (chép mọi cột của dòng gộp). */
  tx(() => {
    const cot = (conn.prepare('SELECT name FROM pragma_table_info(?)').all('attempt_skills') as any[]).map((c) => c.name as string).filter((c) => c !== 'id' && c !== 'skill');
    const lopCode = new Map<number, string>();
    for (const d of dotCheckpoint(conn, ma).filter((x) => !x.co_diem)) {
      const ids = (conn.prepare(`SELECT id FROM assessment_attempts WHERE class_id = ? AND attempt_no = ? AND kind = 'checkpoint' AND status != 'cancelled'`)
        .all(d.class_id, d.attempt_no) as any[]).map((r) => r.id as number);
      for (const id of ids) {
        for (const g of GOP) {
          const [dau, sau] = MON_GOP[g];
          if (!conn.prepare('SELECT 1 FROM attempt_skills WHERE attempt_id = ? AND skill = ?').get(id, g)) continue;
          conn.prepare(`INSERT OR IGNORE INTO attempt_skills (skill, ${cot.join(', ')}) SELECT ?, ${cot.join(', ')} FROM attempt_skills WHERE attempt_id = ? AND skill = ?`).run(sau, id, g);
          conn.prepare('UPDATE attempt_skills SET skill = ? WHERE attempt_id = ? AND skill = ?').run(dau, id, g);
          for (const k of [dau, sau]) conn.prepare('INSERT OR IGNORE INTO attempt_skill_skips (attempt_id, skill, reason, created_by, created_at) SELECT attempt_id, ?, reason, created_by, created_at FROM attempt_skill_skips WHERE attempt_id = ? AND skill = ?').run(k, id, g);
          conn.prepare('DELETE FROM attempt_skill_skips WHERE attempt_id = ? AND skill = ?').run(id, g);
        }
      }
      if (!lopCode.has(d.class_id)) lopCode.set(d.class_id, (conn.prepare('SELECT code FROM classes WHERE id = ?').get(d.class_id) as any).code);
      applied.push(`P13 KET-PET: ${lopCode.get(d.class_id)} · Checkpoint ${d.attempt_no} (${ids.length} lượt chưa có điểm) → 4 môn.`);
    }
  });
}
