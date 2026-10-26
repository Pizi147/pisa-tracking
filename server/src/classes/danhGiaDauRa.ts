/**
 * NHẬN XÉT CUỐI KHOÁ của GVCN, lớp thường (UI-HO-SO-LOP C17 · T12 → P9b: cột Nhận xét ở trang Cuối khoá; QL đọc dưới cột Gợi ý, dùng cho Báo PH qua TVV).
 * N22 ①: GVCN không đề xuất hướng nữa (`de_xuat` cũ chỉ đọc) — không lệnh, không việc, không Case; Quản lý chốt ở trang Cuối khoá.
 * Kết quả Đạt / Chưa đạt KHÔNG lưu ở đây: máy tính từ bài Final (`danhGiaDauRa`, R3a "Chờ Final"). Mỗi lần lưu ghi `audit_logs` (`dau_ra.ghi`) = lịch sử.
 */
import { PERMISSIONS } from '../../../shared/domain/index.ts';
import { db, tx } from '../db.ts';
import { can, isCoreTeacherOf, require_, type Principal } from '../permissions.ts';
import { badRequest, chuTuDo, forbidden, loi, notFound, nowIso } from '../util.ts';
import { demoToday } from '../demoConfig.ts';
import { writeAudit } from '../platform/audit.ts';

/** Đề xuất bước tiếp — cùng mã hướng của Lộ trình tiếp theo (`lo_trinh_tiep_theo.huong`): Lên lớp kế · Lên FT · Học lại · Tạm dừng · Dừng học. */
export const DE_XUAT_DAU_RA = ['len_lop', 'fast_track', 'hoc_lai', 'bao_luu', 'dung_hoc'] as const;
export type DeXuatDauRa = (typeof DE_XUAT_DAU_RA)[number];
export const NHAN_XET_DAU_RA_TOI_DA = 2000;
export const CHI_QL_CHOT_HUONG = 'Chỉ Quản lý chốt hướng — GVCN ghi Nhận xét.';

export type LuuDauRa = { luc: string; nguoi: string | null; nhanXet: string | null; deXuat: string | null };
export type DongDauRa = { studentId: number; nhanXet: string | null; deXuat: DeXuatDauRa | null; boi: string | null; luc: string | null; lichSu: LuuDauRa[] };

/** GVCN của lớp (phân công còn hiệu lực hôm nay — lớp đã kết thúc: hiệu lực ngày kết thúc, GVCN vẫn ghi đánh giá cuối khoá), hoặc Quản lý của lớp (`class.edit`). */
const coTheGhi = (p: Principal, c: { id: number; finished_at: string | null }) =>
  isCoreTeacherOf(p, c.id, c.finished_at ? c.finished_at.slice(0, 10) : demoToday()) || can(p, PERMISSIONS.CLASS_EDIT, { classId: c.id });

function lopThuong(classId: number) {
  const c = db().prepare(
    `SELECT c.id, c.code, c.finished_at, pg.scoring_mode FROM classes c LEFT JOIN programmes pg ON pg.code = c.programme_code WHERE c.id = ?`,
  ).get(classId) as { id: number; code: string; finished_at: string | null; scoring_mode: string | null } | undefined;
  if (!c) throw notFound('Không tìm thấy lớp');
  if (c.scoring_mode !== 'ratio') throw badRequest('Chỉ lớp thường có Đánh giá đầu ra.');
  return c;
}

/** GET /classes/:id/danh-gia-dau-ra — mọi em có dòng (kể cả chưa ghi), lịch sử mới nhất trước. Hai câu SQL cho cả lớp. */
export function xemDanhGiaDauRa(p: Principal, classId: number): { rows: DongDauRa[]; coTheGhi: boolean } {
  require_(p, PERMISSIONS.ATTEMPT_VIEW, { classId }, 'Lớp này nằm ngoài phạm vi bạn được xem.');
  const c = lopThuong(classId);
  const conn = db();
  const rows = conn.prepare(
    `SELECT d.student_id, d.nhan_xet, d.de_xuat, d.sua_luc, u.full_name AS boi FROM danh_gia_dau_ra d LEFT JOIN users u ON u.id = d.sua_boi WHERE d.class_id = ?`,
  ).all(classId) as any[];
  const ls = new Map<number, LuuDauRa[]>();
  for (const a of conn.prepare(
    `SELECT a.entity_id, a.after_json, a.created_at, u.full_name FROM audit_logs a LEFT JOIN users u ON u.id = a.actor_user_id
      WHERE a.entity_type = 'student' AND a.action = 'dau_ra.ghi' AND a.entity_label = ? ORDER BY a.id DESC`,
  ).all(`lop:${classId}`) as any[]) {
    let v: any = {};
    try { v = JSON.parse(a.after_json ?? '{}') ?? {}; } catch { /* dòng nhật ký hỏng: vẫn hiện người + lúc */ }
    (ls.get(a.entity_id) ?? ls.set(a.entity_id, []).get(a.entity_id)!).push({ luc: a.created_at, nguoi: a.full_name ?? null, nhanXet: v.nhanXet ?? null, deXuat: v.deXuat ?? null });
  }
  return {
    coTheGhi: coTheGhi(p, c),
    /* Như `viecTheoEm`: em ngoài phạm vi xem của người xem (vd GV chỉ dạy một nhóm) không lộ nhận xét. */
    rows: rows.filter((r) => can(p, PERMISSIONS.ATTEMPT_VIEW, { classId, studentId: r.student_id })).map((r) => ({ studentId: r.student_id, nhanXet: r.nhan_xet, deXuat: r.de_xuat, boi: r.boi ?? null, luc: r.sua_luc, lichSu: ls.get(r.student_id) ?? [] })),
  };
}

/** PUT /classes/:id/danh-gia-dau-ra/:studentId { nhanXet, deXuat } — ghi đè bản hiện tại, bản cũ còn trong lịch sử. Lưu nguyên giá trị cũ → không thêm mục. */
/**
 * `luc` = `sua_luc` người gửi đã thấy khi mở panel (null = chưa có bản nào). Khác bản hiện tại → 409 (không đè im lặng — T15); web giữ chữ đang gõ,
 * lấy `luc` mới trong lỗi để lần bấm Lưu kế ghi đè có chủ ý. Không gửi `luc` (gọi nội bộ) → không kiểm.
 */
export function ghiDanhGiaDauRa(p: Principal, classId: number, studentId: number, input: { nhanXet?: unknown; deXuat?: unknown; luc?: unknown }) {
  const c = lopThuong(classId);
  if (!coTheGhi(p, c)) throw forbidden('Chỉ GVCN hoặc Quản lý của lớp ghi được Đánh giá đầu ra.');
  /* N22 ① (chủ SP 25/10): chỉ QL chốt hướng — không ai ghi đề xuất hướng nữa; `de_xuat` cũ giữ để đọc. GVCN chỉ ghi Nhận xét (không bắt buộc). */
  if (input.deXuat !== undefined && input.deXuat !== null && input.deXuat !== '') throw forbidden(CHI_QL_CHOT_HUONG);
  const nhanXet = chuTuDo(input.nhanXet ?? null, 'Nhận xét', NHAN_XET_DAU_RA_TOI_DA);
  const conn = db();
  /* Em từng ghi danh lớp này (mọi trạng thái): cuối khoá em có thể đã chuyển lớp / lớp đã kết thúc mà GVCN vẫn ghi đánh giá. */
  if (!conn.prepare('SELECT 1 FROM enrollments WHERE class_id = ? AND student_id = ?').get(classId, studentId)) {
    throw badRequest('Học viên không còn học lớp này.');
  }
  return tx(() => {
    const cu = conn.prepare(
      'SELECT d.nhan_xet, d.de_xuat, d.sua_luc, u.full_name AS boi FROM danh_gia_dau_ra d LEFT JOIN users u ON u.id = d.sua_boi WHERE d.class_id = ? AND d.student_id = ?',
    ).get(classId, studentId) as any;
    if (input.luc !== undefined && (input.luc ?? null) !== (cu?.sua_luc ?? null)) {
      throw loi(409, 'Đã có người sửa lúc {luc} ({ai}) — bấm Lưu lần nữa để ghi đè', { luc: gioNgay(cu?.sua_luc), ai: cu?.boi ?? '—' }, { luc: cu?.sua_luc ?? null });
    }
    const deXuat = (cu?.de_xuat ?? null) as string | null;
    if (cu && cu.nhan_xet === nhanXet) return { nhanXet, deXuat, doi: false, luc: cu.sua_luc as string };
    /* `sua_luc` là mốc phiên bản (409): luôn tăng, kể cả hai lần lưu trong cùng một mili-giây. */
    const now = cu?.sua_luc && nowIso() <= cu.sua_luc ? new Date(Date.parse(cu.sua_luc) + 1).toISOString() : nowIso();
    conn.prepare(
      `INSERT INTO danh_gia_dau_ra (student_id, class_id, nhan_xet, sua_boi, sua_luc) VALUES (?,?,?,?,?)
       ON CONFLICT(student_id, class_id) DO UPDATE SET nhan_xet = excluded.nhan_xet, sua_boi = excluded.sua_boi, sua_luc = excluded.sua_luc`,
    ).run(studentId, classId, nhanXet, p.userId, now);
    writeAudit({
      actorUserId: p.userId, action: 'dau_ra.ghi', entityType: 'student', entityId: studentId, entityLabel: `lop:${c.id}`,
      before: cu ? { nhanXet: cu.nhan_xet, deXuat: cu.de_xuat } : null, after: { nhanXet, deXuat, lop: c.code },
    });
    return { nhanXet, deXuat, doi: true, luc: now };
  });
}

/** `HH:MM dd/mm` giờ Việt Nam — câu 409. */
const gioNgay = (iso: string | null | undefined) => {
  if (!iso) return '—';
  const v = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', hour12: false })
    .formatToParts(new Date(iso)).map((x) => [x.type, x.value]));
  return `${v.hour}:${v.minute} ${v.day}/${v.month}`;
};
