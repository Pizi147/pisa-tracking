import { THAM_SO_TOI_DA, chenNhieuDong, db, theoLo, tx } from '../db.ts';
import {
  PERMISSIONS, REGULAR_SKILLS, caseDedupKey, categoryOf, chuMonTruot, daiCuoiKhoa, goiYCuoiKhoa, kyHieuLop, kyNangLopDich, lichBoTro, ngay, tenMon, weeklyUpdateDue,
  type BoTroMienPhi, type GoiYCuoiKhoa,
} from '../../../shared/domain/index.ts';
import { addDays, badRequest, forbidden, isIsoDate, notFound, nowIso } from '../util.ts';
import { can, isCoreTeacherOf, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { writeAudit } from '../platform/audit.ts';
import { mondayOf } from '../platform/week.ts';
import { addMilestone } from '../cases/sos.ts';
import { dongBoTrangThaiCase } from '../cases/sosState.ts';
import { chuyenCaseSangLoTrinh } from '../cases/systemClose.ts';
import { suggestCaseOwner } from '../cases/owner.ts';
import { chotYeuCau, taoYeuCau } from '../duyet/yeuCau.ts';
import { allProgrammes, evaluateRegular } from './regular.ts';

/**
 * CUỐI KHOÁ LỚP THƯỜNG — MỘT CỬA phía máy chủ (T47, T49, §6.3). Luật thuần ở `shared/domain/cuoiKhoa.ts`; file này chỉ đọc dữ liệu
 * THEO LÔ và đưa vào luật đó, để lưới, hồ sơ HV, Hành trình, Excel, việc, màn Chuyển lớp (PR-CT) cùng ra MỘT con số % và MỘT hướng gợi ý.
 */

export type TyLeLuot = {
  /** Σ điểm / Σ tổng, CHƯA làm tròn; `null` khi chưa đủ môn. */
  tyLe: number | null; du: boolean; scored: number; required: number;
  ct: string | null; monTruot: string[]; kind: string;
  /** % từng môn (chưa làm tròn; null = chưa có điểm) — hộp Kết luận khoá ở hồ sơ HV. */
  mon: { skill: string; ratio: number | null }[];
};

/** % tổng của nhiều lượt lớp thường — 2 câu cho cả lô (lượt + điểm), mỗi lượt qua `evaluateRegular`. Lượt không phải lớp thường → không có trong kết quả. */
export function tyLeTongLo(attemptIds: readonly number[]): Map<number, TyLeLuot> {
  const out = new Map<number, TyLeLuot>();
  if (!attemptIds.length) return out;
  const conn = db();
  const luot = new Map<number, { kind: string; ct: string | null }>();
  const diem = new Map<number, any[]>();
  theoLo([...new Set(attemptIds)], (lo, ph) => {
    for (const r of conn.prepare(
      `SELECT a.id, a.kind, c.programme_code FROM assessment_attempts a LEFT JOIN classes c ON c.id = a.class_id WHERE a.id IN (${ph})`,
    ).all(...lo) as any[]) luot.set(r.id, { kind: r.kind, ct: r.programme_code ?? null });
    for (const r of conn.prepare(`SELECT attempt_id, skill, raw_score, raw_total FROM assessment_scores WHERE attempt_id IN (${ph})`).all(...lo) as any[]) {
      if (!diem.has(r.attempt_id)) diem.set(r.attempt_id, []);
      diem.get(r.attempt_id)!.push(r);
    }
  });
  const chuongTrinh = allProgrammes();
  for (const [id, l] of luot) {
    const prog = l.ct ? chuongTrinh.get(l.ct) : null;
    if (!prog || prog.scoringMode !== 'ratio') continue;
    const kq = evaluateRegular(prog.skills, diem.get(id) ?? [], prog.code);
    out.set(id, {
      tyLe: kq.tyLeTong, du: kq.complete, scored: kq.scored, required: kq.required, ct: prog.code, kind: l.kind,
      monTruot: kq.skills.filter((s) => s.outcome === 'fail').map((s) => s.skill),
      mon: kq.skills.map((s) => ({ skill: s.skill, ratio: s.ratio })),
    });
  }
  return out;
}

export type EmCuoiKhoa = {
  attemptId: number | null; tyLe: number | null; scored: number; required: number; monTruot: string[];
  mon: { skill: string; ratio: number | null }[];
  goiY: GoiYCuoiKhoa | null;
  /** Quản lý đã quyết khi thi hành chuyển lớp (`lo_trinh_tiep_theo.quyet_*`); `huong` = hướng đã ghi ở dòng đó. */
  quyetDinh: { huong: string; boiId: number; boi: string | null; luc: string } | null;
  /** T49: kết luận kỳ vọng đầu ra BE/ELE lên FT. */
  ketLuanFt: { dat: boolean | null; nguyenNhan: 'trung_tam' | 'hoc_sinh' | null; mon: string[]; ghiChu: string | null } | null;
};

const jsonMang = (s: string | null): string[] => { try { const v = JSON.parse(s ?? '[]'); return Array.isArray(v) ? v.map(String) : []; } catch { return []; } };

/** `lo_trinh_tiep_theo` → phần kết luận của một em (dùng chung cho lớp và hồ sơ). */
export function ketLuanCuaDong(r: any): Pick<EmCuoiKhoa, 'quyetDinh' | 'ketLuanFt'> {
  return {
    quyetDinh: r?.quyet_luc ? { huong: r.huong, boiId: r.quyet_boi, boi: r.quyet_ten ?? null, luc: r.quyet_luc } : null,
    ketLuanFt: r && (r.ky_vong_dat !== null || r.ky_vong_nguyen_nhan)
      ? { dat: r.ky_vong_dat === null ? null : !!r.ky_vong_dat, nguyenNhan: r.ky_vong_nguyen_nhan ?? null, mon: jsonMang(r.ky_vong_mon), ghiChu: r.ky_vong_ghi_chu ?? null }
      : null,
  };
}

/**
 * Mọi em ĐANG học lớp thường `classId` (hoặc chỉ `sids`): bài Cuối khoá mới nhất, % tổng, gợi ý hướng, quyết định, kỳ vọng đầu ra.
 * 4 câu cho cả lớp (em × bài · lượt · điểm · lộ trình tiếp theo). Hướng gợi ý KHÔNG lưu — tính lại mỗi lần đọc nên sửa điểm là đổi theo.
 */
export function cuoiKhoaTheoHocVien(classId: number, sids?: readonly number[]): Map<number, EmCuoiKhoa> {
  const out = new Map<number, EmCuoiKhoa>();
  if (sids && !sids.length) return out;
  const conn = db();
  const loc = sids ? ` AND e.student_id IN (${sids.map(() => '?').join(',')})` : '';
  const dong = conn.prepare(
    `SELECT e.student_id, a.id AS attempt_id FROM enrollments e
       LEFT JOIN assessment_attempts a ON a.student_id = e.student_id AND a.class_id = e.class_id AND a.kind = 'final' AND a.status != 'cancelled'
      WHERE e.class_id = ? AND e.status = 'active'${loc} ORDER BY a.id`,
  ).all(classId, ...(sids ?? [])) as any[];
  const luotCuaEm = new Map<number, number | null>();
  for (const r of dong) luotCuaEm.set(r.student_id, r.attempt_id ?? luotCuaEm.get(r.student_id) ?? null);   // nhiều bài Cuối khoá → bài id lớn nhất
  const tyLe = tyLeTongLo([...luotCuaEm.values()].filter((x): x is number => x !== null));
  const dinhKem = new Map<number, any>();
  for (const r of conn.prepare(
    `SELECT lt.*, u.full_name AS quyet_ten FROM lo_trinh_tiep_theo lt LEFT JOIN users u ON u.id = lt.quyet_boi WHERE lt.class_id = ?`,
  ).all(classId) as any[]) dinhKem.set(r.student_id, r);
  for (const [sid, attemptId] of luotCuaEm) {
    const t = attemptId ? tyLe.get(attemptId) : undefined;
    out.set(sid, {
      attemptId, tyLe: t?.tyLe ?? null, scored: t?.scored ?? 0, required: t?.required ?? 0, monTruot: t?.monTruot ?? [], mon: t?.mon ?? [],
      goiY: t ? goiYCuoiKhoa({ ct: t.ct, tyLe: t.tyLe, monTruot: t.monTruot }) : null,
      ...ketLuanCuaDong(dinhKem.get(sid)),
    });
  }
  return out;
}

// ==================================================================== Sau khi chuyển lớp (T70, M-01, M-21, K2-28, K5-61)

/** Một em vừa được chuyển ở `apDungCaLop` / `apDungMotDong`. Chỉ hướng lên / học lại — bảo lưu, dừng học không đi qua đây. */
export type DongSauChuyen = {
  sid: number; fromClassId: number; toClassId: number; toFt: boolean;
  huong: 'len_lop' | 'fast_track' | 'hoc_lai'; ngay: string;
};

const CHU_BO_TRO = (n: number, tuan: number, ten: string | null) =>
  `${n} buổi miễn phí${ten ? ` (${ten})` : ''} · ${tuan} tuần · Mini Test sau buổi cuối · không tính phí học sinh, không tính lương giáo viên`;
const MO_TA_TUTOR = 'Tutor 10 buổi/kỹ năng · tính vào buổi Free, có lương GV';

/** Case `chuyen_cap` mở ở lộ trình mới cho (em, hạng mục) — dùng Case đang mở nếu có (khoá chống trùng, M-01). Trả id + `moi`. */
function moCaseChuyenCap(conn: any, x: {
  sid: number; cycleId: number; category: string; topic: string; attemptId: number | null; ngay: string; title: string; ownerId: number | null;
}): { id: number; moi: boolean } {
  const khoa = caseDedupKey({ category: x.category as any, studentId: x.sid, cycleId: x.cycleId })!;
  const co = conn.prepare('SELECT id, status FROM sos_cases WHERE dedup_key = ?').get(khoa) as any;
  if (co && co.status !== 'done') return { id: co.id, moi: false };
  if (co) conn.prepare('UPDATE sos_cases SET dedup_key = NULL, updated_at = ? WHERE id = ?').run(nowIso(), co.id);
  const info = conn.prepare(
    `INSERT INTO sos_cases (attempt_id, student_id, cycle_id, topic, category, origin_kind, detected_at, sos_level, status, dedup_key, title, previous_case_id, owner_user_id, created_at)
     VALUES (?,?,?,?,?, 'chuyen_cap', ?, NULL, 'in_progress', ?, ?, ?, ?, ?)`,
  ).run(x.attemptId, x.sid, x.cycleId, x.topic, x.category, x.ngay, khoa, x.title, co?.id ?? null, x.ownerId, nowIso());
  return { id: Number(info.lastInsertRowid), moi: true };
}

/** T49: Case FT "Kỳ vọng đầu ra chưa đạt · {kỹ năng}" + PA Tutor 10 buổi (`preset 0` — GV kết thúc khi xong, Q8). Idempotent theo khoá chống trùng. Trả số Case mới. */
function taoCaseTutorFt(conn: any, p: Principal, x: { sid: number; ftCycleId: number; ftClassId: number; mon: readonly string[]; ngay: string }): number {
  let moi = 0;
  for (const m of x.mon) {
    const skill = kyNangLopDich(m, true);
    const category = categoryOf(skill) ?? skill;
    const ownerId = suggestCaseOwner({ classId: x.ftClassId, category });
    const c = moCaseChuyenCap(conn, {
      sid: x.sid, cycleId: x.ftCycleId, category, topic: skill, attemptId: null, ngay: x.ngay,
      title: `Kỳ vọng đầu ra chưa đạt · ${tenMon(null, skill)}`, ownerId,
    });
    if (!c.moi) continue;
    moi += 1;
    conn.prepare(
      `INSERT INTO case_interventions (case_id, kind, description, performer_user_id, recorded_by, status, started_date, needs_approval, preset, confirmed_by, confirmed_at,
                                       cycle_no, cycle_started_on, action_due, created_at)
       VALUES (?, 'tutor', ?, ?, ?, 'started', ?, 0, 0, ?, ?, 1, ?, ?, ?)`,
    ).run(c.id, MO_TA_TUTOR, ownerId, p.userId, x.ngay, p.userId, nowIso(), x.ngay, weeklyUpdateDue(x.ngay), nowIso());
    addMilestone({ caseId: c.id, kind: 'opened', occurredOn: x.ngay, note: 'Kỳ vọng đầu ra chưa đạt (Trung tâm) — Tutor 10 buổi', createdBy: p.userId, dedupKey: `ky-vong:${c.id}` });
    dongBoTrangThaiCase(c.id);
  }
  return moi;
}

/**
 * CHẠY TRONG tx của nơi chuyển, SAU khi mở lộ trình mới (và sau `closeCasesOnProgrammeSwitch` nếu sang FT).
 * Thứ tự (Hướng dẫn 1b): (1) lớp thường → lớp thường: Case đang mở đi theo em sang lộ trình mới TRƯỚC khi tạo Case Cuối khoá, để khoá chống trùng gắn PA
 * vào Case Giữa khoá cùng môn (M-01); (2) lên: Case Cuối khoá + PA Bổ trợ miễn phí + một Mini Test; (3) học lại: Báo PH qua TVV cho Quản lý;
 * (4) sang FT có kết luận "Trung tâm": Case Tutor. Em CHƯA đủ điểm Cuối khoá vẫn chuyển (Q30-4) — phần (2)(3) chờ điểm (`capNhatCuoiKhoaSauChuyen`).
 */
export function sauChuyenCuoiKhoa(p: Principal, dongs: readonly DongSauChuyen[]): void {
  if (!dongs.length) return;
  const conn = db();
  const sids = dongs.map((d) => d.sid);

  /* Lộ trình mới (đang chạy) và lộ trình liền trước của từng em — MỘT câu. */
  const moi = new Map<number, number>(), cu = new Map<number, number>();
  theoLo(sids, (lo, ph) => {
    for (const r of conn.prepare(`SELECT id, student_id, status FROM learning_cycles WHERE student_id IN (${ph}) ORDER BY seq`).all(...lo) as any[]) {
      if (r.status === 'active') moi.set(r.student_id, r.id);
      else if (!moi.has(r.student_id)) cu.set(r.student_id, r.id);
    }
  });
  /* (1) Case đang mở đi theo em sang lộ trình lớp thường mới. */
  for (const d of dongs) {
    if (d.toFt || !moi.has(d.sid) || !cu.has(d.sid)) continue;
    chuyenCaseSangLoTrinh(p.userId, d.sid, cu.get(d.sid)!, moi.get(d.sid)!, null, d.ngay);
  }

  /* Bài Cuối khoá của từng em ở lớp nguồn + % (2 câu cho cả lô). */
  const theoLop = new Map<number, number[]>();
  for (const d of dongs) theoLop.set(d.fromClassId, [...(theoLop.get(d.fromClassId) ?? []), d.sid]);
  const luotCua = new Map<number, { id: number; attemptNo: number }>();
  const kyVong = new Map<number, any>();
  for (const [lop, ds] of theoLop) {
    theoLo(ds, (lo, ph) => {
      for (const r of conn.prepare(
        `SELECT id, student_id, attempt_no FROM assessment_attempts WHERE class_id = ? AND kind = 'final' AND status != 'cancelled' AND student_id IN (${ph}) ORDER BY id`,
      ).all(lop, ...lo) as any[]) luotCua.set(r.student_id, { id: r.id, attemptNo: r.attempt_no });
      for (const r of conn.prepare(`SELECT * FROM lo_trinh_tiep_theo WHERE class_id = ? AND student_id IN (${ph})`).all(lop, ...lo) as any[]) kyVong.set(r.student_id, r);
    });
  }
  const tyLe = tyLeTongLo([...luotCua.values()].map((l) => l.id));
  /* Tuần khai giảng lớp đích (Q4): PA bổ trợ bắt đầu ở thứ Hai sau ngày chuyển, không sớm hơn tuần khai giảng. */
  const khaiGiang = new Map<number, string | null>();
  theoLo([...new Set(dongs.map((d) => d.toClassId))], (lo, ph) => {
    for (const r of conn.prepare(`SELECT c.id, rp.week_start FROM classes c LEFT JOIN report_periods rp ON rp.id = c.start_period_id WHERE c.id IN (${ph})`).all(...lo) as any[]) khaiGiang.set(r.id, r.week_start ?? null);
  });

  /* Pha 1 — tính thuần: mỗi em → các "ô" (em × môn) cần Case + PA bổ trợ. Đọc một lần: Mini Test đã có · GVCN lớp đích. */
  const daCoMt = new Set<string>();
  theoLo([...new Set([...luotCua.values()].map((l) => l.id))], (lo, ph) => {
    for (const r of conn.prepare(`SELECT student_id, tu_attempt_id FROM mini_test WHERE tu_attempt_id IN (${ph})`).all(...lo) as any[]) daCoMt.add(`${r.student_id}:${r.tu_attempt_id}`);
  });
  const chuNhiem = new Map<number, number[]>();
  theoLo([...new Set(dongs.map((d) => d.toClassId))], (lo, ph) => {
    for (const r of conn.prepare(`SELECT DISTINCT class_id, user_id FROM teacher_assignments WHERE class_id IN (${ph}) AND is_core = 1 AND status = 'active'`).all(...lo) as any[]) {
      chuNhiem.set(r.class_id, [...(chuNhiem.get(r.class_id) ?? []), r.user_id]);
    }
  });
  const chuCase = new Map<string, number | null>();
  const nguoiPhuTrach = (classId: number, category: string) => {
    const k = `${classId}:${category}`;
    if (!chuCase.has(k)) chuCase.set(k, suggestCaseOwner({ classId, category }));
    return chuCase.get(k)!;
  };
  type O = { d: DongSauChuyen; toCycle: number; luot: { id: number; attemptNo: number }; ct: string; mon: string; skill: string; category: string; b: BoTroMienPhi; batDau: string; lich: { ngayMiniTest: string; hanMiniTest: string }; phanTram: number };
  const o: O[] = [];
  const mtRows: unknown[][] = [], nhatKy: unknown[][] = [], thongBao: unknown[][] = [], baoPh = new Map<number, number>();
  const emCoBoTro: number[] = [];
  for (const d of dongs) {
    const luot = luotCua.get(d.sid), t = luot ? tyLe.get(luot.id) : undefined, toCycle = moi.get(d.sid);
    if (!luot || !t || t.tyLe === null || !toCycle) continue;   // chưa đủ điểm (Q30-4) hoặc không thuộc lớp thường — điểm nhập sau áp ở `capNhatCuoiKhoaSauChuyen`
    const goiY = goiYCuoiKhoa({ ct: t.ct, tyLe: t.tyLe, monTruot: t.monTruot });
    if (!goiY) continue;
    const phanTram = Math.round(t.tyLe * 100);
    /* (2) lên + có bổ trợ (60–69%, hoặc 50–59% Quản lý cho lên). Đã có Mini Test cho bài này thì không tạo lại. */
    if ((d.huong === 'len_lop' || d.huong === 'fast_track') && goiY.boTroNeuLen && !daCoMt.has(`${d.sid}:${luot.id}`)) {
      const b = goiY.boTroNeuLen;
      const monDay = mondayOf(d.ngay) === d.ngay ? d.ngay : mondayOf(addDays(d.ngay, 7));
      const kg = khaiGiang.get(d.toClassId);
      const batDau = kg && kg > monDay ? kg : monDay;
      const lich = lichBoTro({ batDau, soTuan: b.soTuan });
      for (const mon of b.mon) {
        const skill = kyNangLopDich(mon, d.toFt);
        o.push({ d, toCycle, luot, ct: t.ct!, mon, skill, category: categoryOf(skill) ?? skill, b, batDau, lich, phanTram });
      }
      mtRows.push([d.sid, toCycle, luot.id, `mt:${luot.id}`, b.soBuoi, lich.ngayMiniTest, lich.hanMiniTest]);
      nhatKy.push([d.sid, toCycle, 'intervention', d.ngay, `Cuối khoá ${phanTram}% — bổ trợ miễn phí ${b.soBuoi} buổi · Mini Test hạn ${ngay(lich.hanMiniTest, d.ngay)}`, p.userId, nowIso()]);
      for (const g of chuNhiem.get(d.toClassId) ?? []) {
        thongBao.push([g, 'sos', 'Mang theo PA Bổ trợ miễn phí', `Cuối khoá ${phanTram}% — Mini Test hạn ${ngay(lich.hanMiniTest, d.ngay)}.`, 'student', d.sid, `bo-tro-mien-phi:${luot.id}:${g}`, nowIso(), null]);
      }
      emCoBoTro.push(d.sid);
    }
    /* (3) học lại → Quản lý báo PH qua TVV (< 50%, hoặc 50–59% Quản lý quyết học lại — Q6). */
    if (d.huong === 'hoc_lai' && (goiY.baoPhTvv || goiY.dai === '50_59')) baoPh.set(luot.id, d.sid);
    /* (4) sang FT có kết luận "Trung tâm" (hiếm — đi từng em). */
    const kv = kyVong.get(d.sid);
    if (d.toFt && kv?.ky_vong_dat === 0 && kv.ky_vong_nguyen_nhan === 'trung_tam') {
      taoCaseTutorFt(conn, p, { sid: d.sid, ftCycleId: toCycle, ftClassId: d.toClassId, mon: jsonMang(kv.ky_vong_mon), ngay: d.ngay });
    }
  }

  /* Pha 2 — Case: tìm Case đang mở theo khoá chống trùng MỘT lần; chưa có thì tạo (mỗi Case một câu — cần id). */
  const khoaCua = (x: O) => caseDedupKey({ category: x.category as any, studentId: x.d.sid, cycleId: x.toCycle })!;
  const coSan = new Map<string, { id: number; status: string }>();
  theoLo(o.map(khoaCua), (lo, ph) => {
    for (const r of conn.prepare(`SELECT id, status, dedup_key FROM sos_cases WHERE dedup_key IN (${ph})`).all(...lo) as any[]) coSan.set(r.dedup_key, { id: r.id, status: r.status });
  });
  const mocRows: unknown[][] = [], paRows: unknown[][] = [], canDongBo: number[] = [];
  /* Case mới: MỘT câu INSERT nhiều dòng … RETURNING (lô theo trần tham số), không mỗi Case một câu. */
  const caseMoi = o.filter((x) => { const co = coSan.get(khoaCua(x)); return !co || co.status === 'done'; });
  for (const x of caseMoi) {
    const co = coSan.get(khoaCua(x));
    if (co) conn.prepare('UPDATE sos_cases SET dedup_key = NULL, updated_at = ? WHERE id = ?').run(nowIso(), co.id);   // Case cũ đã đóng nhả khoá (hiếm)
  }
  const COT_CASE = 13;
  theoLo(caseMoi, (lo) => {
    /* `attempt_id` NULL: quyền xem/ghi Case theo LỚP ĐANG HỌC của em (không theo lớp cũ của bài Cuối khoá); bài gốc ở mốc `opened` + `mini_test.tu_attempt_id`. */
    const rows = lo.map((x) => [null, x.d.sid, x.toCycle, x.skill, x.category, x.d.ngay, khoaCua(x),
      `Cuối khoá ${kyHieuLop(x.ct, null) ?? x.ct} · ${tenMon(x.ct, x.mon)} không đạt`, coSan.get(khoaCua(x))?.id ?? null, nguoiPhuTrach(x.d.toClassId, x.category), nowIso(), 'chuyen_cap', 'in_progress']);
    for (const r of conn.prepare(
      `INSERT INTO sos_cases (attempt_id, student_id, cycle_id, topic, category, detected_at, dedup_key, title, previous_case_id, owner_user_id, created_at, origin_kind, status)
       VALUES ${rows.map(() => `(${Array(COT_CASE).fill('?').join(',')})`).join(',')} RETURNING id, dedup_key`,
    ).all(...rows.flat()) as any[]) coSan.set(r.dedup_key, { id: r.id, status: 'in_progress' });
  }, Math.floor(THAM_SO_TOI_DA / COT_CASE));
  const daMo = new Set<string>();
  for (const x of o) {
    const khoa = khoaCua(x);
    const co = coSan.get(khoa)!;
    const caseId = co.id;
    const laMoi = caseMoi.includes(x);
    if (laMoi) mocRows.push([caseId, 'opened', x.luot.id, x.luot.attemptNo, x.d.ngay, `Cuối khoá ${x.phanTram}% — bổ trợ miễn phí`, p.userId, nowIso(), `cuoi-khoa:${x.luot.id}:${caseId}`]);
    else if (!daMo.has(khoa)) { canDongBo.push(caseId); daMo.add(khoa); }
    const ownerId = nguoiPhuTrach(x.d.toClassId, x.category);
    paRows.push([caseId, 'bo_tro_mien_phi', CHU_BO_TRO(x.b.soBuoi, x.b.soTuan, x.b.theoMon ? chuMonTruot(x.ct, x.b.mon) : null), ownerId, p.userId, 'started', x.batDau, 0, 1, p.userId, nowIso(),
      1, x.batDau, weeklyUpdateDue(x.batDau), x.lich.ngayMiniTest, 'mini_test', `mt:${x.luot.id}`, nowIso()]);
  }
  for (const id of canDongBo) dongBoTrangThaiCase(id);   // Case cũ đi theo em (Giữa khoá) nhận PA mới — có thể đổi trạng thái

  /* Pha 3 — ghi theo lô. */
  chenNhieuDong('INSERT OR IGNORE INTO case_milestones (case_id, kind, attempt_id, attempt_no, occurred_on, note, created_by, created_at, dedup_key)', mocRows);
  chenNhieuDong(`INSERT INTO case_interventions (case_id, kind, description, performer_user_id, recorded_by, status, started_date, needs_approval, preset, confirmed_by, confirmed_at,
                                           cycle_no, cycle_started_on, action_due, followup_due, moc_quy_che, nhom_bo_tro, created_at)`, paRows);
  chenNhieuDong('INSERT OR IGNORE INTO mini_test (student_id, cycle_id, tu_attempt_id, nhom_bo_tro, so_buoi, ngay_du_kien, han)', mtRows);
  chenNhieuDong('INSERT INTO notifications (user_id, kind, title, body, entity_type, entity_id, dedup_key, created_at, duong)', thongBao,
    ' ON CONFLICT(user_id, dedup_key) DO UPDATE SET title = excluded.title, body = excluded.body');
  chenNhieuDong('INSERT INTO journey_events (student_id, cycle_id, event_type, event_date, title, created_by, created_at)', nhatKy);
  if (baoPh.size) {
    const co = new Set<number>();
    theoLo([...baoPh.keys()], (lo, ph) => {
      for (const r of conn.prepare(`SELECT attempt_id FROM sos_coordination_actions WHERE kind = 'bao_ph_tvv' AND attempt_id IN (${ph})`).all(...lo) as any[]) co.add(r.attempt_id);
    });
    chenNhieuDong('INSERT INTO sos_coordination_actions (attempt_id, student_id, kind, custom_name, preset, status, created_at)',
      [...baoPh].filter(([attemptId]) => !co.has(attemptId)).map(([attemptId, sid]) => [attemptId, sid, 'bao_ph_tvv', null, 1, 'pending', nowIso()]));
  }
  if (emCoBoTro.length) {
    writeAudit({ actorUserId: p.userId, action: 'cuoi_khoa.bo_tro_tao', entityType: 'class', entityId: dongs[0].fromClassId, after: { hocVien: emCoBoTro, soPa: paRows.length, soCaseMoi: mocRows.length } });
  }
}

/**
 * Q30-4: điểm Cuối khoá nhập ĐỦ sau khi em đã chuyển đi — áp luật ở lộ trình MỚI của em (PA bổ trợ, Mini Test, Báo PH). Gọi cuối `refreshRegularOutcome`.
 * Hướng suy từ nơi em đang học: FT → sang FT · cùng chương trình → học lại · còn lại → lên. Chạy lặp không sinh trùng (Mini Test UNIQUE, Case theo khoá).
 */
export function capNhatCuoiKhoaSauChuyen(p: Principal, a: { id: number; student_id: number; class_id: number | null }): void {
  if (!a.class_id) return;
  const conn = db();
  if (conn.prepare(`SELECT 1 FROM enrollments WHERE student_id = ? AND class_id = ? AND status = 'active'`).get(a.student_id, a.class_id)) return;   // còn học lớp này — việc của lúc chuyển
  if (!conn.prepare(`SELECT 1 FROM enrollments WHERE student_id = ? AND class_id = ? AND status = 'transferred'`).get(a.student_id, a.class_id)) return;
  const dang = conn.prepare(
    `SELECT e.class_id, e.started_at, c.is_fast_track, c.programme_code FROM enrollments e JOIN classes c ON c.id = e.class_id
      WHERE e.student_id = ? AND e.status = 'active' ORDER BY e.id DESC LIMIT 1`,
  ).get(a.student_id) as any;
  const tu = conn.prepare('SELECT programme_code FROM classes WHERE id = ?').get(a.class_id) as any;
  if (!dang) return;
  const huong = dang.is_fast_track ? 'fast_track' : dang.programme_code === tu?.programme_code ? 'hoc_lai' : 'len_lop';
  sauChuyenCuoiKhoa(p, [{ sid: a.student_id, fromClassId: a.class_id, toClassId: dang.class_id, toFt: !!dang.is_fast_track, huong, ngay: dang.started_at ?? demoToday() }]);
}

// ==================================================================== Mini Test (§6.3, T47, T61, M-05, K1-41)

const NGUONG_MINI_TEST = 0.7;   // = RATIO_PASS_THRESHOLD — Mini Test ≥ 70% là đạt

/** Kiểm đầu vào Mini Test: 0–100 (lưu 0–1), ngày ≤ hôm nay và không trước `ngày dự kiến − 14`. */
export function kiemMiniTest(mt: { ngay_du_kien: string }, x: { tyLe?: unknown; ngay?: unknown }): { tyLe: number; ngay: string } {
  const pt = typeof x.tyLe === 'string' && x.tyLe.trim() !== '' ? Number(x.tyLe.replace(',', '.')) : x.tyLe;
  if (typeof pt !== 'number' || !Number.isFinite(pt) || pt < 0 || pt > 100) throw badRequest('Mini Test (%) phải là số từ 0 đến 100.');
  if (!isIsoDate(x.ngay)) throw badRequest('Ngày làm Mini Test không hợp lệ.');
  if (x.ngay > demoToday()) throw badRequest('Không ghi được ngày làm Mini Test ở tương lai.');
  if (x.ngay < addDays(mt.ngay_du_kien, -14)) throw badRequest('Ngày làm Mini Test quá xa so với ngày dự kiến.');
  return { tyLe: pt / 100, ngay: x.ngay };
}

/** Hoàn thành Case bằng hệ thống (Mini Test ≥ 70%): chỉ khi MỌI PA của Case đã khép. Trả true nếu đã đóng. */
function hoanThanhCaseMiniTest(conn: any, caseId: number, p: Principal, ghiChu: string, ngayDong: string): boolean {
  const con = conn.prepare(`SELECT 1 FROM case_interventions WHERE case_id = ? AND status IN ('planned', 'started')`).get(caseId);
  if (con) return false;
  conn.prepare(
    `UPDATE sos_cases SET outcome = 'improved', outcome_note = ?, outcome_decision = 'end', outcome_by = ?, outcome_at = ?, status = 'done', closed_by = ?, closed_at = ?,
            disposition = COALESCE(disposition, 'action'), updated_at = ? WHERE id = ? AND status != 'done'`,
  ).run(ghiChu, p.userId, nowIso(), p.userId, ngayDong, nowIso(), caseId);
  addMilestone({ caseId, kind: 'closed', occurredOn: ngayDong, note: `Tiến bộ — ${ghiChu}`, createdBy: p.userId, dedupKey: `outcome:${caseId}:${ngayDong}:end` });
  return true;
}

/**
 * GHI MINI TEST — MỘT hàm cho mọi đường (K1-41). Chạy TRONG tx của nơi gọi (`updateResult` lần ghi cuối, hoặc `ghiMiniTest`).
 * ≥ 70% → mọi Case của nhóm tự Hoàn thành (Q5). < 70% → Case để mở + thẻ Báo lên cho Quản lý (thông báo do `taoYeuCau`). Trả `dat`.
 */
export function ghiMiniTestTrongTx(conn: any, p: Principal, mt: any, x: { tyLe: number; ngay: string }): { dat: boolean } {
  conn.prepare('UPDATE mini_test SET ty_le = ?, ngay_lam = ?, ghi_boi = ?, ghi_luc = ? WHERE id = ?').run(x.tyLe, x.ngay, p.userId, nowIso(), mt.id);
  const dat = x.tyLe >= NGUONG_MINI_TEST;
  const cases = (conn.prepare(
    `SELECT DISTINCT sc.id FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id WHERE iv.nhom_bo_tro = ? AND sc.status != 'done'`,
  ).all(mt.nhom_bo_tro) as any[]).map((r) => r.id as number);
  const phanTram = Math.round(x.tyLe * 100);
  if (dat) {
    for (const id of cases) hoanThanhCaseMiniTest(conn, id, p, `Mini Test ${phanTram}% ≥ 70%`, x.ngay);
    chotYeuCau(conn, { loai: 'bao_len_mini_test', doiTuongLoai: 'mini_test', doiTuongId: mt.id }, 'tu_dong', { lyDo: 'Mini Test đã đạt' });
  } else if (cases.length) {
    const chu = conn.prepare(
      `SELECT iv.performer_user_id p FROM case_interventions iv WHERE iv.nhom_bo_tro = ? AND iv.performer_user_id IS NOT NULL ORDER BY iv.id LIMIT 1`,
    ).get(mt.nhom_bo_tro) as any;
    const lopId = (conn.prepare(`SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1`).get(mt.student_id) as any)?.class_id ?? null;
    const lyDo = `Mini Test ${phanTram}% chưa đạt (cần từ 70%) — Quản lý xử lý từng trường hợp`;
    taoYeuCau(conn, {
      loai: 'bao_len_mini_test', doiTuongLoai: 'mini_test', doiTuongId: mt.id, hocVienId: mt.student_id, lopId, nguoiXin: null, hanDuyet: null, lyDo,
      duLieu: { viecKey: `mini_test:${mt.id}`, ownerId: chu?.p ?? null, lyDo, tyLe: x.tyLe },
    });
  }
  writeAudit({ actorUserId: p.userId, action: 'cuoi_khoa.mini_test', entityType: 'student', entityId: mt.student_id, after: { miniTestId: mt.id, tyLe: x.tyLe, ngay: x.ngay, dat } });
  return { dat };
}

/**
 * Ghi / sửa Mini Test ngoài form "Ghi kết quả cuối" (đường hồ sơ HV). Ghi lần đầu: người dạy của nhóm · GVCN lớp đang học · QL — PA còn mở của nhóm
 * được khép (`het_moc`). SỬA Mini Test đã ghi: CHỈ Quản lý (`request.approve`), có lý do ≥ 8 ký tự; Case đã đóng giữ nguyên (Q12).
 */
export function ghiMiniTest(p: Principal, miniTestId: number, input: { tyLe?: unknown; ngay?: unknown; lyDo?: unknown }) {
  const conn = db();
  const mt = conn.prepare('SELECT * FROM mini_test WHERE id = ?').get(miniTestId) as any;
  if (!mt) throw notFound('Không tìm thấy Mini Test.');
  const daGhi = mt.ty_le !== null;
  const lopHienTai = (conn.prepare(`SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1`).get(mt.student_id) as any)?.class_id ?? null;
  const la_ql = can(p, PERMISSIONS.REQUEST_APPROVE, { studentId: mt.student_id, classId: lopHienTai ?? undefined });
  const nguoiDay = conn.prepare(`SELECT 1 FROM case_interventions WHERE nhom_bo_tro = ? AND performer_user_id = ? LIMIT 1`).get(mt.nhom_bo_tro, p.userId);
  const gvcn = lopHienTai ? isCoreTeacherOf(p, lopHienTai) : false;
  if (daGhi && !la_ql) throw forbidden('Chỉ Quản lý mới sửa được Mini Test đã ghi.');
  if (!daGhi && !la_ql && !nguoiDay && !gvcn) throw forbidden('Bạn không có quyền ghi Mini Test của học viên này.');
  const v = kiemMiniTest(mt, input);
  const lyDo = String(input.lyDo ?? '').trim();
  if (daGhi && lyDo.length < 8) throw badRequest('Sửa Mini Test đã ghi thì phải ghi lý do, ít nhất 8 ký tự.');
  return tx(() => {
    if (!daGhi) {
      conn.prepare(
        `UPDATE case_interventions SET status = 'completed', completed_date = ?, closed_reason = 'het_moc', started_date = COALESCE(started_date, cycle_started_on, ?), updated_at = ?
          WHERE nhom_bo_tro = ? AND kind = 'bo_tro_mien_phi' AND status IN ('planned', 'started')`,
      ).run(v.ngay, v.ngay, nowIso(), mt.nhom_bo_tro);
    }
    const kq = ghiMiniTestTrongTx(conn, p, mt, v);
    if (daGhi) writeAudit({ actorUserId: p.userId, action: 'cuoi_khoa.mini_test', entityType: 'student', entityId: mt.student_id, entityLabel: 'Sửa Mini Test', before: { tyLe: mt.ty_le, ngay: mt.ngay_lam }, after: { tyLe: v.tyLe, ngay: v.ngay, lyDo } });
    return { id: mt.id, tyLe: v.tyLe, ngay: v.ngay, dat: kq.dat };
  });
}

/** Mini Test của các em (theo lộ trình mới), MỘT câu — cho hồ sơ HV, việc, Excel. */
export function miniTestCuaHocVien(sids: readonly number[]): Map<number, { id: number; cycleId: number; nhom: string; soBuoi: number; ngayDuKien: string; han: string; tyLe: number | null; ngayLam: number | string | null }> {
  const out = new Map<number, any>();
  theoLo([...sids], (lo, ph) => {
    for (const r of db().prepare(`SELECT * FROM mini_test WHERE student_id IN (${ph}) ORDER BY id`).all(...lo) as any[]) {
      out.set(r.student_id, { id: r.id, cycleId: r.cycle_id, nhom: r.nhom_bo_tro, soBuoi: r.so_buoi, ngayDuKien: r.ngay_du_kien, han: r.han, tyLe: r.ty_le, ngayLam: r.ngay_lam });
    }
  });
  return out;
}

// ==================================================================== Kết luận lên FT (T49, §6.4)

/**
 * QL đánh dấu Đạt / Không đạt kỳ vọng đầu ra của em BE/ELE lên FT (BE IELTS 4.0 · ELE 4.5–5.0). CHỈ `request.approve` trong phạm vi chi nhánh của em.
 * Ghi ở `lo_trinh_tiep_theo` (em × lớp BE/ELE cũ) — đánh dấu được cả SAU khi đã sang FT; lúc đó `trung_tam` tạo Case Tutor NGAY. Đổi từ `trung_tam`
 * sang khác sau khi đã tạo → KHÔNG xoá Case (GV tự xử lý) — `luuY` nói rõ.
 */
export function ghiKetLuanFt(p: Principal, sid: number, input: { dat?: unknown; nguyenNhan?: unknown; mon?: unknown; ghiChu?: unknown }) {
  const conn = db();
  if (!conn.prepare('SELECT 1 FROM students WHERE id = ?').get(sid)) throw notFound('Không tìm thấy học viên.');
  if (!can(p, PERMISSIONS.REQUEST_APPROVE, { studentId: sid })) throw forbidden('Chỉ Quản lý mới đánh dấu được kỳ vọng đầu ra.');
  const cur = conn.prepare(
    `SELECT e.class_id, c.programme_code, c.is_fast_track FROM enrollments e JOIN classes c ON c.id = e.class_id WHERE e.student_id = ? AND e.status = 'active' ORDER BY e.id DESC LIMIT 1`,
  ).get(sid) as any;
  let lopBeEle: number | null = null, ftCycle: number | null = null, ftClass: number | null = null;
  if (cur && !cur.is_fast_track && (cur.programme_code === 'BE' || cur.programme_code === 'ELE')) lopBeEle = cur.class_id;
  else if (cur?.is_fast_track) {
    const lt = conn.prepare(
      `SELECT lt.class_id FROM lo_trinh_tiep_theo lt JOIN classes c ON c.id = lt.class_id
        WHERE lt.student_id = ? AND lt.huong = 'fast_track' AND lt.da_ap_dung_luc IS NOT NULL AND c.programme_code IN ('BE', 'ELE') ORDER BY lt.da_ap_dung_luc DESC, lt.id DESC LIMIT 1`,
    ).get(sid) as any;
    if (lt) {
      lopBeEle = lt.class_id; ftClass = cur.class_id;
      ftCycle = (conn.prepare(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1`).get(sid) as any)?.id ?? null;
    }
  }
  if (!lopBeEle) throw badRequest('Chỉ lớp BE/ELE (hoặc em vừa lên Fast Track từ BE/ELE) mới có kỳ vọng đầu ra.');
  if (typeof input.dat !== 'boolean') throw badRequest('Chọn Đạt hoặc Không đạt kỳ vọng đầu ra.');
  const dat = input.dat;
  let nguyenNhan: string | null = null, mon: string[] = [], ghiChu: string | null = null;
  if (!dat) {
    if (input.nguyenNhan !== 'trung_tam' && input.nguyenNhan !== 'hoc_sinh') throw badRequest('Chọn nguyên nhân: Trung tâm hoặc Học sinh.');
    nguyenNhan = input.nguyenNhan;
    ghiChu = String(input.ghiChu ?? '').trim() || null;
    if (nguyenNhan === 'hoc_sinh' && (ghiChu ?? '').length < 15) throw badRequest('Nguyên nhân Học sinh thì ghi phương án case-by-case, ít nhất 15 ký tự.');
    if (nguyenNhan === 'trung_tam') {
      const cuoi = conn.prepare(`SELECT id FROM assessment_attempts WHERE student_id = ? AND class_id = ? AND kind = 'final' AND status != 'cancelled' ORDER BY id DESC LIMIT 1`).get(sid, lopBeEle) as any;
      const t = cuoi ? tyLeTongLo([cuoi.id]).get(cuoi.id) : undefined;
      const chuan = REGULAR_SKILLS as readonly string[];
      const chon = Array.isArray(input.mon) ? (input.mon as unknown[]).map(String) : (t?.monTruot ?? []);
      if (chon.some((m) => !chuan.includes(m))) throw badRequest('Kỹ năng không hợp lệ.');
      mon = [...new Set(chon)];
      if (!mon.length) throw badRequest('Nguyên nhân Trung tâm thì chọn ít nhất một kỹ năng chưa đạt.');
    }
  }
  return tx(() => {
    const now = nowIso();
    conn.prepare(
      `INSERT INTO lo_trinh_tiep_theo (student_id, class_id, huong, ky_vong_dat, ky_vong_nguyen_nhan, ky_vong_mon, ky_vong_ghi_chu, updated_by, created_at, updated_at)
       VALUES (?,?, 'chua_ro', ?,?,?,?,?,?,?)
       ON CONFLICT(student_id, class_id) DO UPDATE SET ky_vong_dat = excluded.ky_vong_dat, ky_vong_nguyen_nhan = excluded.ky_vong_nguyen_nhan,
         ky_vong_mon = excluded.ky_vong_mon, ky_vong_ghi_chu = excluded.ky_vong_ghi_chu, updated_by = excluded.updated_by, updated_at = excluded.updated_at`,
    ).run(sid, lopBeEle, dat ? 1 : 0, nguyenNhan, mon.length ? JSON.stringify(mon) : null, ghiChu, p.userId, now, now);
    let taoMoi = 0;
    if (!dat && nguyenNhan === 'trung_tam' && ftCycle && ftClass) taoMoi = taoCaseTutorFt(conn, p, { sid, ftCycleId: ftCycle, ftClassId: ftClass, mon, ngay: demoToday() });
    const daCo = ftCycle ? (conn.prepare(`SELECT COUNT(*) n FROM sos_cases WHERE student_id = ? AND cycle_id = ? AND origin_kind = 'chuyen_cap' AND title LIKE 'Kỳ vọng đầu ra%'`).get(sid, ftCycle) as any).n as number : 0;
    writeAudit({ actorUserId: p.userId, action: 'cuoi_khoa.ket_luan_ft', entityType: 'student', entityId: sid, after: { dat, nguyenNhan, mon, taoMoi } });
    return {
      dat, nguyenNhan, mon, ghiChu, taoCaseTutor: taoMoi,
      luuY: (dat || nguyenNhan !== 'trung_tam') && daCo ? 'Case Tutor đã tạo trước đó được giữ nguyên — giáo viên tự xử lý.' : null,
    };
  });
}

/** Số em ĐANG học mỗi lớp có Cuối khoá 50–59% (Quản lý cân nhắc) — cho chữ việc "Chưa có lộ trình tiếp theo". 3 câu cho cả lô lớp. */
export function demCanQuanLyTheoLop(classIds: readonly number[]): Map<number, number> {
  const out = new Map<number, number>();
  const lopCua = new Map<number, number>();
  theoLo([...classIds], (lo, ph) => {
    for (const r of db().prepare(
      `SELECT a.id, a.class_id FROM assessment_attempts a JOIN enrollments e ON e.student_id = a.student_id AND e.class_id = a.class_id AND e.status = 'active'
        WHERE a.kind = 'final' AND a.status = 'done' AND a.class_id IN (${ph})`,
    ).all(...lo) as any[]) lopCua.set(r.id, r.class_id);
  });
  for (const [id, t] of tyLeTongLo([...lopCua.keys()])) {
    if (t.tyLe !== null && daiCuoiKhoa(t.tyLe) === '50_59') out.set(lopCua.get(id)!, (out.get(lopCua.get(id)!) ?? 0) + 1);
  }
  return out;
}

/** K4-23 vế 2: bài Cuối khoá bị dời quá tuần cuối khoá → MỘT thẻ Báo lên (không duyệt, QL nhắc GVCN). Chạy trong tx của `reportRegularNoShow`. */
export function baoLenCuoiKhoaDoiQuaHan(conn: any, a: { id: number; student_id: number; class_id: number }): void {
  const gvcn = (conn.prepare(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active' LIMIT 1`).get(a.class_id) as any)?.user_id ?? null;
  const lyDo = 'Bài Cuối khoá bị dời quá tuần cuối khoá của lớp';
  taoYeuCau(conn, {
    loai: 'bao_len_cuoi_khoa', doiTuongLoai: 'attempt', doiTuongId: a.id, hocVienId: a.student_id, lopId: a.class_id, nguoiXin: null, hanDuyet: null, lyDo,
    duLieu: { viecKey: `cuoi_khoa:${a.id}`, ownerId: gvcn, lyDo },
  });
}

/** Em còn Mini Test CHƯA ghi (MỘT câu): hạn, Case + PA để mở form, người dạy bổ trợ (tài khoản). */
export function emConMiniTest(sids: readonly number[]): Map<number, { han: string; caseId: number | null; paId: number | null; gv: number | null }> {
  const out = new Map<number, { han: string; caseId: number | null; paId: number | null; gv: number | null }>();
  theoLo([...sids], (lo, ph) => {
    for (const r of db().prepare(
      `SELECT m.student_id, m.han, MIN(iv.case_id) AS case_id, MIN(CASE WHEN iv.status IN ('planned', 'started') THEN iv.id END) AS pa_id,
              MIN(iv.performer_user_id) AS gv
         FROM mini_test m LEFT JOIN case_interventions iv ON iv.nhom_bo_tro = m.nhom_bo_tro
        WHERE m.ty_le IS NULL AND m.student_id IN (${ph}) GROUP BY m.id ORDER BY m.id`,
    ).all(...lo) as any[]) out.set(r.student_id, { han: r.han, caseId: r.case_id ?? null, paId: r.pa_id ?? null, gv: r.gv ?? null });
  });
  return out;
}

/** Ai thấy việc "Ghi Mini Test" ở cột Việc tiếp theo: người dạy bổ trợ, hoặc GVCN lớp em ĐANG học (khi chưa có người dạy có tài khoản). */
export function nguoiGhiMiniTest(p: Principal, classId: number, mt: { han: string; caseId: number | null; paId: number | null; gv: number | null } | undefined) {
  if (!mt) return null;
  const laNguoiLam = mt.gv ? mt.gv === p.userId : isCoreTeacherOf(p, classId);
  return laNguoiLam ? { han: mt.han, caseId: mt.caseId, paId: mt.paId } : null;
}
