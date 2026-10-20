/** PHÉP KIỂM LUAT-5 (luật 5, 21/10) — GVCN thu hồi / xử lý không tăng bậc phải qua QL duyệt, lý do bắt buộc; thu hồi = "Đã thu hồi" (giữ dòng). */
import type { YThucTestKit } from './yThuc.tests.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrLuat5Tests(t: YThucTestKit) {
  const { checkAsync, assert, assertThrows, conn, TODAY, P, classId } = t;
  console.log('\nLUAT-5 · thu hồi / không tăng bậc qua QL');

  const thu = async (fn: () => void | Promise<void>) => { conn.exec('BEGIN IMMEDIATE'); try { await fn(); } finally { conn.exec('ROLLBACK'); } };
  const intake = await import('../classes/intake.ts');
  const { boLichTuTao } = await import('./luotThu.ts');
  const viol: any = await import('../yThuc/violations.ts');
  const xu: any = await import('../yThuc/xuLy.ts');
  const yc: any = await import('../duyet/yeuCau.ts');
  const tk: any = await import('../yThuc/thongKe.ts');
  const att: any = await import('../platform/attachments.ts');
  const { khoTepHienTai } = await import('../platform/khoTep.ts');
  const kho = () => khoTepHienTai(att.uploadsDir());
  const hang = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const gvbm = P.w1Teacher; const gvcn = P.coreTeacher; const ql = P.mbManager;
  let dem = 0;
  const moiEm = (): number => {
    const ten = `LUAT5 em ${++dem}-${Math.random().toString(36).slice(2, 6)}`;
    intake.commitIntake(P.admin, { classId: classId('MB FT 101'), rows: [{ fullName: ten, target: 7, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `luat5-${ten}` } as any);
    const st = conn.prepare('SELECT id FROM students WHERE full_name = ?').get(ten) as any;
    const cy = conn.prepare("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'").get(st.id) as any;
    boLichTuTao(conn, cy.id);
    return st.id as number;
  };
  const nVp = (sid: number, n: number): number[] => Array.from({ length: n }, (_, i) =>
    viol.recordViolation(gvbm, { studentId: sid, category: 'homework', ten: `Vi phạm số ${i + 1}`, occurredOn: new Date(Date.parse(TODAY) - (i + 1) * 864e5).toISOString().slice(0, 10) }).violation.id as number);
  const xuLy = (who: any, sid: number, ids: number[]) => xu.xacNhanXuLy(who, sid, { violationIds: ids, performedOn: TODAY, performerName: 'Cô Thu', note: 'Đã gọi điện và gửi report cho gia đình' });
  const ma = (fn: () => unknown): number | null => { try { fn(); return null; } catch (e: any) { return e?.status ?? -1; } };
  const trangThai = (id: number) => (hang('SELECT status FROM discipline_measures WHERE id = ?', id)[0]?.status ?? null) as string | null;
  const theThuHoi = (id: number) => hang("SELECT * FROM yeu_cau_duyet WHERE loai = 'thu_hoi_y_thuc' AND doi_tuong_loai = 'discipline_measure' AND doi_tuong_id = ? ORDER BY id DESC", id);
  const bac = (sid: number) => xu.yThucHocVien(ql, sid).bac as number;

  await checkAsync('L5-1 · đường xoá cũ: GVCN → 403, QL → 400, GVBM → 403; dòng còn nguyên (không xoá vật lý)', () => thu(() => {
    const sid = moiEm(); const [v1] = nVp(sid, 1);
    const r1 = xuLy(gvcn, sid, [v1]);
    assert(ma(() => xu.xoaXuLy(gvcn, r1.id)) === 403, 'GVCN gọi xoá phải 403');
    assert(ma(() => xu.xoaXuLy(ql, r1.id)) === 400, 'QL gọi xoá phải 400 (dùng Thu hồi kèm lý do)');
    assert(ma(() => xu.xoaXuLy(gvbm, r1.id)) === 403, 'GVBM 403');
    assert(trangThai(r1.id) === 'done' && bac(sid) === 1, 'dòng còn, bậc giữ');
  }));

  await checkAsync('L5-2 · thiếu lý do → 400 (GVCN và QL); GVBM → 403; lần bị QL từ chối không thu hồi', () => thu(() => {
    const sid = moiEm(); const [v1] = nVp(sid, 1);
    const r1 = xuLy(gvcn, sid, [v1]);
    assert(ma(() => xu.thuHoiXuLy(gvcn, r1.id, { lyDo: '   ' })) === 400, 'GVCN không lý do');
    assert(ma(() => xu.thuHoiXuLy(gvcn, r1.id, {})) === 400, 'GVCN thiếu trường');
    assert(ma(() => xu.thuHoiXuLy(ql, r1.id, { lyDo: '' })) === 400, 'QL không lý do');
    assert(ma(() => xu.thuHoiXuLy(gvbm, r1.id, { lyDo: 'Bấm nhầm' })) === 403, 'GVBM');
    assert(trangThai(r1.id) === 'done' && theThuHoi(r1.id).length === 0, 'không đổi gì');
    conn.prepare("UPDATE discipline_measures SET status = 'tu_choi' WHERE id = ?").run(r1.id);
    assert(ma(() => xu.thuHoiXuLy(gvcn, r1.id, { lyDo: 'Bấm nhầm' })) === 400, 'lần bị từ chối');
  }));

  await checkAsync('L5-3 · GVCN gửi Thu hồi → thẻ Chờ duyệt (Ý thức) có lý do; lần xử lý vẫn tính tới khi QL duyệt; gửi lại → 400', () => thu(() => {
    const sid = moiEm(); const [v1, v2] = nVp(sid, 2);
    xuLy(gvcn, sid, [v1]); const r2 = xuLy(gvcn, sid, [v2]);
    xu.thuHoiXuLy(gvcn, r2.id, { lyDo: 'Bấm nhầm' });
    const the = theThuHoi(r2.id);
    assert(the.length === 1 && the[0].trang_thai === 'cho' && the[0].phan_loai === 'y-thuc' && the[0].nguoi_xin === gvcn.userId && the[0].ly_do === 'Bấm nhầm', JSON.stringify(the[0]));
    assert(trangThai(r2.id) === 'done' && bac(sid) === 2, 'chờ duyệt: vẫn Report 2');
    const x = xu.xemXuLy(gvcn, r2.id);
    assert(x.thuHoi?.trangThai === 'cho' && x.coTheThuHoi === false && x.the === null, `xem: ${JSON.stringify({ th: x.thuHoi?.trangThai, c: x.coTheThuHoi, the: x.the })}`);
    const mo = yc.theCuaDoiTuong('discipline_measure', [r2.id]).find((c: any) => c.loai === 'thu_hoi_y_thuc');
    assert(/Thu hồi Report 2/.test(mo.tieuDe) && /bậc về Report 1/.test(mo.neuDuyet ?? '') && /1 vi phạm về chưa xử lý/.test(mo.neuDuyet ?? ''), JSON.stringify(mo));
    assert(ma(() => xu.thuHoiXuLy(gvcn, r2.id, { lyDo: 'Gửi lại' })) === 400, 'đã có thẻ chờ');
  }));

  await checkAsync('L5-4 · QL duyệt → "Đã thu hồi": dòng + liên kết + tệp giữ, bậc lùi, vi phạm về chưa xử lý, thẻ ghi ai · lúc · lý do, nhật ký', () => thu(async () => {
    const sid = moiEm(); const [v1, v2] = nVp(sid, 2);
    xuLy(gvcn, sid, [v1]); const r2 = xuLy(gvcn, sid, [v2]);
    const tep = await att.addFile(gvcn, { ownerType: 'discipline_measure', ownerId: r2.id, fileName: 'bien-ban.pdf', data: Buffer.from('bb') });
    const url = hang('SELECT url FROM attachments WHERE id = ?', tep.id)[0].url as string;
    try {
      xu.thuHoiXuLy(gvcn, r2.id, { lyDo: 'Bấm nhầm bậc' });
      yc.duyetYeuCau(ql, theThuHoi(r2.id)[0].id);
      assert(trangThai(r2.id) === 'thu_hoi', 'trạng thái ' + trangThai(r2.id));
      assert(hang('SELECT violation_id FROM measure_violations WHERE measure_id = ?', r2.id).length === 1, 'liên kết giữ');
      assert(hang("SELECT id FROM attachments WHERE owner_type = 'discipline_measure' AND owner_id = ?", r2.id).length === 1, 'tệp giữ');
      const hv = xu.yThucHocVien(ql, sid);
      assert(hv.bac === 1 && hv.keTiep.kind === 'report_2', `bậc ${hv.bac} kế ${hv.keTiep.kind}`);
      assert(viol.loadViolation(v2).trangThai !== 'da_xu_ly', 'v2 về chưa xử lý');
      const the = theThuHoi(r2.id)[0];
      assert(the.trang_thai === 'duyet' && the.nguoi_duyet === ql.userId && the.xu_ly_luc && the.ly_do === 'Bấm nhầm bậc' && the.nguoi_xin === gvcn.userId, JSON.stringify(the));
      const x = xu.xemXuLy(gvcn, r2.id);
      assert(x.status === 'thu_hoi' && x.statusLabel === 'Đã thu hồi' && x.coTheSua === false && x.coTheThuHoi === false && x.thuHoi?.lyDo === 'Bấm nhầm bậc', JSON.stringify({ s: x.status, l: x.statusLabel }));
      assert(hang("SELECT id FROM audit_logs WHERE action = 'discipline.revoke' AND entity_id = ?", r2.id).length === 1, 'nhật ký');
      assert(ma(() => xu.suaXuLy(gvcn, r2.id, { note: 'Sửa sau khi thu hồi xong' })) === 400, 'lần đã thu hồi chỉ xem');
      assert(ma(() => xu.suaViPhamXuLy(gvcn, r2.id, { violationIds: [v2] })) === 400, 'sửa vi phạm lần đã thu hồi');
    } finally { await kho().xoa(url); }
  }));

  await checkAsync('L5-5 · QL từ chối → giữ nguyên, GVCN thấy lý do; GVCN rút thẻ còn chờ → lần xử lý giữ', () => thu(() => {
    const sid = moiEm(); const [v1] = nVp(sid, 1);
    const r1 = xuLy(gvcn, sid, [v1]);
    xu.thuHoiXuLy(gvcn, r1.id, { lyDo: 'Em không vi phạm' });
    yc.tuChoiYeuCau(ql, theThuHoi(r1.id)[0].id, 'Đã đối chiếu, vi phạm đúng');
    assert(trangThai(r1.id) === 'done' && bac(sid) === 1, 'giữ nguyên');
    const x = xu.xemXuLy(gvcn, r1.id);
    assert(x.thuHoi?.trangThai === 'tu_choi' && x.thuHoi?.lyDoTuChoi === 'Đã đối chiếu, vi phạm đúng' && x.coTheThuHoi === true, JSON.stringify(x.thuHoi));
    xu.thuHoiXuLy(gvcn, r1.id, { lyDo: 'Gửi lại kèm bằng chứng' });
    yc.rutYeuCau(gvcn, theThuHoi(r1.id)[0].id);
    assert(theThuHoi(r1.id)[0].trang_thai === 'tu_dong' && trangThai(r1.id) === 'done', 'rút');
  }));

  await checkAsync('L5-6 · QL thu hồi thẳng (lý do bắt buộc) → "Đã thu hồi" ngay, thẻ tự duyệt (ai · lúc · lý do)', () => thu(() => {
    const sid = moiEm(); const [v1] = nVp(sid, 1);
    const r1 = xuLy(gvcn, sid, [v1]);
    xu.thuHoiXuLy(ql, r1.id, { lyDo: 'Ghi nhầm em' });
    const the = theThuHoi(r1.id);
    assert(trangThai(r1.id) === 'thu_hoi' && bac(sid) === 0, 'thu hồi ngay');
    assert(the.length === 1 && the[0].trang_thai === 'duyet' && the[0].tu_duyet === 1 && the[0].nguoi_xin === ql.userId && the[0].nguoi_duyet === ql.userId && the[0].ly_do === 'Ghi nhầm em', JSON.stringify(the[0]));
  }));

  await checkAsync('L5-7 · mọi số đếm bỏ lần "Đã thu hồi" (một cửa trạng thái) — dòng thời gian vẫn hiện; vi phạm xử lý lại được', () => thu(() => {
    const sid = moiEm(); const [v1] = nVp(sid, 1);
    const r1 = xuLy(gvcn, sid, [v1]);
    const xong = () => tk.yThucMetric(ql, 'bien-phap-da-thuc-hien', { from: TODAY, to: TODAY }).ids as number[];
    assert(xong().includes(r1.id), 'trước: có trong số đã thực hiện');
    xu.thuHoiXuLy(ql, r1.id, { lyDo: 'Ghi nhầm em' });
    const hv = xu.yThucHocVien(ql, sid);
    assert(hv.chuoi.soXuLy === 0 && hv.bac === 0 && hv.coTheKhai === true, `soXuLy ${hv.chuoi.soXuLy} bac ${hv.bac}`);
    assert(!xong().includes(r1.id), 'Phân tích không đếm lần đã thu hồi');
    const dong = hv.dongThoiGian.find((x: any) => x.loai === 'xu-ly' && x.id === r1.id);
    assert(dong && dong.status === 'thu_hoi' && dong.statusLabel === 'Đã thu hồi', 'dòng thời gian giữ dòng: ' + JSON.stringify(dong));
    const r1b = xuLy(gvcn, sid, [v1]);
    assert(r1b.kind === 'report_1' && bac(sid) === 1, 'vi phạm đã thu hồi xử lý lại được, bậc tính lại từ đầu');
  }));

  await checkAsync('L5-8 · chỉ lần mới nhất; có lần sau lúc QL duyệt → 400; QL Huỷ quyết định trong ngày → về như cũ', () => thu(() => {
    const sid = moiEm(); const [v1, v2, v3] = nVp(sid, 3);
    const r1 = xuLy(gvcn, sid, [v1]); const r2 = xuLy(gvcn, sid, [v2]);
    assertThrows(() => xu.thuHoiXuLy(gvcn, r1.id, { lyDo: 'Bấm nhầm' }), /Đã có Report 2 sau lần này/, 'không phải lần mới nhất');
    xu.thuHoiXuLy(gvcn, r2.id, { lyDo: 'Bấm nhầm' });
    const r3 = xuLy(gvcn, sid, [v3]);
    assertThrows(() => yc.duyetYeuCau(ql, theThuHoi(r2.id)[0].id), /Đã có WL 1 sau lần này/, 'có lần sau lúc duyệt');
    assert(trangThai(r2.id) === 'done', 'duyệt hỏng không đổi gì');
    xu.thuHoiXuLy(ql, r3.id, { lyDo: 'Ghi nhầm' });
    yc.duyetYeuCau(ql, theThuHoi(r2.id)[0].id);
    assert(trangThai(r2.id) === 'thu_hoi' && bac(sid) === 1, 'thu hồi r3 rồi r2');
    yc.huyQuyetDinh(ql, theThuHoi(r2.id)[0].id);
    assert(trangThai(r2.id) === 'done' && theThuHoi(r2.id)[0].trang_thai === 'cho' && bac(sid) === 2, 'huỷ quyết định: về Report 2, thẻ về chờ');
    void r1;
  }));

  await checkAsync('L5-9 · không tăng bậc qua "Đề xuất QL duyệt": bậc hiện tại / thấp hơn, tệp tuỳ chọn; duyệt → Đã thực hiện → bậc giữ; bậc cao hơn → 400', () => thu(() => {
    const sid = moiEm(); const [v1, v2, v3, v4] = nVp(sid, 4);
    xuLy(gvcn, sid, [v1]); xuLy(gvcn, sid, [v2]);
    assert(ma(() => xu.deXuat(gvcn, sid, { kind: 'wl_1', violationIds: [v3], note: 'Không tăng bậc nhưng chọn bậc kế' })) === 400, 'bậc kế không phải "không tăng bậc"');
    const nhap = xu.deXuat(gvcn, sid, { kind: 'report_2', violationIds: [v3], note: 'Em tiến bộ, giữ Report 2' });
    const m = xu.guiDeXuat(gvcn, nhap.id);
    assert(m.status === 'cho_duyet', 'gửi được không cần tệp');
    const the = yc.theCuaDoiTuong('discipline_measure', [nhap.id]).find((c: any) => c.loai === 'y_thuc');
    assert(/Không tăng bậc/.test(the.tieuDe) && the.dong.some((d: string) => /WL 1/.test(d)), JSON.stringify({ t: the.tieuDe, d: the.dong }));
    yc.duyetYeuCau(ql, the.id);
    xu.daThucHien(gvcn, nhap.id, { performedOn: TODAY, performerName: 'Cô Thu' });
    const hv = xu.yThucHocVien(ql, sid);
    assert(hv.bac === 2 && hv.keTiep.kind === 'wl_1', `bậc ${hv.bac} kế ${hv.keTiep.kind}`);
    const thap = xu.deXuat(gvcn, sid, { kind: 'report_1', violationIds: [v4], note: 'Nhẹ hơn: Report 1 lặp lại' });
    assert(xu.guiDeXuat(gvcn, thap.id).status === 'cho_duyet', 'bậc thấp hơn');
    const em2 = moiEm(); const [w1] = nVp(em2, 1);
    assert(ma(() => xu.deXuat(gvcn, em2, { kind: 'report_1', violationIds: [w1], note: 'Chưa có bậc nào cả' })) === 400, 'em chưa có bậc: không có "không tăng bậc"');
  }));
}
