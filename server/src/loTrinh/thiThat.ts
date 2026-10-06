/**
 * KẾT QUẢ THI THẬT (PR-TK, TK-K) — GVCN nhập điểm IELTS em báo về: L, R, W, S + ngày thi, hoặc "Không thi". OVR và Đạt / Chưa đạt Target do MÁY tính
 * (`ketQuaThiThat`, so với Target; lộ trình đã đóng thì so với Target trong BẢN CHỤP — Target lúc đóng). Không còn ô chọn kết luận tay.
 * Mỗi lần lưu: làm mới bản chụp mới nhất (lộ trình đã đóng), nhật ký, và em Kết thúc học FT chờ kết quả thì tự vào Lưu trữ khi hết chờ (TK-L).
 */
import { THAM_SO_TOI_DA, db, theoLo, tx } from '../db.ts';
import { PERMISSIONS, canChoThiThat, coKetQuaCu, diemThiHopLe, duongHoSoHocVien, mocNhacThiThat, tuanLich } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest, chuTuDo, forbidden, isIsoDate, notFound, nowIso } from '../util.ts';
import { can, type Principal } from '../permissions.ts';
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
    ?? (conn.prepare('SELECT class_id AS id FROM assessment_attempts WHERE cycle_id = ? AND class_id IS NOT NULL ORDER BY id DESC LIMIT 1').get(cycleId) as any)?.id
    ?? (conn.prepare('SELECT e.class_id AS id FROM enrollments e JOIN learning_cycles c ON c.student_id = e.student_id WHERE c.id = ? ORDER BY e.id DESC LIMIT 1').get(cycleId) as any)?.id
    ?? null;
}

/**
 * Ai được nhập: người sửa hồ sơ em như thường (`student.edit`: GVCN đang dạy, Quản lý, Quản trị) VÀ — ngoại lệ DUY NHẤT trên hồ sơ chỉ xem —
 * GVCN của lớp cuối của lộ trình (kể cả lớp đã kết thúc, em đã Kết thúc học / Lưu trữ) và Quản lý chi nhánh.
 */
export function coTheNhapThiThat(p: Principal, c: { id: number; student_id: number }): boolean {
  if (can(p, PERMISSIONS.STUDENT_EDIT, { studentId: c.student_id }) || can(p, PERMISSIONS.CYCLE_EDIT, { studentId: c.student_id })) return true;
  const lop = lopCuoiCuaLoTrinh(c.id);
  return !!lop && !!db().prepare(`SELECT 1 FROM teacher_assignments WHERE user_id = ? AND class_id = ? AND is_core = 1 AND status = 'active'`).get(p.userId, lop);
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
  if (!coTheNhapThiThat(p, c)) throw forbidden('Chỉ GVCN lớp cuối hoặc Quản lý nhập được kết quả thi thật.');
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
    tuLuuTruKhiHetCho(p, c.student_id, c.id, khongThi ? 'Không thi' : 'Có kết quả thi thật');
    return cycleById(cycleId);
  });
}

/**
 * TK-L: em đã Kết thúc học mà CHƯA vào Lưu trữ vì lộ trình FT còn "Chờ kết quả thi thật" → hết chờ (đủ 4 kỹ năng hoặc "Không thi") thì tự vào Lưu trữ,
 * cùng giao dịch. Chỉ khi em đang `finished` và chưa lưu trữ; nhật ký `student.archive` ghi lý do.
 */
export function tuLuuTruKhiHetCho(p: Principal, studentId: number, cycleId: number, lyDo: string): boolean {
  const conn = db();
  const s = conn.prepare('SELECT status, archived_at, student_code FROM students WHERE id = ?').get(studentId) as any;
  if (!s || s.status !== 'finished' || s.archived_at) return false;
  const c = cycleById(cycleId);
  if (!c || canChoThiThat({ laFt: !!c.route, cu: coKetQuaCu(c), l: c.thi_that_l ?? null, r: c.thi_that_r ?? null, w: c.thi_that_w ?? null, s: c.thi_that_s ?? null, khongThi: !!c.thi_that_khong_thi })) return false;
  const on = demoToday();
  conn.prepare('UPDATE students SET archived_at = ? WHERE id = ?').run(on, studentId);
  writeAudit({ actorUserId: p.userId, action: 'student.archive', entityType: 'student', entityId: studentId, entityLabel: s.student_code,
    before: { archivedAt: null }, after: { archivedAt: on, lyDo } });
  return true;
}

// ------------------------------------------------------------------ việc nhắc "Cập nhật kết quả thi thật"
/**
 * Một dòng việc cho mỗi lộ trình FT chưa có kết quả thi thật (chưa đủ 4 kỹ năng, không "Không thi") mà đã qua mốc nhắc (`mocNhacThiThat`).
 * Ai thấy: GVCN lớp cuối; lớp không có GVCN → Quản lý chi nhánh; Quản lý xem "Tất cả" thấy việc của GV. Quá hạn (mốc + 4 tuần) đỏ, KHÔNG chặn, không tự huỷ.
 * Hết việc khi lưu đủ 4 kỹ năng hoặc "Không thi". Một câu cho cả tập + một câu lớp + một câu GVCN (không N+1).
 */
export function viecThiThat(p: Principal, f: { today: string; tatCa: boolean; branchId: number | null }): any[] {
  const conn = db();
  const ds = conn.prepare(`SELECT c.id, c.student_id, s.full_name AS ten, c.ended_at, c.exam_month, c.exam_date, ep.week_start AS exam_week,
      COALESCE((SELECT class_id FROM ban_chup_lo_trinh b WHERE b.cycle_id = c.id AND b.class_id IS NOT NULL ORDER BY lan DESC LIMIT 1),
               (SELECT a.class_id FROM assessment_attempts a WHERE a.cycle_id = c.id AND a.class_id IS NOT NULL ORDER BY a.id DESC LIMIT 1),
               (SELECT e.class_id FROM enrollments e WHERE e.student_id = c.student_id ORDER BY e.id DESC LIMIT 1)) AS class_id
    FROM learning_cycles c JOIN students s ON s.id = c.student_id LEFT JOIN report_periods ep ON ep.id = c.exam_period_id
   WHERE c.route IS NOT NULL AND c.thi_that_khong_thi = 0 AND (c.thi_that_l IS NULL OR c.thi_that_r IS NULL OR c.thi_that_w IS NULL OR c.thi_that_s IS NULL)
     /* Kết quả CŨ (chỉ Overall / kết luận chọn tay) là đã có kết quả. */
     AND c.outcome_score IS NULL AND COALESCE(c.outcome, 'unknown') = 'unknown'
     /* Đóng vì CHUYỂN LỚP (đóng-mở): em không đi thi — không nhắc. */
     AND NOT EXISTS (SELECT 1 FROM ban_chup_lo_trinh b WHERE b.cycle_id = c.id AND b.ly_do = 'chuyen_lop' AND b.lan = (SELECT MAX(lan) FROM ban_chup_lo_trinh WHERE cycle_id = c.id))`).all() as any[];
  const moc = ds.map((c) => ({ c, m: mocNhacThiThat({ thangThi: c.exam_month, tuanThi: c.exam_week, ngayThi: c.exam_date, ngayDong: c.ended_at }) })).filter((x) => x.m && x.m.tu <= f.today);
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
  for (const { c, m } of moc) {
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
      key: `thi_that:${c.id}`, group: 'thi_that', urgency: f.today > m!.han ? 'overdue' : 'normal',
      studentId: c.student_id, studentName: c.ten, classId: c.class_id ?? null, classCode: l?.code ?? null,
      attemptId: null, attemptNo: null, caseId: null, level: null, contextLabel: 'Thi thật', count: null,
      reason: [c.ten, l?.code ?? '—', thi ? `thi ${thi}` : null].filter(Boolean).join(' · '), tieuDe: 'Cập nhật kết quả thi thật', actionLabel: 'Nhập kết quả',
      href: duongHoSoHocVien(c.student_id, { loTrinh: c.id, viec: 'thi-that' }), ownerId: gv[0] ?? null, owner: null, mine,
      due: m!.han, statusLabel: `hạn ${tuanLich(m!.han, f.today)}`,
    });
  }
  return out;
}
