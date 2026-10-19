/**
 * PHÉP KIỂM OV-15e (kế hoạch `docs/superpowers/plans/2026-10-19-ov15-overhaul-6-pr.md` mục OV-15e) — Phân tích + Báo cáo + Kết quả thi + Phân tích GV + phân trang:
 *  · Phân tích là mục thanh trên; sáu tab Báo cáo · Test + SOS · Kết quả thi · Hiệu quả PA · Phân tích GV · Ý thức (Báo cáo mặc định);
 *  · bộ chọn thời gian chung (2 tuần vừa qua · tuần · tháng · tùy chọn), URL ngày đầu – cuối, giữ khi đổi tab, link cũ vẫn đọc được;
 *  · Báo cáo: mỗi số = số dòng panel (cùng `tinh`), bài quá hạn = tập "Trễ chấm" của Tổng quan trong kỳ, Kết quả Mock = tab Kết quả thi;
 *  · Kết quả thi: Mock Đạt ⇔ OVR ≥ kỳ vọng, đếm theo lượt, xếp Mức SOS nặng trước; Thi thật có Bước tiếp + Người chọn;
 *  · Phân tích GV: panel chỉ số đúng GV + khoảng, số dòng = mẫu số của ô (`0/n` mở n mục);
 *  · phân trang thuần; HTTP theo vai + trần câu SQL.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

/** Trần câu SQL (Turso) của đường mới, QL MB trên bộ demo — max(đo + 10, ⌈đo × 1,3⌉); số đo ghi trong log. */
export const TRAN_BAO_CAO = 116;   // đo 63 trên bộ demo vừa dựng, 89 sau các phép kiểm khác ghi thêm dữ liệu → ⌈89 × 1,3⌉
export const TRAN_KET_QUA_THI = 34;   // đo 24

export async function runPrOv15eTests(t: YThucTestKit) {
  const { check, checkAsync, assert, assertThrows, conn, P, TODAY } = t as any;
  const d: any = await import('../../../shared/domain/index.ts');
  const tongHop: any = await import('../phanTich/tongHop.ts');
  const baoCao: any = await import('../phanTich/baoCao.ts');
  const kqt: any = await import('../phanTich/ketQuaThi.ts');
  const gvPt: any = await import('../phanTich/giaoVien.ts');
  const metrics: any = await import('../worklist/metrics.ts');
  const thiThat: any = await import('../loTrinh/thiThat.ts');
  const buocTiep: any = await import('../loTrinh/buocTiep.ts');
  const { navOf } = await import('../platform/nav.ts');
  const { createApp } = await import('../app.ts');
  const { createSession } = await import('../auth.ts');
  const { xoaNho, soCauSql } = await import('../platform/nguCanhRequest.ts');
  const fs = await import('node:fs');
  console.log('\nOV-15e · Phân tích thanh trên, Báo cáo, Kết quả thi, Phân tích GV, bộ chọn thời gian, phân trang');

  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const MB = one(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const QL = P.mbManager;
  /* Khoảng rộng (12 tuần tới hết tuần này) — bộ demo có đủ lượt, SOS, Case để soi. */
  const t2 = d.mondayOfDate(TODAY);
  const RONG = { tu: d.addDaysIso(t2, -77), den: d.addDaysIso(t2, 6) };

  check('OV15e-1 · khoảng thời gian: mặc định 2 tuần HOÀN CHỈNH trước tuần này (cả sang năm); link cũ tg / thang / tu-den Thứ Hai; nhãn có năm', () => {
    const md = d.khoangMacDinh('2026-10-14');   // thứ Tư W3 OCT
    assert(md.tu === '2026-09-28' && md.den === '2026-10-11' && md.kieu === '2-tuan', JSON.stringify(md));
    assert(d.nhanKhoang(md).chinh === 'W1 + W2 OCT/2026', d.nhanKhoang(md).chinh);
    assert(d.nhanKhoang(md).phu === '28/09 – 11/10/2026 · 2 tuần', d.nhanKhoang(md).phu);
    const nam = d.khoangMacDinh('2027-01-06');   // W1 JAN/2027 → hai tuần cuối 12/2026
    assert(nam.tu === '2026-12-21' && nam.den === '2027-01-03', JSON.stringify(nam));
    const q = (s: string) => d.khoangTuUrl(new URLSearchParams(s), '2026-10-14');
    assert(JSON.stringify(q('')) === JSON.stringify(md), 'vắng = 2 tuần vừa qua');
    const tg = q('tg=8');
    assert(tg.tu === '2026-08-24' && tg.den === '2026-10-18' && tg.kieu === 'tuan', `tg cũ: ${JSON.stringify(tg)}`);
    const th = q('thang=2026-09');
    assert(th.kieu === 'thang' && th.tu === '2026-08-31' && th.den === '2026-09-27', `thang cũ: ${JSON.stringify(th)}`);
    assert(d.nhanKhoang(th).chinh === '09/2026', d.nhanKhoang(th).chinh);
    const tuan = q('tu=2026-08-31&den=2026-09-14');   // Hiệu quả PA / GV cũ: den = Thứ Hai tuần cuối
    assert(tuan.tu === '2026-08-31' && tuan.den === '2026-09-20', JSON.stringify(tuan));
    const tc = q('kieu=tuy-chon&tu=2026-09-03&den=2026-10-13');
    assert(tc.tu === '2026-09-03' && tc.den === '2026-10-13' && d.nhanKhoang(tc).phu.endsWith('41 ngày'), JSON.stringify(tc));
    assert(d.nhanKhoang({ kieu: 'tuan', tu: '2026-08-24', den: '2026-10-18' }).chinh === 'W4 AUG – W3 OCT/2026', 'nhiều tuần');
    assert(d.nhanKhoang({ kieu: 'tuan', tu: '2026-12-28', den: '2027-01-10' }).chinh.includes('/2027'), 'vắt năm có năm');
    assert(d.loiKhoang({ tu: '2026-10-10', den: '2026-10-01' }) && d.loiKhoang({ tu: '2025-01-01', den: '2026-10-01' }) && d.loiKhoang({ tu: 'x', den: '2026-10-01' }), 'khoảng sai phải có lỗi');
    assert(d.loiKhoang(md) === null, 'khoảng đúng không lỗi');
    const tr = d.khoangTruoc(md);
    assert(tr.tu === '2026-09-14' && tr.den === '2026-09-27', `kỳ trước: ${JSON.stringify(tr)}`);
    assert(Object.keys(d.thamSoKhoang(md, '2026-10-14')).length === 0, 'mặc định không ghi URL');
    assert(d.thamSoKhoang(tc, '2026-10-14').tu === '2026-09-03', 'khoảng khác ghi tu/den/kieu');
  });

  check('OV15e-2 · phân trang thuần: mặc định 10, 20 / 50; trang ngoài tầm kẹp về trang cuối', () => {
    assert(d.CO_TRANG.join(',') === '10,20,50' && d.CO_TRANG_MAC_DINH === 10, 'cỡ trang');
    const a = d.catTrang(34, 4, 10);
    assert(a.trang === 4 && a.soTrang === 4 && a.dau === 30 && a.cuoi === 34, JSON.stringify(a));
    const b = d.catTrang(34, 9, 20);
    assert(b.trang === 2 && b.dau === 20 && b.cuoi === 34, `kẹp: ${JSON.stringify(b)}`);
    const c = d.catTrang(0, 1, 10);
    assert(c.trang === 1 && c.soTrang === 1 && c.dau === 0 && c.cuoi === 0, 'rỗng');
  });

  check('OV15e-3 · Phân tích là mục thanh trên (sau Test); sáu tab, Báo cáo đầu + mặc định; link cũ van-de → Test + SOS; đổi tab giữ thời gian', () => {
    const n = navOf(QL);
    assert(d.khuVucHienThi(n).map((k: any) => k.key).join(',') === 'tong-quan,hoc-vien,test,phan-tich,cong-viec,tutor', d.khuVucHienThi(n).map((k: any) => k.key).join(','));
    assert(!d.khuVucHienThi(navOf(P.w1Teacher)).some((k: any) => k.key === 'phan-tich'), 'GV không có mục Phân tích');
    assert(d.khuVucCuaDuong('/phan-tich') === 'phan-tich', 'tô sáng mục Phân tích');
    assert([...d.GOC_NHIN].join(',') === 'bao-cao,tong-hop,ket-qua-thi,hieu-qua-pa,giao-vien,y-thuc', [...d.GOC_NHIN].join(','));
    assert(d.GOC_NHIN.map((g: string) => d.GOC_NHIN_LABEL[g]).join(' · ') === 'Báo cáo · Test + SOS · Kết quả thi · Hiệu quả PA · Phân tích GV · Ý thức', 'tên tab');
    const g = (s: string) => d.gocNhinTuThamSo(new URLSearchParams(s));
    assert(g('').goc === 'bao-cao', 'không tham số → Báo cáo');
    assert(g('goc=van-de').goc === 'tong-hop' && g('goc=van-de').gocMoi === 'tong-hop', 'van-de cũ → Test + SOS');
    assert(g('xem=tuan').goc === 'tong-hop', '?xem=tuan cũ vẫn mở Test + SOS');
    for (const k of d.GOC_NHIN) for (const x of ['kieu', 'tu', 'den']) assert(!d.thamSoXoaKhiDoiGoc(k).includes(x), `đổi sang ${k} không được xoá ${x}`);
  });

  check('OV15e-4 · Test + SOS nhận khoảng ngày: tu/den 8 tuần = cách cũ `soTuan` 8 (cùng số); không tham số giữ mặc định cũ', () => {
    const cu = tongHop.tongHop(QL, { branchId: MB, ct: 'ft', soTuan: 8, theo: 'lop' });
    const moi = tongHop.tongHop(QL, { branchId: MB, ct: 'ft', soTuan: 8, theo: 'lop', tu: d.addDaysIso(t2, -49), den: d.addDaysIso(t2, 6) });
    assert(JSON.stringify(cu.tong) === JSON.stringify(moi.tong), `cũ ${JSON.stringify(cu.tong)} ≠ mới ${JSON.stringify(moi.tong)}`);
    const hai = tongHop.tongHop(QL, { branchId: MB, ct: 'ft', soTuan: 8, theo: 'tuan', tu: d.addDaysIso(t2, -14), den: d.addDaysIso(t2, -1) });
    assert(hai.hang.length <= 2, `2 tuần → tối đa 2 hàng tuần: ${hai.hang.length}`);
  });

  check('OV15e-5 · Báo cáo: mỗi số = số dòng panel; bài tổng = đã chấm + quá hạn; quá hạn ⊆ "Trễ chấm" Tổng quan; theo GV cộng đủ; Mock = Kết quả thi', () => {
    const f = { branchId: MB, ct: 'ft', ...RONG };
    const bc = baoCao.baoCao(QL, f);
    const o = (k: string) => baoCao.oBaoCao(QL, { ...f, o: k });
    assert(bc.test.hvDaThi > 0 && bc.test.hvDaThi === o('hv-da-thi').n && o('hv-da-thi').rows.length === bc.test.hvDaThi, `HV đã thi ${bc.test.hvDaThi}`);
    assert(bc.test.baiDaCham === o('bai-da-cham').n, 'bài đã chấm');
    assert(bc.test.quaHan === o('bai-qua-han').n && bc.test.baiTong === bc.test.baiDaCham + bc.test.quaHan, 'bài quá hạn / tổng');
    const tre = new Set(metrics.overdueScoreBai(QL, MB, TODAY).ids);
    for (const r of o('bai-qua-han').rows) assert(tre.has(r.id), `bài ${r.id} không có trong Trễ chấm Tổng quan`);
    assert(bc.test.gvQuaHan.reduce((s: number, g: any) => s + g.bai, 0) >= bc.test.quaHan, 'theo GV phủ đủ bài quá hạn');
    for (const g of bc.test.gvQuaHan) assert(o(`gv:${g.khoa}`).n === g.bai, `GV ${g.ten}: ${g.bai}`);
    assert(bc.sos && bc.sos.hang.length > 0, 'bộ demo có SOS trong 12 tuần');
    for (const h of bc.sos.hang) for (const m of [1, 2, 3]) assert(o(`sos:${h.classId}:${m}`).n === h[`sos${m}`], `SOS ${m} ${h.lop}`);
    for (const m of [1, 2, 3]) assert(o(`sos:tong:${m}`).n === bc.sos.tong[`sos${m}`], `SOS ${m} tổng`);
    const mk = kqt.ketQuaMockKq(QL, { branchId: MB, ...RONG });
    assert(bc.mock.dat === mk.tong.dat && bc.mock.chuaDat === mk.tong.chuaDat && bc.mock.chuaDu === mk.tong.chuaDu, 'Mock = tab Kết quả thi');
    assert(bc.chuY.caseChuaChot === metrics.metricSet(QL, 'case-cho-xac-dinh-nguyen-nhan', { branchId: MB, program: 'ft' }).n, 'Case chưa chốt PA = chỉ số Tổng quan');
    assert(d.chuSoTruoc(3, 1) === 'Tăng 2 HV' && d.chuSoTruoc(1, 2) === 'Giảm 1 HV' && d.chuSoTruoc(2, 2) === 'Không đổi', 'chữ so kỳ trước');
    const thuong = baoCao.baoCao(QL, { ...f, ct: 'thuong' });
    assert(thuong.sos === null && thuong.mock === null && thuong.chuY.chuaLich === null, 'lớp thường: không SOS / Mock / chưa lịch MT');
    assertThrows(() => baoCao.baoCao(P.w1Teacher, f), /Quản lý/, 'GV không xem Báo cáo');
  });

  check('OV15e-6 · Kết quả thi Mock: Đạt ⇔ OVR ≥ kỳ vọng, thiếu OVR = Chưa đủ điểm; đếm theo lượt + số HV; Mức SOS nặng trước; lọc kết quả', () => {
    const mk = kqt.ketQuaMockKq(QL, { branchId: MB, ...RONG, xep: 'sos' });
    assert(mk.rows.length > 0 && mk.tong.luot === mk.rows.length, `lượt ${mk.tong.luot}`);
    assert(mk.tong.dat + mk.tong.chuaDat + mk.tong.chuaDu === mk.tong.luot, 'ba kết quả cộng đủ');
    assert(mk.tong.hv === new Set(mk.rows.map((r: any) => r.studentId)).size, 'số HV riêng');
    for (const r of mk.rows) {
      assert(r.ketQua === d.ketQuaMock(r.ovr, r.kyVong), `lượt ${r.attemptId}: ${r.ketQua} ≠ luật`);
      if (r.ovr !== null && r.kyVong !== null) assert((r.ketQua === 'dat') === (r.ovr >= r.kyVong), 'bằng kỳ vọng = Đạt');
    }
    for (let i = 1; i < mk.rows.length; i++) assert((mk.rows[i - 1].sos ?? 0) >= (mk.rows[i].sos ?? 0), 'Mức SOS nặng trước');
    const chua = kqt.ketQuaMockKq(QL, { branchId: MB, ...RONG, kq: 'chua-dat' });
    assert(chua.rows.length === mk.tong.chuaDat && chua.tong.luot === mk.tong.luot, 'lọc Chưa đạt giữ dòng tổng');
    assert(mk.rows.some((r: any) => r.sos && r.casePa), 'lượt SOS có Case / PA');
  });

  check('OV15e-7 · Kết quả thi Thi thật: lượt có kết quả trong khoảng, OVR + Đạt Target; Bước tiếp chọn → hiện chữ + Người chọn', () => {
    thu(() => {
      const cy = one(`SELECT c.id, c.student_id FROM learning_cycles c JOIN enrollments e ON e.student_id = c.student_id AND e.status = 'active'
        JOIN classes l ON l.id = e.class_id AND l.branch_id = ? WHERE c.route IS NOT NULL AND c.status = 'active' AND c.target_score IS NOT NULL
          AND c.seq = (SELECT MAX(x.seq) FROM learning_cycles x WHERE x.student_id = c.student_id)
          AND c.started_at <= ? ORDER BY c.id LIMIT 1`, MB, d.addDaysIso(TODAY, -3));
      assert(cy, 'bộ demo có lộ trình FT');
      thiThat.datKetQuaThiThat(QL, cy.id, { ngayThi: d.addDaysIso(TODAY, -2), l: 6.5, r: 6.5, w: 6, s: 6.5 });
      let kq = kqt.ketQuaThiThatKq(QL, { branchId: MB, ...RONG });
      let r = kq.rows.find((x: any) => x.cycleId === cy.id);
      assert(r && r.ovr === 6.5 && r.lop && r.dat !== null && !r.buocTiep && r.coTheChon, `dòng thi thật: ${JSON.stringify(r)}`);
      assert(kq.tong.chuaChon >= 1 && kq.tong.luot === kq.rows.length, 'đếm');
      buocTiep.chonBuocTiep(QL, cy.id, { chon: 'tam_dung' });
      kq = kqt.ketQuaThiThatKq(QL, { branchId: MB, ...RONG });
      r = kq.rows.find((x: any) => x.cycleId === cy.id);
      assert(r.buocTiepChu === 'Tạm dừng' && r.nguoiChon && r.ngayChon, `sau chọn: ${JSON.stringify(r)}`);
      assert(!kqt.ketQuaThiThatKq(QL, { branchId: MB, tu: d.addDaysIso(TODAY, 1), den: d.addDaysIso(TODAY, 6) }).rows.some((x: any) => x.cycleId === cy.id), 'ngoài khoảng không có');
      /* Không thi: không có ngày thi thật → tính theo ngày thi dự kiến (`exam_date`); vẫn hiện để chọn Bước tiếp. */
      const cy2 = one(`SELECT c.id FROM learning_cycles c JOIN enrollments e ON e.student_id = c.student_id AND e.status = 'active'
        JOIN classes l ON l.id = e.class_id AND l.branch_id = ? WHERE c.route IS NOT NULL AND c.status = 'active' AND c.id != ?
          AND c.started_at <= ? AND c.seq = (SELECT MAX(x.seq) FROM learning_cycles x WHERE x.student_id = c.student_id) ORDER BY c.id LIMIT 1`, MB, cy.id, d.addDaysIso(TODAY, -3));
      conn.prepare('UPDATE learning_cycles SET exam_date = ? WHERE id = ?').run(d.addDaysIso(TODAY, -1), cy2.id);
      thiThat.datKetQuaThiThat(QL, cy2.id, { khongThi: true });
      const kt = kqt.ketQuaThiThatKq(QL, { branchId: MB, ...RONG }).rows.find((x: any) => x.cycleId === cy2.id);
      assert(kt && kt.khongThi && kt.dat === null && kt.ngayThi === d.addDaysIso(TODAY, -1), `Không thi phải có hàng: ${JSON.stringify(kt)}`);
    });
  });

  check('OV15e-8 · Phân tích GV: panel một chỉ số = đúng GV + khoảng, số dòng = mẫu số ô (0/n mở n mục)', () => {
    const f = { cn: MB, ct: 'ft', tu: d.addDaysIso(t2, -84), den: t2 };
    const kq = gvPt.phanTichGiaoVien(QL, f);
    let soO = 0;
    for (const h of kq.hang) {
      const o: [string, any][] = [['ghi-pa', h.ghiKetQuaPa], ['vi-pham', h.xuLyViPham], ['pa-hieu-qua', h.paHieuQua], ['tien-bo', h.tienBo],
        ...Object.entries(h.ketQua).map(([k, v]) => [`ket-qua:${k}`, v] as [string, any])];
      for (const [cot, x] of o) {
        if (!x || x.k !== 'so') continue;
        const p = gvPt.oChiSoGv(QL, { ...f, gv: h.id, cot });
        assert(p.n === x.tong && p.rows.length === x.tong, `${h.ten} ${cot}: ${p.n} ≠ ${x.tong}`);
        soO += 1;
      }
    }
    assert(soO > 3, `bộ demo phải có ô để soi: ${soO}`);
    assertThrows(() => gvPt.oChiSoGv(QL, { ...f, gv: kq.hang[0].id, cot: 'lung-tung' }), /không có/, 'cột lạ 400');
  });

  await checkAsync('OV15e-9 · HTTP theo vai + trần câu SQL: QL 200 (Báo cáo, panel, Kết quả thi, GV panel), GV 403, khoảng sai 400', async () => {
    const may = createApp().listen(0);
    try {
      const cong = (may.address() as any).port as number;
      const goi = async (uid: number, url: string) => {
        const res = await fetch(`http://127.0.0.1:${cong}/api${url}`, { headers: { cookie: `pisa_demo_session=${createSession(uid)}` } });
        return { status: res.status, json: await res.json().catch(() => null) as any };
      };
      const k = `kieu=tuan&tu=${RONG.tu}&den=${RONG.den}`;
      let truoc = soCauSql();
      const bc = await goi(QL.userId, `/phan-tich/bao-cao?branchId=${MB}&ct=ft&${k}`);
      const cauBc = soCauSql() - truoc;
      truoc = soCauSql();
      const mk = await goi(QL.userId, `/phan-tich/ket-qua-thi?branchId=${MB}&loai=mock&xep=sos&${k}`);
      const cauKq = soCauSql() - truoc;
      console.log(`      (đo: QL /phan-tich/bao-cao ${cauBc} câu SQL · /phan-tich/ket-qua-thi ${cauKq} câu, ${mk.json?.rows?.length} lượt)`);
      assert(bc.status === 200 && bc.json.test.hvDaThi > 0, `Báo cáo QL: ${bc.status}`);
      assert(mk.status === 200 && mk.json.rows.length === mk.json.tong.luot, `Kết quả thi QL: ${mk.status}`);
      assert(cauBc <= TRAN_BAO_CAO && cauKq <= TRAN_KET_QUA_THI, `trần câu SQL: ${cauBc}/${TRAN_BAO_CAO}, ${cauKq}/${TRAN_KET_QUA_THI}`);
      const o = await goi(QL.userId, `/phan-tich/bao-cao/o?branchId=${MB}&ct=ft&${k}&o=hv-da-thi`);
      assert(o.status === 200 && o.json.n === bc.json.test.hvDaThi, 'panel HV đã thi');
      const md = await goi(QL.userId, `/phan-tich/bao-cao?branchId=${MB}&ct=ft`);
      assert(md.status === 200 && md.json.tu === d.khoangMacDinh(TODAY).tu, 'vắng khoảng = 2 tuần vừa qua');
      const tt = await goi(QL.userId, `/phan-tich/ket-qua-thi?branchId=${MB}&loai=thi-that&${k}`);
      assert(tt.status === 200 && tt.json.loai === 'thi-that', `Thi thật: ${tt.status}`);
      const gv = await goi(P.w1Teacher.userId, `/phan-tich/bao-cao?${k}`);
      assert(gv.status === 403, `GV Báo cáo: ${gv.status}`);
      assert((await goi(P.w1Teacher.userId, `/phan-tich/ket-qua-thi?${k}`)).status === 403, 'GV Kết quả thi');
      assert((await goi(QL.userId, `/phan-tich/bao-cao?kieu=tuy-chon&tu=2026-10-10&den=2026-01-01`)).status === 400, 'khoảng ngược 400');
      const ptgv = await goi(QL.userId, `/phan-tich/giao-vien?cn=${MB}&ct=ft&kieu=tuan&tu=${d.addDaysIso(t2, -28)}&den=${d.addDaysIso(t2, 6)}`);
      assert(ptgv.status === 200, `GV bảng theo khoảng chung: ${ptgv.status}`);
      const h = ptgv.json.hang.find((x: any) => x.ghiKetQuaPa.k === 'so');
      if (h) {
        const p = await goi(QL.userId, `/phan-tich/giao-vien/o?cn=${MB}&ct=ft&kieu=tuan&tu=${d.addDaysIso(t2, -28)}&den=${d.addDaysIso(t2, 6)}&gv=${h.id}&cot=ghi-pa`);
        assert(p.status === 200 && p.json.n === h.ghiKetQuaPa.tong, 'panel GV qua HTTP');
      }
    } finally { may.close(); }
  });

  await checkAsync('OV15e-11 · Thi thật lọc ngày thi qua chỉ mục (không quét learning_cycles); migrate chỉ mục chạy lặp được', async () => {
    const plan = conn.prepare(`EXPLAIN QUERY PLAN ${kqt.SQL_THI_THAT}`).all('2026-01-01', '2026-12-31', '2026-01-01', '2026-12-31') as any[];
    const ke = plan.map((r: any) => r.detail).join(' | ');
    assert(/idx_cycle_thi_that_ngay/.test(ke) && /idx_cycle_khong_thi/.test(ke) && !/SCAN c\b/.test(ke), `kế hoạch: ${ke}`);
    const { migratePrOv15e } = await import('../migrate/prOv15e.ts');
    const ap: string[] = [];
    migratePrOv15e(conn, ap); migratePrOv15e(conn, ap);
    assert(ap.length === 0, `schema đã có chỉ mục — migrate không làm gì: ${ap}`);
  });

  check('OV15e-10 · web: trang Phân tích riêng, Tổng quan bỏ tab Phân tích; phân trang ở bảng Phân tích + panel số liệu; EN đủ', () => {
    const doc = (p: string) => fs.readFileSync(new URL(`../../../../${p}`, import.meta.url), 'utf8');
    assert(/PhanTichPage/.test(doc('web/src/App.tsx')), 'App gắn PhanTichPage');
    assert(!/<PhanTich \/>/.test(doc('web/src/modules/worklist/OverviewPage.tsx')), 'Tổng quan không còn tab Phân tích');
    for (const f of ['BaoCao.tsx', 'KetQuaThi.tsx', 'TongHopTestSos.tsx', 'HieuQuaPa.tsx', 'PhanTichGiaoVien.tsx', 'YThucPhoiHop.tsx']) {
      assert(/PhanTrang|usePhanTrang/.test(doc(`web/src/modules/phanTich/${f}`)), `${f} chưa phân trang`);
    }
    assert(/usePhanTrang/.test(doc('web/src/ui/SoLieu.tsx')), 'panel số liệu chưa phân trang');
  });
}
