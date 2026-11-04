import { db, tx } from '../db.ts';
import { nho } from '../platform/nguCanhRequest.ts';
import {
  BASELINE_SOURCES, CO_DIEM_SQL, CYCLE_OUTCOMES, CYCLE_OUTCOME_LABEL, CYCLE_STATUSES, PERMISSIONS, soMtKeTiep, tuanLich,
  canNamGan, docNgayNhap, hienTargetKck, mondayOfDate, tachKck, ngay, type ExamPlan, type LuotSo, type Route,
  CHI_SUA_THONG_TIN, CAU_LIEN_TUC, duocDoiKck, laBandLenh, nhanThang, docTargetKyThi, kyThiCuaChuongTrinh,
} from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { closeCasesBySystem } from '../cases/systemClose.ts';
import { HttpError, badRequest, chuTuDo, forbidden, isIsoDate, kiemKieuO, notFound, nowIso, loi as loiHttp } from '../util.ts';
import { can as coQuyen, require_, vaiVoiEm, type Ctx, type Principal } from '../permissions.ts';
import { addJourney, writeAudit } from '../platform/audit.ts';
import { ensurePeriod, mondayOf, periodById } from '../platform/week.ts';
import { apLichMacDinh } from '../classes/schedule.ts';
import { taoMtMacDinh } from './mtMacDinh.ts';
import { activeRouteCodes } from '../platform/sysconfig.ts';
import { ghiBanChup } from '../loTrinh/banChup.ts';
import { programmeByCode } from '../normal/regular.ts';

/**
 * Lộ trình học của một học viên.
 *
 * Học tiếp hoặc học lại TRONG cùng lộ trình: số MT tăng tiếp, target giữ nguyên, nên từ
 * MT3 trở đi kỳ vọng luôn bằng target. Chỉ khi sang lộ trình mới (LT1 → LT2) mới đánh số
 * lại từ MT1, vì lúc đó học viên đã có target mới.
 */
/** Mọi lộ trình của em theo `seq` — PR-Dọn (Task 9d): nhớ trong request GET (hồ sơ HV đọc lại ở lộ trình đang chạy, bảng kỹ năng). */
export function cyclesOf(studentId: number) {
  return nho(`ds-lo-trinh:${studentId}`, () => db()
    .prepare('SELECT * FROM learning_cycles WHERE student_id = ? ORDER BY seq')
    .all(studentId) as any[]);
}

/** Lộ trình đang chạy có `seq` lớn nhất; không có thì lộ trình `seq` lớn nhất (= `ORDER BY (status = 'active') DESC, seq DESC`). */
export function currentCycle(studentId: number) {
  const ds = cyclesOf(studentId);
  return [...ds].reverse().find((c) => c.status === 'active') ?? ds.at(-1) ?? null;
}

/**
 * PR-Dọn (Q11): MỘT cách chọn lộ trình để đếm "tuần học n" — chương Hành trình, đầu hồ sơ, panel Chuyển lớp một em và cả lớp.
 * Đang học (ghi danh `active`, hoặc `paused` chưa rời) → lộ trình ĐANG CHẠY; chương đã rời (hoặc không có lộ trình đang chạy) →
 * lộ trình bắt đầu muộn nhất không sau ngày vào lớp (không có thì lộ trình đầu). Panel Chuyển lớp đọc thẳng `cy.status = 'active'`
 * trong câu SQL của nó — đúng nhánh `dangHoc: true` của hàm này.
 */
export function loTrinhTinhTuan<T extends { status: string; started_at: string }>(cycles: readonly T[], o: { dangHoc: boolean; ngayVao: string }): T | null {
  if (o.dangHoc) {
    const chay = cycles.find((c) => c.status === 'active');
    if (chay) return chay;
  }
  return [...cycles].sort((a, b) => a.started_at.localeCompare(b.started_at)).filter((c) => c.started_at <= o.ngayVao).at(-1) ?? cycles[0] ?? null;
}

export function cycleById(id: number) {
  return (db().prepare('SELECT * FROM learning_cycles WHERE id = ?').get(id) as any) ?? null;
}

/** Lượt của một lộ trình ở dạng luật đánh số (T36, Q-B) — một câu, kể cả lượt đã huỷ (còn điểm hay không). */
export function luotSoCuaLoTrinh(cycleId: number): LuotSo[] {
  return (db().prepare(`SELECT a.attempt_no, a.status, ${CO_DIEM_SQL('a')} AS coDiem,
       EXISTS (SELECT 1 FROM attempt_skills k WHERE k.attempt_id = a.id AND k.sit_status = 'sat') AS daThi
     FROM assessment_attempts a WHERE a.cycle_id = ?`)
    .all(cycleId) as any[]).map((r) => ({ attempt_no: r.attempt_no, status: r.status, coDiem: !!r.coDiem, daThi: !!r.daThi }));
}

/** Số MT tiếp theo TRONG lộ trình. Học lại cùng lộ trình thì số này tăng tiếp; số huỷ không điểm được dùng lại (Q-B). */
export function nextAttemptNo(cycleId: number): number {
  return soMtKeTiep(luotSoCuaLoTrinh(cycleId));
}

/**
 * DỰ KIẾN THI của một lộ trình, ở đúng mức chắc chắn mà người ta thực sự biết.
 *
 * Ba mức, và giao diện hiển thị đúng ba mức đó chứ không quy về một:
 *   `week`  đã chốt tuần   → "W2 FEB 2027"  — có đếm ngược theo tuần
 *   `month` mới biết tháng → "FEB 2027"     — KHÔNG đếm ngược
 *   `none`  chưa biết gì   → "Chưa xác định"
 *
 * Chỉ đếm ngược khi đã có tuần. Biết mỗi tháng mà vẫn hiện "còn 134 ngày" là bịa ra một
 * độ chính xác không có thật, và người đọc sẽ tin con số đó.
 *
 * NHÃN CỦA MỨC `month` CHỈ CÒN TÊN THÁNG (mục 5.2). Cụm "· chưa xác định tuần" đã bỏ: nó
 * dài hơn chính thông tin nó bổ nghĩa, lặp ở mọi chỗ hiện kế hoạch thi, và nói một điều đã
 * nằm sẵn trong `confidence` — chỗ nào cần phân biệt thì đọc `confidence`, đừng nhồi vào
 * chuỗi hiển thị.
 */

export function examPlanOf(cycle: {
  exam_period_id?: number | null; exam_month?: string | null; exam_date?: string | null;
  /* Truy vấn nào JOIN sẵn bảng tuần thì truyền hai cột này vào, khỏi hỏi lại từng dòng. */
  exam_week_code?: string | null; exam_week_start?: string | null;
} | null | undefined): ExamPlan {
  const none: ExamPlan = { confidence: 'none', periodId: null, weekStart: null, month: null, label: 'Chưa xác định' };
  if (!cycle) return none;
  /* T9: có NGÀY thi cụ thể → nhãn là chính ngày đó (15/01/2027), tuần suy từ ngày. */
  if (cycle.exam_date && isIsoDate(cycle.exam_date)) {
    return { confidence: 'week', periodId: cycle.exam_period_id ?? null, weekStart: mondayOfDate(cycle.exam_date),
             month: cycle.exam_date.slice(0, 7), label: ngay(cycle.exam_date) };
  }
  if (cycle.exam_period_id) {
    const w = cycle.exam_week_code && cycle.exam_week_start
      ? { code: cycle.exam_week_code, weekStart: cycle.exam_week_start }
      : periodById(cycle.exam_period_id);
    if (w) {
      return { confidence: 'week', periodId: cycle.exam_period_id, weekStart: w.weekStart,
               month: w.weekStart.slice(0, 7), label: w.code };
    }
  }
  /* Q12: `exam_month` sai dạng (rác từ cột "Ngày thi" cũ, K2-20) coi như chưa có — không vẽ nhãn hỏng. */
  if (cycle.exam_month && /^\d{4}-\d{2}$/.test(cycle.exam_month)) {
    /* NEN-V5 (P5): tháng dự kiến một cách viết cả web, luôn kèm năm — "05/2027" (`nhanThang`, thay "MAY 2027"). */
    return { confidence: 'month', periodId: null, weekStart: null, month: cycle.exam_month, label: nhanThang(cycle.exam_month) };
  }
  return none;
}

/**
 * Q29-1 (PR-KCK) + OV-9: ô Target → { target, kck }. KCK là DẤU RIÊNG, Target giữ: "6.5 KCK" = Target 6.5 + KCK; KCK / '-' / "không cam kết" =
 * KCK chưa có Target; trống = chưa có; sai → 400.
 */
export function docTarget(v: unknown): { target: number | null; kck: boolean } {
  const { so, kck } = tachKck(v);
  if (so === null || so === undefined || so === '') return { target: null, kck };
  const n = Number(so);
  if (!laBandLenh(n)) throw badRequest('Target phải từ 0 đến 9, bước 0,5 (ví dụ 6.5) — thêm KCK nếu không cam kết.');
  return { target: n, kck };
}
/** P13 KET-PET: ô Target theo thang của lộ trình — KET / PET điểm Cambridge (số nguyên trong thang, không KCK; lỗi gắn ô `target`); còn lại band + KCK. */
export function docTargetCua(c: { route?: string | null; programme_code?: string | null } | null | undefined, v: unknown): { target: number | null; kck: boolean } {
  const kt = c && !c.route ? kyThiCuaChuongTrinh(c.programme_code) : null;
  if (!kt) return docTarget(v);
  const d = docTargetKyThi(kt, v);
  if ('loi' in d) throw badRequest(d.loi, { o: 'target' });
  return { target: d.so, kck: false };
}
const hienTarget = (target: number | null, kck: unknown) => hienTargetKck(target, !!kck);

/**
 * Q29-1: đổi target → lượt CHƯA CÓ ĐIỂM lấy target mới (OV-9: dấu KCK không đụng Target — đọc ở lộ trình). Lượt đã có điểm giữ `target_at_attempt`
 * cũ — lịch sử SOS không viết lại. Case SOS đang mở KHÔNG đụng tới (GV xử lý xong mới đóng).
 */
function apTargetLuotChuaDiem(cycleId: number, target: number | null) {
  /* PR-NT: Target lớp thường không bật FT (chủ sản phẩm 04/10) — chỉ lượt Mock mang target; Giữa/Cuối khoá giữ NULL. */
  db().prepare(`UPDATE assessment_attempts SET target_at_attempt = ? WHERE cycle_id = ? AND kind = 'mock' AND NOT ${CO_DIEM_SQL('assessment_attempts')}`)
    .run(target, cycleId);
}

/** PR-DUYET (T44, Câu 1 = B): GVCN không tự sửa target/lộ trình — gửi Đề xuất sửa. Chuyển lớp vẫn là của GVCN. */
export const CHI_QL_SUA = 'Target và lộ trình do Quản lý sửa. Bấm "Đề xuất sửa" để gửi Quản lý duyệt.';
export const CHI_DOI_KCK = 'Chỉ Quản lý, Quản trị và Tư vấn viên tích / bỏ KCK.';

export function createCycle(p: Principal, input: {
  studentId: number; route?: Route | null; targetScore?: number | string | null;
  examPeriodId?: number | null; startedAt?: string; note?: string | null;
}) {
  const conn = db();
  /* PR-DUYET (T44): mở lộ trình MỚI cho em đã có lộ trình = đổi lộ trình → Quản lý (`cycle.edit`). Lộ trình đầu tiên lúc thêm HV giữ `student.edit`. */
  const daCo = !!conn.prepare('SELECT 1 FROM learning_cycles WHERE student_id = ? LIMIT 1').get(input.studentId);
  if (daCo) require_(p, PERMISSIONS.CYCLE_EDIT, { studentId: input.studentId }, CHI_QL_SUA);
  else require_(p, PERMISSIONS.STUDENT_EDIT, { studentId: input.studentId }, 'Bạn không có quyền mở lộ trình mới cho học viên này.');
  const student = conn.prepare('SELECT * FROM students WHERE id = ?').get(input.studentId) as any;
  if (!student) throw notFound('Không tìm thấy học viên');
  if (input.examPeriodId && !periodById(Number(input.examPeriodId))) throw badRequest('Dự kiến thi không hợp lệ.');
  /* PR-Dọn (quét #20): chỉ nhận mã lộ trình đang dùng trong danh mục (Quản trị › Danh mục). */
  if (input.route != null && !activeRouteCodes().includes(String(input.route))) throw badRequest('Lộ trình không có trong danh mục đang dùng.');
  const startedAt = input.startedAt ?? demoToday();
  if (!isIsoDate(startedAt)) throw badRequest('Ngày bắt đầu không hợp lệ.');
  const t = docTarget(input.targetScore);

  return tx(() => {
    const seq = ((conn.prepare('SELECT MAX(seq) AS n FROM learning_cycles WHERE student_id = ?')
      .get(input.studentId) as any)?.n ?? 0) + 1;
    // Lộ trình cũ khép lại, nhưng KHÔNG xoá dữ liệu nào của nó.
    const dong = (conn.prepare(`SELECT id FROM learning_cycles WHERE student_id=? AND status='active'`).all(input.studentId) as any[]).map((r) => r.id as number);
    conn.prepare(`UPDATE learning_cycles SET status='completed', ended_at=? WHERE student_id=? AND status='active'`)
      .run(startedAt, input.studentId);
    ghiBanChup(conn, dong, { lyDo: 'lo_trinh_moi', ngay: startedAt, routeMoi: input.route ?? null });   // PR-TK: cùng giao dịch với câu đóng
    const info = conn
      .prepare(
        `INSERT INTO learning_cycles (student_id, seq, route, target_score, khong_cam_ket, exam_period_id, start_period_id, started_at, status, note, created_at)
         VALUES (?,?,?,?,?,?,?,?, 'active', ?, ?)`,
      )
      /* Q5: lộ trình FT ghi tuần bắt đầu = tuần của ngày bắt đầu — không có thì không lập được lịch MT mặc định (M1). */
      .run(input.studentId, seq, input.route ?? null, t.target, t.kck ? 1 : 0,
           input.examPeriodId ?? null, input.route ? ensurePeriod(mondayOf(startedAt)).id : null, startedAt, input.note ?? null, nowIso());
    const id = Number(info.lastInsertRowid);
    if (input.route) taoMtMacDinh(id, { actorUserId: p.userId });
    addJourney({
      studentId: input.studentId, eventType: 'cycle_start', eventDate: startedAt,
      title: `Bắt đầu lộ trình ${input.route ?? `#${seq}`}`,
      detail: t.kck || t.target ? `Target ${hienTarget(t.target, t.kck)}` : null,
      refTable: 'learning_cycles', refId: id, createdBy: p.userId,
    });
    writeAudit({ actorUserId: p.userId, action: 'cycle.create', entityType: 'learning_cycle', entityId: id,
      entityLabel: `${student.student_code} · ${input.route ?? seq}`, after: input });
    return conn.prepare('SELECT * FROM learning_cycles WHERE id = ?').get(id);
  });
}

/** Ô Tuần bắt đầu của lộ trình `c` → Thứ Hai ISO; sai → 400. Cận năm chỉ khi ĐỔI (PR-TOC). Chung cho `updateCycle` và Sửa cả lớp (PR-SL). */
export function docTuanBatDau(c: any, v: unknown): string {
  const w = docNgayNhap(v, demoToday());
  if (!w.iso) throw loiHttp(400, 'Tuần bắt đầu: {x}', { x: w.loi ?? 'bắt buộc' });
  const cu = c.start_period_id ? periodById(c.start_period_id)?.weekStart ?? null : null;
  const ngoai = mondayOf(w.iso) !== cu ? docNgayNhap(w.iso, demoToday(), canNamGan(demoToday())).loi : null;
  if (ngoai) throw loiHttp(400, 'Tuần bắt đầu: {ngoai}', { ngoai });
  return mondayOf(w.iso);
}

/** Ô Dự kiến thi (T9) → ngày ISO / tháng `yyyy-mm` / `null` (trống = xoá); sai → 400. Cận năm chỉ khi ĐỔI. Chung cho `updateCycle` và PR-SL. */
export function docDuKienThi(c: any, v: unknown): string | null {
  const t = docNgayNhap(v, demoToday(), { choThang: true });
  const ngoai = t.iso && t.iso !== (c.exam_date ?? c.exam_month) ? docNgayNhap(t.iso, demoToday(), { choThang: true, ...canNamGan(demoToday()) }).loi : null;
  if (t.loi || ngoai) throw loiHttp(400, 'Dự kiến thi: {x}', { x: t.loi ?? ngoai });
  return t.iso;
}

/** Điểm xuất phát gõ tay → số 0–9; trống / sai → 400. Chung cho `setBaseline` và PR-SL. */
export function docDiemXuatPhat(v: unknown): number {
  if (v === null || v === undefined || v === '') throw badRequest('Nhập điểm đầu vào hoặc chọn một bài đánh giá làm căn cứ.');
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0 || n > 9) throw badRequest('Điểm đầu vào phải nằm trong khoảng 0–9.');
  return n;
}

export function updateCycle(p: Principal, cycleId: number, patch: any) {
  const c = cycleById(cycleId);
  if (!c) throw notFound('Không tìm thấy lộ trình');
  if (!coQuyen(p, PERMISSIONS.STUDENT_EDIT, { studentId: c.student_id })) {
    /* PR-OV2a: Admin, TVV, CX chỉ sửa dự kiến thi ở lộ trình (Target, tuần bắt đầu, ghi chú, trạng thái: 403). */
    require_(p, PERMISSIONS.STUDENT_EDIT_INFO, { studentId: c.student_id });
    if (Object.keys(patch ?? {}).some((k) => !['examDate', 'examMonth', 'examPeriodId'].includes(k))) throw forbidden(CHI_SUA_THONG_TIN);
  }
  kiemKieuO(patch, ['startWeek', 'examDate', 'note'], [], (k) => ({ startWeek: 'Tuần bắt đầu', examDate: 'Dự kiến thi', note: 'Ghi chú' })[k] ?? k);
  /* PR-TOC: cận năm (năm nay −3 … +3) chỉ áp khi giá trị ĐỔI — lộ trình cũ gửi lại đúng giá trị đang lưu không bị chặn. */
  const can = canNamGan(demoToday());
  if (patch.startWeek !== undefined) {           // Thông tin HV gửi Thứ Hai ISO từ ô ngày thống nhất kiểu tuần
    patch = { ...patch, startPeriodId: ensurePeriod(docTuanBatDau(c, patch.startWeek)).id };
  }
  if (patch.examDate !== undefined) {            // T9: ngày → lưu ngày + suy tháng, tuần; tháng → chỉ tháng; trống → xoá cả hai
    const t = { iso: docDuKienThi(c, patch.examDate) };
    const la = t.iso?.length === 10;
    /*
     * PR-Dọn (Q16, VN15): đổi từ NGÀY sang THÁNG thì bỏ tuần của ngày cũ — panel Kế hoạch gửi lại `examPeriodId` cũ trong state, nên
     * chỉ giữ tuần gửi lên khi người dùng đã chọn tuần KHÁC. Tháng → tháng giữ như cũ (tuần chọn cho tháng vẫn đúng).
     */
    const ngaySangThang = !la && !!t.iso && !!c.exam_date;
    const tuanChonMoi = patch.examPeriodId != null && patch.examPeriodId !== '' && Number(patch.examPeriodId) !== c.exam_period_id ? patch.examPeriodId : null;
    patch = { ...patch, examMonth: t.iso ? t.iso.slice(0, 7) : null, examDateGhi: la ? t.iso : null,
      ...(la ? { examPeriodId: ensurePeriod(mondayOf(t.iso!)).id } : ngaySangThang ? { examPeriodId: tuanChonMoi } : {}) };
  }
  /*
   * Cùng cận năm cho tuần / tháng gửi THẲNG (StudentPlanPanel gửi `startPeriodId`, `examPeriodId`; API cũ gửi `examMonth`) — cũng chỉ
   * khi đổi. Id tuần không có thật để vòng ghi bên dưới báo như cũ.
   */
  for (const [k, cot, nhan] of [['startPeriodId', 'start_period_id', 'Tuần bắt đầu'], ['examPeriodId', 'exam_period_id', 'Dự kiến thi']] as const) {
    const v = patch[k];
    if (v == null || v === '' || Number(v) === c[cot]) continue;
    const tuan = periodById(Number(v))?.weekStart;
    const loi = tuan ? docNgayNhap(tuan, demoToday(), can).loi : null;
    if (loi) throw badRequest(`${nhan}: ${loi}`);
  }
  const thang = patch.examMonth ? String(patch.examMonth).slice(0, 7) : null;
  if (thang && thang !== c.exam_month && /^\d{4}-\d{2}$/.test(thang)) {
    const loi = docNgayNhap(thang, demoToday(), { choThang: true, ...can }).loi;
    if (loi) throw loiHttp(400, 'Dự kiến thi: {loi}', { loi });
  }
  /* PR-DUYET (T44): đổi target / lộ trình cần `cycle.edit` — chỉ khi giá trị THẬT SỰ đổi (panel gửi cả ô không sửa). Dự kiến thi giữ `student.edit` (Q7). */
  /* Q29-1: targetScore nhận cả KCK — `reviseTarget` ghi kèm `khong_cam_ket`. */
  /*
   * PR-Dọn (Q15, VN25): MỘT đường đổi target — đổi thật thì đi qua `reviseTarget` (ghi `cycle_target_revisions` + Hành trình), bắt
   * `lyDo`; câu UPDATE chung không còn ghi target.
   */
  let doiTarget = false;
  const targetGui = patch.targetScore;
  if (targetGui !== undefined) {
    const t = docTarget(targetGui);
    doiTarget = t.target !== (c.target_score ?? null) || t.kck !== !!c.khong_cam_ket;
  }
  patch = { ...patch, targetScore: undefined, khongCamKetGhi: undefined };
  const doiLoTrinh = patch.route !== undefined && (patch.route ?? null) !== (c.route ?? null);
  if (doiTarget || doiLoTrinh) require_(p, PERMISSIONS.CYCLE_EDIT, { studentId: c.student_id }, CHI_QL_SUA);
  if (doiTarget && !(typeof patch.lyDo === 'string' && patch.lyDo.trim())) throw badRequest('Ghi lý do đổi Target.');
  if (patch.status !== undefined && !(CYCLE_STATUSES as readonly string[]).includes(String(patch.status))) {
    throw badRequest('Trạng thái lộ trình không hợp lệ.');
  }
  /*
   * S16 CHỈ khi nơi gọi nói rõ "em thôi học" (`dongCaseKhiKetThuc: true`). Luồng "Lên lớp thường tiếp" (PR-LT) hoàn tất khoá cũ mà
   * KHÔNG truyền cờ — Case bàn giao sang khoá mới (§3.9). Không cờ = không đóng gì. Cờ đọc riêng, không phải cột: `map` bỏ qua
   * khoá lạ nên nó không lọt vào câu UPDATE.
   */
  const closeOnEnd = patch.dongCaseKhiKetThuc === true
    && c.status === 'active' && patch.status !== undefined && patch.status !== 'active';
  const map: Record<string, string> = {
    route: 'route', note: 'note', status: 'status',
    /*
     * Hai trường của vòng 4. Quyền sửa: Admin CN · Quản lý · GVCN của lớp (mục 7.5) —
     * `student.edit` đã bao đúng ba vai đó, nên không thêm quyền mới.
     */
    startPeriodId: 'start_period_id', examMonth: 'exam_month', examPeriodId: 'exam_period_id',
    /* Khoá NỘI BỘ (T9): người gọi gửi `examDate`, khối trên đổi thành `examDateGhi` đã kiểm. */
    examDateGhi: 'exam_date',
  };
  const sets: string[] = []; const params: unknown[] = [];
  for (const [k, v] of Object.entries(patch)) {
    if (!map[k] || v === undefined) continue;
    if (k === 'examPeriodId' && v && !periodById(Number(v))) throw badRequest('Dự kiến thi không hợp lệ.');
    /*
     * Tháng thi dạng 'YYYY-MM'. Nhận CẢ một ngày đầy đủ rồi cắt lấy tháng — ô chọn tháng
     * của trình duyệt trả về đúng dạng này, nhưng người dán tay hay dán cả ngày.
     */
    if (k === 'examMonth' && v) {
      const raw = String(v).slice(0, 7);
      if (!/^\d{4}-\d{2}$/.test(raw)) throw badRequest('Dự kiến thi phải có dạng MM/YYYY.');
      const mm = Number(raw.slice(5, 7));
      if (mm < 1 || mm > 12) throw badRequest('Dự kiến thi không hợp lệ.');
      sets.push('exam_month = ?'); params.push(raw);
      continue;
    }
    if (k === 'startPeriodId' && v && !periodById(Number(v))) {
      throw badRequest('Tuần bắt đầu học không hợp lệ.');
    }
    sets.push(`${map[k]} = ?`); params.push(v);
  }
  if (!sets.length && !doiTarget) return c;
  params.push(cycleId);
  tx(() => {
    if (sets.length) db().prepare(`UPDATE learning_cycles SET ${sets.join(', ')} WHERE id = ?`).run(...params);
    if (doiTarget) reviseTarget(p, cycleId, { newTarget: targetGui, reason: patch.lyDo });
    if (patch.status !== undefined && patch.status !== 'active' && c.status === 'active') {
      db().prepare('UPDATE learning_cycles SET ended_at = COALESCE(ended_at, ?) WHERE id = ?').run(demoToday(), cycleId);
      ghiBanChup(db(), [cycleId], { lyDo: 'sua_tay', ngay: demoToday() });   // PR-TK: sửa tay trạng thái = đường đóng thứ 5
    }
    if (closeOnEnd) {
      closeCasesBySystem({ actorUserId: p.userId, studentId: c.student_id, reason: 'course_ended', on: demoToday(), cycleIds: [cycleId] });
    }
  });
  const after = cycleById(cycleId);
  // Đổi dự kiến thi là sự kiện đáng ghi vào hành trình học.
  if (patch.examPeriodId !== undefined && patch.examPeriodId !== c.exam_period_id) {
    const before = c.exam_period_id ? periodById(c.exam_period_id)?.code ?? null : null;
    const now = patch.examPeriodId ? periodById(Number(patch.examPeriodId)) : null;
    addJourney({
      studentId: c.student_id, eventType: 'exam_plan_changed',
      eventDate: now?.weekStart ?? demoToday(),
      title: 'Đổi dự kiến thi IELTS',
      detail: `${before ?? 'chưa có'} → ${now?.code ?? 'chưa có'}`,
      refTable: 'learning_cycles', refId: cycleId, createdBy: p.userId,
    });
  }
  /*
   * ĐỔI TUẦN BẮT ĐẦU HỌC LÀ ĐỔI CẢ LỊCH MT — nhưng chỉ những lượt hệ thống từng tự xếp và CHƯA có điểm (K2-33).
   *
   * Đây là chỗ giữ lời hứa của mục 7.6: "hệ thống không được ghi đè cái Quản lý đã xếp".
   * Lượt nào `plan_source = 'manual'`, đã có điểm hoặc đã làm xong thì đứng yên; phần còn lại chạy theo
   * mốc mới. Q6: đây là LUẬT hệ thống, không phải thao tác xếp tuần — chạy cả khi người sửa là GVCN (trước đây nuốt lỗi quyền im lặng).
   */
  if (patch.startPeriodId !== undefined && patch.startPeriodId !== c.start_period_id && after?.start_period_id) {
    const r = apLichMacDinh(cycleId, p.userId);
    if (r.moved.length) {
      const homNay = demoToday();
      addJourney({
        studentId: c.student_id, cycleId, eventType: 'cycle_start', eventDate: homNay,
        title: 'Đổi tuần bắt đầu học',
        detail: `${r.moved.map((x) => `MT${x.attemptNo}`).join(', ')} dời sang ${r.moved.map((x) => tuanLich(x.weekStart, homNay)).join(', ')}`,
        refTable: 'learning_cycles', refId: cycleId, createdBy: p.userId,
      });
    }
  }

  writeAudit({ actorUserId: p.userId, action: 'cycle.update', entityType: 'learning_cycle', entityId: cycleId,
    before: c, after });
  return after;
}

/**
 * ĐIỂM XUẤT PHÁT của lộ trình, kèm NGUỒN.
 *
 * "Em vào học ở mức nào" là câu hỏi khác hẳn "bài Mock đầu tiên được mấy điểm". Không có
 * căn cứ thì để trống và hồ sơ ghi "chưa rõ" — hệ thống KHÔNG tự lấy MT1 làm điểm đầu vào,
 * vì như thế mọi học viên đều "tiến bộ 0 điểm ở MT1" một cách vô nghĩa.
 */
export function setBaseline(p: Principal, cycleId: number, input: {
  source: string | null; attemptId?: number | null; score?: number | null; note?: string | null;
}) {
  const c = cycleById(cycleId);
  if (!c) throw notFound('Không tìm thấy lộ trình');
  /* PR-OV2a: điểm đầu vào thuộc "thông tin HV" — `student.edit_info` (Admin, TVV, CX) cũng sửa được. */
  if (!coQuyen(p, PERMISSIONS.STUDENT_EDIT, { studentId: c.student_id })) {
    require_(p, PERMISSIONS.STUDENT_EDIT_INFO, { studentId: c.student_id }, 'Bạn không có quyền sửa điểm đầu vào của lộ trình này.');
  }
  const conn = db();

  if (input.source === null) {
    conn.prepare(
      `UPDATE learning_cycles SET baseline_attempt_id=NULL, baseline_score=NULL,
              baseline_source=NULL, baseline_note=NULL WHERE id=?`).run(cycleId);
    writeAudit({ actorUserId: p.userId, action: 'cycle.baseline.clear', entityType: 'learning_cycle',
      entityId: cycleId, before: c, after: cycleById(cycleId) });
    return cycleById(cycleId);
  }

  if (!(BASELINE_SOURCES as readonly string[]).includes(input.source ?? '')) {
    throw badRequest('Chọn nguồn của điểm đầu vào.');
  }
  let score = input.score ?? null;
  let attemptId = input.attemptId ?? null;

  if (attemptId) {
    // Bài dùng làm căn cứ phải là bài CỦA CHÍNH học viên này, nếu không thì con số đang
    // nói về một người khác.
    const a = conn.prepare('SELECT * FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
    if (!a || a.student_id !== c.student_id) throw badRequest('Bài kiểm tra không thuộc học viên này.');
  } else {
    score = docDiemXuatPhat(score);
  }

  conn.prepare(
    `UPDATE learning_cycles SET baseline_attempt_id=?, baseline_score=?, baseline_source=?, baseline_note=? WHERE id=?`)
    .run(attemptId, attemptId ? null : score, input.source, input.note ?? null, cycleId);
  writeAudit({ actorUserId: p.userId, action: 'cycle.baseline.set', entityType: 'learning_cycle',
    entityId: cycleId, before: c, after: { ...cycleById(cycleId), nhap: input } });
  return cycleById(cycleId);
}

/**
 * KẾT QUẢ CUỐI LỘ TRÌNH. Khác hẳn việc đóng lộ trình về mặt hành chính.
 *
 * Đóng lộ trình chỉ nói "không học theo lộ trình này nữa". Có đạt Target hay không là
 * một kết luận riêng, phải có bằng chứng, và "chưa có căn cứ" là một câu trả lời hợp lệ.
 */
export function setOutcome(p: Principal, cycleId: number, input: {
  outcome: string | null;
  /** Mã cũ. Từ vòng 7 KHÔNG nhận nữa — xem ghi chú ở dưới (mục 5.1). */
  attemptId?: number | null;
  score?: number | null; note?: string | null;
  /** S16: em THÔI HỌC sau khi kết luận lộ trình → hệ thống tự đóng Case còn mở của lộ trình này. Học tiếp thì không truyền. */
  dongCaseKhiKetThuc?: boolean;
}) {
  const c = cycleById(cycleId);
  if (!c) throw notFound('Không tìm thấy lộ trình');
  require_(p, PERMISSIONS.STUDENT_EDIT, { studentId: c.student_id },
    'Bạn không có quyền kết luận lộ trình này.');
  if (input.outcome !== null && !(CYCLE_OUTCOMES as readonly string[]).includes(input.outcome)) {
    throw badRequest('Kết luận không hợp lệ.');
  }
  const conn = db();
  /*
   * MỘT LƯỢT MT KHÔNG PHẢI MỘT KỲ THI THẬT (mục 5.1).
   *
   * Đường cũ cho chọn "một bài đã có" rồi lấy điểm bài đó làm kết quả cuối lộ trình. Nghe
   * thì tiện, nhưng nó ghi vào hồ sơ một câu không đúng: em chưa thi IELTS mà hồ sơ nói em
   * được 6.5. Mock Test chấm nội bộ, không có phòng thi và không có chứng chỉ; kết quả thật
   * là con số em báo về từ BC hay IDP.
   */
  if (input.attemptId) {
    throw badRequest(
      'Không lấy một lượt Mock Test làm kết quả thi thật. Nhập điểm IELTS em báo về, '
      + 'hoặc để trống nếu em chưa thi.',
    );
  }
  let score = input.score ?? null;
  if (score !== null && score !== undefined && score !== ('' as any)) {
    score = Number(score);
    if (!Number.isFinite(score) || score < 0 || score > 9) throw badRequest('Điểm phải nằm trong khoảng 0–9.');
  } else score = null;

  conn.prepare(`UPDATE learning_cycles SET outcome=?, outcome_attempt_id=NULL, outcome_score=?, outcome_note=? WHERE id=?`)
    .run(input.outcome, score, input.note ?? null, cycleId);
  if (input.outcome) {
    addJourney({
      studentId: c.student_id, cycleId, eventType: 'cycle_outcome',
      eventDate: c.ended_at ?? demoToday(),
      title: `Kết luận lộ trình: ${CYCLE_OUTCOME_LABEL[input.outcome as keyof typeof CYCLE_OUTCOME_LABEL]}`,
      detail: input.note ?? null, refTable: 'learning_cycles', refId: cycleId, createdBy: p.userId,
      dedupKey: `cycle-outcome:${cycleId}:${input.outcome}`,
    });
  }
  /* S16: "Kết luận lộ trình" mà em THÔI HỌC (nơi gọi truyền cờ) → Case còn mở của lộ trình này hệ thống tự đóng. Học tiếp thì không cờ. */
  if (input.dongCaseKhiKetThuc === true) {
    closeCasesBySystem({ actorUserId: p.userId, studentId: c.student_id, reason: 'course_ended', on: demoToday(), cycleIds: [cycleId] });
  }
  writeAudit({ actorUserId: p.userId, action: 'cycle.outcome', entityType: 'learning_cycle',
    entityId: cycleId, before: c, after: input });
  return cycleById(cycleId);
}

export function targetRevisions(cycleId: number) {
  return db()
    .prepare(
      `SELECT r.*, u.full_name AS actor_name FROM cycle_target_revisions r
         LEFT JOIN users u ON u.id = r.actor_user_id
        WHERE r.cycle_id = ? ORDER BY r.effective_from DESC, r.id DESC`,
    )
    .all(cycleId) as any[];
}

/**
 * ĐỔI MỤC TIÊU. Không chấm lại quá khứ.
 *
 * Mỗi lượt đánh giá đã chốt giữ nguyên `target_at_attempt` của nó, nên kỳ vọng của MT2
 * hôm trước vẫn tính trên Target hồi đó. Đổi Target chỉ có hiệu lực từ ngày ghi trở
 * đi, và mỗi lần đổi phải có LÝ DO — nếu không, vài tháng sau không ai còn biết vì sao
 * Target của em này lại khác trong hồ sơ.
 */
/** OV-8b / OV-13i: ai đổi được Target — QL (`cycle.edit`) hoặc TVV / CX (`student.edit_more`) đúng phạm vi. Một luật cho Sửa một HV, Sửa cả lớp, cờ panel. */
export const duocDoiTarget = (p: Principal, ctx: Ctx) => coQuyen(p, PERMISSIONS.CYCLE_EDIT, ctx) || coQuyen(p, PERMISSIONS.STUDENT_EDIT_MORE, ctx);

/**
 * OV-13o: đổi Target THEO CÁCH NÀY có bị chặn không — một luật cho lúc lưu (`reviseTarget`) và xem trước Sửa cả lớp (báo từng dòng).
 * Lộ trình chương trình liên tục không có Target (OV-6b2); đổi dấu KCK chỉ QL / Quản trị / TVV (OV-11e Q8 — CX sửa Target số được, KCK thì không).
 */
/** P13 KET-PET: lộ trình chương trình liên tục KHÔNG có kỳ thi (mã Quản trị tạo) — không Target. KET / PET có Target theo điểm Cambridge. */
const lienTucKhongKyThi = (c: any) => !c.route && !!programmeByCode(c.programme_code)?.lapMoiTuan && !kyThiCuaChuongTrinh(c.programme_code);
export function loiDoiTarget(p: Principal, c: any, t: { kck: boolean }): HttpError | null {
  if (lienTucKhongKyThi(c)) return badRequest(CAU_LIEN_TUC.target);
  /* P13: khoá KET / PET không có KCK — bỏ qua cờ (Target Cambridge). QUYEN-CN: vai TVV xét ở CHI NHÁNH CỦA EM (`vaiVoiEm`), chỉ đọc khi thật sự đổi KCK. */
  if (!(!c.route && kyThiCuaChuongTrinh(c.programme_code)) && t.kck !== !!c.khong_cam_ket && !duocDoiKck(vaiVoiEm(p, c.student_id), coQuyen(p, PERMISSIONS.CYCLE_EDIT, { studentId: c.student_id }))) return forbidden(CHI_DOI_KCK);
  return null;
}

/** P13: dòng nhật ký nhớ thang Target (KET / PET) — Lịch sử thay đổi vẫn định dạng đúng khi không tra được lộ trình (`lichSuSua`). */
export const kyThiAudit = (c: { route?: string | null; programme_code?: string | null }) => {
  const kt = !c.route ? kyThiCuaChuongTrinh(c.programme_code) : null;
  return kt ? { kyThi: kt.ma } : {};
};

export function reviseTarget(p: Principal, cycleId: number, input: {
  /** Số, `null`/'' (chưa có), "6.5 KCK" hoặc KCK / '-' / "không cam kết" (Q29-1, OV-9: KCK là dấu riêng). */
  newTarget: number | string | null; effectiveFrom?: string; reason?: string | null;
}, o?: { daDuyet?: true }) {
  const c = cycleById(cycleId);
  if (!c) throw notFound('Không tìm thấy lộ trình');
  /* `daDuyet`: chỉ quyết định chuyển lớp lúc thi hành truyền — lệnh đã được kiểm quyền lúc ra (như `applyTransition`). */
  /* OV-8b: TVV / CX (`student.edit_more`) sửa thẳng như QL — cùng đường, cùng lý do bắt buộc, cùng nhật ký. */
  if (!o?.daDuyet && !duocDoiTarget(p, { studentId: c.student_id })) require_(p, PERMISSIONS.CYCLE_EDIT, { studentId: c.student_id }, CHI_QL_SUA);
  /* OV-6b2: lộ trình của chương trình liên tục không có Target — trừ KET / PET (P13: Target Cambridge, số nguyên trong thang, không KCK). */
  if (lienTucKhongKyThi(c)) throw badRequest(CAU_LIEN_TUC.target);
  const { target, kck } = docTargetCua(c, input.newTarget);
  if (target === (c.target_score ?? null) && kck === !!c.khong_cam_ket) return { cycle: c, revision: null };
  const chan = o?.daDuyet ? null : loiDoiTarget(p, c, { kck });
  if (chan) throw chan;
  const effectiveFrom = input.effectiveFrom ?? demoToday();
  if (!isIsoDate(effectiveFrom)) throw badRequest('Ngày hiệu lực không hợp lệ.');
  const reason = chuTuDo(input.reason, 'Lý do', 2000) ?? '';   // rà Dọn-a P2 (Q4): kiểu + trần, không cắt ngầm
  if (!reason) throw badRequest('Ghi lý do đổi Target.');

  return tx(() => {
    const conn = db();
    const info = conn
      .prepare(
        `INSERT INTO cycle_target_revisions (cycle_id, old_target, new_target, old_khong_cam_ket, new_khong_cam_ket,
                                             effective_from, reason, actor_user_id, created_at)
         VALUES (?,?,?,?,?,?,?,?,?)`,
      )
      .run(cycleId, c.target_score, target, c.khong_cam_ket ? 1 : 0, kck ? 1 : 0, effectiveFrom, reason, p.userId, nowIso());
    conn.prepare('UPDATE learning_cycles SET target_score = ?, khong_cam_ket = ? WHERE id = ?').run(target, kck ? 1 : 0, cycleId);
    apTargetLuotChuaDiem(cycleId, target);
    addJourney({
      studentId: c.student_id, cycleId, eventType: 'target_change', eventDate: effectiveFrom,
      title: `Đổi Target ${hienTarget(c.target_score, c.khong_cam_ket)} → ${hienTarget(target, kck)}`,
      detail: reason, refTable: 'cycle_target_revisions', refId: Number(info.lastInsertRowid),
      createdBy: p.userId, dedupKey: `target-rev:${Number(info.lastInsertRowid)}`,
    });
    writeAudit({ actorUserId: p.userId, action: 'cycle.target.revise', entityType: 'learning_cycle',
      entityId: cycleId, before: { target: c.target_score, khongCamKet: !!c.khong_cam_ket }, after: { target, khongCamKet: kck, effectiveFrom, reason, ...kyThiAudit(c) } });
    return { cycle: cycleById(cycleId), revision: conn.prepare('SELECT * FROM cycle_target_revisions WHERE id = ?')
      .get(Number(info.lastInsertRowid)) };
  });
}
