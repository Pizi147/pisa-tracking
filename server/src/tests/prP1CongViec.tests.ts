/**
 * P1-CONG-VIEC (rà toàn bộ 11/11, chủ SP "sửa lỗi P1 luôn"): MỘT tập việc, MỘT hàm đếm cho mọi nơi.
 * G5-01 "Chốt lộ trình" là việc CỦA QL (người chốt được) · G2-02 hồ sơ HV không giao "Xác nhận PA" cho Case đang chờ QL duyệt không theo dõi ·
 * G2-03 hồ sơ HV chỉ đưa "Ghi kết quả PA" từ hạn − 2 (như Công việc) · dải "Việc của tôi" hồ sơ lớp đếm DÒNG (`demDongViec`), số lớp ≤ số tổng.
 */
export async function runPrP1CongViecTests(t: any) {
  const { check, assert, conn, P } = t;
  console.log('\nP1-CONG-VIEC · một tập việc, một hàm đếm');
  const { myWork, nhanNhomViec } = await import('../worklist/mywork.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { studentProfile } = await import('../students/profile.ts');
  const vt: any = await import('../classes/viecTheoEm.ts');
  const { demDongViec, gopViecTheoLop } = await import('../../../shared/domain/index.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const nguoi = (email: string) => loadPrincipal((conn.prepare('SELECT id FROM users WHERE email = ?').get(email) as any).id);
  const GV = [nguoi('ha.tran.pisa@gmail.com'), nguoi('huong.do.pisa@gmail.com'), P.coreTeacher, P.subjectTeacher];

  check('G5-01 · Chốt lộ trình là việc CỦA QL — "Của tôi" có, badge / Quá hạn đếm, "Của GV" (Tất cả) không đẩy sang người khác', () => {
    xoaNho();
    const w: any = myWork(P.mbManager, {});
    const chot = w.items.filter((i: any) => i.group === 'chot_len_ft');
    assert(chot.length > 0, 'seed: QL MB phải có việc Chốt lộ trình');
    assert(chot.every((i: any) => i.mine), `mine: ${chot.map((i: any) => `${i.key}=${i.mine}`).join(', ')}`);
    const qh = chot.filter((i: any) => i.urgency === 'overdue').length;
    assert(qh > 0, 'seed 14/09: có Chốt lộ trình quá hạn');
    const quaHanKhac = demDongViec(w.dong.filter((d: any) => d.mine && d.group !== 'chot_len_ft' && d.urgency === 'overdue')).n;
    assert(w.summary.viecQuaHan === quaHanKhac + qh, `Quá hạn của tôi ${w.summary.viecQuaHan} ≠ ${quaHanKhac} + ${qh} Chốt lộ trình`);
    xoaNho();
    const tc: any = myWork(P.mbManager, { nguoi: 'tat-ca' });
    assert(tc.items.filter((i: any) => i.group === 'chot_len_ft').every((i: any) => i.mine), '"Tất cả": Chốt lộ trình vẫn của tôi');
  });

  check('G2-02 · hồ sơ HV: Case "Chờ Quản lý duyệt · không theo dõi" không có việc "Xác nhận PA" (như Công việc)', () => {
    const ca = all(`SELECT sc.id, sc.student_id, sc.owner_user_id FROM sos_cases sc JOIN case_interventions iv ON iv.case_id = sc.id
      WHERE iv.preset = 1 AND iv.confirmed_at IS NULL AND iv.status = 'planned' AND iv.kind != 'bo_tro' AND sc.status != 'done'
        AND EXISTS (SELECT 1 FROM yeu_cau_duyet y WHERE y.loai = 'khong_theo_doi' AND y.doi_tuong_loai = 'sos_case' AND y.doi_tuong_id = sc.id AND y.trang_thai = 'cho')`);
    assert(ca.length > 0, 'seed: có Case chờ QL duyệt không theo dõi còn PA chờ xác nhận');
    for (const c of ca) {
      const p = loadPrincipal(c.owner_user_id);
      xoaNho();
      const v = (studentProfile(p, c.student_id) as any).dauHoSo.viec;
      const viec = [...v.cuaBan, ...v.nguoiKhac] as any[];
      const thua = viec.filter((v) => v.loai === 'xac-nhan-pa' && v.caseId === c.id);
      assert(!thua.length, `Case ${c.id}: ${thua.map((v) => v.chu).join(', ')}`);
      assert(viec.some((v) => v.loai === 'cho-duyet' && v.caseId === c.id), `Case ${c.id}: còn dòng "chờ Quản lý duyệt"`);
    }
  });

  check('G2-03a · hồ sơ HV: việc Case / PA của tôi ⊆ Công việc (cùng khoá) — "Ghi kết quả PA" chỉ từ hạn − 2', () => {
    let so = 0;
    for (const p of GV) {
      xoaNho();
      const cv = new Set((myWork(p, {}) as any).items.filter((i: any) => i.mine).map((i: any) => i.key));
      const em = all(`SELECT DISTINCT COALESCE(sc.student_id, a.student_id) AS sid FROM sos_cases sc LEFT JOIN assessment_attempts a ON a.id = sc.attempt_id
        JOIN case_interventions iv ON iv.case_id = sc.id JOIN enrollments e ON e.student_id = COALESCE(sc.student_id, a.student_id) AND e.status = 'active'
        JOIN teacher_assignments ta ON ta.class_id = e.class_id AND ta.user_id = ? AND ta.status = 'active'
       WHERE sc.status != 'done' AND iv.status IN ('planned', 'started')`, p.userId).map((r) => r.sid as number);
      for (const sid of em) {
        xoaNho();
        let viec: any[];
        try { viec = (studentProfile(p, sid) as any).dauHoSo.viec.cuaBan; } catch (e: any) { if (e?.status === 403) continue; throw e; }
        for (const v of viec.filter((x) => (x.loai === 'ghi-ket-qua' || x.loai === 'xac-nhan-pa'))) {
          so++;
          assert(cv.has(v.key), `${p.fullName} · em ${sid}: hồ sơ có "${v.chu}" (${v.key}, hạn ${v.han}) mà Công việc không có`);
        }
      }
    }
    assert(so > 0, 'phép so quá ít');
  });

  check('G2-03b · dải "Việc của tôi" hồ sơ lớp = DÒNG việc (`demDongViec` của Công việc); số lớp ≤ số tổng Công việc', () => {
    let so = 0;
    for (const p of [...GV, P.normalCoreTeacher]) {
      xoaNho();
      const tong = (myWork(p, {}) as any).summary.viec as number;
      for (const { class_id } of all(`SELECT DISTINCT ta.class_id FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id AND c.status = 'active'
        WHERE ta.user_id = ? AND ta.status = 'active'`, p.userId)) {
        xoaNho();
        const r = vt.viecTheoEmCuaLop(p, class_id, { chiToi: true });
        assert(Array.isArray(r.dongToi), 'có dongToi');
        const n = demDongViec(gopViecTheoLop(r.cuaToi, nhanNhomViec)).n;
        assert(r.dongToi.length === n, `${p.fullName} lớp ${class_id}: ${r.dongToi.length} dòng ≠ demDongViec ${n}`);
        assert(r.dongToi.length <= tong, `${p.fullName} lớp ${class_id}: ${r.dongToi.length} > Công việc ${tong}`);
        so++;
      }
    }
    assert(so > 3, `phép so quá ít (${so})`);
  });
}
