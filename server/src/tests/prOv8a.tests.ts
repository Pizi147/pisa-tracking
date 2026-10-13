/**
 * PHÉP KIỂM PR-OV8a — Bước tiếp sau khi có kết quả thi thật (QL chọn Kết thúc · Học tiếp lộ trình mới · Học lại; việc QL nhắc).
 * Mỗi nhóm chạy trong giao dịch cuộn lại (`thu`) — không để lại dữ liệu cho phép kiểm khác.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv8aTests(t: YThucTestKit) {
  const { check, checkAsync, assert, conn, TODAY, P, addDays } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const intake: any = await import('../classes/intake.ts');
  const studentsSvc: any = await import('../students/students.ts');
  const thiThatSvc: any = await import('../loTrinh/thiThat.ts');
  const buocTiepSvc: any = await import('../loTrinh/buocTiep.ts');
  const tongKetSvc: any = await import('../loTrinh/tongKet.ts');
  const myWork: any = await import('../worklist/mywork.ts');
  console.log('\nPR-OV8a · Bước tiếp sau thi thật');

  const thu = async (fn: () => void | Promise<void>) => { conn.exec('BEGIN IMMEDIATE'); try { await fn(); } finally { conn.exec('ROLLBACK'); } };
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const maLoi = (fn: () => unknown): number | string => { try { fn(); return 'không ném'; } catch (e: any) { return e?.status ?? String(e?.message ?? e); } };
  const NGAY = TODAY;
  const MB = get(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const QL = P.mbManager;
  let seq = 0;
  const taoLop = (route: 'LT1' | 'LT2' = 'LT1'): number => {
    seq += 1;
    return intake.createClass(P.admin, { code: `MB-OV8A-${seq}`, branchId: MB, kind: 'FT', isFastTrack: true, route, startDate: NGAY }).id as number;
  };
  const ganGvcn = (clsId: number, userId: number) => {
    conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?, ?, NULL, 1, '2026-01-01', 'active', ?)`)
      .run(userId, clsId, new Date().toISOString());
    return loadPrincipal(userId);
  };
  /** Em FT (LT1, Target 6.5) ở `clsId`, đã Kết thúc học (lộ trình đóng, chờ kết quả). */
  const emDaKetThuc = (clsId: number, target: number | null = 6.5) => {
    seq += 1;
    const now = new Date().toISOString();
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-OV8A-${seq}`, `Hoc vien OV8A ${seq}`, `hoc vien ov8a ${seq}`, MB, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, clsId, NGAY, now);
    const cy = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, started_at, status, created_at) VALUES (?, 1, 'LT1', 'FT', ?, ?, 'active', ?)`)
      .run(sid, target, NGAY, now).lastInsertRowid);
    studentsSvc.setStudentStatus(P.admin, sid, 'finished', NGAY, 'Hết khoá');
    return { sid, cy };
  };
  const hoSo = (sid: number) => get('SELECT status, archived_at FROM students WHERE id = ?', sid);
  const loTrinh = (cy: number) => get('SELECT * FROM learning_cycles WHERE id = ?', cy);
  const dangChay = (sid: number) => all(`SELECT * FROM learning_cycles WHERE student_id = ? AND status = 'active'`, sid);
  const ghiDanhDang = (sid: number) => all(`SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'active'`, sid).map((r) => r.class_id as number);
  const viecBt = (pr: any, sid?: number) => ((myWork.myWork(pr, {}) as any).groups as any[]).flatMap((g) => g.items ?? [])
    .flatMap((x: any) => (x.con?.length ? x.con : [x])).filter((x: any) => x.group === 'buoc_tiep' && (sid === undefined || x.studentId === sid));
  const NHAP4 = { ngayThi: NGAY, l: 7, r: 6.5, w: 6, s: 6.5 };   // OVR 6.5
  const chon = (pr: any, cy: number, o: any) => buocTiepSvc.chonBuocTiep(pr, cy, o);

  check('OV8a · gợi ý: Đạt Target → Kết thúc; chưa đạt / Không thi → Học lại; không có Target → không gợi ý', () => {
    assert(d.goiYBuocTiep({ khongThi: false, ketLuan: 'reached' }) === 'ket_thuc', 'đạt');
    assert(d.goiYBuocTiep({ khongThi: false, ketLuan: 'not_reached' }) === 'hoc_lai', 'chưa đạt');
    assert(d.goiYBuocTiep({ khongThi: true, ketLuan: 'unknown' }) === 'hoc_lai', 'không thi');
    assert(d.goiYBuocTiep({ khongThi: false, ketLuan: 'unknown' }) === null, 'không Target');
    assert(d.BUOC_TIEP.every((k: string) => typeof d.BUOC_TIEP_NHAN[k] === 'string'), 'đủ nhãn');
  });

  await checkAsync('OV8a-1 · nhập kết quả → em KHÔNG tự Lưu trữ, việc QL "Chọn bước tiếp sau thi" (hạn +7, Vận hành); GVCN không có việc; Tổng kết có mục Bước tiếp + gợi ý', () => thu(() => {
    const lop = taoLop();
    const gvcn = ganGvcn(lop, P.normalCoreTeacher.userId);
    const a = emDaKetThuc(lop);
    assert(viecBt(QL, a.sid).length === 0, 'chưa có kết quả → chưa có việc');
    thiThatSvc.datKetQuaThiThat(gvcn, a.cy, NHAP4);
    assert(hoSo(a.sid).archived_at === null && hoSo(a.sid).status === 'finished', `không tự lưu trữ: ${JSON.stringify(hoSo(a.sid))}`);
    const v = viecBt(QL, a.sid);
    assert(v.length === 1 && v[0].due === addDays(NGAY, 7) && v[0].tieuDe.startsWith('Chọn bước tiếp sau thi') && v[0].mine && v[0].key === `buoc_tiep:${a.cy}`, JSON.stringify(v));
    assert(v[0].href.includes(`tong-ket=${a.cy}`) && d.nhomViecCua('buoc_tiep') === 'van-hanh', v[0].href);
    assert(viecBt(gvcn, a.sid).length === 0, 'GVCN không có việc');
    const bt = tongKetSvc.tongKetLoTrinh(QL, a.cy).buocTiep;
    assert(bt && bt.chon === null && bt.goiY === 'ket_thuc' && bt.coTheChon === true, JSON.stringify(bt));
    assert(tongKetSvc.tongKetLoTrinh(gvcn, a.cy).buocTiep.coTheChon === false, 'GVCN chỉ xem');
    /* Việc quá hạn (đỏ, không chặn) khi qua 7 ngày: dời ngày nhập kết quả về trước. */
    conn.prepare(`UPDATE journey_events SET event_date = ? WHERE cycle_id = ? AND event_type = 'cycle_outcome'`).run(addDays(NGAY, -10), a.cy);
    conn.prepare('UPDATE learning_cycles SET ended_at = ? WHERE id = ?').run(addDays(NGAY, -10), a.cy);
    assert(viecBt(QL, a.sid)[0]?.urgency === 'overdue', 'quá hạn');
  }));

  await checkAsync('OV8a-2 · QL Kết thúc → lộ trình đóng + Lưu trữ + việc hết + mốc Hành trình; Hoàn tác → ra khỏi Lưu trữ, việc quay lại', () => thu(() => {
    const lop = taoLop();
    const a = emDaKetThuc(lop);
    thiThatSvc.datKetQuaThiThat(P.admin, a.cy, NHAP4);
    chon(QL, a.cy, { chon: 'ket_thuc' });
    assert(hoSo(a.sid).archived_at === NGAY && loTrinh(a.cy).status !== 'active' && loTrinh(a.cy).buoc_tiep === 'ket_thuc', JSON.stringify([hoSo(a.sid), loTrinh(a.cy).buoc_tiep]));
    assert(viecBt(QL, a.sid).length === 0, 'việc hết');
    assert(get(`SELECT 1 x FROM journey_events WHERE cycle_id = ? AND title = 'Sau thi: Kết thúc'`, a.cy), 'mốc Hành trình');
    const bt = tongKetSvc.tongKetLoTrinh(QL, a.cy).buocTiep;
    assert(bt.chon === 'ket_thuc' && bt.luc === NGAY && bt.boi, JSON.stringify(bt));
    buocTiepSvc.boChonBuocTiep(QL, a.cy);
    assert(hoSo(a.sid).archived_at === null && loTrinh(a.cy).buoc_tiep === null && viecBt(QL, a.sid).length === 1, 'Hoàn tác');
  }));

  await checkAsync('OV8a-3 · Học tiếp LT2 → lộ trình mới ở lớp đã chọn, em hết Lưu trữ, bản chụp + kết quả thi lộ trình cũ còn; thiếu lớp → 400', () => thu(() => {
    const lop = taoLop(); const lt2 = taoLop('LT2');
    const a = emDaKetThuc(lop);
    thiThatSvc.datKetQuaThiThat(P.admin, a.cy, NHAP4);
    studentsSvc.archiveStudent(QL, a.sid);   // QL đã lưu trữ tay: Học tiếp vẫn đưa ra khỏi Lưu trữ
    assert(maLoi(() => chon(QL, a.cy, { chon: 'hoc_tiep' })) === 400, 'Học tiếp phải chọn lớp');
    chon(QL, a.cy, { chon: 'hoc_tiep', lopMoiId: lt2 });
    const moi = dangChay(a.sid);
    assert(hoSo(a.sid).status === 'active' && hoSo(a.sid).archived_at === null, JSON.stringify(hoSo(a.sid)));
    assert(moi.length === 1 && moi[0].id !== a.cy && moi[0].route === 'LT2' && ghiDanhDang(a.sid).join() === String(lt2), JSON.stringify(moi));
    const b = get('SELECT * FROM ban_chup_lo_trinh WHERE cycle_id = ? ORDER BY lan DESC LIMIT 1', a.cy);
    assert(b && b.thi_that_ovr === 6.5 && loTrinh(a.cy).status !== 'active' && loTrinh(a.cy).buoc_tiep === 'hoc_tiep', JSON.stringify(b));
    assert(viecBt(QL, a.sid).length === 0, 'việc hết');
    assert(tongKetSvc.tongKetLoTrinh(QL, a.cy).huongTiep.khoa === 'len_lt2', 'Hướng tiếp theo Bước tiếp (LT1 → LT2)');
  }));

  await checkAsync('OV8a-4 · Học lại về lớp cũ → như panel Học lại (lớp cũ, ra khỏi Lưu trữ) nhưng mở lộ trình MỚI — lộ trình đã thi đóng hẳn; Hoàn tác về đúng trạng thái', () => thu(() => {
    const lop = taoLop();
    const a = emDaKetThuc(lop);
    thiThatSvc.datKetQuaThiThat(P.admin, a.cy, { ...NHAP4, l: 5, r: 5 });   // chưa đạt → gợi ý Học lại
    assert(tongKetSvc.tongKetLoTrinh(QL, a.cy).buocTiep.goiY === 'hoc_lai', 'gợi ý Học lại');
    chon(QL, a.cy, { chon: 'hoc_lai', moLaiLop: true });
    const moi = dangChay(a.sid);
    assert(hoSo(a.sid).status === 'active' && ghiDanhDang(a.sid).join() === String(lop), JSON.stringify(ghiDanhDang(a.sid)));
    assert(moi.length === 1 && moi[0].id !== a.cy && loTrinh(a.cy).status === 'completed', JSON.stringify([moi, loTrinh(a.cy).status]));
    assert(tongKetSvc.tongKetLoTrinh(QL, a.cy).huongTiep.khoa === 'hoc_lai', 'Hướng tiếp = Học lại');
    buocTiepSvc.boChonBuocTiep(QL, a.cy);
    assert(tongKetSvc.tongKetLoTrinh(QL, a.cy).huongTiep.khoa === 'ket_thuc', 'Hoàn tác: Hướng tiếp như lúc đóng');
    assert(hoSo(a.sid).status === 'finished' && dangChay(a.sid).length === 0 && loTrinh(a.cy).status === 'abandoned' && loTrinh(a.cy).buoc_tiep === null,
      JSON.stringify([hoSo(a.sid), loTrinh(a.cy).status]));
  }));

  await checkAsync('OV8a-5 · đổi lựa chọn: Kết thúc → Học tiếp đúng như chỉ chọn Học tiếp; Học tiếp → Kết thúc gỡ lộ trình mới; lộ trình mới đã có điểm → 409, không ghi dở', () => thu(() => {
    const lop = taoLop(); const lt2 = taoLop('LT2');
    const a = emDaKetThuc(lop); const b = emDaKetThuc(lop);
    for (const x of [a, b]) thiThatSvc.datKetQuaThiThat(P.admin, x.cy, NHAP4);
    chon(QL, a.cy, { chon: 'ket_thuc' });
    chon(QL, a.cy, { chon: 'hoc_tiep', lopMoiId: lt2 });
    chon(QL, b.cy, { chon: 'hoc_tiep', lopMoiId: lt2 });
    const tom = (x: { sid: number; cy: number }) => JSON.stringify([hoSo(x.sid), ghiDanhDang(x.sid), dangChay(x.sid).map((c) => c.route), loTrinh(x.cy).status, loTrinh(x.cy).buoc_tiep]);
    assert(tom(a) === tom(b), `${tom(a)} ≠ ${tom(b)}`);
    assert(all(`SELECT 1 FROM journey_events WHERE cycle_id = ? AND title LIKE 'Sau thi:%'`, a.cy).length === 2, 'mỗi lần chọn một mốc');
    chon(QL, b.cy, { chon: 'ket_thuc' });
    assert(hoSo(b.sid).status === 'finished' && hoSo(b.sid).archived_at === NGAY && dangChay(b.sid).length === 0 && ghiDanhDang(b.sid).length === 0, tom(b));
    /* lộ trình mới đã có bài làm → không đổi được */
    const moi = dangChay(a.sid)[0];
    conn.prepare(`INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, status, target_at_attempt, created_at) VALUES (?,?,99,'mock',?, 'done', 6.5, ?)`)
      .run(moi.id, a.sid, lt2, new Date().toISOString());
    const truoc = tom(a);
    assert(maLoi(() => chon(QL, a.cy, { chon: 'ket_thuc' })) === 409, 'có điểm → 409');
    assert(tom(a) === truoc, 'không ghi dở');
  }));

  await checkAsync('OV8a-6 · GVCN / TVV / GVBM gọi chọn bước tiếp → 403; lộ trình chưa có kết quả → 400', () => thu(() => {
    const lop = taoLop();
    const gvcn = ganGvcn(lop, P.normalCoreTeacher.userId);
    const a = emDaKetThuc(lop);
    assert(maLoi(() => chon(QL, a.cy, { chon: 'ket_thuc' })) === 400, 'chưa có kết quả → 400');
    thiThatSvc.datKetQuaThiThat(gvcn, a.cy, NHAP4);
    const tvvId = get(`SELECT ur.user_id id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'consultant' AND ur.status = 'active' ORDER BY ur.branch_id = ? DESC, ur.user_id LIMIT 1`, MB)?.id;
    const ai = [gvcn, P.normalSubjectTeacher, ...(tvvId ? [loadPrincipal(tvvId)] : [])];
    for (const pr of ai) {
      assert(maLoi(() => chon(pr, a.cy, { chon: 'ket_thuc' })) === 403, `vai ${pr.userId} phải 403`);
      assert(maLoi(() => buocTiepSvc.boChonBuocTiep(pr, a.cy)) === 403, `bỏ chọn ${pr.userId} phải 403`);
    }
    assert(maLoi(() => chon(QL, a.cy, { chon: 'thoi' })) === 400, 'lựa chọn lạ → 400');
    assert(hoSo(a.sid).archived_at === null && loTrinh(a.cy).buoc_tiep === null, 'không đổi gì');
  }));

  await checkAsync('OV8a-7 · Không thi → việc + gợi ý Học lại; Kết thúc học em FT đã có kết quả → không Lưu trữ, có việc; nhiều em cùng lớp → một dòng gộp', () => thu(() => {
    const lop = taoLop();
    const a = emDaKetThuc(lop);
    thiThatSvc.datKetQuaThiThat(P.admin, a.cy, { khongThi: true });
    assert(hoSo(a.sid).archived_at === null && viecBt(QL, a.sid).length === 1 && tongKetSvc.tongKetLoTrinh(QL, a.cy).buocTiep.goiY === 'hoc_lai', 'Không thi');
    /* có kết quả khi em còn học → Kết thúc học: chưa Lưu trữ, việc hiện */
    seq += 1;
    const now = new Date().toISOString();
    const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
      .run(`PISA-OV8A-${seq}`, `Hoc vien OV8A ${seq}`, `hoc vien ov8a ${seq}`, MB, now).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, lop, NGAY, now);
    const cy = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, started_at, status, created_at) VALUES (?, 1, 'LT1', 'FT', 6.5, ?, 'active', ?)`)
      .run(sid, NGAY, now).lastInsertRowid);
    thiThatSvc.datKetQuaThiThat(P.admin, cy, NHAP4);
    assert(viecBt(QL, sid).length === 0, 'lộ trình còn chạy → chưa có việc');
    studentsSvc.setStudentStatus(P.admin, sid, 'finished', NGAY, 'Hết khoá');
    assert(hoSo(sid).archived_at === null && viecBt(QL, sid).length === 1, 'Kết thúc học: chờ QL chọn');
    const dong = ((myWork.myWork(QL, {}) as any).dong as any[]).filter((x: any) => x.group === 'buoc_tiep' && x.classId === lop);
    assert(dong.length === 1 && dong[0].con?.length === 2, JSON.stringify(dong.map((x: any) => [x.key, x.con?.length])));
  }));

  await checkAsync('OV8a-8 · migrate prOv8a thêm cột, chạy lặp không đổi gì', () => thu(async () => {
    const mig: any = await import('../migrate/prOv8a.ts');
    const a: string[] = [];
    mig.migratePrOv8a(conn, a);
    assert(a.length === 0, `DB đã có cột → không báo: ${a.join()}`);
    const cot = all('SELECT name FROM pragma_table_info(?)', 'learning_cycles').map((r) => r.name);
    assert(['buoc_tiep', 'buoc_tiep_luc', 'buoc_tiep_boi', 'buoc_tiep_json'].every((c) => cot.includes(c)), cot.join());
  }));
}
