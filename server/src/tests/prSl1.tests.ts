/**
 * PHÉP KIỂM SL1 (kế hoạch `docs/superpowers/plans/2026-10-21-pr-sl1.md`) — số liệu đúng + chuông N1:
 * khoảng tháng (A5-01) · PA có kết quả trong kỳ (A7-02) · Chờ duyệt theo chi nhánh (A7-01) · khoá panel số (A1-01) · đầu nhóm trước khi chia trang
 * (A3-02, A7-09) · panel việc chỉ em của việc (CV-01) · lượt mở sẵn theo ô quá hạn (V2B-3) · dải Lịch thi (V2A-06) · phạm vi xuất (V3B-07) · chuông N1.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrSl1Tests(t: YThucTestKit) {
  const { check, checkAsync, assert, conn, TODAY, P } = t as any;
  const d: any = await import('../../../shared/domain/index.ts');
  const { createApp } = await import('../app.ts');
  const { createSession } = await import('../auth.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const await_metrics: any = await import('../worklist/metrics.ts');
  const await_hq: any = await import('../phanTich/hieuQuaPa.ts');
  const await_cases: any = await import('../cases/cases.ts');
  const await_tb: any = await import('../platform/thongBao.ts');
  console.log('\nSL1 · số liệu đúng + chuông N1');
  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const MB = one(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const thu = (fn: () => void) => { conn.exec('BEGIN IMMEDIATE'); try { xoaNho(); fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); } };

  const may = createApp().listen(0);
  const cong = (may.address() as any).port as number;
  const goi = async (uid: number, url: string, init?: { method?: string; body?: unknown }) => {
    xoaNho();
    const res = await fetch(`http://127.0.0.1:${cong}/api${url}`, {
      method: init?.method ?? 'GET',
      headers: { cookie: `pisa_demo_session=${createSession(uid)}`, ...(init?.body ? { 'content-type': 'application/json' } : {}) },
      body: init?.body ? JSON.stringify(init.body) : undefined,
    });
    return { status: res.status, json: await res.json().catch(() => null) as any };
  };
  try {
    check('SL1-1 · khoảng tháng: 12 tháng 2026 đọc lại đúng tháng (link `kieu=thang&tu&den`), hộp tuần chuẩn về Thứ Hai → CN', () => {
      for (let m = 1; m <= 12; m++) {
        const thang = `2026-${String(m).padStart(2, '0')}`;
        const k = d.khoangThang(thang);
        const doc = d.khoangTuUrl(new URLSearchParams(`kieu=thang&tu=${k.tu}&den=${k.den}`), TODAY);
        assert(doc.kieu === 'thang' && doc.tu === k.tu && doc.den === k.den, `${thang}: ${JSON.stringify(doc)} ≠ ${JSON.stringify(k)}`);
        assert(d.nhanKhoang(doc).chinh === `${thang.slice(5)}/2026`, `${thang}: nhãn ${d.nhanKhoang(doc).chinh}`);
      }
      assert(d.khoangTuUrl(new URLSearchParams('thang=2026-09'), TODAY).tu === '2026-08-31', 'link `thang=` cũ giữ');
      const md = d.khoangMacDinh(TODAY);
      assert(d.khoangVeTuan(md, TODAY).kieu === '2-tuan', 'trùng mặc định → 2 tuần vừa qua (URL trống)');
      const tc = d.khoangVeTuan({ tu: '2026-09-03', den: '2026-10-13' }, TODAY);
      assert(tc.kieu === 'tuan' && tc.tu === '2026-08-31' && tc.den === '2026-10-18', `Tùy chọn cũ → tuần: ${JSON.stringify(tc)}`);
    });

    await checkAsync('SL1-1b · máy chủ đọc `kieu=thang` đúng tháng (Báo cáo 09/2026 = 31/08 – 27/09, không phải 08/2026)', async () => {
      const r = await goi(P.mbManager.userId, `/phan-tich/bao-cao?branchId=${MB}&ct=ft&kieu=thang&tu=2026-08-31&den=2026-09-27`);
      assert(r.status === 200 && r.json.tu === '2026-08-31' && r.json.den === '2026-09-27', `${r.status} ${r.json?.tu} – ${r.json?.den}`);
    });

    check('SL1-2 · "PA có kết quả trong kỳ" theo kỳ: tháng 01/2026 = 0; khoảng rộng = tập Hiệu quả PA (paCoKetQua) cùng chi nhánh + khung', () => {
      const metrics: any = await_metrics;
      const hq: any = await_hq;
      const qt = P.admin;
      const t2 = d.mondayOfDate(TODAY);
      const tu = d.addDaysIso(t2, -7 * 25), den = d.addDaysIso(t2, 6);
      const ky = metrics.metricSet(qt, 'pa-co-ket-qua', { branchId: MB, program: 'ft', from: tu, to: den });
      const pa = hq.paCoKetQua({ branchIds: [MB], ct: 'ft', tu: d.mondayOfDate(tu), den: d.mondayOfDate(den) });
      /* Cùng kỳ → Báo cáo ⊆ Hiệu quả PA. Khung (FT / thường) của PA: Báo cáo theo lớp HIỆN TẠI của em, Hiệu quả PA theo nơi em học LÚC làm PA (F03) —
         em đổi lớp thì lệch; trên bộ demo vừa dựng hai tập bằng nhau. ponytail: một luật khung cho mọi số là SL2 (một phạm vi một trang). */
      const b = new Set(pa.map((x: any) => x.id));
      const lech = pa.length - ky.ids.length;
      assert(pa.length > 0 && ky.ids.every((x: number) => b.has(x)), `Báo cáo có PA ngoài Hiệu quả PA: ${ky.ids.filter((x: number) => !b.has(x))}`);
      if (lech) console.log(`      (đo: ${lech} PA lệch khung do em đổi lớp — SL2)`);
      const jan = metrics.metricSet(qt, 'pa-co-ket-qua', { branchId: MB, program: 'ft', from: '2026-01-05', to: '2026-01-18' });
      assert(jan.n === 0, `01/2026 phải 0, được ${jan.n}`);
      const hep = metrics.metricSet(qt, 'pa-co-ket-qua', { branchId: MB, program: 'ft', from: d.addDaysIso(t2, -14), to: d.addDaysIso(t2, -1) });
      assert(hep.n <= ky.n, 'khoảng hẹp không nhiều hơn khoảng rộng');
    });

    await checkAsync('SL1-3 · Chờ duyệt theo chi nhánh: số thẻ = dải Tổng quan = /yeu-cau/dem; `khacChiNhanh` = phần còn lại', async () => {
      const qt = P.admin.userId;
      const tat = await goi(qt, '/yeu-cau?hop=cho-duyet');
      const cn = await goi(qt, `/yeu-cau?hop=cho-duyet&branchId=${MB}`);
      const dem = await goi(qt, `/yeu-cau/dem?branchId=${MB}`);
      assert(cn.status === 200 && cn.json.the.length === dem.json.cho, `thẻ ${cn.json?.the?.length} ≠ đếm ${dem.json?.cho}`);
      assert(cn.json.the.every((x: any) => tat.json.the.some((y: any) => y.id === x.id)), 'thẻ chi nhánh ⊂ mọi chi nhánh');
      assert(cn.json.khacChiNhanh === tat.json.the.length - cn.json.the.length, `khác chi nhánh ${cn.json.khacChiNhanh} ≠ ${tat.json.the.length} − ${cn.json.the.length}`);
      assert(!tat.json.khacChiNhanh, 'không lọc chi nhánh → không có dòng "chi nhánh khác"');
    });

    check('SL1-4 · khoá panel số: cùng nguồn khác vùng (dải / hàng tổng) → khác khoá; không vùng = khoá cũ', () => {
      const nguon = '/tong-quan/chi-nhanh/o?cot=chuaDiem&khoa=tong&chuY=1';
      assert(d.khoaSoLieu({ nguon }) === `nguon:${nguon}`, 'khoá cũ giữ (link đã lưu)');
      assert(d.khoaSoLieu({ nguon, vung: 'dai' }) !== d.khoaSoLieu({ nguon }), 'dải và hàng tổng không chung khoá');
      assert(d.khoaSoLieu({ id: 'bai-qua-han-nhap-diem', vung: 'dai' }) !== d.khoaSoLieu({ id: 'bai-qua-han-nhap-diem' }), 'chỉ số trong sổ cũng tách vùng');
      assert(d.khoaSoLieu({ id: 'x', extra: { a: '1' } }) === 'x|a=1', 'extra như cũ');
    });

    check('SL1-5 · đầu nhóm đếm trên toàn bộ trước khi chia trang: 10 / trang hay 50 / trang cùng số; nhóm nối trang ghi "tiếp"', () => {
      const dong = [...Array.from({ length: 15 }, (_, i) => ({ lop: 'A', i })), ...Array.from({ length: 8 }, (_, i) => ({ lop: 'B', i }))];
      const trang = (so: number, co: number) => { const c = d.catTrang(dong.length, so, co); return dong.slice(c.dau, c.cuoi); };
      const t1 = d.nhomTrenTrang(dong, trang(1, 10), (x: any) => x.lop);
      const t2 = d.nhomTrenTrang(dong, trang(2, 10), (x: any) => x.lop);
      const t50 = d.nhomTrenTrang(dong, trang(1, 50), (x: any) => x.lop);
      assert(t1.get('A').tatCa.length === 15 && !t1.get('A').tiep && !t1.has('B'), 'trang 1: A đủ 15, chưa có B');
      assert(t2.get('A').tatCa.length === 15 && t2.get('A').tiep && t2.get('B').tatCa.length === 8 && !t2.get('B').tiep, 'trang 2: A (tiếp) 15, B 8');
      assert(t50.get('A').tatCa.length === t1.get('A').tatCa.length, 'cỡ trang không đổi số đầu nhóm');
    });

    await checkAsync('SL1-6 · panel Nhập điểm của việc theo tuần chỉ hiện em của việc: số hàng = số em trên dòng việc, không lượt MT cũ ngoài việc', async () => {
      const mywork: any = await import('../worklist/mywork.ts');
      const gv = [P.w1Teacher, P.w2Teacher, P.lrTeacher, P.sTeacher, P.coreTeacher, P.subjectTeacher].filter(Boolean);
      const viec: any[] = [];
      for (const p of gv) {
        for (const x of (mywork.myWork(p, { chiNhom: new Set(['score']) }).items ?? []) as any[]) {
          for (const c of (x.con?.length ? x.con : [x])) if (c.group === 'score' && c.periodId && c.classId && (c.emIds?.length || c.studentId)) viec.push({ p, c });
        }
      }
      assert(viec.length > 0, 'bộ demo phải có việc nhập điểm theo tuần');
      let thua = 0;
      for (const { p, c } of viec.slice(0, 12)) {
        const r = await goi(p.userId, `/classes/${c.classId}/cham?periodId=${c.periodId}${c.kind ? `&kind=${c.kind}` : ''}`);
        const rows = (r.json?.ft?.rows ?? r.json?.thuong?.rows ?? []) as any[];
        const em = d.emCuaViec(c);
        const hien = d.attemptCuaEm(rows, em);
        assert(new Set(rows.filter((x: any) => hien.has(x.attemptId)).map((x: any) => x.studentId)).size === c.count, `${c.key}: ${hien.size} hàng ≠ ${c.count} em`);
        if (rows.length > hien.size) thua++;
      }
      console.log(`      (đo: ${viec.length} việc theo tuần, ${thua} việc trước đây hiện thêm em ngoài việc)`);
    });

    check('SL1-7a · lượt mở sẵn: lượt có ô quá hạn của người xem (hạn sớm nhất) thắng lượt tuần này; không quá hạn → luật cũ', () => {
      const l = (ma: string, tuanStart: string | null, oTrong: number, quaHan: string | null = null) => ({ ma, nhan: ma, tuanStart, lichSu: false, duDiem: 0, coLich: 5, oTrong, quaHan });
      const ds = [l('mt:1', '2026-07-06', 4, '2026-07-15'), l('mt:2', '2026-08-03', 2, '2026-08-12'), l('mt:3', d.mondayOfDate(TODAY), 30)];
      assert(d.luotMacDinh(ds, TODAY) === 'mt:1', `quá hạn sớm nhất: ${d.luotMacDinh(ds, TODAY)}`);
      assert(d.luotMacDinh(ds.map((x: any) => ({ ...x, quaHan: null })), TODAY) === 'mt:3', 'không quá hạn → lượt tuần này (DL-6b)');
    });

    await checkAsync('SL1-7b · GV mở Điểm theo lớp: lượt mặc định chứa ô quá hạn của chính GV (nếu có)', async () => {
      const no: any = await import('../worklist/scoreDebt.ts');
      let soLop = 0;
      for (const p of [P.w1Teacher, P.w2Teacher, P.lrTeacher, P.sTeacher]) {
        const lop = [...new Set((no.scoreDebtCells(p, TODAY, null) as any[]).filter((c) => c.overdue && c.userId === p.userId).map((c) => c.classId))];
        for (const cid of lop.slice(0, 2)) {
          const r = await goi(p.userId, `/classes/${cid}/diem-theo-luot`);
          assert(r.status === 200, `diem-theo-luot ${r.status}`);
          const co = (r.json.luot as any[]).filter((x) => x.quaHan);
          assert(co.length > 0, `lớp ${cid}: có ô quá hạn của GV mà không lượt nào ghi quaHan`);
          const sớm = co.reduce((m, x) => (x.quaHan < m.quaHan ? x : m));
          assert(r.json.macDinh === sớm.ma, `lớp ${cid}: mặc định ${r.json.macDinh} ≠ lượt quá hạn sớm nhất ${sớm.ma}`);
          soLop++;
        }
      }
      assert(soLop > 0, 'bộ demo phải có GV có ô quá hạn');
    });

    check('SL1-8 · dải Lịch thi: năm số cộng lại = số HV có dự kiến (em chưa có dự kiến + "Cần xác nhận" không vào số cần xác nhận)', () => {
      const rows = [
        { ketLuan: 'chot-ngay', chuaCoDuKien: false }, { ketLuan: 'can-xac-nhan', chuaCoDuKien: false }, { ketLuan: null, chuaCoDuKien: false },
        { ketLuan: 'can-xac-nhan', chuaCoDuKien: true }, { ketLuan: null, chuaCoDuKien: true, chuyenSang: '2026-12' },
      ];
      const dem = d.demKetLuan(rows);
      const coDuKien = rows.filter((r: any) => !r.chuaCoDuKien || r.chuyenSang).length;
      const tong = dem.chotNgay + dem.giuThang + dem.chuyenThang + dem.canXacNhan + dem.chuaRa;
      assert(tong === coDuKien && dem.canXacNhan === 1 && dem.chuaCoDuKien === 1, `${tong} ≠ ${coDuKien}: ${JSON.stringify(dem)}`);
    });

    await checkAsync('SL1-9 · Kế hoạch Test "Chỉ cần xếp lại": tệp chỉ em cần xếp lại (= Σ canXepLai các lớp); không cờ → mọi em như cũ', async () => {
      const kh: any = await import('../keHoach/keHoachTest.ts');
      const QL = P.mbManager;
      thu(() => {
        /* Dựng một em cần xếp lại: một kỹ năng bắt buộc của lượt MT đang chạy → vắng (không đề nghị chờ). */
        const k = one(`SELECT k.attempt_id, k.skill FROM attempt_skills k JOIN assessment_attempts a ON a.id = k.attempt_id
          JOIN classes c ON c.id = a.class_id JOIN enrollments e ON e.student_id = a.student_id AND e.class_id = a.class_id AND e.status = 'active'
          WHERE c.branch_id = ? AND a.status = 'planned' AND a.lich_su = 0 AND a.kind = 'mock' AND k.required = 1 AND k.sit_status NOT IN ('absent', 'cancelled') LIMIT 1`, MB);
        conn.prepare(`UPDATE attempt_skills SET sit_status = 'absent' WHERE attempt_id = ? AND skill = ?`).run(k.attempt_id, k.skill);
        const lop = (kh.danhSachLop(QL, { branchId: MB }).lop as any[]).filter((l) => l.loai === 'ft' && l.canXepLai > 0);
        assert(lop.length > 0, 'phải có lớp cần xếp lại');
        const ids = lop.map((l) => l.id);
        const chi = kh.xuatKeHoach(QL, { branchId: MB, classIds: ids, xemTruoc: true, chiXepLai: true });
        const het = kh.xuatKeHoach(QL, { branchId: MB, classIds: ids, xemTruoc: true });
        const tong = lop.reduce((n: number, l: any) => n + l.canXepLai, 0);
        assert(chi.dem.hocVien <= tong && chi.dem.hocVien > 0 && chi.dem.hocVien < het.dem.hocVien, `tệp xếp lại ${chi.dem.hocVien} em, Σ canXepLai ${tong}, cả lớp ${het.dem.hocVien}`);
      });
    });

    check('SL1-10a · chuông N1 (thuần): 3 loại tự động + Case giao vào Cần làm; "SOS n" của GVCN → Để biết; một Case một dòng; sắp theo hạn; số = Cần làm', () => {
      for (const k of ['cham_qua_han', 'case_chua_chot_pa', 'chot_lo_trinh', 'case_giao']) assert(d.nhomThongBao({ kind: k }) === 'can-lam', `${k} phải ở Cần làm`);
      assert(d.nhomThongBao({ kind: 'sos', entity_type: 'assessment_attempt' }) === 'de-biet', 'SOS-lượt (tin cho GVCN) → Để biết');
      assert(d.nhomThongBao({ kind: 'sos', entity_type: 'sos_case', con_viec: 1 }) === 'can-lam', 'Case SOS chờ xác nhận vẫn Cần làm');
      const r = (id: number, o: Record<string, unknown>) => ({ id, entity_type: 'class', entity_id: id, kind: 'cham_qua_han', read_at: null, han: null, ...o });
      const kq = d.dongChuong([
        r(1, { kind: 'sos', entity_type: 'sos_case', entity_id: 56, con_viec: 1, han: '2026-09-20' }),
        r(2, { kind: 'case_chua_chot_pa', entity_type: 'sos_case', entity_id: 56, han: '2026-09-10' }),
        r(3, { han: '2026-09-01', read_at: '2026-09-12T00:00:00Z', con_viec: 1 }),
        r(4, { kind: 'sos', entity_type: 'assessment_attempt' }),
        r(5, { kind: 'duyet_moi', entity_type: 'yeu_cau_duyet', con_viec: 0 }),
        r(6, { kind: 'chot_lo_trinh', han: null }),
      ]);
      assert(kq.canLam.map((x: any) => x.id).join(',') === '3,1,6', `Cần làm ${kq.canLam.map((x: any) => x.id)}`);
      assert(kq.deBiet.map((x: any) => x.id).sort().join(',') === '4,5', `Để biết ${kq.deBiet.map((x: any) => x.id)}`);
      assert(kq.soNut === 3, `số trên nút = Cần làm còn mở (kể cả đã đọc): ${kq.soNut}`);
    });

    await checkAsync('SL1-10b · chuông thật: GV — mọi "Quá hạn chấm" ở Cần làm, có hạn, sắp theo hạn, 0 dòng SOS-lượt; QL — "Chốt lộ trình" ở Cần làm', async () => {
      let soCham = 0;
      for (const p of [P.w1Teacher, P.w2Teacher, P.lrTeacher, P.sTeacher, P.coreTeacher]) {
        const r = await goi(p.userId, '/notifications');
        assert(r.status === 200, `/notifications ${r.status}`);
        const kq = d.dongChuong(r.json, TODAY);
        const cham = (r.json as any[]).filter((n) => n.kind === 'cham_qua_han');
        soCham += cham.length;
        assert(cham.every((n) => kq.canLam.some((x: any) => x.id === n.id) && n.han), 'Quá hạn chấm phải ở Cần làm, có hạn');
        assert(!kq.canLam.some((n: any) => n.kind === 'sos' && n.entity_type === 'assessment_attempt'), 'SOS-lượt không ở Cần làm');
        const han = kq.canLam.map((n: any) => n.han).filter(Boolean);
        assert(han.every((h: string, i: number) => !i || han[i - 1] <= h), `Cần làm phải sắp theo hạn: ${han}`);
        const caseKey = kq.canLam.filter((n: any) => n.entity_type === 'sos_case').map((n: any) => n.entity_id);
        assert(new Set(caseKey).size === caseKey.length, 'một Case một dòng');
      }
      assert(soCham > 0, 'bộ demo phải có thông báo Quá hạn chấm');
      const ql = await goi(P.mbManager.userId, '/notifications');
      const kqQl = d.dongChuong(ql.json, TODAY);
      const chot = (ql.json as any[]).filter((n) => n.kind === 'chot_lo_trinh');
      assert(chot.length > 0 && chot.every((n) => kqQl.canLam.some((x: any) => x.id === n.id)), `QL: ${chot.length} Chốt lộ trình phải ở Cần làm`);
    });

    check('SL1-10c · Case tạo tay cho kỹ năng người khác phụ trách → chuông Cần làm của người phụ trách; thêm PA → rời Cần làm; tự phụ trách → không chuông', () => {
      const cases: any = await_cases;
      const tb: any = await_tb;
      thu(() => {
        /* Lớp FT Monbay đang có GV Reading khác QL (các phép kiểm trước có thể đã đổi phân công lớp mẫu). */
        const lopGv = one(`SELECT e.student_id AS id, ta.user_id AS gv FROM enrollments e JOIN classes c ON c.id = e.class_id
          JOIN teacher_assignments ta ON ta.class_id = c.id AND ta.skill = 'reading' AND ta.status = 'active' AND ta.user_id != ?
          JOIN students s ON s.id = e.student_id AND s.archived_at IS NULL
         WHERE c.branch_id = ? AND c.is_fast_track = 1 AND c.status = 'active' AND e.status = 'active' LIMIT 1`, P.mbManager.userId, MB);
        const em = lopGv.id;
        const c = cases.reportIssue(P.mbManager, { studentId: em, topic: 'reading', title: 'SL1 thử Case giao', summary: 'Em đọc chậm, bỏ sót 5 câu cuối Passage 3, sai dạng Matching Headings.',
          primaryCode: d.issuesForTopic('reading')[0].code, idempotencyKey: `sl1-c23-${Math.random()}`, parallel: true, ownerUserId: lopGv.gv }) as any;
        const chu = one('SELECT owner_user_id AS u FROM sos_cases WHERE id = ?', c.id).u;
        assert(chu && chu !== P.mbManager.userId, `tiền đề: người phụ trách ${chu} khác người tạo`);
        const dong = () => (tb.thongBaoCua(chu) as any[]).find((n) => n.kind === 'case_giao' && n.entity_id === c.id);
        const n = dong();
        assert(n && d.nhomThongBao(n) === 'can-lam' && n.han, `người phụ trách phải có dòng Cần làm có hạn: ${JSON.stringify(n)}`);
        assert(!(tb.thongBaoCua(P.mbManager.userId) as any[]).some((x) => x.kind === 'case_giao' && x.entity_id === c.id), 'người tạo không nhận');
        cases.recordIntervention(P.mbManager, c.id, { kind: 'self_study', description: 'Đọc 2 bài mỗi ngày', performerSelf: true, status: 'started', startedDate: TODAY });
        assert(d.nhomThongBao(dong()) === 'de-biet', 'đã thêm PA → rời Cần làm');
        const tu = cases.reportIssue(P.mbManager, { studentId: em, topic: 'reading', title: 'SL1 tự phụ trách', summary: 'Em bỏ sót câu hỏi cuối bài Reading, sai dạng True False Not Given.', primaryCode: d.issuesForTopic('reading')[0].code,
          idempotencyKey: `sl1-c23b-${Math.random()}`, parallel: true, ownerUserId: P.mbManager.userId }) as any;
        assert(!(tb.thongBaoCua(P.mbManager.userId) as any[]).some((x) => x.kind === 'case_giao' && x.entity_id === tu.id), 'tự tạo cho mình: không chuông');
      });
    });

    check('SL1-10d · số chuông giảm được: đăng ký đã duyệt, đề nghị dời đã xử lý, Ý thức đã xử lý → Để biết; "Đã có bàn giao" là tin; dòng không biết trạng thái đã đọc → Để biết', () => {
      const tb: any = await_tb;
      thu(() => {
        /* Tài khoản chưa có thông báo nào — chuông chỉ trả 50 dòng, người nhiều thông báo có thể đẩy dòng thử ra ngoài. */
        const qt = one(`SELECT id FROM users WHERE id NOT IN (SELECT user_id FROM notifications) ORDER BY id LIMIT 1`).id, NOW = new Date().toISOString();
        const them = (kind: string, et: string, eid: number, docRoi = false) => Number(conn.prepare(`INSERT INTO notifications (user_id, kind, title, entity_type, entity_id, dedup_key, created_at, read_at)
          VALUES (?,?,?,?,?,?,?,?)`).run(qt, kind, `sl1 ${kind}`, et, eid, `sl1:${kind}:${eid}:${Math.random()}`, NOW, docRoi ? NOW : null).lastInsertRowid);
        const nhom = (id: number) => d.nhomThongBao((tb.thongBaoCua(qt) as any[]).find((n) => n.id === id));
        /* dang_ky: còn việc khi tài khoản còn chờ duyệt. */
        const u = one(`SELECT id FROM users WHERE approval_state IS NULL OR approval_state != 'pending' LIMIT 1`).id;
        const dk = them('dang_ky', 'user', u);
        assert(nhom(dk) === 'de-biet', 'đăng ký đã duyệt phải rời Cần làm');
        conn.prepare(`UPDATE users SET approval_state = 'pending' WHERE id = ?`).run(u);
        assert(nhom(dk) === 'can-lam', 'đăng ký còn chờ duyệt ở Cần làm');
        /* schedule_move: còn việc khi đề nghị dời còn chờ. */
        const r = one(`SELECT id, status FROM skill_move_requests WHERE status != 'pending' LIMIT 1`);
        if (r) assert(nhom(them('schedule_move', 'skill_move_requests', r.id)) === 'de-biet', 'đề nghị dời đã xử lý phải rời Cần làm');
        /* discipline: em không còn vi phạm mới / bắt buộc xử lý → rời Cần làm. */
        const em = one(`SELECT s.id FROM students s WHERE NOT EXISTS (SELECT 1 FROM violations v WHERE v.student_id = s.id) LIMIT 1`).id;
        assert(nhom(them('discipline', 'student', em)) === 'de-biet', 'Ý thức đã xử lý (không còn việc) phải rời Cần làm');
        assert(nhom(them('ban_giao', 'student', em)) === 'de-biet', '"Đã có bàn giao" là tin');
        const loi = them('lenh_loi', 'student', em);
        assert(nhom(loi) === 'can-lam', 'chưa đọc: còn ở Cần làm');
        assert(nhom(them('lenh_loi', 'student', em, true)) === 'de-biet', 'không biết trạng thái mà đã đọc → Để biết');
        const kq = d.dongChuong(tb.thongBaoCua(qt));
        assert(kq.soNut === kq.canLam.length && kq.canLam.some((n: any) => n.id === dk), 'số nút = Cần làm, có đăng ký còn chờ');
      });
    });
  } finally {
    may.close();
  }
}
