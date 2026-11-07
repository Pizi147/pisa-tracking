/**
 * MỞ SỬA LỊCH TEST (chủ SP 06/11) — công tắc CHỈ Quản trị hệ thống bật / tắt, lưu một dòng `demo_config` (`mo_sua_lich_test`, JSON).
 *
 * BẬT: GVCN (lớp mình chủ nhiệm), Admin và Quản lý (trong phạm vi chi nhánh của vai — `PLAN_WEEK`) sửa được lịch Test + Kế hoạch Test như
 * Quản lý (xếp, dời, huỷ lịch, khôi phục, gồm MT0 / S Ex) VÀ bỏ qua khoá cuối tuần N15. Mọi luật khác giữ (chặn vượt lượt, nhật ký, lý do tuỳ chọn…).
 * TẮT: N15, N23 nguyên vẹn. Công tắc KHÔNG cấp thêm quyền sửa điểm / quyền khác của `PLAN_WEEK` — chỉ các đường ghi lịch Test gọi hàm ở đây.
 *
 * Đọc Turso: `getConfig` đã đi qua bộ nhớ request + bộ nhớ tham chiếu (bảng `demo_config` có trigger phiên bản) — tắt thì 0 câu thêm.
 */
import { getConfig, setConfig } from '../demoConfig.ts';
import { nhoCaRequest, quenNhoCaRequest } from './nguCanhRequest.ts';
import { db, tx } from '../db.ts';
import { PERMISSIONS } from '../../../shared/domain/index.ts';
import { can, isCoreTeacherOf, require_, type Ctx, type Principal } from '../permissions.ts';
import { badRequest, nowIso } from '../util.ts';
import { writeAudit } from './audit.ts';

export const KHOA_MO_SUA_LICH_TEST = 'mo_sua_lich_test';

export type TrangThaiMoSua = { bat: boolean; nguoi: string | null; luc: string | null };

/** Trạng thái hiện tại (chưa từng bật → tắt). Dữ liệu hỏng → tắt (an toàn: về luật N15 / N23). */
export const trangThaiMoSua = (): TrangThaiMoSua => nhoCaRequest(KHOA_MO_SUA_LICH_TEST, docTrangThai);
function docTrangThai(): TrangThaiMoSua {
  try {
    const v = JSON.parse(getConfig(KHOA_MO_SUA_LICH_TEST) || 'null');
    if (v && v.bat === true) return { bat: true, nguoi: typeof v.nguoi === 'string' ? v.nguoi : null, luc: typeof v.luc === 'string' ? v.luc : null };
  } catch { /* hỏng → tắt */ }
  return { bat: false, nguoi: null, luc: null };
}
export const dangMoSuaLichTest = () => trangThaiMoSua().bat;

/** GVCN (phân công chủ nhiệm hiệu lực) của lớp trong ngữ cảnh; chỉ có `studentId` → lớp em đang học (active / paused). */
function laGvcnCua(p: Principal, ctx: Ctx): boolean {
  if (!p.assignments.some((a) => a.isCore)) return false;
  if (ctx.classId) return isCoreTeacherOf(p, ctx.classId);
  if (!ctx.studentId) return false;
  const lop = db().prepare(`SELECT class_id FROM enrollments WHERE student_id = ? AND status IN ('active', 'paused')`).all(ctx.studentId) as { class_id: number }[];
  return lop.some((l) => isCoreTeacherOf(p, l.class_id));
}

/**
 * Sửa được lịch Test của lớp / em trong `ctx`: Quản lý / Admin / Quản trị (`PLAN_WEEK` theo chi nhánh) như cũ; GVCN lớp đó chỉ khi công tắc BẬT.
 * Không phân quyền cho GV bộ môn, Admin / QL ngoài chi nhánh.
 */
export function choSuaLichTest(p: Principal, ctx: Ctx): boolean {
  return can(p, PERMISSIONS.PLAN_WEEK, ctx) || (dangMoSuaLichTest() && laGvcnCua(p, ctx));
}

/** Huỷ / khôi phục lượt: `ATTEMPT_CANCEL` như cũ; công tắc BẬT thì thêm người sửa được lịch Test (Admin, GVCN lớp đó). */
export function choHuyKhoiPhucLichTest(p: Principal, ctx: Ctx): boolean {
  return can(p, PERMISSIONS.ATTEMPT_CANCEL, ctx) || (dangMoSuaLichTest() && choSuaLichTest(p, ctx));
}

/** `require_` của đường ghi lịch Test (thay `require_(PLAN_WEEK)`). */
export function requireSuaLichTest(p: Principal, ctx: Ctx, message: string): void {
  if (choSuaLichTest(p, ctx)) return;
  require_(p, PERMISSIONS.PLAN_WEEK, ctx, message);   // ném 403 kèm gợi ý như cũ
}

/**
 * Miễn khoá cuối tuần N15 cho người này ở lớp / em này: vai GỐC Quản trị hệ thống (như cũ), hoặc công tắc BẬT và người này sửa được lịch Test ở đó.
 * Gọi SAU kiểm quyền ghi — không thay kiểm quyền.
 */
/**
 * RKC (chủ SP 07/11 "không chặn cứng" — PTA: luật đã chốt GIỮ cho GV, QL / Admin VƯỢT được kèm xác nhận): người có `plan.week` ở lớp / em đó đổi lịch MT
 * cuối tuần được sau một câu hỏi (`chanCuoiTuan`). Màn xem trước không vẽ "khoá" cho họ.
 */
export function vuotKhoaCuoiTuan(p: Principal, ctx: Ctx): boolean {
  return can(p, PERMISSIONS.PLAN_WEEK, ctx);
}

export function boKhoaCuoiTuan(p: Principal, ctx: Ctx): boolean {
  if ((p.vaiGoc ?? p.roleKeys).includes('system_admin')) return true;
  return dangMoSuaLichTest() && choSuaLichTest(p, ctx);
}

/** GET /admin/mo-sua-lich-test — chỉ Quản trị hệ thống. */
export function xemMoSua(p: Principal): TrangThaiMoSua {
  require_(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }, 'Chỉ Quản trị hệ thống xem được công tắc này.');
  return trangThaiMoSua();
}

/** PUT /admin/mo-sua-lich-test { bat } — chỉ Quản trị hệ thống (403 vai khác). Đổi trạng thái mới ghi + nhật ký; trùng trạng thái thì không làm gì. */
export function datMoSua(p: Principal, bat: unknown): TrangThaiMoSua {
  require_(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }, 'Chỉ Quản trị hệ thống bật / tắt được "Mở sửa lịch Test".');
  if (typeof bat !== 'boolean') throw badRequest('Thiếu giá trị bật / tắt.');
  return tx(() => {
    if (trangThaiMoSua().bat === bat) return trangThaiMoSua();
    const luc = nowIso();
    const ten = (db().prepare('SELECT full_name FROM users WHERE id = ?').get(p.userId) as { full_name: string } | undefined)?.full_name ?? null;
    setConfig(KHOA_MO_SUA_LICH_TEST, JSON.stringify({ bat, nguoi: ten, luc }));
    writeAudit({
      actorUserId: p.userId, action: bat ? 'mo_sua_lich_test.bat' : 'mo_sua_lich_test.tat', entityType: 'cai_dat', entityId: null,
      entityLabel: 'Mở sửa lịch Test', before: { bat: !bat }, after: { bat },
    });
    quenNhoCaRequest(KHOA_MO_SUA_LICH_TEST);
    return { bat, nguoi: ten, luc };
  });
}
