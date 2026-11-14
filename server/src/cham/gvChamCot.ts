import { db } from '../db.ts';
import { editableSkills, laGvSpeaking, type Principal } from '../permissions.ts';
import { laNguoiHopLe } from '../platform/timNguoi.ts';
import { badRequest, forbidden, nowIso } from '../util.ts';
import type { NguoiChon } from '../../../shared/domain/index.ts';

/**
 * LG-5(c) (chủ SP 13/11): "GV chấm S" đầu cột lưới FT — người chọn × lớp × đợt, nhớ ở MÁY CHỦ (đổi máy / trình duyệt vẫn còn; máy dùng chung
 * không kế thừa lựa chọn người trước — giữ ý PR-S4F #10). Đọc kèm `classScoreSheet` (1 câu theo khoá chính, không thêm request); ghi một PUT.
 * Chưa chọn: GV Speaking mặc định "Tôi"; người khác "chưa chọn" (2.4 — không ghi ngầm).
 */
const DOT = /^(\d{1,9}|mt\d{1,2})$/;

export function docGvChamCot(p: Principal, classId: number, dot: string | null): NguoiChon | null {
  const macDinh: NguoiChon | null = laGvSpeaking(p) ? { kieu: 'toi' } : null;
  if (!dot) return macDinh;
  const r = db().prepare(`SELECT g.examiner_user_id AS id, g.examiner_name AS ten, u.full_name AS ten_tk FROM gv_cham_cot g LEFT JOIN users u ON u.id = g.examiner_user_id
     WHERE g.user_id = ? AND g.class_id = ? AND g.dot = ?`).get(p.userId, classId, dot) as any;
  if (!r) return macDinh;
  if (r.id === p.userId) return { kieu: 'toi' };
  if (r.id) return { kieu: 'tai_khoan', id: r.id, ten: r.ten_tk ?? '' };
  return r.ten ? { kieu: 'ngoai', ten: r.ten } : null;
}

/** GD-2 (panel Chấm Speaking, ngăn lớp × tuần): mọi lựa chọn của người xem ở các lớp của hàng đợi — MỘT câu theo lô (khoá chính user_id + class_id).
 *  Trả `{ "classId:dot": NguoiChon }` chỉ cho ô đã chọn; ô không có → nơi gọi dùng `macDinh` (như `docGvChamCot`). */
export function docGvChamCotLo(p: Principal, classIds: readonly number[]): { chon: Record<string, NguoiChon | null>; macDinh: NguoiChon | null } {
  const macDinh: NguoiChon | null = laGvSpeaking(p) ? { kieu: 'toi' } : null;
  const chon: Record<string, NguoiChon | null> = {};
  const ids = [...new Set(classIds)];
  if (!ids.length) return { chon, macDinh };
  const rows = db().prepare(`SELECT g.class_id AS lop, g.dot, g.examiner_user_id AS id, g.examiner_name AS ten, u.full_name AS ten_tk FROM gv_cham_cot g
     LEFT JOIN users u ON u.id = g.examiner_user_id WHERE g.user_id = ? AND g.class_id IN (${ids.map(() => '?').join(',')})`).all(p.userId, ...ids) as any[];
  for (const r of rows) {
    chon[`${r.lop}:${r.dot}`] = r.id === p.userId ? { kieu: 'toi' } : r.id ? { kieu: 'tai_khoan', id: r.id, ten: r.ten_tk ?? '' } : r.ten ? { kieu: 'ngoai', ten: r.ten } : null;
  }
  return { chon, macDinh };
}

export function ghiGvChamCot(p: Principal, b: { classId?: unknown; dot?: unknown; gv?: unknown }): { gv: NguoiChon | null } {
  const classId = Number(b.classId);
  const dot = String(b.dot ?? '');
  if (!Number.isInteger(classId) || classId <= 0 || !DOT.test(dot)) throw badRequest('Lớp hoặc đợt không hợp lệ.');
  /* Cùng quyền ô S của lớp: nhập được Speaking (Mock FT, hoặc MT0 lớp thường). */
  if (!editableSkills(p, classId, ['speaking']).length && !editableSkills(p, classId, ['speaking'], { lich_su: 0, kind: 'mt0' }).length) {
    throw forbidden('Bạn không nhập điểm Speaking ở lớp này.');
  }
  const g = b.gv as any;
  let id: number | null = null, ten: string | null = null;
  if (g == null) { /* xoá lựa chọn → về mặc định */ }
  else if (g.kieu === 'toi') {
    if (!laGvSpeaking(p)) throw badRequest('Bạn không phải GV Speaking — chọn GV chấm khác.');
    id = p.userId;
  } else if (g.kieu === 'tai_khoan' && Number.isInteger(g.id) && g.id > 0) {
    if (!laNguoiHopLe(g.id, 'gv_speaking')) throw badRequest('Người chấm Speaking chéo phải là GV Speaking (có kỹ năng S trong hồ sơ hoặc đang dạy Speaking một lớp FT), hoặc gõ tên người ngoài (2–100 ký tự).');
    id = g.id;
  } else if (g.kieu === 'ngoai' && typeof g.ten === 'string' && g.ten.trim().length >= 2 && g.ten.trim().length <= 100) ten = g.ten.trim();
  else throw badRequest('GV chấm không hợp lệ.');
  const conn = db();
  if (g == null) conn.prepare('DELETE FROM gv_cham_cot WHERE user_id = ? AND class_id = ? AND dot = ?').run(p.userId, classId, dot);
  else conn.prepare(`INSERT INTO gv_cham_cot (user_id, class_id, dot, examiner_user_id, examiner_name, cap_nhat) VALUES (?,?,?,?,?,?)
      ON CONFLICT (user_id, class_id, dot) DO UPDATE SET examiner_user_id = excluded.examiner_user_id, examiner_name = excluded.examiner_name, cap_nhat = excluded.cap_nhat`)
    .run(p.userId, classId, dot, id, ten, nowIso());
  return { gv: docGvChamCot(p, classId, dot) };
}
