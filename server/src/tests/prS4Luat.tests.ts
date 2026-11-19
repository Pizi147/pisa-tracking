/**
 * PHÉP KIỂM S4-LUAT (chủ SP 20/11, luật N56 — `docs/superpowers/specs/2026-11-19-ra-sau-tutor/s4-giam-buoc.md` mục S4-LUAT):
 *   ② Lý do chuyển lớp tuỳ chọn (đề xuất GVCN, lệnh) · ③ xử lý ĐÚNG BẬC: Mô tả trống → máy ghi "{BẬC} · {vi phạm}"; đề xuất (khác mặc định) trống → 400 ·
 *   ⑤ Hoàn thành Case "Tiến bộ rõ": kết luận trống được, mức khác giữ ≥ 8 · đề xuất 9: web và máy chủ cùng một ngưỡng chữ xử lý vi phạm.
 * Mỗi ca ghi dữ liệu cuộn lại (`thu`).
 */
import fs from 'node:fs';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrS4LuatTests(t: any) {
  const { check, assert, conn, P, classId, TODAY } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const cases: any = await import('../cases/cases.ts');
  const intake: any = await import('../classes/intake.ts');
  const viol: any = await import('../yThuc/violations.ts');
  const xuLy: any = await import('../yThuc/xuLy.ts');
  const lenh: any = await import('../classes/lenhChuyen.ts');
  const llt: any = await import('../classes/luatLoTrinh.ts');
  const ck: any = await import('../normal/cuoiKhoa.ts');
  const lo: any = await import('../yThuc/lo.ts');
  const lyc: any = await import('../duyet/loaiYeuCau.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  console.log('\nS4-LUAT · N56 ② Lý do chuyển lớp · ③ Mô tả xử lý tự ghi · ⑤ Tiến bộ rõ · đề xuất 9');

  const thu = <T>(fn: () => T): T => { conn.exec('BEGIN IMMEDIATE'); try { xoaNho(); return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); } };
  const loiCua = (fn: () => unknown): any => { try { fn(); return null; } catch (e) { return e; } };
  const one = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const LOP = classId('MB FT 101');
  let seq = 0;
  const emMoi = (): number => {
    const ten = `S4LUAT HV ${++seq}`;
    intake.commitIntake(P.admin, { classId: LOP, rows: [{ fullName: ten, target: 6.5, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `s4luat-${seq}` });
    xoaNho();
    return one('SELECT id FROM students WHERE full_name = ?', ten).id as number;
  };

  check('S4-LUAT ③ · xử lý đúng bậc kế, Mô tả trống → 200 + máy ghi "{BẬC} · {vi phạm}"; có chữ < 8 → 400; đề xuất (Ngoài thang) trống → 400', () => thu(() => {
    const sid = emMoi();
    const ghi = (i: number) => viol.recordViolation(P.w1Teacher, { studentId: sid, category: 'homework', ten: `Không nộp bài số ${i}`, skill: 'writing1', occurredOn: d.addDaysIso(TODAY, -i) }).violation.id as number;
    const v1 = ghi(1), v2 = ghi(2);
    xoaNho();
    const e0 = loiCua(() => xuLy.xacNhanXuLy(P.coreTeacher, sid, { violationIds: [v1], performedOn: TODAY, performerName: 'Cô Thu', note: 'ngắn' }));
    assert(e0?.status === 400, `chữ ngắn: ${e0?.status} ${e0?.message}`);
    const e1 = loiCua(() => xuLy.deXuat(P.coreTeacher, sid, { kind: 'wl_3', violationIds: [v2], note: '' }));
    assert(e1?.status === 400 && /Mô tả/.test(e1?.message ?? ''), `đề xuất trống: ${e1?.status} ${e1?.message}`);
    const kq = xuLy.xacNhanXuLy(P.coreTeacher, sid, { violationIds: [v1], performedOn: TODAY, performerName: 'Cô Thu', note: '' });
    const m = one('SELECT kind, note FROM discipline_measures WHERE id = ?', kq.id);
    const mong = `${d.bacDu(d.nhanLoaiXuLy(m.kind))} · Không nộp bài số 1`;
    assert(m.note === mong, `chữ tự ghi: "${m.note}" ≠ "${mong}"`);
  }));

  check('S4-LUAT ③ (rà #1879) · xử lý theo lô, Mô tả chung trống → mỗi em máy ghi "{BẬC của em} · {vi phạm của em}" (tên = tachTenMoTa như web)', () => thu(() => {
    const a = emMoi(), b = emMoi();
    const ghi = (sid: number, ten: string) => viol.recordViolation(P.w1Teacher, { studentId: sid, category: 'homework', ten, skill: 'writing1', occurredOn: d.addDaysIso(TODAY, -1), yeuCauXuLy: true });
    ghi(a, 'Quên vở'); ghi(b, 'Đi muộn 20 phút');
    xoaNho();
    const kq = lo.loXuLy(P.coreTeacher, LOP, { em: [{ studentId: a }, { studentId: b }], performedOn: TODAY, performerName: 'Cô Thu', note: '' });
    assert(kq.em.every((x: any) => x.ok !== false), `lô: ${JSON.stringify(kq.em)}`);
    for (const [sid, ten] of [[a, 'Quên vở'], [b, 'Đi muộn 20 phút']] as const) {
      const m = one(`SELECT kind, note FROM discipline_measures WHERE student_id = ? AND status = 'done' ORDER BY id DESC LIMIT 1`, sid);
      assert(m?.note === `${d.bacDu(d.nhanLoaiXuLy(m.kind))} · ${ten}`, `em ${sid}: "${m?.note}"`);
    }
  }));

  check('S4-LUAT ② (rà #1879) · panel Chuyển lớp: canLyDo = true đúng ca máy chủ đòi Lý do (em hết khoá, chọn KHÁC gợi ý); FT → FT false', () => thu(() => {
    const be04 = classId('MB BE 04');
    const em = [...(ck.cuoiKhoaTheoHocVien(be04) as Map<number, any>)].find(([, e]) => e.goiY?.huong === 'len');
    if (!em) throw new Error('MB BE 04 không có em được gợi ý lên lớp');
    assert(llt.xemChuyenLop(P.mbManager, em[0], classId('MB BE 03')).canLyDo === true, 'khác gợi ý → canLyDo');
    const sid = emMoi();
    const ft2 = one(`SELECT id FROM classes WHERE is_fast_track = 1 AND status = 'active' AND id <> ? AND branch_id = (SELECT branch_id FROM classes WHERE id = ?) ORDER BY id LIMIT 1`, LOP, LOP).id;
    assert(llt.xemChuyenLop(P.mbManager, sid, ft2).canLyDo === false, 'FT → FT không đòi Lý do');
  }));

  check('S4-LUAT ② (rà #1879) · thẻ Đề xuất chuyển lớp không Lý do: dòng không in “”', () => {
    const def = lyc.dinhNghiaCua('de_xuat_chuyen_lop');
    const ngu = { them: new Map([[1, { lop: 'MB BE 03' }]]), homNay: TODAY, nguoi: new Map(), tenNguoi: new Map() };
    const dong = (ly_do: string | null) => { try { return def.moTa({ id: 1, ly_do, du_lieu: '{}', tao_luc: `${TODAY}T08:00:00Z`, nguoi_xin: P.coreTeacher.userId }, ngu).dong[0] as string; } catch { return null; } };
    const trong = dong(null);
    if (trong !== null) assert(!trong.includes('“') && dong('PH xin đổi giờ')!.includes('“PH xin đổi giờ”'), `${trong}`);
    else assert(fs.readFileSync('server/src/duyet/loaiYeuCau.ts', 'utf8').includes('${yc.ly_do ? `: “${yc.ly_do}”` : \'\'}'), 'mã loaiYeuCau');
  });

  check('S4-LUAT ⑤ (rà #1879) · ô "Hoàn thành Case" ở Kết thúc PA (CasePanel) và Kết quả PA (CapNhatTuan): Tiến bộ rõ không đòi ≥ 8', () => {
    assert(fs.readFileSync('web/src/modules/cases/CasePanel.tsx', 'utf8').includes('const loiKetLuan = coHt && !tienBoRo && '), 'CasePanel');
    assert(fs.readFileSync('web/src/modules/cases/CapNhatTuan.tsx', 'utf8').includes('toiThieu: htTienBoRo ? undefined : CHU_TOI_THIEU_CASE'), 'CapNhatTuan');
  });

  check('S4-LUAT ⑤ · Hoàn thành Case "Tiến bộ rõ" kết luận trống → xong, mốc ghi "Tiến bộ rõ"; mức khác trống → 400', () => thu(() => {
    const sid = emMoi();
    const caseMotPa = () => {
      const c = cases.reportIssue(P.lrTeacher, { studentId: sid, topic: 'listening', primaryCode: d.issuesForTopic('listening')[0].code, title: 'Listening · thử',
        summary: 'Em bỏ sót số ở Section 2.', idempotencyKey: `s4luat-c-${++seq}` });
      const iv = cases.recordIntervention(P.lrTeacher, c.id, { kind: 'self_study', description: 'Tự học nghe chép 15 phút', performerSelf: true, status: 'started', startedDate: TODAY });
      const ivId = (iv.interventions ?? []).find((x: any) => x.kind === 'self_study')?.id as number;
      cases.updateResult(P.lrTeacher, ivId, { decision: 'end', outcome: 'improved', note: 'Em nghe số đúng hết' });
      return c.id as number;
    };
    const c1 = caseMotPa();
    const e = loiCua(() => cases.closeCaseOutcome(P.lrTeacher, c1, { outcome: 'improved', note: '' }));
    assert(e?.status === 400, `Tiến bộ một phần trống: ${e?.status}`);
    cases.closeCaseOutcome(P.lrTeacher, c1, { outcome: 'much_better', note: '' });
    assert(one('SELECT status FROM sos_cases WHERE id = ?', c1).status === 'done', 'Case xong');
    const moc = one(`SELECT note FROM case_milestones WHERE case_id = ? AND kind = 'closed' ORDER BY id DESC LIMIT 1`, c1);
    assert(moc?.note === d.CASE_OUTCOME_LABEL.much_better, `mốc: ${moc?.note}`);
  }));

  check('S4-LUAT ② · đề xuất chuyển lớp của GVCN: Lý do trống vẫn hợp lệ; có Lý do thì giữ nguyên', () => thu(() => {
    const sid = emMoi();
    assert(lenh.kiemDeXuatChuyenLop(P.coreTeacher, sid, { lyDo: '' }).lyDo === '', 'trống');
    assert(lenh.kiemDeXuatChuyenLop(P.coreTeacher, sid, { lyDo: ' PH xin đổi giờ ' }).lyDo === 'PH xin đổi giờ', 'có lý do');
  }));

  check('S4-LUAT đề xuất 9 · ngưỡng chữ xử lý vi phạm: web (XacNhanXuLyPanel, LoYThucPanel) dùng CHU_TOI_THIEU như máy chủ', () => {
    assert(xuLy.MO_TA_MIN === d.CHU_TOI_THIEU, `máy chủ ${xuLy.MO_TA_MIN}`);
    for (const f of ['XacNhanXuLyPanel.tsx', 'LoYThucPanel.tsx']) {
      assert(/const MO_TA_MIN = CHU_TOI_THIEU;/.test(fs.readFileSync(`web/src/modules/yThuc/${f}`, 'utf8')), `${f} chưa dùng CHU_TOI_THIEU`);
    }
  });
}
