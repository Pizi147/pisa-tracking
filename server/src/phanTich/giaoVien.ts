/**
 * BẢNG PHÂN TÍCH GIÁO VIÊN (PR-Pb2-b, Q30-5, Q31-2, Q31-9, mockup 25) — một bảng, không phải chỉ số trong sổ. Mỗi cột ĐÚNG MỘT hàm tập trả
 * `Map<gvId, { dung: id[]; tong: id[] }>`; ô số, panel "Chấm điểm" và phép kiểm gọi cùng hàm (HOP_DONG_SO_LIEU §1). Nạp THEO LÔ cho cả chi nhánh +
 * khung + khoảng rồi gom theo người trong bộ nhớ: không câu SQL nào chạy một lần cho mỗi GV / lớp / em.
 *
 * Gán người (Q15): ô điểm → phân công ở HẠN NHẬP · kết quả, HV tiến bộ → phân công ở TUẦN THI · vi phạm → GVCN lớp vi phạm ở HẠN XỬ LÝ ·
 * Ghi kết quả PA, PA hiệu quả → người phụ trách Case. Phân công hiệu lực ở ngày d: `effective_from ≤ d ≤ effective_to` (ngày đổi: dòng mới thắng).
 */
import {
  COT_KET_QUA_GV, PERMISSIONS, baiId, khoangPtGv, kyNangPhuTrach, laChamCheo, nhanDotNgan, oTuTap, tenMonNgan, boMonLich,
  type ChiSoHoSoGv, type HangPtGv, type KhungPtGv, type OPtGv, type PhanTichGvKq,
} from '../../../shared/domain/index.ts';
import { phamViHoSoGv } from '../giaoVien/phamVi.ts';
import { db } from '../db.ts';
import { demoToday } from '../demoConfig.ts';
import { scopeFor, type Principal } from '../permissions.ts';
import { BUSINESS_TZ, addDays, badRequest, forbidden, notFound } from '../util.ts';
import { loadBundle, regularSkillViews, skillCells } from '../fasttrack/attempts.ts';
import { allProgrammes } from '../normal/regular.ts';
import { danhGiaMon } from '../classes/phanTichLop.ts';
import { metricSet, parseObligation, rowsFor, type MetricRow } from '../worklist/metrics.ts';
import { expectationFor } from '../fasttrack/scoring.ts';
import { tuanLich as tuanLichNgan } from '../../../shared/domain/hienThiNgay.ts';
import { mocTreNhapDiem, quaHanNhapDiem } from '../platform/week.ts';
import { paCoKetQua } from './hieuQuaPa.ts';
import { HV_DANG_HOC_SQL } from '../students/tamDung.ts';

const LO = 400;
const cho = (n: number) => Array.from({ length: n }, () => '?').join(',');
const theoLo = <T>(ds: readonly T[]) => Array.from({ length: Math.ceil(ds.length / LO) }, (_, i) => ds.slice(i * LO, (i + 1) * LO));
const ngayCach = (tu: string, den: string) => Math.round((Date.parse(`${den.slice(0, 10)}T00:00:00Z`) - Date.parse(`${tu.slice(0, 10)}T00:00:00Z`)) / 86_400_000);
/** Tiến độ KHÔNG tính chấm điểm (Q20): vắng đã xác nhận, huỷ phần thi, ngoài phạm vi, chờ duyệt dời, MT lịch sử — cùng tập `scoreDebt.ts`. */
const KHONG_TINH = new Set(['absent', 'cancelled', 'skipped', 'reschedule_pending', 'lich_su']);
/** Thứ tự môn ở dòng phụ "R · W1 · W2 · GVCN …". */
const THU_TU = ['tong_hop', 'listening', 'reading', 'writing', 'writing1', 'writing2', 'speaking'];

export type LocPtGv = { cn?: number | null; ct?: KhungPtGv; tu?: string | null; den?: string | null; thang?: string | null };
type Tap = Map<number, { dung: number[]; tong: number[] }>;
const them = (t: Tap, gv: number, id: number, dung: boolean) => {
  const x = t.get(gv) ?? { dung: [], tong: [] };
  t.set(gv, x);
  x.tong.push(id);
  if (dung) x.dung.push(id);
};

/** V5 (05 #8): "Việc đúng hạn" = gộp các tập việc có hạn (Ghi kết quả PA · Xử lý vi phạm) — đơn vị VIỆC, chỉ cộng độ dài (id hai tập có thể trùng số). */
const gopTap = (...ts: ({ dung: number[]; tong: number[] } | undefined)[]) => ({ dung: ts.flatMap((t) => t?.dung ?? []), tong: ts.flatMap((t) => t?.tong ?? []) });

type PhanCong = { id: number; gv: number; ten: string; lop: number; skill: string | null; core: boolean; tu: string; den: string | null };
type Lop = { id: number; ma: string; ct: string | null; xong: boolean };
/** Ngữ cảnh một lần nạp: quyền, khoảng, lớp của chi nhánh + khung, MỌI phân công của các lớp đó (một câu). */
export type NguCanhPtGv = {
  cn: number; tenChiNhanh: string; khung: KhungPtGv; tu: string; den: string; cuoi: string; thang: string | null; homNay: string;
  lop: Map<number, Lop>; pc: PhanCong[];
  /** Người dạy ô `skill` (kỹ năng phân công) của lớp ở ngày `d`; `skill = null` → GVCN. */
  nguoiLuc: (lop: number, skill: string | null, d: string) => number | null;
};

export function nguCanhPtGv(p: Principal, f: LocPtGv): NguCanhPtGv {
  const scope = scopeFor(p, PERMISSIONS.ANALYSIS_VIEW_TEACHER);
  if (scope.none) throw forbidden('Phân tích giáo viên dành cho Quản lý và Quản trị hệ thống.');
  const cn = f.cn ?? (!scope.all && scope.branchIds.length === 1 ? scope.branchIds[0] : null);
  if (cn == null) throw badRequest('Chọn một chi nhánh.');
  if (!scope.all && !scope.branchIds.includes(cn)) throw forbidden('Chi nhánh này nằm ngoài phạm vi bạn được xem.');
  return nguCanhCn(cn, f);
}

/** Ngữ cảnh của MỘT chi nhánh + khung, KHÔNG kiểm quyền — nơi gọi đã kiểm (bảng: `nguCanhPtGv`; hồ sơ GV theo kỳ: `phamViHoSoGv`). */
function nguCanhCn(cn: number, f: LocPtGv): NguCanhPtGv {
  const homNay = demoToday();
  const k = khoangPtGv(f, homNay);
  if ('loi' in k) throw badRequest(k.loi);
  const conn = db();
  const cb = conn.prepare(`SELECT name FROM branches WHERE id = ?`).get(cn) as any;
  if (!cb) throw notFound('Không tìm thấy chi nhánh này.');
  const khung = f.ct ?? 'ft';
  const lop = new Map<number, Lop>();
  const pc: PhanCong[] = [];
  /* Một câu: lớp của chi nhánh + khung kèm MỌI dòng phân công (kể cả đã kết thúc — gán người theo ngày). */
  for (const r of conn.prepare(
    `SELECT c.id AS lop, c.code, c.programme_code, c.status AS lop_status, ta.id, ta.user_id, u.full_name, ta.skill, ta.is_core, ta.effective_from, ta.effective_to
       FROM classes c LEFT JOIN teacher_assignments ta ON ta.class_id = c.id AND ta.status IN ('active', 'ended')
       LEFT JOIN users u ON u.id = ta.user_id
      WHERE c.branch_id = ? AND c.is_fast_track = ?`).all(cn, khung === 'ft' ? 1 : 0) as any[]) {
    lop.set(r.lop, { id: r.lop, ma: r.code, ct: r.programme_code ?? null, xong: r.lop_status !== 'active' });
    if (r.id) pc.push({ id: r.id, gv: r.user_id, ten: r.full_name, lop: r.lop, skill: r.skill ?? null, core: !!r.is_core, tu: r.effective_from, den: r.effective_to ?? null });
  }
  const theoO = new Map<string, PhanCong[]>();
  for (const a of pc) {
    const key = `${a.lop}|${a.core ? '' : a.skill ?? ''}`;
    if (a.core || a.skill) theoO.set(key, [...(theoO.get(key) ?? []), a]);
  }
  const nguoiLuc = (l: number, skill: string | null, d: string) => {
    const ds = (theoO.get(`${l}|${skill ?? ''}`) ?? []).filter((a) => a.tu <= d && (!a.den || a.den >= d));
    return ds.length ? ds.reduce((x, y) => (y.id > x.id ? y : x)).gv : null;
  };
  return { cn, tenChiNhanh: cb.name, khung, tu: k.tu, den: k.den, cuoi: addDays(k.den, 6), thang: f.thang ?? null, homNay, lop, pc, nguoiLuc };
}

// ------------------------------------------------------------------ bài thi trong khoảng: một lần nạp cho Chấm điểm, Kết quả, HV tiến bộ

type OBai = {
  id: number; attemptId: number; classId: number; studentId: number; hocVien: string; skill: string; tuan: string; han: string | null;
  nhapDau: string | null; band: number | null; coDiem: boolean; tienDo: string; noShow: boolean;
  /** Q2: em đang học — chỉ tập Chấm điểm lọc theo cờ này; Kết quả / Tiến bộ giữ bài đã có điểm của em đã thôi học. */
  dangHoc: boolean; kck: boolean; bai: string;
  /** T18 (PR-LT3): loại lượt + GV chấm Speaking đã ghi (`examiner_user_id`) — ô Speaking Mock tính cho người chấm, không cho GVBM S. */
  kind: string; examinerUserId: number | null;
};
type NapBai = { o: OBai[]; attempts: Map<number, any>; bundle: ReturnType<typeof loadBundle> };

/**
 * Mọi ô điểm (một kỹ năng một lượt) có TUẦN THI CỦA CHÍNH Ô ĐÓ trong khoảng, ở lớp của chi nhánh + khung — `skillCells` / `regularSkillViews` như `scoreDebt.ts`.
 * PR-S6F-a Q19: `classId` của ô = LỚP EM HỌC Ở TUẦN THI (ghi danh hiệu lực trong tuần đó, một câu theo lô) — chuyển lớp giữ khoá dời lượt `planned`
 * sang lớp mới (`luatLoTrinh.ts`) nhưng ô đã thi vẫn tính cho người dạy em lúc thi. Không có ghi danh khớp → lớp của lượt.
 * ponytail: chỉ nạp lượt ĐANG ở lớp của chi nhánh + khung — lượt đã dời sang lớp chi nhánh khác không còn ở bảng chi nhánh cũ (chuyển chi nhánh giữ khoá hiếm);
 * cần thì nạp thêm theo ghi danh.
 */
export function napBai(p: Principal, c: NguCanhPtGv): NapBai {
  const conn = db();
  const rows: any[] = [];
  for (const lo of theoLo([...c.lop.keys()])) {
    rows.push(...conn.prepare(
      `SELECT a.*, pg.scoring_mode, cl.programme_code, rp.week_start AS period_start, rp.week_end AS period_end, rp.code AS period_code,
              cy.target_score, cy.khong_cam_ket, cy.route, s.full_name AS hv_ten, (${HV_DANG_HOC_SQL('s')}) AS dang_hoc
         FROM assessment_attempts a
         JOIN classes cl ON cl.id = a.class_id
         JOIN students s ON s.id = a.student_id
         LEFT JOIN programmes pg ON pg.code = cl.programme_code
         LEFT JOIN report_periods rp ON rp.id = a.planned_period_id
         LEFT JOIN learning_cycles cy ON cy.id = a.cycle_id
        WHERE a.class_id IN (${cho(lo.length)}) AND a.status != 'cancelled'
          AND (EXISTS (SELECT 1 FROM attempt_skills k JOIN report_periods r2 ON r2.id = k.planned_period_id
                        WHERE k.attempt_id = a.id AND r2.week_start BETWEEN ? AND ?)
               OR (NOT EXISTS (SELECT 1 FROM attempt_skills k2 WHERE k2.attempt_id = a.id) AND rp.week_start BETWEEN ? AND ?))`,
    ).all(...lo, c.tu, c.den, c.tu, c.den) as any[]);
  }
  const bundle = loadBundle(rows.map((r) => r.id));
  const programmes = allProgrammes();
  const ghiDanh = new Map<number, { lop: number; tu: string; den: string | null }[]>();
  for (const lo of theoLo([...new Set(rows.map((r) => r.student_id as number))])) {
    for (const e of conn.prepare(
      `SELECT student_id, class_id, substr(started_at, 1, 10) AS tu, substr(ended_at, 1, 10) AS den FROM enrollments WHERE student_id IN (${cho(lo.length)})`,
    ).all(...lo) as any[]) (ghiDanh.get(e.student_id) ?? ghiDanh.set(e.student_id, []).get(e.student_id)!).push({ lop: e.class_id, tu: e.tu, den: e.den });
  }
  /* Lớp lúc thi: ghi danh bắt đầu trước hết tuần thi và chưa kết thúc trước tuần thi; nhiều dòng → dòng bắt đầu muộn nhất. */
  const lopLucThi = (sid: number, tuan: string, lopLuot: number) => {
    const cuoi = addDays(tuan, 6);
    const ds = (ghiDanh.get(sid) ?? []).filter((e) => e.tu && e.tu <= cuoi && (!e.den || e.den > tuan));
    return ds.length ? ds.reduce((x, y) => (y.tu > x.tu ? y : x)).lop : lopLuot;
  };
  const o: OBai[] = [];
  for (const a of rows) {
    const scores = bundle.scores.get(a.id) ?? [];
    const chung = (skill: string, v: { weekStart: string | null; deadline: string | null; progress: string; noShow: boolean }) => {
      if (!v.weekStart || v.weekStart < c.tu || v.weekStart > c.den) return;
      const lop = lopLucThi(a.student_id, v.weekStart, a.class_id);
      if (!c.lop.has(lop)) return;   // lớp lúc thi ngoài chi nhánh + khung đang xem
      const row = scores.find((s) => s.skill === skill);
      o.push({
        id: baiId(a.id, skill), attemptId: a.id, classId: lop, studentId: a.student_id, hocVien: a.hv_ten, skill, tuan: v.weekStart, han: v.deadline,
        nhapDau: row?.nhap_dau_ngay ?? null, band: row?.band ?? null,
        coDiem: (row?.band ?? null) !== null || (row?.raw_score ?? null) !== null, tienDo: v.progress, noShow: v.noShow,
        dangHoc: !!a.dang_hoc, kck: !!a.khong_cam_ket, bai: nhanDotNgan(a.kind, a.attempt_no) ?? '',
        kind: a.kind, examinerUserId: row?.examiner_user_id ?? null,
      });
    };
    if (a.scoring_mode === 'ratio') {
      const bo = boMonLich(a.programme_code, programmes.get(a.programme_code)?.skills);
      const views = regularSkillViews(a, bundle.skillRows.get(a.id), scores, c.homNay, bo);
      for (const skill of bo) {
        const v = views.get(skill);
        if (v && v.required) chung(skill, { weekStart: v.weekStart, deadline: v.deadline, progress: v.progress, noShow: false });
      }
    } else {
      for (const x of skillCells(p, a, scores, bundle.skips.get(a.id) ?? [], c.homNay, bundle.skillRows.get(a.id))) {
        if (x.required) chung(x.skill, { weekStart: x.weekStart, deadline: x.deadline, progress: x.progress, noShow: x.noShow !== null });
      }
    }
  }
  return { o, attempts: new Map(rows.map((r) => [r.id, r])), bundle };
}

// ------------------------------------------------------------------ cột 1 · Chấm điểm (mục = ô điểm, `baiId`)

export type DongChamDiem = {
  id: number; studentId: number; hocVien: string; lop: string; bai: string; mon: string; tuan: string; han: string;
  nhapDau: string | null; tre: number | null; dung: boolean;
};
/**
 * Q13, Q20: ô có tuần thi trong khoảng, gán cho người được phân công ở HẠN NHẬP. Đúng hạn ⇔ `nhap_dau_ngay ≤ mốc trễ` (sửa sau không tính);
 * chưa nhập mà đã quá hạn = trễ. PR-S6F-a Q6: mốc trễ = `mocTreNhapDiem` (max(hạn, Chủ nhật tuần thi)), quá hạn = `quaHanNhapDiem` — một luật
 * với Nợ điểm / Việc / Lịch Test; số ngày trễ đếm từ mốc. Panel vẫn hiện HẠN (mốc chỉ để tính). Không tính: vắng / huỷ / ngoài phạm vi / chờ duyệt dời / MT lịch sử / dấu "-" / em không đang học (Q2) / ô chưa tới hạn chưa nhập.
 */
export function tapChamDiem(c: NguCanhPtGv, nap: NapBai): { tap: Tap; dong: Map<number, DongChamDiem & { gv: number }>; khongTinh: Map<number, number> } {
  const tap: Tap = new Map();
  const dong = new Map<number, DongChamDiem & { gv: number }>();
  const khongTinh = new Map<number, number>();
  for (const x of nap.o) {
    if (!x.han) continue;
    const l = c.lop.get(x.classId)!;
    /* T18: Speaking Mock chưa nhập → không trễ cho ai; đã nhập → của GV chấm đã ghi (người ngoài / trống → bỏ qua). */
    const gv = laChamCheo(x.kind, x.skill) ? (x.nhapDau ? x.examinerUserId : null)
      : kyNangPhuTrach(l.ct, x.skill).map((k) => c.nguoiLuc(x.classId, k, x.han!)).find((g) => g != null) ?? null;
    if (gv == null) continue;
    const boQua = KHONG_TINH.has(x.tienDo) || x.noShow || !x.dangHoc;
    if (boQua || (!x.nhapDau && !quaHanNhapDiem(x.han, x.tuan, c.homNay))) {
      if (x.tienDo === 'absent') khongTinh.set(gv, (khongTinh.get(gv) ?? 0) + 1);
      continue;
    }
    const moc = mocTreNhapDiem(x.han, x.tuan);
    const dung = !!x.nhapDau && x.nhapDau <= moc;
    them(tap, gv, x.id, dung);
    dong.set(x.id, {
      id: x.id, gv, studentId: x.studentId, hocVien: x.hocVien, lop: l.ma, bai: x.bai, mon: tenMonNgan(l.ct, x.skill), tuan: x.tuan, han: x.han,
      nhapDau: x.nhapDau, dung, tre: dung ? null : ngayCach(moc, x.nhapDau ?? c.homNay),
    });
  }
  return { tap, dong, khongTinh };
}

// ------------------------------------------------------------------ cột 5 · Kết quả môn (mục = ô có điểm, `baiId`) + cột 6 · HV tiến bộ

/** Một mục cột Kết quả: ô có điểm (MT / bài lớp thường) hoặc một kỹ năng thi thật; `ovr`, `kv` để panel ghi lý do. */
type MucKq = { x: OBai; dat: boolean; ovr: number | null; kv: number | null };

/**
 * V5 C09, C10 (brief mục 15 — chỉ cho đánh giá GV, KHÔNG đổi SOS / Case):
 *   FT MT       `danhGiaMon` (luật Overall một chỗ, cùng tab Phân tích lớp / hồ sơ GV): Overall lượt ≥ kỳ vọng → mọi kỹ năng có điểm Đạt (điểm thật
 *               vẫn hiện ở panel); chưa đạt → từng kỹ năng; Overall chưa có → "Chưa đủ dữ liệu", ra khỏi mẫu.
 *   Thi thật    cùng luật với Overall so Target đầu ra (`mucThiThat`).
 *   Lớp thường  `danhGiaMon` (≥ 70 % từng môn) như cũ. Em KCK (FT) không tính (OV-9).
 */
function mucKetQua(c: NguCanhPtGv, nap: NapBai): MucKq[] {
  const progs = allProgrammes();
  const kl = new Map<number, Omit<MucKq, 'x'>>();
  for (const a of nap.attempts.values()) {
    /* PR-NT: Target lớp thường không bật FT (chủ sản phẩm 04/10) — KCK chỉ bỏ lượt FT; lớp thường chấm tỷ lệ, không kỳ vọng nên vẫn tính. */
    if (a.khong_cam_ket && a.scoring_mode !== 'ratio') continue;
    const ratio = a.scoring_mode === 'ratio';
    const scores = nap.bundle.scores.get(a.id) ?? [];
    const g = danhGiaMon(a, scores, ratio ? progs.get(a.programme_code) ?? null : null, a.target_score ?? null, nap.bundle.skips.get(a.id) ?? []);
    if (!g) continue;
    for (const m of g.mon) kl.set(baiId(a.id, m.skill), { dat: m.dat, ovr: g.ovr, kv: g.kv });
  }
  const out = nap.o.flatMap((x) => { const k = kl.get(x.id); return k ? [{ x, ...k }] : []; });
  return c.khung === 'ft' ? [...out, ...mucThiThat(c)] : out;
}

/**
 * V5 C10: kết quả thi thật (đủ 4 kỹ năng, ngày thi trong khoảng, đã kết luận Đạt / Chưa đạt Target) — mỗi kỹ năng một mục, gán người dạy kỹ năng đó
 * ở LỚP CUỐI TRƯỚC NGÀY THI (ghi danh bắt đầu muộn nhất ≤ ngày thi), ngày thi. W thi thật tính cho cả cột W1 và W2. Id âm: không trùng `baiId` của MT.
 * Overall đạt Target (`outcome`, máy tính lúc nhập) → mọi kỹ năng Đạt; chưa đạt → kỹ năng ≥ Target mới Đạt. Em KCK / "Không thi" không tính.
 */
function mucThiThat(c: NguCanhPtGv): MucKq[] {
  const conn = db();
  const ds = conn.prepare(
    `SELECT cy.id, cy.student_id, s.full_name, cy.thi_that_ngay AS ngay, cy.thi_that_l, cy.thi_that_r, cy.thi_that_w, cy.thi_that_s,
            cy.outcome, cy.outcome_score, cy.target_score
       FROM learning_cycles cy JOIN students s ON s.id = cy.student_id
      WHERE cy.thi_that_ngay IS NOT NULL AND cy.thi_that_ngay BETWEEN ? AND ? AND COALESCE(cy.thi_that_khong_thi, 0) = 0 AND COALESCE(cy.khong_cam_ket, 0) = 0
        AND cy.outcome IN ('reached', 'not_reached') AND cy.target_score IS NOT NULL
        AND cy.thi_that_l IS NOT NULL AND cy.thi_that_r IS NOT NULL AND cy.thi_that_w IS NOT NULL AND cy.thi_that_s IS NOT NULL`,
  ).all(c.tu, c.cuoi) as any[];
  const ghiDanh = new Map<number, { lop: number; tu: string; id: number }[]>();
  for (const lo of theoLo([...new Set(ds.map((r) => r.student_id as number))])) {
    for (const e of conn.prepare(`SELECT id, student_id, class_id, substr(started_at, 1, 10) AS tu FROM enrollments WHERE student_id IN (${cho(lo.length)})`).all(...lo) as any[]) {
      (ghiDanh.get(e.student_id) ?? ghiDanh.set(e.student_id, []).get(e.student_id)!).push({ lop: e.class_id, tu: e.tu, id: e.id });
    }
  }
  const out: MucKq[] = [];
  for (const r of ds) {
    const truoc = (ghiDanh.get(r.student_id) ?? []).filter((e) => e.tu && e.tu <= r.ngay);
    const lop = truoc.length ? truoc.reduce((x, y) => (y.tu > x.tu || (y.tu === x.tu && y.id > x.id) ? y : x)).lop : null;
    if (lop == null || !c.lop.has(lop)) continue;
    const kv = Number(r.target_score);
    for (const [skill, band] of [['listening', r.thi_that_l], ['reading', r.thi_that_r], ['writing1', r.thi_that_w], ['writing2', r.thi_that_w], ['speaking', r.thi_that_s]] as const) {
      out.push({
        x: {
          id: -baiId(r.id, skill), attemptId: 0, classId: lop, studentId: r.student_id, hocVien: r.full_name, skill, tuan: r.ngay, han: null,
          nhapDau: null, band, coDiem: true, tienDo: '', noShow: false, dangHoc: true, kck: false, bai: 'Thi thật', kind: 'thi-that', examinerUserId: null,
        },
        dat: r.outcome === 'reached' || band >= kv, ovr: r.outcome_score ?? null, kv,
      });
    }
  }
  return out;
}

/** Q15: mục của `mucKetQua`, gán cho người dạy môn đó ở TUẦN THI (thi thật: ngày thi). */
function tapKetQua(c: NguCanhPtGv, muc: readonly MucKq[]): Map<string, Tap & { lop?: Map<number, Set<number>> }> {
  const out = new Map<string, Tap>();
  const lop = new Map<string, Map<number, Set<number>>>();
  for (const { x, dat: d } of muc) {
    if (!(COT_KET_QUA_GV[c.khung] as readonly string[]).includes(x.skill)) continue;   // ponytail: Pre FOU "Tổng hợp" không có cột
    const gv = c.nguoiLuc(x.classId, x.skill, x.tuan);
    if (gv == null) continue;
    const t = out.get(x.skill) ?? new Map();
    out.set(x.skill, t);
    them(t, gv, x.id, d);
    const lm = lop.get(x.skill) ?? new Map<number, Set<number>>();
    lop.set(x.skill, lm);
    lm.set(gv, (lm.get(gv) ?? new Set<number>()).add(x.classId));
  }
  return new Map([...out].map(([k, t]) => [k, Object.assign(t, { lop: lop.get(k) })]));
}

/** Q21 (FT): mục = ô có điểm mà em ĐÃ có điểm kỹ năng đó ở lượt MT gần nhất trước đó (bất kỳ lớp); tiến bộ ⇔ band cao hơn. W1, W2 riêng. KCK vẫn tính. */
function tapTienBo(c: NguCanhPtGv, nap: NapBai): Tap & { lop?: Map<number, Set<number>> } {
  const tap: Tap = new Map();
  const lop = new Map<number, Set<number>>();
  const coBand = nap.o.filter((x) => x.band !== null && (nap.attempts.get(x.attemptId)?.kind ?? 'mock') === 'mock');
  const em = [...new Set(coBand.map((x) => x.studentId))];
  const truoc = new Map<string, { tuan: string; id: number; band: number }[]>();
  for (const lo of theoLo(em)) {
    for (const r of db().prepare(
      `SELECT a.id, a.student_id, s.skill, s.band, COALESCE(rp.week_start, '') AS tuan
         FROM assessment_scores s JOIN assessment_attempts a ON a.id = s.attempt_id LEFT JOIN report_periods rp ON rp.id = a.planned_period_id
        WHERE a.student_id IN (${cho(lo.length)}) AND COALESCE(a.kind, 'mock') = 'mock' AND a.status != 'cancelled' AND s.band IS NOT NULL`,
    ).all(...lo) as any[]) {
      const k = `${r.student_id}|${r.skill}`;
      truoc.set(k, [...(truoc.get(k) ?? []), { tuan: r.tuan, id: r.id, band: r.band }]);
    }
  }
  for (const x of coBand) {
    const tuanBai = nap.attempts.get(x.attemptId)?.period_start ?? x.tuan;
    const cu = (truoc.get(`${x.studentId}|${x.skill}`) ?? [])
      .filter((t) => t.id !== x.attemptId && (t.tuan < tuanBai || (t.tuan === tuanBai && t.id < x.attemptId)))
      .sort((a, b) => a.tuan.localeCompare(b.tuan) || a.id - b.id).pop();
    if (!cu) continue;
    const gv = c.nguoiLuc(x.classId, x.skill, x.tuan);
    if (gv == null) continue;
    them(tap, gv, x.id, x.band! > cu.band);
    lop.set(gv, (lop.get(gv) ?? new Set<number>()).add(x.classId));
  }
  return Object.assign(tap, { lop });
}

// ------------------------------------------------------------------ cột 2 · Ghi kết quả PA (mục = nghĩa vụ cập nhật)

/** Cùng tập `metricSet('dung-han-cap-nhat')` (hạn trong khoảng, cùng khung) → Case → người phụ trách. Nghĩa vụ của Case không người phụ trách: không hàng. */
export function tapGhiKetQuaPa(p: Principal, c: NguCanhPtGv): { tap: Tap; khongNguoi: number } {
  const r = metricSet(p, 'dung-han-cap-nhat', { branchId: c.cn, program: c.khung, from: c.tu, to: c.cuoi });
  const dung = new Set(r.numeratorIds ?? []);
  const chu = new Map<number, number | null>();
  const iv = [...new Set(r.ids.map((id) => parseObligation(id).interventionId))];
  for (const lo of theoLo(iv)) {
    for (const x of db().prepare(
      `SELECT iv.id, sc.owner_user_id FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id WHERE iv.id IN (${cho(lo.length)})`,
    ).all(...lo) as any[]) chu.set(x.id, x.owner_user_id ?? null);
  }
  const tap: Tap = new Map();
  let khongNguoi = 0;
  for (const id of r.ids) {
    const gv = chu.get(parseObligation(id).interventionId) ?? null;
    if (gv == null) khongNguoi += 1;
    else them(tap, gv, id, dung.has(id));
  }
  return { tap, khongNguoi };
}

// ------------------------------------------------------------------ cột 3 · Xử lý vi phạm (mục = vi phạm)

/**
 * Q14, Q15: vi phạm có HẠN XỬ LÝ CHỐT trong khoảng, ở lớp của chi nhánh + khung, gán cho GVCN lớp vi phạm ở hạn đó. Đúng hạn ⇔ `phan_hoi_ngay ≤ han_xu_ly`
 * (thời gian chờ QL duyệt không tính); chưa phản hồi mà hôm nay > hạn = trễ; chưa tới hạn chưa phản hồi: chưa tính.
 * ponytail: vi phạm không lớp (`class_id` NULL) không tính — dữ liệu nhập đều có lớp.
 */
export function tapXuLyViPham(c: NguCanhPtGv): Tap & { lop?: Map<number, Set<number>> } {
  const tap: Tap = new Map();
  const lop = new Map<number, Set<number>>();
  for (const lo of theoLo([...c.lop.keys()])) {
    for (const v of db().prepare(
      `SELECT v.id, v.class_id, v.han_xu_ly, v.phan_hoi_ngay FROM violations v
         JOIN students s ON s.id = v.student_id AND ${HV_DANG_HOC_SQL('s')}   -- Q2: em không đang học không bị tính trễ
        WHERE v.valid = 1 AND v.class_id IN (${cho(lo.length)}) AND v.han_xu_ly BETWEEN ? AND ?`,
    ).all(...lo, c.tu, c.cuoi) as any[]) {
      if (!v.phan_hoi_ngay && c.homNay <= v.han_xu_ly) continue;
      const gv = c.nguoiLuc(v.class_id, null, v.han_xu_ly);
      if (gv == null) continue;
      them(tap, gv, v.id, !!v.phan_hoi_ngay && v.phan_hoi_ngay <= v.han_xu_ly);
      lop.set(gv, (lop.get(gv) ?? new Set<number>()).add(v.class_id));
    }
  }
  return Object.assign(tap, { lop });
}

// ------------------------------------------------------------------ cột 4 · PA hiệu quả (FT)

/**
 * Q16 (FT): PA giáo viên tự thêm (không PA theo quy chế) có kết quả trong khoảng — CHÍNH `paCoKetQua` của Hiệu quả PA (Pb2-a), cùng chi nhánh +
 * khung + khoảng, gán cho người phụ trách Case; đúng ⇔ nhóm "success". Ô = Hiệu quả PA lọc `gv` cùng khoảng.
 */
export function tapPaHieuQua(c: NguCanhPtGv): Tap {
  const tap: Tap = new Map();
  for (const r of paCoKetQua({ branchIds: [c.cn], ct: c.khung, tu: c.tu, den: c.den })) {
    if (!r.quyChe && r.chuCase != null) them(tap, r.chuCase, r.id, r.group === 'success');
  }
  return tap;
}

// ------------------------------------------------------------------ bảng

export function phanTichGiaoVien(p: Principal, f: LocPtGv): PhanTichGvKq {
  const c = nguCanhPtGv(p, f);
  const conn = db();
  /* Hàng: người có phân công ở lớp của khung trong khoảng. Lớp đã kết thúc (dòng phân công không đóng ngày) chỉ tính khi còn bài trong khoảng. */
  const nap = napBai(p, c);
  const lopCoBai = new Set(nap.o.map((x) => x.classId));
  const trongKhoang = c.pc.filter((a) => a.tu <= c.cuoi && (!a.den || a.den >= c.tu) && (!c.lop.get(a.lop)!.xong || lopCoBai.has(a.lop)));
  const nguoi = new Map<number, string>();
  for (const a of trongKhoang) nguoi.set(a.gv, a.ten);
  const cham = tapChamDiem(c, nap).tap;
  const ghi = tapGhiKetQuaPa(p, c).tap;
  const vp = tapXuLyViPham(c);
  const kq = tapKetQua(c, mucKetQua(c, nap));
  const ft = c.khung === 'ft';
  const tb = ft ? tapTienBo(c, nap) : null;
  const pa = ft ? tapPaHieuQua(c) : null;

  /* Đang dạy (Q17): phân công hiệu lực ở min(cuối khoảng, hôm nay) + học viên đang học của các lớp đó — một câu theo lô. */
  const ngayDay = c.cuoi < c.homNay ? c.cuoi : c.homNay;
  const lopDay = new Map<number, Set<number>>();
  for (const a of c.pc) if (!c.lop.get(a.lop)!.xong && a.tu <= ngayDay && (!a.den || a.den >= ngayDay)) lopDay.set(a.gv, (lopDay.get(a.gv) ?? new Set<number>()).add(a.lop));
  const hvLop = new Map<number, Set<number>>();
  for (const lo of theoLo([...new Set([...lopDay.values()].flatMap((s) => [...s]))])) {
    for (const r of conn.prepare(
      `SELECT e.class_id, e.student_id FROM enrollments e JOIN students s ON s.id = e.student_id
        WHERE e.class_id IN (${cho(lo.length)}) AND e.status = 'active' AND s.archived_at IS NULL`).all(...lo) as any[]) {
      hvLop.set(r.class_id, (hvLop.get(r.class_id) ?? new Set<number>()).add(r.student_id));
    }
  }

  const hang: HangPtGv[] = [];
  for (const [id, ten] of nguoi) {
    const cua = trongKhoang.filter((a) => a.gv === id);
    const mon = [...new Set(cua.filter((a) => !a.core && a.skill).map((a) => a.skill!))];
    const lopCn = [...new Set(cua.filter((a) => a.core).map((a) => c.lop.get(a.lop)!.ma))].sort((x, y) => x.localeCompare(y, 'vi'));
    const nhanMon = [...new Set(mon.sort((x, y) => THU_TU.indexOf(x) - THU_TU.indexOf(y))
      .map((k) => tenMonNgan(c.lop.get(cua.find((a) => a.skill === k)!.lop)!.ct, k)))];
    const day = lopDay.get(id) ?? new Set<number>();
    const coMon = mon.length > 0;
    const vpO = oTuTap(lopCn.length > 0, vp.get(id));
    const vpLop = [...(vp.lop?.get(id) ?? [])];
    const ketQua: HangPtGv['ketQua'] = {};
    for (const k of COT_KET_QUA_GV[c.khung]) {
      const t = kq.get(k);
      const o: OPtGv & { lop?: number[] } = oTuTap(mon.includes(k), t?.get(id));
      if (o.k === 'so') o.lop = [...(t?.lop?.get(id) ?? [])];
      ketQua[k] = o;
    }
    const h: HangPtGv = {
      id, ten,
      phu: [...nhanMon, ...(lopCn.length ? [`GVCN ${lopCn.join(', ')}`] : [])].join(' · '),
      dangDay: { lop: day.size, hv: new Set([...day].flatMap((l) => [...(hvLop.get(l) ?? [])])).size },
      chamDiem: oTuTap(coMon, cham.get(id)),
      ghiKetQuaPa: oTuTap(true, ghi.get(id)),
      xuLyViPham: vpO.k === 'so' ? { ...vpO, lopGvcn: vpLop } : vpO,
      /* shortcut: chưa có việc Báo PH (SV-TVV) — PR đó thêm tập của nó vào `gopTap` ở đây và ở `chiSoHoSoGv`. */
      viecDungHan: oTuTap(true, gopTap(ghi.get(id), vp.get(id))),
      ketQua,
    };
    if (ft) {
      h.paHieuQua = oTuTap(true, pa!.get(id));
      const t = oTuTap(coMon, tb!.get(id));
      h.tienBo = t.k === 'so' ? { ...t, lop: [...(tb!.lop?.get(id) ?? [])] } : t;
    }
    hang.push(h);
  }
  hang.sort((a, b) => a.ten.localeCompare(b.ten, 'vi') || a.id - b.id);
  return { cn: c.cn, tenChiNhanh: c.tenChiNhanh, khung: c.khung, tu: c.tu, den: c.den, thang: c.thang, homNay: c.homNay, hang };
}

/** Dòng của một tập (đúng / trễ) kèm cờ `dung` và loại việc ở đầu dòng phụ — panel gộp nhiều tập (Việc đúng hạn). */
function dongTheoTap(tap: { dung: number[]; tong: number[] } | undefined, dong: (ids: number[]) => MetricRow[], loai?: string) {
  const dung = new Set(tap?.dung ?? []);
  const ids = [...(tap?.tong ?? [])].sort((a, b) => Number(dung.has(a)) - Number(dung.has(b)) || a - b);
  return dong(ids).map((row, i) => ({
    dung: dung.has(ids[i]),
    row: loai ? { ...row, sub: [loai, row.sub, dung.has(ids[i]) ? 'Đúng hạn' : 'Quá hạn'].filter(Boolean).join(' · ') } : row,
  }));
}

/**
 * PANEL "Chấm điểm" của một GV (mockup 25 màn C): ĐÚNG các ô tạo nên số ở bảng (cùng `tapChamDiem`). Trễ trước, rồi lớp, rồi tên.
 * "Sửa sau": ô có lần sửa ghi lý do (RB-5) trong nhật ký — ngày sửa lấy từ nhật ký, đổi sang ngày giờ VN (PR-S6F-a).
 * ponytail: ngày nhật ký là ngày MÁY (giờ VN), không phải ngày nghiệp vụ — bản demo đặt ngày demo thì "sửa" có thể sau "hôm nay"; ghi ngày nghiệp vụ
 * vào `after_json` nếu cần khớp tuyệt đối.
 */
export function oChamDiemGv(p: Principal, f: LocPtGv & { gv: number }): {
  ten: string; tenChiNhanh: string; khung: KhungPtGv; tu: string; den: string; n: number; tre: number; khongTinhVang: number;
  rows: (DongChamDiem & { sua: string | null })[];
} {
  const c = nguCanhPtGv(p, f);
  /* PR-S6F-a: chỉ GV có phân công ở lớp của chi nhánh + khung — không trả tên tài khoản bất kỳ qua `gv=`. */
  const ten = c.pc.find((a) => a.gv === f.gv)?.ten;
  if (!ten) throw notFound('Giáo viên không có lớp ở chi nhánh này.');
  const r = tapChamDiem(c, napBai(p, c));
  const rows = [...r.dong.values()].filter((d) => d.gv === f.gv);
  const conn = db();
  /* Lần sửa có lý do: FT ghi theo lượt + nhãn kỹ năng, lớp thường theo dòng điểm — một câu mỗi lô. Nhật ký ghi giờ UTC → ngày VN. */
  const ngayVn = new Intl.DateTimeFormat('en-CA', { timeZone: BUSINESS_TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
  const sua = new Map<number, string>();
  const attemptIds = [...new Set(rows.map((d) => Math.floor(d.id / 10)))];
  for (const lo of theoLo(attemptIds)) {
    for (const x of conn.prepare(
      `SELECT al.entity_id AS a, al.entity_label AS k, MAX(al.created_at) AS luc FROM audit_logs al
        WHERE al.entity_type = 'assessment_attempt' AND al.entity_id IN (${cho(lo.length)}) AND al.action IN ('score.edit', 'score.override')
          AND al.after_json LIKE '%"lyDo"%' GROUP BY al.entity_id, al.entity_label
       UNION ALL
       SELECT sc.attempt_id, sc.skill, MAX(al.created_at) FROM audit_logs al JOIN assessment_scores sc ON sc.id = al.entity_id
        WHERE al.entity_type = 'assessment_score' AND sc.attempt_id IN (${cho(lo.length)}) AND al.action IN ('regular.score', 'regular.score.override')
          AND al.after_json LIKE '%"lyDo"%' GROUP BY sc.attempt_id, sc.skill`,
    ).all(...lo, ...lo) as any[]) sua.set(baiId(x.a, x.k), ngayVn.format(new Date(String(x.luc))));
  }
  const out = rows.map((d) => ({ ...d, sua: sua.get(d.id) ?? null }))
    .sort((a, b) => Number(a.dung) - Number(b.dung) || a.lop.localeCompare(b.lop, 'vi') || a.hocVien.localeCompare(b.hocVien, 'vi') || a.id - b.id);
  return {
    ten, tenChiNhanh: c.tenChiNhanh, khung: c.khung, tu: c.tu, den: c.den, n: out.filter((d) => d.dung).length, tre: out.filter((d) => !d.dung).length,
    khongTinhVang: r.khongTinh.get(f.gv) ?? 0, rows: out,
  };
}

/**
 * OV-15e (C30, mockup 3 mục 4c): PANEL CỦA MỘT CHỈ SỐ KHÁC "Chấm điểm" — đúng GV + đúng khoảng, CÙNG hàm tập với ô bảng (số = số dòng; `0/20` mở 20 mục).
 * `cot`: `ket-qua:<kỹ năng>` · `tien-bo` · `ghi-pa` · `vi-pham` · `pa-hieu-qua`. Dòng chưa đạt / trễ lên đầu.
 */
export function oChiSoGv(p: Principal, f: LocPtGv & { gv: number; cot: string }): { n: number; tieuDe: string; rows: MetricRow[] } {
  const c = nguCanhPtGv(p, f);
  const ten = c.pc.find((a) => a.gv === f.gv)?.ten;
  if (!ten) throw notFound('Giáo viên không có lớp ở chi nhánh này.');
  const r = oChiSoCua(p, c, f.gv, f.cot);
  return { n: r.dong.length, tieuDe: `${r.nhan} · ${ten} · ${r.dung}/${r.dong.length}${r.donVi ? ` ${r.donVi}` : ''}`, rows: r.dong.map((d) => d.row) };
}

/**
 * Dòng của MỘT cột cho MỘT GV trong MỘT ngữ cảnh (chi nhánh + khung + khoảng) — panel bảng (`oChiSoGv`) và hồ sơ GV theo kỳ (`oChiSoHoSoGv`) gọi chung,
 * cùng hàm tập với số ở ô. `cot` thêm cho hồ sơ: `cham-diem` (Điểm đúng hạn, bài) · `ket-qua` (mọi kỹ năng của khung). Dòng trễ / chưa đạt trước.
 * K5: đơn vị ghi sau tử / mẫu — kết quả, tiến bộ đếm "lượt kỹ năng" (một lượt × một kỹ năng GV dạy), không gọi chung "HV".
 */
function oChiSoCua(p: Principal, c: NguCanhPtGv, gv: number, cot: string): { nhan: string; donVi: string; dung: number; dong: { dung: boolean; row: MetricRow }[] } {
  const ra = (nhan: string, donVi: string, dong: { dung: boolean; row: MetricRow }[]) => ({ nhan, donVi, dung: dong.filter((d) => d.dung).length, dong });
  const theoBai = (o: Map<number, OBai>, dung: Set<number>, phu: (x: OBai) => string) => (ids: number[]): MetricRow[] => {
    return ids.map((id) => {
      const x = o.get(id)!;
      return {
        id, title: x.hocVien, href: `/hoc-vien/${x.studentId}`,
        sub: [c.lop.get(x.classId)?.ma, `${x.bai} · ${tuanLichNgan(x.tuan)}`, phu(x), dung.has(id) ? 'Đạt' : 'Chưa đạt'].filter(Boolean).join(' · '),
      };
    });
  };
  const kq = /^ket-qua(?::(\w+))?$/.exec(cot);
  if (kq || cot === 'tien-bo') {
    const nap = napBai(p, c);
    const muc = kq ? mucKetQua(c, nap) : [];
    const tapKq = kq ? tapKetQua(c, muc) : null;
    const tap = !kq ? tapTienBo(c, nap).get(gv) : kq[1] ? tapKq!.get(kq[1])?.get(gv) : gopTap(...[...tapKq!.values()].map((t) => t.get(gv)));
    const theoMuc = new Map(muc.map((m) => [m.x.id, m]));
    const diem = (x: OBai) => (x.band !== null ? `${tenMonNgan(c.lop.get(x.classId)?.ct ?? null, x.skill)} ${x.band.toFixed(1)}` : null);
    /* V5 C09: dòng phụ ghi Overall + kỳ vọng / Target — đọc được vì sao kỹ năng dưới kỳ vọng vẫn tính Đạt. */
    const ky = (x: OBai) => {
      const m = theoMuc.get(x.id);
      if (m) return [diem(x), m.ovr !== null ? `Overall ${m.ovr.toFixed(1)}` : null, m.kv !== null ? `${x.kind === 'thi-that' ? 'Target' : 'kỳ vọng'} ${m.kv.toFixed(1)}` : null].filter(Boolean).join(' · ');
      const a = nap.attempts.get(x.attemptId);
      const kv = a && a.scoring_mode !== 'ratio' ? expectationFor(a.target_score ?? null, a.attempt_no, a.route) : null;
      return [diem(x), kv !== null ? `kỳ vọng ${kv.toFixed(1)}` : null].filter(Boolean).join(' · ');
    };
    const o = new Map([...nap.o, ...muc.map((m) => m.x)].map((x) => [x.id, x]));
    const nhan = !kq ? 'HV tiến bộ' : kq[1] ? `Kết quả ${tenMonNgan(null, kq[1])}` : 'Kết quả';
    return ra(nhan, 'lượt kỹ năng', dongTheoTap(tap, theoBai(o, new Set(tap?.dung ?? []), ky)));
  }
  if (cot === 'cham-diem') {
    const dong = [...tapChamDiem(c, napBai(p, c)).dong.values()].filter((d) => d.gv === gv)
      .sort((a, b) => Number(a.dung) - Number(b.dung) || a.lop.localeCompare(b.lop, 'vi') || a.hocVien.localeCompare(b.hocVien, 'vi') || a.id - b.id);
    return ra('Điểm đúng hạn', 'bài', dong.map((d) => ({
      dung: d.dung,
      row: {
        id: d.id, title: d.hocVien, href: `/hoc-vien/${d.studentId}`,
        sub: [d.lop, `${d.bai} · ${tuanLichNgan(d.tuan)}`, d.mon, `hạn ${d.han.slice(8, 10)}/${d.han.slice(5, 7)}`, d.dung ? 'Đúng hạn' : `Quá hạn · ${d.tre} ngày`].join(' · '),
      },
    })));
  }
  if (cot === 'viec-dung-han') {
    /* 05 #8: hai tập việc có hạn, mỗi tập trễ trước — rồi xếp chung trễ trước (sắp ổn định giữ thứ tự trong tập). */
    return ra('Việc đúng hạn', 'việc', [
      ...dongTheoTap(tapGhiKetQuaPa(p, c).tap.get(gv), (ids) => rowsFor('nghia-vu', ids, 'dung-han-cap-nhat', p), 'Kết quả PA'),
      ...dongTheoTap(tapXuLyViPham(c).get(gv), (ids) => rowsFor('vi-pham', ids, undefined, p), 'Xử lý vi phạm'),
    ].sort((a, b) => Number(a.dung) - Number(b.dung)));
  }
  if (cot === 'ghi-pa') return ra('Kết quả PA đúng hạn', '', dongTheoTap(tapGhiKetQuaPa(p, c).tap.get(gv), (ids) => rowsFor('nghia-vu', ids, 'dung-han-cap-nhat', p)));
  if (cot === 'vi-pham') return ra('Xử lý vi phạm đúng hạn', '', dongTheoTap(tapXuLyViPham(c).get(gv), (ids) => rowsFor('vi-pham', ids, undefined, p)));
  if (cot === 'pa-hieu-qua') return ra('PA hiệu quả', '', dongTheoTap(tapPaHieuQua(c).get(gv), (ids) => rowsFor('phuong-an', ids, undefined, p)));
  throw badRequest(`Cột "${cot}" không có trong bảng.`);
}

// ------------------------------------------------------------------ hồ sơ GV theo kỳ (V5 SV-SO2 — Từ tuần – Đến tuần)

/**
 * Mọi (chi nhánh, khung) GV có phân công giao kỳ, trong phạm vi người xem (`phamViHoSoGv` — GV xem mình, QL / QT chi nhánh mình) — mỗi cặp một ngữ cảnh
 * của bảng Phân tích GV. Số hồ sơ = Σ tử / Σ mẫu của các ngữ cảnh (05 mục 1.3), cùng hàm tập với ô bảng (một GV một chi nhánh: số ở hồ sơ = số ở bảng).
 * shortcut: GV tự xem dùng quyền của chính GV cho `tapGhiKetQuaPa` (`metricSet`) — chi nhánh GV đã thôi dạy hết lớp có thể bị từ chối; gặp thì lọc trước.
 */
function nguCanhCuaGv(p: Principal, gvId: number, q: { tu?: string | null; den?: string | null }) {
  const { branchIds } = phamViHoSoGv(p, gvId);
  const homNay = demoToday();
  const k = khoangPtGv(q, homNay);
  if ('loi' in k) throw badRequest(k.loi);
  const rows = db().prepare(
    `SELECT DISTINCT c.branch_id, c.is_fast_track FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id
      WHERE ta.user_id = ? AND ta.status IN ('active', 'ended') AND ta.effective_from <= ? AND (ta.effective_to IS NULL OR ta.effective_to >= ?)
        ${branchIds ? `AND c.branch_id IN (${cho(branchIds.length)})` : ''}
      ORDER BY c.branch_id, c.is_fast_track DESC`).all(gvId, addDays(k.den, 6), k.tu, ...(branchIds ?? [])) as any[];
  return { tu: k.tu, den: k.den, homNay, ds: rows.map((r) => nguCanhCn(r.branch_id, { ct: r.is_fast_track ? 'ft' : 'thuong', tu: k.tu, den: k.den })) };
}

export function chiSoHoSoGv(p: Principal, gvId: number, q: { tu?: string | null; den?: string | null }): ChiSoHoSoGv {
  const g = nguCanhCuaGv(p, gvId, q);
  const cham: ({ dung: number[]; tong: number[] } | undefined)[] = [], ghi: ({ dung: number[]; tong: number[] } | undefined)[] = [], vp: ({ dung: number[]; tong: number[] } | undefined)[] = [], tb: ({ dung: number[]; tong: number[] } | undefined)[] = [], pa: ({ dung: number[]; tong: number[] } | undefined)[] = [];
  const kq = new Map<string, { khung: KhungPtGv; skill: string; tap: ({ dung: number[]; tong: number[] } | undefined)[] }>();
  for (const c of g.ds) {
    const nap = napBai(p, c);
    cham.push(tapChamDiem(c, nap).tap.get(gvId));
    ghi.push(tapGhiKetQuaPa(p, c).tap.get(gvId));
    vp.push(tapXuLyViPham(c).get(gvId));
    const t = tapKetQua(c, mucKetQua(c, nap));
    for (const skill of COT_KET_QUA_GV[c.khung]) {
      const khoa = `${c.khung}:${skill}`;
      (kq.get(khoa) ?? kq.set(khoa, { khung: c.khung, skill, tap: [] }).get(khoa)!).tap.push(t.get(skill)?.get(gvId));
    }
    if (c.khung === 'ft') { tb.push(tapTienBo(c, nap).get(gvId)); pa.push(tapPaHieuQua(c).get(gvId)); }
  }
  const coFt = g.ds.some((c) => c.khung === 'ft');
  const theoKyNang = [...kq.values()].map((x) => ({ khung: x.khung, skill: x.skill, nhan: tenMonNgan(null, x.skill), o: oTuTap(true, gopTap(...x.tap)) }))
    .filter((x) => x.o.k === 'so');
  return {
    tu: g.tu, den: g.den, homNay: g.homNay,
    diemDungHan: oTuTap(true, gopTap(...cham)),
    viecDungHan: oTuTap(true, gopTap(...ghi, ...vp)),
    ghiKetQuaPa: oTuTap(true, gopTap(...ghi)),
    xuLyViPham: oTuTap(true, gopTap(...vp)),
    ketQua: oTuTap(true, gopTap(...[...kq.values()].flatMap((x) => x.tap))),
    ketQuaTheoKyNang: theoKyNang,
    tienBo: oTuTap(coFt, gopTap(...tb)),
    paHieuQua: oTuTap(coFt, gopTap(...pa)),
  };
}

/** Panel chỉ đọc của một số ở hồ sơ GV theo kỳ — CÙNG `oChiSoCua` qua mọi ngữ cảnh của `chiSoHoSoGv` (số = số dòng). `cot` thêm `ket-qua:<khung>:<kỹ năng>`. */
export function oChiSoHoSoGv(p: Principal, gvId: number, q: { tu?: string | null; den?: string | null; cot: string }): { n: number; tieuDe: string; rows: MetricRow[] } {
  const g = nguCanhCuaGv(p, gvId, q);
  const m = /^ket-qua:(ft|thuong):(\w+)$/.exec(q.cot);
  if (!m && !['cham-diem', 'viec-dung-han', 'ghi-pa', 'vi-pham', 'ket-qua', 'tien-bo', 'pa-hieu-qua'].includes(q.cot)) throw badRequest(`Cột "${q.cot}" không có ở hồ sơ.`);
  const ds = g.ds.filter((c) => (m ? c.khung === m[1] : ['tien-bo', 'pa-hieu-qua'].includes(q.cot) ? c.khung === 'ft' : true));
  const phan = ds.map((c) => oChiSoCua(p, c, gvId, m ? `ket-qua:${m[2]}` : q.cot));
  const dong = phan.flatMap((x) => x.dong).sort((a, b) => Number(a.dung) - Number(b.dung));
  const dau = phan[0] ?? { nhan: q.cot === 'cham-diem' ? 'Điểm đúng hạn' : q.cot === 'viec-dung-han' ? 'Việc đúng hạn' : 'Kết quả', donVi: '' };
  const dung = phan.reduce((s, x) => s + x.dung, 0);
  return { n: dong.length, tieuDe: `${dau.nhan} · ${tuanLichNgan(g.tu)} – ${tuanLichNgan(g.den)} · ${dung}/${dong.length}${dau.donVi ? ` ${dau.donVi}` : ''}`, rows: dong.map((d) => d.row) };
}
