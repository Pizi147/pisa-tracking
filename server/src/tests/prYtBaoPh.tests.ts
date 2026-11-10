/**
 * PHÉP KIỂM YT-BAO-PH (rà toàn bộ 11/11 #7 + [XM 1] — G3-9, G3-10): Báo PH theo trạng thái thật của biện pháp.
 *  · Meeting CX/GĐCN có PH dự → GVCN ghi Đã thực hiện thì việc Báo PH của TVV tự xong (một dòng lịch sử ghi rõ); "Chưa thực hiện" → mở lại.
 *  · Thu hồi lần xử lý TVV đã báo PH → việc "Báo lại PH" cho TVV (mặc định bật, QL tắt được); Huỷ quyết định → việc báo lại gỡ.
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrYtBaoPhTests(t: YThucTestKit) {
  const { checkAsync, assert, conn, TODAY, P, classId, addDays } = t as any;
  console.log('\nYT-BAO-PH · Báo PH theo trạng thái thật của biện pháp');

  const thu = async (fn: () => void | Promise<void>) => { conn.exec('BEGIN IMMEDIATE'); try { await fn(); } finally { conn.exec('ROLLBACK'); } };
  const intake: any = await import('../classes/intake.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { boLichTuTao } = await import('./luotThu.ts');
  const viol: any = await import('../yThuc/violations.ts');
  const xu: any = await import('../yThuc/xuLy.ts');
  const yc: any = await import('../duyet/yeuCau.ts');
  const bp: any = await import('../yThuc/baoPhTvv.ts');
  const att: any = await import('../platform/attachments.ts');
  const { myWork } = await import('../worklist/mywork.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const hang = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const gvbm = P.w1Teacher; const gvcn = P.coreTeacher; const ql = P.mbManager;
  let dem = 0;
  const tvv = (() => {
    const uid = accounts.createAccount(P.admin, { email: `ytbaoph.tvv${accounts.EMAIL_SUFFIX}`, password: 'matkhau-ytbaoph', fullName: 'TVV YTBAOPH', roles: [{ role: 'consultant', branches: ['MB'] }] }).userId as number;
    return loadPrincipal(uid);
  })();
  const moiEm = (): number => {
    const ten = `YTBAOPH em ${++dem}-${Math.random().toString(36).slice(2, 6)}`;
    intake.commitIntake(P.admin, { classId: classId('MB FT 101'), rows: [{ fullName: ten, target: 7, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `ytbaoph-${ten}` } as any);
    const st = conn.prepare('SELECT id FROM students WHERE full_name = ?').get(ten) as any;
    const cy = conn.prepare("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'").get(st.id) as any;
    boLichTuTao(conn, cy.id);
    conn.prepare('UPDATE students SET consultant_user_id = ? WHERE id = ?').run(tvv.userId, st.id);
    return st.id as number;
  };
  const vp = (sid: number): number => viol.recordViolation(gvbm, { studentId: sid, category: 'conduct', ten: 'Xúc phạm bạn trong giờ', occurredOn: addDays(TODAY, -1) }).violation.id;
  const theYc = (loai: string, mid: number) => (conn.prepare('SELECT id FROM yeu_cau_duyet WHERE loai = ? AND doi_tuong_id = ? ORDER BY id DESC').get(loai, mid) as any).id as number;
  const viecCuaXl = (mid: number) => hang('SELECT * FROM viec_bao_ph WHERE measure_id = ?', mid)[0];
  const baoLaiCua = (mid: number) => hang('SELECT * FROM viec_bao_ph WHERE bao_lai_cua = ?', mid);
  const lanCua = (viecId: number) => hang('SELECT * FROM viec_bao_ph_lan WHERE viec_id = ? ORDER BY id', viecId);
  const meetingDaDuyet = (sid: number): number => {
    const nhap = xu.deXuat(gvcn, sid, { kind: 'meeting_cx', violationIds: [vp(sid)], note: 'Xúc phạm bạn, cần họp với gia đình và CX' });
    att.addLink(gvcn, { ownerType: 'discipline_measure', ownerId: nhap.id, url: 'https://example.com/bien-ban', displayName: 'Biên bản' });
    xu.guiDeXuat(gvcn, nhap.id);
    yc.duyetYeuCau(ql, theYc('y_thuc', nhap.id));
    return nhap.id;
  };
  const thucHien = (mid: number, o: Record<string, unknown> = {}) =>
    xu.daThucHien(gvcn, mid, { performedOn: TODAY, performerName: 'Cô Hà', note: 'Đã họp PH, CX và GĐCN', ...o });

  await checkAsync('BPH-1 · Meeting CX/GĐCN: Đã thực hiện (PH dự — mặc định) → việc Báo PH tự xong, lịch sử ghi rõ; Chưa thực hiện → mở lại', () => thu(() => {
    const sid = moiEm(); const mid = meetingDaDuyet(sid);
    assert(viecCuaXl(mid).trang_thai === 'mo', 'trước: việc mở');
    thucHien(mid);
    const v = viecCuaXl(mid); const lan = lanCua(v.id);
    assert(v.trang_thai === 'xong' && lan.length === 1 && lan[0].ket_qua === 'da_bao' && /Meeting CX\/GĐCN/.test(lan[0].ghi_chu) && lan[0].ngay === TODAY,
      JSON.stringify({ v: v.trang_thai, lan }));
    xoaNho();
    assert(!((myWork(tvv, {}) as any).items as any[]).some((x) => x.group === 'bao_ph_yt' && x.studentId === sid), 'TVV hết việc');
    xu.chuaThucHien(gvcn, mid);
    assert(viecCuaXl(mid).trang_thai === 'mo' && lanCua(v.id).length === 0, 'Chưa thực hiện → việc mở lại, gỡ dòng tự ghi');
  }));

  await checkAsync('BPH-2 · Meeting CX/GĐCN PH không dự (phDu = false) → việc Báo PH vẫn mở; TVV đã báo trước → giữ nguyên lịch sử', () => thu(() => {
    const sid = moiEm(); const mid = meetingDaDuyet(sid);
    thucHien(mid, { phDu: false });
    assert(viecCuaXl(mid).trang_thai === 'mo', 'PH không dự');
    const sid2 = moiEm(); const mid2 = meetingDaDuyet(sid2);
    const v2 = viecCuaXl(mid2);
    bp.ghiKetQuaBaoPh(tvv, { viecIds: [v2.id], ketQua: 'da_bao', ghiChu: 'Đã gọi mẹ em, hẹn họp' });
    thucHien(mid2);
    assert(lanCua(v2.id).length === 1, 'đã báo: không thêm dòng');
  }));

  await checkAsync('BPH-3 · loại khác Meeting (WL 3) → Đã thực hiện không đụng việc Báo PH', () => thu(() => {
    const sid = moiEm();
    const nhap = xu.deXuat(gvcn, sid, { kind: 'wl_3', violationIds: [vp(sid)], note: 'Vi phạm lặp lại, cần WL 3' });
    att.addLink(gvcn, { ownerType: 'discipline_measure', ownerId: nhap.id, url: 'https://example.com/wl3', displayName: 'Biên bản' });
    xu.guiDeXuat(gvcn, nhap.id); yc.duyetYeuCau(ql, theYc('y_thuc', nhap.id));
    thucHien(nhap.id);
    assert(viecCuaXl(nhap.id).trang_thai === 'mo', 'WL 3: TVV vẫn báo');
  }));

  const daXuLyDaBao = (sid: number): number => {
    const m = xu.xacNhanXuLy(gvcn, sid, { violationIds: [vp(sid)], performedOn: TODAY, performerName: 'Cô Hà', note: 'Gặp em sau giờ học, ký Report 1' });
    bp.ghiKetQuaBaoPh(tvv, { viecIds: [viecCuaXl(m.id).id], ketQua: 'da_bao', ghiChu: 'Đã báo mẹ em về Report 1' });
    return m.id;
  };

  await checkAsync('BPH-4 · thu hồi (QL duyệt thẻ GVCN) lần TVV đã báo → việc "Báo lại PH" mở cho TVV, ghi được; Huỷ quyết định → gỡ', () => thu(() => {
    const sid = moiEm(); const mid = daXuLyDaBao(sid);
    xu.thuHoiXuLy(gvcn, mid, { lyDo: 'Ghi nhầm em, vi phạm của bạn khác' });
    const the = theYc('thu_hoi_y_thuc', mid);
    yc.duyetYeuCau(ql, the);
    const bl = baoLaiCua(mid);
    assert(bl.length === 1 && bl[0].trang_thai === 'mo' && bl[0].measure_id === null, JSON.stringify(bl));
    xoaNho();
    const viec = ((myWork(tvv, {}) as any).items as any[]).find((x) => x.group === 'bao_ph_yt' && x.studentId === sid);
    assert(viec && /đã thu hồi/.test(viec.tieuDe), `việc TVV: ${JSON.stringify(viec)}`);
    const xem = bp.xemViecBaoPh(tvv, bl[0].id);
    assert(xem.coTheGhi === true && xem.boiCanh.viPham.length === 1, JSON.stringify({ coTheGhi: xem.coTheGhi, vp: xem.boiCanh.viPham }));
    yc.huyQuyetDinh(ql, the);
    assert(baoLaiCua(mid).length === 0, 'Huỷ quyết định: việc báo lại gỡ (chưa ghi lần nào)');
  }));

  await checkAsync('BPH-5 · QL tắt "Nhờ TVV báo lại" → không sinh việc; TVV chưa báo → không sinh (việc cũ "Đã bỏ" như cũ)', () => thu(() => {
    const sid = moiEm(); const mid = daXuLyDaBao(sid);
    xu.thuHoiXuLy(gvcn, mid, { lyDo: 'Ghi nhầm em, vi phạm của bạn khác' });
    yc.duyetYeuCau(ql, theYc('thu_hoi_y_thuc', mid), { duLieu: { baoLai: false } });
    assert(baoLaiCua(mid).length === 0, 'QL tắt');
    const sid2 = moiEm();
    const m2 = xu.xacNhanXuLy(gvcn, sid2, { violationIds: [vp(sid2)], performedOn: TODAY, performerName: 'Cô Hà', note: 'Gặp em sau giờ học, ký Report 1' });
    xu.thuHoiXuLy(gvcn, m2.id, { lyDo: 'Ghi nhầm em, vi phạm của bạn khác' });
    yc.duyetYeuCau(ql, theYc('thu_hoi_y_thuc', m2.id));
    assert(baoLaiCua(m2.id).length === 0 && viecCuaXl(m2.id).trang_thai === 'bo', 'chưa báo');
  }));

  await checkAsync('BPH-6 · QL thu hồi thẳng lần TVV đã báo → "Báo lại PH" mặc định bật; baoLai = false → không', () => thu(() => {
    const sid = moiEm(); const mid = daXuLyDaBao(sid);
    xu.thuHoiXuLy(ql, mid, { lyDo: 'Ghi nhầm em, vi phạm của bạn khác' });
    assert(baoLaiCua(mid).length === 1, 'QL thẳng: có việc báo lại');
    const sid2 = moiEm(); const m2 = daXuLyDaBao(sid2);
    xu.thuHoiXuLy(ql, m2, { lyDo: 'Ghi nhầm em, vi phạm của bạn khác', baoLai: false });
    assert(baoLaiCua(m2).length === 0, 'QL thẳng tắt');
  }));
}
