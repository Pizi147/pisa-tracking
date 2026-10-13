/**
 * KHU VỰC TEST — ba câu hỏi ĐỌC của việc chấm điểm (spec §3.5):
 *
 *   lichTest     "tuần này có những lượt Test nào, còn phải chấm gì" — MỘT lời gọi đủ cho màn Lịch Test (PR-UX1, PR-LT3 ba khối):
 *                dải số, khối 1 "Test quá hạn chấm" (`noQuaHan`), khối 2 "Test chấm tuần này" + khối 3 "Lịch Test" (`hangLopTuan`).
 *   chamSheet    "mở bảng chấm của một lớp" — MỘT CỬA, tự chọn đúng bảng theo loại lớp.
 *
 * Module này KHÔNG có luật nghiệp vụ mới: nó gọi `listAttempts`, `classScoreSheet`, `regularSheet` và các hàm thuần ở
 * `shared/domain/chamDiem.ts`. Có nó để giao diện chỉ hỏi một nơi, và để chỗ mở bảng chấm không còn phải tự đoán lớp
 * này là FT hay lớp thường.
 */
import { notFound } from '../util.ts';
import { db } from '../db.ts';
import { demoToday } from '../demoConfig.ts';
import {
  activeAt, can, classScopeSql, defaultWorkScope, editableSkills, isCoreTeacherOf, lopFtChoGvSpeaking, mySkills, scopeXemLuotCham, type Principal,
} from '../permissions.ts';
import {
  ASSESSED_SKILLS, khoaBai, nhanBai, CHAM_CHEO, dauTruCuaO, LUOT_TINH_NO_SQL, PERMISSIONS, boMonLich, khoiCham, khungCua, laChamCheo, lopTuMo,
  tenMonNgan, type Khung, nhanLopLichTest,
  soSanhLop, trangThaiChamLabel, type AssessedSkill, type AttemptKind, type LoaiNhanLop, type PhamViLichTest,
} from '../../../shared/domain/index.ts';
import { classScoreSheet, conBaiCanCham, listAttempts, type MonDoiLich } from '../fasttrack/attempts.ts';
import { pendingMovesFor } from '../fasttrack/absence.ts';
import { HV_DANG_HOC_SQL } from '../students/tamDung.ts';
import { assessedSkillOf, entrySkillsOf } from '../fasttrack/scoring.ts';
import { allProgrammes, cheDoCua, isRatioClass, programmeOfClass, regularSheet, type CheDo } from '../normal/regular.ts';
import { quaHanNhapDiem, skillScoreDeadline, weekInfo } from '../platform/week.ts';
import { addDays } from '../util.ts';

export function chamSheet(
  p: Principal, classId: number,
  /** `attemptNo` (PR-DL): bảng FT theo một số lượt MT, không lọc tuần — thắng `periodId`. */
  opts: { periodId?: number | null; kind?: string | null; attemptNo?: number } = {},
  today: string = demoToday(),
) {
  const cls = db()
    .prepare('SELECT c.*, b.name AS branch_name FROM classes c JOIN branches b ON b.id = c.branch_id WHERE c.id = ?')
    .get(classId) as any;
  if (!cls) throw notFound('Không tìm thấy lớp');
  const chung = {
    classId, classCode: cls.code as string, branchName: cls.branch_name as string,
    canPlanWeek: can(p, PERMISSIONS.PLAN_WEEK, { classId }),
    today,
  };
  /* PR-MT0: MT0 ở lớp thường chấm band — lưới FT chỉ các MT0 của lớp (tuỳ chọn tuần). */
  if (opts.kind === 'mt0') {
    return { ...chung, mode: 'ielts_band' as const, ft: classScoreSheet(p, classId, { theo: 'mt0', periodId: opts.periodId ?? null }, today), thuong: null };
  }
  if (isRatioClass(classId)) {
    return { ...chung, mode: 'ratio' as const, thuong: regularSheet(p, classId, opts.kind ?? undefined, today, opts.attemptNo), ft: null };
  }
  return { ...chung, mode: 'ielts_band' as const, ft: classScoreSheet(p, classId, opts.attemptNo ? { theo: 'luot', attemptNo: opts.attemptNo } : opts.periodId ?? null, today), thuong: null };
}

// ---------------------------------------------------------------- Khối 1 · Test quá hạn chấm

/**
 * MÔN CÒN NỢ ĐÃ BỊ DỜI LỊCH THẬT — dấu "-" của lớp thường hoặc dời do vắng (`MonDoiLich` ở attempts.ts); lịch tách
 * tuần theo kế hoạch KHÔNG tính (Q15 — chủ sản phẩm chốt chữ "lùi lịch"). `tuTuan` là tuần môn đó rời đi. Giao diện ghi
 * `{Kỹ năng} · lùi lịch của {tên}` khi một em, `{Kỹ năng} · lùi lịch · {n} HV` khi nhiều em; tooltip "Lùi lịch từ
 * {tuTuan} sang {sangTuan}". Mã tuần giữ nguyên dạng dữ liệu; ngày thứ Hai (`…Start`) để giao diện gọi `tuanLich`
 * — không bao giờ hiện mã có năm lên màn hình (G-6).
 */
export type LuiLich = {
  kyNang: string;
  hv: string[];
  tuTuan: string | null;
  sangTuan: string | null;
  tuTuanStart: string | null;
  sangTuanStart: string | null;
  /** PR-MT (YC-13.1 (3)): dời do vắng lần mấy — `null` khi lùi lịch không phải vì vắng. */
  lanVang: number | null;
};

/**
 * MỘT DÒNG KHỐI 1 "TEST QUÁ HẠN CHẤM" (PR-LT3 T17; tên kiểu giữ `DongNo` — D8) = lớp + đợt + TUẦN THI của các ô quá hạn (PR-UX1 Q2).
 * Tách theo tuần để bấm Chấm mở đúng lưới tuần đó; `attemptIds` để lưới chỉ hiện các em còn nợ.
 */
export type DongNo = {
  key: string; classId: number; classCode: string; mode: CheDo;
  /** Mã chương trình của lớp (MH2: tên môn theo chương trình — FOU G+V/P, Pre FOU Tổng hợp). */
  chuongTrinh: string | null;
  kind: string; attemptNo: number | null; dotLabel: string;
  periodId: number | null; weekStart: string | null;
  kyNang: string[]; kyNangLabel: string;
  conBai: number; soHv: number; attemptIds: number[];
  /** Hạn sớm nhất trong các ô còn nợ của dòng (ISO — giao diện tự định dạng). */
  han: string | null; quaHan: boolean;
  luiLich: LuiLich | null;
  /** Còn ít nhất một ô là môn người xem được PHÂN CÔNG (`mySkills`) → "Chờ bạn chấm". Speaking Mock (T18) không là của ai. */
  cuaToi: boolean;
  /** Người xem sửa được ít nhất một ô (kể cả đường sửa hộ) → nút "Chấm"; không thì "Xem". */
  duocCham: boolean;
  /** Người xem có dạy lớp này → "Chờ GV khác"; không dạy → "Chờ chấm". */
  coDayLop: boolean;
  hrefDayDu: string;
  /** PR-VAI-a (UX-B5, Q23): tên GV đang nợ các ô của dòng (từ `pendingOwners`, sắp theo tên, không trùng); rồi `GV chấm chéo` (T18); môn chưa phân công → "chưa phân công". */
  gvNo: string[];
};

/** Tên đợt trên dòng: FT gọi MT{n}; lớp thường gọi "Giữa khoá"/"Cuối khoá" — không bao giờ gọi đợt lớp thường là MT. */
const dotLabelOf = (kind: string, attemptNo: number | null) =>
  (kind === 'mock' ? `MT${attemptNo ?? ''}` : nhanBai(khoaBai(kind, attemptNo)));   // OV-6b2: "Checkpoint 2"

/** Thứ tự môn cố định L · R · W · S (W1, W2 của FT nằm chỗ W) — dòng nào cũng đọc cùng một thứ tự. */
const THU_TU_KY_NANG = ['listening', 'reading', 'writing', 'writing1', 'writing2', 'speaking', 'tong_hop'];
const theoThuTu = (a: string, b: string) =>
  ((THU_TU_KY_NANG.indexOf(a) + 1 || 99) - (THU_TU_KY_NANG.indexOf(b) + 1 || 99));

const kyNangLabelOf = (mode: CheDo, kyNang: string[], ct: string | null) =>
  (mode === 'ratio' && kyNang.length >= 4 ? `${kyNang.length} môn` : kyNang.map((k) => tenMonNgan(ct, k)).join(', '));

/** Một dòng nhắc "MT lịch sử chưa nhập" của một lớp (K2-32). */
export type NhacLichSu = { classId: number; classCode: string; soEm: number; href: string };

/**
 * K2-32 — LƯỢT MT LỊCH SỬ CÒN THIẾU ĐIỂM, gom theo lớp: một dòng nhắc MỜ ở Lịch Test và một việc xám ở Việc cần làm (không số đỏ,
 * không vào dải số hay Nợ, không hạn). Chỉ lớp người xem là GVCN hoặc Quản lý (xếp tuần được lớp đó). Một câu cho mọi lớp.
 */
export function mtLichSuChuaNhap(p: Principal, o: { classIds?: number[] | null; branchId?: number | null } = {}): NhacLichSu[] {
  if (o.classIds && !o.classIds.length) return [];
  /* T23 (PR-MTa): ô "-" (không dự thi) của MT cũ không còn là ô chưa nhập — chỉ nhắc lượt còn ô trống thật. */
  const where = ['a.lich_su = 1', `a.status = 'planned'`, `c.status = 'active'`, `EXISTS (SELECT 1 FROM attempt_skills k
    WHERE k.attempt_id = a.id AND k.required = 1 AND k.sit_status != 'cancelled'
      AND (SELECT COUNT(*) FROM assessment_scores sc WHERE sc.attempt_id = a.id
            AND (CASE WHEN sc.skill IN ('writing1', 'writing2') THEN 'writing' ELSE sc.skill END) = k.skill
            AND (sc.band IS NOT NULL OR sc.raw_score IS NOT NULL OR sc.no_show_period_id IS NOT NULL))
        < (CASE WHEN k.skill = 'writing' THEN 2 ELSE 1 END))`];
  const params: unknown[] = [];
  if (o.classIds) { where.push(`a.class_id IN (${o.classIds.map(() => '?').join(',')})`); params.push(...o.classIds); }
  if (o.branchId) { where.push('c.branch_id = ?'); params.push(o.branchId); }
  const rows = db().prepare(
    `SELECT a.class_id, a.student_id, a.planned_period_id, c.code FROM assessment_attempts a
       JOIN classes c ON c.id = a.class_id LEFT JOIN report_periods rp ON rp.id = a.planned_period_id
      WHERE ${where.join(' AND ')} ORDER BY c.code, rp.week_start`,
  ).all(...params) as any[];
  const duoc = new Map<number, boolean>();
  const theoLop = new Map<number, { classCode: string; em: Set<number>; periodId: number | null }>();
  for (const r of rows) {
    if (!duoc.has(r.class_id)) duoc.set(r.class_id, isCoreTeacherOf(p, r.class_id) || can(p, PERMISSIONS.PLAN_WEEK, { classId: r.class_id }));
    if (!duoc.get(r.class_id)) continue;
    const l = theoLop.get(r.class_id) ?? { classCode: r.code as string, em: new Set<number>(), periodId: r.planned_period_id ?? null };
    l.em.add(r.student_id);
    theoLop.set(r.class_id, l);
  }
  return [...theoLop].map(([classId, l]) => ({
    classId, classCode: l.classCode, soEm: l.em.size, href: `/nhap-diem/${classId}${l.periodId ? `?periodId=${l.periodId}` : ''}`,
  })).sort((a, b) => soSanhLop({ code: a.classCode }, { code: b.classCode }));   // PR-UXF-a U1
}

/** Chia lô cho câu `IN (...)` — SQLite giới hạn số tham số của một câu lệnh. */
function theoLo<T>(ids: T[], hoi: (lo: T[], ph: string) => void) {
  for (let i = 0; i < ids.length; i += 400) {
    const lo = ids.slice(i, i + 400);
    hoi(lo, lo.map(() => '?').join(','));
  }
}

/**
 * Dựng dòng phụ "lùi lịch" cho từng dòng Nợ tuần trước từ các ô có bằng chứng dời. Một dòng chỉ có MỘT dòng phụ: môn lùi
 * gặp đầu tiên; `hv` là mọi em của dòng có CHÍNH môn đó bị dời (Q15).
 *
 * Tuần cũ: dấu "-" mang sẵn id tuần cũ; dời do vắng thì đọc dòng `skill_week_moved_absence` MỚI NHẤT của lịch sử đợt
 * (`old_value` là mã tuần). Hai câu đọc gộp cho cả danh sách, không hỏi theo từng dòng.
 */
function dungLuiLich(
  doi: Array<{
    key: string; skill: string; hv: string; attemptId: number; moved: MonDoiLich;
    sangTuan: string | null; sangTuanStart: string | null;
  }>,
): Map<string, LuiLich> {
  const out = new Map<string, LuiLich>();
  if (!doi.length) return out;
  const conn = db();
  const tuan = new Map<number, { code: string; weekStart: string }>();
  const theoMa = new Map<string, string>();
  const vang = new Map<string, string>();   // `${attemptId}:${kỹ năng đánh giá}` → mã tuần cũ

  theoLo([...new Set(doi.map((x) => x.moved.fromPeriodId).filter((x): x is number => !!x))], (lo, ph) => {
    for (const r of conn.prepare(`SELECT id, code, week_start FROM report_periods WHERE id IN (${ph})`).all(...lo) as any[]) {
      tuan.set(r.id, { code: r.code, weekStart: r.week_start });
    }
  });
  theoLo([...new Set(doi.filter((x) => x.moved.by === 'absence').map((x) => x.attemptId))], (lo, ph) => {
    for (const r of conn.prepare(
      `SELECT attempt_id, field, old_value FROM attempt_schedule_history
        WHERE action = 'skill_week_moved_absence' AND attempt_id IN (${ph}) ORDER BY id`,
    ).all(...lo) as any[]) vang.set(`${r.attempt_id}:${r.field}`, r.old_value);
  });
  theoLo([...new Set(vang.values())].filter(Boolean), (lo, ph) => {
    for (const r of conn.prepare(`SELECT code, week_start FROM report_periods WHERE code IN (${ph})`).all(...lo) as any[]) {
      theoMa.set(r.code, r.week_start);
    }
  });

  for (const x of doi) {
    const cu = out.get(x.key);
    if (cu) {
      if (cu.kyNang === x.skill && !cu.hv.includes(x.hv)) cu.hv.push(x.hv);
      continue;
    }
    let tuTuan: string | null = null;
    let tuTuanStart: string | null = null;
    if (x.moved.fromPeriodId) {
      const t = tuan.get(x.moved.fromPeriodId);
      tuTuan = t?.code ?? null; tuTuanStart = t?.weekStart ?? null;
    } else {
      /* W1/W2 của FT dời theo lịch của môn Writing. */
      const maCu = vang.get(`${x.attemptId}:${assessedSkillOf(x.skill)}`) ?? null;
      tuTuan = maCu; tuTuanStart = maCu ? theoMa.get(maCu) ?? null : null;
    }
    out.set(x.key, {
      kyNang: x.skill, hv: [x.hv], tuTuan, sangTuan: x.sangTuan, tuTuanStart, sangTuanStart: x.sangTuanStart, lanVang: x.moved.lanVang,
    });
  }
  return out;
}

/** Ô chưa chấm thi trước tuần trước mà CHƯA quá hạn (hạn riêng dời xa — T15): khối 2 dựng lại hàng lớp tuần đó cho đúng các ô này. `oNhap` = ô nhập (W1/W2 riêng). */
export type OHanRieng = { periodId: number; attemptId: number; oNhap: string };

/**
 * KHỐI 1 "TEST QUÁ HẠN CHẤM" (PR-LT3 T15–T17) — ô còn nợ mà `khoiCham` xếp `'qua-han'`, tính theo HÔM NAY (không theo tuần đang xem:
 * lùi / tiến tuần khối 1 y nguyên), trong các lớp đang lọc. Ô thi tuần trước bỏ qua (khối 2 dựng bằng `hangLopTuan`); ô cũ hơn chưa
 * quá hạn trả ra `hanRieng`.
 *
 * Dùng nguyên `listAttempts` (phạm vi `managed`: cả môn của người khác — GV thấy dòng môn khác với nút "Xem") với ĐÚNG
 * luật lọc của `need: 'my_scores'` (`conBaiCanCham`): cùng một tập bài với badge "n bài chờ chấm" ở danh sách lớp và với
 * Việc cần làm, nên ba nơi không lệch số. Hàm này chỉ GOM DÒNG theo lớp + đợt + tuần.
 */
export function noQuaHan(
  p: Principal,
  f: { branchId?: number | null; classIds: ReadonlySet<number> | null; lopCuaToi: ReadonlySet<number> },
  today: string = demoToday(),
): { dong: DongNo[]; hanRieng: OHanRieng[] } {
  if (f.classIds && !f.classIds.size) return { dong: [], hanRieng: [] };
  const tuanHomNay = weekInfo(today).weekStart;
  const tuanTruoc = addDays(tuanHomNay, -7);
  const motLop = f.classIds && f.classIds.size === 1 ? [...f.classIds][0] : undefined;
  /* PR-UXF-a T65: em Tạm dừng không sinh nợ điểm (Lịch Test + khối Nợ). */
  /* Rà #218 I2: cùng phạm vi khối 2/3 (`scopeXemLuotCham`) — GV Speaking chấm chéo thấy S Mock quá hạn của lớp FT cùng chi nhánh. */
  const { rows } = listAttempts(p, { branchId: f.branchId ?? undefined, classId: motLop, scope: 'managed', chiDangHoc: true, phamViCham: true, chiConO: true });
  /* Một câu mỗi LỚP (như `isRatioClass` trước đây), không mỗi dòng: cách chấm + mã chương trình. */
  const lopInfo = new Map<number, { mode: CheDo; ct: string | null }>();
  const lopOf = (classId: number) => {
    if (!lopInfo.has(classId)) {
      const pg = programmeOfClass(classId);
      lopInfo.set(classId, { mode: cheDoCua(pg?.code), ct: pg?.code ?? null });
    }
    return lopInfo.get(classId)!;
  };

  type ChiTiet = {
    skill: string; deadline: string | null; periodId: number | null; weekCode: string | null; weekStart: string | null;
    /** PR-UXF-a Q10: cờ quá hạn của CHÍNH ô (`viewSkill.overdue`) — không tự tính lại từ hạn. */
    overdue: boolean;
    moved: MonDoiLich | null;
  };
  type Gom = DongNo & { _hs: Set<number>; _aid: Set<number>; _gv: Set<string>; _cc: boolean; _chuaPc: boolean };
  type Doi = {
    key: string; skill: string; hv: string; attemptId: number; moved: MonDoiLich;
    sangTuan: string | null; sangTuanStart: string | null;
  };
  const gom = new Map<string, Gom>();
  const doi: Doi[] = [];
  const hanRieng: OHanRieng[] = [];
  for (const a of rows as any[]) {
    if (!a.classId || a.status === 'cancelled' || !conBaiCanCham(a)) continue;
    if (f.classIds && !f.classIds.has(a.classId)) continue;
    for (const x of (a.pendingDetail ?? []) as ChiTiet[]) {
      if (!x.weekStart) continue;
      if (khoiCham({ tuanThi: x.weekStart, tuanHomNay, quaHan: x.overdue }) !== 'qua-han') {
        if (x.weekStart < tuanTruoc && x.periodId) {
          hanRieng.push({ periodId: x.periodId, attemptId: a.id, oNhap: x.skill });
        }
        continue;
      }
      const key = `${a.classId}:${a.kind}:${a.attemptNo ?? 0}:${x.periodId ?? 0}`;
      let cu = gom.get(key);
      if (!cu) {
        const mt0 = a.kind === 'mt0';   // PR-MT0: MT0 ở lớp thường chấm band, tên môn IELTS
        cu = {
          key, classId: a.classId, classCode: a.classCode ?? '—', mode: mt0 ? 'ielts_band' : lopOf(a.classId).mode, chuongTrinh: mt0 ? null : lopOf(a.classId).ct,
          kind: a.kind, attemptNo: a.attemptNo ?? null, dotLabel: dotLabelOf(a.kind, a.attemptNo ?? null),
          periodId: x.periodId, weekStart: x.weekStart,
          kyNang: [], kyNangLabel: '', conBai: 0, soHv: 0, attemptIds: [], han: null, quaHan: false, luiLich: null,
          cuaToi: false, duocCham: false, coDayLop: f.lopCuaToi.has(a.classId), hrefDayDu: '', gvNo: [],
          _hs: new Set(), _aid: new Set(), _gv: new Set(), _cc: false, _chuaPc: false,
        };
        gom.set(key, cu);
      }
      if (!cu.kyNang.includes(x.skill)) cu.kyNang.push(x.skill);
      cu.conBai += 1;
      cu._hs.add(a.studentId);
      cu._aid.add(a.id);
      const gv = (a.pendingOwners ?? {})[x.skill] ?? null;   // cùng nguồn tên với lượt (listAttempts) — không câu SQL mới
      if (gv === CHAM_CHEO) cu._cc = true; else if (gv) cu._gv.add(gv); else cu._chuaPc = true;
      if (x.deadline && (!cu.han || x.deadline < cu.han)) cu.han = x.deadline;
      if (x.overdue) cu.quaHan = true;
      /* Lùi lịch CHỈ khi có bằng chứng dời thật (`moved` — dấu "-" hoặc dời do vắng), không suy từ thứ tự tuần. */
      if (x.moved) {
        doi.push({
          key, skill: x.skill, hv: a.studentName, attemptId: a.id, moved: x.moved,
          sangTuan: x.weekCode, sangTuanStart: x.weekStart,
        });
      }
    }
  }
  const luiLichOf = dungLuiLich(doi);

  const dong: DongNo[] = [...gom.values()].map((d) => {
    const { _hs, _aid, _gv, _cc, _chuaPc, ...rest } = d;
    const kyNang = [...d.kyNang].sort(theoThuTu);
    return {
      ...rest,
      kyNang,
      kyNangLabel: kyNangLabelOf(d.mode, kyNang, d.chuongTrinh),
      soHv: _hs.size,
      gvNo: [...[..._gv].sort((x, y) => x.localeCompare(y, 'vi')), ...(_cc ? [CHAM_CHEO] : []), ...(_chuaPc ? ['chưa phân công'] : [])],
      attemptIds: [..._aid],
      luiLich: luiLichOf.get(d.key) ?? null,
      cuaToi: mySkills(p, d.classId, kyNang.filter((k) => !laChamCheo(d.kind, k))).length > 0,
      /* Chỉ còn ô Speaking Mock (không của ai) → "Chờ chấm", không "Chờ GV khác" (mockup LT3, T18). */
      coDayLop: rest.coDayLop && kyNang.some((k) => !laChamCheo(d.kind, k)),
      duocCham: editableSkills(p, d.classId, kyNang).length > 0,
      hrefDayDu: d.kind === 'mt0' ? `/nhap-diem/${d.classId}?kind=mt0${d.periodId ? `&periodId=${d.periodId}` : ''}`
        : d.mode === 'ielts_band'
        ? `/nhap-diem/${d.classId}${d.periodId ? `?periodId=${d.periodId}` : ''}`
        : `/nhap-diem/${d.classId}?kind=${encodeURIComponent(khoaBai(d.kind, d.attemptNo))}`,
    };
  });
  /* PR-UXF-a (UX-F7, U1): NHÓM THEO LỚP (`soSanhLop` — MB FT 9 trước MB FT 10); trong lớp: quá hạn trước, rồi hạn tăng dần, rồi tuần thi. */
  dong.sort((x, y) => soSanhLop({ code: x.classCode }, { code: y.classCode })
    || (Number(y.quaHan) - Number(x.quaHan)) || (x.han ?? '9999').localeCompare(y.han ?? '9999')
    || (x.weekStart ?? '').localeCompare(y.weekStart ?? ''));
  return { dong, hanRieng };
}

// ---------------------------------------------------------------- Lịch Test

export type DongLichTest = {
  key: string; dotLabel: string; kyNang: string[]; kyNangLabel: string;
  soHv: number; conBai: number;
  /** Một trong: "Đã chấm xong" · "Chưa đến lịch" · "Còn n bài" · "Quá hạn · còn n bài" (`trangThaiChamLabel`). */
  trangThai: string;
  href: string;
};
/**
 * MỘT HÀNG LỚN của Lịch Test (PR-UX1 Q9): lớp FT một hàng (lưới tuần FT gồm mọi MT trong tuần); lớp thường một hàng
 * mỗi bài (`classId:kind`) vì lưới lớp thường là một bài. `dong` giữ các dòng kỹ năng như cũ.
 */
export type LopLichTest = {
  key: string; classId: number; classCode: string; mode: CheDo; branchName: string;
  /** MH2/MH4: mã chương trình lớp + bộ môn của lớp (FT: 4 kỹ năng đánh giá; FOU L R W S hiện L R G+V P; Pre FOU `tong_hop`). */
  chuongTrinh: string | null; boMon: string[];
  kind: string | null; dotLabel: string;
  /** Môn đánh giá có thi tuần này, thứ tự L · R · W · S. */
  kyNangTuan: string[];
  tong: number; daCham: number; conBai: number; conBaiCuaToi: number;
  /** OV-1b (3.5): người có phân công — CHỈ ô của chính họ quá hạn; Quản lý / Quản trị (không phân công) — mọi ô. */
  han: string | null; quaHan: boolean;
  /**
   * OV-1b (3.5) "Phần của bạn": tách ô của người xem với ô của GV khác (kỹ năng đánh giá L R W S, số bài còn, số ngày quá hạn của phần người khác).
   * `null` với người không có phân công (Quản lý, Quản trị) — họ thấy toàn bộ qua `nhan` như cũ.
   */
  phan: PhanCuaBan | null;
  nhan: { loai: LoaiNhanLop; chu: string };
  /** Tự mở khi vào trang (Q8): người có phân công — còn bài của mình; Quản lý — còn bài. */
  moSan: boolean;
  hrefDayDu: string;
  dong: DongLichTest[];
  /** PR-MT (YC-13.1, K4 §4e): số bài vắng tuần này đang chờ Quản lý duyệt dời (lần 2+) — dòng tím nhạt trong hàng lớp. */
  choDuyetDoi: number;
  /** PR-LT3: tuần thi của hàng — khối 2 có hàng của tuần trước và của tuần cũ có hạn riêng (lưới mở đúng tuần đó). */
  periodId: number; weekStart: string;
};
export type PhanCuaBan = {
  toi: { kyNang: string[]; con: number } | null;
  khac: { kyNang: string[]; con: number; quaHanNgay: number | null } | null;
};
/** Dải số (PR-LT3 Q1): đã chấm x/y + còn phải chấm (khối 2 + 3 ở tuần hiện tại; tuần khác: khối 3) · quá hạn chấm (khối 1). */
export type TongQuanLich = { daCham: number; tong: number; conPhaiCham: number; no: { bai: number; lop: number } };
export type LichTest = {
  scopeEmpty: boolean;
  tuan: { id: number; weekStart: string; weekEnd: string } | null;
  /** Tuần đang xem = tuần của hôm nay — chỉ khi đó có khối 2. */
  laTuanNay: boolean;
  phamVi: PhamViLichTest;
  /** Hai lựa chọn "Lớp tôi dạy / Tất cả" cho ra hai tập khác nhau → mới hiện nút (Q4). */
  coPhamViRong: boolean;
  coPhanCong: boolean;
  lopDangLoc: { id: number; code: string } | null;
  tongQuan: TongQuanLich;
  /** MH4, K4-05: cùng dải số tách theo khung (công tắc Fast Track · Lớp thường); cộng hai khung = `tongQuan`. */
  tongQuanKhung: Record<Khung, TongQuanLich>;
  /** KHỐI 1 "Test quá hạn chấm" — theo hôm nay, không theo tuần đang xem (tên trường giữ `no` — D8). */
  no: DongNo[];
  /** KHỐI 2 "Test chấm tuần này" — tuần trước + ô hạn riêng; `null` khi không xem tuần hiện tại. */
  chamTuanNay: LopLichTest[] | null;
  /** KHỐI 3 "Lịch Test" — tuần đang xem. */
  lop: LopLichTest[];
  /** PR-MT (K2-32): dòng nhắc MỜ cuối trang — MT lịch sử chưa nhập theo lớp. */
  nhacLichSu: NhacLichSu[];
};

type OiemLuu = {
  skill: string; band: number | null; raw_score: number | null;
  no_show_period_id: number | null; no_show_settled_at: string | null; no_show_late: number | null; no_show_cu?: number | null;
};

/**
 * MỘT Ô NHẬP FT ĐÃ XONG CHƯA — có điểm, hoặc dấu "-" CÒN HIỆU LỰC ở chính tuần này. OV-1b: CÙNG MỘT HÀM với `skillCells`
 * (`dauTruCuaO`, nơi badge "n bài chờ chấm" và khối Nợ đọc) — hàng lớp và ô đếm không còn hai bản chép của một luật.
 */
function oFtXong(diem: OiemLuu[], nhap: string, v: { periodId: number; weekEnd: string | null; sitStatus: string; today: string }) {
  const row = diem.find((x) => x.skill === nhap);
  if (!row) return false;
  if (row.band !== null || row.raw_score !== null) return true;
  return dauTruCuaO({
    marked: !!row.no_show_period_id, hasScore: false, sameWeek: row.no_show_period_id === v.periodId, weekEnd: v.weekEnd, today: v.today,
    settled: !!row.no_show_settled_at, cu: !!row.no_show_cu, sitStatus: v.sitStatus,
  }).state !== 'none';
}

/** Ô nhập của một dòng lịch: Writing FT là hai ô W1, W2; còn lại một ô cùng tên môn. */
const oNhapCua = (r: { skill: string; programme_code: string | null; kind?: string }): string[] =>
  ((r.kind === 'mt0' || cheDoCua(r.programme_code) === 'ielts_band') && r.skill === 'writing' ? ['writing1', 'writing2'] : [r.skill]);

const THU_TU_MON =
  `CASE ask.skill WHEN 'listening' THEN 1 WHEN 'reading' THEN 2 WHEN 'writing' THEN 3 WHEN 'speaking' THEN 4 WHEN 'tong_hop' THEN 5 ELSE 6 END`;

/**
 * HÀNG LỚP CỦA MỘT TUẦN THI (PR-UX1; PR-LT3 tách ra để dựng cả khối 2 và khối 3) — mỗi lớp FT một hàng (lưới tuần FT gồm mọi MT
 * trong tuần), lớp thường một hàng mỗi bài. Mọi số tính TRONG BỘ NHỚ từ một câu SQL + một câu điểm gom lô — không hỏi theo từng lớp.
 *
 * Lọc theo TUẦN CỦA CHÍNH MÔN (`attempt_skills.planned_period_id`), không theo tuần của cả đợt: đợt tách tuần thì lọc
 * theo tuần của đợt làm biến mất đúng những bài đang phải chấm trong tuần đang xem — cùng lý do đã ghi ở
 * `classScoreSheet`. Lớp thường ghi "-" thì môn dời hẳn sang tuần sau nên tự rời tuần cũ.
 *
 * Chỉ tính lượt còn ngồi thi (`scheduled`/`sat`) — cả vào số em lẫn số bài. Một ô còn phải chấm = chưa có điểm và
 * chưa báo "-" ở CHÍNH tuần này (ô "-" tính là đã xử lý). Writing của FT có hai ô (W1, W2): xong khi cả hai có band.
 */
function hangLopTuan(
  p: Principal,
  ctx: {
    cs: { sql: string; params: unknown[] }; branchId?: number | null; today: string; coPhanCong: boolean;
    lopCuaToi: ReadonlySet<number>; giuLop: (classId: number) => boolean;
  },
  tuan: { id: number; week_start: string; week_end: string },
  /** Khối 2 hạn riêng: chỉ các ô `${attemptId}:${ô nhập}` này. */
  loc?: ReadonlySet<string>,
): LopLichTest[] {
  const { cs, branchId, today, coPhanCong, lopCuaToi, giuLop } = ctx;
  const conn = db();
  const periodId = tuan.id;
  /* Tuần đang xem còn ở phía trước thì chưa ai nợ bài nào. */
  const chuaToiHan = String(tuan.week_start) > weekInfo(today).weekStart;
  const params: unknown[] = [...cs.params, periodId];
  /* PR-MT (M3, K4-01): MT lịch sử không vào tổng / còn bài / quá hạn / tự mở / dải số — nhắc riêng một dòng mờ (`mtLichSuChuaNhap`). */
  let where = `${cs.sql} AND a.status != 'cancelled' AND ${LUOT_TINH_NO_SQL('a')} AND ask.required = 1 AND ask.planned_period_id = ?`;
  if (branchId) { where += ' AND c.branch_id = ?'; params.push(branchId); }
  const rows = conn
    .prepare(
      `SELECT a.id, a.kind, a.attempt_no, a.class_id, a.deadline_override AS han_dot,
              c.code AS class_code, b.name AS branch_name, c.programme_code,
              ask.skill, ask.sit_status, ask.deadline_override AS han_mon
         FROM assessment_attempts a
         JOIN attempt_skills ask ON ask.attempt_id = a.id
         JOIN students s ON s.id = a.student_id AND ${HV_DANG_HOC_SQL('s')}   -- PR-S6F-a Q2: cùng tập khối Nợ / badge
         JOIN classes c ON c.id = a.class_id
         JOIN branches b ON b.id = c.branch_id
        WHERE ${where}
        ORDER BY c.code, a.kind DESC, a.attempt_no, ${THU_TU_MON}`,
    )
    .all(...params)
    /* `loc` (khối 2 hạn riêng): chỉ các ô (lượt, kỹ năng đánh giá) được đưa vào — lọc ngay sau câu SQL, mọi đếm phía dưới đi theo. */
    .filter((r: any) => !loc || oNhapCua(r).some((k) => loc.has(`${r.id}:${k}`))) as any[];

  /* Điểm + dấu "-" của mọi lượt trong tuần: MỘT câu gom lô (thay các câu con lồng theo từng dòng). */
  const diemCua = new Map<number, OiemLuu[]>();
  theoLo([...new Set(rows.map((r) => r.id as number))], (lo, ph) => {
    for (const x of conn.prepare(
      `SELECT attempt_id, skill, band, raw_score, no_show_period_id, no_show_settled_at, no_show_late, no_show_cu
         FROM assessment_scores WHERE attempt_id IN (${ph})`,
    ).all(...lo) as any[]) {
      (diemCua.get(x.attempt_id) ?? diemCua.set(x.attempt_id, []).get(x.attempt_id)!).push(x);
    }
  });

  const modes = allProgrammes();
  /* Môn NHẬP của tôi ở lớp này — hỏi một lần mỗi lớp + môn (W1, W2 của FT phân công riêng). */
  const cuaToiNho = new Map<string, boolean>();
  const monCuaToi = (classId: number, monNhap: string) => {
    const k = `${classId}:${monNhap}`;
    if (!cuaToiNho.has(k)) cuaToiNho.set(k, mySkills(p, classId, [monNhap]).length > 0);
    return cuaToiNho.get(k)!;
  };
  type DongTam = Omit<DongLichTest, 'trangThai'> & { quaHan: boolean };
  type LopTam = Omit<LopLichTest, 'dong' | 'nhan' | 'moSan' | 'daCham' | 'dotLabel' | 'kyNangTuan' | 'han' | 'choDuyetDoi' | 'periodId' | 'weekStart' | 'phan'> & {
    dong: Map<string, DongTam>; _dot: string[]; _kn: Set<string>; _hanNo: string | null; _conKhongCheo: number;
    /* OV-1b: phần của người xem / của GV khác. */
    _toiKn: Set<string>; _toiQuaHan: boolean; _quaHanMoi: boolean; _khacKn: Set<string>; _khacCon: number; _khacTre: number | null;
  };
  const byLop = new Map<string, LopTam>();
  /* PR-MT: bài vắng tuần này có đề nghị dời chờ Quản lý — MỘT lần tra sổ đề nghị cho cả trang (không hỏi từng dòng). */
  const deNghi = pendingMovesFor([...new Set(rows.map((r) => r.id as number))]);
  const choDuyetCua = new Map<number, number>();
  for (const r of rows) {
    if (r.sit_status === 'absent' && giuLop(r.class_id) && deNghi.get(`${r.id}:${r.skill}`)?.from_period_id === periodId) {
      choDuyetCua.set(r.class_id, (choDuyetCua.get(r.class_id) ?? 0) + 1);
    }
  }
  for (const r of rows) {
    /* Chỉ đếm lượt còn ngồi thi (chưa vắng, chưa huỷ phần thi): em vắng không làm dòng thành "Đã chấm xong". */
    if (r.sit_status !== 'scheduled' && r.sit_status !== 'sat') continue;
    if (!giuLop(r.class_id)) continue;
    /* PR-MT0 (mockup ⑤): MT0 ở lớp thường = một hàng riêng `{lớp}:mt0`, lưới band, tên môn IELTS, mở Nhập điểm `kind=mt0`. */
    const mt0 = r.kind === 'mt0';
    const mode: CheDo = mt0 ? 'ielts_band' : cheDoCua(r.programme_code);
    const bai = khoaBai(r.kind, r.attempt_no);   // OV-6b2: mỗi Checkpoint một hàng (`checkpoint:2`)
    const khoa = mt0 || mode === 'ratio' ? `${r.class_id}:${bai}` : String(r.class_id);
    let lop = byLop.get(khoa);
    if (!lop) {
      lop = {
        key: khoa, classId: r.class_id, classCode: r.class_code, branchName: r.branch_name, mode,
        chuongTrinh: mt0 ? null : r.programme_code ?? null,
        boMon: mt0 ? [...ASSESSED_SKILLS] : [...boMonLich(r.programme_code, modes.get(r.programme_code)?.skills)],
        kind: mt0 || mode === 'ratio' ? bai : null,
        tong: 0, conBai: 0, conBaiCuaToi: 0, quaHan: false,
        hrefDayDu: mt0 ? `/nhap-diem/${r.class_id}?kind=mt0&periodId=${periodId}`
          : mode === 'ratio'
          ? `/nhap-diem/${r.class_id}?kind=${encodeURIComponent(bai)}`
          : `/nhap-diem/${r.class_id}?periodId=${periodId}`,
        dong: new Map(), _dot: [], _kn: new Set(), _hanNo: null, _conKhongCheo: 0,
        _toiKn: new Set(), _toiQuaHan: false, _quaHanMoi: false, _khacKn: new Set(), _khacCon: 0, _khacTre: null,
      };
      byLop.set(khoa, lop);
    }
    const dot = dotLabelOf(r.kind, r.attempt_no ?? null);
    if (!lop._dot.includes(dot)) lop._dot.push(dot);
    lop._kn.add(r.skill);
    const key = `${r.kind}:${r.attempt_no ?? 0}:${r.skill}`;
    let d = lop.dong.get(key);
    if (!d) {
      const qs = new URLSearchParams();
      if (r.kind !== 'mock') qs.set('kind', bai);
      /* Lớp FT mở lưới đúng tuần đang xem. Lớp thường kèm `kn` = môn của dòng: con trỏ đặt sẵn vào ô trống đầu tiên
         của môn đó. */
      if (mode === 'ielts_band') qs.set('periodId', String(periodId));
      else qs.set('kn', r.skill);
      const q = qs.toString();
      d = {
        key, dotLabel: dot, kyNang: [r.skill],
        kyNangLabel: tenMonNgan(mt0 ? null : r.programme_code, r.skill), soHv: 0, conBai: 0, quaHan: false,
        href: `/nhap-diem/${r.class_id}${q ? `?${q}` : ''}`,
      };
      lop.dong.set(key, d);
    }
    /*
     * MỘT BÀI = MỘT Ô NHẬP (rà #92): Writing FT là HAI bài W1, W2 — cùng cách đếm với khối Nợ (`pendingDetail`) và badge
     * "n bài chờ chấm" (`pendingSkillsOf`), nên hàng lớp + Nợ cộng lại đúng bằng badge (G-10). `soHv` vẫn đếm theo em.
     * Mỗi ô xong khi có điểm hoặc đã báo "-" ở chính tuần này.
     */
    const diem = diemCua.get(r.id) ?? [];
    const cacO = oNhapCua(r).filter((k) => !loc || loc.has(`${r.id}:${k}`))
      .map((nhap) => ({
        nhap,
        xong: mode === 'ielts_band'
          ? oFtXong(diem, nhap, { periodId, weekEnd: tuan.week_end, sitStatus: r.sit_status, today })
          : diem.some((x) => x.skill === nhap && (x.band !== null || x.raw_score !== null || x.no_show_period_id === periodId)),
      }));
    const con = cacO.filter((o) => !o.xong);
    /* T18: Speaking Mock không là "bài của tôi" của ai (không "Chờ bạn chấm", không tự mở vì nó). */
    const cuaToi = (nhap: string) => !laChamCheo(r.kind, nhap) && monCuaToi(r.class_id, nhap);
    for (const o of cacO) if (cuaToi(o.nhap)) lop._toiKn.add(assessedSkillOf(o.nhap));
    d.soHv += 1;
    lop.tong += cacO.length;
    if (con.length) {
      d.conBai += con.length;
      lop.conBai += con.length;
      const toi = con.filter((o) => cuaToi(o.nhap)).length;
      lop.conBaiCuaToi += toi;
      lop._conKhongCheo += con.filter((o) => !laChamCheo(r.kind, o.nhap)).length;
      /* Hạn theo đúng thứ tự của `viewSkill`: hạn riêng của môn → hạn riêng của đợt → hạn mặc định theo tuần môn. */
      const han = r.han_mon ?? r.han_dot ?? skillScoreDeadline(mode === 'ratio' ? 'ratio' : 'band', tuan.week_start, mt0);
      if (!lop._hanNo || han < lop._hanNo) lop._hanNo = han;
      const tre = !chuaToiHan && quaHanNhapDiem(han, tuan.week_start, today);   // PR-UXF-a Q10
      if (tre) { d.quaHan = true; lop._quaHanMoi = true; }
      if (tre && toi) lop._toiQuaHan = true;
      if (con.length > toi) {
        for (const o of con) if (!cuaToi(o.nhap)) lop._khacKn.add(assessedSkillOf(o.nhap));
        lop._khacCon += con.length - toi;
        if (tre) lop._khacTre = Math.max(lop._khacTre ?? 0, Math.round((Date.parse(today.slice(0, 10)) - Date.parse(han.slice(0, 10))) / 86_400_000));
      }
    }
  }

  /* PR-UXF-a U1: lớp sắp theo `soSanhLop` (không theo chữ — "MB FT 10" không đứng trước "MB FT 9"). */
  return [...byLop.values()].sort((a, b) => soSanhLop({ code: a.classCode }, { code: b.classCode })).map(({
    dong, _dot, _kn, _hanNo, _conKhongCheo, _toiKn, _toiQuaHan, _quaHanMoi, _khacKn, _khacCon, _khacTre, ...l
  }) => {
    /* OV-1b (3.5): nhãn "Quá hạn" của hàng = ô CỦA NGƯỜI XEM quá hạn (GV); Quản lý / Quản trị (xếp lịch được lớp) — mọi ô, như cũ. */
    const phanRieng = coPhanCong && !can(p, PERMISSIONS.PLAN_WEEK, { classId: l.classId });
    return {
      ...l,
      quaHan: phanRieng ? _toiQuaHan : _quaHanMoi,
      phan: phanRieng ? {
        toi: _toiKn.size ? { kyNang: [..._toiKn].sort(theoThuTu), con: l.conBaiCuaToi } : null,
        khac: _khacCon ? { kyNang: [..._khacKn].sort(theoThuTu), con: _khacCon, quaHanNgay: _khacTre } : null,
      } : null,
      dotLabel: _dot.join(', '),
      kyNangTuan: [...new Set([..._kn].map((k) => assessedSkillOf(k)))].sort(theoThuTu),
      daCham: l.tong - l.conBai,
      han: _hanNo ?? skillScoreDeadline(l.mode === 'ratio' ? 'ratio' : 'band', tuan.week_start, l.kind === 'mt0'),
      /* Chỉ còn ô Speaking Mock (không của ai) → "Chờ chấm" cả với người dạy lớp (T18). */
      nhan: nhanLopLichTest({ conBai: l.conBai, conBaiCuaToi: l.conBaiCuaToi, chuaToiHan, coDayLop: lopCuaToi.has(l.classId) && _conKhongCheo > 0 }),
      /* Tuần chưa tới thì chưa có gì để chấm — không tự mở. */
      moSan: !chuaToiHan && lopTuMo({ conBai: l.conBai, conBaiCuaToi: l.conBaiCuaToi, coPhanCong }),
      choDuyetDoi: l.mode === 'ielts_band' ? choDuyetCua.get(l.classId) ?? 0 : 0,
      periodId, weekStart: String(tuan.week_start),
      dong: [...dong.values()].map(({ quaHan, ...d }) => ({
        ...d,
        trangThai: trangThaiChamLabel({ conBai: d.conBai, tong: d.soHv, quaHan, chuaToiHan }),
      })),
    };
  });
}

/** PR-MT0: khung của một hàng Lịch Test — MT0 chấm band nhưng ở lớp thường, nên thuộc khung "Lớp thường". */
const khungDong = (x: { mode: CheDo; kind: string | null }): Khung => (x.kind === 'mt0' ? 'thuong' : khungCua(x.mode));

/**
 * "TUẦN NÀY CÓ NHỮNG LƯỢT TEST NÀO, CÒN PHẢI CHẤM GÌ" — MỘT lời gọi đủ cho màn Lịch Test (PR-UX1, PR-LT3 T15–T17). Ba khối, một bài
 * đúng một khối (khi xem tuần hiện tại):
 *   khối 1 `no`           Test quá hạn chấm — `noQuaHan`, theo hôm nay (lùi / tiến tuần không đổi)
 *   khối 2 `chamTuanNay`  Test chấm tuần này — hàng lớp tuần trước + hàng của ô hạn riêng tuần cũ; chỉ khi xem tuần hiện tại
 *   khối 3 `lop`          Lịch Test — hàng lớp tuần đang xem
 * Lớp thường, FT, MT0 cùng luật (chia khối đọc cờ `overdue` của chính ô).
 */
export function lichTest(
  p: Principal, periodId: number, branchId?: number | null, today: string = demoToday(),
  o: { phamVi?: PhamViLichTest | null; classId?: number | null } = {},
): LichTest {
  /* PR-HSM: GV Speaking thấy thêm lớp FT cùng chi nhánh ở "Tất cả" (chấm S chéo) — chỉ màn này, không mở rộng phạm vi chung. */
  const scope = scopeXemLuotCham(p, today);
  const coPhanCong = defaultWorkScope(p) === 'mine';
  /* Không có phân công thì "Lớp tôi dạy" là tập rỗng — luôn xem Tất cả. */
  const phamVi: PhamViLichTest = coPhanCong ? o.phamVi ?? 'cua-toi' : 'tat-ca';
  const khong: TongQuanLich = { daCham: 0, tong: 0, conPhaiCham: 0, no: { bai: 0, lop: 0 } };
  const rong: LichTest = {
    scopeEmpty: scope.none, tuan: null, laTuanNay: false, phamVi, coPhamViRong: false, coPhanCong, lopDangLoc: null,
    tongQuan: khong, tongQuanKhung: { ft: khong, thuong: khong }, no: [], chamTuanNay: null, lop: [], nhacLichSu: [],
  };
  if (scope.none) return rong;
  const conn = db();
  const tuan = conn.prepare('SELECT id, week_start, week_end FROM report_periods WHERE id = ?').get(periodId) as any;
  if (!tuan) return rong;
  const tuanNay = weekInfo(today).weekStart;
  const laTuanNay = String(tuan.week_start) === tuanNay;

  const lopCuaToi = new Set(p.assignments.filter((a) => activeAt(a, today)).map((a) => a.classId));
  const coPhamViRong = coPhanCong && (scope.all || scope.branchIds.length > 0 || scope.classIds.some((id) => !lopCuaToi.has(id)));
  /* Chip "Đang lọc: lớp …" chỉ nói tên lớp NGƯỜI XEM ĐƯỢC THẤY — lớp ngoài phạm vi thì null, không lộ mã lớp. */
  const lopDangLoc = o.classId && (can(p, PERMISSIONS.ATTEMPT_VIEW, { classId: o.classId }) || lopFtChoGvSpeaking(p, today).includes(o.classId))
    ? (conn.prepare('SELECT id, code FROM classes WHERE id = ?').get(o.classId) as any) ?? null
    : null;
  const giuLop = (classId: number) =>
    (phamVi !== 'cua-toi' || lopCuaToi.has(classId)) && (!o.classId || classId === o.classId);
  const ctx = { cs: classScopeSql(scope), branchId, today, coPhanCong, lopCuaToi, giuLop };

  const lop = hangLopTuan(p, ctx, tuan);

  /* Khối 1 (và ô hạn riêng của khối 2): cùng bộ lọc lớp với danh sách (phạm vi + lớp đang lọc). */
  const lopNo: Set<number> | null = phamVi === 'cua-toi'
    ? new Set([...lopCuaToi].filter((id) => !o.classId || id === o.classId))
    : o.classId ? new Set([o.classId]) : null;
  const no = noQuaHan(p, { branchId, classIds: lopNo, lopCuaToi }, today);

  let chamTuanNay: LopLichTest[] | null = null;
  if (laTuanNay) {
    const tuanCua = (sql: string, v: unknown) => conn.prepare(`SELECT id, week_start, week_end FROM report_periods WHERE ${sql}`).get(v) as any;
    const truoc = tuanCua('week_start = ?', addDays(tuanNay, -7));
    chamTuanNay = truoc ? hangLopTuan(p, ctx, truoc) : [];
    /* ponytail: mỗi tuần có ô hạn riêng thêm ~3 câu SQL — hiếm (chỉ khi Quản lý dời hạn); gộp `IN` nếu đo thấy nhiều. */
    const theoTuan = new Map<number, Set<string>>();
    for (const h of no.hanRieng) (theoTuan.get(h.periodId) ?? theoTuan.set(h.periodId, new Set()).get(h.periodId)!).add(`${h.attemptId}:${h.oNhap}`);
    for (const [id, cacO] of theoTuan) {
      const t = tuanCua('id = ?', id);
      if (t) chamTuanNay.push(...hangLopTuan(p, ctx, t, cacO));
    }
    /* Q4 (chủ sản phẩm 06/10): lớp còn bài trước (theo lớp, tuần mới trước); lớp đã chấm xong xếp cuối — web luôn thu gọn. */
    chamTuanNay.sort((x, y) => Number(x.conBai === 0) - Number(y.conBai === 0)
      || soSanhLop({ code: x.classCode }, { code: y.classCode }) || y.weekStart.localeCompare(x.weekStart));
  }

  const k23 = [...(chamTuanNay ?? []), ...lop];
  const tq = (ds: LopLichTest[], n: DongNo[]): TongQuanLich => {
    const tong = ds.reduce((s, x) => s + x.tong, 0), con = ds.reduce((s, x) => s + x.conBai, 0);
    return { tong, conPhaiCham: con, daCham: tong - con, no: { bai: n.reduce((s, d) => s + d.conBai, 0), lop: new Set(n.map((d) => d.classId)).size } };
  };
  return {
    scopeEmpty: false,
    tuan: { id: tuan.id, weekStart: tuan.week_start, weekEnd: tuan.week_end },
    laTuanNay, phamVi, coPhamViRong, coPhanCong,
    lopDangLoc: lopDangLoc ? { id: lopDangLoc.id as number, code: lopDangLoc.code as string } : null,
    tongQuan: tq(k23, no.dong),
    tongQuanKhung: Object.fromEntries((['ft', 'thuong'] as const).map((k) => [k,
      tq(k23.filter((x) => khungDong(x) === k), no.dong.filter((x) => khungDong(x) === k))])) as Record<Khung, TongQuanLich>,
    no: no.dong,
    chamTuanNay,
    lop,
    nhacLichSu: mtLichSuChuaNhap(p, { classIds: lopNo ? [...lopNo] : null, branchId }),
  };
}
