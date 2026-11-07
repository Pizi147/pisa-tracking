/**
 * PHÉP KIỂM RKC-3a (chủ SP 07/11 "KHÔNG BAO GIỜ CHẶN CỨNG", PTA quyết 2 — thang vi phạm): ghi vi phạm cho em không còn đang học (vào lớp ghi danh hiện tại);
 * GV giữ luật bắt buộc xử lý, QL vượt kèm xác nhận; ngày thực hiện trước ngày QL duyệt = hỏi; thu hồi lần giữa chuỗi = hỏi. Bảng: docs/ra-khoa-cung/bang.md.
 */
import { emailThu } from '../seed/emailThu.ts';

export async function runRkcYThucTests(t: any) {
  const { check, assert, conn, TODAY, P, classId } = t;
  if (!conn) return;
  const viol: any = await import('../yThuc/violations.ts');
  const xu: any = await import('../yThuc/xuLy.ts');
  const intake: any = await import('../classes/intake.ts');
  const { voiXacNhan, xoaNho } = await import('../platform/nguCanhRequest.ts');
  const mot = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const thu = (fn: () => void) => { conn.exec('BEGIN IMMEDIATE'); try { fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); } };
  const loi = (fn: () => unknown): any => { try { fn(); return null; } catch (e) { return e; } };
  const LOP = classId('MB FT 101');
  const gvbm = P.w1Teacher, gvcn = P.coreTeacher, QL = P.mbManager;
  let so = 0;
  const moiEm = (): number => {
    const ten = `RKC3 HV ${++so}-${Math.random().toString(36).slice(2, 6)}`;
    intake.commitIntake(P.admin, { classId: LOP, rows: [{ fullName: ten, target: 7, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `rkc3-${ten}` });
    return mot('SELECT id FROM students WHERE full_name = ?', ten).id as number;
  };
  const nVp = (sid: number, n: number): number[] => Array.from({ length: n }, (_, i) =>
    viol.recordViolation(gvbm, { studentId: sid, category: 'homework', ten: `Vi phạm số ${i + 1}`, occurredOn: new Date(Date.parse(TODAY) - (i + 1) * 864e5).toISOString().slice(0, 10) }).violation.id as number);
  const xuLy = (sid: number, ids: number[]) => xu.xacNhanXuLy(gvcn, sid, { violationIds: ids, performedOn: TODAY, performerName: 'Cô Thu', note: 'Đã gọi điện và gửi report cho gia đình' });

  console.log('\nRKC-3a — Ý thức: hỏi thay chặn');

  check('RKC3a-1 · ghi vi phạm em Tạm dừng → vào lớp đang giữ chỗ (trước: "Quay lại học trước")', () => thu(() => {
    const sid = moiEm();
    conn.prepare(`UPDATE enrollments SET status = 'paused' WHERE student_id = ?`).run(sid);
    xoaNho();
    const v = viol.recordViolation(QL, { studentId: sid, category: 'attendance', ten: 'Đi muộn', occurredOn: TODAY }).violation;
    assert(v.classId === LOP, JSON.stringify(v));
  }));

  check('RKC3a-2 · em bắt buộc xử lý: GV Ghi nhận → 400 chỉ đường; QL → hỏi → Ghi nhận được', () => thu(() => {
    const sid = moiEm();
    const ids = nVp(sid, 3);
    const e = loi(() => xu.ghiNhan(gvcn, sid, ids));
    assert(e?.status === 400 && /Quản lý Ghi nhận được/.test(e.message), `GV: ${e?.status} ${e?.message}`);
    const e2 = loi(() => xu.ghiNhan(QL, sid, ids));
    assert(e2?.status === 409 && e2.details?.canXacNhan, `QL phải hỏi: ${e2?.status} ${e2?.message}`);
    const r = voiXacNhan(() => xu.ghiNhan(QL, sid, ids));
    assert(r.soGhiNhan === 3, JSON.stringify(r));
  }));

  check('RKC3a-3 · Đã thực hiện với ngày TRƯỚC ngày QL duyệt → hỏi → lưu', () => thu(() => {
    const sid = moiEm();
    const m = xuLy(sid, nVp(sid, 1));
    const ngayDuyet = new Date(Date.parse(TODAY) - 2 * 864e5).toISOString().slice(0, 10);
    conn.prepare(`UPDATE discipline_measures SET status = 'da_duyet', performed_on = NULL, quyet_luc = ? WHERE id = ?`).run(`${ngayDuyet}T09:00:00.000Z`, m.id);
    const truoc = new Date(Date.parse(TODAY) - 5 * 864e5).toISOString().slice(0, 10);
    const e = loi(() => xu.daThucHien(gvcn, m.id, { performedOn: truoc, performerName: 'Cô Thu' }));
    assert(e?.status === 409 && e.details?.canXacNhan, `phải hỏi: ${e?.status} ${e?.message}`);
    voiXacNhan(() => xu.daThucHien(gvcn, m.id, { performedOn: truoc, performerName: 'Cô Thu' }));
    assert(mot('SELECT status, performed_on d FROM discipline_measures WHERE id = ?', m.id).d === truoc, 'phải lưu ngày');
  }));

  check('RKC3a-4 · thu hồi lần GIỮA chuỗi (đã có Report 2): QL hỏi → thu hồi, Report 2 giữ', () => thu(() => {
    const sid = moiEm();
    const [v1, v2] = nVp(sid, 2);
    const r1 = xuLy(sid, [v1]); const r2 = xuLy(sid, [v2]);
    const e = loi(() => xu.thuHoiXuLy(QL, r1.id, { lyDo: 'Ghi nhầm em' }));
    assert(e?.status === 409 && e.details?.canXacNhan, `phải hỏi: ${e?.status} ${e?.message}`);
    voiXacNhan(() => xu.thuHoiXuLy(QL, r1.id, { lyDo: 'Ghi nhầm em' }));
    assert(mot('SELECT status FROM discipline_measures WHERE id = ?', r1.id).status === 'thu_hoi'
      && mot('SELECT status FROM discipline_measures WHERE id = ?', r2.id).status === 'done', 'r1 thu hồi, r2 giữ');
  }));
}
