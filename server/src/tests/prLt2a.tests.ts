/**
 * PHÉP KIỂM PR-LT2a — lớp thường · Giữa khoá: Case tự tạo, PA Bổ trợ, kế hoạch bài giảng qua Quản lý, Báo PH qua TVV.
 * Kế hoạch: docs/superpowers/plans/2026-09-30-pr-lt2a-giua-khoa.md (khối 1–11 theo Task).
 */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrLt2aTests(t: YThucTestKit) {
  const { check, checkAsync, assert, conn, P, classId, TODAY } = t;
  const d = await import('../../../shared/domain/index.ts');
  const { migratePrLt2a } = await import('../migrate/prLt2a.ts');
  const { default: SqliteDb } = await import('libsql');
  const regular: any = await import('../normal/regular.ts');
  const intake: any = await import('../classes/intake.ts');
  const cases: any = await import('../cases/cases.ts');
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
}
