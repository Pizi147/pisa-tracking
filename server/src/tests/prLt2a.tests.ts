/**
 * PHÉP KIỂM PR-LT2a — lớp thường · Giữa khoá: Case tự tạo, PA Bổ trợ, Báo PH qua TVV.
 * PR-CT2 (§8): bỏ nộp / duyệt kế hoạch bài giảng — PA Bổ trợ chạy ngay khi Xác nhận Case; các khối 4, 5, 7, 10, 11 sửa theo luật mới.
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
  const students: any = await import('../students/students.ts');
  const phoiHop: any = await import('../yThuc/phoiHop.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  const { createApp } = await import('../app.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  console.log('\nPR-LT2a · Lớp thường Progress Test');

  // ------------------------------------------------------------------ khối 1 · luật thuần (Task 1)
  check('LT2a (1) · boTroGiuaKhoa: FOU chung 2 buổi/tuần · BE, ELE 1 buổi/tuần/môn · Pre FOU và FT không có Progress Test (PF2)', () => {
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
    assert(ten === '[Progress Test] G+V không đạt' && !/SOS/.test(ten), ten);
    assert(d.mocChuBoTro(null, t.TODAY) === 'đến Cuối khoá · chưa có lịch', 'chưa có lịch');
    assert(/^đến Cuối khoá · W\d /.test(d.mocChuBoTro(t.addDays(t.TODAY, 20), t.TODAY)), 'mã tuần');
  });

  check('LT2a (1) · nhanKetQuaThuong: 6 ca, KHÔNG ca nào có chữ SOS', () => {
    const base = { kind: 'progress' as const, ct: 'FOU', khongChiaMon: false };
    const du = d.nhanKetQuaThuong({ ...base, scored: 4, required: 4, failedSkills: ['writing', 'pronunciation'], tyLeTong: 0.61 });
    assert(du.chinh === '2/4 môn đạt' && du.phu === 'Không đạt: G+V P' && du.pct === '61%' && du.dat === false, JSON.stringify(du));
    const thieu = d.nhanKetQuaThuong({ ...base, scored: 3, required: 4, failedSkills: ['reading'], tyLeTong: null });
    assert(thieu.chinh === '2/3 môn đạt' && thieu.pct === null && thieu.dat === false, JSON.stringify(thieu));
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

  check('LT2a (1) · trangThaiCaseV4 (PR-CT2): Case có nguyên nhân → Đang làm (không còn trạng thái kế hoạch); chờ nguyên nhân giữ; PA chưa chạy nói "đến Cuối khoá"', () => {
    const c = { status: 'open' as const, fromSos: true, hasCause: true, dismissed: false, systemClosed: false, choDuyetKhongTheoDoi: false,
      coPaChoXacNhan: false, hanXacNhan: null };
    assert(d.trangThaiCaseV4(c, '2026-09-19').k === 'dang-lam', 'có nguyên nhân → Đang làm');
    assert(d.trangThaiCaseV4({ ...c, hasCause: false }, '2026-09-19').k === 'cho-nguyen-nhan', 'chờ nguyên nhân');
    assert(d.mocChuPa({ span: 'den_cuoi_khoa', followupDue: null, mtKe: null, daXacNhan: false }, '2026-09-19') === 'đến Cuối khoá', 'PA chưa chạy');
  });

  check('LT2a (1) · noiDungBaoPh đúng 4 phần tử; nguyên nhân trống → "GVBM chưa xác nhận"; loại thẻ ke_hoach_bo_tro giữ để đọc lịch sử', () => {
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
    intake.commitIntake(P.admin, { classId: cid, rows: [{ fullName: ten, email: 'hv@demo.test', dob: '2010-01-01' }], idempotencyKey: `lt2a-${ten}` });
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

  check('LT2a (3) · FOU Progress Test trượt G+V, P → 2 Case không nhãn SOS, mỗi Case một PA bổ trợ chờ cùng nhóm, người dạy GVCN; chạy lặp không nhân đôi', () => {
    const em = taoEm('LT2a FOU A', 'MB FOU 12');
    nhap(em.pt!, { listening: 18, reading: 18, writing: 11, speaking: 12 });
    let cs = caseCua(em.id);
    assert(cs.length === 2, `phải 2 Case: ${cs.length}`);
    assert(cs.every((c) => c.sos_level === null && c.origin_kind === 'mock'), 'sos_level phải NULL');
    assert(cs.every((c) => c.han_xac_nhan === d.hanXacNhan(TODAY)), 'hạn xác nhận 3 ngày tính cả hôm nay');
    const ten = cs.map((c) => cases.caseTitleOf(c)).sort();
    assert(ten[0] === '[Progress Test] G+V không đạt' && ten[1] === '[Progress Test] P không đạt' && !ten.some((x) => /SOS|MT/.test(x)), ten.join(' | '));
    const pas = cs.flatMap((c) => paCua(c.id));
    assert(pas.length === 2 && pas.every((x) => x.status === 'planned' && x.preset === 1 && x.confirmed_at === null && x.confirmed_by === null), 'PA chờ');
    assert(new Set(pas.map((x) => x.nhom_bo_tro)).size === 1 && pas[0].nhom_bo_tro === `gk:${em.pt}`, 'cùng một nhóm FOU');
    assert(pas.every((x) => x.performer_user_id === gvcnFou && x.moc_quy_che === 'den_cuoi_khoa' && x.han_ke_hoach === null), 'người dạy = GVCN; PR-CT2: không ghi han_ke_hoach');
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

  check('LT2a (3) · BE Progress Test trượt W, S → 2 PA KHÁC nhóm, người dạy = GVBM từng môn', () => {
    const em = taoEm('LT2a BE A', 'MB BE 08');
    nhap(em.pt!, { listening: 18, reading: 18, writing: 10, speaking: 10 });
    const pas = caseCua(em.id).flatMap((c) => paCua(c.id));
    assert(pas.length === 2 && new Set(pas.map((x) => x.nhom_bo_tro)).size === 2, 'hai nhóm');
    assert(pas.every((x) => /^gk:\d+:(writing|speaking)$/.test(x.nhom_bo_tro) && x.description.includes('1 buổi/tuần')), pas.map((x) => x.nhom_bo_tro).join());
    const dayW = pas.find((x) => x.nhom_bo_tro.endsWith('writing'))!.performer_user_id, dayS = pas.find((x) => x.nhom_bo_tro.endsWith('speaking'))!.performer_user_id;
    const gv = (lop: string, skill: string) => get(`SELECT ta.user_id u FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id WHERE c.code = ? AND ta.skill = ? AND ta.status = 'active'`, lop, skill).u;
    assert(dayW === gv('MB BE 08', 'writing') && dayS === gv('MB BE 08', 'speaking'), `người dạy ${dayW}/${dayS}`);
  });

  check('LT2a (3) · Final Test trượt → 0 tín hiệu, 0 Case (cả FOU và Pre FOU); Progress Test sửa lên đạt → Case tự huỷ + PA huỷ, hết môn trượt → Báo PH removed', () => {
    const em = taoEm('LT2a FOU B', 'MB FOU 12');
    nhap(em.ft!, { listening: 5, reading: 5, writing: 5, speaking: 5 });
    assert(!all('SELECT 1 FROM case_signals WHERE attempt_id = ?', em.ft).length && !caseCua(em.id).length, 'Final Test FOU không tín hiệu/Case');
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

  // ------------------------------------------------------------------ khối 4 · Xác nhận Case → PA Bổ trợ chạy ngay (PR-CT2 bỏ nộp / duyệt kế hoạch)
  const gvOf = (lop: string, skill: string) => loadPrincipal(get(`SELECT ta.user_id u FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id WHERE c.code = ? AND ta.skill = ? AND ta.status = 'active'`, lop, skill).u);
  const paBt = (caseId: number) => get(`SELECT * FROM case_interventions WHERE case_id = ? AND kind = 'bo_tro' AND status != 'cancelled' ORDER BY id LIMIT 1`, caseId);
  const XN = (topic: string, ct: string) => ({ primaryCode: d.issuesForTopic(topic, ct)[0].code, urgency: 'attention', moTa: 'Em mất điểm ở phần này, thiếu nền tảng ngữ pháp cơ bản.' });
  const maLoi = (fn: () => unknown) => { try { fn(); return 200; } catch (e: any) { return e.status ?? 500; } };
  const caseTheoMon = (hv: number, topic: string) => get('SELECT * FROM sos_cases WHERE student_id = ? AND topic = ? ORDER BY id DESC', hv, topic);
  const chiTiet = (who: any, caseId: number) => cases.caseDetail(who, caseId) as any;

  check('LT2a (4) · BE: GVBM W Xác nhận Case (không kế hoạch) → PA chạy ngay (hạn T2 tuần sau, mốc Final Test, người xác nhận), Case Đang làm; không thẻ kế hoạch', () => {
    const em = taoEm('LT2a BE KH', 'MB BE 08');
    nhap(em.pt!, { listening: 18, reading: 18, writing: 10, speaking: 18 });
    const c = caseTheoMon(em.id, 'writing');
    const khoa = gvOf('MB BE 08', 'writing');
    sosAuto.xacNhanCase(khoa, c.id, XN('writing', 'BE'));
    const pa = paBt(c.id);
    assert(pa.status === 'started' && pa.confirmed_by === khoa.userId && pa.action_due === d.hanKyGhiKetQua(TODAY) && pa.started_date === TODAY, JSON.stringify(pa));
    assert(pa.followup_due === boTro.mocCuoiKhoa(em.pt ? get('SELECT cycle_id c FROM assessment_attempts WHERE id = ?', em.pt).c : null, classId('MB BE 08')), 'mốc Final Test');
    assert(chiTiet(khoa, c.id).trangThaiV4.k === 'dang-lam' && get('SELECT status FROM sos_cases WHERE id = ?', c.id).status === 'in_progress', 'Case Đang làm');
    const moc = all('SELECT kind FROM case_milestones WHERE case_id = ?', c.id).map((m) => m.kind);
    assert(moc.includes('xac_nhan_case') && !moc.includes('nop_ke_hoach'), moc.join());
    assert(!get(`SELECT 1 FROM yeu_cau_duyet WHERE loai = 'ke_hoach_bo_tro' AND hoc_vien_id = ?`, em.id), 'không còn thẻ kế hoạch');
  });

  check('LT2a (4) · FOU: GVBM G+V xác nhận → PA G+V chạy, PA P còn chờ (chưa nguyên nhân); GVBM P xác nhận sau → PA P chạy; cùng một nhóm', () => {
    const em = taoEm('LT2a FOU KH', 'MB FOU 12');
    nhap(em.pt!, { listening: 18, reading: 18, writing: 11, speaking: 12 });
    const cGv = caseTheoMon(em.id, 'writing'), cP = caseTheoMon(em.id, 'speaking');
    const khoa = gvOf('MB FOU 12', 'writing'), trang = gvOf('MB FOU 12', 'speaking');
    sosAuto.xacNhanCase(khoa, cGv.id, XN('writing', 'FOU'));
    assert(paBt(cGv.id).status === 'started' && paBt(cGv.id).confirmed_by === khoa.userId, 'PA G+V chạy, người xác nhận');
    assert(paBt(cP.id).status === 'planned' && paBt(cP.id).confirmed_at === null, 'PA P (chưa có nguyên nhân) vẫn chờ');
    assert(chiTiet(khoa, cGv.id).trangThaiV4.k === 'dang-lam', JSON.stringify(chiTiet(khoa, cGv.id).trangThaiV4));
    sosAuto.xacNhanCase(trang, cP.id, XN('speaking', 'FOU'));
    assert(paBt(cP.id).status === 'started' && paBt(cP.id).confirmed_by === trang.userId, 'Môn xác nhận sau tự chạy');
    assert(paBt(cGv.id).nhom_bo_tro === paBt(cP.id).nhom_bo_tro, 'cùng một nhóm');
  });

  check('LT2a (4) · Thẻ ke_hoach_bo_tro cũ (đọc lịch sử): Quản lý duyệt hoặc từ chối → 409, thẻ giữ nguyên', () => {
    const em = taoEm('LT2a BE TC', 'MB BE 08');
    nhap(em.pt!, { listening: 18, reading: 18, writing: 10, speaking: 18 });
    const c = caseTheoMon(em.id, 'writing');
    const id = yc.taoYeuCau(conn, { loai: 'ke_hoach_bo_tro', doiTuongLoai: 'nhom_bo_tro', doiTuongId: paBt(c.id).id, hocVienId: em.id, nguoiXin: gvOf('MB BE 08', 'writing').userId,
      lyDo: 'Kế hoạch cũ', duLieu: { nhom: paBt(c.id).nhom_bo_tro, noiDungYeu: 'a', keHoach: 'b' } });
    assert(maLoi(() => yc.duyetYeuCau(P.mbManager, id)) === 409, 'duyệt thẻ cũ phải 409');
    assert(maLoi(() => yc.tuChoiYeuCau(P.mbManager, id, 'Không còn bước này.')) === 409, 'từ chối thẻ cũ phải 409');
    assert(get('SELECT trang_thai FROM yeu_cau_duyet WHERE id = ?', id).trang_thai === 'cho' && paBt(c.id).status === 'planned', 'thẻ và PA giữ nguyên');
  });

  await checkAsync('LT2a (4) · HTTP: POST /cases/:id/xac-nhan không kế hoạch → 200 (BE W và S); POST /bo-tro/:id/ke-hoach → 404', async () => {
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
      const r1 = await goi(khoa.userId, `/cases/${cW.id}/xac-nhan`, XN('writing', 'BE'));
      assert(r1.status === 200, `xác nhận W: ${r1.status} ${await r1.text()}`);
      const r2 = await goi(trang.userId, `/cases/${cS.id}/xac-nhan`, XN('speaking', 'BE'));
      assert(r2.status === 200, `xác nhận S: ${r2.status}`);
      const r3 = await goi(trang.userId, `/bo-tro/${paBt(cS.id).id}/ke-hoach`, {});
      assert(r3.status === 404, `route nộp kế hoạch đã gỡ: ${r3.status}`);
      assert(paBt(cW.id).status === 'started' && paBt(cS.id).status === 'started', 'hai PA chạy');
    } finally { may.close(); }
  });

  // ------------------------------------------------------------------ khối 5 · PA Bổ trợ đang chạy: ghi kết quả chép cả nhóm, kết quả cuối, Không cần theo dõi (Task 5)
  /** FOU trượt G+V và P; cả hai đã xác nhận nguyên nhân → hai PA chạy cùng nhóm (PR-CT2). */
  const dungFouChay = (ten: string) => {
    const em = taoEm(ten, 'MB FOU 12');
    nhap(em.pt!, { listening: 18, reading: 18, writing: 11, speaking: 12 });
    const cGv = caseTheoMon(em.id, 'writing'), cP = caseTheoMon(em.id, 'speaking');
    const khoa = gvOf('MB FOU 12', 'writing'), trang = gvOf('MB FOU 12', 'speaking'), ha = P.normalCoreTeacher;
    sosAuto.xacNhanCase(khoa, cGv.id, XN('writing', 'FOU'));
    sosAuto.xacNhanCase(trang, cP.id, XN('speaking', 'FOU'));
    return { em, cGv, cP, khoa, trang, ha };
  };
  const taoHocVienFt = (): number => {
    const now = new Date().toISOString();
    const sid = Number(conn.prepare("INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES ('PISA-LT2A-FT', 'LT2a HV FT', 'lt2a hv ft', (SELECT branch_id FROM classes WHERE code = 'MB FT 101'), 'active', ?)").run(now).lastInsertRowid);
    conn.prepare("INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?, 'active', '2026-07-27', ?)").run(sid, classId('MB FT 101'), now);
    conn.prepare("INSERT INTO learning_cycles (student_id, seq, route, started_at, status, created_at) VALUES (?, 1, 'LT1', '2026-07-27', 'active', ?)").run(sid, now);
    return sid;
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

  check('LT2a (5) · Tuần Final Test: Hoàn thành ẩn tới khi PA khép (dòng "Hoàn thành được sau khi PA theo quy chế kết thúc (đến Cuối khoá · …)"); ghi kết quả cuối → CẢ HAI PA completed het_moc; rồi việc tiếp "Hoàn thành Case"', () => {
    const { cGv, cP, ha } = dungFouChay('LT2a FOU CUOI');
    const dt0 = chiTiet(ha, cGv.id);
    assert(dt0.hoanThanh?.an === true && /Hoàn thành được sau khi PA theo quy chế kết thúc \(đến Cuối khoá/.test(dt0.hoanThanh.dong), JSON.stringify(dt0.hoanThanh));
    conn.prepare(`UPDATE case_interventions SET followup_due = ? WHERE nhom_bo_tro = ?`).run(d.addDaysIso(TODAY, -1), paBt(cGv.id).nhom_bo_tro);
    assert(/^Kết quả cuối/.test(chiTiet(ha, cGv.id).viecTiep.chu), `việc tiếp: ${chiTiet(ha, cGv.id).viecTiep.chu}`);
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

  check('LT2a (5) · Không cần theo dõi Case P (chưa nguyên nhân) đã duyệt → PA P cancelled khong_theo_doi (không vào hiệu quả), PA G+V vẫn chạy; Tạm dừng → Quay lại → hạn Kết quả tính lại', () => {
    const em = taoEm('LT2a FOU KTD', 'MB FOU 12');
    nhap(em.pt!, { listening: 18, reading: 18, writing: 11, speaking: 12 });
    const cGv = caseTheoMon(em.id, 'writing'), cP = caseTheoMon(em.id, 'speaking');
    const khoa = gvOf('MB FOU 12', 'writing'), trang = gvOf('MB FOU 12', 'speaking');
    sosAuto.xacNhanCase(khoa, cGv.id, XN('writing', 'FOU'));
    sosAuto.guiKhongTheoDoi(trang, cP.id, { reasonCode: 'single_incident' });
    yc.duyetYeuCau(P.mbManager, get(`SELECT id FROM yeu_cau_duyet WHERE loai = 'khong_theo_doi' AND doi_tuong_id = ? ORDER BY id DESC LIMIT 1`, cP.id).id);
    const pP = get(`SELECT * FROM case_interventions WHERE case_id = ? AND kind = 'bo_tro'`, cP.id);
    assert(pP.status === 'cancelled' && pP.closed_reason === 'khong_theo_doi', `PA P: ${pP.status}/${pP.closed_reason}`);
    assert(paBt(cGv.id).status === 'started', 'PA G+V vẫn chạy');
    assert(!(effectiveness.planOutcomes({ studentIds: [em.id] }) as any[]).some((r) => r.id === pP.id), 'PA không theo dõi không vào hiệu quả');
    conn.prepare('UPDATE case_interventions SET action_due = ? WHERE id = ?').run(d.addDaysIso(TODAY, -5), paBt(cGv.id).id);
    sosAuto.datLaiHanCase(em.id, TODAY);
    assert(paBt(cGv.id).action_due === d.hanKe(paBt(cGv.id).started_date ?? paBt(cGv.id).cycle_started_on, null, TODAY), `Quay lại học: action_due = ${paBt(cGv.id).action_due}`);
  });

  // ------------------------------------------------------------------ khối 7 · Việc cần làm + Phối hợp + thông báo (Task 7)
  const dongViec = (who: any, tienTo: string, hv?: number) => ((mywork.myWork(who) as any).items as any[]).filter((x) => x.key.startsWith(tienTo) && (hv === undefined || x.studentId === hv));

  check('LT2a (7) · GVCN FOU /my-work: "Báo phụ huynh qua TVV" (không hạn); KHÔNG còn "Nộp kế hoạch bổ trợ" (PR-CT2); không có "Xác nhận PA" cho PA bổ trợ', () => {
    const em = taoEm('LT2a VIEC', 'MB FOU 12');
    nhap(em.pt!, { listening: 18, reading: 18, writing: 11, speaking: 12 });
    const cGv = caseTheoMon(em.id, 'writing');
    const khoa = gvOf('MB FOU 12', 'writing'), ha = P.normalCoreTeacher;
    sosAuto.xacNhanCase(khoa, cGv.id, XN('writing', 'FOU'));
    assert(!dongViec(ha, 'kehoach:', em.id).length && !dongViec(P.mbManager, 'kehoach:', em.id).length, 'không còn dòng Nộp kế hoạch');
    assert(d.LOAI_HAN_CUA_VIEC.ke_hoach_bo_tro === undefined && d.nhomViecCua('phoi_hop') === 'case-hoc-thuat', 'nhóm + loại hạn');
    const bp = dongViec(ha, 'baoph:', em.id);
    assert(bp.length === 1 && bp[0].group === 'phoi_hop' && bp[0].due === null && bp[0].tieuDe === 'Báo phụ huynh qua TVV · LT2a VIEC · Progress Test', `Báo PH: ${JSON.stringify(bp.map((x) => [x.group, x.due, x.tieuDe]))}`);
    assert(!dongViec(khoa, 'baoph:', em.id).length, 'GVBM G+V không phải GVCN — không thấy Báo PH');
    assert(!dongViec(khoa, 'xnpa:', em.id).length && !dongViec(ha, 'xnpa:', em.id).length, 'không có dòng "Xác nhận PA" cho PA bổ trợ');
  });

  check('LT2a (7) · Nhóm 2 PA đang chạy → MỘT dòng "Ghi kết quả" (id nhỏ nhất) nói "PA chung · G+V, P"; GVCN ghi được, GV không liên quan không thấy', () => {
    const { cGv, cP, ha, em } = dungFouChay('LT2a FOU VIEC');
    conn.prepare('UPDATE case_interventions SET action_due = ? WHERE nhom_bo_tro = ?').run(TODAY, paBt(cGv.id).nhom_bo_tro);
    const rows = dongViec(ha, 'action:', em.id);
    assert(rows.length === 1 && rows[0].key === `action:${paBt(cGv.id).id}` && /PA chung · G\+V, P/.test(rows[0].reason), `dòng: ${JSON.stringify(rows.map((x) => [x.key, x.reason]))}`);
    assert(!dongViec(P.w2Teacher, 'action:', em.id).length, 'GV không liên quan không thấy');
    void cP;
  });

  check('LT2a (7) · Phối hợp: thẻ "Progress Test · 2/4 môn đạt" + 4 nội dung Báo PH; GVCN đánh dấu đã làm → xong; GVBM không phải GVCN → 403', () => {
    const em = taoEm('LT2a PHOIHOP', 'MB FOU 12');
    nhap(em.pt!, { listening: 18, reading: 18, writing: 11, speaking: 12 });
    const cGv = caseTheoMon(em.id, 'writing');
    sosAuto.xacNhanCase(gvOf('MB FOU 12', 'writing'), cGv.id, XN('writing', 'FOU'));
    const ha = P.normalCoreTeacher, khoa = gvOf('MB FOU 12', 'writing');
    const luot = (phoiHop.coordinationOfStudent(ha, em.id) as any).rows.find((r: any) => r.attemptId === em.pt);
    assert(luot && luot.nhanDot === 'Progress Test' && luot.sosLevel === null && luot.ketQua.chinh === '2/4 môn đạt' && luot.ketQua.phu === 'Không đạt: G+V P', JSON.stringify(luot && { n: luot.nhanDot, s: luot.sosLevel, k: luot.ketQua }));
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
    conn.prepare(`UPDATE assessment_attempts SET status = 'cancelled' WHERE cycle_id = (SELECT cycle_id FROM assessment_attempts WHERE id = ?) AND kind = 'final'`).run(em.pt);   // Final Test tuần này chặn dời L (T15) — bỏ để thử vắng lần 2
    const ha = P.normalCoreTeacher;
    const co = (lan: number) => all('SELECT 1 FROM notifications WHERE user_id = ? AND dedup_key = ?', ha.userId, `vang-thuong:${em.pt}:reading:${lan}`).length;
    /* OV-11a (Q1): "-" trong tuần thi → dời tuần sau; lần 2 = ghi "-" khi tuần mới đã tới (ghi bù ≥ 2 tuần là Không dự thi, không tính vắng). */
    const tuanThi = get(`SELECT rp.week_start AS w FROM attempt_skills k JOIN report_periods rp ON rp.id = k.planned_period_id WHERE k.attempt_id = ? AND k.skill = 'reading'`, em.pt).w as string;
    regular.saveRegularScore(P.admin, em.pt!, 'reading', { noShow: true }, t.addDays(tuanThi, 2));
    assert(co(1) === 0 && co(2) === 0, 'lần 1 không thông báo');
    regular.saveRegularScore(P.admin, em.pt!, 'reading', { noShow: true }, t.addDays(tuanThi, 9));
    assert(co(2) === 1, 'lần 2 phải có thông báo');
    const tb = get('SELECT title FROM notifications WHERE user_id = ? AND dedup_key = ?', ha.userId, `vang-thuong:${em.pt}:reading:2`);
    assert(/vắng R Progress Test lần 2 — đã dời sang W\d/.test(tb.title) && !/SOS/.test(tb.title), tb.title);
  });

  // ------------------------------------------------------------------ khối 8 · M1b — em vào lớp thường tự có bài Giữa khoá + Cuối khoá (Task 8)
  let soLop = 0;
  /** Lớp thường mới khai giảng cách hôm nay `tuanTruoc` tuần (0 = hôm nay). */
  const dungLop = (ct: 'FOU' | 'PREFOU' | 'BE', tuanTruoc: number) => {
    soLop += 1;
    const khai = d.mondayOfDate ? d.mondayOfDate(t.addDays(TODAY, -7 * tuanTruoc)) : t.addDays(TODAY, -7 * tuanTruoc);
    const now = new Date().toISOString();
    const pid = (conn.prepare('SELECT id FROM report_periods WHERE week_start = ?').get(khai) as any)?.id
      ?? Number(conn.prepare(`INSERT INTO report_periods (code, week_start, week_end, created_at) VALUES (?,?,?,?)`).run(`LT2a-${khai}`, khai, t.addDays(khai, 6), now).lastInsertRowid);
    const lop = Number(conn.prepare(
      `INSERT INTO classes (code, branch_id, kind, programme_code, route, is_fast_track, start_date, start_period_id, status, note, created_at)
       VALUES (?, (SELECT branch_id FROM classes WHERE code = 'MB FOU 12'), ?, ?, NULL, 0, ?, ?, 'active', 'Phép kiểm LT2a M1b', ?)`,
    ).run(`QA LT2a ${ct} ${soLop}`, ct === 'PREFOU' ? 'PREFOU' : ct, ct, khai, pid, now).lastInsertRowid);
    return lop;
  };
  const themEm = (lop: number, ten: string[]) => {
    intake.commitIntake(P.admin, { classId: lop, rows: ten.map((n) => ({ fullName: n, email: 'hv@demo.test', dob: '2010-01-01' })), idempotencyKey: `lt2a-m1b-${lop}-${ten.join()}` });
    return ten.map((n) => get('SELECT id FROM students WHERE full_name = ?', n).id as number);
  };
  const baiCua = (sid: number) => all(`SELECT a.id, a.kind, a.status, a.class_id, (SELECT COUNT(*) FROM attempt_skills k WHERE k.attempt_id = a.id AND k.required = 1) AS mon FROM assessment_attempts a WHERE a.student_id = ? ORDER BY a.attempt_no`, sid);

  check('LT2a (8) · Thêm 3 HV vào FOU khai giảng hôm nay → mỗi em 2 bài (Progress Test tuần 4, Final Test tuần 8) planned đủ 4 môn; Pre FOU 1 bài (Final Test); chạy lại không trùng', () => {
    const fou = dungLop('FOU', 0);
    const em = themEm(fou, ['LT2a M1b A', 'LT2a M1b B', 'LT2a M1b C']);
    for (const id of em) {
      const b = baiCua(id);
      assert(b.length === 2 && b.map((x) => x.kind).join() === 'progress,final' && b.every((x) => x.status === 'planned' && x.mon === 4 && x.class_id === fou), JSON.stringify(b));
    }
    const pre = dungLop('PREFOU', 0);
    const [ep] = themEm(pre, ['LT2a M1b Pre']);
    const bp = baiCua(ep);
    assert(bp.length === 1 && bp[0].kind === 'final' && bp[0].mon === 1, JSON.stringify(bp));
    assert(regular.taoBaiThuongMacDinh(all('SELECT id FROM learning_cycles WHERE student_id IN (?, ?)', em[0], ep).map((c) => c.id), P.admin.userId).length === 0, 'chạy lại không tạo trùng');
    const gk = get(`SELECT rp.week_start w FROM assessment_attempts a JOIN report_periods rp ON rp.id = a.planned_period_id WHERE a.student_id = ? AND a.kind = 'progress'`, em[0]).w;
    assert(gk === t.addDays(get('SELECT start_date d FROM classes WHERE id = ?', fou).d, 21), `Progress Test tuần 4 = khai giảng + 3 tuần: ${gk}`);
  });

  check('LT2a (8) · Thêm HV vào lớp đã QUA tuần Progress Test → chỉ Final Test (không dựng bài quá hạn); QL vẫn xếp tay được bài đã qua (planRegularTests)', () => {
    const fou = dungLop('FOU', 5);                                    // khai giảng 5 tuần trước → hôm nay ở tuần 6: Progress Test (tuần 4) đã qua
    const [em] = themEm(fou, ['LT2a M1b Muon']);
    const b = baiCua(em);
    assert(b.length === 1 && b[0].kind === 'final', JSON.stringify(b));
    const ket = regular.planRegularTests(P.mbManager, fou, { studentIds: [em], kinds: ['progress'] });
    assert(ket.created === 1 && baiCua(em).map((x) => x.kind).join() === 'final,progress', `QL xếp tay bài đã qua: ${JSON.stringify(baiCua(em))}`);
  });

  check('LT2a (8) · Chuyển em FT → FOU (transferStudent) → em có 2 bài ở lộ trình mới', () => {
    const fou = dungLop('FOU', 0);
    const hv = taoHocVienFt();
    students.transferStudent(P.mbManager, hv, fou, TODAY, 'Đổi lịch học', { noNote: true });
    const cy = get(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active' AND route IS NULL`, hv);
    assert(cy, 'phải có lộ trình lớp thường mới');
    const b = all('SELECT kind FROM assessment_attempts WHERE cycle_id = ? ORDER BY attempt_no', cy.id).map((x) => x.kind).join();
    assert(b === 'progress,final', `bài sau chuyển: ${b}`);
  });

  // ------------------------------------------------------------------ khối 9 · lớp thường không nhãn SOS (Task 9 · T58)
  check('LT2a (9) · nhanKetQuaThuong: 6 ca — Progress Test n/4 môn đạt + Không đạt, đủ đạt, đang chấm dở, Final Test %, Pre FOU %, chưa có điểm; không ca nào có chữ SOS', () => {
    const k = (o: any) => d.nhanKetQuaThuong({ kind: 'progress', ct: 'FOU', scored: 4, required: 4, failedSkills: [], tyLeTong: null, khongChiaMon: false, ...o });
    const ca = [
      k({ failedSkills: ['writing', 'speaking'] }), k({}), k({ scored: 2 }), k({ kind: 'final', tyLeTong: 0.64, failedSkills: ['reading'] }),
      k({ ct: 'PREFOU', khongChiaMon: true, tyLeTong: 0.68, scored: 1, required: 1, kind: 'final' }), k({ scored: 0 }),
    ];
    assert(ca[0].chinh === '2/4 môn đạt' && ca[0].phu === 'Không đạt: G+V P' && ca[0].dat === false, JSON.stringify(ca[0]));
    assert(ca[1].chinh === '4/4 môn đạt' && ca[1].phu === null && ca[1].dat === true, JSON.stringify(ca[1]));
    assert(ca[2].chinh === '2/2 môn đạt' && ca[2].dat === null, JSON.stringify(ca[2]));
    assert(ca[3].chinh === '64%' && ca[3].phu === 'Không đạt: R', JSON.stringify(ca[3]));
    assert(ca[4].chinh === '68%' && ca[4].phu === null && ca[4].dat === false, JSON.stringify(ca[4]));
    assert(ca[5].chinh === '—' && ca[5].dat === null, JSON.stringify(ca[5]));
    assert(!/SOS/.test(JSON.stringify(ca)), 'không chữ SOS');
  });

  check('LT2a (9) · Ghim Hành trình lớp thường: "Progress · 2/4 môn đạt", "Final · 64%" — không SOS; ghim FT (MT) vẫn "SOS n"', () => {
    const g = (o: any) => d.nhanGhim({ cheDo: 'ratio', attemptNo: 1, kind: 'progress', overall: null, sosLevel: 2, soDat: 2, soYeuCau: 4, soCoDiem: 4, ...o });
    const gk = g({}), ck = g({ kind: 'final', sosLevel: 1, soDat: 3, tyLe: 0.64 }), dat = g({ sosLevel: 0, soDat: 4 });
    assert(gk.chu === 'Progress · 2/4 môn đạt' && ck.chu === 'Final · 64%' && dat.chu === 'Progress · 4/4 môn đạt', `${gk.chu} | ${ck.chu} | ${dat.chu}`);
    assert(!/SOS/.test(JSON.stringify([gk, ck, dat])), 'không chữ SOS');
    const ft = d.nhanGhim({ cheDo: 'ielts', attemptNo: 2, kind: 'mock', overall: 5.5, sosLevel: 2, soDat: null, soYeuCau: 4, soCoDiem: 4 });
    assert(/SOS 2/.test(ft.chu), ft.chu);
  });

  check('LT2a (9) · Tổng hợp Test khung thường (PR-Pb2-a): Progress Test theo môn "Đạt hết / 1 môn trượt / ≥ 2 môn trượt", không chữ SOS; khung FT vẫn "SOS 1..3"', () => {
    const nhan = (ct: any) => d.cotTongHopFor(ct).filter((c: any) => /^sos[123]$/.test(c.khoa)).map((c: any) => c.nhan(ct)).join('|');
    const giua = d.cotTongHopFor('thuong').filter((c: any) => c.nhomCon === 'giua').map((c: any) => c.nhan('thuong')).join('|');
    assert(giua === 'Đạt hết|1 môn trượt|≥ 2 môn trượt' && !d.cotTongHopFor('thuong').some((c: any) => /SOS/.test(c.nhan('thuong'))), giua);
    assert(nhan('ft') === 'SOS 1|SOS 2|SOS 3', nhan('ft'));
  });

  await checkAsync('LT2a (9) · Quét nguồn web: lưới lớp thường, hồ sơ HV lớp thường không gọi sosLabel; Case lớp thường không có sos_level; Case board/mốc đọc nhãn đợt', async () => {
    const fs = await import('node:fs'), path = await import('node:path');
    const doc = (f: string) => fs.readFileSync(path.join(process.cwd(), 'web/src/modules', f), 'utf8');
    assert(!/sosLabel/.test(doc('cham/LuoiThuong.tsx')), 'LuoiThuong không còn sosLabel');
    const hs = doc('students/StudentDetailPage.tsx');
    assert(!/sosLabel/.test(hs) && /nhanKetQuaThuong/.test(hs), 'hồ sơ HV lớp thường dùng nhanKetQuaThuong');
    assert(!/DanhSachCase|nhanDot/.test(doc('cases/CaseBoardPage.tsx')), 'PR-Pb2-a: Case board / Danh sách Case đã bỏ (nhãn đợt đọc ở Ngăn Case trên hồ sơ HV)');
    const em = taoEm('LT2a T58', 'MB FOU 12');
    nhap(em.pt!, { listening: 18, reading: 18, writing: 11, speaking: 12 });
    const c = caseTheoMon(em.id, 'writing');
    assert(get('SELECT sos_level s FROM sos_cases WHERE id = ?', c.id).s === null, 'Case lớp thường: sos_level NULL');
    const ms: any[] = (cases as any).milestonesOf(c.id);
    assert(ms.length > 0 && ms.filter((m) => m.attemptNo).every((m) => m.dot === 'Progress Test'), JSON.stringify(ms.map((m) => [m.kind, m.dot])));
  });

  // ------------------------------------------------------------------ khối 10 · giao diện Case Giữa khoá, kế hoạch bổ trợ (Task 10)
  await checkAsync('LT2a (10) · Case FOU chi tiết: PA bổ trợ chuaChay (không "Chờ xác nhận") tới khi Xác nhận Case; boTro không còn khối kế hoạch; xác nhận → PA chạy', async () => {
    const em = taoEm('LT2a UI FOU', 'MB FOU 12');
    nhap(em.pt!, { listening: 18, reading: 18, writing: 11, speaking: 12 });
    const cGv = caseTheoMon(em.id, 'writing');
    const ha = P.normalCoreTeacher, khoa = gvOf('MB FOU 12', 'writing');
    const dtHa = chiTiet(ha, cGv.id);
    const pa = dtHa.interventions.find((x: any) => x.kind === 'bo_tro');
    assert(pa && pa.chuaChay === true && pa.awaitingConfirmation === false, JSON.stringify(pa && [pa.chuaChay, pa.awaitingConfirmation]));
    assert(!('phaiGuiKem' in dtHa.boTro) && !('keHoach' in dtHa.boTro) && !('coTheNop' in dtHa.boTro), JSON.stringify(dtHa.boTro));
    assert(pa.performerUserId === ha.userId && dtHa.boTro.chung === true && dtHa.boTro.mon.length === 2, JSON.stringify([pa.performerUserId, dtHa.boTro]));
    assert(!dtHa.sos.coPaChoXacNhan, 'PA bổ trợ không tính là PA chờ xác nhận');
    sosAuto.xacNhanCase(khoa, cGv.id, XN('writing', 'FOU'));
    const sau = chiTiet(ha, cGv.id).interventions.find((x: any) => x.kind === 'bo_tro');
    assert(sau.chuaChay === false && sau.status === 'started', JSON.stringify(sau));
  });

  await checkAsync('LT2a (10) · Quét nguồn (PR-CT2): NopKeHoachPanel đã gỡ; Xác nhận Case không còn "gửi kế hoạch"; PA bổ trợ chưa chạy nói "Chưa bắt đầu"; Phối hợp giữ', async () => {
    const fs = await import('node:fs'), path = await import('node:path');
    const doc = (f: string) => fs.readFileSync(path.join(process.cwd(), 'web/src/modules', f), 'utf8');
    assert(!fs.existsSync(path.join(process.cwd(), 'web/src/modules/cases/NopKeHoachPanel.tsx')), 'NopKeHoachPanel phải gỡ');
    assert(!/gửi kế hoạch|Kế hoạch chung do/.test(doc('yThuc/CaseSosControls.tsx')), 'form Xác nhận Case còn kế hoạch');
    assert(/Đánh dấu đã làm/.test(doc('yThuc/PhoiHopSosSection.tsx')) && /Nội dung gửi TVV/.test(doc('yThuc/PhoiHopSosSection.tsx')), 'Phối hợp: Đánh dấu đã làm + 4 nội dung');
    assert(/chuaChay/.test(doc('cases/SkillBoard.tsx')) && /chuaChay \? 'Chưa bắt đầu'/.test(doc('cases/CasePanel.tsx')), 'HangPA / TheKhoiPa: PA chưa chạy = "Chưa bắt đầu"');
    assert(!/>Nộp kế hoạch|'Nộp kế hoạch bổ trợ', \(\)/.test(doc('cases/SkillBoard.tsx') + doc('cases/CasePanel.tsx') + doc('students/NganCase.tsx')), 'còn nút Nộp kế hoạch');
  });

  // ------------------------------------------------------------------ khối 11 · dữ liệu demo G1–G5 (Task 11)
  check('LT2a (11) · Demo: 0 tín hiệu pending của lớp thường; G1–G5 đúng trạng thái; mỗi em trượt Progress Test có đúng 1 dòng Báo PH', () => {
    assert(get(`SELECT COUNT(*) n FROM case_signals cs JOIN assessment_attempts a ON a.id = cs.attempt_id WHERE cs.status = 'pending' AND a.kind IN ('progress', 'final')`).n === 0, 'lớp thường không còn tín hiệu pending');
    const hv = (ten: string) => get('SELECT id FROM students WHERE full_name = ?', ten).id as number;
    const cs = (ten: string, topic: string) => get('SELECT * FROM sos_cases WHERE student_id = ? AND topic = ? ORDER BY id DESC', hv(ten), topic);
    const v4 = (ten: string, topic: string) => (chiTiet(P.admin, cs(ten, topic).id) as any).trangThaiV4;
    /* PR-CT2: demo G1–G6 không còn thẻ kế hoạch (khối 4 tự dựng một thẻ cũ cho em khác) */
    for (const ten of ['Lê Hoàng Anh', 'Bùi Minh Châu', 'Hoàng Quốc Bình', 'Mai Hải Long', 'Trương Gia Bảo']) {
      assert(!get(`SELECT 1 FROM yeu_cau_duyet WHERE loai = 'ke_hoach_bo_tro' AND hoc_vien_id = ?`, hv(ten)), `demo còn thẻ kế hoạch của ${ten}`);
    }
    const paCua1 = (ten: string, topic: string) => get(`SELECT * FROM case_interventions WHERE case_id = ? AND kind = 'bo_tro'`, cs(ten, topic).id);
    /* G1: G+V đã xác nhận → PA chạy; P chưa xác nhận → PA chờ */
    assert(v4('Lê Hoàng Anh', 'writing').k === 'dang-lam' && paCua1('Lê Hoàng Anh', 'writing').status === 'started', JSON.stringify(v4('Lê Hoàng Anh', 'writing')));
    assert(v4('Lê Hoàng Anh', 'speaking').k === 'cho-nguyen-nhan' && paCua1('Lê Hoàng Anh', 'speaking').status === 'planned', JSON.stringify(v4('Lê Hoàng Anh', 'speaking')));
    /* G2: PA đang chạy + 1 lần ghi kết quả; Báo PH đã làm */
    assert(v4('Bùi Minh Châu', 'reading').k === 'dang-lam', JSON.stringify(v4('Bùi Minh Châu', 'reading')));
    const paB = get(`SELECT id, status FROM case_interventions WHERE case_id = ? AND kind = 'bo_tro'`, cs('Bùi Minh Châu', 'reading').id);
    assert(paB.status === 'started' && all('SELECT 1 FROM case_followups WHERE intervention_id = ?', paB.id).length === 1, JSON.stringify(paB));
    assert(get(`SELECT status FROM sos_coordination_actions WHERE student_id = ? AND kind = 'bao_ph_tvv'`, hv('Bùi Minh Châu')).status === 'done', 'Báo PH G2 đã làm');
    /* G3: BE, PA 1 buổi/tuần đang chạy */
    assert(v4('Hoàng Quốc Bình', 'writing').k === 'dang-lam', JSON.stringify(v4('Hoàng Quốc Bình', 'writing')));
    /* G4: chưa xác nhận → chờ nguyên nhân */
    assert(v4('Mai Hải Long', 'speaking').k === 'cho-nguyen-nhan', JSON.stringify(v4('Mai Hải Long', 'speaking')));
    /* G5: Báo QL + Không cần theo dõi chờ */
    assert(get(`SELECT han_xac_nhan h FROM sos_cases WHERE id = ?`, cs('Phan Khánh Linh', 'listening').id).h < TODAY, 'hạn xác nhận G5 đã quá');
    assert(v4('Ngô Gia Hân', 'speaking').k === 'cho-duyet-khong-theo-doi', JSON.stringify(v4('Ngô Gia Hân', 'speaking')));
    /* G6: Khoa (không phải người dạy FOU) xác nhận → PA chạy, người dạy vẫn GVCN Hà */
    const g6 = paCua1('Trương Gia Bảo', 'writing');
    assert(g6.status === 'started' && g6.performer_user_id === P.normalCoreTeacher.userId && g6.confirmed_by === gvOf('MB FOU 15', 'writing').userId, JSON.stringify(g6));
    for (const ten of ['Lê Hoàng Anh', 'Bùi Minh Châu', 'Hoàng Quốc Bình', 'Mai Hải Long', 'Phan Khánh Linh', 'Ngô Gia Hân', 'Trương Gia Bảo']) {
      assert(get(`SELECT COUNT(*) n FROM sos_coordination_actions WHERE student_id = ? AND kind = 'bao_ph_tvv' AND status != 'removed'`, hv(ten)).n === 1, `Báo PH của ${ten}`);
    }
  });
}
