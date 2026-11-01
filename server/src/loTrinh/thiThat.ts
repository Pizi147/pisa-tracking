/**
 * KẾT QUẢ THI THẬT (PR-TK, TK-K) — GVCN nhập điểm IELTS em báo về: L, R, W, S + ngày thi, hoặc "Không thi". OVR và Đạt / Chưa đạt Target do MÁY tính
 * (`ketQuaThiThat`, so với Target; lộ trình đã đóng thì so với Target trong BẢN CHỤP — Target lúc đóng). Không còn ô chọn kết luận tay.
 * Mỗi lần lưu: làm mới bản chụp mới nhất (lộ trình đã đóng) + nhật ký. OV-8a: KHÔNG tự Lưu trữ nữa — có kết quả thì Quản lý chọn Bước tiếp (`buocTiep.ts`).
 */
import { DS_JSON, db, theoLo, theoLoJson, tx } from '../db.ts';
import { PERMISSIONS, canNamGan, diemThiHopLe, docTargetKyThi, kyThiCuaChuongTrinh, type KyThi, docNgayNhap, duongHoSoHocVien, ngay, thuNgay, trangThaiSauThi, tuanLich, type GiaiDoanSauThi, type TrangThaiSauThi } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest, chuTuDo, forbidden, isIsoDate, notFound, nowIso } from '../util.ts';
import { can, coQuyenBuocTiep, lopDayDu, type Principal } from '../permissions.ts';
import { coTheGiuViecTvv, nguoiGiuTvv } from '../worklist/viecTvv.ts';
import { addJourney, writeAudit } from '../platform/audit.ts';
import { nho } from '../platform/nguCanhRequest.ts';
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
 * OV-13q → SV-TVV-VIEC: ai GIA HẠN được — chỉ "chờ bước tiếp" (người chọn được bước tiếp: QL / QT / TVV). "Chờ kết quả" không còn hạn (21/10-TVV) → không gia hạn.
 * GVBM, Admin, CX: không (CX có `student.edit_more` nhưng chỉ xem việc).
 */
export function coTheGiaHanSauThi(p: Principal, c: { id: number; student_id: number }, giaiDoan: GiaiDoanSauThi): boolean {
  return giaiDoan === 'cho_buoc_tiep' && coQuyenBuocTiep(p, c.student_id);
}

/** `kt` (P13 KET-PET): điểm Cambridge — số nguyên trong thang, lỗi gắn ô (`details.o` = l / r / w / s). Không có `kt` → band IELTS như cũ. */
const docDiem = (v: unknown, nhan: string, kt: KyThi | null = null): number | null => {
  if (kt) {   // cùng luật đọc với Target (`docTargetKyThi`): chỉ chữ số nguyên ("1e2", "150.0" → lỗi), trống → null
    const d = docTargetKyThi(kt, v);
    if ('loi' in d) throw badRequest(`${nhan}: ${d.loi}`, { o: nhan.toLowerCase() });
    return d.so;
  }
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n) || !diemThiHopLe(n)) throw badRequest(`${nhan}: điểm từ 0 đến 9, bước 0.5.`);
  return n;
};

export function datKetQuaThiThat(p: Principal, cycleId: number, input: NhapThiThat) {
  const c = cycleById(cycleId);
  if (!c) throw notFound('Không tìm thấy lộ trình');
  if (!coTheNhapThiThat(p, c)) throw forbidden('Chỉ GVCN lớp cuối, Quản lý hoặc TVV của chi nhánh nhập được kết quả thi thật.');
  /* P13 KET-PET: lộ trình KET / PET có kết quả thi thật theo điểm Cambridge — chỉ 4 cột + Target lúc nhập; KHÔNG kết luận / Overall band (`outcome*`),
     không bản chụp, không Bước tiếp (luồng FT lọc `route IS NOT NULL`). Overall · Grade · CEFR tính khi hiện (`ketQuaKyThi`). */
  const kt = !c.route ? kyThiCuaChuongTrinh(c.programme_code) : null;
  if (!c.route && !kt) throw badRequest('Chỉ lộ trình Fast Track có kết quả thi thật.');
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
  for (const k of DIEM) if ((input as any)[k] !== undefined) moi[k] = docDiem((input as any)[k], k.toUpperCase(), kt);
  const ghiChu = input.ghiChu === undefined ? c.outcome_note ?? null : chuTuDo(input.ghiChu, 'Ghi chú', 1000);
  /* "Không thi" bỏ qua điểm: không giữ điểm gõ dở cạnh một lộ trình không thi. */
  const ghi: Diem = khongThi ? { l: null, r: null, w: null, s: null } : moi;
  const kq = kt ? { ketLuan: null, ovr: null } : thiThatCuaCycle({
    laFt: true, target: c.target_score ?? null, khongCamKet: !!c.khong_cam_ket, ...ghi, khongThi, outcome: null, outcomeScore: null,
  });
  const ngayLuu = khongThi ? null : ngayThi;
  const conn = db();
  return tx(() => {
    conn.prepare(`UPDATE learning_cycles SET thi_that_ngay = ?, thi_that_l = ?, thi_that_r = ?, thi_that_w = ?, thi_that_s = ?, thi_that_khong_thi = ?,
        thi_that_nhap_boi = ?, thi_that_nhap_luc = ?, outcome = ?, outcome_attempt_id = NULL, outcome_score = ?, outcome_note = ?,
        thi_that_target = ? WHERE id = ?`)   // P12: Target lúc nhập — đổi Target sau không đổi báo cáo thi thật đã qua
      .run(ngayLuu, ghi.l, ghi.r, ghi.w, ghi.s, khongThi ? 1 : 0, p.userId, nowIso(), kq.ketLuan, kq.ovr, ghiChu, c.target_score ?? null, cycleId);
    /* Lộ trình đã đóng → bản chụp MỚI NHẤT theo kết quả mới; so với Target TRONG bản chụp (Target lúc đóng), không phải Target hiện tại. */
    const bc = conn.prepare('SELECT * FROM ban_chup_lo_trinh WHERE cycle_id = ? ORDER BY lan DESC LIMIT 1').get(cycleId) as any;
    if (!kt && c.status !== 'active' && bc) {
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
    /* OV-15g: kèm ghi chú; lưu lại nguyên giá trị thì không ghi nhật ký (Lịch sử thay đổi không có mục rỗng). */
    const truocNk = { ...cu, ngayThi: c.thi_that_ngay ?? null, khongThi: !!c.thi_that_khong_thi, ghiChu: c.outcome_note ?? null, ovr: c.outcome_score ?? null, ketLuan: c.outcome ?? null };
    const sauNk = { ...ghi, ngayThi: ngayLuu, khongThi, ghiChu };
    if (Object.keys(sauNk).some((k) => (sauNk as any)[k] !== (truocNk as any)[k])) {   // ovr / kết luận suy từ điểm — không tự thành lần đổi
      writeAudit({ actorUserId: p.userId, action: 'cycle.thi_that', entityType: 'learning_cycle', entityId: cycleId,
        before: truocNk, after: { ...sauNk, ovr: kq.ovr, ketLuan: kq.ketLuan, ...(kt ? { kyThi: kt.ma } : {}) } });
    }
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
export const SQL_CHO_KET_QUA_THI = `SELECT c.id, c.student_id, s.full_name AS ten, s.consultant_user_id AS tvv, ${COT_SAU_THI},
      COALESCE((SELECT class_id FROM ban_chup_lo_trinh b WHERE b.cycle_id = c.id AND b.class_id IS NOT NULL ORDER BY lan DESC LIMIT 1),
               (SELECT a.class_id FROM assessment_attempts a WHERE a.cycle_id = c.id AND a.class_id IS NOT NULL AND a.kind != 'mt0' ORDER BY a.id DESC LIMIT 1),
               (SELECT e.class_id FROM enrollments e WHERE e.student_id = c.student_id ORDER BY e.id DESC LIMIT 1)) AS class_id
    FROM learning_cycles c JOIN students s ON s.id = c.student_id LEFT JOIN report_periods ep ON ep.id = c.exam_period_id
   WHERE c.route IS NOT NULL AND c.thi_that_khong_thi = 0 AND (c.thi_that_l IS NULL OR c.thi_that_r IS NULL OR c.thi_that_w IS NULL OR c.thi_that_s IS NULL)
     /* Kết quả CŨ (chỉ Overall / kết luận chọn tay) là đã có kết quả. */
     AND c.outcome_score IS NULL AND COALESCE(c.outcome, 'unknown') = 'unknown'
     /* TD4: tập cha của "đã thi" — ngày thi (trangThaiSauThi) ≥ cận dưới này; lọc JS giữ nguyên. TD7: đứng TRƯỚC các điều kiện có câu con — SQLite xét
        nó ngay trên dòng lộ trình. LT-SV: chỉ tuần / tháng không còn là ngày thi (lọc JS bỏ lộ trình có dự kiến mà chưa ngày). */
     AND COALESCE(c.thi_that_ngay, c.exam_date, c.ended_at) < ?
     AND ${LO_TRINH_MOI_NHAT}
     /* Đóng vì CHUYỂN LỚP (đóng-mở): em không đi thi — không nhắc. */
     AND NOT EXISTS (SELECT 1 FROM ban_chup_lo_trinh b WHERE b.cycle_id = c.id AND b.ly_do = 'chuyen_lop' AND b.lan = (SELECT MAX(lan) FROM ban_chup_lo_trinh WHERE cycle_id = c.id))`;
/** TD7: nhớ trong request GET — Công việc, Học viên & Lớp, Tổng quan gọi 2–5 lần mỗi request (cả hệ thống, kết quả như nhau). Người gọi không sửa kết quả. */
export function loTrinhChoKetQuaThi(today: string): { c: any; s: TrangThaiSauThi }[] {
  return nho(`cho-kq-thi:${today}`, () => {
    const ds = db().prepare(SQL_CHO_KET_QUA_THI).all(today) as any[];
    return ds.map((c) => ({ c, s: trangThaiSauThi(c, today) })).filter((x) => x.s.giaiDoan === 'da_thi_cho_kq');
  });
}
/** "Đã thi T7 10/10 · hạn 17/10 · đã gia hạn" — dòng phụ việc Công việc (OV-13q). */
export const chuDaThi = (s: TrangThaiSauThi, today: string): string =>
  [s.ngayThi ? `Đã thi ${thuNgay(s.ngayThi, today)}` : null, s.han ? `hạn ${ngay(s.han, today)}` : null, s.daGiaHan ? 'đã gia hạn' : null].filter(Boolean).join(' · ');

/**
 * Một dòng việc cho mỗi lộ trình FT chưa có kết quả thi thật (chưa đủ 4 kỹ năng, không "Không thi") mà đã qua ngày thi (OV-13q: từ HÔM SAU ngày thi).
 * SV-TVV-VIEC (21/10-TVV): người giữ = TVV của em, em chưa có TVV → Quản lý chi nhánh (`chuViecTvv`); GVCN không còn việc này; KHÔNG hạn
 * (không quá hạn, không chuông). Hết việc khi lưu đủ 4 kỹ năng hoặc "Không thi". Một câu cho cả tập + một câu lớp + một câu TVV (không N+1).
 */
export function viecThiThat(p: Principal, f: { today: string; tatCa: boolean; branchId: number | null }): any[] {
  if (!coTheGiuViecTvv(p)) return [];
  const moc = loTrinhChoKetQuaThi(f.today);
  if (!moc.length) return [];
  const idLop = [...new Set(moc.map((x) => x.c.class_id as number | null).filter((x): x is number => !!x))];
  const lop = lopDayDu();
  const giu = nguoiGiuTvv(p, f.today);
  const out: any[] = [];
  for (const { c, s } of moc) {
    const l = c.class_id ? lop.get(c.class_id) : null;
    if (f.branchId && l && l.branch_id !== f.branchId) continue;
    const chu = giu(l?.branch_id ?? null, c.tvv ?? null, f.tatCa);
    if (!chu) continue;
    const ke = examPlanOf({ exam_period_id: null, exam_month: c.exam_month, exam_date: c.exam_date, ...(c.exam_week ? { exam_period_id: 1, exam_week_code: tuanLich(c.exam_week), exam_week_start: c.exam_week } : {}) });
    const thi = ke.confidence === 'none' ? null : ke.label;
    out.push({
      key: `thi_that:${c.id}`, group: 'thi_that', urgency: 'normal', cycleId: c.id, daGiaHan: false,
      studentId: c.student_id, studentName: c.ten, classId: c.class_id ?? null, classCode: l?.code ?? null,
      attemptId: null, attemptNo: null, caseId: null, level: null, contextLabel: chuDaThi(s, f.today), count: null,
      reason: [c.ten, l?.code ?? '—', thi ? `thi ${thi}` : null].filter(Boolean).join(' · '), tieuDe: 'Cập nhật kết quả thi thật', actionLabel: 'Nhập KQ thi',
      href: duongHoSoHocVien(c.student_id, { loTrinh: c.id, viec: 'thi-that' }), ownerId: chu.ownerId, owner: null, mine: chu.mine,
      due: null, statusLabel: 'Không tính hạn',
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
  if (st.giaiDoan !== 'cho_buoc_tiep') throw badRequest('Chỉ gia hạn Chọn bước tiếp (đã có kết quả, chưa chọn) — nhập kết quả thi thật không tính hạn.');
  if (!coTheGiaHanSauThi(p, c, st.giaiDoan)) throw forbidden('Đã có kết quả — chỉ Quản lý hoặc TVV của chi nhánh gia hạn được.');
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

/**
 * OV-14b: nhãn "Đã thi · chờ kết quả" / "chờ bước tiếp" cho cả lô em (bảng lớp QL / GV, hồ sơ lớp FT) — cùng lọc + cùng hàm với `sauThiCuaEm`, không nút.
 */
export type NhanSauThiEm = Pick<TrangThaiSauThi, 'giaiDoan' | 'han' | 'quaHan' | 'daGiaHan'>;
export function sauThiTheoEm(ids: number[], today = demoToday()): Map<number, NhanSauThiEm> {
  const out = new Map<number, NhanSauThiEm>();
  theoLoJson(ids, (json) => {
    for (const c of db().prepare(`SELECT c.student_id, ${COT_SAU_THI} FROM learning_cycles c JOIN students s ON s.id = c.student_id LEFT JOIN report_periods ep ON ep.id = c.exam_period_id
       WHERE c.student_id IN (${DS_JSON}) AND c.route IS NOT NULL AND ${LO_TRINH_MOI_NHAT}`).all(json) as any[]) {
      const st = trangThaiSauThi(c, today);
      if (st.giaiDoan === 'da_thi_cho_kq' || st.giaiDoan === 'cho_buoc_tiep') out.set(c.student_id, { giaiDoan: st.giaiDoan, han: st.han, quaHan: st.quaHan, daGiaHan: st.daGiaHan });
    }
  });
  return out;
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
