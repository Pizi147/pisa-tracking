/**
 * PHÉP KIỂM BAN-GIAO-DOT (chủ SP 26/11, ảnh panel "Bàn giao · CP FT 130"): đợt bàn giao mới không kéo theo em đã xác nhận xong ở đợt trước — panel, việc
 * Bàn giao (Công việc), dải hồ sơ lớp cùng một hàm `dotBanGiao`. Mọi ca chạy trong giao dịch cuộn lại.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrBanGiaoDotTests(t: YThucTestKit) {
  const { check, assert, conn, TODAY, P, addDays } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const bg: any = await import('../classes/banGiao.ts');
  const lenh: any = await import('../classes/lenhChuyen.ts');
  const dai: any = await import('../classes/daiChuyenLop.ts');
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const { myWork } = await import('../worklist/mywork.ts');
  console.log('\nBAN-GIAO-DOT · Đợt bàn giao không kéo em đợt cũ');

  const thu = (fn: () => void) => { conn.exec('BEGIN IMMEDIATE'); try { fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); } };
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];

  // ------------------------------------------------------------------ 1 · hàm thuần
  check('BGD-1 · dotBanGiao: em xong trước khi đợt mới bắt đầu không vào đợt; cùng đợt xong rồi vẫn vào; hết chờ → đợt gần nhất', () => {
    const l = (id: number, ra: string, xn: string | null = null) => ({ id, ngay_ra_lenh: ra, xac_nhan_luc: xn });
    const ids = (ds: any[]) => d.dotBanGiao(ds).map((x: any) => x.id).join();
    /* Ảnh chủ SP: em chuyển W3 NOV (ra lệnh 13/11, xác nhận 17/11) + 5 em W1 DEC (ra lệnh 25/11, chưa xác nhận). */
    const anh = [l(1, '2026-11-13', '2026-11-17T09:35:00'), ...[2, 3, 4, 5, 6].map((i) => l(i, '2026-11-25'))];
    assert(ids(anh) === '2,3,4,5,6', `ảnh chủ SP: ${ids(anh)}`);
    /* Em cùng đợt đã xác nhận → vẫn trong đợt (tiến độ "a/b đã xác nhận" không tụt). */
    assert(ids([...anh, l(7, '2026-11-25', '2026-11-26T08:00:00')]) === '2,3,4,5,6,7', 'cùng đợt đã xác nhận');
    /* Em đợt cũ xác nhận MUỘN (sau khi đợt mới bắt đầu) → còn là việc của đợt này. */
    assert(ids([l(1, '2026-11-13', '2026-11-26T10:00:00'), l(2, '2026-11-25')]) === '1,2', 'xác nhận sau mốc đợt mới');
    /* Lệnh cũ còn chờ (quá hạn) kéo mốc về sớm — vẫn là việc, không giấu. */
    assert(ids([l(1, '2026-11-01'), l(2, '2026-11-13', '2026-11-17T09:00:00'), l(3, '2026-11-25')]) === '1,2,3', 'lệnh cũ còn chờ');
    /* Hết chờ: đợt gần nhất (ngày ra lệnh mới nhất). */
    assert(ids([l(1, '2026-11-13', '2026-11-17T09:00:00'), l(2, '2026-11-25', '2026-11-26T09:00:00'), l(3, '2026-11-25', '2026-11-27T09:00:00')]) === '2,3', 'hết chờ → đợt mới nhất');
    assert(d.dotBanGiao([]).length === 0, 'rỗng');
  });

  // ------------------------------------------------------------------ dựng: lớp nguồn + 1 em đợt cũ (đã xác nhận) + 3 em đợt mới
  const MB = get(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const TUAN = d.tuanChonDuoc(TODAY) as string[];
  const GV = all(`SELECT DISTINCT ur.user_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id
     WHERE r.key = 'teacher' AND ur.status = 'active' AND ur.branch_id = ? ORDER BY ur.user_id LIMIT 4`, MB).map((r) => loadPrincipal(r.user_id));
  let seq = 0;
  const dung = () => {
    const lop = (kind: string, tuanHienTai: number) => {
      seq += 1;
      const bat = d.mondayOfDate(addDays(TODAY, -7 * (tuanHienTai - 1)));
      return intake.createClass(P.admin, { code: `MB-BGD${seq}`, branchId: MB, kind, isFastTrack: false, route: null, startDate: bat, startPeriodId: week.ensurePeriod(bat).id }).id as number;
    };
    const nguon = lop('FOU', 8); const dich = lop('BE', 1);
    const gan = (l: number, u: number, skill: string | null, core: boolean) => conn.prepare(
      `INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,?,?, '2026-01-01', 'active', ?)`,
    ).run(u, l, skill, core ? 1 : 0, new Date().toISOString());
    gan(nguon, GV[0].userId, null, true); gan(nguon, GV[1].userId, 'listening', false); gan(dich, GV[3].userId, null, true);
    const em = () => {
      seq += 1;
      const now = new Date().toISOString();
      const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
        .run(`PISA-BGD${seq}`, `Hoc vien BGD${seq}`, `hoc vien bgd${seq}`, MB, now).lastInsertRowid);
      conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, nguon, TODAY, now);
      conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, started_at, status, created_at) VALUES (?, 1, NULL, 'FOU', ?, 'active', ?)`).run(sid, TODAY, now);
      return sid;
    };
    const ra = (sids: number[]) => {
      const r = lenh.raLenh(P.mbManager, { lopNguonId: nguon, boiCanh: 'cuoi-khoa', tuanChung: null, dongs: sids.map((studentId) => ({ studentId, huong: 'len_lop', toClassId: dich, tuan: TUAN[0] })) });
      assert(r.ok.length === sids.length, JSON.stringify(r.failed));
      return sids.map((s) => get('SELECT * FROM lenh_chuyen_lop WHERE student_id = ? ORDER BY id DESC LIMIT 1', s).id as number);
    };
    const gvcn = loadPrincipal(GV[0].userId);
    /* Đợt cũ: ra lệnh 20 ngày trước, GVCN xác nhận 15 ngày trước. */
    const [cu] = ra([em()]);
    bg.xacNhanBanGiao(gvcn, cu, 'Em chăm, ngại nói trước lớp. Mẹ theo sát.');
    conn.prepare('UPDATE lenh_chuyen_lop SET ngay_ra_lenh = ?, xac_nhan_luc = ? WHERE id = ?').run(addDays(TODAY, -20), `${addDays(TODAY, -15)}T09:00:00`, cu);
    const moi = ra([em(), em(), em()]);
    xoaNho();
    return { nguon, dich, cu, moi, gvcn, gvbm: loadPrincipal(GV[1].userId), gvDich: loadPrincipal(GV[3].userId) };
  };
  const viecGvcn = (x: ReturnType<typeof dung>) => bg.viecBanGiao(x.gvcn.userId).find((v: any) => v.lopId === x.nguon && v.loai === 'gvcn');
  const viecCv = (who: any, lop: number) => ((myWork(who) as any).items ?? []).filter((i: any) => i.group === 'ban_giao' && i.classId === lop);
  const pr = (x: ReturnType<typeof dung>) => ({ phase: 'running', finalWeekStart: null, startWeekStart: get('SELECT start_date FROM classes WHERE id = ?', x.nguon).start_date, totalWeeks: 8 });

  // ------------------------------------------------------------------ 2 · đợt
  check('BGD-2 · em xác nhận ở đợt trước không vào đợt mới: panel 3 em · 0/3, việc GVCN "0/3", Công việc, dải hồ sơ lớp cùng số; hồ sơ em cũ vẫn đọc được phiếu', () => thu(() => {
    const x = dung();
    const ph = bg.phieuBanGiao(x.gvcn, { lopNguonId: x.nguon });
    assert(ph.ds.length === 3 && !ph.ds.some((e: any) => e.lenhId === x.cu), `panel: ${ph.ds.map((e: any) => e.lenhId)}`);
    assert(ph.tong === 3 && ph.daXacNhan === 0, `panel đếm ${ph.daXacNhan}/${ph.tong}`);
    const v = viecGvcn(x);
    assert(v && v.n === ph.tong && v.daXacNhan === ph.daXacNhan, `việc ${v?.daXacNhan}/${v?.n}`);
    const cv = viecCv(x.gvcn, x.nguon);
    assert(cv.length === 1 && cv[0].count === 3 && cv[0].contextLabel.includes('0/3 đã xác nhận'), JSON.stringify(cv.map((i: any) => i.contextLabel)));
    const dl = dai.daiLop(x.gvcn, x.nguon, { pr: pr(x), ft: false, ct: 'FOU' });
    assert(dl.banGiao && dl.banGiao.tong === 3 && dl.banGiao.daXacNhan === 0, `dải ${JSON.stringify(dl.banGiao)}`);
    /* Dữ liệu cũ giữ: đọc một phiếu theo lệnh (hồ sơ HV) vẫn ra phiếu đã xác nhận. */
    const motPhieu = bg.phieuBanGiao(x.gvcn, { lenhId: x.cu });
    assert(motPhieu.ds.length === 1 && motPhieu.ds[0].xacNhan, 'hồ sơ em cũ: phiếu đã xác nhận còn đọc được');
    /* Xác nhận một em đợt mới: vẫn trong đợt, đếm 1/3 ở mọi nơi. */
    bg.xacNhanBanGiao(x.gvcn, x.moi[0], 'Em chăm, ngại nói trước lớp. Mẹ theo sát.');
    xoaNho();
    const ph2 = bg.phieuBanGiao(x.gvcn, { lopNguonId: x.nguon });
    assert(ph2.tong === 3 && ph2.daXacNhan === 1 && viecGvcn(x).daXacNhan === 1 && viecGvcn(x).n === 3, `sau xác nhận ${ph2.daXacNhan}/${ph2.tong}`);
  }));
}
