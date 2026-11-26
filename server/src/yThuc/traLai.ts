/**
 * TRẢ LẠI VI PHẠM (TL-1, luật N61 — chủ SP 20/11; thiết kế `docs/superpowers/specs/2026-11-20-bpxl-giao-viec/thiet-ke.md` E; mockup `thiet-ke/v22/tra-lai-vi-pham.html`).
 *
 *  · Ai trả: TVV của em · TVV cùng chi nhánh · CX · Head / Quản trị (`coTheTraLai`). Lý do ≥ 8 ký tự (N50 (6)).
 *    MỘT vi phạm → người đã ghi (`reported_by`; hết hoạt động / hết vai ở chi nhánh em → GVCN lớp em đang học → Head). Cả lần xử lý → GVCN (→ Head).
 *  · Việc GV "Vi phạm bị trả lại" (`/my-work` nhóm `yt_tra_lai`, tab Ý thức & Phối hợp): hạn `hanTraLai` (3 ngày tính cả ngày trả, Hạn mặc định
 *    `tra_lai_vi_pham`), sửa hạn + đổi người + theo dõi qua khung giao việc (`giaoViec.ts`, loại `tra_lai`). Quá hạn chỉ đỏ.
 *  · GV chọn: Sửa rồi gửi lại (`guiLai` — sửa qua `editViolation`, lịch sử từng trường) · Giữ nguyên + trả lời ≥ 8 (`giuNguyen`) · Xoá vi phạm (đường
 *    `deleteViolation` sẵn có — tự đóng "đã xoá", Thùng rác 30 ngày). Cả lần xử lý: GVCN thêm Thu hồi (đường `thuHoiXuLy` sẵn có — tự đóng "thu hồi").
 *  · Trong lúc chờ: việc Báo PH của lần xử lý chứa vi phạm đó `tra_lai_id` ≠ NULL = "Chờ GV sửa", không quá hạn; đóng / rút → hạn Báo PH tính lại
 *    `hanBaoPh(hôm nay)` (không rút ngắn hạn đang có), ghi `viec_han_lan`. TVV ghi "Đã báo PH" khi đang chờ → yêu cầu tự đóng "TVV đã báo PH".
 *    Báo PH đã xong / đã bỏ → không trả lại. Vi phạm chưa có lần xử lý → trả được, không có gì tạm dừng.
 *  · Rút (phía TVV) khi còn chờ · Hoàn tác 60 giây (người trả) xoá hẳn · một yêu cầu mở mỗi vi phạm / lần xử lý (chỉ mục UNIQUE một phần).
 *  · Không đổi bậc, luật 3 vi phạm / 2 tuần, việc `yt_xu_ly`. Lịch sử vi phạm: `violation_history` field `tra_lai*` (reason = `tra_lai:{id}`).
 */
import { DS_JSON, db, tx } from '../db.ts';
import { CHU_TOI_THIEU, PERMISSIONS, duongHoSoHocVien, hanBaoPh, hanBaoPhHieuLuc, hanTraLai, nhanLoaiXuLy, tachTenMoTa } from '../../../shared/domain/index.ts';
import { can, coQuyenBuocTiep, laTvvCuaEm, type Principal } from '../permissions.ts';
import { badRequest, conflict, forbidden, notFound, nowIso } from '../util.ts';
import { demoToday } from '../demoConfig.ts';
import { notify, writeAudit } from '../platform/audit.ts';
import { khoangTamDung } from '../students/tamDung.ts';
import { canManageDiscipline, gvcnCuaEm } from './access.ts';
import { CHI_NHANH_EM, LY_DO_HE_THONG, xuLyCon } from './baoPhTvv.ts';
import { addHistory, editViolation, violationsByIds, type ViolationView } from './violations.ts';
import { baoTheoDoi, conHieuLuc, docViec, donViec, laNguoiTheoDoi, nguoiNhanTraLai, themTheoDoiDong } from '../worklist/giaoViec.ts';
import { GhiDao, daoLai, luuGhiDao, timGhiDao } from '../platform/ghiDao.ts';
import { chotHanXuLy } from './trangThai.ts';

const TOI_DA = 500;
const HOAN_TAC_MS = 60_000;
export type KetQuaTraLai = 'da_sua' | 'giu_nguyen' | 'da_xoa' | 'thu_hoi' | 'tvv_da_bao';
const NHAN_KET_QUA: Record<KetQuaTraLai, string> = { da_sua: 'GV đã sửa', giu_nguyen: 'GV đã trả lời', da_xoa: 'GV đã xoá vi phạm', thu_hoi: 'GVCN đã thu hồi', tvv_da_bao: 'TVV đã báo PH' };
const KIND = 'tra_lai_vi_pham';
const DA_DOI = 'Yêu cầu trả lại vừa được cập nhật — mở lại để xem.';

function kiemChu(v: unknown, ten: string): string {
  const s = typeof v === 'string' ? v.trim() : '';
  if (s.length < CHU_TOI_THIEU) throw badRequest(`${ten}: ít nhất ${CHU_TOI_THIEU} ký tự.`);
  if (s.length > TOI_DA) throw badRequest(`${ten}: tối đa ${TOI_DA} ký tự.`);
  return s;
}

/** Phía TVV của em (N61): TVV của em · TVV / CX cùng phạm vi (`coQuyenBuocTiep`) · Head / Quản trị trong phạm vi. GV, GVCN, Admin, BPXL: không. */
export const coTheTraLai = (p: Principal, s: { consultant_user_id: number | null; student_id: number; em_branch?: number | null }): boolean =>
  /* rà #1927 (8) + AU-2111 R1: "TVV của em" phải còn vai TVV ở chi nhánh của em. */
  laTvvCuaEm(p, s) || coQuyenBuocTiep(p, s.student_id) || can(p, PERMISSIONS.REQUEST_APPROVE, { studentId: s.student_id });

function load(id: number): any {
  if (!Number.isInteger(id) || id <= 0) throw badRequest('Yêu cầu không hợp lệ.');
  const r = db().prepare(`SELECT t.*, s.full_name, s.student_code, s.consultant_user_id, ${CHI_NHANH_EM} AS em_branch
      FROM vi_pham_tra_lai t JOIN students s ON s.id = t.student_id WHERE t.id = ?`).get(id) as any;
  if (!r) throw notFound('Không tìm thấy yêu cầu trả lại.');
  return r;
}

/** Câu SQL con: lần xử lý liên quan của một yêu cầu (`?1` = measure_id, `?2` = violation_id). */
const XU_LY_LIEN_QUAN = `SELECT m.id AS measure_id FROM discipline_measures m WHERE m.id = ?1 UNION SELECT mv.measure_id AS measure_id FROM measure_violations mv WHERE mv.violation_id = ?2`;
/** Việc Báo PH (vi phạm, không phải "báo lại") của các lần xử lý liên quan. */
const baoPhLienQuan = (measureId: number | null, violationId: number | null) => db().prepare(
  `SELECT v.id, v.trang_thai, v.measure_id, v.bao_lai_cua, v.phoi_hop_id, v.tinh_hinh_id, m.status AS xu_ly_status FROM viec_bao_ph v
     LEFT JOIN discipline_measures m ON m.id = v.measure_id WHERE v.measure_id IN (${XU_LY_LIEN_QUAN}) ORDER BY v.id`,
).all(measureId, violationId) as { id: number; trang_thai: string; measure_id: number; xu_ly_status: string | null }[];

/**
 * TRONG tx: đặt lại "Chờ GV sửa" của các việc Báo PH `ids` theo yêu cầu trả lại ĐANG MỞ của lần xử lý của việc đó (cả lần, hoặc một vi phạm còn trong lần đó).
 * Việc vừa HẾT dừng + `tinhLai` + còn mở → hạn = `hanBaoPh(hôm nay)` (N2) khi muộn hơn hạn hiệu lực đang có (`han_chon` + `viec_han_lan`; PTA chốt: không rút ngắn).
 * Một câu đọc + chỉ ghi khi đổi. Gọi khi: trả lại (việc liên quan) · đóng / rút / Hoàn tác (việc đang trỏ yêu cầu đó — `tra_lai_id`, rà #1927 (2)) ·
 * sửa vi phạm của lần xử lý. (Sinh việc Báo PH: đặt `tra_lai_id` ngay trong câu INSERT của `sinhViecBaoPh` — rà #1927 (5).)
 */
export function dongBoTamDung(ids: readonly number[], boi: number | null, tinhLai: boolean): void {
  if (!ids.length) return;
  const ds = db().prepare(`SELECT b.id, b.student_id, b.trang_thai, b.han, b.han_chon, b.tra_lai_id,
      (SELECT t.id FROM vi_pham_tra_lai t WHERE t.trang_thai = 'mo' AND (t.measure_id = b.measure_id
          OR t.violation_id IN (SELECT mv.violation_id FROM measure_violations mv WHERE mv.measure_id = b.measure_id)) ORDER BY t.id DESC LIMIT 1) AS moi
    FROM viec_bao_ph b WHERE b.id IN (${DS_JSON}) AND b.measure_id IS NOT NULL`).all(JSON.stringify(ids)) as any[];
  const het = ds.filter((b) => b.tra_lai_id != null && b.moi == null && tinhLai && b.trang_thai === 'mo');
  const khoang = het.length ? khoangTamDung([...new Set(het.map((b) => b.student_id as number))]) : {};
  const homNay = demoToday();
  for (const b of ds) {
    if ((b.tra_lai_id ?? null) !== (b.moi ?? null)) db().prepare('UPDATE viec_bao_ph SET tra_lai_id = ? WHERE id = ?').run(b.moi ?? null, b.id);
    if (!het.includes(b)) continue;
    const cu = hanBaoPhHieuLuc(b.han, khoang[b.student_id], b.han_chon);
    const moi = hanBaoPh(homNay);
    if (moi <= cu) continue;
    db().prepare('UPDATE viec_bao_ph SET han_chon = ? WHERE id = ?').run(moi, b.id);
    db().prepare('INSERT INTO viec_han_lan (loai, viec_id, han_cu, han_moi, mac_dinh, boi, luc) VALUES (?,?,?,?,2,?,?)').run('bao_ph', b.id, cu, moi, boi, nowIso());   // TL-2: 2 = máy tính lại (không phải người chỉnh)
  }
}
/** Việc Báo PH đang dừng vì yêu cầu `id` (chỉ mục một phần `idx_viec_bao_ph_tra_lai`). */
const baoPhDangDung = (id: number) => (db().prepare('SELECT id FROM viec_bao_ph WHERE tra_lai_id = ?').all(id) as any[]).map((r) => r.id as number);

/** Vi phạm ghi lịch sử của yêu cầu (một vi phạm → nó; cả lần xử lý → mọi vi phạm của lần đó). */
const viPhamCua = (r: { violation_id: number | null; measure_id: number | null }): number[] => (r.violation_id ? [r.violation_id]
  : (db().prepare('SELECT violation_id FROM measure_violations WHERE measure_id = ? ORDER BY violation_id').all(r.measure_id) as any[]).map((x) => x.violation_id as number));
const ghiLichSu = (r: any, field: string, moi: string | null, boi: number | null) => { for (const vid of viPhamCua(r)) addHistory(vid, field, null, moi, boi, `tra_lai:${r.id}`); };

// ---------------------------------------------------------------- trả lại

export type TraLaiView = {
  id: number; studentId: number; tenEm: string; violationId: number | null; measureId: number | null; nhanXuLy: string | null;
  lyDo: string; nguoiTra: { id: number; ten: string | null }; traLuc: string;
  han: string; hanMacDinh: string; quaHan: boolean; trangThai: 'mo' | 'xong' | 'rut'; ketQua: KetQuaTraLai | null; nhanKetQua: string | null;
  traLoi: string | null; xongLuc: string | null; xongBoi: string | null; phuTrach: { id: number; ten: string | null }[];
  viPham: ViolationView[];
  /** TL-2 (mockup v22 T4c "Còn lại n vi phạm trong REPORT 1"): lần xử lý chứa vi phạm (một vi phạm) / chính lần đó (cả lần) + số vi phạm của lần. null = chưa có lần xử lý. */
  lanXuLy: { id: number; nhan: string; soViPham: number } | null;
  /** Phía TVV: rút (còn chờ) · Hoàn tác (người trả, ≤ 60 giây). Phía GV: gửi lại / giữ nguyên / xoá (một vi phạm) · thu hồi (cả lần, GVCN / Head). */
  coTheRut: boolean; hoanTacDuoc: boolean; coTheLam: boolean; coTheXoa: boolean; coTheThuHoi: boolean;
};

/** Ai làm được việc GV: người đang phụ trách (người nhận / người được giao còn hiệu lực) · GVCN lớp em đang học / Head (`discipline.manage`). */
/* rà #1927 (8): người đã trả (CX / Head) không tự trả lời phía GV cho chính yêu cầu đó — trừ khi chính họ là người giữ việc. */
const coTheLam = (p: Principal, v: ReturnType<typeof docViec>) => v.phuTrach.includes(p.userId) || (canManageDiscipline(p, v.studentId!) && v.row.nguoi_tra !== p.userId);

export function xemTraLai(p: Principal, id: number): TraLaiView {
  const r = load(id);
  const v = docViec('tra_lai', id);
  const tvv = coTheTraLai(p, r);
  if (!tvv && !v.phuTrach.includes(p.userId) && !can(p, PERMISSIONS.STUDENT_VIEW, { studentId: r.student_id }) && !laNguoiTheoDoi('tra_lai', id, p.userId, r.em_branch ?? null)) {
    throw forbidden('Học viên ngoài phạm vi của bạn.');
  }
  const m = r.measure_id ? db().prepare('SELECT kind, custom_name, status FROM discipline_measures WHERE id = ?').get(r.measure_id) as any : null;
  /* TL-2: một câu — lần xử lý mới nhất (không nháp) chứa vi phạm / chính lần đó + số vi phạm của lần. */
  const lan = db().prepare(`SELECT x.id, x.kind, x.custom_name, (SELECT COUNT(*) FROM measure_violations c WHERE c.measure_id = x.id) AS so FROM discipline_measures x
      WHERE x.status != 'nhap' AND (x.id = ?1 OR x.id IN (SELECT mv.measure_id FROM measure_violations mv WHERE mv.violation_id = ?2)) ORDER BY x.id DESC LIMIT 1`)
    .get(r.measure_id ?? null, r.violation_id ?? null) as any;
  const ten = new Map<number, string>((db().prepare(`SELECT id, full_name FROM users WHERE id IN (${DS_JSON})`)
    .all(JSON.stringify([r.nguoi_tra, r.xong_boi, ...v.phuTrach].filter(Boolean))) as any[]).map((u) => [u.id, u.full_name]));
  const han = r.han_chon ?? r.han;
  const mo = r.trang_thai === 'mo';
  const lam = mo && coTheLam(p, v);
  return {
    id, studentId: r.student_id, tenEm: r.full_name, violationId: r.violation_id ?? null, measureId: r.measure_id ?? null, nhanXuLy: m ? nhanLoaiXuLy(m.kind, m.custom_name ?? null) : null,
    lyDo: r.ly_do, nguoiTra: { id: r.nguoi_tra, ten: ten.get(r.nguoi_tra) ?? null }, traLuc: r.tra_luc,
    han, hanMacDinh: r.han, quaHan: mo && han < demoToday(), trangThai: r.trang_thai, ketQua: r.ket_qua ?? null, nhanKetQua: r.ket_qua ? NHAN_KET_QUA[r.ket_qua as KetQuaTraLai] ?? null : null,
    traLoi: r.tra_loi ?? null, xongLuc: r.xong_luc ?? null, xongBoi: r.xong_boi ? ten.get(r.xong_boi) ?? null : null,
    phuTrach: v.phuTrach.map((u) => ({ id: u, ten: ten.get(u) ?? null })),
    viPham: violationsByIds(viPhamCua(r)),
    lanXuLy: lan ? { id: lan.id, nhan: nhanLoaiXuLy(lan.kind, lan.custom_name ?? null), soViPham: lan.so } : null,
    coTheRut: mo && tvv, hoanTacDuoc: (mo && r.nguoi_tra === p.userId && Date.now() - Date.parse(r.tra_luc) <= HOAN_TAC_MS) || gvHoanTacDuoc(p, r),
    coTheLam: lam, coTheXoa: lam && r.violation_id != null, coTheThuHoi: mo && r.measure_id != null && m?.status !== 'thu_hoi' && canManageDiscipline(p, r.student_id),
  };
}

/**
 * Trả MỘT vi phạm (`violationId`) hoặc cả lần xử lý (`measureId`) + lý do. Bấm hai lần (cùng người, cùng lý do, còn chờ) → trả bản đã có.
 * Đã có yêu cầu mở của người khác / lý do khác → 409.
 */
export function traLai(p: Principal, body: { violationId?: unknown; measureId?: unknown; lyDo?: unknown }): TraLaiView {
  const vid = body.violationId == null || body.violationId === '' ? null : Number(body.violationId);
  const mid = body.measureId == null || body.measureId === '' ? null : Number(body.measureId);
  if ((vid === null) === (mid === null)) throw badRequest('Chọn một vi phạm hoặc một lần xử lý để trả lại.');
  const id0 = (vid ?? mid)!;
  if (!Number.isInteger(id0) || id0 <= 0) throw badRequest('Vi phạm / lần xử lý không hợp lệ.');
  const lyDo = kiemChu(body.lyDo, 'Lý do');
  const goc = vid ? db().prepare('SELECT id, student_id, reported_by FROM violations WHERE id = ?').get(vid) as any
    : db().prepare('SELECT id, student_id, kind, custom_name FROM discipline_measures WHERE id = ?').get(mid) as any;
  if (!goc) throw notFound(vid ? 'Không tìm thấy vi phạm.' : 'Không tìm thấy lần xử lý.');
  const s = db().prepare(`SELECT s.id AS student_id, s.full_name, s.student_code, s.consultant_user_id, ${CHI_NHANH_EM} AS em_branch FROM students s WHERE s.id = ?`).get(goc.student_id) as any;
  if (!coTheTraLai(p, s)) throw forbidden('Chỉ TVV, CX hoặc Head của em trả lại được vi phạm.');
  /* N61 ĐÃ CHỐT: Báo PH đã xong / đã bỏ thì không trả lại. Vi phạm chưa có lần xử lý (chưa sinh Báo PH) → trả được. Cả lần xử lý: Báo PH phải còn mở. */
  const bp = baoPhLienQuan(mid, vid);
  /* rà #1927 lần 2: lần xử lý không còn (thu hồi / Head từ chối) → việc Báo PH chỉ xem — cùng câu với giao diện (`xuLyCon`). */
  const moBp = bp.filter((b) => b.trang_thai === 'mo' && xuLyCon(b) === 'con');
  const ngoai = bp.find((b) => b.trang_thai === 'mo' && xuLyCon(b) !== 'con');
  if ((bp.length || mid) && !moBp.length) {
    throw badRequest(ngoai ? `${(LY_DO_HE_THONG as Record<string, string>)[`system_${xuLyCon(ngoai)}`]} — việc Báo PH chỉ xem.` : 'Việc Báo PH của lần xử lý này đã xong hoặc đã bỏ — không trả lại được nữa.');
  }
  const cot = vid ? 'violation_id' : 'measure_id';
  const DANG_CHO = vid ? 'Vi phạm này đang chờ GV sửa — rút yêu cầu cũ nếu muốn trả lại lần nữa.' : 'Lần xử lý này đang chờ GVCN sửa — rút yêu cầu cũ nếu muốn trả lại lần nữa.';
  const dangMo = db().prepare(`SELECT id, nguoi_tra, ly_do FROM vi_pham_tra_lai WHERE ${cot} = ? AND trang_thai = 'mo'`).get(id0) as any;
  if (dangMo) {
    if (dangMo.nguoi_tra === p.userId && dangMo.ly_do === lyDo) return xemTraLai(p, dangMo.id);
    throw conflict(DANG_CHO);
  }
  const homNay = demoToday();
  const g = gvcnCuaEm(s.student_id, homNay);
  const branchId: number | null = s.em_branch ?? null;
  const nhan = nguoiNhanTraLai({ student_id: s.student_id, violation_id: vid });   // một hàm với `docViec` / `/my-work` (rà #1927 (4))
  const han = hanTraLai(homNay);
  const id = tx(() => {
    let id: number;
    try {
      id = Number(db().prepare(`INSERT INTO vi_pham_tra_lai (student_id, violation_id, measure_id, ly_do, nguoi_tra, tra_luc, han, nguoi_nhan, trang_thai)
          VALUES (?,?,?,?,?,?,?,?, 'mo')`).run(s.student_id, vid, mid, lyDo, p.userId, nowIso(), han, nhan).lastInsertRowid);
    } catch (e: any) {
      /* rà #1927 (7): hai người trả cùng lúc — chỉ mục UNIQUE một phần chặn người sau. */
      if (/UNIQUE/i.test(String(e?.message ?? e))) throw conflict(DANG_CHO);
      throw e;
    }
    dongBoTamDung(moBp.map((b) => b.id), p.userId, false);
    /* Theo dõi mặc định (thiết kế E): người trả + GVCN khi người nhận là GVBM. */
    themTheoDoiDong('tra_lai', id, [p.userId], 'tay', p.userId, branchId);
    if (g.gvcn && g.gvcn !== nhan) themTheoDoiDong('tra_lai', id, [g.gvcn], 'gvcn', null, branchId);
    ghiLichSu({ id, violation_id: vid, measure_id: mid }, 'tra_lai', lyDo, p.userId);
    if (nhan && nhan !== p.userId) {
      notify({ userId: nhan, kind: KIND, title: `${vid ? 'Vi phạm' : 'Lần xử lý'} bị trả lại · ${s.full_name} · hạn ${han.slice(8, 10)}/${han.slice(5, 7)}`, body: lyDo.slice(0, 160),
        entityType: 'student', entityId: s.student_id, dedupKey: `tra-lai:${id}`, duong: `/cong-viec?viec=${encodeURIComponent(`yt_tra_lai:${id}`)}`, han });
    }
    writeAudit({ actorUserId: p.userId, action: 'tra_lai.tao', entityType: 'vi_pham_tra_lai', entityId: id,
      entityLabel: `${s.student_code} · trả lại ${vid ? 'vi phạm' : nhanLoaiXuLy(goc.kind, goc.custom_name ?? null)}`, after: { violationId: vid, measureId: mid, lyDo, nguoiNhan: nhan, han } });
    return id;
  });
  return xemTraLai(p, id);
}

/**
 * Hoàn tác (người trả, ≤ 60 giây, còn chờ) → xoá hẳn: Báo PH bỏ tạm dừng (hạn như cũ), lịch sử + tin của lần trả gỡ.
 * B1-11 (AUDIT-2111): GV vừa "Sửa rồi gửi lại" / "Giữ nguyên" (người làm, ≤ 60 giây) → đảo về "mở" (`hoanTacGv`).
 */
export function hoanTacTraLai(p: Principal, id: number): { ok: true } {
  const r = load(id);
  if (r.trang_thai === 'xong' && GV_HOAN_TAC.has(r.ket_qua)) return hoanTacGv(p, r);
  if (r.nguoi_tra !== p.userId) throw forbidden('Chỉ người trả lại hoàn tác được — dùng Rút yêu cầu.');   // AU-2111 B1-07: nói đúng lý do
  if (!conHieuLuc(p.userId, r.student_id)) throw forbidden('Bạn không còn vai ở chi nhánh của em — nhờ Head chi nhánh của em rút yêu cầu.');   // AU-2111 R1
  if (r.trang_thai !== 'mo' || Date.now() - Date.parse(r.tra_luc) > HOAN_TAC_MS) throw badRequest('Quá thời gian Hoàn tác — dùng Rút yêu cầu.');
  tx(() => {
    const dung = baoPhDangDung(id);
    /* rà #1927 (6): theo chỉ mục vi phạm, không quét cả bảng. */
    db().prepare(`DELETE FROM violation_history WHERE violation_id IN (${DS_JSON}) AND reason = ?`).run(JSON.stringify(viPhamCua(r)), `tra_lai:${id}`);
    db().prepare('DELETE FROM notifications WHERE dedup_key = ?').run(`tra-lai:${id}`);
    if (!db().prepare(`DELETE FROM vi_pham_tra_lai WHERE id = ? AND trang_thai = 'mo'`).run(id).changes) throw conflict('Yêu cầu vừa được cập nhật — mở lại để xem.');
    donViec('tra_lai', [id]);
    dongBoTamDung(dung, p.userId, false);   // Hoàn tác: hạn Báo PH như cũ
    writeAudit({ actorUserId: p.userId, action: 'tra_lai.hoan_tac', entityType: 'vi_pham_tra_lai', entityId: id, entityLabel: `${r.student_code} · hoàn tác trả lại`,
      before: { violationId: r.violation_id, measureId: r.measure_id, lyDo: r.ly_do } });
  });
  return { ok: true };
}

/** B1-11: kết quả phía GV có Hoàn tác 60 giây (Xoá vi phạm: Hoàn tác = khôi phục Thùng rác; Thu hồi: đường của lần xử lý). */
const GV_HOAN_TAC = new Set(['da_sua', 'giu_nguyen']);
const LOAI_DAO_GV = 'tra_lai.gv';
const gvHoanTacDuoc = (p: Principal, r: any) => r.trang_thai === 'xong' && GV_HOAN_TAC.has(r.ket_qua) && r.xong_boi === p.userId && Date.now() - Date.parse(r.xong_luc) <= HOAN_TAC_MS;

/**
 * TRONG tx: GV gửi lại / giữ nguyên — chụp yêu cầu + vi phạm + Báo PH đang dừng (sửa), lịch sử vi phạm · lịch sử hạn Báo PH · tin vừa thêm (`ghi_dao`).
 * Đảo = về đúng lúc trước (yêu cầu "mở", vi phạm như trước khi sửa, Báo PH "Chờ GV sửa" + hạn cũ, tin gỡ) — chỉ khi chưa ai đổi tiếp (không → 409).
 */
function ghiDaoGv(r: any, boi: number, fn: () => void): void {
  const g = new GhiDao(db());
  const vids = JSON.stringify(viPhamCua(r));
  const bp = JSON.stringify(baoPhDangDung(r.id));
  g.sua('vi_pham_tra_lai', 'id = ?', r.id);
  if (r.violation_id) g.sua('violations', 'id = ?', r.violation_id);
  g.sua('viec_bao_ph', `id IN (${DS_JSON})`, bp);
  /* Tin của lần đóng: `tra-lai-kq:{id}` (TVV) + `gv:tra_lai:{id}:…` (người theo dõi) — khoảng khoá theo chỉ mục `dedup_key`, không quét bảng. */
  g.theoDoi('violation_history', `violation_id IN (${DS_JSON})`, [vids], () =>
    g.theoDoi('viec_han_lan', `loai = 'bao_ph' AND viec_id IN (${DS_JSON})`, [bp], () =>
      g.theoDoi('notifications', 'dedup_key = ? OR (dedup_key >= ? AND dedup_key < ?)', [`tra-lai-kq:${r.id}`, `gv:tra_lai:${r.id}:`, `gv:tra_lai:${r.id};`], fn)));
  luuGhiDao(db(), { loai: LOAI_DAO_GV, bang: 'vi_pham_tra_lai', id: r.id, nguoi: boi, ghi: g });
}

function hoanTacGv(p: Principal, r: any): { ok: true } {
  if (!gvHoanTacDuoc(p, r)) throw badRequest('Quá thời gian Hoàn tác — nhờ TVV trả lại lần nữa nếu cần sửa.');
  const g = timGhiDao(db(), LOAI_DAO_GV, 'vi_pham_tra_lai', r.id);
  if (!g) throw conflict(DA_DOI);
  /* Rà PTA #1954 (3): TVV đã trả lại lần nữa (yêu cầu mới đang mở cho cùng vi phạm / lần xử lý) → không để hai yêu cầu cùng mở. */
  const cot = r.violation_id ? 'violation_id' : 'measure_id';
  if (db().prepare(`SELECT 1 FROM vi_pham_tra_lai WHERE ${cot} = ? AND trang_thai = 'mo' AND id != ?`).get(r.violation_id ?? r.measure_id, r.id)) {
    throw conflict('TVV vừa trả lại lần nữa — xử lý yêu cầu mới ở Công việc thay vì Hoàn tác.');
  }
  tx(() => {
    daoLai(db(), g, p.userId);
    chotHanXuLy([r.student_id]);   // vi phạm về như trước khi sửa → hạn xử lý tính lại
    writeAudit({ actorUserId: p.userId, action: 'tra_lai.hoan_tac_gv', entityType: 'vi_pham_tra_lai', entityId: r.id, entityLabel: `${r.student_code} · hoàn tác ${NHAN_KET_QUA[r.ket_qua as KetQuaTraLai]}`,
      before: { trangThai: 'xong', ketQua: r.ket_qua }, after: { trangThai: 'mo' } });
  });
  return { ok: true };
}

/** P1-03 (AUDIT-2111 A1-01): lúc xoá vi phạm — yêu cầu còn mở + Báo PH đang dừng vì chúng (hạn trước / sau khi máy tính lại, dòng lịch sử hạn máy vừa thêm). */
export type TraLaiKhiXoa = { mo: number[]; baoPh: { id: number; sid: number; truoc: string | null; sau: string | null; lan: number[] }[] };

/** TRONG tx của `deleteViolation`: đóng "GV đã xoá vi phạm" (tin TVV, Báo PH hết dừng — đường cũ) và trả lại phần cần để khôi phục như cũ. */
export function dongKhiXoaViPham(violationId: number, boi: number): TraLaiKhiXoa {
  const mo = (db().prepare(`SELECT id FROM vi_pham_tra_lai WHERE violation_id = ? AND trang_thai = 'mo'`).all(violationId) as any[]).map((r) => r.id as number);
  if (!mo.length) return { mo, baoPh: [] };
  const truoc = db().prepare(`SELECT id, student_id, han_chon FROM viec_bao_ph WHERE tra_lai_id IN (${DS_JSON})`).all(JSON.stringify(mo)) as any[];
  const lanMax = (db().prepare('SELECT COALESCE(MAX(id), 0) AS m FROM viec_han_lan').get() as any).m as number;
  dongTheoDuongSanCo({ violationId }, 'da_xoa', boi);
  const ids = JSON.stringify(truoc.map((b) => b.id as number));
  const sau = new Map((db().prepare(`SELECT id, han_chon FROM viec_bao_ph WHERE id IN (${DS_JSON})`).all(ids) as any[]).map((b) => [b.id as number, (b.han_chon ?? null) as string | null]));
  const lan = db().prepare(`SELECT id, viec_id FROM viec_han_lan WHERE id > ? AND loai = 'bao_ph' AND viec_id IN (${DS_JSON})`).all(lanMax, ids) as any[];
  return { mo, baoPh: truoc.map((b) => ({ id: b.id, sid: b.student_id, truoc: b.han_chon ?? null, sau: sau.get(b.id) ?? null,
    lan: lan.filter((l) => l.viec_id === b.id).map((l) => l.id as number) })) };
}

/**
 * TRONG tx khôi phục vi phạm (Hoàn tác / Thùng rác — yêu cầu đã về "mở" theo bản chụp): Báo PH của đúng em, còn mở → "Chờ GV sửa"; hạn như trước khi hạn còn đúng
 * hạn máy vừa tính lúc xoá (ai đã sửa sau đó thì giữ); TVV người trả nhận MỘT tin "GV đã hoàn tác xoá". `khoa` = id mục Thùng rác (mỗi lần khôi phục một tin).
 */
export function khoiPhucTraLaiKhiXoa(k: TraLaiKhiXoa | undefined, nguoi: number, khoa: number): void {
  if (!k?.mo.length) return;
  const ids = k.mo;   // vi_pham_tra_lai AUTOINCREMENT: khôi phục giữ id cũ
  const mo = db().prepare(`SELECT t.id, t.student_id, t.nguoi_tra, s.full_name FROM vi_pham_tra_lai t JOIN students s ON s.id = t.student_id
      WHERE t.id IN (${DS_JSON}) AND t.trang_thai = 'mo'`).all(JSON.stringify(ids)) as any[];
  if (!mo.length) return;
  /* Rà PTA #1954 (1): tin kết quả của lần đóng "GV đã xoá vi phạm" (TVV `tra-lai-kq` + người theo dõi `gv:tra_lai:{id}:ket_qua:…`) gỡ — yêu cầu mở lại;
     lần đóng sau gửi tin MỚI (notify trùng khoá chỉ sửa chữ, không đặt lại "chưa đọc"). Khoảng khoá theo chỉ mục `dedup_key`. */
  for (const r of mo) {
    db().prepare('DELETE FROM notifications WHERE dedup_key = ? OR (dedup_key >= ? AND dedup_key < ?)').run(`tra-lai-kq:${r.id}`, `gv:tra_lai:${r.id}:ket_qua:`, `gv:tra_lai:${r.id}:ket_qua;`);
  }
  const con = new Map((db().prepare(`SELECT id, student_id, trang_thai FROM viec_bao_ph WHERE id IN (${DS_JSON})`).all(JSON.stringify(k.baoPh.map((b) => b.id))) as any[])
    .map((b) => [b.id as number, b]));
  const dung: number[] = [];
  let baoXong = false;
  for (const b of k.baoPh) {
    const r = con.get(b.id);
    if (r && r.student_id === b.sid && r.trang_thai === 'xong') baoXong = true;
    if (!r || r.student_id !== b.sid || r.trang_thai !== 'mo') continue;   // id việc đã thuộc em khác / Báo PH đã xong → không đụng
    dung.push(b.id);
    if (b.truoc === b.sau || !db().prepare('UPDATE viec_bao_ph SET han_chon = ? WHERE id = ? AND han_chon IS ?').run(b.truoc, b.id, b.sau).changes) continue;
    if (b.lan.length) db().prepare(`DELETE FROM viec_han_lan WHERE loai = 'bao_ph' AND viec_id = ? AND id IN (${DS_JSON})`).run(b.id, JSON.stringify(b.lan));
  }
  /* Rà PTA #1954 (2), N61: trong lúc vi phạm nằm ở Thùng rác, TVV đã báo PH xong → yêu cầu không mở lại mà đóng "TVV đã báo PH" (GV nhận tin như đường cũ). */
  if (!dung.length && baoXong) {
    for (const r of mo) dong(load(r.id), nguoi, { trangThai: 'xong', ketQua: 'tvv_da_bao' });
    return;
  }
  dongBoTamDung(dung, nguoi, false);
  const ten = (db().prepare('SELECT full_name FROM users WHERE id = ?').get(nguoi) as any)?.full_name ?? null;
  for (const r of mo) {
    if (r.nguoi_tra === nguoi || !conHieuLuc(r.nguoi_tra, r.student_id)) continue;
    notify({ userId: r.nguoi_tra, kind: KIND, title: ['GV đã hoàn tác xoá', r.full_name, ten].filter(Boolean).join(' · '), body: null, entityType: 'student', entityId: r.student_id,
      dedupKey: `tra-lai-kp:${r.id}:${khoa}`, duong: dung.length ? `/cong-viec?viec=${encodeURIComponent(`bao-ph:${dung[0]}`)}` : duongHoSoHocVien(r.student_id, { tab: 'y-thuc' }) });
  }
}

/**
 * TRONG tx: đóng một yêu cầu đang mở — `xong` + kết quả, hoặc `rut`. So-và-đổi (`trang_thai = 'mo'`) → hai người cùng bấm: người sau 409.
 * Bỏ tạm dừng Báo PH + tính lại hạn · lịch sử vi phạm · tin: TVV người trả (GV đã sửa / trả lời / xoá / thu hồi) · người phụ trách (khi TVV rút / đã báo PH) ·
 * người theo dõi (khung giao việc). Không gửi người thao tác.
 */
function dong(r: any, boi: number | null, o: { trangThai: 'xong' | 'rut'; ketQua?: KetQuaTraLai; traLoi?: string | null }): void {
  const phuTrach = docViec('tra_lai', r.id).phuTrach;
  const dungBp = baoPhDangDung(r.id);   // TL-2: đọc TRƯỚC khi gỡ tạm dừng — tin TVV mở đúng panel Báo PH
  if (!db().prepare(`UPDATE vi_pham_tra_lai SET trang_thai = ?, ket_qua = ?, tra_loi = ?, xong_luc = ?, xong_boi = ? WHERE id = ? AND trang_thai = 'mo'`)
    .run(o.trangThai, o.ketQua ?? null, o.traLoi ?? null, nowIso(), boi, r.id).changes) throw conflict(DA_DOI);
  /* PTA chốt (rà #1927): TVV RÚT → chỉ gỡ tạm dừng, giữ hạn cũ (không kéo hạn bằng trả lại rồi rút); còn lại tính lại hạn. */
  dongBoTamDung(dungBp, boi, o.trangThai !== 'rut');
  if (o.ketQua !== 'da_xoa') ghiLichSu(r, o.trangThai === 'rut' ? 'tra_lai_rut' : `tra_lai_${o.ketQua}`, o.traLoi ?? null, boi);   // đã xoá: lịch sử đi theo vi phạm vào Thùng rác
  const tieuDe = `${r.measure_id ? 'Lần xử lý' : 'Vi phạm'} bị trả lại · ${r.full_name}`;
  const chu = o.trangThai === 'rut' ? 'TVV đã rút yêu cầu' : NHAN_KET_QUA[o.ketQua!];
  const aid = writeAudit({ actorUserId: boi, action: o.trangThai === 'rut' ? 'tra_lai.rut' : `tra_lai.${o.ketQua}`, entityType: 'vi_pham_tra_lai', entityId: r.id,
    entityLabel: `${r.student_code} · ${chu}`, before: { trangThai: 'mo' }, after: { trangThai: o.trangThai, ketQua: o.ketQua ?? null, traLoi: o.traLoi ?? null } });
  const phiaTvv = o.trangThai === 'rut' || o.ketQua === 'tvv_da_bao';
  const daBao = baoTheoDoi('tra_lai', r.id, boi ?? 0, { suKien: phiaTvv ? 'bo' : 'ket_qua', tieuDe, chiTiet: [chu, o.traLoi].filter(Boolean).join(' · '), khoa: aid,
    studentId: r.student_id, duong: duongHoSoHocVien(r.student_id, { tab: 'y-thuc' }), boQua: [phiaTvv ? null : r.nguoi_tra] });
  /* rà #1927 (8): người trả chỉ nhận tin khi còn hoạt động + còn vai ở chi nhánh em. */
  const den = phiaTvv ? phuTrach : conHieuLuc(r.nguoi_tra, r.student_id) ? [r.nguoi_tra] : [];
  /* TL-2 (mockup v22 T6a): tin TVV = "{kết quả} · {em} · {người làm}" + nội dung (vi phạm sau sửa / lời trả lời); bấm tin mở đúng panel Báo PH đang chờ.
     Tin phía GV (TVV rút / đã báo PH) giữ chữ cũ, mở hồ sơ HV › Ý thức. */
  const tenBoi = !phiaTvv && boi ? (db().prepare('SELECT full_name FROM users WHERE id = ?').get(boi) as any)?.full_name ?? null : null;
  const sau = o.ketQua === 'da_sua' && r.violation_id ? db().prepare('SELECT ten, description, category FROM violations WHERE id = ?').get(r.violation_id) as any : null;
  const tm = sau ? tachTenMoTa(sau.ten, sau.description, sau.category) : null;
  const noiDung = o.traLoi ?? (tm ? [tm.ten, tm.moTa].filter(Boolean).join(' · ') || null : null);
  for (const uid of den) {
    if (uid === boi || daBao.has(uid)) continue;
    notify({ userId: uid, kind: KIND, title: phiaTvv ? `${chu} · ${tieuDe}` : [chu, r.full_name, tenBoi].filter(Boolean).join(' · '), body: noiDung?.slice(0, 160) ?? null,
      entityType: 'student', entityId: r.student_id, dedupKey: `tra-lai-kq:${r.id}`,
      duong: !phiaTvv && dungBp.length ? `/cong-viec?viec=${encodeURIComponent(`bao-ph:${dungBp[0]}`)}` : duongHoSoHocVien(r.student_id, { tab: 'y-thuc' }) });
  }
}

/** Rút (phía TVV, khi GV chưa xử lý). */
export function rutTraLai(p: Principal, id: number): TraLaiView {
  const r = load(id);
  if (!coTheTraLai(p, r)) throw forbidden('Chỉ TVV, CX hoặc Head của em rút được yêu cầu.');
  if (r.trang_thai !== 'mo') throw conflict(DA_DOI);
  tx(() => dong(r, p.userId, { trangThai: 'rut' }));
  return xemTraLai(p, id);
}

function requireLam(p: Principal, r: any): void {
  if (r.trang_thai !== 'mo') throw conflict(r.trang_thai === 'rut' ? 'TVV đã rút yêu cầu — mở lại để xem.' : DA_DOI);
  if (!coTheLam(p, docViec('tra_lai', r.id))) throw forbidden('Chỉ người nhận việc, GVCN lớp em đang học hoặc Head xử lý được yêu cầu trả lại.');
}

/**
 * Sửa rồi gửi lại: một vi phạm — `sua` = thân sửa vi phạm (Vi phạm, Mô tả, nhóm, môn, NGÀY…) đi đường `editViolation` (mỗi trường đổi một dòng lịch sử; người
 * nhận việc sửa được dù không còn là người ghi hợp lệ — `canEditViolation`); cả lần xử lý — GVCN đã sửa ở tab Ý thức, chỉ gửi lại. Lưu = xong.
 */
export function guiLaiTraLai(p: Principal, id: number, body: { sua?: unknown }): TraLaiView {
  const r = load(id);
  requireLam(p, r);
  tx(() => ghiDaoGv(r, p.userId, () => {
    const b = body.sua && typeof body.sua === 'object' ? body.sua as Record<string, any> : null;
    /* Cùng ánh xạ với PATCH /violations/:id (không nhận `chiNhac` — đổi Vi phạm ↔ Nhắc nhở đi đường sửa thường). */
    if (r.violation_id && b) editViolation(p, r.violation_id, { ten: 'ten' in b ? (b.ten ?? null) : undefined, description: b.description, category: b.category,
      skill: 'skill' in b ? (b.skill ?? null) : undefined, occurredOn: 'occurredOn' in b ? (b.occurredOn ?? null) : undefined });
    dong(r, p.userId, { trangThai: 'xong', ketQua: 'da_sua' });
  }));
  return xemTraLai(p, id);
}

/** Giữ nguyên + trả lời ≥ 8 ký tự. */
export function giuNguyenTraLai(p: Principal, id: number, body: { traLoi?: unknown }): TraLaiView {
  const r = load(id);
  requireLam(p, r);
  const traLoi = kiemChu(body.traLoi, 'Trả lời');
  tx(() => ghiDaoGv(r, p.userId, () => dong(r, p.userId, { trangThai: 'xong', ketQua: 'giu_nguyen', traLoi })));
  return xemTraLai(p, id);
}

/**
 * TRONG tx của đường sẵn có: vi phạm bị xoá (`deleteViolation`) → yêu cầu mở của nó đóng "đã xoá" · thu hồi CHỐT (`apDungThuHoi` — Head làm thẳng / duyệt /
 * tự chốt; GVCN gửi chờ duyệt thì yêu cầu còn mở, PTA chốt) → yêu cầu mở cả lần đóng "thu hồi" · TVV ghi "Đã báo PH" (`ghiKetQuaBaoPh`, gọi TRƯỚC khi việc
 * sang xong → hạn tính lại trước, lần báo không bị tính trễ) → mọi yêu cầu đang dừng việc đó đóng "TVV đã báo PH".
 */
export function dongTheoDuongSanCo(o: { violationId?: number; measureId?: number; baoPhId?: number }, ketQua: KetQuaTraLai, boi: number | null): void {
  const rows = o.baoPhId
    ? db().prepare(`SELECT t.id FROM vi_pham_tra_lai t WHERE t.trang_thai = 'mo' AND (t.measure_id IN (SELECT measure_id FROM viec_bao_ph WHERE id = ?1)
        OR t.violation_id IN (SELECT mv.violation_id FROM measure_violations mv WHERE mv.measure_id IN (SELECT measure_id FROM viec_bao_ph WHERE id = ?1)))`).all(o.baoPhId) as any[]
    : db().prepare(`SELECT id FROM vi_pham_tra_lai WHERE ${o.violationId ? 'violation_id' : 'measure_id'} = ? AND trang_thai = 'mo'`).all(o.violationId ?? o.measureId) as any[];
  for (const x of rows) dong(load(x.id), boi, { trangThai: 'xong', ketQua });
}

/** TRONG tx của chỗ xoá dòng gốc (Hoàn tác xử lý, rút đề xuất): gỡ hẳn yêu cầu của lần xử lý + dọn khung giao việc (Báo PH của lần đó cũng bị gỡ). */
export function xoaTraLaiCuaXuLy(measureId: number): void {
  const ids = (db().prepare('SELECT id FROM vi_pham_tra_lai WHERE measure_id = ?').all(measureId) as any[]).map((r) => r.id as number);
  if (!ids.length) return;
  db().prepare(`DELETE FROM vi_pham_tra_lai WHERE id IN (${DS_JSON})`).run(JSON.stringify(ids));
  donViec('tra_lai', ids);
}

/** Yêu cầu mở của các vi phạm / lần xử lý (panel Báo PH, tab Ý thức) — MỘT câu. */
export type TraLaiMo = { id: number; violationId: number | null; measureId: number | null; han: string; nguoiTra: number; lyDo: string; traLuc: string; nguoiNhan: string | null };
/* TL-2 (mockup v22 T3a / T7b): dải "Chờ GV sửa" cần lý do + người đang giữ việc — đọc CÙNG câu (người được giao trước, không thì người nhận theo luật). */
export function traLaiDangMo(o: { violationIds: readonly number[]; measureIds: readonly number[] }): TraLaiMo[] {
  if (!o.violationIds.length && !o.measureIds.length) return [];
  return (db().prepare(`SELECT t.id, t.violation_id, t.measure_id, COALESCE(t.han_chon, t.han) AS han, t.nguoi_tra, t.ly_do, t.tra_luc, u.full_name AS nguoi_nhan
      FROM vi_pham_tra_lai t LEFT JOIN users u ON u.id = COALESCE(t.phu_trach_id, t.nguoi_nhan) WHERE t.trang_thai = 'mo'
      AND (t.violation_id IN (${DS_JSON}) OR t.measure_id IN (${DS_JSON})) ORDER BY t.id`).all(JSON.stringify(o.violationIds), JSON.stringify(o.measureIds)) as any[])
    .map((r) => ({ id: r.id, violationId: r.violation_id ?? null, measureId: r.measure_id ?? null, han: r.han, nguoiTra: r.nguoi_tra, lyDo: r.ly_do, traLuc: r.tra_luc, nguoiNhan: r.nguoi_nhan ?? null }));
}

/**
 * TL-2: nút "Trả lại" ở chi tiết vi phạm (tab Ý thức lớp / HV) — người xem phía TVV + đúng luật chặn của `traLai` (Báo PH của lần xử lý còn mở; chưa có lần xử lý
 * thì trả được) + yêu cầu đang mở (dải "Chờ GV sửa"). Phía TVV mới đọc Báo PH (một câu); yêu cầu mở một câu.
 */
export function traLaiCuaViPham(p: Principal, violationId: number, s: { consultant_user_id: number | null; student_id: number }): { coThe: boolean; dangMo: TraLaiMo | null } {
  const dangMo = traLaiDangMo({ violationIds: [violationId], measureIds: [] })[0] ?? null;
  if (dangMo || !coTheTraLai(p, s)) return { coThe: false, dangMo };
  const bp = baoPhLienQuan(null, violationId);
  if (!bp.length) return { coThe: true, dangMo };
  const mo = bp.filter((b) => b.trang_thai === 'mo' && xuLyCon(b) === 'con');
  /* PTA chốt (TL-2): lần xử lý đang chờ Head duyệt thu hồi → không trả lại (như panel Báo PH ẩn nút khi có thẻ "GVCN đang xin thu hồi"). */
  const choThuHoi = mo.length ? db().prepare(`SELECT 1 FROM yeu_cau_duyet WHERE loai = 'thu_hoi_y_thuc' AND trang_thai = 'cho' AND doi_tuong_id IN (${DS_JSON}) LIMIT 1`)
    .get(JSON.stringify(mo.map((b) => b.measure_id))) : null;
  return { coThe: mo.length > 0 && !choThuHoi, dangMo };
}
