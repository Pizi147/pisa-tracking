/** PHÉP KIỂM PR-UXF-b — mã tuần toàn web + việc sót (kế hoạch 2026-10-01-pr-uxf-b-ma-tuan, nhãn [UXF-b]). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');
const doc = (rel: string) => fs.readFileSync(path.join(REPO, rel), 'utf8');

export async function runPrUxfBTests(t: YThucTestKit) {
  const { check, assert } = t;
  const d: any = await import('../../../shared/domain/index.ts');
  console.log('\nPR-UXF-b · Mã tuần toàn web + việc sót');

  // ------------------------------------------------------------------ Task 1 · ô chọn tuần, bộ chọn tuần
  check('UXF-b (1) · docTuanLich: đi-về với tuanLich cho mọi Thứ Hai 2026-01-05 → 2027-12-27 (hôm nay 14/09/2026 và 11/01/2027); mã sai → null', () => {
    for (const h of ['2026-09-14', '2027-01-11']) {
      for (let t2 = '2026-01-05'; t2 <= '2027-12-27'; t2 = new Date(Date.parse(`${t2}T00:00:00Z`) + 7 * 86_400_000).toISOString().slice(0, 10)) {
        const ma = d.tuanLich(t2, h);
        assert(d.docTuanLich(ma, h) === t2, `${h}: ${ma} → ${d.docTuanLich(ma, h)} (cần ${t2})`);
      }
    }
    assert(d.docTuanLich('W9 SEP', '2026-09-14') === null, 'W9 SEP');
    assert(d.docTuanLich('W5 SEP', '2026-09-14') === null, 'tháng 9/2026 chỉ có 4 tuần');
    assert(d.docTuanLich('W4 ABC', '2026-09-14') === null, 'W4 ABC');
    assert(d.docTuanLich('abc', '2026-09-14') === null && d.docTuanLich('', '2026-09-14') === null, 'rỗng / lạ');
    assert(d.docTuanLich(' w4 sep ', '2026-09-14') === '2026-09-21', 'chữ thường + khoảng trắng');
  });

  check('UXF-b (1) · ô tuần: ô hiện mã tuần, dòng phụ là khoảng ngày; gõ "W4 SEP" và gõ một ngày trong tuần đều nhận; lỗi nói mã tuần', () => {
    const H = '2026-09-14';
    assert(d.hienONgay('2026-08-24', 'tuan', H) === 'W4 AUG', d.hienONgay('2026-08-24', 'tuan', H));
    assert(d.phuONgay('2026-08-24', 'tuan', H) === '24/08 – 30/08', d.phuONgay('2026-08-24', 'tuan', H));
    assert(d.hienONgay('2026-09-28', 'ngay', H) === '28/09/2026' && d.hienONgay('2026-10', 'thang', H) === '10/2026', 'kiểu khác giữ nguyên');
    assert(d.docONgay('W4 SEP', 'tuan', H).iso === '2026-09-21', 'W4 SEP');
    assert(d.docONgay('23/09', 'tuan', H).iso === '2026-09-21', 'gõ ngày vẫn nhận');
    assert(d.docONgay('W4 SEP', 'tuan', H, { moc: 'cuoi' }).iso === '2026-09-27', 'moc=cuoi vẫn ra Chủ nhật');
    const sai = d.docONgay('abc', 'tuan', H);
    assert(sai.iso === null && /W4 SEP/.test(sai.loi), String(sai.loi));
    const truoc = d.docONgay('W1 SEP', 'tuan', H, { toiThieu: '2026-09-14' });
    assert(truoc.loi === 'Không được trước W3 SEP', String(truoc.loi));
    assert(d.docONgay('W4 SEP', 'tuan', H, { toiDa: '2026-09-14' }).loi === 'Không được sau W3 SEP', 'toiDa');
    const c = d.chotONgay('W4 SEP', '2026-09-14', 'tuan', H);
    assert(c.phat === '2026-09-21' && c.text === 'W4 SEP', JSON.stringify(c));
    assert(d.chotONgay('W3 SEP', '2026-09-14', 'tuan', H).phat === null, 'chữ chưa sửa không báo lại');
  });

  check('UXF-b (1) · quét chữ: bộ chọn tuần không còn bộ định dạng ngày tự viết; ba hàm định dạng thừa đã xoá; ONgay truyền homNay', () => {
    const fl = doc('web/src/ui/Filters.tsx');
    assert(!/\brangeOf\b/.test(fl) && !/const dm = /.test(fl), 'Filters.tsx còn dm/rangeOf');
    assert(!/\bdm\(/.test(doc('web/src/modules/test/keHoach/TuanNho.tsx')) && !/const dm = /.test(doc('web/src/modules/test/keHoach/TuanNho.tsx')), 'TuanNho còn dm');
    assert(!/weekCodeShortOf/.test(doc('shared/domain/week.ts')), 'weekCodeShortOf');
    const u = doc('server/src/util.ts');
    assert(!/function weekLabel|formatDateVi/.test(u), 'weekLabel/formatDateVi');
    assert(/hienONgay\(value, kieu, homNay\)/.test(doc('web/src/ui/ONgay.tsx')), 'ONgay truyền homNay');
    assert(/W4 SEP hoặc dd\/mm/.test(doc('web/src/ui/ONgay.tsx')), 'placeholder ô tuần');
  });

  // ------------------------------------------------------------------ Task 2 · hồ sơ lớp, dải chuyển lớp, thẻ Lịch thi, lịch MT
  const yc: any = await import('../duyet/yeuCau.ts');
  check('UXF-b (2) · U5: thẻ Lịch thi (Chờ duyệt) nói "đề nghị W…" / "thi tuần W…", năm hiện tại không có "2026"', () => {
    const the = yc.hopChoDuyet(t.P.mbManager).the.filter((x: any) => x.loai === 'lich_thi' && /đề nghị W/.test(x.dong[0] ?? ''));
    assert(the.length > 0, 'seed không có thẻ Lịch thi chờ có tuần đề nghị');
    for (const x of the) {
      assert(/đề nghị W\d [A-Z]{3}(?! \d)/.test(x.dong[0]), x.dong[0]);
      assert(!x.neuDuyet || /thi tuần W\d [A-Z]{3}\.$/.test(x.neuDuyet), String(x.neuDuyet));
    }
  });
  check('UXF-b (2) · quét chữ: hồ sơ lớp, dải Sắp chuyển, lịch MT, panel Tạm dừng nói mã tuần', () => {
    assert(!/ngày \{ngay\(dai\.ngayRaLenh/.test(doc('web/src/modules/classes/DaiChuyenLop.tsx')), 'R5-1: dải Sắp chuyển còn "ngày dd/mm"');
    assert(!/ngay\(data\.startWeekStart/.test(doc('web/src/modules/classes/ClassProgressPanel.tsx')), 'Khai giảng còn ngày');
    const dt = doc('web/src/modules/classes/DauTrangLop.tsx');
    assert(!/ngay\(data\.finishedAt/.test(dt) && /tuanLich\(data\.finishedAt/.test(dt), 'Lớp đã kết thúc');
    const ta = doc('web/src/modules/classes/TeacherAssignPanel.tsx');
    assert(!/ngay\(h\.from/.test(ta) && /tuanLich\(h\.from/.test(ta), 'Đã từng dạy');
    const kh = doc('web/src/modules/students/StudentPlanPanel.tsx');
    assert(!/fmtDate\(r\.weekStart\)/.test(kh) && !/\{r\.code\}/.test(kh), 'lịch MT còn .code / dd/mm/yyyy');
    assert(!/kết thúc \{cycle\.endWeek\.code\}/.test(doc('web/src/modules/students/StudentManagePanel.tsx')), 'panel Tạm dừng in mã tuần có năm');
  });

  // ------------------------------------------------------------------ Task 3 · Case và PA nói mã tuần
  const casesSvc: any = await import('../cases/cases.ts');
  check('UXF-b (3) · mocChuPa: PA 1 tháng nói MÃ TUẦN (18/10 → W3 OCT); đến lúc thi và Mini Test giữ NGÀY', () => {
    const H = '2026-09-14';
    assert(d.mocChuPa({ span: 'one_month', followupDue: '2026-10-18', mtKe: null, daXacNhan: true }, H) === '1 tháng · đến W3 OCT', d.mocChuPa({ span: 'one_month', followupDue: '2026-10-18', mtKe: null, daXacNhan: true }, H));
    assert(d.mocChuPa({ span: 'until_exam', followupDue: '2026-11-20', mtKe: null, daXacNhan: true }, H) === 'đến lúc thi · đến 20/11', 'đến lúc thi giữ ngày thi');
    assert(d.mocChuPa({ span: 'mini_test', followupDue: '2026-10-02', mtKe: null, daXacNhan: true }, H) === 'đến Mini Test · 02/10', 'Mini Test giữ ngày');
    assert(d.mocChuPa({ span: 'one_month', followupDue: null, mtKe: null, daXacNhan: false }, H) === '1 tháng', 'chưa xác nhận');
  });
  check('UXF-b (3) · nhập bù trùng khoảng: lỗi máy chủ nói MÃ TUẦN (W1 SEP → W3 SEP), không in ngày ISO thô', () => {
    const sv = t.conn.prepare(`SELECT student_id FROM enrollments WHERE class_id = ? AND status = 'active' LIMIT 1`).get(t.classId('MB FT 101')) as any;
    const cyc = t.conn.prepare(`SELECT id FROM learning_cycles WHERE student_id = ? AND status = 'active' LIMIT 1`).get(sv.student_id) as any;
    const topic = d.ENTRY_SKILLS[0];
    const ca = (tieuDe: string, tu: string, den: string) => ({
      studentId: sv.student_id, cycleId: cyc?.id, topic, primaryCode: d.issuesForTopic(topic)[0].code, title: `${topic}: ${tieuDe}`, summary: 'Case nhập bù để kiểm chữ lỗi trùng khoảng.',
      fromDate: tu, toDate: den, actions: [{ ketQua: 'improved', description: 'Ôn bài với em', performerName: 'GV bộ môn', fromDate: tu, toDate: den }],
      outcome: 'improved', note: 'Nhập bù UXF-b (3).',
    });
    casesSvc.backfillCase(t.P.mbManager, ca('lần 1', '2026-09-01', '2026-09-14'));
    let loi = '';
    try { casesSvc.backfillCase(t.P.mbManager, ca('lần 2 (trùng)', '2026-09-05', '2026-09-12')); } catch (e: any) { loi = e.message; }
    assert(/trùng khoảng W1 SEP → W3 SEP/.test(loi), loi);
    assert(!/2026-09/.test(loi), loi);
  });
  check('UXF-b (3) · quét chữ: Ngăn Case, Báo vấn đề, Mở Case SOS / Thêm PA nói mã tuần; hai chữ ngày không ai vẽ đã xoá', () => {
    const cp = doc('web/src/modules/cases/CasePanel.tsx');
    assert(/chuKhoangPa\(/.test(cp) && !/kết thúc theo dõi \{ngan\(/.test(cp) && !/const tu = /.test(cp), 'CasePanel: khoảng PA / kết thúc theo dõi');
    assert(!/mở \{ngan\(/.test(doc('web/src/modules/students/NganCase.tsx')), 'NganCase còn "mở dd/mm"');
    const qr = doc('web/src/modules/cases/QuickReport.tsx');
    assert(!/\{ngan\(bfDup\./.test(qr) && !/Mở \{ngan\(dup\./.test(qr), 'QuickReport còn ngày');
    const cs = doc('web/src/modules/yThuc/CaseSosControls.tsx');
    assert(!/Hôm nay · \{ngay\(homNay\)\}/.test(cs) && !/hôm nay \(\{ngay\(homNay\)\}\)/.test(cs), 'CaseSosControls còn "hôm nay · dd/mm"');
    assert(!/supportLineOf|supportLine\b/.test(doc('server/src/cases/cases.ts') + doc('web/src/modules/cases/SkillBoard.tsx')), 'supportLine còn');
    assert(!/scheduleHeadline/.test(doc('server/src/fasttrack/attempts.ts')), 'scheduleHeadline còn');
  });

  // ------------------------------------------------------------------ Task 4 · Phân tích, nhập điểm, Target đã đổi
  check('UXF-b (4) · quét chữ: Target đã đổi, hạn ô nhập điểm FT, trang mẫu nói mã tuần', () => {
    assert(/tuanLich\(cy\.targetRevisions\[0\]\.effectiveFrom/.test(doc('web/src/modules/students/StudentDetailPage.tsx')), 'Target đã đổi: lần gần nhất');
    const se = doc('web/src/modules/fasttrack/ScoreEntry.tsx');
    assert(!/Thi \$\{cell\.weekRange/.test(se) && /tuanLich\(cell\.weekStart/.test(se), 'ô nhập điểm FT còn khoảng ngày');
    assert(!/14\/09 – 20\/09/.test(doc('web/src/modules/dev/ThanhPhanDemo.tsx')), 'trang mẫu còn khoảng ngày');
  });

  // ------------------------------------------------------------------ Task 5 · một đường tới lượt Test (G5) + neo Kết luận khoá
  const attemptsSvc: any = await import('../fasttrack/attempts.ts');
  const metricsSvc: any = await import('../worklist/metrics.ts');
  const myworkSvc: any = await import('../worklist/mywork.ts');
  const MB = (t.conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as any).id;
  check('UXF-b (5) · attemptHref (máy chủ) = duongDotTest với mọi mẫu (mock · progress có lớp · final không lớp · final có lớp)', () => {
    for (const a of [{ id: 1 }, { id: 2, kind: 'mock' }, { id: 3, kind: 'progress', classId: 7 }, { id: 4, kind: 'final', classId: null }, { id: 5, kind: 'final', classId: 9 }]) {
      assert(attemptsSvc.attemptHref(a) === d.duongDotTest(a), `${JSON.stringify(a)}: ${attemptsSvc.attemptHref(a)} ≠ ${d.duongDotTest(a)}`);
    }
  });
  check('UXF-b (5) · quét chuỗi: không nơi nào tự ghép "/mock-test/${…}" hay "/bang-diem-thuong/${…}?kind=" (chỉ duongHoSo.ts, route App.tsx, và lối vào bảng điểm cả lớp thaoTacDongHocVien.tsx — không có id lượt)', () => {
    const co: string[] = [];
    const quet = (dir: string) => {
      for (const e of fs.readdirSync(path.join(REPO, dir), { withFileTypes: true })) {
        const rel = `${dir}/${e.name}`;
        if (e.isDirectory()) { if (e.name !== 'tests' && e.name !== 'node_modules') quet(rel); continue; }
        if (!/\.tsx?$/.test(e.name) || ['App.tsx', 'thaoTacDongHocVien.tsx'].includes(e.name) || rel.endsWith('shared/domain/duongHoSo.ts')) continue;
        const s = doc(rel);
        if (/\/mock-test\/\$\{/.test(s) || /\/bang-diem-thuong\/\$\{[^}]*\}\?kind=/.test(s)) co.push(rel);
      }
    };
    for (const dir of ['web/src', 'server/src', 'shared']) quet(dir);
    assert(co.length === 0, `còn tự ghép: ${co.join(', ')}`);
  });
  check('UXF-b (5) · dòng "bài quá hạn nhập điểm" (Cần xử lý): lượt FT mở hồ sơ Mock kèm ?kn= đúng kỹ năng của ô; lớp thường bỏ kn', () => {
    const o = metricsSvc.metricSet(t.P.mbManager, 'bai-qua-han-nhap-diem', { branchId: MB });
    const rows = metricsSvc.rowsFor('bai', o.ids);
    assert(rows.length > 0, 'seed không có bài quá hạn');
    for (const r of rows) {
      const { attemptId, skill } = d.tachBaiId(r.id);
      const a = t.conn.prepare('SELECT kind, class_id FROM assessment_attempts WHERE id = ?').get(attemptId) as any;
      const muon = d.duongDotTest({ id: attemptId, kind: a.kind, classId: a.class_id }, skill);
      assert(r.href === muon, `${r.href} ≠ ${muon}`);
      if (a.kind === 'mock') assert(/\?kn=(listening|reading|writing1|writing2|speaking)$/.test(r.href), r.href);
      else assert(!/kn=/.test(r.href), r.href);
    }
  });
  check('UXF-b (5) · duongHoSoHocVien/docThamSoHoSo: muc=ket-luan-khoa đi-về; muc lạ bị bỏ', () => {
    assert(d.duongHoSoHocVien(5, { muc: 'ket-luan-khoa' }) === '/hoc-vien/5?muc=ket-luan-khoa', d.duongHoSoHocVien(5, { muc: 'ket-luan-khoa' }));
    const url = d.duongHoSoHocVien(5, { loTrinh: 4, muc: 'ket-luan-khoa' });
    assert(/lo-trinh=4/.test(url) && /muc=ket-luan-khoa/.test(url), url);
    const q = new URLSearchParams(url.split('?')[1]);
    assert(d.docThamSoHoSo((k: string) => q.get(k)).muc === 'ket-luan-khoa', 'đọc lại');
    assert(d.docThamSoHoSo((k: string) => (k === 'muc' ? 'xyz' : null)).muc === undefined, 'muc lạ');
  });
  check('UXF-b (5) → PR-KV · việc "Kỳ vọng đầu ra · lớp" (QL): href mở panel ở trang lớp nguồn (?viec=ky-vong) — không còn mở hồ sơ từng em', () => {
    const items = (myworkSvc.myWork(t.P.mbManager, {}) as any).items.filter((x: any) => x.group === 'ky_vong_dau_ra');
    for (const x of items) assert(x.href === `/hoc-vien/lop/${x.classId}?viec=ky-vong`, x.href);
  });
  check('UXF-b (5) · mốc MT trong lịch sử Case: có đường tới đợt qua duongDotTest', () => {
    const m = t.conn.prepare('SELECT case_id FROM case_milestones WHERE attempt_id IS NOT NULL LIMIT 1').get() as any;
    assert(m, 'seed không có mốc MT');
    const ms = (casesSvc.milestonesOf(m.case_id) as any[]).filter((x) => x.attemptId);
    for (const x of ms) {
      const a = t.conn.prepare('SELECT kind, class_id FROM assessment_attempts WHERE id = ?').get(x.attemptId) as any;
      assert(x.href === d.duongDotTest({ id: x.attemptId, kind: a.kind, classId: a.class_id }), `${x.href}`);
    }
  });
  check('UXF-b (5) · PHỦ ĐỊNH: người ngoài phạm vi vẫn không mở được lượt của lớp khác (kn chỉ là chỗ cuộn, không đổi quyền)', () => {
    const a = t.conn.prepare(`SELECT a.id FROM assessment_attempts a JOIN classes c ON c.id = a.class_id JOIN branches b ON b.id = c.branch_id WHERE b.code = 'MB' AND a.kind = 'mock' LIMIT 1`).get() as any;
    t.assertThrows(() => attemptsSvc.attemptDetail(t.P.cpManager, a.id), /phạm vi/, 'QL CP mở lượt MT của MB');
  });
  check('UXF-b (5) · quét chữ: lưới chấm, một kỹ năng, chip Lịch Test, Kết quả gần nhất, hồ sơ HV (muc + id) dùng đường chung', () => {
    assert(/duongDotTest\(/.test(doc('web/src/modules/cham/LuoiFT.tsx')), 'LuoiFT');
    assert(/duongDotTest\(\{ id: row\.attemptId \}, k\)/.test(doc('web/src/modules/cham/MotKyNang.tsx')), 'MotKyNang (kn)');
    // PR-MTb T9 thay: ô FT của lưới Kế hoạch Test là Ô MT mở hộp một đợt (không còn liên kết thẳng tới hồ sơ Mock); ChipKyNang chỉ còn lớp thường.
    assert(/duongDotTest\(/.test(doc('web/src/modules/students/BangHocVienLop.tsx')), 'Kết quả gần nhất');
    assert(/duongDotTest\(/.test(doc('web/src/modules/cases/CasePanel.tsx')) || /m\.href/.test(doc('web/src/modules/cases/CasePanel.tsx')), 'lịch sử Case');
    assert(/p\.muc === 'ket-luan-khoa'/.test(doc('web/src/modules/students/StudentDetailPage.tsx')), 'StudentDetailPage đọc muc');
    assert(/id="ket-luan-khoa"/.test(doc('web/src/modules/students/KetLuanKhoa.tsx')), 'KetLuanKhoa thiếu id');
  });

  // ------------------------------------------------------------------ Task 6 · bảng kỹ năng: Xin ý kiến ở hàng PA, ô Học thuật em Tạm dừng
  const duyetSvc: any = await import('../duyet/yeuCau.ts');
  const paBang = (p: any, sid: number) => (casesSvc.skillSupportBoard(p, sid).rows as any[]).flatMap((r) => r.cases).flatMap((c: any) => c.plans ?? []);
  check('UXF-b (6) · O1: PA có thẻ Xin ý kiến chờ → plans[].xinYKien.trangThai "cho"; đã trả lời → "da_tra_loi" + traLoi; PA không có thẻ → null', () => {
    const the = t.conn.prepare(`SELECT y.id, y.doi_tuong_id AS pa, sc.student_id AS sid FROM yeu_cau_duyet y JOIN case_interventions iv ON iv.id = y.doi_tuong_id JOIN sos_cases sc ON sc.id = iv.case_id
      WHERE y.loai = 'xin_y_kien' AND y.trang_thai = 'cho' LIMIT 1`).get() as any;
    assert(the, 'seed không có thẻ Xin ý kiến chờ');
    const cho = paBang(t.P.mbManager, the.sid).find((x: any) => x.id === the.pa);
    assert(cho?.xinYKien?.trangThai === 'cho', JSON.stringify(cho?.xinYKien));
    assert(paBang(t.P.mbManager, the.sid).filter((x: any) => x.id !== the.pa).every((x: any) => x.xinYKien === null || x.xinYKien === undefined || x.xinYKien.doiTuongId === x.id), 'PA khác không mượn thẻ');
    duyetSvc.traLoiYeuCau(t.P.mbManager, the.id, 'Xếp tutor thứ Tư, tôi báo tổ');
    const xong = paBang(t.P.mbManager, the.sid).find((x: any) => x.id === the.pa);
    assert(xong?.xinYKien?.trangThai === 'da_tra_loi' && xong.xinYKien.traLoi === 'Xếp tutor thứ Tư, tôi báo tổ', JSON.stringify(xong?.xinYKien));
  });
  check('UXF-b (6) · PHỦ ĐỊNH: người ngoài phạm vi không đọc được bảng kỹ năng (nên không nhận xinYKien)', () => {
    const sid = (t.conn.prepare(`SELECT sc.student_id sid FROM yeu_cau_duyet y JOIN case_interventions iv ON iv.id = y.doi_tuong_id JOIN sos_cases sc ON sc.id = iv.case_id WHERE y.loai = 'xin_y_kien' LIMIT 1`).get() as any).sid;
    let nem = false; try { casesSvc.skillSupportBoard(t.P.cpManager, sid); } catch { nem = true; }
    assert(nem, 'QL chi nhánh khác phải bị chặn');
  });
  check('UXF-b (6) · Q13 oHocThuat: em Tạm dừng → mọi dòng có hạn (Quá hạn VÀ Cần làm) là "Tạm dừng từ dd/mm"; Chờ duyệt / Đang làm giữ; không Tạm dừng → như cũ', () => {
    const hang = (tt: string) => [{ short: 'R', label: 'Reading', category: 'reading', missed: true,
      cases: [{ status: 'open', trangThaiV4: { t: tt }, viecTiep: { chu: 'Xác nhận PA' }, plans: [] }] }];
    const dung = (tt: string) => d.oHocThuat(hang(tt), '2026-09-10', '2026-09-14').dong[0];
    for (const tt of ['can-lam', 'qua-han']) assert(dung(tt).t === 'tam-dung' && dung(tt).nhan === 'Tạm dừng từ 10/09', `${tt}: ${JSON.stringify(dung(tt))}`);
    for (const tt of ['cho-duyet', 'dang-lam']) assert(dung(tt).t === tt, `${tt}: ${dung(tt).t}`);
    assert(d.oHocThuat(hang('can-lam')).dong[0].t === 'can-lam', 'không Tạm dừng → Cần làm');
  });
  check('UXF-b (6) · quét chữ: DongXinYKien dùng ở Ngăn Case, hàng PA (bảng kỹ năng) và thẻ PA; không còn chữ "Quản lý hạn" (PR-CT2 bỏ hạn duyệt kế hoạch)', () => {
    assert(/<DongXinYKien/.test(doc('web/src/modules/cases/CasePanel.tsx')), 'CasePanel');
    assert(/<DongXinYKien/.test(doc('web/src/modules/cases/SkillBoard.tsx')), 'HangPA');
    assert(/<DongXinYKien/.test(doc('web/src/modules/cases/TheKyNang.tsx')), 'KhoiPa');
    assert(!/Quản lý hạn /.test(doc('web/src/modules/cases/SkillBoard.tsx')), 'R5-3');
  });

  // ------------------------------------------------------------------ Task 7 · panel Tạm dừng đếm vi phạm (O2) + em sau khi Quản lý từ chối (VN26)
  const profileSvc: any = await import('../students/profile.ts');
  const ytTrangThai: any = await import('../yThuc/trangThai.ts');
  const ytBoard: any = await import('../yThuc/board.ts');
  check('UXF-b (7) · O2: hồ sơ trả soViPhamMo = số vi phạm còn mở của trangThaiYThuc (cùng nguồn với ô Ý thức); em không vi phạm → 0', () => {
    const ids = (t.conn.prepare('SELECT DISTINCT student_id AS id FROM violations LIMIT 25').all() as any[]).map((r) => r.id as number);
    assert(ids.length > 0, 'seed không có vi phạm');
    let max = 0;
    for (const id of ids) {
      const em = ytTrangThai.trangThaiYThuc([id], t.TODAY).get(id);
      const n = [...em.viPham.values()].filter((x: any) => x.t !== 'da_xu_ly').length;
      const h = profileSvc.studentProfile(t.P.admin, id).dauHoSo;
      assert(h.soViPhamMo === n, `HV ${id}: hồ sơ ${h.soViPhamMo} ≠ ${n}`);
      const m = /(\d+) vi phạm mở/.exec(h.o.yThuc.phu ?? '');
      if (m) assert(+m[1] === n, `HV ${id}: ô Ý thức "${h.o.yThuc.phu}" ≠ ${n}`);
      max = Math.max(max, n);
    }
    assert(max >= 2, `demo phải có em ≥ 2 vi phạm mở (cao nhất ${max})`);
    const khong = t.conn.prepare('SELECT s.id FROM students s WHERE NOT EXISTS (SELECT 1 FROM violations v WHERE v.student_id = s.id) LIMIT 1').get() as any;
    assert(profileSvc.studentProfile(t.P.admin, khong.id).dauHoSo.soViPhamMo === 0, 'em không vi phạm');
  });
  check('UXF-b (7) · VN26: dongEm.tuChoi = biện pháp Quản lý đã từ chối mà vi phạm còn mở; em vào bắt buộc vì ≥ 3 vi phạm → null', () => {
    const duc = t.conn.prepare(`SELECT id FROM students WHERE full_name = 'Kiều Minh Đức'`).get() as any;
    const emDuc = ytTrangThai.trangThaiYThuc([duc.id], t.TODAY).get(duc.id);
    const dd = ytBoard.dongEm(emDuc, 'Kiều Minh Đức', 'x', t.TODAY);
    assert(/^Đình chỉ/.test(dd.tuChoi?.nhan ?? ''), JSON.stringify(dd.tuChoi));
    const hv = (t.conn.prepare('SELECT DISTINCT student_id AS id FROM violations').all() as any[]).map((r) => r.id as number);
    const trang = ytTrangThai.trangThaiYThuc(hv, t.TODAY);
    let khong = 0;
    for (const id of hv) {
      const em = trang.get(id); const x = ytBoard.dongEm(em, 'a', 'b', t.TODAY);
      const coTuChoi = em.xuLy.some((m: any) => m.status === 'tu_choi');
      if (!coTuChoi) { assert(x.tuChoi === null, `HV ${id}: không có lần từ chối mà tuChoi ≠ null`); khong += 1; }
    }
    assert(khong > 0, 'phải có em không bị từ chối để kiểm vế null');
  });
  check('UXF-b (7) · quét chữ: panel Tạm dừng có câu "n vi phạm Ý thức đang chờ xử lý"; dòng em Ý thức nhánh tuChoi không in "vi phạm / 2 tuần"', () => {
    assert(/vi phạm Ý thức đang chờ xử lý/.test(doc('web/src/modules/students/StudentManagePanel.tsx')) && /soViPhamMo=\{data\.dauHoSo\?\.soViPhamMo\}/.test(doc('web/src/modules/students/StudentDetailPage.tsx')), 'O2');
    const cy = doc('web/src/modules/yThuc/ClassYThucCard.tsx');
    const nhanh = cy.slice(cy.indexOf('x.tuChoi ?'), cy.indexOf('x.soBatBuoc > 0'));
    assert(nhanh.includes('chọn cách xử lý khác') && !/vi phạm \/ 2 tuần/.test(nhanh), 'VN26');
  });

  // ------------------------------------------------------------------ Task 8 · chữ nhỏ: lý do nhiều dòng (VN01), "hạn hết T2" (VN28)
  check('UXF-b (8) · VN28: ô Việc tiếp theo giữ đủ tiền tố "hạn" — PA hạn 14/09 → "hạn 14/09" (OV-12a); boTienTo đã xoá', () => {
    const v = d.viecTiepCuaEm({
      nhapDiem: null,
      cases: [{ caseId: 2, topic: 'listening', viecTiep: { chu: 'Kết quả PA Nghe podcast', loaiHan: 'cap-nhat-pa', han: '2026-09-14', paId: 9 } }],
      yThuc: null, homNay: '2026-09-14',
    });
    assert(v[0]?.han === 'hạn 14/09', JSON.stringify(v[0]));   // OV-12a: hạn hết Thứ Ba
    assert(!/boTienTo/.test(doc('shared/domain/hocVienLop.ts')), 'boTienTo còn');
  });
  check('UXF-b (8) · VN01: lý do thẻ Chờ duyệt vẽ từng dòng của yc.dong với whitespace-pre-line (xuống dòng "Bổ sung dd/mm: …")', () => {
    assert(/yc\.dong\.map\(\(d, i\) => <p key=\{i\} className="m-0 whitespace-pre-line">/.test(doc('web/src/modules/duyet/TheYeuCau.tsx')), 'TheYeuCau');
  });

  // ------------------------------------------------------------------ Task 9 · Báo phụ huynh qua TVV theo CASE, không theo môn trượt (R5-4, Câu 2 = A)
  const phoiHopSvc: any = await import('../yThuc/phoiHop.ts');
  const sosAutoSvc: any = await import('../cases/sosAuto.ts');
  check('UXF-b (9) · R5-4: bài Progress Test 2 môn trượt + 2 Case → MỘT việc Báo PH; Case G+V "Không cần theo dõi" → việc còn, "môn khó khăn" chỉ còn môn kia; cả hai → việc chưa làm tự rút; mở lại → hồi; việc đã làm không đụng; chạy lặp không nhân đôi', () => {
    const bai = t.conn.prepare(`SELECT a.id, a.student_id AS sid FROM assessment_attempts a JOIN sos_coordination_actions co ON co.attempt_id = a.id AND co.kind = 'bao_ph_tvv' AND co.status = 'pending'
      WHERE a.kind = 'progress' AND (SELECT COUNT(DISTINCT cs.skill) FROM case_signals cs WHERE cs.attempt_id = a.id AND cs.status != 'withdrawn' AND cs.case_id IS NOT NULL) >= 2 LIMIT 1`).get() as any;
    assert(bai, 'seed không có bài Progress Test 2 môn trượt có Báo PH');
    const sig = t.conn.prepare(`SELECT skill, case_id FROM case_signals WHERE attempt_id = ? AND status != 'withdrawn' AND case_id IS NOT NULL ORDER BY id`).all(bai.id) as any[];
    const [s1, s2] = [sig[0], sig.find((x) => x.skill !== sig[0].skill)];
    const viec = () => t.conn.prepare(`SELECT id, status, remove_reason_code FROM sos_coordination_actions WHERE attempt_id = ? AND kind = 'bao_ph_tvv'`).all(bai.id) as any[];
    const monKho = () => {
      const lt = phoiHopSvc.coordinationOfStudent(t.P.admin, bai.sid).rows.find((x: any) => x.attemptId === bai.id);
      const nd = lt.actions.find((x: any) => x.kind === 'bao_ph_tvv')?.noiDung as string[] | null;
      return String(nd?.[1] ?? '');
    };
    const ten = (s: string) => d.tenMonNgan(t.conn.prepare('SELECT c.programme_code ct FROM assessment_attempts a JOIN classes c ON c.id = a.class_id WHERE a.id = ?').get(bai.id).ct, s);
    assert(viec().length === 1 && viec()[0].status === 'pending', 'một việc chờ');
    assert(monKho().includes(ten(s1.skill)) && monKho().includes(ten(s2.skill)), `hai môn: ${monKho()}`);
    const dongY = (caseId: number) => sosAutoSvc.apDungKhongTheoDoi(t.conn, { doi_tuong_id: caseId, du_lieu: null, ly_do: 'UXF-b (9)' }, t.P.mbManager.userId);
    dongY(s1.case_id);
    assert(viec().length === 1 && viec()[0].status === 'pending', 'còn việc (môn kia)');
    assert(!monKho().includes(ten(s1.skill)) && monKho().includes(ten(s2.skill)), `môn khó khăn chỉ còn môn kia: ${monKho()}`);
    phoiHopSvc.dongBoBaoPhCuaBai(bai.id); phoiHopSvc.dongBoBaoPhCuaBai(bai.id);
    assert(viec().length === 1, 'chạy lặp không sinh dòng thứ hai');
    dongY(s2.case_id);
    assert(viec().length === 1 && viec()[0].status === 'removed' && viec()[0].remove_reason_code === 'system_sos_changed', JSON.stringify(viec()));
    t.conn.prepare(`UPDATE sos_cases SET status = 'in_progress', dismiss_reason_code = NULL, closed_at = NULL WHERE id = ?`).run(s2.case_id);
    phoiHopSvc.dongBoBaoPhCuaBai(bai.id);
    assert(viec().length === 1 && viec()[0].status === 'pending', `mở lại → hồi: ${JSON.stringify(viec())}`);
    assert(monKho().includes(ten(s2.skill)) && !monKho().includes(ten(s1.skill)), `sau hồi: ${monKho()}`);
  });
  check('UXF-b (9) · R5-4 phủ định: việc Báo PH ĐÃ LÀM (done) không bao giờ bị đụng khi Case đổi trạng thái; Case xong (không phải "Không cần theo dõi") vẫn tính', () => {
    const bai = t.conn.prepare(`SELECT a.id FROM assessment_attempts a JOIN sos_coordination_actions co ON co.attempt_id = a.id AND co.kind = 'bao_ph_tvv' AND co.status = 'done' WHERE a.kind = 'progress' LIMIT 1`).get() as any;
    assert(bai, 'seed không có việc Báo PH đã làm');
    const cs = t.conn.prepare(`SELECT case_id FROM case_signals WHERE attempt_id = ? AND case_id IS NOT NULL LIMIT 1`).get(bai.id) as any;
    sosAutoSvc.apDungKhongTheoDoi(t.conn, { doi_tuong_id: cs.case_id, du_lieu: null, ly_do: 'UXF-b (9)' }, t.P.mbManager.userId);
    assert((t.conn.prepare(`SELECT status FROM sos_coordination_actions WHERE attempt_id = ? AND kind = 'bao_ph_tvv'`).get(bai.id) as any).status === 'done', 'việc đã làm bị đụng');
    /* Case đã XONG bình thường (không Không cần theo dõi, không rút) vẫn tính vào Báo PH. */
    const x = t.conn.prepare(`SELECT cs.attempt_id, cs.skill FROM case_signals cs JOIN sos_cases c ON c.id = cs.case_id WHERE c.status = 'done' AND c.dismiss_reason_code IS NULL AND COALESCE(c.outcome_note, '') NOT LIKE ? AND cs.attempt_id IS NOT NULL LIMIT 1`).get('Không còn hợp lệ%') as any;
    if (x) assert(phoiHopSvc.monBaoPh(x.attempt_id, [x.skill]).includes(x.skill), 'Case xong vẫn tính');
  });
  check('UXF-b (9) · quét chữ: regular.ts gọi monBaoPh; monBoKhoiBaoPh theo lô (một câu), không SQL trong vòng lặp từng môn', () => {
    assert(/dongBoBaoPh\(a, monBaoPh\(a\.id,/.test(doc('server/src/normal/regular.ts')), 'regular.ts');
    const ph = doc('server/src/yThuc/phoiHop.ts');
    assert(/export function monBoKhoiBaoPh\(attemptIds/.test(ph) && /theoLo\(attemptIds,/.test(ph), 'monBoKhoiBaoPh theo lô');
  });

  // ------------------------------------------------------------------ Task 10 · Case G+V không nằm hàng Writing sau khi em lên BE (R5-5, Câu 3 = A)
  const transitionSvc: any = await import('../classes/transition.ts');
  const tongCase = (b: any) => (b.rows as any[]).reduce((n, r) => n + r.cases.length, 0);
  let emDaChuyen: any = null;
  const await_perm: any = await import('../permissions.ts');
  check('UXF-b (10) · R5-5: em FOU có Case G+V / P mở lên BE → Case nằm nhóm "Case bàn giao" với tên môn của lớp cũ, KHÔNG ở hàng Writing/Speaking của BE; Σ Case không đổi; L, R giữ hàng', () => {
    const cand = t.conn.prepare(`SELECT sc.id AS caseId, sc.student_id AS sid, sc.category AS cat, cl.id AS tu, cl.code AS lop, cl.branch_id AS cn
      FROM sos_cases sc JOIN assessment_attempts a ON a.id = sc.attempt_id JOIN classes cl ON cl.id = a.class_id
      JOIN enrollments e ON e.student_id = sc.student_id AND e.status = 'active' AND e.class_id = cl.id
      WHERE sc.status != 'done' AND cl.programme_code = 'FOU' AND sc.category IN ('writing', 'speaking') ORDER BY sc.id`).all() as any[];
    assert(cand.length > 0, 'seed không có em FOU có Case G+V / P mở');
    let ch: any = null;
    for (const c of cand) {
      for (const be of t.conn.prepare(`SELECT id FROM classes WHERE programme_code = 'BE' AND branch_id = ? AND status = 'active' ORDER BY id`).all(c.cn) as any[]) {
        const r = transitionSvc.applyTransition(t.P.admin, { fromClassId: c.tu, effectiveDate: t.TODAY, dongs: [{ studentId: c.sid, huong: 'len_lop', toClassId: be.id }] });
        if (r.done.length) { ch = { ...c, den: be.id }; break; }
      }
      if (ch) break;
    }
    assert(ch, 'không chuyển được em nào FOU → BE');
    emDaChuyen = ch;
    const b = casesSvc.skillSupportBoard(t.P.admin, ch.sid);
    assert(b.chuongTrinh === 'BE', `bảng phải là BE: ${b.chuongTrinh}`);
    const hang = (b.rows as any[]).find((r) => r.category === ch.cat && !r.tuLopTruoc);
    assert(!hang || !hang.cases.some((x: any) => x.id === ch.caseId), `Case ${ch.caseId} vẫn nằm ở hàng ${hang?.short} của BE`);
    const nhom = (b.rows as any[]).find((r) => r.tuLopTruoc && r.cases.some((x: any) => x.id === ch.caseId));
    assert(nhom, 'thiếu nhóm "Case bàn giao"');
    assert(nhom.tuLopTruoc === ch.lop && nhom.short === d.tenMonNgan('FOU', ch.cat), `${nhom.tuLopTruoc} · ${nhom.short}`);
    assert((b.rows as any[]).filter((r) => r.tuLopTruoc).every((r, i, ds) => b.rows.indexOf(r) >= b.rows.length - ds.length), 'nhóm Case bàn giao nằm cuối bảng');
    assert(tongCase(b) >= 1, 'không được mất Case');
    /* L, R: tên môn giống nhau ở FOU và BE → giữ hàng như cũ. */
    for (const r of b.rows as any[]) if (!r.tuLopTruoc && ['listening', 'reading'].includes(r.category)) assert(r.cases.every((x: any) => !x.tuLopTruoc), 'L/R không vào nhóm riêng');
  });
  check('UXF-b (10) · R5-5 PHỦ ĐỊNH: GVCN một lớp BE KHÔNG dạy em đó không đọc được bảng kỹ năng (không thấy thêm Case nào)', () => {
    assert(emDaChuyen, 'phép kiểm trước chưa chuyển em');
    const gv = t.conn.prepare(`SELECT ta.user_id AS id FROM teacher_assignments ta JOIN classes c ON c.id = ta.class_id
      WHERE ta.is_core = 1 AND ta.status = 'active' AND c.programme_code = 'BE' AND ta.class_id != ? AND ta.user_id NOT IN (SELECT user_id FROM teacher_assignments WHERE class_id = ? AND status = 'active') LIMIT 1`).get(emDaChuyen.den, emDaChuyen.den) as any;
    assert(gv, 'seed không có GVCN BE khác');
    const { loadPrincipal } = await_perm;
    let nem = false; try { casesSvc.skillSupportBoard(loadPrincipal(gv.id), emDaChuyen.sid); } catch { nem = true; }
    assert(nem, 'GV không dạy em phải bị chặn');
  });
  check('UXF-b (11) · polish: khung bảng Phân tích GV đủ cao cho một chú thích nổi khi bảng 1–2 hàng (Q18); nhóm "Case bàn giao" có tiêu đề ngữ nghĩa; thẻ Xin ý kiến trên 375 px cho xuống dòng', () => {
    assert(/table-scroll min-h-\[13rem\]/.test(doc('web/src/modules/phanTich/PhanTichGiaoVien.tsx')), 'Q18 min-height');
    assert(/<th colSpan=\{4\} scope="colgroup"[^>]*>\{t\('Case bàn giao'\)\}/.test(doc('web/src/modules/cases/SkillBoard.tsx')) && /<h3[^>]*>\{t\('Case bàn giao'\)\}/.test(doc('web/src/modules/cases/TheKyNang.tsx')), 'tiêu đề nhóm');
    assert(/<DongXinYKien x=\{p\.xinYKien\} ngan=\{ngan\} \/>/.test(doc('web/src/modules/cases/TheKyNang.tsx')), 'thẻ 375 px không cắt dòng Xin ý kiến');
  });
  check('UXF-b (10) · R5-5: không thêm câu SQL theo số Case (lớp của Case đọc cùng câu nạp Case); quét chữ web có nhóm + dòng phụ "từ <lớp>"', () => {
    assert(/AS ct_attempt/.test(doc('server/src/cases/cases.ts')), 'cases.ts: chương trình của lớp Case đọc cùng câu SQL nạp Case (không câu mới)');
    const sb = doc('web/src/modules/cases/SkillBoard.tsx');
    assert(/Case bàn giao/.test(sb) && /tuLopTruoc/.test(sb), 'SkillBoard');
    assert(/Case bàn giao/.test(doc('web/src/modules/cases/TheKyNang.tsx')), 'TheKyNang (thẻ 375 px)');
  });
}
