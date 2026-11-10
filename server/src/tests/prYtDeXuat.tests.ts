/**
 * PHÉP KIỂM YT-DE-XUAT (rà toàn bộ 11/11 #6 — G3-4, G3-5, G3-7, G3-8; mockup #1346): đề xuất QL duyệt một màn + QL duyệt tại chỗ.
 *  · Nháp cũ của cùng người · cùng em dọn khi tạo nháp mới (không nháp mồ côi).
 *  · Duyệt → GVCN tin "Cần làm" có hạn, mở thẳng việc Đã thực hiện; rời nhóm khi ghi xong; không thêm tin chung "Đã duyệt". Meeting → CX "Để biết".
 *  · Thẻ Ý thức không gắn điểm / chip SOS ("đừng nhét thêm điểm" — chủ SP 11/11).
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrYtDeXuatTests(t: YThucTestKit) {
  const { checkAsync, assert, conn, TODAY, P, classId } = t;
  console.log('\nYT-DE-XUAT · đề xuất một màn + QL duyệt tại chỗ');

  const thu = async (fn: () => void | Promise<void>) => { conn.exec('BEGIN IMMEDIATE'); try { await fn(); } finally { conn.exec('ROLLBACK'); } };
  const intake = await import('../classes/intake.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { boLichTuTao } = await import('./luotThu.ts');
  const viol: any = await import('../yThuc/violations.ts');
  const xu: any = await import('../yThuc/xuLy.ts');
  const yc: any = await import('../duyet/yeuCau.ts');
  const att: any = await import('../platform/attachments.ts');
  const { thongBaoCua } = await import('../platform/thongBao.ts');
  const { nhomThongBao } = await import('../../../shared/domain/index.ts') as any;
  const hang = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const gvbm = P.w1Teacher; const gvcn = P.coreTeacher; const ql = P.mbManager;
  const cx = loadPrincipal(accounts.createAccount(P.admin, { email: `ytdx.cx${accounts.EMAIL_SUFFIX}`, password: 'matkhau-ytdx', fullName: 'CX YTDX', roles: [{ role: 'cx', branches: [] }] }).userId);
  let dem = 0;
  const moiEm = (): number => {
    const ten = `YTDX em ${++dem}-${Math.random().toString(36).slice(2, 6)}`;
    intake.commitIntake(P.admin, { classId: classId('MB FT 101'), rows: [{ fullName: ten, target: 7, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `ytdx-${ten}` } as any);
    const st = conn.prepare('SELECT id FROM students WHERE full_name = ?').get(ten) as any;
    const cy = conn.prepare("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'").get(st.id) as any;
    boLichTuTao(conn, cy.id);
    return st.id as number;
  };
  const vp = (sid: number): number => viol.recordViolation(gvbm, { studentId: sid, category: 'conduct', ten: 'Xúc phạm bạn trong giờ', occurredOn: TODAY }).violation.id;
  const gui = (sid: number, kind: string): number => {
    const nhap = xu.deXuat(gvcn, sid, { kind, violationIds: [vp(sid)], note: 'Xúc phạm bạn, cần họp với gia đình và CX' });
    att.addLink(gvcn, { ownerType: 'discipline_measure', ownerId: nhap.id, url: 'https://example.com/bien-ban', displayName: 'Biên bản' });
    xu.guiDeXuat(gvcn, nhap.id);
    return nhap.id;
  };
  const theYc = (mid: number) => (conn.prepare("SELECT id FROM yeu_cau_duyet WHERE loai = 'y_thuc' AND doi_tuong_id = ? ORDER BY id DESC").get(mid) as any).id as number;
  const tin = (uid: number, mid: number) => (thongBaoCua(uid) as any[]).filter((n) => n.entity_type === 'discipline_measure' && n.entity_id === mid);

  await checkAsync('DX-1 · nháp cũ (đóng tab giữa chừng) của cùng người · cùng em dọn khi tạo nháp mới; nháp người khác giữ', () => thu(() => {
    const sid = moiEm(); const v = vp(sid);
    const a = xu.deXuat(gvcn, sid, { kind: 'meeting_cx', violationIds: [v], note: 'Lần một — đóng tab giữa chừng' });
    att.addLink(gvcn, { ownerType: 'discipline_measure', ownerId: a.id, url: 'https://example.com/a', displayName: 'A' });
    const khac = xu.deXuat(ql, sid, { kind: 'meeting_cx', violationIds: [v], note: 'Nháp của Quản lý cho em này' });
    const b = xu.deXuat(gvcn, sid, { kind: 'meeting_cx', violationIds: [v], note: 'Lần hai — gửi thật sự' });
    const nhap = hang("SELECT id FROM discipline_measures WHERE student_id = ? AND status = 'nhap' ORDER BY id", sid).map((r) => r.id);
    assert(JSON.stringify(nhap) === JSON.stringify([khac.id, b.id]), JSON.stringify(nhap));
    assert(hang("SELECT 1 FROM attachments WHERE owner_type = 'discipline_measure' AND owner_id = ?", a.id).length === 0, 'tệp nháp cũ gỡ');
  }));

  await checkAsync('DX-2 · QL duyệt Meeting: GVCN tin "Cần làm" có hạn + link Đã thực hiện, không tin chung "Đã duyệt"; CX "Để biết"; Đã thực hiện → tin rời Cần làm', () => thu(() => {
    const sid = moiEm(); const mid = gui(sid, 'meeting_cx');
    const yid = theYc(mid);
    yc.duyetYeuCau(ql, yid);
    const g = tin(gvcn.userId, mid).find((n) => n.kind === 'yt_da_duyet');
    assert(g && g.han && /cong-viec\?viec=yt_thuc_hien%3A/.test(g.duong ?? '') && nhomThongBao(g) === 'can-lam', JSON.stringify(g));
    assert(!(thongBaoCua(gvcn.userId) as any[]).some((n) => n.dedup_key === `duyet_ket_qua:${yid}`), 'không có tin chung Đã duyệt');
    const c = tin(cx.userId, mid);
    assert(c.length === 1 && /Meeting CX\/GĐCN/.test(c[0].title) && nhomThongBao(c[0]) === 'de-biet', JSON.stringify(c));
    xu.daThucHien(gvcn, mid, { performedOn: TODAY, performerName: 'Cô Hà', note: 'Đã họp PH, CX và GĐCN' });
    const g2 = tin(gvcn.userId, mid).find((n) => n.kind === 'yt_da_duyet');
    assert(g2 && nhomThongBao(g2) === 'de-biet', JSON.stringify(g2));
  }));

  await checkAsync('DX-3 · QL duyệt WL 3: GVCN có tin Cần làm, CX không được báo', () => thu(() => {
    const sid = moiEm(); const mid = gui(sid, 'wl_3');
    yc.duyetYeuCau(ql, theYc(mid));
    assert(tin(gvcn.userId, mid).some((n) => n.kind === 'yt_da_duyet') && tin(cx.userId, mid).length === 0, 'WL 3');
  }));

  await checkAsync('DX-4 · Chờ bạn duyệt: thẻ Ý thức không có dòng điểm / chip SOS; vi phạm + bằng chứng đọc ở GET /y-thuc/xu-ly/:id (kemTep)', () => thu(() => {
    const sid = moiEm(); const mid = gui(sid, 'meeting_cx');
    const the = (yc.hopChoDuyet(ql, { xem: 'cho', boiCanh: true }).the as any[]).find((x) => x.loai === 'y_thuc' && x.doiTuongId === mid);
    assert(the && the.diemHv == null && the.sos == null && /1 bằng chứng/.test(the.phu ?? ''), JSON.stringify(the && { diem: the.diemHv, sos: the.sos, phu: the.phu }));
    assert(att.listAttachments(ql, 'discipline_measure', mid).length === 1 && xu.xemXuLy(ql, mid).viPham.length === 1, 'QL đọc được vi phạm + tệp');
  }));
}
