/**
 * KHU VỰC TEST — ba câu hỏi ĐỌC của việc chấm điểm (spec §3.5):
 *
 *   lichTest     "tuần này có những lượt Test nào, còn phải chấm gì" — MỘT lời gọi đủ cho màn Lịch Test (PR-UX1):
 *                dải số, khối Nợ tuần trước (`noTuanTruoc`), mỗi lớp một hàng lớn kèm nhãn + cờ tự mở.
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
  activeAt, can, classScopeSql, defaultWorkScope, editableSkills, isCoreTeacherOf, lopFtChoGvSpeaking, mySkills, scopeFor, type Principal,
} from '../permissions.ts';
import {
  ATTEMPT_KIND_SHORT, C10_NHAP_DAU_TRU_TUAN_QUA_KHU, LUOT_TINH_NO_SQL, PERMISSIONS, boMonLich, khungCua, lopTuMo, tenMonNgan, type Khung, nhanLopLichTest, noShowStateOf,
  soSanhLop, trangThaiChamLabel, type AssessedSkill, type AttemptKind, type LoaiNhanLop, type PhamViLichTest,
} from '../../../shared/domain/index.ts';
import { classScoreSheet, conBaiCanCham, listAttempts, type MonDoiLich } from '../fasttrack/attempts.ts';
import { pendingMovesFor } from '../fasttrack/absence.ts';
import { assessedSkillOf, entrySkillsOf } from '../fasttrack/scoring.ts';
import { allProgrammes, isRatioClass, programmeOfClass, regularSheet } from '../normal/regular.ts';
import { quaHanNhapDiem, skillScoreDeadline, weekInfo } from '../platform/week.ts';

export function chamSheet(
  p: Principal, classId: number, opts: { periodId?: number | null; kind?: string | null } = {},
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
  if (isRatioClass(classId)) {
    return { ...chung, mode: 'ratio' as const, thuong: regularSheet(p, classId, opts.kind ?? undefined), ft: null };
  }
  return { ...chung, mode: 'ielts_band' as const, ft: classScoreSheet(p, classId, opts.periodId ?? null, today), thuong: null };
}

// ---------------------------------------------------------------- Nợ tuần trước

type CheDo = 'ielts_band' | 'ratio';

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
 * MỘT DÒNG "NỢ TUẦN TRƯỚC" = lớp + đợt + TUẦN THI của các ô còn nợ (PR-UX1 Q2). Tách theo tuần để bấm Chấm mở đúng
 * lưới tuần đó; `attemptIds` để lưới chỉ hiện các em còn nợ.
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
  /** Còn ít nhất một ô là môn người xem được PHÂN CÔNG (`mySkills`) → "Chờ bạn chấm". */
  cuaToi: boolean;
  /** Người xem sửa được ít nhất một ô (kể cả đường sửa hộ) → nút "Chấm"; không thì "Xem". */
  duocCham: boolean;
  /** Người xem có dạy lớp này → "Chờ GV khác"; không dạy → "Chờ chấm". */
  coDayLop: boolean;
  hrefDayDu: string;
  /** PR-VAI-a (UX-B5, Q23): tên GV đang nợ các ô của dòng (từ `pendingOwners`, sắp theo tên, không trùng); môn chưa phân công → "chưa phân công". */
  gvNo: string[];
};

/** Tên đợt trên dòng: FT gọi MT{n}; lớp thường gọi "Giữa khoá"/"Cuối khoá" — không bao giờ gọi đợt lớp thường là MT. */
const dotLabelOf = (kind: string, attemptNo: number | null) =>
  (kind === 'mock' ? `MT${attemptNo ?? ''}` : ATTEMPT_KIND_SHORT[kind as AttemptKind] ?? kind);

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
  const where = ['a.lich_su = 1', `a.status = 'planned'`, `c.status = 'active'`];
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

/**
 * "NỢ TUẦN TRƯỚC" (PR-UX1 Q2, Q3) — ô còn nợ có tuần thi TRƯỚC tuần đang xem (mọi tuần trước, không chỉ tuần liền
 * trước), trong các lớp đang lọc.
 *
 * Dùng nguyên `listAttempts` (phạm vi `managed`: cả môn của người khác — GV thấy dòng môn khác với nút "Xem") với ĐÚNG
 * luật lọc của `need: 'my_scores'` (`conBaiCanCham`): cùng một tập bài với badge "n bài chờ chấm" ở danh sách lớp và với
 * Việc cần làm, nên ba nơi không lệch số. Hàm này chỉ GOM DÒNG theo lớp + đợt + tuần.
 */
export function noTuanTruoc(
  p: Principal,
  f: { branchId?: number | null; classIds: ReadonlySet<number> | null; truocTuan: string; lopCuaToi: ReadonlySet<number> },
  today: string = demoToday(),
): { dong: DongNo[]; quaHanBai: number; quaHanBaiKhung: Record<Khung, number> } {
  if (f.classIds && !f.classIds.size) return { dong: [], quaHanBai: 0, quaHanBaiKhung: { ft: 0, thuong: 0 } };
  const motLop = f.classIds && f.classIds.size === 1 ? [...f.classIds][0] : undefined;
  /* PR-UXF-a T65: em Tạm dừng không sinh nợ điểm (Lịch Test + khối Nợ). */
  const { rows } = listAttempts(p, { branchId: f.branchId ?? undefined, classId: motLop, scope: 'managed', chiDangHoc: true });
  /* Một câu mỗi LỚP (như `isRatioClass` trước đây), không mỗi dòng: cách chấm + mã chương trình. */
  const lopInfo = new Map<number, { mode: CheDo; ct: string | null }>();
  const lopOf = (classId: number) => {
    if (!lopInfo.has(classId)) {
      const pg = programmeOfClass(classId);
      lopInfo.set(classId, { mode: pg?.scoringMode === 'ratio' ? 'ratio' : 'ielts_band', ct: pg?.code ?? null });
    }
    return lopInfo.get(classId)!;
  };

  type ChiTiet = {
    skill: string; deadline: string | null; periodId: number | null; weekCode: string | null; weekStart: string | null;
    /** PR-UXF-a Q10: cờ quá hạn của CHÍNH ô (`viewSkill.overdue`) — không tự tính lại từ hạn. */
    overdue: boolean;
    moved: MonDoiLich | null;
  };
  type Gom = DongNo & { _hs: Set<number>; _aid: Set<number>; _gv: Set<string>; _chuaPc: boolean };
  type Doi = {
    key: string; skill: string; hv: string; attemptId: number; moved: MonDoiLich;
    sangTuan: string | null; sangTuanStart: string | null;
  };
  const gom = new Map<string, Gom>();
  const doi: Doi[] = [];
  let quaHanBai = 0;
  const quaHanBaiKhung: Record<Khung, number> = { ft: 0, thuong: 0 };
  for (const a of rows as any[]) {
    if (!a.classId || a.status === 'cancelled' || !conBaiCanCham(a)) continue;
    if (f.classIds && !f.classIds.has(a.classId)) continue;
    for (const x of (a.pendingDetail ?? []) as ChiTiet[]) {
      if (!x.weekStart || x.weekStart >= f.truocTuan) continue;
      const key = `${a.classId}:${a.kind}:${a.attemptNo ?? 0}:${x.periodId ?? 0}`;
      let cu = gom.get(key);
      if (!cu) {
        cu = {
          key, classId: a.classId, classCode: a.classCode ?? '—', mode: lopOf(a.classId).mode, chuongTrinh: lopOf(a.classId).ct,
          kind: a.kind, attemptNo: a.attemptNo ?? null, dotLabel: dotLabelOf(a.kind, a.attemptNo ?? null),
          periodId: x.periodId, weekStart: x.weekStart,
          kyNang: [], kyNangLabel: '', conBai: 0, soHv: 0, attemptIds: [], han: null, quaHan: false, luiLich: null,
          cuaToi: false, duocCham: false, coDayLop: f.lopCuaToi.has(a.classId), hrefDayDu: '', gvNo: [],
          _hs: new Set(), _aid: new Set(), _gv: new Set(), _chuaPc: false,
        };
        gom.set(key, cu);
      }
      if (!cu.kyNang.includes(x.skill)) cu.kyNang.push(x.skill);
      cu.conBai += 1;
      cu._hs.add(a.studentId);
      cu._aid.add(a.id);
      const gv = (a.pendingOwners ?? {})[x.skill] ?? null;   // cùng nguồn tên với lượt (listAttempts) — không câu SQL mới
      if (gv) cu._gv.add(gv); else cu._chuaPc = true;
      if (x.deadline && (!cu.han || x.deadline < cu.han)) cu.han = x.deadline;
      if (x.overdue) { cu.quaHan = true; quaHanBai += 1; quaHanBaiKhung[khungCua(lopOf(a.classId).mode)] += 1; }
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
    const { _hs, _aid, _gv, _chuaPc, ...rest } = d;
    const kyNang = [...d.kyNang].sort(theoThuTu);
    return {
      ...rest,
      kyNang,
      kyNangLabel: kyNangLabelOf(d.mode, kyNang, d.chuongTrinh),
      soHv: _hs.size,
      gvNo: [...[..._gv].sort((x, y) => x.localeCompare(y, 'vi')), ...(_chuaPc ? ['chưa phân công'] : [])],
      attemptIds: [..._aid],
      luiLich: luiLichOf.get(d.key) ?? null,
      cuaToi: mySkills(p, d.classId, kyNang).length > 0,
      duocCham: editableSkills(p, d.classId, kyNang).length > 0,
      hrefDayDu: d.mode === 'ielts_band'
        ? `/nhap-diem/${d.classId}${d.periodId ? `?periodId=${d.periodId}` : ''}`
        : `/nhap-diem/${d.classId}?kind=${encodeURIComponent(d.kind)}`,
    };
  });
  /* PR-UXF-a (UX-F7, U1): NHÓM THEO LỚP (`soSanhLop` — MB FT 9 trước MB FT 10); trong lớp: quá hạn trước, rồi hạn tăng dần, rồi tuần thi. */
  dong.sort((x, y) => soSanhLop({ code: x.classCode }, { code: y.classCode })
    || (Number(y.quaHan) - Number(x.quaHan)) || (x.han ?? '9999').localeCompare(y.han ?? '9999')
    || (x.weekStart ?? '').localeCompare(y.weekStart ?? ''));
  return { dong, quaHanBai, quaHanBaiKhung };
}

// ---------------------------------------------------------------- Lịch Test

export type DongLichTest = {
  key: string; dotLabel: string; kyNang: string[]; kyNangLabel: string;
  soHv: number; conBai: number;
  /** Một trong: "Đã chấm xong" · "Chưa tới hạn" · "Còn n bài" · "Quá hạn · còn n bài" (`trangThaiChamLabel`). */
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
  han: string | null; quaHan: boolean;
  nhan: { loai: LoaiNhanLop; chu: string };
  /** Tự mở khi vào trang (Q8): người có phân công — còn bài của mình; Quản lý — còn bài. */
  moSan: boolean;
  hrefDayDu: string;
  dong: DongLichTest[];
  /** PR-MT (YC-13.1, K4 §4e): số bài vắng tuần này đang chờ Quản lý duyệt dời (lần 2+) — dòng tím nhạt trong hàng lớp. */
  choDuyetDoi: number;
};
export type LichTest = {
  scopeEmpty: boolean;
  tuan: { id: number; weekStart: string; weekEnd: string } | null;
  phamVi: PhamViLichTest;
  /** Hai lựa chọn "Lớp tôi dạy / Tất cả" cho ra hai tập khác nhau → mới hiện nút (Q4). */
  coPhamViRong: boolean;
  coPhanCong: boolean;
  lopDangLoc: { id: number; code: string } | null;
  tongQuan: { daCham: number; tong: number; conPhaiCham: number; no: { bai: number; lop: number }; quaHan: number };
  /** MH4, K4-05: cùng dải số tách theo khung (công tắc Fast Track · Lớp thường); cộng hai khung = `tongQuan`. */
  tongQuanKhung: Record<Khung, LichTest['tongQuan']>;
  no: DongNo[];
  lop: LopLichTest[];
  /** PR-MT (K2-32): dòng nhắc MỜ cuối trang — MT lịch sử chưa nhập theo lớp. */
  nhacLichSu: NhacLichSu[];
};

type OiemLuu = {
  skill: string; band: number | null; raw_score: number | null;
  no_show_period_id: number | null; no_show_settled_at: string | null; no_show_late: number | null;
};

/**
 * MỘT Ô NHẬP FT ĐÃ XONG CHƯA — có điểm, hoặc dấu "-" CÒN HIỆU LỰC ở chính tuần này. Cùng luật với `skillCells`
 * (`server/src/fasttrack/attempts.ts`, nơi badge "n bài chờ chấm" và khối Nợ đọc): `noShowStateOf`, cộng hai điều kiện
 * của việc chốt — quá Chủ nhật mà chưa chốt thì buổi phải `scheduled` và mọi ô nhập của buổi đều "-"; đã chốt mà Quản lý
 * đảo trạng thái thi (không còn `absent`) thì dấu cũ không sống lại. Lệch luật này là lệch số giữa Lịch Test và badge
 * (rà #92) — phép kiểm "còn phải chấm + Nợ = badge" giữ hai nơi khớp nhau.
 */
function oFtXong(diem: OiemLuu[], nhap: string, v: { periodId: number; weekEnd: string | null; sitStatus: string; today: string }) {
  const row = diem.find((x) => x.skill === nhap);
  if (!row) return false;
  if (row.band !== null || row.raw_score !== null) return true;
  let ns = noShowStateOf({
    marked: !!row.no_show_period_id, hasScore: false, sameWeek: row.no_show_period_id === v.periodId,
    weekEnd: v.weekEnd, today: v.today, enteredAfterWeekEnd: !!row.no_show_late, lateRule: C10_NHAP_DAU_TRU_TUAN_QUA_KHU,
  }).state;
  if (!row.no_show_settled_at && ns === 'khong-du-thi') {
    const banCung = entrySkillsOf(assessedSkillOf(nhap) as AssessedSkill).filter((k) => k !== nhap).every((k) => {
      const o = diem.find((x) => x.skill === k);
      return !!o?.no_show_period_id && o.no_show_period_id === v.periodId && o.band === null && o.raw_score === null;
    });
    if (!(v.sitStatus === 'scheduled' && banCung)) ns = 'none';
  }
  if (row.no_show_settled_at && ns !== 'none') ns = v.sitStatus === 'absent' ? 'khong-du-thi' : 'none';
  return ns !== 'none';
}

const THU_TU_MON =
  `CASE ask.skill WHEN 'listening' THEN 1 WHEN 'reading' THEN 2 WHEN 'writing' THEN 3 WHEN 'speaking' THEN 4 WHEN 'tong_hop' THEN 5 ELSE 6 END`;

/**
 * "TUẦN NÀY CÓ NHỮNG LƯỢT TEST NÀO, CÒN PHẢI CHẤM GÌ" — MỘT lời gọi đủ cho màn Lịch Test (PR-UX1): hàng lớp, dải số,
 * khối Nợ tuần trước. Mọi số tính TRONG BỘ NHỚ từ hai nguồn: câu SQL dưới đây và `listAttempts` (qua `noTuanTruoc`) —
 * không hỏi theo từng lớp.
 *
 * Lọc theo TUẦN CỦA CHÍNH MÔN (`attempt_skills.planned_period_id`), không theo tuần của cả đợt: đợt tách tuần thì lọc
 * theo tuần của đợt làm biến mất đúng những bài đang phải chấm trong tuần đang xem — cùng lý do đã ghi ở
 * `classScoreSheet`. Lớp thường ghi "-" thì môn dời hẳn sang tuần sau nên tự rời tuần cũ.
 *
 * Chỉ tính lượt còn ngồi thi (`scheduled`/`sat`) — cả vào số em lẫn số bài. Một ô còn phải chấm = chưa có điểm và
 * chưa báo "-" ở CHÍNH tuần này (ô "-" tính là đã xử lý). Writing của FT có hai ô (W1, W2): xong khi cả hai có band.
 */
export function lichTest(
  p: Principal, periodId: number, branchId?: number | null, today: string = demoToday(),
  o: { phamVi?: PhamViLichTest | null; classId?: number | null } = {},
): LichTest {
  const scope0 = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
  /* PR-HSM: GV Speaking thấy thêm lớp FT cùng chi nhánh ở "Tất cả" (chấm S chéo) — chỉ màn này, không mở rộng phạm vi chung. */
  const lopS = scope0.all ? [] : lopFtChoGvSpeaking(p, today);
  const scope = lopS.length ? { ...scope0, classIds: [...new Set([...scope0.classIds, ...lopS])] } : scope0;
  const coPhanCong = defaultWorkScope(p) === 'mine';
  /* Không có phân công thì "Lớp tôi dạy" là tập rỗng — luôn xem Tất cả. */
  const phamVi: PhamViLichTest = coPhanCong ? o.phamVi ?? 'cua-toi' : 'tat-ca';
  const rong: LichTest = {
    scopeEmpty: scope.none, tuan: null, phamVi, coPhamViRong: false, coPhanCong, lopDangLoc: null,
    tongQuan: { daCham: 0, tong: 0, conPhaiCham: 0, no: { bai: 0, lop: 0 }, quaHan: 0 }, no: [], lop: [], nhacLichSu: [],
    tongQuanKhung: {
      ft: { daCham: 0, tong: 0, conPhaiCham: 0, no: { bai: 0, lop: 0 }, quaHan: 0 },
      thuong: { daCham: 0, tong: 0, conPhaiCham: 0, no: { bai: 0, lop: 0 }, quaHan: 0 },
    },
  };
  if (scope.none) return rong;
  const conn = db();
  const tuan = conn.prepare('SELECT id, week_start, week_end FROM report_periods WHERE id = ?').get(periodId) as any;
  if (!tuan) return rong;
  /* Tuần đang xem còn ở phía trước thì chưa ai nợ bài nào. */
  const chuaToiHan = String(tuan.week_start) > weekInfo(today).weekStart;

  const lopCuaToi = new Set(p.assignments.filter((a) => activeAt(a, today)).map((a) => a.classId));
  const coPhamViRong = coPhanCong && (scope.all || scope.branchIds.length > 0 || scope.classIds.some((id) => !lopCuaToi.has(id)));
  /* Chip "Đang lọc: lớp …" chỉ nói tên lớp NGƯỜI XEM ĐƯỢC THẤY — lớp ngoài phạm vi thì null, không lộ mã lớp. */
  const lopDangLoc = o.classId && (can(p, PERMISSIONS.ATTEMPT_VIEW, { classId: o.classId }) || lopS.includes(o.classId))
    ? (conn.prepare('SELECT id, code FROM classes WHERE id = ?').get(o.classId) as any) ?? null
    : null;
  const giuLop = (classId: number) =>
    (phamVi !== 'cua-toi' || lopCuaToi.has(classId)) && (!o.classId || classId === o.classId);

  const cs = classScopeSql(scope);
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
         JOIN classes c ON c.id = a.class_id
         JOIN branches b ON b.id = c.branch_id
        WHERE ${where}
        ORDER BY c.code, a.kind DESC, a.attempt_no, ${THU_TU_MON}`,
    )
    .all(...params) as any[];

  /* Điểm + dấu "-" của mọi lượt trong tuần: MỘT câu gom lô (thay các câu con lồng theo từng dòng). */
  const diemCua = new Map<number, OiemLuu[]>();
  theoLo([...new Set(rows.map((r) => r.id as number))], (lo, ph) => {
    for (const x of conn.prepare(
      `SELECT attempt_id, skill, band, raw_score, no_show_period_id, no_show_settled_at, no_show_late
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
  type LopTam = Omit<LopLichTest, 'dong' | 'nhan' | 'moSan' | 'daCham' | 'dotLabel' | 'kyNangTuan' | 'han' | 'choDuyetDoi'> & {
    dong: Map<string, DongTam>; _dot: string[]; _kn: Set<string>; _hanNo: string | null;
  };
  const byLop = new Map<string, LopTam>();
  let quaHanTuan = 0;
  const quaHanTuanKhung: Record<Khung, number> = { ft: 0, thuong: 0 };
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
    const mode: CheDo = modes.get(r.programme_code)?.scoringMode === 'ratio' ? 'ratio' : 'ielts_band';
    const khoa = mode === 'ratio' ? `${r.class_id}:${r.kind}` : String(r.class_id);
    let lop = byLop.get(khoa);
    if (!lop) {
      lop = {
        key: khoa, classId: r.class_id, classCode: r.class_code, branchName: r.branch_name, mode,
        chuongTrinh: r.programme_code ?? null,
        boMon: [...boMonLich(r.programme_code, modes.get(r.programme_code)?.skills)],
        kind: mode === 'ratio' ? r.kind : null,
        tong: 0, conBai: 0, conBaiCuaToi: 0, quaHan: false,
        hrefDayDu: mode === 'ratio'
          ? `/nhap-diem/${r.class_id}?kind=${encodeURIComponent(r.kind)}`
          : `/nhap-diem/${r.class_id}?periodId=${periodId}`,
        dong: new Map(), _dot: [], _kn: new Set(), _hanNo: null,
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
      if (r.kind !== 'mock') qs.set('kind', r.kind);
      /* Lớp FT mở lưới đúng tuần đang xem. Lớp thường kèm `kn` = môn của dòng: con trỏ đặt sẵn vào ô trống đầu tiên
         của môn đó. */
      if (mode === 'ielts_band') qs.set('periodId', String(periodId));
      else qs.set('kn', r.skill);
      const q = qs.toString();
      d = {
        key, dotLabel: dot, kyNang: [r.skill],
        kyNangLabel: tenMonNgan(r.programme_code, r.skill), soHv: 0, conBai: 0, quaHan: false,
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
    const cacO = (mode === 'ielts_band' && r.skill === 'writing' ? ['writing1', 'writing2'] : [r.skill as string])
      .map((nhap) => ({
        nhap,
        xong: mode === 'ielts_band'
          ? oFtXong(diem, nhap, { periodId, weekEnd: tuan.week_end, sitStatus: r.sit_status, today })
          : diem.some((x) => x.skill === nhap && (x.band !== null || x.raw_score !== null || x.no_show_period_id === periodId)),
      }));
    const con = cacO.filter((o) => !o.xong);
    d.soHv += 1;
    lop.tong += cacO.length;
    if (con.length) {
      d.conBai += con.length;
      lop.conBai += con.length;
      lop.conBaiCuaToi += con.filter((o) => monCuaToi(r.class_id, o.nhap)).length;
      /* Hạn theo đúng thứ tự của `viewSkill`: hạn riêng của môn → hạn riêng của đợt → hạn mặc định theo tuần môn. */
      const han = r.han_mon ?? r.han_dot ?? skillScoreDeadline(mode === 'ratio' ? 'ratio' : 'band', tuan.week_start);
      if (!lop._hanNo || han < lop._hanNo) lop._hanNo = han;
      if (!chuaToiHan && quaHanNhapDiem(han, tuan.week_start, today)) {   // PR-UXF-a Q10
        d.quaHan = true; lop.quaHan = true; quaHanTuan += con.length; quaHanTuanKhung[khungCua(lop.mode)] += con.length;
      }
    }
  }

  /* PR-UXF-a U1: lớp sắp theo `soSanhLop` (không theo chữ — "MB FT 10" không đứng trước "MB FT 9"). */
  const lop: LopLichTest[] = [...byLop.values()].sort((a, b) => soSanhLop({ code: a.classCode }, { code: b.classCode })).map(({ dong, _dot, _kn, _hanNo, ...l }) => ({
    ...l,
    dotLabel: _dot.join(', '),
    kyNangTuan: [...new Set([..._kn].map((k) => assessedSkillOf(k)))].sort(theoThuTu),
    daCham: l.tong - l.conBai,
    han: _hanNo ?? skillScoreDeadline(l.mode === 'ratio' ? 'ratio' : 'band', tuan.week_start),
    nhan: nhanLopLichTest({ conBai: l.conBai, conBaiCuaToi: l.conBaiCuaToi, chuaToiHan, coDayLop: lopCuaToi.has(l.classId) }),
    /* Tuần chưa tới thì chưa có gì để chấm — không tự mở. */
    moSan: !chuaToiHan && lopTuMo({ conBai: l.conBai, conBaiCuaToi: l.conBaiCuaToi, coPhanCong }),
    choDuyetDoi: l.mode === 'ielts_band' ? choDuyetCua.get(l.classId) ?? 0 : 0,
    dong: [...dong.values()].map(({ quaHan, ...d }) => ({
      ...d,
      trangThai: trangThaiChamLabel({ conBai: d.conBai, tong: d.soHv, quaHan, chuaToiHan }),
    })),
  }));

  /* Nợ tuần trước: cùng bộ lọc lớp với danh sách (phạm vi + lớp đang lọc). */
  const lopNo: Set<number> | null = phamVi === 'cua-toi'
    ? new Set([...lopCuaToi].filter((id) => !o.classId || id === o.classId))
    : o.classId ? new Set([o.classId]) : null;
  const no = noTuanTruoc(p, { branchId, classIds: lopNo, truocTuan: String(tuan.week_start), lopCuaToi }, today);

  const tong = lop.reduce((n, l) => n + l.tong, 0);
  const conPhaiCham = lop.reduce((n, l) => n + l.conBai, 0);
  return {
    scopeEmpty: false,
    tuan: { id: tuan.id, weekStart: tuan.week_start, weekEnd: tuan.week_end },
    phamVi, coPhamViRong, coPhanCong,
    lopDangLoc: lopDangLoc ? { id: lopDangLoc.id as number, code: lopDangLoc.code as string } : null,
    tongQuan: {
      tong, conPhaiCham, daCham: tong - conPhaiCham,
      no: { bai: no.dong.reduce((n, d) => n + d.conBai, 0), lop: new Set(no.dong.map((d) => d.classId)).size },
      quaHan: quaHanTuan + no.quaHanBai,
    },
    tongQuanKhung: Object.fromEntries((['ft', 'thuong'] as const).map((k) => {
      const l = lop.filter((x) => khungCua(x.mode) === k);
      const n = no.dong.filter((x) => khungCua(x.mode) === k);
      const t = l.reduce((s, x) => s + x.tong, 0), c = l.reduce((s, x) => s + x.conBai, 0);
      return [k, {
        tong: t, conPhaiCham: c, daCham: t - c,
        no: { bai: n.reduce((s, d) => s + d.conBai, 0), lop: new Set(n.map((d) => d.classId)).size },
        quaHan: quaHanTuanKhung[k] + no.quaHanBaiKhung[k],
      }];
    })) as Record<Khung, LichTest['tongQuan']>,
    no: no.dong,
    lop,
    nhacLichSu: mtLichSuChuaNhap(p, { classIds: lopNo ? [...lopNo] : null, branchId }),
  };
}
