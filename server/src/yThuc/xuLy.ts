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
 * LUAT-5 (luật 5, 21/10): lần xử lý đã lưu KHÔNG xoá — "Thu hồi…" kèm lý do (GVCN gửi QL duyệt, QL làm thẳng) → `thu_hoi` giữ dòng; xử lý không
 * tăng bậc = Đề xuất với bậc ≤ bậc hiện tại. Không Hoàn tác sau lưu (02 4.7 B15): bấm nhầm cũng gửi Thu hồi.
 */
import { db, tx } from '../db.ts';
import {
  NGOAI_THANG, PERMISSIONS, THANG, VIOLATION_CATEGORY_LABEL, XU_LY_STATUS_LABEL,
  bacCuaLoai, bacHienTai, dongThang, duongHoSoHocVien, kindCuaBac, kiemGhiRoKhac, macDinhTick, nhanLoaiXuLy, shortDate,
  type MeasureKind, type TheYeuCauDto, type ViolationCategory,
} from '../../../shared/domain/index.ts';
import { can, require_, type Principal } from '../permissions.ts';
import { badRequest, chuTuDo, conflict, forbidden, isIsoDate, notFound, nowIso } from '../util.ts';
import { demoToday } from '../demoConfig.ts';
import { notify, writeAudit } from '../platform/audit.ts';
import { laNguoiHopLe } from '../platform/timNguoi.ts';
import { KEY_TAKEN_MESSAGE, canManageDiscipline, requireManageDiscipline, requireViewStudent } from './access.ts';
import { chotHanXuLy, ghiPhanHoi, trangThaiYThuc, type EmYThuc } from './trangThai.ts';
import { noteMeasureChange, violationsByIds, type ViolationView } from './violations.ts';
import { dongThoiGian, hangCuaEm, type DongEm, type DongThoiGianYt } from './board.ts';
import { chotYeuCau, taoYeuCau, theCuaDoiTuong } from '../duyet/yeuCau.ts';
import { purgeAttachmentsOf, xoaTepSauGiaoDich } from '../platform/attachments.ts';
import { dongViecTheoXuLy, moLaiViecTheoXuLy, sinhViecBaoPh } from './baoPhTvv.ts';

export const MANAGE_MESSAGE = 'Chỉ giáo viên chủ nhiệm của lớp em đang học hoặc Quản lý trong phạm vi mới xử lý được Ý thức — giáo viên bộ môn chỉ đọc.';
export const MO_TA_MIN = 10;

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

export function nguoiThucHien(p: Principal, v: { performerUserId?: unknown; performerName?: unknown }): { by: number | null; ten: string | null } {
  const ten = String(v.performerName ?? '').trim().slice(0, 120) || null;
  const id = v.performerUserId == null || v.performerUserId === '' ? null : Number(v.performerUserId);
  if (id) {
    if (!laNguoiHopLe(id, 'nhan_vien')) throw badRequest('Người thực hiện phải là nhân viên đang làm việc — người ngoài thì gõ tên.');
    return { by: id, ten: null };
  }
  return ten ? { by: null, ten } : { by: p.userId, ten: null };
}

export function ngayThucHien(v: unknown): string {
  if (!isIsoDate(v)) throw badRequest('Chọn ngày thực hiện.');
  if (v > demoToday()) throw badRequest('Ngày thực hiện không được ở tương lai.');
  return v;
}

export function moTa(v: unknown): string {
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
  return { ok: true, soGhiNhan: luuGhiNhan(p, hv, studentId, ids, demoToday()) };
}

/** Phần GHI của Ghi nhận (đã kiểm quyền + vi phạm) — OV-13d lô gọi thẳng, khỏi kiểm lặp từng em. Trả số vi phạm vừa ghi nhận. */
export function luuGhiNhan(p: Principal, hv: { student_code: string }, studentId: number, ids: readonly number[], homNay: string): number {
  return tx(() => {
    const doi = db().prepare(
      `UPDATE violations SET ghi_nhan_luc = ?, ghi_nhan_boi = ? WHERE student_id = ? AND ghi_nhan_luc IS NULL AND id IN (${ids.map(() => '?').join(',')})`,
    ).run(homNay, p.userId, studentId, ...ids).changes as number;
    if (doi) {
      writeAudit({ actorUserId: p.userId, action: 'discipline.acknowledge', entityType: 'student', entityId: studentId,
        entityLabel: `${hv.student_code} · Ghi nhận ${doi} vi phạm`, after: { violationIds: ids } });
    }
    return doi;
  });
}

/** OV-7a: Bỏ ghi nhận bấm nhầm — xoá `ghi_nhan_luc`, vi phạm về Mới (luật trạng thái tự tính lại). Cùng quyền với Ghi nhận. */
export function boGhiNhan(p: Principal, studentId: number, violationIds: unknown): { ok: true; soBo: number } {
  const hv = hocVien(studentId);
  requireManageDiscipline(p, studentId, MANAGE_MESSAGE);
  const ids = [...new Set((Array.isArray(violationIds) ? violationIds : []).map(Number).filter((x) => Number.isInteger(x) && x > 0))];
  if (!ids.length) throw badRequest('Chọn ít nhất một vi phạm.');
  return tx(() => {
    const doi = db().prepare(
      `UPDATE violations SET ghi_nhan_luc = NULL, ghi_nhan_boi = NULL WHERE student_id = ? AND ghi_nhan_luc IS NOT NULL AND id IN (${ids.map(() => '?').join(',')})`,
    ).run(studentId, ...ids).changes as number;
    if (!doi) throw badRequest('Vi phạm đã chọn chưa được ghi nhận — mở lại panel.');
    chotHanXuLy([studentId]);
    writeAudit({ actorUserId: p.userId, action: 'discipline.unacknowledge', entityType: 'student', entityId: studentId,
      entityLabel: `${hv.student_code} · Bỏ ghi nhận ${doi} vi phạm`, before: { ghiNhan: ids }, after: { ghiNhan: [] } });
    return { ok: true as const, soBo: doi };
  });
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
  return xemXuLy(p, luuXuLy(p, hv, studentId, { violationIds: v.violationIds, performedOn, nguoi, note, key, bacDaThay: v.bacDaThay }, demoToday()).id);
}

/**
 * Phần GHI của Xác nhận xử lý — nơi gọi đã kiểm quyền, khoá gửi lại, ngày, người, mô tả. OV-13d: lô gọi thẳng (kiểm quyền theo lớp một lần,
 * không đọc lại lần xử lý vừa ghi) để một em chỉ tốn ~12 câu SQL.
 */
export function luuXuLy(p: Principal, hv: { full_name: string; student_code: string }, studentId: number, v: {
  violationIds: unknown; performedOn: string; nguoi: { by: number | null; ten: string | null }; note: string; key: string | null; bacDaThay?: unknown;
}, homNay: string): { id: number; kind: string } {
  const { performedOn, nguoi, note, key } = v;
  return tx(() => {
    /* Tính lại TRONG giao dịch (BEGIN IMMEDIATE): bậc là của máy chủ, không tin client. */
    const em = trangThaiYThuc([studentId], homNay).get(studentId)!;
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
    ghiPhanHoi(ids, homNay);
    sinhViecBaoPh({ id: mId, studentId, kind: ke.kind }, homNay);   // SV-YT-TVV (luật 1)
    writeAudit({ actorUserId: p.userId, action: 'discipline.handle', entityType: 'discipline_measure', entityId: mId,
      entityLabel: `${hv.student_code} · ${nhanLoaiXuLy(ke.kind)}`, after: { kind: ke.kind, bac: ke.bac, violations: ids, performedOn } });
    if (BAC_BAO_QL.has(ke.kind)) {
      for (const uid of quanLyCua(studentId)) {
        if (uid === p.userId) continue;
        notify({ userId: uid, kind: 'discipline_de_biet', title: `Đã xử lý ${nhanLoaiXuLy(ke.kind)} · ${hv.full_name} · để biết`,
          entityType: 'discipline_measure', entityId: mId, dedupKey: `yt-xu-ly:${mId}`, duong: duongHoSoHocVien(studentId, { tab: 'y-thuc' }) });
      }
    }
    return { id: mId, kind: ke.kind };
  });
}

// ---------------------------------------------------------------- Khai bậc trước khi dùng web (H5, T27, Q7, Q8)

export function khaiBac(p: Principal, studentId: number, v: { bac?: unknown; thang?: unknown; ghiChu?: unknown }) {
  const hv = hocVien(studentId);
  requireManageDiscipline(p, studentId, MANAGE_MESSAGE);
  return luuKhai(p, hv, studentId, kiemKhai(v), demoToday());
}

/** Phần GHI của Xác nhận cấp bậc (đã kiểm quyền) — OV-13d lô gọi thẳng. Luật chuỗi tính lại TRONG giao dịch. */
export function luuKhai(p: Principal, hv: { student_code: string }, studentId: number, k: ReturnType<typeof kiemKhai>, homNay: string) {
  const { bac, thang, ghiChu } = k;
  return tx(() => {
    const em = trangThaiYThuc([studentId], homNay).get(studentId)!;
    if (!em.chuoi.length) throw badRequest('Em chưa có lộ trình — chưa xác nhận cấp bậc vi phạm được.');
    if (em.khai) throw badRequest('Chuỗi này đã xác nhận cấp bậc vi phạm — bấm Sửa để sửa bậc đã khai.');
    if (em.soXuLyChuoi > 0) throw badRequest('Chuỗi này đã có lần xử lý trên web — không xác nhận cấp bậc nữa.');
    db().prepare(
      `INSERT INTO y_thuc_khai_bac (student_id, chuoi_cycle_id, bac, thang, ghi_chu, khai_boi, khai_luc) VALUES (?,?,?,?,?,?,?)`,
    ).run(studentId, em.chuoi[0], bac, thang, ghiChu, p.userId, homNay);
    writeAudit({ actorUserId: p.userId, action: 'discipline.declare_level', entityType: 'student', entityId: studentId,
      entityLabel: `${hv.student_code} · cấp bậc ${bac}`, after: { bac, thang, ghiChu, chuoi: em.chuoi[0] } });
    return { ok: true as const, bac };
  });
}

/**
 * OV-7a: GVCN (người khai) sửa bậc đã khai khi chuỗi chưa có lần xử lý; Quản lý (`request.approve` trong phạm vi em) sửa cả sau khi đã có lần xử lý
 * trên web — bậc / thang tính lại từ bậc mới (`bacHienTai` = max bậc lần xử lý, bậc khai).
 */
export function suaKhaiBac(p: Principal, studentId: number, v: { bac?: unknown; thang?: unknown; ghiChu?: unknown }) {
  const hv = hocVien(studentId);
  const ql = can(p, PERMISSIONS.REQUEST_APPROVE, { studentId });
  if (!ql) requireManageDiscipline(p, studentId, MANAGE_MESSAGE);
  return luuSuaKhai(p, hv, studentId, kiemKhai(v), ql, demoToday());
}

/** Phần GHI của Sửa cấp bậc (đã kiểm quyền; `ql` = người sửa là Quản lý trong phạm vi em) — OV-13d lô gọi thẳng. */
export function luuSuaKhai(p: Principal, hv: { student_code: string }, studentId: number, k: ReturnType<typeof kiemKhai>, ql: boolean, homNay: string,
  /** KHAI-BAC-LO Hoàn tác: `bacCu` = bậc phải còn nguyên (so TRONG giao dịch — lần sửa xen giữa không bị đè); `hoanTac` ghi nhật ký loại hoàn tác. */
  o: { bacCu?: number; hoanTac?: (em: EmYThuc) => void } = {}) {
  const { bac, thang, ghiChu } = k;
  return tx(() => {
    const em = trangThaiYThuc([studentId], homNay).get(studentId)!;
    if (!em.khai) throw badRequest('Chuỗi này chưa xác nhận cấp bậc vi phạm.');
    if (o.bacCu !== undefined && em.khai.bac !== o.bacCu) throw badRequest('Bậc của em đã đổi sau lần lưu này — không hoàn tác em này.');
    o.hoanTac?.(em);
    if (!ql && em.soXuLyChuoi > 0) throw badRequest('Chuỗi này đã có lần xử lý trên web — chỉ Quản lý sửa được cấp bậc đã khai.');
    db().prepare(`UPDATE y_thuc_khai_bac SET bac = ?, thang = ?, ghi_chu = ?, sua_boi = ?, sua_luc = ? WHERE student_id = ? AND chuoi_cycle_id = ?`)
      .run(bac, thang, ghiChu, p.userId, homNay, studentId, em.chuoi[0]);
    writeAudit({ actorUserId: p.userId, action: o.hoanTac ? 'discipline.declare_level_undo' : 'discipline.declare_level_edit', entityType: 'student', entityId: studentId,
      entityLabel: `${hv.student_code} · ${o.hoanTac ? 'hoàn tác cấp bậc' : 'sửa cấp bậc'}`, before: { bac: em.khai.bac }, after: { bac, thang, ghiChu } });
    return { ok: true as const, bac };
  });
}

export function kiemKhai(v: { bac?: unknown; thang?: unknown; ghiChu?: unknown }) {
  const bac = Number(v.bac);
  /* Khai tối đa bậc 6 (WL 2) — hết mạch chính. ponytail: em đã qua Report 7+ trước khi dùng web thì khai WL 2, tăng dần trên web.
     OV-13d (Q5): bậc 0 = "Chưa có xử lý vi phạm" — xác nhận em chưa từng bị xử lý (thoát việc khai bậc, lần kế vẫn Report 1). */
  if (!Number.isInteger(bac) || bac < 0 || bac > THANG.length) throw badRequest('Chọn bậc đã xử lý: Chưa có xử lý vi phạm, Report 1 … WL 2.');
  const thangStr = String(v.thang ?? '').trim();
  if (thangStr && !/^\d{4}-(0[1-9]|1[0-2])$/.test(thangStr)) throw badRequest('Tháng xử lý không hợp lệ.');
  /* KHAI-BAC-LO (chủ SP 28/10): ghi chú TUỲ CHỌN — khai từng em và theo lô; rỗng lưu chuỗi rỗng (cột NOT NULL). */
  const ghiChu = String(v.ghiChu ?? '').trim();
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

/** OV-7a: "Đã thực hiện" bấm nhầm → "Chưa thực hiện": lần xử lý về QL đã duyệt, chờ thực hiện. Ghi chú giữ (không mất chữ); chỉ lần đã qua QL duyệt. */
export function chuaThucHien(p: Principal, measureId: number): XuLyView {
  const m = loadXuLy(measureId);
  const hv = hocVien(m.student_id);
  requireSuaXuLy(p, m);
  if (m.status !== 'done') throw badRequest('Lần xử lý này chưa ghi "Đã thực hiện".');
  if (!m.quyet_luc) throw badRequest('Lần xử lý này không qua QL duyệt — sửa hoặc Xoá lần xử lý.');
  tx(() => {
    const doi = db().prepare(
      `UPDATE discipline_measures SET status = 'da_duyet', performed_on = NULL, performed_by = NULL, performer_name = NULL, confirmed_by = NULL, confirmed_at = NULL,
              updated_at = ? WHERE id = ? AND status = 'done'`,
    ).run(nowIso(), measureId).changes;
    if (!doi) throw conflict('Lần xử lý này vừa được cập nhật — mở lại.');
    chotHanXuLy([m.student_id]);
    writeAudit({ actorUserId: p.userId, action: 'discipline.not_performed', entityType: 'discipline_measure', entityId: measureId,
      entityLabel: `${hv.student_code} · ${nhanLoaiXuLy(m.kind, m.custom_name)} · chưa thực hiện`,
      before: { status: 'done', performedOn: m.performed_on ?? null, performedBy: m.performed_by ?? null, performerName: m.performer_name ?? null }, after: { status: 'da_duyet' } });
  });
  return xemXuLy(p, measureId);
}

/**
 * OV-7a: sửa GHI CHÚ · NGÀY · NGƯỜI THỰC HIỆN của lần xử lý đã xong (cùng quyền Sửa vi phạm — GVCN em + QL). Chỉ trường có gửi mới đổi; kiểm như lúc
 * lưu (mô tả ≥ 10, ngày ≤ hôm nay và từ ngày QL duyệt). Nhật ký trước → sau. Bậc không đổi (đọc từ loại) — hạn xử lý chốt lại như Sửa vi phạm.
 */
export function suaXuLy(p: Principal, measureId: number, v: { note?: unknown; performedOn?: unknown; performerSelf?: unknown; performerUserId?: unknown; performerName?: unknown }): XuLyView {
  const m = loadXuLy(measureId);
  const hv = hocVien(m.student_id);
  requireSuaXuLy(p, m);
  if (m.status !== 'done') throw badRequest('Chỉ sửa ngày / người / mô tả của lần xử lý đã thực hiện — đề xuất đang chờ thì sửa ở thẻ Chờ duyệt.');
  const note = v.note !== undefined ? moTa(v.note) : m.note;
  const performedOn = v.performedOn !== undefined ? ngayThucHien(v.performedOn) : m.performed_on;
  if (m.quyet_luc && performedOn < String(m.quyet_luc).slice(0, 10)) throw badRequest('Ngày thực hiện phải từ ngày QL duyệt trở đi.');
  const nguoi = v.performerSelf || v.performerUserId !== undefined || v.performerName !== undefined ? nguoiThucHien(p, v) : { by: m.performed_by ?? null, ten: m.performer_name ?? null };
  tx(() => {
    db().prepare('UPDATE discipline_measures SET note = ?, performed_on = ?, performed_by = ?, performer_name = ?, updated_at = ? WHERE id = ?')
      .run(note, performedOn, nguoi.by, nguoi.ten, nowIso(), measureId);
    chotHanXuLy([m.student_id]);
    writeAudit({ actorUserId: p.userId, action: 'discipline.edit_info', entityType: 'discipline_measure', entityId: measureId,
      entityLabel: `${hv.student_code} · sửa ${nhanLoaiXuLy(m.kind, m.custom_name)}`,
      before: { note: m.note ?? null, performedOn: m.performed_on ?? null, performedBy: m.performed_by ?? null, performerName: m.performer_name ?? null },
      after: { note, performedOn, performedBy: nguoi.by, performerName: nguoi.ten } });
  });
  return xemXuLy(p, measureId);
}

// ---------------------------------------------------------------- đọc

export type XuLyView = {
  id: number; studentId: number; ten: string; kind: string; nhan: string; customName: string | null;
  status: string; statusLabel: string; bac: number; note: string | null;
  performedOn: string | null; nguoi: string | null; quyetLuc: string | null; createdAt: string;
  /** OV-7a: điền sẵn ô Người thực hiện khi Sửa — tài khoản (`nguoiId`) hoặc tên ngoài (`nguoiNgoai`). */
  nguoiId: number | null; nguoiNgoai: string | null;
  viPham: ViolationView[]; soTep: number; canManage: boolean;
  /** PR-LUI-a1: Sửa vi phạm (quyền Q5) · LUAT-5: Thu hồi… (lần mới nhất, chưa có thẻ thu hồi chờ) và tên lần xử lý SAU (chặn Thu hồi khi còn). */
  coTheSua: boolean; coTheThuHoi: boolean; lanSau: string | null;
  /** LUAT-5: người xem thu hồi THẲNG được (quyền duyệt của em) — giao diện đọc cờ này, không tự đoán theo vai. */
  thuHoiThang: boolean;
  /** Bậc của em SAU KHI thu hồi lần này (0 = chưa có bậc) — chỉ khi không còn lần sau; hộp hỏi nói "bậc về Report 1". */
  bacVe: number | null;
  /** Vi phạm của em CHƯA nằm trong lần xử lý nào — danh sách thêm của `Sửa vi phạm` (rỗng khi không sửa được). */
  chuaXuLy: ViolationView[];
  /** Thẻ duyệt mới nhất (đề xuất cần QL) — lý do từ chối nằm ở đây (Q13). */
  the: TheYeuCauDto | null;
  /** LUAT-5: thẻ thu hồi mới nhất — chờ / từ chối (lý do) / đã duyệt (ai · lúc · lý do). */
  thuHoi: TheYeuCauDto | null;
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
  const cacThe = theCuaDoiTuong('discipline_measure', [id]);
  const the = cacThe.find((c) => c.loai === 'y_thuc') ?? null;
  const thuHoi = cacThe.find((c) => c.loai === 'thu_hoi_y_thuc') ?? null;
  const coTheSua = quyenSuaXuLy(p, m);
  const em = coTheSua ? emCua(m.student_id) : null;
  const sau = em ? lanSauCua(m, em) : null;
  const bacVe = em && !sau ? bacSauThuHoi(em, id) : null;
  return {
    id, studentId: m.student_id, ten: m.ten, kind: m.kind, nhan: nhanLoaiXuLy(m.kind, m.custom_name), customName: m.custom_name ?? null,
    status: m.status, statusLabel: (XU_LY_STATUS_LABEL as Record<string, string>)[m.status] ?? m.status, bac: bacCuaLoai(m.kind),
    note: m.note ?? null, performedOn: m.performed_on ?? null, nguoi: m.status === 'done' || m.status === 'thu_hoi' ? m.nguoi ?? null : null,
    nguoiId: m.performed_by ?? null, nguoiNgoai: m.performer_name ?? null,
    quyetLuc: m.quyet_luc ?? null, createdAt: m.created_at,
    viPham: violationsByIds(vIds), soTep: m.so_tep, canManage: canManageDiscipline(p, m.student_id) && m.status !== 'thu_hoi', the,
    coTheSua, coTheThuHoi: coTheSua && !sau && THU_HOI_DUOC.has(m.status) && thuHoi?.trangThai !== 'cho',
    lanSau: sau ? nhanLoaiXuLy(sau.kind, sau.custom_name) : null, bacVe, thuHoi,
    thuHoiThang: coTheSua && can(p, PERMISSIONS.REQUEST_APPROVE, { studentId: m.student_id }),
    chuaXuLy: em ? violationsByIds(em.dsViPham.map((v) => v.id).filter((vid) => {
      const t = em.viPham.get(vid);
      return t && t.t !== 'da_xu_ly' && t.t !== 'cho_duyet' && !vIds.includes(vid);
    })) : [],
  };
}

export type YThucHocVien = {
  studentId: number; ten: string; maHv: string; homNay: string;
  canManage: boolean; canRecord: boolean; canSuaKhai: boolean;
  /** Liên kết "Khai bậc" (Q7, Q8): người xem xử lý được, chuỗi chưa có lần xử lý, em chưa từng khai. */
  coTheKhai: boolean;
  chuoi: { nhan: string; cycleIds: number[]; soXuLy: number };
  bac: number; bacNhan: string | null; keTiep: { kind: string; nhan: string; bac: number };
  dongThang: ReturnType<typeof dongThang>;
  khai: EmYThuc['khai'];
  nhom: EmYThuc['nhom']; han: string | null; hanXem: string | null; soBatBuoc: number; soMoi: number; quaHanNgay: number | null;
  deXuat: { id: number; nhan: string; status: 'cho_duyet' | 'da_duyet'; han: string | null; quaHan: boolean } | null;
  /** Đã có thẻ Báo QL đang chờ cho em (thanh cam "đã báo QL"). */
  daBaoQl: boolean;
  gvcn: string | null;
  phamVi: 'chuoi' | 'tat-ca';
  viPham: ViolationView[];
  macDinh: { tick: number[]; cuHon: number[] };
  dongThoiGian: DongThoiGianYt[];
  /** Dòng chữ cuối (K3 §4f): số vi phạm trong phạm vi, theo nhóm. */
  demCuoi: { tong: number; theoNhom: { nhom: string; so: number }[] };
  /** UI-Y-THUC-HV: dòng trạng thái "Duyệt · thu hồi | Báo PH (TVV)" — cùng hàng em của bảng lớp (`hangCuaEm`). */
  hang: Pick<DongEm, 'xuLyGanNhat' | 'tuChoi' | 'thuHoi' | 'baoPh'>;
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
  /* Một câu: thẻ Báo QL đang chờ + tên GVCN ("Người xử lý", UI-3 — câu con theo khoá chính). */
  const mot = db().prepare(
    `SELECT EXISTS (SELECT 1 FROM yeu_cau_duyet WHERE loai = 'bao_len_y_thuc' AND doi_tuong_loai = 'hoc_vien_y_thuc' AND doi_tuong_id = ? AND trang_thai = 'cho') AS bao,
            (SELECT full_name FROM users WHERE id = ?) AS gvcn`,
  ).get(studentId, em.gvcnId ?? 0) as { bao: number; gvcn: string | null };
  const daBaoQl = !!mot.bao;
  const quaHan = Math.max(0, ...[...em.viPham.values()].map((t) => t.quaHanNgay ?? 0)) || null;
  return {
    studentId, ten: hv.full_name, maHv: hv.student_code, homNay,
    canManage, canRecord: can(p, PERMISSIONS.VIOLATION_RECORD, { studentId, classId: em.lopId }),
    canSuaKhai: !!em.khai && (can(p, PERMISSIONS.REQUEST_APPROVE, { studentId }) || (canManage && em.khai.coTheSua)),
    coTheKhai: canManage && khaiDuoc(em),
    chuoi: { nhan: em.nhanChuoi, cycleIds: em.chuoi, soXuLy: em.xuLy.filter((m) => m.status === 'done' && m.cycleId != null && em.chuoi.includes(m.cycleId)).length },
    bac: em.bac, bacNhan: em.bac > 0 ? nhanLoaiXuLy(kindCuaBac(em.bac)) : null,
    keTiep: { kind: em.keTiep.kind, nhan: nhanLoaiXuLy(em.keTiep.kind), bac: em.keTiep.bac },
    dongThang: dongThang(em.bac, em.khai),
    khai: em.khai,
    nhom: em.nhom, han: em.han, hanXem: em.hanXem, soBatBuoc: em.soBatBuoc, soMoi: em.soMoi, quaHanNgay: quaHan,
    deXuat: em.deXuat ? { id: em.deXuat.id, nhan: nhanLoaiXuLy(em.deXuat.kind, em.deXuat.customName), status: em.deXuat.status, han: em.deXuat.han, quaHan: em.deXuat.quaHan } : null,
    daBaoQl, phamVi, viPham,
    /* UI-3 (mockup U10 K3): "Người xử lý" — GVCN lớp em đang học (một câu, chỉ khi có). */
    gvcn: mot.gvcn ?? null,
    macDinh: macDinhTick(viPham.map((v) => ({ id: v.id, t: v.trangThai, occurredOn: v.occurredOn })), homNay),
    dongThoiGian: dongThoiGian([studentId], trang, { chiTrongChuoi: phamVi === 'chuoi' }),
    hang: (({ xuLyGanNhat, tuChoi, thuHoi, baoPh }) => ({ xuLyGanNhat, tuChoi, thuHoi, baoPh }))(hangCuaEm(p, em, hv.full_name, hv.student_code, homNay)),
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
export function baoKhiGhiViPham(p: Principal, studentId: number, violationId: number, category: string, truocBatBuoc: boolean, emSau?: EmYThuc) {
  const em = emSau ?? emCua(studentId);
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
export function dangBatBuoc(studentId: number, em: EmYThuc = emCua(studentId)): boolean {
  return em.soBatBuoc > 0;
}

/** Người ghi có phải GVCN lớp em đang học (Q5 — tự Ghi nhận). */
export function laGvcnDangHoc(p: Principal, studentId: number, em: EmYThuc = emCua(studentId)): boolean {
  return em.gvcnId === p.userId || (!!em.lopId && p.assignments.some((a) => a.isCore && a.classId === em.lopId
    && a.effectiveFrom <= demoToday() && (!a.effectiveTo || a.effectiveTo >= demoToday())));
}


// ---------------------------------------------------------------- Đề xuất QL duyệt (V4-9, V4-10, Q10, Q11, T30) — thẻ `y_thuc`

/**
 * Bước 1: tạo NHÁP (`nhap`, nội bộ, không vào trạng thái) để có chủ cho tệp/liên kết bằng chứng. Loại: WL 3 (bất kỳ lúc nào, không đẩy bậc) ·
 * Meeting CX/GĐCN · Đình chỉ học tạm thời · Khác (tên ≥ 3 ký tự — T30) · LUAT-5 "không tăng bậc": bậc thang ≤ bậc hiện tại (lặp hoặc nhẹ hơn —
 * bậc em không đổi vì `bacHienTai` = max). Mô tả (lý do) ≥ 10 ký tự.
 */
export function deXuat(p: Principal, studentId: number, v: { kind?: unknown; customName?: unknown; violationIds?: unknown; note?: unknown }) {
  const hv = hocVien(studentId);
  requireManageDiscipline(p, studentId, MANAGE_MESSAGE);
  const kind = String(v.kind ?? '') as MeasureKind;
  const em = emCua(studentId);
  if (!(NGOAI_THANG as readonly string[]).includes(kind) && !khongTangBac(kind, em.bac)) {
    throw badRequest('Chọn loại cần QL duyệt: WL 3 · Meeting CX/GĐCN · Đình chỉ học tạm thời · Khác · hoặc không tăng bậc (bậc hiện tại hoặc thấp hơn).');
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

/** LUAT-5: loại thang ở bậc hiện tại hoặc thấp hơn = "xử lý không tăng bậc" (em chưa có bậc thì không có). */
const khongTangBac = (kind: string, bac: number): boolean => (THANG as readonly string[]).includes(kind) && bacCuaLoai(kind) <= bac;
/** Bằng chứng tệp bắt buộc chỉ với loại ngoài thang (V4-10); không tăng bậc chỉ cần lý do (luật 5 — tệp tuỳ chọn). */
const canTep = (kind: string): boolean => (NGOAI_THANG as readonly string[]).includes(kind);

/**
 * Bước 2: GỬI — cần ≥ 1 tệp/liên kết (V4-10; không tăng bậc: tuỳ chọn). TRONG MỘT giao dịch: nháp → `cho_duyet` + thẻ `y_thuc` (bằng chứng = id tệp,
 * `duLieu` = loại + bậc kế lúc gửi để thẻ nói "bậc kế tiếp đang là …" — M-11). Hạn duyệt 5 ngày (mặc định của loại).
 */
export function guiDeXuat(p: Principal, measureId: number) {
  const m = db().prepare('SELECT * FROM discipline_measures WHERE id = ?').get(measureId) as any;
  if (!m) throw notFound('Không tìm thấy đề xuất');
  const hv = hocVien(m.student_id);
  requireManageDiscipline(p, m.student_id, MANAGE_MESSAGE);
  if (m.status !== 'nhap') throw badRequest('Đề xuất này đã gửi rồi.');
  const tep = (db().prepare(`SELECT id FROM attachments WHERE owner_type = 'discipline_measure' AND owner_id = ? ORDER BY id`).all(measureId) as any[]).map((r) => r.id as number);
  if (!tep.length && canTep(m.kind)) throw badRequest('Cần đính kèm tệp hoặc liên kết làm bằng chứng trước khi gửi QL.');
  tx(() => {
    const em = emCua(m.student_id);
    const vIds = (db().prepare('SELECT violation_id FROM measure_violations WHERE measure_id = ?').all(measureId) as any[]).map((r) => r.violation_id);
    viPhamChon(em, vIds);
    const doi = db().prepare(`UPDATE discipline_measures SET status = 'cho_duyet', updated_at = ? WHERE id = ? AND status = 'nhap'`).run(nowIso(), measureId).changes;
    if (!doi) throw conflict('Đề xuất này vừa được gửi — mở lại.');
    ghiPhanHoi(vIds);
    if (!canTep(m.kind) && !khongTangBac(m.kind, em.bac)) throw badRequest('Bậc đã đổi — mở lại panel.');
    taoYeuCau(db(), {
      loai: 'y_thuc', doiTuongLoai: 'discipline_measure', doiTuongId: measureId, hocVienId: m.student_id, lopId: em.lopId,
      nguoiXin: p.userId, lyDo: m.note, bangChung: tep,
      duLieu: { kind: m.kind, customName: m.custom_name ?? null, bacKe: nhanLoaiXuLy(em.keTiep.kind), soViPham: vIds.length, soTep: tep.length },
    });
    /* SV-YT-TVV (luật 1): lần chờ QL duyệt cũng sinh việc Báo PH ngay. */
    sinhViecBaoPh({ id: measureId, studentId: m.student_id, kind: m.kind, customName: m.custom_name ?? null }, demoToday());
    writeAudit({ actorUserId: p.userId, action: 'discipline.propose', entityType: 'discipline_measure', entityId: measureId,
      entityLabel: `${hv.student_code} · gửi QL ${nhanLoaiXuLy(m.kind, m.custom_name)}`, after: { bangChung: tep } });
  });
  return xemXuLy(p, measureId);
}

// ---------------------------------------------------------------- Sửa / Xoá lần xử lý đã xác nhận (PR-LUI-a1)

/** OV-7a (chủ SP 13/10, thay Q5 06/10): ai lưu được thì sửa được — GVCN lớp em (cả lần đã thực hiện) + QL / Quản trị. Lần nháp đi `xoaNhap`. */
function quyenSuaXuLy(p: Principal, m: any): boolean {
  if (m.status === 'nhap' || m.status === 'thu_hoi') return false;
  return can(p, PERMISSIONS.REQUEST_APPROVE, { studentId: m.student_id }) || canManageDiscipline(p, m.student_id);
}

function loadXuLy(id: number): any {
  const m = db().prepare('SELECT * FROM discipline_measures WHERE id = ?').get(id) as any;
  if (!m) throw notFound('Không tìm thấy lần xử lý');
  return m;
}

/** Lần xử lý MỚI HƠN trong cùng chuỗi (lần đã dựa trên lần này) — mới nhất trước; không có = lần này là lần mới nhất. */
function lanSauCua(m: any, em: EmYThuc): any | null {
  /* Lần bị từ chối / nháp không phải lần "đã dựa trên lần này" — không chặn xoá. */
  const chuoi = em.chuoi;
  const trongChuoi = m.cycle_id != null && chuoi.includes(m.cycle_id);
  const sau = db().prepare(
    `SELECT id, kind, custom_name, cycle_id FROM discipline_measures WHERE student_id = ? AND status IN ('done', 'cho_duyet', 'da_duyet') AND id > ? ORDER BY id DESC`,
  ).all(m.student_id, m.id) as any[];
  return sau.find((r) => (trongChuoi ? r.cycle_id != null && chuoi.includes(r.cycle_id) : r.cycle_id === m.cycle_id)) ?? null;
}

function requireSuaXuLy(p: Principal, m: any) {
  if (m.status === 'nhap') throw badRequest('Đây là đề xuất chưa gửi — đóng panel để xoá nháp.');
  if (m.status === 'thu_hoi') throw badRequest('Lần xử lý đã thu hồi — chỉ xem.');
  if (!quyenSuaXuLy(p, m)) throw forbidden(MANAGE_MESSAGE);
}

/** Thêm / bỏ vi phạm của lần xử lý. Thêm: cùng em, chưa nằm trong lần xử lý khác. Còn ≥ 1. Mỗi thay đổi một dòng lịch sử vi phạm. */
export function suaViPhamXuLy(p: Principal, measureId: number, v: { violationIds?: unknown }): XuLyView {
  const m = loadXuLy(measureId);
  const hv = hocVien(m.student_id);
  requireSuaXuLy(p, m);
  const moi = [...new Set((Array.isArray(v.violationIds) ? v.violationIds : []).map(Number).filter((x) => Number.isInteger(x) && x > 0))];
  if (!moi.length) throw badRequest('Còn ít nhất 1 vi phạm.');
  tx(() => {
    const cu = (db().prepare('SELECT violation_id FROM measure_violations WHERE measure_id = ?').all(measureId) as any[]).map((r) => r.violation_id as number);
    const them = moi.filter((x) => !cu.includes(x));
    const bo = cu.filter((x) => !moi.includes(x));
    for (const id of them) {
      const vp = db().prepare('SELECT student_id FROM violations WHERE id = ?').get(id) as any;
      if (!vp || vp.student_id !== m.student_id) throw badRequest('Một vi phạm đã chọn không thuộc học viên này (hoặc đã bị xoá) — mở lại panel.');
      const giu = db().prepare(
        `SELECT 1 FROM measure_violations mv JOIN discipline_measures x ON x.id = mv.measure_id
          WHERE mv.violation_id = ? AND mv.measure_id != ? AND x.status IN ('done', 'cho_duyet', 'da_duyet')`,
      ).get(id, measureId);
      if (giu) throw badRequest('Một vi phạm đã chọn đã nằm trong lần xử lý khác — mở lại panel.');
    }
    if (!them.length && !bo.length) return;
    for (const id of bo) { db().prepare('DELETE FROM measure_violations WHERE measure_id = ? AND violation_id = ?').run(measureId, id); noteMeasureChange(id, measureId, null, p.userId); }
    const link = db().prepare('INSERT INTO measure_violations (measure_id, violation_id, added_by, added_at) VALUES (?,?,?,?)');
    for (const id of them) { link.run(measureId, id, p.userId, nowIso()); noteMeasureChange(id, null, measureId, p.userId); }
    ghiPhanHoi(them);
    db().prepare('UPDATE discipline_measures SET updated_at = ? WHERE id = ?').run(nowIso(), measureId);
    chotHanXuLy([m.student_id]);
    writeAudit({ actorUserId: p.userId, action: 'discipline.edit', entityType: 'discipline_measure', entityId: measureId,
      entityLabel: `${hv.student_code} · sửa vi phạm của ${nhanLoaiXuLy(m.kind, m.custom_name)}`, before: { violations: cu }, after: { violations: moi } });
  });
  return xemXuLy(p, measureId);
}

// ---------------------------------------------------------------- Thu hồi lần xử lý đã lưu (LUAT-5 — thay Xoá lần xử lý của PR-LUI-a1)

/** Thu hồi được: đã thực hiện, hoặc QL đã duyệt chờ thực hiện. Bị từ chối không tính bậc (không cần thu hồi); đề xuất còn chờ thì Rút. */
const THU_HOI_DUOC: ReadonlySet<string> = new Set(['done', 'da_duyet']);
const theThuHoi = (measureId: number) => ({ loai: 'thu_hoi_y_thuc' as const, doiTuongLoai: 'discipline_measure', doiTuongId: measureId });
const viPhamCua = (measureId: number): number[] =>
  (db().prepare('SELECT violation_id FROM measure_violations WHERE measure_id = ? ORDER BY violation_id').all(measureId) as any[]).map((r) => r.violation_id as number);

/** Bậc của em nếu bỏ lần `id` (0 = chưa có bậc) — câu "bậc về …" của hộp hỏi và thẻ. */
function bacSauThuHoi(em: EmYThuc, id: number): number {
  return bacHienTai(em.xuLy.filter((x) => x.id !== id && x.status === 'done' && (!em.chuoi.length || (x.cycleId != null && em.chuoi.includes(x.cycleId)))), em.khai?.bac ?? null);
}

/**
 * SUA-NO-RA (LUAT-5-b): số của thẻ thu hồi TÍNH SỐNG (bậc về · số vi phạm) — GVCN sửa vi phạm / bậc khai lúc thẻ còn chờ thì QL vẫn đọc và duyệt đúng số
 * hiện tại. Một lần đọc trạng thái Ý thức cho cả lô + một câu đếm vi phạm.
 */
export function soLieuThuHoi(ds: { measureId: number; studentId: number }[]): Map<number, { bacVe: number; soViPham: number }> {
  if (!ds.length) return new Map();
  const em = trangThaiYThuc([...new Set(ds.map((d) => d.studentId))], demoToday());
  const ids = ds.map((d) => d.measureId);
  const dem = new Map((db().prepare(`SELECT measure_id AS id, COUNT(*) AS n FROM measure_violations WHERE measure_id IN (${ids.map(() => '?').join(',')}) GROUP BY measure_id`)
    .all(...ids) as any[]).map((r) => [r.id as number, r.n as number]));
  return new Map(ds.flatMap((d) => {
    const e = em.get(d.studentId);
    return e ? [[d.measureId, { bacVe: bacSauThuHoi(e, d.measureId), soViPham: dem.get(d.measureId) ?? 0 }] as const] : [];
  }));
}

/**
 * SUA-NO-RA (LUAT-5-c): người gửi Sửa / Rút thẻ Ý thức của mình (Gửi QL, Thu hồi) — vẫn phải còn quyền với em theo phân công HIỆN TẠI. Rời lớp → 403;
 * QL vẫn duyệt / từ chối thẻ trong hộp (quyền duyệt theo phạm vi thẻ).
 */
export function kiemNguoiGuiYThuc(p: Principal, measureId: number): void {
  const m = db().prepare('SELECT student_id FROM discipline_measures WHERE id = ?').get(measureId) as any;
  if (!m) return;   // lần xử lý không còn — luật của loại báo lỗi riêng
  if (!can(p, PERMISSIONS.REQUEST_APPROVE, { studentId: m.student_id }) && !canManageDiscipline(p, m.student_id)) {
    throw forbidden('Bạn không còn phụ trách lớp của em — không sửa hoặc rút được yêu cầu này. Quản lý chi nhánh xử lý yêu cầu trong Chờ duyệt.');
  }
}

/** Chỉ lần MỚI NHẤT của chuỗi (giữ thứ tự thang) — kiểm lúc gửi, lúc QL duyệt và lúc huỷ quyết định (có thể đã có lần mới). */
function chanLanSau(m: any, viec: (ten: string) => string): void {
  const sau = lanSauCua(m, emCua(m.student_id));
  if (sau) {
    const ten = nhanLoaiXuLy(sau.kind, sau.custom_name);
    throw badRequest(`Đã có ${ten} sau lần này — ${viec(ten)}.`);
  }
}

/** Đường DELETE cũ (PR-LUI-a1). Luật 5: lần xử lý đã lưu không xoá — GVCN 403 (gửi QL thu hồi), QL 400 (Thu hồi kèm lý do). Không xoá vật lý. */
export function xoaXuLy(p: Principal, measureId: number): never {
  const m = loadXuLy(measureId);
  requireSuaXuLy(p, m);
  if (!can(p, PERMISSIONS.REQUEST_APPROVE, { studentId: m.student_id })) throw forbidden('Lần xử lý đã lưu không xoá được — bấm "Thu hồi…" để gửi QL duyệt.');
  throw badRequest('Lần xử lý đã lưu không xoá được — bấm "Thu hồi…" và ghi lý do.');
}

/**
 * THU HỒI (luật 5): lý do bắt buộc · lần mới nhất của chuỗi · đã thực hiện hoặc QL đã duyệt. GVCN → thẻ `thu_hoi_y_thuc` (lần xử lý VẪN tính tới khi QL
 * duyệt; đã có thẻ chờ → 400). QL trong phạm vi em (C26) → áp thẳng; thẻ đóng "tự duyệt" (Quản trị được báo — Q-D) làm lịch sử ai · lúc · lý do.
 */
export function thuHoiXuLy(p: Principal, measureId: number, v: { lyDo?: unknown }): XuLyView {
  const m = loadXuLy(measureId);
  const hv = hocVien(m.student_id);
  requireSuaXuLy(p, m);
  const lyDo = chuTuDo(v.lyDo, 'Lý do', 2000);
  if (!lyDo) throw badRequest('Ghi lý do thu hồi.');
  if (!THU_HOI_DUOC.has(m.status)) {
    throw badRequest(m.status === 'cho_duyet' ? 'Đề xuất đang chờ QL — dùng Rút đề xuất.' : 'Lần xử lý bị QL từ chối không tính bậc — không cần thu hồi.');
  }
  const ql = can(p, PERMISSIONS.REQUEST_APPROVE, { studentId: m.student_id });
  tx(() => {
    chanLanSau(m, (ten) => `thu hồi ${ten} trước`);
    const em = emCua(m.student_id);
    const id = taoYeuCau(db(), {
      ...theThuHoi(measureId), hocVienId: m.student_id, lopId: em.lopId, nguoiXin: p.userId, lyDo, khongBao: ql,
      duLieu: { kind: m.kind, customName: m.custom_name ?? null, bacVe: bacSauThuHoi(em, measureId), soViPham: viPhamCua(measureId).length },
    });
    if (id === null) throw badRequest('Lần xử lý này đang chờ QL duyệt thu hồi.');
    if (ql) {
      apDungThuHoi(p, m, hv, lyDo);
      chotYeuCau(db(), theThuHoi(measureId), 'duyet', { nguoiDuyet: p.userId });
      /* QL làm thẳng → GVCN lớp em biết (thẻ đã đóng nên không có chuông kết quả của hộp). */
      if (em.gvcnId && em.gvcnId !== p.userId) {
        notify({ userId: em.gvcnId, kind: 'discipline_de_biet', title: `Đã thu hồi ${nhanLoaiXuLy(m.kind, m.custom_name)} · ${hv.full_name} · để biết`,
          body: lyDo.slice(0, 120), entityType: 'discipline_measure', entityId: measureId, dedupKey: `yt-thu-hoi:${measureId}`,
          duong: duongHoSoHocVien(m.student_id, { tab: 'y-thuc' }) });
      }
    } else {
      writeAudit({ actorUserId: p.userId, action: 'discipline.revoke_request', entityType: 'discipline_measure', entityId: measureId,
        entityLabel: `${hv.student_code} · xin thu hồi ${nhanLoaiXuLy(m.kind, m.custom_name)}`, after: { lyDo } });
    }
  });
  return xemXuLy(p, measureId);
}

/** Áp thu hồi (TRONG tx): `thu_hoi` giữ dòng + liên kết + tệp; vi phạm về chưa xử lý (lịch sử vi phạm), hạn chốt lại; nhật ký đủ nội dung. */
function apDungThuHoi(p: Principal, m: any, hv: { student_code: string }, lyDo: string): void {
  const doi = db().prepare(`UPDATE discipline_measures SET status = 'thu_hoi', updated_at = ? WHERE id = ? AND status IN ('done', 'da_duyet')`)
    .run(nowIso(), m.id).changes;
  if (!doi) throw conflict('Lần xử lý này vừa được cập nhật — mở lại.');
  const vIds = viPhamCua(m.id);
  for (const vid of vIds) noteMeasureChange(vid, m.id, null, p.userId);
  chotHanXuLy([m.student_id]);
  dongViecTheoXuLy(m.id, 'system_thu_hoi', lyDo, p.userId);
  const daBaoPh = !!db().prepare("SELECT 1 FROM sos_coordination_actions WHERE student_id = ? AND kind = 'bao_ph_tvv' AND status = 'done' LIMIT 1").get(m.student_id);
  writeAudit({ actorUserId: p.userId, action: 'discipline.revoke', entityType: 'discipline_measure', entityId: m.id,
    entityLabel: `${hv.student_code} · thu hồi ${nhanLoaiXuLy(m.kind, m.custom_name)}`,
    before: { status: m.status, kind: m.kind, violations: vIds, daBaoPhuHuynh: daBaoPh }, after: { status: 'thu_hoi', lyDo } });
}

/** Hộp Chờ duyệt: QL Duyệt thẻ thu hồi (TRONG tx của hộp) — kiểm lại như lúc gửi rồi áp. */
export function duyetThuHoiYThuc(p: Principal, measureId: number, lyDo: string): void {
  const m = loadXuLy(measureId);
  if (!THU_HOI_DUOC.has(m.status)) throw badRequest('Lần xử lý này không còn để thu hồi. Danh sách đã được làm mới.');
  chanLanSau(m, (ten) => `thu hồi ${ten} trước`);
  apDungThuHoi(p, m, hocVien(m.student_id), lyDo);
}

/**
 * QL Huỷ quyết định duyệt thu hồi bấm nhầm (trong ngày — PR-LUI-a2, TRONG tx của hộp): lần xử lý về như trước — đã thực hiện (có ngày thực hiện) hoặc
 * đã duyệt chờ thực hiện. Chặn khi đã có lần sau, hoặc vi phạm của lần này đã vào lần xử lý khác (bậc / vi phạm sẽ đếm hai lần).
 */
export function huyThuHoiYThuc(p: Principal, measureId: number): void {
  const m = loadXuLy(measureId);
  if (m.status !== 'thu_hoi') throw badRequest('Lần xử lý này không còn ở trạng thái Đã thu hồi.');
  chanLanSau(m, () => 'không huỷ quyết định được');
  const vIds = viPhamCua(measureId);
  const dung = vIds.length && db().prepare(
    `SELECT 1 FROM measure_violations mv JOIN discipline_measures x ON x.id = mv.measure_id
      WHERE mv.violation_id IN (${vIds.map(() => '?').join(',')}) AND x.id != ? AND x.status IN ('done', 'cho_duyet', 'da_duyet') LIMIT 1`,
  ).get(...vIds, measureId);
  if (dung) throw badRequest('Vi phạm của lần này đã nằm trong lần xử lý khác — không huỷ quyết định được.');
  /* Thu hồi hết lần xử lý của chuỗi mở lại "Xác nhận cấp bậc" — đã khai / sửa từ hôm thu hồi (huỷ chỉ trong ngày) thì bậc khai sẽ chồng lên lần này. */
  const homNay = demoToday();
  const khai = db().prepare('SELECT 1 FROM y_thuc_khai_bac WHERE student_id = ? AND (khai_luc >= ? OR sua_luc >= ?) LIMIT 1').get(m.student_id, homNay, homNay);
  if (khai) throw badRequest('Sau khi thu hồi, em đã được xác nhận cấp bậc vi phạm — không huỷ quyết định được. Sửa cấp bậc đã khai ở tab Ý thức của em nếu cần.');
  const ve = m.performed_on ? 'done' : 'da_duyet';
  const doi = db().prepare(`UPDATE discipline_measures SET status = ?, updated_at = ? WHERE id = ? AND status = 'thu_hoi'`).run(ve, nowIso(), measureId).changes;
  if (!doi) throw conflict('Lần xử lý này vừa được cập nhật — mở lại.');
  for (const vid of vIds) noteMeasureChange(vid, null, measureId, p.userId);
  chotHanXuLy([m.student_id]);
  moLaiViecTheoXuLy(measureId);
  writeAudit({ actorUserId: p.userId, action: 'discipline.revoke_undo', entityType: 'discipline_measure', entityId: measureId,
    entityLabel: `${hocVien(m.student_id).student_code} · huỷ thu hồi ${nhanLoaiXuLy(m.kind, m.custom_name)}`, before: { status: 'thu_hoi' }, after: { status: ve } });
}

/**
 * OV-7a: GVCN RÚT đề xuất "Gửi QL" còn chờ (gọi từ `rutYeuCau`, trong tx của hộp — thẻ đã đóng "Người gửi đã rút"): lần xử lý chờ duyệt bị xoá như Xoá lần
 * xử lý (vi phạm về chưa xử lý, tệp xoá sau giao dịch qua `khoaTep`, nhật ký đủ nội dung).
 */
export function rutDeXuatYThuc(p: Principal, measureId: number, khoaTep: string[]): void {
  const m = loadXuLy(measureId);
  if (m.status !== 'cho_duyet') throw badRequest('Đề xuất này không còn chờ QL duyệt.');
  xoaXuLyTrongTx(p, m, hocVien(m.student_id), khoaTep, 'Người gửi đã rút');
}

/** OV-7a: GVCN sửa GHI CHÚ của đề xuất còn chờ (từ `suaYeuCau`) — kiểm như lúc gửi; bằng chứng đếm lại cho thẻ. Trả phần thẻ đổi theo. */
export function suaDeXuatYThuc(measureId: number, note: unknown): { lyDo: string; bangChung: number[]; soTep: number } {
  const m = loadXuLy(measureId);
  if (m.status !== 'cho_duyet') throw badRequest('Đề xuất này không còn chờ QL duyệt.');
  const ghi = moTa(note);
  const tep = (db().prepare(`SELECT id FROM attachments WHERE owner_type = 'discipline_measure' AND owner_id = ? ORDER BY id`).all(measureId) as any[]).map((r) => r.id as number);
  if (!tep.length && canTep(m.kind)) throw badRequest('Cần đính kèm tệp hoặc liên kết làm bằng chứng trước khi gửi QL.');
  db().prepare('UPDATE discipline_measures SET note = ?, updated_at = ? WHERE id = ?').run(ghi, nowIso(), measureId);
  return { lyDo: ghi, bangChung: tep, soTep: tep.length };
}

function xoaXuLyTrongTx(p: Principal, m: any, hv: { student_code: string }, khoaTep: string[], lyDoDong: string): void {
  const measureId = m.id as number;
  const vIds = (db().prepare('SELECT violation_id FROM measure_violations WHERE measure_id = ? ORDER BY violation_id').all(measureId) as any[]).map((r) => r.violation_id as number);
  const daBaoPh = !!db().prepare("SELECT 1 FROM sos_coordination_actions WHERE student_id = ? AND kind = 'bao_ph_tvv' AND status = 'done' LIMIT 1").get(m.student_id);
  const files = purgeAttachmentsOf('discipline_measure', measureId, p.userId, khoaTep);
  for (const id of vIds) noteMeasureChange(id, measureId, null, p.userId);
  db().prepare('DELETE FROM measure_violations WHERE measure_id = ?').run(measureId);
  /* SV-YT-TVV (rà #516): rút chỉ xoá lần CÒN chờ — câu xoá có điều kiện `cho_duyet` (không đổi dòng → lui cả giao dịch, việc Báo PH không bị đóng). */
  dongViecTheoXuLy(measureId, 'system_rut', lyDoDong, p.userId);
  if (!db().prepare(`DELETE FROM discipline_measures WHERE id = ? AND status = 'cho_duyet'`).run(measureId).changes) throw conflict('Đề xuất này không còn chờ QL duyệt — mở lại.');
  chotYeuCau(db(), { loai: 'y_thuc', doiTuongLoai: 'discipline_measure', doiTuongId: measureId }, 'tu_dong', { lyDo: lyDoDong });
  chotHanXuLy([m.student_id]);
  writeAudit({ actorUserId: p.userId, action: 'discipline.delete', entityType: 'discipline_measure', entityId: measureId,
    entityLabel: `${hv.student_code} · xoá ${nhanLoaiXuLy(m.kind, m.custom_name)}`,
    before: { studentId: m.student_id, kind: m.kind, customName: m.custom_name ?? null, status: m.status, note: m.note ?? null, performedOn: m.performed_on ?? null,
      performedBy: m.performed_by ?? null, performerName: m.performer_name ?? null, createdBy: m.created_by, violations: vIds, attachments: files, daBaoPhuHuynh: daBaoPh } });
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
