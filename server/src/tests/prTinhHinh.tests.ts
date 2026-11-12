/**
 * PHÉP KIỂM TINH-HINH (chủ SP 12/11, đặc tả `docs/superpowers/specs/2026-11-12-tinh-hinh-hoc-tap/dac-ta.md`):
 *  · "Chỉ nhắc nhở" ngoài luật 3 vi phạm / 2 tuần, bậc, việc, số vi phạm; đổi được hai chiều.
 *  · Khác mặc định (Không nâng · Vượt bậc · Ngoài thang) → QL duyệt; lần chờ KHÔNG sinh việc TVV (N1 sửa 12/11); duyệt / quá hạn tự chốt → sinh việc.
 *  · GV báo tình hình → việc TVV "Báo PH · Tình hình học tập"; TVV hỏi GVCN hạn 3 ngày → GVCN trả lời; quyền máy chủ.
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrTinhHinhTests(t: YThucTestKit) {
  const { checkAsync, assert, conn, TODAY, P, classId, addDays } = t as any;
  console.log('\nTINH-HINH · nhắc nhở · chọn cách xử lý + tự chốt · tình hình học tập GV ↔ TVV');

  const thu = async (fn: () => void | Promise<void>) => { conn.exec('BEGIN IMMEDIATE'); try { await fn(); } finally { conn.exec('ROLLBACK'); } };
  const intake: any = await import('../classes/intake.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { boLichTuTao } = await import('./luotThu.ts');
  const viol: any = await import('../yThuc/violations.ts');
  const xu: any = await import('../yThuc/xuLy.ts');
  const yc: any = await import('../duyet/yeuCau.ts');
  const bp: any = await import('../yThuc/baoPhTvv.ts');
  const th: any = await import('../yThuc/tinhHinh.ts');
  const { trangThaiYThuc } = await import('../yThuc/trangThai.ts');
  const { myWork } = await import('../worklist/mywork.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const require_board: any = await import('../yThuc/board.ts');
  const shared: any = await import('../../../shared/domain/index.ts');
  const hang = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const gvbm = P.w1Teacher; const gvcn = P.coreTeacher; const ql = P.mbManager;
  let dem = 0;
  const tvv = (() => {
    const uid = accounts.createAccount(P.admin, { email: `tinhhinh.tvv${accounts.EMAIL_SUFFIX}`, password: 'matkhau-tinhhinh', fullName: 'TVV TINHHINH', roles: [{ role: 'consultant', branches: ['MB'] }] }).userId as number;
    return loadPrincipal(uid);
  })();
  const moiEm = (): number => {
    const ten = `TINHHINH em ${++dem}-${Math.random().toString(36).slice(2, 6)}`;
    intake.commitIntake(P.admin, { classId: classId('MB FT 101'), rows: [{ fullName: ten, target: 7, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `tinhhinh-${ten}` } as any);
    const st = conn.prepare('SELECT id FROM students WHERE full_name = ?').get(ten) as any;
    const cy = conn.prepare("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'").get(st.id) as any;
    boLichTuTao(conn, cy.id);
    conn.prepare('UPDATE students SET consultant_user_id = ? WHERE id = ?').run(tvv.userId, st.id);
    return st.id as number;
  };
  const ghi = (sid: number, ngay: number, chiNhac = false) =>
    viol.recordViolation(gvbm, { studentId: sid, category: 'homework', ten: `Không làm bài tập ${ngay}`, occurredOn: addDays(TODAY, -ngay), chiNhac }).violation.id as number;
  const em = (sid: number) => { xoaNho(); return trangThaiYThuc([sid]).get(sid)!; };
  const theYc = (mid: number) => hang(`SELECT * FROM yeu_cau_duyet WHERE loai = 'y_thuc' AND doi_tuong_id = ? ORDER BY id DESC`, mid)[0];
  const viecCuaXl = (mid: number) => hang('SELECT * FROM viec_bao_ph WHERE measure_id = ?', mid);
  const guiDx = (sid: number, kind: string, vIds: number[]) => {
    const nhap = xu.deXuat(gvcn, sid, { kind, violationIds: vIds, note: 'Lý do đề xuất đủ dài để gửi QL' });
    xu.guiDeXuat(gvcn, nhap.id);
    return nhap.id as number;
  };

  await checkAsync('TH-1 · 3 nhắc nhở trong 2 tuần: không bắt buộc, không vào trạng thái / việc; 3 vi phạm thì có', () => thu(() => {
    const sid = moiEm();
    for (const d of [1, 2, 3]) ghi(sid, d, true);
    const e = em(sid);
    assert(e.soBatBuoc === 0 && e.soMoi === 0 && e.dsViPham.length === 0 && e.nhom === null, JSON.stringify({ bb: e.soBatBuoc, moi: e.soMoi, n: e.dsViPham.length }));
    const v = viol.violationsOfStudents([sid]);
    assert(v.length === 3 && v.every((x: any) => x.chiNhac && x.nhanTrangThai === 'Nhắc nhở' && !x.han), 'dòng thời gian vẫn có nhắc nhở');
    const sid2 = moiEm();
    for (const d of [1, 2, 3]) ghi(sid2, d);
    assert(em(sid2).soBatBuoc === 3, 'vi phạm thường vẫn bắt buộc');
  }));

  await checkAsync('TH-2 · Đổi Nhắc nhở → Vi phạm tính luật lại; vi phạm đã trong lần xử lý không đổi thành nhắc nhở được', () => thu(() => {
    const sid = moiEm();
    const ids = [1, 2, 3].map((d) => ghi(sid, d, true));
    viol.editViolation(gvcn, ids[0], { chiNhac: false }); viol.editViolation(gvcn, ids[1], { chiNhac: false }); viol.editViolation(gvcn, ids[2], { chiNhac: false });
    assert(em(sid).soBatBuoc === 3, 'đổi lại vi phạm → bắt buộc');
    xu.xacNhanXuLy(gvcn, sid, { violationIds: ids, performedOn: TODAY, note: 'Đã đưa Report 1 cho em' });
    let loi = '';
    try { viol.editViolation(gvcn, ids[0], { chiNhac: true }); } catch (e: any) { loi = e.message; }
    assert(/lần xử lý/.test(loi), loi);
  }));

  await checkAsync('TH-3 · Vượt bậc (bậc 0 → WL 1) gửi QL: chưa sinh việc TVV; Duyệt → sinh việc, thẻ ghi "Vượt bậc"', () => thu(() => {
    const sid = moiEm();
    const mid = guiDx(sid, 'wl_1', [ghi(sid, 1)]);
    assert(viecCuaXl(mid).length === 0, 'chờ QL: chưa có việc TVV');
    assert(JSON.parse(theYc(mid).du_lieu).cach === 'vuot', theYc(mid).du_lieu);
    yc.duyetYeuCau(ql, theYc(mid).id);
    const v = viecCuaXl(mid);
    assert(v.length === 1 && v[0].trang_thai === 'mo', 'duyệt → việc TVV');
    assert(hang('SELECT status FROM discipline_measures WHERE id = ?', mid)[0].status === 'da_duyet', 'chờ Đã thực hiện');
  }));

  await checkAsync('TH-4 · Quá hạn 5 ngày QL chưa duyệt → tự chốt theo GVCN (tu_dong), sinh việc TVV một lần; quét lại không sinh thêm', () => thu(() => {
    const sid = moiEm();
    const mid = guiDx(sid, 'wl_1', [ghi(sid, 1)]);
    const han = theYc(mid).han_duyet as string;
    xu.quetYThucHetHan(conn, han);
    assert(theYc(mid).trang_thai === 'cho', 'đúng ngày hạn: chưa chốt');
    assert(xu.quetYThucHetHan(conn, addDays(han, 1)) >= 1, 'sau hạn: chốt');
    const y = theYc(mid);
    assert(y.trang_thai === 'tu_dong' && /giữ quyết định GVCN/.test(y.ly_do_dong), JSON.stringify(y));
    assert(viecCuaXl(mid).length === 1 && hang('SELECT status FROM discipline_measures WHERE id = ?', mid)[0].status === 'da_duyet', 'chốt → da_duyet + việc');
    xu.quetYThucHetHan(conn, addDays(han, 2));
    assert(viecCuaXl(mid).length === 1 && theYc(mid).trang_thai === 'tu_dong', 'quét lại không đổi');
  }));

  await checkAsync('TH-5 · Từ chối khác mặc định: không việc TVV; mặc định (Nâng 1 bậc) vẫn sinh việc ngay', () => thu(() => {
    const sid = moiEm();
    const mid = guiDx(sid, 'wl_1', [ghi(sid, 1)]);
    yc.tuChoiYeuCau(ql, theYc(mid).id, 'Chưa đủ căn cứ vượt bậc');
    assert(viecCuaXl(mid).length === 0, 'từ chối: không việc');
    const sid2 = moiEm();
    const x = xu.xacNhanXuLy(gvcn, sid2, { violationIds: [ghi(sid2, 1)], performedOn: TODAY, note: 'Đã đưa Report 1 cho em' });
    assert(viecCuaXl(x.id).length === 1, 'mặc định: việc TVV ngay');
  }));

  await checkAsync('TH-6 · GV báo tình hình → việc TVV "Báo PH · Tình hình học tập"; TVV ghi Đã báo PH → xong, về GV; Rút sau khi có kết quả → 400', () => thu(() => {
    const sid = moiEm();
    const { ids: [id] } = th.guiTinhHinh(gvbm, { chieu: 'gv_tvv', studentIds: [sid], noiDung: 'Em nghỉ 3 buổi Writing, bài W2 tụt' });
    xoaNho();
    const viec = ((myWork(tvv, {}) as any).items as any[]).find((x) => x.studentId === sid && x.group === 'bao_ph_yt');
    assert(viec && /Tình hình học tập/.test(viec.tieuDe), JSON.stringify(viec));
    bp.ghiKetQuaBaoPh(tvv, { viecIds: [viec.viecId], ketQua: 'da_bao', ghiChu: 'Đã báo mẹ, mẹ nhắc em đi học đủ' });
    const v = th.tinhHinhCuaEm(gvbm, [sid])[0];
    assert(v.trangThai === 'xong' && v.baoPh.lan.ketQua === 'da_bao' && /mẹ nhắc/.test(v.baoPh.lan.noiDung), JSON.stringify(v));
    let loi = '';
    try { th.rutTinhHinh(gvbm, id); } catch (e: any) { loi = e.message; }
    assert(/kết quả/.test(loi), loi);
  }));

  await checkAsync('TH-7 · Rút khi chưa có kết quả → việc TVV "Đã bỏ"; Hoàn tác ngay sau gửi → xoá hẳn', () => thu(() => {
    const sid = moiEm();
    const { ids: [a] } = th.guiTinhHinh(gvbm, { chieu: 'gv_tvv', studentIds: [sid], noiDung: 'Em tiến bộ rõ ở Speaking' });
    th.rutTinhHinh(gvbm, a);
    assert(hang('SELECT trang_thai FROM viec_bao_ph WHERE tinh_hinh_id = ?', a)[0].trang_thai === 'bo', 'rút → bỏ việc');
    const { ids: [b] } = th.guiTinhHinh(gvbm, { chieu: 'gv_tvv', studentIds: [sid], noiDung: 'Gửi nhầm em, hoàn tác ngay' });
    assert(th.rutTinhHinh(gvbm, b, { hoanTac: true }).xoa === true, 'hoàn tác');
    assert(!hang('SELECT 1 FROM tinh_hinh_hoc_tap WHERE id = ?', b).length && !hang('SELECT 1 FROM viec_bao_ph WHERE tinh_hinh_id = ?', b).length, 'xoá hẳn');
  }));

  await checkAsync('TH-9 · Mốc dưới tên em (bảng lớp) = thang của em (hồ sơ HV) — cùng một hàm; em đã xử lý, không còn việc chờ vẫn có mốc', () => thu(() => {
    const board: any = require_board;
    const sid = moiEm();
    xu.xacNhanXuLy(gvcn, sid, { violationIds: [ghi(sid, 1)], performedOn: TODAY, note: 'Đã đưa Report 1 cho em' });
    xoaNho();
    const lop = board.bangYThucLop(gvcn, classId('MB FT 101'));
    const e = lop.emLop.find((x: any) => x.studentId === sid);
    const hv = xu.yThucHocVien(gvcn, sid);
    assert(e && e.bac === hv.bac && e.bac === 1 && e.bacNhan === hv.bacNhan, JSON.stringify({ e, bac: hv.bac }));
    const { nhanMocViPham } = shared;
    assert(nhanMocViPham(1) === 'REPORT 1' && nhanMocViPham(3) === 'WARNING LETTER 1' && nhanMocViPham(4) === 'REPORT 4 + MEETING CX/GĐCN' && nhanMocViPham(0) === null,
      [1, 3, 4].map((b) => nhanMocViPham(b)).join(' | '));
    for (const x of lop.emLop) assert(x.bac === xu.yThucHocVien(gvcn, x.studentId).bac, `em ${x.studentId}`);
  }));

  await checkAsync('TH-8 · TVV hỏi GVCN: hạn 3 ngày, việc GVCN; hỏi trùng → 409; GVBM không trả lời được; GVCN trả lời → TVV đọc; TVV không gửi chiều GV', () => thu(() => {
    const sid = moiEm();
    const { ids: [id] } = th.guiTinhHinh(tvv, { chieu: 'tvv_gvcn', studentIds: [sid], noiDung: 'PH hỏi em có theo kịp Writing không' });
    assert(hang('SELECT han FROM tinh_hinh_hoc_tap WHERE id = ?', id)[0].han === addDays(TODAY, 2), 'hạn = hỏi + 2');
    xoaNho();
    assert(((myWork(gvcn, {}) as any).items as any[]).some((x) => x.key === `yt_hoi_tinh_hinh:${id}` && x.mine), 'việc GVCN');
    let loi = '';
    try { th.guiTinhHinh(tvv, { chieu: 'tvv_gvcn', studentIds: [sid], noiDung: 'Hỏi lần nữa cho chắc nhé' }); } catch (e: any) { loi = String(e.status ?? e.message); }
    assert(/409|đang hỏi/.test(loi), loi);
    let cam = false;
    try { th.traLoiTinhHinh(gvbm, id, { traLoi: 'GVBM trả lời thay' }); } catch { cam = true; }
    assert(cam, 'GVBM không trả lời');
    th.traLoiTinhHinh(gvcn, id, { traLoi: 'Cô Writing nói em theo kịp, cần thêm Task 2' });
    const v = th.tinhHinhCuaEm(tvv, [sid])[0];
    assert(v.trangThai === 'xong' && /Task 2/.test(v.traLoi), JSON.stringify(v));
    let camTvv = false;
    try { th.guiTinhHinh(tvv, { chieu: 'gv_tvv', studentIds: [sid], noiDung: 'TVV gửi chiều GV thử' }); } catch { camTvv = true; }
    assert(camTvv, 'TVV không có quyền chiều gv_tvv');
  }));

  await checkAsync('TH-10 · Mô tả xử lý ≤ 300 (mockup v20 D1, N35): 301 → 400 không lưu; 300 lưu được', () => thu(() => {
    const sid = moiEm();
    const v1 = ghi(sid, 1);
    let ma = 0;
    try { xu.xacNhanXuLy(gvcn, sid, { violationIds: [v1], performedOn: TODAY, note: 'x'.repeat(301) }); } catch (e: any) { ma = e.status; }
    assert(ma === 400 && !hang('SELECT id FROM discipline_measures WHERE student_id = ?', sid).length, `ma=${ma}`);
    xu.xacNhanXuLy(gvcn, sid, { violationIds: [v1], performedOn: TODAY, note: 'x'.repeat(300) });
    assert(hang('SELECT id FROM discipline_measures WHERE student_id = ?', sid).length === 1, 'lưu 300');
  }));
}
