/**
 * XỬ LÝ Ý THỨC v4 (PR-YT4, §5.4) — thay `measures.ts` của PR-J. GVCN đóng từng vi phạm bằng MỘT trong hai cách:
 *
 *   Ghi nhận          "đã xem, không cần biện pháp" (V4-1, V4-6) — không đẩy bậc, vẫn đếm vào luật ≥ 3. Vi phạm đang BẮT BUỘC thì không
 *                     Ghi nhận được (V4-2).
 *   Xác nhận xử lý    MỘT bước (V4-7): vi phạm · bậc kế tiếp (máy chủ tự tính, client KHÔNG gửi loại) · ngày ≤ hôm nay · người thực hiện
 *                     · mô tả ≥ 8 ký tự (N56 ③: trống → máy tự ghi) · tệp tuỳ chọn (tải sau vào chủ `discipline_measure`). Lưu là `done`.
 *
 * Bậc kế cần QL (WL 3) hoặc hết thang → phải đi đường Đề xuất (thẻ `y_thuc`, `deXuat*` ở cuối file). Bậc không lùi (V4-12): bậc đọc từ
 * `kind` của lần xử lý, xoá vi phạm không xoá lần xử lý. Trạng thái mọi vi phạm đọc qua `trangThaiYThuc()` (một cửa).
 * TINH-HINH (chủ SP 12/11): GVCN chọn tại chỗ Nâng 1 bậc (mặc định, `luuXuLy`) · Không nâng · Vượt bậc · Ngoài thang (ba cách sau = Đề xuất, QL có
 * 5 ngày — hết hạn TỰ CHỐT theo GVCN, `quetYThucHetHan`). N1 sửa 12/11: lần chờ QL KHÔNG sinh việc TVV — việc Báo PH sinh lúc chốt (`chotDeXuatYThuc`).
 * LUAT-5 (luật 5, 21/10): lần xử lý đã lưu KHÔNG xoá — "Thu hồi…" kèm lý do (GVCN gửi QL duyệt, QL làm thẳng) → `thu_hoi` giữ dòng; xử lý không
 * tăng bậc = Đề xuất với bậc ≤ bậc hiện tại. [XM 5] (PTA 11/11, thay B15): Hoàn tác 10 s ở toast (`hoanTacXuLy`); quá hạn thì Thu hồi.
 */
import { DS_JSON, db, tx } from '../db.ts';
import { xoaNho } from '../platform/nguCanhRequest.ts';
import {
  hanTai, NGOAI_THANG, PERMISSIONS, THANG, VIOLATION_CATEGORY_LABEL, XU_LY_STATUS_LABEL, hanTheoNgay,
  LY_DO_SUA_KHAI_LECH, bacCuaLoai, bacDu, bacHienTai, tachTenMoTa, dongThang, duongHoSoHocVien, kindCuaBac, kiemGhiRoKhac, macDinhTick, nhanLoaiXuLy, shortDate,
  CHU_TOI_THIEU, type MeasureKind, type TheYeuCauDto, type ViolationCategory,
} from '../../../shared/domain/index.ts';
import { boVaiCx, can, duyetYThuc, type Principal } from '../permissions.ts';
import { badRequest, canXacNhan, chuTuDo, conflict, forbidden, isIsoDate, notFound, nowIso } from '../util.ts';
import { demoToday } from '../demoConfig.ts';
import { notify, quanLyCuaChiNhanh, writeAudit } from '../platform/audit.ts';
import { laNguoiHopLe } from '../platform/timNguoi.ts';
import { KEY_TAKEN_MESSAGE, canManageDiscipline, lamXuLyDuocGiao, requireManageDiscipline, requireViewStudent } from './access.ts';
import { conHieuLuc, xongViecXuLy } from '../worklist/giaoViec.ts';

/**
 * BAOPH-0 (N72 ⑥, 4.6): như `requireManageDiscipline` + người ĐƯỢC GIAO đúng việc này (còn hoạt động + còn vai ở chi nhánh em — như N58) — `pt` đọc người được giao
 * (chỉ khi cửa thường đóng: GVCN / Head không tốn câu). Việc Xử lý vi phạm: `ptXuLy(em)` · Đã thực hiện: `phu_trach_id` của lần xử lý.
 */
function requireLamViecYThuc(p: Principal, studentId: number, message: string, pt: () => number | null | undefined): void {
  if (canManageDiscipline(p, studentId)) return;
  const u = pt();
  if (u != null && u === p.userId && conHieuLuc(p.userId, studentId)) return;
  requireManageDiscipline(p, studentId, message);
}
const ptXuLy = (studentId: number) => () =>
  (db().prepare(`SELECT phu_trach_id AS pt FROM viec_xu_ly WHERE id = ? AND trang_thai = 'mo'`).get(studentId) as { pt: number | null } | undefined)?.pt;
import { chotHanXuLy, ghiPhanHoi, trangThaiYThuc, type EmYThuc } from './trangThai.ts';
import { addHistory, noteMeasureChange, violationsByIds, type ViolationView } from './violations.ts';
import { dongThoiGian, hangCuaEm, type DongEm, type DongThoiGianYt } from './board.ts';
import { chotYeuCau, taoYeuCau, theCuaDoiTuong } from '../duyet/yeuCau.ts';
import { purgeAttachmentsOf, xoaTepSauGiaoDich } from '../platform/attachments.ts';
import { tinhHinhCuaEm, type TinhHinhView } from './tinhHinh.ts';
import { donViec } from '../worklist/giaoViec.ts';
import { dongBoTamDung, dongTheoDuongSanCo, xoaTraLaiCuaXuLy } from './traLai.ts';
import { coTheGhi, dongViecTheoXuLy, moLaiBaoPhMeeting, moLaiViecTheoXuLy, sinhViecBaoPh, xongBaoPhViMeeting } from './baoPhTvv.ts';

export const MANAGE_MESSAGE = 'Chỉ giáo viên chủ nhiệm của lớp em đang học hoặc Head trong phạm vi mới xử lý được Ý thức — giáo viên bộ môn chỉ đọc.';
export const MO_TA_MIN = CHU_TOI_THIEU;   // N50 (6)
export const MO_TA_TOI_DA = 500;

const duongXuLy = (sid: number) => `${duongHoSoHocVien(sid, { tab: 'y-thuc' })}&mo=xu-ly`;

function hocVien(studentId: number): { id: number; full_name: string; student_code: string; branch_id: number | null; consultant_user_id: number | null; tvv: string | null } {
  const s = db().prepare(`SELECT s.id, s.full_name, s.student_code, s.branch_id, s.consultant_user_id, u.full_name AS tvv
    FROM students s LEFT JOIN users u ON u.id = s.consultant_user_id WHERE s.id = ?`).get(studentId) as any;
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
    if (t.t === 'da_xu_ly' || t.t === 'cho_duyet') throw badRequest('Một vi phạm đã chọn đã được xử lý hoặc đang chờ Head duyệt — mở lại panel.');
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

export function moTa(v: unknown, cu?: string | null): string {
  const s = String(v ?? '').trim();
  if (s.length < MO_TA_MIN) throw badRequest(`Mô tả cần ít nhất ${MO_TA_MIN} ký tự — đã làm gì, với ai.`);
  /* TINH-HINH (mockup v20 D1 "/ 500", N35): trần 500 — quá thì không lưu, chữ giữ ở ô (trước: cắt lặng ở 2000); chữ cũ dài gửi lại nguyên văn thì giữ. */
  return chuTuDo(s, 'Mô tả', MO_TA_TOI_DA, cu) ?? s;
}
/** N56 ③ (chủ SP 20/11): Xác nhận xử lý ĐÚNG BẬC KẾ — Mô tả để trống được (`luuXuLy` tự ghi); có chữ thì kiểm như cũ. Đề xuất (khác mặc định) vẫn `moTa`. */
const moTaTuyChon = (v: unknown): string => (String(v ?? '').trim() ? moTa(v) : '');
/**
 * N56 ③: Mô tả máy tự ghi "{BẬC} · {vi phạm}" — ĐÚNG câu nút "Chèn" ở web (`cauChen`): tên vi phạm = `tachTenMoTa(...).ten` (như danh sách vi phạm web hiện),
 * theo thứ tự các vi phạm được chọn, bỏ trùng. Một câu theo khoá chính, chỉ khi Mô tả trống (`em.dsViPham` không mang tên — thêm cột vào câu chung
 * của `trangThaiYThuc` thì mọi trang Ý thức đọc nặng hơn).
 */
function moTaTuDong(ids: readonly number[], kind: string): string {
  const theoId = new Map((db().prepare(`SELECT id, ten, description, category FROM violations WHERE id IN (${DS_JSON})`).all(JSON.stringify(ids)) as any[])
    .map((r) => [r.id as number, tachTenMoTa(r.ten, r.description, r.category).ten]));
  const ten = [...new Set(ids.map((id) => theoId.get(id)).filter(Boolean))].join(', ');
  return [bacDu(nhanLoaiXuLy(kind)), ten].filter(Boolean).join(' · ').slice(0, MO_TA_TOI_DA);
}

// ---------------------------------------------------------------- Ghi nhận (V4-1, V4-2, V4-6)

/**
 * PR-Dọn (6f): việc NHẮC "Khai bậc" ở Công việc — có chuỗi, chưa lần xử lý nào trong chuỗi, chưa từng khai (em cũ trước khi có web).
 * N66 (chủ SP 24/11): NÚT khai / sửa ở hồ sơ và lô không còn theo hàm này — người quản lý Ý thức luôn khai / sửa được (`khaiMoDuoc`).
 */
/* RKC-3a: em Tạm dừng khai được (không ảnh hưởng đầu ra — bậc dùng khi em quay lại). */
export const khaiDuoc = (em: { chuoi: readonly unknown[]; soXuLyChuoi: number; tungKhai: unknown; tamDung?: unknown }): boolean =>
  em.chuoi.length > 0 && em.soXuLyChuoi === 0 && !em.tungKhai;
/** N66: khai MỚI (chuỗi chưa có dòng khai) — chỉ cần em có chuỗi; đã khai thì là Sửa. */
export const khaiMoDuoc = (em: { chuoi: readonly unknown[]; khai: unknown }): boolean => em.chuoi.length > 0 && !em.khai;

export function ghiNhan(p: Principal, studentId: number, violationIds: unknown): { ok: true; soGhiNhan: number } {
  const hv = hocVien(studentId);
  requireManageDiscipline(p, studentId, MANAGE_MESSAGE);
  const em = emCua(studentId);
  const ids = viPhamChon(em, violationIds);
  /* RKC-3a (PTA 07/11, luật thang vi phạm): GV giữ luật — bắt buộc xử lý thì dùng Xác nhận xử lý; Quản lý vượt được, hỏi một câu nêu luật (nhật ký Ghi nhận như thường). */
  if (ids.some((id) => { const t = em.viPham.get(id)!; return t.t === 'can_xu_ly' || t.lyDoQuaHan === 'xu-ly'; })) {
    if (!duyetYThuc(p, { studentId })) throw badRequest('Em đang phải xử lý bắt buộc — dùng Xác nhận xử lý (Head Ghi nhận được).');
    canXacNhan('Em đang phải xử lý bắt buộc — vẫn chỉ Ghi nhận (bỏ qua luật xử lý)?', undefined, 'Vẫn ghi nhận');
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
  requireLamViecYThuc(p, studentId, MANAGE_MESSAGE, ptXuLy(studentId));   // BAOPH-0 (4.6): + người được giao việc Xử lý vi phạm
  const key = v.idempotencyKey?.trim() || null;
  if (key) {
    const seen = db().prepare('SELECT id, student_id, created_by FROM discipline_measures WHERE idempotency_key = ?').get(key) as any;
    if (seen) {
      if (seen.student_id !== studentId || seen.created_by !== p.userId) throw badRequest(KEY_TAKEN_MESSAGE);
      return xemXuLy(p, seen.id);
    }
  }
  const note = moTaTuyChon(v.note);
  const performedOn = ngayThucHien(v.performedOn);
  const nguoi = nguoiThucHien(p, v);
  /* BAOPH-0 (4.6): khối giao việc của đợt chờ xử lý kết thúc (lô: `lo.ts` một câu cho cả lô). */
  const m = tx(() => { const r = luuXuLy(p, hv, studentId, { violationIds: v.violationIds, performedOn, nguoi, note, key, bacDaThay: v.bacDaThay }, demoToday()); xongViecXuLy([studentId]); return r; });
  return xemXuLy(p, m.id);
}

/**
 * Phần GHI của Xác nhận xử lý — nơi gọi đã kiểm quyền, khoá gửi lại, ngày, người, mô tả. OV-13d: lô gọi thẳng (kiểm quyền theo lớp một lần,
 * không đọc lại lần xử lý vừa ghi) để một em chỉ tốn ~12 câu SQL.
 */
export function luuXuLy(p: Principal, hv: { full_name: string; student_code: string }, studentId: number, v: {
  violationIds: unknown; performedOn: string; nguoi: { by: number | null; ten: string | null }; note: string; key: string | null; bacDaThay?: unknown;
}, homNay: string): { id: number; kind: string } {
  const { performedOn, nguoi, key } = v;
  return tx(() => {
    /* Tính lại TRONG giao dịch (BEGIN IMMEDIATE): bậc là của máy chủ, không tin client. */
    const em = trangThaiYThuc([studentId], homNay).get(studentId)!;
    const ids = viPhamChon(em, v.violationIds);
    if (v.bacDaThay !== undefined && v.bacDaThay !== null && Number(v.bacDaThay) !== em.bac) {
      throw conflict('Bậc đã đổi, mở lại panel.', { bac: em.bac });
    }
    const ke = em.keTiep;
    const note = v.note || moTaTuDong(ids, ke.kind);   // N56 ③
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
  /* N66 (chủ SP 24/11): khai được cả khi chuỗi đã có lần xử lý trên web — bậc khai là bậc đã tới (lần cũ giữ trong lịch sử). */
  return luuKhai(p, hv, studentId, kiemKhai(v), demoToday());
}

/**
 * Phần GHI của Xác nhận cấp bậc (đã kiểm quyền) — OV-13d lô gọi thẳng. Luật chuỗi tính lại TRONG giao dịch.
 * N66: `khai_luc` / `sua_luc` ghi giờ đầy đủ (`nowIso`, cùng đồng hồ với `confirmed_at` của lần xử lý) — `bacHienTai` so mốc này.
 */
export function luuKhai(p: Principal, hv: { student_code: string }, studentId: number, k: ReturnType<typeof kiemKhai>, homNay: string) {
  const { bac, thang, ghiChu } = k;
  return tx(() => {
    const em = trangThaiYThuc([studentId], homNay).get(studentId)!;
    if (!em.chuoi.length) throw badRequest('Em chưa có lộ trình — chưa xác nhận cấp bậc vi phạm được.');
    if (em.khai) throw conflict('Chuỗi này đã xác nhận cấp bậc vi phạm — mở lại panel để sửa bậc đã khai.');
    db().prepare(
      `INSERT INTO y_thuc_khai_bac (student_id, chuoi_cycle_id, bac, thang, ghi_chu, khai_boi, khai_luc) VALUES (?,?,?,?,?,?,?)`,
    ).run(studentId, em.chuoi[0], bac, thang, ghiChu, p.userId, nowIso());
    writeAudit({ actorUserId: p.userId, action: 'discipline.declare_level', entityType: 'student', entityId: studentId,
      entityLabel: `${hv.student_code} · cấp bậc ${bac}`, after: { bac, thang, ghiChu, chuoi: em.chuoi[0] } });
    return { ok: true as const, bac };
  });
}

/**
 * OV-7a + N50 (8) + N66 (chủ SP 16/11, 24/11): GVCN / Quản lý sửa bậc đã khai mọi lúc, kể cả sau khi đã có lần xử lý trên web — bậc mới là bậc đã tới
 * (nâng hoặc hạ; `bacHienTai` theo mốc). Lịch sử: nhật ký `discipline.declare_level_edit` (trước → sau). `bacCu` (bậc panel đã thấy) lệch → 409.
 */
export function suaKhaiBac(p: Principal, studentId: number, v: { bac?: unknown; thang?: unknown; ghiChu?: unknown; bacCu?: unknown }) {
  const hv = hocVien(studentId);
  const ql = duyetYThuc(p, { studentId });
  if (!ql) requireManageDiscipline(p, studentId, MANAGE_MESSAGE);
  const bacCu = v.bacCu === undefined || v.bacCu === null ? undefined : Number(v.bacCu);
  /* N70 (chủ SP 24/11): người duyệt Ý thức (Head / Quản trị) sửa áp ngay; GVCN sửa bậc ĐÃ KHAI → yêu cầu chờ Head, bậc cũ giữ. */
  if (!ql) return guiSuaKhai(p, hv, studentId, kiemKhai(v), demoToday(), { bacCu });
  return luuSuaKhai(p, hv, studentId, kiemKhai(v), demoToday(), { bacCu });
}

// ---------------------------------------------------------------- N70 · GVCN sửa bậc đã khai → thẻ `sua_khai_bac` chờ Head

const theSuaKhai = (studentId: number) => ({ loai: 'sua_khai_bac' as const, doiTuongLoai: 'hoc_vien_khai_bac', doiTuongId: studentId });
type DuLieuSuaKhai = { bacCu: number; bac: number; thang: string | null; ghiChu: string; cycleId: number };

/**
 * Phần GHI của "Gửi Head duyệt" (đã kiểm quyền) — lô gọi thẳng. MỘT thẻ đang chờ mỗi em: gửi lại = thay nội dung (hạn giữ). Ghi chú = lý do, bắt buộc.
 * Dòng khai KHÔNG đổi. `bacCu` (bậc panel đã thấy) lệch → 409 như sửa thẳng.
 */
export function guiSuaKhai(p: Principal, hv: { student_code: string }, studentId: number, k: ReturnType<typeof kiemKhai>, homNay: string, o: { bacCu?: number } = {}) {
  if (k.ghiChu.length < CHU_TOI_THIEU) throw badRequest(`Ghi lý do sửa bậc ở ô Ghi chú (ít nhất ${CHU_TOI_THIEU} ký tự) — Head đọc để duyệt.`);   // B-2 (N50 ⑥): một ngưỡng cho mọi ô lý do
  return tx(() => {
    const em = trangThaiYThuc([studentId], homNay).get(studentId)!;
    if (!em.khai) throw badRequest('Chuỗi này chưa xác nhận cấp bậc vi phạm.');
    if (o.bacCu !== undefined && em.khai.bac !== o.bacCu) throw conflict('Bậc của em vừa được người khác sửa — mở lại panel.', { bac: em.khai.bac });
    /* PTA rà #2058: bậc VÀ ngày / tháng đều như dòng khai thì không có gì để Head duyệt (ghi chú là lý do, không phải nội dung sửa). */
    if (k.bac === em.khai.bac && (k.thang ?? null) === (em.khai.thang ?? null)) throw badRequest('Chưa đổi gì — chọn bậc hoặc ngày / tháng khác với hiện tại.');
    const duLieu: DuLieuSuaKhai = { bacCu: em.khai.bac, bac: k.bac, thang: k.thang, ghiChu: k.ghiChu, cycleId: em.khai.cycleId };
    let id = taoYeuCau(db(), { ...theSuaKhai(studentId), hocVienId: studentId, lopId: em.lopId, nguoiXin: p.userId, lyDo: k.ghiChu, duLieu });
    let ghiDe = false;
    if (id === null) {
      /* Đã có thẻ chờ (kể cả thẻ lệch bậc chưa kịp tự đóng) → thay nội dung, người gửi = người vừa gửi. */
      const cu = db().prepare(`SELECT id, du_lieu, ly_do, nguoi_xin FROM yeu_cau_duyet WHERE loai = 'sua_khai_bac' AND doi_tuong_loai = 'hoc_vien_khai_bac' AND doi_tuong_id = ? AND trang_thai = 'cho'`)
        .get(studentId) as { id: number; du_lieu: string | null; ly_do: string | null; nguoi_xin: number | null };
      id = cu.id;
      /* PTA rà #2058: ghi đè thẻ CÒN HIỆU LỰC → giữ MỘT bản nội dung trước ở `du_lieu.truoc` (máy chủ giữ — không nhận từ client) để Hoàn tác lô khôi phục
         thay vì rút mất thẻ gửi từ trước; thẻ đã lệch bậc thì không giữ (Hoàn tác = rút). */
      const dCu = cu.du_lieu ? JSON.parse(cu.du_lieu) as Record<string, unknown> : null;
      const truoc = dCu && em.khai.cho?.id === cu.id ? { lyDo: cu.ly_do, nguoiXin: cu.nguoi_xin, duLieu: { ...dCu, truoc: undefined } } : undefined;
      ghiDe = !!truoc;
      db().prepare('UPDATE yeu_cau_duyet SET ly_do = ?, du_lieu = ?, nguoi_xin = ? WHERE id = ?').run(k.ghiChu, JSON.stringify({ ...duLieu, ...(truoc ? { truoc } : {}) }), p.userId, id);
      writeAudit({ actorUserId: p.userId, action: 'request.edit', entityType: 'yeu_cau_duyet', entityId: id, entityLabel: 'Sửa cấp bậc vi phạm',
        before: { lyDo: cu.ly_do, nguoiXin: cu.nguoi_xin, duLieu: dCu ? { ...dCu, truoc: undefined } : null }, after: { lyDo: k.ghiChu, nguoiXin: p.userId, duLieu } });
    } else {
      writeAudit({ actorUserId: p.userId, action: 'discipline.declare_level_request', entityType: 'student', entityId: studentId,
        entityLabel: `${hv.student_code} · xin sửa cấp bậc`, before: { bac: em.khai.bac }, after: { bac: k.bac, thang: k.thang, ghiChu: k.ghiChu, yeuCauId: id } });
    }
    xoaNho();   // trạng thái Ý thức nhớ theo request đã cũ (khai.cho)
    const han = (db().prepare('SELECT han_duyet FROM yeu_cau_duyet WHERE id = ?').get(id) as { han_duyet: string | null }).han_duyet;
    return { ok: true as const, guiDuyet: true as const, yeuCauId: id, han, bac: em.khai.bac, ghiDe };
  });
}

/**
 * Hoàn tác lô (PTA rà #2058): thẻ đang chờ của CHÍNH người bấm mà lần gửi gần nhất là GHI ĐÈ (`du_lieu.truoc`) → trả nội dung trước (lý do, bậc xin,
 * ngày / tháng, người gửi), thẻ vẫn chờ. Trả false khi không có bản trước — nơi gọi Rút thẻ như cũ.
 */
export function khoiPhucSuaKhai(p: Principal, studentId: number, yeuCauId: number): boolean {
  return tx(() => {
    const y = db().prepare(`SELECT id, du_lieu, ly_do, nguoi_xin FROM yeu_cau_duyet WHERE id = ? AND loai = 'sua_khai_bac' AND doi_tuong_id = ? AND trang_thai = 'cho'`)
      .get(yeuCauId, studentId) as { id: number; du_lieu: string | null; ly_do: string | null; nguoi_xin: number | null } | undefined;
    if (!y) throw badRequest('Yêu cầu sửa bậc của em không còn chờ Head — không hoàn tác em này.');
    if (y.nguoi_xin !== p.userId) throw forbidden('Chỉ người gửi mới sửa hoặc rút được yêu cầu này.');
    const d = JSON.parse(y.du_lieu ?? '{}') as { truoc?: { lyDo: string | null; nguoiXin: number | null; duLieu: Record<string, unknown> } };
    if (!d.truoc) return false;
    db().prepare('UPDATE yeu_cau_duyet SET ly_do = ?, du_lieu = ?, nguoi_xin = ? WHERE id = ?').run(d.truoc.lyDo, JSON.stringify(d.truoc.duLieu), d.truoc.nguoiXin, y.id);
    writeAudit({ actorUserId: p.userId, action: 'request.edit', entityType: 'yeu_cau_duyet', entityId: y.id, entityLabel: 'Sửa cấp bậc vi phạm · hoàn tác gửi lại',
      before: { lyDo: y.ly_do, duLieu: { ...d, truoc: undefined } }, after: { lyDo: d.truoc.lyDo, duLieu: d.truoc.duLieu } });
    xoaNho();
    return true;
  });
}

/** Người gửi (hoặc người đang phụ trách em) Rút thẻ sửa bậc — rời lớp thì 403 như thẻ Ý thức khác (SUA-NO-RA). Bảng nguồn chưa đổi gì. */
export function kiemRutSuaKhai(p: Principal, studentId: number): void {
  if (!duyetYThuc(p, { studentId }) && !canManageDiscipline(p, studentId)) {
    throw forbidden('Bạn không còn phụ trách lớp của em — không sửa hoặc rút được yêu cầu này. Head chi nhánh xử lý yêu cầu trong Chờ duyệt.');
  }
}

/**
 * ÁP thẻ sửa bậc (TRONG tx của nơi gọi): Head Duyệt (`boi` = Head) hoặc hết hạn máy chốt theo GVCN (`boi` = người gửi, `tuChot`). So-và-đổi: bậc
 * khai đã khác lúc gửi → 409 (`luuSuaKhai`), thẻ không áp.
 */
export function apDungSuaKhai(boi: number, yc: { id: number; doi_tuong_id: number; du_lieu: string | null }, o: { tuChot?: boolean } = {}): void {
  const d = JSON.parse(yc.du_lieu ?? '{}') as Partial<DuLieuSuaKhai>;
  luuSuaKhai({ userId: boi }, hocVien(yc.doi_tuong_id), yc.doi_tuong_id, kiemKhai(d, true), demoToday(), { bacCu: d.bacCu, cycleId: d.cycleId, yeuCauId: yc.id, tuChot: o.tuChot });
  xoaNho();
}

/** Phần GHI của Sửa cấp bậc (đã kiểm quyền) — OV-13d lô gọi thẳng. */
export function luuSuaKhai(p: { userId: number }, hv: { student_code: string }, studentId: number, k: ReturnType<typeof kiemKhai>, homNay: string,
  /** KHAI-BAC-LO Hoàn tác: `bacCu` = bậc phải còn nguyên (so TRONG giao dịch — lần sửa xen giữa không bị đè); `hoanTac` ghi nhật ký loại hoàn tác.
   *  N70: `yeuCauId` = áp từ thẻ sửa bậc (Head duyệt / `tuChot` hết hạn) — ghi vào nhật ký; `cycleId` = lộ trình của dòng khai LÚC GỬI thẻ — em sang chuỗi
   *  mới rồi khai lại đúng bậc cũ thì dòng khai hiện tại là dòng khác → 409, không ghi nhầm (PTA rà lần 2 #2058). */
  o: { bacCu?: number; cycleId?: number; hoanTac?: (em: EmYThuc) => void; yeuCauId?: number; tuChot?: boolean } = {}) {
  const { bac, thang, ghiChu } = k;
  return tx(() => {
    const em = trangThaiYThuc([studentId], homNay).get(studentId)!;
    if (!em.khai) throw badRequest('Chuỗi này chưa xác nhận cấp bậc vi phạm.');
    if (o.cycleId !== undefined && em.khai.cycleId !== o.cycleId) throw conflict('Bậc của em vừa được người khác sửa — mở lại panel.', { bac: em.khai.bac });
    if (o.bacCu !== undefined && em.khai.bac !== o.bacCu) {
      throw conflict(o.hoanTac ? 'Bậc của em đã đổi sau lần lưu này — không hoàn tác em này.' : 'Bậc của em vừa được người khác sửa — mở lại panel.', { bac: em.khai.bac });
    }
    o.hoanTac?.(em);
    db().prepare(`UPDATE y_thuc_khai_bac SET bac = ?, thang = ?, ghi_chu = ?, sua_boi = ?, sua_luc = ? WHERE student_id = ? AND chuoi_cycle_id = ?`)
      .run(bac, thang, ghiChu, p.userId, nowIso(), studentId, em.khai.cycleId);
    writeAudit({ actorUserId: o.tuChot ? null : p.userId, action: o.hoanTac ? 'discipline.declare_level_undo' : 'discipline.declare_level_edit', entityType: 'student', entityId: studentId,
      entityLabel: `${hv.student_code} · ${o.hoanTac ? 'hoàn tác cấp bậc' : o.tuChot ? 'tự chốt vì hết hạn duyệt · sửa cấp bậc' : 'sửa cấp bậc'}`,
      /* Rà Hoàn tác 25/11: `before` đủ bậc · tháng · ghi chú · lộ trình — Hoàn tác lô đọc lại bản máy chủ ghi này (`banTruocCuaMinh`), không tin `truoc` web gửi. */
      before: { bac: em.khai.bac, thang: em.khai.thang, ghiChu: em.khai.ghiChu, cycleId: em.khai.cycleId }, after: { bac, thang, ghiChu, ...(o.yeuCauId ? { yeuCauId: o.yeuCauId } : {}) } });
    return { ok: true as const, bac };
  });
}

/**
 * N70 (chủ SP 24/11): ô thời điểm nhận NGÀY ('YYYY-MM-DD') hoặc THÁNG ('YYYY-MM') — lưu chung cột `thang`, đúng dạng đã nhập; không ở tương lai.
 * `daLuu`: giá trị đọc lại từ thẻ / dòng cũ (Hoàn tác, Head duyệt) — đã kiểm lúc gửi, không kiểm lại "tương lai" (đổi ngày demo không làm hỏng).
 */
export function kiemKhai(v: { bac?: unknown; thang?: unknown; ghiChu?: unknown }, daLuu = false) {
  const bac = Number(v.bac);
  /* Khai tối đa bậc 6 (WL 2) — hết mạch chính. ponytail: em đã qua Report 7+ trước khi dùng web thì khai WL 2, tăng dần trên web.
     OV-13d (Q5): bậc 0 = "Chưa có xử lý vi phạm" — xác nhận em chưa từng bị xử lý (thoát việc khai bậc, lần kế vẫn Report 1). */
  if (!Number.isInteger(bac) || bac < 0 || bac > THANG.length) throw badRequest('Chọn bậc đã xử lý: Chưa có xử lý vi phạm, Report 1 … WL 2.');
  const thangStr = String(v.thang ?? '').trim();
  const laThang = /^\d{4}-(0[1-9]|1[0-2])$/.test(thangStr);
  if (thangStr && !laThang && !(isIsoDate(thangStr) && new Date(`${thangStr}T00:00:00Z`).toISOString().slice(0, 10) === thangStr)) {
    throw badRequest('Ngày / tháng xử lý không hợp lệ — gõ dd/mm/yyyy hoặc mm/yyyy.');
  }
  if (thangStr && !daLuu && thangStr > (laThang ? demoToday().slice(0, 7) : demoToday())) throw badRequest('Ngày / tháng xử lý không được ở tương lai.');
  /* KHAI-BAC-LO (chủ SP 28/10): ghi chú TUỲ CHỌN — khai từng em và theo lô; rỗng lưu chuỗi rỗng (cột NOT NULL). */
  const ghiChu = String(v.ghiChu ?? '').trim();
  return { bac, thang: thangStr || null, ghiChu: ghiChu.slice(0, 500) };
}

// ---------------------------------------------------------------- Đã thực hiện (sau khi QL duyệt — V4-10)

/** RKC-3a (PTA 07/11 quyết 2): ngày thực hiện TRƯỚC ngày QL duyệt (ngoài đời làm trước khi QL bấm) → nhắc + xác nhận, không chặn. */
function hoiNgayTruocDuyet(m: { quyet_luc?: string | null }, performedOn: string): void {
  const duyet = m.quyet_luc ? String(m.quyet_luc).slice(0, 10) : null;
  if (duyet && performedOn < duyet) canXacNhan('Ngày thực hiện trước ngày Head duyệt ({x}) — vẫn lưu?', { x: duyet.split('-').reverse().join('/') }, 'Vẫn lưu');
}

/** YT-BAO-PH ([XM 1]): Meeting CX/GĐCN có PH dự (`phDu`, mặc định có) → việc Báo PH của TVV tự xong. */
export function daThucHien(p: Principal, measureId: number, v: { performedOn?: unknown; performerUserId?: unknown; performerName?: unknown; note?: unknown; phDu?: unknown }) {
  const m = db().prepare('SELECT * FROM discipline_measures WHERE id = ?').get(measureId) as any;
  if (!m) throw notFound('Không tìm thấy lần xử lý');
  const hv = hocVien(m.student_id);
  requireLamViecYThuc(p, m.student_id, MANAGE_MESSAGE, () => m.phu_trach_id);   // BAOPH-0 (4.6): + người được giao "Đã thực hiện"
  if (m.status !== 'da_duyet') throw badRequest('Chỉ lần xử lý Head đã duyệt mới bấm "Đã thực hiện".');
  const performedOn = ngayThucHien(v.performedOn);
  hoiNgayTruocDuyet(m, performedOn);
  const nguoi = nguoiThucHien(p, v);
  const them = String(v.note ?? '').trim();
  tx(() => {
    /* N66 (PTA rà #2016): GVCN sửa cấp bậc SAU khi đề xuất bậc thang này được tạo → đề xuất tính theo bậc cũ, ghi xong có thể nhảy qua bậc giữa.
       Chặn 409, không tự huỷ đề xuất (GVCN / Head mở lại: Rút / Thu hồi rồi đề xuất theo bậc mới). Ngoài thang không đổi bậc → không chặn. */
    const em = emCua(m.student_id);
    const doiBacSau = !!em.khai && em.khai.moc > String(m.created_at ?? '');
    /* Chỉ chặn khi CÓ lần khai / sửa sau đề xuất — bậc đổi vì lần xử lý thường (không ai sửa bậc) không chặn (rkcYThuc RKC3a-3). */
    if ((THANG as readonly string[]).includes(m.kind) && doiBacSau) {
      throw conflict('Bậc em đã đổi (GVCN sửa cấp bậc) — mở lại.', { bac: em.bac });
    }
    const doi = db().prepare(
      `UPDATE discipline_measures SET status = 'done', performed_on = ?, performed_by = ?, performer_name = ?, confirmed_by = ?, confirmed_at = ?,
              note = CASE WHEN ? = '' THEN note ELSE COALESCE(note || char(10), '') || ? END, updated_at = ?
        WHERE id = ? AND status = 'da_duyet'`,
    ).run(performedOn, nguoi.by, nguoi.ten, p.userId, nowIso(), them, them, nowIso(), measureId).changes;
    if (!doi) throw conflict('Lần xử lý này vừa được cập nhật — mở lại.');
    const phDu = m.kind === 'meeting_cx' && v.phDu !== false;
    if (phDu) xongBaoPhViMeeting(measureId, performedOn, `PH dự Meeting CX/GĐCN — GVCN ghi Đã thực hiện${them ? `: ${them}` : ''}`, p.userId);
    writeAudit({ actorUserId: p.userId, action: 'discipline.performed', entityType: 'discipline_measure', entityId: measureId,
      entityLabel: `${hv.student_code} · ${nhanLoaiXuLy(m.kind, m.custom_name)}`, after: { performedOn, ...(m.kind === 'meeting_cx' ? { phDu } : {}) } });
  });
  return xemXuLy(p, measureId);
}

/** OV-7a: "Đã thực hiện" bấm nhầm → "Chưa thực hiện": lần xử lý về QL đã duyệt, chờ thực hiện. Ghi chú giữ (không mất chữ); chỉ lần đã qua QL duyệt. */
export function chuaThucHien(p: Principal, measureId: number): XuLyView {
  const m = loadXuLy(measureId);
  const hv = hocVien(m.student_id);
  requireSuaXuLy(p, m);
  if (m.status !== 'done') throw badRequest('Lần xử lý này chưa ghi "Đã thực hiện".');
  if (!m.quyet_luc) throw badRequest('Lần xử lý này không qua Head duyệt — sửa hoặc Xoá lần xử lý.');
  tx(() => {
    const doi = db().prepare(
      `UPDATE discipline_measures SET status = 'da_duyet', performed_on = NULL, performed_by = NULL, performer_name = NULL, confirmed_by = NULL, confirmed_at = NULL,
              updated_at = ? WHERE id = ? AND status = 'done'`,
    ).run(nowIso(), measureId).changes;
    if (!doi) throw conflict('Lần xử lý này vừa được cập nhật — mở lại.');
    chotHanXuLy([m.student_id]);
    moLaiBaoPhMeeting(measureId);   // YT-BAO-PH: Báo PH tự xong vì Meeting → mở lại
    writeAudit({ actorUserId: p.userId, action: 'discipline.not_performed', entityType: 'discipline_measure', entityId: measureId,
      entityLabel: `${hv.student_code} · ${nhanLoaiXuLy(m.kind, m.custom_name)} · chưa thực hiện`,
      before: { status: 'done', performedOn: m.performed_on ?? null, performedBy: m.performed_by ?? null, performerName: m.performer_name ?? null }, after: { status: 'da_duyet' } });
  });
  return xemXuLy(p, measureId);
}

/**
 * OV-7a: sửa GHI CHÚ · NGÀY · NGƯỜI THỰC HIỆN của lần xử lý đã xong (cùng quyền Sửa vi phạm — GVCN em + QL). Chỉ trường có gửi mới đổi; kiểm như lúc
 * lưu (mô tả ≥ 8 — `MO_TA_MIN`, ngày ≤ hôm nay và từ ngày QL duyệt). Nhật ký trước → sau. Bậc không đổi (đọc từ loại) — hạn xử lý chốt lại như Sửa vi phạm.
 */
export function suaXuLy(p: Principal, measureId: number, v: { note?: unknown; performedOn?: unknown; performerSelf?: unknown; performerUserId?: unknown; performerName?: unknown }): XuLyView {
  const m = loadXuLy(measureId);
  const hv = hocVien(m.student_id);
  requireSuaXuLy(p, m);
  if (m.status !== 'done') throw badRequest('Chỉ sửa ngày / người / mô tả của lần xử lý đã thực hiện — đề xuất đang chờ thì sửa ở thẻ Chờ duyệt.');
  const note = v.note !== undefined ? moTa(v.note, m.note) : m.note;
  const performedOn = v.performedOn !== undefined ? ngayThucHien(v.performedOn) : m.performed_on;
  hoiNgayTruocDuyet(m, performedOn);
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
  /** YT-BAO-PH: TVV đã báo PH lần này (chỉ khi QL thu hồi thẳng được) — hộp Thu hồi hiện ô "Nhờ TVV báo lại PH". */
  daBaoPh: boolean;
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
  if (!lamXuLyDuocGiao(p, m)) requireViewStudent(p, m.student_id);   // rà #2233 P1-6: người được giao xem lại lần xử lý của mình
  const vIds = (db().prepare('SELECT violation_id FROM measure_violations WHERE measure_id = ? ORDER BY violation_id').all(id) as any[]).map((r) => r.violation_id);
  const cacThe = theCuaDoiTuong('discipline_measure', [id]);
  const the = cacThe.find((c) => c.loai === 'y_thuc') ?? null;
  const thuHoi = cacThe.find((c) => c.loai === 'thu_hoi_y_thuc') ?? null;
  const coTheSua = quyenSuaXuLy(p, m);
  const em = coTheSua ? emCua(m.student_id) : null;
  const sau = em ? lanSauCua(m, em) : null;
  const bacVe = em ? bacSauThuHoi(em, id) : null;   // RKC-3a: cả khi có lần sau (thu hồi lần giữa)
  return {
    id, studentId: m.student_id, ten: m.ten, kind: m.kind, nhan: nhanLoaiXuLy(m.kind, m.custom_name), customName: m.custom_name ?? null,
    status: m.status, statusLabel: (XU_LY_STATUS_LABEL as Record<string, string>)[m.status] ?? m.status, bac: bacCuaLoai(m.kind),
    note: m.note ?? null, performedOn: m.performed_on ?? null, nguoi: m.status === 'done' || m.status === 'thu_hoi' ? m.nguoi ?? null : null,
    nguoiId: m.performed_by ?? null, nguoiNgoai: m.performer_name ?? null,
    quyetLuc: m.quyet_luc ?? null, createdAt: m.created_at,
    viPham: violationsByIds(vIds), soTep: m.so_tep, canManage: canManageDiscipline(p, m.student_id) && m.status !== 'thu_hoi', the,
    coTheSua, coTheThuHoi: coTheSua && THU_HOI_DUOC.has(m.status) && thuHoi?.trangThai !== 'cho',   // RKC-3a: lần giữa thu hồi được (máy chủ hỏi nêu lần sau)
    lanSau: sau ? nhanLoaiXuLy(sau.kind, sau.custom_name) : null, bacVe, thuHoi,
    thuHoiThang: coTheSua && duyetYThuc(p, { studentId: m.student_id }),
    daBaoPh: coTheSua && THU_HOI_DUOC.has(m.status) && !!db().prepare("SELECT 1 FROM viec_bao_ph WHERE measure_id = ? AND trang_thai = 'xong'").get(id),
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
  viPham: (ViolationView & { soTep: number })[];
  macDinh: { tick: number[]; cuHon: number[] };
  dongThoiGian: DongThoiGianYt[];
  /** Dòng chữ cuối (K3 §4f): số vi phạm trong phạm vi, theo nhóm. */
  demCuoi: { tong: number; theoNhom: { nhom: string; so: number }[] };
  /** UI-Y-THUC-HV: dòng trạng thái "Duyệt · thu hồi | Báo PH (TVV)" — cùng hàng em của bảng lớp (`hangCuaEm`). */
  hang: Pick<DongEm, 'xuLyGanNhat' | 'tuChoi' | 'thuHoi' | 'baoPh'>;
  /** TINH-HINH: tình hình học tập hai chiều GV ↔ TVV của em (mới nhất trước). */
  tinhHinh: TinhHinhView[]; tvv: string | null;
  /** TINH-HINH: "Báo tình hình" (quyền ghi vi phạm) · "Hỏi tình hình" (TVV của em / cùng chi nhánh / QL — `coTheGhi`). */
  coTheBao: boolean; coTheHoi: boolean;
  /** MA-QL-VIEC (PTA 16/11): người xem xử lý được VÀ là người duyệt (QL / Quản trị) — cách khác Nâng 1 bậc lưu là chốt ngay ("Lưu xử lý"), không gửi rồi tự duyệt. */
  qlApThang: boolean;
  /** N70: người xem sửa bậc đã khai thì KHÔNG áp ngay — thành yêu cầu chờ Head (nút "Gửi Head duyệt"); Head / Quản trị = false (áp ngay). */
  suaKhaiCanDuyet: boolean;
  /** N70: người xem mở được hộp Chờ duyệt (Head / Quản trị) — liên kết "Mở Chờ duyệt ›" ở dải yêu cầu chờ; CX duyệt được thẻ nhưng không có hộp. */
  moHopDuyet: boolean;
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
  /* UI-3 (mockup K3 "2 tệp ›"): số tệp bằng chứng của các vi phạm đang hiện — một câu theo lô (một em, vài dòng). */
  const soTep = new Map<number, number>();
  if (viPham.length) for (const r of db().prepare(`SELECT owner_id, COUNT(*) AS n FROM attachments WHERE owner_type = 'violation' AND owner_id IN (${DS_JSON}) GROUP BY owner_id`)
    .all(JSON.stringify(viPham.map((v) => v.id))) as { owner_id: number; n: number }[]) soTep.set(r.owner_id, r.n);
  const quaHan = Math.max(0, ...[...em.viPham.values()].map((t) => t.quaHanNgay ?? 0)) || null;
  return {
    studentId, ten: hv.full_name, maHv: hv.student_code, homNay,
    canManage, canRecord: can(p, PERMISSIONS.VIOLATION_RECORD, { studentId, classId: em.lopId }),
    canSuaKhai: !!em.khai && (duyetYThuc(p, { studentId }) || (canManage && em.khai.coTheSua)),
    coTheKhai: canManage && khaiMoDuoc(em),   // N66: cả khi chuỗi đã có lần xử lý trên web
    qlApThang: canManage && duyetYThuc(p, { studentId }),
    suaKhaiCanDuyet: !!em.khai && canManage && !duyetYThuc(p, { studentId }),
    moHopDuyet: can(p, PERMISSIONS.REQUEST_APPROVE, { studentId }),
    chuoi: { nhan: em.nhanChuoi, cycleIds: em.chuoi, soXuLy: em.xuLy.filter((m) => m.status === 'done' && m.cycleId != null && em.chuoi.includes(m.cycleId)).length },
    bac: em.bac, bacNhan: em.bac > 0 ? nhanLoaiXuLy(kindCuaBac(em.bac)) : null,
    keTiep: { kind: em.keTiep.kind, nhan: nhanLoaiXuLy(em.keTiep.kind), bac: em.keTiep.bac },
    dongThang: dongThang(em.bac, em.khai),
    khai: em.khai,
    nhom: em.nhom, han: em.han, hanXem: em.hanXem, soBatBuoc: em.soBatBuoc, soMoi: em.soMoi, quaHanNgay: quaHan,
    deXuat: em.deXuat ? { id: em.deXuat.id, nhan: nhanLoaiXuLy(em.deXuat.kind, em.deXuat.customName), status: em.deXuat.status, han: em.deXuat.han, quaHan: em.deXuat.quaHan } : null,
    daBaoQl, phamVi, viPham: viPham.map((v) => ({ ...v, soTep: soTep.get(v.id) ?? 0 })),
    /* UI-3 (mockup U10 K3): "Người xử lý" — GVCN lớp em đang học (một câu, chỉ khi có). */
    gvcn: mot.gvcn ?? null,
    macDinh: macDinhTick(viPham.map((v) => ({ id: v.id, t: v.trangThai, occurredOn: v.occurredOn })), homNay),
    dongThoiGian: dongThoiGian([studentId], trang, { chiTrongChuoi: phamVi === 'chuoi', p, homNay }),
    hang: (({ xuLyGanNhat, tuChoi, thuHoi, baoPh }) => ({ xuLyGanNhat, tuChoi, thuHoi, baoPh }))(hangCuaEm(p, em, hv.full_name, hv.student_code, homNay)),
    tinhHinh: tinhHinhCuaEm(p, [studentId], homNay),
    /** Mockup v20 D1 "Lưu xong: TVV … nhận việc báo PH": TVV phụ trách em (cùng câu đọc học viên, không thêm câu). */
    tvv: hv.tvv ?? null,
    coTheBao: can(boVaiCx(p), PERMISSIONS.VIOLATION_RECORD, { studentId, classId: em.lopId }),   // A3-06: CX là phía TVV — mẫu "Hỏi tình hình", không "GV báo TVV"
    coTheHoi: coTheGhi(p, { consultant_user_id: hv.consultant_user_id ?? null, student_id: studentId }),
    demCuoi: {
      tong: viPham.length,
      theoNhom: [...demNhom.entries()].sort((a, b) => b[1] - a[1]).map(([k, so]) => ({ nhom: VIOLATION_CATEGORY_LABEL[k as ViolationCategory] ?? k, so })),
    },
  };
}

// ---------------------------------------------------------------- thông báo khi ghi vi phạm (V4-2, V4-5) — gọi từ violations.ts

/**
 * Sau khi ghi vi phạm (TRONG giao dịch ghi) của MỘT em — gọi một lần cho cả lần lưu, `violationId` = dòng cuối:
 *   · lần ghi làm em thành bắt buộc → GVCN: "Cần xử lý · {HV} · 3 vi phạm trong 2 tuần · trước dd/mm" (V4-2, việc `yt_xu_ly`). Dedup em + ngày.
 *   · còn lại, người ghi không phải GVCN → MỘT tin Cập nhật (LG-11, lời 47 — thay việc "Đã xem"): GVCN lớp em đang học, không có GVCN → Quản lý
 *     chi nhánh (trừ người ghi). Kể cả "Chỉ nhắc nhở". Không vào số việc (`discipline_de_biet` = Để biết); bấm / ✓ ghi `read_at`. Dedup theo vi phạm.
 */
export function baoKhiGhiViPham(p: Principal, studentId: number, violationId: number, category: string, truocBatBuoc: boolean, emSau?: EmYThuc,
  o: { chiNhac?: boolean; yeuCau?: boolean } = {}) {
  const em = emSau ?? emCua(studentId);
  if (em.tamDung || em.gvcnId === p.userId) return;
  const hv = hocVien(studentId);
  const homNay = demoToday();
  const nhom = VIOLATION_CATEGORY_LABEL[category as ViolationCategory] ?? category;
  /* LG-12: người ghi yêu cầu xử lý → GVCN (lớp không GVCN: Quản lý chi nhánh, trừ người ghi) có việc `yt_xu_ly` ngay; tin "Cần làm" (`discipline`,
     còn việc tới khi hết bắt buộc). Dedup theo vi phạm. Không tìm được hạn (em Tạm dừng…) thì bỏ vế "trước". */
  if (o.yeuCau) {
    const han = em.viPham.get(violationId)?.han ?? em.han;
    const nhan = em.gvcnId ? [em.gvcnId] : hv.branch_id ? quanLyCuaChiNhanh(hv.branch_id).filter((u) => u !== p.userId) : [];
    for (const userId of nhan) {
      notify({ userId, kind: 'discipline', title: han ? `Yêu cầu xử lý · ${hv.full_name} · ${nhom} · ${p.fullName} ghi · trước ${shortDate(han, homNay)}` : `Yêu cầu xử lý · ${hv.full_name} · ${nhom} · ${p.fullName} ghi`,
        entityType: 'student', entityId: studentId, dedupKey: `yt-yc:${violationId}`, duong: duongXuLy(studentId) });
    }
    return;
  }
  if (em.gvcnId && em.soBatBuoc > 0 && !truocBatBuoc) {
    notify({ userId: em.gvcnId, kind: 'discipline', title: `Cần xử lý · ${hv.full_name} · 3 vi phạm trong 2 tuần · trước ${shortDate(em.han, homNay)}`,
      entityType: 'student', entityId: studentId, dedupKey: `yt-bat-buoc:${studentId}:${homNay}`, duong: duongXuLy(studentId) });
    return;
  }
  const nguoiNhan = em.gvcnId ? [em.gvcnId] : hv.branch_id ? quanLyCuaChiNhanh(hv.branch_id).filter((u) => u !== p.userId) : [];
  for (const userId of nguoiNhan) {
    notify({ userId, kind: 'discipline_de_biet', title: o.chiNhac ? `Nhắc nhở · ${hv.full_name} · ${nhom} · ${p.fullName} ghi` : `Vi phạm mới · ${hv.full_name} · ${nhom} · ${p.fullName} ghi`,
      entityType: 'student', entityId: studentId, dedupKey: `yt-moi:${violationId}`, duong: duongHoSoHocVien(studentId, { tab: 'y-thuc' }) });
  }
}

// ---------------------------------------------------------------- "Không xử lý" vi phạm được yêu cầu (LG-12, chủ SP lời 47, 48)

const DONG_KX = `SELECT id, student_id, reported_by, ten, category, yeu_cau_xu_ly, khong_xu_ly_luc, khong_xu_ly_ly_do FROM violations WHERE id = ?`;
function viPhamYeuCau(p: Principal, violationId: number): { r: any; em: EmYThuc } {
  const r = db().prepare(DONG_KX).get(violationId) as any;
  if (!r) throw notFound('Không tìm thấy vi phạm');
  requireManageDiscipline(p, r.student_id, MANAGE_MESSAGE);
  const em = emCua(r.student_id);
  const t = em.viPham.get(r.id);
  if (t?.t === 'da_xu_ly' || t?.t === 'cho_duyet') throw conflict('Vi phạm này đã được xử lý hoặc đang chờ Head duyệt — mở lại panel.');
  return { r, em };
}
/** LG-12 (rà #1735 P1): Hoàn tác "Không xử lý" chỉ trong 60 giây — sau đó đổi ý thì Xác nhận xử lý (lời 48). */
export const HOAN_TAC_KHONG_XU_LY_MS = 60_000;

/**
 * GVCN (hoặc QL) "Không xử lý" một vi phạm ĐƯỢC YÊU CẦU, lý do ≥ 8 ký tự → việc `yt_xu_ly` do yêu cầu xong; người ghi nhận MỘT tin (lời 48: báo lại là xong).
 * Vi phạm GIỮ, vẫn đếm luật 3 / 2 tuần; Xác nhận xử lý sau vẫn được. Em đang đủ 3 vi phạm / 2 tuần (bắt buộc theo luật): GVCN → 400, không đổi gì;
 * N50 (5) (chủ SP 16/11, B1-12): Quản lý vượt được sau một câu hỏi nêu luật — như Ghi nhận (RKC-3a), nhật ký ghi `vuotLuat`.
 * Tính là phản hồi (`phan_hoi_ngay`) cho Phân tích "Xử lý vi phạm đúng hạn". Lịch sử: `violation_history` + nhật ký.
 */
export function khongXuLy(p: Principal, violationId: number, v: { lyDo?: unknown }): { ok: true; violation: ViolationView } {
  const { r, em: em0 } = viPhamYeuCau(p, violationId);
  if (!r.yeu_cau_xu_ly) throw badRequest('Vi phạm này không có yêu cầu xử lý.');
  if (r.khong_xu_ly_luc) throw conflict('Vi phạm này đã ghi "Không xử lý" — mở lại panel.');
  const lyDo = String(v.lyDo ?? '').trim();
  if (lyDo.length < CHU_TOI_THIEU) throw badRequest(`Lý do không xử lý: ít nhất ${CHU_TOI_THIEU} ký tự (gửi cho người ghi vi phạm).`);
  const lyDoLuu = chuTuDo(lyDo, 'Lý do', 500)!;
  /* Rà #1735 P2: vi phạm đang bắt buộc THEO LUẬT 3 (không chỉ vì yêu cầu) → chặn trước khi ghi, trạng thái đã nạp. */
  const vuotLuat = em0.batBuocLuat.has(r.id);
  if (vuotLuat) {
    if (!duyetYThuc(p, { studentId: r.student_id })) {
      throw badRequest('Em đang có 3 vi phạm trong 2 tuần — phải Xác nhận xử lý theo luật, không ghi "Không xử lý" được (Head vượt được).');
    }
    canXacNhan('Em đang có 3 vi phạm trong 2 tuần — vẫn "Không xử lý" (bỏ qua luật xử lý)?', undefined, 'Vẫn không xử lý');
  }
  const hv = hocVien(r.student_id);
  const luc = nowIso();
  tx(() => {
    db().prepare('UPDATE violations SET khong_xu_ly_luc = ?, khong_xu_ly_boi = ?, khong_xu_ly_ly_do = ?, khong_xu_ly_vuot = ? WHERE id = ?').run(luc, p.userId, lyDoLuu, vuotLuat ? 1 : 0, r.id);
    ghiPhanHoi([r.id]);
    xoaNho();
    chotHanXuLy([r.student_id]);
    addHistory(r.id, 'khong_xu_ly', null, lyDoLuu, p.userId, lyDoLuu);
    writeAudit({ actorUserId: p.userId, action: 'violation.khong_xu_ly', entityType: 'violation', entityId: r.id,
      entityLabel: `${hv.student_code} · Không xử lý`, after: { lyDo: lyDoLuu, ...(vuotLuat ? { vuotLuat: true } : {}) } });
    if (r.reported_by !== p.userId) {
      const ten = r.ten || (VIOLATION_CATEGORY_LABEL[r.category as ViolationCategory] ?? r.category);
      notify({ userId: r.reported_by, kind: 'discipline_de_biet', title: `Không xử lý vi phạm · ${hv.full_name} · ${ten} · ${p.fullName}`, body: lyDoLuu.slice(0, 120),
        entityType: 'student', entityId: r.student_id, dedupKey: `yt-khong:${r.id}:${luc}`, duong: duongHoSoHocVien(r.student_id, { tab: 'y-thuc' }) });
    }
  });
  xoaNho();
  return { ok: true, violation: violationsByIds([r.id])[0] };
}

/** Hoàn tác "Không xử lý": vi phạm về được yêu cầu (việc `yt_xu_ly` lại có, hạn cũ); tin chưa đọc của người ghi bị gỡ; lịch sử + nhật ký. */
export function hoanTacKhongXuLy(p: Principal, violationId: number): { ok: true; violation: ViolationView } {
  const { r } = viPhamYeuCau(p, violationId);
  if (!r.khong_xu_ly_luc) throw conflict('Vi phạm này chưa ghi "Không xử lý" — mở lại panel.');
  if (Date.now() - Date.parse(r.khong_xu_ly_luc) > HOAN_TAC_KHONG_XU_LY_MS) {
    throw conflict('Quá thời gian Hoàn tác — muốn xử lý thì bấm Xác nhận xử lý.');
  }
  const hv = hocVien(r.student_id);
  tx(() => {
    db().prepare('UPDATE violations SET khong_xu_ly_luc = NULL, khong_xu_ly_boi = NULL, khong_xu_ly_ly_do = NULL, khong_xu_ly_vuot = 0 WHERE id = ?').run(r.id);
    /* Phản hồi do chính "Không xử lý" ghi (vi phạm chưa nằm trong lần xử lý nào) → bỏ, để Phân tích đo lại theo lần phản hồi thật. */
    db().prepare(`UPDATE violations SET phan_hoi_ngay = NULL WHERE id = ? AND NOT EXISTS (SELECT 1 FROM measure_violations mv WHERE mv.violation_id = violations.id)`).run(r.id);
    xoaNho();
    chotHanXuLy([r.student_id], { trang: new Map([[r.student_id, emCua(r.student_id)]]) });
    addHistory(r.id, 'khong_xu_ly', r.khong_xu_ly_ly_do, null, p.userId, 'Hoàn tác');
    writeAudit({ actorUserId: p.userId, action: 'violation.khong_xu_ly.hoan_tac', entityType: 'violation', entityId: r.id,
      entityLabel: `${hv.student_code} · Hoàn tác Không xử lý`, before: { lyDo: r.khong_xu_ly_ly_do } });
    db().prepare('DELETE FROM notifications WHERE dedup_key = ? AND read_at IS NULL').run(`yt-khong:${r.id}:${r.khong_xu_ly_luc}`);
  });
  xoaNho();
  return { ok: true, violation: violationsByIds([r.id])[0] };
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
 * bậc em không đổi vì `bacHienTai` = max). Mô tả (lý do) ≥ 8 ký tự, bắt buộc.
 */
export function deXuat(p: Principal, studentId: number, v: { kind?: unknown; customName?: unknown; violationIds?: unknown; note?: unknown }) {
  const hv = hocVien(studentId);
  requireLamViecYThuc(p, studentId, MANAGE_MESSAGE, ptXuLy(studentId));   // BAOPH-0 (4.6)
  const kind = String(v.kind ?? '') as MeasureKind;
  const em = emCua(studentId);
  if (!deXuatHopLe(kind, em.bac)) {
    throw badRequest('Chọn cách cần Head duyệt: Không nâng (bậc hiện tại hoặc thấp hơn) · Vượt bậc (cao hơn bậc kế) · Ngoài thang (WL 3 · Meeting CX/GĐCN · Đình chỉ học tạm thời · Khác).');
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
  const khoaTep: string[] = [];
  const kq = tx(() => {
    /* #6 (G3-4): nháp cũ của CHÍNH người này cho em này (đóng tab giữa lúc gửi) dọn trước khi tạo nháp mới — không còn nháp mồ côi. */
    for (const cu of db().prepare(`SELECT id FROM discipline_measures WHERE student_id = ? AND created_by = ? AND status = 'nhap'`).all(studentId, p.userId) as { id: number }[]) {
      purgeAttachmentsOf('discipline_measure', cu.id, p.userId, khoaTep);
      db().prepare('DELETE FROM measure_violations WHERE measure_id = ?').run(cu.id);
      db().prepare(`DELETE FROM discipline_measures WHERE id = ? AND status = 'nhap'`).run(cu.id);
    }
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
  xoaTepSauGiaoDich(khoaTep);
  return kq;
}

/** LUAT-5: loại thang ở bậc hiện tại hoặc thấp hơn = "xử lý không tăng bậc" (em chưa có bậc thì không có). */
const khongTangBac = (kind: string, bac: number): boolean => (THANG as readonly string[]).includes(kind) && bacCuaLoai(kind) <= bac;
/** TINH-HINH: "Vượt bậc" — bậc thang cao hơn bậc kế (bậc + 1). */
const vuotBac = (kind: string, bac: number): boolean => (THANG as readonly string[]).includes(kind) && bacCuaLoai(kind) > bac + 1;
/** Cách khác mặc định cần QL: Không nâng · Vượt bậc · Ngoài thang. */
const deXuatHopLe = (kind: string, bac: number): boolean => (NGOAI_THANG as readonly string[]).includes(kind) || khongTangBac(kind, bac) || vuotBac(kind, bac);
/** Cách của đề xuất (thẻ QL, web) — tính lúc gửi. */
export const cachDeXuat = (kind: string, bac: number): 'ngoai' | 'khong_nang' | 'vuot' =>
  ((NGOAI_THANG as readonly string[]).includes(kind) ? 'ngoai' : khongTangBac(kind, bac) ? 'khong_nang' : 'vuot');
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
  requireLamViecYThuc(p, m.student_id, MANAGE_MESSAGE, ptXuLy(m.student_id));   // BAOPH-0 (4.6)
  if (m.status !== 'nhap') throw badRequest('Đề xuất này đã gửi rồi.');
  const tep = (db().prepare(`SELECT id FROM attachments WHERE owner_type = 'discipline_measure' AND owner_id = ? ORDER BY id`).all(measureId) as any[]).map((r) => r.id as number);
  if (!tep.length && canTep(m.kind)) throw badRequest('Cần đính kèm tệp hoặc liên kết làm bằng chứng trước khi gửi Head.');
  /* MA-QL-VIEC (PTA 16/11): người gửi là người duyệt (QL / Quản trị trong phạm vi em) → ÁP THẲNG một bước: không thẻ Chờ duyệt, chốt ngay như Duyệt
     (`chotDeXuatYThuc`: da_duyet + việc Báo PH TVV + tin GVCN). GVCN vẫn gửi QL duyệt như cũ. Sai: Thu hồi ở lần xử lý (QL thu hồi ngay). */
  if (duyetYThuc(p, { studentId: m.student_id })) {
    tx(() => {
      const em = emCua(m.student_id);
      const vIds = (db().prepare('SELECT violation_id FROM measure_violations WHERE measure_id = ?').all(measureId) as any[]).map((r) => r.violation_id);
      viPhamChon(em, vIds);
      if (!deXuatHopLe(m.kind, em.bac)) throw badRequest('Bậc đã đổi — mở lại panel.');
      const doi = db().prepare(`UPDATE discipline_measures SET status = 'cho_duyet', confirmed_by = ?, confirmed_at = ?, updated_at = ? WHERE id = ? AND status = 'nhap'`)
        .run(p.userId, nowIso(), nowIso(), measureId).changes;
      if (!doi) throw conflict('Đề xuất này vừa được gửi — mở lại.');
      ghiPhanHoi(vIds);
      chotDeXuatYThuc(measureId, demoToday(), p.userId);
      xongViecXuLy([m.student_id]);   // BAOPH-0 (4.6)
      writeAudit({ actorUserId: p.userId, action: 'discipline.apply', entityType: 'discipline_measure', entityId: measureId,
        entityLabel: `${hv.student_code} · Head áp ${nhanLoaiXuLy(m.kind, m.custom_name)}`,
        after: { kind: m.kind, cach: cachDeXuat(m.kind, em.bac), violations: vIds, bangChung: tep } });
    });
    return xemXuLy(p, measureId);
  }
  tx(() => {
    const em = emCua(m.student_id);
    const vIds = (db().prepare('SELECT violation_id FROM measure_violations WHERE measure_id = ?').all(measureId) as any[]).map((r) => r.violation_id);
    viPhamChon(em, vIds);
    const doi = db().prepare(`UPDATE discipline_measures SET status = 'cho_duyet', updated_at = ? WHERE id = ? AND status = 'nhap'`).run(nowIso(), measureId).changes;
    if (!doi) throw conflict('Đề xuất này vừa được gửi — mở lại.');
    ghiPhanHoi(vIds);
    if (!deXuatHopLe(m.kind, em.bac)) throw badRequest('Bậc đã đổi — mở lại panel.');
    /* LOI-4b: người được giao lúc gửi (null = GVCN theo luật) — Head từ chối so với giá trị này, không so GVCN lúc quyết (lớp đổi GVCN giữa chừng). */
    const giao = ptXuLy(m.student_id)() ?? null;
    xongViecXuLy([m.student_id]);   // BAOPH-0 (4.6): Xử lý vi phạm rời việc cần làm khi chờ Head — khối giao việc của đợt này kết thúc
    taoYeuCau(db(), {
      loai: 'y_thuc', doiTuongLoai: 'discipline_measure', doiTuongId: measureId, hocVienId: m.student_id, lopId: em.lopId,
      nguoiXin: p.userId, lyDo: m.note, bangChung: tep,
      duLieu: { kind: m.kind, customName: m.custom_name ?? null, bacKe: nhanLoaiXuLy(em.keTiep.kind), soViPham: vIds.length, soTep: tep.length, cach: cachDeXuat(m.kind, em.bac), giao },
    });
    /* N1 (sửa 12/11): lần chờ QL KHÔNG sinh việc TVV — sinh khi QL duyệt hoặc tự chốt (`chotDeXuatYThuc`). */
    writeAudit({ actorUserId: p.userId, action: 'discipline.propose', entityType: 'discipline_measure', entityId: measureId,
      entityLabel: `${hv.student_code} · gửi Head ${nhanLoaiXuLy(m.kind, m.custom_name)}`, after: { bangChung: tep } });
  });
  return xemXuLy(p, measureId);
}

// ---------------------------------------------------------------- Sửa / Xoá lần xử lý đã xác nhận (PR-LUI-a1)

/** OV-7a (chủ SP 13/10, thay Q5 06/10): ai lưu được thì sửa được — GVCN lớp em (cả lần đã thực hiện) + QL / Quản trị. Lần nháp đi `xoaNhap`. */
function quyenSuaXuLy(p: Principal, m: any): boolean {
  if (m.status === 'nhap' || m.status === 'thu_hoi') return false;
  return duyetYThuc(p, { studentId: m.student_id }) || canManageDiscipline(p, m.student_id) || lamXuLyDuocGiao(p, m);   // rà vòng 2 P2 (2): người được giao đợt này
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
    /* TL-1 (rà #1927 (2)): vi phạm vào / ra lần xử lý → "Chờ GV sửa" của Báo PH theo yêu cầu còn mở của lần đó (hết dừng → tính lại hạn). */
    const bp = db().prepare('SELECT id FROM viec_bao_ph WHERE measure_id = ?').get(measureId) as { id: number } | undefined;
    if (bp) dongBoTamDung([bp.id], p.userId, true);
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
  return bacHienTai(em.xuLy.filter((x) => x.id !== id && x.status === 'done' && (!em.chuoi.length || (x.cycleId != null && em.chuoi.includes(x.cycleId)))), em.khai?.bac ?? null, em.khai?.moc ?? null);
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
  const m = db().prepare('SELECT * FROM discipline_measures WHERE id = ?').get(measureId) as any;
  if (!m) return;   // lần xử lý không còn — luật của loại báo lỗi riêng
  /* BAOPH-0 (rà #2233 vòng 2 P2 (2)): người được giao Xử lý vi phạm đợt này sửa / rút / Hoàn tác rút đề xuất mình gửi. */
  if (!duyetYThuc(p, { studentId: m.student_id }) && !canManageDiscipline(p, m.student_id) && !lamXuLyDuocGiao(p, m)) {
    throw forbidden('Bạn không còn phụ trách lớp của em — không sửa hoặc rút được yêu cầu này. Head chi nhánh xử lý yêu cầu trong Chờ duyệt.');
  }
}

/**
 * Đã có lần xử lý SAU lần này trong chuỗi — kiểm lúc gửi, lúc QL duyệt và lúc huỷ quyết định. RKC-3a (chủ SP 07/11 "không chặn cứng"; trước: chặn "thu hồi
 * {lần sau} trước"): HỎI một câu nêu lần sau giữ nguyên + bậc tính lại (bậc = max các lần còn tính, nên không chồng sai).
 */
function hoiLanSau(m: any, thuHoi: boolean): void {
  const em = emCua(m.student_id);
  const sau = lanSauCua(m, em);
  if (!sau) return;
  const ten = nhanLoaiXuLy(sau.kind, sau.custom_name);
  if (thuHoi) canXacNhan('Đã có {ten} sau lần này — vẫn thu hồi? {ten} giữ nguyên, bậc tính lại.', { ten }, 'Vẫn thu hồi');
  else canXacNhan('Đã có {ten} sau lần này — vẫn huỷ quyết định thu hồi? Bậc tính lại.', { ten }, 'Vẫn huỷ');
}

/** Đường DELETE cũ (PR-LUI-a1). Luật 5: lần xử lý đã lưu không xoá — GVCN 403 (gửi QL thu hồi), QL 400 (Thu hồi kèm lý do). Không xoá vật lý. */
export function xoaXuLy(p: Principal, measureId: number): never {
  const m = loadXuLy(measureId);
  requireSuaXuLy(p, m);
  if (!duyetYThuc(p, { studentId: m.student_id })) throw forbidden('Lần xử lý đã lưu không xoá được — bấm "Thu hồi…" để gửi Head duyệt.');
  throw badRequest('Lần xử lý đã lưu không xoá được — bấm "Thu hồi…" và ghi lý do.');
}

/**
 * THU HỒI (luật 5): lý do bắt buộc · lần mới nhất của chuỗi · đã thực hiện hoặc QL đã duyệt. GVCN → thẻ `thu_hoi_y_thuc` (lần xử lý VẪN tính tới khi QL
 * duyệt; đã có thẻ chờ → 400). QL trong phạm vi em (C26) → áp thẳng; thẻ đóng "tự duyệt" (Quản trị được báo — Q-D) làm lịch sử ai · lúc · lý do.
 */
/** YT-BAO-PH ([XM 1]): `baoLai` (mặc định bật) — TVV đã báo PH thì sinh việc "Báo lại PH" khi thu hồi được áp. */
export function thuHoiXuLy(p: Principal, measureId: number, v: { lyDo?: unknown; baoLai?: unknown }): XuLyView {
  const m = loadXuLy(measureId);
  const hv = hocVien(m.student_id);
  requireSuaXuLy(p, m);
  const lyDo = chuTuDo(v.lyDo, 'Lý do', 2000) ?? '';
  if (lyDo.length < CHU_TOI_THIEU) throw badRequest(`Ghi lý do thu hồi (ít nhất ${CHU_TOI_THIEU} ký tự).`);   // RA-2511 (N50 ⑥): một ngưỡng cho mọi ô lý do
  if (!THU_HOI_DUOC.has(m.status)) {
    throw badRequest(m.status === 'cho_duyet' ? 'Đề xuất đang chờ Head — dùng Rút đề xuất.' : 'Lần xử lý bị Head từ chối không tính bậc — không cần thu hồi.');
  }
  const ql = duyetYThuc(p, { studentId: m.student_id });
  tx(() => {
    hoiLanSau(m, true);
    const em = emCua(m.student_id);
    const id = taoYeuCau(db(), {
      ...theThuHoi(measureId), hocVienId: m.student_id, lopId: em.lopId, nguoiXin: p.userId, lyDo, khongBao: ql,
      duLieu: { kind: m.kind, customName: m.custom_name ?? null, bacVe: bacSauThuHoi(em, measureId), soViPham: viPhamCua(measureId).length },
    });
    if (id === null) throw badRequest('Lần xử lý này đang chờ Head duyệt thu hồi.');
    if (ql) {
      apDungThuHoi(p.userId, m, hv, lyDo, v.baoLai !== false);
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
function apDungThuHoi(boi: number | null, m: any, hv: { student_code: string }, lyDo: string, baoLai: boolean, tuChot = false): void {
  const doi = db().prepare(`UPDATE discipline_measures SET status = 'thu_hoi', updated_at = ? WHERE id = ? AND status IN ('done', 'da_duyet')`)
    .run(nowIso(), m.id).changes;
  if (!doi) throw conflict('Lần xử lý này vừa được cập nhật — mở lại.');
  const vIds = viPhamCua(m.id);
  for (const vid of vIds) noteMeasureChange(vid, m.id, null, boi);
  chotHanXuLy([m.student_id]);
  /* TL-1 (N61, PTA chốt rà #1927): thu hồi CHỐT (Head làm thẳng / duyệt / tự chốt) → yêu cầu trả lại cả lần còn mở đóng "thu hồi" — trước khi Báo PH đóng.
     GVCN mới gửi chờ duyệt: yêu cầu còn mở, Báo PH vẫn "Chờ GV sửa". */
  dongTheoDuongSanCo({ measureId: m.id }, 'thu_hoi', boi);
  dongViecTheoXuLy(m.id, 'system_thu_hoi', lyDo, boi, { baoLai });
  const daBaoPh = !!db().prepare("SELECT 1 FROM sos_coordination_actions WHERE student_id = ? AND kind = 'bao_ph_tvv' AND status = 'done' LIMIT 1").get(m.student_id);
  writeAudit({ actorUserId: boi, action: 'discipline.revoke', entityType: 'discipline_measure', entityId: m.id,
    entityLabel: `${hv.student_code} · ${tuChot ? 'tự chốt vì hết hạn duyệt · ' : ''}thu hồi ${nhanLoaiXuLy(m.kind, m.custom_name)}`,
    before: { status: m.status, kind: m.kind, violations: vIds, daBaoPhuHuynh: daBaoPh }, after: { status: 'thu_hoi', lyDo, baoLai, ...(tuChot ? { tuChot: true } : {}) } });
}

/** Hộp Chờ duyệt: QL Duyệt thẻ thu hồi (TRONG tx của hộp) — kiểm lại như lúc gửi rồi áp. */
export function duyetThuHoiYThuc(p: Principal, measureId: number, lyDo: string, baoLai = true): void {
  const m = loadXuLy(measureId);
  if (!THU_HOI_DUOC.has(m.status)) throw badRequest('Lần xử lý này không còn để thu hồi. Danh sách đã được làm mới.');
  hoiLanSau(m, true);
  apDungThuHoi(p.userId, m, hocVien(m.student_id), lyDo, baoLai);
}

/**
 * QL Huỷ quyết định duyệt thu hồi bấm nhầm (trong ngày — PR-LUI-a2, TRONG tx của hộp): lần xử lý về như trước — đã thực hiện (có ngày thực hiện) hoặc
 * đã duyệt chờ thực hiện. Chặn khi đã có lần sau, hoặc vi phạm của lần này đã vào lần xử lý khác (bậc / vi phạm sẽ đếm hai lần).
 */
export function huyThuHoiYThuc(p: Principal, measureId: number): void {
  const m = loadXuLy(measureId);
  if (m.status !== 'thu_hoi') throw badRequest('Lần xử lý này không còn ở trạng thái Đã thu hồi.');
  hoiLanSau(m, false);
  const vIds = viPhamCua(measureId);
  const dung = vIds.length && db().prepare(
    `SELECT 1 FROM measure_violations mv JOIN discipline_measures x ON x.id = mv.measure_id
      WHERE mv.violation_id IN (${vIds.map(() => '?').join(',')}) AND x.id != ? AND x.status IN ('done', 'cho_duyet', 'da_duyet') LIMIT 1`,
  ).get(...vIds, measureId);
  if (dung) throw badRequest('Vi phạm của lần này đã nằm trong lần xử lý khác — không huỷ quyết định được.');
  /* RKC-3a: đã khai cấp bậc sau khi thu hồi → vẫn huỷ được (bậc = max(lần xử lý, bậc khai), không đếm hai lần) — trước đây chặn. */
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
  if (m.status !== 'cho_duyet') throw badRequest('Đề xuất này không còn chờ Head duyệt.');
  xoaXuLyTrongTx(p, m, hocVien(m.student_id), khoaTep, 'Người gửi đã rút');
}

/** OV-7a: GVCN sửa GHI CHÚ của đề xuất còn chờ (từ `suaYeuCau`) — kiểm như lúc gửi; bằng chứng đếm lại cho thẻ. Trả phần thẻ đổi theo. */
export function suaDeXuatYThuc(measureId: number, note: unknown): { lyDo: string; bangChung: number[]; soTep: number } {
  const m = loadXuLy(measureId);
  if (m.status !== 'cho_duyet') throw badRequest('Đề xuất này không còn chờ Head duyệt.');
  const ghi = moTa(note, m.note);
  const tep = (db().prepare(`SELECT id FROM attachments WHERE owner_type = 'discipline_measure' AND owner_id = ? ORDER BY id`).all(measureId) as any[]).map((r) => r.id as number);
  if (!tep.length && canTep(m.kind)) throw badRequest('Cần đính kèm tệp hoặc liên kết làm bằng chứng trước khi gửi Head.');
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
  xoaTraLaiCuaXuLy(measureId);   // TL-1: lần xử lý bị xoá — yêu cầu trả lại cả lần gỡ theo
  if (!db().prepare(`DELETE FROM discipline_measures WHERE id = ? AND status = 'cho_duyet'`).run(measureId).changes) throw conflict('Đề xuất này không còn chờ Head duyệt — mở lại.');
  chotYeuCau(db(), { loai: 'y_thuc', doiTuongLoai: 'discipline_measure', doiTuongId: measureId }, 'tu_dong', { lyDo: lyDoDong });
  chotHanXuLy([m.student_id]);
  /* RA-2711: rút đề xuất → việc "Xử lý vi phạm" về người được giao / hạn như trước (như Hoàn tác) — trước dòng còn 'xong': người được giao mất việc, lập lại bị 403. */
  db().prepare(`UPDATE viec_xu_ly SET trang_thai = 'mo' WHERE id = ? AND trang_thai = 'xong'`).run(m.student_id);
  writeAudit({ actorUserId: p.userId, action: 'discipline.delete', entityType: 'discipline_measure', entityId: measureId,
    entityLabel: `${hv.student_code} · xoá ${nhanLoaiXuLy(m.kind, m.custom_name)}`,
    before: { studentId: m.student_id, kind: m.kind, customName: m.custom_name ?? null, status: m.status, note: m.note ?? null, performedOn: m.performed_on ?? null,
      performedBy: m.performed_by ?? null, performerName: m.performer_name ?? null, createdBy: m.created_by, violations: vIds, attachments: files, daBaoPhuHuynh: daBaoPh } });
}

/** Đóng panel giữa chừng: xoá NHÁP (chỉ `nhap`). Tệp trong kho xoá SAU khi giao dịch chốt. Nháp bỏ dở (đóng tab) dọn ở lần `deXuat` sau của cùng người · cùng em (#6). */
export function xoaNhap(p: Principal, measureId: number): { ok: true } {
  const m = db().prepare('SELECT id, student_id, status, created_by FROM discipline_measures WHERE id = ?').get(measureId) as any;
  if (!m) throw notFound('Không tìm thấy đề xuất');
  if (!lamXuLyDuocGiao(p, m)) requireManageDiscipline(p, m.student_id, MANAGE_MESSAGE);   // rà #2233 P1-6
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

// ---------------------------------------------------------------- [XM 5] Hoàn tác Xác nhận xử lý (10 s)

/** Toast 10 s + trễ mạng: máy chủ nhận Hoàn tác trong 60 s kể từ lúc lưu. */
const HOAN_TAC_XU_LY_GIAY = 60;

/**
 * [XM 5] (PTA Plan 11/11 duyệt, theo lời chủ SP mới hơn B15 / LUAT-5: 07/11 "mở mọi chặn cứng", 11/11 #10 "Hoàn tác 10 s ở mọi nơi"): người VỪA lưu
 * Xác nhận xử lý bấm Hoàn tác ở toast → xoá hẳn lần xử lý + việc Báo PH (TVV chưa ghi), vi phạm về như trước. Quá hạn / TVV đã ghi / đã có lần sau /
 * lần qua QL duyệt → 400, dùng Thu hồi như cũ. Nhật ký `discipline.measure_undo` đủ nội dung.
 */
export function hoanTacXuLy(p: Principal, measureId: number): { ok: true } {
  const m = loadXuLy(measureId);
  const hv = hocVien(m.student_id);
  if (!lamXuLyDuocGiao(p, m)) requireManageDiscipline(p, m.student_id, MANAGE_MESSAGE);   // rà #2233 P1-6 (Hoàn tác chỉ lần của chính mình — kiểm dưới)
  const chuaXong = 'Quá thời gian Hoàn tác — dùng Thu hồi… ở lần xử lý.';
  if (m.status !== 'done' || m.quyet_luc || m.created_by !== p.userId) throw badRequest(chuaXong);
  if (Date.now() - Date.parse(m.created_at) > HOAN_TAC_XU_LY_GIAY * 1000) throw badRequest(chuaXong);
  const viec = db().prepare('SELECT id FROM viec_bao_ph WHERE measure_id = ?').get(measureId) as { id: number } | undefined;
  if (viec && db().prepare('SELECT 1 FROM viec_bao_ph_lan WHERE viec_id = ? LIMIT 1').get(viec.id)) throw badRequest('TVV đã ghi báo PH cho lần này — dùng Thu hồi… ở lần xử lý.');
  if (db().prepare(`SELECT 1 FROM discipline_measures WHERE student_id = ? AND id > ? AND status != 'nhap' LIMIT 1`).get(m.student_id, measureId)) {
    throw badRequest('Đã có lần xử lý sau lần này — dùng Thu hồi… ở lần xử lý.');
  }
  const vIds = viPhamCua(measureId);
  const khoaTep: string[] = [];
  tx(() => {
    purgeAttachmentsOf('discipline_measure', measureId, p.userId, khoaTep);
    if (viec) { db().prepare('DELETE FROM viec_bao_ph WHERE id = ?').run(viec.id); donViec('bao_ph', [viec.id]); }   // GV-1: id dùng lại — dọn người theo dõi / lịch sử
    xoaTraLaiCuaXuLy(measureId);   // TL-1: yêu cầu trả lại cả lần (≤ 60 giây sau lưu) gỡ cùng lần xử lý
    db().prepare('DELETE FROM measure_violations WHERE measure_id = ?').run(measureId);
    db().prepare(`DELETE FROM notifications WHERE dedup_key = ?`).run(`yt-xu-ly:${measureId}`);
    db().prepare(`DELETE FROM discipline_measures WHERE id = ? AND status = 'done'`).run(measureId);
    for (const vid of vIds) noteMeasureChange(vid, measureId, null, p.userId);
    /* ponytail: phản hồi đặt hôm nay bởi chính lần này → gỡ khi vi phạm không còn dấu khác (chưa Đã xem, không lần xử lý khác); dấu cũ hơn giữ. */
    if (vIds.length) {
      db().prepare(`UPDATE violations SET phan_hoi_ngay = NULL WHERE id IN (${vIds.map(() => '?').join(',')}) AND phan_hoi_ngay = ? AND ghi_nhan_luc IS NULL
        AND NOT EXISTS (SELECT 1 FROM measure_violations mv WHERE mv.violation_id = violations.id)`).run(...vIds, demoToday());
    }
    chotHanXuLy([m.student_id]);
    db().prepare(`UPDATE viec_xu_ly SET trang_thai = 'mo' WHERE id = ? AND trang_thai = 'xong'`).run(m.student_id);   // rà #2233 P2-1: Hoàn tác → người được giao / hạn về như trước
    writeAudit({ actorUserId: p.userId, action: 'discipline.measure_undo', entityType: 'discipline_measure', entityId: measureId,
      entityLabel: `${hv.student_code} · hoàn tác ${nhanLoaiXuLy(m.kind, m.custom_name)}`,
      before: { studentId: m.student_id, kind: m.kind, status: m.status, note: m.note ?? null, performedOn: m.performed_on ?? null, violations: vIds } });
  });
  xoaTepSauGiaoDich(khoaTep);
  return { ok: true };
}

// ---------------------------------------------------------------- #6 (rà 11/11 G3-7, G3-8) — ai biết khi QL duyệt đề xuất

/** CX còn hoạt động của chi nhánh (vai toàn hệ thống: `branch_id` NULL). */
function cxCuaChiNhanh(branchId: number | null): number[] {
  return (db().prepare(
    `SELECT DISTINCT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN users u ON u.id = ur.user_id
      WHERE r.key = 'cx' AND ur.status = 'active' AND u.status = 'active' AND u.deleted_at IS NULL AND (ur.branch_id IS NULL OR ur.branch_id IS ?)`,
  ).all(branchId) as any[]).map((r) => r.id as number);
}

/**
 * TRONG tx của Duyệt thẻ `y_thuc`: GVCN lớp em (+ người gửi) có tin "Cần làm" kèm hạn, mở thẳng việc "Đánh dấu đã thực hiện" (rời nhóm khi lần xử lý
 * hết "đã duyệt"); Meeting CX/GĐCN → CX chi nhánh "Để biết" (người dự họp). Thay tin chung "Yêu cầu … · Đã duyệt" (Để biết) của hộp duyệt.
 */
export function baoSauDuyetDeXuat(boi: number | null, measureId: number, homNay: string, tuChot = false): void {
  const m = db().prepare('SELECT id, student_id, kind, custom_name, created_by FROM discipline_measures WHERE id = ?').get(measureId) as any;
  if (!m) return;
  const em = emCua(m.student_id); const hv = hocVien(m.student_id);
  const nhan = nhanLoaiXuLy(m.kind, m.custom_name);
  const lop = em.lopId ? db().prepare('SELECT code, branch_id FROM classes WHERE id = ?').get(em.lopId) as { code: string; branch_id: number | null } | undefined : undefined;
  for (const uid of new Set([em.gvcnId, m.created_by].filter((x): x is number => !!x && x !== boi))) {
    notify({ userId: uid, kind: 'yt_da_duyet', title: `${tuChot ? 'Tự chốt' : 'Head đã duyệt'} ${nhan} · ${hv.full_name} · ghi "Đã thực hiện"`,
      entityType: 'discipline_measure', entityId: measureId, dedupKey: `yt-da-duyet:${measureId}`,
      duong: `/cong-viec?viec=${encodeURIComponent(`yt_thuc_hien:${measureId}`)}`, han: hanTheoNgay(homNay, hanTai('xu_ly_vi_pham', homNay).ngay) });
  }
  if (m.kind !== 'meeting_cx') return;
  const maLop = lop?.code ?? '—';
  const gvcn = em.gvcnId ? (db().prepare('SELECT full_name FROM users WHERE id = ?').get(em.gvcnId) as { full_name: string } | undefined)?.full_name : undefined;
  for (const uid of cxCuaChiNhanh(lop?.branch_id ?? hv.branch_id)) {
    if (uid === boi) continue;
    notify({ userId: uid, kind: 'discipline_de_biet', title: `Có Meeting CX/GĐCN · ${hv.full_name} · ${maLop}`,
      body: gvcn ? `GVCN ${gvcn}` : null, entityType: 'discipline_measure', entityId: measureId, dedupKey: `yt-meeting-cx:${measureId}`,
      duong: duongHoSoHocVien(m.student_id, { tab: 'y-thuc' }) });
  }
}

/**
 * TINH-HINH — CHỐT một đề xuất Ý thức (QL Duyệt, hoặc quá hạn tự chốt theo GVCN): `cho_duyet` → `da_duyet` + việc Báo PH của TVV (N1 sửa 12/11) +
 * tin "ghi Đã thực hiện" cho GVCN (+ CX khi Meeting). Gọi TRONG giao dịch của nơi gọi. Không còn chờ (đã rút / đã chốt) → false, không làm gì.
 */
export function chotDeXuatYThuc(measureId: number, homNay: string, boi: number | null, tuChot = false): boolean {
  const doi = db().prepare(`UPDATE discipline_measures SET status = 'da_duyet', quyet_luc = ?, updated_at = ? WHERE id = ? AND status = 'cho_duyet'`)
    .run(homNay, nowIso(), measureId).changes;
  if (!doi) return false;
  xoaNho();   // trạng thái Ý thức nhớ theo request đã cũ (cho_duyet → da_duyet)
  const m = db().prepare('SELECT id, student_id, kind, custom_name FROM discipline_measures WHERE id = ?').get(measureId) as any;
  sinhViecBaoPh({ id: m.id, studentId: m.student_id, kind: m.kind, customName: m.custom_name ?? null }, homNay);
  baoSauDuyetDeXuat(boi, measureId, homNay, tuChot);
  return true;
}

/** Lý do đóng thẻ khi tự chốt (hiện ở "Đã quyết"). */
export const LY_DO_TU_CHOT_Y_THUC = 'Quá 5 ngày Head chưa duyệt — giữ quyết định GVCN';

/**
 * TINH-HINH (chủ SP 12/11 "hết 5 ngày thì quyết định của GVCN là quyết định cuối") — quét trong `quetYeuCau` (khi đọc + quét đêm): thẻ `y_thuc` còn chờ có
 * `han_duyet` < hôm nay → chốt theo GVCN (`tu_dong`). Mẫu `quetGiuPaGv`. Trả số thẻ đã chốt.
 * LG-10 (chủ SP 15/11, lời 33): thẻ `thu_hoi_y_thuc` cùng câu, cùng luật — thu hồi có hiệu lực như QL duyệt (bậc tính lại, "Báo lại PH" mặc định bật).
 * Lần sau đã có: GVCN đã xác nhận lúc gửi (`hoiLanSau`) nên không hỏi lại. Lần xử lý không còn để thu hồi: lượt "chết" đã đóng thẻ trước đó.
 */
export function quetYThucHetHan(conn: any, homNay: string): number {
  const ds = conn.prepare(`SELECT id, loai, doi_tuong_id, ly_do, du_lieu, hoc_vien_id, nguoi_xin FROM yeu_cau_duyet
    WHERE loai IN ('y_thuc', 'thu_hoi_y_thuc', 'sua_khai_bac') AND trang_thai = 'cho' AND han_duyet IS NOT NULL AND han_duyet < ?`)
    .all(homNay) as { id: number; loai: string; doi_tuong_id: number; ly_do: string | null; du_lieu: string | null; hoc_vien_id: number | null; nguoi_xin: number | null }[];
  if (!ds.length) return 0;
  /* C-7: MỖI thẻ một savepoint + try/catch — thẻ lỗi (em không còn, thu hồi 409…) chỉ bị bỏ qua + log, các thẻ khác vẫn chốt; không làm 500 mọi đường đọc (`quetTheoMoc`). */
  const chot = (y: (typeof ds)[number]) => {
      if (y.loai === 'sua_khai_bac') {
        /* N70: hết hạn → chốt theo GVCN (người gửi là người sửa). Bậc đã khác lúc gửi (lượt "chết" chưa kịp đóng) → đóng thẻ, không áp. */
        const d = JSON.parse(y.du_lieu ?? '{}') as { bacCu?: number; cycleId?: number };
        const k = emCua(y.doi_tuong_id)?.khai;
        const khop = !!k && k.bac === d.bacCu && k.cycleId === d.cycleId && y.nguoi_xin != null;
        if (khop) apDungSuaKhai(y.nguoi_xin!, y, { tuChot: true });
        chotYeuCau(conn, theSuaKhai(y.doi_tuong_id), 'tu_dong', { lyDo: khop ? LY_DO_TU_CHOT_Y_THUC : LY_DO_SUA_KHAI_LECH });
        return;
      }
      if (y.loai === 'y_thuc') chotDeXuatYThuc(y.doi_tuong_id, homNay, null, true);
      else {
        const m = loadXuLy(y.doi_tuong_id);
        if (!THU_HOI_DUOC.has(m.status)) return;
        /* Như `khiDuyet` của thẻ: thẻ giữ số lúc chốt (bậc về / số vi phạm). */
        const sl = y.hoc_vien_id ? soLieuThuHoi([{ measureId: y.doi_tuong_id, studentId: y.hoc_vien_id }]).get(y.doi_tuong_id) : undefined;
        if (sl) conn.prepare('UPDATE yeu_cau_duyet SET du_lieu = ? WHERE id = ?').run(JSON.stringify({ ...JSON.parse(y.du_lieu ?? '{}'), ...sl }), y.id);
        apDungThuHoi(null, m, hocVien(m.student_id), y.ly_do ?? '', true, true);
        xoaNho();
      }
      chotYeuCau(conn, { loai: y.loai as 'y_thuc' | 'thu_hoi_y_thuc', doiTuongLoai: 'discipline_measure', doiTuongId: y.doi_tuong_id }, 'tu_dong', { lyDo: LY_DO_TU_CHOT_Y_THUC });
  };
  tx(() => {
    for (const y of ds) {
      try { tx(() => chot(y)); } catch (e) { console.error('[het-han-y-thuc]', y.id, e); }
    }
  });
  return ds.length;
}
