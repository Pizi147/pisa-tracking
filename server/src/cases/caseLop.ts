/**
 * CHI TIẾT CASE MỞ THEO LÔ (PR-HVL, T19, K2-04) — trạng thái v4 + việc tiếp + PA của MỌI Case một lớp bằng số câu SQL CỐ ĐỊNH,
 * không phụ thuộc số Case. Dùng cho roster lớp (cột Việc tiếp theo / Theo dõi), trang Học viên & Lớp và `GET /classes/:id/can-ho-tro`.
 *
 * Luật KHÔNG viết lại: `trangThaiCaseV4` + `viecTiepCuaCase` (`shared/domain/sosV4.ts`) — cùng đầu vào như `caseDetail` (cases.ts) — và
 * `mocChuPa`. Lô 400, MỖI BẢNG MỘT CÂU: `sosCaseStateMany` · `sos_cases` (tên riêng, lý do hệ thống đóng) · `case_interventions` ⟕ users ·
 * `case_milestones`. TUYỆT ĐỐI không gọi `sosCaseState(id)` / `mtKeTheoPa(id)` / `caseCardOf` trong vòng lặp (N+1 trên Turso).
 */
import { db } from '../db.ts';
import {
  INTERVENTION_KIND_LABEL, SYSTEM_CLOSE_REASON_LABEL, URGENCY_LABEL, mocChuPa, ngay, planDueDate, tenCaseSos, trangThaiCaseV4, viecTiepCuaCase,
  type InterventionKind, type ViecTiepCase,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import type { MappedCase } from './cases.ts';
import { sosCaseStateMany } from './sosState.ts';

export type PaCase = {
  id: number; ten: string; loai: string; batBuoc: boolean; choXacNhan: boolean; choDuyet: boolean; xong: boolean;
  nguoi: string | null; mocChu: string | null;
};
export type CaseChiTiet = {
  id: number; studentId: number; topic: string | null; sosLevel: number | null;
  /** `[MT1] Reading không đạt [SOS 3]` với Case SOS Fast Track (`tenCaseSos`), còn lại tên Case như cũ. */
  tieuDe: string;
  /** Ba phần của tên Case SOS Fast Track (web vẽ chip `[MT1]` + phần giữa + chip SOS) — null với Case tay / lớp thường. */
  tenSos: { mt: number | null; giua: string; sos: number | null } | null;
  nguyenNhan: string | null; urgency: string | null;
  /** "Gấp · mở 14/09" — dòng phụ dưới tên Case (web nối `nguyenNhan · moTu`). */
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
  for (let i = 0; i < ids.length; i += LO) {
    const chunk = ids.slice(i, i + LO);
    const ph = chunk.map(() => '?').join(',');
    for (const r of conn.prepare(`SELECT id, title, system_close_reason FROM sos_cases WHERE id IN (${ph})`).all(...chunk) as any[]) goc.set(r.id, r);
    for (const [k, v] of gom(conn.prepare(
      `SELECT iv.case_id, iv.id, iv.kind, iv.description, iv.status, iv.preset, iv.confirmed_at, iv.approval_state, iv.action_due, iv.followup_due,
              iv.moc_quy_che, iv.created_at, iv.performer_name, u.full_name AS performer_account
         FROM case_interventions iv LEFT JOIN users u ON u.id = iv.performer_user_id
        WHERE iv.case_id IN (${ph}) AND iv.status != 'cancelled' ORDER BY iv.case_id, iv.id`).all(...chunk) as any[])) paTheoCase.set(k, v);
    for (const [k, v] of gom(conn.prepare(
      `SELECT case_id, attempt_no, created_at FROM case_milestones WHERE case_id IN (${ph}) AND kind IN ('opened', 'repeat')
          AND attempt_no IS NOT NULL ORDER BY case_id, created_at DESC, id DESC`).all(...chunk) as any[])) mocTheoCase.set(k, v);
  }

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
      batBuoc: iv.preset === 1, choXacNhan: iv.kind !== 'bo_tro' && iv.preset === 1 && !iv.confirmed_at && iv.status === 'planned',
      choDuyet: iv.approval_state === 'pending', xong: iv.status === 'completed',
      nguoi: iv.performer_account ?? iv.performer_name ?? null,
      mocChu: iv.preset === 1
        ? mocChuPa({ span: iv.moc_quy_che ?? null, followupDue: iv.followup_due ?? null, mtKe: mtKe(iv), daXacNhan: !!iv.confirmed_at }, homNay) : null,
    }));
    const v4 = {
      status: c.status as 'open' | 'in_progress' | 'done', fromSos: s.fromSos, hasCause: s.hasCause, dismissed: !!s.dismissed, systemClosed: !!g.system_close_reason,
      choDuyetKhongTheoDoi: !!s.choDuyetKhongTheoDoi, coPaChoXacNhan: s.coPaChoXacNhan, hanXacNhan: s.dueOn, boTro: s.boTro,
      lyDoHeThong: g.system_close_reason ? SYSTEM_CLOSE_REASON_LABEL[g.system_close_reason as keyof typeof SYSTEM_CLOSE_REASON_LABEL] ?? null : null,
    };
    const hanLapPa = c.originKind === 'mock' ? null : planDueDate(String(c.detectedAt ?? homNay).slice(0, 10), c.urgency);
    const viecTiep = viecTiepCuaCase(v4, cua(paTheoCase, c.id).map((iv, i) => ({
      id: pas[i].id, ten: pas[i].ten, batBuoc: pas[i].batBuoc, choXacNhan: pas[i].choXacNhan, xong: pas[i].xong,
      actionDue: iv.action_due ?? null, followupDue: iv.followup_due ?? null, choDuyet: pas[i].choDuyet,
    })), homNay, hanLapPa);
    const laSosFt = c.originKind === 'mock' && c.classKind === 'ft';
    const mt = moc.length ? Math.max(...moc.map((x) => x.attempt_no as number)) : c.attemptNo;
    /* Cùng `tenGiuaCua` (sosAuto.ts) — nhưng không hỏi DB từng Case; Case không có chủ đề thì không để chữ rỗng dính dấu cách. */
    const nhanMon = c.topicLabel ?? (c.category ? c.categoryLabel : null);
    const giua = (g.title ?? '').trim() || (nhanMon ? `${nhanMon} không đạt` : 'Không đạt');
    out.set(c.id, {
      id: c.id, studentId: c.studentId as number, topic: c.topic, sosLevel: c.sosLevel,
      tieuDe: laSosFt ? tenCaseSos({ mt: mt ?? null, giua, sos: c.sosLevel }) : c.title,
      tenSos: laSosFt ? { mt: mt ?? null, giua, sos: c.sosLevel } : null,
      nguyenNhan: c.primaryLabel, urgency: c.urgency,
      moTu: [c.urgency ? URGENCY_LABEL[c.urgency] ?? null : null, c.detectedAt ? `mở ${ngay(c.detectedAt, homNay)}` : null].filter(Boolean).join(' · '),
      trangThai: trangThaiCaseV4(v4, homNay), viecTiep,
      quaHan: !!viecTiep?.han && viecTiep.han < homNay,
      pas,
      banGiaoTu: c.homeClassId !== null && c.classId !== c.homeClassId ? c.classCode : null,
    });
  }
  return out;
}
