/**
 * PHÉP KIỂM PR-OV5a — Công việc làm tại chỗ (đặc tả OV mục 4 "Công việc", 6.6; kế hoạch 2026-10-13-pr-ov5a). OV-12c (chủ SP 14/10): panel gom
 * Xác nhận nguyên nhân đã bỏ — khối 1, 1b kiểm luật mới (Case MT cũ chưa nhận xét → mỗi Case một dòng Ghi nhận xét); khối 2–6 (đọc / xác nhận
 * nhóm, trần câu SQL của panel gom) gỡ cùng tính năng; khối 7 (Nhắc) gỡ ở OV-12h. Còn: badge = số dòng, hồ sơ GV đếm = badge, dữ liệu panel.
 * Mỗi phép kiểm dựng ca của nó trong một giao dịch rồi cuộn lại (`thu`).
 */
import type { YThucTestKit } from './yThuc.tests.ts';
import { chotSan } from './luotThu.ts';

export async function runPrOv5aTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, classId } = t;
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const skillSch: any = await import('../fasttrack/skillSchedule.ts');
  const attempts: any = await import('../fasttrack/attempts.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const hoSo: any = await import('../giaoVien/hoSo.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { xoaNho } = await import('../platform/nguCanhRequest.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-OV5a · Công việc tại chỗ (OV-12c: không còn gom Xác nhận nguyên nhân)');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } catch (e) {
      /* Lỗi lạ (không phải assert): kèm 3 dòng vị trí — bộ kiểm chỉ in message. */
      if (e instanceof TypeError) e.message += ` @ ${String(e.stack).split('\n').slice(1, 4).map((x) => x.trim()).join(' | ')}`;
      throw e;
    } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const loi = (fn: () => unknown): any => { try { fn(); } catch (e) { return e; } return null; };

  const LOP = classId('MB FT 101');
  const gvMon = (k: string) => loadPrincipal(one(`SELECT user_id id FROM teacher_assignments WHERE class_id = ? AND skill = ? AND status = 'active' LIMIT 1`, LOP, k).id);
  const GV_R = gvMon('reading');
  const tuanNay = week.mondayOf(TODAY);
  const tuan = (n: number) => week.ensurePeriod(t.addDays(tuanNay, 7 * n)).id as number;

  let dem = 0;
  /** Em mới ở MB FT 101: MT1 tuần trước, chốt sẵn (OV-1c), các kỹ năng trong `diem` dưới kỳ vọng, KHÔNG nhận xét (dữ liệu trước OV-12b) → Case MT cũ "Chờ ghi nhận xét". */
  const em = (diem: Record<string, number>) => {
    const r = intake.commitIntake(P.admin, { classId: LOP, rows: [{ fullName: `OV5a Em ${++dem}`, target: 6.5, startWeek: tuanNay, email: 'hv@demo.test', dob: '2010-01-01' }] });
    const sid = r.studentIds[0] as number;
    const m1 = one(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'mock' ORDER BY attempt_no LIMIT 1`, sid)?.id as number;
    if (!m1) throw new Error(`em ${sid} không có MT: ${JSON.stringify({ r, lop: one('SELECT status, lich_mt, route, start_date FROM classes WHERE id = ?', LOP), luot: all('SELECT kind, attempt_no, status FROM assessment_attempts WHERE student_id = ?', sid), hom: TODAY })}`);
    skillSch.ensureSkillRows(m1);
    conn.prepare(`UPDATE assessment_attempts SET planned_period_id = ?, plan_source = 'manual' WHERE id = ?`).run(tuan(-1), m1);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, plan_source = 'manual' WHERE attempt_id = ?`).run(tuan(-1), m1);
    chotSan(conn, m1);
    /* Quản trị nhập điểm: không phụ thuộc phân công môn của lớp (phép kiểm chạy trước có thể đã đổi GV L / S của MB FT 101). */
    /* OV-4c: W1 / W2 / S ở lượt thường chỉ nhận 4 tiêu chí. */
    for (const [k, band] of Object.entries(diem)) attempts.saveScore(P.admin, m1, k, k === 'listening' || k === 'reading' ? { band } : { criteria: [band, band, band, band] });
    const caseCua = (k: string) => one(`SELECT id FROM sos_cases WHERE student_id = ? AND topic = ? AND status != 'done'`, sid, k)?.id as number;
    return { sid, ten: `OV5a Em ${dem}`, m1, r: caseCua('reading'), l: caseCua('listening') };
  };
  /** A, B, C: chỉ Reading dưới kỳ vọng (SOS 1 → Tự học); D: R, L, S dưới (SOS 3 → Tutor) — khác mức PA quy chế. */
  const bonEm = () => {
    const [A, B, C] = [em({ reading: 4 }), em({ reading: 4 }), em({ reading: 4.5 })];
    const D = em({ reading: 4, listening: 4, speaking: 4 });
    return { A, B, C, D };
  };

  /* OV-12c (chủ SP 14/10): bỏ panel gom Xác nhận nguyên nhân — Case MT lấy nguyên nhân từ nhận xét; Case MT cũ (bài chưa nhận xét) → mỗi Case MỘT dòng "Ghi nhận xét". */
  check('OV5a-1 · (OV-12c) Case MT cũ chưa nhận xét: mỗi Case một dòng "Ghi nhận xét {kỹ năng} · MT1", không dòng gom / không "Xác nhận nguyên nhân"; dòng phủ đúng mọi việc', () => thu(() => {
    const { A, B, C, D } = bonEm();
    const w = mywork.myWork(GV_R);
    assert(!(w.items as any[]).some((x) => x.group === 'cause' && [A.r, B.r, C.r, D.r].includes(x.caseId)), 'còn việc Xác nhận nguyên nhân cho Case MT');
    for (const x of [A, B, C, D]) {
      const it = (w.dong as any[]).find((y) => y.key === `ghi_nhan_xet:${x.r}`);
      assert(it && !it.con && it.group === 'ghi_nhan_xet' && it.tieuDe === `Ghi nhận xét Reading · MT1 · ${x.ten}` && it.luot === 'mt:1' && it.kn === 'reading',
        `dòng ${x.ten}: ${JSON.stringify(it && { k: it.key, t: it.tieuDe, l: it.luot, kn: it.kn, con: !!it.con })}`);
    }
    const phang = (w.dong as any[]).flatMap((x) => x.con ?? [x]).map((x) => x.key).sort();
    assert(JSON.stringify(phang) === JSON.stringify((w.items as any[]).map((x) => x.key).sort()), 'dòng không phủ đúng mọi việc');
    assert(w.summary.total === w.dong.length, 'badge ≠ số dòng');
  }));

  check('OV5a-1b · (OV-12c) hàm gộp: Ghi nhận xét · Xác nhận PA (Case SOS FT) giữ từng dòng; Xác nhận Case lớp thường gộp theo lớp (như trước OV-5a, không khoá kỹ năng + lượt); việc khác cùng lớp vẫn gộp', () => {
    const v = (o: Record<string, unknown>) => ({
      key: 'cause:1', group: 'cause', urgency: 'normal', due: null, studentId: 1, studentName: 'An', classId: 10, classCode: 'MB FOU 12', khung: 'thuong',
      ownerId: 9, tieuDe: 'Xác nhận Case Reading · An', contextLabel: 'Progress Test', count: null, href: '/hoc-vien/1', actionLabel: 'Xác nhận Case',
      phu: 'Reading', caseSos: true, ...o,
    });
    const nhan = (g: string) => g;
    const xn = d.gopViecTheoLop([v({}), v({ key: 'cause:2', studentId: 2 })], nhan);
    assert(xn.length === 1 && xn[0].key === 'gop:cause:10:u9' && xn[0].con.length === 2, `Xác nhận Case lớp thường: ${JSON.stringify(xn.map((x: any) => x.key))}`);
    assert(d.gopViecTheoLop([v({})], nhan)[0].key === 'cause:1', 'một em: dòng như cũ (không còn dòng gom một em)');
    assert(d.gopViecTheoLop([v({ key: 'ghi_nhan_xet:1', group: 'ghi_nhan_xet', khung: 'ft', sos: 1 }), v({ key: 'ghi_nhan_xet:2', group: 'ghi_nhan_xet', khung: 'ft', studentId: 2, sos: 2 })], nhan).length === 2, 'Ghi nhận xét khác mức SOS bị gộp (OV-13c)');
    assert(d.gopViecTheoLop([v({ key: 'xnpa:1', group: 'xac_nhan_pa', khung: 'ft', sos: 1 }), v({ key: 'xnpa:2', group: 'xac_nhan_pa', khung: 'ft', studentId: 2, sos: 2 })], nhan).length === 2, 'Xác nhận PA FT khác mức SOS: từng dòng (OV-13c)');
    const g = d.gopViecTheoLop([v({ key: 'action:1', group: 'ghi_ket_qua_pa', caseSos: false }), v({ key: 'action:2', group: 'ghi_ket_qua_pa', caseSos: false, studentId: 2 })], nhan);
    assert(g.length === 1 && g[0].key === 'gop:ghi_ket_qua_pa:10:u9' && g[0].con.length === 2, `việc khác gộp: ${JSON.stringify(g.map((x: any) => x.key))}`);
  });

  /* OV-11c (CV-1): dòng gom sẵn mang id em (`emIds`) — đếm em KHÁC NHAU, không cộng dồn số em. */
  check('OV5a-1c · dòng phạm vi đếm đúng đơn vị: nhóm việc = số dòng; học viên khác nhau (dòng gom sẵn theo id em); Chấm điểm = bài (kỹ năng × em)', () => {
    const ds = [
      { group: 'cause', studentId: null, count: 3, con: [{ group: 'cause', studentId: 1, count: null }, { group: 'cause', studentId: 2, count: null }, { group: 'cause', studentId: 3, count: null }] },
      { group: 'ghi_ket_qua_pa', studentId: 2, count: null },
      { group: 'score', studentId: null, count: 6, soBai: 12, emIds: [1, 4, 5, 6, 7, 8] },
      { group: 'mgmt', studentId: null, count: null },
    ];
    const r = d.demPhamVi(ds, false);
    assert(r.nhom === 4 && r.so === 8 && r.donVi === 'học viên', JSON.stringify(r));   // em 1 ở hai dòng chỉ đếm một lần
    const c = d.demPhamVi([ds[2], { group: 'score', studentId: 5, count: 1 }], true);
    assert(c.nhom === 2 && c.so === 13 && c.donVi === 'bài cần chấm', JSON.stringify(c));
  });

  check('OV5a-8 · Hồ sơ GV › Việc đang có đếm = badge Công việc (cùng `dong`): GV tự xem, QL xem GV', () => thu(() => {
    bonEm();
    const tong = (v: any[]) => v.reduce((n, x) => n + x.n, 0);
    assert(tong(hoSo.viecCuaGv(GV_R, GV_R.userId)) === mywork.myWork(GV_R).summary.total, 'GV tự xem');
    assert(tong(hoSo.viecCuaGv(P.mbManager, GV_R.userId)) === mywork.viecCuaNguoi(P.mbManager, GV_R.userId).summary.total, 'QL xem GV');
  }));

  check('OV5a-9 · việc mang đủ dữ liệu cho panel: Nhập điểm có mã lượt + kỹ năng; Kết quả PA có paId; nhóm "Kết quả đầu ra" đổi tên, gợi ý có FOU', () => {
    const w = mywork.myWork(GV_R);
    const sc = (w.items as any[]).find((x) => x.group === 'score' && x.classId);
    for (const x of (w.items as any[]).filter((y) => y.group === 'score' && y.classId)) assert(d.docMaLuot(x.luot), `mã lượt sai: ${x.luot}`);
    if (sc) assert(/^((mt|cp):[1-9]\d*|thuong:(progress|final|mt0))$/.test(sc.luot) && typeof sc.kn === 'string', `Nhập điểm: ${sc.luot} ${sc.kn}`);
    const ql = mywork.myWork(P.mbManager, { nguoi: 'tat-ca' });
    const kq = (ql.items as any[]).find((x) => x.group === 'ghi_ket_qua_pa');
    if (kq) assert(kq.paId === Number(kq.key.split(':')[1]), `paId: ${kq.paId} / ${kq.key}`);
    const g = (ql.groups as any[]).find((x) => x.key === 'ky_vong_dau_ra');
    if (g) assert(g.label === 'Kết quả đầu ra' && /FOU/.test(g.hint), `${g.label} / ${g.hint}`);
    assert(mywork.nhanNhomViec('ky_vong_dau_ra') === 'Kết quả đầu ra', `nhãn nhóm: ${mywork.nhanNhomViec('ky_vong_dau_ra')}`);
  });
}
