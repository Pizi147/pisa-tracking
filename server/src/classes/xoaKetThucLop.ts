/**
 * ⋮ HỒ SƠ LỚP › XOÁ LỚP / KẾT THÚC LỚP (PR-UX3, chủ sản phẩm chốt 24/09) — CHỈ Quản trị hệ thống, kiểm ở MÁY CHỦ bằng `admin.config`
 * (Quản lý chi nhánh và giáo viên gọi API đều nhận 403, không chỉ bị ẩn nút).
 *
 *   Xoá lớp      chỉ lớp CHƯA có dữ liệu nào: chưa học viên nào từng ghi danh, chưa lượt Test / điểm, chưa vi phạm hay phương án xử lý,
 *                chưa công việc, tín hiệu, ước lượng, lộ trình tiếp theo gắn lớp, và không lớp nào học tiếp từ nó. Xoá hẳn trong MỘT
 *                giao dịch (phân công GV, kỹ năng lớp, dòng lớp) + `audit_logs`. Phải gõ lại đúng mã lớp.
 *   Kết thúc lớp cho lớp đã có dữ liệu: còn học viên đang học thì CHẶN; không còn ai thì `status = 'finished'`, `finished_at` = hôm nay
 *                (cùng luật lớp tự kết thúc của PR-LT), lớp vào khu Lưu trữ (chỉ xem) + `audit_logs`.
 */
import { db, tx } from '../db.ts';
import { CHU_CHUYEN_LOP, PERMISSIONS, tuanLich } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest, notFound } from '../util.ts';
import { require_, type Principal } from '../permissions.ts';
import { writeAudit } from '../platform/audit.ts';

const CHI_ADMIN = 'Chỉ Quản trị hệ thống mới xoá hoặc kết thúc được lớp.';

/** Bảng có cột `class_id` mà một dòng ở đó nghĩa là "lớp đã có dữ liệu" (`teacher_assignments`, `class_skills` là cấu hình, không tính). */
const BANG_DU_LIEU: [string, string][] = [
  ['assessment_attempts', 'lượt Test'], ['case_signals', 'Case chờ xác nhận nguyên nhân'], ['teacher_estimates', 'ước lượng của giáo viên'],
  ['tasks', 'công việc'], ['violations', 'vi phạm'], ['discipline_measures', 'lần xử lý vi phạm'],
];

function docLop(classId: number) {
  const c = db().prepare(
    `SELECT c.id, c.code, c.status, c.finished_at, c.is_fast_track, b.name AS branch_name
       FROM classes c JOIN branches b ON b.id = c.branch_id WHERE c.id = ?`,
  ).get(classId) as { id: number; code: string; status: string; finished_at: string | null; is_fast_track: number; branch_name: string } | undefined;
  if (!c) throw notFound('Không tìm thấy lớp');
  return c;
}

/** Số học viên từng ghi danh / đang học và những thứ đang gắn lớp — một lần đếm cho cả hai việc. */
export function tinhTrangLop(classId: number) {
  const conn = db();
  const dem = (sql: string, ...a: unknown[]) => (conn.prepare(sql).get(...a) as { n: number }).n;
  const soTungGhiDanh = dem('SELECT COUNT(*) n FROM enrollments WHERE class_id = ?', classId);
  const soDangHoc = dem(`SELECT COUNT(*) n FROM enrollments WHERE class_id = ? AND status = 'active'`, classId);
  const gan: string[] = [];
  for (const [bang, nhan] of BANG_DU_LIEU) {
    const n = dem(`SELECT COUNT(*) n FROM ${bang} WHERE class_id = ?`, classId);
    if (n > 0) gan.push(`${n} ${nhan}`);
  }
  const nLoTrinh = dem('SELECT COUNT(*) n FROM lo_trinh_tiep_theo WHERE class_id = ? OR lop_du_kien_id = ?', classId, classId);
  if (nLoTrinh > 0) gan.push(`${nLoTrinh} lộ trình tiếp theo`);
  const nLenh = dem('SELECT COUNT(*) n FROM lenh_chuyen_lop WHERE lop_nguon_id = ? OR lop_dich_id = ?', classId, classId);
  if (nLenh > 0) gan.push(`${nLenh} quyết định chuyển lớp`);
  const nHocTiep = dem('SELECT COUNT(*) n FROM classes WHERE previous_class_id = ?', classId);
  if (nHocTiep > 0) gan.push(`${nHocTiep} lớp học tiếp từ lớp này`);
  /* PR-LT2b (K2-35): việc còn treo — KHÔNG chặn Kết thúc lớp, chỉ nói ra: Mini Test của em từ lớp này chưa ghi. */
  const nMiniTest = dem(`SELECT COUNT(*) n FROM mini_test m JOIN assessment_attempts a ON a.id = m.tu_attempt_id WHERE a.class_id = ? AND m.ty_le IS NULL`, classId);
  /* K2-35: quyết định chuyển lớp CHƯA tới tuần chuyển — nói ra cùng chỗ (chữ chuyển lớp một nguồn `CHU_CHUYEN_LOP`, tuần là mã tuần). */
  const cho = conn.prepare(`SELECT COUNT(*) n, MIN(tuan_bat_dau) tu FROM lenh_chuyen_lop WHERE lop_nguon_id = ? AND trang_thai = 'cho'`).get(classId) as { n: number; tu: string | null };
  const treo = [
    nMiniTest > 0 ? `${nMiniTest} Mini Test chưa ghi` : null,
    cho.n > 0 && cho.tu ? `${CHU_CHUYEN_LOP.sapChuyen(tuanLich(cho.tu, demoToday()))} (${cho.n} em)` : null,
  ].filter(Boolean);
  return { soTungGhiDanh, soDangHoc, gan, coDuLieu: soTungGhiDanh > 0 || gan.length > 0, conTreo: treo.length ? `Còn treo: ${treo.join(' · ')}` : null };
}

/** Câu chặn Kết thúc lớp khi còn em đang học — nói đúng việc phải làm theo loại lớp (K2-35): FT chuyển từng em, lớp thường ra MỘT quyết định cho cả lớp. */
function lyDoConEm(c: { is_fast_track: number }, soDangHoc: number): string {
  return `Còn ${soDangHoc} học viên đang học — ${c.is_fast_track ? 'chuyển lớp từng em hoặc chuyển nhiều em' : `${CHU_CHUYEN_LOP.quyetDinh} cho cả lớp`} trước.`;
}

/** GET /classes/:id/xoa-ket-thuc — cho panel biết nên hiện nút nào và vì sao. Chỉ Quản trị hệ thống. */
export function xemXoaKetThuc(p: Principal, classId: number) {
  require_(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }, CHI_ADMIN);
  const c = docLop(classId);
  const t = tinhTrangLop(classId);
  const daKetThuc = c.status === 'finished';
  return {
    id: c.id, ma: c.code, chiNhanh: c.branch_name, daKetThuc,
    soDangHoc: t.soDangHoc, soTungGhiDanh: t.soTungGhiDanh, coDuLieu: t.coDuLieu, dangGan: t.gan, conTreo: t.conTreo,
    /** Xoá: chỉ lớp trống hẳn. Kết thúc: lớp còn hoạt động và không còn học viên đang học. */
    coTheXoa: !t.coDuLieu,
    coTheKetThuc: !daKetThuc && t.soDangHoc === 0,
    lyDoChanKetThuc: daKetThuc ? 'Lớp đã kết thúc.'
      : t.soDangHoc > 0 ? lyDoConEm(c, t.soDangHoc) : null,
  };
}

/** POST /classes/:id/xoa { maLop } — xoá hẳn lớp còn trống. */
export function xoaLop(p: Principal, classId: number, input: { maLop?: unknown }) {
  require_(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }, CHI_ADMIN);
  const c = docLop(classId);
  const t = tinhTrangLop(classId);
  if (t.coDuLieu) throw badRequest('Lớp đã có dữ liệu — dùng Kết thúc lớp.');
  if (String(input.maLop ?? '').trim() !== c.code) throw badRequest('Gõ lại đúng mã lớp để xác nhận xoá.');
  const conn = db();
  tx(() => {
    conn.prepare('DELETE FROM teacher_assignments WHERE class_id = ?').run(classId);
    conn.prepare('DELETE FROM class_skills WHERE class_id = ?').run(classId);
    conn.prepare('DELETE FROM classes WHERE id = ?').run(classId);
    writeAudit({
      actorUserId: p.userId, action: 'class.delete', entityType: 'class', entityId: classId, entityLabel: c.code,
      before: { code: c.code, branch: c.branch_name, status: c.status }, after: null,
    });
  });
  return { ok: true, ma: c.code };
}

/** POST /classes/:id/ket-thuc — kết thúc lớp không còn học viên đang học; lớp vào khu Lưu trữ. */
export function ketThucLop(p: Principal, classId: number) {
  require_(p, PERMISSIONS.ADMIN_CONFIG, { anyScope: true }, CHI_ADMIN);
  const c = docLop(classId);
  if (c.status === 'finished') throw badRequest('Lớp đã kết thúc.');
  const t = tinhTrangLop(classId);
  if (t.soDangHoc > 0) {
    throw badRequest(lyDoConEm(c, t.soDangHoc));
  }
  const ngay = demoToday();
  const conn = db();
  tx(() => {
    conn.prepare(`UPDATE classes SET status = 'finished', finished_at = ? WHERE id = ?`).run(ngay, classId);
    writeAudit({
      actorUserId: p.userId, action: 'class.finished', entityType: 'class', entityId: classId, entityLabel: c.code,
      before: { status: c.status }, after: { status: 'finished', on: ngay, by: 'system_admin' },
    });
  });
  return { ok: true, ma: c.code, finishedAt: ngay };
}
