/**
 * KHU VỰC TEST — ba câu hỏi ĐỌC của việc chấm điểm (spec §3.5):
 *
 *   canChamList  "tôi còn phải chấm những gì" — gom theo lớp + đợt, xếp vào Quá hạn / Tuần này / Sắp tới.
 *   lichTest     "tuần này có những lượt Test nào" — nhóm theo lớp.
 *   chamSheet    "mở bảng chấm của một lớp" — MỘT CỬA, tự chọn đúng bảng theo loại lớp.
 *
 * Module này KHÔNG có luật nghiệp vụ mới: nó gọi `listAttempts`, `classScoreSheet`, `regularSheet` và các hàm thuần ở
 * `shared/domain/chamDiem.ts`. Có nó để giao diện chỉ hỏi một nơi, và để chỗ mở bảng chấm không còn phải tự đoán lớp
 * này là FT hay lớp thường.
 */
import { notFound } from '../util.ts';
import { db } from '../db.ts';
import { demoToday } from '../demoConfig.ts';
import { can, classScopeSql, scopeFor, type Principal } from '../permissions.ts';
import {
  ATTEMPT_KIND_SHORT, PERMISSIONS, SKILL_SHORT, nhomCanCham, trangThaiChamLabel,
  type AttemptKind, type MucCanCham, type WorkScope,
} from '../../../shared/domain/index.ts';
import { classScoreSheet, conBaiCanCham, listAttempts, type MonDoiLich } from '../fasttrack/attempts.ts';
import { assessedSkillOf } from '../fasttrack/scoring.ts';
import { allProgrammes, isRatioClass, regularSheet } from '../normal/regular.ts';
import { isOverdue, skillScoreDeadline, weekInfo } from '../platform/week.ts';

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

// ---------------------------------------------------------------- Cần chấm

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
};

export type DongCanCham = {
  key: string; classId: number; classCode: string; mode: CheDo;
  kind: string; attemptNo: number | null; dotLabel: string;
  kyNang: string[]; kyNangLabel: string;
  conBai: number; soHv: number;
  /** Hạn sớm nhất trong các ô còn nợ của dòng (ISO — giao diện tự định dạng). */
  han: string | null;
  luiLich: LuiLich | null;
  /** Đã có ít nhất một ô của lớp + đợt này được chấm (trong phạm vi đang xem) → nút ghi "Chấm tiếp". */
  daBatDau: boolean;
  href: string;
};

export type NhomCanCham = { muc: MucCanCham; nhan: string; han: string | null; dong: DongCanCham[] };

export type CanChamList = {
  scopeEmpty: boolean;
  lop: { id: number; code: string } | null;
  nhom: NhomCanCham[];
  tong: number;
};

/** Tên đợt trên dòng: FT gọi MT{n}; lớp thường gọi "Giữa khoá"/"Cuối khoá" — không bao giờ gọi đợt lớp thường là MT. */
const dotLabelOf = (kind: string, attemptNo: number | null) =>
  (kind === 'mock' ? `MT${attemptNo ?? ''}` : ATTEMPT_KIND_SHORT[kind as AttemptKind] ?? kind);

/** Thứ tự môn cố định L · R · W · S (W1, W2 của FT nằm chỗ W) — dòng nào cũng đọc cùng một thứ tự. */
const THU_TU_KY_NANG = ['listening', 'reading', 'writing', 'writing1', 'writing2', 'speaking'];
const theoThuTu = (a: string, b: string) =>
  ((THU_TU_KY_NANG.indexOf(a) + 1 || 99) - (THU_TU_KY_NANG.indexOf(b) + 1 || 99));

const kyNangLabelOf = (mode: CheDo, kyNang: string[]) =>
  (mode === 'ratio' && kyNang.length >= 4 ? `${kyNang.length} môn` : kyNang.map((k) => SKILL_SHORT[k] ?? k).join(', '));

const hanSomNhat = (ds: Array<string | null | undefined>): string | null =>
  ds.filter((x): x is string => !!x).sort()[0] ?? null;

/** Chia lô cho câu `IN (...)` — SQLite giới hạn số tham số của một câu lệnh. */
function theoLo<T>(ids: T[], hoi: (lo: T[], ph: string) => void) {
  for (let i = 0; i < ids.length; i += 400) {
    const lo = ids.slice(i, i + 400);
    hoi(lo, lo.map(() => '?').join(','));
  }
}

/**
 * Dựng dòng phụ "lùi lịch" cho từng dòng Cần chấm từ các ô có bằng chứng dời. Một dòng chỉ có MỘT dòng phụ: môn lùi
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
      kyNang: x.skill, hv: [x.hv], tuTuan, sangTuan: x.sangTuan, tuTuanStart, sangTuanStart: x.sangTuanStart,
    });
  }
  return out;
}

/**
 * "TÔI CÒN PHẢI CHẤM NHỮNG GÌ" — gom theo LỚP + ĐỢT (mockup 05a2 phương án A).
 *
 * Dùng nguyên `listAttempts` với ĐÚNG luật lọc của `need: 'my_scores'` (`conBaiCanCham`): cùng một tập bài với badge ở
 * danh sách lớp và với Việc cần làm, nên ba nơi không thể lệch số. Đọc cả dòng đã chấm xong chỉ để biết lớp + đợt đó
 * đã bắt đầu chấm chưa ("Chấm" hay "Chấm tiếp"). Việc của hàm này chỉ là GOM DÒNG và XẾP MỤC theo hạn.
 */
export function canChamList(
  p: Principal,
  f: { branchId?: number | null; classId?: number | null; scope?: WorkScope | null } = {},
  today: string = demoToday(),
): CanChamList {
  const { rows, scopeEmpty } = listAttempts(p, {
    branchId: f.branchId ?? undefined, classId: f.classId ?? undefined, scope: f.scope ?? undefined,
  });
  const cheDo = new Map<number, CheDo>();
  const cheDoOf = (classId: number): CheDo => {
    if (!cheDo.has(classId)) cheDo.set(classId, isRatioClass(classId) ? 'ratio' : 'ielts_band');
    return cheDo.get(classId)!;
  };

  type ChiTiet = {
    skill: string; deadline: string | null; periodId: number | null; weekCode: string | null; weekStart: string | null;
    moved: MonDoiLich | null;
  };
  type Gom = DongCanCham & { _hs: Set<number>; _periodId: number | null };
  type Doi = {
    key: string; skill: string; hv: string; attemptId: number; moved: MonDoiLich;
    sangTuan: string | null; sangTuanStart: string | null;
  };
  const gom = new Map<string, Gom>();
  const batDau = new Set<string>();
  const doi: Doi[] = [];
  for (const a of rows as any[]) {
    if (!a.classId || a.status === 'cancelled') continue;
    const key = `${a.classId}:${a.kind}:${a.attemptNo ?? 0}`;
    if ((a.scoredInScope ?? 0) > 0) batDau.add(key);
    if (!conBaiCanCham(a)) continue;

    const chiTiet: ChiTiet[] = a.pendingDetail ?? [];
    /* Ô còn nợ có hạn SỚM NHẤT: nó đặt hạn của dòng, và tuần của nó là tuần lưới FT phải mở. */
    const som = [...chiTiet].sort((x, y) => (x.deadline ?? '9999') < (y.deadline ?? '9999') ? -1 : 1)[0] ?? null;
    const han = som?.deadline ?? null;
    let cu = gom.get(key);
    if (!cu) {
      cu = {
        key, classId: a.classId, classCode: a.classCode ?? '—', mode: cheDoOf(a.classId),
        kind: a.kind, attemptNo: a.attemptNo ?? null, dotLabel: dotLabelOf(a.kind, a.attemptNo ?? null),
        kyNang: [], kyNangLabel: '', conBai: 0, soHv: 0, han, luiLich: null, daBatDau: false, href: '',
        _hs: new Set(), _periodId: som?.periodId ?? null,
      };
      gom.set(key, cu);
    } else if (han && (!cu.han || han < cu.han)) {
      cu.han = han;
      cu._periodId = som?.periodId ?? cu._periodId;
    }
    for (const k of a.pendingSkills as string[]) if (!cu.kyNang.includes(k)) cu.kyNang.push(k);
    cu.conBai += a.pendingSkills.length;
    cu._hs.add(a.studentId);
    /* Lùi lịch CHỈ khi có bằng chứng dời thật (`moved` — dấu "-" hoặc dời do vắng), không suy từ thứ tự tuần. */
    for (const x of chiTiet) {
      if (!x.moved) continue;
      doi.push({
        key, skill: x.skill, hv: a.studentName, attemptId: a.id, moved: x.moved,
        sangTuan: x.weekCode, sangTuanStart: x.weekStart,
      });
    }
  }
  const luiLichOf = dungLuiLich(doi);

  const dong: DongCanCham[] = [...gom.values()].map((d) => {
    const { _hs, _periodId, ...rest } = d;
    rest.kyNang = [...d.kyNang].sort(theoThuTu);
    const qs = new URLSearchParams();
    if (d.kind !== 'mock') qs.set('kind', d.kind);
    /* Q12: FT mở lưới đúng tuần của ô còn nợ gấp nhất; một môn thì mở thẳng môn đó. */
    if (d.mode === 'ielts_band' && _periodId) qs.set('periodId', String(_periodId));
    if (rest.kyNang.length === 1) qs.set('kn', rest.kyNang[0]);
    const q = qs.toString();
    return {
      ...rest,
      soHv: _hs.size,
      kyNangLabel: kyNangLabelOf(d.mode, rest.kyNang),
      luiLich: luiLichOf.get(d.key) ?? null,
      daBatDau: batDau.has(d.key),
      href: `/nhap-diem/${d.classId}${q ? `?${q}` : ''}`,
    };
  });
  const cls = f.classId
    ? (db().prepare('SELECT id, code FROM classes WHERE id = ?').get(f.classId) as any) ?? null
    : null;
  return {
    scopeEmpty,
    lop: cls ? { id: cls.id as number, code: cls.code as string } : null,
    /* Ruling 3: tiêu đề mục kèm hạn sớm nhất ("Tuần này · hạn Thứ Tư 24/09 · 2"). */
    nhom: nhomCanCham(dong, { homNay: today, cuoiTuanNay: weekInfo(today).weekEnd })
      .map((n) => ({ ...n, han: hanSomNhat(n.dong.map((x) => x.han)) })),
    tong: dong.reduce((n, d) => n + d.conBai, 0),
  };
}

// ---------------------------------------------------------------- Lịch Test

export type DongLichTest = {
  key: string; dotLabel: string; kyNang: string[]; kyNangLabel: string;
  soHv: number; conBai: number;
  /** Một trong: "Đã chấm xong" · "Chưa tới hạn" · "Còn n bài" · "Quá hạn · còn n bài" (`trangThaiChamLabel`). */
  trangThai: string;
  href: string;
};
export type LopLichTest = { classId: number; classCode: string; mode: CheDo; branchName: string; dong: DongLichTest[] };
export type LichTest = { scopeEmpty: boolean; lop: LopLichTest[] };

const THU_TU_MON =
  `CASE ask.skill WHEN 'listening' THEN 1 WHEN 'reading' THEN 2 WHEN 'writing' THEN 3 WHEN 'speaking' THEN 4 ELSE 5 END`;

/**
 * "TUẦN NÀY CÓ NHỮNG LƯỢT TEST NÀO" — nhóm theo lớp (spec §3.5).
 *
 * Lọc theo TUẦN CỦA CHÍNH MÔN (`attempt_skills.planned_period_id`), không theo tuần của cả đợt: đợt tách tuần thì lọc
 * theo tuần của đợt làm biến mất đúng những bài đang phải chấm trong tuần đang xem — cùng lý do đã ghi ở
 * `classScoreSheet`. Lớp thường ghi "-" thì môn dời hẳn sang tuần sau nên tự rời tuần cũ.
 *
 * Chỉ tính lượt còn ngồi thi (`scheduled`/`sat`) — cả vào số em lẫn số bài. Một ô còn phải chấm = chưa có điểm và
 * chưa báo "-" ở CHÍNH tuần này. Writing của FT có hai ô (W1, W2): xong khi cả hai có band.
 */
export function lichTest(
  p: Principal, periodId: number, branchId?: number | null, today: string = demoToday(),
): LichTest {
  const scope = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
  if (scope.none) return { scopeEmpty: true, lop: [] };
  const conn = db();
  const tuan = conn.prepare('SELECT id, week_start FROM report_periods WHERE id = ?').get(periodId) as any;
  if (!tuan) return { scopeEmpty: false, lop: [] };
  /* Tuần đang xem còn ở phía trước thì chưa ai nợ bài nào. */
  const chuaToiHan = String(tuan.week_start) > weekInfo(today).weekStart;

  const cs = classScopeSql(scope);
  const params: unknown[] = [...cs.params, periodId];
  let where = `${cs.sql} AND a.status != 'cancelled' AND ask.required = 1 AND ask.planned_period_id = ?`;
  if (branchId) { where += ' AND c.branch_id = ?'; params.push(branchId); }
  const rows = conn
    .prepare(
      `SELECT a.id, a.kind, a.attempt_no, a.class_id, a.deadline_override AS han_dot,
              c.code AS class_code, b.name AS branch_name, c.programme_code,
              ask.skill, ask.sit_status, ask.deadline_override AS han_mon,
              (SELECT COUNT(*) FROM assessment_scores sc
                WHERE sc.attempt_id = a.id AND sc.skill = ask.skill
                  AND (sc.band IS NOT NULL OR sc.raw_score IS NOT NULL)) AS cham_don,
              (SELECT COUNT(*) FROM assessment_scores sc
                WHERE sc.attempt_id = a.id AND sc.skill IN ('writing1', 'writing2') AND sc.band IS NOT NULL) AS cham_viet,
              (SELECT COUNT(*) FROM assessment_scores sc
                WHERE sc.attempt_id = a.id
                  AND (sc.skill = ask.skill OR (ask.skill = 'writing' AND sc.skill IN ('writing1', 'writing2')))
                  AND sc.no_show_period_id = ask.planned_period_id) AS dau_tru
         FROM assessment_attempts a
         JOIN attempt_skills ask ON ask.attempt_id = a.id
         JOIN classes c ON c.id = a.class_id
         JOIN branches b ON b.id = c.branch_id
        WHERE ${where}
        ORDER BY c.code, a.kind DESC, a.attempt_no, ${THU_TU_MON}`,
    )
    .all(...params) as any[];

  const modes = allProgrammes();
  type DongTam = Omit<DongLichTest, 'trangThai'> & { quaHan: boolean };
  const byClass = new Map<number, Omit<LopLichTest, 'dong'> & { dong: Map<string, DongTam> }>();
  for (const r of rows) {
    /* Chỉ đếm lượt còn ngồi thi (chưa vắng, chưa huỷ phần thi): em vắng không làm dòng thành "Đã chấm xong". */
    if (r.sit_status !== 'scheduled' && r.sit_status !== 'sat') continue;
    const mode: CheDo = modes.get(r.programme_code)?.scoringMode === 'ratio' ? 'ratio' : 'ielts_band';
    if (!byClass.has(r.class_id)) {
      byClass.set(r.class_id, {
        classId: r.class_id, classCode: r.class_code, branchName: r.branch_name, mode, dong: new Map(),
      });
    }
    const lop = byClass.get(r.class_id)!;
    const key = `${r.kind}:${r.attempt_no ?? 0}:${r.skill}`;
    let d = lop.dong.get(key);
    if (!d) {
      const qs = new URLSearchParams();
      if (r.kind !== 'mock') qs.set('kind', r.kind);
      /* Lớp FT mở lưới đúng tuần đang xem. */
      if (mode === 'ielts_band') qs.set('periodId', String(periodId));
      const q = qs.toString();
      d = {
        key, dotLabel: dotLabelOf(r.kind, r.attempt_no ?? null), kyNang: [r.skill],
        kyNangLabel: SKILL_SHORT[r.skill] ?? r.skill, soHv: 0, conBai: 0, quaHan: false,
        href: `/nhap-diem/${r.class_id}${q ? `?${q}` : ''}`,
      };
      lop.dong.set(key, d);
    }
    d.soHv += 1;
    const daCham = mode === 'ielts_band' && r.skill === 'writing' ? r.cham_viet >= 2 : r.cham_don > 0;
    if (!daCham && !r.dau_tru) {
      d.conBai += 1;
      /* Hạn theo đúng thứ tự của `viewSkill`: hạn riêng của môn → hạn riêng của đợt → hạn mặc định theo tuần môn. */
      const han = r.han_mon ?? r.han_dot ?? skillScoreDeadline(mode === 'ratio' ? 'ratio' : 'band', tuan.week_start);
      if (!chuaToiHan && isOverdue(han, today)) d.quaHan = true;
    }
  }
  return {
    scopeEmpty: false,
    lop: [...byClass.values()].map((l) => ({
      ...l,
      dong: [...l.dong.values()].map(({ quaHan, ...d }) => ({
        ...d,
        trangThai: trangThaiChamLabel({ conBai: d.conBai, tong: d.soHv, quaHan, chuaToiHan }),
      })),
    })),
  };
}
