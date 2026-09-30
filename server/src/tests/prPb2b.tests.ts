/** PHÉP KIỂM PR-Pb2-b — Phân tích giáo viên · FOU 2 GV · hồ sơ GV · ngày nghiệp vụ mới (kế hoạch 2026-10-01-pr-pb2, Phần B). */
import type { YThucTestKit } from './yThuc.tests.ts';

export async function runPrPb2bTests(t: YThucTestKit) {
  const { check, assert, conn, P, TODAY, addDays, classId } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  const maLoi = (fn: () => unknown): number | string => { try { fn(); return 'không ném'; } catch (e: any) { return e?.status ?? String(e?.message ?? e); } };

  // ------------------------------------------------------------------ khối 1 · migrate ba cột (Task 1)
  console.log('\nPR-Pb2-b · Migrate: ngày nhập đầu ô điểm, hạn xử lý chốt, ngày phản hồi vi phạm');
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const { default: SqliteDb } = await import('libsql');
  const { migratePrPb2b } = await import('../migrate/prPb2b.ts');
  const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
  const SCHEMA = fs.readFileSync(path.join(REPO, 'server/src/schema.sql'), 'utf8').replace(/\r\n/g, '\n');
  const cot = (db: any, bang: string) => (db.prepare(`PRAGMA table_info(${bang})`).all() as any[]).map((c) => `${c.name}:${c.type}:${c.notnull}:${c.pk}`);
  /** DB thời trước Pb2-b: cắt ba cột khỏi CHỮ schema.sql (libsql lỗi "incomplete input" khi DROP COLUMN trên bảng có chú thích). */
  const truoc = () => {
    const cat = SCHEMA
      .replace(/\n  -- PR-Pb2-b \(Q13\)[^\n]*\n  nhap_dau_ngay TEXT,/, '')
      .replace(/,\n  -- PR-Pb2-b \(Q14\)[\s\S]*?phan_hoi_ngay TEXT\n\);/, '\n);');
    if (/nhap_dau_ngay|han_xu_ly|phan_hoi_ngay/.test(cat)) throw new Error('schema.sql đổi khuôn — sửa bộ cắt của phép kiểm Pb2b (1)');
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
    intake.commitIntake(P.admin, { classId: classId(lop), rows: [{ fullName: ten, target: 6.5, email: 'hv@demo.test' }], idempotencyKey: `pb2b-${seq}` });
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
  void all; void maLoi;
}
