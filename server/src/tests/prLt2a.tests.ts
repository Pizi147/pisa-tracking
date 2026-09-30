/**
 * PHÉP KIỂM PR-LT2a — lớp thường · Giữa khoá: Case tự tạo, PA Bổ trợ, kế hoạch bài giảng qua Quản lý, Báo PH qua TVV.
 * Kế hoạch: docs/superpowers/plans/2026-09-30-pr-lt2a-giua-khoa.md (khối 1–11 theo Task).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrLt2aTests(t: YThucTestKit) {
  const { check, checkAsync, assert, assertThrows, conn, P, classId, TODAY } = t;
  const d = await import('../../../shared/domain/index.ts');
  const { migratePrLt2a } = await import('../migrate/prLt2a.ts');
  const { default: SqliteDb } = await import('libsql');
  const regular: any = await import('../normal/regular.ts');
  const intake: any = await import('../classes/intake.ts');
  const cases: any = await import('../cases/cases.ts');
  const sosAuto: any = await import('../cases/sosAuto.ts');
  const boTro: any = await import('../cases/boTro.ts');
  const yc: any = await import('../duyet/yeuCau.ts');
  const effectiveness: any = await import('../cases/effectiveness.ts');
  const mywork: any = await import('../worklist/mywork.ts');
  const phoiHop: any = await import('../yThuc/phoiHop.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { createApp } = await import('../app.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  console.log('\nPR-LT2a · Lớp thường Giữa khoá');

  // ------------------------------------------------------------------ khối 1 · luật thuần (Task 1)
  check('LT2a (1) · boTroGiuaKhoa: FOU chung 2 buổi/tuần · BE, ELE 1 buổi/tuần/môn · Pre FOU và FT không có Giữa khoá (PF2)', () => {
    assert(JSON.stringify(d.boTroGiuaKhoa('FOU')) === '{"buoiMoiTuan":2,"chung":true}', 'FOU');
    for (const ct of ['BE', 'ELE']) assert(JSON.stringify(d.boTroGiuaKhoa(ct)) === '{"buoiMoiTuan":1,"chung":false}', ct);
    for (const ct of ['PREFOU', 'FT', null]) assert(d.boTroGiuaKhoa(ct) === null, String(ct));
  });

  check('LT2a (1) · nhomBoTro: FOU cùng một nhóm cho G+V và P; BE khác nhóm theo môn', () => {
    assert(d.nhomBoTro('FOU', 7, 'writing') === d.nhomBoTro('FOU', 7, 'pronunciation'), 'FOU chung');
    assert(d.nhomBoTro('FOU', 7, 'writing') === 'gk:7', 'FOU gk:{id}');
    assert(d.nhomBoTro('BE', 7, 'writing') !== d.nhomBoTro('BE', 7, 'speaking'), 'BE khác nhóm');
    assert(d.nhomBoTro('BE', 7, 'writing') === 'gk:7:writing', 'BE gk:{id}:{môn}');
  });

  check('LT2a (1) · moTaBoTro / tenCaseThuong / mocChuBoTro: đủ chữ, không có SOS', () => {
    const fou = d.moTaBoTro('FOU', 'writing');
    assert(fou.includes('2 buổi/tuần') && fou.includes('trừ buổi Free') && fou.includes('chung'), fou);
    const be = d.moTaBoTro('BE', 'writing');
    assert(be.includes('1 buổi/tuần') && be.includes('W') && be.includes('trừ buổi Free'), be);
    const ten = d.tenCaseThuong({ dot: 'progress', giua: 'G+V không đạt' });
    assert(ten === '[Giữa khoá] G+V không đạt' && !/SOS/.test(ten), ten);
    assert(d.mocChuBoTro(null, t.TODAY) === 'đến Cuối khoá · chưa có lịch', 'chưa có lịch');
    assert(/^đến Cuối khoá · W\d /.test(d.mocChuBoTro(t.addDays(t.TODAY, 20), t.TODAY)), 'mã tuần');
  });

  check('LT2a (1) · nhanKetQuaThuong: 6 ca, KHÔNG ca nào có chữ SOS', () => {
    const base = { kind: 'progress' as const, ct: 'FOU', khongChiaMon: false };
    const du = d.nhanKetQuaThuong({ ...base, scored: 4, required: 4, failedSkills: ['writing', 'pronunciation'], tyLeTong: 0.61 });
    assert(du.chinh === '2/4 môn đạt' && du.phu === 'Không đạt: G+V P' && du.pct === '61%' && du.dat === false, JSON.stringify(du));
    const thieu = d.nhanKetQuaThuong({ ...base, scored: 3, required: 4, failedSkills: ['reading'], tyLeTong: null });
    assert(thieu.chinh === '2/3 môn đạt (đã chấm)' && thieu.pct === null && thieu.dat === false, JSON.stringify(thieu));
    const dat = d.nhanKetQuaThuong({ ...base, scored: 4, required: 4, failedSkills: [], tyLeTong: 0.8 });
    assert(dat.chinh === '4/4 môn đạt' && dat.dat === true && dat.phu === null, JSON.stringify(dat));
    const preFou = d.nhanKetQuaThuong({ kind: 'final', ct: 'PREFOU', scored: 1, required: 1, failedSkills: [], tyLeTong: 0.68, khongChiaMon: true });
    assert(preFou.chinh === '68%' && preFou.dat === false, JSON.stringify(preFou));
    const cuoi = d.nhanKetQuaThuong({ ...base, kind: 'final', scored: 4, required: 4, failedSkills: [], tyLeTong: 0.75 });
    assert(cuoi.chinh === '75%' && cuoi.dat === true, JSON.stringify(cuoi));
    const chua = d.nhanKetQuaThuong({ ...base, scored: 0, required: 4, failedSkills: [], tyLeTong: null });
    assert(chua.chinh === '—' && chua.dat === null, JSON.stringify(chua));
    for (const x of [du, thieu, dat, preFou, cuoi, chua]) assert(!/SOS/.test(JSON.stringify(x)), 'không SOS');
  });

  check('LT2a (1) · trangThaiCaseV4: hai trạng thái kế hoạch, chờ nguyên nhân thắng chờ kế hoạch; viecTiepCuaCase có loại hạn ke-hoach-bo-tro', () => {
    const c = { status: 'open' as const, fromSos: true, hasCause: true, dismissed: false, systemClosed: false, choDuyetKhongTheoDoi: false,
      coPaChoXacNhan: false, hanXacNhan: null };
    const nop = { ...c, boTro: { choNop: true, choDuyet: false, hanKeHoach: '2026-09-20' } };
    const s = d.trangThaiCaseV4(nop, '2026-09-21');
    assert(s.k === 'cho-ke-hoach' && s.t === 'qua-han' && s.chu === 'Chờ nộp kế hoạch bổ trợ', JSON.stringify(s));
    assert(d.trangThaiCaseV4(nop, '2026-09-19').t === 'can-lam', 'chưa quá hạn');
    const duyet = d.trangThaiCaseV4({ ...c, boTro: { choNop: false, choDuyet: true, hanKeHoach: null } }, '2026-09-19');
    assert(duyet.k === 'cho-duyet-ke-hoach' && duyet.t === 'cho-duyet' && duyet.chu === 'Chờ Quản lý duyệt · kế hoạch bổ trợ', JSON.stringify(duyet));
    assert(d.trangThaiCaseV4({ ...nop, hasCause: false }, '2026-09-19').k === 'cho-nguyen-nhan', 'chờ nguyên nhân thắng');
    const v = d.viecTiepCuaCase(nop, [], '2026-09-19');
    assert(v?.chu === 'Nộp kế hoạch bổ trợ' && v.loaiHan === 'ke-hoach-bo-tro' && v.han === '2026-09-20', JSON.stringify(v));
    assert(d.viecTiepCuaCase({ ...c, boTro: { choNop: false, choDuyet: true, hanKeHoach: null } }, [], '2026-09-19')?.chu === 'Chờ Quản lý duyệt kế hoạch', 'chờ duyệt');
    assert(d.mocChuPa({ span: 'den_cuoi_khoa', followupDue: null, mtKe: null, daXacNhan: false }, '2026-09-19') === 'đến Cuối khoá', 'PA chưa chạy');
  });

  check('LT2a (1) · noiDungBaoPh đúng 4 phần tử; nguyên nhân trống → "GVBM chưa xác nhận"; loại thẻ ke_hoach_bo_tro hạn 3 ngày', () => {
    const n = d.noiDungBaoPh({ ketQua: '2/4 môn đạt', monTruot: ['G+V', 'P'], nguyenNhan: [], boTro: 'Bổ trợ 2 buổi/tuần' });
    assert(n.length === 4 && n[2].includes('GVBM chưa xác nhận') && n[1].includes('G+V, P'), JSON.stringify(n));
    assert(d.LOAI_YC_META.ke_hoach_bo_tro.hanNgay === 3 && d.LOAI_YC_META.ke_hoach_bo_tro.phanLoai === 'hoc-thuat', 'thẻ kế hoạch');
    assert((d.INTERVENTION_KINDS as readonly string[]).includes('bo_tro') && !(d.SUPPORT_KINDS as readonly string[]).includes('bo_tro'), 'bo_tro là PA hệ thống');
  });

  // ------------------------------------------------------------------ khối 2 · migrate (Task 2)
  check('LT2a (2) · migrate thêm 2 cột + chỉ mục trên DB cũ, chạy lại không làm gì; DB mới từ schema.sql đã có đủ', () => {
    const coCot = (c: any, cot: string) => (c.prepare('SELECT name FROM pragma_table_info(?)').all('case_interventions') as any[]).some((x) => x.name === cot);
    const coChiMuc = (c: any) => !!c.prepare("SELECT 1 FROM pragma_index_list('case_interventions') WHERE name = 'idx_ci_nhom_bo_tro'").get();
    const tam = new SqliteDb(':memory:');
    tam.exec('CREATE TABLE case_interventions (id INTEGER PRIMARY KEY, case_id INTEGER)');
    const a: string[] = []; migratePrLt2a(tam, a);
    assert(a.length === 2 && coCot(tam, 'nhom_bo_tro') && coCot(tam, 'han_ke_hoach') && coChiMuc(tam), a.join('; '));
    const b: string[] = []; migratePrLt2a(tam, b);
    assert(b.length === 0, `lần 2 vẫn thêm: ${b.join('; ')}`);
    tam.close();
    const c: string[] = []; migratePrLt2a(conn, c);
    assert(c.length === 0 && coCot(conn, 'nhom_bo_tro') && coCot(conn, 'han_ke_hoach') && coChiMuc(conn), 'schema.sql thiếu cột/chỉ mục PR-LT2a');
  });

  // ------------------------------------------------------------------ khối 3 · Giữa khoá tự tạo Case + PA Bổ trợ + Báo PH (Task 3)
  /** Thêm một em vào lớp thường + xếp bài Giữa/Cuối khoá (đường QL) → id các lượt. */
  const taoEm = (ten: string, lop: string) => {
    const cid = classId(lop);
    intake.commitIntake(P.admin, { classId: cid, rows: [{ fullName: ten, email: 'hv@demo.test' }], idempotencyKey: `lt2a-${ten}` });
    regular.planRegularTests(P.admin, cid);
    const st = get('SELECT id FROM students WHERE full_name = ?', ten);
    const luot = (kind: string) => get('SELECT id FROM assessment_attempts WHERE student_id = ? AND kind = ?', st.id, kind)?.id as number | undefined;
    return { id: st.id as number, pt: luot('progress'), ft: luot('final') };
  };
  /** Nhập điểm /20 theo môn. */
  const nhap = (aid: number, dd: Record<string, number>) => {
    for (const [k, v] of Object.entries(dd)) regular.saveRegularScore(P.admin, aid, k, { score: v, total: 20, lyDo: 'Phép kiểm LT2a' });
  };
  const caseCua = (hv: number) => all(`SELECT * FROM sos_cases WHERE student_id = ? ORDER BY id`, hv);
  const paCua = (caseId: number) => all(`SELECT * FROM case_interventions WHERE case_id = ? AND kind = 'bo_tro' ORDER BY id`, caseId);
  const gvcnFou = P.normalCoreTeacher.userId;

  check('LT2a (3) · FOU Giữa khoá trượt G+V, P → 2 Case không nhãn SOS, mỗi Case một PA bổ trợ chờ cùng nhóm, người dạy GVCN; chạy lặp không nhân đôi', () => {
    const em = taoEm('LT2a FOU A', 'MB FOU 12');
    nhap(em.pt!, { listening: 18, reading: 18, writing: 11, speaking: 12 });
    let cs = caseCua(em.id);
    assert(cs.length === 2, `phải 2 Case: ${cs.length}`);
    assert(cs.every((c) => c.sos_level === null && c.origin_kind === 'mock'), 'sos_level phải NULL');
    assert(cs.every((c) => c.han_xac_nhan === d.hanXacNhan(TODAY)), 'hạn xác nhận 3 ngày tính cả hôm nay');
    const ten = cs.map((c) => cases.caseTitleOf(c)).sort();
    assert(ten[0] === '[Giữa khoá] G+V không đạt' && ten[1] === '[Giữa khoá] P không đạt' && !ten.some((x) => /SOS|MT/.test(x)), ten.join(' | '));
    const pas = cs.flatMap((c) => paCua(c.id));
    assert(pas.length === 2 && pas.every((x) => x.status === 'planned' && x.preset === 1 && x.confirmed_at === null && x.confirmed_by === null), 'PA chờ');
    assert(new Set(pas.map((x) => x.nhom_bo_tro)).size === 1 && pas[0].nhom_bo_tro === `gk:${em.pt}`, 'cùng một nhóm FOU');
    assert(pas.every((x) => x.performer_user_id === gvcnFou && x.moc_quy_che === 'den_cuoi_khoa' && x.han_ke_hoach === d.hanXacNhan(TODAY)), 'người dạy = GVCN');
    assert(pas.every((x) => x.description.includes('2 buổi/tuần') && x.description.includes('trừ buổi Free')), pas[0].description);
    nhap(em.pt!, { writing: 11, speaking: 12 });   // lưu lại điểm
    cs = caseCua(em.id);
    assert(cs.length === 2 && cs.flatMap((c) => paCua(c.id)).length === 2, 'chạy lặp không thêm Case/PA');
    assert(all(`SELECT 1 FROM sos_coordination_actions WHERE attempt_id = ? AND kind = 'bao_ph_tvv' AND status = 'pending'`, em.pt).length === 1, 'một dòng Báo PH');
    const tb = all(`SELECT user_id, title, body, dedup_key FROM notifications WHERE dedup_key IN (?, ?, ?)`, `sos-case:${cs[0].id}`, `sos-case:${cs[1].id}`, `bao-ph:${em.pt}`);
    assert(tb.filter((x) => x.dedup_key === `bao-ph:${em.pt}`).length === 1 && tb.some((x) => x.user_id === gvcnFou && /Báo phụ huynh qua TVV/.test(x.title)), 'GVCN nhận một thông báo Báo PH');
    assert(tb.filter((x) => /^sos-case:/.test(x.dedup_key)).length === 2, 'mỗi Case một thông báo cho GVBM');
    assert(!tb.some((x) => /SOS/.test(`${x.title} ${x.body}`)), 'không thông báo nào có chữ SOS');
  });

  check('LT2a (3) · BE Giữa khoá trượt W, S → 2 PA KHÁC nhóm, người dạy = GVBM từng môn', () => {
    const em = taoEm('LT2a BE A', 'MB BE 08');
    nhap(em.pt!, { listening: 18, reading: 18, writing: 10, speaking: 10 });
    const pas = caseCua(em.id).flatMap((c) => paCua(c.id));
    assert(pas.length === 2 && new Set(pas.map((x) => x.nhom_bo_tro)).size === 2, 'hai nhóm');
    assert(pas.every((x) => /^gk:\d+:(writing|speaking)$/.test(x.nhom_bo_tro) && x.description.includes('1 buổi/tuần')), pas.map((x) => x.nhom_bo_tro).join());
    const dayW = pas.find((x) => x.nhom_bo_tro.endsWith('writing'))!.performer_user_id, dayS = pas.find((x) => x.nhom_bo_tro.endsWith('speaking'))!.performer_user_id;
    const gv = (lop: string, skill: string) => get(`SELECT ta.user_id u FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id WHERE c.code = ? AND ta.skill = ? AND ta.status = 'active'`, lop, skill).u;
    assert(dayW === gv('MB BE 08', 'writing') && dayS === gv('MB BE 08', 'speaking'), `người dạy ${dayW}/${dayS}`);
  });

  check('LT2a (3) · Cuối khoá trượt → 0 tín hiệu, 0 Case (cả FOU và Pre FOU); Giữa khoá sửa lên đạt → Case tự huỷ + PA huỷ, hết môn trượt → Báo PH removed', () => {
    const em = taoEm('LT2a FOU B', 'MB FOU 12');
    nhap(em.ft!, { listening: 5, reading: 5, writing: 5, speaking: 5 });
    assert(!all('SELECT 1 FROM case_signals WHERE attempt_id = ?', em.ft).length && !caseCua(em.id).length, 'Cuối khoá FOU không tín hiệu/Case');
    const pre = taoEm('LT2a PRE A', 'MB Pre FOU 03');
    for (const aid of [pre.pt, pre.ft].filter(Boolean) as number[]) nhap(aid, { tong_hop: 5 });
    assert(!all('SELECT 1 FROM case_signals WHERE student_id = ?', pre.id).length && !caseCua(pre.id).length, 'Pre FOU không tín hiệu/Case');

    nhap(em.pt!, { listening: 18, reading: 18, writing: 11, speaking: 12 });
    const [cGv, cP] = ['writing', 'speaking'].map((k) => caseCua(em.id).find((c) => c.topic === k)!);
    nhap(em.pt!, { writing: 18 });
    assert(get('SELECT status FROM sos_cases WHERE id = ?', cGv.id).status === 'done' && paCua(cGv.id).every((x) => x.status === 'cancelled'), 'Case G+V phải tự huỷ cùng PA');
    assert(get('SELECT status FROM sos_cases WHERE id = ?', cP.id).status !== 'done', 'Case P giữ');
    assert(get(`SELECT status FROM sos_coordination_actions WHERE attempt_id = ? AND kind = 'bao_ph_tvv'`, em.pt).status === 'pending', 'còn môn trượt → Báo PH giữ');
    nhap(em.pt!, { speaking: 18 });
    assert(get(`SELECT status FROM sos_coordination_actions WHERE attempt_id = ? AND kind = 'bao_ph_tvv'`, em.pt).status === 'removed', 'hết môn trượt → Báo PH removed');
  });

  // ------------------------------------------------------------------ khối 4 · Xác nhận Case + Nộp kế hoạch + thẻ kế hoạch (Task 4)
  const gvOf = (lop: string, skill: string) => loadPrincipal(get(`SELECT ta.user_id u FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id WHERE c.code = ? AND ta.skill = ? AND ta.status = 'active'`, lop, skill).u);
  const theKh = (caseId: number) => get(`SELECT y.* FROM yeu_cau_duyet y JOIN case_interventions iv ON iv.id = y.doi_tuong_id WHERE y.loai = 'ke_hoach_bo_tro' AND iv.nhom_bo_tro = (SELECT nhom_bo_tro FROM case_interventions WHERE case_id = ? AND kind = 'bo_tro' LIMIT 1) ORDER BY y.id DESC LIMIT 1`, caseId);
  const paBt = (caseId: number) => get(`SELECT * FROM case_interventions WHERE case_id = ? AND kind = 'bo_tro' AND status != 'cancelled' ORDER BY id LIMIT 1`, caseId);
  const XN = (topic: string, ct: string) => ({ primaryCode: d.issuesForTopic(topic, ct)[0].code, urgency: 'attention', moTa: 'Em mất điểm ở phần này, thiếu nền tảng ngữ pháp cơ bản.' });
  const KH = { noiDungYeu: 'Thì hiện tại đơn và quá khứ đơn còn nhầm lẫn khi viết câu.', keHoach: 'Buổi 1: ôn thì; buổi 2: luyện viết đoạn ngắn; trọng tâm: chia động từ; bài tập về nhà 10 câu.' };
  const maLoi = (fn: () => unknown) => { try { fn(); return 200; } catch (e: any) { return e.status ?? 500; } };
  const caseTheoMon = (hv: number, topic: string) => get('SELECT * FROM sos_cases WHERE student_id = ? AND topic = ? ORDER BY id DESC', hv, topic);
  const chiTiet = (who: any, caseId: number) => cases.caseDetail(who, caseId) as any;

  check('LT2a (4) · BE: GVBM W xác nhận THIẾU kế hoạch → 400; đủ → Case "Chờ Quản lý duyệt · kế hoạch bổ trợ", thẻ chờ hạn 3 ngày, PA còn chờ; QL duyệt → PA chạy (hạn T2 tuần sau, mốc Cuối khoá, người nộp), Case Đang làm', () => {
    const em = taoEm('LT2a BE KH', 'MB BE 08');
    nhap(em.pt!, { listening: 18, reading: 18, writing: 10, speaking: 18 });
    const c = caseTheoMon(em.id, 'writing');
    const khoa = gvOf('MB BE 08', 'writing');
    assertThrows(() => sosAuto.xacNhanCase(khoa, c.id, XN('writing', 'BE')), /Gửi kèm kế hoạch bài giảng/, 'thiếu kế hoạch');
    assertThrows(() => sosAuto.xacNhanCase(khoa, c.id, { ...XN('writing', 'BE'), keHoach: { noiDungYeu: 'ngắn', keHoach: 'ngắn' } }), /ít nhất 15 ký tự/, 'kế hoạch quá ngắn');
    assert(!get('SELECT 1 FROM case_issues WHERE case_id = ?', c.id), 'Lỗi kế hoạch không được ghi nguyên nhân nửa chừng');
    sosAuto.xacNhanCase(khoa, c.id, { ...XN('writing', 'BE'), keHoach: KH });
    const dt = chiTiet(khoa, c.id);
    assert(dt.trangThaiV4.k === 'cho-duyet-ke-hoach' && dt.trangThaiV4.chu === 'Chờ Quản lý duyệt · kế hoạch bổ trợ', JSON.stringify(dt.trangThaiV4));
    const the = theKh(c.id);
    assert(the && the.trang_thai === 'cho' && the.phan_loai === 'hoc-thuat' && the.han_duyet === d.hanTheoNgay(TODAY, 3) && the.nguoi_xin === khoa.userId, JSON.stringify(the));
    assert(paBt(c.id).status === 'planned' && paBt(c.id).confirmed_at === null, 'PA vẫn chờ khi thẻ chưa duyệt');
    assert(dt.boTro?.keHoach?.trangThai === 'cho' && dt.boTro.keHoach.keHoach === KH.keHoach && dt.boTro.chung === false, JSON.stringify(dt.boTro));
    assertThrows(() => boTro.nopKeHoachBoTro(khoa, paBt(c.id).id, KH), /đang chờ Quản lý duyệt/, 'nộp lần hai khi thẻ đang chờ');
    yc.duyetYeuCau(P.mbManager, the.id);
    const pa = paBt(c.id);
    assert(pa.status === 'started' && pa.confirmed_by === khoa.userId && pa.action_due === d.weeklyUpdateDue(TODAY) && pa.started_date === TODAY, JSON.stringify(pa));
    assert(pa.followup_due === boTro.mocCuoiKhoa(em.pt ? get('SELECT cycle_id c FROM assessment_attempts WHERE id = ?', em.pt).c : null, classId('MB BE 08')), 'mốc Cuối khoá');
    assert(chiTiet(khoa, c.id).trangThaiV4.k === 'dang-lam' && get('SELECT status FROM sos_cases WHERE id = ?', c.id).status === 'in_progress', 'Case Đang làm');
    const moc = all('SELECT kind FROM case_milestones WHERE case_id = ?', c.id).map((m) => m.kind);
    assert(['xac_nhan_case', 'nop_ke_hoach', 'ke_hoach_duyet'].every((k) => moc.includes(k)), moc.join());
  });

  check('LT2a (4) · FOU: GVBM G+V xác nhận (không kế hoạch) → "Chờ nộp kế hoạch bổ trợ" hạn han_ke_hoach; GVCN nộp → MỘT thẻ cho cả nhóm; duyệt → PA G+V chạy, PA P còn chờ; GVBM P xác nhận sau → PA P chạy ngay', () => {
    const em = taoEm('LT2a FOU KH', 'MB FOU 12');
    nhap(em.pt!, { listening: 18, reading: 18, writing: 11, speaking: 12 });
    const cGv = caseTheoMon(em.id, 'writing'), cP = caseTheoMon(em.id, 'speaking');
    const khoa = gvOf('MB FOU 12', 'writing'), trang = gvOf('MB FOU 12', 'speaking'), ha = P.normalCoreTeacher;
    sosAuto.xacNhanCase(khoa, cGv.id, XN('writing', 'FOU'));           // không kèm kế hoạch (không phải người dạy)
    const dt = chiTiet(khoa, cGv.id);
    assert(dt.trangThaiV4.k === 'cho-ke-hoach' && dt.trangThaiV4.chu === 'Chờ nộp kế hoạch bổ trợ' && dt.trangThaiV4.han === d.hanXacNhan(TODAY), JSON.stringify(dt.trangThaiV4));
    assert(dt.viecTiep?.chu === 'Nộp kế hoạch bổ trợ' && dt.viecTiep.loaiHan === 'ke-hoach-bo-tro', JSON.stringify(dt.viecTiep));
    assert(dt.boTro.coTheNop === false && chiTiet(ha, cGv.id).boTro.coTheNop === true, 'Chỉ người dạy / GVCN / QL nộp được');
    /* Phủ định: GVBM P (không phải người dạy, không GVCN) nộp → 403; GVCN đã có nguyên nhân một môn → nộp được */
    assert(maLoi(() => boTro.nopKeHoachBoTro(trang, paBt(cGv.id).id, KH)) === 403, 'GVBM P nộp kế hoạch chung phải 403');
    assert(maLoi(() => boTro.nopKeHoachBoTro(P.w2Teacher, paBt(cGv.id).id, KH)) === 403, 'GV lớp khác nộp phải 403');
    boTro.nopKeHoachBoTro(ha, paBt(cGv.id).id, KH);
    const cacThe = all(`SELECT * FROM yeu_cau_duyet WHERE loai = 'ke_hoach_bo_tro' AND trang_thai = 'cho' AND hoc_vien_id = ?`, em.id);
    assert(cacThe.length === 1, `MỘT thẻ cho cả nhóm: ${cacThe.length}`);
    assert(maLoi(() => yc.duyetYeuCau(ha, cacThe[0].id)) === 403, 'GVCN không có quyền duyệt thẻ');
    yc.duyetYeuCau(P.mbManager, cacThe[0].id);
    assert(paBt(cGv.id).status === 'started' && paBt(cGv.id).confirmed_by === ha.userId, 'PA G+V chạy, người nộp = GVCN');
    assert(paBt(cP.id).status === 'planned' && paBt(cP.id).confirmed_at === null, 'PA P (chưa có nguyên nhân) vẫn chờ');
    sosAuto.xacNhanCase(trang, cP.id, XN('speaking', 'FOU'));
    assert(paBt(cP.id).status === 'started' && paBt(cP.id).confirmed_by === ha.userId, 'Môn xác nhận sau tự chạy theo kế hoạch đã duyệt');
    assert(paBt(cGv.id).nhom_bo_tro === paBt(cP.id).nhom_bo_tro, 'cùng một nhóm');
  });

  check('LT2a (4) · QL từ chối (lý do): nguyên nhân GIỮ, han_ke_hoach = hôm nay + 2, việc Nộp kế hoạch trở lại, người dạy nhận thông báo; nộp lại được', () => {
    const em = taoEm('LT2a BE TC', 'MB BE 08');
    nhap(em.pt!, { listening: 18, reading: 18, writing: 10, speaking: 18 });
    const c = caseTheoMon(em.id, 'writing'); const khoa = gvOf('MB BE 08', 'writing');
    sosAuto.xacNhanCase(khoa, c.id, { ...XN('writing', 'BE'), keHoach: KH });
    const the = theKh(c.id);
    assertThrows(() => yc.tuChoiYeuCau(P.mbManager, the.id, 'ab'), /lý do/, 'từ chối phải có lý do');
    yc.tuChoiYeuCau(P.mbManager, the.id, 'Kế hoạch chưa nêu rõ trọng tâm từng buổi, bổ sung giúp.');
    assert(get('SELECT 1 FROM case_issues WHERE case_id = ? AND role = ?', c.id, 'primary'), 'nguyên nhân phải giữ');
    assert(paBt(c.id).han_ke_hoach === d.hanXacNhan(TODAY) && paBt(c.id).status === 'planned', 'hạn nộp mới, PA còn chờ');
    const dt = chiTiet(khoa, c.id);
    assert(dt.trangThaiV4.k === 'cho-ke-hoach' && dt.viecTiep.chu === 'Nộp kế hoạch bổ trợ', JSON.stringify(dt.trangThaiV4));
    assert(dt.boTro.keHoach?.trangThai === 'tu_choi' && /trọng tâm/.test(dt.boTro.keHoach.lyDoTuChoi), 'panel phải cho thấy lý do từ chối');
    assert(all('SELECT 1 FROM notifications WHERE user_id = ? AND dedup_key = ?', khoa.userId, `ke-hoach-tu-choi:${the.id}:${khoa.userId}`).length === 1, 'người dạy nhận thông báo');
    boTro.nopKeHoachBoTro(khoa, paBt(c.id).id, KH);                   // nộp lại
    assert(theKh(c.id).trang_thai === 'cho' && theKh(c.id).id !== the.id, 'thẻ mới');
  });

  await checkAsync('LT2a (4) · HTTP: POST /cases/:id/xac-nhan kèm kế hoạch → 200; POST /bo-tro/:id/ke-hoach vai sai (GV lớp FT) → 403, GVCN → 200', async () => {
    const em = taoEm('LT2a HTTP', 'MB BE 08');
    nhap(em.pt!, { listening: 18, reading: 18, writing: 10, speaking: 10 });
    const cW = caseTheoMon(em.id, 'writing'), cS = caseTheoMon(em.id, 'speaking');
    const may = createApp().listen(0);
    const cong = (may.address() as any).port as number;
    const goi = async (uid: number, url: string, body: unknown) => {
      const ss = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId: uid }) });
      const ck = (ss.headers.get('set-cookie') ?? '').split(';')[0];
      return fetch(`http://127.0.0.1:${cong}/api${url}`, { method: 'POST', headers: { 'content-type': 'application/json', cookie: ck }, body: JSON.stringify(body) });
    };
    try {
      const khoa = gvOf('MB BE 08', 'writing'), trang = gvOf('MB BE 08', 'speaking');
      const r1 = await goi(khoa.userId, `/cases/${cW.id}/xac-nhan`, { ...XN('writing', 'BE'), keHoach: KH });
      assert(r1.status === 200, `xác nhận + kế hoạch: ${r1.status} ${await r1.text()}`);
      const r2 = await goi(trang.userId, `/cases/${cS.id}/xac-nhan`, XN('speaking', 'BE'));
      assert(r2.status === 400, `thiếu kế hoạch phải 400: ${r2.status}`);
      const r3 = await goi(P.w2Teacher.userId, `/bo-tro/${paBt(cS.id).id}/ke-hoach`, KH);
      assert(r3.status === 403, `GV lớp FT nộp kế hoạch phải 403: ${r3.status}`);
      const r4 = await goi(trang.userId, `/cases/${cS.id}/xac-nhan`, { ...XN('speaking', 'BE'), keHoach: KH });
      assert(r4.status === 200, `GVBM S BE gửi kèm: ${r4.status}`);
    } finally { may.close(); }
  });

  // ------------------------------------------------------------------ khối 5 · PA Bổ trợ đang chạy: ghi kết quả chép cả nhóm, kết quả cuối, Không cần theo dõi (Task 5)
  /** FOU trượt G+V và P; cả hai đã xác nhận nguyên nhân, GVCN nộp kế hoạch, Quản lý duyệt → hai PA chạy cùng nhóm. */
  const dungFouChay = (ten: string) => {
    const em = taoEm(ten, 'MB FOU 12');
    nhap(em.pt!, { listening: 18, reading: 18, writing: 11, speaking: 12 });
    const cGv = caseTheoMon(em.id, 'writing'), cP = caseTheoMon(em.id, 'speaking');
    const khoa = gvOf('MB FOU 12', 'writing'), trang = gvOf('MB FOU 12', 'speaking'), ha = P.normalCoreTeacher;
    sosAuto.xacNhanCase(khoa, cGv.id, XN('writing', 'FOU'));
    sosAuto.xacNhanCase(trang, cP.id, XN('speaking', 'FOU'));
    boTro.nopKeHoachBoTro(ha, paBt(cGv.id).id, KH);
    yc.duyetYeuCau(P.mbManager, theKh(cGv.id).id);
    return { em, cGv, cP, khoa, trang, ha };
  };
  const KQ = { outcome: 'improved', note: 'Em viết đúng thì ở phần đặt câu, còn nhầm thì quá khứ.', decision: 'keep' };
  const folCua = (ivId: number) => all('SELECT * FROM case_followups WHERE intervention_id = ? ORDER BY id', ivId);

  check('LT2a (5) · FOU nhóm 2 PA chạy: GVCN ghi kết quả dòng G+V → dòng P có followup GIỐNG HỆT + cùng hạn; GV không liên quan → 403; quyết định chỉ Giữ nguyên · Điều chỉnh · Xin hỗ trợ QL', () => {
    const { cGv, cP, ha } = dungFouChay('LT2a FOU KQ');
    /* MB FOU 12 đang ở tuần Cuối khoá (mốc < hạn T2 kế) — đẩy mốc xa để lần ghi này là kết quả tuần, không phải "kết quả cuối". */
    conn.prepare('UPDATE case_interventions SET followup_due = ? WHERE nhom_bo_tro = ?').run(d.addDaysIso(TODAY, 28), paBt(cGv.id).nhom_bo_tro);
    const ivGv = paBt(cGv.id), ivP = paBt(cP.id);
    assert(ivGv.status === 'started' && ivP.status === 'started' && ivGv.action_due === ivP.action_due, 'hai PA chạy cùng hạn');
    assert(maLoi(() => cases.updateResult(P.w2Teacher, ivGv.id, KQ)) === 403, 'GV không liên quan ghi kết quả → 403');
    assert(maLoi(() => cases.updateResult(ha, ivGv.id, { ...KQ, decision: 'complete' })) === 400, 'PA theo quy chế không kết thúc sớm');
    assert(d.quyetDinhChoPa({ preset: true }, false).join() === 'keep,adjust,ask_manager', 'quyết định cho PA bắt buộc');
    cases.updateResult(ha, ivGv.id, KQ);
    const fg = folCua(ivGv.id), fp = folCua(ivP.id);
    assert(fg.length === 1 && fp.length === 1, `mỗi dòng đúng một followup: ${fg.length}/${fp.length}`);
    for (const k of ['observed_on', 'outcome', 'note', 'next_step', 'cycle_no', 'late', 'remaining_issue', 'decision_note']) assert(fg[0][k] === fp[0][k], `followup khác ở ${k}`);
    assert(paBt(cGv.id).action_due === paBt(cP.id).action_due && paBt(cP.id).cycle_no === 2 && paBt(cP.id).status === 'started', `PA P cũng sang chu kỳ mới, cùng hạn: ${JSON.stringify([paBt(cGv.id).action_due, paBt(cGv.id).cycle_no, paBt(cP.id).action_due, paBt(cP.id).cycle_no, paBt(cP.id).status])}`);
    /* Xin hỗ trợ QL chỉ MỘT thẻ (dòng chính) */
    cases.updateResult(ha, ivGv.id, { ...KQ, decision: 'ask_manager', decisionNote: 'Cần Quản lý gợi ý thêm giáo trình luyện thì.' });
    const the = all(`SELECT * FROM yeu_cau_duyet WHERE loai = 'xin_y_kien' AND doi_tuong_id IN (?, ?)`, ivGv.id, ivP.id);
    assert(the.length === 1 && the[0].doi_tuong_id === ivGv.id, 'chỉ một thẻ Xin ý kiến');
  });

  check('LT2a (5) · Tuần Cuối khoá: Hoàn thành ẩn tới khi PA khép (dòng "Hoàn thành được sau khi PA theo quy chế kết thúc (đến Cuối khoá · …)"); ghi kết quả cuối → CẢ HAI PA completed het_moc; rồi việc tiếp "Hoàn thành Case"', () => {
    const { cGv, cP, ha } = dungFouChay('LT2a FOU CUOI');
    const dt0 = chiTiet(ha, cGv.id);
    assert(dt0.hoanThanh?.an === true && /Hoàn thành được sau khi PA theo quy chế kết thúc \(đến Cuối khoá/.test(dt0.hoanThanh.dong), JSON.stringify(dt0.hoanThanh));
    conn.prepare(`UPDATE case_interventions SET followup_due = ? WHERE nhom_bo_tro = ?`).run(d.addDaysIso(TODAY, -1), paBt(cGv.id).nhom_bo_tro);
    assert(/^Ghi kết quả cuối/.test(chiTiet(ha, cGv.id).viecTiep.chu), `việc tiếp: ${chiTiet(ha, cGv.id).viecTiep.chu}`);
    cases.updateResult(ha, paBt(cGv.id).id, { outcome: 'improved', note: 'Đã đạt yêu cầu về thì và cách đặt câu cơ bản.' });
    for (const c of [cGv, cP]) {
      const pa = paBt(c.id);
      assert(pa.status === 'completed' && pa.closed_reason === 'het_moc', `PA ${c.topic}: ${pa.status}/${pa.closed_reason}`);
    }
    assert(chiTiet(ha, cGv.id).viecTiep.chu === 'Hoàn thành Case' && chiTiet(ha, cGv.id).hoanThanh.an === false, 'khép xong → Hoàn thành Case');
    /* Hiệu quả PA: PA bổ trợ completed được đếm */
    const dem = effectiveness.planOutcomes({ studentIds: [cGv.student_id] }) as any[];
    assert(dem.some((r) => r.id === paBt(cGv.id).id) && dem.some((r) => r.id === paBt(cP.id).id), 'PA bổ trợ đã khép phải vào thống kê hiệu quả');
  });

  check('LT2a (5) · Không cần theo dõi Case P (chưa nguyên nhân) đã duyệt → PA P cancelled khong_theo_doi (không vào hiệu quả), PA G+V vẫn giữ; Tạm dừng → Quay lại → han_ke_hoach = hôm nay + 2', () => {
    const em = taoEm('LT2a FOU KTD', 'MB FOU 12');
    nhap(em.pt!, { listening: 18, reading: 18, writing: 11, speaking: 12 });
    const cGv = caseTheoMon(em.id, 'writing'), cP = caseTheoMon(em.id, 'speaking');
    const khoa = gvOf('MB FOU 12', 'writing'), trang = gvOf('MB FOU 12', 'speaking');
    sosAuto.xacNhanCase(khoa, cGv.id, XN('writing', 'FOU'));
    sosAuto.guiKhongTheoDoi(trang, cP.id, { reasonCode: 'single_incident' });
    yc.duyetYeuCau(P.mbManager, get(`SELECT id FROM yeu_cau_duyet WHERE loai = 'khong_theo_doi' AND doi_tuong_id = ? ORDER BY id DESC LIMIT 1`, cP.id).id);
    const pP = get(`SELECT * FROM case_interventions WHERE case_id = ? AND kind = 'bo_tro'`, cP.id);
    assert(pP.status === 'cancelled' && pP.closed_reason === 'khong_theo_doi', `PA P: ${pP.status}/${pP.closed_reason}`);
    assert(paBt(cGv.id).status === 'planned', 'PA G+V vẫn chờ');
    assert(!(effectiveness.planOutcomes({ studentIds: [em.id] }) as any[]).some((r) => r.id === pP.id), 'PA không theo dõi không vào hiệu quả');
    conn.prepare('UPDATE case_interventions SET han_ke_hoach = ? WHERE id = ?').run(d.addDaysIso(TODAY, -5), paBt(cGv.id).id);
    sosAuto.datLaiHanCase(em.id, TODAY);
    assert(paBt(cGv.id).han_ke_hoach === d.hanXacNhan(TODAY), `Quay lại học: han_ke_hoach = ${paBt(cGv.id).han_ke_hoach}`);
  });

  // ------------------------------------------------------------------ khối 7 · Việc cần làm + Phối hợp + thông báo (Task 7)
  const dongViec = (who: any, tienTo: string, hv?: number) => ((mywork.myWork(who) as any).items as any[]).filter((x) => x.key.startsWith(tienTo) && (hv === undefined || x.studentId === hv));

  check('LT2a (7) · GVCN FOU /my-work: "Nộp kế hoạch bổ trợ" (hạn đúng, một dòng mỗi nhóm) + "Báo phụ huynh qua TVV" (không hạn); nộp xong → dòng kế hoạch biến mất; GVBM không phải người dạy không thấy; không có "Xác nhận PA" cho PA bổ trợ', () => {
    const em = taoEm('LT2a VIEC', 'MB FOU 12');
    nhap(em.pt!, { listening: 18, reading: 18, writing: 11, speaking: 12 });
    const cGv = caseTheoMon(em.id, 'writing'), cP = caseTheoMon(em.id, 'speaking');
    const khoa = gvOf('MB FOU 12', 'writing'), trang = gvOf('MB FOU 12', 'speaking'), ha = P.normalCoreTeacher;
    assert(!dongViec(ha, 'kehoach:', em.id).length, 'chưa ai xác nhận nguyên nhân → chưa có việc nộp kế hoạch');
    sosAuto.xacNhanCase(khoa, cGv.id, XN('writing', 'FOU'));
    const kh = dongViec(ha, 'kehoach:', em.id);
    assert(kh.length === 1 && kh[0].group === 'ke_hoach_bo_tro' && kh[0].due === d.hanXacNhan(TODAY), `dòng kế hoạch: ${JSON.stringify(kh.map((x) => [x.group, x.due]))}`);
    assert(kh[0].tieuDe === `Nộp kế hoạch bổ trợ · Giữa khoá · G+V, P · Học viên LT2a VIEC` || /^Nộp kế hoạch bổ trợ · Giữa khoá · G\+V, P · /.test(kh[0].tieuDe), kh[0].tieuDe);
    assert(d.LOAI_HAN_CUA_VIEC.ke_hoach_bo_tro === 'ke-hoach-bo-tro' && d.nhomViecCua('ke_hoach_bo_tro') === 'case-hoc-thuat' && d.nhomViecCua('phoi_hop') === 'case-hoc-thuat', 'nhóm + loại hạn');
    const bp = dongViec(ha, 'baoph:', em.id);
    assert(bp.length === 1 && bp[0].group === 'phoi_hop' && bp[0].due === null && bp[0].tieuDe === 'Báo phụ huynh qua TVV · LT2a VIEC · Giữa khoá', `Báo PH: ${JSON.stringify(bp.map((x) => [x.group, x.due, x.tieuDe]))}`);
    assert(!dongViec(khoa, 'kehoach:', em.id).length && !dongViec(khoa, 'baoph:', em.id).length, 'GVBM G+V không phải người dạy — không thấy việc nộp kế hoạch / Báo PH');
    assert(!dongViec(khoa, 'xnpa:', em.id).length && !dongViec(ha, 'xnpa:', em.id).length, 'không có dòng "Xác nhận PA" cho PA bổ trợ');
    boTro.nopKeHoachBoTro(ha, paBt(cGv.id).id, KH);
    assert(!dongViec(ha, 'kehoach:', em.id).length, 'nộp xong → dòng biến mất');
    /* QL thấy dòng của GV ở "Tất cả trong phạm vi" khi chưa nộp: dựng nhóm mới */
    void cP; void trang;
  });

  check('LT2a (7) · Nhóm 2 PA đang chạy → MỘT dòng "Ghi kết quả" (id nhỏ nhất) nói "PA chung · G+V, P"; GVCN ghi được, GV không liên quan không thấy', () => {
    const { cGv, cP, ha, em } = dungFouChay('LT2a FOU VIEC');
    conn.prepare('UPDATE case_interventions SET action_due = ? WHERE nhom_bo_tro = ?').run(TODAY, paBt(cGv.id).nhom_bo_tro);
    const rows = dongViec(ha, 'action:', em.id);
    assert(rows.length === 1 && rows[0].key === `action:${paBt(cGv.id).id}` && /PA chung · G\+V, P/.test(rows[0].reason), `dòng: ${JSON.stringify(rows.map((x) => [x.key, x.reason]))}`);
    assert(!dongViec(P.w2Teacher, 'action:', em.id).length, 'GV không liên quan không thấy');
    void cP;
  });

  check('LT2a (7) · Phối hợp: thẻ "Giữa khoá · 2/4 môn đạt" + 4 nội dung Báo PH; GVCN đánh dấu đã làm → xong; GVBM không phải GVCN → 403', () => {
    const em = taoEm('LT2a PHOIHOP', 'MB FOU 12');
    nhap(em.pt!, { listening: 18, reading: 18, writing: 11, speaking: 12 });
    const cGv = caseTheoMon(em.id, 'writing');
    sosAuto.xacNhanCase(gvOf('MB FOU 12', 'writing'), cGv.id, XN('writing', 'FOU'));
    const ha = P.normalCoreTeacher, khoa = gvOf('MB FOU 12', 'writing');
    const luot = (phoiHop.coordinationOfStudent(ha, em.id) as any).rows.find((r: any) => r.attemptId === em.pt);
    assert(luot && luot.nhanDot === 'Giữa khoá' && luot.sosLevel === null && luot.ketQua.chinh === '2/4 môn đạt' && luot.ketQua.phu === 'Không đạt: G+V P', JSON.stringify(luot && { n: luot.nhanDot, s: luot.sosLevel, k: luot.ketQua }));
    const act = luot.actions.find((x: any) => x.kind === 'bao_ph_tvv');
    assert(act && act.kindLabel === 'Báo phụ huynh qua TVV' && act.noiDung?.length === 4, JSON.stringify(act && act.noiDung));
    assert(act.noiDung[0].includes('2/4 môn đạt') && act.noiDung[1].includes('G+V, P') && act.noiDung[2].includes('Em mất điểm ở phần này') && act.noiDung[3].includes('học lại'), act.noiDung.join(' | '));
    assert(maLoi(() => phoiHop.confirmCoordination(khoa, act.id, { performedOn: TODAY })) === 403, 'GVBM không phải GVCN đánh dấu → 403');
    phoiHop.confirmCoordination(ha, act.id, { performedOn: TODAY, note: 'Đã gửi task cho TVV trên Base.' });
    assert(get('SELECT status FROM sos_coordination_actions WHERE id = ?', act.id).status === 'done', 'xong');
    assert(!dongViec(ha, 'baoph:', em.id).length, 'đã làm → hết việc');
    assert(!(d.COORDINATION_KINDS as readonly string[]).slice(0, 6).includes('bao_ph_tvv'), 'bao_ph_tvv chỉ máy tạo (ngoài sáu loại người dùng chọn)');
  });

  check('LT2a (7) · Vắng cùng môn lần 2 → GVCN nhận thông báo (dời sang tuần …); lần 1 thì không', () => {
    const em = taoEm('LT2a VANG', 'MB FOU 12');
    const ha = P.normalCoreTeacher;
    const co = (lan: number) => all('SELECT 1 FROM notifications WHERE user_id = ? AND dedup_key = ?', ha.userId, `vang-thuong:${em.pt}:reading:${lan}`).length;
    regular.saveRegularScore(P.admin, em.pt!, 'reading', { noShow: true });
    assert(co(1) === 0 && co(2) === 0, 'lần 1 không thông báo');
    regular.saveRegularScore(P.admin, em.pt!, 'reading', { noShow: true });
    assert(co(2) === 1, 'lần 2 phải có thông báo');
    const tb = get('SELECT title FROM notifications WHERE user_id = ? AND dedup_key = ?', ha.userId, `vang-thuong:${em.pt}:reading:2`);
    assert(/vắng R Giữa khoá lần 2 — đã dời sang W\d/.test(tb.title) && !/SOS/.test(tb.title), tb.title);
  });
}
