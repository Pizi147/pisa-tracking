/**
 * SV-YT-TVV (luật 1–2, Q-D1 ①, Q-D3 ①; chủ SP 21–22/10) — việc "Báo PH · {bậc} · {em}" của TVV sau MỖI lần lưu xử lý vi phạm.
 *
 *  · Sinh NGAY khi lưu (`luuXuLy` — một em / lô; `guiDeXuat` — lần chờ QL duyệt), mọi bậc. Hạn = ngày lưu (giờ VN) + 4 (`hanBaoPh`).
 *  · Người giữ suy khi đọc: TVV của em (`students.consultant_user_id`), không có → QL chi nhánh của em. Đổi TVV: việc theo người mới, hạn giữ.
 *  · Ghi kết quả: "Đã báo PH" (xong) / "Chưa liên hệ được" (một lần thử — việc vẫn mở, hạn giữ) + ngày (≤ hôm nay) + ghi chú; MỖI lần một dòng
 *    `viec_bao_ph_lan`. Trạng thái = lần ghi mới nhất (ghi "Chưa liên hệ được" sau "Đã báo PH" = sửa nhầm, mở lại).
 *  · Kết thúc ngoại lệ = Bỏ việc với lý do bỏ sẵn có (`COORDINATION_USER_REMOVE_REASONS`).
 *  · Xử lý bị thu hồi (được duyệt) / QL từ chối / GVCN rút: việc chưa xong → "Đã bỏ" kèm lý do hệ thống; việc đã xong giữ + nhãn + chuông để biết.
 * Quyền ghi kiểm ở MÁY CHỦ: TVV của em / TVV cùng chi nhánh làm thay (chủ SP 22/10), hoặc QL / Quản trị trong phạm vi em. GV / GVCN / CX không ghi.
 */
import { DS_JSON, db, tx } from '../db.ts';
import {
  COORDINATION_REMOVE_REASON_LABEL, COORDINATION_USER_REMOVE_REASONS, KET_QUA_BAO_PH, PERMISSIONS,
  HAN_BAO_PH_NGAY, VIOLATION_CATEGORY_LABEL, duongHoSoHocVien, hanBaoPh, hanBaoPhHieuLuc, nhanLoaiXuLy, reasonNeedsText, type KetQuaBaoPh,
} from '../../../shared/domain/index.ts';
import { can, coQuyenBuocTiep, scopeFor, type Principal } from '../permissions.ts';
import { badRequest, chuTuDo, conflict, forbidden, isIsoDate, notFound, nowIso } from '../util.ts';
import { GhiDao, daoDuoc, daoLai, luuGhiDao, timGhiDao } from '../platform/ghiDao.ts';
import { demoToday } from '../demoConfig.ts';
import { notify, quanLyCuaChiNhanh, writeAudit } from '../platform/audit.ts';
import { HV_DANG_HOC_SQL, khoangTamDung } from '../students/tamDung.ts';
import type { WorkItem } from '../worklist/mywork.ts';
import { canManageDiscipline } from './access.ts';

export const NHAN_KET_QUA_BAO_PH: Record<KetQuaBaoPh, string> = { da_bao: 'Đã báo PH', chua_lien_he: 'Chưa liên hệ được' };
/** Lý do hệ thống đóng việc theo lần xử lý (Q-D1 ①). */
const LY_DO_HE_THONG = { system_thu_hoi: 'Xử lý đã thu hồi', system_tu_choi: 'QL từ chối xử lý', system_rut: 'Đề xuất đã rút' } as const;
type LyDoHeThong = keyof typeof LY_DO_HE_THONG;
const nhanLyDo = (code: string | null): string | null =>
  code ? (LY_DO_HE_THONG as Record<string, string>)[code] ?? (COORDINATION_REMOVE_REASON_LABEL as Record<string, string>)[code] ?? code : null;

/** Tên bậc của việc — đọc từ lần xử lý (rà #516: loại đổi thì tên theo); lần xử lý đã xoá (rút) → tên lưu lúc sinh việc. */
const nhanViec = (r: { nhan: string; m_kind?: string | null; m_custom?: string | null }): string => (r.m_kind ? nhanLoaiXuLy(r.m_kind, r.m_custom ?? null) : r.nhan);

/** Chi nhánh của em = lớp đang học, không có thì chi nhánh hồ sơ. */
const CHI_NHANH_EM = `COALESCE((SELECT c.branch_id FROM enrollments e JOIN classes c ON c.id = e.class_id WHERE e.student_id = s.id AND e.status = 'active' ORDER BY e.id DESC LIMIT 1), s.branch_id)`;

/** Người giữ việc của một em: TVV, không có → QL chi nhánh (Q-D3 ①). */
export function nguoiGiuBaoPh(studentId: number): number[] {
  const s = db().prepare(`SELECT s.consultant_user_id AS tvv, ${CHI_NHANH_EM} AS branch_id FROM students s WHERE s.id = ?`).get(studentId) as any;
  if (!s) return [];
  return s.tvv ? [s.tvv as number] : s.branch_id ? quanLyCuaChiNhanh(s.branch_id) : [];
}

/** TRONG tx của lần lưu: một việc cho lần xử lý (UNIQUE measure_id — gửi lại cùng khoá không sinh việc thứ hai). */
export function sinhViecBaoPh(m: { id: number; studentId: number; kind: string; customName?: string | null }, homNay: string): void {
  const nhan = nhanLoaiXuLy(m.kind, m.customName ?? null);
  const han = hanBaoPh(homNay);
  /* Chuông: đồng bộ tự động (`thongBaoTuDong`) theo người giữ HIỆN TẠI — đổi TVV thì chuông sang người mới (rà #516). */
  db().prepare(
    `INSERT INTO viec_bao_ph (measure_id, student_id, nhan, han, trang_thai, tao_luc) VALUES (?,?,?,?, 'mo', ?) ON CONFLICT(measure_id) DO NOTHING`,
  ).run(m.id, m.studentId, nhan, han, nowIso());
}

/**
 * TRONG tx: lần xử lý bị thu hồi (được duyệt) / QL từ chối / GVCN rút → việc chưa xong "Đã bỏ" kèm lý do; việc đã xong giữ + chuông để biết.
 * Rút xoá lần xử lý → gỡ `measure_id` (việc + lịch sử giữ, `nhan` còn tên bậc).
 */
export function dongViecTheoXuLy(measureId: number, lyDo: LyDoHeThong, chu: string | null, boi: number | null): void {
  const v = db().prepare(`SELECT v.*, s.full_name, m.kind AS m_kind, m.custom_name AS m_custom FROM viec_bao_ph v JOIN students s ON s.id = v.student_id
    LEFT JOIN discipline_measures m ON m.id = v.measure_id WHERE v.measure_id = ?`).get(measureId) as any;
  if (!v) return;
  v.nhan = nhanViec(v);
  if (v.trang_thai === 'mo') {
    db().prepare(`UPDATE viec_bao_ph SET trang_thai = 'bo', bo_ly_do = ?, bo_ly_do_chu = ?, bo_boi = ?, bo_luc = ? WHERE id = ? AND trang_thai = 'mo'`)
      .run(lyDo, chu?.slice(0, 2000) ?? null, boi, nowIso(), v.id);
  } else if (v.trang_thai === 'xong') {
    for (const uid of nguoiGiuBaoPh(v.student_id)) {
      notify({ userId: uid, kind: 'discipline_de_biet', title: `${LY_DO_HE_THONG[lyDo]} · Báo PH · ${v.nhan} · ${v.full_name} · để biết`, body: chu?.slice(0, 120) ?? null,
        entityType: 'discipline_measure', entityId: lyDo === 'system_rut' ? null : measureId, dedupKey: `bao-ph-dong:${v.id}`,
        duong: duongHoSoHocVien(v.student_id, { tab: 'y-thuc' }) });
    }
  }
  if (lyDo === 'system_rut') db().prepare('UPDATE viec_bao_ph SET measure_id = NULL WHERE id = ?').run(v.id);
}

/** TRONG tx: QL huỷ quyết định thu hồi (trong ngày) → việc hệ thống đã bỏ vì thu hồi mở lại, hạn giữ. */
export function moLaiViecTheoXuLy(measureId: number): void {
  db().prepare(`UPDATE viec_bao_ph SET trang_thai = 'mo', bo_ly_do = NULL, bo_ly_do_chu = NULL, bo_boi = NULL, bo_luc = NULL
                 WHERE measure_id = ? AND trang_thai = 'bo' AND bo_ly_do = 'system_thu_hoi'`).run(measureId);
}

// ---------------------------------------------------------------- quyền + đọc

function loadViec(id: number): any {
  const v = db().prepare(
    `SELECT v.*, s.full_name, s.student_code, s.consultant_user_id, s.parent_name, s.parent_relation, s.parent_phone, m.status AS xu_ly_status,
            m.kind AS m_kind, m.custom_name AS m_custom, m.note AS m_note, m.created_at AS m_luc, mu.full_name AS m_nguoi, mc.code AS m_lop
       FROM viec_bao_ph v JOIN students s ON s.id = v.student_id LEFT JOIN discipline_measures m ON m.id = v.measure_id
       LEFT JOIN users mu ON mu.id = m.created_by LEFT JOIN classes mc ON mc.id = m.class_id WHERE v.id = ?`,
  ).get(id) as any;
  if (!v) throw notFound('Không tìm thấy việc Báo PH.');
  return { ...v, nhan: nhanViec(v) };
}

/**
 * Ghi được = TVV của em · TVV cùng chi nhánh làm thay (chủ SP 22/10 — như Chọn bước tiếp, `coQuyenBuocTiep`; lịch sử ghi người làm) · QL / Quản trị trong
 * phạm vi em. CX, GV, GVCN: không. Người GIỮ việc (việc của tôi, chuông) vẫn chỉ một: TVV của em / QL khi em chưa có TVV.
 */
export const coTheGhi = (p: Principal, v: { consultant_user_id: number | null; student_id: number }): boolean =>
  v.consultant_user_id === p.userId || coQuyenBuocTiep(p, v.student_id) || can(p, PERMISSIONS.REQUEST_APPROVE, { studentId: v.student_id });
/** HAN-BAO-PH (chủ SP 03/11, 17.1): sửa hạn = người ghi được + GVCN lớp em đang học / QL (`discipline.manage`). Tách quyền ghi — GVCN sửa hạn, không ghi kết quả. */
export const coTheSuaHan = (p: Principal, v: { consultant_user_id: number | null; student_id: number }): boolean =>
  coTheGhi(p, v) || canManageDiscipline(p, v.student_id);
function requireGhi(p: Principal, v: any): void {
  if (!coTheGhi(p, v)) throw forbidden('Chỉ TVV hoặc Quản lý chi nhánh của em ghi được kết quả báo phụ huynh.');
}
/** Lần xử lý còn hiệu lực (không thu hồi / từ chối / rút). */
const xuLyCon = (v: any): 'con' | 'thu_hoi' | 'tu_choi' | 'rut' =>
  v.measure_id == null ? 'rut' : v.xu_ly_status === 'thu_hoi' ? 'thu_hoi' : v.xu_ly_status === 'tu_choi' ? 'tu_choi' : 'con';

export type ViecBaoPhView = {
  id: number; measureId: number | null; studentId: number; ten: string; nhan: string; tieuDe: string;
  han: string; quaHan: boolean; trangThai: 'mo' | 'xong' | 'bo'; nhanTrangThai: string;
  /** HAN-BAO-PH: hạn mặc định (lưu + 4, Quay lại học) · hạn người dùng chọn (null = mặc định) · sửa được không · mỗi lần đổi hạn. `han` = hạn hiệu lực. */
  hanMacDinh: string; hanChon: string | null; coTheSuaHan: boolean; lichSuHan: LanDoiHan[];
  /** Q-D1 ①: việc đã xong mà lần xử lý không còn → nhãn ("Xử lý đã thu hồi"…). */
  xuLy: 'con' | 'thu_hoi' | 'tu_choi' | 'rut'; nhanXuLy: string | null;
  bo: { lyDo: string; nhan: string | null; chu: string | null; luc: string } | null;
  lan: { ketQua: KetQuaBaoPh; nhan: string; ngay: string; ghiChu: string | null; nguoi: string | null; luc: string }[];
  lienHe: { ten: string | null; quanHe: string | null; sdt: string | null };
  coTheGhi: boolean;
  /** Q-RL2c: việc NGƯỜI DÙNG đã bỏ, người xem có quyền bỏ, lần xử lý còn, chưa ai đổi tiếp → nút "Khôi phục". */
  khoiPhucDuoc: boolean;
  /** UI-CV-TVV (mockup `tvv.html` khối bối cảnh): lần xử lý GVCN đã lưu — người lưu · giờ lưu · lớp · nội dung (vi phạm + ghi chú GVCN). */
  boiCanh: { nguoiLuu: string | null; luuLuc: string | null; lop: string | null; noiDung: string | null };
  /** T22: GVCN đang xin thu hồi lần xử lý (thẻ chờ QL) — TVV chỉ cần biết, lịch sử báo PH giữ. */
  thuHoiCho: { lyDo: string | null } | null;
};

/** "Không làm bài tập về nhà (09/09, 10/09, 11/09)" — vi phạm của lần xử lý theo tên, kèm ghi chú GVCN. Một câu. */
function noiDungXuLy(measureId: number | null, note: string | null): string | null {
  if (!measureId) return note;
  const vp = db().prepare(
    `SELECT COALESCE(NULLIF(x.ten, ''), NULLIF(x.description, ''), x.category) AS ten, x.occurred_on FROM measure_violations mv JOIN violations x ON x.id = mv.violation_id
      WHERE mv.measure_id = ? ORDER BY x.occurred_on, x.id`,
  ).all(measureId) as any[];
  const theoTen = new Map<string, string[]>();
  for (const r of vp) {
    const ten = (VIOLATION_CATEGORY_LABEL as Record<string, string>)[r.ten] ?? String(r.ten);
    theoTen.set(ten, [...(theoTen.get(ten) ?? []), `${r.occurred_on.slice(8, 10)}/${r.occurred_on.slice(5, 7)}`]);
  }
  const cau = [...theoTen].map(([ten, ngay]) => `${ten} (${ngay.join(', ')})`).join('; ');
  return [cau, note?.trim()].filter(Boolean).join('. ') || null;
}

/** Một tên cho trạng thái việc Báo PH — panel (`xemViecBaoPh`) và hàng em ở tab Ý thức lớp (`bangYThucLop`) đọc chung. */
export const nhanTrangThaiBaoPh = (trangThai: string, coLan: boolean): string =>
  trangThai === 'xong' ? 'Đã báo PH' : trangThai === 'bo' ? 'Đã bỏ' : coLan ? 'Chưa liên hệ được' : 'Chưa báo';

export function xemViecBaoPh(p: Principal, id: number): ViecBaoPhView {
  const v = loadViec(id);
  const ghi = coTheGhi(p, v);
  if (!ghi && !can(p, PERMISSIONS.STUDENT_VIEW, { studentId: v.student_id })) throw forbidden('Học viên ngoài phạm vi của bạn.');
  const homNay = demoToday();
  const khoang = khoangTamDung([v.student_id])[v.student_id];
  const hanMacDinh = hanBaoPhHieuLuc(v.han, khoang);
  const han = hanBaoPhHieuLuc(v.han, khoang, v.han_chon);
  const lan = (db().prepare(
    `SELECT l.ket_qua, l.ngay, l.ghi_chu, l.ghi_luc, u.full_name FROM viec_bao_ph_lan l LEFT JOIN users u ON u.id = l.ghi_boi WHERE l.viec_id = ? ORDER BY l.id`,
  ).all(id) as any[]).map((l) => ({ ketQua: l.ket_qua, nhan: NHAN_KET_QUA_BAO_PH[l.ket_qua as KetQuaBaoPh] ?? l.ket_qua, ngay: l.ngay, ghiChu: l.ghi_chu ?? null, nguoi: l.full_name ?? null, luc: l.ghi_luc }));
  const xl = xuLyCon(v);
  const the = v.measure_id
    ? db().prepare(`SELECT ly_do FROM yeu_cau_duyet WHERE loai = 'thu_hoi_y_thuc' AND doi_tuong_id = ? AND trang_thai = 'cho'`).get(v.measure_id) as { ly_do: string | null } | undefined
    : undefined;
  const nhanTrangThai = nhanTrangThaiBaoPh(v.trang_thai, lan.length > 0);
  return {
    id, measureId: v.measure_id ?? null, studentId: v.student_id, ten: v.full_name, nhan: v.nhan, tieuDe: `Báo PH · ${v.nhan} · ${v.full_name}`,
    han, quaHan: v.trang_thai === 'mo' && han < homNay, trangThai: v.trang_thai, nhanTrangThai,
    hanMacDinh, hanChon: v.han_chon ?? null, coTheSuaHan: v.trang_thai === 'mo' && xl === 'con' && coTheSuaHan(p, v), lichSuHan: lichSuHan('bao_ph', id),
    xuLy: xl, nhanXuLy: xl === 'con' ? null : LY_DO_HE_THONG[`system_${xl}` as LyDoHeThong],
    bo: v.trang_thai === 'bo' ? { lyDo: v.bo_ly_do, nhan: nhanLyDo(v.bo_ly_do), chu: v.bo_ly_do_chu ?? null, luc: v.bo_luc } : null,
    /* SĐT phụ huynh chỉ cho người làm việc (TVV / QL) — người chỉ xem trạng thái (GV) không cần. */
    lan, lienHe: ghi ? { ten: v.parent_name ?? null, quanHe: v.parent_relation ?? null, sdt: v.parent_phone ?? null } : { ten: null, quanHe: null, sdt: null },
    coTheGhi: v.trang_thai !== 'bo' && xl === 'con' && ghi,
    khoiPhucDuoc: v.trang_thai === 'bo' && xl === 'con' && ghi && laLyDoNguoiDung(v.bo_ly_do) && daoDuocHoacCu(id),
    boiCanh: { nguoiLuu: v.m_nguoi ?? null, luuLuc: v.m_luc ?? null, lop: v.m_lop ?? null, noiDung: noiDungXuLy(v.measure_id ?? null, v.m_note ?? null) },
    thuHoiCho: the ? { lyDo: the.ly_do ?? null } : null,
  };
}

// ---------------------------------------------------------------- ghi kết quả / bỏ việc

/**
 * Ghi kết quả cho MỘT hoặc NHIỀU việc (K10: hai lần xử lý cùng em → một lần ghi, mỗi việc một dòng lịch sử). Ngày mặc định hôm nay, không sau hôm nay.
 * Mỗi việc kiểm quyền + trạng thái riêng; lỗi một việc → cả lần ghi lui (một giao dịch).
 */
export function ghiKetQuaBaoPh(p: Principal, v: { viecIds?: unknown; ketQua?: unknown; ngay?: unknown; ghiChu?: unknown; khoa?: unknown }): { ok: true; viec: ViecBaoPhView[] } {
  const ids = [...new Set((Array.isArray(v.viecIds) ? v.viecIds : [v.viecIds]).map(Number))];
  if (!ids.length || ids.length > 50 || ids.some((x) => !Number.isInteger(x) || x <= 0)) throw badRequest('Chọn việc Báo PH cần ghi.');
  const ketQua = String(v.ketQua ?? '') as KetQuaBaoPh;
  if (!(KET_QUA_BAO_PH as readonly string[]).includes(ketQua)) throw badRequest('Chọn kết quả: Đã báo PH hoặc Chưa liên hệ được.');
  const homNay = demoToday();
  const ngay = v.ngay == null || v.ngay === '' ? homNay : String(v.ngay);
  if (!isIsoDate(ngay)) throw badRequest('Ngày không hợp lệ.');
  if (ngay > homNay) throw badRequest('Ngày báo không được sau hôm nay.');
  const ghiChu = chuTuDo(v.ghiChu, 'Ghi chú', 2000);
  /* X04 (audit 03/11): web gửi MỘT khoá cho mỗi ý định ghi; gửi lại sau mất phản hồi (máy chủ đã lưu) → trả bản đã lưu, không thêm lần liên hệ.
     Hai lần liên hệ thật = hai khoá. */
  const khoa = v.khoa == null || v.khoa === '' ? null : String(v.khoa).slice(0, 80);
  if (khoa && ids.every((id) => db().prepare('SELECT 1 FROM viec_bao_ph_lan WHERE khoa = ?').get(`${khoa}:${id}`))) {
    for (const id of ids) requireGhi(p, loadViec(id));
    return { ok: true, viec: ids.map((id) => xemViecBaoPh(p, id)) };
  }
  tx(() => {
    for (const id of ids) {
      const x = loadViec(id);
      requireGhi(p, x);
      if (x.trang_thai === 'bo') throw badRequest(`Việc Báo PH · ${x.nhan} · ${x.full_name} đã kết thúc — chỉ xem.`);
      const xl = xuLyCon(x);
      if (xl !== 'con') throw badRequest(`${LY_DO_HE_THONG[`system_${xl}` as LyDoHeThong]} — việc Báo PH chỉ xem.`);
      db().prepare('INSERT INTO viec_bao_ph_lan (viec_id, ket_qua, ngay, ghi_chu, ghi_boi, ghi_luc, khoa) VALUES (?,?,?,?,?,?,?)')
        .run(id, ketQua, ngay, ghiChu, p.userId, nowIso(), khoa ? `${khoa}:${id}` : null);
      const sau = ketQua === 'da_bao' ? 'xong' : 'mo';
      db().prepare('UPDATE viec_bao_ph SET trang_thai = ? WHERE id = ?').run(sau, id);
      writeAudit({ actorUserId: p.userId, action: 'discipline.bao_ph', entityType: 'discipline_measure', entityId: x.measure_id,
        entityLabel: `${x.student_code} · Báo PH · ${x.nhan}`, before: { trangThai: x.trang_thai }, after: { trangThai: sau, ketQua, ngay, ghiChu } });
    }
  });
  return { ok: true, viec: ids.map((id) => xemViecBaoPh(p, id)) };
}

/** Kết thúc ngoại lệ (thao tác phụ): lý do bỏ sẵn có, "Khác" bắt chữ. Chỉ việc đang mở. */
export function boViecBaoPh(p: Principal, id: number, v: { lyDo?: unknown; lyDoKhac?: unknown }): ViecBaoPhView {
  const lyDo = String(v.lyDo ?? '');
  if (!(COORDINATION_USER_REMOVE_REASONS as readonly string[]).includes(lyDo)) throw badRequest('Chọn lý do bỏ việc.');
  const chu = chuTuDo(v.lyDoKhac, 'Lý do', 2000);
  if (reasonNeedsText(lyDo) && !chu) throw badRequest('Ghi rõ lý do "Khác".');
  const x = loadViec(id);
  requireGhi(p, x);
  if (x.trang_thai !== 'mo') throw badRequest('Chỉ bỏ được việc đang mở.');
  tx(() => {
    const g = new GhiDao(db());   // Q-RL2c: chụp dòng trước khi bỏ → Hoàn tác / Khôi phục trả y nguyên
    g.sua('viec_bao_ph', 'id = ?', id);
    const doi = db().prepare(`UPDATE viec_bao_ph SET trang_thai = 'bo', bo_ly_do = ?, bo_ly_do_chu = ?, bo_boi = ?, bo_luc = ? WHERE id = ? AND trang_thai = 'mo'`)
      .run(lyDo, reasonNeedsText(lyDo) ? chu : null, p.userId, nowIso(), id).changes;
    if (!doi) throw badRequest('Việc vừa được cập nhật — mở lại.');
    luuGhiDao(db(), { loai: LOAI_BO, bang: 'viec_bao_ph', id, nguoi: p.userId, ghi: g });
    writeAudit({ actorUserId: p.userId, action: 'discipline.bao_ph_bo', entityType: 'discipline_measure', entityId: x.measure_id,
      entityLabel: `${x.student_code} · bỏ Báo PH · ${x.nhan}`, before: { trangThai: 'mo' }, after: { trangThai: 'bo', lyDo, chu } });
  });
  return xemViecBaoPh(p, id);
}

const LOAI_BO = 'bo_bao_ph';
const laLyDoNguoiDung = (code: string | null): boolean => (COORDINATION_USER_REMOVE_REASONS as readonly string[]).includes(code ?? '');
/** Có bản ghi đảo → còn đảo được; không có (việc bỏ trước Q-RL2c) → mở lại theo cách cũ được. */
const daoDuocHoacCu = (id: number): boolean => { const r = timGhiDao(db(), LOAI_BO, 'viec_bao_ph', id); return !r || daoDuoc(r); };

/**
 * Q-RL2c (N24 ②): Hoàn tác / Khôi phục việc NGƯỜI DÙNG đã bỏ → dòng y như trước khi bỏ (đang mở, hạn giữ). Quyền = quyền bỏ, theo việc HIỆN TẠI.
 * Việc hệ thống đóng (thu hồi / từ chối / rút) hay lần xử lý không còn: không khôi phục tay. Việc bỏ trước Q-RL2c (không có bản ghi đảo): mở lại cách cũ.
 */
export function khoiPhucViecBaoPh(p: Principal, id: number): ViecBaoPhView {
  const x = loadViec(id);
  requireGhi(p, x);
  if (x.trang_thai !== 'bo') throw conflict('Việc Báo PH này không ở trạng thái Đã bỏ — không có gì để khôi phục.');
  if (!laLyDoNguoiDung(x.bo_ly_do)) throw conflict('Việc này do hệ thống đóng theo lần xử lý — không khôi phục tay được.');
  const xl = xuLyCon(x);
  if (xl !== 'con') throw conflict(`${LY_DO_HE_THONG[`system_${xl}` as LyDoHeThong]} — không khôi phục việc Báo PH được.`);
  tx(() => {
    const r = timGhiDao(db(), LOAI_BO, 'viec_bao_ph', id);
    if (r) daoLai(db(), r, p.userId);
    else if (!db().prepare(`UPDATE viec_bao_ph SET trang_thai = 'mo', bo_ly_do = NULL, bo_ly_do_chu = NULL, bo_boi = NULL, bo_luc = NULL
                 WHERE id = ? AND trang_thai = 'bo' AND bo_ly_do = ?`).run(id, x.bo_ly_do).changes) throw conflict('Việc vừa được cập nhật — mở lại.');
    writeAudit({ actorUserId: p.userId, action: 'discipline.bao_ph_khoi_phuc', entityType: 'discipline_measure', entityId: x.measure_id,
      entityLabel: `${x.student_code} · khôi phục Báo PH · ${x.nhan}`, before: { trangThai: 'bo', lyDo: x.bo_ly_do, chu: x.bo_ly_do_chu ?? null }, after: { trangThai: 'mo' } });
  });
  return xemViecBaoPh(p, id);
}

// ---------------------------------------------------------------- sửa hạn (HAN-BAO-PH, chủ SP 03/11 — dùng chung Meeting CX ở `phoiHop.ts`)

export type LanDoiHan = { cu: string | null; moi: string; macDinh: boolean; nguoi: string | null; luc: string };
export type LoaiViecHan = 'bao_ph' | 'phoi_hop';

/** Mỗi lần đổi hạn của một việc, cũ nhất trước. */
export function lichSuHan(loai: LoaiViecHan, id: number): LanDoiHan[] {
  return (db().prepare(
    `SELECT l.han_cu, l.han_moi, l.mac_dinh, l.luc, u.full_name FROM viec_han_lan l LEFT JOIN users u ON u.id = l.boi WHERE l.loai = ? AND l.viec_id = ? ORDER BY l.id`,
  ).all(loai, id) as any[]).map((l) => ({ cu: l.han_cu ?? null, moi: l.han_moi, macDinh: l.mac_dinh === 1, nguoi: l.full_name ?? null, luc: l.luc }));
}

/**
 * Thân yêu cầu sửa hạn: `han` = ngày YYYY-MM-DD hoặc null (về mặc định) · `hanCu` = `hanChon` người dùng đang thấy (null = mặc định); khác giá trị hiện
 * tại → 409 (hai người sửa cùng lúc không đè nhau trong im lặng). Không trần, không lý do; ngày đã qua vẫn nhận (hiện "quá hạn").
 */
export function docSuaHan(v: { han?: unknown; hanCu?: unknown }): { han: string | null; hanCu: string | null } {
  if (!('hanCu' in v)) throw badRequest('Thiếu hạn đang xem — mở lại việc rồi sửa.');
  const han = v.han == null || v.han === '' ? null : String(v.han);
  if (han !== null && !isIsoDate(han)) throw badRequest('Ngày hạn không hợp lệ.');
  return { han, hanCu: v.hanCu == null || v.hanCu === '' ? null : String(v.hanCu) };
}

/** TRONG tx: đổi `han_chon` (so-và-đổi theo `hanCu`) + một dòng lịch sử. Trả false khi không có gì đổi. */
export function doiHanChon(o: { loai: LoaiViecHan; bang: 'viec_bao_ph' | 'sos_coordination_actions'; id: number; han: string | null; hanCu: string | null; cuHieuLuc: string | null; moiHieuLuc: string; boi: number }): boolean {
  if (o.han === o.hanCu) return false;
  const doi = db().prepare(`UPDATE ${o.bang} SET han_chon = ? WHERE id = ? AND han_chon IS ?`).run(o.han, o.id, o.hanCu).changes;
  if (!doi) throw conflict('Hạn vừa được người khác sửa — mở lại việc để xem hạn mới.');
  db().prepare('INSERT INTO viec_han_lan (loai, viec_id, han_cu, han_moi, mac_dinh, boi, luc) VALUES (?,?,?,?,?,?,?)')
    .run(o.loai, o.id, o.cuHieuLuc, o.moiHieuLuc, o.han === null ? 1 : 0, o.boi, nowIso());
  return true;
}

/** Sửa hạn việc Báo PH đang mở (17.1). Việc xong / bỏ / lần xử lý không còn: không sửa (không mở lại việc). */
export function suaHanBaoPh(p: Principal, id: number, body: { han?: unknown; hanCu?: unknown }): ViecBaoPhView {
  const { han, hanCu } = docSuaHan(body);
  const x = loadViec(id);
  if (!coTheSuaHan(p, x)) throw forbidden('Chỉ TVV, GVCN lớp em đang học hoặc Quản lý sửa được hạn báo phụ huynh.');
  if (x.trang_thai !== 'mo') throw badRequest('Việc Báo PH đã kết thúc — không sửa hạn.');
  const xl = xuLyCon(x);
  if (xl !== 'con') throw badRequest(`${LY_DO_HE_THONG[`system_${xl}` as LyDoHeThong]} — việc Báo PH chỉ xem.`);
  const khoang = khoangTamDung([x.student_id])[x.student_id];
  tx(() => {
    const cu = hanBaoPhHieuLuc(x.han, khoang, hanCu), moi = hanBaoPhHieuLuc(x.han, khoang, han);
    if (doiHanChon({ loai: 'bao_ph', bang: 'viec_bao_ph', id, han, hanCu, cuHieuLuc: cu, moiHieuLuc: moi, boi: p.userId })) {
      writeAudit({ actorUserId: p.userId, action: 'discipline.bao_ph_han', entityType: 'discipline_measure', entityId: x.measure_id,
        entityLabel: `${x.student_code} · hạn Báo PH · ${x.nhan}`, before: { han: cu, hanChon: hanCu }, after: { han: moi, hanChon: han } });
    }
  });
  return xemViecBaoPh(p, id);
}

// ---------------------------------------------------------------- việc của tôi (`/my-work`)

/** S3: chỉ phép kiểm bật — câu cũ `(x = ? OR ? = 1)` (quét cả bảng) để so với câu theo nhánh: TVV đi chỉ mục idx_student_consultant. */
export const baoPhCuKhiKiem = { bat: false };

/**
 * Việc Báo PH đang mở, em đang học (Tạm dừng → ẩn — K7). Người giữ: TVV của em; em không có TVV → QL trong phạm vi em là người giữ.
 * `tatCa` (QL "Của GV"): cả việc TVV giữ trong phạm vi. Một câu; TVV chỉ đọc em của mình.
 */
export function viecBaoPhCuaToi(p: Principal, o: { today: string; tatCa: boolean; branchId: number | null }): WorkItem[] {
  /* MỘT câu, không thêm câu phạm vi / Tạm dừng (TD4-b): phạm vi QL tính từ quyền đã nạp (`scopeFor`, chi nhánh của em); lần Quay lại học sau ngày lưu
     (có Tạm dừng trước hạn) đọc ngay trong câu → `hanBaoPhHieuLuc`. X05 (audit 03/11): QL không toàn quyền → lọc chi nhánh của em NGAY trong câu. */
  const pv = scopeFor(p, PERMISSIONS.REQUEST_APPROVE, o.today);
  const ql = !pv.none;
  if (!ql && !p.roleKeys.includes('consultant')) return [];   // GV không giữ việc này — khỏi tốn câu
  const trongPv = (branchId: number | null) => pv.all || (branchId !== null && pv.branchIds.includes(branchId));
  const rows = db().prepare(
    `SELECT v.id, v.student_id, v.nhan, m.kind AS m_kind, m.custom_name AS m_custom, v.han, v.han_chon, s.full_name, s.consultant_user_id AS tvv, ${CHI_NHANH_EM} AS branch_id,
            e.class_id, c.code AS class_code, (SELECT COUNT(*) FROM viec_bao_ph_lan l WHERE l.viec_id = v.id) AS so_lan,
            (SELECT MAX(r.event_date) FROM journey_events r WHERE r.student_id = s.id AND r.event_type = 'resume' AND r.event_date >= date(v.han, '-${HAN_BAO_PH_NGAY} day')
               AND EXISTS (SELECT 1 FROM journey_events q WHERE q.student_id = s.id AND q.event_type = 'pause' AND q.event_date <= v.han AND q.event_date <= r.event_date)) AS quay_lai
       FROM viec_bao_ph v JOIN students s ON s.id = v.student_id AND ${HV_DANG_HOC_SQL('s')}
       LEFT JOIN discipline_measures m ON m.id = v.measure_id
       LEFT JOIN enrollments e ON e.id = (SELECT MAX(x.id) FROM enrollments x WHERE x.student_id = s.id AND x.status = 'active')
       LEFT JOIN classes c ON c.id = e.class_id
      WHERE v.trang_thai = 'mo'${baoPhCuKhiKiem.bat ? ' AND (s.consultant_user_id = ? OR ? = 1)' : !ql ? ' AND s.consultant_user_id = ?'
        : pv.all ? '' : ` AND (s.consultant_user_id = ? OR ${CHI_NHANH_EM} IN (${DS_JSON}))`} ORDER BY v.han, v.id`,
  ).all(...(baoPhCuKhiKiem.bat ? [p.userId, ql ? 1 : 0] : !ql ? [p.userId] : pv.all ? [] : [p.userId, JSON.stringify(pv.branchIds)])) as any[];
  const items: WorkItem[] = [];
  for (const r of rows) {
    if (o.branchId && r.branch_id !== o.branchId) continue;
    let ownerId: number;
    if (r.tvv === p.userId) ownerId = p.userId;
    else if (!trongPv(r.branch_id)) continue;
    else if (!r.tvv) ownerId = p.userId;
    else if (o.tatCa) ownerId = r.tvv;
    else continue;
    const han = hanBaoPhHieuLuc(r.han, r.quay_lai ? [{ tu: r.han, den: r.quay_lai }] : [], r.han_chon);
    r.nhan = nhanViec(r);
    items.push({
      key: `bao-ph:${r.id}`, group: 'bao_ph_yt', urgency: han < o.today ? 'overdue' : han === o.today ? 'today' : 'normal',
      studentId: r.student_id, studentName: r.full_name, classId: r.class_id ?? null, classCode: r.class_code ?? null,
      attemptId: null, attemptNo: null, caseId: null, level: null, contextLabel: r.nhan, count: null,
      reason: `Đã lưu xử lý ${r.nhan} — báo phụ huynh và ghi kết quả`,
      tieuDe: `Báo PH · ${r.nhan} · ${r.full_name}`, phu: `Báo PH · ${r.nhan}`, actionLabel: 'Ghi báo PH',
      href: duongHoSoHocVien(r.student_id, { tab: 'y-thuc' }), ownerId, owner: null, mine: ownerId === p.userId,
      due: han, statusLabel: r.so_lan ? 'Chưa liên hệ được' : 'Chưa báo', viecId: r.id, soLanThu: r.so_lan,
    });
  }
  return items;
}
