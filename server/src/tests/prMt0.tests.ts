/**
 * PHÉP KIỂM PR-MT0 — lượt Mock số 0 cho em lớp thường lên FT (kế hoạch 2026-10-05-pr-mt0, đặc tả T5, T5b).
 * MT0 = MỘT dòng `assessment_attempts` `kind = 'mt0'`, `attempt_no = 0`, gắn khoá lớp thường đang chạy.
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrMt0Tests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, addDays } = t;
  console.log('\nPR-MT0 · lượt Mock số 0 (em lớp thường lên FT)');
  const week: any = await import('../platform/week.ts');
  const intake: any = await import('../classes/intake.ts');
  const regular: any = await import('../normal/regular.ts');
  const schedule: any = await import('../classes/schedule.ts');
  const standing: any = await import('../students/standing.ts');
  const hvl: any = await import('../classes/hocVienLop.ts');
  const transition: any = await import('../classes/transition.ts');
  const cuoiKhoa: any = await import('../normal/cuoiKhoa.ts');
  const tongQuan: any = await import('../worklist/tongQuan.ts');
  const metrics: any = await import('../worklist/metrics.ts');
  const tongHop: any = await import('../phanTich/tongHop.ts');
  const xuatMt: any = await import('../phanTich/xuatMt.ts');
  const attempts: any = await import('../fasttrack/attempts.ts');
  const dm: any = await import('../../../shared/domain/index.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const QL = P.mbManager;
  const MB = get(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const thu2 = (n: number) => addDays(week.mondayOf(TODAY), -7 * (n - 1));

  let seq = 0;
  /** Lớp thường `kind` đang ở tuần `tuan`, `soEm` em có ghi danh + khoá (Target `target`) + bài Giữa/Cuối khoá — mẫu `taoLop` của prK26. */
  const taoLop = (kind: 'FOU' | 'BE' | 'ELE' | 'PREFOU', tuan: number, soEm: number, target: number | null = 6) => {
    seq += 1;
    const lop = intake.createClass(P.admin, { code: `MB MT0-${seq}`, branchId: MB, kind, isFastTrack: false, startDate: thu2(tuan), startPeriodId: week.ensurePeriod(thu2(tuan)).id });
    const now = new Date().toISOString();
    const sids: number[] = [];
    for (let i = 0; i < soEm; i++) {
      const tag = `MT0-${seq}-${i}`;
      const sid = Number(conn.prepare(`INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', ?)`)
        .run(`PISA-${tag}`, `Học viên ${tag}`, `hoc vien ${tag.toLowerCase()}`, MB, now).lastInsertRowid);
      conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', ?, ?)`).run(sid, lop.id, thu2(tuan), now);
      conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, target_score, started_at, status, created_at) VALUES (?, 1, NULL, ?, ?, ?, 'active', ?)`)
        .run(sid, kind, target, thu2(tuan), now);
      sids.push(sid);
    }
    regular.planRegularTests(P.admin, lop.id);
    return { classId: lop.id as number, sids };
  };

  type Band = Partial<Record<'listening' | 'reading' | 'writing' | 'speaking', number>>;
  /**
   * Chèn THẲNG một MT0 vào khoá lớp thường đang chạy của em (không qua luồng ghi Lên FT) + 4 dòng kỹ năng ở tuần `tuan` + điểm band `band`.
   * Writing ghi W1 = W2 = band. Trả `attemptId`. Các task sau dùng lại.
   */
  const chenMt0Tho = (o: { sid: number; classId: number; tuan: string; band: Band }): number => {
    const now = new Date().toISOString();
    const cy = get(`SELECT id, target_score FROM learning_cycles WHERE student_id = ? AND status = 'active'`, o.sid);
    const pid = week.ensurePeriod(week.mondayOf(o.tuan)).id;
    const aid = Number(conn.prepare(
      `INSERT INTO assessment_attempts (cycle_id, student_id, attempt_no, kind, class_id, planned_period_id, plan_source, status, target_at_attempt, created_at)
       VALUES (?, ?, 0, 'mt0', ?, ?, 'auto', 'planned', ?, ?)`,
    ).run(cy.id, o.sid, o.classId, pid, cy.target_score, now).lastInsertRowid);
    for (const k of ['listening', 'reading', 'writing', 'speaking']) {
      conn.prepare(`INSERT INTO attempt_skills (attempt_id, skill, required, planned_period_id, plan_source, sit_status, created_at) VALUES (?,?,1,?, 'auto', 'scheduled', ?)`)
        .run(aid, k, pid, now);
    }
    for (const [k, b] of Object.entries(o.band)) {
      const o2 = k === 'writing' ? ['writing1', 'writing2'] : [k];
      for (const s of o2) conn.prepare('INSERT INTO assessment_scores (attempt_id, skill, band, nhap_dau_ngay) VALUES (?,?,?,?)').run(aid, s, b, TODAY);
    }
    return aid;
  };

  // ------------------------------------------------------------------ MT0-0 · MT0 không làm sai đếm
  check('MT0-0 · chèn MT0 W 3.0 (Target 6) + tính kết quả như khi nhập điểm → mọi số đếm / tín hiệu / chỉ số không đổi', () => {
    const l = taoLop('BE', 9, 2, 6);
    const [sid, sid2] = l.sids;   // sid: MT0 có điểm (W 3.0); sid2: MT0 chưa điểm (còn planned)
    const tuanFinal = schedule.classProgress(l.classId).finalWeekStart as string;
    assert(!!tuanFinal, 'tiền đề: lớp có tuần Final Test');
    const demEm = (bang: string) => get(`SELECT COUNT(*) n FROM ${bang} WHERE student_id IN (?, ?)`, sid, sid2).n as number;
    const chup = () => {
      const ds = hvl.danhSachHocVienLop(QL, { branchId: MB });
      return {
        standing: JSON.stringify([...standing.standingFor([sid, sid2]).values()]),
        hvlEm: JSON.stringify(ds.hocVien.filter((x: any) => x.id === sid || x.id === sid2)),
        hvlLop: JSON.stringify(ds.rows.find((x: any) => x.id === l.classId)),
        baiChuaLam: transition.transitionPlan(QL, l.classId).students.filter((x: any) => x.id === sid || x.id === sid2).map((x: any) => x.baiChuaLam).join(),
        cuoiKhoa: JSON.stringify([...cuoiKhoa.cuoiKhoaTheoHocVien(l.classId, [sid, sid2]).values()]),
        tongQuan: JSON.stringify(tongQuan.tongQuanQuanLy(QL, { branchId: MB })),
        metric: ['hv-sos-hien-tai', 'hv-duoi-ky-vong-mon', 'hv-co-case-mo', 'case-mo', 'bai-qua-han-nhap-diem', 'phoi-hop-luot-sos', 'do-phu-danh-gia']
          .map((id) => `${id}:${metrics.metricSet(QL, id, { branchId: MB }).n}`).join(' '),
        signal: demEm('case_signals'), cases: demEm('sos_cases'),
        phoiHop: get(`SELECT COUNT(*) n FROM sos_coordination_actions x JOIN assessment_attempts a ON a.id = x.attempt_id WHERE a.student_id IN (?, ?)`, sid, sid2).n,
        thongBao: get('SELECT COUNT(*) n FROM notifications').n,
        xuat: ['ft', 'thuong'].map((khung) => xuatMt.duLieuXuatMt(QL, {
          khung, chiNhanh: [MB], lop: [], thoiGian: { kieu: 'tuan', tu: addDays(tuanFinal, -70), den: addDays(tuanFinal, 14) }, chiDuDiem: false, cot: 'gon',
        }).dem.luot).join('/'),
        phanTich: ['ft', 'thuong'].map((ct) => JSON.stringify(tongHop.tongHop(QL, { branchId: MB, ct, soTuan: 12, theo: 'lop' }))).join('|'),
      };
    };
    const truoc = chup();
    const aid = chenMt0Tho({ sid, classId: l.classId, tuan: tuanFinal, band: { listening: 5, reading: 5, writing: 3, speaking: 5 } });
    attempts.refreshOutcome(QL, aid);   // đúng đường lưu điểm gọi sau mỗi ô
    chenMt0Tho({ sid: sid2, classId: l.classId, tuan: tuanFinal, band: {} });
    const sau = chup();
    const lech = Object.keys(truoc).filter((k) => (truoc as any)[k] !== (sau as any)[k]);
    assert(lech.length === 0, `lệch: ${lech.map((k) => `${k}\n   trước ${String((truoc as any)[k]).slice(0, 300)}\n   sau   ${String((sau as any)[k]).slice(0, 300)}`).join('\n')}`);
  });

  // ------------------------------------------------------------------ MT0-1 · luật thuần
  check('MT0-1 · hạn chấm, hạn chốt, tuần muộn nhất, kiểm tuần, SOS hiển thị, trạng thái, nhãn', () => {
    assert(dm.hanChamMt0('2026-10-19') === '2026-11-01', dm.hanChamMt0('2026-10-19'));
    assert(dm.hanChotLenFt('2026-10-19') === '2026-10-18', dm.hanChotLenFt('2026-10-19'));
    assert(dm.tuanMuonNhatMt0({ tuanBatDauFt: '2026-10-26', tuanCuoiKhoa: '2026-10-19' }) === '2026-11-02', 'có FT');
    assert(dm.tuanMuonNhatMt0({ tuanBatDauFt: null, tuanCuoiKhoa: '2026-10-19' }) === '2026-11-02', 'chưa FT');
    assert(dm.tuanMuonNhatMt0({ tuanBatDauFt: null, tuanCuoiKhoa: null }) === null, 'không gì');
    assert(/muộn nhất/.test(dm.kiemTuanMt0({ tuanMoi: '2026-11-09', tuanMuonNhat: '2026-11-02', tuanMt1: null }) ?? ''), 'muộn');
    assert(/trước MT1/.test(dm.kiemTuanMt0({ tuanMoi: '2026-11-02', tuanMuonNhat: '2026-11-02', tuanMt1: '2026-11-02' }) ?? ''), 'MT1');
    assert(dm.kiemTuanMt0({ tuanMoi: '2026-10-26', tuanMuonNhat: '2026-11-02', tuanMt1: '2026-11-30' }) === null, 'hợp lệ');
    const sos = dm.kyNangSosMt0({ writing: 4.0, listening: 5.0, reading: 4.5 }, 6.0);
    assert(JSON.stringify(sos) === JSON.stringify([{ skill: 'writing', band: 4 }]), JSON.stringify(sos));
    assert(dm.kyNangSosMt0({ writing: 3 }, null).length === 0, 'không Target');
    assert(dm.chipSosMt0({ skill: 'writing', band: 4 }) === 'W 4.0 SOS', dm.chipSosMt0({ skill: 'writing', band: 4 }));
    const tt = (o: any) => dm.trangThaiMt0({ status: 'planned', trongLoTrinhFt: false, huongFt: true, khoaDaDong: false, ...o });
    assert(tt({}) === 'cho' && tt({ status: 'cancelled', trongLoTrinhFt: true }) === 'huy' && tt({ trongLoTrinhFt: true, huongFt: false }) === 'dung'
      && tt({ huongFt: false }) === 'khong_dung' && tt({ khoaDaDong: true }) === 'khong_dung', 'trạng thái');
    assert(dm.nhanMt0('cho') === 'MT0' && dm.nhanMt0('khong_dung') === 'MT0 · không dùng', 'nhãn');
    assert(dm.coMt0('PREFOU', 'fast_track') === false && dm.coMt0('BE', 'fast_track') === true && dm.coMt0('FOU', 'hoc_lai') === false, 'coMt0');
    assert(dm.ATTEMPT_KIND_SHORT.mt0 === 'MT0' && dm.BASELINE_SOURCE_LABEL.mt0 === 'MT0', 'nhãn kind / nguồn đầu vào');
  });

  // ------------------------------------------------------------------ MT0-2 · chấm band, hạn Chủ nhật tuần sau, không tín hiệu
  const skillSch: any = await import('../fasttrack/skillSchedule.ts');
  const canCham: any = await import('../cham/canCham.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const profile: any = await import('../students/profile.ts');
  /** Gán GV bộ môn `skill` của lớp (lớp thường: `writing`, không W1/W2). */
  const ganGv = (classId: number, userId: number, skill: string | null, core = false) => {
    conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,?,?, '2026-01-01', 'active', ?)`)
      .run(userId, classId, skill, core ? 1 : 0, new Date().toISOString());
    return loadPrincipal(userId);
  };
  /** Một GV (vai `teacher`, MB) thứ `n` — chỉ cần id; quyền ở lớp mới do `ganGv` cấp. */
  const gvKhac = (n: number) => get(
    `SELECT ur.user_id AS id FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE r.key = 'teacher' AND ur.branch_id = ? ORDER BY ur.user_id LIMIT 1 OFFSET ?`, MB, n).id as number;
  check('MT0-2 · scoringModeOf band, bộ môn 4 kỹ năng IELTS, hạn = Chủ nhật tuần sau', () => {
    const l = taoLop('BE', 9, 1);
    assert(skillSch.scoringModeOf({ class_id: l.classId, kind: 'mt0' }) === 'band', 'band');
    assert(skillSch.scoringModeOf({ class_id: l.classId, kind: 'final', scoring_mode: 'ratio' }) === 'ratio', 'Final vẫn ratio');
    assert(skillSch.scoringModeOf({ class_id: l.classId, kind: 'mt0', scoring_mode: 'ratio' }) === 'band', 'MT0 thắng scoring_mode JOIN sẵn');
    assert(week.effectiveSkillDeadline({ mode: 'band', weekStart: '2026-10-19', mt0: true }).date === '2026-11-01', 'hạn MT0');
    assert(week.effectiveSkillDeadline({ mode: 'band', weekStart: '2026-10-19' }).date === '2026-10-28', 'hạn Mock giữ thứ Tư');
    const tuanFinal = schedule.classProgress(l.classId).finalWeekStart as string;
    const aid = chenMt0Tho({ sid: l.sids[0], classId: l.classId, tuan: tuanFinal, band: {} });
    const bo = skillSch.ensureSkillRows(aid).map((r: any) => r.skill).join();
    assert(bo === 'listening,reading,writing,speaking', bo);
    const ct = attempts.attemptDetail(QL, aid);
    const han = ct.skillSchedule.map((r: any) => r.deadline).join();
    assert(han === Array(4).fill(dm.hanChamMt0(tuanFinal)).join(), `hạn: ${han}`);
  });
  check('MT0-2 · lưu điểm W 3.0 qua đường lưu điểm thật (GV Writing lớp BE) → 0 tín hiệu / Case / Phối hợp / thông báo, không lỗi', () => {
    const l = taoLop('BE', 10, 1, 6)   // tuần 10/10 = tuần Final là tuần này;
    const sid = l.sids[0];
    const tuanFinal = schedule.classProgress(l.classId).finalWeekStart as string;
    const aid = chenMt0Tho({ sid, classId: l.classId, tuan: tuanFinal, band: {} });
    const gvW = ganGv(l.classId, gvKhac(3), 'writing');
    const thongBao = get('SELECT COUNT(*) n FROM notifications').n;
    attempts.saveScore(gvW, aid, 'writing1', { band: 3 });
    attempts.saveScore(gvW, aid, 'writing2', { band: 3 });
    for (const k of ['listening', 'reading', 'speaking']) attempts.saveScore(QL, aid, k, { band: 4 });
    assert(get('SELECT status FROM assessment_attempts WHERE id = ?', aid).status === 'done', 'đủ 4 kỹ năng → done');
    assert(get('SELECT COUNT(*) n FROM case_signals WHERE student_id = ?', sid).n === 0, 'tín hiệu');
    assert(get('SELECT COUNT(*) n FROM sos_cases WHERE student_id = ?', sid).n === 0, 'Case');
    assert(get('SELECT COUNT(*) n FROM sos_coordination_actions WHERE attempt_id = ?', aid).n === 0, 'Phối hợp');
    assert(get('SELECT COUNT(*) n FROM notifications').n === thongBao, 'thông báo');
  });
  const diemMt0Som = (aid: number) => conn.prepare('INSERT INTO assessment_scores (attempt_id, skill, band, nhap_dau_ngay) VALUES (?,?,?,?)').run(aid, 'listening', 3, TODAY);
  check('MT0-2 · Nhập điểm lớp BE `kind=mt0`: lưới band (ielts_band) chỉ các MT0; bảng thường Final không có MT0', () => {
    const l = taoLop('BE', 9, 2, 6);
    const tuanFinal = schedule.classProgress(l.classId).finalWeekStart as string;
    const aid = chenMt0Tho({ sid: l.sids[0], classId: l.classId, tuan: tuanFinal, band: {} });
    const s = canCham.chamSheet(QL, l.classId, { kind: 'mt0' });
    assert(s.mode === 'ielts_band' && s.ft?.rows.length === 1 && s.ft.rows[0].attemptId === aid, JSON.stringify({ mode: s.mode, n: s.ft?.rows.length }));
    diemMt0Som(aid);
    const r0 = canCham.chamSheet(QL, l.classId, { kind: 'mt0' }).ft.rows[0].result;
    assert(r0.expectation === null && r0.sosLevel === null, `lưới MT0 không kỳ vọng / mức SOS: ${r0.expectation} ${r0.sosLevel}`);
    const o = s.ft.rows[0].cells.find((c: any) => c.skill === 'writing1');
    assert(o?.deadline === dm.hanChamMt0(tuanFinal), `hạn ô W1: ${o?.deadline}`);
    const hs = profile.studentProfile(QL, l.sids[0]);
    assert(!hs.attempts.some((a: any) => a.kind === 'mt0'), 'hồ sơ HV lớp thường: bảng kết quả không có MT0');
    const fin = canCham.chamSheet(QL, l.classId, { kind: 'final' });
    assert(fin.mode === 'ratio' && !JSON.stringify(fin.thuong).includes(`"attemptId":${aid},`), 'Final không lẫn MT0');
  });

  // ------------------------------------------------------------------ MT0-3 · ghi Lên FT tạo / huỷ / mở lại MT0
  const loTrinh: any = await import('../classes/loTrinhTiep.ts');
  const mt0Svc: any = await import('../fasttrack/mt0.ts');
  const mt0Cua = (sid: number) => conn.prepare(`SELECT * FROM assessment_attempts WHERE student_id = ? AND kind = 'mt0'`).all(sid) as any[];
  const loi = (fn: () => unknown): any => { try { fn(); } catch (e) { return e; } return null; };
  const demCau = (fn: () => void): number => {
    let n = 0; const goc = conn.prepare.bind(conn);
    (conn as any).prepare = (sql: string) => { n += 1; return goc(sql); };
    try { fn(); } finally { (conn as any).prepare = goc; }
    return n;
  };
  check('MT0-3a/b · GVCN ghi Lên FT (Target 6.5) → đúng 1 MT0 tuần Final, 4 kỹ năng, 1 dòng hành trình; ghi lại → vẫn 1', () => {
    const l = taoLop('BE', 8, 1, 6);
    const gvcn = ganGv(l.classId, gvKhac(4), null, true);
    const sid = l.sids[0];
    const tuanFinal = schedule.classProgress(l.classId).finalWeekStart as string;
    const r = loTrinh.ghiLoTrinhTiep(gvcn, sid, { huong: 'fast_track', mucTieu: 6.5 });
    const ds = mt0Cua(sid);
    assert(ds.length === 1 && ds[0].attempt_no === 0 && ds[0].status === 'planned' && ds[0].target_at_attempt === 6.5, JSON.stringify(ds));
    assert(ds[0].cycle_id === get(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'`, sid).id, 'khoá lớp thường');
    const kn = conn.prepare(`SELECT k.skill, p.week_start FROM attempt_skills k JOIN report_periods p ON p.id = k.planned_period_id WHERE k.attempt_id = ?`).all(ds[0].id) as any[];
    assert(kn.length === 4 && kn.every((k: any) => k.week_start === tuanFinal), JSON.stringify(kn));
    assert(get(`SELECT COUNT(*) n FROM journey_events WHERE dedup_key = ?`, `mt0:${ds[0].id}:tao`).n === 1, 'hành trình');
    assert(r.mt0?.maTuan === dm.tuanLich(tuanFinal) && r.mt0.trangThai === 'cho', JSON.stringify(r.mt0));
    loTrinh.ghiLoTrinhTiep(gvcn, sid, { huong: 'fast_track', mucTieu: 7 });
    const lai = mt0Cua(sid);
    assert(lai.length === 1 && lai[0].id === ds[0].id && lai[0].target_at_attempt === 7, 'ghi lại: một MT0, Target theo bản ghi mới (chưa điểm)');
  });
  check('MT0-3c/d · đổi Học lại khi chưa điểm → huỷ; chọn lại Lên FT → mở lại cùng id; có điểm rồi đổi → giữ, "không dùng"', () => {
    const l = taoLop('FOU', 7, 1, 6);
    const sid = l.sids[0];
    loTrinh.ghiLoTrinhTiep(QL, sid, { huong: 'fast_track' });
    const id = mt0Cua(sid)[0].id;
    loTrinh.ghiLoTrinhTiep(QL, sid, { huong: 'hoc_lai' });
    const huy = mt0Cua(sid)[0];
    assert(huy.status === 'cancelled' && huy.cancel_reason === 'Bỏ hướng Lên FT', JSON.stringify(huy));
    assert(mt0Svc.mt0TheoHocVien([sid]).get(sid) === undefined, 'huỷ thì không còn MT0 hiện');
    loTrinh.ghiLoTrinhTiep(QL, sid, { huong: 'fast_track' });
    const mo = mt0Cua(sid);
    assert(mo.length === 1 && mo[0].id === id && mo[0].status === 'planned' && mo[0].cancel_reason === null, JSON.stringify(mo));
    conn.prepare('INSERT INTO assessment_scores (attempt_id, skill, band, nhap_dau_ngay) VALUES (?,?,?,?)').run(id, 'listening', 4, TODAY);
    loTrinh.ghiLoTrinhTiep(QL, sid, { huong: 'hoc_lai' });
    const v = mt0Svc.mt0TheoHocVien([sid]).get(sid);
    assert(mt0Cua(sid)[0].status === 'planned' && v?.trangThai === 'khong_dung' && v.coDiem, JSON.stringify(v));
    assert(get('SELECT COUNT(*) n FROM assessment_scores WHERE attempt_id = ?', id).n === 1, 'điểm còn nguyên');
    loTrinh.ghiLoTrinhTiep(QL, sid, { huong: 'fast_track' });
    assert(mt0Svc.mt0TheoHocVien([sid]).get(sid)?.trangThai === 'cho' && mt0Cua(sid).length === 1, 'quay lại Lên FT: chờ, không MT0 thứ hai');
  });
  check('MT0-3e · em Pre FOU Lên FT → không MT0', () => {
    const l = taoLop('PREFOU', 5, 1);
    loTrinh.ghiLoTrinhTiep(QL, l.sids[0], { huong: 'fast_track' });
    assert(mt0Cua(l.sids[0]).length === 0, 'Pre FOU');
  });
  check('MT0-3f · cả lớp 30 em Lên FT → 30 MT0; số câu SQL như 3 em', () => {
    const it = taoLop('ELE', 8, 3);
    const nhieu = taoLop('ELE', 8, 30);
    const ghi = (l: { classId: number; sids: number[] }) => () => loTrinh.ghiLoTrinhTiepCaLop(QL, l.classId, { items: l.sids.map((sid) => ({ studentId: sid, huong: 'fast_track' })) });
    const a = demCau(ghi(it));
    const b = demCau(ghi(nhieu));
    assert(a === b, `3 em ${a} câu · 30 em ${b} câu`);
    assert(get(`SELECT COUNT(*) n FROM assessment_attempts WHERE kind = 'mt0' AND class_id = ?`, nhieu.classId).n === 30, 'đủ 30 MT0');
    const ca = loTrinh.layLoTrinhTiepCaLop(QL, nhieu.classId);
    assert(ca.hocVien.every((h: any) => h.mt0?.maTuan) && ca.lop.tuanFinal, 'bảng cả lớp có MT0 + tuần Final');
  });
  check('MT0-3g · một dòng sai trong lô cả lớp → 400, không MT0 mới', () => {
    const l = taoLop('BE', 8, 3);
    const e = loi(() => loTrinh.ghiLoTrinhTiepCaLop(QL, l.classId, { items: [
      { studentId: l.sids[0], huong: 'fast_track' }, { studentId: l.sids[1], huong: 'fast_track', ghiChu: 'y'.repeat(501) },
    ] }));
    assert(e?.status === 400, `400: ${e?.message}`);
    assert(get(`SELECT COUNT(*) n FROM assessment_attempts WHERE kind = 'mt0' AND class_id = ?`, l.classId).n === 0, 'không MT0');
  });

  // ------------------------------------------------------------------ MT0-4 · dời MT0 (muộn nhất tuần 2 FT, trước MT1), theo Final
  const tuanSo = (w: string, n: number) => week.ensurePeriod(addDays(w, 7 * n)).id as number;
  const tuanKn = (aid: number) => (conn.prepare(`SELECT DISTINCT p.week_start w FROM attempt_skills k JOIN report_periods p ON p.id = k.planned_period_id WHERE k.attempt_id = ?`).all(aid) as any[]).map((r) => r.w).join();
  const lenFt = (kind: 'FOU' | 'BE' | 'ELE', tuan: number) => {
    const l = taoLop(kind, tuan, 1, 6);
    loTrinh.ghiLoTrinhTiep(QL, l.sids[0], { huong: 'fast_track' });
    const tuanFinal = schedule.classProgress(l.classId).finalWeekStart as string;
    return { ...l, sid: l.sids[0], aid: mt0Cua(l.sids[0])[0].id as number, tuanFinal };
  };
  check('MT0-4a · QL dời MT0 (chưa nối FT): Final + 3 tuần → 400 "muộn nhất"; + 1 tuần → lưu, hạn = Chủ nhật tuần sau tuần mới', () => {
    const e = lenFt('BE', 9);
    const x = loi(() => attempts.setPlanningWeek(QL, e.aid, tuanSo(e.tuanFinal, 3)));
    assert(x?.status === 400 && /muộn nhất/.test(x.message), `+3: ${x?.status} ${x?.message}`);
    const y = loi(() => skillSch.setSkillWeek(QL, e.aid, 'writing', tuanSo(e.tuanFinal, 3)));
    assert(y?.status === 400 && /muộn nhất/.test(y.message), `+3 một kỹ năng: ${y?.message}`);
    attempts.setPlanningWeek(QL, e.aid, tuanSo(e.tuanFinal, 1));
    const moi = addDays(e.tuanFinal, 7);
    assert(tuanKn(e.aid) === moi, tuanKn(e.aid));
    const han = attempts.attemptDetail(QL, e.aid).skillSchedule.map((r: any) => r.deadline);
    assert(han.every((h: string) => h === dm.hanChamMt0(moi)), han.join());
    attempts.setPlanningWeek(QL, e.aid, tuanSo(e.tuanFinal, 2));   // biên: đúng tuần 2 FT (Final + 14 ngày) vẫn được
    assert(tuanKn(e.aid) === addDays(e.tuanFinal, 14), 'biên tuần 2 FT');
  });
  check('MT0-4 · Q2 (A): dời Final Test của em → MT0 chưa điểm, chưa dời tay đi theo; đã dời tay thì đứng yên; lân cận lớp thường không chặn', () => {
    const e = lenFt('ELE', 8);
    const fin = get(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'final'`, e.sid).id as number;
    attempts.setPlanningWeek(QL, fin, tuanSo(e.tuanFinal, 1));   // Final cùng tuần MT0 trước đó: không bị "trùng tuần với MT0"
    assert(tuanKn(e.aid) === addDays(e.tuanFinal, 7), `MT0 theo Final: ${tuanKn(e.aid)}`);
    skillSch.setSkillWeek(QL, e.aid, 'speaking', tuanSo(e.tuanFinal, 2));   // dời tay
    attempts.setPlanningWeek(QL, fin, tuanSo(e.tuanFinal, 0));
    assert(tuanKn(e.aid).split(',').sort().join() === [addDays(e.tuanFinal, 7), addDays(e.tuanFinal, 14)].join(), `đã dời tay: ${tuanKn(e.aid)}`);
  });
  check('MT0-4d · GVCN dời MT0 về tuần đã qua → chặn như mọi Mock (T4); QL được (Final đã qua, dời trong khoảng hợp lệ)', () => {
    const e = lenFt('FOU', 10);   // FOU 8 tuần, đang tuần 10 → Final cách 2 tuần
    const gvcn = ganGv(e.classId, gvKhac(5), null, true);
    const qua = tuanSo(e.tuanFinal, 1);   // tuần trước — vẫn đã qua, trong khoảng Final … Final + 2
    const x = loi(() => skillSch.setSkillWeek(gvcn, e.aid, 'listening', qua));
    assert(x?.status === 400 || x?.status === 403, `GVCN: ${x?.status} ${x?.message}`);
    skillSch.setSkillWeek(QL, e.aid, 'listening', qua);
    assert(tuanKn(e.aid).includes(addDays(e.tuanFinal, 7)), 'QL dời về tuần đã qua được');
  });
  check('Rà #226 (5) · MT0 không sớm hơn tuần Final Test: QL dời về Final − 1 tuần → 400 "sớm nhất"', () => {
    const e = lenFt('BE', 8);
    const x = loi(() => attempts.setPlanningWeek(QL, e.aid, tuanSo(e.tuanFinal, -1)));
    assert(x?.status === 400 && /sớm nhất/.test(x.message), `${x?.status} ${x?.message}`);
    assert(/sớm nhất/.test(dm.kiemTuanMt0({ tuanMoi: '2026-10-19', tuanDau: '2026-10-12', tuanSomNhat: '2026-10-19', tuanMuonNhat: null, tuanMt1: null }) ?? ''), 'luật thuần');
  });
  // ------------------------------------------------------------------ MT0-5 · Chuyển tiếp lớp: nối MT0 vào lộ trình FT / không dùng
  const luatLoTrinh: any = await import('../classes/luatLoTrinh.ts');
  const cycles: any = await import('../fasttrack/cycles.ts');
  const FT101 = t.classId('MB FT 101');
  const lt = (sid: number, dk = `status = 'active'`) => get(`SELECT * FROM learning_cycles WHERE student_id = ? AND ${dk} ORDER BY seq DESC LIMIT 1`, sid);
  const diemMt0 = (aid: number, b: Band) => {
    for (const [k, v] of Object.entries(b)) for (const s of k === 'writing' ? ['writing1', 'writing2'] : [k]) {
      conn.prepare('INSERT INTO assessment_scores (attempt_id, skill, band, nhap_dau_ngay) VALUES (?,?,?,?)').run(aid, s, v, TODAY);
    }
  };
  check('MT0-5a/b/f · applyTransition lớp BE: A Lên FT (MT0 có điểm) → MT0 vào lộ trình FT làm đầu vào; B Học lại (có điểm) → không dùng; C Học lại (chưa điểm) → huỷ', () => {
    const l = taoLop('BE', 10, 3, 6);
    const hocLai = taoLop('BE', 1, 0);
    const [A, B, C] = l.sids;
    for (const sid of l.sids) loTrinh.ghiLoTrinhTiep(QL, sid, { huong: 'fast_track' });
    const [mA, mB, mC] = l.sids.map((sid) => mt0Cua(sid)[0].id as number);
    diemMt0(mA, { listening: 6, reading: 6, writing: 4, speaking: 6 });
    diemMt0(mB, { listening: 3.5 });
    const plan = transition.transitionPlan(QL, l.classId);
    const pA = plan.students.find((x: any) => x.id === A);
    assert(JSON.stringify(pA.mt0.sos) === JSON.stringify([{ skill: 'writing', band: 4 }]) && pA.baiChuaLam === get(`SELECT COUNT(*) n FROM assessment_attempts WHERE student_id = ? AND status = 'planned' AND kind != 'mt0'`, A).n, `kế hoạch: ${JSON.stringify(pA.mt0)} · bài chưa làm ${pA.baiChuaLam}`);
    const cuA = lt(A).id;
    const r = transition.applyTransition(QL, { fromClassId: l.classId, effectiveDate: TODAY, dongs: [
      { studentId: A, huong: 'fast_track', toClassId: FT101, mucTieu: 6.5 },
      { studentId: B, huong: 'hoc_lai', toClassId: hocLai.classId },
      { studentId: C, huong: 'hoc_lai', toClassId: hocLai.classId },
    ] });
    assert(!r.failed?.length, JSON.stringify(r.failed));
    const ft = lt(A);
    const a0 = get('SELECT * FROM assessment_attempts WHERE id = ?', mA);
    assert(ft.route && a0.cycle_id === ft.id && a0.class_id === l.classId && a0.status !== 'cancelled', `MT0 A: ${JSON.stringify(a0)}`);
    assert(ft.baseline_attempt_id === mA && ft.baseline_source === 'mt0', `đầu vào: ${ft.baseline_attempt_id} ${ft.baseline_source}`);
    const mt1 = get(`SELECT attempt_no FROM assessment_attempts WHERE cycle_id = ? AND kind = 'mock' ORDER BY attempt_no LIMIT 1`, ft.id);
    assert(mt1?.attempt_no === 1, 'MT1 mặc định vẫn số 1');
    const soMock = get(`SELECT COUNT(*) n FROM assessment_attempts WHERE cycle_id = ? AND kind = 'mock'`, ft.id).n as number;
    assert(cycles.nextAttemptNo(ft.id) === soMock + 1, `nextAttemptNo ${cycles.nextAttemptNo(ft.id)} vs ${soMock + 1}`);
    assert(get('SELECT COUNT(*) n FROM assessment_attempts WHERE cycle_id = ?', cuA).n >= 2, 'Progress/Final Test ở lại khoá cũ');
    assert(get(`SELECT COUNT(*) n FROM journey_events WHERE dedup_key = ?`, `mt0:${mA}:noi`).n === 1, 'hành trình nối');
    const vB = mt0Svc.mt0TheoHocVien([B]).get(B);
    assert(vB?.trangThai === 'khong_dung' && JSON.stringify(vB.sos) === JSON.stringify([{ skill: 'listening', band: 3.5 }]), `B: ${JSON.stringify(vB)}`);
    assert(!conn.prepare(`SELECT 1 FROM learning_cycles WHERE student_id = ? AND route IS NOT NULL`).get(B), 'B không có lộ trình FT ma');
    const c0 = get('SELECT status, cancel_reason FROM assessment_attempts WHERE id = ?', mC);
    assert(c0.status === 'cancelled' && c0.cancel_reason === 'Không lên FT', JSON.stringify(c0));
    assert(mt0Svc.mt0TheoHocVien([A]).get(A)?.trangThai === 'dung', 'A: dùng');
    /* PR-TK: bản chụp khoá cũ ghi SAU khi nối — MT0 của A (đã là đầu vào FT) không có; MT0 của B (có điểm, ở lại) là `khong_dung`. */
    const chup = (sid: number) => conn.prepare(`SELECT DISTINCT l.attempt_id, l.trang_thai FROM ban_chup_luot l JOIN ban_chup_lo_trinh b ON b.id = l.ban_chup_id
      WHERE b.student_id = ? AND l.kind = 'mt0'`).all(sid) as any[];
    assert(chup(A).length === 0, `bản chụp A: ${JSON.stringify(chup(A))}`);
    assert(JSON.stringify(chup(B)) === JSON.stringify([{ attempt_id: mB, trang_thai: 'khong_dung' }]), `bản chụp B: ${JSON.stringify(chup(B))}`);
  });
  check('MT0-5c · MT0 chưa chấm lúc sang FT → vẫn nhập điểm được ở lớp BE cũ (GV Writing lớp BE), điểm thuộc lộ trình FT; hạn giữ', () => {
    const l = taoLop('BE', 10, 1, 6);
    const sid = l.sids[0];
    const gvW = ganGv(l.classId, gvKhac(6), 'writing');
    loTrinh.ghiLoTrinhTiep(QL, sid, { huong: 'fast_track' });
    const m = mt0Cua(sid)[0].id as number;
    transition.applyTransition(QL, { fromClassId: l.classId, effectiveDate: TODAY, dongs: [{ studentId: sid, huong: 'fast_track', toClassId: FT101, mucTieu: 6 }] });
    attempts.saveScore(gvW, m, 'writing1', { band: 5 });
    attempts.saveScore(gvW, m, 'writing2', { band: 5 });
    assert(get('SELECT cycle_id FROM assessment_attempts WHERE id = ?', m).cycle_id === lt(sid).id, 'thuộc lộ trình FT');
    assert(get(`SELECT COUNT(*) n FROM assessment_scores WHERE attempt_id = ? AND band IS NOT NULL`, m).n === 2, 'điểm lưu');
    const s = canCham.chamSheet(QL, l.classId, { kind: 'mt0' });
    assert(s.ft.rows.some((r: any) => r.attemptId === m), 'lưới MT0 lớp BE cũ vẫn có em');
    assert(get(`SELECT COUNT(*) n FROM case_signals WHERE student_id = ?`, sid).n === 0, 'không tín hiệu');
  });
  check('MT0-5d/e/g · chuyển một em sang FT (apDungMotDong) như (a); chuyển giữa hai lớp BE cùng khoá: MT0 không theo, chưa điểm → huỷ "Chuyển lớp"; đầu vào có sẵn không bị ghi đè', () => {
    const l = taoLop('BE', 6, 2, 6);
    const [A, B] = l.sids;
    for (const sid of l.sids) loTrinh.ghiLoTrinhTiep(QL, sid, { huong: 'fast_track' });
    const mA = mt0Cua(A)[0].id as number;
    luatLoTrinh.apDungMotDong(QL, { sid: A, toClassId: FT101, ngay: TODAY, mucTieu: 6.5, boiCanh: 'giua-khoa' });
    const ft = lt(A);
    assert(get('SELECT cycle_id FROM assessment_attempts WHERE id = ?', mA).cycle_id === ft.id && ft.baseline_source === 'mt0', 'một em: nối');
    const khac = taoLop('BE', 6, 0);
    const mB = mt0Cua(B)[0].id as number;
    luatLoTrinh.apDungMotDong(QL, { sid: B, toClassId: khac.classId, ngay: TODAY, boiCanh: 'giua-khoa' });
    const b0 = get('SELECT class_id, status, cancel_reason FROM assessment_attempts WHERE id = ?', mB);
    assert(b0.class_id === l.classId && b0.status === 'cancelled' && b0.cancel_reason === 'Chuyển lớp', JSON.stringify(b0));
    /* (g) lộ trình FT của chính em đã có điểm đầu vào (nhập tay) → nối MT0 nhưng không ghi đè đầu vào */
    const l2 = taoLop('FOU', 8, 1, 6);
    const s2 = l2.sids[0];
    loTrinh.ghiLoTrinhTiep(QL, s2, { huong: 'fast_track' });
    const m2 = mt0Cua(s2)[0].id as number;
    const cu2 = lt(s2).id;
    const ft2 = Number(conn.prepare(`INSERT INTO learning_cycles (student_id, seq, route, programme_code, baseline_score, baseline_source, started_at, status, created_at)
      VALUES (?, 9, 'LT1', NULL, 5.5, 'external', ?, 'planned', ?)`).run(s2, TODAY, new Date().toISOString()).lastInsertRowid);
    mt0Svc.noiMt0VaoFt(QL.userId, [{ sid: s2, cuCycleId: cu2, ftCycleId: ft2, ngay: TODAY }]);
    const c2 = get('SELECT baseline_attempt_id, baseline_score, baseline_source FROM learning_cycles WHERE id = ?', ft2);
    assert(get('SELECT cycle_id FROM assessment_attempts WHERE id = ?', m2).cycle_id === ft2 && c2.baseline_attempt_id === null && c2.baseline_source === 'external', JSON.stringify(c2));
  });

  // ------------------------------------------------------------------ MT0-6 · việc Quản lý "Chốt lên FT · {lớp}" (Q1: tự xong khi mọi em có hướng)
  const mywork: any = await import('../worklist/mywork.ts');
  const viecChot = (p: any) => mywork.myWork(p, { branchId: MB }).groups.flatMap((g: any) => g.items).filter((i: any) => i.group === 'chot_len_ft');
  check('MT0-6a/c · QL: lớp BE tuần 8 → "Chốt lên FT · {lớp}", hạn = CN trước tuần Final; Chưa quyết vẫn còn; mọi em có hướng → tự hết', () => {
    const l = taoLop('BE', 8, 2);
    const tuanFinal = schedule.classProgress(l.classId).finalWeekStart as string;
    const code = get('SELECT code FROM classes WHERE id = ?', l.classId).code;
    let v = viecChot(QL).filter((i: any) => i.classId === l.classId);
    assert(v.length === 1 && v[0].tieuDe === `Chốt lên FT · ${code}` && v[0].due === addDays(tuanFinal, -1) && v[0].urgency !== 'overdue', JSON.stringify(v));
    loTrinh.ghiLoTrinhTiep(QL, l.sids[0], { huong: 'fast_track' });
    loTrinh.ghiLoTrinhTiep(QL, l.sids[1], { huong: 'chua_quyet' });
    assert(viecChot(QL).some((i: any) => i.classId === l.classId), 'còn em Chưa quyết → chưa xong');
    loTrinh.ghiLoTrinhTiep(QL, l.sids[1], { huong: 'len_lop' });
    assert(!viecChot(QL).some((i: any) => i.classId === l.classId), 'mọi em có hướng → tự hết');
  });
  check('MT0-6a · quá hạn (lớp ở tuần Final) → urgency overdue; ghi Lên FT sau hạn vẫn được', () => {
    const l = taoLop('ELE', 10, 1);
    const v = viecChot(QL).find((i: any) => i.classId === l.classId);
    assert(v?.urgency === 'overdue', JSON.stringify(v));
    loTrinh.ghiLoTrinhTiep(QL, l.sids[0], { huong: 'fast_track' });
    assert(mt0Cua(l.sids[0]).length === 1, 'ghi sau hạn vẫn tạo MT0');
  });
  check('MT0-6b/d/f · GVCN, GVBM không có; Pre FOU và lớp còn xa hạn không có; chỉ số Tổng quan = số lớp của việc', () => {
    const l = taoLop('FOU', 6, 1);   // FOU 8 tuần: Final tuần 8, hạn CN tuần 7 — tuần 6 trong 13 ngày
    const xa = taoLop('BE', 3, 1);
    const pf = taoLop('PREFOU', 9, 1);
    const gvcn = ganGv(l.classId, gvKhac(7), null, true);
    const gvbm = ganGv(l.classId, gvKhac(8), 'reading');
    assert(viecChot(gvcn).length === 0 && viecChot(gvbm).length === 0, 'GV không có');
    const ds = viecChot(QL);
    assert(ds.some((i: any) => i.classId === l.classId) && !ds.some((i: any) => i.classId === xa.classId || i.classId === pf.classId), JSON.stringify(ds.map((i: any) => i.tieuDe)));
    const n = metrics.metricSet(QL, 'lop-chua-chot-len-ft', { branchId: MB }).n;
    assert(n === ds.length, `chỉ số ${n} · việc ${ds.length}`);
    const tq = tongQuan.tongQuanQuanLy(QL, { branchId: MB }).canXuLy.find((x: any) => x.metricId === 'lop-chua-chot-len-ft');
    assert(tq?.n === n, JSON.stringify(tq));
  });

  // ------------------------------------------------------------------ MT0-4b/c · sau khi nối FT: MT0 muộn nhất tuần 2 FT, luôn trước MT1; không ở Xếp lịch MT
  const keHoach: any = await import('../keHoach/keHoachTest.ts');
  check('MT0-4b/c · sau nối FT: MT0 tới tuần 3 FT → 400; MT1 về tuần ≤ MT0 → 400 "trước MT1"; lưới / Xếp lịch MT không có MT0; đợt 0 → 400', () => {
    const l = taoLop('BE', 10, 1, 6);
    const sid = l.sids[0];
    loTrinh.ghiLoTrinhTiep(QL, sid, { huong: 'fast_track' });
    const m = mt0Cua(sid)[0].id as number;
    transition.applyTransition(QL, { fromClassId: l.classId, effectiveDate: TODAY, dongs: [{ studentId: sid, huong: 'fast_track', toClassId: FT101, mucTieu: 6 }] });
    const ft = lt(sid);
    const batDau = get('SELECT week_start w FROM report_periods WHERE id = ?', ft.start_period_id).w as string;
    let x = loi(() => attempts.setPlanningWeek(QL, m, tuanSo(batDau, 2)));   // tuần 3 FT
    assert(x?.status === 400 && /muộn nhất/.test(x.message), `MT0 tuần 3 FT: ${x?.status} ${x?.message}`);
    const mt1 = get(`SELECT id FROM assessment_attempts WHERE cycle_id = ? AND kind = 'mock' AND attempt_no = 1`, ft.id).id as number;
    x = loi(() => attempts.setPlanningWeek(QL, mt1, week.ensurePeriod(tuanKn(m).split(',')[0]).id));
    assert(x?.status === 400 && /trước MT1/.test(x.message), `MT1 về tuần MT0: ${x?.status} ${x?.message}`);
    x = loi(() => skillSch.setSkillWeek(QL, mt1, 'reading', week.ensurePeriod(tuanKn(m).split(',')[0]).id));
    assert(x?.status === 400 && /trước MT1/.test(x.message), `MT1 một kỹ năng về tuần MT0: ${x?.message}`);
    attempts.setPlanningWeek(QL, m, tuanSo(batDau, 1));   // tuần 2 FT: được
    const luoi = JSON.stringify(keHoach.luoiFT(QL, FT101));
    assert(!luoi.includes(`"attemptId":${m},`) && !luoi.includes(`"id":${m},`), 'lưới FT không có MT0');
    x = loi(() => keHoach.xepHangLoat(QL, { classId: FT101, attemptNo: 0, studentIds: [sid], tuan: { listening: tuanSo(batDau, 8) }, xemTruoc: true }));
    assert(x?.status === 400, `đợt 0: ${x?.status} ${x?.message}`);
    const moi = keHoach.xepHangLoat(QL, { classId: FT101, attemptNo: 'moi', studentIds: [sid], tuan: { listening: tuanSo(batDau, 20) }, xemTruoc: true });
    const soMock = get(`SELECT COUNT(*) n FROM assessment_attempts WHERE cycle_id = ? AND kind = 'mock'`, ft.id).n as number;
    assert(moi.dong[0]?.attemptNo === soMock + 1, `MT mới: ${JSON.stringify(moi.dong[0])}`);
  });

  // ------------------------------------------------------------------ MT0-7 · Kế hoạch Test lớp thường, Lịch Test, ô MT
  check('MT0-7a/b · Kế hoạch Test lớp thường: em có MT0 → `mt0` (đếm chưa có lịch không đổi); Lịch Test tuần Final: hàng MT0 band, môn IELTS, hạn CN tuần sau, khung Lớp thường', () => {
    const l = taoLop('BE', 10, 2, 6);
    const truoc = keHoach.luoiThuong(QL, l.classId);
    loTrinh.ghiLoTrinhTiep(QL, l.sids[0], { huong: 'fast_track' });
    const m = mt0Cua(l.sids[0])[0].id as number;
    const sau = keHoach.luoiThuong(QL, l.classId);
    const h0 = sau.hang.find((h: any) => h.studentId === l.sids[0]);
    assert(h0.mt0?.attemptId === m && Object.keys(h0.mt0.kn).length === 4, JSON.stringify(h0.mt0));
    assert(sau.hang.find((h: any) => h.studentId === l.sids[1]).mt0 === null, 'em không Lên FT: không MT0');
    assert(truoc.hvChuaCoLich === sau.hvChuaCoLich && JSON.stringify(truoc.hang.map((h: any) => h.dot)) === JSON.stringify(sau.hang.map((h: any) => h.dot)), 'ô Progress/Final Test không đổi');
    const tuanFinal = schedule.classProgress(l.classId).finalWeekStart as string;
    const lt0 = canCham.lichTest(QL, week.ensurePeriod(tuanFinal).id, MB, TODAY, { classId: l.classId });
    const hang = [...(lt0.chamTuanNay ?? []), ...lt0.lop].filter((x: any) => x.classId === l.classId);
    const h = hang.find((x: any) => x.kind === 'mt0');
    assert(h && h.mode === 'ielts_band' && h.dotLabel === 'MT0' && h.boMon.join() === 'listening,reading,writing,speaking' && h.han === dm.hanChamMt0(tuanFinal),
      JSON.stringify(h));
    assert(/kind=mt0/.test(h.hrefDayDu), h.hrefDayDu);
    const fin = hang.find((x: any) => x.kind === 'final');
    assert(fin && fin.mode === 'ratio' && fin.dong.every((d: any) => d.soHv === 2), `Final vẫn 2 em: ${JSON.stringify(fin?.dong)}`);
    assert(lt0.tongQuanKhung.thuong.tong === lt0.tongQuan.tong && lt0.tongQuanKhung.ft.tong === 0, 'MT0 đếm vào khung Lớp thường');
  });
  check('MT0-7d · oMt: số 0 xong → kiểu xong (xanh, không chữ việc); khongDung → tooltip "MT0 · không dùng"; ô MT thường không đổi', () => {
    const xong = { trangThai: 'xong', tuan: '2026-09-14', periodId: 1, doiTu: null, batBuoc: true, khoa: null, sit: 'sat', tuanKetThuc: '2026-09-20', choDuyet: false, hanCham: null };
    const kn = { listening: xong, reading: xong, writing: xong, speaking: xong };
    assert(dm.oMt({ so: 0, attemptId: 1, kn, cu: false }, '2026-10-05', null).kieu === 'xong' && dm.oMt({ so: 0, attemptId: 1, kn, cu: false }, '2026-10-05', null).viec === null, 'MT0 xong');
    assert(dm.oMt({ so: 0, attemptId: 1, kn, cu: false, khongDung: true }, '2026-10-05', null).title.startsWith('MT0 · không dùng'), 'không dùng');
    assert(!dm.oMt({ so: 2, attemptId: 1, kn, cu: false }, '2026-10-05', null).title.includes('không dùng'), 'ô thường');
  });

  // ------------------------------------------------------------------ MT0-8 · hồ sơ HV (FT sau nối), lịch MT lộ trình, Hành trình, hồ sơ Mock
  const hanhTrinh: any = await import('../students/hanhTrinh.ts');
  check('MT0-8 · sau nối: hồ sơ HV có lượt MT0 (không SOS mức, chip hiển thị), đường đi một điểm đầu vào (không lặp MT0); lịch MT hàng 0 khoá; Hành trình; hồ sơ Mock không Case', () => {
    const l = taoLop('BE', 10, 2, 6);
    const hocLai = taoLop('BE', 1, 0);
    const [A, B] = l.sids;
    for (const sid of l.sids) loTrinh.ghiLoTrinhTiep(QL, sid, { huong: 'fast_track' });
    const [mA, mB] = l.sids.map((sid) => mt0Cua(sid)[0].id as number);
    diemMt0(mA, { listening: 6, reading: 6, writing: 4, speaking: 6 });
    diemMt0(mB, { listening: 5 });
    transition.applyTransition(QL, { fromClassId: l.classId, effectiveDate: TODAY, dongs: [
      { studentId: A, huong: 'fast_track', toClassId: FT101, mucTieu: 6 }, { studentId: B, huong: 'hoc_lai', toClassId: hocLai.classId },
    ] });
    const hs = profile.studentProfile(QL, A);
    const a0 = hs.attempts.find((x: any) => x.kind === 'mt0');
    assert(a0 && a0.attemptNo === 0 && a0.sosLevel === null && JSON.stringify(a0.sosMt0) === JSON.stringify([{ skill: 'writing', band: 4 }]), JSON.stringify(a0));
    const w = hs.trajectory.find((t2: any) => t2.skill === 'writing');
    assert(w.points.filter((x: any) => x.band === 4).length === 1 && w.points[0].kind === 'baseline', JSON.stringify(w.points));
    const lich = keHoach.lichMtLoTrinh(lt(A).id);
    assert(lich.hang[0].attemptNo === 0 && lich.hang[0].locked && lich.hang[0].luot?.kyVong === null, JSON.stringify(lich.hang[0]));
    assert(lich.soKeTiep === get(`SELECT COUNT(*) n FROM assessment_attempts WHERE cycle_id = ? AND kind = 'mock'`, lt(A).id).n + 1, `soKeTiep ${lich.soKeTiep}`);
    const ghim = (sid: number) => JSON.stringify(hanhTrinh.hanhTrinhHocVien(QL, sid, null));
    assert(ghim(A).includes('"nhanNgan":"MT0"'), 'Hành trình A: MT0');
    assert(ghim(B).includes('"nhanNgan":"MT0 · không dùng"'), 'Hành trình B: MT0 · không dùng');
    const ct = attempts.attemptDetail(QL, mA);
    assert(ct.result.sosLevel === null && JSON.stringify(ct.mt0.sos) === JSON.stringify([{ skill: 'writing', band: 4 }]) && !('sosCase' in ct), 'hồ sơ Mock');
    assert(dm.duongDotTest({ id: mA, kind: 'mt0', classId: l.classId }) === `/mock-test/${mA}`, 'đường hồ sơ Mock');
  });

  // ------------------------------------------------------------------ Sau rà #226 (planning 07/10)
  const casesSvc: any = await import('../cases/cases.ts');
  check('Rà #226 (1) · Hành trình giai đoạn lớp thường: band MT0 không vào hàng môn tỷ lệ; MT0 chưa điểm không làm mốc "?"', () => {
    const l = taoLop('FOU', 8, 2, 6);
    const [A, B] = l.sids;
    for (const sid of l.sids) loTrinh.ghiLoTrinhTiep(QL, sid, { huong: 'fast_track' });
    diemMt0(mt0Cua(A)[0].id, { listening: 6, reading: 5.5 });
    for (const sid of [A, B]) {
      const ht = hanhTrinh.hanhTrinhHocVien(QL, sid, null);
      const lo = ht.hop.filter((h: any) => h.diem.some((d: any) => d.kind === 'mt0') || h.dotCho?.kind === 'mt0');
      assert(lo.length === 0, `em ${sid}: ${JSON.stringify(lo.map((h: any) => [h.kyNang, h.diem, h.dotCho]))}`);
    }
  });
  check('Rà #226 (2) · Học thuật (skillSupportBoard) lộ trình FT sau nối: điểm MT0 không có kỳ vọng', () => {
    const l = taoLop('BE', 10, 1, 6);
    const A = l.sids[0];
    loTrinh.ghiLoTrinhTiep(QL, A, { huong: 'fast_track', mucTieu: 6.5 });
    const m = mt0Cua(A)[0].id as number;
    diemMt0(m, { listening: 6, reading: 6, writing: 4, speaking: 6 });
    transition.applyTransition(QL, { fromClassId: l.classId, effectiveDate: TODAY, dongs: [{ studentId: A, huong: 'fast_track', toClassId: FT101, mucTieu: 6.5 }] });
    const bd = casesSvc.skillSupportBoard(QL, A, lt(A).id);
    const diemMt0Bd = bd.rows.flatMap((r: any) => r.points.filter((x: any) => x.attemptKind === 'mt0').map((x: any) => [r.category, x.expectation]));
    const hangMt0 = bd.rows.filter((r: any) => r.bandAttemptId === m).map((r: any) => [r.category, r.expectation, r.missed]);
    assert(diemMt0Bd.length >= 4 && diemMt0Bd.every((x: any) => x[1] === null), `điểm MT0: ${JSON.stringify(diemMt0Bd)}`);
    assert(hangMt0.every((x: any) => x[1] === null && !x[2]), `hàng lấy MT0 làm gần nhất: ${JSON.stringify(hangMt0)}`);
  });
  check('Rà #226 (3) · em chuyển lớp (giữ khoá) rồi chọn lại Lên FT → MT0 mở lại theo lớp mới, tuần Final lớp mới', () => {
    const cu = taoLop('BE', 6, 1, 6);
    const moi = taoLop('BE', 5, 0);
    const sid = cu.sids[0];
    loTrinh.ghiLoTrinhTiep(QL, sid, { huong: 'fast_track' });
    const m = mt0Cua(sid)[0].id as number;
    luatLoTrinh.apDungMotDong(QL, { sid, toClassId: moi.classId, ngay: TODAY, boiCanh: 'giua-khoa' });
    assert(get('SELECT status FROM assessment_attempts WHERE id = ?', m).status === 'cancelled', 'tiền đề: huỷ "Chuyển lớp"');
    loTrinh.ghiLoTrinhTiep(QL, sid, { huong: 'fast_track' });
    const a = get('SELECT * FROM assessment_attempts WHERE id = ?', m);
    const finalMoi = schedule.classProgress(moi.classId).finalWeekStart as string;
    assert(a.status === 'planned' && a.class_id === moi.classId, `lớp: ${a.class_id} (mới ${moi.classId}), ${a.status}`);
    assert(tuanKn(m) === finalMoi && get('SELECT week_start w FROM report_periods WHERE id = ?', a.planned_period_id).w === finalMoi, `tuần: ${tuanKn(m)} · Final mới ${finalMoi}`);
  });
  check('Rà #226 (5) · Hành trình em có hai MT0: MT0 cũ (khoá đã đóng, có điểm) ghi "MT0 · không dùng"', () => {
    const l = taoLop('BE', 10, 1, 6);
    const hocLai = taoLop('BE', 9, 0);
    const sid = l.sids[0];
    loTrinh.ghiLoTrinhTiep(QL, sid, { huong: 'fast_track' });
    diemMt0(mt0Cua(sid)[0].id, { listening: 5 });
    transition.applyTransition(QL, { fromClassId: l.classId, effectiveDate: TODAY, dongs: [{ studentId: sid, huong: 'hoc_lai', toClassId: hocLai.classId }] });
    loTrinh.ghiLoTrinhTiep(QL, sid, { huong: 'fast_track' });
    assert(mt0Cua(sid).filter((x: any) => x.status !== 'cancelled').length === 2, 'tiền đề: hai MT0');
    const nhan: string[] = JSON.stringify(hanhTrinh.hanhTrinhHocVien(QL, sid, null)).match(/"nhanNgan":"MT0[^"]*"/g) ?? [];
    assert(nhan.includes('"nhanNgan":"MT0 · không dùng"') && nhan.includes('"nhanNgan":"MT0"'), nhan.join());
  });

  check('Rà #226 (4b) · hạn việc "Chốt lên FT" (Công việc, Tổng quan) = "hạn hết CN dd/mm"', () => {
    assert(dm.LOAI_HAN_CUA_VIEC.chot_len_ft === 'chot-len-ft', 'loại hạn của việc');
    const v = dm.deadlineView({ kind: 'chot-len-ft', due: '2026-10-04', today: '2026-09-28' });
    assert(v.text.includes('hạn hết CN 04/10'), v.text);
    const tq = tongQuan.tongQuanQuanLy(QL, { branchId: MB }).canXuLy.find((x: any) => x.metricId === 'lop-chua-chot-len-ft');
    assert(tq?.han?.loai === 'chot-len-ft', JSON.stringify(tq?.han));
  });

  check('Rà #226 (5) · ghim Hành trình MT0 "không dùng" ghi đúng chữ (không "đang chấm")', () => {
    const g = dm.nhanGhim({ cheDo: 'ielts', attemptNo: 0, kind: 'mt0', nhanNgan: 'MT0 · không dùng', overall: null, sosLevel: null, soDat: null, soYeuCau: 4, soCoDiem: 1 });
    assert(g.chu === 'MT0 · không dùng', g.chu);
    assert(dm.nhanGhim({ cheDo: 'ielts', attemptNo: 0, kind: 'mt0', nhanNgan: 'MT0', overall: null, sosLevel: null, soDat: null, soYeuCau: 4, soCoDiem: 1 }).chu === 'MT0 · đang chấm', 'MT0 thường giữ luật cũ');
  });
}
