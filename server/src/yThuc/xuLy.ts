/**
 * XỬ LÝ Ý THỨC v4 (PR-YT4, §5.4) — thay `measures.ts` của PR-J. GVCN đóng từng vi phạm bằng MỘT trong hai cách:
 *
 *   Ghi nhận          "đã xem, không cần biện pháp" (V4-1, V4-6) — không đẩy bậc, vẫn đếm vào luật ≥ 3. Vi phạm đang BẮT BUỘC thì không
 *                     Ghi nhận được (V4-2).
 *   Xác nhận xử lý    MỘT bước (V4-7): vi phạm · bậc kế tiếp (máy chủ tự tính, client KHÔNG gửi loại) · ngày ≤ hôm nay · người thực hiện
 *                     · mô tả ≥ 10 ký tự · tệp tuỳ chọn (tải sau vào chủ `discipline_measure`). Lưu là `done`.
 *
 * Bậc kế cần QL (WL 3) hoặc hết thang → phải đi đường Đề xuất (thẻ `y_thuc`, `deXuat*` ở cuối file). Bậc không lùi (V4-12): bậc đọc từ
 * `kind` của lần xử lý, xoá vi phạm không xoá lần xử lý. Trạng thái mọi vi phạm đọc qua `trangThaiYThuc()` (một cửa).
 */
import { db, tx } from '../db.ts';
import {
  NGOAI_THANG, PERMISSIONS, THANG, VIOLATION_CATEGORY_LABEL, XU_LY_STATUS_LABEL,
  bacCuaLoai, dongThang, duongHoSoHocVien, kindCuaBac, kiemGhiRoKhac, macDinhTick, nhanLoaiXuLy, shortDate,
  type MeasureKind, type TheYeuCauDto, type ViolationCategory,
} from '../../../shared/domain/index.ts';
import { can, require_, type Principal } from '../permissions.ts';
import { badRequest, conflict, forbidden, isIsoDate, notFound, nowIso } from '../util.ts';
import { demoToday } from '../demoConfig.ts';
import { notify, writeAudit } from '../platform/audit.ts';
import { laNguoiHopLe } from '../platform/timNguoi.ts';
import { KEY_TAKEN_MESSAGE, canManageDiscipline, requireManageDiscipline, requireViewStudent } from './access.ts';
import { ghiPhanHoi, trangThaiYThuc, type EmYThuc } from './trangThai.ts';
import { noteMeasureChange, violationsByIds, type ViolationView } from './violations.ts';
import { dongThoiGian, type DongThoiGianYt } from './board.ts';
import { taoYeuCau, theCuaDoiTuong } from '../duyet/yeuCau.ts';
import { purgeAttachmentsOf, xoaTepSauGiaoDich } from '../platform/attachments.ts';

export const MANAGE_MESSAGE = 'Chỉ giáo viên chủ nhiệm của lớp em đang học hoặc Quản lý trong phạm vi mới xử lý được Ý thức — giáo viên bộ môn chỉ đọc.';
export const MO_TA_MIN = 10;
const KHAI_GHI_CHU_MIN = 3;

const duongXuLy = (sid: number) => `${duongHoSoHocVien(sid, { tab: 'y-thuc' })}&mo=xu-ly`;

function hocVien(studentId: number): { id: number; full_name: string; student_code: string; branch_id: number | null } {
  const s = db().prepare('SELECT id, full_name, student_code, branch_id FROM students WHERE id = ?').get(studentId) as any;
  if (!s) throw notFound('Không tìm thấy học viên');
  return s;
}
const emCua = (studentId: number): EmYThuc => trangThaiYThuc([studentId], demoToday()).get(studentId)!;

/** Quản lý chi nhánh của em (kể cả QL toàn hệ thống) — người nhận "để biết" (K5-16). */
function quanLyCua(studentId: number): number[] {
  return (db().prepare(
    `SELECT DISTINCT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN users u ON u.id = ur.user_id
      WHERE r.key = 'manager' AND ur.status = 'active' AND u.deleted_at IS NULL
        AND (ur.branch_id IS NULL OR ur.branch_id = COALESCE(
          (SELECT c.branch_id FROM enrollments e JOIN classes c ON c.id = e.class_id WHERE e.student_id = ? AND e.status = 'active' ORDER BY e.id DESC LIMIT 1),
          (SELECT branch_id FROM students WHERE id = ?)))`,
  ).all(studentId, studentId) as any[]).map((r) => r.id as number);
}

/** Vi phạm chọn: khử trùng, ≥ 1, đúng em, chưa nằm trong lần xử lý xong / chờ QL / đã duyệt. */
function viPhamChon(em: EmYThuc, ids: unknown): number[] {
  const list = [...new Set((Array.isArray(ids) ? ids : []).map(Number).filter((x) => Number.isInteger(x) && x > 0))];
  if (!list.length) throw badRequest('Chọn ít nhất một vi phạm.');
  for (const id of list) {
    const t = em.viPham.get(id);
    if (!t) throw badRequest('Một vi phạm đã chọn không thuộc học viên này (hoặc đã bị xoá) — mở lại panel.');
    if (t.t === 'da_xu_ly' || t.t === 'cho_duyet') throw badRequest('Một vi phạm đã chọn đã được xử lý hoặc đang chờ QL duyệt — mở lại panel.');
  }
  return list;
}

function nguoiThucHien(p: Principal, v: { performerUserId?: unknown; performerName?: unknown }): { by: number | null; ten: string | null } {
  const ten = String(v.performerName ?? '').trim().slice(0, 120) || null;
  const id = v.performerUserId == null || v.performerUserId === '' ? null : Number(v.performerUserId);
  if (id) {
    if (!laNguoiHopLe(id, 'nhan_vien')) throw badRequest('Người thực hiện phải là nhân viên đang làm việc — người ngoài thì gõ tên.');
    return { by: id, ten: null };
  }
  return ten ? { by: null, ten } : { by: p.userId, ten: null };
}

function ngayThucHien(v: unknown): string {
  if (!isIsoDate(v)) throw badRequest('Chọn ngày thực hiện.');
  if (v > demoToday()) throw badRequest('Ngày thực hiện không được ở tương lai.');
  return v;
}

function moTa(v: unknown): string {
  const s = String(v ?? '').trim();
  if (s.length < MO_TA_MIN) throw badRequest(`Mô tả cần ít nhất ${MO_TA_MIN} ký tự — đã làm gì, với ai.`);
  return s.slice(0, 2000);
}

// ---------------------------------------------------------------- Ghi nhận (V4-1, V4-2, V4-6)

/**
 * PR-Dọn (6f): còn KHAI BẬC Ý thức HS cũ được không — có chuỗi, chưa lần xử lý nào trong chuỗi, chưa khai, không Tạm dừng.
 * Hồ sơ em (`coTheKhai`) và việc "Khai bậc" ở Công việc gọi CHUNG hàm này.
 */
export const khaiDuoc = (em: { chuoi: readonly unknown[]; soXuLyChuoi: number; tungKhai: unknown; tamDung: unknown }): boolean =>
  em.chuoi.length > 0 && em.soXuLyChuoi === 0 && !em.tungKhai && !em.tamDung;

export function ghiNhan(p: Principal, studentId: number, violationIds: unknown): { ok: true; soGhiNhan: number } {
  const hv = hocVien(studentId);
  requireManageDiscipline(p, studentId, MANAGE_MESSAGE);
  const em = emCua(studentId);
  const ids = viPhamChon(em, violationIds);
  for (const id of ids) {
    const t = em.viPham.get(id)!;
    if (t.t === 'can_xu_ly' || t.lyDoQuaHan === 'xu-ly') throw badRequest('Em đang phải xử lý bắt buộc — dùng Xác nhận xử lý.');
  }
  const homNay = demoToday();
  const n = tx(() => {
    const doi = db().prepare(
      `UPDATE violations SET ghi_nhan_luc = ?, ghi_nhan_boi = ? WHERE student_id = ? AND ghi_nhan_luc IS NULL AND id IN (${ids.map(() => '?').join(',')})`,
    ).run(homNay, p.userId, studentId, ...ids).changes as number;
    if (doi) {
      writeAudit({ actorUserId: p.userId, action: 'discipline.acknowledge', entityType: 'student', entityId: studentId,
        entityLabel: `${hv.student_code} · Ghi nhận ${doi} vi phạm`, after: { violationIds: ids } });
    }
    return doi;
  });
  return { ok: true, soGhiNhan: n };
}

// ---------------------------------------------------------------- Xác nhận xử lý một bước (V4-7, V4-8, V4-12)

export type XuLyVao = {
  violationIds?: unknown; performedOn?: unknown; performerUserId?: unknown; performerName?: unknown; note?: unknown;
  idempotencyKey?: string | null;
  /** Bậc hiện tại người dùng đang thấy khi mở panel — lệch với máy chủ → 409 (hai GVCN bấm cùng lúc). */
  bacDaThay?: unknown;
};

/** QL biết các bậc thư cảnh cáo / meeting (K5-16, Q18) — Report 1/2 không báo. */
const BAC_BAO_QL: ReadonlySet<string> = new Set(['wl_1', 'report_4_meeting', 'wl_2']);

export function xacNhanXuLy(p: Principal, studentId: number, v: XuLyVao): XuLyView {
  const hv = hocVien(studentId);
  requireManageDiscipline(p, studentId, MANAGE_MESSAGE);
  const key = v.idempotencyKey?.trim() || null;
  if (key) {
    const seen = db().prepare('SELECT id, student_id, created_by FROM discipline_measures WHERE idempotency_key = ?').get(key) as any;
    if (seen) {
      if (seen.student_id !== studentId || seen.created_by !== p.userId) throw badRequest(KEY_TAKEN_MESSAGE);
      return xemXuLy(p, seen.id);
    }
  }
  const note = moTa(v.note);
  const performedOn = ngayThucHien(v.performedOn);
  const nguoi = nguoiThucHien(p, v);

  const id = tx(() => {
    /* Tính lại TRONG giao dịch (BEGIN IMMEDIATE): bậc là của máy chủ, không tin client. */
    const em = emCua(studentId);
    const ids = viPhamChon(em, v.violationIds);
    if (v.bacDaThay !== undefined && v.bacDaThay !== null && Number(v.bacDaThay) !== em.bac) {
      throw conflict('Bậc đã đổi, mở lại panel.', { bac: em.bac });
    }
    const ke = em.keTiep;
    const info = db().prepare(
      `INSERT INTO discipline_measures (student_id, cycle_id, class_id, kind, status, owner_user_id, note, performed_on, performed_by,
                                        performer_name, confirmed_by, confirmed_at, idempotency_key, created_at, created_by)
       VALUES (?,?,?,?, 'done', ?,?,?,?,?,?,?,?,?,?)`,
    ).run(studentId, em.cycleId, em.lopId, ke.kind, p.userId, note, performedOn, nguoi.by, nguoi.ten, p.userId, nowIso(), key, nowIso(), p.userId);
    const mId = Number(info.lastInsertRowid);
    const link = db().prepare('INSERT INTO measure_violations (measure_id, violation_id, added_by, added_at) VALUES (?,?,?,?)');
    for (const vid of ids) { link.run(mId, vid, p.userId, nowIso()); noteMeasureChange(vid, null, mId, p.userId); }
    ghiPhanHoi(ids);
    writeAudit({ actorUserId: p.userId, action: 'discipline.handle', entityType: 'discipline_measure', entityId: mId,
      entityLabel: `${hv.student_code} · ${nhanLoaiXuLy(ke.kind)}`, after: { kind: ke.kind, bac: ke.bac, violations: ids, performedOn } });
    if (BAC_BAO_QL.has(ke.kind)) {
      for (const uid of quanLyCua(studentId)) {
        if (uid === p.userId) continue;
        notify({ userId: uid, kind: 'discipline_de_biet', title: `Đã xử lý ${nhanLoaiXuLy(ke.kind)} · ${hv.full_name} · để biết`,
          entityType: 'discipline_measure', entityId: mId, dedupKey: `yt-xu-ly:${mId}`, duong: duongHoSoHocVien(studentId, { tab: 'y-thuc' }) });
      }
    }
    return mId;
  });
  return xemXuLy(p, id);
}

// ---------------------------------------------------------------- Khai bậc trước khi dùng web (H5, T27, Q7, Q8)

export function khaiBac(p: Principal, studentId: number, v: { bac?: unknown; thang?: unknown; ghiChu?: unknown }) {
  const hv = hocVien(studentId);
  requireManageDiscipline(p, studentId, MANAGE_MESSAGE);
  const { bac, thang, ghiChu } = kiemKhai(v);
  return tx(() => {
    const em = emCua(studentId);
    if (!em.chuoi.length) throw badRequest('Em chưa có lộ trình — chưa xác nhận cấp bậc vi phạm được.');
    if (em.khai) throw badRequest('Chuỗi này đã xác nhận cấp bậc vi phạm — cần sửa thì nhờ Quản lý.');
    if (em.soXuLyChuoi > 0) throw badRequest('Chuỗi này đã có lần xử lý trên web — không xác nhận cấp bậc nữa.');
    db().prepare(
      `INSERT INTO y_thuc_khai_bac (student_id, chuoi_cycle_id, bac, thang, ghi_chu, khai_boi, khai_luc) VALUES (?,?,?,?,?,?,?)`,
    ).run(studentId, em.chuoi[0], bac, thang, ghiChu, p.userId, demoToday());
    writeAudit({ actorUserId: p.userId, action: 'discipline.declare_level', entityType: 'student', entityId: studentId,
      entityLabel: `${hv.student_code} · cấp bậc ${bac}`, after: { bac, thang, ghiChu, chuoi: em.chuoi[0] } });
    return { ok: true as const, bac };
  });
}

/** Chỉ QL (`request.approve` trong phạm vi em), chỉ khi chuỗi chưa có lần xử lý nào. */
export function suaKhaiBac(p: Principal, studentId: number, v: { bac?: unknown; thang?: unknown; ghiChu?: unknown }) {
  const hv = hocVien(studentId);
  require_(p, PERMISSIONS.REQUEST_APPROVE, { studentId }, 'Chỉ Quản lý sửa được cấp bậc vi phạm đã xác nhận.');
  const { bac, thang, ghiChu } = kiemKhai(v);
  return tx(() => {
    const em = emCua(studentId);
    if (!em.khai) throw badRequest('Chuỗi này chưa xác nhận cấp bậc vi phạm.');
    if (em.soXuLyChuoi > 0) throw badRequest('Chuỗi này đã có lần xử lý trên web — không sửa cấp bậc nữa.');
    db().prepare(`UPDATE y_thuc_khai_bac SET bac = ?, thang = ?, ghi_chu = ?, sua_boi = ?, sua_luc = ? WHERE student_id = ? AND chuoi_cycle_id = ?`)
      .run(bac, thang, ghiChu, p.userId, demoToday(), studentId, em.chuoi[0]);
    writeAudit({ actorUserId: p.userId, action: 'discipline.declare_level_edit', entityType: 'student', entityId: studentId,
      entityLabel: `${hv.student_code} · sửa cấp bậc`, before: { bac: em.khai.bac }, after: { bac, thang, ghiChu } });
    return { ok: true as const, bac };
  });
}

function kiemKhai(v: { bac?: unknown; thang?: unknown; ghiChu?: unknown }) {
  const bac = Number(v.bac);
  /* Khai tối đa bậc 6 (WL 2) — hết mạch chính. ponytail: em đã qua Report 7+ trước khi dùng web thì khai WL 2, tăng dần trên web. */
  if (!Number.isInteger(bac) || bac < 1 || bac > THANG.length) throw badRequest('Chọn bậc đã xử lý: Report 1 … WL 2.');
  const thangStr = String(v.thang ?? '').trim();
  if (thangStr && !/^\d{4}-(0[1-9]|1[0-2])$/.test(thangStr)) throw badRequest('Tháng xử lý không hợp lệ.');
  const ghiChu = String(v.ghiChu ?? '').trim();
  if (ghiChu.length < KHAI_GHI_CHU_MIN) throw badRequest(`Ghi chú cần ít nhất ${KHAI_GHI_CHU_MIN} ký tự — ví dụ "Report 2 tháng 8, cô Hà gửi".`);
  return { bac, thang: thangStr || null, ghiChu: ghiChu.slice(0, 500) };
}

// ---------------------------------------------------------------- Đã thực hiện (sau khi QL duyệt — V4-10)

export function daThucHien(p: Principal, measureId: number, v: { performedOn?: unknown; performerUserId?: unknown; performerName?: unknown; note?: unknown }) {
  const m = db().prepare('SELECT * FROM discipline_measures WHERE id = ?').get(measureId) as any;
  if (!m) throw notFound('Không tìm thấy lần xử lý');
  const hv = hocVien(m.student_id);
  requireManageDiscipline(p, m.student_id, MANAGE_MESSAGE);
  if (m.status !== 'da_duyet') throw badRequest('Chỉ lần xử lý QL đã duyệt mới bấm "Đã thực hiện".');
  const performedOn = ngayThucHien(v.performedOn);
  if (m.quyet_luc && performedOn < String(m.quyet_luc).slice(0, 10)) throw badRequest('Ngày thực hiện phải từ ngày QL duyệt trở đi.');
  const nguoi = nguoiThucHien(p, v);
  const them = String(v.note ?? '').trim();
  tx(() => {
    const doi = db().prepare(
      `UPDATE discipline_measures SET status = 'done', performed_on = ?, performed_by = ?, performer_name = ?, confirmed_by = ?, confirmed_at = ?,
              note = CASE WHEN ? = '' THEN note ELSE COALESCE(note || char(10), '') || ? END, updated_at = ?
        WHERE id = ? AND status = 'da_duyet'`,
    ).run(performedOn, nguoi.by, nguoi.ten, p.userId, nowIso(), them, them, nowIso(), measureId).changes;
    if (!doi) throw conflict('Lần xử lý này vừa được cập nhật — mở lại.');
    writeAudit({ actorUserId: p.userId, action: 'discipline.performed', entityType: 'discipline_measure', entityId: measureId,
      entityLabel: `${hv.student_code} · ${nhanLoaiXuLy(m.kind, m.custom_name)}`, after: { performedOn } });
  });
  return xemXuLy(p, measureId);
}

// ---------------------------------------------------------------- đọc

export type XuLyView = {
  id: number; studentId: number; ten: string; kind: string; nhan: string; customName: string | null;
  status: string; statusLabel: string; bac: number; note: string | null;
  performedOn: string | null; nguoi: string | null; quyetLuc: string | null; createdAt: string;
  viPham: ViolationView[]; soTep: number; canManage: boolean;
  /** Thẻ duyệt mới nhất (đề xuất cần QL) — lý do từ chối nằm ở đây (Q13). */
  the: TheYeuCauDto | null;
};

export function xemXuLy(p: Principal, id: number): XuLyView {
  const m = db().prepare(
    `SELECT m.*, s.full_name AS ten, COALESCE(m.performer_name, pu.full_name) AS nguoi,
            (SELECT COUNT(*) FROM attachments a WHERE a.owner_type = 'discipline_measure' AND a.owner_id = m.id) AS so_tep
       FROM discipline_measures m JOIN students s ON s.id = m.student_id LEFT JOIN users pu ON pu.id = m.performed_by WHERE m.id = ?`,
  ).get(id) as any;
  if (!m) throw notFound('Không tìm thấy lần xử lý');
  requireViewStudent(p, m.student_id);
  const vIds = (db().prepare('SELECT violation_id FROM measure_violations WHERE measure_id = ? ORDER BY violation_id').all(id) as any[]).map((r) => r.violation_id);
  const the = theCuaDoiTuong('discipline_measure', [id])[0] ?? null;
  return {
    id, studentId: m.student_id, ten: m.ten, kind: m.kind, nhan: nhanLoaiXuLy(m.kind, m.custom_name), customName: m.custom_name ?? null,
    status: m.status, statusLabel: (XU_LY_STATUS_LABEL as Record<string, string>)[m.status] ?? m.status, bac: bacCuaLoai(m.kind),
    note: m.note ?? null, performedOn: m.performed_on ?? null, nguoi: m.status === 'done' ? m.nguoi ?? null : null,
    quyetLuc: m.quyet_luc ?? null, createdAt: m.created_at,
    viPham: violationsByIds(vIds), soTep: m.so_tep, canManage: canManageDiscipline(p, m.student_id), the,
  };
}

export type YThucHocVien = {
  studentId: number; ten: string; maHv: string; homNay: string;
  canManage: boolean; canRecord: boolean; canSuaKhai: boolean;
  /** Liên kết "Khai bậc" (Q7, Q8): người xem xử lý được, chuỗi chưa có lần xử lý, em chưa từng khai. */
  coTheKhai: boolean;
  chuoi: { nhan: string; cycleIds: number[]; soXuLy: number };
  bac: number; bacNhan: string | null; keTiep: { kind: string; nhan: string; bac: number; canQl: boolean } | null;
  dongThang: ReturnType<typeof dongThang>;
  khai: EmYThuc['khai'];
  nhom: EmYThuc['nhom']; han: string | null; hanXem: string | null; soBatBuoc: number; soMoi: number; quaHanNgay: number | null;
  deXuat: { id: number; nhan: string; status: 'cho_duyet' | 'da_duyet'; han: string | null; quaHan: boolean } | null;
  /** Đã có thẻ Báo QL đang chờ cho em (thanh cam "đã báo QL"). */
  daBaoQl: boolean;
  phamVi: 'chuoi' | 'tat-ca';
  viPham: ViolationView[];
  macDinh: { tick: number[]; cuHon: number[] };
  dongThoiGian: DongThoiGianYt[];
  /** Dòng chữ cuối (K3 §4f): số vi phạm trong phạm vi, theo nhóm. */
  demCuoi: { tong: number; theoNhom: { nhom: string; so: number }[] };
};

export function yThucHocVien(p: Principal, studentId: number, o: { phamVi?: 'chuoi' | 'tat-ca' } = {}): YThucHocVien {
  const hv = hocVien(studentId);
  requireViewStudent(p, studentId);
  const homNay = demoToday();
  const trang = trangThaiYThuc([studentId], homNay);
  const em = trang.get(studentId)!;
  const phamVi = o.phamVi === 'tat-ca' ? 'tat-ca' : 'chuoi';
  const trongChuoi = (cycleId: number | null) => phamVi === 'tat-ca' || !em.chuoi.length || (cycleId != null && em.chuoi.includes(cycleId));
  const tatCa = violationsByIds(em.dsViPham.map((v) => v.id)).sort((a, b) => b.occurredOn.localeCompare(a.occurredOn) || b.id - a.id);
  /* Vi phạm chưa đóng luôn hiện (kể cả ghi ở chuỗi trước) — việc còn dở không được giấu theo phạm vi. */
  const viPham = tatCa.filter((v) => trongChuoi(v.cycleId) || (v.trangThai !== 'da_xu_ly' && v.trangThai !== 'cho_duyet'));
  const canManage = canManageDiscipline(p, studentId);
  const demNhom = new Map<string, number>();
  for (const v of viPham) demNhom.set(v.category, (demNhom.get(v.category) ?? 0) + 1);
  const daBaoQl = !!db().prepare(
    `SELECT 1 FROM yeu_cau_duyet WHERE loai = 'bao_len_y_thuc' AND doi_tuong_loai = 'hoc_vien_y_thuc' AND doi_tuong_id = ? AND trang_thai = 'cho'`,
  ).get(studentId);
  const quaHan = Math.max(0, ...[...em.viPham.values()].map((t) => t.quaHanNgay ?? 0)) || null;
  return {
    studentId, ten: hv.full_name, maHv: hv.student_code, homNay,
    canManage, canRecord: can(p, PERMISSIONS.VIOLATION_RECORD, { studentId, classId: em.lopId }),
    canSuaKhai: can(p, PERMISSIONS.REQUEST_APPROVE, { studentId }) && !!em.khai?.coTheSua,
    coTheKhai: canManage && khaiDuoc(em),
    chuoi: { nhan: em.nhanChuoi, cycleIds: em.chuoi, soXuLy: em.xuLy.filter((m) => m.status === 'done' && m.cycleId != null && em.chuoi.includes(m.cycleId)).length },
    bac: em.bac, bacNhan: em.bac > 0 ? nhanLoaiXuLy(kindCuaBac(em.bac)) : null,
    keTiep: { kind: em.keTiep.kind, nhan: nhanLoaiXuLy(em.keTiep.kind), bac: em.keTiep.bac, canQl: em.keTiep.canQl },
    dongThang: dongThang(em.bac, em.khai),
    khai: em.khai,
    nhom: em.nhom, han: em.han, hanXem: em.hanXem, soBatBuoc: em.soBatBuoc, soMoi: em.soMoi, quaHanNgay: quaHan,
    deXuat: em.deXuat ? { id: em.deXuat.id, nhan: nhanLoaiXuLy(em.deXuat.kind, em.deXuat.customName), status: em.deXuat.status, han: em.deXuat.han, quaHan: em.deXuat.quaHan } : null,
    daBaoQl, phamVi, viPham,
    macDinh: macDinhTick(viPham.map((v) => ({ id: v.id, t: v.trangThai, occurredOn: v.occurredOn })), homNay),
    dongThoiGian: dongThoiGian([studentId], trang, { chiTrongChuoi: phamVi === 'chuoi' }),
    demCuoi: {
      tong: viPham.length,
      theoNhom: [...demNhom.entries()].sort((a, b) => b[1] - a[1]).map(([k, so]) => ({ nhom: VIOLATION_CATEGORY_LABEL[k as ViolationCategory] ?? k, so })),
    },
  };
}

// ---------------------------------------------------------------- thông báo khi ghi vi phạm (V4-2, V4-5) — gọi từ violations.ts

/**
 * Sau khi ghi một vi phạm (TRONG giao dịch ghi): báo GVCN lớp đang học — trỏ tab Ý thức của em, `?mo=xu-ly`. Dedup theo em + ngày.
 *   · người khác ghi → "Vi phạm mới — {HV} ({nhóm}) · ghi nhận hoặc xử lý trước dd/mm" (V4-5)
 *   · lần ghi làm em thành bắt buộc → "{HV} có 3 vi phạm trong 2 tuần — cần xử lý trước dd/mm" (V4-2)
 */
export function baoKhiGhiViPham(p: Principal, studentId: number, violationId: number, category: string, truocBatBuoc: boolean) {
  const em = emCua(studentId);
  if (!em.gvcnId || em.tamDung || em.gvcnId === p.userId) return;
  const hv = hocVien(studentId);
  const homNay = demoToday();
  const t = em.viPham.get(violationId);
  const sauBatBuoc = em.soBatBuoc > 0;
  if (sauBatBuoc && !truocBatBuoc) {
    notify({ userId: em.gvcnId, kind: 'discipline', title: `Cần xử lý · ${hv.full_name} · 3 vi phạm trong 2 tuần · trước ${shortDate(em.han, homNay)}`,
      entityType: 'student', entityId: studentId, dedupKey: `yt-bat-buoc:${studentId}:${homNay}`, duong: duongXuLy(studentId) });
  } else if (t?.t === 'moi') {
    notify({ userId: em.gvcnId, kind: 'discipline',
      title: `Vi phạm mới · ${hv.full_name} (${VIOLATION_CATEGORY_LABEL[category as ViolationCategory] ?? category}) · ghi nhận hoặc xử lý trước ${shortDate(t.han, homNay)}`,
      entityType: 'student', entityId: studentId, dedupKey: `yt-moi:${studentId}:${homNay}`, duong: duongXuLy(studentId) });
  }
}

/** Em đang bắt buộc xử lý chưa (trước khi ghi thêm) — để chỉ báo "3 vi phạm trong 2 tuần" ở lần ghi làm em bắt buộc. */
export function dangBatBuoc(studentId: number): boolean {
  return emCua(studentId).soBatBuoc > 0;
}

/** Người ghi có phải GVCN lớp em đang học (Q5 — tự Ghi nhận). */
export function laGvcnDangHoc(p: Principal, studentId: number): boolean {
  const em = emCua(studentId);
  return em.gvcnId === p.userId || (!!em.lopId && p.assignments.some((a) => a.isCore && a.classId === em.lopId
    && a.effectiveFrom <= demoToday() && (!a.effectiveTo || a.effectiveTo >= demoToday())));
}


// ---------------------------------------------------------------- Đề xuất QL duyệt (V4-9, V4-10, Q10, Q11, T30) — thẻ `y_thuc`

/**
 * Bước 1: tạo NHÁP (`nhap`, nội bộ, không vào trạng thái) để có chủ cho tệp/liên kết bằng chứng. Loại: WL 3 (bất kỳ lúc nào, không đẩy bậc) ·
 * Meeting CX/GĐCN · Đình chỉ học tạm thời · Khác (tên ≥ 3 ký tự — T30). Mô tả ≥ 10 ký tự.
 */
export function deXuat(p: Principal, studentId: number, v: { kind?: unknown; customName?: unknown; violationIds?: unknown; note?: unknown }) {
  const hv = hocVien(studentId);
  requireManageDiscipline(p, studentId, MANAGE_MESSAGE);
  const kind = String(v.kind ?? '') as MeasureKind;
  const em = emCua(studentId);
  if (!(NGOAI_THANG as readonly string[]).includes(kind)) {
    throw badRequest('Chọn loại cần QL duyệt: WL 3 · Meeting CX/GĐCN · Đình chỉ học tạm thời · Khác.');
  }
  let customName: string | null = null;
  if (kind === 'other') {
    customName = String(v.customName ?? '').trim();
    const loi = kiemGhiRoKhac(customName);
    if (loi) throw badRequest(`Loại "Khác": ${loi}.`);
    customName = customName.slice(0, 120);
  }
  const note = moTa(v.note);
  const ids = viPhamChon(em, v.violationIds);
  return tx(() => {
    const info = db().prepare(
      `INSERT INTO discipline_measures (student_id, cycle_id, class_id, kind, custom_name, status, owner_user_id, note, created_at, created_by)
       VALUES (?,?,?,?,?, 'nhap', ?,?,?,?)`,
    ).run(studentId, em.cycleId, em.lopId, kind, customName, p.userId, note, nowIso(), p.userId);
    const id = Number(info.lastInsertRowid);
    const link = db().prepare('INSERT INTO measure_violations (measure_id, violation_id, added_by, added_at) VALUES (?,?,?,?)');
    for (const vid of ids) link.run(id, vid, p.userId, nowIso());
    writeAudit({ actorUserId: p.userId, action: 'discipline.propose', entityType: 'discipline_measure', entityId: id,
      entityLabel: `${hv.student_code} · nháp ${nhanLoaiXuLy(kind, customName)}`, after: { kind, violations: ids } });
    return { id, kind, nhan: nhanLoaiXuLy(kind, customName) };
  });
}

/**
 * Bước 2: GỬI — cần ≥ 1 tệp/liên kết (V4-10). TRONG MỘT giao dịch: nháp → `cho_duyet` + thẻ `y_thuc` (bằng chứng = id tệp,
 * `duLieu` = loại + bậc kế lúc gửi để thẻ nói "bậc kế tiếp đang là …" — M-11). Hạn duyệt 5 ngày (mặc định của loại).
 */
export function guiDeXuat(p: Principal, measureId: number) {
  const m = db().prepare('SELECT * FROM discipline_measures WHERE id = ?').get(measureId) as any;
  if (!m) throw notFound('Không tìm thấy đề xuất');
  const hv = hocVien(m.student_id);
  requireManageDiscipline(p, m.student_id, MANAGE_MESSAGE);
  if (m.status !== 'nhap') throw badRequest('Đề xuất này đã gửi rồi.');
  const tep = (db().prepare(`SELECT id FROM attachments WHERE owner_type = 'discipline_measure' AND owner_id = ? ORDER BY id`).all(measureId) as any[]).map((r) => r.id as number);
  if (!tep.length) throw badRequest('Cần đính kèm tệp hoặc liên kết làm bằng chứng trước khi gửi QL.');
  tx(() => {
    const em = emCua(m.student_id);
    const vIds = (db().prepare('SELECT violation_id FROM measure_violations WHERE measure_id = ?').all(measureId) as any[]).map((r) => r.violation_id);
    viPhamChon(em, vIds);
    const doi = db().prepare(`UPDATE discipline_measures SET status = 'cho_duyet', updated_at = ? WHERE id = ? AND status = 'nhap'`).run(nowIso(), measureId).changes;
    if (!doi) throw conflict('Đề xuất này vừa được gửi — mở lại.');
    ghiPhanHoi(vIds);
    const ngoaiThang = (NGOAI_THANG as readonly string[]).includes(m.kind);
    taoYeuCau(db(), {
      loai: 'y_thuc', doiTuongLoai: 'discipline_measure', doiTuongId: measureId, hocVienId: m.student_id, lopId: em.lopId,
      nguoiXin: p.userId, lyDo: m.note, bangChung: tep,
      duLieu: { kind: m.kind, customName: m.custom_name ?? null, bacKe: ngoaiThang ? nhanLoaiXuLy(em.keTiep.kind) : null, soViPham: vIds.length, soTep: tep.length },
    });
    writeAudit({ actorUserId: p.userId, action: 'discipline.propose', entityType: 'discipline_measure', entityId: measureId,
      entityLabel: `${hv.student_code} · gửi QL ${nhanLoaiXuLy(m.kind, m.custom_name)}`, after: { bangChung: tep } });
  });
  return xemXuLy(p, measureId);
}

/** Đóng panel giữa chừng: xoá NHÁP (chỉ `nhap`). Tệp trong kho xoá SAU khi giao dịch chốt. ponytail: nháp bỏ dở (đóng tab) không dọn tự động. */
export function xoaNhap(p: Principal, measureId: number): { ok: true } {
  const m = db().prepare('SELECT id, student_id, status FROM discipline_measures WHERE id = ?').get(measureId) as any;
  if (!m) throw notFound('Không tìm thấy đề xuất');
  requireManageDiscipline(p, m.student_id, MANAGE_MESSAGE);
  if (m.status !== 'nhap') throw badRequest('Chỉ xoá được đề xuất chưa gửi.');
  const khoaTep: string[] = [];
  tx(() => {
    purgeAttachmentsOf('discipline_measure', measureId, p.userId, khoaTep);
    db().prepare('DELETE FROM measure_violations WHERE measure_id = ?').run(measureId);
    db().prepare(`DELETE FROM discipline_measures WHERE id = ? AND status = 'nhap'`).run(measureId);
  });
  xoaTepSauGiaoDich(khoaTep);
  return { ok: true };
}
