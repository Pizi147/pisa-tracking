import { loadPrincipal } from '../permissions.ts';
import { addDays } from '../util.ts';
import { ensurePeriod, mondayOf } from '../platform/week.ts';
import { commitIntake, createClass } from '../classes/intake.ts';
import { planRegularTests, saveRegularScore } from '../normal/regular.ts';
import { reportIssue } from '../cases/cases.ts';
import { quetYeuCau } from '../duyet/yeuCau.ts';
import { ghiMon, xacNhanBanGiao } from '../classes/banGiao.ts';
import { guiDeXuatChuyenLop, raLenh, thiHanhLenhDenHan, type DongLenhVao } from '../classes/lenhChuyen.ts';
import { issuesForTopic, tuanChonDuoc, hanBanGiao } from '../../../shared/domain/index.ts';
import type { BuildCtx } from './build.ts';
import { DEMO_DATE } from './journeys.ts';

/**
 * BỘ DEMO PR-CT (kế hoạch Task 12) — chuyển lớp do Quản lý quyết + bàn giao, dựng qua CHÍNH các hàm nghiệp vụ như `hvlSeed.ts`, sau ngày demo
 * (14/09/2026 — Thứ Hai; tuần sau = W3 SEP). Ngày ra lệnh / hạn bàn giao chỉnh bằng SQL cho đúng kịch bản. Chỉ máy dev — bản chính không chạy seed.
 * Nằm ở: Hồ sơ lớp (dải Kết thúc khoá · Bàn giao · Sắp nhận) · Hồ sơ HV (dải Sắp chuyển / Đã chuyển) · Công việc (Vận hành, Chờ duyệt) — xem DEMO.md.
 *
 *  1  MB FOU 21   6 em, đã HẾT tuần kết thúc, CHƯA có lệnh nào: đủ 4 dải điểm (82 · 74 · 66 · 57 · 44 %) + 1 em thiếu điểm P → dải đỏ, việc Quản lý,
 *                 thẻ Báo lên "Lớp hết khoá còn em chưa có lệnh".
 *  2  MB FOU 22   4 em lên MB BE 09, lệnh ra hôm qua; GVBM đã ghi 3/4 môn (thiếu P); GVCN chưa xác nhận → việc GVCN + việc GVBM P. Em thứ tư THIẾU điểm P
 *     (3) và VẪN có lệnh. Thêm 1 em bảo lưu.
 *  4  MB FT 103   tách 2 em sang MB FT 104 (cùng lộ trình LT1) từ tuần sau; một em có Case Reading đang mở (người nhận gợi ý = GV Reading lớp mới).
 *  5  MB FOU 22   GVCN đề xuất chuyển một em → thẻ "Đề xuất chuyển lớp" trong Chờ duyệt.
 *  6  MB FOU 23   2 em, lệnh ra 4 ngày trước, GVCN chưa xác nhận → thẻ Báo lên "Bàn giao quá hạn".
 *  7  MB FOU 24   1 em ĐÃ chuyển Thứ Hai tuần này sang MB BE 09, bàn giao đã xác nhận → dải "Đã chuyển" + "Đọc bàn giao"; MB BE 09 có em "mới vào".
 */
export function buildCtDemo(ctx: BuildCtx): { lenh: number; lop: number } {
  const { conn } = ctx;
  const mb = ctx.branchId.get('MB');
  const ql = ctx.userId.get('MGR_MB');
  if (!mb || !ql) return { lenh: 0, lop: 0 };
  const admin = loadPrincipal(ctx.adminId);
  const quanLy = loadPrincipal(ql);
  const nguoi = (ma: string) => loadPrincipal(ctx.userId.get(ma)!);
  const TUAN = tuanChonDuoc(DEMO_DATE);   // TUAN[0] = W3 SEP (2026-09-21)

  const lop = (code: string, kind: string, route: string | null, ft: boolean, batDau: string, gv: Record<string, string>, core: string) => {
    const r = createClass(admin, {
      code, branchId: mb, kind, route: route as any, isFastTrack: ft, startDate: batDau, startPeriodId: ensurePeriod(batDau).id,
    }) as any;
    conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,NULL,1,'2026-01-01','active',?)`)
      .run(ctx.userId.get(core), r.id, DEMO_DATE);
    for (const [skill, ma] of Object.entries(gv)) {
      conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,?,0,'2026-01-01','active',?)`)
        .run(ctx.userId.get(ma), r.id, skill, DEMO_DATE);
    }
    return r.id as number;
  };
  const hv = (classId: number, ten: string, target: number | string, startWeek?: string) => {
    commitIntake(admin, { classId, rows: [{ fullName: ten, target, ...(startWeek ? { startWeek } : {}), email: 'hv@demo.test' }], idempotencyKey: `ct-demo-${ten}` } as any);
    const st = conn.prepare('SELECT id FROM students WHERE full_name = ?').get(ten) as any;
    const cy = conn.prepare(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'`).get(st.id) as any;
    return { id: st.id as number, cycleId: cy.id as number };
  };
  /** Điểm Cuối khoá 4 môn L R W S: `d` = số câu đúng mỗi môn trên 25 (bỏ `null` = chưa có điểm môn đó). */
  const cuoiKhoa = (classId: number, sid: number, d: (number | null)[]) => {
    planRegularTests(quanLy, classId, { studentIds: [sid], kinds: ['final'] });
    const a = conn.prepare(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'final' ORDER BY id DESC LIMIT 1`).get(sid) as any;
    ['listening', 'reading', 'writing', 'speaking'].forEach((k, i) => { if (d[i] !== null) saveRegularScore(admin, a.id, k, { score: d[i], total: 25 }); });
  };
  const dong = (studentId: number, huong: DongLenhVao['huong'], toClassId: number | null, o: Partial<DongLenhVao> = {}): DongLenhVao => ({ studentId, huong, toClassId, tuan: TUAN[0], ...o });
  /** Chỉnh mốc ngày của lệnh cho đúng kịch bản (ngày ra lệnh, hạn bàn giao tính lại từ đó — cả ngày ra lệnh). */
  const doiNgayRa = (studentIds: number[], ngayRa: string) => {
    const h = hanBanGiao(ngayRa);
    conn.prepare(`UPDATE lenh_chuyen_lop SET ngay_ra_lenh = ?, han_gvbm = ?, han_gvcn = ? WHERE trang_thai = 'cho' AND huong != 'dung_hoc' AND student_id IN (${studentIds.join(',')})`)
      .run(ngayRa, h.gvbm, h.gvcn);
  };
  let soLop = 0, soLenh = 0;
  const ra = (lopNguon: number, boiCanh: 'cuoi-khoa' | 'giua-khoa', dongs: DongLenhVao[]) => {
    const r = raLenh(quanLy, { lopNguonId: lopNguon, boiCanh, tuanChung: null, dongs });
    if (r.failed.length) throw new Error(`ctSeed: ${JSON.stringify(r.failed)}`);
    soLenh += r.ok.length;
  };

  // ---------------------------------------------------------------- lớp đích dùng chung
  const be09 = lop('MB BE 09', 'BE', null, false, addDays(mondayOf(DEMO_DATE), -7), { listening: 'T_KHOA', reading: 'T_KHOA', writing1: 'T_KHOA', speaking: 'T_TRANG' }, 'T_TRANG');
  soLop += 1;

  // ---------------------------------------------------------------- 1 · MB FOU 21 — hết tuần kết thúc, chưa lệnh nào
  const fou21 = lop('MB FOU 21', 'FOU', null, false, '2026-07-13', { listening: 'T_KHOA', reading: 'T_KHOA', writing1: 'T_KHOA', speaking: 'T_TRANG' }, 'T_KHOA');
  soLop += 1;
  const diem21: [string, (number | null)[]][] = [
    ['Vũ Gia An CT', [21, 20, 21, 20]], ['Đỗ Bảo Linh CT', [19, 18, 19, 18]], ['Ngô Minh Huy CT', [17, 16, 17, 16]],
    ['Bùi Thu Trang CT', [15, 14, 14, 14]], ['Hoàng Khánh Vy CT', [12, 11, 11, 10]], ['Phan Quang Nam CT', [20, 19, 20, null]],   // thiếu điểm P (speaking)
  ];
  for (const [ten, d] of diem21) cuoiKhoa(fou21, hv(fou21, ten, '-').id, d);

  // ---------------------------------------------------------------- 2 · MB FOU 22 — lệnh đang chờ bàn giao, GVBM 3/4 môn
  const fou22 = lop('MB FOU 22', 'FOU', null, false, '2026-07-27', { listening: 'T_HA', reading: 'T_KHOA', writing1: 'T_KHOA', speaking: 'T_TRANG' }, 'T_HA');
  soLop += 1;
  const em22 = ['Lê Hải Mai CT', 'Trịnh Đức Long CT', 'Lâm Gia Bảo CT', 'Mai Thùy Dương CT'].map((ten) => hv(fou22, ten, '-'));
  cuoiKhoa(fou22, em22[0].id, [20, 20, 20, 20]);
  cuoiKhoa(fou22, em22[1].id, [19, 19, 19, 19]);
  cuoiKhoa(fou22, em22[2].id, [17, 16, 17, 16]);
  cuoiKhoa(fou22, em22[3].id, [18, 18, 18, null]);   // 3: thiếu điểm P — vẫn có lệnh (Q30-4)
  const baoLuu = hv(fou22, 'Phan Hà My CT', '-');
  cuoiKhoa(fou22, baoLuu.id, [16, 15, 15, 15]);
  const deXuat = hv(fou22, 'Đinh Quốc Bảo CT', '-');   // 5 · GVCN đề xuất chuyển lớp
  ra(fou22, 'cuoi-khoa', [
    ...em22.map((e) => dong(e.id, 'len_lop', be09)),
    dong(baoLuu.id, 'bao_luu', null, { lyDo: 'Đi du lịch cùng gia đình 3 tuần', ngayXemLai: TUAN[3] }),
  ]);
  doiNgayRa([...em22.map((e) => e.id), baoLuu.id], addDays(DEMO_DATE, -1));
  const lenh22 = (sid: number) => (conn.prepare(`SELECT id FROM lenh_chuyen_lop WHERE student_id = ? ORDER BY id DESC LIMIT 1`).get(sid) as any).id as number;
  for (const [ma, mon] of [['T_HA', 'listening'], ['T_KHOA', 'reading'], ['T_KHOA', 'writing']] as const) {   // thiếu P (speaking)
    for (const e of em22) ghiMon(nguoi(ma), lenh22(e.id), mon, mon === 'listening' ? 'Nghe ý chính tốt, còn yếu dạng điền bản đồ.' : mon === 'reading' ? 'Đọc chậm với bài dài, nên luyện đọc lướt.' : 'Ổn, hay sai thì hiện tại hoàn thành.');
  }
  guiDeXuatChuyenLop(nguoi('T_HA'), deXuat.id, { toClassId: be09, tuan: TUAN[1], lyDo: 'Phụ huynh xin chuyển em sang lớp học buổi tối.' });

  // ---------------------------------------------------------------- 4 · MB FT 103 → MB FT 104 (tách lớp, cùng lộ trình LT1)
  const ft103 = lop('MB FT 103', 'FT', 'LT1', true, '2026-06-01', { listening: 'T_LINH', reading: 'T_LINH', writing1: 'T_KHOA', writing2: 'T_LINH', speaking: 'T_TRANG' }, 'T_LINH');
  const ft104 = lop('MB FT 104', 'FT', 'LT1', true, '2026-06-01', { listening: 'T_LINH', reading: 'T_LINH', writing1: 'T_KHOA', writing2: 'T_KHOA', speaking: 'T_TRANG' }, 'T_LINH');
  soLop += 2;
  const batDauFt = mondayOf(addDays(DEMO_DATE, -7 * 3));   // MT1 (tuần học 6) còn ở tương lai → không sinh MT lịch sử
  const ftEm = ['Trần Minh Khoa CT', 'Phạm Gia Hân CT', 'Đặng Quang Huy CT'].map((ten) => hv(ft103, ten, 6.5, batDauFt));
  const doc = (ftEm[0].cycleId);
  reportIssue(nguoi('T_LINH'), {
    studentId: ftEm[0].id, cycleId: doc, topic: 'reading', title: 'Đọc chậm, hết giờ ở Part 3',
    summary: 'Em làm Reading chậm, thường không kịp Part 3 dù hiểu bài.', primaryCode: issuesForTopic('reading')[0].code, parallel: true,
  } as any);
  ra(ft103, 'giua-khoa', [
    dong(ftEm[0].id, 'chuyen_lop', ft104, { lyDo: 'Lớp MB FT 103 đông, chuyển sang lớp cùng tiến độ' }),
    dong(ftEm[1].id, 'chuyen_lop', ft104, { lyDo: 'Lớp MB FT 103 đông, chuyển sang lớp cùng tiến độ' }),
  ]);
  doiNgayRa([ftEm[0].id, ftEm[1].id], DEMO_DATE);

  // ---------------------------------------------------------------- 6 · MB FOU 23 — bàn giao quá hạn 3 ngày
  const fou23 = lop('MB FOU 23', 'FOU', null, false, '2026-07-27', { listening: 'T_KHOA', reading: 'T_KHOA', writing1: 'T_KHOA', speaking: 'T_TRANG' }, 'T_KHOA');
  soLop += 1;
  const em23 = ['Hồ Diệu Anh CT', 'Vương Thu Hà CT'].map((ten) => hv(fou23, ten, '-'));
  for (const e of em23) cuoiKhoa(fou23, e.id, [18, 17, 18, 17]);
  ra(fou23, 'cuoi-khoa', em23.map((e) => dong(e.id, 'len_lop', be09)));
  doiNgayRa(em23.map((e) => e.id), addDays(DEMO_DATE, -4));

  // ---------------------------------------------------------------- 7 · MB FOU 24 — đã chuyển Thứ Hai tuần này, bàn giao đã xác nhận
  const fou24 = lop('MB FOU 24', 'FOU', null, false, '2026-07-06', { listening: 'T_KHOA', reading: 'T_KHOA', writing1: 'T_KHOA', speaking: 'T_TRANG' }, 'T_KHOA');
  soLop += 1;
  const daChuyen = hv(fou24, 'Nguyễn Phương Thảo CT', '-');
  hv(fou24, 'Cao Bảo Ngọc CT', '-');   // còn ở lại để lớp chưa tự kết thúc
  cuoiKhoa(fou24, daChuyen.id, [22, 21, 22, 21]);
  ra(fou24, 'cuoi-khoa', [dong(daChuyen.id, 'len_lop', be09)]);
  doiNgayRa([daChuyen.id], addDays(DEMO_DATE, -6));
  conn.prepare(`UPDATE lenh_chuyen_lop SET tuan_bat_dau = ? WHERE student_id = ? AND trang_thai = 'cho'`).run(DEMO_DATE, daChuyen.id);
  const lDaChuyen = lenh22(daChuyen.id);
  for (const [ma, mon, chu] of [['T_KHOA', 'listening', 'Nghe tốt, nắm ý chính.'], ['T_KHOA', 'reading', 'Đọc nhanh, cần chú ý câu Not Given.'], ['T_KHOA', 'writing', 'Bố cục rõ, còn sai mạo từ.'], ['T_TRANG', 'speaking', 'Phát âm rõ, ngữ điệu tự nhiên.']] as const) {
    ghiMon(nguoi(ma), lDaChuyen, mon, chu);
  }
  xacNhanBanGiao(nguoi('T_KHOA'), lDaChuyen, 'Em chăm, ngại nói trước lớp. Mẹ theo sát, liên hệ qua Zalo. Cần khích lệ phần Pronunciation.');
  thiHanhLenhDenHan(DEMO_DATE);

  /* Báo lên (bàn giao quá hạn, lớp hết khoá còn em chưa có lệnh) và thẻ chết được quét sau cùng, cùng ngày demo. */
  quetYeuCau(DEMO_DATE);
  return { lenh: soLenh, lop: soLop };
}
