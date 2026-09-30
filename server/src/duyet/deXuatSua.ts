/**
 * ĐỀ XUẤT SỬA THÔNG TIN HV (PR-DUYET, T44, K3-40, M-18) — GV của lớp gửi, Quản lý duyệt ở hộp Chờ duyệt.
 *
 * Câu 1 = B (chủ sản phẩm 29/09): GVCN VẪN tự chuyển lớp; chỉ target và lộ trình phải qua đề xuất. "Lớp", "Lịch MT", "Khác" vẫn gửi
 * được (Q6) nhưng Duyệt không tự áp — Quản lý làm ở màn gốc rồi Duyệt, ghi đã làm gì.
 */
import { db, tx } from '../db.ts';
import { badRequest, notFound } from '../util.ts';
import { require_, type Principal } from '../permissions.ts';
import { writeAudit } from '../platform/audit.ts';
import { KCK, PERMISSIONS, laKck } from '../../../shared/domain/index.ts';
import { taoYeuCau } from './yeuCau.ts';

export const TRUONG_DE_XUAT = ['target', 'lo-trinh', 'lich-mt', 'khac'] as const;   // PR-CT: bỏ 'lop' — dùng Đề xuất chuyển lớp
export type TruongDeXuat = (typeof TRUONG_DE_XUAT)[number];
export const NHAN_TRUONG_DE_XUAT: Record<TruongDeXuat, string> = {
  target: 'target', 'lo-trinh': 'lộ trình', 'lich-mt': 'lịch MT', khac: 'thông tin khác',
};
/** Hai trường Duyệt là áp luôn; ba trường còn lại Quản lý tự làm ở màn gốc (Q6). */
export const TRUONG_TU_AP: readonly TruongDeXuat[] = ['target', 'lo-trinh'];
const LY_DO_TOI_THIEU = 15;

/** Lộ trình đang chạy + lớp đang học của em — giá trị "cũ" ghi vào thẻ. */
export function hienTaiCua(conn: any, studentId: number) {
  const cyc = conn.prepare(`SELECT id, target_score, khong_cam_ket, route FROM learning_cycles WHERE student_id = ? AND status = 'active' ORDER BY seq DESC LIMIT 1`)
    .get(studentId) as any;
  const lop = conn.prepare(`SELECT c.code FROM enrollments e JOIN classes c ON c.id = e.class_id WHERE e.student_id = ? AND e.status = 'active'
                              ORDER BY e.id DESC LIMIT 1`).get(studentId) as any;
  return { cycle: cyc ?? null, lop: (lop?.code ?? null) as string | null };
}

export function guiDeXuatSua(p: Principal, studentId: number, body: { truong?: unknown; moi?: unknown; lyDo?: unknown }) {
  const conn = db();
  const hv = conn.prepare('SELECT id, full_name, status, archived_at FROM students WHERE id = ?').get(studentId) as any;
  if (!hv) throw notFound('Không tìm thấy học viên');
  /* GV của lớp em đang học (GVCN hoặc GVBM) — cùng phạm vi "xem hồ sơ" của giáo viên. */
  require_(p, PERMISSIONS.STUDENT_VIEW, { studentId }, 'Chỉ giáo viên của lớp em đang học mới gửi được đề xuất sửa.');
  if (hv.status !== 'active' || hv.archived_at) throw badRequest('Học viên không còn đang học — không gửi đề xuất sửa được.');
  if (body.truong === 'lop') throw badRequest('Dùng Đề xuất chuyển lớp.');   // PR-CT (Q30-1)
  const truong = body.truong as TruongDeXuat;
  if (!(TRUONG_DE_XUAT as readonly string[]).includes(String(truong))) throw badRequest('Chọn thông tin cần sửa.');
  const lyDo = typeof body.lyDo === 'string' ? body.lyDo.trim() : '';
  if (lyDo.length < LY_DO_TOI_THIEU) throw badRequest(`Ghi lý do (ít nhất ${LY_DO_TOI_THIEU} ký tự) để Quản lý có căn cứ duyệt.`);
  const ht = hienTaiCua(conn, studentId);
  let moi: string | number;
  let cu: string | number | null = null;
  if (truong === 'target') {
    /* Q29-1: KCK (không cam kết) là một giá trị Target hợp lệ — lưu chữ 'KCK' trong thẻ. */
    const kck = laKck(body.moi);
    const n = Number(body.moi);
    if (!kck && (body.moi === '' || body.moi == null || !Number.isFinite(n) || n < 0 || n > 9 || Math.round(n * 2) !== n * 2)) {
      throw badRequest('Target mới là một band từ 0 đến 9, bước 0.5 — hoặc KCK (không cam kết).');
    }
    if (!ht.cycle) throw badRequest('Em chưa có lộ trình đang chạy để đổi target.');
    moi = kck ? KCK : n; cu = ht.cycle.khong_cam_ket ? KCK : ht.cycle.target_score ?? null;
    if (cu === moi) throw badRequest('Target mới trùng target hiện tại.');
  } else if (truong === 'lo-trinh') {
    const code = String(body.moi ?? '').trim();
    if (!conn.prepare(`SELECT 1 FROM routes WHERE code = ? AND status = 'active'`).get(code)) throw badRequest('Chọn một lộ trình còn dùng.');
    if (!ht.cycle) throw badRequest('Em chưa có lộ trình đang chạy để đổi.');
    moi = code; cu = ht.cycle.route ?? null;
    if (cu === code) throw badRequest('Lộ trình mới trùng lộ trình hiện tại.');
  } else {
    const chu = String(body.moi ?? '').trim();
    if (chu.length < 2) throw badRequest('Ghi giá trị mới cần sửa.');
    if (chu.length > 200) throw badRequest('Giá trị mới tối đa 200 ký tự.');
    moi = chu; cu = null;
  }
  return tx(() => {
    const id = taoYeuCau(conn, {
      loai: 'sua_thong_tin', doiTuongLoai: `student:${truong}`, doiTuongId: studentId, hocVienId: studentId,
      nguoiXin: p.userId, lyDo, duLieu: { truong, cu, moi },
    });
    if (id === null) throw badRequest(`Đã có một đề xuất sửa ${NHAN_TRUONG_DE_XUAT[truong]} của em đang chờ Quản lý duyệt.`);
    writeAudit({ actorUserId: p.userId, action: 'request.create', entityType: 'yeu_cau_duyet', entityId: id,
      entityLabel: `Đề xuất sửa ${NHAN_TRUONG_DE_XUAT[truong]} · ${hv.full_name}`, after: { truong, cu, moi, lyDo } });
    return { ok: true, id };
  });
}
