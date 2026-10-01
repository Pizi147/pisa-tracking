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

  // ------------------------------------------------------------------ Task 4 · Phân tích, nhập điểm, Mục tiêu đã đổi
  const vanDeHvSvc: any = await import('../phanTich/vanDeHv.ts');
  check('UXF-b (4) · Phân tích › Vấn đề HV (cột Case): dòng phụ nói "mở W…", không còn ngày dd/mm', () => {
    const o = vanDeHvSvc.oVanDeHv(t.P.admin, { branchId: null, ct: 'ft', classId: null, soTuan: 8, chiChinh: false, gop: false, dong: 'chua-phan-loai', cot: 'case' });
    const co = o.rows.filter((r: any) => /mở /.test(r.sub));
    assert(o.rows.length > 0 && co.length > 0, 'seed không có Case chưa phân loại có ngày mở');
    for (const r of co) assert(/mở W\d [A-Z]{3}/.test(r.sub) && !/\b\d{2}\/\d{2}\b/.test(r.sub), r.sub);
  });
  check('UXF-b (4) · quét chữ: Mục tiêu đã đổi, hạn ô nhập điểm FT, trang mẫu nói mã tuần', () => {
    assert(/tuanLich\(cy\.targetRevisions\[0\]\.effectiveFrom/.test(doc('web/src/modules/students/StudentDetailPage.tsx')), 'Mục tiêu đã đổi: lần gần nhất');
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
  check('UXF-b (5) · việc "Đánh dấu kỳ vọng đầu ra" (QL): href mở hồ sơ cuộn tới hộp Kết luận khoá (muc=ket-luan-khoa) — kèm lo-trinh của lộ trình có bài Cuối khoá', () => {
    const src = doc('server/src/worklist/mywork.ts');
    assert(/muc: 'ket-luan-khoa'/.test(src), 'mywork.ts chưa gắn muc');
    const items = (myworkSvc.myWork(t.P.mbManager, {}) as any).items.filter((x: any) => x.group === 'ky_vong_dau_ra');
    for (const x of items) assert(/muc=ket-luan-khoa/.test(x.href) && /lo-trinh=\d+/.test(x.href), x.href);
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
    assert(/duongDotTest\(/.test(doc('web/src/modules/test/keHoach/ChipKyNang.tsx')), 'ChipKyNang');
    assert(/duongDotTest\(/.test(doc('web/src/modules/students/BangHocVienLop.tsx')), 'Kết quả gần nhất');
    assert(/duongDotTest\(/.test(doc('web/src/modules/cases/CasePanel.tsx')) || /m\.href/.test(doc('web/src/modules/cases/CasePanel.tsx')), 'lịch sử Case');
    assert(/p\.muc === 'ket-luan-khoa'/.test(doc('web/src/modules/students/StudentDetailPage.tsx')), 'StudentDetailPage đọc muc');
    assert(/id="ket-luan-khoa"/.test(doc('web/src/modules/students/KetLuanKhoa.tsx')), 'KetLuanKhoa thiếu id');
  });
}
