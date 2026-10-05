/** PHÉP KIỂM PR-SL — Sửa thông tin cả lớp (Q-0310-3): xem trước + lưu MỘT giao dịch, quyền theo trường, chống gửi trùng. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
const doc = (rel: string) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

export async function runPrSlTests(t: YThucTestKit) {
  const { check, checkAsync, assert, conn, P } = t;
  const d = await import('../../../shared/domain/index.ts');
  const { createApp } = await import('../app.ts');
  const { CHI_QL_DOI_TARGET } = await import('../classes/suaCaLop.ts');
  console.log('\nPR-SL · Sửa thông tin cả lớp');

  check('SL-4 · I1: KhungPanel mặc định "Đóng" / "Huỷ thay đổi" theo chan.daSua; Tạo Case, Thêm HV, Từ chối inline theo luật S3', () => {
    const k = doc('web/src/ui/KhungPanel.tsx');
    assert(/daSua\?: boolean/.test(k) && k.includes("chan.daSua ? 'Huỷ thay đổi' : 'Đóng'"), 'KhungPanel chưa có chan.daSua');
    assert(/chan=\{\{\s*daSua,/.test(doc('web/src/modules/cases/QuickReport.tsx')), 'Tạo Case chưa truyền daSua');
    assert(/daSua: !!pasteText\.trim\(\)/.test(doc('web/src/modules/students/IntakePanel.tsx')), 'Thêm HV chưa truyền daSua');
    assert(doc('web/src/modules/duyet/TheYeuCau.tsx').includes("chu.trim() ? 'Huỷ thay đổi' : 'Đóng'"), 'Từ chối inline');
    for (const f of ['web/src/modules/fasttrack/MockDetailPage.tsx', 'web/src/modules/platform/AccountsAdmin.tsx', 'web/src/modules/classes/LuoiTaoLop.tsx']) {
      assert(!doc(f).includes("? 'Huỷ thay đổi' : 'Đóng', onClick"), `${f}: còn tự viết nhãn, dùng chan.daSua`);
    }
  });
  await checkAsync('SL-3 · một mẫu Excel chung: cùng một dòng FT dán (không tiêu đề) vào lớp FT và lớp thường ra cùng Họ tên / Ngày sinh / Email / Target / Dự kiến thi / Tuần', async () => {
    const intake: any = await import('../classes/intake.ts');
    const dong = 'Lê An\t12/05/2008\tan@x.vn\t5\t5\t5.5\t5\t5\t6.5\t05/2027\t0\t05/10/2026';
    const a = intake.parsePaste(dong, { classId: t.classId('MB FT 101') });
    const b = intake.parsePaste(dong, { classId: t.classId('MB FOU 12') });
    for (const [ten, r] of [['FT', a], ['thường', b]] as const) {
      const x = r.rows[0];
      assert(r.rows.length === 1 && !r.cach.coTieuDe && r.cach.thua === 0 && x.fullName === 'Lê An' && x.dob === '12/05/2008' && x.email === 'an@x.vn'
        && x.target === '6.5' && x.examDate === '05/2027' && x.startWeek === '2026-10-05', `${ten}: ${JSON.stringify(r)}`);
    }
    assert(b.cach.boQua.join(', ') === 'Overall, L, R, W, S, Đã thi tới MT' && b.rows[0].baselineScore === undefined && b.rows[0].daThiToiMt === undefined,
      `lớp thường bỏ qua cột band: ${JSON.stringify(b.cach)}`);
    assert(a.cach.boQua.length === 0 && a.rows[0].baselineScore === '5', 'lớp FT giữ cột band');
    const ngan = intake.parsePaste('An\t\ta@x.vn', { classId: t.classId('MB FOU 12') });
    assert(ngan.rows[0].fullName === 'An' && ngan.rows[0].email === 'a@x.vn', JSON.stringify(ngan.rows));
  });

  check('SL-5 · I2 Tạo Case: không chọn sẵn mức độ (ô bắt buộc), "Chọn nhóm", không hàng nút L R W S giả, Bắt đầu theo dõi chọn theo tuần', () => {
    const q = doc('web/src/modules/cases/QuickReport.tsx');
    assert(!q.includes('DEFAULT_URGENCY') && q.includes("useState('')") && q.includes("khoa: 'muc-do'"), 'mức độ chọn sẵn / không bắt buộc');
    assert(q.includes("'Chọn nhóm'") && !q.includes("'Chọn phân loại'"), 'placeholder Nhóm nguyên nhân');
    assert(!q.includes("['L', 'R', 'W', 'S']"), 'hàng nút giả có W trần');
    assert(/<ChonTuan[^>]*ariaLabel="Bắt đầu theo dõi"/.test(q) && !/<ONgay kieu="ngay"[^>]*setDetectedAt/.test(q), 'Bắt đầu theo dõi phải là bộ chọn tuần');
  });

  check('SL-6 · I3 Thêm học viên: ô dán không monospace, nút Đọc dưới ô dán, cột Overall / ngày sinh đủ rộng, lời nhắc hai dòng', () => {
    const s = doc('web/src/modules/students/IntakePanel.tsx');
    assert(!/font-mono/.test(s), 'ô dán còn font-mono');
    assert(s.indexOf('<textarea') < s.lastIndexOf('Đọc nội dung đã dán') && !s.includes('sm:grid-cols-3'), 'nút Đọc phải nằm dưới ô dán');
    assert(/dob: 116, email: 190, baselineScore: 72/.test(s), 'bề rộng cột');
    assert(s.includes('Em đã có hồ sơ thì dùng Chuyển lớp, không tạo mới.</p>') && !s.includes('(không tính SOS). · Em'), 'lời nhắc hai dòng');
  });

  check('SL-7 · I4: GvCham, hộp 4 tiêu chí, Nhận xét, Xoá vi phạm dùng KhungPanel; StudentDetailPage hết import Modal', () => {
    for (const f of ['web/src/modules/cham/GvCham.tsx', 'web/src/modules/fasttrack/ScoreEntry.tsx', 'web/src/modules/fasttrack/NhanXet.tsx',
      'web/src/modules/yThuc/DeleteViolationConfirm.tsx', 'web/src/modules/students/StudentDetailPage.tsx']) {
      const s = doc(f);
      assert(!/from '..\/..\/ui\/Drawer.tsx'/.test(s) && !/<Modal\b|<ConfirmDialog\b/.test(s), `${f}: còn Modal/ConfirmDialog`);
    }
    for (const f of ['web/src/modules/cham/GvCham.tsx', 'web/src/modules/fasttrack/ScoreEntry.tsx', 'web/src/modules/fasttrack/NhanXet.tsx', 'web/src/modules/yThuc/DeleteViolationConfirm.tsx']) {
      assert(/<KhungPanel\b[^>]*longTrong/.test(doc(f)), `${f}: chưa sang KhungPanel (longTrong — mở được từ trong panel khác)`);
    }
  });

  check('SL-8 · I6 Ghi vi phạm: chú thích "* = bắt buộc" một dòng, không còn "(bắt buộc)" hiện ở ô; "Xem" không inline-flex cao 44 px', () => {
    const s = doc('web/src/modules/yThuc/RecordViolationPanel.tsx');
    assert(s.includes('= bắt buộc</>}') && !/>\s*\(bắt buộc\)/.test(s), 'chú thích dấu *');
    assert(/className="link appearance-none border-0 bg-transparent p-0 align-baseline max-sm:-my-3 max-sm:py-3" aria-expanded=\{xemTrung\}/.test(s), 'nút Xem');
  });

  check('SL-2 · panel Sửa thông tin học viên: không dán Excel; vào từ ⋮ và nút ở tab Học viên; đóng khi đang sửa thì hỏi', () => {
    const pn = doc('web/src/modules/students/SuaCaLopPanel.tsx');
    assert(!/<textarea/.test(pn) && !pn.includes('/intake/parse'), 'không được có ô dán Excel');
    assert(pn.includes('/sua-ca-lop/xem-truoc') && pn.includes('daSua: soEm > 0') && pn.includes('Bỏ những gì vừa sửa?'), 'xem trước + luật S3 + hỏi khi đóng');
    assert(pn.includes('if (busy) return;'), 'đang lưu thì Esc / nền / ✕ không đóng panel (chống mất lưới khi lưu lỗi)');
    assert(doc('web/src/modules/classes/DauTrangLop.tsx').includes("nhan: 'Sửa thông tin học viên'"), 'mục ⋮');
    assert(doc('web/src/modules/classes/TabHocVienLop.tsx').includes('>Sửa thông tin</button>'), 'nút ở tab Học viên');
  });
  check('SL-4 · D11: Truong và Field nối dòng lỗi vào ô bằng aria-describedby (một hook useNoiLoi)', () => {
    assert(/aria-describedby/.test(doc('web/src/ui/loiForm.tsx')), 'useNoiLoi');
    for (const f of ['web/src/ui/KhungPanel.tsx', 'web/src/ui/ui.tsx']) {
      const s = doc(f);
      assert(s.includes('useNoiLoi(loi)') && s.includes('ref={noi.ref}') && s.includes('id={noi.id}'), f);
    }
  });

  const ft = t.classId('MB FT 101');
  const thuong = t.classId('MB FOU 12');
  const QL = P.mbManager.userId, GVCN = P.coreTeacher.userId;
  const get = (sql: string, ...a: unknown[]) => conn.prepare(sql).get(...a) as any;
  const all = (sql: string, ...a: unknown[]) => conn.prepare(sql).all(...a) as any[];
  /* Mỗi em MỘT dòng: lộ trình đang chạy seq lớn nhất — đúng lộ trình máy chủ sửa (em có thể có hai lộ trình đang chạy). */
  const emCua = (lop: number) => [...new Map(all(
    `SELECT s.id AS sid, s.full_name, s.email, cy.id AS cid, cy.route, cy.target_score, rp.week_start AS tuan
       FROM enrollments e JOIN students s ON s.id = e.student_id
       JOIN learning_cycles cy ON cy.student_id = s.id AND cy.status = 'active'
       LEFT JOIN report_periods rp ON rp.id = cy.start_period_id
      WHERE e.class_id = ? AND e.status = 'active' ORDER BY s.id, cy.seq`, lop).map((r) => [r.sid, r] as const)).values()];
  const em = emCua(ft);
  assert(em.length >= 6, `seed: MB FT 101 cần ≥ 6 em, có ${em.length}`);
  const soAudit = (sid: number) => get(`SELECT COUNT(*) n FROM audit_logs WHERE action = 'student.update' AND entity_id = ?`, sid).n as number;
  const ten = (sid: number) => get('SELECT full_name FROM students WHERE id = ?', sid).full_name as string;

  /** Máy chủ thật + phiên demo theo người dùng (mẫu `prCt.tests.ts`). */
  const may = createApp().listen(0);
  const cong = (may.address() as any).port as number;
  const phien = new Map<number, string>();
  const goi = async (userId: number, url: string, body: unknown) => {
    if (!phien.has(userId)) {
      const s = await fetch(`http://127.0.0.1:${cong}/api/demo/session`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ userId }) });
      phien.set(userId, (s.headers.get('set-cookie') ?? '').split(';')[0]);
    }
    const r = await fetch(`http://127.0.0.1:${cong}/api${url}`, { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json', cookie: phien.get(userId)! } });
    return { status: r.status, json: await r.json().catch(() => null) as any };
  };
  const xemTruoc = (u: number, lop: number, body: unknown) => goi(u, `/classes/${lop}/sua-ca-lop/xem-truoc`, body);
  const luu = (u: number, lop: number, body: unknown) => goi(u, `/classes/${lop}/sua-ca-lop`, body);
  let k = 0;
  const khoa = () => `sl-test-${++k}`;

  try {
    await checkAsync('SL-1 (1) · sửa họ tên 2 em + email 1 em → daSua 2, DB đổi đúng, 2 dòng audit student.update', async () => {
      const [a, b] = em;
      const truoc = [soAudit(a.sid), soAudit(b.sid)];
      const r = await luu(QL, ft, { idempotencyKey: khoa(), rows: [
        { studentId: a.sid, fullName: 'SL Một Đổi', email: 'SL.Mot@Demo.test' },
        { studentId: b.sid, fullName: 'SL Hai Đổi' },
      ] });
      assert(r.status === 200 && r.json.daSua === 2, `${r.status} ${JSON.stringify(r.json)}`);
      const sa = get('SELECT full_name, email, normalized_name FROM students WHERE id = ?', a.sid);
      assert(sa.full_name === 'SL Một Đổi' && sa.email === 'sl.mot@demo.test', JSON.stringify(sa));
      assert(ten(b.sid) === 'SL Hai Đổi', ten(b.sid));
      assert(soAudit(a.sid) === truoc[0] + 1 && soAudit(b.sid) === truoc[1] + 1, 'mỗi em đúng một dòng audit student.update');
    });

    await checkAsync('SL-1 (2) · một email sai → xem trước báo lỗi đúng dòng; lưu → 400, không dòng nào được ghi', async () => {
      const [a, b] = [em[2], em[3]];
      const rows = [{ studentId: a.sid, fullName: 'SL Ba Không Ghi' }, { studentId: b.sid, email: 'sai-dang' }];
      const pv = await xemTruoc(QL, ft, { rows });
      assert(pv.status === 200, `${pv.status} ${JSON.stringify(pv.json)}`);
      const dongB = pv.json.rows.find((x: any) => x.studentId === b.sid);
      const dongA = pv.json.rows.find((x: any) => x.studentId === a.sid);
      assert(dongB?.issues.some((i: any) => i.field === 'email' && i.muc === 'loi'), JSON.stringify(pv.json.rows));
      assert(!dongA?.issues.length, 'dòng đúng không có lỗi: ' + JSON.stringify(dongA));
      const tenA = ten(a.sid);
      const r = await luu(QL, ft, { idempotencyKey: khoa(), rows });
      assert(r.status === 400, `${r.status} ${JSON.stringify(r.json)}`);
      assert(ten(a.sid) === tenA, 'dòng đúng KHÔNG được ghi khi lô có lỗi');
    });

    await checkAsync('SL-1 (2b) · lỗi GIỮA giao dịch (dòng 1 đã ghi, dòng 2 hỏng khi ghi) → cả lô cuộn lại: tên + audit dòng 1 như cũ', async () => {
      const [a, b] = [em[0], em[1]];
      const [tenA, auditA] = [ten(a.sid), soAudit(a.sid)];
      /* Qua được bước kiểm, chỉ hỏng lúc ghi: trigger chặn đúng tên dòng 2. */
      conn.exec(`CREATE TRIGGER sl_hong BEFORE UPDATE OF full_name ON students WHEN NEW.full_name = 'SL Hỏng Khi Ghi'
        BEGIN SELECT RAISE(ABORT, 'sl_hong'); END`);
      try {
        const r = await luu(QL, ft, { idempotencyKey: khoa(), rows: [
          { studentId: a.sid, fullName: 'SL Phải Cuộn Lại' }, { studentId: b.sid, fullName: 'SL Hỏng Khi Ghi' },
        ] });
        assert(r.status >= 400, `${r.status} ${JSON.stringify(r.json)}`);
      } finally { conn.exec('DROP TRIGGER sl_hong'); }
      assert(ten(a.sid) === tenA, `dòng 1 phải cuộn lại, đang là "${ten(a.sid)}"`);
      assert(soAudit(a.sid) === auditA, 'audit dòng 1 phải cuộn lại');
    });

    await checkAsync('SL-1 (2c) · mã học viên không phải số → 400 "không hợp lệ" (không báo nhầm "hai dòng")', async () => {
      const r = await luu(QL, ft, { idempotencyKey: khoa(), rows: [{ studentId: 'abc', fullName: 'X' }] });
      assert(r.status === 400 && /không hợp lệ/.test(r.json?.error ?? ''), `${r.status} ${JSON.stringify(r.json)}`);
    });

    await checkAsync('SL-1 (3) · đổi Target thiếu lý do → 400 "Ghi lý do đổi Target."; có lý do → thêm dòng cycle_target_revisions hôm nay', async () => {
      const a = em[4];
      const moi = a.target_score === 7 ? 6.5 : 7;
      const r0 = await luu(QL, ft, { idempotencyKey: khoa(), rows: [{ studentId: a.sid, target: moi }] });
      assert(r0.status === 400 && r0.json.error === 'Ghi lý do đổi Target.', `${r0.status} ${JSON.stringify(r0.json)}`);
      const r1 = await luu(QL, ft, { idempotencyKey: khoa(), lyDoTarget: 'Em tiến bộ nhanh', rows: [{ studentId: a.sid, target: moi }] });
      assert(r1.status === 200 && r1.json.daSua === 1, `${r1.status} ${JSON.stringify(r1.json)}`);
      const rev = get('SELECT * FROM cycle_target_revisions WHERE cycle_id = ? ORDER BY id DESC LIMIT 1', a.cid);
      assert(rev?.new_target === moi && rev.reason === 'Em tiến bộ nhanh' && rev.effective_from === new Date().toISOString().slice(0, 10), JSON.stringify(rev));
      assert(get('SELECT target_score FROM learning_cycles WHERE id = ?', a.cid).target_score === moi, 'target lộ trình');
    });

    await checkAsync('SL-1 (4) · GVCN đổi Target → 403 (câu riêng CHI_QL_DOI_TARGET, không nhắc nút "Đề xuất sửa" mà panel không có), không ghi gì; GVCN đổi họ tên → 200', async () => {
      const a = em[5];
      const tenA = ten(a.sid);
      const tg = get('SELECT target_score FROM learning_cycles WHERE id = ?', a.cid).target_score;
      const r = await luu(GVCN, ft, { idempotencyKey: khoa(), lyDoTarget: 'GVCN tự đổi', rows: [{ studentId: a.sid, fullName: 'SL GVCN Không Ghi', target: tg === 6 ? 6.5 : 6 }] });
      assert(r.status === 403 && r.json.error === CHI_QL_DOI_TARGET && !/Đề xuất sửa/.test(CHI_QL_DOI_TARGET), `${r.status} ${JSON.stringify(r.json)}`);
      assert(ten(a.sid) === tenA, 'lô bị từ chối quyền không ghi họ tên');
      const r2 = await luu(GVCN, ft, { idempotencyKey: khoa(), rows: [{ studentId: a.sid, fullName: 'SL GVCN Sửa Tên' }] });
      assert(r2.status === 200 && ten(a.sid) === 'SL GVCN Sửa Tên', `${r2.status} ${JSON.stringify(r2.json)}`);
    });

    await checkAsync('SL-1 (5) · học viên không thuộc lớp → 400 "Học viên … không thuộc lớp này"', async () => {
      const ngoai = emCua(thuong)[0];
      for (const f of [xemTruoc, luu]) {
        const r = await f(QL, ft, { idempotencyKey: khoa(), rows: [{ studentId: ngoai.sid, fullName: 'SL Ngoài Lớp' }] });
        assert(r.status === 400 && /^Học viên .* không thuộc lớp này/.test(r.json.error), `${r.status} ${JSON.stringify(r.json)}`);
      }
      assert(ten(ngoai.sid) !== 'SL Ngoài Lớp', 'không ghi');
    });

    await checkAsync('SL-1 (6) · đổi tuần bắt đầu → xem trước có canhBaoMt "MT… sẽ dời sang W…" (cùng hàm câu của panel Thông tin HV)', async () => {
      const a = get(`SELECT cy.student_id AS sid, rp.week_start AS tuan FROM learning_cycles cy
          JOIN enrollments e ON e.student_id = cy.student_id AND e.class_id = ? AND e.status = 'active'
          JOIN report_periods rp ON rp.id = cy.start_period_id
         WHERE cy.status = 'active' AND cy.route IS NOT NULL AND EXISTS (SELECT 1 FROM assessment_attempts a
           WHERE a.cycle_id = cy.id AND a.status = 'planned' AND a.plan_source = 'auto' AND NOT ${d.CO_DIEM_SQL('a')}) ORDER BY cy.id LIMIT 1`, ft);
      assert(a, 'seed: cần một em FT có lượt MT tự xếp chưa điểm');
      const moi = t.addDays(a.tuan, 7);
      const pv = await xemTruoc(QL, ft, { rows: [{ studentId: a.sid, startWeek: moi }] });
      assert(pv.status === 200, `${pv.status} ${JSON.stringify(pv.json)}`);
      const cb = pv.json.canhBaoMt.find((x: any) => x.studentId === a.sid);
      assert(cb && /^MT\d.* sẽ dời sang W\d/.test(cb.cau), JSON.stringify(pv.json.canhBaoMt));
      const pv2 = await xemTruoc(QL, ft, { rows: [{ studentId: a.sid, startWeek: a.tuan }] });
      assert(!pv2.json.canhBaoMt.length, 'không đổi tuần thì không cảnh báo');
    });

    await checkAsync('SL-1 (7) · gửi lại cùng idempotencyKey → không ghi lần hai', async () => {
      const a = em[0];
      const key = khoa();
      const r1 = await luu(QL, ft, { idempotencyKey: key, rows: [{ studentId: a.sid, fullName: 'SL Lần Một' }] });
      const n = soAudit(a.sid);
      const r2 = await luu(QL, ft, { idempotencyKey: key, rows: [{ studentId: a.sid, fullName: 'SL Lần Hai' }] });
      assert(r1.status === 200 && r2.status === 200 && r2.json.daSua === r1.json.daSua, `${JSON.stringify(r1.json)} ${JSON.stringify(r2.json)}`);
      assert(ten(a.sid) === 'SL Lần Một' && soAudit(a.sid) === n, 'lần hai không được ghi');
    });

    await checkAsync('SL-1 (8) · điểm đầu vào 9.5 → lỗi "0–9"; 6.5 → lưu nguồn nhập tay', async () => {
      const a = em[1];
      const pv = await xemTruoc(QL, ft, { rows: [{ studentId: a.sid, baseline: 9.5 }] });
      const is = pv.json.rows[0].issues;
      assert(is.some((i: any) => i.field === 'baseline' && i.muc === 'loi' && i.message.includes('0–9')), JSON.stringify(is));
      const r = await luu(QL, ft, { idempotencyKey: khoa(), rows: [{ studentId: a.sid, baseline: 6.5 }] });
      const cy = get('SELECT baseline_score, baseline_source FROM learning_cycles WHERE id = ?', a.cid);
      assert(r.status === 200 && cy.baseline_score === 6.5 && cy.baseline_source === 'manual', `${r.status} ${JSON.stringify(r.json)} ${JSON.stringify(cy)}`);
    });

    await checkAsync('SL-1 (9) · lớp thường theo cotLuoiNhap(true): Target/Dự kiến thi/Tuần bắt đầu nhận; điểm đầu vào → lỗi', async () => {
      const cot = d.cotLuoiNhap(true).map((c) => c.key);
      assert(cot.includes('target') && cot.includes('examDate') && cot.includes('startWeek') && !cot.includes('baselineScore'), cot.join(','));
      const a = emCua(thuong)[0];
      const tuan = t.addDays(a.tuan ?? d.mondayOfDate(t.TODAY), 7);
      const rows = [{ studentId: a.sid, target: 6.5, examDate: '05/2027', startWeek: tuan }];
      const pv = await xemTruoc(QL, thuong, { rows: [...rows, { studentId: emCua(thuong)[1].sid, baseline: 5 }] });
      assert(pv.status === 200 && !pv.json.rows[0].issues.length, JSON.stringify(pv.json));
      assert(pv.json.rows[1].issues.some((i: any) => i.field === 'baseline' && i.muc === 'loi' && i.message === 'Lớp thường không có điểm đầu vào.'), JSON.stringify(pv.json.rows[1]));
      const r = await luu(QL, thuong, { idempotencyKey: khoa(), lyDoTarget: 'Phụ huynh đặt mục tiêu', rows });
      const cy = get('SELECT target_score, exam_month, rp.week_start AS tuan FROM learning_cycles cy LEFT JOIN report_periods rp ON rp.id = cy.start_period_id WHERE cy.id = ?', a.cid);
      assert(r.status === 200 && cy.target_score === 6.5 && cy.exam_month === '2027-05' && cy.tuan === tuan, `${r.status} ${JSON.stringify(r.json)} ${JSON.stringify(cy)}`);
    });

    await checkAsync('SL-2 · GET /classes/:id/sua-ca-lop: mọi em đang học A→Z, giá trị hiện tại; Target khoá với GVCN; GVBM → 403', async () => {
      const doc2 = async (userId: number) => {
        await goi(userId, '/classes/0/sua-ca-lop/xem-truoc', { rows: [] }).catch(() => null);   // tạo phiên
        const r = await fetch(`http://127.0.0.1:${cong}/api/classes/${ft}/sua-ca-lop`, { headers: { cookie: phien.get(userId)! } });
        return { status: r.status, json: await r.json().catch(() => null) as any };
      };
      const ql = await doc2(QL);
      assert(ql.status === 200 && ql.json.coTheSuaTarget === true && ql.json.lopThuong === false, `${ql.status} ${JSON.stringify(ql.json)?.slice(0, 200)}`);
      /* Mọi em ĐANG HỌC, kể cả em chưa có lộ trình (ô lộ trình khoá, `coLoTrinh: false`). */
      const dangHoc = get(`SELECT COUNT(*) n FROM enrollments WHERE class_id = ? AND status = 'active'`, ft).n as number;
      assert(ql.json.rows.length === dangHoc, `số em ${ql.json.rows.length} ≠ ${dangHoc}`);
      assert(ql.json.rows.filter((r: any) => !r.coLoTrinh).length === dangHoc - em.length, 'em chưa có lộ trình phải có coLoTrinh false');
      const ten2 = ql.json.rows.map((r: any) => r.fullName);
      assert(ten2.join('|') === [...ten2].sort((a: string, b: string) => a.localeCompare(b, 'vi')).join('|'), 'A→Z');
      const a = em[4];
      const dong = ql.json.rows.find((r: any) => r.studentId === a.sid);
      const cy = get('SELECT target_score, khong_cam_ket FROM learning_cycles WHERE id = ?', a.cid);
      assert(dong && dong.target === (cy.khong_cam_ket ? 'KCK' : cy.target_score) && dong.fullName === ten(a.sid), JSON.stringify(dong));
      const gv = await doc2(GVCN);
      assert(gv.status === 200 && gv.json.coTheSuaTarget === false, `${gv.status} ${JSON.stringify(gv.json)?.slice(0, 200)}`);
      const bm = await doc2(P.w1Teacher.userId);
      assert(bm.status === 403, `GVBM phải 403, nhận ${bm.status}`);
    });

    await checkAsync('SL-1 · xem trước quá 60 dòng → 400; LƯU quá 10 em một lần → 400 (web chia lô 8 em)', async () => {
      const r = await xemTruoc(QL, ft, { rows: Array.from({ length: 61 }, () => ({ studentId: em[0].sid })) });
      assert(r.status === 400, `${r.status} ${JSON.stringify(r.json)}`);
      const muoiMot = em.slice(0, 11).map((x, i) => ({ studentId: x.sid, fullName: `SL Trần ${i}` }));
      const truoc = ten(em[0].sid);
      const pv = await xemTruoc(QL, ft, { rows: muoiMot });
      assert(pv.status === 200, `xem trước 11 em vẫn được (kiểm cả lớp): ${pv.status}`);
      const l = await luu(QL, ft, { idempotencyKey: khoa(), rows: muoiMot });
      assert(l.status === 400 && /10/.test(l.json?.error ?? ''), `${l.status} ${JSON.stringify(l.json)}`);
      assert(ten(em[0].sid) === truoc, 'quá trần thì không ghi gì');
    });

    check('SL-2b · chia lô: 20 em → 3 lô (8, 8, 4); trần lưu một lần ≥ cỡ lô', () => {
      const lo = d.chiaLo(Array.from({ length: 20 }, (_, i) => i), d.LO_LUU_SUA_CA_LOP);
      assert(JSON.stringify(lo.map((x: number[]) => x.length)) === '[8,8,4]' && lo.flat().join() === Array.from({ length: 20 }, (_, i) => i).join(), JSON.stringify(lo));
      assert(d.LO_LUU_SUA_CA_LOP <= d.TOI_DA_LUU_SUA_CA_LOP, 'cỡ lô web phải ≤ trần máy chủ');
      const pn = doc('web/src/modules/students/SuaCaLopPanel.tsx');
      assert(pn.includes('chiaLo(payload, LO_LUU_SUA_CA_LOP)') && pn.includes('em chưa lưu') && pn.includes('Đang lưu ${tienDo.xong}/${tienDo.tong}…'),
        'panel gửi theo lô, báo lưu dở ở chân panel, hiện tiến độ');
    });

    await checkAsync('SL-2b · lưu theo lô: lô 2 lỗi → lô 1 đã ghi, lô 2–3 không ghi; gửi lại lô 1 cùng khoá → không ghi lần hai', async () => {
      assert(em.length >= 28, `seed: cần ≥ 28 em, có ${em.length}`);
      const nhom = em.slice(8, 28);
      const rows = nhom.map((x, i) => ({ studentId: x.sid, fullName: `SL Lô ${i + 1}` }));
      rows[10] = { ...rows[10], email: 'sai-dang' } as any;          // em thứ 11 → lô 2 hỏng
      const cu = nhom.map((x) => ten(x.sid));
      const lo = d.chiaLo(rows, d.LO_LUU_SUA_CA_LOP);
      assert(lo.length === 3, `20 em phải ra 3 lô, ra ${lo.length}`);
      const k1 = khoa();
      const r1 = await luu(QL, ft, { idempotencyKey: k1, rows: lo[0] });
      assert(r1.status === 200 && r1.json.daSua === 8, `lô 1: ${r1.status} ${JSON.stringify(r1.json)}`);
      const r2 = await luu(QL, ft, { idempotencyKey: khoa(), rows: lo[1] });
      assert(r2.status === 400, `lô 2 phải 400: ${r2.status} ${JSON.stringify(r2.json)}`);
      /* web dừng ở lô hỏng: lô 3 không gửi. */
      nhom.forEach((x, i) => {
        if (i < 8) assert(ten(x.sid) === `SL Lô ${i + 1}`, `lô 1 em ${i + 1} phải đã ghi`);
        else assert(ten(x.sid) === cu[i], `em ${i + 1} (lô ${i < 16 ? 2 : 3}) không được ghi`);
      });
      const audit = soAudit(nhom[0].sid);
      const r1b = await luu(QL, ft, { idempotencyKey: k1, rows: lo[0] });
      assert(r1b.status === 200 && r1b.json.daSua === 8 && soAudit(nhom[0].sid) === audit, 'gửi lại cùng khoá không ghi lần hai');
    });

    await checkAsync('SL-1 (3b) · gửi Target bằng giá trị cũ → không đòi lý do, daSua chỉ đếm em đổi thật', async () => {
      const a = em[5];
      const cy = get('SELECT target_score, khong_cam_ket FROM learning_cycles WHERE id = ?', a.cid);
      const r = await luu(QL, ft, { idempotencyKey: khoa(), rows: [{ studentId: a.sid, target: cy.khong_cam_ket ? 'KCK' : cy.target_score }] });
      assert(r.status === 200 && r.json.daSua === 0, `${r.status} ${JSON.stringify(r.json)}`);
    });
  } finally {
    may.close();
  }
}
