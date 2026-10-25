import { capNhatConOCho } from '../fasttrack/conOCho.ts';
import { THAM_SO_TOI_DA, chenNhieuDong, db, theoLo, tx } from '../db.ts';
import {
  PERMISSIONS, ROUTE_KHAC, coMt0, dongKhiChuyen, roundToHalf, ghepMucTieu, huongMotEm, kiemDongChuyenTiep, luatDoiLop, targetLenFt, tuanChonDuoc, tuanHocTai, tuanLich,
  type HuongLenh, type LoaiLop, type LuatDoiLop, type MucTieuLenh, type ProgrammeCode,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest, notFound, nowIso } from '../util.ts';
import { ganChuCaseThieu } from '../cases/owner.ts';
import { can, require_, type Principal } from '../permissions.ts';
import { addJourney, notify, writeAudit, writeAuditLo } from '../platform/audit.ts';
import { chuyenCaseSangLoTrinh, closeCasesBySystem, closeCasesOnProgrammeSwitch, programmeOfCase } from '../cases/systemClose.ts';
import { banGiaoPaQuyChe, datLaiHanCase } from '../cases/sosAuto.ts';
import { taoMtMacDinh, taoMtMacDinhLo } from '../fasttrack/mtMacDinh.ts';
import { classProgressMany, mocKetKhoa } from './schedule.ts';
import { isRatioClass, programmeByCode, taoBaiThuongMacDinh } from '../normal/regular.ts';
import { sauChuyenCuoiKhoa } from '../normal/cuoiKhoa.ts';
import { ensurePeriod, mondayOf } from '../platform/week.ts';
import { chotHanXuLy, trangThaiYThuc } from '../yThuc/trangThai.ts';
import { khoangTamDung } from '../students/tamDung.ts';
import { doiMt0KhiVeThuong, huyKhiVeThuong, keHoachVeThuong, noiMt0VaoFt } from '../fasttrack/mt0.ts';
import { ghiBanChup } from '../loTrinh/banChup.ts';
import { evaluateAttempt } from '../fasttrack/scoring.ts';

/**
 * LUẬT LỘ TRÌNH — MỘT CHỖ (PR-LT, §3.9) dùng chung cho Chuyển lớp một em (`students.ts`) và
 * Chuyển tiếp lớp cả lớp (`transition.ts`). `luatDoiLop` (shared/domain/lenLop.ts) trả lời
 * "đóng/mở khoá thế nào, Case đi đâu"; các hàm ở đây THI HÀNH câu trả lời đó trên database.
 */

// ---------------------------------------------------------------- lớp hiện tại + quyền (Q3)

/** Enrollment `active` hiện tại của em, kèm thông tin lớp — dùng cho mọi luồng chuyển lớp. */
export function lopHienTaiCua(studentId: number): any {
  return db()
    .prepare(
      `SELECT e.*, c.code, c.programme_code, c.is_fast_track, c.route, c.branch_id, c.status AS class_status,
              b.name AS branch_name
         FROM enrollments e JOIN classes c ON c.id = e.class_id JOIN branches b ON b.id = c.branch_id
        WHERE e.student_id = ? AND e.status = 'active' LIMIT 1`,
    )
    .get(studentId) as any;
}

/** Q3: quyền kiểm Ở LỚP NGUỒN — GVCN lớp đó (hoặc QL phạm vi lớp đó), KHÔNG đòi quyền ở lớp chuyển đến. */
export function coTheChuyenLop(p: Principal, sid: number): { enr: any } | null {
  const enr = lopHienTaiCua(sid);
  if (!enr) return null;
  if (!can(p, PERMISSIONS.CLASS_EDIT, { classId: enr.class_id })) return null;   // PR-CT (Q30-1): chỉ Quản lý ra lệnh, GVCN chỉ đề xuất
  return { enr };
}

/** Lớp chuyển đến hợp lệ: tồn tại, `status='active'`, khác lớp nguồn. Không kiểm quyền ở đây (Q3). */
export function lopDichHopLe(toClassId: number, lopNguonId: number): any | null {
  const lop = db().prepare('SELECT * FROM classes WHERE id = ?').get(toClassId) as any;
  if (!lop || lop.status !== 'active' || lop.id === lopNguonId) return null;
  return lop;
}

// ---------------------------------------------------------------- hướng Chuyển lớp một em (PR-CL B1)

type EnrNguon = { class_id: number; is_fast_track: any; programme_code: string | null };

/** Lớp thường đã tới Cuối khoá (từ tuần Final) — cùng mốc `tuCuoiKhoa` của `raLenh` / Chuyển tiếp lớp. Lớp FT: không bao giờ. */
export function tuCuoiKhoaCua(enr: EnrNguon, homNay = demoToday()): boolean {
  return !enr.is_fast_track && mocKetKhoa(classProgressMany([enr.class_id]).get(enr.class_id), homNay).tuCuoiKhoa;
}

/**
 * PR-CL (B1, D4): bối cảnh + hướng của Chuyển lớp MỘT em — gọi ở `/transfer`, duyệt Đề xuất chuyển lớp, xem trước. Lớp thường đã tới Cuối khoá đi
 * đúng luật Cuối khoá (Lên FT có MT0, Học lại mở khoá mới); lớp chuyển đến sai bậc thì `raLenh` báo "chương trình kế tiếp".
 */
export function huongChuyenMotEm(
  enr: EnrNguon, dich: { is_fast_track: any; programme_code: string | null } | null, homNay = demoToday(), tuCuoiKhoa = tuCuoiKhoaCua(enr, homNay),
): { boiCanh: 'cuoi-khoa' | 'giua-khoa'; huong: HuongLenh } {
  return {
    boiCanh: tuCuoiKhoa ? 'cuoi-khoa' : 'giua-khoa',
    huong: huongMotEm({ ft: !!enr.is_fast_track, ma: enr.programme_code }, dich && { ft: !!dich.is_fast_track, ma: dich.programme_code }, tuCuoiKhoa),
  };
}

// ---------------------------------------------------------------- GET /chuyen-lop/lop-dich (Q3)

/**
 * Lớp chuyển đến cho ô gõ tên lớp — MỌI chi nhánh. PR-CL (B2): chỉ lớp hợp lệ — nguồn lớp thường đã tới Cuối khoá chỉ còn lớp FT, cùng chương trình,
 * chương trình kế tiếp (vị từ `kiemDongChuyenTiep` của `raLenh`); giữa khoá / nguồn FT: mọi lớp đang hoạt động. Sĩ số chỉ cho người ra quyết định
 * (`class.edit` ở lớp em đang học) — GVCN đề xuất không thấy số học viên lớp khác.
 */
export function lopDichChoChuyen(p: Principal, sid: number) {
  const enr = lopHienTaiCua(sid);
  if (!enr) throw badRequest('Học viên không đang học lớp nào.');
  /* PR-CT: danh sách lớp là dữ liệu chỉ đọc, không lộ học viên — GVCN cần nó để chọn "Lớp chuyển đến" khi Đề xuất chuyển lớp. Ra lệnh vẫn chỉ Quản lý (`raLenh`). */
  require_(p, PERMISSIONS.STUDENT_EDIT, { classId: enr.class_id }, 'Bạn không có quyền xem lớp chuyển đến của học viên này.');
  const ds = danhSachLopDich(enr.class_id, can(p, PERMISSIONS.CLASS_EDIT, { classId: enr.class_id }));
  const tuCuoiKhoa = tuCuoiKhoaCua(enr);
  const maTu = (enr.programme_code ?? null) as ProgrammeCode | null;
  const lop = !tuCuoiKhoa ? ds.lop : ds.lop.filter((c) => !kiemDongChuyenTiep({
    huong: huongMotEm({ ft: false, ma: maTu }, c, true) as 'len_lop' | 'hoc_lai' | 'fast_track', toClassId: c.id, toClass: { ma: c.ma, ft: c.ft }, mucTieu: 5,
  }, { maTu }));
  return { ...ds, lop, nguon: { ft: !!enr.is_fast_track, tuCuoiKhoa } };
}

/** Lớp ĐANG hoạt động để chọn làm lớp chuyển đến (trừ lớp `boQuaLopId`) + chi nhánh — dùng chung Chuyển lớp và Học lại sang lớp mới (PR-LUI-b). */
export function danhSachLopDich(boQuaLopId: number, demHocVien = false) {
  const conn = db();
  const branches = conn.prepare(`SELECT id, name FROM branches WHERE status = 'active' ORDER BY name`).all() as any[];
  const lopRows = conn
    .prepare(
      `SELECT c.id, c.code, c.branch_id, b.code AS branch_code, c.programme_code, c.is_fast_track, c.route,
              (SELECT u.full_name FROM teacher_assignments ta JOIN users u ON u.id = ta.user_id
                WHERE ta.class_id = c.id AND ta.is_core = 1 AND ta.status = 'active' LIMIT 1) AS gvcn
         FROM classes c JOIN branches b ON b.id = c.branch_id WHERE c.status = 'active' AND c.id != ?`,
    )
    .all(boQuaLopId) as any[];
  const tienDo = classProgressMany(lopRows.map((r) => r.id));
  /* Chỉ Quản lý (Học lại, Chuyển lớp) thấy sĩ số; GVCN chọn lớp chuyển đến không được thấy số học viên lớp khác. */
  const siSo = new Map<number, number>();
  if (demHocVien) for (const r of conn.prepare(`SELECT class_id, COUNT(*) n FROM enrollments WHERE status = 'active' GROUP BY class_id`).all() as any[]) siSo.set(r.class_id, r.n);
  return {
    chiNhanh: branches.map((b) => ({ id: b.id, name: b.name })),
    lop: lopRows.map((r) => {
      const pr = tienDo.get(r.id);
      return {
        id: r.id, code: r.code, chiNhanhId: r.branch_id, branchCode: r.branch_code as string, ma: (r.programme_code ?? null) as ProgrammeCode | null,
        ft: !!r.is_fast_track, route: (r.route ?? null) as string | null,
        tenChuongTrinh: r.programme_code ? (programmeByCode(r.programme_code)?.name ?? null) : null,
        tuan: pr?.currentWeek && pr.totalWeeks && pr.currentWeek >= 1 ? `W${pr.currentWeek}/${pr.totalWeeks}` : null,
        gvcn: r.gvcn ?? null,
        ...(demHocVien ? { siSo: siSo.get(r.id) ?? 0 } : {}),
      };
    }),
  };
}

// ---------------------------------------------------------------- người nhận Case gợi ý (Q14)

/** Mỗi Case đang mở → người gợi ý nhận ở lớp chuyển đến: GV đúng môn → GVCN lớp chuyển đến → giữ người cũ (null). */
export function nguoiNhanGoiY(caseRows: readonly { id: number; category: string | null }[], toClassId: number): Map<number, { id: number; ten: string } | null> {
  const out = new Map<number, { id: number; ten: string } | null>();
  if (!caseRows.length) return out;
  const conn = db();
  const bySkill = new Map<string, { id: number; ten: string }>();
  for (const r of conn
    .prepare(
      `SELECT ta.skill, u.id, u.full_name FROM teacher_assignments ta JOIN users u ON u.id = ta.user_id
        WHERE ta.class_id = ? AND ta.status = 'active' AND ta.skill IS NOT NULL`,
    )
    .all(toClassId) as any[]) {
    bySkill.set(r.skill, { id: r.id, ten: r.full_name });
  }
  const gvcnRow = conn
    .prepare(
      `SELECT u.id, u.full_name FROM teacher_assignments ta JOIN users u ON u.id = ta.user_id
        WHERE ta.class_id = ? AND ta.is_core = 1 AND ta.status = 'active' LIMIT 1`,
    )
    .get(toClassId) as any;
  const gvcn = gvcnRow ? { id: gvcnRow.id, ten: gvcnRow.full_name } : null;
  for (const c of caseRows) {
    out.set(c.id, (c.category ? bySkill.get(c.category) : null) ?? gvcn ?? null);
  }
  return out;
}

// ---------------------------------------------------------------- thông báo nơi nhận (Q21)

/** GVCN lớp chuyển đến (luôn) + mọi QL có grant chi nhánh đích (chỉ khi đổi chi nhánh) — trừ chính người bấm. */
export function thongBaoChuyenVao(i: {
  sid: number; tenHocVien: string; enrollmentMoiId: number; actorUserId: number | null;
  tuMa: string; tuChiNhanh: string; doiChiNhanh: boolean; lyDo: string | null;
  denLop: { id: number; code: string; branchId: number };
}) {
  const conn = db();
  const doiChiNhanh = i.doiChiNhanh;
  const nguoiNhan = new Map<number, true>();
  for (const r of conn
    .prepare(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active'`)
    .all(i.denLop.id) as any[]) nguoiNhan.set(r.user_id, true);
  const branchDest = conn.prepare('SELECT branch_id FROM classes WHERE id = ?').get(i.denLop.id) as any;
  const ql = conn
    .prepare(
      `SELECT DISTINCT ur.user_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id
        WHERE r.key = 'manager' AND ur.status = 'active' AND (ur.branch_id = ? OR ur.branch_id IS NULL)`,
    )
    .all(branchDest?.branch_id ?? i.denLop.branchId) as any[];
  /* K5-18 (PR-YT4): GVCN mới biết ngay em mang theo việc Ý thức (hạn đặt lại từ ngày chuyển — M-08). */
  const yt = trangThaiYThuc([i.sid]).get(i.sid);
  const soYt = (yt?.soBatBuoc ?? 0) + (yt?.soMoi ?? 0);
  const body = `Từ ${i.tuMa} (${i.tuChiNhanh})${i.lyDo ? ` · ${i.lyDo}` : ''}${soYt > 0 ? ` · đang có ${soYt} vi phạm cần xử lý` : ''}`;
  for (const userId of nguoiNhan.keys()) {
    if (userId === i.actorUserId) continue;
    notify({
      userId, kind: 'transfer_in', title: `${i.tenHocVien} chuyển vào lớp ${i.denLop.code}`, body,
      entityType: 'student', entityId: i.sid, dedupKey: `transfer:${i.enrollmentMoiId}`,
    });
  }
  if (doiChiNhanh) {
    for (const q of ql) {
      if (q.user_id === i.actorUserId || nguoiNhan.has(q.user_id)) continue;
      notify({
        userId: q.user_id, kind: 'transfer_in', title: `${i.tenHocVien} chuyển vào lớp ${i.denLop.code}`, body,
        entityType: 'student', entityId: i.sid, dedupKey: `transfer:${i.enrollmentMoiId}`,
      });
    }
  }
}

// ---------------------------------------------------------------- lớp hết khoá (Q16)

/**
 * Lớp thường đã hết khoá và không còn enrollment `active` nào → `finished`. Một câu, dùng cho cả lô. OV-13l: `tuTuanFinal` (chỉ đường thi hành quyết
 * định chuyển lớp) — từ tuần Final đã đủ, không đợi hết khoá (chuyển cả lớp ở tuần Final không để lớp "đang học" 0 em).
 */
export function dongLopNeuHet(classIds: readonly number[], ngay: string, tuTuanFinal = false) {
  const ids = [...new Set(classIds)];
  if (!ids.length) return;
  const conn = db();
  const tienDo = classProgressMany(ids as number[]);
  const xong = ids.filter((id) => {
    const pr = tienDo.get(id);
    return !!pr && (pr.phase === 'finished' || (tuTuanFinal && mocKetKhoa(pr, ngay).tuCuoiKhoa));
  });
  if (!xong.length) return;
  const ph = xong.map(() => '?').join(',');
  const r = conn
    .prepare(
      `UPDATE classes SET status = 'finished', finished_at = ?
        WHERE id IN (${ph}) AND status = 'active'
          AND NOT EXISTS (SELECT 1 FROM enrollments e WHERE e.class_id = classes.id AND e.status = 'active')`,
    )
    .run(ngay, ...xong);
  if (r.changes) {
    writeAudit({ actorUserId: null, action: 'class.finished', entityType: 'class', entityId: null,
      after: { classIds: xong, on: ngay, count: r.changes } });
  }
}

// ---------------------------------------------------------------- P7: Lộ trình mới sau thi (N12)

/** Lựa chọn ở panel Lộ trình mới (P7, N12) — `cuoiId` = lộ trình vừa xong (có KQ thi thật / Không thi). Ghi ở `buoc_tiep_json.loTrinhMoi` để đường hẹn / lệnh chuyển lớp đọc lại. */
export type LoTrinhMoiSauThi = { route: string; routeTen: string | null; boTarget: boolean; cuoiId: number };

/** Điểm đầu vào của lộ trình mới (E3): KQ thi thật của lộ trình vừa xong (đủ 4 kỹ năng); không có → MT có Overall gần nhất của lộ trình đó, ghi nguồn. Không ghép điểm nhiều lần thi. */
export type DauVaoLoTrinh = { score: number | null; l: number | null; r: number | null; w: number | null; s: number | null; attemptId: number | null; nguon: string };
export function dauVaoTuLoTrinh(cuoi: any): DauVaoLoTrinh | null {
  if (!cuoi) return null;
  const tt = [cuoi.thi_that_l, cuoi.thi_that_r, cuoi.thi_that_w, cuoi.thi_that_s] as (number | null)[];
  if (!cuoi.thi_that_khong_thi && tt.every((x) => x !== null && x !== undefined)) {
    const ngay = cuoi.thi_that_ngay ? String(cuoi.thi_that_ngay).slice(0, 10).split('-').reverse().join('/') : null;
    return { score: roundToHalf((tt as number[]).reduce((a, b) => a + b, 0) / 4), l: tt[0], r: tt[1], w: tt[2], s: tt[3], attemptId: null, nguon: ngay ? `KQ thi thật ${ngay}` : 'KQ thi thật' };
  }
  const conn = db();
  const luot = conn.prepare(`SELECT id, attempt_no FROM assessment_attempts WHERE cycle_id = ? AND kind = 'mock' AND status != 'cancelled' ORDER BY attempt_no DESC, id DESC`).all(cuoi.id) as any[];
  if (!luot.length) return null;
  const diem = new Map<number, Record<string, number | null>>();
  theoLo(luot.map((a) => a.id as number), (lo, ph) => {
    for (const r of conn.prepare(`SELECT attempt_id, skill, band FROM assessment_scores WHERE attempt_id IN (${ph})`).all(...lo) as any[]) {
      diem.set(r.attempt_id, { ...(diem.get(r.attempt_id) ?? {}), [r.skill]: r.band ?? null });
    }
  });
  for (const a of luot) {
    const ov = evaluateAttempt(null, 1, diem.get(a.id) ?? {}).overall;
    if (ov !== null) return { score: ov, l: null, r: null, w: null, s: null, attemptId: a.id, nguon: `MT${a.attempt_no} gần nhất (chưa có KQ thi thật)` };
  }
  return null;
}

// ---------------------------------------------------------------- thi hành luật (Task 4, Task 5)

/**
 * MỞ LỘ TRÌNH MỚI cho học viên ở lớp `toClass` (PR-LUI-b tách từ `apDungMotDong`): số thứ tự kế tiếp, Target / Dự kiến thi giữ theo luật PR-NT (FT → FT hoặc thường →
 * thường giữ Target; thường → thường giữ cả Dự kiến thi), lịch MT mặc định (FT) hoặc bài Giữa khoá / Cuối khoá (thường). KHÔNG đóng lộ trình cũ — nơi gọi lo.
 * `target` / `kck`: Target do người dùng nhập (sang FT từ lớp thường là bắt buộc — nơi gọi kiểm); trống thì giữ của `cuCycle` khi luật cho giữ.
 */
export function moLoTrinhMoi(p: Principal, o: {
  sid: number; ngay: string; toClass: any; tuLop: LoaiLop; denLop: LoaiLop; cuCycle: any | null;
  target?: number | null; kck?: boolean; thangThi?: string | null;
  /** P7 (N12): Lộ trình mới sau thi — mã lộ trình chọn ở panel (có thể khác lớp: LT2 ở lớp LT1, Khác), tên "Khác", Bỏ Target; KHÔNG chép ngày thi (E1); đầu vào = KQ thi thật (E3). */
  sauThi?: LoTrinhMoiSauThi | null;
}): { moiId: number; route: string | null } {
  const conn = db();
  const seq = ((conn.prepare('SELECT MAX(seq) n FROM learning_cycles WHERE student_id = ?').get(o.sid) as any)?.n ?? 0) + 1;
  const st = o.sauThi ?? null;
  const route = st && o.denLop.ft ? st.route : o.denLop.ft ? (o.toClass.route ?? o.cuCycle?.route ?? 'LT1') : null;   // lộ trình mới = lộ trình lớp chuyển đến (M-20); P7: lộ trình đã chọn
  const dv = st ? dauVaoTuLoTrinh(conn.prepare('SELECT * FROM learning_cycles WHERE id = ?').get(st.cuoiId)) : null;
  const startPeriodId = o.denLop.ft ? ensurePeriod(mondayOf(o.ngay)).id : (o.toClass.start_period_id ?? null);
  /*
   * Q7: FT → FT giữ target cũ. Chủ sản phẩm 04/10 (PR-NT): lớp thường → lớp thường giữ cả Target lẫn Dự kiến thi.
   * PR-LCb (§7 "Dự kiến thi giữ như cũ"): Dự kiến thi giữ ở MỌI chiều khi không gửi tháng thi mới.
   */
  const giuTarget = (o.tuLop.ft && o.denLop.ft) || (!o.tuLop.ft && !o.denLop.ft);
  const giuThi = !o.thangThi && !st;   // P7 (E1): Lộ trình mới sau thi không chép ngày thi của lộ trình đã thi
  const cu = o.cuCycle;
  const boTg = !!st?.boTarget;
  const moiId = Number(conn
    .prepare(
      `INSERT INTO learning_cycles (student_id, seq, route, route_ten, programme_code, target_score, khong_cam_ket, exam_month, exam_date, exam_period_id,
                                    baseline_score, baseline_listening, baseline_reading, baseline_writing, baseline_speaking, baseline_attempt_id, baseline_source, baseline_note,
                                    start_period_id, started_at, status, created_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'active', ?)`,
    )
    .run(o.sid, seq, route, route === ROUTE_KHAC ? st?.routeTen ?? null : null, o.denLop.ma,
      boTg ? null : o.target ?? (giuTarget ? cu?.target_score ?? null : null),
      !boTg && (o.kck || (o.target == null && giuTarget && cu?.khong_cam_ket)) ? 1 : 0,   // … kể cả KCK (Q29-1)
      giuThi ? cu?.exam_month ?? null : o.thangThi ?? null,
      giuThi ? cu?.exam_date ?? null : null, giuThi ? cu?.exam_period_id ?? null : null,
      dv && !dv.attemptId ? dv.score : null, dv?.l ?? null, dv?.r ?? null, dv?.w ?? null, dv?.s ?? null, dv?.attemptId ?? null,
      dv ? 'previous_cycle' : null, dv?.nguon ?? null,
      startPeriodId, o.ngay, nowIso()).lastInsertRowid);
  if (o.denLop.ft) taoMtMacDinh(moiId, { actorUserId: p.userId });   // M1: vào lớp FT / đổi LT ↔ RF = lộ trình mới có lịch MT mặc định
  else taoBaiThuongMacDinh([moiId], p.userId, o.ngay);               // PR-LT2a M1b: sang lớp thường = tự có bài Progress / Final Test (OV-13l: bài tuần này vẫn có)
  return { moiId, route };
}

export type DongApDung = {
  sid: number;
  toClassId: number;
  ngay: string;
  lyDo?: string | null;
  luuY?: string | null;
  mucTieu?: number | null;
  thangThi?: string | null;
  /** caseId → userId người nhận (Q14). */
  nguoiNhan?: Record<number, number> | null;
  boiCanh: 'giua-khoa' | 'cuoi-khoa';
};

/**
 * ÁP DỤNG luật lộ trình cho một dòng — dùng chung Chuyển lớp một em (Task 4, một dòng) và
 * Chuyển tiếp lớp cả lớp (Task 5, nhiều dòng). Giả định dòng đã qua kiểm hợp lệ ở nơi gọi.
 */
/** OV-13j: chuyển lớp sang chi nhánh khác → nhật ký ghi kèm chi nhánh cũ → mới (Lịch sử sửa của em). Cùng chi nhánh → không ghi. */
const doiCn = (cu: number | null, moi: number | null) => (cu !== moi ? { truoc: { branchId: cu }, sau: { branchId: moi } } : { truoc: {}, sau: {} });

/** OV-13o: lộ trình mới mang Target / KCK khác lộ trình cũ → nhật ký Chuyển lớp ghi cũ → mới (Lịch sử sửa có dòng Target / KCK). Không đổi → không ghi. */
export function doiTg(cu: { target_score?: number | null; khong_cam_ket?: number | null } | null | undefined,
  moi: { target_score?: number | null; khong_cam_ket?: number | null } | null | undefined) {
  const truoc: Record<string, unknown> = {}, sau: Record<string, unknown> = {};
  if ((cu?.target_score ?? null) !== (moi?.target_score ?? null)) { truoc.targetScore = cu?.target_score ?? null; sau.targetScore = moi?.target_score ?? null; }
  if (!!cu?.khong_cam_ket !== !!moi?.khong_cam_ket) { truoc.khongCamKet = !!cu?.khong_cam_ket; sau.khongCamKet = !!moi?.khong_cam_ket; }
  return { truoc, sau };
}

export function apDungMotDong(p: Principal, d: DongApDung): { luat: LuatDoiLop | null; toClassCode: string } {
  const conn = db();
  const enr = lopHienTaiCua(d.sid);
  const toClass = conn.prepare('SELECT * FROM classes WHERE id = ?').get(d.toClassId) as any;
  if (!toClass) throw notFound('Không tìm thấy lớp chuyển đến');

  /* Xếp lớp LẦN ĐẦU (chưa từng ghi danh) — không có khoá cũ để đóng, không luật lộ trình nào áp dụng. */
  if (!enr) {
    return tx((): { luat: LuatDoiLop | null; toClassCode: string } => {
      /* OV-11d: em Tạm dừng (ghi danh `paused` giữ lớp cũ) được xếp lớp mới → đóng lớp giữ, em đang học lại — không để hai ghi danh / quyền GVCN cũ. */
      const giu = (conn.prepare(`SELECT id FROM enrollments WHERE student_id = ? AND status = 'paused'`).all(d.sid) as any[]).map((r) => r.id as number);
      for (const id of giu) conn.prepare(`UPDATE enrollments SET status = 'completed', ended_at = ?, end_reason = ?, end_kind = NULL WHERE id = ?`).run(d.ngay, d.lyDo ?? null, id);
      const cnCu = (conn.prepare('SELECT branch_id b FROM students WHERE id = ?').get(d.sid) as any)?.b ?? null;
      const quayLai = giu.length > 0 && conn.prepare(`UPDATE students SET status = 'active', archived_at = NULL WHERE id = ? AND status = 'inactive'`).run(d.sid).changes > 0;   // P7: tạm dừng ở Lưu trữ
      const insEnr = conn
        .prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`)
        .run(d.sid, d.toClassId, d.ngay, nowIso());
      conn.prepare('UPDATE students SET branch_id = ? WHERE id = ?').run(toClass.branch_id, d.sid);
      /* CV-LOI: Case chưa có người phụ trách của em → gán theo lớp mới (GV môn → GVCN), cùng giao dịch, có lịch sử. */
      ganChuCaseThieu({ studentIds: [d.sid], actorId: p.userId, luc: nowIso() });
      addJourney({
        studentId: d.sid, eventType: 'transfer', eventDate: d.ngay, title: `Chuyển sang lớp ${toClass.code}`,
        detail: [d.lyDo, d.luuY].filter(Boolean).join(' — ') || null, createdBy: p.userId,
      });
      writeAudit({
        actorUserId: p.userId, action: 'student.transfer', entityType: 'student', entityId: d.sid, entityLabel: toClass.code,
        before: { classId: null, ...(giu.length ? { ghiDanhGiu: giu } : {}), ...doiCn(cnCu, toClass.branch_id).truoc, ...(quayLai ? { status: 'inactive' } : {}) },
        after: { classId: d.toClassId, ...doiCn(cnCu, toClass.branch_id).sau, ...(quayLai ? { status: 'active' } : {}) },
      });
      /* Hết Tạm dừng (như Quay lại học): mốc resume khép khoảng dừng, hạn Case / Ý thức tính lại từ ngày vào lớp mới. */
      if (quayLai) {
        addJourney({ studentId: d.sid, eventType: 'resume', eventDate: d.ngay, title: 'Quay lại học', detail: `vào lớp ${toClass.code}`, createdBy: p.userId });
        datLaiHanCase(d.sid, d.ngay);
        chotHanXuLy([d.sid], { ghiDe: true });
      }
      thongBaoChuyenVao({
        sid: d.sid, tenHocVien: (conn.prepare('SELECT full_name FROM students WHERE id = ?').get(d.sid) as any).full_name,
        enrollmentMoiId: Number(insEnr.lastInsertRowid), actorUserId: p.userId,
        tuMa: '—', tuChiNhanh: '—', doiChiNhanh: true, lyDo: d.lyDo ?? null,
        denLop: { id: d.toClassId, code: toClass.code, branchId: toClass.branch_id },
      });
      return { luat: null, toClassCode: toClass.code };
    });
  }

  const tuLop: LoaiLop = { ma: (enr.programme_code ?? null) as ProgrammeCode | null, ft: !!enr.is_fast_track, lt: enr.route };
  const denLop: LoaiLop = { ma: (toClass.programme_code ?? null) as ProgrammeCode | null, ft: !!toClass.is_fast_track, lt: toClass.route };
  const luat = luatDoiLop(tuLop, denLop, d.boiCanh);

  return tx((): { luat: LuatDoiLop; toClassCode: string } => {
  conn.prepare(`UPDATE enrollments SET status = 'transferred', ended_at = ?, end_reason = ?, end_kind = ? WHERE id = ?`)
    .run(d.ngay, d.lyDo ?? null, luat.endKind, enr.id);
  const insEnr = conn
    .prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`)
    .run(d.sid, d.toClassId, d.ngay, nowIso());
  conn.prepare('UPDATE students SET branch_id = ? WHERE id = ?').run(toClass.branch_id, d.sid);
  /* CV-LOI: Case chưa có người phụ trách của em → gán theo lớp mới (GV môn → GVCN), cùng giao dịch, có lịch sử. */
  ganChuCaseThieu({ studentIds: [d.sid], actorId: p.userId, luc: nowIso() });

  const curCycle = conn.prepare(`SELECT * FROM learning_cycles WHERE student_id = ? AND status = 'active'`).get(d.sid) as any;
  /*
   * PR-DUYET (T44): target mới chỉ nhận khi giao diện hỏi (sang FT — `canMucTieu`) hoặc người gọi có `cycle.edit` (Quản lý).
   * GVCN gửi `mucTieu` thẳng qua API lúc FT → FT mở lộ trình mới thì BỎ QUA — giữ target cũ như giao diện.
   */
  const mucTieu = luat.canMucTieu || can(p, PERMISSIONS.CYCLE_EDIT, { studentId: d.sid }) ? d.mucTieu : undefined;
  let tg = doiTg(null, null);
  /* OV-13m ("Điểm khi chuyển", chủ SP 15/10): lộ trình ĐÃ XONG (có kết quả thi, Bước tiếp = Lộ trình mới) → đóng hẳn, mở lộ trình MỚI ở lớp đích, điểm cũ ở lại;
     lộ trình chưa xong giữ luật thường (FT → FT chạy tiếp). Em vừa Quay lại học sau Tạm dừng (không còn lộ trình chạy) → cũng mở lộ trình mới. Target của lệnh do QL / TVV
     đặt lúc chọn Bước tiếp. */
  const cuoiCycle = curCycle ?? (denLop.ft ? conn.prepare('SELECT * FROM learning_cycles WHERE student_id = ? ORDER BY seq DESC LIMIT 1').get(d.sid) as any : null);
  const sauThi = !!cuoiCycle && cuoiCycle.buoc_tiep === 'lo_trinh_moi' && (!!curCycle || denLop.ft);
  /* P7 (N12): lựa chọn ở panel Lộ trình mới (lộ trình · tên Khác · Bỏ Target) — ghi ở bước tiếp, đọc lại cả khi lệnh chuyển lớp thi hành tuần sau. */
  const loTrinhMoi: LoTrinhMoiSauThi | null = sauThi ? (() => { try { return JSON.parse(cuoiCycle.buoc_tiep_json ?? '{}').loTrinhMoi ?? null; } catch { return null; } })() : null;
  if (luat.khoa === 'dong-mo' || sauThi) {
    if (curCycle) conn.prepare(`UPDATE learning_cycles SET status = 'completed', ended_at = ? WHERE id = ?`).run(d.ngay, curCycle.id);
    /* PR-CL (B4.4, §7 "chuyển từ FT: Target giữ như cũ", Q1): FT → thường giữ Target / KCK của lộ trình FT — chỉ nhánh này (Lưu trữ "Học lại" không đổi). */
    const veThuong = tuLop.ft && !denLop.ft && !!curCycle;
    const { moiId } = moLoTrinhMoi(p, {
      sid: d.sid, ngay: d.ngay, toClass, tuLop, denLop, cuCycle: curCycle ?? cuoiCycle, thangThi: d.thangThi,
      target: (sauThi ? d.mucTieu : mucTieu) ?? (veThuong ? curCycle.target_score ?? null : null), kck: veThuong && mucTieu == null && !!curCycle.khong_cam_ket,
      sauThi: loTrinhMoi,
    });
    tg = doiTg(curCycle ?? cuoiCycle, conn.prepare('SELECT target_score, khong_cam_ket FROM learning_cycles WHERE id = ?').get(moiId) as any);
    /* PR-MT0 (T5b): từ lớp thường — sang FT thì MT0 thành mốc đầu vào lộ trình mới; hướng khác thì MT0 chưa điểm huỷ. */
    if (!tuLop.ft && curCycle) noiMt0VaoFt(p.userId, [{ sid: d.sid, cuCycleId: curCycle.id, ftCycleId: denLop.ft ? moiId : null, ngay: d.ngay }]);
    /* PR-CL (B4, R-C1): FT → thường — huỷ MT0 / Mock chưa điểm TRƯỚC bản chụp; MT0 có điểm về khoá thường + bỏ đầu vào SAU bản chụp (bản chụp = lúc đóng). */
    const veTh = veThuong ? keHoachVeThuong(curCycle) : null;
    if (veTh) huyKhiVeThuong(p.userId, veTh);
    /* PR-TK: bản chụp CÙNG giao dịch, lớp lúc đóng = lớp cũ (ghi danh đã đổi ở trên). Lý do = đúng loại kết thúc ghi danh.
       PR-MT0: ghi SAU khi MT0 đã sang lộ trình FT (bản chụp khoá cũ không giữ MT0 đã thành đầu vào FT), TRƯỚC khi Case FT→FT đi theo. */
    if (curCycle) ghiBanChup(conn, [curCycle.id], { lyDo: sauThi ? 'lo_trinh_moi' : luat.endKind as 'len_lop' | 'hoc_lai' | 'sang_ft' | 'chuyen_lop', ngay: d.ngay, lopId: enr.class_id, routeMoi: denLop.lt });
    if (veTh) doiMt0KhiVeThuong(curCycle.id, veTh);
  }

  /* Q12: bài chưa làm CHỈ đi theo em khi GIỮ khoá — đóng khoá thì lượt planned ở lại lớp cũ. MT0 không đi theo (PR-MT0): chưa điểm thì huỷ. */
  if (luat.khoa === 'giu' && curCycle && !sauThi) {
    conn.prepare(`UPDATE assessment_attempts SET class_id = ? WHERE cycle_id = ? AND status = 'planned' AND kind != 'mt0'`).run(d.toClassId, curCycle.id);
    /* TD7b: lớp đích có thể chấm theo cách khác (bộ môn, band ↔ số câu đúng) → cờ "còn ô chờ" của các lượt vừa đổi lớp. */
    capNhatConOCho((conn.prepare(`SELECT id FROM assessment_attempts WHERE cycle_id = ? AND status = 'planned' AND kind != 'mt0'`).all(curCycle.id) as any[]).map((r) => r.id));
    /* OV-13l: FT → FT khác lộ trình giữ lộ trình đang chạy — chỉ đổi mã theo lớp chuyển đến (lịch MT, tuần học giữ). */
    if (denLop.ft && denLop.lt && curCycle.route && curCycle.route !== denLop.lt) {
      conn.prepare('UPDATE learning_cycles SET route = ? WHERE id = ?').run(denLop.lt, curCycle.id);
      chuyenCaseSangLoTrinh(p.userId, d.sid, curCycle.id, curCycle.id, denLop.lt, d.ngay);   // Case giữ lộ trình, thêm mốc "Sang lộ trình …" (K5-60)
    }
    if (!tuLop.ft) noiMt0VaoFt(p.userId, [{ sid: d.sid, cuCycleId: curCycle.id, ftCycleId: null, ngay: d.ngay }], 'Chuyển lớp');
  }

  if (luat.dongCase) closeCasesOnProgrammeSwitch(p.userId, d.sid, luat.dongCase, d.ngay);
  /* OV-13m (rà #422): lộ trình đã xong sang lớp khác = như "Lớp này" / Thôi học — Case còn mở của lộ trình cũ hệ thống đóng ("kết thúc khoá"), không bàn giao cho GV lớp mới. */
  /* P7 (N12, Q2): lý do riêng "Kết thúc lộ trình" (PA đang chạy "Dừng — kết thúc lộ trình", không vào Hiệu quả PA) — chỉ đường Lộ trình mới. */
  if (sauThi && cuoiCycle) closeCasesBySystem({ actorUserId: p.userId, studentId: d.sid, reason: 'ket_thuc_lo_trinh', on: d.ngay, cycleIds: [cuoiCycle.id] });
  /* PR-LT2b: lên / học lại / sang FT từ lớp thường — Case đi theo + Cuối khoá (bổ trợ miễn phí, Báo PH, Tutor FT). Sau `closeCasesOnProgrammeSwitch`. */
  if (luat.khoa === 'dong-mo' && (luat.endKind === 'len_lop' || luat.endKind === 'hoc_lai' || luat.endKind === 'sang_ft') && !tuLop.ft) {
    sauChuyenCuoiKhoa(p, [{
      sid: d.sid, fromClassId: enr.class_id, toClassId: d.toClassId, toFt: denLop.ft, ngay: d.ngay,
      huong: luat.endKind === 'sang_ft' ? 'fast_track' : luat.endKind,
    }]);
  }
  /* PR-SOS (K3-44): FT → FT cùng chương trình — PA theo quy chế chưa khép sang GVBM đúng kỹ năng lớp mới. */
  else if (tuLop.ft && denLop.ft && !sauThi) banGiaoPaQuyChe(d.sid, d.toClassId, p.userId);

  if (d.nguoiNhan) {
    for (const [caseIdStr, userId] of Object.entries(d.nguoiNhan)) {
      const caseId = Number(caseIdStr);
      const c = conn.prepare('SELECT owner_user_id FROM sos_cases WHERE id = ? AND status != \'done\'').get(caseId) as any;
      if (!c) continue;
      conn.prepare('UPDATE sos_cases SET owner_user_id = ?, updated_at = ? WHERE id = ?').run(userId, nowIso(), caseId);
      conn
        .prepare(
          `INSERT INTO sos_case_history (case_id, field, old_value, new_value, actor_user_id, created_at)
           VALUES (?, 'owner', ?, 'bàn giao khi chuyển lớp', ?, ?)`,
        )
        .run(caseId, c.owner_user_id, p.userId, nowIso());
    }
  }

  /* PR-S6F-a Q1 (D1): lớp đổi → mốc vào lớp đổi → hạn xử lý vi phạm chưa phản hồi chốt LẠI (như Quay lại học) — hạn ở màn Ý thức = hạn bảng GV. */
  chotHanXuLy([d.sid], { ghiDe: true });

  addJourney({
    studentId: d.sid, eventType: d.boiCanh === 'cuoi-khoa' ? 'promote' : 'transfer', eventDate: d.ngay,
    title: d.boiCanh === 'cuoi-khoa' ? `Lên lớp ${toClass.code}` : `Chuyển sang lớp ${toClass.code}`,
    detail: [d.lyDo, d.luuY].filter(Boolean).join(' — ') || null, createdBy: p.userId,
  });
  writeAudit({
    actorUserId: p.userId, action: 'student.transfer', entityType: 'student', entityId: d.sid, entityLabel: toClass.code,
    before: { classId: enr.class_id, endKind: null, ...doiCn(enr.branch_id, toClass.branch_id).truoc, ...tg.truoc },
    after: { classId: d.toClassId, endKind: luat.endKind, ...doiCn(enr.branch_id, toClass.branch_id).sau, ...tg.sau },
  });
  thongBaoChuyenVao({
    sid: d.sid, tenHocVien: (conn.prepare('SELECT full_name FROM students WHERE id = ?').get(d.sid) as any).full_name,
    enrollmentMoiId: Number(insEnr.lastInsertRowid), actorUserId: p.userId,
    tuMa: enr.code, tuChiNhanh: enr.branch_name, doiChiNhanh: enr.branch_id !== toClass.branch_id,
    lyDo: d.lyDo ?? null, denLop: { id: d.toClassId, code: toClass.code, branchId: toClass.branch_id },
  });

  return { luat, toClassCode: toClass.code };
  });
}

// ---------------------------------------------------------------- GET /students/:id/chuyen-lop

/**
 * Case đang mở + luật áp dụng nếu đã chọn lớp chuyển đến — bày sẵn cho panel Chuyển lớp (Q13, Q14). PR-CL (B3): bối cảnh + hướng theo
 * `huongChuyenMotEm` (luật đúng như lúc ra lệnh), Target đã có khi Lên FT, MT0, việc FT → thường (`keHoachVeThuong` — cùng kế hoạch lúc thi hành)
 * và khối "Khi chuyển, web sẽ" (`dongKhiChuyen`) — web chỉ vẽ.
 */
export function xemChuyenLop(p: Principal, sid: number, toClassId?: number | null) {
  const enr = lopHienTaiCua(sid);
  if (!enr) throw badRequest('Học viên không đang học lớp nào.');
  require_(p, PERMISSIONS.CLASS_EDIT, { classId: enr.class_id }, 'Bạn không có quyền chuyển lớp học viên này.');   // PR-CT (Q30-1)
  const conn = db();
  const homNay = demoToday();
  const openCases = conn
    .prepare(
      `SELECT sc.id, sc.title, sc.category, sc.topic, sc.attempt_id, COALESCE(sc.cycle_id, a.cycle_id) AS eff_cycle_id, u.full_name AS owner FROM sos_cases sc
         LEFT JOIN users u ON u.id = sc.owner_user_id LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
        WHERE sc.student_id = ? AND sc.status != 'done' ORDER BY sc.id`,
    )
    .all(sid) as any[];
  const ft = !!enr.is_fast_track;
  /* Khoá / lộ trình đang chạy + tuần bắt đầu — MỘT câu cho tuần học (FT), Target (Lên FT), kế hoạch FT → thường. */
  const cyc = conn.prepare(`SELECT cy.*, sp.week_start FROM learning_cycles cy LEFT JOIN report_periods sp ON sp.id = cy.start_period_id
                             WHERE cy.student_id = ? AND cy.status = 'active'`).get(sid) as any;
  const pr = ft ? undefined : classProgressMany([enr.class_id]).get(enr.class_id);
  const tuCuoiKhoa = !ft && mocKetKhoa(pr, homNay).tuCuoiKhoa;

  let luat: LuatDoiLop | null = null;
  let goiY = new Map<number, { id: number; ten: string } | null>();
  let doiChiNhanh = false;
  const seDong = new Set<number>();
  let huong: { boiCanh: 'cuoi-khoa' | 'giua-khoa'; huong: HuongLenh } | null = null;
  let targetSan: MucTieuLenh | null = null;
  let nguonTarget: 'gvcn' | 'khoa' | 'quyet-dinh' | null = null;
  let mt0: { tuXep: string | null } | null = null;
  let veThuong: { route: string | null; mt0: { coDiem: boolean; kyNang: string[] } | null; mockHuy: string[]; giuDiem: string[] } | null = null;
  let khoi: { khiChuyen: string[]; canhBao: boolean } = { khiChuyen: [], canhBao: false };
  if (toClassId) {
    const toClass = lopDichHopLe(toClassId, enr.class_id);
    if (!toClass) throw badRequest('Lớp chuyển đến không hợp lệ.');
    const tuLop: LoaiLop = { ma: (enr.programme_code ?? null) as ProgrammeCode | null, ft, lt: enr.route };
    const denLop: LoaiLop = { ma: (toClass.programme_code ?? null) as ProgrammeCode | null, ft: !!toClass.is_fast_track, lt: toClass.route };
    huong = huongChuyenMotEm(enr, toClass, homNay, tuCuoiKhoa);
    luat = luatDoiLop(tuLop, denLop, huong.boiCanh);
    goiY = nguoiNhanGoiY(openCases, toClassId);
    doiChiNhanh = enr.branch_id !== toClass.branch_id;
    if (!ft && denLop.ft) {
      /* Target như `raLenh` (LCa-2): Target GVCN ghi ở Lộ trình tiếp theo → khoá đang chạy (KCK giữ) → null (web hỏi). */
      const lt = conn.prepare('SELECT muc_tieu FROM lo_trinh_tiep_theo WHERE student_id = ? AND class_id = ?').get(sid, enr.class_id) as any;
      const khoa = cyc && !cyc.route ? { target: cyc.target_score ?? null, kck: !!cyc.khong_cam_ket } : null;
      targetSan = targetLenFt({ lt: lt ? { mucTieu: lt.muc_tieu ?? null } : null, khoa });
      nguonTarget = targetSan === null ? null : typeof lt?.muc_tieu === 'number' ? 'gvcn' : 'khoa';
      /* R-C6: lệnh `cho` mang Target → giữ Target đó (như R-C3), chữ "(đã quyết)". */
      const lc = conn.prepare(`SELECT muc_tieu, khong_cam_ket FROM lenh_chuyen_lop WHERE student_id = ? AND trang_thai = 'cho'`).get(sid) as any;
      if (lc && (lc.khong_cam_ket || typeof lc.muc_tieu === 'number')) { targetSan = ghepMucTieu(lc.muc_tieu, lc.khong_cam_ket); nguonTarget = 'quyet-dinh'; }
      /* MT0 thành đầu vào: MT0 đang có (giữa khoá `noiMt0VaoFt` mang theo); Cuối khoá thì `dongBoMt0` mở lại / tự xếp ở tuần Final. */
      const m = cyc && !cyc.route ? conn.prepare(`SELECT status FROM assessment_attempts WHERE cycle_id = ? AND kind = 'mt0' ORDER BY id DESC LIMIT 1`).get(cyc.id) as any : null;
      const cuoiKhoaCoMt0 = tuCuoiKhoa && coMt0(tuLop.ma, 'fast_track');
      if (m && (m.status !== 'cancelled' || cuoiKhoaCoMt0)) mt0 = { tuXep: null };
      else if (!m && cuoiKhoaCoMt0) mt0 = { tuXep: pr?.finalWeekStart ? tuanLich(pr.finalWeekStart, homNay) : null };
    }
    if (ft && !denLop.ft && cyc) {
      const k = keHoachVeThuong(cyc);
      veThuong = { route: cyc.route ?? null, mt0: k.mt0 && { coDiem: k.mt0.coDiem, kyNang: k.mt0.kyNang }, mockHuy: k.mockHuy.map((x) => x.ten), giuDiem: k.giuDiem };
    }
    /* Fix M1: Case tự đóng = đúng phạm vi `closeCasesOnProgrammeSwitch` (chương trình cũ); Case khác đi theo em. Vài Case một em — `programmeOfCase` từng Case. */
    const ctDong = luat.dongCase === 'normal' ? 'band' : luat.dongCase === 'ft' ? 'ratio' : null;
    for (const c of openCases) if (ctDong && programmeOfCase({ ...c, cycle_id: c.eff_cycle_id ?? null }) === ctDong) seDong.add(c.id);
    const nhan = openCases.map((c) => goiY.get(c.id)).find(Boolean);
    khoi = dongKhiChuyen({
      nguonFt: ft, dichFt: denLop.ft, khoa: luat.khoa, routeNguon: enr.route ?? null, routeDich: denLop.ft ? (toClass.route ?? enr.route ?? 'LT1') : null,
      maNguon: tuLop.ma, mt0, target: targetSan === null || !nguonTarget ? null : { giaTri: targetSan, nguon: nguonTarget }, veThuong,
      soCase: ctDong ? seDong.size : openCases.length, dongCase: luat.dongCase, goiYNhan: nhan?.ten ?? null, doiChiNhanh,
    });
  }
  const truoc = ft ? conn.prepare(
    `SELECT c.code, c.is_fast_track FROM enrollments e JOIN classes c ON c.id = e.class_id
      WHERE e.student_id = ? AND e.id != ? ORDER BY e.started_at DESC, e.id DESC LIMIT 1`,
  ).get(sid, enr.id) as any : null;

  return {
    hienTai: {
      lop: { id: enr.class_id, code: enr.code }, ma: (enr.programme_code ?? null) as ProgrammeCode | null,
      ft, chiNhanhId: enr.branch_id, route: (enr.route ?? null) as string | null,
      tuanHoc: (() => {
        /* PR-UXF-a Q6 (Q31-11): FT không giới hạn tuần — "tuần học n" của EM (từ tuần bắt đầu lộ trình, bỏ tuần Tạm dừng), không mẫu số. */
        if (ft) {
          const th = cyc?.week_start ? tuanHocTai(cyc.week_start, homNay, khoangTamDung([sid])[sid] ?? []) : null;
          return th ? { tuan: th.tuan, tong: null as number | null, dangDung: th.dangDung } : null;
        }
        return pr?.currentWeek && pr.totalWeeks && pr.currentWeek >= 1 ? { tuan: pr.currentWeek as number | null, tong: pr.totalWeeks as number | null, dangDung: false } : null;
      })(),
    },
    caseMo: openCases.map((c) => ({
      id: c.id, title: c.title, category: c.category, owner: c.owner ?? null,
      seDong: seDong.has(c.id),
      goiY: toClassId ? (goiY.get(c.id) ?? null) : null,
    })),
    luat, canLuuY: openCases.length === 0, doiChiNhanh,
    /** PR-CL (B3): bối cảnh + hướng máy chủ sẽ ra lệnh; Target đã có khi Lên FT (`null` → web hiện ô Target); MT0; việc FT → thường. */
    boiCanh: huong?.boiCanh ?? null, huong: huong?.huong ?? null, targetSan, nguonTarget, mt0, veThuong,
    khiChuyen: khoi.khiChuyen, canhBao: khoi.canhBao,
    /** OV-11d (HV-13): tuần Final của lớp nguồn (lớp thường) — panel tính hạn bàn giao bằng `hanBanGiaoLenh` như lúc ra lệnh. */
    tuanFinal: (pr?.finalWeekStart ?? null) as string | null,
    /** Em FT có ghi danh ngay trước ở lớp thường → mã lớp đó ("tuần 1 · từ CP ELE 30"). */
    tuLopThuong: truoc && !truoc.is_fast_track ? (truoc.code as string) : null,
    /** PR-CT: lệnh đang chờ của em (nếu có) — panel mở ở chế độ sửa + Huỷ quyết định. */
    lenh: (() => {
      const l = conn.prepare(`SELECT id, huong, lop_dich_id, tuan_bat_dau, muc_tieu, khong_cam_ket, ngay_thi, ly_do, loi, han_gvcn FROM lenh_chuyen_lop WHERE student_id = ? AND trang_thai = 'cho'`).get(sid) as any;
      return l ? {
        id: l.id as number, huong: l.huong as string, lopDichId: (l.lop_dich_id ?? null) as number | null, tuan: l.tuan_bat_dau as string,
        mucTieu: ghepMucTieu(l.muc_tieu, l.khong_cam_ket), ngayThi: (l.ngay_thi ?? null) as string | null,
        lyDo: (l.ly_do ?? null) as string | null, loi: (l.loi ?? null) as string | null, hanGvcn: (l.han_gvcn ?? null) as string | null,
      } : null;
    })(),
    tuanChon: tuanChonDuoc(homNay),
    today: homNay,
  };
}

// ---------------------------------------------------------------- Chuyển tiếp CẢ LỚP (Task 5, Q20 — ghi theo nhóm)

export type DongCaLop = {
  sid: number; huong: 'len_lop' | 'hoc_lai' | 'fast_track';
  toClassId: number; toClass: { ma: ProgrammeCode | null; ft: boolean; branchId: number; code: string; route?: string | null };
  mucTieu?: number | null;
  thangThi?: string | null;
};

/**
 * ÁP DỤNG "lên lớp / học lại / sang Fast Track" cho CẢ LÔ học viên của một lớp đã hết khoá —
 * ghi THEO NHÓM (Q20), không một câu SQL nào lặp theo từng em, TRỪ `closeCasesOnProgrammeSwitch`
 * của những em sang FT (ngoại lệ duy nhất được phép, S17).
 *
 * Mọi dòng trong `dongs` đứng CÙNG lớp nguồn (`boiCanh = 'cuoi-khoa'`, từ luôn là lớp thường) —
 * nên `luatDoiLop` luôn ra `khoa = 'dong-mo'` bất kể lớp chuyển đến, và lượt Test chưa làm luôn Ở LẠI
 * lớp cũ (Q12) — không cần đọc/ghi `assessment_attempts` ở đây.
 */
export function apDungCaLop(p: Principal, o: {
  fromClass: { id: number; code: string };
  ngay: string;
  dongs: DongCaLop[];
}): void {
  if (!o.dongs.length) return;
  const conn = db();
  const now = nowIso();

  // 1) Đóng enrollment cũ — nhóm theo end_kind (tối đa 3 câu, không phụ thuộc số em).
  for (const huong of ['len_lop', 'hoc_lai', 'fast_track'] as const) {
    const ids = o.dongs.filter((d) => d.huong === huong).map((d) => d.sid);
    if (!ids.length) continue;
    const endKind = huong === 'fast_track' ? 'sang_ft' : huong;
    const ph = ids.map(() => '?').join(',');
    conn
      .prepare(
        `UPDATE enrollments SET status = 'transferred', ended_at = ?, end_kind = ?
          WHERE class_id = ? AND status = 'active' AND student_id IN (${ph})`,
      )
      .run(o.ngay, endKind, o.fromClass.id, ...ids);
  }

  // 2) Mở enrollment mới — MỘT INSERT nhiều dòng.
  {
    const rows = o.dongs.map(() => '(?,?,\'active\',?,?)').join(',');
    const params = o.dongs.flatMap((d) => [d.sid, d.toClassId, o.ngay, now]);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES ${rows}`).run(...params);
  }

  // 3) students.branch_id — nhóm theo chi nhánh đích (thường chỉ 1). OV-13j: chi nhánh cũ đọc trước (MỘT câu mỗi lô) cho nhật ký từng em.
  const cnCu = new Map<number, number | null>();
  theoLo(o.dongs.map((d) => d.sid), (lo, ph) => {
    for (const r of conn.prepare(`SELECT id, branch_id FROM students WHERE id IN (${ph})`).all(...lo) as any[]) cnCu.set(r.id, r.branch_id);
  });
  {
    const byBranch = new Map<number, number[]>();
    for (const d of o.dongs) {
      if (!byBranch.has(d.toClass.branchId)) byBranch.set(d.toClass.branchId, []);
      byBranch.get(d.toClass.branchId)!.push(d.sid);
    }
    for (const [branchId, ids] of byBranch) {
      const ph = ids.map(() => '?').join(',');
      conn.prepare(`UPDATE students SET branch_id = ? WHERE id IN (${ph})`).run(branchId, ...ids);
    }
  }
  /* CV-LOI: Case chưa có người phụ trách của các em → gán theo lớp mới, cùng giao dịch (ponytail: một lô ≤ cỡ một lớp, dưới trần 900 tham số). */
  ganChuCaseThieu({ studentIds: o.dongs.map((d) => d.sid), actorId: p.userId, luc: now });

  /* PR-NT (chủ sản phẩm 04/10): lên lớp / học lại lớp thường giữ Target + Dự kiến thi — đọc khoá cũ MỘT câu trước khi đóng. */
  const khoaCu = new Map<number, any>();
  theoLo(o.dongs.map((d) => d.sid), (lo, ph) => {
    for (const c of conn.prepare(`SELECT id, student_id, target_score, khong_cam_ket, exam_month, exam_date, exam_period_id FROM learning_cycles
                                   WHERE status = 'active' AND student_id IN (${ph})`).all(...lo) as any[]) khoaCu.set(c.student_id, c);
  });

  // 4) Đóng khoá đang chạy — MỘT UPDATE (mọi dòng ở đây đều dong-mo).
  const dongTheoLyDo = new Map<'len_lop' | 'hoc_lai' | 'sang_ft', number[]>();
  {
    const sids = o.dongs.map((d) => d.sid);
    const ph = sids.map(() => '?').join(',');
    /* PR-TK: id các lộ trình đang chạy lấy TRƯỚC câu UPDATE, rồi ghi bản chụp MỘT lần cho cả lô (nhóm theo lý do: một lô có thể trộn lên lớp / học lại / sang FT). */
    const huongCua = new Map(o.dongs.map((d) => [d.sid, d.huong]));
    theoLo(sids, (lo, ph2) => {
      for (const r of conn.prepare(`SELECT id, student_id FROM learning_cycles WHERE status = 'active' AND student_id IN (${ph2})`).all(...lo) as any[]) {
        const h = huongCua.get(r.student_id);
        const lyDo = h === 'fast_track' ? 'sang_ft' : h!;
        dongTheoLyDo.set(lyDo, [...(dongTheoLyDo.get(lyDo) ?? []), r.id as number]);
      }
    });
    conn.prepare(`UPDATE learning_cycles SET status = 'completed', ended_at = ? WHERE student_id IN (${ph}) AND status = 'active'`)
      .run(o.ngay, ...sids);
  }

  // 5) Mở khoá mới — đọc seq theo lô (MỘT câu), rồi MỘT INSERT nhiều dòng.
  let ftMoiCua = new Map<number, number>();
  const tgMoi = new Map<number, ReturnType<typeof doiTg>>();
  {
    const sids = o.dongs.map((d) => d.sid);
    const ph = sids.map(() => '?').join(',');
    const seqRows = conn
      .prepare(`SELECT student_id, MAX(seq) n FROM learning_cycles WHERE student_id IN (${ph}) GROUP BY student_id`)
      .all(...sids) as any[];
    const seqOf = new Map(seqRows.map((r) => [r.student_id, r.n as number]));
    const toClassIds = [...new Set(o.dongs.map((d) => d.toClassId))];
    const ph2 = toClassIds.map(() => '?').join(',');
    const toClassRows = conn.prepare(`SELECT id, start_period_id FROM classes WHERE id IN (${ph2})`).all(...toClassIds) as any[];
    const startPeriodOf = new Map(toClassRows.map((r) => [r.id, r.start_period_id as number | null]));
    /* Cùng một ngày hiệu lực cho cả lớp — chỉ cần MỘT lần ensurePeriod cho mọi em sang FT. */
    const ftPeriodId = o.dongs.some((d) => d.toClass.ft) ? ensurePeriod(mondayOf(o.ngay)).id : null;

    /* PR-DUYET (T44): target chỉ nhận khi sang FT (bắt buộc có) hoặc người gọi có `cycle.edit` — như Chuyển lớp một em. */
    /* Mọi em cùng MỘT lớp nguồn → kiểm quyền một lần theo lớp (không truy vấn theo từng em, Q20). */
    const coSuaTarget = can(p, PERMISSIONS.CYCLE_EDIT, { classId: o.fromClass.id });
    /* FT→FT cũng nhận target: chỉ QL/QT gọi được (CYCLE_EDIT), vô hại — rà #117 (PR-Dọn VN03). */
    const params = o.dongs.map((d) => {
      const mucTieu = d.toClass.ft || coSuaTarget ? d.mucTieu ?? null : null;
      const cu = d.toClass.ft ? null : khoaCu.get(d.sid);   // lớp nguồn luôn là lớp thường → sang lớp thường thì giữ Target
      /* PR-LCb (§7): Dự kiến thi giữ ở mọi chiều (cả Lên FT) khi lệnh không mang tháng thi. */
      const thiCu = khoaCu.get(d.sid);
      const giuThi = !!thiCu && !d.thangThi;
      return [
        d.sid, (seqOf.get(d.sid) ?? 0) + 1, d.toClass.ft ? (d.toClass.route ?? 'LT1') : null, d.toClass.ma,
        mucTieu ?? cu?.target_score ?? null, mucTieu == null && cu?.khong_cam_ket ? 1 : 0,
        giuThi ? thiCu.exam_month ?? null : d.thangThi ?? null, giuThi ? thiCu.exam_date ?? null : null, giuThi ? thiCu.exam_period_id ?? null : null,
        d.toClass.ft ? ftPeriodId : (startPeriodOf.get(d.toClassId) ?? null), o.ngay, 'active', now,
      ];
    });
    /* OV-13o: Target / KCK lộ trình mới so với khoá cũ — cho nhật ký Chuyển lớp từng em (cột 5, 6 của dòng chèn). */
    o.dongs.forEach((d, i) => tgMoi.set(d.sid, doiTg(khoaCu.get(d.sid), { target_score: params[i][4] as number | null, khong_cam_ket: params[i][5] as number })));
    /* 13 cột/em: `chenNhieuDong` tự chia lô theo trần tham số. */
    chenNhieuDong(
      `INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, khong_cam_ket, exam_month, exam_date, exam_period_id,
                                    start_period_id, started_at, status, created_at)`, params);
    /* M1: em sang FT có lịch MT mặc định. INSERT nhiều dòng không trả id → đọc lại MỘT câu; tạo lượt theo lô (PR-TOC). */
    const ftSids = o.dongs.filter((d) => d.toClass.ft).map((d) => d.sid);
    if (ftSids.length) {
      const ftCycles = conn.prepare(
        `SELECT id, student_id FROM learning_cycles WHERE student_id IN (${ftSids.map(() => '?').join(',')}) AND status = 'active' AND route IS NOT NULL`,
      ).all(...ftSids) as any[];
      taoMtMacDinhLo(ftCycles.map((c) => ({ cycleId: c.id })), { actorUserId: p.userId });
      ftMoiCua = new Map(ftCycles.map((c) => [c.student_id as number, c.id as number]));
    }
    /* PR-LT2a M1b: em sang lớp thường (Chuyển tiếp lớp) tự có bài Giữa khoá / Cuối khoá — MỘT câu đọc lại lộ trình mới + tạo theo lô. */
    const thuongSids = o.dongs.filter((d) => !d.toClass.ft).map((d) => d.sid);
    if (thuongSids.length) {
      const cyc = conn.prepare(
        `SELECT id FROM learning_cycles WHERE student_id IN (${thuongSids.map(() => '?').join(',')}) AND status = 'active' AND route IS NULL`,
      ).all(...thuongSids) as any[];
      taoBaiThuongMacDinh(cyc.map((c) => c.id as number), p.userId, o.ngay);
    }
  }

  // 5b) PR-MT0 (T5b): sang FT → MT0 thành mốc đầu vào lộ trình FT mới; hướng khác → MT0 chưa điểm huỷ. Theo lô.
  noiMt0VaoFt(p.userId, o.dongs.map((d) => ({ sid: d.sid, cuCycleId: khoaCu.get(d.sid)?.id ?? null, ftCycleId: ftMoiCua.get(d.sid) ?? null, ngay: o.ngay })));
  /* PR-TK: bản chụp MỘT lần cho cả lô (nhóm theo lý do). PR-MT0: SAU bước 5b — MT0 đã thành đầu vào FT không nằm trong bản chụp khoá cũ. */
  for (const [lyDo, ids] of dongTheoLyDo) ghiBanChup(conn, ids, { lyDo, ngay: o.ngay, lopId: o.fromClass.id });

  // 6) Case: chỉ em sang FT đóng Case lớp thường — ngoại lệ per-em DUY NHẤT được phép (S17).
  /* PR-TOC: lọc trước MỘT câu — chỉ em còn Case mở / tín hiệu chờ mới đi từng em (em không có gì thì hàm đóng vốn không làm gì). */
  const sangFt = o.dongs.filter((d) => d.huong === 'fast_track').map((d) => d.sid);
  const coViecMo = new Set<number>();
  theoLo(sangFt, (lo, ph) => {
    for (const r of conn.prepare(
      `SELECT COALESCE(sc.student_id, a.student_id) AS sid FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
        WHERE sc.status != 'done' AND COALESCE(sc.student_id, a.student_id) IN (${ph})
       UNION SELECT student_id FROM case_signals WHERE status = 'pending' AND student_id IN (${ph})`).all(...lo, ...lo) as any[]) {
      coViecMo.add(r.sid);
    }
  }, THAM_SO_TOI_DA / 2);
  for (const sid of sangFt) {
    if (coViecMo.has(sid)) closeCasesOnProgrammeSwitch(p.userId, sid, 'ft', o.ngay);
  }

  // 6b) PR-LT2b: Cuối khoá — Case đi theo em (lớp thường → lớp thường) + bổ trợ miễn phí, Báo PH qua TVV, Tutor FT. Sau bước 6 (Case FT đã đóng).
  if (isRatioClass(o.fromClass.id)) {
    sauChuyenCuoiKhoa(p, o.dongs.map((d) => ({ sid: d.sid, fromClassId: o.fromClass.id, toClassId: d.toClassId, toFt: d.toClass.ft, huong: d.huong, ngay: o.ngay })));
  }

  // 7) Hành trình — MỘT INSERT nhiều dòng.
  {
    const rows = o.dongs.map(() => '(?,?,?,?,NULL,NULL,?,?)').join(',');
    const params = o.dongs.flatMap((d) => [
      d.sid, 'promote', o.ngay,
      d.huong === 'fast_track' ? `Lên FT ${d.toClass.code}`
        : d.huong === 'hoc_lai' ? `Học lại ${d.toClass.code}` : `Lên lớp ${d.toClass.code}`,
      p.userId, now,
    ]);
    conn
      .prepare(
        `INSERT INTO journey_events (student_id, event_type, event_date, title, ref_table, ref_id, created_by, created_at)
         VALUES ${rows}`,
      )
      .run(...params);
  }
  /* OV-13j: mỗi em một dòng nhật ký Chuyển lớp (lớp + chi nhánh nếu đổi) — MỘT câu. */
  writeAuditLo(o.dongs.map((d) => ({
    actorUserId: p.userId, action: 'student.transfer', entityType: 'student', entityId: d.sid, entityLabel: d.toClass.code,
    before: { classId: o.fromClass.id, ...doiCn(cnCu.get(d.sid) ?? null, d.toClass.branchId).truoc, ...tgMoi.get(d.sid)?.truoc },
    after: { classId: d.toClassId, huong: d.huong, ...doiCn(cnCu.get(d.sid) ?? null, d.toClass.branchId).sau, ...tgMoi.get(d.sid)?.sau },
  })));
}

/**
 * Tạm dừng học (bảo lưu) cả lô — MỘT UPDATE học viên, ghi `end_reason` THEO NHÓM lý do (số nhóm bị chặn bởi số
 * lý do KHÁC NHAU trong lô, không phải theo từng em), MỘT INSERT hành trình. Ghi `created_by`
 * đúng người bấm xác nhận (sửa sau rà PR #86, vấn đề 7c — trước đây ghi NULL).
 */
export function apDungBaoLuuCaLop(p: Principal, o: { fromClassId: number; ngay: string; dongs: { sid: number; lyDo: string }[] }): void {
  if (!o.dongs.length) return;
  const conn = db();
  const now = nowIso();
  const ids = o.dongs.map((d) => d.sid);
  const ph = ids.map(() => '?').join(',');
  conn.prepare(`UPDATE students SET status = 'inactive' WHERE id IN (${ph})`).run(...ids);
  const byLyDo = new Map<string, number[]>();
  for (const d of o.dongs) {
    if (!byLyDo.has(d.lyDo)) byLyDo.set(d.lyDo, []);
    byLyDo.get(d.lyDo)!.push(d.sid);
  }
  for (const [lyDo, sids] of byLyDo) {
    const ph2 = sids.map(() => '?').join(',');
    conn
      .prepare(
        `UPDATE enrollments SET status = 'paused', end_kind = 'bao_luu', end_reason = ?
          WHERE class_id = ? AND status = 'active' AND student_id IN (${ph2})`,
      )
      .run(lyDo, o.fromClassId, ...sids);
  }
  const rows = o.dongs.map(() => '(?,?,?,?,NULL,NULL,?,?)').join(',');
  const params = o.dongs.flatMap((d) => [d.sid, 'pause', o.ngay, `Tạm dừng học (bảo lưu) — ${d.lyDo}`, p.userId, now]);
  conn
    .prepare(
      `INSERT INTO journey_events (student_id, event_type, event_date, title, ref_table, ref_id, created_by, created_at)
       VALUES ${rows}`,
    )
    .run(...params);
  /* OV-13j: mỗi em một dòng nhật ký Tạm dừng — MỘT câu. Không kèm `ghiDanhDung` nên không mở "Hoàn tác Tạm dừng" cho đường cả lớp. */
  writeAuditLo(o.dongs.map((d) => ({
    actorUserId: p.userId, action: 'student.status', entityType: 'student', entityId: d.sid,
    before: { status: 'active' }, after: { status: 'inactive', date: o.ngay, reason: d.lyDo },
  })));
}
