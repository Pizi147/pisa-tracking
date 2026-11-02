/**
 * TAB PHÂN TÍCH LỚP (PR-Qa, đặc tả §3.7, mockup 06) — lớp tiến bộ hay đi lùi ở kỹ năng nào qua các đợt.
 *
 *   FT         5 kỹ năng (L · R · W1 · W2 · S) × MT1…MT5. Ô = số HV đạt / số HV có điểm ô đó ở lượt ĐỦ Overall (V5 C09, C10 — `danhGiaMon`):
 *              Overall ≥ kỳ vọng CỦA ĐỢT ĐÓ → mọi kỹ năng đạt; chưa đạt → band từng kỹ năng (W1, W2 riêng) so kỳ vọng; thiếu Overall → ngoài mẫu.
 *              V8-HSL-2: dòng đầu "Overall" — em có Overall ≥ kỳ vọng đợt / em đủ Overall, không tính lượt KCK (OV-9, như Đạt MT); dòng kỹ năng vẫn tính KCK (chủ SP 02/11).
 *   Lớp thường 4 môn (L · R · W · S) × Giữa khoá / Cuối khoá. Ô = số HV đạt (từ 70%) / số HV có điểm môn đó.
 *
 * Chỉ học viên ĐANG HỌC lớp này (không lưu trữ), chỉ lộ trình đang chạy. Chưa có điểm KHÁC trượt: không vào mẫu số.
 */
import {
  ATTEMPT_KIND_SHORT, ENTRY_SKILLS, ENTRY_SKILL_SHORT, PERMISSIONS, type AttemptKind, type DiemHv, RATIO_PASS_THRESHOLD, REGULAR_SKILLS, categoryOf, tenKyNang, tenMon, tenMonNgan,
  caseCategoryLabel, khoaBai, nhanBai, boMonTheoLuot, daGhiLuot,
} from '../../../shared/domain/index.ts';
import { db } from '../db.ts';
import { require_, type Principal } from '../permissions.ts';
import { classIssueBoard } from '../cases/effectiveness.ts';
import { rowsFor, type MetricRow } from '../worklist/metrics.ts';
import { evaluateAttemptRow, luotKck } from '../worklist/danhGia.ts';
import { diemTuEval } from '../worklist/diemDong.ts';
import { badRequest, loi } from '../util.ts';
import { entryBandsOf, kyVongCuaLuot, loadBundle } from '../fasttrack/attempts.ts';
import { evaluateAttempt } from '../fasttrack/scoring.ts';
import { evaluateRegular, nguongDatLop, programmeByCode, type ProgrammeInfo } from '../normal/regular.ts';

export type OPhanTich = { dat: number; tong: number };
export type PhanTichLop = {
  loai: 'ft' | 'thuong';
  /** `moRong: false` = dòng không mở ra bảng vấn đề (dòng "Cả bài" của lớp thường). */
  dong: { key: string; nhan: string; tenDayDu: string; category: string; moRong?: boolean }[];
  cot: { key: string; nhan: string }[];
  o: Record<string, OPhanTich>;
  /** Học viên tạo nên từng ô `o` (đạt / chưa đạt) — cho danh sách khi bấm số ở hồ sơ giáo viên (PR-GV). Độ dài `dat + chua` = `tong`. */
  ds: Record<string, { dat: number[]; chua: number[] }>;
  soHocVien: number;
};

/** Dòng điểm từng em ở đợt `mt` (điểm đúng lượt làm em vào ô Overall) — xem `phanTichNhieuLop`. */
type DiemDot = { mt: number; diem: Map<number, DiemHv> };

export function phanTichLop(p: Principal, classId: number): PhanTichLop {
  require_(p, PERMISSIONS.ATTEMPT_VIEW, { classId }, 'Lớp này nằm ngoài phạm vi bạn được xem.');
  return phanTichNhieuLop([classId]).get(classId)!;
}

/**
 * NHIỀU LỚP MỘT LƯỢT (PR-S5F-b — hồ sơ GV 15–16 lớp từng tốn ≈ 7 câu/lớp): lớp · học viên · bài thi · điểm mỗi thứ một câu (chia lô),
 * tính từng lớp trong bộ nhớ — cùng luật với `phanTichLop`. KHÔNG kiểm quyền: nơi gọi lọc lớp theo `ATTEMPT_VIEW` trước.
 * `diemDot` (V8-HSL-2, chỉ panel ô Overall): chỉ đọc đợt `mt` và gom dòng điểm của đợt đó — kết quả trả về khi ấy chỉ có cột đợt này, chỉ dùng cho panel.
 */
export function phanTichNhieuLop(classIds: readonly number[], diemDot?: DiemDot): Map<number, PhanTichLop> {
  const out = new Map<number, PhanTichLop>();
  if (!classIds.length) return out;
  const conn = db();
  const lo = <T>(ds: readonly T[]) => Array.from({ length: Math.ceil(ds.length / 900) }, (_, i) => ds.slice(i * 900, (i + 1) * 900));
  const cho = (n: number) => Array.from({ length: n }, () => '?').join(',');
  const progCua = new Map<number, ProgrammeInfo | null>();
  const hvCua = new Map<number, any[]>();
  for (const l of lo(classIds)) {
    for (const r of conn.prepare(`SELECT id, programme_code FROM classes WHERE id IN (${cho(l.length)})`).all(...l) as any[]) progCua.set(r.id, programmeByCode(r.programme_code));
    for (const r of conn.prepare(
      `SELECT e.class_id, s.id, cy.id AS cycle_id FROM enrollments e
         JOIN students s ON s.id = e.student_id
         LEFT JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
        WHERE e.class_id IN (${cho(l.length)}) AND e.status = 'active' AND s.archived_at IS NULL`,
    ).all(...l) as any[]) hvCua.set(r.class_id, [...(hvCua.get(r.class_id) ?? []), r]);
  }
  const cycleIds = [...new Set([...hvCua.values()].flat().map((h) => h.cycle_id).filter(Boolean))] as number[];
  const baiCua = new Map<number, any[]>();
  for (const l of lo(cycleIds)) {
    for (const a of conn.prepare(
      `SELECT a.*, cy.route, cy.khong_cam_ket AS cy_kck, rp.week_start FROM assessment_attempts a JOIN learning_cycles cy ON cy.id = a.cycle_id
         LEFT JOIN report_periods rp ON rp.id = a.planned_period_id
        WHERE a.cycle_id IN (${cho(l.length)}) AND a.status != 'cancelled'${diemDot ? ` AND a.kind = 'mock' AND a.attempt_no = ?` : ''}`,
    ).all(...l, ...(diemDot ? [diemDot.mt] : [])) as any[]) baiCua.set(a.cycle_id, [...(baiCua.get(a.cycle_id) ?? []), a]);
  }
  const bundle = loadBundle([...baiCua.values()].flat().map((a) => a.id));
  for (const id of classIds) {
    const hv = hvCua.get(id) ?? [];
    const loTrinh = new Set<number>(hv.filter((h) => h.cycle_id).map((h) => h.cycle_id));
    out.set(id, tinhMotLop(progCua.get(id) ?? null, nguongDatLop(id), hv.length, [...loTrinh].flatMap((c) => baiCua.get(c) ?? []), bundle, diemDot));
  }
  return out;
}

function tinhMotLop(prog: ProgrammeInfo | null, nguong: number, soHocVien: number, attempts: any[], bundle: ReturnType<typeof loadBundle>, diemDot?: DiemDot): PhanTichLop {
  const thuong = prog?.scoringMode === 'ratio';
  const o: Record<string, OPhanTich> = {};
  const ds: PhanTichLop['ds'] = {};
  const cong = (k: string, dat: boolean, hvId: number) => {
    const x = o[k] ?? (o[k] = { dat: 0, tong: 0 });
    x.tong += 1;
    if (dat) x.dat += 1;
    (ds[k] ?? (ds[k] = { dat: [], chua: [] }))[dat ? 'dat' : 'chua'].push(hvId);
  };

  if (thuong) {
    /* P13: dòng = bộ môn của các lượt đang xét (`boMonTheoLuot`) — lượt đã ghi môn gộp cũ thêm dòng L+S / R+W. */
    const boCt = prog?.skills ?? REGULAR_SKILLS;
    const mon = [...new Set([...boCt, ...attempts.flatMap((a) => boMonTheoLuot(boCt, daGhiLuot(bundle.skillRows.get(a.id), bundle.scores.get(a.id))))])];
    const khongChiaMon = prog?.code === 'PREFOU';
    for (const a of attempts) {
      const r = danhGiaMon(a, bundle.scores.get(a.id) ?? [], prog, [], bundle.skillRows.get(a.id));
      if (!r) continue;
      const k = khoaBai(a.kind, a.attempt_no);   // OV-11h (PT-1): Checkpoint mỗi số một cột (`checkpoint:2`)
      for (const x of r.mon) cong(`${x.skill}|${k}`, x.dat, a.student_id);
      /* K2-40: "Cả bài" = % tổng của bài (đủ điểm mới có) so với ngưỡng đạt của lớp lượt đó (OV-6b1) — không viết số 0.7 thứ hai. */
      if (!khongChiaMon && r.tyLeTong != null) cong(`ca-bai|${k}`, r.tyLeTong >= r.nguong, a.student_id);
    }
    /* OV-11h (PT-1): chương trình liên tục (PET / KET) — cột theo số Checkpoint đã có, không rơi về Progress · Final. */
    const soCp = [...new Set(attempts.filter((a) => a.kind === 'checkpoint').map((a) => a.attempt_no as number))].sort((x, y) => x - y);
    return {
      loai: 'thuong',
      dong: [
        /* Pre FOU không có dòng này: dòng "Tổng hợp" của nó đã là % tổng. */
        ...(khongChiaMon ? [] : [{ key: 'ca-bai', nhan: 'Cả bài', tenDayDu: `Cả bài — đạt khi % tổng ≥ ${Math.round(nguong * 100)}%`, category: '', moRong: false }]),
        ...mon.map((k) => ({ key: k, nhan: tenMonNgan(prog?.code, k), tenDayDu: tenMon(prog?.code, k), category: categoryOf(k) ?? k })),
      ],
      /* K2-40, PF6: cột theo mốc của chương trình — Pre FOU chỉ Cuối khoá, một dòng Tổng hợp. */
      cot: prog?.lapMoiTuan != null
        ? soCp.map((n) => { const k = khoaBai('checkpoint', n); return { key: k, nhan: nhanBai(k) }; })
        : (prog?.checkpoints.length ? prog.checkpoints.map((c) => c.kind) : ['progress', 'final'] as const)
          .map((k) => ({ key: k as string, nhan: ATTEMPT_KIND_SHORT[k as AttemptKind] ?? k })),
      o, ds, soHocVien,
    };
  }

  let soDot = 5;
  for (const a of attempts) {
    if ((a.kind ?? 'mock') !== 'mock') continue;
    soDot = Math.max(soDot, a.attempt_no);
    const r = danhGiaMon(a, bundle.scores.get(a.id) ?? [], prog, bundle.skips.get(a.id) ?? [], bundle.skillRows.get(a.id));
    for (const x of r?.mon ?? []) cong(`${x.skill}|mt${a.attempt_no}`, x.dat, a.student_id);
    if (!r || luotKck(a)) continue;
    const { ovr, kv } = r as { ovr: number; kv: number };   // FT: `danhGiaMon` khác null thì đủ cả hai
    cong(`overall|mt${a.attempt_no}`, ovr >= kv, a.student_id);
    if (diemDot && diemDot.mt === a.attempt_no) {
      diemDot.diem.set(a.student_id, diemTuEval({ ...evaluateAttemptRow(a, bundle, new Map()), attemptId: a.id, studentId: a.student_id, kind: 'mock', attemptNo: a.attempt_no, weekStart: a.week_start }));
    }
  }
  return {
    loai: 'ft',
    dong: [
      { key: 'overall', nhan: 'Overall', tenDayDu: 'Overall', category: '', moRong: false },
      ...ENTRY_SKILLS.map((k) => ({ key: k, nhan: ENTRY_SKILL_SHORT[k], tenDayDu: tenKyNang(k), category: k })),
    ],
    cot: Array.from({ length: soDot }, (_, i) => ({ key: `mt${i + 1}`, nhan: `MT${i + 1}` })),
    o, ds, soHocVien,
  };
}

/**
 * LUẬT CHẤM ĐẠT TỪNG MÔN CỦA MỘT BÀI (PR-Pb2-b tách nguyên thân từ `tinhMotLop` — tab Phân tích lớp, hồ sơ GV và bảng Phân tích giáo viên gọi chung):
 *   FT (`mock`)          V5 C09, C10 (chỉ cho xem kết quả / đánh giá GV — KHÔNG đổi SOS / Case): Overall lượt (`evaluateAttempt`, `skips` = kỹ năng bỏ)
 *                        ≥ kỳ vọng của đợt (`kyVongCuaLuot`: Target LÚC LƯỢT, cùng `resultOf` / Kết quả Test — chủ SP 02/11) → mọi kỹ năng có điểm Đạt; chưa đạt → band từng kỹ năng ≥ kỳ vọng (W1, W2 riêng);
 *                        thiếu Overall (chưa đủ 4 kỹ năng / có kỹ năng bỏ) → null (Chưa đủ dữ liệu, ngoài mẫu). Lượt không có Target → null.
 *   Lớp thường           Giữa / Cuối khoá, Checkpoint (PET / KET — OV-11h): `evaluateRegular` (từ 70%) — chỉ môn đã đủ điểm (pass / fail); kèm % tổng cho dòng "Cả bài".
 * `null` = bài không chấm đạt ở đây (loại bài khác, không có kỳ vọng, hoặc FT chưa đủ Overall). `ovr`, `kv`: FT để panel ghi lý do.
 */
export function danhGiaMon(a: any, scores: readonly any[], prog: ProgrammeInfo | null, skips: readonly string[] = [],
  /** P13: dòng lịch của lượt (`daGhiLuot`). */ lich?: readonly { skill: string }[]): {
  mon: { skill: string; dat: boolean }[]; tyLeTong: number | null; nguong: number; ovr: number | null; kv: number | null;
} | null {
  if (prog?.scoringMode === 'ratio') {
    if (a.kind !== 'progress' && a.kind !== 'final' && a.kind !== 'checkpoint') return null;
    const r = evaluateRegular(boMonTheoLuot(prog?.skills ?? REGULAR_SKILLS, daGhiLuot(lich, scores)), scores as any, prog?.code, nguongDatLop(a.class_id));   // P13: bộ môn theo lượt
    return {
      mon: r.skills.filter((x) => x.outcome === 'pass' || x.outcome === 'fail').map((x) => ({ skill: x.skill as string, dat: x.outcome === 'pass' })),
      tyLeTong: r.tyLeTong ?? null, nguong: r.passThreshold, ovr: null, kv: null,
    };
  }
  if ((a.kind ?? 'mock') !== 'mock') return null;
  const kyVong = kyVongCuaLuot(a);
  if (kyVong === null) return null;
  const ovr = evaluateAttempt(null, a.attempt_no, entryBandsOf(scores as any), skips).overall;
  if (ovr === null) return null;
  const overallDat = ovr >= kyVong;
  return {
    mon: scores.filter((s) => s.band !== null && s.band !== undefined).map((s) => ({ skill: s.skill as string, dat: overallDat || s.band >= kyVong })),
    tyLeTong: null, nguong: RATIO_PASS_THRESHOLD, ovr, kv: kyVong,
  };
}

/**
 * DANH SÁCH SAU MỘT SỐ Ở BẢNG VẤN ĐỀ / HIỆU QUẢ PA CỦA MỘT KỸ NĂNG (PR-HVL, M5, G-10) — `GET /classes/:id/issue-board/o`. Tính bằng CHÍNH `issueBoard`
 * (`classIssueBoard`): số ở ô = độ dài tập `tong` / `plans[].ids`, danh sách khi bấm = chính tập đó, không đếm lần hai.
 * `cot`: hv · Case · dang-theo-doi · da-co-pa · da-xong · thanh-cong (Case) · pa-dang · pa-da · pa-thanh-cong (PA, kèm `kind`).
 * V8-HSL-2: `cot=overall` + `kind=mt<n>` = ô dòng Overall bảng FT — chính tập `ds` của ô (Chưa đạt · Đạt), dòng điểm đúng đợt đó; `category` bỏ qua.
 */
export function oPhanTichLop(p: Principal, classId: number, category: string, cot: string, kind: string | null): { n: number; tieuDe: string; unit?: 'hoc-vien'; rows: MetricRow[] } {
  require_(p, PERMISSIONS.ATTEMPT_VIEW, { classId }, 'Lớp này nằm ngoài phạm vi bạn được xem.');
  if (cot === 'overall') {
    const mt = /^mt(\d+)$/.exec(kind ?? '')?.[1];
    if (!mt) throw loi(400, 'Cột "{cot}" không hợp lệ.', { cot: `overall ${kind ?? ''}` });
    const diem = new Map<number, DiemHv>();
    const x = phanTichNhieuLop([classId], { mt: Number(mt), diem }).get(classId)!.ds[`overall|${kind}`] ?? { dat: [], chua: [] };
    const ids = [...x.chua, ...x.dat];
    const dat = new Set(x.dat);
    return {
      n: ids.length, tieuDe: `${ids.length} HV · Overall MT${mt}`, unit: 'hoc-vien',
      rows: rowsFor('hoc-vien', ids, undefined, p, false, diem).map((r) => ({ ...r, ketQua: dat.has(r.id) ? 'dat' : 'chua' })),
    };
  }
  const b = classIssueBoard(classId, category);
  const mon = caseCategoryLabel(category);
  const caseCot: Record<string, [number[], string]> = {
    hv: [b.tong?.hvGapVanDe ?? [], 'học viên đang gặp vấn đề'], case: [b.tong?.caseTatCa ?? [], 'Case'],
    'dang-theo-doi': [b.tong?.dangTheoDoi ?? [], 'Case đang theo dõi'], 'da-co-pa': [b.tong?.daCoPa ?? [], 'Case đã có PA'],
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
  if (!k) throw loi(400, 'Cột "{cot}" không hợp lệ.', { cot });
  if (!pa) return { n: 0, tieuDe: `Không có phương án nào thuộc loại này ở ${mon}`, rows: [] };
  const ids = [...pa.ids[k[0]]].sort((x, y) => x - y);
  return { n: ids.length, tieuDe: `${ids.length} PA ${pa.label} ${k[1]} · ${mon}`, rows: rowsFor('phuong-an', ids) };
}
