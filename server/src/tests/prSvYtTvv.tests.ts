/**
 * PHÉP KIỂM SV-YT-TVV (luật 1–2, Q-D1 ①, Q-D3 ①; v4b L1 K1–K12) — việc "Báo PH · {bậc} · {em}" của TVV sau mỗi lần lưu xử lý vi phạm.
 * Mỗi mục chạy trong giao dịch rồi cuộn lại (không để dữ liệu cho phép kiểm sau).
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrSvYtTvvTests(t: YThucTestKit) {
  const { check, checkAsync, assert, conn, TODAY, P, classId, addDays } = t as any;
  console.log('\nSV-YT-TVV · việc Báo PH của TVV sau lưu xử lý vi phạm');

  const thu = async (fn: () => void | Promise<void>) => { conn.exec('BEGIN IMMEDIATE'); try { await fn(); } finally { conn.exec('ROLLBACK'); } };
  const d: any = await import('../../../shared/domain/index.ts');
  const intake: any = await import('../classes/intake.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { boLichTuTao } = await import('./luotThu.ts');
  const viol: any = await import('../yThuc/violations.ts');
  const xu: any = await import('../yThuc/xuLy.ts');
  const lo: any = await import('../yThuc/lo.ts');
  const yc: any = await import('../duyet/yeuCau.ts');
  const bp: any = await import('../yThuc/baoPhTvv.ts');
  const loaiYc: any = await import('../duyet/loaiYeuCau.ts');
  const { myWork } = await import('../worklist/mywork.ts');
  const { dongBoThongBaoTuDong } = await import('../platform/thongBaoTuDong.ts');
  const { thongBaoCua } = await import('../platform/thongBao.ts');
  /** Chuông Báo PH của một người sau đồng bộ (như lúc mở chuông) — kèm `con_viec` (Cần làm) đúng câu của trang chuông. */
  const chuong = (p: any) => { xoaNho(); dongBoThongBaoTuDong(p, TODAY); return (thongBaoCua(p.userId) as any[]).filter((n) => n.kind === 'bao_ph_xu_ly'); };
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const hang = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const gvbm = P.w1Teacher; const gvcn = P.coreTeacher; const ql = P.mbManager;
  const LOP = 'MB FT 101';
  let dem = 0;
  const tvvMoi = () => {
    dem += 1;
    const uid = accounts.createAccount(P.admin, { email: `svyt.tvv${dem}${accounts.EMAIL_SUFFIX}`, password: 'matkhau-svyt', fullName: `TVV SVYT ${dem}`, roles: [{ role: 'consultant', branches: ['MB'] }] }).userId as number;
    return loadPrincipal(uid);
  };
  const moiEm = (tvv: any | null): number => {
    const ten = `SVYT em ${++dem}-${Math.random().toString(36).slice(2, 6)}`;
    intake.commitIntake(P.admin, { classId: classId(LOP), rows: [{ fullName: ten, target: 7, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `svyt-${ten}` } as any);
    const st = conn.prepare('SELECT id FROM students WHERE full_name = ?').get(ten) as any;
    const cy = conn.prepare("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'").get(st.id) as any;
    boLichTuTao(conn, cy.id);
    conn.prepare('UPDATE students SET consultant_user_id = ? WHERE id = ?').run(tvv ? tvv.userId : null, st.id);
    return st.id as number;
  };
  const nVp = (sid: number, n: number): number[] => Array.from({ length: n }, (_, i) =>
    viol.recordViolation(gvbm, { studentId: sid, category: 'homework', ten: `Vi phạm ${i + 1}`, occurredOn: addDays(TODAY, -(i + 1)) }).violation.id as number);
  const xuLy = (who: any, sid: number, ids: number[]) => xu.xacNhanXuLy(who, sid, { violationIds: ids, performedOn: TODAY, performerName: 'Cô Thu', note: 'Đã gọi điện và gửi report cho gia đình' });
  const viecCua = (sid: number) => hang('SELECT * FROM viec_bao_ph WHERE student_id = ? ORDER BY id', sid);
  const viecToi = (p: any, sid: number, o: any = {}) => { xoaNho(); return ((myWork(p, o) as any).items as any[]).filter((x) => x.group === 'bao_ph_yt' && x.studentId === sid); };
  const ma = (fn: () => unknown): number | null => { try { fn(); return null; } catch (e: any) { return e?.status ?? -1; } };
  const ghi = (p: any, ids: number[], ketQua: string, o: any = {}) => bp.ghiKetQuaBaoPh(p, { viecIds: ids, ketQua, ...o });

  check('SVYT-K2 · hạn = 23:59 giờ VN ngày (lưu + 4): 23:30 VN không lệch UTC, 00:30 VN là ngày sau; T7 / CN tính như ngày thường', () => {
    assert(d.hanBaoPh('2026-09-14') === '2026-09-18', 'T2 14/09 → T6 18/09');
    assert(d.hanBaoPh('2026-09-14T16:30:00Z') === '2026-09-18', '23:30 VN 14/09 → 18/09');
    assert(d.hanBaoPh('2026-09-14T17:30:00Z') === '2026-09-19', '00:30 VN 15/09 → 19/09');
    assert(d.hanBaoPh('2026-09-15') === '2026-09-19' && d.hanBaoPh('2026-09-16') === '2026-09-20', 'hạn rơi T7 19/09 / CN 20/09');
    assert(d.hanBaoPh('2026-09-19') === '2026-09-23', 'lưu T7 → T4');
  });

  check('SVYT-K7a · Quay lại học → hạn mới = ngày quay lại + 4 (không sớm hơn hạn gốc); khoảng dừng trước khi tạo việc / sau hạn không đổi hạn', () => {
    const h = d.hanBaoPhHieuLuc;
    assert(h('2026-09-18', []) === '2026-09-18', 'không dừng');
    assert(h('2026-09-18', [{ tu: '2026-09-15', den: '2026-09-25' }]) === '2026-09-29', 'dừng 15→25/09');
    assert(h('2026-09-18', [{ tu: '2026-09-15', den: null }]) === '2026-09-18', 'đang dừng (ẩn ở danh sách)');
    assert(h('2026-09-18', [{ tu: '2026-09-01', den: '2026-09-05' }]) === '2026-09-18', 'dừng trước khi có việc');
    assert(h('2026-09-18', [{ tu: '2026-09-20', den: '2026-09-25' }]) === '2026-09-18', 'dừng sau hạn (đã quá hạn)');
    assert(h('2026-09-18', [{ tu: '2026-09-15', den: '2026-09-15' }]) === '2026-09-19', 'dừng 1 ngày → 15 + 4');
  });

  await checkAsync('SVYT-K1 · GVCN lưu xử lý → MỘT việc "Báo PH · Report 1 · em", hạn hôm nay + 4, người giữ = TVV (việc của tôi + chuông)', () => thu(() => {
    const tvv = tvvMoi(); const sid = moiEm(tvv); const [v1] = nVp(sid, 1);
    const r = xuLy(gvcn, sid, [v1]);
    const ds = viecCua(sid);
    assert(ds.length === 1 && ds[0].measure_id === r.id && ds[0].trang_thai === 'mo' && ds[0].han === addDays(TODAY, 4) && ds[0].nhan === 'Report 1', JSON.stringify(ds));
    const it = viecToi(tvv, sid);
    assert(it.length === 1 && it[0].mine && it[0].ownerId === tvv.userId && it[0].due === addDays(TODAY, 4) && /^Báo PH · Report 1 · SVYT em/.test(it[0].tieuDe)
      && it[0].viecId === ds[0].id && it[0].urgency === 'normal' && it[0].statusLabel === 'Chưa báo', JSON.stringify(it));
    const tb = chuong(tvv);
    assert(tb.length === 1 && tb[0].han === addDays(TODAY, 4) && /^Báo PH · Report 1/.test(tb[0].title) && tb[0].con_viec === 1 && tb[0].student_id === sid, JSON.stringify(tb));
    assert(viecToi(gvcn, sid).length === 0 && viecToi(ql, sid).length === 0, 'GVCN / QL "Của tôi" không có việc TVV giữ');
    assert(viecToi(ql, sid, { nguoi: 'tat-ca' }).some((x: any) => x.ownerId === tvv.userId), 'QL "Của GV" thấy việc của TVV');
  }));

  await checkAsync('SVYT-QL · QL lưu xử lý (thay GVCN) cũng sinh việc; quá hạn / hạn hôm nay đúng mức', () => thu(() => {
    const tvv = tvvMoi(); const sid = moiEm(tvv); const [v1, v2] = nVp(sid, 2);
    xuLy(ql, sid, [v1]);
    assert(viecCua(sid).length === 1, 'QL lưu → 1 việc');
    conn.prepare('UPDATE viec_bao_ph SET han = ? WHERE student_id = ?').run(TODAY, sid);
    assert(viecToi(tvv, sid)[0].urgency === 'today', 'hạn hôm nay');
    conn.prepare('UPDATE viec_bao_ph SET han = ? WHERE student_id = ?').run(addDays(TODAY, -1), sid);
    assert(viecToi(tvv, sid)[0].urgency === 'overdue', 'quá hạn từ ngày (hạn + 1)');
    xuLy(gvcn, sid, [v2]);
    assert(viecCua(sid).length === 2 && viecCua(sid)[1].han === addDays(TODAY, 4), 'lần sau: việc mới, hạn riêng');
  }));

  await checkAsync('SVYT-K3 · em không có TVV → QL chi nhánh giữ; gán TVV → việc theo TVV, hạn GIỮ; đổi TVV khác → TVV cũ mất quyền', () => thu(() => {
    const sid = moiEm(null); const [v1] = nVp(sid, 1);
    xuLy(gvcn, sid, [v1]);
    const it = viecToi(ql, sid);
    assert(it.length === 1 && it[0].mine && it[0].ownerId === ql.userId, 'QL giữ: ' + JSON.stringify(it));
    assert(chuong(ql).some((n) => n.student_id === sid && n.con_viec === 1), 'QL nhận chuông');
    const han = viecCua(sid)[0].han;
    const a = tvvMoi(); const b = tvvMoi();
    conn.prepare('UPDATE students SET consultant_user_id = ? WHERE id = ?').run(a.userId, sid);
    assert(viecToi(a, sid).length === 1 && viecToi(ql, sid).length === 0 && viecToi(a, sid)[0].due === han, 'gán TVV A');
    conn.prepare('UPDATE students SET consultant_user_id = ? WHERE id = ?').run(b.userId, sid);
    assert(viecToi(b, sid)[0]?.due === han && viecToi(a, sid).length === 0, 'đổi sang TVV B, hạn giữ');
    assert(ma(() => ghi(a, [viecCua(sid)[0].id], 'da_bao')) === 403, 'TVV cũ 403');
    ghi(b, [viecCua(sid)[0].id], 'da_bao');
    assert(viecCua(sid)[0].trang_thai === 'xong', 'TVV mới ghi được');
  }));

  await checkAsync('SVYT-K4 · Ghi nhận / Khai bậc → không có việc', () => thu(() => {
    const tvv = tvvMoi(); const sid = moiEm(tvv); const [v1] = nVp(sid, 1);
    xu.ghiNhan(gvcn, sid, [v1]);
    try { xu.khaiBac(gvcn, sid, { bac: 1, thang: 'v4', ghiChu: 'Khai bậc cũ' }); } catch { /* em đã có vi phạm thì không khai được — chỉ cần không sinh việc */ }
    assert(viecCua(sid).length === 0, 'không sinh việc');
  }));

  await checkAsync('SVYT-K5 · Đề xuất: nháp chưa gửi → 0 việc; gửi (chờ QL duyệt) → việc ngay; QL duyệt không sinh thêm', () => thu(() => {
    const tvv = tvvMoi(); const sid = moiEm(tvv); const [v1] = nVp(sid, 1);
    const n = xu.deXuat(gvcn, sid, { kind: 'meeting_cx', violationIds: [v1], note: 'Mời gia đình lên trao đổi về việc học' });
    assert(viecCua(sid).length === 0, 'nháp: 0 việc');
    conn.prepare("INSERT INTO attachments (owner_type, owner_id, kind, display_name, url, uploaded_by, created_at) VALUES ('discipline_measure', ?, 'link', 'bb', 'https://vd.vn/bb', ?, ?)").run(n.id, gvcn.userId, new Date().toISOString());
    xu.guiDeXuat(gvcn, n.id);
    const ds = viecCua(sid);
    assert(ds.length === 1 && ds[0].measure_id === n.id && ds[0].han === addDays(TODAY, 4) && /Meeting/.test(ds[0].nhan), JSON.stringify(ds));
    const the = hang("SELECT id FROM yeu_cau_duyet WHERE loai = 'y_thuc' AND doi_tuong_id = ? AND trang_thai = 'cho'", n.id)[0];
    yc.duyetYeuCau(ql, the.id);
    assert(viecCua(sid).length === 1 && viecCua(sid)[0].trang_thai === 'mo', 'duyệt không sinh thêm');
  }));

  await checkAsync('SVYT-K6 · QL từ chối → việc chưa xong "Đã bỏ · QL từ chối"; GVCN rút → "Đã bỏ · Đề xuất đã rút" (lịch sử giữ)', () => thu(() => {
    const tvv = tvvMoi();
    const de = (sid: number, v: number) => {
      const n = xu.deXuat(gvcn, sid, { kind: 'meeting_cx', violationIds: [v], note: 'Mời gia đình lên trao đổi về việc học' });
      conn.prepare("INSERT INTO attachments (owner_type, owner_id, kind, display_name, url, uploaded_by, created_at) VALUES ('discipline_measure', ?, 'link', 'bb', 'https://vd.vn/bb', ?, ?)").run(n.id, gvcn.userId, new Date().toISOString());
      xu.guiDeXuat(gvcn, n.id);
      return { id: n.id, the: hang("SELECT id FROM yeu_cau_duyet WHERE loai = 'y_thuc' AND doi_tuong_id = ? AND trang_thai = 'cho'", n.id)[0].id };
    };
    const s1 = moiEm(tvv); const a = de(s1, nVp(s1, 1)[0]);
    yc.tuChoiYeuCau(ql, a.the, 'Chưa đủ căn cứ');
    const v1 = viecCua(s1)[0];
    assert(v1.trang_thai === 'bo' && v1.bo_ly_do === 'system_tu_choi' && v1.bo_ly_do_chu === 'Chưa đủ căn cứ', JSON.stringify(v1));
    assert(viecToi(tvv, s1).length === 0, 'hết khỏi việc của tôi');
    const s2 = moiEm(tvv); const b = de(s2, nVp(s2, 1)[0]);
    ghi(tvv, [viecCua(s2)[0].id], 'chua_lien_he', { ghiChu: 'Gọi không nghe máy' });
    yc.rutYeuCau(gvcn, b.the);
    const v2 = viecCua(s2)[0];
    assert(v2.trang_thai === 'bo' && v2.bo_ly_do === 'system_rut' && v2.measure_id === null, JSON.stringify(v2));
    const x = bp.xemViecBaoPh(tvv, v2.id);
    assert(x.lan.length === 1 && x.xuLy === 'rut' && x.bo?.nhan === 'Đề xuất đã rút' && x.coTheGhi === false, JSON.stringify(x));
  }));

  await checkAsync('SVYT-K6b · thu hồi được duyệt: chưa xong → "Đã bỏ · Xử lý đã thu hồi" + lý do; đã báo → giữ + nhãn + chuông để biết; huỷ thu hồi → mở lại', () => thu(() => {
    const tvv = tvvMoi(); const sid = moiEm(tvv); const [v1, v2] = nVp(sid, 2);
    const r1 = xuLy(gvcn, sid, [v1]);
    const [vA] = viecCua(sid);
    ghi(tvv, [vA.id], 'da_bao', { ghiChu: 'Đã gọi mẹ em' });
    const r2 = xuLy(gvcn, sid, [v2]);
    const vB = viecCua(sid).find((x: any) => x.measure_id === r2.id);
    xu.thuHoiXuLy(gvcn, r2.id, { lyDo: 'Bấm nhầm em' });
    assert(viecCua(sid).find((x: any) => x.id === vB.id).trang_thai === 'mo', 'GVCN mới gửi, QL chưa duyệt: việc giữ');
    yc.duyetYeuCau(ql, hang("SELECT id FROM yeu_cau_duyet WHERE loai = 'thu_hoi_y_thuc' AND doi_tuong_id = ? AND trang_thai = 'cho'", r2.id)[0].id);
    const b = viecCua(sid).find((x: any) => x.id === vB.id);
    assert(b.trang_thai === 'bo' && b.bo_ly_do === 'system_thu_hoi' && b.bo_ly_do_chu === 'Bấm nhầm em', JSON.stringify(b));
    xu.thuHoiXuLy(ql, r1.id, { lyDo: 'Ghi nhầm' });
    const a = bp.xemViecBaoPh(tvv, vA.id);
    assert(a.trangThai === 'xong' && a.xuLy === 'thu_hoi' && a.nhanXuLy === 'Xử lý đã thu hồi' && a.lan.length === 1 && a.coTheGhi === false, JSON.stringify(a));
    assert(hang("SELECT 1 FROM notifications WHERE user_id = ? AND dedup_key = ?", tvv.userId, `bao-ph-dong:${vA.id}`).length === 1, 'chuông để biết');
    assert(ma(() => ghi(tvv, [vA.id], 'chua_lien_he')) === 400, 'xử lý đã thu hồi → chỉ xem');
    /* QL huỷ quyết định thu hồi r2 trong ngày → việc B mở lại, hạn giữ. */
    xu.huyThuHoiYThuc(ql, r2.id);
    const b2 = viecCua(sid).find((x: any) => x.id === vB.id);
    assert(b2.trang_thai === 'mo' && b2.bo_ly_do === null && b2.han === vB.han, JSON.stringify(b2));
  }));

  await checkAsync('SVYT-K7 · em Tạm dừng → việc ẩn (không quá hạn); quay lại → hiện, hạn = ngày quay lại + 4', () => thu(() => {
    const tvv = tvvMoi(); const sid = moiEm(tvv); const [v1] = nVp(sid, 1);
    xuLy(gvcn, sid, [v1]);
    conn.prepare("UPDATE students SET status = 'inactive' WHERE id = ?").run(sid);
    assert(viecToi(tvv, sid).length === 0, 'ẩn khi Tạm dừng');
    const now = new Date().toISOString();
    conn.prepare("INSERT INTO journey_events (student_id, event_type, event_date, title, created_at) VALUES (?, 'pause', ?, 'Tạm dừng', ?)").run(sid, TODAY, now);
    conn.prepare("INSERT INTO journey_events (student_id, event_type, event_date, title, created_at) VALUES (?, 'resume', ?, 'Quay lại', ?)").run(sid, addDays(TODAY, 3), now);
    conn.prepare("UPDATE students SET status = 'active' WHERE id = ?").run(sid);
    assert(viecToi(tvv, sid)[0]?.due === addDays(TODAY, 7), 'hạn mới ' + viecToi(tvv, sid)[0]?.due);
  }));

  await checkAsync('SVYT-K8 · "Chưa liên hệ được" = một lần thử (việc mở, hạn giữ); "Đã báo PH" → xong; ghi lại "Chưa liên hệ được" = sửa nhầm → mở; mỗi lần một dòng + nhật ký', () => thu(() => {
    const tvv = tvvMoi(); const sid = moiEm(tvv); const [v1] = nVp(sid, 1);
    xuLy(gvcn, sid, [v1]);
    const [v] = viecCua(sid);
    ghi(tvv, [v.id], 'chua_lien_he', { ngay: addDays(TODAY, -1), ghiChu: 'Không nghe máy' });
    let x = viecCua(sid)[0];
    assert(x.trang_thai === 'mo' && x.han === v.han, 'vẫn mở, hạn giữ');
    assert(viecToi(tvv, sid)[0].statusLabel === 'Chưa liên hệ được', 'nhãn dòng');
    ghi(tvv, [v.id], 'da_bao');
    x = viecCua(sid)[0];
    assert(x.trang_thai === 'xong' && viecToi(tvv, sid).length === 0, 'xong, hết khỏi việc của tôi');
    ghi(tvv, [v.id], 'chua_lien_he', { ghiChu: 'Ghi nhầm em khác' });
    const lan = hang('SELECT * FROM viec_bao_ph_lan WHERE viec_id = ? ORDER BY id', v.id);
    assert(viecCua(sid)[0].trang_thai === 'mo' && lan.length === 3 && lan[1].ngay === TODAY && lan[0].ngay === addDays(TODAY, -1) && lan[0].ghi_boi === tvv.userId, JSON.stringify(lan));
    assert(hang("SELECT 1 FROM audit_logs WHERE action = 'discipline.bao_ph' AND actor_user_id = ?", tvv.userId).length === 3, 'nhật ký 3 lần');
    assert(ma(() => ghi(tvv, [v.id], 'da_bao', { ngay: addDays(TODAY, 1) })) === 400, 'ngày sau hôm nay');
    assert(ma(() => ghi(tvv, [v.id], 'khac')) === 400, 'kết quả lạ');
    assert(ma(() => ghi(tvv, [v.id], 'da_bao', { ngay: '31/12' })) === 400, 'ngày sai dạng');
  }));

  await checkAsync('SVYT-K9 · GVCN / GVBM / TVV khác ghi → 403; QL chi nhánh ghi được; bỏ việc: lý do sẵn có, "Khác" bắt chữ, đã bỏ thì không ghi', () => thu(() => {
    const tvv = tvvMoi(); const khac = tvvMoi(); const sid = moiEm(tvv); const [v1] = nVp(sid, 1);
    xuLy(gvcn, sid, [v1]);
    const [v] = viecCua(sid);
    assert(ma(() => ghi(gvcn, [v.id], 'da_bao')) === 403 && ma(() => ghi(gvbm, [v.id], 'da_bao')) === 403 && ma(() => ghi(khac, [v.id], 'da_bao')) === 403, 'không phải người giữ');
    assert(ma(() => bp.boViecBaoPh(gvcn, v.id, { lyDo: 'not_needed' })) === 403, 'GVCN không bỏ được');
    assert(ma(() => ghi(P.cpManager, [v.id], 'da_bao')) === 403, 'QL chi nhánh khác 403');
    assert(ma(() => bp.boViecBaoPh(tvv, v.id, { lyDo: 'xyz' })) === 400 && ma(() => bp.boViecBaoPh(tvv, v.id, { lyDo: 'other' })) === 400, 'lý do');
    const x = bp.boViecBaoPh(tvv, v.id, { lyDo: 'other', lyDoKhac: 'Gia đình đổi số, không liên hệ được' });
    assert(x.trangThai === 'bo' && x.bo?.chu === 'Gia đình đổi số, không liên hệ được' && x.coTheGhi === false, JSON.stringify(x));
    assert(ma(() => ghi(tvv, [v.id], 'da_bao')) === 400 && ma(() => bp.boViecBaoPh(tvv, v.id, { lyDo: 'not_needed' })) === 400, 'đã bỏ');
    const s2 = moiEm(tvv); xuLy(gvcn, s2, [nVp(s2, 1)[0]]);
    ghi(ql, [viecCua(s2)[0].id], 'da_bao');
    assert(viecCua(s2)[0].trang_thai === 'xong', 'QL chi nhánh ghi thay');
    assert(ma(() => bp.xemViecBaoPh(P.cpManager, v.id)) === 403, 'xem ngoài phạm vi');
  }));

  await checkAsync('SVYT-K10 · hai lần xử lý cùng em → hai việc; một lần ghi cho cả hai → hai dòng lịch sử (một giao dịch, lỗi một việc → lui cả)', () => thu(() => {
    const tvv = tvvMoi(); const sid = moiEm(tvv); const [v1, v2] = nVp(sid, 2);
    xuLy(gvcn, sid, [v1]); xuLy(gvcn, sid, [v2]);
    const ds = viecCua(sid);
    assert(ds.length === 2 && ds[0].nhan === 'Report 1' && ds[1].nhan === 'Report 2', JSON.stringify(ds));
    const kq = ghi(tvv, ds.map((x: any) => x.id), 'da_bao', { ghiChu: 'Báo chung một cuộc gọi' });
    assert(kq.viec.length === 2 && hang('SELECT 1 FROM viec_bao_ph_lan WHERE viec_id IN (?,?)', ds[0].id, ds[1].id).length === 2, 'hai dòng');
    const s2 = moiEm(tvvMoi()); xuLy(gvcn, s2, [nVp(s2, 1)[0]]);
    const s3 = moiEm(tvv); xuLy(gvcn, s3, [nVp(s3, 1)[0]]);
    assert(ma(() => ghi(tvv, [viecCua(s3)[0].id, viecCua(s2)[0].id], 'da_bao')) === 403, 'một việc không phải của mình');
    assert(viecCua(s3)[0].trang_thai === 'mo' && hang('SELECT 1 FROM viec_bao_ph_lan WHERE viec_id = ?', viecCua(s3)[0].id).length === 0, 'lui cả lần ghi');
  }));

  await checkAsync('SVYT-K11 · chuông Báo PH: MỘT dòng mỗi việc (quá hạn đổi chữ, không thêm dòng) · đổi TVV → chuông sang người mới · em Tạm dừng → không đếm · ghi xong → hết', () => thu(() => {
    const tvv = tvvMoi(); const moi = tvvMoi(); const sid = moiEm(tvv); const [v1] = nVp(sid, 1);
    xuLy(gvcn, sid, [v1]);
    const [v] = viecCua(sid);
    conn.prepare('UPDATE viec_bao_ph SET han = ? WHERE id = ?').run(addDays(TODAY, -2), v.id);
    chuong(tvv);
    const tb = chuong(tvv);
    assert(tb.length === 1 && /^Quá hạn · Báo PH · Report 1/.test(tb[0].title) && tb[0].han === addDays(TODAY, -2) && tb[0].con_viec === 1, 'quá hạn 1 dòng: ' + JSON.stringify(tb));
    conn.prepare('UPDATE students SET consultant_user_id = ? WHERE id = ?').run(moi.userId, sid);
    assert(chuong(moi).filter((n) => n.student_id === sid && n.con_viec === 1).length === 1, 'TVV mới có chuông');
    assert(!(thongBaoCua(tvv.userId) as any[]).some((n) => n.kind === 'bao_ph_xu_ly' && n.con_viec === 1), 'TVV cũ (chưa mở chuông) không còn Cần làm');
    assert(chuong(tvv).length === 0, 'TVV cũ mở chuông → dòng hết');
    conn.prepare("UPDATE students SET status = 'inactive' WHERE id = ?").run(sid);
    assert(!(thongBaoCua(moi.userId) as any[]).some((n) => n.kind === 'bao_ph_xu_ly' && n.con_viec === 1), 'em Tạm dừng: không đếm');
    assert(chuong(moi).length === 0, 'em Tạm dừng: đồng bộ xoá');
    conn.prepare("UPDATE students SET status = 'active' WHERE id = ?").run(sid);
    assert(chuong(moi).length === 1, 'quay lại: chuông lại');
    ghi(moi, [v.id], 'da_bao');
    assert(chuong(moi).length === 0, 'ghi xong → hết');
  }));

  await checkAsync('SVYT-K13 · QL từ chối chỉ đóng việc khi đề xuất thật sự vừa bị từ chối; tên bậc đọc từ lần xử lý (loại đổi → tên theo)', () => thu(() => {
    const tvv = tvvMoi(); const sid = moiEm(tvv); const [v1] = nVp(sid, 1);
    const n = xu.deXuat(gvcn, sid, { kind: 'meeting_cx', violationIds: [v1], note: 'Mời gia đình lên trao đổi về việc học' });
    conn.prepare("INSERT INTO attachments (owner_type, owner_id, kind, display_name, url, uploaded_by, created_at) VALUES ('discipline_measure', ?, 'link', 'bb', 'https://vd.vn/bb', ?, ?)").run(n.id, gvcn.userId, new Date().toISOString());
    xu.guiDeXuat(gvcn, n.id);
    const the = hang("SELECT id FROM yeu_cau_duyet WHERE loai = 'y_thuc' AND doi_tuong_id = ? AND trang_thai = 'cho'", n.id)[0].id;
    const ld = loaiYc.DINH_NGHIA_LOAI.find((x: any) => x.loai === 'y_thuc');
    conn.prepare("UPDATE discipline_measures SET status = 'da_duyet' WHERE id = ?").run(n.id);   // đã được duyệt ở đường khác
    ld.khiTuChoi(ql, { id: the, doi_tuong_id: n.id, hoc_vien_id: sid }, 'Muộn');
    assert(viecCua(sid)[0].trang_thai === 'mo', 'lần xử lý không còn chờ → việc giữ');
    conn.prepare("UPDATE discipline_measures SET kind = 'suspension' WHERE id = ?").run(n.id);
    assert(viecToi(tvv, sid)[0].tieuDe.startsWith(`Báo PH · ${d.nhanLoaiXuLy('suspension')} ·`) && bp.xemViecBaoPh(tvv, viecCua(sid)[0].id).nhan === d.nhanLoaiXuLy('suspension'), 'tên theo loại mới');
  }));

  await checkAsync('SVYT-K12 · xử lý lô 3 em → 3 việc (mỗi em một việc, đúng người giữ)', () => thu(() => {
    const tvv = tvvMoi();
    const ems = [moiEm(tvv), moiEm(tvv), moiEm(null)];
    for (const sid of ems) nVp(sid, 3);
    const kq = lo.loXuLy(gvcn, classId(LOP), { em: ems.map((studentId) => ({ studentId })), performedOn: TODAY, performerName: 'Cô Thu', note: 'Đã gửi report cho gia đình qua Zalo' });
    assert(kq.em.every((x: any) => x.ok), JSON.stringify(kq.em));
    assert(ems.every((sid) => viecCua(sid).length === 1), 'mỗi em một việc');
    assert(viecToi(tvv, ems[0]).length === 1 && viecToi(tvv, ems[1]).length === 1 && viecToi(ql, ems[2]).length === 1, 'người giữ');
  }));

  await checkAsync('SVYT-CU · lần xử lý lưu TRƯỚC khi bật (không qua đường lưu) không có việc; xoá học viên xoá cả việc + lịch sử', () => thu(async () => {
    const tvv = tvvMoi(); const sid = moiEm(tvv); const [v1] = nVp(sid, 1);
    xuLy(gvcn, sid, [v1]);
    conn.prepare('DELETE FROM viec_bao_ph_lan').run();
    const n = hang('SELECT COUNT(*) AS n FROM discipline_measures WHERE student_id = ?', sid)[0].n;
    assert(n === 1 && viecCua(sid).length === 1, 'chỉ lần lưu qua đường mới');
    ghi(tvv, [viecCua(sid)[0].id], 'chua_lien_he');
    const xoaHV: any = await import('../students/xoaHocVien.ts');
    for (const q of xoaHV.CAU_XOA_HOC_VIEN) if (!q.sql.startsWith('SELECT')) conn.prepare(q.sql).run(sid);
    assert(viecCua(sid).length === 0 && hang('SELECT 1 FROM viec_bao_ph_lan l JOIN viec_bao_ph v ON v.id = l.viec_id WHERE v.student_id = ?', sid).length === 0, 'đã xoá');
  }));
}
