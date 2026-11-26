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
  check('BGD-1 · dotBanGiao gom theo TUẦN CHUYỂN: đợt đã xác nhận hết không hiện; còn chờ thì cả đợt; nhiều đợt chờ cùng hiện; mở thẳng em đợt cũ → thêm đợt đó; hết chờ → đợt mới nhất', () => {
    const l = (id: number, tuan: string, xn: string | null = null) => ({ id, tuan_bat_dau: tuan, xac_nhan_luc: xn });
    const ids = (ds: any[], chon?: number) => d.dotBanGiao(ds, chon).map((x: any) => x.id).join();
    /* Ảnh chủ SP: em chuyển W3 NOV (đã xác nhận) + 5 em W1 DEC (chưa xác nhận). */
    const anh = [l(1, '2026-11-16', '2026-11-17T02:35:00Z'), ...[2, 3, 4, 5, 6].map((i) => l(i, '2026-11-30'))];
    assert(ids(anh) === '2,3,4,5,6', `ảnh chủ SP: ${ids(anh)}`);
    /* Cùng tuần chuyển, ra lệnh rải nhiều ngày, một em đã xác nhận → vẫn cùng đợt (5/6 — không theo ngày ra lệnh / giờ UTC). */
    assert(ids([...anh, l(7, '2026-11-30', '2026-11-20T01:00:00Z')]) === '2,3,4,5,6,7', 'cùng tuần chuyển đã xác nhận');
    /* "Ngay hôm nay" giữa tuần cùng đợt với Thứ Hai tuần đó. */
    assert(ids([l(1, '2026-12-02'), l(2, '2026-11-30', '2026-11-26T01:00:00Z'), l(3, '2026-11-23', '2026-11-20T01:00:00Z')]) === '1,2', 'chuyển giữa tuần');
    /* Lệnh cũ còn chờ (bị quên) → đợt đó vẫn hiện, không trộn em đã xong của đợt khác. */
    assert(ids([l(1, '2026-10-26'), l(2, '2026-10-26', '2026-10-27T01:00:00Z'), l(3, '2026-11-16', '2026-11-17T01:00:00Z'), l(4, '2026-11-30')]) === '1,2,4', 'nhiều đợt chờ');
    assert(ids(anh, 1) === '1,2,3,4,5,6', 'mở thẳng em đợt cũ → thêm đúng đợt đó');
    assert(ids([l(1, '2026-11-16', 'x'), l(2, '2026-11-30', 'x'), l(3, '2026-11-30', 'x')]) === '2,3', 'hết chờ → đợt mới nhất');
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
    /* Đợt cũ: chuyển hai tuần trước tuần chuyển của đợt mới, đã chuyển, GVCN đã xác nhận. */
    const [cu] = ra([em()]);
    bg.xacNhanBanGiao(gvcn, cu, 'Em chăm, ngại nói trước lớp. Mẹ theo sát.');
    conn.prepare(`UPDATE lenh_chuyen_lop SET ngay_ra_lenh = ?, tuan_bat_dau = ?, trang_thai = 'da_chuyen' WHERE id = ?`).run(addDays(TODAY, -20), addDays(TUAN[0], -14), cu);
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

  check('BGD-3 · phía ĐÍCH: GV lớp chuyển đến vẫn đọc phiếu em đợt cũ sau khi lớp nguồn ra đợt mới (không 403)', () => thu(() => {
    const x = dung();
    const ph = bg.phieuBanGiao(x.gvDich, { lopNguonId: x.nguon });
    assert(ph.ds.length === 1 && ph.ds[0].lenhId === x.cu && ph.ds[0].xacNhan, `đích: ${ph.ds.map((e: any) => e.lenhId)}`);
  }));

  check('BGD-4 · mở thẳng em đợt cũ (Sửa phiếu đã xác nhận): panel thêm đúng đợt đó, chia khối theo tuần, đợt mới trên cùng, a/b từng đợt', () => thu(() => {
    const x = dung();
    const ph = bg.phieuBanGiao(x.gvcn, { lopNguonId: x.nguon, chon: x.cu });
    assert(ph.ds.length === 4 && ph.ds.at(-1).lenhId === x.cu && ph.ds[0].dot > ph.ds.at(-1).dot, `thứ tự: ${ph.ds.map((e: any) => e.dot)}`);
    assert(JSON.stringify(ph.dot.map((k: any) => [k.daXacNhan, k.tong])) === '[[0,3],[1,1]]', JSON.stringify(ph.dot));
    assert(ph.ds.find((e: any) => e.lenhId === x.cu).suaDuoc, 'em đợt cũ: Sửa được');
  }));

  check('BGD-5 · hai đợt còn chờ (lệnh cũ bị quên): cả hai đợt hiện, đếm từng đợt; việc GVCN = panel', () => thu(() => {
    const x = dung();
    conn.prepare('UPDATE lenh_chuyen_lop SET xac_nhan_luc = NULL, tu_dien = NULL WHERE id = ?').run(x.cu);
    xoaNho();
    const ph = bg.phieuBanGiao(x.gvcn, { lopNguonId: x.nguon });
    assert(ph.tong === 4 && ph.dot.length === 2 && ph.dot[0].tong === 3 && ph.dot[1].tong === 1, JSON.stringify(ph.dot));
    const v = viecGvcn(x);
    assert(v.n === 4 && v.daXacNhan === 0, `việc ${v.daXacNhan}/${v.n}`);
  }));

  check('BGD-6 · dải "Đã chuyển ≤ 14 ngày" (hết đợt chờ) = panel mở không chọn em: chỉ đợt mới nhất', () => thu(() => {
    const x = dung();
    for (const id of x.moi) bg.xacNhanBanGiao(x.gvcn, id, 'Em chăm, ngại nói trước lớp. Mẹ theo sát.');
    conn.prepare(`UPDATE lenh_chuyen_lop SET trang_thai = 'da_chuyen', tuan_bat_dau = ? WHERE id IN (${x.moi.join(',')})`).run(addDays(TUAN[0], -7));
    xoaNho();
    const dl = dai.daiLop(x.gvcn, x.nguon, { pr: pr(x), ft: false, ct: 'FOU' });
    const ph = bg.phieuBanGiao(x.gvcn, { lopNguonId: x.nguon });
    assert(!dl.banGiao && dl.daChuyen && dl.daChuyen.tong === 3 && dl.daChuyen.tong === ph.tong && dl.daChuyen.daXacNhan === ph.daXacNhan, `dải ${JSON.stringify(dl.daChuyen)} · panel ${ph.daXacNhan}/${ph.tong}`);
    assert(!viecGvcn(x), 'hết việc GVCN');
  }));
}
