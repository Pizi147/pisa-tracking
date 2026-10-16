/**
 * PHÉP KIỂM PR-OV12d (chủ SP 14/10) — Tổng hợp nhóm Xử lý ba cột HV - Case · Chờ duyệt · Đang xử lý (xong / huỷ chỉ nằm trong tổng HV - Case;
 * Tổng quan "Case chờ duyệt" cùng MỘT hàm `xuLyCaseMany`) + hồ sơ MT khối "Case & phương án" (Case theo `sc.attempt_id` + mốc lặp; quyền xem như
 * hiện có: GV chấm chéo, Admin không có khối). Ca nào ghi DB thì dựng trong một giao dịch rồi cuộn lại (`thu`).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrOv12dTests(t: YThucTestKit) {
  const { check, assert, conn, P, classId } = t;
  const dm: any = await import('../../../shared/domain/index.ts');
  const tongHopSvc: any = await import('../phanTich/tongHop.ts');
  const metrics: any = await import('../worklist/metrics.ts');
  const attempts: any = await import('../fasttrack/attempts.ts');
  const accounts: any = await import('../platform/accounts.ts');
  const hocVienSos: any = await import('../classes/hocVienSos.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nPR-OV12d · Tổng hợp nhóm Xử lý 3 cột · hồ sơ MT khối Case & phương án');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const ids = (o: { rows: { id: number }[] }) => new Set(o.rows.map((r) => r.id));
  const BO = (ct: 'ft' | 'thuong') => ({ branchId: null, ct, soTuan: 52, classId: null, theo: 'tuan' as const });
  const oCua = (p: any, ct: 'ft' | 'thuong', khoa: string, cot: string) => tongHopSvc.oTongHop(p, { ...BO(ct), khoa, cot });
  const dong = (kq: any) => [...kq.hang.flatMap((h: any) => [h, ...(h.con ?? [])]), { khoa: 'tong', o: kq.tong }];

  check('OV12d (1) · cotXuLy: Chờ duyệt = 4 trạng thái chờ + Đang làm chưa có PA theo dõi · Đang xử lý = có PA theo dõi · xong / huỷ riêng', () => {
    for (const k of ['cho-nguyen-nhan', 'cho-nhan-xet', 'cho-duyet-khong-theo-doi', 'cho-xac-nhan-pa']) {
      assert(dm.cotXuLy(k, true) === 'choDuyet' && dm.cotXuLy(k, false) === 'choDuyet', `${k} → Chờ duyệt (kể cả khi có PA khác đang chạy)`);
    }
    assert(dm.cotXuLy('dang-lam', true) === 'dangLam', 'Đang làm + PA theo dõi → Đang xử lý');
    assert(dm.cotXuLy('dang-lam', false) === 'choDuyet', 'Đang làm chưa có PA theo dõi (chưa có PA / PA chờ QL duyệt) → Chờ duyệt');
    for (const k of ['xong', 'huy-khong-theo-doi', 'he-thong-dong', 'rut-sua-diem']) assert(dm.cotXuLy(k, true) === 'xongHuy', `${k} → xong / huỷ`);
  });

  check('OV12d (2) · nhóm Xử lý chỉ còn HV - Case · Chờ duyệt · Đang xử lý (FT + lớp thường); số liệu thô HV có Case · Case · Chờ duyệt · Đang xử lý', () => {
    for (const ct of ['ft', 'thuong'] as const) {
      const xl = dm.cotTongHopFor(ct).filter((c: any) => c.nhom === 'xu-ly');
      assert(xl.map((c: any) => c.nhan(ct)).join(' · ') === 'HV - Case · Chờ duyệt · Đang xử lý', `[${ct}] ${xl.map((c: any) => c.nhan(ct)).join(' · ')}`);
      const so = dm.cotSoLieu(ct).filter((c: any) => c.nhom === 'xu-ly').map((c: any) => c.khoa).join();
      assert(so === 'hvCoCase,case,choDuyet,dangLam', `[${ct}] ${so}`);
    }
  });

  check('OV12d (3) · Tổng hợp: mỗi dòng Case = Chờ duyệt + Đang xử lý + xong / huỷ; bấm số ra đúng số dòng; ⚠ quá hạn ≤ Chờ duyệt', () => {
    let coCho = 0, coDang = 0, coXong = 0;
    for (const ct of ['ft', 'thuong'] as const) {
      const kq = tongHopSvc.tongHop(P.mbManager, BO(ct));
      assert(!kq.cot.includes('xongHuy') && !kq.cot.includes('choNguyenNhan'), `[${ct}] còn cột cũ: ${kq.cot.join()}`);
      for (const r of dong(kq)) {
        const tap = ids(oCua(P.mbManager, ct, r.khoa, 'case'));
        const cho = ids(oCua(P.mbManager, ct, r.khoa, 'choDuyet'));
        const dang = ids(oCua(P.mbManager, ct, r.khoa, 'dangLam'));
        assert(cho.size === (r.o.choDuyet ?? 0) && dang.size === (r.o.dangLam ?? 0) && tap.size === r.o.case, `[${ct}] ${r.khoa}: số ≠ dòng panel`);
        assert([...cho].every((id) => tap.has(id) && !dang.has(id)) && [...dang].every((id) => tap.has(id)), `[${ct}] ${r.khoa}: Chờ duyệt / Đang xử lý chồng nhau hoặc ngoài HV - Case`);
        const conLai = [...tap].filter((id) => !cho.has(id) && !dang.has(id));
        if (conLai.length) {
          const mo = all(`SELECT id FROM sos_cases WHERE id IN (${conLai.map(() => '?').join(',')}) AND status != 'done' AND dismiss_reason_code IS NULL
              AND system_close_reason IS NULL`, ...conLai);
          assert(!mo.length, `[${ct}] ${r.khoa}: Case đang mở rơi khỏi cả hai cột: ${mo.map((x) => x.id).join()}`);
        }
        assert(r.o.case === r.o.choDuyet + r.o.dangLam + conLai.length, `[${ct}] ${r.khoa}: Case ${r.o.case} ≠ ${r.o.choDuyet} + ${r.o.dangLam} + ${conLai.length}`);
        assert((r.o.choDuyetQuaHan ?? 0) <= r.o.choDuyet, `[${ct}] ${r.khoa}: quá hạn > Chờ duyệt`);
        if (r.khoa === 'tong') { coCho += r.o.choDuyet; coDang += r.o.dangLam; coXong += conLai.length; }
      }
    }
    assert(coCho > 0 && coDang > 0 && coXong > 0, `dữ liệu demo phải có đủ ba nhóm (chờ ${coCho} · đang ${coDang} · xong/huỷ ${coXong})`);
  });

  check('OV12d (4) · Tổng quan "Case chờ duyệt" / "quá hạn" cùng luật với cột Chờ duyệt / ⚠ của Tổng hợp (MỘT hàm) trên mọi Case có mặt ở cả hai', () => {
    /* Hai nơi khác phạm vi (Tổng hợp theo lớp của lượt, Tổng quan theo lớp em đang học) — so trên Case mở có mặt ở cả hai. */
    const mo = new Set<number>(metrics.metricSet(P.mbManager, 'case-mo', {}).ids);
    const cho = new Set<number>(metrics.metricSet(P.mbManager, 'case-cho-xac-dinh-nguyen-nhan', {}).ids);
    const qua = new Set<number>(metrics.metricSet(P.mbManager, 'case-xac-dinh-nguyen-nhan-qua-han', {}).ids);
    assert([...qua].every((id) => cho.has(id)), 'quá hạn phải là tập con của chờ duyệt');
    let chung = 0, quaTh = 0;
    for (const ct of ['ft', 'thuong'] as const) {
      const choTh = ids(oCua(P.mbManager, ct, 'tong', 'choDuyet'));
      const ca = [...ids(oCua(P.mbManager, ct, 'tong', 'case'))].filter((id) => mo.has(id));
      chung += ca.length;
      const lech = ca.filter((id) => choTh.has(id) !== cho.has(id));
      assert(!lech.length, `[${ct}] Tổng quan / Tổng hợp xếp khác nhóm: ${lech.join()}`);
      quaTh += ca.filter((id) => qua.has(id)).length;
    }
    assert(chung > 0 && cho.size > 0, `dữ liệu: ${chung} Case chung, ${cho.size} chờ duyệt`);
    assert(quaTh <= cho.size, 'quá hạn');
    assert(dm.metricById('case-cho-xac-dinh-nguyen-nhan').ten === 'Case chưa có PA', dm.metricById('case-cho-xac-dinh-nguyen-nhan').ten);
  });

  check('OV12d (5) · Case đổi cột theo PA: huỷ hết PA của Case Đang xử lý → Chờ duyệt (chưa có PA); xác nhận PA quy chế → Đang xử lý', () => {
    const dang = [...ids(oCua(P.mbManager, 'ft', 'tong', 'dangLam'))][0];
    const choPa = one(`SELECT iv.case_id, iv.id FROM case_interventions iv JOIN sos_cases sc ON sc.id = iv.case_id
        WHERE iv.preset = 1 AND iv.confirmed_at IS NULL AND iv.status = 'planned' AND iv.kind != 'bo_tro' AND sc.status != 'done'
          AND EXISTS (SELECT 1 FROM case_issues ci WHERE ci.case_id = sc.id AND ci.role = 'primary')
          AND NOT EXISTS (SELECT 1 FROM yeu_cau_duyet y WHERE y.loai = 'khong_theo_doi' AND y.doi_tuong_id = sc.id AND y.trang_thai = 'cho')
          AND sc.id IN (${[...ids(oCua(P.mbManager, 'ft', 'tong', 'choDuyet'))].join(',') || 0}) ORDER BY iv.id LIMIT 1`);
    assert(dang && choPa, `dữ liệu demo: Case Đang xử lý ${dang} · Case chờ xác nhận PA ${choPa?.case_id}`);
    thu(() => {
      conn.prepare(`UPDATE case_interventions SET status = 'cancelled' WHERE case_id = ?`).run(dang);
      conn.prepare(`UPDATE case_interventions SET confirmed_at = '2026-09-10T00:00:00Z', confirmed_by = ? WHERE case_id = ? AND preset = 1`).run(P.mbManager.userId, choPa.case_id);
      xoaNho();
      const cho = ids(oCua(P.mbManager, 'ft', 'tong', 'choDuyet')), dl = ids(oCua(P.mbManager, 'ft', 'tong', 'dangLam'));
      assert(cho.has(dang) && !dl.has(dang), 'Case hết PA phải về Chờ duyệt');
      assert(dl.has(choPa.case_id) && !cho.has(choPa.case_id), 'PA quy chế đã xác nhận → Đang xử lý');
    });
  });

  check('OV12d (8) · chủ SP chọn A: Progress đã Xác nhận Case mà Bổ trợ chưa chạy · PA xong hết chưa Hoàn thành Case → Chờ duyệt, CÙNG nhóm ở Tổng hợp và panel một em (/hoc-vien-lop/em/:id)', () => {
    const dangFt = [...ids(oCua(P.mbManager, 'ft', 'tong', 'dangLam'))][0];
    const thuong = all(`SELECT sc.id FROM sos_cases sc WHERE sc.status != 'done' AND sc.dismiss_reason_code IS NULL AND sc.system_close_reason IS NULL
        AND sc.id IN (${[...ids(oCua(P.mbManager, 'thuong', 'tong', 'case'))].join(',') || 0}) ORDER BY sc.id LIMIT 1`)[0]?.id;
    assert(dangFt && thuong, `dữ liệu demo: Case FT Đang xử lý ${dangFt} · Case lớp thường mở ${thuong}`);
    thu(() => {
      const now = new Date().toISOString();
      /* (a) Progress: có nguyên nhân (đã Xác nhận Case), PA Bổ trợ điền sẵn chưa chạy, không PA nào khác. */
      conn.prepare(`UPDATE case_interventions SET status = 'cancelled' WHERE case_id = ?`).run(thuong);
      conn.prepare(`INSERT INTO case_interventions (case_id, kind, status, preset, created_at) VALUES (?, 'bo_tro', 'planned', 1, ?)`).run(thuong, now);
      if (!one(`SELECT 1 FROM case_issues WHERE case_id = ? AND role = 'primary'`, thuong)) {
        conn.prepare(`INSERT INTO case_issues (case_id, role, taxonomy_code, created_at) VALUES (?, 'primary', 'student.reading.logic', ?)`).run(thuong, now);
      }
      /* (b) FT: mọi PA đã xong, Case chưa Hoàn thành. */
      conn.prepare(`UPDATE case_interventions SET status = 'completed' WHERE case_id = ? AND status != 'cancelled'`).run(dangFt);
      xoaNho();
      for (const [ct, id] of [['thuong', thuong], ['ft', dangFt]] as const) {
        assert(ids(oCua(P.mbManager, ct, 'tong', 'choDuyet')).has(id) && !ids(oCua(P.mbManager, ct, 'tong', 'dangLam')).has(id), `[${ct}] Case ${id} phải ở Chờ duyệt Tổng hợp`);
        const em = one('SELECT COALESCE(sc.student_id, a.student_id) s FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id WHERE sc.id = ?', id).s;
        const c = hocVienSos.panelMotEm(P.mbManager, em).cases.find((x: any) => x.id === id);
        assert(c?.nhom === 'cho-duyet', `[${ct}] panel một em: ${JSON.stringify(c?.nhom)}`);
      }
    });
  });

  /* ------------------------------------------------------------------ hồ sơ MT */
  const lop = classId('MB FT 101');
  const luot = one(`SELECT a.id, a.student_id, a.attempt_no FROM assessment_attempts a JOIN sos_cases sc ON sc.attempt_id = a.id
      WHERE a.kind = 'mock' AND a.class_id = ? AND a.status != 'cancelled'
        AND EXISTS (SELECT 1 FROM assessment_attempts b WHERE b.student_id = a.student_id AND b.kind = 'mock' AND b.attempt_no < a.attempt_no)
      GROUP BY a.id ORDER BY a.id LIMIT 1`, lop);

  check('OV12d (6) · hồ sơ MT: khối Case = Case sinh từ lượt (sc.attempt_id) + Case trượt lại ở lượt (mốc lặp, "lặp từ MTn"); có PA + trạng thái + việc tiếp', () => {
    assert(luot, 'dữ liệu demo: lượt MT có Case ở MB FT 101 (em có lượt trước)');
    const goc = all('SELECT id FROM sos_cases WHERE attempt_id = ? ORDER BY id', luot.id).map((r) => r.id as number);
    const d = attempts.attemptDetail(P.mbManager, luot.id);
    assert(Array.isArray(d.caseLuot), `QL phải có khối Case: ${JSON.stringify(d.caseLuot)}`);
    assert(goc.every((id) => d.caseLuot.some((c: any) => c.id === id)), `thiếu Case của lượt: ${goc.join()} / ${d.caseLuot.map((c: any) => c.id).join()}`);
    const c0 = d.caseLuot.find((c: any) => c.id === goc[0]);
    assert(c0.trangThai?.k && Array.isArray(c0.pas) && c0.tieuDe && c0.lapTu === null, `dòng Case thiếu trường: ${JSON.stringify(c0)}`);
    thu(() => {
      const truoc = one(`SELECT id, attempt_no FROM assessment_attempts WHERE student_id = ? AND kind = 'mock' AND attempt_no < ? ORDER BY attempt_no LIMIT 1`, luot.student_id, luot.attempt_no);
      const now = new Date().toISOString();
      const lap = Number(conn.prepare(`INSERT INTO sos_cases (attempt_id, student_id, category, topic, status, sos_level, created_at, detected_at)
          VALUES (?, ?, 'reading', 'reading', 'in_progress', 1, ?, '2026-09-01')`).run(truoc.id, luot.student_id, now).lastInsertRowid);
      conn.prepare(`INSERT INTO case_milestones (case_id, kind, attempt_id, attempt_no, occurred_on, created_at) VALUES (?, 'repeat', ?, ?, '2026-09-10', ?)`)
        .run(lap, luot.id, luot.attempt_no, now);
      const khac = Number(conn.prepare(`INSERT INTO sos_cases (attempt_id, student_id, category, topic, status, sos_level, created_at, detected_at)
          VALUES (?, ?, 'listening', 'listening', 'in_progress', 1, ?, '2026-09-01')`).run(truoc.id, luot.student_id, now).lastInsertRowid);
      xoaNho();
      const ds = attempts.attemptDetail(P.mbManager, luot.id).caseLuot;
      const x = ds.find((c: any) => c.id === lap);
      assert(x && x.lapTu === truoc.attempt_no, `Case trượt lại phải có mặt, lapTu = MT${truoc.attempt_no}: ${JSON.stringify(x)}`);
      assert(!ds.some((c: any) => c.id === khac), 'Case của lượt khác (không mốc lặp ở lượt này) không thuộc khối');
    });
  });

  check('OV12d (7) · hồ sơ MT quyền: GV chấm chéo Speaking (xem lượt để chấm) và Admin không có khối Case; GV lớp có', () => {
    const ft102 = classId('MB FT 102');
    const trang = P.sTeacher.userId;
    const luot102 = one(`SELECT a.id FROM assessment_attempts a JOIN sos_cases sc ON sc.attempt_id = a.id WHERE a.class_id = ? AND a.kind = 'mock' LIMIT 1`, ft102)?.id;
    assert(luot102, 'dữ liệu demo: lượt MT có Case ở MB FT 102');
    thu(() => {
      conn.prepare(`UPDATE teacher_assignments SET status = 'ended' WHERE user_id = ? AND class_id = ? AND status = 'active'`).run(trang, ft102);
      xoaNho();
      const d = attempts.attemptDetail(loadPrincipal(trang), luot102);   // vẫn xem lượt được (đường chấm chéo)
      assert(d.caseLuot === null, `GV chấm chéo không được thấy Case: ${JSON.stringify(d.caseLuot)?.slice(0, 120)}`);
      const admin = accounts.createAccount(P.admin, { email: `ov12d.admin${accounts.EMAIL_SUFFIX}`, password: 'matkhau-ov12d', fullName: 'Thử OV12d Admin',
        roles: [{ role: 'office_admin', branches: ['MB'] }] }).userId as number;
      assert(attempts.attemptDetail(loadPrincipal(admin), luot.id).caseLuot === null, 'Admin không có khối Case');
      assert(Array.isArray(attempts.attemptDetail(P.coreTeacher, luot.id).caseLuot), 'GVCN lớp có khối Case');
    });
  });
}
