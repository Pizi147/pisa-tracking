/** PHÉP KIỂM PR-YT4 — Ý thức v4: một hàm trạng thái, thang bắt buộc, QL duyệt biện pháp nặng. Harness do `run.ts` truyền vào. */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrYt4Tests(t: YThucTestKit) {
  const { check, assert } = t;
  const d = await import('../../../shared/domain/index.ts');
  console.log('\nPR-YT4 · Ý thức v4');

  // ------------------------------------------------------------------ Task 1 · luật thuần (ngày cố định: 14/09/2026 là Thứ Hai)
  type Xl = { id: number; kind: string; status: any; performedOn: string | null; quyetLuc: string | null };
  const vp = (id: number, occurredOn: string, reportedOn = occurredOn, ghiNhanLuc: string | null = null, xuLy: Xl[] = []) =>
    ({ id, occurredOn, reportedOn, ghiNhanLuc, xuLy });
  const n = (homNay: string, mocLop: string | null = null, tamDung = false) => ({ homNay, mocLop, tamDung });
  const ba = [vp(1, '2026-09-07'), vp(2, '2026-09-09'), vp(3, '2026-09-15')];
  const tt = (ds: ReturnType<typeof vp>[], id: number, nn: ReturnType<typeof n>) => {
    const bb = d.batBuocTu(ds);
    return d.trangThaiViPham(ds.find((v) => v.id === id)!, bb.get(id) ?? null, nn);
  };

  check('YT4 (1) · 2 vi phạm trong 2 tuần → không bắt buộc', () => {
    assert(d.batBuocTu(ba.slice(0, 2)).size === 0, 'không bắt buộc');
  });
  check('YT4 (1) · 3 vi phạm (T2, T4 tuần trước + T3 tuần này) → bắt buộc từ ngày ghi vi phạm thứ 3', () => {
    const bb = d.batBuocTu(ba);
    assert(bb.size === 3 && [...bb.values()].every((x) => x === '2026-09-15'), JSON.stringify([...bb]));
  });
  check('YT4 (1) · bắt buộc "dính" (K5-23): 14 ngày sau vẫn Quá hạn, không tự hết khi sang tuần', () => {
    const r = tt(ba, 1, n('2026-09-29'));
    assert(r.t === 'qua_han' && r.lyDoQuaHan === 'xu-ly' && r.quaHanNgay === 10, JSON.stringify(r));
  });
  check('YT4 (1) · vi phạm tuần trước nữa không đếm', () => {
    assert(d.batBuocTu([vp(1, '2026-09-04'), vp(2, '2026-09-09'), vp(3, '2026-09-15')]).size === 0, 'tuần trước nữa');
  });
  check('YT4 (1) · ghi muộn (xảy ra −10 ngày): cửa sổ theo NGÀY GHI, bắt buộc từ ngày ghi muộn', () => {
    const bb = d.batBuocTu([vp(1, '2026-09-16'), vp(2, '2026-09-17'), vp(3, '2026-09-08', '2026-09-18')]);
    assert(bb.size === 3 && bb.get(1) === '2026-09-18', JSON.stringify([...bb]));
  });
  check('YT4 (1) · Đã ghi nhận + đủ 3 → Cần xử lý (M-10, V4-6)', () => {
    const ds = [vp(1, '2026-09-07', '2026-09-07', '2026-09-08'), vp(2, '2026-09-09'), vp(3, '2026-09-15')];
    const r = tt(ds, 1, n('2026-09-16'));
    assert(r.t === 'can_xu_ly' && r.han === '2026-09-19', JSON.stringify(r));
  });
  check('YT4 (1) · lần xử lý xong phủ 2/3 → vi phạm còn lại không bắt buộc', () => {
    const xong: Xl = { id: 9, kind: 'report_1', status: 'done', performedOn: '2026-09-15', quyetLuc: null };
    const ds = [vp(1, '2026-09-07', '2026-09-07', null, [xong]), vp(2, '2026-09-09', '2026-09-09', null, [xong]), vp(3, '2026-09-15')];
    assert(d.batBuocTu(ds).size === 0, 'không bắt buộc');
    assert(tt(ds, 1, n('2026-09-16')).nhan === 'Đã xử lý · Report 1', 'nhãn đã xử lý');
  });
  check('YT4 (1) · Chờ QL duyệt không bao giờ Quá hạn; Đã duyệt · chờ thực hiện có hạn ngày quyết + 4', () => {
    const cho = tt([vp(1, '2026-09-01', '2026-09-01', null, [{ id: 9, kind: 'wl_3', status: 'cho_duyet', performedOn: null, quyetLuc: null }])], 1, n('2026-09-29'));
    assert(cho.t === 'cho_duyet' && cho.nhan === 'Chờ QL duyệt' && cho.han === null, JSON.stringify(cho));
    const duyet = tt([vp(1, '2026-09-01', '2026-09-01', null, [{ id: 9, kind: 'wl_3', status: 'da_duyet', performedOn: null, quyetLuc: '2026-09-10' }])], 1, n('2026-09-16'));
    assert(duyet.t === 'cho_duyet' && duyet.nhan === 'Đã duyệt · chờ thực hiện' && duyet.han === '2026-09-14' && duyet.quaHanNgay === 2, JSON.stringify(duyet));
  });
  check('YT4 (1) · QL từ chối → Cần xử lý từ ngày quyết (V4-10)', () => {
    const ds = [vp(1, '2026-09-01', '2026-09-01', '2026-09-02', [{ id: 9, kind: 'suspension', status: 'tu_choi', performedOn: null, quyetLuc: '2026-09-20' }])];
    assert(d.batBuocTu(ds).get(1) === '2026-09-20', 'từ ngày quyết');
    const r = tt(ds, 1, n('2026-09-22'));
    assert(r.t === 'can_xu_ly' && r.han === '2026-09-24', JSON.stringify(r));
  });
  check('YT4 (1) · hạn = ngày ghi thứ 3 + 4 (tính cả ngày đầu); hôm sau hạn → Quá hạn 1 ngày', () => {
    assert(tt(ba, 3, n('2026-09-19')).t === 'can_xu_ly', 'đúng hạn');
    const r = tt(ba, 3, n('2026-09-20'));
    assert(r.t === 'qua_han' && r.quaHanNgay === 1 && r.nhan === 'Quá hạn 1 ngày', JSON.stringify(r));
  });
  check('YT4 (1) · chuyển lớp (M-08): hạn đặt lại từ ngày vào lớp mới', () => {
    const r = tt(ba, 1, n('2026-09-26', '2026-09-25'));
    assert(r.t === 'can_xu_ly' && r.han === '2026-09-29', JSON.stringify(r));
  });
  check('YT4 (1) · Tạm dừng (T65): không Quá hạn, không hạn', () => {
    const r = tt(ba, 1, n('2026-09-29', null, true));
    assert(r.t === 'can_xu_ly' && r.han === null, JSON.stringify(r));
    assert(tt([vp(1, '2026-09-01')], 1, n('2026-09-29', null, true)).t === 'moi', 'Mới vẫn Mới');
  });
  check('YT4 (1) · Mới quá 5 ngày chưa ai xem → Quá hạn lý do "xem" (V4-5); trong 5 ngày → Mới', () => {
    const r = tt([vp(1, '2026-09-08', '2026-09-10')], 1, n('2026-09-15'));
    assert(r.t === 'qua_han' && r.lyDoQuaHan === 'xem' && r.han === '2026-09-14', JSON.stringify(r));
    assert(tt([vp(1, '2026-09-08', '2026-09-10')], 1, n('2026-09-14')).t === 'moi', 'còn hạn');
    assert(tt([vp(1, '2026-09-08', '2026-09-10', '2026-09-11')], 1, n('2026-09-29')).t === 'da_ghi_nhan', 'Đã ghi nhận không quá hạn');
  });
  check('YT4 (1) · chuoiThang: lớp thường FOU → BE → ELE liền nhau một chuỗi (Q-C)', () => {
    const c = [{ id: 1, seq: 1, route: null, status: 'completed' }, { id: 2, seq: 2, route: null, status: 'completed' }, { id: 3, seq: 3, route: null, status: 'active' }];
    assert(d.chuoiThang(c, 3).join() === '1,2,3', d.chuoiThang(c, 3).join());
  });
  check('YT4 (1) · chuoiThang: FT một lộ trình; FT rồi FOU → chuỗi FOU riêng', () => {
    const c = [{ id: 1, seq: 1, route: 'LT1', status: 'completed' }, { id: 2, seq: 2, route: null, status: 'active' }];
    assert(d.chuoiThang(c, 2).join() === '2' && d.chuoiThang(c, 1).join() === '1', 'FT gãy chuỗi');
    const ft = [{ id: 5, seq: 1, route: 'LT1', status: 'completed' }, { id: 6, seq: 2, route: 'LT2', status: 'active' }];
    assert(d.chuoiThang(ft, 6).join() === '6', 'LT2 riêng');
  });
  check('YT4 (1) · chuoiThang: nghỉ học (abandoned) rồi quay lại → chuỗi mới', () => {
    const c = [{ id: 1, seq: 1, route: null, status: 'abandoned' }, { id: 2, seq: 2, route: null, status: 'active' }];
    assert(d.chuoiThang(c, 2).join() === '2' && d.chuoiThang(c, 1).join() === '1', d.chuoiThang(c, 2).join());
  });
  check('YT4 (1) · bậc: max(lần xử lý xong, khai); ngoài thang không đẩy; bậc kế và hết thang', () => {
    assert(d.bacHienTai([{ kind: 'report_1' }, { kind: 'meeting_cx' }], 2) === 2, 'khai thắng');
    assert(d.bacHienTai([{ kind: 'wl_1' }], null) === 3 && d.bacHienTai([], null) === 0, 'từ kind');
    assert(d.bacKeTiep(2)!.kind === 'wl_1' && d.bacKeTiep(0)!.kind === 'report_1' && d.bacKeTiep(0)!.bac === 1, 'kế');
    assert(d.bacKeTiep(5)!.canQl === true && d.bacKeTiep(4)!.canQl === false && d.bacKeTiep(6) === null, 'WL 3 cần QL, hết thang null');
  });
  check('YT4 (1) · canQl / nhãn loại: WL 3 + ngoài thang cần QL; loại lạ → "Xử lý (loại cũ)"', () => {
    assert(d.canQl('wl_3') && d.canQl('suspension') && d.canQl('meeting_cx') && d.canQl('other') && !d.canQl('report_4_meeting'), 'canQl');
    assert(d.nhanLoaiXuLy('talk_short') === 'Xử lý (loại cũ)' && d.nhanLoaiXuLy('other', 'Gặp PH') === 'Gặp PH' && d.nhanLoaiXuLy('wl_2') === 'WL 2', 'nhãn');
  });
  check('YT4 (1) · nhomEm: vừa chờ duyệt vừa quá hạn → Quá hạn; đã xử lý 7 ngày gần nhất', () => {
    assert(d.nhomEm({ ds: ['cho_duyet', 'qua_han'], coDeXuatCho: true, xuLyGanNhat: null }, '2026-09-14') === 'qua_han', 'quá hạn thắng');
    assert(d.nhomEm({ ds: ['can_xu_ly', 'moi'], coDeXuatCho: false, xuLyGanNhat: null }, '2026-09-14') === 'bat_buoc', 'bắt buộc');
    assert(d.nhomEm({ ds: ['da_ghi_nhan'], coDeXuatCho: false, xuLyGanNhat: '2026-09-08' }, '2026-09-14') === 'da_xu_ly', '7 ngày');
    assert(d.nhomEm({ ds: ['da_ghi_nhan'], coDeXuatCho: false, xuLyGanNhat: '2026-09-07' }, '2026-09-14') === null, 'quá 7 ngày');
  });
  check('YT4 (1) · macDinhTick (K3-36): chưa xử lý từ T2 tuần trước + mọi Mới + bắt buộc; Đã ghi nhận cũ → Cũ hơn', () => {
    const r = d.macDinhTick([
      { id: 1, t: 'da_ghi_nhan', occurredOn: '2026-09-08' }, { id: 2, t: 'da_ghi_nhan', occurredOn: '2026-09-01' },
      { id: 3, t: 'moi', occurredOn: '2026-08-20' }, { id: 4, t: 'qua_han', occurredOn: '2026-08-25' }, { id: 5, t: 'da_xu_ly', occurredOn: '2026-09-10' },
    ], '2026-09-16');
    assert(r.tick.join() === '1,3,4' && r.cuHon.join() === '2', JSON.stringify(r));
  });
  check('YT4 (1) · dongThang(2, khai 2) → hai bậc "khai", bậc 3 "lần này", WL 3 cần QL', () => {
    const t2 = d.dongThang(2, { bac: 2 });
    assert(t2.map((x) => x.trangThai).join() === 'khai,khai,lan-nay,sau,sau,sau', t2.map((x) => x.trangThai).join());
    assert(t2[5].canQl && t2[3].nhan === 'Report 4 + Meeting CX/GĐCN', 'WL 3');
    assert(d.dongThang(3, { bac: 2 }).map((x) => x.trangThai).join() === 'khai,khai,qua,lan-nay,sau,sau', 'qua sau khai');
  });

  // ------------------------------------------------------------------ Task 2 · migrate cấu trúc
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const { default: SqliteDb } = await import('libsql');
  const { migratePrYt4 } = await import('../migrate/prYt4.ts');
  const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
  const SCHEMA = fs.readFileSync(path.join(REPO, 'server/src/schema.sql'), 'utf8');
  const cot = (db: any, bang: string) => (db.prepare(`PRAGMA table_info(${bang})`).all() as any[]).map((c) => `${c.name}:${c.type}:${c.notnull}:${c.pk}`);
  /* DB thời trước YT4: cắt phần YT4 khỏi CHỮ schema.sql (libsql lỗi "incomplete input" khi DROP COLUMN trên bảng có chú thích). */
  const truocYt4 = () => {
    const cat = SCHEMA.replace(/\r\n/g, '\n')
      .replace(/,\n  -- PR-YT4 \(§5\.4[\s\S]*?ghi_nhan_boi INTEGER REFERENCES users\(id\)\n\);/, '\n);')
      .replace(/,\n  -- PR-YT4: ngày QL duyệt[^\n]*\n  quyet_luc TEXT\n\);/, '\n);')
      .replace(/CREATE TABLE y_thuc_khai_bac \([\s\S]*?\n\);/, '');
    if (/ghi_nhan_luc|quyet_luc|y_thuc_khai_bac \(/.test(cat)) throw new Error('schema.sql đổi khuôn — sửa bộ cắt của phép kiểm YT4 (2)');
    const m = new SqliteDb(':memory:');
    m.exec(cat);
    return m;
  };

  check('YT4 (2) · migrate chạy lặp được: lần một đủ 4 bước, lần hai không báo gì; DB thật (test) không đổi', () => {
    const m = truocYt4();
    const a: string[] = []; migratePrYt4(m, a);
    const b: string[] = []; migratePrYt4(m, b);
    assert(a.length === 4 && b.length === 0, `${a.join(' | ')} ‖ ${b.join(' | ')}`);
    const c: string[] = []; migratePrYt4(t.conn, c);
    assert(c.length === 0, `DB dựng từ schema.sql vẫn bị đổi: ${c.join(' | ')}`);
  });
  check('YT4 (2) · DB migrate có cột/bảng GIỐNG HỆT DB dựng từ schema.sql (tên, kiểu, NOT NULL, thứ tự)', () => {
    const m = truocYt4();
    migratePrYt4(m, []);
    const moi = new SqliteDb(':memory:');
    moi.exec(SCHEMA);
    for (const b of ['violations', 'discipline_measures', 'y_thuc_khai_bac']) {
      assert(JSON.stringify(cot(m, b)) === JSON.stringify(cot(moi, b)), `${b}:
  ${cot(m, b).join(',')}
  ${cot(moi, b).join(',')}`);
    }
  });
  check('YT4 (2) · UNIQUE (em, chuỗi) chặn khai bậc lần hai; nhãn nhật ký tiếng Việt cho 6 thao tác mới', () => {
    const m = new SqliteDb(':memory:');
    m.exec(SCHEMA);
    m.exec('PRAGMA foreign_keys = OFF');
    const them = () => m.prepare(`INSERT INTO y_thuc_khai_bac (student_id, chuoi_cycle_id, bac, ghi_chu, khai_luc) VALUES (1, 1, 2, 'x', '2026-09-14')`).run();
    them();
    let loi = '';
    try { them(); } catch (e: any) { loi = String(e?.message ?? e); }
    assert(/UNIQUE/i.test(loi), `khai lần hai phải bị chặn: ${loi}`);
    for (const ma of ['acknowledge', 'handle', 'propose', 'performed', 'declare_level', 'declare_level_edit']) {
      assert(d.nhanHanhDongNhatKy(`discipline.${ma}`) !== 'Thao tác hệ thống', `thiếu nhãn discipline.${ma}`);
    }
  });

  // ------------------------------------------------------------------ Task 3 · một cửa trạng thái máy chủ + quyền lớp đang học
  const { conn, P, TODAY, addDays } = t;
  const intake: any = await import('../classes/intake.ts');
  const { boLichTuTao } = await import('./luotThu.ts');
  const { loadPrincipal, can } = await import('../permissions.ts');
  const tt3: any = await import('../yThuc/trangThai.ts');
  const board: any = await import('../yThuc/board.ts');
  const viol: any = await import('../yThuc/violations.ts');
  const classesSvc: any = await import('../classes/classes.ts');
  const dongHv: any = await import('../classes/dongHocVien.ts');
  const metricsSvc: any = await import('../worklist/metrics.ts');
  const tongQuanSvc: any = await import('../worklist/tongQuan.ts');
  const { soCauSql } = await import('../platform/nguCanhRequest.ts');
  const mbId = (conn.prepare("SELECT id FROM branches WHERE code = 'MB'").get() as any).id as number;
  const LOP = t.classId('MB FT 101');
  const gvbm = P.w1Teacher;
  let seq = 0;
  /** Học viên thử riêng từng phép kiểm (không lẫn số). */
  const hv = (lop = LOP): number => {
    const ten = `YT4 HV ${++seq}`;
    intake.commitIntake(P.admin, { classId: lop, rows: [{ fullName: ten, target: 7, email: 'hv@demo.test' }], idempotencyKey: `yt4-${seq}` });
    const id = (conn.prepare('SELECT id FROM students WHERE full_name = ?').get(ten) as any).id as number;
    const cy = conn.prepare("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'").get(id) as any;
    if (cy) boLichTuTao(conn, cy.id);
    /* Ngày vào lớp cũ hẳn — hạn chỉ phụ thuộc ngày ghi vi phạm trong phép kiểm (mocLop không chen vào). */
    conn.prepare("UPDATE enrollments SET started_at = '2026-08-03' WHERE student_id = ?").run(id);
    return id;
  };
  /** Vi phạm ghi thẳng bảng (cần ngày ghi quá khứ): `ngay` = ngày xảy ra = ngày ghi, trừ khi truyền `ghi`. */
  const vpDb = (sid: number, ngay: string, o: { ghi?: string; ghiNhan?: string | null } = {}) => Number(conn.prepare(
    `INSERT INTO violations (student_id, class_id, category, occurred_on, reported_on, reported_by, description, created_at, ghi_nhan_luc)
     VALUES (?, (SELECT class_id FROM enrollments WHERE student_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1), 'homework', ?, ?, ?,
             'Vi phạm thử của phép kiểm YT4', ?, ?)`,
  ).run(sid, sid, ngay, o.ghi ?? ngay, gvbm.userId, new Date().toISOString(), o.ghiNhan ?? null).lastInsertRowid);
  const em = (sid: number, homNay = TODAY) => tt3.trangThaiYThuc([sid], homNay).get(sid);
  /** Lớp riêng + GVCN riêng (tài khoản giáo viên MB không dạy lớp MB FT 101). */
  const lopMoi = (ma: string) => {
    const gv = (conn.prepare(
      `SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id
        WHERE r.key = 'teacher' AND ur.user_id NOT IN (SELECT user_id FROM teacher_assignments WHERE class_id = ? AND status = 'active')
        ORDER BY ur.user_id LIMIT 1`).get(LOP) as any).id as number;
    const c = intake.createClass(P.admin, { code: ma, branchId: mbId, kind: 'FT', isFastTrack: true, startDate: '2026-08-03' }) as any;
    conn.prepare(`INSERT INTO teacher_assignments (class_id, user_id, skill, is_core, status, effective_from, created_at) VALUES (?, ?, NULL, 1, 'active', '2026-01-01', ?)`)
      .run(c.id, gv, new Date().toISOString());
    return { id: c.id as number, gvcn: loadPrincipal(gv) };
  };
  /** Chuyển lớp bằng SQL (điều khiển được ngày): ghi danh cũ `transferred`, ghi danh mới `active` từ `ngay`. */
  const chuyen = (sid: number, lop: number, ngay: string) => {
    conn.prepare(`UPDATE enrollments SET status = 'transferred', ended_at = ? WHERE student_id = ? AND status = 'active'`).run(ngay, sid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?, ?, 'active', ?, ?)`).run(sid, lop, ngay, new Date().toISOString());
  };
  const ba3 = (sid: number, tu = addDays(TODAY, -3)) => [0, 1, 2].map((i) => vpDb(sid, addDays(tu, i)));
  const REPO3 = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

  check('YT4 (3) · K1-26: vi phạm Đã ghi nhận quá 5 ngày KHÔNG ở số quá hạn nào (nhóm, chỉ số hv-can-xu-ly, nhãn dòng em)', () => {
    const sid = hv();
    vpDb(sid, addDays(TODAY, -12), { ghiNhan: addDays(TODAY, -11) });
    const e = em(sid);
    assert(e.nhom === null && e.soBatBuoc === 0 && e.soMoi === 0, JSON.stringify({ nhom: e.nhom }));
    const ids = metricsSvc.metricSet(P.mbManager, 'hv-can-xu-ly', { branchId: mbId }).ids as number[];
    assert(!ids.includes(sid), 'không ở hv-can-xu-ly');
    assert(!dongHv.canhBaoTheoHocVien(P.coreTeacher, LOP).has(sid), 'không nhãn dòng em');
  });
  check('YT4 (3) · Mới chưa ai xem quá 5 ngày → nhóm Quá hạn (lý do xem); cùng em ở hv-can-xu-ly và nhãn dòng em "Quá hạn"', () => {
    const sid = hv();
    const v = vpDb(sid, addDays(TODAY, -7));
    const e = em(sid);
    assert(e.nhom === 'qua_han' && e.viPham.get(v).lyDoQuaHan === 'xem' && e.hanXem === addDays(TODAY, -3), JSON.stringify(e.viPham.get(v)));
    assert((metricsSvc.metricSet(P.mbManager, 'hv-can-xu-ly', { branchId: mbId }).ids as number[]).includes(sid), 'hv-can-xu-ly');
    assert(dongHv.canhBaoTheoHocVien(P.coreTeacher, LOP).get(sid)?.nhom === 'qua_han', 'nhãn dòng em');
  });
  check('YT4 (3) · chuyển lớp (M-08): hạn đặt lại từ ngày vào lớp mới; GVCN cũ mất quyền xử lý, GVCN mới có quyền (K5-34)', () => {
    const sid = hv();
    ba3(sid, addDays(TODAY, -12));
    assert(em(sid).nhom === 'qua_han', 'trước khi chuyển: quá hạn');
    const moi = lopMoi('MB FT YT4CL');
    chuyen(sid, moi.id, addDays(TODAY, -1));
    const e = em(sid);
    assert(e.nhom === 'bat_buoc' && e.han === addDays(TODAY, 3) && e.lopId === moi.id && e.gvcnId === moi.gvcn.userId, JSON.stringify({ n: e.nhom, h: e.han }));
    assert(!can(loadPrincipal(P.coreTeacher.userId), 'discipline.manage', { studentId: sid }), 'GVCN cũ không còn quyền');
    assert(can(moi.gvcn, 'discipline.manage', { studentId: sid }), 'GVCN mới có quyền');
    assert(!can(loadPrincipal(P.coreTeacher.userId), 'student.edit', { studentId: sid }), 'GVCN cũ không sửa hồ sơ (Q17)');
  });
  check('YT4 (3) · Tạm dừng (T65): không Quá hạn, không hạn; Quay lại học → hạn tính từ ngày quay lại', () => {
    const sid = hv();
    ba3(sid, addDays(TODAY, -14));
    conn.prepare(`UPDATE students SET status = 'inactive' WHERE id = ?`).run(sid);
    conn.prepare(`UPDATE enrollments SET status = 'paused' WHERE student_id = ? AND status = 'active'`).run(sid);
    const dung = em(sid);
    assert(dung.tamDung && dung.nhom === 'bat_buoc' && dung.han === null, JSON.stringify({ n: dung.nhom, h: dung.han }));
    conn.prepare(`UPDATE students SET status = 'active' WHERE id = ?`).run(sid);
    conn.prepare(`UPDATE enrollments SET status = 'active' WHERE student_id = ? AND status = 'paused'`).run(sid);
    conn.prepare(`INSERT INTO journey_events (student_id, event_type, event_date, title, created_at) VALUES (?, 'resume', ?, 'Quay lại học', ?)`)
      .run(sid, addDays(TODAY, -2), new Date().toISOString());
    const lai = em(sid);
    assert(!lai.tamDung && lai.nhom === 'bat_buoc' && lai.han === addDays(TODAY, 2), JSON.stringify({ n: lai.nhom, h: lai.han }));
  });
  check('YT4 (3) · 30 em → cửa trạng thái nạp ≤ 6 câu SQL (không N+1)', () => {
    const ids = (conn.prepare(`SELECT id FROM students ORDER BY id LIMIT 30`).all() as any[]).map((r) => r.id as number);
    const truoc = soCauSql();
    tt3.trangThaiYThuc(ids, TODAY);   // ngày truyền vào: đọc ngày nghiệp vụ (cấu hình) không tính là nạp
    const n = soCauSql() - truoc;
    assert(n <= 6, `${n} câu`);
  });
  check('YT4 (3) · Sửa ngày xảy ra ra khỏi cửa sổ 2 tuần → hết bắt buộc (Q1: không lưu cột, tự tính lại)', () => {
    const sid = hv();
    const [a] = ba3(sid);
    assert(em(sid).nhom === 'bat_buoc', 'trước khi sửa');
    viol.editViolation(P.admin, a, { occurredOn: addDays(TODAY, -20) });
    assert(em(sid).nhom !== 'bat_buoc', `sau khi sửa: ${em(sid).nhom}`);
  });
  check('YT4 (3) · Nhãn vi phạm ở mọi danh sách đọc CÙNG cửa trạng thái (listViolations = trangThaiYThuc)', () => {
    const sid = hv();
    ba3(sid);
    vpDb(sid, addDays(TODAY, -30), { ghiNhan: addDays(TODAY, -29) });
    const e = em(sid);
    const rows = viol.listViolations(P.coreTeacher, { studentId: sid }).rows as any[];
    assert(rows.length === 4 && rows.every((r) => r.trangThai === e.viPham.get(r.id).t && r.nhanTrangThai === e.viPham.get(r.id).nhan), JSON.stringify(rows.map((r) => r.trangThai)));
    assert(rows.filter((r) => r.trangThai === 'can_xu_ly').length === 3 && rows.some((r) => r.trangThai === 'da_ghi_nhan'), 'ba Cần xử lý + một Đã ghi nhận');
  });
  check('YT4 (3) · Bảng lớp (M6): mỗi em đúng MỘT nhóm, đúng thứ tự Quá hạn › Bắt buộc › Chờ QL › Mới › Đã xử lý', () => {
    const lop = lopMoi('MB FT YT4NH');
    const a = hv(lop.id); vpDb(a, addDays(TODAY, -8));
    const b = hv(lop.id); ba3(b);
    const c = hv(lop.id); vpDb(c, TODAY);
    hv(lop.id);
    const bd = board.bangYThucLop(lop.gvcn, lop.id) as any;
    assert(Object.keys(bd.nhom).join() === 'qua_han,bat_buoc,cho_duyet,moi,da_xu_ly', Object.keys(bd.nhom).join());
    const tat = Object.values(bd.nhom).flat() as any[];
    assert(tat.length === 3 && new Set(tat.map((x) => x.studentId)).size === 3, 'mỗi em một nhóm, em sạch không có');
    assert(bd.nhom.qua_han[0].studentId === a && bd.nhom.bat_buoc[0].studentId === b && bd.nhom.moi[0].studentId === c, 'đúng nhóm');
    assert(bd.nhom.bat_buoc[0].keTiep.nhan === 'Report 1' && bd.nhom.bat_buoc[0].soBatBuoc === 3 && bd.nhom.bat_buoc[0].han === addDays(TODAY, 3), JSON.stringify(bd.nhom.bat_buoc[0]));
    assert(bd.nhom.moi[0].moiTuoi === 0, 'tuổi vi phạm Mới');
  });
  check('YT4 (3) · Bảng lớp: dòng thời gian CẢ LỚP có tên em, mới nhất trước; không có thang', () => {
    const lop = lopMoi('MB FT YT4DT');
    const a = hv(lop.id); vpDb(a, addDays(TODAY, -5));
    const b = hv(lop.id); vpDb(b, addDays(TODAY, -1));
    const bd = board.bangYThucLop(lop.gvcn, lop.id) as any;
    assert(bd.dongThoiGian.length === 2 && bd.dongThoiGian[0].studentId === b && bd.dongThoiGian[0].ten && bd.dongThoiGian[1].studentId === a, JSON.stringify(bd.dongThoiGian.map((x: any) => x.studentId)));
    assert(!('thang' in bd) && bd.dongThoiGian.every((x: any) => x.loai === 'vi-pham' && x.nhanTrangThai), 'không thang, có nhãn');
  });
  check('YT4 (3) · Bảng lớp — quyền: GVBM đọc (không quản lý, ghi được), QL quản lý, QL chi nhánh khác bị chặn', () => {
    const bdGvbm = board.bangYThucLop(loadPrincipal(gvbm.userId), LOP) as any;
    assert(bdGvbm.canManage === false && bdGvbm.canRecord === true, 'GVBM');
    assert(board.bangYThucLop(P.mbManager, LOP).canManage === true, 'QL');
    let loi = '';
    try { board.bangYThucLop(P.cpManager, LOP); } catch (e: any) { loi = e.message; }
    assert(/phạm vi|quyền/.test(loi), `QL CP: ${loi}`);
  });
  check('YT4 (3) · Vấn đề đi theo em sang lớp mới: bảng lớp mới có em (Bắt buộc), bảng lớp cũ không còn', () => {
    const cu = lopMoi('MB FT YT4C1');
    const moi = lopMoi('MB FT YT4C2');
    const sid = hv(cu.id); ba3(sid);
    chuyen(sid, moi.id, TODAY);
    const tat = (bd: any) => (Object.values(bd.nhom).flat() as any[]).map((x) => x.studentId);
    assert(tat(board.bangYThucLop(moi.gvcn, moi.id)).includes(sid) && !tat(board.bangYThucLop(cu.gvcn, cu.id)).includes(sid), 'đi theo em');
  });
  check('YT4 (3) · Huy hiệu tab Ý thức của lớp = số em Quá hạn + Bắt buộc = số nhãn ở danh sách lớp', () => {
    const lop = lopMoi('MB FT YT4HH');
    ba3(hv(lop.id)); vpDb(hv(lop.id), addDays(TODAY, -9)); vpDb(hv(lop.id), TODAY);
    const ov = classesSvc.classOverview(P.admin, lop.id) as any;
    const roster = classesSvc.classRoster(P.admin, lop.id) as any[];
    assert(ov.canhBaoYThuc === 2 && roster.filter((s) => s.canhBaoYThuc).length === 2, `${ov.canhBaoYThuc} · ${roster.filter((s) => s.canhBaoYThuc).length}`);
  });
  check('YT4 (3) · Tổng quan › HV cần hỗ trợ (K1-17): "Ý thức · Quá hạn" cam / "Ý thức · Cần xử lý" vàng, dòng phụ có hạn; không còn tone xanh', () => {
    const q = hv(); vpDb(q, addDays(TODAY, -9));
    const b = hv(); ba3(b);
    const rows = tongQuanSvc.hocVienCanHoTro(P.coreTeacher).rows as any[];
    const rq = rows.find((r) => r.studentId === q); const rb = rows.find((r) => r.studentId === b);
    assert(rq?.huyHieu?.text === 'Ý thức · Quá hạn' && rq.huyHieu.tone === 'late', JSON.stringify(rq));
    assert(rb?.huyHieu?.text === 'Ý thức · Cần xử lý' && rb.huyHieu.tone === 'warn' && /3 vi phạm chưa xử lý · hạn \d\d\/\d\d/.test(rb.phu), JSON.stringify(rb));
    assert(!rows.some((r) => r.huyHieu?.text?.startsWith('Ý thức') && r.huyHieu.tone === 'info'), 'không còn tone xanh');
  });
  check('YT4 (3) · Cảnh báo mềm đã gỡ: không còn canhBao.ts', () => {
    assert(!fs.existsSync(path.join(REPO3, 'server/src/yThuc/canhBao.ts')), 'canhBao.ts còn');
  });
}
