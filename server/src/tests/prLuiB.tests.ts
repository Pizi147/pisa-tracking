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

  check('LUIb-1 · menu ⋮: "Quay lại học" (P7 — đường Học lại cũ) hiện đúng khi có quyền hocLai và em đã kết thúc; GVCN không có', () => {
    const quyen = (o: Record<string, boolean>) => ({ lopHoc: { quyen: { ghiLoTrinhTiep: false, chuyenLop: false, tamDung: false, quayLai: false, ketThuc: false, luuTru: false, boLuuTru: false, ...o } } });
    const keys = (o: Record<string, boolean>, status: string) => d.mucQuanLyHocVien({ canEdit: false, cycle: null, status, ...quyen(o) }).map((m: any) => m.key);
    assert(keys({ hocLai: true, boLuuTru: true }, 'finished').join() === 'quay-lai', keys({ hocLai: true, boLuuTru: true }, 'finished').join());
    assert(!keys({}, 'finished').includes('quay-lai'), 'không quyền thì không có Quay lại học');
    const m = d.mucQuanLyHocVien({ canEdit: false, cycle: null, status: 'finished', ...quyen({ hocLai: true }) })[0];
    assert(m.nhan === 'Quay lại học' && m.phu === 'hạn tính lại từ ngày quay lại', JSON.stringify(m));
  });

  check('LUIb-2 · hằng làm nhiều học viên: việc ngược đối xứng, nhãn đủ, lô 8, trần xem trước 200', () => {
    for (const v of d.VIEC_HANG_LOAT) {
      if (v !== 'xoa') assert(d.VIEC_NGUOC[d.VIEC_NGUOC[v]] === v, `${v} ngược hai lần phải về ${v}`);   // OV-12a: Xoá không có việc ngược (không Hoàn tác)
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

  await checkAsync('LUIb-3b · hocLai chỉ mở lại ghi danh / lộ trình CHÍNH lần Kết thúc học đó đóng — cái đã đóng từ trước (kể cả cùng ngày) giữ đóng', () => thu(() => {
    const sid = emDangHoc('MB FT 101');
    const lop = classId('MB FT 101');
    /* Đã đóng từ trước: một ghi danh `completed` (chưa ended_at) + một lộ trình `abandoned` cùng ngày với lần Kết thúc học sắp tới. */
    const cuE = Number(conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at, end_kind) VALUES (?,?, 'completed', '2026-01-05', '2026-01-05', 'ket_thuc')`).run(sid, lop).lastInsertRowid);
    const seq = (conn.prepare('SELECT MAX(seq) n FROM learning_cycles WHERE student_id = ?').get(sid) as any).n + 1;
    const cuC = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, started_at, ended_at, status, created_at) VALUES (?,?, '2026-01-05', ?, 'abandoned', '2026-01-05')`).run(sid, seq, TODAY).lastInsertRowid);
    const dangE = (conn.prepare(`SELECT id FROM enrollments WHERE student_id = ? AND status = 'active'`).all(sid) as any[]).map((r) => r.id as number);
    const dangC = (conn.prepare(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'`).all(sid) as any[]).map((r) => r.id as number);
    svc.setStudentStatus(P.mbManager, sid, 'finished', TODAY, 'Nghỉ học');
    svc.hocLai(P.mbManager, sid);
    const e = Object.fromEntries((conn.prepare('SELECT id, status FROM enrollments WHERE student_id = ?').all(sid) as any[]).map((r) => [r.id, r.status]));
    const c = Object.fromEntries((conn.prepare('SELECT id, status FROM learning_cycles WHERE student_id = ?').all(sid) as any[]).map((r) => [r.id, r.status]));
    assert(dangE.every((id) => e[id] === 'active') && e[cuE] === 'completed', `ghi danh: ${JSON.stringify(e)}`);
    assert(dangC.every((id) => c[id] === 'active') && c[cuC] === 'abandoned', `lộ trình: ${JSON.stringify(c)}`);
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
    const kq = hl.chay(P.mbManager, { viec: 'ket-thuc', studentIds: ids.slice(0, 2), lyDo: 'Final Test' });
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
    const kq = hl.chay(P.mbManager, { viec: 'ket-thuc', studentIds: [trongMb[0], ngoai, trongMb[1]], lyDo: 'Final Test' });
    assert(kq.ok.join() === [trongMb[0], trongMb[1]].join() && kq.failed.length === 1 && kq.failed[0].studentId === ngoai && kq.failed[0].message === 'Ngoài phạm vi của bạn.', JSON.stringify(kq));
    assert((conn.prepare('SELECT status FROM students WHERE id = ?').get(ngoai) as any).status === 'active', 'học viên ngoài quyền không được đổi');
    assert(maLoi(() => hl.chay(P.coreTeacher, { viec: 'ket-thuc', studentIds: dangHocTrong('MB FOU 12', 2), lyDo: 'x' })) === 403, 'GVCN 403 cả lô');
    assert(maLoi(() => hl.chay(P.mbManager, { viec: 'ket-thuc', studentIds: Array.from({ length: 9 }, (_, i) => i + 1), lyDo: 'x' })) === 400, '9 học viên một lần ghi');
    assert(maLoi(() => hl.xemTruoc(P.mbManager, { viec: 'ket-thuc', studentIds: Array.from({ length: 201 }, (_, i) => i + 1) })) === 400, '201 học viên xem trước');
    assert(maLoi(() => hl.chay(P.mbManager, { viec: 'ket-thuc', studentIds: [] })) === 400 && maLoi(() => hl.chay(P.mbManager, { viec: 'xoa', studentIds: [1] })) === 400, 'rỗng / việc lạ');
    /* P7 (k2): lý do không bắt buộc ở hộp "Tạm dừng/ Kết thúc học" — hàng loạt cùng luật một em. */
  }));

  /** OV-8a: Kết thúc học em FT chưa Lưu trữ (chờ QL chọn Bước tiếp) — phép kiểm Lưu trữ dùng nút Lưu trữ tay của QL (đã có từ RB-9). */
  const luuTruTay = (sid: number) => svc.archiveStudent(P.mbManager, sid);
  await checkAsync('LUIb-10 · Lưu trữ / Bỏ lưu trữ nhiều học viên: chỉ học viên đã kết thúc; Bỏ lưu trữ không làm học viên học lại', () => thu(async () => {
    const sid = dangHocTrong('MB FT 101', 1)[0];
    conn.prepare(`UPDATE learning_cycles SET thi_that_khong_thi = 1 WHERE student_id = ? AND status = 'active'`).run(sid);   // PR-TK: FT còn "Chờ kết quả thi thật" thì Kết thúc học chưa lưu trữ — đặt Không thi để phép kiểm này giữ ngữ cảnh lưu trữ
    assert(hl.xemTruoc(P.mbManager, { viec: 'luu-tru', studentIds: [sid] }).rows[0].lyDoBo === 'Chưa kết thúc học', 'học viên đang học không lưu trữ được');
    hl.chay(P.mbManager, { viec: 'ket-thuc', studentIds: [sid], lyDo: 'Final Test' });
    luuTruTay(sid);
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

  await checkAsync('LUIb-11 · huyNhieuLenh: lý do bắt buộc (không tối thiểu ký tự); QL khác chi nhánh 403; lệnh lỗi không cuộn lại lệnh khác; MỘT chuông mỗi người nhận. khoiPhucLenh: chỉ lệnh do người huỷ, còn tương lai, học viên chưa có lệnh khác, trong 24 giờ', () => thu(() => {
    const { em } = taoLenhChoEm(3);
    const ids = em.map(idLenh);
    assert(maLoi(() => lenhSvc.huyNhieuLenh(P.mbManager, ids, '  ')) === 400, 'thiếu lý do');
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
    assert(maLoi(() => hl.chay(P.mbManager, { viec: 'huy-lenh', studentIds: em, lyDo: '  ' })) === 400, 'thiếu lý do');
    const kq = hl.chay(P.mbManager, { viec: 'huy-lenh', studentIds: em, lyDo: 'Đã đổi ý' });
    assert(kq.ok.length === 2 && kq.failed.length === 1 && kq.failed[0].studentId === em[2], JSON.stringify(kq));
    assert((conn.prepare(`SELECT COUNT(*) n FROM lenh_chuyen_lop WHERE student_id IN (${em[0]}, ${em[1]}) AND trang_thai = 'cho'`).get() as any).n === 0, 'cả hai phải huỷ');
    const kp = hl.chay(P.mbManager, { viec: 'khoi-phuc-lenh', studentIds: kq.ok });
    assert(kp.ok.length === 2 && kp.failed.length === 0, JSON.stringify(kp));
    assert((conn.prepare(`SELECT COUNT(*) n FROM lenh_chuyen_lop WHERE student_id IN (${em[0]}, ${em[1]}) AND trang_thai = 'cho'`).get() as any).n === 2, 'cả hai phải về chờ');
  }));

  // ---------------------------------------------------------------- Task 5 · cờ ở Lưu trữ, Quản lý kết thúc lớp
  await checkAsync('LUIb-12 · Lưu trữ: cờ coTheMoLai (lớp, QL đúng chi nhánh / QT) và coTheQuayLai (P7 — học viên); GVCN false', () => thu(async () => {
    const lt: any = await import('../classes/luuTru.ts');
    const lop = classId('MB FOU 12');
    conn.prepare(`UPDATE classes SET status = 'finished', finished_at = ? WHERE id = ?`).run(TODAY, lop);
    const dong = (p: any) => lt.danhSachLuuTru(p, {}).lop.find((l: any) => l.id === lop);
    assert(dong(P.mbManager)?.coTheMoLai === true && dong(P.admin)?.coTheMoLai === true, 'QL / QT thấy nút Mở lại');
    assert(dong(P.normalCoreTeacher) === undefined || dong(P.normalCoreTeacher).coTheMoLai === false, 'GVCN không có Mở lại');
    const sid = dangHocTrong('MB FT 101', 1)[0];
    conn.prepare(`UPDATE learning_cycles SET thi_that_khong_thi = 1 WHERE student_id = ? AND status = 'active'`).run(sid);   // PR-TK: như LUIb-10
    svc.setStudentStatus(P.mbManager, sid, 'finished', TODAY, 'Nghỉ học');
    luuTruTay(sid);
    const hv = (p: any) => lt.danhSachLuuTru(p, {}).hocVien.find((x: any) => x.id === sid);
    assert(hv(P.mbManager).coTheQuayLai === true && hv(P.admin).coTheQuayLai === true, 'QL / QT thấy nút Quay lại học');
  }));

  await checkAsync('LUIb-13 · Quản lý kết thúc lớp không còn học viên được, mở lại được; GVCN 403; Xoá lớp có dữ liệu 400 (OV-12a: QL xoá được lớp trống); viewer.coTheMoLaiLop theo quyền', () => thu(async () => {
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
    assert(maLoi(() => xk.xoaLop(P.mbManager, lop, { maLop: 'MB FOU 12' })) === 400, 'Xoá lớp có dữ liệu phải 400 (OV-12a: QL xoá được lớp trống)');
  }));

  // ---------------------------------------------------------------- Task 7 · web Mở lại lớp
  check('LUIb-15 · web Mở lại lớp: panel (lý do tuỳ chọn, Hoàn tác = Kết thúc lớp), mục ⋮ hồ sơ lớp đã kết thúc, nút Mở lại ở Lưu trữ; Quản lý cũng thấy Kết thúc lớp', () => {
    const p = doc('web/src/modules/classes/XoaKetThucLopPanel.tsx');
    assert(p.includes('export function MoLaiLopPanel') && p.includes('/mo-lai`') && p.includes('/ket-thuc`'), 'panel + Hoàn tác');
    assert(/<Truong nhan="Lý do" tuyChon/.test(p.slice(p.indexOf('MoLaiLopPanel'))), 'Lý do tuỳ chọn');
    const dt = doc('web/src/modules/classes/DauTrangLop.tsx');
    /* PR-OV3a: nhãn mục ⋯ ở `menuHoSoLop` (shared). */
    assert(doc('shared/domain/hocVienLop.ts').includes("'Mở lại lớp'") && dt.includes('coTheMoLaiLop') && dt.includes('coTheKetThucLop'), 'mục ⋯ Mở lại lớp + Quản lý kết thúc lớp');
    assert(doc('web/src/modules/classes/ClassOverviewPage.tsx').includes('<MoLaiLopPanel'), 'trang hồ sơ lớp vẽ panel');
    const lt = doc('web/src/modules/students/LuuTruPage.tsx');
    assert(lt.includes('coTheMoLai') && lt.includes('>Mở lại</button>') && lt.includes('<MoLaiLopPanel'), 'nút Mở lại ở Lưu trữ');
  });

  // ---------------------------------------------------------------- Task 6, 8, 9, 10 · web (đọc nguồn)
  check('LUIb-14 · web Học lại (hồ sơ em): chọn đích Về lớp cũ / Sang lớp mới, Target khi sang Fast Track, Hoàn tác = hoan-tac-hoc-lai, lý do tuỳ chọn', () => {
    const s = doc('web/src/modules/students/StudentManagePanel.tsx');
    const hl = s.slice(s.indexOf('function HocLaiPanel'));
    /* P7: panel Học lại cũ mở từ "Quay lại học" (QuayLaiHoc.tsx, hướng `hoc-lai` của máy chủ). */
    assert(doc('web/src/modules/students/QuayLaiHoc.tsx').includes('<HocLaiPanel') && hl.length > 100, 'thiếu panel Học lại');
    for (const chu of ['Về lớp cũ', 'Sang lớp mới', 'Lộ trình cũ giữ ở Hành trình', 'Chưa có lớp để học lại']) assert(hl.includes(chu), `thiếu chữ "${chu}"`);
    assert(hl.includes('/hoc-lai`') && hl.includes('/hoc-lai/lop-dich') && hl.includes('moLaiLop: true'), 'phải gọi /hoc-lai và /hoc-lai/lop-dich');
    assert(/toast\.hoanTac\(`Đã cho \$\{studentName\} quay lại học/.test(hl) && hl.includes("hoanTacHangLoat('hoc-lai'"), 'Hoàn tác phải đi qua hoan-tac-hoc-lai');
    assert(/<Truong nhan="Lý do" tuyChon/.test(hl) && hl.includes('canTarget'), 'Lý do tuỳ chọn + Target khi sang FT');
  });
  check('LUIb-16 · web: chia lô bằng LO_HANG_LOAT_EM, gom ok/failed, dừng khi một lô ném lỗi và ghi "chưa lưu" cho phần còn lại; Hoàn tác gọi việc ngược', () => {
    const h = doc('web/src/modules/students/hangLoatEm.ts');
    assert(h.includes("chiaLo(ids, viec === 'xoa' ? LO_XOA_EM : LO_HANG_LOAT_EM)") && h.includes("'/hang-loat-hoc-vien'") && h.includes('VIEC_NGUOC[viec]'), 'runner');
    assert(/catch \(e: any\) \{[\s\S]*break;/.test(h), 'lỗi giữa chừng phải dừng và ghi phần còn lại là chưa lưu');
  });
  check('LUIb-17 · web: thanh dính đáy, panel xem trước, ô chọn ở cả bảng FT và bảng lớp thường; đủ chữ đã duyệt; Học viên & Lớp chỉ có ô chọn để Xuất (OV-15h2)', () => {
    const t = doc('web/src/modules/classes/TabHocVienLop.tsx');
    assert(t.includes('Chọn nhiều học viên') && t.includes('useChonNhieu') && t.includes('ThanhChonNhieu') && t.includes("cheDo === 'diem'") && t.includes('canPlanWeek'), 'nút + thanh ở tab Học viên, chỉ Quản lý, chỉ cách xem Điểm');
    for (const chu of ["'Tạm dừng/ Kết thúc học'", "'Huỷ chuyển lớp'", '<HopTamDungKetThuc']) assert(t.includes(chu), `thiếu việc ${chu}`);   // P7: một mục thay Lưu trữ + Kết thúc học
    const b = doc('web/src/modules/students/chonNhieuHocVien.tsx');
    for (const chu of ['đã chọn', 'Bỏ chọn']) assert(b.includes(chu), `thiếu chữ "${chu}"`);
    assert(b.includes('sticky') && b.includes('bottom-0'), 'thanh phải dính đáy');
    const p = doc('web/src/modules/students/XemTruocHangLoatPanel.tsx');
    for (const chu of ['Bỏ qua', 'Thử lại', 'Đã lưu ', 'chưa lưu', 'Quyết định chuyển lớp huỷ', 'PA huỷ', 'Case đóng', 'học viên', 'Về lớp cũ', 'Sang lớp mới']) assert(p.includes(chu), `thiếu chữ "${chu}"`);
    assert(p.includes('!l.ft'), 'Học lại hàng loạt chỉ sang lớp thường');
    assert(doc('web/src/modules/classes/BangHoSoLop.tsx').includes('OChon') && doc('web/src/modules/classes/BangDiemLopThuong.tsx').includes('OChon'), 'ô chọn ở cả hai bảng');
    /* UI-HV-LOP (khu d, `10` mục 4): Học viên & Lớp bỏ cột tick — "Xuất" lấy đúng phạm vi bộ lọc (không thanh chọn). */
    assert(!/<ThanhChonNhieu/.test(doc('web/src/modules/students/StudentsPage.tsx')), 'Học viên & Lớp không còn thanh chọn');
  });
  check('LUIb-18 → P7 · web Lưu trữ › Học viên: nút Chọn nhiều học viên, thanh dính đáy "Quay lại học", nút Quay lại học mỗi dòng đi đúng hướng máy chủ', () => {
    const l = doc('web/src/modules/students/LuuTruPage.tsx');
    for (const chu of ['Chọn nhiều học viên', "nhan: t('Quay lại học')", 'ThanhChonNhieu', 'coTheQuayLai', 'useQuayLaiHoc']) assert(l.includes(chu), `thiếu "${chu}"`);
  });
  check('LUIb-19 · web Cuối khoá (P9b thay Chuyển tiếp lớp): "Huỷ quyết định" có lý do bắt buộc, đi qua chayHangLoat("huy-lenh"), Hoàn tác', () => {
    const t = doc('web/src/modules/classes/CuoiKhoaLop.tsx');
    for (const chu of ["chayHangLoat('huy-lenh'", "hoanTacHangLoat('huy-lenh'", 'Huỷ quyết định', 'Lý do huỷ']) assert(t.includes(chu), `thiếu "${chu}"`);
    assert(!/length < 3/.test(t.slice(t.indexOf('huy?.lyDo'))), 'không tối thiểu ký tự');
  });

  // ---------------------------------------------------------------- Sau rà #213 (I1–I3, mục 4–5)
  const intakeSvc: any = await import('../classes/intake.ts');
  const xk: any = await import('../classes/xoaKetThucLop.ts');
  const mbId = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as { id: number }).id;
  const emNgoaiMb = (): number => (conn.prepare(`SELECT s.id FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active'
      JOIN classes c ON c.id = e.class_id JOIN branches b ON b.id = c.branch_id WHERE b.code != 'MB' AND s.status = 'active' ORDER BY s.id LIMIT 1`).get() as any).id;

  await checkAsync('LUIb-20 · I1 xemTruoc không lộ tên: GVBM 403 cả lô; học viên ngoài phạm vi Quản lý chỉ hiện "#id", mã trống, lớp null', () => thu(() => {
    assert(maLoi(() => hl.xemTruoc(P.subjectTeacher, { viec: 'ket-thuc', studentIds: [1, 2, 3, 4, 5] })) === 403, 'GVBM xem trước → 403');
    assert(maLoi(() => hl.xemTruoc(P.coreTeacher, { viec: 'ket-thuc', studentIds: dangHocTrong('MB FOU 12', 2) })) === 403, 'GVCN xem trước → 403');
    const ngoai = emNgoaiMb();
    const [trong] = dangHocTrong('MB FT 101', 1);
    const xt = hl.xemTruoc(P.mbManager, { viec: 'ket-thuc', studentIds: [trong, ngoai] });
    const r = xt.rows.find((x: any) => x.studentId === ngoai);
    assert(r.ten === `#${ngoai}` && r.ma === '' && r.lop === null && r.lyDoBo === 'Ngoài phạm vi của bạn.', JSON.stringify(r));
    assert(xt.rows.find((x: any) => x.studentId === trong).ten !== `#${trong}`, 'học viên trong phạm vi vẫn thấy tên');
  }));

  await checkAsync('LUIb-21 · I3 thangThi: chuỗi rác 400, "02/2027" → exam_month 2027-02', () => thu(() => {
    const sid = dangHocTrong('MB FOU 12', 1)[0];
    svc.setStudentStatus(P.mbManager, sid, 'finished', TODAY, 'Nghỉ học');
    const ft = classId('MB FT 101');
    assert(maLoi(() => svc.hocLai(P.mbManager, sid, { lopMoiId: ft, mucTieu: 6.5, thangThi: 'x'.repeat(60) })) === 400, 'chuỗi rác');
    assert(maLoi(() => svc.hocLai(P.mbManager, sid, { lopMoiId: ft, mucTieu: 6.5, thangThi: '13/2027' })) === 400, 'tháng 13');
    svc.hocLai(P.mbManager, sid, { lopMoiId: ft, mucTieu: 6.5, thangThi: '02/2027' });
    assert((conn.prepare(`SELECT exam_month FROM learning_cycles WHERE student_id = ? AND status = 'active'`).get(sid) as any).exam_month === '2027-02', 'exam_month');
  }));

  await checkAsync('LUIb-22 · I2 Hoàn tác Học lại về lớp cũ: về đúng trạng thái sau Kết thúc học (ngày kết thúc + ngày lưu trữ cũ); lớp được mở cùng lúc đóng lại', () => thu(() => {
    const sid = dangHocTrong('MB FOU 12', 1)[0];
    const lop = classId('MB FOU 12');
    const ngayKt = addDays(TODAY, -20);
    svc.setStudentStatus(P.mbManager, sid, 'finished', ngayKt, 'Nghỉ học');
    conn.prepare(`UPDATE enrollments SET status = 'completed' WHERE class_id = ? AND status = 'active'`).run(lop);   // lớp đã kết thúc thật thì không còn ai đang học
    conn.prepare(`UPDATE classes SET status = 'finished', finished_at = ? WHERE id = ?`).run(ngayKt, lop);
    const sauKt = anh(sid);
    svc.hocLai(P.mbManager, sid, { moLaiLop: true });
    assert((conn.prepare('SELECT status FROM classes WHERE id = ?').get(lop) as any).status === 'active', 'lớp mở lại');
    svc.hoanTacHocLai(P.mbManager, sid);
    assert(anh(sid) === sauKt, `không về trạng thái sau Kết thúc học:\n${sauKt}\n${anh(sid)}`);
    const c = conn.prepare('SELECT status, finished_at FROM classes WHERE id = ?').get(lop) as any;
    assert(c.status === 'finished' && c.finished_at === ngayKt, `lớp phải đóng lại với ngày cũ: ${JSON.stringify(c)}`);
    const nk = conn.prepare(`SELECT actor_user_id FROM audit_logs WHERE action = 'class.finished' AND entity_id = ? ORDER BY id DESC LIMIT 1`).get(lop) as any;
    assert(nk?.actor_user_id === P.mbManager.userId, 'đóng lại lớp phải có nhật ký class.finished của người bấm');
    assert(maLoi(() => svc.hoanTacHocLai(P.mbManager, sid)) === 409, 'hoàn tác hai lần → 409');
    assert(maLoi(() => svc.hoanTacHocLai(P.coreTeacher, sid)) === 403, 'GVCN 403');
  }));

  await checkAsync('LUIb-23 · I2 Hoàn tác Học lại sang lớp mới: gỡ ghi danh + lộ trình + lịch mới + chuông chuyển vào; Học lại về lớp cũ sau đó vào đúng lớp cũ', () => thu(() => {
    const sid = dangHocTrong('MB FOU 12', 1)[0];
    const lopMoi = (conn.prepare(`SELECT id FROM classes WHERE status = 'active' AND is_fast_track = 0 AND id != ? ORDER BY id LIMIT 1`).get(classId('MB FOU 12')) as any).id as number;
    svc.setStudentStatus(P.mbManager, sid, 'finished', addDays(TODAY, -5), 'Nghỉ học');
    const sauKt = anh(sid);
    svc.hocLai(P.mbManager, sid, { lopMoiId: lopMoi });
    const cyMoi = (conn.prepare(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'`).get(sid) as any).id as number;
    assert((conn.prepare('SELECT COUNT(*) n FROM assessment_attempts WHERE cycle_id = ?').get(cyMoi) as any).n > 0, 'lịch mặc định của lộ trình mới');
    svc.hoanTacHocLai(P.mbManager, sid);
    assert(anh(sid) === sauKt, `không về trạng thái sau Kết thúc học:\n${sauKt}\n${anh(sid)}`);
    assert((conn.prepare('SELECT COUNT(*) n FROM assessment_attempts WHERE cycle_id = ?').get(cyMoi) as any).n === 0, 'bài / lượt của lộ trình mới phải gỡ');
    assert((conn.prepare(`SELECT COUNT(*) n FROM notifications WHERE kind = 'transfer_in' AND entity_id = ?`).get(sid) as any).n === 0, 'chuông chuyển vào phải gỡ');
    svc.hocLai(P.mbManager, sid);
    assert((conn.prepare(`SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'active'`).get(sid) as any).class_id === classId('MB FOU 12'), 'Về lớp cũ phải vào lớp cũ');
  }));

  await checkAsync('LUIb-24 · I2 Hoàn tác Học lại sang lớp mới: lộ trình mới đã có dữ liệu → 409, giữ nguyên; học viên đổi trạng thái sau Học lại → 409', () => thu(() => {
    const sid = dangHocTrong('MB FOU 12', 1)[0];
    const lopMoi = (conn.prepare(`SELECT id FROM classes WHERE status = 'active' AND is_fast_track = 0 AND id != ? ORDER BY id LIMIT 1`).get(classId('MB FOU 12')) as any).id as number;
    svc.setStudentStatus(P.mbManager, sid, 'finished', TODAY, 'Nghỉ học');
    svc.hocLai(P.mbManager, sid, { lopMoiId: lopMoi });
    const cyMoi = (conn.prepare(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'`).get(sid) as any).id as number;
    conn.prepare(`UPDATE assessment_attempts SET status = 'done' WHERE id = (SELECT MIN(id) FROM assessment_attempts WHERE cycle_id = ?)`).run(cyMoi);
    const truoc = anh(sid);
    assert(maLoi(() => svc.hoanTacHocLai(P.mbManager, sid)) === 409, 'đã có dữ liệu → 409');
    assert(anh(sid) === truoc, '409 không được đổi gì');
    svc.setStudentStatus(P.mbManager, sid, 'inactive', TODAY, 'Nghỉ tạm');
    assert(maLoi(() => svc.hoanTacHocLai(P.mbManager, sid)) === 409, 'đã đổi trạng thái sau Học lại → 409');
  }));

  await checkAsync('LUIb-25 · Mục 4: Hoàn tác Kết thúc học (một / nhiều học viên) mở lại ĐÚNG Case / PA / tín hiệu mà chính lần đó đóng; Case đã đóng từ trước giữ đóng', () => thu(() => {
    const row = conn.prepare(`SELECT s.id FROM students s JOIN sos_cases c ON c.student_id = s.id AND c.status != 'done'
        JOIN enrollments e ON e.student_id = s.id AND e.status = 'active' WHERE s.status = 'active' AND e.class_id = ? ORDER BY s.id LIMIT 1`).get(classId('MB FT 101')) as any;
    assert(row, 'cần một học viên có Case mở');
    const sid = row.id as number;
    const cuDong = Number(conn.prepare(`INSERT INTO sos_cases (student_id, title, status, closed_at, created_at, updated_at) VALUES (?, 'Case đã đóng từ trước', 'done', '2026-01-01', '2026-01-01', '2026-01-01')`).run(sid).lastInsertRowid);
    const chup = () => JSON.stringify({
      c: conn.prepare('SELECT id, status, disposition, disposition_note, outcome_note, dedup_key, closed_at, closed_by, system_close_reason FROM sos_cases WHERE student_id = ? ORDER BY id').all(sid),
      p: conn.prepare('SELECT iv.id, iv.status, iv.closed_reason FROM case_interventions iv JOIN sos_cases c ON c.id = iv.case_id WHERE c.student_id = ? ORDER BY iv.id').all(sid),
      t: conn.prepare('SELECT id, status, withdrawn_reason FROM case_signals WHERE student_id = ? ORDER BY id').all(sid),
    });
    const truoc = chup();
    hl.chay(P.mbManager, { viec: 'ket-thuc', studentIds: [sid], lyDo: 'Final Test' });
    assert(chup() !== truoc, 'Kết thúc học phải đóng Case');
    assert((conn.prepare('SELECT status FROM sos_cases WHERE id = ?').get(cuDong) as any).status === 'done', 'Case cũ vẫn đóng');
    const kq = hl.chay(P.mbManager, { viec: 'hoan-tac-ket-thuc', studentIds: [sid] });
    assert(kq.ok.length === 1 && kq.failed.length === 0, JSON.stringify(kq));
    assert(chup() === truoc, `Case / PA / tín hiệu phải về nguyên trạng:\n${truoc}\n${chup()}`);
    assert((conn.prepare('SELECT status FROM students WHERE id = ?').get(sid) as any).status === 'active', 'học viên đang học lại');
  }));

  await checkAsync('LUIb-26 · 5a Kết thúc lớp bị chặn khi còn quyết định chuyển ĐẾN lớp đó; 5d máy chủ chặn Học lại hàng loạt sang lớp FT; 5e nhật ký kết thúc lớp ghi đúng người bấm', () => thu(() => {
    const ma = 'MB-LUIB 1';
    const c = intakeSvc.createClass(P.admin, { code: ma, branchId: mbId, kind: 'FOU', isFastTrack: false, startDate: '2026-08-03' }) as { id: number };
    const sid = dangHocTrong('MB FOU 12', 1)[0];
    conn.prepare(`INSERT INTO lenh_chuyen_lop (student_id, lop_nguon_id, lop_dich_id, huong, boi_canh, tuan_bat_dau, nguoi_ra_lenh, ngay_ra_lenh, trang_thai, tao_luc)
      VALUES (?,?,?, 'len_lop', 'cuoi-khoa', '2026-12-07', ?, ?, 'cho', ?)`).run(sid, classId('MB FOU 12'), c.id, P.mbManager.userId, TODAY, new Date().toISOString());
    assert(maLoi(() => xk.ketThucLop(P.mbManager, c.id)) === 400, 'còn quyết định chuyển đến → 400');
    assert(/quyết định chuyển/.test(xk.xemXoaKetThuc(P.mbManager, c.id).lyDoChanKetThuc ?? ''), 'xem phải nói lý do chặn');
    conn.prepare(`UPDATE lenh_chuyen_lop SET trang_thai = 'huy' WHERE lop_dich_id = ?`).run(c.id);
    xk.ketThucLop(P.mbManager, c.id);
    const au = conn.prepare(`SELECT actor_user_id, after_json FROM audit_logs WHERE action = 'class.finished' AND entity_id = ? ORDER BY id DESC LIMIT 1`).get(c.id) as any;
    assert(au.actor_user_id === P.mbManager.userId && !String(au.after_json).includes('system_admin'), `nhật ký: ${JSON.stringify(au)}`);
    const dsFt = dangHocTrong('MB FOU 12', 2);
    svc.setStudentStatus(P.mbManager, dsFt[0], 'finished', TODAY, 'Nghỉ học');
    assert(maLoi(() => hl.chay(P.mbManager, { viec: 'hoc-lai', studentIds: [dsFt[0]], lopMoiId: classId('MB FT 101') })) === 400, 'Học lại hàng loạt sang FT → 400 ở máy chủ');
  }));

  await checkAsync('LUIb-27 · 5b Về lớp cũ khi lộ trình đã đóng bằng Kết luận: mở lộ trình MỚI ở lớp cũ, panel nói đúng ("Lộ trình mới"); 5e chuông chuyển vào có mã lớp cũ + tên chi nhánh, không "(—)"', () => thu(() => {
    const sid = dangHocTrong('MB FOU 12', 1)[0];
    conn.prepare(`UPDATE learning_cycles SET status = 'completed', ended_at = ? WHERE student_id = ? AND status = 'active'`).run(addDays(TODAY, -30), sid);
    svc.setStudentStatus(P.mbManager, sid, 'finished', TODAY, 'Nghỉ học');
    const hoi = svc.lopChoHocLai(P.mbManager, sid);
    assert(hoi.loTrinh && hoi.loTrinh.chayTiep === false && typeof hoi.loTrinh.ten === 'string', JSON.stringify(hoi.loTrinh));
    svc.hocLai(P.mbManager, sid);
    const dang = conn.prepare(`SELECT id, seq FROM learning_cycles WHERE student_id = ? AND status = 'active'`).all(sid) as any[];
    assert(dang.length === 1 && dang[0].seq === (conn.prepare('SELECT MAX(seq) n FROM learning_cycles WHERE student_id = ?').get(sid) as any).n, `phải có đúng một lộ trình mới đang chạy: ${JSON.stringify(dang)}`);
    const lopMoi = (conn.prepare(`SELECT id FROM classes WHERE status = 'active' AND is_fast_track = 0 AND id != ? ORDER BY id LIMIT 1`).get(classId('MB FOU 12')) as any).id as number;
    svc.setStudentStatus(P.mbManager, sid, 'finished', TODAY, 'Nghỉ học');
    conn.prepare(`DELETE FROM notifications WHERE kind = 'transfer_in'`).run();
    svc.hocLai(P.mbManager, sid, { lopMoiId: lopMoi });
    const tb = conn.prepare(`SELECT body FROM notifications WHERE kind = 'transfer_in' AND entity_id = ? LIMIT 1`).get(sid) as any;
    assert(tb && tb.body.includes('MB FOU 12') && !tb.body.includes('(—)'), `chuông: ${JSON.stringify(tb)}`);
  }));

  check('LUIb-28 · web sau rà #213: Học lại nói tên lộ trình + sĩ số lớp + "Lên FT cần Target"; Kết thúc học một em có Hoàn tác; Hoàn tác đi qua việc hoan-tac-*; lỗi mạng tiếng Việt', () => {
    const sm = doc('web/src/modules/students/StudentManagePanel.tsx');
    for (const chu of ['Lên FT cần Target', 'Lộ trình chạy tiếp', 'Lộ trình mới', 'siSo']) assert(sm.includes(chu), `StudentManagePanel thiếu "${chu}"`);
    /* P7: Kết thúc học một em ở hộp Tạm dừng/ Kết thúc học — Hoàn tác đi qua hoan-tac-* (`VIEC_NGUOC`). */
    assert(doc('web/src/modules/students/HopTamDungKetThuc.tsx').includes('hoanTacHangLoat(viec'), 'Hộp Tạm dừng/ Kết thúc học thiếu Hoàn tác hàng loạt');
    const hl = doc('web/src/modules/students/hangLoatEm.ts');
    assert(hl.includes('VIEC_NGUOC[viec]') && !hl.includes("'Hoàn tác học lại'"), 'Hoàn tác phải đi qua việc ngược, không làm Kết thúc học lại');
    const xt = doc('web/src/modules/students/XemTruocHangLoatPanel.tsx');
    assert(xt.indexOf('Có hiệu lực từ') < xt.indexOf('<Truong nhan="Lý do'), 'Ngày phải nằm trên Lý do ở panel hàng loạt');
    assert(doc('web/src/lib/api.ts').includes('Mất kết nối máy chủ'), 'lỗi mạng phải là tiếng Việt');
  });

  await checkAsync('LUIb-29 · Vòng 2 (1): Hoàn tác Học lại sang lớp FT gỡ được — lịch MT mặc định ("created") không phải dữ liệu của người dùng', () => thu(() => {
    const sid = dangHocTrong('MB FOU 12', 1)[0];
    svc.setStudentStatus(P.mbManager, sid, 'finished', addDays(TODAY, -3), 'Nghỉ học');
    const sauKt = anh(sid);
    svc.hocLai(P.mbManager, sid, { lopMoiId: classId('MB FT 101'), mucTieu: 6.5 });
    const cyMoi = (conn.prepare(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'`).get(sid) as any).id as number;
    assert((conn.prepare('SELECT COUNT(*) n FROM assessment_attempts WHERE cycle_id = ?').get(cyMoi) as any).n > 0, 'lộ trình FT có lịch MT mặc định');
    svc.hoanTacHocLai(P.mbManager, sid);
    assert(anh(sid) === sauKt, `không về trạng thái sau Kết thúc học:\n${sauKt}\n${anh(sid)}`);
    assert((conn.prepare('SELECT COUNT(*) n FROM assessment_attempts WHERE cycle_id = ?').get(cyMoi) as any).n === 0, 'lượt MT mặc định phải gỡ');
    assert((conn.prepare('SELECT COUNT(*) n FROM learning_cycles WHERE id = ?').get(cyMoi) as any).n === 0, 'lộ trình mới phải gỡ');
  }));

  await checkAsync('LUIb-30 · Vòng 2 (2): Hoàn tác Học lại chỉ đóng lại lớp khi KHÔNG còn ghi danh đang học nào (kể cả em khác cũng vừa Học lại)', () => thu(() => {
    const [a, b] = dangHocTrong('MB FOU 12', 2);
    const lop = classId('MB FOU 12');
    const ngayKt = addDays(TODAY, -20);
    svc.setStudentStatus(P.mbManager, a, 'finished', ngayKt, 'Nghỉ học');
    svc.setStudentStatus(P.mbManager, b, 'finished', ngayKt, 'Nghỉ học');
    conn.prepare(`UPDATE enrollments SET status = 'completed' WHERE class_id = ? AND status = 'active'`).run(lop);
    conn.prepare(`UPDATE classes SET status = 'finished', finished_at = ? WHERE id = ?`).run(ngayKt, lop);
    svc.hocLai(P.mbManager, a, { moLaiLop: true });
    svc.hocLai(P.mbManager, b);
    svc.hoanTacHocLai(P.mbManager, a);
    assert((conn.prepare('SELECT status FROM classes WHERE id = ?').get(lop) as any).status === 'active', 'em b vẫn đang học → lớp phải còn hoạt động');
    assert((conn.prepare(`SELECT status FROM enrollments WHERE student_id = ? AND class_id = ? ORDER BY id DESC`).get(b, lop) as any).status === 'active', 'em b vẫn đang học');
  }));

  await checkAsync('LUIb-31 · Vòng 2 (3b): Hoàn tác chỉ khi là thao tác MỚI NHẤT của em — sau đó có Chuyển lớp thì 409 câu rõ', () => thu(() => {
    const sid = dangHocTrong('MB FOU 12', 1)[0];
    const lopMoi = (conn.prepare(`SELECT id FROM classes WHERE status = 'active' AND is_fast_track = 0 AND branch_id = ? AND id != ? ORDER BY id LIMIT 1`).get(mbId, classId('MB FOU 12')) as any).id as number;
    const lopKhac = (conn.prepare(`SELECT id FROM classes WHERE status = 'active' AND is_fast_track = 0 AND branch_id = ? AND id NOT IN (?, ?) ORDER BY id LIMIT 1`).get(mbId, classId('MB FOU 12'), lopMoi) as any).id as number;
    svc.setStudentStatus(P.mbManager, sid, 'finished', addDays(TODAY, -3), 'Nghỉ học');
    svc.hocLai(P.mbManager, sid, { lopMoiId: lopMoi });
    svc.transferStudent(P.mbManager, sid, lopKhac, TODAY, 'Đổi lớp', { note: 'Bàn giao thử' });
    const truoc = anh(sid);
    assert(maLoi(() => svc.hoanTacHocLai(P.mbManager, sid)) === 409, 'đã chuyển lớp sau Học lại → 409');
    assert(anh(sid) === truoc, '409 không được đổi gì');
  }));

  await checkAsync('LUIb-32 · Vòng 2 (3a): Học lại FT → FT: máy chủ báo lớp cũ là FT + Target cũ, web không bắt nhập Target lại mà điền sẵn', () => thu(() => {
    /* Em chỉ có MỘT ghi danh đang học (bộ demo / phép kiểm khác có em hai ghi danh — khi đó "lớp cũ" có thể là lớp khác). */
    const sid = (conn.prepare(`SELECT s.id FROM students s JOIN enrollments e ON e.student_id = s.id AND e.status = 'active' WHERE e.class_id = ? AND s.status = 'active'
        AND (SELECT COUNT(*) FROM enrollments x WHERE x.student_id = s.id AND x.status IN ('active', 'paused')) = 1 ORDER BY s.id LIMIT 1`).get(classId('MB FT 101')) as any).id as number;
    svc.setStudentStatus(P.mbManager, sid, 'finished', addDays(TODAY, -3), 'Nghỉ học');
    const hoi = svc.lopChoHocLai(P.mbManager, sid);
    assert(hoi.lopCu.ft === true && 'target' in hoi.loTrinh, JSON.stringify([hoi.lopCu, hoi.loTrinh]));
    const sm = doc('web/src/modules/students/StudentManagePanel.tsx');
    assert(sm.includes('lopCu?.ft') && sm.includes('loTrinh.target'), 'web phải dùng lopCu.ft + loTrinh.target');
  }));

  void doc;
}
