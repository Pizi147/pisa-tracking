/** PHÉP KIỂM PR-Pb2-b — Phân tích giáo viên · FOU 2 GV · hồ sơ GV · ngày nghiệp vụ mới (kế hoạch 2026-10-01-pr-pb2, Phần B). */
import type { YThucTestKit } from './yThuc.tests.ts';
import { emailThu } from '../seed/emailThu.ts';

export async function runPrPb2bTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, addDays, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];

  // ------------------------------------------------------------------ khối 1 · migrate ba cột (Task 1)
  console.log('\nPR-Pb2-b · Migrate: ngày nhập đầu ô điểm, hạn xử lý chốt, ngày phản hồi vi phạm');
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const { default: SqliteDb } = await import('libsql');
  const { migratePrPb2b } = await import('../migrate/prPb2b.ts');
  const { migratePrOv12b } = await import('../migrate/prOv12b.ts');
  const { migratePrOv13k } = await import('../migrate/prOv13k.ts');
  const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
  const SCHEMA = fs.readFileSync(path.join(REPO, 'server/src/schema.sql'), 'utf8').replace(/\r\n/g, '\n');
  const cot = (db: any, bang: string) => (db.prepare(`PRAGMA table_info(${bang})`).all() as any[]).map((c) => `${c.name}:${c.type}:${c.notnull}:${c.pk}`);
  /** DB thời trước Pb2-b: cắt ba cột khỏi CHỮ schema.sql (libsql lỗi "incomplete input" khi DROP COLUMN trên bảng có chú thích). */
  const truoc = () => {
    const cat = SCHEMA
      .replace(/\n  -- PR-Pb2-b \(Q13\)[^\n]*\n  nhap_dau_ngay TEXT,/, '')
      /* OV-12b: cột thêm SAU Pb2-b — cắt luôn, (1b) chạy lại đúng thứ tự migrate (Pb2-b rồi OV-12b). */
      .replace(/\n  -- OV-12b [^\n]*\n  --[^\n]*\n  nhom_nguyen_nhan TEXT,/, '')
      /* OV-13k: bốn cột thêm sau OV-12b — cắt luôn, (1b) chạy lại migrate OV-13k sau OV-12b. */
      .replace(/\n  -- OV-13k [^\n]*\n  --[^\n]*\n  nhan_xet_phu_trach TEXT,\n[^\n]*\n[^\n]*\n  cho_phu_trach_xem INTEGER NOT NULL DEFAULT 0,/, '')
      /* TD7a: chỉ mục một phần trên cột OV-13k — cắt cùng (chỉ so cột, không so chỉ mục). */
      .replace(/\n\/\* TD7a: ô S Mock[^\n]*\nCREATE INDEX idx_score_cho_phu_trach [^\n]*/, '')
      .replace(/,\n  -- PR-Pb2-b \(Q14\)[\s\S]*?phan_hoi_ngay TEXT\n\);/, '\n);');
    if (/nhap_dau_ngay|han_xu_ly|phan_hoi_ngay|nhom_nguyen_nhan|nhan_xet_phu_trach|cho_phu_trach_xem/.test(cat)) throw new Error('schema.sql đổi khuôn — sửa bộ cắt của phép kiểm Pb2b (1)');
    const m = new SqliteDb(':memory:');
    m.exec(cat);
    return m;
  };
  check('Pb2b (1a) · migrate chạy lặp được: lần một thêm 3 cột, lần hai không báo gì; DB dựng từ schema.sql không bị đổi', () => {
    const m = truoc();
    const a: string[] = []; migratePrPb2b(m, a);
    const b: string[] = []; migratePrPb2b(m, b);
    assert(a.length === 3 && b.length === 0, `${a.join(' | ')} ‖ ${b.join(' | ')}`);
    const c: string[] = []; migratePrPb2b(conn, c);
    assert(c.length === 0, `DB dựng từ schema.sql vẫn bị đổi: ${c.join(' | ')}`);
  });
  check('Pb2b (1b) · DB migrate có cột GIỐNG HỆT DB dựng từ schema.sql (tên, kiểu, NOT NULL, thứ tự)', () => {
    const m = truoc();
    migratePrPb2b(m, []);
    migratePrOv12b(m, []);
    migratePrOv13k(m, []);
    const moi = new SqliteDb(':memory:');
    moi.exec(SCHEMA);
    for (const b of ['assessment_scores', 'violations']) {
      assert(JSON.stringify(cot(m, b)) === JSON.stringify(cot(moi, b)), `${b}:\n  ${cot(m, b).join(',')}\n  ${cot(moi, b).join(',')}`);
    }
  });

  // ------------------------------------------------------------------ khối 2 · nhap_dau_ngay (Q13)
  const intake: any = await import('../classes/intake.ts');
  const week: any = await import('../platform/week.ts');
  const svc: any = await import('../fasttrack/attempts.ts');
  const regular: any = await import('../normal/regular.ts');
  const { boLichTuTao, luotThu } = await import('./luotThu.ts');
  let seq = 0;
  const emMoi = (lop: string) => {
    const ten = `PB2B HV ${++seq}`;
    intake.commitIntake(P.admin, { classId: classId(lop), rows: [{ fullName: ten, target: 6.5, email: emailThu(), dob: '2010-01-01' }], idempotencyKey: `pb2b-${seq}` });
    const st = get('SELECT id FROM students WHERE full_name = ?', ten);
    const cy = get("SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active'", st.id);
    return { sid: st.id as number, cy: cy?.id as number };
  };
  const o = (aid: number, skill: string) => get('SELECT * FROM assessment_scores WHERE attempt_id = ? AND skill = ?', aid, skill);
  const D = TODAY;

  check('Pb2b (1c) · FT: nhập L ngày D → D; sửa D+3 có lý do → vẫn D (entered_at đổi); Huỷ điểm → NULL; nhập lại D+5 → D+5; dấu "-" → NULL', () => {
    const { sid, cy } = emMoi('MB FT 101');
    boLichTuTao(conn, cy);
    const a = luotThu(conn, svc.createAttempt, P.admin, { studentId: sid, cycleId: cy, classId: classId('MB FT 101'), no: 1, periodId: week.ensurePeriod(week.mondayOf(D)).id });
    svc.saveScore(P.admin, a.id, 'listening', { rawScore: 30 }, D);
    assert(o(a.id, 'listening').nhap_dau_ngay === D, `lần đầu: ${o(a.id, 'listening').nhap_dau_ngay}`);
    conn.prepare(`UPDATE assessment_scores SET entered_at = '2000-01-01T00:00:00.000Z' WHERE attempt_id = ? AND skill = 'listening'`).run(a.id);
    svc.saveScore(P.admin, a.id, 'listening', { rawScore: 31, lyDo: 'Chấm lại phần 3' }, addDays(D, 3));
    const sua = o(a.id, 'listening');
    assert(sua.nhap_dau_ngay === D && sua.entered_at !== '2000-01-01T00:00:00.000Z', JSON.stringify(sua));
    svc.saveScore(P.admin, a.id, 'listening', { rawScore: null, lyDo: 'Huỷ điểm nhập nhầm' }, addDays(D, 4));
    assert(o(a.id, 'listening').nhap_dau_ngay === null, 'huỷ điểm phải NULL');
    svc.saveScore(P.admin, a.id, 'listening', { rawScore: 28 }, addDays(D, 5));
    assert(o(a.id, 'listening').nhap_dau_ngay === addDays(D, 5), `nhập lại: ${o(a.id, 'listening').nhap_dau_ngay}`);
    svc.saveScore(P.admin, a.id, 'reading', { noShow: true }, D);
    assert(o(a.id, 'reading') && o(a.id, 'reading').nhap_dau_ngay === null, 'dấu "-" không đặt ngày nhập');
  });
  check('Pb2b (1d) · Lớp thường cùng luật: nhập D → D; sửa D+2 có lý do → vẫn D; xoá điểm → NULL', () => {
    const { sid } = emMoi('MB FOU 12');
    const a = get(`SELECT id FROM assessment_attempts WHERE student_id = ? AND status != 'cancelled' ORDER BY id LIMIT 1`, sid);
    assert(a, 'em lớp thường phải có bài tự tạo');
    regular.saveRegularScore(P.admin, a.id, 'listening', { score: 30, total: 40 }, D);
    assert(o(a.id, 'listening').nhap_dau_ngay === D, 'lần đầu');
    regular.saveRegularScore(P.admin, a.id, 'listening', { score: 32, total: 40, lyDo: 'Cộng sót câu 12' }, addDays(D, 2));
    assert(o(a.id, 'listening').nhap_dau_ngay === D, 'sửa giữ ngày đầu');
    regular.saveRegularScore(P.admin, a.id, 'listening', { score: null, total: null, lyDo: 'Nhập nhầm em' }, addDays(D, 2));
    assert(o(a.id, 'listening').nhap_dau_ngay === null, 'xoá điểm phải NULL');
  });

  // ------------------------------------------------------------------ khối 3 · han_xu_ly + phan_hoi_ngay (Q14)
  console.log('\nPR-Pb2-b · Hạn xử lý chốt + ngày phản hồi vi phạm');
  const viol: any = await import('../yThuc/violations.ts');
  const xuLy: any = await import('../yThuc/xuLy.ts');
  const tt: any = await import('../yThuc/trangThai.ts');
  const yc: any = await import('../duyet/yeuCau.ts');
  const attachments: any = await import('../platform/attachments.ts');
  const studentsSvc: any = await import('../students/students.ts');
  const gvbm = P.w1Teacher;
  const gvcn = P.coreTeacher;
  const hv = () => {
    const { sid, cy } = emMoi('MB FT 101');
    if (cy) boLichTuTao(conn, cy);
    conn.prepare("UPDATE enrollments SET started_at = '2026-08-03' WHERE student_id = ?").run(sid);
    return sid;
  };
  const ghiVp = (sid: number, ngay = D) =>
    (viol.recordViolation(gvbm, { studentId: sid, category: 'homework', description: 'Vi phạm ghi cho phép kiểm Pb2-b', occurredOn: ngay }) as any).violation.id as number;
  const vp = (id: number) => get('SELECT han_xu_ly, phan_hoi_ngay FROM violations WHERE id = ?', id);
  const hanDung = (sid: number, id: number) => tt.trangThaiYThuc([sid]).get(sid).viPham.get(id).han;
  const deXuatGui = (sid: number, ids: number[]) => {
    const nhap = xuLy.deXuat(gvcn, sid, { kind: 'suspension', violationIds: ids, note: 'Em vi phạm nhiều lần, cần QL quyết' });
    attachments.addLink(gvcn, { ownerType: 'discipline_measure', ownerId: nhap.id, url: 'https://example.com/bang-chung', displayName: 'Biên bản' });
    return { nhap, gui: () => xuLy.guiDeXuat(gvcn, nhap.id) };
  };
  const theCho = (measureId: number) => get(`SELECT id FROM yeu_cau_duyet WHERE loai = 'y_thuc' AND doi_tuong_id = ? ORDER BY id DESC`, measureId);

  check('Pb2b (1e) · vi phạm thứ 3 trong cửa sổ → cả 3 có hạn chốt = hạn của trangThaiYThuc; hai vi phạm đầu (chưa bắt buộc) không có hạn', () => {
    const sid = hv();
    const v1 = ghiVp(sid, addDays(D, -2)); const v2 = ghiVp(sid, addDays(D, -1));
    assert(vp(v1).han_xu_ly === null && vp(v2).han_xu_ly === null, 'chưa bắt buộc thì chưa chốt');
    const v3 = ghiVp(sid, D);
    const h = hanDung(sid, v3);
    assert(h && [v1, v2, v3].every((v) => vp(v).han_xu_ly === h), `${h} · ${[v1, v2, v3].map((v) => vp(v).han_xu_ly)}`);
  });
  check('Pb2b (1f) · vi phạm thứ 4 → 3 hạn cũ không bị ghi đè; vi phạm thứ 4 có hạn riêng', () => {
    const sid = hv();
    const ids = [ghiVp(sid, addDays(D, -2)), ghiVp(sid, addDays(D, -1)), ghiVp(sid, D)];
    conn.prepare(`UPDATE violations SET han_xu_ly = '2026-01-01' WHERE id = ?`).run(ids[0]);
    const v4 = ghiVp(sid, D);
    assert(vp(ids[0]).han_xu_ly === '2026-01-01', 'hạn đã chốt bị ghi đè');
    assert(vp(v4).han_xu_ly === hanDung(sid, v4), `v4: ${vp(v4).han_xu_ly}`);
  });
  check('Pb2b (1g) · xoá bớt vi phạm → hết bắt buộc → vi phạm chưa phản hồi bỏ hạn chốt', () => {
    const sid = hv();
    const ids = [ghiVp(sid, addDays(D, -2)), ghiVp(sid, addDays(D, -1)), ghiVp(sid, D)];
    viol.deleteViolation(P.mbManager, ids[2]);
    assert(vp(ids[0]).han_xu_ly === null && vp(ids[1]).han_xu_ly === null, `${vp(ids[0]).han_xu_ly} · ${vp(ids[1]).han_xu_ly}`);
  });
  check('Pb2b (1h) · Tạm dừng rồi Quay lại: chưa phản hồi → hạn tính lại từ ngày quay lại; đã phản hồi → giữ', () => {
    const a = hv(); const b = hv();
    const va = [ghiVp(a, addDays(D, -2)), ghiVp(a, addDays(D, -1)), ghiVp(a, D)];
    const vb = [ghiVp(b, addDays(D, -2)), ghiVp(b, addDays(D, -1)), ghiVp(b, D)];
    const hCu = vp(va[0]).han_xu_ly;
    conn.prepare(`UPDATE violations SET han_xu_ly = ? WHERE id IN (${va.join(',')})`).run(addDays(D, -20));
    conn.prepare(`UPDATE violations SET han_xu_ly = ?, phan_hoi_ngay = ? WHERE id IN (${vb.join(',')})`).run(addDays(D, -20), addDays(D, -21));
    for (const s of [a, b]) {
      studentsSvc.setStudentStatus(P.mbManager, s, 'inactive', D, 'Tạm nghỉ');
      studentsSvc.setStudentStatus(P.mbManager, s, 'active', D, 'Đi học lại');
    }
    assert(hCu && va.every((v) => vp(v).han_xu_ly === hanDung(a, v) && vp(v).han_xu_ly !== addDays(D, -20)), va.map((v) => vp(v).han_xu_ly).join());
    assert(vb.every((v) => vp(v).han_xu_ly === addDays(D, -20)), 'đã phản hồi phải giữ hạn');
  });
  check('Pb2b (1i) · phan_hoi_ngay: nháp → không đặt; gửi đề xuất → hôm nay; QL từ chối rồi gửi lại → giữ ngày đầu; xác nhận xử lý → hôm nay', () => {
    const sid = hv();
    const v = ghiVp(sid, D);
    const lan1 = deXuatGui(sid, [v]);
    assert(vp(v).phan_hoi_ngay === null, 'nháp không đặt');
    lan1.gui();
    assert(vp(v).phan_hoi_ngay === D, `gửi: ${vp(v).phan_hoi_ngay}`);
    conn.prepare('UPDATE violations SET phan_hoi_ngay = ? WHERE id = ?').run(addDays(D, -2), v);
    yc.tuChoiYeuCau(P.mbManager, theCho(lan1.nhap.id).id, 'Chưa đủ căn cứ để đình chỉ');
    assert(vp(v).han_xu_ly === hanDung(sid, v) && vp(v).han_xu_ly, `từ chối → chốt hạn: ${vp(v).han_xu_ly}`);
    deXuatGui(sid, [v]).gui();
    assert(vp(v).phan_hoi_ngay === addDays(D, -2), 'gửi lại giữ ngày đầu');
    const s2 = hv();
    const w = ghiVp(s2, D);
    xuLy.xacNhanXuLy(gvcn, s2, { violationIds: [w], performedOn: D, note: 'Đã trao đổi với em và gia đình' });
    assert(vp(w).phan_hoi_ngay === D, `xác nhận: ${vp(w).phan_hoi_ngay}`);
  });
  check('Pb2b (1j) · seed: ô có điểm nào cũng có ngày nhập đầu ≤ ngày demo; vi phạm đã xử lý trong cửa sổ bắt buộc có hạn chốt + ngày phản hồi', () => {
    const thieu = get(`SELECT COUNT(*) n FROM assessment_scores WHERE id <= ? AND raw_score IS NOT NULL AND (nhap_dau_ngay IS NULL OR nhap_dau_ngay > ?)`, t.seedMax.assessment_scores ?? 0, D).n;
    assert(thieu === 0, `${thieu} ô seed thiếu / sai ngày nhập đầu`);
    const coHan = get(`SELECT COUNT(*) n FROM violations WHERE id <= ? AND han_xu_ly IS NOT NULL AND phan_hoi_ngay IS NOT NULL`, t.seedMax.violations ?? 0).n;
    assert(coHan > 0, 'seed không có vi phạm đã phản hồi có hạn chốt');
  });

  // ------------------------------------------------------------------ khối 2 · lớp FOU hai giáo viên (Task 2, Q31-5)
  console.log('\nPR-Pb2-b · Lớp FOU hai giáo viên: phân công 2 ô + Tách từng môn');
  const FOU = [...d.PROGRAMME_TEMPLATES.FOU.skills] as string[];
  const { createApp } = await import('../app.ts');
  /** Máy chủ thật + phiên demo theo người dùng — phép kiểm quyền đi qua đúng route như trình duyệt. */
  async function voiMayChu(fn: (goi: (userId: number, url: string, init?: RequestInit) => Promise<Response>) => Promise<void>) {
    const may = createApp().listen(0);
    const cong = (may.address() as any).port as number;
    const phien = new Map<number, string>();
    const goi = async (userId: number, url: string, init: RequestInit = {}) => {
      if (!phien.has(userId)) {
        const s = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }) });
        phien.set(userId, (s.headers.get('set-cookie') ?? '').split(';')[0]);
      }
      return fetch(`http://127.0.0.1:${cong}/api${url}`, { ...init, headers: { 'content-type': 'application/json', cookie: phien.get(userId)!, ...(init.headers ?? {}) } });
    };
    try { await fn(goi); } finally { may.close(); }
  }

  check('Pb2b (2a) · oPhanCong FOU { tach: false } → 3 ô: GVCN · "L · R · G+V" (gộp L, R, W) · P; mặc định → 5 ô như cũ', () => {
    const gop = d.oPhanCong('FOU', FOU, { tach: false });
    assert(gop.map((o: any) => o.nhan).join('|') === 'GVCN|L · R · G+V|P', gop.map((o: any) => o.nhan).join('|'));
    assert(gop[1].gop.join() === 'listening,reading,writing' && gop[1].skill === null, JSON.stringify(gop[1]));
    assert(d.oPhanCong('FOU', FOU).length === 5 && d.oPhanCong('FOU', FOU, {}).length === 5, 'mặc định 5 ô');
  });
  check('Pb2b (2b) · BE, ELE, FT với { tach: false } không đổi; Pre FOU một ô GVCN', () => {
    for (const ct of ['BE', 'ELE']) {
      const sk = [...d.PROGRAMME_TEMPLATES[ct].skills];
      assert(JSON.stringify(d.oPhanCong(ct, sk, { tach: false })) === JSON.stringify(d.oPhanCong(ct, sk)), ct);
    }
    assert(JSON.stringify(d.oPhanCong('FT', d.ENTRY_SKILLS, { tach: false })) === JSON.stringify(d.oPhanCong('FT', d.ENTRY_SKILLS)), 'FT');
    assert(d.oPhanCong('PREFOU', ['tong_hop'], { tach: false }).length === 1, 'Pre FOU');
  });
  check('Pb2b (2c) · slotsTuO: ô gộp chọn người 7 → 3 dòng người 7; kiemPhanCong không lỗi; GVCN = người 7 đủ luật "GVCN dạy ≥ 1 môn"', () => {
    const oList = d.oPhanCong('FOU', FOU, { tach: false });
    const slots = d.slotsTuO(oList, { gvcn: 7, 'gop-fou': 7, speaking: 9 });
    assert(slots.filter((s: any) => s.userId === 7 && !s.isCore).map((s: any) => s.skill).join() === 'listening,reading,writing', JSON.stringify(slots));
    assert(slots.some((s: any) => s.isCore && s.userId === 7 && s.skill === null) && slots.some((s: any) => s.skill === 'speaking' && s.userId === 9), JSON.stringify(slots));
    assert(d.kiemPhanCong('FOU', FOU, slots).length === 0, JSON.stringify(d.kiemPhanCong('FOU', FOU, slots)));
    const khongDay = d.slotsTuO(oList, { gvcn: 5, 'gop-fou': 7, speaking: 9 });
    assert(d.kiemPhanCong('FOU', FOU, khongDay)[0]?.khoa === 'gvcn', 'GVCN không dạy môn nào phải lỗi');
  });
  /* PR-S6F-a Q3 (D3) đổi kỳ vọng: L = R = 7, G+V trống → TÁCH (mở gộp thì lưu sẽ tự gán G+V cho người 7); ba môn cùng người → gộp. */
  check('Pb2b (2d) · nenTachFou: L = R = G+V = 7 → false; L = R = 7, G+V trống → true (S6F-a D3); L = 7, R = 9 → true; lớp BE → false · chonKhiDoiTach giữ người', () => {
    assert(!d.nenTachFou('FOU', [{ skill: 'listening', userId: 7 }, { skill: 'reading', userId: 7 }, { skill: 'writing', userId: 7 }, { skill: 'speaking', userId: 9 }]), 'cùng người');
    assert(d.nenTachFou('FOU', [{ skill: 'listening', userId: 7 }, { skill: 'reading', userId: 7 }, { skill: 'speaking', userId: 9 }]), 'G+V trống');
    assert(d.nenTachFou('FOU', [{ skill: 'listening', userId: 7 }, { skill: 'reading', userId: 9 }]), 'khác người');
    assert(!d.nenTachFou('BE', [{ skill: 'listening', userId: 7 }, { skill: 'reading', userId: 9 }]), 'BE');
    const gop = ['listening', 'reading', 'writing'];
    assert(JSON.stringify(d.chonKhiDoiTach({ gvcn: 7, 'gop-fou': 7, speaking: 9 }, gop, true)) === JSON.stringify({ gvcn: 7, speaking: 9, listening: 7, reading: 7, writing: 7 }), 'tách');
    assert(JSON.stringify(d.chonKhiDoiTach({ gvcn: 7, listening: '', reading: 8, speaking: 9 }, gop, false)) === JSON.stringify({ gvcn: 7, speaking: 9, 'gop-fou': 8 }), 'gộp');
  });
  const intake2: any = await import('../classes/intake.ts');
  const MB = get(`SELECT id FROM branches WHERE code = 'MB'`).id as number;
  const lopFouMoi = (() => {
    const bat = d.mondayOfDate(D);
    return (intake2.createClass(P.admin, { code: 'MB FOU PB2B', branchId: MB, kind: 'FOU', isFastTrack: false, route: null, startDate: bat, startPeriodId: week.ensurePeriod(bat).id }) as any).id as number;
  })();
  await t.checkAsync('Pb2b (2e) · PUT /classes/{FOU}/teachers với slots đã trải → đúng 1 GVCN + 4 dòng môn (máy chủ nhận dạng cũ)', async () => {
    const a = P.normalCoreTeacher.userId; const b = P.normalSubjectTeacher.userId;
    const slots = d.slotsTuO(d.oPhanCong('FOU', FOU, { tach: false }), { gvcn: a, 'gop-fou': a, speaking: b });
    await voiMayChu(async (goi) => {
      const r = await goi(P.mbManager.userId, `/classes/${lopFouMoi}/teachers`, { method: 'PUT', body: JSON.stringify({ slots }) });
      assert(r.ok, `PUT ${r.status}: ${await r.text()}`);
    });
    const ds = all(`SELECT user_id, skill, is_core FROM teacher_assignments WHERE class_id = ? AND status = 'active' AND effective_to IS NULL ORDER BY is_core DESC, skill`, lopFouMoi);
    assert(ds.length === 5 && ds[0].is_core === 1 && ds[0].skill === null && ds[0].user_id === a, JSON.stringify(ds));
    assert(ds.slice(1).map((x) => `${x.skill}:${x.user_id === a ? 'a' : 'b'}`).join() === 'listening:a,reading:a,speaking:b,writing:a', JSON.stringify(ds));
  });

  // ------------------------------------------------------------------ khối 3 · hồ sơ GV: vai một chip, chip bàn giao, 4 cột lớp thường (Task 3)
  console.log('\nPR-Pb2-b · Hồ sơ GV: vai GVCN · L R G+V, chip Bàn giao n/m em, lớp thường 4 cột');
  const hoSo: any = await import('../giaoVien/hoSo.ts');
  const { myWork } = await import('../worklist/mywork.ts');
  const { loadPrincipal } = await import('../permissions.ts');
  check('Pb2b (3a) · nhanVaiLop: GVCN + L R G+V → "GVCN · L R G+V"; chỉ P → "P"; chỉ GVCN → "GVCN"', () => {
    assert(d.nhanVaiLop({ gvcn: true, mon: ['L', 'R', 'G+V'] }) === 'GVCN · L R G+V', d.nhanVaiLop({ gvcn: true, mon: ['L', 'R', 'G+V'] }));
    assert(d.nhanVaiLop({ gvcn: false, mon: ['P'] }) === 'P' && d.nhanVaiLop({ gvcn: true, mon: [] }) === 'GVCN', 'P / GVCN');
  });
  check('Pb2b (3b) · lớp FOU vừa phân công: hồ sơ GV người L · R · G+V kiêm GVCN có vai "GVCN · L R G+V", người P có vai "P"', () => {
    const lopA = hoSo.hoSoGiaoVien(P.admin, P.normalCoreTeacher.userId).lop.find((l: any) => l.id === lopFouMoi);
    const lopB = hoSo.hoSoGiaoVien(P.admin, P.normalSubjectTeacher.userId).lop.find((l: any) => l.id === lopFouMoi);
    assert(lopA?.vai === 'GVCN · L R G+V' && lopB?.vai === 'P', `${lopA?.vai} · ${lopB?.vai}`);
  });
  check('Pb2b (3c) · chip Bàn giao (hai đường, cùng viecBanGiao): GVCN MB FOU 22 → { gvcn, da, n } = việc "Bàn giao … MB FOU 22" ở /my-work; GVBM P → { gvbm, mon P }', () => {
    const lop = classId('MB FOU 22');
    const gvcnId = get(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND is_core = 1 AND status = 'active' ORDER BY id LIMIT 1`, lop).user_id as number;
    const chip = hoSo.hoSoGiaoVien(P.admin, gvcnId).lop.find((l: any) => l.id === lop)?.banGiao;
    const viec = (myWork(loadPrincipal(gvcnId)) as any).items.find((i: any) => i.key === `ban_giao:${lop}`) as any;
    assert(viec && chip?.loai === 'gvcn' && chip.n === viec.count && viec.contextLabel.includes(`${chip.da}/${chip.n}`), `${JSON.stringify(chip)} ‖ ${JSON.stringify(viec?.contextLabel)}`);
    const pId = get(`SELECT user_id FROM teacher_assignments WHERE class_id = ? AND skill = 'speaking' AND status = 'active' AND user_id != ? ORDER BY id LIMIT 1`, lop, gvcnId)?.user_id as number | undefined;
    if (pId) {
      const chipP = hoSo.hoSoGiaoVien(P.admin, pId).lop.find((l: any) => l.id === lop)?.banGiao;
      const viecP = (myWork(loadPrincipal(pId)) as any).items.find((i: any) => i.key === `ban_giao_mon:${lop}:speaking`) as any;
      assert(!viecP || (chipP?.loai === 'gvbm' && chipP.mon === 'P' && chipP.n === Number(viecP.contextLabel.match(/\/(\d+) em/)?.[1])), `${JSON.stringify(chipP)} ‖ ${viecP?.contextLabel}`);
    }
  });
  check('Pb2b (3d) · lớp không có quyết định chuyển lớp → không chip bàn giao', () => {
    const l = hoSo.hoSoGiaoVien(P.admin, P.normalCoreTeacher.userId).lop.find((x: any) => x.id === lopFouMoi);
    assert(l && l.banGiao === null, JSON.stringify(l?.banGiao));
  });
  check('Pb2b (3e) · ketQuaHoSoGv lớp thường: khoá dòng ∈ listening/reading/writing/speaking (Pre FOU tong_hop) — web xếp đúng 4 cột cố định', () => {
    for (const gv of all(`SELECT DISTINCT ta.user_id FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id WHERE c.is_fast_track = 0 AND ta.status = 'active' LIMIT 6`)) {
      for (const k of hoSo.ketQuaHoSoGv(P.admin, gv.user_id).ketQua.filter((x: any) => x.khung === 'thuong')) {
        assert(k.o.every((o: any) => ['listening', 'reading', 'writing', 'speaking', 'tong_hop', 'listening_speaking', 'reading_writing'].includes(o.dong)), `${k.ma}: ${k.o.map((o: any) => o.dong)}`);
      }
    }
  });

  // ------------------------------------------------------------------ khối 4 · bảng Phân tích giáo viên — máy chủ (Task 4)
  console.log('\nPR-Pb2-b · Bảng Phân tích giáo viên: mỗi cột một hàm tập, hai đường, quyền, không N+1');
  const pt: any = await import('../phanTich/giaoVien.ts');
  const hieuQuaPaSvc: any = await import('../phanTich/hieuQuaPa.ts');
  const metricsSvc: any = await import('../worklist/metrics.ts');
  const nguCanh: any = await import('../platform/nguCanhRequest.ts');
  check('Pb2b (4a) · khoangPtGv: tháng 09/2026 = W1 SEP – W4 SEP (31/08 – 21/09); khoảng dài tự do (P9); vắng → 4 tuần tới tuần hôm nay; tu > den → lỗi', () => {
    const t9 = d.khoangPtGv({ thang: '2026-09' }, '2026-09-14');
    assert(t9.tu === '2026-08-31' && t9.den === '2026-09-21', JSON.stringify(t9));
    assert(!('loi' in d.khoangPtGv({ tu: '2026-01-05', den: '2026-08-31' }, '2026-09-14')), '35 tuần được (không trần)');
    assert(!('loi' in d.khoangPtGv({ tu: '2026-06-08', den: '2026-08-31' }, '2026-09-14')), '13 tuần được');
    const vang = d.khoangPtGv({}, '2026-09-16');
    assert(vang.tu === '2026-08-24' && vang.den === '2026-09-14', JSON.stringify(vang));
    assert('loi' in d.khoangPtGv({ tu: '2026-09-14', den: '2026-09-07' }, '2026-09-14') && 'loi' in d.khoangPtGv({ tu: '2026-09-15', den: '2026-09-21' }, '2026-09-14'), 'ngược / không Thứ Hai');
  });
  check('Pb2b (4b) · chuOPtGv bốn dạng (V5 C08: không màu ngưỡng) · khungPtGvTuThamSo("ca-hai") = ft', () => {
    assert(JSON.stringify(d.chuOPtGv({ k: 'so', dung: 18, tong: 20 })) === '{"so":"18/20","phu":"90%"}', 'số');
    assert(d.chuOPtGv({ k: 'so', dung: 3, tong: 4 }).phu === '75%' && d.chuOPtGv({ k: 'na' }).phu === '—' && d.chuOPtGv({ k: 'rong' }).phu === 'Chưa có dữ liệu', 'ba dạng');
    assert(d.khungPtGvTuThamSo('ca-hai') === 'ft' && d.khungPtGvTuThamSo(null) === 'ft' && d.khungPtGvTuThamSo('thuong') === 'thuong', 'khung');
  });

  /* Dữ liệu dựng: em mới MB FT 101, MT1 tuần này — L nhập đúng hạn rồi sửa sau hạn · R quá hạn chưa nhập (hạn dời về hôm qua) · S dấu "-". */
  const MB_FT = classId('MB FT 101');
  const tuanNay = week.mondayOf(D);
  /* Phép kiểm trước có thể đã kết thúc phân công L/R của MB FT 101 mà không ai thay — dựng lại để ô thử có người phụ trách ở hạn nhập. */
  for (const k of ['listening', 'reading']) {
    if (!get(`SELECT 1 FROM teacher_assignments WHERE class_id = ? AND skill = ? AND status = 'active' AND effective_to IS NULL`, MB_FT, k)) {
      conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,?,0,?, 'active', ?)`)
        .run(P.lrTeacher.userId, MB_FT, k, D, new Date().toISOString());
    }
  }
  const e1 = emMoi('MB FT 101');
  boLichTuTao(conn, e1.cy);
  const a1 = luotThu(conn, svc.createAttempt, P.admin, { studentId: e1.sid, cycleId: e1.cy, classId: MB_FT, no: 1, periodId: week.ensurePeriod(tuanNay).id });
  svc.saveScore(P.admin, a1.id, 'listening', { rawScore: 30 }, D);
  const hanL = (svc.skillCells(P.admin, get('SELECT * FROM assessment_attempts WHERE id = ?', a1.id), svc.scoresOf(a1.id), [], D,
    svc.loadBundle([a1.id]).skillRows.get(a1.id)) as any[]).find((x) => x.skill === 'listening').deadline as string;
  if (!hanL) throw new Error('Pb2b (4): ô L của lượt thử không có hạn nhập — dữ liệu dựng sai');
  svc.saveScore(P.admin, a1.id, 'listening', { rawScore: 31, lyDo: 'Chấm lại câu 12' }, addDays(hanL, 2));
  svc.saveScore(P.admin, a1.id, 'speaking', { noShow: true }, D);
  conn.prepare(`UPDATE attempt_skills SET deadline_override = ? WHERE attempt_id = ? AND skill = 'reading'`).run(addDays(D, -1), a1.id);
  const { demoToday: demoTodayNay } = await import('../demoConfig.ts');
  const bang = (ct = 'ft', q: Record<string, unknown> = {}) => pt.phanTichGiaoVien(P.mbManager, { ct, ...q });
  const hangCua = (b: any, id: number) => b.hang.find((h: any) => h.id === id);

  check('Pb2b (4c) · Chấm điểm, HAI ĐƯỜNG: mọi GV có số → panel đúng m dòng, "Trễ" = m − n dòng (cùng tapChamDiem)', () => {
    const b = bang();
    const coSo = b.hang.filter((h: any) => h.chamDiem.k === 'so');
    assert(coSo.length >= 1, 'không GV nào có ô Chấm điểm');
    for (const h of coSo) {
      const pn = pt.oChamDiemGv(P.mbManager, { ct: 'ft', gv: h.id });
      assert(pn.rows.length === h.chamDiem.tong && pn.tre === h.chamDiem.tong - h.chamDiem.dung && pn.rows.filter((r: any) => !r.dung).length === pn.tre, `${h.ten}: ${h.chamDiem.dung}/${h.chamDiem.tong} ‖ ${pn.rows.length} dòng, ${pn.tre} trễ`);
      assert(pn.rows.every((r: any, i: number, ds: any[]) => i === 0 || Number(ds[i - 1].dung) <= Number(r.dung)), `${h.ten}: dòng trễ phải đứng đầu`);
    }
  });
  check('Pb2b (4d) · ô L nhập đúng hạn rồi sửa sau hạn → vẫn đúng hạn, panel ghi ngày sửa; R hạn đè đã qua nhưng tuần thi chưa hết → chưa tính (S6F-a D6); S dấu "-" → không có mặt', () => {
    /* Dòng panel của MỌI GV (phép kiểm trước có thể đã đổi người dạy L/R của MB FT 101 — gán người theo hạn, không theo người cố định). */
    const kh = { ct: 'ft', tu: tuanNay, den: tuanNay };
    const dongPanel = new Map<number, any>(bang('ft', kh).hang.flatMap((h: any) => pt.oChamDiemGv(P.mbManager, { ...kh, gv: h.id }).rows.map((r: any) => [r.id, r])));
    const L = dongPanel.get(d.baiId(a1.id, 'listening'));
    const pcL = all(`SELECT user_id, effective_from, effective_to, status FROM teacher_assignments WHERE class_id = ? AND skill = 'listening'`, MB_FT);
    assert(L?.dung && L.nhapDau === D && L.sua, `ô L: ${JSON.stringify(L) ?? 'không có trong panel nào'} · hôm nay ${demoTodayNay()} · hạn ${hanL} · phân công L ${JSON.stringify(pcL)}`);
    const R = dongPanel.get(d.baiId(a1.id, 'reading'));
    /* PR-S6F-a Q6 (D6) đổi kỳ vọng: một luật quá hạn nhập điểm — tuần thi còn chạy thì chưa ai trễ, kể cả hạn bị đặt đè sớm (phép kiểm S6F-a (3c) khoá phần sau tuần thi). */
    assert(!R, `ô R tuần thi chưa hết vẫn bị tính: ${JSON.stringify(R)}`);
    const S = [...(pt.tapChamDiem(pt.nguCanhPtGv(P.mbManager, { ct: 'ft' }), { o: [], attempts: new Map(), bundle: null }).dong.values())];
    assert(S.length === 0, 'rỗng khi không có ô');
    const tatCa = [...dongPanel.keys()];
    assert(!tatCa.includes(d.baiId(a1.id, 'speaking')), 'ô dấu "-" không được tính');
    assert(!tatCa.includes(d.baiId(a1.id, 'writing1')), 'ô chưa tới hạn chưa nhập không được tính');
  });
  check('Pb2b (4e) · em Tạm dừng → ô không có mặt; đổi phân công giữa khoảng → người ở ngày đó (dòng mới thắng)', () => {
    const e2 = emMoi('MB FT 101');
    boLichTuTao(conn, e2.cy);
    const a2 = luotThu(conn, svc.createAttempt, P.admin, { studentId: e2.sid, cycleId: e2.cy, classId: MB_FT, no: 1, periodId: week.ensurePeriod(tuanNay).id });
    svc.saveScore(P.admin, a2.id, 'listening', { rawScore: 25 }, D);
    conn.prepare(`UPDATE students SET status = 'inactive' WHERE id = ?`).run(e2.sid);
    const pn = pt.oChamDiemGv(P.mbManager, { ct: 'ft', gv: P.lrTeacher.userId });
    conn.prepare(`UPDATE students SET status = 'active' WHERE id = ?`).run(e2.sid);
    assert(!pn.rows.some((r: any) => r.id === d.baiId(a2.id, 'listening')), 'em Tạm dừng vẫn tính');
    const a = P.normalCoreTeacher.userId; const b = P.normalSubjectTeacher.userId; const c3 = P.w1Teacher.userId;
    conn.prepare(`UPDATE teacher_assignments SET status = 'ended', effective_to = ? WHERE class_id = ? AND skill = 'speaking' AND status = 'active'`).run(addDays(D, 2), lopFouMoi);
    conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?, 'speaking', 0, ?, 'active', ?)`).run(c3, lopFouMoi, addDays(D, 2), new Date().toISOString());
    const nc = pt.nguCanhPtGv(P.mbManager, { ct: 'thuong' });
    assert(nc.nguoiLuc(lopFouMoi, 'speaking', addDays(D, 1)) === b && nc.nguoiLuc(lopFouMoi, 'speaking', addDays(D, 2)) === c3 && nc.nguoiLuc(lopFouMoi, 'speaking', addDays(D, 5)) === c3, 'người theo ngày');
    assert(nc.nguoiLuc(lopFouMoi, null, D) === a && nc.nguoiLuc(lopFouMoi, 'listening', addDays(D, -30)) === null, 'GVCN / trước phân công');
  });
  check('Pb2b (4f) · Ghi kết quả PA: Σ tong các GV + nghĩa vụ Case không người phụ trách = metricSet("dung-han-cap-nhat").n cùng khoảng + khung', () => {
    const nc = pt.nguCanhPtGv(P.mbManager, { ct: 'ft', thang: '2026-09' });
    const r = pt.tapGhiKetQuaPa(P.mbManager, nc);
    const tong = [...r.tap.values()].reduce((s: number, x: any) => s + x.tong.length, 0);
    const m = metricsSvc.metricSet(P.mbManager, 'dung-han-cap-nhat', { branchId: nc.cn, program: 'ft', from: nc.tu, to: nc.cuoi });
    assert(tong + r.khongNguoi === m.n, `${tong} + ${r.khongNguoi} ≠ ${m.n}`);
    const b = pt.phanTichGiaoVien(P.mbManager, { ct: 'ft', thang: '2026-09' });
    assert(b.hang.every((h: any) => h.ghiKetQuaPa.k !== 'so' || h.ghiKetQuaPa.tong === r.tap.get(h.id)?.tong.length), 'ô = tập');
  });
  /* 10 (22/10): "Xử lý vi phạm" bỏ khỏi Phân tích GV (dữ liệu vi phạm giữ). Giữ đúng dữ liệu (4g), (4h) từng tạo — id của phép kiểm sau không lệch. */
  check('Pb2b (4g) · Phân tích GV không còn cột Xử lý vi phạm; vi phạm + đề xuất vẫn lưu, không vào Việc đúng hạn', () => {
    const sid = hv();
    const ids = [ghiVp(sid, addDays(D, -2)), ghiVp(sid, addDays(D, -1)), ghiVp(sid, D)];
    deXuatGui(sid, ids).gui();
    const s2 = hv();
    const ids2 = [ghiVp(s2, addDays(D, -2)), ghiVp(s2, addDays(D, -1)), ghiVp(s2, D)];
    deXuatGui(s2, ids2).gui();
    const b = bang('ft', { tu: tuanNay, den: week.mondayOf(addDays(D, 7)) });
    const h = hangCua(b, gvcn.userId);
    assert(h && !('xuLyViPham' in h) && JSON.stringify(h.viecDungHan) === JSON.stringify(h.ghiKetQuaPa), JSON.stringify(h));
    assert((conn.prepare(`SELECT COUNT(*) AS n FROM violations WHERE id IN (${[...ids, ...ids2].join(',')})`).get() as any).n === 6, 'vi phạm phải còn');
  });
  check('Pb2b (4i) · Kết quả: GV L có ô L (FT 5 khoá), GV không dạy L → "—" ở L; em KCK không tính; HV tiến bộ: MT trước L 5.5 → nay 6.0 tiến bộ; chưa có bài trước → không có mặt', () => {
    /* Em có bài trước (MT1 tuần trước, L 5.5) và bài nay (MT2 tuần này, L 6.0); em KCK chỉ có bài nay. */
    const e3 = emMoi('MB FT 101');
    boLichTuTao(conn, e3.cy);
    const truoc = luotThu(conn, svc.createAttempt, P.admin, { studentId: e3.sid, cycleId: e3.cy, classId: MB_FT, no: 1, periodId: week.ensurePeriod(addDays(tuanNay, -7)).id });
    const nay = luotThu(conn, svc.createAttempt, P.admin, { studentId: e3.sid, cycleId: e3.cy, classId: MB_FT, no: 2, periodId: week.ensurePeriod(tuanNay).id });
    const diem = (aid: number, band: number) => conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, raw_score, raw_total, band, nhap_dau_ngay) VALUES (?, 'listening', 20, 40, ?, ?)`).run(aid, band, D);
    diem(truoc.id, 5.5); diem(nay.id, 6.0);
    const e4 = emMoi('MB FT 101');
    boLichTuTao(conn, e4.cy);
    conn.prepare(`UPDATE learning_cycles SET khong_cam_ket = 1, target_score = NULL WHERE id = ?`).run(e4.cy);
    const kck = luotThu(conn, svc.createAttempt, P.admin, { studentId: e4.sid, cycleId: e4.cy, classId: MB_FT, no: 1, periodId: week.ensurePeriod(tuanNay).id });
    diem(kck.id, 6.0);
    /* V5 C09: lượt phải đủ 4 kỹ năng (có Overall) mới vào mẫu Kết quả. */
    for (const k of ['reading', 'writing1', 'writing2', 'speaking']) conn.prepare(`INSERT INTO assessment_scores (attempt_id, skill, raw_score, raw_total, band, nhap_dau_ngay) VALUES (?, ?, 20, 40, 6.0, ?)`).run(kck.id, k, D);
    const b = pt.phanTichGiaoVien(P.mbManager, { ct: 'ft', tu: tuanNay, den: tuanNay });
    const hL = hangCua(b, P.lrTeacher.userId);
    assert(hL && Object.keys(hL.ketQua).join() === 'listening,reading,writing1,writing2,speaking', JSON.stringify(hL?.ketQua));
    const khongL = b.hang.find((h: any) => h.ketQua.listening.k === 'na' && h.ketQua.speaking.k !== 'na');
    assert(!khongL || khongL.ketQua.listening.k === 'na', 'GV không dạy L phải "—"');
    assert(hL.ketQua.listening.k === 'so', `ô L: ${JSON.stringify(hL.ketQua.listening)}`);
    assert(hL.tienBo?.k === 'so' && hL.tienBo.dung >= 1, `tiến bộ: ${JSON.stringify(hL.tienBo)}`);
    const tb1 = hL.tienBo.tong;
    conn.prepare(`DELETE FROM assessment_scores WHERE attempt_id = ?`).run(truoc.id);
    const sau = hangCua(pt.phanTichGiaoVien(P.mbManager, { ct: 'ft', tu: tuanNay, den: tuanNay }), P.lrTeacher.userId);
    assert((sau.tienBo.k === 'so' ? sau.tienBo.tong : 0) === tb1 - 1, `bỏ bài trước → bớt một mục: ${tb1} → ${JSON.stringify(sau.tienBo)}`);
    const kq1 = hL.ketQua.listening.tong;
    conn.prepare(`UPDATE learning_cycles SET khong_cam_ket = 0, target_score = 6.5 WHERE id = ?`).run(e4.cy);
    const kq2 = hangCua(pt.phanTichGiaoVien(P.mbManager, { ct: 'ft', tu: tuanNay, den: tuanNay }), P.lrTeacher.userId).ketQua.listening.tong;
    assert(kq2 === kq1 + 1, `em KCK không tính, có Target thì tính: ${kq1} → ${kq2}`);
  });
  check('Pb2b (4j) · Lớp thường: không PA hiệu quả, không HV tiến bộ; Kết quả đúng 4 khoá; FOU người P chỉ có cột S (P); sắp theo tên; GV không phân công trong khung → không hàng', () => {
    const b = pt.phanTichGiaoVien(P.mbManager, { ct: 'thuong', thang: '2026-09' });
    assert(b.hang.length > 0 && b.hang.every((h: any) => h.paHieuQua === undefined && h.tienBo === undefined && Object.keys(h.ketQua).join() === 'listening,reading,writing,speaking,listening_speaking,reading_writing'), 'khoá cột');   // OV-11h: + L+S · R+W (web chỉ hiện khi có)
    assert(b.hang.every((h: any, i: number) => i === 0 || b.hang[i - 1].ten.localeCompare(h.ten, 'vi') <= 0), 'sắp theo tên');
    const ft = pt.phanTichGiaoVien(P.mbManager, { ct: 'ft', thang: '2026-09' });
    const chiThuong = b.hang.filter((h: any) => !ft.hang.some((x: any) => x.id === h.id));
    const coTrongKhung = new Set(all(`SELECT DISTINCT ta.user_id FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id WHERE c.branch_id = ? AND c.is_fast_track = 1`, MB).map((r) => r.user_id));
    assert(chiThuong.every((h: any) => !coTrongKhung.has(h.id)), 'người không phân công FT không được có hàng FT');
  });
  check('Pb2b (4k) · PA hiệu quả, HAI ĐƯỜNG: ô mỗi GV = Hiệu quả PA lọc gv cùng khoảng (gvThem.tomTat: cải thiện / có kết quả); lớp thường không có cột', () => {
    const hq: any = hieuQuaPaSvc;
    const kh = { tu: d.addDaysIso(tuanNay, -84), den: tuanNay };   // 13 tuần tới tuần demo — đủ rộng để có PA có kết quả
    const b = bang('ft', kh);
    let coSo = 0;
    for (const h of b.hang) {
      const t = hq.hieuQuaPa(P.mbManager, { branchId: MB, ct: 'ft', soTuan: 4, gv: h.id, ...kh }).gvThem.tomTat;
      const o = h.paHieuQua;
      const so = o.k === 'so' ? [o.dung, o.tong] : [0, 0];
      assert(so[0] === t.caiThien && so[1] === t.paCoKetQua, `${h.ten}: ô ${JSON.stringify(o)} ≠ Hiệu quả PA ${t.caiThien}/${t.paCoKetQua}`);
      if (o.k === 'so') coSo += 1;
    }
    assert(coSo > 0, 'bộ demo không GV nào có PA giáo viên thêm có kết quả trong 13 tuần');
  });
  await t.checkAsync('Pb2b (4l) · PHỦ ĐỊNH qua route: GVCN / GVBM → 403; QL CP xem cn = MB → 403; Quản trị không cn → 400; 14 tuần → 200 (P9); QL MB → 200', async () => {
    await voiMayChu(async (goi) => {
      const ma = async (u: number, url: string) => (await goi(u, url)).status;
      assert(await ma(gvcn.userId, `/phan-tich/giao-vien?cn=${MB}&ct=ft`) === 403, 'GVCN');
      assert(await ma(P.w1Teacher.userId, `/phan-tich/giao-vien/cham-diem?cn=${MB}&ct=ft&gv=${gvcn.userId}`) === 403, 'GVBM');
      assert(await ma(P.cpManager.userId, `/phan-tich/giao-vien?cn=${MB}&ct=ft`) === 403, 'QL CP');
      assert(await ma(P.admin.userId, `/phan-tich/giao-vien?ct=ft`) === 400, 'QT không cn');
      assert(await ma(P.mbManager.userId, `/phan-tich/giao-vien?cn=${MB}&ct=ft&tu=2026-06-01&den=2026-08-31`) === 200, '14 tuần (không trần)');
      assert(await ma(P.mbManager.userId, `/phan-tich/giao-vien?cn=${MB}&ct=ft&thang=2026-09`) === 200, 'QL MB');
      assert(await ma(P.mbManager.userId, `/phan-tich/giao-vien/cham-diem?cn=${MB}&ct=ft&gv=abc`) === 400, 'gv sai dạng');
    });
  });
  check('Pb2b (4m) · KHÔNG N+1: số câu SQL của bảng bằng nhau khi chi nhánh có thêm 3 GV + 2 lớp FT có phân công', () => {
    const dem = () => { const a = nguCanh.soCauSql(); nguCanh.trongBoNho(() => pt.phanTichGiaoVien(P.mbManager, { ct: 'ft', thang: '2026-09' })); return nguCanh.soCauSql() - a; };
    dem();
    const truoc = dem();
    const gvMoi = [P.normalCoreTeacher.userId, P.normalSubjectTeacher.userId, P.bcManager.userId];
    for (let i = 0; i < 2; i++) {
      const bat = d.mondayOfDate(addDays(D, -21));
      const lop = (intake2.createClass(P.admin, { code: `MB FT PB2B${i}`, branchId: MB, kind: 'FT', isFastTrack: true, route: 'LT1', startDate: bat, startPeriodId: week.ensurePeriod(bat).id }) as any).id as number;
      gvMoi.forEach((g, j) => conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,?,?,?, 'active', ?)`)
        .run(g, lop, j === 0 ? null : ['listening', 'reading'][j - 1], j === 0 ? 1 : 0, bat, new Date().toISOString()));
    }
    const sau = dem();
    assert(sau === truoc, `${truoc} → ${sau} câu`);
  });

  // ------------------------------------------------------------------ khối 6 · bộ demo D18 (Task 6)
  console.log('\nPR-Pb2-b · Bộ demo D18: bảng giáo viên đủ dạng ô, lớp FOU hai giáo viên');
  const idGv = (ten: string) => get('SELECT id FROM users WHERE full_name = ?', ten)?.id as number;
  check('Pb2b (6a) · bảng MB Fast Track 09/2026: ≥ 5 hàng; đủ dạng ô (số ≥ 5 mục, số < 5 mục, "—", "Chưa có dữ liệu")', () => {
    const b = pt.phanTichGiaoVien(P.mbManager, { ct: 'ft', thang: '2026-09' });
    assert(b.hang.length >= 5, `${b.hang.length} hàng`);
    const o = b.hang.flatMap((h: any) => [h.chamDiem, h.ghiKetQuaPa, ...Object.values(h.ketQua), h.tienBo]);
    assert(o.some((x: any) => x.k === 'so' && x.tong >= 5) && o.some((x: any) => x.k === 'so' && x.tong < 5), 'số ≥ 5 / < 5');
    assert(o.some((x: any) => x.k === 'na') && o.some((x: any) => x.k === 'rong'), '— / không có');
    assert(b.hang.every((h: any) => !('xuLyViPham' in h)), 'cột Xử lý vi phạm còn');
  });
  check('Pb2b (6b) · bảng lớp thường 09/2026: lớp FOU hai GV — Bình "L · R · G+V · GVCN MB FOU 14", Ngọc chỉ có cột S (P)', () => {
    const b = pt.phanTichGiaoVien(P.mbManager, { ct: 'thuong', thang: '2026-09' });
    const binh = hangCua(b, idGv('Lê Thanh Bình'));
    const ngoc = hangCua(b, idGv('Ngô Bích Ngọc'));
    assert(binh?.phu === 'L · R · G+V · GVCN MB FOU 14' && binh.ketQua.speaking.k === 'na' && binh.ketQua.writing.k === 'so', JSON.stringify(binh));
    assert(ngoc?.phu === 'P' && ngoc.ketQua.speaking.k === 'so' && ['listening', 'reading', 'writing'].every((k) => ngoc.ketQua[k].k === 'na'), JSON.stringify(ngoc));
    assert(ngoc.dangDay.lop === 2, `Ngọc dạy ${ngoc.dangDay.lop} lớp`);
  });
  check('Pb2b (6c) · panel Chấm điểm của Hương: ≥ 1 dòng trễ, ≥ 1 dòng "sửa sau" vẫn đúng hạn', () => {
    const pn = pt.oChamDiemGv(P.mbManager, { ct: 'ft', thang: '2026-09', gv: idGv('Đỗ Thu Hương') });
    assert(pn.tre >= 1 && pn.rows.some((r: any) => r.dung && r.sua), `${pn.tre} trễ · sửa: ${pn.rows.filter((r: any) => r.sua).length}`);
  });
}
