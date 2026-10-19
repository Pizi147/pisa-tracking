/**
 * PHÉP KIỂM OV-15d (kế hoạch `docs/superpowers/plans/2026-10-19-ov15-overhaul-6-pr.md` mục OV-15d) — Công việc, Tổng quan, thông báo:
 *  · thông báo tự động thay Nhắc: bài quá hạn chấm (một / lớp · đợt), Case chưa chốt PA quá hạn, Chốt lộ trình tới hạn; dedup theo đối tượng,
 *    tự hết khi việc xong, bấm mở đúng việc ở Công việc;
 *  · GV vào thẳng Công việc (không mục Tổng quan);
 *  · luật thuần của danh sách Công việc (lọc người, Quá hạn, việc sau tuần này, xong hết hôm nay);
 *  · Tổng quan QL A: số ở dải tóm tắt / bảng lớp = số dòng panel (cùng hàm đếm).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

/** Trần câu SQL (Turso) của đường mới, QL MB trên bộ demo — max(đo + 10, ⌈đo × 1,3⌉); số đo ghi trong log. */
export const TRAN_QL = 84;   // đo 51 trên bộ demo vừa dựng, 64 khi chạy đủ bộ kiểm → ⌈64 × 1,3⌉
export const TRAN_CAN_QUYET = 47;   // đo 34 / 36 khi chạy đủ → ⌈36 × 1,3⌉

export async function runPrOv15dTests(t: YThucTestKit) {
  const { check, checkAsync, assert, conn, P, TODAY } = t as any;
  const d: any = await import('../../../shared/domain/index.ts');
  const tb: any = await import('../worklist/thongBaoViec.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const { navOf } = await import('../platform/nav.ts');
  const { thongBaoCua } = await import('../platform/thongBao.ts');
  const { createApp } = await import('../app.ts');
  const { createSession } = await import('../auth.ts');
  const { xoaNho, soCauSql } = await import('../platform/nguCanhRequest.ts');
  const tqMod: any = await import('../worklist/tongQuanQl.ts');
  const metrics: any = await import('../worklist/metrics.ts');
  const baoCaoMod: any = await import('../phanTich/baoCao.ts');
  const buocTiepMod: any = await import('../loTrinh/buocTiep.ts');
  const MB = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id as number;
  console.log('\nOV-15d · Công việc một danh sách, Tổng quan QL A, thông báo tự động thay Nhắc');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const t2 = d.mondayOfDate(TODAY);
  const viec = (x: any) => ({
    key: 'k', group: 'score', urgency: 'normal', studentId: null, studentName: 'Lớp MB FT 101', classId: 1, classCode: 'MB FT 101',
    attemptId: 1, attemptNo: 1, caseId: null, level: null, reason: 'Listening', actionLabel: 'Nhập điểm', href: '/', tieuDe: 'Nhập điểm Listening',
    ownerId: 50, owner: null, mine: false, due: '2026-09-01', statusLabel: '', contextLabel: 'MT1 W1 SEP', count: 2, soBai: 2, ...x,
  });

  check('OV15d-1 · thông báo từ việc: chấm quá hạn một / lớp · đợt cho người giữ; không chấm chéo, không việc chưa quá hạn', () => {
    const ds = tb.thongBaoTuViec([
      viec({ key: 'score:1|mock|p9|u50', urgency: 'overdue' }),
      viec({ key: 'score:2|mock|p9|u50', urgency: 'normal' }),
      viec({ key: 'score:3|mock|p9|u0|cc', urgency: 'overdue', ownerId: null }),
      viec({ key: 'score:4|mock|p9|u0', urgency: 'overdue', ownerId: null }),   // chưa phân công: không có người nhận
    ], { nguoiXem: 7, laQuanLy: false, homNay: TODAY });
    assert(ds.length === 1, `một thông báo: ${JSON.stringify(ds)}`);
    const x = ds[0];
    assert(x.userId === 50 && x.kind === 'qua_han_cham' && x.dedupKey === 'td:cham:score:1|mock|p9|u50', JSON.stringify(x));
    assert(x.duong === `/cong-viec?viec=${encodeURIComponent('score:1|mock|p9|u50')}`, `mở đúng việc: ${x.duong}`);
    assert(/MB FT 101/.test(x.title) && /MT1 W1 SEP/.test(x.title) && /hạn 01\/09/.test(x.body) && !/T[2-7] /.test(x.body), `chữ: ${x.title} / ${x.body}`);
  });

  check('OV15d-2 · Case chưa chốt PA quá hạn: một thông báo / Case (nhiều việc cùng Case gộp), Chốt lộ trình tới hạn chỉ cho QL đang xem', () => {
    const cuoiTuan = d.addDaysIso(t2, 6);
    const ds = tb.thongBaoTuViec([
      viec({ key: 'cause:5', group: 'cause', urgency: 'overdue', caseId: 5, studentName: 'Lý Minh Châu', ownerId: 60 }),
      viec({ key: 'xnpa:5', group: 'xac_nhan_pa', urgency: 'overdue', caseId: 5, studentName: 'Lý Minh Châu', ownerId: 60 }),
      viec({ key: 'noplan:6', group: 'no_plan', urgency: 'normal', caseId: 6, ownerId: 60 }),
      viec({ key: 'chotft:8', group: 'chot_len_ft', classId: 8, classCode: 'MB FOU 12', ownerId: null, due: cuoiTuan }),
      viec({ key: 'chotft:9', group: 'chot_len_ft', classId: 9, ownerId: null, due: d.addDaysIso(t2, 13) }),
    ], { nguoiXem: 2, laQuanLy: true, homNay: TODAY });
    const ca = ds.filter((x: any) => x.kind === 'case_chua_chot_pa');
    assert(ca.length === 1 && ca[0].userId === 60 && ca[0].dedupKey === 'td:case:5' && /Lý Minh Châu/.test(ca[0].title), JSON.stringify(ca));
    const ch = ds.filter((x: any) => x.kind === 'chot_lo_trinh');
    assert(ch.length === 1 && ch[0].userId === 2 && ch[0].dedupKey === 'td:chot:8', JSON.stringify(ch));
    assert(!tb.thongBaoTuViec([viec({ key: 'chotft:8', group: 'chot_len_ft', classId: 8, ownerId: null, due: cuoiTuan })],
      { nguoiXem: 7, laQuanLy: false, homNay: TODAY }).length, 'GV không nhận Chốt lộ trình');
  });

  check('OV15d-3 · đồng bộ: thêm một lần (chạy lại không trùng), giữ "đã đọc"; việc xong → xoá của người xem khi đủ phạm vi; không xoá của người khác', () => thu(() => {
    const gv = P.w1Teacher.userId as number, ql = P.mbManager.userId as number;
    const mau = (userId: number, k: string) => ({ userId, kind: 'qua_han_cham', dedupKey: `td:cham:${k}`, title: `Quá hạn chấm ${k}`, body: 'b', duong: '/cong-viec', entityType: 'class', entityId: null });
    /* Chỉ đếm ba khoá của phép kiểm — bộ chạy đủ có thể đã có thông báo tự động khác của GV này (các phép kiểm trước gọi /my-work). */
    const dem = (u: number) => (conn.prepare(`SELECT COUNT(*) n FROM notifications WHERE user_id = ? AND dedup_key IN ('td:cham:a', 'td:cham:b', 'td:cham:c')`).get(u) as any).n as number;
    const g0 = dem(gv);
    tb.dongBoThongBaoViec([mau(gv, 'a'), mau(gv, 'b'), mau(ql, 'c')], { nguoiXem: ql, day: true });
    tb.dongBoThongBaoViec([mau(gv, 'a'), mau(gv, 'b'), mau(ql, 'c')], { nguoiXem: ql, day: true });
    assert(dem(gv) === g0 + 2 && dem(ql) >= 1, `thêm một lần: ${dem(gv)} / ${g0}`);
    conn.prepare(`UPDATE notifications SET read_at = '2026-09-14' WHERE user_id = ? AND dedup_key = 'td:cham:a'`).run(gv);
    tb.dongBoThongBaoViec([mau(gv, 'a')], { nguoiXem: gv, day: false });
    assert(dem(gv) === g0 + 2, 'không đủ phạm vi (lọc chi nhánh) → không xoá');
    tb.dongBoThongBaoViec([mau(gv, 'a')], { nguoiXem: gv, day: true });
    assert(dem(gv) === g0 + 1, `việc b xong → xoá: ${dem(gv)}`);
    assert((conn.prepare(`SELECT read_at FROM notifications WHERE user_id = ? AND dedup_key = 'td:cham:a'`).get(gv) as any).read_at === '2026-09-14', 'giữ đã đọc');
    assert(dem(ql) >= 1, 'GV đồng bộ không xoá thông báo của QL');
    /* Chuông chỉ trả 50 dòng (chưa đọc trước) — soi chính dòng vừa ghi, qua hai hàm chuông dùng. */
    const bell = conn.prepare(`SELECT * FROM notifications WHERE user_id = ? AND dedup_key = 'td:cham:a'`).get(gv) as any;
    assert(bell && d.nhomThongBao(bell) === 'can-lam' && d.duongThongBao(bell) === '/cong-viec', `chuông: Cần làm, mở Công việc: ${JSON.stringify(bell)}`);
    assert(thongBaoCua(gv).length > 0, 'chuông đọc được');
  }));

  await checkAsync('OV15d-4 · GET /my-work của GV sinh thông báo từ chính việc của mình (cùng tập việc quá hạn), không lỗi khi chạy lại', async () => {
    const gv = P.w1Teacher;
    const w = thu(() => mywork.myWork(gv, {}));
    const ky = tb.thongBaoTuViec(w.items, { nguoiXem: gv.userId, laQuanLy: false, homNay: TODAY })
      .filter((x: any) => x.userId === gv.userId).map((x: any) => x.dedupKey).sort();
    const may = createApp().listen(0);
    try {
      const cong = (may.address() as any).port as number;
      const goi = (uid: number, url: string) => fetch(`http://127.0.0.1:${cong}/api${url}`, { headers: { cookie: `pisa_demo_session=${createSession(uid)}` } });
      assert((await goi(gv.userId, '/my-work')).status === 200 && (await goi(gv.userId, '/my-work')).status === 200, 'my-work 200');
      const co = (conn.prepare(`SELECT dedup_key FROM notifications WHERE user_id = ? AND kind IN ('qua_han_cham','case_chua_chot_pa','chot_lo_trinh') ORDER BY dedup_key`)
        .all(gv.userId) as any[]).map((r) => r.dedup_key);
      assert(JSON.stringify(co) === JSON.stringify(ky), `thông báo = việc quá hạn của GV: ${co.length} / ${ky.length}`);
      assert(ky.some((k: string) => k.startsWith('td:cham:')), 'bộ demo: GV W1 có bài quá hạn chấm');
    } finally { may.close(); }
  });

  check('OV15d-6 · Công việc một danh sách: lọc người Của tôi · Của GV · Tất cả (số = số dòng), "Việc quản lý" cho QL, việc chưa có người', () => {
    const ds = [{ mine: true }, { mine: false }, { mine: false }];
    const dem = d.demNguoi(ds);
    assert(dem.toi === 1 && dem.gv === 2 && dem['tat-ca'] === 3, JSON.stringify(dem));
    assert(ds.filter((x) => d.khopNguoi(x, 'gv')).length === 2 && ds.filter((x) => d.khopNguoi(x, 'tat-ca')).length === 3, 'lọc người');
    assert(d.nhanNhomCongViec('van-hanh', true) === 'Việc quản lý' && d.nhanNhomCongViec('van-hanh', false) === 'Vận hành'
      && d.nhanNhomCongViec('cham-diem', true) === 'Chấm điểm', 'nhãn nhóm');
    const cn = (x: any) => d.chuaCoNguoi({ key: 'k', group: 'no_plan', ownerId: null, mine: false, classId: 3, ...x });
    assert(cn({}) && !cn({ ownerId: 5 }) && !cn({ mine: true }) && !cn({ key: 'score:1|cc', group: 'score' }) && !cn({ group: 'chot_len_ft' }) && !cn({ classId: null }),
      'chưa có người: không gán, không chấm chéo, không việc cả lớp, có lớp để phân công');
  });

  check('OV15d-7 · hàng đợi GV: việc sau tuần này gập riêng; lưu xong (máy chủ không còn trả) → tự sang việc kế chưa xong; chưa xong thì ở lại', () => {
    const cn = d.addDaysIso(t2, 6);
    assert(!d.sauTuanNay({ urgency: 'overdue', due: '2026-01-01' }, TODAY) && !d.sauTuanNay({ urgency: 'normal', due: cn }, TODAY)
      && !d.sauTuanNay({ urgency: 'normal', due: null }, TODAY) && d.sauTuanNay({ urgency: 'normal', due: d.addDaysIso(t2, 7) }, TODAY), 'sau tuần này');
    const thuTu = [{ key: 'a' }, { key: 'b' }, { key: 'c' }];
    assert(d.viecSauKhiXong(thuTu, 'a', new Set(['a'])) === 'b', 'xong a → b');
    assert(d.viecSauKhiXong(thuTu, 'a', new Set(['a', 'b'])) === 'c', 'bỏ qua việc đã xong');
    assert(d.viecSauKhiXong(thuTu, 'a', new Set()) === undefined, 'chưa xong (lưu một phần / lỗi) → ở lại');
    assert(d.viecSauKhiXong(thuTu, 'c', new Set(['c'])) === null, 'việc cuối xong → đóng panel');
  });

  check('OV15d-8 · Tổng quan QL A: dải tóm tắt = chỉ số trong sổ (cùng Báo cáo); số ô bảng lớp / Trễ chấm = số dòng panel', () => thu(() => {
    const tq: any = tqMod;
    const loc = { branchId: MB, program: 'ft' };
    const r = tq.tongQuanQlA(P.mbManager, { branchId: MB, ct: 'ft' });
    const n = (id: string) => metrics.metricSet(P.mbManager, id, loc).n;
    assert(r.tomTat.chuaLich === n('hv-ft-xong-mt-cuoi-chua-mt-ke') && r.tomTat.caseChuaChot === n('case-cho-xac-dinh-nguyen-nhan')
      && r.tomTat.caseQuaHan === n('case-xac-dinh-nguyen-nhan-qua-han') && r.tomTat.baiTre === n('bai-qua-han-nhap-diem'), `tóm tắt ≠ sổ: ${JSON.stringify(r.tomTat)}`);
    const bc = baoCaoMod.baoCao(P.mbManager, { branchId: MB, ct: 'ft', ...d.khoangMacDinh(TODAY) });
    assert(bc.chuY.chuaDiemHv === r.tomTat.chuaDiemHv && bc.chuY.caseChuaChotHv === r.tomTat.caseChuaChotHv, 'cùng số với Báo cáo › HV cần chú ý');
    assert(r.lop.hang.length > 0 && r.lop.tong.hv > 0 && r.tomTat.baiTre > 0, `bộ demo: ${r.lop.hang.length} lớp`);
    const o = (k: string) => tq.oTongQuanQlA(P.mbManager, { branchId: MB, ct: 'ft', o: k });
    assert(o('chua-diem').n === r.tomTat.chuaDiemHv && o('case-chua-chot-hv').n === r.tomTat.caseChuaChotHv, 'panel dải tóm tắt');
    const h = r.lop.hang.find((x: any) => x.caseN > 0 && x.sos1 + x.sos2 + x.sos3 > 0) ?? r.lop.hang[0];
    for (const cot of ['hv', 'chuaDiem', 'sos1', 'sos2', 'sos3', 'caseHv', 'caseN']) {
      assert(o(`lop:${h.classId}:${cot}`).n === h[cot], `ô ${h.lop} ${cot}: ${o(`lop:${h.classId}:${cot}`).n} ≠ ${h[cot]}`);
      assert(o(`lop:tong:${cot}`).n === r.lop.tong[cot], `ô tổng ${cot}`);
    }
    assert(r.lop.hang.reduce((x: number, y: any) => x + y.caseN, 0) <= r.lop.tong.caseN, 'Σ Case theo lớp ≤ tổng');
    assert(r.tuan.tre.length === r.tomTat.gvTre && r.tuan.tre.every((g: any) => o(`gv:${g.khoa}`).n === g.bai), 'Trễ chấm theo GV = panel');
    assert(r.tuan.tuan.length === 5 && r.tuan.tuan.filter((w: any) => w.laTuanNay).length === 1 && r.tuan.tuan.every((w: any) => w.daCham <= w.tong), JSON.stringify(r.tuan.tuan));
    assert(d.lopCoVanDe({ chuaLich: 0, chuaDiem: 0, sos1: 0, sos2: 0, sos3: 0, caseN: 0, daThiChoKq: 0 }) === false
      && d.lopCoVanDe({ chuaLich: null, chuaDiem: 1, sos1: 0, sos2: 0, sos3: 0, caseN: 0, daThiChoKq: null }) === true, 'Chỉ lớp có vấn đề');
  }));

  check('OV15d-9 · Cần bạn quyết (gộp hai khung): Case chưa chốt PA quá hạn = chỉ số, Chọn bước tiếp = việc của QL, Chốt lộ trình chỉ khi có', () => thu(() => {
    const tq: any = tqMod;
    const r = tq.canBanQuyet(P.mbManager, { branchId: MB });
    assert(r.caseQuaHan.length === metrics.metricSet(P.mbManager, 'case-xac-dinh-nguyen-nhan-qua-han', { branchId: MB }).n, 'Case quá hạn');
    assert(r.caseQuaHan.every((x: any) => x.caseId && x.soNgay > 0), JSON.stringify(r.caseQuaHan[0]));
    const bt = buocTiepMod.viecBuocTiep(P.mbManager, { today: TODAY, branchId: MB });
    assert(r.buocTiep.length === bt.length, `Bước tiếp: ${r.buocTiep.length} / ${bt.length}`);
    assert(Array.isArray(r.chotLoTrinh), 'Chốt lộ trình là mảng (rỗng → khối không vẽ)');
  }));

  await checkAsync('OV15d-10 · HTTP: QL 200, GV 403; trần câu SQL đường mới', async () => {
    const may = createApp().listen(0);
    try {
      const cong = (may.address() as any).port as number;
      const goi = async (uid: number, url: string) => {
        const res = await fetch(`http://127.0.0.1:${cong}/api${url}`, { headers: { cookie: `pisa_demo_session=${createSession(uid)}` } });
        return { status: res.status, json: await res.json().catch(() => null) as any };
      };
      let truoc = soCauSql();
      const a = await goi(P.mbManager.userId, `/tong-quan/ql?branchId=${MB}&ct=ft`);
      const cauA = soCauSql() - truoc; truoc = soCauSql();
      const q = await goi(P.mbManager.userId, `/tong-quan/can-quyet?branchId=${MB}`);
      const cauQ = soCauSql() - truoc;
      console.log(`      (đo: /tong-quan/ql ${cauA} câu · /tong-quan/can-quyet ${cauQ} câu)`);
      assert(a.status === 200 && a.json.lop.hang.length > 0 && q.status === 200, `${a.status} / ${q.status}`);
      const o = await goi(P.mbManager.userId, `/tong-quan/ql/o?branchId=${MB}&ct=ft&o=chua-diem`);
      assert(o.status === 200 && o.json.n === a.json.tomTat.chuaDiemHv, 'panel qua HTTP');
      for (const url of ['/tong-quan/ql?ct=ft', '/tong-quan/can-quyet', '/tong-quan/ql/o?ct=ft&o=chua-diem']) {
        assert((await goi(P.w1Teacher.userId, url)).status === 403, `GV ${url}`);
      }
      assert(cauA <= TRAN_QL && cauQ <= TRAN_CAN_QUYET, `trần câu SQL: ${cauA}/${TRAN_QL}, ${cauQ}/${TRAN_CAN_QUYET}`);
    } finally { may.close(); }
  });

  check('OV15d-5 · GV (GVCN, GVBM) vào thẳng Công việc: không có Tổng quan; QL, Quản trị, TVV giữ Tổng quan', () => {
    for (const p of [P.coreTeacher, P.subjectTeacher, P.normalCoreTeacher]) {
      const n = navOf(p);
      assert(!n.overview && n.work, `GV: overview=${n.overview}`);
      assert(!d.khuVucHienThi(n).some((k: any) => k.key === 'tong-quan'), 'thanh trên GV không có Tổng quan');
    }
    for (const p of [P.mbManager, P.admin]) assert(navOf(p).overview, 'QL / Quản trị có Tổng quan');
  });
}
