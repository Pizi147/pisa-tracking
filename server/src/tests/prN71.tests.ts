/**
 * N71 (chủ SP 25/11, plan.md 1.6): kết thúc lớp thường / chuyển lớp KHÔNG ẩn vội, KHÔNG chặn cứng — GV / GVCN lớp cũ vẫn xem dữ liệu lớp cũ và làm xong việc
 * cuối khoá còn của mình. Lớp FOU tuần Final, 3 em (1 Lên FT, 2 lên BE) chốt cả lớp "Ngay hôm nay" và "Từ tuần" (lớp cũ tự kết thúc) — trước / sau, qua API thật.
 */
export async function runPrN71Tests(t: any) {
  const { check, checkAsync, assert, conn, P } = t;
  console.log('\nN71 · Kết thúc lớp thường: GV lớp cũ vẫn xem + làm xong việc cuối khoá');
  const d: any = await import('../../../shared/domain/index.ts');
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const lenh: any = await import('../classes/lenhChuyen.ts');
  const htcn: any = await import('../classes/hoanTacChuyenNgay.ts');
  const bc: any = await import('../classes/baoCaoPh.ts');
  const { myWork } = await import('../worklist/mywork.ts');
  const { loadPrincipal, lopMt0ChoGvSpeaking, lopConViec } = await import('../permissions.ts');
  const { lopKetThucCuaGv } = await import('../worklist/tongQuan.ts');
  const { danhSachLuuTru } = await import('../classes/luuTru.ts');
  const { xoaNho, soCauSql, chayTrongRequest } = await import('../platform/nguCanhRequest.ts');
  const { TRAN_CHIP_BC, TRAN_MY_WORK_GV_LOP_CU } = await import('./tocDoDuong.ts');
  const lopSvc: any = await import('../classes/classes.ts');
  const htSvc: any = await import('../students/hanhTrinh.ts');
  const { getConfig, setConfig } = await import('../demoConfig.ts');
  const { createApp } = await import('../app.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const NGAY_GOC = getConfig('demo_date');
  const datNgay = (n: string) => { setConfig('demo_date', n); xoaNho(); };

  check('N71 · emTrongDot: em rời lớp trong đợt Final mà bài Final ở lớp này → còn trong đợt; rời trước ngày mở / không có bài đợt đó / đợt tháng → như cũ (rời là ra)', () => {
    const dot = d.dotTuan('final', '2026-09-21');   // mở 21/09, hạn 29/09
    const em = (den: string | null, bai: string | null) => bc.emTrongDot({ tu: '2026-08-03', den, bai }, dot, '2026-09-24');
    assert(em(null, null), 'còn học');
    assert(em('2026-09-23', 'progress,final') && em('2026-09-21', 'final'), 'rời trong đợt, bài Final ở lớp này');
    assert(!em('2026-09-23', 'progress'), 'rời trong đợt nhưng Final không ở lớp này (chuyển giữa khoá, bài đi theo em)');
    assert(!em('2026-09-20', 'final'), 'rời trước ngày mở đợt');
    assert(!bc.emTrongDot({ tu: '2026-09-25', den: null, bai: null }, dot, '2026-09-24'), 'vào lớp sau mốc');
    assert(!bc.emTrongDot({ tu: '2026-08-01', den: '2026-09-23', bai: 'final' }, d.dotThang(2026, 9), '2026-09-24'), 'đợt tháng FT giữ luật cũ');
  });

  check('N71 · lopConViec (chủ SP 25/11: 30 ngày rồi rời): lớp đang chạy · lớp kết thúc ≤ 30 ngày → còn việc; lâu hơn / không ngày → không', () => {
    assert(lopConViec({ status: 'active' }, '2026-09-24') && lopConViec({ status: 'finished', finished_at: '2026-09-23' }, '2026-09-24'), 'đang chạy / vừa kết thúc');
    assert(lopConViec({ status: 'finished', finished_at: '2026-08-25' }, '2026-09-24'), 'đúng 30 ngày');
    assert(!lopConViec({ status: 'finished', finished_at: '2026-08-24' }, '2026-09-24') && !lopConViec({ status: 'finished', finished_at: null }, '2026-09-24'), 'quá 30 ngày / thiếu ngày');
  });

  if (!conn) return;
  const QL = P.mbManager;
  const MB = get(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const GV = all(`SELECT DISTINCT ur.user_id FROM user_roles ur JOIN roles r ON r.id = ur.role_id JOIN users u ON u.id = ur.user_id
     WHERE r.key = 'teacher' AND ur.status = 'active' AND ur.branch_id = ? AND u.status = 'active' AND u.deleted_at IS NULL ORDER BY ur.user_id LIMIT 4`, MB).map((r) => r.user_id as number);
  /* GV Speaking chấm chéo MT0 (kỹ năng S ở hồ sơ), không phân công lớp nào ở đây. */
  const gvS = get(`SELECT us.user_id u FROM user_skills us JOIN user_roles ur ON ur.user_id = us.user_id AND ur.status = 'active' AND ur.branch_id = ?
      JOIN roles r ON r.id = ur.role_id AND r.key = 'teacher' WHERE us.skill = 'speaking' AND us.user_id NOT IN (${GV.join(',')}) ORDER BY us.user_id LIMIT 1`, MB)?.u as number | undefined;
  let seq = 0;
  const lop = (kind: string, bat: string, ft = false) => {
    seq += 1;
    return (intake.createClass(P.admin, { code: `MB N71-${seq}`, branchId: MB, kind, isFastTrack: ft, route: ft ? 'LT1' : null, startDate: bat,
      startPeriodId: week.ensurePeriod(bat).id }) as any).id as number;
  };
  const ganGv = (lopId: number, userId: number, skill: string | null, core: boolean) => conn.prepare(
    `INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,?,?, '2026-01-01', 'active', ?)`,
  ).run(userId, lopId, skill, core ? 1 : 0, new Date().toISOString());
  async function voiMayChu(fn: (goi: (userId: number, url: string, init?: RequestInit) => Promise<Response>) => Promise<void>) {
    const may = createApp().listen(0);
    const cong = (may.address() as any).port as number;
    const phien = new Map<number, string>();
    const goi = async (userId: number, url: string, init: RequestInit = {}) => {
      if (!phien.has(userId)) {
        const s = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }) });
        phien.set(userId, (s.headers.get('set-cookie') ?? '').split(';')[0]);
      }
      return fetch(`http://127.0.0.1:${cong}/api${url}`, { ...init, headers: { 'content-type': 'application/json', cookie: phien.get(userId)!, ...(init.headers ?? {}) } });
    };
    try { await fn(goi); } finally { may.close(); }
  }
  const final = (sid: number) => get(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'final' AND status != 'cancelled'`, sid)?.id as number;
  /** Nhóm việc của người dùng ở một lớp (theo mã lớp trên dòng việc). */
  const viec = (userId: number, ma: string) => { xoaNho(); return (myWork(loadPrincipal(userId), {}).items as any[]).filter((x) => x.classCode === ma).map((x) => x.group as string).sort(); };
  const PHAN = new Map((d.boPhanBc('FOU') as any[]).map((x) => [x.khoa as string, x]));
  const banGhi = (ph: any, sid: number) => ({ dot: 'final:2026-09-21', phan: ph.khoa, studentId: sid, chu: 'Em cần luyện thêm đoạn văn.',
    muc: Object.fromEntries(d.tieuChiPhan(ph).map((x: any) => [x.khoa, 'kha'])) });

  /* FOU khai giảng 03/08 → Final T2 21/09 (đợt Báo cáo PH Final mở 21/09, hạn T3 29/09). GVCN + L R S = GV[0], W = GV[1]; lớp đích: GV[2] GVCN, GV[3] W. */
  for (const kieu of ['ngay', 'tuan'] as const) {
    await checkAsync(`N71 · chốt cả lớp "${kieu === 'ngay' ? 'Ngay hôm nay' : 'Từ tuần'}", lớp cũ tự kết thúc: GV / GVCN lớp cũ vẫn xem lớp, hồ sơ, điểm; Báo cáo PH đợt Final + ô S MT0 chéo không rời; điểm Final, nhận xét, bàn giao lưu được; GV lớp mới không nhận việc lớp cũ`, async () => {
      try {
        datNgay('2026-09-23');
        const fou = lop('FOU', '2026-08-03'), be = lop('BE', '2026-09-28'), ft = lop('FT', '2026-09-28', true);
        const ma = `MB N71-${seq - 2}`;
        ganGv(fou, GV[0], null, true);
        for (const k of ['listening', 'reading', 'speaking']) ganGv(fou, GV[0], k, false);
        ganGv(fou, GV[1], 'writing', false);
        ganGv(be, GV[2], null, true); ganGv(be, GV[3], 'writing', false); ganGv(ft, GV[2], null, true);
        const sids = [0, 1, 2].map(() => {
          seq += 1;
          const ten = `Hoc vien N71 ${seq}`;
          intake.commitIntake(P.admin, { classId: fou, rows: [{ fullName: ten, target: 5, email: `n71-${seq}@thu.pisa`, dob: '2012-01-01' }], idempotencyKey: `n71-${seq}` });
          return get('SELECT id FROM students WHERE full_name = ?', ten).id as number;
        });
        for (const sid of sids) for (const k of ['listening', 'reading', 'speaking']) {
          conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, raw_score, raw_total, entered_at) VALUES (?,?,70,100,?)`).run(final(sid), k, new Date().toISOString());
        }
        xoaNho();
        const truocW = viec(GV[1], ma), truocCn = viec(GV[0], ma);
        assert(truocW.includes('bao_cao_ph') && truocW.includes('score') && truocCn.includes('bao_cao_ph'), `tiền đề: ${truocW} | ${truocCn}`);

        const tuan = kieu === 'ngay' ? '2026-09-23' : '2026-09-28';
        const r = htcn.chotCaLop(QL, fou, { tuanChung: null, dongs: [
          { studentId: sids[0], huong: 'fast_track', toClassId: ft, tuan, mucTieu: 6 },
          ...sids.slice(1).map((studentId) => ({ studentId, huong: 'len_lop', toClassId: be, tuan, lyDo: 'N71' })),
        ] });
        assert((r.ok ?? r.daChuyen)?.length === 3, JSON.stringify(r));
        if (kieu === 'tuan') { datNgay('2026-09-28'); lenh.thiHanhLenhDenHan('2026-09-28'); }
        xoaNho();
        assert(get('SELECT status FROM classes WHERE id = ?', fou).status === 'finished', 'tiền đề: lớp cũ đã kết thúc');
        assert(!all(`SELECT 1 FROM enrollments WHERE class_id = ? AND status = 'active'`, fou).length, 'tiền đề: không còn em nào ở lớp cũ');

        /* Việc còn của GV lớp cũ. */
        const sauW = viec(GV[1], ma), sauCn = viec(GV[0], ma);
        for (const g of ['bao_cao_ph', 'score', 'ban_giao']) assert(sauW.includes(g), `GV W lớp cũ mất việc ${g}: ${sauW}`);
        for (const g of ['bao_cao_ph', 'ban_giao']) assert(sauCn.includes(g), `GVCN lớp cũ mất việc ${g}: ${sauCn}`);
        /* GV lớp mới không nhận việc của lớp cũ. */
        assert(!viec(GV[2], ma).length && !viec(GV[3], ma).length, `GV lớp mới có việc lớp cũ: ${viec(GV[2], ma)} | ${viec(GV[3], ma)}`);
        /* MT0 (em Lên FT) ở lớp cũ: ô S chấm chéo còn với GV Speaking. */
        const mt0 = get(`SELECT id, class_id FROM assessment_attempts WHERE student_id = ? AND kind = 'mt0' AND status != 'cancelled'`, sids[0]);
        assert(mt0?.class_id === fou, `MT0 gắn lớp cũ: ${JSON.stringify(mt0)}`);
        if (gvS) assert(lopMt0ChoGvSpeaking(loadPrincipal(gvS)).includes(fou), 'GV Speaking mất lớp cũ ở hàng chấm S MT0');

        await voiMayChu(async (goi) => {
          const st = async (u: number, url: string, init?: RequestInit) => { const x = await goi(u, url, init); return x.status === 200 ? 200 : `${x.status} ${(await x.text()).slice(0, 160)}`; };
          const put = (body: unknown) => ({ method: 'PUT', body: JSON.stringify(body) });
          const ok = async (u: number, url: string, init: RequestInit | undefined, msg: string) => { const s = await st(u, url, init); assert(s === 200, `${msg}: ${s}`); };
          for (const u of [GV[0], GV[1]]) {
            await ok(u, `/classes/${fou}/overview`, undefined, `GV ${u} xem lớp cũ`);
            await ok(u, `/students/${sids[1]}`, undefined, `GV ${u} xem hồ sơ em`);
          }
          await ok(GV[1], `/regular/attempts/${final(sids[1])}`, undefined, 'GV W xem bài Final');
          await ok(GV[1], `/regular/attempts/${final(sids[1])}/scores/writing`, put({ score: 60, total: 100 }), 'GV W nhập điểm Final');
          await ok(GV[0], `/classes/${fou}/danh-gia-dau-ra/${sids[1]}`, put({ nhanXet: 'Em chăm, cần tự tin hơn.' }), 'GVCN ghi nhận xét cuối khoá');
          const l = get(`SELECT id FROM lenh_chuyen_lop WHERE student_id = ? ORDER BY id DESC LIMIT 1`, sids[1]);
          await ok(GV[1], `/lenh-chuyen/${l.id}/ban-giao-mon`, put({ mon: 'writing', noiDung: 'Viết ổn, cần luyện đoạn.' }), 'GV W ghi bàn giao');
          await ok(GV[0], `/lenh-chuyen/${l.id}/nhan-xet-nhap`, put({ nhanXetChung: 'Em ngoan, chăm làm bài.' }), 'GVCN lưu nhận xét bàn giao');
          /* Báo cáo PH đợt Final: đủ 3 em trên trang lớp cũ; GV W + GVCN lưu được phần của mình; viết đủ → việc rời. */
          const trang: any = await (await goi(GV[1], `/classes/${fou}/bao-cao-ph?dot=final:2026-09-21`)).json();
          assert(trang.em?.length === 3, `trang Báo cáo PH lớp cũ còn ${trang.em?.length} em`);
          for (const sid of sids) {
            await ok(GV[1], `/classes/${fou}/bao-cao-ph`, put(banGhi(PHAN.get('writing'), sid)), `GV W lưu Báo cáo PH em ${sid}`);
            for (const k of ['chung', 'listening', 'reading', 'speaking']) await ok(GV[0], `/classes/${fou}/bao-cao-ph`, put(banGhi(PHAN.get(k), sid)), `GVCN lưu phần ${k} em ${sid}`);
          }
          if (gvS && mt0) {
            await ok(gvS, `/attempts/${mt0.id}/scores/speaking`, put({ band: 5 }), 'GV Speaking chấm S MT0 lớp cũ');
            /* Rà sâu 8: lưu THẬT (qua `scoreEditPath` / `kiemLopKetThuc` của lớp đã kết thúc). */
            assert(get(`SELECT band FROM assessment_scores WHERE attempt_id = ? AND skill = 'speaking'`, mt0.id)?.band === 5, 'điểm S MT0 lớp cũ phải được ghi');
          }

          /* ĐƯỜNG VÀO lớp cũ (chủ SP 25/11 "có đường nào nữa không? Hồ sơ lớp?"). */
          for (const u of [GV[0], GV[1]]) {
            xoaNho();
            const kt = lopKetThucCuaGv(loadPrincipal(u)).find((x) => x.classId === fou);
            assert(kt?.conXem === true && kt.code === ma, `Lớp của tôi: GV ${u} thiếu lớp cũ (đã kết thúc, còn hạn xem): ${JSON.stringify(kt)}`);
            const tim: any = await (await goi(u, '/ref/classes?kemKetThuc=1')).json();
            assert(tim.some((c: any) => c.id === fou && c.ket_thuc === true), `ô tìm: GV ${u} không tìm được lớp cũ`);
            assert(!(await (await goi(u, '/ref/classes')).json() as any[]).some((c: any) => c.id === fou), '/ref/classes không tham số giữ như cũ (chỉ lớp đang chạy)');
            xoaNho();
            assert(danhSachLuuTru(loadPrincipal(u)).lop.some((c: any) => c.id === fou), `Học viên & Lớp › Lưu trữ: GV ${u} không thấy lớp cũ`);
            const ht: any = await (await goi(u, `/students/${sids[1]}/hanh-trinh`)).json();
            assert(JSON.stringify(ht).includes(`"classId":${fou},"code":"${ma}"`) && /"xemLop":true/.test(JSON.stringify(ht)), `hồ sơ HV: chương lớp cũ không có link hồ sơ lớp (GV ${u})`);
            const lt = JSON.stringify(await (await goi(u, '/cham/lich-test')).json());
            if (u === GV[1]) assert(lt.includes(ma), 'Lịch Test: GV W không thấy lớp cũ còn bài Final');
          }
          const cs = JSON.stringify(await (await goi(GV[1], `/giao-vien/${GV[1]}/chi-so?tu=2026-08-03&den=2026-09-28`)).json());
          /* Hồ sơ GV › Lớp (chỉ số theo lớp): lớp cũ có bài Final trong kỳ vẫn có dòng (đường sẵn có; tuần thi còn dở thì chưa vào kỳ — chỉ kiểm "Từ tuần"). */
          if (kieu === 'tuan') assert(cs.includes(`"ma":"${ma}"`), 'hồ sơ GV › Lớp: thiếu lớp cũ');
          /* GV lớp mới không có quyền lớp cũ → chương lớp cũ không link (không dẫn tới 403). */
          const moi: any = await (await goi(GV[3], `/students/${sids[1]}/hanh-trinh`)).json();
          assert(!/"xemLop":true/.test(JSON.stringify(moi)), 'GV lớp mới: chương lớp cũ không được có link hồ sơ lớp');
          if (kieu === 'tuan') {
            datNgay('2026-10-30');   // quá hạn xem N68 (30 ngày từ ngày kết thúc)
            assert(lopKetThucCuaGv(loadPrincipal(GV[1])).find((x) => x.classId === fou)?.conXem === false, 'quá hạn xem: conXem phải false (Lớp của tôi chỉ giữ khi còn việc)');
            assert(((await (await goi(GV[1], '/ref/classes?kemKetThuc=1')).json()) as any[]).some((c: any) => c.id === fou), 'quá hạn xem: ô tìm vẫn tìm được lớp cũ');
            await ok(GV[1], `/classes/${fou}/overview`, undefined, 'quá hạn xem: GV vẫn mở được hồ sơ lớp cũ');
            datNgay('2026-09-28');
          }
        });
        assert(!viec(GV[1], ma).includes('bao_cao_ph') && !viec(GV[0], ma).includes('bao_cao_ph'), 'viết đủ mà việc Báo cáo PH chưa rời');
      } finally { datNgay(NGAY_GOC); }
    });
  }

  /* 1b (chủ SP 25/11): Case / PA GV TỰ TẠO — GV cũ (Người dạy) ghi nốt kết quả tới thứ Ba tuần sau ngày chuyển; PA theo quy chế không qua đường này. */
  const cases: any = await import('../cases/cases.ts');
  const ma403 = (fn: () => unknown) => { try { fn(); return 200; } catch (e: any) { return e?.status ?? 500; } };
  check('N71 · PA tự tạo: em chuyển "Ngay hôm nay" T4 23/09 → GV cũ có việc "Ghi kết quả PA" hạn T3 29/09 (ghi được, ghi xong thì rời); quá hạn 30/09 → GV cũ hết việc + 403, việc về chủ Case mới; PA quy chế không gia hạn; chip Báo cáo PH quá hạn > 7 ngày vẫn hiện', () => {
    try {
      datNgay('2026-09-23');
      const fou = lop('FOU', '2026-08-03'), be = lop('BE', '2026-09-28');
      const ma = `MB N71-${seq - 1}`;
      ganGv(fou, GV[0], null, true); ganGv(fou, GV[1], 'writing', false);
      ganGv(be, GV[2], null, true); ganGv(be, GV[3], 'writing', false);
      const sids = [0, 1].map(() => {
        seq += 1;
        const ten = `Hoc vien N71 ${seq}`;
        intake.commitIntake(P.admin, { classId: fou, rows: [{ fullName: ten, target: 5, email: `n71-${seq}@thu.pisa`, dob: '2012-01-01' }], idempotencyKey: `n71-${seq}` });
        return get('SELECT id FROM students WHERE full_name = ?', ten).id as number;
      });
      const now = new Date().toISOString();
      const taoCase = (sid: number, origin = 'teacher_report') => {
        const cy = get(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'`, sid).id;
        return Number(conn.prepare(`INSERT INTO sos_cases (student_id, cycle_id, topic, category, origin_kind, status, reported_by, owner_user_id, summary, created_at, parallel)
          VALUES (?, ?, 'writing', 'writing', ?, 'open', ?, ?, 'Case N71 tự tạo', ?, 1)`).run(sid, cy, origin, GV[1], GV[1], now).lastInsertRowid);
      };
      const paVao = (caseId: number, preset: 0 | 1, nguoi = GV[1]) => Number(conn.prepare(`INSERT INTO case_interventions (case_id, kind, status, preset, confirmed_at, description, performer_user_id, started_date, action_due, created_at)
          VALUES (?, 'self_study', 'started', ?, ?, 'Tự luyện đoạn văn', ?, '2026-09-14', '2026-09-28', ?)`).run(caseId, preset, preset ? now : null, nguoi, now).lastInsertRowid);
      const pa = (sid: number, preset: 0 | 1) => paVao(taoCase(sid), preset);
      const [pa1, pa2, paQc] = [pa(sids[0], 0), pa(sids[1], 0), pa(sids[1], 1)];
      /* Rà sâu 1: Case trộn (PA tự tạo + PA quy chế), Case hai PA tự tạo, Case SOS (`mock`) — lần ghi cuối của GV cũ chỉ khép PA đó, Case + PA khác để chủ Case. */
      const caseTron = taoCase(sids[0]), paTron = paVao(caseTron, 0), paTronQc = paVao(caseTron, 1);
      const caseHai = taoCase(sids[1]), [paHai1, paHai2] = [paVao(caseHai, 0), paVao(caseHai, 0)];
      const caseSos = taoCase(sids[0], 'mock'), paSos = paVao(caseSos, 0);
      const paNguoiKhac = paVao(taoCase(sids[1]), 0, GV[2]);   // Người dạy không dạy lớp cũ → không thuộc luật GV cũ
      xoaNho();
      htcn.chotCaLop(QL, fou, { tuanChung: null, dongs: sids.map((studentId) => ({ studentId, huong: 'len_lop', toClassId: be, tuan: '2026-09-23', lyDo: 'N71' })) });
      xoaNho();
      /* Rà sâu 3: chuyển lớp (M-04) đổi chủ Case, KHÔNG đổi Người dạy. */
      const sauChuyen = get('SELECT iv.performer_user_id AS nguoi, sc.owner_user_id AS chu FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id WHERE iv.id = ?', pa2);
      assert(sauChuyen.nguoi === GV[1] && sauChuyen.chu === GV[3], `M-04: Người dạy giữ GV cũ, chủ Case GV mới: ${JSON.stringify(sauChuyen)}`);
      assert(cases.hanGvCuCuaPa(get('SELECT * FROM case_interventions WHERE id = ?', paNguoiKhac)) === null, 'Người dạy không dạy lớp cũ → không có hạn GV cũ (khớp Công việc)');
      /* Rà sâu 5: mức Case = mặc định form Hoàn thành Case (nhãn trùng), "Chưa đủ dữ liệu" không có mức. */
      assert(cases.mucCaseTuKetQuaPa('improved') === 'much_better' && cases.mucCaseTuKetQuaPa('partial') === 'improved' && cases.mucCaseTuKetQuaPa('unchanged') === 'unchanged'
        && cases.mucCaseTuKetQuaPa('worse') === 'worse' && cases.mucCaseTuKetQuaPa('insufficient') === null, 'ánh xạ mức Case');
      /* Rà sâu 10: link "Hồ sơ lớp ›" ở Hành trình = mở được hồ sơ lớp (cùng quyền `classOverview`). */
      for (const u of GV) {
        xoaNho();
        let chuong: any[] = [];
        try { chuong = (htSvc.hanhTrinhHocVien(loadPrincipal(u), sids[1], null) as any).chuong ?? []; } catch { continue; }
        for (const ch of chuong.filter((x: any) => !x.dangHoc)) {
          xoaNho();
          const moDuoc = ma403(() => lopSvc.classOverview(loadPrincipal(u), ch.classId)) === 200;
          assert(!!ch.xemLop === moDuoc, `GV ${u} lớp ${ch.classId}: link ${!!ch.xemLop} ≠ mở được ${moDuoc}`);
        }
      }
      const gvW = () => loadPrincipal(GV[1]);
      const viecPa = (u: number, id: number) => { xoaNho(); return (myWork(loadPrincipal(u), {}).items as any[]).find((x) => x.key === `action:${id}`); };
      const kq = { outcome: 'unchanged', decision: 'keep', observedOn: '2026-09-29', note: 'Em viết đoạn khá hơn, lớp mới luyện tiếp.' };
      /* Trước hạn (T3 29/09). */
      for (const ngay of ['2026-09-23', '2026-09-29']) {
        datNgay(ngay);
        const it = viecPa(GV[1], pa1);
        assert(it?.mine && it.due === '2026-09-29' && it.group === 'ghi_ket_qua_pa', `${ngay}: GV cũ phải có việc Ghi kết quả PA hạn 29/09: ${JSON.stringify(it)}`);
        assert(cases.hanGvCuGhiPa(gvW(), get('SELECT * FROM case_interventions WHERE id = ?', pa1)) === '2026-09-29', `${ngay}: quyền ghi tới 29/09`);
        assert(cases.hanGvCuGhiPa(gvW(), get('SELECT * FROM case_interventions WHERE id = ?', paQc)) === null, 'PA theo quy chế không qua đường GV cũ');
      }
      datNgay('2026-09-29');
      /* Hậu quả nói trước (luật dự án): form của GV cũ là "Kết quả cuối" + cờ `gvCuCuoi` → dòng "Lưu là Case hoàn thành — không thêm PA, không chuyển việc." */
      const ivForm = (cases.caseDetail(gvW(), get('SELECT case_id FROM case_interventions WHERE id = ?', pa1).case_id) as any).interventions.find((x: any) => x.id === pa1);
      assert(ivForm?.lanCuoi === true && ivForm.gvCuCuoi === true && ivForm.ghiDuoc === true, `form GV cũ: ${JSON.stringify(ivForm && { lanCuoi: ivForm.lanCuoi, gvCuCuoi: ivForm.gvCuCuoi })}`);
      assert(ivForm.gvCuDongCase === true, 'Case GV báo, PA cuối → form nói Case hoàn thành');
      const qc = (gvCu: 'case' | 'pa') => d.quyCheGhiKetQua({ han: null, decision: '', deXuat: false, lanCuoi: true, batBuoc: false, miniTest: false, gvCu }).chu;
      assert(qc('case') === 'Lưu là Case hoàn thành — không thêm PA, không chuyển việc.' && qc('pa') === 'Lưu là PA kết thúc', 'câu hậu quả');
      /* Case trộn / hai PA / SOS: form chỉ nói "PA kết thúc"; lưu → PA khép, Case mở, PA quy chế + PA còn lại vẫn chạy. */
      for (const [cid, id, conLai] of [[caseTron, paTron, [paTronQc]], [caseHai, paHai1, [paHai2]], [caseSos, paSos, []]] as [number, number, number[]][]) {
        const f = (cases.caseDetail(gvW(), cid) as any).interventions.find((x: any) => x.id === id);
        assert(f?.gvCuCuoi === true && f.gvCuDongCase === false, `Case ${cid}: form phải "PA kết thúc": ${JSON.stringify(f && { a: f.gvCuCuoi, b: f.gvCuDongCase })}`);
        assert(ma403(() => cases.updateResult(gvW(), id, kq)) === 200, `Case ${cid}: GV cũ ghi phải 200`);
        assert(get('SELECT status FROM case_interventions WHERE id = ?', id).status === 'completed', `Case ${cid}: PA của GV cũ phải khép`);
        assert(get('SELECT status FROM sos_cases WHERE id = ?', cid).status !== 'done', `Case ${cid}: Case KHÔNG được hoàn thành`);
        for (const k of conLai) assert(get('SELECT status FROM case_interventions WHERE id = ?', k).status === 'started', `Case ${cid}: PA ${k} (quy chế / còn lại) phải còn chạy`);
      }
      assert(ma403(() => cases.updateResult(gvW(), pa1, kq)) === 200, 'GV cũ ghi nốt kết quả trước hạn phải 200');
      /* Chủ SP 25/11: "ghi kết quả kia là lần cuối luôn … kết thúc case luôn" — PA khép, Case hoàn thành, không việc cho ai (GV cũ, chủ Case mới, Head). */
      const cid1 = get('SELECT case_id FROM case_interventions WHERE id = ?', pa1).case_id;
      assert(get('SELECT status FROM case_interventions WHERE id = ?', pa1).status === 'completed', 'PA phải khép sau lần ghi của GV cũ');
      const c1 = get('SELECT status, outcome, closed_by FROM sos_cases WHERE id = ?', cid1);
      assert(c1.status === 'done' && c1.outcome === 'unchanged' && c1.closed_by === GV[1], `Case phải hoàn thành: ${JSON.stringify(c1)}`);
      /* Rà sâu 6: chủ Case mới nhận tin Case đã hoàn thành. */
      assert(get(`SELECT COUNT(*) n FROM notifications WHERE user_id = ? AND dedup_key = ?`, GV[3], `case_dong_gv_cu:${cid1}`).n === 1, 'chủ Case mới phải có tin');
      for (const u of [GV[1], GV[3], QL.userId]) {
        xoaNho();
        const con = (myWork(loadPrincipal(u), u === QL.userId ? { nguoi: 'tat-ca' } : {}).items as any[]).filter((x) => x.caseId === cid1);
        assert(!con.length, `còn việc Case ${cid1} cho ${u}: ${con.map((x) => x.key).join(', ')}`);
      }
      /* N24 ②: Mở lại Case như mọi Case đã hoàn thành (Head / GV đúng môn lớp em đang học — `coTheMoLaiCase`); mở lại rồi Hoàn thành lại để phần sau giữ nguyên. */
      assert(ma403(() => cases.moLaiCase(QL, cid1)) === 200 && get('SELECT status FROM sos_cases WHERE id = ?', cid1).status !== 'done', 'Head mở lại được Case');
      cases.closeCaseOutcome(QL, cid1, { outcome: 'unchanged', note: 'Đóng lại sau khi kiểm mở lại.' });
      assert(!viecPa(GV[1], pa1), 'ghi xong → việc của GV cũ rời');
      assert(cases.hanGvCuGhiPa(gvW(), get('SELECT * FROM case_interventions WHERE id = ?', pa1)) === null, 'ghi xong → hết gia hạn');
      /* Sau hạn (T4 30/09): PA chưa ghi về chủ Case mới như cũ. */
      datNgay('2026-09-30');
      assert(!viecPa(GV[1], pa2), 'quá hạn: GV cũ không còn việc');
      assert(ma403(() => cases.updateResult(gvW(), pa2, { ...kq, observedOn: '2026-09-30' })) === 403, 'quá hạn: GV cũ ghi phải 403');
      const chu = get('SELECT owner_user_id FROM sos_cases WHERE id = (SELECT case_id FROM case_interventions WHERE id = ?)', pa2).owner_user_id;
      assert(chu === GV[3], `chủ Case mới là GV W lớp mới: ${chu}`);
      assert(ma403(() => cases.kiemQuyenPa(loadPrincipal(GV[3]), get('SELECT * FROM case_interventions WHERE id = ?', pa2), cases.loadCase(get('SELECT case_id FROM case_interventions WHERE id = ?', pa2).case_id))) === 200,
        'chủ Case mới ghi được');
      /* 3 (chủ SP 25/11): chip "quá hạn" tab Báo cáo PH còn tới khi viết đủ — 8/10 = quá hạn 9 ngày (trước: rời sau 7). */
      datNgay('2026-10-08');
      const pChip = loadPrincipal(GV[1]);
      xoaNho();
      const c0 = soCauSql();
      const chip = chayTrongRequest('GET', () => bc.chipBaoCaoPh(pChip, fou));
      const soCauChip = soCauSql() - c0;
      xoaNho();
      const c1q = soCauSql();
      chayTrongRequest('GET', () => myWork(pChip, {}));
      const soCauMw = soCauSql() - c1q;
      console.log(`    (đo: chip Báo cáo PH ${soCauChip} câu · /my-work GV lớp cũ ${soCauMw} câu)`);
      assert(soCauMw <= TRAN_MY_WORK_GV_LOP_CU, `/my-work GV lớp cũ ${soCauMw} câu > trần ${TRAN_MY_WORK_GV_LOP_CU}`);
      assert(soCauChip <= TRAN_CHIP_BC, `chip Báo cáo PH ${soCauChip} câu > trần ${TRAN_CHIP_BC} (không lớn theo số đợt)`);
      assert(chip?.dot === 'final:2026-09-21' && chip.quaHan === 9, `chip quá hạn > 7 ngày phải còn: ${JSON.stringify(chip)}`);
      assert((myWork(loadPrincipal(GV[1]), {}).items as any[]).some((x) => x.group === 'bao_cao_ph' && x.classCode === ma), 'việc GV Báo cáo PH còn cùng lúc');
    } finally { datNgay(NGAY_GOC); }
  });
}
