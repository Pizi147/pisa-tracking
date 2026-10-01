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
  const { migratePrPb2b } = await import('../migrate/prPb2b.ts');
  const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
  const SCHEMA = fs.readFileSync(path.join(REPO, 'server/src/schema.sql'), 'utf8');
  const cot = (db: any, bang: string) => (db.prepare(`PRAGMA table_info(${bang})`).all() as any[]).map((c) => `${c.name}:${c.type}:${c.notnull}:${c.pk}`);
  /* DB thời trước YT4: cắt phần YT4 khỏi CHỮ schema.sql (libsql lỗi "incomplete input" khi DROP COLUMN trên bảng có chú thích). */
  const truocYt4 = () => {
    const cat = SCHEMA.replace(/\r\n/g, '\n')
      /* PR-Pb2-b thêm hai cột SAU ghi_nhan_boi → cắt trước; (2b) chạy lại migratePrPb2b theo đúng thứ tự migrate.ts. */
      .replace(/,\n  -- PR-Pb2-b \(Q14\)[\s\S]*?phan_hoi_ngay TEXT\n\);/, '\n);')
      .replace(/,\n  -- PR-YT4 \(§5\.4[\s\S]*?ghi_nhan_boi INTEGER REFERENCES users\(id\)\n\);/, '\n);')
      .replace(/,\n  -- PR-YT4: ngày QL duyệt[^\n]*\n  quyet_luc TEXT\n\);/, '\n);')
      .replace(/CREATE TABLE y_thuc_khai_bac \([\s\S]*?\n\);/, '');
    if (/ghi_nhan_luc|\n  quyet_luc TEXT\n\)|y_thuc_khai_bac \(/.test(cat)) throw new Error('schema.sql đổi khuôn — sửa bộ cắt của phép kiểm YT4 (2)');
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
    migratePrPb2b(m, []);
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
  check('YT4 (3) · 30 em → cửa trạng thái nạp ≤ 3 câu SQL (kế hoạch ≤ 6; không N+1)', () => {
    const ids = (conn.prepare(`SELECT id FROM students ORDER BY id LIMIT 30`).all() as any[]).map((r) => r.id as number);
    const truoc = soCauSql();
    tt3.trangThaiYThuc(ids, TODAY);   // ngày truyền vào: đọc ngày nghiệp vụ (cấu hình) không tính là nạp
    const n = soCauSql() - truoc;
    assert(n <= 3, `${n} câu`);
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

  // ------------------------------------------------------------------ Task 4 · Ghi nhận · Xác nhận xử lý · Khai bậc · Đã thực hiện · thông báo
  const xuLy: any = await import('../yThuc/xuLy.ts');
  const yc: any = await import('../duyet/yeuCau.ts');
  const gvcn = P.coreTeacher;
  const ghiVp = (who: any, sid: number, ngay = TODAY, category = 'homework') =>
    (viol.recordViolation(who, { studentId: sid, category, description: 'Vi phạm ghi qua máy chủ cho khối 4', occurredOn: ngay }) as any).violation.id as number;
  const xl = (who: any, sid: number, ids: number[], extra: Record<string, unknown> = {}) =>
    xuLy.xacNhanXuLy(who, sid, { violationIds: ids, performedOn: TODAY, note: 'Đã trao đổi với em và gia đình', ...extra });
  const loiCua = (fn: () => unknown): { status: number; msg: string } => {
    try { fn(); return { status: 0, msg: '' }; } catch (e: any) { return { status: e.status ?? 500, msg: String(e.message) }; }
  };
  const thongBao = (uid: number, like: string) => conn.prepare(`SELECT * FROM notifications WHERE user_id = ? AND dedup_key LIKE ?`).all(uid, like) as any[];
  const { createApp } = await import('../app.ts');
  const { createSession } = await import('../auth.ts');

  await t.checkAsync('YT4 (4) · Ghi nhận qua HTTP: Mới → Đã ghi nhận (ngày + người, có nhật ký); không đẩy bậc; GVBM 403', async () => {
    const sid = hv();
    const v = ghiVp(gvbm, sid);
    const server = createApp().listen(0);
    const port = (server.address() as any).port as number;
    const goi = async (who: any, body: unknown) => {
      const r = await fetch(`http://127.0.0.1:${port}/api/students/${sid}/y-thuc/ghi-nhan`, {
        method: 'POST', headers: { 'content-type': 'application/json', cookie: `pisa_demo_session=${createSession(who.userId)}` }, body: JSON.stringify(body) });
      return { status: r.status, json: await r.json().catch(() => null) as any };
    };
    const bm = await goi(gvbm, { violationIds: [v] });
    const ok = await goi(gvcn, { violationIds: [v] });
    server.close();
    assert(bm.status === 403, `GVBM: ${bm.status}`);
    assert(ok.status === 200 && ok.json?.soGhiNhan === 1, `GVCN: ${ok.status} ${JSON.stringify(ok.json)}`);
    const r = conn.prepare('SELECT ghi_nhan_luc, ghi_nhan_boi FROM violations WHERE id = ?').get(v) as any;
    assert(r.ghi_nhan_luc === TODAY && r.ghi_nhan_boi === gvcn.userId && em(sid).viPham.get(v).t === 'da_ghi_nhan' && em(sid).bac === 0, JSON.stringify(r));
    assert((conn.prepare(`SELECT COUNT(*) n FROM audit_logs WHERE action = 'discipline.acknowledge' AND entity_id = ?`).get(sid) as any).n === 1, 'nhật ký');
  });
  check('YT4 (4) · Ghi nhận vi phạm đang BẮT BUỘC → 400 "dùng Xác nhận xử lý" (V4-2)', () => {
    const sid = hv(); const ids = ba3(sid);
    const l = loiCua(() => xuLy.ghiNhan(gvcn, sid, [ids[0]]));
    assert(l.status === 400 && /bắt buộc — dùng Xác nhận xử lý/.test(l.msg), l.msg);
  });
  check('YT4 (4) · Q5: GVCN lớp đang học tự ghi → Đã ghi nhận; GVBM ghi → Mới; lần ghi làm bắt buộc → Cần xử lý thắng (M-10)', () => {
    const sid = hv();
    const a = ghiVp(gvcn, sid, addDays(TODAY, -2));
    const b = ghiVp(gvbm, sid, addDays(TODAY, -1));
    assert(em(sid).viPham.get(a).t === 'da_ghi_nhan' && em(sid).viPham.get(b).t === 'moi', 'tự ghi nhận / Mới');
    const c = ghiVp(gvcn, sid, TODAY);
    const e = em(sid);
    assert([a, b, c].every((x) => e.viPham.get(x).t === 'can_xu_ly'), JSON.stringify([...e.viPham.values()].map((x: any) => x.t)));
  });
  check('YT4 (4) · Xác nhận xử lý: bậc TỰ ĐIỀN Report 1 → Report 2 (client không gửi loại); vi phạm "Đã xử lý · Report 1"', () => {
    const sid = hv();
    const [a, b] = [ghiVp(gvbm, sid), ghiVp(gvbm, sid, addDays(TODAY, -1))];
    const m1 = xl(gvcn, sid, [a], { kind: 'wl_3' });
    assert(m1.kind === 'report_1' && m1.status === 'done' && m1.bac === 1, JSON.stringify(m1));
    assert(em(sid).viPham.get(a).nhan === 'Đã xử lý · Report 1' && em(sid).keTiep.kind === 'report_2', 'nhãn + bậc kế');
    const m2 = xl(gvcn, sid, [b]);
    assert(m2.kind === 'report_2' && em(sid).bac === 2, `${m2.kind} · ${em(sid).bac}`);
  });
  check('YT4 (4) · Hai GVCN bấm cùng lúc: panel còn bậc cũ (bacDaThay lệch) → 409 "Bậc đã đổi"; không ghi gì', () => {
    const sid = hv();
    const [a, b] = [ghiVp(gvbm, sid), ghiVp(gvbm, sid, addDays(TODAY, -1))];
    xl(gvcn, sid, [a], { bacDaThay: 0 });
    const truoc = (conn.prepare('SELECT COUNT(*) n FROM discipline_measures WHERE student_id = ?').get(sid) as any).n;
    const l = loiCua(() => xl(gvcn, sid, [b], { bacDaThay: 0 }));
    assert(l.status === 409 && /Bậc đã đổi/.test(l.msg), `${l.status} ${l.msg}`);
    assert((conn.prepare('SELECT COUNT(*) n FROM discipline_measures WHERE student_id = ?').get(sid) as any).n === truoc, 'không ghi');
  });
  check('YT4 (4) · Kiểm dữ liệu: mô tả < 10 ký tự, ngày tương lai, không chọn vi phạm, vi phạm em khác, vi phạm đã xử lý → 400', () => {
    const sid = hv(); const khac = hv();
    const v = ghiVp(gvbm, sid); const vk = ghiVp(gvbm, khac);
    for (const [ten, extra, re] of [
      ['mô tả ngắn', { note: 'ngắn' }, /ít nhất 10 ký tự/], ['ngày tương lai', { performedOn: addDays(TODAY, 1) }, /tương lai/],
      ['không vi phạm', { violationIds: [] }, /ít nhất một vi phạm/], ['em khác', { violationIds: [vk] }, /không thuộc học viên này/],
    ] as const) {
      const l = loiCua(() => xuLy.xacNhanXuLy(gvcn, sid, { ...{ violationIds: [v], performedOn: TODAY, note: 'Đã trao đổi với em và gia đình' }, ...(extra as Record<string, unknown>) }));
      assert(l.status === 400 && re.test(l.msg), `${ten}: ${l.status} ${l.msg}`);
    }
    xl(gvcn, sid, [v]);
    const l = loiCua(() => xl(gvcn, sid, [v]));
    assert(l.status === 400 && /đã được xử lý/.test(l.msg), l.msg);
  });
  check('YT4 (4) · Người thực hiện: tên ngoài giữ nguyên (NEN Q13 → V4-7); không chọn ai → người bấm; gửi lại cùng khoá → cùng lần xử lý', () => {
    const sid = hv();
    const [a, b] = [ghiVp(gvbm, sid), ghiVp(gvbm, sid, addDays(TODAY, -1))];
    const m1 = xl(gvcn, sid, [a], { performerName: 'Cô Lan (CX)', idempotencyKey: `yt4-k-${sid}` });
    const lai = xl(gvcn, sid, [a], { performerName: 'Cô Lan (CX)', idempotencyKey: `yt4-k-${sid}` });
    assert(m1.nguoi === 'Cô Lan (CX)' && lai.id === m1.id, JSON.stringify({ n: m1.nguoi, a: m1.id, b: lai.id }));
    const m2 = xl(gvcn, sid, [b]);
    assert((conn.prepare('SELECT performed_by FROM discipline_measures WHERE id = ?').get(m2.id) as any).performed_by === gvcn.userId, 'người bấm');
  });
  check('YT4 (4) · Quyền: GVBM không Xác nhận xử lý (403); GVCN cũ sau chuyển lớp 403, GVCN mới làm được (K5-34, M-08)', () => {
    const sid = hv(); const v = ghiVp(gvbm, sid);
    assert(loiCua(() => xl(gvbm, sid, [v])).status === 403, 'GVBM');
    const moi = lopMoi('MB FT YT4Q4');
    chuyen(sid, moi.id, TODAY);
    assert(loiCua(() => xl(loadPrincipal(gvcn.userId), sid, [v])).status === 403, 'GVCN cũ');
    assert(xl(moi.gvcn, sid, [v]).kind === 'report_1', 'GVCN mới');
  });
  check('YT4 (4) · Khai bậc 2 (H5) → lần kế WL 1; thang có hai bậc "khai"; khai lần hai 400', () => {
    const sid = hv();
    xuLy.khaiBac(gvcn, sid, { bac: 2, thang: '2026-08', ghiChu: 'Report 2 tháng 8 (giấy)' });
    const e = em(sid);
    assert(e.bac === 2 && e.keTiep.kind === 'wl_1' && e.khai.bac === 2 && e.khai.boi, JSON.stringify(e.khai));
    const hs = xuLy.yThucHocVien(gvcn, sid);
    assert(hs.dongThang.filter((x: any) => x.trangThai === 'khai').length === 2 && hs.dongThang[2].trangThai === 'lan-nay' && !hs.coTheKhai, 'thang');
    const l = loiCua(() => xuLy.khaiBac(gvcn, sid, { bac: 3, ghiChu: 'khai lần hai' }));
    assert(l.status === 400 && /đã khai bậc/.test(l.msg), l.msg);
  });
  check('YT4 (4) · Sửa khai: GVCN 403, QL sửa được khi chuỗi chưa có lần xử lý; sau lần xử lý đầu → 400 (sửa lẫn khai)', () => {
    const sid = hv();
    xuLy.khaiBac(gvcn, sid, { bac: 1, ghiChu: 'Report 1 tháng 8' });
    assert(loiCua(() => xuLy.suaKhaiBac(gvcn, sid, { bac: 2, ghiChu: 'GVCN tự sửa' })).status === 403, 'GVCN sửa');
    xuLy.suaKhaiBac(P.mbManager, sid, { bac: 2, ghiChu: 'QL sửa theo hồ sơ giấy' });
    assert(em(sid).bac === 2, 'QL sửa');
    xl(gvcn, sid, [ghiVp(gvbm, sid)]);
    const l = loiCua(() => xuLy.suaKhaiBac(P.mbManager, sid, { bac: 1, ghiChu: 'Sửa sau khi đã xử lý' }));
    assert(l.status === 400 && /đã có lần xử lý/.test(l.msg), l.msg);
    const sid2 = hv(); xl(gvcn, sid2, [ghiVp(gvbm, sid2)]);
    assert(/đã có lần xử lý/.test(loiCua(() => xuLy.khaiBac(gvcn, sid2, { bac: 2, ghiChu: 'Khai sau khi xử lý' })).msg), 'khai sau lần xử lý');
  });
  check('YT4 (4) · Khai bậc: bậc ngoài 1–5 hoặc ghi chú < 3 ký tự → 400', () => {
    const sid = hv();
    assert(/Report 1 … WL 2/.test(loiCua(() => xuLy.khaiBac(gvcn, sid, { bac: 6, ghiChu: 'WL 3' })).msg), 'bậc 6');
    assert(/ít nhất 3 ký tự/.test(loiCua(() => xuLy.khaiBac(gvcn, sid, { bac: 2, ghiChu: 'x' })).msg), 'ghi chú');
  });
  check('YT4 (4) · Xoá vi phạm trong lần xử lý đã xong (V4-12): lần xử lý còn, bậc KHÔNG lùi', () => {
    const sid = hv(); const v = ghiVp(gvbm, sid);
    const m = xl(gvcn, sid, [v]);
    viol.deleteViolation(gvcn, v);
    assert(em(sid).bac === 1 && xuLy.xemXuLy(gvcn, m.id).viPham.length === 0, 'bậc giữ');
  });
  check('YT4 (4) · Chuỗi thang (Q-C): lớp thường FOU → BE giữ bậc (Report 1 → kế Report 2); sang FT về Report 1', () => {
    const sid = hv();
    const cy = (conn.prepare('SELECT id FROM learning_cycles WHERE student_id = ? ORDER BY seq').get(sid) as any).id as number;
    conn.prepare(`UPDATE learning_cycles SET route = NULL, programme_code = 'FOU', status = 'completed', seq = 1 WHERE id = ?`).run(cy);
    const be = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at) VALUES (?, 2, NULL, 'BE', '2026-08-03', 'active', ?)`)
      .run(sid, new Date().toISOString()).lastInsertRowid);
    conn.prepare(`INSERT INTO discipline_measures (student_id, cycle_id, kind, status, performed_on, note, created_at, created_by) VALUES (?, ?, 'report_1', 'done', ?, 'Report 1 ở khoá FOU', ?, ?)`)
      .run(sid, cy, addDays(TODAY, -30), new Date().toISOString(), gvcn.userId);
    const e = em(sid);
    assert(e.chuoi.join() === `${cy},${be}` && e.bac === 1 && e.keTiep.kind === 'report_2' && e.nhanChuoi === 'lớp thường', JSON.stringify({ c: e.chuoi, b: e.bac }));
    conn.prepare(`UPDATE learning_cycles SET status = 'completed' WHERE id = ?`).run(be);
    conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, started_at, status, created_at) VALUES (?, 3, 'LT1', '2026-09-07', 'active', ?)`).run(sid, new Date().toISOString());
    const f = em(sid);
    assert(f.bac === 0 && f.keTiep.kind === 'report_1' && f.nhanChuoi === 'LT1', JSON.stringify({ c: f.chuoi, b: f.bac }));
  });
  check('YT4 (4) · Hết thang (đã WL 3): Xác nhận xử lý → 400 "chỉ còn Đề xuất" (Q11)', () => {
    const sid = hv();
    conn.prepare(`INSERT INTO discipline_measures (student_id, cycle_id, kind, status, performed_on, note, created_at, created_by)
      VALUES (?, (SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'), 'wl_3', 'done', ?, 'WL 3', ?, ?)`)
      .run(sid, sid, addDays(TODAY, -5), new Date().toISOString(), gvcn.userId);
    assert(em(sid).bac === 6 && em(sid).keTiep === null, 'bậc 6');
    assert(/chỉ còn Đề xuất/.test(loiCua(() => xl(gvcn, sid, [ghiVp(gvbm, sid)])).msg), 'chặn');
  });
  check('YT4 (4) · Thông báo GVCN: người khác ghi → "Vi phạm mới … trước dd/mm"; lần ghi thứ 3 → "có 3 vi phạm trong 2 tuần"; không đôi trong ngày; GVCN tự ghi không tự báo', () => {
    const sid = hv();
    ghiVp(gvbm, sid, addDays(TODAY, -2)); ghiVp(gvbm, sid, addDays(TODAY, -1));
    const moi = thongBao(gvcn.userId, `yt-moi:${sid}:%`);
    assert(moi.length === 1 && /^Vi phạm mới — YT4 HV \d+ \(BTVN\) · ghi nhận hoặc xử lý trước \d\d\/\d\d$/.test(moi[0].title) && /mo=xu-ly/.test(moi[0].duong), JSON.stringify(moi.map((x) => x.title)));
    ghiVp(gvbm, sid, TODAY);
    const bb = thongBao(gvcn.userId, `yt-bat-buoc:${sid}:%`);
    assert(bb.length === 1 && /có 3 vi phạm trong 2 tuần — cần xử lý trước \d\d\/\d\d/.test(bb[0].title), JSON.stringify(bb.map((x) => x.title)));
    ghiVp(gvbm, sid, TODAY);
    assert(thongBao(gvcn.userId, `yt-bat-buoc:${sid}:%`).length === 1, 'không đôi');
    const sid2 = hv(); ghiVp(gvcn, sid2);
    assert(thongBao(gvcn.userId, `yt-%:${sid2}:%`).length === 0, 'tự ghi không tự báo');
  });
  check('YT4 (4) · QL "để biết" khi WL 1 / Report 4 + Meeting / WL 2 (K5-16); Report 1, 2 không báo; không còn câu "không cần duyệt"', () => {
    const sid = hv();
    const r1 = xl(gvcn, sid, [ghiVp(gvbm, sid)]);
    xl(gvcn, sid, [ghiVp(gvbm, sid)]);
    const w1 = xl(gvcn, sid, [ghiVp(gvbm, sid)]);
    assert(thongBao(P.mbManager.userId, `yt-xu-ly:${r1.id}`).length === 0, 'Report 1 không báo');
    const n = thongBao(P.mbManager.userId, `yt-xu-ly:${w1.id}`);
    assert(n.length === 1 && n[0].title === `Đã xử lý WL 1 — ${xuLy.xemXuLy(gvcn, w1.id).ten} · để biết` && !/không cần duyệt/.test(n[0].body ?? ''), JSON.stringify(n));
  });
  check('YT4 (4) · Đã thực hiện chỉ cho lần xử lý QL đã duyệt; lần xử lý đã xong → 400', () => {
    const sid = hv(); const m = xl(gvcn, sid, [ghiVp(gvbm, sid)]);
    assert(/QL đã duyệt/.test(loiCua(() => xuLy.daThucHien(gvcn, m.id, { performedOn: TODAY })).msg), 'chặn');
  });
  check('YT4 (4) · GET /students/:id/y-thuc: thang một dòng 6 bậc, tick mặc định (K3-36), dòng thời gian trộn, dòng đếm cuối theo nhóm', () => {
    const sid = hv();
    const a = ghiVp(gvbm, sid, addDays(TODAY, -1)); ghiVp(gvbm, sid, TODAY, 'attendance');
    xl(gvcn, sid, [a]);
    const hs = xuLy.yThucHocVien(gvcn, sid);
    assert(hs.dongThang.length === 6 && hs.dongThang[0].trangThai === 'qua' && hs.dongThang[1].trangThai === 'lan-nay', 'thang');
    assert(hs.macDinh.tick.length === 1 && hs.dongThoiGian.some((x: any) => x.loai === 'xu-ly' && x.nhan === 'Report 1'), 'tick + dòng xử lý');
    assert(hs.demCuoi.tong === 2 && hs.demCuoi.theoNhom.length === 2 && hs.canManage && !hs.coTheKhai, JSON.stringify(hs.demCuoi));
  });

  // ------------------------------------------------------------------ Task 5 · Đề xuất QL duyệt (thẻ y_thuc) + Báo lên (bao_len_y_thuc)
  const theCho = (loai: string, doiTuongId: number) => conn.prepare(`SELECT * FROM yeu_cau_duyet WHERE loai = ? AND doi_tuong_id = ? ORDER BY id DESC`).get(loai, doiTuongId) as any;
  const deXuatGui = (who: any, sid: number, kind: string, ids: number[], extra: Record<string, unknown> = {}) => {
    const nhap = xuLy.deXuat(who, sid, { kind, violationIds: ids, note: 'Em vi phạm nhiều lần, cần QL quyết', ...extra });
    attachments.addLink(who, { ownerType: 'discipline_measure', ownerId: nhap.id, url: 'https://example.com/bang-chung', displayName: 'Biên bản' });
    return xuLy.guiDeXuat(who, nhap.id);
  };
  const attachments: any = await import('../platform/attachments.ts');

  check('YT4 (5) · Đề xuất: WL 3 khi chưa là bậc kế → 400; loại lạ → 400; "Khác" thiếu tên → 400', () => {
    const sid = hv(); const v = ghiVp(gvbm, sid);
    assert(/chỉ đề xuất được khi là bậc kế tiếp/.test(loiCua(() => xuLy.deXuat(gvcn, sid, { kind: 'wl_3', violationIds: [v], note: 'Đề xuất WL 3 sớm' })).msg), 'WL 3');
    assert(/Chọn loại cần QL duyệt/.test(loiCua(() => xuLy.deXuat(gvcn, sid, { kind: 'report_2', violationIds: [v], note: 'Loại trong thang' })).msg), 'loại lạ');
    assert(/Khác/.test(loiCua(() => xuLy.deXuat(gvcn, sid, { kind: 'other', customName: 'x', violationIds: [v], note: 'Loại khác thiếu tên' })).msg), 'Khác');
  });
  check('YT4 (5) · Gửi thiếu bằng chứng → 400; nháp chưa gửi không đổi trạng thái vi phạm; xoá được nháp, không xoá được đề xuất đã gửi', () => {
    const sid = hv(); const v = ghiVp(gvbm, sid);
    const nhap = xuLy.deXuat(gvcn, sid, { kind: 'suspension', violationIds: [v], note: 'Đình chỉ vì vi phạm nặng' });
    assert(/đính kèm tệp hoặc liên kết/.test(loiCua(() => xuLy.guiDeXuat(gvcn, nhap.id)).msg), 'thiếu bằng chứng');
    assert(em(sid).viPham.get(v).t === 'moi' && em(sid).deXuat === null, 'nháp không vào trạng thái');
    xuLy.xoaNhap(gvcn, nhap.id);
    assert(!conn.prepare('SELECT 1 FROM discipline_measures WHERE id = ?').get(nhap.id), 'đã xoá nháp');
    const gui = deXuatGui(gvcn, sid, 'suspension', [v]);
    assert(/chưa gửi/.test(loiCua(() => xuLy.xoaNhap(gvcn, gui.id)).msg), 'không xoá đề xuất đã gửi');
  });
  check('YT4 (5) · Gửi → thẻ y_thuc chờ, hạn hôm nay + 4, bằng chứng có id tệp; vi phạm "Chờ QL duyệt", nhóm em Chờ QL duyệt', () => {
    const sid = hv(); const ids = ba3(sid);
    const m = deXuatGui(gvcn, sid, 'meeting_cx', ids);
    const the = theCho('y_thuc', m.id);
    const tep = (conn.prepare(`SELECT id FROM attachments WHERE owner_type = 'discipline_measure' AND owner_id = ?`).all(m.id) as any[]).map((r) => r.id);
    assert(the.trang_thai === 'cho' && the.han_duyet === addDays(TODAY, 4) && JSON.parse(the.bang_chung).join() === tep.join() && the.nguoi_xin === gvcn.userId, JSON.stringify(the));
    assert(ids.every((x) => em(sid).viPham.get(x).nhan === 'Chờ QL duyệt') && em(sid).nhom === 'cho_duyet', 'nhãn + nhóm');
  });
  check('YT4 (5) · (bấm thử) thẻ Ý thức nói có bao nhiêu bằng chứng — QL biết mà bấm Mở xem trước khi duyệt (V4-10)', () => {
    const sid = hv(); deXuatGui(gvcn, sid, 'suspension', [ghiVp(gvbm, sid)]);
    const the = yc.hopChoDuyet(P.mbManager, { studentId: sid }).the.find((x: any) => x.loai === 'y_thuc');
    assert(the.dong.includes('Kèm 1 bằng chứng (tệp / liên kết) — bấm Mở để xem') && /tab=y-thuc/.test(the.mo ?? ''), JSON.stringify(the.dong));
  });
  check('YT4 (5) · GVCN không duyệt được (403) — thẻ chỉ QL / Quản trị (T69, K5-32)', () => {
    const sid = hv(); const m = deXuatGui(gvcn, sid, 'suspension', [ghiVp(gvbm, sid)]);
    assert(loiCua(() => yc.duyetYeuCau(gvcn, theCho('y_thuc', m.id).id)).status === 403, 'GVCN duyệt');
  });
  check('YT4 (5) · QL duyệt Đình chỉ → Đã duyệt · chờ thực hiện; thẻ nói "Bậc thang kế tiếp đang là Report 1"; Đã thực hiện → "Đã xử lý · Đình chỉ học tạm thời", bậc GIỮ (M-11)', () => {
    const sid = hv(); const v = ghiVp(gvbm, sid);
    const m = deXuatGui(gvcn, sid, 'suspension', [v]);
    const the = yc.hopChoDuyet(P.mbManager, { studentId: sid }).the.find((x: any) => x.loai === 'y_thuc');
    assert(the.tieuDe === 'Đề xuất Đình chỉ học tạm thời' && the.dong.some((d: string) => d === 'Bậc thang kế tiếp đang là Report 1 — duyệt đề xuất này không đổi bậc'), JSON.stringify(the.dong));
    yc.duyetYeuCau(P.mbManager, the.id);
    const r = conn.prepare('SELECT status, quyet_luc FROM discipline_measures WHERE id = ?').get(m.id) as any;
    assert(r.status === 'da_duyet' && r.quyet_luc === TODAY && em(sid).viPham.get(v).nhan === 'Đã duyệt · chờ thực hiện', JSON.stringify(r));
    xuLy.daThucHien(gvcn, m.id, { performedOn: TODAY, performerName: 'Phòng CX' });
    assert(em(sid).viPham.get(v).nhan === 'Đã xử lý · Đình chỉ học tạm thời' && em(sid).bac === 0, 'bậc giữ');
  });
  check('YT4 (5) · QL từ chối → vi phạm về Cần xử lý từ ngày quyết, bậc giữ; lý do ở thẻ; người đề xuất nhận thông báo', () => {
    const sid = hv(); const v = ghiVp(gvbm, sid);
    const m = deXuatGui(gvcn, sid, 'suspension', [v]);
    const theId = theCho('y_thuc', m.id).id;
    yc.tuChoiYeuCau(P.mbManager, theId, 'Chưa đủ căn cứ để đình chỉ');
    const e = em(sid);
    assert(e.viPham.get(v).t === 'can_xu_ly' && e.han === addDays(TODAY, 4) && e.bac === 0, JSON.stringify(e.viPham.get(v)));
    assert(theCho('y_thuc', m.id).ly_do_tu_choi === 'Chưa đủ căn cứ để đình chỉ' && thongBao(gvcn.userId, `duyet_ket_qua:${theId}`).length === 1, 'thẻ + thông báo');
  });
  check('YT4 (5) · WL 3 (bậc kế) duyệt + Đã thực hiện → bậc 6, hết thang', () => {
    const sid = hv();
    xuLy.khaiBac(gvcn, sid, { bac: 5, ghiChu: 'WL 2 tháng 8 (giấy)' });
    const m = deXuatGui(gvcn, sid, 'wl_3', [ghiVp(gvbm, sid)]);
    yc.duyetYeuCau(P.mbManager, theCho('y_thuc', m.id).id);
    xuLy.daThucHien(gvcn, m.id, { performedOn: TODAY });
    assert(em(sid).bac === 6 && em(sid).keTiep === null, `bậc ${em(sid).bac}`);
  });
  check('YT4 (5) · QL tự gửi đề xuất → tự duyệt được, thẻ ghi "tự duyệt" (Q-D)', () => {
    const sid = hv();
    const m = deXuatGui(P.mbManager, sid, 'other', [ghiVp(gvbm, sid)], { customName: 'Gặp phụ huynh tại trung tâm' });
    const kq = yc.duyetYeuCau(P.mbManager, theCho('y_thuc', m.id).id);
    assert(kq.tuDuyet === true && theCho('y_thuc', m.id).tu_duyet === 1 && xuLy.xemXuLy(P.mbManager, m.id).nhan === 'Gặp phụ huynh tại trung tâm', JSON.stringify(kq));
  });
  check('YT4 (5) · Báo lên: em Quá hạn → MỘT thẻ bao_len_y_thuc (không nút duyệt, GVCN là chủ việc); quét lần hai không thêm', () => {
    const sid = hv(); ba3(sid, addDays(TODAY, -12));
    yc.quetYeuCau(TODAY);
    yc.quetYeuCau(TODAY);
    const ds = conn.prepare(`SELECT * FROM yeu_cau_duyet WHERE loai = 'bao_len_y_thuc' AND doi_tuong_id = ?`).all(sid) as any[];
    assert(ds.length === 1 && ds[0].trang_thai === 'cho' && ds[0].han_duyet === null && JSON.parse(ds[0].du_lieu).viecKey === `yt_xu_ly:${sid}`
      && JSON.parse(ds[0].du_lieu).ownerId === gvcn.userId, JSON.stringify(ds));
    const the = yc.hopChoDuyet(P.mbManager, { studentId: sid }).the.find((x: any) => x.loai === 'bao_len_y_thuc');
    assert(the.tieuDe === 'Ý thức quá hạn · 3 vi phạm chưa xử lý' && the.kieuNut === 'nhac' && the.dong[0] === 'Không cần duyệt — để QL biết và nhắc.', JSON.stringify(the));
  });
  check('YT4 (5) · Báo lên tự đóng khi hết lý do (xử lý xong) — "Việc gốc đã xong"; em Tạm dừng không Báo lên (T65)', () => {
    const sid = hv(); const ids = ba3(sid, addDays(TODAY, -12));
    yc.quetYeuCau(TODAY);
    xl(gvcn, sid, ids);
    yc.quetYeuCau(TODAY);
    const the = theCho('bao_len_y_thuc', sid);
    assert(the.trang_thai === 'tu_dong' && the.ly_do_dong === 'Việc gốc đã xong', JSON.stringify(the));
    const sid2 = hv(); ba3(sid2, addDays(TODAY, -12));
    conn.prepare(`UPDATE students SET status = 'inactive' WHERE id = ?`).run(sid2);
    yc.quetYeuCau(TODAY);
    assert(!theCho('bao_len_y_thuc', sid2), 'Tạm dừng không Báo lên');
  });
  check('YT4 (5) · Báo lên cả "Mới quá 5 ngày chưa ai xem" (V4-5) và "đã duyệt chưa thực hiện quá 5 ngày" (K3-37)', () => {
    const sid = hv(); vpDb(sid, addDays(TODAY, -8));
    const sid2 = hv(); const v2 = ghiVp(gvbm, sid2);
    const m = deXuatGui(gvcn, sid2, 'suspension', [v2]);
    yc.duyetYeuCau(P.mbManager, theCho('y_thuc', m.id).id);
    conn.prepare(`UPDATE discipline_measures SET quyet_luc = ? WHERE id = ?`).run(addDays(TODAY, -6), m.id);
    yc.quetYeuCau(TODAY);
    assert(JSON.parse(theCho('bao_len_y_thuc', sid).du_lieu).viecKey === `yt_xem:${sid}`, 'Mới quá hạn');
    const t2 = theCho('bao_len_y_thuc', sid2);
    assert(t2 && JSON.parse(t2.du_lieu).viecKey === `yt_thuc_hien:${m.id}` && /đã duyệt chưa thực hiện|QL đã duyệt, quá 5 ngày/.test(t2.ly_do), JSON.stringify(t2));
  });
  check('YT4 (5) · Thẻ Ý thức tự đóng khi đề xuất không còn chờ (em lưu trữ) — "Không còn chờ duyệt"', () => {
    const sid = hv(); const m = deXuatGui(gvcn, sid, 'suspension', [ghiVp(gvbm, sid)]);
    conn.prepare(`UPDATE students SET archived_at = ? WHERE id = ?`).run(TODAY, sid);
    yc.quetYeuCau(TODAY);
    const the = theCho('y_thuc', m.id);
    conn.prepare(`UPDATE students SET archived_at = NULL WHERE id = ?`).run(sid);
    assert(the.trang_thai === 'tu_dong' && the.ly_do_dong === 'Không còn chờ duyệt', JSON.stringify(the));
  });

  // ------------------------------------------------------------------ Task 6 · việc Ý thức thật có hạn + Tổng quan + chuyển lớp
  const myworkSvc: any = await import('../worklist/mywork.ts');
  const nhacSvc: any = await import('../worklist/nhacViec.ts');
  const ltSvc: any = await import('../classes/luatLoTrinh.ts');
  const viec = (who: any, key: string, o: Record<string, unknown> = {}) => (myworkSvc.myWork(who, o).items as any[]).find((x) => x.key === key);

  check('YT4 (6) · GVCN có việc "Xử lý vi phạm · {HV} (3) · bậc kế tiếp: Report 1", hạn = ngày ghi thứ 3 + 4, mở tab lớp chọn sẵn em + panel', () => {
    const sid = hv(); ba3(sid);
    const it = viec(gvcn, `yt_xu_ly:${sid}`);
    assert(it && it.group === 'yt_xu_ly' && it.due === addDays(TODAY, 3) && it.urgency === 'normal' && it.mine, JSON.stringify(it));
    assert(/^Xử lý vi phạm · YT4 HV \d+ \(3\) · bậc kế tiếp: Report 1$/.test(it.tieuDe) && it.href === `/hoc-vien/lop/${LOP}?tab=y-thuc&hv=${sid}&mo=xu-ly`, `${it.tieuDe} · ${it.href}`);
    assert(d.nhomViecCua('yt_xu_ly') === 'y-thuc' && d.LOAI_HAN_CUA_VIEC.yt_xu_ly === 'xu-ly-vi-pham', 'nhóm + loại hạn');
  });
  check('YT4 (6) · Quá hạn → urgency overdue; nhóm "Ý thức & Phối hợp" TỰ MỞ (bỏ luật W02)', () => {
    const sid = hv(); ba3(sid, addDays(TODAY, -12));
    const it = viec(gvcn, `yt_xu_ly:${sid}`);
    assert(it?.urgency === 'overdue' && it.statusLabel === 'Quá hạn', JSON.stringify(it));
    const g = d.gomNhomViec([it]).find((x: any) => x.key === 'y-thuc');
    assert(g?.moSan === true && g.quaHan === 1, JSON.stringify(g));
  });
  check('YT4 (6) · GVBM không có việc Ý thức; em Tạm dừng không sinh việc (T65)', () => {
    const sid = hv(); ba3(sid);
    assert(!viec(gvbm, `yt_xu_ly:${sid}`), 'GVBM');
    conn.prepare(`UPDATE students SET status = 'inactive' WHERE id = ?`).run(sid);
    assert(!viec(gvcn, `yt_xu_ly:${sid}`), 'Tạm dừng');
    conn.prepare(`UPDATE students SET status = 'active' WHERE id = ?`).run(sid);
  });
  check('YT4 (6) · Xác nhận xử lý xong → dòng biến mất; gửi đề xuất → "Xử lý vi phạm" hết, ra khỏi Công việc', () => {
    const sid = hv(); const ids = ba3(sid);
    xl(gvcn, sid, ids);
    assert(!viec(gvcn, `yt_xu_ly:${sid}`), 'xử lý xong');
    const s2 = hv(); const ids2 = ba3(s2);
    deXuatGui(gvcn, s2, 'suspension', ids2);
    assert(!viec(gvcn, `yt_xu_ly:${s2}`), 'đã gửi đề xuất');
  });
  check('YT4 (6) · "Ghi nhận n vi phạm mới" có hạn ngày ghi + 4; Ghi nhận xong dòng biến mất', () => {
    const sid = hv(); const v = ghiVp(gvbm, sid);
    const it = viec(gvcn, `yt_xem:${sid}`);
    assert(it && it.due === addDays(TODAY, 4) && /^Ghi nhận 1 vi phạm mới · /.test(it.tieuDe) && it.actionLabel === 'Ghi nhận', JSON.stringify(it));
    xuLy.ghiNhan(gvcn, sid, [v]);
    assert(!viec(gvcn, `yt_xem:${sid}`), 'ghi nhận xong');
  });
  check('YT4 (6) · QL duyệt → việc "Ghi \\"Đã thực hiện\\" …" hạn ngày duyệt + 4; Đã thực hiện xong → hết', () => {
    const sid = hv(); const m = deXuatGui(gvcn, sid, 'suspension', [ghiVp(gvbm, sid)]);
    yc.duyetYeuCau(P.mbManager, theCho('y_thuc', m.id).id);
    const it = viec(gvcn, `yt_thuc_hien:${m.id}`);   // PR-S3F #7: khoá theo lần xử lý
    assert(it && it.due === addDays(TODAY, 4) && it.tieuDe.startsWith('Ghi "Đã thực hiện" Đình chỉ học tạm thời · '), JSON.stringify(it));
    xuLy.daThucHien(gvcn, m.id, { performedOn: TODAY });
    assert(!viec(gvcn, `yt_thuc_hien:${m.id}`), 'xong');
  });
  check('YT4 (6) · QL "Của GV (nhắc)" (nguoi=tat-ca) thấy dòng của GVCN, có nút Nhắc; "Của tôi" của QL thì không', () => {
    const sid = hv(); ba3(sid, addDays(TODAY, -12));
    const it = viec(P.mbManager, `yt_xu_ly:${sid}`, { nguoi: 'tat-ca' });
    assert(it && !it.mine && it.ownerId === gvcn.userId && it.nhac?.ownerId === gvcn.userId, JSON.stringify(it));
    assert(!viec(P.mbManager, `yt_xu_ly:${sid}`), 'Của tôi');
  });
  check('YT4 (6) · Nhắc từ thẻ Báo lên Ý thức (viecKey) → đúng GVCN; bấm chuông mở tab lớp chọn sẵn em', () => {
    const sid = hv(); ba3(sid, addDays(TODAY, -12));
    yc.quetYeuCau(TODAY);
    const du = JSON.parse(theCho('bao_len_y_thuc', sid).du_lieu);
    const kq = nhacSvc.nhacViec(P.mbManager, { key: du.viecKey, ownerId: du.ownerId });
    const tb = thongBao(gvcn.userId, `nhac:${du.viecKey}:%`);
    assert(kq.daNhacLuc && tb.length === 1 && tb[0].duong === `/hoc-vien/lop/${LOP}?tab=y-thuc&hv=${sid}&mo=xu-ly`, JSON.stringify(tb));
  });
  check('YT4 (6) · Chuyển lớp: thông báo cho GVCN lớp mới kèm "· đang có n vi phạm cần xử lý" (K5-18)', () => {
    const sid = hv(); ba3(sid);
    const moi = lopMoi('MB FT YT4TB');
    ltSvc.thongBaoChuyenVao({ sid, tenHocVien: 'HV thử', enrollmentMoiId: 900000 + sid, actorUserId: P.admin.userId, tuMa: 'MB FT 101', tuChiNhanh: 'Monbay',
      doiChiNhanh: false, lyDo: null, denLop: { id: moi.id, code: 'MB FT YT4TB', branchId: mbId } });
    const tb = thongBao(moi.gvcn.userId, `transfer:${900000 + sid}`);
    assert(tb.length === 1 && /· đang có 3 vi phạm cần xử lý$/.test(tb[0].body), JSON.stringify(tb));
  });
  check('YT4 (6) · Hai loại hạn Ý thức cũ đã bỏ; "Xử lý vi phạm · hạn dd/mm"; dòng nhắc chỉ còn Phối hợp SOS', () => {
    assert(!(d.DEADLINE_KINDS as readonly string[]).some((k) => k === 'thuc-hien-y-thuc' || k === 'hoan-thanh-y-thuc'), 'loại cũ');
    assert(d.deadlineView({ kind: 'xu-ly-vi-pham', due: '2026-09-18', today: TODAY }).text === 'Xử lý vi phạm · hạn 18/09', 'nhãn hạn');
    const src = fs.readFileSync(path.join(REPO3, 'web/src/modules/yThuc/YThucReminders.tsx'), 'utf8');
    assert(!/my-warnings/.test(src), 'còn gọi /y-thuc/my-warnings');
  });

  // ------------------------------------------------------------------ Task 7 · chỉ số và Phân tích Ý thức theo trạng thái v4
  const tk: any = await import('../yThuc/thongKe.ts');
  const ptYt: any = await import('../phanTich/yThucPhanTich.ts');
  const ms7 = (id: string, f: Record<string, unknown> = {}) => tk.yThucMetric(P.mbManager, id, { branchId: mbId, ...f });

  check('YT4 (7) · vi-pham-chua-xu-ly = Mới + Cần xử lý + Quá hạn; Đã ghi nhận, Chờ QL duyệt, Đã xử lý KHÔNG tính (K1-26)', () => {
    const lop = lopMoi('MB FT YT4M1');
    const a = hv(lop.id); const moi = vpDb(a, TODAY); const ghi = vpDb(a, addDays(TODAY, -20), { ghiNhan: addDays(TODAY, -19) });
    const b = hv(lop.id); const bb = ba3(b);
    const c = hv(lop.id); const cc = vpDb(c, TODAY); deXuatGui(lop.gvcn, c, 'suspension', [cc]);
    const ids = ms7('vi-pham-chua-xu-ly', { classId: lop.id }).ids as number[];
    assert(ids.includes(moi) && bb.every((x) => ids.includes(x)) && !ids.includes(ghi) && !ids.includes(cc) && ids.length === 4, JSON.stringify(ids));
  });
  check('YT4 (7) · bien-phap-da-thuc-hien: lần xử lý xong (theo ngày thực hiện) — MỘT lần dù gom 3 vi phạm; đề xuất chờ/đã duyệt chưa tính, Đã thực hiện thì tính', () => {
    const sid = hv(); const m = xl(gvcn, sid, ba3(sid));
    const s2 = hv(); const d2 = deXuatGui(gvcn, s2, 'suspension', [ghiVp(gvbm, s2)]);
    const da = () => ms7('bien-phap-da-thuc-hien', { from: TODAY, to: TODAY }).ids as number[];
    assert(da().filter((x) => x === m.id).length === 1 && !da().includes(d2.id), 'một lần; đề xuất chưa tính');
    yc.duyetYeuCau(P.mbManager, theCho('y_thuc', d2.id).id);
    assert(!da().includes(d2.id), 'đã duyệt chưa thực hiện');
    xuLy.daThucHien(gvcn, d2.id, { performedOn: TODAY });
    assert(da().includes(d2.id), 'Đã thực hiện thì tính');
  });
  check('YT4 (7) · bien-phap-theo-loai: chín loại v4 (+ loai-cu cho dòng cũ, Q2) tách riêng; lọc kind; tổng = bien-phap-da-thuc-hien', () => {
    const sid = hv(); xl(gvcn, sid, [ghiVp(gvbm, sid)]); const r2 = xl(gvcn, sid, [ghiVp(gvbm, sid)]);
    const r = ms7('bien-phap-theo-loai');
    assert(Object.keys(r.byKind).join() === [...d.MEASURE_KINDS, 'loai-cu'].join(), Object.keys(r.byKind).join());
    assert(r.byKind.report_2.includes(r2.id) && !r.byKind.report_1.includes(r2.id), 'Report 2 riêng');
    assert(ms7('bien-phap-theo-loai', { kind: 'report_2' }).ids.join() === r.byKind.report_2.join(), 'lọc kind');
    assert(r.ids.length === ms7('bien-phap-da-thuc-hien').ids.length, 'tổng các loại = tổng chỉ số');
  });
  check('YT4 (7) · bien-phap-cho-duyet (thay "đang chuẩn bị"): đề xuất gửi → vào tập; QL duyệt → ra', () => {
    const sid = hv(); const m = deXuatGui(gvcn, sid, 'meeting_cx', [ghiVp(gvbm, sid)]);
    assert(ms7('bien-phap-cho-duyet').byKind.meeting_cx.includes(m.id), 'vào');
    yc.duyetYeuCau(P.mbManager, theCho('y_thuc', m.id).id);
    assert(!ms7('bien-phap-cho-duyet').ids.includes(m.id), 'ra');
    assert(d.metricById('bien-phap-dang-chuan-bi') === null && d.metricById('bien-phap-cho-duyet'), 'sổ chỉ số');
  });
  check('YT4 (7) · hv-theo-bac: em đang học chia bậc 0–6 theo cửa trạng thái; khai bậc 2 → khoá "2"', () => {
    const sid = hv(); xuLy.khaiBac(gvcn, sid, { bac: 2, ghiChu: 'Report 2 (giấy)' });
    const s0 = hv();
    const r = ms7('hv-theo-bac');
    assert(Object.keys(r.byKind).join() === '0,1,2,3,4,5,6' && r.byKind['2'].includes(sid) && r.byKind['0'].includes(s0), JSON.stringify(Object.keys(r.byKind)));
    assert(ms7('hv-theo-bac', { kind: '2' }).ids.includes(sid) && /không hợp lệ/.test(loiCua(() => ms7('hv-theo-bac', { kind: '9' })).msg), 'lọc kind');
  });
  check('YT4 (7) · Ý thức nằm NGOÀI bảng hiệu quả hỗ trợ: xử lý / đề xuất không đổi pa-co-ket-qua, ty-le-co-cai-thien', () => {
    const hq = () => ['pa-co-ket-qua', 'ty-le-co-cai-thien'].map((id) => metricsSvc.metricSet(P.mbManager, id, { branchId: mbId }).ids.length).join();
    const truoc = hq();
    const sid = hv(); xl(gvcn, sid, ba3(sid));
    assert(hq() === truoc, `${truoc} → ${hq()}`);
  });
  check('YT4 (7) · Phân tích lọc đúng một lớp = tab Ý thức của lớp: "chưa xử lý" cùng tập, "HV cần chú ý" = em Quá hạn · Bắt buộc · Chờ QL', () => {
    const lop = lopMoi('MB FT YT4PT');
    const a = hv(lop.id); vpDb(a, addDays(TODAY, -8));
    const b = hv(lop.id); ba3(b);
    const c = hv(lop.id); deXuatGui(lop.gvcn, c, 'suspension', [vpDb(c, TODAY)]);
    const e = hv(lop.id); vpDb(e, TODAY, { ghiNhan: TODAY });
    const kq = ptYt.yThucPhanTich(P.mbManager, { branchId: mbId, ct: null, classId: lop.id, from: addDays(TODAY, -30), to: TODAY });
    const bd = board.bangYThucLop(lop.gvcn, lop.id);
    const tabCanChuY = [...bd.nhom.qua_han, ...bd.nhom.bat_buoc, ...bd.nhom.cho_duyet].map((x: any) => x.studentId).sort().join();
    assert(kq.hvCanChuY.map((x: any) => x.studentId).sort().join() === tabCanChuY, `${kq.hvCanChuY.map((x: any) => x.studentId)} ≠ ${tabCanChuY}`);
    const tabChua = bd.dongThoiGian.filter((x: any) => x.loai === 'vi-pham' && ['moi', 'can_xu_ly', 'qua_han'].includes(x.trangThai)).length;
    assert(kq.lop[0]?.chuaXuLy === tabChua && tabChua === 4, `${kq.lop[0]?.chuaXuLy} ≠ ${tabChua}`);
  });
  check('YT4 (7) · Góc nhìn Phân tích tên "Ý thức"; không còn "bước tiếp theo · Sắp Thư CC" (BUOC_TIEP, buocTiepTheo, laHvCanChuY)', () => {
    assert(d.GOC_NHIN_LABEL['y-thuc'] === 'Ý thức', d.GOC_NHIN_LABEL['y-thuc']);
    assert(!('BUOC_TIEP' in d) && !('buocTiepTheo' in d) && !('laHvCanChuY' in d), 'còn luật v3');
  });

  // ------------------------------------------------------------------ Task 8–10 · web: thang, nhãn, panel, tab lớp M6, tab HV (soi mã nguồn)
  const docW = (f: string) => fs.readFileSync(path.join(REPO3, f), 'utf8');
  const boChuThich = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:\\])\/\/.*$/gm, '$1');
  const YT = 'web/src/modules/yThuc';
  const tepYt = fs.readdirSync(path.join(REPO3, YT)).filter((f) => /\.tsx?$/.test(f));

  check('YT4 (8) · Không còn chữ v3 trong web/src/modules/yThuc (trừ Phối hợp SOS / Case SOS): Phương án · PA · Đang chuẩn bị · Thư cảnh cáo · Ghi nhận vi phạm', () => {
    const sai = tepYt.filter((f) => !/PhoiHopSosSection|CaseSosControls/.test(f))
      .filter((f) => /Phương án|\bPA\b|Đang chuẩn bị|Thư cảnh cáo|Ghi nhận vi phạm/.test(boChuThich(docW(`${YT}/${f}`))));
    assert(!sai.length, sai.join(', '));
    assert(!/Ghi nhận vi phạm|Thư cảnh cáo|Đang chuẩn bị/.test(boChuThich(docW('shared/domain/hocVienLop.ts'))), 'hocVienLop.ts');
  });
  check('YT4 (8) · Panel v3 đã xoá, không còn import: CreateMeasurePanel · PhuongAnPanel · ConfirmMeasurePanel · XemPhuongAnPanel', () => {
    for (const f of ['CreateMeasurePanel', 'PhuongAnPanel', 'ConfirmMeasurePanel', 'XemPhuongAnPanel']) {
      assert(!tepYt.includes(`${f}.tsx`), `${f}.tsx còn`);
      assert(!tepYt.some((x) => docW(`${YT}/${x}`).includes(`./${f}.tsx`)), `còn import ${f}`);
    }
  });
  check('YT4 (8) · Thang MỘT dòng: flex-nowrap, không flex-wrap; bậc đã qua thu thành dấu tích dưới sm; dấu tích là SVG (không ký tự ✓)', () => {
    const s = docW(`${YT}/ThangYThuc.tsx`);
    assert(/flex-nowrap/.test(s) && /whitespace-nowrap/.test(s) && !/flex-wrap(?!\s*:)/.test(s.replace(/flex-nowrap/g, '')), 'một dòng');
    assert(/hidden sm:inline/.test(s) && /<DauTich/.test(s) && !/✓/.test(boChuThich(s)), 'thu gọn + SVG');
    assert(/<svg/.test(docW(`${YT}/NhanViPham.tsx`)) && /strokeWidth="1.5"/.test(docW(`${YT}/NhanViPham.tsx`)), 'SVG nét 1.5');
  });
  check('YT4 (8) · NhanViPham đủ sáu trạng thái §5.4; "Đã ghi nhận" chữ xám, không nền, kèm "vẫn tính"', () => {
    const s = docW(`${YT}/NhanViPham.tsx`);
    for (const t of d.TRANG_THAI_VP) assert(new RegExp(`\\b${t}:`).test(s), `thiếu ${t}`);
    const dong = /da_ghi_nhan: '([^']*)'/.exec(s)?.[1] ?? '';
    assert(!/bg-/.test(dong) && /text-slate-400/.test(dong) && /Đã ghi nhận · vẫn tính/.test(s), dong);
  });
  check('YT4 (8) · Xác nhận xử lý: client KHÔNG gửi loại (bậc máy chủ quyết), gửi bacDaThay; 409 → mở lại "Bậc vừa đổi"', () => {
    const s = docW(`${YT}/XacNhanXuLyPanel.tsx`);
    const payload = /y-thuc\/xu-ly`, \{([\s\S]*?)\}\);/.exec(s)?.[1] ?? '';
    assert(payload && !/\bkind\b/.test(payload) && /bacDaThay/.test(payload), payload);
    assert(/status === 409/.test(s) && /Bậc vừa đổi — đã mở lại với bậc mới/.test(s), '409');
  });
  check('YT4 (8) · Đề xuất QL duyệt: nháp → bằng chứng bắt buộc → "Gửi QL duyệt · trả lời trong 5 ngày"; đóng giữa chừng xoá nháp', () => {
    const s = docW(`${YT}/XacNhanXuLyPanel.tsx`);
    assert(/y-thuc\/de-xuat/.test(s) && /\/gui`/.test(s) && /Gửi QL duyệt · trả lời trong 5 ngày/.test(s), 'luồng');
    assert(/api\.del\(`\/y-thuc\/xu-ly\/\$\{daLuu\.id\}`\)/.test(s) && /Cần đính kèm tệp hoặc liên kết/.test(s), 'xoá nháp + bằng chứng');
    assert(/Cần xử lý nặng hơn/.test(s) && /Khai bậc trước/.test(s), 'liên kết Đề xuất + dòng Khai bậc (Q7)');
  });
  check('YT4 (8) · Khai bậc: năm bậc (Report 1 … WL 2), tháng tuỳ chọn, ghi chú ≥ 3; QL sửa bằng PUT', () => {
    const s = docW(`${YT}/KhaiBacPanel.tsx`);
    assert(/THANG\.slice\(0, 5\)/.test(s) && /GHI_CHU_MIN = 3/.test(s) && /api\.put\(/.test(s) && /kieu="thang"/.test(s), 'khai bậc');
  });
  check('YT4 (8) · + Ghi vi phạm (T31): tiêu đề "Ghi vi phạm", KHÔNG chọn sẵn nhóm (K3-35), nhóm bắt buộc chọn', () => {
    const s = docW(`${YT}/RecordViolationPanel.tsx`);
    assert(/'Ghi vi phạm'/.test(s) && /useState<string>\(''\)/.test(s) && /khoa: 'nhom', nhan: 'Nhóm', chon: true/.test(s), 'panel ghi');
    assert(!/Ghi nhận vi phạm/.test(boChuThich(s)), 'chữ cũ');
  });
  check('YT4 (8) · DongThoiGian D5: dưới sm ngày + cột 2 một dòng, nội dung và cột cuối chiếm cả dòng dưới', () => {
    const s = docW('web/src/ui/DongThoiGian.tsx');
    assert(/khong: 'grid-cols-\[3\.25rem_minmax\(0,1fr\)\] md:/.test(s) && /col-span-2 md:col-span-1/.test(s), 'lưới D5');
  });
  check('YT4 (9) · Tab lớp M6: hai khung + tab "Xử lý · Vi phạm" dưới md; không còn bốn chip, hai chế độ, ô tick, khoảng ngày', () => {
    const s = docW(`${YT}/ClassYThucCard.tsx`);
    assert(/md:grid-cols-\[minmax\(0,22rem\)_minmax\(0,1fr\)\]/.test(s) && /label: 'Xử lý'/.test(s) && /label: 'Vi phạm'/.test(s), 'hai khung');
    assert(!/BO_LOC_PHU|hopBoLocPhu|tuNgayTheoKhoang|byTime|type="checkbox"|Theo thời gian/.test(s), 'bộ lọc v3');
    assert(/NHOM_EM\.filter/.test(s) && /params\.get\('mo'\)/.test(s) && /'Phối hợp'/.test(s), 'nhóm em, ?mo, tab Phối hợp');
  });
  check('YT4 (9) · GVBM (canManage = false) không thấy Ghi nhận / Xác nhận xử lý / Khai bậc trên tab lớp; vẫn có + Ghi vi phạm (canRecord)', () => {
    const s = docW(`${YT}/ClassYThucCard.tsx`);
    assert(/const coGhiNhan = hv\.canManage &&/.test(s) && /const nut = !hv\.canManage \? null/.test(s) && /onKhai=\{hv\.canManage \?/.test(s), 'ẩn theo quyền');
    assert(/d\.canRecord \? <button[\s\S]{0,200}?\+ Ghi vi phạm/.test(s), '+ Ghi vi phạm');
  });
  check('YT4 (9) · Phối hợp (K3-38): "Meeting CX/GĐCN (sau Mock)" + chữ phụ "không phải xử lý vi phạm, không cần QL duyệt"', () => {
    const s = docW(`${YT}/PhoiHopSosSection.tsx`);
    assert(/Meeting CX\/GĐCN \(sau Mock\)/.test(s) && /không phải xử lý vi phạm, không cần QL duyệt/.test(s), 'nhãn');
  });
  check('YT4 (10) · Tab HV (K3 §4f): thanh việc, thang, bộ lọc MỘT hàng, dòng thời gian trộn không ô tick, "Xem cả lịch sử", dòng đếm cuối', () => {
    const s = docW(`${YT}/StudentYThucSection.tsx`);
    assert(/function ThanhViec/.test(s) && /<ThangYThuc/.test(s) && /Xem cả lịch sử/.test(s) && /demCuoi/.test(s), 'bố cục');
    assert(/<BoLocDoan/.test(s) && /'Chờ duyệt'/.test(s) && /Cần xử lý/.test(s) && /'Đã xử lý'/.test(s) && !/type="checkbox"|coCotChon/.test(s), 'bộ lọc một hàng + không tick');
    assert(/vach: true/.test(s) && !/violation-warning/.test(docW('web/src/modules/students/StudentDetailPage.tsx')), 'dòng xử lý vạch trái; hồ sơ không gọi violation-warning');
  });
  check('YT4 (10) · Luật v3 đã gỡ khỏi miền chung: không còn chín loại/chuỗi thư/cảnh báo mềm/bốn chip/patch PA', () => {
    for (const k of ['VIOLATION_STATES', 'violationWarning', 'violationAgeLabel', 'MEASURE_KINDS_V3', 'WARNING_CHAIN', 'measureMissing', 'CANH_BAO_NGAY',
      'chiaThemViPham', 'thanPatchPhuongAn', 'BO_LOC_PHU', 'hopBoLocPhu', 'tuNgayTheoKhoang', 'trongChuKyHienTai', 'dongViPhamLop']) {
      assert(!(k in d), `còn ${k}`);
    }
    assert(!fs.existsSync(path.join(REPO3, 'shared/domain/viPhamLop.ts')), 'viPhamLop.ts còn');
  });
  check('YT4 (10) · Nhãn lịch sử vi phạm nói "lần xử lý"; cảnh báo trùng theo trạng thái v4', () => {
    assert(d.nhanLichSuViPham({ id: 1, field: 'measure', oldValue: null, newValue: '3', actorUserId: 1, actorName: null, createdAt: '2026-09-01T00:00:00Z' }, TODAY).moi === 'Gắn vào lần xử lý', 'lịch sử');
    assert(d.cauCanhBaoTrung([{ category: 'homework', occurredOn: TODAY, trangThai: 'cho_duyet' }], TODAY) === `Đã có 1 vi phạm BTVN ngày ${d.ngay(TODAY, TODAY)}`, 'chờ duyệt không "chưa xử lý"');
  });
}
