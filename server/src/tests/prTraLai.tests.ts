/**
 * PHÉP KIỂM TL-1 (N61, chủ SP 20/11 — trả lại vi phạm, máy chủ), HTTP thật (`createApp().listen`, phiên `POST /demo/session`):
 *  TL-1 quyền (GV · GVCN · Admin · BPXL 403; TVV / TVV cùng chi nhánh / CX / Head 200) + lý do < 8 → 400 · TL-2 việc GV (hạn 3 ngày, /my-work, chuông, theo dõi,
 *  lịch sử) + một yêu cầu mở mỗi vi phạm · TL-3 người ghi đã khoá → GVCN · TL-4 ba lựa chọn (gửi lại sửa NGÀY · giữ nguyên · xoá + Thùng rác) + Thu hồi cả lần ·
 *  TL-5 quyền theo việc (người được giao sửa đúng vi phạm đó) · TL-6 sửa hạn + quá hạn chỉ đỏ · TL-7 Báo PH tạm dừng → tính lại 5 ngày · TL-8 TVV ghi Báo PH
 *  → tự đóng · TL-9 Báo PH đã xong → 400, chưa có xử lý → 200 · TL-10 rút · TL-11 Hoàn tác 60 giây · TL-12 id không dùng lại / không thừa hưởng theo dõi ·
 *  TL-13 xoá HV dọn sạch, khôi phục trả lại · TL-14 migrate hai lần + tự lành.
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrTraLaiTests(t: YThucTestKit) {
  const { checkAsync, check, assert, conn, TODAY, P, classId, addDays } = t as any;
  console.log('\nTL-1 · trả lại vi phạm: quyền · ba lựa chọn · Báo PH tạm dừng · rút · Hoàn tác · /my-work · migrate');

  const intake: any = await import('../classes/intake.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const { loadPrincipal, CHU_CHAN_NHAP_DIEM } = await import('../permissions.ts');
  const { boLichTuTao } = await import('./luotThu.ts');
  const viol: any = await import('../yThuc/violations.ts');
  const xu: any = await import('../yThuc/xuLy.ts');
  const xoaHV: any = await import('../students/xoaHocVien.ts');
  const rac: any = await import('../platform/khoiPhucRac.ts');
  const { myWork } = await import('../worklist/mywork.ts');
  const { xoaNho, voiXacNhan } = await import('../platform/nguCanhRequest.ts');
  const { hanBaoPh, hanTraLai } = await import('../../../shared/domain/index.ts');
  const { createApp } = await import('../app.ts');
  const ph: any = await import('../yThuc/phoiHop.ts');
  const pc: any = await import('../classes/phanCongGv.ts');
  const students: any = await import('../students/students.ts');
  const { LUOT_SAU_THI_SQL } = await import('../students/tamDung.ts');
  const hang = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const mot = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  /* Tệp ĐỘC LẬP (không ở GIU_CHUOI): chạy trên bản chép DB gốc riêng — không bọc ROLLBACK (máy chủ cuộn lại giao dịch bỏ dở ở đầu mỗi request); mỗi phép một em mới. */
  const thu = async (fn: () => Promise<void>) => { try { await fn(); } finally { xoaNho(); } };
  const gvbm = P.w1Teacher; const gvcn = P.coreTeacher; const ql = P.mbManager;
  const lop = classId('MB FT 101');
  let soTk = 0;
  const taiKhoan = (ten: string, role: string, cn = 'MB') => loadPrincipal(accounts.createAccount(P.admin, {
    email: `tralai.${ten}.${++soTk}${accounts.EMAIL_SUFFIX}`, password: `matkhau-tralai-${ten}`, fullName: `TRALAI ${ten.toUpperCase()}`, roles: [{ role, branches: [cn] }],
  }).userId as number);
  const tvv = taiKhoan('tvv', 'consultant'); const tvv2 = taiKhoan('tvv2', 'consultant');
  const admin = taiKhoan('admin', 'office_admin'); const cx = taiKhoan('cx', 'cx'); const bpxl = taiKhoan('bpxl', 'scheduler');
  const gvKhac = taiKhoan('gv', 'teacher');
  let dem = 0;
  const moiEm = (): number => {
    const ten = `TRALAI em ${++dem}-${Math.random().toString(36).slice(2, 6)}`;
    intake.commitIntake(P.admin, { classId: lop, rows: [{ fullName: ten, target: 7, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `tralai-${ten}` } as any);
    const st = mot('SELECT id FROM students WHERE full_name = ?', ten);
    boLichTuTao(conn, mot("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", st.id).id);
    conn.prepare('UPDATE students SET consultant_user_id = ? WHERE id = ?').run(tvv.userId, st.id);
    return st.id as number;
  };
  const viPham = (sid: number, ngay = -1) => viol.recordViolation(gvbm, { studentId: sid, category: 'conduct', ten: 'Nói chuyện riêng trong giờ', occurredOn: addDays(TODAY, ngay) }).violation.id as number;
  /** GVBM ghi `n` vi phạm, GVCN xác nhận xử lý → một lần xử lý + một việc Báo PH. */
  const xuLy = (sid: number, n = 1) => {
    const vids = Array.from({ length: n }, (_, i) => viPham(sid, -1 - i));
    const m = xu.xacNhanXuLy(gvcn, sid, { violationIds: vids, performedOn: TODAY, performerName: null, note: 'Nhắc nhở em sau giờ học, em hứa sửa' });
    return { vids, mid: m.id as number, bp: mot('SELECT id FROM viec_bao_ph WHERE measure_id = ?', m.id).id as number };
  };
  const items = (p: any) => { xoaNho(); return ((myWork(loadPrincipal(p.userId), {}) as any).items ?? []) as any[]; };
  const tin = (khoa: string) => hang(`SELECT user_id FROM notifications WHERE dedup_key = ?`, khoa).map((r) => r.user_id as number);
  const dong = (id: number) => mot('SELECT * FROM vi_pham_tra_lai WHERE id = ?', id);
  const LY_DO = 'Ghi rõ em nói chuyện vào lúc nào trong giờ';

  const may = createApp().listen(0);
  const cong = (may.address() as any).port as number;
  const vao = async (userId: number) => {
    const res = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }) });
    return (res.headers.get('set-cookie') ?? '').split(';')[0];
  };
  const ck = new Map<number, string>();
  for (const p of [tvv, tvv2, admin, cx, bpxl, gvKhac, gvbm, gvcn, ql, P.admin]) ck.set(p.userId, await vao(p.userId));
  const goi = async (p: any, method: string, url: string, body?: unknown) => {
    const res = await fetch(`http://127.0.0.1:${cong}/api${url}`, { method, headers: { 'content-type': 'application/json', cookie: ck.get(p.userId)! }, body: body === undefined ? undefined : JSON.stringify(body) });
    let json: any = null;
    try { json = await res.json(); } catch { /* không thân */ }
    return { status: res.status, json };
  };
  const tra = (p: any, body: Record<string, unknown>) => goi(p, 'POST', '/y-thuc/tra-lai', { lyDo: LY_DO, ...body });

  try {
    await checkAsync('TL-1 · quyền trả lại: GVBM · GVCN · Admin · BPXL → 403; lý do < 8 → 400; TVV của em · TVV cùng chi nhánh · CX · Head → 200', () => thu(async () => {
      const sid = moiEm(); const { vids } = xuLy(sid, 4);
      for (const p of [gvbm, gvcn, admin, bpxl]) {
        const r = await tra(p, { violationId: vids[0] });
        assert(r.status === 403, `${p.fullName}: ${r.status} ${r.json?.error}`);
      }
      const ngan = await tra(tvv, { violationId: vids[0], lyDo: 'ngắn' });
      assert(ngan.status === 400 && /8 ký tự/.test(ngan.json?.error ?? ''), `lý do ngắn: ${ngan.status} ${ngan.json?.error}`);
      for (const [i, p] of [tvv, tvv2, cx, ql].entries()) {
        const r = await tra(p, { violationId: vids[i] });
        assert(r.status === 200 && r.json.trangThai === 'mo', `${p.fullName}: ${r.status} ${r.json?.error}`);
      }
      assert((await tra(tvv, {})).status === 400 && (await tra(tvv, { violationId: vids[0], measureId: 1 })).status === 400, 'đúng một trong hai đích');
    }));

    await checkAsync('TL-2 · trả một vi phạm → về người ghi: hạn 3 ngày, /my-work GVBM nhóm yt_tra_lai, chuông đúng người, theo dõi TVV + GVCN, lịch sử; một yêu cầu mở mỗi vi phạm', () => thu(async () => {
      const sid = moiEm(); const { vids, bp } = xuLy(sid);
      const r = await tra(tvv, { violationId: vids[0] });
      assert(r.status === 200, `${r.status} ${r.json?.error}`);
      const id = r.json.id as number; const d = dong(id);
      assert(d.nguoi_nhan === gvbm.userId && d.han === hanTraLai(TODAY) && d.han === addDays(TODAY, 2), `người nhận / hạn: ${JSON.stringify(d)}`);
      assert(mot('SELECT tra_lai_id FROM viec_bao_ph WHERE id = ?', bp).tra_lai_id === id, 'Báo PH "Chờ GV sửa"');
      const it = items(gvbm).find((x) => x.key === `yt_tra_lai:${id}`);
      assert(it && it.mine && it.group === 'yt_tra_lai' && it.due === d.han && it.urgency === 'normal' && /TRALAI TVV trả lại/.test(it.reason), `việc GVBM: ${JSON.stringify(it)}`);
      assert(!items(gvcn).some((x) => x.key === `yt_tra_lai:${id}`), 'GVCN (người theo dõi) không có việc');
      assert(JSON.stringify(tin(`tra-lai:${id}`)) === JSON.stringify([gvbm.userId]), `chuông: ${JSON.stringify(tin(`tra-lai:${id}`))}`);
      const td = hang(`SELECT user_id, nguon FROM viec_theo_doi WHERE loai = 'tra_lai' AND ref_id = ? ORDER BY user_id`, id);
      assert(td.some((x) => x.user_id === tvv.userId && x.nguon === 'tay') && td.some((x) => x.user_id === gvcn.userId && x.nguon === 'gvcn') && td.length === 2, `theo dõi: ${JSON.stringify(td)}`);
      assert(mot(`SELECT new_value FROM violation_history WHERE violation_id = ? AND field = 'tra_lai'`, vids[0])?.new_value === LY_DO, 'lịch sử vi phạm');
      const lai = await tra(tvv, { violationId: vids[0] });
      assert(lai.status === 200 && lai.json.id === id, 'bấm hai lần → cùng yêu cầu');
      const khac = await tra(tvv, { violationId: vids[0], lyDo: 'Một lý do khác hẳn lý do trước' });
      assert(khac.status === 409, `yêu cầu thứ hai khi đang mở: ${khac.status}`);
      const xem = await goi(gvbm, 'GET', `/y-thuc/tra-lai/${id}`);
      assert(xem.status === 200 && xem.json.coTheLam && xem.json.coTheXoa && !xem.json.coTheRut && xem.json.viPham.length === 1, `GVBM xem: ${JSON.stringify(xem.json)}`);
      const kv = await goi(gvbm, 'GET', `/giao-viec/tra_lai/${id}`);
      assert(kv.status === 200 && kv.json.han === d.han && kv.json.phuTrach[0].id === gvbm.userId && kv.json.coTheSuaHan, `khối giao việc: ${JSON.stringify(kv.json)}`);
    }));

    await checkAsync('TL-3 · người ghi đã khoá → về GVCN; cả lần xử lý → về GVCN', () => thu(async () => {
      const sid = moiEm(); const { vids, mid } = xuLy(sid, 2);
      conn.prepare(`UPDATE users SET status = 'disabled' WHERE id = ?`).run(gvbm.userId);
      const r = await tra(tvv, { violationId: vids[0] });
      conn.prepare(`UPDATE users SET status = 'active' WHERE id = ?`).run(gvbm.userId);
      assert(r.status === 200 && dong(r.json.id).nguoi_nhan === gvcn.userId, `người ghi khoá: ${r.status} ${JSON.stringify(dong(r.json?.id))}`);
      const c = await tra(tvv, { measureId: mid });
      assert(c.status === 200 && dong(c.json.id).nguoi_nhan === gvcn.userId && c.json.measureId === mid && c.json.viPham.length === 2, `cả lần: ${c.status} ${c.json?.error}`);
      assert(!hang(`SELECT 1 FROM viec_theo_doi WHERE loai = 'tra_lai' AND ref_id = ? AND nguon = 'gvcn'`, c.json.id).length, 'người nhận là GVCN: không thêm GVCN theo dõi');
      assert(items(gvcn).some((x) => x.key === `yt_tra_lai:${c.json.id}` && x.tieuDe.startsWith('Lần xử lý bị trả lại')), 'việc GVCN');
    }));

    await checkAsync('TL-4 · GV: Sửa rồi gửi lại (sửa NGÀY, lịch sử) · Giữ nguyên + trả lời ≥ 8 · Xoá vi phạm (Thùng rác, khôi phục) · cả lần: Thu hồi', () => thu(async () => {
      const sid = moiEm(); const { vids, mid } = xuLy(sid, 3);
      const a = (await tra(tvv, { violationId: vids[0] })).json.id;
      const g = await goi(gvbm, 'POST', `/y-thuc/tra-lai/${a}/gui-lai`, { sua: { occurredOn: addDays(TODAY, -3), description: 'Nói chuyện riêng lúc cô giảng bài phần 2' } });
      assert(g.status === 200 && g.json.ketQua === 'da_sua', `gửi lại: ${g.status} ${g.json?.error}`);
      assert(mot('SELECT occurred_on FROM violations WHERE id = ?', vids[0]).occurred_on === addDays(TODAY, -3), 'NGÀY đã sửa');
      assert(mot(`SELECT 1 FROM violation_history WHERE violation_id = ? AND field = 'occurred_on'`, vids[0]) && mot(`SELECT 1 FROM violation_history WHERE violation_id = ? AND field = 'tra_lai_da_sua'`, vids[0]), 'lịch sử');
      assert(JSON.stringify(tin(`tra-lai-kq:${a}`)) === JSON.stringify([tvv.userId]), `TVV nhận "GV đã sửa": ${JSON.stringify(tin(`tra-lai-kq:${a}`))}`);
      assert((await goi(gvbm, 'POST', `/y-thuc/tra-lai/${a}/gui-lai`, {})).status === 409, 'đã xong → 409');
      const b = (await tra(tvv, { violationId: vids[1] })).json.id;
      assert((await goi(gvbm, 'POST', `/y-thuc/tra-lai/${b}/giu-nguyen`, { traLoi: 'ngắn' })).status === 400, 'trả lời < 8 → 400');
      const gn = await goi(gvbm, 'POST', `/y-thuc/tra-lai/${b}/giu-nguyen`, { traLoi: 'Em nói chuyện cả buổi, cô đã nhắc ba lần' });
      assert(gn.status === 200 && gn.json.ketQua === 'giu_nguyen' && dong(b).tra_loi === 'Em nói chuyện cả buổi, cô đã nhắc ba lần', `giữ nguyên: ${gn.status} ${gn.json?.error}`);
      const c = (await tra(tvv, { violationId: vids[2] })).json.id;
      const x = await goi(gvbm, 'DELETE', `/violations/${vids[2]}`);
      assert(x.status === 200 && !dong(c) && !mot('SELECT 1 FROM violations WHERE id = ?', vids[2]), `xoá: ${x.status} ${x.json?.error}`);
      assert(JSON.stringify(tin(`tra-lai-kq:${c}`)) === JSON.stringify([tvv.userId]), 'TVV nhận "GV đã xoá"');
      rac.khoiPhucRac(P.admin, x.json.thungRacId);
      /* P1-03 (AUDIT-2111): khôi phục trả yêu cầu về đúng lúc trước khi xoá — còn "mở", GV làm tiếp được. */
      assert(dong(c)?.trang_thai === 'mo' && dong(c).ket_qua === null, `khôi phục: ${JSON.stringify(dong(c))}`);
      const m = (await tra(tvv, { measureId: mid })).json.id;
      const th = await goi(gvcn, 'POST', `/discipline-measures/${mid}/thu-hoi`, { lyDo: 'TVV báo bậc chưa hợp lý, thu hồi để xét lại' });
      assert(th.status === 200 && dong(m).trang_thai === 'mo', `GVCN gửi thu hồi chờ Head duyệt → yêu cầu còn mở (PTA chốt): ${th.status} ${th.json?.error} ${JSON.stringify(dong(m))}`);
      const sid2 = moiEm(); const x2 = xuLy(sid2);
      const m2 = (await tra(tvv, { measureId: x2.mid })).json.id;
      const th2 = await goi(ql, 'POST', `/discipline-measures/${x2.mid}/thu-hoi`, { lyDo: 'TVV báo bậc chưa hợp lý, Head thu hồi thẳng' });
      assert(th2.status === 200 && dong(m2).ket_qua === 'thu_hoi', `Head thu hồi chốt → đóng: ${th2.status} ${th2.json?.error} ${JSON.stringify(dong(m2))}`);
    }));

    await checkAsync('TL-5 · quyền theo việc: người được giao sửa / xoá đúng vi phạm đó, vi phạm khác 403, đóng xong 403', () => thu(async () => {
      const sid = moiEm(); const { vids } = xuLy(sid, 2);
      const id = (await tra(tvv, { violationId: vids[0] })).json.id;
      const sua = { ten: 'Nói chuyện riêng trong giờ học' };
      assert((await goi(gvKhac, 'PATCH', `/violations/${vids[0]}`, sua)).status === 403, 'chưa được giao → 403');
      const gi = await goi(gvbm, 'POST', `/giao-viec/tra_lai/${id}/phu-trach`, { userId: gvKhac.userId, phuTrachCu: null });
      assert(gi.status === 200 && gi.json.phuTrach[0].id === gvKhac.userId, `giao: ${gi.status} ${gi.json?.error}`);
      assert(items(gvKhac).some((x) => x.key === `yt_tra_lai:${id}` && x.giaoBoi) && !items(gvbm).some((x) => x.key === `yt_tra_lai:${id}`), 'việc sang người được giao');
      assert((await goi(gvKhac, 'PATCH', `/violations/${vids[0]}`, sua)).status === 200, 'người được giao sửa được');
      assert((await goi(gvKhac, 'PATCH', `/violations/${vids[1]}`, sua)).status === 403, 'vi phạm khác → 403');
      assert((await goi(gvbm, 'POST', `/y-thuc/tra-lai/${id}/giu-nguyen`, { traLoi: 'Em nói chuyện cả buổi, cô đã nhắc ba lần' })).status === 403, 'người nhận cũ (đã giao đi) → 403');
      assert((await goi(gvKhac, 'POST', `/y-thuc/tra-lai/${id}/gui-lai`, {})).status === 200, 'người được giao gửi lại');
      assert((await goi(gvKhac, 'PATCH', `/violations/${vids[0]}`, { ten: 'Nói chuyện riêng' })).status === 403, 'đã xong → hết quyền theo việc');
    }));

    await checkAsync('TL-6 · sửa hạn: người nhận · người trả · GVCN được, TVV khác 403; quá hạn chỉ đỏ (urgency overdue, việc vẫn mở)', () => thu(async () => {
      const sid = moiEm(); const { vids } = xuLy(sid);
      const id = (await tra(tvv, { violationId: vids[0] })).json.id;
      const h1 = await goi(gvbm, 'POST', `/giao-viec/tra_lai/${id}/han`, { han: addDays(TODAY, 5), hanCu: null });
      assert(h1.status === 200 && h1.json.han === addDays(TODAY, 5) && h1.json.hanMacDinh === addDays(TODAY, 2), `người nhận: ${h1.status} ${h1.json?.error}`);
      assert((await goi(tvv, 'POST', `/giao-viec/tra_lai/${id}/han`, { han: addDays(TODAY, 6), hanCu: addDays(TODAY, 5) })).status === 200, 'người trả');
      assert((await goi(gvcn, 'POST', `/giao-viec/tra_lai/${id}/han`, { han: null, hanCu: addDays(TODAY, 6) })).status === 200 && dong(id).han_chon === null, 'GVCN về mặc định');
      assert((await goi(tvv2, 'POST', `/giao-viec/tra_lai/${id}/han`, { han: addDays(TODAY, 4), hanCu: null })).status === 403, 'TVV khác 403');
      assert((await goi(gvbm, 'POST', `/giao-viec/tra_lai/${id}/han`, { han: addDays(TODAY, 4), hanCu: addDays(TODAY, 9) })).status === 409, 'hanCu cũ → 409');
      assert(hang(`SELECT 1 FROM viec_han_lan WHERE loai = 'tra_lai' AND viec_id = ?`, id).length === 3, 'lịch sử hạn');
      conn.prepare('UPDATE vi_pham_tra_lai SET han = ? WHERE id = ?').run(addDays(TODAY, -1), id);
      const it = items(gvbm).find((x) => x.key === `yt_tra_lai:${id}`);
      assert(it?.urgency === 'overdue' && dong(id).trang_thai === 'mo', 'quá hạn: đỏ, máy không làm gì');
    }));

    await checkAsync('TL-7 · Báo PH tạm dừng (không quá hạn ở /my-work + panel) → GV giữ nguyên → hạn tính lại 5 ngày từ hôm nay, viec_han_lan', () => thu(async () => {
      const sid = moiEm(); const { vids, bp } = xuLy(sid);
      conn.prepare('UPDATE viec_bao_ph SET han = ? WHERE id = ?').run(addDays(TODAY, -2), bp);   // Báo PH đã quá hạn trước khi trả
      const id = (await tra(tvv, { violationId: vids[0] })).json.id;
      const it = items(tvv).find((x) => x.key === `bao-ph:${bp}`);
      assert(it && it.urgency === 'normal' && it.choGvSua === true && it.statusLabel === 'Chờ GV sửa', `/my-work TVV: ${JSON.stringify(it)}`);
      const pn = await goi(tvv, 'GET', `/y-thuc/bao-ph/${bp}`);
      assert(pn.status === 200 && pn.json.quaHan === false && pn.json.choGvSua && pn.json.traLai.length === 1 && pn.json.traLai[0].id === id && pn.json.nhanTrangThai === 'Chờ GV sửa', `panel: ${JSON.stringify(pn.json)}`);
      await goi(gvbm, 'POST', `/y-thuc/tra-lai/${id}/giu-nguyen`, { traLoi: 'Em nói chuyện cả buổi, cô đã nhắc ba lần' });
      const b = mot('SELECT tra_lai_id, han_chon FROM viec_bao_ph WHERE id = ?', bp);
      assert(b.tra_lai_id === null && b.han_chon === hanBaoPh(TODAY), `tính lại: ${JSON.stringify(b)}`);
      assert(mot(`SELECT han_moi FROM viec_han_lan WHERE loai = 'bao_ph' AND viec_id = ? ORDER BY id DESC LIMIT 1`, bp)?.han_moi === hanBaoPh(TODAY), 'lịch sử hạn Báo PH');
      const sau = items(tvv).find((x) => x.key === `bao-ph:${bp}`);
      assert(sau && !sau.choGvSua && sau.due === hanBaoPh(TODAY) && sau.urgency !== 'overdue', `sau: ${JSON.stringify(sau)}`);
    }));

    await checkAsync('TL-8 · TVV ghi "Đã báo PH" khi đang chờ GV sửa → yêu cầu tự đóng "TVV đã báo PH", GV nhận tin; "Chưa liên hệ được" không đóng', () => thu(async () => {
      const sid = moiEm(); const { vids, bp } = xuLy(sid);
      const id = (await tra(tvv, { violationId: vids[0] })).json.id;
      const c = await goi(tvv, 'POST', '/y-thuc/bao-ph/ghi', { viecIds: [bp], ketQua: 'chua_lien_he', ghiChu: 'Gọi mẹ em hai lần không nghe máy' });
      assert(c.status === 200 && dong(id).trang_thai === 'mo', `chưa liên hệ: ${c.status} ${c.json?.error}`);
      const r = await goi(tvv, 'POST', '/y-thuc/bao-ph/ghi', { viecIds: [bp], ketQua: 'da_bao', ghiChu: 'Đã gọi mẹ em, mẹ hứa nhắc em' });
      assert(r.status === 200 && dong(id).trang_thai === 'xong' && dong(id).ket_qua === 'tvv_da_bao', `đã báo: ${r.status} ${r.json?.error} ${JSON.stringify(dong(id))}`);
      assert(JSON.stringify(tin(`tra-lai-kq:${id}`)) === JSON.stringify([gvbm.userId]), `GV nhận tin: ${JSON.stringify(tin(`tra-lai-kq:${id}`))}`);
      assert(!items(gvbm).some((x) => x.key === `yt_tra_lai:${id}`), 'việc GV rời /my-work');
    }));

    await checkAsync('TL-9 · Báo PH đã xong / đã bỏ → không trả lại (400); vi phạm chưa có lần xử lý → trả được', () => thu(async () => {
      const sid = moiEm(); const { vids, mid, bp } = xuLy(sid);
      await goi(tvv, 'POST', '/y-thuc/bao-ph/ghi', { viecIds: [bp], ketQua: 'da_bao', ghiChu: 'Đã gọi mẹ em, mẹ hứa nhắc em' });
      const a = await tra(tvv, { violationId: vids[0] }); const b = await tra(tvv, { measureId: mid });
      assert(a.status === 400 && b.status === 400 && /đã xong hoặc đã bỏ/.test(a.json?.error ?? ''), `${a.status} ${b.status} ${a.json?.error}`);
      const le = viPham(sid);
      const c = await tra(tvv, { violationId: le });
      assert(c.status === 200 && dong(c.json.id).nguoi_nhan === gvbm.userId, `chưa có xử lý: ${c.status} ${c.json?.error}`);
    }));

    await checkAsync('TL-10 · rút: TVV rút khi GV chưa xử lý (GV nhận tin, việc rời /my-work, Báo PH hết dừng); GV rút 403; sau rút GV xử lý 400; trả lại lần nữa được', () => thu(async () => {
      const sid = moiEm(); const { vids, bp } = xuLy(sid);
      conn.prepare('UPDATE viec_bao_ph SET han = ? WHERE id = ?').run(addDays(TODAY, -2), bp);
      const id = (await tra(tvv, { violationId: vids[0] })).json.id;
      assert((await goi(gvbm, 'POST', `/y-thuc/tra-lai/${id}/rut`)).status === 403, 'GV rút → 403');
      const r = await goi(tvv2, 'POST', `/y-thuc/tra-lai/${id}/rut`);
      assert(r.status === 200 && r.json.trangThai === 'rut' && mot('SELECT tra_lai_id FROM viec_bao_ph WHERE id = ?', bp).tra_lai_id === null, `rút: ${r.status} ${r.json?.error}`);
      assert(mot('SELECT han_chon FROM viec_bao_ph WHERE id = ?', bp).han_chon === null && items(tvv).find((x) => x.key === `bao-ph:${bp}`)?.urgency === 'overdue',
        'PTA chốt: rút KHÔNG tính lại hạn Báo PH (chỉ gỡ tạm dừng — quá hạn như cũ)');
      assert(tin(`tra-lai-kq:${id}`).includes(gvbm.userId) && !items(gvbm).some((x) => x.key === `yt_tra_lai:${id}`), 'GV nhận tin rút, việc rời');
      assert(mot(`SELECT 1 FROM violation_history WHERE violation_id = ? AND field = 'tra_lai_rut'`, vids[0]), 'lịch sử rút');
      assert((await goi(gvbm, 'POST', `/y-thuc/tra-lai/${id}/giu-nguyen`, { traLoi: 'Em nói chuyện cả buổi, cô đã nhắc ba lần' })).status === 409, 'rút trước, GV trả lời sau → 409');
      assert((await goi(tvv, 'POST', `/y-thuc/tra-lai/${id}/rut`)).status === 409, 'rút lần hai → 409');
      assert((await tra(tvv, { violationId: vids[0] })).status === 200, 'trả lại lần nữa');
    }));

    await checkAsync('TL-11 · Hoàn tác 60 giây: người trả, xoá hẳn (tin, lịch sử, theo dõi, Báo PH hết dừng, hạn giữ); người khác 403 / quá 60 giây → 400', () => thu(async () => {
      const sid = moiEm(); const { vids, bp } = xuLy(sid, 2);
      const hanTruoc = mot('SELECT han, han_chon FROM viec_bao_ph WHERE id = ?', bp);
      const id = (await tra(tvv, { violationId: vids[0] })).json.id;
      const khac = await goi(tvv2, 'POST', `/y-thuc/tra-lai/${id}/hoan-tac`);   // AU-2111 B1-07: nói đúng lý do
      assert(khac.status === 403 && khac.json?.error === 'Chỉ người trả lại hoàn tác được — dùng Rút yêu cầu.', `người khác: ${khac.status} ${khac.json?.error}`);
      const h = await goi(tvv, 'POST', `/y-thuc/tra-lai/${id}/hoan-tac`);
      assert(h.status === 200 && !dong(id) && !tin(`tra-lai:${id}`).length && !mot(`SELECT 1 FROM violation_history WHERE reason = ?`, `tra_lai:${id}`)
        && !hang(`SELECT 1 FROM viec_theo_doi WHERE loai = 'tra_lai' AND ref_id = ?`, id).length, `hoàn tác: ${h.status} ${h.json?.error}`);
      const b = mot('SELECT han, han_chon, tra_lai_id FROM viec_bao_ph WHERE id = ?', bp);
      assert(b.tra_lai_id === null && b.han === hanTruoc.han && b.han_chon === hanTruoc.han_chon, 'Báo PH như cũ');
      const id2 = (await tra(tvv, { violationId: vids[1] })).json.id;
      conn.prepare('UPDATE vi_pham_tra_lai SET tra_luc = ? WHERE id = ?').run(new Date(Date.now() - 61_000).toISOString(), id2);
      assert((await goi(tvv, 'POST', `/y-thuc/tra-lai/${id2}/hoan-tac`)).status === 400, 'quá 60 giây → 400');
    }));

    await checkAsync('TL-12 · id không dùng lại (AUTOINCREMENT): Hoàn tác yêu cầu mới nhất, trả tiếp → id mới, không thừa hưởng người theo dõi', () => thu(async () => {
      const sid = moiEm(); const { vids } = xuLy(sid, 2);
      const a = (await tra(tvv, { violationId: vids[0] })).json.id;
      conn.prepare(`INSERT INTO viec_theo_doi (loai, ref_id, user_id, nguon, luc) VALUES ('tra_lai', ?, ?, 'tay', ?)`).run(a, admin.userId, new Date().toISOString());
      await goi(tvv, 'POST', `/y-thuc/tra-lai/${a}/hoan-tac`);
      const b = (await tra(tvv, { violationId: vids[1] })).json.id;
      assert(b > a && !hang(`SELECT 1 FROM viec_theo_doi WHERE loai = 'tra_lai' AND ref_id = ? AND user_id = ?`, b, admin.userId).length, `id ${a} → ${b}`);
    }));

    await checkAsync('TL-13 · xoá HV: yêu cầu + người theo dõi dọn sạch; khôi phục Thùng rác trả lại đủ', () => thu(async () => {
      const sid = moiEm(); const { vids } = xuLy(sid);
      const id = (await tra(tvv, { violationId: vids[0] })).json.id;
      const x = xoaHV.xoaHocVien(P.admin, sid, { maXacNhan: mot('SELECT student_code FROM students WHERE id = ?', sid).student_code });
      assert(!dong(id) && !hang(`SELECT 1 FROM viec_theo_doi WHERE loai = 'tra_lai' AND ref_id = ?`, id).length, 'xoá HV dọn');
      rac.khoiPhucRac(P.admin, x.thungRacId);
      assert(dong(id)?.trang_thai === 'mo' && hang(`SELECT 1 FROM viec_theo_doi WHERE loai = 'tra_lai' AND ref_id = ?`, id).length === 2, 'khôi phục đủ');
    }));

    /** Meeting CX đã xác nhận của em (hai phần, người theo dõi tvv / gvcn / head) — như GV-1. */
    const meeting = (sid: number) => {
      const att = mot(`SELECT a.id FROM assessment_attempts a WHERE a.status != 'cancelled' AND NOT EXISTS (SELECT 1 FROM sos_coordination_actions x WHERE x.attempt_id = a.id AND x.kind = 'cx_meeting_student')
          AND NOT ${LUOT_SAU_THI_SQL('a')} LIMIT 1`).id;
      const aid = Number(conn.prepare(`INSERT INTO sos_coordination_actions (attempt_id, student_id, kind, preset, status, created_at) VALUES (?, ?, 'cx_meeting_student', 1, 'pending', ?)`)
        .run(att, sid, new Date().toISOString()).lastInsertRowid);
      ph.confirmCoordination(gvcn, aid, { performedOn: TODAY, note: 'Cần họp CX với em' });
      return hang('SELECT id FROM meeting_phan WHERE phoi_hop_id = ?', aid).map((r) => r.id as number);
    };
    const theoDoi = (loai: string, id: number) => hang('SELECT user_id, nguon FROM viec_theo_doi WHERE loai = ? AND ref_id = ? ORDER BY user_id', loai, id);

    await checkAsync('TL-25 · (AUDIT-2111 P1-03) xoá vi phạm đang bị trả lại → Hoàn tác: yêu cầu "mở" lại, việc GV trở lại, người theo dõi + mô tả còn, Báo PH "Chờ GV sửa" + hạn như trước, TVV nhận tin "GV đã hoàn tác xoá"', () => thu(async () => {
      const sid = moiEm(); const { vids, bp } = xuLy(sid);
      conn.prepare('UPDATE viec_bao_ph SET han = ? WHERE id = ?').run(addDays(TODAY, -2), bp);   // đã quá hạn → đóng sẽ tính lại hạn
      const id = (await tra(tvv, { violationId: vids[0] })).json.id;
      conn.prepare(`INSERT INTO viec_theo_doi (loai, ref_id, user_id, nguon, luc) VALUES ('tra_lai', ?, ?, 'tay', ?)`).run(id, admin.userId, new Date().toISOString());
      conn.prepare(`INSERT INTO viec_mo_ta (loai, ref_id, noi_dung, sua_boi, sua_luc) VALUES ('tra_lai', ?, 'Mô tả việc trả lại', ?, ?)`).run(id, tvv.userId, new Date().toISOString());
      const td = JSON.stringify(theoDoi('tra_lai', id));
      const x = await goi(gvbm, 'DELETE', `/violations/${vids[0]}`);
      assert(x.status === 200 && !dong(id), `xoá: ${x.status} ${x.json?.error}`);
      const giua = mot('SELECT tra_lai_id, han_chon FROM viec_bao_ph WHERE id = ?', bp);
      assert(giua.tra_lai_id === null && giua.han_chon === hanBaoPh(TODAY), `lúc xoá: Báo PH hết dừng, hạn tính lại: ${JSON.stringify(giua)}`);
      const k = await goi(gvbm, 'POST', `/thung-rac/${x.json.thungRacId}/khoi-phuc`);
      assert(k.status === 200, `Hoàn tác: ${k.status} ${k.json?.error}`);
      assert(dong(id)?.trang_thai === 'mo' && dong(id).ket_qua === null && dong(id).xong_luc === null, `yêu cầu mở lại: ${JSON.stringify(dong(id))}`);
      assert(items(gvbm).some((i) => i.key === `yt_tra_lai:${id}`), 'việc GV trở lại Công việc');
      assert(JSON.stringify(theoDoi('tra_lai', id)) === td && mot(`SELECT noi_dung FROM viec_mo_ta WHERE loai = 'tra_lai' AND ref_id = ?`, id)?.noi_dung === 'Mô tả việc trả lại',
        `người theo dõi + mô tả còn: ${JSON.stringify(theoDoi('tra_lai', id))}`);
      const sau = mot('SELECT tra_lai_id, han_chon FROM viec_bao_ph WHERE id = ?', bp);
      assert(sau.tra_lai_id === id && sau.han_chon === null && !mot(`SELECT 1 FROM viec_han_lan WHERE loai = 'bao_ph' AND viec_id = ?`, bp), `Báo PH "Chờ GV sửa", hạn như trước: ${JSON.stringify(sau)}`);
      const kp = hang(`SELECT user_id, title FROM notifications WHERE dedup_key = ?`, `tra-lai-kp:${id}:${x.json.thungRacId}`);
      assert(kp.length === 1 && kp[0].user_id === tvv.userId && /^GV đã hoàn tác xoá · /.test(kp[0].title), `tin TVV: ${JSON.stringify(kp)}`);
      /* Vi phạm chưa có lần xử lý (không Báo PH): xoá → khôi phục → yêu cầu mở lại. */
      const le = viPham(sid);
      const id2 = (await tra(tvv, { violationId: le })).json.id;
      const x2 = await goi(gvbm, 'DELETE', `/violations/${le}`);
      assert(x2.status === 200 && (await goi(gvbm, 'POST', `/thung-rac/${x2.json.thungRacId}/khoi-phuc`)).status === 200 && dong(id2)?.trang_thai === 'mo', 'vi phạm lẻ: yêu cầu mở lại');
    }));

    await checkAsync('TL-28 · (rà PTA #1954 ①) xoá vi phạm bị trả lại → TVV đã đọc tin "GV đã xoá" → khôi phục: tin đó gỡ; GV gửi lại → TVV có tin "GV đã sửa" CHƯA đọc', () => thu(async () => {
      const sid = moiEm(); const { vids } = xuLy(sid, 2);
      const id = (await tra(tvv, { violationId: vids[0] })).json.id;
      const x = await goi(gvbm, 'DELETE', `/violations/${vids[0]}`);
      assert(tin(`tra-lai-kq:${id}`).length === 1, 'TVV có tin "GV đã xoá vi phạm"');
      conn.prepare('UPDATE notifications SET read_at = ? WHERE dedup_key = ?').run(new Date().toISOString(), `tra-lai-kq:${id}`);
      assert((await goi(gvbm, 'POST', `/thung-rac/${x.json.thungRacId}/khoi-phuc`)).status === 200, 'khôi phục');
      assert(!tin(`tra-lai-kq:${id}`).length && !mot(`SELECT 1 FROM notifications WHERE dedup_key >= ? AND dedup_key < ?`, `gv:tra_lai:${id}:ket_qua:`, `gv:tra_lai:${id}:ket_qua;`),
        'tin kết quả "GV đã xoá" (TVV + người theo dõi) gỡ');
      assert((await goi(gvbm, 'POST', `/y-thuc/tra-lai/${id}/gui-lai`, {})).status === 200, 'GV gửi lại');
      const t = mot('SELECT title, read_at FROM notifications WHERE dedup_key = ? AND user_id = ?', `tra-lai-kq:${id}`, tvv.userId);
      assert(t && t.read_at === null && /^GV đã sửa/.test(t.title), `tin mới chưa đọc: ${JSON.stringify(t)}`);
    }));

    await checkAsync('TL-29 · (rà PTA #1954 ②, N61) vi phạm ở Thùng rác, TVV báo PH xong → khôi phục: yêu cầu đóng "TVV đã báo PH" (không mở lại), GV không còn việc', () => thu(async () => {
      const sid = moiEm(); const { vids, bp } = xuLy(sid, 2);
      const id = (await tra(tvv, { violationId: vids[0] })).json.id;
      const x = await goi(gvbm, 'DELETE', `/violations/${vids[0]}`);
      const b = await goi(tvv, 'POST', '/y-thuc/bao-ph/ghi', { viecIds: [bp], ketQua: 'da_bao', ghiChu: 'Đã gọi mẹ em, mẹ hứa nhắc em' });
      assert(b.status === 200 && mot('SELECT trang_thai FROM viec_bao_ph WHERE id = ?', bp).trang_thai === 'xong', `TVV báo PH xong: ${b.status} ${b.json?.error}`);
      assert((await goi(gvbm, 'POST', `/thung-rac/${x.json.thungRacId}/khoi-phuc`)).status === 200, 'khôi phục');
      assert(dong(id)?.trang_thai === 'xong' && dong(id).ket_qua === 'tvv_da_bao', `đóng TVV đã báo PH: ${JSON.stringify(dong(id))}`);
      assert(!items(gvbm).some((i) => i.key === `yt_tra_lai:${id}`) && !hang('SELECT 1 FROM notifications WHERE dedup_key LIKE ?', `tra-lai-kp:${id}:%`).length, 'GV không còn việc, TVV không tin "hoàn tác xoá"');
    }));

    await checkAsync('TL-26 · (AUDIT-2111 B1-11) GV "Sửa rồi gửi lại" / "Giữ nguyên" → Hoàn tác 60 giây: yêu cầu "mở", vi phạm như trước khi sửa, Báo PH dừng lại, tin TVV gỡ; người khác / quá 60 giây → 400', () => thu(async () => {
      const sid = moiEm(); const { vids, bp } = xuLy(sid, 2);
      conn.prepare('UPDATE viec_bao_ph SET han = ? WHERE id = ?').run(addDays(TODAY, -2), bp);
      const ngayCu = mot('SELECT occurred_on FROM violations WHERE id = ?', vids[0]).occurred_on;
      const a = (await tra(tvv, { violationId: vids[0] })).json.id;
      const ls = hang('SELECT id FROM violation_history WHERE violation_id = ?', vids[0]).length;
      const g = await goi(gvbm, 'POST', `/y-thuc/tra-lai/${a}/gui-lai`, { sua: { occurredOn: addDays(TODAY, -4) } });
      assert(g.status === 200 && g.json.hoanTacDuoc === true && tin(`tra-lai-kq:${a}`).length === 1, `gửi lại: ${g.status} ${JSON.stringify(g.json)}`);
      assert((await goi(gvcn, 'POST', `/y-thuc/tra-lai/${a}/hoan-tac`)).status === 400, 'người khác Hoàn tác → 400');
      const h = await goi(gvbm, 'POST', `/y-thuc/tra-lai/${a}/hoan-tac`);
      assert(h.status === 200, `Hoàn tác: ${h.status} ${h.json?.error}`);
      assert(dong(a).trang_thai === 'mo' && dong(a).ket_qua === null && mot('SELECT occurred_on FROM violations WHERE id = ?', vids[0]).occurred_on === ngayCu,
        `về như trước: ${JSON.stringify(dong(a))}`);
      assert(hang('SELECT id FROM violation_history WHERE violation_id = ?', vids[0]).length === ls && !tin(`tra-lai-kq:${a}`).length, 'lịch sử sửa + tin TVV gỡ');
      const b = mot('SELECT tra_lai_id, han_chon FROM viec_bao_ph WHERE id = ?', bp);
      assert(b.tra_lai_id === a && b.han_chon === null && !mot(`SELECT 1 FROM viec_han_lan WHERE loai = 'bao_ph' AND viec_id = ?`, bp), `Báo PH dừng lại, hạn như cũ: ${JSON.stringify(b)}`);
      assert(items(gvbm).some((i) => i.key === `yt_tra_lai:${a}`), 'việc GV trở lại');
      const gn = await goi(gvbm, 'POST', `/y-thuc/tra-lai/${a}/giu-nguyen`, { traLoi: 'Em nói chuyện cả buổi, cô đã nhắc ba lần' });
      assert(gn.status === 200 && gn.json.ketQua === 'giu_nguyen', `giữ nguyên sau Hoàn tác: ${gn.status} ${gn.json?.error}`);
      /* Rà PTA #1954 (3): TVV trả lại lần nữa (yêu cầu mới mở) → Hoàn tác lần cũ 409, không hai yêu cầu cùng mở. */
      const moi = (await tra(tvv, { violationId: vids[0] })).json.id;
      const h2 = await goi(gvbm, 'POST', `/y-thuc/tra-lai/${a}/hoan-tac`);
      assert(h2.status === 409 && /trả lại lần nữa/.test(h2.json?.error ?? '') && dong(a).trang_thai === 'xong' && dong(moi).trang_thai === 'mo', `yêu cầu mới đang mở: ${h2.status} ${h2.json?.error}`);
      await goi(tvv, 'POST', `/y-thuc/tra-lai/${moi}/hoan-tac`);
      conn.prepare('UPDATE vi_pham_tra_lai SET xong_luc = ? WHERE id = ?').run(new Date(Date.now() - 61_000).toISOString(), a);
      assert((await goi(gvbm, 'POST', `/y-thuc/tra-lai/${a}/hoan-tac`)).status === 400 && dong(a).trang_thai === 'xong', 'quá 60 giây → 400');
    }));

    await checkAsync('TL-27 · (AUDIT-2111 P1-04) xoá HV → việc mới nhận lại id cũ → khôi phục HV: người theo dõi / lịch sử giao / hạn / mô tả / bản đảo đi theo id MỚI, không dính sang việc của em khác', () => thu(async () => {
      const a = moiEm(); const xa = xuLy(a);
      assert(mot('SELECT MAX(id) AS m FROM viec_bao_ph').m === xa.bp, 'Báo PH của em A là id lớn nhất (id sẽ được dùng lại)');
      const gi = await goi(ql, 'POST', `/giao-viec/bao_ph/${xa.bp}/phu-trach`, { userId: tvv2.userId, phuTrachCu: null });
      assert(gi.status === 200, `giao: ${gi.status} ${gi.json?.error}`);
      conn.prepare(`INSERT INTO viec_mo_ta (loai, ref_id, noi_dung, sua_boi, sua_luc) VALUES ('bao_ph', ?, 'MO TA CUA EM A', ?, ?)`).run(xa.bp, ql.userId, new Date().toISOString());
      conn.prepare(`INSERT INTO viec_han_lan (loai, viec_id, han_cu, han_moi, mac_dinh, boi, luc) VALUES ('bao_ph', ?, NULL, ?, 0, ?, ?)`).run(xa.bp, addDays(TODAY, 9), ql.userId, new Date().toISOString());
      const dem = (id: number) => ({
        td: hang(`SELECT user_id FROM viec_theo_doi WHERE loai = 'bao_ph' AND ref_id = ? ORDER BY user_id`, id).map((r) => r.user_id),
        lan: hang(`SELECT 1 FROM viec_giao_lan WHERE loai = 'bao_ph' AND ref_id = ?`, id).length, han: hang(`SELECT 1 FROM viec_han_lan WHERE loai = 'bao_ph' AND viec_id = ?`, id).length,
        moTa: mot(`SELECT noi_dung FROM viec_mo_ta WHERE loai = 'bao_ph' AND ref_id = ?`, id)?.noi_dung ?? null,
        dao: hang(`SELECT 1 FROM ghi_dao WHERE loai = 'giao_viec' AND bang = 'viec_bao_ph' AND doi_tuong_id = ?`, id).length });
      const truoc = dem(xa.bp);
      assert(truoc.td.length && truoc.lan && truoc.han && truoc.moTa && truoc.dao, `dữ liệu việc em A: ${JSON.stringify(truoc)}`);
      const x = xoaHV.xoaHocVien(P.admin, a, { maXacNhan: mot('SELECT student_code FROM students WHERE id = ?', a).student_code });
      const b = moiEm(); const xb = xuLy(b);
      assert(xb.bp === xa.bp, `em B nhận lại id việc ${xa.bp}: ${xb.bp}`);
      const rongB = JSON.stringify(dem(xb.bp));
      const aMoi = rac.khoiPhucRac(P.admin, x.thungRacId).doiTuongId as number;   // id em cũng có thể đã được em B dùng lại
      const bpA = mot('SELECT id FROM viec_bao_ph WHERE student_id = ?', aMoi).id as number;
      assert(bpA !== xb.bp, 'việc em A nhận id mới');
      assert(JSON.stringify(dem(xb.bp)) === rongB, `việc em B không dính dữ liệu em A: ${JSON.stringify(dem(xb.bp))}`);
      assert(JSON.stringify(dem(bpA)) === JSON.stringify(truoc), `việc em A đủ như trước: ${JSON.stringify(dem(bpA))} ≠ ${JSON.stringify(truoc)}`);
      assert(mot('SELECT phu_trach_id FROM viec_bao_ph WHERE id = ?', bpA).phu_trach_id === tvv2.userId, 'người được giao giữ');
    }));

    await checkAsync('TL-15 · (rà 1) đổi GVCN thật + đổi TVV khi Meeting VÀ trả lại cùng mở: người theo dõi gvcn / tvv của CẢ HAI chuyển theo; cả lần xử lý → GVCN mới nhận việc + chuông', () => thu(async () => {
      const sid = moiEm(); const { mid } = xuLy(sid);
      const mp = meeting(sid);
      const id = (await tra(tvv, { measureId: mid })).json.id;
      const v2 = (await tra(tvv, { violationId: viPham(sid) })).json.id;   // vi phạm lẻ về GVBM → GVCN theo dõi
      assert(mp.length === 2 && mp.every((m) => theoDoi('meeting', m).some((x) => x.user_id === gvcn.userId && x.nguon === 'gvcn')), 'Meeting: GVCN theo dõi');
      const slots = hang(`SELECT user_id, skill, is_core FROM teacher_assignments WHERE class_id = ? AND status = 'active'`, lop).map((r) => ({ userId: r.user_id, skill: r.skill, isCore: r.is_core === 1 }));
      const w2 = P.w2Teacher;
      const lu = pc.luuPhanCong(ql, { lop: [{ classId: lop, slots: slots.filter((x) => !x.isCore).concat([{ userId: w2.userId, skill: null, isCore: true }]) }] });
      try {
        for (const m of mp) assert(theoDoi('meeting', m).some((x) => x.user_id === w2.userId && x.nguon === 'gvcn') && !theoDoi('meeting', m).some((x) => x.user_id === gvcn.userId),
          `Meeting ${m} theo GVCN mới: ${JSON.stringify(theoDoi('meeting', m))}`);
        assert(theoDoi('tra_lai', v2).some((x) => x.user_id === w2.userId && x.nguon === 'gvcn'), 'trả lại: theo dõi gvcn chuyển');
        assert(dong(id).nguoi_nhan === w2.userId && tin(`tra-lai:${id}:nhan:${w2.userId}`).includes(w2.userId), `cả lần → GVCN mới + chuông: ${JSON.stringify(dong(id))}`);
        assert(items(w2).some((x) => x.key === `yt_tra_lai:${id}`) && !items(gvcn).some((x) => x.key === `yt_tra_lai:${id}`), 'việc sang GVCN mới');
        assert(mot(`SELECT 1 FROM viec_giao_lan WHERE loai = 'tra_lai' AND ref_id = ? AND truong = 'nguoi_nhan'`, id), 'lịch sử người nhận');
        students.updateStudent(P.admin, sid, { consultantUserId: tvv2.userId });
        for (const m of mp) assert(theoDoi('meeting', m).some((x) => x.user_id === tvv2.userId && x.nguon === 'tvv') && !theoDoi('meeting', m).some((x) => x.user_id === tvv.userId),
          `đổi TVV: Meeting ${m} ${JSON.stringify(theoDoi('meeting', m))}`);
      } finally {
        students.updateStudent(P.admin, sid, { consultantUserId: tvv.userId });
        pc.hoanTacLuu(ql, { lo: lu.lo });
      }
    }));

    await checkAsync('TL-16 · (rà 2) tạm dừng theo yêu cầu: hai vi phạm cùng lần (một trả lời, một còn mở) · cả lần + một vi phạm · gỡ vi phạm khỏi lần xử lý → Báo PH hết dừng', () => thu(async () => {
      const sid = moiEm(); const { vids, mid, bp } = xuLy(sid, 3);
      const cho = () => mot('SELECT tra_lai_id FROM viec_bao_ph WHERE id = ?', bp).tra_lai_id as number | null;
      const a = (await tra(tvv, { violationId: vids[0] })).json.id; const b = (await tra(tvv, { violationId: vids[1] })).json.id;
      await goi(gvbm, 'POST', `/y-thuc/tra-lai/${a}/giu-nguyen`, { traLoi: 'Em nói chuyện cả buổi, cô đã nhắc ba lần' });
      assert(cho() === b, `một vi phạm còn mở → vẫn chờ (${cho()})`);
      const c = (await tra(tvv, { measureId: mid })).json.id;
      await goi(gvbm, 'POST', `/y-thuc/tra-lai/${b}/giu-nguyen`, { traLoi: 'Em nói chuyện cả buổi, cô đã nhắc ba lần' });
      assert(cho() === c, `cả lần còn mở → vẫn chờ (${cho()})`);
      await goi(gvcn, 'POST', `/y-thuc/tra-lai/${c}/gui-lai`, {});
      assert(cho() === null, 'hết yêu cầu mở → hết dừng');
      const d = (await tra(tvv, { violationId: vids[2] })).json.id;
      assert(cho() === d, 'trả tiếp → dừng');
      conn.prepare('UPDATE viec_bao_ph SET han = ?, han_chon = NULL WHERE id = ?').run(addDays(TODAY, -2), bp);   // hạn gốc đã qua trong lúc chờ
      xu.suaViPhamXuLy(gvcn, mid, { violationIds: [vids[0], vids[1]] });   // GVCN "sửa" bằng cách gỡ vi phạm khỏi lần xử lý
      assert(cho() === null && mot('SELECT han_chon FROM viec_bao_ph WHERE id = ?', bp).han_chon === hanBaoPh(TODAY), 'gỡ vi phạm → Báo PH hết dừng ngay, hạn tính lại hôm nay + 4');
      await goi(gvbm, 'POST', `/y-thuc/tra-lai/${d}/giu-nguyen`, { traLoi: 'Em nói chuyện cả buổi, cô đã nhắc ba lần' });
      assert(cho() === null && dong(d).trang_thai === 'xong', 'đóng sau đó không kẹt');
    }));

    await checkAsync('TL-17 · (rà 5) trả vi phạm CHƯA có lần xử lý → GVCN lưu xử lý chứa nó → Báo PH sinh ra đã "Chờ GV sửa"; TVV báo PH → tự đóng', () => thu(async () => {
      const sid = moiEm(); const v = viPham(sid);
      const id = (await tra(tvv, { violationId: v })).json.id;
      const m = xu.xacNhanXuLy(gvcn, sid, { violationIds: [v], performedOn: TODAY, performerName: null, note: 'Nhắc nhở em sau giờ học, em hứa sửa' });
      const bp = mot('SELECT id, tra_lai_id FROM viec_bao_ph WHERE measure_id = ?', m.id);
      assert(bp.tra_lai_id === id, `Báo PH mới chờ GV sửa: ${JSON.stringify(bp)}`);
      await goi(tvv, 'POST', '/y-thuc/bao-ph/ghi', { viecIds: [bp.id], ketQua: 'da_bao', ghiChu: 'Đã gọi mẹ em, mẹ hứa nhắc em' });
      assert(dong(id).ket_qua === 'tvv_da_bao', 'tự đóng');
    }));

    await checkAsync('TL-18 · (rà 3) một luật tạm dừng: hồ sơ HV không đỏ khi chờ; TVV báo PH khi chờ + đã qua hạn gốc → hạn tính lại TRƯỚC khi xong (không trễ)', () => thu(async () => {
      const sid = moiEm(); const { vids, bp } = xuLy(sid);
      conn.prepare('UPDATE viec_bao_ph SET han = ? WHERE id = ?').run(addDays(TODAY, -3), bp);
      await tra(tvv, { violationId: vids[0] });
      const tim = (o: any): any => (o && typeof o === 'object' ? (o.key === `bao-ph:${bp}` && 'tone' in o ? o : Object.values(o).map(tim).find(Boolean)) : undefined);
      const d = tim((await goi(tvv, 'GET', `/students/${sid}`)).json);
      assert(d && d.quaHanNgay === null && d.tone !== 'danger' && d.gap !== 'qua-han', `hồ sơ HV: ${JSON.stringify(d)}`);
      await goi(tvv, 'POST', '/y-thuc/bao-ph/ghi', { viecIds: [bp], ketQua: 'da_bao', ghiChu: 'Đã gọi mẹ em, mẹ hứa nhắc em' });
      const b = mot('SELECT trang_thai, han_chon FROM viec_bao_ph WHERE id = ?', bp);
      assert(b.trang_thai === 'xong' && b.han_chon === hanBaoPh(TODAY) && b.han_chon >= TODAY, `hạn tính lại trước khi xong: ${JSON.stringify(b)}`);
    }));

    await checkAsync('TL-23 · (rà lần 2) Báo PH đã giao cho người khác, đang chờ GV sửa, quá hạn gốc: dải việc hồ sơ HV của người được giao không đỏ; lần xử lý đã thu hồi → trả lại 400', () => thu(async () => {
      const sid = moiEm(); const { vids, bp } = xuLy(sid);
      conn.prepare('UPDATE viec_bao_ph SET han = ? WHERE id = ?').run(addDays(TODAY, -3), bp);
      const gi = await goi(tvv, 'POST', `/giao-viec/bao_ph/${bp}/phu-trach`, { userId: tvv2.userId, phuTrachCu: null });
      assert(gi.status === 200, `giao: ${gi.status} ${gi.json?.error}`);
      await tra(tvv, { violationId: vids[0] });
      const tim = (o: any): any => (o && typeof o === 'object' ? (o.key === `bao-ph:${bp}` && 'tone' in o ? o : Object.values(o).map(tim).find(Boolean)) : undefined);
      const d = tim((await goi(tvv2, 'GET', `/students/${sid}`)).json);
      assert(d && d.quaHanNgay === null && d.tone !== 'danger', `hồ sơ HV người được giao: ${JSON.stringify(d)}`);
      const sid2 = moiEm(); const x2 = xuLy(sid2);
      conn.prepare(`UPDATE discipline_measures SET status = 'thu_hoi' WHERE id = ?`).run(x2.mid);
      const r = await tra(tvv, { measureId: x2.mid });
      assert(r.status === 400 && /Xử lý đã thu hồi — việc Báo PH chỉ xem/.test(r.json?.error ?? ''), `thu hồi: ${r.status} ${r.json?.error}`);
      assert((await tra(tvv, { violationId: x2.vids[0] })).status === 400, 'vi phạm của lần đã thu hồi → 400');
    }));

    await checkAsync('TL-19 · (rà 7) hai người trả cùng lúc: chỉ mục UNIQUE bắt người sau → 409 câu tiếng Việt (không 500)', () => thu(async () => {
      const sid = moiEm(); const { vids } = xuLy(sid);
      /* Giả lập người kia chèn trước một khắc: trigger chèn dòng mở ngay trước dòng của mình (vượt qua bước đọc kiểm). */
      conn.exec(`CREATE TEMP TRIGGER tl_dua BEFORE INSERT ON vi_pham_tra_lai WHEN NEW.ly_do = 'Đua trả lại cùng một lúc' BEGIN
        INSERT INTO vi_pham_tra_lai (student_id, violation_id, ly_do, nguoi_tra, tra_luc, han, trang_thai) VALUES (NEW.student_id, NEW.violation_id, 'Người kia trả trước', ${tvv2.userId}, NEW.tra_luc, NEW.han, 'mo'); END`);
      try {
        const r = await tra(tvv, { violationId: vids[0], lyDo: 'Đua trả lại cùng một lúc' });
        assert(r.status === 409 && /đang chờ GV sửa/.test(r.json?.error ?? ''), `${r.status} ${r.json?.error}`);
      } finally { conn.exec('DROP TRIGGER IF EXISTS tl_dua'); }
    }));

    await checkAsync('TL-20 · Head "Tất cả" thấy việc trả lại của GV (đứng tên người giữ); Head chi nhánh khác không; em Tạm dừng → việc ẩn, quay lại → hiện', () => thu(async () => {
      const sid = moiEm(); const { vids } = xuLy(sid, 2);
      const id = (await tra(tvv, { violationId: vids[0] })).json.id;
      xoaNho();
      const tc = ((myWork(loadPrincipal(ql.userId), { nguoi: 'tat-ca' }) as any).items ?? []).find((x: any) => x.key === `yt_tra_lai:${id}`);
      assert(tc && !tc.mine && tc.ownerId === gvbm.userId, `Head Tất cả: ${JSON.stringify(tc)}`);
      /* N64 (PTA rà #1989): id người trả đi lên từ SQL; Head làm thay được (DISCIPLINE_MANAGE) — trừ việc do chính Head trả. */
      assert(tc.nguoiTraId === tvv.userId && tc.lamThay === true, `cờ làm thay: ${JSON.stringify({ tra: tc.nguoiTraId, lt: tc.lamThay })}`);
      const id2 = (await tra(ql, { violationId: vids[1] })).json.id;
      xoaNho();
      const tc2 = ((myWork(loadPrincipal(ql.userId), { nguoi: 'tat-ca' }) as any).items ?? []).find((x: any) => x.key === `yt_tra_lai:${id2}`);
      assert(tc2 && tc2.nguoiTraId === ql.userId && tc2.lamThay === false, `Head tự trả → không cờ: ${JSON.stringify(tc2 && { tra: tc2.nguoiTraId, lt: tc2.lamThay })}`);
      xoaNho();
      assert(!((myWork(loadPrincipal(P.cpManager.userId), { nguoi: 'tat-ca' }) as any).items ?? []).some((x: any) => x.key === `yt_tra_lai:${id}`), 'Head CP không thấy');
      conn.prepare(`UPDATE students SET status = 'paused' WHERE id = ?`).run(sid);
      assert(!items(gvbm).some((x) => x.key === `yt_tra_lai:${id}`) && dong(id).trang_thai === 'mo', 'Tạm dừng → ẩn, yêu cầu giữ');
      conn.prepare(`UPDATE students SET status = 'active' WHERE id = ?`).run(sid);
      assert(items(gvbm).some((x) => x.key === `yt_tra_lai:${id}`), 'quay lại → hiện');
    }));

    await checkAsync('TL-21 · (rà 8) CX tự trả thì không tự trả lời phía GV; TVV của em hết vai TVV → không trả được', () => thu(async () => {
      const sid = moiEm(); const { vids } = xuLy(sid, 2);
      const id = (await tra(cx, { violationId: vids[0] })).json.id;
      assert((await goi(cx, 'POST', `/y-thuc/tra-lai/${id}/giu-nguyen`, { traLoi: 'CX tự trả lời yêu cầu của chính mình' })).status === 403, 'CX tự trả lời → 403');
      const tvvCu = taiKhoan('tvvcu', 'consultant');
      conn.prepare('UPDATE students SET consultant_user_id = ? WHERE id = ?').run(tvvCu.userId, sid);
      accounts.setRoles(P.admin, tvvCu.userId, [{ role: 'office_admin', branches: ['MB'] }]);
      ck.set(tvvCu.userId, await vao(tvvCu.userId));
      assert((await tra(tvvCu, { violationId: vids[1] })).status === 403, 'TVV của em đã hết vai TVV → 403');
    }));

    await checkAsync('TL-24 · (TL-2 giao diện) panel đọc đủ: người ghi / lúc ghi, lý do + người giữ, số vi phạm của lần; nút Trả lại ở chi tiết vi phạm theo vai; tin TVV "GV đã sửa · em · GV" + nội dung, mở đúng panel Báo PH; hạn máy tính lại không là "đã chỉnh"', () => thu(async () => {
      const sid = moiEm(); const { vids, bp } = xuLy(sid, 2);
      const tenEm = mot('SELECT full_name FROM students WHERE id = ?', sid).full_name as string;
      assert((await goi(tvv, 'GET', `/violations/${vids[0]}`)).json.traLai?.coThe === true && (await goi(gvbm, 'GET', `/violations/${vids[0]}`)).json.traLai?.coThe === false, 'chi tiết vi phạm: TVV có, GV không');
      const id = (await tra(tvv, { violationId: vids[0] })).json.id as number;
      const ct = (await goi(tvv, 'GET', `/violations/${vids[0]}`)).json.traLai;
      assert(ct.coThe === false && ct.dangMo?.id === id && ct.dangMo.lyDo === LY_DO && ct.dangMo.nguoiNhan === gvbm.fullName, `đang chờ: ${JSON.stringify(ct)}`);
      const v = (await goi(tvv, 'GET', `/y-thuc/bao-ph/${bp}`)).json;
      const x0 = v.boiCanh.viPham.find((x: any) => x.id === vids[0]);
      assert(x0.nguoiGhi === gvbm.fullName && !!x0.ghiLuc && x0.daSua === false, `vi phạm trong panel: ${JSON.stringify(x0)}`);
      assert(v.choGvSua && v.traLai.length === 1 && v.traLai[0].lyDo === LY_DO && v.traLai[0].nguoiNhan === gvbm.fullName && !!v.traLai[0].traLuc, `yêu cầu mở: ${JSON.stringify(v.traLai)}`);
      const xem = (await goi(gvbm, 'GET', `/y-thuc/tra-lai/${id}`)).json;
      assert(xem.lanXuLy?.soViPham === 2 && /REPORT|Report/.test(xem.lanXuLy.nhan), `lần xử lý: ${JSON.stringify(xem.lanXuLy)}`);
      conn.prepare('UPDATE viec_bao_ph SET han_chon = ? WHERE id = ?').run(addDays(TODAY, 1), bp);   // hạn đã chỉnh sớm hơn hạn mới → máy tính lại
      const g = await goi(gvbm, 'POST', `/y-thuc/tra-lai/${id}/gui-lai`, { sua: { ten: 'Nói chuyện riêng lúc cô giảng phần 2' } });
      assert(g.status === 200, `gửi lại: ${g.status} ${g.json?.error}`);
      const n = mot('SELECT title, body, duong FROM notifications WHERE dedup_key = ? AND user_id = ?', `tra-lai-kq:${id}`, tvv.userId);
      assert(n?.title === `GV đã sửa · ${tenEm} · ${gvbm.fullName}` && n.body === 'Nói chuyện riêng lúc cô giảng phần 2' && n.duong === `/cong-viec?viec=${encodeURIComponent(`bao-ph:${bp}`)}`, `tin TVV: ${JSON.stringify(n)}`);
      const kv = (await goi(tvv, 'GET', `/giao-viec/bao_ph/${bp}`)).json;
      assert(kv.hanTinhLai === true && kv.lichSu.some((l: any) => l.truong === 'han_tinh_lai') && !kv.tamDung, `hạn máy tính lại: ${JSON.stringify({ t: kv.hanTinhLai, h: kv.han })}`);
      assert((await goi(tvv, 'GET', `/y-thuc/bao-ph/${bp}`)).json.boiCanh.viPham.find((x: any) => x.id === vids[0]).daSua === true, '"đã sửa" trên dòng vi phạm');
      const b = await tra(tvv, { violationId: vids[1] });
      const gn = await goi(gvbm, 'POST', `/y-thuc/tra-lai/${b.json.id}/giu-nguyen`, { traLoi: 'Em nói chuyện cả buổi, cô đã nhắc ba lần' });
      const n2 = mot('SELECT title, body FROM notifications WHERE dedup_key = ? AND user_id = ?', `tra-lai-kq:${b.json.id}`, tvv.userId);
      assert(gn.status === 200 && n2?.title === `GV đã trả lời · ${tenEm} · ${gvbm.fullName}` && n2.body === 'Em nói chuyện cả buổi, cô đã nhắc ba lần', `tin trả lời: ${JSON.stringify(n2)}`);
      conn.prepare("UPDATE viec_bao_ph SET trang_thai = 'xong' WHERE id = ?").run(bp);
      assert((await goi(tvv, 'GET', `/y-thuc/bao-ph/${bp}`)).json.coTheTraLai === false && (await goi(tvv, 'GET', `/violations/${vids[1]}`)).json.traLai.coThe === false, 'Báo PH đã xong → không nút Trả lại');
    }));

    await checkAsync('AU-2111 B1-08 · Chuyển lớp sang lớp không có: không 500 — Head / CX 404 "Không tìm thấy lớp chuyển đến", vai không quyền 403 câu "Head hoặc CX"', () => thu(async () => {
      const sid = moiEm();
      const than = { toClassId: 999999, tuan: TODAY, lyDo: 'Đổi lịch học theo gia đình' };
      for (const p of [ql, cx]) {
        const r = await goi(p, 'POST', `/students/${sid}/transfer`, than);
        assert(r.status === 404 && r.json?.error === 'Không tìm thấy lớp chuyển đến', `${p.fullName}: ${r.status} ${r.json?.error}`);
      }
      const r = await goi(gvKhac, 'POST', `/students/${sid}/transfer`, than);
      assert(r.status === 403 && r.json?.error === 'Chỉ Head hoặc CX của chi nhánh lớp này mới ra quyết định chuyển lớp.', `GV: ${r.status} ${r.json?.error}`);
    }));

    check('AU-2111 B1-09 · câu chặn nhập điểm em chi nhánh khác: Head / Admin / Quản trị nhận câu "Head chi nhánh của em", GV nhận câu kỹ năng được phân công', () => {
      const HEAD = 'Học viên ở chi nhánh khác — Head chi nhánh của em nhập điểm.';
      for (const p of [ql, admin, P.admin]) assert(CHU_CHAN_NHAP_DIEM(loadPrincipal(p.userId)) === HEAD, `${p.fullName}: ${CHU_CHAN_NHAP_DIEM(loadPrincipal(p.userId))}`);
      for (const p of [gvcn, gvKhac, bpxl]) assert(CHU_CHAN_NHAP_DIEM(loadPrincipal(p.userId)) === 'Bạn chỉ nhập được điểm của kỹ năng mình được phân công.', `${p.fullName}`);
    });

    await checkAsync('AU-2111 R1 · TVV của em đã đổi vai sang chi nhánh khác: xem Báo PH (SĐT PH) · ghi KQ · sửa hạn · bỏ việc · trả lại · rút · Hoàn tác trả lại · sửa hạn trả lại → 403 và DB không đổi', () => thu(async () => {
      const cu = taiKhoan('tvvcu', 'consultant');
      const sid = moiEm();
      conn.prepare('UPDATE students SET consultant_user_id = ? WHERE id = ?').run(cu.userId, sid);
      const { vids, bp } = xuLy(sid, 2);
      ck.set(cu.userId, await vao(cu.userId));
      const r0 = await tra(cu, { violationId: vids[0] });
      assert(r0.status === 200, `TVV còn vai trả lại được: ${r0.status} ${r0.json?.error}`);
      const id = r0.json.id as number;
      accounts.setRoles(P.admin, cu.userId, [{ role: 'consultant', branches: ['CP'] }]);
      ck.set(cu.userId, await vao(cu.userId));
      const anh = () => JSON.stringify([
        hang('SELECT trang_thai, han_chon, tra_lai_id FROM viec_bao_ph WHERE id = ?', bp), hang('SELECT id FROM viec_bao_ph_lan WHERE viec_id = ?', bp),
        hang(`SELECT id FROM viec_han_lan WHERE (loai = 'bao_ph' AND viec_id = ?1) OR (loai = 'tra_lai' AND viec_id = ?2)`, bp, id),
        hang('SELECT id, trang_thai, han_chon FROM vi_pham_tra_lai WHERE student_id = ? ORDER BY id', sid),
      ]);
      const truoc = anh();
      const han = addDays(TODAY, 9);
      const ds: [string, string, unknown?][] = [
        ['GET', `/y-thuc/bao-ph/${bp}`],
        ['POST', '/y-thuc/bao-ph/ghi', { viecIds: [bp], ketQua: 'da_bao', ghiChu: 'TVV đã đổi vai ghi thử kết quả' }],
        ['POST', `/y-thuc/bao-ph/${bp}/han`, { han, hanCu: null }],
        ['POST', `/y-thuc/bao-ph/${bp}/bo`, { lyDo: 'not_needed' }],
        ['POST', '/y-thuc/tra-lai', { lyDo: LY_DO, violationId: vids[1] }],
        ['POST', `/y-thuc/tra-lai/${id}/rut`],
        ['POST', `/y-thuc/tra-lai/${id}/hoan-tac`],
        ['POST', `/giao-viec/tra_lai/${id}/han`, { han, hanCu: null }],
      ];
      for (const [m, u, b] of ds) {
        const r = await goi(cu, m, u, b);
        assert(r.status === 403, `${m} ${u}: ${r.status} ${r.json?.error}`);
        assert(!JSON.stringify(r.json ?? {}).includes('lienHe'), `${u}: lộ liên hệ PH`);
        assert(anh() === truoc, `${m} ${u}: DB đã đổi dù trả ${r.status}`);
      }
    }));

    await checkAsync('TL-22 · (rà 4) người nhận hết vai ở chi nhánh → việc về GVCN (chuông, /my-work); người cũ không thấy, không làm được', () => thu(async () => {
      const sid = moiEm(); const { vids } = xuLy(sid);
      const id = (await tra(tvv, { violationId: vids[0] })).json.id;
      assert(dong(id).nguoi_nhan === gvbm.userId, 'ban đầu về GVBM');
      voiXacNhan(() => accounts.setRoles(P.admin, gvbm.userId, [{ role: 'teacher', branches: ['CP'] }]));   // ĐẶT CUỐI: GVBM mất vai MB (không trả lại phân công)
      assert(dong(id).nguoi_nhan === gvcn.userId && tin(`tra-lai:${id}:nhan:${gvcn.userId}`).includes(gvcn.userId), `về GVCN + chuông: ${JSON.stringify(dong(id))}`);
      assert(items(gvcn).some((x) => x.key === `yt_tra_lai:${id}`) && !items(gvbm).some((x) => x.key === `yt_tra_lai:${id}`), '/my-work theo người mới');
      ck.set(gvbm.userId, await vao(gvbm.userId));
      assert((await goi(gvbm, 'POST', `/y-thuc/tra-lai/${id}/giu-nguyen`, { traLoi: 'Em nói chuyện cả buổi, cô đã nhắc ba lần' })).status === 403, 'người cũ → 403');
      const kv = await goi(gvcn, 'GET', `/giao-viec/tra_lai/${id}`);
      assert(kv.json.phuTrach[0].id === gvcn.userId, 'docViec cùng hàm');
    }));
  } finally {
    may.close();
  }

  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const { default: SqliteDb } = await import('libsql');
  const { migratePrTraLai } = await import('../migrate/prTraLai.ts');
  const { migratePrTuyen0 } = await import('../migrate/prTuyen0.ts');
  const { themCotPrVaiMoi } = await import('../migrate/prVaiMoi.ts');
  check('TL-14 · migrate prTraLai: chạy hai lần không đổi; tự lành khi thiếu chỉ mục; DB cũ sau migrate giống schema.sql; DB mới không bị đổi', () => {
    const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
    const SCHEMA = fs.readFileSync(path.join(REPO, 'server/src/schema.sql'), 'utf8').replace(/\r\n/g, '\n');
    const cat = SCHEMA
      /* VAI-0: bỏ viec_bao_ph.nguoi_luat + chỉ mục (themCotPrVaiMoi thêm lại bên dưới) — bộ cắt cũ khớp dòng `tra_lai_id` cuối bảng. */
      .replace(/\n {2}nguoi_luat INTEGER REFERENCES users\(id\) {3}-- VAI-0 \(N76b\)[^\n]*/, '').replace(/CREATE INDEX IF NOT EXISTS idx_viec_bao_ph_luat[^\n]*\n/, '')
      /* TUYEN-0 (sau TL-1): bỏ khối bảng bỏ theo dõi tuyến + chỉ mục người làm bước. */
      .replace(/-- TUYEN-0 \(N72 ①\)[\s\S]*?idx_tra_lai_xong_boi[^\n]*\n/, '')
      .replace(/,( +-- GV-1[^\n]*)\n {2}tra_lai_id INTEGER[^\n]*\n\)/, '$1\n)')
      .replace(/-- TL-1 \(N61, chủ SP 20\/11\): TRẢ LẠI VI PHẠM[\s\S]*?idx_tra_lai_xl[^\n]*\n/, '');
    if (/tra_lai_id|vi_pham_tra_lai/.test(cat)) throw new Error('schema.sql đổi khuôn — sửa bộ cắt của phép kiểm TL-14');
    const cu = new SqliteDb(':memory:'); cu.exec(cat);
    const a: string[] = []; migratePrTraLai(cu, a);
    const b: string[] = []; migratePrTraLai(cu, b);
    assert(a.length === 3 && b.length === 0, `${a.join(' | ')} ‖ ${b.join(' | ')}`);
    cu.exec('DROP INDEX uq_tra_lai_vp_mo');
    const c2: string[] = []; migratePrTraLai(cu, c2);
    assert(c2.length === 1 && !!cu.prepare(`SELECT 1 FROM sqlite_master WHERE name = 'uq_tra_lai_vp_mo'`).get(), `tự lành: ${c2.join(' | ')}`);
    const c: string[] = []; migratePrTraLai(conn, c);
    assert(!c.length, `DB dựng từ schema.sql vẫn bị đổi: ${c.join(' | ')}`);
    migratePrTuyen0(cu, []);   // TUYEN-0: DB cũ đi tiếp migrate sau (chỉ mục vi_pham_tra_lai.xong_boi)
    themCotPrVaiMoi(cu, []);   // VAI-0: viec_bao_ph.nguoi_luat
    const moi = new SqliteDb(':memory:'); moi.exec(SCHEMA);
    const cot = (d: any, bang: string) => JSON.stringify((d.prepare(`PRAGMA table_info(${bang})`).all() as any[]).map((x) => `${x.name}:${x.type}:${x.notnull}`));
    for (const bang of ['viec_bao_ph', 'vi_pham_tra_lai']) assert(cot(cu, bang) === cot(moi, bang), `${bang}: ${cot(cu, bang)} ≠ ${cot(moi, bang)}`);
    const chiMuc = (d: any) => JSON.stringify((d.prepare(`SELECT name, sql FROM sqlite_master WHERE name LIKE '%tra_lai%' ORDER BY name`).all() as any[]).map((x) => `${x.name}: ${String(x.sql).replace(/\s+/g, ' ').replace(/\( /g, '(').replace(/ \)/g, ')')}`));
    assert(chiMuc(cu) === chiMuc(moi), `chỉ mục: ${chiMuc(cu)} ≠ ${chiMuc(moi)}`);
  });
}
