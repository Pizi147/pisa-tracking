/**
 * ĐỀ XUẤT SỬA THÔNG TIN HV (PR-DUYET, T44, K3-40, M-18) — GV của lớp gửi, Quản lý duyệt ở hộp Chờ duyệt.
 *
 * Câu 1 = B (chủ sản phẩm 29/09): GVCN VẪN tự chuyển lớp; chỉ target và lộ trình phải qua đề xuất. "Khác" vẫn gửi
 * được (Q6; "Lớp" có luồng riêng, "Lịch MT" bỏ từ 09/10 — thẻ cũ vẫn hiện để Quản lý đóng) nhưng Duyệt không tự áp — Quản lý làm ở màn gốc rồi Duyệt, ghi đã làm gì.
 */
import { db, tx } from '../db.ts';
import { badRequest, notFound } from '../util.ts';
import { require_, type Principal } from '../permissions.ts';
import { writeAudit } from '../platform/audit.ts';
import { PERMISSIONS, TRUONG_DE_XUAT, chuTargetKck, tachKck, type TruongDeXuat } from '../../../shared/domain/index.ts';
import { taoYeuCau } from './yeuCau.ts';

export const NHAN_TRUONG_DE_XUAT: Record<TruongDeXuat, string> = {
  target: 'target', 'lo-trinh': 'lộ trình', 'lich-mt': 'lịch MT', khac: 'thông tin khác',
};
/** Hai trường Duyệt là áp luôn; ba trường còn lại Quản lý tự làm ở màn gốc (Q6). */
export const TRUONG_TU_AP: readonly TruongDeXuat[] = ['target', 'lo-trinh'];

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
  if (truong === 'lich-mt') throw badRequest('Lịch Test do Quản lý xử lý — không gửi đề xuất.');   // luật 09/10; thẻ cũ vẫn hiện để đóng
  if (!(TRUONG_DE_XUAT as readonly string[]).includes(String(truong))) throw badRequest('Chọn thông tin cần sửa.');
  const lyDo = lyDoDeXuat(body.lyDo);
  const { cu, moi } = kiemGiaTriDeXuat(conn, studentId, truong, body.moi);
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

export function lyDoDeXuat(v: unknown): string {
  const lyDo = typeof v === 'string' ? v.trim() : '';
  if (!lyDo) throw badRequest('Ghi lý do để Quản lý có căn cứ duyệt.');   // T7 (PR-MTa): không tối thiểu ký tự
  return lyDo;
}

/** Giá trị mới của một trường đề xuất + giá trị cũ ghi vào thẻ — dùng chung lúc gửi và lúc người gửi Sửa (OV-7a). */
export function kiemGiaTriDeXuat(conn: any, studentId: number, truong: TruongDeXuat, moiVao: unknown): { cu: string | number | null; moi: string | number } {
  const ht = hienTaiCua(conn, studentId);
  let moi: string | number;
  let cu: string | number | null = null;
  if (truong === 'target') {
    /* Q29-1 + OV-9: KCK là dấu riêng, Target giữ — thẻ lưu "6.5 KCK" / "KCK" (chưa có Target) / số. */
    const { so, kck } = tachKck(moiVao);
    const coSo = so !== '' && so != null;
    const n = Number(so);
    if ((!kck || coSo) && (!coSo || !Number.isFinite(n) || n < 0 || n > 9 || Math.round(n * 2) !== n * 2)) {
      throw badRequest('Target mới là một band từ 0 đến 9, bước 0.5 — thêm KCK nếu không cam kết.');
    }
    if (!ht.cycle) throw badRequest('Em chưa có lộ trình đang chạy để đổi Target.');
    moi = kck ? chuTargetKck(coSo ? n : null, true) : n;
    cu = ht.cycle.khong_cam_ket ? chuTargetKck(ht.cycle.target_score ?? null, true) : ht.cycle.target_score ?? null;
    if (cu === moi) throw badRequest('Target mới trùng Target hiện tại.');
  } else if (truong === 'lo-trinh') {
    const code = String(moiVao ?? '').trim();
    if (!conn.prepare(`SELECT 1 FROM routes WHERE code = ? AND status = 'active'`).get(code)) throw badRequest('Chọn một lộ trình còn dùng.');
    if (!ht.cycle) throw badRequest('Em chưa có lộ trình đang chạy để đổi.');
    moi = code; cu = ht.cycle.route ?? null;
    if (cu === code) throw badRequest('Lộ trình mới trùng lộ trình hiện tại.');
  } else {
    const chu = String(moiVao ?? '').trim();
    if (chu.length < 2) throw badRequest('Ghi giá trị mới cần sửa.');
    if (chu.length > 200) throw badRequest('Giá trị mới tối đa 200 ký tự.');
    moi = chu; cu = null;
  }
  return { cu, moi };
}
