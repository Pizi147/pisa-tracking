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
    assert(!!tuanFinal, 'tiền đề: lớp có tuần Cuối khoá');
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
  check('MT0-2 · Nhập điểm lớp BE `kind=mt0`: lưới band (ielts_band) chỉ các MT0; bảng thường Final không có MT0', () => {
    const l = taoLop('BE', 9, 2, 6);
    const tuanFinal = schedule.classProgress(l.classId).finalWeekStart as string;
    const aid = chenMt0Tho({ sid: l.sids[0], classId: l.classId, tuan: tuanFinal, band: {} });
    const s = canCham.chamSheet(QL, l.classId, { kind: 'mt0' });
    assert(s.mode === 'ielts_band' && s.ft?.rows.length === 1 && s.ft.rows[0].attemptId === aid, JSON.stringify({ mode: s.mode, n: s.ft?.rows.length }));
    const o = s.ft.rows[0].cells.find((c: any) => c.skill === 'writing1');
    assert(o?.deadline === dm.hanChamMt0(tuanFinal), `hạn ô W1: ${o?.deadline}`);
    const hs = profile.studentProfile(QL, l.sids[0]);
    assert(!hs.attempts.some((a: any) => a.kind === 'mt0'), 'hồ sơ HV lớp thường: bảng kết quả không có MT0');
    const fin = canCham.chamSheet(QL, l.classId, { kind: 'final' });
    assert(fin.mode === 'ratio' && !JSON.stringify(fin.thuong).includes(`"attemptId":${aid},`), 'Final không lẫn MT0');
  });
}
