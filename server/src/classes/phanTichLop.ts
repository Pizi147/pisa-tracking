/**
 * TAB PHÂN TÍCH LỚP (PR-Qa, đặc tả §3.7, mockup 06) — lớp tiến bộ hay đi lùi ở kỹ năng nào qua các đợt.
 *
 *   FT         5 kỹ năng (L · R · W1 · W2 · S) × MT1…MT5. Ô = số HV có band ≥ kỳ vọng CỦA ĐỢT ĐÓ / số HV có điểm ô đó.
 *              W1, W2 so riêng từng bài với kỳ vọng (SOS vẫn tính Writing gộp — web ghi rõ ở ⓘ).
 *   Lớp thường 4 môn (L · R · W · S) × Giữa khoá / Cuối khoá. Ô = số HV đạt (từ 70%) / số HV có điểm môn đó.
 *
 * Chỉ học viên ĐANG HỌC lớp này (không lưu trữ), chỉ lộ trình đang chạy. Chưa có điểm KHÁC trượt: không vào mẫu số.
 */
import {
  ATTEMPT_KIND_SHORT, ENTRY_SKILLS, ENTRY_SKILL_SHORT, PERMISSIONS, type AttemptKind, RATIO_PASS_THRESHOLD, REGULAR_SKILLS, categoryOf, tenKyNang, tenMon, tenMonNgan,
  caseCategoryLabel,
} from '../../../shared/domain/index.ts';
import { db } from '../db.ts';
import { require_, type Principal } from '../permissions.ts';
import { classIssueBoard } from '../cases/effectiveness.ts';
import { rowsFor, type MetricRow } from '../worklist/metrics.ts';
import { badRequest } from '../util.ts';
import { loadBundle } from '../fasttrack/attempts.ts';
import { expectationFor } from '../fasttrack/scoring.ts';
import { evaluateRegular, programmeOfClass } from '../normal/regular.ts';

export type OPhanTich = { dat: number; tong: number };
export type PhanTichLop = {
  loai: 'ft' | 'thuong';
  /** `moRong: false` = dòng không mở ra bảng vấn đề (dòng "Cả bài" của lớp thường). */
  dong: { key: string; nhan: string; tenDayDu: string; category: string; moRong?: boolean }[];
  cot: { key: string; nhan: string }[];
  o: Record<string, OPhanTich>;
  soHocVien: number;
};

export function phanTichLop(p: Principal, classId: number): PhanTichLop {
  require_(p, PERMISSIONS.ATTEMPT_VIEW, { classId }, 'Lớp này nằm ngoài phạm vi bạn được xem.');
  const conn = db();
  const prog = programmeOfClass(classId);
  const thuong = prog?.scoringMode === 'ratio';
  const hv = conn.prepare(
    `SELECT s.id, cy.id AS cycle_id, cy.target_score FROM enrollments e
       JOIN students s ON s.id = e.student_id
       LEFT JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
      WHERE e.class_id = ? AND e.status = 'active' AND s.archived_at IS NULL`,
  ).all(classId) as any[];
  const mucTieu = new Map<number, number | null>(hv.filter((h) => h.cycle_id).map((h) => [h.cycle_id, h.target_score ?? null]));
  const cycleIds = [...mucTieu.keys()];
  const attempts = cycleIds.length
    ? conn.prepare(
      `SELECT a.*, cy.route FROM assessment_attempts a JOIN learning_cycles cy ON cy.id = a.cycle_id
        WHERE a.cycle_id IN (${cycleIds.map(() => '?').join(',')}) AND a.status != 'cancelled'`,
    ).all(...cycleIds) as any[]
    : [];
  const bundle = loadBundle(attempts.map((a) => a.id));
  const o: Record<string, OPhanTich> = {};
  const cong = (k: string, dat: boolean) => {
    const x = o[k] ?? (o[k] = { dat: 0, tong: 0 });
    x.tong += 1;
    if (dat) x.dat += 1;
  };

  if (thuong) {
    const mon = [...(prog?.skills ?? REGULAR_SKILLS)];
    const khongChiaMon = prog?.code === 'PREFOU';
    for (const a of attempts) {
      if (a.kind !== 'progress' && a.kind !== 'final') continue;
      const r = evaluateRegular(mon, (bundle.scores.get(a.id) ?? []) as any, prog?.code);
      for (const x of r.skills) if (x.outcome === 'pass' || x.outcome === 'fail') cong(`${x.skill}|${a.kind}`, x.outcome === 'pass');
      /* K2-40: "Cả bài" = % tổng của bài (đủ điểm mới có) so với ngưỡng đạt chung — không viết số 0.7 thứ hai. */
      if (!khongChiaMon && r.tyLeTong != null) cong(`ca-bai|${a.kind}`, r.tyLeTong >= RATIO_PASS_THRESHOLD);
    }
    return {
      loai: 'thuong',
      dong: [
        /* Pre FOU không có dòng này: dòng "Tổng hợp" của nó đã là % tổng. */
        ...(khongChiaMon ? [] : [{ key: 'ca-bai', nhan: 'Cả bài', tenDayDu: `Cả bài — đạt khi % tổng ≥ ${Math.round(RATIO_PASS_THRESHOLD * 100)}%`, category: '', moRong: false }]),
        ...mon.map((k) => ({ key: k, nhan: tenMonNgan(prog?.code, k), tenDayDu: tenMon(prog?.code, k), category: categoryOf(k) ?? k })),
      ],
      /* K2-40, PF6: cột theo mốc của chương trình — Pre FOU chỉ Cuối khoá, một dòng Tổng hợp. */
      cot: (prog?.checkpoints.length ? prog.checkpoints.map((c) => c.kind) : ['progress', 'final'] as const)
        .map((k) => ({ key: k as string, nhan: ATTEMPT_KIND_SHORT[k as AttemptKind] ?? k })),
      o, soHocVien: hv.length,
    };
  }

  let soDot = 5;
  for (const a of attempts) {
    if ((a.kind ?? 'mock') !== 'mock') continue;
    soDot = Math.max(soDot, a.attempt_no);
    const kyVong = expectationFor(mucTieu.get(a.cycle_id) ?? null, a.attempt_no, a.route);
    if (kyVong === null) continue;
    for (const s of (bundle.scores.get(a.id) ?? []) as any[]) {
      if (s.band === null || s.band === undefined) continue;
      cong(`${s.skill}|mt${a.attempt_no}`, s.band >= kyVong);
    }
  }
  return {
    loai: 'ft',
    dong: ENTRY_SKILLS.map((k) => ({ key: k, nhan: ENTRY_SKILL_SHORT[k], tenDayDu: tenKyNang(k), category: k })),
    cot: Array.from({ length: soDot }, (_, i) => ({ key: `mt${i + 1}`, nhan: `MT${i + 1}` })),
    o, soHocVien: hv.length,
  };
}

/**
 * DANH SÁCH SAU MỘT SỐ Ở BẢNG VẤN ĐỀ / HIỆU QUẢ PA CỦA MỘT KỸ NĂNG (PR-HVL, M5, G-10) — `GET /classes/:id/issue-board/o`. Tính bằng CHÍNH `issueBoard`
 * (`classIssueBoard`): số ở ô = độ dài tập `tong` / `plans[].ids`, danh sách khi bấm = chính tập đó, không đếm lần hai.
 * `cot`: hv · case · dang-theo-doi · da-co-pa · da-xong · thanh-cong (Case) · pa-dang · pa-da · pa-thanh-cong (PA, kèm `kind`).
 */
export function oPhanTichLop(p: Principal, classId: number, category: string, cot: string, kind: string | null): { n: number; tieuDe: string; rows: MetricRow[] } {
  require_(p, PERMISSIONS.CASE_VIEW, { classId }, 'Lớp này nằm ngoài phạm vi bạn được xem.');
  const b = classIssueBoard(classId, category);
  const mon = caseCategoryLabel(category);
  const caseCot: Record<string, [number[], string]> = {
    hv: [b.tong?.hvGapVanDe ?? [], 'học viên đang gặp vấn đề'], case: [b.tong?.caseTatCa ?? [], 'Case'],
    'dang-theo-doi': [b.tong?.dangTheoDoi ?? [], 'Case đang theo dõi'], 'da-co-pa': [b.tong?.daCoPa ?? [], 'Case đã có phương án'],
    'da-xong': [b.tong?.daXong ?? [], 'Case đã xong'], 'thanh-cong': [b.tong?.thanhCong ?? [], 'Case đã xong và thành công'],
  };
  const c = caseCot[cot];
  if (c) {
    const ids = [...c[0]].sort((x, y) => x - y);
    return { n: ids.length, tieuDe: `${ids.length} ${c[1]} · ${mon}`, rows: rowsFor(cot === 'hv' ? 'hoc-vien' : 'case', ids) };
  }
  const pa = b.plans.find((x) => x.kind === kind);
  const khoaPa: Record<string, [keyof NonNullable<typeof pa>['ids'], string]> = {
    'pa-dang': ['dangThucHien', 'đang thực hiện'], 'pa-da': ['daThucHien', 'đã thực hiện'], 'pa-thanh-cong': ['thanhCong', 'thành công'],
  };
  const k = khoaPa[cot];
  if (!k) throw badRequest(`Cột "${cot}" không hợp lệ.`);
  if (!pa) return { n: 0, tieuDe: `Không có phương án nào thuộc loại này ở ${mon}`, rows: [] };
  const ids = [...pa.ids[k[0]]].sort((x, y) => x - y);
  return { n: ids.length, tieuDe: `${ids.length} PA ${pa.label} ${k[1]} · ${mon}`, rows: rowsFor('phuong-an', ids) };
}
