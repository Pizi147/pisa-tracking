/** PHÉP KIỂM PR-LUI-b — đường lui Học viên & Lớp: Học lại · Mở lại lớp · làm nhiều học viên · huỷ nhiều quyết định chuyển lớp. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const doc = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

export async function runPrLuiBTests(t: YThucTestKit) {
  const { check, checkAsync, assert, conn, TODAY, P, addDays, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-LUI-b · Đường lui Học viên & Lớp');

  check('LUIb-1 · menu ⋮: "Học lại" hiện đúng khi có quyền hocLai và em đã kết thúc; GVCN không có', () => {
    const quyen = (o: Record<string, boolean>) => ({ lopHoc: { quyen: { ghiLoTrinhTiep: false, chuyenLop: false, tamDung: false, quayLai: false, ketThuc: false, luuTru: false, boLuuTru: false, ...o } } });
    const keys = (o: Record<string, boolean>, status: string) => d.mucQuanLyHocVien({ canEdit: false, cycle: null, status, ...quyen(o) }).map((m: any) => m.key);
    assert(keys({ hocLai: true, boLuuTru: true }, 'finished').join() === 'hoc-lai,bo-luu-tru', keys({ hocLai: true, boLuuTru: true }, 'finished').join());
    assert(!keys({}, 'finished').includes('hoc-lai'), 'không quyền thì không có Học lại');
    const m = d.mucQuanLyHocVien({ canEdit: false, cycle: null, status: 'finished', ...quyen({ hocLai: true }) })[0];
    assert(m.nhan === 'Học lại' && m.nhom === 'lop' && m.phu === 'về lớp cũ · lộ trình chạy tiếp', JSON.stringify(m));
  });

  check('LUIb-2 · hằng làm nhiều học viên: việc ngược đối xứng, nhãn đủ, lô 8, trần xem trước 200', () => {
    for (const v of d.VIEC_HANG_LOAT) {
      assert(d.VIEC_NGUOC[d.VIEC_NGUOC[v]] === v, `${v} ngược hai lần phải về ${v}`);
      assert(typeof d.NHAN_VIEC_HANG_LOAT[v] === 'string' && d.NHAN_VIEC_HANG_LOAT[v].length > 0, `thiếu nhãn ${v}`);
    }
    assert(d.NHAN_VIEC_HANG_LOAT['ket-thuc'] === 'Kết thúc học' && d.NHAN_VIEC_HANG_LOAT['hoc-lai'] === 'Học lại' && d.NHAN_VIEC_HANG_LOAT['huy-lenh'] === 'Huỷ chuyển lớp', 'nhãn');
    assert(d.LO_HANG_LOAT_EM === 8 && d.TOI_DA_HANG_LOAT_EM === 200 && d.KHOI_PHUC_LENH_GIO === 24, 'hằng');
  });

  // ---------------------------------------------------------------- Task 2 · Học lại, Mở lại lớp
  const svc: any = await import('../students/students.ts');
  const emDangHoc = (lop: string): number => (conn.prepare(
    `SELECT s.id FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
      WHERE e.class_id = ? AND s.status = 'active' AND s.archived_at IS NULL ORDER BY s.id LIMIT 1`).get(classId(lop)) as any).id;
  const anh = (sid: number) => JSON.stringify({
    s: conn.prepare('SELECT status, finished_at, archived_at FROM students WHERE id = ?').get(sid),
    e: conn.prepare('SELECT id, status, end_kind, class_id, ended_at FROM enrollments WHERE student_id = ? ORDER BY id').all(sid),
    c: conn.prepare('SELECT id, status, ended_at FROM learning_cycles WHERE student_id = ? ORDER BY id').all(sid),
  });
  const maLoi = (fn: () => unknown): number | null => { try { fn(); return null; } catch (e: any) { return e.status ?? 500; } };
  /** Chạy `fn` trong một giao dịch rồi ROLLBACK — phép kiểm không để lại dữ liệu (`tx` lồng = savepoint). */
  const thu = async (fn: () => void | Promise<void>) => { conn.exec('BEGIN IMMEDIATE'); try { await fn(); } finally { conn.exec('ROLLBACK'); } };

  await checkAsync('LUIb-3 · hocLai (về lớp cũ) đảo ĐÚNG Kết thúc học: học viên, ghi danh, lộ trình về nguyên trạng; có Hành trình + nhật ký', () => thu(() => {
    const sid = emDangHoc('MB FT 101');
    const truoc = anh(sid);
    svc.setStudentStatus(P.mbManager, sid, 'finished', TODAY, 'Nghỉ học');
    assert(anh(sid) !== truoc, 'Kết thúc học phải đổi dữ liệu');
    svc.hocLai(P.mbManager, sid, { lyDo: 'Bấm nhầm' });
    assert(anh(sid) === truoc, `không về nguyên trạng:\n${truoc}\n${anh(sid)}`);
    const hanhTrinh = conn.prepare(`SELECT event_type, title, detail, created_by FROM journey_events WHERE student_id = ? ORDER BY id DESC LIMIT 1`).get(sid) as any;
    assert(hanhTrinh.event_type === 'resume' && hanhTrinh.title === 'Học lại' && hanhTrinh.detail === 'Bấm nhầm' && hanhTrinh.created_by === P.mbManager.userId, JSON.stringify(hanhTrinh));
    const nk = conn.prepare(`SELECT action, before_json, after_json FROM audit_logs WHERE entity_type = 'student' AND entity_id = ? AND action = 'student.rejoin'`).get(sid) as any;
    assert(nk && JSON.parse(nk.before_json).status === 'finished' && JSON.parse(nk.after_json).status === 'active', JSON.stringify(nk));
  }));

  await checkAsync('LUIb-4 · hocLai: chỉ QL / QT; GVCN 403, QL chi nhánh khác 403; em đang học 400; ngày trước ngày kết thúc 400; ngày tương lai 400', () => thu(() => {
    const sid = emDangHoc('MB FT 101');
    assert(maLoi(() => svc.hocLai(P.mbManager, sid)) === 400, 'em đang học → 400');
    svc.setStudentStatus(P.mbManager, sid, 'finished', TODAY, 'Nghỉ học');
    assert(maLoi(() => svc.hocLai(P.coreTeacher, sid)) === 403, 'GVCN 403');
    assert(maLoi(() => svc.hocLai(P.cpManager, sid)) === 403, 'QL chi nhánh khác 403');
    assert(maLoi(() => svc.hocLai(P.mbManager, sid, { date: addDays(TODAY, -3) })) === 400, 'ngày trước ngày kết thúc');
    assert(maLoi(() => svc.hocLai(P.mbManager, sid, { date: addDays(TODAY, 3) })) === 400, 'ngày tương lai');
    svc.hocLai(P.admin, sid);   // Quản trị làm được
    assert((conn.prepare('SELECT status FROM students WHERE id = ?').get(sid) as any).status === 'active', 'QT học lại được');
  }));

  await checkAsync('LUIb-5 · Case đã đóng "Học viên kết thúc khoá" GIỮ đóng khi học lại', () => thu(() => {
    const row = conn.prepare(`SELECT s.id FROM students s JOIN sos_cases c ON c.student_id = s.id AND c.status != 'done'
        JOIN enrollments e ON e.student_id = s.id AND e.status = 'active' WHERE s.status = 'active' AND e.class_id = ? ORDER BY s.id LIMIT 1`).get(classId('MB FT 101')) as any;
    assert(row, 'cần một em có Case mở ở MB FT 101');
    const sid = row.id as number;
    svc.setStudentStatus(P.mbManager, sid, 'finished', TODAY, 'Nghỉ học');
    const dong = (conn.prepare(`SELECT COUNT(*) n FROM sos_cases WHERE student_id = ? AND system_close_reason = 'course_ended'`).get(sid) as any).n;
    assert(dong > 0, 'Kết thúc học phải đóng Case');
    svc.hocLai(P.mbManager, sid);
    assert((conn.prepare(`SELECT COUNT(*) n FROM sos_cases WHERE student_id = ? AND system_close_reason = 'course_ended' AND status = 'done'`).get(sid) as any).n === dong, 'Case đã đóng phải giữ đóng');
  }));

  await checkAsync('LUIb-6 · moLaiLop: lớp kết thúc → đang hoạt động, ghi nhật ký; QL đúng chi nhánh / QT được; GVCN, QL khác chi nhánh 403; lớp chưa kết thúc 400', () => thu(async () => {
    const xk: any = await import('../classes/xoaKetThucLop.ts');
    const lop = classId('MB FOU 12');
    conn.prepare(`UPDATE classes SET status = 'finished', finished_at = ? WHERE id = ?`).run(TODAY, lop);
    assert(maLoi(() => xk.moLaiLop(P.normalCoreTeacher, lop)) === 403, 'GVCN 403');
    assert(maLoi(() => xk.moLaiLop(P.cpManager, lop)) === 403, 'QL chi nhánh khác 403');
    xk.moLaiLop(P.mbManager, lop, { lyDo: 'Mở nhầm lớp' });
    const c = conn.prepare('SELECT status, finished_at FROM classes WHERE id = ?').get(lop) as any;
    assert(c.status === 'active' && c.finished_at === null, JSON.stringify(c));
    const nk = conn.prepare(`SELECT before_json, after_json FROM audit_logs WHERE entity_type = 'class' AND entity_id = ? AND action = 'class.reopened' ORDER BY id DESC LIMIT 1`).get(lop) as any;
    assert(nk && JSON.parse(nk.before_json).status === 'finished' && JSON.parse(nk.after_json).lyDo === 'Mở nhầm lớp', JSON.stringify(nk));
    assert(maLoi(() => xk.moLaiLop(P.mbManager, lop)) === 400, 'lớp đang hoạt động → 400');
    conn.prepare(`UPDATE classes SET status = 'finished', finished_at = ? WHERE id = ?`).run(TODAY, lop);
    xk.moLaiLop(P.admin, lop);
    assert((conn.prepare('SELECT status FROM classes WHERE id = ?').get(lop) as any).status === 'active', 'QT mở lại được');
  }));

  await checkAsync('LUIb-7 · hocLai khi lớp cũ đã kết thúc: không moLaiLop → 400 (không đổi gì); có moLaiLop → lớp mở lại cùng lúc', () => thu(() => {
    const sid = emDangHoc('MB FOU 12');
    const lop = classId('MB FOU 12');
    svc.setStudentStatus(P.mbManager, sid, 'finished', TODAY, 'Nghỉ học');
    conn.prepare(`UPDATE classes SET status = 'finished', finished_at = ? WHERE id = ?`).run(TODAY, lop);
    assert(maLoi(() => svc.hocLai(P.mbManager, sid)) === 400, 'lớp đã kết thúc, không chọn mở lại → 400');
    assert((conn.prepare('SELECT status FROM students WHERE id = ?').get(sid) as any).status === 'finished', '400 không được đổi gì');
    assert(maLoi(() => svc.hocLai(P.mbManager, sid, { moLaiLop: true })) === null, 'có moLaiLop phải xong');
    assert((conn.prepare('SELECT status FROM classes WHERE id = ?').get(lop) as any).status === 'active', 'lớp phải mở lại');
    assert((conn.prepare('SELECT status FROM students WHERE id = ?').get(sid) as any).status === 'active', 'em phải đang học');
  }));

  await checkAsync('LUIb-7b · hocLai SANG LỚP MỚI: ghi danh + lộ trình cũ ở nguyên, lộ trình mới active ở lớp mới, ra khỏi Lưu trữ; sang FT từ lớp thường cần Target; lớp mới không hợp lệ 400', () => thu(() => {
    const sid = emDangHoc('MB FOU 12');
    const lopMoiThuong = (conn.prepare(`SELECT id FROM classes WHERE status = 'active' AND is_fast_track = 0 AND id != ? ORDER BY id LIMIT 1`).get(classId('MB FOU 12')) as any).id as number;
    const lopFt = classId('MB FT 101');
    svc.setStudentStatus(P.mbManager, sid, 'finished', TODAY, 'Nghỉ học');
    const cuIds = (conn.prepare('SELECT id FROM learning_cycles WHERE student_id = ? ORDER BY id').all(sid) as any[]).map((x) => x.id);
    assert(maLoi(() => svc.hocLai(P.mbManager, sid, { lopMoiId: classId('MB FOU 12') })) === 400, 'lớp mới = lớp cũ → 400');
    assert(maLoi(() => svc.hocLai(P.mbManager, sid, { lopMoiId: lopFt })) === 400, 'sang FT không Target → 400');
    svc.hocLai(P.mbManager, sid, { lopMoiId: lopMoiThuong, lyDo: 'Học lại ở lớp khác' });
    const s = conn.prepare('SELECT status, archived_at, finished_at FROM students WHERE id = ?').get(sid) as any;
    assert(s.status === 'active' && s.archived_at === null && s.finished_at === null, JSON.stringify(s));
    const e = conn.prepare('SELECT class_id, status FROM enrollments WHERE student_id = ? ORDER BY id').all(sid) as any[];
    assert(e.at(-1).class_id === lopMoiThuong && e.at(-1).status === 'active' && e.at(-2).status === 'completed', JSON.stringify(e));
    const c = conn.prepare('SELECT id, status FROM learning_cycles WHERE student_id = ? ORDER BY id').all(sid) as any[];
    assert(c.at(-1).status === 'active' && !cuIds.includes(c.at(-1).id), 'lộ trình mới phải active');
    assert(JSON.stringify(c.slice(0, -1).map((x: any) => x.id)) === JSON.stringify(cuIds) && c.slice(0, -1).every((x: any) => x.status !== 'active'), 'lộ trình cũ còn đó, không active');
    const hanhTrinh = conn.prepare(`SELECT title, detail FROM journey_events WHERE student_id = ? AND event_type = 'resume' ORDER BY id DESC LIMIT 1`).get(sid) as any;
    assert(hanhTrinh.title === 'Học lại' && hanhTrinh.detail.includes('sang lớp'), JSON.stringify(hanhTrinh));
  }));

  /* lớp mới là FT, em từ lớp thường, có Target → được */
  await checkAsync('LUIb-7c · hocLai sang Fast Track có Target: lộ trình FT mới mang Target đã nhập', () => thu(() => {
    const sid = emDangHoc('MB FOU 12');
    svc.setStudentStatus(P.mbManager, sid, 'finished', TODAY, 'Nghỉ học');
    svc.hocLai(P.mbManager, sid, { lopMoiId: classId('MB FT 101'), mucTieu: 6.5 });
    const c = conn.prepare(`SELECT target_score, khong_cam_ket, route FROM learning_cycles WHERE student_id = ? AND status = 'active'`).get(sid) as any;
    assert(c.target_score === 6.5 && c.khong_cam_ket === 0 && c.route, JSON.stringify(c));
  }));

  // ---------------------------------------------------------------- Task 3 · làm nhiều học viên
  const hl: any = await import('../students/hangLoat.ts');
  const lenhSvc: any = await import('../classes/lenhChuyen.ts');
  const dangHocTrong = (lop: string, n: number): number[] => (conn.prepare(
    `SELECT s.id FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
      WHERE e.class_id = ? AND s.status = 'active' AND s.archived_at IS NULL ORDER BY s.id LIMIT ?`).all(classId(lop), n) as any[]).map((r) => r.id as number);

  await checkAsync('LUIb-8 · làm nhiều học viên: xem trước đếm đúng Case / PA và bỏ qua học viên không làm được; chạy Kết thúc học rồi Hoàn tác (Học lại) về nguyên trạng', () => thu(() => {
    const ids = dangHocTrong('MB FT 101', 3);
    assert(ids.length === 3, 'cần 3 học viên đang học');
    svc.setStudentStatus(P.mbManager, ids[2], 'finished', TODAY, 'Nghỉ học');   // học viên này "đã kết thúc rồi"
    const truoc = ids.slice(0, 2).map(anh).join('|');
    const xt = hl.xemTruoc(P.mbManager, { viec: 'ket-thuc', studentIds: ids });
    assert(xt.rows.length === 3 && xt.tong.duoc === 2 && xt.tong.boQua === 1, JSON.stringify(xt.tong));
    assert(xt.rows.find((r: any) => r.studentId === ids[2]).lyDoBo === 'Đã kết thúc học', 'học viên đã kết thúc phải bị bỏ qua có lý do');
    const caseMo = (conn.prepare(
      `SELECT COUNT(*) n FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
        WHERE COALESCE(sc.student_id, a.student_id) IN (?, ?) AND sc.status != 'done'`).get(ids[0], ids[1]) as any).n;
    assert(xt.tong.caseDong === caseMo, `Case đóng ${xt.tong.caseDong} ≠ ${caseMo}`);
    const kq = hl.chay(P.mbManager, { viec: 'ket-thuc', studentIds: ids.slice(0, 2), lyDo: 'Cuối khoá' });
    assert(kq.ok.length === 2 && kq.failed.length === 0, JSON.stringify(kq));
    assert(ids.slice(0, 2).every((id) => (conn.prepare('SELECT status FROM students WHERE id = ?').get(id) as any).status === 'finished'), 'cả hai phải kết thúc');
    const nguoc = hl.chay(P.mbManager, { viec: 'hoc-lai', studentIds: kq.ok, moLaiLop: true });
    assert(nguoc.ok.length === 2, JSON.stringify(nguoc));
    assert(ids.slice(0, 2).map(anh).join('|') === truoc, 'Hoàn tác phải về nguyên trạng');
  }));

  await checkAsync('LUIb-9 · làm nhiều học viên: lỗi MỘT học viên không cuộn lại học viên khác; ngoài quyền ghi "message"; GVCN 403 cả lô; > 8 một lần ghi 400; > 200 xem trước 400', () => thu(() => {
    const trongMb = dangHocTrong('MB FT 101', 2);
    const ngoai = (conn.prepare(`SELECT s.id FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
        JOIN classes c ON c.id = e.class_id JOIN branches b ON b.id = c.branch_id WHERE b.code != 'MB' AND s.status = 'active' ORDER BY s.id LIMIT 1`).get() as any).id as number;
    const kq = hl.chay(P.mbManager, { viec: 'ket-thuc', studentIds: [trongMb[0], ngoai, trongMb[1]], lyDo: 'Cuối khoá' });
    assert(kq.ok.join() === [trongMb[0], trongMb[1]].join() && kq.failed.length === 1 && kq.failed[0].studentId === ngoai && kq.failed[0].message === 'Ngoài phạm vi của bạn.', JSON.stringify(kq));
    assert((conn.prepare('SELECT status FROM students WHERE id = ?').get(ngoai) as any).status === 'active', 'học viên ngoài quyền không được đổi');
    assert(maLoi(() => hl.chay(P.coreTeacher, { viec: 'ket-thuc', studentIds: dangHocTrong('MB FOU 12', 2), lyDo: 'x' })) === 403, 'GVCN 403 cả lô');
    assert(maLoi(() => hl.chay(P.mbManager, { viec: 'ket-thuc', studentIds: Array.from({ length: 9 }, (_, i) => i + 1), lyDo: 'x' })) === 400, '9 học viên một lần ghi');
    assert(maLoi(() => hl.xemTruoc(P.mbManager, { viec: 'ket-thuc', studentIds: Array.from({ length: 201 }, (_, i) => i + 1) })) === 400, '201 học viên xem trước');
    assert(maLoi(() => hl.chay(P.mbManager, { viec: 'ket-thuc', studentIds: [] })) === 400 && maLoi(() => hl.chay(P.mbManager, { viec: 'xoa', studentIds: [1] })) === 400, 'rỗng / việc lạ');
    assert(maLoi(() => hl.chay(P.mbManager, { viec: 'ket-thuc', studentIds: dangHocTrong('MB FOU 12', 1) })) === 400, 'Kết thúc học không lý do → 400');
  }));

  await checkAsync('LUIb-10 · Lưu trữ / Bỏ lưu trữ nhiều học viên: chỉ học viên đã kết thúc; Bỏ lưu trữ không làm học viên học lại', () => thu(() => {
    const sid = dangHocTrong('MB FT 101', 1)[0];
    assert(hl.xemTruoc(P.mbManager, { viec: 'luu-tru', studentIds: [sid] }).rows[0].lyDoBo === 'Chưa kết thúc học', 'học viên đang học không lưu trữ được');
    hl.chay(P.mbManager, { viec: 'ket-thuc', studentIds: [sid], lyDo: 'Cuối khoá' });
    assert(hl.chay(P.mbManager, { viec: 'bo-luu-tru', studentIds: [sid] }).ok.length === 1, 'bỏ lưu trữ');
    const s = conn.prepare('SELECT status, archived_at FROM students WHERE id = ?').get(sid) as any;
    assert(s.status === 'finished' && s.archived_at === null, `bỏ lưu trữ không phải học lại: ${JSON.stringify(s)}`);
    assert(hl.chay(P.mbManager, { viec: 'luu-tru', studentIds: [sid] }).ok.length === 1, 'lưu trữ lại');
    assert((conn.prepare('SELECT archived_at FROM students WHERE id = ?').get(sid) as any).archived_at !== null, 'đã lưu trữ');
  }));

  // ---------------------------------------------------------------- Task 4 · huỷ nhiều quyết định chuyển lớp
  const taoLenhChoEm = (n: number) => {
    const nguon = classId('MB FT 101');
    const em = (conn.prepare(`SELECT s.id FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
        WHERE e.class_id = ? AND s.status = 'active' AND s.archived_at IS NULL AND NOT EXISTS (SELECT 1 FROM lenh_chuyen_lop l WHERE l.student_id = s.id AND l.trang_thai = 'cho')
        ORDER BY s.id LIMIT 3`).all(nguon) as any[]).map((r) => r.id as number);
    assert(em.length === 3, 'cần 3 học viên chưa có quyết định');
    const tuan = d.tuanChonDuoc(TODAY)[0];
    const r = lenhSvc.raLenh(P.mbManager, { lopNguonId: nguon, boiCanh: 'giua-khoa', tuanChung: null, dongs: em.slice(0, n).map((studentId: number) => ({
      studentId, huong: 'bao_luu', tuan, lyDo: 'Đi xa', ngayXemLai: addDays(TODAY, 60) })) });
    assert(r.ok.length === n && r.failed.length === 0, JSON.stringify(r));
    return { nguon, em };
  };
  const idLenh = (sid: number) => (conn.prepare(`SELECT id FROM lenh_chuyen_lop WHERE student_id = ? AND trang_thai = 'cho'`).get(sid) as any).id as number;

  await checkAsync('LUIb-11 · huyNhieuLenh: lý do ≥ 3; QL khác chi nhánh 403; lệnh lỗi không cuộn lại lệnh khác; MỘT chuông mỗi người nhận. khoiPhucLenh: chỉ lệnh do người huỷ, còn tương lai, học viên chưa có lệnh khác, trong 24 giờ', () => thu(() => {
    const { em } = taoLenhChoEm(3);
    const ids = em.map(idLenh);
    assert(maLoi(() => lenhSvc.huyNhieuLenh(P.mbManager, ids, 'ab')) === 400, 'lý do < 3 ký tự');
    assert(maLoi(() => lenhSvc.huyNhieuLenh(P.cpManager, ids, 'Đã đổi ý')) === 403, 'QL chi nhánh khác 403 cả lô');
    conn.prepare(`DELETE FROM notifications WHERE kind = 'huy_lenh'`).run();
    const kq = lenhSvc.huyNhieuLenh(P.mbManager, [...ids, 999999], 'Đã đổi ý');
    assert(kq.ok.length === 3 && kq.failed.length === 1 && kq.failed[0].id === 999999, JSON.stringify(kq));
    assert(ids.every((id) => (conn.prepare('SELECT trang_thai FROM lenh_chuyen_lop WHERE id = ?').get(id) as any).trang_thai === 'huy'), 'cả ba phải huỷ');
    const chuong = conn.prepare(`SELECT user_id, COUNT(*) n FROM notifications WHERE kind = 'huy_lenh' GROUP BY user_id`).all() as any[];
    assert(chuong.every((c) => c.n === 1), `một chuông mỗi người nhận, không một chuông mỗi học viên: ${JSON.stringify(chuong)}`);
    /* Khôi phục */
    assert(maLoi(() => lenhSvc.khoiPhucLenh(P.cpManager, ids)) === 403, 'QL chi nhánh khác 403');
    const kp = lenhSvc.khoiPhucLenh(P.mbManager, ids);
    assert(kp.ok.length === 3 && kp.failed.length === 0, JSON.stringify(kp));
    assert(ids.every((id) => { const l = conn.prepare('SELECT trang_thai, huy_boi, huy_luc, ly_do_huy FROM lenh_chuyen_lop WHERE id = ?').get(id) as any; return l.trang_thai === 'cho' && l.huy_boi === null && l.huy_luc === null && l.ly_do_huy === null; }), 'phải về chờ, xoá dấu huỷ');
    /* Huỷ lại; lệnh [0] do máy huỷ; học viên [1] có lệnh khác; lệnh [2] quá 24 giờ */
    lenhSvc.huyNhieuLenh(P.mbManager, ids, 'Đã đổi ý');
    conn.prepare(`UPDATE lenh_chuyen_lop SET huy_boi = NULL WHERE id = ?`).run(ids[0]);
    lenhSvc.raLenh(P.mbManager, { lopNguonId: classId('MB FT 101'), boiCanh: 'giua-khoa', tuanChung: null, dongs: [{ studentId: em[1], huong: 'bao_luu', tuan: d.tuanChonDuoc(TODAY)[0], lyDo: 'Mới', ngayXemLai: addDays(TODAY, 60) }] });
    const kp2 = lenhSvc.khoiPhucLenh(P.mbManager, ids.slice(0, 2));
    const lyDoLoi = Object.fromEntries(kp2.failed.map((f: any) => [f.id, f.message]));
    assert(kp2.ok.length === 0 && lyDoLoi[ids[0]] === 'Quyết định do hệ thống huỷ — không khôi phục được.' && lyDoLoi[ids[1]] === 'Học viên đã có quyết định chuyển lớp khác.', JSON.stringify(kp2));
    conn.prepare(`UPDATE lenh_chuyen_lop SET huy_luc = ? WHERE id = ?`).run(new Date(Date.now() - 25 * 3600_000).toISOString(), ids[2]);
    assert(lenhSvc.khoiPhucLenh(P.mbManager, [ids[2]]).failed[0].message === 'Đã quá 24 giờ — ra quyết định mới.', 'quá 24 giờ');
  }));

  await checkAsync('LUIb-11b · Huỷ chuyển lớp qua làm nhiều học viên: xem trước theo hướng, huỷ rồi Khôi phục về đúng quyết định; học viên không có quyết định → bỏ qua có lý do', () => thu(() => {
    const { em } = taoLenhChoEm(2);
    const xt = hl.xemTruoc(P.mbManager, { viec: 'huy-lenh', studentIds: em });
    assert(xt.tong.duoc === 2 && xt.tong.boQua === 1 && xt.tong.theoHuong.bao_luu === 2, JSON.stringify(xt.tong));
    assert(xt.rows.find((r: any) => r.studentId === em[2]).lyDoBo === 'Chưa có quyết định chuyển lớp', 'học viên không có quyết định phải bị bỏ qua');
    assert(maLoi(() => hl.chay(P.mbManager, { viec: 'huy-lenh', studentIds: em, lyDo: 'ab' })) === 400, 'lý do < 3 ký tự');
    const kq = hl.chay(P.mbManager, { viec: 'huy-lenh', studentIds: em, lyDo: 'Đã đổi ý' });
    assert(kq.ok.length === 2 && kq.failed.length === 1 && kq.failed[0].studentId === em[2], JSON.stringify(kq));
    assert((conn.prepare(`SELECT COUNT(*) n FROM lenh_chuyen_lop WHERE student_id IN (${em[0]}, ${em[1]}) AND trang_thai = 'cho'`).get() as any).n === 0, 'cả hai phải huỷ');
    const kp = hl.chay(P.mbManager, { viec: 'khoi-phuc-lenh', studentIds: kq.ok });
    assert(kp.ok.length === 2 && kp.failed.length === 0, JSON.stringify(kp));
    assert((conn.prepare(`SELECT COUNT(*) n FROM lenh_chuyen_lop WHERE student_id IN (${em[0]}, ${em[1]}) AND trang_thai = 'cho'`).get() as any).n === 2, 'cả hai phải về chờ');
  }));

  // ---------------------------------------------------------------- Task 5 · cờ ở Lưu trữ, Quản lý kết thúc lớp
  await checkAsync('LUIb-12 · Lưu trữ: cờ coTheMoLai (lớp, QL đúng chi nhánh / QT) và coTheHocLai (học viên); GVCN false', () => thu(async () => {
    const lt: any = await import('../classes/luuTru.ts');
    const lop = classId('MB FOU 12');
    conn.prepare(`UPDATE classes SET status = 'finished', finished_at = ? WHERE id = ?`).run(TODAY, lop);
    const dong = (p: any) => lt.danhSachLuuTru(p, {}).lop.find((l: any) => l.id === lop);
    assert(dong(P.mbManager)?.coTheMoLai === true && dong(P.admin)?.coTheMoLai === true, 'QL / QT thấy nút Mở lại');
    assert(dong(P.normalCoreTeacher) === undefined || dong(P.normalCoreTeacher).coTheMoLai === false, 'GVCN không có Mở lại');
    const sid = dangHocTrong('MB FT 101', 1)[0];
    svc.setStudentStatus(P.mbManager, sid, 'finished', TODAY, 'Nghỉ học');
    const hv = (p: any) => lt.danhSachLuuTru(p, {}).hocVien.find((x: any) => x.id === sid);
    assert(hv(P.mbManager).coTheHocLai === true && hv(P.admin).coTheHocLai === true, 'QL / QT thấy nút Học lại');
  }));

  await checkAsync('LUIb-13 · Quản lý kết thúc lớp không còn học viên được, mở lại được; GVCN 403; Xoá lớp vẫn chỉ Quản trị; viewer.coTheMoLaiLop theo quyền', () => thu(async () => {
    const xk: any = await import('../classes/xoaKetThucLop.ts');
    const cls: any = await import('../classes/classes.ts');
    const lop = classId('MB FOU 12');
    conn.prepare(`UPDATE enrollments SET status = 'transferred' WHERE class_id = ? AND status = 'active'`).run(lop);   // trong giao dịch → cuộn lại
    assert(maLoi(() => xk.ketThucLop(P.normalCoreTeacher, lop)) === 403, 'GVCN 403');
    xk.ketThucLop(P.mbManager, lop);
    assert((conn.prepare('SELECT status FROM classes WHERE id = ?').get(lop) as any).status === 'finished', 'QL kết thúc được lớp không còn học viên');
    assert(cls.classOverview(P.mbManager, lop).viewer.coTheMoLaiLop === true && cls.classOverview(P.normalCoreTeacher, lop).viewer.coTheMoLaiLop === false, 'coTheMoLaiLop');
    xk.moLaiLop(P.mbManager, lop);
    assert(cls.classOverview(P.mbManager, lop).viewer.coTheKetThucLop === true, 'coTheKetThucLop');
    assert(maLoi(() => xk.xoaLop(P.mbManager, lop, { maLop: 'MB FOU 12' })) === 403, 'Xoá lớp vẫn chỉ Quản trị');
  }));

  // ---------------------------------------------------------------- Task 7 · web Mở lại lớp
  check('LUIb-15 · web Mở lại lớp: panel (lý do tuỳ chọn, Hoàn tác = Kết thúc lớp), mục ⋮ hồ sơ lớp đã kết thúc, nút Mở lại ở Lưu trữ; Quản lý cũng thấy Kết thúc lớp', () => {
    const p = doc('web/src/modules/classes/XoaKetThucLopPanel.tsx');
    assert(p.includes('export function MoLaiLopPanel') && p.includes('/mo-lai`') && p.includes('/ket-thuc`'), 'panel + Hoàn tác');
    assert(/<Truong nhan="Lý do" tuyChon/.test(p.slice(p.indexOf('MoLaiLopPanel'))), 'Lý do tuỳ chọn');
    const dt = doc('web/src/modules/classes/DauTrangLop.tsx');
    assert(dt.includes("nhan: 'Mở lại lớp'") && dt.includes('coTheMoLaiLop') && dt.includes('coTheKetThucLop'), 'mục ⋮ Mở lại lớp + Quản lý kết thúc lớp');
    assert(doc('web/src/modules/classes/ClassOverviewPage.tsx').includes('<MoLaiLopPanel'), 'trang hồ sơ lớp vẽ panel');
    const lt = doc('web/src/modules/students/LuuTruPage.tsx');
    assert(lt.includes('coTheMoLai') && lt.includes('>Mở lại</button>') && lt.includes('<MoLaiLopPanel'), 'nút Mở lại ở Lưu trữ');
  });

  void doc;
}
