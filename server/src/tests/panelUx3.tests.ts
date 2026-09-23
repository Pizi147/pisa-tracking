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
const docSach = (rel: string) => boChuThich(doc(rel));

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
    assert(gk && gk.viec === 'Ghi kết quả L' && gk.han === 'CN 13/09' && gk.quaHanNgay === 3 && gk.tone === 'danger'
      && gk.title === 'Ghi kết quả PA L · hạn CN 13/09 · quá hạn 3 ngày', JSON.stringify(gk));
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

  check('UX3 (1) · attemptProgressView: SOS tạm thời (IELTS "SOS 2"; lớp thường "Đạt 1/3 môn") có tamThoi + tooltip, không ⚠', () => {
    const ielts = d.attemptProgressView({ scored: 2, required: 4, passed: null, sos: 2 });
    assert(ielts.text === 'SOS 2' && ielts.tamThoi === true && ielts.title === 'Tạm thời: 2/4 kỹ năng có điểm', JSON.stringify(ielts));
    const ratio = d.attemptProgressView({ scored: 3, required: 4, passed: null, sos: 2, cheDo: 'ratio' });
    assert(ratio.text === 'Đạt 1/3 môn' && ratio.tamThoi === true && ratio.title === 'Tạm thời: 3/4 môn có điểm', JSON.stringify(ratio));
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
      assert(nhom.label === 'Ghi kết quả', `nhãn nhóm: ${nhom.label}`);
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

  void docSach;
}
