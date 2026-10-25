/**
 * P7 SV-LO-TRINH (plan.md 1.6 N11, N22 ⑤) — "Tạm dừng/ Kết thúc học" và "Quay lại học", phần không nằm trong hàm một em sẵn có:
 *  · `tomTatTrangThai` — khối "Khi lưu, web sẽ" (một em / hàng loạt), đọc CÙNG luật lúc thi hành (`choThiThatKhiKetThuc`, Case mở như `closeCasesBySystem`);
 *  · `chanLenhCho` — em đang có quyết định chuyển lớp chờ thì không Tạm dừng / Kết thúc học (nói đúng câu + bước tiếp);
 *  · `thongTinQuayLai` / `quayLaiHoc` — Quay lại học từ Lưu trữ: lớp cũ còn chạy → một bấm; lớp cũ đã kết thúc → chọn lớp (gợi ý cùng chương trình, cùng chi nhánh);
 *    lộ trình đã đóng (tạm dừng sau thi) / em kết thúc có KQ thi thật → panel Lộ trình mới; em kết thúc giữa khoá → đường Học lại sẵn có.
 */
import { db, theoLo, tx } from '../db.ts';
import { PERMISSIONS, tenRoute, tuanLich } from '../../../shared/domain/index.ts';
import { demoToday } from '../demoConfig.ts';
import { badRequest, forbidden, notFound } from '../util.ts';
import { can, require_, type Principal } from '../permissions.ts';
import { setStudentStatus, transferStudent } from './students.ts';
import { danhSachLopDich } from '../classes/luatLoTrinh.ts';
import { trangThaiBuocTiep } from '../loTrinh/buocTiep.ts';

/** Em có quyết định chuyển lớp đang chờ → câu chặn (chữ = không làm được). Một nguồn cho hộp một em và hàng loạt. */
export function chanLenhCho(studentId: number): string | null {
  const l = db().prepare(`SELECT tuan_bat_dau FROM lenh_chuyen_lop WHERE student_id = ? AND trang_thai = 'cho' LIMIT 1`).get(studentId) as any;
  return l ? `Em đang có quyết định chuyển lớp chờ ${tuanLich(l.tuan_bat_dau, demoToday())} — huỷ quyết định ở Chuyển lớp… rồi làm lại.` : null;
}

/**
 * "Khi lưu, web sẽ" của hộp Tạm dừng/ Kết thúc học (k2, k3). `ketThuc` = ô "Có thể quay lại học" tắt. Em đã kết thúc / không tìm thấy không tính.
 * Số Case = Case chưa xong của em (cùng cách chọn của `closeCasesBySystem`); tạm dừng thì Case dừng hạn (`HV_DANG_HOC_SQL`), kết thúc thì đóng + PA đang chạy huỷ.
 */
export function tomTatTrangThai(ids: readonly number[], ketThuc: boolean): string[] {
  const conn = db();
  const em: { id: number; status: string; lop: string | null; loTrinh: string | null; choThi: boolean }[] = [];
  let soCase = 0, soPa = 0;
  theoLo([...ids], (lo, ph) => {
    for (const r of conn.prepare(
      `SELECT s.id, s.status,
              (SELECT c.code FROM enrollments e JOIN classes c ON c.id = e.class_id WHERE e.student_id = s.id AND e.status IN ('active', 'paused') ORDER BY e.id DESC LIMIT 1) AS lop,
              (SELECT cy.route FROM learning_cycles cy WHERE cy.student_id = s.id AND cy.status = 'active' ORDER BY cy.seq DESC LIMIT 1) AS route,
              (SELECT cy.route_ten FROM learning_cycles cy WHERE cy.student_id = s.id AND cy.status = 'active' ORDER BY cy.seq DESC LIMIT 1) AS route_ten,
              -- cùng điều kiện choThiThatKhiKetThuc, đọc trong câu của cả lô
              EXISTS (SELECT 1 FROM learning_cycles cy WHERE cy.student_id = s.id AND cy.status = 'active' AND cy.route IS NOT NULL) AS cho_thi
         FROM students s WHERE s.id IN (${ph}) AND s.status != 'finished'`,
    ).all(...lo) as any[]) {
      em.push({ id: r.id, status: r.status, lop: r.lop ?? null, loTrinh: tenRoute(r), choThi: ketThuc && r.status === 'active' && !!r.cho_thi });
    }
    soCase += (conn.prepare(`SELECT COUNT(*) n FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
      WHERE COALESCE(sc.student_id, a.student_id) IN (${ph}) AND sc.status != 'done'`).get(...lo) as any).n;
    soPa += (conn.prepare(`SELECT COUNT(*) n FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
      WHERE COALESCE(sc.student_id, a.student_id) IN (${ph}) AND sc.status != 'done' AND iv.status IN ('planned', 'started')`).get(...lo) as any).n;
  });
  if (!em.length) return [];
  const ten = (n: number) => (n === 1 && em.length === 1 ? 'em' : `${n} em`);
  const mot = em.length === 1 ? em[0] : null;
  if (!ketThuc) {
    const dung = em.filter((e) => e.status === 'active');
    return [
      `Đưa ${ten(dung.length)} vào Lưu trữ · Tạm dừng`,
      mot ? `Giữ chỗ ở ${mot.lop ?? '—'}${mot.loTrinh ? ` · lộ trình ${mot.loTrinh} đứng yên` : ''}` : 'Giữ chỗ ở lớp · lộ trình đứng yên',
      ...(soCase ? [`${soCase} Case dừng hạn`] : []),
    ];
  }
  const luu = em.filter((e) => !e.choThi).length;
  const cho = em.length - luu;
  return [
    ...(luu ? [`Đưa ${ten(luu)} vào Lưu trữ · Kết thúc học`] : []),
    ...(cho ? [`${ten(cho)} FT chờ KQ thi thật rồi chọn Bước tiếp — vào Lưu trữ sau`] : []),
    mot ? `Rời ${mot.lop ?? '—'}${mot.loTrinh ? ` · kết thúc lộ trình ${mot.loTrinh}` : ''}` : 'Rời lớp · kết thúc lộ trình',
    ...(soCase ? [`Đóng ${soCase} Case${soPa ? ` · huỷ ${soPa} PA đang chạy` : ''}`] : []),
  ];
}

/** GET /students/:id/trang-thai/xem-truoc — hộp một em: tóm tắt + câu chặn (nếu có). Ai xem được em thì đọc được; quyền làm do máy chủ kiểm lúc lưu. */
export function xemTruocTrangThai(p: Principal, studentId: number, ketThuc: boolean): { dong: string[]; chan: string | null } {
  require_(p, PERMISSIONS.STUDENT_VIEW, { studentId }, 'Học viên này nằm ngoài phạm vi bạn được xem.');
  return { dong: tomTatTrangThai([studentId], ketThuc), chan: chanLenhCho(studentId) };
}

/** POST /students/:id/status — như `setStudentStatus`, thêm chặn quyết định chuyển lớp chờ khi Tạm dừng / Kết thúc học. */
export function doiTrangThai(p: Principal, studentId: number, b: { status: 'active' | 'inactive' | 'finished'; date?: string; reason?: string; endKind?: any }) {
  if (b.status !== 'active') { const chan = chanLenhCho(studentId); if (chan) throw badRequest(chan); }
  return setStudentStatus(p, studentId, b.status, b.date ?? demoToday(), b.reason, b.endKind ?? null);
}

export type HuongQuayLai = 'lop-cu' | 'chon-lop' | 'lo-trinh-moi' | 'hoc-lai';

/** Lộ trình FT mới nhất của em có mục Bước tiếp (có KQ thi thật / đã chọn) → id, để web mở panel Lộ trình mới. */
function cycleLoTrinhMoi(p: Principal, studentId: number): number | null {
  const cy = db().prepare(`SELECT id FROM learning_cycles WHERE student_id = ? AND route IS NOT NULL ORDER BY seq DESC LIMIT 1`).get(studentId) as any;
  return cy && trangThaiBuocTiep(p, cy.id) ? cy.id as number : null;
}

/**
 * GET /students/:id/quay-lai — hướng Quay lại học + lớp cũ + (lớp cũ đã kết thúc) danh sách lớp đang chạy để chọn, gợi ý sẵn lớp cùng chương trình cùng chi nhánh
 * (N22 ⑤; nhiều lớp thì lớp mới mở gần nhất). Ai xem được em thì đọc được.
 */
export function thongTinQuayLai(p: Principal, studentId: number) {
  require_(p, PERMISSIONS.STUDENT_VIEW, { studentId }, 'Học viên này nằm ngoài phạm vi bạn được xem.');
  const conn = db();
  const s = conn.prepare('SELECT id, status, archived_at FROM students WHERE id = ?').get(studentId) as any;
  if (!s) throw notFound('Không tìm thấy học viên');
  const enr = conn.prepare(`SELECT e.class_id, c.code, c.status AS class_status, c.programme_code, c.is_fast_track, c.route, c.branch_id FROM enrollments e JOIN classes c ON c.id = e.class_id
    WHERE e.student_id = ? AND e.status IN ('paused', 'active', 'completed') ORDER BY CASE e.status WHEN 'completed' THEN 1 ELSE 0 END, e.id DESC LIMIT 1`).get(studentId) as any;
  const lopCu = enr ? { id: enr.class_id as number, code: enr.code as string, daKetThuc: enr.class_status === 'finished' } : null;
  const ra = (huong: HuongQuayLai, them: Record<string, unknown> = {}) => ({ huong, lopCu, cycleId: null as number | null, lop: [] as any[], goiYId: null as number | null, ...them });
  if (s.status === 'finished') {
    const cycleId = cycleLoTrinhMoi(p, studentId);
    return cycleId ? ra('lo-trinh-moi', { cycleId }) : ra('hoc-lai');
  }
  if (s.status !== 'inactive') throw badRequest('Học viên đang học — không cần Quay lại học.');
  const dangChay = conn.prepare(`SELECT 1 FROM learning_cycles WHERE student_id = ? AND status = 'active'`).get(studentId);
  if (!dangChay) { const cycleId = cycleLoTrinhMoi(p, studentId); if (cycleId) return ra('lo-trinh-moi', { cycleId }); }
  if (lopCu && !lopCu.daKetThuc) return ra('lop-cu');
  /* Sĩ số lớp chỉ cho người xếp được lớp (Quản lý — như panel Học lại); GV xem được em không thấy sĩ số lớp khác. */
  const ds = danhSachLopDich(lopCu?.id ?? -1, !!lopCu && can(p, PERMISSIONS.CLASS_EDIT, { classId: lopCu.id })).lop;
  const cung = ds.filter((l) => enr && l.chiNhanhId === enr.branch_id && l.ma === (enr.programme_code ?? null) && l.ft === !!enr.is_fast_track);
  const goiY = cung.find((l) => l.route === enr?.route) ?? cung[0] ?? null;
  return ra('chon-lop', { lop: ds, goiYId: goiY?.id ?? null });
}

/**
 * POST /students/:id/quay-lai — em Tạm dừng (Lưu trữ) quay lại: lớp cũ còn chạy → đang học ở lớp cũ (hạn Case tính lại, Hoàn tác = `hoanTacQuayLai`);
 * lớp cũ đã kết thúc → `lopMoiId` bắt buộc: Quay lại học + Chuyển lớp CÙNG giao dịch (đúng luật lộ trình của Chuyển lớp; cần quyền chuyển lớp ở lớp cũ — Quản lý).
 * Em kết thúc / lộ trình đã đóng đi đường riêng (Học lại, Bước tiếp › Lộ trình mới) — 400 chỉ đường.
 */
export function quayLaiHoc(p: Principal, studentId: number, o: { lopMoiId?: unknown; date?: unknown }) {
  const tt = thongTinQuayLai(p, studentId);
  if (tt.huong === 'lo-trinh-moi') throw badRequest('Lộ trình cũ đã đóng — chọn Lộ trình mới để em quay lại học.');
  if (tt.huong === 'hoc-lai') throw badRequest('Em đã kết thúc học — dùng Quay lại học (về lớp cũ / lớp khác) ở hồ sơ.');
  const date = typeof o.date === 'string' && o.date ? o.date : demoToday();
  if (tt.huong === 'lop-cu') return setStudentStatus(p, studentId, 'active', date, 'Quay lại học');
  const lopMoiId = Number(o.lopMoiId);
  if (!Number.isInteger(lopMoiId) || lopMoiId <= 0) throw badRequest(`Lớp ${tt.lopCu?.code ?? 'cũ'} đã kết thúc — chọn lớp để em quay lại học.`);
  if (tt.lopCu && !can(p, PERMISSIONS.CLASS_EDIT, { classId: tt.lopCu.id })) throw forbidden('Lớp cũ đã kết thúc — chỉ Quản lý chọn lớp mới cho em quay lại học.');
  return tx(() => {
    setStudentStatus(p, studentId, 'active', date, 'Quay lại học', null, { lopKetThucDuoc: true });
    transferStudent(p, studentId, lopMoiId, date, 'Quay lại học — lớp cũ đã kết thúc', { note: `Quay lại học sau tạm dừng — lớp ${tt.lopCu?.code ?? 'cũ'} đã kết thúc.` });
    return db().prepare('SELECT * FROM students WHERE id = ?').get(studentId);
  });
}
export { hoanTacQuayLai } from './students.ts';
