/**
 * KẾT QUẢ THI THẬT (PR-TK, TK-K) — GVCN nhập điểm IELTS em báo về: L, R, W, S + ngày thi, hoặc "Không thi". OVR và Đạt / Chưa đạt Target do MÁY tính
 * (`ketQuaThiThat`, so với Target; lộ trình đã đóng thì so với Target trong BẢN CHỤP — Target lúc đóng). Không còn ô chọn kết luận tay.
 * Mỗi lần lưu: làm mới bản chụp mới nhất (lộ trình đã đóng) + nhật ký. OV-8a: KHÔNG tự Lưu trữ nữa — có kết quả thì Quản lý chọn Bước tiếp (`buocTiep.ts`).
 */
import { THAM_SO_TOI_DA, db, theoLo, tx } from '../db.ts';
import { PERMISSIONS, canNamGan, diemThiHopLe, docNgayNhap, duongHoSoHocVien, ngay, thuNgay, trangThaiSauThi, tuanLich, type GiaiDoanSauThi, type TrangThaiSauThi } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest, chuTuDo, forbidden, isIsoDate, notFound, nowIso } from '../util.ts';
import { can, coQuyenBuocTiep, type Principal } from '../permissions.ts';
import { addJourney, writeAudit } from '../platform/audit.ts';
import { cycleById, examPlanOf } from '../fasttrack/cycles.ts';
import { thiThatCuaCycle } from './banChup.ts';

const DIEM = ['l', 'r', 'w', 's'] as const;
type Diem = Record<(typeof DIEM)[number], number | null>;
export type NhapThiThat = { ngayThi?: string | null; l?: unknown; r?: unknown; w?: unknown; s?: unknown; khongThi?: boolean; ghiChu?: unknown };

/** Lớp CUỐI của lộ trình: bản chụp mới nhất → lượt có lớp mới nhất → ghi danh mới nhất. */
export function lopCuoiCuaLoTrinh(cycleId: number): number | null {
  const conn = db();
  return (conn.prepare('SELECT class_id AS id FROM ban_chup_lo_trinh WHERE cycle_id = ? AND class_id IS NOT NULL ORDER BY lan DESC LIMIT 1').get(cycleId) as any)?.id
    ?? (conn.prepare(`SELECT class_id AS id FROM assessment_attempts WHERE cycle_id = ? AND class_id IS NOT NULL AND kind != 'mt0' ORDER BY id DESC LIMIT 1`).get(cycleId) as any)?.id   // PR-MT0: MT0 mang lớp thường cũ
    ?? (conn.prepare('SELECT e.class_id AS id FROM enrollments e JOIN learning_cycles c ON c.student_id = e.student_id WHERE c.id = ? ORDER BY e.id DESC LIMIT 1').get(cycleId) as any)?.id
    ?? null;
}

/**
 * Ai được nhập: người sửa hồ sơ em như thường (`student.edit`: GVCN đang dạy, Quản lý, Quản trị; OV-8b: TVV / CX `student.edit_more`) VÀ — ngoại lệ DUY NHẤT trên hồ sơ chỉ xem —
 * GVCN của lớp cuối của lộ trình (kể cả lớp đã kết thúc, em đã Kết thúc học / Lưu trữ) và Quản lý chi nhánh.
 */
export function coTheNhapThiThat(p: Principal, c: { id: number; student_id: number }): boolean {
  /* OV-13h (chủ SP 15/10): em đã Lưu trữ vẫn nhập kết quả thi thật (bỏ chặn OV-11d) — mọi thứ khác của hồ sơ Lưu trữ vẫn khoá. */
  /* OV-8b: TVV / CX (`student.edit_more`) nhập kết quả thi thật của HV chi nhánh mình (CX: mọi chi nhánh). */
  if ([PERMISSIONS.STUDENT_EDIT, PERMISSIONS.CYCLE_EDIT, PERMISSIONS.STUDENT_EDIT_MORE].some((q) => can(p, q, { studentId: c.student_id }))) return true;
  return laGvcnLopCuoi(p, c.id);
}
function laGvcnLopCuoi(p: Principal, cycleId: number): boolean {
  const lop = lopCuoiCuaLoTrinh(cycleId);
  return !!lop && !!db().prepare(`SELECT 1 FROM teacher_assignments WHERE user_id = ? AND class_id = ? AND is_core = 1 AND status = 'active'`).get(p.userId, lop);
}
/**
 * OV-13q: ai GIA HẠN được — người làm được việc ĐANG MỞ của em (rà #436): "chờ kết quả" → Quản lý / Quản trị / TVV chi nhánh (`coQuyenBuocTiep`) + GVCN lớp cuối;
 * "chờ bước tiếp" → chỉ người chọn được bước tiếp (QL / QT / TVV). GVBM, Admin, CX: không (CX có `student.edit_more` nhưng chỉ xem việc).
 */
export function coTheGiaHanSauThi(p: Principal, c: { id: number; student_id: number }, giaiDoan: GiaiDoanSauThi): boolean {
  if (giaiDoan === 'cho_buoc_tiep') return coQuyenBuocTiep(p, c.student_id);
  return giaiDoan === 'da_thi_cho_kq' && (coQuyenBuocTiep(p, c.student_id) || laGvcnLopCuoi(p, c.id));
}

const docDiem = (v: unknown, nhan: string): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n) || !diemThiHopLe(n)) throw badRequest(`${nhan}: điểm từ 0 đến 9, bước 0.5.`);
  return n;
};

export function datKetQuaThiThat(p: Principal, cycleId: number, input: NhapThiThat) {
  const c = cycleById(cycleId);
  if (!c) throw notFound('Không tìm thấy lộ trình');
  if (!coTheNhapThiThat(p, c)) throw forbidden('Chỉ GVCN lớp cuối, Quản lý hoặc TVV của chi nhánh nhập được kết quả thi thật.');
  if (!c.route) throw badRequest('Chỉ lộ trình Fast Track có kết quả thi thật.');
  if ((db().prepare(`SELECT ly_do FROM ban_chup_lo_trinh WHERE cycle_id = ? ORDER BY lan DESC LIMIT 1`).get(cycleId) as any)?.ly_do === 'chuyen_lop') throw badRequest('Lộ trình đóng vì chuyển lớp — em không đi thi.');
  const homNay = demoToday();
  const khongThi = input.khongThi === true;
  let ngayThi: string | null = c.thi_that_ngay ?? null;
  if (input.ngayThi !== undefined) {
    ngayThi = input.ngayThi ? String(input.ngayThi).slice(0, 10) : null;
    if (ngayThi && (!isIsoDate(ngayThi) || ngayThi > homNay)) throw badRequest('Ngày thi không hợp lệ hoặc sau hôm nay.');
    if (ngayThi && ngayThi < String(c.started_at).slice(0, 10)) throw badRequest('Ngày thi không được trước ngày bắt đầu lộ trình.');
  }
  const cu: Diem = { l: c.thi_that_l ?? null, r: c.thi_that_r ?? null, w: c.thi_that_w ?? null, s: c.thi_that_s ?? null };
  const moi: Diem = { ...cu };
  for (const k of DIEM) if ((input as any)[k] !== undefined) moi[k] = docDiem((input as any)[k], k.toUpperCase());
  const ghiChu = input.ghiChu === undefined ? c.outcome_note ?? null : chuTuDo(input.ghiChu, 'Ghi chú', 1000);
  /* "Không thi" bỏ qua điểm: không giữ điểm gõ dở cạnh một lộ trình không thi. */
  const ghi: Diem = khongThi ? { l: null, r: null, w: null, s: null } : moi;
  const kq = thiThatCuaCycle({
    laFt: true, target: c.target_score ?? null, khongCamKet: !!c.khong_cam_ket, ...ghi, khongThi, outcome: null, outcomeScore: null,
  });
  const ngayLuu = khongThi ? null : ngayThi;
  const conn = db();
  return tx(() => {
    conn.prepare(`UPDATE learning_cycles SET thi_that_ngay = ?, thi_that_l = ?, thi_that_r = ?, thi_that_w = ?, thi_that_s = ?, thi_that_khong_thi = ?,
        thi_that_nhap_boi = ?, thi_that_nhap_luc = ?, outcome = ?, outcome_attempt_id = NULL, outcome_score = ?, outcome_note = ? WHERE id = ?`)
      .run(ngayLuu, ghi.l, ghi.r, ghi.w, ghi.s, khongThi ? 1 : 0, p.userId, nowIso(), kq.ketLuan, kq.ovr, ghiChu, cycleId);
    /* Lộ trình đã đóng → bản chụp MỚI NHẤT theo kết quả mới; so với Target TRONG bản chụp (Target lúc đóng), không phải Target hiện tại. */
    const bc = conn.prepare('SELECT * FROM ban_chup_lo_trinh WHERE cycle_id = ? ORDER BY lan DESC LIMIT 1').get(cycleId) as any;
    if (c.status !== 'active' && bc) {
      const k2 = thiThatCuaCycle({ laFt: true, target: bc.target ?? null, khongCamKet: !!bc.khong_cam_ket, ...ghi, khongThi, outcome: null, outcomeScore: null });
      conn.prepare(`UPDATE ban_chup_lo_trinh SET thi_that_ngay = ?, thi_that_l = ?, thi_that_r = ?, thi_that_w = ?, thi_that_s = ?, thi_that_ovr = ?, thi_that_khong_thi = ?,
          thi_that_nhap_boi = ?, thi_that_nhap_luc = ?, ket_luan = ?, lam_moi_luc = ? WHERE id = ?`)
        .run(ngayLuu, ghi.l, ghi.r, ghi.w, ghi.s, k2.ovr, khongThi ? 1 : 0, p.userId, nowIso(), k2.ketLuan, nowIso(), bc.id);
    }
    const tom = (d: Diem, kt: boolean, ovr: number | null) => (kt ? 'Không thi' : `L ${d.l ?? '—'} · R ${d.r ?? '—'} · W ${d.w ?? '—'} · S ${d.s ?? '—'}${ovr !== null ? ` · OVR ${ovr}` : ''}`);
    addJourney({
      studentId: c.student_id, cycleId, eventType: 'cycle_outcome', eventDate: homNay, title: 'Kết quả thi thật',
      detail: `${tom(cu, !!c.thi_that_khong_thi, c.outcome_score ?? null)} → ${tom(ghi, khongThi, kq.ovr)}`,
      refTable: 'learning_cycles', refId: cycleId, createdBy: p.userId,
    });
    writeAudit({ actorUserId: p.userId, action: 'cycle.thi_that', entityType: 'learning_cycle', entityId: cycleId,
      before: { ...cu, ngayThi: c.thi_that_ngay ?? null, khongThi: !!c.thi_that_khong_thi }, after: { ...ghi, ngayThi: ngayLuu, khongThi, ovr: kq.ovr, ketLuan: kq.ketLuan } });
    return cycleById(cycleId);
  });
}

// ------------------------------------------------------------------ việc nhắc "Cập nhật kết quả thi thật"
/* OV-13q: cột / câu dùng chung ở tệp lá `cotSauThi.ts` (không import gì) — buocTiep.ts dựng SQL lúc nạp module, không vướng vòng import. */
export { COT_SAU_THI, LO_TRINH_MOI_NHAT, NGAY_CO_KQ, cotSauThi, ngayCoKq } from './cotSauThi.ts';
import { COT_SAU_THI, LO_TRINH_MOI_NHAT, NGAY_CO_KQ } from './cotSauThi.ts';

/**
 * Lộ trình FT chưa có kết quả thi thật đã qua ngày thi (`trangThaiSauThi` = "Đã thi · chờ kết quả") — MỘT câu cho việc GVCN / QL (`viecThiThat`),
 * góc Cần làm của TVV (OV-12f), ô Tổng quan "Đã thi · chờ kết quả" (OV-13q) và migrate `prOv13q`.
 */
export const SQL_CHO_KET_QUA_THI = `SELECT c.id, c.student_id, s.full_name AS ten, ${COT_SAU_THI},
      COALESCE((SELECT class_id FROM ban_chup_lo_trinh b WHERE b.cycle_id = c.id AND b.class_id IS NOT NULL ORDER BY lan DESC LIMIT 1),
               (SELECT a.class_id FROM assessment_attempts a WHERE a.cycle_id = c.id AND a.class_id IS NOT NULL AND a.kind != 'mt0' ORDER BY a.id DESC LIMIT 1),
               (SELECT e.class_id FROM enrollments e WHERE e.student_id = c.student_id ORDER BY e.id DESC LIMIT 1)) AS class_id
    FROM learning_cycles c JOIN students s ON s.id = c.student_id LEFT JOIN report_periods ep ON ep.id = c.exam_period_id
   WHERE c.route IS NOT NULL AND c.thi_that_khong_thi = 0 AND (c.thi_that_l IS NULL OR c.thi_that_r IS NULL OR c.thi_that_w IS NULL OR c.thi_that_s IS NULL)
     /* Kết quả CŨ (chỉ Overall / kết luận chọn tay) là đã có kết quả. */
     AND c.outcome_score IS NULL AND COALESCE(c.outcome, 'unknown') = 'unknown' AND ${LO_TRINH_MOI_NHAT}
     /* Đóng vì CHUYỂN LỚP (đóng-mở): em không đi thi — không nhắc. */
     AND NOT EXISTS (SELECT 1 FROM ban_chup_lo_trinh b WHERE b.cycle_id = c.id AND b.ly_do = 'chuyen_lop' AND b.lan = (SELECT MAX(lan) FROM ban_chup_lo_trinh WHERE cycle_id = c.id))
     /* TD4: tập cha của "đã thi" — ngày thi (trangThaiSauThi) ≥ cận dưới này; lọc JS giữ nguyên. */
     AND COALESCE(c.thi_that_ngay, c.exam_date, ep.week_start, CASE WHEN c.exam_month GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]' THEN c.exam_month || '-01' END, c.ended_at) < ?`;
export function loTrinhChoKetQuaThi(today: string): { c: any; s: TrangThaiSauThi }[] {
  const ds = db().prepare(SQL_CHO_KET_QUA_THI).all(today) as any[];
  return ds.map((c) => ({ c, s: trangThaiSauThi(c, today) })).filter((x) => x.s.giaiDoan === 'da_thi_cho_kq');
}
/** "Đã thi T7 10/10 · hạn 17/10 · đã gia hạn" — dòng phụ việc Công việc (OV-13q). */
export const chuDaThi = (s: TrangThaiSauThi, today: string): string =>
  [s.ngayThi ? `Đã thi ${thuNgay(s.ngayThi, today)}` : null, s.han ? `hạn ${ngay(s.han, today)}` : null, s.daGiaHan ? 'đã gia hạn' : null].filter(Boolean).join(' · ');

/**
 * Một dòng việc cho mỗi lộ trình FT chưa có kết quả thi thật (chưa đủ 4 kỹ năng, không "Không thi") mà đã qua ngày thi
 * (OV-13q: từ HÔM SAU ngày thi, hạn = hạn sau thi của `trangThaiSauThi`). Ai thấy: GVCN lớp cuối; lớp không có GVCN → Quản lý chi nhánh; Quản lý xem "Tất cả"
 * thấy việc của GV (TVV: góc Cần làm của Học viên & Lớp; CX chỉ xem). Quá hạn đỏ, KHÔNG chặn, không tự huỷ.
 * Hết việc khi lưu đủ 4 kỹ năng hoặc "Không thi". Một câu cho cả tập + một câu lớp + một câu GVCN (không N+1).
 */
export function viecThiThat(p: Principal, f: { today: string; tatCa: boolean; branchId: number | null }): any[] {
  const conn = db();
  const moc = loTrinhChoKetQuaThi(f.today);
  if (!moc.length) return [];
  const idLop = [...new Set(moc.map((x) => x.c.class_id as number | null).filter((x): x is number => !!x))];
  const lop = new Map<number, any>(); const gvcn = new Map<number, number[]>();
  theoLo(idLop, (lo, ph) => {
    for (const l of conn.prepare(`SELECT id, code, branch_id FROM classes WHERE id IN (${ph})`).all(...lo) as any[]) lop.set(l.id, l);
    for (const t of conn.prepare(`SELECT class_id, user_id FROM teacher_assignments WHERE is_core = 1 AND status = 'active' AND (effective_to IS NULL OR effective_to >= ?) AND class_id IN (${ph})`).all(f.today, ...lo) as any[]) {
      gvcn.set(t.class_id, [...(gvcn.get(t.class_id) ?? []), t.user_id]);
    }
  }, THAM_SO_TOI_DA - 1);   // câu GVCN còn một tham số `today` → ≤ 900
  const out: any[] = [];
  for (const { c, s } of moc) {
    const l = c.class_id ? lop.get(c.class_id) : null;
    if (f.branchId && l && l.branch_id !== f.branchId) continue;
    const gv = c.class_id ? gvcn.get(c.class_id) ?? [] : [];
    const laGvcn = gv.includes(p.userId);
    /* Quyền Quản lý chỉ hỏi khi cần (không phải GVCN của lớp): `can` theo lớp, phạm vi đã nạp một lần ở trên. */
    const ql = !laGvcn && (!gv.length || f.tatCa) && !!c.class_id && can(p, PERMISSIONS.CYCLE_EDIT, { classId: c.class_id });
    const mine = laGvcn || (!gv.length && ql);
    if (!mine && !(f.tatCa && ql)) continue;
    const ke = examPlanOf({ exam_period_id: null, exam_month: c.exam_month, exam_date: c.exam_date, ...(c.exam_week ? { exam_period_id: 1, exam_week_code: tuanLich(c.exam_week), exam_week_start: c.exam_week } : {}) });
    const thi = ke.confidence === 'none' ? null : ke.label;
    out.push({
      key: `thi_that:${c.id}`, group: 'thi_that', urgency: s.quaHan ? 'overdue' : 'normal', cycleId: c.id, daGiaHan: s.daGiaHan,
      studentId: c.student_id, studentName: c.ten, classId: c.class_id ?? null, classCode: l?.code ?? null,
      attemptId: null, attemptNo: null, caseId: null, level: null, contextLabel: chuDaThi(s, f.today), count: null,
      reason: [c.ten, l?.code ?? '—', thi ? `thi ${thi}` : null].filter(Boolean).join(' · '), tieuDe: 'Cập nhật kết quả thi thật', actionLabel: 'Nhập kết quả',
      href: duongHoSoHocVien(c.student_id, { loTrinh: c.id, viec: 'thi-that' }), ownerId: gv[0] ?? null, owner: null, mine,
      due: s.han, statusLabel: `hạn ${tuanLich(s.han!, f.today)}`,
    });
  }
  return out;
}

// ------------------------------------------------------------------ OV-13q: hạn sau thi + Gia hạn
/** Trạng thái sau thi của MỘT lộ trình (hồ sơ, panel một em, trả lời API gia hạn) — cùng cột, cùng hàm với danh sách. */
const dongSauThi = (cycleId: number): any =>
  db().prepare(`SELECT c.id, c.student_id, ${COT_SAU_THI} FROM learning_cycles c LEFT JOIN report_periods ep ON ep.id = c.exam_period_id WHERE c.id = ?`).get(cycleId);
export function sauThiCuaLoTrinh(cycleId: number, today = demoToday()): (TrangThaiSauThi & { cycleId: number }) | null {
  const c = dongSauThi(cycleId);
  return c ? { ...trangThaiSauThi(c, today), cycleId } : null;
}

/** GET /cycles/:id/han-sau-thi — panel Kết quả thi thật: giai đoạn + hạn + nút Gia hạn. Ai xem được hồ sơ em thì đọc được. */
export function docHanSauThi(p: Principal, cycleId: number) {
  const c = cycleById(cycleId);
  if (!c || !can(p, PERMISSIONS.STUDENT_VIEW, { studentId: c.student_id })) throw notFound('Không tìm thấy lộ trình');
  const st = sauThiCuaLoTrinh(cycleId)!;
  return { ...st, coTheGiaHan: coTheGiaHanSauThi(p, c, st.giaiDoan) };
}

/**
 * PUT /cycles/:id/han-sau-thi { han, lyDo? } — Gia hạn (nhiều lần được, đếm `han_sau_thi_so_lan`) · `han: null` = Bỏ gia hạn (về hạn gốc).
 * Không chặn việc nào: hạn mới chỉ đổi chữ hạn / quá hạn. Hạn mới trước hôm nay hoặc không sau hạn gốc → 400 nói lý do.
 */
export function datHanSauThi(p: Principal, cycleId: number, input: { han?: unknown; lyDo?: unknown }) {
  const c = cycleById(cycleId);
  if (!c) throw notFound('Không tìm thấy lộ trình');
  const homNay = demoToday();
  const dong = dongSauThi(cycleId);
  const st = trangThaiSauThi(dong, homNay);
  if (st.giaiDoan !== 'da_thi_cho_kq' && st.giaiDoan !== 'cho_buoc_tiep') throw badRequest('Chỉ gia hạn được khi em đã thi và chưa chọn bước tiếp.');
  if (!coTheGiaHanSauThi(p, c, st.giaiDoan)) {
    throw forbidden(st.giaiDoan === 'cho_buoc_tiep' ? 'Đã có kết quả — chỉ Quản lý hoặc TVV của chi nhánh gia hạn được.' : 'Chỉ GVCN lớp cuối, Quản lý hoặc TVV của chi nhánh gia hạn được.');
  }
  const vao = input.han === null || input.han === undefined || input.han === '' ? null : docNgayNhap(input.han, homNay, canNamGan(homNay));
  if (vao && !vao.iso) throw badRequest(`Hạn mới: ${vao.loi ?? 'không hợp lệ'}`);   // rà #436: ngày không có thật (31/09) → 400
  const han = vao?.iso ?? null;
  const lyDo = han ? chuTuDo(input.lyDo, 'Lý do', 300) : null;
  if (han) {
    if (han < homNay) throw badRequest('Hạn mới không được trước hôm nay.');
    const goc = trangThaiSauThi({ ...dong, han_sau_thi: null }, homNay).han;   // hạn khi không gia hạn (Bước tiếp: gồm ngày có kết quả)
    if (goc && han <= goc) throw badRequest(`Hạn mới phải sau hạn gốc ${ngay(goc, homNay)}.`);
  }
  const cu = c.han_sau_thi ?? null;
  if (han === cu) return { ...st, cycleId };
  tx(() => {
    db().prepare(`UPDATE learning_cycles SET han_sau_thi = ?, han_sau_thi_boi = ?, han_sau_thi_luc = ?, han_sau_thi_ly_do = ?,
        han_sau_thi_so_lan = han_sau_thi_so_lan + ? WHERE id = ?`).run(han, p.userId, nowIso(), lyDo, han ? 1 : 0, cycleId);
    addJourney({
      studentId: c.student_id, cycleId, eventType: 'han_sau_thi', eventDate: homNay, title: han ? 'Gia hạn sau thi' : 'Bỏ gia hạn sau thi',
      detail: [`${cu ? ngay(cu, homNay) : `hạn gốc ${st.hanGoc ? ngay(st.hanGoc, homNay) : '—'}`} → ${han ? ngay(han, homNay) : 'hạn gốc'}`, lyDo].filter(Boolean).join(' · '),
      refTable: 'learning_cycles', refId: cycleId, createdBy: p.userId, dedupKey: `han_sau_thi:${cycleId}:${nowIso()}`,
    });
    writeAudit({ actorUserId: p.userId, action: 'cycle.han_sau_thi', entityType: 'learning_cycle', entityId: cycleId,
      before: { hanSauThi: cu }, after: { hanSauThi: han, lyDo } });
  });
  return sauThiCuaLoTrinh(cycleId, homNay);
}

export type SauThiEm = TrangThaiSauThi & { cycleId: number; coTheNhap: boolean; coTheChon: boolean; coTheGiaHan: boolean };
/**
 * Lộ trình FT MỚI NHẤT của em đang "Đã thi · chờ kết quả" / "Đã xong · chờ bước tiếp" + nút người xem bấm được — panel một em (Học viên & Lớp) và đầu hồ sơ.
 * Em Lưu trữ / lộ trình khác giai đoạn → null (cùng lọc với việc Công việc).
 */
export function sauThiCuaEm(p: Principal, studentId: number, today = demoToday()): SauThiEm | null {
  const c = db().prepare(`SELECT c.id, c.student_id, ${COT_SAU_THI} FROM learning_cycles c JOIN students s ON s.id = c.student_id LEFT JOIN report_periods ep ON ep.id = c.exam_period_id
     WHERE c.student_id = ? AND c.route IS NOT NULL AND ${LO_TRINH_MOI_NHAT}`).get(studentId) as any;
  if (!c) return null;
  const st = trangThaiSauThi(c, today);
  if (st.giaiDoan !== 'da_thi_cho_kq' && st.giaiDoan !== 'cho_buoc_tiep') return null;
  /* Nút của LUỒNG VIỆC = người nhận việc (GVCN lớp cuối, QL, QT, TVV); CX / Admin chỉ xem (CX vẫn nhập được ở ⋯ hồ sơ như OV-8b). */
  const coTheGiaHan = coTheGiaHanSauThi(p, c, st.giaiDoan);
  const nguoiNhan = coQuyenBuocTiep(p, studentId) || laGvcnLopCuoi(p, c.id);
  return { ...st, cycleId: c.id, coTheNhap: st.giaiDoan === 'da_thi_cho_kq' && nguoiNhan && coTheNhapThiThat(p, c), coTheChon: st.giaiDoan === 'cho_buoc_tiep' && coQuyenBuocTiep(p, studentId), coTheGiaHan };
}
