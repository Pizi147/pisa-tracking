/**
 * PHÉP KIỂM S3 (giảm dòng đọc Turso — bỏ câu con theo dòng). Mỗi chỗ: đường mới = đường cũ trên toàn DB kiểm (+ tình huống biên dựng trong giao dịch, cuộn lại),
 * mọi người dùng / nhánh liên quan, và EXPLAIN câu mới không quét bảng lớn ở đường nóng.
 *  (a) việc TVV (`viecHoSoTvv`) + Báo PH (`viecBaoPhCuaToi`): điều kiện theo nhánh thay `(x = ? OR ? = 1)`;
 *  (b) Học viên & Lớp: sáu số lượt của lộ trình bằng MỘT câu con đọc lượt một lần (sáu số ghép chuỗi) thay sáu câu con theo từng em;
 *  (c) phụ liệu dòng Case chỉ của Case đang trả, nhớ theo Case trong request;
 *  (d) `attemptsNewestFirst`: lộ trình nối một lần, lộ trình FT đang chạy một lần mỗi em.
 */
import {
  LUOT_MT_TINH_SQL, LUOT_MT_XONG_SQL, MOC_KE_TIEP_SQL, CO_DIEM_SQL, PERMISSIONS,
} from '../../../shared/domain/index.ts';

export async function runPrS3CauConTests(t: any) {
  const { check, assert, conn } = t;
  const { loadPrincipal, can } = await import('../permissions.ts');
  const vt: any = await import('../worklist/viecTvv.ts');
  const bp: any = await import('../yThuc/baoPhTvv.ts');
  const hvl: any = await import('../classes/hocVienLop.ts');
  const dg: any = await import('../worklist/danhGia.ts');
  const cs: any = await import('../cases/cases.ts');
  const { xoaNho, trongBoNho } = await import('../platform/nguCanhRequest.ts');
  const { demoToday } = await import('../demoConfig.ts');
  console.log('\nS3 · bỏ câu con theo dòng: TVV, Học viên & Lớp, phụ liệu Case, lượt mới nhất');

  const today = demoToday();
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const nguoi = () => all(`SELECT id FROM users ORDER BY id`).flatMap((u) => { try { return [loadPrincipal(u.id)]; } catch { return []; } });
  const chiNhanh = all(`SELECT id FROM branches ORDER BY id`).map((r) => r.id as number);
  const LON = /^SCAN (assessment_attempts|assessment_scores|attempt_skills|enrollments|sos_cases|students|a|s|e|sc|v)\b/;
  /** Chạy `fn`, ghi lại câu SQL khớp `loc` (để EXPLAIN đúng câu mã thật chạy) và dòng nó trả. */
  const ghiCau = <T>(loc: RegExp, fn: () => T): { out: T; cau: string[]; dong: any[][] } => {
    const cau: string[] = []; const dong: any[][] = [];
    const goc = conn.prepare;
    conn.prepare = function (this: unknown, sql: string) {
      const st = goc.call(this, sql);
      if (!loc.test(sql)) return st;
      cau.push(sql);
      return { all: (...a: unknown[]) => { const r = st.all(...a); dong.push(r); return r; }, get: (...a: unknown[]) => st.get(...a) };
    };
    try { return { out: fn(), cau, dong }; } finally { delete conn.prepare; }
  };
  const keHoach = (sql: string) => (conn.prepare(`EXPLAIN QUERY PLAN ${sql}`).all(...Array((sql.match(/\?/g) ?? []).length).fill(1)) as any[]);
  const quetLon = (sql: string) => keHoach(sql).map((r) => r.detail as string).filter((d) => LON.test(d));
  /** Bật cờ câu cũ → JSON, tắt → JSON. */
  const hai = (co: { bat: boolean }, fn: () => unknown): [string, string] => {
    xoaNho();
    co.bat = true;
    try { const cu = JSON.stringify(fn()); co.bat = false; xoaNho(); return [cu, JSON.stringify(fn())]; } finally { co.bat = false; }
  };
  const giaoDich = (fn: () => void) => { conn.exec('BEGIN IMMEDIATE'); try { fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); } };

  // ------------------------------------------------------------------ (a) TVV
  const soTvv = () => {
    const sai: string[] = []; let coViec = 0, coBaoPh = 0, lan = 0;
    for (const p of nguoi()) {
      for (const tatCa of [false, true]) for (const branchId of [null, ...chiNhanh]) {
        lan++;
        const [a, b] = hai(vt.viecTvvCuKhiKiem, () => vt.viecHoSoTvv(p, { today, tatCa, branchId, chot: true, boSung: true }));
        if (a !== b) sai.push(`viecHoSoTvv u${p.userId} tatCa=${tatCa} cn=${branchId}`);
        if (a !== '[]') coViec++;
        const [c, d] = hai(bp.baoPhCuKhiKiem, () => bp.viecBaoPhCuaToi(p, { today, tatCa, branchId }));
        if (c !== d) sai.push(`viecBaoPhCuaToi u${p.userId} tatCa=${tatCa} cn=${branchId}`);
        if (c !== '[]') coBaoPh++;
      }
    }
    return { sai, coViec, coBaoPh, lan };
  };
  check('S3-a · việc TVV + Báo PH: câu theo nhánh = câu `(x = ? OR ? = 1)` cũ — mọi người dùng × Của tôi / Của GV × mọi chi nhánh (+ em không TVV, đổi TVV, việc mở thêm)', () => {
    const r1 = soTvv();
    assert(!r1.sai.length && r1.coViec > 0 && r1.coBaoPh > 0, `DB kiểm (${r1.lan} lần): việc ${r1.coViec} · Báo PH ${r1.coBaoPh} · lệch ${r1.sai.slice(0, 4).join(' | ')}`);
    giaoDich(() => {
      const tvv = all(`SELECT DISTINCT consultant_user_id AS u FROM students WHERE consultant_user_id IS NOT NULL ORDER BY 1`).map((r) => r.u as number);
      conn.prepare(`UPDATE students SET consultant_user_id = NULL WHERE id % 3 = 0`).run();
      if (tvv.length) conn.prepare(`UPDATE students SET consultant_user_id = ? WHERE id % 5 = 1`).run(tvv[0]);
      conn.prepare(`UPDATE viec_bao_ph SET trang_thai = 'mo' WHERE id % 2 = 0`).run();
      const r2 = soTvv();
      assert(!r2.sai.length && r2.coViec > 0 && r2.coBaoPh > 0, `dữ liệu biên: việc ${r2.coViec} · Báo PH ${r2.coBaoPh} · lệch ${r2.sai.slice(0, 4).join(' | ')}`);
    });
  });

  check('S3-a2 · EXPLAIN: TVV (không phải QL) đi chỉ mục idx_student_consultant — không SCAN students / viec_bao_ph', () => {
    const tvv = nguoi().find((p) => p.roleKeys.includes('consultant') && !can(p, PERMISSIONS.CYCLE_EDIT, { anyScope: true }) && !p.roleKeys.includes('manager'));
    assert(!!tvv, 'DB kiểm có TVV');
    const a = ghiCau(/FROM students s\s+\/\*/, () => vt.viecHoSoTvv(tvv, { today, tatCa: false, branchId: null, chot: true, boSung: true }));
    const b = ghiCau(/FROM viec_bao_ph v JOIN students s/, () => bp.viecBaoPhCuaToi(tvv, { today, tatCa: false, branchId: null }));
    assert(a.cau.length === 1 && b.cau.length === 1, `bắt câu: ${a.cau.length} · ${b.cau.length}`);
    for (const sql of [a.cau[0], b.cau[0]]) {
      const ke = keHoach(sql).map((r) => r.detail).join(' | ');
      assert(/idx_student_consultant/.test(ke) && !/SCAN (s|v)\b/.test(ke), `kế hoạch: ${ke}`);
    }
  });

  // ------------------------------------------------------------------ (b) Học viên & Lớp
  const SAU_COT_CU = `(SELECT COUNT(*) FROM assessment_attempts a WHERE a.cycle_id = cy.id AND a.status = 'planned' AND a.kind != 'mt0') AS so_luot_ke_hoach,
            EXISTS (SELECT 1 FROM assessment_attempts a WHERE a.cycle_id = cy.id AND a.kind = 'final' AND a.status != 'cancelled') AS co_cuoi_khoa,
            (SELECT COUNT(*) FROM assessment_attempts a JOIN report_periods rp ON rp.id = a.planned_period_id
              WHERE a.cycle_id = cy.id AND a.kind != 'mt0' AND ${MOC_KE_TIEP_SQL('a', 'rp')}) AS so_moc_ke_tiep,
            (SELECT COALESCE(MAX(a.attempt_no), 0) FROM assessment_attempts a WHERE a.cycle_id = cy.id AND a.status != 'cancelled' AND a.kind != 'mt0'
              AND (a.status != 'planned' OR a.planned_period_id IS NOT NULL)) AS mt_cuoi,
            (SELECT COUNT(*) FROM assessment_attempts a WHERE a.cycle_id = cy.id AND ${LUOT_MT_XONG_SQL('a')}) AS so_mt_xong,
            (SELECT COUNT(*) FROM assessment_attempts a WHERE a.cycle_id = cy.id AND ${LUOT_MT_TINH_SQL('a')}) AS so_mt_tong`;
  const soHvl = () => {
    const sai: string[] = []; const dem = { kh: 0, cuoi: 0, moc: 0, mt: 0, xong: 0, tong: 0, khongCy: 0, dong: 0, lan: 0 };
    const chay = (p: any, f: any) => { const r = ghiCau(/AS lop_route/, () => { try { return hvl.danhSachHocVienLop(p, f); } catch (e: any) { return { loi: e?.status ?? String(e) }; } }); return r; };
    for (const p of nguoi()) {
      xoaNho();
      const dau = (() => { try { return hvl.danhSachHocVienLop(p, {}); } catch { return null; } })();
      for (const phamVi of dau?.phamVi?.coThe ?? [null]) for (const chuaTvv of [false, true]) {
        const f = { phamVi, chuaTvv, ...(phamVi === 'chi-nhanh' ? { branchId: chiNhanh[0] } : {}) };
        dem.lan++;
        xoaNho(); hvl.hocVienLopCuKhiKiem.soLuot = SAU_COT_CU;
        let cu;
        try { cu = chay(p, f); } finally { hvl.hocVienLopCuKhiKiem.soLuot = null; }
        xoaNho();
        const moi = chay(p, f);
        if (JSON.stringify(cu.dong) !== JSON.stringify(moi.dong)) sai.push(`dòng u${p.userId} ${JSON.stringify(f)}`);
        if (JSON.stringify(cu.out) !== JSON.stringify(moi.out)) sai.push(`trang u${p.userId} ${JSON.stringify(f)}`);
        for (const r of moi.dong.flat()) {
          dem.dong++;
          if (r.so_luot_ke_hoach > 0) dem.kh++; if (r.co_cuoi_khoa) dem.cuoi++; if (r.so_moc_ke_tiep > 0) dem.moc++;
          if (r.mt_cuoi > 0) dem.mt++; if (r.so_mt_xong > 0) dem.xong++; if (r.so_mt_tong > 0) dem.tong++; if (r.cycle_id === null) dem.khongCy++;
        }
      }
    }
    return { sai, dem };
  };
  check('S3-b · Học viên & Lớp: sáu số lượt (một câu con đọc lượt một lần) = sáu câu con cũ — dòng SQL (cả thứ tự) và cả trang, mọi người dùng × mọi phạm vi × lọc chưa TVV (+ lượt Final / MT0 / huỷ / huỷ hết kỹ năng / chưa tuần / em không lộ trình)', () => {
    const r1 = soHvl();
    assert(!r1.sai.length && r1.dem.dong > 100, `DB kiểm: ${JSON.stringify(r1.dem)} · lệch ${r1.sai.slice(0, 4).join(' | ')}`);
    giaoDich(() => {
      const luot = all(`SELECT a.id, a.status FROM assessment_attempts a JOIN learning_cycles cy ON cy.id = a.cycle_id AND cy.status = 'active' ORDER BY a.id`);
      const ke = luot.filter((r) => r.status === 'planned').map((r) => r.id as number);
      const xong = luot.filter((r) => r.status !== 'planned').map((r) => r.id as number);
      const lay = (ds: number[], buoc: number, du: number) => ds.filter((_, i) => i % buoc === du);
      for (const id of lay(ke, 7, 0)) conn.prepare(`UPDATE assessment_attempts SET kind = 'final' WHERE id = ?`).run(id);
      for (const id of lay(xong, 9, 1)) conn.prepare(`UPDATE assessment_attempts SET kind = 'final' WHERE id = ?`).run(id);
      for (const id of lay(ke, 7, 1)) conn.prepare(`UPDATE assessment_attempts SET status = 'cancelled' WHERE id = ?`).run(id);
      for (const id of lay(ke, 7, 2)) conn.prepare(`UPDATE assessment_attempts SET kind = 'mt0' WHERE id = ?`).run(id);
      for (const id of lay(ke, 7, 3)) conn.prepare(`UPDATE attempt_skills SET sit_status = 'cancelled' WHERE attempt_id = ?`).run(id);
      for (const id of lay(ke, 7, 4)) conn.prepare(`UPDATE assessment_attempts SET planned_period_id = NULL WHERE id = ?`).run(id);
      for (const id of lay(ke, 7, 5)) conn.prepare(`UPDATE assessment_attempts SET lich_su = 1 WHERE id = ?`).run(id);
      for (const id of lay(xong, 9, 2)) conn.prepare(`UPDATE assessment_attempts SET status = 'cancelled' WHERE id = ?`).run(id);
      conn.prepare(`UPDATE learning_cycles SET status = 'completed' WHERE id IN (SELECT id FROM learning_cycles WHERE status = 'active' ORDER BY id LIMIT 4)`).run();
      const r2 = soHvl();
      const d = r2.dem;
      assert(!r2.sai.length && d.kh && d.cuoi && d.moc && d.mt && d.xong && d.tong && d.khongCy, `dữ liệu biên: ${JSON.stringify(d)} · lệch ${r2.sai.slice(0, 4).join(' | ')}`);
    });
  });

  check('S3-b2 · EXPLAIN: câu học viên của trang đọc lượt của lộ trình MỘT lần mỗi em (một câu con trên assessment_attempts, trước sáu), đi chỉ mục cycle_id — không SCAN bảng lớn', () => {
    const p = nguoi().find((x) => x.roleKeys.includes('system_admin')) ?? nguoi()[0];
    const r = ghiCau(/AS lop_route/, () => hvl.danhSachHocVienLop(p, {}));
    assert(r.cau.length === 1, `bắt câu: ${r.cau.length}`);
    const ke = keHoach(r.cau[0]);
    const luot = ke.filter((x) => /^SEARCH a USING/.test(x.detail));
    assert(luot.length === 1 && /\(cycle_id=\?\)/.test(luot[0].detail) && !quetLon(r.cau[0]).length, `kế hoạch: ${ke.map((x) => x.detail).join(' | ')}`);
  });

  // ------------------------------------------------------------------ (c) phụ liệu dòng Case
  /** Bản cũ (TD7): đọc cả ba bảng, chọn dòng đầu theo ORDER BY — giữ ở đây để so. */
  const phuCu = () => {
    const latest = new Map<number, number>();
    for (const r of all(`SELECT case_id, MAX(attempt_no) AS n FROM case_milestones WHERE attempt_no IS NOT NULL GROUP BY case_id`)) latest.set(r.case_id, r.n);
    const plan = new Map<number, any>();
    for (const r of all(`SELECT case_id, kind, description, action_due FROM case_interventions WHERE status IN ('planned','started') AND COALESCE(approval_state,'') != 'pending' ORDER BY id DESC`)) {
      if (!plan.has(r.case_id)) plan.set(r.case_id, { kind: r.kind, description: r.description, due: r.action_due });
    }
    const kq = new Map<number, any>();
    for (const r of all(`SELECT case_id, outcome, next_step, observed_on FROM case_followups WHERE outcome IS NOT NULL ORDER BY observed_on DESC, id DESC`)) {
      if (!kq.has(r.case_id)) kq.set(r.case_id, { outcome: r.outcome, nextStep: r.next_step, on: r.observed_on });
    }
    return { latest, plan, kq };
  };
  const soPhu = () => {
    const cu = phuCu();
    const ids = all(`SELECT id FROM sos_cases ORDER BY id`).map((r) => r.id as number);
    const sai: string[] = [];
    const so = (m: any, ds: number[], nhan: string) => {
      for (const id of ds) {
        if (JSON.stringify(m.latestAttemptByCase.get(id)) !== JSON.stringify(cu.latest.get(id))) sai.push(`${nhan} lượt mới nhất Case ${id}`);
        if (JSON.stringify(m.planOf.get(id)) !== JSON.stringify(cu.plan.get(id))) sai.push(`${nhan} PA Case ${id}`);
        if (JSON.stringify(m.lastResultOf.get(id)) !== JSON.stringify(cu.kq.get(id))) sai.push(`${nhan} kết quả Case ${id}`);
      }
      for (const k of [...m.latestAttemptByCase.keys(), ...m.planOf.keys(), ...m.lastResultOf.keys()]) if (!ds.includes(k)) sai.push(`${nhan} thừa Case ${k}`);
    };
    xoaNho();
    so(cs.phuDsCase(ids), ids, 'cả DB');
    /* Trong MỘT request: tập nhỏ trước, rồi tập khác chồng lên, rồi cả DB — không trả thiếu / thừa phụ liệu. */
    trongBoNho(() => {
      const nho1 = ids.filter((id) => id % 3 === 0), nho2 = ids.filter((id) => id % 2 === 0);
      so(cs.phuDsCase(nho1), nho1, 'nhớ-1');
      so(cs.phuDsCase(nho2), nho2, 'nhớ-2');
      so(cs.phuDsCase(ids), ids, 'nhớ-cả');
      so(cs.phuDsCase([]), [], 'rỗng');
    });
    /* Danh sách Case qua `listCases`: trong một request gọi theo em / lớp / chi nhánh trước rồi cả phạm vi = gọi riêng từng lần. */
    let soDong = 0;
    for (const p of nguoi()) {
      const loc: any[] = [{}, { status: 'open' }, ...chiNhanh.map((b) => ({ branchId: b }))];
      xoaNho();
      const rieng = loc.map((f) => JSON.stringify(cs.listCases(p, f).rows));
      const chung = trongBoNho(() => {
        const sv = cs.listCases(p, {}).rows[0]?.studentId;
        if (sv) cs.listCases(p, { studentId: sv });
        return loc.slice().reverse().map((f) => JSON.stringify(cs.listCases(p, f).rows)).reverse();
      });
      loc.forEach((f, i) => { if (rieng[i] !== chung[i]) sai.push(`listCases u${p.userId} ${JSON.stringify(f)}`); });
      for (const r of JSON.parse(rieng[0])) {
        soDong++;
        if ((r.currentPlanDue ?? null) !== (cu.plan.get(r.id)?.due ?? null) || (r.lastOutcome ?? null) !== (cu.kq.get(r.id)?.outcome ?? null)
            || (r.lastOutcomeOn ?? null) !== (cu.kq.get(r.id)?.on ?? null) || (r.lastNextStep ?? null) !== (cu.kq.get(r.id)?.nextStep ?? null)) sai.push(`dòng Case ${r.id} u${p.userId}`);
      }
    }
    return { sai, soDong, coPa: cu.plan.size, coKq: cu.kq.size, coLuot: cu.latest.size };
  };
  check('S3-c · phụ liệu dòng Case chỉ của Case đang trả = bản đọc cả bảng cũ — mọi Case, nhớ chồng nhiều tập trong một request, listCases mọi người dùng × bộ lọc (+ PA / kết quả hoà ngày, nhiều PA)', () => {
    const r1 = soPhu();
    assert(!r1.sai.length && r1.soDong > 20 && r1.coPa && r1.coKq && r1.coLuot, `DB kiểm: ${JSON.stringify({ ...r1, sai: r1.sai.slice(0, 4) })}`);
    giaoDich(() => {
      /* Nhân bản dòng (id mới lớn hơn): PA đang chạy thứ hai, kết quả cùng ngày với dòng cũ → phải chọn dòng id lớn nhất như ORDER BY cũ. */
      const nhanBan = (bang: string, id: number, doi: Record<string, unknown>) => {
        const cot = all(`PRAGMA table_info(${bang})`).map((c) => c.name as string).filter((c) => c !== 'id' && c !== 'idempotency_key');
        conn.prepare(`INSERT INTO ${bang} (${cot.join(',')}) SELECT ${cot.map((c) => (c in doi ? '?' : c)).join(',')} FROM ${bang} WHERE id = ?`)
          .run(...cot.filter((c) => c in doi).map((c) => doi[c]), id);
      };
      for (const r of all(`SELECT id FROM case_followups WHERE outcome IS NOT NULL ORDER BY id LIMIT 6`)) nhanBan('case_followups', r.id, { next_step: `S3 hoà ${r.id}` });
      for (const r of all(`SELECT id FROM case_interventions WHERE status IN ('planned','started') ORDER BY id LIMIT 4`)) nhanBan('case_interventions', r.id, { description: `S3 PA ${r.id}` });
      const r2 = soPhu();
      assert(!r2.sai.length, `dữ liệu biên: ${r2.sai.slice(0, 4).join(' | ')}`);
    });
  });

  check('S3-c2 · EXPLAIN: câu phụ liệu đi chỉ mục case_id của từng bảng (không SCAN case_milestones / case_interventions / case_followups)', () => {
    const r = ghiCau(/FROM case_milestones\s+WHERE case_id IN \(SELECT value FROM json_each/, () => cs.phuDsCase([1, 2, 3]));
    assert(r.cau.length === 1, `bắt câu: ${r.cau.length}`);
    const ke = (conn.prepare(`EXPLAIN QUERY PLAN ${r.cau[0]}`).all('[1,2,3]', '[1,2,3]', '[1,2,3]') as any[]).map((x) => x.detail).join(' | ');
    assert(!/SCAN case_/.test(ke) && /idx_milestone_case/.test(ke) && /idx_intervention_case/.test(ke) && /idx_followup_case/.test(ke), `kế hoạch: ${ke}`);
  });

  // ------------------------------------------------------------------ (d) attemptsNewestFirst
  /** Câu cũ (câu con theo từng lượt, lô 400 em như cũ) — giữ ở đây để so. */
  const luotCu = (tatCa: number[]) => {
    const out = new Map<number, any[]>();
    for (let i = 0; i < tatCa.length; i += 400) {
      const ids = tatCa.slice(i, i + 400);
      for (const r of all(
        /* PANEL-MC: `lop_nguong_dat` — câu mới mang thêm ngưỡng lớp (cột của `classes` đã nối), câu cũ dựng lại cùng cột để so. */
        `SELECT a.*, c.programme_code, c.nguong_dat AS lop_nguong_dat, pr.week_start AS period_start, pr.week_end AS period_end,
                (SELECT cy.route FROM learning_cycles cy WHERE cy.id = a.cycle_id) AS route, (SELECT cy.khong_cam_ket FROM learning_cycles cy WHERE cy.id = a.cycle_id) AS cy_kck,
                (SELECT cy.programme_code FROM learning_cycles cy WHERE cy.id = a.cycle_id) AS cy_programme_code,   /* LECH-KHONG-LOP: cột mới, dựng lại để so */
                (SELECT cy2.id FROM learning_cycles cy2 WHERE cy2.student_id = a.student_id AND cy2.status = 'active' AND cy2.route IS NOT NULL ORDER BY cy2.id DESC LIMIT 1) AS cy_ft_dang_chay,
                ${CO_DIEM_SQL('a')} AS _co_diem
           FROM assessment_attempts a LEFT JOIN classes c ON c.id = a.class_id LEFT JOIN report_periods pr ON pr.id = a.planned_period_id
          WHERE a.student_id IN (${ids.map(() => '?').join(',')}) AND a.status != 'cancelled'`, ...ids)) {
        if (!out.has(r.student_id)) out.set(r.student_id, []);
        out.get(r.student_id)!.push(r);
      }
    }
    return out;
  };
  const soLuot = () => {
    const ids = all(`SELECT id FROM students ORDER BY id`).map((r) => r.id as number);
    const sai: string[] = [];
    const theoId = (ds: any[]) => JSON.stringify([...ds].sort((x, y) => x.id - y.id));
    /* Thêm id không có em ở đầu để chắc có hơn một lô 400 (tham số câu mới gấp đôi) dù DB nhỏ. */
    const gia = Array.from({ length: 450 }, (_, i) => 10_000_000 + i);
    for (const tap of [ids, ids.slice().reverse(), ids.filter((id) => id % 4 === 1), [...gia.slice(0, 300), ...ids.slice().reverse(), ...gia.slice(300)]]) {
      xoaNho();
      const moi = dg.attemptsNewestFirst(tap) as Map<number, any[]>;
      const cu = luotCu(tap);
      if (JSON.stringify([...moi.keys()]) !== JSON.stringify([...cu.keys()])) sai.push(`thứ tự em (${tap.length})`);
      for (const [sid, ds] of cu) if (theoId(ds) !== theoId(moi.get(sid) ?? [])) sai.push(`em ${sid}`);
    }
    const ft = [...luotCu(ids).values()].flat().filter((r) => r.cy_ft_dang_chay).length;
    return { sai, ft };
  };
  check('S3-d · attemptsNewestFirst: lộ trình nối + lộ trình FT một lần mỗi em = câu con theo từng lượt cũ — mọi em, nhiều tập / thứ tự (+ hai lộ trình FT đang chạy, lộ trình hết FT / đóng)', () => {
    const r1 = soLuot();
    assert(!r1.sai.length && r1.ft > 20, `DB kiểm: lượt có lộ trình FT ${r1.ft} · lệch ${r1.sai.slice(0, 4).join(' | ')}`);
    giaoDich(() => {
      conn.prepare(`UPDATE learning_cycles SET route = NULL WHERE id IN (SELECT id FROM learning_cycles WHERE route IS NOT NULL ORDER BY id LIMIT 3)`).run();
      conn.prepare(`UPDATE learning_cycles SET status = 'completed' WHERE id IN (SELECT id FROM learning_cycles WHERE status = 'active' AND route IS NOT NULL ORDER BY id DESC LIMIT 3)`).run();
      /* Em có lộ trình cũ đã đóng → mở lại cùng lúc với lộ trình đang chạy (nếu ràng buộc cho phép): phải chọn id lớn nhất. */
      try {
        conn.prepare(`UPDATE learning_cycles SET status = 'active', route = COALESCE(route, 'A') WHERE id IN (SELECT o.id FROM learning_cycles o
          WHERE o.status != 'active' AND EXISTS (SELECT 1 FROM learning_cycles n WHERE n.student_id = o.student_id AND n.status = 'active' AND n.id > o.id) ORDER BY o.id LIMIT 3)`).run();
      } catch { /* ràng buộc một lộ trình đang chạy — bỏ tình huống này */ }
      const r2 = soLuot();
      assert(!r2.sai.length, `dữ liệu biên: ${r2.sai.slice(0, 4).join(' | ')}`);
    });
  });

  check('S3-d2 · EXPLAIN: câu lượt không còn câu con tương quan trên learning_cycles, không SCAN bảng lớn', () => {
    xoaNho();
    const ids = all(`SELECT id FROM students ORDER BY id LIMIT 50`).map((r) => r.id as number);
    const r = ghiCau(/FROM assessment_attempts a\s+LEFT JOIN classes c ON c.id = a.class_id/, () => dg.attemptsNewestFirst(ids));
    assert(r.cau.length === 1, `bắt câu: ${r.cau.length}`);
    const ke = keHoach(r.cau[0]);
    const cha = new Map(ke.map((x) => [x.id, x]));
    const conCy = ke.filter((x) => /learning_cycles|cy2?\b/.test(x.detail) && /CORRELATED/.test(cha.get(x.parent)?.detail ?? ''));
    assert(!conCy.length && !quetLon(r.cau[0]).length, `kế hoạch: ${ke.map((x) => x.detail).join(' | ')}`);
  });
}
