/**
 * PHÉP KIỂM PR-OV5a — Công việc làm tại chỗ (đặc tả OV mục 4 "Công việc", 6.6; kế hoạch 2026-10-13-pr-ov5a): Xác nhận nguyên nhân gom theo
 * lớp + kỹ năng + lượt (một em vẫn một dòng gộp, khoá ổn định), đọc nhóm cho panel, xác nhận nhóm MỘT giao dịch (+ PA quy chế cùng lúc), khác mức
 * PA quy chế → 400 nói đúng em, không quyền → 403 cả lô, badge = số dòng, hồ sơ GV đếm = badge, Nhắc dòng gộp, trần câu SQL.
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
  const nv: any = await import('../worklist/nhacViec.ts');
  const hoSo: any = await import('../giaoVien/hoSo.ts');
  const nhom: any = await import('../cases/xacNhanNhom.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { soCauSql, xoaNho } = await import('../platform/nguCanhRequest.ts');
  const { TRAN_GHI_LO } = await import('./tocDoDuong.ts');
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-OV5a · Công việc tại chỗ: gom Xác nhận nguyên nhân, xác nhận nhóm');

  const thu = <T>(fn: () => T): T => {
    conn.exec('BEGIN IMMEDIATE');
    try { return fn(); } finally { conn.exec('ROLLBACK'); xoaNho(); }
  };
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const one = (sql: string, ...a: unknown[]) => all(sql, ...a)[0];
  const loi = (fn: () => unknown): any => { try { fn(); } catch (e) { return e; } return null; };

  const LOP = classId('MB FT 101');
  const gvMon = (k: string) => loadPrincipal(one(`SELECT user_id id FROM teacher_assignments WHERE class_id = ? AND skill = ? AND status = 'active' LIMIT 1`, LOP, k).id);
  const GV_R = gvMon('reading');
  const tuanNay = week.mondayOf(TODAY);
  const tuan = (n: number) => week.ensurePeriod(t.addDays(tuanNay, 7 * n)).id as number;
  const MA_NN = d.issuesForTopic('reading', null)[0].code as string;
  const MO_TA = 'Sai nhiều dạng True / False / Not Given, chưa phân biệt False với Not Given.';
  const PA = { description: 'Mỗi tuần 2 đề Reading dạng True / False / Not Given, tự chấm rồi nộp GV chữa câu sai.' };

  let dem = 0;
  /** Em mới ở MB FT 101: MT1 tuần trước, chốt sẵn (OV-1c), các kỹ năng trong `diem` dưới kỳ vọng → Case SOS chờ nguyên nhân. */
  const em = (diem: Record<string, number>) => {
    const r = intake.commitIntake(P.admin, { classId: LOP, rows: [{ fullName: `OV5a Em ${++dem}`, target: 6.5, startWeek: tuanNay, email: 'hv@demo.test', dob: '2010-01-01' }] });
    const sid = r.studentIds[0] as number;
    const m1 = one(`SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = 'mock' ORDER BY attempt_no LIMIT 1`, sid)?.id as number;
    if (!m1) throw new Error(`em ${sid} không có MT: ${JSON.stringify({ r, lop: one('SELECT status, lich_mt, route, start_date FROM classes WHERE id = ?', LOP), luot: all('SELECT kind, attempt_no, status FROM assessment_attempts WHERE student_id = ?', sid), hom: TODAY })}`);
    skillSch.ensureSkillRows(m1);
    conn.prepare(`UPDATE assessment_attempts SET planned_period_id = ?, plan_source = 'manual' WHERE id = ?`).run(tuan(-1), m1);
    conn.prepare(`UPDATE attempt_skills SET planned_period_id = ?, plan_source = 'manual' WHERE attempt_id = ?`).run(tuan(-1), m1);
    chotSan(conn, m1);
    for (const [k, band] of Object.entries(diem)) attempts.saveScore(gvMon(k), m1, k, { band });
    const caseCua = (k: string) => one(`SELECT id FROM sos_cases WHERE student_id = ? AND topic = ? AND status != 'done'`, sid, k)?.id as number;
    return { sid, ten: `OV5a Em ${dem}`, m1, r: caseCua('reading'), l: caseCua('listening') };
  };
  /** A, B, C: chỉ Reading dưới kỳ vọng (SOS 1 → Tự học); D: R, L, S dưới (SOS 3 → Tutor) — khác mức PA quy chế. */
  const bonEm = () => {
    const [A, B, C] = [em({ reading: 4 }), em({ reading: 4 }), em({ reading: 4.5 })];
    const D = em({ reading: 4, listening: 4, speaking: 4 });
    return { A, B, C, D };
  };
  const dongR = (w: any, caseId: number) => (w.dong as any[]).find((x) => x.group === 'cause' && (x.con ?? []).some((c: any) => c.caseId === caseId));
  const coNguyenNhan = (caseId: number) => !!one(`SELECT 1 x FROM case_issues WHERE case_id = ? AND role = 'primary'`, caseId);
  const paCua = (caseId: number) => one(`SELECT * FROM case_interventions WHERE case_id = ? AND preset = 1 ORDER BY id LIMIT 1`, caseId);

  check('OV5a-1 · gom Xác nhận nguyên nhân theo lớp + kỹ năng + lượt: 4 em Reading MT1 → MỘT dòng "Xác nhận nguyên nhân · Reading", khoá có lượt + kỹ năng; kỹ năng khác dòng khác; dòng phủ đúng mọi việc', () => thu(() => {
    const { A, B, C, D } = bonEm();
    const w = mywork.myWork(GV_R);
    const r = dongR(w, A.r);
    assert(r, 'không có dòng gộp chứa Case Reading của A');
    assert(r.key === `gop:cause:${LOP}:u${GV_R.userId}:mock1:reading`, `khoá: ${r.key}`);
    /* Bộ demo có thể đã có Case Reading MT1 chờ nguyên nhân cùng lớp, cùng GV — cũng vào dòng này (đúng luật gom). */
    const ids = r.con.map((c: any) => c.caseId);
    assert([A.r, B.r, C.r, D.r].every((x) => ids.includes(x)), `con: ${ids}`);
    assert(r.con.every((c: any) => c.gopThem === 'mock1:reading' && c.classId === LOP), 'con khác lớp / kỹ năng / lượt');
    assert(r.tieuDe === 'Xác nhận nguyên nhân · Reading' && r.contextLabel === 'MT1' && r.count === ids.length && r.studentId === null, `${r.tieuDe} / ${r.contextLabel} / ${r.count}`);
    assert(r.href === `/cong-viec?viec=${encodeURIComponent(r.key)}`, `href: ${r.href}`);
    /* D có Case Listening: kỹ năng khác → dòng khác (người giữ việc Listening có thể là GV khác). */
    const gvL = gvMon('listening');
    const rl = dongR(mywork.myWork(gvL), D.l);
    assert(rl && rl.key !== r.key && rl.key.endsWith(':mock1:listening') && rl.con.every((c: any) => c.gopThem === 'mock1:listening'), `dòng Listening: ${rl?.key}`);
    const phang = (w.dong as any[]).flatMap((x) => x.con ?? [x]).map((x) => x.key).sort();
    assert(JSON.stringify(phang) === JSON.stringify((w.items as any[]).map((x) => x.key).sort()), 'dòng không phủ đúng mọi việc');
    assert(w.summary.total === w.dong.length, 'badge ≠ số dòng');
  }));

  check('OV5a-1b · hàm gộp: hai lượt / hai kỹ năng cùng lớp → hai dòng; một em vẫn là dòng gộp (khoá không đổi khi còn một em); Case SOS FT Xác nhận PA vẫn từng dòng', () => {
    const v = (o: Record<string, unknown>) => ({
      key: 'cause:1', group: 'cause', urgency: 'normal', due: null, studentId: 1, studentName: 'An', classId: 10, classCode: 'CP FT 131', khung: 'ft',
      ownerId: 9, tieuDe: 'Xác nhận nguyên nhân Reading · An', contextLabel: 'MT2', count: null, href: '/hoc-vien/1', actionLabel: 'Xác nhận nguyên nhân',
      phu: 'Reading', caseSos: true, gopThem: 'mock2:reading', ...o,
    });
    const nhan = () => 'Xác nhận nguyên nhân';
    const hai = d.gopViecTheoLop([v({}), v({ key: 'cause:2', studentId: 2, gopThem: 'mock3:reading', contextLabel: 'MT3' }),
      v({ key: 'cause:3', studentId: 3, gopThem: 'mock2:listening', phu: 'Listening' }), v({ key: 'cause:4', studentId: 4 })], nhan);
    assert(hai.length === 3 && hai.every((x: any) => x.con), `số dòng: ${hai.length}`);
    const r2 = hai.find((x: any) => x.key === 'gop:cause:10:u9:mock2:reading');
    assert(r2 && r2.con.length === 2 && r2.tieuDe === 'Xác nhận nguyên nhân · Reading' && r2.contextLabel === 'MT2', JSON.stringify(r2?.tieuDe));
    const mot = d.gopViecTheoLop([v({})], nhan);
    assert(mot.length === 1 && mot[0].key === 'gop:cause:10:u9:mock2:reading' && mot[0].con.length === 1 && mot[0].count === 1, `một em: ${mot[0].key}`);
    const pa = d.gopViecTheoLop([v({ key: 'xnpa:1', group: 'xac_nhan_pa', gopThem: null }), v({ key: 'xnpa:2', group: 'xac_nhan_pa', gopThem: null, studentId: 2 })], nhan);
    assert(pa.length === 2, 'Xác nhận PA FT: từng dòng');
  });

  check('OV5a-1c · dòng phạm vi đếm đúng đơn vị: nhóm việc = số dòng; học viên khác nhau (dòng gom sẵn cộng số em); Chấm điểm = bài (kỹ năng × em)', () => {
    const ds = [
      { group: 'cause', studentId: null, count: 3, con: [{ group: 'cause', studentId: 1, count: null }, { group: 'cause', studentId: 2, count: null }, { group: 'cause', studentId: 3, count: null }] },
      { group: 'ghi_ket_qua_pa', studentId: 2, count: null },
      { group: 'score', studentId: null, count: 6, soBai: 12 },
      { group: 'mgmt', studentId: null, count: null },
    ];
    const r = d.demPhamVi(ds, false);
    assert(r.nhom === 4 && r.so === 3 + 6 && r.donVi === 'học viên', JSON.stringify(r));
    const c = d.demPhamVi([ds[2], { group: 'score', studentId: 5, count: 1 }], true);
    assert(c.nhom === 2 && c.so === 13 && c.donVi === 'bài cần chấm', JSON.stringify(c));
  });

  check('OV5a-2 · đọc nhóm cho panel: điểm Reading, kỳ vọng, SOS, PA quy chế từng em; mức chung = mức nhiều em nhất, D (SOS 3, Tutor) "làm riêng"', () => thu(() => {
    const { A, B, C, D } = bonEm();
    const r = nhom.nhomXacNhan(GV_R, [A.r, B.r, C.r, D.r]);
    assert(r.lop.id === LOP && r.kyNang.topic === 'reading' && r.kyNang.nhan === 'Reading' && r.luot.nhan === 'MT1', JSON.stringify([r.lop, r.kyNang, r.luot]));
    const e = (caseId: number) => r.em.find((x: any) => x.caseId === caseId);
    assert(e(A.r).band === 4 && e(C.r).band === 4.5 && typeof e(A.r).kyVong === 'number' && e(A.r).kyVong > 4.5, JSON.stringify(e(A.r)));
    assert(e(A.r).pa?.kind === 'self_study' && e(D.r).pa?.kind === 'tutor', `${e(A.r).pa?.kind} / ${e(D.r).pa?.kind}`);
    assert(e(D.r).sos === 3 && e(D.r).lamRieng === true && [A, B, C].every((x) => e(x.r).lamRieng === false), 'làm riêng');
    assert(r.paChung?.kind === 'self_study' && typeof r.paChung.mocChu === 'string', JSON.stringify(r.paChung));
    assert(loi(() => nhom.nhomXacNhan(P.w1Teacher, [A.r]))?.status === 403, 'GV Writing đọc nhóm Reading');
  }));

  check('OV5a-3 · xác nhận nhóm 3 em + PA cùng lúc: 3 Case có nguyên nhân, PA quy chế chạy từ hôm nay; D còn lại trong CÙNG dòng; badge = số dòng; D riêng không PA → dòng Xác nhận PA', () => thu(() => {
    const { A, B, C, D } = bonEm();
    const w0 = mywork.myWork(GV_R);
    const khoa = dongR(w0, A.r).key;
    const kq = nhom.xacNhanNhom(GV_R, { caseIds: [A.r, B.r, C.r], primaryCode: MA_NN, moTa: MO_TA, pa: PA });
    assert(kq.soEm === 3 && kq.paChay === true && kq.ngay === TODAY && kq.tenPa === d.INTERVENTION_KIND_LABEL.self_study, JSON.stringify(kq));
    for (const x of [A, B, C]) {
      const pa = paCua(x.r);
      assert(coNguyenNhan(x.r), `Case ${x.ten} chưa có nguyên nhân`);
      assert(pa.status === 'started' && pa.started_date === TODAY && pa.confirmed_by === GV_R.userId && pa.description === PA.description, `PA ${x.ten}: ${JSON.stringify(pa)}`);
      assert(one('SELECT urgency FROM sos_cases WHERE id = ?', x.r).urgency === 'attention', 'mức gấp mặc định SOS 1');
    }
    assert(!coNguyenNhan(D.r) && paCua(D.r).status === 'planned', 'D bị ghi');
    const w1 = mywork.myWork(GV_R);
    const r1 = (w1.dong as any[]).find((x) => x.key === khoa);
    const con1 = r1?.con?.map((c: any) => c.caseId) ?? [];
    assert(r1 && con1.includes(D.r) && ![A.r, B.r, C.r].some((x) => con1.includes(x)) && r1.count === con1.length, `dòng còn D: ${JSON.stringify(con1)}`);
    assert(!(w1.dong as any[]).some((x) => x.group === 'xac_nhan_pa' && [A.r, B.r, C.r].includes(x.caseId)), 'còn việc Xác nhận PA của em đã xác nhận cùng lúc');
    assert(w1.summary.total === w0.summary.total && w1.summary.total === w1.dong.length, `badge: ${w0.summary.total} → ${w1.summary.total}`);
    const kd = nhom.xacNhanNhom(GV_R, { caseIds: [D.r], primaryCode: MA_NN, moTa: MO_TA, pa: null });
    assert(kd.paChay === false && coNguyenNhan(D.r) && paCua(D.r).status === 'planned', 'D không PA');
    assert(one('SELECT urgency FROM sos_cases WHERE id = ?', D.r).urgency === 'urgent', 'SOS 3 → Gấp');
    const w2 = mywork.myWork(GV_R);
    const conLai = con1.length - 1;   // Case demo cùng nhóm (nếu có) còn ở dòng
    assert(conLai ? (w2.dong as any[]).find((x) => x.key === khoa)?.con.length === conLai : !(w2.dong as any[]).some((x) => x.key === khoa), 'dòng gộp sai khi bớt D');
    assert((w2.dong as any[]).some((x) => x.group === 'xac_nhan_pa' && x.caseId === D.r && x.paId === paCua(D.r).id), 'thiếu dòng Xác nhận PA của D (kèm paId)');
    assert(w2.summary.total === w1.summary.total + (conLai ? 1 : 0) && w2.summary.total === w2.dong.length, `badge: ${w1.summary.total} → ${w2.summary.total}`);
  }));

  check('OV5a-4 · em khác mức PA quy chế trong danh sách → 400 nói đúng em, KHÔNG ghi gì; khác kỹ năng → 400; nội dung sai → 400 không tên em', () => thu(() => {
    const { A, B, C, D } = bonEm();
    const e = loi(() => nhom.xacNhanNhom(GV_R, { caseIds: [A.r, B.r, C.r, D.r], primaryCode: MA_NN, moTa: MO_TA, pa: PA }));
    assert(e?.status === 400 && e.message.includes(D.ten) && ![A, B, C].some((x) => e.message.includes(x.ten)), `${e?.status} ${e?.message}`);
    assert([A, B, C, D].every((x) => !coNguyenNhan(x.r) && paCua(x.r).status === 'planned'), 'đã ghi một phần');
    const e2 = loi(() => nhom.xacNhanNhom(GV_R, { caseIds: [A.r, D.l], primaryCode: MA_NN, moTa: MO_TA, pa: null }));
    assert(e2?.status === 400 || e2?.status === 403, `khác kỹ năng: ${e2?.status} ${e2?.message}`);
    const e3 = loi(() => nhom.xacNhanNhom(GV_R, { caseIds: [A.r, B.r], primaryCode: MA_NN, moTa: 'ngắn', pa: null }));
    assert(e3?.status === 400 && /15/.test(e3.message) && !e3.message.includes(A.ten), `mô tả: ${e3?.message}`);
    const e4 = loi(() => nhom.xacNhanNhom(GV_R, { caseIds: [A.r, B.r], primaryCode: MA_NN, moTa: MO_TA, pa: { description: 'ngắn' } }));
    assert(e4?.status === 400 && !coNguyenNhan(A.r), `mô tả PA: ${e4?.message}`);
    const e5 = loi(() => nhom.xacNhanNhom(GV_R, { caseIds: [], primaryCode: MA_NN, moTa: MO_TA }));
    assert(e5?.status === 400, 'danh sách rỗng');
  }));

  check('OV5a-5 · GV không phụ trách một Case → 403 cả lô, không ghi gì; QL chi nhánh khác 403', () => thu(() => {
    const { A, B } = bonEm();
    const e = loi(() => nhom.xacNhanNhom(P.w1Teacher, { caseIds: [A.r, B.r], primaryCode: MA_NN, moTa: MO_TA, pa: PA }));
    assert(e?.status === 403 && !coNguyenNhan(A.r) && !coNguyenNhan(B.r), `${e?.status} ${e?.message}`);
    assert(loi(() => nhom.xacNhanNhom(P.cpManager, { caseIds: [A.r], primaryCode: MA_NN, moTa: MO_TA }))?.status === 403, 'QL CP');
  }));

  check(`OV5a-6 · trần câu SQL: xác nhận nhóm 3 em + PA ≤ ${TRAN_GHI_LO.xacNhanNhom3}; đọc nhóm 4 em ≤ ${TRAN_GHI_LO.docNhomXacNhan}; lô tối đa ${nhom.TOI_DA_EM} em ước ≤ ${TRAN_GHI_LO.xacNhanNhomToiDa} (10 s Netlify)`, () => thu(() => {
    const { A, B, C, D } = bonEm();
    const E = em({ reading: 4 });
    const doCau = (fn: () => unknown) => { xoaNho(); const s0 = soCauSql(); fn(); return soCauSql() - s0; };
    const doc = doCau(() => nhom.nhomXacNhan(GV_R, [A.r, B.r, C.r, D.r]));
    const mot = doCau(() => nhom.xacNhanNhom(GV_R, { caseIds: [E.r], primaryCode: MA_NN, moTa: MO_TA, pa: PA }));
    const ba = doCau(() => nhom.xacNhanNhom(GV_R, { caseIds: [A.r, B.r, C.r], primaryCode: MA_NN, moTa: MO_TA, pa: PA }));
    const moiEm = (ba - mot) / 2;
    const toiDa = mot + moiEm * (nhom.TOI_DA_EM - 1);
    console.log(`    đọc nhóm 4 em: ${doc} câu · xác nhận + PA: 1 em ${mot}, 3 em ${ba} (${moiEm}/em) → ${nhom.TOI_DA_EM} em ≈ ${toiDa}`);
    assert(doc <= TRAN_GHI_LO.docNhomXacNhan, `đọc ${doc} > ${TRAN_GHI_LO.docNhomXacNhan}`);
    assert(ba <= TRAN_GHI_LO.xacNhanNhom3, `ghi ${ba} > ${TRAN_GHI_LO.xacNhanNhom3}`);
    assert(toiDa <= TRAN_GHI_LO.xacNhanNhomToiDa, `lô ${nhom.TOI_DA_EM} em ≈ ${toiDa} > ${TRAN_GHI_LO.xacNhanNhomToiDa}`);
    assert(loi(() => nhom.xacNhanNhom(GV_R, { caseIds: Array.from({ length: nhom.TOI_DA_EM + 1 }, (_, i) => i + 1), primaryCode: MA_NN, moTa: MO_TA }))?.status === 400, 'quá trần em không 400');
  }));

  check('OV5a-7 · Nhắc dòng gộp Xác nhận nguyên nhân: QL nhắc một chuông, đường chuông về đúng dòng ở Công việc', () => thu(() => {
    const { A } = bonEm();
    const r = dongR(mywork.myWork(GV_R), A.r);
    const kq = nv.nhacViec(P.mbManager, { key: r.key, ownerId: GV_R.userId });
    assert(kq.daNhacLuc, 'không nhắc được');
    const n = one(`SELECT duong FROM notifications WHERE user_id = ? AND kind = 'nhac_viec' AND dedup_key = ?`, GV_R.userId, `nhac:${r.key}:${TODAY}`);
    assert(n?.duong === r.href, `đường chuông: ${n?.duong}`);
  }));

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
