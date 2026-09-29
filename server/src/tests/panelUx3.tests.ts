/**
 * PHÉP KIỂM PR-UX3 — panel Học viên & Lớp theo khuôn chung + badge còn lại (spec 2026-09-23 §1 N-3, N-4, §3).
 * Harness do `run.ts` sở hữu và truyền vào — file này không tự mở database (trừ phép cần dữ liệu thật).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { YThucTestKit } from './yThuc.tests.ts';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const REPO = path.join(ROOT, '..');

/** Bỏ chú thích để phép kiểm nguồn chỉ nhìn mã thật (như `hoSoHocVien.tests.ts`). */
function boChuThich(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:\\])\/\/.*$/gm, '$1');
}
const doc = (rel: string) => fs.readFileSync(path.join(REPO, rel), 'utf8');
export const docSach = (rel: string) => boChuThich(doc(rel));

export async function runPanelUx3Tests(t: YThucTestKit) {
  const { check, assert } = t;
  const d = await import('../../../shared/domain/index.ts');
  console.log('\nPR-UX3 · Panel Học viên & Lớp + badge còn lại');

  // ==================================================================== 1. Bộ chọn ngày / tuần / tháng (hàm thuần)

  check('UX3 (1) · dsNgayGan: "Hôm nay, 14/09" · "Hôm qua, 13/09" · "Thứ Bảy, 12/09"; cùng năm không hiện năm', () => {
    const ds = d.dsNgayGan('2026-09-14', 4);
    assert(ds.length === 4, `số ngày ${ds.length}`);
    assert(ds[0].nhan === 'Hôm nay, 14/09' && ds[0].giaTri === '2026-09-14', JSON.stringify(ds[0]));
    assert(ds[1].nhan === 'Hôm qua, 13/09', JSON.stringify(ds[1]));
    assert(ds[2].nhan === 'Thứ Bảy, 12/09' && ds[3].nhan === 'Thứ Sáu, 11/09', JSON.stringify(ds.slice(2)));
    assert(ds.every((x: any) => !/2026/.test(x.nhan)), 'cùng năm mà vẫn hiện năm');
  });

  check('UX3 (1) · dsNgayGan: qua năm thì có năm; ngày hỏng → rỗng', () => {
    const ds = d.dsNgayGan('2027-01-01', 3);
    assert(ds[1].nhan === 'Hôm qua, 31/12/2026', ds[1].nhan);
    assert(d.dsNgayGan('không phải ngày', 3).length === 0, 'ngày hỏng phải ra rỗng');
  });

  check('UX3 (1) · dsTuan: giá trị = thứ Hai, nhãn qua tuanLich (W4 AUG → W1 SEP), phụ "dd/mm – dd/mm"', () => {
    const ds = d.dsTuan('2026-08-26', 1, 2);
    assert(ds.map((x: any) => x.giaTri).join() === '2026-08-17,2026-08-24,2026-08-31,2026-09-07', ds.map((x: any) => x.giaTri).join());
    assert(ds.map((x: any) => x.nhan).join() === 'W3 AUG,W4 AUG,W1 SEP,W2 SEP', ds.map((x: any) => x.nhan).join());
    assert(ds[2].phu === '31/08 – 06/09', String(ds[2].phu));
  });

  check('UX3 (1) · dsTuan qua năm: tuần thuộc tháng của năm khác hiện kèm năm', () => {
    const ds = d.dsTuan('2026-12-23', 0, 2);
    assert(ds[0].nhan === 'W4 DEC' && ds[2].nhan === 'W1 JAN 2027', ds.map((x: any) => x.nhan).join());
  });

  check('UX3 (1) · cuoiTuan: Chủ nhật; có hôm nay thì cắt về hôm nay (máy chủ chặn tương lai)', () => {
    assert(d.cuoiTuan('2026-09-14') === '2026-09-20', d.cuoiTuan('2026-09-14'));
    assert(d.cuoiTuan('2026-09-14', '2026-09-16') === '2026-09-16', 'tuần hiện tại phải cắt về hôm nay');
    assert(d.cuoiTuan('2026-09-07', '2026-09-16') === '2026-09-13', 'tuần đã qua giữ Chủ nhật');
    assert(d.cuoiTuan('2026-09-16') === '2026-09-20', 'ngày giữa tuần vẫn ra Chủ nhật của tuần đó');
  });

  check('UX3 (1) · dsThang: "11/2026", qua năm sang 01/2027', () => {
    const ds = d.dsThang('2026-11-05', 3);
    assert(ds.map((x: any) => x.giaTri).join() === '2026-11,2026-12,2027-01', ds.map((x: any) => x.giaTri).join());
    assert(ds.map((x: any) => x.nhan).join() === '11/2026,12/2026,01/2027', ds.map((x: any) => x.nhan).join());
  });

  check('UX3 (1) · nhanDotNgan: mock → MT2, giữa khoá, cuối khoá; không có đợt → null', () => {
    assert(d.nhanDotNgan('mock', 2) === 'MT2', 'mock');
    assert(d.nhanDotNgan('progress', 1) === 'Giữa khoá' && d.nhanDotNgan('final', 2) === 'Cuối khoá', 'lớp thường không mang MT');
    assert(d.nhanDotNgan(null, null) === null, 'không có đợt');
  });

  // ==================================================================== 1. Chữ và badge

  check('UX3 (1) · CASE_OUTCOME_LABEL bằng đúng bốn nhãn FOLLOWUP_OUTCOME_LABEL trừ "Chưa đủ dữ liệu"; khoá giữ nguyên', () => {
    const cu = Object.keys(d.CASE_OUTCOME_LABEL).join();
    assert(cu === 'much_better,improved,unchanged,worse', cu);
    const moi = Object.values(d.CASE_OUTCOME_LABEL).join();
    assert(moi === 'Tiến bộ rõ,Tiến bộ một phần,Không tiến bộ,Kém hơn', moi);
    const theoDoi = [d.FOLLOWUP_OUTCOME_LABEL.improved, d.FOLLOWUP_OUTCOME_LABEL.partial, d.FOLLOWUP_OUTCOME_LABEL.unchanged, d.FOLLOWUP_OUTCOME_LABEL.worse].join();
    assert(theoDoi === moi, 'nhãn kết quả Case và kết quả PA phải cùng bộ chữ');
  });

  check('UX3 (1) · PLAN_DECISION_NGAN/NGHIA/NUT_LUU_KET_QUA đủ 5 khoá, nghĩa ≤ 45 ký tự, không "Hãy"', () => {
    for (const k of d.PLAN_DECISIONS) {
      assert(d.PLAN_DECISION_NGAN[k] && d.PLAN_DECISION_NGHIA[k] && d.NUT_LUU_KET_QUA[k], `thiếu nhãn ${k}`);
      assert(d.PLAN_DECISION_NGHIA[k].length <= 45, `nghĩa ${k} dài ${d.PLAN_DECISION_NGHIA[k].length}`);
      assert(!/^Hãy/.test(d.PLAN_DECISION_NGHIA[k]), `nghĩa ${k} mở bằng "Hãy"`);
    }
    assert(d.PLAN_DECISION_NGAN.ask_manager === 'Xin hỗ trợ QL' && d.NUT_LUU_KET_QUA.keep === 'Lưu kết quả', 'chữ chốt');
  });

  check('UX3 (1) · viecTiepTheoCua: động từ + đối tượng, hạn tách riêng; không còn "Cập nhật"/"Xác định nguyên nhân"', () => {
    const v = d.viecTiepTheoCua({
      nhapDiem: { kyNang: ['listening', 'reading'], dot: 'Giữa khoá', quaHan: false },
      cases: [
        { id: 1, topic: 'writing2', state: 'no_plan', nextDue: null, dueOverdue: false },
        { id: 2, topic: 'listening', state: 'working', nextDue: '2026-09-13', dueOverdue: true },
      ],
      homNay: '2026-09-16',
    });
    const nd = v.find((x: any) => /^Nhập điểm/.test(x.viec));
    assert(nd && nd.viec === 'Nhập điểm L, R · Giữa khoá' && nd.han === null, JSON.stringify(nd));
    const dp = v.find((x: any) => /^Đề ra PA/.test(x.viec));
    assert(dp && dp.viec === 'Đề ra PA W2' && dp.quaHanNgay === null, JSON.stringify(dp));
    const gk = v.find((x: any) => /^Ghi kết quả/.test(x.viec));
    assert(gk && gk.viec === 'Ghi kết quả L' && gk.han === 'hết T2 13/09' && gk.quaHanNgay === 3 && gk.tone === 'danger'
      && gk.title === 'Ghi kết quả PA L · hạn hết T2 13/09 · quá hạn 3 ngày', JSON.stringify(gk));
    assert(!/Cập nhật|Xác định nguyên nhân/.test(JSON.stringify(v)), JSON.stringify(v));
  });

  check('UX3 (1) · badgeLop: "{n} bài chờ chấm" (tooltip giữ câu cũ), "{n} HV chờ xếp lớp", "{n} Case mở"', () => {
    const b = d.badgeLop({ needsPlacement: true, canXepLop: 4, missingSkills: [], soBaiChoCham: 9, needScoresTitle: 'Bạn cần chấm: 9 bài',
      soCaseMo: 3, phase: 'running', missingCount: 0 });
    const tatCa = [...b.hien, ...b.an];
    assert(tatCa.find((x: any) => x.key === 'het-khoa')?.nhan === '4 HV chờ xếp lớp', 'het-khoa');
    const cham = tatCa.find((x: any) => x.key === 'cham');
    assert(cham?.nhan === '9 bài chờ chấm' && cham?.title === 'Bạn cần chấm: 9 bài', JSON.stringify(cham));
    assert(tatCa.find((x: any) => x.key === 'case')?.nhan === '3 Case mở', 'case');
    assert(b.hien.length === 2, 'tối đa 2 badge');
  });

  check('UX3 (1) · attemptProgressView: SOS tạm thời (IELTS "SOS 2 tạm thời"; lớp thường "1/3 môn đạt · tạm thời") có tamThoi + tooltip, không ⚠', () => {
    const ielts = d.attemptProgressView({ scored: 2, required: 4, passed: null, sos: 2 });
    assert(ielts.text === 'SOS 2 tạm thời · 2/4 kỹ năng' && ielts.tamThoi === true && ielts.title === 'Tạm thời: 2/4 kỹ năng có điểm', JSON.stringify(ielts));
    const ratio = d.attemptProgressView({ scored: 3, required: 4, passed: null, sos: 2, cheDo: 'ratio' });
    assert(ratio.text === '1/3 môn đạt · tạm thời' && ratio.tamThoi === true && ratio.title === 'Tạm thời: 3/4 môn có điểm', JSON.stringify(ratio));
    const dayDu = d.attemptProgressView({ scored: 4, required: 4, passed: false, sos: 2 });
    assert(!dayDu.tamThoi, 'đủ điểm thì không còn tạm thời');
    assert(!/⚠/.test(JSON.stringify([ielts, ratio, dayDu])), '⚠ chỉ nghĩa quá hạn');
  });

  check('UX3 (1) · ketQuaGanNhat: SOS tạm thời là "SOS 2" + sosTamThoi (không còn chữ "· tạm thời" trong badge)', () => {
    const k = d.ketQuaGanNhat({ mode: 'ielts_band', attemptLabel: 'MT2', sosLevel: 2, provisional: true, scored: 2, required: 4, failed: null,
      overall: null, expectation: 6.5, belowSkills: [], failedSkills: [] });
    assert(k.sos === 'SOS 2' && k.sosTamThoi === true, JSON.stringify(k));
  });

  check('UX3 (1) · tienDoCase: 4 dạng chữ, việc tiếp "Ghi kết quả PA"', () => {
    const f = d.tienDoCase;
    const PA = (o: any = {}) => ({ status: 'started', lastOutcome: null, actionDue: null, actionOverdue: false, pendingApproval: false, approvalDue: null, preset: false, confirmedAt: null, ...o });
    const C = { status: 'in_progress', followUntil: '2026-08-30', followOverdue: false };
    assert(f([], C).text === 'Chưa có PA', 'không PA');
    assert(f([PA()], C).text === '1 PA · chưa có kết quả', 'chưa có kết quả');
    assert(f([PA({ lastOutcome: 'improved' }), PA()], C).text === '2 PA · 1 có kết quả', 'một phần');
    assert(f([PA({ lastOutcome: 'improved' }), PA({ lastOutcome: 'partial' })], C).text === '2 PA · đủ kết quả', 'đủ');
    assert(f([], C).tiep?.text === 'Ghi kết quả PA', 'việc tiếp');
  });

  check('UX3 (1) · Ý thức: cảnh báo và tuổi vi phạm không còn ⚠ (nhắc mềm, không phải quá hạn); HS → HV', () => {
    const w = d.violationWarning(['2026-09-04', '2026-09-08'], '2026-09-14');
    assert(w.message === 'Chưa xử lý 2 vi phạm · cũ nhất 10 ngày', w.message);
    assert(d.violationAgeLabel(9) === '9 ngày' && d.violationAgeLabel(3) === '', 'nhãn tuổi');
    assert(!/⚠/.test(w.message + d.violationAgeLabel(9)), '⚠');
    assert(/HV/.test(d.MEASURE_KIND_LABEL.talk_short) && !/\bHS\b/.test(Object.values(d.MEASURE_KIND_LABEL).join(' ')), 'HS → HV');
  });

  // ==================================================================== 2. Máy chủ: chữ việc, đường dẫn mở ngăn Case, người làm PA

  const { conn } = t;
  const myworkSvc: any = await import('../worklist/mywork.ts');
  const casesSvc: any = await import('../cases/cases.ts');
  const nguoiXem = Object.values(t.P);

  check('UX3 (2) · việc "Ghi kết quả" mở thẳng ngăn Case đúng PA: href có case=, pa=, viec=ghi-ket-qua; nhãn không còn "Cập nhật"', () => {
    let thay = 0;
    for (const who of nguoiXem) {
      const nhom = (myworkSvc.myWork(who, {}).groups as any[]).find((g) => g.key === 'result');
      if (!nhom) continue;
      assert(nhom.label === 'Ghi kết quả PA', `nhãn nhóm: ${nhom.label}`);
      for (const it of nhom.items) {
        assert(!/Cập nhật/.test(`${it.tieuDe} ${it.actionLabel} ${it.statusLabel}`), `${it.key}: còn chữ "Cập nhật"`);
        if (!it.studentId) continue;
        thay++;
        const q = new URL(it.href, 'http://x').searchParams;
        assert(q.get('viec') === 'ghi-ket-qua' && q.get('case') === String(it.caseId) && /^\d+$/.test(q.get('pa') ?? ''), `href ${it.href}`);
      }
    }
    assert(thay >= 1, 'Dữ liệu mẫu phải có ít nhất một việc Ghi kết quả có học viên');
  });

  check('UX3 (2) · duongHoSoHocVien ↔ docThamSoHoSo: khoá "viec" đi và về; giá trị lạ bị bỏ', () => {
    const url = d.duongHoSoHocVien(7, { caseId: 3, paId: 9, viec: 'ghi-ket-qua' });
    assert(url === '/hoc-vien/7?case=3&pa=9&viec=ghi-ket-qua', url);
    const q = new URL(url, 'http://x').searchParams;
    assert(JSON.stringify(d.docThamSoHoSo((k: string) => q.get(k))) === JSON.stringify({ caseId: 3, paId: 9, viec: 'ghi-ket-qua' }), 'đọc lại');
    assert(d.docThamSoHoSo((k: string) => (k === 'viec' ? 'xoa-het' : null)).viec === undefined, 'giá trị lạ phải bị bỏ');
  });

  check('UX3 (2) · caseDetail: mỗi PA có khoá performerUserId (số hoặc null)', () => {
    const row = conn.prepare(
      `SELECT c.id FROM sos_cases c JOIN case_interventions iv ON iv.case_id = c.id AND iv.performer_user_id IS NOT NULL LIMIT 1`,
    ).get() as { id: number } | undefined;
    assert(row, 'Dữ liệu mẫu phải có Case có PA với người làm là tài khoản');
    const detail = casesSvc.caseDetail(t.P.admin, row!.id) as any;
    assert(detail.interventions.length > 0 && detail.interventions.every((i: any) => 'performerUserId' in i), 'thiếu khoá performerUserId');
    assert(detail.interventions.some((i: any) => typeof i.performerUserId === 'number'), 'phải có ít nhất một người làm là tài khoản');
  });

  // ==================================================================== 3-5. Ngăn Case một panel, Ghi kết quả, bảng kỹ năng (kiểm nguồn)

  check('UX3 (3) · NganCase là MỘT panel: không <Modal, không Lộ trình ${…}, không fmtDate; giao kèo data-pa-id giữ ở CasePanel', () => {
    const ngan = docSach('web/src/modules/students/NganCase.tsx');
    const thanCase = docSach('web/src/modules/cases/CasePanel.tsx');
    for (const [ten, src] of [['NganCase.tsx', ngan], ['CasePanel.tsx', thanCase]] as const) {
      assert(!/<Modal\b/.test(src), `${ten} còn <Modal`);
      assert(!/Lộ trình \$\{/.test(src), `${ten} còn "Lộ trình \${…}"`);
      assert(!/fmtDate\(/.test(src), `${ten} còn fmtDate(`);
    }
    assert(/data-pa-id=\{/.test(thanCase), 'CasePanel mất data-pa-id (giao kèo với Hành trình)');
    assert((ngan.match(/<KhungPanel\b/g) ?? []).length >= 1 && /quayLai/.test(ngan), 'NganCase phải dựng bằng KhungPanel có dòng quay lại');
  });

  check('UX3 (4) · Ghi kết quả / Thêm PA / Hoàn thành / Trả lời: panel, không <Modal, không type="date", không khongDoi=, không "Xin hỗ trợ từ Quản lý"', () => {
    for (const f of ['web/src/modules/cases/CapNhatTuan.tsx', 'web/src/modules/cases/ThaoTacCase.tsx', 'web/src/modules/cases/CasePanel.tsx']) {
      const src = docSach(f);
      assert(!/<Modal\b/.test(src), `${f} còn <Modal`);
      assert(!/type="date"/.test(src), `${f} còn type="date"`);
      assert(!/khongDoi=/.test(src), `${f} còn khongDoi=`);
      assert(!/Xin hỗ trợ từ Quản lý/.test(src), `${f} còn "Xin hỗ trợ từ Quản lý"`);
      assert(!/fmtDate\(/.test(src), `${f} còn fmtDate(`);
    }
    const tt = docSach('web/src/modules/cases/ThaoTacCase.tsx');
    assert(/CASE_OUTCOMES\.map/.test(tt) && /CASE_OUTCOME_LABEL\[o\]/.test(tt), 'bốn nút Hoàn thành phải lấy từ CASE_OUTCOME_LABEL (nguồn duy nhất)');
    assert(!/ResultDialog|ApprovalDialog|OutcomeDialog|ActionDialog/.test(docSach('web/src/modules/cases/CasePanel.tsx')), 'CasePanel còn hộp thoại cũ');
  });

  check('UX3 (5) · SkillBoard: bảng hàng lớn/nhỏ, không form/hộp thoại trong trang, không fmtDate/"Cập nhật PA"; KetQuaDot không ⚠', () => {
    const sb = docSach('web/src/modules/cases/SkillBoard.tsx');
    for (const cam of ['CapNhatTuanForm', 'ActionDialog', 'OutcomeDialog', 'loai="cap-nhat-pa"', 'fmtDate(', 'Cập nhật PA']) {
      assert(!sb.includes(cam), `SkillBoard còn "${cam}"`);
    }
    assert(/<HangNhom\b/.test(sb) && /<HangCon\b/.test(sb) && /<thead>/.test(sb), 'SkillBoard phải dùng HangNhom/HangCon và tiêu đề cột một lần');
    assert(/onMoCase/.test(sb), 'SkillBoard mở ngăn Case qua onMoCase');
    assert(!doc('web/src/ui/KetQuaDot.tsx').includes("'⚠'"), "KetQuaDot còn '⚠'");
  });

  // ==================================================================== 6-8. Tạo Case, Ý thức, Học viên & Lớp

  check('UX3 (6) · QuickReport: chữ ký props giữ đủ khoá cũ (DongTinHieu dùng) + thêm `lop`', () => {
    const src = doc('web/src/modules/cases/QuickReport.tsx');
    const m = /export function QuickReport\(\{([\s\S]*?)\}: \{/.exec(src);
    assert(m, 'không đọc được chữ ký QuickReport');
    const khoa = m![1].split(',').map((x) => x.trim()).filter(Boolean);
    for (const k of ['open', 'onClose', 'studentId', 'studentName', 'cycleId', 'onDone', 'signal', 'students', 'onPickStudent', 'lop']) {
      assert(khoa.includes(k), `QuickReport mất prop "${k}"`);
    }
  });

  check('UX3 (6) · mucQuanLyHocVien: HV lớp thường (GVCN) có Lộ trình tiếp theo + Chuyển lớp, KHÔNG Kết luận lộ trình; FT (QL) có; GVBM không có mục nào', () => {
    const quyenGvcn = { ghiLoTrinhTiep: true, chuyenLop: true, tamDung: true, quayLai: false, ketThuc: true, luuTru: false, boLuuTru: false };
    const thuong = d.mucQuanLyHocVien({ canEdit: true, lopHoc: { quyen: quyenGvcn }, cycle: { ratio: true }, status: 'active' }).map((x: any) => x.key);
    assert(thuong.includes('lo-trinh-tiep') && thuong.includes('chuyen-lop') && !thuong.includes('outcome') && !thuong.includes('lo-trinh'), thuong.join());
    const quyenQl = { ...quyenGvcn, ghiLoTrinhTiep: false, luuTru: true };
    const ft = d.mucQuanLyHocVien({ canEdit: true, lopHoc: { quyen: quyenQl }, cycle: { ratio: false }, status: 'active' }).map((x: any) => x.key);
    assert(ft.includes('outcome') && ft.includes('lo-trinh') && ft.includes('chuyen-lop') && ft.includes('luu-tru'), ft.join());
    const gvbm = d.mucQuanLyHocVien({ canEdit: false, lopHoc: null, cycle: { ratio: false }, status: 'active' });
    assert(gvbm.length === 0, `GVBM có mục: ${JSON.stringify(gvbm)}`);
    assert(d.mucQuanLyHocVien({ canEdit: false, lopHoc: { quyen: { ...quyenQl, quayLai: true } }, cycle: null, status: 'inactive' }).some((x: any) => x.key === 'quay-lai'), 'HV tạm dừng phải có Quay lại học');
  });

  // ==================================================================== 10. Quét nguồn một lần: mọi panel UX3 theo một khuôn

  const PANEL_UX3 = [
    'cases/QuickReport', 'cases/CasePanel', 'cases/CapNhatTuan', 'cases/ThaoTacCase', 'cases/SkillBoard',
    'students/NganCase', 'students/ChuyenLopPanel', 'students/LoTrinhTiepPanel', 'students/StudentManagePanel',
    'yThuc/RecordViolationPanel', 'yThuc/PhuongAnPanel', 'yThuc/CreateMeasurePanel', 'yThuc/ConfirmMeasurePanel', 'yThuc/XemPhuongAnPanel',
    'classes/TeacherAssignPanel',
  ].map((f) => `web/src/modules/${f}.tsx`);
  const CAM: [string, RegExp][] = [
    ['<Modal', /<Modal\b/], ['<Drawer', /<Drawer\b/], ['type="date"', /type="date"/], ['type="month"', /type="month"/], ['max-w-{sm..7xl} (bề rộng hộp cũ)', /max-w-(xs|sm|md|lg|xl|[2-7]xl)\b/],
    ['SectionNote', /SectionNote/], ['fmtDate(', /fmtDate\(/], ['(B05)', /\(B05\)/], ['[khoá]', /\[khoá\]/], ['HS', /\bHS\b/],
    ['Lộ trình ${', /Lộ trình \$\{/], ['Đã tốt hơn hẳn', /Đã tốt hơn hẳn/], ['Cập nhật kết quả', /Cập nhật kết quả/],
    ['Lưu ý bàn giao', /Lưu ý bàn giao/], ['← Chọn việc khác', /← Chọn việc khác/],
  ];

  check('UX3 (10) · 15 panel UX3: không hộp giữa màn, không ô lịch trình duyệt, không chữ dev/cũ (một lần quét)', () => {
    const vi: string[] = [];
    for (const f of PANEL_UX3) {
      const src = docSach(f);
      for (const [ten, re] of CAM) if (re.test(src)) vi.push(`${f}: ${ten}`);
    }
    assert(vi.length === 0, `Còn ${vi.length} chỗ:\n    ${vi.join('\n    ')}`);
  });

  check('UX3 (10) · mọi placeholder ở panel UX3: "Ví dụ: …" (≤ 45 ký tự), "Gõ …", "Chọn …" hoặc "Tìm …"', () => {
    const sai: string[] = [];
    for (const f of PANEL_UX3) {
      for (const m of docSach(f).matchAll(/placeholder="([^"]*)"/g)) {
        if (!/^(Ví dụ: .{1,45}|Gõ .*|Chọn .*|Tìm .*)$/.test(m[1])) sai.push(`${f}: "${m[1]}"`);
      }
    }
    assert(sai.length === 0, `Placeholder sai luật:\n    ${sai.join('\n    ')}`);
  });

  check('UX3 (7) · nhắc Ý thức không ⚠: HangTab, CanhBaoYThuc, ClassYThucCard, StudentYThucSection', () => {
    for (const f of ['web/src/ui/HangTab.tsx', 'web/src/modules/classes/CanhBaoYThuc.tsx', 'web/src/modules/yThuc/ClassYThucCard.tsx',
      'web/src/modules/yThuc/StudentYThucSection.tsx']) {
      assert(!docSach(f).includes('⚠'), `${f} còn ⚠`);
    }
  });

  // ==================================================================== Biên và hồi quy (thêm sau khi bấm thử)

  check('UX3 (1) · dsNgayGan/dsThang: số lượng 0 → rỗng; dsTuan(0, 0) đúng MỘT tuần = thứ Hai của tuần hôm nay', () => {
    assert(d.dsNgayGan('2026-09-14', 0).length === 0 && d.dsThang('2026-09-14', 0).length === 0, 'rỗng');
    const t = d.dsTuan('2026-09-17', 0, 0);
    assert(t.length === 1 && t[0].giaTri === '2026-09-14', JSON.stringify(t));
  });

  check('UX3 (1) · cuoiTuan: đưa vào Chủ nhật thì giữ nguyên (không nhảy sang tuần sau)', () => {
    assert(d.cuoiTuan('2026-09-20') === '2026-09-20', d.cuoiTuan('2026-09-20'));
    assert(d.cuoiTuan('2026-09-20', '2026-09-30') === '2026-09-20', 'hôm nay sau Chủ nhật thì không cắt');
  });

  check('UX3 (1) · nhanDotNgan: loại lạ vẫn ra chữ ("Bài kiểm tra"), không ném lỗi; mock không có số → null', () => {
    assert(d.nhanDotNgan('x_la', 3) === 'Bài kiểm tra', String(d.nhanDotNgan('x_la', 3)));
    assert(d.nhanDotNgan('mock', null) === null, 'mock không số');
  });

  check('UX3 (1) · viecTiepTheoCua: Case đã xong và Case không hạn không sinh dòng; danh sách xếp đỏ → vàng → xanh', () => {
    const v = d.viecTiepTheoCua({
      nhapDiem: null,
      cases: [
        { id: 1, topic: 'reading', state: 'done', nextDue: '2026-09-01', dueOverdue: true },
        { id: 2, topic: 'speaking', state: 'working', nextDue: null, dueOverdue: false },
        { id: 3, topic: 'listening', state: 'working', nextDue: '2026-09-20', dueOverdue: false },
        { id: 4, topic: 'writing2', state: 'no_plan', nextDue: null, dueOverdue: false },
        { id: 5, topic: 'reading', state: 'working', nextDue: '2026-09-10', dueOverdue: true },
      ],
      homNay: '2026-09-16',
    });
    assert(v.map((x: any) => x.tone).join() === 'danger,warn,info', v.map((x: any) => x.tone).join());
    assert(v.length === 3 && v[0].viec === 'Ghi kết quả R' && v[0].quaHanNgay === 6, JSON.stringify(v));
  });

  check('UX3 (1) · tienDoCase: PA đã xong không tính là việc tiếp; Case đã xong không có việc tiếp', () => {
    const PA = (o: any = {}) => ({ status: 'started', lastOutcome: null, actionDue: null, actionOverdue: false, pendingApproval: false, approvalDue: null, preset: false, confirmedAt: null, ...o });
    const C = { status: 'in_progress', followUntil: null as string | null, followOverdue: false };
    assert(d.tienDoCase([PA({ status: 'completed', actionDue: '2026-08-01', actionOverdue: true })], C).tiep === null, 'PA xong vẫn cho việc tiếp');
    assert(d.tienDoCase([PA({ actionDue: '2026-08-01' })], { ...C, status: 'done' }).tiep === null, 'Case xong vẫn cho việc tiếp');
  });

  check('UX3 (1) · attemptProgressView: chưa có điểm nào → không tamThoi; SOS 0 chưa đủ điểm → không tamThoi', () => {
    assert(!d.attemptProgressView({ scored: 0, required: 4, passed: null, sos: null }).tamThoi, 'chưa có điểm');
    assert(!d.attemptProgressView({ scored: 2, required: 4, passed: null, sos: 0 }).tamThoi, 'SOS 0');
  });

  check('UX3 (1) · PLAN_DECISION_NGAN ngắn (≤ 16 ký tự) và các nhãn nút lưu khác nhau từng quyết định', () => {
    for (const k of d.PLAN_DECISIONS) assert(d.PLAN_DECISION_NGAN[k].length <= 16, `${k}: ${d.PLAN_DECISION_NGAN[k]}`);
    assert(new Set(d.PLAN_DECISIONS.map((k) => d.NUT_LUU_KET_QUA[k])).size === 5, 'nút lưu trùng nhau');
  });

  check('UX3 (2) · duongHoSoHocVien: không truyền viec thì URL không có "viec" (hồi quy các đường dẫn cũ)', () => {
    assert(d.duongHoSoHocVien(7, { caseId: 3, paId: 9 }) === '/hoc-vien/7?case=3&pa=9', d.duongHoSoHocVien(7, { caseId: 3, paId: 9 }));
    assert(d.duongHoSoHocVien(7) === '/hoc-vien/7', 'hồ sơ trơn');
  });

  check('UX3 (6) · mucQuanLyHocVien: thứ tự PR-LT (Thông tin đầu, Lưu trữ cuối); HV đã kết thúc học không còn Tạm dừng/Kết thúc', () => {
    const q = { ghiLoTrinhTiep: true, chuyenLop: true, tamDung: true, quayLai: false, ketThuc: true, luuTru: true, boLuuTru: false };
    const ds = d.mucQuanLyHocVien({ canEdit: true, lopHoc: { quyen: q }, cycle: { ratio: false }, status: 'active' }).map((x: any) => x.key);
    assert(ds[0] === 'info' && ds[ds.length - 1] === 'luu-tru', ds.join());
    assert(ds.indexOf('lo-trinh-tiep') < ds.indexOf('chuyen-lop') && ds.indexOf('chuyen-lop') < ds.indexOf('outcome'), ds.join());
    const xong = d.mucQuanLyHocVien({ canEdit: true, lopHoc: { quyen: q }, cycle: null, status: 'finished' }).map((x: any) => x.key);
    assert(!xong.includes('tam-dung') && !xong.includes('ket-thuc'), xong.join());
    assert(d.mucQuanLyHocVien({ canEdit: true, lopHoc: null, cycle: null, status: 'active' }).map((x: any) => x.nhan).join() === 'Thông tin học viên', 'chỉ có Thông tin');
  });

  check('UX3 (3) · ChonNgay.tsx không đọc đồng hồ trình duyệt (new Date/Date.now) và không dựng ô lịch', () => {
    const src = docSach('web/src/ui/ChonNgay.tsx');
    assert(!/new Date\(\)|Date\.now\(/.test(src), 'đọc đồng hồ trình duyệt');
    assert(!/type="date"|type="month"/.test(src), 'ô lịch trình duyệt');
  });

  check('UX3 (3) · ThanCase: "ghi trễ" (mờ), không "cập nhật trễ"; ngày qua hàm chung (không fmtDate)', () => {
    const src = docSach('web/src/modules/cases/CasePanel.tsx');
    assert(/ghi trễ/.test(src) && !/cập nhật trễ/.test(src), 'nhãn trễ');
    assert(!/fmtDate|toLocaleDateString/.test(src), 'ngày không qua hàm chung');
  });

  check('UX3 (5) · SkillBoard: hạn ghi kết quả chỉ từ actionDue (followupDue là ngày dự kiến kết thúc, không phải hạn — F11)', () => {
    const src = docSach('web/src/modules/cases/SkillBoard.tsx');
    const m = /function nextStepOf[\s\S]*?\r?\n}\r?\n/.exec(src);
    assert(m, 'không thấy nextStepOf');
    assert(!/followupDue/.test(m![0]), 'nextStepOf dùng followupDue làm hạn');
    /* PR-SOS (K3-07): việc tiếp + hạn do máy chủ tính (`viecTiepCuaCase` — hạn ghi kết quả từ actionDue). */
    assert(/viecTiep/.test(m![0]), 'nextStepOf phải dùng việc tiếp v4 (hạn từ actionDue ở máy chủ)');
  });

  check('UX3 (4) · Ghi kết quả: không gửi người thực hiện khi không đổi (payload adjust chỉ có trường đã đổi)', () => {
    const src = docSach('web/src/modules/cases/CapNhatTuan.tsx');
    assert(/nguoiDoi \? nguoiThanhPayload\(nguoi\) : \{\}/.test(src), 'adjust phải chỉ gửi người khi đổi');
    assert(/description: descChanged \? desc : undefined/.test(src) && /followupDue: dueChanged \? due : undefined/.test(src), 'adjust gửi cả trường không đổi');
  });

  check('UX3 (7) · Ý thức: câu nhắc dùng CÙNG MỘT hàm ở ba nơi (không câu viết tay có ⚠ ở web)', () => {
    for (const f of ['web/src/modules/yThuc/ClassYThucCard.tsx', 'web/src/modules/yThuc/StudentYThucSection.tsx']) {
      assert(!/replace\(\/\^⚠/.test(doc(f)), `${f} còn cắt "⚠" khỏi câu máy chủ`);
    }
  });

  check('UX3 (8) · ChuyenLopPanel: chuyển lớp hỏi lại MỘT câu qua ConfirmDialog và không gửi effectiveDate khi chọn tuần này', () => {
    const src = docSach('web/src/modules/students/ChuyenLopPanel.tsx');
    assert(/<ConfirmDialog/.test(src) && /Chuyển \$\{studentName/.test(src), 'thiếu hộp xác nhận một câu');
    assert(/effectiveDate: tuan && tuan !== tuanNay \? tuan : undefined/.test(src), 'tuần này phải không gửi effectiveDate');
  });

  // ==================================================================== 11. ⋮ Hồ sơ lớp › Xoá lớp / Kết thúc lớp (chỉ Quản trị hệ thống)

  const xoaKetThuc: any = await import('../classes/xoaKetThucLop.ts');
  const intakeSvc: any = await import('../classes/intake.ts');
  const classesSvc: any = await import('../classes/classes.ts');
  const luuTruSvc: any = await import('../classes/luuTru.ts');
  const mbId = (conn.prepare(`SELECT id FROM branches WHERE code = 'MB'`).get() as { id: number }).id;
  let soLop = 0;
  const taoLopTrong = (): { id: number; ma: string } => {
    soLop += 1;
    const ma = `MB-UX3 ${soLop}`;
    const c = intakeSvc.createClass(t.P.admin, { code: ma, branchId: mbId, kind: 'FOU', isFastTrack: false, startDate: '2026-08-03' }) as { id: number };
    return { id: c.id, ma };
  };
  const themHocVien = (classId: number, status: string) => {
    const sid = Number(conn.prepare(
      `INSERT INTO students (student_code, full_name, normalized_name, branch_id, status, created_at) VALUES (?,?,?,?, 'active', '2026-09-01')`,
    ).run(`PISA-UX3-${classId}-${status}`, `HV UX3 ${classId}`, `hv ux3 ${classId}`, mbId).lastInsertRowid);
    conn.prepare(`INSERT INTO enrollments (student_id, class_id, status, started_at, created_at) VALUES (?,?,?, '2026-08-03', '2026-09-01')`)
      .run(sid, classId, status);
    return sid;
  };
  const demLop = (id: number) => (conn.prepare('SELECT COUNT(*) n FROM classes WHERE id = ?').get(id) as { n: number }).n;
  const ftId = (conn.prepare(`SELECT id FROM classes WHERE code = 'MB FT 101'`).get() as { id: number }).id;

  check('UX3 (11) · QL và GV gọi Xem / Xoá / Kết thúc lớp đều 403 (máy chủ kiểm, không chỉ ẩn nút)', () => {
    const l = taoLopTrong();
    for (const who of [t.P.mbManager, t.P.coreTeacher, t.P.subjectTeacher]) {
      t.assertThrows(() => xoaKetThuc.xemXoaKetThuc(who, l.id), /Quản trị hệ thống/, 'xem');
      t.assertThrows(() => xoaKetThuc.xoaLop(who, l.id, { maLop: l.ma }), /Quản trị hệ thống/, 'xoá');
      t.assertThrows(() => xoaKetThuc.ketThucLop(who, l.id), /Quản trị hệ thống/, 'kết thúc');
    }
    assert(demLop(l.id) === 1, 'lớp phải còn nguyên sau các lần bị từ chối');
  });

  check('UX3 (11) · viewer.coTheXoaKetThuc: Quản trị hệ thống true; Quản lý và GV false', () => {
    const l = taoLopTrong();
    assert(classesSvc.classOverview(t.P.admin, l.id).viewer.coTheXoaKetThuc === true, 'QT');
    assert(classesSvc.classOverview(t.P.mbManager, l.id).viewer.coTheXoaKetThuc === false, 'QL');
    assert(classesSvc.classOverview(t.P.coreTeacher, ftId).viewer.coTheXoaKetThuc === false, 'GV');
  });

  check('UX3 (11) · xemXoaKetThuc: lớp trống → coTheXoa; lớp có dữ liệu → không xoá được, có lý do', () => {
    const l = taoLopTrong();
    const trong = xoaKetThuc.xemXoaKetThuc(t.P.admin, l.id);
    assert(trong.coTheXoa === true && trong.coDuLieu === false && trong.ma === l.ma, JSON.stringify(trong));
    const co = xoaKetThuc.xemXoaKetThuc(t.P.admin, ftId);
    assert(co.coTheXoa === false && co.coDuLieu === true && co.dangGan.length > 0, JSON.stringify(co));
  });

  check('UX3 (11) · Xoá lớp trống: sai mã → 400; đúng mã → dòng lớp + phân công + kỹ năng mất, có audit "class.delete"', () => {
    const l = taoLopTrong();
    const admin = (conn.prepare(`SELECT id FROM users WHERE id = ?`).get(t.P.admin.userId) as { id: number }).id;
    conn.prepare(`INSERT INTO teacher_assignments (user_id, class_id, skill, is_core, effective_from, status, created_at) VALUES (?,?,NULL,1,'2026-09-01','active','2026-09-01')`)
      .run(admin, l.id);
    t.assertThrows(() => xoaKetThuc.xoaLop(t.P.admin, l.id, { maLop: 'sai ma' }), /Gõ lại đúng mã lớp/, 'sai mã');
    assert(demLop(l.id) === 1, 'sai mã mà lớp đã mất');
    xoaKetThuc.xoaLop(t.P.admin, l.id, { maLop: l.ma });
    assert(demLop(l.id) === 0, 'lớp vẫn còn');
    const dem = (b: string) => (conn.prepare(`SELECT COUNT(*) n FROM ${b} WHERE class_id = ?`).get(l.id) as { n: number }).n;
    assert(dem('teacher_assignments') === 0 && dem('class_skills') === 0, 'phân công / kỹ năng lớp còn sót');
    const au = conn.prepare(`SELECT actor_user_id, entity_label FROM audit_logs WHERE action = 'class.delete' AND entity_id = ?`).get(l.id) as any;
    assert(au && au.actor_user_id === t.P.admin.userId && au.entity_label === l.ma, `audit: ${JSON.stringify(au)}`);
  });

  check('UX3 (11) · Xoá lớp có dữ liệu → 400 "dùng Kết thúc lớp": lớp có HV từng học; lớp có lượt Test', () => {
    const l = taoLopTrong();
    themHocVien(l.id, 'withdrawn');
    t.assertThrows(() => xoaKetThuc.xoaLop(t.P.admin, l.id, { maLop: l.ma }), /Kết thúc lớp/, 'HV từng học');
    assert(demLop(l.id) === 1, 'lớp có HV từng học bị xoá');
    t.assertThrows(() => xoaKetThuc.xoaLop(t.P.admin, ftId, { maLop: 'MB FT 101' }), /Kết thúc lớp/, 'lớp có Test');
    assert(demLop(ftId) === 1, 'lớp có Test bị xoá');
  });

  check('UX3 (11) · Kết thúc lớp còn HV đang học → 400 kèm số HV; không còn ai → finished + finished_at hôm nay + vào Lưu trữ + audit', () => {
    const l = taoLopTrong();
    themHocVien(l.id, 'active');
    t.assertThrows(() => xoaKetThuc.ketThucLop(t.P.admin, l.id), /Còn 1 học viên đang học/, 'còn HV');
    assert((conn.prepare('SELECT status FROM classes WHERE id = ?').get(l.id) as any).status === 'active', 'lớp bị đóng dù còn HV');
    conn.prepare(`UPDATE enrollments SET status = 'transferred' WHERE class_id = ?`).run(l.id);
    const kq = xoaKetThuc.ketThucLop(t.P.admin, l.id);
    const c = conn.prepare('SELECT status, finished_at FROM classes WHERE id = ?').get(l.id) as any;
    assert(c.status === 'finished' && c.finished_at === kq.finishedAt, JSON.stringify(c));
    assert(luuTruSvc.danhSachLuuTru(t.P.admin, {}).lop.some((x: any) => x.id === l.id), 'lớp phải có ở khu Lưu trữ');
    const au = conn.prepare(`SELECT actor_user_id FROM audit_logs WHERE action = 'class.finished' AND entity_id = ?`).get(l.id) as any;
    assert(au && au.actor_user_id === t.P.admin.userId, 'thiếu audit kết thúc lớp');
    t.assertThrows(() => xoaKetThuc.ketThucLop(t.P.admin, l.id), /đã kết thúc/, 'kết thúc hai lần');
  });

  check('UX3 (11) · Kết thúc lớp rỗng cũng được (finished + Lưu trữ); panel web: gõ lại mã mới bật nút đỏ, menu có đường kẻ trước Xoá/Kết thúc', () => {
    const l = taoLopTrong();
    xoaKetThuc.ketThucLop(t.P.admin, l.id);
    assert(luuTruSvc.danhSachLuuTru(t.P.admin, {}).lop.some((x: any) => x.id === l.id), 'lớp rỗng phải vào Lưu trữ');
    const pn = docSach('web/src/modules/classes/XoaKetThucLopPanel.tsx');
    assert(/disabled=\{busy \|\| !khop \|\| !!chan\}/.test(pn) && /btn btn-danger/.test(pn), 'nút Xoá lớp phải mờ tới khi gõ đúng mã');
    assert(!/<Modal\b|type="date"/.test(pn), 'panel xoá/kết thúc phải là KhungPanel');
    const dt = docSach('web/src/modules/classes/DauTrangLop.tsx');
    assert(/keTruoc: true/.test(dt) && /coTheXoaKetThuc/.test(dt), 'menu ⋮ hồ sơ lớp thiếu mục Xoá/Kết thúc sau đường kẻ');
  });

  void docSach;
}
