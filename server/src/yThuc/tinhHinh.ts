/**
 * TÌNH HÌNH HỌC TẬP (chủ SP 12/11, đặc tả `docs/superpowers/specs/2026-11-12-tinh-hinh-hoc-tap/dac-ta.md` mục 1a, 1e; mockup `thiet-ke/v20/tinh-hinh.html`).
 *
 *   `gv_tvv`   GV đang dạy em / QL (quyền ghi vi phạm) báo TVV — nội dung tự do, KHÔNG phân loại. Sinh việc TVV "Báo PH · Tình hình học tập" trong
 *              `viec_bao_ph` (`tinh_hinh_id`) — cùng luật Báo PH: hạn 5 ngày, sửa hạn N34, Đã báo PH / Chưa liên hệ được, bỏ việc. Kết quả về người gửi.
 *   `tvv_gvcn` TVV của em / TVV cùng chi nhánh / QL hỏi GVCN lớp em đang học — hạn 3 ngày tính cả ngày hỏi. GVCN (QL làm thẳng) ghi kết quả → TVV đọc;
 *              web không theo dõi tiếp. Mỗi em một câu đang chờ của cùng người hỏi.
 *
 * Sửa / Rút khi chưa có kết quả (người gửi, QL); Hoàn tác ngay sau gửi (≤ 2 phút, chưa có kết quả) xoá hẳn. Mọi đổi ghi `writeAudit`.
 */
import { DS_JSON, db, tx } from '../db.ts';
import { PERMISSIONS, addDaysIso, duongHoSoHocVien, hanBaoPh, hanBaoPhHieuLuc } from '../../../shared/domain/index.ts';
import { can, type Principal } from '../permissions.ts';
import { badRequest, conflict, forbidden, notFound, nowIso } from '../util.ts';
import { demoToday } from '../demoConfig.ts';
import { notify, quanLyCuaChiNhanh, writeAudit } from '../platform/audit.ts';
import { activeClassOf, canManageDiscipline, requireRecordViolation } from './access.ts';
import { coTheGhi } from './baoPhTvv.ts';
import { khoangTamDung } from '../students/tamDung.ts';
import type { WorkItem } from '../worklist/mywork.ts';

export const CHIEU_TINH_HINH = ['gv_tvv', 'tvv_gvcn'] as const;
export type ChieuTinhHinh = (typeof CHIEU_TINH_HINH)[number];
export const NHAN_VIEC_TINH_HINH = 'Tình hình học tập';
/** Ô chữ 10–500 ký tự (như N35: có bộ đếm ở web, quá thì không lưu). */
const TOI_THIEU = 10, TOI_DA = 500;
/** Hạn câu hỏi TVV → GVCN: 3 ngày tính cả ngày hỏi (hỏi T2 → hết T4). */
export const hanHoiTinhHinh = (homNay: string): string => addDaysIso(homNay, 2);
/** Hoàn tác ngay sau gửi / trả lời: trong 2 phút, chưa ai làm bước sau. */
const HOAN_TAC_MS = 2 * 60_000;
const LO_EM = 8;

export type TinhHinhView = {
  id: number; studentId: number; chieu: ChieuTinhHinh; noiDung: string;
  nguoiGuiId: number; nguoiGui: string | null; taoLuc: string; suaLuc: string | null;
  /** `tvv_gvcn`: hạn GVCN trả lời. `gv_tvv`: hạn hiệu lực việc TVV. */
  han: string | null; quaHan: boolean;
  trangThai: 'mo' | 'xong' | 'rut';
  /** `tvv_gvcn`: kết quả GVCN ghi. */
  traLoi: string | null; traLoiBoi: string | null; traLoiLuc: string | null;
  /** `gv_tvv`: việc Báo PH của TVV — id + lần ghi mới nhất. */
  baoPh: { id: number; trangThai: 'mo' | 'xong' | 'bo'; tvv: string | null; lan: { ketQua: string; ngay: string; noiDung: string | null } | null; coTheGhi: boolean } | null;
  coTheSua: boolean; coTheTraLoi: boolean; hoanTacDuoc: boolean;
};

function kiemChu(v: unknown, ten: string): string {
  const s = typeof v === 'string' ? v.trim() : '';
  if (s.length < TOI_THIEU) throw badRequest(`${ten}: ít nhất ${TOI_THIEU} ký tự.`);
  if (s.length > TOI_DA) throw badRequest(`${ten}: tối đa ${TOI_DA} ký tự.`);
  return s;
}

const studentRow = (sid: number) => {
  const s = db().prepare('SELECT id, full_name, student_code, consultant_user_id, branch_id FROM students WHERE id = ?').get(sid) as any;
  if (!s) throw notFound('Không tìm thấy học viên');
  return s;
};

/** GVCN đang hiệu lực của lớp em đang học (không có → null). */
function gvcnCuaEm(sid: number, homNay: string): { lopId: number | null; gvcn: number | null; branchId: number | null } {
  const lopId = activeClassOf(sid);
  if (!lopId) return { lopId: null, gvcn: null, branchId: null };
  const r = db().prepare(
    `SELECT c.branch_id, (SELECT ta.user_id FROM teacher_assignments ta WHERE ta.class_id = c.id AND ta.is_core = 1 AND ta.status = 'active'
        AND ta.effective_from <= ? AND (ta.effective_to IS NULL OR ta.effective_to >= ?) ORDER BY ta.id LIMIT 1) AS gvcn FROM classes c WHERE c.id = ?`,
  ).get(homNay, homNay, lopId) as any;
  return { lopId, gvcn: r?.gvcn ?? null, branchId: r?.branch_id ?? null };
}

const quyenGui = (p: Principal, chieu: ChieuTinhHinh, s: any): void => {
  if (chieu === 'gv_tvv') { requireRecordViolation(p, s.id); return; }
  if (!coTheGhi(p, { consultant_user_id: s.consultant_user_id ?? null, student_id: s.id })) {
    throw forbidden('Chỉ TVV hoặc Quản lý của em hỏi được tình hình học tập.');
  }
};

/** Gửi (một hoặc nhiều em, ≤ 8, cùng nội dung). `chieu` do web chọn theo vai; máy chủ kiểm quyền từng em. */
export function guiTinhHinh(p: Principal, v: { chieu?: unknown; studentIds?: unknown; noiDung?: unknown }): { ids: number[] } {
  const chieu = String(v.chieu ?? '') as ChieuTinhHinh;
  if (!(CHIEU_TINH_HINH as readonly string[]).includes(chieu)) throw badRequest('Chiều không hợp lệ.');
  const ids = [...new Set((Array.isArray(v.studentIds) ? v.studentIds : [v.studentIds]).map(Number))];
  if (!ids.length || ids.length > LO_EM || ids.some((x) => !Number.isInteger(x) || x <= 0)) throw badRequest(`Chọn từ 1 đến ${LO_EM} học viên.`);
  if (chieu === 'tvv_gvcn' && ids.length > 1) throw badRequest('Hỏi tình hình từng em một.');
  const noiDung = kiemChu(v.noiDung, chieu === 'gv_tvv' ? 'Nội dung' : 'Câu hỏi');
  const homNay = demoToday();
  const em = ids.map(studentRow);
  for (const s of em) quyenGui(p, chieu, s);
  const out: number[] = [];
  /* Gửi lại (bấm hai lần / thử lại sau mất mạng): cùng người, cùng em, cùng nội dung trong 2 phút → trả bản đã có, không sinh việc thứ hai. */
  const tu = new Date(Date.now() - HOAN_TAC_MS).toISOString();
  const daCo = (sid: number) => (db().prepare(
    `SELECT id FROM tinh_hinh_hoc_tap WHERE student_id = ? AND nguoi_gui = ? AND chieu = ? AND noi_dung = ? AND tao_luc >= ? ORDER BY id DESC LIMIT 1`,
  ).get(sid, p.userId, chieu, noiDung, tu) as { id: number } | undefined)?.id;
  tx(() => {
    for (const s of em) {
      const cu = daCo(s.id);
      if (cu) { out.push(cu); continue; }
      if (chieu === 'tvv_gvcn' && db().prepare(`SELECT 1 FROM tinh_hinh_hoc_tap WHERE student_id = ? AND nguoi_gui = ? AND chieu = 'tvv_gvcn' AND trang_thai = 'mo'`).get(s.id, p.userId)) {
        throw conflict('Bạn đang hỏi tình hình em này — sửa câu đang chờ hoặc Rút.');
      }
      const g = gvcnCuaEm(s.id, homNay);
      const id = Number(db().prepare(
        `INSERT INTO tinh_hinh_hoc_tap (student_id, class_id, chieu, noi_dung, nguoi_gui, tao_luc, han, trang_thai) VALUES (?,?,?,?,?,?,?, 'mo')`,
      ).run(s.id, g.lopId, chieu, noiDung, p.userId, nowIso(), chieu === 'tvv_gvcn' ? hanHoiTinhHinh(homNay) : null).lastInsertRowid);
      out.push(id);
      if (chieu === 'gv_tvv') {
        /* Việc TVV — người giữ suy khi đọc (TVV của em; không có → QL), chuông từ /my-work như Báo PH. */
        db().prepare(`INSERT INTO viec_bao_ph (measure_id, student_id, nhan, han, trang_thai, tao_luc, tinh_hinh_id) VALUES (NULL, ?, ?, ?, 'mo', ?, ?)`)
          .run(s.id, NHAN_VIEC_TINH_HINH, hanBaoPh(homNay), nowIso(), id);
      } else {
        const nhan = g.gvcn ? [g.gvcn] : quanLyCuaChiNhanh(g.branchId ?? s.branch_id);
        for (const uid of nhan) {
          if (uid === p.userId) continue;
          notify({ userId: uid, kind: 'tinh_hinh', title: `TVV hỏi tình hình học tập · ${s.full_name} · hạn ${hanHoiTinhHinh(homNay).slice(8, 10)}/${hanHoiTinhHinh(homNay).slice(5, 7)}`,
            entityType: 'student', entityId: s.id, dedupKey: `tinh-hinh-hoi:${id}`, duong: `/cong-viec?viec=${encodeURIComponent(`yt_hoi_tinh_hinh:${id}`)}`,
            han: hanHoiTinhHinh(homNay) });
        }
      }
      writeAudit({ actorUserId: p.userId, action: 'tinh_hinh.gui', entityType: 'tinh_hinh_hoc_tap', entityId: id,
        entityLabel: `${s.student_code} · ${chieu === 'gv_tvv' ? 'Báo tình hình' : 'Hỏi tình hình'}`, after: { chieu, noiDung } });
    }
  });
  return { ids: out };
}

function load(id: number): any {
  const r = db().prepare(
    `SELECT t.*, s.full_name, s.student_code, s.consultant_user_id, b.id AS bp_id, b.trang_thai AS bp_tt,
            (SELECT COUNT(*) FROM viec_bao_ph_lan l WHERE l.viec_id = b.id) AS bp_so
       FROM tinh_hinh_hoc_tap t JOIN students s ON s.id = t.student_id LEFT JOIN viec_bao_ph b ON b.tinh_hinh_id = t.id WHERE t.id = ?`,
  ).get(id) as any;
  if (!r) throw notFound('Không tìm thấy tình hình học tập.');
  return r;
}
/** Người gửi hoặc QL / Quản trị trong phạm vi em. */
const laNguoiGuiHoacQl = (p: Principal, r: any) => r.nguoi_gui === p.userId || can(p, PERMISSIONS.REQUEST_APPROVE, { studentId: r.student_id });
/** Đã có kết quả: gv_tvv — TVV đã ghi lần nào; tvv_gvcn — GVCN đã trả lời. */
const coKetQua = (r: any) => (r.chieu === 'gv_tvv' ? (r.bp_so ?? 0) > 0 : r.tra_loi != null);
const trongHoanTac = (luc: string | null) => !!luc && Date.now() - Date.parse(luc) <= HOAN_TAC_MS;

/** Sửa nội dung / câu hỏi — người gửi hoặc QL, khi còn chờ và chưa có kết quả. */
export function suaTinhHinh(p: Principal, id: number, v: { noiDung?: unknown }): { ok: true } {
  const r = load(id);
  if (!laNguoiGuiHoacQl(p, r)) throw forbidden('Chỉ người gửi hoặc Quản lý sửa được.');
  if (r.trang_thai !== 'mo' || coKetQua(r)) throw badRequest('Đã có kết quả — không sửa được.');
  const noiDung = kiemChu(v.noiDung, r.chieu === 'gv_tvv' ? 'Nội dung' : 'Câu hỏi');
  if (noiDung === r.noi_dung) return { ok: true };
  tx(() => {
    db().prepare('UPDATE tinh_hinh_hoc_tap SET noi_dung = ?, sua_luc = ? WHERE id = ?').run(noiDung, nowIso(), id);
    writeAudit({ actorUserId: p.userId, action: 'tinh_hinh.sua', entityType: 'tinh_hinh_hoc_tap', entityId: id, entityLabel: `${r.student_code} · tình hình học tập`,
      before: { noiDung: r.noi_dung }, after: { noiDung } });
  });
  return { ok: true };
}

/**
 * Rút (người gửi hoặc QL) khi chưa có kết quả → `rut`, giữ dòng; việc TVV (gv_tvv) "Đã bỏ" lý do hệ thống. Ngay sau gửi (≤ 2 phút, `hoanTac`) → xoá hẳn.
 */
export function rutTinhHinh(p: Principal, id: number, o: { hoanTac?: boolean } = {}): { ok: true; xoa: boolean } {
  const r = load(id);
  if (!laNguoiGuiHoacQl(p, r)) throw forbidden('Chỉ người gửi hoặc Quản lý rút được.');
  if (r.trang_thai !== 'mo' || coKetQua(r)) throw badRequest('Đã có kết quả — không rút được.');
  const xoa = !!o.hoanTac && r.nguoi_gui === p.userId && trongHoanTac(r.tao_luc);
  tx(() => {
    if (xoa) {
      if (r.bp_id) db().prepare('DELETE FROM viec_bao_ph WHERE id = ? AND NOT EXISTS (SELECT 1 FROM viec_bao_ph_lan l WHERE l.viec_id = viec_bao_ph.id)').run(r.bp_id);
      db().prepare('DELETE FROM notifications WHERE dedup_key = ?').run(`tinh-hinh-hoi:${id}`);
      db().prepare('DELETE FROM tinh_hinh_hoc_tap WHERE id = ?').run(id);
    } else {
      db().prepare(`UPDATE tinh_hinh_hoc_tap SET trang_thai = 'rut', rut_boi = ?, rut_luc = ? WHERE id = ? AND trang_thai = 'mo'`).run(p.userId, nowIso(), id);
      if (r.bp_id) {
        db().prepare(`UPDATE viec_bao_ph SET trang_thai = 'bo', bo_ly_do = 'system_rut_tinh_hinh', bo_boi = ?, bo_luc = ? WHERE id = ? AND trang_thai = 'mo'`)
          .run(p.userId, nowIso(), r.bp_id);
      }
    }
    writeAudit({ actorUserId: p.userId, action: xoa ? 'tinh_hinh.hoan_tac' : 'tinh_hinh.rut', entityType: 'tinh_hinh_hoc_tap', entityId: id,
      entityLabel: `${r.student_code} · tình hình học tập`, before: { noiDung: r.noi_dung, trangThai: r.trang_thai } });
  });
  return { ok: true, xoa };
}

/** GVCN lớp em đang học (QL làm thẳng — `discipline.manage`) trả lời câu TVV hỏi; trả lời lại = sửa (nhật ký giữ bản cũ). */
export function traLoiTinhHinh(p: Principal, id: number, v: { traLoi?: unknown }): { ok: true } {
  const r = load(id);
  if (r.chieu !== 'tvv_gvcn') throw badRequest('Chỉ trả lời câu TVV hỏi.');
  if (!canManageDiscipline(p, r.student_id)) throw forbidden('Chỉ GVCN lớp em đang học hoặc Quản lý ghi được kết quả.');
  if (r.trang_thai === 'rut') throw badRequest('TVV đã rút câu hỏi.');
  const traLoi = kiemChu(v.traLoi, 'Kết quả');
  tx(() => {
    db().prepare(`UPDATE tinh_hinh_hoc_tap SET tra_loi = ?, tra_loi_boi = ?, tra_loi_luc = ?, trang_thai = 'xong' WHERE id = ?`).run(traLoi, p.userId, nowIso(), id);
    if (r.nguoi_gui !== p.userId) {
      notify({ userId: r.nguoi_gui, kind: 'tinh_hinh', title: `GVCN đã trả lời tình hình học tập · ${r.full_name}`, body: traLoi.slice(0, 120),
        entityType: 'student', entityId: r.student_id, dedupKey: `tinh-hinh-tra-loi:${id}`, duong: duongHoSoHocVien(r.student_id, { tab: 'y-thuc' }) });
    }
    writeAudit({ actorUserId: p.userId, action: 'tinh_hinh.tra_loi', entityType: 'tinh_hinh_hoc_tap', entityId: id, entityLabel: `${r.student_code} · tình hình học tập`,
      before: r.tra_loi ? { traLoi: r.tra_loi } : null, after: { traLoi } });
  });
  return { ok: true };
}

/** Hoàn tác trả lời ngay sau Lưu (≤ 2 phút, cùng người) → câu hỏi về chờ. */
export function hoanTacTraLoi(p: Principal, id: number): { ok: true } {
  const r = load(id);
  if (r.chieu !== 'tvv_gvcn' || r.trang_thai !== 'xong' || r.tra_loi_boi !== p.userId || !trongHoanTac(r.tra_loi_luc)) throw badRequest('Không hoàn tác được nữa — sửa kết quả.');
  tx(() => {
    db().prepare(`UPDATE tinh_hinh_hoc_tap SET tra_loi = NULL, tra_loi_boi = NULL, tra_loi_luc = NULL, trang_thai = 'mo' WHERE id = ?`).run(id);
    db().prepare('DELETE FROM notifications WHERE dedup_key = ?').run(`tinh-hinh-tra-loi:${id}`);
    writeAudit({ actorUserId: p.userId, action: 'tinh_hinh.hoan_tac_tra_loi', entityType: 'tinh_hinh_hoc_tap', entityId: id, entityLabel: `${r.student_code} · tình hình học tập`,
      before: { traLoi: r.tra_loi } });
  });
  return { ok: true };
}

/**
 * Tình hình của các em (mới nhất trước) — tab Ý thức & Phối hợp lớp / HV. MỘT câu mỗi lô (chỉ mục `idx_tinh_hinh_hv`), thêm một câu Tạm dừng chỉ khi có việc TVV mở.
 */
export function tinhHinhCuaEm(p: Principal, ids: readonly number[], homNay = demoToday()): TinhHinhView[] {
  if (!ids.length) return [];
  const rows = db().prepare(
    `SELECT t.*, s.consultant_user_id, gu.full_name AS nguoi_gui_ten, tu.full_name AS tra_loi_ten, tv.full_name AS tvv_ten,
            b.id AS bp_id, b.trang_thai AS bp_tt, b.han AS bp_han, b.han_chon AS bp_han_chon,
            (SELECT json_object('k', l.ket_qua, 'n', l.ngay, 'g', l.ghi_chu) FROM viec_bao_ph_lan l WHERE l.viec_id = b.id ORDER BY l.id DESC LIMIT 1) AS bp_lan
       FROM tinh_hinh_hoc_tap t JOIN students s ON s.id = t.student_id LEFT JOIN users gu ON gu.id = t.nguoi_gui LEFT JOIN users tu ON tu.id = t.tra_loi_boi
       LEFT JOIN users tv ON tv.id = s.consultant_user_id LEFT JOIN viec_bao_ph b ON b.tinh_hinh_id = t.id
      WHERE t.student_id IN (${DS_JSON}) ORDER BY t.tao_luc DESC, t.id DESC`,
  ).all(JSON.stringify(ids)) as any[];
  const mo = rows.filter((r) => r.bp_tt === 'mo');
  const khoang = mo.length ? khoangTamDung(mo.map((r) => r.student_id)) : {};
  const ql = (sid: number) => can(p, PERMISSIONS.REQUEST_APPROVE, { studentId: sid });
  return rows.map((r) => {
    const lan = r.bp_lan ? JSON.parse(r.bp_lan) : null;
    const han = r.chieu === 'tvv_gvcn' ? r.han : r.bp_id ? (r.bp_tt === 'mo' ? hanBaoPhHieuLuc(r.bp_han, khoang[r.student_id], r.bp_han_chon) : (r.bp_han_chon ?? r.bp_han)) : null;
    const choKq = r.chieu === 'gv_tvv' ? !lan : r.tra_loi == null;
    const trangThai: TinhHinhView['trangThai'] = r.trang_thai === 'rut' ? 'rut' : r.chieu === 'gv_tvv' ? (r.bp_tt === 'xong' ? 'xong' : 'mo') : r.trang_thai;
    return {
      id: r.id, studentId: r.student_id, chieu: r.chieu, noiDung: r.noi_dung, nguoiGuiId: r.nguoi_gui, nguoiGui: r.nguoi_gui_ten ?? null,
      taoLuc: r.tao_luc, suaLuc: r.sua_luc ?? null, han, quaHan: trangThai === 'mo' && !!han && han < homNay, trangThai,
      traLoi: r.tra_loi ?? null, traLoiBoi: r.tra_loi_ten ?? null, traLoiLuc: r.tra_loi_luc ?? null,
      baoPh: r.bp_id ? { id: r.bp_id, trangThai: r.bp_tt, tvv: r.tvv_ten ?? null, lan: lan ? { ketQua: lan.k, ngay: lan.n, noiDung: lan.g ?? null } : null,
        coTheGhi: r.bp_tt !== 'xong' && coTheGhi(p, { consultant_user_id: r.consultant_user_id ?? null, student_id: r.student_id }) } : null,
      coTheSua: r.trang_thai === 'mo' && choKq && (r.nguoi_gui === p.userId || ql(r.student_id)),
      coTheTraLoi: r.chieu === 'tvv_gvcn' && r.trang_thai !== 'rut' && canManageDiscipline(p, r.student_id),
      hoanTacDuoc: r.chieu === 'tvv_gvcn' && r.trang_thai === 'xong' && r.tra_loi_boi === p.userId && trongHoanTac(r.tra_loi_luc),
    };
  });
}

/**
 * Công việc GVCN: câu TVV hỏi còn chờ ở lớp mình chủ nhiệm (một câu, chỉ mục `idx_tinh_hinh_cho`). Em không có GVCN → QL trong phạm vi giữ.
 * `tatCa` (QL "Của GV"): thêm câu của GVCN trong phạm vi.
 */
export function viecHoiTinhHinhCuaToi(p: Principal, o: { today: string; tatCa: boolean; branchId: number | null }): WorkItem[] {
  const lopCn = [...new Set(p.assignments.filter((a) => a.isCore && a.effectiveFrom <= o.today && (!a.effectiveTo || a.effectiveTo >= o.today)).map((a) => a.classId))];
  const ql = p.roleKeys.some((k) => k === 'manager' || k === 'system_admin');
  if (!lopCn.length && !ql) return [];
  /* Lớp = lớp em ĐANG học (không phải lớp lúc hỏi) — cùng quyền trả lời (`discipline.manage`): em chuyển lớp thì GVCN mới giữ. GVCN không phải QL:
     chỉ đọc câu của lớp mình chủ nhiệm (đọc đúng phạm vi). */
  const LOP = `COALESCE((SELECT e.class_id FROM enrollments e WHERE e.student_id = t.student_id AND e.status IN ('active', 'paused') ORDER BY e.id DESC LIMIT 1), t.class_id)`;
  const rows = db().prepare(
    `SELECT x.*, c.code AS class_code, c.branch_id,
            (SELECT ta.user_id FROM teacher_assignments ta WHERE ta.class_id = x.lop AND ta.is_core = 1 AND ta.status = 'active'
                AND ta.effective_from <= ?1 AND (ta.effective_to IS NULL OR ta.effective_to >= ?1) ORDER BY ta.id LIMIT 1) AS gvcn
       FROM (SELECT t.id, t.student_id, ${LOP} AS lop, t.noi_dung, t.han, s.full_name, gu.full_name AS nguoi_gui_ten
               FROM tinh_hinh_hoc_tap t JOIN students s ON s.id = t.student_id LEFT JOIN users gu ON gu.id = t.nguoi_gui
              WHERE t.chieu = 'tvv_gvcn' AND t.trang_thai = 'mo') x LEFT JOIN classes c ON c.id = x.lop
      ${ql ? '' : `WHERE x.lop IN (${DS_JSON})`} ORDER BY x.han, x.id`,
  ).all(o.today, ...(ql ? [] : [JSON.stringify(lopCn)])) as any[];
  const items: WorkItem[] = [];
  for (const r of rows) {
    if (o.branchId && r.branch_id !== o.branchId) continue;
    let ownerId: number;
    if (r.gvcn === p.userId) ownerId = p.userId;
    else if (ql && can(p, PERMISSIONS.REQUEST_APPROVE, { studentId: r.student_id })) {
      if (!r.gvcn) ownerId = p.userId;
      else if (o.tatCa) ownerId = r.gvcn;
      else continue;
    } else continue;
    const urgency = r.han < o.today ? 'overdue' : r.han === o.today ? 'today' : 'normal';
    items.push({
      key: `yt_hoi_tinh_hinh:${r.id}`, group: 'yt_hoi_tinh_hinh', urgency,
      studentId: r.student_id, studentName: r.full_name, classId: r.lop ?? null, classCode: r.class_code ?? null,
      attemptId: null, attemptNo: null, caseId: null, level: null, contextLabel: NHAN_VIEC_TINH_HINH, count: null,
      reason: r.noi_dung, tieuDe: `Tình hình học tập · ${r.full_name}`, phu: NHAN_VIEC_TINH_HINH, actionLabel: 'Ghi kết quả',
      href: r.lop ? `/hoc-vien/lop/${r.lop}?tab=y-thuc&hv=${r.student_id}` : duongHoSoHocVien(r.student_id, { tab: 'y-thuc' }),
      ownerId, owner: null, mine: ownerId === p.userId, due: r.han, statusLabel: 'Chờ trả lời', viecId: r.id,
    } as WorkItem);
  }
  return items;
}

