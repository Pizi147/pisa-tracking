/**
 * MÔN ĐĂNG KÝ của một lộ trình Fast Track (P8, plan.md 1.6 N13, N22 ④ — chỉ FT).
 *
 * `learning_cycles.mon_dang_ky` = JSON mảng con của năm ô nhập L · R · W1 · W2 · S; NULL = đủ môn. Môn không học → dòng lịch
 * `required = 0` (`scope_reason = 'Không học'`); chỉ học W1 hoặc W2 → Writing vẫn MỘT dòng lịch, đánh dấu task bỏ ở `attempt_skills.bo_task`
 * và Writing = task đã học (Q4). Mọi nơi (máy chủ + web) đọc qua các hàm dưới, không tự suy lại.
 */
import { ENTRY_SKILLS, ENTRY_SKILL_SHORT, type AssessedSkill, type EntrySkill } from './skills.ts';

/** Lý do phạm vi của dòng lịch do môn đăng ký tắt — nhận lại đúng dòng này khi bật lại môn. */
export const LY_DO_KHONG_HOC = 'Không học (môn đăng ký)';   // chữ riêng — không trùng lý do QL tự gõ khi "Huỷ kỹ năng"
/** Dấu đi trong danh sách kỹ năng bỏ của lượt: có kỹ năng bỏ VÌ môn đăng ký → Overall "Không đủ bộ môn" (QL "Huỷ kỹ năng" cũ thì không). */
export const DAU_KHONG_HOC = 'khong_hoc';
/** Nhãn Overall khi lượt thiếu kỹ năng vì môn đăng ký (khác "Chưa đủ dữ liệu"). */
export const NHAN_KHONG_DU_BO_MON = 'Không đủ bộ môn';

export type MonVao = string | readonly string[] | null | undefined;

/** Tập môn đã học; NULL / trống chuỗi = đủ môn. Mảng rỗng hoặc giá trị lạ → lỗi (máy chủ trả 400 tại ô). */
export function chuanMon(mon: MonVao): Set<EntrySkill> {
  if (mon == null || mon === '') return new Set(ENTRY_SKILLS);
  let ds: unknown = mon;
  if (typeof mon === 'string') { try { ds = JSON.parse(mon); } catch { throw new Error('Môn học không hợp lệ.'); } }
  if (!Array.isArray(ds)) throw new Error('Môn học không hợp lệ.');
  if (!ds.length) throw new Error('Chọn ít nhất một môn.');
  for (const k of ds) if (!(ENTRY_SKILLS as readonly unknown[]).includes(k)) throw new Error(`Môn học không hợp lệ: ${String(k)}.`);
  return new Set(ds as EntrySkill[]);
}

/** Giá trị lưu DB: đủ 5 môn → NULL; còn lại JSON theo thứ tự L R W1 W2 S. */
export function luuMon(mon: MonVao): string | null {
  const s = chuanMon(mon);
  return s.size === ENTRY_SKILLS.length ? null : JSON.stringify(ENTRY_SKILLS.filter((k) => s.has(k)));
}

export const laDuMon = (mon: MonVao) => chuanMon(mon).size === ENTRY_SKILLS.length;
export const monThieu = (mon: MonVao): EntrySkill[] => { const s = chuanMon(mon); return ENTRY_SKILLS.filter((k) => !s.has(k)); };

/** Kỹ năng đánh giá không học: L / R / S theo ô; Writing chỉ khi bỏ cả W1 lẫn W2. */
export function kyNangKhongHoc(mon: MonVao): AssessedSkill[] {
  const s = chuanMon(mon);
  const out: AssessedSkill[] = [];
  if (!s.has('listening')) out.push('listening');
  if (!s.has('reading')) out.push('reading');
  if (!s.has('writing1') && !s.has('writing2')) out.push('writing');
  if (!s.has('speaking')) out.push('speaking');
  return out;
}

/** Task Writing bị bỏ khi chỉ học một task; bỏ cả hai (Writing không học) hoặc đủ → null. */
export function boTaskCua(mon: MonVao): 'writing1' | 'writing2' | null {
  const s = chuanMon(mon);
  if (s.has('writing1') === s.has('writing2')) return null;
  return s.has('writing1') ? 'writing2' : 'writing1';
}

/** "L · R · W2 · S"; đủ môn → "Đủ môn". */
export function chuMon(mon: MonVao): string {
  const s = chuanMon(mon);
  return s.size === ENTRY_SKILLS.length ? 'Đủ môn' : ENTRY_SKILLS.filter((k) => s.has(k)).map((k) => ENTRY_SKILL_SHORT[k]).join(' · ');
}
