import { loadPrincipal } from '../permissions.ts';
import { addDays } from '../util.ts';
import { ensurePeriod, mondayOf } from '../platform/week.ts';
import { commitIntake, createClass } from '../classes/intake.ts';
import { planRegularTests, saveRegularScore } from '../normal/regular.ts';
import { raLenh, thiHanhLenhDenHan } from '../classes/lenhChuyen.ts';
import { tuanChonDuoc } from '../../../shared/domain/index.ts';
import type { BuildCtx } from './build.ts';
import { DEMO_DATE } from './journeys.ts';
import { emailThu } from './emailThu.ts';

/**
 * BỘ DEMO P9a XET-LAI (mockup `thiet-ke/v6/xet-lai-lo-trinh.html`) — dựng qua hàm nghiệp vụ, mốc ngày chỉnh bằng SQL. Chỉ máy dev.
 *  MB FOU 25 → MB BE 05 (vào lớp Thứ Hai ngày demo): Hứa Đức Anh Final 46 % (a) · Giang Thảo My 55 % và Nông Gia Phúc 57 % chốt trước Final (b).
 *  MB FOU 25: Lý Minh Khang Final 42 %, lệnh Lên BE tuần sau CHƯA thi hành → dòng Xét lại ở lớp cũ.
 *  Công việc QL MB: "Xét lại lộ trình · MB BE 05 · 3 em" + "· MB FOU 25 · 1 em", hạn CN tuần 2.
 */
export function buildXetLaiDemo(ctx: BuildCtx): void {
  const { conn } = ctx;
  const mb = ctx.branchId.get('MB');
  const ql = ctx.userId.get('MGR_MB');
  if (!mb || !ql) return;
  const admin = loadPrincipal(ctx.adminId);
  const quanLy = loadPrincipal(ql);
  const lop = (code: string, kind: string, batDau: string, core: string) => {
    const r = createClass(admin, { code, branchId: mb, kind, route: null, isFastTrack: false, startDate: batDau, startPeriodId: ensurePeriod(batDau).id } as any) as any;
    conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,NULL,1,'2026-01-01','active',?)`)
      .run(ctx.userId.get(core), r.id, DEMO_DATE);
    return r.id as number;
  };
  const fou25 = lop('MB FOU 25', 'FOU', addDays(mondayOf(DEMO_DATE), -56), 'T_KHOA');   // tuần 8 (Final) = tuần trước ngày demo
  const be05 = lop('MB BE 05', 'BE', DEMO_DATE, 'T_TRANG');
  const hv = (ten: string) => {
    commitIntake(admin, { classId: fou25, rows: [{ fullName: ten, target: '-', email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `xl-demo-${ten}` } as any);
    return (conn.prepare('SELECT id FROM students WHERE full_name = ?').get(ten) as any).id as number;
  };
  const NGAY_FINAL = addDays(DEMO_DATE, -4);   // T5 tuần Final
  const final = (sid: number, d: number[]) => {
    planRegularTests(quanLy, fou25, { studentIds: [sid], kinds: ['final'] });
    const a = (conn.prepare(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'final' ORDER BY id DESC LIMIT 1`).get(sid) as any).id;
    ['listening', 'reading', 'writing', 'speaking'].forEach((k, i) => saveRegularScore(admin, a, k, { score: d[i], total: 25 }));
    conn.prepare(`UPDATE assessment_scores SET nhap_dau_ngay = ?, entered_at = ? WHERE attempt_id = ?`).run(NGAY_FINAL, `${NGAY_FINAL}T03:00:00.000Z`, a);
  };
  const em: [string, number[], string, string | null][] = [
    ['Hứa Đức Anh', [12, 13, 11, 10], addDays(DEMO_DATE, -1), 'Mất gốc ngữ pháp'],
    ['Giang Thảo My', [18, 18, 11, 8], addDays(DEMO_DATE, -12), null],
    ['Nông Gia Phúc', [18, 18, 12, 9], addDays(DEMO_DATE, -12), null],
  ];
  const ids = em.map(([ten, d]) => { const id = hv(ten); final(id, d); return id; });
  const khang = hv('Lý Minh Khang');
  final(khang, [11, 10, 11, 10]);
  const r = raLenh(quanLy, {
    lopNguonId: fou25, boiCanh: 'cuoi-khoa', tuanChung: tuanChonDuoc(DEMO_DATE)[0],
    dongs: [...ids.map((studentId, i) => ({ studentId, huong: 'len_lop' as const, toClassId: be05, lyDo: i === 0 ? 'Gia đình xin lên, học bổ trợ ngoài giờ' : null })),
      { studentId: khang, huong: 'len_lop' as const, toClassId: be05, lyDo: 'Phụ huynh muốn em học cùng nhóm bạn' }],
  });
  if (r.failed.length) throw new Error(`xetLaiSeed: ${JSON.stringify(r.failed)}`);
  em.forEach(([, , ngayRa, nx], i) => conn.prepare(`UPDATE lenh_chuyen_lop SET ngay_ra_lenh = ?, nhan_xet_chung = ?, tuan_bat_dau = ? WHERE student_id = ? AND trang_thai = 'cho'`)
    .run(ngayRa, nx, DEMO_DATE, ids[i]));
  conn.prepare(`UPDATE lenh_chuyen_lop SET ngay_ra_lenh = ? WHERE student_id = ? AND trang_thai = 'cho'`).run(addDays(DEMO_DATE, -1), khang);
  thiHanhLenhDenHan(DEMO_DATE);
}
