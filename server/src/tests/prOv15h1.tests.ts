/**
 * PHÉP KIỂM OV-15h1 (kế hoạch 2026-10-20-ov15g-ov15h.md mục OV-15h1) — Công việc + Tổng quan QL:
 *  · Tổng quan QL phần theo khung MỘT đường `tongQuanQl` (thay 3 GET; Cần bạn quyết giữ đường riêng): mỗi phần trùng khít đường cũ chạy riêng (số không đổi), cột mới của Lớp cần chú ý cộng đúng,
 *    Trễ chấm theo GV = cột "Bài quá hạn" bảng GV, phân rã Case chưa chốt PA cộng đúng tổng;
 *  · Cần bạn quyết chỉ lấy việc hạn ≤ 7 ngày (cùng ngưỡng thông báo);
 *  · thông báo tự động ghi MỘT câu cho cả lô, không reset đã đọc; ghi xong (POST) thì lần mở chuông kế đồng bộ lại ngay;
 *  · Chờ bạn duyệt theo chi nhánh đang lọc.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv15h1Tests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY } = t as any;
  const { chayTrongRequest, xoaNho } = await import('../platform/nguCanhRequest.ts');
  const tq: any = await import('../worklist/tongQuan.ts');
  const tqQl: any = await import('../worklist/tongQuanQl.ts');
  const bang: any = await import('../worklist/bangChiNhanh.ts');
  const hl: any = await import('../worklist/highlights.ts');
  const m: any = await import('../worklist/metrics.ts');
  const gv: any = await import('../giaoVien/hoSo.ts');
  const td: any = await import('../platform/thongBaoTuDong.ts');
  const yc: any = await import('../duyet/yeuCau.ts');
  const util: any = await import('../util.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nOV-15h1 · Tổng quan QL một đường, Lớp cần chú ý, Trễ chấm, Cần bạn quyết ≤ 7 ngày, thông báo theo lô, Chờ bạn duyệt theo chi nhánh');

  const MB = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id as number;
  const GET = <T>(fn: () => T): T => { xoaNho(); try { return chayTrongRequest('GET', () => JSON.parse(JSON.stringify(fn()))); } finally { xoaNho(); } };
  const bo = (o: any, keys: string[]) => JSON.parse(JSON.stringify(o, (k, v) => (keys.includes(k) ? undefined : v)));
  const r1 = (fn: () => unknown) => { try { GET(fn); return 200; } catch (e: any) { return e?.status ?? 500; } };
  const MOI = ['chuaLich', 'chuaDiem', 'sos1', 'sos2', 'sos3', 'daThiChoKq'];
  const vai: [string, any, number | null][] = [['QL', P.mbManager, null], ['QL·MB', P.mbManager, MB], ['QT', P.admin, null], ['QT·MB', P.admin, MB]];

  check('H1-1 · /tong-quan/ql một request = các đường cũ chạy riêng: Lớp cần chú ý (cột cũ) · Lịch — từng số giữ nguyên; Trễ chấm thay /giao-vien (H1-3)', () => {
    for (const ct of ['ft', 'thuong']) {
      for (const [ten, p, cn] of vai) {
        const moi = GET(() => tqQl.tongQuanQl(p, { branchId: cn, ct }));
        const cu = {
          bang: GET(() => bang.bangChiNhanh(p, { branchId: cn, ct })),
          lich: GET(() => hl.highlights(p, { branchId: cn, program: ct })),
        };
        /* Cột cũ từng hàng trùng đường cũ; hàng chỉ bảng chú ý có (lớp / "Lớp đã kết thúc" chỉ vì cột mới) thì cột cũ đều 0. */
        const phang = (b: any) => new Map([...b.hang.flatMap((h: any) => [h, ...(h.lop ?? [])]), ...(b.conLai ? [b.conLai] : []), { khoa: 'tong', o: b.tong }]
          .map((h: any) => [h.khoa, JSON.stringify(bo(h.o, MOI))]));
        const a = phang(cu.bang), b2 = phang(moi.bang);
        const rong = JSON.stringify(bo(Object.fromEntries(Object.keys(cu.bang.tong).map((k) => [k, k === 'duDuLieu' ? { n: 0, mau: 0 } : { n: 0 }])), MOI));
        for (const [k, v] of a) assert(b2.get(k) === v, `${ten} ${ct}: hàng ${k} khác đường cũ`);
        for (const [k, v] of b2) assert(a.has(k) || v === rong, `${ten} ${ct}: hàng ${k} chỉ ở bảng chú ý mà cột cũ khác 0: ${v}`);
        assert(JSON.stringify(moi.lich) === JSON.stringify(cu.lich), `${ten} ${ct}: Tuần này khác /highlights`);
      }
    }
  });

  check('H1-2 · Lớp cần chú ý: SOS 1 + 2 + 3 = SOS hiện tại mỗi hàng; Chưa lịch · Chưa điểm hàng tổng = chỉ số; GVCN mỗi lớp; phân rã Case chưa chốt PA cộng đúng tổng', () => {
    for (const ct of ['ft', 'thuong']) {
      const r = GET(() => tqQl.tongQuanQl(P.mbManager, { branchId: MB, ct }));
      const hang = [...r.bang.hang, r.bang.tong ? { nhan: 'tong', o: r.bang.tong } : null].filter(Boolean) as any[];
      for (const h of hang) assert(h.o.sos1.n + h.o.sos2.n + h.o.sos3.n === h.o.sos.n, `${ct} ${h.nhan}: SOS 1/2/3 ≠ SOS hiện tại`);
      const chuaLich = GET(() => m.metricSet(P.mbManager, 'hv-ft-xong-mt-cuoi-chua-mt-ke', { branchId: MB, program: ct }).n);
      assert(r.bang.tong.chuaLich.n === (ct === 'ft' ? chuaLich : 0), `${ct}: Chưa lịch tổng ${r.bang.tong.chuaLich.n} ≠ chỉ số ${chuaLich}`);
      const bai = GET(() => m.metricSet(P.mbManager, 'bai-qua-han-nhap-diem', { branchId: MB, program: ct }).ids) as number[];
      const hv = new Set(bai.length ? (conn.prepare(`SELECT student_id FROM assessment_attempts WHERE id IN (${[...new Set(bai.map((b) => d.tachBaiId(b).attemptId))].join(',')})`).all() as any[]).map((x) => x.student_id) : []);
      assert(r.bang.tong.chuaDiem.n === hv.size, `${ct}: Chưa điểm tổng ${r.bang.tong.chuaDiem.n} ≠ HV có bài quá hạn ${hv.size}`);
      assert(r.bang.hang.every((h: any) => 'gvcn' in h), `${ct}: hàng lớp phải có GVCN`);
      const pr = r.bang.phanRa as Record<string, number>;
      assert(pr && Object.values(pr).reduce((s, n) => s + n, 0) === r.bang.tong.caseChuaChot.n, `${ct}: phân rã ${JSON.stringify(pr)} ≠ ${r.bang.tong.caseChuaChot.n}`);
    }
  });

  check('H1-3 · Trễ chấm theo GV: Σ bài = "bài trễ chấm"; số mỗi GV = cột "Bài quá hạn" bảng GV; panel một GV ra đúng số dòng', () => {
    for (const ct of ['ft', 'thuong']) {
      const r = GET(() => tqQl.tongQuanQl(P.mbManager, { branchId: MB, ct }));
      const n = GET(() => m.metricSet(P.mbManager, 'bai-qua-han-nhap-diem', { branchId: MB, program: ct }).n);
      /* Bài hai người chấm có ở cả hai hàng — hợp các panel = đúng tập "bài trễ chấm". */
      const hop = new Set(r.tre.flatMap((x: any) => GET(() => tqQl.oTreCham(P.mbManager, { branchId: MB, ct, gv: x.khoa })).rows.map((y: any) => y.id)));
      assert(hop.size === n, `${ct}: hợp bài Trễ chấm ${hop.size} ≠ ${n}`);
      const bg = GET(() => gv.bangGvChiNhanh(P.mbManager, { cn: MB, ct }));
      for (const x of r.tre.filter((y: any) => y.khoa > 0)) {
        const h = bg.hang.find((y: any) => y.id === x.khoa);
        assert(h && h.quaHan === x.bai, `${ct} ${x.ten}: Trễ chấm ${x.bai} ≠ bảng GV ${h?.quaHan}`);
        assert(x.lop.reduce((s: number, l: any) => s + l.n, 0) === x.bai, `${ct} ${x.ten}: Σ lớp ≠ số bài`);
      }
      const dau = r.tre[0];
      if (dau) {
        const o = GET(() => tqQl.oTreCham(P.mbManager, { branchId: MB, ct, gv: dau.khoa }));
        assert(o.n === dau.bai && o.rows.length === dau.bai, `${ct}: panel ${o.n}/${o.rows.length} ≠ ${dau.bai}`);
      }
    }
    assert(r1(() => tqQl.tongQuanQl(P.coreTeacher, { branchId: null, ct: 'ft' })) === 403, 'GV không xem được Tổng quan QL');
  });

  check('H1-4 · Cần bạn quyết: Chọn bước tiếp + Chốt lộ trình chỉ việc hạn ≤ 7 ngày (cùng ngưỡng thông báo `CHOT_TOI_HAN_NGAY`)', () => {
    assert(td.CHOT_TOI_HAN_NGAY === 7, 'ngưỡng 7 ngày');
    const moc = util.addDays(TODAY, td.CHOT_TOI_HAN_NGAY);
    for (const p of [P.mbManager, P.admin]) {
      const r = GET(() => tq.tongQuanQuanLy(p, { branchId: null }));
      assert(r.canQuyet.sauThi.every((x: any) => !!x.due && x.due <= moc), `còn việc hạn > 7 ngày: ${r.canQuyet.sauThi.filter((x: any) => !x.due || x.due > moc).map((x: any) => x.key).join(', ')}`);
    }
  });

  check('H1-5 · thông báo tự động ghi MỘT câu cho cả lô; đổi chữ không reset đã đọc; ghi (POST) xong thì lần mở chuông kế đồng bộ ngay', () => {
    const nguoi = [P.w1Teacher, P.w2Teacher, P.lrTeacher, P.coreTeacher, P.subjectTeacher, P.sTeacher, P.mbManager];
    conn.exec('BEGIN IMMEDIATE');
    const goc = conn.prepare;
    let ghi = 0;
    try {
      xoaNho();
      conn.prepare = function (this: any, sql: string) { if (/^\s*(INSERT|UPDATE|DELETE)[^;]*notifications/i.test(sql)) ghi += 1; return goc.call(this, sql); };
      const p = nguoi.find((x) => { conn.prepare(`DELETE FROM notifications WHERE user_id = ? AND kind IN ('cham_qua_han', 'case_chua_chot_pa', 'chot_lo_trinh')`).run(x.userId); ghi = 0; return td.dongBoThongBaoTuDong(x, TODAY) >= 2; });
      assert(p, 'dữ liệu demo: phải có người có ≥ 2 thông báo tự động');
      assert(ghi === 1, `ghi ${ghi} câu cho cả lô (phải 1)`);
      const mot = conn.prepare(`SELECT id, dedup_key FROM notifications WHERE user_id = ? AND kind IN ('cham_qua_han', 'case_chua_chot_pa', 'chot_lo_trinh') ORDER BY id LIMIT 1`).get(p.userId) as any;
      conn.prepare(`UPDATE notifications SET read_at = ?, title = 'chữ cũ' WHERE id = ?`).run(TODAY, mot.id);
      ghi = 0;
      td.dongBoThongBaoTuDong(p, TODAY);
      const sau = conn.prepare('SELECT id, read_at, title FROM notifications WHERE id = ?').get(mot.id) as any;
      assert(sau && sau.title !== 'chữ cũ' && sau.read_at === TODAY, `đổi chữ phải giữ đã đọc: ${JSON.stringify(sau)}`);
      assert(ghi === 1, `sửa một thông báo: ${ghi} câu`);
      ghi = 0;
      td.dongBoThongBaoTuDong(p, TODAY);
      assert(ghi === 0, `không đổi gì thì không ghi (${ghi} câu)`);
      /* Chu kỳ 5 phút: mở chuông lần hai không đồng bộ — trừ khi người đó vừa ghi. */
      td.dongBoKhiMoChuong(p, TODAY);
      conn.prepare(`INSERT INTO notifications (user_id, kind, title, dedup_key, created_at) VALUES (?, 'cham_qua_han', 'việc đã xong', 'tudong:cham:0:0:0', ?)`).run(p.userId, TODAY);
      td.dongBoKhiMoChuong(p, TODAY);
      const con = () => !!conn.prepare(`SELECT 1 FROM notifications WHERE user_id = ? AND dedup_key = 'tudong:cham:0:0:0'`).get(p.userId);
      assert(con(), 'trong chu kỳ 5 phút, không ghi gì: chưa đồng bộ lại');
      td.daGhi(p.userId);
      td.dongBoKhiMoChuong(p, TODAY);
      assert(!con(), 'vừa ghi xong: lần mở chuông kế đồng bộ ngay, thông báo của việc đã xong hết');
    } finally { conn.prepare = goc; conn.exec('ROLLBACK'); xoaNho(); }
  });

  check('H1-7 · panel Trễ chấm: GV gọi → 403; xoá thông báo hết việc chia lô ≤ 900 tham số (Turso)', () => {
    assert(r1(() => tqQl.oTreCham(P.coreTeacher, { branchId: null, ct: 'ft', gv: 0 })) === 403, 'GV mở panel Trễ chấm phải 403');
    const p = P.w1Teacher;
    conn.exec('BEGIN IMMEDIATE');
    const goc = conn.prepare;
    let xoa = 0;
    try {
      xoaNho();
      const chen = conn.prepare(`INSERT INTO notifications (user_id, kind, title, dedup_key, created_at) VALUES (?, 'cham_qua_han', 'cũ', ?, ?)`);
      for (let i = 0; i < 950; i++) chen.run(p.userId, `tudong:cham:cu:${i}`, TODAY);
      conn.prepare = function (this: any, sql: string) { if (/^\s*DELETE FROM notifications/i.test(sql)) xoa += 1; return goc.call(this, sql); };
      td.dongBoThongBaoTuDong(p, TODAY);
      conn.prepare = goc;
      const con = (conn.prepare(`SELECT COUNT(*) n FROM notifications WHERE user_id = ? AND dedup_key LIKE 'tudong:cham:cu:%'`).get(p.userId) as any).n;
      assert(con === 0 && xoa === 2, `còn ${con} thông báo cũ, ${xoa} câu DELETE (phải 0 · 2)`);
    } finally { conn.prepare = goc; conn.exec('ROLLBACK'); xoaNho(); }
  });

  check('H1-6 · Chờ bạn duyệt theo chi nhánh: đếm chi nhánh = số thẻ hộp lọc chi nhánh đó; Σ chi nhánh = không lọc', () => {
    const ds = (conn.prepare(`SELECT DISTINCT chi_nhanh_id AS id FROM yeu_cau_duyet WHERE trang_thai = 'cho'`).all() as any[]).map((x) => x.id);
    const tong = GET(() => yc.demYeuCau(P.admin)).cho;
    let sum = 0;
    for (const cn of ds.filter((x: any) => x)) {
      const hop = GET(() => yc.hopChoDuyet(P.admin, { branchId: cn, xem: 'cho' }));
      const n = GET(() => yc.demYeuCau(P.admin, { branchId: cn })).cho;
      assert(n === hop.the.length, `chi nhánh ${cn}: đếm ${n} ≠ hộp ${hop.the.length}`);
      sum += n;
    }
    assert(sum <= tong && ds.length > 0, `Σ chi nhánh ${sum} > tổng ${tong}`);
  });

}
