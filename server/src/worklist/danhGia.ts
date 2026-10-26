import { createHash } from 'node:crypto';
import { db } from '../db.ts';
import { CHUONG_TRINH_KHONG_CHIA_MON, CO_DIEM_SQL, PERMISSIONS, luotSinhViec, moiNhatTruoc, boMonTheoLuot, daGhiLuot } from '../../../shared/domain/index.ts';
import { ngayTaoLuot } from '../classes/schedule.ts';
import { classScopeSql, scopeFor, type Principal } from '../permissions.ts';
import { kckCuaLuot, loadBundle, resultOf, type AttemptBundle } from '../fasttrack/attempts.ts';
import { allProgrammes, evaluateRegular, nguongDatLop, type ProgrammeInfo } from '../normal/regular.ts';
import { nho } from '../platform/nguCanhRequest.ts';

/**
 * KẾT QUẢ TEST CỦA TỪNG HỌC VIÊN — nền của ba chỉ số hiện trạng (hv-sos-hien-tai · hv-duoi-ky-vong-mon ·
 * do-phu-danh-gia). Hợp đồng số liệu luật 1: tầng này trả TẬP ID, không trả số.
 *
 * PHẠM VI THEO NƠI EM ĐANG HỌC, không theo lớp của từng lượt. Một em chuyển từ Cẩm Phả sang Monbay thuộc
 * phạm vi Quản lý Monbay; đợt Test mới nhất của em có thể đã thi ở Cẩm Phả. Nếu lọc theo lớp của LƯỢT thì Quản
 * lý Monbay chỉ thấy lượt cũ ở Monbay và kết luận sai về "đợt mới nhất" — chỉ số hiện trạng phải đọc đợt mới nhất
 * THẬT của em. Người xem đã có quyền với em (em đang học ở lớp trong phạm vi) nên đọc kết quả của em là hợp lệ.
 *
 * HAI CÁCH CHỌN ĐỢT khác nhau, vì hai câu hỏi khác nhau:
 *   ĐỢT MỚI NHẤT HỢP LỆ  — không huỷ và đã có ít nhất một kỹ năng có điểm. Dùng cho "em đang ở đâu về điểm".
 *   ĐỢT MỚI NHẤT ĐÃ ĐẾN LỊCH — không huỷ và tuần kế hoạch đã bắt đầu, KỂ CẢ chưa chấm gì. Dùng cho "đã chấm
 *   đủ chưa" (độ phủ) — một đợt đến lịch mà chưa ai chấm chính là thứ độ phủ phải nhìn thấy.
 * "Mới nhất" xếp theo tuần kế hoạch giảm dần, rồi số MT, rồi id; không MAX toàn lịch sử.
 */

export type SkillEval = {
  /** Có đủ căn cứ để nói đạt hay dưới kỳ vọng ở môn này (có điểm VÀ có kỳ vọng). */
  evaluable: boolean;
  /** Dưới kỳ vọng của CHÍNH đợt đó (không phải target hiện tại). */
  under: boolean;
};

export type AttemptEval = {
  attemptId: number;
  studentId: number;
  kind: string;
  weekStart: string | null;
  attemptNo: number;
  /** Đủ điểm mọi kỹ năng bắt buộc. */
  complete: boolean;
  /** Số kỹ năng bắt buộc đã có điểm, và tổng số kỹ năng bắt buộc. */
  scored: number;
  required: number;
  sosLevel: number | null;
  /** Kết luận SOS còn TẠM THỜI (lượt chưa chốt — OV-1c). */
  provisional: boolean;
  /** OV-1c: lượt FT đã chốt (`AttemptResult.chot`). Lớp thường: không có (= `complete`). */
  chot?: boolean;
  /** Theo kỹ năng ĐÁNH GIÁ: listening · reading · writing · speaking. */
  skills: Record<string, SkillEval>;
  /** OV-11f (PT-6): lượt của em KCK (`luotKck`) — ngoài tử / mẫu "Dưới kỳ vọng". */
  kck?: boolean;
  /** MH7: lớp không chia môn (Pre FOU) — kết quả là % tổng (`tyLeTong`, đủ điểm mới có), không phải SOS. */
  khongChiaMon?: boolean;
  tyLeTong?: number | null;
  /** OV-6b1: ngưỡng đạt của lớp (lớp thường) — dải Cuối khoá đọc cùng ngưỡng. */
  nguong?: number;
};

/**
 * Đánh giá MỘT lượt bằng đúng bộ máy chấm mà mọi màn khác dùng — FT theo band và kỳ vọng, lớp thường theo tỷ lệ.
 * Dùng chung với báo cáo tuần, để "đợt này SOS mấy" chỉ có MỘT nơi trả lời.
 */
export function evaluateAttemptRow(
  a: any, bundle: AttemptBundle, programmes: Map<string, ProgrammeInfo>,
): Omit<AttemptEval, 'attemptId' | 'studentId' | 'kind' | 'weekStart' | 'attemptNo'> {
  const scores = bundle.scores.get(a.id) ?? [];
  const prog = a.programme_code ? programmes.get(a.programme_code) : null;
  if (prog?.scoringMode === 'ratio') {
    const r = evaluateRegular(boMonTheoLuot(prog.skills, daGhiLuot(bundle.skillRows.get(a.id), scores)), scores, prog.code, nguongDatLop(a.class_id));   // P13: bộ môn theo lượt
    const skills: Record<string, SkillEval> = {};
    for (const s of r.skills) {
      skills[s.skill] = { evaluable: s.outcome !== 'missing', under: s.outcome === 'fail' };
    }
    return {
      complete: r.complete, scored: r.scored, required: r.required, sosLevel: r.sosLevel, provisional: r.provisional, skills,
      khongChiaMon: CHUONG_TRINH_KHONG_CHIA_MON.includes(prog.code), tyLeTong: r.tyLeTong, nguong: r.passThreshold,
    };
  }
  const r = resultOf(a, scores, bundle.skips.get(a.id) ?? [], bundle.skillRows.get(a.id) ?? []);
  const skills: Record<string, SkillEval> = {};
  for (const v of r.verdicts) {
    skills[v.skill] = { evaluable: v.required && v.band !== null && v.passed !== null, under: v.passed === false };
  }
  return {
    complete: r.complete, scored: r.scoredRequired, required: r.required.length,
    sosLevel: r.sosLevel, provisional: r.provisional, chot: r.chot, skills,
  };
}

/**
 * Q29-1 (PR-KCK) + OV-9: lượt của em có dấu KCK — ngoài mẫu số số liệu SOS / đạt kỳ vọng (sĩ số vẫn đếm), dù nay em KCK có Target và kỳ vọng.
 * OV-11e (Q8): CÙNG `kckCuaLuot` — dấu KCK lúc chốt của lượt, chưa có thì cờ hiện tại của lộ trình. Hàng nên có `kck_at_attempt` + `cy_kck`.
 */
/* PR-NT: Target lớp thường không bật FT (chủ sản phẩm 04/10) — KCK chỉ đưa lượt MOCK ra ngoài mẫu số; Giữa/Cuối khoá lớp thường vẫn đếm. */
export const luotKck = (a: any) => (a.kind ?? 'mock') === 'mock' && kckCuaLuot(a);

/**
 * Học viên ĐANG HỌC trong phạm vi của người xem (và chi nhánh được hỏi). Phạm vi rỗng trả rỗng.
 * PR-TD: nhớ trong request GET theo (người xem, chi nhánh) — gọi lặp lại ở `hvSosHienTai`/`hvDuoiKyVongMon`/
 * `doPhuDanhGia` (mỗi cái một chỉ số của Tổng quan, ~12 lượt gọi `metricSet` mỗi request) với CÙNG `branchId`.
 */
export function studentsInScope(p: Principal, branchId: number | null): number[] {
  return nho(`hv-pv:${p.userId}:${branchId}`, () => {
    const scope = scopeFor(p, PERMISSIONS.ATTEMPT_VIEW);
    if (scope.none) return [];
    const cs = classScopeSql(scope);
    const where = [cs.sql, `e.status = 'active'`, 's.archived_at IS NULL'];
    const params: unknown[] = [...cs.params];
    if (branchId) { where.push('c.branch_id = ?'); params.push(branchId); }
    return (db()
      .prepare(
        `SELECT DISTINCT s.id FROM enrollments e
           JOIN students s ON s.id = e.student_id
           JOIN classes c ON c.id = e.class_id
          WHERE ${where.join(' AND ')} ORDER BY s.id`,
      )
      .all(...params) as any[]).map((r) => r.id as number);
  });
}

/**
 * Các đợt (không huỷ) của một nhóm học viên, đã xếp MỚI NHẤT TRƯỚC cho từng em.
 * Nhớ trong request (cùng kiểu `latestAttempts`): Tổng quan QL gọi nhiều chỉ số hiện trạng mà chỉ đọc lượt MỘT lần. Người gọi KHÔNG
 * được sửa kết quả. (PR-VAI-a Q7: `phanTich/boQuen.ts` — nơi dùng thứ hai — đã gỡ.)
 */
export function attemptsNewestFirst(studentIds: number[]): Map<number, any[]> {
  return nho(`luot-hv:${studentIds.join(',')}`, () => attemptsNewestFirstGoc(studentIds));
}
function attemptsNewestFirstGoc(studentIds: number[]): Map<number, any[]> {
  const out = new Map<number, any[]>();
  for (let i = 0; i < studentIds.length; i += 400) {
    const chunk = studentIds.slice(i, i + 400);
    for (const r of db()
      .prepare(
        `SELECT a.*, c.programme_code, pr.week_start AS period_start, pr.week_end AS period_end,
                (SELECT cy.route FROM learning_cycles cy WHERE cy.id = a.cycle_id) AS route, (SELECT cy.khong_cam_ket FROM learning_cycles cy WHERE cy.id = a.cycle_id) AS cy_kck,
                /* OV-11f (PT-3): lộ trình FAST TRACK đang chạy của em (nếu có) — SOS / dưới kỳ vọng chỉ đọc lượt của lộ trình này, không rơi về Final lớp thường cũ. */
                (SELECT cy2.id FROM learning_cycles cy2 WHERE cy2.student_id = a.student_id AND cy2.status = 'active' AND cy2.route IS NOT NULL
                  ORDER BY cy2.id DESC LIMIT 1) AS cy_ft_dang_chay,
                /* TD7: lượt không ô nào có band / điểm thô thì chắc chắn scored = 0 — latestAttempts bỏ qua, không nạp lịch + điểm. */
                ${CO_DIEM_SQL('a')} AS _co_diem
           FROM assessment_attempts a
           LEFT JOIN classes c ON c.id = a.class_id
           LEFT JOIN report_periods pr ON pr.id = a.planned_period_id
          WHERE a.student_id IN (${chunk.map(() => '?').join(',')}) AND a.status != 'cancelled'`,
      )
      .all(...chunk) as any[]) {
      if (!out.has(r.student_id)) out.set(r.student_id, []);
      out.get(r.student_id)!.push(r);
    }
  }
  /* K5-54: "mới nhất" = số MT LỚN NHẤT của lộ trình mới nhất — không theo tuần hay ngày nhập (MT lịch sử nhập bù hôm nay vẫn là MT cũ).
   * Lớp thường theo loại (Final sau Progress — `moiNhatTruoc`). */
  for (const list of out.values()) {
    list.sort((x, y) => y.cycle_id - x.cycle_id || moiNhatTruoc(x, y) || y.id - x.id);
  }
  return out;
}

/** M-14: lượt này có được làm "hiện trạng" (SOS hiện tại, bỏ quên…) không — MT lịch sử ngoài cửa sổ 4 tuần thì không. */
export function luotSinhViecRow(a: any, homNay: string): boolean {
  if (!a.lich_su) return true;   // lượt thường: không cần hỏi ngày nghiệp vụ (tránh một câu mỗi dòng)
  return luotSinhViec({ lich_su: 1, tuanKetThuc: a.period_end ?? null, created_at: ngayTaoLuot(a.created_at, homNay) });
}

/**
 * ĐỢT MỚI NHẤT của mỗi em theo `pick`: 'valid' (đã có điểm) hoặc 'due' (đã đến lịch, kể cả chưa chấm).
 * Em không có đợt nào thoả thì không có mục trong kết quả.
 * PR-TD: nhớ trong request GET theo (pick, today, tập id đã sắp — thứ tự không đổi khoá vì nơi gọi luôn truyền
 * `studentsInScope(...)` là cùng một mảng cho cùng người xem/chi nhánh trong một request).
 */
export function latestAttempts(studentIds: number[], pick: 'valid' | 'due', today: string): Map<number, AttemptEval> {
  /* PR-Dọn (9g): khoá nhớ ngắn — băm tập id (2 000 em từng là khoá hơn 10 000 ký tự). */
  return nho(`luot-moi:${pick}:${today}:${createHash('sha1').update(studentIds.join(',')).digest('hex')}`, () => {
    const byStudent = attemptsNewestFirst(studentIds);
    const programmes = allProgrammes();
    /* Lọc không cần điểm / lịch kỹ năng (đọc ngay trên dòng lượt). */
    const quaLocNhanh = (a: any, kieu: 'valid' | 'due') => {
      if (kieu === 'due') return !!(a.period_start && a.period_start <= today);
      if (!luotSinhViecRow(a, today)) return false;
      if (a.cy_ft_dang_chay && a.cycle_id !== a.cy_ft_dang_chay) return false;   // OV-11f (PT-3): như `standingFor`
      return !!a._co_diem;   // TD7: không band / điểm thô → scored = 0, như vòng cũ bỏ qua
    };
    /*
     * TD7: nạp lịch + điểm THEO VÒNG — mỗi vòng chỉ lượt ứng viên kế tiếp của từng em chưa có kết quả, thay vì mọi lượt của mọi em (Turso: câu lịch
     * kỹ năng ~5 k dòng / lần). Vòng đầu nạp kèm ứng viên đầu của kiểu kia ('valid' ↔ 'due', Tổng quan gọi cả hai) — lần gọi sau đọc từ bộ nhớ
     * theo lượt, thường không thêm câu nào. Cùng thứ tự duyệt, cùng điều kiện như vòng cũ → cùng lượt được chọn.
     */
    const kieuKia = pick === 'valid' ? 'due' : 'valid';
    const viTri = new Map<number, number>();
    const chon = new Map<number, AttemptEval>();
    let cho = [...byStudent.keys()];
    let vongDau = true;
    while (cho.length) {
      const ungVien: [number, any][] = [];
      const kem: number[] = [];
      for (const sid of cho) {
        const list = byStudent.get(sid)!;
        let i = viTri.get(sid) ?? 0;
        while (i < list.length && !quaLocNhanh(list[i], pick)) i++;
        viTri.set(sid, i);
        if (i < list.length) ungVien.push([sid, list[i]]);
        if (vongDau) { const k = list.find((a) => quaLocNhanh(a, kieuKia)); if (k) kem.push(k.id); }
      }
      if (!ungVien.length) break;
      const bundle = loadBundle([...new Set([...ungVien.map(([, a]) => a.id as number), ...kem])], { boCase: true });
      vongDau = false;
      cho = [];
      for (const [sid, a] of ungVien) {
        const ev = evaluateAttemptRow(a, bundle, programmes);
        /* Độ phủ: MT lịch sử chưa đủ điểm không phải "cần được đánh giá" (nhập bù, không hạn — T34). */
        if ((pick === 'valid' && ev.scored === 0) || (pick === 'due' && a.lich_su && !ev.complete)) {
          viTri.set(sid, viTri.get(sid)! + 1);
          cho.push(sid);
          continue;
        }
        chon.set(sid, {
          attemptId: a.id, studentId: sid, kind: a.kind, weekStart: a.period_start ?? null, attemptNo: a.attempt_no, ...ev,
          kck: luotKck(a),
        });
      }
    }
    /* Giữ thứ tự em như vòng cũ (thứ tự `byStudent`). */
    const out = new Map<number, AttemptEval>();
    for (const sid of byStudent.keys()) if (chon.has(sid)) out.set(sid, chon.get(sid)!);
    return out;
  });
}

const sortIds = (ids: Iterable<number>) => [...ids].sort((x, y) => x - y);

/**
 * `hv-sos-hien-tai` — em có SOS ở ĐỢT MỚI NHẤT HỢP LỆ (không MAX toàn lịch sử). Tạm thời và kết quả cuối tách
 * riêng nhưng đều là "SOS hiện tại": tập chung = hợp của hai tập.
 */
export function hvSosHienTai(p: Principal, branchId: number | null, today: string) {
  const latest = latestAttempts(studentsInScope(p, branchId), 'valid', today);
  const tamThoi: number[] = [], ketQuaCuoi: number[] = [];
  for (const [sid, ev] of latest) {
    if ((ev.sosLevel ?? 0) <= 0) continue;
    (ev.provisional ? tamThoi : ketQuaCuoi).push(sid);
  }
  return { ids: sortIds([...tamThoi, ...ketQuaCuoi]), splits: { tamThoi: sortIds(tamThoi), ketQuaCuoi: sortIds(ketQuaCuoi) } };
}

/**
 * `hv-duoi-ky-vong-mon` — em dưới kỳ vọng ở một môn (hoặc ở bất kỳ môn nào khi không nêu môn), so với kỳ vọng
 * CỦA CHÍNH ĐỢT ĐÓ. Mẫu số là em ĐÁNH GIÁ ĐƯỢC môn đó — có điểm và có kỳ vọng; thiếu điểm KHÁC trượt.
 */
export function hvDuoiKyVongMon(p: Principal, branchId: number | null, today: string, skill: string | null) {
  const latest = latestAttempts(studentsInScope(p, branchId), 'valid', today);
  const under: number[] = [], evaluable: number[] = [];
  for (const [sid, ev] of latest) {
    if (ev.kck) continue;   // OV-11f (PT-6, Q29-1): lượt em KCK ngoài tử và mẫu "Dưới kỳ vọng" — như Phân tích (`luotKck`)
    const picked = skill ? [ev.skills[skill]].filter(Boolean) : Object.values(ev.skills);
    if (picked.some((s) => s.evaluable)) evaluable.push(sid);
    if (picked.some((s) => s.evaluable && s.under)) under.push(sid);
  }
  return { ids: sortIds(under), denominatorIds: sortIds(evaluable) };
}

/**
 * `do-phu-danh-gia` — HV có dữ liệu đủ điều kiện / HV cần được đánh giá. KHÁC tỷ lệ đạt: em chấm đủ mà trượt vẫn
 * là "có dữ liệu". Cần được đánh giá = em đang học có ít nhất một đợt (không huỷ) đã đến lịch; có dữ liệu = đợt
 * đã đến lịch mới nhất của em đủ điểm mọi kỹ năng bắt buộc.
 */
export function doPhuDanhGia(p: Principal, branchId: number | null, today: string) {
  const latest = latestAttempts(studentsInScope(p, branchId), 'due', today);
  const need: number[] = [], covered: number[] = [];
  for (const [sid, ev] of latest) {
    need.push(sid);
    if (ev.complete) covered.push(sid);
  }
  return { ids: sortIds(need), numeratorIds: sortIds(covered) };
}
