/**
 * UI-HO-SO-LOP (V5 `08` mục 6c, brief C17 · T12): NHẬN XÉT + ĐỀ XUẤT BƯỚC TIẾP của GVCN khi đánh giá đầu ra lớp thường (tab "Đánh giá đầu ra",
 * panel lần lượt từng em). Chỉ lưu đề xuất — không lệnh, không việc, không Case; Quản lý vẫn chốt ở Lộ trình tiếp theo (luật hiện hành).
 * Kết quả Đạt / Chưa đạt KHÔNG lưu ở đây: máy tính từ bài Final (`danhGiaDauRa`, R3a "Chờ Final"). Mỗi lần lưu ghi `audit_logs` (`dau_ra.ghi`) = lịch sử.
 */
import { PERMISSIONS } from '../../../shared/domain/index.ts';
import { db, tx } from '../db.ts';
import { can, require_, type Principal } from '../permissions.ts';
import { badRequest, chuTuDo, forbidden, notFound, nowIso } from '../util.ts';
import { writeAudit } from '../platform/audit.ts';
import { phanCongO } from './quyenChuyenLop.ts';

/** Đề xuất bước tiếp — cùng mã hướng của Lộ trình tiếp theo (`lo_trinh_tiep_theo.huong`): Lên lớp kế · Lên FT · Học lại · Tạm dừng · Dừng học. */
export const DE_XUAT_DAU_RA = ['len_lop', 'fast_track', 'hoc_lai', 'bao_luu', 'dung_hoc'] as const;
export type DeXuatDauRa = (typeof DE_XUAT_DAU_RA)[number];
export const NHAN_XET_DAU_RA_TOI_DA = 2000;

export type LuuDauRa = { luc: string; nguoi: string | null; nhanXet: string | null; deXuat: string | null };
export type DongDauRa = { studentId: number; nhanXet: string | null; deXuat: DeXuatDauRa | null; boi: string | null; luc: string | null; lichSu: LuuDauRa[] };

/** GVCN đang dạy lớp, hoặc Quản lý của lớp (`class.edit`). */
const coTheGhi = (p: Principal, classId: number) => phanCongO(db(), p.userId, classId).gvcn || can(p, PERMISSIONS.CLASS_EDIT, { classId });

function lopThuong(classId: number) {
  const c = db().prepare(
    `SELECT c.id, c.code, pg.scoring_mode FROM classes c LEFT JOIN programmes pg ON pg.code = c.programme_code WHERE c.id = ?`,
  ).get(classId) as { id: number; code: string; scoring_mode: string | null } | undefined;
  if (!c) throw notFound('Không tìm thấy lớp');
  if (c.scoring_mode !== 'ratio') throw badRequest('Chỉ lớp thường có Đánh giá đầu ra.');
  return c;
}

/** GET /classes/:id/danh-gia-dau-ra — mọi em có dòng (kể cả chưa ghi), lịch sử mới nhất trước. Hai câu SQL cho cả lớp. */
export function xemDanhGiaDauRa(p: Principal, classId: number): { rows: DongDauRa[]; coTheGhi: boolean } {
  require_(p, PERMISSIONS.ATTEMPT_VIEW, { classId }, 'Lớp này nằm ngoài phạm vi bạn được xem.');
  lopThuong(classId);
  const conn = db();
  const rows = conn.prepare(
    `SELECT d.student_id, d.nhan_xet, d.de_xuat, d.sua_luc, u.full_name AS boi FROM danh_gia_dau_ra d LEFT JOIN users u ON u.id = d.sua_boi WHERE d.class_id = ?`,
  ).all(classId) as any[];
  const ls = new Map<number, LuuDauRa[]>();
  for (const a of conn.prepare(
    `SELECT a.entity_id, a.after_json, a.created_at, u.full_name FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_user_id
      WHERE a.entity_type = 'student' AND a.action = 'dau_ra.ghi' AND a.entity_label = ? ORDER BY a.id DESC`,
  ).all(`lop:${classId}`) as any[]) {
    const v = JSON.parse(a.after_json ?? '{}');
    (ls.get(a.entity_id) ?? ls.set(a.entity_id, []).get(a.entity_id)!).push({ luc: a.created_at, nguoi: a.full_name ?? null, nhanXet: v.nhanXet ?? null, deXuat: v.deXuat ?? null });
  }
  return {
    coTheGhi: coTheGhi(p, classId),
    rows: rows.map((r) => ({ studentId: r.student_id, nhanXet: r.nhan_xet, deXuat: r.de_xuat, boi: r.boi ?? null, luc: r.sua_luc, lichSu: ls.get(r.student_id) ?? [] })),
  };
}

/** PUT /classes/:id/danh-gia-dau-ra/:studentId { nhanXet, deXuat } — ghi đè bản hiện tại, bản cũ còn trong lịch sử. Lưu nguyên giá trị cũ → không thêm mục. */
export function ghiDanhGiaDauRa(p: Principal, classId: number, studentId: number, input: { nhanXet?: unknown; deXuat?: unknown }) {
  const c = lopThuong(classId);
  if (!coTheGhi(p, classId)) throw forbidden('Chỉ GVCN hoặc Quản lý của lớp ghi được Đánh giá đầu ra.');
  const nhanXet = chuTuDo(input.nhanXet ?? null, 'Nhận xét', NHAN_XET_DAU_RA_TOI_DA);
  const deXuat = input.deXuat === undefined || input.deXuat === null || input.deXuat === '' ? null : input.deXuat;
  if (deXuat !== null && !DE_XUAT_DAU_RA.includes(deXuat as DeXuatDauRa)) throw badRequest('Đề xuất bước tiếp không hợp lệ.');
  const conn = db();
  if (!conn.prepare(`SELECT 1 FROM enrollments WHERE class_id = ? AND student_id = ? AND status = 'active'`).get(classId, studentId)) {
    throw badRequest('Học viên không còn học lớp này.');
  }
  return tx(() => {
    const cu = conn.prepare('SELECT nhan_xet, de_xuat FROM danh_gia_dau_ra WHERE class_id = ? AND student_id = ?').get(classId, studentId) as any;
    if (cu && cu.nhan_xet === nhanXet && cu.de_xuat === deXuat) return { nhanXet, deXuat, doi: false };
    const now = nowIso();
    conn.prepare(
      `INSERT INTO danh_gia_dau_ra (student_id, class_id, nhan_xet, de_xuat, sua_boi, sua_luc) VALUES (?,?,?,?,?,?)
       ON CONFLICT(student_id, class_id) DO UPDATE SET nhan_xet = excluded.nhan_xet, de_xuat = excluded.de_xuat, sua_boi = excluded.sua_boi, sua_luc = excluded.sua_luc`,
    ).run(studentId, classId, nhanXet, deXuat, p.userId, now);
    writeAudit({
      actorUserId: p.userId, action: 'dau_ra.ghi', entityType: 'student', entityId: studentId, entityLabel: `lop:${c.id}`,
      before: cu ? { nhanXet: cu.nhan_xet, deXuat: cu.de_xuat } : null, after: { nhanXet, deXuat, lop: c.code },
    });
    return { nhanXet, deXuat, doi: true };
  });
}
