import { THAM_SO_TOI_DA, chenNhieuDong, db, theoLo, tx } from '../db.ts';
import {
  NGUONG_MINI_TEST, PERMISSIONS, caseDedupKey, categoryOf, chuHopKetLuan, coBoTroFinal, khongPhuHopLoTrinh, chuMonTruot, goiYCuoiKhoa, kyHieuLop, kyNangLopDich, lichBoTro, ngay, tenMon, weeklyUpdateDue,
  type BoTroMienPhi, type GoiYCuoiKhoa, type RegularSkill,
} from '../../../shared/domain/index.ts';
import { addDays, badRequest, forbidden, isIsoDate, notFound, nowIso } from '../util.ts';
import { can, isCoreTeacherOf, type Principal } from '../permissions.ts';
import { demoToday } from '../demoConfig.ts';
import { nho } from '../platform/nguCanhRequest.ts';
import { HV_DANG_HOC_SQL } from '../students/tamDung.ts';
import { writeAudit } from '../platform/audit.ts';
import { mondayOf } from '../platform/week.ts';
import { addMilestone } from '../cases/sos.ts';
import { dongBoTrangThaiCaseLo } from '../cases/sosState.ts';
import { chuyenCaseSangLoTrinh, dongCaseHeThongLo } from '../cases/systemClose.ts';
import { suggestCaseOwner } from '../cases/owner.ts';
import { chenPa, type DongPa } from '../cases/taoPa.ts';
import { nguoiGiuKetQua } from '../cases/giuKetQua.ts';
import { phanCongDangHieuLuc } from '../worklist/scoreDebt.ts';
import { chotYeuCau, taoYeuCau } from '../duyet/yeuCau.ts';
import { allProgrammes, evaluateRegular } from './regular.ts';
import { emDaSangFt, kiemDongKyVong, mt0TheoLop, taoCaseKyVong, type DongCaseKyVong } from './kyVong.ts';

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

/**
 * PR-S5F-a (T58): chữ kết quả Cuối khoá — `Cuối khoá 66% (L 70 · R 58 · G+V 66 · P 62)` — của nhiều em ở MỘT lớp thường, KỂ CẢ em đã chuyển đi
 * (phiếu bàn giao đọc sau khi chuyển, thẻ kết quả ở hồ sơ). Cùng hàm chữ với hộp Kết luận khoá. Em chưa có bài Cuối khoá → không có trong kết quả.
 */
export function chuCuoiKhoaLo(classId: number, sids: readonly number[]): Map<number, string> {
  const out = new Map<number, string>();
  const luot = new Map<number, number>();
  theoLo([...new Set(sids)], (lo, ph) => {
    for (const r of db().prepare(
      `SELECT id, student_id FROM assessment_attempts WHERE class_id = ? AND kind = 'final' AND status != 'cancelled' AND student_id IN (${ph}) ORDER BY id`,
    ).all(classId, ...lo) as any[]) luot.set(r.student_id, r.id);
  });
  const t = tyLeTongLo([...luot.values()]);
  for (const [sid, id] of luot) {
    const x = t.get(id);
    if (!x) continue;
    const h = chuHopKetLuan({
      ct: x.ct, tyLe: x.tyLe, scored: x.scored, required: x.required, mon: x.mon,
      goiY: goiYCuoiKhoa({ ct: x.ct, tyLe: x.tyLe, monTruot: x.monTruot }), quyetDinh: null, ketLuanFt: null,
    });
    out.set(sid, h.phu ? `${h.chinh} (${h.phu})` : h.chinh);
  }
  return out;
}

export type EmXetLai = { studentId: number; ten: string; huong: string; tyLe: number; lopHienTai: { id: number; code: string } };
/** Gom theo lớp HIỆN TẠI của em (`lopId` = lớp em đang học). */
export type LopXetLai = { lopId: number; code: string; em: EmXetLai[] };

/**
 * PR-CL (B5): việc QL "Xét lại lộ trình" — em đã thi hành quyết định CUỐI KHOÁ từ lớp thường (lên lớp / Lên FT / học lại) mà Final mới nhất ở lớp nguồn
 * "không phù hợp lộ trình" (`khongPhuHopLoTrinh`). Tự hết: em có quyết định mới (chưa huỷ), thôi học, rời lớp chuyển đến, điểm hết lệch, hoặc qua Chủ nhật
 * tuần 2 ở lớp mới. Việc của QL chi nhánh lớp em ĐANG học (chủ sản phẩm 08/10): quyền `class.edit` ở lớp đó; `branchId` = chi nhánh lớp đó. Gom theo lớp hiện tại. 4 câu cho cả phạm vi (lệnh · Final · 2 câu %),
 * nhớ trong request (việc + GET panel cùng một tập).
 */
export function emXetLaiLoTrinh(p: Principal, branchId: number | null, today: string): LopXetLai[] {
  return nho(`xet-lai-lo-trinh:${p.userId}:${branchId ?? ''}:${today}`, () => tinhEmXetLai(p, branchId, today));
}

function tinhEmXetLai(p: Principal, branchId: number | null, today: string): LopXetLai[] {
  const conn = db();
  const lenh = (conn.prepare(
    `SELECT l.student_id, l.huong, l.lop_nguon_id, l.lop_dich_id, cd.code AS dich_code, s.full_name
       FROM lenh_chuyen_lop l
       JOIN classes cn ON cn.id = l.lop_nguon_id AND cn.is_fast_track = 0
       JOIN classes cd ON cd.id = l.lop_dich_id
       JOIN students s ON s.id = l.student_id AND ${HV_DANG_HOC_SQL('s')}
       JOIN enrollments e ON e.student_id = l.student_id AND e.class_id = l.lop_dich_id AND e.status = 'active'
      WHERE l.boi_canh = 'cuoi-khoa' AND l.trang_thai = 'da_chuyen' AND l.huong IN ('len_lop', 'fast_track', 'hoc_lai')
        AND ? <= date(l.tuan_bat_dau, '+13 day')${branchId ? ' AND cd.branch_id = ?' : ''}
        AND NOT EXISTS (SELECT 1 FROM lenh_chuyen_lop k WHERE k.student_id = l.student_id AND k.id > l.id AND k.trang_thai != 'huy')`,
  ).all(today, ...(branchId ? [branchId] : [])) as any[]).filter((l) => can(p, PERMISSIONS.CLASS_EDIT, { classId: l.lop_dich_id }));
  if (!lenh.length) return [];
  /* Final mới nhất của em ở LỚP NGUỒN (id lớn nhất). */
  const nguonCua = new Map(lenh.map((l) => [l.student_id as number, l.lop_nguon_id as number]));
  const finalCua = new Map<number, number>();
  theoLo([...nguonCua.keys()], (lo, ph) => {
    for (const r of conn.prepare(
      `SELECT student_id, class_id, MAX(id) AS id FROM assessment_attempts
        WHERE kind = 'final' AND status != 'cancelled' AND student_id IN (${ph}) GROUP BY student_id, class_id`,
    ).all(...lo) as any[]) if (nguonCua.get(r.student_id) === r.class_id) finalCua.set(r.student_id, r.id);
  });
  const tyLe = tyLeTongLo([...finalCua.values()]);
  const theoLop = new Map<number, LopXetLai>();
  for (const l of lenh) {
    const t = tyLe.get(finalCua.get(l.student_id) ?? -1);
    if (!t?.du || t.tyLe === null || !khongPhuHopLoTrinh(l.huong, t.tyLe)) continue;
    if (!theoLop.has(l.lop_dich_id)) theoLop.set(l.lop_dich_id, { lopId: l.lop_dich_id, code: l.dich_code, em: [] });
    theoLop.get(l.lop_dich_id)!.em.push({ studentId: l.student_id, ten: l.full_name, huong: l.huong, tyLe: t.tyLe, lopHienTai: { id: l.lop_dich_id, code: l.dich_code } });
  }
  const out = [...theoLop.values()].sort((a, b) => a.code.localeCompare(b.code, 'vi'));
  for (const g of out) g.em.sort((a, b) => a.ten.localeCompare(b.ten, 'vi'));
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
function ketLuanCuaDong(r: any): Pick<EmCuoiKhoa, 'quyetDinh' | 'ketLuanFt'> {
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
export function cuoiKhoaTheoHocVien(classId: number, sids?: readonly number[], o: { daRoi?: boolean } = {}): Map<number, EmCuoiKhoa> {
  const out = new Map<number, EmCuoiKhoa>();
  if (sids && !sids.length) return out;
  const conn = db();
  const loc = sids ? ` AND e.student_id IN (${sids.map(() => '?').join(',')})` : '';
  /* `daRoi` (PR-S5F-a): cả em đã chuyển khỏi lớp — hồ sơ HV sau chuyển vẫn thấy % Cuối khoá của lớp cũ. */
  const dong = conn.prepare(
    `SELECT e.student_id, a.id AS attempt_id FROM enrollments e
       LEFT JOIN assessment_attempts a ON a.student_id = e.student_id AND a.class_id = e.class_id AND a.kind = 'final' AND a.status != 'cancelled'
      WHERE e.class_id = ? AND e.status ${o.daRoi ? "IN ('active', 'transferred')" : "= 'active'"}${loc} ORDER BY a.id`,
  ).all(classId, ...(sids ?? [])) as any[];
  const luotCuaEm = new Map<number, number | null>();
  for (const r of dong) luotCuaEm.set(r.student_id, r.attempt_id ?? luotCuaEm.get(r.student_id) ?? null);   // nhiều bài Final Test → bài id lớn nhất
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

/** Một em vừa được chuyển ở `apDungCaLop` / `apDungMotDong`. Chỉ hướng lên / học lại — tạm dừng học (bảo lưu), dừng học hẳn không đi qua đây. */
export type DongSauChuyen = {
  sid: number; fromClassId: number; toClassId: number; toFt: boolean;
  huong: 'len_lop' | 'fast_track' | 'hoc_lai'; ngay: string;
};

const CHU_BO_TRO = (n: number, tuan: number, ten: string | null) =>
  `${n} buổi miễn phí${ten ? ` (${ten})` : ''} · ${tuan} tuần · Mini Test sau buổi cuối · không tính phí học viên, không tính lương giáo viên`;
/**
 * CHẠY TRONG tx của nơi chuyển, SAU khi mở lộ trình mới (và sau `closeCasesOnProgrammeSwitch` nếu sang FT).
 * Thứ tự (Hướng dẫn 1b): (1) lớp thường → lớp thường: Case đang mở (kể cả Case bổ trợ Final đã sinh sớm — PR-CT2) + Mini Test chưa ghi đi theo em sang
 * lộ trình mới TRƯỚC khi tạo Case Cuối khoá, để khoá chống trùng gắn PA vào Case Giữa khoá cùng môn (M-01); (2) lên: Case Cuối khoá + PA Bổ trợ miễn phí
 * + một Mini Test (đã sinh sớm thì thôi — `taoBoTroFinal`); (3) học lại: Báo PH qua TVV cho Quản lý; (4) sang FT có kết luận "Trung tâm": Case Tutor.
 * Em CHƯA đủ điểm Cuối khoá vẫn chuyển (Q30-4) — phần (2)(3) chờ điểm (`capNhatCuoiKhoaSauChuyen`).
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
  const chuCase = new Map<string, number | null>();
  const nguoiPhuTrach = (classId: number, category: string) => {
    const k = `${classId}:${category}`;
    if (!chuCase.has(k)) chuCase.set(k, suggestCaseOwner({ classId, category }));
    return chuCase.get(k)!;
  };
  /*
   * (1) Case đang mở đi theo em sang lộ trình lớp thường mới, chủ Case = GV đúng môn lớp MỚI (như Giữa khoá, M-04 — PR-S5F-a). Lọc trước MỘT câu: chỉ em
   * còn Case mở ở lộ trình cũ mới đi từng em. PA đang chạy (kể cả PA bổ trợ Giữa khoá chưa ghi kết quả cuối) GIỮ người dạy cũ — người đó ghi tiếp.
   */
  const thuong = dongs.filter((d) => !d.toFt && moi.has(d.sid) && cu.has(d.sid));
  const caseMoCu = new Map<number, { id: number; category: string; owner: number | null }[]>();
  theoLo(thuong.map((d) => d.sid), (lo, ph) => {
    for (const r of conn.prepare(`SELECT id, student_id, cycle_id, category, topic, owner_user_id FROM sos_cases WHERE status != 'done' AND student_id IN (${ph})`).all(...lo) as any[]) {
      if (r.cycle_id !== cu.get(r.student_id)) continue;
      caseMoCu.set(r.student_id, [...(caseMoCu.get(r.student_id) ?? []), { id: r.id, category: r.category ?? categoryOf(r.topic) ?? '', owner: r.owner_user_id ?? null }]);
    }
  });
  const lichSuChu: unknown[][] = [];
  for (const d of dongs) {
    const ds = caseMoCu.get(d.sid);
    if (!ds) continue;
    chuyenCaseSangLoTrinh(p.userId, d.sid, cu.get(d.sid)!, moi.get(d.sid)!, null, d.ngay);
    for (const c of ds) {
      const u = nguoiPhuTrach(d.toClassId, c.category);
      if (!u || u === c.owner) continue;
      conn.prepare('UPDATE sos_cases SET owner_user_id = ?, updated_at = ? WHERE id = ?').run(u, nowIso(), c.id);
      lichSuChu.push([c.id, 'owner', c.owner, 'bàn giao khi chuyển lớp', p.userId, nowIso()]);
    }
  }
  chenNhieuDong('INSERT INTO sos_case_history (case_id, field, old_value, new_value, actor_user_id, created_at)', lichSuChu);
  /* PR-CT2 (§8): Mini Test chưa ghi của bổ trợ Final sinh sớm đi theo Case sang lộ trình mới — một câu mỗi lô (cặp em × lộ trình cũ). */
  theoLo(thuong.map((d) => [d.sid, cu.get(d.sid)!]), (lo) => {
    conn.prepare(`UPDATE mini_test SET cycle_id = (SELECT lc.id FROM learning_cycles lc WHERE lc.student_id = mini_test.student_id AND lc.status = 'active')
       WHERE ty_le IS NULL AND (student_id, cycle_id) IN (VALUES ${lo.map(() => '(?,?)').join(',')})`).run(...lo.flat());
  }, Math.floor(THAM_SO_TOI_DA / 2));

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

  const boTro: DongBoTroFinal[] = [], baoPh = new Map<number, number>(), kyVongCase: DongCaseKyVong[] = [];
  for (const d of dongs) {
    const luot = luotCua.get(d.sid), t = luot ? tyLe.get(luot.id) : undefined, toCycle = moi.get(d.sid);
    if (!luot || !t || t.tyLe === null || !toCycle) continue;   // chưa đủ điểm (Q30-4) hoặc không thuộc lớp thường — điểm nhập sau áp ở `capNhatCuoiKhoaSauChuyen`
    const goiY = goiYCuoiKhoa({ ct: t.ct, tyLe: t.tyLe, monTruot: t.monTruot });
    if (!goiY) continue;
    /* (2) lên + có bổ trợ (60–69%, hoặc 50–59% Quản lý cho lên); BE/ELE sang FT thì không (PR-CT2, `coBoTroFinal`). */
    if ((d.huong === 'len_lop' || d.huong === 'fast_track') && goiY.boTroNeuLen && coBoTroFinal(t.ct, d.toFt)) {
      boTro.push({
        sid: d.sid, luot, ct: t.ct!, tyLe: t.tyLe, b: goiY.boTroNeuLen, fromClassId: d.fromClassId, toClassId: d.toClassId, toFt: d.toFt,
        cycleId: toCycle, ownerClassId: d.toClassId, ngay: d.ngay,
      });
    }
    /* (3) học lại → Quản lý báo PH qua TVV (< 50%, hoặc 50–59% Quản lý quyết học lại — Q6). */
    if (d.huong === 'hoc_lai' && (goiY.baoPhTvv || goiY.dai === '50_59')) baoPh.set(luot.id, d.sid);
  }
  /* (4) sang FT có kết luận Không đạt kỳ vọng (PR-KV): Trung tâm → Case + Tutor, Học viên → Case không PA. Không cần điểm Final — theo lô. */
  for (const d of dongs) {
    const kv = kyVong.get(d.sid), toCycle = moi.get(d.sid);
    if (!d.toFt || !toCycle || kv?.ky_vong_dat !== 0 || !kv.ky_vong_nguyen_nhan) continue;
    kyVongCase.push({ sid: d.sid, dat: false, nguyenNhan: kv.ky_vong_nguyen_nhan, mon: jsonMang(kv.ky_vong_mon) as RegularSkill[], lyDo: kv.ky_vong_ghi_chu ?? null,
      fromClassId: d.fromClassId, ftClassId: d.toClassId, ftCycleId: toCycle, ngay: d.ngay });
  }
  taoCaseKyVong(p, kyVongCase);
  taoBoTroFinal(p, boTro);
  if (baoPh.size) {
    const co = new Set<number>();
    theoLo([...baoPh.keys()], (lo, ph) => {
      for (const r of conn.prepare(`SELECT attempt_id FROM sos_coordination_actions WHERE kind = 'bao_ph_tvv' AND attempt_id IN (${ph})`).all(...lo) as any[]) co.add(r.attempt_id);
    });
    chenNhieuDong('INSERT INTO sos_coordination_actions (attempt_id, student_id, kind, custom_name, preset, status, created_at)',
      [...baoPh].filter(([attemptId]) => !co.has(attemptId)).map(([attemptId, sid]) => [attemptId, sid, 'bao_ph_tvv', null, 1, 'pending', nowIso()]));
  }
}

/** Một em cần bổ trợ Final: Case + PA Bổ trợ miễn phí (mỗi môn trượt) + một Mini Test. `cycleId` = lộ trình gắn Case; `ownerClassId` = lớp chọn chủ Case. */
export type DongBoTroFinal = {
  sid: number; luot: { id: number; attemptNo: number }; ct: string; tyLe: number; b: BoTroMienPhi;
  fromClassId: number; toClassId: number; toFt: boolean; cycleId: number; ownerClassId: number; ngay: string;
  /** Tuần bắt đầu của quyết định (sinh sớm) — PA không bắt đầu trước tuần này. */
  tuanBatDau?: string | null;
};

/**
 * PR-CT2 (§8): SINH bổ trợ Final — MỘT hàm cho lúc đủ điểm + có quyết định (sinh sớm, `dongBoCheTaiFinal`) và lúc thi hành / điểm về muộn (`sauChuyenCuoiKhoa`).
 * Một lần: em × bài đã có Mini Test thì bỏ qua. Người dạy PA = GV cũ dạy môn đó ở lớp của bài Final (phân công hiệu lực ngày `ngay`; không có → NULL).
 * Bắt đầu = thứ Hai muộn nhất trong {thứ Hai sau `ngay` (là thứ Hai thì chính nó), tuần khai giảng lớp đích, `tuanBatDau`}. Trong tx nơi gọi.
 */
function taoBoTroFinal(p: Principal, dongs: readonly DongBoTroFinal[]): void {
  if (!dongs.length) return;
  const conn = db();
  /* Pha 1 — tính thuần: mỗi em → các "ô" (em × môn) cần Case + PA bổ trợ. Đọc một lần: Mini Test đã có · khai giảng + GVCN lớp đích · GV cũ. */
  const daCoMt = new Set<string>();
  theoLo([...new Set(dongs.map((x) => x.luot.id))], (lo, ph) => {
    for (const r of conn.prepare(`SELECT student_id, tu_attempt_id FROM mini_test WHERE tu_attempt_id IN (${ph})`).all(...lo) as any[]) daCoMt.add(`${r.student_id}:${r.tu_attempt_id}`);
  });
  const lopDich = [...new Set(dongs.map((x) => x.toClassId))];
  const khaiGiang = new Map<number, string | null>();
  theoLo(lopDich, (lo, ph) => {
    for (const r of conn.prepare(`SELECT c.id, rp.week_start FROM classes c LEFT JOIN report_periods rp ON rp.id = c.start_period_id WHERE c.id IN (${ph})`).all(...lo) as any[]) khaiGiang.set(r.id, r.week_start ?? null);
  });
  const chuNhiem = new Map<number, number[]>();
  theoLo(lopDich, (lo, ph) => {
    for (const r of conn.prepare(`SELECT DISTINCT class_id, user_id FROM teacher_assignments WHERE class_id IN (${ph}) AND is_core = 1 AND status = 'active'`).all(...lo) as any[]) {
      chuNhiem.set(r.class_id, [...(chuNhiem.get(r.class_id) ?? []), r.user_id]);
    }
  });
  const gvCu = new Map<string, Map<string, { userId: number }>>();
  for (const ng of new Set(dongs.map((x) => x.ngay))) gvCu.set(ng, phanCongDangHieuLuc([...new Set(dongs.map((x) => x.fromClassId))], ng));
  const chuCase = new Map<string, number | null>();
  const nguoiPhuTrach = (classId: number, category: string) => {
    const k = `${classId}:${category}`;
    if (!chuCase.has(k)) chuCase.set(k, suggestCaseOwner({ classId, category }));
    return chuCase.get(k)!;
  };
  type O = { x: DongBoTroFinal; mon: string; skill: string; category: string; batDau: string; lich: { ngayMiniTest: string; hanMiniTest: string }; phanTram: number };
  const o: O[] = [];
  const mtRows: unknown[][] = [], nhatKy: unknown[][] = [], thongBao: unknown[][] = [];
  const emCoBoTro: number[] = [];
  for (const x of dongs) {
    if (daCoMt.has(`${x.sid}:${x.luot.id}`)) continue;
    const b = x.b, phanTram = Math.round(x.tyLe * 100);
    const monDay = mondayOf(x.ngay) === x.ngay ? x.ngay : mondayOf(addDays(x.ngay, 7));
    const batDau = [monDay, khaiGiang.get(x.toClassId), x.tuanBatDau].filter((v): v is string => !!v).sort().at(-1)!;
    const lich = lichBoTro({ batDau, soTuan: b.soTuan });
    for (const mon of b.mon) {
      const skill = kyNangLopDich(mon, x.toFt);
      o.push({ x, mon, skill, category: categoryOf(skill) ?? skill, batDau, lich, phanTram });
    }
    mtRows.push([x.sid, x.cycleId, x.luot.id, `mt:${x.luot.id}`, b.soBuoi, lich.ngayMiniTest, lich.hanMiniTest]);
    nhatKy.push([x.sid, x.cycleId, 'intervention', x.ngay, `Final Test ${phanTram}% — bổ trợ miễn phí ${b.soBuoi} buổi · Mini Test hạn ${ngay(lich.hanMiniTest, x.ngay)}`, p.userId, nowIso(), `bo-tro-final:${x.sid}:${x.luot.id}`]);
    for (const g of chuNhiem.get(x.toClassId) ?? []) {
      thongBao.push([g, 'bo_tro_mien_phi', 'Mang theo PA Bổ trợ miễn phí', `Final Test ${phanTram}% — Mini Test hạn ${ngay(lich.hanMiniTest, x.ngay)}.`, 'student', x.sid, `bo-tro-mien-phi:${x.luot.id}:${g}`, nowIso(), null]);
    }
    emCoBoTro.push(x.sid);
  }
  if (!o.length) return;

  /* Pha 2 — Case: tìm Case đang mở theo khoá chống trùng MỘT lần; chưa có thì tạo (mỗi Case một câu — cần id). */
  const khoaCua = (y: O) => caseDedupKey({ category: y.category as any, studentId: y.x.sid, cycleId: y.x.cycleId })!;
  const coSan = new Map<string, { id: number; status: string }>();
  theoLo(o.map(khoaCua), (lo, ph) => {
    for (const r of conn.prepare(`SELECT id, status, dedup_key FROM sos_cases WHERE dedup_key IN (${ph})`).all(...lo) as any[]) coSan.set(r.dedup_key, { id: r.id, status: r.status });
  });
  const mocRows: unknown[][] = [], paRows: DongPa[] = [], canDongBo: number[] = [];
  /* Case mới: MỘT câu INSERT nhiều dòng … RETURNING (lô theo trần tham số), không mỗi Case một câu. */
  const caseMoi = o.filter((y) => { const co = coSan.get(khoaCua(y)); return !co || co.status === 'done'; });
  for (const y of caseMoi) {
    const co = coSan.get(khoaCua(y));
    if (co) conn.prepare('UPDATE sos_cases SET dedup_key = NULL, updated_at = ? WHERE id = ?').run(nowIso(), co.id);   // Case cũ đã đóng nhả khoá (hiếm)
  }
  const COT_CASE = 13;
  theoLo(caseMoi, (lo) => {
    /* `attempt_id` NULL: quyền xem/ghi Case theo LỚP ĐANG HỌC của em (không theo lớp cũ của bài Cuối khoá); bài gốc ở mốc `opened` + `mini_test.tu_attempt_id`. */
    const rows = lo.map((y) => [null, y.x.sid, y.x.cycleId, y.skill, y.category, y.x.ngay, khoaCua(y),
      `Final Test ${kyHieuLop(y.x.ct, null) ?? y.x.ct} · ${tenMon(y.x.ct, y.mon)} không đạt`, coSan.get(khoaCua(y))?.id ?? null, nguoiPhuTrach(y.x.ownerClassId, y.category), nowIso(), 'chuyen_cap', 'in_progress']);
    for (const r of conn.prepare(
      `INSERT INTO sos_cases (attempt_id, student_id, cycle_id, topic, category, detected_at, dedup_key, title, previous_case_id, owner_user_id, created_at, origin_kind, status)
       VALUES ${rows.map(() => `(${Array(COT_CASE).fill('?').join(',')})`).join(',')} RETURNING id, dedup_key`,
    ).all(...rows.flat()) as any[]) coSan.set(r.dedup_key, { id: r.id, status: 'in_progress' });
  }, Math.floor(THAM_SO_TOI_DA / COT_CASE));
  const daMo = new Set<string>();
  for (const y of o) {
    const khoa = khoaCua(y);
    const caseId = coSan.get(khoa)!.id;
    const laMoi = caseMoi.includes(y);
    /* Case Giữa khoá đi theo em nhận PA mới: lịch sử Case vẫn có mốc Cuối khoá (PR-S5F-a) — `repeat` = trượt lại ở bài sau. */
    if (!daMo.has(khoa)) {
      mocRows.push([caseId, laMoi ? 'opened' : 'repeat', y.x.luot.id, y.x.luot.attemptNo, y.x.ngay, `Final Test ${y.phanTram}% — bổ trợ miễn phí`, p.userId, nowIso(), `cuoi-khoa:${y.x.luot.id}:${caseId}`]);
      if (!laMoi) canDongBo.push(caseId);
      daMo.add(khoa);
    }
    paRows.push({
      caseId, kind: 'bo_tro_mien_phi', description: CHU_BO_TRO(y.x.b.soBuoi, y.x.b.soTuan, y.x.b.theoMon ? chuMonTruot(y.x.ct, y.x.b.mon) : null), soBuoi: y.x.b.soBuoi,
      /* PR-CT2 (§8): Người dạy = GV cũ của môn (lớp của bài Final); việc Kết quả theo `nguoiGiuKetQua` (nhóm `mt:` → GVCN lớp đang học). */
      performerUserId: gvCu.get(y.x.ngay)?.get(`${y.x.fromClassId}|${y.mon}`)?.userId ?? null,
      recordedBy: p.userId, status: 'started', startedDate: y.batDau, preset: true, confirmedBy: p.userId, confirmedAt: nowIso(),
      cycleStartedOn: y.batDau, actionDue: weeklyUpdateDue(y.batDau), followupDue: y.lich.ngayMiniTest, mocQuyChe: 'mini_test', nhomBoTro: `mt:${y.x.luot.id}`,
    });
  }

  /* Pha 3 — ghi theo lô. */
  chenNhieuDong('INSERT OR IGNORE INTO case_milestones (case_id, kind, attempt_id, attempt_no, occurred_on, note, created_by, created_at, dedup_key)', mocRows);
  chenPa(conn, paRows);
  dongBoTrangThaiCaseLo(canDongBo);   // SAU chenPa: Case cũ đi theo em (Giữa khoá / Progress Test) nhận PA mới — có thể đổi trạng thái; theo lô (Turso)
  chenNhieuDong('INSERT OR IGNORE INTO mini_test (student_id, cycle_id, tu_attempt_id, nhom_bo_tro, so_buoi, ngay_du_kien, han)', mtRows);
  chenNhieuDong('INSERT INTO notifications (user_id, kind, title, body, entity_type, entity_id, dedup_key, created_at, duong)', thongBao,
    ' ON CONFLICT(user_id, dedup_key) DO UPDATE SET title = excluded.title, body = excluded.body');
  /* PR-CT2: khoá (em, lượt) — huỷ thì xoá, sinh lại thì một dòng với nội dung mới. */
  chenNhieuDong('INSERT INTO journey_events (student_id, cycle_id, event_type, event_date, title, created_by, created_at, dedup_key)', nhatKy,
    ' ON CONFLICT(dedup_key) WHERE dedup_key IS NOT NULL DO NOTHING');
  writeAudit({ actorUserId: p.userId, action: 'cuoi_khoa.bo_tro_tao', entityType: 'class', entityId: dongs[0].fromClassId, after: { hocVien: emCoBoTro, soPa: paRows.length, soCaseMoi: caseMoi.length } });
}

/**
 * PR-CT2 (§8): ĐỒNG BỘ bổ trợ Final của em ĐANG học lớp thường `classId` với điểm + quyết định — gọi ở `refreshRegularOutcome` (bài Final), `raLenh`
 * (Cuối khoá lớp thường, kể cả sửa lệnh), huỷ / khôi phục lệnh. Trong tx nơi gọi, theo lô.
 * Cần = đủ điểm ∧ lệnh `cho` Cuối khoá lên (len_lop / fast_track) ∧ có bổ trợ nếu lên ∧ lớp đích KHÔNG phải FT (BE/ELE → FT không bổ trợ — `coBoTroFinal`;
 * FOU → FT sinh lúc thi hành vì Case phải sống ở lộ trình FT — Quyết định 1). Có = dòng `mini_test` của bài.
 * Cần mà chưa có → sinh sớm (lộ trình hiện tại, chủ Case theo lớp cũ). Có mà không còn cần, chưa ai đụng, và (đủ điểm hoặc không còn lệnh) → huỷ
 * (xoá một ô điểm khi còn lệnh thì không huỷ: nhập lại không nhân đôi). Còn lại không làm gì — sửa điểm sau khi sinh không tự sửa số buổi (Quyết định 3).
 */
export function dongBoCheTaiFinal(p: Principal, classId: number, sids?: readonly number[]): void {
  if (sids && !sids.length) return;
  const conn = db();
  /* Em đang học lớp × bài Final mới nhất ĐÃ ĐỦ điểm (`done`) hoặc đã có Mini Test, lộ trình của bài còn chạy — không ai thì dừng sau một câu. */
  const em = new Map<number, { a: number; attemptNo: number; cyc: number }>();
  const doc = (loc: string, args: readonly unknown[]) => {
    for (const r of conn.prepare(
      `SELECT a.id, a.student_id, a.attempt_no, a.cycle_id FROM assessment_attempts a
         JOIN enrollments e ON e.student_id = a.student_id AND e.class_id = a.class_id AND e.status = 'active'
         JOIN learning_cycles lc ON lc.id = a.cycle_id AND lc.status = 'active'
        WHERE a.class_id = ? AND a.kind = 'final' AND a.status != 'cancelled' AND (a.status = 'done' OR EXISTS (SELECT 1 FROM mini_test m WHERE m.tu_attempt_id = a.id))${loc} ORDER BY a.id`,
    ).all(classId, ...args) as any[]) em.set(r.student_id, { a: r.id, attemptNo: r.attempt_no, cyc: r.cycle_id });
  };
  if (sids) theoLo([...new Set(sids)], (lo, ph) => doc(` AND a.student_id IN (${ph})`, lo), THAM_SO_TOI_DA - 1);
  else doc('', []);
  if (!em.size) return;
  const ds = [...em.keys()], luot = [...em.values()].map((x) => x.a);
  const tyLe = tyLeTongLo(luot);
  const lenh = new Map<number, any>();
  theoLo(ds, (lo, ph) => {
    for (const r of conn.prepare(
      `SELECT l.student_id, l.huong, l.lop_dich_id, l.tuan_bat_dau, c.is_fast_track FROM lenh_chuyen_lop l LEFT JOIN classes c ON c.id = l.lop_dich_id
        WHERE l.trang_thai = 'cho' AND l.boi_canh = 'cuoi-khoa' AND l.lop_nguon_id = ? AND l.student_id IN (${ph})`,
    ).all(classId, ...lo) as any[]) lenh.set(r.student_id, r);
  }, THAM_SO_TOI_DA - 1);
  /* "Đã ai đụng": PA của nhóm có Kết quả, hoặc không còn `started` (PA huỷ ở lần đổi quyết định trước đã rời nhóm). Mini Test đã ghi xét ở dưới. */
  const mt = new Map<number, any>();
  theoLo(luot, (lo, ph) => {
    for (const r of conn.prepare(
      `SELECT m.id, m.student_id, m.tu_attempt_id, m.nhom_bo_tro, m.ty_le,
              EXISTS (SELECT 1 FROM case_interventions iv WHERE iv.nhom_bo_tro = m.nhom_bo_tro
                        AND (EXISTS (SELECT 1 FROM case_followups f WHERE f.intervention_id = iv.id)
                             OR iv.status != 'started')) AS dung
         FROM mini_test m WHERE m.tu_attempt_id IN (${ph})`,
    ).all(...lo) as any[]) mt.set(r.student_id, r);
  });
  const homNay = demoToday();
  const sinh: DongBoTroFinal[] = [], huy: any[] = [];
  for (const [sid, x] of em) {
    const t = tyLe.get(x.a), l = lenh.get(sid), m = mt.get(sid);
    const du = !!t && t.tyLe !== null;
    const b = du ? goiYCuoiKhoa({ ct: t!.ct, tyLe: t!.tyLe, monTruot: t!.monTruot })?.boTroNeuLen ?? null : null;
    const can = !!b && !!l && (l.huong === 'len_lop' || l.huong === 'fast_track') && !l.is_fast_track;
    if (can && !m) {
      sinh.push({
        sid, luot: { id: x.a, attemptNo: x.attemptNo }, ct: t!.ct!, tyLe: t!.tyLe!, b: b!, fromClassId: classId, toClassId: l.lop_dich_id, toFt: false,
        cycleId: x.cyc, ownerClassId: classId, ngay: homNay, tuanBatDau: l.tuan_bat_dau,
      });
    } else if (!can && m && m.ty_le === null && !m.dung && (du || !l)) huy.push(m);
  }
  taoBoTroFinal(p, sinh);
  huyBoTroFinal(p, classId, huy, homNay);
}

/**
 * PR-CT2 (§8, Quyết định 4): huỷ bổ trợ Final CHƯA AI ĐỤNG (nơi gọi đã lọc) — THEO LÔ, số câu cố định mỗi lô (Turso ≤ 200 câu mỗi lần ghi).
 * Case do lần sinh này mở (mốc `opened`) và không còn PA sống khác → hệ thống đóng ("Đổi quyết định lộ trình", `dongCaseHeThongLo`); Case khác nhận PA
 * (Giữa khoá) → chỉ huỷ PA nhóm + xoá mốc Final `repeat`; Case do lần sinh mở mà còn PA sống khác → huỷ PA nhóm, GIỮ mốc `opened`.
 * Xoá Mini Test, chuông "Mang theo", dòng Hành trình của lần sinh. Trong tx nơi gọi.
 */
function huyBoTroFinal(p: Principal, classId: number, mts: readonly { id: number; student_id: number; tu_attempt_id: number; nhom_bo_tro: string }[], homNay: string): void {
  if (!mts.length) return;
  const conn = db();
  const nhom = mts.map((m) => m.nhom_bo_tro);
  const cs: { id: number; nhom: string; mo: number; khac: number }[] = [];
  theoLo(nhom, (lo, ph) => {
    cs.push(...conn.prepare(
      `SELECT DISTINCT iv.case_id AS id, iv.nhom_bo_tro AS nhom,
              EXISTS (SELECT 1 FROM case_milestones mm WHERE mm.case_id = iv.case_id AND mm.kind = 'opened'
                        AND mm.dedup_key = 'cuoi-khoa:' || substr(iv.nhom_bo_tro, 4) || ':' || iv.case_id) AS mo,
              EXISTS (SELECT 1 FROM case_interventions k WHERE k.case_id = iv.case_id AND k.status IN ('planned', 'started') AND COALESCE(k.nhom_bo_tro, '') != iv.nhom_bo_tro) AS khac
         FROM case_interventions iv WHERE iv.nhom_bo_tro IN (${ph}) AND iv.status = 'started'`,
    ).all(...lo) as any[]);
  });
  const dong = dongCaseHeThongLo({ actorUserId: p.userId, reason: 'doi_quyet_dinh', on: homNay, caseIds: cs.filter((c) => c.mo && !c.khac).map((c) => c.id) });
  theoLo(nhom, (lo, ph) => {
    /* Mọi PA của nhóm (kể cả PA vừa huỷ theo Case đóng ở trên) rời nhóm: sinh lại dùng lại khoá `mt:{lượt}`, việc / thẻ Mini Test lấy MIN Case trên nhóm. */
    conn.prepare(`UPDATE case_interventions SET status = 'cancelled', closed_reason = 'system_closed', nhom_bo_tro = NULL, updated_at = ? WHERE nhom_bo_tro IN (${ph})`)
      .run(nowIso(), ...lo);
    conn.prepare(`DELETE FROM notifications WHERE kind = 'bo_tro_mien_phi' AND (${lo.map(() => 'dedup_key LIKE ?').join(' OR ')})`)
      .run(...lo.map((n) => `bo-tro-mien-phi:${n.slice(3)}:%`));
  }, THAM_SO_TOI_DA - 1);
  const giu = cs.filter((c) => !c.mo);   // Case Giữa khoá nhận PA: mốc `repeat` của lần sinh
  theoLo(giu.map((c) => `cuoi-khoa:${c.nhom.slice(3)}:${c.id}`), (lo, ph) => { conn.prepare(`DELETE FROM case_milestones WHERE dedup_key IN (${ph})`).run(...lo); });
  dongBoTrangThaiCaseLo(cs.filter((c) => !dong.includes(c.id)).map((c) => c.id));   // Case còn mở (Case Giữa khoá / có PA khác) — theo lô
  theoLo(mts.map((m) => m.id), (lo, ph) => { conn.prepare(`DELETE FROM mini_test WHERE id IN (${ph})`).run(...lo); });
  theoLo(mts.map((m) => `bo-tro-final:${m.student_id}:${m.tu_attempt_id}`), (lo, ph) => { conn.prepare(`DELETE FROM journey_events WHERE dedup_key IN (${ph})`).run(...lo); });
  writeAudit({
    actorUserId: p.userId, action: 'cuoi_khoa.bo_tro_huy', entityType: 'class', entityId: classId,
    after: { hocVien: mts.map((m) => m.student_id), miniTest: mts.map((m) => m.id), caseDong: dong },
  });
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
  /* PR-S5F-a: điểm nhập muộn → PA bổ trợ + Mini Test tính từ HÔM NAY (không từ ngày chuyển — nếu không thì quá hạn ngay khi vừa tạo). */
  const homNay = demoToday();
  const ngay = dang.started_at && dang.started_at > homNay ? dang.started_at : homNay;
  sauChuyenCuoiKhoa(p, [{ sid: a.student_id, fromClassId: a.class_id, toClassId: dang.class_id, toFt: !!dang.is_fast_track, huong, ngay }]);
}

// ==================================================================== Mini Test (§6.3, T47, T61, M-05, K1-41)


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
 * ≥ 70% → mọi Case của nhóm tự Hoàn thành (Q5). < 70% → Case để mở + thẻ Báo QL cho Quản lý (thông báo do `taoYeuCau`). Trả `dat`.
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
    const lopId = (conn.prepare(`SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1`).get(mt.student_id) as any)?.class_id ?? null;
    /* PR-CT2 (§8): thẻ về người giữ việc Ghi Mini Test (GVCN lớp đang học; không có → chủ Case), không về Người dạy (GV cũ). */
    const chu = nguoiGiuMotMiniTest(conn, mt, lopId);
    const lyDo = `Mini Test ${phanTram}% chưa đạt (cần từ 70%) — Quản lý xử lý từng trường hợp`;
    taoYeuCau(conn, {
      loai: 'bao_len_mini_test', doiTuongLoai: 'mini_test', doiTuongId: mt.id, hocVienId: mt.student_id, lopId, nguoiXin: null, hanDuyet: null, lyDo,
      duLieu: { viecKey: `minitest:${mt.id}`, ownerId: chu, lyDo, tyLe: x.tyLe },
    });
  }
  writeAudit({ actorUserId: p.userId, action: 'cuoi_khoa.mini_test', entityType: 'student', entityId: mt.student_id, after: { miniTestId: mt.id, tyLe: x.tyLe, ngay: x.ngay, dat } });
  return { dat };
}

/**
 * Ghi / sửa Mini Test ngoài form "Ghi kết quả cuối" (đường hồ sơ HV). Ghi lần đầu: người dạy của nhóm · GVCN lớp đang học · người giữ việc (PR-CT2) · QL — PA còn mở của nhóm
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
  /* PR-CT2 (§8): người giữ việc Ghi Mini Test (`nguoiGiuMiniTest`) ghi được lần đầu. */
  const giu = () => nguoiGiuMotMiniTest(conn, mt, lopHienTai) === p.userId;
  if (daGhi && !la_ql) throw forbidden('Chỉ Quản lý mới sửa được Mini Test đã ghi.');
  if (!daGhi && !la_ql && !nguoiDay && !gvcn && !giu()) throw forbidden('Bạn không có quyền ghi Mini Test của học viên này.');
  const v = kiemMiniTest(mt, input);
  const lyDo = String(input.lyDo ?? '').trim();
  /* T7 (PR-MTa): sửa điểm Mini Test đã ghi — lý do tuỳ chọn (như sửa điểm Test). */
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
  /*
   * PR-KV (§3): cùng điều kiện với panel cả lớp — em đủ điểm MT0 ở lớp BE/ELE, và có lệnh Lên FT (chờ / đã chuyển) từ lớp đó hoặc đã lên FT
   * từ lớp đó (Lộ trình tiếp theo đã áp). Không còn đòi bài Final Test. Lớp BE/ELE = lớp nguồn của lệnh Lên FT mới nhất, không có thì lớp đang học
   * (BE/ELE) hoặc lớp BE/ELE của Lộ trình tiếp theo đã áp (em đang ở FT).
   */
  const nguon = conn.prepare(
    `SELECT x.class_id, x.programme_code, x.ft_class FROM (
       SELECT l.lop_nguon_id AS class_id, c.programme_code, CASE WHEN l.trang_thai = 'da_chuyen' THEN l.lop_dich_id END AS ft_class, 0 AS uu, l.id AS k
         FROM lenh_chuyen_lop l JOIN classes c ON c.id = l.lop_nguon_id
        WHERE l.student_id = ? AND l.huong = 'fast_track' AND l.trang_thai IN ('cho', 'da_chuyen') AND c.programme_code IN ('BE', 'ELE')
       UNION ALL
       SELECT e.class_id, c.programme_code, NULL, 1, e.id FROM enrollments e JOIN classes c ON c.id = e.class_id
        WHERE e.student_id = ? AND e.status = 'active' AND c.is_fast_track = 0 AND c.programme_code IN ('BE', 'ELE')
       UNION ALL
       SELECT lt.class_id, c.programme_code, (SELECT e.class_id FROM enrollments e JOIN classes f ON f.id = e.class_id
                                                WHERE e.student_id = lt.student_id AND e.status = 'active' AND f.is_fast_track = 1 ORDER BY e.id DESC LIMIT 1), 2, lt.id
         FROM lo_trinh_tiep_theo lt JOIN classes c ON c.id = lt.class_id
        WHERE lt.student_id = ? AND lt.huong = 'fast_track' AND lt.da_ap_dung_luc IS NOT NULL AND c.programme_code IN ('BE', 'ELE')
     ) x ORDER BY x.uu, x.k DESC LIMIT 1`,
  ).get(sid, sid, sid) as any;
  if (!nguon) throw badRequest('Chỉ em lên FT từ lớp BE/ELE mới có kỳ vọng đầu ra.');
  const lopBeEle = nguon.class_id as number, ftClass = (nguon.ft_class ?? null) as number | null;
  const goiY = mt0TheoLop([{ sid, lop: lopBeEle, ct: nguon.programme_code }]).get(sid)?.goiY ?? null;
  if (!goiY) throw badRequest('Em chưa đủ điểm MT0 — chưa kết luận kỳ vọng đầu ra được.');
  if (typeof input.dat !== 'boolean') throw badRequest('Chọn Đạt hoặc Không đạt kỳ vọng đầu ra.');
  /* Cùng luật dòng với panel (`kiemDongKyVong`): không gửi kỹ năng → kỹ năng MT0 dưới ngưỡng; vẫn rỗng → 400. Học viên: lý do bắt buộc, vẫn có Case. */
  const coMon = Array.isArray(input.mon) && input.mon.length > 0;
  const dong = kiemDongKyVong({ sid, dat: input.dat, nguyenNhan: input.nguyenNhan, mon: coMon ? input.mon : goiY.monTruot, lyDo: input.ghiChu }, 'Kỳ vọng đầu ra');
  const { dat, nguyenNhan, mon } = dong, ghiChu = dong.lyDo;
  return tx(() => {
    const now = nowIso();
    conn.prepare(
      `INSERT INTO lo_trinh_tiep_theo (student_id, class_id, huong, ky_vong_dat, ky_vong_nguyen_nhan, ky_vong_mon, ky_vong_ghi_chu, updated_by, created_at, updated_at)
       VALUES (?,?, 'chua_quyet', ?,?,?,?,?,?,?)
       ON CONFLICT(student_id, class_id) DO UPDATE SET ky_vong_dat = excluded.ky_vong_dat, ky_vong_nguyen_nhan = excluded.ky_vong_nguyen_nhan,
         ky_vong_mon = excluded.ky_vong_mon, ky_vong_ghi_chu = excluded.ky_vong_ghi_chu, updated_by = excluded.updated_by, updated_at = excluded.updated_at`,
    ).run(sid, lopBeEle, dat ? 1 : 0, nguyenNhan, mon.length ? JSON.stringify(mon) : null, ghiChu, p.userId, now, now);
    const taoMoi = !dat && ftClass ? taoCaseKyVong(p, emDaSangFt([{ ...dong, fromClassId: lopBeEle, ftClassId: ftClass }])).tao : 0;
    const ftCycle = ftClass ? (conn.prepare(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active' AND route IS NOT NULL ORDER BY id DESC LIMIT 1`).get(sid) as any)?.id ?? null : null;
    const daCo = ftCycle ? (conn.prepare(`SELECT COUNT(*) n FROM sos_cases WHERE student_id = ? AND cycle_id = ? AND origin_kind = 'chuyen_cap' AND title LIKE 'Kỳ vọng đầu ra%'`).get(sid, ftCycle) as any).n as number : 0;
    writeAudit({ actorUserId: p.userId, action: 'cuoi_khoa.ket_luan_ft', entityType: 'student', entityId: sid, after: { dat, nguyenNhan, mon, taoMoi } });
    return {
      dat, nguyenNhan, mon, ghiChu, taoCaseTutor: taoMoi,
      luuY: !taoMoi && daCo ? 'Case kỳ vọng đầu ra đã tạo trước đó được giữ nguyên — giáo viên tự xử lý.' : null,
    };
  });
}

/** K4-23 vế 2: bài Cuối khoá bị dời quá tuần cuối khoá → MỘT thẻ Báo QL (không duyệt, QL nhắc GVCN). Chạy trong tx của `reportRegularNoShow`. */
export function baoLenCuoiKhoaDoiQuaHan(conn: any, a: { id: number; student_id: number; class_id: number }): void {
  const gvcn = (conn.prepare(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active' LIMIT 1`).get(a.class_id) as any)?.user_id ?? null;
  const lyDo = 'Bài Final Test bị dời quá tuần Final Test của lớp';
  taoYeuCau(conn, {
    loai: 'bao_len_cuoi_khoa', doiTuongLoai: 'attempt', doiTuongId: a.id, hocVienId: a.student_id, lopId: a.class_id, nguoiXin: null, hanDuyet: null, lyDo,
    duLieu: { viecKey: `cuoi_khoa:${a.id}`, ownerId: gvcn, lyDo },
  });
}

/**
 * PR-CT2 (§8): người giữ việc "Ghi Mini Test" = người giữ Kết quả của nhóm `mt:{lượt}` (`nguoiGiuKetQua` — nhóm chung → GVCN lớp em ĐANG học; không có → chủ Case),
 * không còn là Người dạy (GV cũ ở lớp của bài Final). Theo lô; khoá = id Mini Test.
 */
export function nguoiGiuMiniTest(rows: readonly { id: number; nhom: string; lop: number | null; owner: number | null }[]): Map<number, number | null> {
  return nguoiGiuKetQua(rows.map((r) => ({ id: r.id, topic: null, nhomBoTro: r.nhom, classId: r.lop, ownerUserId: r.owner })), demoToday());
}

/** `nguoiGiuMiniTest` cho MỘT Mini Test (`lop` = lớp em đang học): chủ Case = MIN owner trên nhóm. */
function nguoiGiuMotMiniTest(conn: any, mt: { id: number; nhom_bo_tro: string }, lop: number | null): number | null {
  const owner = (conn.prepare(`SELECT MIN(sc.owner_user_id) AS o FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id WHERE iv.nhom_bo_tro = ?`).get(mt.nhom_bo_tro) as any)?.o ?? null;
  return nguoiGiuMiniTest([{ id: mt.id, nhom: mt.nhom_bo_tro, lop, owner }]).get(mt.id) ?? null;
}

/** Người giữ việc Ghi Mini Test của nhóm `mt:{lượt}` (cùng `emConMiniTest().gv`: GVCN lớp em ĐANG học, không có thì chủ Case) — để `updateResult` cho đúng người có nút ở hồ sơ HV lưu được. */
export function laNguoiGiuMiniTestCuaPa(p: Principal, iv: { nhom_bo_tro?: string | null }): boolean {
  if (!iv.nhom_bo_tro?.startsWith('mt:')) return false;
  const conn = db();
  const mt = conn.prepare('SELECT id, student_id, nhom_bo_tro FROM mini_test WHERE nhom_bo_tro = ? AND ty_le IS NULL').get(iv.nhom_bo_tro) as any;
  if (!mt) return false;
  const lop = (conn.prepare(`SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1`).get(mt.student_id) as any)?.class_id ?? null;
  return nguoiGiuMotMiniTest(conn, mt, lop) === p.userId;
}

/** Em còn Mini Test CHƯA ghi (MỘT câu + người giữ theo lô): hạn, Case + PA để mở form, người giữ việc (`nguoiGiuMiniTest`). */
export function emConMiniTest(sids: readonly number[]): Map<number, { han: string; caseId: number | null; paId: number | null; gv: number | null }> {
  const dong: any[] = [];
  theoLo([...sids], (lo, ph) => {
    dong.push(...db().prepare(
      `SELECT m.id, m.student_id, m.han, m.nhom_bo_tro, MIN(iv.case_id) AS case_id, MIN(CASE WHEN iv.status IN ('planned', 'started') THEN iv.id END) AS pa_id,
              MIN(sc.owner_user_id) AS owner,
              (SELECT e.class_id FROM enrollments e WHERE e.student_id = m.student_id AND e.status = 'active' ORDER BY e.id DESC LIMIT 1) AS lop
         FROM mini_test m LEFT JOIN case_interventions iv ON iv.nhom_bo_tro = m.nhom_bo_tro LEFT JOIN sos_cases sc ON sc.id = iv.case_id
        WHERE m.ty_le IS NULL AND m.student_id IN (${ph}) GROUP BY m.id ORDER BY m.id`,
    ).all(...lo) as any[]);
  });
  const giu = nguoiGiuMiniTest(dong.map((r) => ({ id: r.id, nhom: r.nhom_bo_tro, lop: r.lop ?? null, owner: r.owner ?? null })));
  return new Map(dong.map((r) => [r.student_id as number, { han: r.han, caseId: r.case_id ?? null, paId: r.pa_id ?? null, gv: giu.get(r.id) ?? null }]));
}

/** Ai thấy việc "Ghi Mini Test" ở cột Việc tiếp theo: người giữ việc (`emConMiniTest().gv`), không có thì GVCN lớp em ĐANG học. */
export function nguoiGhiMiniTest(p: Principal, classId: number, mt: { han: string; caseId: number | null; paId: number | null; gv: number | null } | undefined) {
  if (!mt) return null;
  const laNguoiLam = mt.gv ? mt.gv === p.userId : isCoreTeacherOf(p, classId);
  return laNguoiLam ? { han: mt.han, caseId: mt.caseId, paId: mt.paId } : null;
}
