/**
 * CHI TIẾT CASE MỞ THEO LÔ (PR-HVL, T19, K2-04) — trạng thái v4 + việc tiếp + PA của MỌI Case một lớp bằng số câu SQL CỐ ĐỊNH,
 * không phụ thuộc số Case. Dùng cho roster lớp (cột Việc tiếp theo / Theo dõi), trang Học viên & Lớp và `GET /classes/:id/can-ho-tro`.
 *
 * Luật KHÔNG viết lại: `trangThaiCaseV4` + `viecTiepCuaCase` (`shared/domain/sosV4.ts`) — cùng đầu vào như `caseDetail` (cases.ts) — và
 * `mocChuPa`. Lô 400, MỖI BẢNG MỘT CÂU: `sosCaseStateMany` · `sos_cases` (tên riêng, lý do hệ thống đóng) · `case_interventions` ⟕ users ·
 * `case_milestones`. TUYỆT ĐỐI không gọi `sosCaseState(id)` / `mtKeTheoPa(id)` / `caseCardOf` trong vòng lặp (N+1 trên Turso).
 */
import { DS_JSON, db, theoLoJson } from '../db.ts';
import {
  INTERVENTION_KIND_LABEL, PERMISSIONS, SYSTEM_CLOSE_REASON_LABEL, vaiXemHocVien, URGENCY_LABEL, mocChuPa, hanThemPa, tenCaseSos, tenPaViecTiep, trangThaiCaseV4, viecTiepCuaCase,
  type InterventionKind, type ViecTiepCase,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { can, type Principal } from '../permissions.ts';
import { listCases, type MappedCase } from './cases.ts';
import { choDoiPa, sosCaseStateMany } from './sosState.ts';
import { mtCuoiCuaLoTrinh } from './sosAuto.ts';

export type PaCase = {
  id: number; ten: string; loai: string; batBuoc: boolean; choXacNhan: boolean; choDuyet: boolean; xong: boolean;
  nguoi: string | null; mocChu: string | null;
};
export type CaseChiTiet = {
  id: number; studentId: number; topic: string | null; sosLevel: number | null;
  /** `[MT1] Reading không đạt [SOS 3]` với Case SOS Fast Track (`tenCaseSos`), còn lại tên Case như cũ. */
  tieuDe: string;
  /** Ba phần của tên Case SOS Fast Track (web vẽ chip `[MT1]` + phần giữa + chip SOS) — null với Case tay / lớp thường. */
  tenSos: { mt: number | null; giua: string; sos: number | null; kck?: boolean } | null;
  nguyenNhan: string | null; urgency: string | null;
  /** Mức gấp (`Gấp`) — dòng phụ dưới tên Case (web nối `nguyenNhan · moTu`). Tên giữ để không đổi hợp đồng API. */
  moTu: string;
  trangThai: ReturnType<typeof trangThaiCaseV4>;
  viecTiep: ViecTiepCase | null;
  /** Việc tiếp có hạn và hạn < hôm nay. */
  quaHan: boolean;
  pas: PaCase[];
  /** Mã lớp cũ khi lớp lúc đánh giá ≠ lớp em đang học (Case bàn giao). */
  banGiaoTu: string | null;
};

const LO = 400;
const cua = <T>(m: Map<number, T[]>, k: number) => m.get(k) ?? [];
const gom = <T extends { case_id: number }>(rows: T[]) => {
  const m = new Map<number, T[]>();
  for (const r of rows) m.set(r.case_id, [...cua(m, r.case_id), r]);
  return m;
};

export function chiTietCaseMo(cases: readonly MappedCase[]): Map<number, CaseChiTiet> {
  const out = new Map<number, CaseChiTiet>();
  const ds = cases.filter((c) => c.studentId !== null);
  if (!ds.length) return out;
  const conn = db();
  const homNay = demoToday();
  const ids = ds.map((c) => c.id);
  const st = sosCaseStateMany(ids);
  const goc = new Map<number, any>();
  const paTheoCase = new Map<number, any[]>();
  const mocTheoCase = new Map<number, any[]>();
  theoLoJson(ids, (json) => {   // S5: một tham số JSON
    const ph = DS_JSON;
    for (const r of conn.prepare(`SELECT id, title, system_close_reason, cycle_id FROM sos_cases WHERE id IN (${ph})`).all(json) as any[]) goc.set(r.id, r);
    for (const [k, v] of gom(conn.prepare(
      `SELECT iv.case_id, iv.id, iv.kind, iv.description, iv.status, iv.preset, iv.confirmed_at, iv.approval_state, iv.action_due, iv.followup_due,
              iv.moc_quy_che, iv.created_at, iv.performer_name, iv.superseded_by, iv.closed_reason, u.full_name AS performer_account
         FROM case_interventions iv LEFT JOIN users u ON u.id = iv.performer_user_id
        WHERE iv.case_id IN (${ph}) AND iv.status != 'cancelled' ORDER BY iv.case_id, iv.id`).all(json) as any[])) paTheoCase.set(k, v);
    for (const [k, v] of gom(conn.prepare(
      `SELECT case_id, attempt_no, created_at FROM case_milestones WHERE case_id IN (${ph}) AND kind IN ('opened', 'repeat')
          AND attempt_no IS NOT NULL ORDER BY case_id, created_at DESC, id DESC`).all(json) as any[])) mocTheoCase.set(k, v);
  });

  const mtCuoi = mtCuoiCuaLoTrinh([...goc.values()].filter((g) => cua(paTheoCase, g.id).some((iv) => iv.moc_quy_che === 'until_exam')).map((g) => g.cycle_id));   // OV-13a (B): chữ mốc "đến MT{n}" khi chưa có ngày thi
  for (const c of ds) {
    const s = st.get(c.id);
    const g = goc.get(c.id);
    if (!s || !g) continue;
    const moc = cua(mocTheoCase, c.id);
    /* Cùng luật `mtKeTheoPa`: mốc opened/repeat mới nhất không muộn hơn PA (không có thì mốc cũ nhất), +1. */
    const mtKe = (iv: { created_at: string }) => {
      const m = moc.find((x) => x.created_at <= iv.created_at) ?? moc[moc.length - 1];
      return m ? (m.attempt_no as number) + 1 : null;
    };
    const pas: PaCase[] = cua(paTheoCase, c.id).map((iv) => ({
      id: iv.id, ten: (iv.description ?? '').trim() || (INTERVENTION_KIND_LABEL[iv.kind as InterventionKind] ?? iv.kind), loai: iv.kind,
      batBuoc: iv.preset === 1, choXacNhan: iv.kind !== 'bo_tro' && iv.preset === 1 && !iv.confirmed_at && iv.status === 'planned' && !choDoiPa(iv),
      choDuyet: iv.approval_state === 'pending', xong: iv.status === 'completed',
      nguoi: iv.performer_account ?? iv.performer_name ?? null,
      mocChu: iv.preset === 1
        ? mocChuPa({ span: iv.moc_quy_che ?? null, followupDue: iv.followup_due ?? null, mtKe: mtKe(iv), daXacNhan: !!iv.confirmed_at, mtCuoi: mtCuoi.get(g.cycle_id) ?? null }, homNay) : null,
    }));
    const v4 = {
      status: c.status as 'open' | 'in_progress' | 'done', fromSos: s.fromSos, hasCause: s.hasCause, laMt: s.laMt, dismissed: !!s.dismissed, systemClosed: !!g.system_close_reason,
      choDuyetKhongTheoDoi: !!s.choDuyetKhongTheoDoi, coPaChoXacNhan: s.coPaChoXacNhan, choDoiPa: s.choDoiPa, hanXacNhan: s.dueOn, tam: s.tam,
      lyDoHeThong: g.system_close_reason ? SYSTEM_CLOSE_REASON_LABEL[g.system_close_reason as keyof typeof SYSTEM_CLOSE_REASON_LABEL] ?? null : null,
    };
    const hanLapPa = hanThemPa({ detected_at: c.detectedAt, urgency: c.urgency, sos_level: c.sosLevel, kck: c.kck });   // OV-11c (HV-14): cùng hàm với Công việc
    const viecTiep = viecTiepCuaCase(v4, cua(paTheoCase, c.id).map((iv, i) => ({
      id: pas[i].id, ten: tenPaViecTiep(iv.kind, iv.description), batBuoc: pas[i].batBuoc, choXacNhan: pas[i].choXacNhan, xong: pas[i].xong,
      actionDue: iv.action_due ?? null, followupDue: iv.followup_due ?? null, choDuyet: pas[i].choDuyet, mienPhi: iv.kind === 'bo_tro_mien_phi',
    })), homNay, hanLapPa);
    const laSosFt = c.originKind === 'mock' && c.classKind === 'ft';
    const mt = moc.length ? Math.max(...moc.map((x) => x.attempt_no as number)) : c.attemptNo;
    /* Cùng `tenGiuaCua` (sosAuto.ts) — nhưng không hỏi DB từng Case; Case không có chủ đề thì không để chữ rỗng dính dấu cách. */
    const nhanMon = c.topicLabel ?? (c.category ? c.categoryLabel : null);
    const giua = (g.title ?? '').trim() || (nhanMon ? `${nhanMon} không đạt` : 'Không đạt');
    out.set(c.id, {
      id: c.id, studentId: c.studentId as number, topic: c.topic, sosLevel: c.sosLevel,
      tieuDe: laSosFt ? tenCaseSos({ mt: mt ?? null, giua, sos: c.sosLevel, kck: c.kck }) : c.title,
      tenSos: laSosFt ? { mt: mt ?? null, giua, sos: c.sosLevel, kck: !!c.kck } : null,
      nguyenNhan: c.primaryLabel, urgency: c.urgency,
      /* PR-S5F-b: bỏ "mở dd/mm" — thời gian trên màn ưu tiên mã tuần, và việc tiếp đã nói hạn. */
      moTu: c.urgency ? URGENCY_LABEL[c.urgency] ?? '' : '',
      trangThai: trangThaiCaseV4(v4, homNay), viecTiep,
      quaHan: !!viecTiep?.han && viecTiep.han < homNay,
      pas,
      banGiaoTu: c.homeClassId !== null && c.classId !== c.homeClassId ? c.classCode : null,
    });
  }
  return out;
}

/**
 * OV-12d: khối "Case & phương án" ở hồ sơ MT — Case sinh từ lượt (`sc.attempt_id`) + Case trượt lại ở lượt này (mốc `repeat`, `lapTu` = MT của lượt
 * gốc). Quyền xem như hồ sơ HV / Cần hỗ trợ: `ATTEMPT_VIEW` của lớp + em (GV Speaking chấm chéo xem lượt để chấm nhưng không thấy Case) và Case qua
 * `listCases` (đã lọc phạm vi); Admin (văn phòng) không có khối như tab Cần hỗ trợ. `null` = không có khối. Số câu SQL cố định (`chiTietCaseMo`).
 */
export function caseCuaLuot(p: Principal, a: { id: number; class_id: number | null; student_id: number }): (CaseChiTiet & { lapTu: number | null })[] | null {
  if (vaiXemHocVien(p.roleKeys) === 'admin' || !can(p, PERMISSIONS.ATTEMPT_VIEW, { classId: a.class_id, studentId: a.student_id })) return null;
  const lap = new Set((db().prepare(`SELECT case_id FROM case_milestones WHERE attempt_id = ? AND kind = 'repeat'`).all(a.id) as any[]).map((r) => r.case_id as number));
  const ds = listCases(p, { studentId: a.student_id }).rows.filter((c) => c.attemptId === a.id || lap.has(c.id));
  const ct = chiTietCaseMo(ds);
  return ds.flatMap((c) => {
    const x = ct.get(c.id);
    return x ? [{ ...x, lapTu: c.attemptId !== a.id ? c.attemptNo : null }] : [];
  });
}
